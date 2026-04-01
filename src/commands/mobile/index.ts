import type { Command } from '../../commands.js'

const mobile = {
  type: 'local-jsx',
  name: 'mobile',
  aliases: ['ios', 'android'],
  description: 'Show QR code to download the Claude mobile app · 显示移动应用下载二维码',
  load: () => import('./mobile.js'),
} satisfies Command

export default mobile
