# Valid Delegation Example

Proper coordinator → governance delegation showing mindfulness principles.

## Scenario

User requests: "Implement the authentication system for the project"

## Step 1: Coordinator Assessment

```yaml
agent: "@idumb-supreme-coordinator"
position: "Level 1 - Supreme Coordinator"
delegation_depth: 0
session_state: "Active (idle 15 minutes)"

position_assessment:
  state_read: ".idumb/brain/state.json"
  current_phase: "Phase 3 - Implementation"
  governance_level: "standard"
  active_anchors: 3 critical, 2 high
  context_window: "65% full - healthy"

target_validation:
  target: "@idumb-high-governance"
  relationship: "Valid child (one level below)"
  target_permissions: "task: allow, write: false"
  delegation_chain: "coordinator → governance → validator → builder ✓"
```

## Step 2: Structured Delegation

```yaml
agent: "@idumb-high-governance"
task: "Implement authentication system with login, logout, and session management"

context:
  phase: "Phase 3 - Implementation"
  state_snapshot:
    framework: "idumb"
    last_validation: "2026-02-04T10:30:00Z"
    validation_count: 12
  anchors:
    - "[CRITICAL] Must use JWT for session tokens"
    - "[CRITICAL] Password hashing required (bcrypt)"
    - "[HIGH] Session timeout: 24 hours"
  history:
    - "Phase 1: Planning completed"
    - "Phase 2: Design completed"

requirements:
  constraints:
    - "No external auth providers (use local only)"
    - "Must follow existing project structure"
    - "Cannot modify existing user schema"
  permissions:
    allowed_tools:
      - "idumb-state read/write"
      - "grep, glob, read"
      - "delegate to idumb-builder"
    forbidden_tools:
      - "Direct file writes (must delegate to builder)"
  deliverable:
    format: "synthesis with validation results and execution summary"
    acceptance_criteria:
      - "Login endpoint functional"
      - "Logout endpoint functional"
      - "Session management implemented"
      - "All validations pass"

tracking:
  delegation_id: "coord-auth-20260204-001"
  parent_session: "ses_abc123"
  timeout: "30 minutes"
  checkpoint_before: true
```

## Step 3: Governance Receives and Processes

```yaml
agent: "@idumb-high-governance"
position: "Level 2 - High Governance"
delegation_depth: 1

assessment:
  delegation_understood: true
  phase_aligned: true
  anchors_reviewed: 3 critical, 2 high
  constraints_clear: true

sub_delegations:
  - agent: "@idumb-low-validator"
    task: "Verify existing auth-related files and identify integration points"
    delegation_id: "gov-auth-validate-001"

  - agent: "@idumb-builder"
    task: "Implement auth endpoints and session management"
    delegation_id: "gov-auth-build-001"
    depends_on: "gov-auth-validate-001"
```

## Step 4: Validator Returns

```yaml
agent: "@idumb-low-validator"
return:
  status: "pass"
  delegation_id: "gov-auth-validate-001"

validation:
  check: "Existing auth infrastructure"
  evidence:
    - "Found: src/auth/index.ts (auth utilities)"
    - "Found: src/middleware/auth.ts (auth middleware)"
    - "Found: src/types/user.ts (user types)"
  files_examined: 12
  integration_points:
    - "Can extend src/auth/index.ts"
    - "Middleware pattern already established"
    - "User schema compatible with requirements"
```

## Step 5: Builder Executes

```yaml
agent: "@idumb-builder"
return:
  status: "success"
  delegation_id: "gov-auth-build-001"

execution:
  action: "Implemented authentication system"
  files:
    modified:
      - "src/auth/index.ts (added login/logout functions)"
      - "src/middleware/auth.ts (added session validation)"
    created:
      - "src/auth/session.ts (session management)"
      - "src/auth/jwt.ts (JWT utilities)"
    deleted: []
  changes:
    - "Login POST /api/auth/login"
    - "Logout POST /api/auth/logout"
    - "Session middleware for protected routes"
  verification:
    - "Run tests: npm test auth"
    - "Check endpoints: POST /api/auth/login, /api/auth/logout"
    - "Verify JWT tokens expire in 24h"
```

## Step 6: Governance Synthesizes

```yaml
agent: "@idumb-high-governance"
return:
  status: "pass"
  delegation_id: "coord-auth-20260204-001"

synthesis:
  delegations_made: 2
  results_from:
    validator: "Integration points identified, no conflicts"
    builder: "Auth system implemented successfully"
  overall_status: "pass"
  recommended_next:
    - "Run integration tests"
    - "Update phase 3 TODO list"
    - "Anchor: Authentication system complete"
  new_anchors:
    - type: "checkpoint"
      content: "Authentication system implemented (login, logout, sessions)"
      priority: "high"
```

## Key Mindfulness Elements

1. **Position Awareness**: Coordinator knows it's Level 1, delegates to Level 2
2. **Context Injection**: Phase, anchors, and state provided to alls
3. **Tracking**: All delegations have IDs for traceability
4. **Acceptance Criteria**: Clear validation requirements before building
5. **Return Path**: Each level returns appropriate format for its parent
