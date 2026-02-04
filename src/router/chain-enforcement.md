---
description: "Chain enforcement rules - MUST-BEFORE dependencies between commands and phases"
type: enforcement
version: 0.1.0
last_updated: 2026-02-03
---

# iDumb Chain Enforcement

Defines mandatory prerequisites (MUST-BEFORE rules) that prevent premature execution and ensure governance integrity.

## Core Chain Rules

```yaml
chain_rules:

  # ======================
  # INITIALIZATION CHAIN
  # ======================
  
  init_chain:
    name: "Initialization Prerequisites"
    rules:
      - id: INIT-01
        command: /idumb:*
        must_before:
          - exists: ".idumb/idumb-brain/state.json"
        except:
          - /idumb:init
          - /idumb:help
        on_violation:
          action: redirect
          target: /idumb:init
          message: "iDumb not initialized. Running init first."

  # ======================
  # PROJECT CHAIN
  # ======================
  
  project_chain:
    name: "Project Definition Prerequisites"
    rules:
       - id: PROJ-01
        command: /idumb:roadmap
        must_before:
          - exists: ".planning/PROJECT.md"
        on_violation:
          action: block
          message: "PROJECT.md required. Run /idumb:new-project first."
          
      - id: PROJ-02
        command: /idumb:discuss-phase
        must_before:
          - exists: ".planning/ROADMAP.md"
        on_violation:
          action: redirect
          target: /idumb:roadmap
          message: "ROADMAP.md required before discussing phases."

  # ======================
  # PHASE EXECUTION CHAIN
  # ======================
  
  phase_chain:
    name: "Phase Execution Prerequisites"
    rules:
      - id: PHASE-01
        command: /idumb:execute-phase
        must_before:
          - exists: ".planning/phases/{phase}/*PLAN.md"
        on_violation:
          action: redirect
          target: /idumb:plan-phase
          message: "PLAN.md required before execution. Creating plan first."
          
      - id: PHASE-02
        command: /idumb:execute-phase
        should_before:
          - exists: ".planning/phases/{phase}/*CONTEXT.md"
        on_violation:
          action: warn
          message: "No CONTEXT.md found. Recommend /idumb:discuss-phase first."
          continue: true  # Warning only, don't block
          
      - id: PHASE-03
        command: /idumb:verify-work
        must_before:
          - one_of:
              - exists: ".planning/phases/{phase}/*SUMMARY.md"
              - state: "phase.status = 'in_progress' OR 'completed'"
        on_violation:
          action: block
          message: "No execution evidence found. Nothing to verify."

  # ======================
  # VALIDATION CHAIN
  # ======================
  
  validation_chain:
    name: "Validation Prerequisites"
    rules:
      - id: VAL-01
        command: "state.phase = 'complete'"
        must_before:
          - exists: ".planning/phases/{phase}/*VERIFICATION.md"
        on_violation:
          action: block
          message: "Cannot mark phase complete without verification evidence."
          
      - id: VAL-02
        command: "commit_changes"
        must_before:
          - validation: "last_validation < 10 minutes ago"
        on_violation:
          action: warn
          message: "Consider validating changes before commit."
          continue: true
```

## MUST-BEFORE Dependency Graph

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

```yaml
enforcement_levels:

  HARD_BLOCK:
    description: "Cannot proceed under any circumstances"
    applies_to:
      - INIT-01: "No commands without init"
      - PHASE-01: "No execute without plan"
      - VAL-01: "No completion without verification"
    override: false
    
  SOFT_BLOCK:
    description: "Blocked but user can override with --force"
    applies_to:
      - PROJ-01: "Roadmap without project"
    override: true
    override_flag: "--force"
    log_override: true
    
  WARN:
    description: "Warning only, continues after notification"
    applies_to:
      - PHASE-02: "Execute without discuss"
      - VAL-02: "Commit without recent validation"
    continue: true
    log_warning: true
```

## Chain Validation Protocol

```yaml
validation_protocol:
  on_command_received:
    steps:
      1. Parse command and extract phase number if applicable
      2. Load current state from .idumb/idumb-brain/state.json
      3. Check chain_rules for matching command
      4. For each must_before:
         - If file check: verify file exists
         - If state check: verify state condition
         - If validation check: verify timestamp
      5. On violation:
         - HARD_BLOCK: Stop, execute on_violation.action
         - SOFT_BLOCK: Check for --force flag
         - WARN: Log, continue
      6. Pass to command handler if all checks pass
      
  return_format:
    passed: true/false
    violations: []
    redirected_to: null or command
    warnings: []
```

## Skip Conditions

```yaml
skip_conditions:
  # These conditions bypass chain enforcement
  
  emergency_mode:
    trigger: "--emergency or --bypass-chain"
    behavior: "Skip all chain checks"
    logging: "CRITICAL - Chain bypass used"
    requires: "User acknowledgment"
    
  readonly_commands:
    commands:
      - /idumb:status
      - /idumb:help
      - /idumb:validate
    behavior: "Always allowed, no chain check"
```

## Error Recovery

```yaml
error_recovery:
  on_chain_violation:
    1. Log violation to .idumb/idumb-brain/governance/chain.log
    2. Present user with options:
       a. Run prerequisite command automatically
       b. Override with --force (if allowed)
       c. Cancel operation
    3. Record decision in history
    
  on_repeated_violation:
    threshold: 3 violations in 10 minutes
    action: "Suggest /idumb:debug for workflow issues"
```

---
*Chain Enforcement v0.1.0 - Phase 1 Governance Core*
