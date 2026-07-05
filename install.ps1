# Input:  无（自动从 GitHub Release 解析 latest .tgz 直链）
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
#      优先从 GitHub Release 解析公开 .tgz 直链（browser_download_url），由 npm 直接
#      install -g <url> 拉取，避免 PowerShell 5.1 的 Invoke-WebRequest 大二进制下载坑。
#      主体封装为函数，内部用 throw/return，避免 `irm | iex` 场景下 exit 掐断宿主会话。
#      curl ... | bash 仅适用 macOS/Linux；Windows 请用本脚本（install.ps1）。

function Install-Panda {
    $Repo            = 'lc2panda/panda'
    $NpmPkg          = '@lc2panda/panda-code'
    $TgzNamePrefix   = 'lc2panda-panda-code-'
    # 解析全部失败时的兜底直链（与备选命令一致，确保至少能装上）
    $FallbackTgzUrl  = 'https://github.com/lc2panda/panda/releases/download/v2.29.7/lc2panda-panda-code-2.29.7.tgz'

    function Write-Info { param([string]$Msg) Write-Host "==> $Msg" -ForegroundColor Cyan }
    function Write-Ok   { param([string]$Msg) Write-Host "[ok] $Msg" -ForegroundColor Green }
    function Write-Warn { param([string]$Msg) Write-Host "[!] $Msg" -ForegroundColor Yellow }
    function Write-Err  { param([string]$Msg) Write-Host "[x] $Msg" -ForegroundColor Red }

    Write-Info "Panda Code 安装器 — 仓库 $Repo，包 $NpmPkg"

    # PS 5.1 默认未启用 TLS 1.2，GitHub API/Release 握手会失败，先补上
    try { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocol]::Tls12 } catch { }

    # 局部放宽错误策略：bun 安装等子流程的非致命警告不应中断整体安装
    $ErrorActionPreference = 'Continue'

    # 1. 检测 / 安装 bun（launcher 运行 cli.js 必需）
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
        try {
            Invoke-RestMethod https://bun.sh/install.ps1 | Invoke-Expression
        }
        catch {
            Write-Warn "bun 自动安装过程报错：$($_.Exception.Message)"
        }
        if (Test-Path (Join-Path $bunBin 'bun.exe')) {
            $env:Path = "$bunBin;$env:Path"
        }
        if (Get-Command bun -ErrorAction SilentlyContinue) {
            Write-Ok "bun 安装完成：$(bun --version 2>$null)"
        }
        else {
            Write-Err "bun 安装后仍不可用，请手动安装 bun（irm bun.sh/install.ps1 | iex）"
            Write-Err "并把 $bunBin 加入 PATH 后重试。"
            throw "bun unavailable"
        }
    }

    # 2. 检测 npm（全局安装 tgz 依赖 npm）
    if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
        Write-Err "未检测到 npm。请先安装 Node.js（含 npm）：https://nodejs.org/ ，然后重新运行本脚本。"
        throw "npm unavailable"
    }
    Write-Ok "npm 已就绪：$(npm --version 2>$null)"

    # 3. 解析 latest Release 的 .tgz 直链（browser_download_url 形式）
    #    优先 gh（拼直链而非用 api asset url），回退 GitHub REST releases/latest，
    #    再回退硬编码兜底直链。全程不下载，交给 npm 直接拉取。
    $TgzUrl = ''

    if (Get-Command gh -ErrorAction SilentlyContinue) {
        Write-Info "通过 gh 解析 latest release 的 .tgz ..."
        try {
            $relJson = gh release view --repo $Repo --json tagName,assets 2>$null
            if ($relJson) {
                $rel = $relJson | ConvertFrom-Json
                $tgzAsset = $rel.assets | Where-Object { $_.name -like '*.tgz' } | Select-Object -First 1
                if ($tgzAsset -and $rel.tagName) {
                    # 用 tag + 资产名拼 browser_download_url 直链，不用 api asset url
                    $TgzUrl = "https://github.com/$Repo/releases/download/$($rel.tagName)/$($tgzAsset.name)"
                }
            }
        }
        catch { $TgzUrl = '' }
    }

    if (-not $TgzUrl) {
        Write-Info "回退：通过 GitHub API 解析 latest release 的 .tgz ..."
        try {
            $rel = Invoke-RestMethod "https://api.github.com/repos/$Repo/releases/latest" -Headers @{ 'User-Agent' = 'panda-installer' }
            $tgzAsset = $rel.assets | Where-Object { $_.name -like '*.tgz' } | Select-Object -First 1
            if ($tgzAsset) {
                # 直接用 browser_download_url（公开直链，npm 可直接拉取）
                $TgzUrl = $tgzAsset.browser_download_url
            }
        }
        catch { $TgzUrl = '' }
    }

    if (-not $TgzUrl) {
        Write-Warn "未能从 gh / GitHub API 解析到 .tgz 直链，使用兜底直链。"
        $TgzUrl = $FallbackTgzUrl
    }

    # 4. 全局安装：让 npm 直接拉取 tgz 直链（不经 Invoke-WebRequest）
    Write-Ok "找到 tarball：$TgzUrl"
    Write-Info "全局安装：npm install -g <tgz-url> ..."
    npm install -g $TgzUrl
    if ($LASTEXITCODE -ne 0) {
        Write-Err "npm install -g 失败（exit code $LASTEXITCODE）。可手动重试："
        Write-Err "  npm i -g $TgzUrl"
        throw "npm install failed"
    }

    # 5. 验证
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
    }
}

Install-Panda
