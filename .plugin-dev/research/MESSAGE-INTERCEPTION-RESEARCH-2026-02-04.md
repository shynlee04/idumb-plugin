# Message Interception Logic Research

**Document:** MESSAGE-INTERCEPTION-RESEARCH-2026-02-04.md  
**Researcher:** @idumb-phase-researcher  
**Date:** 2026-02-04  
**Phase:** 1.6 - Permission Manipulation Mastery  
**Status:** Research Complete - Ready for Implementation

---

## Executive Summary

This research document analyzes the current message interception implementation in `idumb-core.ts` against the specified 4 scenarios from user requirements. The analysis identifies **exact code locations** for modifications and documents the **gap between current and required functionality**.

### Key Findings

| Finding | Status | Priority |
|---------|--------|----------|
| Word count detection | NOT IMPLEMENTED | P1 - Critical |
| Accumulated scoring | NOT IMPLEMENTED | P1 - Critical |
| Flow indicator injection | NOT IMPLEMENTED | P1 - Critical |
| Other tool message detection | NOT IMPLEMENTED | P2 - Important |
| New conversation detection | PARTIALLY IMPLEMENTED | P3 - Enhancement |
| TUI safety measures | IMPLEMENTED | ✅ Verified |

---

## 1. Current Implementation Analysis

### 1.1 Hook Entry Point

**File:** `template/plugins/idumb-core.ts`  
**Hook:** `experimental.chat.messages.transform` (lines 2797-2924)

```typescript
// Current structure (line 2797-2924)
"experimental.chat.messages.transform": async (input: any, output: any) => {
  // EXISTING FEATURES:
  // 1. Agent role detection (line 2801)
  // 2. Session tracking (lines 2802-2804)
  // 3. Session start detection (lines 2806-2843)
  // 4. Post-compact detection (lines 2849-2918)
  
  // MISSING FEATURES:
  // - Word count detection
  // - Short/long message classification
  // - Flow indicator injection
  // - Accumulated scoring
  // - Other tool message detection
}
```

### 1.2 Existing Functions

| Function | Location | Purpose | Reusable? |
|----------|----------|---------|-----------|
| `detectAgentFromMessages()` | line 1097-1106 | Detect agent role from message text | ✅ Yes |
| `detectSessionId()` | line 1393-1399 | Extract session ID | ✅ Yes |
| `getSessionTracker()` | line 1060-1073 | Get/create session tracker | ✅ Yes |
| `buildGovernancePrefix()` | line 1251-1391 | Build governance context | ✅ Yes (for Scenario 1) |
| `buildPostCompactReminder()` | line 1548-1654 | Build post-compact context | ✅ Yes (for Scenario 1) |
| `readState()` | (various) | Read governance state | ✅ Yes |

### 1.3 SessionTracker Interface

**Location:** lines 1030-1038

```typescript
interface SessionTracker {
  firstToolUsed: boolean
  firstToolName: string | null
  agentRole: string | null
  delegationDepth: number
  parentSession: string | null
  violationCount: number
  governanceInjected: boolean
  // MISSING: accumulatedScore, lastMessageWordCount, messageCount
}
```

---

## 2. Four Scenarios Mapping

### Scenario 1: New Conversation Start

| Aspect | Current | Required | Gap |
|--------|---------|----------|-----|
| Detection | `userMessages.length <= 1 && !tracker.governanceInjected` | Manual, compact, new-session manipulation | ⚠️ Missing new-session manipulation trigger |
| Trigger Sources | session.created, low message count | session.created, compaction, iDumb-triggered | ⚠️ Missing iDumb-triggered source |
| Injection | `buildGovernancePrefix()` | Enhanced with purification context | ⚠️ Needs purification context integration |
| Code Location | lines 2816-2843 | Same location, enhanced | Modify existing |

**Current Code (lines 2816-2843):**
```typescript
if ((isSessionStart || isResumedSession) && agentRole) {
  log(directory, `Session start detected for ${agentRole}`)
  
  // Build governance prefix with resumption awareness
  let governancePrefix = buildGovernancePrefix(agentRole, directory, isResumedSession)
  
  // P1-T1: If resumed session, prepend resume context
  if (isResumedSession) {
    log(directory, `Session resumption detected for ${sessionId}`)
    const resumeContext = buildResumeContext(sessionId, directory)
    governancePrefix = resumeContext + governancePrefix
  }
  
  // ... injection logic
}
```

