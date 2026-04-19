// Input: launch.cjs spawn → electron 启动
// Output: 一个空透明 BrowserWindow（验证 Electron 起得来）
// Pos: panda-on-desk 入口，未来扩展为完整 main 进程
//
// [NEW-FILE:#20260419-P1-03]

import { app, BrowserWindow } from 'electron'

function createWindow() {
  const win = new BrowserWindow({
    width: 200,
    height: 200,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    webPreferences: { nodeIntegration: false, contextIsolation: true },
  })
  win.loadURL(
    'data:text/html,<body style="margin:0;background:rgba(0,0,0,0.5);color:white;font-family:monospace"><h1 style="text-align:center;margin:50px">panda v0.1</h1></body>'
  )
}

app.on('ready', createWindow)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
