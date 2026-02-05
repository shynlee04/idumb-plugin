# Message Context Purification - Implementation PRD

**Document:** message-interception-implementation-2026-02-05.md
**Date:** 2026-02-05
**Status:** Ready for Implementation
**Priority:** P1 (Critical for governance integrity)

---

## Executive Summary

Implement message context purification system to prevent context pollution at the 80% compaction threshold. This system detects short/long messages, injects flow indicators, and tracks accumulated context toxicity scores with automatic purification triggers.

### Success Criteria
- ✅ Word count detection accurate
- ✅ Short messages (< 20 words, no files) receive flow indicators
- ✅ Long messages (> 30 words OR files) tracked with decay scoring
- ✅ Purification triggers at score thresholds (50/100/150)
- ✅ Score persistence across compactions
- ✅ TUI-safe (file logging only)

---

## User Stories

### Story 1: Short Message Flow Indicators
**As** an AI agent
**I want** short messages without file context to receive flow indicators
**So that** I understand conversation continuity after compaction

**Acceptance Criteria:**
- Messages < 20 words without file patterns trigger flow indicator
- Flow indicator shows: "📍 Context: You're working on [X]"
- Recent history (last 3 actions) displayed
- Safe return for non-tool messages

### Story 2: Long Message Accumulated Scoring
**As** the governance system
**I want** to track accumulated context toxicity from long messages
**So that** I can automatically purify before context poisoning occurs

**Acceptance Criteria:**
- Messages > 30 words OR with file context increase score
- Score decays 10% per hour
- Score persists to `.idumb/brain/sessions/{id}-score.json`
- Thresholds trigger actions:
  - 50: Warning logged
  - 100: Purification context injected
  - 150: Emergency halt

### Story 3: Context Purification Trigger
**As** an AI agent
**I want** context to be purified when toxicity threshold reached
**So that** I can continue with clean, focused context

**Acceptance Criteria:**
- Purification includes: current phase, recent anchors, active todos
- Trigger logged to governance log
- Score reset after purification
- Agent can continue work immediately

---

## Technical Architecture

### Components

#### 1. Word Count Detection
```typescript
// Location: src/plugins/lib/message-scoring.ts (NEW FILE)

export function countWords(text: string): number
export function containsFileContext(text: string): boolean
export function isOtherToolMessage(messages: any[]): boolean
```

#### 2. Flow Indicator Builder
```typescript
// Location: src/plugins/lib/message-scoring.ts

export function buildFlowIndicator(
  recentHistory: HistoryEntry[],
  currentState: IdumbState
): string
```

#### 3. Accumulated Scoring System
```typescript
// Location: src/plugins/lib/message-scoring.ts

export interface AccumulatedScore {
  currentScore: number
  lastUpdated: string
  messageCount: number
  history: ScoreEvent[]
}

export function updateAccumulatedScore(
  directory: string,
  sessionId: string,
  message: any
): { score: number; threshold: 'normal' | 'warning' | 'purify' | 'emergency' }

export function loadScore(directory: string, sessionId: string): AccumulatedScore | null
export function saveScore(directory: string, sessionId: string, score: AccumulatedScore): void
export function decayScore(score: AccumulatedScore): AccumulatedScore
export function resetScore(directory: string, sessionId: string): void
```

#### 4. Purification Context Builder
```typescript
// Location: src/plugins/lib/message-scoring.ts

export function buildPurificationContext(
  directory: string,
  sessionId: string,
  currentState: IdumbState
): string
```

### Data Flow

```
messages.transform hook
    ↓
┌─────────────────────────────────────┐
│ Detect: Short message? (< 20 words) │
│   ├─ Yes → Inject flow indicator    │
│   └─ No  → Continue                │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ Detect: Long message? (> 30 words)  │
│   ├─ Yes → Update accumulated score │
│   │         ├─ Score > 50 → Warning │
│   │         ├─ Score > 100 → Purify│
│   │         └─ Score > 150 → Halt  │
│   └─ No  → Continue                │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ Detect: Other tool message?         │
│   ├─ Yes → Early return             │
│   └─ No  → Continue processing     │
└─────────────────────────────────────┘
```

