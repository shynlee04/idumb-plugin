# AGENTS.md - iDumb Governance Rules for AI Agents

> **CRITICAL**: Read this ENTIRE file before ANY action. Violations cause cascading failures.

## 🚨 ABSOLUTE REQUIREMENTS (NON-NEGOTIABLE)

### 1. CONTEXT-FIRST: Read Before Acting

**At EVERY session start or conversation resume:**

```
1. READ your agent profile:     template/agents/{your-agent}.md
2. READ governance state:       .idumb/brain/state.json  
3. READ current phase:          .planning/ROADMAP.md (find active phase)
4. READ chain rules:            template/router/chain-enforcement.md
5. ONLY THEN consider user request
```

**If you are a COORDINATOR (supreme-coordinator, high-governance):**
- ❌ NEVER execute code directly
- ❌ NEVER write files directly  
- ❌ NEVER call MCP tools that modify state
- ✅ ONLY delegate to appropriate sub-agents
- ✅ ONLY read state, validate, synthesize, report

### 2. NO EXECUTION WITHOUT PLAN

**Before ANY action, you MUST have:**

```yaml
plan_requirements:
  - goal: "What are we trying to achieve?"
  - steps: "Ordered list of ALL steps"
  - phases: "Which phase does this belong to?"
  - hierarchy: "Who delegates to whom?"
  - integration: "What connects to what?"
  - validation: "How do we verify success?"
```

**FULL STOP if:**
- [ ] Any step is missing
- [ ] Any integration point is undefined
- [ ] Any conflict exists in the plan
- [ ] Any gap in the chain of execution

### 3. SELF-HEALING ON CONFLICTS

**When you detect a conflict, gap, or drift:**

```
1. STOP all execution immediately
2. LOG the issue to .idumb/brain/state.json history
3. IDENTIFY the root cause
4. BOUNCE BACK to the appropriate level:
   - Task issue → bounce to plan level
   - Plan issue → bounce to phase level  
   - Phase issue → bounce to roadmap level
5. DO NOT proceed until resolved
```

---

## Build/Lint/Test Commands

```bash
# Install locally (in a project)
npm run install:local

# Install globally (in ~/.config/opencode)
npm run install:global

# Uninstall
npm run uninstall

# Manual installation
node bin/install.js --local
node bin/install.js --global

# Verify installation
ls -la .opencode/agents/idumb-*.md
ls -la .opencode/tools/idumb-*.ts
```

### No Test Suite Currently
This is a meta-framework (markdown + TypeScript tools). Testing is via:
1. Manual installation and verification
2. OpenCode tool execution validation
3. Agent profile loading checks

---

## Code Style Guidelines

### TypeScript Files (`template/tools/*.ts`, `template/plugins/*.ts`)

```typescript
// IMPORTS: Node.js built-ins first, then @opencode-ai imports
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs"
import { join } from "path"
import { tool } from "@opencode-ai/plugin"
import type { Plugin } from "@opencode-ai/plugin"

// CRITICAL: NO console.log - pollutes TUI background
// Use file logging or client.app.log() instead
function log(directory: string, message: string): void {
  // Write to .idumb/idumb-brain/governance/plugin.log
}

// INTERFACES: Define all types explicitly
interface IdumbState {
  version: string
  initialized: string
  framework: "idumb" | "bmad" | "planning" | "custom" | "none"
  phase: string
  // ...
}

// FUNCTIONS: Use descriptive names, always handle errors
function readState(directory: string): IdumbState | null {
  try {
    // implementation
  } catch {
    return null  // Silent fail with fallback
  }
}

// TOOL EXPORTS: Use @opencode-ai/plugin tool() wrapper
export const stateRead = tool({
  name: "idumb-state_read",
  description: "Read current iDumb governance state",
  parameters: { /* zod schema */ },
  execute: async ({ }, { directory }) => {
    // implementation
  }
})
```

### Markdown Files (`template/agents/*.md`, `template/commands/*.md`)

```markdown
---
# YAML Frontmatter - MUST be accurate for OpenCode API
description: "Brief description of agent/command purpose"
mode: primary | all | all
temperature: 0.1  # Low for deterministic governance
permission:
  task:
    "agent-name": allow | deny | ask
  bash:
    "*": deny  # Coordinators: always deny
  edit: deny | allow
  write: deny | allow
tools:
  write: false  # Coordinators: always false
  edit: false
  idumb-state: true
---

# Agent/Command Name

## ABSOLUTE RULES (if coordinator)
1. **NEVER execute code directly**
2. **NEVER write files directly**
...
```

### JavaScript Files (`bin/install.js`)

```javascript
#!/usr/bin/env node

// ESM imports only (package.json: "type": "module")
import { existsSync, mkdirSync, cpSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

// Directory constants
const __dirname = dirname(fileURLToPath(import.meta.url))
const TEMPLATE_DIR = join(__dirname, '..', 'template')

// Always use fallback patterns
const result = someOperation() || fallbackValue
if (!existsSync(path)) {
  mkdirSync(path, { recursive: true })
}

// Step-based functions for clarity
const step1_checkPrerequisites = async () => { /* ... */ }
const step2_installAgents = async () => { /* ... */ }
```

---

## Agent Hierarchy

