# Phase 2: Meta-Framework Plugin - Research Findings & Implementation Plan

---
version: "1.0.0"
phase: "PLANNING"
team: "Team A"
agent_mode: "BMAD Master → Researcher"
created: "2026-02-01T04:47:56+07:00"
updated: "2026-02-01T04:56:25+07:00"
status: "RESEARCH_COMPLETE"
project: "idumb"
handoff_to: "User Review → Implementation"
---

## Executive Summary

This document presents comprehensive research findings for creating the **iDumb Meta-Framework Plugin** at `/Users/apple/Documents/coding-projects/idumb`. This is a shift from project-specific implementation (project-alpha-master/.opencode/plugins/) to a **universal meta-plugin** installable in any project.

### Core Value Proposition

The Meta-Framework Plugin acts as a **wrapper** for popular software development frameworks (BMAD, Speckit, GSD) with these differentiators:

1. **Intelligent Automation**: Multi-hierarchy auto governance and handoff artifacts
2. **Advanced Context** (`.idumb-brain`): Classification, hierarchy, metadata tracking
3. **Expertise Boosting**: Enforced thinking frameworks, expert viewpoints
4. **Self-Governance**: Hierarchical validation gates, drift prevention

---

## User Review Required

> [!IMPORTANT]
> **Key Decisions Needed Before Implementation**
> 1. Plugin naming convention: `idumb` vs `meta-framework` vs `opencode-meta`?
> 2. Framework wrapper priority: Start with BMAD only, or include Speckit/GSD from start?
> 3. init command behavior: Interactive prompts or auto-detection for brownfield/greenfield?

---

## Section 1: OpenCode Plugin Architecture Research

### 1.1 Plugin Events Catalog (Complete)

Based on official documentation at https://opencode.ai/docs/plugins/:

| Event Category | Event Name | Use Case | Framework Application |
|---------------|------------|----------|----------------------|
| **Session** | `session.created` | New session lifecycle | Initialize state, load context-first |
| **Session** | `session.compacted` | Context reduction | Preserve SACRED Turn-1 anchors |
| **Session** | `session.idle` | Agent waiting | Self-audit triggers |
| **Session** | `session.status` | Status change | Monitor workflow progress |
| **Session** | `session.updated` | Any update | Artifact registry sync |
| **Session** | `session.deleted` | Cleanup | Archive brain artifacts |
| **Session** | `session.diff` | Changes | Track modifications |
| **Session** | `session.error` | Failures | Escalation handling |
| **Tool** | `tool.execute.before` | Pre-execution | Gatekeeping, context injection |
| **Tool** | `tool.execute.after` | Post-execution | Validation, governance checks |
| **Command** | `command.executed` | CLI execution | Log to `.brain/impacts/` |
| **File** | `file.edited` | File modification | Architecture violation checks |
| **File** | `file.watcher.updated` | FS changes | Artifact registry updates |
| **Message** | `message.updated` | Response changes | Drift detection |
| **Message** | `message.part.updated` | Partial updates | Fine-grained monitoring |
| **Message** | `message.removed` | Deletions | Track context changes |
| **Permission** | `permission.asked` | Permission request | Governance prompts |
| **Permission** | `permission.replied` | Permission granted | Log decisions |
| **TUI** | `tui.prompt.append` | Prompt modification | Inject verification reminders |
| **TUI** | `tui.command.execute` | Command execution | Custom CLI hooks |
| **TUI** | `tui.toast.show` | Notifications | Status alerts |
| **Todo** | `todo.updated` | TODO changes | subtask2 integration |
| **LSP** | `lsp.client.diagnostics` | IDE diagnostics | TypeScript error tracking |
| **Installation** | `installation.updated` | Plugin updates | Version management |
| **Server** | `server.connected` | Server connection | Initialization |

### 1.2 Transform Hooks (Critical for Context Manipulation)

These are the **most powerful** hooks for the meta-framework:

#### 1.2.1 `experimental.chat.messages.transform`
- **Source**: `packages/opencode/src/session/prompt.ts` (line ~4101)
- **Capability**: Full manipulation of message history array
- **Use Cases**:
  - **SACRED Turn-1 Intent Anchoring**: Capture and preserve original user intent
  - **Agent Detection Layer**: Scan for @mentions, extract agent name
  - **Context Injection**: Prepend critical context to conversation

