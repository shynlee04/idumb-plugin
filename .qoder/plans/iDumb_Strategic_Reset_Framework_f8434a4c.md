# iDumb Strategic Reset Framework

## Phase 0: Conceptual Foundation - Platform Concept Matrix

### Core Concepts Hierarchy (Universal Across Platforms)

```
SYSTEM LAYER (What LLM sees at conversation start)
├── System Prompt / System Instructions / System Rules
│   └── The foundational context that shapes ALL responses
│
├── Agents / Modes / Roles / Personas
│   ├── Main Agent (primary conversation handler)
│   └── Subagents (delegated specialists with isolated context)
│
├── Permissions (tool access control)
│   ├── Allow / Deny / Ask
│   └── Tool-specific whitelisting
│
└── Tools (actions the agent can perform)
    ├── Built-in (read, write, edit, bash, grep)
    └── Custom (MCP servers, plugins)

RUNTIME LAYER (What happens during conversation)
├── Commands / Prompts (user-initiated actions)
│   ├── Slash commands (/command)
│   └── Natural language prompts
│
├── Workflows (orchestrated sequences)
│   └── Multi-step task execution patterns
│
├── Hooks (deterministic event triggers)
│   ├── Pre-action hooks (intercept before execution)
│   ├── Post-action hooks (run after execution)
│   └── Session lifecycle hooks (start/end/compact)
│
├── Skills (reusable capability definitions)
│   └── Markdown + optional tools + system prompt
│
└── Plugins (programmatic extensions)
    └── TypeScript/JavaScript code with full SDK access

CONTINUITY LAYER (What maintains context across limits)
├── Context Window (finite token budget)
├── Compaction/Summarization (context compression)
├── Memory Systems (external persistence)
└── Session Management (thread continuity)
```

---

## OpenCode vs Claude Code Comparison Matrix

### Row 1: Agents and Subagents

| Concept | OpenCode | Claude Code |
|---------|----------|-------------|
| Main Agent | Default agent defined by system prompt | Main Claude instance |
| Subagents | Via `Task` tool delegation | `.claude/agents/*.md` with YAML frontmatter |
| Agent Definition | Via plugins or system prompt | Markdown files with `name`, `description`, `tools` |
| Agent Invocation | Programmatic via plugins | Auto-delegation by description OR explicit |
| Context Isolation | Separate session state | Independent context window per subagent |
| Background Execution | Not native (plugin-based) | Native `background: true` subagents |

### Row 2: Orchestration and Modes

| Concept | OpenCode | Claude Code |
|---------|----------|-------------|
| Modes | Not explicit (via agents/prompts) | Agent mode, Ask mode, Plan mode |
| Orchestrator | Plugin-based coordination | Main agent auto-delegates |
| Mode Switching | Via system prompt transform | Via `/mode` or agent description match |

### Row 3: Permissions System

| Concept | OpenCode | Claude Code |
|---------|----------|-------------|
| Permission Events | `permission.asked`, `permission.replied` | `PermissionRequest` hook |
| Tool Access Control | Via `permission.ask` hook | YAML `tools:` in agent frontmatter |
| Auto-approve/deny | Plugin hook return values | Hook exit codes (0=allow, 2=block) |
| Granularity | Per-tool, per-session | Per-tool, per-subagent, per-file pattern |

### Row 4: System Instructions

| Concept | OpenCode | Claude Code |
|---------|----------|-------------|
| System Prompt | `opencode.json` + `AGENTS.md` | `CLAUDE.md` + `.claude/settings.json` |
| Project Rules | `.opencode/` directory | `.claude/` directory |
| Transform Hook | `experimental.chat.system.transform` | Not available (static) |
| Injection Point | Plugin hook (pre-message) | `UserPromptSubmit` hook (context injection) |

### Row 5: Commands and Workflows

