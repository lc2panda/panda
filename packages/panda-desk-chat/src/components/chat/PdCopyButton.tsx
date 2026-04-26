// Input: text string to copy + optional className
// Output: button that writes text to clipboard and flashes Check icon for 1.5s
// Pos: Chat layer — used by PdCodeViewer, PdMermaidRenderer, future copy actions
import React, { useEffect, useState, useCallback } from "react";
import { cn } from "../../lib/cn";

export interface PdCopyButtonProps {
  text: string;
  label?: string;
  copiedLabel?: string;
  showText?: boolean;
  className?: string;
}

export const PdCopyButton: React.FC<PdCopyButtonProps> = ({
  text,
  label = "Copy",
  copiedLabel = "Copied",
  showText = true,
  className,
}) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1500);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const handleCopy = useCallback(async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        return;
      }
      // Legacy fallback
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(textarea);
      if (ok) setCopied(true);
    } catch {
      /* clipboard not available */
    }
  }, [text]);

  const currentLabel = copied ? copiedLabel : label;

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={currentLabel}
      title={currentLabel}
      className={cn(
        "inline-flex items-center gap-1",
        "px-2 py-0.5 rounded-[var(--pd-radius-sm)]",
        "text-[var(--pd-text-2xs)] font-[var(--pd-font-medium)]",
        "text-[var(--pd-color-fg-muted)]",
        "bg-transparent",
        "hover:bg-[var(--pd-color-bg-hover)] hover:text-[var(--pd-color-fg)]",
        "transition-colors duration-[var(--pd-duration-quick)]",
        "cursor-pointer select-none",
        className,
      )}
    >
      {copied ? (
        <>
          <svg
            width="12"
            height="12"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="3.5 8.5 6.5 11.5 12.5 5.5" />
          </svg>
          {showText && <span>{copiedLabel}</span>}
        </>
      ) : (
        <>
          <svg
            width="12"
            height="12"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="5" y="5" width="8" height="8" rx="1" />
            <path d="M3 11V3h8" />
          </svg>
          {showText && <span>{label}</span>}
        </>
      )}
    </button>
  );
};

PdCopyButton.displayName = "PdCopyButton";
