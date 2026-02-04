---
name: transition
id: wf-transition
parent: workflows
description: "Handles phase completion and transition to next phase"
type: workflow
version: 0.1.0
last_updated: 2026-02-03
---

# Phase Transition Workflow

Internal workflow that handles the transition between phases after verification. Updates roadmap status, archives current phase, and prepares for next phase.

## Entry Conditions

```yaml
entry_conditions:
  must_have:
    - exists: ".planning/phases/{N}/*VERIFICATION.md"
    - state: "phaseStatus = 'verified'"
  should_have:
    - verification_passed: true
  internal_only: true  # Not called directly by user
```

## Workflow Steps

```yaml
workflow:
  name: transition
  interactive: false
  internal: true  # Called by verify-phase on success
  
  steps:
    1_validate_completion:
      action: "Double-check phase is truly complete"
      checks:
        - "VERIFICATION.md exists and pass_rate >= 80%"
        - "No BLOCKED status on critical items"
        - "User has not marked phase as incomplete"
      on_fail: "Abort transition, return to verify-phase"
      
    2_archive_phase:
      action: "Archive phase artifacts"
      method: |
        mkdir -p .idumb/idumb-brain/archive/phases/{N}
        cp .planning/phases/{N}/*.md .idumb/idumb-brain/archive/phases/{N}/ 2>/dev/null || true
        cp .idumb/idumb-brain/execution/{N}/*.json .idumb/idumb-brain/archive/phases/{N}/ 2>/dev/null || true
      purpose: "Preserve execution history"
      
    3_update_roadmap_status:
      action: "Update roadmap phase status"
      method: |
        # Note: We don't modify .planning/ROADMAP.md directly
        # Instead, we update our shadow tracking
        UPDATE_FILE=".idumb/idumb-brain/roadmap-status.json"
      updates:
        phase_{N}:
          status: "complete"
          completed_at: "{timestamp}"
          verification_link: ".planning/phases/{N}/*VERIFICATION.md"
          
    4_identify_next:
      action: "Determine next phase"
      method: |
        NEXT_PHASE=$((N + 1))
        TOTAL_PHASES=$(grep -c "^## Phase" .planning/ROADMAP.md 2>/dev/null) || TOTAL_PHASES=1
      output: next_phase_info
      
    5_check_milestone:
      action: "Check if milestone complete"
      condition: "NEXT_PHASE > TOTAL_PHASES or phase is last in milestone"
      if_true:
        - "Trigger milestone completion"
        - "Create milestone summary"
        - "Notify user of milestone achievement"
      if_false:
        - "Continue to next phase"
        
    6_prepare_next:
      action: "Prepare next phase context"
      creates:
        - ".idumb/idumb-brain/phase-{N+1}-prep.json"
      content:
        previous_phase: "{N}"
        learnings: "Extracted from VERIFICATION.md"
        carry_forward: "Open questions, risks that apply"
        
    7_update_state:
      action: "Update iDumb state"
      updates:
        - "state.currentPhase = {N+1} or 'complete'"
        - "state.phaseStatus = 'not_started'"
        - "state.completedPhases += {N}"
        - "history += 'transition:{N}->:{N+1}'"
        
    8_notify_user:
      action: "Present transition summary"
      message: |
        ✅ Phase {N} Complete
        
        Completed: {tasks_completed} tasks
        Pass rate: {pass_rate}%
        
        Next: Phase {N+1} - {next_phase_name}
        
        Ready to discuss Phase {N+1}? Run /idumb:discuss-phase {N+1}
```

## Milestone Completion

```yaml
milestone_completion:
  trigger: "Last phase in milestone verified"
  
  steps:
    1_create_summary:
      template: "templates/milestone-summary.md"
      output: ".planning/milestones/{milestone}/SUMMARY.md"
      
    2_archive:
      action: "Archive entire milestone"
      destination: ".idumb/idumb-brain/archive/milestones/{milestone}/"
      
    3_planning_sync:
      action: "Sync state with .planning if present"
      method: |
        if [ -f ".planning/STATE.md" ]; then
          # Planning integration detected, sync state
          echo "Milestone {milestone} complete" >> .idumb/planning-sync.log
        fi
        
    4_update_state:
      updates:
        - "state.currentMilestone = {next} or 'complete'"
        - "state.completedMilestones += {milestone}"
```

## Output Artifacts

```yaml
artifacts:
  roadmap_status:
    path: ".idumb/idumb-brain/roadmap-status.json"
    schema:
      phases:
        "{N}":
          status: "complete|in_progress|not_started"
          started_at: "timestamp"
          completed_at: "timestamp"
          tasks_completed: "count"
          pass_rate: "percentage"
          
  phase_archive:
    path: ".idumb/idumb-brain/archive/phases/{N}/"
    contains:
      - "All phase markdown files"
      - "All execution checkpoints"
      - "Final state snapshot"
      
  transition_log:
    path: ".idumb/idumb-brain/transitions.log"
    format: "{timestamp}|{from_phase}|{to_phase}|{status}"
```

## Exit Conditions

```yaml
exit_conditions:
  success:
    - state_updated: true
    - archive_created: true
    - next_phase_prepared: true
  partial:
    - milestone_complete: true
    - project_complete: false
  complete:
    - all_phases: "verified"
    - all_milestones: "complete"
```

## Chain Rules

```yaml
chains_to:
  next_phase:
    condition: "NEXT_PHASE <= TOTAL_PHASES"
    action: "Prompt user for /idumb:discuss-phase {N+1}"
    auto: false  # Always ask user
    
  milestone_complete:
    condition: "Last phase in milestone"
    action: "Create milestone summary, continue"
    
  project_complete:
    condition: "All milestones complete"
    action: |
      Create project completion summary
      Archive entire project
      Celebrate with user 🎉
```

## Integration Points

```yaml
integration:
  reads_from:
    - ".planning/phases/{N}/*VERIFICATION.md"
    - ".planning/ROADMAP.md"
    - ".idumb/idumb-brain/state.json"
  writes_to:
    - ".idumb/idumb-brain/roadmap-status.json"
    - ".idumb/idumb-brain/archive/"
    - ".idumb/idumb-brain/state.json"
  never_modifies:
    - ".planning/ROADMAP.md"  # Planning owns this
    - ".planning/phases/{N}/*.md"  # Archived, not modified
```

---
*Workflow: transition v0.1.0*
