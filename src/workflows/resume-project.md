---
name: resume-project
id: wf-resume-project
parent: workflows
description: "Restores project context after session break and routes to correct workflow"
type: workflow
version: 1.0.0
gsd_version: "1.0.0"
last_updated: 2026-02-04
interactive: true
internal: false
---

<purpose>
I am the Project Resume Workflow - an executable context restoration program that activates when a user returns to a project after a session break. I load preserved state, inject critical context anchors into the new session, validate freshness, diagnose where work left off, and route to the appropriate workflow. I am the bridge between sessions - ensuring no context is lost and work continues seamlessly.
</purpose>

<philosophy>
Core principles that guide my execution:

1. **Context is King**: The primary value I provide is restoring context that would otherwise be lost between sessions. Every anchor, every state field, every history entry matters.

2. **Fail-Safe Restoration**: If state is corrupted, I recover what I can and warn about what's lost. A partial context is infinitely better than starting from scratch.

3. **Trust But Verify**: State files may be stale or externally modified. I validate freshness and detect conflicts before assuming data is accurate.

4. **User Confirmation Required**: I never auto-continue execution. I present findings and await explicit user confirmation before routing to next workflow.

5. **Minimal Context Injection**: I inject only critical and high-priority anchors to avoid context pollution. Normal-priority anchors are available but not auto-injected.
</philosophy>

<entry_check>
## Pre-flight Validation

```bash
# Check if iDumb is initialized
if [ ! -d ".idumb/idumb-brain" ]; then
  echo "ERROR: iDumb not initialized"
  echo "This workflow requires an existing iDumb project."
  echo "Run /idumb:init to initialize, or /idumb:new-project to start fresh."
  exit 1
fi

# Check for state.json (minimum requirement)
if [ ! -f ".idumb/idumb-brain/state.json" ]; then
  echo "ERROR: No state.json found"
  echo "The iDumb brain directory exists but state.json is missing."
  echo "This may indicate corrupted installation."
  echo ""
  echo "Options:"
  echo "  /idumb:init --repair    - Attempt to repair"
  echo "  /idumb:new-project      - Start fresh"
  exit 1
fi

# Validate state.json is valid JSON
if ! jq empty .idumb/idumb-brain/state.json 2>/dev/null; then
  echo "ERROR: state.json is corrupted (invalid JSON)"
  echo "Attempting recovery from backup..."
  
  if [ -f ".idumb/idumb-brain/state.json.backup" ]; then
    cp .idumb/idumb-brain/state.json.backup .idumb/idumb-brain/state.json
    echo "Restored from backup. Continuing..."
  else
    echo "No backup found. Manual recovery needed."
    exit 1
  fi
fi

echo "Entry check passed. State file valid."
```

**On failure:** 
- Missing `.idumb/`: Direct to `/idumb:init`
- Missing `state.json`: Check for backup, offer repair
- Corrupted JSON: Attempt restore from `.backup`, else fail with recovery instructions
</entry_check>

<execution_flow>

## Step 1: Load Governance State

**Goal:** Read the complete iDumb state into working memory

**Commands:**
```bash
# Load state
STATE=$(cat .idumb/idumb-brain/state.json)

# Extract key fields
FRAMEWORK=$(echo "$STATE" | jq -r '.framework // "unknown"')
PHASE=$(echo "$STATE" | jq -r '.phase // "unknown"')
LAST_VALIDATION=$(echo "$STATE" | jq -r '.lastValidation // "never"')
VALIDATION_COUNT=$(echo "$STATE" | jq -r '.validationCount // 0')
ANCHOR_COUNT=$(echo "$STATE" | jq -r '.anchors | length // 0')
HISTORY_COUNT=$(echo "$STATE" | jq -r '.history | length // 0')

echo "Framework: $FRAMEWORK"
echo "Current Phase: $PHASE"
echo "Last Validation: $LAST_VALIDATION"
echo "Validation Count: $VALIDATION_COUNT"
echo "Anchors: $ANCHOR_COUNT"
echo "History Entries: $HISTORY_COUNT"
```

