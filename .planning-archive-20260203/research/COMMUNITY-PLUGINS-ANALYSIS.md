# OpenCode Community Plugins Analysis for iDumb v2

**Research Date:** 2026-02-02  
**Researcher:** GSD Domain Researcher  
**Confidence Level:** HIGH (based on official GitHub documentation)

---

## Executive Summary

The OpenCode plugin ecosystem has matured significantly, with 170+ plugins addressing key AI coding agent challenges. This analysis examines 9 high-priority plugins that demonstrate best practices for **"Less for More"**, **"Accurately Specific"**, and **"Auto Governance"** - the three pillars of iDumb v2.

### Key Insights for iDumb v2

| Principle | Learned From | iDumb v2 Application |
|-----------|--------------|---------------------|
| **Less for More** | opencode-skillful, DCP | Lazy-load governance rules, prune obsolete context |
| **Accurately Specific** | micode, oh-my-opencode | Structured workflows, specialized agent roles |
| **Auto Governance** | background-agents, pocket-universe | Async delegation, session continuity, context persistence |

---

## Plugin Deep Dives

### 1. opencode-skillful (144★) - Lazy-Load Prompts

**Repository:** https://github.com/zenobi-us/opencode-skillful  
**Core Problem:** Context bloat from pre-loading all skills  
**Solution:** On-demand skill discovery and injection

#### Key Patterns

```typescript
// Three core tools enable lazy loading
skill_find("git commit")      // Discover relevant skills
skill_use("experts_writing_git_commits")  // Load on demand
skill_resource(skill_name, path)  // Read specific resources
```

#### "Less for More" Implementation

| Aspect | Built-in OpenCode | opencode-skillful |
|--------|------------------|-------------------|
| Loading | All skills pre-loaded | Lazy-loaded only when used |
| Memory | All skills consume tokens | Only loaded skills consume tokens |
| Discovery | Limited built-in set | Extensible, custom skills |
| Format | Fixed markdown | Model-specific (XML/JSON/Markdown) |

#### Architecture Highlights

- **ReadyStateMachine**: Async coordination ensures tools don't execute before registry initialization
- **Pre-indexed Resources**: Security-first approach - no path traversal possible
- **Model-aware Rendering**: Different formats for Claude (XML), GPT (JSON), Llama (Markdown)

#### iDumb v2 Adaptation

**Pattern to Adopt:** Lazy-load governance rules only when needed

```typescript
// Instead of loading all iDumb rules upfront
governance_find("validation")     // Find relevant governance rules
governance_use("phase-boundaries") // Load specific rule set
governance_resource("conflict-resolution.md") // Read specific guidance
```

---

### 2. opencode-background-agents (51★) - Async Delegation

**Repository:** https://github.com/kdcokenny/opencode-background-agents  
**Core Problem:** Context compaction loses research results  
**Solution:** Async delegation with disk persistence

#### Key Workflow

```
1. Delegate    →  "Research OAuth2 PKCE best practices"
2. Continue    →  Keep coding, brainstorming, reviewing
3. Notified    →  <system-reminder> tells you it's done
4. Retrieve    →  AI calls delegation_read() to get result
```

#### Context Persistence Pattern

```typescript
// Results saved to disk survive compaction
~/.local/share/opencode/delegations/{id}.md

// Each delegation tagged with title + summary
// AI can scan past research and find relevant work
```

#### "Auto Governance" Implementation

- **Read-Only Safety**: Only read-only agents can use `delegate`
- **Undo System Protection**: Write-capable agents must use native `task` tool
- **15-minute Timeout**: Prevents runaway background tasks

#### iDumb v2 Adaptation

**Pattern to Adopt:** Async validation agents that persist results

```typescript
// Spawn background validation agent
delegate("Check for circular dependencies in state management")
// Continue with implementation
// Later: retrieve validation results
delegation_read(validation_id) // Always available, survives compaction
```

---

### 3. opencode-workspace (75★) - Multi-Agent Orchestration Bundle

**Repository:** https://github.com/kdcokenny/opencode-workspace  
**Core Problem:** Setting up multi-agent workflows is complex  
**Solution:** Pre-configured bundle with 16 components

#### Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     ORCHESTRATORS                        │
│         ┌──────┐                    ┌───────┐            │
│         │ plan │                    │ build │            │
│         └──┬───┘                    └───┬───┘            │
└────────────┼────────────────────────────┼────────────────┘
             │                            │
     ┌───────┴───────┐            ┌───────┴───────┐
     ▼       ▼       ▼            ▼       ▼       ▼
