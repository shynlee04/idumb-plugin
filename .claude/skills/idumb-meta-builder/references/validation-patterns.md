# Validation Patterns Reference

Validation layer definitions for iDumb workflow modules.

## Validation Layers

Modules are validated in layers, each building on the previous:

```
Layer 1: Schema Validation → Layer 2: Integration Validation → Layer 3: Completeness Validation → Layer 4: Governance Validation
```

## Layer 1: Schema Validation

Validates the YAML frontmatter and basic structure.

### Checks

```yaml
schema_checks:
  frontmatter_complete:
    check: "All required fields present"
    required_fields:
      - type
      - name
      - version
      - workflow_type
      - complexity
      - created
      - created_by
      - validated_by
      - coverage_score
      - status
    pass_condition: "all fields present"
    fail_message: "Missing required field: {field_name}"

  yaml_syntax:
    check: "YAML is well-formed"
    pass_condition: "parses without error"
    fail_message: "YAML syntax error at line {line_number}"

  enum_values:
    check: "Enum fields use valid values"
    enums:
      workflow_type: ["planning", "execution", "validation", "integration"]
      complexity: ["simple", "moderate", "complex"]
      status: ["draft", "validated", "approved", "deprecated"]
    pass_condition: "value in allowed list"
    fail_message: "Invalid value '{value}' for {field}. Allowed: {allowed}"

  timestamp_format:
    check: "Timestamps are ISO-8601"
    fields:
      - created
      - updated (if present)
    pattern: "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}"
    pass_condition: "matches pattern"
    fail_message: "Invalid timestamp format: {value}"

  version_format:
    check: "Version follows semver"
    pattern: "^\\d+\\.\\d+\\.\\d+(-[\\w-]+)?$"
    pass_condition: "matches semver pattern"
    fail_message: "Invalid version: {value}. Use semver: X.Y.Z"

  naming_convention:
    check: "Module name follows kebab-case"
    pattern: "^[a-z0-9]+(-[a-z0-9]+)*$"
    pass_condition: "matches pattern"
    fail_message: "Invalid module name: {value}. Use kebab-case"
```

### Validation Output

```yaml
layer1_result:
  status: "pass | fail"
  score: "{0-100}"
  checks:
    - name: "{check_name}"
      status: "pass | fail"
      message: "{detail}"
      location: "{file_path:line_number}"
```

## Layer 2: Integration Validation

Validates that all referenced agents, tools, and commands exist.

### Agent Binding Validation

```yaml
agent_validation:
  agent_exists:
    check: "Referenced agent profile exists"
    location: "src/agents/{agent-name}.md"
    pass_condition: "file exists"
    fail_message: "Agent not found: @{agent-name}"

  agent_has_permission:
    check: "Agent has required permission for step action"
    permissions_map:
      read: ["grep", "glob", "read"]
      write: ["write", "edit"]
      bash: ["bash"]
      task: ["task"]
    pass_condition: "agent.permission.{action} = allow|ask"
    fail_message: "Agent @{agent} lacks permission: {action}"

  agent_mode_compatible:
    check: "Agent mode compatible with delegation"
    valid_modes:
      coordinator: ["primary", "all"]
      worker: ["all"]
    pass_condition: "delegation matches mode hierarchy"
    fail_message: "Cannot delegate {parent} → {child}: mode mismatch"
```

### Tool Binding Validation

```yaml
tool_validation:
  tool_exists:
    check: "Referenced tool exists"
    location: "src/tools/idumb-{tool-name}.ts"
    pass_condition: "file exists"
    fail_message: "Tool not found: {tool-name}"

  tool_export_exists:
    check: "Tool exports required function"
    exports: ["read", "write", "anchor", "history", etc.]
    pass_condition: "export defined in file"
    fail_message: "Tool {tool} missing export: {export_name}"

  tool_parameters_valid:
    check: "Tool call parameters match schema"
    pass_condition: "all required params provided"
    fail_message: "Tool {tool} missing required param: {param}"
```

### Command Binding Validation

```yaml
command_validation:
  command_exists:
    check: "Referenced command exists"
    location: "src/commands/idumb/{command-name}.md"
    pass_condition: "file exists"
    fail_message: "Command not found: /{command-name}"

  command_agent_binding:
    check: "Command has valid agent binding"
    pass_condition: "command.agent field exists and is valid agent"
    fail_message: "Command /{command} has invalid agent: {agent}"
```

### Validation Output

```yaml
layer2_result:
  status: "pass | fail | warning"
  score: "{0-100}"
  agents:
    valid: ["@agent1", "@agent2"]
    invalid:
      - name: "@bad-agent"
        reason: "Agent profile not found"
  tools:
    valid: ["tool1", "tool2"]
    invalid:
      - name: "bad-tool"
        reason: "Tool file not found"
  commands:
    valid: ["/command1"]
    invalid: []
```

## Layer 3: Completeness Validation

Validates there are no gaps or overlaps in the workflow.

### Gap Detection

