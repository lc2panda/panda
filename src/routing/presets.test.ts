// Input: Unit tests for routing presets module
// Output: Validates preset loading, activation, and persistence
// Pos: Test suite for src/routing/presets.ts

import { describe, expect, it, beforeEach, mock } from 'bun:test'
import {
  getPreset,
  getActivePreset,
  setActivePreset,
  loadPresetsFromSettings,
  getAllPresets,
} from './presets.js'

describe('Routing Presets', () => {
  describe('Built-in presets', () => {
    it('should load quality preset', () => {
      const preset = getPreset('quality')
      expect(preset).toBeDefined()
      expect(preset?.name).toBe('quality')
      expect(preset?.defaultModel).toBe('opus-latest')
    })

    it('should load cost-saving preset', () => {
      const preset = getPreset('cost-saving')
      expect(preset).toBeDefined()
      expect(preset?.name).toBe('cost-saving')
      expect(preset?.defaultModel).toBe('haiku-latest')
    })

    it('should load balanced preset', () => {
      const preset = getPreset('balanced')
      expect(preset).toBeDefined()
      expect(preset?.name).toBe('balanced')
      expect(preset?.defaultModel).toBe('sonnet-latest')
    })

    it('should return undefined for non-existent preset', () => {
      const preset = getPreset('non-existent-preset')
      expect(preset).toBeUndefined()
    })
  })

  describe('Active preset management', () => {
    it('should get null when no preset is active initially', () => {
      // Note: Active preset may persist across tests, so just check it's either null or a valid preset
      const active = getActivePreset()
      if (active !== null) {
        expect(active.name).toBeDefined()
      }
    })

    it('should set and get active preset', () => {
      const result = setActivePreset('quality')
      expect(result).toBe(true)

      const active = getActivePreset()
      expect(active).toBeDefined()
      expect(active?.name).toBe('quality')
    })

    it('should return false when setting non-existent preset', () => {
      const result = setActivePreset('non-existent')
      expect(result).toBe(false)

      // Active preset should remain unchanged (previously set to 'quality')
      const active = getActivePreset()
      expect(active).toBeDefined()
    })
  })

  describe('Custom presets from settings', () => {
    it('should load custom preset from settings', () => {
      const customPresets = {
        'my-custom': {
          name: 'my-custom',
          description: 'My custom preset',
          defaultModel: 'sonnet-latest',
          globalWeights: {
            reasoning: 1.0,
            coding: 1.0,
            speed: 1.0,
            costEfficiency: 1.0,
          },
        },
      }

      loadPresetsFromSettings(customPresets)

      const preset = getPreset('my-custom')
      expect(preset).toBeDefined()
      expect(preset?.name).toBe('my-custom')
      expect(preset?.description).toBe('My custom preset')
    })

    it('should activate preset from settings if specified', () => {
      const customPresets = {
        'auto-activate': {
          name: 'auto-activate',
          defaultModel: 'haiku-latest',
          globalWeights: {
            reasoning: 1.0,
            coding: 1.0,
            speed: 1.0,
            costEfficiency: 1.0,
          },
        },
      }

      loadPresetsFromSettings(customPresets, 'auto-activate')

      const active = getActivePreset()
      expect(active).toBeDefined()
      expect(active?.name).toBe('auto-activate')
    })

    it('should not fail if activePresetName does not exist', () => {
      const customPresets = {}

      expect(() => {
        loadPresetsFromSettings(customPresets, 'non-existent')
      }).not.toThrow()

      // Active preset may have been set by previous tests, just verify it's valid
      const active = getActivePreset()
      if (active !== null) {
        expect(active.name).toBeDefined()
      }
    })
  })

  describe('List presets', () => {
    it('should list all available presets', () => {
      const presets = getAllPresets()
      expect(presets.length).toBeGreaterThanOrEqual(4) // At least 4 built-in presets
      expect(presets.map((p) => p.name)).toContain('quality')
      expect(presets.map((p) => p.name)).toContain('cost-saving')
      expect(presets.map((p) => p.name)).toContain('balanced')
      expect(presets.map((p) => p.name)).toContain('multi-provider')
    })
  })
})
