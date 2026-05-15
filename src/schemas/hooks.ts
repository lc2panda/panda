/**
 * Hook Zod schemas extracted to break import cycles.
 *
 * This file contains hook-related schema definitions that were originally
 * in src/utils/settings/types.ts. By extracting them here, we break the
 * circular dependency between settings/types.ts and plugins/schemas.ts.
 *
 * Both files now import from this shared location instead of each other.
 */

import { HOOK_EVENTS, type HookEvent } from 'src/entrypoints/agentSdkTypes.js'
import { z } from 'zod/v4'
import { lazySchema } from '../utils/lazySchema.js'
import { SHELL_TYPES } from '../utils/shell/shellProvider.js'

// Shared schema for the `if` condition field.
// Uses permission rule syntax (e.g., "Bash(git *)", "Read(*.ts)") to filter hooks
// before spawning. Evaluated against the hook input's tool_name and tool_input.
const IfConditionSchema = lazySchema(() =>
  z
    .string()
    .optional()
    .describe(
      'Permission rule syntax to filter when this hook runs (e.g., "Bash(git *)"). ' +
        'Only runs if the tool call matches the pattern. Avoids spawning hooks for non-matching commands.',
    ),
)

// Internal factory for individual hook schemas (shared between exported
// discriminated union members and the HookCommandSchema factory)
function buildHookSchemas() {
  // [v2.1.139] Hooks may use either `command` (shell-interpreted string) OR
  // `args` (exec-form argv array, no shell). `args[0]` is the executable;
  // remaining items are passed verbatim — path occurrences with spaces don't
  // need shell quoting, $tool_name / $file_path placeholders are substituted
  // before spawn. Exactly one of the two must be set; cross-field validation
  // applied at the outer schema level (discriminatedUnion requires pure
  // ZodObject members, so the .refine() lives below the union).
  const BashCommandHookSchema = z.object({
    type: z.literal('command').describe('Shell command hook type'),
    command: z
      .string()
      .optional()
      .describe(
        'Shell command to execute (interpreted by bash/pwsh). Mutually exclusive with `args`.',
      ),
    args: z
      .array(z.string())
      .min(1)
      .optional()
      .describe(
        'Exec-form argv array: args[0] is the executable, remaining items are passed verbatim (no shell interpretation). Placeholders like $tool_name / $file_path / $CLAUDE_PROJECT_DIR are substituted per-arg before spawn. Mutually exclusive with `command`.',
      ),
    if: IfConditionSchema(),
    shell: z
      .enum(SHELL_TYPES)
      .optional()
      .describe(
        "Shell interpreter (string-form only). 'bash' uses your $SHELL (bash/zsh/sh); 'powershell' uses pwsh. Defaults to bash. Ignored when `args` is set.",
      ),
    timeout: z
      .number()
      .positive()
      .optional()
      .describe('Timeout in seconds for this specific command'),
    statusMessage: z
      .string()
      .optional()
      .describe('Custom status message to display in spinner while hook runs'),
    once: z
      .boolean()
      .optional()
      .describe('If true, hook runs once and is removed after execution'),
    async: z
      .boolean()
      .optional()
      .describe('If true, hook runs in background without blocking'),
    asyncRewake: z
      .boolean()
      .optional()
      .describe(
        'If true, hook runs in background and wakes the model on exit code 2 (blocking error). Implies async.',
      ),
  })

  const PromptHookSchema = z.object({
    type: z.literal('prompt').describe('LLM prompt hook type'),
    prompt: z
      .string({
        // [v2.1.142] Clearer error when the `prompt` field is missing/non-string.
        // Without this override Zod returns "Invalid input: expected string,
        // received undefined" with no hint about which hook type.
        message:
          'Prompt hook (type: "prompt") requires a string `prompt` field describing what the LLM should evaluate. Use $ARGUMENTS to include the hook input JSON.',
      })
      .min(1, {
        message:
          'Prompt hook `prompt` cannot be empty. Provide instructions for the LLM (e.g. "Decide if the diff should be auto-reverted").',
      })
      .describe(
        'Prompt to evaluate with LLM. Use $ARGUMENTS placeholder for hook input JSON.',
      ),
    if: IfConditionSchema(),
    timeout: z
      .number()
      .positive()
      .optional()
      .describe('Timeout in seconds for this specific prompt evaluation'),
    // @[MODEL LAUNCH]: Update the example model ID in the .describe() strings below (prompt + agent hooks).
    model: z
      .string()
      .optional()
      .describe(
        'Model to use for this prompt hook (e.g., "claude-sonnet-4-6"). If not specified, uses the default small fast model.',
      ),
    statusMessage: z
      .string()
      .optional()
      .describe('Custom status message to display in spinner while hook runs'),
    once: z
      .boolean()
      .optional()
      .describe('If true, hook runs once and is removed after execution'),
  })

  const HttpHookSchema = z.object({
    type: z.literal('http').describe('HTTP hook type'),
    url: z.string().url().describe('URL to POST the hook input JSON to'),
    if: IfConditionSchema(),
    timeout: z
      .number()
      .positive()
      .optional()
      .describe('Timeout in seconds for this specific request'),
    headers: z
      .record(z.string(), z.string())
      .optional()
      .describe(
        'Additional headers to include in the request. Values may reference environment variables using $VAR_NAME or ${VAR_NAME} syntax (e.g., "Authorization": "Bearer $MY_TOKEN"). Only variables listed in allowedEnvVars will be interpolated.',
      ),
    allowedEnvVars: z
      .array(z.string())
      .optional()
      .describe(
        'Explicit list of environment variable names that may be interpolated in header values. Only variables listed here will be resolved; all other $VAR references are left as empty strings. Required for env var interpolation to work.',
      ),
    statusMessage: z
      .string()
      .optional()
      .describe('Custom status message to display in spinner while hook runs'),
    once: z
      .boolean()
      .optional()
      .describe('If true, hook runs once and is removed after execution'),
  })

  const AgentHookSchema = z.object({
    type: z.literal('agent').describe('Agentic verifier hook type'),
    // DO NOT add .transform() here. This schema is used by parseSettingsFile,
    // and updateSettingsForSource round-trips the parsed result through
    // JSON.stringify — a transformed function value is silently dropped,
    // deleting the user's prompt from settings.json (gh-24920, CC-79). The
    // transform (from #10594) wrapped the string in `(_msgs) => prompt`
    // for a programmatic-construction use case in ExitPlanModeV2Tool that
    // has since been refactored into VerifyPlanExecutionTool, which no
    // longer constructs AgentHook objects at all.
    prompt: z
      .string({
        // [v2.1.142] Clearer error when the `prompt` field is missing/non-string.
        message:
          'Agent hook (type: "agent") requires a string `prompt` field describing the verification criterion (e.g. "Verify that unit tests ran and passed."). Use $ARGUMENTS to include the hook input JSON.',
      })
      .min(1, {
        message:
          'Agent hook `prompt` cannot be empty. Provide a clear verification criterion.',
      })
      .describe(
        'Prompt describing what to verify (e.g. "Verify that unit tests ran and passed."). Use $ARGUMENTS placeholder for hook input JSON.',
      ),
    if: IfConditionSchema(),
    timeout: z
      .number()
      .positive()
      .optional()
      .describe('Timeout in seconds for agent execution (default 60)'),
    model: z
      .string()
      .optional()
      .describe(
        'Model to use for this agent hook (e.g., "claude-sonnet-4-6"). If not specified, uses Haiku.',
      ),
    statusMessage: z
      .string()
      .optional()
      .describe('Custom status message to display in spinner while hook runs'),
    once: z
      .boolean()
      .optional()
      .describe('If true, hook runs once and is removed after execution'),
  })

  // mcp_tool handler — calls a tool exposed by an already-connected MCP server
  // (parity with upstream v2.1.118). Argument values may reference hook input
  // fields via ${tool_input.x}, ${tool_response.y}, ${session_id} etc; only
  // string-typed values undergo template substitution.
  const McpToolHookSchema = z.object({
    type: z.literal('mcp_tool').describe('MCP server tool hook type'),
    mcpServer: z
      .string()
      .describe('Name of an already-connected MCP server (matches appState.mcp.clients[].name)'),
    tool: z
      .string()
      .describe('Tool name exposed by the MCP server (the short name, not the mcp__server__tool composite)'),
    arguments: z
      .record(z.string(), z.unknown())
      .optional()
      .describe(
        'Argument object passed to MCP tool. String values support ${tool_input.x} / ${tool_response.y} / ${session_id} template substitution against the hook input.',
      ),
    if: IfConditionSchema(),
    timeout: z
      .number()
      .positive()
      .optional()
      .describe('Timeout in seconds for the MCP tool call'),
    statusMessage: z
      .string()
      .optional()
      .describe('Custom status message to display in spinner while hook runs'),
    once: z
      .boolean()
      .optional()
      .describe('If true, hook runs once and is removed after execution'),
  })

  return {
    BashCommandHookSchema,
    PromptHookSchema,
    HttpHookSchema,
    AgentHookSchema,
    McpToolHookSchema,
  }
}

