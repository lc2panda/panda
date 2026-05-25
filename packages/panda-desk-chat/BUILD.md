# Panda Desk Chat — 打包发版指南

> Input: 源码 + 图标资源
> Output: macOS dmg / Windows exe / Linux AppImage 安装包
> Pos: 发版工具链文档

## 一、前置依赖

| 平台 | 必装 |
|------|------|
| macOS | Xcode CLI Tools (`xcode-select --install`)，Bun ≥ 1.2，Node ≥ 18 |
| Windows | Node ≥ 18，Bun (可选，npm/pnpm 也行)，**无需** wine/mono |
| Linux | Node ≥ 18，`fakeroot dpkg rpm` (打 deb/rpm 时需要) |

## 二、首次同步项目

```bash
# 任意平台 — clone 主仓库
git clone https://github.com/lc2panda/panda.git cc-panda
cd cc-panda

# 安装依赖（根 + 所有 workspace 子包）
bun install     # 或 npm install / pnpm install

# 进入桌面客户端子包
cd packages/panda-desk-chat
```

## 三、打包命令

打包脚本统一在 `packages/panda-desk-chat/package.json`，根据当前操作系统打对应安装包：

### 3.1 macOS 上打 macOS dmg + zip

```bash
cd packages/panda-desk-chat

# 1. 先在仓库根目录构建 panda CLI bundle（Desk Chat 运行时会 spawn 它）
cd ../..
bun run build
cd packages/panda-desk-chat

# 2. 构建 renderer + main + preload
bun run build:electron

# 3. 跑 electron-builder（会把根 dist/**/* 放进 Resources/panda-cli/dist/）
bun run dist
# 也可加 --x64 同时打 Intel 包

# 产物
ls release/Panda-0.2.3-arm64.dmg
```

### 3.2 Windows 上打 Windows exe + zip

```bash
# Windows PowerShell / cmd

cd packages\panda-desk-chat

# 1. 先在仓库根目录构建 panda CLI bundle
cd ..\..
bun run build
cd packages\panda-desk-chat

# 2. 构建并打包
bun run build:electron
bunx electron-builder --win --x64

# 产物
dir release\
# Panda Setup 0.2.3.exe   ← NSIS 安装器（推荐分发）
# Panda-0.2.3-win.zip     ← 免安装版
```

### 3.3 macOS 上跨平台打 Windows 包（已验证可用）

不需要本地装 wine — electron-builder 自动下载 `wine-4.0.1-mac` 跑 NSIS。首次会下载 ~25 MB 工具链。

```bash
cd packages/panda-desk-chat
bun run build:electron
bunx electron-builder --win --x64
# 产物同 3.2
```

> 注：跨平台打的 exe 在 Windows 上首次启动会被 SmartScreen 拦截（缺正式签名），右键 → 属性 → 解除锁定即可。如要消除 SmartScreen，需要 EV Code Signing 证书。

### 3.4 Linux

```bash
cd packages/panda-desk-chat
bun run build:electron
bunx electron-builder --linux AppImage deb --x64
# release/Panda-0.2.3.AppImage
# release/panda_0.2.3_amd64.deb
```

## 四、关键配置文件

| 文件 | 作用 |
|------|------|
| `package.json` `build.*` | electron-builder 配置（productName / icon / target / publish） |
| `package.json` `build.extraResources` | 必须把仓库根 `dist/**/*` 复制到 `Resources/panda-cli/dist/`，否则安装包内发消息会报缺 `cli.js` |
| `vite.config.ts` `base` | **必须保持 `"./"`** — Electron `file://` 协议下绝对路径会指向系统根，导致黑屏 |
| `index.html` | 同上，`<script src="./fouc.js">` 不能写 `/` 开头 |
| `public/icon.icns` `public/icon.ico` `public/icon.png` | 三平台图标，由 `pandalogo.jpeg` 派生 |

## 五、图标重新生成（更换 logo 时）

```bash
cd packages/panda-desk-chat

# macOS — sips/iconutil 自带
sips -s format png ../../pandalogo.jpeg --out public/app-icon.png
sips -z 1024 1024 public/app-icon.png --out public/app-icon.png
mkdir -p public/icon.iconset
for sz in 16 32 64 128 256 512 1024; do
  sips -z $sz $sz public/app-icon.png --out public/icon.iconset/icon_${sz}x${sz}.png
done
sips -z 32 32 public/app-icon.png --out public/icon.iconset/icon_16x16@2x.png
sips -z 64 64 public/app-icon.png --out public/icon.iconset/icon_32x32@2x.png
sips -z 256 256 public/app-icon.png --out public/icon.iconset/icon_128x128@2x.png
sips -z 512 512 public/app-icon.png --out public/icon.iconset/icon_256x256@2x.png
sips -z 1024 1024 public/app-icon.png --out public/icon.iconset/icon_512x512@2x.png
iconutil -c icns public/icon.iconset -o public/icon.icns
sips -z 512 512 public/app-icon.png --out public/icon.png

# Windows .ico — 跨平台用 png-to-ico npm 包
npx --yes png-to-ico public/app-icon.png > public/icon.ico
```

## 六、发版流程

1. `git pull` 最新 main
2. 按 三 章节命令打对应平台包
3. 验证 `release/mac-arm64/Panda.app/Contents/Resources/panda-cli/dist/cli.js` 存在，且 `panda-cli/dist/` 内有根 CLI chunks
4. 产物放在 `packages/panda-desk-chat/release/`（已被 `.gitignore` 排除）
5. 把 dmg / exe / zip 上传到 GitHub Release（手动 / `gh release create`）
6. 如需 panda CLI 同步发版：bump 根 `package.json` version → `npm publish`（GitHub Packages registry，需 `~/.npmrc` 配 `//npm.pkg.github.com/:_authToken=`）

## 七、常见坑

- **dmg 装后黑屏** → vite `base` 不是 `"./"`，重新检查 `vite.config.ts`
- **发消息报 `Module not found ... Resources/dist/cli.js`** → 安装包缺根 CLI bundle；先跑根 `bun run build`，确认 `package.json build.extraResources` 把 `../../dist/**/*` 放进 `Resources/panda-cli/dist/`，再重新 `bun run dist`
- **NSIS 打包卡 download** → electron-builder 镜像首次下载 wine + winCodeSign，需要科学上网；下次缓存命中
- **"unable to access github"** → git config 里有 proxy 失效，跑两次 `git push` 通常能恢复
- **node_modules 大** → bun workspace 链接到根 `node_modules`，子包打包时 electron-builder 自动遍历

一旦本文件被修改，请同步更新所属文件夹的 README.md。
