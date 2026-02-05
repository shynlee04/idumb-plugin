# Session Tracking Reference

Complete session state and delegation depth management from `src/plugins/lib/session-tracker.ts`.

## Session Tracker Interface

```typescript
interface SessionTracker {
  firstToolUsed: boolean
  firstToolName: string | null
  agentRole: string | null
  delegationDepth: number
  sessionLevel: number  // 1=root, 2+=all
  parentSession: string | null
  violationCount: number
  governanceInjected: boolean
}
```

## Session Lifecycle States

### State Detection

```yaml
session_states:
  new:
    condition: "firstToolUsed = false"
    protocol: "Inject full governance context"

  active:
    condition: "idle < 1 hour"
    protocol: "Continue normal delegation"

  resumed:
    condition: "idle 1-48 hours"
    protocol: "Re-establish context, verify phase"

  stale:
    condition: "idle > 48 hours"
    protocol: "Require user confirmation"

  compacted:
    condition: "context window full"
    protocol: "Use anchors for continuity"
```

### Idle Time Calculation

```typescript
function checkIfResumedSession(
  sessionId: string,
  directory: string
): boolean {
  const metadata = loadSessionMetadata(directory, sessionId)
  if (metadata) {
    const lastUpdated = new Date(metadata.lastUpdated)
    const now = new Date()
    const hoursSinceUpdate = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60)
    // Resumed if idle for > 1 hour but < 48 hours
    return hoursSinceUpdate > 1 && hoursSinceUpdate < 48
  }
  return false
}
```

## Delegation Depth

### Depth Levels

| Level | Description | Max Allowed |
|-------|-------------|-------------|
| 0 | Root session (user) | N/A |
| 1 | Primary agent (coordinator) | N/A |
| 2 | Mid-level (governance) | N/A |
| 3 | Validator | N/A |
| 4 | Builder | N/A |
| 5+ | **LOOP DETECTED** | **STOP** |

### all Detection

```yaml
all_indicators:
  - "First message contains 'Task:' delegation"
  - "Tracker.delegationDepth > 0"
  - "Message contains '@idumb-' agent invocation"
  - "Contains 'all_type' parameter"
  - "Contains 'delegated from' pattern"

all_rules:
  - "Do NOT inject full governance (causes bloat)"
  - "Inject task-specific context only"
  - "Track parent session for return path"
  - "Limit delegation depth to 4"
```

### Detection Code

```typescript
function detectallSession(
  messages: any[],
  tracker: SessionTracker
): boolean {
  // Check tracker depth
  if (tracker.delegationDepth > 0) return true

  // Check for task patterns in first user message
  const firstUserMsg = messages.find(m => m.info?.role === 'user')
  if (firstUserMsg) {
    const text = firstUserMsg.parts?.map(p => p.text).join(' ') || ''

    const allIndicators = [
      'Task:',                    // Explicit delegation
      'delegated from',           // Delegation context
      '@idumb-',                  // iDumb agent call
      'all_type',            // OpenCode task() arg
      'Subtask:',                 // Subtask indicator
      'Delegating to:',           // Delegation marker
      /from @\w+-coordinator/i    // Coordinator pattern
    ]

    for (const indicator of allIndicators) {
      if (typeof indicator === 'string') {
        if (text.includes(indicator)) return true
      } else if (indicator instanceof RegExp) {
        if (indicator.test(text)) return true
      }
    }
  }

  return false
}
```

## Session Metadata

