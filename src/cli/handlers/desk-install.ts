// Input:  panda --install-desk CLI flag（args 已被 cli.tsx 拦截）
// Output: 调 src/desk/installer.installPandaOnDeskDeps，向 stderr 渲染
//         spinner + percentage + ETA + 阶段标签 + 失败分类排查 hint
//         exit code: 成功 0 / 失败 1
// Pos:    panda CLI fast-path handler — 用户首次启动桌面宠物显式入口；
//         与 launcher.ts 的 friendly hint 配套（hint 引导用户跑此命令）
//         严守 anthropic byte-equal — 仅 node 内置 + 自家 desk/installer
//
// [NEW-FILE:#20260419-W4-02]
// 2026-04-20 08:13 +08:00 W4-T1 panda --install-desk handler
// 2026-04-20 16:05 +08:00 W23-T1 install UX — spinner + % + ETA + 失败分类 hint

import {
  installPandaOnDeskDeps,
  checkElectronInstalled,
  type InstallErrorKind,
  type InstallProgressEvent,
} from '../../desk/installer.js'

// ─────────────────────────────────────────────────────────────────────────────
// 内部 — spinner 帧 / TTY 检测
// ─────────────────────────────────────────────────────────────────────────────

const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']

/** TTY 检测；非 TTY（CI / 管道）下回退为换行式打印，避免 \r 卡住日志 */
function isTty(): boolean {
  return Boolean(process.stderr.isTTY)
}

/** 渲染单帧到 stderr（TTY 走 \r 覆盖，非 TTY 走 newline） */
function renderProgress(params: {
  spinnerFrame: string
  phaseLabel: string
  percent: number
  etaSeconds: number
  elapsedSeconds: number
}): void {
  const { spinnerFrame, phaseLabel, percent, etaSeconds, elapsedSeconds } =
    params
  const pctStr = percent > 0 ? `${percent.toFixed(0)}%`.padStart(4) : '  --'
  const etaStr =
    etaSeconds >= 0 ? `ETA ${etaSeconds}s` : `已用 ${elapsedSeconds.toFixed(0)}s`
  const line = `${spinnerFrame} [${pctStr}] ${phaseLabel} · ${etaStr}`
  if (isTty()) {
    // 行内覆盖：\r 回到行首 + 重写 + clear-to-eol
    process.stderr.write(`\r\u001b[2K${line}`)
  } else {
    process.stderr.write(line + '\n')
  }
}

/** 清掉 spinner 当前行（结束时调用，避免和后续 write 重叠） */
function clearProgressLine(): void {
  if (isTty()) {
    process.stderr.write('\r\u001b[2K')
  }
}

/**
 * 失败类型 → 友好排查 hint 行数组（CLI handler 输出到 stderr）
 *
 * timeout: 网络慢或卡顿；提示扩 timeout、检查带宽
 * network (ECONNREFUSED / ENOTFOUND): 提示设代理 HTTPS_PROXY
 * permission (EACCES): 提示 sudo / 调整 npm prefix
 * verify: electron 装好但 require 失败；提示 reinstall
 * unknown: 通用排查
 */
