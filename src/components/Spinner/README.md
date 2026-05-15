# components/Spinner

Spinner 子模块 — `SpinnerAnimationRow.tsx` 是 50ms 动画唯一驱动源（glyph + glimmer + amber/stall/perm 信号）；`CompactProgressBar.tsx` 是 /compact 进度条（phase + percent + token + elapsed + attempt），`useStalledAnimation` / `useShimmerAnimation` 是动画 hook，`SpinnerGlyph` / `GlimmerMessage` / `FlashingChar` / `ShimmerChar` 是 glyph 与 message 渲染；`TeammateSpinnerTree` / `TeammateSpinnerLine` / `teammateSelectHint` 处理团队工作模式；`index.ts` 导出 default characters + SpinnerMode 类型。

文件清单：SpinnerAnimationRow.tsx · CompactProgressBar.tsx · CompactProgressBar.test.ts · useStalledAnimation.ts · useShimmerAnimation.ts · SpinnerGlyph.tsx · GlimmerMessage.tsx · ShimmerChar.tsx · FlashingChar.tsx · TeammateSpinnerTree.tsx · TeammateSpinnerLine.tsx · teammateSelectHint.ts · types.ts · utils.ts · index.ts

一旦这里的结构发生变化，请务必更新我... 就像重新标记领地一样。