```typescript
// Example: Messages Transform Hook
"experimental.chat.messages.transform": async (input, output) => {
  // output.messages is the full message array
  // Can be manipulated before sent to LLM
  
  // 1. Detect agent from first user message
  const firstUserMessage = output.messages.find(m => m.role === "user");
  if (firstUserMessage?.content.includes("@supreme-coordinator")) {
    sessionContextMap.set(input.sessionID, { agent: "supreme-coordinator" });
  }
  
  // 2. Inject Turn-1 anchor reminder
  const anchorReminder = {
    role: "system" as const,
    content: "## SACRED ANCHOR: Original Intent\n" + firstUserMessage?.content
  };
  output.messages.unshift(anchorReminder);
}
```

#### 1.2.2 `experimental.chat.system.transform`
- **Source**: `packages/opencode/src/session/prompt.ts` (line ~1936)  
- **Capability**: Inject content into system prompt array
- **Use Cases**:
  - **Active SKILL Injection**: Load SKILL.md content at runtime
  - **Agent Role Context**: Inject role-specific instructions
  - **Governance Rules**: Enforce validation requirements

```typescript
// Example: System Transform Hook
"experimental.chat.system.transform": async (input, output) => {
  const agentContext = sessionContextMap.get(input.sessionID);
  
  if (agentContext?.agent === "supreme-coordinator") {
    output.system.push(`
## SUPREME COORDINATOR GOVERNANCE
- You are the HIGHEST level orchestrator
- NEVER execute directly - delegate to specialized agents
- Validate ALL completion claims with evidence
- Maintain LOOP_STATE.yaml after delegations
`);
  }
}
```

#### 1.2.3 `experimental.session.compacting`
- **Source**: `packages/opencode/src/session/compaction.ts` (line ~1049)
- **Capability**: Custom compaction prompt/context injection
- **Use Cases**:
  - **Gold Standard Schema**: Preserve anchors, phase_tracking, artifact_registry
  - **Intent Chain**: Maintain delegation history
  - **Workflow State**: Track active phase and agent

```typescript
// Example: Compaction Hook
"experimental.session.compacting": async (input, output) => {
  // Option 1: Add to context (additive)
  output.context.push(`
## GOLD STANDARD COMPACTION SCHEMA
anchors:
  original_intent: "${capturedIntent}"
  turn_1_verbatim: "${turnOneMessage}"
phase_tracking:
  current_phase: "${currentPhase}"
  workflow: "${activeWorkflow}"
`);

  // Option 2: Replace entire prompt (complete control)  
  output.prompt = CUSTOM_COMPACTION_PROMPT;
}
```

### 1.3 SDK APIs for Programmatic Control

Based on https://opencode.ai/docs/sdk/:

| API | Purpose | Framework Use |
|-----|---------|--------------|
| `session.prompt({ noReply: true, parts })` | Inject context without AI response | Zero-turn agent priming |
| `session.messages({ path })` | Get message history | Honest assessment synthesis |
| `session.children({ path })` | Get child sessions | Chain of custody tracking |
| `event.subscribe()` | Real-time event stream | Event-driven architecture |
| `tui.appendPrompt({ text })` | Append to user prompt | Inject verification reminders |
| `tui.showToast({ message, variant })` | Show notifications | Status updates |
| `find.text({ pattern })` | Search codebase | Fuzzy keyword search for LTC-OD |
| `find.files({ query })` | Find files | Artifact discovery |
| `file.read({ path })` | Read file content | SKILL loading |

---

## Section 2: BUN-Module Template Analysis

### 2.1 Template Structure

