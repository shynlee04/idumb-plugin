# Cycle 5: Community Patterns Synthesis

**Research Date:** 2026-02-02  
**Synthesizer:** GSD Research Synthesizer  
**Source:** COMMUNITY-PLUGINS-ANALYSIS.md  
**Confidence Level:** HIGH

---

## Executive Summary

The OpenCode plugin ecosystem (170+ plugins) has solved many of the same problems iDumb v2 aims to address. Analysis of 9 high-impact plugins reveals three proven patterns that should directly inform iDumb v2's architecture: **lazy-loading** (opencode-skillful), **structured workflows** (micode), and **async delegation** (background-agents, pocket-universe).

The community has converged on a multi-agent orchestration model where specialized agents handle specific concerns, with clear permission boundaries and session continuity mechanisms. iDumb v2 should adopt these patterns while avoiding common pitfalls like pre-loading all rules or storing validation results only in context.

---

## Key Findings

### "Less for More" Patterns

| Pattern | Source | Implementation | iDumb v2 Application |
|---------|--------|----------------|---------------------|
| **Lazy-Load Skills** | opencode-skillful (144★) | `skill_find()` → `skill_use()` → `skill_resource()` | `governance_find()` → `governance_use()` → `governance_resource()` |
| **Context Pruning** | DCP (668★) | Deduplication, supersede writes, extract key findings | Prune old validation results, keep only latest state reads |
| **Background Research** | oh-my-opencode (27.2k★) | Async agents for research while main agent codes | Async governance validation while implementation continues |

**Key Insight:** opencode-skillful reduces token usage by only loading skills when needed. iDumb v2 should apply this to governance rules - no need to load all validation patterns upfront.

### "Accurately Specific" Patterns

| Pattern | Source | Implementation | iDumb v2 Application |
|---------|--------|----------------|---------------------|
| **3-Phase Workflow** | micode (167★) | Brainstorm → Plan → Implement | Governance-brainstorm → Governance-plan → Governance-implement |
| **Model-Specific Agents** | oh-my-opencode | Sisyphus (Opus), Hephaestus (GPT), Oracle (GPT) | idumb-validator (Haiku), idumb-analyzer (Sonnet), idumb-orchestrator |
| **Exact Task Sizing** | micode | 2-5 minute tasks with exact file paths | Validation checks sized for specific, bounded scope |
| **Human-in-the-Loop** | plannotator (1.6k★) | Visual plan annotation with structured feedback | Governance plan review with inline annotations |

**Key Insight:** micode's structured workflow with session continuity ledgers provides a proven template for governance workflows. The 2-5 minute task sizing prevents overwhelm and enables precise tracking.

### "Auto Governance" Patterns

| Pattern | Source | Implementation | iDumb v2 Application |
|---------|--------|----------------|---------------------|
| **Async Delegation** | background-agents (51★) | `delegate()` → disk persistence → `delegation_read()` | Spawn validation agents, persist results, retrieve when needed |
| **Closed-Loop Async** | pocket-universe (21★) | `subagent()` → async execution → results piped as messages | Parallel validators with main thread blocking on completion |
| **Memory Blocks** | agent-memory (28★) | Letta-style editable blocks (persona, human, project) | Governance state blocks (state, history, conflicts) |
| **Permission Boundaries** | opencode-workspace (75★) | plan/build (read-only), coder (full), scribe (write only) | validator (read-only), enforcer (state write), orchestrator (delegate) |
| **Todo Enforcement** | oh-my-opencode | Auto-continuation until todos complete | Governance completion tracking with auto-resume |

**Key Insight:** background-agents' disk persistence pattern is critical - validation results must survive context compaction. The `~/.local/share/opencode/delegations/{id}.md` pattern maps directly to `~/.idumb/validations/{id}.md`.

### Multi-Agent Orchestration

**From opencode-workspace bundle:**

```
┌──────────────────────────────────────────────────────────┐
│                     ORCHESTRATORS                        │
│         ┌──────────┐                    ┌──────────┐     │
│         │  plan    │                    │  build   │     │
│         └────┬─────┘                    └────┬─────┘     │
└──────────────┼───────────────────────────────┼───────────┘
               │                               │
       ┌───────┴───────┐               ┌───────┴───────┐
       ▼       ▼       ▼               ▼       ▼       ▼
┌─────────────────────────────────────────────────────────┐
│                      SPECIALISTS                        │
│  ┌─────────┐ ┌────────────┐ ┌───────┐ ┌──────┐ ┌──────┐ │
│  │ explore │ │ researcher │ │ coder │ │scribe│ │review│ │
│  └─────────┘ └────────────┘ └───────┘ └──────┘ └──────┘ │
└─────────────────────────────────────────────────────────┘
```

**iDumb v2 Adaptation:**

```
┌──────────────────────────────────────────────────────────┐
│                   GOVERNANCE ORCHESTRATOR                │
│                    (idumb-orchestrator)                  │
│                      Read-only, delegates                  │
└───────────────────────────┬──────────────────────────────┘
                            │
       ┌────────────────────┼────────────────────┐
       ▼                    ▼                    ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  VALIDATOR  │    │  ANALYZER   │    │  ENFORCER   │
│   (Haiku)   │    │  (Sonnet)   │    │ (State write)│
│  Read-only  │    │  Read-only  │    │  No bash    │
│ MCP tools   │    │  Deep analysis│   │  State tools │
└─────────────┘    └─────────────┘    └─────────────┘
```

