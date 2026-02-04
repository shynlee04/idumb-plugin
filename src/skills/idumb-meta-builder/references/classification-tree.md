# Classification Tree Reference

Hierarchical organization of framework patterns for systematic transformation.

## Pattern Hierarchy Overview

```
Level 1: Concept Categories (What exists)
├── Level 2: Pattern Families (How they work)
│   └── Level 3: Concrete Implementations (Specific examples)
```

## Level 1: Concept Categories

### 1. Entity Patterns

Definition: The fundamental building blocks that exist in a framework.

**Subcategories:**
- Agents
- Workflows
- Tools
- Modules
- Commands

### 2. Execution Patterns

Definition: How components execute and interact.

**Subcategories:**
- Creation patterns
- Execution patterns
- Validation patterns
- Continuation patterns
- Coordination patterns

### 3. State Patterns

Definition: How context and state are managed.

**Subcategories:**
- Frontmatter variables
- State files
- Checkpoints
- Output patterns
- Session tracking

### 4. Governance Patterns

Definition: How control, authority, and compliance work.

**Subcategories:**
- Hierarchy definition
- Permission models
- Validation rules
- Chain enforcement
- Rollback procedures

## Level 2: Pattern Families

### Entity Patterns

#### Agents

```
Agents/
├── Persona Definition
│   ├── Role specification
│   ├── Identity/backstory
│   ├── Communication style
│   └── Behavioral principles
├── Permission Model
│   ├── Tool access
│   ├── File operations
│   ├── Delegation rights
│   └── Bash capabilities
├── Menu System
│   ├── Trigger patterns
│   ├── Command bindings
│   └── Description format
└── Sidecar Files
    ├── Knowledge bases
    ├── Memory files
    └── Pattern libraries
```

#### Workflows

```
Workflows/
├── Step Structure
│   ├── Micro-file design
│   ├── Step naming conventions
│   └── Sequential ordering
├── State Tracking
│   ├── Frontmatter variables
│   ├── Steps completed array
│   └── Last step tracking
├── Menu Pattern
│   ├── Action options
│   ├── Continue option
│   └── Help handling
└── Progressive Disclosure
    ├── JIT loading
    ├── No step lists
    └── Self-documenting steps
```

#### Tools

```
Tools/
├── Input Parameters
│   ├── Required params
│   ├── Optional params
│   └── Flags
├── Execution Logic
│   ├── Main function
│   ├── Helper functions
│   └── Error cases
├── Output Format
│   ├── Return value
│   ├── Console output
│   └── File output
└── Error Handling
    ├── Try-catch
    ├── Error messages
    └── Recovery paths
```

### Execution Patterns

#### Creation Patterns

```
Creation/
├── Agent Creation
│   ├── Persona development
│   ├── Menu definition
│   └── Sidecar attachment
├── Workflow Creation
│   ├── Step planning
│   ├── State design
│   └── Output definition
├── Tool Creation
│   ├── Function signature
│   ├── State integration
│   └── Error handling
└── Module Creation
│   ├── Component assembly
│   ├── Dependency wiring
│   └── Validation setup
```

#### Execution Patterns

```
Execution/
├── Sequential Execution
│   ├── Step-by-step
│   ├── No skipping
│   └── Completion required
├── Menu-Driven Execution
│   ├── User input required
│   ├── Option processing
│   └── Continue gate
├── Delegation Execution
│   ├── Agent spawning
│   ├── Context passing
│   └── Result synthesis
└── Conditional Execution
│   ├── Branching logic
│   ├── Continuation detection
│   └── State-based routing
```

#### Validation Patterns

```
Validation/
├── Schema Validation
│   ├── YAML structure
│   ├── Required fields
│   └── Enum values
├── Integration Validation
│   ├── Agent bindings
│   ├── Tool availability
│   └── Command definitions
├── Completeness Validation
│   ├── No gaps
│   ├── No overlaps
│   └── Exit conditions
└── Compliance Validation
│   ├── Hierarchy check
│   ├── Permission check
│   └── Chain rule check
```

### State Patterns

#### Frontmatter Variables

```
Frontmatter/
├── Standard Variables
│   ├── workflow_path
│   ├── thisStepFile
│   ├── nextStepFile
│   └── outputFile
├── Module-Specific Variables
│   ├── Module paths
│   ├── Output folders
│   └── Resource locations
└── State Variables
│   ├── stepsCompleted
│   ├── lastStep
│   └── lastContinued
```

#### State Files

```
State Files/
├── Governance State
│   ├── Phase tracking
│   ├── Validation count
│   ├── Anchor list
│   └── History log
├── Workflow State
│   ├── Current step
│   ├── Completed steps
│   ├── User inputs
│   └── Generated outputs
└── Session State
│   ├── Session ID
│   ├── Created timestamp
│   ├── Last updated
│   └── Idle duration
```

#### Checkpoints

```
Checkpoints/
├── Pre-Execution
│   ├── State verification
│   ├── Prerequisite check
│   └── Environment validation
├── Mid-Execution
│   ├── Partial progress
│   ├── Intermediate state
│   └── Rollback point
└── Post-Execution
│   ├── Final state
│   ├── Success criteria
│   └── Output artifacts
```

### Governance Patterns

