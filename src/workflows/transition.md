---
name: transition
id: wf-transition
parent: workflows
description: "Handles phase completion and transition to next phase"
type: workflow
version: 1.0.0
gsd_version: "1.0.0"
last_updated: 2026-02-04
interactive: false
internal: true
---

<purpose>
I am the Phase Transition Workflow - an internal orchestration program that executes when a phase has been verified and is ready to transition. I archive completed work, update roadmap tracking, prepare context for the next phase, and ensure smooth handoff between phases. I am the ceremony of completion - ensuring nothing is lost and the next phase has everything it needs to succeed.
</purpose>

<philosophy>
Core principles that guide my execution:

1. **Archive Everything**: Before moving forward, preserve all artifacts from the completed phase. Execution history, checkpoints, and learnings must survive for future reference.

2. **Shadow Tracking Only**: I never modify `.planning/` files directly - that's the planning system's domain. I maintain my own shadow tracking in `.idumb/` that mirrors and extends planning state.

3. **Learnings Forward**: Extract key insights, decisions, and open questions from the completed phase and carry them forward as context for the next phase.

4. **Milestone Awareness**: Track not just phase completion but milestone boundaries. Milestone completion triggers additional ceremonies and summaries.

5. **User Celebration**: Completing phases is an achievement. Acknowledge progress, present clear metrics, and guide the user to the next steps.
</philosophy>

<entry_check>
## Pre-flight Validation

```bash
# Must have verification file
VERIFICATION_FILE=$(ls .planning/phases/*/VERIFICATION.md .planning/phases/*/*VERIFICATION.md 2>/dev/null | tail -1)
if [ -z "$VERIFICATION_FILE" ]; then
  echo "ERROR: No VERIFICATION.md found"
  echo "This workflow requires a verified phase."
  echo "Run /idumb:verify-work {phase} first."
  exit 1
fi

# Extract phase number from path
PHASE_DIR=$(dirname "$VERIFICATION_FILE")
PHASE_NUM=$(basename "$PHASE_DIR" | grep -oE '[0-9]+' | head -1)

if [ -z "$PHASE_NUM" ]; then
  echo "ERROR: Cannot determine phase number from: $PHASE_DIR"
  exit 1
fi

echo "Transition target: Phase $PHASE_NUM"

# Check verification status
PASS_RATE=$(grep -oE 'pass_rate.*[0-9]+' "$VERIFICATION_FILE" 2>/dev/null | grep -oE '[0-9]+' | head -1 || echo "0")
echo "Pass rate: ${PASS_RATE}%"

if [ "$PASS_RATE" -lt 80 ]; then
  echo "ERROR: Pass rate below 80% threshold"
  echo "Phase must achieve 80%+ pass rate before transition."
  echo "Current: ${PASS_RATE}%"
  exit 1
fi

# Check iDumb state indicates verified
PHASE_STATUS=$(jq -r '.phase // ""' .idumb/brain/state.json 2>/dev/null)
echo "iDumb phase status: $PHASE_STATUS"

# Check for blocked items
BLOCKED=$(grep -c "BLOCKED" "$VERIFICATION_FILE" 2>/dev/null || echo "0")
CRITICAL_BLOCKED=$(grep -B2 "BLOCKED" "$VERIFICATION_FILE" 2>/dev/null | grep -c "critical\|CRITICAL" || echo "0")

if [ "$CRITICAL_BLOCKED" -gt 0 ]; then
  echo "ERROR: $CRITICAL_BLOCKED critical items are BLOCKED"
  echo "Cannot transition with blocked critical items."
  exit 1
fi

if [ "$BLOCKED" -gt 0 ]; then
  echo "WARNING: $BLOCKED items are BLOCKED (non-critical)"
  echo "Proceeding with transition, but blocked items will carry forward."
fi

echo ""
echo "Entry check passed. Ready for transition."
```

**On failure:**
- No verification: Direct to `/idumb:verify-work`
- Pass rate <80%: Explain what needs fixing
- Critical blocked: List blocked items, require resolution
</entry_check>

