// Input:  toolName / input / requestId/toolUseId / description? + (panda compat) visible / tier / onDecision
// Output: 内联 permission 卡（header tool icon + tier chip + tool details preview + [Allow / Allow session / Deny]）
// Pos:    Chat layer — security-critical user consent UI rendered inline in the message stream
//
// Source 1:1: cc-haha desktop/src/components/chat/PermissionDialog.tsx (L1-L262)
//   - className 转换：var(--color-*) → var(--pd-color-*)
//   - cc-haha shared/Button → panda shared/PdButton（1:1 等价）
//   - cc-haha DiffViewer → panda PdDiffViewer（同任务 S4 已有）
//   - cc-haha respondToPermission(tabId, requestId, true|false, {rule:'always'}?) → panda respondPermission(sid, toolUseId, 'allow'|'allow_session'|'deny')
//     panda 不支持 cc-haha rule:'always' 第 4 参形态；用 'allow_session' 决策即等价 cc-haha session-scope grant；
//   - panda 调用方现仍以 visible/tier/onDecision 形态使用（ActiveSession.tsx）；保留旧 props 作为兼容签名，
//     若提供 onDecision 则走旧路径，否则走 cc-haha 1:1 chatStore 寻址。
import { useState } from 'react';
import { useChatStore } from '../../stores/chatStore';
import { t } from '../../i18n';
import type { TranslationKey } from '../../i18n';
import { PdButton } from '../shared/PdButton';
import { PdDiffViewer } from './PdDiffViewer';

export type PermissionTier = 'read' | 'write' | 'exec';
export type PermissionDecision = 'allow' | 'allow_session' | 'deny';

export type PdPermissionDialogProps = {
  // cc-haha 原生 props（首选）
  requestId?: string;
  toolName: string;
  input: unknown;
  description?: string;
  // panda 兼容旧 props（ActiveSession.tsx 调用）
  visible?: boolean;
  tier?: PermissionTier;
  onDecision?: (decision: PermissionDecision) => void;
};

/**
 * Icons for known tool types.
 * Uses Material Symbols Outlined names.
 */
const TOOL_META: Record<string, { icon: string; label: string; color: string }> = {
  Bash: { icon: 'terminal', label: 'Bash', color: 'var(--pd-color-warning)' },
  Edit: { icon: 'edit_note', label: 'Edit File', color: 'var(--pd-color-brand)' },
  Write: { icon: 'edit_document', label: 'Write File', color: 'var(--pd-color-success)' },
  Read: { icon: 'description', label: 'Read File', color: 'var(--pd-color-secondary)' },
  Glob: { icon: 'search', label: 'Glob Search', color: 'var(--pd-color-secondary)' },
  Grep: { icon: 'find_in_page', label: 'Grep Search', color: 'var(--pd-color-secondary)' },
  Agent: { icon: 'smart_toy', label: 'Agent', color: 'var(--pd-color-tertiary)' },
  WebSearch: { icon: 'travel_explore', label: 'Web Search', color: 'var(--pd-color-secondary)' },
  WebFetch: { icon: 'cloud_download', label: 'Web Fetch', color: 'var(--pd-color-secondary)' },
  NotebookEdit: { icon: 'note', label: 'Notebook Edit', color: 'var(--pd-color-brand)' },
  Skill: { icon: 'auto_awesome', label: 'Skill', color: 'var(--pd-color-tertiary)' },
};

/**
 * Extract human-readable detail lines from tool input.
 */
function extractToolDetails(toolName: string, input: unknown, tt: (key: TranslationKey, params?: Record<string, string | number>) => string): { primary: string; secondary?: string } {
  const obj = (input && typeof input === 'object') ? input as Record<string, unknown> : {};

  switch (toolName) {
    case 'Bash': {
      const cmd = typeof obj.command === 'string' ? obj.command : '';
      const desc = typeof obj.description === 'string' ? obj.description : undefined;
      return { primary: cmd, secondary: desc };
    }
    case 'Edit': {
      const filePath = typeof obj.file_path === 'string' ? obj.file_path : '';
      return { primary: filePath, secondary: obj.old_string ? tt('permission.replacingContent') : undefined };
    }
    case 'Write': {
      const filePath = typeof obj.file_path === 'string' ? obj.file_path : '';
      return { primary: filePath };
    }
    case 'Read': {
      const filePath = typeof obj.file_path === 'string' ? obj.file_path : '';
      return { primary: filePath };
    }
    case 'Glob':
      return { primary: typeof obj.pattern === 'string' ? obj.pattern : '' };
    case 'Grep':
      return { primary: typeof obj.pattern === 'string' ? obj.pattern : '' };
    case 'Agent':
      return { primary: typeof obj.description === 'string' ? obj.description : '' };
    case 'WebSearch':
      return { primary: typeof obj.query === 'string' ? obj.query : '' };
    case 'WebFetch':
      return { primary: typeof obj.url === 'string' ? obj.url : '' };
    default:
      return { primary: typeof input === 'string' ? input : JSON.stringify(input, null, 2) };
  }
}

