---
name: plan-phase
id: wf-plan-phase
parent: workflows
description: "Creates detailed execution plan with tasks, dependencies, and validation criteria"
type: workflow
version: 1.0.0
gsd_version: "1.0.0"
last_updated: 2026-02-04
agents_spawned:
  - idumb-phase-researcher
  - idumb-planner
  - idumb-plan-checker
permissions:
  write: false
  edit: false
  bash: read-only
  task: true
---

<purpose>
I am the Plan Phase Workflow. I transform high-level phase objectives from the roadmap into actionable, validated execution plans. I orchestrate research, planning, and validation agents to produce a PLAN.md artifact that the execute-phase workflow can consume. Every plan I create has clear tasks, dependencies, acceptance criteria, and risk mitigations.
</purpose>

<philosophy>
Core principles that govern my planning:

1. **Research Before Planning**: Plans built on assumptions fail. If context is missing or stale (>24h), spawn research first. The 10 minutes spent researching saves 2 hours of rework.

2. **Tasks Must Be Atomic**: A task that takes more than 2 hours is actually multiple tasks. Break it down until a single focused session can complete it.

3. **Dependencies Are Contracts**: If task B depends on task A, the dependency must be explicit and the interface between them defined. Implicit dependencies cause cascading failures.

4. **Acceptance = Verifiable**: "Make it work" is not acceptance criteria. "All tests pass, endpoint returns 200, file exists at path" is verifiable.

5. **Plans Are Checked Before Execution**: Every plan goes through idumb-plan-checker. Unchecked plans are time bombs—they may have unrealistic estimates, missing dependencies, or vague criteria.

6. **Context Budget Awareness**: Plans should complete within ~50% context. If the plan is too complex, it needs phasing.
</philosophy>

<entry_check>
## Pre-Planning Validation

**Required checks before workflow can start:**

```bash
# 1. Verify roadmap exists
test -f ".planning/ROADMAP.md" || { echo "ERROR: No roadmap found at .planning/ROADMAP.md"; echo "ACTION: Run /idumb:roadmap first"; exit 1; }

# 2. Verify phase is defined in roadmap
PHASE_EXISTS=$(grep -c "Phase ${N}" .planning/ROADMAP.md 2>/dev/null || echo 0)
test "$PHASE_EXISTS" -gt 0 || { echo "ERROR: Phase ${N} not found in roadmap"; echo "ACTION: Update roadmap or use correct phase number"; exit 1; }

# 3. Verify iDumb state is initialized
STATE_FILE=".idumb/idumb-brain/state.json"
test -f "$STATE_FILE" || { echo "ERROR: iDumb not initialized"; echo "ACTION: Run /idumb:init first"; exit 1; }

# 4. Check for existing plan (require --force to overwrite)
EXISTING_PLAN=$(ls .planning/phases/${N}/*PLAN.md 2>/dev/null | head -1)
if [ -n "$EXISTING_PLAN" ] && [ "$FORCE" != "true" ]; then
    echo "WARNING: Plan already exists at $EXISTING_PLAN"
    echo "Use --force flag to recreate, or /idumb:execute-phase ${N} to execute"
    exit 1
fi

# 5. Create phase directory if needed
mkdir -p ".planning/phases/${N}"
echo "Phase directory ready: .planning/phases/${N}/"

# 6. Check for existing context
CONTEXT_FILE=$(ls .planning/phases/${N}/*CONTEXT.md 2>/dev/null | head -1)
if [ -n "$CONTEXT_FILE" ]; then
    CONTEXT_AGE=$(( ($(date +%s) - $(stat -f%m "$CONTEXT_FILE" 2>/dev/null || stat -c%Y "$CONTEXT_FILE" 2>/dev/null || echo 0)) / 3600 ))
    echo "Context file found, age: ${CONTEXT_AGE}h"
    if [ "$CONTEXT_AGE" -gt 24 ]; then
        echo "WARNING: Context is stale (>24h). Research will be triggered."
    fi
else
    echo "No context file found. Research will be triggered."
fi
```

**Blocked Conditions:**
- No roadmap exists → Redirect to `/idumb:roadmap`
- Phase not in roadmap → Ask user to verify phase number
- Plan exists without `--force` → Redirect to `/idumb:execute-phase {N}`
- State not initialized → Redirect to `/idumb:init`
</entry_check>

