---
type: verification
id: "{VERIFICATION_ID}"
phase: "{PHASE_NUMBER}"
phase_name: "{PHASE_NAME}"
status: in-progress | complete | failed
created: "{ISO_TIMESTAMP}"
plan_ref: "{PLAN_ID}"
spec_ref: "{SPEC_ID}"
verifier: "@idumb-verifier"
overall_result: pending | pass | partial | fail
---

# Verification: {PHASE_NAME}

## 0. Verification Metadata

### 0.1 Document Lineage
```yaml
lineage:
  plan: "{PLAN_ID}"
  spec: "{SPEC_ID}"
  research: "{RESEARCH_ID}"
  execution_summary: "{EXECUTION_SUMMARY_PATH}"
```

### 0.2 Verification Scope
```yaml
scope:
  requirements_to_verify: [FR-001, FR-002, NFR-001]
  acceptance_criteria_to_test: [AC-001, AC-002, AC-003, AC-NFR-001]
  tasks_completed: [T{N}-01, T{N}-02, T{N}-03, T{N}-04]
  
verification_depth: standard | comprehensive | minimal
```

---

## 1. Execution Completeness

### 1.1 Task Completion Status
| Task ID | Title | Status | Completion Date | Notes |
|---------|-------|--------|-----------------|-------|
| T{N}-01 | {TITLE} | complete | {DATE} | |
| T{N}-02 | {TITLE} | complete | {DATE} | |
| T{N}-03 | {TITLE} | complete | {DATE} | |
| T{N}-04 | {TITLE} | complete | {DATE} | |

### 1.2 Checkpoint Status
| Checkpoint | Status | Validation Result | Timestamp |
|------------|--------|-------------------|-----------|
| CP-01 | passed | All checks green | {TIMESTAMP} |
| CP-02 | passed | All checks green | {TIMESTAMP} |
| CP-03 | passed | All checks green | {TIMESTAMP} |

### 1.3 Execution Completeness Gate
```yaml
completeness_check:
  tasks_total: 4
  tasks_completed: 4
  tasks_skipped: 0
  tasks_blocked: 0
  
  checkpoints_total: 3
  checkpoints_passed: 3
  checkpoints_failed: 0
  
  deviations_resolved: true
  drift_detected: false
  
  status: pass | fail
```

---

## 2. Spec Compliance

### 2.1 Requirements Verification

#### FR-001: {REQUIREMENT_TITLE}
```yaml
requirement_id: FR-001
status: verified | partial | failed | not_tested

implementation:
  files_created:
    - path: "{FILE_PATH}"
      exists: true
      content_valid: true
  files_modified:
    - path: "{FILE_PATH}"
      changes_applied: true
      
spec_match:
  component_exists: true
  component_matches_spec: true
  interfaces_match: true
  
evidence:
  - type: test_result
    test_id: TC-001
    result: pass
    output: "{TEST_OUTPUT}"
  - type: code_review
    file: "{FILE_PATH}"
    finding: "Matches spec section 4.2"
    
notes: ""
```

#### FR-002: {REQUIREMENT_TITLE}
```yaml
requirement_id: FR-002
status: verified | partial | failed | not_tested

implementation:
  files_modified:
    - path: "{FILE_PATH}"
      changes_applied: true
      
spec_match:
  component_exists: true
  component_matches_spec: true
  
evidence:
  - type: test_result
    test_id: TC-002
    result: pass
    
notes: ""
```

#### NFR-001: {REQUIREMENT_TITLE}
```yaml
requirement_id: NFR-001
category: performance | security | accessibility
status: verified | partial | failed | not_tested

metrics:
  - metric: "{METRIC_NAME}"
    target: "{TARGET}"
    actual: "{ACTUAL}"
    pass: true | false
    
evidence:
  - type: performance_test
    tool: "{TOOL}"
    result: "{RESULT}"
    
notes: ""
```

### 2.2 Requirement Compliance Matrix
| Req ID | Priority | Status | Evidence Count | Confidence |
|--------|----------|--------|----------------|------------|
| FR-001 | must-have | verified | 2 | high |
| FR-002 | should-have | verified | 1 | high |
| NFR-001 | must-have | verified | 1 | medium |

### 2.3 Spec Compliance Gate
```yaml
spec_compliance:
  requirements_verified: 3
  requirements_total: 3
  compliance_percentage: 100
  
  must_have_compliance: 100
  should_have_compliance: 100
  
  status: pass | partial | fail
  
  gaps:
    - requirement: null
      gap: null
      action: null
```

---

## 3. Acceptance Testing

### 3.1 Acceptance Criteria Results

#### AC-001: {CRITERION_TITLE}
```yaml
id: AC-001
requirement_ref: FR-001
status: pass | fail | skip

test_execution:
  test_id: TC-001
  test_type: unit | integration | e2e | manual
  automated: true
  
  given: "{PRECONDITION}"
  given_met: true
  
  when: "{ACTION}"
  action_performed: true
  
  then: "{EXPECTED_RESULT}"
  result_matched: true
  actual_result: "{ACTUAL_RESULT}"

evidence:
  screenshot: null
  log_output: "{LOG_EXCERPT}"
  test_report: "{REPORT_PATH}"
  
execution_time: "0.5s"
executed_at: "{TIMESTAMP}"
executed_by: "@idumb-verifier"
```

