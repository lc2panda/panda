#!/usr/bin/env bun
// Input: CLI 参数 + 环境变量 + feature flags
// Output: 启动 REPL 交互界面或 pipe 模式输出
// Pos: entrypoints/ 真正入口，注入 polyfill 后交给 main.tsx
// "一旦我被修改，请更新我的头部注释，以及所属文件夹的md。"
// bun:bundle feature() — dev mode uses `bun --feature=FLAG` to enable flags;
// build mode uses BunPlugin inline replacement (see build.ts).
import { feature } from 'bun:bundle';
if (typeof globalThis.MACRO === "undefined") {
    (globalThis as any).MACRO = {
        VERSION: "2.1.120",
        BUILD_TIME: new Date().toISOString(),
        FEEDBACK_CHANNEL: "",
        ISSUES_EXPLAINER: "",
        NATIVE_PACKAGE_URL: "@lc2panda/panda-code",
        PACKAGE_URL: "@lc2panda/panda-code",
        VERSION_CHANGELOG: "",
    };
}
// Build-time constants — normally replaced by Bun bundler at compile time
(globalThis as any).BUILD_TARGET = "external";
(globalThis as any).BUILD_ENV = "production";
(globalThis as any).INTERFACE_TYPE = "stdio";

process.env.DISABLE_INSTALLATION_CHECKS ??= '1';

// Panda: UNCONDITIONALLY disable nonessential traffic to Anthropic infrastructure.
// No Panda user is an Anthropic employee — none can reach internal endpoints
// (bridge, advisor, session upload, analytics, telemetry). With USER_TYPE baked to
// "ant" at build time, these 31 guard points would attempt connections to unreachable
// Anthropic infra → startup hang with no input bar.
// Matches clawgod approach: wrapper sets this env var BEFORE bundle loads.
process.env.CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC ??= '1';

// Panda: Enable ToolSearch for all providers. Without this, ToolSearch is
// silently disabled when ANTHROPIC_BASE_URL points to a non-Anthropic host
// (e.g. proxy, DeepSeek, Bedrock). The user can still override with =false.
process.env.ENABLE_TOOL_SEARCH ??= 'true';

// Panda: Default GrowthBook feature overrides
// Ensures all core features work regardless of GrowthBook remote availability.
// Anthropic native users: GrowthBook remote eval takes priority over these defaults
// because remoteEvalFeatureValues is checked before disk cache in getFeatureValue_CACHED_MAY_BE_STALE.
// These overrides only activate when GrowthBook is disabled (e.g. third-party providers).
if (!process.env.CLAUDE_INTERNAL_FC_OVERRIDES) {
  process.env.CLAUDE_INTERNAL_FC_OVERRIDES = JSON.stringify({
    // ── Agent Teams & Coordination ──
    tengu_harbor: true,
    tengu_amber_flint: true,
    tengu_auto_background_agents: true,
    tengu_agent_list_attach: true,
    tengu_slim_subagent_claudemd: true,
    // ── Session Memory ──
    tengu_session_memory: true,
    // ── Bridge / Remote Control ──
    tengu_ccr_bridge: true,
    tengu_bridge_repl_v2: true,
    tengu_cobalt_harbor: true,
    tengu_bridge_system_init: true,
    tengu_cobalt_lantern: true,
    // ── Voice kill-switch override (false = not killed = enabled) ──
    tengu_amber_quartz_disabled: false,
    // ── Keybindings & UI ──
    tengu_keybinding_customization_release: true,
    tengu_terminal_panel: true,
    tengu_terminal_sidebar: true,
    // ── Thinkback ──
    tengu_thinkback: true,
    // ── Kairos / Brief ──
    tengu_kairos_brief: true,
    tengu_kairos_brief_config: { enable_slash_command: true },
    // ── Ultrareview / Bughunter ──
    tengu_review_bughunter_config: { enabled: true },
    // ── Computer Use ──
    tengu_malort_pedway: { enabled: true },
    // ── Advisor ──
    tengu_sage_compass: { enabled: true, canUserConfigure: true },
    // ── Model & API behavior ──
    tengu_amber_stoat: true,
    tengu_birch_trellis: true,
    tengu_collage_kaleidoscope: true,
    tengu_turtle_carbon: true,
    tengu_attribution_header: true,
    // ── Skill improvement ──
    tengu_copper_panda: true,
    // ── Deep links ──
    tengu_lodestone_enabled: true,
    // ── Idle return hints ──
    tengu_willow_mode: 'hint_v2',
    // ── Prompt Cache 1h TTL ──
    // Unlocks 1-hour prompt caching for all query sources (vs default 5-min).
    // USER_TYPE=ant already passes the eligibility check; the allowlist wildcard
    // ensures all querySource values (repl_main_thread, sdk, hook_agent, etc.) match.
    tengu_prompt_cache_1h_config: { allowlist: ['*'] },
    // ── General ──
    tengu_destructive_command_warning: true,
    tengu_immediate_model_command: true,
    tengu_desktop_upsell: false,
  });
}

