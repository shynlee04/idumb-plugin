# Message Interception Specification

**Document:** MESSAGE-INTERCEPTION-SPEC.md  
**Date:** 2026-02-04  
**Version:** 1.0.0  
**Phase:** 1.6 - Permission Manipulation Mastery  
**Status:** Specification Ready for Implementation  

---

## Executive Summary

This document specifies the message interception logic for the iDumb plugin to handle different conversation scenarios intelligently. The system intercepts and transforms messages at the `experimental.chat.messages.transform` hook to:

1. **Inject governance context** at appropriate times
2. **Detect conversation patterns** (short/long messages)
3. **Trigger context purification** when accumulated complexity exceeds thresholds
4. **Maintain workflow continuity** across session boundaries

**Critical Constraint:** All interception logic MUST NOT break OpenCode TUI. The plugin operates in LOG-ONLY mode for safety.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    MESSAGE INTERCEPTION PIPELINE                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  User Message ──► messages.transform Hook ──► Scenario Detection       │
│                                                        │                │
│                        ┌───────────────────────────────┼────────────┐   │
│                        ▼                               ▼            ▼   │
│              ┌─────────────────┐  ┌──────────────┐  ┌──────────────┐   │
│              │ Scenario 1: New │  │ Scenario 2:  │  │ Scenario 3:  │   │
│              │ Conversation    │  │ Short Msg    │  │ Long Msg     │   │
│              │ (Order: 4)      │  │ (Order: 1)   │  │ (Order: 2)   │   │
│              └────────┬────────┘  └──────┬───────┘  └──────┬───────┘   │
│                       │                  │                 │           │
│              ┌────────▼────────┐  ┌──────▼───────┐  ┌──────▼───────┐   │
│              │ Initialize +    │  │ Inject Flow  │  │ Accumulated  │   │
│              │ Inject Prefix   │  │ Indicator    │  │ Scoring      │   │
│              └─────────────────┘  └──────────────┘  └──────────────┘   │
│                                                              │          │
│                                                              ▼          │
│                                                    ┌─────────────────┐  │
│                                                    │ Trigger Purify? │  │
│                                                    │ Score > Threshold│  │
│                                                    └────────┬────────┘  │
│                                                             │           │
│                                                             ▼           │
│                                                    ┌─────────────────┐  │
│                                                    │ New Session     │  │
│                                                    │ Manipulation    │  │
│                                                    └─────────────────┘  │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Scenario 4: Other Tool Messages (Order: 3)                      │   │
│  │ - Detect non-iDumb messages                                     │   │
│  │ - DO NOT interfere                                              │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Four Scenarios Specification

### Scenario 1: New Conversation Start

**Implementation Order:** 4 (Most Complex - Implement Last)

#### Triggers
| Trigger Type | Description | Detection Method |
|--------------|-------------|------------------|
| Manual Start | User manually starts new conversation | `session.created` event + no prior messages |
| Innate Compact | OpenCode's built-in context compaction | Message count drops significantly + compaction keywords |
| New Session Manipulation | iDumb-triggered context purification | Custom flag in session metadata |

#### Logic Flow

```
┌─────────────────┐
│  Detect Start   │
│  Condition      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     No     ┌─────────────────┐
│ Is this a new   │───────────►│ Skip Scenario 1 │
│ conversation?   │            │ processing      │
└────────┬────────┘            └─────────────────┘
         │ Yes
         ▼
┌─────────────────┐
│ Initialize      │
│ Context:        │
│ - Load state    │
│ - Check config  │
│ - Detect agent  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Build Governance│
│ Prefix:         │
│ - Language      │
│ - Hierarchy     │
│ - First Action  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Inject into     │
│ First User Msg  │
└─────────────────┘
```

#### Implementation Details

