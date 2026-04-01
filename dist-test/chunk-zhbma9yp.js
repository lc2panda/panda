// @bun
import {
  StatusIcon,
  init_StatusIcon
} from "./chunk-wzr3bqfc.js";
import {
  checkInstall,
  cleanupNpmInstallations,
  cleanupShellAliases,
  init_nativeInstaller,
  installLatest
} from "./chunk-wk0emb79.js";
import"./chunk-yey6xqfs.js";
import"./chunk-77jdgzkx.js";
import"./chunk-tdbeghs2.js";
import"./chunk-mxbr8dgb.js";
import"./chunk-2ytpvg8e.js";
import"./chunk-23zd2gfp.js";
import"./chunk-65xxc9v8.js";
import"./chunk-px2n7q1y.js";
import"./chunk-3be7ka25.js";
import"./chunk-ngnveex9.js";
import"./chunk-2gzv8nrw.js";
import"./chunk-2e5y8sgq.js";
import"./chunk-cgfdkzhb.js";
import"./chunk-zz424j25.js";
import"./chunk-gywzh15r.js";
import"./chunk-9gbamk79.js";
import"./chunk-vwm15r11.js";
import"./chunk-xk0pz9ah.js";
import"./chunk-x2y5syym.js";
import {
  ThemedBox_default,
  ThemedText,
  init_ink,
  render,
  require_compiler_runtime
} from "./chunk-r59g0618.js";
import"./chunk-7m2nd8da.js";
import"./chunk-ps49ymvj.js";
import {
  require_jsx_dev_runtime,
  require_react
} from "./chunk-g338npwr.js";
import"./chunk-s5axysty.js";
import"./chunk-zk2wsm7d.js";
import"./chunk-smpjkjmr.js";
import"./chunk-e046tp8q.js";
import"./chunk-g8nemwxs.js";
import {
  getInitialSettings,
  init_settings1 as init_settings,
  updateSettingsForSource
} from "./chunk-bt6e264h.js";
import"./chunk-y9h5c3hn.js";
import"./chunk-7rxmkr8t.js";
import"./chunk-vratq94g.js";
import"./chunk-7gjw150h.js";
import"./chunk-0e1xsncc.js";
import"./chunk-g0j0t6qk.js";
import"./chunk-3c25bcsw.js";
import"./chunk-m859hz3m.js";
import"./chunk-55wgxwa9.js";
import"./chunk-n9s3rq14.js";
import"./chunk-4jm600zv.js";
import {
  env,
  init_env
} from "./chunk-zfp09a4r.js";
import"./chunk-7ymfj7m3.js";
import"./chunk-f5ma3nh5.js";
import"./chunk-qz2x630m.js";
import"./chunk-e5n0k9bd.js";
import"./chunk-p2816w9z.js";
import"./chunk-v9smspw2.js";
import"./chunk-v1kzp02e.js";
import"./chunk-0vkfrmqm.js";
import"./chunk-0xjaqda8.js";
import"./chunk-hsd2zcr5.js";
import"./chunk-cdz5yb0r.js";
import {
  init_analytics,
  logEvent
} from "./chunk-h0rbjg6x.js";
import"./chunk-s85yj5xm.js";
import"./chunk-73q6p10n.js";
import"./chunk-8qg6qavk.js";
import"./chunk-qnfx3qtx.js";
import"./chunk-14j8jv5j.js";
import"./chunk-0xqnccz6.js";
import"./chunk-nahdbxge.js";
import"./chunk-43vdtd69.js";
import"./chunk-8tnsngw2.js";
import"./chunk-wgf77cc9.js";
import"./chunk-7wm5s02e.js";
import {
  errorMessage,
  init_debug,
  init_errors,
  logForDebugging
} from "./chunk-71hncdva.js";
import"./chunk-fbv4apne.js";
import"./chunk-3r24h7t6.js";
import"./chunk-24stks7b.js";
import"./chunk-hqmz36b3.js";
import"./chunk-4g3v8y12.js";
import"./chunk-7739pg2c.js";
import"./chunk-xszk7n10.js";
import"./chunk-sdj9b9wh.js";
import {
  __toESM
} from "./chunk-qp2qdcda.js";

