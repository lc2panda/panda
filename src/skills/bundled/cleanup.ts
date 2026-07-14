import { registerBundledSkill } from '../bundledSkills.js'
import { isZh } from '../../utils/i18n.js'

export function registerCleanupSkill() {
  registerBundledSkill({
    name: 'cleanup',
    description: 'Clean temporary files · 清理临时文件',
    userInvocable: true,
    async getPromptForCommand(args) {
      const target = args.trim() || '.'
      const prompt = isZh()
        ? `扫描目录 "${target}" 并识别可安全清理的临时/缓存文件。查找：node_modules/.cache、.DS_Store、*.log、tmp/、dist/、构建产物。列出找到的内容并在删除前请求确认。永远不要删除源代码或配置文件。`
        : `Scan the directory "${target}" and identify temporary/cache files that can be safely cleaned up. Look for: node_modules/.cache, .DS_Store, *.log, tmp/, dist/, build artifacts. List what you found and ask for confirmation before deleting anything. Never delete source code or configuration files.`
      return [
        {
          type: 'text' as const,
          text: prompt,
        },
      ]
    },
  })
}
