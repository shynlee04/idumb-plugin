# iDumb Path Hierarchy & Naming Convention Specification

**Version:** 1.0.0-draft  
**Date:** 2026-02-05  
**Status:** PROPOSAL - Awaiting Approval

---

## 1. Overview

This specification defines a regulated path structure, naming conventions, and ID/numbering system for the iDumb governance framework. It supports:

- **Brownfield → Greenfield** projects
- **Variable complexity** (simple scripts to enterprise systems)
- **Research-heavy workflows** (synthesis, validation, brainstorming)
- **GSD-style execution** (phases, atomic plans, verification)
- **Relational metadata** (entity relationships, knowledge graphs)

---

## 2. Root Structure

```
.idumb/                       # iDumb governance root
├── brain/                    # Runtime state (volatile)
├── modules/                  # User-extendable components
├── project-core/             # Single source of truth (stable)
├── project-output/           # Phase-based deliverables
└── sessions/                 # Session tracking

.governance/                  # NEW: Unified governance framework
├── schemas/                  # Relational metadata definitions
├── hooks/                    # Event-triggered actions
├── entities/                 # Knowledge graph nodes
├── relationships/            # Connection definitions
└── policies/                 # Governance rules
```

---

## 3. ID & Numbering System

### 3.1 Universal ID Format

```
{scope}-{type}-{ring}{seq}-{variant}

Examples:
  P0-RES-A01        # Phase 0, Research, Ring A, sequence 01
  P1-PLN-B03-v2     # Phase 1, Plan, Ring B, sequence 03, variant 2
  M2-TSK-C12        # Milestone 2, Task, Ring C, sequence 12
```

### 3.2 Scope Prefixes

| Prefix | Scope | Description |
|--------|-------|-------------|
| `P{n}` | Phase | Phase number (P0 = discovery, P1 = planning, etc.) |
| `M{n}` | Milestone | Major milestone marker |
| `S{n}` | Sprint | Sprint/iteration (agile projects) |
| `E{n}` | Epic | Epic-level grouping |

### 3.3 Type Codes (3-letter)

| Code | Type | Description |
|------|------|-------------|
| **Research & Analysis** |
| `RES` | Research | Primary research artifact |
| `SYN` | Synthesis | Consolidated research findings |
| `ANL` | Analysis | Deep analysis document |
| `BRN` | Brainstorm | Brainstorming session output |
| `CMP` | Comparison | Comparative analysis |
| **Planning & Specification** |
| `PLN` | Plan | Atomic plan document |
| `RDM` | Roadmap | Strategic roadmap |
| `TSP` | Tech-Spec | Technical specification |
| `ARC` | Architecture | Architecture decision/design |
| `REQ` | Requirement | Requirement specification |
| **Validation & Verification** |
| `VAL` | Validation | Plan validation result |
| `VER` | Verification | Implementation verification |
| `CHK` | Checkpoint | State checkpoint |
| `REV` | Review | Review document |
| `AUD` | Audit | Audit report |
| **Execution & Implementation** |
| `TSK` | Task | Execution task |
| `IMP` | Implementation | Implementation artifact |
| `FIX` | Fix | Bug fix or correction |
| `REF` | Refactor | Refactoring task |
| **Context & State** |
| `CTX` | Context | Context anchor |
| `SES` | Session | Session artifact |
| `LOG` | Log | Activity log |
| `MET` | Metrics | Metrics/telemetry |

### 3.4 Ring System (Granularity Levels)

Rings indicate depth/granularity within a phase:

| Ring | Letter | Granularity | Example Use |
|------|--------|-------------|-------------|
| **Ring A** | A | Strategic | High-level decisions, phase goals |
| **Ring B** | B | Tactical | Plans, specifications |
| **Ring C** | C | Operational | Tasks, implementations |
| **Ring D** | D | Atomic | Individual actions, micro-tasks |
| **Ring X** | X | Cross-cutting | Applies across rings |

### 3.5 Sequence Numbers

- **2-digit** for most artifacts: `01-99`
- **3-digit** for large phases: `001-999`
- Gaps allowed for insertion: `01, 02, 05, 10` (leaves room for `03, 04`)

### 3.6 Variant Suffixes

| Suffix | Meaning |
|--------|---------|
| `-v{n}` | Version number |
| `-draft` | Draft state |
| `-final` | Finalized |
| `-alt` | Alternative approach |
| `-exp` | Experimental |

---

## 4. Directory Structure Details

### 4.1 `.idumb/brain/` - Runtime State

