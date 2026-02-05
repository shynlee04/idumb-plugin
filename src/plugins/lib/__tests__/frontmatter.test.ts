/**
 * Frontmatter Auto-Generation Tests
 *
 * Tests for iDumb frontmatter injection and validation
 */

import { describe, it, expect } from 'vitest'
import matter from 'gray-matter'
import {
  shouldAutoFrontmatter,
  detectDocumentType,
  generateIdumbFrontmatter,
  extractTitle,
  extractTitleFromPath,
  injectFrontmatter,
  validateIdumbFrontmatter,
  type IdumbFrontmatter
} from '../frontmatter'

describe('Frontmatter Auto-Generation', () => {
  describe('Location Detection', () => {
    it('should detect managed paths', () => {
      expect(shouldAutoFrontmatter('.idumb/project-output/test.md')).toBe(true)
      expect(shouldAutoFrontmatter('.idumb/sessions/session.md')).toBe(true)
      expect(shouldAutoFrontmatter('.idumb/brain/governance/doc.md')).toBe(true)
      expect(shouldAutoFrontmatter('.idumb/brain/context/info.md')).toBe(true)
    })

    it('should not detect unmanaged paths', () => {
      expect(shouldAutoFrontmatter('README.md')).toBe(false)
      expect(shouldAutoFrontmatter('src/index.ts')).toBe(false)
      expect(shouldAutoFrontmatter('.git/config')).toBe(false)
      expect(shouldAutoFrontmatter('.idumb/other/doc.md')).toBe(false)
    })
  })

  describe('Type Detection', () => {
    it('should detect phase documents', () => {
      expect(detectDocumentType('.idumb/project-output/phases/P1-plan.md')).toBe('phase')
      expect(detectDocumentType('.idumb/P1-plan.md')).toBe('phase')
    })

    it('should detect task documents', () => {
      expect(detectDocumentType('.idumb/project-output/tasks/task-1.md')).toBe('task')
      expect(detectDocumentType('.idumb/todo.md')).toBe('task')
    })

    it('should detect research documents', () => {
      expect(detectDocumentType('.idumb/project-output/research/analysis.md')).toBe('research')
    })

    it('should detect decision documents', () => {
      expect(detectDocumentType('.idumb/decisions/adr-001.md')).toBe('decision')
      expect(detectDocumentType('.idumb/project-output/decisions/api-choice.md')).toBe('decision')
    })

    it('should detect validation documents', () => {
      expect(detectDocumentType('.idumb/project-output/validations/check-1.md')).toBe('validation')
    })

    it('should detect session documents', () => {
      expect(detectDocumentType('.idumb/sessions/ses-abc123.md')).toBe('session')
    })

    it('should fallback to parent directory name', () => {
      expect(detectDocumentType('.idumb/unknown/file.md')).toBe('unknown')
      expect(detectDocumentType('.idumb/phases/plan.md')).toBe('phase')
    })
  })

  describe('Title Extraction', () => {
    it('should extract title from first heading', () => {
      const content = '# My Document\n\nSome content here.'
      expect(extractTitle(content)).toBe('My Document')
    })

    it('should extract title with leading spaces', () => {
      const content = '#    Spaced Title\n\nContent.'
      expect(extractTitle(content)).toBe('Spaced Title')
    })

    it('should return null when no heading found', () => {
      const content = 'Just some content\nwithout headings.'
      expect(extractTitle(content)).toBeNull()
    })

    it('should extract title from filename when no heading', () => {
      expect(extractTitleFromPath('.idumb/test-file.md')).toBe('Test file')
      expect(extractTitleFromPath('.idumb/my-document.md')).toBe('My document')
    })

    it('should capitalize first letter from filename', () => {
      expect(extractTitleFromPath('.idumb/untitled.md')).toBe('Untitled')
    })
  })

  describe('Frontmatter Generation', () => {
    it('should generate valid frontmatter with required fields', () => {
      const fm = generateIdumbFrontmatter(
        '.idumb/test.md',
        '# Test Document',
        'idumb-builder',
        'ses-abc123'
      )

      expect(fm.id).toBeDefined()
      expect(fm.title).toBe('Test Document')
      expect(fm.type).toBe('test')
      expect(fm.created).toBeDefined()
      expect(fm.parent_id).toBe('ses-abc123')
      expect(fm.source_agent).toBe('idumb-builder')
      expect(fm.status).toBe('active')
    })

    it('should generate UUID v7 format', () => {
      const fm = generateIdumbFrontmatter('.idumb/test.md', '# Test', 'idumb-builder')
      expect(fm.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
    })

    it('should use filename title when no heading', () => {
      const fm = generateIdumbFrontmatter(
        '.idumb/my-file.md',
        'Content without heading',
        'idumb-builder'
      )
      expect(fm.title).toBe('My file')
    })

    it('should detect correct document type from path', () => {
      const fm1 = generateIdumbFrontmatter(
        '.idumb/project-output/phases/P1-plan.md',
        '# Plan',
        'idumb-builder'
      )
      expect(fm1.type).toBe('phase')

      const fm2 = generateIdumbFrontmatter(
        '.idumb/project-output/research/analysis.md',
        '# Research',
        'idumb-builder'
      )
      expect(fm2.type).toBe('research')
    })

    it('should include session ID when provided', () => {
      const fm = generateIdumbFrontmatter(
        '.idumb/test.md',
        '# Test',
        'idumb-builder',
        'ses-xyz789'
      )
      expect(fm.parent_id).toBe('ses-xyz789')
    })

    it('should not include session ID when omitted', () => {
      const fm = generateIdumbFrontmatter(
        '.idumb/test.md',
        '# Test',
        'idumb-builder'
      )
      expect(fm.parent_id).toBeUndefined()
    })
  })

  describe('Frontmatter Validation', () => {
    it('should validate correct frontmatter', () => {
      const validFm: IdumbFrontmatter = {
        id: '01234567-89ab-7cde-8123-456789abcdef',
        title: 'Test Document',
        type: 'phase',
        created: '2026-02-05T10:30:00.000Z',
        status: 'active'
      }

      const result = validateIdumbFrontmatter(validFm)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should detect missing required fields', () => {
      const invalidFm = {
        title: 'Test'
        // Missing: id, type, created
      }

      const result = validateIdumbFrontmatter(invalidFm)
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors).toContain('Missing required field: id')
      expect(result.errors).toContain('Missing required field: type')
      expect(result.errors).toContain('Missing required field: created')
    })

    it('should validate UUID v7 format', () => {
      const validUUID = {
        id: '01234567-89ab-7cde-9123-456789abcdef',
        title: 'Test',
        type: 'phase',
        created: '2026-02-05T10:30:00.000Z'
      }

      const result1 = validateIdumbFrontmatter(validUUID)
      expect(result1.valid).toBe(true)

      const invalidUUID = {
        id: 'not-a-uuid',
        title: 'Test',
        type: 'phase',
        created: '2026-02-05T10:30:00.000Z'
      }

      const result2 = validateIdumbFrontmatter(invalidUUID)
      expect(result2.valid).toBe(false)
      expect(result2.errors).toContain('Invalid UUID v7 format for id')
    })

    it('should reject UUID v4 format', () => {
      const v4UUID = {
        id: '01234567-89ab-4cde-0123-456789abcdef', // Version 4, not 7
        title: 'Test',
        type: 'phase',
        created: '2026-02-05T10:30:00.000Z'
      }

      const result = validateIdumbFrontmatter(v4UUID)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Invalid UUID v7 format for id')
    })
  })

  describe('Frontmatter Injection', () => {
    it('should inject frontmatter into document without existing', () => {
      const content = '# Test Document\n\nContent here.'
      const result = injectFrontmatter('.idumb/test.md', content, 'idumb-builder', 'ses-123')

      expect(result).toMatch(/^---\n/)
      expect(result).toMatch(/id: /)
      expect(result).toMatch(/title: Test Document/)
      expect(result).toMatch(/type: test/)
      expect(result).toMatch(/created: /)
      expect(result).toMatch(/source_agent: idumb-builder/)
      expect(result).toMatch(/parent_id: ses-123/)
      expect(result).toMatch(/status: active/)
      expect(result).toMatch(/updated: /)
    })

    it('should preserve existing non-iDumb frontmatter', () => {
      const content = `---
custom: value
author: human
---

# Test`
      const result = injectFrontmatter('.idumb/test.md', content, 'idumb-builder')

      expect(result).toMatch(/custom: value/)
      expect(result).toMatch(/author: human/)
      expect(result).toMatch(/id: /)  // iDumb fields added
    })

    it('should update existing iDumb frontmatter', () => {
      const content = `---
id: old-id
title: Old Title
type: research
created: 2026-01-01T00:00:00.000Z
---

# New Title`
      const result = injectFrontmatter('.idumb/test.md', content, 'idumb-builder', 'ses-456')

      // Parse the result
      const parsed = matter(result)

      // ID should be preserved (Phase 7: maintain document identity)
      expect(parsed.data.id).toBeDefined()
      expect(parsed.data.id).toBe('old-id')

      // Title should be extracted from content
      expect(parsed.data.title).toBe('New Title')

      // Type should be preserved from original
      expect(parsed.data.type).toBe('research')

      // Created should be preserved
      expect(parsed.data.created).toBe('2026-01-01T00:00:00.000Z')

      // Updated should be new
      expect(parsed.data.updated).toBeDefined()

      // Parent ID should be added
      expect(parsed.data.parent_id).toBe('ses-456')
    })

    it('should handle empty content gracefully', () => {
      const content = ''
      const result = injectFrontmatter('.idumb/test.md', content, 'idumb-builder')

      expect(result).toMatch(/^---\n/)
      expect(result).toMatch(/id: /)
      expect(result).toMatch(/title: Untitled/)
    })

    it('should only process markdown files', () => {
      const content = '# Test'

      // Markdown file
      const resultMd = injectFrontmatter('.idumb/test.md', content, 'idumb-builder')
      expect(resultMd).toMatch(/^---/)

      // Non-markdown files should return original content
      const resultJson = injectFrontmatter('.idumb/test.json', content, 'idumb-builder')
      expect(resultJson).toBe(content)

      const resultTxt = injectFrontmatter('.idumb/test.txt', content, 'idumb-builder')
      expect(resultTxt).toBe(content)
    })
  })
})
