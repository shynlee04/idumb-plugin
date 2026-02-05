---
type: plan
id: "{PLAN_ID}"
version: "0.1.0-draft"
status: draft | validated | approved | locked
phase: "{PHASE_NUMBER}"
phase_name: "{PHASE_NAME}"
created: "{ISO_TIMESTAMP}"
spec_ref: "{SPEC_ID}"
research_ref: "{RESEARCH_ID}"
validated_by: "@idumb-plan-checker"
validation_score: 0
estimated_duration: "0h"
task_count: 0
checkpoint_count: 0
---

# Plan: {PHASE_NAME}

## 0. Plan Metadata

### 0.1 Document Lineage
```yaml
lineage:
  spec: "{SPEC_ID}"
  research: "{RESEARCH_ID}"
  idea: "{IDEA_ID}"
  previous_plans: []
```

### 0.2 Phase Context
```yaml
phase:
  number: {N}
  name: "{PHASE_NAME}"
  goal: "{PHASE_GOAL}"
  success_criteria: "{SUCCESS_CRITERIA}"
  
from_roadmap:
  phase_section: "{ROADMAP_SECTION_REF}"
  depends_on_phases: []
  blocks_phases: []
```

---

## 1. Overview

### 1.1 Phase Goal
{PHASE_GOAL_DESCRIPTION}

### 1.2 Scope from Spec
**Requirements in scope:**
| Req ID | Title | Priority |
|--------|-------|----------|
| FR-001 | {TITLE} | must-have |
| FR-002 | {TITLE} | should-have |

**Out of scope for this phase:**
- {EXCLUDED_1}
- {EXCLUDED_2}

### 1.3 Success Criteria
- [ ] {SUCCESS_CRITERION_1}
- [ ] {SUCCESS_CRITERION_2}
- [ ] {SUCCESS_CRITERION_3}

---

## 2. Tasks

### Task: T{N}-01
```yaml
id: T{N}-01
title: "{TASK_TITLE}"
description: |
  {DETAILED_DESCRIPTION}

# Traceability
requirement_ref: FR-001
spec_section: "4.2.{COMPONENT}"
acceptance_criteria_ref: [AC-001]

# Execution
assigned_to: "@idumb-builder"
estimated_hours: 1.5
actual_hours: null
priority: critical | high | medium | low

# Dependencies
depends_on: []
blocks: [T{N}-02, T{N}-03]
parallelizable_with: []

# Files
files_to_create:
  - path: "{FILE_PATH}"
    template: "{TEMPLATE_REF}"
files_to_modify:
  - path: "{FILE_PATH}"
    changes: "{CHANGE_DESCRIPTION}"
files_to_delete: []

# Acceptance
acceptance:
  - criterion: "{CRITERION}"
    verification: "{HOW_TO_VERIFY}"
    automated: true | false
    test_id: "TC-001"

# Risk
risk_level: low | medium | high
risk_ref: null | "TR1"
mitigation_in_task: "{MITIGATION_STEPS}"

# Completion
status: pending | in_progress | complete | blocked | skipped
completion_notes: ""
completed_at: null
```

### Task: T{N}-02
```yaml
id: T{N}-02
title: "{TASK_TITLE}"
description: |
  {DETAILED_DESCRIPTION}

requirement_ref: FR-001
spec_section: "4.2.{COMPONENT}"
acceptance_criteria_ref: [AC-001, AC-002]

assigned_to: "@idumb-builder"
estimated_hours: 2.0
priority: high

depends_on: [T{N}-01]
blocks: [T{N}-04]
parallelizable_with: [T{N}-03]

files_to_create:
  - path: "{FILE_PATH}"
files_to_modify: []

acceptance:
  - criterion: "{CRITERION}"
    verification: "{HOW_TO_VERIFY}"
    automated: true

risk_level: low
status: pending
```

