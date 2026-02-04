# Self-Upgrade Protocol Reference

Rules and procedures for learning from validation results and improving transformation rules over time.

## Learning Cycle Overview

```
Ingest → Classify → Transform → Validate → Integrate → Evolve → (repeat)
                                                    ↑
                                                    └── Feedback Loop
```

## Phase 1: Validation Feedback Collection

### Feedback Sources

```yaml
validation_failures:
  source: "Validation reports"
  location: ".idumb/governance/validations/{report}.json"
  contains:
    - "Schema validation errors"
    - "Integration failures"
    - "Governance violations"
    - "Completeness gaps"

integration_issues:
  source: "Integration attempts"
  location: ".idumb/ingestion/logs/{framework}-integration.log"
  contains:
    - "Agent permission mismatches"
    - "Tool binding failures"
    - "Command routing errors"
    - "State operation failures"

user_corrections:
  source: "Manual fixes"
  location: ".idumb/ingestion/corrections/{framework}.md"
  contains:
    - "Manual agent edits"
    - "Workflow structure changes"
    - "Permission adjustments"
    - "Name mapping corrections"
```

### Feedback Classification

```yaml
feedback_types:
  schema_error:
    severity: "critical"
    action: "Fix transformation rule immediately"
    example: "Missing required field in generated agent"

  integration_error:
    severity: "high"
    action: "Update mapping rule"
    example: "Agent permission doesn't match hierarchy level"

  completeness_gap:
    severity: "medium"
    action: "Add missing transformation"
    example: "Workflow missing checkpoint"

  user_correction:
    severity: "variable"
    action: "Learn from user choice"
    example: "User renamed agent to different convention"
```

## Phase 2: Rule Update Process

### Rule Versioning

```yaml
rule_structure:
  file: "references/transformation-rules.md"
  versioning:
    format: "semantic versioning (X.Y.Z)"
    major: "Breaking changes to transformation logic"
    minor: "New pattern mappings added"
    patch: "Bug fixes to existing mappings"

  rule_entry_format:
    rule_id: "unique identifier"
    version: "current version"
    created: "ISO-8601 timestamp"
    last_modified: "ISO-8601 timestamp"
    confidence: "0.0-1.0 score"
    source_framework: "framework this rule learned from"
    validation_count: "number of times validated"
    success_rate: "percentage of successful transformations"
```

### Rule Creation

```yaml
on_new_pattern_discovered:
  1_analyze:
    action: "Identify pattern characteristics"
    extract:
      - "Source framework"
      - "Pattern category"
      - "Structural features"
      - "Behavioral features"

  2_create_rule:
    action: "Generate transformation rule"
    include:
      - "Source pattern description"
      - "Target pattern description"
      - "Mapping logic"
      - "Validation criteria"

  3_test_rule:
    action: "Apply to similar patterns"
    measure:
      - "Success rate"
      - "Edge cases"
      - "Performance"

  4_integrate:
    action: "Add to transformation-rules.md"
    update:
      - "Rule index"
      - "Pattern inventory"
      - "Classification tree"
```

### Rule Modification

```yaml
on_validation_failure:
  1_identify_broken_rule:
    action: "Find rule that generated invalid output"
    method: "Trace transformation from source to target"

  2_diagnose_issue:
    action: "Understand why rule failed"
    questions:
      - "Is source pattern different than expected?"
      - "Is target structure incompatible?"
      - "Are there missing edge cases?"

  3_update_rule:
    action: "Modify rule to handle failure case"
    options:
      - "Add condition to existing rule"
      - "Create new rule variant"
      - "Split rule into sub-rules"

  4_validate_update:
    action: "Re-test on original + similar patterns"
    success_criteria: "No regressions, failure resolved"

  5_increment_version:
    action: "Update rule version number"
    type: "patch for bug fix, minor for new condition"
```

### Rule Merging

```yaml
on_similar_rules_detected:
  condition: "Two or more rules handle similar patterns"

  merge_process:
    1_compare:
      - "Rule coverage overlap"
      - "Transformation differences"
      - "Confidence scores"

    2_create_merged:
      - "Combine rule logic"
      - "Handle all source patterns"
      - "Preserve best transformations"

    3_test_merged:
      - "Validate on all source patterns"
      - "Check for regressions"
      - "Measure confidence improvement"

    4_deprecate_old:
      - "Mark old rules as deprecated"
      - "Add reference to new merged rule"
      - "Archive after validation period"
```

## Phase 3: Confidence Scoring

### Confidence Calculation

```yaml
confidence_factors:
  base_confidence: 0.5  # Starting confidence for new rules

  validation_success:
    factor: "+0.1"
    max: 0.95
    condition: "Transformation passes all validations"

  validation_failure:
    factor: "-0.2"
    min: 0.1
    condition: "Transformation fails validation"

  user_approval:
    factor: "+0.15"
    max: 1.0
    condition: "User accepts transformation without modification"

  user_correction:
    factor: "-0.1"
    min: 0.1
    condition: "User modifies transformation"

  successful_reuse:
    factor: "+0.05"
    per: "Successful application to new pattern"
    max: 1.0
```

### Confidence Thresholds

```yaml
thresholds:
  auto_apply: 0.9
    description: "Automatically apply without review"

  suggest_apply: 0.7
    description: "Suggest to user, apply on approval"

  manual_review: 0.5
    description: "Require manual review before apply"

  experimental: 0.3
    description: "Test only, do not suggest to user"

  deprecated: 0.2
    description: "Rule needs revision, disable auto-use"
```

