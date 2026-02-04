# Agent Hierarchy Reference

Complete agent permission matrix and delegation patterns from iDumb governance.

## Hierarchy Levels

```
Level 1: Supreme Coordinator (idumb-supreme-coordinator)
    │
    ▼ delegates to
Level 2: High Governance (idumb-high-governance)
    │
    ▼ delegates to
Level 3: Low Validator (idumb-low-validator)
    │
    ▼ delegates to
Level 4: Builder (idumb-builder)
```

## Permission Matrix

| Agent Category | edit | write | bash | task | delegate |
|----------------|------|-------|------|------|----------|
| **Coordinators** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Researchers** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Validator** | ❌ | ❌ | read | ❌ | ❌ |
| **Builder** | ✅ | ✅ | ✅ | ❌ | ❌ |

## Agent Definitions

### Level 1: Supreme Coordinator

**Agent:** `@idumb-supreme-coordinator`
**Mode:** `primary`
**Role:** Top-level orchestration

**Permissions:**
```yaml
permission:
  task:
    idumb-high-governance: "allow"
  write: false
  edit: false
  bash: false
```

**Rules:**
- NEVER execute code directly
- NEVER write files directly
- ALWAYS delegate to governance layer
- ALWAYS track what was delegated

**Delegation Template:**
```yaml
agent: "@idumb-high-governance"
context:
  phase: "[current phase from state.json]"
  state_snapshot: "[relevant governance state]"
  anchors: "[critical/high priority anchors]"
requirements:
  constraints: "[what cannot be done]"
  permissions: "[tools allowed for delegation chain]"
  deliverable: "[expected return format]"
tracking:
  delegation_id: "[unique identifier]"
  parent_session: "[for traceability]"
```

### Level 2: High Governance

**Agent:** `@idumb-high-governance`
**Mode:** `all`
**Role:** Mid-level coordination

**Permissions:**
```yaml
permission:
  task:
    idumb-low-validator: "allow"
    idumb-builder: "allow"
  write: false
  edit: false
  bash: false
```

**Rules:**
- Receives delegation from coordinator
- Further delegates to validators/builders
- Synthesizes results from sub-agents
- Reports back to coordinator

**Return Format:**
```yaml
synthesis:
  delegations_made: "[count and targets]"
  results_from:
    validator: "[validation results]"
    builder: "[execution results]"
  overall_status: "pass | fail | partial"
  recommended_next: "[next action or delegation]"
  delegation_id: "[matching coordinator request]"
```

### Level 3: Low Validator

**Agent:** `@idumb-low-validator`
**Mode:** `all`
**Hidden:** `true`
**Role:** Actual validation work

**Permissions:**
```yaml
permission:
  grep: "allow"
  glob: "allow"
  read: "allow"
  bash: "read-only only"
  write: false
  edit: false
  task: false
```

**Capabilities:**
- grep, glob, file reads
- Test execution
- Structure validation
- Evidence gathering

**Return Format:**
```yaml
validation:
  check: "[what was checked]"
  status: "pass | fail | partial"
  evidence: "[proof of validation]"
  details: "[explanation of findings]"
  files_examined: "[list of files checked]"
```

### Level 4: Builder

**Agent:** `@idumb-builder`
**Mode:** `all`
**Hidden:** `true`
**Role:** Actual execution work

**Permissions:**
```yaml
permission:
  write: true
  edit: true
  bash: true
  task: false
```

**Capabilities:**
- File creation, editing, deletion
- Tool execution
- State updates

**Return Format:**
```yaml
execution:
  action: "[what was done]"
  files:
    modified: "[list of changed files]"
    created: "[list of new files]"
    deleted: "[list of removed files]"
  status: "success | partial | failed"
  changes: "[summary of modifications]"
  verification: "[how to verify the change]"
```

## Valid Delegation Patterns

```yaml
valid_coordinator_delegations:
  - "@idumb-high-governance"
  purpose: "Mid-level coordination"

valid_governance_delegations:
  - "@idumb-low-validator"
    purpose: "Validation and evidence gathering"
  - "@idumb-builder"
    purpose: "File operations and execution"

forbidden_patterns:
  - "coordinator → builder"     # Skips governance and validator
  - "coordinator → validator"   # Skips governance layer
  - "governance → coordinator"  # Upward delegation
  - "validator → builder"       # Validator cannot delegate
  - "builder → any"             # Builder cannot delegate
```

## Delegation Depth Tracking

```yaml
depth_levels:
  0: "Root session (user)"
  1: "Primary agent (coordinator)"
  2: "Mid-level (governance)"
  3: "Validator"
  4: "Builder"

rules:
  max_depth: 4
  depth_exceeded: "Indicates potential loop"
  each_delegation: "Increments depth by 1"
  return: "Decrements depth by 1"
```

## Agent Categories

### Coordinators (delegation only, no file ops)

- `idumb-supreme-coordinator` - Top-level orchestration
- `idumb-high-governance` - Mid-level coordination
- `idumb-executor` - Phase execution management
- `idumb-verifier` - Verification coordination
- `idumb-debugger` - Debug coordination

### Planners/Researchers (read-only analysis)

- `idumb-planner`, `idumb-plan-checker`, `idumb-roadmapper`
- `idumb-project-researcher`, `idumb-phase-researcher`, `idumb-codebase-mapper`

### Workers (leaf nodes)

- `idumb-low-validator` - Read-only validation
- `idumb-builder` - **ONLY** agent that can write/edit files

## Expert-Skeptic Mode

When operating in expert-skeptic mode:

```yaml
verification_rules:
  - "Never assume file contents are current"
  - "Always check timestamps"
  - "Never trust state is consistent"
  - "Always validate structure"
  - "Never trust context survives compaction"
  - "Always anchor critical decisions"
  - "Never trust previous agent conclusions"
  - "Always verify with evidence"
```
