---
name: verify-phase
id: wf-verify-phase
parent: workflows
description: "Validates phase completion through goal-backward analysis and evidence collection"
type: workflow
version: 1.0.0
gsd_version: "1.0.0"
last_updated: 2026-02-04
agents_spawned:
  - idumb-low-validator
  - idumb-skeptic-validator
permissions:
  write: false
  edit: false
  bash: read-only
  task: true
---

<purpose>
I am the Verify Phase Workflow. I ensure that phases actually achieved their stated goals—not just completed tasks. I use goal-backward analysis: starting from success criteria and working backward to find evidence in the codebase. I produce a VERIFICATION.md artifact that documents what was proven, what gaps exist, and what the next steps should be.
</purpose>

<philosophy>
Core principles that govern my verification:

1. **Goals Over Tasks**: Completing all tasks does not mean the phase succeeded. The codebase must now satisfy the original goals. Task completion is activity; goal achievement is value.

2. **Evidence-Based Verification**: Every claim requires file:line citation. "It works" is not evidence. `grep -n "pattern" src/file.ts:42` is evidence.

3. **Goal-Backward Analysis**: Don't ask "did we complete tasks?" Ask "does the codebase now satisfy the goals?" Work backwards from the desired state to find proof.

4. **Adversarial Skepticism**: Assume nothing. If a test says "pass" but the feature doesn't work, the test is wrong. Verify the verification.

5. **Gaps Are Not Failures**: Identifying what wasn't achieved is as valuable as confirming what was. Clear gaps enable focused remediation.

6. **Read-Only Verification**: This workflow observes and reports. It does NOT fix issues—that's the execute-phase's job. Conflating verification with fixing creates recursive loops.
</philosophy>

<entry_check>
## Pre-Verification Validation

**Required checks before workflow can start:**

```bash
# 1. Verify there's something to verify
# Either summary exists (execution completed) or phase is marked executing
SUMMARY_EXISTS=$(ls .planning/phases/${N}/*SUMMARY.md 2>/dev/null | head -1)
STATE_FILE=".idumb/brain/state.json"
PHASE_STATUS=$(grep -o '"phase"[[:space:]]*:[[:space:]]*"[^"]*"' "$STATE_FILE" 2>/dev/null | cut -d'"' -f4)

if [ -z "$SUMMARY_EXISTS" ] && [ "$PHASE_STATUS" != "executed" ] && [ "$PHASE_STATUS" != "executing" ]; then
    echo "ERROR: No execution evidence found for Phase ${N}"
    echo "No *SUMMARY.md and phase status is: $PHASE_STATUS"
    echo "ACTION: Run /idumb:execute-phase ${N} first"
    exit 1
fi

# 2. Verify plan exists (needed for success criteria)
PLAN_PATH=$(ls .planning/phases/${N}/*PLAN.md 2>/dev/null | head -1)
if [ -z "$PLAN_PATH" ]; then
    echo "WARNING: No plan found. Verification will use roadmap criteria only."
fi

# 3. Verify state is initialized
test -f "$STATE_FILE" || { echo "ERROR: iDumb not initialized"; exit 1; }

# 4. Create verification output directory
mkdir -p ".planning/phases/${N}"
echo "Verification directory ready"

# 5. Check for existing verification (require --force to re-verify)
EXISTING_VERIFY=$(ls .planning/phases/${N}/*VERIFICATION.md 2>/dev/null | head -1)
if [ -n "$EXISTING_VERIFY" ] && [ "$FORCE" != "true" ]; then
    echo "WARNING: Verification already exists at $EXISTING_VERIFY"
    echo "Use --force flag to re-verify"
    cat "$EXISTING_VERIFY" | head -30
    exit 0
fi

# 6. Gather source locations for evidence search
echo "=== Evidence Sources ==="
echo "Plan: $PLAN_PATH"
echo "Summary: $SUMMARY_EXISTS"
echo "Checkpoints: $(ls .idumb/brain/execution/${N}/checkpoint-*.json 2>/dev/null | wc -l) files"
echo "Git commits since phase start: (will be calculated)"
```