<execution_flow>
## Step 1: Load Phase Context

**Goal:** Gather all available context for this phase from existing artifacts.

**Commands:**
```bash
# Read roadmap section for this phase
echo "=== Extracting Phase ${N} from Roadmap ==="
PHASE_SECTION=$(awk "/^## Phase ${N}/,/^## Phase [0-9]|^## Milestones|^---/" .planning/ROADMAP.md | head -100)
echo "$PHASE_SECTION"

# Check for context file
CONTEXT_FILE=$(ls .planning/phases/${N}/*CONTEXT.md 2>/dev/null | head -1)
if [ -n "$CONTEXT_FILE" ]; then
    echo "=== Loading existing context ==="
    head -50 "$CONTEXT_FILE"
else
    echo "No context file found"
fi

# Check for research artifacts
RESEARCH_FILE=".planning/phases/${N}/RESEARCH.md"
if [ -f "$RESEARCH_FILE" ]; then
    echo "=== Research artifacts found ==="
    head -30 "$RESEARCH_FILE"
fi

# Load project context
if [ -f ".planning/PROJECT.md" ]; then
    echo "=== Project context ==="
    head -40 ".planning/PROJECT.md"
fi
```

**Output:** context_bundle (aggregated context from all sources)

**Validation:** At least roadmap phase section is non-empty.

**On failure:** If roadmap section is empty, halt and ask user to verify phase number.

---

## Step 2: Conditional Research Spawn

**Goal:** Ensure we have fresh, relevant research before planning.

**Condition Check:**
```bash
# Determine if research is needed
NEEDS_RESEARCH=false

# Check 1: No context file
CONTEXT_FILE=$(ls .planning/phases/${N}/*CONTEXT.md 2>/dev/null | head -1)
if [ -z "$CONTEXT_FILE" ]; then
    NEEDS_RESEARCH=true
    echo "Research needed: No context file"
fi

# Check 2: Context older than 24 hours
if [ -n "$CONTEXT_FILE" ]; then
    CONTEXT_AGE=$(( ($(date +%s) - $(stat -f%m "$CONTEXT_FILE" 2>/dev/null || stat -c%Y "$CONTEXT_FILE" 2>/dev/null || echo 0)) / 3600 ))
    if [ "$CONTEXT_AGE" -gt 24 ]; then
        NEEDS_RESEARCH=true
        echo "Research needed: Context stale (${CONTEXT_AGE}h old)"
    fi
fi

# Check 3: User requested fresh research
if [ "$FORCE_RESEARCH" = "true" ]; then
    NEEDS_RESEARCH=true
    echo "Research needed: User requested --fresh-research"
fi

echo "Research required: $NEEDS_RESEARCH"
```

**Agent Spawn (if needed):**
```
IF NEEDS_RESEARCH == true:
    SPAWN: idumb-phase-researcher
    TASK: |
      Research implementation patterns for Phase ${N}.
      
      Phase objective from roadmap:
      {phase_section}
      
      Research requirements:
      1. Identify relevant codebase patterns
      2. Find external references (if applicable)
      3. Document technical constraints
      4. Surface potential risks
      5. Recommend implementation approaches
      
      Output format: Markdown with clear sections
      
    TIMEOUT: 300 seconds
    OUTPUT: .planning/phases/${N}/RESEARCH.md
```

**Validation:** If research spawned, verify RESEARCH.md was created.

---

## Step 3: Spawn Planner Agent

**Goal:** Create comprehensive execution plan from context and research.

**Agent Spawn:**
```
SPAWN: idumb-planner
TASK: |
  Create detailed execution plan for Phase ${N}.
  
  CONTEXT BUNDLE:
  - Roadmap phase section: {roadmap_section}
  - Existing context: {context_file_content or "None"}
  - Research output: {research_content or "None"}
  - Project context: {project_md_content or "None"}
  
  PLAN REQUIREMENTS:
  
  1. TASK BREAKDOWN:
     - Each task must be atomic (completable in <2h)
     - Clear ID format: T{N}-{seq} (e.g., T1-01, T1-02)
     - Dependencies explicitly listed
     - Acceptance criteria that are verifiable
  
  2. DEPENDENCY GRAPH:
     - Identify which tasks block others
     - Ensure no circular dependencies
     - Mark independent tasks (can run parallel)
  
  3. ESTIMATES:
     - Realistic time estimates per task
     - Buffer for unknowns (20% minimum)
     - Total must fit within phase limit
  
  4. RISKS:
     - Technical risks identified
     - Mitigation strategies for each
     - Fallback plans for critical tasks
  
  5. SUCCESS CRITERIA:
     - Phase-level completion requirements
     - How to verify phase achieved its goals
  
  TEMPLATE: Use templates/plan.md structure
  OUTPUT: .planning/phases/${N}/*PLAN.md
  
TIMEOUT: 600 seconds
OUTPUT: .planning/phases/${N}/*PLAN.md
```

