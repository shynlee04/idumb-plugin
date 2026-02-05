---
name: idumb-validation
description: "Comprehensive validation and gap detection skill for iDumb meta-framework - iterative assessment, automated checklist generation, and self-healing workflows"
version: 2.0.0
license: MIT
metadata:
  audience: ai-agents
  workflow: validation
  completion-driven: true
  integration-points: 30+
---

# iDumb Validation Skill

**Completion-driven validation with iterative gap detection and self-healing workflows.**

`★ Insight ─────────────────────────────────────`
- Validation completes when WORK IS COMPLETE, not when counters expire
- Every gap must have: detection criteria, impact assessment, resolution path, verification method
- Iterative validation: detect → assess → fix → re-validate → exit only when PASS
- Integration points: if any concept has <15 connections, it's incomplete
`─────────────────────────────────────────────────`

## Core Philosophy

### Completion-Driven Validation

```yaml
principle: |
  A validation cycle exits when its PURPOSE is achieved.
  If progress stalls, ESCALATE with full context.
  NEVER silently give up or return half-assed results.

exits_when:
  - all_checks.executed == true
  - all_gaps.identified == true
  - all_gaps.resolution_proposed == true
  - all_fixable_gaps.fixed == true
  - all_unfixable_gaps.documented == true

never:
  - "Return 'validation complete' when gaps exist"
  - "Guess or assume without evidence"
  - "Use arbitrary iteration limits (max=N)"
  - "Silently skip checks due to complexity"
```

### Integration Point Validation

Every iDumb concept must validate against integration requirements:

| Tier | Min Integration Points | Rationale |
|------|------------------------|-----------|
| **Highest** (agents, workflows, core governance) | 30+ | These concepts touch everything |
| **Middle** (tools, commands, templates) | 15+ | Moderate cross-cutting impact |
| **Lowest** (individual artifacts, configs) | 10+ | Focused scope |

```yaml
integration_types:
  - reads_from: [what this consumes]
  - writes_to: [what this produces]
  - validates_against: [schemas, rules]
  - triggers: [what this initiates]
  - blocked_by: [prerequisites]
  - blocks: [dependents]
  - relates_to: [associated concepts]
  - conflicts_with: [potential collisions]
```

---

## The Validation Framework

### Three-Layer Validation Model

```
┌─────────────────────────────────────────────────────────────┐
│                    LAYER 1: STRUCTURE                         │
│  "Does the thing exist in the right place with right format?" │
├─────────────────────────────────────────────────────────────┤
│                    LAYER 2: INTEGRATION                        │
│  "Is it connected to what it should be? Min 15+ links?"       │
├─────────────────────────────────────────────────────────────┤
│                    LAYER 3: BEHAVIOR                           │
│  "Does it work as intended across workflows?"                │
└─────────────────────────────────────────────────────────────┘
```

### Validation Lifecycle

```yaml
validation_lifecycle:
  1_detect:
      - "Run structure checks"
      - "Count integration points"
      - "Test behavior in context"
      - "Identify ALL gaps before fixing"

  2_assess:
      - "Categorize gaps by severity"
      - "Measure integration coverage"
      - "Assess impact on dependent systems"
      - "Prioritize fixes by dependency order"

  3_resolve:
      - "Fix highest-severity first"
      - "Update integration points"
      - "Re-validate affected systems"
      - "Iterate until PASS"

  4_verify:
      - "All checks return PASS"
      - "Integration points >= threshold"
      - "No regressions introduced"
      - "Evidence documented"
```

---

## Comprehensive Assessment Criteria

### Category 1: Agent Validation

#### Structure Checklist

```yaml
agent_structure_validation:
  required_files:
    - path: "src/agents/{agent-name}.md"
      check: "file_exists"
    - frontmatter: "YAML with description, mode, permission"
      check: "valid_yaml"

  required_frontmatter_fields:
    - field: "description"
      type: "string"
      min_length: 20
      check: "describes_agent_purpose"

    - field: "mode"
      type: "enum"
      values: ["primary", "all", "all"]
      check: "matches_hierarchical_level"

    - field: "permission"
      type: "object"
      required_keys: ["task", "bash", "edit", "write"]
      check: "no_broad_denies"

  forbidden_patterns:
    - pattern: '"*": deny'
      severity: "critical"
      reason: "Broad denies break future agent additions"
      fix: "Use specific allow-lists instead"

    - pattern: "write: allow + task: allow"
      severity: "critical"
      reason: "Chain violation - non-leaf can't write"
      fix: "Move write to leaf agent (builder)"
```

