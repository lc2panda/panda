// @bun
import {
  enablePluginOp,
  init_pluginOperations
} from "./chunk-y585t2zm.js";
import {
  init_pluginStartupCheck,
  installSelectedPlugins
} from "./chunk-jnyvtta3.js";
import {
  OFFICIAL_MARKETPLACE_NAME,
  Select,
  Spinner,
  addMarketplaceSource,
  clearAllCaches,
  clearMarketplacesCache,
  init_Spinner,
  init_cacheUtils,
  init_installedPluginsManager,
  init_marketplaceManager,
  init_officialMarketplace,
  init_pluginLoader,
  init_select,
  isPluginInstalled,
  loadAllPlugins,
  loadKnownMarketplacesConfig,
  refreshMarketplace
} from "./chunk-ekfe4t3x.js";
import {
  Dialog,
  init_Dialog
} from "./chunk-p9ra2v2f.js";
import {
  ThemedBox_default,
  ThemedText,
  init_ink,
  init_instances,
  instances_default,
  require_compiler_runtime
} from "./chunk-qjz5kp97.js";
import {
  require_jsx_dev_runtime,
  require_react
} from "./chunk-g338npwr.js";
import {
  init_file,
  pathExists
} from "./chunk-w5d5b7r0.js";
import {
  getPlatform,
  init_platform
} from "./chunk-2g1tm0n3.js";
import {
  execFileNoThrow,
  execa,
  init_execFileNoThrow,
  init_execa
} from "./chunk-ehab6nmr.js";
import {
  init_log,
  logError
} from "./chunk-myphr2va.js";
import {
  init_debug,
  init_errors,
  isENOENT,
  logForDebugging,
  toError
} from "./chunk-cv4r43rj.js";
import {
  __esm,
  __toESM
} from "./chunk-qp2qdcda.js";

