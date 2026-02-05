# Transformation Rules Reference

Complete mapping tables for transforming external framework patterns into iDumb-compatible components.

## Agent Transformations

### BMAD Agent → iDumb Agent

```yaml
source:
  file_pattern: "*.agent.yaml"
  location: "src/agents/{module}/"

target:
  file_pattern: "idumb-{category}.md"
  location: "src/agents/"

mappings:
  # Metadata Mapping
  agent.metadata.id:
    transform: "Extract category from path"
    target: "agent hierarchy level"
    rules:
      "bmb/agents/": "high-governance"
      "workflow-builder": "mid-coordinator"
      "agent-builder": "builder"

  agent.metadata.name:
    transform: "Preserve, add idumb- prefix"
    target: "agent name"
    example: "Bond → idumb-framework-builder"

  agent.metadata.title:
    transform: "Preserve as description"
    target: "agent description field"

  # Persona Mapping
  agent.persona.role:
    transform: "Preserve core, add governance context"
    target: "persona.role"

  agent.persona.identity:
    transform: "Add iDumb hierarchy awareness"
    target: "persona.identity"
    addition: "Understands position in delegation chain"

  agent.persona.principles:
    transform: "Preserve, add iDumb principles"
    target: "persona.principles"
    additions:
      - "Respect chain enforcement rules"
      - "Use hierarchical delegation"
      - "Maintain state.json tracking"

  # Menu Mapping
  agent.menu:
    transform: "Convert to iDumb commands"
    target: "src/commands/idumb/*.md"
    rules:
      - "Each menu item becomes a command"
      - "Exec path → command delegation"
      - "Add chain enforcement to command"

  # Sidecar Mapping
  agent.hasSidecar: true:
    transform: "Convert to iDumb skill"
    target: "src/skills/{agent-name}/"
    rules:
      - "Sidecar content → skill references/"
      - "Instructions → SKILL.md body"
      - "Data → skill examples/"
```

### Agent Permission Mapping

```yaml
permission_translation:
  source_behavior: target_permission

  # BMAD agent categories to iDumb hierarchy levels
  creation_agent:
    category: "Creates entities (agents, workflows)"
    target_level: "Level 2 - High Governance"
    target_agent: "idumb-high-governance"
    permissions:
      task: true
      write: false  # Must delegate to builder
      edit: false
      bash: false
      delegate: true

  validation_agent:
    category: "Validates structures"
    target_level: "Level 3 - Low Validator"
    target_agent: "idumb-low-validator"
    permissions:
      task: false
      write: false
      edit: false
      bash: "read-only"
      delegate: false

  coordinator_agent:
    category: "Orchestrates workflows"
    target_level: "Level 1 - Supreme Coordinator"
    target_agent: "idumb-supreme-coordinator"
    permissions:
      task: true
      write: false
      edit: false
      bash: false
      delegate: true

  builder_agent:
    category: "Writes files"
    target_level: "Level 4 - Builder"
    target_agent: "idumb-builder"
    permissions:
      task: false
      write: true
      edit: true
      bash: true
      delegate: false
```

## Workflow Transformations

### BMAD Workflow → iDumb Workflow

```yaml
source:
  directory_pattern: "workflow-name/"
  structure:
    - workflow.md (entry)
    - steps-c/ (create)
    - steps-e/ (edit)
    - steps-v/ (validate)
    - data/ (references)
    - templates/ (outputs)

target:
  file_pattern: "{workflow-name}.md"
  location: "src/workflows/"

mappings:
  # Entry Point Transformation
  workflow.md:
    transform: "Convert to iDumb workflow"
    additions:
      - "Chain enforcement section"
      - "Delegation depth tracking"
      - "State.json integration"
      - "Checkpoint boundaries"

  # Step Transformation
  steps-c/*:
    transform: "Merge into single workflow with conditional steps"
    target: "## Workflow Steps (Create)"
    additions:
      - "Agent binding per step"
      - "Chain rule validation"
      - "Checkpoint after step"

  steps-e/*:
    transform: "Merge into single workflow with conditional steps"
    target: "## Workflow Steps (Edit)"
    additions:
      - "File validation before edit"
      - "Backup checkpoint"

  steps-v/*:
    transform: "Convert to validation section"
    target: "## Validation Criteria"
    additions:
      - "iDumb validation layers"
      - "Chain compliance checks"

  # Data Transformation
  data/*:
    transform: "Move to references/ within skill or workflow docs"
    target: "Inline in workflow or skill references/"

  # Templates Transformation
  templates/*:
    transform: "Move to src/templates/ or skill assets/"
    target: "src/templates/{workflow-name}/"
```

