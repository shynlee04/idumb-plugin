# iDumb v2 Meta-Framework

## What This Is

iDumb v2 is an OpenCode-first meta-framework (distributed as an installable plugin) that makes multi-agent software development reliable through hierarchy-first delegation, context-first execution, and evidence-based validation. It provides durable, local “brain” storage under `.idumb/` so governance, decisions, and workflow state survive compaction and across sessions.

## Core Value

Make agentic development trustworthy: the right agent does the right work with the right context, and outcomes are validated (not assumed).

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Deterministic governance workflows (commands + agent roles + permissions) that don’t depend on brittle prompt injection
- [ ] Local brain storage that persists sessions/anchors/validations under `.idumb/` (client-side, lightweight)
- [ ] Routine validation loops with explicit evidence trails and failure handling

### Out of Scope

- Modifying or forking OpenCode client/source code — plugin-only integration
- Assuming the user’s model/provider choices — must work with arbitrary LLM backends
- Requiring any external database or hosted service — local-first under `.idumb/`
- Assuming installation is project-local — must support global or local install
- Assuming greenfield projects — must handle brownfield repos and multiple entry points

## Context

- Wrapper-era attempts (interception-heavy governance) were brittle and adversarial; iDumb v2 pivots to contracts-first governance using OpenCode primitives + durable local state.
- upgrade powers of spec-drive devlopment and test-driven development using agents that are intelligently take decisions through iterative loop (thin orchestrator, traceability, atomic commits) but remove trust-based failure modes by moving governance into explicit contracts and persisted validation.

## Constraints

- **Integration**: Plugin-only — no OpenCode forks, no OpenCode source patches
- **Install Modes**: Must support global and local installs
- **Compatibility**: Must not assume `.opencode/` exists or is editable in the target project
- **Performance**: Local operations must be fast (sub-second typical queries) and lightweight

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Pivot from wrapper → meta-framework | Wrapper approach was brittle; needed contracts + first-class primitives | — Pending |
| Prefer stable OpenCode primitives over experimental hooks | Reduce fragility and hallucination surfaces | — Pending |
| Local brain under `.idumb/` | Durable memory + audit trails without external services | — Pending |
| Brain stack: SQLite + schemas + index + graph | Enables traceable nodes, relationships, and retrieval | — Pending |

---
*Last updated: 2026-02-02 after research synthesis*