```typescript
// Detection Logic
function isNewConversation(
  messages: any[], 
  tracker: SessionTracker,
  sessionId: string
): boolean {
  // Condition 1: No governance injected yet
  if (tracker.governanceInjected) return false
  
  // Condition 2: Very few user messages (0 or 1)
  const userMessages = messages.filter(m => 
    m.info?.role === 'user' && 
    !m.parts?.some((p: any) => p.text?.includes('iDumb Governance'))
  )
  
  // Condition 3: Check for resumed session
  const isResumed = checkIfResumedSession(sessionId, directory)
  
  return (userMessages.length <= 1 || isResumed) && !tracker.governanceInjected
}

// Injection Logic
function injectGovernancePrefix(
  messages: any[],
  agentRole: string,
  directory: string,
  isResumed: boolean
): void {
  const prefix = buildGovernancePrefix(agentRole, directory, isResumed)
  
  // Find first non-governance user message
  const firstUserMsgIndex = messages.findIndex((m: any) => 
    m.info?.role === 'user' && 
    !m.parts?.some((p: any) => p.text?.includes('iDumb Governance'))
  )
  
  if (firstUserMsgIndex >= 0) {
    messages[firstUserMsgIndex].parts.unshift({
      type: 'text',
      text: prefix
    })
  }
}
```

#### TUI Safety Requirements
- ✅ Use `parts.unshift()` to prepend (not replace)
- ✅ Keep prefix under 2000 characters
- ✅ Avoid special Unicode characters
- ✅ Test with compacted sessions
- ❌ DO NOT modify message structure
- ❌ DO NOT inject into assistant messages

---

### Scenario 2: Short Message (< 20 words)

**Implementation Order:** 1 (Simplest - Implement First)

#### Trigger
- User sends brief message like "continue from above", "go on", "fix it"
- Word count < 20 words
- No file paths included

#### Logic Flow

```
┌─────────────────┐
│ Receive Message │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     No     ┌─────────────────┐
│ Word count < 20 │───────────►│ Skip to Scenario│
│ AND no files?   │            │ 3 check         │
└────────┬────────┘            └─────────────────┘
         │ Yes
         ▼
┌─────────────────┐
│ Gather Context: │
│ - Pinned initial│
│ - Conversation  │
│   summary       │
│ - Last 4 turns  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Build Flow      │
│ Indicator       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Inject into     │
│ Current Message │
└─────────────────┘
```

#### Context Sources

| Source | Priority | How to Access | Content |
|--------|----------|---------------|---------|
| Pinned Initial Context | Critical | First message in conversation | Original task description |
| Conversation Summary | High | State history + anchors | Recent actions, phase status |
| Last 4 Turns | Medium | Last 8 messages (4 pairs) | Recent context for adjustment |

#### Flow Indicator Format

```
┌─────────────────────────────────────────────────────────────┐
│ FLOW INDICATOR (Auto-Injected for Short Messages)           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 📍 CONTEXT REMINDER                                         │
│                                                             │
│ Original Task: [From pinned initial context]                │
│ Current Phase: [From state.json]                            │
│ Last Action: [From history]                                 │
│                                                             │
│ Recent Context (last 4 turns):                              │
│ - [Summary of turn -4]                                      │
│ - [Summary of turn -3]                                      │
│ - [Summary of turn -2]                                      │
│ - [Summary of turn -1]                                      │
│                                                             │
│ 💡 This is a short message. Continuing from above...        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Implementation

```typescript
// Word Count Logic
function countWords(text: string): number {
  // Split by whitespace and filter empty strings
  return text
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 0)
    .length
}

