# 工具调用系统回归审查 - 执行摘要

**审查时间**：2026-08-03 深夜  
**审查范围**：2026-08-02至今的所有commit  
**结论**：✅ 无系统级回归

---

## 核心发现

### 1. 工具调用系统完好
**结论**：今天的commit未破坏工具调用系统。

**验证证据**：
- ✅ Write工具定义稳定（最近20个commit无修改）
- ✅ 工具schema完整（file_path + content，无"raw"参数）
- ✅ 工具注册逻辑未被触及
- ✅ 今天的commit都是UI/文档相关

### 2. 真实问题：特定agent的上下文污染
**shifu调研agent格式错误**是个例，不是系统性问题。

**特征**：
- 长时间运行：34分钟
- 上下文累积：23,488 tokens
- 缓存重建：109次
- 格式幻觉：错误地使用不存在的"raw"参数
- 错误次数：17次（无法自我修正）

**根因**：工具schema在长上下文运行后被推到远端，agent开始依赖近期的错误示例，导致格式模板污染。

### 3. 回滚操作的副作用
**Commit 97c67bb**回滚了subagent输出修复，删除了`onMessageYield`机制。

**影响**：
- ❌ 子agent详情窗口变成"黑箱"（无法实时显示工具调用）
- ✅ 工具调用本身仍正常执行
- 用户体验下降，但功能未破坏

---

## 今天的Commit时间线

```
f641d63  2026-08-02 23:52  Revert debug logging (UI)
b7e1b80  2026-08-02 23:51  Add debug logging (UI)
4a656ab  2026-08-02 22:58  Fix UI blank screen
cc00ca5  2026-08-02 22:55  Fix message access path (UI)
97c67bb  2026-08-02 21:21  Revert subagent output fix ⚠️
9fd90cf  2026-08-02 21:17  Docs: close outstanding items
9b38555  2026-08-02 21:16  Docs: OMP research
299694a  2026-08-02 20:06  Fix subagent output blackbox (被回滚)
```

**关键观察**：
- 所有commit都是UI/文档相关
- 两个回滚操作都未触及工具调用系统
- 无任何commit修改工具定义或schema

---

## 错误对比

### ❌ Agent使用的错误格式
```json
{
  "name": "Write",
  "input": {
    "raw": "{\"file_path\": \"/path/to/file\""
  }
}
```

**错误**：
1. 使用不存在的"raw"参数
2. 将参数JSON序列化为字符串
3. 缺少必需的"file_path"和"content"参数

### ✅ 正确格式（系统定义）
```json
{
  "name": "Write",
  "input": {
    "file_path": "/path/to/file",
    "content": "file content here"
  }
}
```

**来源**：`src/tools/FileWriteTool/FileWriteTool.ts` 第46-49行

---

## 立即行动

### 修复shifu agent（5分钟）
1. 终止当前agent (agent-a0fe5feae01b85048)
2. 启动新agent，任务prompt包含明确格式规范
3. 监控工具调用成功率

详见：`analysis-reports/TOOL-CALL-FORMAT-FIX.md`

### 可选：恢复onMessageYield机制
```bash
# 如果没有明确的回滚理由
git revert 97c67bb
git commit -m "Restore onMessageYield mechanism for subagent output visibility"
```

**好处**：恢复子agent详情窗口的实时显示  
**风险**：需确认原commit 299694a无其他副作用

---

## 预防措施

### 短期（本周）
1. ✅ 限制agent运行时长 ≤15分钟
2. ✅ 任务prompt包含工具格式规范
3. ✅ 添加重复错误检测（≥3次触发告警）

### 长期（下月）
1. Agent健康度监控系统
2. 智能上下文压缩（保留schema，清理失败记录）
3. 自动干预机制（错误循环时自动重置）

---

## 统计数据

### Commit统计
| 类型 | 数量 |
|------|------|
| UI修复 | 4 |
| 文档 | 3 |
| Subagent输出（已回滚） | 2 |
| **工具调用系统修改** | **0** |

### shifu Agent错误统计
| 指标 | 数值 |
|------|------|
| 错误次数 | 17 |
| 上下文大小 | 23,488 tokens |
| 运行时长 | 34分钟 |
| 首次错误 | 启动后26分钟 |

---

## 结论

**这不是今天commit导致的系统回归。**

真实情况：
1. **工具调用系统稳定** — 无任何破坏性改动
2. **问题是特定agent的上下文污染** — 长时间运行导致格式幻觉
3. **回滚操作影响可见性，但不影响功能** — onMessageYield删除导致UI黑箱

**核心矛盾**：Agent需要长时间运行以完成复杂任务，但长时间运行会导致格式模板污染。

**解决方向**：
1. 立即：终止当前agent，重启并强化格式指引
2. 短期：限制运行时长，添加错误检测
3. 长期：构建健康监控，自动干预，智能压缩

---

## 相关文档

1. **完整诊断报告**（本次审查）  
   `/Users/panda/Downloads/cc-panda/analysis-reports/REGRESSION-DIAGNOSIS-20260803.md`

2. **shifu agent格式错误详细分析**  
   `/Users/panda/Downloads/cc-panda/analysis-reports/TOOL-CALL-FORMAT-DIAGNOSIS.md`

3. **修复方案**  
   `/Users/panda/Downloads/cc-panda/analysis-reports/TOOL-CALL-FORMAT-FIX.md`

---

**审查完成时间**：2026-08-03 深夜  
**审查agent**：系统审查agent  
**下一步**：执行 TOOL-CALL-FORMAT-FIX.md 中的立即方案