```
.idumb/brain/
├── state.json                # Current governance state (SSOT)
├── config.json               # Runtime configuration
├── context/                  # Active context anchors
│   ├── CTX-{id}.json        # Individual context files
│   └── _active.json         # Currently active contexts
├── history/                  # Action history
│   ├── {YYYY-MM}/           # Month-partitioned
│   │   └── {DD}-{HH}.jsonl  # Hourly log files
│   └── _index.json          # History index
├── drift/                    # Drift detection artifacts
│   ├── baseline.json        # Baseline snapshot
│   └── deviations/          # Detected deviations
├── metrics/                  # Execution metrics
│   └── {session-id}.json    # Per-session metrics
└── cache/                    # Temporary cache (auto-cleanup)
```

### 4.2 `.idumb/modules/` - User Extensions

```
.idumb/modules/
├── _registry.json            # Module registry
├── {module-name}/            # User-defined module
│   ├── module.json           # Module manifest
│   ├── hooks/                # Module-specific hooks
│   ├── templates/            # Module templates
│   └── rules/                # Module rules
└── _disabled/                # Disabled modules
```

### 4.3 `.idumb/project-core/` - Single Source of Truth

```
.idumb/project-core/
├── PROJECT.md                # Project overview (SSOT)
├── ARCHITECTURE.md           # System architecture
├── TECH-STACK.md             # Technology decisions
├── CONVENTIONS.md            # Coding conventions
├── decisions/                # Architecture Decision Records
│   ├── ADR-{NNN}-{slug}.md  # Individual ADRs
│   └── _index.md            # ADR index
├── contracts/                # API/Interface contracts
│   └── {domain}/            # Domain-grouped contracts
└── invariants/               # System invariants
    └── {domain}-invariants.md
```

**ADR Naming:** `ADR-{3-digit}-{kebab-case-title}.md`
```
ADR-001-use-typescript.md
ADR-002-event-driven-architecture.md
ADR-015-caching-strategy.md
```

### 4.4 `.idumb/project-output/` - Phase Deliverables (GSD Style)

```
.idumb/project-output/
├── _manifest.json            # Output manifest with relationships
│
├── P0-discovery/             # Phase 0: Discovery
│   ├── _phase.json           # Phase metadata
│   ├── A-strategic/          # Ring A: Strategic
│   │   ├── P0-RES-A01-problem-space.md
│   │   ├── P0-RES-A02-stakeholders.md
│   │   └── P0-SYN-A10-discovery-synthesis.md
│   ├── B-tactical/           # Ring B: Tactical
│   │   ├── P0-ANL-B01-market-analysis.md
│   │   └── P0-CMP-B02-competitor-review.md
│   └── C-operational/        # Ring C: Operational
│       └── P0-BRN-C01-initial-brainstorm.md
│
├── P1-planning/              # Phase 1: Planning
│   ├── _phase.json
│   ├── A-strategic/
│   │   ├── P1-RDM-A01-project-roadmap.md
│   │   └── P1-ARC-A02-high-level-architecture.md
│   ├── B-tactical/
│   │   ├── P1-PLN-B01-sprint-plan.md
│   │   ├── P1-TSP-B02-api-spec.md
│   │   └── P1-VAL-B01-v1.md          # Validation of B01
│   └── C-operational/
│       ├── P1-TSK-C01-setup-repo.md
│       └── P1-TSK-C02-ci-pipeline.md
│
├── P2-execution/             # Phase 2: Execution
│   ├── _phase.json
│   ├── A-strategic/
│   │   └── P2-CHK-A01-milestone-checkpoint.md
│   ├── B-tactical/
│   │   ├── P2-IMP-B01-auth-module.md
│   │   └── P2-VER-B01-v1.md          # Verification of B01
│   └── C-operational/
│       ├── P2-TSK-C01-implement-login.md
│       ├── P2-TSK-C02-implement-logout.md
│       └── P2-FIX-C10-login-bug.md
│
├── P3-verification/          # Phase 3: Verification
│   ├── _phase.json
│   ├── A-strategic/
│   │   └── P3-AUD-A01-security-audit.md
│   └── B-tactical/
│       ├── P3-REV-B01-code-review.md
│       └── P3-VER-B02-integration-tests.md
│
└── PX-cross-phase/           # Cross-phase artifacts
    ├── research/             # Ongoing research
    │   ├── PX-RES-X01-tech-spikes.md
    │   └── PX-SYN-X10-research-digest.md
    └── retrospectives/       # Phase retrospectives
        └── PX-REV-X01-P1-retro.md
```

