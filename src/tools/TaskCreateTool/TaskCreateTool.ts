import { z } from 'zod/v4'
import { buildTool, type ToolDef } from '../../Tool.js'
import {
  executeTaskCreatedHooks,
  getTaskCreatedHookMessage,
} from '../../utils/hooks.js'
import { lazySchema } from '../../utils/lazySchema.js'
import {
  createTask,
  deleteTask,
  getTaskListId,
  isTodoV2Enabled,
} from '../../utils/tasks.js'
import { getAgentName, getTeamName } from '../../utils/teammate.js'
import { TASK_CREATE_TOOL_NAME } from './constants.js'
import { DESCRIPTION, getPrompt } from './prompt.js'

// 已知字段集合，用于剥离畸形输入里的未知顶层键（strictObject 会因未知键直接抛错）
const KNOWN_TASK_FIELDS = new Set([
  'subject',
  'description',
  'activeForm',
  'metadata',
])

// 常见别名 → 规范字段名，覆盖模型偶发的字段命名漂移
const FIELD_ALIASES: Record<string, string> = {
  title: 'subject',
  name: 'subject',
  task: 'subject',
  detail: 'description',
  details: 'description',
  body: 'description',
  content: 'description',
  active_form: 'activeForm',
  activeform: 'activeForm',
  meta: 'metadata',
}

// 把任意标量安全转换为字符串；对象/数组返回 undefined（交给 schema 报错）
function coerceToString(value: unknown): string | undefined {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  return undefined
}

/**
 * 对常见畸形输入做最小自修复：
 * - 字段别名归一（title→subject、details→description 等）
 * - subject/description 标量宽松化为字符串
 * - description 缺失时用 subject 兜底
 * - metadata 为 JSON 字符串时解析为对象
 * - 剥离未知顶层键（避免 strictObject 直接抛错）
 * 修复后仍交由 strictObject 做最终校验，不可修复的仍报清晰错误。
 * 合法输入会原样通过（不改变既有行为）。
 */
function repairTaskCreateInput(raw: unknown): unknown {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    // 非对象输入无法修复，原样返回让 schema 报错
    return raw
  }
  const source = raw as Record<string, unknown>
  const repaired: Record<string, unknown> = {}

  // 1. 别名归一 + 剥离未知键
  for (const [key, value] of Object.entries(source)) {
    const canonical = FIELD_ALIASES[key] ?? key
    if (!KNOWN_TASK_FIELDS.has(canonical)) continue
    // 已有规范键时不被别名覆盖（规范优先）
    if (canonical in repaired && !(canonical in source)) continue
    if (source[canonical] !== undefined && canonical !== key) continue
    repaired[canonical] = value
  }

  // 2. subject / description / activeForm 标量宽松化
  for (const field of ['subject', 'description', 'activeForm'] as const) {
    if (field in repaired) {
      const coerced = coerceToString(repaired[field])
      if (coerced !== undefined) repaired[field] = coerced
    }
  }

  // 3. description 缺失但有 subject 时兜底
  if (
    (repaired.description === undefined || repaired.description === '') &&
    typeof repaired.subject === 'string' &&
    repaired.subject !== ''
  ) {
    repaired.description = repaired.subject
  }

  // 4. metadata 为 JSON 字符串时解析
  if (typeof repaired.metadata === 'string') {
    try {
      const parsed = JSON.parse(repaired.metadata)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        repaired.metadata = parsed
      }
    } catch {
      // 解析失败保持原值，交由 schema 报错
    }
  }

  return repaired
}

const inputSchema = lazySchema(() =>
  z.preprocess(
    repairTaskCreateInput,
    z.strictObject({
      subject: z.string().describe('A brief title for the task'),
      description: z.string().describe('What needs to be done'),
      activeForm: z
        .string()
        .optional()
        .describe(
          'Present continuous form shown in spinner when in_progress (e.g., "Running tests")',
        ),
      metadata: z
        .record(z.string(), z.unknown())
        .optional()
        .describe('Arbitrary metadata to attach to the task'),
    }),
  ),
)
type InputSchema = ReturnType<typeof inputSchema>

const outputSchema = lazySchema(() =>
  z.object({
    task: z.object({
      id: z.string(),
      subject: z.string(),
    }),
  }),
)
type OutputSchema = ReturnType<typeof outputSchema>

export type Output = z.infer<OutputSchema>

export const TaskCreateTool = buildTool({
  name: TASK_CREATE_TOOL_NAME,
  searchHint: 'create a task in the task list',
  maxResultSizeChars: 100_000,
  async description() {
    return DESCRIPTION
  },
  async prompt() {
    return getPrompt()
  },
  get inputSchema(): InputSchema {
    return inputSchema()
  },
  get outputSchema(): OutputSchema {
    return outputSchema()
  },
  userFacingName() {
    return 'TaskCreate'
  },
  shouldDefer: true,
  isEnabled() {
    return isTodoV2Enabled()
  },
  isConcurrencySafe() {
    return true
  },
  toAutoClassifierInput(input) {
    return input.subject
  },
  renderToolUseMessage() {
    return null
  },
  async call({ subject, description, activeForm, metadata }, context) {
    const taskId = await createTask(getTaskListId(), {
      subject,
      description,
      activeForm,
      status: 'pending',
      owner: undefined,
      blocks: [],
      blockedBy: [],
      metadata,
    })

    const blockingErrors: string[] = []
    const generator = executeTaskCreatedHooks(
      taskId,
      subject,
      description,
      getAgentName(),
      getTeamName(),
      undefined,
      context?.abortController?.signal,
      undefined,
      context,
    )
    for await (const result of generator) {
      if (result.blockingError) {
        blockingErrors.push(getTaskCreatedHookMessage(result.blockingError))
      }
    }

    if (blockingErrors.length > 0) {
      await deleteTask(getTaskListId(), taskId)
      throw new Error(blockingErrors.join('\n'))
    }

    // Auto-expand task list when creating tasks
    context.setAppState(prev => {
      if (prev.expandedView === 'tasks') return prev
      return { ...prev, expandedView: 'tasks' as const }
    })

    return {
      data: {
        task: {
          id: taskId,
          subject,
        },
      },
    }
  },
  mapToolResultToToolResultBlockParam(content, toolUseID) {
    const { task } = content as Output
    return {
      tool_use_id: toolUseID,
      type: 'tool_result',
      content: `Task #${task.id} created successfully: ${task.subject}`,
    }
  },
} satisfies ToolDef<InputSchema, Output>)
