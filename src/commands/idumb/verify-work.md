---
description: "Verify completion of work against acceptance criteria"
id: cmd-verify-work
parent: commands-idumb
agent: idumb-supreme-coordinator
---

# /idumb:verify-work

<objective>
Verify completed work actually achieves phase goals through goal-backward verification.

Purpose: Confirm what Claude built works from user's perspective. Not just "did tasks complete?" but "does the feature work?" Detect stubs, missing wiring, and incomplete implementations before marking phases done.

Output: {phase}-VERIFICATION.md tracking all verification results. If gaps found: diagnosed issues with fix plans ready for `/idumb:execute-phase --gaps`
</objective>

<execution_context>
@src/references/verification-patterns.md
@src/templates/verification-report.md
</execution_context>

<context>
Phase: $ARGUMENTS (optional)
- If provided: Verify specific phase (e.g., "01-core-setup", "2")
- If not provided: Verify current phase from STATE.md

Flags:
- `--uat` — User acceptance testing mode (interactive, one test at a time)
- `--functional` — Run functional test suite (automated tests)
- `--strict` — Fail on warnings, not just errors
- `--evidence` — Include full evidence in report (default: true)

@.planning/STATE.md
@.planning/ROADMAP.md
@.idumb/idumb-brain/state.json
</context>

<process>
0. **Resolve model profile**
   - Read config to determine verification depth
   - Check governance state for last validation timestamp
   - Determine if fresh verification or incremental

1. **Locate phase SUMMARYs**
   ```bash
   # Find all SUMMARY.md files for the phase
   ls .planning/phases/{phase}/*-SUMMARY.md
   ```
   - If no SUMMARYs exist: Phase not executed, abort with guidance
   - If SUMMARYs exist: Collect all as verification targets

2. **Load must_haves from PLANs**
   - Read PLAN.md frontmatter for each plan in phase
   - Extract `must_haves` array from each plan
   - Derive observable truths (goal-backward methodology):
     * What must be TRUE for the goal to be achieved?
     * What must EXIST for those truths to hold?
     * What must be WIRED for those artifacts to function?

3. **Spawn @idumb-verifier with 4-level protocol**
   ```
   task @idumb-verifier with:
     - phase: {phase}
     - must_haves: [extracted from PLANs]
     - summaries: [paths to SUMMARY.md files]
     - mode: {uat|functional|standard}
   ```
   
   Verifier executes four verification levels:
   | Level | Check | Agent | Method |
   |-------|-------|-------|--------|
   | 1 - Exists | File present | @idumb-low-validator | `glob`, `read` |
   | 2 - Substantive | Real implementation | @idumb-low-validator | `grep`, pattern matching |
   | 3 - Wired | Connected to system | @idumb-integration-checker | Import/export tracing |
   | 4 - Functional | Actually works | @idumb-verifier | Tests, human validation |

4. **Collect verification results**
   - Aggregate results from all verification levels
   - Categorize findings:
     * PASS — Verified at all levels
     * STUB — Exists but placeholder implementation
     * UNWIRED — Exists but not connected
     * MISSING — Expected artifact not found
     * NEEDS_HUMAN — Can't verify programmatically

5. **If gaps found, spawn @idumb-planner --gaps**
   ```
   task @idumb-planner with:
     mode: gaps
     phase: {phase}
     gaps: [structured gap list from verification]
   ```
   
   Gap closure workflow:
   - Planner creates targeted fix plans from diagnosed gaps
   - @idumb-plan-checker verifies fix plans are sound
   - Iterate planner ↔ checker until plans pass (max 3 iterations)
   - If still failing: escalate with blockers identified

