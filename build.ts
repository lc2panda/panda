import { readdir, readFile, writeFile } from "fs/promises";
import { join } from "path";
import type { BunPlugin } from "bun";

const outdir = "dist";

// Read package.json for MACRO injection
const pkg = JSON.parse(await Bun.file("package.json").text());
const PANDA_MACROS = {
    VERSION: "2.1.92",
    PACKAGE_URL: pkg.name,
    NATIVE_PACKAGE_URL: pkg.name,
};

// Feature flags to enable in production builds.
// When a flag is in this set, `feature('FLAG')` is replaced with `true`;
// otherwise it is replaced with `false` (same as the default bun:bundle behaviour).
const ENABLED_FLAGS = new Set([
    "ABLATION_BASELINE",
    "AGENT_MEMORY_SNAPSHOT",
    "AGENT_TRIGGERS",
    "AGENT_TRIGGERS_REMOTE",
    "ALLOW_TEST_VERSIONS",
    "ANTI_DISTILLATION_CC",
    "AUTO_THEME",
    "AWAY_SUMMARY",
    "BASH_CLASSIFIER",
    "BG_SESSIONS",
    "BREAK_CACHE_COMMAND",
    "BRIDGE_MODE",
    "BUDDY",
    "BUILDING_CLAUDE_APPS",
    "BUILTIN_EXPLORE_PLAN_AGENTS",
    "BYOC_ENVIRONMENT_RUNNER",
    "CACHED_MICROCOMPACT",
    "CCR_AUTO_CONNECT",
    "CCR_MIRROR",
    "CCR_REMOTE_SETUP",
    "CHICAGO_MCP",
    "COMMIT_ATTRIBUTION",
    "COMPACTION_REMINDERS",
    "CONNECTOR_TEXT",
    "CONTEXT_COLLAPSE",
    "COORDINATOR_MODE",
    "COWORKER_TYPE_TELEMETRY",
    "DAEMON",
    "DIRECT_CONNECT",
    "DOWNLOAD_USER_SETTINGS",
    "DUMP_SYSTEM_PROMPT",
    "ENHANCED_TELEMETRY_BETA",
    "EXPERIMENTAL_SKILL_SEARCH",
    "EXTRACT_MEMORIES",
    "FILE_PERSISTENCE",
    "FORK_SUBAGENT",
    "HARD_FAIL",
    "HISTORY_PICKER",
    "HISTORY_SNIP",
    "HOOK_PROMPTS",
    "IS_LIBC_GLIBC",
    "IS_LIBC_MUSL",
    "KAIROS",
    "KAIROS_BRIEF",
    "KAIROS_CHANNELS",
    "KAIROS_DREAM",
    "KAIROS_GITHUB_WEBHOOKS",
    "KAIROS_PUSH_NOTIFICATION",
    "LODESTONE",
    "MCP_RICH_OUTPUT",
    "MCP_SKILLS",
    "MEMORY_SHAPE_TELEMETRY",
    "MESSAGE_ACTIONS",
    "MONITOR_TOOL",
    "NATIVE_CLIENT_ATTESTATION",
    "NATIVE_CLIPBOARD_IMAGE",
    "NEW_INIT",
    "OVERFLOW_TEST_TOOL",
    "PERFETTO_TRACING",
    "POWERSHELL_AUTO_MODE",
    "PROACTIVE",
    "PROMPT_CACHE_BREAK_DETECTION",
    "QUICK_SEARCH",
    "REACTIVE_COMPACT",
    "REVIEW_ARTIFACT",
    "RUN_SKILL_GENERATOR",
    "SELF_HOSTED_RUNNER",
    "SHOT_STATS",
    "SKILL_IMPROVEMENT",
    "SKIP_DETECTION_WHEN_AUTOUPDATES_DISABLED",
    "SLOW_OPERATION_LOGGING",
    "SSH_REMOTE",
    "STREAMLINED_OUTPUT",
    "TEAMMEM",
    "TEMPLATES",
    "TERMINAL_PANEL",
    "TOKEN_BUDGET",
    "TORCH",
    "TRANSCRIPT_CLASSIFIER",
    "TREE_SITTER_BASH",
    "TREE_SITTER_BASH_SHADOW",
    // "UDS_INBOX", // disabled: binds Unix domain socket, blocks process in pipe mode
    "ULTRAPLAN",
    "ULTRATHINK",
    "UNATTENDED_RETRY",
    "UPLOAD_USER_SETTINGS",
    "VERIFICATION_AGENT",
    "VOICE_MODE",
    "WEB_BROWSER_TOOL",
    "WORKFLOW_SCRIPTS",
]);

