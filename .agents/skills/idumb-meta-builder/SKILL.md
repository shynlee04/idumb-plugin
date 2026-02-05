---
name: idumb-meta-builder
description: Meta-skill for idumb-builder agent to transform confusing specifications into structured iDumb workflow modules with checkpoints, validation, and integration points. Use when creating reusable workflows, handling overlapping specs, or generating governance modules under .idumb/modules/. This skill enforces the iDumb vision: spec-driven development, context-first validation, drift detection, and hierarchical coordination.
version: 1.0.0
license: MIT
metadata:
  audience: ai-agents
  workflow: meta-workflow-generation
  consumes: user-specifications
  produces: idumb-modules
---

# iDumb Meta-Builder

Meta-skill for transforming unstructured, overlapping, or confusing user specifications into structured, governance-compliant workflow modules.

`★ Insight ─────────────────────────────────────`
- **Spec clarity emerges from structure**: Confusing inputs become actionable through classification → parsing → structuring → validation
- **Module reusability requires standardization**: Every generated module follows identical schema for composability
- **Governance survives context loss**: Modules embed their own validation rules and integration checkpoints
`─────────────────────────────────────────────────`

## Vision

The iDumb framework operates on **spec-driven development**:

1. **Input**: User provides specification (may be unorganized, overlapping, verbose)
2. **Process**: Meta-builder parses, classifies, and structures into iDumb module
3. **Output**: Reusable workflow module with validation, checkpoints, integration points
4. **Validation**: Module can be validated independently, composed with others, tracked for drift

## Core Principles

### 1. Parse, Then Clarify

```yaml
entry_protocol:
  1_parse_classify:
    action: "Analyze spec for patterns"
    detect:
      - workflow_type: "planning | execution | validation | integration"
      - complexity: "simple | moderate | complex"
      - overlaps: "conflicting_requirements | redundant_sections | gaps"
    output: classification_result

  2_generate_draft:
    action: "Create structured module from classification"
    uses: "references/module-schema.md"
    output: ".idumb/modules/{name}-{date}.md"

  3_validate:
    action: "Run validation against draft"
    uses: "scripts/validate-module.js"
    iterates: "until 100% coverage or user accepts warnings"
```

### 2. Module Schema Compliance

Every generated module MUST include:

| Section | Required | Purpose |
|---------|----------|---------|
| YAML Frontmatter | Yes | Metadata, type, dependencies, validation |
| Overview | Yes | Goal, approach, context |
| Workflow Steps | Yes | Ordered, conditional, with agent bindings |
| Checkpoints | Yes | State validation points |
| Integration Points | Yes | Agents, tools, commands used |
| Validation Criteria | Yes | Success/failure determination |
| Drift Detection | Yes | How to detect divergence |

### 3. Non-Overlapping Design

```yaml
overlap_detection:
  scan_for:
    - "Duplicate workflow steps (same action, different wording)"
    - "Conflicting agent assignments (same task, different agents)"
    - "Redundant validation criteria"

  resolution:
    - "Merge duplicates into single authoritative step"
    - "Flag conflicts for user resolution"
    - "Create dependency hierarchy for related but distinct items"
```

### 4. Gap Analysis

```yaml
gap_detection:
  scan_for:
    - "Unmentioned prerequisites (step references undefined state)"
    - "Missing exit conditions (workflow has no end)"
    - "Orphaned outputs (produced but never consumed)"
    - "Undefined agent roles (agent without permissions)"

  resolution:
    - "Insert placeholder with TODO for undefined prerequisites"
    - "Require explicit exit conditions"
    - "Create consumer or mark as final output"
    - "Check agent permissions or suggest alternative"
```

## Usage Workflow

### Step 1: Receive Specification

```yaml
input:
  spec: "User-provided text (markdown, plain text, or mixed)"
  context:
    - current_phase: "from .idumb/brain/state.json"
    - existing_modules: "from .idumb/modules/"
    - agent_permissions: "from src/agents/"
```

### Step 2: Classify Specification

```yaml
classification:
  workflow_type:
    planning: "Creates roadmaps, phase plans, task breakdowns"
    execution: "Implements features, runs commands, modifies files"
    validation: "Checks compliance, runs tests, verifies artifacts"
    integration: "Connects components, defines interfaces, routes data"

  complexity:
    simple: "Single agent, < 5 steps, linear flow"
    moderate: "2-3 agents, 5-10 steps, some branching"
    complex: "4+ agents, 10+ steps, multiple branches/loops"

  priority: "critical | high | normal | low"
```

### Step 3: Generate Module Draft

```yaml
module_template: "references/module-schema.md"
output_location: ".idumb/modules/{name}-{YYYY-MM-DD}.md"

naming_convention:
  format: "{action}-{entity}-{version}"
  examples:
    - "spec-validation-phase1-2026-02-04.md"
    - "workflow-execution-plan-phase2-2026-02-04.md"
```