```yaml
gap_checks:
  prerequisite_defined:
    check: "All prerequisites are defined or reachable"
    pass_condition: "each prerequisite exists or can be created"
    fail_message: "Prerequisite undefined: {name}"

  step_sequence_complete:
    check: "Step sequence has no holes"
    pass_condition: "steps numbered 1..N with no gaps"
    fail_message: "Step sequence gap: missing step {N}"

  exit_condition_defined:
    check: "Workflow has explicit exit condition"
    pass_condition: "post-execution checkpoint exists"
    fail_message: "No exit condition defined"

  output_consumed:
    check: "All outputs are consumed or marked final"
    pass_condition: "each output has consumer or is final_output"
    fail_message: "Orphaned output: {output_name} not consumed"

  error_handling_defined:
    check: "Each step has error handling"
    pass_condition: "on_failure clause exists for each step"
    fail_message: "Step {N} missing error handling"
```

### Overlap Detection

```yaml
overlap_checks:
  duplicate_steps:
    check: "No duplicate workflow steps"
    pass_condition: "no two steps have same purpose"
    fail_message: "Duplicate step detected: {step_title}"

  conflicting_assignments:
    check: "No conflicting agent assignments"
    pass_condition: "each task assigned to single agent"
    fail_message: "Conflict: {task} assigned to both {agent1} and {agent2}"

  redundant_validations:
    check: "No redundant validation criteria"
    pass_condition: "each validation unique"
    warning: "Redundant validation: {criteria} already covered"
```

### Validation Output

```yaml
layer3_result:
  status: "pass | fail | warning"
  score: "{0-100}"
  gaps:
    - type: "{gap_type}"
      location: "{step_number}"
      description: "{what is missing}"
      suggestion: "{how to fix}"
  overlaps:
    - type: "{overlap_type}"
      location: "{step_number}"
      description: "{what overlaps}"
      suggestion: "{how to resolve}"
  coverage_score: "{calculated_coverage}"
```

## Layer 4: Governance Validation

Validates compliance with iDumb governance principles.

### Chain Integrity

```yaml
chain_checks:
  hierarchy_respected:
    check: "Delegation chain follows hierarchy"
    valid_chains:
      - ["coordinator", "governance", "validator", "builder"]
      - ["governance", "validator", "builder"]
      - ["validator", "builder"]
    invalid_chains:
      - ["coordinator", "builder"]  # skip levels
      - ["validator", "coordinator"]  # upward delegation
    pass_condition: "chain is valid"
    fail_message: "Invalid delegation chain: {chain}"

  depth_limit:
    check: "Delegation depth within limits"
    max_depth: 4
    pass_condition: "depth <= max_depth"
    fail_message: "Delegation depth {depth} exceeds limit {max_depth}"

  no_self_delegation:
    check: "Agent does not delegate to itself"
    pass_condition: "agent != delegated_agent"
    fail_message: "Self-delegation detected: @{agent} → @{agent}"
```

### Permission Alignment

```yaml
permission_checks:
  action_matches_permission:
    check: "Step action matches agent permissions"
    pass_condition: "agent.permission.{action} = allow"
    fail_message: "Agent @{agent} cannot perform {action}"

  scope_respected:
    check: "Agent stays within defined scope"
    scopes:
      meta: [".idumb/**", "src/templates/**", "src/config/**"]
      project: ["src/**", "test/**", "docs/**"]
    pass_condition: "file operations within scope"
    fail_message: "Agent @{agent} exceeded scope: {path}"

  write_permission_justified:
    check: "Write operations have documented justification"
    pass_condition: "write operation has reason field"
    warning: "Write operation without justification: {path}"
```

### Context Requirements

```yaml
context_checks:
  state_read_before_action:
    check: "State is read before modification"
    pass_condition: "idumb-state read precedes write"
    fail_message: "State modified without reading first"

  anchor_created:
    check: "Critical decisions create anchors"
    pass_condition: "decision step includes idumb-state anchor"
    warning: "Critical decision without anchor: {description}"

  history_recorded:
    check: "Actions are recorded in history"
    pass_condition: "idumb-state history called after action"
    fail_message: "Action not recorded: {action}"
```

### Validation Output

```yaml
layer4_result:
  status: "pass | fail | warning"
  score: "{0-100}"
  chain:
    valid: true
    depth: 3
  permissions:
    violations: []
    warnings: []
  governance:
    anchors_created: 2
    history_entries: 5
    compliance_score: 100
```

## Aggregate Validation Result

```yaml
validation_summary:
  module: "{module_name}"
  version: "{version}"
  timestamp: "{ISO-8601}"
  overall_status: "pass | fail | warning"
  overall_score: "{0-100}"

  layers:
    schema:
      status: "pass"
      score: 100
      duration_ms: 15
    integration:
      status: "pass"
      score: 100
      duration_ms: 45
    completeness:
      status: "warning"
      score: 85
      duration_ms: 120
      issues: ["Orphaned output detected"]
    governance:
      status: "pass"
      score: 100
      duration_ms: 65

  critical_issues: []
  warnings:
    - "Orphaned output: intermediate-result not consumed"
  info: []

  recommendation: "Review orphaned output or mark as final_output"
```

## Validation Scripts

See **`scripts/validate-module.js`** for implementation.

Usage:
```bash
node scripts/validate-module.js .idumb/modules/my-module-2026-02-04.md
```