#### Integration Validation

```yaml
agent_integration_validation:
  min_integration_points: 30

  required_connections:
    - reads_from:
        - ".idumb/brain/state.json"
        - ".idumb/brain/config.json"
        - "Current TODO list"

    - writes_to:
        - "State history entries"
        - "Validation results"
        - "Delegation tracking"

    - validates_against:
        - "Permission rules (deny-rules.yaml)"
        - "Chain enforcement rules"
        - "Completion definitions"

    - delegates_to: "valid child agents only"
    - delegated_by: "valid parent agents only"

  connection_counting:
      method: |
        Count unique references:
        - Tools listed in frontmatter
        - Commands in workflow sections
        - Agents in delegation chains
        - Files read/written
        - State fields accessed
        - Validation checks performed

      threshold_check: "count >= 30 OR explanation documented"
```

#### Behavior Validation

```yaml
agent_behavior_validation:
  must_delegate:
      - "Coordinator agents: NEVER execute directly"
      - "Validator agents: read-only checks"
      - "Builder agents: execute given tasks"

  must_track:
      - "Every delegation with delegation_id"
      - "State changes with timestamps"
      - "TODO updates on completion"

  must_report:
      - "Structured return format"
      - "Evidence for all claims"
      - "Next action recommendations"
```

### Category 2: Tool Validation

#### Structure Checklist

```yaml
tool_structure_validation:
  required_files:
    - path: "src/tools/idumb-{tool-name}.ts"
      check: "file_exists"

  required_exports:
    - pattern: "export const {name} = tool({...})"
      check: "uses_tool_wrapper"
    - wrapper: "from '@opencode-ai/plugin'"
      check: "correct_import"

  required_tool_properties:
    - property: "description"
      type: "string"
      min_length: 10

    - property: "args"
      type: "object"
      check: "all_args_have_schema_or_description"

    - property: "execute"
      type: "async function"
      check: "returns_json_string"
```

#### Integration Validation

```yaml
tool_integration_validation:
  min_integration_points: 15

  required_connections:
    - read_access: "state.json or config.json"
    - write_access: "logs or state updates"
    - tool_calls: "uses other idumb-* tools"
    - agent_usage: "called by at least 2 agents"

  validation_points:
      - "File operations check paths"
      - "JSON operations have error handling"
      - "No console.log (pollutes TUI)"
      - "Returns structured JSON"
```

### Category 3: Command Validation

#### Structure Checklist

```yaml
command_structure_validation:
  required_files:
    - path: "src/commands/idumb/{command}.md"
      check: "file_exists"

  required_frontmatter_fields:
    - field: "description"
      type: "string"
      check: "explains_command_purpose"

    - field: "agent"
      type: "string"
      check: "references_existing_agent"

  required_body_sections:
    - section: "Usage"
      check: "shows_command_syntax"
    - section: "Workflow"
      check: "describes_execution_steps"
    - section: "Examples"
      check: "provides_working_examples"
```

#### Integration Validation

```yaml
command_integration_validation:
  min_integration_points: 15

  required_connections:
    - agent_binding: "one primary agent"
    - tool_usage: "uses at least 2 idumb-* tools"
    - state_access: "reads or writes state"
    - workflow_trigger: "initiated by user or agent"
    - dependency_check: "validates prerequisites"

  chain_validation:
      - "Commands have MUST-BEFORE rules"
      - "Prerequisites checked before execution"
      - "State updated after completion"
      - "History entry logged"
```

### Category 4: Workflow Validation

#### Structure Checklist

```yaml
workflow_structure_validation:
  required_files:
    - path: "src/workflows/{workflow}.md"
      check: "file_exists"

  required_sections:
    - section: "Purpose"
      check: "clear_goal_statement"
    - section: "Prerequisites"
      check: "all_dependencies_listed"
    - section: "Steps"
      check: "numbered_sequence"
    - section: "Completion Criteria"
      check: "measurable_conditions"
    - section: "Error Handling"
      check: "failure_modes_addressed"
```