**Required Addition:**
```typescript
// Check for iDumb-triggered purification
const isPurifiedSession = checkIfPurifiedSession(sessionId, directory)
if (isPurifiedSession) {
  const purificationContext = loadPurificationContext(directory, sessionId)
  governancePrefix = purificationContext + governancePrefix
}
```

---

### Scenario 2: Short Message (< 20 words)

| Aspect | Current | Required | Gap |
|--------|---------|----------|-----|
| Word counting | NOT IMPLEMENTED | `countWords()` function | ❌ MISSING |
| File detection | NOT IMPLEMENTED | `containsFileContext()` | ❌ MISSING |
| Flow indicator | NOT IMPLEMENTED | `buildFlowIndicator()` | ❌ MISSING |
| Injection | N/A | Prepend to short messages | ❌ MISSING |

**Recommended Insertion Point:** After line 2804, before session start detection

```typescript
// NEW: Scenario 2 - Short Message Detection (INSERT AFTER line 2804)
const lastUserMessage = output.messages
  .filter((m: any) => m.info?.role === 'user')
  .slice(-1)[0]

if (lastUserMessage && !tracker.governanceInjected) {
  const messageText = lastUserMessage.parts
    ?.filter((p: any) => p.type === 'text')
    ?.map((p: any) => p.text)
    ?.join(' ') || ''
  
  const wordCount = countWords(messageText)
  const hasFileContext = containsFileContext(messageText)
  
  if (wordCount < 20 && !hasFileContext) {
    // Inject flow indicator
    const flowIndicator = buildFlowIndicator(directory)
    lastUserMessage.parts.unshift({
      type: 'text',
      text: flowIndicator
    })
    log(directory, `[SCENARIO 2] Flow indicator injected (${wordCount} words)`)
  }
}
```

**New Functions Required:**

```typescript
// Location: After line 1120 (after detectAgentFromMessages)

function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 0)
    .length
}

function containsFileContext(text: string): boolean {
  const filePatterns = [
    /[\w-]+\.[a-zA-Z0-9]{1,6}/,       // filename.ext
    /\/[\w-]+(?:\/[\w-]+)*/,          // /path/to/file
    /\.[\\/][\w-]+/,                   // ./file
    /[A-Za-z]:\\[\w\\-]+/,             // Windows paths
  ]
  return filePatterns.some(pattern => pattern.test(text))
}

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

### Scenario 3: Long Message (> 30 words OR file context)

| Aspect | Current | Required | Gap |
|--------|---------|----------|-----|
| Long detection | NOT IMPLEMENTED | Word count + file patterns | ❌ MISSING |
| Accumulated scoring | NOT IMPLEMENTED | Score tracking with decay | ❌ MISSING |
| Score persistence | NOT IMPLEMENTED | `.idumb/brain/sessions/{id}-score.json` | ❌ MISSING |
| Purification trigger | NOT IMPLEMENTED | Score > 100 threshold | ❌ MISSING |

**Recommended Insertion Point:** After Scenario 2 check, before post-compact detection

```typescript
// NEW: Scenario 3 - Long Message + Accumulated Scoring
if (lastUserMessage) {
  const wordCount = countWords(messageText) // reuse from above
  const hasFileContext = containsFileContext(messageText)
  
  if (wordCount > 30 || hasFileContext) {
    log(directory, `[SCENARIO 3] Long message detected (${wordCount} words, files=${hasFileContext})`)
    
    const { score, threshold } = updateAccumulatedScore(
      directory,
      sessionId,
      lastUserMessage
    )
    
    log(directory, `[SCORING] Score=${score}, Threshold=${threshold}`)
    
    if (threshold === 'purify' || threshold === 'emergency') {
      triggerContextPurification(directory, sessionId, score)
    }
  }
}
```

**Required Data Structure Addition to SessionTracker:**

```typescript
// Extend SessionTracker interface (line 1030-1038)
interface SessionTracker {
  // ... existing fields ...
  accumulatedScore?: number        // NEW
  messageCount?: number            // NEW
  lastScoreUpdate?: string         // NEW
}
```

**New Scoring Functions Required:**

```typescript
// Location: New section after line 1650 (after buildPostCompactReminder)

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