---

## Implementation Tasks

### Phase 1: Core Scoring Library (Day 1)

**Task 1.1: Create message-scoring.ts**
- [ ] Create `src/plugins/lib/message-scoring.ts`
- [ ] Implement `countWords()` function
- [ ] Implement `containsFileContext()` function
- [ ] Implement `isOtherToolMessage()` function
- [ ] Add comprehensive tests

**Task 1.2: Implement Flow Indicator Builder**
- [ ] Implement `buildFlowIndicator()` function
- [ ] Format: Recent history + current phase + continuation prompt
- [ ] Test with various history states

**Task 1.3: Implement Accumulated Scoring**
- [ ] Create `AccumulatedScore` interface
- [ ] Implement `calculateMessageScore()` function
- [ ] Implement `decayScore()` function (10% per hour)
- [ ] Implement `updateAccumulatedScore()` function
- [ ] Implement `loadScore()` / `saveScore()` functions
- [ ] Add score persistence tests

**Task 1.4: Implement Purification Builder**
- [ ] Implement `buildPurificationContext()` function
- [ ] Include: current phase, anchors (critical/high), active todos
- [ ] Format as governance prefix

**Task 1.5: Export from lib/index.ts**
- [ ] Add exports for all new functions
- [ ] Update TypeScript types

### Phase 2: Plugin Integration (Day 2)

**Task 2.1: Update SessionTracker Interface**
- [ ] Add `accumulatedScore?: number`
- [ ] Add `messageCount?: number`
- [ ] Add `lastScoreUpdate?: string`

**Task 2.2: Integrate Scenario 2 (Short Messages)**
- [ ] Detect last user message
- [ ] Check word count < 20 AND no file context
- [ ] Inject flow indicator using `buildFlowIndicator()`
- [ ] Log injection event
- [ ] Test with various message lengths

**Task 2.3: Integrate Scenario 3 (Long Messages)**
- [ ] Detect long messages (> 30 words OR file context)
- [ ] Call `updateAccumulatedScore()`
- [ ] Check threshold levels
- [ ] Call `buildPurificationContext()` at purify threshold
- [ ] Reset score after purification
- [ ] Test scoring decay over time

**Task 2.4: Integrate Scenario 4 (Other Tools)**
- [ ] Detect non-iDumb tool messages
- [ ] Early return to prevent interference
- [ ] Log early returns

**Task 2.5: Update Compact Threshold**
- [ ] Verify 80% threshold enforcement
- [ ] Test purification trigger at compact
- [ ] Validate score persistence across compact

### Phase 3: Testing & Validation (Day 3)

**Task 3.1: Unit Tests**
- [ ] Test word count edge cases (empty, whitespace, code blocks)
- [ ] Test file context detection (various patterns)
- [ ] Test score calculation (various message types)
- [ ] Test score decay (time-based)
- [ ] Test flow indicator formatting

**Task 3.2: Integration Tests**
- [ ] Test short message injection
- [ ] Test long message scoring
- [ ] Test threshold triggers (50, 100, 150)
- [ ] Test purification context building
- [ ] Test other tool early return

**Task 3.3: Manual Testing**
- [ ] Create test session with mixed message lengths
- [ ] Verify flow indicators appear
- [ ] Verify score accumulation
- [ ] Verify purification triggers
- [ ] Check TUI safety (no console output)

---

## File Changes Summary

### New Files
```
src/plugins/lib/message-scoring.ts       # Core scoring library
src/plugins/lib/__tests__/message-scoring.test.ts  # Tests
docs/prds/message-interception-implementation-2026-02-05.md  # This file
```

### Modified Files
```
src/plugins/idumb-core.ts               # Plugin hook integration
src/plugins/lib/index.ts                # Export new functions
.idumb/brain/sessions/{id}-score.json  # Score persistence (runtime)
```

