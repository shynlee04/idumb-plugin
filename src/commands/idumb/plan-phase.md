---
description: "Create detailed implementation plan for a specific phase"
id: cmd-plan-phase
parent: commands-idumb
agent: idumb-supreme-coordinator
---

<execution_context>
@.idumb/idumb-brain/config.json
@.idumb/idumb-project-output/roadmaps/
@src/agents/idumb-planner.md
@src/agents/idumb-plan-checker.md
</execution_context>

<skills>

## Auto-Activated Skills

When this command is executed, the following skills are automatically activated:

| Skill | Purpose | Activated For |
|-------|---------|--------------|
| `idumb-plan-synthesizer` | Transform research into plans | planner |
| `idumb-validation-reporter` | Standardize plan validation | plan-checker |
| `idumb-research-writer` | Write research artifacts | phase-researcher (if research needed) |

## Skill-Driven Flow Control

The plan-phase command forces specific flows through skill activations:

1. **Plan Synthesis** (`idumb-plan-synthesizer`)
   - Activates after research completes
   - Transforms research findings into executable PLAN.md structure
   - Applies goal-backward must_haves derivation
   - Creates dependency-aware wave structure

2. **Research Artifact Writing** (`idumb-research-writer`)
   - `--research` flag triggers research artifact generation
   - Writes phase-specific research to `.planning/phases/{PHASE}-RESEARCH.md`
   - Enables context handoff between research and planning

3. **Validation Reporting** (`idumb-validation-reporter`)
   - Standardizes plan-checker output format
   - Generates validation reports in consistent structure

</skills>

<objective>
Create executable phase plans (PLAN.md files) for a roadmap phase with integrated research and verification.

**Default flow:** Research (if needed) → Plan → Verify → Done

**Orchestrator role:** Parse arguments, validate phase, research domain (unless skipped or exists), spawn @idumb-planner agent, verify plans with @idumb-plan-checker, iterate until plans pass or max iterations reached, present results.

**Why subagents:** Research and planning burn context fast. Verification uses fresh context. User sees the flow between agents in main context.
</objective>

<context>
Phase number: $ARGUMENTS (optional - auto-detects next unplanned phase if not provided)

**Flags:**
- `--research` — Force re-research even if RESEARCH.md exists
- `--skip-research` — Skip research entirely, go straight to planning
- `--gaps` — Gap closure mode (reads VERIFICATION.md, skips research)
- `--skip-verify` — Skip planner → checker verification loop

Normalize phase input in step 2 before any directory lookups.
</context>

<process>

## 0. Resolve Model Profile

```bash
ls .idumb/idumb-brain/config.json 2>/dev/null
```

**If not found:** Error - user should run `/idumb:setup` first.

**Resolve model profile for agent spawning:**

```bash
MODEL_PROFILE=$(cat .idumb/idumb-brain/config.json 2>/dev/null | grep -o '"model_profile"[[:space:]]*:[[:space:]]*"[^"]*"' | grep -o '"[^"]*"$' | tr -d '"' || echo "balanced")
```

Default to "balanced" if not set.

**Model lookup table:**

| Agent | quality | balanced | budget |
|-------|---------|----------|--------|
| idumb-phase-researcher | opus | sonnet | haiku |
| idumb-planner | opus | opus | sonnet |
| idumb-plan-checker | sonnet | sonnet | haiku |

Store resolved models for use in Task calls below.

## 1. Validate Phase Exists in ROADMAP.md

Extract from $ARGUMENTS:

- Phase number (integer or decimal like `2.1`)
- `--research` flag to force re-research
- `--skip-research` flag to skip research
- `--gaps` flag for gap closure mode
- `--skip-verify` flag to bypass verification loop

**If no phase number:** Detect next unplanned phase from roadmap.

**Normalize phase to zero-padded format:**

```bash
# Normalize phase number (8 → 08, but preserve decimals like 2.1 → 02.1)
if [[ "$PHASE" =~ ^[0-9]+$ ]]; then
  PHASE=$(printf "%02d" "$PHASE")
elif [[ "$PHASE" =~ ^([0-9]+)\.([0-9]+)$ ]]; then
  PHASE=$(printf "%02d.%s" "${BASH_REMATCH[1]}" "${BASH_REMATCH[2]}")
fi
```

**Validate phase exists:**

```bash
grep -A5 "Phase ${PHASE}:" .idumb/idumb-project-output/roadmaps/ROADMAP.md 2>/dev/null
```

