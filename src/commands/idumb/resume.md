---
description: "Resume a previously idle iDumb session with context recovery"
id: cmd-resume
parent: commands-idumb
mode: primary
temperature: 0.1
permission:
  task:
    "*": allow
  bash:
    "*": deny
  edit: deny
  write: deny
tools:
  write: false
  edit: false
  idumb-state: true
  idumb-config: true
---

# /idumb:resume

<objective>
Resume a previously idle iDumb session with full context recovery. Detect session state, load preserved anchors, restore workflow context, and provide a seamless continuation of work. This command bridges the gap caused by session timeouts, context compaction, or extended idle periods.
</objective>

<context>

## Usage

```bash
/idumb:resume                    # Auto-detect and resume
/idumb:resume --session=<id>     # Resume specific session
/idumb:resume --list             # List available sessions
/idumb:resume --force            # Force resume even if current session active
```

## Arguments

| Argument | Type | Description | Default |
|----------|------|-------------|---------|
| `--session` | string | Specific session ID to resume | Auto-detect |
| `--list` | flag | List all resumable sessions | `false` |
| `--force` | flag | Force resume even if active | `false` |

## When to Use

| Scenario | Use Resume? |
|----------|-------------|
| Returning after > 1 hour idle | Yes |
| Context lost due to compaction | Yes |
| Starting new conversation | Yes, if previous session exists |
| After browser/terminal crash | Yes |
| Continuing active work | No (already in context) |

## Prerequisites

- `.idumb/` directory exists
- Session metadata in `.idumb/brain/sessions/`
- State file at `.idumb/brain/state.json`

</context>

<process>

## Step 1: Detect Session State

Determine if this is a resumed session.

```bash
# Check for session files
SESSION_DIR=".idumb/brain/sessions"
if [ ! -d "$SESSION_DIR" ]; then
  echo "No session history found"
  FIRST_SESSION=true
fi

# Find most recent session
LATEST_SESSION=$(ls -t "$SESSION_DIR"/*.json 2>/dev/null | head -1)
```

```
Use tool: idumb-state_listSessions

Get:
  - Session IDs
  - Last activity timestamps
  - Status (active/idle/completed)
  - Phase at time of session
```

## Step 2: Calculate Idle Duration

Determine how long since last activity.

```yaml
idle_calculation:
  last_activity: <from session metadata>
  current_time: <now>
  idle_duration: current_time - last_activity
  
  thresholds:
    fresh: < 15 minutes (no resume needed)
    warm: 15 min - 1 hour (quick resume)
    cold: 1 - 24 hours (full resume)
    stale: > 24 hours (warn about context age)
```

## Step 3: Load Session Metadata

Retrieve session context from storage.

```bash
# Load session metadata
SESSION_FILE=".idumb/brain/sessions/${SESSION_ID}.json"
```

```
Use tool: idumb-state_exportSession

sessionId: <detected or specified>
includeHistory: true
includeAnchors: true
```

**Session Metadata Structure:**
```json
{
  "sessionId": "session-20260204-143000",
  "created": "2026-02-04T14:30:00Z",
  "lastActivity": "2026-02-04T16:45:00Z",
  "status": "idle",
  "phase": "phase-02",
  "agent": "idumb-executor",
  "context": {
    "workingOn": "API implementation",
    "lastTask": "Create user endpoint",
    "nextTask": "Add authentication"
  },
  "anchors": [
    {"id": "...", "type": "decision", "content": "..."}
  ]
}
```

## Step 4: Load Critical Anchors

Retrieve anchors that must survive compaction.

```
Use tool: idumb-state_getAnchors

priorityFilter: "critical"
```

**Anchor Categories:**
```yaml
anchor_types:
  decision:
    purpose: "Major decisions that affect work direction"
    retention: "Always restore"
    
  checkpoint:
    purpose: "Work-in-progress markers"
    retention: "Restore if < 24h"
    
  context:
    purpose: "Important context for understanding"
    retention: "Restore if < 48h"
    
  validation:
    purpose: "Validation findings"
    retention: "Restore if unresolved"
```