### Workflow State Integration

```yaml
state_injection:
  # Frontmatter Addition
  add_to_frontmatter:
    - "phase: from state.json"
    - "last_checkpoint: reference"
    - "requires_chain_validation: true"

  # Pre-Execution Checkpoint
  add_before_step_1:
    type: "checkpoint"
    action: "Read state.json, verify phase alignment"

  # Mid-Execution Checkpoints
  add_after_critical_steps:
    type: "checkpoint"
    action: "Create checkpoint, update state.json"

  # Post-Execution Checkpoint
  add_at_completion:
    type: "checkpoint"
    action: "Final state update, history recording"
```

### Chain Enforcement Integration

```yaml
chain_rules_for_workflows:
  # MUST-BEFORE Rules
  add_to_workflow:
    - rule: "WORKFLOW-01"
      command: "/workflow execution"
      must_before:
        - exists: ".idumb/brain/state.json"
        - exists: "PLAN.md for execution workflows"

  # SHOULD-BEFORE Rules
  add_to_workflow:
    - rule: "WORKFLOW-02"
      command: "/workflow validation"
      should_before:
        - exists: "CONTEXT.md for context-heavy workflows"
```

## Tool Transformations

### External Script → iDumb Tool

```yaml
source:
  file_patterns: ["*.sh", "*.js", "*.py"]
  location: "bin/", "src/_module-installer/", "scripts/"

target:
  file_pattern: "idumb-{tool-name}.ts"
  location: "src/tools/"

mappings:
  # Input Parameters
  function_parameters:
    transform: "Convert to tool parameters"
    target: "tool() function parameters"
    addition: "Add stateDir parameter for iDumb integration"

  # Execution Logic
  function_body:
    transform: "Preserve core logic"
    additions:
      - "Add state read/write calls"
      - "Add history recording"
      - "Add checkpoint integration"

  # Output Format
  return_value:
    transform: "Return structured object"
    target: "{ success: boolean, data: any, error?: string }"
    addition: "Include state update instructions"

  # Error Handling
  error_handling:
    transform: "Never throw, return error object"
    target: "Try-catch with error return"
    addition: "Log to governance history"
```

### State Integration Patterns

```yaml
state_operations:
  # Read State
  read_state:
    function: "readState(stateDir)"
    purpose: "Get current governance state"
    use_case: "Before any governance operation"

  # Write State
  write_state:
    function: "writeState(stateDir, updates)"
    purpose: "Update governance state"
    use_case: "After state change operation"

  # Record History
  record_history:
    function: "recordHistory(stateDir, action, result)"
    purpose: "Log action to governance history"
    use_case: "After any tool operation"

  # Get Anchors
  get_anchors:
    function: "getAnchors(stateDir, priority?)"
    purpose: "Get context anchors"
    use_case: "Before context-critical operations"
```

## Governance Transformations

### BMAD Module → iDumb Module

```yaml
source:
  file: "module.yaml"
  structure:
    - name
    - description
    - version
    - components (agents, workflows)

target:
  file: ".idumb/modules/{module-name}-{date}.md"
  structure:
    - YAML frontmatter (type, name, version, etc.)
    - Overview
    - Workflow Steps
    - Checkpoints
    - Integration Points
    - Validation Criteria
    - Error Handling

mappings:
  module.name → module.name (kebab-case)
  module.description → Overview.Goal
  module.components.agents → agents_required array
  module.components.workflows → Workflow Steps
  module.version → module.version (semver)

  additions:
    - "coverage_score: 0-100"
    - "status: draft|validated|approved|deprecated"
    - "created: ISO-8601 timestamp"
    - "created_by: idumb-builder"
    - "validated_by: validator agent"
```