function getPermissionTitle(toolName: string, input: unknown, tt: (key: TranslationKey, params?: Record<string, string | number>) => string) {
  const obj = (input && typeof input === 'object') ? input as Record<string, unknown> : {};
  const filePath = typeof obj.file_path === 'string' ? obj.file_path : '';
  const fileName = filePath ? filePath.split('/').pop() || filePath : '';

  switch (toolName) {
    case 'Edit':
    case 'Write':
      return fileName ? tt('permission.allowEditFile', { toolName, fileName }) : tt('permission.allowEditFileGeneric', { toolName: toolName.toLowerCase() });
    case 'Bash':
      return tt('permission.allowBash');
    default:
      return tt('permission.allowTool', { toolName });
  }
}

function renderPermissionPreview(toolName: string, input: unknown) {
  const obj = (input && typeof input === 'object') ? input as Record<string, unknown> : {};
  const filePath = typeof obj.file_path === 'string' ? obj.file_path : 'file';

  if (toolName === 'Edit' && typeof obj.old_string === 'string' && typeof obj.new_string === 'string') {
    return <PdDiffViewer filePath={filePath} oldString={obj.old_string} newString={obj.new_string} />;
  }

  if (toolName === 'Write' && typeof obj.content === 'string') {
    return <PdDiffViewer filePath={filePath} oldString="" newString={obj.content} />;
  }

  if (toolName === 'Bash' && typeof obj.command === 'string') {
    return (
      <div className="overflow-x-auto rounded-[var(--pd-radius-md)] bg-[var(--pd-color-terminal-bg)] px-3 py-2.5">
        <pre className="font-[var(--pd-font-mono)] text-[11px] leading-[1.3] text-[var(--pd-color-terminal-fg)] whitespace-pre-wrap break-words">
          <span className="text-[var(--pd-color-terminal-accent)] select-none">$ </span>{obj.command}
        </pre>
      </div>
    );
  }

  return null;
}

