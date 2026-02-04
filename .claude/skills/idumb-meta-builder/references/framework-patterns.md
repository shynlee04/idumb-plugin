# Framework Patterns Reference

Complete pattern inventory from ingested meta-frameworks, organized by classification hierarchy.

## BMAD (Builder Module for AI Development)

### Entity Model

#### Agents

**File Pattern:** `*.agent.yaml`

**Schema:**
```yaml
agent:
  metadata:
    id: string              # Unique identifier
    name: string            # Display name
    title: string           # Formal title
    icon: emoji             # Visual identifier
    module: string          # Parent module
    hasSidecar: boolean     # Has additional context files

  persona:
    role: string            # Agent's function
    identity: string        # Agent's backstory/expertise
    communication_style: string  # How it speaks
    principles: |           # Behavioral guidelines (multiline)
      - principle_1
      - principle_2

  discussion: boolean       # Enables conversational mode
  conversational_knowledge: # CSV file for context
    - "path/to/knowledge.csv"

  menu:                     # Triggerable actions
    - trigger: string       # What user types
      exec: string          # Workflow to execute
      description: string   # Help text
```

**Key Patterns:**
- Persona-driven behavior (role + identity + principles)
- Menu-based command system
- Optional sidecar files for extended context
- Conversational knowledge via CSV

#### Workflows

**Directory Structure:**
```
workflow-name/
├── workflow.md              # Entry point
├── steps-c/                 # Create flow
│   ├── step-01-init.md
│   └── step-N-[name].md
├── steps-e/                 # Edit flow
├── steps-v/                 # Validate flow
├── data/                    # Shared references
└── templates/               # Output templates
```

**workflow.md Schema:**
```yaml
---
name: workflow-name
description: What this workflow does
web_bundle: optional-bundle
workflow_path: {project-root}/_bmad/[module]/workflows/[name]
thisStepFile: ./step-[N]-[name].md
nextStepFile: ./step-[N+1]-[name].md
outputFile: {output_folder}/[output].md
---

# Workflow Name

**Goal:** What this accomplishes

**Role:** Who the AI embodies

**Meta-context:** Background (if demonstrating pattern)

**Core Architecture Principles:**
- Principle 1
- Principle 2

**Initialization:**
1. Load {workflow.md}
2. Read {thisStepFile}
3. Execute step
4. On completion: update frontmatter, load {nextStepFile}
```

**Key Patterns:**
- Micro-file design (80-200 lines per step)
- Just-in-time loading (only current step in memory)
- Progressive disclosure (no step lists in workflow.md)
- State tracking for continuation
- Menu pattern for user interaction

#### Tools

**Pattern:** BMAD uses shell scripts and JavaScript for utilities.

**Integration:** Tools are invoked from workflows, not directly by users.

**State Management:** Tools create output files that workflows consume.

### Execution Model

#### Workflow Execution

**Fresh Start:**
```
workflow.md → step-01-init.md → step-02-[name].md → ... → step-N-final.md
```

**Continuation (Resumed):**
```
workflow.md → step-01-init.md (detects existing)
    → step-01b-continue.md → [appropriate next step]
```

**State Tracking:**
```yaml
stepsCompleted: ['step-01-init', 'step-02-gather', 'step-03-design']
lastStep: 'step-03-design'
lastContinued: '2025-01-02'
```

#### Menu Pattern

```markdown
### N. Present MENU OPTIONS

**Select:** [A] [action] [P] [action] [C] Continue

#### Menu Handling Logic:
- IF A: Execute {task}, then redisplay menu
- IF P: Execute {task}, then redisplay menu
- IF C: Save to {outputFile}, update frontmatter, then load {nextStepFile}
- IF Any other: help user, then redisplay menu

#### EXECUTION RULES:
- ALWAYS halt and wait for user input
- ONLY proceed to next step when user selects 'C'
```

### State Model

#### Frontmatter Variables

**Standard (All Workflows):**
```yaml
workflow_path: '{project-root}/_bmad/[module]/workflows/[name]'
thisStepFile: './step-[N]-[name].md'
nextStepFile: './step-[N+1]-[name].md'
outputFile: '{output_folder}/[output].md'
```

**Module-Specific:**
```yaml
bmb_creations_output_folder: '{project-root}/_bmad/bmb-creations'
```

#### Output Patterns

**Plan-then-build:** Steps append to plan.md → build step consumes plan

**Direct-to-final:** Steps append directly to final document

### Governance Model

#### Hierarchy

**Module → Agents → Workflows → Tools**

