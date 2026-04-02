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
} from "./chunk-ekfe4t3x.js";
import"./chunk-4xshe7tf.js";
import"./chunk-tdbeghs2.js";
import"./chunk-86h8sspq.js";
import"./chunk-hkxvdww3.js";
import"./chunk-9bwery1w.js";
import"./chunk-4c08gv68.js";
import"./chunk-p9ra2v2f.js";
import"./chunk-2gzv8nrw.js";
import"./chunk-4cwfa7zk.js";
import"./chunk-mjd4qde5.js";
import"./chunk-5g7gx4y7.js";
import"./chunk-cgfdkzhb.js";
import"./chunk-sknn7p3z.js";
import"./chunk-2hb5pyjj.js";
import"./chunk-9gbamk79.js";
import {
  init_completionCache,
  regenerateCompletionCache
} from "./chunk-1hjzbne1.js";
import"./chunk-djq17a7g.js";
import"./chunk-gypetngm.js";
import"./chunk-qjz5kp97.js";
import"./chunk-7m2nd8da.js";
import {
  gte,
  init_semver
} from "./chunk-ps49ymvj.js";
import"./chunk-g338npwr.js";
import"./chunk-7nbhgtwq.js";
import"./chunk-zk2wsm7d.js";
import"./chunk-73re2yq9.js";
import"./chunk-j30w257d.js";
import"./chunk-fxerh6v6.js";
import {
  getGlobalConfig,
  getInitialSettings,
  init_config1 as init_config,
  init_settings1 as init_settings,
  init_source,
  saveGlobalConfig,
  source_default
} from "./chunk-w5d5b7r0.js";
import"./chunk-0f1005z8.js";
import"./chunk-ccq9c4dq.js";
import"./chunk-tg3zbmz7.js";
import"./chunk-3asghxv4.js";
import"./chunk-xk4zgzx2.js";
import"./chunk-g0j0t6qk.js";
import"./chunk-3c25bcsw.js";
import"./chunk-2g1tm0n3.js";
import"./chunk-55wgxwa9.js";
import"./chunk-tbpx2160.js";
import"./chunk-4jm600zv.js";
import"./chunk-7np1pz21.js";
import"./chunk-5cqfqj5r.js";
import"./chunk-f5ma3nh5.js";
import"./chunk-qz2x630m.js";
import"./chunk-1mc1wz9m.js";
import"./chunk-p2816w9z.js";
import"./chunk-v9smspw2.js";
import"./chunk-v1kzp02e.js";
import"./chunk-0vkfrmqm.js";
import"./chunk-0xjaqda8.js";
import"./chunk-ywhstzac.js";
import"./chunk-cdz5yb0r.js";
import {
  init_analytics,
  logEvent
} from "./chunk-47cb3k0q.js";
import"./chunk-c4pgn9ph.js";
import"./chunk-bjwxx22f.js";
import"./chunk-tjd99w4c.js";
import"./chunk-qnfx3qtx.js";
import"./chunk-7z9e9ndj.js";
import"./chunk-sctqkknr.js";
import"./chunk-ehab6nmr.js";
import"./chunk-myphr2va.js";
import"./chunk-8tnsngw2.js";
import"./chunk-wgf77cc9.js";
import"./chunk-7wm5s02e.js";
import {
  init_debug,
  logForDebugging
} from "./chunk-cv4r43rj.js";
import {
  init_process,
  writeToStdout
} from "./chunk-fbv4apne.js";
import"./chunk-er95axp1.js";
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
        process.stderr.write(`  cd ~/.pandacc/local && npm update ${MACRO.PACKAGE_URL}
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
        process.stderr.write(`  cd ~/.pandacc/local && npm update ${MACRO.PACKAGE_URL}
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