<execution_flow>

## Step 1: Validate Completion

**Goal:** Final verification that phase is truly ready for transition

**Commands:**
```bash
# Load verification file
VERIFICATION_FILE=$(ls .planning/phases/$PHASE_NUM/*VERIFICATION.md .planning/phases/$PHASE_NUM/VERIFICATION.md 2>/dev/null | head -1)

# Parse verification results
PASS_RATE=$(grep -oE 'pass_rate.*[0-9]+' "$VERIFICATION_FILE" 2>/dev/null | grep -oE '[0-9]+' | head -1 || echo "0")
TOTAL_CHECKS=$(grep -cE '^\s*-\s*\[' "$VERIFICATION_FILE" 2>/dev/null || echo "0")
PASSED_CHECKS=$(grep -cE '^\s*-\s*\[x\]' "$VERIFICATION_FILE" 2>/dev/null || echo "0")
FAILED_CHECKS=$(grep -cE '^\s*-\s*\[\s\]' "$VERIFICATION_FILE" 2>/dev/null || echo "0")

echo "Verification Summary:"
echo "  Pass Rate: ${PASS_RATE}%"
echo "  Total Checks: $TOTAL_CHECKS"
echo "  Passed: $PASSED_CHECKS"
echo "  Failed: $FAILED_CHECKS"

# Check for explicit completion markers
if grep -q "Phase Complete\|phase_status.*complete\|PHASE VERIFIED" "$VERIFICATION_FILE" 2>/dev/null; then
  echo "  Status: VERIFIED"
  VERIFIED=true
else
  echo "  Status: PENDING CONFIRMATION"
  VERIFIED=false
fi

# Final go/no-go
if [ "$PASS_RATE" -ge 80 ] && [ "$CRITICAL_BLOCKED" -eq 0 ]; then
  echo ""
  echo "Phase $PHASE_NUM approved for transition."
else
  echo ""
  echo "ERROR: Phase $PHASE_NUM does not meet transition criteria."
  exit 1
fi
```

**Output:** Transition approval status
**On failure:** Abort with specific failure reasons

---

## Step 2: Archive Phase Artifacts

**Goal:** Preserve all phase artifacts in the iDumb archive

**Commands:**
```bash
# Create archive directory
ARCHIVE_DIR=".idumb/brain/archive/phases/$PHASE_NUM"
mkdir -p "$ARCHIVE_DIR"

# Archive planning artifacts (copy, don't move)
echo "Archiving planning artifacts..."
cp .planning/phases/$PHASE_NUM/*.md "$ARCHIVE_DIR/" 2>/dev/null || true

# Count archived markdown files
ARCHIVED_MD=$(ls "$ARCHIVE_DIR"/*.md 2>/dev/null | wc -l | tr -d ' ')
echo "  Archived $ARCHIVED_MD markdown files"

# Archive execution artifacts
if [ -d ".idumb/brain/execution/$PHASE_NUM" ]; then
  echo "Archiving execution artifacts..."
  cp -r .idumb/brain/execution/$PHASE_NUM/* "$ARCHIVE_DIR/" 2>/dev/null || true
  
  # Count checkpoints
  CHECKPOINTS=$(ls "$ARCHIVE_DIR"/checkpoint-*.json 2>/dev/null | wc -l | tr -d ' ')
  echo "  Archived $CHECKPOINTS checkpoints"
  
  # Archive progress
  if [ -f ".idumb/brain/execution/$PHASE_NUM/progress.json" ]; then
    cp .idumb/brain/execution/$PHASE_NUM/progress.json "$ARCHIVE_DIR/final-progress.json"
    echo "  Archived final progress state"
  fi
fi

# Create archive manifest
cat > "$ARCHIVE_DIR/MANIFEST.json" << EOF
{
  "phase": $PHASE_NUM,
  "archivedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "passRate": $PASS_RATE,
  "checksTotal": $TOTAL_CHECKS,
  "checksPassed": $PASSED_CHECKS,
  "files": $(ls "$ARCHIVE_DIR" | jq -R -s -c 'split("\n") | map(select(length > 0))')
}
EOF

echo "  Created archive manifest"
echo ""
echo "Archive complete: $ARCHIVE_DIR"
```

