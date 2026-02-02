---
name: execute-phase
description: "Executes plan tasks through builder agent with validation checkpoints"
type: workflow
version: 0.1.0
last_updated: 2026-02-03
---

# Execute Phase Workflow

Orchestrates task execution through the builder agent, tracks progress, maintains checkpoints, and handles deviations from the plan.

## Entry Conditions

```yaml
entry_conditions:
  must_have:
    - exists: ".planning/phases/{N}/*PLAN.md"
    - state: "initialized = true"
  should_have:
    - state: "phaseStatus in ['planned', 'executing']"
    - validation: "plan is checked (validation_score > 0)"
  blocked_when:
    - condition: "!exists('.planning/phases/{N}/*PLAN.md')"
      redirect: "/idumb:plan-phase {N}"
      message: "No plan exists. Create plan first."
```

## Workflow Steps

```yaml
workflow:
  name: execute-phase
  interactive: true  # User may intervene
  checkpoint_enabled: true
  
  steps:
    1_load_plan:
      action: "Parse plan into task list"
      method: |
        PLAN=$(cat .planning/phases/{N}/*PLAN.md 2>/dev/null) || exit 1
        TASKS=$(parse_yaml_tasks "$PLAN")
      output: task_list
      
    2_load_progress:
      action: "Check for existing progress"
      method: |
        PROGRESS=$(cat .idumb/execution/{N}/progress.json 2>/dev/null) || PROGRESS="{}"
      output: progress_state
      allows_resume: true
      
    3_sort_tasks:
      action: "Topological sort by dependencies"
      input: task_list
      output: execution_order
      on_cycle:
        action: "fail"
        message: "Circular dependency detected in plan"
        
    4_execute_loop:
      action: "Execute tasks in order"
      for_each: task in execution_order
      steps:
        4a_check_skip:
          condition: "task.id in progress_state.completed"
          action: "skip"
          
        4b_check_deps:
          condition: "all task.depends_on in progress_state.completed"
          on_fail: "queue for later"
          
        4c_delegate:
          agent: "idumb-builder"
          task: |
            Execute task: {task.id}
            Description: {task.description}
            Acceptance: {task.acceptance}
            Constraints: Follow project patterns
          timeout: "{task.estimate * 2}"
          
        4d_validate_task:
          agent: "idumb-low-validator"
          task: "Verify task {task.id} meets acceptance criteria"
          on_pass: "Mark complete, continue"
          on_fail: "Retry up to 3x, then escalate"
          
        4e_checkpoint:
          action: "Save progress"
          writes:
            - ".idumb/execution/{N}/progress.json"
            - ".idumb/execution/{N}/checkpoint-{task.id}.json"
            
    5_generate_summary:
      action: "Create execution summary"
      template: "templates/summary.md"
      output: ".planning/phases/{N}/*SUMMARY.md"
      
    6_update_state:
      action: "Update iDumb state"
      updates:
        - "state.phaseStatus = 'executed'"
        - "history += 'execute-phase:{N}:complete'"
```

## Checkpoint System

```yaml
checkpoints:
  enabled: true
  frequency: "after each task"
  storage: ".idumb/execution/{N}/"
  
  checkpoint_schema:
    id: "checkpoint-{task-id}"
    timestamp: "{iso-timestamp}"
    task_id: "{task.id}"
    status: "completed|failed|partial"
    git_hash: "{current commit}"
    files_modified: ["list of files"]
    validation_result: "pass|fail"
    
  resume_protocol:
    1. "Load latest checkpoint"
    2. "Verify git hash matches (or warn)"
    3. "Restore task queue from progress.json"
    4. "Continue from first incomplete task"
    
  rollback_protocol:
    trigger: "3 consecutive failures OR user request"
    actions:
      - "Save current state"
      - "Offer rollback to last good checkpoint"
      - "If accepted, restore git state and progress"
```

## Deviation Handling

```yaml
deviations:
  on_task_failure:
    attempts: 3
    escalation:
      - "Retry with modified approach"
      - "Retry with user guidance"
      - "Skip task (mark blocked)"
      - "Halt execution"
      
  on_unexpected_change:
    detection: "File modified not in task scope"
    actions:
      - "Log deviation"
      - "Ask user: accept or revert?"
      
  on_dependency_fail:
    action: "Queue dependent tasks as blocked"
    continue: "Execute independent tasks"
    
  on_plan_obsolete:
    trigger: "User says plan no longer valid"
    action: "Pause, offer re-planning"
```

## Output Artifact

```yaml
artifact:
  name: "{phase-name}-SUMMARY.md"
  path: ".planning/phases/{N}/"
  template: "templates/summary.md"
  frontmatter:
    type: summary
    phase: "{N}"
    status: executed
    created: "{timestamp}"
    tasks_completed: "{count}"
    tasks_failed: "{count}"
    tasks_skipped: "{count}"
  sections:
    - overview: "Execution summary"
    - completed_tasks: "List with links to outputs"
    - failed_tasks: "List with failure reasons"
    - deviations: "Changes from original plan"
    - files_modified: "All files touched"
    - next_steps: "Recommendations"
```

## Exit Conditions

```yaml
exit_conditions:
  success:
    - all_tasks: "completed or intentionally skipped"
    - artifact_created: ".planning/phases/{N}/*SUMMARY.md"
    - state_updated: "phaseStatus = 'executed'"
  partial:
    - some_tasks_failed: true
    - user_choice: "Continue anyway or halt"
  failure:
    - critical_task_failed: true
    - max_retries_exceeded: true
    - user_halted: true
```

## Chain Rules

```yaml
chains_to:
  on_success:
    command: "/idumb:verify-work {N}"
    message: "Execution complete. Verify results?"
    auto: true  # Auto-proceed to verification
    
  on_partial:
    options:
      - verify: "Proceed to verification with partial completion"
      - continue: "Resume execution"
      - debug: "Launch debugger"
      
  on_failure:
    command: "/idumb:debug"
    auto: false
```

## Integration Points

```yaml
integration:
  gsd_equivalent: "/gsd:execute-plan"
  reads_from:
    - ".planning/phases/{N}/*PLAN.md"
    - ".idumb/execution/{N}/progress.json"
  writes_to:
    - ".planning/phases/{N}/*SUMMARY.md"
    - ".idumb/execution/{N}/"
    - ".idumb/brain/state.json"
  git_interaction:
    - "Read current hash for checkpoints"
    - "NO direct commits (user responsibility)"
```

---
*Workflow: execute-phase v0.1.0*
