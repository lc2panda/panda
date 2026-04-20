// Input:  panda --install-desk CLI flag（args 已被 cli.tsx 拦截）
// Output: 调 src/desk/installer.installPandaOnDeskDeps，向 stderr 打印进度
//         （开始 / 完成 / 失败），exit code: 成功 0 / 失败 1
// Pos:    panda CLI fast-path handler — 用户首次启动桌面宠物显式入口；
//         与 launcher.ts 的 friendly hint 配套（hint 引导用户跑此命令）
//         严守 anthropic byte-equal — 仅 node 内置 + 自家 desk/installer
//
// [NEW-FILE:#20260419-W4-02]
// 2026-04-20 08:13 +08:00 W4-T1 panda --install-desk handler

import {
  installPandaOnDeskDeps,
  checkElectronInstalled,
} from '../../desk/installer.js'

// ─────────────────────────────────────────────────────────────────────────────
// 公共 API — runDeskInstall
//
// 进度提示走 stderr（让 stdout 保持干净，便于 `panda --install-desk | cat` 等）
// 返回 0/1 给 cli.tsx 用 process.exit(code)
// ─────────────────────────────────────────────────────────────────────────────

export async function runDeskInstall(): Promise<number> {
  const write = (s: string) => process.stderr.write(s + '\n')

  // 友好头：让用户知道大概要等多久（80MB 下载约 30s~5min）
  write('🐼 panda 桌面宠物 — 依赖安装')
  write('   预计 30s ~ 5min（首次需下载 electron ~80MB）')
  write('   按 Ctrl+C 可随时中止')

  // pre-check：已装直接 short-circuit + 提示用户
  if (checkElectronInstalled()) {
    write('✅ electron 已安装，无需重复操作')
    write('   启动桌面宠物：panda（带 TTY 时自动拉起）')
    return 0
  }

  let lastDot = Date.now()
  const result = await installPandaOnDeskDeps({
    onLog: (line) => {
      // 节流 — npm 输出可能爆量，只透传含关键字的行；其余打省略号防卡顿错觉
      if (
        /error|warn|added|removed|ENOENT|EACCES|EPERM|EAI_AGAIN|npm ERR|npm WARN/i.test(
          line,
        )
      ) {
        write('   ' + line)
        lastDot = Date.now()
        return
      }
      const now = Date.now()
      if (now - lastDot > 2000) {
        process.stderr.write('.')
        lastDot = now
      }
    },
  })

  // 收尾换行（防 '...' 紧贴下一行）
  process.stderr.write('\n')

  if (result.ok) {
    write('✅ ' + result.message)
    if (result.alreadyInstalled) {
      write('   启动桌面宠物：panda')
    } else {
      write('🎮 现在跑 `panda` 即可看到桌面宠物 ✨')
    }
    return 0
  }

  write('❌ 安装失败：' + result.message)
  write('   常见排查：')
  write('   - 网络：确认能访问 registry.npmjs.org（或设置 HTTPS_PROXY）')
  write('   - 权限：global install 需要 sudo 或调整 ~/.npmrc prefix')
  write('   - 磁盘：electron 需要 ~250MB 可用空间')
  write('   - 重试：再次运行 panda --install-desk')
  return 1
}
