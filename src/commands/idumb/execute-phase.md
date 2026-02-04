---
description: "Execute a phase plan with full governance and monitoring"
id: cmd-execute-phase
parent: commands-idumb
agent: idumb-supreme-coordinator
---

<objective>
Execute all plans in a phase using wave-based parallel execution with full governance monitoring.

Orchestrator stays lean: discover plans, analyze dependencies, group into waves, spawn subagents, collect results. Each subagent loads the full execute-plan context and handles its own plan.

Context budget: ~15% orchestrator, 100% fresh per subagent.
</objective>

<execution_context>
@src/references/checkpoints.md
@src/references/verification-patterns.md
</execution_context>

<context>
Phase: $ARGUMENTS

**Flags:**
- `--gaps-only` — Execute only gap closure plans (plans with `gap_closure: true` in frontmatter). Use after verify-work creates fix plans.
- `--mode=interactive|auto` — Execution mode. Interactive pauses at checkpoints, auto uses predefined rules.
- `--dry-run` — Simulate without executing tasks.
- `--resume` — Resume paused execution from last checkpoint.
- `--batch-size=N` — Tasks per batch (default: 5).
- `--timeout=Nm` — Per-task timeout (default: 10m).

@.idumb/idumb-project-output/roadmaps/ROADMAP.md
@.idumb/idumb-brain/state.json
</context>

<process>
0. **Resolve Model Profile**

   Read model profile for agent spawning:
   ```bash
   MODEL_PROFILE=$(cat .idumb/idumb-brain/config.json 2>/dev/null | grep -o '"model_profile"[[:space:]]*:[[:space:]]*"[^"]*"' | grep -o '"[^"]*"$' | tr -d '"' || echo "balanced")
   ```

   Default to "balanced" if not set.

   **Model lookup table:**

   | Agent | quality | balanced | budget |
   |-------|---------|----------|--------|
   | idumb-executor | opus | sonnet | sonnet |
   | idumb-verifier | sonnet | sonnet | haiku |
   | idumb-builder | opus | sonnet | haiku |

   Store resolved models for use in Task calls below.

1. **Validate phase exists**

   ```bash
   PHASE_DIR=".idumb/idumb-project-output/phases/$PHASE_ARG"
   [ -d "$PHASE_DIR" ] || { echo "ERROR: Phase directory not found: $PHASE_DIR"; exit 1; }
   
   PLAN_COUNT=$(find "$PHASE_DIR" -name "*-PLAN.md" 2>/dev/null | wc -l | tr -d ' ')
   [ "$PLAN_COUNT" -gt 0 ] || { echo "ERROR: No plans found in $PHASE_DIR"; exit 1; }
   echo "Found $PLAN_COUNT plan(s) in phase"
   ```

   If `--resume` flag set:
   ```bash
   STATE_FILE=".idumb/idumb-brain/execution/$PHASE_ARG/checkpoint-latest.json"
   [ -f "$STATE_FILE" ] && echo "Resuming from checkpoint" || echo "No checkpoint found, starting fresh"
   ```

2. **Discover plans**

   ```bash
   # List all PLAN.md files
   PLANS=$(find "$PHASE_DIR" -name "*-PLAN.md" -type f | sort)
   
   # Check which have SUMMARY.md (complete)
   for plan in $PLANS; do
     summary="${plan/-PLAN.md/-SUMMARY.md}"
     [ -f "$summary" ] && echo "COMPLETE: $plan" || echo "INCOMPLETE: $plan"
   done
   ```

   If `--gaps-only`:
   ```bash
   # Filter to only gap_closure plans
   GAPS_ONLY_PLANS=""
   for plan in $PLANS; do
     grep -q "gap_closure: true" "$plan" && GAPS_ONLY_PLANS="$GAPS_ONLY_PLANS $plan"
   done
   PLANS="$GAPS_ONLY_PLANS"
   ```

   Build list of incomplete plans for execution.

3. **Group by wave**

   Read `wave` from each plan's frontmatter:
   ```bash
   for plan in $INCOMPLETE_PLANS; do
     WAVE=$(grep -E "^wave:" "$plan" | head -1 | awk '{print $2}' || echo "1")
     echo "Wave $WAVE: $plan"
   done
   ```

   Group plans by wave number. Report wave structure:
   ```
   Wave 1: 01-auth-PLAN.md, 02-users-PLAN.md
   Wave 2: 03-api-PLAN.md (depends on wave 1)
   Wave 3: 04-integration-PLAN.md (depends on wave 2)
   ```