**Validation:** Plan file created with expected structure.

**On failure:** Log error, offer to retry with modified parameters.

---

## Step 4: Validate Plan Quality

**Goal:** Ensure plan meets quality standards before execution begins.

**Agent Spawn:**
```
SPAWN: idumb-plan-checker
TASK: |
  Validate the plan at .planning/phases/${N}/*PLAN.md
  
  VALIDATION CHECKS:
  
  1. STRUCTURE CHECK:
     [ ] Has proper frontmatter
     [ ] Contains all required sections
     [ ] Task IDs follow T{N}-{seq} format
  
  2. TASK QUALITY:
     [ ] Every task has acceptance criteria
     [ ] Acceptance criteria are verifiable (not vague)
     [ ] No task exceeds 2-hour estimate
     [ ] Total estimates within phase limit
  
  3. DEPENDENCY INTEGRITY:
     [ ] All dependencies reference valid task IDs
     [ ] No circular dependencies
     [ ] Dependency graph is a valid DAG
  
  4. RISK COVERAGE:
     [ ] Critical tasks have risk assessment
     [ ] Risks have mitigation strategies
     [ ] No unaddressed blockers
  
  5. CONTEXT BUDGET:
     [ ] Plan complexity appropriate for ~50% context
     [ ] Tasks can be understood independently
  
  SCORING:
  - PASS: All critical checks pass, minor issues acceptable
  - PARTIAL: Some issues but plan usable with notes
  - FAIL: Critical issues that block execution
  
  OUTPUT: Validation result with specific feedback
  
TIMEOUT: 120 seconds
OUTPUT: validation_result (inline, not file)
```

**Validation:** Receive structured validation result.

---

## Step 5: Handle Validation Result

**Goal:** Process validation and either proceed, iterate, or escalate.

**Decision Tree:**
```
IF validation_result == PASS:
    - Mark plan as validated
    - Update state
    - Proceed to chain
    
ELIF validation_result == PARTIAL:
    - Present warnings to user
    - Offer: Accept with warnings OR Revise
    - If accept: Proceed with notes
    - If revise: Return to Step 3 with feedback
    
ELIF validation_result == FAIL:
    - Log failure reasons
    - INCREMENT retry_count
    - IF retry_count < 3:
        - Feed failure feedback to planner
        - Return to Step 3
    - ELSE:
        - Present to user for manual intervention
        - Offer: Edit manually, discuss, or abort
```

**Retry Protocol:**
```bash
RETRY_COUNT=0
MAX_RETRIES=3

while [ "$VALIDATION_RESULT" != "PASS" ] && [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "Plan validation attempt $RETRY_COUNT of $MAX_RETRIES"
    
    # Feed feedback to planner
    SPAWN: idumb-planner with:
        - Previous plan
        - Validation feedback
        - Instruction: "Address these specific issues: {feedback}"
    
    # Re-validate
    SPAWN: idumb-plan-checker on new plan
done

if [ "$VALIDATION_RESULT" != "PASS" ]; then
    echo "Plan failed validation after $MAX_RETRIES attempts"
    echo "User intervention required"
fi
```

---

## Step 6: Update iDumb State

**Goal:** Record successful planning in governance state.

**Commands:**
```bash
# Update state.json via tool
STATE_FILE=".idumb/idumb-brain/state.json"

# Read current state for verification
cat "$STATE_FILE" | head -20
```

**Tool Calls:**
```
USE: idumb-state_write
  phase: "Phase ${N} - Planned"
  lastValidation: "{timestamp}"
  incrementValidation: true
  
USE: idumb-state_history
  action: "plan-phase:${N}"
  result: "pass"
  
USE: idumb-state_anchor (if critical decisions made)
  type: "decision"
  content: "Phase ${N} plan validated with {notes}"
  priority: "high"
```