- Module: Container for functionality
- Agents: AI entities with menus
- Workflows: Step-based procedures
- Tools: Executable utilities

#### Validation

**Agent Validation:**
- Schema compliance (YAML structure)
- Required fields present
- Menu triggers properly formatted
- Persona sufficiently detailed

**Workflow Validation:**
- Step files exist and load
- Frontmatter variables valid
- Continuation model functional
- Output paths reachable

#### Standards

**Style Guide:** `docs/_STYLE_GUIDE.md`

**Naming Conventions:**
- Files: kebab-case
- Steps: `step-{NN}-{action}.md`
- Agents: `{name}.agent.yaml`

## GSD (Get Shit Done)

### Entity Model

#### Templates

**Phase Templates:**
- `templates/phase-prompt.md`
- `templates/state.md`
- `templates/summary.md`

**Checkpoint Templates:**
- `templates/checkpoint.md`

#### Continuation Format

**Structure:**
```yaml
continue-here:
  phase: current phase
  steps_completed: [list]
  next_action: description
  context_preserved: [key points]
```

### Execution Model

#### Phase-Based Execution

**Structure:**
```
Milestone → Phase → Plan → Task
```

**State Tracking:**
- `STATE.md` - Current state
- Checkpoints - Rollback points
- Continuation format - Resume capability

### State Model

#### State File

```yaml
project: name
phase: current
milestone: current_milestone
last_updated: timestamp
context: preserved_context
```

### Governance Model

#### Planning First

**Milestone Planning:**
- Define milestones
- Create phases
- Plan tasks within phases

#### Checkpoint System

**Pre-compaction Checkpoint:**
- Anchor critical decisions
- Summarize current state
- Document next steps

**Rollback:**
- Restore from checkpoint
- Resume from preserved state

## Pattern Classification Tree

### Level 1: Concept Categories

```
Patterns/
├── Entity Patterns/
│   ├── Agents
│   ├── Workflows
│   ├── Tools
│   └── Modules
├── Execution Patterns/
│   ├── Creation
│   ├── Execution
│   ├── Validation
│   └── Continuation
├── State Patterns/
│   ├── Frontmatter
│   ├── State Files
│   ├── Checkpoints
│   └── Output
└── Governance Patterns/
    ├── Hierarchy
    ├── Validation
    ├── Standards
    └── Rollback
```

### Level 2: Pattern Families

```
Entity Patterns/
├── Agents/
│   ├── Persona Definition
│   ├── Permission Model
│   ├── Menu System
│   └── Sidecar Files
├── Workflows/
│   ├── Step Structure
│   ├── State Tracking
│   ├── Menu Pattern
│   └── Progressive Disclosure
├── Tools/
│   ├── Input Parameters
│   ├── Execution Logic
│   ├── Output Format
│   └── Error Handling
└── Modules/
    ├── Module Configuration
    ├── Component Organization
    └── Dependency Management
```

### Level 3: Concrete Implementations

```
BMAD Implementations:
├── Agents: *.agent.yaml with metadata/persona/menu
├── Workflows: workflow.md + steps-*/ directories
├── Tools: Shell/JS scripts in bin/ or src/
└── Modules: module.yaml with components listed

GSD Implementations:
├── Phases: phase-prompt.md templates
├── State: STATE.md files
├── Checkpoints: checkpoint.md templates
└── Continuation: continue-here.md format
```

## Transformation Candidates

### High-Value Patterns

**From BMAD:**
- Menu-based agent commands → iDumb command bindings
- Progressive disclosure workflows → iDumb workflows with JIT loading
- Sidecar files → iDumb skills
- Agent persona system → iDumb agent personas

**From GSD:**
- Milestone/Phase structure → iDumb phase planning
- State file tracking → iDumb state.json
- Checkpoint system → iDumb checkpoints
- Continuation format → iDumb session resumption

### Integration Complexity

| Pattern | Source | Complexity | Value |
|---------|--------|------------|-------|
| Menu-based commands | BMAD | Low | High |
| Progressive disclosure | BMAD | Medium | High |
| State tracking | GSD | Low | High |
| Checkpoint system | GSD | Medium | High |
| Sidecar files | BMAD | Low | Medium |
| Agent personas | BMAD | Low | Medium |
| Continuation format | GSD | Medium | Medium |

## Pattern Inventory Summary

```yaml
total_patterns_analyzed: 37
bmad_patterns: 24
gsd_patterns: 13

pattern_categories:
  entity_patterns: 15
  execution_patterns: 12
  state_patterns: 6
  governance_patterns: 4

transformation_ready: 28
requires_analysis: 9
low_priority: 3
```
