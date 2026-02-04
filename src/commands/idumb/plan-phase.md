---
description: "Create detailed implementation plan for a specific phase"
id: cmd-plan-phase
parent: commands-idumb
agent: idumb-supreme-coordinator
---

# /idumb:plan-phase

Create detailed implementation plan for a specific phase.

## Usage

```
/idumb:plan-phase [phase-number|phase-name] [--detail=high|medium|low] [--parallel]
```

## Description

Generates comprehensive phase plan including:
- Task breakdown with estimates
- Dependency mapping
- Resource allocation
- Risk mitigations
- Validation checkpoints

## Workflow

```yaml
steps:
  1_validate_prerequisites:
    action: Check prerequisites
    checks:
      - roadmap_exists
      - phase_defined
      - discussion_completed (optional)
      
  2_load_context:
    action: Gather all context
    sources:
      - roadmap.md
      - phase-context.md
      - previous_plans
      - codebase_state
      
  3_delegate_planner:
    action: Delegate to planner agent
    agent: idumb-planner
    inputs:
      - phase_objectives
      - constraints
      - available_resources
      
  4_create_tasks:
    action: Break down into tasks
    for_each: deliverable
    create:
      - task_definition
      - estimate
      - dependencies
      - assignee_type
      
  5_validate_plan:
    action: Check plan validity
    agent: idumb-plan-checker
    checks:
      - completeness
      - feasibility
      - dependency_validity
      - resource_fit
      
  6_store_plan:
    action: Save phase plan
    path: .idumb/idumb-brain/governance/plans/<phase>-plan.md
    
  7_update_state:
    action: Record plan creation
    tool: idumb-state:write
    phase: "<phase>_planned"
    
  8_report:
    action: Display plan summary
```

## Arguments

| Argument | Description | Default |
|----------|-------------|---------|
| `phase` | Phase number or name | Current phase |
| `--detail` | Plan detail level | `high` |
| `--parallel` | Enable parallel tasks | `true` |
| `--estimate` | Include time estimates | `true` |
| `--template` | Plan template | `standard` |

## Plan Structure

```markdown
# Phase X Plan: [Phase Name]

## Overview
**Objective:** [Phase objective]
**Duration:** [Estimated duration]
**Tasks:** [Total task count]

## Tasks

### Task 1: [Name]
**ID:** P1-T1
**Description:** [Detailed description]
**Estimate:** [Time estimate]
**Dependencies:** [Task IDs]
**Assignee:** [Agent type]
**Acceptance Criteria:**
- [Criterion 1]
- [Criterion 2]

### Task 2: [Name]
...

## Dependency Graph
```
P1-T1 → P1-T2 → P1-T4
  ↓
P1-T3 → P1-T5
```

## Schedule
| Task | Start | End | Duration | Assignee |
|------|-------|-----|----------|----------|
| T1 | Day 1 | Day 2 | 2d | builder |
| T2 | Day 3 | Day 4 | 2d | builder |

## Risk Mitigation
| Risk | Task | Mitigation |
|------|------|------------|
| [Risk] | [Task] | [Strategy] |

## Validation Checkpoints
- [ ] Checkpoint 1: [Description]
- [ ] Checkpoint 2: [Description]
```

## Task Types

| Type | Description | Assignee |
|------|-------------|----------|
| `research` | Investigation | project-researcher |
| `design` | Architecture/design | planner |
| `implement` | Code implementation | builder |
| `test` | Testing/validation | low-validator |
| `review` | Code review | high-governance |
| `integrate` | Integration work | executor |
| `document` | Documentation | builder |

## Examples

```bash
# Plan current phase
/idumb:plan-phase

# Plan specific phase with high detail
/idumb:plan-phase 2 --detail=high

# Plan with parallel tasks disabled
/idumb:plan-phase 3 --parallel=false
```

## Validation

Plan checker validates:
- All deliverables have tasks
- Dependencies are valid (no cycles)
- Estimates are reasonable
- Resources are available
- Risks have mitigations

## Error Handling

| Error | Cause | Resolution |
|-------|-------|------------|
| `P001` | Phase not found | Check roadmap |
| `P002` | Plan validation failed | Review plan errors |
| `P003` | Dependency cycle | Reorder tasks |

## Related Commands

- `/idumb:discuss-phase` - Discuss phase first
- `/idumb:execute-phase` - Execute the plan
- `/idumb:verify-work` - Verify completion

## Governance

**Delegation Chain:**
```
user → supreme-coordinator → high-governance → planner → plan-checker
```

**Validation Points:**
- Pre: Phase defined in roadmap
- Post: Plan passes validation
- Post: All tasks have estimates
- Post: No dependency cycles

## Metadata

```yaml
category: planning
priority: P1
complexity: high
version: 0.1.0
```
