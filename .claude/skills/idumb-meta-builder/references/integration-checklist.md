# Integration Checklist Reference

Rules and patterns for validating agent, tool, and command bindings in iDumb modules.

## Agent Binding Checklist

### Permission Matrix

```yaml
agent_permissions:
  coordinator:
    mode: "primary | all"
    can_delegate: true
    can_write: false
    can_bash: false
    tools: ["idumb-state", "idumb-validate", "idumb-todo"]

  validator:
    mode: "all"
    can_delegate: false
    can_write: false
    can_read: true
    tools: ["grep", "glob", "read", "idump-validate"]

  builder:
    mode: "all"
    can_delegate: false
    can_write: true
    can_bash: true
    scope: "meta only"
    tools: ["write", "edit", "bash", "idump-state"]
```

### Valid Delegation Chains

```yaml
valid_chains:
  - [coordinator, governance, validator, builder]
  - [governance, validator, builder]
  - [validator, builder]

invalid_chains:
  - [coordinator, builder]  # Skip levels
  - [validator, coordinator]  # Upward
  - [builder, validator]  # Wrong direction
```

### Binding Validation Rules

```yaml
rules:
  agent_exists:
    check: "src/agents/{agent-name}.md exists"
    required: true

  agent_mode_matches:
    check: "Agent mode compatible with delegation"
    coordinator_mode: ["primary", "all"]
    worker_mode: ["all"]

  permission_sufficient:
    check: "Agent has permission for required action"
    read_requires: "grep, glob, read tools"
    write_requires: "write, edit tools"
    bash_requires: "bash tool"
    task_requires: "task delegation permission"

  scope_respected:
    check: "Agent operations within defined scope"
    meta_scope: [".idumb/**", "src/templates/**", "src/config/**"]
    project_scope: ["src/**", "test/**", "docs/**"]
```

## Tool Binding Checklist

### Required Tool Exports

```yaml
tool_exports:
  idump-state:
    required: ["read", "write", "anchor", "history"]
    optional: ["getAnchors", "createSession", "modifySession"]

  idump-validate:
    required: ["default"]
    optional: ["structure", "schema", "freshness", "planningAlignment"]

  idump-config:
    required: ["read"]
    optional: ["write"]

  idump-todo:
    required: ["create", "list", "update"]
    optional: ["delete"]

  idump-context:
    required: ["default"]
    optional: ["summary", "patterns"]
```

### Tool Parameter Validation

```yaml
parameter_rules:
  required_params:
    check: "All required parameters provided"
    source: "tool schema definition"

  param_types:
    string: "Must be quoted string"
    number: "Must be numeric (integer or float)"
    boolean: "Must be true or false"
    array: "Must be JSON array or comma-separated"

  param_values:
    enum: "Must be one of allowed values"
    range: "Must be within min/max"
    pattern: "Must match regex pattern"
```

### Tool Availability Check

```yaml
availability:
  tool_file_exists:
    check: "src/tools/idump-{tool-name}.ts exists"

  tool_export_exists:
    check: "export const {export_name} = tool(...)"
    parser: "extract export statements from file"

  tool_wrapper_correct:
    check: "Uses @opencode-ai/plugin tool() wrapper"
    pattern: "tool({"
```

## Command Binding Checklist

### Command Schema Requirements

```yaml
command_schema:
  required_fields:
    - description: "What the command does"
    - agent: "Which agent handles the command"

  optional_fields:
    - triggers: "When command auto-triggers"
    - mode: "all mode"
    - permission: "Permission overrides"
```

### Command-Agent Binding Validation

```yaml
binding_rules:
  agent_exists:
    check: "Referenced agent profile exists"
    location: "src/agents/{agent-name}.md"

  agent_can_handle:
    check: "Agent capabilities match command purpose"
    examples:
      - command: "/idump:init"
        agent: "idump-supreme-coordinator"
        reason: "Top-level initialization requires coordinator"

      - command: "/idump:execute-phase"
        agent: "idump-executor"
        reason: "Execution requires worker agent"

  no_circular_bindings:
    check: "Command does not create delegation loop"
    detect: "Command agent calls same command"
```

### Command Chaining Validation

```yaml
chaining_rules:
  chains_to:
    check: "Target command exists"
    validate: "Command frontmatter defines target"

  chain_conditions:
    check: "Chain conditions are explicit"
    required: ["on_success", "on_failure", "on_partial"]

  auto_chain_safe:
    check: "Auto-chain doesn't create infinite loop"
    detect: "A chains to B, B chains to A"
```

## File I/O Validation

### Read Operations

```yaml
read_validation:
  file_exists:
    check: "File to read exists or is optional"
    action: "skip with warning if optional"

  path_format:
    check: "Path is valid format"
    patterns: ["absolute", "relative", "glob"]

  within_scope:
    check: "Read operation within agent's scope"
    meta_agent_reads: ["src/**", ".idumb/**"]
    project_agent_reads: ["**"]
```

### Write Operations

```yaml
write_validation:
  parent_writable:
    check: "Parent directory exists or can be created"
    action: "create with mkdir -p if needed"

  no_conflict:
    check: "No existing file at path (unless overwrite specified)"
    action: "warn if file exists, confirm overwrite"

  within_scope:
    check: "Write path within agent's allowed scope"
    meta_agent_writes: [".idumb/**", "src/templates/**", "src/config/**"]
    builder_writes: ["scope: meta only"]
```

### Modify Operations

```yaml
modify_validation:
  file_exists:
    check: "File to modify exists"
    required: true

  backup_before:
    check: "Backup created if file is critical"
    critical_files: [".idumb/brain/state.json", ".idump/config.json"]

  atomic_operation:
    check: "Modify is atomic (write temp, then move)"
    recommended: true
```

## Integration Testing Checklist

```yaml
integration_tests:
  mock_agent:
    test: "Agent profile can be loaded"
    verify: "YAML frontmatter parses correctly"

  mock_tool:
    test: "Tool export is accessible"
    verify: "Tool parameters validate"

  mock_command:
    test: "Command can be invoked"
    verify: "Agent binding is valid"

  mock_workflow:
    test: "Module can execute end-to-end"
    verify: "All integration points resolve"
```

## Common Integration Issues

### Issue: Agent Not Found

```yaml
problem: "Referenced agent profile doesn't exist"
detection: "src/agents/{agent-name}.md not found"
resolution:
  - "Create agent profile"
  - "Use different agent"
  - "Make agent optional"
```

### Issue: Permission Denied

```yaml
problem: "Agent lacks required permission"
detection: "agent.permission.{action} != allow"
resolution:
  - "Add permission to agent profile"
  - "Delegate to different agent with permission"
  - "Modify workflow to not require action"
```

### Issue: Tool Export Missing

```yaml
problem: "Tool export not found"
detection: "export const {name} not in tool file"
resolution:
  - "Add export to tool file"
  - "Use different export"
  - "Implement fallback behavior"
```

### Issue: Circular Dependency

```yaml
problem: "Module creates circular delegation"
detection: "A → B → C → A pattern"
resolution:
  - "Reorganize workflow"
  - "Extract shared functionality to separate module"
  - "Break cycle with user decision point"
```
