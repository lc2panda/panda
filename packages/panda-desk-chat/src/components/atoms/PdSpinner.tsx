// Input: variant (dots/ring/shimmer), size props
// Output: Animated loading indicator with CSS-variable theming
// Pos: Atom layer — building block for all composite components
import React from "react";
import { cn } from "../../lib/cn";

export interface PdSpinnerProps {
  variant?: "dots" | "ring" | "shimmer";
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const sizePx: Record<string, number> = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 32,
};

/* ── Dots variant ──────────────────────────────────────────── */

function Dots({ px, className }: { px: number; className?: string }) {
  const dotSize = Math.max(3, Math.round(px * 0.3));
  return (
    <span
      className={cn("inline-flex items-center gap-[2px]", className)}
      role="status"
      aria-label="Loading"
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="rounded-full bg-[var(--pd-color-accent)]"
          style={{
            width: dotSize,
            height: dotSize,
            animation: `pd-dot-bounce 1.2s ease-in-out ${i * 0.16}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes pd-dot-bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-${Math.round(px * 0.35)}px); opacity: 1; }
        }
      `}</style>
    </span>
  );
}

/* ── Ring variant ──────────────────────────────────────────── */

function Ring({ px, className }: { px: number; className?: string }) {
  const border = Math.max(2, Math.round(px * 0.15));
  return (
    <span
      className={cn("inline-block rounded-full", className)}
      role="status"
      aria-label="Loading"
      style={{
        width: px,
        height: px,
        border: `${border}px solid var(--pd-color-border)`,
        borderTopColor: "var(--pd-color-accent)",
        animation: "pd-ring-spin 0.75s linear infinite",
      }}
    >
      <style>{`
        @keyframes pd-ring-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </span>
  );
}

/* ── Shimmer variant ───────────────────────────────────────── */

function Shimmer({ px, className }: { px: number; className?: string }) {
  return (
    <span
      className={cn("inline-block rounded-[var(--pd-radius-sm)]", className)}
      role="status"
      aria-label="Loading"
      style={{
        width: px * 3,
        height: px,
        background:
          "linear-gradient(90deg, var(--pd-color-bg-subtle) 25%, var(--pd-color-accent) 50%, var(--pd-color-bg-subtle) 75%)",
        backgroundSize: "200% 100%",
        animation: "pd-streaming-shimmer 1.5s ease-in-out infinite",
      }}
    />
  );
}

/* ── Main ──────────────────────────────────────────────────── */

export const PdSpinner: React.FC<PdSpinnerProps> = ({
  variant = "ring",
  size = "md",
  className,
}) => {
  const px = sizePx[size];

  switch (variant) {
    case "dots":
      return <Dots px={px} className={className} />;
    case "shimmer":
      return <Shimmer px={px} className={className} />;
    case "ring":
    default:
      return <Ring px={px} className={className} />;
  }
};

PdSpinner.displayName = "PdSpinner";