**If not found:** Error with available phases. 
**If found:** Extract phase number, name, description.

## 2. Check for CONTEXT.md and RESEARCH.md

```bash
# PHASE is already normalized (08, 02.1, etc.) from step 1
PHASE_DIR=$(ls -d .idumb/idumb-project-output/phases/${PHASE}-* 2>/dev/null | head -1)
if [ -z "$PHASE_DIR" ]; then
  # Create phase directory from roadmap name
  PHASE_NAME=$(grep "Phase ${PHASE}:" .idumb/idumb-project-output/roadmaps/ROADMAP.md | sed 's/.*Phase [0-9]*: //' | tr '[:upper:]' '[:lower:]' | tr ' ' '-')
  mkdir -p ".idumb/idumb-project-output/phases/${PHASE}-${PHASE_NAME}"
  PHASE_DIR=".idumb/idumb-project-output/phases/${PHASE}-${PHASE_NAME}"
fi

# Load CONTEXT.md immediately - this informs ALL downstream agents
CONTEXT_CONTENT=$(cat "${PHASE_DIR}"/*-CONTEXT.md 2>/dev/null)

# Check for existing research
ls "${PHASE_DIR}"/*-RESEARCH.md 2>/dev/null
ls "${PHASE_DIR}"/*-PLAN.md 2>/dev/null
```