┌─────────────────────────────────────────────────────────┐
│                      SPECIALISTS                        │
│  ┌─────────┐ ┌────────────┐ ┌───────┐ ┌──────┐ ┌──────┐ │
│  │ explore │ │ researcher │ │ coder │ │scribe│ │review│ │
│  └─────────┘ └────────────┘ └───────┘ └──────┘ └──────┘ │
└─────────────────────────────────────────────────────────┘
```

#### Bundle Components

| Category | Components |
|----------|------------|
| **Plugins** | workspace-plugin, background-agents, notify, worktree, DCP, md-table-formatter |
| **MCP Servers** | Context7 (docs), Exa (web search), GitHub Grep |
| **Agents** | researcher, coder, scribe, reviewer |
| **Skills** | plan-protocol, code-review, code-philosophy, frontend-philosophy |

#### Permission Boundaries

| Agent | Permissions |
|-------|-------------|
| plan/build | Read-only orchestrators, delegate via `task` tool |
| researcher | Read-only, MCP tools only |
| coder | Full file + bash access |
| scribe | File write only, no bash |
| reviewer | Read-only + git inspection |

#### iDumb v2 Adaptation

**Pattern to Adopt:** Pre-configured governance bundles with permission boundaries

```typescript
// Bundle structure for iDumb v2
idumb-governance-bundle/
├── agents/
│   ├── validator/     # Read-only, validation tools only
│   ├── enforcer/      # Can write state, no bash
│   └── orchestrator/  # Read-only, delegates via task
├── skills/
│   ├── governance-protocol/
│   ├── conflict-resolution/
│   └── validation-patterns/
└── permissions/
    └── validator-rules.json
```

---

### 4. micode (167★) - Brainstorm → Plan → Implement

**Repository:** https://github.com/vtemian/micode  
**Core Problem:** Unstructured workflow leads to poor outcomes  
**Solution:** Three-phase structured workflow with session continuity

#### Workflow Phases

```
Brainstorm → Plan → Implement
     ↓         ↓        ↓
  research  research  executor
```

| Phase | Output | Key Activities |
|-------|--------|----------------|
| **Brainstorm** | `thoughts/shared/designs/YYYY-MM-DD-{topic}-design.md` | Collaborative questioning, parallel research subagents |
| **Plan** | `thoughts/shared/plans/YYYY-MM-DD-{topic}.md` | Bite-sized tasks (2-5 min), exact file paths, TDD workflow |
| **Implement** | Working code | Git worktree isolation, implementer→reviewer cycles |

#### Agent Hierarchy

```
commander (Orchestrator)
├── brainstormer (Design exploration)
├── planner (Implementation plans)
├── executor (Orchestrate implement→review)
│   ├── implementer (Execute tasks)
│   └── reviewer (Check correctness)
├── codebase-locator (Find file locations)
├── codebase-analyzer (Deep code analysis)
├── pattern-finder (Find existing patterns)
├── project-initializer (Generate project docs)
├── ledger-creator (Continuity ledgers)
└── artifact-searcher (Search past work)
```

#### Session Continuity Mechanism

```typescript
// Auto-compaction at 50% context usage
compactionThreshold: 0.5

// Continuity ledger survives sessions
thoughts/ledgers/CONTINUITY_{session}.md

// Commands for session management
/init      // Initialize project docs
/ledger    // Create/update continuity ledger
/search    // Search past plans and ledgers
```

#### "Accurately Specific" Implementation

- **Task Sizing**: 2-5 minute tasks prevent overwhelm
- **Exact File Paths**: No guessing where files are
- **TDD Workflow**: Each task has test criteria
- **Parallel Investigation**: Multiple subagents explore simultaneously

#### iDumb v2 Adaptation

**Pattern to Adopt:** Structured governance workflow

```typescript
// iDumb v2 governance workflow
governance-brainstorm → governance-plan → governance-implement

