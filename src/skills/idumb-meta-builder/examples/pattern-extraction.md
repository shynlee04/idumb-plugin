# Pattern Extraction Example

Demonstrates how to systematically extract patterns from an external meta-framework.

## Process Overview

```yaml
extraction_pipeline:
  1_scan:
    action: "Recursive file system scan"
    output: "File inventory with types and locations"

  2_categorize:
    action: "Group files by pattern type"
    categories: ["agents", "workflows", "tools", "governance"]

  3_analyze:
    action: "Extract structure and behavior from each file"
    output: "Pattern descriptions with examples"

  4_document:
    action: "Create pattern inventory"
    output: "references/framework-patterns.md"
```

## Step 1: Scan Framework

### Input: Framework Path

```
Target: /path/to/bmad-builder-main/
```

### Scan Logic

```javascript
// Pseudo-code for scanning
function scanFramework(path) {
  const inventory = {
    agents: [],
    workflows: [],
    tools: [],
    governance: []
  };

  for (const file of walkDirectory(path)) {
    if (file.includes('.agent.') || file.includes('agent.yaml')) {
      inventory.agents.push(file);
    } else if (file.includes('workflow.md') || file.includes('/workflows/')) {
      inventory.workflows.push(file);
    } else if (file.endsWith('.sh') || file.endsWith('.js')) {
      inventory.tools.push(file);
    } else if (file.includes('config') || file.includes('schema') || file.includes('standards')) {
      inventory.governance.push(file);
    }
  }

  return inventory;
}
```

### Output: File Inventory

```markdown
## Scan Results: BMAD Framework

### Agents (3 files)
- src/agents/agent-builder.agent.yaml
- src/agents/module-builder.agent.yaml
- src/agents/workflow-builder.agent.yaml

### Workflows (15+ files)
- src/workflows/agent/workflow.md
- src/workflows/agent/steps-c/*.md
- src/workflows/agent/steps-v/*.md
- src/workflows/module/workflow.md
- ...

### Tools (5 files)
- src/_module-installer/installer.js
- test/validate-agent-schema.js
- ...

### Governance (8 files)
- docs/_STYLE_GUIDE.md
- src/module.yaml
- test/schema/agent.js
- ...
```

## Step 2: Categorize Patterns

### Pattern Categories

```yaml
entity_patterns:
  - name: "Agent Persona"
    source_files: ["*.agent.yaml"]
    key_features: ["role", "identity", "communication_style", "principles"]

  - name: "Agent Menu"
    source_files: ["*.agent.yaml"]
    key_features: ["trigger", "exec", "description"]

  - name: "Workflow Entry"
    source_files: ["workflow.md"]
    key_features: ["frontmatter", "goal", "role", "principles"]

  - name: "Workflow Steps"
    source_files: ["steps-*/step-*.md"]
    key_features: ["micro-files", "sequential", "self-documenting"]
```

### Category Mapping

```
Discovered Files → Pattern Categories

agent-builder.agent.yaml
├── Agent Persona pattern
├── Agent Menu pattern
└── (no Sidecar pattern - hasSidecar: false)

workflow.md
├── Workflow Entry pattern
└── references Step pattern (by listing step files)

step-01-brainstorm.md
├── Workflow Step pattern
├── Progressive Disclosure pattern
└── Menu Interaction pattern
```

## Step 3: Analyze Structure

### Agent Pattern Analysis

```yaml
file: "agent-builder.agent.yaml"

structure_analysis:
  top_level_key: "agent"
  required_sections:
    - metadata (id, name, title, icon, module)
    - persona (role, identity, communication_style, principles)
    - menu (array of trigger/exec/description)

  optional_sections:
    - discussion (boolean)
    - conversational_knowledge (CSV path)

behavior_analysis:
  persona_driven: "Behavior defined by role + identity + principles"
  menu_triggers: "User invokes via fuzzy-matched triggers"
  workflow_execution: "Each trigger points to workflow.md"

pattern_signature: |
  Persona + Menu = Agent
  Sidecar (optional) extends context
```

### Workflow Pattern Analysis

```yaml
file: "workflow.md"

structure_analysis:
  frontmatter_variables:
    - workflow_path (root for relative paths)
    - thisStepFile (current step)
    - nextStepFile (where to go next)
    - outputFile (where results go)

  body_sections:
    - Goal (what it accomplishes)
    - Role (who AI embodies)
    - Meta-context (background)
    - Architecture Principles (design rules)
    - Initialization (how to start)

behavior_analysis:
  progressive_disclosure: "No step lists, only next step reference"
  jit_loading: "Load nextStepFile only when user continues"
  state_tracking: "Update frontmatter on step completion"

pattern_signature: |
  Entry Point + Step Files = Workflow
  Frontmatter + JIT Loading = Progressive Disclosure
```

