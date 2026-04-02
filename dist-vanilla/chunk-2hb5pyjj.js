// @bun
import {
  init_useKeybinding,
  useKeybindings
} from "./chunk-gypetngm.js";
import {
  init_use_app,
  use_app_default
} from "./chunk-qjz5kp97.js";
import {
  require_react
} from "./chunk-g338npwr.js";
import {
  __esm,
  __toESM
} from "./chunk-qp2qdcda.js";

// src/hooks/useDoublePress.ts
function useDoublePress(setPending, onDoublePress, onFirstPress) {
  const lastPressRef = import_react.useRef(0);
  const timeoutRef = import_react.useRef(undefined);
  const clearTimeoutSafe = import_react.useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
  }, []);
  import_react.useEffect(() => {
    return () => {
      clearTimeoutSafe();
    };
  }, [clearTimeoutSafe]);
  return import_react.useCallback(() => {
    const now = Date.now();
    const timeSinceLastPress = now - lastPressRef.current;
    const isDoublePress = timeSinceLastPress <= DOUBLE_PRESS_TIMEOUT_MS && timeoutRef.current !== undefined;
    if (isDoublePress) {
      clearTimeoutSafe();
      setPending(false);
      onDoublePress();
    } else {
      onFirstPress?.();
      setPending(true);
      clearTimeoutSafe();
      timeoutRef.current = setTimeout((setPending2, timeoutRef2) => {
        setPending2(false);
        timeoutRef2.current = undefined;
      }, DOUBLE_PRESS_TIMEOUT_MS, setPending, timeoutRef);
    }
    lastPressRef.current = now;
  }, [setPending, onDoublePress, onFirstPress, clearTimeoutSafe]);
}
var import_react, DOUBLE_PRESS_TIMEOUT_MS = 800;
var init_useDoublePress = __esm(() => {
  import_react = __toESM(require_react(), 1);
});

// src/hooks/useExitOnCtrlCD.ts
function useExitOnCtrlCD(useKeybindingsHook, onInterrupt, onExit, isActive = true) {
  const { exit } = use_app_default();
  const [exitState, setExitState] = import_react2.useState({
    pending: false,
    keyName: null
  });
  const exitFn = import_react2.useMemo(() => onExit ?? exit, [onExit, exit]);
  const handleCtrlCDoublePress = useDoublePress((pending) => setExitState({ pending, keyName: "Ctrl-C" }), exitFn);
  const handleCtrlDDoublePress = useDoublePress((pending) => setExitState({ pending, keyName: "Ctrl-D" }), exitFn);
  const handleInterrupt = import_react2.useCallback(() => {
    if (onInterrupt?.())
      return;
    handleCtrlCDoublePress();
  }, [handleCtrlCDoublePress, onInterrupt]);
  const handleExit = import_react2.useCallback(() => {
    handleCtrlDDoublePress();
  }, [handleCtrlDDoublePress]);
  const handlers = import_react2.useMemo(() => ({
    "app:interrupt": handleInterrupt,
    "app:exit": handleExit
  }), [handleInterrupt, handleExit]);
  useKeybindingsHook(handlers, { context: "Global", isActive });
  return exitState;
}
var import_react2;
var init_useExitOnCtrlCD = __esm(() => {
  init_use_app();
  init_useDoublePress();
  import_react2 = __toESM(require_react(), 1);
});

// src/hooks/useExitOnCtrlCDWithKeybindings.ts
function useExitOnCtrlCDWithKeybindings(onExit, onInterrupt, isActive) {
  return useExitOnCtrlCD(useKeybindings, onInterrupt, onExit, isActive);
}
var init_useExitOnCtrlCDWithKeybindings = __esm(() => {
  init_useKeybinding();
  init_useExitOnCtrlCD();
});

export { useDoublePress, init_useDoublePress, useExitOnCtrlCDWithKeybindings, init_useExitOnCtrlCDWithKeybindings };
