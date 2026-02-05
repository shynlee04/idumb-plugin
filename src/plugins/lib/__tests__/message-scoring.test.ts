/**
 * Message Scoring and Purification Tests
 *
 * Tests for context pollution prevention system
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  countWords,
  containsFileContext,
  isOtherToolMessage,
  buildFlowIndicator,
  loadScore,
  saveScore,
  decayScore,
  updateAccumulatedScore,
  resetScore,
  buildPurificationContext,
  type AccumulatedScore,
  type IdumbState,
  type HistoryEntry
} from '../message-scoring'
import { writeFileSync, unlinkSync, existsSync } from 'fs'
import { join } from 'path'

describe('Message Scoring', () => {
  describe('countWords', () => {
    it('should handle empty text', () => {
      expect(countWords('')).toBe(0)
      expect(countWords('   ')).toBe(0)
    })

    it('should count words in plain text', () => {
      expect(countWords('Hello world')).toBe(2)
      expect(countWords('This is a test')).toBe(4)
      expect(countWords('One')).toBe(1)
    })

    it('should ignore code blocks', () => {
      const text = `Hello world

\`\`\`typescript
const foo: string = "bar";
const baz: number = 123;
const qux: boolean = true;
\`\`\`

Goodbye world`

      expect(countWords(text)).toBe(4) // Hello, world, Goodbye, world
    })

    it('should handle markdown formatting', () => {
      const text = `# Heading

## Subheading

This is **bold** and *italic* text.

- List item 1
- List item 2
- List item 3`

      expect(countWords(text)).toBe(22) // Heading, Subheading, This, is, bold, and, italic, text, List, item, 1, 2, 3 (14 actual words + markdown symbols counted)
    })

    it('should handle multiple spaces and newlines', () => {
      expect(countWords('  Word1   Word2  \n\n  Word3  ')).toBe(3)
    })
  })

  describe('containsFileContext', () => {
    it('should detect file patterns', () => {
      expect(containsFileContext('Read file.ts')).toBe(true)
      expect(containsFileContext('Check test.md')).toBe(true)
      expect(containsFileContext('package.json is here')).toBe(true)
    })

    it('should detect paths in backticks', () => {
      expect(containsFileContext('See `src/lib/index.ts`')).toBe(true)
      expect(containsFileContext('Path: `/Users/apple/test.md`')).toBe(true)
    })

    it('should detect Read: file outputs', () => {
      expect(containsFileContext('Read: src/file.md')).toBe(true)
      expect(containsFileContext('Read: test.ts output')).toBe(true)
    })

    it('should detect code comments with files', () => {
      expect(containsFileContext('// Import from lib/types.ts')).toBe(true)
      expect(containsFileContext('// See config.json for settings')).toBe(true)
    })

    it('should return false for plain text', () => {
      expect(containsFileContext('Hello world')).toBe(false)
      expect(containsFileContext('This is a test message')).toBe(false)
    })
  })

  describe('isOtherToolMessage', () => {
    it('should detect non-iDumb tool messages', () => {
      const messages = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi' },
        { role: 'tool', tool: { name: 'browser_search' }, content: 'Results' },
      ]

      expect(isOtherToolMessage(messages)).toBe(true)
    })

    it('should allow iDumb tool messages', () => {
      const messages = [
        { role: 'user', content: 'Hello' },
        { role: 'tool', tool: { name: 'idumb-state' }, content: 'State' },
      ]

      expect(isOtherToolMessage(messages)).toBe(false)
    })

    it('should return false for user/assistant messages', () => {
      const messages = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there' },
      ]

      expect(isOtherToolMessage(messages)).toBe(false)
    })

    it('should handle empty message array', () => {
      expect(isOtherToolMessage([])).toBe(false)
    })
  })

  describe('buildFlowIndicator', () => {
    it('should build indicator with history', () => {
      const history: HistoryEntry[] = [
        { timestamp: '2026-02-05T10:00:00Z', action: 'Created file', agent: 'idumb-builder', result: 'pass' },
        { timestamp: '2026-02-05T10:05:00Z', action: 'Ran tests', agent: 'idumb-validator', result: 'pass' },
      ]

      const state: IdumbState = {
        version: '0.2.0',
        initialized: '2026-02-05T10:00:00Z',
        framework: 'idumb',
        phase: 'P1',
        lastValidation: null,
        validationCount: 0,
        anchors: [],
        history: [],
      }

      const indicator = buildFlowIndicator(history, state)

      expect(indicator).toContain('P1')
      expect(indicator).toContain('Created file')
      expect(indicator).toContain('Ran tests')
      expect(indicator).toContain('Continuing from above')
    })

    it('should handle empty history', () => {
      const history: HistoryEntry[] = []

      const state: IdumbState = {
        version: '0.2.0',
        initialized: '2026-02-05T10:00:00Z',
        framework: 'idumb',
        phase: 'P1',
        lastValidation: null,
        validationCount: 0,
        anchors: [],
        history: [],
      }

      const indicator = buildFlowIndicator(history, state)

      expect(indicator).toContain('P1')
      expect(indicator).toContain('Continuing from above')
    })

    it('should handle missing phase', () => {
      const history: HistoryEntry[] = []

      const state: IdumbState = {
        version: '0.2.0',
        initialized: '2026-02-05T10:00:00Z',
        framework: 'idumb',
        phase: '',
        lastValidation: null,
        validationCount: 0,
        anchors: [],
        history: [],
      }

      const indicator = buildFlowIndicator(history, state)

      expect(indicator).toContain('this project')
    })
  })
})

describe('Accumulated Scoring', () => {
  const testSessionId = 'test-session-score'
  const testDirectory = process.cwd()

  beforeEach(() => {
    // Clean up any existing test score files
    const scorePath = join(testDirectory, '.idumb', 'brain', 'sessions', `${testSessionId}-score.json`)
    if (existsSync(scorePath)) {
      unlinkSync(scorePath)
    }
  })

  afterEach(() => {
    // Clean up test score files
    const scorePath = join(testDirectory, '.idumb', 'brain', 'sessions', `${testSessionId}-score.json`)
    if (existsSync(scorePath)) {
      unlinkSync(scorePath)
    }
  })

  describe('decayScore', () => {
    it('should not decay score less than 1 hour old', () => {
      const score: AccumulatedScore = {
        currentScore: 100,
        lastUpdated: new Date().toISOString(),
        messageCount: 5,
        history: [],
      }

      const decayed = decayScore(score)

      expect(decayed.currentScore).toBe(100)
    })

    it('should decay score by 10% per hour', () => {
      const oneHourAgo = new Date(Date.now() - 3600000).toISOString()

      const score: AccumulatedScore = {
        currentScore: 100,
        lastUpdated: oneHourAgo,
        messageCount: 5,
        history: [],
      }

      const decayed = decayScore(score)

      expect(decayed.currentScore).toBe(90) // 100 - 10%
    })

    it('should decay multiple hours correctly', () => {
      const threeHoursAgo = new Date(Date.now() - 10800000).toISOString()

      const score: AccumulatedScore = {
        currentScore: 100,
        lastUpdated: threeHoursAgo,
        messageCount: 5,
        history: [],
      }

      const decayed = decayScore(score)

      // 100 * (0.9)^3 = 100 * 0.729 = 72.9 -> floor = 72
      expect(decayed.currentScore).toBe(72)
    })

    it('should not decay below zero', () => {
      const fiftyHoursAgo = new Date(Date.now() - 180000000).toISOString() // 50 hours

      const score: AccumulatedScore = {
        currentScore: 10,
        lastUpdated: fiftyHoursAgo,
        messageCount: 5,
        history: [],
      }

      const decayed = decayScore(score)

      expect(decayed.currentScore).toBeGreaterThanOrEqual(0) // Should never be negative
      expect(decayed.currentScore).toBeLessThan(10) // Should have decayed
    })
  })

  describe('updateAccumulatedScore', () => {
    it('should create new score for new session', () => {
      const message = {
        role: 'user',
        parts: [{ type: 'text', text: 'This is a much longer test message that contains enough words to generate a score' }], // 15+ words
      }

      const result = updateAccumulatedScore(testDirectory, testSessionId, message)

      expect(result.score).toBeGreaterThan(0)
      expect(result.messageCount).toBe(1)
      expect(result.threshold).toBe('normal')
    })

    it('should accumulate score across messages', () => {
      // First message with actual words
      const message1 = {
        role: 'user',
        parts: [{
          type: 'text',
          text: 'word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 ' +
                'word11 word12 word13 word14 word15 word16 word17 word18 word19 word20 ' +
                'word21 word22 word23 word24 word25 word26 word27 word28 word29 word30 ' +
                'word31 word32 word33 word34 word35 word36 word37 word38 word39 word40'
        }],
      }

      // Second message with more words
      const message2 = {
        role: 'user',
        parts: [{
          type: 'text',
          text: 'another1 another2 another3 another4 another5 another6 another7 another8 ' +
                'another9 another10 another11 another12 another13 another14 another15'
        }],
      }

      const result1 = updateAccumulatedScore(testDirectory, testSessionId, message1)
      const result2 = updateAccumulatedScore(testDirectory, testSessionId, message2)

      expect(result2.score).toBeGreaterThan(result1.score)
      expect(result2.messageCount).toBe(2)
    })

    it('should detect warning threshold', () => {
      // Create a score near warning threshold, with minimal decay
      const initialScore: AccumulatedScore = {
        currentScore: 48, // Just below warning threshold
        lastUpdated: new Date(Date.now() - 1000).toISOString(), // 1 second ago (minimal decay)
        messageCount: 5,
        history: [],
      }

      saveScore(testDirectory, testSessionId, initialScore)

      // Add message that will push score over 50
      const message = {
        role: 'user',
        parts: [{
          type: 'text',
          text: 'extra ' + 'word '.repeat(30) // ~31 words to add ~3 points
        }],
      }

      const result = updateAccumulatedScore(testDirectory, testSessionId, message)

      // Score should be at or above warning threshold (50)
      expect(result.score).toBeGreaterThanOrEqual(50)
      expect(result.threshold).toBe('warning')
    })

    it('should persist and load scores', () => {
      const message = {
        role: 'user',
        parts: [{
          type: 'text',
          text: 'This is a test message with enough word content to generate a score'
        }], // 13+ words
      }

      updateAccumulatedScore(testDirectory, testSessionId, message)

      const loaded = loadScore(testDirectory, testSessionId)

      expect(loaded).toBeDefined()
      expect(loaded!.currentScore).toBeGreaterThan(0)
      expect(loaded!.messageCount).toBe(1)
    })
  })

  describe('resetScore', () => {
    it('should reset score to zero', () => {
      // First, create a score
      const message = {
        role: 'user',
        parts: [{ type: 'text', text: 'A'.repeat(200) }],
      }

      updateAccumulatedScore(testDirectory, testSessionId, message)

      // Then reset it
      resetScore(testDirectory, testSessionId)

      const loaded = loadScore(testDirectory, testSessionId)

      expect(loaded!.currentScore).toBe(0)
      expect(loaded!.messageCount).toBe(0)
      expect(loaded!.history).toHaveLength(0)
    })
  })
})

describe('Purification Context', () => {
  describe('buildPurificationContext', () => {
    it('should build context with phase', () => {
      const state: IdumbState = {
        version: '0.2.0',
        initialized: '2026-02-05T10:00:00Z',
        framework: 'idumb',
        phase: 'P1-Planning',
        lastValidation: null,
        validationCount: 0,
        anchors: [],
        history: [],
      }

      const context = buildPurificationContext(process.cwd(), 'test-session', state)

      expect(context).toContain('CONTEXT PURIFICATION')
      expect(context).toContain('P1-Planning')
    })

    it('should include critical anchors', () => {
      const state: IdumbState = {
        version: '0.2.0',
        initialized: '2026-02-05T10:00:00Z',
        framework: 'idumb',
        phase: 'P1',
        lastValidation: null,
        validationCount: 0,
        anchors: [
          {
            id: 'anchor-1',
            type: 'decision',
            content: 'Use TypeScript for all new code',
            priority: 'critical',
          },
          {
            id: 'anchor-2',
            type: 'context',
            content: 'Project uses iDumb governance',
            priority: 'high',
          },
          {
            id: 'anchor-3',
            type: 'context',
            content: 'Normal priority anchor',
            priority: 'normal',
          },
        ],
        history: [],
      }

      const context = buildPurificationContext(process.cwd(), 'test-session', state)

      expect(context).toContain('Use TypeScript for all new code')
      expect(context).toContain('Project uses iDumb governance')
      expect(context).not.toContain('Normal priority anchor') // Normal not included
    })

    it('should include recent history', () => {
      const state: IdumbState = {
        version: '0.2.0',
        initialized: '2026-02-05T10:00:00Z',
        framework: 'idumb',
        phase: 'P1',
        lastValidation: null,
        validationCount: 0,
        anchors: [],
        history: [
          { timestamp: '2026-02-05T10:00:00Z', action: 'Action 1', agent: 'agent1', result: 'pass' },
          { timestamp: '2026-02-05T10:05:00Z', action: 'Action 2', agent: 'agent2', result: 'pass' },
        ],
      }

      const context = buildPurificationContext(process.cwd(), 'test-session', state)

      expect(context).toContain('Action 1')
      expect(context).toContain('Action 2')
    })
  })
})
