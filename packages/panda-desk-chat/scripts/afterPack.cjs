// Input: electron-builder AfterPackContext (appOutDir, packager, electronPlatformName)
// Output: writes Resources/panda-cli/cli-manifest.json after extraResources copy
// Pos: wired via electron-builder.yml `afterPack: ./scripts/afterPack.cjs`

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
    return join(appOutDir, `${productName}.app`, 'Contents', 'Resources');
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