### 4.5 `.idumb/sessions/` - Session Tracking

```
.idumb/sessions/
├── _active.json              # Currently active sessions
├── {YYYY-MM}/                # Month-partitioned
│   └── SES-{timestamp}-{short-id}/
│       ├── session.json      # Session metadata
│       ├── context.json      # Session context snapshot
│       ├── tools.jsonl       # Tool usage log
│       └── outcome.json      # Session outcome
└── _archive/                 # Archived sessions
```

**Session ID Format:** `SES-{YYYYMMDD}-{HHMM}-{4char}`
```
SES-20260205-0720-a3f9
```

---

## 5. `.governance/` - Unified Governance Framework

### 5.1 Schemas - Relational Metadata

```
.governance/schemas/
├── _meta.json                # Schema registry metadata
├── entity/                   # Entity type schemas
│   ├── artifact.schema.json
│   ├── agent.schema.json
│   ├── phase.schema.json
│   └── decision.schema.json
├── relationship/             # Relationship schemas
│   ├── depends-on.schema.json
│   ├── validates.schema.json
│   ├── produces.schema.json
│   └── references.schema.json
└── composite/                # Composite schemas
    └── phase-graph.schema.json
```

### 5.2 Hooks - Event-Triggered Actions

```
.governance/hooks/
├── _registry.json            # Hook registry
├── pre/                      # Pre-action hooks
│   ├── pre-write.js          # Before file write
│   ├── pre-phase-transition.js
│   └── pre-validation.js
├── post/                     # Post-action hooks
│   ├── post-write.js
│   ├── post-phase-complete.js
│   └── post-validation.js
└── triggers/                 # Event triggers
    ├── on-drift-detected.js
    └── on-stall-detected.js
```

### 5.3 Entities - Knowledge Graph Nodes

```
.governance/entities/
├── _index.json               # Entity index
├── artifacts/                # Artifact entities
│   └── {artifact-id}.json
├── agents/                   # Agent entities
│   └── {agent-name}.json
├── decisions/                # Decision entities
│   └── {decision-id}.json
└── milestones/               # Milestone entities
    └── {milestone-id}.json
```

**Entity JSON Format:**
```json
{
  "id": "P1-PLN-B01",
  "type": "artifact",
  "name": "Sprint Plan",
  "created": "2026-02-05T07:20:00Z",
  "modified": "2026-02-05T08:30:00Z",
  "status": "active",
  "phase": "P1",
  "ring": "B",
  "relationships": [
    { "type": "depends-on", "target": "P0-SYN-A10" },
    { "type": "validated-by", "target": "P1-VAL-B01" }
  ],
  "metadata": {
    "author": "idumb-planner",
    "complexity": "medium",
    "priority": "high"
  }
}
```

### 5.4 Relationships - Connection Definitions

```
.governance/relationships/
├── _graph.json               # Full relationship graph
├── by-source/                # Indexed by source
│   └── {source-id}.json
├── by-target/                # Indexed by target
│   └── {target-id}.json
└── by-type/                  # Indexed by relationship type
    ├── depends-on.json
    ├── validates.json
    └── produces.json
```

**Relationship Types:**

| Type | Direction | Description |
|------|-----------|-------------|
| `depends-on` | A → B | A depends on B existing |
| `blocks` | A → B | A must complete before B |
| `validates` | A → B | A validates B's correctness |
| `verifies` | A → B | A verifies B's implementation |
| `produces` | A → B | A produces B as output |
| `references` | A → B | A references B (soft link) |
| `supersedes` | A → B | A replaces/supersedes B |
| `derives-from` | A → B | A is derived from B |

### 5.5 Policies - Governance Rules

```
.governance/policies/
├── _active.json              # Active policies list
├── naming/                   # Naming policies
│   ├── file-naming.policy.json
│   └── id-format.policy.json
├── transitions/              # State transition policies
│   ├── phase-gates.policy.json
│   └── validation-required.policy.json
├── permissions/              # Permission policies
│   ├── agent-tools.policy.json
│   └── file-access.policy.json
└── quality/                  # Quality policies
    ├── artifact-completeness.policy.json
    └── review-requirements.policy.json
```

---

## 6. File Naming Conventions

### 6.1 General Rules

1. **Lowercase with hyphens** for readability
2. **ID prefix** for traceability
3. **Descriptive slug** for human understanding
4. **Extension** matches content type

### 6.2 Pattern Templates

