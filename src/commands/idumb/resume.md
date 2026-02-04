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

## Purpose
Resume a previously idle iDumb session, restoring context, anchors, and workflow state.

## When to Use
- Returning to a project after being idle for > 1 hour
- Context was lost due to compaction
- Need to recover previous session state

## Prerequisites
- Session metadata exists in `.idumb/idumb-brain/sessions/`
- State file exists at `.idumb/idumb-brain/state.json`

## Workflow

### Step 1: Detect Resumed Session
```
Use checkIfResumedSession() to determine if this is a resumed session
```

### Step 2: Load Session Metadata
```
Load metadata from .idumb/idumb-brain/sessions/{sessionId}.json
```

### Step 3: Build Resume Context
```
Use buildResumeContext() to generate context injection
Include:
- Idle duration
- Previous session timestamp
- Current phase
- Active anchors
- Recent history
```

### Step 4: Inject Context
```
Add resume context to the conversation
Restore critical anchors
```

## Output
- Resume context summary
- Active anchors list
- Recommended next steps
- State freshness indicator

## Example Usage
```
/idumb:resume
```

## Related Commands
- `/idumb:status` - Check current state
- `/idumb:validate` - Validate state freshness
- `/idumb:help` - Show all commands