**Blocked Conditions:**
- No summary AND phase not in executing state → Redirect to `/idumb:execute-phase {N}`
- State not initialized → Redirect to `/idumb:init`
</entry_check>

<execution_flow>
## Step 1: Extract Success Criteria

**Goal:** Build comprehensive list of what needs to be proven.

**Commands:**
```bash
echo "=== Extracting Success Criteria ==="

# Source 1: Plan success criteria
PLAN_PATH=$(ls .planning/phases/${N}/*PLAN.md 2>/dev/null | head -1)
if [ -n "$PLAN_PATH" ]; then
    echo "--- From Plan ---"
    # Extract success_criteria section
    awk '/^## Success Criteria/,/^## [^S]|^---/' "$PLAN_PATH" | head -30
    
    # Extract individual task acceptance criteria
    echo "--- Task Acceptance Criteria ---"
    grep -A2 "Acceptance:" "$PLAN_PATH" | head -50
fi

# Source 2: Context success criteria
CONTEXT_PATH=$(ls .planning/phases/${N}/*CONTEXT.md 2>/dev/null | head -1)
if [ -n "$CONTEXT_PATH" ]; then
    echo "--- From Context ---"
    awk '/^## Success|^## Goals|^## Objectives/,/^## [^SGO]|^---/' "$CONTEXT_PATH" | head -30
fi

# Source 3: Roadmap phase deliverables
echo "--- From Roadmap ---"
awk "/^## Phase ${N}/,/^## Phase [0-9]|^---/" .planning/ROADMAP.md | grep -E "^\s*[-*]|Deliverables|Output|Goal" | head -20
```

**Output:** criteria_list (structured list of verifiable criteria)

**Validation:** At least one criterion extracted.

**On failure:** If no criteria found, ask user to provide verification goals.

---

## Step 2: Gather Execution Evidence

**Goal:** Collect all artifacts that could prove goal achievement.

**Commands:**
```bash
echo "=== Gathering Execution Evidence ==="

# Evidence Source 1: Summary file
SUMMARY_PATH=$(ls .planning/phases/${N}/*SUMMARY.md 2>/dev/null | head -1)
if [ -n "$SUMMARY_PATH" ]; then
    echo "--- Execution Summary ---"
    grep -E "Completed|completed|PASS|pass" "$SUMMARY_PATH" | head -20
fi

# Evidence Source 2: Checkpoints
CHECKPOINT_DIR=".idumb/brain/execution/${N}"
if [ -d "$CHECKPOINT_DIR" ]; then
    echo "--- Checkpoints ---"
    CHECKPOINT_COUNT=$(ls "$CHECKPOINT_DIR"/checkpoint-*.json 2>/dev/null | wc -l)
    echo "Found $CHECKPOINT_COUNT checkpoint files"
    
    # Extract validation results from checkpoints
    for CP in $(ls "$CHECKPOINT_DIR"/checkpoint-*.json 2>/dev/null); do
        TASK_ID=$(grep -o '"task_id"[^,]*' "$CP" | cut -d'"' -f4)
        RESULT=$(grep -o '"validation_result"[^,]*' "$CP" | cut -d'"' -f4)
        echo "  $TASK_ID: $RESULT"
    done
fi

# Evidence Source 3: Git history (if available)
if git rev-parse --git-dir > /dev/null 2>&1; then
    echo "--- Git Evidence ---"
    # Get commits during phase execution
    PHASE_START=$(grep -o '"started_at"[^,]*' "$CHECKPOINT_DIR/progress.json" 2>/dev/null | cut -d'"' -f4)
    if [ -n "$PHASE_START" ]; then
        git log --oneline --since="$PHASE_START" 2>/dev/null | head -20
    else
        git log --oneline -20
    fi
fi

# Evidence Source 4: Test results (if available)
echo "--- Test Evidence ---"
if [ -f "package.json" ]; then
    # Check for test script
    grep '"test"' package.json && echo "Test script available"
fi
```

