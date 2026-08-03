# ISSUE-4：routingPresets 模型路由配置完全不可用 — 根因分析

**审查时间**：2026-07-19 21:45:00 +08:00  
**审查范围**：Panda Code v2.30.2  
**结论**：配置系统**已完整实现**，但**启动流程未集成** + **运行时未读取**，导致完全不生效

---

## 1. 配置系统架构图

```
用户配置文件 (~/.pandacc.json)
  ↓
  activeRoutingPreset: "cost-saving"
  routingPresets: { "cost-saving": {...} }
  ↓
[❌ 缺失环节] 启动时未调用 loadPresetsFromSettings()
  ↓
内存状态：_presetsRegistry = 空 Map（只有内建 4 个预设）
           _activePreset = null（或默认 "balanced"）
  ↓
模型路由决策（resolveModelTarget）
  ↓
activePreset 参数传入 null ❌
  ↓
用户配置被完全忽略
```

---

## 2. 配置定义审查

### 2.1 Schema 定义

**位置**：`src/utils/settings/types.ts:1267-1302`

```typescript
// 行 1267-1273：激活预设名称
activeRoutingPreset: z
  .string()
  .optional()
  .describe(
    'Name of the active routing preset (e.g., "quality", "cost-saving", "balanced"). ' +
      'Presets define per-agent model overrides and global capability weights.',
  ),

// 行 1274-1302：预设集合定义
routingPresets: z
  .record(
    z.string(),  // 预设名称（如 "cost-saving"）
    z.object({
      description: z.string().optional(),
      defaultModel: z.string().optional(),
      agentOverrides: z.record(z.string(), z.string()).optional(),  // agent → model 映射
      globalWeights: z.object({
        reasoning: z.number().optional(),
        costEfficiency: z.number().optional(),
        speed: z.number().optional(),
      }).optional(),
    }),
  )
  .optional()
  .describe('Custom routing presets...'),
```

**状态**：✅ Schema 定义完整且合理

---

### 2.2 配置验证逻辑

**位置**：`src/routing/configValidator.ts:144`

```typescript
// 验证 activeRoutingPreset 存在性
{
  path: 'activeRoutingPreset',
  validate: (settings) => {
    const active = settings.activeRoutingPreset
    const presets = { ...builtInPresets, ...settings.routingPresets }
    if (active && !presets[active]) {
      return `Active preset "${active}" not found in routingPresets`
    }
    return null
  },
}
```

**状态**：✅ 验证逻辑正确

---

## 3. 配置读取链路审查

### 3.1 预设管理模块

**位置**：`src/routing/presets.ts`

#### 3.1.1 内建预设

**行 11-108**：定义 4 个内建预设

```typescript
const builtInPresets: Record<string, RoutingPreset> = {
  quality: { ... },           // opus-latest 为主
  'cost-saving': { ... },     // haiku-latest 为主
  balanced: { ... },          // sonnet-latest 为主
  'multi-provider': { ... },  // 混合模式
}
```

**状态**：✅ 内建预设完整

#### 3.1.2 预设加载函数

**行 143-158**：`loadPresetsFromSettings()`

```typescript
export function loadPresetsFromSettings(
  presets: Record<string, Partial<RoutingPreset>>,
  activePresetName?: string,
): void {
  // 清空现有自定义预设
  for (const [name] of _presetsRegistry) {
    if (!builtInPresets[name]) {
      _presetsRegistry.delete(name)
    }
  }

  // 加载新预设
  for (const [name, preset] of Object.entries(presets)) {
    const merged = { ...preset }  // 合并默认值
    _presetsRegistry.set(name, merged as RoutingPreset)
  }

  // 设置激活预设
  if (activePresetName) {
    setActivePreset(activePresetName)
  }
}
```

**状态**：✅ 实现逻辑正确

#### 3.1.3 预设获取函数

**行 131-138**：`setActivePreset()`

```typescript
export function setActivePreset(name: string): boolean {
  const preset = getPreset(name)
  if (preset) {
    _activePreset = preset  // ❌ 只修改内存，不写回配置文件
    return true
  }
  return false
}
```

**问题**：✅ 读取逻辑正确，但 ⚠️ 设置后不持久化

---

### 3.2 调用点检查

#### 3.2.1 启动流程