export function PdPermissionDialog({
  requestId,
  toolName,
  input,
  description,
  visible,
  onDecision,
}: PdPermissionDialogProps) {
  const respondPermission = useChatStore((s) => s.respondPermission);
  const activeSessionId = useChatStore((s) => s.activeSessionId);
  const pendingPermission = useChatStore((s) =>
    activeSessionId ? s.sessions.get(activeSessionId)?.pendingPermission ?? null : null,
  );
  const [showRaw, setShowRaw] = useState(false);

  // 兼容路径：旧 panda props（visible+onDecision）→ 视为永远 pending；新 cc-haha 路径用 store pendingPermission 寻址。
  const compatMode = onDecision !== undefined;
  const effectiveRequestId = requestId ?? pendingPermission?.toolUseId ?? '';
  const isPending = compatMode
    ? visible !== false
    : pendingPermission?.toolUseId === effectiveRequestId;

  const meta = TOOL_META[toolName] || { icon: 'shield', label: toolName, color: 'var(--pd-color-text-tertiary)' };
  const details = extractToolDetails(toolName, input, t as (key: TranslationKey, params?: Record<string, string | number>) => string);
  const rawInput = typeof input === 'string' ? input : JSON.stringify(input, null, 2);
  const preview = renderPermissionPreview(toolName, input);
  const title = getPermissionTitle(toolName, input, t as (key: TranslationKey, params?: Record<string, string | number>) => string);
  const allowRawToggle = !preview;

  const handleAllow = () => {
    if (compatMode) {
      onDecision!('allow');
      return;
    }
    if (activeSessionId && effectiveRequestId) respondPermission(activeSessionId, effectiveRequestId, 'allow');
  };

  const handleAllowSession = () => {
    if (compatMode) {
      onDecision!('allow_session');
      return;
    }
    if (activeSessionId && effectiveRequestId) respondPermission(activeSessionId, effectiveRequestId, 'allow_session');
  };

  const handleDeny = () => {
    if (compatMode) {
      onDecision!('deny');
      return;
    }
    if (activeSessionId && effectiveRequestId) respondPermission(activeSessionId, effectiveRequestId, 'deny');
  };

  return (
    <div className={`mb-4 overflow-hidden rounded-[var(--pd-radius-lg)] border ${
      isPending
        ? 'border-[var(--pd-color-warning)] bg-[var(--pd-color-surface-container-lowest)]'
        : 'border-[var(--pd-color-outline-variant)]/40 bg-[var(--pd-color-surface-container-low)] opacity-70'
    }`}>
      {/* Header */}
      <div className={`flex items-center gap-3 px-4 py-3 ${
        isPending
          ? 'bg-[var(--pd-color-surface-container)]'
          : 'bg-[var(--pd-color-surface-container-low)]'
      }`}>
        <div
          className="flex items-center justify-center w-8 h-8 rounded-[var(--pd-radius-md)]"
          style={{ backgroundColor: `${meta.color}18` }}
        >
          <span
            className="material-symbols-outlined text-[18px]"
            style={{ color: meta.color }}
          >
            {meta.icon}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[var(--pd-color-text-primary)]">
              {title}
            </span>
            {isPending && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[var(--pd-color-warning)]/15 text-[var(--pd-color-warning)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--pd-color-warning)] animate-pulse-dot" />
                {t('permission.awaitingApproval')}
              </span>
            )}
            {!isPending && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[var(--pd-color-surface-container-high)] text-[var(--pd-color-text-tertiary)]">
                {t('permission.responded')}
              </span>
            )}
          </div>
          {description && (
            <p className="mt-0.5 text-xs text-[var(--pd-color-text-secondary)] truncate">{description}</p>
          )}
        </div>
      </div>

      {/* Tool details */}
      <div className="border-t border-[var(--pd-color-outline-variant)]/20 px-4 py-3">
        {preview ? (
          <div className="space-y-2">
            {details.primary && toolName !== 'Bash' ? (
              <div className="flex items-center gap-2 rounded-[var(--pd-radius-md)] bg-[var(--pd-color-surface-container)] px-3 py-2 text-xs font-[var(--pd-font-mono)] text-[var(--pd-color-text-secondary)]">
                <span className="material-symbols-outlined text-[14px] text-[var(--pd-color-outline)] flex-shrink-0">
                  folder_open
                </span>
                <span className="truncate">{details.primary}</span>
              </div>
            ) : null}
            {preview}
          </div>
        ) : details.primary ? (
          <div className="mb-2">
            <div className="flex items-center gap-2 rounded-[var(--pd-radius-md)] bg-[var(--pd-color-surface-container)] px-3 py-2 text-xs font-[var(--pd-font-mono)] text-[var(--pd-color-text-secondary)]">
              <span className="material-symbols-outlined text-[14px] text-[var(--pd-color-outline)] flex-shrink-0">
                {toolName === 'Glob' || toolName === 'Grep' ? 'search' : 'folder_open'}
              </span>
              <span className="truncate">{details.primary}</span>
            </div>
          </div>
        ) : null}

        {/* Secondary detail */}
        {details.secondary && (
          <p className="mt-2 text-xs text-[var(--pd-color-text-tertiary)]">{details.secondary}</p>
        )}

        {allowRawToggle && (
          <button
            onClick={() => setShowRaw(!showRaw)}
            className="mt-2 flex cursor-pointer items-center gap-1 text-[11px] text-[var(--pd-color-text-accent)] hover:underline"
          >
            <span className="material-symbols-outlined text-[14px]">
              {showRaw ? 'expand_less' : 'expand_more'}
            </span>
            {showRaw ? t('permission.hideDetails') : t('permission.showFullInput')}
          </button>
        )}

        {allowRawToggle && showRaw && (
          <pre className="mt-2 max-h-[220px] overflow-y-auto overflow-x-auto rounded-[var(--pd-radius-md)] bg-[var(--pd-color-terminal-bg)] px-3 py-2.5 font-[var(--pd-font-mono)] text-[11px] leading-[1.3] text-[var(--pd-color-terminal-fg)] whitespace-pre-wrap break-words">
            {rawInput}
          </pre>
        )}
      </div>

      {/* Action buttons */}
      {isPending && (
        <div className="flex items-center gap-2 border-t border-[var(--pd-color-outline-variant)]/20 bg-[var(--pd-color-surface-container-low)] px-4 py-3">
          <PdButton
            variant="primary"
            size="sm"
            onClick={handleAllow}
            icon={
              <span className="material-symbols-outlined text-[14px]">check</span>
            }
          >
            {t('permission.allow')}
          </PdButton>
          <PdButton
            variant="ghost"
            size="sm"
            onClick={handleAllowSession}
            icon={
              <span className="material-symbols-outlined text-[14px]">verified</span>
            }
          >
            {t('permission.allowForSession')}
          </PdButton>
          <div className="flex-1" />
          <PdButton
            variant="danger"
            size="sm"
            onClick={handleDeny}
            icon={
              <span className="material-symbols-outlined text-[14px]">close</span>
            }
          >
            {t('permission.deny')}
          </PdButton>
        </div>
      )}
    </div>
  );
}

PdPermissionDialog.displayName = 'PdPermissionDialog';