**Output:** Archive directory path
**Validation:** At least verification file archived
**On failure:** Warn but continue (non-blocking)

---

## Step 3: Update Roadmap Shadow Tracking

**Goal:** Update iDumb's shadow tracking of roadmap progress

**Commands:**
```bash
# Shadow tracking file
ROADMAP_STATUS=".idumb/brain/roadmap-status.json"

# Initialize if doesn't exist
if [ ! -f "$ROADMAP_STATUS" ]; then
  echo '{"phases":{}}' > "$ROADMAP_STATUS"
fi

# Get completion metrics
TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)

# Count tasks from progress
TASKS_TOTAL=0
TASKS_COMPLETED=0
if [ -f ".idumb/brain/execution/$PHASE_NUM/progress.json" ]; then
  TASKS_TOTAL=$(jq '.tasks | length' ".idumb/brain/execution/$PHASE_NUM/progress.json" 2>/dev/null || echo "0")
  TASKS_COMPLETED=$(jq '[.tasks[] | select(.status == "complete")] | length' ".idumb/brain/execution/$PHASE_NUM/progress.json" 2>/dev/null || echo "0")
fi

# Get phase start time (from first checkpoint or state)
START_TIME=$(jq -r '.timestamp // ""' ".idumb/brain/execution/$PHASE_NUM/checkpoint-"*.json 2>/dev/null | head -1 || echo "unknown")

# Update shadow tracking
jq --arg phase "$PHASE_NUM" \
   --arg status "complete" \
   --arg completed "$TIMESTAMP" \
   --arg started "$START_TIME" \
   --arg rate "$PASS_RATE" \
   --arg total "$TASKS_TOTAL" \
   --arg done "$TASKS_COMPLETED" \
   --arg verification "$VERIFICATION_FILE" \
   '.phases[$phase] = {
     "status": $status,
     "startedAt": $started,
     "completedAt": $completed,
     "passRate": ($rate | tonumber),
     "tasksTotal": ($total | tonumber),
     "tasksCompleted": ($done | tonumber),
     "verificationFile": $verification
   }' "$ROADMAP_STATUS" > "${ROADMAP_STATUS}.tmp"

mv "${ROADMAP_STATUS}.tmp" "$ROADMAP_STATUS"

echo "Updated roadmap shadow tracking:"
jq ".phases[\"$PHASE_NUM\"]" "$ROADMAP_STATUS"
```

**Output:** Updated `roadmap-status.json`
**Validation:** JSON still valid after update
**On failure:** Restore from backup, log error

---

## Step 4: Identify Next Phase

**Goal:** Determine what comes next in the roadmap

**Commands:**
```bash
# Calculate next phase
NEXT_PHASE=$((PHASE_NUM + 1))

# Check roadmap for total phases
if [ -f ".planning/ROADMAP.md" ]; then
  # Count phase headers
  TOTAL_PHASES=$(grep -cE '^##\s*(Phase|PHASE)\s*[0-9]+' .planning/ROADMAP.md 2>/dev/null || echo "1")
  
  echo "Roadmap analysis:"
  echo "  Current phase: $PHASE_NUM"
  echo "  Total phases: $TOTAL_PHASES"
  echo "  Next phase: $NEXT_PHASE"
  
  # Extract next phase name if available
  NEXT_PHASE_NAME=$(grep -E "^##\s*(Phase|PHASE)\s*$NEXT_PHASE" .planning/ROADMAP.md | sed 's/^##\s*//' | head -1)
  echo "  Next phase name: ${NEXT_PHASE_NAME:-Unknown}"
  
else
  echo "WARNING: No ROADMAP.md found"
  TOTAL_PHASES=1
fi

# Determine if this is last phase
if [ "$NEXT_PHASE" -gt "$TOTAL_PHASES" ]; then
  IS_LAST_PHASE=true
  echo ""
  echo "This is the FINAL phase!"
else
  IS_LAST_PHASE=false
fi

# Check milestone boundaries
# (Milestones typically group 3-5 phases)
CURRENT_MILESTONE=$((PHASE_NUM / 5 + 1))
NEXT_MILESTONE=$((NEXT_PHASE / 5 + 1))

if [ "$CURRENT_MILESTONE" -ne "$NEXT_MILESTONE" ] || [ "$IS_LAST_PHASE" = true ]; then
  IS_MILESTONE_COMPLETE=true
  echo "Milestone $CURRENT_MILESTONE complete!"
else
  IS_MILESTONE_COMPLETE=false
fi
```