#### AC-002: {CRITERION_TITLE}
```yaml
id: AC-002
requirement_ref: FR-002
status: pass | fail | skip

test_execution:
  test_id: TC-002
  test_type: integration
  automated: true
  
  given: "{PRECONDITION}"
  given_met: true
  
  when: "{ACTION}"
  action_performed: true
  
  then: "{EXPECTED_RESULT}"
  result_matched: true

evidence:
  test_report: "{REPORT_PATH}"
  
execution_time: "1.2s"
executed_at: "{TIMESTAMP}"
```

#### AC-003: {CRITERION_TITLE}
```yaml
id: AC-003
requirement_ref: FR-002
status: pass | fail | skip

test_execution:
  test_id: TC-003
  test_type: manual
  automated: false
  
  given: "{PRECONDITION}"
  given_met: true
  
  when: "{ACTION}"
  action_performed: true
  
  then: "{EXPECTED_RESULT}"
  result_matched: true

evidence:
  manual_verification: "Verified by visual inspection"
  screenshot: "{SCREENSHOT_PATH}"
  
executed_at: "{TIMESTAMP}"
executed_by: "user"
```

### 3.2 Acceptance Test Summary
| AC ID | Type | Automated | Result | Duration |
|-------|------|-----------|--------|----------|
| AC-001 | unit | ✓ | pass | 0.5s |
| AC-002 | integration | ✓ | pass | 1.2s |
| AC-003 | manual | | pass | manual |
| AC-NFR-001 | performance | ✓ | pass | 5.0s |

### 3.3 Acceptance Gate
```yaml
acceptance_testing:
  criteria_passed: 4
  criteria_failed: 0
  criteria_skipped: 0
  criteria_total: 4
  
  pass_rate: 100
  
  status: pass | partial | fail
  
  failures:
    - criterion: null
      reason: null
      fix_action: null
```

---

## 4. Regression Testing

### 4.1 Test Suite Execution
```yaml
test_suite:
  framework: "{TEST_FRAMEWORK}"
  command: "npm test"
  execution_time: "45s"
  executed_at: "{TIMESTAMP}"
  
results:
  total: 150
  passed: 150
  failed: 0
  skipped: 0
  
  pass_rate: 100
  
coverage:
  statements: "85%"
  branches: "78%"
  functions: "90%"
  lines: "85%"
```

### 4.2 Regression Check
```yaml
regression_check:
  baseline_tests: 148
  current_tests: 150
  new_tests_added: 2
  
  tests_that_passed_before:
    still_pass: 148
    now_fail: 0
    
  regressions_detected: 0
  
  status: pass | fail
```

### 4.3 New Test Coverage
| New Test | For Task | Coverage |
|----------|----------|----------|
| TC-001 | T{N}-02 | AC-001 |
| TC-002 | T{N}-04 | AC-002 |

---

## 5. Integration Verification

### 5.1 Integration Points Tested
| Integration | Components | Test | Result |
|-------------|------------|------|--------|
| {INT_1} | A ↔ B | TC-INT-001 | pass |
| {INT_2} | B ↔ C | TC-INT-002 | pass |
| {INT_3} | External API | TC-INT-003 | pass |

### 5.2 End-to-End Flow Testing
```yaml
e2e_flows:
  - flow: "{FLOW_NAME}"
    description: "{FLOW_DESCRIPTION}"
    test_id: TC-E2E-001
    
    steps:
      - step: 1
        action: "{ACTION}"
        expected: "{EXPECTED}"
        actual: "{ACTUAL}"
        pass: true
        
      - step: 2
        action: "{ACTION}"
        expected: "{EXPECTED}"
        actual: "{ACTUAL}"
        pass: true
        
    overall: pass
    duration: "3.5s"
```

### 5.3 Integration Gate
```yaml
integration_verification:
  integration_points_tested: 3
  integration_points_total: 3
  
  e2e_flows_passed: 1
  e2e_flows_failed: 0
  
  external_integrations:
    - name: "{EXTERNAL_API}"
      status: verified
      
  status: pass | partial | fail
```

---

## 6. Documentation Verification

### 6.1 Code Documentation
```yaml
code_documentation:
  files_checked: 10
  files_documented: 10
  
  jsdoc_coverage: "95%"
  
  missing_docs:
    - file: null
      function: null
      
  status: pass | warn | fail
```

### 6.2 Project Documentation
| Document | Updated | Accurate | Status |
|----------|---------|----------|--------|
| README.md | ✓ | ✓ | pass |
| API docs | ✓ | ✓ | pass |
| CHANGELOG | ✓ | ✓ | pass |

### 6.3 Documentation Gate
```yaml
documentation:
  code_docs_complete: true
  readme_updated: true
  api_docs_generated: true
  changelog_updated: true
  
  status: pass | warn | fail
```

---

## 7. Verification Synthesis