### State File Transformation

```yaml
# BMAD Frontmatter Variables → iDumb state.json
source:
  workflow_path: "{project-root}/_bmad/[module]/workflows/[name]"
  stepsCompleted: ['step-01', 'step-02']
  lastStep: 'step-02'
  lastContinued: '2025-01-02'

target:
  .idumb/brain/state.json:
    version: "0.2.0"
    phase: "current phase"
    lastValidation: "ISO timestamp"
    validationCount: 0
    anchors: [{...}]
    history: [{timestamp, action, agent, result}]

mappings:
  stepsCompleted → history entries
  lastStep → current_workflow_step
  lastContinued → lastValidation
  workflow_path → context.project_root
```

### Checkpoint Transformation

```yaml
# BMAD Checkpoint → iDumb Checkpoint
source:
  format: "Pre/Post checkpoint in workflow"
  content: "State snapshot"

target:
  location: ".idumb/brain/execution/{phase}/checkpoint-{id}.json"
  format:
    checkpoint_id: string
    timestamp: ISO-8601
    phase: string
    state_snapshot: {...}
    artifacts: [paths]
    rollback_point: boolean

mappings:
  Pre-Execution → pre_execution: true
  Post-Execution → post_execution: true
  Mid-Execution → mid_execution: true, step_number: N
```

## Naming Convention Transformations

```yaml
agent_naming:
  source: "{name}.agent.yaml"
  target: "idumb-{category}.md"
  examples:
    "bond.agent.yaml" → "idumb-framework-builder.md"
    "module-builder.agent.yaml" → "idumb-high-governance.md"

workflow_naming:
  source: "{workflow}/workflow.md"
  target: "{workflow}.md"
  examples:
    "agent/workflow.md" → "agent-creation.md"
    "module/workflow.md" → "module-creation.md"

tool_naming:
  source: "{name}.sh" or "{name}.js"
  target: "idumb-{name}.ts"
  examples:
    "installer.js" → "idumb-install.ts"
    "validator.sh" → "idumb-validate.ts"
```

## Validation Transformation Rules

```yaml
schema_validation:
  # Agent Validation
  agent_required_fields:
    - name
    - description
    - mode
    - permission
    - tools

  # Workflow Validation
  workflow_required_sections:
    - Overview
    - Workflow Steps
    - Checkpoints
    - Integration Points
    - Validation Criteria

  # Tool Validation
  tool_required_exports:
    - tool function wrapper
    - error handling
    - state integration

governance_validation:
  # Hierarchy Check
  agent_hierarchy:
    - "Verify agent level matches permissions"
    - "Check delegation chain integrity"
    - "Validate tool access permissions"

  # Chain Enforcement
  chain_rules:
    - "Verify MUST-BEFORE prerequisites"
    - "Check SHOULD-BEFORE recommendations"
    - "Validate enforcement level (HARD_BLOCK, SOFT_BLOCK, WARN)"
```

## Transformation Complexity Matrix

| Pattern Type | Complexity | Automation Level | Human Review Required |
|--------------|------------|------------------|----------------------|
| Agent metadata | Low | Full | Minimal |
| Agent personas | Medium | Partial | Medium |
| Menu → Commands | Low | Full | Minimal |
| Workflow structure | High | Partial | High |
| State integration | Medium | Full | Low |
| Checkpoints | Low | Full | Minimal |
| Tools | Medium | Partial | Medium |
| Governance | High | Partial | High |

## Self-Evolving Rules

```yaml
rule_learning:
  # On Validation Success
  success:
    action: "Strengthen rule confidence"
    update: "Increase automation level for similar patterns"

  # On Validation Failure
  failure:
    action: "Create new rule variant"
    update: "Add exception to transformation rule"

  # On Human Correction
  correction:
    action: "Add to transformation rules"
    update: "Create new mapping for corrected pattern"
```