4. **Execute waves (sequential, plans within wave parallel)**

   For each wave in order:
   
   **4a. Read plan contents before spawning:**
   ```bash
   # Task() does not support @ references - must inline content
   PLAN_01_CONTENT=$(cat "$PLAN_01_PATH")
   PLAN_02_CONTENT=$(cat "$PLAN_02_PATH")
   STATE_CONTENT=$(cat .idumb/idumb-brain/state.json)
   ```

   **4b. Spawn parallel executors:**
   ```
   Task(
     prompt="Execute plan at {plan_01_path}\n\nPlan:\n{plan_01_content}\n\nProject state:\n{state_content}",
     subagent_type="idumb-executor",
     model="{executor_model}"
   )
   Task(
     prompt="Execute plan at {plan_02_path}\n\nPlan:\n{plan_02_content}\n\nProject state:\n{state_content}",
     subagent_type="idumb-executor",
     model="{executor_model}"
   )
   ```

   All plans in wave run in parallel. Task tool blocks until all complete.
   **No polling. No background agents. No TaskOutput loops.**

   **4c. Verify SUMMARYs created:**
   ```bash
   for plan in $WAVE_PLANS; do
     summary="${plan/-PLAN.md/-SUMMARY.md}"
     [ -f "$summary" ] || echo "WARNING: Missing summary for $plan"
   done
   ```

   **4d. Proceed to next wave only after current wave completes.**

5. **Aggregate results**

   ```bash
   # Collect all summaries
   SUMMARIES=$(find "$PHASE_DIR" -name "*-SUMMARY.md" -type f)
   echo "Phase execution complete. $(echo "$SUMMARIES" | wc -l | tr -d ' ') plans executed."
   ```

6. **Commit orchestrator corrections**

   Check for uncommitted changes before verification:
   ```bash
   CHANGES=$(git status --porcelain)
   ```

   **If changes exist:** Orchestrator made corrections between executor completions:
   ```bash
   git add -u && git commit -m "fix($PHASE_ARG): orchestrator corrections"
   ```

   **If clean:** Continue to verification.

7. **Verify phase goal**

   Check config for verifier setting:
   ```bash
   WORKFLOW_VERIFIER=$(cat .idumb/idumb-brain/config.json 2>/dev/null | grep -o '"verifier"[[:space:]]*:[[:space:]]*[^,}]*' | grep -o 'true\|false' || echo "true")
   ```

   **If `verifier` is `false`:** Skip to step 8 (treat as passed).

   **Otherwise:**
   ```
   Task(
     prompt="Verify phase $PHASE_ARG\n\nPhase directory: $PHASE_DIR\nGoal: {phase_goal_from_roadmap}\n\nCheck must_haves against actual codebase, not SUMMARY claims.",
     subagent_type="idumb-verifier",
     model="{verifier_model}"
   )
   ```

   Verifier creates `{phase}-VERIFICATION.md` with detailed report.

   **Route by verification status:**
   | Status | Action |
   |--------|--------|
   | `passed` | Continue to step 8 |
   | `human_needed` | Present items, get approval or feedback |
   | `gaps_found` | Present gaps, offer `/idumb:plan-phase {X} --gaps` |

8. **Update roadmap and state**

   ```bash
   # Update governance state
   idumb-state_write phase="$PHASE_ARG_completed"
   idumb-state_history action="phase_complete:$PHASE_ARG" result="pass"
   ```

   Update ROADMAP.md to mark phase complete.
   Update state.json with phase completion timestamp.

9. **Update requirements traceability**

   Mark phase requirements as Complete:
   ```bash
   # Read phase requirements from ROADMAP.md
   REQ_IDS=$(grep -A5 "Phase $PHASE_ARG" ROADMAP.md | grep "Requirements:" | sed 's/.*Requirements://' | tr ',' '\n' | xargs)
   
   # Update REQUIREMENTS.md if it exists
   REQUIREMENTS_FILE=".idumb/idumb-project-output/REQUIREMENTS.md"
   if [ -f "$REQUIREMENTS_FILE" ]; then
     for req in $REQ_IDS; do
       sed -i '' "s/| $req .* Pending/| $req ... Complete/" "$REQUIREMENTS_FILE"
     done
   fi
   ```

   Skip if: REQUIREMENTS.md doesn't exist, or phase has no Requirements line.

