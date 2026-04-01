import { registerBundledSkill } from '../bundledSkills.js'

export function registerCleanupSkill() {
  registerBundledSkill({
    name: 'cleanup',
    description: 'Clean temporary files · 清理临时文件',
    userInvocable: true,
    async getPromptForCommand(args) {
      const target = args.trim() || '.'
      return [
        {
          type: 'text' as const,
          text: `Scan the directory "${target}" and identify temporary/cache files that can be safely cleaned up. Look for: node_modules/.cache, .DS_Store, *.log, tmp/, dist/, build artifacts. List what you found and ask for confirmation before deleting anything. Never delete source code or configuration files.`,
        },
      ]
    },
  })
}