### Task: T{N}-03
```yaml
id: T{N}-03
title: "{TASK_TITLE}"
description: |
  {DETAILED_DESCRIPTION}

requirement_ref: FR-002
spec_section: "4.3.{COMPONENT}"
acceptance_criteria_ref: [AC-003]

assigned_to: "@idumb-builder"
estimated_hours: 1.0
priority: medium

depends_on: [T{N}-01]
blocks: [T{N}-04]
parallelizable_with: [T{N}-02]

files_to_create: []
files_to_modify:
  - path: "{FILE_PATH}"
    changes: "{CHANGE_DESCRIPTION}"

acceptance:
  - criterion: "{CRITERION}"
    verification: "{HOW_TO_VERIFY}"
    automated: false

risk_level: low
status: pending
```

### Task: T{N}-04
```yaml
id: T{N}-04
title: "{TASK_TITLE}"
description: |
  {DETAILED_DESCRIPTION}

requirement_ref: [FR-001, FR-002]
spec_section: "5.1"
acceptance_criteria_ref: [AC-001, AC-002, AC-003]

assigned_to: "@idumb-builder"
estimated_hours: 1.5
priority: high

depends_on: [T{N}-02, T{N}-03]
blocks: []
parallelizable_with: []

files_to_create: []
files_to_modify:
  - path: "{FILE_PATH}"
    changes: "Integration"

acceptance:
  - criterion: "All components integrate correctly"
    verification: "Integration tests pass"
    automated: true
    test_id: "TC-INT-001"

risk_level: medium
risk_ref: "TR1"
mitigation_in_task: "{MITIGATION_STEPS}"
status: pending
```

---

## 3. Dependencies

### 3.1 Dependency Graph
```mermaid
graph TD
    T1[T{N}-01: {SHORT_TITLE}]
    T2[T{N}-02: {SHORT_TITLE}]
    T3[T{N}-03: {SHORT_TITLE}]
    T4[T{N}-04: {SHORT_TITLE}]
    
    T1 --> T2
    T1 --> T3
    T2 --> T4
    T3 --> T4
    
    style T1 fill:#f9f,stroke:#333
    style T4 fill:#bbf,stroke:#333
```

### 3.2 Critical Path
```yaml
critical_path:
  path: [T{N}-01, T{N}-02, T{N}-04]
  total_duration: "5h"
  bottleneck: "T{N}-02"
  
parallel_opportunities:
  - tasks: [T{N}-02, T{N}-03]
    condition: "Both can start after T{N}-01"
    time_savings: "1h"
```

### 3.3 Dependency Validation
```yaml
dependency_check:
  circular_dependencies: false
  orphan_tasks: []
  unreachable_tasks: []
  validation_status: pass
```

---

## 4. Estimates

### 4.1 Task Estimates
| Task ID | Title | Estimate | Buffer | Total | Confidence |
|---------|-------|----------|--------|-------|------------|
| T{N}-01 | {TITLE} | 1.5h | 0.3h | 1.8h | high |
| T{N}-02 | {TITLE} | 2.0h | 0.4h | 2.4h | medium |
| T{N}-03 | {TITLE} | 1.0h | 0.2h | 1.2h | high |
| T{N}-04 | {TITLE} | 1.5h | 0.5h | 2.0h | medium |

### 4.2 Summary
```yaml
estimates:
  total_estimated: "6.0h"
  total_buffer: "1.4h"
  total_with_buffer: "7.4h"
  
  breakdown_by_priority:
    critical: "1.5h"
    high: "3.5h"
    medium: "1.0h"
    low: "0h"
    
  breakdown_by_risk:
    high_risk_tasks: "1.5h"
    medium_risk_tasks: "2.0h"
    low_risk_tasks: "2.5h"
    
  context_budget_check:
    estimated_context_usage: "40%"
    threshold: "50%"
    status: pass | warn
```

### 4.3 Phase Limit Check
```yaml
phase_limit:
  max_duration: "8h"
  estimated_duration: "7.4h"
  margin: "0.6h"
  status: pass | warn | fail
  
  if_over_limit:
    action: "split_phase"
    tasks_to_defer: []
```

---

## 5. Risk-Task Mapping

