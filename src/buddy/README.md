# src/buddy — 编程伙伴宠物（v2.21.30 方向 A：18 物种通用）

文件清单：types.ts (枚举/优先级/18 物种) · companion.ts (PRNG 装配 + getCompanion + forced species 18 物种全集) · petState.ts (12 态状态机 + applyForcedState) · sprites.ts (BODIES 18 物种 ASCII + STATE_SPECIES_BODIES 扩展点 + getStateSprite fallback) · CompanionSprite.tsx (state-driven 渲染 + 旧 IDLE_SEQUENCE 兼容) · MiniPet.tsx (StatusLine 5 字符 face — 18 物种通用，无物种 gate) · prompt.ts (魂体 prompt) · useBuddyNotification.tsx (通知钩子)。状态机入口 useCurrentPetState；sprite 数据源 BODIES。v2.21.27-29 panda/redPanda/kungFuPanda 三 panda 系实装因 5×12 ASCII 画布太小退役（方向 A 决策）。一旦此处结构发生变化，请务必更新我，就像重新标记领地一样。
