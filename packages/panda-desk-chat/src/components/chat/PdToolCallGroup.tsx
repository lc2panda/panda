// Input: toolCalls (UIToolUseMessage[]), resultMap, childToolCallsByParent, agentTaskNotifications, isStreaming?
// Output: cc-haha 1:1 ToolCallGroup — 3 dispatch branches (AgentToolGroup / ToolCallTree / ToolCallGroupMulti) +
//         AgentCallCard 5-state machine + recursive ToolCallTree for nested agent invocations
// Pos:    Chat layer — wraps groups of consecutive tool_use entries inside PdMessageList
//
// Source 1:1: cc-haha desktop/src/components/chat/ToolCallGroup.tsx (L1-617)
//
// Notes:
// - Props 接口与 cc-haha 字面 1:1（toolCalls/resultMap/childToolCallsByParent/agentTaskNotifications/isStreaming）。
// - panda chatStore 没有 agentTaskNotifications — 调用方传 `{}` 即可（cc-haha 也接受空对象）。
// - cc-haha Modal 使用 panda PdModal；MarkdownRenderer 使用 PdMarkdownRenderer。
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。
import { useEffect, useState } from 'react'
import { PdToolCallCard } from './PdToolCallCard'
import { PdMarkdownRenderer } from './PdMarkdownRenderer'
import { PdModal } from '../shared/PdModal'
import { t } from '../../i18n'
import type {
  UIToolUseMessage,
  UIToolResultMessage,
} from '../../stores/chatStore'
import type { AgentTaskNotification } from '../../types/chat'
import { AGENT_LIFECYCLE_TYPES } from '../../types/team'

type ToolCall = UIToolUseMessage
type ToolResult = UIToolResultMessage

export interface PdToolCallGroupProps {
  toolCalls: ToolCall[]
  resultMap: Map<string, ToolResult>
  childToolCallsByParent: Map<string, ToolCall[]>
  agentTaskNotifications: Record<string, AgentTaskNotification>
  /** When true, the last tool is still executing — show expanded */
  isStreaming?: boolean
}

const TOOL_VERBS: Record<string, (count: number) => string> = {
  Read: (n) => (n === 1 ? (t('toolGroup.readOne') || 'read 1 file') : (t('toolGroup.readMany', { count: n }) || `read ${n} files`)),
  Write: (n) => (n === 1 ? (t('toolGroup.createdOne') || 'created 1 file') : (t('toolGroup.createdMany', { count: n }) || `created ${n} files`)),
  Edit: (n) => (n === 1 ? (t('toolGroup.editedOne') || 'edited 1 file') : (t('toolGroup.editedMany', { count: n }) || `edited ${n} files`)),
  Bash: (n) => (n === 1 ? (t('toolGroup.ranOne') || 'ran 1 command') : (t('toolGroup.ranMany', { count: n }) || `ran ${n} commands`)),
  Glob: () => (t('toolGroup.foundFiles') || 'found files'),
  Grep: (n) => (n === 1 ? (t('toolGroup.searchedOne') || 'searched 1 pattern') : (t('toolGroup.searchedMany', { count: n }) || `searched ${n} patterns`)),
  Agent: (n) => (n === 1 ? (t('toolGroup.agentOne') || 'launched 1 agent') : (t('toolGroup.agentMany', { count: n }) || `launched ${n} agents`)),
  WebSearch: () => (t('toolGroup.searchedWeb') || 'searched the web'),
  WebFetch: (n) => (n === 1 ? (t('toolGroup.fetchedOne') || 'fetched 1 page') : (t('toolGroup.fetchedMany', { count: n }) || `fetched ${n} pages`)),
}

function generateSummary(toolCalls: ToolCall[]): string {
  const counts = new Map<string, number>()
  for (const tc of toolCalls) {
    counts.set(tc.toolName, (counts.get(tc.toolName) ?? 0) + 1)
  }
  const parts: string[] = []
  for (const [name, count] of counts) {
    const verbFn = TOOL_VERBS[name]
    parts.push(verbFn ? verbFn(count) : `${name} (${count})`)
  }
  return parts.join(', ')
}

