// Input: MCP Server 的 stdio 连接配置（子进程 JSON-RPC）
// Output: 通过 MCP Tool 调用获取 IM 数据，转为统一类型
// Pos: connectors/ MCP 桥接层，各平台 mcpBridge 继承此基类

import { spawn, type ChildProcess } from 'child_process'
import { logForDebugging } from 'src/utils/debug.js'
import type {
  ConnectorConfig,
  ConnectorMode,
  ConnectorPlatform,
  ConnectorStatus,
  ConnectorCapability,
  IMConnector,
  IMMessage,
  MessageQuery,
  CalendarEvent,
  IMDocument,
  IMContact,
  IMTask,
  IMApproval,
  UnreadSummary,
  PandaNotification,
} from './types.js'

// ─── 简化版 JSON-RPC（不引入 @modelcontextprotocol/sdk 新依赖） ───

interface JsonRpcRequest {
  jsonrpc: '2.0'
  id: number
  method: string
  params?: Record<string, unknown>
}

interface JsonRpcResponse {
  jsonrpc: '2.0'
  id: number
  result?: unknown
  error?: { code: number; message: string; data?: unknown }
}

/**
 * MCP 桥接通用基类。
 *
 * 通过 child_process 启动 MCP Server 进程，使用 JSON-RPC over stdio 通信。
 * 子类只需实现 getMCPCommand() 和 toolMapping() 即可完成平台接入。
 */
export abstract class MCPBridgeConnector implements IMConnector {
  abstract readonly platform: ConnectorPlatform
  abstract readonly interfaceVersion: string

  protected process: ChildProcess | null = null
  protected _status: ConnectorStatus = 'disconnected'
  protected _capabilities = new Set<ConnectorCapability>()
  protected config: ConnectorConfig | null = null

  private _requestId = 0
  private _pendingRequests = new Map<number, {
    resolve: (value: unknown) => void
    reject: (reason: Error) => void
    timer: ReturnType<typeof setTimeout>
  }>()
  private _buffer = ''

  get status(): ConnectorStatus { return this._status }
  get capabilities(): ReadonlySet<ConnectorCapability> { return this._capabilities }
  get mode(): ConnectorMode { return 'mcp' }

  /**
   * 子类提供 MCP Server 启动命令。
   * 若配置中有 mcpCommand 则使用配置值，否则子类提供默认值。
   */
  protected abstract getMCPCommand(): { command: string; args: string[] }

  /**
   * 子类定义 MCP Tool 名到数据转换函数的映射。
   */
  protected abstract toolMapping(): Record<string, {
    capability: ConnectorCapability
    transform: (result: any) => any
  }>

  async initialize(config: ConnectorConfig): Promise<void> {
    this.config = config
    this._status = 'connecting'

    try {
      // 确定启动命令
      const defaultCmd = this.getMCPCommand()
      let command: string
      let args: string[]

      if (config.mcpCommand) {
        const parts = config.mcpCommand.split(' ')
        command = parts[0]
        args = [...parts.slice(1), ...(config.mcpArgs || [])]
      } else {
        command = defaultCmd.command
        args = [...defaultCmd.args, ...(config.mcpArgs || [])]
      }

      // 启动 MCP Server 子进程
      this.process = spawn(command, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, ...(config.mcpEnv || {}) },
      })

      // 监听 stdout（JSON-RPC 响应）
      this.process.stdout?.on('data', (chunk: Buffer) => {
        this._handleData(chunk.toString('utf-8'))
      })

      // 监听 stderr（调试日志）
      this.process.stderr?.on('data', (chunk: Buffer) => {
        logForDebugging(`[MCPBridge:${this.platform}:stderr] ${chunk.toString('utf-8').trim()}`)
      })

      // 进程退出处理
      this.process.on('exit', (code) => {
        logForDebugging(`[MCPBridge:${this.platform}] 进程退出, code=${code}`)
        this._status = 'disconnected'
        this._rejectAllPending(new Error(`MCP Server 进程退出 (code=${code})`))
      })

      this.process.on('error', (err) => {
        logForDebugging(`[MCPBridge:${this.platform}] 进程错误: ${err.message}`)
        this._status = 'error'
        this._rejectAllPending(err)
      })

