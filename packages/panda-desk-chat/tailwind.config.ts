// Input:  Tailwind v4 CSS-first config (supplementary TS config)
// Output: theme token references for build pipeline
// Pos:    design system bridge — CSS variable tokens → Tailwind utilities
//
// NOTE: Tailwind v4 uses CSS-first configuration via @theme in global.css.
// This file serves as a supplementary config for tooling compatibility.
import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        pd: {
          bg: "var(--pd-bg)",
          "bg-secondary": "var(--pd-bg-secondary)",
          "bg-tertiary": "var(--pd-bg-tertiary)",
          surface: "var(--pd-surface)",
          border: "var(--pd-border)",
          text: "var(--pd-text)",
          "text-secondary": "var(--pd-text-secondary)",
          "text-muted": "var(--pd-text-muted)",
          accent: "var(--pd-accent)",
          "accent-hover": "var(--pd-accent-hover)",
        },
      },
      width: {
        sidebar: "var(--pd-sidebar-width)",
        inspector: "var(--pd-inspector-width)",
      },
    },
  },
} satisfies Config;
