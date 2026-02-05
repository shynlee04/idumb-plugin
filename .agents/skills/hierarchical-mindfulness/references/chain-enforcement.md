# Chain Enforcement Reference

Complete MUST-BEFORE and SHOULD-BEFORE dependency rules from `src/router/chain-enforcement.md`.

## Rule Categories

### Initialization Chain (INIT)

```yaml
INIT-01:
  command: "/idumb:*"
  must_before:
    - exists: ".idumb/brain/state.json"
  except:
    - "/idumb:init"
    - "/idumb:help"
  on_violation:
    action: "redirect"
    target: "/idumb:init"
    message: "iDumb not initialized. Running init first."
```

### Project Chain (PROJ)

```yaml
PROJ-01:
  command: "/idumb:roadmap"
  must_before:
    - exists: ".planning/PROJECT.md"
  on_violation:
    action: "block"
    message: "PROJECT.md required. Run /idumb:new-project first."

PROJ-02:
  command: "/idumb:discuss-phase"
  must_before:
    - exists: ".planning/ROADMAP.md"
  on_violation:
    action: "redirect"
    target: "/idumb:roadmap"
    message: "ROADMAP.md required before discussing phases."
```

### Phase Execution Chain (PHASE)

```yaml
PHASE-01:
  command: "/idumb:execute-phase"
  must_before:
    - exists: ".planning/phases/{phase}/*PLAN.md"
  on_violation:
    action: "redirect"
    target: "/idumb:plan-phase"
    message: "PLAN.md required before execution. Creating plan first."

PHASE-02:
  command: "/idumb:execute-phase"
  should_before:
    - exists: ".planning/phases/{phase}/*CONTEXT.md"
  on_violation:
    action: "warn"
    message: "No CONTEXT.md found. Recommend /idumb:discuss-phase first."
    continue: true

PHASE-03:
  command: "/idumb:verify-work"
  must_before:
    - one_of:
        - exists: ".planning/phases/{phase}/*SUMMARY.md"
        - state: "phase.status = 'in_progress' OR 'completed'"
  on_violation:
    action: "block"
    message: "No execution evidence found. Nothing to verify."
```

### Validation Chain (VAL)

```yaml
VAL-01:
  command: "state.phase = 'complete'"
  must_before:
    - exists: ".planning/phases/{phase}/*VERIFICATION.md"
  on_violation:
    action: "block"
    message: "Cannot mark phase complete without verification evidence."

VAL-02:
  command: "commit_changes"
  should_before:
    - validation: "last_validation < 10 minutes ago"
  on_violation:
    action: "warn"
    message: "Consider validating changes before commit."
    continue: true
```

## Dependency Graph

```
/idumb:init
    │
    ▼
/idumb:new-project ─────────────────┐
    │                               │
    ▼                               │
.planning/PROJECT.md                │
    │                               │
    ▼                               │
/idumb:roadmap                      │
    │                               │
    ▼                               │
.planning/ROADMAP.md ◄──────────────┘
    │
    ▼
/idumb:discuss-phase [N] ◄── RECOMMENDED (creates CONTEXT.md)
    │
    ▼
/idumb:plan-phase [N] ◄──── REQUIRED (creates PLAN.md)
    │
    ▼
.planning/phases/{N}/*PLAN.md
    │
    ▼
/idumb:execute-phase [N]
    │
    ▼
.planning/phases/{N}/*SUMMARY.md
    │
    ▼
/idumb:verify-work [N] ◄──── REQUIRED for completion
    │
    ▼
.planning/phases/{N}/*VERIFICATION.md
    │
    ▼
PHASE COMPLETE ✓
```

## Enforcement Levels

| Level | Description | Override |
|-------|-------------|----------|
| **HARD_BLOCK** | Cannot proceed under any circumstances | No |
| **SOFT_BLOCK** | Blocked but user can override with --force | Yes |
| **WARN** | Warning only, continues after notification | N/A |

## Skip Conditions

```yaml
emergency_mode:
  trigger: "--emergency or --bypass-chain"
  behavior: "Skip all chain checks"
  logging: "CRITICAL - Chain bypass used"
  requires: "User acknowledgment"

readonly_commands:
  commands:
    - "/idumb:status"
    - "/idumb:help"
    - "/idumb:validate"
  behavior: "Always allowed, no chain check"
```

## Prerequisite Types

| Type | Description | Example |
|------|-------------|---------|
| `exists` | File must exist | `.idumb/brain/state.json` |
| `state` | State condition must be true | `phase.status = 'in_progress'` |
| `validation` | Validation condition | `last_validation < 10 minutes ago` |
| `one_of` | Any alternative must pass | `SUMMARY.md exists OR phase in_progress` |

## Error Recovery

```yaml
on_chain_violation:
  1: "Log violation to .idumb/brain/governance/chain.log"
  2: "Present user with options:"
     a: "Run prerequisite command automatically"
     b: "Override with --force (if allowed)"
     c: "Cancel operation"
  3: "Record decision in history"

on_repeated_violation:
  threshold: "3 violations in 10 minutes"
  action: "Suggest /idumb:debug for workflow issues"
```