// BunPlugin: inline-replace `feature('FLAG')` calls and strip `bun:bundle` imports
const featureFlagPlugin: BunPlugin = {
    name: "feature-flag-inline",
    setup(build) {
        build.onLoad({ filter: /\.tsx?$/ }, async (args) => {
            // Skip node_modules
            if (args.path.includes("node_modules")) return undefined;

            const src = await Bun.file(args.path).text();

            const hasBunBundle = src.includes("bun:bundle");
            const hasUserType = src.includes('"external" as string');
            const hasUserTypeEnv = src.includes('process.env.USER_TYPE');
            const hasMacro = src.includes('MACRO') && args.path.includes('cli.tsx');

            if (!hasBunBundle && !hasUserType && !hasUserTypeEnv && !hasMacro) return undefined;

            let code = src;

            if (hasBunBundle) {
                // Remove `import { ... } from 'bun:bundle'` (single or double quotes)
                code = code.replace(
                    /import\s*\{[^}]*\}\s*from\s*['"]bun:bundle['"]\s*;?\n?/g,
                    "",
                );

                // Replace `feature('FLAG')` / `feature("FLAG")` calls.
                // The call site may have a trailing comma and whitespace inside parens,
                // e.g. `feature(\n  'FLAG',\n)`.
                code = code.replace(
                    /feature\(\s*['"]([^'"]+)['"]\s*,?\s*\)/g,
                    (_match, flag: string) => (ENABLED_FLAGS.has(flag) ? "true" : "false"),
                );
            }

            code = code.replace(/\("external"\s+as\s+string\)/g, '("ant" as string)');

            // Replace process.env.USER_TYPE runtime checks to "ant" at build time.
            // This unlocks ALL ant-only code paths (commands, GrowthBook, debug,
            // bridge debug, model options, enhanced prompts, etc.).
            // Safe because cli.tsx sets CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1
            // for third-party providers, which prevents Anthropic infrastructure
            // connections (bridge, advisor, session upload, analytics) from hanging.
            // Matches clawgod approach: global USER_TYPE=ant + traffic guard rails.
            code = code.replace(/process\.env\.USER_TYPE/g, '"ant"');

            // Replace MACRO defaults in cli.tsx with build-time values from package.json
            if (hasMacro) {
                code = code.replace(/VERSION: "[\d.]+"/, `VERSION: "${PANDA_MACROS.VERSION}"`);
                code = code.replace(/PACKAGE_URL: ""/, `PACKAGE_URL: "${PANDA_MACROS.PACKAGE_URL}"`);
                code = code.replace(/NATIVE_PACKAGE_URL: ""/, `NATIVE_PACKAGE_URL: "${PANDA_MACROS.NATIVE_PACKAGE_URL}"`);
            }

            return {
                contents: code,
                loader: args.path.endsWith(".tsx") ? "tsx" : "ts",
            };
        });
    },
};

// Step 1: Clean output directory
const { rmSync } = await import("fs");
rmSync(outdir, { recursive: true, force: true });

// Step 2: Bundle with splitting
const result = await Bun.build({
    entrypoints: ["src/entrypoints/cli.tsx"],
    outdir,
    target: "bun",
    splitting: true,
    plugins: [featureFlagPlugin],
});

if (!result.success) {
    console.error("Build failed:");
    for (const log of result.logs) {
        console.error(log);
    }
    process.exit(1);
}

// Step 3: Post-process — replace Bun-only `import.meta.require` with Node.js compatible version
const files = await readdir(outdir);
const IMPORT_META_REQUIRE = "var __require = import.meta.require;";
const COMPAT_REQUIRE = `var __require = typeof import.meta.require === "function" ? import.meta.require : (await import("module")).createRequire(import.meta.url);`;

let patched = 0;
for (const file of files) {
    if (!file.endsWith(".js")) continue;
    const filePath = join(outdir, file);
    const content = await readFile(filePath, "utf-8");
    if (content.includes(IMPORT_META_REQUIRE)) {
        await writeFile(
            filePath,
            content.replace(IMPORT_META_REQUIRE, COMPAT_REQUIRE),
        );
        patched++;
    }
}

// Step 4: Ensure dist/cli.js has a shebang for `npm install -g` / `npx` usage
const cliPath = join(outdir, "cli.js");
const cliContent = await readFile(cliPath, "utf-8");
if (!cliContent.startsWith("#!")) {
    await writeFile(cliPath, `#!/usr/bin/env node\n${cliContent}`);
}

console.log(
    `Bundled ${result.outputs.length} files to ${outdir}/ (patched ${patched} for Node.js compat)`,
);