**检查位置**：
- `src/entrypoints/init.ts` — ❌ 无 `loadPresetsFromSettings` 调用
- `src/utils/initPandaccSettings.ts` — ❌ 只初始化配置文件，未加载预设

**搜索结果**：
```bash
$ grep -r "loadPresetsFromSettings" src/
src/routing/index.ts:29:export { ... loadPresetsFromSettings } from './presets.js'
src/routing/presets.ts:143:export function loadPresetsFromSettings(
```

**结论**：`loadPresetsFromSettings` **从未被调用**

---

#### 3.2.2 模型路由决策点

**位置**：`src/utils/model/agent.ts:81`

```typescript
// 行 76-84：getAgentModel 中的路由逻辑
if (isRoutingEnabled()) {
  const taskProfile = classifyTask(...)
  const target = resolveModelTarget(
    agentDefinition,
    taskProfile,
    null,  // ❌ 硬编码传入 null，忽略用户配置
    parentModel
  )
  ...
}
```

**问题**：`activePreset` 参数**硬编码为 `null`**

---

**位置**：`src/commands/routing.ts:93-96`

```typescript
// /routing test 命令的干跑测试
const target = resolveModelTarget(
  { name: agentName, agentType: agentName },
  taskProfile,
  null,  // ❌ 同样硬编码 null
  parentModel || defaultParentModel,
)
```

**问题**：测试命令也无法验证用户配置

---

## 4. Git 历史分析

### 4.1 功能引入时间

**关键 commit**：`bf28d3009` (2026-04-07 08:55:43 +0800)

```
feat: [MR-P4-04] built-in routing presets — quality, cost-saving, balanced, multi-provider

4 presets with per-agent model overrides and global capability weights:
- quality: opus for all, triage→sonnet
- cost-saving: haiku default, architecture→sonnet
- balanced: sonnet default, architecture→opus, triage→haiku
- multi-provider: sonnet default, customizable for third-party models

Preset management: getPreset, setActivePreset, loadPresetsFromSettings
Design ref: §6.2
```

**变更内容**：
```
src/routing/index.ts   |   1 +
src/routing/presets.ts | 159 ++++++++++++++++++++
```

**分析**：
- ✅ 预设系统完整实现
- ✅ 导出了 `loadPresetsFromSettings`
- ❌ **但未集成到启动流程**

---

### 4.2 后续相关提交

**搜索结果**：
```bash
$ git log --oneline -S "routingPresets" | head -10
c26d11e5f docs: add inline comments to routing config examples
4d28894fd docs: add inline comments to routing config examples
0bd2e640d docs: update routing config docs and collapse advisor section
...
bf28d3009 feat: [MR-P4-04] built-in routing presets...
```

**分析**：
- 后续提交主要是**文档更新**
- 无功能集成相关提交
- **核心集成逻辑缺失至今**

---

## 5. 测试覆盖审查

### 5.1 单元测试搜索

```bash
$ find . -name "*.test.ts" -exec grep -l "routingPreset\|presets" {} \;
(无结果)
```

**结论**：❌ **无测试覆盖**

### 5.2 影响

- 功能缺陷未被发现
- 配置不生效无自动化验证
- 回归风险高

---

## 6. 根因总结

### 6.1 三层失效

| 环节 | 预期行为 | 实际状态 | 根因 |
|------|---------|---------|------|
| **启动加载** | `initPandaccSettings()` 后调用 `loadPresetsFromSettings()` | ❌ 从未调用 | 集成逻辑缺失 |
| **运行时读取** | `resolveModelTarget()` 传入 `getActivePreset()` | ❌ 硬编码传 `null` | 调用点未更新 |
| **持久化写回** | `/routing preset` 命令后写回配置文件 | ❌ 只修改内存 | `setActivePreset` 不持久化 |

### 6.2 根因分类

**主因**：**功能实现与系统集成脱节**

1. **开发阶段**：
   - preset 系统作为独立模块开发完成
   - 但未编写集成代码（启动加载 + 运行时应用）
   - 可能原因：
     - 分阶段开发，Phase 1 完成后未继续 Phase 2
     - 代码审查未覆盖集成测试
     - 无端到端验收流程

2. **测试阶段**：
   - ❌ 无单元测试验证加载逻辑
   - ❌ 无集成测试验证端到端流程
   - ❌ 无手动测试记录