**Output:** `saved_state` object with all governance fields
**Validation:** Framework field must be one of: `idumb`, `planning`, `bmad`, `custom`, `none`
**On failure:** Create minimal valid state with `recovered: true` flag

---

## Step 2: Load Context Anchors

**Goal:** Extract preserved context anchors for session injection

**Commands:**
```bash
# Extract all anchors
ANCHORS=$(jq '.anchors // []' .idumb/idumb-brain/state.json)

# Count by priority
CRITICAL=$(echo "$ANCHORS" | jq '[.[] | select(.priority == "critical")] | length')
HIGH=$(echo "$ANCHORS" | jq '[.[] | select(.priority == "high")] | length')
NORMAL=$(echo "$ANCHORS" | jq '[.[] | select(.priority == "normal" or .priority == null)] | length')

echo "Anchors by priority:"
echo "  Critical: $CRITICAL"
echo "  High: $HIGH"
echo "  Normal: $NORMAL"

# List critical anchors (these will be auto-injected)
echo ""
echo "Critical anchors to inject:"
echo "$ANCHORS" | jq -r '.[] | select(.priority == "critical") | "  - [\(.type)] \(.content)"'
```

**Output:** `context_anchors` array, filtered by priority
**Inject:** Critical and high-priority anchors into session context
**On failure:** Empty array (no anchors to inject, but continue)

---

## Step 3: Validate Context Freshness

**Goal:** Ensure state data is not stale or conflicted

**Commands:**
```bash
# Check state file age
STATE_MODIFIED=$(stat -f %m .idumb/idumb-brain/state.json 2>/dev/null || stat -c %Y .idumb/idumb-brain/state.json 2>/dev/null)
NOW=$(date +%s)
AGE_HOURS=$(( (NOW - STATE_MODIFIED) / 3600 ))

echo "State file age: ${AGE_HOURS} hours"

# Freshness thresholds
if [ "$AGE_HOURS" -gt 168 ]; then  # 7 days
  echo "WARNING: State file is very stale (${AGE_HOURS}h)"
  FRESHNESS="stale"
elif [ "$AGE_HOURS" -gt 48 ]; then
  echo "NOTICE: State file may be outdated (${AGE_HOURS}h)"
  FRESHNESS="outdated"
else
  echo "State file is fresh"
  FRESHNESS="fresh"
fi

# Check for external planning changes
if [ -d ".planning" ]; then
  PLANNING_MODIFIED=$(find .planning -type f -name "*.md" -newer .idumb/idumb-brain/state.json 2>/dev/null | wc -l | tr -d ' ')
  if [ "$PLANNING_MODIFIED" -gt 0 ]; then
    echo "WARNING: $PLANNING_MODIFIED planning files modified since last session"
    FRESHNESS="conflicted"
  fi
fi

# Check last validation timestamp
LAST_VAL=$(jq -r '.lastValidation // ""' .idumb/idumb-brain/state.json)
if [ -n "$LAST_VAL" ] && [ "$LAST_VAL" != "null" ]; then
  LAST_VAL_TS=$(date -jf "%Y-%m-%dT%H:%M:%S" "${LAST_VAL%.*}" +%s 2>/dev/null || echo "0")
  VAL_AGE_HOURS=$(( (NOW - LAST_VAL_TS) / 3600 ))
  echo "Last validation: ${VAL_AGE_HOURS}h ago"
  
  if [ "$VAL_AGE_HOURS" -gt 48 ]; then
    echo "NOTICE: Consider running /idumb:validate to refresh state"
  fi
fi
```

**Output:** `freshness_status` (fresh|outdated|stale|conflicted)
**On stale:** Warn user, suggest `/idumb:validate`
**On conflicted:** Warn about external modifications, offer re-sync

---

## Step 4: Detect Progress Point

**Goal:** Determine exactly where work left off in the project lifecycle

