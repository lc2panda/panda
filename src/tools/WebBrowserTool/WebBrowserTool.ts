import { z } from 'zod/v4'
import { buildTool, type ToolDef } from '../../Tool.js'
import { lazySchema } from '../../utils/lazySchema.js'
import { jsonStringify } from '../../utils/slowOperations.js'

const WEB_BROWSER_TOOL_NAME = 'WebBrowserControl'

const inputSchema = lazySchema(() =>
  z.strictObject({
    action: z
      .enum([
        'navigate',
        'click',
        'type',
        'scroll',
        'screenshot',
        'get_text',
        'back',
        'forward',
        'refresh',
        'close',
      ])
      .describe('Browser action to perform.'),
    url: z
      .string()
      .optional()
      .describe('URL to navigate to (for navigate action).'),
    selector: z
      .string()
      .optional()
      .describe('CSS selector for the target element (for click, type actions).'),
    text: z
      .string()
      .optional()
      .describe('Text to type into the selected element (for type action).'),
    direction: z
      .enum(['up', 'down'])
      .optional()
      .describe('Scroll direction (for scroll action).'),
    amount: z
      .number()
      .optional()
      .describe('Scroll amount in pixels (for scroll action).'),
  }),
)
type InputSchema = ReturnType<typeof inputSchema>

export type Output = {
  success: boolean
  message: string
  content?: string
  screenshot_path?: string
}

export const WebBrowserTool = buildTool({
  name: WEB_BROWSER_TOOL_NAME,
  searchHint: 'browser web page navigate click type screenshot',
  maxResultSizeChars: 500_000,
  shouldDefer: true,

  get inputSchema(): InputSchema {
    return inputSchema()
  },

  isReadOnly(input) {
    return input.action === 'screenshot' || input.action === 'get_text'
  },

  toAutoClassifierInput(input) {
    return `browser ${input.action} ${input.url ?? input.selector ?? ''}`
  },

  async description() {
    return 'Control a web browser — navigate, click, type, scroll, and capture screenshots.'
  },

  async prompt() {
    return `Control a headless web browser for web interaction and testing.

Actions:
- navigate: Go to a URL. Requires url parameter.
- click: Click an element. Requires selector.
- type: Type text into an element. Requires selector and text.
- scroll: Scroll the page. Optional direction (up/down) and amount.
- screenshot: Capture a screenshot of the current page.
- get_text: Extract text content from the current page or a specific selector.
- back/forward/refresh: Navigation controls.
- close: Close the browser session.

Use CSS selectors to target elements. The browser session persists across calls within the same conversation.`
  },

  mapToolResultToToolResultBlockParam(output, toolUseID) {
    return {
      tool_use_id: toolUseID,
      type: 'tool_result' as const,
      content: jsonStringify(output),
    }
  },

  renderToolUseMessage() {
    return null
  },

  async call(input) {
    return {
      data: {
        success: false,
        message:
          '[WebBrowser not available in this build — WEB_BROWSER_TOOL feature flag is required]',
      },
    }
  },
} satisfies ToolDef<InputSchema, Output>)