**Output:** evidence_bundle (consolidated evidence from all sources)

---

## Step 3: Spawn Validator for Goal-Backward Analysis

**Goal:** Systematically verify each criterion against evidence.

**Agent Spawn:**
```
SPAWN: idumb-low-validator
MODE: goal-backward
TASK: |
  Perform goal-backward verification for Phase ${N}.
  
  CRITERIA TO VERIFY:
  {criteria_list}
  
  EVIDENCE SOURCES:
  - Checkpoints: .idumb/brain/execution/${N}/
  - Summary: .planning/phases/${N}/*SUMMARY.md
  - Codebase: entire project
  - Git: recent commits
  
  VERIFICATION PROTOCOL:
  
  For EACH criterion:
  1. DEFINE what evidence would prove it:
     - What file pattern would exist?
     - What code pattern would be present?
     - What test would pass?
  
  2. SEARCH for that evidence:
     ```bash
     # Example searches
     grep -rn "pattern" src/
     test -f "path/to/expected/file"
     npm test -- --grep "feature"
     ```
  
  3. RATE the criterion:
     - PASS: Clear, unambiguous evidence found
     - PARTIAL: Some evidence but incomplete
     - FAIL: No evidence or contradicting evidence
     - BLOCKED: Cannot verify (missing access, etc.)
  
  4. CITE the evidence:
     - File paths with line numbers
     - Command output excerpts
     - Test results
  
  OUTPUT FORMAT (for each criterion):
  ```yaml
  - criterion: "Description"
    expected_evidence: "What we looked for"
    search_performed: "Command or method used"
    result: PASS|PARTIAL|FAIL|BLOCKED
    evidence:
      - "file.ts:42 - relevant code"
      - "test output showing pass"
    notes: "Additional context"
  ```
  
TIMEOUT: 300 seconds
OUTPUT: validation_results (structured YAML)
```

**Validation:** Received structured results for all criteria.

---

## Step 4: Cross-Reference with Plan

**Goal:** Ensure task completion aligns with validation evidence.

**Commands:**
```bash
echo "=== Cross-Reference Check ==="

PLAN_PATH=$(ls .planning/phases/${N}/*PLAN.md 2>/dev/null | head -1)
SUMMARY_PATH=$(ls .planning/phases/${N}/*SUMMARY.md 2>/dev/null | head -1)

if [ -n "$PLAN_PATH" ] && [ -n "$SUMMARY_PATH" ]; then
    # Extract task IDs from plan
    PLAN_TASKS=$(grep -oE "T${N}-[0-9]+" "$PLAN_PATH" | sort -u)
    echo "Tasks in plan: $(echo "$PLAN_TASKS" | wc -l)"
    
    # Extract completed tasks from summary
    COMPLETED_TASKS=$(grep -oE "T${N}-[0-9]+" "$SUMMARY_PATH" | sort -u)
    echo "Tasks in summary: $(echo "$COMPLETED_TASKS" | wc -l)"
    
    # Find discrepancies
    echo "--- Discrepancies ---"
    # Tasks in plan but not in summary
    comm -23 <(echo "$PLAN_TASKS") <(echo "$COMPLETED_TASKS") | while read TASK; do
        echo "NOT COMPLETED: $TASK"
    done
fi

# Check coverage percentage
TOTAL_CRITERIA=$(echo "$CRITERIA_LIST" | wc -l)
PASSED_CRITERIA=$(echo "$VALIDATION_RESULTS" | grep -c "result: PASS")
COVERAGE=$((PASSED_CRITERIA * 100 / TOTAL_CRITERIA))
echo "Success criteria coverage: ${COVERAGE}%"

# Check for critical failures
CRITICAL_FAILS=$(echo "$VALIDATION_RESULTS" | grep -B5 "result: FAIL" | grep -c "critical: true")
echo "Critical failures: $CRITICAL_FAILS"
```