**Commands:**
```bash
# Initialize detection
RESUME_POINT="unknown"
PHASE_NUMBER=""

# Check for planning phases (if .planning/ exists)
if [ -d ".planning/phases" ]; then
  # Find latest phase with artifacts
  for dir in $(ls -1dr .planning/phases/*/ 2>/dev/null); do
    N=$(basename "$dir")
    
    # Check verification (phase complete)
    if ls "$dir"/*VERIFICATION.md 2>/dev/null | head -1 | grep -q .; then
      VERIFIED=$(grep -l "status.*verified\|pass_rate.*[89][0-9]\|pass_rate.*100" "$dir"/*VERIFICATION.md 2>/dev/null | head -1)
      if [ -n "$VERIFIED" ]; then
        RESUME_POINT="transition"
        PHASE_NUMBER="$N"
        echo "Phase $N verified - ready for transition"
        break
      fi
    fi
    
    # Check summary (execution complete, needs verification)
    if ls "$dir"/*SUMMARY.md 2>/dev/null | head -1 | grep -q .; then
      RESUME_POINT="verify-phase"
      PHASE_NUMBER="$N"
      echo "Phase $N has summary - needs verification"
      break
    fi
    
    # Check for in-progress execution
    if [ -f ".idumb/idumb-brain/execution/$N/progress.json" ]; then
      IN_PROGRESS=$(jq -r '.tasks[]? | select(.status == "in_progress") | .id' ".idumb/idumb-brain/execution/$N/progress.json" 2>/dev/null | head -1)
      if [ -n "$IN_PROGRESS" ]; then
        RESUME_POINT="execute-phase"
        PHASE_NUMBER="$N"
        echo "Phase $N has in-progress tasks - resume execution"
        break
      fi
    fi
    
    # Check for plan (ready to execute)
    if ls "$dir"/*PLAN.md 2>/dev/null | head -1 | grep -q .; then
      RESUME_POINT="execute-phase"
      PHASE_NUMBER="$N"
      echo "Phase $N has plan - ready to execute"
      break
    fi
    
    # Check for context (needs planning)
    if ls "$dir"/*CONTEXT.md 2>/dev/null | head -1 | grep -q .; then
      RESUME_POINT="plan-phase"
      PHASE_NUMBER="$N"
      echo "Phase $N has context - needs planning"
      break
    fi
  done
fi

# Fallback checks if no phase detected
if [ "$RESUME_POINT" = "unknown" ]; then
  if [ -f ".planning/ROADMAP.md" ]; then
    RESUME_POINT="discuss-phase"
    echo "Roadmap exists - ready to discuss first phase"
  elif [ -f ".planning/PROJECT.md" ]; then
    RESUME_POINT="roadmap"
    echo "Project defined - needs roadmap"
  else
    RESUME_POINT="new-project"
    echo "No planning artifacts - new project"
  fi
fi

echo ""
echo "RESUME_POINT: $RESUME_POINT"
echo "PHASE_NUMBER: $PHASE_NUMBER"
```

**Output:** `resume_point` string and `phase_number` (if applicable)
**Validation:** Must resolve to one of: `transition`, `verify-phase`, `execute-phase`, `plan-phase`, `discuss-phase`, `roadmap`, `new-project`
**On failure:** Default to `new-project`

---

## Step 5: Check Incomplete Tasks

**Goal:** Find any tasks that were in-progress when session ended

