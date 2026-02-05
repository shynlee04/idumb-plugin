# iDumb Plugin Reboot Plan

## Vision Statement

Provide true "intelligence" to AI agents (LLMs - agentic - SOTA) to work collaboratively with total awareness (non-hallucination) at expert senior engineer level with:
- **Self-governance**: Agents know when to stop, suggest, and escalate
- **Self-remediation**: Auto-clear poisoning context and bounce back to correction points
- **Phased trials with complexity layering**: Grow principles through experimentation

---

## Phase 0: Research Synthesis - Community Plugin Learnings

### 5 Plugins Studied and Rationale

| Plugin | Why Selected | Key Learning |
|--------|--------------|--------------|
| **@tarquinen/opencode-dcp** | Context optimization - directly relevant to context poisoning resilience | Pruning strategies (deduplication, supersede writes, purge errors), config precedence, protected tools concept, subagent limitations |
| **@zenobius/opencode-skillful** | Lazy-loading architecture - solves token bloat problem | On-demand injection, model-specific rendering, tool-based skill discovery (skill_find, skill_use, skill_resource) |
| **opencode-background-agents** | Async delegation - context survival across compaction | Persistence to disk, read-only agent restrictions, notification pattern, `delegation_list/read/delegate` tool pattern |
| **opencode-workspace** | Multi-agent orchestration bundle - closest to iDumb's goals | 16-component bundle architecture, permission boundaries (webfetch deny), orchestrator vs specialist split, OCX package manager |
| **@openspoon/subtask2** | Command orchestration - advanced flow control | Chaining (return), looping (until conditions), parallel execution, named results ($RESULT[name]), context passing ($TURN[n]) |

### Synthesized Architectural Principles

1. **Plugin-as-Tools Pattern**: All governance logic exposed via custom tools, not markdown commands
2. **Lazy Injection**: Skills/agents load on-demand, not pre-loaded (following opencode-skillful)
3. **Persistence Layer**: Critical state survives compaction via disk persistence (following background-agents)
4. **Permission Boundaries**: Clear separation - orchestrators delegate, workers execute (following workspace)
5. **Config Precedence**: Global -> Project -> Plugin config merge pattern (following DCP)
6. **Protected Resources**: Explicit protection lists for critical tools/state (following DCP)
7. **Decision Scoring + Auto-Hooks**: Score context signals to trigger reasoning interventions (NEW)
8. **Attention Anchoring**: Guide agent focus to specific message turns and artifacts (NEW)
9. **Background Context Collectors**: Sub-agents gathering pure context for injection (NEW)

---

## Phase 0.5: Core Concepts Architecture (NEW)

### Meta-Intelligence System Components

#### 1. Decision Scoring Engine
```typescript
// src/engines/decision-scorer.ts
interface ContextSignal {
  type: "contradiction" | "confusion" | "drift" | "overload" | "loop"
  score: number        // 0-100 severity
  source: string       // which message turn
  evidence: string     // what triggered detection
}

interface ScoringResult {
  signals: ContextSignal[]
  totalScore: number
  recommendedAction: "continue" | "pause" | "intervene" | "escalate"
  triggerHook: string | null  // which hook to fire
}
```

#### 2. Auto-Hook Chain of Thought System
```typescript
// src/engines/reasoning-chain.ts
interface ReasoningIntervention {
  trigger: "score_threshold" | "pattern_match" | "user_signal"
  chainOfThought: {
    step: number
    reasoning: string
    conclusion: "proceed" | "stop" | "delegate" | "clarify"
  }[]
  outputAction: {
    type: "inject_prompt" | "spawn_subagent" | "anchor_attention" | "transform_message"
    payload: unknown
  }
}
```

#### 3. Background Context Collector (Sub-agent Pattern)
```typescript
// src/engines/context-collector.ts
interface ContextCollectorTask {
  id: string
  purpose: "pure_context" | "decision_support" | "validation"
  sourceMessages: number[]  // which turns to analyze
  outputFormat: "summary" | "anchors" | "structured_data"
  targetSession: "current" | "new"  // where to inject results
}
```

