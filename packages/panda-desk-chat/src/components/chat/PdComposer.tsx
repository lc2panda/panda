// Input:  sessionId + onSend / onStop / isStreaming / disabled? / placeholder? + variant?='default'|'hero'
// Output: cc-haha ChatInput 1:1 — glass-panel 容器 + textarea + 提交栏（plus + 模式 / 模型 + 提交按钮）
//         + slash 菜单 + @文件菜单 + 本地 slash 面板（mcp/skills）+ 附件预览
// Pos:    Chat layer — 主用户交互入口（hero 形态 / default 形态共用一份组件）
//
// Source 1:1: cc-haha desktop/src/components/chat/ChatInput.tsx (L1-L728)
//   - className 转换：var(--color-*) → var(--pd-color-*)，shadow-button-primary → shadow-button-primary-cc，glass-panel 直接复用
//   - cc-haha sessionsApi.getGitInfo → panda IPC 暂无该 API，gitInfo 永远 null（不影响 ProjectContextChip 降级渲染）
//   - cc-haha composerPrefill → panda chatStore 暂无该字段，prefill effect 略过
//   - cc-haha useTeamStore.getMemberBySessionId → panda 无 team 概念，isMemberSession 永远 false
//   - cc-haha useChatStore.sendMessage(tabId, text, attachments) → panda chatStore.sendMessage(sid, content) 不接 attachments，
//     这里把 attachments 序列化进 text（@path 行）后单参提交，保持 cc-haha 触发顺序
//   - cc-haha PermissionModeSelector / ModelSelector → panda controls/PdPermissionModeSelector / PdModelSelector
//   - cc-haha ProjectContextChip / DirectoryPicker → panda shared/PdProjectContextChip / PdDirectoryPicker
//   - cc-haha activeSession.workDirExists → panda sessionStore 无该字段，永远 truthy
//   - cc-haha resolveSlashUiAction settings tab → panda uiStore.SettingsTab 同集合
//   - 保留旧 panda 兼容签名（sessionId/onSend/onStop/isStreaming/disabled?/placeholder?/ref）以便 EmptySession/ActiveSession 无需修改
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type DragEvent as ReactDragEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import { useChatStore } from '../../stores/chatStore';
import { useSessionStore } from '../../stores/sessionStore';
import { useUIStore } from '../../stores/uiStore';
import { useTabStore, SETTINGS_TAB_ID } from '../../stores/tabStore';
import { t } from '../../i18n';
import { PdPermissionModeSelector } from '../controls/PdPermissionModeSelector';
import { PdModelSelector } from '../controls/PdModelSelector';
import { PdProjectContextChip } from '../shared/PdProjectContextChip';
import { PdDirectoryPicker } from '../shared/PdDirectoryPicker';
import { PdAttachmentGallery } from './PdAttachmentGallery';
import { PdFileSearchMenu, type PdFileSearchMenuHandle } from './PdFileSearchMenu';
import { PdLocalSlashCommandPanel, type LocalSlashCommandName } from './PdLocalSlashCommandPanel';
import { getSlashCommands, getGitInfo } from '../../ipc/bridge';
import type { GitInfo } from '../../ipc/types';
import {
  FALLBACK_SLASH_COMMANDS,
  findSlashTrigger,
  mergeSlashCommands,
  replaceSlashToken,
  resolveSlashUiAction,
  type SlashCommandOption,
} from './composerUtils';

type Attachment = {
  id: string;
  name: string;
  type: 'image' | 'file';
  mimeType?: string;
  previewUrl?: string;
  data?: string;
};

// panda 兼容旧 props 形态（EmptySession/ActiveSession 调用面）
export type PdComposerProps = {
  sessionId: string;
  onSend?: (content: string) => void;
  onStop?: () => void;
  isStreaming?: boolean;
  disabled?: boolean;
  placeholder?: string;
  variant?: 'default' | 'hero';
};