**Validation:** State file updated with new phase status.
</execution_flow>

<agent_spawning>
## Agent Delegation Matrix

| Agent | Condition | Task Description | Timeout | Expected Output |
|-------|-----------|------------------|---------|-----------------|
| idumb-phase-researcher | No context OR context >24h old | Research implementation patterns | 300s | RESEARCH.md |
| idumb-planner | Always (core of workflow) | Create detailed execution plan | 600s | *PLAN.md |
| idumb-plan-checker | After plan created | Validate plan quality | 120s | Validation result (inline) |
| idumb-planner (retry) | On validation FAIL, retry < 3 | Revise plan with feedback | 600s | Revised *PLAN.md |

### Spawn Protocol for idumb-phase-researcher

**Pre-conditions:**
1. Context missing or stale (>24h)
2. User requested fresh research

**Context Provided:**
- Roadmap phase section
- Project overview
- Any existing partial context

**Expected Behavior:**
- Research relevant codebase patterns
- Check external sources if applicable
- Document constraints and risks
- Output structured RESEARCH.md

### Spawn Protocol for idumb-planner

**Pre-conditions:**
1. Context bundle assembled
2. Research complete (if was needed)

**Context Provided:**
- Full context bundle
- Research output
- Template reference
- Previous plan + feedback (if retry)

**Expected Behavior:**
- Break phase into atomic tasks
- Define clear dependencies
- Set realistic estimates
- Identify and mitigate risks
- Output structured *PLAN.md

### Spawn Protocol for idumb-plan-checker

**Pre-conditions:**
1. Plan file exists
2. Plan has expected structure

**Context Provided:**
- Path to plan file
- Validation criteria list
- Scoring rubric

**Expected Behavior:**
- Check each validation criteria
- Provide specific feedback on failures
- Score as PASS/PARTIAL/FAIL
- Return inline result (no file)
</agent_spawning>

<checkpoint_protocol>
## Planning Checkpoints

### When Checkpoints Are Created
- After research completion (if spawned)
- After initial plan creation
- After each validation attempt
- On workflow completion

### Checkpoint Schema
```json
{
  "workflow": "plan-phase",
  "phase": "{N}",
  "timestamp": "{ISO-8601}",
  "step": "research|planning|validation|complete",
  "artifacts": {
    "context": "{path or null}",
    "research": "{path or null}",
    "plan": "{path or null}"
  },
  "validation_attempts": 0,
  "last_validation_result": null,
  "agent_spawns": [
    {"agent": "idumb-phase-researcher", "status": "completed", "duration": 180}
  ]
}
```

### Checkpoint Storage
```bash
CHECKPOINT_DIR=".idumb/idumb-brain/execution/${N}"
mkdir -p "$CHECKPOINT_DIR"

# Save checkpoint
cat > "$CHECKPOINT_DIR/plan-checkpoint.json" << EOF
{
  "workflow": "plan-phase",
  "phase": "${N}",
  "timestamp": "$(date -Iseconds)",
  "step": "${CURRENT_STEP}",
  "validation_attempts": ${VALIDATION_ATTEMPTS}
}
EOF
```

### Resume Protocol
```bash
# Check for existing checkpoint
CHECKPOINT_FILE=".idumb/idumb-brain/execution/${N}/plan-checkpoint.json"

if [ -f "$CHECKPOINT_FILE" ]; then
    LAST_STEP=$(grep -o '"step"[[:space:]]*:[[:space:]]*"[^"]*"' "$CHECKPOINT_FILE" | cut -d'"' -f4)
    echo "Resuming from step: $LAST_STEP"
    
    case "$LAST_STEP" in
        "research")
            echo "Research was in progress. Checking for RESEARCH.md..."
            ;;
        "planning")
            echo "Planning was in progress. Checking for *PLAN.md..."
            ;;
        "validation")
            ATTEMPTS=$(grep -o '"validation_attempts"[[:space:]]*:[[:space:]]*[0-9]*' "$CHECKPOINT_FILE" | grep -o '[0-9]*$')
            echo "Validation was in progress. Attempts: $ATTEMPTS"
            ;;
    esac
fi
```
</checkpoint_protocol>

<deviation_handling>
## Deviation Scenarios and Responses

