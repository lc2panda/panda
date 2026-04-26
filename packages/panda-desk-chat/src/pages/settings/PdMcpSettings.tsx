// Input: mcpStore (servers / CRUD / toggle / reconnect / refreshStatus)
// Output: MCP server list grouped by scope · stat cards · create/edit/details forms · delete dialog
// Pos: Settings tab — sixth entry (icon: dns)
//
// Source 1:1: cc-haha desktop/src/pages/McpSettings.tsx (1024 行)
//   panda IPC 缺 mcpApi → mcpStore 走 localStorage stub。
//   className 严格 cc-haha；--color-* → --pd-color-*。
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import { useEffect, useMemo, useRef, useState } from 'react';
import { t } from '../../i18n';
import { PdButton } from '../../components/shared/PdButton';
import { PdInput } from '../../components/shared/PdInput';
import { PdModal } from '../../components/shared/PdModal';
import { useUIStore } from '../../stores/uiStore';
import { useMcpStore } from '../../stores/mcpStore';
import type {
  McpServerRecord,
  McpUpsertPayload,
} from '../../types/mcp';

type EditorMode =
  | { type: 'list' }
  | { type: 'create' }
  | { type: 'edit'; server: McpServerRecord }
  | { type: 'details'; server: McpServerRecord };

type TransportKind = 'stdio' | 'http' | 'sse';

type StringRow = { id: string; value: string };
type KeyValueRow = { id: string; key: string; value: string };

type McpDraft = {
  name: string;
  transport: TransportKind;
  command: string;
  args: StringRow[];
  env: KeyValueRow[];
  url: string;
  headers: KeyValueRow[];
  headersHelper: string;
  oauthClientId: string;
  oauthCallbackPort: string;
};

type McpGroupKey =
  | 'plugin'
  | 'user'
  | 'project'
  | 'local'
  | 'managed'
  | 'enterprise'
  | 'claudeai'
  | 'dynamic';

const MCP_GROUP_ORDER: McpGroupKey[] = [
  'plugin',
  'user',
  'project',
  'local',
  'managed',
  'enterprise',
  'claudeai',
  'dynamic',
];

const STATUS_TONE: Record<McpServerRecord['status'], string> = {
  connected: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  checking: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
  'needs-auth': 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  failed: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
  disabled:
    'bg-[var(--pd-color-surface-hover)] text-[var(--pd-color-text-secondary)] border-[var(--pd-color-border)]',
};

function createId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createStringRow(value = ''): StringRow {
  return { id: createId(), value };
}

function createKeyValueRow(key = '', value = ''): KeyValueRow {
  return { id: createId(), key, value };
}

function createEmptyDraft(): McpDraft {
  return {
    name: '',
    transport: 'stdio',
    command: '',
    args: [createStringRow('')],
    env: [createKeyValueRow()],
    url: '',
    headers: [createKeyValueRow()],
    headersHelper: '',
    oauthClientId: '',
    oauthCallbackPort: '',
  };
}

function isStdioConfig(
  config: McpServerRecord['config'],
): config is Extract<McpServerRecord['config'], { type: 'stdio' }> {
  return config.type === 'stdio';
}

function isRemoteConfig(
  config: McpServerRecord['config'],
): config is Extract<McpServerRecord['config'], { type: 'http' | 'sse' }> {
  return config.type === 'http' || config.type === 'sse';
}

function draftFromServer(server: McpServerRecord): McpDraft {
  const base = createEmptyDraft();
  base.name = server.name;

  if (isStdioConfig(server.config)) {
    return {
      ...base,
      transport: 'stdio',
      command: server.config.command,
      args: (server.config.args.length ? server.config.args : ['']).map((value) =>
        createStringRow(value),
      ),
      env: Object.entries(server.config.env ?? {})
        .map(([key, value]) => createKeyValueRow(key, value))
        .concat(
          Object.keys(server.config.env ?? {}).length === 0
            ? [createKeyValueRow()]
            : [],
        ),
    };
  }

  if (isRemoteConfig(server.config)) {
    return {
      ...base,
      transport: server.config.type,
      url: server.config.url,
      headers: Object.entries(server.config.headers ?? {})
        .map(([key, value]) => createKeyValueRow(key, value))
        .concat(
          Object.keys(server.config.headers ?? {}).length === 0
            ? [createKeyValueRow()]
            : [],
        ),
      headersHelper: server.config.headersHelper ?? '',
      oauthClientId: server.config.oauth?.clientId ?? '',
      oauthCallbackPort: server.config.oauth?.callbackPort
        ? String(server.config.oauth.callbackPort)
        : '',
    };
  }

  return base;
}