#### 4. Attention Anchoring System
```typescript
// src/engines/attention-anchor.ts
interface AttentionDirective {
  focusType: "message_turn" | "artifact" | "decision_point" | "error"
  target: string  // turn number or file path
  priority: "must_read" | "should_read" | "optional"
  reason: string  // why this needs attention
}
```

#### 5. Prompt Transformation Pipeline
```typescript
// src/engines/prompt-transformer.ts
interface TransformationRule {
  detect: {
    patterns: string[]      // regex or semantic patterns
    scoreThreshold: number  // minimum decision score
  }
  transform: {
    type: "prepend" | "append" | "replace" | "wrap"
    template: string
    variables: Record<string, string>
  }
  targetPhase: "session_start" | "mid_session" | "pre_compaction" | "post_compaction"
}
```

#### 6. Delegation Intelligence (Sequential vs Parallel)
```typescript
// src/engines/delegation-router.ts
interface DelegationDecision {
  strategy: "sequential" | "parallel" | "hybrid"
  reasoning: string  // why this strategy
  tasks: {
    id: string
    agent: string
    waitFor: string[]  // dependencies (sequential)
    compareWith: string[]  // parallel comparison targets
  }[]
  aggregation: "first_wins" | "consensus" | "merge" | "user_decides"
}
```

### TUI + GUI Integration Strategy

| Layer | Capability | Implementation |
|-------|------------|----------------|
| **TUI Info Injection** | Status bar, toasts, metadata display | `tui.toast.show`, `tui.prompt.append` events |
| **TUI Command Integration** | Slash commands for manual control | `/idumb:status`, `/idumb:focus`, `/idumb:score` |
| **Local GUI (Optional)** | Visual collaboration dashboard | localhost:3847 web server via plugin |
| **AI-Consumable Output** | Structured metadata for agent synthesis | JSON artifacts in `.idumb/meta/` |

---

## Phase 1: Worktree Setup

### 1.1 Create Git Worktree
```bash
# From /Users/apple/Documents/coding-projects/idumb
git worktree add ../idumb-clean main --detach
cd ../idumb-clean
git checkout -b plugin-reboot
```

### 1.2 Clean Slate Structure
```
idumb-clean/
├── package.json              # Single entry point: npx idumb
├── tsconfig.json             # Strict TypeScript config
├── src/
│   ├── plugin.ts             # Main plugin entry (default export)
│   ├── engines/              # Core intelligence systems (NEW)
│   │   ├── decision-scorer.ts      # Context signal scoring
│   │   ├── reasoning-chain.ts      # Chain of thought interventions
│   │   ├── context-collector.ts    # Background sub-agent spawning
│   │   ├── attention-anchor.ts     # Focus directive system
│   │   ├── prompt-transformer.ts   # Message transformation pipeline
│   │   └── delegation-router.ts    # Sequential/parallel delegation
│   ├── tools/                # Custom tools (TypeScript)
│   │   ├── state.ts          # idumb_state tool
│   │   ├── anchor.ts         # idumb_anchor tool
│   │   ├── validate.ts       # idumb_validate tool
│   │   ├── delegate.ts       # idumb_delegate tool
│   │   ├── score.ts          # idumb_score tool (NEW)
│   │   └── focus.ts          # idumb_focus tool (NEW)
│   ├── hooks/                # Plugin event hooks
│   │   ├── session.ts        # Session lifecycle hooks
│   │   ├── compaction.ts     # Compaction survival hooks
│   │   ├── permission.ts     # Permission enforcement hooks
│   │   ├── message.ts        # Message transformation hooks (NEW)
│   │   └── tui.ts            # TUI display hooks (NEW)
│   ├── lib/                  # Shared utilities
│   │   ├── config.ts         # Configuration management
│   │   ├── persistence.ts    # Disk persistence (survives compaction)
│   │   └── types.ts          # TypeScript interfaces
│   ├── schemas/              # Zod schemas for validation
│   │   ├── state.ts          # State schema
│   │   ├── config.ts         # Config schema
│   │   ├── signals.ts        # Context signal schemas (NEW)
│   │   └── delegation.ts     # Delegation schemas (NEW)
│   └── gui/                  # Optional local GUI (NEW)
│       ├── server.ts         # Express/Hono localhost server
│       └── static/           # Frontend assets
├── .idumb/                   # Runtime directory (created on init)
│   ├── state.json            # Governance state
│   ├── anchors/              # Context anchors
│   ├── delegations/          # Persisted delegation results
│   ├── meta/                 # AI-consumable metadata (NEW)
│   └── signals/              # Context signal history (NEW)
└── README.md                 # Usage documentation
```