// File Context Detection
function containsFileContext(text: string): boolean {
  // Match common file path patterns
  const filePatterns = [
    /[\w-]+\.[a-zA-Z0-9]+/,           // filename.ext
    /\/[\w-]+(?:\/[\w-]+)*/,          // /path/to/file
    /\.[\/\\][\w-]+/,                 // ./file or .\file
    /[A-Za-z]:\\[\w\\-]+/,            // Windows paths
    /`[^`]+\.[a-zA-Z0-9]+`/,           // `filename.ext` in backticks
  ]
  
  return filePatterns.some(pattern => pattern.test(text))
}

// Short Message Detection
function isShortMessage(message: any): boolean {
  const text = message.parts
    ?.filter((p: any) => p.type === 'text')
    ?.map((p: any) => p.text)
    ?.join(' ') || ''
  
  const wordCount = countWords(text)
  const hasFiles = containsFileContext(text)
  
  return wordCount < 20 && !hasFiles
}

// Flow Indicator Builder
function buildFlowIndicator(directory: string): string {
  const state = readState(directory)
  const recentHistory = state?.history?.slice(-4) || []
  
  let indicator = `
📍 CONTEXT REMINDER

Current Phase: ${state?.phase || 'init'}
Last Validation: ${state?.lastValidation || 'Never'}
`

  if (recentHistory.length > 0) {
    indicator += '\nRecent Actions:\n'
    for (const entry of recentHistory) {
      indicator += `- ${entry.action} (${entry.agent})\n`
    }
  }
  
  indicator += '\n💡 Continuing from above...\n'
  
  return indicator
}
```

---

### Scenario 3: Long Message (> 30 words OR includes file context)

**Implementation Order:** 2 (Implement After Scenario 2)

#### Trigger
- Word count > 30 words
- OR message includes file paths/context
- Accumulated scoring threshold exceeded

#### Accumulated Scoring System

```
┌─────────────────────────────────────────────────────────────────┐
│                    ACCUMULATED SCORING ALGORITHM                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Score Components:                                              │
│  ─────────────────                                              │
│                                                                 │
│  1. Word Count Score                                            │
│     - Base: 1 point per 10 words                                │
│     - Long message (>100 words): +5 bonus                       │
│     - Very long (>200 words): +10 bonus                         │
│                                                                 │
│  2. File Context Score                                          │
│     - Each file path detected: +3 points                        │
│     - File content blocks: +5 points each                       │
│     - Multiple file types: +2 bonus                             │
│                                                                 │
│  3. Complexity Score                                            │
│     - Code blocks (```): +3 per block                           │
│     - URLs/references: +2 each                                  │
│     - Structured data (JSON/YAML): +5                           │
│                                                                 │
│  4. Session Age Factor                                          │
│     - Messages in last 10 min: 1.0x multiplier                  │
│     - Messages 10-30 min ago: 0.8x multiplier                   │
│     - Messages 30-60 min ago: 0.5x multiplier                   │
│     - Older messages: 0.2x multiplier                           │
│                                                                 │
│  Score Decay:                                                   │
│  ────────────                                                   │
│  - Decay rate: 10% per hour                                     │
│  - Minimum score: 0                                             │
│  - Reset on context purification                                │
│                                                                 │
│  Thresholds:                                                    │
│  ───────────                                                    │
│  - Warning: 50 points                                           │
│  - Purification Trigger: 100 points                             │
│  - Emergency: 150 points (immediate compact)                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Scoring Implementation

