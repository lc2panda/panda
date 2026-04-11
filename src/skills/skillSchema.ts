// Input: skill metadata (trust level + required env vars) for runtime validation
// Output: validators for skill activation — environment check + trust policy
// Pos: Hermes Skill Schema 扩展 — 安全边界设计 (P1-4)
//
// 背景：
//   Hermes Skill YAML 完整 schema 包含 `metadata.hermes.trust` 与
//   `required_environment_variables` 两个安全字段，panda 简化版缺失。
//   本模块以独立的 SKILL_TRUST_REGISTRY 映射方式注入运行时校验，
//   避免大范围修改 Command 类型。Command 类型上也新增了可选的
//   `trustMetadata` 字段用于将来的 user-installed / community skills。
//
// 设计决策：
//   - 为什么不强制每个 bundled skill 显式声明 trust？
//     26 个内置 skill 默认 'builtin'，在 getSkillTrustMetadata() 中统一兜底，
//     不需要改每个 .ts 文件（最小入侵）。
//   - 为什么使用外部 registry 映射而不是直接写进 registerBundledSkill？
//     Agent U 正在修改 registry.ts/bundledSkills 的消费方，并行避让；
//     独立 registry 文件也利于将来扩展 user-installed skill 的 schema 校验。

/**
 * Skill 信任等级。
 * - builtin: 内置于 panda 二进制，无额外限制
 * - official: 官方发布的远程 skill，默认信任
 * - trusted: 用户显式信任的第三方 skill
 * - community: 社区来源，建议审查后频繁使用
 */
export type SkillTrustLevel = 'builtin' | 'official' | 'trusted' | 'community'

/**
 * Skill 信任 / 环境依赖元数据。
 */
export interface SkillTrustMetadata {
  /** 信任等级。未声明时默认 'builtin' (见 getSkillTrustMetadata)。 */
  trust?: SkillTrustLevel
  /**
   * Skill 激活前必须设置的环境变量名列表。
   * 缺失任一变量时 validateSkillEnvironment 返回 valid: false。
   */
  requiredEnvironmentVariables?: string[]
}

/**
 * 外部覆盖 registry — 以 skill 名为 key。
 * 当前为空：所有 bundled skills 走默认 'builtin' + 无 env 要求。
 * 未来 user-installed / remote canonical skills 可以通过 setSkillTrustMetadata()
 * 注入运行时 metadata。
 */
const SKILL_TRUST_REGISTRY: Map<string, SkillTrustMetadata> = new Map()

/**
 * 注入一个 skill 的信任元数据（测试用途 / 动态加载的 skill）。
 */
export function setSkillTrustMetadata(
  name: string,
  metadata: SkillTrustMetadata,
): void {
  SKILL_TRUST_REGISTRY.set(name, metadata)
}

/**
 * 清空 registry — 仅供测试使用。
 */
export function clearSkillTrustRegistry(): void {
  SKILL_TRUST_REGISTRY.clear()
}

/**
 * 读取一个 skill 的信任元数据。
 * 查找顺序：
 *   1) Command 对象自带的 trustMetadata 字段（显式声明优先）
 *   2) 外部 SKILL_TRUST_REGISTRY 映射
 *   3) 兜底默认：trust='builtin', 无 env 要求
 */
export function getSkillTrustMetadata(skill: {
  name?: string
  trustMetadata?: SkillTrustMetadata
}): SkillTrustMetadata {
  if (skill.trustMetadata) return skill.trustMetadata
  if (skill.name) {
    const entry = SKILL_TRUST_REGISTRY.get(skill.name)
    if (entry) return entry
  }
  return { trust: 'builtin' }
}

export interface EnvironmentValidationResult {
  valid: boolean
  missing: string[]
}

/**
 * 校验 skill 所需的环境变量是否齐备。
 * 对 bundled skills 无声明 → 永远 valid: true。
 */
export function validateSkillEnvironment(skill: {
  name?: string
  trustMetadata?: SkillTrustMetadata
}): EnvironmentValidationResult {
  const meta = getSkillTrustMetadata(skill)
  const required = meta.requiredEnvironmentVariables ?? []
  const missing = required.filter(v => {
    const value = process.env[v]
    return value === undefined || value === ''
  })
  return { valid: missing.length === 0, missing }
}

/**
 * 生成缺失环境变量的中文错误消息 — 用于 SkillTool.validateInput 的返回。
 */
export function formatMissingEnvMessage(
  skillName: string,
  missing: string[],
): string {
  return (
    `Skill '${skillName}' 需要环境变量：${missing.join(', ')}\n` +
    `   请在 ~/.pandacc/config 或 shell 中设置后重试`
  )
}

export interface TrustLevelCheckResult {
  allowed: boolean
  /** 非致命提示（例如 community skill 的 warning）。 */
  reason?: string
}

/**
 * 检查 skill 信任等级是否允许执行。
 * 当前策略：
 *   - builtin / official / trusted: 直接允许
 *   - community: 允许但附带 warning reason
 *   - 未知等级: 回退到 builtin 行为（允许）
 * 未来可以在此 hook 二次确认 / 权限提示。
 */
export function checkSkillTrustLevel(skill: {
  name?: string
  trustMetadata?: SkillTrustMetadata
}): TrustLevelCheckResult {
  const meta = getSkillTrustMetadata(skill)
  const trust: SkillTrustLevel = meta.trust ?? 'builtin'

  if (trust === 'community') {
    return {
      allowed: true,
      reason: `community skill '${skill.name ?? 'unknown'}' — consider review before frequent use`,
    }
  }

  return { allowed: true }
}
