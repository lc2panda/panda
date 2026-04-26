// Input:  src/ React components, Tailwind CSS, TypeScript
// Output: dist/ bundled SPA for Electron BrowserWindow
// Pos:    build orchestrator — dev server & production bundler
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
const require = createRequire(import.meta.url);

const pkg = JSON.parse(readFileSync(resolve(__dirname, "package.json"), "utf-8"));
const isElectron = process.env.ELECTRON === "true";

const electronPlugins = isElectron
  ? (() => {
      const electron = require("vite-plugin-electron/simple").default;
      return [
        electron({
          main: {
            entry: "electron/main.ts",
            vite: {
              build: {
                outDir: "dist-electron",
                rollupOptions: {
                  external: ["electron"],
                },
              },
            },
          },
          preload: {
            input: "electron/preload/chat.ts",
            vite: {
              build: {
                outDir: "dist-electron/preload",
                rollupOptions: {
                  external: ["electron"],
                  output: {
                    format: "cjs",
                    entryFileNames: "[name].js",
                  },
                },
              },
            },
          },
        }),
      ];
    })()
  : [];

export default defineConfig({
  // Electron 打包用 file:// 协议加载 dist/index.html — 绝对路径 "/assets/..." 会指向
  // 系统根而非 app bundle，导致 dmg 安装后黑屏。dev 模式 vite 走 http://localhost:5173
  // base 自动适配；prod build 用 "./" 让 script/link 解析为同级 dist/assets/。
  base: "./",
  plugins: [react(), tailwindcss(), ...electronPlugins],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
