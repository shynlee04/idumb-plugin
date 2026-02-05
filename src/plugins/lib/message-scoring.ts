/**
 * Message Context Purification System
 *
 * Prevents context pollution through:
 * - Word count detection
 * - Flow indicator injection for short messages
 * - Accumulated scoring with decay for long messages
 * - Automatic purification triggers
 *
 * @module message-scoring
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import type { IdumbState, HistoryEntry } from './types'

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Scoring thresholds for purification triggers
 */
const THRESHOLDS = {
  WARNING: 50,     // Log warning
  PURIFY: 100,     // Inject purification context
  EMERGENCY: 150,  // Emergency halt
} as const

/**
 * Score decay rate: 10% per hour
 */
const DECAY_RATE = 0.10

/**
 * Decay interval in milliseconds (1 hour)
 */
const DECAY_INTERVAL = 3600000

/**
 * Short message word count threshold
 */
const SHORT_MESSAGE_WORDS = 20

/**
 * Long message word count threshold
 */
const LONG_MESSAGE_WORDS = 30

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Accumulated score tracking
 */
export interface AccumulatedScore {
  currentScore: number
  lastUpdated: string
  messageCount: number
  history: ScoreEvent[]
}

/**
 * Score change event
 */
export interface ScoreEvent {
  timestamp: string
  delta: number
  newScore: number
  reason: string
}

/**
 * Threshold levels
 */
export type ThresholdLevel = 'normal' | 'warning' | 'purify' | 'emergency'

/**
 * Score result with threshold
 */
export interface ScoreResult {
  score: number
  threshold: ThresholdLevel
  messageCount: number
}

// ============================================================================
// WORD COUNT DETECTION
// ============================================================================

/**
 * Counts words in text, excluding code blocks
 * @param text - Text to count
 * @returns Word count
 */
export function countWords(text: string): number {
  if (!text || text.trim().length === 0) {
    return 0
  }

  // Remove code blocks to avoid counting code as words
  const withoutCodeBlocks = text.replace(/```[\s\S]*?```/g, '')

  // Split by whitespace and count non-empty tokens
  const words = withoutCodeBlocks
    .split(/\s+/)
    .filter(w => w.trim().length > 0)

  return words.length
}

/**
 * Detects if text contains file context patterns
 * @param text - Text to check
 * @returns true if file context detected
 */
export function containsFileContext(text: string): boolean {
  if (!text) {
    return false
  }

  // File patterns: filename.ext, paths in backticks, file read outputs
  const filePatterns = [
    /[\w-]+\.[a-zA-Z0-9]+/g,           // filename.ext
    /`[\w\/\-\.]+`/g,                   // `path/to/file`
    /Read:.*\.md|Read:.*\.ts|Read:.*\.json/gi,  // Read: file outputs
    /\/\/ .*\.(ts|js|md|json)/g,         // Code comments with files
  ]

  for (const pattern of filePatterns) {
    if (pattern.test(text)) {
      return true
    }
  }

  return false
}

/**
 * Detects if the message is from a non-iDumb tool
 * @param messages - All messages in conversation
 * @returns true if last message is from other tool
 */
export function isOtherToolMessage(messages: any[]): boolean {
  if (!messages || messages.length === 0) {
    return false
  }

  const lastMessage = messages[messages.length - 1]

  // Check if message is from a tool (not user or assistant)
  const isToolMessage = lastMessage.role === 'tool'

  // Check if it's NOT an iDumb tool
  const isNotIdumbTool = lastMessage.tool?.name && !lastMessage.tool.name.startsWith('idumb-')

  return isToolMessage && isNotIdumbTool
}

// ============================================================================
// FLOW INDICATOR BUILDER
// ============================================================================

/**
 * Builds flow indicator for short messages
 * @param recentHistory - Recent action history
 * @param currentState - Current governance state
 * @returns Formatted flow indicator text
 */
export function buildFlowIndicator(
  recentHistory: HistoryEntry[],
  currentState: IdumbState
): string {
  let indicator = '📍 **Context:** You\'re working on '

  // Add current phase
  if (currentState.phase) {
    indicator += `**${currentState.phase}**`
  } else {
    indicator += 'this project'
  }

  // Add recent history (last 3)
  if (recentHistory && recentHistory.length > 0) {
    indicator += '\n\n**Recent activity:**\n'

    const lastThree = recentHistory.slice(-3).reverse()

    for (const entry of lastThree) {
      indicator += `- ${entry.action}`
      if (entry.agent) {
        indicator += ` (${entry.agent})`
      }
      indicator += '\n'
    }
  }

  indicator += '\n💡 **Continuing from above...**'

  return indicator
}

// ============================================================================
// ACCUMULATED SCORING SYSTEM
// ============================================================================

/**
 * Gets the score file path for a session
 * @param directory - Project directory
 * @param sessionId - Session ID
 * @returns Score file path
 */
function getScorePath(directory: string, sessionId: string): string {
  return join(directory, '.idumb', 'brain', 'sessions', `${sessionId}-score.json`)
}

/**
 * Loads accumulated score from disk
 * @param directory - Project directory
 * @param sessionId - Session ID
 * @returns Score data or null if not exists
 */
export function loadScore(directory: string, sessionId: string): AccumulatedScore | null {
  const scorePath = getScorePath(directory, sessionId)

  if (!existsSync(scorePath)) {
    return null
  }

  try {
    const content = readFileSync(scorePath, 'utf-8')
    return JSON.parse(content) as AccumulatedScore
  } catch (error) {
    return null
  }
}

/**
 * Saves accumulated score to disk
 * @param directory - Project directory
 * @param sessionId - Session ID
 * @param score - Score data to save
 */