// Brainstorm: What governance rules apply?
// Plan: Create validation plan with specific checks
// Implement: Execute validation, update state
```

---

### 5. opencode-dynamic-context-pruning (668★) - Token Optimization

**Repository:** https://github.com/Opencode-DCP/opencode-dynamic-context-pruning  
**Core Problem:** Token bloat from obsolete tool outputs  
**Solution:** Intelligent context pruning with multiple strategies

#### Pruning Strategies

| Strategy | How It Works | Cost |
|----------|--------------|------|
| **Deduplication** | Keep only most recent of repeated tool calls | Zero LLM cost |
| **Supersede Writes** | Remove write inputs when file subsequently read | Zero LLM cost |
| **Purge Errors** | Remove errored tool inputs after N turns | Zero LLM cost |
| **Discard Tool** | AI removes completed/noisy tool content | LLM-driven |
| **Extract Tool** | Distill key findings before removing raw content | LLM-driven |

#### Configuration Hierarchy

```
Defaults → Global (~/.config/opencode/dcp.jsonc)
       → Config Dir ($OPENCODE_CONFIG_DIR/dcp.jsonc)
       → Project (.opencode/dcp.jsonc)
```

#### Protected Tools (Never Pruned)

```typescript
// Critical tools protected by default
['task', 'todowrite', 'todoread', 'discard', 'extract', 'batch', 'write', 'edit']
```

#### Cache Impact Trade-off

| Metric | With DCP | Without DCP |
|--------|----------|-------------|
| Cache Hit Rate | ~65% | ~85% |
| Context Size | Significantly reduced | Bloated |
| Best For | GitHub Copilot, Google Antigravity | Anthropic, OpenAI |

#### iDumb v2 Adaptation

**Pattern to Adopt:** Prune obsolete governance context

```typescript
// iDumb v2 governance pruning strategies
1. Deduplicate: Multiple state reads → keep only latest
2. Supersede: Old validation results → remove when new validation exists
3. Protected: Phase boundaries, conflict resolutions always preserved
4. Extract: Distill governance decisions before removing detailed context
```

---

### 6. opencode-agent-memory (28★) - Cross-Session Memory Blocks

**Repository:** https://github.com/joshuadavidthomas/opencode-agent-memory  
**Core Problem:** Context lost across sessions  
**Solution:** Letta-style editable memory blocks

#### Memory Block Structure

```yaml
---
label: project
description: Codebase-specific knowledge (commands, architecture, conventions)
limit: 5000
read_only: false
---