**Checks:**
- All plan tasks marked complete have validation evidence
- Success criteria coverage >= 80%
- No critical tasks failed without resolution

---

## Step 5: Optional Skeptic Review

**Goal:** Challenge verification results for high-stakes phases.

**Condition Check:**
```bash
# Determine if skeptic review needed
NEEDS_SKEPTIC=false

# Condition 1: Phase is critical (Phase 1, or marked critical)
if [ "$N" = "1" ] || [ "$CRITICAL_PHASE" = "true" ]; then
    NEEDS_SKEPTIC=true
fi

# Condition 2: Verification has edge cases
if [ "$COVERAGE" -lt 90 ] && [ "$COVERAGE" -ge 80 ]; then
    # Close to threshold - worth extra scrutiny
    NEEDS_SKEPTIC=true
fi

# Condition 3: User requested thorough verification
if [ "$THOROUGH" = "true" ]; then
    NEEDS_SKEPTIC=true
fi
```

**Agent Spawn (if needed):**
```
IF NEEDS_SKEPTIC == true:
    SPAWN: idumb-skeptic-validator
    TASK: |
      Challenge the verification results for Phase ${N}.
      
      INITIAL RESULTS:
      {validation_results}
      
      SKEPTIC PROTOCOL:
      
      1. For each PASS result:
         - Is the evidence actually conclusive?
         - Could it be a false positive?
         - What would disprove it?
      
      2. For each PARTIAL result:
         - What specifically is missing?
         - Is it truly partial or actually a fail?
      
      3. For any suspiciously easy passes:
         - Verify tests actually test what they claim
         - Check for stub/mock that masks real behavior
      
      4. Cross-check:
         - Do any PASS results contradict each other?
         - Is there negative evidence we missed?
      
      OUTPUT: Skeptic report with challenges and confirmations
      
    TIMEOUT: 180 seconds
    OUTPUT: skeptic_review (inline)
```

---

## Step 6: Generate Verification Artifact

**Goal:** Create comprehensive verification report.

**Commands:**
```bash
VERIFY_PATH=".planning/phases/${N}/${PHASE_NAME}-VERIFICATION.md"

# Calculate statistics
TOTAL_CRITERIA=$CRITERIA_COUNT
PASS_COUNT=$(echo "$VALIDATION_RESULTS" | grep -c "result: PASS")
PARTIAL_COUNT=$(echo "$VALIDATION_RESULTS" | grep -c "result: PARTIAL")
FAIL_COUNT=$(echo "$VALIDATION_RESULTS" | grep -c "result: FAIL")
BLOCKED_COUNT=$(echo "$VALIDATION_RESULTS" | grep -c "result: BLOCKED")

PASS_RATE=$((PASS_COUNT * 100 / TOTAL_CRITERIA))

echo "Generating verification report at: $VERIFY_PATH"
echo "Pass rate: ${PASS_RATE}%"
```

**Artifact Generation:**
```markdown
---
type: verification
phase: "{N}"
phase_name: "{phase_name}"
status: "{verified|needs_work|blocked}"
created: "{ISO-8601}"
validator: idumb-low-validator
skeptic_review: {true|false}
pass_rate: "{percentage}%"
criteria_count: {total}
pass_count: {pass}
partial_count: {partial}
fail_count: {fail}
blocked_count: {blocked}
---

# Phase {N} Verification Report

## Summary

{Overall result statement}

| Metric | Value |
|--------|-------|
| Total Criteria | {total} |
| Passed | {pass} ({pass_rate}%) |
| Partial | {partial} |
| Failed | {fail} |
| Blocked | {blocked} |

## Criteria Results

{For each criterion, formatted table}

| # | Criterion | Status | Evidence | Notes |
|---|-----------|--------|----------|-------|
| 1 | {criterion} | {PASS/PARTIAL/FAIL} | {file:line} | {notes} |

## Evidence Citations

### Passed Criteria
{Detailed citations for each pass}

### Failed/Partial Criteria
{Detailed analysis of what's missing}

## Gaps Identified

{List of gaps with remediation suggestions}

## Recommendations

{Based on outcome}
```

