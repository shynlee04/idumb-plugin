# Architecture Patterns

**Project:** iDumb Meta-Framework Plugin
**Researched:** 2026-02-02

---

## Recommended Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         OpenCode Platform                            │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                      iDumb Plugin Layer                          ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ ││
│  │  │   Hooks     │  │   Tools     │  │    State Manager        │ ││
│  │  │  (events)   │  │  (agents)   │  │   (.idumb/brain/)       │ ││
│  │  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘ ││
│  │         │                │                      │               ││
│  │         └────────────────┴──────────────────────┘               ││
│  │                          │                                       ││
│  │  ┌───────────────────────▼────────────────────────────────────┐ ││
│  │  │                  GSD Framework (Wrapped)                     │ ││
│  │  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌───────────────┐  │ ││
│  │  │  │ Commands│  │ Agents  │  │ Workflow│  │ .planning/    │  │ ││
│  │  │  │ /gsd:*  │  │         │  │ STATE.md│  │ research/     │  │ ││
│  │  │  └─────────┘  └─────────┘  └─────────┘  └───────────────┘  │ ││
│  │  └────────────────────────────────────────────────────────────┘ ││
│  └─────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
```

---

## Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|----------------|-------------------|
| **npm Plugin** | Entry point, event hooks, tool registration | OpenCode runtime, State Manager |
| **State Manager** | Context classification, hierarchy, persistence | Plugin hooks, Agents, Tools |
| **Agent Hierarchy** | Governance levels, delegation patterns | Tools, GSD agents |
| **Command Wrappers** | Pre/post hooks for GSD commands | GSD commands, State Manager |
| **Custom Tools** | Agent-facing capabilities | Agents, State Manager |
| **GSD Layer** | Original GSD framework (unmodified) | iDumb wrappers |

---

## Agent Hierarchy Design

### Three-Tier Model

```
┌─────────────────────────────────────────────────────────────────┐
│                    TIER 1: COORDINATOR                           │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                idumb-supreme-coordinator                     ││
│  │  • Never executes work directly                              ││
│  │  • Delegates to Tier 2 agents                                ││
│  │  • Synthesizes results from delegation                       ││
│  │  • Maintains master governance state                         ││
│  │  • mode: primary, hidden: false                              ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    TIER 2: GOVERNORS                             │
│  ┌──────────────────────┐  ┌──────────────────────────────────┐ │
│  │ idumb-high-governor  │  │ idumb-phase-governor             │ │
│  │ • Cross-phase checks │  │ • Within-phase validation        │ │
│  │ • Architecture drift │  │ • Task completion quality        │ │
│  │ • mode: subagent     │  │ • mode: subagent                 │ │
│  └──────────────────────┘  └──────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    TIER 3: VALIDATORS                            │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────────┐ │
│  │ idumb-code-val │  │ idumb-state-val│  │ idumb-context-val  │ │
│  │ • grep, glob   │  │ • STATE.md     │  │ • .idumb-brain     │ │
│  │ • File checks  │  │ • Consistency  │  │ • Staleness check  │ │
│  │ • mode: sub    │  │ • mode: sub    │  │ • mode: subagent   │ │
│  │ • hidden: true │  │ • hidden: true │  │ • hidden: true     │ │
│  └────────────────┘  └────────────────┘  └────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Agent Mode Configuration

| Agent | Mode | Hidden | Tools Access | Can Delegate To |
|-------|------|--------|--------------|-----------------|
| idumb-supreme-coordinator | primary | false | Limited (no write) | Tier 2 |
| idumb-high-governor | subagent | false | Read + validate | Tier 3 |
| idumb-phase-governor | subagent | false | Read + validate | Tier 3 |
| idumb-code-validator | subagent | true | Read-only (grep, glob) | None |
| idumb-state-validator | subagent | true | Read-only | None |
| idumb-context-validator | subagent | true | Read-only | None |

---

## Data Flow