#### Hierarchy Definition

```
Hierarchy/
├── Agent Levels
│   ├── Level 0: User (root)
│   ├── Level 1: Coordinators
│   ├── Level 2: Governance
│   ├── Level 3: Validators
│   └── Level 4: Builders
├── Permission Matrix
│   ├── Write permissions
│   ├── Edit permissions
│   ├── Bash permissions
│   └── Delegate permissions
└── Chain of Command
│   ├── Delegation paths
│   ├── Return routes
│   └── Escalation procedures
```

## Level 3: Concrete Implementations

### BMAD Implementations

```
BMAD/
├── Agents
│   ├── bond.agent.yaml (Agent Building Expert)
│   │   └── Pattern: Persona-driven creation agent
│   ├── module-builder.agent.yaml
│   │   └── Pattern: Module orchestration agent
│   └── workflow-builder.agent.yaml
│       └── Pattern: Workflow construction agent
├── Workflows
│   ├── agent/workflow.md
│   │   └── Pattern: Progressive disclosure workflow
│   ├── module/workflow.md
│   │   └── Pattern: Multi-phase creation workflow
│   └── workflow/workflow.md
│       └── Pattern: Meta-workflow template
├── Tools
│   ├── installer.js
│   │   └── Pattern: Module installation utility
│   └── Schema validators
│       └── Pattern: Compliance checking
└── Modules
    ├── bmb (Builder Module for BMAD)
    │   └── Pattern: Self-referential module
    └── sample modules
        └── Pattern: Example implementations
```

### GSD Implementations

```
GSD/
├── State Management
│   ├── STATE.md
│   │   └── Pattern: Single source of truth state file
│   └── Continuation format
│       └── Pattern: Resume-capable session storage
├── Checkpoints
│   ├── checkpoint.md
│   │   └── Pattern: Rollback state snapshot
│   └── Pre-compaction
│       └── Pattern: Context preservation before summary
├── Phases
│   ├── phase-prompt.md
│   │   └── Pattern: Phase initialization template
│   └── Phase categories
│       ├── Discovery
│       ├── Planning
│       ├── Execution
│       └── Verification
└── Milestones
    └── Pattern: High-level project organization
```

## iDumb Mapped Patterns

### Agent Pattern Mapping

```
External Pattern → iDumb Pattern
├── BMAD Persona → iDumb Agent Persona
│   ├── role → role (preserved)
│   ├── identity → identity + hierarchy awareness
│   ├── principles → principles + governance
│   └── communication_style → preserved
├── BMAD Menu → iDumb Command Bindings
│   ├── trigger → command trigger
│   ├── exec → delegation target
│   └── description → command description
└── BMAD Sidecar → iDumb Skill
    ├── knowledge.csv → references/
    ├── patterns.md → references/
    └── instructions → SKILL.md
```

### Workflow Pattern Mapping

```
External Pattern → iDumb Pattern
├── BMAD Step Structure → iDumb Workflow Steps
│   ├── step-NN-name.md → ## Step N: Name
│   ├── micro-file → section in workflow.md
│   └── JIT loading → progressive disclosure
├── BMAD Menu Pattern → iDumb Chain Enforcement
│   ├── [A]ction → optional action
│   ├── [P]revious → validation checkpoint
│   └── [C]ontinue → next step (with validation)
└── BMAD State → iDumb State Integration
    ├── frontmatter vars → state.json fields
    ├── stepsCompleted → history entries
    └── lastStep → current_phase
```

### Governance Pattern Mapping

```
External Pattern → iDumb Pattern
├── BMAD Module → iDumb Module
│   ├── module.yaml → YAML frontmatter
│   ├── components → agents_required
│   └── structure → workflow steps
├── GSD State → iDumb State
│   ├── STATE.md → state.json
│   ├── phase → state.phase
│   └── milestone → state.milestone
└── GSD Checkpoint → iDumb Checkpoint
    ├── checkpoint.md → checkpoint-{id}.json
    ├── rollback → rollback_point
    └── artifacts → artifacts list
```

## Classification Decision Tree

```
Is this an Entity?
├── Yes: Does it define behavior/persona?
│   ├── Yes: Agent Pattern
│   └── No: Does it define a procedure?
│       ├── Yes: Workflow Pattern
│       └── No: Is it executable?
│           ├── Yes: Tool Pattern
│           └── No: Module Pattern
└── No: Is this about Execution?
    ├── Yes: Does it coordinate actions?
    │   ├── Yes: Coordination Pattern
    │   └── No: Does it verify correctness?
    │       ├── Yes: Validation Pattern
    │       └── No: Creation/Execution Pattern
    └── No: Is this about State?
        ├── Yes: Is it persistent?
        │   ├── Yes: State File Pattern
        │   └── No: Frontmatter/Checkpoint Pattern
        └── No: Governance Pattern
```

## Pattern Interdependencies

```
Agent ←→ Workflow
├── Agent defines workflow execution
└── Workflow updates agent state

Workflow ←→ State
├── Workflow reads state for context
└── Workflow writes state for progress

State ←→ Checkpoint
├── Checkpoint captures state snapshot
└── State restores from checkpoint

All ←→ Governance
├── Governance defines permissions
├── Governance enforces chain rules
└── Governance validates compliance
```
