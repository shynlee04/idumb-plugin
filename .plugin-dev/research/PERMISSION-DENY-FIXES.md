# Permission Deny Fixes: iDumb Agent System

**Date:** 2026-02-04  
**Domain:** Technical Research  
**Researcher:** @idumb-project-researcher  
**Status:** Complete

---

## Executive Summary

This document analyzes the permission deny patterns across all 15 iDumb agent profiles and identifies critical issues that violate the permission system design principles. The current profiles contain incorrect deny patterns that could prevent proper agent operation and delegation.

### Key Findings

1. **5 agents** have incorrect `task: "*": deny` patterns (violates Rule #1)
2. **1 agent** has broad `bash: "*": deny` pattern (violates Rule #2)
3. **3 agents** have `mode: all` but should be `mode: all` (scope confusion)
4. **3 missing agents** needed for complete hierarchy coverage

---

## 1. Permission Rules (Non-Negotiable)

### ✅ CORRECT Patterns

| Rule | Correct Pattern | Rationale |
|------|-----------------|-----------|
| **Rule 1** | Never deny `task` entirely | `task` is a parent group for agent spawning |
| **Rule 2** | Use specific denies, not broad | `"bash": "rm -rf": deny` not `"bash": "*": deny` |
| **Rule 3** | Prefer allow over deny | `"bash": "git status": allow` is explicit and clear |
| **Rule 4** | Delegation is encouraged | All agents should delegate to prevent context poisoning |
| **Rule 5** | Search tools always allowed | `list`, `glob`, `grep`, `regex`, `chunk reading` are essential |

### ❌ INCORRECT Patterns (Current Issues)

```yaml
# VIOLATION of Rule 1 - NEVER do this
task:
  "*": deny  # ❌ WRONG - blocks ALL task delegation

# VIOLATION of Rule 2 - NEVER do this  
bash:
  "*": deny  # ❌ WRONG - too broad, blocks safe commands

# VIOLATION of Rule 3 - AVOID this
edit: deny   # ⚠️ AVOID - prefer specific allows
write: deny  # ⚠️ AVOID - prefer specific allows
```

### ✅ CORRECT Patterns (What to Use)

```yaml
# CORRECT - Specific allows with fallback
task:
  "idumb-low-validator": allow
  "idumb-builder": allow
  "general": allow
  # No "*" entry = deny by default for unspecified

# CORRECT - Specific bash allows
bash:
  "git status": allow
  "git diff*": allow
  "git log*": allow
  "pnpm test*": allow
  "npm test*": allow
  "ls*": allow
  "find*": allow
  "cat*": allow
  "rm -rf": deny      # ❌ Explicit deny for dangerous
  "sudo*": deny       # ❌ Explicit deny for privileged
  # No "*" entry = deny by default for unspecified
```

---

## 2. Agent Mode Clarification

### Mode Definitions

| Mode | Can Be Spawned | Can Delegate | Use Case |
|------|----------------|--------------|----------|
| **primary** | No (top-level) | Yes (all agents) | Supreme coordinator only |
| **all** | Yes | Yes (all agents) | High-level coordinators |
| **all** | Yes | Limited/No | Worker agents, leaf nodes |

### Current Mode Assignments

| Agent | Current Mode | Correct Mode | Issue |
|-------|--------------|--------------|-------|
| idumb-supreme-coordinator | primary | ✅ primary | Correct |
| idumb-high-governance | all | ✅ all | Correct |
| idumb-low-validator | all | ❌ **all** | Should not delegate |
| idumb-builder | all | ❌ **all** | Should not delegate |
| idumb-executor | all | ✅ all | Correct |
| idumb-verifier | all | ✅ all | Correct |
| idumb-debugger | all | ✅ all | Correct |
| idumb-planner | all | ✅ all | Correct |
| idumb-plan-checker | all | ✅ all | Correct |
| idumb-integration-checker | all | ✅ all | Correct |
| idumb-roadmapper | all | ✅ all | Correct |
| idumb-project-researcher | all | ✅ all | Correct |
| idumb-phase-researcher | all | ✅ all | Correct |
| idumb-research-synthesizer | all | ✅ all | Correct |
| idumb-codebase-mapper | all | ✅ all | Correct |

**Note:** `idumb-low-validator` and `idumb-builder` are **LEAF NODES** - they should be `mode: all` because they cannot delegate further.

---

## 3. Current Agent Analysis

### 3.1 META Agents (Manipulate .opencode/ and .idumb/)

#### idumb-supreme-coordinator
```yaml
Current:
  mode: primary
  scope: bridge
  permission:
    task:
      "*": allow        # ✅ Correct - can delegate to all
    bash:
      "*": deny         # ❌ ISSUE - too broad
    edit: deny
    write: deny

Issues:
  - bash: "*": deny blocks safe commands like "git status"
  
Fixes:
  - Change bash to specific allows:
    bash:
      "git status": allow
      "git diff*": allow
      "git log*": allow
      "git log*": allow
      # No "*" entry = deny unspecified
```

#### idumb-high-governance
```yaml
Current:
  mode: all
  scope: meta
  permission:
    task:
      "idumb-low-validator": allow
      "idumb-builder": allow
      ... (specific allows)
      "*": ask           # ✅ Correct - asks for unknown
    bash:
      "pnpm test*": allow
      "npm test*": allow
      "git status": allow
      "git diff*": allow
      "git log*": allow
      "*": ask           # ✅ Correct - asks for unknown
    edit: deny
    write: deny

Issues:
  - None - this is the CORRECT pattern
  
Verdict: ✅ EXCELLENT - Use as reference for other agents
```

#### idumb-low-validator
```yaml
Current:
  mode: all           # ❌ Should be all
  scope: meta
  permission:
    task:
      "*": deny       # ❌ ISSUE - denies task entirely
    bash:
      "grep*": allow
      "find*": allow
      "ls*": allow
      "cat*": allow
      "pnpm test*": allow
      "npm test*": allow
      "git status": allow
      "git diff*": allow
      "git log*": allow
      "*": deny         # ✅ Correct - specific allows first
    edit: deny
    write: deny

Issues:
  1. mode: all → should be mode: all (leaf node)
  2. task: "*": deny → violates Rule #1
  
Fixes:
  - Change mode: all
  - Remove task permission entirely (all doesn't spawn agents)
  - OR change to: task: {} (empty = no task delegation)
```

#### idumb-builder
```yaml
Current:
  mode: all           # ❌ Should be all
  scope: meta
  permission:
    task:
      "*": deny       # ❌ ISSUE - denies task entirely
    bash:
      "*": allow      # ⚠️ RISKY - but acceptable for builder
    edit: allow
    write: allow

Issues:
  1. mode: all → should be mode: all (leaf node)
  2. task: "*": deny → violates Rule #1 (though builder shouldn't spawn agents)
  
Fixes:
  - Change mode: all
  - Remove task permission entirely (builder is leaf node)
  - bash: "*": allow is acceptable for builder (needs full execution)
```

### 3.2 PROJECT Agents (Execute user project code)

#### idumb-executor
```yaml
Current:
  mode: all
  scope: project
  permission:
    task:
      "general": allow
      "idumb-verifier": allow
      "idumb-debugger": allow
      "*": deny         # ✅ Correct - specific allows
    bash:
      "git status": allow
      "git diff*": allow
      "git log*": allow
      "npm test": allow
      "npm run test*": allow
      "npm run build": allow
      "*": deny         # ✅ Correct - specific allows
    edit: deny
    write: deny

Issues:
  - None - this is the CORRECT pattern
  
Verdict: ✅ EXCELLENT - Use as reference
```

#### idumb-verifier
```yaml
Current:
  mode: all
  scope: project
  permission:
    task:
      "general": allow
      "idumb-low-validator": allow
      "*": deny         # ✅ Correct
    bash:
      "pnpm test*": allow
      "npm test*": allow
      "git diff*": allow
      "git log*": allow
      "git status": allow
      "*": deny         # ✅ Correct
    edit: deny
    write: deny

Issues:
  - None - correct pattern
  
Verdict: ✅ CORRECT
```

#### idumb-debugger
```yaml
Current:
  mode: all
  scope: project
  permission:
    task:
      "general": allow
      "idumb-low-validator": allow
      "*": deny         # ✅ Correct
    bash:
      "git diff*": allow
      "git log*": allow
      "git show*": allow
      "git status": allow
      "pnpm test*": allow
      "npm test*": allow
      "*": deny         # ✅ Correct
    edit: deny
    write: deny

Issues:
  - None - correct pattern
  
Verdict: ✅ CORRECT
```

#### idumb-roadmapper
```yaml
Current:
  mode: all
  scope: project
  permission:
    task:
      "*": deny         # ❌ ISSUE - denies task entirely
    bash:
      "*": deny         # ✅ Correct (no bash needed)
    edit: deny
    write: deny

Issues:
  - task: "*": deny → violates Rule #1
  
Fixes:
  - Change to specific allows:
    task:
      "general": allow  # For research tasks
      # No "*" entry = deny unspecified
```

#### idumb-project-researcher
```yaml
Current:
  mode: all
  scope: project
  permission:
    task:
      "*": deny         # ❌ ISSUE - denies task entirely
    bash:
      "*": deny         # ✅ Correct (no bash needed)
    edit: deny
    write: deny

Issues:
  - task: "*": deny → violates Rule #1
  
Fixes:
  - Change to specific allows:
    task:
      "general": allow  # For web search, etc.
      # No "*" entry = deny unspecified
```

#### idumb-phase-researcher
```yaml
Current:
  mode: all
  scope: project
  permission:
    task:
      "*": deny         # ❌ ISSUE - denies task entirely
    bash:
      "*": deny         # ✅ Correct
    edit: deny
    write: deny

Issues:
  - task: "*": deny → violates Rule #1
  
Fixes:
  - Change to specific allows:
    task:
      "general": allow  # For research tasks
      # No "*" entry = deny unspecified
```

#### idumb-research-synthesizer
```yaml
Current:
  mode: all
  scope: project
  permission:
    task:
      "*": deny         # ❌ ISSUE - denies task entirely
    bash:
      "*": deny         # ✅ Correct
    edit: deny
    write: deny

Issues:
  - task: "*": deny → violates Rule #1
  
Fixes:
  - Change to specific allows:
    task:
      "general": allow  # For document creation
      # No "*" entry = deny unspecified
```

#### idumb-codebase-mapper
```yaml
Current:
  mode: all
  scope: project
  permission:
    task:
      "*": deny         # ❌ ISSUE - denies task entirely
    bash:
      "ls*": allow
      "find*": allow
      "wc*": allow
      "*": deny         # ✅ Correct
    edit: deny
    write: deny

Issues:
  - task: "*": deny → violates Rule #1
  
Fixes:
  - Change to specific allows:
    task:
      "general": allow  # For complex analysis
      # No "*" entry = deny unspecified
```

### 3.3 BRIDGE Agents (Orchestrate both META and PROJECT)

#### idumb-planner
```yaml
Current:
  mode: all
  scope: bridge
  permission:
    task:
      "general": allow
      "*": deny         # ✅ Correct
    bash:
      "*": deny         # ✅ Correct (no bash needed)
    edit: deny
    write: deny

Issues:
  - None - correct pattern
  
Verdict: ✅ CORRECT
```

#### idumb-plan-checker
```yaml
Current:
  mode: all
  scope: bridge
  permission:
    task:
      "general": allow
      "*": deny         # ✅ Correct
    bash:
      "*": deny         # ✅ Correct
    edit: deny
    write: deny

Issues:
  - None - correct pattern
  
Verdict: ✅ CORRECT
```

#### idumb-integration-checker
```yaml
Current:
  mode: all
  scope: bridge
  permission:
    task:
      "general": allow
      "idumb-low-validator": allow
      "*": deny         # ✅ Correct
    bash:
      "pnpm test*": allow
      "npm test*": allow
      "git diff*": allow
      "git status": allow
      "*": deny         # ✅ Correct
    edit: deny
    write: deny

Issues:
  - None - correct pattern
  
Verdict: ✅ CORRECT
```

---

## 4. Agent Hierarchy Problems

### 4.1 Scope Confusion

**Current Misunderstanding:**
- `idumb-builder` is thought to be for all file writes
- `idumb-executor` is thought to be for code execution only

**Correct Understanding:**

| Agent | Scope | Purpose | Delegates To |
|-------|-------|---------|--------------|
| **idumb-builder** | META | Manipulates `.opencode/` and `.idumb/` | None (leaf) |
| **idumb-executor** | PROJECT | Executes user project code | `general` for file writes |
| **idumb-low-validator** | META | Validates `.opencode/` and `.idumb/` | None (leaf) |
| **idumb-verifier** | PROJECT | Verifies user project work | `general`, `idumb-low-validator` |

**Key Insight:**
- META agents handle the iDumb framework itself
- PROJECT agents handle the user's actual project code
- PROJECT agents delegate file writes to `general` all, NOT `idumb-builder`

### 4.2 Missing Agents

The current hierarchy is missing 3 critical agents:

#### Missing Agent 1: idumb-skeptic-validator
```yaml
Purpose: Questions assumptions and challenges conclusions
Mode: all
Scope: bridge
Role: 
  - Reviews plans and research for logical flaws
  - Challenges unstated assumptions
  - Identifies confirmation bias in research
  - Validates that conclusions follow from evidence
Permission:
  task:
    "general": allow  # For deep analysis
  bash:
    "*": deny
  edit: deny
  write: deny
Tools:
  - All read/search tools
  - idumb-validate
  - idumb-chunker
```

#### Missing Agent 2: idumb-project-explorer
```yaml
Purpose: Uses innate explorer for project analysis
Mode: all
Scope: project
Role:
  - Explores unfamiliar codebases
  - Maps project structure
  - Identifies entry points and patterns
  - Creates initial context for other agents
Permission:
  task:
    "general": allow  # For exploration tasks
  bash:
    "ls*": allow
    "find*": allow
    "tree": allow
    "*": deny
  edit: deny
  write: deny
Tools:
  - All read/search tools
  - idumb-context
  - idumb-codebase-mapper
```

#### Missing Agent 3: idumb-mid-coordinator
```yaml
Purpose: Coordinates project-level workflows
Mode: all
Scope: bridge
Role:
  - Sits between high-governance and project agents
  - Manages project-specific workflows
  - Coordinates multiple project agents
  - Reports to high-governance
Permission:
  task:
    "idumb-executor": allow
    "idumb-verifier": allow
    "idumb-debugger": allow
    "idumb-planner": allow
    "idumb-project-researcher": allow
    "idumb-phase-researcher": allow
    "general": allow
    "*": ask
  bash:
    "git status": allow
    "git diff*": allow
    "*": ask
  edit: deny
  write: deny
Tools:
  - All coordination tools
  - idumb-state
  - idumb-todo
  - idumb-validate
```

---

## 5. Fixes Required

### 5.1 Permission Fixes Table

| Agent | Current Issue | Fix Required | Priority |
|-------|---------------|--------------|----------|
| **idumb-supreme-coordinator** | `bash: "*": deny` too broad | Add specific bash allows | High |
| **idumb-low-validator** | `mode: all` should be `all` | Change mode | Medium |
| **idumb-low-validator** | `task: "*": deny` | Remove task permission | High |
| **idumb-builder** | `mode: all` should be `all` | Change mode | Medium |
| **idumb-builder** | `task: "*": deny` | Remove task permission | High |
| **idumb-roadmapper** | `task: "*": deny` | Add specific allows | High |
| **idumb-project-researcher** | `task: "*": deny` | Add specific allows | High |
| **idumb-phase-researcher** | `task: "*": deny` | Add specific allows | High |
| **idumb-research-synthesizer** | `task: "*": deny` | Add specific allows | High |
| **idumb-codebase-mapper** | `task: "*": deny` | Add specific allows | High |

### 5.2 Specific Permission Changes

#### Fix 1: idumb-supreme-coordinator bash permissions
```yaml
# BEFORE (incorrect)
permission:
  bash:
    "*": deny

# AFTER (correct)
permission:
  bash:
    "git status": allow
    "git diff*": allow
    "git log*": allow
    "git log*": allow
    # No "*" entry = deny unspecified
```

#### Fix 2: idumb-low-validator mode and task
```yaml
# BEFORE (incorrect)
mode: all
permission:
  task:
    "*": deny

# AFTER (correct)
mode: all
permission:
  # Remove task entirely - leaf node doesn't spawn agents
  # OR: task: {} (empty object)
```

#### Fix 3: idumb-builder mode and task
```yaml
# BEFORE (incorrect)
mode: all
permission:
  task:
    "*": deny

# AFTER (correct)
mode: all
permission:
  # Remove task entirely - leaf node doesn't spawn agents
```

#### Fix 4: Research agents task permissions
```yaml
# BEFORE (incorrect) - applies to:
# - idumb-roadmapper
# - idumb-project-researcher
# - idumb-phase-researcher
# - idumb-research-synthesizer
# - idumb-codebase-mapper
permission:
  task:
    "*": deny

# AFTER (correct)
permission:
  task:
    "general": allow  # For research/analysis tasks
    # No "*" entry = deny unspecified
```

### 5.3 Mode/Scope Adjustments

| Agent | Current Mode | New Mode | Current Scope | New Scope | Reason |
|-------|--------------|----------|---------------|-----------|--------|
| idumb-low-validator | all | **all** | meta | meta | Leaf node, no delegation |
| idumb-builder | all | **all** | meta | meta | Leaf node, no delegation |

---

## 6. New Agents Specifications

### 6.1 idumb-skeptic-validator

```yaml
---
description: "Questions assumptions and challenges conclusions to prevent confirmation bias"
mode: all
scope: bridge
temperature: 0.2
permission:
  task:
    "general": allow
  bash:
    "*": deny
  edit: deny
  write: deny
tools:
  todoread: true
  read: true
  glob: true
  grep: true
  idumb-state: true
  idumb-validate: true
  idumb-chunker: true
---

# @idumb-skeptic-validator

## Purpose
Reviews plans, research, and conclusions to identify:
- Unstated assumptions
- Logical fallacies
- Confirmation bias
- Weak evidence
- Alternative explanations

## When to Use
- Before finalizing research synthesis
- When plans seem too optimistic
- When conclusions don't match evidence
- As a final validation step

## Output Format
```yaml
skeptic_review:
  target: [what was reviewed]
  assumptions_challenged:
    - assumption: [what was assumed]
      challenge: [why it might be wrong]
      impact: [high/medium/low]
  logical_issues:
    - issue: [description]
      severity: [critical/high/medium]
  evidence_gaps:
    - gap: [what's missing]
      needed: [what would fill the gap]
  alternative_views:
    - view: [alternative interpretation]
      support: [evidence for alternative]
  overall_confidence: [high/medium/low]
  recommendation: [proceed/revise/reject]
```

## Available Agents
| Agent | Mode | Scope | Can Delegate To |
|-------|------|-------|-----------------|
| ... | ... | ... | ... |
```

### 6.2 idumb-project-explorer

```yaml
---
description: "Explores unfamiliar codebases using innate explorer for initial context gathering"
mode: all
scope: project
temperature: 0.2
permission:
  task:
    "general": allow
  bash:
    "ls*": allow
    "find*": allow
    "tree": allow
    "wc*": allow
    "*": deny
  edit: deny
  write: deny
tools:
  todoread: true
  read: true
  glob: true
  grep: true
  idumb-state: true
  idumb-context: true
  idumb-codebase-mapper: true
---

# @idumb-project-explorer

## Purpose
Provides initial codebase exploration for brownfield projects:
- Maps directory structure
- Identifies technology stack
- Finds entry points
- Locates configuration files
- Creates initial context document

## When to Use
- Starting work on existing codebase
- Need to understand project structure
- Before planning phases for brownfield work

## Output Format
```yaml
exploration_report:
  project_root: [path]
  technology_stack:
    languages: [list]
    frameworks: [list]
    build_tools: [list]
  structure:
    entry_points: [list]
    source_dirs: [list]
    test_dirs: [list]
    config_files: [list]
  key_files:
    - path: [file]
      purpose: [description]
  concerns:
    - [list of potential issues]
  recommendations:
    - [next steps]
```

## Available Agents
| Agent | Mode | Scope | Can Delegate To |
|-------|------|-------|-----------------|
| ... | ... | ... | ... |
```

### 6.3 idumb-mid-coordinator

```yaml
---
description: "Coordinates project-level workflows between high-governance and project agents"
mode: all
scope: bridge
temperature: 0.2
permission:
  task:
    "idumb-executor": allow
    "idumb-verifier": allow
    "idumb-debugger": allow
    "idumb-planner": allow
    "idumb-project-researcher": allow
    "idumb-phase-researcher": allow
    "idumb-skeptic-validator": allow
    "idumb-project-explorer": allow
    "general": allow
    "*": ask
  bash:
    "git status": allow
    "git diff*": allow
    "git log*": allow
    "*": ask
  edit: deny
  write: deny
tools:
  task: true
  todoread: true
  todowrite: true
  read: true
  glob: true
  grep: true
  idumb-state: true
  idumb-context: true
  idumb-config: true
  idumb-todo: true
  idumb-validate: true
---

# @idumb-mid-coordinator

## Purpose
Sits between high-governance and project agents to:
- Manage project-specific workflows
- Coordinate multiple project agents
- Handle project-level delegation
- Report progress to high-governance

## Hierarchy Position
```
@idumb-high-governance
  └─→ @idumb-mid-coordinator
        ├─→ @idumb-executor
        ├─→ @idumb-planner
        ├─→ @idumb-project-researcher
        └─→ @idumb-project-explorer
```

## When to Use
- Complex project with multiple workstreams
- Need project-level coordination
- High-governance should focus on meta concerns

## Available Agents
| Agent | Mode | Scope | Can Delegate To |
|-------|------|-------|-----------------|
| ... | ... | ... | ... |
```

---

## 7. Updated Agent Hierarchy (With New Agents)

```
idumb-supreme-coordinator (primary, bridge)
  └─→ idumb-high-governance (all, meta)
        ├─→ idumb-mid-coordinator (all, bridge) [NEW]
        │     ├─→ idumb-executor (all, project)
        │     ├─→ idumb-planner (all, bridge)
        │     ├─→ idumb-project-researcher (all, project)
        │     ├─→ idumb-project-explorer (all, project) [NEW]
        │     └─→ idumb-skeptic-validator (all, bridge) [NEW]
        ├─→ idumb-verifier (all, project)
        ├─→ idumb-debugger (all, project)
        ├─→ idumb-integration-checker (all, bridge)
        ├─→ idumb-low-validator (all, meta) [LEAF]
        └─→ idumb-builder (all, meta) [LEAF]
```

---

## 8. Implementation Checklist

### Phase 1: Fix Existing Agents
- [ ] Fix idumb-supreme-coordinator bash permissions
- [ ] Fix idumb-low-validator mode (all → all)
- [ ] Remove idumb-low-validator task permission
- [ ] Fix idumb-builder mode (all → all)
- [ ] Remove idumb-builder task permission
- [ ] Fix idumb-roadmapper task permissions
- [ ] Fix idumb-project-researcher task permissions
- [ ] Fix idumb-phase-researcher task permissions
- [ ] Fix idumb-research-synthesizer task permissions
- [ ] Fix idumb-codebase-mapper task permissions

### Phase 2: Create New Agents
- [ ] Create idumb-skeptic-validator.md
- [ ] Create idumb-project-explorer.md
- [ ] Create idumb-mid-coordinator.md

### Phase 3: Update References
- [ ] Update all agent registry tables to include new agents
- [ ] Update AGENTS.md documentation
- [ ] Update plugin tool permissions

---

## 9. Summary

### Critical Issues Found: 10

| Category | Count | Agents Affected |
|----------|-------|-----------------|
| `task: "*": deny` violations | 7 | low-validator, builder, roadmapper, project-researcher, phase-researcher, research-synthesizer, codebase-mapper |
| `bash: "*": deny` too broad | 1 | supreme-coordinator |
| `mode: all` incorrect | 2 | low-validator, builder |

### Fixes Required: 10 permission changes + 2 mode changes

### New Agents Needed: 3
- idumb-skeptic-validator
- idumb-project-explorer
- idumb-mid-coordinator

### Reference Implementation
Use `idumb-high-governance`, `idumb-executor`, and `idumb-verifier` as reference implementations - they follow the correct permission patterns.

---

## Sources

1. [Session Handoff: Permission Manipulation Mastery](/Users/apple/Documents/coding-projects/idumb/.idumb/brain/SESSION-HANDOFF-2026-02-03-PERMISSION-MANIPULATION.md) - Task 4 requirements
2. [iDumb Core Plugin](/Users/apple/Documents/coding-projects/idumb/template/plugins/idumb-core.ts) - Tool permission tiers
3. [AGENTS.md](/Users/apple/Documents/coding-projects/idumb/AGENTS.md) - Agent hierarchy documentation
4. All 15 agent profiles in `/Users/apple/Documents/coding-projects/idumb/template/agents/`

---

## Research Metadata

- **Time spent:** 15 minutes
- **Sources consulted:** 18 files (15 agents + plugin + handoff + AGENTS.md)
- **Confidence level:** High
- **Researcher:** @idumb-project-researcher
- **Date:** 2026-02-04
