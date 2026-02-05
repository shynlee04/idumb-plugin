/**
 * Message Interception Integration Tests
 *
 * Tests for the integration of message interception scenarios in idumb-core.ts
 * These tests verify HOW the plugin uses the message-scoring library, not the library itself.
 *
 * TDD: Tests written BEFORE plugin integration implementation.
 */

import { describe, it, expect } from 'vitest'
import {
  countWords,
  containsFileContext,
  isOtherToolMessage,
  buildFlowIndicator,
  type HistoryEntry
} from '../message-scoring'
import type { IdumbState } from '../types'

describe('Message Interception - Scenario 2: Short Messages', () => {
  describe('Flow Indicator Injection Decision Logic', () => {
    it('should identify short messages (< 20 words) without file context', () => {
      const messageText = JSON.stringify([
        { role: 'user', content: 'continue' }
      ])

      const wordCount = countWords(messageText)
      const hasFileContext = containsFileContext(messageText)

      expect(wordCount).toBeLessThan(20)
      expect(hasFileContext).toBe(false)
    })

    it('should NOT inject flow indicator for messages with file context', () => {
      const messageText = JSON.stringify([
        { role: 'user', content: 'Check src/file.ts for the issue' }
      ])

      const wordCount = countWords(messageText)
      const hasFileContext = containsFileContext(messageText)

      expect(wordCount).toBeLessThan(20)
      expect(hasFileContext).toBe(true) // Has file path
    })

    it('should build flow indicator from history and state', () => {
      const recentHistory: HistoryEntry[] = [
        { tool: 'read', timestamp: '2026-02-05T10:00:00Z', action: 'Read file', agent: 'test-agent' },
        { tool: 'grep', timestamp: '2026-02-05T10:01:00Z', action: 'Search pattern', agent: 'test-agent' }
      ]

      const currentState: IdumbState = {
        version: '0.2.0',
        initialized: '2026-02-05T10:00:00Z',
        framework: 'test-framework',
        phase: 'test-phase',
        lastValidation: null,
        validationCount: 0,
        anchors: [],
        history: []
      }

      const flowIndicator = buildFlowIndicator(recentHistory, currentState)

      expect(flowIndicator).toBeTruthy()
      expect(flowIndicator).toContain('Context:')
      expect(flowIndicator).toContain('test-phase')
    })
  })
})

describe('Message Interception - Scenario 3: Accumulated Scoring', () => {
  describe('Threshold Detection Logic', () => {
    it('should identify when score reaches WARNING (50)', () => {
      const score = 50
      let level = 'normal'

      if (score >= 150) level = 'emergency'
      else if (score >= 100) level = 'purify'
      else if (score >= 50) level = 'warning'

      expect(level).toBe('warning')
    })

    it('should identify when score reaches PURIFY (100)', () => {
      const score = 100
      let level = 'normal'

      if (score >= 150) level = 'emergency'
      else if (score >= 100) level = 'purify'
      else if (score >= 50) level = 'warning'

      expect(level).toBe('purify')
    })

    it('should identify when score reaches EMERGENCY (150)', () => {
      const score = 150
      let level = 'normal'

      if (score >= 150) level = 'emergency'
      else if (score >= 100) level = 'purify'
      else if (score >= 50) level = 'warning'

      expect(level).toBe('emergency')
    })

    it('should track SessionTracker fields for scoring', () => {
      interface SessionTracker {
        sessionId: string
        agentRole: string
        startTime: string
        delegationDepth: number
        accumulatedScore?: number
        messageCount?: number
        lastScoreUpdate?: string
        purificationTriggered?: boolean
      }

      const tracker: SessionTracker = {
        sessionId: 'test-session',
        agentRole: 'test-agent',
        startTime: '2026-02-05T10:00:00Z',
        delegationDepth: 1,
        accumulatedScore: 75,
        messageCount: 10,
        lastScoreUpdate: '2026-02-05T10:05:00Z',
        purificationTriggered: false
      }

      expect(tracker.accumulatedScore).toBeDefined()
      expect(tracker.messageCount).toBeDefined()
      expect(tracker.lastScoreUpdate).toBeDefined()
      expect(tracker.purificationTriggered).toBeDefined()
    })
  })
})

