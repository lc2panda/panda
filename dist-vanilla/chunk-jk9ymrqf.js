// @bun
import {
  getDirectoryCompletions,
  init_directoryCompletion
} from "./chunk-zh2r0f6g.js";
import {
  PromptInputFooterSuggestions,
  init_PromptInputFooterSuggestions
} from "./chunk-axsgc7h3.js";
import {
  Select,
  TextInput,
  addDirHelpMessage,
  init_TextInput,
  init_select,
  init_validation,
  validateDirectoryForWorkspace
} from "./chunk-ekfe4t3x.js";
import {
  Byline,
  ConfigurableShortcutHint,
  Dialog,
  KeyboardShortcutHint,
  init_Byline,
  init_ConfigurableShortcutHint,
  init_Dialog,
  init_KeyboardShortcutHint
} from "./chunk-p9ra2v2f.js";
import {
  init_useKeybinding,
  useKeybinding
} from "./chunk-gypetngm.js";
import {
  ThemedBox_default,
  ThemedText,
  init_dist,
  init_ink,
  require_compiler_runtime,
  useDebounceCallback
} from "./chunk-qjz5kp97.js";
import {
  require_jsx_dev_runtime,
  require_react
} from "./chunk-g338npwr.js";
import {
  figures_default,
  init_figures
} from "./chunk-ehab6nmr.js";
import {
  __esm,
  __toESM
} from "./chunk-qp2qdcda.js";