export function saveScore(directory: string, sessionId: string, score: AccumulatedScore): void {
  const scorePath = getScorePath(directory, sessionId)

  try {
    // Ensure directory exists
    const scoreDir = dirname(scorePath)
    if (!existsSync(scoreDir)) {
      mkdirSync(scoreDir, { recursive: true })
    }

    writeFileSync(scorePath, JSON.stringify(score, null, 2), 'utf-8')
  } catch (error) {
    // Silent fail - don't break conversation
  }
}

/**
 * Calculates score for a single message
 * @param message - Message object
 * @returns Score contribution
 */
function calculateMessageScore(message: any): number {
  let score = 0

  // Extract text from message
  const text = message.parts
    ?.filter((p: any) => p.type === 'text')
    ?.map((p: any) => p.text)
    ?.join(' ') || ''

  if (!text || text.trim().length === 0) {
    return 0
  }

  // Word count score
  const wordCount = countWords(text)
  score += Math.floor(wordCount / 10)

  if (wordCount > 100) score += 5
  if (wordCount > 200) score += 10

  // File context score
  if (containsFileContext(text)) {
    const fileMatches = text.match(/[\w-]+\.[a-zA-Z0-9]+/g) || []
    score += fileMatches.length * 3
  }

  // Code blocks score
  const codeBlocks = text.match(/```[\s\S]*?```/g) || []
  score += codeBlocks.length * 3

  return score
}

/**
 * Applies time-based decay to score
 * @param score - Current score
 * @returns Decayed score
 */
export function decayScore(score: AccumulatedScore): AccumulatedScore {
  const now = Date.now()
  const lastUpdate = new Date(score.lastUpdated).getTime()
  const hoursElapsed = (now - lastUpdate) / DECAY_INTERVAL

  if (hoursElapsed < 1) {
    return score // Less than 1 hour, no decay
  }

  // Apply 10% decay per hour
  const decayFactor = Math.pow(1 - DECAY_RATE, hoursElapsed)
  const decayedScore = Math.max(0, score.currentScore * decayFactor)

  return {
    ...score,
    currentScore: Math.max(0, Math.floor(decayedScore)), // Ensure floor doesn't go below 0
    lastUpdated: new Date(now).toISOString(),
  }
}

/**
 * Updates accumulated score with a new message
 * @param directory - Project directory
 * @param sessionId - Session ID
 * @param message - New message to add
 * @returns Updated score result
 */
export function updateAccumulatedScore(
  directory: string,
  sessionId: string,
  message: any
): ScoreResult {
  // Load existing score or create new
  let score = loadScore(directory, sessionId)

  if (!score) {
    score = {
      currentScore: 0,
      lastUpdated: new Date().toISOString(),
      messageCount: 0,
      history: [],
    }
  }

  // Apply decay first
  score = decayScore(score)

  // Calculate message contribution
  const delta = calculateMessageScore(message)
  score.currentScore += delta
  score.messageCount += 1
  score.lastUpdated = new Date().toISOString()

  // Record history
  score.history.push({
    timestamp: new Date().toISOString(),
    delta,
    newScore: score.currentScore,
    reason: delta > 0 ? 'message_content' : 'time_decay',
  })

  // Keep only last 50 history entries
  if (score.history.length > 50) {
    score.history = score.history.slice(-50)
  }

  // Save updated score
  saveScore(directory, sessionId, score)

  // Determine threshold level
  let threshold: ThresholdLevel = 'normal'
  if (score.currentScore >= THRESHOLDS.EMERGENCY) {
    threshold = 'emergency'
  } else if (score.currentScore >= THRESHOLDS.PURIFY) {
    threshold = 'purify'
  } else if (score.currentScore >= THRESHOLDS.WARNING) {
    threshold = 'warning'
  }

  return {
    score: score.currentScore,
    threshold,
    messageCount: score.messageCount,
  }
}

/**
 * Resets accumulated score to zero
 * @param directory - Project directory
 * @param sessionId - Session ID
 */
export function resetScore(directory: string, sessionId: string): void {
  const score: AccumulatedScore = {
    currentScore: 0,
    lastUpdated: new Date().toISOString(),
    messageCount: 0,
    history: [],
  }

  saveScore(directory, sessionId, score)
}

// ============================================================================
// PURIFICATION CONTEXT BUILDER
// ============================================================================

/**
 * Builds purification context for injection
 * @param directory - Project directory
 * @param sessionId - Session ID
 * @param currentState - Current governance state
 * @returns Formatted purification context
 */
export function buildPurificationContext(
  directory: string,
  sessionId: string,
  currentState: IdumbState
): string {
  let context = '════════════════════════════════════════\n'
  context += '🧹 **CONTEXT PURIFICATION**\n'
  context += '════════════════════════════════════════\n\n'

  // Current phase
  if (currentState.phase) {
    context += `**Current Phase:** ${currentState.phase}\n\n`
  }

  // Critical and high-priority anchors
  if (currentState.anchors && currentState.anchors.length > 0) {
    const criticalAnchors = currentState.anchors.filter(a => a.priority === 'critical' || a.priority === 'high')

    if (criticalAnchors.length > 0) {
      context += '**Key Decisions to Remember:**\n'
      for (const anchor of criticalAnchors) {
        context += `- ${anchor.content}\n`
      }
      context += '\n'
    }
  }

  // Recent history
  if (currentState.history && currentState.history.length > 0) {
    const recentHistory = currentState.history.slice(-5).reverse()

    context += '**Recent Actions:**\n'
    for (const entry of recentHistory) {
      context += `- ${entry.action}`
      if (entry.agent) {
        context += ` (${entry.agent})`
      }
      context += '\n'
    }
    context += '\n'
  }

  context += '💡 **Continue with clean, focused context.**\n'
  context += '════════════════════════════════════════\n'

  return context
}
