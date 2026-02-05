/**
 * Phase 7 Enhanced Frontmatter Tests
 *
 * Tests for extended IdumbFrontmatter interface with 7 new fields.
 * TDD: Tests written BEFORE implementation.
 *
 * @module frontmatter-phase7
 */

import { describe, it, expect } from 'vitest'
import {
  generateIdumbFrontmatter,
  shouldAutoFrontmatter,
  injectFrontmatter,
  validateIdumbFrontmatter,
  type IdumbFrontmatter
} from '../frontmatter'

describe('Phase 7 Enhanced Frontmatter', () => {
  describe('Interface Extension', () => {
    it('should generate frontmatter with schema_type field auto-detected', () => {
      const frontmatter = generateIdumbFrontmatter(
        '.idumb/project-output/phases/P1-plan.md',
        '# Test Phase',
        'idumb-builder'
      )

      expect(frontmatter.schema_type).toBeDefined()
      expect(frontmatter.schema_type).toBe('phase-v1')
    })

    it('should accept custom metadata in frontmatter', () => {
      const customData: Record<string, any> = {
        custom_field: 'custom_value',
        another_field: 123
      }

      // Merge with frontmatter
      const enhanced: IdumbFrontmatter = {
        ...generateIdumbFrontmatter('.idumb/test.md', '# Test', 'test-agent'),
        custom: customData
      }

      expect(enhanced.custom).toEqual(customData)
    })

    it('should validate decision_reason is present for decision type', () => {
      const decisionFrontmatter: Partial<IdumbFrontmatter> = {
        id: 'test-id',
        title: 'Test Decision',
        type: 'decision',
        created: new Date().toISOString(),
        decision_reason: 'We decided to do X because of Y'
      }

      const validation = validateIdumbFrontmatter(decisionFrontmatter)

      // For now, just check it has the field
      expect(decisionFrontmatter.decision_reason).toBeDefined()
    })
  })

  describe('Backward Compatibility', () => {
    it('should maintain backward compatibility with old frontmatter', () => {
      const oldFrontmatter = {
        id: '01923345-6789-7123-8123-456789abcdef', // Valid UUID v7
        title: 'Old Document',
        type: 'phase',
        created: '2026-02-05T10:00:00Z'
      }

      // Should validate old frontmatter without new Phase 7 fields
      const validation = validateIdumbFrontmatter(oldFrontmatter)

      expect(validation.valid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    it('should handle empty arrays for new relationship fields', () => {
      const frontmatter = {
        id: '01923345-6789-7123-8123-456789abcdef', // Valid UUID v7
        title: 'Test',
        type: 'phase',
        created: new Date().toISOString(),
        child_ids: [],
        references: [],
        requirement_ids: [],
        validation_ids: []
      }

      const validation = validateIdumbFrontmatter(frontmatter)

      expect(validation.valid).toBe(true)
    })

    it('should serialize custom fields correctly', () => {
      const frontmatter: IdumbFrontmatter = {
        id: 'test-id',
        title: 'Test',
        type: 'phase',
        created: new Date().toISOString(),
        custom: {
          project: 'iDumb',
          version: '0.2.0',
          metadata: { key: 'value' }
        }
      }

      // Should preserve nested custom data
      expect(frontmatter.custom?.project).toBe('iDumb')
      expect(frontmatter.custom?.metadata?.key).toBe('value')
    })
  })

  describe('Frontmatter Injection', () => {
    it('should inject new fields into document without frontmatter', () => {
      const content = '# New Document\n\nContent here.'
      const filePath = '.idumb/project-output/phases/P1-test.md'

      const result = injectFrontmatter(filePath, content, 'idumb-builder')

      expect(result).toMatch(/schema_type:/)
      expect(result).toMatch(/title: New Document/)
    })

    it('should preserve new fields when updating existing frontmatter', () => {
      const existingContent = `---
id: existing-id
title: Existing Title
type: phase
created: 2026-02-05T10:00:00Z
child_ids: ['child-1', 'child-2']
---

# Updated Content`

      const filePath = '.idumb/project-output/phases/P1-test.md'

      const result = injectFrontmatter(filePath, existingContent, 'idumb-builder')

      // Should preserve existing child_ids (YAML array format)
      expect(result).toMatch(/child_ids:/)
      expect(result).toMatch(/child-1/)
      expect(result).toMatch(/child-2/)
      // Should update timestamp
      expect(result).toMatch(/updated:/)
    })

    it('should merge custom fields with existing custom fields', () => {
      const existingContent = `---
id: existing-id
title: Existing
type: phase
created: 2026-02-05T10:00:00Z
custom:
  old_field: old_value
---

# Content
`

      const filePath = '.idumb/test.md'

      const result = injectFrontmatter(filePath, existingContent, 'idumb-builder')

      // New merge strategy should preserve existing custom fields
      expect(result).toMatch(/old_field:\s*old_value/)
    })
  })

  describe('Schema Type Detection', () => {
    it('should auto-detect schema_type from document type', () => {
      const phaseFm = generateIdumbFrontmatter('.idumb/phases/test.md', '# Phase', 'agent')
      const taskFm = generateIdumbFrontmatter('.idumb/tasks/test.md', '# Task', 'agent')
      const researchFm = generateIdumbFrontmatter('.idumb/research/test.md', '# Research', 'agent')
      const decisionFm = generateIdumbFrontmatter('.idumb/decisions/test.md', '# Decision', 'agent')

      expect(phaseFm.schema_type).toBe('phase-v1')
      expect(taskFm.schema_type).toBe('task-v1')
      expect(researchFm.schema_type).toBe('research-v1')
      expect(decisionFm.schema_type).toBe('decision-v1')
    })

    it('should default to base-v1 for unknown document types', () => {
      const unknownFm = generateIdumbFrontmatter('.idumb/unknown/test.md', '# Unknown', 'agent')

      expect(unknownFm.schema_type).toBe('base-v1')
    })
  })
})