try {
    const _h = require('os').homedir();
    const _r = require('fs').readFileSync(require('path').join(_h, '.pandacc.json'), 'utf-8');
    const _c = JSON.parse(_r);
    if (_c.thirdPartyProvider) {
        process.env.ANTHROPIC_BASE_URL = _c.thirdPartyProvider.baseURL;
        process.env.ANTHROPIC_AUTH_TOKEN = _c.thirdPartyProvider.apiKey;
        process.env.ANTHROPIC_MODEL = _c.thirdPartyProvider.model;
        if (_c.thirdPartyProvider.contextWindow) {
            process.env.CLAUDE_CODE_MAX_CONTEXT_TOKENS = String(_c.thirdPartyProvider.contextWindow);
        }
    }
} catch (e: any) {
  if (e?.code !== 'ENOENT' && e?.code !== 'MODULE_NOT_FOUND') {
    console.error(`[panda] .pandacc.json 加载失败: ${e?.message || e}`)
  }
}

// ─── settings.json proxy 注入 ────────────────────────────────────────────────
// 作战线 N：Option A 根治方案 —— 在 SDK 初始化前从 ~/.pandacc/settings.json
// 读取 proxy 字段写入 env。env 最优先，用户临时 `HTTPS_PROXY=... bun ...` 仍可覆盖。
// 支持两种形式：
//   "proxy": "http://127.0.0.1:7897"                           ← 字符串：https/http 都用它
//   "proxy": { "https": "...", "http": "...", "noProxy": "..." } ← 对象：分别指定
// Anthropic SDK 天然读 HTTPS_PROXY/HTTP_PROXY env，byte-equal 契约不变。
try {
    const _osMod = require('os');
    const _fsMod = require('fs');
    const _pathMod = require('path');
    const _cfgDir: string =
        process.env.PANDA_CONFIG_DIR ||
        process.env.CLAUDE_CONFIG_DIR ||
        _pathMod.join(_osMod.homedir(), '.pandacc');
    const _settingsPath = _pathMod.join(_cfgDir, 'settings.json');
    const _settingsRaw = _fsMod.readFileSync(_settingsPath, 'utf-8');
    const _settings = JSON.parse(_settingsRaw);
    const _proxyCfg = _settings?.proxy;
    if (_proxyCfg) {
        const _httpsProxy: string | undefined =
            typeof _proxyCfg === 'string' ? _proxyCfg : _proxyCfg?.https;
        const _httpProxy: string | undefined =
            typeof _proxyCfg === 'string'
                ? _proxyCfg
                : (_proxyCfg?.http ?? _proxyCfg?.https);
        if (_httpsProxy && !process.env.HTTPS_PROXY && !process.env.https_proxy) {
            process.env.HTTPS_PROXY = _httpsProxy;
            // 中文日志：让指挥官实测时能确认注入生效
            if (process.env.PANDA_DEBUG || process.env.PANDA_PROXY_DEBUG) {
                process.stderr.write(
                    `[panda] 使用 settings.json proxy: ${_httpsProxy}\n`,
                );
            }
        }
        if (_httpProxy && !process.env.HTTP_PROXY && !process.env.http_proxy) {
            process.env.HTTP_PROXY = _httpProxy;
        }
        if (typeof _proxyCfg !== 'string' && _proxyCfg?.noProxy) {
            const _nop = Array.isArray(_proxyCfg.noProxy)
                ? _proxyCfg.noProxy.join(',')
                : String(_proxyCfg.noProxy);
            if (_nop && !process.env.NO_PROXY && !process.env.no_proxy) {
                process.env.NO_PROXY = _nop;
            }
        }
    }
} catch (e: any) {
    // 缺文件/解析失败不致命：保持旧行为，静默跳过
    if (e?.code !== 'ENOENT' && e?.code !== 'MODULE_NOT_FOUND') {
        if (process.env.PANDA_DEBUG || process.env.PANDA_PROXY_DEBUG) {
            process.stderr.write(
                `[panda] settings.json proxy 加载失败（忽略）: ${e?.message || e}\n`,
            );
        }
    }
}