**Commands:**
```bash
# Find all progress.json files
INCOMPLETE_TASKS=""

for progress in .idumb/idumb-brain/execution/*/progress.json; do
  [ -f "$progress" ] || continue
  
  PHASE_DIR=$(dirname "$progress")
  PHASE_NUM=$(basename "$PHASE_DIR")
  
  # Extract incomplete tasks
  TASKS=$(jq -r '.tasks[]? | select(.status != "complete" and .status != "skipped") | "\(.id): \(.title) [\(.status)]"' "$progress" 2>/dev/null)
  
  if [ -n "$TASKS" ]; then
    echo "Phase $PHASE_NUM incomplete tasks:"
    echo "$TASKS" | while read task; do
      echo "  - $task"
    done
    echo ""
  fi
done

# Check for checkpoint
LATEST_CHECKPOINT=$(ls -t .idumb/idumb-brain/execution/*/checkpoint-*.json 2>/dev/null | head -1)
if [ -n "$LATEST_CHECKPOINT" ]; then
  CHECKPOINT_TIME=$(jq -r '.timestamp // "unknown"' "$LATEST_CHECKPOINT" 2>/dev/null)
  echo "Latest checkpoint: $CHECKPOINT_TIME"
  echo "Location: $LATEST_CHECKPOINT"
fi
```

**Output:** `incomplete_tasks` array with task IDs and statuses
**On no tasks:** Clean slate, proceed normally
**On incomplete:** Offer resume or restart options

---

## Step 6: Present Resume Summary

**Goal:** Show user comprehensive status and await confirmation

**Template:**
```markdown
## Project Resume Summary

**Project:** {project_name}
**Framework:** {framework}
**Current Phase:** {phase_number} - {phase_name}
**Status:** {phase_status}
**Last Activity:** {last_activity_time}
**Freshness:** {freshness_status}

### Context Anchors (Preserved)
{for anchor in critical_and_high_anchors}
- **[{anchor.type}]** {anchor.content}
{end}

### Incomplete Tasks
{if incomplete_tasks}
{for task in incomplete_tasks}
- [ ] {task.id}: {task.title} [{task.status}]
{end}
{else}
No incomplete tasks.
{end}

### Recent History
{for action in history.last(5)}
- {action.timestamp}: {action.action} → {action.result}
{end}

### Recommended Action
**{resume_recommendation}**

{if freshness == "stale" || freshness == "conflicted"}
⚠️ Consider running `/idumb:validate` before continuing.
{end}

Continue? (Y/n)
```

**Await:** User confirmation before routing
**On decline:** Return to idle state

---

## Step 7: Route to Appropriate Workflow

**Goal:** Chain to the correct next workflow based on resume point

**Routing Table:**
| Resume Point | Command/Workflow | Auto |
|--------------|-----------------|------|
| `transition` | `workflows/transition.md` | No |
| `verify-phase` | `/idumb:verify-work {N}` | No |
| `execute-phase` | `/idumb:execute-phase {N}` | No |
| `plan-phase` | `/idumb:plan-phase {N}` | No |
| `discuss-phase` | `/idumb:discuss-phase {N}` | No |
| `roadmap` | `/idumb:roadmap` | No |
| `new-project` | `/idumb:new-project` | No |

**Commands:**
```bash
# Route based on detection
case "$RESUME_POINT" in
  "transition")
    echo "Ready to transition from Phase $PHASE_NUMBER to Phase $((PHASE_NUMBER + 1))"
    # Invoke: workflows/transition.md
    ;;
  "verify-phase")
    echo "Phase $PHASE_NUMBER execution complete. Running verification..."
    # Invoke: /idumb:verify-work $PHASE_NUMBER
    ;;
  "execute-phase")
    echo "Resuming Phase $PHASE_NUMBER execution..."
    # Invoke: /idumb:execute-phase $PHASE_NUMBER
    ;;
  "plan-phase")
    echo "Creating plan for Phase $PHASE_NUMBER..."
    # Invoke: /idumb:plan-phase $PHASE_NUMBER
    ;;
  "discuss-phase")
    echo "Starting discussion for Phase $PHASE_NUMBER..."
    # Invoke: /idumb:discuss-phase $PHASE_NUMBER
    ;;
  "roadmap")
    echo "Project needs roadmap. Starting roadmap generation..."
    # Invoke: /idumb:roadmap
    ;;
  "new-project")
    echo "Starting new project setup..."
    # Invoke: /idumb:new-project
    ;;
esac
```

**Validation:** Route must be to a valid command or workflow
**On failure:** Present manual options to user