### Step 4: Validate Draft

```yaml
validation_layers:
  1_schema_validation:
    tool: "idumb-validate frontmatter --type=module"
    checks: "required fields present, valid values"

  2_integration_validation:
    tool: "idumb-validate integrationPoints"
    checks: "agents exist, tools available, commands defined"

  3_completeness_validation:
    tool: "idumb-validate coverage"
    checks: "no gaps, no overlaps, exit conditions defined"

  4_governance_validation:
    tool: "idumb-validate chain"
    checks: "hierarchy respected, permissions match"
```

### Step 5: Iterate to Completion

```yaml
iteration_protocol:
  max_iterations: 5
  on_fail:
    - "Identify specific validation failure"
    - "Propose resolution (with options)"
    - "Apply fix and re-validate"
    - "After max fails, present to user for decision"

  completion_criteria:
    - "All validations pass"
    - "User explicitly accepts with warnings"
    - "Coverage score = 100%"
```

## Module Schema

See **`references/module-schema.md`** for complete schema definition.

Quick reference:
```yaml
---
type: module
name: "{module-name}"
version: "1.0.0"
workflow_type: "planning|execution|validation|integration"
complexity: "simple|moderate|complex"
created: "{ISO-8601 date}"
created_by: "idumb-builder"
validated_by: "idumb-skeptic-validator"
coverage_score: "{0-100}"
dependencies: []
agents_required: []
tools_required: []
commands_required: []
---
```

## Integration Points

### Consumes From

| Source | Purpose |
|--------|---------|
| User input | Raw specification to structure |
| `.idumb/brain/state.json` | Current phase, context |
| `.idumb/modules/` | Existing modules for composition |
| `src/agents/` | Agent permission validation |

### Produces To

| Output | Location | Format |
|--------|----------|--------|
| Workflow modules | `.idumb/modules/` | Markdown with YAML |
| Validation reports | `.idumb/brain/governance/validations/` | JSON |
| Module index | `.idumb/modules/INDEX.md` | Markdown |

### Delegates To

```yaml
delegation_patterns:
  parse_complex_spec:
    agent: "idumb-planner"
    reason: "Extract structure from unorganized input"

  validate_integration:
    agent: "idumb-integration-checker"
    reason: "Verify agent/tool/command bindings"

  challenge_assumptions:
    agent: "idumb-skeptic-validator"
    reason: "Detect gaps and overlaps"

  write_files:
    # idumb-builder writes directly (leaf node for META paths)
    agent: "self"
    reason: "Builder writes module files to .idumb/modules/"
```

## Additional Resources

### Reference Files

- **`references/module-schema.md`** - Complete module schema with all fields
- **`references/validation-patterns.md`** - Validation layer definitions
- **`references/integration-checklist.md`** - Agent/tool/command binding rules
- **`references/drift-detection.md`** - How modules detect divergence

### Examples

- **`examples/spec-to-module.md`** - Full transformation example
- **`examples/overlap-resolution.md`** - Handling conflicting requirements
- **`examples/gap-filling.md`** - Detecting and filling missing pieces
- **`examples/composition.md`** - Combining multiple modules

### Scripts

- **`scripts/validate-module.js`** - Module validation runner
- **`scripts/detect-overlaps.js`** - Overlap detection utility
- **`scripts/detect-gaps.js`** - Gap analysis utility
- **`scripts/index-modules.js`** - Generate module index

## Quick Reference

### Validation Checklist

```yaml
pre_generation:
  - [ ] Read current state from .idumb/brain/state.json
  - [ ] Check for conflicting existing modules
  - [ ] Identify all agents, tools, commands referenced
  - [ ] Classify workflow type and complexity

post_generation:
  - [ ] Module file created at .idumb/modules/
  - [ ] YAML frontmatter valid against schema
  - [ ] All workflow steps have agent bindings
  - [ ] Checkpoints defined at minimum granularity
  - [ ] Integration points validated against existing
  - [ ] No overlapping sections detected
  - [ ] No gaps in workflow logic
  - [ ] Exit conditions explicitly defined
  - [ ] Module added to INDEX.md
  - [ ] State history updated with module creation
```

### Command Integration

```yaml
related_commands:
  - "/idumb:init" - Initialize governance (creates idumb-modules/)
  - "/idumb:status" - Show current modules and their state
  - "/idumb:validate" - Validate all modules
  - "/idumb:debug" - Debug module integration issues
```

---

`★ Insight ─────────────────────────────────────`
- The meta-builder skill IS the governance layer for spec clarity
- By enforcing standard schema, it enables module composition without human coordination
- Every module becomes a "checkpoint" in itself—validated, versioned, drift-detected
- This transforms "confusing specs" from obstacles into structured governance artifacts
`─────────────────────────────────────────────────`