```
idumb-supreme-coordinator (YOU if primary)
  │
  └─→ idumb-high-governance (mid-level coordination)
        │
        ├─→ idumb-executor (phase execution)
        │     └─→ idumb-builder (file operations)
        │     └─→ idumb-low-validator (validation)
        │
        ├─→ idumb-planner (planning)
        ├─→ idumb-plan-checker (plan validation)
        ├─→ idumb-verifier (verification)
        ├─→ idumb-debugger (debugging)
        ├─→ idumb-integration-checker (integration)
        ├─→ idumb-codebase-mapper (codebase analysis)
        │
        ├─→ idumb-project-researcher (domain research)
        ├─→ idumb-phase-researcher (phase research)
        ├─→ idumb-research-synthesizer (synthesize research)
        │
        └─→ idumb-roadmapper (create roadmaps)
```

### Permission Matrix

| Agent | edit | write | bash | delegate | task |
|-------|------|-------|------|----------|------|
| supreme-coordinator | ❌ | ❌ | ❌ | ✅ | ✅ |
| high-governance | ❌ | ❌ | ❌ | ✅ | ✅ |
| executor | ❌ | ❌ | ❌ | ✅ | ✅ |
| verifier | ❌ | ❌ | ❌ | ✅ | ✅ |
| debugger | ❌ | ❌ | ❌ | ✅ | ✅ |
| planner | ❌ | ❌ | ❌ | ❌ | ❌ |
| plan-checker | ❌ | ❌ | ❌ | ❌ | ❌ |
| integration-checker | ❌ | ❌ | ❌ | ❌ | ❌ |
| codebase-mapper | ❌ | ❌ | ❌ | ❌ | ❌ |
| project-researcher | ❌ | ❌ | ❌ | ❌ | ❌ |
| phase-researcher | ❌ | ❌ | ❌ | ❌ | ❌ |
| research-synthesizer | ❌ | ❌ | ❌ | ❌ | ❌ |
| roadmapper | ❌ | ❌ | ❌ | ❌ | ❌ |
| low-validator | ❌ | ❌ | read | ❌ | ❌ |
| builder | ✅ | ✅ | ✅ | ❌ | ❌ |

## Agent Descriptions

### Coordinator Agents (Delegation Only)
These agents coordinate work but never execute directly:
- **idumb-supreme-coordinator**: Top-level orchestration, receives user requests, delegates all work
- **idumb-high-governance**: Mid-level coordination, validates and delegates to worker agents
- **idumb-executor**: Phase execution coordination, manages task workflows and delegates to builders/validators
- **idumb-verifier**: Verification coordination, validates completion criteria are met
- **idumb-debugger**: Debug coordination, diagnoses issues and proposes fixes

### Planning Agents (Research/Analysis)
These agents create and validate plans:
- **idumb-planner**: Creates detailed execution plans for phases
- **idumb-plan-checker**: Validates plans before execution, checks for completeness
- **idumb-roadmapper**: Creates project roadmaps with phases and milestones
- **idumb-codebase-mapper**: Analyzes existing codebases for brownfield projects

### Research Agents (Information Gathering)
These agents gather information before planning:
- **idumb-project-researcher**: Domain ecosystem research (tech, market, user, competitor)
- **idumb-phase-researcher**: Phase-specific implementation research
- **idumb-research-synthesizer**: Synthesizes research outputs from multiple researchers

### Integration Agents
- **idumb-integration-checker**: Validates cross-component integration and E2E flows

### Worker Agents (Leaf Nodes)
These agents perform the actual work:
- **idumb-low-validator**: Read-only validation (grep, glob, test, read)
- **idumb-builder**: File operations (write, edit, bash) - only agent that can modify files

---

## Path Conventions

```
.idumb/                    # iDumb runtime state (writable by iDumb)
  ├── brain/state.json     # Governance state
  ├── execution/           # Execution checkpoints
  └── archive/             # Completed phase archives

.planning/                 # Planning artifacts (READ ONLY for iDumb)
  ├── PROJECT.md
  ├── ROADMAP.md
  ├── phases/{N}/          # Phase artifacts

.opencode/                 # OpenCode config (installed by iDumb)
  ├── agents/idumb-*.md
  ├── commands/idumb/*.md
  └── tools/idumb-*.ts
```

---

## Chain Enforcement

**MUST-BEFORE Rules:**
```
/idumb:* → requires .idumb/idumb-brain/state.json (except init, help)
/idumb:roadmap → requires .planning/PROJECT.md
/idumb:execute-phase → requires .planning/phases/{N}/*PLAN.md
/idumb:verify-work → requires execution evidence
phase complete → requires VERIFICATION.md
```

**On Violation:**
- HARD_BLOCK: Stop, redirect to prerequisite
- SOFT_BLOCK: Warn, allow --force override
- WARN: Log, continue

---

## Error Handling

```typescript
// ALWAYS use try-catch with fallback
try {
  const result = riskyOperation()
  return { content: JSON.stringify(result) }
} catch (error) {
  return { content: JSON.stringify({ 
    error: true, 
    message: error instanceof Error ? error.message : "Unknown error" 
  })}
}

// NEVER throw unhandled - return error objects
// NEVER console.log - use file logging
// ALWAYS have fallback values
```

---

## Naming Conventions

- **Agents**: `idumb-{role}.md` (kebab-case)
- **Commands**: `idumb/{command}.md` (kebab-case)
- **Tools**: `idumb-{name}.ts` with exports `{name}{Action}`
- **Interfaces**: PascalCase (`IdumbState`, `HistoryEntry`)
- **Functions**: camelCase (`readState`, `writeState`)
- **Constants**: SCREAMING_SNAKE (`TEMPLATE_DIR`, `DEFAULT_STATE`)

---

*Last updated: 2026-02-03 | Version: 0.2.0*
