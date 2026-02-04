---
description: "Routing rules for iDumb command and workflow control"
type: router
version: 0.1.0
last_updated: 2026-02-03
---

# iDumb Routing Rules

Central routing table that maps governance state to allowed commands, blocked commands, and automatic redirects.

## State-Based Routing

```yaml
routing_table:
  
  # STATE: No .idumb/ directory exists
  state_uninitialized:
    detect:
      - condition: "!exists('.idumb/idumb-brain/state.json')"
    allowed_commands:
      - /idumb:init
      - /idumb:help
    blocked_commands:
      - /idumb:execute-phase
      - /idumb:plan-phase
      - /idumb:discuss-phase
      - /idumb:verify-work
    auto_redirect:
      on_blocked: /idumb:init
      message: "iDumb not initialized. Run /idumb:init first."
    
  # STATE: Initialized but no project
  state_no_project:
    detect:
      - condition: "exists('.idumb/') && !exists('.planning/PROJECT.md')"
    allowed_commands:
      - /idumb:new-project
      - /idumb:help
      - /idumb:status
    blocked_commands:
      - /idumb:execute-phase
      - /idumb:plan-phase
      - /idumb:discuss-phase
    auto_redirect:
      on_blocked: /idumb:new-project
      message: "No project defined. Create project first."
    
  # STATE: Project exists, no roadmap
  state_no_roadmap:
    detect:
      - condition: "exists('.planning/PROJECT.md') && !exists('.planning/ROADMAP.md')"
    allowed_commands:
      - /idumb:roadmap
      - /idumb:research
      - /idumb:help
    blocked_commands:
      - /idumb:execute-phase
      - /idumb:plan-phase
    auto_redirect:
      on_blocked: /idumb:roadmap
      message: "No roadmap exists. Create roadmap first."
    
  # STATE: In discuss phase
  state_discuss:
    detect:
      - condition: "state.phase.includes('discuss')"
    allowed_commands:
      - /idumb:discuss-phase
      - /idumb:plan-phase   # Can proceed to planning
      - /idumb:help
      - /idumb:status
    blocked_commands:
      - /idumb:execute-phase  # Cannot execute without plan
    auto_redirect:
      on_blocked: /idumb:plan-phase
      message: "Complete planning before execution."
    
  # STATE: In plan phase (plan exists)
  state_planning:
    detect:
      - condition: "state.phase.includes('plan')"
      - condition: "exists('.planning/phases/*/PLAN.md')"
    allowed_commands:
      - /idumb:plan-phase
      - /idumb:execute-phase  # Can execute with plan
      - /idumb:discuss-phase
      - /idumb:help
    blocked_commands: []  # All allowed
    auto_redirect: null
    
  # STATE: In execution phase
  state_executing:
    detect:
      - condition: "state.phase.includes('execute')"
    allowed_commands:
      - /idumb:execute-phase
      - /idumb:verify-work
      - /idumb:debug
      - /idumb:status
    blocked_commands:
      - /idumb:plan-phase  # Don't re-plan during execution
    auto_redirect:
      on: "/idumb:plan-phase"
      message: "Currently executing. Use /idumb:verify-work if stuck."
    
  # STATE: Verification phase
  state_verifying:
    detect:
      - condition: "state.phase.includes('verify')"
    allowed_commands:
      - /idumb:verify-work
      - /idumb:debug
      - /idumb:execute-phase  # Can re-execute if issues
      - /idumb:status
    blocked_commands: []
    auto_redirect: null
```

## Command Priority Matrix

```yaml
priority_matrix:
  P0_critical:
    commands:
      - /idumb:init
      - /idumb:help
    behavior: "Always execute immediately"
    
  P1_safety:
    commands:
      - /idumb:status
      - /idumb:validate
    behavior: "Safe, read-only, always allowed"
    
  P2_workflow:
    commands:
      - /idumb:discuss-phase
      - /idumb:plan-phase
      - /idumb:execute-phase
      - /idumb:verify-work
    behavior: "Subject to state routing"
    
  P3_utility:
    commands:
      - /idumb:research
      - /idumb:roadmap
      - /idumb:debug
    behavior: "Context-dependent"
```

## Auto-Correction Triggers

```yaml
auto_corrections:
  missing_plan:
    trigger: "User requests /idumb:execute-phase but no PLAN.md exists"
    action: "Redirect to /idumb:plan-phase"
    message: "No plan found for this phase. Starting planning..."
    
  stale_context:
    trigger: "state.lastValidation > 48 hours ago"
    action: "Warn user, suggest /idumb:validate"
    message: "Context may be stale. Consider running /idumb:validate"
    
  incomplete_validation:
    trigger: "state.phase = 'complete' but no VERIFICATION.md"
    action: "Block completion, require verification"
    message: "Cannot mark complete without verification evidence"
    
  orphan_execution:
    trigger: "Execution started without discuss or plan phase"
    action: "Warn, suggest structured approach"
    message: "Consider /idumb:discuss-phase for better outcomes"
```

## Usage

This routing table is consumed by:
- `idumb-supreme-coordinator` - For delegation decisions
- `prompt-intercepts.md` - For session start injections
- `chain-enforcement.md` - For MUST-BEFORE validation

---
*Routing rules v0.1.0 - Phase 1 Governance Core*
