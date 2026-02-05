# Validation Rules Reference

Complete validation rules for all stages, documents, and gates.

## Document Validators

### IDEA-BRIEF Validation

```yaml
validator: idea-brief
version: 1.0.0

schema_validation:
  frontmatter:
    required:
      - type: "must equal 'idea-brief'"
      - id: "string, non-empty"
      - status: "enum: draft, validated, approved"
      - created: "ISO-8601 timestamp"
      - sector: "valid sector_id"
      - complexity: "enum: simple, moderate, complex, enterprise"
      - clarity_score: "number 0-100"
    
  sections:
    required:
      - "## 1. Raw Idea"
      - "## 2. Intent Statement"
      - "## 3. Constraints"
      - "## 4. Scope Definition"
      - "## 5. Assumptions"
      - "## 6. Clarity Assessment"
      
content_validation:
  intent_statement:
    rules:
      - name: "problem_defined"
        pattern: "What problem does this solve\\?"
        check: "Has non-empty answer"
        
      - name: "no_vague_language"
        patterns_forbidden:
          - "maybe"
          - "might"
          - "possibly"
          - "could be"
          - "should work"
        severity: warn
        
  scope:
    rules:
      - name: "in_scope_defined"
        check: "IN Scope table has ≥1 row"
        severity: block
        
      - name: "out_scope_defined"
        check: "OUT of Scope table has ≥1 row"
        severity: block
        
  assumptions:
    rules:
      - name: "assumptions_listed"
        check: "At least 1 assumption OR explicit 'No assumptions'"
        severity: block
        
      - name: "confidence_assigned"
        check: "Each assumption has high/medium/low confidence"
        severity: warn

clarity_scoring:
  formula: |
    score = 0
    if no_blocker_patterns: score += 30
    if all_required_sections: score += 25
    if vague_count < 3: score += 15
    if constraints_documented: score += 15
    if assumptions_explicit: score += 15
    return score
    
  thresholds:
    proceed: 70
    warn: 50
    block: 0
```

### RESEARCH Validation

```yaml
validator: research
version: 1.0.0

schema_validation:
  frontmatter:
    required:
      - type: "must equal 'research'"
      - id: "string, non-empty"
      - topic: "string, non-empty"
      - status: "enum: in-progress, complete, inconclusive"
      - sources_count: "number ≥ 0"
      - confidence: "number 0-100"
      - tools_used: "array"

source_validation:
  rules:
    - name: "minimum_sources"
      by_complexity:
        simple: 1
        moderate: 2
        complex: 3
        enterprise: 4
      severity: block
      
    - name: "cross_reference"
      check: "Critical claims have 2+ sources"
      severity: warn
      
    - name: "source_freshness"
      max_age_days: 180
      for_types: ["package_version", "security", "best_practice"]
      severity: warn
      
    - name: "source_credibility"
      require: "Each source has credibility rating"
      severity: warn

tool_validation:
  rules:
    - name: "tools_match_inventory"
      check: "tools_used matches available tools from 0.3"
      severity: warn
      
    - name: "minimum_tools_used"
      by_complexity:
        simple: 1
        moderate: 2
        complex: 2
        enterprise: 3
      severity: block

assumption_validation:
  rules:
    - name: "all_assumptions_addressed"
      check: "Each assumption from IDEA-BRIEF has validation result"
      severity: block
      
    - name: "invalidated_have_action"
      check: "Invalidated assumptions have required_action"
      severity: block

synthesis_validation:
  rules:
    - name: "recommendation_present"
      check: "Research has clear recommendation"
      severity: block
      
    - name: "conflicts_resolved"
      check: "All conflicts have resolution"
      severity: warn
```

### SPEC Validation

```yaml
validator: spec
version: 1.0.0

schema_validation:
  frontmatter:
    required:
      - type: "must equal 'spec'"
      - id: "string, non-empty"
      - version: "semver format"
      - status: "enum: draft, validated, approved, locked"
      - spec_ref: "valid spec_id"
      - research_ref: "valid research_id"

requirements_validation:
  rules:
    - name: "req_id_format"
      pattern: "^(FR|NFR|UR)-\\d{3}$"
      severity: block
      
    - name: "req_has_priority"
      check: "Each requirement has priority"
      values: ["must-have", "should-have", "nice-to-have"]
      severity: block
      
    - name: "req_has_source"
      check: "Each requirement traces to IDEA-BRIEF"
      severity: warn
      
    - name: "req_has_acceptance"
      check: "Each requirement has ≥1 acceptance criterion"
      severity: block
      
    - name: "req_has_research_backing"
      check: "Each requirement has research_ref"
      severity: warn

architecture_validation:
  rules:
    - name: "components_defined"
      check: "Each component has: name, type, responsibility"
      severity: block
      
    - name: "component_single_responsibility"
      check: "responsibility is ≤3 sentences"
      severity: warn
      
    - name: "dependencies_valid"
      check: "Internal deps reference existing components"
      severity: block

interface_validation:
  rules:
    - name: "api_contracts_typed"
      check: "All endpoints have request/response schemas"
      severity: block
      
    - name: "error_responses_defined"
      check: "All endpoints have error responses"
      severity: warn

consistency_validation:
  rules:
    - name: "req_to_arch_coverage"
      check: "Each requirement maps to ≥1 component"
      severity: block
      
    - name: "arch_to_interface_coverage"
      check: "Each component with external interface has contract"
      severity: warn
      
    - name: "acceptance_coverage"
      check: "Each requirement has ≥1 acceptance criterion"
      severity: block

clarity_validation:
  blockers:
    - pattern: "TBD"
      message: "TBD marker found - must be resolved"
    - pattern: "TODO"
      message: "TODO marker found - must be resolved"
    - pattern: "FIXME"
      message: "FIXME marker found - must be resolved"
    - pattern: "\\?$"
      message: "Unresolved question found"
      
  warnings:
    - pattern: "maybe|might|possibly"
      message: "Vague language detected"
    - pattern: "should work|probably"
      message: "Unvalidated assumption in spec"
```