## Step 5: Build Resume Context

Construct context injection for conversation.

```yaml
resume_context:
  header: |
    ═══════════════════════════════════════════════
    RESUMING SESSION: ${sessionId}
    Idle duration: ${idle_duration}
    Previous phase: ${phase}
    ═══════════════════════════════════════════════
  
  state_summary:
    - Current phase: ${phase}
    - Framework: ${framework}
    - Last validation: ${lastValidation}
    
  active_anchors:
    critical:
      - ${anchor1}
      - ${anchor2}
    high:
      - ${anchor3}
      
  recent_history:
    - ${history[-1]}
    - ${history[-2]}
    - ${history[-3]}
    
  work_context:
    last_task: ${session.context.lastTask}
    next_task: ${session.context.nextTask}
    working_on: ${session.context.workingOn}
```

## Step 6: Check for Stale Context

Warn if context may be outdated.

```
Use tool: idumb-validate_freshness

maxAgeHours: 48
```

**Freshness Warnings:**
```yaml
freshness_check:
  if: idle_duration > 48h
    warning: "Context may be significantly outdated"
    recommendation: "Run /idumb:validate before continuing"
    
  if: idle_duration > 24h
    warning: "Some context may be stale"
    recommendation: "Review anchors before critical decisions"
    
  if: codebase_changed
    warning: "Codebase modified since last session"
    recommendation: "Run /idumb:map-codebase to refresh"
```

## Step 7: Verify Current State

Read current governance state for comparison.

```
Use tool: idumb-state

Read:
  - Current phase
  - Framework
  - Recent history
  - Validation status
```

## Step 8: Update Session Status

Mark session as resumed.

```
Use tool: idumb-state_modifySession

sessionId: <current>
status: "active"
summary: "Resumed after ${idle_duration}"
```

## Step 9: Display Resume Summary

Present context recovery to user.

</process>

<completion_format>

## Resume Success Output

```
┌─────────────────────────────────────────────────────────────────┐
│                      Session Resumed                            │
├─────────────────────────────────────────────────────────────────┤
│ Session:       session-20260204-143000                          │
│ Idle Duration: 2 hours 15 minutes                               │
│ Status:        ✓ Context recovered                              │
├─────────────────────────────────────────────────────────────────┤
│ Current State                                                   │
│ ├── Phase:      phase-02 (API Development)                      │
│ ├── Framework:  planning                                        │
│ └── Last Valid: 4 hours ago                                     │
├─────────────────────────────────────────────────────────────────┤
│ Work Context                                                    │
│ ├── Last Task:  Create user endpoint                            │
│ ├── Status:     Completed                                       │
│ └── Next Task:  Add authentication                              │
├─────────────────────────────────────────────────────────────────┤
│ Active Anchors (3)                                              │
│ ├── [CRITICAL] decision-phase2-arch: Layered architecture      │
│ ├── [HIGH] context-api-design: REST with OpenAPI                │
│ └── [NORMAL] checkpoint-task-3: User endpoint complete          │
├─────────────────────────────────────────────────────────────────┤
│ Recent History                                                  │
│ ├── 2h ago: task:completed (user endpoint)                      │
│ ├── 3h ago: test:passed (user endpoint tests)                   │
│ └── 4h ago: validation:completed (passed)                       │
├─────────────────────────────────────────────────────────────────┤
│ Ready to Continue                                               │
│                                                                 │
│ Suggested next action:                                          │
│ > Continue with: Add authentication to user endpoint            │
└─────────────────────────────────────────────────────────────────┘
```

## Resume with Warnings Output