```typescript
interface AccumulatedScore {
  currentScore: number
  lastUpdated: string
  messageCount: number
  history: Array<{
    timestamp: string
    score: number
    reason: string
  }>
}

// Score storage path
function getScorePath(directory: string, sessionId: string): string {
  return join(directory, '.idumb', 'sessions', `${sessionId}-score.json`)
}

// Calculate message score
function calculateMessageScore(message: any): number {
  const text = message.parts
    ?.filter((p: any) => p.type === 'text')
    ?.map((p: any) => p.text)
    ?.join(' ') || ''
  
  let score = 0
  
  // 1. Word count score
  const wordCount = countWords(text)
  score += Math.floor(wordCount / 10)
  if (wordCount > 100) score += 5
  if (wordCount > 200) score += 10
  
  // 2. File context score
  const fileMatches = text.match(/[\w-]+\.[a-zA-Z0-9]+/g) || []
  score += fileMatches.length * 3
  
  // Code blocks
  const codeBlocks = text.match(/```[\s\S]*?```/g) || []
  score += codeBlocks.length * 3
  
  // URLs
  const urls = text.match(/https?:\/\/[^\s]+/g) || []
  score += urls.length * 2
  
  return score
}

// Apply decay based on time
function applyScoreDecay(scoreData: AccumulatedScore): number {
  const lastUpdate = new Date(scoreData.lastUpdated)
  const now = new Date()
  const hoursSince = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60)
  
  // Decay 10% per hour
  const decayFactor = Math.pow(0.9, hoursSince)
  return Math.floor(scoreData.currentScore * decayFactor)
}

// Update accumulated score
function updateAccumulatedScore(
  directory: string,
  sessionId: string,
  message: any
): { score: number; threshold: string } {
  const scorePath = getScorePath(directory, sessionId)
  
  // Load existing score
  let scoreData: AccumulatedScore = {
    currentScore: 0,
    lastUpdated: new Date().toISOString(),
    messageCount: 0,
    history: []
  }
  
  if (existsSync(scorePath)) {
    try {
      scoreData = JSON.parse(readFileSync(scorePath, 'utf8'))
      // Apply decay
      scoreData.currentScore = applyScoreDecay(scoreData)
    } catch {
      // Use defaults
    }
  }
  
  // Calculate new message score
  const messageScore = calculateMessageScore(message)
  
  // Update score
  scoreData.currentScore += messageScore
  scoreData.messageCount++
  scoreData.lastUpdated = new Date().toISOString()
  scoreData.history.push({
    timestamp: new Date().toISOString(),
    score: messageScore,
    reason: `Message #${scoreData.messageCount}: ${messageScore} points`
  })
  
  // Keep only last 20 history entries
  if (scoreData.history.length > 20) {
    scoreData.history = scoreData.history.slice(-20)
  }
  
  // Save score
  writeFileSync(scorePath, JSON.stringify(scoreData, null, 2))
  
  // Determine threshold status
  let threshold = 'normal'
  if (scoreData.currentScore >= 150) threshold = 'emergency'
  else if (scoreData.currentScore >= 100) threshold = 'purify'
  else if (scoreData.currentScore >= 50) threshold = 'warning'
  
  return { score: scoreData.currentScore, threshold }
}
```

#### Context Purification Trigger

When accumulated score exceeds threshold (100 points):

```typescript
function triggerContextPurification(
  directory: string,
  sessionId: string,
  currentScore: number
): void {
  // 1. Create checkpoint before purification
  const state = readState(directory)
  createCheckpoint(
    directory,
    state?.phase || 'init',
    'context-purification',
    'auto',
    `Score ${currentScore} exceeded threshold 100`
  )
  
  // 2. Build purification context
  const purificationContext = buildPurificationContext(directory, sessionId)
  
  // 3. Reset accumulated score
  const scorePath = getScorePath(directory, sessionId)
  if (existsSync(scorePath)) {
    const scoreData: AccumulatedScore = {
      currentScore: 0,
      lastUpdated: new Date().toISOString(),
      messageCount: 0,
      history: []
    }
    writeFileSync(scorePath, JSON.stringify(scoreData, null, 2))
  }
  
  // 4. Store purification context for next session
  storePurificationContext(directory, sessionId, purificationContext)
  
  // 5. Log purification event
  addHistoryEntry(
    directory,
    `context_purification:score=${currentScore}`,
    'plugin',
    'pass'
  )
}