10. **Commit phase completion**

    Check `commit_planning_docs` from config.json (default: true):
    ```bash
    COMMIT_DOCS=$(cat .idumb/idumb-brain/config.json 2>/dev/null | grep -o '"commit_planning_docs"[[:space:]]*:[[:space:]]*[^,}]*' | grep -o 'true\|false' || echo "true")
    ```

    **If false:** Skip git operations for phase metadata files.

    **If true:** Bundle all phase metadata updates in one commit:
    ```bash
    git add .idumb/idumb-project-output/roadmaps/ROADMAP.md
    git add .idumb/idumb-brain/state.json
    [ -f "$PHASE_DIR/$PHASE_ARG-VERIFICATION.md" ] && git add "$PHASE_DIR/$PHASE_ARG-VERIFICATION.md"
    [ -f "$REQUIREMENTS_FILE" ] && git add "$REQUIREMENTS_FILE"
    
    git commit -m "docs($PHASE_ARG): complete $PHASE_NAME phase"
    ```

11. **Offer next steps**

    Route to next action based on verification status (see `<offer_next>`).
</process>

<checkpoint_handling>
Plans with `autonomous: false` have checkpoints. Handle the full checkpoint flow:

**When executor hits checkpoint:**
1. Subagent pauses at checkpoint, returns structured state
2. Orchestrator presents checkpoint to user using UI format
3. Orchestrator collects user response
4. Spawns fresh continuation agent (not resume) with:
   - Checkpoint state
   - User response
   - Remaining tasks

**Checkpoint types (from references/checkpoints.md):**
| Type | Frequency | Purpose |
|------|-----------|---------|
| `checkpoint:human-verify` | 90% | User confirms automated work |
| `checkpoint:decision` | 9% | User makes architecture/design choice |
| `checkpoint:human-action` | 1% | Authentication gates, email verification |

**Display format:**
```
+-------------------------------------------------------+
|  CHECKPOINT: Verification Required                    |
+-------------------------------------------------------+

Progress: 5/8 tasks complete
Task: {current_task_name}

Built: {what_was_built}

How to verify:
  1. {verification_step_1}
  2. {verification_step_2}
  3. {verification_step_3}

--------------------------------------------------------
-> YOUR ACTION: Type "approved" or describe issues
--------------------------------------------------------
```

**Anchor checkpoint in state:**
```bash
idumb-state_anchor type="checkpoint" content="$CHECKPOINT_DESCRIPTION" priority="critical"
```
</checkpoint_handling>

<wave_execution>
**Parallel spawning protocol:**

Before spawning, read file contents. The `@` syntax does not work across Task() boundaries.

```bash
# Read each plan and state
PLAN_01_CONTENT=$(cat "{plan_01_path}")
PLAN_02_CONTENT=$(cat "{plan_02_path}")
PLAN_03_CONTENT=$(cat "{plan_03_path}")
STATE_CONTENT=$(cat .idumb/idumb-brain/state.json)
```

Spawn all plans in a wave with a single message containing multiple Task calls, with inlined content:

```
Task(prompt="Execute plan at {plan_01_path}\n\nPlan:\n{plan_01_content}\n\nProject state:\n{state_content}", subagent_type="idumb-executor", model="{executor_model}")
Task(prompt="Execute plan at {plan_02_path}\n\nPlan:\n{plan_02_content}\n\nProject state:\n{state_content}", subagent_type="idumb-executor", model="{executor_model}")
Task(prompt="Execute plan at {plan_03_path}\n\nPlan:\n{plan_03_content}\n\nProject state:\n{state_content}", subagent_type="idumb-executor", model="{executor_model}")
```

All three run in parallel. Task tool blocks until all complete.

**No polling. No background agents. No TaskOutput loops.**
</wave_execution>

<deviation_rules>
During execution, handle discoveries automatically:

