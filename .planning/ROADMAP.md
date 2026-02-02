# Roadmap: iDumb v2 Meta-Framework

## Overview

iDumb v2 ships as a plugin-powered meta-framework that makes agentic development reliable. The roadmap stabilizes governance contracts first (roles/permissions/workflows), then adds a durable local brain for long-term memory and traceability, then adds retrieval/hop-reading for accurate navigation, and finally adds automation loops and optimization.

## Phases

- [ ] **Phase 1: Contracts-First Governance Core** - Deterministic governance workflows using stable OpenCode primitives
- [ ] **Phase 2: Brain MVP (Durable State + Schemas)** - Local-first durable memory under `.idumb/brain/`
- [ ] **Phase 3: Retrieval + Hop-Reading** - Search + structural parsing + relationship traversal
- [ ] **Phase 4: Auto-Governance Loops** - Drift detection + routine validation + persisted results
- [ ] **Phase 5: Context Optimization** - Lazy rules + safe pruning policies

## Phase Details

### Phase 1: Contracts-First Governance Core
**Goal**: Governance works deterministically: correct role boundaries, context-first execution, and recorded validation evidence.
**Depends on**: Nothing (first phase)
**Requirements**: INST-01, INST-02, INST-03, INST-04, GOV-01, GOV-02, GOV-03, GOV-04, GOV-05, VAL-01, VAL-03, OBS-01
**Success Criteria** (what must be TRUE):
  1. User can run `/idumb:init` and see stable governance state created/updated under `.idumb/`
  2. Coordinator cannot write/edit files directly; builder can; validator is read/verify-only
  3. Any governance run produces an explicit validation result (pass/fail/partial) with evidence path references
**Plans**: TBD

Plans:
- [ ] 01-01: Define role contracts + permission matrix (agents/commands/tools)
- [ ] 01-02: Governance workflows and evidence logging (no brittle prompt injection)

### Phase 2: Brain MVP (Durable State + Schemas)
**Goal**: Durable memory exists locally with schema validation and relational/graph structure.
**Depends on**: Phase 1
**Requirements**: INST-05, BRN-01, BRN-02, BRN-03, BRN-04
**Success Criteria** (what must be TRUE):
  1. Sessions/anchors/validations persist under `.idumb/brain/` and can be queried by ID
  2. Invalid/unknown schema versions are rejected with actionable errors
  3. Relationship graph supports basic traversal (session tree, artifact links)
**Plans**: TBD

Plans:
- [ ] 02-01: SQLite schema + Zod contracts + ID strategy
- [ ] 02-02: Chunked doc nodes + relationship graph persistence

### Phase 3: Retrieval + Hop-Reading
**Goal**: Agents can quickly find and traverse relevant code and governance artifacts.
**Depends on**: Phase 2
**Requirements**: NAV-01, NAV-02, NAV-03
**Success Criteria** (what must be TRUE):
  1. Agent can search brain artifacts by text and structured filters
  2. Agent can hop from a symbol to definition/references/related files (supported languages)
  3. Index updates incrementally when files change (no full rebuild per edit)
**Plans**: TBD

Plans:
- [ ] 03-01: Orama index for artifacts + query tools
- [ ] 03-02: Tree-sitter parsing + symbol/relationship extraction + hop queries

### Phase 4: Auto-Governance Loops
**Goal**: Governance becomes routine and persistent: drift detection, scheduled validation, actionable reports.
**Depends on**: Phase 3
**Requirements**: VAL-02
**Success Criteria** (what must be TRUE):
  1. Drift detection reports what changed since last snapshot with paths and IDs
  2. Validation results persist and can be compared over time
  3. Failures produce an explicit next-action recommendation
**Plans**: TBD

Plans:
- [ ] 04-01: Manifest snapshot + drift detection + reports

### Phase 5: Context Optimization
**Goal**: “Less for More”: only load what’s needed while preserving correctness and auditability.
**Depends on**: Phase 4
**Requirements**: (v2) OPT-01, OPT-02
**Success Criteria** (what must be TRUE):
  1. Governance rules are lazy-loaded (no global context bloat)
  2. Pruning never removes protected governance artifacts (anchors, conflicts, decisions)
**Plans**: TBD

Plans:
- [ ] 05-01: Lazy-load governance rules + safe pruning policies

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Contracts-First Governance Core | 0/TBD | Not started | - |
| 2. Brain MVP (Durable State + Schemas) | 0/TBD | Not started | - |
| 3. Retrieval + Hop-Reading | 0/TBD | Not started | - |
| 4. Auto-Governance Loops | 0/TBD | Not started | - |
| 5. Context Optimization | 0/TBD | Not started | - |