export function __getHintsForErrorKindForTesting(
  kind: InstallErrorKind | undefined,
): string[] {
  switch (kind) {
    case 'timeout':
      return [
        '   原因：网络较慢，超时触发（已自动重试 1 次仍失败）',
        '   建议：1) 切到更快网络 / 关闭 VPN',
        '         2) 设 PANDA_DESK_INSTALL_TIMEOUT_MS=3600000（1h）后重试',
        '         3) 设代理：export HTTPS_PROXY=http://127.0.0.1:7890',
      ]
    case 'network':
      return [
        '   原因：连接 npm registry 失败（ECONNREFUSED / ENOTFOUND / 代理错误）',
        '   建议：1) 检查能访问 https://registry.npmjs.org',
        '         2) 设代理：export HTTPS_PROXY=http://你的代理:port',
        '              （Windows: set HTTPS_PROXY=http://你的代理:port）',
        '         3) 切换 registry：npm config set registry https://registry.npmmirror.com',
      ]
    case 'permission':
      return [
        '   原因：写入 node_modules 权限不足（EACCES / EPERM）',
        '   建议：1) Linux/Mac：sudo panda --install-desk',
        '         2) 调整 npm prefix 到用户目录：npm config set prefix ~/.npm-global',
        '         3) Windows：以管理员身份运行终端',
      ]
    case 'verify':
      return [
        '   原因：依赖装好但 electron 自检失败（require 抛错）',
        '   建议：1) 删除残留：rm -rf packages/panda-on-desk/node_modules/electron',
        '         2) 重装：panda --install-desk',
        '         3) 若反复失败，检查 OS arch（Apple Silicon 需 electron@41 darwin-arm64）',
      ]
    case 'unknown':
    default:
      return [
        '   常见排查：',
        '   - 网络：确认能访问 registry.npmjs.org（或设置 HTTPS_PROXY）',
        '   - 权限：global install 需要 sudo 或调整 ~/.npmrc prefix',
        '   - 磁盘：electron 需要 ~250MB 可用空间',
        '   - 重试：再次运行 panda --install-desk',
      ]
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 公共 API — runDeskInstall
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

  // ─── 进度状态机 ───────────────────────────────────────────
  const startedAt = Date.now()
  let lastPhase: InstallProgressEvent['phase'] = 'start'
  let lastLabel = '准备中'
  let lastPercent = 0
  let lastEta = -1
  let frameIdx = 0

  // TTY 模式下定时刷帧（让 spinner 转动），非 TTY 仅在 phase 变化时打印
  const spinnerTimer = isTty()
    ? setInterval(() => {
        frameIdx = (frameIdx + 1) % SPINNER_FRAMES.length
        renderProgress({
          spinnerFrame: SPINNER_FRAMES[frameIdx],
          phaseLabel: lastLabel,
          percent: lastPercent,
          etaSeconds: lastEta,
          elapsedSeconds: (Date.now() - startedAt) / 1000,
        })
      }, 120)
    : null

  const result = await installPandaOnDeskDeps({
    onLog: (line) => {
      // 关键日志（error / warn / npm ERR）保留多行打印，让用户看到根因
      if (
        /error|warn|ENOENT|EACCES|EPERM|EAI_AGAIN|ECONNREFUSED|ECONNRESET|npm ERR|npm WARN/i.test(
          line,
        )
      ) {
        clearProgressLine()
        write('   ' + line)
      }
      // 其余非关键行交给 onProgress 转 spinner 渲染（节流由 spinnerTimer 控制）
    },
    onProgress: (event) => {
      lastPhase = event.phase
      lastLabel = event.label
      lastPercent = event.percent
      lastEta = event.etaSeconds
      // 非 TTY：phase 变化时立即打印一行
      if (!isTty() && (event.phase !== lastPhase || event.percent === 100)) {
        renderProgress({
          spinnerFrame: '·',
          phaseLabel: event.label,
          percent: event.percent,
          etaSeconds: event.etaSeconds,
          elapsedSeconds: (Date.now() - startedAt) / 1000,
        })
      }
    },
  })

  // 收尾：停 spinner + 清行
  if (spinnerTimer) clearInterval(spinnerTimer)
  clearProgressLine()
  process.stderr.write('\n')

  if (result.ok) {
    const verifyHint =
      result.verifyStatus === 'pass'
        ? '（自检通过 ✓）'
        : result.verifyStatus === 'skipped'
          ? '（自检跳过）'
          : ''
    write('✅ ' + result.message + ' ' + verifyHint)
    if (result.retried && result.retried > 0) {
      write(`   （经 ${result.retried} 次自动重试后成功）`)
    }
    if (result.alreadyInstalled) {
      write('   启动桌面宠物：panda')
    } else {
      write('🎮 现在跑 `panda` 即可看到桌面宠物 ✨')
    }
    return 0
  }

  write('❌ 安装失败：' + result.message)
  if (result.retried && result.retried > 0) {
    write(`   （已自动重试 ${result.retried} 次仍失败）`)
  }
  for (const hint of __getHintsForErrorKindForTesting(result.errorKind)) {
    write(hint)
  }
  return 1
}