3. **文档阶段**：
   - ✅ README 详细描述了配置方式
   - ❌ 但未标注"实验性功能"或"开发中"
   - 导致用户误以为功能已完整可用

---

## 7. 完整配置路径流程图（当前 vs 预期）

### 7.1 当前状态（失效）

```
[用户配置] ~/.pandacc.json
  ↓
  { activeRoutingPreset: "cost-saving", routingPresets: {...} }
  ↓
[配置读取] src/utils/initPandaccSettings.ts
  ↓ (读取配置到内存)
  settings object ✅
  ↓
[❌ 断点 1] 未调用 loadPresetsFromSettings(settings.routingPresets)
  ↓
[内存状态] src/routing/presets.ts
  ↓
  _presetsRegistry: Map { 4 个内建预设 }  ← 用户配置丢失
  _activePreset: null
  ↓
[模型选择] src/utils/model/agent.ts:81
  ↓
  resolveModelTarget(..., null, ...)  ← ❌ 断点 2：传入 null
  ↓
[决策逻辑] src/routing/routeResolver.ts:119
  ↓
  activePreset 参数 = null
  ↓ (跳过 Priority 4: Preset model mapping)
  使用默认逻辑（Priority 5-8）
  ↓
[结果] 用户配置的 routingPresets 完全不生效 ❌
```

---

### 7.2 预期流程（修复后）

```
[用户配置] ~/.pandacc.json
  ↓
  { activeRoutingPreset: "cost-saving", routingPresets: {...} }
  ↓
[配置读取] src/utils/initPandaccSettings.ts
  ↓
  settings object ✅
  ↓
[✅ 修复点 1] 调用 loadPresetsFromSettings()
  ↓
  import { loadPresetsFromSettings } from '../routing/presets.js'
  loadPresetsFromSettings(
    settings.routingPresets,
    settings.activeRoutingPreset
  )
  ↓
[内存状态] src/routing/presets.ts
  ↓
  _presetsRegistry: Map {
    ...builtInPresets,
    ...用户自定义预设 ✅
  }
  _activePreset: presets["cost-saving"] ✅
  ↓
[模型选择] src/utils/model/agent.ts:81
  ↓
[✅ 修复点 2] 传入 getActivePreset()
  ↓
  import { getActivePreset } from '../../routing/presets.js'
  resolveModelTarget(..., getActivePreset(), ...)
  ↓
[决策逻辑] src/routing/routeResolver.ts:119
  ↓
  activePreset 参数 = { defaultModel: "haiku-latest", ... } ✅
  ↓ (进入 Priority 4: Preset model mapping)
  检查 activePreset.agentOverrides[agentType] ✅
  ↓
[结果] 用户配置生效，模型按预设路由 ✅
```

---

## 8. 修复方案

### 方案 A：最小修复（推荐）

**目标**：让现有配置系统生效，不改变架构

#### 修复点 1：启动加载

**文件**：`src/utils/initPandaccSettings.ts`

**位置**：初始化完成后（约 90 行附近）

**修改**：
```typescript
// 在 initPandaccSettings() 函数末尾添加
import { loadPresetsFromSettings } from '../routing/presets.js'

export async function initPandaccSettings(): Promise<void> {
  // ... 现有初始化逻辑 ...
  
  // ✅ 新增：加载 routing presets
  const settings = getGlobalConfig()
  if (settings.routingPresets) {
    loadPresetsFromSettings(
      settings.routingPresets,
      settings.activeRoutingPreset
    )
  }
}
```

**风险**：低（只读操作，不修改现有逻辑）

---

#### 修复点 2：运行时应用

**文件**：`src/utils/model/agent.ts`

**位置**：第 81 行

**修改前**：
```typescript
const target = resolveModelTarget(
  agentDefinition,
  taskProfile,
  null,  // ❌ 硬编码
  parentModel
)
```

**修改后**：
```typescript
import { getActivePreset } from '../../routing/presets.js'

const target = resolveModelTarget(
  agentDefinition,
  taskProfile,
  getActivePreset(),  // ✅ 读取激活预设
  parentModel
)
```

**风险**：中（影响所有模型选择逻辑，需充分测试）

---

**文件**：`src/commands/routing.ts`