---

## Step 7: Determine Phase Status

**Goal:** Make final determination and update state accordingly.

**Decision Rules:**
```
PASS_RATE >= 80% AND CRITICAL_FAILS == 0:
    STATUS = "verified"
    MESSAGE = "Phase {N} verified successfully"

PASS_RATE >= 60% AND PASS_RATE < 80%:
    STATUS = "complete_with_notes"
    MESSAGE = "Phase {N} substantially complete with documented gaps"

PASS_RATE < 60% OR CRITICAL_FAILS > 0:
    STATUS = "needs_work"
    MESSAGE = "Phase {N} requires additional work"

BLOCKED_COUNT > TOTAL/2:
    STATUS = "blocked"
    MESSAGE = "Phase {N} verification blocked - cannot access evidence"
```

**State Update:**
```bash
# Update via idumb-state tool
USE: idumb-state_write
  phase: "Phase ${N} - ${STATUS}"
  lastValidation: "$(date -Iseconds)"
  incrementValidation: true

USE: idumb-state_history
  action: "verify-phase:${N}"
  result: "${STATUS}"
```
</execution_flow>

<agent_spawning>
## Agent Delegation Matrix

| Agent | Condition | Task Description | Timeout | Expected Output |
|-------|-----------|------------------|---------|-----------------|
| idumb-low-validator | Always | Goal-backward verification | 300s | Structured results |
| idumb-skeptic-validator | Critical phase OR edge case | Challenge verification | 180s | Skeptic review |

### Spawn Protocol for idumb-low-validator

**Pre-conditions:**
1. Criteria list extracted
2. Evidence sources identified

**Context Provided:**
- Full criteria list with sources
- Evidence bundle references
- Search scope (codebase, checkpoints, git)

**Expected Behavior:**
- Verify each criterion using goal-backward method
- Provide file:line citations
- Rate each as PASS/PARTIAL/FAIL/BLOCKED
- Output structured YAML results

**Strict Constraints:**
- READ-ONLY: No file modifications
- Must cite evidence for every rating
- Must explain search methodology

### Spawn Protocol for idumb-skeptic-validator

**Pre-conditions:**
1. Initial validation complete
2. Phase is critical OR pass rate is borderline OR user requested

**Context Provided:**
- Initial validation results
- Original criteria
- Any suspicious patterns identified

**Expected Behavior:**
- Challenge each PASS result
- Look for false positives
- Identify overlooked failure modes
- Confirm or adjust ratings

**Strict Constraints:**
- READ-ONLY: No file modifications
- Must provide reasoning for challenges
- Cannot change ratings without evidence
</agent_spawning>

<goal_backward_methodology>
## Goal-Backward Analysis Protocol

### Philosophy
Traditional verification asks: "Did we complete the tasks?"
Goal-backward asks: "Does the codebase now satisfy the original goals?"

This shift catches:
- Tasks completed but not working
- Features implemented but broken
- Code present but not integrated
- Tests passing but not testing reality

### Process

```
STEP 1: EXTRACT GOALS
┌─────────────────────────────────────┐
│ "What did this phase promise?"       │
│ - Read success criteria from plan   │
│ - Read objectives from context      │
│ - Read deliverables from roadmap    │
└─────────────────────────────────────┘
           │
           ▼
STEP 2: DEFINE EVIDENCE
┌─────────────────────────────────────┐
│ "What would prove each goal?"        │
│ - File exists at path?              │
│ - Pattern present in code?          │
│ - Test passes?                      │
│ - API returns expected response?    │
└─────────────────────────────────────┘
           │
           ▼
STEP 3: SEARCH FOR EVIDENCE
┌─────────────────────────────────────┐
│ "Can we find that evidence?"         │
│ grep -rn "pattern" src/             │
│ test -f "expected/path"             │
│ npm test -- --grep "feature"        │
│ curl -s endpoint | jq '.field'      │
└─────────────────────────────────────┘
           │
           ▼
STEP 4: EVALUATE
┌─────────────────────────────────────┐
│ "Is evidence sufficient?"            │
│ PASS: Clear, unambiguous evidence   │
│ PARTIAL: Some but incomplete        │
│ FAIL: None or contradicting         │
│ BLOCKED: Cannot access to verify    │
└─────────────────────────────────────┘
```