function groupHasErrors(toolCalls: ToolCall[], resultMap: Map<string, ToolResult>): boolean {
  return toolCalls.some((tc) => {
    const result = resultMap.get(tc.toolUseId)
    return result?.isError
  })
}

export function PdToolCallGroup({
  toolCalls,
  resultMap,
  childToolCallsByParent,
  agentTaskNotifications,
  isStreaming,
}: PdToolCallGroupProps) {
  const allAgents = toolCalls.length > 0 && toolCalls.every((toolCall) => toolCall.toolName === 'Agent')

  if (allAgents) {
    return (
      <AgentToolGroup
        toolCalls={toolCalls}
        resultMap={resultMap}
        childToolCallsByParent={childToolCallsByParent}
        agentTaskNotifications={agentTaskNotifications}
        isStreaming={isStreaming}
      />
    )
  }

  // Single tool call — render directly without group wrapper
  if (toolCalls.length === 1) {
    const tc = toolCalls[0]!
    return (
      <ToolCallTree
        toolCall={tc}
        resultMap={resultMap}
        childToolCallsByParent={childToolCallsByParent}
      />
    )
  }

  return (
    <ToolCallGroupMulti
      toolCalls={toolCalls}
      resultMap={resultMap}
      childToolCallsByParent={childToolCallsByParent}
      agentTaskNotifications={agentTaskNotifications}
      isStreaming={isStreaming}
    />
  )
}