| Concept | OpenCode | Claude Code |
|---------|----------|-------------|
| Slash Commands | `.opencode/commands/*.md` | `.claude/commands/*.md` |
| Command Format | Markdown with YAML frontmatter | Markdown with YAML frontmatter |
| Workflows | Plugin-orchestrated sequences | Subagent chaining via hooks |
| Workflow Persistence | Plugin state management | Hook-based checkpointing |

### Row 6: Tools

| Concept | OpenCode | Claude Code |
|---------|----------|-------------|
| Built-in Tools | Read, Write, Edit, Bash, Grep, Glob, WebFetch, Task | Read, Write, Edit, Bash, Grep, Glob, WebSearch, WebFetch, Task |
| Custom Tools | Via plugin `tool()` API | Via MCP servers |
| Tool Interception | `tool.execute.before`, `tool.execute.after` | `PreToolUse`, `PostToolUse` |
| Tool Definition | TypeScript with Zod schemas | MCP JSON schema |

### Row 7: Skills

| Concept | OpenCode | Claude Code |
|---------|----------|-------------|
| Skill Location | `.opencode/skills/*/SKILL.md` | `.claude/skills/*/SKILL.md` |
| Skill Format | Markdown with instructions | Markdown with instructions |
| Skill Invocation | Via `/skill:name` or auto-detection | Via `/skill:name` or context match |
| Skill Scope | Project or user level | Project or user level |

### Row 8: Hooks (CRITICAL DIFFERENCE)

| Concept | OpenCode | Claude Code |
|---------|----------|-------------|
| Hook Type | **Programmatic (TypeScript)** | **Deterministic (Shell/Bash)** |
| Hook Definition | Plugin functions | JSON config + shell commands |
| Pre-tool Hook | `tool.execute.before` | `PreToolUse` |
| Post-tool Hook | `tool.execute.after` | `PostToolUse` |
| Message Hook | `experimental.chat.messages.transform` | `UserPromptSubmit` |
| Session Start | `session.created` event | `SessionStart` hook |
| Session End | `session.idle` event | `Stop` hook |
| Compaction Hook | `experimental.session.compacting` | `PreCompact` hook |
| Permission Hook | `permission.ask` | `PermissionRequest` |
| Subagent Hooks | Not explicit | `SubagentStart`, `SubagentStop` |
| Hook Output | Return values in code | Exit codes + stdout/stderr |

### Row 9: Plugins

| Concept | OpenCode | Claude Code |
|---------|----------|-------------|
| Plugin Type | **Full SDK access (TypeScript)** | **Shell-based hooks only** |
| Plugin Location | `.opencode/plugin/*.ts` | N/A (hooks in settings.json) |
| Capabilities | Event subscription, tool creation, message transform, state management | Execute shell commands at lifecycle points |
| Custom Logic | Full programmatic control | Limited to shell script logic |

### Row 10: Context Window and Compaction

| Concept | OpenCode | Claude Code |
|---------|----------|-------------|
| Auto-compact | At 95% capacity | At 95% capacity |
| Compact Trigger | `session.compacted` event | `PreCompact` hook |
| Context Injection | `experimental.session.compacting` | `PreCompact` stdout preservation |
| Manual Compact | `/compact` command | `/compact` command |
| Summary Format | LLM-generated summary | LLM-generated summary + 5 recent files |

---

## LLM Context States (What LLMs See)

### State 1: Fresh Session Start
```
LLM receives:
├── System prompt (AGENTS.md / CLAUDE.md content)
├── User's first message
└── Available tools list
```

### State 2: Mid-Session (Normal Flow)
```
LLM receives:
├── System prompt
├── Full conversation history (within token limit)
├── Tool call results
└── New user message
```

### State 3: Post-Compaction (Context Reset)
```
LLM receives:
├── System prompt
├── COMPACTION SUMMARY (disguised as new context)
│   └── "Here's what happened so far: [summary]"
├── 5 most recently accessed files (Claude Code specific)
└── User's new message

CRITICAL: LLM perceives this as a NEW conversation with context injection
```

