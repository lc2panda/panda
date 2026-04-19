# src/buddy — panda 形象宠物

文件清单：types.ts (枚举/优先级/物种) · companion.ts (PRNG 装配 + getCompanion + forced species) · petState.ts (12 态状态机 + applyForcedState) · sprites.ts + sprites/{panda,redPanda,kungFuPanda}.ts (84 帧 ASCII) · CompanionSprite.tsx (state-driven 渲染) · MiniPet.tsx (StatusLine 5 字符 face) · prompt.ts (魂体 prompt) · useBuddyNotification.tsx (通知钩子)。状态机入口 useCurrentPetState；sprite 数据源 BODIES_BY_STATE。一旦此处结构发生变化，请务必更新我，就像重新标记领地一样。
