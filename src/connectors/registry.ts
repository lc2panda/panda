// Input: ConnectorFactory 注册请求 + connectors.json 配置
// Output: 已初始化的 IMConnector 实例列表，含生命周期管理
// Pos: connectors/ 注册中心，启动时由 proactive/index.ts 初始化

import type {
  IMConnector,
  ConnectorPlatform,
  ConnectorFactory,
  ConnectorConfig,
} from './types.js'
import { getConnectorConfig, resolveSecret } from './config.js'
import { logForDebugging } from 'src/utils/debug.js'

class ConnectorRegistry {
  private factories = new Map<ConnectorPlatform, ConnectorFactory>()
  private instances = new Map<ConnectorPlatform, IMConnector>()
  private healthCheckInterval: ReturnType<typeof setInterval> | null = null
  /** 并发控制：正在连接中的平台集合，防止重复连接 */
  private _connectingSet = new Set<ConnectorPlatform>()

  /**
   * 注册 Connector 工厂。内置平台在模块加载时自动注册，
   * 第三方通过 npm 包在 postinstall 时调用。
   */
  registerFactory(factory: ConnectorFactory): void {
    this.factories.set(factory.platform, factory)
    logForDebugging(`[registry] Registered factory: ${factory.platform} (${factory.displayName})`)
  }

  /**
   * 注销指定平台的 Connector（含工厂 + 实例）。
   */
  async unregister(platform: ConnectorPlatform): Promise<void> {
    await this.disconnect(platform)
    this.factories.delete(platform)
    logForDebugging(`[registry] Unregistered: ${platform}`)
  }

  /**
   * 初始化所有已启用的 Connector。
   */
  async initializeAll(): Promise<void> {
    for (const [platform, factory] of this.factories) {
      const config = getConnectorConfig(platform)
      if (!config || !config.enabled) continue

      try {
        const connector = factory.create()
        const resolvedConfig = await this.resolveSecrets(config)
        await connector.initialize(resolvedConfig)
        this.instances.set(platform, connector)
        logForDebugging(`[registry] ${platform}: initialized (${connector.mode} mode, ${[...connector.capabilities].length} capabilities)`)
      } catch (e) {
        logForDebugging(`[registry] ${platform}: initialization failed: ${(e as Error).message}`)
      }
    }

    // 启动健康检查（每 5 分钟）
    this.healthCheckInterval = setInterval(() => this.runHealthChecks(), 5 * 60 * 1000)
  }

  /**
   * 获取所有已连接的 Connector（status === 'connected'）。
   */
  getConnectedConnectors(): IMConnector[] {
    return [...this.instances.values()].filter(c => c.status === 'connected')
  }

  /**
   * 获取所有已注册的 Connector 实例（不论状态）。
   */
  getAllConnectors(): IMConnector[] {
    return [...this.instances.values()]
  }

  /**
   * 获取指定平台的 Connector。
   */
  getConnector(platform: ConnectorPlatform): IMConnector | null {
    return this.instances.get(platform) || null
  }

  /**
   * 列出所有已注册的平台（含未启用的）。
   */
  listPlatforms(): Array<{
    platform: ConnectorPlatform
    displayName: string
    enabled: boolean
    status: string
    capabilities: string[]
  }> {
    return [...this.factories.entries()].map(([platform, factory]) => {
      const instance = this.instances.get(platform)
      const config = getConnectorConfig(platform)
      return {
        platform,
        displayName: factory.displayName,
        enabled: config?.enabled || false,
        status: instance?.status || 'disconnected',
        capabilities: instance ? [...instance.capabilities] : factory.defaultCapabilities,
      }
    })
  }

  /**
   * 热加载：运行中添加/重连 Connector。
   */
  async connect(platform: ConnectorPlatform): Promise<boolean> {
    const factory = this.factories.get(platform)
    if (!factory) return false

    const config = getConnectorConfig(platform)
    if (!config) return false

    // 并发控制：拒绝对同一平台的重复连接请求
    if (this._connectingSet.has(platform)) {
      logForDebugging(`[registry] ${platform}: connect rejected — already connecting`)
      return false
    }

    this._connectingSet.add(platform)
    try {
      await this.disconnect(platform)

      const connector = factory.create()
      const resolvedConfig = await this.resolveSecrets(config)
      await connector.initialize(resolvedConfig)
      this.instances.set(platform, connector)
      return true
    } catch (e) {
      logForDebugging(`[registry] ${platform}: connect failed: ${(e as Error).message}`)
      return false
    } finally {
      this._connectingSet.delete(platform)
    }
  }

  /**
   * 热卸载：运行中断开指定 Connector。
   */
  async disconnect(platform: ConnectorPlatform): Promise<void> {
    const instance = this.instances.get(platform)
    if (instance) {
      try { await instance.dispose() } catch { /* 静默降级 */ }
      this.instances.delete(platform)
    }
  }

  /**
   * 销毁所有连接并清理定时器。
   */
  async disposeAll(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
      this.healthCheckInterval = null
    }
    for (const [, instance] of this.instances) {
      try { await instance.dispose() } catch { /* 静默降级 */ }
    }
    this.instances.clear()
  }

  private async runHealthChecks(): Promise<void> {
    for (const [platform, instance] of this.instances) {
      try {
        const healthy = await instance.healthCheck()
        if (!healthy) {
          logForDebugging(`[registry] ${platform}: health check failed, attempting reconnect`)
          await this.connect(platform)
        }
      } catch {
        logForDebugging(`[registry] ${platform}: health check error`)
      }
    }
  }

  private async resolveSecrets(config: ConnectorConfig): Promise<ConnectorConfig> {
    const resolved = { ...config }
    for (const [key, value] of Object.entries(resolved)) {
      if (typeof value === 'string' && value.startsWith('keychain:')) {
        try {
          (resolved as any)[key] = await resolveSecret(value)
        } catch (e) {
          logForDebugging(`[registry] resolveSecret failed for key "${key}": ${(e as Error).message}`)
          ;(resolved as any)[key] = ''
        }
      }
    }
    if (resolved.mcpEnv) {
      const resolvedEnv = { ...resolved.mcpEnv }
      for (const [key, value] of Object.entries(resolvedEnv)) {
        if (value.startsWith('keychain:')) {
          try {
            resolvedEnv[key] = await resolveSecret(value)
          } catch (e) {
            logForDebugging(`[registry] resolveSecret failed for mcpEnv key "${key}": ${(e as Error).message}`)
            resolvedEnv[key] = ''
          }
        }
      }
      resolved.mcpEnv = resolvedEnv
    }
    return resolved
  }
}

// 单例
let _registry: ConnectorRegistry | null = null

export function getConnectorRegistry(): ConnectorRegistry {
  if (!_registry) _registry = new ConnectorRegistry()
  return _registry
}