// ─── CLI flag --proxy 一次性覆盖（优先级最高，用户临时绕过 settings/env） ───
// 在 commander 解析前直接扫 argv，避免动到 main.tsx 巨型 program 定义。
// 用法：panda --proxy http://127.0.0.1:7897 -p "..."
try {
    const _argv = process.argv.slice(2);
    const _idx = _argv.findIndex((a: string) => a === '--proxy' || a.startsWith('--proxy='));
    if (_idx !== -1) {
        const _val = _argv[_idx]!.startsWith('--proxy=')
            ? _argv[_idx]!.slice('--proxy='.length)
            : _argv[_idx + 1];
        if (typeof _val === 'string' && _val.length > 0) {
            process.env.HTTPS_PROXY = _val;
            process.env.HTTP_PROXY = _val;
            if (process.env.PANDA_DEBUG || process.env.PANDA_PROXY_DEBUG) {
                process.stderr.write(`[panda] --proxy 覆盖：${_val}\n`);
            }
            // 把 --proxy（及其值）从 argv 移除，防止 commander strict 报错。
            // process.argv[0..1] 是 node/bun + entry，所以 argv 偏移 +2。
            const _removeCount = _argv[_idx]!.startsWith('--proxy=') ? 1 : 2;
            process.argv.splice(_idx + 2, _removeCount);
        }
    }
} catch {}

// Bugfix for corepack auto-pinning, which adds yarnpkg to peoples' package.jsons
// eslint-disable-next-line custom-rules/no-top-level-side-effects
process.env.COREPACK_ENABLE_AUTO_PIN = "0";

// Set max heap size for child processes in CCR environments (containers have 16GB)
// eslint-disable-next-line custom-rules/no-top-level-side-effects, custom-rules/no-process-env-top-level, custom-rules/safe-env-boolean-check
if (process.env.CLAUDE_CODE_REMOTE === "true") {
    // eslint-disable-next-line custom-rules/no-top-level-side-effects, custom-rules/no-process-env-top-level
    const existing = process.env.NODE_OPTIONS || "";
    // eslint-disable-next-line custom-rules/no-top-level-side-effects, custom-rules/no-process-env-top-level
    process.env.NODE_OPTIONS = existing
        ? `${existing} --max-old-space-size=8192`
        : "--max-old-space-size=8192";
}

// Harness-science L0 ablation baseline. Inlined here (not init.ts) because
// BashTool/AgentTool/PowerShellTool capture DISABLE_BACKGROUND_TASKS into
// module-level consts at import time — init() runs too late. feature() gate
// DCEs this entire block from external builds.
// eslint-disable-next-line custom-rules/no-top-level-side-effects, custom-rules/no-process-env-top-level
if (feature("ABLATION_BASELINE") && process.env.CLAUDE_CODE_ABLATION_BASELINE) {
    for (const k of [
        "CLAUDE_CODE_SIMPLE",
        "CLAUDE_CODE_DISABLE_THINKING",
        "DISABLE_INTERLEAVED_THINKING",
        "DISABLE_COMPACT",
        "DISABLE_AUTO_COMPACT",
        "CLAUDE_CODE_DISABLE_AUTO_MEMORY",
        "CLAUDE_CODE_DISABLE_BACKGROUND_TASKS",
    ]) {
        // eslint-disable-next-line custom-rules/no-top-level-side-effects, custom-rules/no-process-env-top-level
        process.env[k] ??= "1";
    }
}

