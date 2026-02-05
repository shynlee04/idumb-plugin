# Git Integration

Git integration for iDumb framework.

<core_principle>

**Commit outcomes, not process.**

The git log should read like a changelog of what shipped, not a diary of planning activity.
</core_principle>

<commit_points>

| Event | Commit? | Why |
|-------|---------|-----|
| PROJECT + ROADMAP created | YES | Project initialization |
| PLAN.md created | NO | Intermediate - commit with plan completion |
| RESEARCH.md created | NO | Intermediate |
| **Task completed** | YES | Atomic unit of work (1 commit per task) |
| **Plan completed** | YES | Metadata commit (SUMMARY + STATE + ROADMAP) |
| Handoff/checkpoint created | YES | WIP state preserved |
| Governance update | NO | Brain state is runtime, not versioned |

</commit_points>

<git_check>

```bash
[ -d .git ] && echo "GIT_EXISTS" || echo "NO_GIT"
```

If NO_GIT: Run `git init` silently. iDumb projects get version control.

**iDumb-specific paths:**
```bash
# .idumb/ is typically gitignored (runtime state)
echo ".idumb/brain/" >> .gitignore

# But project outputs can be committed
# .idumb/project-output/ can be tracked if desired
```

</git_check>

<commit_formats>

<format name="initialization">
## Project Initialization (brief + roadmap together)

```
docs: initialize [project-name] ([N] phases)

[One-liner from PROJECT.md]

Phases:
1. [phase-name]: [goal]
2. [phase-name]: [goal]
3. [phase-name]: [goal]
```

What to commit:

```bash
git add .planning/
git add .idumb/project-output/  # if tracking outputs
git commit
```

</format>

<format name="task-completion">
## Task Completion (During Plan Execution)

Each task gets its own commit immediately after completion.

```
{type}({phase}-{plan}): {task-name}

- [Key change 1]
- [Key change 2]
- [Key change 3]
```

**Commit types:**
- `feat` - New feature/functionality
- `fix` - Bug fix
- `test` - Test-only (TDD RED phase)
- `refactor` - Code cleanup (TDD REFACTOR phase)
- `perf` - Performance improvement
- `chore` - Dependencies, config, tooling
- `meta` - iDumb framework changes (agents, commands, tools)

**Examples:**

```bash
# Standard task
git add src/api/auth.ts src/types/user.ts
git commit -m "feat(08-02): create user registration endpoint

- POST /auth/register validates email and password
- Checks for duplicate users
- Returns JWT token on success
"

# TDD task - RED phase
git add src/__tests__/jwt.test.ts
git commit -m "test(07-02): add failing test for JWT generation

- Tests token contains user ID claim
- Tests token expires in 1 hour
- Tests signature verification
"

# iDumb framework change
git add src/agents/idumb-planner.md
git commit -m "meta(framework): enhance planner agent with XML sections

- Added <execution_flow> with step elements
- Added <structured_returns> patterns
- Increased to GSD-quality (1200+ lines)
"
```

</format>

<format name="plan-completion">
## Plan Completion (After All Tasks Done)

After all tasks committed, one final metadata commit captures plan completion.

```
docs({phase}-{plan}): complete [plan-name] plan

Tasks completed: [N]/[N]
- [Task 1 name]
- [Task 2 name]
- [Task 3 name]

SUMMARY: .planning/phases/XX-name/{phase}-{plan}-SUMMARY.md
```

What to commit:

```bash
git add .planning/phases/XX-name/{phase}-{plan}-PLAN.md
git add .planning/phases/XX-name/{phase}-{plan}-SUMMARY.md
git add .planning/STATE.md
git add .planning/ROADMAP.md
git commit
```

**Note:** Code files NOT included - already committed per-task.

</format>

<format name="handoff">
## Handoff (WIP)

```
wip: [phase-name] paused at task [X]/[Y]

Current: [task name]
[If blocked:] Blocked: [reason]
```

What to commit:

```bash
git add .planning/
git commit
```

</format>
</commit_formats>

<example_log>

**Per-task commits (recommended):**
```
# Phase 04 - Checkout
1a2b3c docs(04-01): complete checkout flow plan
4d5e6f feat(04-01): add webhook signature verification
7g8h9i feat(04-01): implement payment session creation
0j1k2l feat(04-01): create checkout page component

# Phase 03 - Products
3m4n5o docs(03-02): complete product listing plan
6p7q8r feat(03-02): add pagination controls
9s0t1u feat(03-02): implement search and filters
2v3w4x feat(03-01): create product catalog schema

# Initialization
5c6d7e docs: initialize ecommerce-app (5 phases)
```

Each plan produces 2-4 commits (tasks + metadata). Clear, granular, bisectable.

</example_log>

<anti_patterns>

**Still don't commit (intermediate artifacts):**
- PLAN.md creation (commit with plan completion)
- RESEARCH.md (intermediate)
- Minor planning tweaks
- `.idumb/brain/` changes (runtime state)
- "Fixed typo in roadmap"

**Do commit (outcomes):**
- Each task completion (feat/fix/test/refactor)
- Plan completion metadata (docs)
- Project initialization (docs)
- Framework enhancements (meta)

**Key principle:** Commit working code and shipped outcomes, not planning process.

</anti_patterns>

<idumb_integration>

## iDumb Git Integration

**Executor responsibility:**
- `@idumb-executor` creates commits after each task completion
- Uses `@idumb-builder` for actual git operations
- Records commit hashes in `.idumb/brain/state.json` history

**Commit workflow:**
```yaml
task_completion:
  1_verify: "Task passes verification"
  2_stage: "git add changed files"
  3_commit: "git commit with conventional format"
  4_record: "Add to state.json history with hash"
```

**Rollback support:**
```bash
# Executor can rollback to last task checkpoint
git reset --hard {last_task_commit_hash}
```

**State not committed:**
- `.idumb/brain/` is runtime state, not versioned
- Use `.gitignore` to exclude brain directory
- Session handoffs are temporary

</idumb_integration>

<commit_strategy_rationale>

## Why Per-Task Commits?

**Context engineering for AI:**
- Git history becomes primary context source for future sessions
- `git log --grep="{phase}-{plan}"` shows all work for a plan
- `git diff <hash>^..<hash>` shows exact changes per task
- Less reliance on parsing SUMMARY.md = more context for actual work

**Failure recovery:**
- Task 1 committed ✅, Task 2 failed ❌
- Next session: sees task 1 complete, can retry task 2
- Can `git reset --hard` to last successful task

**Debugging:**
- `git bisect` finds exact failing task, not just failing plan
- `git blame` traces line to specific task context
- Each commit is independently revertable

**iDumb governance:**
- Each commit links to specific task ID
- Traceability through state.json history
- Rollback to checkpoints is clean

</commit_strategy_rationale>
