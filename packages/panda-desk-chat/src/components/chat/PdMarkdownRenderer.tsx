// Input: Raw markdown string from assistant
// Output: Rendered HTML with syntax highlighting
// Pos: Chat layer — replaces raw text display in AssistantMessage
import React, { useState, useCallback, useMemo } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { cn } from "../../lib/cn";

export interface PdMarkdownRendererProps {
  content: string;
  className?: string;
}

/* ── Copy Button for code blocks ──────────────────────────────────────── */

const CopyButton: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard not available */
    }
  }, [text]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        "inline-flex items-center gap-1",
        "px-2 py-0.5 rounded-[var(--pd-radius-sm)]",
        "text-[var(--pd-text-2xs)] font-[var(--pd-font-medium)]",
        "text-[var(--pd-color-fg-muted)]",
        "bg-transparent",
        "hover:bg-[var(--pd-color-bg-hover)] hover:text-[var(--pd-color-fg)]",
        "transition-colors duration-[var(--pd-duration-quick)]",
        "cursor-pointer select-none",
      )}
      title={copied ? "Copied" : "Copy code"}
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
          >
            <polyline points="3.5 8.5 6.5 11.5 12.5 5.5" />
          </svg>
          <span>Copied</span>
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
          >
            <rect x="5" y="5" width="8" height="8" rx="1" />
            <path d="M3 11V3h8" />
          </svg>
          <span>Copy</span>
        </>
      )}
    </button>
  );
};

/* ── Extract language from className ──────────────────────────────────── */

function extractLanguage(className?: string): string | null {
  if (!className) return null;
  const match = className.match(/language-(\w+)/);
  return match ? match[1] : null;
}

/* ── Custom component map ─────────────────────────────────────────────── */

