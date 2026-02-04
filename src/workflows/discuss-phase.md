---
name: discuss-phase
description: "Interactive discussion to understand phase goals, scope, and constraints before planning"
type: workflow
version: 0.1.0
last_updated: 2026-02-03
---

# Discuss Phase Workflow

Facilitates collaborative discussion with the user to establish clear understanding of a phase's goals, constraints, and approach before creating a formal plan.

## Entry Conditions

```yaml
entry_conditions:
  must_have:
    - exists: ".planning/ROADMAP.md"
    - state: "initialized = true"
  should_have:
    - exists: ".planning/PROJECT.md"
    - exists: ".planning/REQUIREMENTS.md"
  blocked_when:
    - condition: "!exists('.idumb/brain/state.json')"
      redirect: "/idumb:init"
      message: "iDumb not initialized"
```

## Workflow Steps

```yaml
workflow:
  name: discuss-phase
  interactive: true  # Requires user input throughout
  
  steps:
    1_load_context:
      action: "Load phase from ROADMAP.md"
      method: |
        PHASE=$(cat .planning/ROADMAP.md | grep -A 20 "Phase {N}" 2>/dev/null) || PHASE=""
      output: phase_definition
      
    2_check_existing:
      action: "Check for existing CONTEXT.md"
      method: |
        EXISTING=$(find .planning/phases/{N}/ -name "*CONTEXT.md" 2>/dev/null | head -1) || EXISTING=""
      if_exists: "Load and continue from existing context"
      if_not: "Start fresh discussion"
      
    3_present_to_user:
      action: "Show phase scope and ask clarifying questions"
      agent: null  # Supreme Coordinator handles directly
      questions:
        - "What is the primary goal of this phase?"
        - "What constraints should we respect?"
        - "What existing patterns should we follow?"
        - "What dependencies exist?"
        - "What is the definition of done?"
        
    4_gather_responses:
      action: "Collect and structure user responses"
      output: structured_context
      
    5_generate_artifact:
      action: "Create CONTEXT.md artifact"
      template: "templates/context.md"
      output_path: ".planning/phases/{N}/{phase-name}-CONTEXT.md"
      
    6_update_state:
      action: "Update iDumb state"
      updates:
        - "state.currentPhase = {N}"
        - "state.phaseStatus = 'discussed'"
        - "history += 'discuss-phase:{N}:complete'"
```

## Output Artifact

```yaml
artifact:
  name: "{phase-name}-CONTEXT.md"
  path: ".planning/phases/{N}/"
  template: "templates/context.md"
  frontmatter:
    type: context
    phase: "{N}"
    status: draft
    created: "{timestamp}"
    discussed_with: user
  sections:
    - goal: "Primary objective of this phase"
    - scope: "What's in/out of scope"
    - constraints: "Technical, time, or resource limits"
    - dependencies: "What this phase depends on"
    - approach: "High-level strategy"
    - success_criteria: "Definition of done"
    - open_questions: "Items needing resolution"
```

## Exit Conditions

```yaml
exit_conditions:
  success:
    - artifact_created: ".planning/phases/{N}/*CONTEXT.md"
    - state_updated: "phaseStatus = 'discussed'"
  failure:
    - user_cancelled: "Return to main menu"
    - no_roadmap: "Redirect to /idumb:roadmap"
```

## Chain Rules

```yaml
chains_to:
  on_success:
    command: "/idumb:plan-phase {N}"
    message: "Context captured. Ready to create plan?"
    auto: false  # Ask user first
    
  on_failure:
    command: null
    action: "Log failure, report to user"
    
  on_cancel:
    command: null
    action: "Save partial context if any, return"
```

## Integration Points

```yaml
integration:
  reads_from:
    - ".planning/ROADMAP.md"
    - ".planning/PROJECT.md"
    - ".planning/REQUIREMENTS.md"
  writes_to:
    - ".planning/phases/{N}/*CONTEXT.md"
    - ".idumb/brain/state.json"
  never_modifies:
    - ".planning/ROADMAP.md"
    - ".planning/PROJECT.md"
```

---
*Workflow: discuss-phase v0.1.0*