**CRITICAL:** Store `CONTEXT_CONTENT` now. It must be passed to:
- **Researcher** — constrains what to research (locked decisions vs Claude's discretion)
- **Planner** — locked decisions must be honored, not revisited
- **Checker** — verifies plans respect user's stated vision
- **Revision** — context for targeted fixes

If CONTEXT.md exists, display: `Using phase context from: ${PHASE_DIR}/*-CONTEXT.md`

### Handle Research

**If `--gaps` flag:** Skip research (gap closure uses VERIFICATION.md instead).

**If `--skip-research` flag:** Skip to step 3.

**Check config for research setting:**

```bash
WORKFLOW_RESEARCH=$(cat .idumb/idumb-brain/config.json 2>/dev/null | grep -o '"research"[[:space:]]*:[[:space:]]*[^,}]*' | grep -o 'true\|false' || echo "true")
```

**If `workflow.research` is `false` AND `--research` flag NOT set:** Skip to step 3.

**If RESEARCH.md exists AND `--research` flag NOT set:**
- Display: `Using existing research: ${PHASE_DIR}/${PHASE}-RESEARCH.md`
- Skip to step 3

**If RESEARCH.md missing OR `--research` flag set:**

Display stage banner:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 iDumb ► RESEARCHING PHASE {X}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

◆ Spawning researcher...
```

Spawn @idumb-phase-researcher with research prompt including CONTEXT_CONTENT.

## 3. Spawn @idumb-planner with Context

Display stage banner:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 iDumb ► PLANNING PHASE {X}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

◆ Spawning planner...
```

**Gather context files:**

```bash
# Read required files
STATE_CONTENT=$(cat .idumb/idumb-brain/state.json)
ROADMAP_CONTENT=$(cat .idumb/idumb-project-output/roadmaps/ROADMAP.md)

# Read optional files (empty string if missing)
REQUIREMENTS_CONTENT=$(cat .idumb/idumb-project-output/REQUIREMENTS.md 2>/dev/null)
# CONTEXT_CONTENT already loaded in step 2
RESEARCH_CONTENT=$(cat "${PHASE_DIR}"/*-RESEARCH.md 2>/dev/null)

# Gap closure files (only if --gaps mode)
VERIFICATION_CONTENT=$(cat "${PHASE_DIR}"/*-VERIFICATION.md 2>/dev/null)
```

**Construct planner prompt:**

```markdown
<planning_context>

**Phase:** {phase_number}
**Mode:** {standard | gap_closure}

**Project State:**
{state_content}

**Roadmap:**
{roadmap_content}

**Requirements (if exists):**
{requirements_content}

**Phase Context (if exists):**

IMPORTANT: If phase context exists below, it contains USER DECISIONS from /idumb:discuss-phase.
- **Decisions** = LOCKED — honor these exactly, do not revisit or suggest alternatives
- **Claude's Discretion** = Your freedom — make implementation choices here
- **Deferred Ideas** = Out of scope — do NOT include in this phase

{context_content}

**Research (if exists):**
{research_content}

**Gap Closure (if --gaps mode):**
{verification_content}

</planning_context>

<downstream_consumer>
Output consumed by /idumb:execute-phase
Plans must be executable prompts with:

- Frontmatter (wave, depends_on, files_modified, autonomous)
- Tasks in XML format
- Verification criteria
- must_haves for goal-backward verification
</downstream_consumer>

<quality_gate>
Before returning PLANNING COMPLETE:

- [ ] PLAN.md files created in phase directory
- [ ] Each plan has valid frontmatter
- [ ] Tasks are specific and actionable
- [ ] Dependencies correctly identified
- [ ] Waves assigned for parallel execution
- [ ] must_haves derived from phase goal
</quality_gate>
```

**Spawn planner:**

```
Task(
  prompt="First, read src/agents/idumb-planner.md for your role and instructions.\n\n" + filled_prompt,
  subagent="idumb-planner",
  model="{planner_model}",
  description="Plan Phase {phase}"
)
```

## 4. Await Plan Creation

Parse planner output:

**`## PLANNING COMPLETE`:**
- Display: `Planner created {N} plan(s). Files on disk.`
- If `--skip-verify`: Skip to step 7
- Check config for plan_check setting
- If `workflow.plan_check` is `false`: Skip to step 7
- Otherwise: Proceed to step 5

**`## CHECKPOINT REACHED`:**
- Present to user, get response, spawn continuation

**`## PLANNING INCONCLUSIVE`:**
- Show what was attempted
- Offer: Add context, Retry, Manual
- Wait for user response

## 5. Spawn @idumb-plan-checker for Validation

Display:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 iDumb ► VERIFYING PLANS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

◆ Spawning plan checker...
```

**Read plans for the checker:**

```bash
# Read all plans in phase directory
PLANS_CONTENT=$(cat "${PHASE_DIR}"/*-PLAN.md 2>/dev/null)

# CONTEXT_CONTENT already loaded in step 2
# REQUIREMENTS_CONTENT already loaded in step 3
```

**Construct checker prompt:**

```markdown
<verification_context>

**Phase:** {phase_number}
**Phase Goal:** {goal from ROADMAP}

**Plans to verify:**
{plans_content}

**Requirements (if exists):**
{requirements_content}

**Phase Context (if exists):**

IMPORTANT: If phase context exists below, it contains USER DECISIONS from /idumb:discuss-phase.
Plans MUST honor these decisions. Flag as issue if plans contradict user's stated vision.

- **Decisions** = LOCKED — plans must implement these exactly
- **Claude's Discretion** = Freedom areas — plans can choose approach
- **Deferred Ideas** = Out of scope — plans must NOT include these

{context_content}

</verification_context>

<expected_output>
Return one of:
- ## VERIFICATION PASSED — all checks pass
- ## ISSUES FOUND — structured issue list
</expected_output>
```

**Spawn checker:**

```
Task(
  prompt=checker_prompt,
  subagent="idumb-plan-checker",
  model="{checker_model}",
  description="Verify Phase {phase} plans"
)
```

## 6. If Rejected, Loop Back to Planner with Feedback

Track: `iteration_count` (starts at 1 after initial plan + check)

**Handle Checker Return:**

**If `## VERIFICATION PASSED`:**
- Display: `Plans verified. Ready for execution.`
- Proceed to step 7

**If `## ISSUES FOUND`:**
- Display: `Checker found issues:`
- List issues from checker output
- Check iteration count

**If iteration_count < 3:**

Display: `Sending back to planner for revision... (iteration {N}/3)`

Read current plans for revision context:

```bash
PLANS_CONTENT=$(cat "${PHASE_DIR}"/*-PLAN.md 2>/dev/null)
# CONTEXT_CONTENT already loaded in step 2
```

Spawn @idumb-planner with revision prompt:

```markdown
<revision_context>

**Phase:** {phase_number}
**Mode:** revision

**Existing plans:**
{plans_content}

**Checker issues:**
{structured_issues_from_checker}

**Phase Context (if exists):**

IMPORTANT: If phase context exists, revisions MUST still honor user decisions.

{context_content}

</revision_context>

<instructions>
Make targeted updates to address checker issues.
Do NOT replan from scratch unless issues are fundamental.
Revisions must still honor all locked decisions from Phase Context.
Return what changed.
</instructions>
```

```
Task(
  prompt="First, read src/agents/idumb-planner.md for your role and instructions.\n\n" + revision_prompt,
  subagent="idumb-planner",
  model="{planner_model}",
  description="Revise Phase {phase} plans"
)
```

- After planner returns → spawn checker again (step 5)
- Increment iteration_count

**If iteration_count >= 3:**

Display: `Max iterations reached. {N} issues remain:`
- List remaining issues

Offer options:
1. Force proceed (execute despite issues)
2. Provide guidance (user gives direction, retry)
3. Abandon (exit planning)

Wait for user response.

## 7. Commit Plan Files

Route to @idumb-builder for file commits:

```bash
# Stage plan files
git add "${PHASE_DIR}"/*-PLAN.md

# Commit with conventional message
git commit -m "docs(${PHASE}): create phase plan

- Created ${N} plan(s) in ${M} wave(s)
- Research: ${RESEARCH_STATUS}
- Verification: ${VERIFY_STATUS}"
```

Update governance state:

```
idumb-state_write phase="${PHASE}_planned"
idumb-state_history action="plan-phase:${PHASE}" result="pass"
```

</process>

<completion_format>
Output this markdown directly (not as a code block):

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 iDumb ► PHASE {X} PLANNED ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Phase {X}: {Name}** — {N} plan(s) in {M} wave(s)

| Wave | Plans | What it builds |
|------|-------|----------------|
| 1    | 01, 02 | [objectives] |
| 2    | 03     | [objective]  |

Research: {Completed | Used existing | Skipped}
Verification: {Passed | Passed with override | Skipped}

───────────────────────────────────────────────────────────────

## ▶ Next Up

**Execute Phase {X}** — run all {N} plans

/idumb:execute-phase {X}

<sub>/clear first → fresh context window</sub>

───────────────────────────────────────────────────────────────

**Also available:**
- cat .idumb/idumb-project-output/phases/{phase-dir}/*-PLAN.md — review plans
- /idumb:plan-phase {X} --research — re-research first

───────────────────────────────────────────────────────────────
</completion_format>

<success_criteria>
- [ ] .idumb/ directory validated
- [ ] Model profile resolved from config.json
- [ ] Phase validated against ROADMAP.md
- [ ] Phase directory created if needed
- [ ] CONTEXT.md loaded early (step 2) and passed to ALL agents
- [ ] Research completed (unless --skip-research or --gaps or exists)
- [ ] @idumb-phase-researcher spawned with CONTEXT.md (constrains research scope)
- [ ] Existing plans checked
- [ ] @idumb-planner spawned with context (CONTEXT.md + RESEARCH.md)
- [ ] Plans created (PLANNING COMPLETE or CHECKPOINT handled)
- [ ] @idumb-plan-checker spawned with CONTEXT.md (verifies context compliance)
- [ ] Verification passed OR user override OR max iterations with user decision
- [ ] Plan files committed via @idumb-builder
- [ ] Governance state updated
- [ ] User sees status between agent spawns
- [ ] User knows next steps (execute or review)
</success_criteria>

## Task Types

| Type | Description | Assignee |
|------|-------------|----------|
| `research` | Investigation | @idumb-phase-researcher |
| `design` | Architecture/design | @idumb-planner |
| `implement` | Code implementation | @idumb-builder |
| `test` | Testing/validation | @idumb-low-validator |
| `review` | Code review | @idumb-high-governance |
| `integrate` | Integration work | @idumb-executor |
| `document` | Documentation | @idumb-builder |

## Examples

```bash
# Plan current phase (auto-detect next unplanned)
/idumb:plan-phase

# Plan specific phase
/idumb:plan-phase 2

# Plan with forced re-research
/idumb:plan-phase 3 --research

# Gap closure mode (uses VERIFICATION.md)
/idumb:plan-phase 2 --gaps

# Skip verification loop (fast mode)
/idumb:plan-phase 4 --skip-verify
```

## Error Handling

| Error | Cause | Resolution |
|-------|-------|------------|
| `P001` | Phase not found | Check ROADMAP.md |
| `P002` | Plan validation failed | Review checker issues |
| `P003` | Dependency cycle | Reorder tasks |
| `P004` | Config not found | Run /idumb:setup |
| `P005` | Max iterations exceeded | Provide guidance or force proceed |

## Related Commands

- `/idumb:discuss-phase` - Discuss phase first
- `/idumb:execute-phase` - Execute the plan
- `/idumb:verify-work` - Verify completion
- `/idumb:roadmap` - View/create roadmap

## Governance

**Delegation Chain:**
```
user → supreme-coordinator → planner → plan-checker → builder
```

**Validation Points:**
- Pre: Phase defined in roadmap
- Post: Plan passes @idumb-plan-checker
- Post: All tasks have estimates
- Post: No dependency cycles
- Post: Files committed to git
