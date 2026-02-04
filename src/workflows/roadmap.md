---
name: roadmap
id: wf-roadmap
parent: workflows
description: "Roadmap creation workflow for project planning with phases, milestones, dependencies, and timelines"
type: workflow
version: 1.0.0
gsd_version: "1.0.0"
last_updated: 2026-02-04
---

<purpose>
Create comprehensive project roadmaps that break down project scope into executable phases with clear milestones, dependencies, and success criteria. Transforms high-level project goals into a navigable map that guides all subsequent planning and execution.
</purpose>

<philosophy>
Core principles guiding roadmap creation:

1. **Goal-Backward Planning**: Start from end goal, work backward to define phases. What must be true for success?
2. **Dependency-First Ordering**: Phases ordered by what unblocks what, not arbitrary sequence.
3. **Right-Sized Phases**: Each phase should be completable in ~50% context budget with measurable outcome.
4. **Explicit Exit Criteria**: Every phase has clear, checkable completion criteria.
5. **Built-In Validation**: Integration points and validation phases prevent silent drift.
6. **Honest Estimation**: Prefer "unknown" over fabricated timelines. Research unknowns first.
</philosophy>

<entry_check>
```bash
# === ENTRY VALIDATION ===
# These checks MUST pass before roadmap creation

# Check 1: iDumb initialized
test -f ".idumb/idumb-brain/state.json" || {
  echo "WARNING: iDumb not initialized"
  echo "Roadmap can proceed but state won't be tracked"
}

# Check 2: PROJECT.md exists
test -f ".planning/PROJECT.md" || {
  echo "ERROR: PROJECT.md required"
  echo "ACTION: Create project definition first"
  echo "Run: /idumb:init-project or create .planning/PROJECT.md"
  exit 1
}

# Check 3: Check for existing roadmap
if [ -f ".planning/ROADMAP.md" ]; then
  echo "WARNING: ROADMAP.md already exists"
  echo "OPTIONS:"
  echo "  [overwrite] Replace existing roadmap"
  echo "  [update] Modify existing roadmap"
  echo "  [cancel] Abort"
  ROADMAP_EXISTS=true
else
  ROADMAP_EXISTS=false
fi

# Check 4: Research available (optional but recommended)
RESEARCH_FILES=$(find .planning/research -name "*.md" 2>/dev/null | wc -l)
if [ "$RESEARCH_FILES" -gt 0 ]; then
  echo "✓ Research available: ${RESEARCH_FILES} documents"
else
  echo "NOTE: No research found. Consider /idumb:research before roadmapping"
fi

# Check 5: Requirements available (optional)
test -f ".planning/REQUIREMENTS.md" && echo "✓ REQUIREMENTS.md available"

# Ensure directory structure
mkdir -p ".planning/phases"

echo "✓ Entry validation complete"
```
</entry_check>

<execution_flow>
## Step 1: Analyze Project Requirements

**Goal:** Extract project scope, goals, and constraints from existing documentation

**Commands:**
```bash
# Load project definition
echo "=== Loading Project Context ==="

PROJECT_FILE=".planning/PROJECT.md"
REQUIREMENTS_FILE=".planning/REQUIREMENTS.md"

# Extract project name
PROJECT_NAME=$(grep -m1 "^# " "${PROJECT_FILE}" 2>/dev/null | sed 's/# //')
echo "Project: ${PROJECT_NAME:-Unnamed Project}"

# Extract goals section
PROJECT_GOALS=$(sed -n '/## Goals/,/##/p' "${PROJECT_FILE}" 2>/dev/null | head -20)
echo "Goals extracted: $(echo "$PROJECT_GOALS" | wc -l) lines"

# Extract constraints
PROJECT_CONSTRAINTS=$(sed -n '/## Constraints/,/##/p' "${PROJECT_FILE}" 2>/dev/null | head -15)

# Load requirements if available
if [ -f "${REQUIREMENTS_FILE}" ]; then
  REQUIREMENTS=$(cat "${REQUIREMENTS_FILE}")
  REQ_COUNT=$(grep -c "^- \|^[0-9]\." "${REQUIREMENTS_FILE}" 2>/dev/null || echo "0")
  echo "Requirements loaded: ${REQ_COUNT} items"
fi

# Load research findings if available
RESEARCH_SUMMARY=""
for research_file in .planning/research/*-RESEARCH.md; do
  if [ -f "$research_file" ]; then
    SUMMARY=$(sed -n '/## Executive Summary/,/##/p' "$research_file" 2>/dev/null | head -10)
    RESEARCH_SUMMARY="${RESEARCH_SUMMARY}\n---\n${SUMMARY}"
  fi
done
echo "Research summaries loaded"

# Create context file for roadmapper
cat > ".planning/.roadmap-context.tmp" << EOF
# Roadmap Context
Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")

## Project: ${PROJECT_NAME}

## Goals
${PROJECT_GOALS}

## Constraints
${PROJECT_CONSTRAINTS}

## Requirements Count: ${REQ_COUNT:-0}

## Research Summary
${RESEARCH_SUMMARY}
EOF

echo "✓ Context prepared for analysis"
```