**Output:** `NEXT_PHASE`, `IS_LAST_PHASE`, `IS_MILESTONE_COMPLETE`
**Validation:** Next phase number is valid integer
**On failure:** Default to current phase + 1

---

## Step 5: Handle Milestone Completion

**Goal:** If milestone complete, create summary and additional archives

**Condition:** `IS_MILESTONE_COMPLETE == true`

**Commands:**
```bash
if [ "$IS_MILESTONE_COMPLETE" = true ]; then
  echo "Processing milestone completion..."
  
  MILESTONE_DIR=".idumb/brain/archive/milestones/M$CURRENT_MILESTONE"
  mkdir -p "$MILESTONE_DIR"
  
  # Create milestone summary
  cat > "$MILESTONE_DIR/SUMMARY.md" << EOF
# Milestone $CURRENT_MILESTONE Summary

Completed: $(date -u +"%Y-%m-%d %H:%M UTC")

## Phases Completed

$(for p in $(seq 1 $PHASE_NUM); do
  STATUS=$(jq -r ".phases[\"$p\"].status // \"unknown\"" "$ROADMAP_STATUS" 2>/dev/null)
  RATE=$(jq -r ".phases[\"$p\"].passRate // 0" "$ROADMAP_STATUS" 2>/dev/null)
  echo "- Phase $p: $STATUS (${RATE}% pass rate)"
done)

## Key Metrics

- Total Phases: $PHASE_NUM
- Average Pass Rate: $(jq '[.phases[].passRate] | add / length' "$ROADMAP_STATUS" 2>/dev/null || echo "N/A")%
- Total Tasks Completed: $(jq '[.phases[].tasksCompleted] | add' "$ROADMAP_STATUS" 2>/dev/null || echo "N/A")

## Learnings & Insights

*(Extracted from phase verification documents)*

$(grep -h "Learning\|Insight\|Note\|lesson" .planning/phases/*/*.md 2>/dev/null | head -10 || echo "No learnings documented.")

## Carried Forward

- Open questions from final phase
- Risks that remain relevant
- Technical debt identified

EOF
  
  echo "Created milestone summary: $MILESTONE_DIR/SUMMARY.md"
  
  # Link phase archives to milestone
  for p in $(seq $((CURRENT_MILESTONE - 1) * 5 + 1) $PHASE_NUM); do
    if [ -d ".idumb/brain/archive/phases/$p" ]; then
      ln -sf "../../phases/$p" "$MILESTONE_DIR/phase-$p" 2>/dev/null || true
    fi
  done
  
  # Sync with planning if present
  if [ -f ".planning/STATE.md" ]; then
    echo "$(date -u +%Y-%m-%dT%H:%M:%SZ)|milestone|M$CURRENT_MILESTONE|complete" >> .idumb/planning-sync.log
    echo "Logged milestone completion to planning-sync.log"
  fi
  
  echo ""
  echo "Milestone $CURRENT_MILESTONE archived and summarized."
fi
```

**Output:** Milestone summary and archive (if milestone complete)
**Validation:** Summary file created if milestone boundary
**On failure:** Warn but continue (non-blocking)

---

## Step 6: Prepare Next Phase Context

**Goal:** Create context preparation file for the next phase

