// Extracted from dream.ts so auto-dream ships independently of KAIROS
// feature flags (dream.ts is behind a feature()-gated require).

import { join } from 'path'
import { existsSync, readFileSync, readdirSync } from 'fs'

import {
  DIR_EXISTS_GUIDANCE,
  ENTRYPOINT_NAME,
  MAX_ENTRYPOINT_LINES,
} from '../../memdir/memdir.js'

export function buildConsolidationPrompt(
  memoryRoot: string,
  transcriptDir: string,
  extra: string,
): string {
  let habitsSection = ''
  let prospectiveSection = ''

  // 读取行为习惯
  try {
    const habitsPath = join(memoryRoot, 'procedural', 'habits.md')
    if (existsSync(habitsPath)) {
      const habits = readFileSync(habitsPath, 'utf-8').slice(0, 500)
      habitsSection = '\n\n## Behavioral Patterns\n' + habits
    }
  } catch {}

  // 读取前瞻记忆
  try {
    const prospDir = join(memoryRoot, 'dreams', 'prospective')
    if (existsSync(prospDir)) {
      const files = readdirSync(prospDir).filter(f => f.endsWith('.md')).sort().reverse()
      if (files.length > 0) {
        const prosp = readFileSync(join(prospDir, files[0]), 'utf-8').slice(0, 500)
        prospectiveSection = '\n\n## Upcoming Events\n' + prosp
      }
    }
  } catch {}

  return `# Dream: Memory Consolidation

You are performing a dream — a reflective pass over your memory files. Synthesize what you've learned recently into durable, well-organized memories so that future sessions can orient quickly.

**Privacy Rule:** Any content wrapped in \`<!-- private -->...<!-- /private -->\` or \`<private>...</private>\` tags must NOT be extracted, consolidated, or referenced as memory. Skip those sections entirely.

Memory directory: \`${memoryRoot}\`
${DIR_EXISTS_GUIDANCE}

Session transcripts: \`${transcriptDir}\` (large JSONL files — grep narrowly, don't read whole files)

---

## Phase 1 — Orient

- \`ls\` the memory directory to see what already exists
- Read \`${ENTRYPOINT_NAME}\` to understand the current index
- Skim existing topic files so you improve them rather than creating duplicates
- If \`logs/\` or \`sessions/\` subdirectories exist (assistant-mode layout), review recent entries there

## Phase 2 — Gather recent signal

Look for new information worth persisting. Sources in rough priority order:

1. **Daily logs** (\`logs/YYYY/MM/YYYY-MM-DD.md\`) if present — these are the append-only stream
2. **Existing memories that drifted** — facts that contradict something you see in the codebase now
3. **Transcript search** — if you need specific context (e.g., "what was the error message from yesterday's build failure?"), grep the JSONL transcripts for narrow terms:
   \`grep -rn "<narrow term>" ${transcriptDir}/ --include="*.jsonl" | tail -50\`

Don't exhaustively read transcripts. Look only for things you already suspect matter.

## Phase 3 — Consolidate

For each thing worth remembering, write or update a memory file at the top level of the memory directory. Use the memory file format and type conventions from your system prompt's auto-memory section — it's the source of truth for what to save, how to structure it, and what NOT to save.

Focus on:
- Merging new signal into existing topic files rather than creating near-duplicates
- Converting relative dates ("yesterday", "last week") to absolute dates so they remain interpretable after time passes
- Deleting contradicted facts — if today's investigation disproves an old memory, fix it at the source

### Phase 3 Enhanced: 跨记忆层整合

在整合时，注意以下跨层关联：
- 如果多个 episodic 记忆指向同一主题 → 提炼为 1 条 semantic 记忆
- 如果 episodic 记忆包含重复行为模式 → 提炼为 procedural/habits 更新
- 如果 emotional 事件与某个决策记忆关联 → 在 semantic 记忆中标注情感标签
- 如果 prospective 事件即将到来 → 在晨间简报中优先展示

## Phase 3 — 语义记忆提取

从最近的 episodic 记忆和对话中，提取并更新 semantic/profile.md 的以下 section:

### 技术栈偏好
- 从工具使用频率推断（Edit > Bash = 偏好精确编辑；Bash > Edit = 偏好脚本化）
- 从对话中提到的框架/语言/工具记录

### 工作模式
- 活跃时段（从 episodic 时间戳推断）
- 偏好的交互方式（简洁指令 vs 详细讨论）
- 单任务专注 vs 多任务切换

### 当前目标与项目
- 从最近 3 天的 episodic 提取主要话题
- 识别正在进行的项目名称和目标

### 沟通风格
- 中文/英文/混合偏好
- 期望的回复详细程度

使用 Edit 工具直接更新 profile.md 的对应 section。

## Phase 3.5 — Emotional memory

Scan for emotionally salient moments: frustration spikes, breakthroughs, repeated user corrections, or praise. These signals reveal what matters most to the user beyond raw facts. Persist a brief emotional-context note alongside the relevant topic file (e.g., "user was frustrated by X — avoid suggesting Y in future").

## Phase 3 附加 — 程序记忆整合

扫描 procedural/patterns/ 和 procedural/scars/ 目录：
- 如果同一工具链模式在 patterns/ 中出现 3+ 次 → 提炼为稳定规则，追加到 habits.md
- 如果同一错误在 scars/ 中出现 2+ 次 → 提炼为避坑指南，写入 scars/summary.md
- 整合完成后，可以删除已提炼的单条 pattern/scar 文件（保持目录整洁）

## Phase 4 — Prune and index

Update \`${ENTRYPOINT_NAME}\` so it stays under ${MAX_ENTRYPOINT_LINES} lines AND under ~25KB. It's an **index**, not a dump — each entry should be one line under ~150 characters: \`- [Title](file.md) — one-line hook\`. Never write memory content directly into it.

- Remove pointers to memories that are now stale, wrong, or superseded
- Demote verbose entries: if an index line is over ~200 chars, it's carrying content that belongs in the topic file — shorten the line, move the detail
- Add pointers to newly important memories
- Resolve contradictions — if two files disagree, fix the wrong one

### Phase 4 Enhanced: 智能记忆管理

在完成记忆修剪后，对每条 strength < 0.5 的记忆进行价值评估：

#### 评估维度
1. **项目相关性**: 是否与用户当前活跃项目直接相关？
2. **经验价值**: 是否包含可复用的模式、教训、或最佳实践？
3. **情感锚点**: 是否关联重要的情感事件（突破、挫折、里程碑）？
4. **时效性**: 是否有明确的时间窗口后将失去价值？

#### 输出格式（必须严格遵守）
在报告末尾，用以下格式输出记忆管理指令：

\`\`\`memory-actions
KEEP: [文件名] — [保留理由，10字以内]
ARCHIVE: [文件名] — [归档理由]
EXTRACT: [文件名] → patterns/[新文件名] — [提取的模式描述]
STRENGTHEN: [文件名] +0.2 — [强化理由]
WEAKEN: [文件名] -0.3 — [弱化理由]
\`\`\`

#### 决策规则
- 与活跃项目相关 → KEEP 或 STRENGTHEN
- 包含通用经验 → EXTRACT 到 patterns/
- 有情感价值 → KEEP，标记 important: true
- 超过 30 天未访问且无以上价值 → ARCHIVE
- 事实性信息已过时 → WEAKEN
- 每次整合最多 ARCHIVE 5 条记忆（防止过度清理）

---

Return a brief summary of what you consolidated, updated, or pruned. If nothing changed (memories are already tight), say so.

在整合完成后，请明确指出：
1. 哪些记忆应强化（列出文件名和建议 strength 增量）
2. 哪些记忆可归档（超过 30 天未访问且 strength < 0.3）
3. 哪些新知识应提取到 semantic/ 目录${habitsSection}${prospectiveSection}${extra ? `\n\n## Additional context\n\n${extra}` : ''}`
}
