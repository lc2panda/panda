# Input:  无（自动从 GitHub Release 拉取 latest .tgz）
# Output: 全局安装 @lc2panda/panda-code（panda CLI），并自动补齐 bun 运行时
# Pos:    仓库根 Windows PowerShell 一行零门槛安装入口（irm .../install.ps1 | iex）
#
# 一行安装（PowerShell）：
#   irm https://raw.githubusercontent.com/lc2panda/panda/main/install.ps1 | iex
#
# 备选（显式 tarball URL，替换为实际发布版本）：
#   npm i -g https://github.com/lc2panda/panda/releases/download/v2.28.0/lc2panda-panda-code-2.28.0.tgz
#
# 设计：launcher（dist/launcher.cjs）运行 dist/cli.js 需要 bun；缺失则自动装。
#      优先从 GitHub Release 拉公开 .tgz（无需 token），npm install -g 该 tgz。
#      curl ... | bash 仅适用 macOS/Linux；Windows 请用本脚本（install.ps1）。

$ErrorActionPreference = 'Stop'

$Repo   = 'lc2panda/panda'
$NpmPkg = '@lc2panda/panda-code'

function Write-Info { param([string]$Msg) Write-Host "==> $Msg" -ForegroundColor Cyan }
function Write-Ok   { param([string]$Msg) Write-Host "[ok] $Msg" -ForegroundColor Green }
function Write-Warn { param([string]$Msg) Write-Host "[!] $Msg" -ForegroundColor Yellow }
function Write-Err  { param([string]$Msg) Write-Host "[x] $Msg" -ForegroundColor Red }

Write-Info "Panda Code 安装器 — 仓库 $Repo，包 $NpmPkg"

# ── 1. 检测 / 安装 bun（launcher 运行 cli.js 必需）──────────────────────────
$bunBin = Join-Path $HOME '.bun\bin'
if (Get-Command bun -ErrorAction SilentlyContinue) {
    Write-Ok "bun 已就绪：$((Get-Command bun).Source)"
}
elseif (Test-Path (Join-Path $bunBin 'bun.exe')) {
    $env:Path = "$bunBin;$env:Path"
    Write-Ok "bun 已就绪（~\.bun\bin）"
}
else {
    Write-Warn "未检测到 bun，开始自动安装（https://bun.sh/install）..."
    Invoke-RestMethod https://bun.sh/install.ps1 | Invoke-Expression
    if (Test-Path (Join-Path $bunBin 'bun.exe')) {
        $env:Path = "$bunBin;$env:Path"
    }
    if (Get-Command bun -ErrorAction SilentlyContinue) {
        Write-Ok "bun 安装完成：$(bun --version 2>$null)"
    }
    else {
        Write-Err "bun 安装后仍不可用，请手动把 $bunBin 加入 PATH 后重试。"
        exit 1
    }
}

# ── 2. 检测 npm（全局安装 tgz 依赖 npm）─────────────────────────────────────
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Err "未检测到 npm。请先安装 Node.js（含 npm）：https://nodejs.org/ ，然后重新运行本脚本。"
    exit 1
}
Write-Ok "npm 已就绪：$(npm --version 2>$null)"

# ── 3. 解析 latest Release 的 .tgz 下载地址 ────────────────────────────────
$TgzUrl = ''
if (Get-Command gh -ErrorAction SilentlyContinue) {
    Write-Info "通过 gh 解析 latest release 的 .tgz ..."
    try {
        $assetsJson = gh release view --repo $Repo --json assets 2>$null
        if ($assetsJson) {
            $assets = ($assetsJson | ConvertFrom-Json).assets
            $tgzAsset = $assets | Where-Object { $_.name -like '*.tgz' } | Select-Object -First 1
            if ($tgzAsset) { $TgzUrl = $tgzAsset.url }
        }
    }
    catch { $TgzUrl = '' }
}

if (-not $TgzUrl) {
    Write-Info "回退：通过 GitHub API 解析 latest release 的 .tgz ..."
    try {
        $rel = Invoke-RestMethod "https://api.github.com/repos/$Repo/releases/latest" -Headers @{ 'User-Agent' = 'panda-installer' }
        $tgzAsset = $rel.assets | Where-Object { $_.name -like '*.tgz' } | Select-Object -First 1
        if ($tgzAsset) { $TgzUrl = $tgzAsset.browser_download_url }
    }
    catch { $TgzUrl = '' }
}

# ── 4. 下载 + 全局安装 ──────────────────────────────────────────────────────
if ($TgzUrl) {
    Write-Ok "找到 tarball：$TgzUrl"
    $tmpFile = Join-Path ([System.IO.Path]::GetTempPath()) 'panda-code.tgz'
    try {
        Write-Info "下载 tarball ..."
        Invoke-WebRequest -Uri $TgzUrl -OutFile $tmpFile -Headers @{ 'User-Agent' = 'panda-installer' }
        Write-Info "全局安装：npm install -g <tgz> ..."
        npm install -g $tmpFile
    }
    finally {
        if (Test-Path $tmpFile) { Remove-Item $tmpFile -Force -ErrorAction SilentlyContinue }
    }
}
else {
    Write-Warn "未在 latest release 找到 .tgz 资产。"
    Write-Warn "回退方案：从 GitHub Packages 安装（需要 GitHub token 配置 %USERPROFILE%\.npmrc）："
    Write-Warn "  Add-Content `$env:USERPROFILE\.npmrc '@lc2panda:registry=https://npm.pkg.github.com'"
    Write-Warn "  Add-Content `$env:USERPROFILE\.npmrc '//npm.pkg.github.com/:_authToken=YOUR_TOKEN'"
    Write-Warn "  npm install -g $NpmPkg"
    exit 1
}

# ── 5. 验证 ────────────────────────────────────────────────────────────────
if (Get-Command panda -ErrorAction SilentlyContinue) {
    Write-Ok "安装成功：panda $(panda --version 2>$null)"
    Write-Info "现在可以直接运行：panda"
}
else {
    Write-Warn "panda 已安装，但当前 PATH 找不到它。"
    Write-Warn "请把 npm 全局 bin 目录加入 PATH："
    $npmPrefix = (npm prefix -g 2>$null)
    Write-Warn "  `$env:Path = `"$npmPrefix;`$env:Path`""
    Write-Warn "永久生效：把上面 npm 全局目录通过『系统属性 → 环境变量』加入用户 PATH，重开终端后运行：panda --version"
    exit 1
}