// Build context to survive purification
function buildPurificationContext(
  directory: string,
  sessionId: string
): string {
  const state = readState(directory)
  const config = ensureIdumbConfig(directory)
  
  // Get file changes
  const fileChanges = getFileChanges(directory, state?.phase || 'init')
  
  // Get critical anchors
  const criticalAnchors = state?.anchors?.filter(a => 
    a.priority === 'critical' || a.priority === 'high'
  ) || []
  
  // Get recent history
  const recentHistory = state?.history?.slice(-5) || []
  
  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔄 CONTEXT PURIFICATION TRIGGERED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Context Purity Score: ${state?.validationCount || 0}/100
Files Modified: ${fileChanges.modified.length}
Files Created: ${fileChanges.created.length}

🎯 CRITICAL CONTEXT (survives purification):
${criticalAnchors.map(a => `- [${a.priority.toUpperCase()}] ${a.content}`).join('\n')}

📋 RECENT PROGRESS:
${recentHistory.map(h => `- ${h.action} (${h.agent})`).join('\n')}

⚡ NEXT TASKS (in order):
1. Review files modified above
2. Continue current phase: ${state?.phase || 'init'}
3. Check anchors for context

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`
}
```

---

### Scenario 4: Message from Other Tools

**Implementation Order:** 3 (Implement After Scenario 3)

#### Trigger
- Resume messages from other OpenCode tools
- Non-iDumb specific messages
- Tool-generated context

#### Detection Logic

```typescript
function isOtherToolMessage(message: any): boolean {
  const text = message.parts
    ?.filter((p: any) => p.type === 'text')
    ?.map((p: any) => p.text)
    ?.join(' ') || ''
  
  // Indicators of other tool messages
  const otherToolIndicators = [
    /\[Tool:\s*\w+\]/i,              // [Tool: name]
    /Generated by\s+\w+/i,           // Generated by tool
    /\w+\s+tool\s+result/i,         // Tool result
    /Resume from\s+\w+/i,            // Resume messages
    /Context from\s+\w+/i,           // Context from other tool
    /^\[\w+\]\s*/,                   // [ToolName] prefix
  ]
  
  // Check if message is from iDumb
  const isIdumbMessage = 
    text.includes('iDumb') ||
    text.includes('idumb-') ||
    text.includes('Governance Protocol')
  
  // If it matches other tool patterns and NOT iDumb patterns
  return otherToolIndicators.some(pattern => pattern.test(text)) && !isIdumbMessage
}
```

#### Action: DO NOT Interfere

```typescript
function handleOtherToolMessage(message: any): 'skip' | 'process' {
  if (isOtherToolMessage(message)) {
    // Log but do not modify
    log(directory, `[OTHER TOOL] Message detected, not interfering`)
    return 'skip'
  }
  return 'process'
}
```

#### Examples of Messages to Skip

| Message Type | Example | Action |
|--------------|---------|--------|
| Tool Result | `[Tool: grep] Found 3 matches...` | Skip |
| Resume Context | `Resume from codebase-mapper: ...` | Skip |
| External Plugin | `[Plugin: linter] Errors found...` | Skip |
| System Message | `Context has been compacted...` | Process (Scenario 1) |

---

## Word Count Logic

### Word Counting Algorithm

```typescript
interface WordCountResult {
  words: number
  tokens: number          // Approximate
  hasFileContext: boolean
  hasCodeBlocks: boolean
  complexity: 'low' | 'medium' | 'high'
}

function analyzeMessageContent(text: string): WordCountResult {
  // 1. Basic word count
  const words = text
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 0)
    .length
  
  // 2. Approximate token count (rough estimate: 1 token ≈ 0.75 words)
  const tokens = Math.ceil(words / 0.75)
  
  // 3. File context detection
  const filePatterns = [
    /[\w-]+\.[a-zA-Z0-9]{1,6}/,       // filename.ext
    /\/[\w-]+(?:\/[\w-]+)*/,          // /path/to/file
    /\.[\/\\][\w-]+/,                 // ./file or .\file
    /[A-Za-z]:\\[\w\\-]+/,            // Windows paths
    /`[^`]+\.[a-zA-Z0-9]+`/,           // `filename.ext`
    /\*\*[\w-]+\.[a-zA-Z0-9]+\*\*/,    // **filename.ext**
  ]
  const hasFileContext = filePatterns.some(pattern => pattern.test(text))
  
  // 4. Code block detection
  const hasCodeBlocks = /```[\s\S]*?```/.test(text)
  
  // 5. Complexity assessment
  let complexity: 'low' | 'medium' | 'high' = 'low'
  if (words > 100 || (hasFileContext && words > 50)) {
    complexity = 'high'
  } else if (words > 30 || hasFileContext) {
    complexity = 'medium'
  }
  
  return {
    words,
    tokens,
    hasFileContext,
    hasCodeBlocks,
    complexity
  }
}
```

### Threshold Definitions

| Metric | Short Message | Medium | Long Message |
|--------|--------------|--------|--------------|
| Words | < 20 | 20-30 | > 30 |
| Tokens (approx) | < 27 | 27-40 | > 40 |
| File Context | No | Maybe | Yes (triggers long) |
| Code Blocks | No | Maybe | Yes (triggers long) |
| Scenario | 2 | 2 or 3 | 3 |

---

## Flow Indicator Format

### Standard Flow Indicator

```
┌─────────────────────────────────────────────────────────────┐
│ 📍 iDumb FLOW INDICATOR                                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Short message detected. Providing context:                  │
│                                                             │
│ 🎯 CURRENT STATE                                            │
│    Phase: [phase]                                           │
│    Framework: [framework]                                   │
│    Last Action: [action]                                    │
│                                                             │
│ 📋 RECENT HISTORY (last 4 turns)                            │
│    1. [action 1]                                            │
│    2. [action 2]                                            │
│    3. [action 3]                                            │
│    4. [action 4]                                            │
│                                                             │
│ 🔗 ACTIVE ANCHORS                                           │
│    • [anchor 1]                                             │
│    • [anchor 2]                                             │
│                                                             │
│ 💡 Continuing from above...                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Compact Flow Indicator (for very short messages)

```
📍 [Phase: X | Last: action | Anchors: N] → Continuing...
```

---

## Implementation Priority

### Order: 1 → 2 → 3 → 4

