# build/icons — panda-on-desk 跨平台图标资产

> Input: panda.svg 矢量源
> Output: panda.png（linux）/ panda.icns（mac）/ panda.ico（win）
> Pos: electron-builder buildResources 子目录 — Phase 3 P3-T2 占位

## 文件清单（v1.0 GA 占位）

| 文件 | 平台 | 规格 | 状态 |
|------|------|------|------|
| `panda.svg` | 矢量源 | 512×512 viewBox | 占位（ASCII 风熊猫脸） |
| `panda.png` | Linux AppImage / deb | 512×512 PNG-32 sRGB | **占位文本** — v1.5 替换 |
| `panda.icns` | macOS dmg/zip | multi-res 16~1024 | **占位文本** — v1.5 替换 |
| `panda.ico` | Windows NSIS | multi-res 16~256 | **占位文本** — v1.5 替换 |

## v1.5 美术 TODO

> 当前 v1.0 GA 阶段所有 .png/.icns/.ico 均为文本占位，**electron-builder 实际打包必须先替换为真实图像**。

### 生成流程（v1.5 美术稿落地后）

```bash
cd packages/panda-on-desk/build/icons

# 1. SVG → PNG（512×512 sRGB）
bunx sharp-cli -i panda.svg -o panda.png --resize 512 512 --format png

# 2. PNG → macOS .icns
mkdir panda.iconset
sips -z 16 16     panda.png --out panda.iconset/icon_16x16.png
sips -z 32 32     panda.png --out panda.iconset/icon_16x16@2x.png
sips -z 32 32     panda.png --out panda.iconset/icon_32x32.png
sips -z 64 64     panda.png --out panda.iconset/icon_32x32@2x.png
sips -z 128 128   panda.png --out panda.iconset/icon_128x128.png
sips -z 256 256   panda.png --out panda.iconset/icon_128x128@2x.png
sips -z 256 256   panda.png --out panda.iconset/icon_256x256.png
sips -z 512 512   panda.png --out panda.iconset/icon_256x256@2x.png
cp                panda.png      panda.iconset/icon_512x512.png
sips -z 1024 1024 panda.png --out panda.iconset/icon_512x512@2x.png
iconutil -c icns panda.iconset -o panda.icns

# 3. PNG → Windows .ico（multi-res）
bunx png-to-ico panda-256.png panda-128.png panda-64.png panda-48.png panda-32.png panda-16.png > panda.ico
```

### electron-builder 引用约定

`packages/panda-on-desk/electron-builder.yml` `directories.buildResources: build`，因此 electron-builder 自动按以下规则查找：

- mac → `build/icon.icns`（如缺则用 `build/icons/panda.icns` 需在 mac.icon 显式声明）
- win → `build/icon.ico`
- linux → `build/icon.png`

> v1.5 替换图像后，需评估是否将 `build/icons/panda.{png,icns,ico}` 软链/拷贝到 `build/icon.{png,icns,ico}` 以走默认路径。或在 electron-builder.yml 的 mac/win/linux 节显式声明 `icon: build/icons/panda.xxx`。

## 设计基线（v1.5 美术输入）

- **基色**：纯黑（#0d0d0d）+ 纯白（#ffffff），匹配 panda CLI Matrix 主题
- **造型**：圆胖治愈系熊猫脸正面 + 黑耳 + 黑眼罩 + 黑鼻
- **文字**：底部小字 `panda-on-desk`（monospace，可选省略）
- **风格关键词**：CLI / minimal / pixel-friendly / dark-theme-first
- **可选支线**：18 物种主题各自一套图标（v2.0 后再说）

---

> 领地标记：本目录所有占位文件被替换或新增子目录（如 `panda.iconset/`）时，请同步更新本 README。
