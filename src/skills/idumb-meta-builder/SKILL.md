---
name: idumb-meta-builder
description: This skill should be used when the user asks to "ingest meta-framework", "transform framework to idumb", "classify framework patterns", "create self-upgrading module", "meta-learning", "framework synthesis", "automated governance enhancement", "pattern extraction", "hierarchical framework analysis", or "iterative framework learning". Essential for idumb-builder to consume external frameworks like BMAD and transform them into iDumb-compatible governance patterns.
version: 2.0.0
license: MIT
metadata:
  audience: ai-agents
  workflow: meta-framework-ingestion
  consumes: external-meta-frameworks
  produces: idumb-modules, agents, workflows, tools
---

# iDumb Meta-Builder

Framework ingestion and transformation system for converting external meta-frameworks into iDumb-compatible governance patterns with self-upgrading capabilities.

`★ Insight ─────────────────────────────────────`
- **Frameworks are pattern languages**: BMAD, GSD, and other meta-frameworks encode distinct patterns that can be extracted, classified, and transformed
- **Transformation preserves intent while adapting structure**: External concepts map to iDumb's hierarchy through systematic pattern translation
- **Self-upgrade comes from pattern feedback**: Each ingestion cycle refines the transformation rules based on validation results
`─────────────────────────────────────────────────`

## Vision

The meta-builder enables iDumb to **learn from any meta-framework**:

1. **Ingest**: Parse external framework structure and patterns
2. **Classify**: Organize concepts into iDumb's hierarchical model
3. **Transform**: Map external patterns to iDumb equivalents
4. **Validate**: Test transformation completeness and correctness
5. **Integrate**: Incorporate into iDumb governance system
6. **Evolve**: Learn from validation results to improve future transformations

## Core Principles

### 1. Framework as Pattern Language

```yaml
framework_analysis:
  structural_patterns:
    - agents: "AI entity definitions with persona/permissions"
    - workflows: "Step-based procedures with state tracking"
    - tools: "Executable utilities for specific tasks"
    - commands: "User-triggerable operations"
    - modules: "Compositional units of functionality"

  behavioral_patterns:
    - delegation: "How entities coordinate with each other"
    - validation: "How correctness is verified"
    - state_management: "How context persists"
    - error_handling: "How failures are managed"
    - chain_enforcement: "How dependencies are enforced"

  governance_patterns:
    - hierarchy: "Authority relationships between entities"
    - permissions: "What operations each entity can perform"
    - checkpoints: "State validation boundaries"
    - rollback: "Recovery from failure states"
```

### 2. Classification Hierarchy

```yaml
pattern_classification:
  level_1_concepts:  # Framework foundations
    - entity_model: "What exists (agents, tools, workflows)"
    - execution_model: "How things run"
    - state_model: "How context persists"
    - governance_model: "How control flows"

  level_2_patterns:  # Interaction patterns
    - creation_patterns: "How entities are built"
    - execution_patterns: "How workflows proceed"
    - validation_patterns: "How correctness ensured"
    - integration_patterns: "How components connect"

  level_3_concrete:  # Implementation details
    - file_structure: "Directory layout conventions"
    - naming_conventions: "Identifier patterns"
    - frontmatter_schemas: "YAML/JSON structures"
    - step_formats: "Workflow step templates"
```

### 3. Transformation Mapping

```yaml
transformation_principles:
  preserve_intent:
    - "Keep the purpose of each pattern"
    - "Adapt the structure to iDumb hierarchy"
    - "Map permissions to iDumb permission matrix"

  adapt_structure:
    - "External agent → iDumb agent (with hierarchy level)"
    - "External workflow → iDumb workflow (with chain enforcement)"
    - "External tools → iDumb tools (with state integration)"
    - "External modules → iDumb modules (with governance)"

  add_governance:
    - "Inject state.json tracking"
    - "Add checkpoint boundaries"
    - "Integrate chain enforcement rules"
    - "Apply hierarchical delegation patterns"
```

### 4. Self-Upgrade Cycle

```yaml
learning_cycle:
  1_ingest:
    action: "Parse external framework"
    output: "pattern_inventory.md"

  2_classify:
    action: "Organize patterns by hierarchy"
    output: "classification_tree.md"

  3_transform:
    action: "Map to iDumb equivalents"
    output: "transformation_map.md"

  4_validate:
    action: "Test transformation correctness"
    output: "validation_report.json"

  5_integrate:
    action: "Incorporate into iDumb system"
    output: "new_agents/, new_workflows/, new_tools/"

  6_evolve:
    action: "Update transformation rules"
    output: "enhanced_transformation_rules.md"
```

