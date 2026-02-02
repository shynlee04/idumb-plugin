---
name: plan-phase
description: "Creates detailed execution plan with tasks, dependencies, and validation criteria"
type: workflow
version: 0.1.0
last_updated: 2026-02-03
---

# Plan Phase Workflow

Spawns research and planning agents to create a comprehensive execution plan for a phase. Validates plan quality before proceeding.

## Entry Conditions

```yaml
entry_conditions:
  must_have:
    - exists: ".planning/ROADMAP.md"
    - state: "initialized = true"
  should_have:
    - exists: ".planning/phases/{N}/*CONTEXT.md"
  blocked_when:
    - condition: "!exists('.planning/ROADMAP.md')"
      redirect: "/idumb:roadmap"
      message: "No roadmap exists"
    - condition: "exists('.planning/phases/{N}/*PLAN.md') && !force"
      action: "warn"
      message: "Plan already exists. Use --force to recreate."
```

## Workflow Steps

```yaml
workflow:
  name: plan-phase
  interactive: false  # Agent-driven after kickoff
  
  steps:
    1_load_context:
      action: "Load phase context"
      method: |
        CONTEXT=$(cat .planning/phases/{N}/*CONTEXT.md 2>/dev/null) || CONTEXT=""
        ROADMAP_PHASE=$(grep -A 30 "Phase {N}" .planning/ROADMAP.md 2>/dev/null) || ROADMAP_PHASE=""
      output: context_bundle
      
    2_spawn_researcher:
      action: "Spawn phase researcher if needed"
      agent: "idumb-phase-researcher"
      condition: "CONTEXT is empty OR context older than 24h"
      task: "Research implementation patterns for phase {N}"
      output: ".planning/phases/{N}/RESEARCH.md"
      
    3_spawn_planner:
      action: "Spawn planner agent"
      agent: "idumb-planner"
      input:
        - context_bundle
        - research_output (if exists)
      task: |
        Create detailed execution plan for phase {N}.
        Include: task breakdown, dependencies, success criteria, risks.
        Use template: templates/plan.md
      output: ".planning/phases/{N}/*PLAN.md"
      
    4_validate_plan:
      action: "Spawn plan checker"
      agent: "idumb-plan-checker"
      input: plan_output
      checks:
        - "All tasks have clear acceptance criteria"
        - "Dependencies form valid DAG (no cycles)"
        - "Estimates are realistic (sum < phase limit)"
        - "Risks have mitigations"
      output: validation_result
      
    5_handle_validation:
      action: "Process validation result"
      if_passed:
        - "Mark plan as checked"
        - "Update state"
        - "Proceed to chain"
      if_failed:
        - "Return to planner with feedback"
        - "Retry up to 3 times"
        - "If still fails, present to user"
        
    6_update_state:
      action: "Update iDumb state"
      updates:
        - "state.currentPhase = {N}"
        - "state.phaseStatus = 'planned'"
        - "history += 'plan-phase:{N}:complete'"
```

## Output Artifact

```yaml
artifact:
  name: "{phase-name}-PLAN.md"
  path: ".planning/phases/{N}/"
  template: "templates/plan.md"
  frontmatter:
    type: plan
    phase: "{N}"
    status: checked
    created: "{timestamp}"
    validated_by: idumb-plan-checker
    validation_score: "{score}"
  sections:
    - overview: "Plan summary and goals"
    - tasks:
        format: "yaml list"
        each_task:
          - id: "T{N}-{seq}"
          - title: "Task title"
          - description: "What to do"
          - acceptance: "How to verify done"
          - estimate: "Time estimate"
          - depends_on: "Task IDs or 'none'"
          - assigned_to: "agent or 'user'"
    - dependencies: "Dependency graph"
    - risks: "Known risks and mitigations"
    - success_criteria: "Phase completion requirements"
```

## Agent Spawning

```yaml
agents:
  idumb-phase-researcher:
    when: "No CONTEXT.md or context stale"
    timeout: 300s
    output: "RESEARCH.md"
    
  idumb-planner:
    when: "Always (core of this workflow)"
    timeout: 600s
    output: "*PLAN.md"
    
  idumb-plan-checker:
    when: "After plan created"
    timeout: 120s
    output: "validation inline"
    can_fail: true
    retry: 3
```

## Exit Conditions

```yaml
exit_conditions:
  success:
    - artifact_created: ".planning/phases/{N}/*PLAN.md"
    - validation_passed: true
    - state_updated: "phaseStatus = 'planned'"
  partial:
    - artifact_created: true
    - validation_passed: false
    - user_action: "Accept anyway or revise"
  failure:
    - agent_timeout: "Report and retry or escalate"
    - max_retries_exceeded: "Present to user"
```

## Chain Rules

```yaml
chains_to:
  on_success:
    command: "/idumb:execute-phase {N}"
    message: "Plan validated. Ready to execute?"
    auto: false  # Always ask user
    
  on_partial:
    options:
      - accept: "Proceed with warnings"
      - revise: "Return to planning"
      - discuss: "Go back to /idumb:discuss-phase"
      
  on_failure:
    command: "/idumb:debug"
    message: "Planning failed. Debug?"
```

## Integration Points

```yaml
integration:
  gsd_equivalent: "/gsd:plan-phase"
  reads_from:
    - ".planning/ROADMAP.md"
    - ".planning/phases/{N}/*CONTEXT.md"
    - ".planning/PROJECT.md"
  writes_to:
    - ".planning/phases/{N}/*PLAN.md"
    - ".planning/phases/{N}/RESEARCH.md"
    - ".idumb/brain/state.json"
  never_modifies:
    - ".planning/ROADMAP.md"
    - ".planning/PROJECT.md"
```

---
*Workflow: plan-phase v0.1.0*
