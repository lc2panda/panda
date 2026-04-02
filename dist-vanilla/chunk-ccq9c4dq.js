// @bun
import {
  init_sessionStoragePortable
} from "./chunk-tg3zbmz7.js";
import {
  getPlatform,
  init_platform
} from "./chunk-2g1tm0n3.js";
import {
  init_memoize as init_memoize2,
  memoizeWithLRU
} from "./chunk-tjd99w4c.js";
import {
  execSync_DEPRECATED,
  init_execSyncWrapper
} from "./chunk-sctqkknr.js";
import {
  getCwd,
  init_cwd
} from "./chunk-wgf77cc9.js";
import {
  getFsImplementation,
  init_debug,
  init_fsOperations,
  logForDebugging
} from "./chunk-cv4r43rj.js";
import {
  init_memoize,
  memoize_default
} from "./chunk-hqmz36b3.js";
import {
  __esm
} from "./chunk-qp2qdcda.js";

// src/utils/windowsPaths.ts
import * as path from "path";
import * as pathWin32 from "path/win32";
function checkPathExists(path2) {
  try {
    execSync_DEPRECATED(`dir "${path2}"`, { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}
function findExecutable(executable) {
  if (executable === "git") {
    const defaultLocations = [
      "C:\\Program Files\\Git\\cmd\\git.exe",
      "C:\\Program Files (x86)\\Git\\cmd\\git.exe"
    ];
    for (const location of defaultLocations) {
      if (checkPathExists(location)) {
        return location;
      }
    }
  }
  try {
    const result = execSync_DEPRECATED(`where.exe ${executable}`, {
      stdio: "pipe",
      encoding: "utf8"
    }).trim();
    const paths = result.split(`\r
`).filter(Boolean);
    const cwd = getCwd().toLowerCase();
    for (const candidatePath of paths) {
      const normalizedPath = path.resolve(candidatePath).toLowerCase();
      const pathDir = path.dirname(normalizedPath).toLowerCase();
      if (pathDir === cwd || normalizedPath.startsWith(cwd + path.sep)) {
        logForDebugging(`Skipping potentially malicious executable in current directory: ${candidatePath}`);
        continue;
      }
      return candidatePath;
    }
    return null;
  } catch {
    return null;
  }
}
function setShellIfWindows() {
  if (getPlatform() === "windows") {
    const gitBashPath = findGitBashPath();
    process.env.SHELL = gitBashPath;
    logForDebugging(`Using bash path: "${gitBashPath}"`);
  }
}
var findGitBashPath, windowsPathToPosixPath, posixPathToWindowsPath;
var init_windowsPaths = __esm(() => {
  init_memoize();
  init_cwd();
  init_debug();
  init_execSyncWrapper();
  init_memoize2();
  init_platform();
  findGitBashPath = memoize_default(() => {
    if (process.env.CLAUDE_CODE_GIT_BASH_PATH) {
      if (checkPathExists(process.env.CLAUDE_CODE_GIT_BASH_PATH)) {
        return process.env.CLAUDE_CODE_GIT_BASH_PATH;
      }
      console.error(`Panda Code was unable to find CLAUDE_CODE_GIT_BASH_PATH path "${process.env.CLAUDE_CODE_GIT_BASH_PATH}"`);
      process.exit(1);
    }
    const gitPath = findExecutable("git");
    if (gitPath) {
      const bashPath = pathWin32.join(gitPath, "..", "..", "bin", "bash.exe");
      if (checkPathExists(bashPath)) {
        return bashPath;
      }
    }
    console.error("Panda Code on Windows requires git-bash (https://git-scm.com/downloads/win). If installed but not in PATH, set environment variable pointing to your bash.exe, similar to: CLAUDE_CODE_GIT_BASH_PATH=C:\\Program Files\\Git\\bin\\bash.exe");
    process.exit(1);
  });
  windowsPathToPosixPath = memoizeWithLRU((windowsPath) => {
    if (windowsPath.startsWith("\\\\")) {
      return windowsPath.replace(/\\/g, "/");
    }
    const match = windowsPath.match(/^([A-Za-z]):[/\\]/);
    if (match) {
      const driveLetter = match[1].toLowerCase();
      return "/" + driveLetter + windowsPath.slice(2).replace(/\\/g, "/");
    }
    return windowsPath.replace(/\\/g, "/");
  }, (p) => p, 500);
  posixPathToWindowsPath = memoizeWithLRU((posixPath) => {
    if (posixPath.startsWith("//")) {
      return posixPath.replace(/\//g, "\\");
    }
    const cygdriveMatch = posixPath.match(/^\/cygdrive\/([A-Za-z])(\/|$)/);
    if (cygdriveMatch) {
      const driveLetter = cygdriveMatch[1].toUpperCase();
      const rest = posixPath.slice(("/cygdrive/" + cygdriveMatch[1]).length);
      return driveLetter + ":" + (rest || "\\").replace(/\//g, "\\");
    }
    const driveMatch = posixPath.match(/^\/([A-Za-z])(\/|$)/);
    if (driveMatch) {
      const driveLetter = driveMatch[1].toUpperCase();
      const rest = posixPath.slice(2);
      return driveLetter + ":" + (rest || "\\").replace(/\//g, "\\");
    }
    return posixPath.replace(/\//g, "\\");
  }, (p) => p, 500);
});

// src/utils/path.ts
import { homedir } from "os";
import { dirname as dirname2, isAbsolute, join as join2, normalize, relative, resolve as resolve2 } from "path";
function expandPath(path2, baseDir) {
  const actualBaseDir = baseDir ?? getCwd() ?? getFsImplementation().cwd();
  if (typeof path2 !== "string") {
    throw new TypeError(`Path must be a string, received ${typeof path2}`);
  }
  if (typeof actualBaseDir !== "string") {
    throw new TypeError(`Base directory must be a string, received ${typeof actualBaseDir}`);
  }
  if (path2.includes("\x00") || actualBaseDir.includes("\x00")) {
    throw new Error("Path contains null bytes");
  }
  const trimmedPath = path2.trim();
  if (!trimmedPath) {
    return normalize(actualBaseDir).normalize("NFC");
  }
  if (trimmedPath === "~") {
    return homedir().normalize("NFC");
  }
  if (trimmedPath.startsWith("~/")) {
    return join2(homedir(), trimmedPath.slice(2)).normalize("NFC");
  }
  let processedPath = trimmedPath;
  if (getPlatform() === "windows" && trimmedPath.match(/^\/[a-z]\//i)) {
    try {
      processedPath = posixPathToWindowsPath(trimmedPath);
    } catch {
      processedPath = trimmedPath;
    }
  }
  if (isAbsolute(processedPath)) {
    return normalize(processedPath).normalize("NFC");
  }
  return resolve2(actualBaseDir, processedPath).normalize("NFC");
}
function toRelativePath(absolutePath) {
  const relativePath = relative(getCwd(), absolutePath);
  return relativePath.startsWith("..") ? absolutePath : relativePath;
}
function getDirectoryForPath(path2) {
  const absolutePath = expandPath(path2);
  if (absolutePath.startsWith("\\\\") || absolutePath.startsWith("//")) {
    return dirname2(absolutePath);
  }
  try {
    const stats = getFsImplementation().statSync(absolutePath);
    if (stats.isDirectory()) {
      return absolutePath;
    }
  } catch {}
  return dirname2(absolutePath);
}
function containsPathTraversal(path2) {
  return /(?:^|[\\/])\.\.(?:[\\/]|$)/.test(path2);
}
function normalizePathForConfigKey(path2) {
  const normalized = normalize(path2);
  return normalized.replace(/\\/g, "/");
}
var init_path = __esm(() => {
  init_cwd();
  init_fsOperations();
  init_platform();
  init_windowsPaths();
  init_sessionStoragePortable();
});

export { setShellIfWindows, findGitBashPath, windowsPathToPosixPath, posixPathToWindowsPath, init_windowsPaths, expandPath, toRelativePath, getDirectoryForPath, containsPathTraversal, normalizePathForConfigKey, init_path };