/**
 * Bootstrap entrypoint - checks for special flags before loading the full CLI.
 * All imports are dynamic to minimize module evaluation for fast paths.
 * Fast-path for --version has zero imports beyond this file.
 */
async function main(): Promise<void> {
    // Windows UTF-8 encoding fix: change both terminal codepage AND output encoding
    if (process.platform === 'win32') {
        try {
            // Step 1: Change terminal codepage to UTF-8 (65001)
            require('child_process').execSync('chcp 65001 >nul 2>&1', {
                stdio: 'pipe',
                windowsHide: true
            });

            // Step 2: Set stdout/stderr encoding to match terminal
            process.stdout.setDefaultEncoding('utf8');
            process.stderr.setDefaultEncoding('utf8');
        } catch (error) {
            // Fallback: if chcp fails, don't change encoding (keep consistency)
        }
    }

    const args = process.argv.slice(2);

    // Fast-path for --version/-v: zero module loading needed
    if (
        args.length === 1 &&
        (args[0] === "--version" || args[0] === "-v" || args[0] === "-V")
    ) {
        // MACRO.VERSION is inlined at build time
        // biome-ignore lint/suspicious/noConsole:: intentional console output
        console.log(`${MACRO.VERSION} (Panda)`);
        return;
    }

    // W4-T1 fast-path：panda --install-desk → 触发 packages/panda-on-desk
    // 子包 deps 安装（electron@41 等）。轻量路径：不走 enableConfigs/profiler/sinks，
    // 直接 dynamic import handler。失败 exit 1，成功 exit 0。
    // why fast-path：用户期望此命令秒级启动 npm install，不应被 main.tsx ~135ms imports 拖累
    if (args.length === 1 && args[0] === "--install-desk") {
        const { runDeskInstall } = await import(
            "../cli/handlers/desk-install.js"
        );
        const code = await runDeskInstall();
        // process.exit (not return) — 防止后续 lazy import 副作用阻塞退出
        // eslint-disable-next-line custom-rules/no-process-exit
        process.exit(code);
    }

    // For all other paths, load the startup profiler
    const { profileCheckpoint } = await import("../utils/startupProfiler.js");
    profileCheckpoint("cli_entry");

    // Fast-path for --dump-system-prompt: output the rendered system prompt and exit.
    // Used by prompt sensitivity evals to extract the system prompt at a specific commit.
    // Ant-only: eliminated from external builds via feature flag.
    if (feature("DUMP_SYSTEM_PROMPT") && args[0] === "--dump-system-prompt") {
        profileCheckpoint("cli_dump_system_prompt_path");
        const { enableConfigs } = await import("../utils/config.js");
        enableConfigs();
        const { getMainLoopModel } = await import("../utils/model/model.js");
        const modelIdx = args.indexOf("--model");
        const model =
            (modelIdx !== -1 && args[modelIdx + 1]) || getMainLoopModel();
        const { getSystemPrompt } = await import("../constants/prompts.js");
        const prompt = await getSystemPrompt([], model);
        // biome-ignore lint/suspicious/noConsole:: intentional console output
        console.log(prompt.join("\n"));
        return;
    }
    if (process.argv[2] === "--claude-in-chrome-mcp") {
        profileCheckpoint("cli_claude_in_chrome_mcp_path");
        const { runClaudeInChromeMcpServer } =
            await import("../utils/claudeInChrome/mcpServer.js");
        await runClaudeInChromeMcpServer();
        return;
    } else if (process.argv[2] === "--chrome-native-host") {
        profileCheckpoint("cli_chrome_native_host_path");
        const { runChromeNativeHost } =
            await import("../utils/claudeInChrome/chromeNativeHost.js");
        await runChromeNativeHost();
        return;
    } else if (
        feature("CHICAGO_MCP") &&
        process.argv[2] === "--computer-use-mcp"
    ) {
        profileCheckpoint("cli_computer_use_mcp_path");
        const { runComputerUseMcpServer } =
            await import("../utils/computerUse/mcpServer.js");
        await runComputerUseMcpServer();
        return;
    }

    // Fast-path for `--daemon-worker=<kind>` (internal — supervisor spawns this).
    // Must come before the daemon subcommand check: spawned per-worker, so
    // perf-sensitive. No enableConfigs(), no analytics sinks at this layer —
    // workers are lean. If a worker kind needs configs/auth (assistant will),
    // it calls them inside its run() fn.
    if (feature("DAEMON") && args[0] === "--daemon-worker") {
        const { runDaemonWorker } = await import("../daemon/workerRegistry.js");
        await runDaemonWorker(args[1]);
        return;
    }

    // Fast-path for `claude remote-control` (also accepts legacy `claude remote` / `claude sync` / `claude bridge`):
    // serve local machine as bridge environment.
    // feature() must stay inline for build-time dead code elimination;
    // isBridgeEnabled() checks the runtime GrowthBook gate.
    if (
        feature("BRIDGE_MODE") &&
        (args[0] === "remote-control" ||
            args[0] === "rc" ||
            args[0] === "remote" ||
            args[0] === "sync" ||
            args[0] === "bridge")
    ) {
        profileCheckpoint("cli_bridge_path");
        const { enableConfigs } = await import("../utils/config.js");
        enableConfigs();
        const { getBridgeDisabledReason, checkBridgeMinVersion } =
            await import("../bridge/bridgeEnabled.js");
        const { BRIDGE_LOGIN_ERROR } = await import("../bridge/types.js");
        const { bridgeMain } = await import("../bridge/bridgeMain.js");
        const { exitWithError } = await import("../utils/process.js");

        // Auth check must come before the GrowthBook gate check — without auth,
        // GrowthBook has no user context and would return a stale/default false.
        // getBridgeDisabledReason awaits GB init, so the returned value is fresh
        // (not the stale disk cache), but init still needs auth headers to work.
        const { getClaudeAIOAuthTokens } = await import("../utils/auth.js");
        if (!getClaudeAIOAuthTokens()?.accessToken) {
            exitWithError(BRIDGE_LOGIN_ERROR);
        }
        const disabledReason = await getBridgeDisabledReason();
        if (disabledReason) {
            exitWithError(`Error: ${disabledReason}`);
        }
        const versionError = checkBridgeMinVersion();
        if (versionError) {
            exitWithError(versionError);
        }

        // Bridge is a remote control feature - check policy limits
        const { waitForPolicyLimitsToLoad, isPolicyAllowed } =
            await import("../services/policyLimits/index.js");
        await waitForPolicyLimitsToLoad();
        if (!isPolicyAllowed("allow_remote_control")) {
            exitWithError(
                "Error: Remote Control is disabled by your organization's policy.",
            );
        }
        await bridgeMain(args.slice(1));
        return;
    }

    // Fast-path for `claude daemon [subcommand]`: long-running supervisor.
    if (feature("DAEMON") && args[0] === "daemon") {
        profileCheckpoint("cli_daemon_path");
        const { enableConfigs } = await import("../utils/config.js");
        enableConfigs();
        const { initSinks } = await import("../utils/sinks.js");
        initSinks();
        const { daemonMain } = await import("../daemon/main.js");
        await daemonMain(args.slice(1));
        return;
    }

    // Fast-path for `claude ps|logs|attach|kill` and `--bg`/`--background`.
    // Session management against the ~/.pandacc/sessions/ registry. Flag
    // literals are inlined so bg.js only loads when actually dispatching.
    if (
        feature("BG_SESSIONS") &&
        (args[0] === "ps" ||
            args[0] === "logs" ||
            args[0] === "attach" ||
            args[0] === "kill" ||
            args.includes("--bg") ||
            args.includes("--background"))
    ) {
        profileCheckpoint("cli_bg_path");
        const { enableConfigs } = await import("../utils/config.js");
        enableConfigs();
        const bg = await import("../cli/bg.js");
        switch (args[0]) {
            case "ps":
                await bg.psHandler(args.slice(1));
                break;
            case "logs":
                await bg.logsHandler(args[1]);
                break;
            case "attach":
                await bg.attachHandler(args[1]);
                break;
            case "kill":
                await bg.killHandler(args[1]);
                break;
            default:
                await bg.handleBgFlag(args);
        }
        return;
    }

    // Fast-path for template job commands.
    if (
        feature("TEMPLATES") &&
        (args[0] === "new" || args[0] === "list" || args[0] === "reply")
    ) {
        profileCheckpoint("cli_templates_path");
        const { templatesMain } =
            await import("../cli/handlers/templateJobs.js");
        await templatesMain(args);
        // process.exit (not return) — mountFleetView's Ink TUI can leave event
        // loop handles that prevent natural exit.
        // eslint-disable-next-line custom-rules/no-process-exit
        process.exit(0);
    }

    // Fast-path for `claude environment-runner`: headless BYOC runner.
    // feature() must stay inline for build-time dead code elimination.
    if (
        feature("BYOC_ENVIRONMENT_RUNNER") &&
        args[0] === "environment-runner"
    ) {
        profileCheckpoint("cli_environment_runner_path");
        const { environmentRunnerMain } =
            await import("../environment-runner/main.js");
        await environmentRunnerMain(args.slice(1));
        return;
    }

    // Fast-path for `claude self-hosted-runner`: headless self-hosted-runner
    // targeting the SelfHostedRunnerWorkerService API (register + poll; poll IS
    // heartbeat). feature() must stay inline for build-time dead code elimination.
    if (feature("SELF_HOSTED_RUNNER") && args[0] === "self-hosted-runner") {
        profileCheckpoint("cli_self_hosted_runner_path");
        const { selfHostedRunnerMain } =
            await import("../self-hosted-runner/main.js");
        await selfHostedRunnerMain(args.slice(1));
        return;
    }

    // Fast-path for --worktree --tmux: exec into tmux before loading full CLI
    const hasTmuxFlag =
        args.includes("--tmux") || args.includes("--tmux=classic");
    if (
        hasTmuxFlag &&
        (args.includes("-w") ||
            args.includes("--worktree") ||
            args.some((a) => a.startsWith("--worktree=")))
    ) {
        profileCheckpoint("cli_tmux_worktree_fast_path");
        const { enableConfigs } = await import("../utils/config.js");
        enableConfigs();
        const { isWorktreeModeEnabled } =
            await import("../utils/worktreeModeEnabled.js");
        if (isWorktreeModeEnabled()) {
            const { execIntoTmuxWorktree } =
                await import("../utils/worktree.js");
            const result = await execIntoTmuxWorktree(args);
            if (result.handled) {
                return;
            }
            // If not handled (e.g., error), fall through to normal CLI
            if (result.error) {
                const { exitWithError } = await import("../utils/process.js");
                exitWithError(result.error);
            }
        }
    }

    // Redirect common update flag mistakes to the update subcommand
    if (
        args.length === 1 &&
        (args[0] === "--update" || args[0] === "--upgrade")
    ) {
        process.argv = [process.argv[0]!, process.argv[1]!, "update"];
    }

    // --bare: set SIMPLE early so gates fire during module eval / commander
    // option building (not just inside the action handler).
    if (args.includes("--bare")) {
        process.env.CLAUDE_CODE_SIMPLE = "1";
    }

    // No special flags detected, load and run the full CLI
    const { startCapturingEarlyInput } = await import("../utils/earlyInput.js");
    startCapturingEarlyInput();
    profileCheckpoint("cli_before_main_import");
    const { main: cliMain } = await import("../main.jsx");
    profileCheckpoint("cli_after_main_import");
    await cliMain();
    profileCheckpoint("cli_after_main_complete");
}

// eslint-disable-next-line custom-rules/no-top-level-side-effects
void main();
