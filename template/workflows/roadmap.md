---
name: roadmap
description: "Creates project roadmap with phases, milestones, and dependencies"
type: workflow
version: 0.1.0
last_updated: 2026-02-03
---

# Roadmap Workflow

Generates a structured project roadmap from research and requirements.

## Entry Conditions

```yaml
entry_conditions:
  must_have:
    - exists: ".idumb/brain/state.json"
    - state: "initialized = true"
  should_have:
    - exists: ".idumb/governance/research/"
    - exists: ".planning/PROJECT.md"
  blocked_when:
    - condition: "!exists('.idumb/brain/state.json')"
      redirect: "/idumb:init"
      message: "iDumb not initialized"
```

## Workflow Steps

```yaml
workflow:
  name: roadmap
  interactive: true  # User confirms phases
  
  steps:
    1_validate_prerequisites:
      action: "Check for research or requirements"
      sources:
        - ".idumb/governance/research/"
        - ".planning/PROJECT.md"
        - ".planning/REQUIREMENTS.md"
        - "User input"
        
    2_load_context:
      action: "Gather project context"
      tools:
        - idumb-context:summary
        - idumb-config:read
        
    3_delegate_roadmapper:
      action: "Delegate to roadmapper agent"
      agent: idumb-roadmapper
      inputs:
        - research_findings
        - project_context
        - constraints
        
    4_generate_phases:
      action: "Create phase structure"
      for_each: major_deliverable
      create:
        - phase_definition
        - objectives
        - milestones
        - dependencies
        
    5_validate_roadmap:
      action: "Check roadmap validity"
      agent: idumb-low-validator
      checks:
        - logical_flow
        - dependency_cycles
        - realistic_scope
        
    6_store_roadmap:
      action: "Save roadmap"
      paths:
        - ".idumb/governance/roadmap.md"
        - ".planning/ROADMAP.md"
        
    7_update_state:
      action: "Record roadmap creation"
      tool: idumb-state:write
      phase: "roadmap_created"
```

## Output Artifact

```yaml
artifact:
  name: "ROADMAP.md"
  paths:
    - ".planning/ROADMAP.md"
    - ".idumb/governance/roadmap.md"
  sections:
    - overview: "Project summary and goals"
    - phases:
        for_each:
          - name: "Phase name"
          - objective: "Clear objective"
          - milestones: "List of milestones"
          - deliverables: "Expected outputs"
          - dependencies: "Phase dependencies"
    - timeline: "Estimated schedule"
    - risks: "Risk mitigation"
```

## Exit Conditions

```yaml
exit_conditions:
  success:
    - artifact_created: ".planning/ROADMAP.md"
    - no_cycles: true
    - state_updated: true
  failure:
    - dependency_cycle: "Report cycle and ask for resolution"
    - no_input: "Request research or requirements"
```

## Chain Rules

```yaml
chains_to:
  on_success:
    command: "/idumb:discuss-phase 1"
    message: "Roadmap created. Discuss first phase?"
    auto: false
    
  on_failure:
    redirect:
      no_research: "/idumb:research"
      no_project: "/idumb:new-project"
```

## Integration Points

```yaml
integration:
  reads_from:
    - ".idumb/governance/research/"
    - ".planning/PROJECT.md"
    - ".planning/REQUIREMENTS.md"
  writes_to:
    - ".planning/ROADMAP.md"
    - ".idumb/governance/roadmap.md"
    - ".idumb/brain/state.json"
  never_modifies:
    - ".planning/PROJECT.md"
```

---
*Workflow: roadmap v0.1.0*