**位置**：第 96 行

**修改**：同上（替换 `null` 为 `getActivePreset()`）

---

#### 修复点 3：持久化写回（可选）

**文件**：`src/routing/presets.ts`

**位置**：第 131-138 行

**修改**：
```typescript
export function setActivePreset(name: string): boolean {
  const preset = getPreset(name)
  if (preset) {
    _activePreset = preset
    
    // ✅ 新增：写回配置文件
    const { getGlobalConfig, updateGlobalConfig } = require('../utils/settings/config.js')
    const settings = getGlobalConfig()
    updateGlobalConfig({
      ...settings,
      activeRoutingPreset: name,
    })
    
    return true
  }
  return false
}
```

**风险**：中（需确认 `updateGlobalConfig` 的副作用）

---

### 方案 B：补充测试（必需）

**新增文件**：`src/routing/presets.test.ts`

**测试用例**：
```typescript
describe('Routing Presets', () => {
  test('loadPresetsFromSettings: 加载自定义预设', () => {
    const custom = { 'my-preset': { defaultModel: 'opus-latest' } }
    loadPresetsFromSettings(custom, 'my-preset')
    
    expect(getPreset('my-preset')).toBeDefined()
    expect(getActivePreset()?.name).toBe('my-preset')
  })
  
  test('getActivePreset: 返回激活预设', () => {
    setActivePreset('cost-saving')
    expect(getActivePreset()?.name).toBe('cost-saving')
  })
  
  test('setActivePreset: 不存在的预设返回 false', () => {
    expect(setActivePreset('non-existent')).toBe(false)
  })
})
```

**新增文件**：`src/routing/integration.test.ts`

**测试用例**：
```typescript
describe('Routing Integration', () => {
  test('端到端：配置文件 → 模型选择', async () => {
    // 1. 模拟配置
    const mockSettings = {
      enableModelRouting: true,
      activeRoutingPreset: 'cost-saving',
      routingPresets: {
        'cost-saving': {
          defaultModel: 'haiku-latest',
          agentOverrides: { Explore: 'haiku-latest' }
        }
      }
    }
    
    // 2. 初始化
    loadPresetsFromSettings(
      mockSettings.routingPresets,
      mockSettings.activeRoutingPreset
    )
    
    // 3. 验证模型选择
    const model = getAgentModel({ agentType: 'Explore' }, 'parent-model')
    expect(model).toBe('haiku-latest')
  })
})
```

---

### 方案 C：文档标注（临时措施）

**如果无法立即修复代码**，至少需在 README 标注：

**位置**：`README.md:853`（routingPresets 章节开头）

**添加警告**：
```markdown
<summary>⚙️ routingPresets 模型路由配置</summary>

> ⚠️ **已知问题**（v2.30.2）  
> routingPresets 配置系统已实现，但**启动加载逻辑尚未集成**，导致用户配置不生效。  
> 追踪 Issue: [#XXXX]  
> 临时方案：使用 `/routing preset <name>` 命令手动激活（仅本次会话有效）

多模型智能路由系统...
```

---

## 9. 验证方案

### 9.1 手动测试步骤

**前置条件**：应用修复方案 A

**步骤 1：配置文件准备**
```bash
# 编辑 ~/.pandacc.json
{
  "enableModelRouting": true,
  "activeRoutingPreset": "test-preset",
  "routingPresets": {
    "test-preset": {
      "defaultModel": "haiku-latest",
      "agentOverrides": {
        "Explore": "opus-latest"
      }
    }
  }
}
```

**步骤 2：重启 Panda Code**
```bash
panda-code --restart
```

**步骤 3：验证加载**
```bash
# 在 Panda Code 中执行
/routing status

# 预期输出：
# Active Preset: test-preset
# Default Model: haiku-latest
# Agent Overrides:
#   Explore → opus-latest
```

**步骤 4：验证模型选择**
```bash
/routing test Explore "analyze this code"

# 预期输出：
# Agent: Explore
# Selected Model: opus-latest
# Reason: preset-override: test-preset
```

**步骤 5：验证日志**
```bash
# 启用 debug 日志
export DEBUG=panda:routing

# 重启并执行任务，检查日志：
# [routing] loadPresetsFromSettings: loaded 1 custom preset(s)
# [routing] setActivePreset: test-preset
# [routing] Explore: preset-override → opus-latest
```