### 7.1 Overall Results
```yaml
verification_summary:
  execution_completeness: pass
  spec_compliance: pass
  acceptance_testing: pass
  regression_testing: pass
  integration_verification: pass
  documentation: pass
  
  overall_status: pass | partial | fail
  
  score:
    total_checks: 25
    passed: 25
    failed: 0
    warnings: 0
    
    percentage: 100
```

### 7.2 Issues Found
| ID | Category | Severity | Description | Resolution |
|----|----------|----------|-------------|------------|
| - | - | - | No issues found | - |

### 7.3 Verification Confidence
```yaml
confidence_assessment:
  automated_test_coverage: high
  manual_verification_coverage: medium
  edge_case_coverage: medium
  
  overall_confidence: high | medium | low
  
  limitations:
    - "{LIMITATION_1}"
    - "{LIMITATION_2}"
```

---

## 8. Stakeholder Review

### 8.1 Review Summary
**Phase:** {PHASE_NAME}
**Verification result:** PASS
**Confidence:** High

**Key achievements:**
1. {ACHIEVEMENT_1}
2. {ACHIEVEMENT_2}
3. {ACHIEVEMENT_3}

**Metrics:**
- All {N} requirements verified
- All {N} acceptance criteria passed
- 0 regressions introduced
- {N}% test coverage

### 8.2 Demo Points
- [ ] {DEMO_POINT_1}
- [ ] {DEMO_POINT_2}
- [ ] {DEMO_POINT_3}

### 8.3 Review Feedback
```yaml
review:
  conducted: true | false
  conducted_at: null
  
  feedback:
    - category: positive | concern | change_request
      description: ""
      action_required: true | false
      
  follow_up_required: false
```

---

## 9. Sign-Off

### 9.1 Sign-Off Request
```yaml
signoff_request:
  timestamp: "{TIMESTAMP}"
  
  summary:
    phase: "{PHASE_NAME}"
    overall_result: pass
    issues_count: 0
    warnings_count: 0
    
  artifacts:
    spec: "{SPEC_PATH}"
    plan: "{PLAN_PATH}"
    execution_log: "{LOG_PATH}"
    test_reports: "{REPORT_PATH}"
    
  recommendation: "Ready for sign-off"
```

### 9.2 Sign-Off Gate
```yaml
signoff:
  requested: "{TIMESTAMP}"
  status: pending | approved | rejected
  
  options:
    - accept: "Approve phase completion"
    - accept_with_notes: "Approve with documented notes"
    - reject: "Reject - requires rework"
    
  approver_response:
    decision: null
    timestamp: null
    notes: ""
    
  if_approved:
    phase_status: "complete"
    proceed_to: "6.10 Completion & Archival"
    chain_to_next_phase: true | false
    
  if_rejected:
    reason: ""
    route_to_stage: ""
    tasks_to_redo: []
```

---

## 10. Completion & Archival

### 10.1 Phase Completion
```yaml
completion:
  phase: "{PHASE_NAME}"
  status: complete
  completed_at: "{TIMESTAMP}"
  
  duration:
    planned: "7.4h"
    actual: "{ACTUAL_DURATION}"
    variance: "{VARIANCE}"
    
  tasks_completed: 4
  checkpoints_passed: 3
  issues_resolved: 0
```

### 10.2 Artifacts Archive
```yaml
archive:
  location: ".idumb/project-output/phases/{N}/"
  
  artifacts:
    - name: "SPEC-v1.0.0.md"
      path: "{PATH}"
      checksum: "{HASH}"
      
    - name: "PLAN-v1.0.0.md"
      path: "{PATH}"
      checksum: "{HASH}"
      
    - name: "VERIFICATION.md"
      path: "{PATH}"
      checksum: "{HASH}"
      
    - name: "test-reports/"
      path: "{PATH}"
      
  git_commit: "{COMMIT_HASH}"
```

### 10.3 State Update
```yaml
state_update:
  phase: "Phase {N} - Complete"
  lastValidation: "{TIMESTAMP}"
  
  history_entry:
    timestamp: "{TIMESTAMP}"
    action: "phase-complete:{N}"
    agent: "@idumb-verifier"
    result: "pass"
    
  anchors_added:
    - type: "checkpoint"
      content: "Phase {N} complete: {SUMMARY}"
      priority: "high"
```

### 10.4 Next Phase Routing
```yaml
next_phase:
  exists: true | false
  phase_number: "{N+1}"
  phase_name: "{NEXT_PHASE_NAME}"
  
  auto_proceed: false
  prompt: |
    Phase {N} ({PHASE_NAME}) completed successfully.
    
    Summary:
    - Requirements verified: {N}
    - Acceptance criteria passed: {N}
    - Regressions: 0
    
    Next: Phase {N+1} - {NEXT_PHASE_NAME}
    
    Proceed? [Y]es / [R]eview artifacts / [P]ause
```

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0.0 | {DATE} | Verification complete | @idumb-verifier |

---

*Template: VERIFICATION v1.0.0*
*Stage: 6 - Verification*
*Output of: 6.7 Verification Synthesis*
