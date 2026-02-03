# Project Research Summary

**Project:** iDumb v2 (Meta-Framework)
**Domain:** OpenCode-first agentic development framework with self-governance + local “brain”
**Researched:** 2026-02-02
**Confidence:** MEDIUM-HIGH

## Executive Summary

iDumb v2 should pivot from “wrapping GSD” to becoming a **meta-framework that owns the workflow contracts**: hierarchy-first delegation, context-first operation, and evidence-based validation. The wrapper approach looked plausible but was brittle (heavy dependence on experimental hooks and adversarial “blocking” behavior) and didn’t fix the root cause: unclear contracts + missing first-class primitives (TODO hierarchy, session CRUD, durable memory).

iDumb v2’s winning shape is: **OpenCode-native primitives (agents/permissions/commands/tools) + a local, queryable “brain”** for durable memory and code intelligence. Keep the best of GSD (thin orchestrator pattern, phase artifacts, requirement traceability, atomic commits) but remove “trust the model” failure modes by moving governance into **structured artifacts + tool-level boundaries + routine validation loops**.

The key risks are (1) building too much enforcement too early, (2) relying on unstable/experimental OpenCode hooks, and (3) losing state across compaction/sessions. Mitigation: implement governance as **contracts + observability + persistence first**, keep any hook-based injection behind feature flags, and store all durable state locally under `.idumb/` with schemas and IDs.

## Key Findings

### Recommended Stack

iDumb v2 needs two stacks: an OpenCode-facing workflow stack (agents/permissions/commands/tools) and a local brain stack (storage/search/parsing/schemas/relationships). The brain stack enables fast retrieval, hop-reading, and durable governance memory without external services.

**Core technologies:**
- OpenCode agents + granular permissions: enforce role boundaries without runtime “message fights”
- OpenCode commands: deterministic workflow entry points (project init, governance runs, validation loops)
- Local brain DB: `better-sqlite3` — ACID, fast, file-based, great for durable governance state
- Search: `@orama/orama` — lightweight full-text + vector/hybrid search for recall and RAG
- Structural parsing: `tree-sitter` — incremental AST parsing for hop-reading and symbol extraction
- Schemas: `zod` + frontmatter parsing — strict metadata contracts, drift detection
- Relationships: `graphlib` — DAGs/toposort for dependency/session/task graphs

### Expected Features

**Must have (table stakes):**
- Hierarchical delegation model (orchestrator → specialists) with clear tool boundaries
- Durable memory (“brain”) storing: sessions, anchors, decisions, validations, artifacts, relationships
- Context-first workflow gates: no execution without context + plan + verification contract
- Evidence-based validation loop (automated checks + human gates where required)

**Should have (competitive / differentiators):**
- Hop-reading and symbol navigation (cross-file traversal) powered by AST + relationship graph
- Async validation + persistence (background validations survive compaction/session changes)
- Lazy-loading of “governance rules/skills” (avoid loading everything into context)

**Defer (v2+):**
- Full DCP-style context pruning automation (needs careful tuning)
- Strong semantic embeddings pipeline if local-only embeddings prove heavy

### Architecture Approach

iDumb v2 architecture should be “contracts-first”: agent roles and permissions define behavior; tools and commands implement deterministic flows; the plugin layer provides observability, persistence, and event-driven automation (not brittle prompt injection).

**Major components:**
1. Governance orchestrator layer — defines workflows, spawns subagents, maintains state contracts
2. Brain subsystem — local DB + search + parsers + relationship graph under `.idumb/`
3. Validation subsystem — routine checks (freshness, drift, requirements coverage), persisted results
4. Interop layer — preserves GSD strengths (phase artifacts, traceability) while owning enforcement

### Critical Pitfalls

1. **Over-using experimental hooks** — keep `experimental.*` behind flags; prefer stable primitives
2. **Adversarial enforcement (blocking tools mid-flight)** — causes confusion/doom-loops; prefer permission scoping + clear prompts + structured workflows
3. **Context bloat (pre-loading all rules)** — violates “Less for More”; lazy-load governance rules/skills
4. **Context-only memory** — lost on compaction; persist validations/anchors/results to disk with IDs
5. **Building intelligence without schemas** — metadata drift; enforce Zod schemas + versioned IDs

