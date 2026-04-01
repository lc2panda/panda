import { registerBundledSkill } from '../bundledSkills.js'

export function registerRemindSkill(): void {
  registerBundledSkill({
    name: 'remind',
    description:
      'Set a reminder using natural language time — delegates to ScheduleCronTool.',
    argumentHint: '<message> <time>',
    userInvocable: true,
    async getPromptForCommand(args) {
      const prompt = `# Set Reminder

User input: "${args}"

## Steps

1. Parse the user's time description (e.g. "明天下午3点", "30分钟后", "每天早上9点", "in 2 hours", "every Friday at 5pm")
2. Convert to a cron expression
3. Use the CronCreate tool to create the scheduled task:
   - For one-time reminders: set recurring to false
   - For repeating reminders: set recurring to true
   - The command should echo the reminder message clearly
4. Confirm the reminder was created and tell the user the exact trigger time

## Important

- If the user input is empty or unclear, ask them what they want to be reminded about and when
- Always confirm the interpreted time before creating the cron job
- Use Asia/Singapore timezone (+08:00) for time interpretation
- Present confirmation in Chinese (中文)`

      return [{ type: 'text', text: prompt }]
    },
  })
}
