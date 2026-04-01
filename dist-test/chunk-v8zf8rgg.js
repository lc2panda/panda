// @bun
import {
  getDoctorDiagnostic,
  getLatestVersion,
  getPackageManager,
  gracefulShutdown,
  init_autoUpdater,
  init_doctorDiagnostic,
  init_gracefulShutdown,
  init_localInstaller,
  init_nativeInstaller,
  init_packageManagers,
  installGlobalPackage,
  installLatest,
  installOrUpdateClaudePackage,
  localInstallationExists,
  removeInstalledSymlink
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
import {
  init_completionCache,
  regenerateCompletionCache
} from "./chunk-vwm15r11.js";
import"./chunk-xk0pz9ah.js";
import"./chunk-x2y5syym.js";
import"./chunk-r59g0618.js";
import"./chunk-7m2nd8da.js";
import {
  gte,
  init_semver
} from "./chunk-ps49ymvj.js";
import"./chunk-g338npwr.js";
import"./chunk-s5axysty.js";
import"./chunk-zk2wsm7d.js";
import"./chunk-smpjkjmr.js";
import"./chunk-e046tp8q.js";
import"./chunk-g8nemwxs.js";
import {
  getGlobalConfig,
  getInitialSettings,
  init_config1 as init_config,
  init_settings1 as init_settings,
  init_source,
  saveGlobalConfig,
  source_default
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
import"./chunk-zfp09a4r.js";
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
  init_debug,
  logForDebugging
} from "./chunk-71hncdva.js";
import {
  init_process,
  writeToStdout
} from "./chunk-fbv4apne.js";
import"./chunk-3r24h7t6.js";
import"./chunk-24stks7b.js";
import"./chunk-hqmz36b3.js";
import"./chunk-4g3v8y12.js";
import"./chunk-7739pg2c.js";
import"./chunk-xszk7n10.js";
import"./chunk-sdj9b9wh.js";
import"./chunk-qp2qdcda.js";

// src/cli/update.ts
init_source();
init_analytics();
init_autoUpdater();
init_completionCache();
init_config();
init_debug();
init_doctorDiagnostic();
init_gracefulShutdown();
init_localInstaller();
init_nativeInstaller();
init_packageManagers();
init_process();
init_semver();
init_settings();
async function update() {
  logEvent("tengu_update_check", {});
  writeToStdout(`Current version: ${MACRO.VERSION}
`);
  const channel = getInitialSettings()?.autoUpdatesChannel ?? "latest";
  writeToStdout(`Checking for updates to ${channel} version...
`);
  logForDebugging("update: Starting update check");
  logForDebugging("update: Running diagnostic");
  const diagnostic = await getDoctorDiagnostic();
  logForDebugging(`update: Installation type: ${diagnostic.installationType}`);
  logForDebugging(`update: Config install method: ${diagnostic.configInstallMethod}`);
  if (diagnostic.multipleInstallations.length > 1) {
    writeToStdout(`
`);
    writeToStdout(source_default.yellow("Warning: Multiple installations found") + `
`);
    for (const install of diagnostic.multipleInstallations) {
      const current = diagnostic.installationType === install.type ? " (currently running)" : "";
      writeToStdout(`- ${install.type} at ${install.path}${current}
`);
    }
  }
  if (diagnostic.warnings.length > 0) {
    writeToStdout(`
`);
    for (const warning of diagnostic.warnings) {
      logForDebugging(`update: Warning detected: ${warning.issue}`);
      logForDebugging(`update: Showing warning: ${warning.issue}`);
      writeToStdout(source_default.yellow(`Warning: ${warning.issue}
`));
      writeToStdout(source_default.bold(`Fix: ${warning.fix}
`));
    }
  }
  const config = getGlobalConfig();
  if (!config.installMethod && diagnostic.installationType !== "package-manager") {
    writeToStdout(`
`);
    writeToStdout(`Updating configuration to track installation method...
`);
    let detectedMethod = "unknown";
    switch (diagnostic.installationType) {
      case "npm-local":
        detectedMethod = "local";
        break;
      case "native":
        detectedMethod = "native";
        break;
      case "npm-global":
        detectedMethod = "global";
        break;
      default:
        detectedMethod = "unknown";
    }
    saveGlobalConfig((current) => ({
      ...current,
      installMethod: detectedMethod
    }));
    writeToStdout(`Installation method set to: ${detectedMethod}
`);
  }
  if (diagnostic.installationType === "development") {
    writeToStdout(`
`);
    writeToStdout(source_default.yellow("Warning: Cannot update development build") + `
`);
    await gracefulShutdown(1);
  }
  if (diagnostic.installationType === "package-manager") {
    const packageManager = await getPackageManager();
    writeToStdout(`
`);
    if (packageManager === "homebrew") {
      writeToStdout(`Claude is managed by Homebrew.
`);
      const latest = await getLatestVersion(channel);
      if (latest && !gte(MACRO.VERSION, latest)) {
        writeToStdout(`Update available: ${MACRO.VERSION} \u2192 ${latest}
`);
        writeToStdout(`
`);
        writeToStdout(`To update, run:
`);
        writeToStdout(source_default.bold("  brew upgrade claude-code") + `
`);
      } else {
        writeToStdout(`Claude is up to date!
`);
      }
    } else if (packageManager === "winget") {
      writeToStdout(`Claude is managed by winget.
`);
      const latest = await getLatestVersion(channel);
      if (latest && !gte(MACRO.VERSION, latest)) {
        writeToStdout(`Update available: ${MACRO.VERSION} \u2192 ${latest}
`);
        writeToStdout(`
`);
        writeToStdout(`To update, run:
`);
        writeToStdout(source_default.bold("  winget upgrade Anthropic.ClaudeCode") + `
`);
      } else {
        writeToStdout(`Claude is up to date!
`);
      }
    } else if (packageManager === "apk") {
      writeToStdout(`Claude is managed by apk.
`);
      const latest = await getLatestVersion(channel);
      if (latest && !gte(MACRO.VERSION, latest)) {
        writeToStdout(`Update available: ${MACRO.VERSION} \u2192 ${latest}
`);
        writeToStdout(`
`);
        writeToStdout(`To update, run:
`);
        writeToStdout(source_default.bold("  apk upgrade claude-code") + `
`);
      } else {
        writeToStdout(`Claude is up to date!
`);
      }
    } else {
      writeToStdout(`Claude is managed by a package manager.
`);
      writeToStdout(`Please use your package manager to update.
`);
    }
    await gracefulShutdown(0);
  }
  if (config.installMethod && diagnostic.configInstallMethod !== "not set" && diagnostic.installationType !== "package-manager") {
    const runningType = diagnostic.installationType;
    const configExpects = diagnostic.configInstallMethod;
    const typeMapping = {
      "npm-local": "local",
      "npm-global": "global",
      native: "native",
      development: "development",
      unknown: "unknown"
    };
    const normalizedRunningType = typeMapping[runningType] || runningType;
    if (normalizedRunningType !== configExpects && configExpects !== "unknown") {
      writeToStdout(`
`);
      writeToStdout(source_default.yellow("Warning: Configuration mismatch") + `
`);
      writeToStdout(`Config expects: ${configExpects} installation
`);
      writeToStdout(`Currently running: ${runningType}
`);
      writeToStdout(source_default.yellow(`Updating the ${runningType} installation you are currently using`) + `
`);
      saveGlobalConfig((current) => ({
        ...current,
        installMethod: normalizedRunningType
      }));
      writeToStdout(`Config updated to reflect current installation method: ${normalizedRunningType}
`);
    }
  }
  if (diagnostic.installationType === "native") {
    logForDebugging("update: Detected native installation, using native updater");
    try {
      const result = await installLatest(channel, true);
      if (result.lockFailed) {
        const pidInfo = result.lockHolderPid ? ` (PID ${result.lockHolderPid})` : "";
        writeToStdout(source_default.yellow(`Another Claude process${pidInfo} is currently running. Please try again in a moment.`) + `
`);
        await gracefulShutdown(0);
      }
      if (!result.latestVersion) {
        process.stderr.write(`Failed to check for updates
`);
        await gracefulShutdown(1);
      }
      if (result.latestVersion === MACRO.VERSION) {
        writeToStdout(source_default.green(`Panda Code is up to date (${MACRO.VERSION})`) + `
`);
      } else {
        writeToStdout(source_default.green(`Successfully updated from ${MACRO.VERSION} to version ${result.latestVersion}`) + `
`);
        await regenerateCompletionCache();
      }
      await gracefulShutdown(0);
    } catch (error) {
      process.stderr.write(`Error: Failed to install native update
`);
      process.stderr.write(String(error) + `
`);
      process.stderr.write(`Try running "claude doctor" for diagnostics
`);
      await gracefulShutdown(1);
    }
  }
  if (config.installMethod !== "native") {
    await removeInstalledSymlink();
  }
  logForDebugging("update: Checking npm registry for latest version");
  logForDebugging(`update: Package URL: ${MACRO.PACKAGE_URL}`);
  const npmTag = channel === "stable" ? "stable" : "latest";
  const npmCommand = `npm view ${MACRO.PACKAGE_URL}@${npmTag} version`;
  logForDebugging(`update: Running: ${npmCommand}`);
  const latestVersion = await getLatestVersion(channel);
  logForDebugging(`update: Latest version from npm: ${latestVersion || "FAILED"}`);
  if (!latestVersion) {
    logForDebugging("update: Failed to get latest version from npm registry");
    process.stderr.write(source_default.red("Failed to check for updates") + `
`);
    process.stderr.write(`Unable to fetch latest version from npm registry
`);
    process.stderr.write(`
`);
    process.stderr.write(`Possible causes:
`);
    process.stderr.write(`  \u2022 Network connectivity issues
`);
    process.stderr.write(`  \u2022 npm registry is unreachable
`);
    process.stderr.write(`  \u2022 Corporate proxy/firewall blocking npm
`);
    if (MACRO.PACKAGE_URL && !MACRO.PACKAGE_URL.startsWith("@anthropic")) {
      process.stderr.write(`  \u2022 Internal/development build not published to npm
`);
    }
    process.stderr.write(`
`);
    process.stderr.write(`Try:
`);
    process.stderr.write(`  \u2022 Check your internet connection
`);
    process.stderr.write(`  \u2022 Run with --debug flag for more details
`);
    const packageName = MACRO.PACKAGE_URL || (process.env.USER_TYPE === "ant" ? "@anthropic-ai/claude-cli" : "@anthropic-ai/claude-code");
    process.stderr.write(`  \u2022 Manually check: npm view ${packageName} version
`);
    process.stderr.write(`  \u2022 Check if you need to login: npm whoami
`);
    await gracefulShutdown(1);
  }
  if (latestVersion === MACRO.VERSION) {
    writeToStdout(source_default.green(`Panda Code is up to date (${MACRO.VERSION})`) + `
`);
    await gracefulShutdown(0);
  }
  writeToStdout(`New version available: ${latestVersion} (current: ${MACRO.VERSION})
`);
  writeToStdout(`Installing update...
`);
  let useLocalUpdate = false;
  let updateMethodName = "";
  switch (diagnostic.installationType) {
    case "npm-local":
      useLocalUpdate = true;
      updateMethodName = "local";
      break;
    case "npm-global":
      useLocalUpdate = false;
      updateMethodName = "global";
      break;
    case "unknown": {
      const isLocal = await localInstallationExists();
      useLocalUpdate = isLocal;
      updateMethodName = isLocal ? "local" : "global";
      writeToStdout(source_default.yellow("Warning: Could not determine installation type") + `
`);
      writeToStdout(`Attempting ${updateMethodName} update based on file detection...
`);
      break;
    }
    default:
      process.stderr.write(`Error: Cannot update ${diagnostic.installationType} installation
`);
      await gracefulShutdown(1);
  }
  writeToStdout(`Using ${updateMethodName} installation update method...
`);
  logForDebugging(`update: Update method determined: ${updateMethodName}`);
  logForDebugging(`update: useLocalUpdate: ${useLocalUpdate}`);
  let status;
  if (useLocalUpdate) {
    logForDebugging("update: Calling installOrUpdateClaudePackage() for local update");
    status = await installOrUpdateClaudePackage(channel);
  } else {
    logForDebugging("update: Calling installGlobalPackage() for global update");
    status = await installGlobalPackage();
  }
  logForDebugging(`update: Installation status: ${status}`);
  switch (status) {
    case "success":
      writeToStdout(source_default.green(`Successfully updated from ${MACRO.VERSION} to version ${latestVersion}`) + `
`);
      await regenerateCompletionCache();
      break;
    case "no_permissions":
      process.stderr.write(`Error: Insufficient permissions to install update
`);
      if (useLocalUpdate) {
        process.stderr.write(`Try manually updating with:
`);
        process.stderr.write(`  cd ~/.claude/local && npm update ${MACRO.PACKAGE_URL}
`);
      } else {
        process.stderr.write(`Try running with sudo or fix npm permissions
`);
        process.stderr.write(`Or consider using native installation with: claude install
`);
      }
      await gracefulShutdown(1);
      break;
    case "install_failed":
      process.stderr.write(`Error: Failed to install update
`);
      if (useLocalUpdate) {
        process.stderr.write(`Try manually updating with:
`);
        process.stderr.write(`  cd ~/.claude/local && npm update ${MACRO.PACKAGE_URL}
`);
      } else {
        process.stderr.write(`Or consider using native installation with: claude install
`);
      }
      await gracefulShutdown(1);
      break;
    case "in_progress":
      process.stderr.write(`Error: Another instance is currently performing an update
`);
      process.stderr.write(`Please wait and try again later
`);
      await gracefulShutdown(1);
      break;
  }
  await gracefulShutdown(0);
}
export {
  update
};
