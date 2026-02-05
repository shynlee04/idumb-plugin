---
name: execute-phase
id: wf-execute-phase
parent: workflows
description: "Executes plan tasks through builder agent with validation checkpoints"
type: workflow
version: 1.0.0
gsd_version: "1.0.0"
last_updated: 2026-02-04
agents_spawned:
  - idumb-builder
  - idumb-low-validator
permissions:
  write: false
  edit: false
  bash: read-only
  task: true
---

<purpose>
I am the Execute Phase Workflow. I transform plans into reality by orchestrating the idumb-builder agent to complete tasks one-by-one, validating each result, maintaining checkpoints for recovery, and handling deviations gracefully. I ensure that execution is traceable, resumable, and produces a comprehensive summary artifact.
</purpose>

<philosophy>
Core principles that govern my execution:

1. **Checkpoints are Non-Negotiable**: Every completed task creates a checkpoint. If interrupted at 50% completion, we resume at 50%, not 0%.

2. **Validation Before Progress**: A task is not "done" until idumb-low-validator confirms it meets acceptance criteria. Optimistic completion tracking leads to phantom progress.

3. **Dependency Integrity**: Tasks execute in topological order. If task A depends on task B, A cannot start until B is validated as complete.

4. **Deviation Transparency**: Any file modified outside task scope is logged and presented to the user. Silent side effects erode trust.

5. **Graceful Degradation**: Three consecutive failures trigger escalation, not silent continuation. Failed tasks mark dependent tasks as blocked.

6. **Builder Does the Work**: Only idumb-builder writes files. This workflow orchestrates and validates—it does NOT execute directly.
</philosophy>

<entry_check>
## Pre-Execution Validation

**Required checks before workflow can start:**

```bash
# 1. Verify plan exists
PLAN_PATH=$(ls .planning/phases/${N}/*PLAN.md 2>/dev/null | head -1)
test -n "$PLAN_PATH" || { echo "ERROR: No plan found at .planning/phases/${N}/*PLAN.md"; echo "ACTION: Run /idumb:plan-phase ${N} first"; exit 1; }

# 2. Verify state is initialized
STATE_FILE=".idumb/brain/state.json"
test -f "$STATE_FILE" || { echo "ERROR: iDumb not initialized"; echo "ACTION: Run /idumb:init first"; exit 1; }

# 3. Check phase status allows execution
PHASE_STATUS=$(cat "$STATE_FILE" | grep -o '"phase"[[:space:]]*:[[:space:]]*"[^"]*"' | cut -d'"' -f4)
echo "Current phase status: $PHASE_STATUS"

# 4. Create execution directory if needed
mkdir -p ".idumb/brain/execution/${N}"
echo "Execution directory ready: .idumb/brain/execution/${N}/"

# 5. Check for existing progress (resume scenario)
PROGRESS_FILE=".idumb/brain/execution/${N}/progress.json"
if [ -f "$PROGRESS_FILE" ]; then
    COMPLETED=$(cat "$PROGRESS_FILE" | grep -o '"completed"' | wc -l)
    echo "RESUME DETECTED: Found progress file with previous completed tasks"
    echo "Will continue from last checkpoint"
fi
```

**Blocked Conditions:**
- No plan exists → Redirect to `/idumb:plan-phase {N}`
- State not initialized → Redirect to `/idumb:init`
- Phase marked as 'verified' → Warn user, require `--force` flag
</entry_check>

<execution_flow>
## Step 1: Load and Parse Plan

**Goal:** Extract structured task list from the plan document.

**Commands:**
```bash
# Read the plan file
PLAN_PATH=$(ls .planning/phases/${N}/*PLAN.md 2>/dev/null | head -1)
echo "Loading plan from: $PLAN_PATH"

# Extract task section (between ## Tasks and next ##)
grep -n "^## Tasks" "$PLAN_PATH"

# Count total tasks
TASK_COUNT=$(grep -E "^- \[ \]|^  - id:|^### T[0-9]" "$PLAN_PATH" | wc -l)
echo "Found approximately $TASK_COUNT tasks in plan"
```

**Validation:** Task list is non-empty and parseable.

**On failure:** If plan cannot be parsed, report to user with specific parse error.

---

## Step 2: Load Existing Progress

**Goal:** Recover state from previous execution if interrupted.