### State 4: User Interruption (Cancel + New Message)
```
LLM receives:
├── System prompt
├── Conversation up to cancellation point
├── [Incomplete tool call or response]
└── User's new/different message

RISK: Context pollution, orphaned state, conflicting instructions
```

---

## Detected Pitfalls and Anti-Patterns

### Pitfall 1: Hypothesis Stack Without Validation
**Current State:** Many features built on unvalidated assumptions
**Example:** Complex governance hierarchy without proven need
**Fix:** Each feature must have a validation test before expansion

### Pitfall 2: Multiple Sources of Truth
**Current State:** State in `.idumb/brain/state.json`, config in multiple places
**Fix:** Single canonical state file, everything else derives from it

### Pitfall 3: Coordinator Complexity Without Leaf Capability
**Current State:** Many coordinator agents, but actual work requires builder
**Fix:** Start with working leaf nodes, add coordination as proven need

### Pitfall 4: Context Pollution from Over-Injection
**Current State:** Hooks inject context at multiple points
**Fix:** Single injection point, minimal context, lazy loading

### Pitfall 5: Compaction Loss of Critical State
**Current State:** No guaranteed survival of governance state through compaction
**Fix:** Anchor system with explicit `PreCompact` preservation

### Pitfall 6: Hook Complexity Mismatch
**Current State:** Using OpenCode's programmatic hooks like Claude Code's shell hooks
**Fix:** Leverage OpenCode's TypeScript SDK power properly

---

## Development Principles (Non-Negotiable)

### Principle 1: Prove Before Expanding
```
Before adding ANY feature:
1. Define the hypothesis
2. Create a minimal test case
3. Validate the test passes
4. Only then expand the feature
```

### Principle 2: Single Source of Truth
```
├── ONE state file: `.idumb/brain/state.json`
├── ONE config file: `.idumb/config.json`  
├── State MUST be serializable to survive compaction
└── Everything else is derived, never canonical
```

### Principle 3: Context Minimalism
```
├── Inject the MINIMUM context needed
├── Lazy load (reference paths, not content)
├── Never duplicate what the LLM already knows
└── Every injected token has a measurable purpose
```

### Principle 4: Compaction Survival Guarantee
```
├── Critical state MUST survive compaction
├── Use explicit anchor system with priorities
├── Test: compact, verify anchors present, continue work
└── Auto-recovery from orphaned state
```

### Principle 5: Leaf-First Development
```
├── Build working tools/validators first
├── Add coordination only when proven needed
├── Coordinators are OPTIMIZATION, not foundation
└── Every agent must be testable in isolation
```

### Principle 6: Deterministic Over Probabilistic
```
├── Hooks guarantee execution; prompts suggest
├── Validation must be deterministic (grep, glob, exit codes)
├── Never rely on LLM to enforce rules (it won't)
└── Use hooks for enforcement, prompts for guidance
```

---

## DO's and DON'Ts

### DO's
1. **DO** validate every hypothesis with a minimal test before building
2. **DO** use OpenCode's TypeScript SDK for complex logic
3. **DO** preserve critical state through `experimental.session.compacting`
4. **DO** use deterministic hooks for rule enforcement
5. **DO** test compaction survival of your state
6. **DO** start with leaf capabilities (tools, validators)
7. **DO** keep context injection minimal and lazy
8. **DO** use matchers to scope hooks narrowly

### DON'Ts
1. **DON'T** add features without validation tests
2. **DON'T** rely on LLM prompts to enforce rules
3. **DON'T** create multiple state files
4. **DON'T** inject large context blocks
5. **DON'T** build coordinators before leaf nodes work
6. **DON'T** assume compaction preserves your state
7. **DON'T** use shell scripts for complex logic in OpenCode
8. **DON'T** intercept every event (scope with matchers)

---

## Success Criteria for Plugin Development