## Usage Workflow

### Phase 1: Framework Discovery

```yaml
discovery_process:
  scan_target:
    - framework_root: "Path to external framework"
    - file_types: [".md", ".yaml", ".agent.yaml", ".json"]
    - depth: "Recursive scan"

  identify_components:
    agents: "Files with agent definitions"
    workflows: "Step-based procedure files"
    tools: "Executable scripts/utilities"
    commands: "User-triggerable operations"
    modules: "Compositional units"

  extract_metadata:
    - "File count and structure"
    - "Naming conventions"
    - "Schema patterns"
    - "Dependency relationships"
```

### Phase 2: Pattern Extraction

```yaml
pattern_extraction:
  for_agents:
    extract:
      - persona_definition
      - permission_model
      - menu_triggers
      - discussion_style

  for_workflows:
    extract:
      - step_structure
      - state_tracking
      - continuation_model
      - output_patterns

  for_tools:
    extract:
      - input_parameters
      - execution_logic
      - output_format
      - error_handling

  for_governance:
    extract:
      - hierarchy_levels
      - chain_rules
      - validation_criteria
      - rollback_procedures
```

### Phase 3: Classification

```yaml
classification_output:
  pattern_inventory:
    location: ".idumb/ingestion/{framework}-patterns/"
    files:
      - "agents-inventory.md"
      - "workflows-inventory.md"
      - "tools-inventory.md"
      - "governance-inventory.md"

  classification_tree:
    format: "hierarchical markdown"
    structure:
      level_1: "Concept categories"
      level_2: "Pattern families"
      level_3: "Concrete implementations"
```

### Phase 4: Transformation

```yaml
transformation_process:
  map_agents:
    input: "external agent definition"
    output: "iDumb agent profile"
    mappings:
      persona: "agent persona (preserved)"
      permissions: "mapped to iDumb hierarchy level"
      triggers: "converted to iDumb command bindings"
      sidecars: "converted to iDumb skills"

  map_workflows:
    input: "external workflow"
    output: "iDumb workflow with chain enforcement"
    additions:
      - state.json integration
      - checkpoint boundaries
      - chain rule validation
      - hierarchical delegation

  map_tools:
    input: "external tool/script"
    output: "iDumb tool with state integration"
    additions:
      - state read/write
      - history recording
      - checkpoint integration

  map_governance:
    input: "external governance model"
    output: "iDumb chain enforcement rules"
    additions:
      - MUST-BEFORE dependencies
      - SHOULD-BEFORE recommendations
      - HARD_BLOCK/SOFT_BLOCK/WARN levels
```

### Phase 5: Validation

```yaml
validation_layers:
  schema_validation:
    tool: "idumb-validate schema"
    checks: "YAML frontmatter valid"

  integration_validation:
    tool: "idumb-validate integration"
    checks: "Agent/tool/command bindings valid"

  governance_validation:
    tool: "idumb-validate chain"
    checks: "Hierarchy respected, permissions match"

  completeness_validation:
    tool: "idumb-validate coverage"
    checks: "No gaps, all patterns transformed"
```

### Phase 6: Integration

```yaml
integration_process:
  create_agents:
    destination: "src/agents/"
    naming: "idumb-{transformed-name}.md"

  create_workflows:
    destination: "src/workflows/"
    naming: "{transformed-name}.md"

  create_tools:
    destination: "src/tools/"
    naming: "idumb-{transformed-name}.ts"

  create_skills:
    destination: "src/skills/"
    naming: "{framework-pattern}/"

  update_index:
    - "Add to AGENTS.md"
    - "Add to SKILLS.md"
    - "Update chain enforcement rules"
```

### Phase 7: Evolution

```yaml
self_upgrade_process:
  collect_feedback:
    - "Validation failures"
    - "Integration issues"
    - "User corrections"

  update_transformation_rules:
    file: "references/transformation-rules.md"
    action: "Add new mapping based on feedback"

  regenerate:
    trigger: "When transformation rules updated"
    action: "Re-run transformation on affected patterns"

  version_control:
    - "Tag transformation version"
    - "Track validation score improvement"
    - "Archive failed transformations for analysis"
```

## Framework Pattern Library

See **`references/framework-patterns.md`** for detailed pattern inventory from known frameworks.