### Evidence Quality Scale

| Rating | Criteria | Example |
|--------|----------|---------|
| PASS | Clear, unambiguous proof | `grep -n "export.*FeatureX" src/index.ts` returns line 42 |
| PARTIAL | Evidence exists but incomplete | Function exists but no test coverage |
| FAIL | No evidence or contradicting | Feature supposed to exist but grep returns nothing |
| BLOCKED | Cannot verify due to access/env | "Cannot run integration tests without API key" |

### Search Commands Reference

```bash
# File existence
test -f "path/to/expected/file.ts" && echo "EXISTS" || echo "MISSING"

# Pattern in code
grep -rn "export.*ClassName" src/ --include="*.ts"

# Function definition
grep -n "function featureName\|const featureName" src/**/*.ts

# Import usage
grep -rn "import.*FeatureName" src/ --include="*.ts"

# Test coverage
grep -rn "describe.*FeatureName\|it.*should" tests/ --include="*.test.ts"

# API endpoint (if applicable)
curl -s http://localhost:3000/api/feature | jq '.status'

# TypeScript compilation
npx tsc --noEmit 2>&1 | grep -c "error" && echo "HAS ERRORS" || echo "CLEAN"

# Test execution
npm test -- --grep "FeatureName" 2>&1 | tail -5
```
</goal_backward_methodology>

<checkpoint_protocol>
## Verification Checkpoints

### When Checkpoints Are Created
- After criteria extraction
- After evidence gathering
- After validation completion
- After skeptic review (if performed)
- On workflow completion

### Checkpoint Schema
```json
{
  "workflow": "verify-phase",
  "phase": "{N}",
  "timestamp": "{ISO-8601}",
  "step": "criteria|evidence|validation|skeptic|complete",
  "criteria_count": 0,
  "validation_results": {
    "pass": 0,
    "partial": 0,
    "fail": 0,
    "blocked": 0
  },
  "skeptic_review_performed": false,
  "final_status": null
}
```

### Storage Location
```bash
CHECKPOINT_FILE=".idumb/brain/execution/${N}/verify-checkpoint.json"
```
</checkpoint_protocol>

<deviation_handling>
## Deviation Scenarios and Responses

### On No Criteria Found
```
SCENARIO: Cannot extract success criteria from any source

ACTIONS:
  1. Check if this is an ad-hoc phase (no formal planning)
  2. PROMPT user:
     "No success criteria found for Phase ${N}."
     "Please provide verification goals:"
     "[text input for criteria]"
  3. Use provided criteria
  4. Add note to verification report: "User-provided criteria"
```

### On Evidence Access Blocked
```
SCENARIO: Cannot access evidence (missing permissions, external deps)

DETECTION: Multiple BLOCKED results

ACTIONS:
  1. Categorize what's blocked and why
  2. OFFER:
     - "Proceed with partial verification (ignore blocked)"
     - "Provide credentials/access for blocked items"
     - "Mark blocked items as accepted/deferred"
  3. Document in report
```

### On Contradicting Evidence
```
SCENARIO: Evidence both supports and contradicts a criterion

DETECTION: Validator finds mixed signals

ACTIONS:
  1. Escalate to skeptic review (if not already)
  2. Document both evidence sets
  3. Rate as PARTIAL with detailed notes
  4. Flag for human review
```

