---
name: discuss-phase
id: wf-discuss-phase
parent: workflows
description: "Interactive discussion to understand phase goals, scope, and constraints before planning"
type: workflow
version: 1.0.0
gsd_version: "1.0.0"
last_updated: 2026-02-04
---

<purpose>
Facilitate collaborative discussion with the user to establish clear understanding of a phase's goals, constraints, and approach before creating a formal plan. This workflow transforms abstract roadmap phases into concrete, actionable context documents through structured Q&A.
</purpose>

<philosophy>
Core principles guiding phase discussion:

1. **Context Before Code**: Never plan without understanding. A 10-minute discussion prevents 10-hour refactors.
2. **User Is The Authority**: The user knows their domain, constraints, and preferences. Extract, don't assume.
3. **Structured Capture**: Free-form discussion crystallizes into structured CONTEXT.md artifacts.
4. **Incremental Refinement**: Start broad, narrow down. Each question builds on previous answers.
5. **Explicit Over Implicit**: If it's not documented in CONTEXT.md, it wasn't discussed.
</philosophy>

<entry_check>
```bash
# === ENTRY VALIDATION ===
# These checks MUST pass before workflow begins

# Check 1: iDumb initialized
test -f ".idumb/idumb-brain/state.json" || {
  echo "ERROR: iDumb not initialized"
  echo "ACTION: Run /idumb:init first"
  exit 1
}

# Check 2: Roadmap exists
test -f ".planning/ROADMAP.md" || {
  echo "ERROR: No roadmap found"
  echo "ACTION: Run /idumb:roadmap first"
  exit 1
}

# Check 3: Phase number provided
test -n "${PHASE_NUM}" || {
  echo "ERROR: Phase number required"
  echo "USAGE: /idumb:discuss-phase {N}"
  exit 1
}

# Check 4: Phase exists in roadmap
grep -q "Phase ${PHASE_NUM}" .planning/ROADMAP.md || {
  echo "ERROR: Phase ${PHASE_NUM} not found in ROADMAP.md"
  echo "ACTION: Check roadmap for valid phase numbers"
  exit 1
}

# Optional: Check for PROJECT.md
test -f ".planning/PROJECT.md" && echo "✓ PROJECT.md available for context"
test -f ".planning/REQUIREMENTS.md" && echo "✓ REQUIREMENTS.md available for context"

echo "✓ All entry conditions met"
```
</entry_check>

<execution_flow>
## Step 1: Load Phase Context

**Goal:** Extract phase definition from roadmap and load any existing context

**Commands:**
```bash
# Extract phase definition from roadmap
PHASE_NUM="${1:-1}"
PHASE_DIR=".planning/phases/${PHASE_NUM}"

# Get phase section from roadmap (20 lines after phase header)
PHASE_DEF=$(grep -A 30 "## Phase ${PHASE_NUM}" .planning/ROADMAP.md 2>/dev/null | head -35)

if [ -z "$PHASE_DEF" ]; then
  # Try alternate format
  PHASE_DEF=$(grep -A 30 "### Phase ${PHASE_NUM}" .planning/ROADMAP.md 2>/dev/null | head -35)
fi

# Extract phase name from definition
PHASE_NAME=$(echo "$PHASE_DEF" | head -1 | sed 's/.*Phase [0-9]*[: ]*//; s/#//g' | xargs)
PHASE_NAME_SLUG=$(echo "$PHASE_NAME" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | tr -cd '[:alnum:]-')

echo "Phase ${PHASE_NUM}: ${PHASE_NAME}"
echo "Directory: ${PHASE_DIR}"
```

**Validation:** `PHASE_DEF` is non-empty and `PHASE_NAME` extracted
**On failure:** Report phase not found, suggest checking roadmap structure

---

## Step 2: Check Existing Context

**Goal:** Determine if we're starting fresh or continuing a previous discussion