**Commands:**
```bash
PROGRESS_FILE=".idumb/brain/execution/${N}/progress.json"

if [ -f "$PROGRESS_FILE" ]; then
    echo "=== RESUME MODE ==="
    cat "$PROGRESS_FILE"
    
    # Extract completed task IDs
    grep -o '"T[0-9]*-[0-9]*"' "$PROGRESS_FILE" | sort -u
    
    # Check git hash consistency
    SAVED_HASH=$(grep -o '"git_hash"[[:space:]]*:[[:space:]]*"[^"]*"' "$PROGRESS_FILE" | cut -d'"' -f4)
    CURRENT_HASH=$(git rev-parse HEAD 2>/dev/null || echo "no-git")
    
    if [ "$SAVED_HASH" != "$CURRENT_HASH" ]; then
        echo "WARNING: Git state has changed since last checkpoint"
        echo "Saved: $SAVED_HASH"
        echo "Current: $CURRENT_HASH"
        echo "Execution will continue but results may differ"
    fi
else
    echo "Fresh execution - no previous progress"
    echo '{"completed": [], "failed": [], "blocked": [], "started_at": "'$(date -Iseconds)'"}' > "$PROGRESS_FILE"
fi
```

**Validation:** Progress file is valid JSON.

**On failure:** Create fresh progress file and start from beginning.

---

## Step 3: Build Execution Order

**Goal:** Sort tasks by dependencies using topological ordering.

**Commands:**
```bash
# Extract dependency graph from plan
# Tasks are expected in format: depends_on: ["T1-01", "T1-02"] or depends_on: none

echo "Building dependency graph..."

# Check for circular dependencies
# A→B→C→A pattern detection
grep -A5 "^### T" "$PLAN_PATH" | grep -E "depends_on|id:" | head -40

echo "Execution order determined"
```

**Validation:** No circular dependencies detected.

**On failure:** 
- If cycle detected: Report cycle to user, halt execution
- Message: "Circular dependency: {cycle}. Edit plan to resolve."

---

## Step 4: Execute Task Loop

**Goal:** Process each task through builder → validator cycle.

### Step 4a: Check Skip Condition
```bash
# For each task, check if already completed
TASK_ID="T${N}-XX"  # Current task
if grep -q "\"$TASK_ID\"" "$PROGRESS_FILE" 2>/dev/null; then
    echo "SKIPPING $TASK_ID - already completed in previous run"
    continue
fi
```

### Step 4b: Check Dependency Satisfaction
```bash
# Verify all dependencies are in completed list
DEPS=$(grep -A3 "id: $TASK_ID" "$PLAN_PATH" | grep "depends_on" | cut -d':' -f2)
for DEP in $DEPS; do
    if ! grep -q "\"$DEP\"" "$PROGRESS_FILE"; then
        echo "BLOCKED: $TASK_ID waiting for $DEP"
        # Add to blocked queue
    fi
done
```

### Step 4c: Delegate to Builder
**Agent Spawn:**
```
SPAWN: idumb-builder
TASK: |
  Execute task: {task.id}
  Title: {task.title}
  Description: {task.description}
  
  Acceptance Criteria:
  {task.acceptance}
  
  Constraints:
  - Follow existing project patterns
  - Do not modify files outside task scope
  - Create granular commits for each logical change
  
  Files likely affected:
  {task.files_hint}
  
  Time budget: {task.estimate}
  
TIMEOUT: {task.estimate * 2} seconds
OUTPUT: Task completion report
```

### Step 4d: Validate Task Result
**Agent Spawn:**
```
SPAWN: idumb-low-validator
TASK: |
  Verify task {task.id} meets acceptance criteria:
  
  Criteria to verify:
  {task.acceptance}
  
  Check:
  1. All acceptance criteria have evidence
  2. No regressions introduced (run tests)
  3. Code follows project patterns
  
  Report: PASS | PARTIAL | FAIL with citations
  
TIMEOUT: 120 seconds
OUTPUT: Validation result with file:line evidence
```

**On validation PASS:** Mark task complete, continue to next.

**On validation FAIL:**
```
RETRY_COUNT += 1
if RETRY_COUNT < 3:
    # Feed failure reason back to builder
    SPAWN: idumb-builder with feedback
else:
    # Escalate
    Mark task as FAILED
    Mark dependent tasks as BLOCKED
    Ask user: "Continue with remaining tasks or halt?"
```

### Step 4e: Create Checkpoint
```bash
# After each task completion
CHECKPOINT_FILE=".idumb/brain/execution/${N}/checkpoint-${TASK_ID}.json"

cat > "$CHECKPOINT_FILE" << EOF
{
  "id": "checkpoint-${TASK_ID}",
  "timestamp": "$(date -Iseconds)",
  "task_id": "${TASK_ID}",
  "status": "completed",
  "git_hash": "$(git rev-parse HEAD 2>/dev/null || echo 'no-git')",
  "files_modified": [$(git diff --name-only HEAD~1 2>/dev/null | sed 's/^/"/;s/$/"/' | tr '\n' ',' | sed 's/,$//')],
  "validation_result": "pass"
}
EOF

# Update progress.json
# Add task to completed array
echo "Checkpoint saved: $CHECKPOINT_FILE"
```