### Session Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│                      SESSION CREATED                             │
└───────────────────────────┬─────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  Plugin Hook: session.created                                    │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 1. Load .idumb/brain/state.json                              ││
│  │ 2. Check for stale context markers                           ││
│  │ 3. Initialize governance state                               ││
│  │ 4. Inject anchored context                                   ││
│  └─────────────────────────────────────────────────────────────┘│
└───────────────────────────┬─────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ACTIVE SESSION                                │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ tool.execute.before:                                         ││
│  │   • Validate action against governance rules                 ││
│  │   • Inject context requirements                              ││
│  │                                                               ││
│  │ tool.execute.after:                                          ││
│  │   • Track state changes                                      ││
│  │   • Update governance metrics                                ││
│  └─────────────────────────────────────────────────────────────┘│
└───────────────────────────┬─────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  Plugin Hook: experimental.session.compacting                    │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 1. Serialize critical state to output.context               ││
│  │ 2. Include governance checkpoints                           ││
│  │ 3. Mark stale context for exclusion                         ││
│  └─────────────────────────────────────────────────────────────┘│
└───────────────────────────┬─────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  Plugin Hook: session.idle                                       │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 1. Persist state to .idumb/brain/state.json                 ││
│  │ 2. Update governance history                                 ││
│  │ 3. Cleanup temporary artifacts                               ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

## File System Structure

### Project-Level Installation

```
project/
├── .opencode/
│   ├── agents/
│   │   └── idumb-*.md              # iDumb agent definitions
│   ├── commands/
│   │   └── idumb/
│   │       ├── init.md
│   │       ├── status.md
│   │       ├── validate.md
│   │       └── brain.md
│   ├── tools/
│   │   ├── idumb-state.ts
│   │   ├── idumb-validate.ts
│   │   └── idumb-brain.ts
│   ├── skills/
│   │   └── idumb-expert-skeptic/
│   │       └── SKILL.md
│   ├── plugins/
│   │   └── idumb-plugin.ts         # If using local plugin mode
│   └── opencode.json               # Plugin reference
│
├── .idumb/
│   ├── config.json                 # iDumb-specific settings
│   ├── brain/
│   │   ├── state.json              # Current session state
│   │   ├── history/                # Historical states (timestamped)
│   │   │   └── 2026-02-02T12-00.json
│   │   ├── context/                # Classified context
│   │   │   ├── codebase.md         # Codebase knowledge
│   │   │   ├── governance.md       # Governance artifacts
│   │   │   └── sessions.md         # Session history
│   │   └── anchors/                # Context anchors
│   │       └── critical-decisions.md
│   ├── governance/
│   │   ├── validations/            # Validation history
│   │   │   └── 2026-02-02-phase-1.json
│   │   └── health.json             # Governance health score
│   └── prompts/
│       ├── expert-skeptic.txt      # Expert-skeptic prompt template
│       └── governance.txt          # Governance injection prompt
│
├── .planning/                      # GSD standard (preserved)
│   ├── research/
│   ├── quick/
│   ├── todos/
│   └── config.json
│
└── PROJECT.md                      # GSD project file
```

### Global Installation

```
~/.config/opencode/
├── agents/
│   └── idumb-*.md                  # Global agent definitions
├── commands/
│   └── idumb/
│       └── *.md
├── tools/
│   └── idumb-*.ts
├── skills/
│   └── idumb-*/
│       └── SKILL.md
├── plugins/
│   └── idumb-plugin.ts             # Global plugin (if local mode)
└── opencode.json                   # Global config with plugin ref
```

---

## Patterns to Follow

### Pattern 1: Event-Driven State Management

**What:** Use plugin events for all state changes
**When:** Any state modification
**Example:**
```typescript
"tool.execute.after": async (input, output) => {
  if (input.tool === "write" || input.tool === "edit") {
    await stateManager.trackFileChange({
      file: output.args.filePath,
      timestamp: Date.now(),
      agent: input.agent,
    })
  }
}
```