### Step Pattern Analysis

```yaml
file: "step-01-brainstorm.md"

structure_analysis:
  size: "80-200 lines (micro-file)"
  focused_concept: "Single idea per step"
  self_documenting: "Instructions include all context"

  typical_sections:
    - Step title
    - Instructions (what to do)
    - Output (what to produce)
    - Menu options (A/P/C)
    - Next step reference

behavior_analysis:
  sequential: "Steps execute in order, no skipping"
  checkpoint: "Each step produces output before next"
  menu_gated: "User must select [C] to continue"

pattern_signature: |
  Micro-file + Single Concept = Step
  Sequential + Menu Gated = Controlled Execution
```

## Step 4: Document Patterns

### Pattern Documentation Format

```markdown
## [Pattern Name]

**Source:** [Framework]
**Files:** [File patterns]
**Complexity:** [Simple/Moderate/Complex]

### Description
[What this pattern does]

### Structure
[File organization and key fields]

### Behavior
[How it operates at runtime]

### Transformation Target
[What this becomes in iDumb]

### Examples
[Concrete instances from source]
```

### Example Documentation

```markdown
## Agent Persona Pattern

**Source:** BMAD
**Files:** `*.agent.yaml`
**Complexity:** Simple

### Description
Defines the behavioral characteristics of an AI agent through role, identity, communication style, and guiding principles.

### Structure
```yaml
agent:
  persona:
    role: string           # Agent's function
    identity: string       # Agent's backstory/expertise
    communication_style: string  # How it speaks
    principles: |          # Behavioral guidelines (multiline)
      - principle_1
      - principle_2
```

### Behavior
- **Persona-driven:** All agent behavior flows from persona definition
- **Principles as constraints:** Agent must not violate its principles
- **Style consistency:** Communication style affects all outputs

### Transformation Target
iDumb agent persona with added hierarchy awareness:
- Add "understands position in delegation chain"
- Add governance principles (chain enforcement, state tracking)
- Preserve role, identity, communication_style

### Examples
- Bond (agent-builder): "Agent Architecture Specialist + BMAD Compliance Expert"
- Module Builder: "Module orchestration with best practices"
```

## Extraction Checklist

```yaml
for_each_pattern:
  identification:
    - [ ] Pattern has clear name
    - [ ] Pattern source identified
    - [ ] Pattern category assigned

  documentation:
    - [ ] Description written
    - [ ] Structure documented
    - [ ] Behavior explained
    - [ ] Examples provided

  transformation:
    - [ ] Target identified
    - [ ] Mapping rules defined
    - [ ] Complexity assessed
    - [ ] Automation possible?

  validation:
    - [ ] Pattern correctly identified
    - [ ] No overlapping patterns
    - [ ] Consistent with framework
    - [ ] Transformable to iDumb
```

## Automated Extraction Script

```bash
# Run pattern extraction
node scripts/extract-patterns.js <framework-path>

# Output locations
.idumb/ingestion/{framework}/
├── discovery.md          # File inventory
├── patterns/
│   ├── agents-inventory.md
│   ├── workflows-inventory.md
│   ├── tools-inventory.md
│   └── governance-inventory.md
└── classification.md     # Categorized patterns
```

## Common Patterns Across Frameworks

| Pattern | BMAD | GSD | iDumb Target |
|---------|------|-----|--------------|
| Persona Definition | ✓ | ✗ | Agent persona with hierarchy |
| Menu Triggers | ✓ | ✗ | Command bindings |
| Progressive Disclosure | ✓ | ✓ | JIT loading in workflows |
| State Tracking | ✓ | ✓ | state.json integration |
| Checkpoints | ✗ | ✓ | Checkpoint system |
| Chain Enforcement | ✗ | ✓ | Chain rules |
| Sidecar Files | ✓ | ✗ | Skills |
| Phase Organization | ✗ | ✓ | Phase planning |

## Pattern Rarity Index

```yaml
unique_to_bmad:
  - Sidecar files (knowledge.csv)
  - Menu-based agent commands
  - Multi-mode workflows (create/edit/validate)

unique_to_gsd:
  - Milestone organization
  - Phase-first planning
  - Explicit continuation format

common_patterns:
  - State tracking
  - Step-based workflows
  - Validation layers
  - Documentation standards
```
