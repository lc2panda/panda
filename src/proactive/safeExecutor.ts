export type ExecutionMode = 'dry-run' | 'execute'

export interface SafeExecutionResult {
  success: boolean
  mode: ExecutionMode
  output: string
}

export async function safeExecute(
  taskId: string,
  action: () => Promise<string>,
  mode: ExecutionMode = 'dry-run',
): Promise<SafeExecutionResult> {
  if (mode === 'dry-run') {
    return { success: true, mode, output: `[dry-run] Task ${taskId} would execute` }
  }
  try {
    const output = await action()
    return { success: true, mode, output }
  } catch (e) {
    return { success: false, mode, output: String(e) }
  }
}