// src/commands/install.tsx
init_analytics();
init_StatusIcon();
init_ink();
init_debug();
init_env();
init_errors();
init_nativeInstaller();
init_settings();
var import_compiler_runtime = __toESM(require_compiler_runtime(), 1);
var import_react = __toESM(require_react(), 1);
var jsx_dev_runtime = __toESM(require_jsx_dev_runtime(), 1);
import { homedir } from "os";
import { join } from "path";
function getInstallationPath() {
  const isWindows = env.platform === "win32";
  const homeDir = homedir();
  if (isWindows) {
    const windowsPath = join(homeDir, ".local", "bin", "claude.exe");
    return windowsPath.replace(/\//g, "\\");
  }
  return "~/.local/bin/claude";
}
function SetupNotes(t0) {
  const $ = import_compiler_runtime.c(5);
  const {
    messages
  } = t0;
  if (messages.length === 0) {
    return null;
  }
  let t1;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        color: "warning",
        children: [
          /* @__PURE__ */ jsx_dev_runtime.jsxDEV(StatusIcon, {
            status: "warning",
            withSpace: true
          }, undefined, false, undefined, this),
          "Setup notes:"
        ]
      }, undefined, true, undefined, this)
    }, undefined, false, undefined, this);
    $[0] = t1;
  } else {
    t1 = $[0];
  }
  let t2;
  if ($[1] !== messages) {
    t2 = messages.map(_temp);
    $[1] = messages;
    $[2] = t2;
  } else {
    t2 = $[2];
  }
  let t3;
  if ($[3] !== t2) {
    t3 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      gap: 0,
      marginBottom: 1,
      children: [
        t1,
        t2
      ]
    }, undefined, true, undefined, this);
    $[3] = t2;
    $[4] = t3;
  } else {
    t3 = $[4];
  }
  return t3;
}
function _temp(message, index) {
  return /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
    marginLeft: 2,
    children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      dimColor: true,
      children: [
        "\u2022 ",
        message
      ]
    }, undefined, true, undefined, this)
  }, index, false, undefined, this);
}
function Install({
  onDone,
  force,
  target
}) {
  const [state, setState] = import_react.useState({
    type: "checking"
  });
  import_react.useEffect(() => {
    async function run() {
      try {
        logForDebugging(`Install: Starting installation process (force=${force}, target=${target})`);
        const channelOrVersion = target || getInitialSettings()?.autoUpdatesChannel || "latest";
        setState({
          type: "installing",
          version: channelOrVersion
        });
        logForDebugging(`Install: Calling installLatest(channelOrVersion=${channelOrVersion}, forceReinstall=${force})`);
        const result = await installLatest(channelOrVersion, force);
        logForDebugging(`Install: installLatest returned version=${result.latestVersion}, wasUpdated=${result.wasUpdated}, lockFailed=${result.lockFailed}`);
        if (result.lockFailed) {
          throw new Error("Could not install - another process is currently installing Claude. Please try again in a moment.");
        }
        if (!result.latestVersion) {
          logForDebugging("Install: Failed to retrieve version information during install", {
            level: "error"
          });
        }
        if (!result.wasUpdated) {
          logForDebugging("Install: Already up to date");
        }
        setState({
          type: "setting-up"
        });
        const setupMessages = await checkInstall(true);
        logForDebugging(`Install: Setup launcher completed with ${setupMessages.length} messages`);
        if (setupMessages.length > 0) {
          setupMessages.forEach((msg) => logForDebugging(`Install: Setup message: ${msg.message}`));
        }
        logForDebugging("Install: Cleaning up npm installations after successful install");
        const {
          removed,
          errors,
          warnings
        } = await cleanupNpmInstallations();
        if (removed > 0) {
          logForDebugging(`Cleaned up ${removed} npm installation(s)`);
        }
        if (errors.length > 0) {
          logForDebugging(`Cleanup errors: ${errors.join(", ")}`);
        }
        const aliasMessages = await cleanupShellAliases();
        if (aliasMessages.length > 0) {
          logForDebugging(`Shell alias cleanup: ${aliasMessages.map((m) => m.message).join("; ")}`);
        }
        logEvent("tengu_claude_install_command", {
          has_version: result.latestVersion ? 1 : 0,
          forced: force ? 1 : 0
        });
        if (target === "latest" || target === "stable") {
          updateSettingsForSource("userSettings", {
            autoUpdatesChannel: target
          });
          logForDebugging(`Install: Saved autoUpdatesChannel=${target} to user settings`);
        }
        const allWarnings = [...warnings, ...aliasMessages.map((m_0) => m_0.message)];
        if (setupMessages.length > 0) {
          setState({
            type: "set-up",
            messages: setupMessages.map((m_1) => m_1.message)
          });
          setTimeout(setState, 2000, {
            type: "success",
            version: result.latestVersion || "current",
            setupMessages: [...setupMessages.map((m_2) => m_2.message), ...allWarnings]
          });
        } else {
          logForDebugging("Install: Shell PATH already configured");
          setState({
            type: "success",
            version: result.latestVersion || "current",
            setupMessages: allWarnings.length > 0 ? allWarnings : undefined
          });
        }
      } catch (error) {
        logForDebugging(`Install command failed: ${error}`, {
          level: "error"
        });
        setState({
          type: "error",
          message: errorMessage(error)
        });
      }
    }
    run();
  }, [force, target]);
  import_react.useEffect(() => {
    if (state.type === "success") {
      setTimeout(onDone, 2000, "Panda Code installation completed successfully", {
        display: "system"
      });
    } else if (state.type === "error") {
      setTimeout(onDone, 3000, "Panda Code installation failed", {
        display: "system"
      });
    }
  }, [state, onDone]);
  return /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
    flexDirection: "column",
    marginTop: 1,
    children: [
      state.type === "checking" && /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        color: "claude",
        children: "Checking installation status..."
      }, undefined, false, undefined, this),
      state.type === "cleaning-npm" && /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        color: "warning",
        children: "Cleaning up old npm installations..."
      }, undefined, false, undefined, this),
      state.type === "installing" && /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        color: "claude",
        children: [
          "Installing Panda Code native build ",
          state.version,
          "..."
        ]
      }, undefined, true, undefined, this),
      state.type === "setting-up" && /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        color: "claude",
        children: "Setting up launcher and shell integration..."
      }, undefined, false, undefined, this),
      state.type === "set-up" && /* @__PURE__ */ jsx_dev_runtime.jsxDEV(SetupNotes, {
        messages: state.messages
      }, undefined, false, undefined, this),
      state.type === "success" && /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
        flexDirection: "column",
        gap: 1,
        children: [
          /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
            children: [
              /* @__PURE__ */ jsx_dev_runtime.jsxDEV(StatusIcon, {
                status: "success",
                withSpace: true
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
                color: "success",
                bold: true,
                children: "Panda Code successfully installed!"
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
            marginLeft: 2,
            flexDirection: "column",
            gap: 1,
            children: [
              state.version !== "current" && /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
                children: [
                  /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
                    dimColor: true,
                    children: "Version: "
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
                    color: "claude",
                    children: state.version
                  }, undefined, false, undefined, this)
                ]
              }, undefined, true, undefined, this),
              /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
                children: [
                  /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
                    dimColor: true,
                    children: "Location: "
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
                    color: "text",
                    children: getInstallationPath()
                  }, undefined, false, undefined, this)
                ]
              }, undefined, true, undefined, this)
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
            marginLeft: 2,
            flexDirection: "column",
            gap: 1,
            children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
              marginTop: 1,
              children: [
                /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
                  dimColor: true,
                  children: "Next: Run "
                }, undefined, false, undefined, this),
                /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
                  color: "claude",
                  bold: true,
                  children: "claude --help"
                }, undefined, false, undefined, this),
                /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
                  dimColor: true,
                  children: " to get started"
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this)
          }, undefined, false, undefined, this),
          state.setupMessages && /* @__PURE__ */ jsx_dev_runtime.jsxDEV(SetupNotes, {
            messages: state.setupMessages
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this),
      state.type === "error" && /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
        flexDirection: "column",
        gap: 1,
        children: [
          /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
            children: [
              /* @__PURE__ */ jsx_dev_runtime.jsxDEV(StatusIcon, {
                status: "error",
                withSpace: true
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
                color: "error",
                children: "Installation failed"
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
            color: "error",
            children: state.message
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
            marginTop: 1,
            children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
              dimColor: true,
              children: "Try running with --force to override checks"
            }, undefined, false, undefined, this)
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
var install = {
  type: "local-jsx",
  name: "install",
  description: "Install Panda Code native build",
  argumentHint: "[options]",
  async call(onDone, _context, args) {
    const force = args.includes("--force");
    const nonFlagArgs = args.filter((arg) => !arg.startsWith("--"));
    const target = nonFlagArgs[0];
    const {
      unmount
    } = await render(/* @__PURE__ */ jsx_dev_runtime.jsxDEV(Install, {
      onDone: (result, options) => {
        unmount();
        onDone(result, options);
      },
      force,
      target
    }, undefined, false, undefined, this));
  }
};
export {
  install
};