---

## Phase 2: Architecture Definition

### 2.1 Plugin Structure (Non-Breaking with OpenCode Innate Agents)

```typescript
// src/plugin.ts
import type { Plugin } from "@opencode-ai/plugin"
import { stateTools } from "./tools/state"
import { anchorTools } from "./tools/anchor"
import { validateTools } from "./tools/validate"
import { sessionHooks } from "./hooks/session"
import { compactionHooks } from "./hooks/compaction"

export const IdumbPlugin: Plugin = async (ctx) => {
  // Initialize state on first run
  await initializeState(ctx.directory)
  
  return {
    // Custom tools - all governance exposed here
    tool: {
      ...stateTools,
      ...anchorTools,
      ...validateTools
    },
    
    // Event hooks
    ...sessionHooks,
    ...compactionHooks,
    
    // Compaction survival - inject critical context
    "experimental.session.compacting": async (input, output) => {
      const anchors = await loadAnchors(ctx.directory)
      output.context.push(formatAnchorsForCompaction(anchors))
    }
  }
}

export default IdumbPlugin
```

### 2.2 Tool Boundaries (Clear Responsibilities)

| Tool | Purpose | Permissions | Used By |
|------|---------|-------------|----------|
| `idumb_state_read` | Read current governance state | read-only | Any agent |
| `idumb_state_write` | Update state (phase, validation count) | write | Coordinators only |
| `idumb_anchor_add` | Add context anchor (survives compaction) | write | Any agent |
| `idumb_anchor_list` | List all anchors | read-only | Any agent |
| `idumb_validate_run` | Execute validation checks | read + bash | Validators |
| `idumb_delegate_create` | Create delegation task | task | Coordinators |
| `idumb_delegate_read` | Read delegation result | read-only | Any agent |
| `idumb_score_context` | Score current context for signals (NEW) | read-only | Any agent |
| `idumb_focus_set` | Set attention directive (NEW) | write | Coordinators |
| `idumb_focus_get` | Get current focus directives (NEW) | read-only | Any agent |
| `idumb_transform_register` | Register prompt transformation rule (NEW) | write | Coordinators |
| `idumb_collect_spawn` | Spawn background context collector (NEW) | task | Coordinators |

### 2.3 Hook Boundaries

| Hook | Purpose | When Fires |
|------|---------|------------|
| `session.created` | Initialize state, inject baseline context | New session start |
| `session.compacted` | Log compaction, verify anchor survival | Post-compaction |
| `tool.execute.before` | Permission enforcement, input validation, decision scoring | Before any tool |
| `tool.execute.after` | State recording, delegation persistence, signal logging | After any tool |
| `experimental.session.compacting` | Inject anchors + attention directives into compaction context | During compaction |
| `message.updated` | Analyze user message for transformation triggers (NEW) | On each message |
| `tui.prompt.append` | Inject governance status into TUI display (NEW) | On prompt render |
| `tui.toast.show` | Display intervention notifications (NEW) | On score threshold |

---

## Phase 3: API Contracts

### 3.1 State Schema (Zod)
```typescript
// src/schemas/state.ts
import { z } from "zod"

export const AnchorSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(["decision", "context", "checkpoint", "error"]),
  content: z.string().max(2000),
  priority: z.enum(["critical", "high", "normal"]),
  created: z.string().datetime(),
  survives_compaction: z.boolean().default(true)
})

export const StateSchema = z.object({
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  initialized: z.string().datetime(),
  phase: z.string().optional(),
  validation_count: z.number().int().min(0),
  last_validation: z.string().datetime().nullable(),
  anchors: z.array(AnchorSchema).default([])
})

export type State = z.infer<typeof StateSchema>
export type Anchor = z.infer<typeof AnchorSchema>
```

