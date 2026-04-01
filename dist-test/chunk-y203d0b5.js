// @bun
import {
  getSettingsWithAllErrors,
  init_allErrors,
  init_notifications,
  init_useSettingsChange,
  useNotifications,
  useSettingsChange
} from "./chunk-jwtmq3ad.js";
import {
  require_compiler_runtime
} from "./chunk-r59g0618.js";
import {
  require_react
} from "./chunk-g338npwr.js";
import {
  getIsRemoteMode,
  init_state
} from "./chunk-24stks7b.js";
import {
  __esm,
  __toESM
} from "./chunk-qp2qdcda.js";

// src/hooks/notifs/useSettingsErrors.tsx
function useSettingsErrors() {
  const $ = import_compiler_runtime.c(6);
  const {
    addNotification,
    removeNotification
  } = useNotifications();
  const [errors_0, setErrors] = import_react.useState(_temp);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = () => {
      const {
        errors: errors_1
      } = getSettingsWithAllErrors();
      setErrors(errors_1);
    };
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const handleSettingsChange = t0;
  useSettingsChange(handleSettingsChange);
  let t1;
  let t2;
  if ($[1] !== addNotification || $[2] !== errors_0 || $[3] !== removeNotification) {
    t1 = () => {
      if (getIsRemoteMode()) {
        return;
      }
      if (errors_0.length > 0) {
        const message = `Found ${errors_0.length} settings ${errors_0.length === 1 ? "issue" : "issues"} \xB7 /doctor for details`;
        addNotification({
          key: SETTINGS_ERRORS_NOTIFICATION_KEY,
          text: message,
          color: "warning",
          priority: "high",
          timeoutMs: 60000
        });
      } else {
        removeNotification(SETTINGS_ERRORS_NOTIFICATION_KEY);
      }
    };
    t2 = [errors_0, addNotification, removeNotification];
    $[1] = addNotification;
    $[2] = errors_0;
    $[3] = removeNotification;
    $[4] = t1;
    $[5] = t2;
  } else {
    t1 = $[4];
    t2 = $[5];
  }
  import_react.useEffect(t1, t2);
  return errors_0;
}
function _temp() {
  const {
    errors
  } = getSettingsWithAllErrors();
  return errors;
}
var import_compiler_runtime, import_react, SETTINGS_ERRORS_NOTIFICATION_KEY = "settings-errors";
var init_useSettingsErrors = __esm(() => {
  init_notifications();
  init_state();
  init_allErrors();
  init_useSettingsChange();
  import_compiler_runtime = __toESM(require_compiler_runtime(), 1);
  import_react = __toESM(require_react(), 1);
});

export { useSettingsErrors, init_useSettingsErrors };
