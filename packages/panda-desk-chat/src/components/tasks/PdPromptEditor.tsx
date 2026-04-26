// Input: prompt textarea value + permissionMode + modelId + folderPath + useWorktree
// Output: 边框包装的 textarea + 底部工具栏（PermissionMode/Model/Directory 选择器 + bypass warning）
// Pos: components/tasks/ — PdNewTaskModal 子控件
//
// Source 1:1: cc-haha desktop/src/components/tasks/PromptEditor.tsx L1-74 (74 行)
//   panda 适配：
//     - cc-haha PermissionModeSelector → panda PdPermissionModeSelector
//     - cc-haha ModelSelector → panda PdModelSelector
//     - cc-haha DirectoryPicker → panda PdDirectoryPicker
//     - cc-haha useTranslation hook → panda t()
//     - cc-haha var(--color-*) / radius → panda var(--pd-color-*) / pd-radius
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import { PdPermissionModeSelector } from '../controls/PdPermissionModeSelector';
import { PdModelSelector } from '../controls/PdModelSelector';
import { PdDirectoryPicker } from '../shared/PdDirectoryPicker';
import { t } from '../../i18n';
import type { PermissionMode } from '../../types/settings';

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;

  permissionMode: PermissionMode;
  onPermissionModeChange: (mode: PermissionMode) => void;

  modelId: string;
  onModelChange: (modelId: string) => void;

  folderPath: string;
  onFolderPathChange: (path: string) => void;

  useWorktree: boolean;
  onUseWorktreeChange: (checked: boolean) => void;
};

export function PdPromptEditor({
  value,
  onChange,
  placeholder,
  permissionMode,
  onPermissionModeChange,
  modelId,
  onModelChange,
  folderPath,
  onFolderPathChange,
  useWorktree: _useWorktree,
  onUseWorktreeChange: _onUseWorktreeChange,
}: Props) {
  return (
    <div className="rounded-[var(--pd-radius-lg)] border border-[var(--pd-color-border)] focus-within:border-[var(--pd-color-border-focus)] transition-colors overflow-visible">
      {/* Prompt textarea */}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        className="w-full resize-y bg-transparent px-3 py-2.5 text-sm leading-relaxed text-[var(--pd-color-text-primary)] outline-none placeholder:text-[var(--pd-color-text-tertiary)]"
        style={{ minHeight: 120 }}
      />

      {/* Bottom toolbar */}
      <div className="border-t border-[var(--pd-color-border)]/40 px-3 py-2 flex flex-col gap-2 bg-[var(--pd-color-surface-container-low)] rounded-b-[var(--pd-radius-lg)]">
        {/* Row 1: Permission + Model selectors */}
        <div className="flex items-center justify-between">
          <PdPermissionModeSelector value={permissionMode} onChange={onPermissionModeChange} workDir={folderPath || undefined} />
          <PdModelSelector value={modelId} onChange={onModelChange} />
        </div>

        {/* Row 2: Folder picker */}
        <div className="flex items-center justify-between">
          <PdDirectoryPicker value={folderPath} onChange={onFolderPathChange} />
        </div>

        {/* Bypass + no folder warning */}
        {permissionMode === 'bypassPermissions' && (
          <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-[var(--pd-color-error)]/8 text-[10px] text-[var(--pd-color-error)]">
            <span className="material-symbols-outlined text-[12px]">warning</span>
            {t('promptEditor.bypassWarning')}{folderPath ? ` ${t('promptEditor.within')} ${folderPath}` : ` ${t('promptEditor.selectFolder')}`}.
          </div>
        )}
      </div>
    </div>
  );
}