### 3.2 Config Schema
```typescript
// src/schemas/config.ts
import { z } from "zod"

export const ConfigSchema = z.object({
  enabled: z.boolean().default(true),
  max_anchors: z.number().int().min(1).max(100).default(20),
  protected_tools: z.array(z.string()).default(["write", "edit", "bash"]),
  compaction_context_limit: z.number().int().min(500).max(5000).default(2000),
  validation: z.object({
    auto_validate: z.boolean().default(false),
    validation_interval: z.number().int().min(1).default(5)
  }).default({})
})

export type Config = z.infer<typeof ConfigSchema>
```

---

## Phase 3.5: Intelligent Behavior Enforcement (NEW)

### Chain of Thought Enforcement Rules

| Signal Type | Score Threshold | Auto-Hook Action |
|-------------|-----------------|------------------|
| **Contradiction** | 60+ | Pause, spawn context collector to summarize conflicting requirements |
| **Confusion** | 50+ | Inject attention directive to re-read last 3 user messages |
| **Drift** | 70+ | Transform next prompt to include "return to focus: {anchor}" |
| **Overload** | 80+ | Suggest delegation to parallel sub-agents for comparison |
| **Loop** | 90+ | Force stop, display TUI toast "Detected loop, awaiting clarification" |

### Message Turn Analysis

```typescript
// Automatic analysis on every message.updated hook
interface MessageTurnAnalysis {
  turnNumber: number
  sentiment: "positive" | "negative" | "neutral" | "confused"
  intentShift: boolean  // did user change direction?
  keyEntities: string[]  // extracted concepts
  contradicts: number[]  // which previous turns it contradicts
}
```

### Delegation Intelligence Rules

| Scenario | Strategy | Rationale |
|----------|----------|----------|
| Research tasks | Parallel (compare/contrast) | Multiple perspectives improve quality |
| Implementation | Sequential (chain) | Dependencies require ordered execution |
| Validation | Parallel (redundancy) | Multiple validators catch more issues |
| Complex decisions | Hybrid | Research parallel, then implement sequential |

---

## Phase 4: New Stress Test Scenarios

Based on the user persona: **Aggressive context polluter with instantaneous chain-of-thought changes, 20+ compaction cycles**

### Stress Test 1: Rapid Feature Request Cascade
```markdown
## STRESS-001: Feature Request Bombardment

**Purpose**: Test resilience against rapid, contradictory feature requests

**Setup**:
- Active session with 3 established anchors
- Current phase: "implementation"

**Poisoning Actions** (20+ iterations):
1. Request: "Add authentication with JWT"
2. Immediate: "Actually, use session-based auth instead"
3. Immediate: "No wait, OAuth2 with PKCE"
4. Immediate: "Forget auth, add real-time notifications first"
5. ... (continue 20+ contradictory requests)

**Expected Recovery**:
- Anchors survive all compactions
- State reflects last valid decision
- Agent explicitly acknowledges contradictions
- Suggests user clarification before proceeding

**Failure Indicators**:
- Lost anchors after compaction
- Hallucinated requirements from earlier requests
- Attempted implementation of contradictory features
```

### Stress Test 2: Context Pollution via Code Dumps
```markdown
## STRESS-002: Massive Code Context Injection

**Purpose**: Test context pruning under code dump scenarios

**Setup**:
- Fresh session
- Inject 50KB of code files via read operations

**Poisoning Actions**:
1. Read 10 large files (5KB each)
2. Request analysis of "all files"
3. Inject additional 5 files mid-analysis
4. Force compaction via token limit
5. Request continuation with "remember what we discussed"

**Expected Recovery**:
- Critical analysis anchored before compaction
- Post-compaction agent recalls key findings
- Outdated file reads pruned (DCP pattern)
- Agent uses idumb_anchor_list to recover context

**Failure Indicators**:
- Lost analysis results
- Agent re-reads all files post-compaction
- Confusion about which files were analyzed
```

