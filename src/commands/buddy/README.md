# src/commands/buddy — /buddy 9 子命令

文件清单：index.ts (single-file 实现 9 子命令：show/hide/mute/unmute/info/state/wake/sleep/theme) · buddy.test.ts (集成测试 24 用例 — 5 旧文案 byte-equal + 4 新落盘 + argumentHint 守护)。命令入口 commands.ts 内 require + feature('BUDDY') gate；subcommand 通过 head/tail 拆分支持带参 (state <name> · theme <species>)。一旦此处结构发生变化，请务必更新我，就像重新标记领地一样。
