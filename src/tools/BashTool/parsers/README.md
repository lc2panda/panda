# parsers/

命令输出智能解析器（B10）。

**文件列表：**
- `index.ts` — 解析器注册表与格式化输出（ParsedOutput 类型定义）
- `git.ts` — Git 命令解析器（status/diff --stat/log --oneline）
- `test.ts` — 测试运行器解析器（Jest/Vitest/Pytest/Go test）
- `build.ts` — 构建输出解析器（tsc/Webpack/Vite/esbuild）

**地位：** outputCompressor Layer 1.5 增强层

**功能：** 将命令输出结构化解析为 summary/details/errors/warnings/stats，供压缩器生成更精准的摘要。

*"一旦这里的结构发生变化，请务必更新我... 就像重新标记领地一样。"*
