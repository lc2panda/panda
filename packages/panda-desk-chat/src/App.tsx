// Input:  none (root component)
// Output: three-column layout shell — Sidebar | Content | Inspector
// Pos:    React root — wraps ThemeProvider (placeholder) and layout skeleton
import { cn } from "@/lib/cn";
import { ChatPage } from "./pages/ChatPage";

const VERSION = "0.1.0";

export function App() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--pd-bg)] text-[var(--pd-text)]">
      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col border-r border-[var(--pd-border)]",
          "w-[var(--pd-sidebar-width)] min-w-[var(--pd-sidebar-width)]",
          "bg-[var(--pd-bg-secondary)]",
        )}
      >
        <div className="flex h-12 items-center px-4 font-semibold tracking-tight">
          <span className="text-[var(--pd-accent)]">Panda</span>
          <span className="ml-1 opacity-60">Chat</span>
        </div>
        <div className="flex-1 px-3 py-2">
          <div className="rounded-lg border border-dashed border-[var(--pd-border)] p-4 text-center text-xs text-[var(--pd-text-muted)]">
            Conversations — placeholder
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex flex-1 flex-col">
        <header className="flex h-12 items-center justify-between border-b border-[var(--pd-border)] px-4">
          <h1 className="text-sm font-medium">New Chat</h1>
          <span className="text-xs text-[var(--pd-text-muted)]">
            v{VERSION}
          </span>
        </header>
        <ChatPage />
      </main>

      {/* Inspector */}
      <aside
        className={cn(
          "flex flex-col border-l border-[var(--pd-border)]",
          "w-[var(--pd-inspector-width)] min-w-[var(--pd-inspector-width)]",
          "bg-[var(--pd-bg-secondary)]",
        )}
      >
        <div className="flex h-12 items-center px-4 text-sm font-medium">
          Inspector
        </div>
        <div className="flex-1 px-3 py-2">
          <div className="rounded-lg border border-dashed border-[var(--pd-border)] p-4 text-center text-xs text-[var(--pd-text-muted)]">
            Context panel — placeholder
          </div>
        </div>
      </aside>
    </div>
  );
}