**Commands:**
```bash
if [ "$IS_LAST_PHASE" = false ]; then
  PREP_FILE=".idumb/brain/phase-${NEXT_PHASE}-prep.json"
  
  # Extract learnings from completed phase
  LEARNINGS=$(grep -h "Learning\|learned\|insight\|discovered" "$VERIFICATION_FILE" 2>/dev/null | head -5 | jq -R -s -c 'split("\n") | map(select(length > 0))')
  
  # Extract open questions
  OPEN_QUESTIONS=$(grep -h "?\|question\|unclear\|TBD" .planning/phases/$PHASE_NUM/*.md 2>/dev/null | head -5 | jq -R -s -c 'split("\n") | map(select(length > 0))')
  
  # Extract risks that may carry forward
  RISKS=$(grep -h -i "risk\|concern\|warning\|caution" .planning/phases/$PHASE_NUM/*.md 2>/dev/null | head -5 | jq -R -s -c 'split("\n") | map(select(length > 0))')
  
  # Create prep file
  cat > "$PREP_FILE" << EOF
{
  "forPhase": $NEXT_PHASE,
  "createdAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "previousPhase": {
    "number": $PHASE_NUM,
    "passRate": $PASS_RATE,
    "tasksCompleted": $TASKS_COMPLETED,
    "tasksTotal": $TASKS_TOTAL
  },
  "learnings": $LEARNINGS,
  "openQuestions": $OPEN_QUESTIONS,
  "risksCarriedForward": $RISKS,
  "blockedItemsCarriedForward": $(grep -c "BLOCKED" "$VERIFICATION_FILE" 2>/dev/null || echo "0"),
  "recommendations": [
    "Review learnings before starting",
    "Address open questions early",
    "Monitor carried-forward risks"
  ]
}
EOF

  echo "Created next phase preparation: $PREP_FILE"
  jq '.' "$PREP_FILE"
fi
```

**Output:** Phase preparation JSON file
**Validation:** Valid JSON created
**On failure:** Create minimal prep file

---

## Step 7: Update iDumb State

**Goal:** Update governance state to reflect transition

**Commands:**
```bash
TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)

# Read current state
STATE=$(cat .idumb/brain/state.json)

# Determine new phase value
if [ "$IS_LAST_PHASE" = true ]; then
  NEW_PHASE="complete"
  NEW_STATUS="project_complete"
else
  NEW_PHASE="$NEXT_PHASE"
  NEW_STATUS="not_started"
fi

# Update state
STATE=$(echo "$STATE" | jq \
  --arg phase "$NEW_PHASE" \
  --arg status "$NEW_STATUS" \
  --arg ts "$TIMESTAMP" \
  --arg prev "$PHASE_NUM" \
  --arg next "$NEXT_PHASE" \
  '
  .phase = $phase |
  .phaseStatus = $status |
  .lastTransition = $ts |
  .completedPhases = ((.completedPhases // []) + [$prev | tonumber]) |
  .history = (.history + [{
    "timestamp": $ts,
    "action": "phase:transition",
    "agent": "transition-workflow",
    "result": "success:\($prev)->\($next)"
  }])
  ')

# Write updated state
echo "$STATE" | jq '.' > .idumb/brain/state.json

echo "State updated:"
echo "  Phase: $NEW_PHASE"
echo "  Status: $NEW_STATUS"
echo "  Completed phases: $(echo "$STATE" | jq '.completedPhases')"
```

**Output:** Updated `state.json`
**Validation:** state.json still valid JSON
**On failure:** Rollback from backup

---

## Step 8: Present Transition Summary

**Goal:** Notify user of successful transition with clear next steps