---

## Step 8: Update State

**Goal:** Record session resume in governance state

**Commands:**
```bash
# Update state.json
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Read current state
STATE=$(cat .idumb/idumb-brain/state.json)

# Add history entry
STATE=$(echo "$STATE" | jq --arg ts "$TIMESTAMP" --arg rp "$RESUME_POINT" \
  '.history += [{"timestamp": $ts, "action": "session:resume", "agent": "resume-workflow", "result": "routed:\($rp)"}]')

# Update last resume timestamp
STATE=$(echo "$STATE" | jq --arg ts "$TIMESTAMP" '.lastResume = $ts')

# Write back
echo "$STATE" | jq '.' > .idumb/idumb-brain/state.json

# Append to session log
echo "$TIMESTAMP|resume|$RESUME_POINT|$ANCHOR_COUNT" >> .idumb/idumb-brain/sessions.log

echo "State updated. Session logged."
```

**Validation:** state.json still valid JSON after update
**On failure:** Rollback to backup, warn user
</execution_flow>

<context_injection>
## Context Injection Protocol

### What Gets Injected
Only **critical** and **high** priority anchors are auto-injected into the new session context. Normal priority anchors remain available but are not injected by default.

### Injection Format
```markdown
## Preserved Context Anchors

### Critical Decisions
{for anchor in anchors where priority == "critical" and type == "decision"}
- **{anchor.id}**: {anchor.content}
{end}

### Critical Context
{for anchor in anchors where priority == "critical" and type == "context"}
- {anchor.content}
{end}

### High Priority
{for anchor in anchors where priority == "high"}
- [{anchor.type}] {anchor.content}
{end}

## Current State Summary
- **Phase:** {N} of {total_phases}
- **Status:** {phase_status}
- **Tasks:** {completed}/{total} complete

## Recent Actions (Last 5)
{for action in history.slice(-5)}
- {action.timestamp}: {action.action} → {action.result}
{end}
```

### Freshness Validation
Before injection, validate anchor freshness:

```bash
# Check if anchor references still valid
for anchor in $(jq -r '.anchors[]? | select(.type == "context") | .id' .idumb/idumb-brain/state.json); do
  # If anchor references a file, check it exists
  REF=$(jq -r --arg id "$anchor" '.anchors[] | select(.id == $id) | .reference // ""' .idumb/idumb-brain/state.json)
  if [ -n "$REF" ] && [ ! -f "$REF" ]; then
    echo "WARNING: Anchor $anchor references missing file: $REF"
  fi
done
```

### Injection Timing
1. After entry check passes
2. Before presenting summary to user
3. Context appears in LLM's working memory for the session
</context_injection>

<recovery_protocol>
## Recovery Scenarios

### Scenario 1: State Corrupted

**Detection:** `state.json` malformed or missing required fields

**Recovery Steps:**
```bash
# Check for backup
if [ -f ".idumb/idumb-brain/state.json.backup" ]; then
  echo "Restoring from backup..."
  cp .idumb/idumb-brain/state.json.backup .idumb/idumb-brain/state.json
  echo "Restored. Continuing with backup state."
else
  echo "No backup available. Rebuilding from artifacts..."
  
  # Rebuild minimal state from .planning/
  PHASE=$(ls -1 .planning/phases/ 2>/dev/null | sort -n | tail -1 || echo "1")
  
  cat > .idumb/idumb-brain/state.json << EOF
{
  "version": "0.2.0",
  "initialized": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "framework": "planning",
  "phase": "$PHASE",
  "recovered": true,
  "recoveryDate": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "anchors": [],
  "history": [
    {"timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)", "action": "state:recovered", "agent": "resume-workflow", "result": "rebuilt"}
  ]
}
EOF
  
  echo "WARNING: State rebuilt from artifacts. Some history may be lost."
fi
```