### On Test Failures During Verification
```
SCENARIO: Running tests for verification causes failures

ACTIONS:
  1. Distinguish between:
     - Pre-existing failures (not our responsibility)
     - New failures (phase introduced regression)
  2. If new failures:
     - Rate affected criteria as FAIL
     - Add regression note to report
  3. If pre-existing:
     - Note in report
     - Don't count against phase
```

### On Verification Taking Too Long
```
SCENARIO: Validator agent timing out

DETECTION: Agent exceeds timeout

ACTIONS:
  1. Save partial results
  2. Retry with:
     - Smaller criterion batch
     - Simpler search patterns
  3. If still failing:
     - Mark remaining as BLOCKED
     - Proceed with partial verification
```
</deviation_handling>

<output_artifact>
## Artifact: {phase-name}-VERIFICATION.md

**Path:** `.planning/phases/{N}/`
**Template Reference:** `templates/verification.md`

### Frontmatter Schema
```yaml
---
type: verification
phase: "{N}"
phase_name: "{descriptive name}"
status: verified|needs_work|blocked
created: "{ISO-8601 timestamp}"
validator: idumb-low-validator
skeptic_review: true|false
pass_rate: "{percentage}%"
criteria_count: {integer}
pass_count: {integer}
partial_count: {integer}
fail_count: {integer}
blocked_count: {integer}
---
```

### Required Sections

1. **Summary**
   ```markdown
   ## Summary
   
   Phase {N} verification {STATUS}.
   
   | Metric | Count | Percentage |
   |--------|-------|------------|
   | Total Criteria | {total} | 100% |
   | Passed | {pass} | {X}% |
   | Partial | {partial} | {Y}% |
   | Failed | {fail} | {Z}% |
   | Blocked | {blocked} | {W}% |
   
   **Overall Result:** {VERIFIED | NEEDS_WORK | BLOCKED}
   ```

2. **Criteria Results Table**
   ```markdown
   ## Criteria Results
   
   | # | Criterion | Source | Status | Evidence |
   |---|-----------|--------|--------|----------|
   | 1 | User auth works | Plan T1-03 | PASS | auth.ts:42 |
   | 2 | Tests pass | Context | PASS | npm test: 0 failures |
   | 3 | Docs updated | Roadmap | PARTIAL | README exists, API docs missing |
   ```

3. **Evidence Citations**
   ```markdown
   ## Evidence Citations
   
   ### Criterion 1: User auth works
   **Expected:** Authentication endpoint returns 200 with valid token
   **Search:** `curl -X POST /api/auth/login -d '...'`
   **Found:** `{"status": "ok", "token": "..."}`
   **File:** `src/api/auth.ts:42-58`
   
   ### Criterion 2: ...
   ```

4. **Gaps Identified**
   ```markdown
   ## Gaps
   
   ### FAIL: API documentation
   - **Expected:** OpenAPI spec at /docs
   - **Found:** 404 Not Found
   - **Impact:** Medium - external consumers cannot discover API
   - **Remediation:** Add swagger-ui-express and generate spec
   
   ### PARTIAL: Error handling
   - **Expected:** All errors return structured response
   - **Found:** 80% have structure, 20% return raw strings
   - **Remediation:** Wrap remaining handlers in error middleware
   ```

5. **Recommendations**
   ```markdown
   ## Recommendations
   
   Based on verification results:
   
   ### If VERIFIED
   - Proceed to next phase
   - Consider enhancing partial items in future iteration
   
   ### If NEEDS_WORK
   - Address FAIL items before proceeding:
     1. {specific task}
     2. {specific task}
   - Re-verify after fixes: `/idumb:verify-work ${N} --force`
   
   ### If BLOCKED
   - Resolve access issues:
     1. {specific access need}
   - Re-attempt verification when resolved
   ```
</output_artifact>

<chain_rules>
## On Verified (Pass Rate >= 80%, No Critical Fails)