The recommended template for OpenCode plugins is now **bun-module** (https://github.com/zenobi-us/bun-module):

```
template/
├── .github/
│   └── workflows/
│       ├── pr-title.yml
│       ├── pr.yml
│       ├── publish.yml
│       └── release.yml
├── .mise/
│   └── tasks/
│       ├── build
│       ├── dev
│       ├── format
│       ├── lint
│       ├── publish
│       ├── test
│       ├── typecheck
│       └── version
├── src/
│   └── index.ts
├── .gitignore
├── .prettierrc
├── AGENTS.md
├── CHANGELOG.md
├── eslint.config.js
├── hk.pkl
├── LICENSE
├── mise.toml
├── package.json
├── README.md
├── release-please-config.json
├── RELEASE.md
└── tsconfig.json
```

### 2.2 Key Configuration Files

**package.json structure**:
```json
{
  "name": "@idumb/meta-framework",
  "type": "module",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "lint": "eslint .",
    "test": "vitest"
  },
  "dependencies": {
    "@opencode-ai/plugin": "latest",
    "@opencode-ai/sdk": "latest"
  },
  "peerDependencies": {
    "@opencode-ai/plugin": ">=0.1.0"
  }
}
```

### 2.3 Plugin Type Definition

```typescript
import type { Plugin } from "@opencode-ai/plugin";

export const MetaFrameworkPlugin: Plugin = async (ctx) => {
  // ctx provides access to project root, config, etc.
  
  return {
    // Event handlers
    "session.created": async (event) => { /* ... */ },
    "tool.execute.before": async (input, output) => { /* ... */ },
    
    // Transform hooks
    "experimental.chat.messages.transform": async (input, output) => { /* ... */ },
    "experimental.chat.system.transform": async (input, output) => { /* ... */ },
    "experimental.session.compacting": async (input, output) => { /* ... */ },
  };
};

export default MetaFrameworkPlugin;
```

---

## Section 3: Lessons Learned from Project-Alpha-Master

### 3.1 master-orchestrator.ts Analysis (2321 lines)

The existing implementation showcases a **modular architecture**:

| Module | Lines | Purpose | Meta-Framework Relevance |
|--------|-------|---------|-------------------------|
| `StateSyncModule` | 143 | LOOP_STATE.yaml management | Keep as core state tracking |
| `ContextFirstModule` | 180 | Delegation context injection | Expand for all agent roles |
| `ArchitectureModule` | 115 | Architecture violation checks | Make configurable per project |
| `BrownfieldModule` | 52 | Deprecated path blocking | Parameterize via config |
| `GodArtifactModule` | 42 | File size limits | Configurable thresholds |
| `GovernanceModule` | 60 | Command execution | Abstract for different frameworks |
| `WorkflowRouter` | ~100 | Workflow detection | Expand for BMAD/Speckit/GSD |

### 3.2 Key Patterns to Preserve

1. **Modular Design**: Each concern is a separate module with clear interfaces
2. **State Persistence**: YAML-based state files for cross-session continuity
3. **Event-Driven**: Heavy use of emitEvent() for decoupled coordination
4. **Configuration Object**: Centralized CONFIG for all paths and settings
5. **Logging**: Consistent logging with levels and file output

### 3.3 Anti-Patterns to Avoid

From `last-session-hallucination.md` (788 lines of lessons):

1. **❌ Hardcoded Project Paths**: Replace with `framework-config.yaml`
2. **❌ Single Monolithic Plugin**: Split into 5-plugin ecosystem
3. **❌ Agent Detection Blind Spot**: Implement Zero-Turn Agent Priming
4. **❌ SKILL Inertia**: Active runtime injection instead of passive reference
5. **❌ No Verification Bounce**: Mandatory evidence before completion claims

---

## Section 4: Meta-Framework Architecture Proposal

### 4.1 Plugin Ecosystem (5-Plugin Split)

```
.idumb/
├── packages/
│   ├── core/               # Core orchestration & state
│   │   ├── src/
│   │   │   ├── state-manager.ts
│   │   │   ├── event-bus.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── context-first/      # Context injection & routing
│   │   ├── src/
│   │   │   ├── pwac.ts     # Purified Workflow-Aware Context
│   │   │   ├── ltc-od.ts   # Long-Term Context on Demand
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── governance/         # Validation & enforcement
│   │   ├── src/
│   │   │   ├── gates.ts
│   │   │   ├── ssot.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── intelligence/       # Agent routing & skills
│   │   ├── src/
│   │   │   ├── agent-router.ts
│   │   │   ├── skill-chains.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── validation-gate/    # Verification bounces
│       ├── src/
│       │   ├── bounces.ts
│       │   └── index.ts
│       └── package.json
│
├── framework-wrappers/
│   ├── bmad/               # BMAD integration
│   ├── speckit/            # Speckit integration
│   └── gsd/                # GSD integration
│
├── cli/                    # CLI tools
│   └── src/
│       ├── init.ts         # init command
│       ├── status.ts
│       └── index.ts
│
├── templates/              # Templates for init
│   ├── agents/
│   ├── skills/
│   └── workflows/
│
├── framework-config.yaml   # Project configuration
└── package.json
```

### 4.2 Configuration-First Design

**framework-config.yaml** (configurable per project):

```yaml
# Framework Configuration
version: "1.0.0"
project_type: "brownfield" | "greenfield"  # Auto-detected or specified

# Wrapped frameworks
frameworks:
  bmad:
    enabled: true
    version: "6.0"
    paths:
      workflows: "_bmad/bmm/workflows"
      agents: "_bmad/bmm/agents"
      output: "_bmad-output"
  speckit:
    enabled: false
  gsd:
    enabled: false

# Architecture rules (project-specific)
architecture:
  layers:
    - name: "infrastructure"
      path: "src/infrastructure"
    - name: "domain"
      path: "src/domain"
    - name: "presentation"
      path: "src/presentation"
  
  god_limits:
    store: 300
    component: 400
    service: 500
  
  deprecated_paths:
    - pattern: "src/lib"
      replacement: "src/infrastructure"

# Brain configuration
brain:
  path: ".idumb-brain"
  auto_archive: true
  retention_days: 30

# Agent hierarchy
agents:
  supreme_coordinator:
    auto_load: true
    skills: ["context-first", "hierarchy-orchestration"]
```

---

## Section 5: Implementation Plan

### Phase 1: Project Scaffolding (CLI)

#### [NEW] `/Users/apple/Documents/coding-projects/idumb/package.json`
Initialize npm workspace for monorepo structure

#### [NEW] `/Users/apple/Documents/coding-projects/idumb/cli/src/init.ts`
Create `idumb init` command that:
1. Detects brownfield vs greenfield
2. Runs codebase analysis
3. Generates `framework-config.yaml`
4. Copies template agents/skills/workflows
5. Sets up `.idumb-brain` directory

---

### Phase 2: Core Plugin

#### [NEW] `/Users/apple/Documents/coding-projects/idumb/packages/core/src/index.ts`
Core state management and event bus, ported from StateSyncModule

---

### Phase 3: Context-First Plugin

#### [NEW] `/Users/apple/Documents/coding-projects/idumb/packages/context-first/src/pwac.ts`
Purified Workflow-Aware Context with SACRED Turn-1 anchoring

---

### Phase 4: Framework Wrappers

#### [NEW] `/Users/apple/Documents/coding-projects/idumb/framework-wrappers/bmad/index.ts`
BMAD integration wrapper

---

## Verification Plan

### Automated Tests

Since this is a new plugin project, we need to create tests:

1. **Unit Tests** (Vitest):
```bash
cd /Users/apple/Documents/coding-projects/idumb
pnpm test
```
Tests to create:
- State manager persistence
- Event bus subscription/emit
- Config loading
- Agent detection

2. **Integration Tests**:
Manual testing with OpenCode to verify plugin loads and events fire

### Manual Verification

1. **Init Command**:
   - Run `idumb init` in a test project
   - Verify `framework-config.yaml` is generated
   - Verify templates are copied

2. **Plugin Loading**:
   - Install plugin in OpenCode via npm link
   - Check plugin appears in OpenCode plugin list
   - Verify events fire on session.created

3. **Context Injection**:
   - Start a session with @supreme-coordinator
   - Verify agent detection works
   - Check system prompt contains governance rules

---

## Next Steps

1. **User Review**: Approve this plan before implementation
2. **Scaffold Project**: Create monorepo structure with bun-module template
3. **Port Core Module**: Migrate StateSyncModule from master-orchestrator.ts
4. **Implement Transform Hooks**: PWAC and SACRED anchoring
5. **Create CLI**: `idumb init` command
6. **Test Integration**: Verify with OpenCode

---

*Generated by BMAD Master + Research Workflow*  
*Research Sources: OpenCode docs, bun-module template, project-alpha-master analysis*