/**
 * Schema for hook command (excludes function hooks - they can't be persisted)
 *
 * The discriminatedUnion handles type-routing; the outer .superRefine() applies
 * cross-field invariants that discriminatedUnion members can't express (Zod
 * requires pure ZodObject members in a discriminatedUnion). Currently enforces
 * the `command` ⊕ `args` exclusivity introduced in v2.1.139.
 */
export const HookCommandSchema = lazySchema(() => {
  const {
    BashCommandHookSchema,
    PromptHookSchema,
    AgentHookSchema,
    HttpHookSchema,
    McpToolHookSchema,
  } = buildHookSchemas()
  return z
    .discriminatedUnion('type', [
      BashCommandHookSchema,
      PromptHookSchema,
      AgentHookSchema,
      HttpHookSchema,
      McpToolHookSchema,
    ])
    .superRefine((value, ctx) => {
      // [v2.1.139] Cross-field validation for the command hook variant: exactly
      // one of `command` / `args` must be set. Setting both is ambiguous (which
      // would actually run?); setting neither leaves nothing to spawn. We do
      // this at union level — putting .refine() on the inner schema would break
      // discriminatedUnion (Zod requires pure ZodObject members).
      if (value.type !== 'command') return
      const hasCommand = typeof value.command === 'string' && value.command.length > 0
      const hasArgs = Array.isArray(value.args) && value.args.length > 0
      if (hasCommand && hasArgs) {
        ctx.addIssue({
          code: 'custom',
          path: ['args'],
          message:
            'Command hook may set EITHER `command` (shell-string form) OR `args` (exec-form argv array), not both. Pick one: use `command` when you need shell features (pipes, redirects, glob); use `args` for safe path-with-spaces / no-shell-interpretation calls.',
        })
      } else if (!hasCommand && !hasArgs) {
        ctx.addIssue({
          code: 'custom',
          path: ['command'],
          message:
            'Command hook requires either `command` (shell-interpreted string) or `args` (exec-form argv array). Neither is set — the hook has nothing to run.',
        })
      }
    })
})

