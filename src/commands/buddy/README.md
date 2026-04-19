# src/commands/buddy — /buddy 9 子命令

文件清单：index.ts (single-file 实现 9 子命令：show/hide/mute/unmute/info/state/wake/sleep/theme — v2.21.30 方向 A 后 theme 接 18 物种 duck/goose/blob/cat/dragon/octopus/owl/penguin/turtle/snail/ghost/axolotl/capybara/cactus/robot/rabbit/mushroom/chonk + 旧 panda/redPanda/kungFuPanda alias 向后兼容映射到 chonk/cat/robot) · buddy.test.ts (集成测试 — 5 旧文案 byte-equal + state/wake/sleep 落盘 + theme 18 物种 + alias)。命令入口 commands.ts 内 require + feature('BUDDY') gate；subcommand 通过 head/tail 拆分支持带参 (state <name> · theme <species>)。一旦此处结构发生变化，请务必更新我，就像重新标记领地一样。