      // 发送 initialize 请求
      await this._sendRpc('initialize', {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: `panda-${this.platform}-connector`, version: '1.0.0' },
      })

      // 发现 MCP Server 暴露的 Tools，匹配到 capabilities
      const toolsResult = await this._sendRpc('tools/list', {}) as { tools?: Array<{ name: string }> }
      const mapping = this.toolMapping()
      for (const tool of toolsResult?.tools || []) {
        const mapped = mapping[tool.name]
        if (mapped) {
          this._capabilities.add(mapped.capability)
        }
      }

      this._status = 'connected'
      logForDebugging(`[MCPBridge:${this.platform}] 已连接, capabilities: ${[...this._capabilities].join(', ')}`)
    } catch (e) {
      this._status = 'error'
      logForDebugging(`[MCPBridge:${this.platform}] 连接失败: ${(e as Error).message}`)
      // 清理子进程
      this._killProcess()
      throw e
    }
  }

  async healthCheck(): Promise<boolean> {
    if (!this.process || this._status !== 'connected') return false
    try {
      await this._sendRpc('ping', {})
      return true
    } catch (e) {
      logForDebugging(`[MCPBridge:${this.platform}] healthCheck 失败: ${(e as Error).message}`)
      this._status = 'error'
      return false
    }
  }

  async dispose(): Promise<void> {
    try {
      this._rejectAllPending(new Error('Connector disposing'))
      this._killProcess()
    } catch { /* 静默降级 */ }
    this.process = null
    this._status = 'disconnected'
    this._capabilities.clear()
    this._buffer = ''
  }

  /**
   * 通用 MCP Tool 调用封装。
   */
  async callTool(name: string, args: Record<string, any>): Promise<any> {
    if (!this.process || this._status !== 'connected') {
      throw new Error(`${this.platform} connector 未连接`)
    }
    try {
      const result = await this._sendRpc('tools/call', { name, arguments: args })
      return (result as any)?.content ?? result
    } catch (e) {
      logForDebugging(`[MCPBridge:${this.platform}] callTool(${name}) 失败: ${(e as Error).message}`)
      throw e
    }
  }

  // ─── JSON-RPC 通信内部实现 ───

  private _sendRpc(method: string, params: Record<string, unknown>): Promise<unknown> {
    return new Promise((resolve, reject) => {
      if (!this.process?.stdin?.writable) {
        return reject(new Error('MCP Server stdin 不可写'))
      }

      const id = ++this._requestId
      const request: JsonRpcRequest = {
        jsonrpc: '2.0',
        id,
        method,
        params,
      }

      // 30 秒超时
      const timer = setTimeout(() => {
        this._pendingRequests.delete(id)
        reject(new Error(`JSON-RPC 超时: ${method} (id=${id})`))
      }, 30000)

      this._pendingRequests.set(id, { resolve, reject, timer })

      const payload = JSON.stringify(request) + '\n'
      this.process.stdin!.write(payload, 'utf-8', (err) => {
        if (err) {
          this._pendingRequests.delete(id)
          clearTimeout(timer)
          reject(err)
        }
      })
    })
  }

  private _handleData(data: string): void {
    this._buffer += data

    // 按换行符分割，逐行解析 JSON-RPC 响应
    let newlineIdx: number
    while ((newlineIdx = this._buffer.indexOf('\n')) !== -1) {
      const line = this._buffer.slice(0, newlineIdx).trim()
      this._buffer = this._buffer.slice(newlineIdx + 1)

      if (!line) continue

      try {
        const response: JsonRpcResponse = JSON.parse(line)
        if (response.id == null) continue

        const pending = this._pendingRequests.get(response.id)
        if (!pending) continue

        this._pendingRequests.delete(response.id)
        clearTimeout(pending.timer)

        if (response.error) {
          pending.reject(new Error(`JSON-RPC error ${response.error.code}: ${response.error.message}`))
        } else {
          pending.resolve(response.result)
        }
      } catch {
        // 非 JSON 行，忽略（可能是 MCP Server 的普通日志输出）
      }
    }
  }

  private _killProcess(): void {
    try {
      this.process?.kill('SIGTERM')
      // 3 秒后强制 kill
      const proc = this.process
      if (proc) {
        setTimeout(() => {
          try { proc.kill('SIGKILL') } catch { /* 已退出 */ }
        }, 3000)
      }
    } catch { /* 静默降级 */ }
  }

  private _rejectAllPending(reason: Error): void {
    for (const [id, pending] of this._pendingRequests) {
      clearTimeout(pending.timer)
      pending.reject(reason)
    }
    this._pendingRequests.clear()
  }
}