function useMarkdownComponents(): Components {
  return useMemo<Components>(
    () => ({
      /* ── Code: inline vs block ────────────────────────────────────────── */
      pre({ children, ...props }) {
        // Extract the code element child to get language and text
        let language: string | null = null;
        let codeText = "";

        React.Children.forEach(children, (child) => {
          if (React.isValidElement(child) && child.type === "code") {
            const codeProps = child.props as {
              className?: string;
              children?: React.ReactNode;
            };
            language = extractLanguage(codeProps.className);
            // Extract raw text for copy button
            codeText = extractTextContent(codeProps.children);
          }
        });

        return (
          <div className="relative group/code my-[var(--pd-space-2)]">
            {/* Header bar: language label + copy button */}
            <div
              className={cn(
                "flex items-center justify-between",
                "px-3 py-1",
                "bg-[var(--pd-code-bg)]",
                "border border-b-0 border-[var(--pd-color-border)]",
                "rounded-t-[var(--pd-radius-md)]",
                "text-[var(--pd-text-2xs)] text-[var(--pd-color-fg-muted)]",
              )}
            >
              <span className="font-[var(--pd-font-medium)] uppercase tracking-wide">
                {language || "text"}
              </span>
              <CopyButton text={codeText} />
            </div>
            {/* Code block */}
            <pre
              {...props}
              className={cn(
                "bg-[var(--pd-code-bg)]",
                "font-[var(--pd-font-mono)]",
                "text-[var(--pd-code-base)]",
                "leading-[var(--pd-leading-code)]",
                "rounded-b-[var(--pd-radius-md)]",
                "border border-t-0 border-[var(--pd-color-border)]",
                "px-3 py-2",
                "overflow-x-auto",
              )}
            >
              {children}
            </pre>
          </div>
        );
      },

      code({ className, children, ...props }) {
        // If inside a <pre>, rehype-highlight already handled it
        const language = extractLanguage(className);
        if (language || className?.includes("hljs")) {
          return (
            <code className={className} {...props}>
              {children}
            </code>
          );
        }
        // Inline code
        return (
          <code
            className={cn(
              "bg-[var(--pd-code-bg)]",
              "font-[var(--pd-font-mono)]",
              "text-[var(--pd-code-base)]",
              "rounded-[var(--pd-radius-xs)]",
              "px-1 py-0.5",
            )}
            {...props}
          >
            {children}
          </code>
        );
      },

      /* ── Links ────────────────────────────────────────────────────────── */
      a({ href, children, ...props }) {
        return (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "text-[var(--pd-color-accent)]",
              "underline underline-offset-2",
              "hover:text-[var(--pd-color-accent-hover)]",
              "transition-colors duration-[var(--pd-duration-quick)]",
            )}
            {...props}
          >
            {children}
          </a>
        );
      },

      /* ── Tables ───────────────────────────────────────────────────────── */
      table({ children, ...props }) {
        return (
          <div className="overflow-x-auto my-[var(--pd-space-2)]">
            <table
              className={cn(
                "w-full border-collapse",
                "text-[var(--pd-text-sm)]",
              )}
              {...props}
            >
              {children}
            </table>
          </div>
        );
      },

      th({ children, ...props }) {
        return (
          <th
            className={cn(
              "border border-[var(--pd-color-border)]",
              "bg-[var(--pd-color-bg-subtle)]",
              "px-3 py-1.5 text-left",
              "font-[var(--pd-font-semibold)]",
              "text-[var(--pd-color-fg)]",
            )}
            {...props}
          >
            {children}
          </th>
        );
      },

      td({ children, ...props }) {
        return (
          <td
            className={cn(
              "border border-[var(--pd-color-border)]",
              "px-3 py-1.5",
              "text-[var(--pd-color-fg)]",
            )}
            {...props}
          >
            {children}
          </td>
        );
      },

      /* ── Blockquote ───────────────────────────────────────────────────── */
      blockquote({ children, ...props }) {
        return (
          <blockquote
            className={cn(
              "border-l-[3px] border-l-[var(--pd-color-accent)]",
              "bg-[var(--pd-color-bg-subtle)]",
              "rounded-r-[var(--pd-radius-sm)]",
              "pl-3 pr-2 py-1.5 my-[var(--pd-space-2)]",
              "text-[var(--pd-color-fg-muted)]",
              "italic",
            )}
            {...props}
          >
            {children}
          </blockquote>
        );
      },

      /* ── Headings ─────────────────────────────────────────────────────── */
      h1({ children, ...props }) {
        return (
          <h1
            className="text-[var(--pd-text-xl)] font-[var(--pd-font-bold)] [font-family:var(--pd-font-serif)] leading-[var(--pd-leading-heading)] mt-[var(--pd-space-4)] mb-[var(--pd-space-2)] text-[var(--pd-color-fg)]"
            {...props}
          >
            {children}
          </h1>
        );
      },
      h2({ children, ...props }) {
        return (
          <h2
            className="text-[var(--pd-text-lg)] font-[var(--pd-font-semibold)] [font-family:var(--pd-font-serif)] leading-[var(--pd-leading-heading)] mt-[var(--pd-space-3)] mb-[var(--pd-space-1)] text-[var(--pd-color-fg)]"
            {...props}
          >
            {children}
          </h2>
        );
      },
      h3({ children, ...props }) {
        return (
          <h3
            className="text-[var(--pd-text-md)] font-[var(--pd-font-semibold)] leading-[var(--pd-leading-heading)] mt-[var(--pd-space-2)] mb-[var(--pd-space-1)] text-[var(--pd-color-fg)]"
            {...props}
          >
            {children}
          </h3>
        );
      },

      /* ── Lists ────────────────────────────────────────────────────────── */
      ul({ children, ...props }) {
        return (
          <ul
            className="list-disc pl-5 my-[var(--pd-space-1)] leading-[var(--pd-leading-list)] text-[var(--pd-color-fg)]"
            {...props}
          >
            {children}
          </ul>
        );
      },
      ol({ children, ...props }) {
        return (
          <ol
            className="list-decimal pl-5 my-[var(--pd-space-1)] leading-[var(--pd-leading-list)] text-[var(--pd-color-fg)]"
            {...props}
          >
            {children}
          </ol>
        );
      },
      li({ children, ...props }) {
        return (
          <li className="my-0.5" {...props}>
            {children}
          </li>
        );
      },

      /* ── Horizontal Rule ──────────────────────────────────────────────── */
      hr(props) {
        return (
          <hr
            className="border-t border-[var(--pd-color-border)] my-[var(--pd-space-3)]"
            {...props}
          />
        );
      },

      /* ── Paragraph ────────────────────────────────────────────────────── */
      p({ children, ...props }) {
        return (
          <p className="my-[var(--pd-space-1)]" {...props}>
            {children}
          </p>
        );
      },
    }),
    [],
  );
}

/* ── Helper: extract raw text from React children tree ────────────────── */

function extractTextContent(node: React.ReactNode): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (node == null || typeof node === "boolean") return "";
  if (Array.isArray(node)) return node.map(extractTextContent).join("");
  if (React.isValidElement(node)) {
    const props = node.props as { children?: React.ReactNode };
    return extractTextContent(props.children);
  }
  return "";
}

/* ── PdMarkdownRenderer ──────────────────────────────────────────────── */

const remarkPlugins = [remarkGfm];
const rehypePlugins = [rehypeHighlight];

export const PdMarkdownRenderer: React.FC<PdMarkdownRendererProps> = ({
  content,
  className,
}) => {
  const components = useMarkdownComponents();

  return (
    <div
      className={cn(
        "text-[var(--pd-text-base)] text-[var(--pd-color-fg)]",
        "leading-[1.6]",
        // Prose-like spacing
        "[&>*:first-child]:mt-0",
        "[&>*:last-child]:mb-0",
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={remarkPlugins}
        rehypePlugins={rehypePlugins}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

PdMarkdownRenderer.displayName = "PdMarkdownRenderer";