function rowsToRecord(rows: KeyValueRow[]) {
  const entries: Array<[string, string]> = [];
  for (const row of rows) {
    const key = row.key.trim();
    if (!key) continue;
    entries.push([key, row.value]);
  }
  return Object.fromEntries(entries);
}

function rowsToList(rows: StringRow[]) {
  return rows.map((row) => row.value.trim()).filter(Boolean);
}

function buildPayload(draft: McpDraft): McpUpsertPayload {
  if (draft.transport === 'stdio') {
    return {
      scope: 'user',
      config: {
        type: 'stdio',
        command: draft.command.trim(),
        args: rowsToList(draft.args),
        env: rowsToRecord(draft.env),
      },
    };
  }

  const oauthCallbackPort = draft.oauthCallbackPort.trim();
  const callbackPortNumber = oauthCallbackPort ? Number(oauthCallbackPort) : undefined;
  const oauthClientId = draft.oauthClientId.trim();

  return {
    scope: 'user',
    config: {
      type: draft.transport,
      url: draft.url.trim(),
      headers: rowsToRecord(draft.headers),
      ...(draft.headersHelper.trim()
        ? { headersHelper: draft.headersHelper.trim() }
        : {}),
      ...(oauthClientId || callbackPortNumber
        ? {
            oauth: {
              ...(oauthClientId ? { clientId: oauthClientId } : {}),
              ...(callbackPortNumber ? { callbackPort: callbackPortNumber } : {}),
            },
          }
        : {}),
    },
  };
}

function isDraftValid(draft: McpDraft) {
  if (!draft.name.trim()) return false;
  if (draft.transport === 'stdio') return draft.command.trim().length > 0;
  return draft.url.trim().length > 0;
}

function transportLabel(transport: string) {
  switch (transport) {
    case 'stdio':
      return 'STDIO';
    case 'http':
      return t('settings.mcp.transport.http');
    case 'sse':
      return 'SSE';
    default:
      return transport;
  }
}

function getServerGroupKey(server: McpServerRecord): McpGroupKey {
  if (server.name.startsWith('plugin:')) return 'plugin';
  return server.scope;
}

function scopeLabel(server: McpServerRecord) {
  const group = getServerGroupKey(server);
  if (group === 'plugin') return t('settings.mcp.scope.plugin');
  return t(`settings.mcp.scope.${group}`);
}