// src/commands/thinkback/thinkback.tsx
import { readFile } from "fs/promises";
import { join } from "path";
function getMarketplaceName() {
  return OFFICIAL_MARKETPLACE_NAME;
}
function getMarketplaceRepo() {
  return OFFICIAL_MARKETPLACE_REPO;
}
function getPluginId() {
  return `thinkback@${getMarketplaceName()}`;
}
async function getThinkbackSkillDir() {
  const {
    enabled
  } = await loadAllPlugins();
  const thinkbackPlugin = enabled.find((p) => p.name === "thinkback" || p.source && p.source.includes(getPluginId()));
  if (!thinkbackPlugin) {
    return null;
  }
  const skillDir = join(thinkbackPlugin.path, "skills", SKILL_NAME);
  if (await pathExists(skillDir)) {
    return skillDir;
  }
  return null;
}
async function playAnimation(skillDir) {
  const dataPath = join(skillDir, "year_in_review.js");
  const playerPath = join(skillDir, "player.js");
  try {
    await readFile(dataPath);
  } catch (e) {
    if (isENOENT(e)) {
      return {
        success: false,
        message: "No animation found. Run /think-back first to generate one."
      };
    }
    logError(e);
    return {
      success: false,
      message: `Could not access animation data: ${toError(e).message}`
    };
  }
  try {
    await readFile(playerPath);
  } catch (e) {
    if (isENOENT(e)) {
      return {
        success: false,
        message: "Player script not found. The player.js file is missing from the thinkback skill."
      };
    }
    logError(e);
    return {
      success: false,
      message: `Could not access player script: ${toError(e).message}`
    };
  }
  const inkInstance = instances_default.get(process.stdout);
  if (!inkInstance) {
    return {
      success: false,
      message: "Failed to access terminal instance"
    };
  }
  inkInstance.enterAlternateScreen();
  try {
    await execa("node", [playerPath], {
      stdio: "inherit",
      cwd: skillDir,
      reject: false
    });
  } catch {} finally {
    inkInstance.exitAlternateScreen();
  }
  const htmlPath = join(skillDir, "year_in_review.html");
  if (await pathExists(htmlPath)) {
    const platform = getPlatform();
    const openCmd = platform === "macos" ? "open" : platform === "windows" ? "start" : "xdg-open";
    execFileNoThrow(openCmd, [htmlPath]);
  }
  return {
    success: true,
    message: "Year in review animation complete!"
  };
}
function ThinkbackInstaller({
  onReady,
  onError
}) {
  const [state, setState] = import_react.useState({
    phase: "checking"
  });
  const [progressMessage, setProgressMessage] = import_react.useState("");
  import_react.useEffect(() => {
    async function checkAndInstall() {
      try {
        const knownMarketplaces = await loadKnownMarketplacesConfig();
        const marketplaceName = getMarketplaceName();
        const marketplaceRepo = getMarketplaceRepo();
        const pluginId = getPluginId();
        const marketplaceInstalled = marketplaceName in knownMarketplaces;
        const pluginAlreadyInstalled = isPluginInstalled(pluginId);
        if (!marketplaceInstalled) {
          setState({
            phase: "installing-marketplace"
          });
          logForDebugging(`Installing marketplace ${marketplaceRepo}`);
          await addMarketplaceSource({
            source: "github",
            repo: marketplaceRepo
          }, (message) => {
            setProgressMessage(message);
          });
          clearAllCaches();
          logForDebugging(`Marketplace ${marketplaceName} installed`);
        } else if (!pluginAlreadyInstalled) {
          setState({
            phase: "installing-marketplace"
          });
          setProgressMessage("Updating marketplace\u2026");
          logForDebugging(`Refreshing marketplace ${marketplaceName}`);
          await refreshMarketplace(marketplaceName, (message_0) => {
            setProgressMessage(message_0);
          });
          clearMarketplacesCache();
          clearAllCaches();
          logForDebugging(`Marketplace ${marketplaceName} refreshed`);
        }
        if (!pluginAlreadyInstalled) {
          setState({
            phase: "installing-plugin"
          });
          logForDebugging(`Installing plugin ${pluginId}`);
          const result = await installSelectedPlugins([pluginId]);
          if (result.failed.length > 0) {
            const errorMsg = result.failed.map((f) => `${f.name}: ${f.error}`).join(", ");
            throw new Error(`Failed to install plugin: ${errorMsg}`);
          }
          clearAllCaches();
          logForDebugging(`Plugin ${pluginId} installed`);
        } else {
          const {
            disabled
          } = await loadAllPlugins();
          const isDisabled = disabled.some((p) => p.name === "thinkback" || p.source?.includes(pluginId));
          if (isDisabled) {
            setState({
              phase: "enabling-plugin"
            });
            logForDebugging(`Enabling plugin ${pluginId}`);
            const enableResult = await enablePluginOp(pluginId);
            if (!enableResult.success) {
              throw new Error(`Failed to enable plugin: ${enableResult.message}`);
            }
            clearAllCaches();
            logForDebugging(`Plugin ${pluginId} enabled`);
          }
        }
        setState({
          phase: "ready"
        });
        onReady();
      } catch (error) {
        const err = toError(error);
        logError(err);
        setState({
          phase: "error",
          message: err.message
        });
        onError(err.message);
      }
    }
    checkAndInstall();
  }, [onReady, onError]);
  if (state.phase === "error") {
    return /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        color: "error",
        children: [
          "Error: ",
          state.message
        ]
      }, undefined, true, undefined, this)
    }, undefined, false, undefined, this);
  }
  if (state.phase === "ready") {
    return null;
  }
  const statusMessage = state.phase === "checking" ? "Checking thinkback installation\u2026" : state.phase === "installing-marketplace" ? "Installing marketplace\u2026" : state.phase === "enabling-plugin" ? "Enabling thinkback plugin\u2026" : "Installing thinkback plugin\u2026";
  return /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
    flexDirection: "column",
    children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      children: [
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Spinner, {}, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          children: progressMessage || statusMessage
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this)
  }, undefined, false, undefined, this);
}
function ThinkbackMenu(t0) {
  const $ = import_compiler_runtime.c(19);
  const {
    onDone,
    onAction,
    skillDir,
    hasGenerated
  } = t0;
  const [hasSelected, setHasSelected] = import_react.useState(false);
  let t1;
  if ($[0] !== hasGenerated) {
    t1 = hasGenerated ? [{
      label: "Play animation",
      value: "play",
      description: "Watch your year in review"
    }, {
      label: "Edit content",
      value: "edit",
      description: "Modify the animation"
    }, {
      label: "Fix errors",
      value: "fix",
      description: "Fix validation or rendering issues"
    }, {
      label: "Regenerate",
      value: "regenerate",
      description: "Create a new animation from scratch"
    }] : [{
      label: "Let's go!",
      value: "regenerate",
      description: "Generate your personalized animation"
    }];
    $[0] = hasGenerated;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const options = t1;
  let t2;
  if ($[2] !== onAction || $[3] !== onDone || $[4] !== skillDir) {
    t2 = function handleSelect2(value) {
      setHasSelected(true);
      if (value === "play") {
        playAnimation(skillDir).then(() => {
          onDone(undefined, {
            display: "skip"
          });
        });
      } else {
        onAction(value);
      }
    };
    $[2] = onAction;
    $[3] = onDone;
    $[4] = skillDir;
    $[5] = t2;
  } else {
    t2 = $[5];
  }
  const handleSelect = t2;
  let t3;
  if ($[6] !== onDone) {
    t3 = function handleCancel2() {
      onDone(undefined, {
        display: "skip"
      });
    };
    $[6] = onDone;
    $[7] = t3;
  } else {
    t3 = $[7];
  }
  const handleCancel = t3;
  if (hasSelected) {
    return null;
  }
  let t4;
  if ($[8] !== hasGenerated) {
    t4 = !hasGenerated && /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      children: [
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          children: "Relive your year of coding with Claude."
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
          dimColor: true,
          children: "We'll create a personalized ASCII animation celebrating your journey."
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
    $[8] = hasGenerated;
    $[9] = t4;
  } else {
    t4 = $[9];
  }
  let t5;
  if ($[10] !== handleSelect || $[11] !== options) {
    t5 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Select, {
      options,
      onChange: handleSelect,
      visibleOptionCount: 5
    }, undefined, false, undefined, this);
    $[10] = handleSelect;
    $[11] = options;
    $[12] = t5;
  } else {
    t5 = $[12];
  }
  let t6;
  if ($[13] !== t4 || $[14] !== t5) {
    t6 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      gap: 1,
      children: [
        t4,
        t5
      ]
    }, undefined, true, undefined, this);
    $[13] = t4;
    $[14] = t5;
    $[15] = t6;
  } else {
    t6 = $[15];
  }
  let t7;
  if ($[16] !== handleCancel || $[17] !== t6) {
    t7 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Dialog, {
      title: "Think Back on 2025 with Panda Code",
      subtitle: "Generate your 2025 Panda Code Think Back (takes a few minutes to run)",
      onCancel: handleCancel,
      color: "claude",
      children: t6
    }, undefined, false, undefined, this);
    $[16] = handleCancel;
    $[17] = t6;
    $[18] = t7;
  } else {
    t7 = $[18];
  }
  return t7;
}
function ThinkbackFlow(t0) {
  const $ = import_compiler_runtime.c(27);
  const {
    onDone
  } = t0;
  const [installComplete, setInstallComplete] = import_react.useState(false);
  const [installError, setInstallError] = import_react.useState(null);
  const [skillDir, setSkillDir] = import_react.useState(null);
  const [hasGenerated, setHasGenerated] = import_react.useState(null);
  let t1;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = function handleReady2() {
      setInstallComplete(true);
    };
    $[0] = t1;
  } else {
    t1 = $[0];
  }
  const handleReady = t1;
  let t2;
  if ($[1] !== onDone) {
    t2 = (message) => {
      setInstallError(message);
      onDone(`Error with thinkback: ${message}. Try running /plugin to manually install the think-back plugin.`, {
        display: "system"
      });
    };
    $[1] = onDone;
    $[2] = t2;
  } else {
    t2 = $[2];
  }
  const handleError = t2;
  let t3;
  let t4;
  if ($[3] !== handleError || $[4] !== installComplete || $[5] !== installError || $[6] !== skillDir) {
    t3 = () => {
      if (installComplete && !skillDir && !installError) {
        getThinkbackSkillDir().then((dir) => {
          if (dir) {
            logForDebugging(`Thinkback skill directory: ${dir}`);
            setSkillDir(dir);
          } else {
            handleError("Could not find thinkback skill directory");
          }
        });
      }
    };
    t4 = [installComplete, skillDir, installError, handleError];
    $[3] = handleError;
    $[4] = installComplete;
    $[5] = installError;
    $[6] = skillDir;
    $[7] = t3;
    $[8] = t4;
  } else {
    t3 = $[7];
    t4 = $[8];
  }
  import_react.useEffect(t3, t4);
  let t5;
  let t6;
  if ($[9] !== skillDir) {
    t5 = () => {
      if (!skillDir) {
        return;
      }
      const dataPath = join(skillDir, "year_in_review.js");
      pathExists(dataPath).then((exists) => {
        logForDebugging(`Checking for ${dataPath}: ${exists ? "found" : "not found"}`);
        setHasGenerated(exists);
      });
    };
    t6 = [skillDir];
    $[9] = skillDir;
    $[10] = t5;
    $[11] = t6;
  } else {
    t5 = $[10];
    t6 = $[11];
  }
  import_react.useEffect(t5, t6);
  let t7;
  if ($[12] !== onDone) {
    t7 = function handleAction2(action) {
      const prompts = {
        edit: EDIT_PROMPT,
        fix: FIX_PROMPT,
        regenerate: REGENERATE_PROMPT
      };
      onDone(prompts[action], {
        display: "user",
        shouldQuery: true
      });
    };
    $[12] = onDone;
    $[13] = t7;
  } else {
    t7 = $[13];
  }
  const handleAction = t7;
  if (installError) {
    let t82;
    if ($[14] !== installError) {
      t82 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        color: "error",
        children: [
          "Error: ",
          installError
        ]
      }, undefined, true, undefined, this);
      $[14] = installError;
      $[15] = t82;
    } else {
      t82 = $[15];
    }
    let t9;
    if ($[16] === Symbol.for("react.memo_cache_sentinel")) {
      t9 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        dimColor: true,
        children: "Try running /plugin to manually install the think-back plugin."
      }, undefined, false, undefined, this);
      $[16] = t9;
    } else {
      t9 = $[16];
    }
    let t10;
    if ($[17] !== t82) {
      t10 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
        flexDirection: "column",
        children: [
          t82,
          t9
        ]
      }, undefined, true, undefined, this);
      $[17] = t82;
      $[18] = t10;
    } else {
      t10 = $[18];
    }
    return t10;
  }
  if (!installComplete) {
    let t82;
    if ($[19] !== handleError) {
      t82 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThinkbackInstaller, {
        onReady: handleReady,
        onError: handleError
      }, undefined, false, undefined, this);
      $[19] = handleError;
      $[20] = t82;
    } else {
      t82 = $[20];
    }
    return t82;
  }
  if (!skillDir || hasGenerated === null) {
    let t82;
    if ($[21] === Symbol.for("react.memo_cache_sentinel")) {
      t82 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
        children: [
          /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Spinner, {}, undefined, false, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
            children: "Loading thinkback skill\u2026"
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this);
      $[21] = t82;
    } else {
      t82 = $[21];
    }
    return t82;
  }
  let t8;
  if ($[22] !== handleAction || $[23] !== hasGenerated || $[24] !== onDone || $[25] !== skillDir) {
    t8 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThinkbackMenu, {
      onDone,
      onAction: handleAction,
      skillDir,
      hasGenerated
    }, undefined, false, undefined, this);
    $[22] = handleAction;
    $[23] = hasGenerated;
    $[24] = onDone;
    $[25] = skillDir;
    $[26] = t8;
  } else {
    t8 = $[26];
  }
  return t8;
}
async function call(onDone) {
  return /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThinkbackFlow, {
    onDone
  }, undefined, false, undefined, this);
}
var import_compiler_runtime, import_react, jsx_dev_runtime, OFFICIAL_MARKETPLACE_REPO = "anthropics/claude-plugins-official", SKILL_NAME = "thinkback", EDIT_PROMPT = 'Use the Skill tool to invoke the "thinkback" skill with mode=edit to modify my existing Panda Code year in review animation. Ask me what I want to change. When the animation is ready, tell the user to run /think-back again to play it.', FIX_PROMPT = 'Use the Skill tool to invoke the "thinkback" skill with mode=fix to fix validation or rendering errors in my existing Panda Code year in review animation. Run the validator, identify errors, and fix them. When the animation is ready, tell the user to run /think-back again to play it.', REGENERATE_PROMPT = 'Use the Skill tool to invoke the "thinkback" skill with mode=regenerate to create a completely new Panda Code year in review animation from scratch. Delete the existing animation and start fresh. When the animation is ready, tell the user to run /think-back again to play it.';
var init_thinkback = __esm(() => {
  init_execa();
  init_select();
  init_Dialog();
  init_Spinner();
  init_instances();
  init_ink();
  init_pluginOperations();
  init_debug();
  init_errors();
  init_execFileNoThrow();
  init_file();
  init_log();
  init_platform();
  init_cacheUtils();
  init_installedPluginsManager();
  init_marketplaceManager();
  init_officialMarketplace();
  init_pluginLoader();
  init_pluginStartupCheck();
  import_compiler_runtime = __toESM(require_compiler_runtime(), 1);
  import_react = __toESM(require_react(), 1);
  jsx_dev_runtime = __toESM(require_jsx_dev_runtime(), 1);
});

export { playAnimation, call, init_thinkback };