```
┌─────────────────────────────────────────────────────────────────┐
│                      Session Resumed                            │
├─────────────────────────────────────────────────────────────────┤
│ Session:       session-20260203-100000                          │
│ Idle Duration: 28 hours                                         │
│ Status:        ⚠ Context recovered with warnings                │
├─────────────────────────────────────────────────────────────────┤
│ Warnings                                                        │
│ ├── ⚠ Session idle > 24h - some context may be stale           │
│ ├── ⚠ Codebase modified since last session                     │
│ └── ⚠ 2 validation warnings from last check                    │
├─────────────────────────────────────────────────────────────────┤
│ Recommendations                                                 │
│ 1. Run /idumb:validate to verify governance state               │
│ 2. Run /idumb:map-codebase to refresh codebase understanding    │
│ 3. Review anchors before making critical decisions              │
├─────────────────────────────────────────────────────────────────┤
│ Current State                                                   │
│ ├── Phase:      phase-02                                        │
│ └── Last Valid: 28 hours ago ⚠                                 │
└─────────────────────────────────────────────────────────────────┘
```

## List Sessions Output

```
┌─────────────────────────────────────────────────────────────────┐
│                    Available Sessions                           │
├─────────────────────────────────────────────────────────────────┤
│ ID                        │ Status │ Phase    │ Last Activity   │
│───────────────────────────┼────────┼──────────┼─────────────────│
│ session-20260204-143000   │ idle   │ phase-02 │ 2 hours ago     │
│ session-20260203-091500   │ idle   │ phase-02 │ 1 day ago       │
│ session-20260201-160000   │ done   │ phase-01 │ 3 days ago      │
├─────────────────────────────────────────────────────────────────┤
│ To resume: /idumb:resume --session=<id>                         │
└─────────────────────────────────────────────────────────────────┘
```

## No Session Found Output

```
┌─────────────────────────────────────────────────────────────────┐
│                    No Session to Resume                         │
├─────────────────────────────────────────────────────────────────┤
│ No previous session found for this project.                     │
│                                                                 │
│ This appears to be a fresh start.                               │
│                                                                 │
│ Getting started:                                                │
│ 1. /idumb:init      - Initialize governance                     │
│ 2. /idumb:status    - Check current state                       │
│ 3. /idumb:help      - Show all commands                         │
└─────────────────────────────────────────────────────────────────┘
```

</completion_format>

<success_criteria>

## Resume Completion Checklist

- [ ] Session state detected (first vs returning)
- [ ] Idle duration calculated
- [ ] Session metadata loaded
- [ ] Critical anchors retrieved
- [ ] Resume context built
- [ ] Freshness checked with warnings
- [ ] Current state verified
- [ ] Session status updated to active
- [ ] Summary displayed to user
- [ ] Next action suggested

## Context Recovery Criteria

- [ ] All critical anchors restored
- [ ] High-priority anchors restored (if < 24h)
- [ ] Recent history included (last 5 entries)
- [ ] Work context restored (last/next task)
- [ ] Phase information accurate
- [ ] Framework information accurate

## Warning Conditions

| Condition | Warning Level | Message |
|-----------|---------------|---------|
| Idle > 24h | ⚠ Warning | "Context may be stale" |
| Idle > 48h | ⚠⚠ High | "Recommend validation" |
| Codebase changed | ⚠ Warning | "Codebase modified" |
| Last validation > 24h | ⚠ Warning | "Validation recommended" |
| Unresolved issues | ⚠⚠ High | "Previous issues unresolved" |

## Verification

```bash
# Check session files
ls -la .idumb/brain/sessions/

# Check current session status
cat .idumb/brain/sessions/*.json | jq '.status'

# Check anchors
cat .idumb/brain/state.json | jq '.anchors'
```

</success_criteria>

## Related Commands

| Command | Purpose |
|---------|---------|
| `/idumb:status` | Check current state |
| `/idumb:validate` | Validate state freshness |
| `/idumb:help` | Show all commands |
| `/idumb:init` | Initialize if no session exists |

## Governance

**Delegation Chain:**
```
user → supreme-coordinator → (read-only operations)
```

**Validation Points:**
- Pre: Check if session exists
- During: Verify state consistency
- Post: Session marked active

**Note:** This command is read-only for governance state. It reads sessions and anchors but does not modify core governance files. Session status updates are metadata only.

## Metadata

```yaml
category: session-management
priority: P1
complexity: medium
read_only: true (governance), write (session metadata)
version: 0.2.0
```