**Validation:** PROJECT.md loaded, goals extracted
**On failure:** Ask user to provide project goals

---

## Step 2: Define Phases (Goal-Backward)

**Goal:** Work backward from end goal to identify necessary phases

**Method: Goal-Backward Decomposition**
```markdown
## Goal-Backward Process

1. **Define End State:** What does "done" look like?
   - Project is complete when: [criteria]
   - Users can: [capabilities]
   - System is: [state]

2. **Identify Final Phase:** What's the last thing before "done"?
   - Usually: Integration, Polish, or Release phase

3. **Work Backward:** What must be true before final phase?
   - Each answer becomes a phase
   - Continue until reaching "start from scratch"

4. **Order by Dependencies:** Which phases unblock others?
   - Foundation phases first
   - Integration phases after implementation
   - Validation phases at key checkpoints
```

**Commands:**
```bash
# Generate phase skeleton
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

cat > ".planning/.phases-draft.tmp" << 'PHASE_EOF'
# Phase Draft

## Goal-Backward Analysis

### End State (Done)
- [ ] [What makes project complete]
- [ ] [User-facing capability]
- [ ] [Technical requirement]

### Phase N (Final): [Name]
- **Goal:** [What this phase achieves]
- **Depends On:** Phase N-1
- **Exit Criteria:** [How we know it's done]

### Phase N-1: [Name]
- **Goal:** [What this phase achieves]
- **Depends On:** [Previous phases]
- **Exit Criteria:** [How we know it's done]

### Phase 1 (Foundation): [Name]
- **Goal:** [What this phase achieves]
- **Depends On:** Nothing (starting point)
- **Exit Criteria:** [How we know it's done]

## Dependency Graph
[Phase 1] --> [Phase 2] --> [Phase N]
            \-> [Phase 3] -/
PHASE_EOF

echo "Phase skeleton created. Agent will populate."
```

**Agent Instructions:**
The roadmapper agent must:
1. Analyze project goals from context
2. Define end state explicitly
3. Work backward phase by phase
4. Ensure each phase has clear deliverable
5. Map dependencies between phases

**Validation:** At least 2 phases defined with exit criteria
**On failure:** Use minimal 2-phase template (Foundation + Implementation)

---

## Step 3: Map Dependencies

**Goal:** Create explicit dependency graph between phases

**Commands:**
```bash
# Analyze phase dependencies
cat > ".planning/.dependencies.tmp" << 'DEP_EOF'
# Dependency Analysis

## Dependency Matrix

| Phase | Depends On | Blocks | Critical Path |
|-------|------------|--------|---------------|
| Phase 1 | - | Phase 2, 3 | Yes |
| Phase 2 | Phase 1 | Phase 4 | Yes |
| Phase 3 | Phase 1 | Phase 4 | No |
| Phase 4 | Phase 2, 3 | - | Yes |

## Critical Path
Phase 1 → Phase 2 → Phase 4

## Parallel Opportunities
- Phase 2 and Phase 3 can run in parallel after Phase 1

## External Dependencies
- [ ] [External dep 1]
- [ ] [External dep 2]

## Risk Points
- If Phase 2 delayed: [Impact]
- If Phase 3 blocked: [Impact]
DEP_EOF

echo "Dependency template created"
```