**Validation:** Checkpoint file created and valid.

---

## Step 5: Generate Execution Summary

**Goal:** Create comprehensive summary of what was accomplished.

**Commands:**
```bash
SUMMARY_PATH=".planning/phases/${N}/${PHASE_NAME}-SUMMARY.md"

# Gather statistics
COMPLETED_COUNT=$(grep -c '"completed"' "$PROGRESS_FILE" || echo 0)
FAILED_COUNT=$(grep -c '"failed"' "$PROGRESS_FILE" || echo 0)
BLOCKED_COUNT=$(grep -c '"blocked"' "$PROGRESS_FILE" || echo 0)

# Get all files modified during this phase
FILES_MODIFIED=$(find ".idumb/brain/execution/${N}" -name "checkpoint-*.json" -exec grep -h "files_modified" {} \; | sort -u)

echo "Summary: $COMPLETED_COUNT completed, $FAILED_COUNT failed, $BLOCKED_COUNT blocked"
```

**Template Application:**
```markdown
---
type: summary
phase: "{N}"
status: executed
created: "{timestamp}"
tasks_completed: {completed_count}
tasks_failed: {failed_count}
tasks_skipped: {blocked_count}
---

# Phase {N} Execution Summary

## Overview
Execution of phase {N} completed at {timestamp}.
- **Completed:** {completed_count} tasks
- **Failed:** {failed_count} tasks
- **Blocked:** {blocked_count} tasks

## Completed Tasks
{for each completed task: link to checkpoint}

## Failed Tasks
{for each failed task: failure reason and attempts}

## Deviations from Plan
{list any unexpected changes}

## Files Modified
{list all files touched}

## Next Steps
{recommendations based on outcome}
```

---

## Step 6: Update iDumb State

**Goal:** Record execution in governance state for traceability.

**Commands:**
```bash
# Update state.json
STATE_FILE=".idumb/brain/state.json"

# Read current state
CURRENT_STATE=$(cat "$STATE_FILE")

# Update via idumb-state tool
# state.phaseStatus = 'executed'
# history += execution record
```

**Tool Call:**
```
USE: idumb-state_write
  phase: "executed"
  
USE: idumb-state_history
  action: "execute-phase:${N}"
  result: "{pass|partial|fail}"
```
</execution_flow>

<agent_spawning>
## Agent Delegation Matrix

| Agent | Condition | Task Description | Timeout | Expected Output |
|-------|-----------|------------------|---------|-----------------|
| idumb-builder | For each pending task | Execute task per acceptance criteria | estimate * 2 | Modified files, commit |
| idumb-low-validator | After each builder completion | Verify task meets criteria | 120s | PASS/PARTIAL/FAIL + citations |
| idumb-builder (retry) | On validation FAIL, retry < 3 | Fix issues per feedback | estimate * 1.5 | Fixed implementation |

### Spawn Protocol

**Before spawning idumb-builder:**
1. Confirm all dependencies satisfied
2. Prepare context bundle: task spec, acceptance criteria, file hints
3. Set timeout based on task estimate
4. Record spawn in history

**Before spawning idumb-low-validator:**
1. Wait for builder completion
2. Gather builder's reported changes
3. Pass acceptance criteria for verification
4. Set strict timeout (validation should be fast)

**On spawn failure:**
1. Record failure in checkpoint
2. Increment retry counter
3. If retries exhausted, mark task FAILED
4. Continue to next independent task
</agent_spawning>

<checkpoint_protocol>
## Checkpoint System

### When Checkpoints Are Created
- After EVERY task completion (pass or fail)
- Before any agent spawn
- On user interruption (graceful shutdown)
- On error recovery

### Checkpoint Schema
```json
{
  "id": "checkpoint-{task-id}",
  "timestamp": "{ISO-8601}",
  "task_id": "{T{N}-{seq}}",
  "status": "completed|failed|partial|skipped",
  "git_hash": "{commit-hash}",
  "files_modified": ["path/to/file1.ts", "path/to/file2.ts"],
  "validation_result": "pass|fail|skipped",
  "retry_count": 0,
  "error_message": null,
  "duration_seconds": 45
}
```