export type PdComposerHandle = {
  focus: () => void;
  clear: () => void;
  insertSlash: () => void;
};

// 历史 export — 兼容外部 import（旧 attachment payload 形态）
export type AttachmentRef = {
  type: 'image' | 'file';
  name: string;
  data?: string;
  mimeType?: string;
};
export type { Attachment };

export const PdComposer = forwardRef<PdComposerHandle, PdComposerProps>(function PdComposer(
  { sessionId, onSend, onStop, isStreaming, disabled, placeholder, variant = 'default' },
  ref,
) {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [plusMenuOpen, setPlusMenuOpen] = useState(false);
  const [slashMenuOpen, setSlashMenuOpen] = useState(false);
  const [fileSearchOpen, setFileSearchOpen] = useState(false);
  const [localSlashPanel, setLocalSlashPanel] = useState<LocalSlashCommandName | null>(null);
  const [atFilter, setAtFilter] = useState('');
  const [atCursorPos, setAtCursorPos] = useState(-1);
  const [slashFilter, setSlashFilter] = useState('');
  const [slashSelectedIndex, setSlashSelectedIndex] = useState(0);
  const [slashCommands, setSlashCommands] = useState<SlashCommandOption[]>([]);
  // 遗留 IPC 修复 #1: cc-haha ChatInput L68/L113-123 — getGitInfo 拉取 branch/repoName
  const [gitInfo, setGitInfo] = useState<GitInfo | null>(null);
  const composingRef = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const plusMenuRef = useRef<HTMLDivElement>(null);
  const slashMenuRef = useRef<HTMLDivElement>(null);
  const fileSearchRef = useRef<PdFileSearchMenuHandle>(null);
  const slashItemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // panda chatStore: sendMessage(sid, content) — 不接 attachments；本组件内序列化进 content。
  const sendMessage = useChatStore((s) => s.sendMessage);
  const stopGeneration = useChatStore((s) => s.stopGeneration);
  // Comdr 指令: 删除 dispatchSessionControl 路径 — fork/branch/resume 三按钮换为 debug/ultrareview
  //   两个 slash 注入按钮（点击仅写入 textarea，由用户 Enter 自行发送）。
  //   旧实现走 dispatchSessionControl IPC 直发 /branch + /resume，但 panda CLI hasCommand 未识别
  //   → 落到 SkillTool 的 'Unknown skill' 分支报错。新实现走完整 normal flow（processSlashCommand
  //   → hasCommand('ultrareview') 命中 / hasSkill('debug') 命中），不再触发 Unknown skill。
  const activeSessionFromStore = useChatStore((s) => s.activeSessionId);
  const activeTabId: string | null = sessionId || activeSessionFromStore || null;
  const sessionState = useChatStore((s) => (activeTabId ? s.sessions.get(activeTabId) ?? null : null));
  const chatState = sessionState?.chatState ?? 'idle';
  const composerPrefill: null = null; // panda chatStore 暂无该字段；保留 cc-haha 占位语义。
  const activeSession = useSessionStore((state) =>
    activeTabId ? state.sessions.find((session) => session.id === activeTabId) ?? null : null,
  );
  const memberInfo: null = null; // panda 无 team 概念
  const hasMessages = useChatStore((s) =>
    activeTabId ? (s.sessions.get(activeTabId)?.messages?.length ?? 0) > 0 : false,
  );

  const isMemberSession = !!memberInfo;
  const isActive = isStreaming === true || chatState !== 'idle';
  const isWorkspaceMissing = false; // panda sessionMeta 无 workDirExists 字段
  const canSubmit = !isWorkspaceMissing && (input.trim().length > 0 || (!isMemberSession && attachments.length > 0));
  const isHeroComposer = variant === 'hero' && !isMemberSession;
  const resolvedWorkDir = activeSession?.cwd || undefined; // panda sessionStore 用 cwd

  // 拉取 slash commands（cc-haha 来自 chatStore.sessions[id].slashCommands；panda 来自 IPC）
  useEffect(() => {
    let cancelled = false;
    getSlashCommands()
      .then((resp) => {
        if (cancelled) return;
        // SlashCommandsResponse 是 SlashCommand[]（直接数组，无 wrapper）
        const list = (Array.isArray(resp) ? resp : []) as Array<{ name?: string; description?: string }>;
        const safe = list
          .filter((c): c is { name: string; description?: string } => typeof c?.name === 'string')
          .map((c) => ({ name: c.name, description: c.description ?? '' }));
        setSlashCommands(safe);
      })
      .catch(() => {
        /* 静默：保留 fallback */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    textareaRef.current?.focus();
  }, [isActive]);

  // panda 暂无 composerPrefill；保留 effect 等价占位。
  useEffect(() => {
    if (!composerPrefill) return;
  }, []);

  // panda 暂无 getGitInfo；ProjectContextChip 仅显示 workDir/repoName 即可。

  useEffect(() => {
    if (!isMemberSession) return;
    setAttachments([]);
    setPlusMenuOpen(false);
    setSlashMenuOpen(false);
    setFileSearchOpen(false);
  }, [isMemberSession, activeTabId]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [input]);

  useEffect(() => {
    if (!plusMenuOpen) return;
    const handleClick = (event: MouseEvent) => {
      if (plusMenuRef.current && !plusMenuRef.current.contains(event.target as Node)) {
        setPlusMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [plusMenuOpen]);

  useEffect(() => {
    if (!slashMenuOpen) return;
    const handleClick = (event: MouseEvent) => {
      if (
        slashMenuRef.current &&
        !slashMenuRef.current.contains(event.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(event.target as Node)
      ) {
        setSlashMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [slashMenuOpen]);

  useEffect(() => {
    if (!localSlashPanel) return;
    const handleClick = (event: MouseEvent) => {
      if (
        slashMenuRef.current &&
        !slashMenuRef.current.contains(event.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(event.target as Node)
      ) {
        setLocalSlashPanel(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [localSlashPanel]);

  useEffect(() => {
    if (!fileSearchOpen) return;
    const handleClick = (event: MouseEvent) => {
      const menu = document.getElementById('file-search-menu');
      if (
        menu &&
        !menu.contains(event.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(event.target as Node)
      ) {
        setFileSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [fileSearchOpen]);

  const filteredCommands = useMemo(() => {
    const source = mergeSlashCommands(slashCommands, FALLBACK_SLASH_COMMANDS);
    if (!slashFilter) return source;
    const lower = slashFilter.toLowerCase();
    return source.filter((command) => (
      command.name.toLowerCase().includes(lower) ||
      command.description.toLowerCase().includes(lower)
    ));
  }, [slashCommands, slashFilter]);

  const exactSlashCommand = useMemo(() => {
    const normalized = slashFilter.trim().toLowerCase();
    if (!normalized) return null;
    return filteredCommands.find((command) => command.name.toLowerCase() === normalized) ?? null;
  }, [filteredCommands, slashFilter]);

  useEffect(() => {
    setSlashSelectedIndex(0);
  }, [slashFilter]);

  useEffect(() => {
    const activeItem = slashMenuOpen ? slashItemRefs.current[slashSelectedIndex] : null;
    if (activeItem && typeof activeItem.scrollIntoView === 'function') {
      activeItem.scrollIntoView({ block: 'nearest' });
    }
  }, [slashMenuOpen, slashSelectedIndex]);

  const detectSlashTrigger = useCallback((value: string, cursorPos: number) => {
    const token = findSlashTrigger(value, cursorPos);
    if (!token) {
      setSlashMenuOpen(false);
      return;
    }

    setFileSearchOpen(false);
    setSlashFilter(token.filter);
    setSlashMenuOpen(true);
  }, []);

  // Detect @ trigger (file search)
  const detectAtTrigger = useCallback((value: string, cursorPos: number) => {
    const textBeforeCursor = value.slice(0, cursorPos);
    let pos = -1;

    for (let i = textBeforeCursor.length - 1; i >= 0; i--) {
      const ch = textBeforeCursor[i]!;
      if (ch === '@') {
        if (i === 0 || /\s/.test(textBeforeCursor[i - 1]!)) {
          pos = i;
          break;
        }
        break;
      }
      if (/\s/.test(ch)) {
        break;
      }
    }

    if (pos < 0) {
      setFileSearchOpen(false);
      setAtFilter('');
      setAtCursorPos(-1);
      return;
    }

    // Extract filter text after @
    const filter = textBeforeCursor.slice(pos + 1);
    setAtFilter(filter);
    setAtCursorPos(cursorPos);
    setSlashMenuOpen(false);
    setFileSearchOpen(true);
  }, []);

  const handleInputChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value;
    if (isMemberSession) {
      setInput(value);
      return;
    }
    const cursorPos = event.target.selectionStart ?? value.length;
    setInput(value);
    detectSlashTrigger(value, cursorPos);
    detectAtTrigger(value, cursorPos);
  };

  const selectSlashCommand = useCallback((command: string) => {
    const el = textareaRef.current;
    if (!el) return;
    const cursorPos = el.selectionStart ?? input.length;
    const replacement = replaceSlashToken(input, cursorPos, command);
    setInput(replacement.value);
    setSlashMenuOpen(false);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(replacement.cursorPos, replacement.cursorPos);
    });
  }, [input]);

  // Comdr 指令: composer slash shortcut — 把 /<command> 注入 textarea（不直接发送），由用户 Enter 自发。
  // 视觉同 PermissionMode/Plus 按钮：text + icon + h-7 + px-2.5 + rounded-md + hover:bg-surface-hover。
  const insertComposerShortcut = useCallback(
    (command: string) => {
      if (isMemberSession) return;
      const el = textareaRef.current;
      const cursorPos = el?.selectionStart ?? input.length;
      const replacement = replaceSlashToken(input, cursorPos, command, { trailingSpace: true });
      setInput(replacement.value);
      setSlashMenuOpen(false);
      setLocalSlashPanel(null);
      setPlusMenuOpen(false);
      requestAnimationFrame(() => {
        const node = textareaRef.current;
        if (!node) return;
        node.focus();
        node.setSelectionRange(replacement.cursorPos, replacement.cursorPos);
      });
    },
    [input, isMemberSession],
  );

  const handleSubmit = () => {
    const text = input.trim();
    if ((!text && (!attachments.length || isMemberSession)) || isWorkspaceMissing) return;

    const slashUiAction = !isMemberSession && text.startsWith('/') ? resolveSlashUiAction(text.slice(1)) : null;
    if (slashUiAction?.type === 'panel') {
      setLocalSlashPanel(slashUiAction.command as LocalSlashCommandName);
      setInput('');
      setSlashMenuOpen(false);
      setFileSearchOpen(false);
      setPlusMenuOpen(false);
      return;
    }

    if (slashUiAction?.type === 'settings') {
      useUIStore.getState().setPendingSettingsTab(slashUiAction.tab);
      useTabStore.getState().openTab(SETTINGS_TAB_ID, 'Settings', 'settings');
      setInput('');
      setSlashMenuOpen(false);
      setFileSearchOpen(false);
      setPlusMenuOpen(false);
      return;
    }

    if (!activeTabId) return;

    // panda chatStore.sendMessage 不接 attachments；序列化为内容尾部 @path 行（后端在 chat 流中可识别）。
    const attachmentLines = attachments.map((a) => `@${a.name}`).join(' ');
    const merged = attachmentLines ? (text ? `${text}\n${attachmentLines}` : attachmentLines) : text;

    if (onSend) {
      onSend(merged);
    } else {
      sendMessage(activeTabId, merged);
    }
    setInput('');
    setAttachments([]);
    setPlusMenuOpen(false);
    setSlashMenuOpen(false);
    setFileSearchOpen(false);
    setLocalSlashPanel(null);
  };

  const handleKeyDown = (event: ReactKeyboardEvent) => {
    // Ignore key events during IME composition (e.g. Chinese input method)
    if (composingRef.current || event.nativeEvent.isComposing || event.keyCode === 229) return;

    // Route file search navigation keys to FileSearchMenu
    if (fileSearchOpen) {
      const key = event.key;
      if (key === 'ArrowDown' || key === 'ArrowUp' || key === 'Enter' || key === 'Tab' || key === 'Escape') {
        event.preventDefault();
        if (key === 'Escape') {
          setFileSearchOpen(false);
          setAtFilter('');
          setAtCursorPos(-1);
          return;
        }
        fileSearchRef.current?.handleKeyDown(event.nativeEvent);
        return;
      }
      // Other keys (typing) should go to the textarea - let it propagate
      return;
    }

    if (slashMenuOpen && filteredCommands.length > 0) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setSlashSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
        return;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setSlashSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
        return;
      }
      if (event.key === 'Enter') {
        if (exactSlashCommand && slashFilter.trim().toLowerCase() === exactSlashCommand.name.toLowerCase()) {
          event.preventDefault();
          handleSubmit();
          return;
        }
        event.preventDefault();
        const selected = filteredCommands[slashSelectedIndex];
        if (selected) selectSlashCommand(selected.name);
        return;
      }
      if (event.key === 'Tab') {
        event.preventDefault();
        const selected = filteredCommands[slashSelectedIndex];
        if (selected) selectSlashCommand(selected.name);
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        setSlashMenuOpen(false);
        return;
      }
    }

    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  const handlePaste = (event: ClipboardEvent) => {
    if (isMemberSession) return;
    const items = event.clipboardData?.items;
    if (!items) return;

    let hasImage = false;
    for (let i = 0; i < items.length; i += 1) {
      const item = items[i];
      if (!item || !item.type.startsWith('image/')) continue;

      hasImage = true;
      event.preventDefault();
      const file = item.getAsFile();
      if (!file) continue;

      const id = `att-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const reader = new FileReader();
      reader.onload = () => {
        setAttachments((prev) => [
          ...prev,
          {
            id,
            name: `pasted-image-${Date.now()}.png`,
            type: 'image',
            mimeType: file.type || 'image/png',
            previewUrl: reader.result as string,
            data: reader.result as string,
          },
        ]);
      };
      reader.readAsDataURL(file);
    }

    if (!hasImage) return;
  };

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    if (isMemberSession) return;
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const id = `att-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const isImage = file.type.startsWith('image/');
      const reader = new FileReader();
      reader.onload = () => {
        setAttachments((prev) => [
          ...prev,
          {
            id,
            name: file.name,
            type: isImage ? 'image' : 'file',
            mimeType: file.type || undefined,
            previewUrl: isImage ? (reader.result as string) : undefined,
            data: reader.result as string,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });

    event.target.value = '';
  };

  const handleDrop = (event: ReactDragEvent) => {
    event.preventDefault();
    if (isMemberSession) return;
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const fakeEvent = { target: { files } } as unknown as ChangeEvent<HTMLInputElement>;
      handleFileSelect(fakeEvent);
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((attachment) => attachment.id !== id));
  };

  const insertSlashCommand = () => {
    if (isMemberSession) return;
    const el = textareaRef.current;
    const cursorPos = el?.selectionStart ?? input.length;
    const replacement = replaceSlashToken(input, cursorPos, '', { trailingSpace: false });
    setInput(replacement.value);
    setPlusMenuOpen(false);
    setSlashFilter('');
    setSlashMenuOpen(true);
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(replacement.cursorPos, replacement.cursorPos);
    });
  };

  // Imperative handle — 兼容老调用方（EmptySession/ActiveSession）
  useImperativeHandle(ref, () => ({
    focus: () => textareaRef.current?.focus(),
    clear: () => {
      setInput('');
      setAttachments([]);
    },
    insertSlash: () => {
      insertSlashCommand();
    },
  }));

  const composerPlaceholder =
    placeholder ??
    (isHeroComposer
      ? t('empty.placeholder')
      : isWorkspaceMissing
        ? t('chat.placeholderMissing')
        : isMemberSession
          ? t('teams.memberPlaceholder')
          : t('chat.placeholder'));

  const addFilesLabel = isHeroComposer ? t('empty.addFiles') : t('chat.addFiles');
  const slashCommandsLabel = isHeroComposer ? t('empty.slashCommands') : t('chat.slashCommands');

  return (
    <div className={isHeroComposer ? 'bg-[var(--pd-color-surface)] px-8 pb-4' : 'bg-[var(--pd-color-surface)] px-4 py-4'}>
      <div className={isHeroComposer ? 'mx-auto flex w-full max-w-3xl flex-col gap-2' : 'mx-auto max-w-[860px]'}>
        <div
          className={isHeroComposer
            ? 'glass-panel relative flex flex-col gap-3 rounded-xl p-4 transition-colors'
            : 'glass-panel relative rounded-xl p-4 transition-colors'}
          onDragOver={(event) => event.preventDefault()}
          onDrop={handleDrop}
        >
          {!isMemberSession && fileSearchOpen && (
            <PdFileSearchMenu
              ref={fileSearchRef}
              cwd={resolvedWorkDir || ''}
              filter={atFilter}
              onSelect={(_path, name) => {
                if (atCursorPos >= 0) {
                  // Insert name at cursor position, replacing filter text
                  const newValue = `${input.slice(0, atCursorPos)}${name}${input.slice(atCursorPos)}`;
                  const newCursorPos = atCursorPos + name.length;
                  setInput(newValue);
                  setFileSearchOpen(false);
                  setAtFilter('');
                  setAtCursorPos(-1);
                  void textareaRef.current?.focus();
                  requestAnimationFrame(() => {
                    textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos);
                  });
                }
              }}
            />
          )}

          {!isMemberSession && localSlashPanel && (
            <div ref={slashMenuRef}>
              <PdLocalSlashCommandPanel
                command={localSlashPanel}
                cwd={resolvedWorkDir}
                onClose={() => setLocalSlashPanel(null)}
              />
            </div>
          )}

          {!isMemberSession && slashMenuOpen && filteredCommands.length > 0 && (
            <div
              ref={slashMenuRef}
              className="absolute bottom-full left-0 right-0 z-50 mb-2 overflow-hidden rounded-xl border border-[var(--pd-color-border)] bg-[var(--pd-color-surface-container-lowest)] shadow-[var(--pd-shadow-dropdown)]"
            >
              <div className="max-h-[300px] overflow-y-auto py-1">
                {filteredCommands.map((command, index) => (
                  <button
                    key={command.name}
                    ref={(el) => { slashItemRefs.current[index] = el; }}
                    onClick={() => selectSlashCommand(command.name)}
                    onMouseEnter={() => setSlashSelectedIndex(index)}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      index === slashSelectedIndex
                        ? 'bg-[var(--pd-color-surface-hover)]'
                        : 'hover:bg-[var(--pd-color-surface-hover)]'
                    }`}
                  >
                    <span className="shrink-0 text-sm font-semibold text-[var(--pd-color-text-primary)]">
                      /{command.name}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-xs text-[var(--pd-color-text-tertiary)]">
                      {command.description}
                    </span>
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1.5 border-t border-[var(--pd-color-border)] px-4 py-2 text-xs text-[var(--pd-color-text-tertiary)]">
                <kbd className="rounded border border-[var(--pd-color-border)] bg-[var(--pd-color-surface-container-low)] px-1.5 py-0.5 font-mono text-[10px]">Up/Down</kbd>
                <span>{t('chat.navigate')}</span>
                <kbd className="ml-2 rounded border border-[var(--pd-color-border)] bg-[var(--pd-color-surface-container-low)] px-1.5 py-0.5 font-mono text-[10px]">Enter</kbd>
                <span>{t('chat.select')}</span>
                <kbd className="ml-2 rounded border border-[var(--pd-color-border)] bg-[var(--pd-color-surface-container-low)] px-1.5 py-0.5 font-mono text-[10px]">Esc</kbd>
                <span>{t('chat.dismiss')}</span>
              </div>
            </div>
          )}

          {attachments.length > 0 && (
            isHeroComposer ? (
              <PdAttachmentGallery attachments={attachments} variant="composer" onRemove={removeAttachment} />
            ) : (
              <div className="px-3 pt-3">
                <PdAttachmentGallery attachments={attachments} variant="composer" onRemove={removeAttachment} />
              </div>
            )
          )}

          {isHeroComposer ? (
            <div className="flex items-start gap-3">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onCompositionStart={() => { composingRef.current = true; }}
                onCompositionEnd={() => { composingRef.current = false; }}
                onPaste={handlePaste}
                placeholder={composerPlaceholder}
                disabled={isWorkspaceMissing || disabled}
                rows={2}
                className="flex-1 resize-none border-none bg-transparent py-2 leading-relaxed text-[var(--pd-color-text-primary)] outline-none placeholder:text-[var(--pd-color-text-tertiary)] disabled:opacity-50"
              />
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onCompositionStart={() => { composingRef.current = true; }}
              onCompositionEnd={() => { composingRef.current = false; }}
              onPaste={handlePaste}
              placeholder={composerPlaceholder}
              disabled={isWorkspaceMissing || disabled}
              rows={1}
              className="w-full resize-none bg-transparent py-2 pb-12 text-sm leading-relaxed text-[var(--pd-color-text-primary)] outline-none placeholder:text-[var(--pd-color-text-tertiary)] disabled:opacity-50"
            />
          )}

          <div className={isHeroComposer
            ? 'flex items-center justify-between border-t border-[var(--pd-color-border-separator)] pt-3'
            : 'absolute bottom-0 left-0 right-0 flex items-center justify-between border-t border-[var(--pd-color-border-separator)] px-3 py-3'}>
            <div className="flex items-center gap-2">
              {!isMemberSession && (
                <>
                  <div ref={plusMenuRef} className="relative">
                    <button
                      onClick={() => setPlusMenuOpen((value) => !value)}
                      aria-label="Open composer tools"
                      className="rounded-[var(--pd-radius-md)] p-1.5 text-[var(--pd-color-text-secondary)] transition-colors hover:bg-[var(--pd-color-surface-hover)]"
                    >
                      <span className="material-symbols-outlined text-[18px]">add</span>
                    </button>

                    {plusMenuOpen && (
                      <div className="absolute bottom-full left-0 z-50 mb-2 w-[240px] rounded-xl border border-[var(--pd-color-border)] bg-[var(--pd-color-surface-container-lowest)] py-1 shadow-[var(--pd-shadow-dropdown)]">
                        <button
                          onClick={() => {
                            fileInputRef.current?.click();
                            setPlusMenuOpen(false);
                          }}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-[var(--pd-color-surface-hover)]"
                        >
                          <span className="material-symbols-outlined text-[18px] text-[var(--pd-color-text-secondary)]">attach_file</span>
                          <span className="text-sm text-[var(--pd-color-text-primary)]">{addFilesLabel}</span>
                        </button>
                        <button
                          onClick={insertSlashCommand}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-[var(--pd-color-surface-hover)]"
                        >
                          <span className="w-[24px] text-center text-[18px] font-bold text-[var(--pd-color-text-secondary)]">/</span>
                          <span className="text-sm text-[var(--pd-color-text-primary)]">{slashCommandsLabel}</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <PdPermissionModeSelector />
                  {/* Comdr 指令: 替换 fork/branch/resume → debug + ultrareview slash 注入按钮。
                      点击仅写入 textarea，由用户继续填内容后 Enter 自行发送。
                      视觉对齐 PermissionMode/Plus 按钮：text + icon + h-7 + px-2.5 + rounded-md。 */}
                  {activeTabId && (
                    <>
                      <ComposerSlashShortcut
                        icon="bug_report"
                        label={t('composer.shortcut.debug')}
                        onClick={() => insertComposerShortcut('debug')}
                      />
                      <ComposerSlashShortcut
                        icon="rate_review"
                        label={t('composer.shortcut.ultrareview')}
                        onClick={() => insertComposerShortcut('ultrareview')}
                      />
                      {/* Comdr 指令 (截图 49 反馈): footer 左侧不再渲染 stop 按钮，
                          stop 控制完全走右侧主提交按钮（isActive 时变红色"停止"），
                          避免双 stop 入口。 */}
                    </>
                  )}
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              {!isMemberSession && activeTabId && (
                <PdModelSelector runtimeKey={activeTabId} disabled={isActive} />
              )}
              <button
                onClick={!isMemberSession && isActive
                  ? () => {
                      if (onStop) onStop();
                      else if (activeTabId) stopGeneration(activeTabId);
                    }
                  : handleSubmit}
                disabled={!isMemberSession && isActive ? false : !canSubmit}
                title={!isMemberSession && isActive ? t('chat.stopTitle') : undefined}
                className={`flex w-[112px] items-center justify-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all hover:brightness-105 disabled:opacity-30 ${
                  !isMemberSession && isActive
                    ? 'bg-[var(--pd-color-error-container)] text-[var(--pd-color-on-error-container)]'
                    : 'bg-[image:var(--pd-gradient-btn-primary)] text-[var(--pd-color-btn-primary-fg)] shadow-[var(--pd-shadow-button-primary-cc)]'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">
                  {!isMemberSession && isActive ? 'stop' : 'arrow_forward'}
                </span>
                {!isMemberSession && isActive ? t('common.stop') : isMemberSession ? t('common.send') : t('common.run')}
              </button>
            </div>
          </div>
        </div>

        <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileSelect} />

        {!isMemberSession && (
          <div className="mt-3 px-1">
            {hasMessages ? (
              <PdProjectContextChip
                workDir={resolvedWorkDir}
                repoName={null}
                branch={null}
              />
            ) : (
              <PdDirectoryPicker
                value={resolvedWorkDir || ''}
                onChange={() => {
                  // panda 暂不支持 cc-haha 的 deleteSession + createSession 重定向流程；
                  // DirectoryPicker 仅用于显示，切换工作目录请通过 sidebar 或新建会话。
                }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
});

PdComposer.displayName = 'PdComposer';

// ───────────────────────────────────────────────────────────────────────────
// Comdr 指令: ComposerSlashShortcut — text + icon 形态 (与 PermissionMode/Plus 同款)
//   点击注入 /<command> 到 textarea；用户继续填内容 Enter 自发。
// ───────────────────────────────────────────────────────────────────────────

function ComposerSlashShortcut({
  icon,
  label,
  onClick,
  variant = 'default',
}: {
  icon: string;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'danger';
}) {
  const isDanger = variant === 'danger';
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`flex h-7 items-center gap-1 rounded-[var(--pd-radius-md)] px-2.5 transition-colors hover:bg-[var(--pd-color-surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pd-color-border-focus)] ${
        isDanger ? 'text-[var(--pd-color-error)]' : 'text-[var(--pd-color-text-secondary)]'
      }`}
    >
      <span aria-hidden="true" className="material-symbols-outlined text-[14px]">
        {icon}
      </span>
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}