### PLAN Validation

```yaml
validator: plan
version: 1.0.0

schema_validation:
  frontmatter:
    required:
      - type: "must equal 'plan'"
      - id: "string, non-empty"
      - version: "semver format"
      - phase: "string"
      - spec_ref: "valid spec_id"
      - estimated_duration: "duration format"
      - task_count: "number > 0"

task_validation:
  rules:
    - name: "task_id_format"
      pattern: "^T\\d+-\\d{2}$"
      example: "T1-01, T2-15"
      severity: block
      
    - name: "task_max_duration"
      max: "2h"
      severity: block
      message: "Tasks > 2h must be split"
      
    - name: "task_has_acceptance"
      check: "Each task has ≥1 acceptance criterion"
      severity: block
      
    - name: "task_has_estimate"
      check: "Each task has estimated_hours"
      severity: block
      
    - name: "task_has_assignee"
      check: "Each task has assigned_to"
      severity: warn

dependency_validation:
  rules:
    - name: "deps_reference_valid_tasks"
      check: "All depends_on reference existing task IDs"
      severity: block
      
    - name: "no_circular_deps"
      check: "Dependency graph is a valid DAG"
      severity: block
      
    - name: "no_orphan_tasks"
      check: "All tasks are reachable from start"
      severity: block

estimate_validation:
  rules:
    - name: "buffer_applied"
      check: "Total includes ≥20% buffer"
      severity: warn
      
    - name: "within_phase_limit"
      max: "8h per phase (configurable)"
      severity: warn
      action: "Suggest phase split"
      
    - name: "context_budget"
      max: "50% estimated context usage"
      severity: warn

coverage_validation:
  rules:
    - name: "requirements_covered"
      check: "Each requirement from SPEC has ≥1 task"
      severity: block
      
    - name: "acceptance_criteria_covered"
      check: "Each AC from SPEC maps to task"
      severity: block
      
    - name: "risks_mitigated"
      check: "Each risk from RESEARCH/SPEC has mitigation task or note"
      severity: warn

checkpoint_validation:
  rules:
    - name: "checkpoint_frequency"
      check: "≥1 checkpoint per 5 tasks"
      severity: warn
      
    - name: "checkpoint_after_critical"
      check: "Checkpoint after each critical path task"
      severity: warn
```

### VERIFICATION Validation

```yaml
validator: verification
version: 1.0.0

completeness_validation:
  rules:
    - name: "all_tasks_accounted"
      check: "Each task from PLAN has completion status"
      severity: block
      
    - name: "all_checkpoints_resolved"
      check: "Each checkpoint has pass/fail status"
      severity: block

compliance_validation:
  rules:
    - name: "requirements_verified"
      check: "Each requirement has verification status"
      severity: block
      
    - name: "must_have_all_pass"
      check: "All must-have requirements verified"
      severity: block
      
    - name: "evidence_provided"
      check: "Each verified requirement has evidence"
      severity: warn

testing_validation:
  rules:
    - name: "acceptance_tests_run"
      check: "All acceptance criteria have test results"
      severity: block
      
    - name: "regression_tests_run"
      check: "Regression test suite executed"
      severity: block
      
    - name: "no_regressions"
      check: "regression_count == 0"
      severity: block
```

---

## Stage Gate Validators

### Stage 0 Gates

```yaml
gates:
  "0.1":
    name: "Entry Identified"
    checks:
      - "entry_type is valid enum"
    on_fail: "Ask user to clarify"
    
  "0.3":
    name: "Research Capability"
    checks:
      - check: "tool_count >= min_for_complexity"
        simple: 1
        moderate: 2
        complex: 2
        enterprise: 3
    on_fail: "Block with installation guide"
    
  "0.5":
    name: "Complexity Determined"
    checks:
      - "complexity is valid enum"
      - "If complex, tool_count >= 2"
    on_fail: "Default to moderate"
```

### Stage 1 Gates