#### Integration Validation

```yaml
workflow_integration_validation:
  min_integration_points: 20

  required_connections:
    - agents_involved: "all agents in workflow"
    - tools_used: "at least 3 tools"
    - state_transitions: "before/after states"
    - commands_triggered: "may call sub-commands"
    - artifacts_generated: "outputs documented"

  completion_validation:
      - "No max_iterations or arbitrary limits"
      - "exits_when with measurable conditions"
      - "stall_detection defined"
      - "evidence_requirements specified"
```

### Category 5: Schema Validation

#### Structure Checklist

```yaml
schema_structure_validation:
  required_files:
    - path: "src/schemas/{schema-name}.json"
      check: "file_exists"

  required_schema_properties:
    - property: "$schema"
      value: "http://json-schema.org/draft-07/schema#"

    - property: "title"
      type: "string"

    - property: "type"
      value: "object"

    - property: "required"
      type: "array"
      check: "lists_mandatory_fields"

    - property: "properties"
      type: "object"
      check: "defines_all_fields_with_types"
```

#### Integration Validation

```yaml
schema_integration_validation:
  min_integration_points: 10

  required_connections:
    - validates: "at least one artifact type"
    - validated_by: "at least one tool or command"
    - referenced_in: "documentation or code comments"
    - versioned: "has version number"

  runtime_validation:
      - "Schema referenced in validation tool"
      - "Errors provide actionable guidance"
      - "Required fields checked first"
      - "Type mismatches reported with context"
```

### Category 6: Configuration Validation

#### Structure Checklist

```yaml
config_structure_validation:
  required_files:
    - path: "src/config/{config-name}.yaml"
      check: "file_exists"

  required_structure:
    - section: "version"
      type: "semantic"

    - section: "metadata"
      fields: ["created", "author", "last_updated"]

    - section: "rules"
      check: "each_rule_has_purpose_and_implementation"
```

#### Integration Validation

```yaml
config_integration_validation:
  min_integration_points: 15

  required_connections:
    - read_by: "at least one tool"
    - enforced_by: "at least one agent or tool"
    - documented_in: "skill or agent profile"
    - tested_by: "validation check"

  deny_rules_validation:
      - "No broad denies without specific message"
      - "Each deny has suggestion"
      - "Severity levels appropriate"
      - "Scope correctly specified"
```

---

## Iterative Gap Detection Workflow

### Phase 1: Comprehensive Scan

```yaml
step_1_initial_scan:
  tool: "idumb-validate"
  scope: "all"

  output_format:
    overall: "pass | fail | warning"
    checks: []
    gaps: []
    integration_summary: {}

  scan_targets:
    - "src/agents/*.md"
    - "src/tools/*.ts"
    - "src/commands/idumb/*.md"
    - "src/workflows/*.md"
    - "src/schemas/*.json"
    - "src/config/*.yaml"
```

### Phase 2: Gap Classification

```yaml
step_2_classify_gaps:
  for_each_gap:
    assess_severity:
      critical:
        - "Blocks core functionality"
        - "Breaks governance chain"
        - "Causes data loss"

      high:
        - "Violates completion principle"
        - "Below integration threshold"
        - "Missing required field"

      medium:
        - "Incomplete documentation"
        - "Missing non-critical integration"
        - "Inconsistent patterns"

      low:
        - "Style inconsistencies"
        - "Minor documentation gaps"

    assess_fixability:
      auto_fixable:
        - "Add missing required field"
        - "Remove forbidden pattern"
        - "Fix simple syntax error"

      requires_delegation:
        - "Complex refactoring"
        - "Multi-file changes"
        - "Architecture decisions"

      requires_user_input:
        - "Policy decisions"
        - "Breaking changes"
        - "Scope definitions"
```

### Phase 3: Iterative Resolution

```yaml
step_3_resolve_gaps:
  resolution_order:
    - "Critical gaps (blocking)"
    - "High gaps (functionality)"
    - "Medium gaps (quality)"
    - "Low gaps (polish)"

  for_each_fixable_gap:
    fix_action:
      - "Apply fix"
      - "Re-validate specific component"
      - "Check for regressions"
      - "Update gap status"

  for_each_unfixable_gap:
    document_action:
      - "Create gap report"
      - "Propose resolution path"
      - "Identify blocking issues"
      - "Escalate to user"
```