**Template:**
```markdown
## Phase {PHASE_NUM} Complete

**Pass Rate:** {PASS_RATE}%
**Tasks Completed:** {TASKS_COMPLETED}/{TASKS_TOTAL}
**Duration:** {PHASE_DURATION}

### Archived Artifacts
- Planning documents: {ARCHIVED_MD} files
- Execution checkpoints: {CHECKPOINTS} files
- Archive location: `.idumb/brain/archive/phases/{PHASE_NUM}/`

{if IS_MILESTONE_COMPLETE}
### Milestone {CURRENT_MILESTONE} Complete!
Congratulations on completing Milestone {CURRENT_MILESTONE}!
Summary available at: `.idumb/brain/archive/milestones/M{CURRENT_MILESTONE}/SUMMARY.md`
{end}

{if IS_LAST_PHASE}
### Project Complete!
All phases verified and archived.
Run `/idumb:summary` to view project completion report.
{else}
### Next: Phase {NEXT_PHASE} - {NEXT_PHASE_NAME}

Ready to start Phase {NEXT_PHASE}?

**Recommended:** `/idumb:discuss-phase {NEXT_PHASE}`
**Skip discussion:** `/idumb:plan-phase {NEXT_PHASE}`

Preparation context saved to: `.idumb/brain/phase-{NEXT_PHASE}-prep.json`
{end}
```

**Display:** Present summary to user
**Await:** User decision on next action
</execution_flow>

<milestone_completion>
## Milestone Ceremony

### Trigger Conditions
- Last phase in milestone boundary (phases 5, 10, 15, etc.)
- Final phase of entire project
- Explicit milestone marker in roadmap

### Ceremony Steps

1. **Create Milestone Archive**
   ```bash
   MILESTONE_DIR=".idumb/brain/archive/milestones/M{N}"
   mkdir -p "$MILESTONE_DIR"
   ```

2. **Generate Summary Document**
   - List all phases in milestone
   - Aggregate metrics (pass rates, task counts)
   - Extract key learnings
   - Document carried-forward items

3. **Link Phase Archives**
   - Symlink phase archives into milestone directory
   - Create unified timeline view

4. **Planning Sync**
   - Log milestone completion to sync log
   - If planning system active, note state alignment

5. **Celebration**
   - Acknowledge achievement
   - Present cumulative progress
   - Motivate for next milestone
</milestone_completion>

<output_artifact>
## Artifact: Roadmap Status

**Path:** `.idumb/brain/roadmap-status.json`

**Schema:**
```json
{
  "version": "1.0.0",
  "lastUpdated": "2026-02-04T10:30:00Z",
  "phases": {
    "1": {
      "status": "complete",
      "startedAt": "2026-02-01T09:00:00Z",
      "completedAt": "2026-02-02T17:30:00Z",
      "passRate": 95,
      "tasksTotal": 12,
      "tasksCompleted": 12,
      "verificationFile": ".planning/phases/1/VERIFICATION.md"
    },
    "2": {
      "status": "in_progress",
      "startedAt": "2026-02-03T09:00:00Z",
      "completedAt": null,
      "passRate": null,
      "tasksTotal": 8,
      "tasksCompleted": 3,
      "verificationFile": null
    }
  },
  "milestones": {
    "M1": {
      "status": "complete",
      "phases": [1, 2, 3, 4, 5],
      "completedAt": "2026-02-10T15:00:00Z"
    }
  },
  "summary": {
    "totalPhases": 10,
    "completedPhases": 5,
    "averagePassRate": 92.5,
    "totalTasksCompleted": 48
  }
}
```

---

## Artifact: Phase Archive

**Path:** `.idumb/brain/archive/phases/{N}/`

**Contents:**
| File | Description |
|------|-------------|
| `*CONTEXT.md` | Phase context document |
| `*PLAN.md` | Phase execution plan |
| `*SUMMARY.md` | Execution summary |
| `*VERIFICATION.md` | Verification results |
| `final-progress.json` | Final task states |
| `checkpoint-*.json` | All execution checkpoints |
| `MANIFEST.json` | Archive metadata |

---

## Artifact: Transition Log

**Path:** `.idumb/brain/transitions.log`

**Format:** `{timestamp}|{from_phase}|{to_phase}|{pass_rate}|{status}`

**Example:**
```
2026-02-02T17:30:00Z|1|2|95|success
2026-02-04T14:00:00Z|2|3|88|success
2026-02-06T11:00:00Z|3|4|92|success
```
</output_artifact>

<chain_rules>
## On Successful Transition

