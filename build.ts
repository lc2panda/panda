import { readdir, readFile, writeFile } from "fs/promises";
import { join } from "path";
import type { BunPlugin } from "bun";

const outdir = "dist";

// Feature flags to enable in production builds.
// When a flag is in this set, `feature('FLAG')` is replaced with `true`;
// otherwise it is replaced with `false` (same as the default bun:bundle behaviour).
const ENABLED_FLAGS = new Set([
    "ABLATION_BASELINE",
    "AGENT_MEMORY_SNAPSHOT",
    "AGENT_TRIGGERS",
    "AGENT_TRIGGERS_REMOTE",
    "AGENT_TRIGGERS_RUN",
    "BG_SESSIONS",
    "BRIDGE_MODE",
    "BUDDY",
    "CCR_MIRROR",
    "CCR_REMOTE_SETUP",
    "CHICAGO_MCP",
    "CONTEXT_COLLAPSE",
    "COORDINATOR_MODE",
    "DAEMON",
    "DIRECT_CONNECT",
    "DUMP_SYSTEM_PROMPT",
    "EXPERIMENTAL_SKILL_SEARCH",
    "FORK_SUBAGENT",
    "HARD_FAIL",
    "HISTORY_SNIP",
    "KAIROS",
    "KAIROS_BRIEF",
    "KAIROS_CHANNELS",
    "KAIROS_GITHUB_WEBHOOKS",
    "LODESTONE",
    "MCP_SKILLS",
    "MONITOR_TOOL",
    "OVERFLOW_TEST_TOOL",
    "PROACTIVE",
    "SSH_REMOTE",
    "TERMINAL_PANEL",
    "TORCH",
    "TRANSCRIPT_CLASSIFIER",
    "UDS_INBOX",
    "ULTRAPLAN",
    "UPLOAD_USER_SETTINGS",
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

            // Only process files that reference bun:bundle
            if (!src.includes("bun:bundle")) return undefined;

            let code = src;

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

console.log(
    `Bundled ${result.outputs.length} files to ${outdir}/ (patched ${patched} for Node.js compat)`,
);