### On Research Agent Failure
```
SCENARIO: idumb-phase-researcher times out or produces invalid output

ACTIONS:
  1. Log the failure with error details
  2. CHECK: Can we proceed with existing context?
     - If yes: Warn user, continue to planning with stale context
     - If no: Offer retry or manual research
  3. RETRY once with increased timeout (450s)
  4. If still fails: Ask user for manual context input
```

### On Planner Agent Failure
```
SCENARIO: idumb-planner times out or produces malformed plan

ACTIONS:
  1. Log the failure
  2. ANALYZE: Is output salvageable?
     - Partial plan exists: Feed to validator for specifics
     - No output: Retry required
  3. RETRY with:
     - Simpler scope (fewer tasks)
     - Explicit structure hints
     - Increased timeout
  4. After 3 failures: Present partial work to user
```

### On Validation Loops
```
SCENARIO: Plan fails validation repeatedly

DETECTION: validation_attempts >= 3

ACTIONS:
  1. Present all feedback to user
  2. OFFER options:
     - "Edit plan manually and re-validate"
     - "Accept plan with known issues"
     - "Discuss phase scope (/idumb:discuss-phase)"
     - "Abort planning"
  3. If user accepts with issues:
     - Add warnings to plan frontmatter
     - Proceed but flag for careful execution
```

### On Conflicting Requirements
```
SCENARIO: Research reveals phase goals conflict with codebase state

DETECTION: Planner or checker reports blockers

ACTIONS:
  1. Surface conflicts clearly to user
  2. OFFER:
     - "Revise phase objectives"
     - "Add prerequisite tasks to plan"
     - "Split into sub-phases"
  3. Record decision in state anchors
```

### On Context Budget Concerns
```
SCENARIO: Plan is too complex for single execution context

DETECTION: Task count > 15 OR total estimate > 8 hours

ACTIONS:
  1. Warn user about context budget risk
  2. SUGGEST:
     - "Split into Phase {N}a and Phase {N}b"
     - "Prioritize core tasks, defer others"
  3. If proceeding anyway:
     - Add checkpoint-heavy execution flags
     - Set smaller task batches
```
</deviation_handling>

<output_artifact>
## Artifact: {phase-name}-PLAN.md

**Path:** `.planning/phases/{N}/`
**Template Reference:** `templates/plan.md`

### Frontmatter Schema
```yaml
---
type: plan
phase: "{N}"
phase_name: "{descriptive name}"
status: checked
created: "{ISO-8601 timestamp}"
validated_by: idumb-plan-checker
validation_score: "{PASS|PARTIAL}"
validation_notes: "{any warnings}"
estimated_duration: "{total hours}"
task_count: {integer}
---
```

### Required Sections

1. **Overview**
   ```markdown
   ## Overview
   
   Brief description of what this phase accomplishes.
   
   **Goals:**
   - Goal 1
   - Goal 2
   
   **Success Criteria:**
   - [ ] Criterion 1 (verifiable)
   - [ ] Criterion 2 (verifiable)
   ```

2. **Tasks**
   ```yaml
   ## Tasks
   
   ### T{N}-01: Task Title
   - **Description:** What to do
   - **Acceptance:** How to verify done
   - **Estimate:** 1h
   - **Depends on:** none
   - **Assigned to:** idumb-builder
   - **Files:** [list of likely files]
   
   ### T{N}-02: Task Title
   - **Description:** ...
   - **Depends on:** T{N}-01
   ...
   ```

3. **Dependencies**
   ```markdown
   ## Dependencies
   
   ```mermaid
   graph TD
     T1-01 --> T1-02
     T1-01 --> T1-03
     T1-02 --> T1-04
     T1-03 --> T1-04
   ```
   
   **Critical Path:** T1-01 → T1-02 → T1-04
   ```

4. **Risks**
   ```markdown
   ## Risks
   
   | Risk | Likelihood | Impact | Mitigation |
   |------|------------|--------|------------|
   | API changes | Medium | High | Pin dependency versions |
   | Test flakiness | Low | Medium | Add retry logic |
   ```

5. **Success Criteria**
   ```markdown
   ## Phase Success Criteria
   
   Phase is complete when:
   - [ ] All tasks completed or intentionally deferred
   - [ ] Tests pass
   - [ ] No new regressions
   - [ ] Documentation updated
   ```