```
┌─────────────────────────────────────────────────────────────┐
│              IMPLEMENTATION ROADMAP                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Phase 1: Scenario 2 (Short Messages)                       │
│  ────────────────────────────────────                       │
│  [✓] Word count logic                                       │
│  [✓] File context detection                                 │
│  [✓] Flow indicator builder                                 │
│  [✓] Injection logic                                        │
│  Dependencies: None                                         │
│  Risk: Low                                                  │
│                                                             │
│  Phase 2: Scenario 3 (Long Messages + Scoring)              │
│  ─────────────────────────────────────────────              │
│  [ ] Accumulated scoring algorithm                          │
│  [ ] Score persistence                                      │
│  [ ] Decay mechanism                                        │
│  [ ] Purification trigger                                   │
│  [ ] Context builder                                        │
│  Dependencies: Scenario 2                                   │
│  Risk: Medium                                               │
│                                                             │
│  Phase 3: Scenario 4 (Other Tools)                          │
│  ─────────────────────────────────                          │
│  [ ] Detection patterns                                     │
│  [ ] Skip logic                                             │
│  Dependencies: None (parallel with 2)                       │
│  Risk: Low                                                  │
│                                                             │
│  Phase 4: Scenario 1 (New Conversation)                     │
│  ─────────────────────────────────────                      │
│  [ ] Session start detection                                │
│  [ ] Resumption detection                                   │
│  [ ] Governance prefix builder                              │
│  [ ] Safe injection logic                                   │
│  [ ] TUI compatibility testing                              │
│  Dependencies: All above                                    │
│  Risk: High (TUI breakage)                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Dependencies Between Scenarios

```
Scenario 2 (Short) ──────┐
                         ├──► Scenario 1 (New Conversation)
Scenario 3 (Long) ───────┤    - Uses word count from 2
                         │    - Uses scoring from 3
Scenario 4 (Other) ──────┘    - Uses detection patterns
```

---

## TUI Safety Requirements

### What Can Break OpenCode TUI

| Risk Factor | Impact | Prevention |
|-------------|--------|------------|
| Special Unicode | Rendering issues | Use ASCII only |
| Box-drawing chars | Alignment problems | Avoid ━┃┏┓┗┛ |
| Very long text | Message truncation | Keep < 2000 chars |
| Nested formatting | Parsing errors | Simple markdown only |
| Message structure changes | Crashes | Only modify `parts` array |
| Assistant message injection | Logic errors | Only inject user messages |

### Safe Practices

```typescript
// ✅ SAFE: Prepend to parts array
message.parts.unshift({
  type: 'text',
  text: safeText
})

// ✅ SAFE: Append to parts array
message.parts.push({
  type: 'text',
  text: safeText
})

// ❌ UNSAFE: Replace entire message
message = { ... }  // DON'T DO THIS

// ❌ UNSAFE: Modify message metadata
message.info.role = 'assistant'  // DON'T DO THIS

