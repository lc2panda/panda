# panda-on-desk · macOS Build Guide

> **任务来源**：W20-T1 · agent-α-W20-mac-dmg
> **首落盘时间**：2026-04-20 +08:00（Asia/Singapore）
> **配套文件**：`packages/panda-on-desk/electron-builder.yml` · `.github/workflows/release-panda-on-desk.yml`（`build-mac` job）
> **姊妹篇**：[`docs/linux-build.md`](../../../docs/linux-build.md)（W18-T1 落盘的 Linux AppImage 路径指引）

---

## 1. 速览：为什么不能在 Win/Linux 上跨编译 macOS 产物？

`electron-builder@25.1.8` 在 schema 校验阶段就硬阻塞 non-macOS host：

```
$ bunx electron-builder --mac zip --x64 --publish never
  • electron-builder  version=25.1.8 os=10.0.26100
  • loaded configuration  file=…\electron-builder.yml
  ⨯ Build for macOS is supported only on macOS,
    please see https://electron.build/multi-platform-build
```

根因（与 Linux AppImage 的 `mksquashfs` ELF 限制不同）：

1. **`dmg-license` npm 包**：仅在 darwin 平台可装，用于 dmg 内嵌 EULA；
2. **`app-builder-bin` 内的 mac 工具**（`hfsplus`、`dmgbuild`）：Mach-O 二进制，Win `CreateProcess` 无法解析；
3. **`codesign` / `productbuild` / `xcrun notarytool`**：Apple 私有工具链，仅 macOS 13+ 自带；
4. **Hardened Runtime + Notarization**：必须用 Apple Developer ID 证书在 macOS Keychain 中签名后才能上传 Apple notary 服务，纯跨平台无法绕过。

> 即便加 `--mac zip`（不签名）也被 electron-builder 在 schema 阶段就拒绝，无法进入 build pipeline——**不存在 Win/Linux 跨编译 macOS 的可行路径**（除非用 macOS-in-the-cloud 服务，本仓库未集成）。

---

## 2. 三条可行路径

| 路径 | 触发方 | 适用场景 | 前置 | 产物 |
| --- | --- | --- | --- | --- |
| **A** GitHub Actions `macos-latest` runner | 推 `desk-v*` tag | 官方发版主路径 | 已就绪（仓库 secrets 即够） | `*.dmg` × 2 + `*.zip` × 2（x64 + arm64）+ `latest-mac.yml` |
| **B** macOS 本地维护者 | 持有 Mac 的开发者 | 本机验证 / 烟测 | macOS 13+ + Xcode CLT + Bun | 同上（默认全 target，除非加 `--mac zip` 加速） |
| **C** macOS 本地 + 官方签名 | 发布维护者 | 公证版（用户双击不报"未知开发者"） | 路径 B 全部前置 + Apple Developer ID + CSC 证书 + App-specific password | 同上（已签名 + 已公证） |

---

## 3. 路径 A：GitHub Actions（推荐，官方发版）

**最短路径**：

```bash
# 1. 同步 panda-on-desk 子包版本
cd packages/panda-on-desk
node -e "const f='package.json';const j=require('./'+f);j.version='1.0.0';require('fs').writeFileSync(f,JSON.stringify(j,null,2)+'\n')"

# 2. commit 版本号
git add packages/panda-on-desk/package.json
git commit -m "chore(panda-on-desk): bump version to 1.0.0"

# 3. 打 tag 并推送 → 触发 workflow
git tag desk-v1.0.0
git push origin main desk-v1.0.0
```

`build-mac` job 会自动：

1. checkout + setup Node 22 + setup Bun
2. `bun install --frozen-lockfile`（root） + `bun install`（packages/panda-on-desk）
3. `Sync panda-on-desk version with tag`（W6-T2 加固，避免 artifact 命名错位）
4. `bun run build:dist` 编译 `src/main.ts → src/main.js`
5. `Ensure real panda.icns`（W6-T2，本仓库已是真实 icns，会跳过 regen）
6. `bunx electron-builder --mac --publish never`（按 `electron-builder.yml#mac.target` 同时出 dmg + zip 双格式 × x64/arm64 双架构）
7. upload `panda-on-desk-mac` artifact（`*.dmg` `*.zip` `*.blockmap` `latest-mac.yml`）