function getScorePath(directory: string, sessionId: string): string {
  return join(directory, '.idumb', 'sessions', `${sessionId}-score.json`)
}

function calculateMessageScore(message: any): number {
  const text = message.parts
    ?.filter((p: any) => p.type === 'text')
    ?.map((p: any) => p.text)
    ?.join(' ') || ''
  
  let score = 0
  
  // Word count score
  const wordCount = countWords(text)
  score += Math.floor(wordCount / 10)
  if (wordCount > 100) score += 5
  if (wordCount > 200) score += 10
  
  // File context score
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

function applyScoreDecay(scoreData: AccumulatedScore): number {
  const lastUpdate = new Date(scoreData.lastUpdated)
  const now = new Date()
  const hoursSince = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60)
  
  // Decay 10% per hour
  const decayFactor = Math.pow(0.9, hoursSince)
  return Math.floor(scoreData.currentScore * decayFactor)
}

function updateAccumulatedScore(
  directory: string,
  sessionId: string,
  message: any
): { score: number; threshold: string } {
  const scorePath = getScorePath(directory, sessionId)
  
  let scoreData: AccumulatedScore = {
    currentScore: 0,
    lastUpdated: new Date().toISOString(),
    messageCount: 0,
    history: []
  }
  
  if (existsSync(scorePath)) {
    try {
      scoreData = JSON.parse(readFileSync(scorePath, 'utf8'))
      scoreData.currentScore = applyScoreDecay(scoreData)
    } catch {
      // Use defaults on error
    }
  }
  
  const messageScore = calculateMessageScore(message)
  scoreData.currentScore += messageScore
  scoreData.messageCount++
  scoreData.lastUpdated = new Date().toISOString()
  scoreData.history.push({
    timestamp: new Date().toISOString(),
    score: messageScore,
    reason: `Message #${scoreData.messageCount}: ${messageScore} points`
  })
  
  if (scoreData.history.length > 20) {
    scoreData.history = scoreData.history.slice(-20)
  }
  
  // Ensure sessions directory exists
  const sessionsDir = join(directory, '.idumb', 'sessions')
  if (!existsSync(sessionsDir)) {
    mkdirSync(sessionsDir, { recursive: true })
  }
  
  writeFileSync(scorePath, JSON.stringify(scoreData, null, 2))
  
  let threshold = 'normal'
  if (scoreData.currentScore >= 150) threshold = 'emergency'
  else if (scoreData.currentScore >= 100) threshold = 'purify'
  else if (scoreData.currentScore >= 50) threshold = 'warning'
  
  return { score: scoreData.currentScore, threshold }
}