### Stress Test 3: Delegation Chain Survival
```markdown
## STRESS-003: Deep Delegation with Compaction

**Purpose**: Test delegation persistence across multiple compactions

**Setup**:
- Active session with delegation capability
- 3-level delegation chain planned

**Poisoning Actions**:
1. Delegate: "Research OAuth providers"
2. While waiting, bombard with unrelated questions
3. Force compaction via token limit
4. Request delegation results
5. Delegate new task based on results
6. Force another compaction
7. Request summary of all delegations

**Expected Recovery**:
- All delegation results persisted to disk
- idumb_delegate_list shows all delegations
- Agent retrieves results without re-delegating
- Continuity maintained across compactions

**Failure Indicators**:
- Lost delegation results
- Re-delegation of completed tasks
- Confusion about delegation status
```

### Stress Test 4: Decision Scoring Under Fire (NEW)
```markdown
## STRESS-004: Rapid Context Signal Cascade

**Purpose**: Test decision scoring engine under rapid contradictory input

**Setup**:
- Active session with decision scorer enabled
- Score threshold: 60 for intervention

**Poisoning Actions**:
1. Message: "Build a REST API"
2. Message: "No, GraphQL instead"
3. Message: "Actually, both REST and GraphQL"
4. Message: "Wait, forget APIs, build a CLI"
5. Message: "Can you also add a web UI?"
6. Continue for 20+ messages with contradictions

**Expected Recovery**:
- Score reaches 60+ by message 4
- Auto-hook fires "contradiction" intervention
- Agent pauses with: "Detected contradictory requirements. Current signals: [list]"
- Spawns background context collector to summarize
- Presents user with clarification options
- TUI toast shows "iDumb: Intervention triggered (contradiction score: 75)"

**Failure Indicators**:
- Score never triggers intervention
- Agent attempts to implement all contradictory requests
- No TUI feedback to user
- Context collector never spawned
```

### Stress Test 5: Attention Anchor Survival (NEW)
```markdown
## STRESS-005: Focus Directive Through 20+ Compactions

**Purpose**: Test attention anchoring persistence across extreme compaction cycles

**Setup**:
- Set 3 attention directives:
  1. Focus on turn 5 (critical decision)
  2. Focus on `.idumb/meta/requirements.json`
  3. Focus on error in turn 12

**Poisoning Actions**:
1. Generate 50KB of conversation content
2. Force compaction (cycle 1)
3. Continue conversation, reference original focus points
4. Repeat for 20+ compaction cycles
5. At cycle 20, ask: "What were the key decisions?"

**Expected Recovery**:
- All 3 attention directives survive all compactions
- Post-compaction prompt includes: "ATTENTION REQUIRED: [directives]"
- Agent correctly references turn 5 decision
- Agent reads requirements.json without prompting
- Error context from turn 12 preserved in summary

**Failure Indicators**:
- Focus directives lost after compaction
- Agent cannot recall original decision points
- Agent asks user to re-explain previous context
```

---

## Phase 5: Project Start Planning Proposal

### Rationale for Clean Reboot

| Problem with Current | Solution in Reboot |
|---------------------|-------------------|
| 44KB monolithic plugin | Modular hooks + tools structure |
| 23 markdown agents | Zero agents - use OpenCode innate agents |
| 19 markdown commands | Zero commands - expose via tools |
| Complex install script | Single `npx idumb` or npm plugin config |
| Mixed legacy/working code | Clean-slate TypeScript |
| No type safety | Zod schemas + strict TypeScript |
| Console.log pollution | Structured file logging |

### Proposed Project Phases

**Phase A: Foundation (Week 1)** - PIVOTAL TRIAL 1
1. Create worktree and clean structure
2. Implement core schemas (state, config, signals)
3. Implement persistence layer
4. Create plugin shell with minimal tool exports
5. **Trial**: Can basic state survive 5 compactions?

**Phase B: Core Tools (Week 2)** - PIVOTAL TRIAL 2
1. `idumb_state_read/write` tools
2. `idumb_anchor_add/list` tools
3. `idumb_validate_run` tool
4. Unit tests for all tools
5. **Trial**: Do tools work with OpenCode innate agents without conflicts?

**Phase C: Decision Scoring Engine (Week 3)** - PIVOTAL TRIAL 3 (NEW)
1. Implement `decision-scorer.ts` engine
2. Implement `idumb_score_context` tool
3. Define signal detection patterns
4. Hook into `tool.execute.before` for scoring
5. **Trial**: Can scoring detect contradictions in < 100ms?

