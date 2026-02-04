---
name: resume-project
description: "Restores project context after session break and routes to correct workflow"
type: workflow
version: 0.1.0
last_updated: 2026-02-03
---

# Resume Project Workflow

Handles context restoration when returning to a project after a session break. Loads state, validates freshness, and routes to the appropriate workflow based on where work left off.

## Entry Conditions

```yaml
entry_conditions:
  must_have:
    - exists: ".idumb/brain/state.json"
  should_have:
    - exists: ".planning/"
    - exists: ".idumb/execution/"
  triggered_by:
    - "Session start with existing .idumb/"
    - "/idumb:resume command"
    - "Prompt intercept detection"
```

## Workflow Steps

```yaml
workflow:
  name: resume-project
  interactive: true  # User confirms before continuing
  
  steps:
    1_load_state:
      action: "Load iDumb state"
      method: |
        STATE=$(cat .idumb/brain/state.json 2>/dev/null) || STATE="{}"
      output: saved_state
      fallback: |
        # State file corrupted or missing
        STATE='{"phase":"unknown","needsRecovery":true}'
        
    2_load_anchors:
      action: "Load context anchors"
      method: |
        ANCHORS=$(jq '.anchors // []' .idumb/brain/state.json 2>/dev/null) || ANCHORS="[]"
      output: context_anchors
      inject_to: "session context"
      
    3_check_freshness:
      action: "Validate context freshness"
      checks:
        - "lastValidation < 48 hours ago"
        - "state file modified < 7 days ago"
        - "No conflicting changes in .planning/"
      on_stale:
        action: "warn"
        message: "Context may be stale. Consider /idumb:validate"
        
    4_detect_progress:
      action: "Determine where work left off"
      logic: |
        if exists ".planning/phases/{N}/*VERIFICATION.md" with status=verified:
          RESUME_AT = "transition or next phase"
        elif exists ".planning/phases/{N}/*SUMMARY.md":
          RESUME_AT = "verify-phase"
        elif exists ".idumb/execution/{N}/progress.json":
          RESUME_AT = "execute-phase (resume)"
        elif exists ".planning/phases/{N}/*PLAN.md":
          RESUME_AT = "execute-phase (start)"
        elif exists ".planning/phases/{N}/*CONTEXT.md":
          RESUME_AT = "plan-phase"
        elif exists ".planning/ROADMAP.md":
          RESUME_AT = "discuss-phase"
        else:
          RESUME_AT = "new-project or roadmap"
      output: resume_point
      
    5_check_incomplete_tasks:
      action: "Check for incomplete execution"
      method: |
        PROGRESS=$(cat .idumb/execution/*/progress.json 2>/dev/null | jq -s 'add')
        INCOMPLETE=$(echo "$PROGRESS" | jq '[.tasks[] | select(.status != "complete")]')
      output: incomplete_tasks
      
    6_present_summary:
      action: "Show user where we left off"
      template: |
        ## Project Resume Summary
        
        **Project:** {project_name}
        **Current Phase:** {current_phase}
        **Status:** {phase_status}
        **Last Activity:** {last_activity_time}
        
        ### Context Anchors
        {for anchor in anchors}
        - [{anchor.type}] {anchor.content}
        {end}
        
        ### Incomplete Tasks
        {if incomplete_tasks}
        {for task in incomplete_tasks}
        - [ ] {task.id}: {task.title}
        {end}
        {else}
        No incomplete tasks.
        {end}
        
        ### Recommended Action
        {resume_recommendation}
        
        Continue? (Y/n)
        
    7_route_to_workflow:
      action: "Route based on resume point"
      routing:
        transition: "workflows/transition.md"
        verify-phase: "/idumb:verify-work {N}"
        execute-phase: "/idumb:execute-phase {N}"
        plan-phase: "/idumb:plan-phase {N}"
        discuss-phase: "/idumb:discuss-phase {N}"
        roadmap: "/idumb:roadmap"
        new-project: "/idumb:new-project"
        
    8_update_state:
      action: "Record session resume"
      updates:
        - "state.lastResume = {timestamp}"
        - "history += 'resume:from:{resume_point}'"
```

## Context Injection

```yaml
context_injection:
  description: |
    On resume, inject critical context into the LLM session
    so it understands project state without re-reading everything.
    
  inject:
    high_priority_anchors:
      filter: "priority in ['critical', 'high']"
      format: |
        ## Context Anchors (Preserved)
        {for anchor in filtered_anchors}
        - **{anchor.type}**: {anchor.content}
        {end}
        
    current_state:
      format: |
        ## Current State
        - Phase: {N} of {total}
        - Status: {phaseStatus}
        - Tasks: {completed}/{total} complete
        
    recent_history:
      last: 5
      format: |
        ## Recent Actions
        {for action in history.last(5)}
        - {action.timestamp}: {action.action} → {action.result}
        {end}
```

## Recovery Scenarios

```yaml
recovery:
  scenario_state_corrupted:
    detect: "state.json malformed or missing"
    action:
      - "Attempt to rebuild from .planning/ artifacts"
      - "Create minimal valid state"
      - "Warn user of data loss"
    method: |
      # Rebuild state from artifacts
      PHASE=$(ls -1 .planning/phases/ 2>/dev/null | tail -1)
      echo '{"phase":"'$PHASE'","recovered":true}' > .idumb/brain/state.json
      
  scenario_execution_interrupted:
    detect: "progress.json shows in_progress tasks"
    action:
      - "Offer to resume or restart execution"
      - "Check git state matches checkpoint"
    options:
      resume: "Continue from last checkpoint"
      restart: "Re-execute from beginning"
      skip: "Mark current task as blocked, continue"
      
  scenario_conflicting_changes:
    detect: ".planning/ files newer than last session"
    action:
      - "Warn about external modifications"
      - "Offer to re-sync state"
    message: |
      ⚠️ Planning files were modified outside iDumb.
      Run /idumb:validate to sync state.
```

## Output Artifacts

```yaml
artifacts:
  session_log:
    path: ".idumb/brain/sessions.log"
    format: "{timestamp}|resume|{resume_point}|{anchors_count}"
    
  recovery_report:
    condition: "recovery was needed"
    path: ".idumb/brain/recovery-{timestamp}.json"
    content:
      scenario: "{recovery_type}"
      actions_taken: ["list"]
      data_lost: ["list or 'none'"]
```

## Exit Conditions

```yaml
exit_conditions:
  success:
    - user_confirmed: true
    - routed_to: "{workflow}"
  cancelled:
    - user_declined: true
    - action: "Return to idle"
  recovery_needed:
    - state_corrupted: true
    - action: "Enter recovery flow"
```

## Chain Rules

```yaml
chains_to:
  # This workflow chains to whatever is appropriate based on state
  dynamic: true
  based_on: resume_point
  
  possible_chains:
    - "workflows/transition.md"
    - "/idumb:verify-work"
    - "/idumb:execute-phase"
    - "/idumb:plan-phase"
    - "/idumb:discuss-phase"
    - "/idumb:roadmap"
    - "/idumb:new-project"
```

## Integration Points

```yaml
integration:
  prompt_intercept:
    on_session_start: true
    detection: "exists('.idumb/brain/state.json')"
    action: "Trigger this workflow automatically"
  reads_from:
    - ".idumb/brain/state.json"
    - ".idumb/execution/*/progress.json"
    - ".planning/**/*.md"
  writes_to:
    - ".idumb/brain/state.json"
    - ".idumb/brain/sessions.log"
  never_modifies:
    - ".planning/*"
```

---
*Workflow: resume-project v0.1.0*