/**
 * Schema for matcher configuration with multiple hooks
 */
export const HookMatcherSchema = lazySchema(() =>
  z.object({
    matcher: z
      .string()
      .optional()
      .describe('String pattern to match (e.g. tool names like "Write")'), // String (e.g. Write) to match values related to the hook event, e.g. tool names
    hooks: z
      .array(HookCommandSchema())
      .describe('List of hooks to execute when the matcher matches'),
  }),
)

/**
 * Schema for hooks configuration
 * The key is the hook event. The value is an array of matcher configurations.
 * Uses partialRecord since not all hook events need to be defined.
 */
export const HooksSchema = lazySchema(() =>
  z.partialRecord(z.enum(HOOK_EVENTS), z.array(HookMatcherSchema())),
)

// Inferred types from schemas
export type HookCommand = z.infer<ReturnType<typeof HookCommandSchema>>
export type BashCommandHook = Extract<HookCommand, { type: 'command' }>
export type PromptHook = Extract<HookCommand, { type: 'prompt' }>
export type AgentHook = Extract<HookCommand, { type: 'agent' }>
export type HttpHook = Extract<HookCommand, { type: 'http' }>
export type McpToolHook = Extract<HookCommand, { type: 'mcp_tool' }>
export type HookMatcher = z.infer<ReturnType<typeof HookMatcherSchema>>
export type HooksSettings = Partial<Record<HookEvent, HookMatcher[]>>