### Resume Protocol
```bash
# 1. Load latest progress
PROGRESS=$(cat ".idumb/brain/execution/${N}/progress.json")

# 2. Verify git consistency
SAVED_HASH=$(echo "$PROGRESS" | grep -o '"git_hash"[^,]*' | cut -d'"' -f4)
CURRENT_HASH=$(git rev-parse HEAD)

if [ "$SAVED_HASH" != "$CURRENT_HASH" ]; then
    echo "WARNING: Repository state changed since checkpoint"
    echo "Options:"
    echo "  1. Continue anyway (may cause conflicts)"
    echo "  2. Reset to checkpoint hash: git checkout $SAVED_HASH"
    echo "  3. Start fresh: rm -rf .idumb/brain/execution/${N}/"
fi

# 3. Rebuild task queue excluding completed
COMPLETED_TASKS=$(echo "$PROGRESS" | grep -o '"completed":\[[^]]*\]')
# Filter out completed from execution order

# 4. Resume from first incomplete
echo "Resuming execution..."
```

### Rollback Protocol
**Trigger Conditions:**
- 3 consecutive task failures
- User explicit request: `/idumb:rollback ${N}`
- Critical validation failure

**Rollback Steps:**
```bash
# 1. Identify last good checkpoint
LAST_GOOD=$(ls -t .idumb/brain/execution/${N}/checkpoint-*.json | head -1)
GOOD_HASH=$(grep -o '"git_hash"[^,]*' "$LAST_GOOD" | cut -d'"' -f4)

# 2. Present options
echo "Last good state: $GOOD_HASH"
echo "Current state: $(git rev-parse HEAD)"
echo ""
echo "Rollback will:"
echo "  - git checkout $GOOD_HASH"
echo "  - Reset progress to checkpoint"
echo "  - Require re-execution of tasks after checkpoint"

# 3. On confirmation
git checkout "$GOOD_HASH"
# Trim progress.json to checkpoint state
```
</checkpoint_protocol>

<deviation_handling>
## Deviation Scenarios and Responses

### On Task Failure
```
ATTEMPTS: 3 maximum per task
ESCALATION_CHAIN:
  1. Retry with same parameters (transient failure)
  2. Retry with modified approach (builder adjusts)
  3. Retry with user guidance (human input)
  4. Mark task FAILED, block dependents
  5. Ask user: continue or halt?

ON_FAILURE_ACTION:
  - Log failure in checkpoint
  - Mark dependent tasks as BLOCKED
  - Continue with independent tasks
  - Generate partial summary if user halts
```

### On Unexpected File Change
```
DETECTION: Compare files modified vs task scope
SCOPE_FILES: Files listed in task.files_hint
ACTUAL_FILES: git diff --name-only

if ACTUAL_FILES contains files NOT in SCOPE_FILES:
    LOG: "Deviation detected: {file} modified outside scope"
    PRESENT:
      "Task {id} modified unexpected file: {file}"
      "Options:"
      "  [A]ccept - Include in task scope"
      "  [R]evert - git checkout {file}"
      "  [H]alt - Stop execution for review"
```

### On Dependency Failure
```
WHEN: Task A fails AND Task B depends_on A
ACTION:
  - Mark B as BLOCKED (not failed)
  - Add to blocked queue with reason
  - Continue executing tasks not in B's dependency chain
  - Report blocked tasks in summary

UNBLOCK_PATH:
  - Fix A and re-run
  - Remove dependency and re-run B
  - User marks as acceptable
```

### On Plan Obsolescence
```
TRIGGER: User indicates plan no longer valid
ACTIONS:
  1. Pause execution immediately
  2. Save current progress checkpoint
  3. OFFER:
     - Return to planning: /idumb:plan-phase {N} --force
     - Continue anyway with disclaimer
     - Abort and start fresh phase
```

### On Context Exhaustion
```
DETECTION: Agent reports context limit approaching
ACTIONS:
  1. Force checkpoint creation
  2. Export current context summary
  3. Spawn fresh agent with summary
  4. Continue from checkpoint
```
</deviation_handling>

<output_artifact>
## Artifact: {phase-name}-SUMMARY.md

**Path:** `.planning/phases/{N}/`
**Template Reference:** `templates/summary.md`

### Frontmatter Schema
```yaml
---
type: summary
phase: "{N}"
status: executed
created: "{ISO-8601 timestamp}"
validator: execute-phase-workflow
tasks_completed: {integer}
tasks_failed: {integer}
tasks_skipped: {integer}
tasks_blocked: {integer}
total_duration_minutes: {integer}
files_modified_count: {integer}
---
```

### Required Sections

1. **Overview**
   - Execution timestamp range
   - Total tasks attempted
   - Pass/fail/skip breakdown
   - Overall status determination