**Validation Questions:**
```markdown
For each phase, ask:
1. What must be complete before this phase can start?
2. What does this phase unblock?
3. Can this phase run in parallel with any other?
4. Are there external dependencies (APIs, services, approvals)?
5. What's the impact if this phase is delayed?
```

**Validation:** No circular dependencies, critical path identified
**On failure:** Simplify to linear dependency chain

---

## Step 4: Estimate Timeline

**Goal:** Provide realistic time estimates with uncertainty acknowledgment

**Commands:**
```bash
# Timeline estimation template
cat > ".planning/.timeline.tmp" << 'TIME_EOF'
# Timeline Estimation

## Estimation Principles
- Use ranges, not fixed dates
- Acknowledge unknowns explicitly
- Include buffer for validation phases
- Research phases reduce estimation uncertainty

## Phase Estimates

| Phase | Optimistic | Realistic | Pessimistic | Confidence |
|-------|------------|-----------|-------------|------------|
| Phase 1 | 2d | 3d | 5d | Medium |
| Phase 2 | 3d | 5d | 8d | Low |
| Phase 3 | 2d | 3d | 4d | High |
| Phase 4 | 1d | 2d | 3d | Medium |

## Total Estimates
- Optimistic: [Sum of optimistic]
- Realistic: [Sum of realistic]
- Pessimistic: [Sum of pessimistic]

## Uncertainty Factors
- [ ] [Unknown that could extend timeline]
- [ ] [Risk that could cause delay]

## Review Points
- After Phase 1: Re-estimate Phase 2-4
- After Phase 2: Re-estimate Phase 3-4
TIME_EOF

echo "Timeline template created"
```

**Estimation Rules:**
1. **Unknown = Research First:** If can't estimate, add research phase
2. **3-Point Estimation:** Always provide optimistic/realistic/pessimistic
3. **Confidence Levels:** High (done before), Medium (similar work), Low (new territory)
4. **Buffer:** Add 20% buffer to total realistic estimate

**Validation:** Each phase has estimate range
**On failure:** Use "TBD - requires research" with research task

---

## Step 5: Validate Roadmap

**Goal:** Verify roadmap is complete, coherent, and achievable

**Commands:**
```bash
# Validation checklist
echo "=== Roadmap Validation ==="

# Check 1: All phases have exit criteria
PHASES_NO_EXIT=$(grep -c "Exit Criteria.*\[\]" ".planning/.phases-draft.tmp" || echo "0")
echo "Phases without exit criteria: ${PHASES_NO_EXIT}"

# Check 2: Dependencies are resolvable
echo "Checking for circular dependencies..."
# (Logic would be implemented by agent)

# Check 3: Timeline is reasonable
echo "Checking timeline against constraints..."

# Check 4: Integration points defined
echo "Checking for validation/integration phases..."

# Create validation report
cat > ".planning/.roadmap-validation.tmp" << 'VAL_EOF'
# Roadmap Validation Report

## Completeness
- [ ] All phases have clear objectives
- [ ] All phases have exit criteria
- [ ] All phases have deliverables
- [ ] All phases have estimates

## Dependencies
- [ ] No circular dependencies
- [ ] Critical path identified
- [ ] External dependencies documented
- [ ] Parallel opportunities identified

## Achievability
- [ ] Timeline fits project constraints
- [ ] Resource requirements realistic
- [ ] Unknowns have research phases
- [ ] Buffer included in estimates

## Quality
- [ ] Integration phases included
- [ ] Validation checkpoints present
- [ ] Phase sizes are manageable
- [ ] Success metrics defined

## Issues Found
1. [Issue 1] - [Severity] - [Resolution]
2. [Issue 2] - [Severity] - [Resolution]
VAL_EOF

echo "Validation template created"
```

**Agent Validation:**
Spawn `@idumb-integration-checker` to verify:
- Dependencies are realistic
- Timeline is achievable
- Resource constraints met
- Integration points covered

**Validation:** All checklist items pass or have noted exceptions
**On failure:** Document issues, offer to revise

---

## Step 6: Document and Publish ROADMAP.md

**Goal:** Create final ROADMAP.md artifact

