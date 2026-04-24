// Input: User text, slash commands (dynamic via IPC), file attachments, @mention, drag-drop
// Output: Message submission to IPC bridge
// Pos: Chat layer — primary user interaction point
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "../../lib/cn";
import { getSlashCommands } from "../../ipc/bridge";
import { useChatStore } from "@/stores/chatStore";
import { useSettingsStore, type PermissionMode } from "@/stores/settingsStore";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export interface Attachment {
  type: "image" | "file";
  path: string;
  name: string;
}

export interface PdComposerProps {
  sessionId: string;
  onSend: (content: string, attachments?: Attachment[]) => void;
  onStop: () => void;
  isStreaming: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export interface PdComposerHandle {
  focus: () => void;
  clear: () => void;
  /** Insert "/" into textarea and open the slash command menu */
  insertSlash: () => void;
}

/* -------------------------------------------------------------------------- */
/*  Slash command items — fetched from IPC, hardcoded fallback for dev/web    */
/* -------------------------------------------------------------------------- */

interface SlashItem {
  command: string;
  description: string;
}

const FALLBACK_SLASH_COMMANDS: SlashItem[] = [
  { command: "/clear", description: "Clear conversation" },
  { command: "/compact", description: "Compact context" },
  { command: "/help", description: "Show available commands" },
  { command: "/model", description: "Switch model" },
  { command: "/review", description: "Review code changes" },
];

/* -------------------------------------------------------------------------- */
/*  Constants                                                                 */
/* -------------------------------------------------------------------------- */

const MAX_TEXTAREA_HEIGHT = 200;
const MIN_TEXTAREA_HEIGHT = 44;

/* -------------------------------------------------------------------------- */
/*  PdComposer                                                                */
/* -------------------------------------------------------------------------- */

export const PdComposer = forwardRef<PdComposerHandle, PdComposerProps>(
  (
    {
      sessionId: _sessionId,
      onSend,
      onStop,
      isStreaming,
      disabled = false,
      placeholder = "Ask Panda to edit, debug or explain...",
    },
    ref,
  ) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [value, setValue] = useState("");
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [isComposing, setIsComposing] = useState(false);
    const [slashOpen, setSlashOpen] = useState(false);
    const [slashFilter, setSlashFilter] = useState("");
    const [slashCommands, setSlashCommands] = useState<SlashItem[]>(FALLBACK_SLASH_COMMANDS);

    /* -- @mention state --------------------------------------------------- */
    const [mentionOpen, setMentionOpen] = useState(false);
    const [mentionFilter, setMentionFilter] = useState("");
    const [mentionIndex, setMentionIndex] = useState(0);
    /** Character offset of the triggering '@' inside the textarea value */
    const mentionAnchorRef = useRef(-1);

    /* -- Drag-drop state -------------------------------------------------- */
    const [isDragging, setIsDragging] = useState(false);
    /** Counter to handle nested dragenter/dragleave on child elements */
    const dragCounterRef = useRef(0);

    /* -- File paths extracted from chat tool calls ------------------------ */
    const activeSession = useChatStore((s) => s.getActiveSession());

    /* -- Settings: model & permission mode -------------------------------- */
    const currentModel = useSettingsStore((s) => s.model);
    const permissionMode = useSettingsStore((s) => s.permissionMode);
    const setModel = useSettingsStore((s) => s.setModel);
    const setPermissionMode = useSettingsStore((s) => s.setPermissionMode);
    const [showModelMenu, setShowModelMenu] = useState(false);
    const [showPermMenu, setShowPermMenu] = useState(false);

    const MODEL_OPTIONS = useMemo(() => [
      "claude-sonnet-4-20250514",
      "claude-opus-4-20250514",
      "claude-haiku-3-20250307",
    ], []);

    const PERM_OPTIONS: { value: PermissionMode; label: string; icon: string }[] = useMemo(() => [
      { value: "default", label: "Default", icon: "🛡️" },
      { value: "plan", label: "Plan", icon: "📋" },
      { value: "auto", label: "Auto-approve", icon: "⚡" },
      { value: "bypassPermissions", label: "YOLO", icon: "🔓" },
    ], []);

    /** Short display name for a model ID */
    const shortModelName = useCallback((m: string) => {
      if (m.includes("opus")) return "Opus";
      if (m.includes("sonnet")) return "Sonnet";
      if (m.includes("haiku")) return "Haiku";
      return m.split("-").slice(0, 2).join(" ");
    }, []);

    const filePathsFromChat = useMemo(() => {
      const paths = new Set<string>();
      const msgs = activeSession?.messages;
      if (!msgs) return [];
      for (const msg of msgs) {
        if (!msg.toolCalls) continue;
        for (const tc of msg.toolCalls) {
          const inp = (tc.input ?? {}) as Record<string, unknown>;
          // Extract from common tool input fields
          const candidates = [inp.file_path, inp.path, inp.filePath];
          for (const v of candidates) {
            if (typeof v === "string" && v.length > 0) paths.add(v);
          }
          // Extract file paths from grep/glob results stored in tool result text
          if (typeof inp.command === "string") {
            const m = inp.command.match(/(?:^|\s)((?:\/|\.\.?\/)[^\s]+)/g);
            if (m) {
              for (const p of m) paths.add(p.trim());
            }
          }
        }
      }
      return Array.from(paths).sort();
    }, [activeSession?.messages]);

    const filteredMentions = useMemo(() => {
      if (!mentionOpen) return [];
      const q = mentionFilter.toLowerCase();
      if (!q) return filePathsFromChat.slice(0, 20);
      return filePathsFromChat
        .filter((p) => p.toLowerCase().includes(q))
        .slice(0, 20);
    }, [mentionOpen, mentionFilter, filePathsFromChat]);

    /* -- Fetch slash commands from IPC on mount --------------------------- */
    useEffect(() => {
      let cancelled = false;
      getSlashCommands()
        .then((cmds) => {
          if (!cancelled && cmds?.length) {
            setSlashCommands(
              cmds.map((c) => ({ command: c.name, description: c.description })),
            );
          }
        })
        .catch(() => {
          /* keep fallback */
        });
      return () => { cancelled = true; };
    }, []);

    /* -- Imperative handle ------------------------------------------------ */
    useImperativeHandle(ref, () => ({
      focus: () => textareaRef.current?.focus(),
      clear: () => {
        setValue("");
        setAttachments([]);
        resize();
      },
      insertSlash: () => {
        setValue("/");
        setSlashOpen(true);
        setSlashFilter("");
        textareaRef.current?.focus();
      },
    }));

    /* -- Auto-resize ------------------------------------------------------ */
    const resize = useCallback(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.style.height = "auto";
      const next = Math.max(
        MIN_TEXTAREA_HEIGHT,
        Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT),
      );
      el.style.height = `${next}px`;
      el.style.overflowY =
        el.scrollHeight > MAX_TEXTAREA_HEIGHT ? "auto" : "hidden";
    }, []);

    useEffect(() => {
      resize();
    }, [value, resize]);

    /* -- Slash menu logic ------------------------------------------------- */
    const filteredSlash = slashCommands.filter((s) =>
      s.command.startsWith(`/${slashFilter}`),
    );

    const handleSlashSelect = useCallback(
      (cmd: string) => {
        setValue(cmd + " ");
        setSlashOpen(false);
        setSlashFilter("");
        textareaRef.current?.focus();
      },
      [],
    );

    /** Accept the currently highlighted @mention and splice it into the value */
    const handleMentionSelect = useCallback(
      (filePath: string) => {
        const anchor = mentionAnchorRef.current;
        if (anchor < 0) return;
        const before = value.slice(0, anchor);
        // Find end of the current mention query (cursor or next whitespace)
        const cursorPos = textareaRef.current?.selectionStart ?? value.length;
        const after = value.slice(cursorPos);
        const newVal = `${before}@${filePath} ${after}`;
        setValue(newVal);
        setMentionOpen(false);
        setMentionFilter("");
        mentionAnchorRef.current = -1;
        // Move cursor after the inserted path
        const newCursor = before.length + 1 + filePath.length + 1;
        requestAnimationFrame(() => {
          textareaRef.current?.focus();
          textareaRef.current?.setSelectionRange(newCursor, newCursor);
        });
      },
      [value],
    );

    /* -- Change handler --------------------------------------------------- */
    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const next = e.target.value;
        setValue(next);

        // Slash detection: only at start of input
        if (next.startsWith("/") && !next.includes(" ")) {
          setSlashOpen(true);
          setSlashFilter(next.slice(1));
          // Close mention if slash opens
          setMentionOpen(false);
        } else {
          setSlashOpen(false);
          setSlashFilter("");
        }

        // @mention detection: find the last unresolved '@' before the cursor
        const cursorPos = e.target.selectionStart ?? next.length;
        const textBeforeCursor = next.slice(0, cursorPos);
        const lastAt = textBeforeCursor.lastIndexOf("@");

        if (lastAt >= 0 && !slashOpen) {
          const charBefore = lastAt > 0 ? textBeforeCursor[lastAt - 1] : " ";
          // Only trigger if '@' is at start or preceded by whitespace
          if (lastAt === 0 || /\s/.test(charBefore)) {
            const query = textBeforeCursor.slice(lastAt + 1);
            // No spaces in mention query (close if user types space)
            if (!/\s/.test(query)) {
              setMentionOpen(true);
              setMentionFilter(query);
              setMentionIndex(0);
              mentionAnchorRef.current = lastAt;
              return;
            }
          }
        }
        // If we get here and mention was open, close it
        if (mentionOpen) {
          setMentionOpen(false);
          setMentionFilter("");
          mentionAnchorRef.current = -1;
        }
      },
      [slashOpen, mentionOpen],
    );

    /* -- Send ------------------------------------------------------------- */
    const send = useCallback(() => {
      const trimmed = value.trim();
      if (!trimmed && attachments.length === 0) return;
      onSend(trimmed, attachments.length > 0 ? attachments : undefined);
      setValue("");
      setAttachments([]);
      setSlashOpen(false);
      setSlashFilter("");
      setMentionOpen(false);
      setMentionFilter("");
      mentionAnchorRef.current = -1;
      // Reset height after clearing
      requestAnimationFrame(() => resize());
    }, [value, attachments, onSend, resize]);

    /* -- Keyboard handler ------------------------------------------------- */
    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // IME guard
        if (isComposing) return;

        // Cmd/Ctrl + Enter => send
        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
          e.preventDefault();
          if (!isStreaming && !disabled) send();
          return;
        }

        // @mention keyboard navigation (takes priority when mention menu is open)
        if (mentionOpen && filteredMentions.length > 0) {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setMentionIndex((i) => (i + 1) % filteredMentions.length);
            return;
          }
          if (e.key === "ArrowUp") {
            e.preventDefault();
            setMentionIndex((i) =>
              i <= 0 ? filteredMentions.length - 1 : i - 1,
            );
            return;
          }
          if (e.key === "Enter" || e.key === "Tab") {
            e.preventDefault();
            handleMentionSelect(filteredMentions[mentionIndex]);
            return;
          }
        }

        // Escape => close mention menu or slash menu
        if (e.key === "Escape") {
          if (mentionOpen) {
            e.preventDefault();
            setMentionOpen(false);
            setMentionFilter("");
            mentionAnchorRef.current = -1;
            return;
          }
          if (slashOpen) {
            e.preventDefault();
            setSlashOpen(false);
            return;
          }
        }
      },
      [
        isComposing,
        isStreaming,
        disabled,
        send,
        slashOpen,
        mentionOpen,
        filteredMentions,
        mentionIndex,
        handleMentionSelect,
      ],
    );

    /* -- Drag-and-drop handlers ------------------------------------------- */
    const handleDragEnter = useCallback(
      (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounterRef.current += 1;
        if (dragCounterRef.current === 1) setIsDragging(true);
      },
      [],
    );

    const handleDragLeave = useCallback(
      (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounterRef.current -= 1;
        if (dragCounterRef.current <= 0) {
          dragCounterRef.current = 0;
          setIsDragging(false);
        }
      },
      [],
    );

    const handleDragOver = useCallback(
      (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
      },
      [],
    );

    const handleDrop = useCallback(
      (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        dragCounterRef.current = 0;

        const files = Array.from(e.dataTransfer.files);
        if (files.length === 0) return;

        const IMAGE_EXTS = /\.(jpe?g|png|gif|webp)$/i;

        for (const file of files) {
          if (IMAGE_EXTS.test(file.name)) {
            // Image file => add as image attachment (use Electron file path if available)
            const filePath = (file as unknown as { path?: string }).path ?? file.name;
            setAttachments((prev) => [
              ...prev,
              { type: "image" as const, path: filePath, name: file.name },
            ]);
          } else {
            // Non-image file => insert path reference into textarea
            const filePath = (file as unknown as { path?: string }).path ?? file.name;
            setValue((prev) => {
              const sep = prev.length > 0 && !prev.endsWith(" ") ? " " : "";
              return `${prev}${sep}@${filePath} `;
            });
          }
        }

        textareaRef.current?.focus();
      },
      [],
    );

    /* -- Attachment remove ------------------------------------------------ */
    const removeAttachment = useCallback((index: number) => {
      setAttachments((prev) => prev.filter((_, i) => i !== index));
    }, []);

    /* -- Derived state ---------------------------------------------------- */
    const canSend =
      !disabled && !isStreaming && (value.trim().length > 0 || attachments.length > 0);

    return (
      <div
        className={cn(
          "pd-glass-panel",
          "relative",
          "w-full max-w-[var(--pd-layout-composer-max-width)]",
          "mx-auto",
          "rounded-[var(--pd-radius-2xl)]",
          "transition-shadow duration-[var(--pd-duration-quick)]",
          "focus-within:shadow-[0_0_0_2px_rgba(193,95,60,0.2)]",
          "focus-within:border-[var(--pd-color-border-focus)]",
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* -- Attachment pills --------------------------------------------- */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-[var(--pd-space-1\\.5)] px-4 pt-3 pb-0">
            {attachments.map((att, i) => (
              <span
                key={`${att.path}-${i}`}
                className={cn(
                  "inline-flex items-center gap-[var(--pd-space-1)]",
                  "px-[var(--pd-space-2)] py-[var(--pd-space-0\\.5)]",
                  "text-[var(--pd-text-xs)]",
                  "rounded-[var(--pd-radius-full)]",
                  "bg-[var(--pd-color-bg-subtle)]",
                  "text-[var(--pd-color-fg-muted)]",
                  "border border-[var(--pd-color-border-subtle)]",
                )}
              >
                <span className="shrink-0 w-3.5 h-3.5 flex items-center justify-center">
                  {att.type === "image" ? (
                    <ImageIcon />
                  ) : (
                    <FileIcon />
                  )}
                </span>
                <span className="max-w-[120px] truncate">{att.name}</span>
                <button
                  type="button"
                  aria-label={`Remove ${att.name}`}
                  onClick={() => removeAttachment(i)}
                  className={cn(
                    "shrink-0 w-4 h-4 flex items-center justify-center rounded-full",
                    "hover:bg-[var(--pd-color-bg-hover)]",
                    "text-[var(--pd-color-fg-subtle)]",
                    "transition-colors duration-[var(--pd-duration-fast)]",
                  )}
                >
                  <XIcon />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* -- Textarea ---------------------------------------------------- */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            disabled={disabled}
            placeholder={placeholder}
            rows={1}
            className={cn(
              "w-full min-h-[44px] max-h-[200px]",
              "py-[12px] px-[16px]",
              "bg-transparent text-[var(--pd-text-base)] text-[var(--pd-color-fg)]",
              "placeholder:text-[var(--pd-color-fg-muted)]",
              "border-none outline-none resize-none",
              "leading-[1.5]",
              "font-[var(--pd-font-regular)]",
              "font-[family-name:var(--pd-font-sans)]",
              disabled && "opacity-50 cursor-not-allowed",
            )}
          />
        </div>

        {/* -- Bottom bar — Reference: cc-haha ChatInput footer (design spec only, not source) --- */}
        {/*    Order: [+] · [Bypass ∨] · spacer · [✨ Model ∨] · [→ Run] */}
        <div className="relative flex items-center gap-[var(--pd-space-1\.5)] px-2 pb-2 pt-0">
          {/* 1. Attach button — rounded-full bg-subtle */}
          <button
            type="button"
            aria-label="Attach file"
            className={cn(
              "shrink-0 w-7 h-7 flex items-center justify-center",
              "rounded-full",
              "bg-[var(--pd-color-bg-subtle)]",
              "text-[var(--pd-color-fg-muted)]",
              "hover:bg-[var(--pd-color-bg-hover)] hover:text-[var(--pd-color-fg)]",
              "transition-colors duration-[var(--pd-duration-fast)]",
            )}
          >
            <AttachIcon />
          </button>

          {/* 2. Permission mode selector — text-label with shield icon */}
          <div className="relative">
            <button
              type="button"
              onClick={() => { setShowPermMenu((v) => !v); setShowModelMenu(false); }}
              className={cn(
                "flex items-center gap-1.5 px-2.5 h-7",
                "rounded-[var(--pd-radius-md)]",
                "text-[var(--pd-text-xs)] text-[var(--pd-color-fg-muted)]",
                "hover:bg-[var(--pd-color-bg-hover)] hover:text-[var(--pd-color-fg)]",
                "transition-colors duration-[var(--pd-duration-fast)]",
                "font-[family-name:var(--pd-font-sans)]",
              )}
              title={`Permission: ${permissionMode}`}
            >
              <ShieldIcon />
              <span>{PERM_OPTIONS.find((p) => p.value === permissionMode)?.label ?? "Default"}</span>
              <ChevronDownIcon />
            </button>
            {showPermMenu && (
              <div
                className={cn(
                  "absolute bottom-full left-0 mb-1",
                  "min-w-[180px] py-1",
                  "rounded-[var(--pd-radius-md)]",
                  "border border-[var(--pd-color-border)]",
                  "bg-[var(--pd-color-bg-elevated)]",
                  "shadow-[var(--pd-shadow-lg)]",
                  "z-[var(--pd-z-dropdown)]",
                )}
              >
                {PERM_OPTIONS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => { setPermissionMode(p.value); setShowPermMenu(false); }}
                    className={cn(
                      "w-full px-3 py-1.5 text-left flex items-center gap-2",
                      "text-[var(--pd-text-sm)]",
                      "hover:bg-[var(--pd-color-bg-hover)]",
                      "transition-colors duration-[var(--pd-duration-fast)]",
                      p.value === permissionMode
                        ? "text-[var(--pd-color-accent)] font-[var(--pd-font-medium)]"
                        : "text-[var(--pd-color-fg)]",
                    )}
                  >
                    <span aria-hidden="true">{p.icon}</span>
                    <span>{p.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* 3. Model selector — with sparkle accent */}
          <div className="relative">
            <button
              type="button"
              onClick={() => { setShowModelMenu((v) => !v); setShowPermMenu(false); }}
              className={cn(
                "flex items-center gap-1.5 px-2.5 h-7",
                "rounded-[var(--pd-radius-md)]",
                "text-[var(--pd-text-xs)] text-[var(--pd-color-fg-muted)]",
                "hover:bg-[var(--pd-color-bg-hover)] hover:text-[var(--pd-color-fg)]",
                "transition-colors duration-[var(--pd-duration-fast)]",
                "font-[family-name:var(--pd-font-sans)]",
              )}
            >
              <SparkleIcon />
              <span>{shortModelName(currentModel)}</span>
              <ChevronDownIcon />
            </button>
            {showModelMenu && (
              <div
                className={cn(
                  "absolute bottom-full right-0 mb-1",
                  "min-w-[180px] py-1",
                  "rounded-[var(--pd-radius-md)]",
                  "border border-[var(--pd-color-border)]",
                  "bg-[var(--pd-color-bg-elevated)]",
                  "shadow-[var(--pd-shadow-lg)]",
                  "z-[var(--pd-z-dropdown)]",
                )}
              >
                {MODEL_OPTIONS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => { setModel(m); setShowModelMenu(false); }}
                    className={cn(
                      "w-full px-3 py-1.5 text-left",
                      "text-[var(--pd-text-sm)]",
                      "hover:bg-[var(--pd-color-bg-hover)]",
                      "transition-colors duration-[var(--pd-duration-fast)]",
                      m === currentModel
                        ? "text-[var(--pd-color-accent)] font-[var(--pd-font-medium)]"
                        : "text-[var(--pd-color-fg)]",
                    )}
                  >
                    {shortModelName(m)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 4. Run / Stop button — pill with label */}
          {isStreaming ? (
            <button
              type="button"
              aria-label="Stop generation"
              onClick={onStop}
              className={cn(
                "shrink-0 h-7 px-3 flex items-center justify-center gap-1.5",
                "rounded-[var(--pd-radius-md)]",
                "bg-[var(--pd-color-error)] text-white",
                "transition-colors duration-[var(--pd-duration-quick)]",
                "hover:opacity-90 active:opacity-80",
                "text-[var(--pd-text-xs)] font-[var(--pd-font-medium)]",
              )}
            >
              <StopIcon />
              <span>Stop</span>
            </button>
          ) : (
            <button
              type="button"
              aria-label="Send message"
              onClick={send}
              disabled={!canSend}
              className={cn(
                "shrink-0 h-7 px-3 flex items-center justify-center gap-1.5",
                "rounded-[var(--pd-radius-md)]",
                "transition-colors duration-[var(--pd-duration-quick)]",
                "text-[var(--pd-text-xs)] font-[var(--pd-font-medium)]",
                canSend
                  ? "bg-[var(--pd-color-accent)] text-[var(--pd-color-fg-on-accent)] shadow-[var(--pd-shadow-button-primary)] hover:bg-[var(--pd-color-accent-hover)] active:bg-[var(--pd-color-accent-active)]"
                  : "bg-[var(--pd-color-bg-disabled)] text-[var(--pd-color-fg-disabled)] cursor-not-allowed",
              )}
            >
              <ArrowRightIcon />
              <span>Run</span>
            </button>
          )}

          {/* -- Slash menu (absolute positioned above) -------------------- */}
          {slashOpen && filteredSlash.length > 0 && (
            <div
              className={cn(
                "absolute bottom-full left-0 mb-[var(--pd-space-1)]",
                "w-[240px]",
                "rounded-[var(--pd-radius-md)]",
                "border border-[var(--pd-color-border)]",
                "bg-[var(--pd-color-bg-elevated)]",
                "shadow-[var(--pd-shadow-lg)]",
                "py-[var(--pd-space-1)]",
                "z-[var(--pd-z-dropdown)]",
                "overflow-hidden",
              )}
            >
              {filteredSlash.map((item) => (
                <button
                  type="button"
                  key={item.command}
                  onClick={() => handleSlashSelect(item.command)}
                  className={cn(
                    "w-full flex items-center gap-[var(--pd-space-3)]",
                    "px-[var(--pd-space-3)] py-[var(--pd-space-1\\.5)]",
                    "text-[var(--pd-text-sm)] text-left",
                    "text-[var(--pd-color-fg)]",
                    "hover:bg-[var(--pd-color-bg-hover)]",
                    "transition-colors duration-[var(--pd-duration-fast)]",
                    "cursor-pointer",
                  )}
                >
                  <span className="font-[var(--pd-font-medium)] font-[family-name:var(--pd-font-mono)]">
                    {item.command}
                  </span>
                  <span className="text-[var(--pd-color-fg-muted)] truncate">
                    {item.description}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* -- @mention menu (absolute positioned above) ------------------- */}
          {mentionOpen && filteredMentions.length > 0 && !slashOpen && (
            <div
              className={cn(
                "absolute bottom-full left-0 mb-[var(--pd-space-1)]",
                "w-72 max-h-48 overflow-y-auto",
                "rounded-lg",
                "border border-[var(--pd-color-border)]",
                "bg-[var(--pd-color-bg-elevated)]",
                "shadow-lg",
                "py-[var(--pd-space-1)]",
                "z-50",
              )}
            >
              {filteredMentions.map((filePath, idx) => (
                <button
                  type="button"
                  key={filePath}
                  onMouseDown={(e) => {
                    e.preventDefault(); // prevent textarea blur
                    handleMentionSelect(filePath);
                  }}
                  className={cn(
                    "w-full flex items-center gap-[var(--pd-space-2)]",
                    "px-[var(--pd-space-3)] py-[var(--pd-space-1\\.5)]",
                    "text-[var(--pd-text-sm)] text-left",
                    "text-[var(--pd-color-fg)]",
                    "transition-colors duration-[var(--pd-duration-fast)]",
                    "cursor-pointer",
                    idx === mentionIndex
                      ? "bg-[var(--pd-color-bg-subtle)]"
                      : "hover:bg-[var(--pd-color-bg-hover)]",
                  )}
                >
                  <span className="shrink-0 text-[var(--pd-color-fg-muted)]">
                    <MentionFileIcon />
                  </span>
                  <span className="truncate font-[family-name:var(--pd-font-mono)] text-[var(--pd-text-xs)]">
                    {filePath}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* -- Drag-drop overlay --------------------------------------------- */}
        {isDragging && (
          <div
            className={cn(
              "absolute inset-0 flex items-center justify-center",
              "bg-[var(--pd-color-accent)]/10",
              "border-2 border-dashed border-[var(--pd-color-accent)]",
              "rounded-[var(--pd-radius-2xl)]",
              "z-50",
              "pointer-events-none",
            )}
          >
            <span className="text-[var(--pd-color-accent)] text-sm font-medium">
              Drop files here
            </span>
          </div>
        )}
      </div>
    );
  },
);

PdComposer.displayName = "PdComposer";

/* -------------------------------------------------------------------------- */
/*  Inline SVG Icons (14x14, keeps bundle self-contained)                     */
/* -------------------------------------------------------------------------- */

function SendIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 2L11 13" />
      <path d="M22 2L15 22L11 13L2 9L22 2Z" />
    </svg>
  );
}

function AttachIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <rect x="4" y="4" width="16" height="16" rx="2" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15L16 10L5 21" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" />
      <path d="M14 2V8H20" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18" />
      <path d="M6 6L18 18" />
    </svg>
  );
}

/** Small file icon for @mention items (12x12) */
function MentionFileIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" />
      <path d="M14 2V8H20" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-[var(--pd-color-accent)]">
      <path d="M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4L12 2z" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <path d="M2.5 4L5 6.5L7.5 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="M13 5l7 7-7 7" />
    </svg>
  );
}