# Content here
```

#### Default Memory Blocks

| Block | Scope | Purpose |
|-------|-------|---------|
| `persona` | Global | How the agent should behave |
| `human` | Global | Details about user (preferences, habits) |
| `project` | Project | Codebase-specific knowledge |

#### Memory Locations

```
Global: ~/.config/opencode/memory/*.md
Project: .opencode/memory/*.md (auto-gitignored)
```

#### Tools for Memory Management

```typescript
memory_list()  // List available blocks with metadata
memory_set()   // Create or update block (full overwrite)
memory_replace() // Replace substring within block
```

#### iDumb v2 Adaptation

**Pattern to Adopt:** Governance state blocks

```typescript
// iDumb v2 memory blocks
governance_state.md       // Current phase, validation status
governance_history.md     // Past governance decisions
governance_conflicts.md   // Known conflict patterns

// Survives across sessions
// Agent can read/update own governance memory
// Project-scoped and global scopes
```

---

### 7. plannotator (1.6k★) - Plan Review and Annotation

**Repository:** https://github.com/backnotprop/plannotator  
**Core Problem:** Plans are hard to review and provide feedback on  
**Solution:** Visual UI for plan annotation with structured feedback

#### Workflow

```
1. AI creates plan
2. Plannotator opens visual UI in browser
3. Human annotates plan (delete, insert, replace, comment)
4. Approve → Agent proceeds
5. Request changes → Annotations sent as structured feedback
```

#### Integration Points

```typescript
// OpenCode plugin
{ "plugin": ["@plannotator/opencode@latest"] }

// Commands
/plannotator-review  // Review with inline annotations
```

#### Features

- Line-number based annotations
- Image annotation (pen, arrow, circle tools)
- Auto-save to Obsidian and Bear Notes
- Private/offline sharing

#### iDumb v2 Adaptation

**Pattern to Adopt:** Human-in-the-loop governance review

```typescript
// Governance plan review workflow
1. AI creates governance plan (validation steps, conflict resolution)
2. Human reviews via plannotator-style UI
3. Annotations become structured feedback
4. Agent updates governance approach based on feedback
```

---

### 8. oh-my-opencode (27.2k★) - Batteries-Included Agent Harness

**Repository:** https://github.com/code-yeongyu/oh-my-opencode  
**Core Problem:** OpenCode requires extensive configuration  
**Solution:** Pre-configured multi-agent orchestration with 25+ hooks

#### Key Agents

| Agent | Model | Purpose |
|-------|-------|---------|
| **Sisyphus** | Claude Opus 4.5 High | Main orchestrator - "relentless until complete" |
| **Hephaestus** | GPT 5.2 Codex Medium | Autonomous deep worker, goal-oriented |
| **Oracle** | GPT 5.2 Medium | Design, debugging, architecture |
| **Frontend Engineer** | Gemini 3 Pro | Frontend development |
| **Librarian** | Claude Sonnet 4.5 | Docs, code search |
| **Explore** | Claude Haiku 4.5 | Fast codebase exploration |

#### Core Features

```typescript
// "ultrawork" keyword activates all features
// Background tasks run in parallel like a real dev team
// LSP & AST tools for deterministic refactoring
// Todo continuation enforcer - forces agent to finish
// Comment checker - prevents AI slop comments
```

#### Session Continuity Patterns

```typescript
// Ralph Loop - Iterative self-correcting execution
while (!complete) {
  agent.work();
  if (todosIncomplete) continue;
  if (testsFail) continue;
}

// Auto-resume on context loss
// Background agents continue while main agent works
// Results piped back when ready
```

#### "Accurately Specific" Implementation

- **Model Selection by Task**: Different models for different purposes
- **Permission Boundaries**: Each agent has specific capabilities
- **Hook System**: 25+ lifecycle hooks for precise control
- **Category-based Delegation**: `visual`, `business-logic`, custom categories

#### iDumb v2 Adaptation

**Pattern to Adopt:** Specialized governance agents

```typescript
// iDumb v2 agent hierarchy
idumb-orchestrator/       // Main governance coordinator
├── idumb-validator/      // Lightweight validation (Haiku)
├── idumb-analyzer/       // Deep analysis (Sonnet)
├── idumb-researcher/     // External pattern research
└── idumb-enforcer/       // State updates, no bash

// Each with specific models and permissions
// Hierarchical delegation following iDumb governance rules
```

---

### 9. pocket-universe (21★) - Closed Loop Async Agents

**Repository:** https://github.com/spoons-and-mirrors/pocket-universe  
**Core Problem:** Async agents fire-and-forget, lose context  
**Solution:** Closed-loop resilient async with main thread blocking

#### Three Core Tools

```typescript
// 1. broadcast - Inter-agent messaging
broadcast(message="...")                          // Status update
broadcast(send_to="agentB", message="...")        // Direct message
broadcast(reply_to=1, message="...")              // Reply to message

// 2. subagent - Create sibling agents (async)
subagent(prompt="Build the login form", description="Login UI")
// Returns immediately, caller continues
// Output piped as message when complete

// 3. recall - Query agent history
recall()                                          // All agents
recall(agent_name="agentA")                       // Specific agent
recall(agent_name="agentA", show_output=true)     // Include output
```

#### Key Behaviors

| Feature | Behavior |
|---------|----------|
| **Async Firing** | `subagent()` returns immediately, caller continues |
| **Output Piping** | Subagent output arrives as message in caller session |
| **Main Thread Block** | Main session waits for ALL subagents to complete |
| **Auto-Resume** | Idle agents wake when receiving messages |
| **Worktree Isolation** | Each agent operates in isolated git worktree |

#### Session Lifecycle

```
Agent finishes → Check pending subagents → Wait for completion
                                     ↓
              Subagents pipe output as messages → Check unread messages
                                     ↓
              Has unread? → Resume session → Process messages → Loop
              No unread? → Session completes → Main continues
```

#### iDumb v2 Adaptation

**Pattern to Adopt:** Closed-loop governance validation

```typescript
// Spawn parallel validators
subagent("Check state.json schema compliance")
subagent("Verify git hash alignment")
subagent("Detect circular dependencies")

// Continue with main work
// All results piped back when ready
// Main thread resumes only when all validations complete

// Pocket Universe Summary includes all validation results
```

---

## Cross-Cutting Patterns Summary

### "Less for More" Patterns

| Plugin | Pattern | iDumb v2 Application |
|--------|---------|---------------------|
| opencode-skillful | Lazy-load skills on demand | Lazy-load governance rules |
| DCP | Prune obsolete context | Prune old validation results |
| oh-my-opencode | Background agents for research | Async governance validation |

### "Accurately Specific" Patterns

| Plugin | Pattern | iDumb v2 Application |
|--------|---------|---------------------|
| micode | 3-phase structured workflow | Governance workflow phases |
| oh-my-opencode | Model-specific agent roles | Validation agent hierarchy |
| opencode-skillful | Model-aware format rendering | Governance rule formatting |
| plannotator | Visual plan review | Human-in-the-loop governance |

### "Auto Governance" Patterns

| Plugin | Pattern | iDumb v2 Application |
|--------|---------|---------------------|
| opencode-agent-memory | Persistent memory blocks | Governance state persistence |
| background-agents | Context survives compaction | Validation results persist |
| pocket-universe | Closed-loop async | Parallel validation with sync |
| oh-my-opencode | Todo enforcer | Governance completion tracking |
| micode | Session continuity ledgers | Cross-session governance state |

---

## Recommendations for iDumb v2

### 1. Implement Lazy-Loaded Governance Rules

Based on opencode-skillful pattern:

```typescript
// Instead of loading all governance upfront
governance_find("validation")           // Search available rules
governance_use("phase-boundaries")      // Load specific rule set
governance_use("conflict-resolution")   // Load another set
// Only loaded rules consume context
```

### 2. Implement Context Pruning for Governance

Based on DCP pattern:

```typescript
// Automatic strategies (zero cost)
- Deduplicate state reads (keep only latest)
- Supersede old validation results
- Purge errored validation attempts after N turns

// LLM-driven strategies
- Discard: Remove completed governance tool content
- Extract: Distill governance decisions before removing details
```

### 3. Implement Session Continuity

Based on micode + agent-memory patterns:

```typescript
// Continuity ledger
~/.idumb/ledgers/CONTINUITY_{session}.md

// Memory blocks
~/.idumb/memory/
├── governance_state.md      // Current phase, status
├── governance_history.md    // Past decisions
├── validation_patterns.md   // Learned patterns
└── conflict_resolution.md   // Known conflicts
```

### 4. Implement Async Validation

Based on background-agents + pocket-universe patterns:

```typescript
// Spawn parallel validators
delegate("Check manifest consistency")
delegate("Verify git hash alignment")
delegate("Detect state drift")

// Results persisted to disk
~/.idumb/validations/{id}.md

// Retrieve when needed
governance_read_validation(id)
```

### 5. Implement Structured Governance Workflow

Based on micode pattern:

```
governance-brainstorm → governance-plan → governance-implement
       ↓                      ↓                  ↓
   identify rules       create checks       execute validation
   assess risks         define thresholds   update state
   research patterns    plan remediation    report results
```

### 6. Implement Permission Boundaries

Based on opencode-workspace pattern:

| Agent | Permissions | Tools |
|-------|-------------|-------|
| idumb-orchestrator | Read-only | task tool for delegation |
| idumb-validator | Read-only | validation tools only |
| idumb-enforcer | Write state | state tools, no bash |
| idumb-researcher | Read-only | MCP tools only |

---

## Anti-Patterns to Avoid

| Anti-Pattern | Why Bad | What To Do Instead |
|--------------|---------|-------------------|
| Pre-load all governance rules | Context bloat | Lazy-load only needed rules |
| Store validation in context | Lost on compaction | Persist to disk, reference by ID |
| Single agent for all governance | No specialization | Specialized agents with boundaries |
| Synchronous validation only | Blocks main work | Async validation with retrieval |
| Manual governance tracking | Error-prone | Auto-enforced todo continuation |
| One-size-fits-all prompts | Model inefficiency | Model-specific format rendering |

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Plugin capabilities | HIGH | Official GitHub documentation reviewed |
| Implementation patterns | HIGH | Source code analysis from README/architecture docs |
| Ecosystem trends | MEDIUM | Based on plugin popularity and recent updates |
| iDumb v2 applicability | MEDIUM | Requires adaptation for specific governance needs |

---

## Sources

- https://github.com/zenobi-us/opencode-skillful
- https://github.com/kdcokenny/opencode-background-agents
- https://github.com/kdcokenny/opencode-workspace
- https://github.com/vtemian/micode
- https://github.com/Opencode-DCP/opencode-dynamic-context-pruning
- https://github.com/joshuadavidthomas/opencode-agent-memory
- https://github.com/backnotprop/plannotator
- https://github.com/code-yeongyu/oh-my-opencode
- https://github.com/spoons-and-mirrors/pocket-universe
- https://github.com/awesome-opencode/awesome-opencode (ecosystem overview)

---

## Research Complete

This analysis provides patterns and recommendations for implementing iDumb v2's three core principles:

1. **Less for More**: Lazy-loaded governance rules with context pruning
2. **Accurately Specific**: Structured workflow with specialized agent roles
3. **Auto Governance**: Async validation with session continuity and persistence

Ready for roadmap creation.