### 5.1 Risks from Research/Spec
| Risk ID | Risk | Affected Tasks | Mitigation in Plan |
|---------|------|----------------|-------------------|
| TR1 | {RISK_1} | T{N}-04 | {MITIGATION} |
| DR1 | {RISK_2} | T{N}-02 | {MITIGATION} |

### 5.2 Task-Level Risks
| Task | Risk Level | Specific Risk | Mitigation |
|------|------------|---------------|------------|
| T{N}-01 | low | - | - |
| T{N}-02 | medium | Unfamiliar API | Research completed, examples ready |
| T{N}-04 | medium | Integration complexity | Checkpoint before, incremental approach |

### 5.3 Contingency Tasks
```yaml
contingency_tasks:
  - trigger: "T{N}-02 fails API integration"
    contingency_task:
      id: T{N}-02-ALT
      title: "Alternative API approach"
      estimated_hours: 3.0
      description: "{ALTERNATIVE_APPROACH}"
```

---

## 6. Checkpoints

### 6.1 Checkpoint Schedule
| Checkpoint | After Task | Validation | Rollback Point |
|------------|------------|------------|----------------|
| CP-01 | T{N}-01 | Core setup valid | Pre-execution |
| CP-02 | T{N}-02 | Component A works | CP-01 |
| CP-03 | T{N}-04 | Integration complete | CP-02 |

### 6.2 Checkpoint Definitions

#### CP-01: Post-Setup Checkpoint
```yaml
id: CP-01
after_task: T{N}-01
name: "Core Setup Validation"

validations:
  - check: "Directory structure created"
    command: "test -d {PATH}"
    expected: true
    
  - check: "Dependencies installed"
    command: "npm list {PACKAGE}"
    expected: "0 exit code"
    
  - check: "Base configuration valid"
    command: "npm run validate-config"
    expected: "0 exit code"

on_success:
  action: "Continue to T{N}-02"
  snapshot: true
  
on_failure:
  action: "Rollback to pre-execution"
  notify: true
  debug_route: "@idumb-debugger"
```

#### CP-02: Component Checkpoint
```yaml
id: CP-02
after_task: T{N}-02
name: "Component A Validation"

validations:
  - check: "Component renders"
    test_id: "TC-001"
    expected: pass
    
  - check: "No TypeScript errors"
    command: "npm run typecheck"
    expected: "0 exit code"
    
  - check: "Unit tests pass"
    command: "npm test -- --grep 'ComponentA'"
    expected: "0 exit code"

on_success:
  action: "Continue to T{N}-03 or T{N}-04"
  snapshot: true
  
on_failure:
  action: "Fix and retry (max 3)"
  rollback_to: "CP-01"
```

#### CP-03: Integration Checkpoint
```yaml
id: CP-03
after_task: T{N}-04
name: "Integration Validation"

validations:
  - check: "All components integrate"
    test_id: "TC-INT-001"
    expected: pass
    
  - check: "No regressions"
    command: "npm test"
    expected: "0 exit code"
    
  - check: "E2E flow works"
    test_id: "TC-E2E-001"
    expected: pass

on_success:
  action: "Proceed to verification (Stage 6)"
  snapshot: true
  commit: true
  
on_failure:
  action: "Debug integration"
  rollback_to: "CP-02"
  escalate_to: "@idumb-debugger"
```

---

## 7. Acceptance Mapping

### 7.1 Requirements to Tasks
| Requirement | Tasks | Coverage |
|-------------|-------|----------|
| FR-001 | T{N}-01, T{N}-02, T{N}-04 | Full |
| FR-002 | T{N}-03, T{N}-04 | Full |

### 7.2 Acceptance Criteria to Tasks
| AC ID | Task | Test ID | Automated |
|-------|------|---------|-----------|
| AC-001 | T{N}-02 | TC-001 | ✓ |
| AC-002 | T{N}-04 | TC-002 | ✓ |
| AC-003 | T{N}-03 | TC-003 | |