6. **Create VERIFICATION.md report**
   - Write to `.planning/phases/{phase}/{phase}-VERIFICATION.md`
   - Include:
     * Summary (score, status, timestamp)
     * Goal achievement table (observable truths)
     * Required artifacts table (existence + substantive)
     * Key link verification (wiring checks)
     * Anti-patterns found (stubs, TODOs, placeholders)
     * Human verification queue (if needed)
     * Gaps summary with fix plan references
   - Commit verification report
   - Update governance state (lastValidation, validationCount, history)
</process>

<anti_patterns>
- Don't trust SUMMARY.md claims — verify against actual code
- Don't mark "exists" as verified without substantive check
- Don't skip wiring verification — unconnected code is dead code
- Don't run functional tests if lower levels fail — cascade failure
- Don't fix issues during verification — log as gaps, fix in separate flow
- Don't ask user for severity — infer from impact on goal achievement
</anti_patterns>

<completion_format>
Output this markdown directly (not as a code block). Route based on verification results:

| Status | Route |
|--------|-------|
| All checks pass + more phases | Route A (next phase) |
| All checks pass + milestone complete | Route B (audit milestone) |
| Gaps found + fix plans ready | Route C (execute fixes) |
| Gaps found + needs human | Route D (human verification) |
| Gaps found + planning blocked | Route E (manual intervention) |

---

**Route A: All checks pass, more phases remain**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 iDumb ► PHASE {Z} VERIFIED ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Phase {Z}: {Name}**

{N}/{N} must-haves verified
All 4 levels passed ✓

### Verification Summary

| Level | Status | Details |
|-------|--------|---------|
| Exists | ✓ {N}/{N} | All artifacts present |
| Substantive | ✓ {N}/{N} | No stubs detected |
| Wired | ✓ {N}/{N} | All connections verified |
| Functional | ✓ {N}/{N} | Tests pass |

───────────────────────────────────────────────────────────────

## ▶ Next Up

**Phase {Z+1}: {Name}** — {Goal from ROADMAP.md}

/idumb:discuss-phase {Z+1} — gather context and clarify approach

<sub>/clear first → fresh context window</sub>

───────────────────────────────────────────────────────────────

**Also available:**
- /idumb:plan-phase {Z+1} — skip discussion, plan directly
- /idumb:execute-phase {Z+1} — skip to execution (if already planned)

───────────────────────────────────────────────────────────────

---

**Route B: All checks pass, milestone complete**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 iDumb ► PHASE {Z} VERIFIED ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Phase {Z}: {Name}**

{N}/{N} must-haves verified
Final phase verified ✓

───────────────────────────────────────────────────────────────

## ▶ Next Up

**Audit milestone** — verify requirements, cross-phase integration, E2E flows

/idumb:audit-milestone

<sub>/clear first → fresh context window</sub>

───────────────────────────────────────────────────────────────

**Also available:**
- /idumb:complete-milestone — skip audit, archive directly

───────────────────────────────────────────────────────────────

---

**Route C: Gaps found, fix plans ready**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 iDumb ► PHASE {Z} GAPS FOUND ⚠
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Phase {Z}: {Name}**

{N}/{M} must-haves verified
{X} gaps diagnosed
Fix plans verified ✓

### Gaps Found

| Gap | Level | Impact | Fix Plan |
|-----|-------|--------|----------|
| {gap 1} | {level} | {impact} | {plan ref} |
| {gap 2} | {level} | {impact} | {plan ref} |

───────────────────────────────────────────────────────────────

## ▶ Next Up

**Execute fix plans** — run diagnosed fixes

/idumb:execute-phase {Z} --gaps-only

<sub>/clear first → fresh context window</sub>

───────────────────────────────────────────────────────────────