### Tier 1: Foundation (MUST have before any expansion)
- [ ] Single state file survives compaction (verified test)
- [ ] Minimal tool works in isolation (e.g., read state, write state)
- [ ] Hook fires at expected time (session.idle, tool.execute.before)
- [ ] No TUI pollution (all logging to files)

### Tier 2: Awareness (Pivotal Point 1 requirements)
- [ ] Agent knows current workflow state after compaction
- [ ] Agent can identify "what to do next" from state
- [ ] Agent can detect context poison and request recovery
- [ ] Agent provides rationale for stop/continue decisions

### Tier 3: Governance (After Tier 1-2 proven)
- [ ] Delegation chain is traceable
- [ ] Permission violations are blocked (not just suggested)
- [ ] Validation runs deterministically
- [ ] Recovery from interrupted sessions works

---

## Pivotal Point 1: Replicating Intelligence

### Definition
True "intelligence" = **non-hallucination** through:
1. **Workflow Awareness:** Always knowing what to do next
2. **Persona Expertise:** Consistent expert-level behavior
3. **Auto-Recovery:** Bounce back from context pollution/compaction

### Implementation Approach

#### Step 1: Minimal State Anchor (Week 1)
```typescript
// .idumb/brain/state.json - SINGLE SOURCE OF TRUTH
{
  "workflow": {
    "current": "research",
    "step": 2,
    "next": "validate-findings",
    "blockers": []
  },
  "anchors": [
    { "type": "decision", "content": "Using TypeScript for tools", "priority": "critical" }
  ],
  "lastCompaction": "2026-02-05T10:00:00Z"
}
```

#### Step 2: Compaction Survival Hook (Week 1)
```typescript
// Plugin hook to preserve state through compaction
"experimental.session.compacting": async (input, output) => {
  const state = await readState();
  output.context.push(`
## GOVERNANCE STATE (preserved through compaction)
Current Workflow: ${state.workflow.current}
Next Step: ${state.workflow.next}
Critical Decisions: ${state.anchors.filter(a => a.priority === 'critical').map(a => a.content).join(', ')}
  `);
}
```

#### Step 3: Workflow Awareness Injection (Week 2)
```typescript
// Inject workflow context on session start
"event": async ({ event }) => {
  if (event.type === "session.created") {
    const state = await readState();
    // Agent now knows exactly what to do
  }
}
```

#### Step 4: Validation Test (Week 2)
```
Test: Compaction Survival
1. Start session with state { workflow: "research", step: 1 }
2. Perform work until compaction triggers
3. Verify post-compaction agent knows workflow state
4. Verify agent continues from correct step

PASS: Agent resumes correctly
FAIL: Agent restarts from beginning or hallucinates state
```

---

## Phased Delivery Roadmap

### Phase 0.1: Validation Infrastructure (Week 1)
- [ ] Create test harness for compaction survival
- [ ] Verify OpenCode plugin loads and fires events
- [ ] Document actual vs. expected behavior

### Phase 0.2: Minimal Working State (Week 1-2)  
- [ ] Single state file with read/write
- [ ] Compaction hook preserves state
- [ ] Session start injects state summary

### Phase 0.3: Pivotal Point 1 Validation (Week 2-3)
- [ ] Agent knows workflow after compaction (test)
- [ ] Agent provides rationale for decisions (test)
- [ ] Recovery from user interruption works (test)

### Phase 1: Governance Foundations (After Phase 0 proven)
- Only add governance features after Pivotal Point 1 is validated

---

## Files to Create/Modify

### New: Test Harness
`src/tests/compaction-survival.test.ts` - Validation test for state persistence

### Simplify: State Tool  
`src/tools/idumb-state.ts` - Reduce to read/write/anchor only

### New: Compaction Hook
`src/plugins/lib/compaction-hook.ts` - Preserve state through compaction

### Update: Plugin Core
`src/plugins/idumb-core.ts` - Register compaction hook, simplify event handling

### Archive: Unvalidated Features
Move complex governance agents to `.archive/` until foundations proven