**Commands:**
```bash
# Check for existing CONTEXT.md
EXISTING_CONTEXT=$(find "${PHASE_DIR}" -name "*CONTEXT.md" 2>/dev/null | head -1)

if [ -n "$EXISTING_CONTEXT" ] && [ -f "$EXISTING_CONTEXT" ]; then
  echo "EXISTING: Found previous context at ${EXISTING_CONTEXT}"
  echo "---"
  head -50 "$EXISTING_CONTEXT"
  echo "---"
  echo "OPTIONS: [continue] from existing | [restart] fresh"
  CONTEXT_MODE="continue"
else
  echo "STATUS: No existing context. Starting fresh discussion."
  mkdir -p "${PHASE_DIR}"
  CONTEXT_MODE="fresh"
fi
```

**Validation:** Directory exists, mode determined
**On failure:** Create directory with `mkdir -p`

---

## Step 3: Present Phase to User

**Goal:** Show phase scope and initiate structured discussion

**Present to user:**
```markdown
# Phase ${PHASE_NUM}: ${PHASE_NAME}

## From Roadmap:
${PHASE_DEF}

---

## Discussion Questions

I need to understand this phase better before we plan. Please answer these questions:

### 1. Primary Goal
What is the single most important outcome of this phase?
(What would make this phase a success?)

### 2. Scope Boundaries
- What is IN scope for this phase?
- What is explicitly OUT of scope (deferred to later phases)?

### 3. Constraints
- Technical constraints (existing systems, patterns to follow)?
- Time constraints?
- Resource or dependency constraints?

### 4. Dependencies
- What must be complete before this phase can start?
- What does this phase unblock for future phases?

### 5. Definition of Done
When is this phase complete? What are the acceptance criteria?

### 6. Approach (Optional)
Do you have a preferred approach or pattern in mind?

---
Please answer these questions. I'll structure your responses into a CONTEXT.md document.
```

**Validation:** User acknowledges and begins responding
**On failure:** Offer to explain questions or provide examples

---

## Step 4: Gather and Structure Responses

**Goal:** Collect user responses and structure them for the artifact

**Interactive Protocol:**
1. Wait for user response to each question (or batch response)
2. Acknowledge each answer with a brief summary
3. Ask clarifying questions if answers are vague
4. Confirm understanding before moving to artifact creation

**Clarifying Patterns:**
```markdown
# If goal is vague:
"You mentioned [X]. Can you be more specific? For example, is success measured by:
- Feature completion?
- Performance metrics?
- User feedback?
- Technical milestone?"

# If scope is unclear:
"Just to clarify scope: You mentioned [X]. Does that include [Y] or is [Y] out of scope?"

# If constraints missing:
"Are there any patterns from the existing codebase we should follow?
Check: $(ls -la src/ 2>/dev/null | head -5)"

# If dependencies unclear:
"Looking at the roadmap:
$(grep -B2 -A2 "Phase $((PHASE_NUM-1))" .planning/ROADMAP.md 2>/dev/null)
Does this phase depend on Phase $((PHASE_NUM-1)) completing first?"
```

**Validation:** All 5 core questions answered (goal, scope, constraints, dependencies, done)
**On failure:** List unanswered questions, ask user to complete

---

## Step 5: Generate CONTEXT.md Artifact

**Goal:** Create structured context document from discussion

**Commands:**
```bash
# Generate timestamp and path
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
DATE_STAMP=$(date +"%Y-%m-%d")
OUTPUT_PATH="${PHASE_DIR}/${PHASE_NAME_SLUG}-CONTEXT.md"

# Create artifact
cat > "${OUTPUT_PATH}" << 'CONTEXT_EOF'
---
type: context
phase: ${PHASE_NUM}
phase_name: "${PHASE_NAME}"
status: draft
created: "${TIMESTAMP}"
discussed_with: user
workflow: discuss-phase
version: 1.0.0
---

# Phase ${PHASE_NUM} Context: ${PHASE_NAME}

## Goal
${USER_GOAL}

## Scope

### In Scope
${USER_IN_SCOPE}

### Out of Scope
${USER_OUT_SCOPE}

## Constraints

### Technical Constraints
${USER_TECH_CONSTRAINTS}

### Time Constraints
${USER_TIME_CONSTRAINTS}

### Resource Constraints
${USER_RESOURCE_CONSTRAINTS}

## Dependencies

### Requires (Blocking)
${USER_DEPENDENCIES}

### Enables (Unblocks)
${USER_ENABLES}

## Definition of Done
${USER_DONE_CRITERIA}

## Approach
${USER_APPROACH}

## Open Questions
- [ ] ${OPEN_QUESTION_1}
- [ ] ${OPEN_QUESTION_2}

## Discussion Notes
${DISCUSSION_NOTES}

---
*Context captured: ${DATE_STAMP}*
*Workflow: discuss-phase v1.0.0*
CONTEXT_EOF

echo "✓ Created: ${OUTPUT_PATH}"
```

