# Resumed Session Example

Session resumption with conditional context injection based on idle duration.

## Scenario

User returns after 6 hours of idle time. Previous session was implementing authentication.

## Step 1: Session Detection

```yaml
session_metadata:
  session_id: "ses_xyz789"
  created_at: "2026-02-04T09:00:00Z"
  last_updated: "2026-02-04T10:30:00Z"
  current_time: "2026-02-04T16:45:00Z"

idle_calculation:
  hours_idle: 6.25
  threshold:
    resumed: "> 1 hour"
    stale: "> 48 hours"
  determination: "RESUMED SESSION (1-48 hour window)"

session_state:
  phase: "Phase 3 - Implementation"
  governance_level: "standard"
  delegation_depth: 0 (returned to root)
  previous_agent: "@idumb-high-governance"
```

## Step 2: Context Assessment

```yaml
state_from_file: ".idumb/brain/state.json"
  version: "0.1.0"
  phase: "Phase 3 - Implementation"
  lastValidation: "2026-02-04T10:30:00Z"
  validationCount: 14
  anchors: 5 total

active_anchors:
  critical:
    - "[CRITICAL] Must use JWT for session tokens"
    - "[CRITICAL] Password hashing required (bcrypt)"
  high:
    - "[HIGH] Session timeout: 24 hours"
    - "[HIGH] Auth system implementation in progress"

pending_todos:
  - "Complete session management (ses_xyz789-T3)"
  - "Add password reset flow (ses_xyz789-T4)"
  - "Write auth tests (ses_xyz789-T5)"

recent_history:
  - "10:30 - validation: Auth structure verified"
  - "10:25 - checkpoint: Pre-auth implementation"
  - "10:20 - delegation: high-governance → builder"
```

## Step 3: Resume Context Injection

```yaml
injection_type: "resumed_session"
injection_level: "root_session (level 1)"

injected_context:
  header: |
    📋 SESSION RESUMED

    ⏱️  Idle Duration: 6 hours
    📅 Previous Session: 2026-02-04 09:00
    🎯 Current Phase: Phase 3 - Implementation
    📌 Active Anchors: 4

    🔔 Key Context:
       • [CRITICAL] Must use JWT for session tokens
       • [CRITICAL] Password hashing required (bcrypt)
       • [HIGH] Session timeout: 24 hours
       • [HIGH] Auth system implementation in progress

    ⚡ Resuming workflow...

  current_context:
    phase: "Phase 3 - Implementation"
    last_action: "Auth system delegated to builder"
    next_actions:
      - "Verify builder completed auth implementation"
      - "Run auth integration tests"
      - "Complete session management"

  pending_work:
    todos_count: 3
    incomplete_tasks:
      - "Session management"
      - "Password reset flow"
      - "Auth tests"

  governance_reminder: |
    🔔 MINDFULNESS REMINDER
    Session was idle for 6 hours. Context may have shifted.
    Verify phase alignment before continuing.
```

## Step 4: Phase Verification

```yaml
phase_verification_required: true
verification_steps:
  1: "Check .planning/phases/03/ for updated context"
  2: "Verify auth implementation matches current requirements"
  3: "Confirm TODOs still valid"

verification_result:
  phase_file_exists: true
  phase_updated: "2026-02-04T08:00:00Z (before session)"
  auth_complete: "Partial - login/logout done, session pending"
  todos_valid: true

conclusion: "Continue with session management task"
```

## Step 5: Continuation Decision

```yaml
continuation_assessment:
  stale: false (6 hours < 48 hour threshold)
  requires_user_confirmation: false (under 48h)
  context_refresh: true (inject resume context)
  checkpoint_recommended: false (no risky operations pending)

action: "Continue with TODO list"
next_delegation:
  agent: "@idumb-high-governance"
  task: "Continue session management implementation"
  context_from_resume:
    - "Previous work: login/logout complete"
    - "Current task: session management"
    - "Next tasks: password reset, tests"
```

## Alternative: Long Idle (>48h)

```yaml
if_idle_hours: 72

detection: "STALE SESSION"
action_required: "User confirmation"

stale_context:
  header: |
    ⚠️ STALE SESSION DETECTED

    ⏱️  Idle Duration: 72 hours
    📅 Last Active: 2026-02-01
    🎯 Phase at Exit: Phase 3 - Implementation

    ⚠️ Context may be outdated. Verify before continuing.

  required_confirmation:
    - "Phase 3 still current?"
    - "Auth implementation still required?"
    - "Same approach (JWT) still valid?"

  user_options:
    - "Continue from checkpoint (resume session management)"
    - "Start fresh (archive stale session)"
    - "Review state first (no action yet)"

  if_continue:
    create_checkpoint: true
    refresh_state: true
    warn_risk: "Context may have shifted significantly"
```

## Key Mindfulness Elements

1. **Idle Detection**: Automatically detects session resumption
2. **Conditional Injection**: Different context for 6h vs 72h idle
3. **Phase Verification**: Confirms phase alignment before continuing
4. **TODO Preservation**: Maintains task context across sessions
5. **User Awareness**: Clear communication of session state

## Resumption Protocol Summary

```yaml
idle_1_to_48_hours:
  action: "Resume with context injection"
  inject: "Current phase + active anchors + pending TODOs"
  require: "Phase verification"
  user_confirm: false

idle_48_to_168_hours:
  action: "Warn user of staleness"
  inject: "Same as above + staleness warning"
  require: "User confirmation to continue"
  checkpoint: "Create before continuing"

idle_over_168_hours:
  action: "Critical staleness"
  inject: "Minimal + refresh recommendation"
  require: "Explicit user acknowledgment"
  suggest: "Archive and re-init if major changes"
```
