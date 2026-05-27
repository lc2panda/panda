// Input: electron-builder AfterPackContext (appOutDir, packager, electronPlatformName)
// Output: writes Resources/panda-cli/cli-manifest.json after extraResources copy
// Pos: wired via electron-builder.yml `afterPack: ./scripts/afterPack.cjs`
// Note: productFilename from packager.appInfo must match the actual .app dir name;
//       fallback: enumerate appOutDir/*.app when the named path does not exist.

'use strict';

const { createHash } = require('node:crypto');
const { readFileSync, writeFileSync, readdirSync, statSync, existsSync } = require('node:fs');
const { join, relative, sep } = require('node:path');

function collectJsFiles(root) {
  const out = [];
  if (!existsSync(root)) return out;
  for (const entry of readdirSync(root)) {
    const full = join(root, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      out.push(...collectJsFiles(full));
    } else if (st.isFile() && entry.endsWith('.js')) {
      out.push(full);
    }
  }
  return out;
}

function sha256File(p) {
  return createHash('sha256').update(readFileSync(p)).digest('hex');
}

function nowIsoSGT() {
  const d = new Date();
  const local = new Date(d.getTime() + 8 * 60 * 60 * 1000);
  return local.toISOString().replace('Z', '+08:00');
}

/**
 * Resolve the Resources directory for the packed app on the current platform.
 * On macOS: <appOutDir>/<ProductName>.app/Contents/Resources
 * On Linux: <appOutDir>/resources
 * On win32: <appOutDir>/resources
 */
function resolveResourcesPath(context) {
  const platform = context.electronPlatformName || process.platform;
  const appOutDir = context.appOutDir;
  if (platform === 'darwin' || platform === 'mas') {
    const productName =
      (context.packager && context.packager.appInfo && context.packager.appInfo.productFilename) ||
      'Panda';
    const primary = join(appOutDir, `${productName}.app`, 'Contents', 'Resources');
    if (existsSync(primary)) return primary;
    // Fallback: enumerate *.app dirs when productFilename diverges from the actual bundle name
    try {
      const entries = readdirSync(appOutDir);
      for (const entry of entries) {
        if (entry.endsWith('.app')) {
          const candidate = join(appOutDir, entry, 'Contents', 'Resources');
          if (existsSync(candidate)) {
            console.log(
              `[afterPack] productFilename="${productName}" not found; using actual bundle "${entry}"`,
            );
            return candidate;
          }
        }
      }
    } catch (_) {
      // ignore readdir errors, fall through to primary
    }
    return primary;
  }
  return join(appOutDir, 'resources');
}

module.exports = async function afterPack(context) {
  const resourcesPath = resolveResourcesPath(context);
  const pandaCliDir = join(resourcesPath, 'panda-cli');
  const distDir = join(pandaCliDir, 'dist');

  if (!existsSync(distDir)) {
    console.warn(
      `[afterPack] panda-cli/dist not found at ${distDir} — skipping manifest generation. ` +
        `(check extraResources order)`,
    );
    return;
  }

  const version =
    (context.packager && context.packager.appInfo && context.packager.appInfo.version) ||
    process.env.npm_package_version ||
    '0.0.0';

  const jsFiles = collectJsFiles(distDir);
  if (jsFiles.length === 0) {
    console.warn(`[afterPack] no .js files under ${distDir} — skipping manifest generation`);
    return;
  }

  const files = {};
  for (const abs of jsFiles) {
    const rel = relative(pandaCliDir, abs).split(sep).join('/');
    files[rel] = sha256File(abs);
  }

  const manifest = {
    version,
    generatedAt: nowIsoSGT(),
    files,
  };
  const outPath = join(pandaCliDir, 'cli-manifest.json');
  writeFileSync(outPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  console.log(
    `[afterPack] wrote ${outPath} (${Object.keys(files).length} .js files, version=${version})`,
  );
};
