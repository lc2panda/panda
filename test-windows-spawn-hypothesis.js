// 测试假设：resolveWindowsCommand 破坏了 cross-spawn 的自动机制

import spawn from 'cross-spawn'

console.log('=== Windows Spawn 测试 ===\n')

// 测试 1: 传递原始命令（Cline 方式）
console.log('测试 1: spawn("uvx", ["--version"])')
const proc1 = spawn('uvx', ['--version'], { stdio: 'pipe' })

proc1.on('error', (err) => {
  console.log('❌ 测试 1 失败:', err.code, err.message)
})

proc1.on('spawn', () => {
  console.log('✅ 测试 1 成功: uvx 启动')
})

proc1.stdout?.on('data', (data) => {
  console.log('输出:', data.toString().trim())
})

// 测试 2: 传递 .cmd 后缀（Panda 方式）
setTimeout(() => {
  console.log('\n测试 2: spawn("uvx.cmd", ["--version"])')
  const proc2 = spawn('uvx.cmd', ['--version'], { stdio: 'pipe' })

  proc2.on('error', (err) => {
    console.log('❌ 测试 2 失败:', err.code, err.message)
  })

  proc2.on('spawn', () => {
    console.log('✅ 测试 2 成功: uvx.cmd 启动')
  })

  proc2.stdout?.on('data', (data) => {
    console.log('输出:', data.toString().trim())
  })
}, 1000)

// 测试 3: 查看 cross-spawn 是否自动添加 cmd.exe 包装
setTimeout(() => {
  console.log('\n测试 3: 观察 cross-spawn 内部行为')
  console.log('process.platform:', process.platform)
  console.log('process.env.PATHEXT:', process.env.PATHEXT)
}, 2000)

// 清理
setTimeout(() => {
  proc1.kill()
  process.exit(0)
}, 3000)