**User Notification:**
```
⚠️ State Recovery Performed

Your iDumb state file was corrupted or missing.
${if backup_used}Recovery was performed from backup.${/if}
${if rebuilt}State was rebuilt from planning artifacts. History prior to corruption is lost.${/if}

Recommend running /idumb:validate to verify state accuracy.
```

---

### Scenario 2: Execution Interrupted

**Detection:** `progress.json` shows `in_progress` tasks

**Recovery Options:**
```bash
# Present options to user
echo "Interrupted execution detected in Phase $PHASE_NUMBER"
echo ""
echo "Options:"
echo "  1. RESUME - Continue from last checkpoint"
echo "  2. RESTART - Re-execute phase from beginning"
echo "  3. SKIP - Mark current task as blocked, continue"
echo ""
echo "Select (1/2/3): "
```

**Resume Flow:**
```bash
# Load last checkpoint
CHECKPOINT=$(ls -t .idumb/idumb-brain/execution/$PHASE_NUMBER/checkpoint-*.json 2>/dev/null | head -1)
if [ -n "$CHECKPOINT" ]; then
  CHECKPOINT_HASH=$(jq -r '.gitHash // ""' "$CHECKPOINT")
  CURRENT_HASH=$(git rev-parse HEAD 2>/dev/null)
  
  if [ "$CHECKPOINT_HASH" = "$CURRENT_HASH" ]; then
    echo "Git state matches checkpoint. Safe to resume."
  else
    echo "WARNING: Git state has changed since checkpoint."
    echo "Checkpoint: $CHECKPOINT_HASH"
    echo "Current:    $CURRENT_HASH"
    echo ""
    echo "Continue anyway? (y/N): "
  fi
fi
```

---

### Scenario 3: Conflicting External Changes

**Detection:** `.planning/` files modified after `state.json`

**Recovery Steps:**
```bash
# List conflicting files
echo "⚠️ External Modifications Detected"
echo ""
echo "The following planning files were modified outside iDumb:"
find .planning -type f -name "*.md" -newer .idumb/idumb-brain/state.json 2>/dev/null | while read f; do
  MOD_TIME=$(stat -f %Sm "$f" 2>/dev/null || stat -c %y "$f" 2>/dev/null)
  echo "  - $f (modified: $MOD_TIME)"
done

echo ""
echo "Options:"
echo "  1. SYNC - Re-read planning files and update iDumb state"
echo "  2. IGNORE - Continue with current iDumb state (may diverge)"
echo "  3. VALIDATE - Run full validation before continuing"
echo ""
```

**Sync Flow:**
```bash
# Re-sync from planning
echo "Syncing iDumb state with planning artifacts..."

# Re-detect current phase status
# ... (invoke detection logic from Step 4)

# Update state
jq --arg phase "$DETECTED_PHASE" '.phase = $phase | .synced = true' \
  .idumb/idumb-brain/state.json > .idumb/idumb-brain/state.json.tmp
mv .idumb/idumb-brain/state.json.tmp .idumb/idumb-brain/state.json

echo "Sync complete."
```
</recovery_protocol>

<output_artifact>
## Artifact: Session Log

**Path:** `.idumb/idumb-brain/sessions.log`

**Format:** `{timestamp}|{action}|{resume_point}|{anchor_count}`

**Example:**
```
2026-02-04T10:30:00Z|resume|execute-phase|5
2026-02-04T11:45:00Z|resume|verify-phase|5
2026-02-04T14:00:00Z|resume|transition|6
```

---

## Artifact: Recovery Report (Conditional)

**Path:** `.idumb/idumb-brain/recovery-{timestamp}.json`

**Condition:** Only created if recovery was performed

**Schema:**
```json
{
  "timestamp": "2026-02-04T10:30:00Z",
  "scenario": "state_corrupted|execution_interrupted|conflicting_changes",
  "detection": "Description of what was detected",
  "actionsTaken": [
    "Restored from backup",
    "Rebuilt history array"
  ],
  "dataLost": [
    "History entries before 2026-02-03"
  ],
  "warnings": [
    "Some anchors may reference stale files"
  ],
  "nextSteps": [
    "Run /idumb:validate to verify state"
  ]
}
```
</output_artifact>

