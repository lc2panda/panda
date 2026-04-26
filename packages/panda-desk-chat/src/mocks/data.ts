// Mocks 已全部下线 —— PdAgentTeams / PdLearningAssistant / PdScheduledTasks / PdSessionControls /
// PdToolInspection / PdConnectors / PdPatternsScars / PdMemoryBank 全部走真实 panda IPC。
//
// 历史 mock 字段（mockTeam / mockScheduledTasks / mockToolInspection / mockSessions / mockTranscript /
// mockPermissionModes / mockModels / mockEffortLevels / mockNewTaskDefaults / mockStatusBar /
// mockActiveMessages）一律不再返回；任何「杜撰」调试展示数据通通禁止。
//
// PdSessionControls / PdToolInspection 已恢复（Comdr cc-haha 路线 A），但只接真实数据：
//   PdSessionControls   ← settingsStore + sessionStore + chatStore + bridge.dispatchSessionControl
//                          （/fork、/branch、/resume slash 注入活会话）
//   PdToolInspection    ← bridge.listRecentAudit / filterAudit / getAuditStats
//                          （反向读 ~/.pandacc/audit.jsonl — panda CLI src/utils/auditLog.ts 写入端）
//   PdConnectors        ← bridge.getConnectorsSnapshot / toggleConnector
//                          （~/.pandacc/config/connectors.json — 真实 6 platform：feishu/dingtalk/slack/
//                            telegram/wechat/teams；不展示 calendar/email/notifications，panda CLI 当前未实现）
//   PdPatternsScars     ← bridge.listMemdirProjects / listMemdirLayer / readMemdirFile
//                          （~/.pandacc/projects/<sanitize-cwd>/memory/{patterns,scars}/）
//   PdMemoryBank        ← 同上，5 layer 浏览（working / episodes / semantic / procedural / dreams）
//
// PdNewTaskModal pages/ 版本（cc-haha pixel-perfect prototype）保持删除状态：
//   - 真实使用：components/tasks/PdNewTaskModal.tsx（已接 taskStore.createTask + bridge.createScheduledTask）
//   - pages/PdNewTaskModal.tsx 是 cc-haha 用 mockNewTaskDefaults 的占位稿 —— 无路由引用 ⇒ 不恢复
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。
export {};