### Quality Requirements
- Every task has verifiable acceptance criteria
- No task exceeds 2-hour estimate
- Dependencies form valid DAG (no cycles)
- Total estimated time fits phase limit
- At least one risk identified with mitigation
</output_artifact>

<chain_rules>
## On Success (Plan Validated)

**Chain to:** `/idumb:execute-phase {N}`
**Auto-proceed:** false (always ask user)
**Message:**
```
Plan for Phase {N} validated successfully.

Summary:
- Tasks: {task_count}
- Estimated duration: {total_hours}h
- Dependencies: {dependency_count}
- Risks identified: {risk_count}

Ready to execute? [Y]es / [R]eview plan / [D]iscuss
```

## On Partial Validation

**Options presented to user:**
```
Plan for Phase {N} validated with warnings.

Warnings:
{list of validation warnings}

Options:
  [A]ccept - Proceed with warnings noted
  [R]evise - Return to planning with feedback
  [D]iscuss - Go to /idumb:discuss-phase ${N}
```

**Chain selection:**
- accept → `/idumb:execute-phase {N}` with warnings in context
- revise → Re-run this workflow Step 3
- discuss → `/idumb:discuss-phase {N}`

## On Failure (Max Retries Exceeded)

**Chain to:** `/idumb:debug` or user choice
**Auto-proceed:** false
**Message:**
```
PLANNING HALTED: Plan failed validation after 3 attempts.

Issues:
{consolidated failure reasons}

Options:
  [E]dit - Edit plan manually at {plan_path}
  [D]ebug - Launch /idumb:debug for analysis
  [A]bort - Cancel and return to roadmap
```
</chain_rules>

<success_criteria>
## Verification Checkboxes

### Entry Validation
- [ ] Roadmap exists at `.planning/ROADMAP.md`
- [ ] Phase {N} defined in roadmap
- [ ] iDumb state initialized
- [ ] Phase directory exists or created
- [ ] No existing plan (or --force used)

### Research Phase (if applicable)
- [ ] Research need correctly determined
- [ ] idumb-phase-researcher spawned if needed
- [ ] RESEARCH.md created (if spawned)
- [ ] Research content is relevant and actionable

### Planning Phase
- [ ] Context bundle assembled from all sources
- [ ] idumb-planner spawned with full context
- [ ] *PLAN.md created with expected structure
- [ ] All required sections present
- [ ] Task IDs follow T{N}-{seq} format

### Validation Phase
- [ ] idumb-plan-checker spawned
- [ ] Validation result received
- [ ] All tasks have acceptance criteria
- [ ] No circular dependencies
- [ ] Estimates are realistic
- [ ] Risks have mitigations

### State Management
- [ ] State.json updated with phase status
- [ ] History entry recorded
- [ ] Checkpoint created if applicable

### Chain Transition
- [ ] Correct outcome determined (success/partial/failure)
- [ ] User presented with appropriate options
- [ ] Context preserved for next workflow
</success_criteria>

<integration_points>
## File Dependencies

### Reads From
| Path | Purpose | Required |
|------|---------|----------|
| `.planning/ROADMAP.md` | Phase objectives | Yes |
| `.planning/phases/{N}/*CONTEXT.md` | Existing context | No |
| `.planning/PROJECT.md` | Project overview | No |
| `.idumb/idumb-brain/state.json` | Governance state | Yes |

### Writes To
| Path | Purpose | Created By |
|------|---------|------------|
| `.planning/phases/{N}/*PLAN.md` | Execution plan | idumb-planner |
| `.planning/phases/{N}/RESEARCH.md` | Research output | idumb-phase-researcher |
| `.idumb/idumb-brain/state.json` | State updates | Via idumb-state tool |
| `.idumb/idumb-brain/execution/{N}/plan-checkpoint.json` | Workflow checkpoint | This workflow |

### Never Modifies
- `.planning/ROADMAP.md` - Read only
- `.planning/PROJECT.md` - Read only
- Any source code files

### Tool Usage
- `idumb-state_write` - Update phase status
- `idumb-state_history` - Record planning completion
- `idumb-state_anchor` - Record critical decisions
- `idumb-config_read` - Check governance settings
</integration_points>

---
*Workflow: plan-phase v1.0.0 | GSD-quality executable LLM program*