// src/components/permissions/rules/AddWorkspaceDirectory.tsx
function PermissionDescription() {
  const $ = import_compiler_runtime.c(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      dimColor: true,
      children: "Panda Code will be able to read files in this directory and make edits when auto-accept edits is on."
    }, undefined, false, undefined, this);
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  return t0;
}
function DirectoryDisplay(t0) {
  const $ = import_compiler_runtime.c(5);
  const {
    path
  } = t0;
  let t1;
  if ($[0] !== path) {
    t1 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      color: "permission",
      children: path
    }, undefined, false, undefined, this);
    $[0] = path;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  let t2;
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(PermissionDescription, {}, undefined, false, undefined, this);
    $[2] = t2;
  } else {
    t2 = $[2];
  }
  let t3;
  if ($[3] !== t1) {
    t3 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      paddingX: 2,
      gap: 1,
      children: [
        t1,
        t2
      ]
    }, undefined, true, undefined, this);
    $[3] = t1;
    $[4] = t3;
  } else {
    t3 = $[4];
  }
  return t3;
}
function DirectoryInput(t0) {
  const $ = import_compiler_runtime.c(14);
  const {
    value,
    onChange,
    onSubmit,
    error,
    suggestions,
    selectedSuggestion
  } = t0;
  let t1;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      children: "Enter the path to the directory:"
    }, undefined, false, undefined, this);
    $[0] = t1;
  } else {
    t1 = $[0];
  }
  let t2;
  if ($[1] !== onChange || $[2] !== onSubmit || $[3] !== value) {
    t2 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      borderDimColor: true,
      borderStyle: "round",
      marginY: 1,
      paddingLeft: 1,
      children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(TextInput, {
        showCursor: true,
        placeholder: `Directory path${figures_default.ellipsis}`,
        value,
        onChange,
        onSubmit,
        columns: 80,
        cursorOffset: value.length,
        onChangeCursorOffset: _temp
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this);
    $[1] = onChange;
    $[2] = onSubmit;
    $[3] = value;
    $[4] = t2;
  } else {
    t2 = $[4];
  }
  let t3;
  if ($[5] !== selectedSuggestion || $[6] !== suggestions) {
    t3 = suggestions.length > 0 && /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      marginBottom: 1,
      children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(PromptInputFooterSuggestions, {
        suggestions,
        selectedSuggestion
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this);
    $[5] = selectedSuggestion;
    $[6] = suggestions;
    $[7] = t3;
  } else {
    t3 = $[7];
  }
  let t4;
  if ($[8] !== error) {
    t4 = error && /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      color: "error",
      children: error
    }, undefined, false, undefined, this);
    $[8] = error;
    $[9] = t4;
  } else {
    t4 = $[9];
  }
  let t5;
  if ($[10] !== t2 || $[11] !== t3 || $[12] !== t4) {
    t5 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      children: [
        t1,
        t2,
        t3,
        t4
      ]
    }, undefined, true, undefined, this);
    $[10] = t2;
    $[11] = t3;
    $[12] = t4;
    $[13] = t5;
  } else {
    t5 = $[13];
  }
  return t5;
}
function _temp() {}
function AddWorkspaceDirectory(t0) {
  const $ = import_compiler_runtime.c(34);
  const {
    onAddDirectory,
    onCancel,
    permissionContext,
    directoryPath
  } = t0;
  const [directoryInput, setDirectoryInput] = import_react.useState("");
  const [error, setError] = import_react.useState(null);
  let t1;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = [];
    $[0] = t1;
  } else {
    t1 = $[0];
  }
  const [suggestions, setSuggestions] = import_react.useState(t1);
  const [selectedSuggestion, setSelectedSuggestion] = import_react.useState(0);
  let t2;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = async (path) => {
      if (!path) {
        setSuggestions([]);
        setSelectedSuggestion(0);
        return;
      }
      const completions = await getDirectoryCompletions(path);
      setSuggestions(completions);
      setSelectedSuggestion(0);
    };
    $[1] = t2;
  } else {
    t2 = $[1];
  }
  const fetchSuggestions = t2;
  const debouncedFetchSuggestions = useDebounceCallback(fetchSuggestions, 100);
  let t3;
  let t4;
  if ($[2] !== debouncedFetchSuggestions || $[3] !== directoryInput) {
    t3 = () => {
      debouncedFetchSuggestions(directoryInput);
    };
    t4 = [directoryInput, debouncedFetchSuggestions];
    $[2] = debouncedFetchSuggestions;
    $[3] = directoryInput;
    $[4] = t3;
    $[5] = t4;
  } else {
    t3 = $[4];
    t4 = $[5];
  }
  import_react.useEffect(t3, t4);
  let t5;
  if ($[6] === Symbol.for("react.memo_cache_sentinel")) {
    t5 = (suggestion) => {
      const newPath = suggestion.id + "/";
      setDirectoryInput(newPath);
      setError(null);
    };
    $[6] = t5;
  } else {
    t5 = $[6];
  }
  const applySuggestion = t5;
  let t6;
  if ($[7] !== onAddDirectory || $[8] !== permissionContext) {
    t6 = async (newPath_0) => {
      const result = await validateDirectoryForWorkspace(newPath_0, permissionContext);
      if (result.resultType === "success") {
        onAddDirectory(result.absolutePath, false);
      } else {
        setError(addDirHelpMessage(result));
      }
    };
    $[7] = onAddDirectory;
    $[8] = permissionContext;
    $[9] = t6;
  } else {
    t6 = $[9];
  }
  const handleSubmit = t6;
  let t7;
  if ($[10] === Symbol.for("react.memo_cache_sentinel")) {
    t7 = {
      context: "Settings"
    };
    $[10] = t7;
  } else {
    t7 = $[10];
  }
  useKeybinding("confirm:no", onCancel, t7);
  let t8;
  if ($[11] !== handleSubmit || $[12] !== selectedSuggestion || $[13] !== suggestions) {
    t8 = (e) => {
      if (suggestions.length > 0) {
        if (e.key === "tab") {
          e.preventDefault();
          const suggestion_0 = suggestions[selectedSuggestion];
          if (suggestion_0) {
            applySuggestion(suggestion_0);
          }
          return;
        }
        if (e.key === "return") {
          e.preventDefault();
          const suggestion_1 = suggestions[selectedSuggestion];
          if (suggestion_1) {
            handleSubmit(suggestion_1.id + "/");
          }
          return;
        }
        if (e.key === "up" || e.ctrl && e.key === "p") {
          e.preventDefault();
          setSelectedSuggestion((prev) => prev <= 0 ? suggestions.length - 1 : prev - 1);
          return;
        }
        if (e.key === "down" || e.ctrl && e.key === "n") {
          e.preventDefault();
          setSelectedSuggestion((prev_0) => prev_0 >= suggestions.length - 1 ? 0 : prev_0 + 1);
          return;
        }
      }
    };
    $[11] = handleSubmit;
    $[12] = selectedSuggestion;
    $[13] = suggestions;
    $[14] = t8;
  } else {
    t8 = $[14];
  }
  const handleKeyDown = t8;
  let t9;
  if ($[15] !== directoryPath || $[16] !== onAddDirectory || $[17] !== onCancel) {
    t9 = (value) => {
      if (!directoryPath) {
        return;
      }
      const selectionValue = value;
      bb64:
        switch (selectionValue) {
          case "yes-session": {
            onAddDirectory(directoryPath, false);
            break bb64;
          }
          case "yes-remember": {
            onAddDirectory(directoryPath, true);
            break bb64;
          }
          case "no": {
            onCancel();
          }
        }
    };
    $[15] = directoryPath;
    $[16] = onAddDirectory;
    $[17] = onCancel;
    $[18] = t9;
  } else {
    t9 = $[18];
  }
  const handleSelect = t9;
  const t10 = directoryPath ? undefined : _temp2;
  let t11;
  if ($[19] !== directoryInput || $[20] !== directoryPath || $[21] !== error || $[22] !== handleSelect || $[23] !== handleSubmit || $[24] !== selectedSuggestion || $[25] !== suggestions) {
    t11 = directoryPath ? /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      gap: 1,
      children: [
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(DirectoryDisplay, {
          path: directoryPath
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Select, {
          options: REMEMBER_DIRECTORY_OPTIONS,
          onChange: handleSelect,
          onCancel: () => handleSelect("no")
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this) : /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      gap: 1,
      marginX: 2,
      children: [
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(PermissionDescription, {}, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(DirectoryInput, {
          value: directoryInput,
          onChange: setDirectoryInput,
          onSubmit: handleSubmit,
          error,
          suggestions,
          selectedSuggestion
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
    $[19] = directoryInput;
    $[20] = directoryPath;
    $[21] = error;
    $[22] = handleSelect;
    $[23] = handleSubmit;
    $[24] = selectedSuggestion;
    $[25] = suggestions;
    $[26] = t11;
  } else {
    t11 = $[26];
  }
  let t12;
  if ($[27] !== onCancel || $[28] !== t10 || $[29] !== t11) {
    t12 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Dialog, {
      title: "Add directory to workspace",
      onCancel,
      color: "permission",
      isCancelActive: false,
      inputGuide: t10,
      children: t11
    }, undefined, false, undefined, this);
    $[27] = onCancel;
    $[28] = t10;
    $[29] = t11;
    $[30] = t12;
  } else {
    t12 = $[30];
  }
  let t13;
  if ($[31] !== handleKeyDown || $[32] !== t12) {
    t13 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      tabIndex: 0,
      autoFocus: true,
      onKeyDown: handleKeyDown,
      children: t12
    }, undefined, false, undefined, this);
    $[31] = handleKeyDown;
    $[32] = t12;
    $[33] = t13;
  } else {
    t13 = $[33];
  }
  return t13;
}
function _temp2(exitState) {
  return exitState.pending ? /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
    children: [
      "Press ",
      exitState.keyName,
      " again to exit"
    ]
  }, undefined, true, undefined, this) : /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Byline, {
    children: [
      /* @__PURE__ */ jsx_dev_runtime.jsxDEV(KeyboardShortcutHint, {
        shortcut: "Tab",
        action: "complete"
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsx_dev_runtime.jsxDEV(KeyboardShortcutHint, {
        shortcut: "Enter",
        action: "add"
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ConfigurableShortcutHint, {
        action: "confirm:no",
        context: "Settings",
        fallback: "Esc",
        description: "cancel"
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
var import_compiler_runtime, import_react, jsx_dev_runtime, REMEMBER_DIRECTORY_OPTIONS;
var init_AddWorkspaceDirectory = __esm(() => {
  init_figures();
  init_dist();
  init_validation();
  init_TextInput();
  init_ink();
  init_useKeybinding();
  init_directoryCompletion();
  init_ConfigurableShortcutHint();
  init_select();
  init_Byline();
  init_Dialog();
  init_KeyboardShortcutHint();
  init_PromptInputFooterSuggestions();
  import_compiler_runtime = __toESM(require_compiler_runtime(), 1);
  import_react = __toESM(require_react(), 1);
  jsx_dev_runtime = __toESM(require_jsx_dev_runtime(), 1);
  REMEMBER_DIRECTORY_OPTIONS = [{
    value: "yes-session",
    label: "Yes, for this session"
  }, {
    value: "yes-remember",
    label: "Yes, and remember this directory"
  }, {
    value: "no",
    label: "No"
  }];
});

export { AddWorkspaceDirectory, init_AddWorkspaceDirectory };