### 7.3 Coverage Validation
```yaml
coverage:
  requirements_covered: 2
  requirements_total: 2
  coverage_percentage: 100
  
  acceptance_criteria_covered: 3
  acceptance_criteria_total: 3
  coverage_percentage: 100
  
  status: pass
  gaps: []
```

---

## 8. Execution Order

### 8.1 Recommended Sequence
```yaml
execution_sequence:
  - batch: 1
    tasks: [T{N}-01]
    parallel: false
    checkpoint_after: CP-01
    
  - batch: 2
    tasks: [T{N}-02, T{N}-03]
    parallel: true
    checkpoint_after: CP-02
    
  - batch: 3
    tasks: [T{N}-04]
    parallel: false
    checkpoint_after: CP-03
```

### 8.2 Execution Timeline
```
Time  | Task           | Status
------+----------------+--------
0:00  | T{N}-01 start  | 
1:30  | T{N}-01 done   | CP-01
1:30  | T{N}-02 start  | (parallel)
1:30  | T{N}-03 start  | (parallel)
2:30  | T{N}-03 done   |
3:30  | T{N}-02 done   | CP-02
3:30  | T{N}-04 start  |
5:00  | T{N}-04 done   | CP-03
------+----------------+--------
Total: 5:00 (with parallel execution)
```

---

## 9. Plan Validation

### 9.1 Structural Validation
```yaml
structural_check:
  all_tasks_have_ids: true
  ids_follow_format: true  # T{N}-{seq}
  all_tasks_have_estimates: true
  all_tasks_have_acceptance: true
  all_tasks_assigned: true
  
  status: pass
```

### 9.2 Dependency Validation
```yaml
dependency_check:
  no_circular_deps: true
  all_deps_reference_valid_tasks: true
  no_orphan_tasks: true
  graph_is_dag: true
  
  status: pass
```

### 9.3 Estimate Validation
```yaml
estimate_check:
  no_task_exceeds_2h: true
  total_within_phase_limit: true
  buffer_applied: true
  high_risk_tasks_have_extra_buffer: true
  
  status: pass
```

### 9.4 Coverage Validation
```yaml
coverage_check:
  all_requirements_have_tasks: true
  all_acceptance_criteria_mapped: true
  all_risks_have_mitigations: true
  
  status: pass
```

### 9.5 Context Budget Validation
```yaml
context_budget:
  estimated_usage: "40%"
  threshold: "50%"
  checkpoint_frequency: "adequate"
  
  status: pass
```

### 9.6 Overall Validation Result
```yaml
plan_validation:
  validator: "@idumb-plan-checker"
  timestamp: "{TIMESTAMP}"
  
  checks:
    structural: pass
    dependencies: pass
    estimates: pass
    coverage: pass
    context_budget: pass
    
  overall_score: 95
  status: pass | warn | fail
  
  warnings: []
  blockers: []
  
  recommendation: "Ready for execution"
```

---

## 10. Approval

### 10.1 Plan Summary
**Phase:** {PHASE_NAME}
**Tasks:** {TASK_COUNT}
**Estimated duration:** {DURATION} (with buffer)
**Checkpoints:** {CHECKPOINT_COUNT}
**Risk level:** low | medium | high

**Key tasks:**
1. T{N}-01: {TITLE}
2. T{N}-02: {TITLE}
3. T{N}-04: {TITLE}

**Critical path:** T{N}-01 → T{N}-02 → T{N}-04

### 10.2 Approval Gate
```yaml
approval:
  requested: "{TIMESTAMP}"
  status: pending | approved | rejected | changes_requested
  
  options:
    - execute: "Proceed to execution"
    - modify: "Request changes to plan"
    - defer: "Save plan for later"
    
  approver_response:
    decision: null
    timestamp: null
    notes: ""
    
  if_approved:
    locked_version: "1.0.0"
    proceed_to: "5.1 Pre-Execution Validation"
```

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1.0-draft | {DATE} | Initial creation | @idumb-planner |

---

*Template: PLAN v1.0.0*
*Stage: 4 - Planning*
*Output of: 4.8 Plan Synthesis*