function StatusBadge({ server }: { server: McpServerRecord }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${STATUS_TONE[server.status]}`}
    >
      {server.statusLabel}
    </span>
  );
}

function ToggleSwitch({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
        checked ? 'bg-[#90c1f7]' : 'bg-[var(--pd-color-border)]'
      } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-7' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

function ArraySection({
  title,
  rows,
  onChange,
  onAdd,
  onRemove,
  keyPlaceholder,
  valuePlaceholder,
  singleValue = false,
  addLabel,
}: {
  title: string;
  rows: KeyValueRow[] | StringRow[];
  onChange: (id: string, field: 'key' | 'value', value: string) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  keyPlaceholder?: string;
  valuePlaceholder: string;
  singleValue?: boolean;
  addLabel: string;
}) {
  return (
    <section className="rounded-[var(--pd-radius-xl)] border border-[var(--pd-color-border)] bg-[var(--pd-color-surface)] p-5">
      <div className="text-sm font-semibold text-[var(--pd-color-text-primary)] mb-4">
        {title}
      </div>
      <div className="space-y-3">
        {rows.map((row) => (
          <div
            key={row.id}
            className={`grid gap-3 ${singleValue ? 'grid-cols-[minmax(0,1fr)_32px]' : 'grid-cols-[minmax(0,1fr)_minmax(0,1fr)_32px]'}`}
          >
            {!singleValue && 'key' in row && (
              <PdInput
                value={row.key}
                onChange={(event) => onChange(row.id, 'key', event.target.value)}
                placeholder={keyPlaceholder}
              />
            )}
            <PdInput
              value={row.value}
              onChange={(event) => onChange(row.id, 'value', event.target.value)}
              placeholder={valuePlaceholder}
            />
            <button
              type="button"
              onClick={() => onRemove(row.id)}
              className="mt-1 flex h-10 w-8 items-center justify-center rounded-[var(--pd-radius-md)] text-[var(--pd-color-text-tertiary)] transition-colors hover:bg-[var(--pd-color-surface-hover)] hover:text-[var(--pd-color-text-primary)]"
              aria-label={addLabel}
            >
              <span aria-hidden="true" className="material-symbols-outlined text-[18px]">delete</span>
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={onAdd}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-[var(--pd-radius-lg)] bg-[var(--pd-color-surface-hover)] text-[var(--pd-color-text-secondary)] transition-colors hover:text-[var(--pd-color-text-primary)]"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-[18px]">add</span>
          {addLabel}
        </button>
      </div>
    </section>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="rounded-2xl border border-[var(--pd-color-border)] bg-[var(--pd-color-surface-container-low)] px-5 py-4">
      <div className="flex items-center gap-2 text-[var(--pd-color-text-tertiary)] mb-2">
        <span aria-hidden="true" className="material-symbols-outlined text-[18px]">{icon}</span>
        <span className="text-xs uppercase tracking-[0.18em] font-semibold">{label}</span>
      </div>
      <div className="text-3xl font-semibold text-[var(--pd-color-text-primary)]">{value}</div>
    </div>
  );
}

function ServerRow({
  server,
  isBusy,
  onOpen,
  onToggle,
}: {
  server: McpServerRecord;
  isBusy: boolean;
  onOpen: () => void;
  onToggle: () => void;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-4 px-6 py-5 border-t border-[var(--pd-color-border)] first:border-t-0">
      <div className="min-w-0">
        <div className="flex items-center gap-3 mb-2 min-w-0">
          <div className="text-[1.05rem] font-semibold text-[var(--pd-color-text-primary)] truncate">
            {server.name}
          </div>
          <StatusBadge server={server} />
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--pd-color-text-tertiary)]">
          <span className="rounded-full bg-[var(--pd-color-surface-hover)] px-2 py-1 font-medium text-[var(--pd-color-text-secondary)]">
            {transportLabel(server.transport)}
          </span>
          <span className="rounded-full bg-[var(--pd-color-surface-hover)] px-2 py-1 font-medium text-[var(--pd-color-text-secondary)]">
            {scopeLabel(server)}
          </span>
          <span className="truncate">{server.summary}</span>
        </div>
        {server.statusDetail && (
          <div className="mt-2 text-xs text-[var(--pd-color-text-tertiary)] truncate">
            {server.statusDetail}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onOpen}
        className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--pd-color-text-secondary)] transition-colors hover:bg-[var(--pd-color-surface-hover)] hover:text-[var(--pd-color-text-primary)]"
        aria-label={`Open ${server.name}`}
      >
        <span aria-hidden="true" className="material-symbols-outlined text-[20px]">settings</span>
      </button>

      <ToggleSwitch
        checked={server.enabled}
        disabled={isBusy || !server.canToggle}
        onChange={onToggle}
      />
    </div>
  );
}

export function PdMcpSettings() {
  const servers = useMcpStore((s) => s.servers);
  const selectedServer = useMcpStore((s) => s.selectedServer);
  const isLoading = useMcpStore((s) => s.isLoading);
  const error = useMcpStore((s) => s.error);
  const fetchServers = useMcpStore((s) => s.fetchServers);
  const createServer = useMcpStore((s) => s.createServer);
  const updateServer = useMcpStore((s) => s.updateServer);
  const deleteServer = useMcpStore((s) => s.deleteServer);
  const toggleServer = useMcpStore((s) => s.toggleServer);
  const reconnectServer = useMcpStore((s) => s.reconnectServer);
  const selectServer = useMcpStore((s) => s.selectServer);
  const addToast = useUIStore((s) => s.addToast);

  const [view, setView] = useState<EditorMode>({ type: 'list' });
  const [draft, setDraft] = useState<McpDraft>(createEmptyDraft);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [busyServerName, setBusyServerName] = useState<string | null>(null);
  const [pendingDeleteServer, setPendingDeleteServer] =
    useState<McpServerRecord | null>(null);
  const refreshInFlightRef = useRef(new Set<string>());

  useEffect(() => {
    void fetchServers(undefined, undefined);
  }, [fetchServers]);

  const groupedServers = useMemo(() => {
    const groups: Partial<Record<McpGroupKey, McpServerRecord[]>> = {};
    for (const server of servers) {
      const key = getServerGroupKey(server);
      (groups[key] ??= []).push(server);
    }
    return groups;
  }, [servers]);

  const stats = useMemo(
    () => ({
      total: servers.length,
      connected: servers.filter((s) => s.status === 'connected').length,
      attention: servers.filter(
        (s) => s.status === 'failed' || s.status === 'needs-auth',
      ).length,
    }),
    [servers],
  );

  const beginCreate = () => {
    setDraft(createEmptyDraft());
    setView({ type: 'create' });
  };

  const beginEdit = (server: McpServerRecord) => {
    selectServer(server);
    if (!server.canEdit) {
      setView({ type: 'details', server });
      return;
    }
    setDraft(draftFromServer(server));
    setView({ type: 'edit', server });
  };

  useEffect(() => {
    if (!selectedServer) return;
    if (selectedServer.canEdit) {
      setDraft(draftFromServer(selectedServer));
      setView({ type: 'edit', server: selectedServer });
    } else {
      setView({ type: 'details', server: selectedServer });
    }
  }, [selectedServer]);

  // 防止 lint 警告：refreshInFlightRef 未使用
  void refreshInFlightRef;

  const handleToggle = async (server: McpServerRecord) => {
    setBusyServerName(server.name);
    try {
      const updated = await toggleServer(server, undefined);
      addToast({
        type: 'success',
        message: updated.enabled
          ? t('settings.mcp.toast.enabled', { name: server.name })
          : t('settings.mcp.toast.disabled', { name: server.name }),
      });
    } catch (err) {
      addToast({
        type: 'error',
        message:
          err instanceof Error ? err.message : t('settings.mcp.toast.toggleFailed'),
      });
    } finally {
      setBusyServerName(null);
    }
  };

  const handleReconnect = async (server: McpServerRecord) => {
    setBusyServerName(server.name);
    try {
      const updated = await reconnectServer(server, undefined);
      addToast({
        type: updated.status === 'connected' ? 'success' : 'warning',
        message:
          updated.status === 'connected'
            ? t('settings.mcp.toast.reconnected', { name: server.name })
            : updated.statusDetail || updated.statusLabel,
      });
      if (view.type === 'edit') setView({ type: 'edit', server: updated });
      if (view.type === 'details') setView({ type: 'details', server: updated });
    } catch (err) {
      addToast({
        type: 'error',
        message:
          err instanceof Error ? err.message : t('settings.mcp.toast.reconnectFailed'),
      });
    } finally {
      setBusyServerName(null);
    }
  };

  const handleDelete = (server: McpServerRecord) => setPendingDeleteServer(server);

  const confirmDelete = async () => {
    const server = pendingDeleteServer;
    if (!server) return;
    setIsDeleting(true);
    try {
      await deleteServer(server, undefined);
      addToast({
        type: 'success',
        message: t('settings.mcp.toast.deleted', { name: server.name }),
      });
      setView({ type: 'list' });
      selectServer(null);
      setPendingDeleteServer(null);
    } catch (err) {
      addToast({
        type: 'error',
        message:
          err instanceof Error ? err.message : t('settings.mcp.toast.deleteFailed'),
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const deleteModal = (
    <PdModal
      open={pendingDeleteServer !== null}
      onClose={() => {
        if (isDeleting) return;
        setPendingDeleteServer(null);
      }}
      title={t('settings.mcp.form.deleteTitle')}
      footer={
        <>
          <PdButton
            variant="ghost"
            onClick={() => setPendingDeleteServer(null)}
            disabled={isDeleting}
          >
            {t('settings.mcp.form.cancel')}
          </PdButton>
          <PdButton
            variant="danger"
            onClick={() => void confirmDelete()}
            loading={isDeleting}
          >
            {t('settings.mcp.form.confirmDelete')}
          </PdButton>
        </>
      }
    >
      <p className="text-sm leading-6 text-[var(--pd-color-text-secondary)]">
        {pendingDeleteServer
          ? t('settings.mcp.form.deleteConfirmBody', {
              name: pendingDeleteServer.name,
            })
          : ''}
      </p>
    </PdModal>
  );

  const handleSave = async () => {
    if (!isDraftValid(draft)) return;
    setIsSaving(true);
    try {
      const payload = buildPayload(draft);
      const saved =
        view.type === 'edit'
          ? await updateServer(view.server, payload, undefined)
          : await createServer(draft.name.trim(), payload, undefined);

      addToast({
        type: 'success',
        message:
          view.type === 'edit'
            ? t('settings.mcp.toast.saved', { name: saved.name })
            : t('settings.mcp.toast.created', { name: saved.name }),
      });
      setView({ type: 'list' });
      selectServer(null);
    } catch (err) {
      addToast({
        type: 'error',
        message:
          err instanceof Error ? err.message : t('settings.mcp.toast.saveFailed'),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const setDraftField = <K extends keyof McpDraft>(key: K, value: McpDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const updateStringRows = (key: 'args', id: string, value: string) => {
    setDraft((current) => ({
      ...current,
      [key]: current[key].map((row) => (row.id === id ? { ...row, value } : row)),
    }));
  };

  const updateKeyValueRows = (
    key: 'env' | 'headers',
    id: string,
    field: 'key' | 'value',
    value: string,
  ) => {
    setDraft((current) => ({
      ...current,
      [key]: current[key].map((row) =>
        row.id === id ? { ...row, [field]: value } : row,
      ),
    }));
  };

  const addRow = (key: 'args' | 'env' | 'headers') => {
    setDraft((current) => ({
      ...current,
      [key]: [
        ...current[key],
        key === 'args' ? createStringRow() : createKeyValueRow(),
      ],
    }));
  };

  const removeRow = (key: 'args' | 'env' | 'headers', id: string) => {
    setDraft((current) => {
      const next = current[key].filter((row) => row.id !== id);
      return {
        ...current,
        [key]: next.length > 0
          ? next
          : [key === 'args' ? createStringRow() : createKeyValueRow()],
      };
    });
  };

  if (view.type === 'details') {
    const server = view.server;
    return (
      <>
        <div className="max-w-5xl min-w-0">
          <button
            type="button"
            onClick={() => setView({ type: 'list' })}
            className="mb-5 inline-flex items-center gap-2 text-sm text-[var(--pd-color-text-secondary)] transition-colors hover:text-[var(--pd-color-text-primary)]"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[18px]">arrow_back</span>
            {t('settings.mcp.form.back')}
          </button>

          <div className="flex items-start justify-between gap-4 mb-8">
            <div>
              <h2 className="text-[2.2rem] font-semibold tracking-[-0.03em] text-[var(--pd-color-text-primary)]">
                {server.name}
              </h2>
              <p className="mt-3 text-base text-[var(--pd-color-text-secondary)]">
                {server.summary}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <StatusBadge server={server} />
                {server.statusDetail && (
                  <span className="text-sm text-[var(--pd-color-text-tertiary)]">
                    {server.statusDetail}
                  </span>
                )}
              </div>
            </div>
            {server.canReconnect && (
              <PdButton
                variant="secondary"
                onClick={() => handleReconnect(server)}
                loading={busyServerName === server.name}
              >
                <span aria-hidden="true" className="material-symbols-outlined text-[16px]">sync</span>
                {t('settings.mcp.form.reconnect')}
              </PdButton>
            )}
          </div>

          <section className="rounded-[var(--pd-radius-xl)] border border-[var(--pd-color-border)] bg-[var(--pd-color-surface)] p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <InfoPair
                label={t('settings.mcp.form.transport')}
                value={transportLabel(server.transport)}
              />
              <InfoPair label={t('settings.mcp.form.scope')} value={scopeLabel(server)} />
              <InfoPair label={t('settings.mcp.form.status')} value={server.statusLabel} />
              <InfoPair
                label={t('settings.mcp.form.location')}
                value={server.configLocation}
              />
            </div>
            <div className="mt-5">
              <div className="text-sm font-semibold text-[var(--pd-color-text-primary)] mb-2">
                {t('settings.mcp.form.rawConfig')}
              </div>
              <pre className="overflow-x-auto rounded-[var(--pd-radius-lg)] bg-[var(--pd-color-surface-hover)] p-4 text-xs text-[var(--pd-color-text-secondary)]">
                {JSON.stringify(server.config, null, 2)}
              </pre>
            </div>
          </section>
        </div>
        {deleteModal}
      </>
    );
  }

  if (view.type === 'create' || view.type === 'edit') {
    const editing = view.type === 'edit';
    const targetServer = editing ? (view as { server: McpServerRecord }).server : null;
    const transportLocked = editing;
    const isBusy = isSaving || isDeleting;

    return (
      <>
        <div className="max-w-5xl min-w-0">
          <button
            type="button"
            onClick={() => setView({ type: 'list' })}
            className="mb-5 inline-flex items-center gap-2 text-sm text-[var(--pd-color-text-secondary)] transition-colors hover:text-[var(--pd-color-text-primary)]"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[18px]">arrow_back</span>
            {t('settings.mcp.form.back')}
          </button>

          <div className="flex items-start justify-between gap-4 mb-8">
            <div>
              <h2 className="text-[2.2rem] font-semibold tracking-[-0.03em] text-[var(--pd-color-text-primary)]">
                {editing
                  ? t('settings.mcp.form.editTitle', { name: targetServer!.name })
                  : t('settings.mcp.form.createTitle')}
              </h2>
              <p className="mt-3 text-base text-[var(--pd-color-text-secondary)]">
                {editing
                  ? t('settings.mcp.form.editHint')
                  : t('settings.mcp.form.createHint')}
              </p>
              {editing && targetServer && (
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <StatusBadge server={targetServer} />
                  {targetServer.statusDetail && (
                    <span className="text-sm text-[var(--pd-color-text-tertiary)]">
                      {targetServer.statusDetail}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              {editing && targetServer?.canReconnect && (
                <PdButton
                  variant="secondary"
                  onClick={() => handleReconnect(targetServer)}
                  loading={busyServerName === targetServer.name}
                >
                  <span aria-hidden="true" className="material-symbols-outlined text-[16px]">sync</span>
                  {t('settings.mcp.form.reconnect')}
                </PdButton>
              )}
              {editing && targetServer?.canRemove && (
                <PdButton
                  variant="ghost"
                  className="text-[var(--pd-color-error)] hover:text-[var(--pd-color-error)] hover:bg-[var(--pd-color-error)]/8"
                  onClick={() => handleDelete(targetServer)}
                  loading={isDeleting}
                >
                  <span aria-hidden="true" className="material-symbols-outlined text-[16px]">delete</span>
                  {t('settings.mcp.form.uninstall')}
                </PdButton>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <section className="rounded-[var(--pd-radius-xl)] border border-[var(--pd-color-border)] bg-[var(--pd-color-surface)] p-5">
              <PdInput
                label={t('settings.mcp.form.name')}
                value={draft.name}
                onChange={(event) => setDraftField('name', event.target.value)}
                placeholder={t('settings.mcp.form.namePlaceholder')}
                disabled={editing}
                required
              />
            </section>

            <section className="rounded-[var(--pd-radius-xl)] border border-[var(--pd-color-border)] bg-[var(--pd-color-surface)] p-5">
              <div className="text-sm font-semibold text-[var(--pd-color-text-primary)] mb-2">
                {t('settings.mcp.form.scope')}
              </div>
              <p className="text-xs leading-5 text-[var(--pd-color-text-tertiary)]">
                {t('settings.mcp.globalOnlyHint')}
              </p>
            </section>

            <section className="rounded-[var(--pd-radius-xl)] border border-[var(--pd-color-border)] bg-[var(--pd-color-surface)] overflow-hidden">
              <div className="grid grid-cols-3">
                {(['stdio', 'http', 'sse'] as TransportKind[]).map((transport) => {
                  const active = draft.transport === transport;
                  return (
                    <button
                      key={transport}
                      type="button"
                      disabled={transportLocked}
                      onClick={() => setDraftField('transport', transport)}
                      className={`h-14 text-sm font-semibold transition-colors ${
                        active
                          ? 'bg-[var(--pd-color-surface-selected)] text-[var(--pd-color-text-primary)]'
                          : 'bg-[var(--pd-color-surface)] text-[var(--pd-color-text-secondary)] hover:bg-[var(--pd-color-surface-hover)]'
                      } ${transportLocked ? 'cursor-not-allowed opacity-70' : ''}`}
                    >
                      {transport === 'stdio' ? 'STDIO' : transportLabel(transport)}
                    </button>
                  );
                })}
              </div>
            </section>

            {editing && (
              <div className="text-sm text-[var(--pd-color-text-tertiary)]">
                {t('settings.mcp.form.transportLocked')}
              </div>
            )}

            {draft.transport === 'stdio' ? (
              <>
                <section className="rounded-[var(--pd-radius-xl)] border border-[var(--pd-color-border)] bg-[var(--pd-color-surface)] p-5">
                  <PdInput
                    label={t('settings.mcp.form.command')}
                    value={draft.command}
                    onChange={(event) => setDraftField('command', event.target.value)}
                    placeholder={t('settings.mcp.form.commandPlaceholder')}
                    required
                  />
                  <p className="mt-2 text-xs leading-5 text-[var(--pd-color-text-tertiary)]">
                    {t('settings.mcp.form.commandHostHint')}
                  </p>
                </section>

                <ArraySection
                  title={t('settings.mcp.form.arguments')}
                  rows={draft.args}
                  onChange={(id, _field, value) => updateStringRows('args', id, value)}
                  onAdd={() => addRow('args')}
                  onRemove={(id) => removeRow('args', id)}
                  singleValue
                  valuePlaceholder={t('settings.mcp.form.argumentPlaceholder')}
                  addLabel={t('settings.mcp.form.addArgument')}
                />

                <ArraySection
                  title={t('settings.mcp.form.environmentVariables')}
                  rows={draft.env}
                  onChange={(id, field, value) =>
                    updateKeyValueRows('env', id, field, value)
                  }
                  onAdd={() => addRow('env')}
                  onRemove={(id) => removeRow('env', id)}
                  keyPlaceholder={t('settings.mcp.form.keyPlaceholder')}
                  valuePlaceholder={t('settings.mcp.form.valuePlaceholder')}
                  addLabel={t('settings.mcp.form.addEnv')}
                />
              </>
            ) : (
              <>
                <section className="rounded-[var(--pd-radius-xl)] border border-[var(--pd-color-border)] bg-[var(--pd-color-surface)] p-5">
                  <PdInput
                    label={
                      draft.transport === 'http'
                        ? t('settings.mcp.form.url')
                        : t('settings.mcp.form.sseUrl')
                    }
                    value={draft.url}
                    onChange={(event) => setDraftField('url', event.target.value)}
                    placeholder={t('settings.mcp.form.urlPlaceholder')}
                    required
                  />
                </section>

                <ArraySection
                  title={t('settings.mcp.form.headers')}
                  rows={draft.headers}
                  onChange={(id, field, value) =>
                    updateKeyValueRows('headers', id, field, value)
                  }
                  onAdd={() => addRow('headers')}
                  onRemove={(id) => removeRow('headers', id)}
                  keyPlaceholder={t('settings.mcp.form.keyPlaceholder')}
                  valuePlaceholder={t('settings.mcp.form.valuePlaceholder')}
                  addLabel={t('settings.mcp.form.addHeader')}
                />

                <section className="rounded-[var(--pd-radius-xl)] border border-[var(--pd-color-border)] bg-[var(--pd-color-surface)] p-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <PdInput
                      label={t('settings.mcp.form.oauthClientId')}
                      value={draft.oauthClientId}
                      onChange={(event) =>
                        setDraftField('oauthClientId', event.target.value)
                      }
                      placeholder={t('settings.mcp.form.oauthClientIdPlaceholder')}
                    />
                    <PdInput
                      label={t('settings.mcp.form.oauthCallbackPort')}
                      value={draft.oauthCallbackPort}
                      onChange={(event) =>
                        setDraftField('oauthCallbackPort', event.target.value)
                      }
                      placeholder={t('settings.mcp.form.oauthCallbackPortPlaceholder')}
                    />
                  </div>
                  <div className="mt-4">
                    <PdInput
                      label={t('settings.mcp.form.headersHelper')}
                      value={draft.headersHelper}
                      onChange={(event) =>
                        setDraftField('headersHelper', event.target.value)
                      }
                      placeholder={t('settings.mcp.form.headersHelperPlaceholder')}
                    />
                  </div>
                </section>
              </>
            )}

            <div className="flex justify-end pt-2">
              <PdButton
                onClick={handleSave}
                disabled={!isDraftValid(draft) || isBusy}
                loading={isSaving}
              >
                {t('settings.mcp.form.save')}
              </PdButton>
            </div>
          </div>
        </div>
        {deleteModal}
      </>
    );
  }

  return (
    <div className="max-w-5xl min-w-0">
      <div className="flex items-start justify-between gap-6 mb-8">
        <div>
          <h2 className="text-[2.2rem] font-semibold tracking-[-0.03em] text-[var(--pd-color-text-primary)]">
            {t('settings.mcp.title')}
          </h2>
          <p className="mt-3 text-base text-[var(--pd-color-text-secondary)]">
            {t('settings.mcp.description')}
          </p>
        </div>
        <PdButton variant="secondary" size="lg" onClick={beginCreate}>
          <span aria-hidden="true" className="material-symbols-outlined text-[18px]">add</span>
          {t('settings.mcp.addServer')}
        </PdButton>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <StatCard label={t('settings.mcp.stats.total')} value={stats.total} icon="dns" />
        <StatCard
          label={t('settings.mcp.stats.connected')}
          value={stats.connected}
          icon="check_circle"
        />
        <StatCard
          label={t('settings.mcp.stats.attention')}
          value={stats.attention}
          icon="error"
        />
      </div>

      {isLoading && servers.length === 0 ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin h-6 w-6 rounded-full border-2 border-[var(--pd-color-brand)] border-t-transparent" />
        </div>
      ) : error ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-[var(--pd-color-border)] bg-[var(--pd-color-surface-container-low)]">
          <span aria-hidden="true" className="material-symbols-outlined text-[40px] text-[var(--pd-color-error)] mb-3 block">
            error
          </span>
          <p className="text-sm text-[var(--pd-color-error)] mb-3">{error}</p>
          <button
            type="button"
            onClick={() => void fetchServers(undefined, undefined)}
            className="text-sm text-[var(--pd-color-text-accent)] hover:underline"
          >
            {t('common.retry')}
          </button>
        </div>
      ) : servers.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-[var(--pd-color-border)] bg-[var(--pd-color-surface-container-low)]">
          <span aria-hidden="true" className="material-symbols-outlined text-[40px] text-[var(--pd-color-text-tertiary)] mb-3 block">
            dns
          </span>
          <p className="text-sm text-[var(--pd-color-text-secondary)] mb-1">
            {t('settings.mcp.empty')}
          </p>
          <p className="text-xs text-[var(--pd-color-text-tertiary)]">
            {t('settings.mcp.emptyHint')}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {MCP_GROUP_ORDER.map((group) => {
            const groupServers = groupedServers[group];
            if (!groupServers?.length) return null;

            return (
              <section key={group}>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-[1.35rem] font-semibold text-[var(--pd-color-text-primary)]">
                    {group === 'plugin'
                      ? t('settings.mcp.scope.plugin')
                      : t(`settings.mcp.scope.${group}`)}
                  </div>
                  <div className="text-sm text-[var(--pd-color-text-tertiary)]">
                    {groupServers.length}
                  </div>
                </div>
                <div className="rounded-[28px] border border-[var(--pd-color-border)] bg-[var(--pd-color-surface)] overflow-hidden">
                  {groupServers.map((server) => (
                    <ServerRow
                      key={`${server.scope}:${server.name}`}
                      server={server}
                      isBusy={busyServerName === server.name}
                      onOpen={() => beginEdit(server)}
                      onToggle={() => void handleToggle(server)}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
      {deleteModal}
    </div>
  );
}

function InfoPair({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--pd-radius-lg)] bg-[var(--pd-color-surface-hover)] px-4 py-3">
      <div className="text-xs uppercase tracking-[0.16em] font-semibold text-[var(--pd-color-text-tertiary)] mb-2">
        {label}
      </div>
      <div className="text-sm text-[var(--pd-color-text-primary)] break-all">{value}</div>
    </div>
  );
}