| Discovery Type | Action | Documentation |
|----------------|--------|---------------|
| **Bug found** | Auto-fix immediately | Document in Summary |
| **Critical gap** | Auto-add (security/correctness) | Document in Summary |
| **Blocker** | Auto-fix (can't proceed without) | Document in Summary |
| **Architectural** | STOP and ask user | Do not proceed without approval |

Only architectural changes require user intervention. Everything else is handled autonomously and documented.
</deviation_rules>

<commit_rules>
**Per-Task Commits (during execution):**
```bash
# Stage only files modified by that task
git add src/components/Auth.tsx src/api/auth/route.ts

# Commit with phase-plan prefix
git commit -m "{type}({phase}-{plan}): {task-name}"
```

Types: feat, fix, test, refactor, perf, chore, docs

**Plan Metadata Commit (after plan completes):**
```bash
git add "$PHASE_DIR/{plan}-PLAN.md" "$PHASE_DIR/{plan}-SUMMARY.md"
git commit -m "docs({phase}-{plan}): complete [{plan-name}] plan"
```
NO code files (already committed per-task).

**Phase Completion Commit (step 10):**
```bash
git add .idumb/idumb-project-output/roadmaps/ROADMAP.md
git add .idumb/idumb-brain/state.json
git add "$PHASE_DIR/$PHASE_ARG-VERIFICATION.md"
git commit -m "docs({phase}): complete {phase-name} phase"
```

**NEVER use:**
- `git add .`
- `git add -A`
- `git add src/` or any broad directory

**Always stage files individually.**
</commit_rules>

<offer_next>
Output this markdown directly (not as a code block). Route based on status:

| Status | Route |
|--------|-------|
| `gaps_found` | Route C (gap closure) |
| `human_needed` | Present checklist, then re-route based on approval |
| `passed` + more phases | Route A (next phase) |
| `passed` + last phase | Route B (milestone complete) |

---

**Route A: Phase verified, more phases remain**

```
+-----------------------------------------------------+
| iDumb > PHASE {Z} COMPLETE                          |
+-----------------------------------------------------+

Phase {Z}: {Name}

{Y} plans executed
Goal verified

-------------------------------------------------------

## Next Up

Phase {Z+1}: {Name} - {Goal from ROADMAP.md}

/idumb:discuss-phase {Z+1} - gather context and clarify approach

(run /clear first - fresh context window)

-------------------------------------------------------

Also available:
- /idumb:plan-phase {Z+1} - skip discussion, plan directly
- /idumb:verify-work {Z} - manual acceptance testing before continuing

-------------------------------------------------------
```

---

**Route B: Phase verified, milestone complete**

```
+-----------------------------------------------------+
| iDumb > MILESTONE COMPLETE                          |
+-----------------------------------------------------+

v1.0

{N} phases completed
All phase goals verified

-------------------------------------------------------

## Next Up

Audit milestone - verify requirements, cross-phase integration, E2E flows

/idumb:audit-milestone

(run /clear first - fresh context window)

-------------------------------------------------------

Also available:
- /idumb:verify-work - manual acceptance testing
- /idumb:complete-milestone - skip audit, archive directly

-------------------------------------------------------
```

---

**Route C: Gaps found - need additional planning**

```
+-----------------------------------------------------+
| iDumb > PHASE {Z} GAPS FOUND                        |
+-----------------------------------------------------+

Phase {Z}: {Name}

Score: {N}/{M} must-haves verified
Report: .idumb/idumb-project-output/phases/{phase_dir}/{phase}-VERIFICATION.md

### What's Missing

{Extract gap summaries from VERIFICATION.md}

-------------------------------------------------------

## Next Up

Plan gap closure - create additional plans to complete the phase

/idumb:plan-phase {Z} --gaps

(run /clear first - fresh context window)

-------------------------------------------------------

Also available:
- cat .idumb/idumb-project-output/phases/{phase_dir}/{phase}-VERIFICATION.md - see full report
- /idumb:verify-work {Z} - manual testing before planning

-------------------------------------------------------
```

---

After user runs `/idumb:plan-phase {Z} --gaps`:
1. Planner reads VERIFICATION.md gaps
2. Creates plans 04, 05, etc. to close gaps
3. User runs `/idumb:execute-phase {Z}` again
4. Execute-phase runs incomplete plans (04, 05...)
5. Verifier runs again - loop until passed
</offer_next>

<completion_format>
## Phase Execution Complete

**Phase:** {phase-number} - {phase-name}
**Plans Executed:** {count}
**Duration:** {elapsed_time}
**Status:** {passed|gaps_found|human_needed}

### Plans Summary

| Plan | Status | Tasks | Commit |
|------|--------|-------|--------|
| 01-auth-PLAN.md | Complete | 8/8 | abc1234 |
| 02-users-PLAN.md | Complete | 6/6 | def5678 |
| 03-api-PLAN.md | Complete | 12/12 | ghi9012 |

### Verification

**Must-Haves:** {N}/{M} verified
**Gaps Found:** {list or "None"}
**Human Checks Needed:** {list or "None"}

### State Updates

- [x] state.json updated with phase completion
- [x] ROADMAP.md updated
- [x] VERIFICATION.md created
- [x] Requirements traceability updated
- [x] Phase completion committed

### Next Steps

{offer_next output based on status}
</completion_format>

<success_criteria>
- [ ] All incomplete plans in phase executed
- [ ] Each plan has SUMMARY.md
- [ ] Phase goal verified (must_haves checked against codebase)
- [ ] VERIFICATION.md created in phase directory
- [ ] state.json reflects phase completion
- [ ] ROADMAP.md updated
- [ ] REQUIREMENTS.md updated (phase requirements marked Complete)
- [ ] Checkpoints handled correctly (human verify, decision, action)
- [ ] Per-task commits with proper format
- [ ] Phase completion commit created
- [ ] User informed of next steps with routing options
</success_criteria>
