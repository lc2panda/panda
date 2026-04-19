// Input:  panda CLI 侧 src/desk/types.ts
// Output: 同源协议 schema — panda-on-desk 直接 re-export 保证 byte-equal
// Pos:    packages/panda-on-desk/src/bridge/server.ts 引用本文件
//         严守 anthropic byte-equal — 仅类型定义，无运行时
//
// [NEW-FILE:#20260419-P1-07]

// 直接相对路径 re-export 跨子包 — 避免 path alias 把根 src 拉进 tsc include
// （监督任务约束：不引入 panda 根 package.json 新依赖；alias 跨包会扩散编译范围）
// eslint-disable-next-line import/no-relative-parent-imports
export * from '../../../../src/desk/types.js'
