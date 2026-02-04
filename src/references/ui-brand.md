# UI Brand

Visual identity and formatting guidelines for iDumb framework output.

<branding>
**Framework Name:** iDumb (Intelligent Delegation Using Managed Boundaries)
**Prefix:** `idumb:` for commands, `idumb-` for agents/tools
**Symbol:** ► (right pointer for flow/progress)
**Box Style:** Double-line for checkpoints, single-line for status
</branding>

<stage_banners>

## Stage Banners

Used to clearly mark workflow stage transitions:

```
━━━ iDumb ► RESEARCHING PHASE 1 ━━━
━━━ iDumb ► PLANNING PHASE 1 ━━━
━━━ iDumb ► EXECUTING WAVE 1/3 ━━━
━━━ iDumb ► VERIFYING PHASE 1 ━━━
━━━ iDumb ► CHECKPOINT ━━━
```

**Format:**
```
━━━ iDumb ► {ACTION} {CONTEXT} ━━━
```

**Actions:**
- `RESEARCHING` - Phase research
- `PLANNING` - Creating plans
- `EXECUTING` - Running tasks
- `VERIFYING` - Checking work
- `VALIDATING` - Governance checks
- `DELEGATING` - Spawning agents
- `CHECKPOINT` - Awaiting human
- `COMPLETED` - Finished step

</stage_banners>

<checkpoint_boxes>

## Checkpoint Boxes

**Human Verification:**
```
╔═══════════════════════════════════════════════════════╗
║  CHECKPOINT: Verification Required                    ║
╚═══════════════════════════════════════════════════════╝

Progress: 5/8 tasks complete
Task: {task name}

Built: {what was built}

How to verify:
  1. {step 1}
  2. {step 2}
  3. {step 3}

────────────────────────────────────────────────────────
→ YOUR ACTION: Type "approved" or describe issues
────────────────────────────────────────────────────────
```

**Decision:**
```
╔═══════════════════════════════════════════════════════╗
║  CHECKPOINT: Decision Required                        ║
╚═══════════════════════════════════════════════════════╝

Progress: 2/6 tasks complete
Task: {decision context}

Decision: {what's being decided}

Options:
  1. {option-a} - {description}
     Pros: {benefits}
     Cons: {tradeoffs}

  2. {option-b} - {description}
     Pros: {benefits}
     Cons: {tradeoffs}

────────────────────────────────────────────────────────
→ YOUR ACTION: Select {option-a} or {option-b}
────────────────────────────────────────────────────────
```

**Human Action:**
```
╔═══════════════════════════════════════════════════════╗
║  CHECKPOINT: Action Required                          ║
╚═══════════════════════════════════════════════════════╝

Progress: 3/8 tasks complete
Task: {action context}

Attempted: {what was tried}
Error: {what went wrong}

What you need to do:
  1. {instruction 1}
  2. {instruction 2}

I'll verify: {how claude will confirm}

────────────────────────────────────────────────────────
→ YOUR ACTION: Type "done" when completed
────────────────────────────────────────────────────────
```

</checkpoint_boxes>

<status_symbols>

## Status Symbols

| Symbol | Meaning | Use |
|--------|---------|-----|
| ✓ | Completed | Task done |
| ✗ | Failed | Task failed |
| ○ | Pending | Not started |
| ● | In progress | Currently running |
| ◐ | Partial | Incomplete |
| ⚠ | Warning | Attention needed |
| 🔒 | Blocked | Waiting on dependency |
| → | Next | Indicates action |
| ► | Active/Current | Stage marker |
| ▸ | Bullet | List item |

**Example usage:**
```
Phase 1 Progress:
  ✓ Task 1: Create schema
  ✓ Task 2: Implement API
  ● Task 3: Add validation (in progress)
  ○ Task 4: Write tests
  🔒 Task 5: Deploy (blocked by Task 4)
```

</status_symbols>

<progress_display>

## Progress Display

**Wave progress:**
```
━━━ iDumb ► EXECUTING WAVE 1/3 ━━━

Wave 1: Foundation (4 tasks)
  ✓ [1.1] Create database schema
  ✓ [1.2] Set up API routes
  ● [1.3] Implement auth (in progress)
  ○ [1.4] Add validation

Progress: 2/4 tasks complete
```

**Phase summary:**
```
┌─────────────────────────────────────────────────────┐
│  PHASE 1 SUMMARY                                    │
├─────────────────────────────────────────────────────┤
│  Status: COMPLETED                                  │
│  Tasks: 12/12 (100%)                               │
│  Duration: 45 minutes                               │
│  Human checkpoints: 2                               │
│  Commits: 8                                         │
└─────────────────────────────────────────────────────┘
```

</progress_display>

<delegation_display>

## Delegation Display

**Agent spawn:**
```
━━━ iDumb ► DELEGATING ━━━

Spawning: @idumb-planner
Task: Create phase plan for Phase 2
Context: 1,234 tokens

Waiting for response...
```

**Agent return:**
```
━━━ iDumb ► DELEGATION COMPLETE ━━━

Agent: @idumb-planner
Result: SUCCESS
Output: Phase 2 plan created (24 tasks, 4 waves)
Duration: 2m 34s
```

</delegation_display>

<error_display>

## Error Display

**Recoverable error:**
```
⚠ WARNING: Rate limit reached

Waiting 30 seconds before retry...
Attempt 2/3
```

**Blocking error:**
```
╔═══════════════════════════════════════════════════════╗
║  ERROR: Execution Blocked                             ║
╚═══════════════════════════════════════════════════════╝

Error: Database connection failed
Location: Task 3.2 - Create user record
Attempts: 3

Options:
  1. retry - Try again
  2. skip - Skip this task (may break dependencies)
  3. abort - Stop execution, preserve state

────────────────────────────────────────────────────────
→ YOUR ACTION: Select retry, skip, or abort
────────────────────────────────────────────────────────
```

</error_display>

<governance_display>

## Governance Display

**Validation report:**
```
━━━ iDumb ► VALIDATION COMPLETE ━━━

Scope: Phase 1 artifacts
Checked: 15 items
Passed: 14 (93%)
Failed: 1

Issues:
  ✗ src/components/Chat.tsx - Placeholder text found
    Line 42: "Coming soon"

Recommendation: Fix before proceeding
```

**Permission check:**
```
⚠ GOVERNANCE: Permission denied

Agent: idumb-low-validator
Attempted: write to src/api/route.ts
Required: write permission
Status: BLOCKED

Only @idumb-builder may write files.
Use delegation chain: coordinator → executor → builder
```

</governance_display>

<color_guidelines>

## Color Guidelines (Terminal/TUI)

When terminal supports colors:

| Element | Color | ANSI |
|---------|-------|------|
| Stage banners | Cyan | `\033[36m` |
| Success | Green | `\033[32m` |
| Error | Red | `\033[31m` |
| Warning | Yellow | `\033[33m` |
| Info | Blue | `\033[34m` |
| Dim/secondary | Gray | `\033[90m` |
| Reset | - | `\033[0m` |

**Example with colors:**
```bash
echo -e "\033[36m━━━ iDumb ► EXECUTING \033[0m"
echo -e "\033[32m✓\033[0m Task complete"
echo -e "\033[31m✗\033[0m Task failed"
echo -e "\033[33m⚠\033[0m Warning message"
```

</color_guidelines>