## Phase 4: Pattern Library Evolution

### New Pattern Detection

```yaml
detection_criteria:
  novel_structure:
    - "File organization not seen before"
    - "New YAML schema pattern"
    - "Unique directory layout"

  novel_behavior:
    - "New execution model"
    - "Different state management"
    - "Unique governance approach"

  novel_integration:
    - "New component type"
    - "Different communication pattern"
    - "Alternative validation approach"
```

### Pattern Addition

```yaml
add_to_library:
  1_document:
    action: "Create pattern documentation"
    location: "references/framework-patterns.md"
    include:
      - "Source framework"
      - "Pattern description"
      - "Examples"
      - "Transformation notes"

  2_classify:
    action: "Add to classification tree"
    location: "references/classification-tree.md"
    include:
      - "Concept category"
      - "Pattern family"
      - "Relationships to other patterns"

  3_create_rule:
    action: "Generate transformation rule"
    location: "references/transformation-rules.md"
    include:
      - "Mapping logic"
      - "Confidence score"
      - "Validation criteria"

  4_test:
    action: "Validate transformation"
    ensure:
      - "Rule produces valid output"
      - "Output integrates correctly"
      - "No regressions in existing patterns"
```

## Phase 5: Regeneration

### Trigger Conditions

```yaml
regeneration_triggers:
  rule_confidence_improved:
    threshold: "+0.2 confidence"
    action: "Re-transform patterns using improved rule"

  rule_merged:
    condition: "Similar rules merged"
    action: "Re-transform using merged rule"

  user_request:
    condition: "User requests re-transformation"
    action: "Re-transform specific component"

  critical_bug_fix:
    condition: "Breaking bug fixed in rule"
    action: "Re-transform all affected patterns"
```

### Regeneration Process

```yaml
regeneration_steps:
  1_identify_affected:
    action: "Find all patterns transformed by updated rule"
    output: "List of affected components"

  2_backup_existing:
    action: "Archive current transformations"
    location: ".idumb/ingestion/backups/{timestamp}/"

  3_re_transform:
    action: "Apply updated transformation rules"
    output: "New component versions"

  4_validate:
    action: "Run full validation suite"
    ensure:
      - "No regressions"
      - "Improvements verified"
      - "Integration confirmed"

  5_compare:
    action: "Diff old vs new"
    present: "Changes to user for approval"

  6_integrate:
    action: "Replace with user approval"
    update: "Component versions, rule version"
```

## Phase 6: Archive and Retention

### Archive Strategy

```yaml
archive_triggers:
  rule_deprecated:
    action: "Move to archive/"
    retain: "Reference for potential revival"

  transformation_failed:
    action: "Archive failed attempt"
    retain: "Learn from failures"

  major_version_upgrade:
    action: "Archive old rule versions"
    retain: "Rollback capability"

archive_location: ".idumb/ingestion/archive/{framework}/{timestamp}/"
archive_contents:
  - "Original transformation rules"
  - "Generated components"
  - "Validation reports"
  - "User feedback"
```

### Retention Policy

```yaml
retention_rules:
  successful_transformations: "indefinite"
  failed_transformations: "1 year"
  deprecated_rules: "2 years"
  validation_reports: "5 years"
  user_feedback: "indefinite"
```

## Meta-Learning Dashboard

### Metrics to Track

```yaml
learning_metrics:
  transformation_success_rate:
    calculation: "successful / total transformations"
    target: "> 95%"

  rule_confidence_trend:
    calculation: "average confidence over time"
    target: "increasing"

  pattern_discovery_rate:
    calculation: "new patterns per framework"
    target: "steady increase"

  automation_level:
    calculation: "auto_applied / total transformations"
    target: "> 80%"

  user_satisfaction:
    calculation: "user_approved / user_reviewed"
    target: "> 90%"
```

### Dashboard Structure

```yaml
dashboard:
  location: ".idumb/ingestion/dashboard.md"
  sections:
    - "Summary: Current metrics vs targets"
    - "Recent Transformations: Last 10 with results"
    - "Rule Health: Confidence scores, recent changes"
    - "Pattern Inventory: Count by category"
    - "Learning Queue: Patterns awaiting analysis"
    - "Improvement Opportunities: Low-confidence rules"
```

## Emergency Rollback

### Rollback Triggers

```yaml
rollback_triggers:
  critical_regression:
    condition: "Core functionality broken"
    action: "Immediate rollback to previous version"

  validation_cascade:
    condition: "Multiple validation failures"
    action: "Rollback recent rule changes"

  user_rejection:
    condition: "User rejects new transformation"
    action: "Revert to previous transformation"
```

### Rollback Process

```yaml
rollback_steps:
  1_identify_breaking_change:
    action: "Find rule or transformation that caused issue"

  2_restore_backup:
    action: "Restore from archive"
    source: ".idumb/ingestion/backups/{stable-timestamp}/"

  3_disable_problematic_rule:
    action: "Mark rule as disabled"
    update: "transformation-rules.md"

  4_analyze_failure:
    action: "Document what went wrong"
    output: ".idumb/ingestion/incidents/{timestamp}.md"

  5_fix_and_retry:
    action: "Create fixed rule version"
    process: "Follow normal rule update process"
```
