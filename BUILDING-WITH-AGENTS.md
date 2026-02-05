# Building iDumb Plugin Reboot with Specialized Agents

## Overview

This document describes the specialized subagents and skills created to help build the iDumb plugin reboot following the comprehensive plan in `iDumb_Plugin_Reboot_d5317467.md`.

## Created Subagents

### 1. idumb-architect
**Purpose**: Senior system architect for clean TypeScript architecture design
**When to use**: Planning module structure, defining API contracts, ensuring OpenCode compatibility
**Location**: `.qoder/agents/idumb-architect.md`

### 2. idumb-implementer  
**Purpose**: TypeScript implementation specialist for engines and tools
**When to use**: Translating designs into working code, writing tests
**Location**: `.qoder/agents/idumb-implementer.md`

### 3. idumb-tester
**Purpose**: QA specialist for pivotal trials and stress testing
**When to use**: Validating functionality, designing test scenarios, documenting results
**Location**: `.qoder/agents/idumb-tester.md`

## Created Skills

### 1. idumb-workflow
**Purpose**: Guides the 8-phase pivotal trial implementation methodology
**When to use**: Following the structured build process, daily workflow guidance
**Location**: `.qoder/skills/idumb-workflow/SKILL.md`

### 2. idumb-validation
**Purpose**: Systematic validation protocol for all capabilities
**When to use**: Testing any component, stress test execution, evidence collection
**Location**: `.qoder/skills/idumb-validation/SKILL.md`

## How to Use These Agents

### Daily Workflow Pattern

```
Morning Setup:
1. Review previous day's trial results
2. Identify today's pivotal trial from the plan
3. Engage idumb-architect to design the component

Implementation:
1. Use idumb-architect for architectural decisions
2. Use idumb-implementer for coding the solution  
3. Use idumb-tester for validation and testing

Evening Wrap-up:
1. Document trial results with concrete evidence
2. Update principles registry
3. Plan next day's trial
```

### Agent Collaboration Examples

**Starting Phase 3 (Decision Scoring Engine)**:
```
User: "Let's implement the decision scoring engine"

idumb-architect: "I'll design the engine architecture and Zod schemas"
idumb-implementer: "I'll write the TypeScript implementation and tools"  
idumb-tester: "I'll create test scenarios and validate the < 100ms requirement"
```

**Troubleshooting Failed Trials**:
```
idumb-tester: "Trial 4 failed - attention directives aren't surviving compaction"
idumb-architect: "Let me analyze the persistence layer integration points"
idumb-implementer: "I'll implement the fix based on the architectural analysis"
idumb-tester: "Retesting with the fix applied..."
```

## 8 Pivotal Trials Overview

Each agent specializes in different aspects of these critical validations:

1. **Trial 1**: State persistence (idumb-implementer + idumb-tester)
2. **Trial 2**: Tool compatibility (idumb-architect + idumb-tester)  
3. **Trial 3**: Scoring performance (idumb-implementer + idumb-tester)
4. **Trial 4**: Attention survival (idumb-architect + idumb-tester)
5. **Trial 5**: Collector merging (idumb-implementer + idumb-tester)
6. **Trial 6**: Delegation quality (idumb-architect + idumb-tester)
7. **Trial 7**: TUI feedback (idumb-implementer + idumb-tester)
8. **Trial 8**: Stress tests (all agents collaborate)

## Getting Started

### 1. First Steps
```bash
# Create the clean worktree as specified in the plan
git worktree add ../idumb-clean main --detach
cd ../idumb-clean
git checkout -b plugin-reboot
```

### 2. Initialize the Foundation
```
Use idumb-architect to design the basic structure
Use idumb-implementer to create package.json and tsconfig.json
Use idumb-tester to validate Trial 1 (state persistence)
```

### 3. Follow the Phased Approach
Work through each pivotal trial systematically, using the appropriate agents for each phase.

## Success Criteria Reminder

Before considering any phase complete:
- [ ] All stated success criteria met with specific evidence
- [ ] Performance requirements verified (< 100ms scoring)
- [ ] No regressions in previously validated functionality  
- [ ] Works with default OpenCode agents only
- [ ] Zero console.log pollution
- [ ] 100% TypeScript strict mode compliance
- [ ] Zero lint errors

## Key Principles

1. **Evidence-Based**: Every claim must be validated through testing
2. **Non-Breaking**: Must work with OpenCode's innate agents unchanged
3. **Modular**: Clean separation of engines, tools, and hooks
4. **Progressive**: Build capabilities incrementally through trials
5. **Documented**: Every decision and result must be recorded

The specialized agents and skills provide structured guidance while maintaining flexibility for the complex intelligence capabilities you're building.