---

## What NOT to Copy

| Anti-Pattern | Why It Doesn't Fit | Better Alternative |
|--------------|-------------------|-------------------|
| **Pre-load all governance rules** | Context bloat violates "Less for More" | Lazy-load only needed rules via `governance_find()` → `governance_use()` |
| **Store validation in context only** | Lost on compaction, no session continuity | Persist to disk at `~/.idumb/validations/{id}.md`, reference by ID |
| **Single agent for all governance** | No specialization, permission confusion | Specialized agents with clear boundaries (validator, analyzer, enforcer) |
| **Synchronous validation only** | Blocks main implementation work | Async validation with `delegate()` + `delegation_read()` pattern |
| **Manual governance tracking** | Error-prone, inconsistent | Auto-enforced todo continuation (oh-my-opencode pattern) |
| **One-size-fits-all prompts** | Model inefficiency | Model-specific format rendering (XML for Claude, JSON for GPT) |
| **Visual UI dependency** | plannotator requires browser, adds complexity | Structured markdown feedback with clear annotation syntax |
| **Git worktree per agent** | pocket-universe uses worktrees for isolation | Use branch-based isolation or state-based isolation instead |

---

## Roadmap Implications

### Phase 1: Core Governance Infrastructure
**Rationale:** Foundation must be solid before adding complexity

**Adopt from community:**
- Lazy-load pattern from opencode-skillful
- Memory blocks from agent-memory
- Permission boundaries from opencode-workspace

**Features:**
- `governance_find()` / `governance_use()` / `governance_resource()` tools
- Governance memory blocks (state, history, conflicts)
- Basic agent hierarchy (orchestrator, validator, enforcer)

**Avoid pitfalls:**
- Don't pre-load all rules
- Don't store everything in context

### Phase 2: Async Validation
**Rationale:** Background validation is core to "Auto Governance"

**Adopt from community:**
- Async delegation from background-agents
- Closed-loop pattern from pocket-universe
- Todo enforcement from oh-my-opencode

**Features:**
- `delegate()` for spawning validation agents
- Disk persistence for validation results
- Auto-resume on context loss

**Avoid pitfalls:**
- Don't fire-and-forget (use closed-loop)
- Don't block main thread unnecessarily

### Phase 3: Structured Workflow
**Rationale:** Governance needs predictable phases

**Adopt from community:**
- 3-phase workflow from micode
- Task sizing (2-5 minutes)
- Session continuity ledgers

**Features:**
- Governance-brainstorm → Governance-plan → Governance-implement
- Continuity ledger at `~/.idumb/ledgers/CONTINUITY_{session}.md`
- Exact task sizing for validation checks

**Avoid pitfalls:**
- Don't skip the brainstorm phase
- Don't create oversized tasks

### Phase 4: Context Optimization
**Rationale:** "Less for More" requires active pruning

**Adopt from community:**
- DCP pruning strategies
- Model-aware rendering
- Protected tools list

**Features:**
- Deduplicate state reads
- Supersede old validation results
- Extract key findings before removing details
- Protected: phase boundaries, conflict resolutions

**Avoid pitfalls:**
- Don't prune protected governance context
- Don't over-prune and lose important history

---

## Research Flags

**Needs deeper research:**
- Phase 4 (Context Optimization): DCP configuration specifics, cache hit rate trade-offs
- Model-specific format rendering: Exact formats for Claude XML vs GPT JSON

**Standard patterns (skip research):**
- Phase 1 (Core Infrastructure): opencode-skillful pattern is well-documented
- Phase 2 (Async Validation): background-agents pattern is proven
- Phase 3 (Structured Workflow): micode pattern is battle-tested

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Plugin capabilities | HIGH | Official GitHub documentation reviewed |
| Implementation patterns | HIGH | Source code analysis from README/architecture docs |
| Pattern applicability | HIGH | Clear mapping to iDumb v2's three principles |
| Implementation complexity | MEDIUM | Requires careful adaptation for governance context |

**Gaps to address:**
1. Exact DCP configuration for governance context (which tools to protect)
2. Model-specific prompt formats for governance rules
3. Cache hit rate impact of context pruning on different providers

---

## Sources

- https://github.com/zenobi-us/opencode-skillful (Lazy-load patterns)
- https://github.com/kdcokenny/opencode-background-agents (Async delegation)
- https://github.com/kdcokenny/opencode-workspace (Multi-agent orchestration)
- https://github.com/vtemian/micode (Structured workflows)
- https://github.com/Opencode-DCP/opencode-dynamic-context-pruning (Context pruning)
- https://github.com/joshuadavidthomas/opencode-agent-memory (Memory blocks)
- https://github.com/backnotprop/plannotator (Human-in-the-loop)
- https://github.com/code-yeongyu/oh-my-opencode (Agent harness)
- https://github.com/spoons-and-mirrors/pocket-universe (Closed-loop async)

---

## Cycle 5 Complete

**Key Takeaways:**
1. **Lazy-load governance rules** (opencode-skillful) - don't pre-load everything
2. **Structured 3-phase workflow** (micode) - brainstorm → plan → implement
3. **Async validation with persistence** (background-agents) - survive compaction
4. **Permission boundaries** (opencode-workspace) - clear agent roles
5. **Context pruning** (DCP) - deduplicate, supersede, extract

**Anti-patterns identified:** Pre-loading rules, context-only storage, single-agent governance, synchronous-only validation

**Ready for:** Requirements definition and roadmap creation
