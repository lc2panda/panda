# CLAUDE.md

This file provides guidance to Panda Code when working with code in this repository.

## Project Overview

**Panda Code** — forked from CCB (Claude Code Best), a reverse-engineered version of Anthropic's Claude Code CLI (v2.1.88). All 92 feature flags are enabled. All feature-gated modules (tools, commands, skills, YOLO classifier) have been reverse-engineered and implemented. Brand identity: "Panda Code" with pixel-art panda logo.

## Commands

```bash
# Install dependencies
bun install

# Dev mode (all 92 feature flags enabled via scripts/dev.sh)
bun run dev

# Build (outputs dist/ with ~529 JS files, all flags inlined as true)
bun run build

# Pipe mode
echo "say hello" | bash scripts/dev.sh -p
```

## Architecture

### Runtime & Build

- **Runtime**: Bun (not Node.js). All imports, builds, and execution use Bun APIs.
- **Build**: `bun build src/entrypoints/cli.tsx --outdir dist --target bun` — single-file bundle.
- **Module system**: ESM (`"type": "module"`), TSX with `react-jsx` transform.
- **Monorepo**: Bun workspaces — internal packages live in `packages/` resolved via `workspace:*`.

### Entry & Bootstrap

1. **`src/entrypoints/cli.tsx`** — True entrypoint. Injects runtime polyfills at the top:
   - `feature()` always returns `false` (all feature flags disabled, skipping unimplemented branches).
   - `globalThis.MACRO` — simulates build-time macro injection (VERSION, BUILD_TIME, etc.).
   - `BUILD_TARGET`, `BUILD_ENV`, `INTERFACE_TYPE` globals.
2. **`src/main.tsx`** — Commander.js CLI definition. Parses args, initializes services (auth, analytics, policy), then launches the REPL or runs in pipe mode.
3. **`src/entrypoints/init.ts`** — One-time initialization (telemetry, config, trust dialog).

### Core Loop

- **`src/query.ts`** — The main API query function. Sends messages to Claude API, handles streaming responses, processes tool calls, and manages the conversation turn loop.
- **`src/QueryEngine.ts`** — Higher-level orchestrator wrapping `query()`. Manages conversation state, compaction, file history snapshots, attribution, and turn-level bookkeeping. Used by the REPL screen.
- **`src/screens/REPL.tsx`** — The interactive REPL screen (React/Ink component). Handles user input, message display, tool permission prompts, and keyboard shortcuts.

### API Layer

- **`src/services/api/claude.ts`** — Core API client. Builds request params (system prompt, messages, tools, betas), calls the Anthropic SDK streaming endpoint, and processes `BetaRawMessageStreamEvent` events.
- Supports multiple providers: Anthropic direct, AWS Bedrock, Google Vertex, Azure.
- Provider selection in `src/utils/model/providers.ts`.

### Tool System

- **`src/Tool.ts`** — Tool interface definition (`Tool` type) and utilities (`findToolByName`, `toolMatchesName`).
- **`src/tools.ts`** — Tool registry. Assembles the tool list; some tools are conditionally loaded via `feature()` flags or `process.env.USER_TYPE`.
- **`src/tools/<ToolName>/`** — Each tool in its own directory (e.g., `BashTool`, `FileEditTool`, `GrepTool`, `AgentTool`).
- Tools define: `name`, `description`, `inputSchema` (JSON Schema), `call()` (execution), and optionally a React component for rendering results.

### UI Layer (Ink)

- **`src/ink.ts`** — Ink render wrapper with ThemeProvider injection.
- **`src/ink/`** — Custom Ink framework (forked/internal): custom reconciler, hooks (`useInput`, `useTerminalSize`, `useSearchHighlight`), virtual list rendering.
- **`src/components/`** — React components rendered in terminal via Ink. Key ones:
  - `App.tsx` — Root provider (AppState, Stats, FpsMetrics).
  - `Messages.tsx` / `MessageRow.tsx` — Conversation message rendering.
  - `PromptInput/` — User input handling.
  - `permissions/` — Tool permission approval UI.
- Components use React Compiler runtime (`react/compiler-runtime`) — decompiled output has `_c()` memoization calls throughout.

### State Management

- **`src/state/AppState.tsx`** — Central app state type and context provider. Contains messages, tools, permissions, MCP connections, etc.
- **`src/state/store.ts`** — Zustand-style store for AppState.
- **`src/bootstrap/state.ts`** — Module-level singletons for session-global state (session ID, CWD, project root, token counts).

### Context & System Prompt

- **`src/context.ts`** — Builds system/user context for the API call (git status, date, CLAUDE.md contents, memory files).
- **`src/utils/claudemd.ts`** — Discovers and loads CLAUDE.md files from project hierarchy.

### Feature Flag System

`feature('FLAG_NAME')` calls use `bun:bundle` (a Bun compile-time macro).

- **Dev mode**: `scripts/dev.sh` passes all 92 `--feature=FLAG` arguments to Bun, enabling every flag at runtime.
- **Build mode**: `build.ts` uses a BunPlugin `onLoad` hook that strips `bun:bundle` imports and inline-replaces each `feature('X')` call with `true` or `false` based on `ENABLED_FLAGS`. This preserves Bun's dead-code elimination for any flags intentionally left off.
- **Adding a new flag**: Add to `ENABLED_FLAGS` in `build.ts` and `--feature=FLAG` in `scripts/dev.sh`.

All 92 flags discovered in source are currently enabled.

### Internal Packages

| Package | Status |
|---------|--------|
| `color-diff-napi` | Full TS implementation (syntax-highlighted diff) |
| `audio-capture-napi` | SoX/arecord alternative |
| `image-processor-napi` | sharp + osascript alternative |
| `modifiers-napi` | Bun FFI + Carbon |
| `url-handler-napi` | Stub (null fallback) |
| `@ant/computer-use-mcp` | Type-safe stub + sentinel apps |
| `@ant/computer-use-input` | macOS AppleScript/JXA |
| `@ant/computer-use-swift` | macOS JXA/screencapture |
| `@ant/claude-for-chrome-mcp` | Stub |

### Key Type Files

- **`src/types/global.d.ts`** — Declares `MACRO`, `BUILD_TARGET`, `BUILD_ENV` and internal Anthropic-only identifiers.
- **`src/types/internal-modules.d.ts`** — Type declarations for `bun:bundle`, `bun:ffi`, `@anthropic-ai/mcpb`.
- **`src/types/message.ts`** — Message type hierarchy (UserMessage, AssistantMessage, SystemMessage, etc.).
- **`src/types/permissions.ts`** — Permission mode and result types.

## Working with This Codebase

- **Don't try to fix all tsc errors** — they're from decompilation and don't affect runtime.
- **All feature flags are ON** — both dev and build modes enable all 92 flags. No code paths are dead.
- **React Compiler output** — Components have decompiled memoization boilerplate (`const $ = _c(N)`). This is normal.
- **`bun:bundle` import** — `import { feature } from 'bun:bundle'` is used throughout. Dev mode: Bun native `--feature=FLAG`. Build mode: plugin inline-replaces to `true`/`false`.
- **`src/` path alias** — tsconfig maps `src/*` to `./src/*`. Imports like `import { ... } from 'src/utils/...'` are valid.
- **Brand: "Panda Code"** — all user-visible strings use "Panda Code", not "Claude Code". Logo is a pixel-art panda in `src/components/LogoV2/Clawd.tsx`.