function AgentToolGroup({
  toolCalls,
  resultMap,
  childToolCallsByParent,
  agentTaskNotifications,
  isStreaming,
}: PdToolCallGroupProps) {
  const [expanded, setExpanded] = useState(true)
  const statuses = toolCalls.map((toolCall) =>
    getAgentStatus({
      hasResult: resultMap.has(toolCall.toolUseId),
      isError: !!resultMap.get(toolCall.toolUseId)?.isError,
      isLaunchResult: isAgentLaunchResult(resultMap.get(toolCall.toolUseId)?.content),
      isStreaming: !!isStreaming && !resultMap.has(toolCall.toolUseId),
      childCount: (childToolCallsByParent.get(toolCall.toolUseId) ?? []).length,
      taskStatus: agentTaskNotifications[toolCall.toolUseId]?.status,
    }),
  )
  const isAnyRunning = statuses.some((status) => status === 'running' || status === 'starting')
  const errorPresent = statuses.some((status) => status === 'failed')
  const allComplete = statuses.every((status) => status === 'done')
  const anyStopped = statuses.some((status) => status === 'stopped')

  useEffect(() => {
    if (isStreaming) {
      setExpanded(true)
    }
  }, [isStreaming])

  return (
    <div className="mb-2">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-center gap-2 rounded-lg border border-[var(--pd-color-border)]/40 bg-[var(--pd-color-surface-container-low)] px-3 py-1.5 text-left transition-colors hover:bg-[var(--pd-color-surface-container-high)]"
      >
        <span className="material-symbols-outlined text-[14px] text-[var(--pd-color-outline)]">
          {expanded ? 'expand_less' : 'expand_more'}
        </span>
        <span className="flex-1 truncate text-[12px] text-[var(--pd-color-text-secondary)]">
          {toolCalls.length === 1
            ? (t('toolGroup.agentOne') || 'launched 1 agent')
            : (t('toolGroup.agentMany', { count: toolCalls.length }) || `launched ${toolCalls.length} agents`)}
        </span>
        {isAnyRunning && (
          <span className="rounded-full bg-[var(--pd-color-warning)]/12 px-2 py-0.5 text-[10px] font-semibold text-[var(--pd-color-warning)]">
            {t('agentStatus.running') || 'Running'}
          </span>
        )}
        {!isAnyRunning && errorPresent && (
          <span className="material-symbols-outlined text-[14px] text-[var(--pd-color-error)]">error</span>
        )}
        {!isAnyRunning && !errorPresent && allComplete && (
          <span className="material-symbols-outlined text-[14px] text-[var(--pd-color-success)]">check_circle</span>
        )}
        {!isAnyRunning && !errorPresent && !allComplete && !anyStopped && (
          <span className="material-symbols-outlined text-[14px] text-[var(--pd-color-outline)]">pending</span>
        )}
        {!isAnyRunning && !errorPresent && !allComplete && anyStopped && (
          <span className="material-symbols-outlined text-[14px] text-[var(--pd-color-outline)]">stop_circle</span>
        )}
      </button>

      {expanded && (
        <div className="relative mt-3 pl-5">
          <div className="absolute bottom-6 left-[11px] top-4 w-px rounded-full bg-[var(--pd-color-border)]/45" />
          <div className="space-y-2">
            {toolCalls.map((toolCall) => (
              <div key={toolCall.id} className="relative pl-7">
                <div className="absolute left-0 top-1/2 -translate-y-1/2">
                  <div className="absolute left-[11px] top-1/2 h-px w-4 -translate-y-1/2 bg-[var(--pd-color-border)]/45" />
                  <div className="absolute left-[8px] top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full border border-[var(--pd-color-border)]/65 bg-[var(--pd-color-surface-container-lowest)] shadow-[0_0_0_2px_var(--pd-color-surface)]" />
                </div>
                <AgentCallCard
                  toolCall={toolCall}
                  resultMap={resultMap}
                  childToolCallsByParent={childToolCallsByParent}
                  agentTaskNotification={agentTaskNotifications[toolCall.toolUseId]}
                  isStreaming={isStreaming && !resultMap.has(toolCall.toolUseId)}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/** Separated so the useState hook is never called conditionally. */
function ToolCallGroupMulti({ toolCalls, resultMap, childToolCallsByParent, isStreaming }: PdToolCallGroupProps) {
  const [expanded, setExpanded] = useState(false)
  const summary = generateSummary(toolCalls)
  const errorPresent = groupHasErrors(toolCalls, resultMap)
  const allComplete = toolCalls.every((tc) => resultMap.has(tc.toolUseId))
  const hasNestedToolCalls = toolCalls.some((tc) => (childToolCallsByParent.get(tc.toolUseId)?.length ?? 0) > 0)

  useEffect(() => {
    if (isStreaming || hasNestedToolCalls) {
      setExpanded(true)
    }
  }, [hasNestedToolCalls, isStreaming])

  return (
    <div className="mb-2">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-2 rounded-lg border border-[var(--pd-color-border)]/40 bg-[var(--pd-color-surface-container-low)] px-3 py-1.5 text-left transition-colors hover:bg-[var(--pd-color-surface-container-high)]"
      >
        <span className="material-symbols-outlined text-[14px] text-[var(--pd-color-outline)]">
          {expanded ? 'expand_less' : 'expand_more'}
        </span>
        <span className="flex-1 truncate text-[12px] text-[var(--pd-color-text-secondary)]">{summary}</span>
        {!isStreaming && allComplete && !errorPresent && (
          <span className="material-symbols-outlined text-[14px] text-[var(--pd-color-success)]">check_circle</span>
        )}
        {!isStreaming && errorPresent && (
          <span className="material-symbols-outlined text-[14px] text-[var(--pd-color-error)]">error</span>
        )}
        {!isStreaming && !allComplete && !errorPresent && (
          <span className="material-symbols-outlined text-[14px] text-[var(--pd-color-outline)]">pending</span>
        )}
        {isStreaming && (
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--pd-color-brand)] animate-pulse-dot" />
        )}
      </button>

      {expanded && (
        <div className="mt-1.5 space-y-1">
          {toolCalls.map((tc) => (
            <ToolCallTree
              key={tc.id}
              toolCall={tc}
              resultMap={resultMap}
              childToolCallsByParent={childToolCallsByParent}
              compact
            />
          ))}
        </div>
      )}
    </div>
  )
}

function AgentCallCard({
  toolCall,
  resultMap,
  childToolCallsByParent,
  agentTaskNotification,
  isStreaming = false,
}: {
  toolCall: ToolCall
  resultMap: Map<string, ToolResult>
  childToolCallsByParent: Map<string, ToolCall[]>
  agentTaskNotification?: AgentTaskNotification
  isStreaming?: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const input = toolCall.input && typeof toolCall.input === 'object' ? (toolCall.input as Record<string, unknown>) : {}
  const result = resultMap.get(toolCall.toolUseId)
  const childToolCalls = childToolCallsByParent.get(toolCall.toolUseId) ?? []
  const isLaunchResult = isAgentLaunchResult(result?.content)
  const recentToolCalls = childToolCalls.slice(-2)
  const status = getAgentStatus({
    hasResult: !!result,
    isError: !!result?.isError,
    isLaunchResult,
    isStreaming,
    childCount: childToolCalls.length,
    taskStatus: agentTaskNotification?.status,
  })
  const statusClassName = getAgentStatusClassName(status)
  const statusLabel = getAgentStatusLabel(status)
  const taskSummary = agentTaskNotification?.summary?.trim() || ''
  const errorText =
    status === 'failed'
      ? taskSummary || (result?.isError ? getAgentErrorSummary(result.content) : '')
      : result?.isError
        ? getAgentErrorSummary(result.content)
        : ''
  const fullOutputText =
    result && !result.isError && !isLaunchResult && !isAgentLifecycleResult(result.content)
      ? extractTextContent(result.content).trim()
      : ''
  const previewText = fullOutputText || (status === 'done' || status === 'stopped' ? taskSummary : '')
  const outputSummary = previewText ? getAgentOutputSummary(previewText) : ''
  const description = typeof input.description === 'string' ? input.description : ''

  return (
    <div className="overflow-hidden rounded-lg border border-[var(--pd-color-border)]/50 bg-[var(--pd-color-surface-container-lowest)]">
      <div className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--pd-color-surface-hover)]/50">
        <span className="material-symbols-outlined text-[18px] text-[var(--pd-color-outline)]">smart_toy</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold text-[var(--pd-color-text-primary)]">Agent</span>
            {description && (
              <span className="truncate text-[12px] text-[var(--pd-color-text-secondary)]">{description}</span>
            )}
          </div>
          {!expanded && outputSummary && (
            <div className="mt-1 line-clamp-2 text-[11px] text-[var(--pd-color-text-tertiary)]">{outputSummary}</div>
          )}
          {!expanded && !outputSummary && recentToolCalls.length > 0 && (
            <div className="mt-1 space-y-1">
              {recentToolCalls.map((recentToolCall) => (
                <div key={recentToolCall.id} className="truncate text-[11px] text-[var(--pd-color-text-tertiary)]">
                  {formatRecentToolUseSummary(recentToolCall, resultMap)}
                </div>
              ))}
            </div>
          )}
          {!expanded && !outputSummary && !recentToolCalls.length && errorText && (
            <div className="mt-1 truncate text-[11px] text-[var(--pd-color-error)]">{errorText}</div>
          )}
        </div>
        {outputSummary && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              setPreviewOpen(true)
            }}
            className="shrink-0 rounded-md border border-[var(--pd-color-border)] px-2.5 py-1 text-[11px] font-medium text-[var(--pd-color-text-secondary)] transition-colors hover:bg-[var(--pd-color-surface-hover)] hover:text-[var(--pd-color-text-primary)]"
          >
            {t('agentStatus.viewResult') || 'View result'}
          </button>
        )}
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusClassName}`}>{statusLabel}</span>
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[var(--pd-color-outline)] transition-colors hover:bg-[var(--pd-color-surface-hover)]"
          aria-label={expanded ? 'Collapse agent' : 'Expand agent'}
        >
          <span className="material-symbols-outlined text-[16px]">{expanded ? 'expand_less' : 'expand_more'}</span>
        </button>
      </div>

      {expanded && (
        <div className="border-t border-[var(--pd-color-border)]/60 px-3 py-3">
          {errorText && (
            <div className="mb-3 rounded-lg border border-[var(--pd-color-error)]/20 bg-[var(--pd-color-error-container)]/60 px-3 py-2 text-[11px] text-[var(--pd-color-error)]">
              {errorText}
            </div>
          )}
          {childToolCalls.length > 0 ? (
            <div className="space-y-1">
              {childToolCalls.map((childToolCall) => (
                <ToolCallTree
                  key={childToolCall.id}
                  toolCall={childToolCall}
                  resultMap={resultMap}
                  childToolCallsByParent={childToolCallsByParent}
                  compact
                />
              ))}
            </div>
          ) : outputSummary ? (
            <div className="rounded-lg border border-[var(--pd-color-border)]/60 bg-[var(--pd-color-surface)] px-3 py-3">
              <div className="line-clamp-3 text-[11px] leading-[1.55] text-[var(--pd-color-text-secondary)]">{outputSummary}</div>
              <div className="mt-3 flex justify-end">
                <span className="text-[10px] text-[var(--pd-color-text-tertiary)]">
                  {t('agentStatus.viewResult') || 'View result'}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-[11px] text-[var(--pd-color-text-tertiary)]">
              {status === 'starting'
                ? (t('agentStatus.starting') || 'Starting…')
                : (t('agentStatus.noActivity') || 'No activity yet')}
            </div>
          )}
        </div>
      )}
      <PdModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={description || (t('agentStatus.resultTitle') || 'Agent result')}
        width={900}
      >
        <div className="max-h-[70vh] overflow-y-auto">
          <PdMarkdownRenderer content={previewText || errorText} />
        </div>
      </PdModal>
    </div>
  )
}

function ToolCallTree({
  toolCall,
  resultMap,
  childToolCallsByParent,
  compact = false,
}: {
  toolCall: ToolCall
  resultMap: Map<string, ToolResult>
  childToolCallsByParent: Map<string, ToolCall[]>
  compact?: boolean
}) {
  const result = resultMap.get(toolCall.toolUseId)
  const childToolCalls = childToolCallsByParent.get(toolCall.toolUseId) ?? []

  return (
    <div className={compact ? 'space-y-1' : ''}>
      <PdToolCallCard
        toolName={toolCall.toolName}
        input={toolCall.input}
        result={result ? { content: result.content, isError: !!result.isError } : null}
        compact={compact}
      />
      {childToolCalls.length > 0 && (
        <div className={compact ? 'ml-4 border-l border-[var(--pd-color-border)]/60 pl-3' : 'mb-2 ml-16 border-l border-[var(--pd-color-border)]/60 pl-3'}>
          <div className="space-y-1">
            {childToolCalls.map((childToolCall) => (
              <ToolCallTree
                key={childToolCall.id}
                toolCall={childToolCall}
                resultMap={resultMap}
                childToolCallsByParent={childToolCallsByParent}
                compact
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

type AgentStatus = 'starting' | 'running' | 'done' | 'failed' | 'stopped'
type AgentTaskStatus = AgentTaskNotification['status']

function getAgentStatus({
  hasResult,
  isError,
  isLaunchResult,
  isStreaming,
  childCount,
  taskStatus,
}: {
  hasResult: boolean
  isError: boolean
  isLaunchResult: boolean
  isStreaming: boolean
  childCount: number
  taskStatus?: AgentTaskStatus
}): AgentStatus {
  if (taskStatus === 'failed') return 'failed'
  if (taskStatus === 'stopped') return 'stopped'
  if (taskStatus === 'completed') return 'done'
  if (hasResult && isError && !isLaunchResult) return 'failed'
  if (hasResult && !isLaunchResult) return 'done'
  if (isStreaming || childCount > 0 || isLaunchResult) return 'running'
  return 'starting'
}

function getAgentStatusLabel(status: AgentStatus): string {
  switch (status) {
    case 'failed':
      return t('agentStatus.failed') || 'Failed'
    case 'stopped':
      return t('agentStatus.stopped') || 'Stopped'
    case 'done':
      return t('agentStatus.done') || 'Done'
    case 'running':
      return t('agentStatus.running') || 'Running'
    case 'starting':
    default:
      return t('agentStatus.starting') || 'Starting…'
  }
}

function getAgentStatusClassName(status: AgentStatus): string {
  switch (status) {
    case 'failed':
      return 'bg-[var(--pd-color-error)]/10 text-[var(--pd-color-error)]'
    case 'stopped':
      return 'bg-[var(--pd-color-surface-container-high)] text-[var(--pd-color-text-secondary)]'
    case 'done':
      return 'bg-[var(--pd-color-success)]/10 text-[var(--pd-color-success)]'
    case 'running':
      return 'bg-[var(--pd-color-warning)]/10 text-[var(--pd-color-warning)]'
    case 'starting':
    default:
      return 'bg-[var(--pd-color-surface-container-high)] text-[var(--pd-color-text-secondary)]'
  }
}

function formatRecentToolUseSummary(toolCall: ToolCall, resultMap: Map<string, ToolResult>): string {
  const input = toolCall.input && typeof toolCall.input === 'object' ? (toolCall.input as Record<string, unknown>) : {}
  const result = resultMap.get(toolCall.toolUseId)
  const suffix = result?.isError ? ' • failed' : result ? ' • done' : ' • running'

  switch (toolCall.toolName) {
    case 'Bash':
      return `Bash · ${typeof input.command === 'string' ? input.command : ''}${suffix}`
    case 'Read':
      return `Read · ${typeof input.file_path === 'string' ? (input.file_path as string).split('/').pop() : 'file'}${suffix}`
    case 'Glob':
      return `Glob · ${typeof input.pattern === 'string' ? input.pattern : ''}${suffix}`
    case 'Grep':
      return `Grep · ${typeof input.pattern === 'string' ? input.pattern : ''}${suffix}`
    case 'Agent':
      return `Agent · ${typeof input.description === 'string' ? input.description : ''}${suffix}`
    default:
      return `${toolCall.toolName}${suffix}`
  }
}

function getAgentErrorSummary(content: unknown): string {
  const text = extractTextContent(content).replace(/\s+/g, ' ').trim()
  if (!text) return ''
  if (text.includes(`Agent type 'Explore' not found`)) {
    return 'Explore agent unavailable in this session'
  }
  return text.length > 120 ? `${text.slice(0, 120)}...` : text
}

function getAgentOutputSummary(content: string): string {
  const text = content.replace(/\s+\n/g, '\n').trim()
  if (!text) return ''
  return text.length > 220 ? `${text.slice(0, 220)}...` : text
}

function isAgentLaunchResult(content: unknown): boolean {
  const text = extractTextContent(content).trim()
  if (!text) return false

  return (
    text.startsWith('Async agent launched successfully.') ||
    text.startsWith('Remote agent launched in CCR.') ||
    (text.startsWith('Spawned successfully.') &&
      text.includes('The agent is now running and will receive instructions via mailbox.')) ||
    text.includes('The agent is working in the background. You will be notified automatically when it completes.') ||
    text.includes('The agent is running remotely. You will be notified automatically when it completes.')
  )
}

/**
 * Check if agent result content is a lifecycle notification (shutdown, terminated, etc.)
 * rather than actual agent output. These should not be shown to the user as results.
 */
function isAgentLifecycleResult(content: unknown): boolean {
  const text = extractTextContent(content).trim()
  if (!text) return false
  // Detect JSON lifecycle messages: shutdown_approved, shutdown_rejected, teammate_terminated
  if (text.startsWith('{') && text.endsWith('}')) {
    try {
      const parsed = JSON.parse(text) as Record<string, unknown>
      if (typeof parsed.type === 'string' && (AGENT_LIFECYCLE_TYPES as readonly string[]).includes(parsed.type)) {
        return true
      }
    } catch {
      /* not JSON */
    }
  }
  return false
}

function extractTextContent(content: unknown): string {
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content
      .map((chunk) => {
        if (typeof chunk === 'string') return chunk
        if (chunk && typeof chunk === 'object' && 'text' in chunk) {
          return typeof (chunk as { text?: unknown }).text === 'string'
            ? (chunk as { text: string }).text
            : ''
        }
        return ''
      })
      .filter(Boolean)
      .join('\n')
  }
  if (content && typeof content === 'object') {
    if (
      'status' in content &&
      (content as Record<string, unknown>).status === 'completed' &&
      Array.isArray((content as Record<string, unknown>).content)
    ) {
      return extractTextContent((content as Record<string, unknown>).content)
    }
  }
  if (content && typeof content === 'object') {
    return JSON.stringify(content)
  }
  return ''
}

PdToolCallGroup.displayName = 'PdToolCallGroup'