**Commands:**
```bash
# Generate final roadmap
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
DATE_STAMP=$(date +"%Y-%m-%d")
OUTPUT_PATH=".planning/ROADMAP.md"

cat > "${OUTPUT_PATH}" << EOF
---
type: roadmap
project: "${PROJECT_NAME}"
status: draft
created: ${TIMESTAMP}
version: 1.0.0
phases_count: [N]
estimated_duration: "[range]"
confidence: medium
---

# Project Roadmap: ${PROJECT_NAME}

## Executive Summary
[One paragraph: What we're building, key phases, timeline, success criteria]

## Project Vision
${PROJECT_GOALS}

## Phase Overview

| Phase | Name | Duration | Dependencies | Status |
|-------|------|----------|--------------|--------|
| 1 | [Name] | [Est] | - | Not Started |
| 2 | [Name] | [Est] | Phase 1 | Not Started |
| 3 | [Name] | [Est] | Phase 2 | Not Started |

## Detailed Phases

### Phase 1: [Name]
**Objective:** [Clear goal statement]
**Duration:** [Optimistic] - [Pessimistic]
**Dependencies:** None (starting point)

**Deliverables:**
- [ ] [Deliverable 1]
- [ ] [Deliverable 2]

**Exit Criteria:**
- [ ] [Criterion 1]
- [ ] [Criterion 2]

**Risks:**
- [Risk 1] - Mitigation: [Strategy]

---

### Phase 2: [Name]
**Objective:** [Clear goal statement]
**Duration:** [Optimistic] - [Pessimistic]
**Dependencies:** Phase 1

**Deliverables:**
- [ ] [Deliverable 1]
- [ ] [Deliverable 2]

**Exit Criteria:**
- [ ] [Criterion 1]
- [ ] [Criterion 2]

**Risks:**
- [Risk 1] - Mitigation: [Strategy]

---

### Phase N: [Final Phase Name]
**Objective:** [Clear goal statement]
**Duration:** [Optimistic] - [Pessimistic]
**Dependencies:** [Previous phases]

**Deliverables:**
- [ ] [Final deliverable 1]
- [ ] [Final deliverable 2]

**Exit Criteria:**
- [ ] [Project completion criterion 1]
- [ ] [Project completion criterion 2]

---

## Dependency Graph

\`\`\`
[Phase 1: Foundation]
       │
       ├──────────────┐
       ▼              ▼
[Phase 2: Core]  [Phase 3: Support]
       │              │
       └──────┬───────┘
              ▼
     [Phase 4: Integration]
              │
              ▼
     [Phase 5: Release]
\`\`\`

## Critical Path
Phase 1 → Phase 2 → Phase 4 → Phase 5

## Timeline

### Gantt Overview
\`\`\`
Phase 1: ████████░░░░░░░░░░░░ Week 1-2
Phase 2: ░░░░░░░░████████████ Week 2-4
Phase 3: ░░░░░░░░████████░░░░ Week 2-3
Phase 4: ░░░░░░░░░░░░░░██████ Week 4-5
Phase 5: ░░░░░░░░░░░░░░░░░░██ Week 5
\`\`\`

### Estimates
| Scenario | Duration | Confidence |
|----------|----------|------------|
| Optimistic | [X days/weeks] | 20% |
| Realistic | [Y days/weeks] | 60% |
| Pessimistic | [Z days/weeks] | 20% |

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| [Risk 1] | Medium | High | [Strategy] |
| [Risk 2] | Low | High | [Strategy] |

## Success Metrics

### Project Success
- [ ] [Metric 1: Measurable outcome]
- [ ] [Metric 2: Measurable outcome]

### Phase Success
Each phase is successful when:
1. All exit criteria met
2. Deliverables complete and validated
3. No blocking issues for next phase

## Integration Points

- After Phase 1: Architecture validation
- After Phase 2: Core functionality review
- After Phase 4: End-to-end integration test
- Before Release: Full validation sweep

## Open Questions
- [ ] [Question requiring resolution]
- [ ] [Decision pending]

## Change Log
| Date | Change | Author |
|------|--------|--------|
| ${DATE_STAMP} | Initial roadmap created | Workflow |

---
*Roadmap: ${PROJECT_NAME} v1.0.0*
*Created: ${DATE_STAMP}*
*Workflow: roadmap v1.0.0 GSD*
EOF

echo "✓ ROADMAP.md created: ${OUTPUT_PATH}"
wc -l "${OUTPUT_PATH}"

# Create phase directories
for i in $(seq 1 5); do
  mkdir -p ".planning/phases/${i}"
  echo "Created: .planning/phases/${i}/"
done

# Cleanup temp files
rm -f .planning/.roadmap-context.tmp
rm -f .planning/.phases-draft.tmp
rm -f .planning/.dependencies.tmp
rm -f .planning/.timeline.tmp
rm -f .planning/.roadmap-validation.tmp

echo "✓ Phase directories created"
```

