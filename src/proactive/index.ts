// Input: Called by REPL.tsx and main.tsx when PROACTIVE or KAIROS feature flags are enabled.
// Output: Stub no-op implementations — proactive mode stays inactive, all calls are safe no-ops.
// Pos: Gate module for proactive/loop-mode tick system; consumed by screens/REPL.tsx and main.tsx.
// "一旦我被修改，请更新我的头部注释，以及所属文件夹的md。"

// Auto-generated stub — replace with real implementation
export {};
export const isProactiveActive: () => boolean = () => false;
export const activateProactive: (source?: string) => void = () => {};
export const isProactivePaused: () => boolean = () => false;
export const deactivateProactive: () => void = () => {};
// The following exports are required by REPL.tsx when KAIROS or PROACTIVE
// feature flags are enabled — the module is loaded as a real object (not null),
// so optional-chaining on the module only guards against the module being null,
// NOT against individual properties being undefined. Missing exports cause
// "undefined is not a function" TypeError, which silently breaks onSubmit/
// onCancel/handleMessageFromStream callbacks and freezes the interactive REPL.
export const pauseProactive: () => void = () => {};
export const resumeProactive: () => void = () => {};
export const setContextBlocked: (blocked: boolean) => void = () => {};
export const subscribeToProactiveChanges: (cb: () => void) => (() => void) = (_cb) => () => {};
export const getNextTickAt: () => number | null = () => null;