Currently analyzed frameworks:
- **BMAD**: Builder Module for AI Development
- **GSD**: Get Shit Done
- *(More frameworks added through ingestion)*

## Transformation Rules

See **`references/transformation-rules.md`** for complete mapping tables.

Quick reference:
```yaml
agent_transformations:
  external_agent.built_with: "bmb" → idumb-framework-builder
  external_agent.category: "creation" → idumb-builder
  external_agent.discussion: true → add "discussion: true" to iDumb agent

workflow_transformations:
  workflow.steps-c → workflow.steps (create)
  workflow.steps-e → workflow.steps (edit)
  workflow.steps-v → workflow.steps (validate)
  workflow.menu_pattern → chain enforcement rules

governance_transformations:
  framework.state → idumb state.json
  framework.checkpoints → idumb checkpoints + anchors
  framework.validation → idumb validation layers
```

## Self-Upgrade Automation

### Script-Based Learning

```bash
# Run full ingestion cycle
node scripts/ingest-framework.js <framework-path>

# Transform specific component
node scripts/transform-component.js <component-type> <input-path>

# Validate transformation
node scripts/validate-transformation.js <output-path>

# Evolve transformation rules
node scripts/evolve-rules.js <validation-report>
```

See **`scripts/`** directory for complete automation suite.

## Additional Resources

### Reference Files

- **`references/framework-patterns.md`** - Complete pattern inventory from ingested frameworks
- **`references/transformation-rules.md`** - Mapping tables for all transformations
- **`references/classification-tree.md`** - Hierarchical pattern organization
- **`references/validation-patterns.md`** - How to validate transformations
- **`references/self-upgrade-protocol.md`** - Learning and evolution rules

### Example Files

- **`examples/bmad-to-idumb.md`** - Complete BMAD → iDumb transformation
- **`examples/pattern-extraction.md`** - How to extract patterns from frameworks
- **`examples/classification-example.md`** - Pattern classification in action
- **`examples/validation-example.md`** - Transformation validation workflow

### Scripts

- **`scripts/ingest-framework.js`** - Full framework ingestion pipeline
- **`scripts/extract-patterns.js`** - Pattern extraction utility
- **`scripts/transform-agent.js`** - Agent transformation
- **`scripts/transform-workflow.js`** - Workflow transformation
- **`scripts/validate-transformation.js`** - Validation runner
- **`scripts/evolve-rules.js`** - Self-upgrade rule learner

### Templates

- **`templates/agent-template.md`** - iDumb agent structure
- **`templates/workflow-template.md`** - iDumb workflow structure
- **`templates/tool-template.ts`** - iDumb tool structure
- **`templates/skill-template.md`** - iDumb skill structure

## Quick Reference

### Ingestion Commands

```yaml
discover:
  command: "node scripts/ingest-framework.js discover <path>"
  output: ".idumb/ingestion/{framework}/discovery.md"

extract:
  command: "node scripts/ingest-framework.js extract <framework>"
  output: ".idumb/ingestion/{framework}/patterns/"

classify:
  command: "node scripts/ingest-framework.js classify <framework>"
  output: ".idumb/ingestion/{framework}/classification.md"

transform:
  command: "node scripts/ingest-framework.js transform <framework>"
  output: "src/{agents,workflows,tools,skills}/"

validate:
  command: "node scripts/validate-transformation.js <output-path>"
  output: ".idumb/governance/validations/{report}.json"

integrate:
  command: "node scripts/ingest-framework.js integrate <framework>"
  output: "Updated src/ with new components"
```

### Delegation Patterns

```yaml
for_complex_framework:
  agent: "idumb-high-governance"
  reason: "Coordinate multi-component ingestion"

  sub_delegations:
    - agent: "idumb-project-researcher"
      task: "Analyze framework structure and documentation"

    - agent: "idumb-phase-researcher"
      task: "Extract and classify patterns"

    - agent: "idumb-planner"
      task: "Create transformation plan"

    - agent: "idumb-builder"
      task: "Generate transformed components"
```

---

`★ Insight ─────────────────────────────────────`
- The meta-builder transforms iDumb into a learning system that grows with each framework ingested
- Framework patterns become reusable transformation rules stored in references/
- Each successful ingestion expands iDumb's capability to understand and integrate new systems
- Self-upgrade comes from validation feedback driving transformation rule refinement
`─────────────────────────────────────────────────`
