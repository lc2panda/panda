// Input: settings.json outputCompression config
// Output: resolved OutputCompressionConfig for compression decision-making
// Pos: Configuration layer for BashTool output compression (B13)
// "一旦我被修改，请更新我的头部注释，以及所属文件夹的md。"

import { getInitialSettings } from '../../utils/settings/settings.js'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OutputCompressionConfig {
  enabled: boolean                  // Global switch, default true
  level: 'off' | 'normal' | 'aggressive'  // Default 'normal'
  overrides?: Record<string, 'off' | 'normal' | 'aggressive'>  // Per-command overrides
}

// ---------------------------------------------------------------------------
// Default configuration
// ---------------------------------------------------------------------------

const DEFAULT_CONFIG: OutputCompressionConfig = {
  enabled: true,
  level: 'normal',
}

// ---------------------------------------------------------------------------
// Config reader — reads from merged settings, applies defaults
// ---------------------------------------------------------------------------

/**
 * Get the effective compression configuration from user/project settings.
 * Falls back to defaults when no config is specified.
 *
 * This function is designed to be called from both:
 *   - outputCompressor.ts (BashTool compression)
 *   - any future tool-level compressor (e.g., toolOutputCompressor.ts for B3)
 */
export function getCompressionConfig(): OutputCompressionConfig {
  try {
    const settings = getInitialSettings()
    const raw = settings.outputCompression

    if (!raw) return DEFAULT_CONFIG

    return {
      enabled: raw.enabled ?? DEFAULT_CONFIG.enabled,
      level: raw.level ?? DEFAULT_CONFIG.level,
      overrides: raw.overrides,
    }
  } catch {
    // If settings loading fails, use safe defaults
    return DEFAULT_CONFIG
  }
}