**预期产出**：约 4 个 dmg/zip 文件（x64 + arm64 双架构 × dmg + zip 双格式）。Apple Silicon 单架构包 ≈ 95-110 MB，dmg 因压缩比类似 NSIS。

**Job 配置位置**：`.github/workflows/release-panda-on-desk.yml` line 44-126。

---

## 4. 路径 B：macOS 本地（无签名烟测）

适合维护者本机快速验证 GUI 是否能在 macOS 启动。

### 4.1 前置环境

```bash
# 1. macOS 13 (Ventura) 或更新
sw_vers -productVersion    # 应 ≥ 13.0

# 2. Xcode Command Line Tools（codesign + productbuild）
xcode-select --install     # 已装会提示 already installed

# 3. Node.js 22 + Bun
node -v   # ≥ 22
bun -v    # latest
```

### 4.2 build 命令

```bash
# 在仓库根
bun install --frozen-lockfile

# 进 panda-on-desk 子包
cd packages/panda-on-desk
bun install

# 编译 TypeScript main 入口（src/main.ts → src/main.js）
bun run build:dist

# 全量 build（dmg + zip × x64 + arm64） — 约 5-8 min
bunx electron-builder --mac --publish never

# 或只 zip 单架构加速验证（约 2 min）
bunx electron-builder --mac zip --x64 --publish never
```

### 4.3 产物位置

```
packages/panda-on-desk/dist-electron/
├─ panda-on-desk-1.0.0-mac.dmg              # x64
├─ panda-on-desk-1.0.0-arm64-mac.dmg        # arm64 (Apple Silicon)
├─ panda-on-desk-1.0.0-mac.zip
├─ panda-on-desk-1.0.0-arm64-mac.zip
├─ latest-mac.yml                            # electron-updater feed
└─ mac/                                      # unpacked .app
```

### 4.4 烟测：双击 dmg → 拖到 Applications → 启动

> **不签名包**：首次启动会被 Gatekeeper 拦截。维护者本机自测可右键"打开"绕过；**不要把无签名 dmg 直接发给用户**——必须走路径 C 或 GitHub Release（CI 包也是无签名，但配套 W11-T3 弹窗指引用户右键"打开"）。

---

## 5. 路径 C：macOS 本地 + Apple Developer ID 签名 + 公证

发布给真实用户必走。**本仓库 v1.0 GA 暂未启用**，predocs 留作 v1.5 升级路径。

### 5.1 前置（一次性）