**Validation:** File exists and contains all sections
```bash
test -f "${OUTPUT_PATH}" && grep -q "## Goal" "${OUTPUT_PATH}" && echo "✓ Artifact valid"
```
**On failure:** Report write error, check permissions

---

## Step 6: Update iDumb State

**Goal:** Record discussion completion in governance state

**Commands:**
```bash
# Update state.json
STATE_FILE=".idumb/idumb-brain/state.json"

# Use idumb-state tool
# Or manual update:
CURRENT_STATE=$(cat "${STATE_FILE}")
UPDATED_STATE=$(echo "${CURRENT_STATE}" | jq '
  .phase = "phase-'${PHASE_NUM}'-discussed" |
  .lastValidation = "'${TIMESTAMP}'" |
  .history += [{
    "timestamp": "'${TIMESTAMP}'",
    "action": "discuss-phase",
    "agent": "workflow/discuss-phase",
    "result": "pass",
    "details": "Phase '${PHASE_NUM}' context captured"
  }]
')
echo "${UPDATED_STATE}" > "${STATE_FILE}"

echo "✓ State updated"
```

**Validation:** State file updated with new history entry
```bash
grep -q "discuss-phase" "${STATE_FILE}" && echo "✓ State recorded"
```
**On failure:** Log warning, continue (non-blocking)

</execution_flow>

<agent_spawning>
| Agent | Condition | Task | Timeout | Output |
|-------|-----------|------|---------|--------|
| idumb-project-researcher | Missing domain knowledge | Research phase domain | 180s | Research notes |
| idumb-phase-researcher | Complex technical phase | Research implementation patterns | 180s | Pattern recommendations |
| idumb-skeptic-validator | After CONTEXT.md created | Validate context completeness | 60s | Gap analysis |
</agent_spawning>

<interactive_protocol>
## User Interaction Guidelines

### Opening the Discussion
```markdown
Hi! I'm going to help you define Phase {N}: {Name}.

I have some questions to ensure we plan this correctly. 
You can answer them one by one, or all at once.

Ready to begin?
```

### Handling Partial Answers
```markdown
Thanks for that context on [topic]. 

I still need to understand:
- [Unanswered question 1]
- [Unanswered question 2]

Should I move on, or would you like to add more detail?
```

### Handling "I Don't Know" Responses
```markdown
That's okay! Let me help narrow it down:

For [question], common approaches are:
1. [Option A] - when [condition]
2. [Option B] - when [condition]
3. [Option C] - when [condition]

Which resonates with your situation?
```

### Confirming Before Artifact
```markdown
Before I create the CONTEXT.md, let me confirm:

**Goal:** {summarized goal}
**Scope:** {in/out summary}
**Key Constraint:** {main constraint}
**Done When:** {acceptance criteria}

Is this accurate? Any corrections?
```

### Handling Interruptions
If user asks unrelated questions:
1. Acknowledge briefly
2. Answer if quick
3. Return: "Let's continue with Phase {N}. We were discussing [last topic]..."
</interactive_protocol>

<output_artifact>
## Artifact: {phase-name}-CONTEXT.md

**Path:** `.planning/phases/{N}/{phase-name}-CONTEXT.md`
**Template:** `templates/context.md`