**Also available:**
- cat .planning/phases/{phase}/*-PLAN.md — review fix plans
- /idumb:plan-phase {Z} --gaps — regenerate fix plans

───────────────────────────────────────────────────────────────

---

**Route D: Gaps found, needs human verification**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 iDumb ► PHASE {Z} NEEDS HUMAN ⏸
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Phase {Z}: {Name}**

{N}/{M} must-haves verified automatically
{X} items require human verification

### Human Verification Queue

| # | Test | Expected Behavior |
|---|------|-------------------|
| 1 | {test 1} | {what should happen} |
| 2 | {test 2} | {what should happen} |

───────────────────────────────────────────────────────────────

## ▶ Action Required

Test each item above and respond:
- **"yes"** or **"y"** = passes, next item
- **Describe issue** = logged as gap

<sub>Verification continues after human tests complete</sub>

───────────────────────────────────────────────────────────────

---

**Route E: Gaps found, planning blocked**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 iDumb ► PHASE {Z} BLOCKED ✗
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Phase {Z}: {Name}**

{N}/{M} must-haves verified
Fix planning blocked after {X} iterations

### Blocking Issues

| Issue | Why Blocked |
|-------|-------------|
| {issue 1} | {reason} |
| {issue 2} | {reason} |

───────────────────────────────────────────────────────────────

## ▶ Manual Intervention Required

Review the issues above and either:
1. Provide guidance for fix planning
2. Manually address blockers
3. Accept current state and continue

───────────────────────────────────────────────────────────────

**Options:**
- /idumb:plan-phase {Z} --gaps — retry fix planning with guidance
- /idumb:discuss-phase {Z} — gather more context before replanning
- /idumb:debug — investigate root causes

───────────────────────────────────────────────────────────────
</completion_format>

<success_criteria>
- [ ] Phase SUMMARYs located and collected
- [ ] Must-haves extracted from PLAN.md frontmatter
- [ ] @idumb-verifier spawned with 4-level protocol
- [ ] Level 1 (exists) verified via @idumb-low-validator
- [ ] Level 2 (substantive) verified — no stubs or placeholders
- [ ] Level 3 (wired) verified via @idumb-integration-checker
- [ ] Level 4 (functional) verified — tests pass or human queue created
- [ ] Gaps diagnosed with structured gap list
- [ ] If gaps: @idumb-planner --gaps spawned for fix plans
- [ ] If gaps: @idumb-plan-checker validated fix plans
- [ ] VERIFICATION.md created with full report
- [ ] Governance state updated (lastValidation, history)
- [ ] Committed to git
- [ ] Appropriate route offered based on results
</success_criteria>

## Governance

**Delegation Chain:**
```
user → /idumb:verify-work
  ↳ @idumb-supreme-coordinator (orchestration)
      ↳ @idumb-verifier (4-level verification)
          ↳ @idumb-low-validator (exists, substantive)
          ↳ @idumb-integration-checker (wired)
      ↳ @idumb-planner --gaps (if gaps found)
          ↳ @idumb-plan-checker (validate fix plans)
      ↳ @idumb-builder (write VERIFICATION.md, commit)
```

**State Updates:**
- `lastValidation`: Timestamp of verification
- `validationCount`: Incremented on each run
- `history`: Entry with action="verify-work", result="pass|gaps|blocked"
- `anchors`: Gap summary anchored if issues found (survives compaction)

## Related Commands

- `/idumb:execute-phase` — Execute work before verification
- `/idumb:execute-phase --gaps` — Execute gap fix plans
- `/idumb:plan-phase --gaps` — Manually regenerate fix plans
- `/idumb:debug` — Investigate verification failures
- `/idumb:validate` — Quick validation without full verification

## Error Handling

| Error | Cause | Resolution |
|-------|-------|------------|
| `V001` | No SUMMARYs found | Execute phase first |
| `V002` | No must_haves in PLANs | Plans need must_haves in frontmatter |
| `V003` | Verification cascade failure | Fix lower levels before higher |
| `V004` | Gap planning failed 3x | Manual intervention required |
| `V005` | Human verification timeout | Resume with `/idumb:verify-work --uat` |

## Metadata

```yaml
category: verification
priority: P1
complexity: high
version: 0.2.0
gsd_quality: true
```