---

## Test Strategy

### Unit Test Coverage
```typescript
describe('Message Scoring', () => {
  describe('countWords', () => {
    it('should handle empty text', () => {})
    it('should count words in plain text', () => {})
    it('should ignore code blocks', () => {})
    it('should handle markdown formatting', () => {})
  })

  describe('containsFileContext', () => {
    it('should detect file patterns', () => {})
    it('should detect code blocks', () => {})
    it('should detect tool outputs', () => {})
  })

  describe('Accumulated Scoring', () => {
    it('should calculate message score', () => {})
    it('should decay score over time', () => {})
    it('should persist and load scores', () => {})
    it('should detect threshold levels', () => {})
  })

  describe('Flow Indicator', () => {
    it('should build indicator with history', () => {})
    it('should handle empty history', () => {})
    it('should format correctly', () => {})
  })
})
```

### Integration Test Scenarios
1. **Short message without context** → Flow indicator injected
2. **Short message with files** → No indicator (has context)
3. **Long message** → Score increased, logged
4. **Multiple long messages** → Score accumulates, triggers purification
5. **Compaction at 80%** → Purification context injected
6. **Other tool message** → Early return, no processing

---

## Rollback Plan

### If Scoring Issues Occur
```bash
# Disable scoring in config.json
{
  "messageScoring": {
    "enabled": false
  }
}

# Uninstall changes
npm run uninstall
git checkout src/plugins/idumb-core.ts
npm run install:local
```

### If Performance Issues Occur
```typescript
// Reduce decay calculation frequency
const DECAY_INTERVAL = 3600000 // 1 hour instead of real-time

// Skip file context detection (regex heavy)
const SKIP_FILE_DETECTION = true
```

### If False Positives Occur
```yaml
# Adjust thresholds in config.json
thresholds:
  warning: 75      # Increase from 50
  purify: 150      # Increase from 100
  emergency: 225   # Increase from 150
```

---

## Dependencies

### Required (Already Installed)
- `gray-matter` - For frontmatter parsing
- `uuid` - For session IDs

### No New Dependencies Required

---

## Timeline Estimate

- **Phase 1**: 4-6 hours (Core library)
- **Phase 2**: 3-4 hours (Integration)
- **Phase 3**: 2-3 hours (Testing)
- **Total**: 9-13 hours (1.5-2 days)

---

## Risk Assessment

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Performance degradation (scoring on every message) | HIGH | LOW | Efficient algorithms, lazy loading |
| False positives (wrong flow indicators) | MEDIUM | LOW | Comprehensive testing |
| Score corruption (file I/O errors) | HIGH | LOW | Error handling, validation |
| TUI pollution (console.log) | HIGH | VERY LOW | File logging only, verified |

---

## Success Metrics

- ✅ All unit tests pass (>90% coverage)
- ✅ All integration tests pass
- ✅ Zero console output (TUI-safe)
- ✅ Score files created and persisted
- ✅ Flow indicators injected at correct times
- ✅ Purification triggers at thresholds
- ✅ No performance regression (>100ms per message)

---

## Related Documents

- [MESSAGE-INTERCEPTION-RESEARCH-2026-02-04.md](.plugin-dev/research/MESSAGE-INTERCEPTION-RESEARCH-2026-02-04.md) - Research foundation
- [MESSAGE-INTERCEPTION-SPEC.md](.plugin-dev/research/MESSAGE-INTERCEPTION-SPEC.md) - Detailed specifications
- [learning-from-session-ses_3d57.md](.plugin-dev/study-pitfalls/learning-from-session-ses_3d57.md) - Context poisoning examples

---

**Status:** ✅ READY FOR IMPLEMENTATION

**Next Steps:**
1. Review and approve PRD
2. Begin Phase 1: Core Scoring Library
3. Create `src/plugins/lib/message-scoring.ts`
