# Coordinator Dependency Audit

**Date:** 2026-02-05
**Purpose:** Map all dependencies before deprecation

---

## Summary

**CRITICAL FINDING:** The coordinator agents have extensive interdependencies throughout the iDumb framework. Immediate deprecation would break the system.

**Recommendation:** Phased migration with parallel support

---

## idumb-high-governance Dependencies

### Parent Relationships (Agents where high-governance is `parent:`)

| Agent | Impact |
|-------|--------|
| idumb-skeptic-validator | HIGH - parent reference |
| idumb-project-validator | HIGH - parent reference |
| idumb-meta-builder | HIGH - parent reference |
| idumb-meta-validator | HIGH - parent reference |
| idumb-builder | HIGH - parent reference |
| idumb-low-validator | MEDIUM - consumes from |
| idumb-project-executor | HIGH - parent reference |
| idumb-verifier | MEDIUM - consumes from |
| idumb-roadmapper | MEDIUM - consumes from |
| idumb-planner | MEDIUM - consumes from |
| idumb-integration-checker | MEDIUM - consumes from/escelates to |
| idumb-project-researcher | MEDIUM - consumes from |
| idumb-phase-researcher | MEDIUM - consumes from |
| idumb-research-synthesizer | MEDIUM - consumes from |
| idumb-codebase-mapper | MEDIUM - consumes from |
| idumb-project-explorer | MEDIUM - consumes from |
| idumb-plan-checker | LOW - consumes from |

**Count:** ~18 direct dependencies

### Delegation Permissions

Agents that explicitly allow delegating to `idumb-high-governance`:
- idumb-supreme-coordinator
- idumb-mid-coordinator

---

## idumb-mid-coordinator Dependencies

### Parent Relationships

| Agent | Impact |
|-------|--------|
| None (no agents list mid-coordinator as parent) | N/A |

### Consumes From / Delegates To

| Agent | Relationship |
|-------|--------------|
| idumb-supreme-coordinator | Delegates project work TO |
| idumb-high-governance | Delegates FROM (spawned by) |
| idumb-planner | Consumes FROM |
| idumb-skeptic-validator | Consumes FROM |
| idumb-integration-checker | Consumes FROM |
| idumb-project-researcher | Consumes FROM |
| idumb-phase-researcher | Consumes FROM |
| idumb-builder | Consumes FROM |
| idumb-project-executor | Consumes FROM |
| idumb-verifier | Consumes FROM |
| idumb-meta-builder | Consumes FROM |
| idumb-meta-validator | Consumes FROM |
| idumb-research-synthesizer | Consumes FROM |
| idumb-project-explorer | Consumes FROM |
| idumb-plan-checker | Consumes FROM |
| idumb-codebase-mapper | Consumes FROM |
| idumb-roadmapper | Consumes FROM |
| idumb-project-validator | Consumes FROM |

**Count:** ~17 dependencies (bidirectional flow with high-governance)

### Delegation Permissions

Agents that explicitly allow delegating to `idumb-mid-coordinator`:
- idumb-supreme-coordinator
- idumb-high-governance

---

## idumb-project-coordinator Dependencies

### Consumes From / Delegates To

| Agent | Relationship |
|-------|--------------|
| idumb-project-validator | Consumes FROM |
| src/skills/idumb-governance/SKILL.md | Referenced in documentation |
| src/router/SESSION-STATES-GOVERNANCE.md | Referenced in documentation |

**Count:** ~3 dependencies (minimal usage)

---

## Dependency Graph Visualization

```
supreme-coordinator
    │
    ├── high-governance ──────┐
    │   │                      │
    │   ├── meta-builder       │
    │   ├── meta-validator    │
    │   ├── builder            │
    │   ├── low-validator     │
    │   ├── skeptic-validator  │
    │   ├── project-validator  │
    │   └── mid-coordinator ───┘
    │       │
    │       └── [ALL PROJECT AGENTS]
    │           ├── project-executor
    │           ├── verifier
    │           ├── planner
    │           ├── roadmapper
    │           ├── researcher(s)
    │           ├── codebase-mapper
    │           └── ... (~15 more)
    │
    └── project-coordinator (low usage, ~3 refs)
```

---

## Migration Strategy (Revised)

### Phase 1: Build Alternatives Alongside (Non-Breaking)

1. **Create skills** WITHOUT breaking existing agents
2. **Create workflows** WITHOUT removing coordinator functionality
3. **Test alternatives** while coordinators still work
4. **Gradual migration** of dependent agents

### Phase 2: Update Parent References (High Risk)

**Only after skills are proven:**
1. Update `parent:` fields in agent frontmatter
2. Update `consumes from` sections
3. Update delegation permissions
4. Full regression testing

### Phase 3: Deprecation (Last Step)

1. Add deprecation notices to coordinators
2. Keep functional for 1-2 versions
3. Monitor usage metrics
4. Remove only after zero usage

---

## Risk Assessment

| Coordinator | Risk Level | Justification |
|-------------|------------|----------------|
| idumb-high-governance | **CRITICAL** | 18 dependencies, parent of 6 agents |
| idumb-mid-coordinator | **HIGH** | 17 dependencies, primary bridge to project work |
| idumb-project-coordinator | **LOW** | Only 3 dependencies, minimal usage |

**Recommended Order:**
1. Start with idumb-project-coordinator (lowest risk)
2. Then idumb-mid-coordinator (after high-governance migration)
3. Last: idumb-high-governance (highest risk)

---

## Files Requiring Updates

For each coordinator deprecation, these files need updates:

### For idumb-high-governance:
- All agents with `parent: idumb-high-governance`
- All agents with "consumes from" idumb-high-governance
- idumb-supreme-coordinator (delegation permissions)

### For idumb-mid-coordinator:
- All agents with "consumes from" idumb-mid-coordinator
- idumb-supreme-coordinator (delegation permissions)
- idumb-high-governance (delegation permissions)

### For idumb-project-coordinator:
- idumb-project-validator
- src/skills/idumb-governance/SKILL.md
- src/router/SESSION-STATES-GOVERNANCE.md

---

**Next Steps:**
1. Create idumb-meta-creator skill
2. Create idumb-governance-coordinator skill
3. Create idumb-project-orchestrator skill
4. Test skills alongside coordinators
5. Gradual migration of parent references
6. Add deprecation notices LAST