### Frontmatter
```yaml
type: context
phase: "{N}"
phase_name: "{phase-name}"
status: draft
created: "{ISO-8601 timestamp}"
discussed_with: user
workflow: discuss-phase
version: 1.0.0
```

### Required Sections
1. **Goal** - Single clear objective
2. **Scope** - In scope / Out of scope lists
3. **Constraints** - Technical, time, resource limits
4. **Dependencies** - What blocks, what unblocks
5. **Definition of Done** - Acceptance criteria
6. **Approach** - Preferred implementation strategy
7. **Open Questions** - Unresolved items (checkbox format)
8. **Discussion Notes** - Raw notes from conversation

### Quality Criteria
- Goal is one sentence, measurable
- Scope has explicit exclusions
- At least one constraint documented
- Dependencies link to other phases
- Done criteria are checkable
</output_artifact>

<chain_rules>
## On Success
**Chain to:** `/idumb:plan-phase {N}`
**Auto:** false (ask user first)

**Prompt:**
```markdown
Context captured for Phase {N}: {phase-name}!
📄 Created: {output_path}

Ready to create the implementation plan?
→ [Yes] Run /idumb:plan-phase {N}
→ [Edit] Open CONTEXT.md for revisions
→ [Later] Save and exit
```

---

## On Partial (Some Questions Unanswered)

**Action:** Save partial context, mark as incomplete
```bash
# Save with draft status and open questions
sed -i 's/status: draft/status: incomplete/' "${OUTPUT_PATH}"
```

**Prompt:**
```markdown
I've saved partial context with {X} questions unanswered.

Open questions:
- [ ] {unanswered_1}
- [ ] {unanswered_2}

Resume later with: /idumb:discuss-phase {N}
```

---

## On Cancel (User Exits)

**Action:** Offer to save progress
```bash
# Check if any context captured
if [ -n "${USER_GOAL}" ]; then
  echo "You've provided some context. Save progress? [y/n]"
  # Save if yes
fi
```

---

## On Failure (Technical Error)

**Action:** Log error, attempt recovery
```bash
# Log to history
echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] discuss-phase:${PHASE_NUM}:failed - ${ERROR}" >> .idumb/idumb-brain/history/errors.log

# Offer manual creation
echo "ERROR: ${ERROR}"
echo "Manual option: Create ${PHASE_DIR}/${PHASE_NAME_SLUG}-CONTEXT.md using template"
```
</chain_rules>

<success_criteria>
## Verification Checkboxes

### Entry Validation
- [ ] iDumb state.json exists
- [ ] ROADMAP.md exists
- [ ] Phase number provided and valid
- [ ] Phase found in roadmap

### Discussion Completeness
- [ ] Primary goal captured
- [ ] Scope boundaries defined (in/out)
- [ ] At least one constraint documented
- [ ] Dependencies identified
- [ ] Definition of done specified

### Artifact Creation
- [ ] CONTEXT.md created at correct path
- [ ] Frontmatter complete and valid
- [ ] All required sections present
- [ ] Open questions listed (if any)

### State Update
- [ ] state.json updated with phase status
- [ ] History entry added
- [ ] Anchor created (if critical context)

### User Satisfaction
- [ ] User confirmed context is accurate
- [ ] User knows next step (plan-phase)
- [ ] User knows how to revise if needed
</success_criteria>

<integration_points>
## File Dependencies

### Reads From
- `.planning/ROADMAP.md` - Phase definitions
- `.planning/PROJECT.md` - Project context (optional)
- `.planning/REQUIREMENTS.md` - Requirements reference (optional)
- `.idumb/idumb-brain/state.json` - Current state

### Writes To
- `.planning/phases/{N}/{phase-name}-CONTEXT.md` - Main output
- `.idumb/idumb-brain/state.json` - State updates
- `.idumb/idumb-brain/history/` - History entries (append)

### Never Modifies
- `.planning/ROADMAP.md` - Read only
- `.planning/PROJECT.md` - Read only
- Other phase contexts - Isolated
</integration_points>

---
*Workflow: discuss-phase v1.0.0 GSD*
*Transform Date: 2026-02-04*
