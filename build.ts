import { readdir, readFile, writeFile } from "fs/promises";
import { join } from "path";
import type { BunPlugin } from "bun";

const outdir = "dist";

const ENABLED_FLAGS = new Set([
    "BG_SESSIONS",
    "HARD_FAIL",
]);

const featureFlagsPlugin: BunPlugin = {
    name: "feature-flags",
    setup(build) {
        build.onLoad({ filter: /\.tsx?$/ }, async (args) => {
            if (args.path.includes("node_modules")) return;

            const text = await Bun.file(args.path).text();
            if (!text.includes("bun:bundle")) return;

            const contents = text
                .replace(
                    /import\s*\{[^}]*\}\s*from\s*['"]bun:bundle['"]\s*;?/g,
                    "",
                )
                .replace(
                    /feature\(\s*['"]([^'"]+)['"]\s*,?\s*\)/g,
                    (_, flag) => (ENABLED_FLAGS.has(flag) ? "true" : "false"),
                );

            return {
                contents,
                loader: args.path.endsWith(".tsx") ? "tsx" : "ts",
            };
        });
    },
};

// Step 1: Clean output directory
const { rmSync } = await import("fs");
rmSync(outdir, { recursive: true, force: true });

// Step 2: Bundle with splitting + feature flags inlining
const result = await Bun.build({
    entrypoints: ["src/entrypoints/cli.tsx"],
    outdir,
    target: "bun",
    splitting: true,
    plugins: [featureFlagsPlugin],
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
console.log(
    `Feature flags enabled: ${[...ENABLED_FLAGS].join(", ") || "none"}`,
);