### Phase 4: Verification

```yaml
step_4_verify_completion:
  completion_checks:
    - "All critical gaps: resolved"
    - "All high gaps: resolved or documented"
    - "Integration points: >= threshold"
    - "No regressions introduced"
    - "Evidence collected for all fixes"

  if_not_complete:
    - "Repeat Phase 3"
    - "Max 3 cycles before escalation"

  if_complete:
    - "Generate validation report"
    - "Update state.json"
    - "Anchor completion"
```

---

## Stall Detection and Escalation

### Stall Triggers

```yaml
stall_detection:
  same_output_3_cycles:
      trigger: "validation_output unchanged for 3 iterations"
      action: "Escalate with current state"

  no_progress_2_cycles:
      trigger: "gap_count not reduced for 2 iterations"
      action: "Present partial completion, request guidance"

  fix_failure_3_times:
      trigger: "same fix attempted 3 times without success"
      action: "Mark as unfixable, escalate"

  dependency_deadlock:
      trigger: "Gap A requires fix to B, B requires fix to A"
      action: "Present deadlock, request resolution strategy"
```

### Escalation Protocol

```yaml
escalation_protocol:
  when_stalled:
    1_checkpoint:
        - "Save current validation state"
        - "Document all attempted fixes"
        - "List remaining gaps by severity"

    2_present:
        - "Summary of work completed"
        - "Current stall reason"
        - "Partial results available"

    3_offer_options:
        - "Accept partial: continue with known gaps"
        - "Provide guidance: user directs next approach"
        - "Abort: rollback to pre-validation state"
        - "Debug: deeper investigation"
```

---

## Integration Point Matrix Template

```yaml
integration_matrix_template:
  component_name: "name"
  component_type: "agent | tool | command | workflow | schema | config"

  integration_points:
    reads_from:
      - source: "what"
        path: "where"
        purpose: "why"

    writes_to:
      - target: "what"
        path: "where"
        purpose: "why"

    validates_against:
      - schema: "which"
        enforcement: "how"

    triggers:
      - action: "what"
        condition: "when"

    triggered_by:
      - source: "what"
        condition: "when"

    depends_on:
      - component: "what"
        reason: "why"

    blocks:
      - component: "what"
        reason: "why"

    relates_to:
      - component: "what"
        relationship: "description"

    conflicts_with:
      - component: "what"
        condition: "when"
        mitigation: "how"

  total_count: "calculated"
  threshold_met: "boolean"
  gap_if_not_met: "explanation"
```

---

## Quick Reference Checklist

### For Any Component

```yaml
validation_checklist:
  structure:
    - [ ] File exists in correct location
    - [ ] Required format (MD, TS, JSON, YAML)
    - [ ] Required header/frontmatter
    - [ ] Required body sections
    - [ ] No forbidden patterns

  integration:
    - [ ] Reads from required sources
    - [ ] Writes to required targets
    - [ ] Validates against schemas
    - [ ] Has minimum integration points
    - [ ] Connection types documented

  behavior:
    - [ ] Works as intended
    - [ ] Error handling present
    - [ ] Returns structured results
    - [ ] Updates state appropriately
    - [ ] No regressions

  documentation:
    - [ ] Purpose clearly stated
    - [ ] Usage instructions present
    - [ ] Examples provided
    - [ ] Error cases documented
```

### Exit Criteria

```yaml
validation_complete_when:
  structure_checks: "all_pass"
  integration_points: ">= threshold for component tier"
  behavior_tests: "all_pass"
  gaps_identified: "true"
  gaps_resolved: "all_fixable OR documented"
  evidence_collected: "true"
  state_updated: "true"
```

---

`★ Insight ─────────────────────────────────────`
- The 30/15/10 integration point threshold forces thinking about connections
- If you can't find 30 connections for an agent, it's probably over-specialized or under-documented
- Completion-driven validation prevents "good enough" thinking that leaves gaps
- Stall detection prevents infinite loops while ensuring thoroughness
`─────────────────────────────────────────────────`