function triggerContextPurification(
  directory: string,
  sessionId: string,
  currentScore: number
): void {
  log(directory, `[PURIFICATION] Triggering for session ${sessionId}, score=${currentScore}`)
  
  // 1. Build purification context
  const state = readState(directory)
  const criticalAnchors = state?.anchors?.filter((a: Anchor) => 
    a.priority === 'critical' || a.priority === 'high'
  ) || []
  const recentHistory = state?.history?.slice(-5) || []
  
  const purificationContext = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔄 CONTEXT PURIFICATION TRIGGERED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Score: ${currentScore} (threshold: 100)

🎯 CRITICAL CONTEXT:
${criticalAnchors.map(a => `- [${a.priority.toUpperCase()}] ${a.content}`).join('\n')}

📋 RECENT PROGRESS:
${recentHistory.map(h => `- ${h.action} (${h.agent})`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`
  
  // 2. Store purification context for next session
  const purifyPath = join(directory, '.idumb', 'sessions', `${sessionId}-purify.json`)
  writeFileSync(purifyPath, JSON.stringify({
    context: purificationContext,
    timestamp: new Date().toISOString(),
    score: currentScore
  }, null, 2))
  
  // 3. Reset accumulated score
  const scorePath = getScorePath(directory, sessionId)
  writeFileSync(scorePath, JSON.stringify({
    currentScore: 0,
    lastUpdated: new Date().toISOString(),
    messageCount: 0,
    history: []
  }, null, 2))
  
  // 4. Log purification event
  addHistoryEntry(
    directory,
    `context_purification:score=${currentScore}`,
    'plugin',
    'pass'
  )
}
```

---

### Scenario 4: Message from Other Tools

| Aspect | Current | Required | Gap |
|--------|---------|----------|-----|
| Detection | NOT IMPLEMENTED | Pattern matching for tool messages | ❌ MISSING |
| Skip logic | NOT IMPLEMENTED | Early return to prevent interference | ❌ MISSING |

**Recommended Insertion Point:** FIRST check in messages.transform (after line 2804)

```typescript
// NEW: Scenario 4 - Other Tool Message Detection (FIRST CHECK)
const lastMessage = output.messages[output.messages.length - 1]
if (isOtherToolMessage(lastMessage)) {
  log(directory, '[SCENARIO 4] Other tool message detected, skipping interception')
  return  // DO NOT interfere
}
```

**New Detection Function:**

```typescript
// Location: After containsFileContext function

function isOtherToolMessage(message: any): boolean {
  if (!message) return false
  
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
  
  // Check if message is from iDumb (should NOT skip)
  const isIdumbMessage = 
    text.includes('iDumb') ||
    text.includes('idumb-') ||
    text.includes('Governance Protocol')
  
  // Skip only if it matches other tool patterns AND is NOT iDumb
  return otherToolIndicators.some(pattern => pattern.test(text)) && !isIdumbMessage
}
```

---

## 3. Word Count Detection Design

### Algorithm

```typescript
function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 0)
    .length
}
```

### Thresholds

| Category | Word Count | File Context | Action |
|----------|------------|--------------|--------|
| Short | < 20 | No | Inject flow indicator |
| Medium | 20-30 | Maybe | Normal processing |
| Long | > 30 | Any | Accumulated scoring |
| File-Heavy | Any | Yes | Accumulated scoring |

### Edge Cases

| Case | Handling |
|------|----------|
| Empty message | Return 0 words |
| Only whitespace | Return 0 words |
| Code blocks | Count all text including code |
| URLs | Count as single word each |
| File paths | Detected separately |

---

## 4. Accumulated Scoring Design

### Score Components

| Component | Points | Condition |
|-----------|--------|-----------|
| Base word count | 1 per 10 words | Always |
| Long message bonus | +5 | > 100 words |
| Very long bonus | +10 | > 200 words |
| File paths | +3 each | Pattern match |
| Code blocks | +3 each | ``` delimiters |
| URLs | +2 each | http/https |

### Decay Algorithm

```typescript
// Decay 10% per hour
const decayFactor = Math.pow(0.9, hoursSinceLastUpdate)
newScore = currentScore * decayFactor
```

### Thresholds

| Threshold | Score | Action |
|-----------|-------|--------|
| Normal | 0-49 | No action |
| Warning | 50-99 | Log warning |
| Purify | 100-149 | Trigger purification |
| Emergency | 150+ | Immediate compact |

### Persistence

**File:** `.idumb/brain/sessions/{sessionId}-score.json`

```json
{
  "currentScore": 85,
  "lastUpdated": "2026-02-04T10:30:00.000Z",
  "messageCount": 12,
  "history": [
    { "timestamp": "...", "score": 15, "reason": "Message #12: 15 points" }
  ]
}
```

---

## 5. Flow Indicator Format

### Standard Format (Short Messages)

```
📍 CONTEXT REMINDER

Current Phase: [phase]
Last Validation: [timestamp]

Recent Actions:
- [action 1] ([agent])
- [action 2] ([agent])
- [action 3] ([agent])
- [action 4] ([agent])

💡 Continuing from above...
```

### Character Limit

- Maximum: 500 characters
- Avoid box-drawing characters (TUI safety)
- Use simple emojis only

### Injection Method

```typescript
// SAFE: Prepend to parts array
message.parts.unshift({
  type: 'text',
  text: flowIndicator
})
```

---

## 6. TUI Safety Requirements

### Verified Safe Practices (from code analysis)

| Practice | Evidence | Line Reference |
|----------|----------|----------------|
| No console.log | "NO console.log - causes TUI background text exposure" | line 9 |
| File-based logging | `log()` function writes to file | line 1714 |
| Silent fail | "Silent fail with logging - never break OpenCode" | line 2788 |
| Try-catch wrapping | All hooks wrapped | lines 2776, 3132 |
| parts.unshift() | Used for injection | line 2835 |
| parts.push() | Used for appending | line 2914 |

### Forbidden Operations

| Operation | Reason | Line Reference |
|-----------|--------|----------------|
| Replace message object | Crashes TUI | (design principle) |
| Modify message.info | Logic errors | (design principle) |
| Inject into assistant messages | Logic errors | (design principle) |
| Special Unicode | Rendering issues | line 1538 |
| Box-drawing chars | Alignment problems | line 1538 |

### Testing Requirements

- [ ] Test with compacted session
- [ ] Test with 100+ messages
- [ ] Test with special characters
- [ ] Test with code blocks
- [ ] Test with file paths
- [ ] Verify no background text exposure

---

## 7. Recommended Implementation Order

### Phase 1: Scenario 2 (Short Messages) - LOW RISK

**Complexity:** Low  
**Dependencies:** None  
**Files Modified:** `idumb-core.ts`  
**New Functions:** `countWords()`, `containsFileContext()`, `buildFlowIndicator()`

**Steps:**
1. Add `countWords()` function after line 1120
2. Add `containsFileContext()` function
3. Add `buildFlowIndicator()` function
4. Add short message detection logic after line 2804
5. Test with various short message patterns

### Phase 2: Scenario 3 (Long Messages + Scoring) - MEDIUM RISK

**Complexity:** Medium  
**Dependencies:** Phase 1 (word count)  
**Files Modified:** `idumb-core.ts`  
**New Functions:** `calculateMessageScore()`, `updateAccumulatedScore()`, `triggerContextPurification()`

**Steps:**
1. Add AccumulatedScore interface
2. Add scoring functions
3. Add long message detection after short message check
4. Implement score persistence
5. Add purification trigger logic
6. Test score accumulation and decay

### Phase 3: Scenario 4 (Other Tools) - LOW RISK

**Complexity:** Low  
**Dependencies:** None (can parallel with Phase 2)  
**Files Modified:** `idumb-core.ts`  
**New Functions:** `isOtherToolMessage()`

**Steps:**
1. Add `isOtherToolMessage()` function
2. Add early return check at start of messages.transform
3. Test with various tool message patterns

### Phase 4: Scenario 1 Enhancement (New Conversation) - HIGH RISK

**Complexity:** High  
**Dependencies:** All above phases  
**Files Modified:** `idumb-core.ts`  
**New Functions:** `checkIfPurifiedSession()`, `loadPurificationContext()`

**Steps:**
1. Add purified session detection
2. Integrate purification context into governance prefix
3. Test with all conversation start scenarios
4. Verify TUI compatibility thoroughly

---

## 8. Code Location Summary

### Files to Modify

| File | Lines | Purpose |
|------|-------|---------|
| `template/plugins/idumb-core.ts` | 1120-1150 | New word/file detection functions |
| `template/plugins/idumb-core.ts` | 1030-1038 | Extend SessionTracker interface |
| `template/plugins/idumb-core.ts` | 1650-1850 | New scoring functions (new section) |
| `template/plugins/idumb-core.ts` | 2804-2850 | New scenario detection logic |

### New Files to Create

| File | Purpose |
|------|---------|
| `.idumb/brain/sessions/{id}-score.json` | Accumulated score persistence |
| `.idumb/brain/sessions/{id}-purify.json` | Purification context storage |

---

## 9. Risk Assessment

### Low Risk Items

- Word counting: Simple string manipulation
- File context detection: Pattern matching
- Flow indicator: Already proven pattern

### Medium Risk Items

- Score persistence: File I/O can fail
- Decay calculation: Math precision

### High Risk Items

- Context purification trigger: Could disrupt workflow
- Message injection: TUI compatibility concerns

### Mitigation Strategies

1. **Wrap all new code in try-catch** (existing pattern)
2. **Log extensively** for debugging
3. **Start with LOG-ONLY mode** before enabling injection
4. **Test each scenario independently** before integration

---

## 10. References

### Source Documents

1. **MESSAGE-INTERCEPTION-SPEC.md** - Detailed specification (1066 lines)
2. **User Requirements** - 4 scenarios definition
3. **idumb-core.ts** - Current implementation (~3300 lines)

### Related Components

- `SessionTracker` interface (line 1030)
- `buildGovernancePrefix()` (line 1251)
- `buildPostCompactReminder()` (line 1548)
- `messages.transform` hook (line 2797)

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-02-04 | Initial research document |

---

*Document created by @idumb-phase-researcher*  
*Part of Phase 1.6: Permission Manipulation Mastery*  
*Status: Research Complete*