1. **Apple Developer Program** 会员（$99/yr）
2. 在 [developer.apple.com](https://developer.apple.com/account/resources/certificates/list) 申请 **Developer ID Application** 证书 → 下载 `.cer` → 双击导入 Keychain
3. 从 Keychain 导出为 `.p12`（设密码）→ base64 编码：
   ```bash
   base64 -i developer-id-app.p12 -o developer-id-app.p12.base64
   ```
4. 在 [appleid.apple.com](https://appleid.apple.com/account/manage) 创建 **App-specific password**（用于 notarytool）

### 5.2 环境变量

```bash
# 签名证书（CSC = Code Signing Certificate）
export CSC_LINK="$(cat developer-id-app.p12.base64)"   # 或 https://path/to/p12 URL
export CSC_KEY_PASSWORD="<p12 导出时设的密码>"

# 公证（notarization）
export APPLE_ID="<Apple ID 邮箱>"
export APPLE_APP_SPECIFIC_PASSWORD="<App-specific password>"
export APPLE_TEAM_ID="<10 字符 Team ID>"               # developer.apple.com → Membership

# 不要在仓库提交这些值！用 direnv/1Password CLI/ macOS Keychain 管理
```

### 5.3 build 命令

```bash
cd packages/panda-on-desk
bun run build:dist

# 完整签名 + 公证
bunx electron-builder --mac --publish never
```

`electron-builder` 会自动：

1. `codesign` 用 CSC 证书签名 `.app` 内所有 binary（启用 `hardenedRuntime: true` + `entitlements: build/entitlements.mac.plist`）
2. 打 dmg + zip
3. `xcrun notarytool submit ... --wait` 上传 Apple 公证服务（约 5-15 min）
4. `xcrun stapler staple` 把公证凭证装订到 dmg

公证后用户双击 dmg 不再被 Gatekeeper 拦截。

### 5.4 GitHub Actions 集成（v1.5 计划）

在仓库 Settings → Secrets 添加：

| Secret 名 | 值 |
| --- | --- |
| `CSC_LINK` | `developer-id-app.p12.base64` 文件内容（base64 string） |
| `CSC_KEY_PASSWORD` | p12 密码 |
| `APPLE_ID` | Apple ID 邮箱 |
| `APPLE_APP_SPECIFIC_PASSWORD` | App-specific password |
| `APPLE_TEAM_ID` | 10 字符 Team ID |

然后修改 `.github/workflows/release-panda-on-desk.yml` 的 `build-mac` job：

```yaml
- name: Build (electron-builder mac)
  working-directory: packages/panda-on-desk
  env:
    GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    # 删除 CSC_IDENTITY_AUTO_DISCOVERY: 'false'，让 electron-builder 自动发现证书
    CSC_LINK: ${{ secrets.CSC_LINK }}
    CSC_KEY_PASSWORD: ${{ secrets.CSC_KEY_PASSWORD }}
    APPLE_ID: ${{ secrets.APPLE_ID }}
    APPLE_APP_SPECIFIC_PASSWORD: ${{ secrets.APPLE_APP_SPECIFIC_PASSWORD }}
    APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
  run: bunx electron-builder --mac --publish never
```

---

## 6. 常见错误 FAQ

### Q1: `Build for macOS is supported only on macOS`

**根因**：路径 B/C 必须在 macOS host 上跑。Win/Linux 跨编译路径不存在（见 §1）。

**修复**：用 GitHub Actions（路径 A）或换 macOS 设备。

### Q2: `Error: dmg-license is not installed`

**根因**：在 macOS 上 `bun install` 没装 dmg-license（罕见，bun + electron-builder 25 应自动）。

**修复**：

```bash
cd packages/panda-on-desk
bun add -D dmg-license
```

### Q3: `Error: No identity found, --keychain default`

**根因**：路径 C 走签名 build，但 CSC 证书未导入 Keychain 或 `CSC_LINK` 未设。

**修复**：检查 `security find-identity -v -p codesigning` 是否列出 "Developer ID Application: <Your Name>"。

### Q4: 公证报错 `Status: Invalid` / `The signature does not include a secure timestamp`

**根因**：codesign 时缺 `--timestamp` 参数（electron-builder 默认会加，但旧版可能漏）。

**修复**：检查 electron-builder ≥ 24.x；查看 `xcrun notarytool log <submission-id> --apple-id ... --team-id ...` 详细错误。

### Q5: 用户双击 dmg 报 "panda-on-desk.app is damaged"

**根因**：未公证 + Gatekeeper 严格模式拦截。

**修复 A（用户侧）**：右键点击 .app → "打开" → 二次确认。
**修复 B（维护者侧）**：走路径 C 完成公证。

---

## 7. 验收清单（GA 前必跑）

- [ ] 推 `desk-v0.9.0-rc1` tag → CI `build-mac` job 绿
- [ ] artifact `panda-on-desk-mac` 包含 4 个文件（dmg × 2 + zip × 2）
- [ ] 单架构包大小 < 150 MB（与 Win NSIS 100 MB 量级一致）
- [ ] 在 Apple Silicon Mac 双击 arm64.dmg → 拖到 Applications → 启动 → 看到 panda HUD
- [ ] 在 Intel Mac 双击 x64.dmg → 同上
- [ ] （可选）公证后再双击：Gatekeeper 不拦截

---

## 8. 引用

- electron-builder Multi-Platform Build：<https://www.electron.build/multi-platform-build>
- Apple Notarization 官方文档：<https://developer.apple.com/documentation/security/notarizing-macos-software-before-distribution>
- electron-builder Code Signing：<https://www.electron.build/code-signing>
- 配套 workflow：[`.github/workflows/release-panda-on-desk.yml#L44-L126`](../../../.github/workflows/release-panda-on-desk.yml)
- 配套 yml：[`packages/panda-on-desk/electron-builder.yml#L57-L73`](../electron-builder.yml)
- 姊妹文档：[`docs/linux-build.md`](../../../docs/linux-build.md)（W18-T1）

---

> **文档维护**：本文 W20-T1 首版。后续更新需同步 `electron-builder.yml#mac` 字段变化（如新增 universal binary、改用 pkg target、引入 mas store target）。
