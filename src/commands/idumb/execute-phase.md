---
description: "Execute a phase plan with full governance and monitoring"
agent: idumb-supreme-coordinator
---

# /idumb:execute-phase

Execute a phase plan with full governance and monitoring.

## Usage

```
/idumb:execute-phase [phase-number|phase-name] [--mode=interactive|auto] [--dry-run]
```

## Description

Executes phase plan through hierarchical delegation:
- Breaks plan into executable batches
- Delegates to appropriate agents
- Monitors progress and handles blockers
- Validates completion of each task
- Maintains execution state for pause/resume

## Workflow

```yaml
steps:
  1_validate_plan:
    action: Verify plan exists and is valid
    checks:
      - plan_file_exists
      - plan_valid
      - prerequisites_met
      
  2_load_execution_state:
    action: Check for paused execution
    tool: idumb-state:read
    
  3_prepare_batches:
    action: Group tasks into execution batches
    based_on:
      - dependencies
      - parallelizability
      - agent_availability
      
  4_execution_loop:
    action: Execute batches
    while: tasks_remain
    do:
      - select_next_batch
      - delegate_to_executor
      - monitor_progress
      - handle_blockers
      - validate_completion
      - update_state
      
  5_cross_phase_validation:
    action: Check integration with other phases
    agent: idumb-integration-checker
    
  6_final_validation:
    action: Verify phase completion
    agent: idumb-verifier
    
  7_update_state:
    action: Record phase completion
    tool: idumb-state:write
    phase: "<phase>_completed"
    
  8_report:
    action: Display execution summary
```

## Arguments

| Argument | Description | Default |
|----------|-------------|---------|
| `phase` | Phase number or name | Current phase |
| `--mode` | Execution mode | `interactive` |
| `--dry-run` | Simulate without executing | `false` |
| `--batch-size` | Tasks per batch | `5` |
| `--timeout` | Per-task timeout | `10m` |
| `--resume` | Resume paused execution | `false` |

## Execution Modes

### Interactive Mode
- Pauses for user confirmation at checkpoints
- Reports progress regularly
- Asks for decisions on blockers
- Default for complex phases

### Auto Mode
- Executes without user intervention
- Uses predefined decision rules
- Logs all actions
- Suitable for well-defined tasks

## Task Execution

```yaml
task_execution:
  delegate_to: executor
  inputs:
    - task_definition
    - context
    - acceptance_criteria
  outputs:
    - completion_status
    - evidence
    - artifacts_created
  validation:
    - acceptance_criteria_met
    - no_regressions
    - tests_pass
```

## State Management

Execution state tracks:
```json
{
  "phase": "phase-2",
  "status": "in_progress",
  "completed_tasks": ["P2-T1", "P2-T2"],
  "current_batch": ["P2-T3", "P2-T4"],
  "blocked_tasks": [],
  "start_time": "2026-02-03T10:00:00Z",
  "estimated_completion": "2026-02-05T16:00:00Z"
}
```

## Pause/Resume

Execution can be paused:
- User request
- Error encountered
- Timeout reached
- Resource unavailable

Resume continues from last completed batch.

## Examples

```bash
# Execute current phase interactively
/idumb:execute-phase

# Execute specific phase in auto mode
/idumb:execute-phase 2 --mode=auto

# Dry run to preview execution
/idumb:execute-phase --dry-run

# Resume paused execution
/idumb:execute-phase --resume
```

## Progress Reporting

```
Phase 2 Execution Progress
==========================
Tasks: 12/20 completed (60%)
Current: Implementing API endpoints (P2-T5)
ETA: 2 hours remaining

Recent completions:
✓ P2-T3: Set up database schema
✓ P2-T4: Create API models

Current batch:
→ P2-T5: Implement GET /api/users
→ P2-T6: Implement POST /api/users
```

## Error Handling

| Error | Cause | Resolution |
|-------|-------|------------|
| `E001` | Plan not found | Run /idumb:plan-phase first |
| `E002` | Task failed | Review error, retry or modify |
| `E003` | Dependency not met | Wait for dependency task |
| `E004` | Timeout | Increase timeout or investigate |
| `E005` | Validation failed | Fix issues and retry |

## Related Commands

- `/idumb:plan-phase` - Create plan first
- `/idumb:verify-work` - Verify completion
- `/idumb:debug` - Debug failures

## Governance

**Delegation Chain:**
```
user → supreme-coordinator → high-governance → executor
  ├─→ builder (file operations)
  ├─→ low-validator (validation)
  └─→ integration-checker (cross-phase)
```

**Validation Points:**
- Pre: Plan exists and valid
- During: Each task validated
- Post: Phase completion verified
- Post: Integration checked

## Metadata

```yaml
category: execution
priority: P0
complexity: high
version: 0.1.0
```