**Chain to:** Transition workflow (mark phase complete, update roadmap)
**Auto-proceed:** true (with user notification)
**Message:**
```
Phase ${N} VERIFIED

Results:
- Pass rate: {rate}%
- Criteria met: {pass}/{total}

Status: Proceeding to mark phase complete and update roadmap.
Next: Phase ${N+1} planning will begin.
```

## On Needs Work (Pass Rate < 80% OR Critical Fails)

**Options presented to user:**
```
Phase ${N} verification incomplete.

Pass rate: {rate}%
Failed criteria: {list}

Options:
  [E]xecute - Return to /idumb:execute-phase for fixes
  [A]ccept - Accept with documented gaps
  [D]ebug - Launch /idumb:debug for failed items
```

**Chain selection:**
- execute → `/idumb:execute-phase {N}` with fix list
- accept → Transition with gaps documented
- debug → `/idumb:debug --phase {N}`

## On Blocked (Cannot Access Evidence)

**Chain to:** `/idumb:debug`
**Auto-proceed:** false
**Message:**
```
VERIFICATION BLOCKED for Phase ${N}

Cannot access evidence for {blocked_count} criteria.
Blocked items:
{list}

Recommended action: Resolve access issues and re-verify.
```
</chain_rules>

<success_criteria>
## Verification Checkboxes

### Entry Validation
- [ ] Execution evidence exists (summary or phase status)
- [ ] Plan file available for criteria extraction
- [ ] iDumb state initialized
- [ ] Verification directory ready

### Criteria Extraction
- [ ] Success criteria extracted from plan
- [ ] Additional criteria from context (if exists)
- [ ] Roadmap deliverables included
- [ ] Criteria list is non-empty

### Evidence Gathering
- [ ] Checkpoints loaded
- [ ] Summary analyzed
- [ ] Git history considered
- [ ] Test results checked (if applicable)

### Validation Execution
- [ ] idumb-low-validator spawned
- [ ] Goal-backward methodology applied
- [ ] Each criterion rated with evidence
- [ ] Citations provided for all ratings

### Cross-Reference
- [ ] Task completion matches validation
- [ ] Coverage percentage calculated
- [ ] Critical failures identified

### Artifact Creation
- [ ] VERIFICATION.md created at correct path
- [ ] Frontmatter contains all required fields
- [ ] All sections present
- [ ] Evidence citations included

### State Management
- [ ] State.json updated with verification result
- [ ] History entry recorded
- [ ] Appropriate status determined

### Chain Transition
- [ ] Correct outcome determined
- [ ] User presented appropriate options
- [ ] Context preserved for next workflow
</success_criteria>

<integration_points>
## File Dependencies

### Reads From
| Path | Purpose | Required |
|------|---------|----------|
| `.planning/phases/{N}/*PLAN.md` | Success criteria | No (degrades gracefully) |
| `.planning/phases/{N}/*CONTEXT.md` | Goals/objectives | No |
| `.planning/phases/{N}/*SUMMARY.md` | Execution evidence | Preferred |
| `.planning/ROADMAP.md` | Phase deliverables | No |
| `.idumb/brain/execution/{N}/` | Checkpoints | Yes |
| `.idumb/brain/state.json` | Phase status | Yes |
| Entire codebase | Evidence search | Yes |

### Writes To
| Path | Purpose | Created By |
|------|---------|------------|
| `.planning/phases/{N}/*VERIFICATION.md` | Verification report | This workflow |
| `.idumb/brain/state.json` | Status update | Via idumb-state tool |
| `.idumb/brain/execution/{N}/verify-checkpoint.json` | Checkpoint | This workflow |

### Never Modifies
- Source code files (read-only verification)
- Plan files
- Summary files
- Other .planning/ artifacts

### Tool Usage
- `idumb-state_write` - Update phase status
- `idumb-state_history` - Record verification result
- `idumb-validate` - Structural validation helpers
- `idumb-context` - Codebase pattern detection
</integration_points>

---
*Workflow: verify-phase v1.0.0 | GSD-quality executable LLM program*