### Metadata Structure

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
  // Lifecycle tracking
  compactedAt?: string
  contextSize?: string | number
  resumedAt?: string
  idleAt?: string
}
```

### Metadata Storage

```yaml
location: ".idumb/brain/sessions/{sessionId}.json"
update_policy: "Update lastUpdated on each access"
creation: "Auto-create on session.created hook"
```

## Resume Context Building

### Resume Template

```typescript
function buildResumeContext(
  sessionId: string,
  directory: string
): string {
  const state = readState(directory)
  const metadata = loadSessionMetadata(directory, sessionId)
  const hoursSinceLastUpdate = Math.round(
    (new Date().getTime() - new Date(metadata.lastUpdated).getTime())
    / (1000 * 60 * 60)
  )

  // Get high priority anchors
  const activeAnchors = state?.anchors?.filter(a =>
    a.priority === 'critical' || a.priority === 'high'
  ) || []

  return `
📋 SESSION RESUMED

⏱️  Idle Duration: ${hoursSinceLastUpdate} hours
📅 Previous Session: ${new Date(metadata.createdAt).toLocaleString()}
🎯 Current Phase: ${state?.phase || metadata.phase}
📌 Active Anchors: ${activeAnchors.length}

🔔 Key Context:
${activeAnchors.slice(0, 3).map(a =>
  `   • [${a.priority.toUpperCase()}] ${a.content.substring(0, 80)}...`
).join('\n')}

⚡ Resuming workflow...
`
}
```

## Governance Injection

### Injection by Session Level

```yaml
root_session:
  when: "sessionLevel = 1"
  inject: "Full governance context + anchors"
  includes:
    - "Current phase and framework"
    - "All critical and high anchors"
    - "Recent action history (last 5)"
    - "Chain enforcement rules"
    - "Agent hierarchy"

all_session:
  when: "sessionLevel >= 2"
  inject: "Minimal context + task scope"
  includes:
    - "Task-specific requirements"
    - "Relevant anchors only"
    - "Parent session reference"
    - "Return path"
  excludes:
    - "Full governance context"
    - "Complete chain rules"
    - "Unrelated anchors"

resumed_all:
  when: "sessionLevel >= 2 AND idle > 1 hour"
  inject: "Re-establish delegation chain"
  includes:
    - "Parent session status"
    - "Original task context"
    - "Delegation ID for tracking"
```

## Staleness Detection

### Thresholds

```yaml
staleness:
  warning:
    hours: 48
    action: "Warn user of stale context"

  critical:
    hours: 168  # 7 days
    action: "Require explicit acknowledgment"

  auto_archive:
    hours: 720  # 30 days
    action: "Archive session, suggest re-init"
```

### State Check

```typescript
function isStateStale(
  directory: string,
  config: { staleness?: { warningHours?: number; criticalHours?: number } }
): { stale: boolean; hours: number; critical: boolean } {
  const state = readState(directory)
  if (!state) return { stale: true, hours: Infinity, critical: true }

  const warningHours = config.staleness?.warningHours ?? 48
  const criticalHours = config.staleness?.criticalHours ?? 168

  const lastValidation = state.lastValidation
    ? new Date(state.lastValidation)
    : new Date(state.initialized)

  const now = new Date()
  const hoursSince = (now.getTime() - lastValidation.getTime()) / (1000 * 60 * 60)

  return {
    stale: hoursSince > warningHours,
    critical: hoursSince > criticalHours,
    hours: Math.round(hoursSince)
  }
}
```

## Pending TODOs

### TODO Count from State

```typescript
function getPendingTodoCount(directory: string): number {
  const state = readState(directory)
  if (!state || !state.history) return 0

  const recentTasks = state.history.filter(entry => {
    const isTask = entry.action.startsWith('task:') || entry.action.includes('TODO')
    const isIncomplete = entry.result !== 'pass' || !entry.action.includes('complete')
    return isTask && isIncomplete
  })

  const todoEntries = state.history.filter(entry =>
    entry.action.toLowerCase().includes('todo') &&
    !entry.action.toLowerCase().includes('complete')
  )

  return Math.max(recentTasks.length, todoEntries.length, 0)
}
```

## Session File Structure

```
.idumb/
├── sessions/
│   ├── {sessionId}.json           # Session metadata
│   └── ...
├── brain/
│   ├── state.json                 # Governance state
│   ├── history/                   # Archived history
│   └── exports/                   # Session exports
└── execution/
    └── {phase}/
        └── checkpoint-{id}.json   # Phase checkpoints
```