<chain_rules>
## On Success

**Chain to:** Dynamic based on `resume_point`
**Auto:** false - Always await user confirmation

### Routing Decision Tree

```
resume_point == "transition"
  └─> workflows/transition.md
      └─> Present transition summary, await confirmation

resume_point == "verify-phase"
  └─> /idumb:verify-work {N}
      └─> Run verification on completed phase

resume_point == "execute-phase"
  └─> /idumb:execute-phase {N}
      └─> If checkpoint exists: offer resume
      └─> If no checkpoint: start fresh

resume_point == "plan-phase"
  └─> /idumb:plan-phase {N}
      └─> Context exists, create plan

resume_point == "discuss-phase"
  └─> /idumb:discuss-phase {N}
      └─> Start phase discussion

resume_point == "roadmap"
  └─> /idumb:roadmap
      └─> Generate project roadmap

resume_point == "new-project"
  └─> /idumb:new-project
      └─> Begin new project setup
```

## On User Decline

If user declines to continue:
1. Log decline in history
2. Return to idle state
3. Present available commands

## Dynamic Routing Implementation

```bash
# After user confirmation
case "$USER_CHOICE" in
  "Y"|"y"|"yes"|"")
    echo "Routing to: $RESUME_POINT"
    # Execute routing
    ;;
  "N"|"n"|"no")
    echo "Resume cancelled. Available commands:"
    echo "  /idumb:status    - View current state"
    echo "  /idumb:validate  - Refresh validation"
    echo "  /idumb:help      - Show all commands"
    ;;
  *)
    echo "Invalid choice. Please enter Y or N."
    ;;
esac
```
</chain_rules>

<integration_points>
## System Integration

### Trigger Conditions
- Session start with existing `.idumb/idumb-brain/state.json`
- Explicit `/idumb:resume` command
- Plugin hook detection (prompt intercept)

### Reads From
| Path | Purpose |
|------|---------|
| `.idumb/idumb-brain/state.json` | Primary governance state |
| `.idumb/idumb-brain/execution/*/progress.json` | Task progress |
| `.idumb/idumb-brain/execution/*/checkpoint-*.json` | Execution checkpoints |
| `.planning/**/*.md` | Planning artifacts (read-only) |
| `.idumb/idumb-brain/config.json` | User configuration |

### Writes To
| Path | Purpose |
|------|---------|
| `.idumb/idumb-brain/state.json` | Update lastResume, history |
| `.idumb/idumb-brain/sessions.log` | Append session entry |
| `.idumb/idumb-brain/recovery-*.json` | Recovery reports (if needed) |

### Never Modifies
- `.planning/*` - Planning owns these files
- `.idumb/idumb-project-output/*` - Output artifacts
- Any source code files
</integration_points>

<success_criteria>
## Verification Checkboxes

### Pre-execution
- [ ] `.idumb/idumb-brain/state.json` exists and valid JSON
- [ ] Entry check passed without errors

### State Loading
- [ ] Framework field extracted
- [ ] Phase field extracted  
- [ ] Anchors loaded (count may be 0)
- [ ] History loaded (count may be 0)

### Freshness Check
- [ ] State file age calculated
- [ ] Freshness status determined
- [ ] Warnings issued if stale/conflicted

### Progress Detection
- [ ] Resume point determined (not "unknown")
- [ ] Phase number extracted (if applicable)
- [ ] Incomplete tasks identified (if any)

### User Interaction
- [ ] Summary presented clearly
- [ ] User confirmation received
- [ ] Choice logged

### State Update
- [ ] lastResume timestamp set
- [ ] History entry added
- [ ] Session log appended
- [ ] state.json still valid JSON

### Routing
- [ ] Correct workflow/command invoked
- [ ] Context anchors injected for new session
</success_criteria>

---
*Workflow: resume-project v1.0.0 (GSD)*