```yaml
gates:
  "1.2":
    name: "Intent Clear"
    checks:
      - "Intent statement present"
      - "No vague language (maybe, might, possibly)"
      - "Success scenario defined"
    on_fail: "Loop: Ask clarifying questions"
    
  "1.6":
    name: "Clarity Gate"
    checks:
      - "clarity_score >= 70 OR explicit skip"
    on_fail: "Loop: Return to 1.2-1.5"
    flag_if_skip: "unvalidated-entry"
```

### Stage 2 Gates

```yaml
gates:
  "2.4":
    name: "External Research Complete"
    checks:
      - check: "sources_count >= min"
        simple: 1
        moderate: 2
        complex: 3
      - "Each source has credibility rating"
    on_fail: "Loop: More research needed"
    
  "2.9":
    name: "Research Ready for Spec"
    checks:
      - "All under-clarified flags resolved"
      - "Tech stack validated"
      - "Dependencies mapped"
      - "Risks assessed"
      - "confidence >= threshold"
    on_fail: "Route to specific 2.x step"
```

### Stage 3 Gates

```yaml
gates:
  "3.7":
    name: "Internal Consistency"
    checks:
      - "Requirements → Architecture mapped"
      - "Architecture → Interfaces mapped"
      - "No orphan requirements"
    on_fail: "Loop: Fix in 3.1-3.6"
    
  "3.8":
    name: "Research Alignment"
    checks:
      - "alignment_score >= 90%"
      - "No spec claims without research backing"
    on_fail: "Loop: Back to 2.4 or 3.3-3.5"
    
  "3.9":
    name: "Clarity Scan"
    checks:
      - "TBD count == 0"
      - "TODO count == 0"
      - "Unresolved question count == 0"
    on_fail: "Block: Fix blockers before proceeding"
    
  "3.12":
    name: "Spec Approval"
    checks:
      - "User approves"
    options: ["Approve", "Request changes", "Reject"]
    on_reject: "Route based on reason"
```

### Stage 4 Gates

```yaml
gates:
  "4.2":
    name: "Dependency Valid"
    checks:
      - "No circular dependencies"
      - "Graph is valid DAG"
    on_fail: "Loop: Restructure tasks"
    
  "4.9":
    name: "Plan Validation"
    checks:
      - "All tasks atomic (≤2h)"
      - "Dependencies valid"
      - "Estimates realistic"
      - "Context budget ≤50%"
      - "Coverage 100%"
    on_fail: "Loop: Fix 4.1-4.7 (max 3 attempts)"
    max_attempts: 3
    escalate_after: "Present to user"
```

### Stage 5 Gates

```yaml
gates:
  "5.5":
    name: "Task Validation"
    checks:
      - "Task acceptance criteria pass"
    on_fail: "Loop: Fix → Retry"
    max_retries: 3
    escalate_after: "@idumb-debugger"
    
  "5.9":
    name: "Spec Drift"
    checks:
      - "Implementation matches spec"
      - "No undocumented changes"
    on_fail: "User decision: Update spec OR Revert code"
```

### Stage 6 Gates

```yaml
gates:
  "6.3":
    name: "Acceptance Testing"
    checks:
      - "All acceptance criteria tested"
      - "All tests pass"
    on_fail: "Loop: Fix → Retest"
    
  "6.9":
    name: "Sign-Off"
    checks:
      - "User approves verification"
    options: ["Accept", "Accept with notes", "Reject"]
    on_reject: "Route to relevant stage"
```

---

## Clarity Patterns

### Blocker Patterns (Must Resolve)

```yaml
blocker_patterns:
  - pattern: "TBD"
    regex: "\\bTBD\\b"
    message: "TBD marker must be resolved"
    
  - pattern: "TODO"
    regex: "\\bTODO\\b"
    message: "TODO marker must be resolved"
    
  - pattern: "FIXME"
    regex: "\\bFIXME\\b"
    message: "FIXME marker must be resolved"
    
  - pattern: "XXX"
    regex: "\\bXXX\\b"
    message: "XXX marker must be resolved"
    
  - pattern: "Unresolved question"
    regex: "\\?\\s*$"
    message: "Lines ending with ? indicate unresolved questions"
    
  - pattern: "Empty placeholder"
    regex: "\\{[A-Z_]+\\}"
    message: "Template placeholder not filled"
```

### Warning Patterns (Should Review)

```yaml
warning_patterns:
  - pattern: "Vague possibility"
    regex: "\\b(maybe|might|possibly|could be)\\b"
    message: "Vague language - consider making definitive"
    
  - pattern: "Unvalidated assumption"
    regex: "\\b(should work|probably|assume|assuming)\\b"
    message: "Unvalidated assumption - verify or document"
    
  - pattern: "Weak commitment"
    regex: "\\b(try to|attempt to|hope to)\\b"
    message: "Weak commitment - specify concrete action"
    
  - pattern: "Undefined reference"
    regex: "\\b(see above|as mentioned|elsewhere)\\b"
    message: "Vague reference - use specific section/ID"
```

---

*Reference: validation-rules v1.0.0*