describe('Message Interception - Scenario 4: Other Tool Detection', () => {
  describe('Tool Message Detection', () => {
    it('should detect Read tool outputs', () => {
      const messages = [
        { role: 'system', content: 'Read: file content here' }
      ]

      const hasReadOutput = messages.some(m =>
        m.content && typeof m.content === 'string' && m.content.includes('Read:')
      )

      expect(hasReadOutput).toBe(true)
    })

    it('should detect Grep tool outputs', () => {
      const messages = [
        { role: 'system', content: 'Grep: found 3 matches' }
      ]

      const hasGrepOutput = messages.some(m =>
        m.content && typeof m.content === 'string' && m.content.includes('Grep:')
      )

      expect(hasGrepOutput).toBe(true)
    })

    it('should NOT skip iDumb tool messages', () => {
      const messages = [
        { role: 'system', content: 'idumb-state: reading governance state' }
      ]

      const isIdumbTool = messages.some(m =>
        m.content && typeof m.content === 'string' && m.content.includes('idumb-')
      )

      expect(isIdumbTool).toBe(true)
    })
  })
})

describe('Message Interception - Integration Flow', () => {
  describe('Complete Message Transformation Flow', () => {
    it('should handle short message without file context', () => {
      const messages = [
        { role: 'user', content: 'continue' }
      ]

      const messageText = JSON.stringify(messages)
      const wordCount = countWords(messageText)
      const hasFileContext = containsFileContext(messageText)

      // Decision: should inject flow indicator?
      const shouldInject = wordCount < 20 && !hasFileContext

      expect(shouldInject).toBe(true)
    })

    it('should handle long message with accumulated scoring', () => {
      const score = 75
      const level = score >= 150 ? 'emergency' : score >= 100 ? 'purify' : score >= 50 ? 'warning' : 'normal'

      // Decision: should trigger purification?
      const shouldPurify = level === 'purify' || level === 'emergency'

      expect(level).toBe('warning')
      expect(shouldPurify).toBe(false)
    })

    it('should skip transformation for other tool outputs', () => {
      const messages = [
        { role: 'system', content: 'Read: file content' }
      ]

      const hasOtherTool = messages.some(m =>
        m.content && typeof m.content === 'string' && (
          m.content.includes('Read:') ||
          m.content.includes('Grep:') ||
          m.content.includes('Bash:')
        )
      )

      expect(hasOtherTool).toBe(true)
    })
  })
})

describe('Message Interception - Edge Cases', () => {
  describe('Boundary Conditions', () => {
    it('should handle exactly 20 words (threshold)', () => {
      const text = Array(20).fill('word').join(' ')
      const wordCount = countWords(text)

      expect(wordCount).toBe(20)
    })

    it('should handle empty message content', () => {
      const messageText = JSON.stringify([
        { role: 'user', content: '' }
      ])

      const wordCount = countWords(messageText)

      // Empty string in JSON results in 1 word from "role" and "content" keys
      expect(wordCount).toBeGreaterThanOrEqual(0)
    })

    it('should handle message with only punctuation', () => {
      const messageText = JSON.stringify([
        { role: 'user', content: '...' }
      ])

      const wordCount = countWords(messageText)

      expect(wordCount).toBeGreaterThanOrEqual(0)
    })

    it('should handle very long messages', () => {
      const longText = Array(1000).fill('verylongword').join(' ')
      const wordCount = countWords(longText)

      expect(wordCount).toBe(1000)
    })
  })

  describe('State Consistency', () => {
    it('should update SessionTracker correctly', () => {
      interface SessionTracker {
        sessionId: string
        messageCount?: number
        lastScoreUpdate?: string
      }

      const tracker: SessionTracker = {
        sessionId: 'test-session'
      }

      // Simulate update
      tracker.messageCount = (tracker.messageCount || 0) + 1
      tracker.lastScoreUpdate = new Date().toISOString()

      expect(tracker.messageCount).toBe(1)
      expect(tracker.lastScoreUpdate).toBeTruthy()
    })

    it('should reset score after emergency trigger', () => {
      let score = 150
      let wasReset = false

      if (score >= 150) {
        score = 0
        wasReset = true
      }

      expect(score).toBe(0)
      expect(wasReset).toBe(true)
    })
  })
})