### To Next Phase
**Condition:** `IS_LAST_PHASE == false`
**Action:** Prompt user with options
**Auto:** false

```bash
echo "Ready for Phase $NEXT_PHASE?"
echo ""
echo "Options:"
echo "  /idumb:discuss-phase $NEXT_PHASE  - Start with discussion (recommended)"
echo "  /idumb:plan-phase $NEXT_PHASE     - Skip to planning"
echo "  /idumb:status                      - View current state"
```

### Milestone Complete
**Condition:** `IS_MILESTONE_COMPLETE == true`
**Action:** Present milestone summary, then continue
**Auto:** false

```bash
echo "Milestone $CURRENT_MILESTONE complete!"
echo ""
echo "View summary: cat .idumb/brain/archive/milestones/M$CURRENT_MILESTONE/SUMMARY.md"
echo ""
echo "Ready for next milestone?"
```

### Project Complete
**Condition:** `IS_LAST_PHASE == true`
**Action:** Project completion ceremony
**Auto:** false

```bash
echo "PROJECT COMPLETE!"
echo ""
echo "All $TOTAL_PHASES phases verified and archived."
echo ""
echo "View project summary: /idumb:summary"
echo "Archive location: .idumb/brain/archive/"
```

## On Transition Failure

### Pass Rate Too Low
1. Present specific failures from verification
2. Suggest fixes
3. Direct to `/idumb:execute-phase` to address

### Critical Blocked Items
1. List blocked items
2. Explain why transition cannot proceed
3. Offer options: resolve or mark as deferred

### Archive Failure
1. Log error
2. Continue with warning
3. Suggest manual archive
</chain_rules>

<integration_points>
## System Integration

### Triggered By
- Successful `/idumb:verify-work` with pass rate >= 80%
- `resume-project` workflow detecting verified phase

### Reads From
| Path | Purpose |
|------|---------|
| `.planning/phases/{N}/*VERIFICATION.md` | Verification results |
| `.planning/phases/{N}/*.md` | Phase artifacts to archive |
| `.planning/ROADMAP.md` | Total phase count, phase names |
| `.idumb/brain/state.json` | Current governance state |
| `.idumb/brain/execution/{N}/*.json` | Execution artifacts |

### Writes To
| Path | Purpose |
|------|---------|
| `.idumb/brain/archive/phases/{N}/` | Phase archive |
| `.idumb/brain/archive/milestones/M{N}/` | Milestone archive |
| `.idumb/brain/roadmap-status.json` | Shadow tracking |
| `.idumb/brain/phase-{N+1}-prep.json` | Next phase prep |
| `.idumb/brain/state.json` | Updated state |
| `.idumb/brain/transitions.log` | Transition history |
| `.idumb/planning-sync.log` | Planning sync log |

### Never Modifies
- `.planning/ROADMAP.md` - Planning system owns this
- `.planning/phases/{N}/*.md` - Read-only after verification
- Any source code files
</integration_points>

<success_criteria>
## Verification Checkboxes

### Pre-execution
- [ ] VERIFICATION.md exists for target phase
- [ ] Pass rate >= 80%
- [ ] No critical blocked items
- [ ] Phase number correctly identified

### Archival
- [ ] Archive directory created
- [ ] Planning artifacts copied
- [ ] Execution artifacts copied (if exist)
- [ ] Archive manifest created

### Tracking Update
- [ ] roadmap-status.json updated
- [ ] Phase marked as complete
- [ ] Metrics recorded (pass rate, tasks)

### State Update
- [ ] state.json phase advanced
- [ ] completedPhases array updated
- [ ] History entry added
- [ ] state.json still valid JSON

### Next Phase Prep
- [ ] If not last: prep file created
- [ ] Learnings extracted
- [ ] Risks carried forward

### Milestone (if applicable)
- [ ] Milestone summary created
- [ ] Phase archives linked
- [ ] Planning sync logged

### User Communication
- [ ] Transition summary presented
- [ ] Next steps clearly explained
- [ ] Archive location indicated
</success_criteria>

---
*Workflow: transition v1.0.0 (GSD)*