### Pattern 2: Context Anchoring

**What:** Preserve critical context through compaction
**When:** Any decision or state that must survive context limits
**Example:**
```typescript
"experimental.session.compacting": async (input, output) => {
  const anchors = await loadAnchors()
  output.context.push(`## iDumb Anchored Context
${anchors.map(a => `- [${a.priority}] ${a.content}`).join('\n')}`)
}
```

### Pattern 3: Governance Injection

**What:** Inject governance prompts into agent context
**When:** Before critical operations
**Example:**
```typescript
"tool.execute.before": async (input, output) => {
  if (input.tool === "task") {
    // Inject expert-skeptic prompt into task context
    output.prompt = `${EXPERT_SKEPTIC_PROMPT}\n\n${output.prompt}`
  }
}
```

### Pattern 4: Hierarchical Delegation

**What:** Coordinator delegates to governors, governors to validators
**When:** Any validation or governance check
**Example:**
```markdown
<!-- idumb-supreme-coordinator.md -->
---
mode: primary
permission:
  task:
    "idumb-high-governor": allow
    "idumb-phase-governor": allow
    "*": deny
---
You are the supreme coordinator. NEVER execute work directly.
Delegate all validation to: @idumb-high-governor or @idumb-phase-governor
```

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Direct TUI Output

**What:** Using console.log() or direct output
**Why bad:** Causes background text exposure in TUI
**Instead:** Use `client.app.log()` for all logging

### Anti-Pattern 2: Blocking Hooks

**What:** Long-running operations in before hooks
**Why bad:** Freezes user interaction
**Instead:** Async operations with timeouts, defer to validators

### Anti-Pattern 3: Replacing GSD Files

**What:** Modifying STATE.md, ROADMAP.md directly
**Why bad:** Breaks GSD compatibility
**Instead:** Use separate .idumb/ directory for iDumb state

### Anti-Pattern 4: Deep Agent Nesting

**What:** More than 3 levels of agent delegation
**Why bad:** Context degradation, debugging nightmare
**Instead:** Flat hierarchy with clear boundaries

### Anti-Pattern 5: Excessive Validation

**What:** Validating every single action
**Why bad:** Kills productivity, user frustration
**Instead:** Strategic validation points, user-controlled levels

---

## Scalability Considerations

| Concern | At 1 Phase | At 10 Phases | At 50 Phases |
|---------|------------|--------------|--------------|
| **State file size** | ~1KB | ~10KB | Needs rotation |
| **History storage** | All in memory | File-per-day | Archive + prune |
| **Validation speed** | Instant | <5 sec | Parallel validators |
| **Context anchors** | ~5 anchors | ~20 anchors | Priority-based pruning |

---

## Integration Points

### GSD Command Wrapping

| GSD Command | iDumb Pre-Hook | iDumb Post-Hook |
|-------------|----------------|-----------------|
| `/gsd:new-project` | Init .idumb/, load config | Update governance state |
| `/gsd:plan-phase` | Inject expert-skeptic | Validate plan quality |
| `/gsd:execute-phase` | Check governance health | Update execution history |
| `/gsd:verify-work` | Load validation criteria | Store validation results |

### OpenCode Event Mapping

| OpenCode Event | iDumb Handler |
|----------------|---------------|
| `session.created` | Load state, init context |
| `session.compacting` | Anchor critical context |
| `session.idle` | Persist state, cleanup |
| `tool.execute.before` | Validate, inject context |
| `tool.execute.after` | Track changes, update state |
| `message.updated` | Monitor for drift signals |

---

## Sources

- User requirements: `_bmad-output/planning-artifacts/research/improving-the-prototype.md`
- OpenCode capabilities: `OPENCODE-INTERNALS-2026-02-02.md`
- GSD patterns: `GSD-FRAMEWORK-2026-02-02.md`
