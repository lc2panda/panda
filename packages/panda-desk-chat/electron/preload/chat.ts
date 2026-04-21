// Input: Electron contextBridge + ipcRenderer APIs
// Output: window.pandaAPI — type-safe IPC client matching PandaChatAPI interface
// Pos: Electron preload script — sole bridge between renderer and main process
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import { contextBridge, ipcRenderer } from 'electron';

// ---------------------------------------------------------------------------
// IPC channel constants (must match schemas.ts IPC_CHANNELS)
// ---------------------------------------------------------------------------

const CH = {
  // Chat messaging
  CHAT_SEND:           'panda:chat:send',
  CHAT_STREAM_START:   'panda:chat:stream:start',
  CHAT_STREAM_DELTA:   'panda:chat:stream:delta',
  CHAT_STREAM_END:     'panda:chat:stream:end',
  CHAT_STOP:           'panda:chat:stop',
  CHAT_WINDOW_TOGGLE:  'panda:chat:window:toggle',
  // Session management
  SESSION_LIST:        'panda:session:list',
  SESSION_CREATE:      'panda:session:create',
  SESSION_RENAME:      'panda:session:rename',
  SESSION_DELETE:      'panda:session:delete',
  SESSION_FOCUS:       'panda:session:focus',
  SESSION_UPDATED:     'panda:session:updated',
  // Tool permissions
  TOOL_USE_START:      'panda:tool:use:start',
  TOOL_USE_END:        'panda:tool:use:end',
  TOOL_PERM_REQUEST:   'panda:tool:permission:request',
  TOOL_PERM_RESPONSE:  'panda:tool:permission:response',
  // File system
  FS_SEARCH:           'panda:chat:fs:search',
  FS_LIST:             'panda:chat:fs:list',
  // Config & misc
  WINDOW_POSITION:     'panda:chat:window:position',
  SLASH_COMMANDS:      'panda:chat:slash-commands',
  MODEL_LIST:          'panda:chat:model:list',
  MODEL_SET:           'panda:chat:model:set',
  PERMISSION_MODE_SET: 'panda:chat:permission-mode:set',
  CLIPBOARD_PASTE_IMG: 'panda:chat:clipboard:paste-image',
} as const;

// ---------------------------------------------------------------------------
// Helper: create a type-safe event subscription
// ---------------------------------------------------------------------------

type Callback = (...args: unknown[]) => void;

function createSubscription(channel: string) {
  return (callback: Callback) => {
    const handler = (_event: Electron.IpcRendererEvent, ...args: unknown[]) => {
      callback(...args);
    };
    ipcRenderer.on(channel, handler);
    // Return unsubscribe function
    return () => {
      ipcRenderer.removeListener(channel, handler);
    };
  };
}

// ---------------------------------------------------------------------------
// Expose pandaAPI to renderer via contextBridge
// ---------------------------------------------------------------------------

contextBridge.exposeInMainWorld('pandaAPI', {
  chat: {
    send: (payload: unknown) => ipcRenderer.invoke(CH.CHAT_SEND, payload),
    stop: (payload: unknown) => ipcRenderer.invoke(CH.CHAT_STOP, payload),
    pasteImage: (payload: unknown) => ipcRenderer.invoke(CH.CLIPBOARD_PASTE_IMG, payload),
    onStreamStart: createSubscription(CH.CHAT_STREAM_START),
    onStreamDelta: createSubscription(CH.CHAT_STREAM_DELTA),
    onStreamEnd: createSubscription(CH.CHAT_STREAM_END),
    onWindowToggle: createSubscription(CH.CHAT_WINDOW_TOGGLE),
  },
  session: {
    list: (payload: unknown) => ipcRenderer.invoke(CH.SESSION_LIST, payload),
    create: (payload: unknown) => ipcRenderer.invoke(CH.SESSION_CREATE, payload),
    rename: (payload: unknown) => ipcRenderer.invoke(CH.SESSION_RENAME, payload),
    delete: (payload: unknown) => ipcRenderer.invoke(CH.SESSION_DELETE, payload),
    focus: (payload: unknown) => ipcRenderer.invoke(CH.SESSION_FOCUS, payload),
    onUpdated: createSubscription(CH.SESSION_UPDATED),
  },
  tool: {
    respondPermission: (payload: unknown) => ipcRenderer.invoke(CH.TOOL_PERM_RESPONSE, payload),
    onUseStart: createSubscription(CH.TOOL_USE_START),
    onUseEnd: createSubscription(CH.TOOL_USE_END),
    onPermissionRequest: createSubscription(CH.TOOL_PERM_REQUEST),
  },
  fs: {
    search: (payload: unknown) => ipcRenderer.invoke(CH.FS_SEARCH, payload),
    list: (payload: unknown) => ipcRenderer.invoke(CH.FS_LIST, payload),
  },
  config: {
    setWindowPosition: (payload: unknown) => ipcRenderer.invoke(CH.WINDOW_POSITION, payload),
    getSlashCommands: (payload: unknown) => ipcRenderer.invoke(CH.SLASH_COMMANDS, payload),
    getModels: (payload: unknown) => ipcRenderer.invoke(CH.MODEL_LIST, payload),
    setModel: (payload: unknown) => ipcRenderer.invoke(CH.MODEL_SET, payload),
    setPermissionMode: (payload: unknown) => ipcRenderer.invoke(CH.PERMISSION_MODE_SET, payload),
  },
});