```
{ID}-{descriptive-slug}.{ext}

Examples:
P0-RES-A01-problem-space.md
P1-PLN-B03-auth-module-plan.md
P2-TSK-C12-fix-login-timeout.md
ADR-005-database-choice.md
SES-20260205-0720-a3f9.json
```

### 6.3 Special Files

| Pattern | Purpose |
|---------|---------|
| `_index.{ext}` | Index/registry file |
| `_manifest.json` | Directory manifest |
| `_phase.json` | Phase metadata |
| `_active.json` | Currently active items |
| `_meta.json` | Metadata about the directory |
| `PROJECT.md` | Root project document (ALL CAPS) |
| `ARCHITECTURE.md` | Architecture document (ALL CAPS) |

### 6.4 Validation Files

Validation files reference their source:
```
{source-id}-{validation-type}.md

P1-PLN-B01-val.md          # Short form
P1-VAL-B01-plan-review.md  # Full form with own ID
```

---

## 7. Complexity Adaptation

### 7.1 Simple Projects (Greenfield, Solo)

```
.idumb/
├── brain/
│   ├── state.json
│   └── config.json
├── project-core/
│   └── PROJECT.md
└── project-output/
    ├── P0-discovery/
    │   └── P0-RES-A01-requirements.md
    └── P1-execution/
        └── P1-TSK-B01-implement.md
```

### 7.2 Medium Projects (Team, Agile)

Full structure with:
- All rings (A, B, C)
- Validation chain
- Session tracking
- Basic governance

### 7.3 Complex Projects (Enterprise, Brownfield)

Full structure plus:
- `.governance/` framework
- Knowledge graph entities
- Custom policies
- Hook automation
- Cross-phase artifacts
- Ring D (atomic tasks)

---

## 8. Migration Path

### 8.1 From Current Structure

```
OLD                              NEW
.idumb/brain/         →   .idumb/brain/
.idumb/project-output/ →   .idumb/project-output/
.idumb/modules/       →   .idumb/modules/
(new)                        →   .idumb/project-core/
(new)                        →   .idumb/sessions/
(new)                        →   .governance/
```

### 8.2 Migration Script Requirements

1. Detect existing structure
2. Create new directories
3. Move files with path updates
4. Update all path references in:
   - TypeScript source (`src/plugins/lib/config.ts`, etc.)
   - Agent profiles (`src/agents/*.md`)
   - Commands (`src/commands/idumb/*.md`)
   - Installer (`bin/install.js`)
5. Generate entity records for existing artifacts
6. Build initial relationship graph

---

## 9. Implementation Phases

### Phase 1: Core Structure (Immediate)
- [ ] Create new directory structure
- [ ] Update `config.ts` path mappings
- [ ] Update `install.js` directory creation
- [ ] Migration script for existing installs

### Phase 2: Naming Enforcement (Week 1)
- [ ] Implement ID validation in hooks
- [ ] Add naming policy checks
- [ ] Update templates with new conventions

### Phase 3: Governance Framework (Week 2)
- [ ] Implement `.governance/` structure
- [ ] Create schema definitions
- [ ] Build entity/relationship indexing
- [ ] Hook integration

### Phase 4: Tooling (Week 3)
- [ ] CLI commands for artifact creation
- [ ] Relationship visualization
- [ ] Drift detection with new structure

---

## 10. Questions for Approval

1. **Ring depth:** Is A-B-C-D sufficient, or need more/fewer rings?
2. **ID format:** Is `{scope}-{type}-{ring}{seq}` clear enough?
3. **Phase numbering:** Start at P0 (discovery) or P1?
4. **`.governance/` location:** Inside `.idumb/` or separate root?
5. **Session partitioning:** By month, or different strategy?
6. **Relationship types:** Are the 8 types sufficient?

---

## Appendix: Quick Reference Card

```
ID FORMAT:     {Scope}-{Type}-{Ring}{Seq}[-{Variant}]
               P1-PLN-B03-v2

SCOPES:        P{n}=Phase, M{n}=Milestone, S{n}=Sprint, E{n}=Epic

TYPES:         RES=Research, SYN=Synthesis, PLN=Plan, TSP=TechSpec,
               VAL=Validation, VER=Verification, TSK=Task, IMP=Implement

RINGS:         A=Strategic, B=Tactical, C=Operational, D=Atomic, X=Cross

FILE PATTERN:  {ID}-{descriptive-slug}.{ext}
               P1-PLN-B03-auth-module.md

SPECIAL:       _index, _manifest, _phase, _active, _meta
               PROJECT.md, ARCHITECTURE.md (ALL CAPS)
```

---

*Awaiting approval to proceed with implementation.*