// ❌ UNSAFE: Inject into assistant messages
if (message.info?.role === 'assistant') {
  message.parts.unshift(...)  // DON'T DO THIS
}
```

### Testing Checklist

Before deploying each scenario:

- [ ] Test with compacted session
- [ ] Test with 100+ messages
- [ ] Test with special characters in content
- [ ] Test with code blocks
- [ ] Test with file paths
- [ ] Test with non-English text
- [ ] Verify TUI renders correctly
- [ ] Verify no background text exposure
- [ ] Test error handling
- [ ] Test with --force flag

---

## Integration with Existing Hooks

### messages.transform Hook Structure

```typescript
"experimental.chat.messages.transform": async (input: any, output: any) => {
  try {
    const messages = output.messages
    const sessionId = detectSessionId(messages) || 'unknown'
    const tracker = getSessionTracker(sessionId)
    const agentRole = detectAgentFromMessages(messages)
    
    // ==========================================
    // SCENARIO 4: Check for other tool messages
    // ==========================================
    const lastMessage = messages[messages.length - 1]
    if (isOtherToolMessage(lastMessage)) {
      log(directory, '[SCENARIO 4] Other tool message, skipping')
      return
    }
    
    // ==========================================
    // SCENARIO 2: Short message handling
    // ==========================================
    if (isShortMessage(lastMessage)) {
      log(directory, '[SCENARIO 2] Short message detected')
      const flowIndicator = buildFlowIndicator(directory)
      // Inject flow indicator...
    }
    
    // ==========================================
    // SCENARIO 3: Long message + accumulated scoring
    // ==========================================
    else if (isLongMessage(lastMessage)) {
      log(directory, '[SCENARIO 3] Long message detected')
      const { score, threshold } = updateAccumulatedScore(
        directory, 
        sessionId, 
        lastMessage
      )
      
      if (threshold === 'purify' || threshold === 'emergency') {
        triggerContextPurification(directory, sessionId, score)
      }
    }
    
    // ==========================================
    // SCENARIO 1: New conversation start
    // ==========================================
    if (isNewConversation(messages, tracker, sessionId)) {
      log(directory, '[SCENARIO 1] New conversation detected')
      injectGovernancePrefix(messages, agentRole, directory, 
        checkIfResumedSession(sessionId, directory))
    }
    
  } catch (error) {
    log(directory, `[ERROR] messages.transform: ${error}`)
  }
}
```

---

## State Persistence

### Files Used

| File | Purpose | Schema |
|------|---------|--------|
| `.idumb/brain/sessions/{sessionId}.json` | Session metadata | `SessionMetadata` |
| `.idumb/brain/sessions/{sessionId}-score.json` | Accumulated score | `AccumulatedScore` |
| `.idumb/brain/sessions/{sessionId}-purify.json` | Purification context | `PurificationContext` |
| `.idumb/brain/state.json` | Global state | `IdumbState` |

### Session Metadata Schema

```typescript
interface SessionMetadata {
  sessionId: string
  createdAt: string
  lastUpdated: string
  phase: string
  governanceLevel: string
  delegationDepth: number
  parentSession: string | null
  language: {
    communication: string
    documents: string
  }
  // Enhanced for message interception
  compactedAt?: string
  contextSize?: string | number
  resumedAt?: string
  idleAt?: string
  purificationCount?: number
  lastPurificationAt?: string
}
```

---

## Error Handling

### Fallback Strategy

```typescript
// All hooks wrapped in try/catch
// Silent fail with logging - never break OpenCode

try {
  // Interception logic
} catch (error) {
  log(directory, `[ERROR] messages.transform: ${error}`)
  // Continue without modification
}
```

### Graceful Degradation

| Failure Mode | Behavior |
|--------------|----------|
| Score file corrupted | Reset to 0, log warning |
| State unreadable | Skip injection, log error |
| Message structure unexpected | Skip processing |
| TUI compatibility issue | Disable injection for session |
| Permission denied | Log only, don't block |

---

## Success Metrics

### KPIs

| Metric | Target | Measurement |
|--------|--------|-------------|
| Short message context recovery | > 90% | User doesn't need to repeat context |
| Purification trigger accuracy | > 95% | Triggered at right time, not too early/late |
| TUI breakage incidents | 0 | Manual testing + user reports |
| False positive (other tools) | < 5% | Messages incorrectly intercepted |
| Performance overhead | < 50ms | Hook execution time |

### Validation Tests

```typescript
// Test cases for each scenario
const testCases = {
  scenario2: [
    { input: 'continue', expected: 'flow_indicator_injected' },
    { input: 'fix it', expected: 'flow_indicator_injected' },
    { input: 'go on with the plan', expected: 'flow_indicator_injected' },
  ],
  scenario3: [
    { input: '50 words with files', expected: 'score_updated' },
    { input: 'score > 100', expected: 'purification_triggered' },
  ],
  scenario4: [
    { input: '[Tool: grep] result', expected: 'skip_interception' },
    { input: 'Resume from mapper', expected: 'skip_interception' },
  ]
}
```

---

## References

### Related Documents

1. **SESSION-HANDOFF-2026-02-03-PERMISSION-MANIPULATION.md** - Task 3 requirements
2. **template/plugins/idumb-core.ts** - Existing hook implementations
3. **template/router/chain-enforcement.md** - Chain rules
4. **AGENTS.md** - Agent hierarchy and permissions

### OpenCode API References

- `experimental.chat.messages.transform` - Message interception hook
- `session.created` / `session.compacted` / `session.idle` - Session events
- Message structure: `{ info: {...}, parts: [...] }`

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-02-04 | Initial specification |

---

*Document created by @idumb-phase-researcher*  
*Part of Phase 1.6: Permission Manipulation Mastery*  
*Status: Ready for Implementation*