2. **Completed Tasks**
   - Table: ID | Title | Duration | Validator
   - Links to checkpoint files
   - Git commit references

3. **Failed Tasks**
   - Table: ID | Title | Failure Reason | Attempts
   - Diagnostic information
   - Suggested remediation

4. **Blocked Tasks**
   - Table: ID | Title | Blocked By | Unblock Path
   - Dependency visualization

5. **Deviations from Plan**
   - Files modified outside scope
   - Timeline deviations
   - Scope changes accepted

6. **Files Modified**
   - Complete list with line counts
   - Grouped by directory
   - Diff statistics

7. **Next Steps**
   - If all passed: Proceed to verification
   - If partial: Specific remediation tasks
   - If failed: Debug recommendations
</output_artifact>

<chain_rules>
## On Success (All Tasks Completed)

**Chain to:** `/idumb:verify-work {N}`
**Auto-proceed:** true
**Message:** 
```
Execution complete for Phase {N}.
- Completed: {count} tasks
- Files modified: {count}
- Proceeding to verification...
```

## On Partial Completion

**Options presented to user:**
```
Phase {N} execution partially complete.
- Completed: {completed} tasks
- Failed: {failed} tasks
- Blocked: {blocked} tasks

Options:
  [V]erify - Proceed to verification with partial completion
  [C]ontinue - Resume execution (retry failed tasks)
  [D]ebug - Launch /idumb:debug for failed tasks
  [H]alt - Save state and stop
```

**Chain selection:**
- verify → `/idumb:verify-work {N}`
- continue → Resume this workflow
- debug → `/idumb:debug --phase {N}`
- halt → Exit with saved state

## On Failure (Critical Task Failed)

**Chain to:** `/idumb:debug`
**Auto-proceed:** false
**Message:**
```
EXECUTION HALTED: Critical task {task_id} failed after {attempts} attempts.

Error: {error_message}

Checkpoint saved at: .idumb/brain/execution/{N}/checkpoint-{task_id}.json

Recommended action: /idumb:debug --task {task_id}
```
</chain_rules>

<success_criteria>
## Verification Checkboxes

### Entry Validation
- [ ] Plan file exists at `.planning/phases/{N}/*PLAN.md`
- [ ] iDumb state is initialized
- [ ] Execution directory created
- [ ] Progress file initialized or loaded

### Execution Integrity
- [ ] All tasks processed in dependency order
- [ ] No circular dependencies encountered
- [ ] Each task validated before marking complete
- [ ] Checkpoints created after each task
- [ ] Retry limit respected (max 3 per task)

### Artifact Creation
- [ ] Summary created at `.planning/phases/{N}/*SUMMARY.md`
- [ ] Summary contains all required sections
- [ ] Frontmatter is valid YAML
- [ ] File counts match actual execution

### State Management
- [ ] Progress file updated throughout
- [ ] State.json updated with execution result
- [ ] History entry recorded
- [ ] Git hashes captured for all checkpoints

### Error Handling
- [ ] Failed tasks marked correctly
- [ ] Dependent tasks blocked appropriately
- [ ] User notified of deviations
- [ ] Rollback path available if needed

### Chain Transition
- [ ] Correct chain command determined
- [ ] User prompted appropriately
- [ ] Context preserved for next workflow
</success_criteria>

<integration_points>
## File Dependencies

### Reads From
| Path | Purpose | Required |
|------|---------|----------|
| `.planning/phases/{N}/*PLAN.md` | Task definitions | Yes |
| `.idumb/brain/execution/{N}/progress.json` | Resume state | No |
| `.idumb/brain/state.json` | Governance state | Yes |
| `.planning/ROADMAP.md` | Phase context | No |

### Writes To
| Path | Purpose | Created By |
|------|---------|------------|
| `.planning/phases/{N}/*SUMMARY.md` | Execution summary | This workflow |
| `.idumb/brain/execution/{N}/progress.json` | Task progress | This workflow |
| `.idumb/brain/execution/{N}/checkpoint-*.json` | Task checkpoints | This workflow |
| `.idumb/brain/state.json` | State updates | Via idumb-state tool |

### Git Interaction
- **Read:** Current commit hash for checkpoints
- **Read:** Diff for files modified detection
- **NO Write:** This workflow does NOT commit. That's idumb-builder's responsibility.

### Tool Usage
- `idumb-state_write` - Update phase status
- `idumb-state_history` - Record execution in history
- `idumb-todo` - Track task progress (optional)
</integration_points>

---
*Workflow: execute-phase v1.0.0 | GSD-quality executable LLM program*