---

### 9.2 自动化测试

**执行**：
```bash
npm test -- src/routing/presets.test.ts
npm test -- src/routing/integration.test.ts
```

**预期**：
- ✅ 所有测试通过
- ✅ 覆盖率 >80%（presets.ts）

---

## 10. 回滚方案

**如果修复后出现问题**：

### 快速回滚

**步骤 1**：注释修复代码
```typescript
// src/utils/initPandaccSettings.ts
// if (settings.routingPresets) {
//   loadPresetsFromSettings(...)
// }

// src/utils/model/agent.ts
const target = resolveModelTarget(..., null, ...)  // 恢复 null
```

**步骤 2**：重启服务

**步骤 3**：通知用户
```markdown
routingPresets 功能暂时禁用，使用默认路由逻辑。
临时方案：通过 /routing preset 命令手动设置（会话级别）。
```

---

### 降级方案

**如果运行时读取有性能问题**：

```typescript
// 缓存激活预设，避免每次调用 getActivePreset()
const _cachedActivePreset = getActivePreset()

const target = resolveModelTarget(..., _cachedActivePreset, ...)
```

---

## 11. 代码证据汇总

### 11.1 Schema 定义

**文件**：`src/utils/settings/types.ts:1267-1302`  
**状态**：✅ 完整

### 11.2 预设管理

**文件**：`src/routing/presets.ts`
- ✅ 行 11-108：内建预设定义
- ✅ 行 143-158：`loadPresetsFromSettings()` 实现
- ⚠️ 行 131-138：`setActivePreset()` 不持久化

### 11.3 调用点

**文件**：`src/utils/model/agent.ts:81`
- ❌ 硬编码 `null`

**文件**：`src/commands/routing.ts:93`
- ❌ 硬编码 `null`

### 11.4 启动流程

**文件**：`src/entrypoints/init.ts`
- ❌ 无 `loadPresetsFromSettings` 调用

**文件**：`src/utils/initPandaccSettings.ts`
- ❌ 无预设加载逻辑

---

## 12. 推荐方案与优先级

### 立即执行（P0）

1. **方案 A：最小修复**
   - 修复点 1：启动加载（2 小时）
   - 修复点 2：运行时应用（1 小时）
   - 成本：3 小时

2. **方案 B：补充测试**
   - 单元测试（2 小时）
   - 集成测试（2 小时）
   - 成本：4 小时

**总成本**：1 个工作日

---

### 后续优化（P1）

3. **修复点 3：持久化写回**（1 小时）
4. **性能优化**：缓存激活预设（30 分钟）
5. **文档更新**：补充端到端示例（1 小时）

---

### 如无法立即修复（临时）

**方案 C：文档标注**（15 分钟）

在 README 标注已知问题 + 临时方案。

---

## 13. 风险评估

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|---------|
| 修复后性能下降 | 中 | 低 | 缓存激活预设，避免重复读取 |
| 与现有逻辑冲突 | 高 | 中 | 充分测试 Priority 1-8 决策链路 |
| 配置验证不足 | 中 | 中 | 补充 schema 校验错误提示 |
| 用户配置格式错误 | 低 | 高 | 在加载时捕获异常并降级到内建预设 |

---

## 14. 下一步行动清单

- [ ] 执行修复方案 A（3 小时）
  - [ ] 修改 `src/utils/initPandaccSettings.ts`
  - [ ] 修改 `src/utils/model/agent.ts`
  - [ ] 修改 `src/commands/routing.ts`
- [ ] 编写测试（4 小时）
  - [ ] `src/routing/presets.test.ts`
  - [ ] `src/routing/integration.test.ts`
- [ ] 手动验证（1 小时）
  - [ ] 配置加载验证
  - [ ] 模型选择验证
  - [ ] 日志验证
- [ ] 文档更新（1 小时）
  - [ ] README 补充验证步骤
  - [ ] CHANGELOG 记录修复
- [ ] 提交代码
  - [ ] commit 标签：`[FIX] routingPresets integration`
  - [ ] PR 包含测试结果截图

**预计完成时间**：1.5 个工作日

---

**报告结束**  
**下一步**：按优先级执行修复方案 A + B。
