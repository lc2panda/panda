# MatrixTheme

黑客帝国风字符雨 UI 主题（v2.11.0+，opt-in via `/theme matrix`）。

## 文件清单
- 核心：MatrixCharRain / MatrixBanner / MatrixBootSequence
- 资源：matrixCharSets / matrixPalette / matrixSyntaxTheme（cli-highlight phosphor 主题）
- 检测：isMatrixTheme
- T0 turn 地基：TurnGutter / TurnGutterContext / TurnHeader / turnRole（接 useFlashOnce + usePhosphorFadeIn + usePhosphorBreath）
- T-B1 思考：ThinkingPanel
- T-A2 / T-D2 启动：PandaLogoAscii / WelcomeCard
- T-D1 footer：MatrixHUD
- T-C2 / T-C4 动效：MatrixSpinner / ScanLine
- v3 chrome：TurnSeparator（v3.2 起为 null-renderer，保留接口）/ scanlineMarkdown（关键词高亮 + 行 parity）

## v3 OPERATOR-NEO chrome 设计
- user 行：`[OPERATOR · HH:MM:SS]` 顶标 + ▌ GLOW gutter + 极深绿底 #001A00（vs BASE 文本 ~5.0:1，AA 通过）
- assistant 行：`[PANDA · HH:MM:SS]` 顶标 + │ BASE gutter（无背景）
- 顶标仅 roleChanged 时出现；连续同角色 message 不重复
- turn 分隔：纯空白留白（v3.2 起移除所有分隔符与 katakana 彩蛋，避免误读 + 注意力争夺）

## 沉浸感（Phosphor afterglow）
- usePhosphorBreath：sin 波 0..1，组件按 t 索引 MATRIX_BREATH_PULSE 4 帧
- 应用点：TurnHeader 呼吸 dot（仅 isLoading 时）/ WelcomeCard borderColor 5s 慢呼吸 / MatrixHUD ▎ active indicator / [exec] 标签 1.6s 周期 / Boot logo 150ms 通电脉冲
- 视觉负担红线：每屏静态符号 ≤ 3 类、颜色档差 ≥ 4 级、无持续动画除 spinner/banner/必要 indicator

一旦这里的结构发生变化，请务必更新我，以及根目录 README 的对应章节。