**Validation:**
```bash
test -f ".planning/ROADMAP.md" && \
  grep -q "## Phase Overview" ".planning/ROADMAP.md" && \
  grep -q "## Critical Path" ".planning/ROADMAP.md" && \
  echo "✓ ROADMAP.md is valid"
```
**On failure:** Report missing sections, offer to regenerate

---

## Step 7: Update State

**Goal:** Record roadmap creation in governance state

**Commands:**
```bash
# Update state
STATE_FILE=".idumb/idumb-brain/state.json"

if [ -f "${STATE_FILE}" ]; then
  CURRENT=$(cat "${STATE_FILE}")
  echo "${CURRENT}" | jq '
    .phase = "roadmap-complete" |
    .framework = "planning" |
    .lastValidation = "'${TIMESTAMP}'" |
    .history += [{
      "timestamp": "'${TIMESTAMP}'",
      "action": "roadmap",
      "agent": "workflow/roadmap",
      "result": "pass",
      "details": "Roadmap created with [N] phases"
    }]
  ' > "${STATE_FILE}.tmp" && mv "${STATE_FILE}.tmp" "${STATE_FILE}"
  
  echo "✓ State updated"
fi

# Create anchor for roadmap
echo "Creating context anchor..."
# Use idumb-state anchor tool or manual
```

**Validation:** State file updated, history entry added
**On failure:** Log warning, continue

</execution_flow>

<agent_spawning>
| Agent | Condition | Task | Timeout | Output |
|-------|-----------|------|---------|--------|
| idumb-roadmapper | Always | Create roadmap structure | 300s | ROADMAP.md |
| idumb-project-researcher | Unknown domain | Research domain before roadmapping | 180s | RESEARCH.md |
| idumb-integration-checker | After draft | Validate roadmap completeness | 60s | validation-report.md |
| idumb-skeptic-validator | Before publish | Challenge assumptions | 60s | skeptic-report.md |
</agent_spawning>

<roadmap_structure>
## ROADMAP.md Structure

```
ROADMAP.md
├── Frontmatter (YAML)
├── Executive Summary
├── Project Vision
├── Phase Overview (Table)
├── Detailed Phases
│   ├── Phase 1: [Name]
│   │   ├── Objective
│   │   ├── Duration
│   │   ├── Dependencies
│   │   ├── Deliverables
│   │   ├── Exit Criteria
│   │   └── Risks
│   ├── Phase 2: [Name]
│   └── Phase N: [Name]
├── Dependency Graph (ASCII)
├── Critical Path
├── Timeline
│   ├── Gantt Overview
│   └── Estimates Table
├── Risk Assessment
├── Success Metrics
├── Integration Points
├── Open Questions
└── Change Log
```

## Phase Sizing Guidelines

| Phase Size | Duration | Tasks | Context % |
|------------|----------|-------|-----------|
| Small | 1-2 days | 3-5 | ~20% |
| Medium | 3-5 days | 5-10 | ~30% |
| Large | 1-2 weeks | 10-15 | ~50% |
| Too Large | 2+ weeks | 15+ | >50% |

**Rule:** If phase exceeds "Large", split into sub-phases.
</roadmap_structure>

<output_artifact>
## Artifact: ROADMAP.md

**Path:** `.planning/ROADMAP.md`
**Also Creates:** `.planning/phases/{N}/` directories

### Frontmatter
```yaml
type: roadmap
project: "{project name}"
status: draft | active | complete
created: "{ISO-8601 timestamp}"
version: 1.0.0
phases_count: {number}
estimated_duration: "{range}"
confidence: high | medium | low
```

