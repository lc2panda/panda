// Input: Content to contain/overlay/organize
// Output: Structured container with interaction patterns
// Pos: Container layer — wraps atoms and content blocks
import React, { createContext, useCallback, useContext } from "react";
import { cn } from "@/lib/cn";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export interface PdTabsProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  variant?: "line" | "pill";
}

export interface PdTabProps {
  value: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface PdTabPanelProps {
  value: string;
  children: React.ReactNode;
}

/* -------------------------------------------------------------------------- */
/*  Context                                                                   */
/* -------------------------------------------------------------------------- */

interface TabsContextValue {
  activeValue: string;
  onValueChange: (value: string) => void;
  variant: "line" | "pill";
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext(): TabsContextValue {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("PdTab / PdTabPanel must be used inside PdTabs");
  return ctx;
}

/* -------------------------------------------------------------------------- */
/*  PdTabs                                                                    */
/* -------------------------------------------------------------------------- */

export function PdTabs({
  value,
  onValueChange,
  children,
  variant = "line",
}: PdTabsProps) {
  return (
    <TabsContext.Provider value={{ activeValue: value, onValueChange, variant }}>
      <div className="flex flex-col">{children}</div>
    </TabsContext.Provider>
  );
}

/* -------------------------------------------------------------------------- */
/*  PdTabList (internal grouping — rendered by consumer)                      */
/* -------------------------------------------------------------------------- */

export function PdTabList({ children }: { children: React.ReactNode }) {
  const { variant } = useTabsContext();

  // Keyboard navigation: left/right arrows
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;
      if (target.role !== "tab") return;

      const tabs = Array.from(
        e.currentTarget.querySelectorAll<HTMLElement>('[role="tab"]:not([aria-disabled="true"])'),
      );
      const idx = tabs.indexOf(target);
      if (idx === -1) return;

      let nextIdx = -1;
      if (e.key === "ArrowRight") {
        nextIdx = (idx + 1) % tabs.length;
      } else if (e.key === "ArrowLeft") {
        nextIdx = idx === 0 ? tabs.length - 1 : idx - 1;
      }

      if (nextIdx >= 0) {
        e.preventDefault();
        tabs[nextIdx].focus();
        tabs[nextIdx].click();
      }
    },
    [],
  );

  return (
    <div
      role="tablist"
      onKeyDown={handleKeyDown}
      className={cn(
        "flex",
        variant === "line" &&
          "border-b border-[var(--pd-color-border-subtle)] gap-[var(--pd-space-1)]",
        variant === "pill" &&
          "gap-[var(--pd-space-1)] rounded-[var(--pd-radius-lg)] bg-[var(--pd-color-bg-subtle)] p-[var(--pd-space-0\\.5)]",
      )}
    >
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  PdTab                                                                     */
/* -------------------------------------------------------------------------- */

export function PdTab({ value, children, icon, disabled = false }: PdTabProps) {
  const { activeValue, onValueChange, variant } = useTabsContext();
  const isActive = activeValue === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      aria-disabled={disabled || undefined}
      tabIndex={isActive ? 0 : -1}
      disabled={disabled}
      onClick={() => {
        if (!disabled) onValueChange(value);
      }}
      className={cn(
        "inline-flex items-center gap-[var(--pd-space-1\\.5)]",
        "text-[var(--pd-text-sm)] font-[var(--pd-font-medium)]",
        "transition-all duration-[var(--pd-duration-fast)]",
        "outline-none",
        "whitespace-nowrap",
        disabled && "opacity-50 cursor-not-allowed",

        // line variant
        variant === "line" && [
          "px-[var(--pd-space-3)] py-[var(--pd-space-2)]",
          "-mb-px",
          "border-b-2",
          isActive
            ? "border-[var(--pd-color-accent)] text-[var(--pd-color-accent-fg)]"
            : "border-transparent text-[var(--pd-color-fg-muted)] hover:text-[var(--pd-color-fg)] hover:border-[var(--pd-color-border)]",
        ],

        // pill variant
        variant === "pill" && [
          "px-[var(--pd-space-3)] py-[var(--pd-space-1\\.5)]",
          "rounded-[var(--pd-radius-md)]",
          isActive
            ? "bg-[var(--pd-color-bg-selected)] text-[var(--pd-color-fg)] shadow-[var(--pd-shadow-xs)]"
            : "text-[var(--pd-color-fg-muted)] hover:text-[var(--pd-color-fg)]",
        ],
      )}
    >
      {icon && <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center">{icon}</span>}
      {children}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*  PdTabPanel                                                                */
/* -------------------------------------------------------------------------- */

export function PdTabPanel({ value, children }: PdTabPanelProps) {
  const { activeValue } = useTabsContext();
  if (activeValue !== value) return null;

  return (
    <div
      role="tabpanel"
      tabIndex={0}
      className="pt-[var(--pd-space-4)] outline-none"
    >
      {children}
    </div>
  );
}