## Implications for Roadmap

Suggested phase structure for iDumb v2 meta-framework (brownfield revamp):

### Phase 1: Contracts-First Governance Core
**Rationale:** fix the trust problem before adding intelligence; stabilize behavior without fragile interception.
**Delivers:** canonical roles/permissions; deterministic commands; baseline governance artifacts.
**Addresses:** hierarchy-first delegation, context-first gating, evidence-first validation contracts.
**Avoids:** experimental-hook dependence, adversarial tool blocking.

### Phase 2: Brain MVP (Durable State + IDs + Schemas)
**Rationale:** durable memory is the backbone for self-governance and multi-session continuity.
**Delivers:** `.idumb/brain/` SQLite schema, anchor store, session/task/validation tables, Zod schemas, ID strategy.
**Uses:** `better-sqlite3`, `zod`, `gray-matter` (or equivalent) for frontmatter.
**Avoids:** context-only memory, untyped metadata.

### Phase 3: Retrieval + Hop-Reading (Index + AST + Graph)
**Rationale:** agents need fast “where to look next” across code and artifacts.
**Delivers:** Orama index, Tree-sitter parsing, relationship graph (imports/calls/session DAG), query tools for agents.
**Implements:** hop-reading queries (symbol → definition → references → related files).
**Avoids:** grep/glob-only workflows, slow manual navigation.

### Phase 4: Auto-Governance Loops (Async Validation + Persistence)
**Rationale:** self-governance requires routine background checks that survive compaction.
**Delivers:** async validation execution + persisted results + auto-resume patterns; todo enforcement.
**Uses:** community patterns (background-agents / closed-loop async) adapted into iDumb-native tools.
**Avoids:** fire-and-forget validations, manual bookkeeping.

### Phase 5: Context Optimization (Lazy Rules + Pruning)
**Rationale:** keep contexts small and relevant (“Less for More”) while maintaining correctness.
**Delivers:** lazy-load governance rules/skills; safe pruning policies for obsolete outputs.
**Avoids:** pre-loading all rules, over-pruning critical governance state.

### Phase Ordering Rationale

- Contracts-first before brain: without stable governance, “brain” just stores inconsistent behavior.
- Brain before hop-reading: traversal/search need durable state + schemas + IDs.
- Hop-reading before auto-governance: validation loops become far more accurate with code intelligence.
- Optimization last: pruning and lazy policies require baseline telemetry and stable artifacts.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3:** embeddings strategy (local vs none), multi-language parsing scope, large repo performance
- **Phase 5:** pruning policies and protected-context rules (easy to break correctness)

Phases with standard patterns (skip extra research):
- **Phase 2:** SQLite + Zod schema + ID system (well-understood patterns)
- **Phase 4:** async delegation + persisted results (community patterns exist; adapt carefully)

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | clear, lightweight, client-side viable stack (SQLite/Orama/Tree-sitter/Zod/graphlib) |
| Features | MEDIUM | feature set is derived from goals + gaps; needs requirements scoping |
| Architecture | MEDIUM-HIGH | strong patterns (thin orchestrator, contracts-first, durable brain) |
| Pitfalls | HIGH | wrapper-era failure modes are explicit and repeatable |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- Exact definition of “take over GSD”: which GSD artifacts stay vs which become iDumb-native contracts
- Embeddings approach: whether to ship with local embeddings, optional provider, or defer
- Stability guarantees for any hook-based injections: need feature flags + fallback paths

## Sources

### Primary (HIGH confidence)
- `.planning/research/SYNTHESIS-01-WRAPPER-ERA.md` — wrapper failure modes and surviving principles
- `.planning/research/SYNTHESIS-02-GSD-ANALYSIS.md` — what to preserve from GSD + what to fix
- `.planning/research/SYNTHESIS-04-BRAIN-STACK.md` — local brain stack and dataflow
- `.planning/research/SYNTHESIS-05-COMMUNITY-PATTERNS.md` — ecosystem patterns (lazy-loading, async, workflows)

---
*Research completed: 2026-02-02*
*Ready for roadmap: yes*
