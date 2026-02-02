# Requirements: iDumb v2 Meta-Framework

**Defined:** 2026-02-02
**Core Value:** Make agentic development trustworthy: the right agent does the right work with the right context, and outcomes are validated (not assumed).

## v1 Requirements

### Installation & Compatibility

- [ ] **INST-01**: User can install iDumb via `npx`/`pnpm`/`npm`/`bunx` in either local or global mode
- [ ] **INST-02**: Installation does not require forking/modifying OpenCode source code
- [ ] **INST-03**: iDumb does not assume the user’s LLM/provider choices (no model-specific assumptions)
- [ ] **INST-04**: iDumb does not assume a project-local `.opencode/` directory exists or is editable
- [ ] **INST-05**: iDumb stores its durable state under `.idumb/` (no writes to `.planning/` except reading)

### Governance Contracts (Roles, Permissions, Workflows)

- [ ] **GOV-01**: Users can initialize governance state via `/idumb:init` (idempotent)
- [ ] **GOV-02**: A clear delegation hierarchy exists and is enforced by tool scoping/permissions (coordinator delegates; builder edits; validator validates)
- [ ] **GOV-03**: Governance workflows are context-first (must load current state/context before acting)
- [ ] **GOV-04**: Governance workflows record evidence for outcomes (what changed, what validated, what remains)
- [ ] **GOV-05**: Work cannot be declared “complete” without a recorded validation result (pass/fail/partial + evidence)

### Brain MVP (Durable Memory + IDs + Schemas)

- [ ] **BRN-01**: Brain persists sessions, anchors, validations, and governance history to `.idumb/brain/`
- [ ] **BRN-02**: Brain uses schema validation and versioning for all persisted records
- [ ] **BRN-03**: Brain supports chunked read/write operations for long documents (IDs + metadata)
- [ ] **BRN-04**: Brain stores and queries relationships (session tree, tasks, files, artifacts) as a graph

### Retrieval + Hop-Reading (Code + Artifact Navigation)

- [ ] **NAV-01**: Agent can query brain records by ID and by structured filters (type, priority, time)
- [ ] **NAV-02**: Agent can search across brain artifacts quickly (full-text)
- [ ] **NAV-03**: Agent can hop-read code relationships at symbol level (definition ↔ references ↔ related files) for supported languages

### Validation & Drift Control

- [ ] **VAL-01**: iDumb can validate `.idumb/` structure, schema integrity, and required invariants
- [ ] **VAL-02**: iDumb can detect drift (manifest snapshot vs current state) and report actionable diffs
- [ ] **VAL-03**: iDumb can run freshness checks (stale context detection) and surface risks

### Observability

- [ ] **OBS-01**: Plugin logs governance events to `.idumb/governance/plugin.log` without leaking into TUI output

## v2 Requirements

### Auto-Governance Loops

- **AUTO-01**: Async validation agents can run in background and persist results to disk
- **AUTO-02**: Closed-loop delegation (no fire-and-forget): orchestrator blocks on required validations
- **AUTO-03**: TODO enforcement loop exists (tasks tracked, incomplete work surfaced on stop/resume)

### Context Optimization

- **OPT-01**: Governance rules/skills are lazy-loaded (do not pre-load everything into context)
- **OPT-02**: Safe pruning policies exist (dedupe/supersede old outputs) without deleting protected governance context

## Out of Scope

| Feature | Reason |
|---------|--------|
| Forking OpenCode | Must work as installable plugin for all users |
| Cloud-hosted brain DB | Local-first, offline capable |
| Forcing project-local install | Users may install globally |
| Assuming `.opencode/` is writable | Must work in projects without `.opencode/` changes |
| Mandatory experimental hook dependence | Fragile across versions; must be optional/flagged |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| INST-01 | Phase 1 | Pending |
| INST-02 | Phase 1 | Pending |
| INST-03 | Phase 1 | Pending |
| INST-04 | Phase 1 | Pending |
| INST-05 | Phase 2 | Pending |
| GOV-01 | Phase 1 | Pending |
| GOV-02 | Phase 1 | Pending |
| GOV-03 | Phase 1 | Pending |
| GOV-04 | Phase 1 | Pending |
| GOV-05 | Phase 1 | Pending |
| BRN-01 | Phase 2 | Pending |
| BRN-02 | Phase 2 | Pending |
| BRN-03 | Phase 2 | Pending |
| BRN-04 | Phase 2 | Pending |
| NAV-01 | Phase 3 | Pending |
| NAV-02 | Phase 3 | Pending |
| NAV-03 | Phase 3 | Pending |
| VAL-01 | Phase 1 | Pending |
| VAL-02 | Phase 4 | Pending |
| VAL-03 | Phase 1 | Pending |
| OBS-01 | Phase 1 | Pending |

**Coverage:**
- v1 requirements: 21 total
- Mapped to phases: 21
- Unmapped: 0 ✓

---
*Requirements defined: 2026-02-02*
*Last updated: 2026-02-02 after initial definition*