**Phase D: Attention + Transformation (Week 4)** - PIVOTAL TRIAL 4 (NEW)
1. Implement `attention-anchor.ts` engine
2. Implement `prompt-transformer.ts` pipeline
3. Hook into `message.updated` for transformation
4. Hook into `experimental.session.compacting` for attention survival
5. **Trial**: Do attention directives survive 10 compactions?

**Phase E: Background Collectors (Week 5)** - PIVOTAL TRIAL 5 (NEW)
1. Implement `context-collector.ts` sub-agent spawning
2. Implement `idumb_collect_spawn` tool
3. Define collector task schemas
4. Test parallel vs sequential collection
5. **Trial**: Can collector results merge into main session?

**Phase F: Delegation Intelligence (Week 6)** - PIVOTAL TRIAL 6 (NEW)
1. Implement `delegation-router.ts` engine
2. Implement sequential chain delegation
3. Implement parallel comparison delegation
4. Implement hybrid delegation strategies
5. **Trial**: Does parallel delegation improve decision quality?

**Phase G: TUI Integration (Week 7)** - PIVOTAL TRIAL 7 (NEW)
1. Implement TUI hooks (`tui.toast.show`, `tui.prompt.append`)
2. Implement status display injection
3. Implement intervention notifications
4. Optional: Local GUI server for visual collaboration
5. **Trial**: Does TUI feedback improve user awareness?

**Phase H: Stress Testing (Week 8)**
1. Execute STRESS-001 through STRESS-005
2. Document failures and fixes
3. Performance benchmarking
4. Update principles based on trial learnings
5. **Final validation against all stress tests**

### Non-Breaking Integration Strategy

1. **No Agent Overrides**: iDumb tools work with default OpenCode agents
2. **No Command Hijacking**: No slash commands that conflict with OpenCode
3. **Additive Tools**: Tools enhance, don't replace OpenCode capabilities
4. **Optional Activation**: Plugin does nothing if disabled in config
5. **Graceful Degradation**: If tools fail, OpenCode continues normally

---

## Immediate Next Steps

1. **Confirm worktree creation** in separate directory
2. **Initialize clean package.json** with minimal dependencies
3. **Create TypeScript config** with strict settings
4. **Implement State schema** first (foundation for everything)
5. **Create plugin shell** with single tool for validation

---

## Files to Create (In Order)

1. `package.json` - Minimal dependencies (@opencode-ai/plugin, zod)
2. `tsconfig.json` - Strict TypeScript config
3. `src/schemas/state.ts` - State Zod schema
4. `src/schemas/config.ts` - Config Zod schema
5. `src/lib/persistence.ts` - Disk persistence utilities
6. `src/tools/state.ts` - State read/write tools
7. `src/plugin.ts` - Main plugin export
8. `.idumb/state.json` - Initial state file (template)

---

## Principles Registry (Grows Through Trials)

This section evolves as each pivotal trial completes. Initial principles from research:

| ID | Principle | Evidence | Status |
|----|-----------|----------|--------|
| P-001 | Anchors must survive compaction | DCP, background-agents patterns | To validate |
| P-002 | Scoring must complete < 100ms | UX requirement | To validate |
| P-003 | Sub-agent results must persist to disk | background-agents pattern | To validate |
| P-004 | TUI feedback must not block main loop | opencode-notificator pattern | To validate |
| P-005 | Delegation strategy must be explicit | subtask2 learning | To validate |

*Add new principles after each pivotal trial completion*

---

## Success Criteria

- [ ] Single `npm install idumb-plugin` or plugin config entry
- [ ] Zero markdown files (agents, commands, workflows)
- [ ] All governance via TypeScript tools
- [ ] Anchors survive 20+ compaction cycles
- [ ] No TUI pollution (no console.log)
- [ ] 100% TypeScript strict mode compliance
- [ ] Zero lint errors
- [ ] Passes all 5 stress test scenarios
- [ ] Decision scoring triggers interventions correctly (NEW)
- [ ] Attention directives survive compaction (NEW)
- [ ] Background collectors successfully merge results (NEW)
- [ ] TUI displays governance status without blocking (NEW)
- [ ] All code solely from this package (no bundled external plugins) (NEW)