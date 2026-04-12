export type ExecutionMode = 'dry-run' | 'execute'

export interface SafeExecutionResult {
  success: boolean
  mode: ExecutionMode
  output: string
}

const TASK_TIMEOUT_MS = 30_000

export async function safeExecute(
  taskId: string,
  action: () => Promise<string>,
  mode: ExecutionMode = 'dry-run',
): Promise<SafeExecutionResult> {
  if (mode === 'dry-run') {
    return { success: true, mode, output: `[dry-run] Task ${taskId} would execute` }
  }
  try {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Task ${taskId} timed out after ${TASK_TIMEOUT_MS}ms`)), TASK_TIMEOUT_MS),
    )
    const output = await Promise.race([action(), timeout])
    return { success: true, mode, output }
  } catch (e) {
    return { success: false, mode, output: String(e) }
  }
}