### Required Sections
1. **Executive Summary** - One paragraph overview
2. **Project Vision** - Goals from PROJECT.md
3. **Phase Overview** - Summary table
4. **Detailed Phases** - Full phase definitions
5. **Dependency Graph** - ASCII visualization
6. **Critical Path** - Sequence that determines duration
7. **Timeline** - Gantt + estimates
8. **Risk Assessment** - Table with mitigations
9. **Success Metrics** - Measurable outcomes
10. **Integration Points** - Validation checkpoints
11. **Open Questions** - Unresolved items
12. **Change Log** - Version history

### Quality Criteria
- Every phase has objective, deliverables, exit criteria
- Dependencies form valid DAG (no cycles)
- Timeline includes ranges, not fixed dates
- Critical path identified
- Risks have mitigations
- Integration points at phase boundaries
</output_artifact>

<chain_rules>
## On Success
**Chain to:** `/idumb:discuss-phase 1`
**Auto:** false

**Prompt:**
```markdown
Roadmap created: .planning/ROADMAP.md
📊 ${PHASE_COUNT} phases defined
⏱️ Estimated duration: ${TIMELINE_RANGE}

Ready to discuss Phase 1?
→ [Discuss] Run /idumb:discuss-phase 1
→ [Review] Open ROADMAP.md for review
→ [Research] More research before proceeding
```

---

## On Partial (Incomplete Phases)
**Action:** Save draft, mark incomplete

```bash
sed -i 's/status: draft/status: incomplete/' "${OUTPUT_PATH}"
```

**Prompt:**
```markdown
Roadmap draft saved with incomplete phases.
Missing: [list incomplete phases]

Continue: /idumb:roadmap --continue
```

---

## On Failure
**Action:** Log error, preserve work

```bash
# Save draft as backup
cp .planning/.phases-draft.tmp .planning/ROADMAP-draft.md 2>/dev/null
echo "[${TIMESTAMP}] roadmap:failed - ${ERROR}" >> .idumb/idumb-brain/history/errors.log
```

**Prompt:**
```markdown
Roadmap creation failed: ${ERROR}
Draft saved: .planning/ROADMAP-draft.md

Options:
- Fix issue and retry: /idumb:roadmap
- Continue from draft: /idumb:roadmap --from-draft
```
</chain_rules>

<success_criteria>
## Verification Checkboxes

### Entry Validation
- [ ] PROJECT.md exists with goals
- [ ] iDumb initialized (optional but recommended)
- [ ] Research available (optional but recommended)

### Phase Definition
- [ ] End state clearly defined
- [ ] Phases work backward from end state
- [ ] Each phase has clear objective
- [ ] Each phase has exit criteria
- [ ] Each phase has deliverables
- [ ] Phase sizes are manageable (<50% context)

### Dependencies
- [ ] All dependencies documented
- [ ] No circular dependencies
- [ ] Critical path identified
- [ ] Parallel opportunities noted
- [ ] External dependencies listed

### Timeline
- [ ] Three-point estimates (optimistic/realistic/pessimistic)
- [ ] Confidence levels assigned
- [ ] Buffer included
- [ ] Unknowns flagged for research

### Validation
- [ ] Integration points defined
- [ ] Risks identified with mitigations
- [ ] Success metrics measurable
- [ ] Open questions documented

### Artifact Quality
- [ ] ROADMAP.md at correct path
- [ ] All required sections present
- [ ] Phase directories created
- [ ] State updated with history entry
</success_criteria>

<integration_points>
## File Dependencies

### Reads From
- `.planning/PROJECT.md` - Project definition (REQUIRED)
- `.planning/REQUIREMENTS.md` - Requirements (optional)
- `.planning/research/*.md` - Research findings (optional)
- `.idumb/idumb-brain/state.json` - Current state

### Writes To
- `.planning/ROADMAP.md` - Main output
- `.planning/phases/{N}/` - Phase directories
- `.idumb/idumb-brain/state.json` - State update

### Never Modifies
- `.planning/PROJECT.md` - Read only
- `.planning/REQUIREMENTS.md` - Read only
- Research documents - Read only
</integration_points>

---
*Workflow: roadmap v1.0.0 GSD*
*Transform Date: 2026-02-04*
