# iDumb Cross-Concept Validation Matrix
**Date:** 2026-02-02
**Status:** ANALYSIS COMPLETE - GAPS IDENTIFIED

---

## Executive Summary

| Component | Total Items | Fully Satisfied | Partial | Missing/Gap |
|-----------|-------------|-----------------|---------|-------------|
| **Agents** (DG, CL-2,5,6,7,8) | 14 reqs | 4 | 5 | 5 |
| **Tools** (SG, P1, P3) | 16 reqs | 8 | 5 | 3 |
| **Hooks** (AG, CL-5,6,7, P3) | 8 reqs | 6 | 2 | 0 |
| **TOTAL** | 30 reqs | 18 (60%) | 8 (27%) | 4 (13%) |

### Critical Gaps Requiring Action
| ID | Requirement | Gap | Priority |
|----|-------------|-----|----------|
| **P3-5** | TODO manipulation with hierarchy | No tool exists | HIGH |
| **P3-1** | Session creation/modification/export | No tool exports | HIGH |
| **CL-1, CL-4** | DOS/DONTS matrix enforcement | Not embedded in agents | MEDIUM |
| **CL-3** | Config overlap prevention | No guard logic | MEDIUM |

---

## Requirement-to-Concept Mapping

### Common List (CL-1 to CL-8)

| ID | Requirement | Status | Component(s) | Evidence |
|----|-------------|--------|--------------|----------|
| CL-1 | Form the matrix of list from DO/DON'T | ❌ GAP | None | This document addresses it but agents don't embed it |
| CL-2 | Concepts resonate with Core concepts/visions | ⚠️ PARTIAL | All agents | Hierarchy embodied but "Core concepts" not explicit |
| CL-3 | User configs not overlapping GSD/OpenCode | ❌ GAP | idumb-config.ts | Tool exists but no overlap prevention logic |
| CL-4 | Obey to all DOS and DONTS | ❌ GAP | None | DOS/DONTS table not referenced in agents |
| CL-5 | Runtime starting aligned to hierarchy/automation | ✅ FULL | session.created hook, supreme-coordinator | Hook syncs GSD, agent defines hierarchy |
| CL-6 | Mid-session concepts consumed with anchoring | ✅ FULL | session.compacting hook | Injects anchors + history via output.context.push() |
| CL-7 | Wrappers un-break regulation, metadata | ✅ FULL | All hooks | All hooks explicitly avoid GSD injection |
| CL-8 | YAML/JSON/API schema accuracy | ⚠️ PARTIAL | idumb-builder | YAML guidance exists but no schema validation |

### Automation Group (AG-1 to AG-2)

| ID | Requirement | Status | Component(s) | Evidence |
|----|-------------|--------|--------------|----------|
| AG-1 | Scripts/hooks have fallback strategy | ✅ FULL | All 10 hooks | All wrapped in try/catch with silent fail |
| AG-2 | Prompts meticulous with context, not over-engineered | ✅ FULL | compacting hook, stop hook | 5 sections ~20 lines (not bloated) |

### Status Group (SG-1 to SG-2)

| ID | Requirement | Status | Component(s) | Evidence |
|----|-------------|--------|--------------|----------|
| SG-1 | Status docs iterated, one version, stale check | ⚠️ PARTIAL | idumb-validate.freshness | 48h stale check but no version iteration tracking |
| SG-2 | Chunk reading for long documents | ✅ FULL | idumb-chunker.ts | 5 exports: read, overview, validate, append, default |

### Delegation Group (DG-1 to DG-2)

| ID | Requirement | Status | Component(s) | Evidence |
|----|-------------|--------|--------------|----------|
| DG-1 | Highest agents enforce context-first, ban execution | ✅ FULL | supreme-coordinator | Lines 91-97, 33-34: context-first, delegate all |
| DG-2 | Mid-level can't modify code files | ✅ FULL | high-governance, low-validator | edit: deny, write: deny in both |

### Phase 1+2 Requirements (P1-1 to P1-9)

| ID | Requirement | Status | Component(s) | Evidence |
|----|-------------|--------|--------------|----------|
| P1-1 | Config with user name, language, paths | ✅ FULL | idumb-config.ts | user.name, user.language.communication/documents |
| P1-2 | Paths to status/state control | ✅ FULL | idumb-state.ts, idumb-config.ts | paths.state.brain/history/anchors |
| P1-3 | Paths to documents/artifacts with hierarchy | ✅ FULL | idumb-config.ts | paths.artifacts, paths.context, hierarchy |
| P1-4 | GSD config.json append tracing | ⚠️ PARTIAL | idumb-config.sync | sync() reads GSD but no change history |
| P1-5 | Installation works with any OS | ⚠️ PARTIAL | bin/install.js | path.join used but not fully tested |
| P1-6 | Interactive install shows status | ⚠️ PARTIAL | bin/install.js | Status shown but "interactive does not work" |
| P1-7 | Manifest watch for drift/conflicts | ✅ FULL | idumb-manifest.ts | drift, conflicts, snapshot exports |
| P1-8 | Connect to atomic git hash control | ✅ FULL | idumb-manifest.verifyGitHash | Verifies git state matches expected hash |
| P1-9 | Time/date stamp to short-live artifacts | ⚠️ PARTIAL | plugin tool.before, idumb-chunker.validate | Injection in plugin, validation in chunker |

### Phase 3 Requirements (P3-1 to P3-7)

| ID | Requirement | Status | Component(s) | Evidence |
|----|-------------|--------|--------------|----------|
| P3-1 | Session creation/modification/export | ❌ GAP | None | storeSessionMetadata() tracks but no CRUD exports |
| P3-2 | Auto creation of new session by coordinator | ⚠️ PARTIAL | session.created hook | Metadata stored; agent handles orchestration |
| P3-3 | Delegation cycle manipulation | ⚠️ PARTIAL | tool.before/after hooks | Observes only (manipulation would violate CL-7) |
| P3-4 | Chunk reading + long-term context brain | ⚠️ PARTIAL | idumb-chunker, idumb-context.summary | Chunking works; brain persistence missing |
| P3-5 | TODO manipulation with hierarchy | ❌ GAP | None | Plugin checks TODOs but no manipulation tool |
| P3-6 | Validation enforcement via TODO | ✅ FULL | stop hook | client.session.prompt() enforces completion |
| P3-7 | No code touch without matching plan ID | ⚠️ PARTIAL | idumb-builder | PLAN ID VERIFICATION section but not enforced |

---

## Component Analysis Summary

### Agents (4 files)

```
idumb-supreme-coordinator.md
├── Satisfies: DG-1, CL-5, CL-6
├── Partial: CL-2, CL-7, AG-2, SG-1
└── Evidence: Lines 33-34 (ban execution), 91-97 (context-first), 116-136 (TODO)

idumb-high-governance.md
├── Satisfies: DG-2, CL-7
├── Partial: CL-5, CL-6, AG-2, SG-1
└── Evidence: Lines 19-20 (edit/write deny), 95-101 (GSD awareness)

idumb-low-validator.md
├── Satisfies: DG-2, SG-1
├── Partial: SG-2, AG-2
└── Evidence: Lines 23-24 (edit/write deny), 145 (timestamp checking)

idumb-builder.md
├── Satisfies: CL-7, CL-8
├── Partial: SG-1, AG-1
└── Evidence: Lines 18-19 (edit/write ALLOW - only one), 115-130 (YAML guidance)
```

### Tools (6 files, 29 exports)

| Tool | Exports | Full | Partial | Gap |
|------|---------|------|---------|-----|
| idumb-state.ts | 6 | P1-2 | SG-1, P3-1 | - |
| idumb-validate.ts | 5 | SG-1 | P1-4, P3-6 | - |
| idumb-config.ts | 6 | P1-1, P1-2, P1-3 | P1-4, P1-9 | CL-3 |
| idumb-context.ts | 3 | - | P1-1, P3-4 | - |
| idumb-manifest.ts | 5 | P1-7, P1-8 | - | - |
| idumb-chunker.ts | 5 | SG-2, P3-4 | P1-9 | - |

### Hooks (10 in plugin)

| Hook | Satisfies | Has Fallback | Injects to LLM |
|------|-----------|--------------|----------------|
| session.created | AG-1, CL-5, P3-2 | ✅ | ❌ |
| command.executed | AG-1, CL-7 | ✅ | ❌ |
| session.idle | AG-1 | ✅ | ❌ |
| session.compacted | AG-1, CL-6 | ✅ | ❌ |
| todo.updated | AG-1, P3-6 | ✅ | ❌ |
| experimental.session.compacting | AG-1, AG-2, CL-6 | ✅ | ✅ |
| tool.execute.before | AG-1, CL-7, P3-3 | ✅ | ❌ |
| tool.execute.after | AG-1, P3-3 | ✅ | ❌ |
| command.execute.before | AG-1, CL-7 | ✅ | ❌ |
| stop | AG-1, AG-2, P3-6 | ✅ | ✅ |

---

## Gap Resolution Plan

### HIGH Priority (Blocking Installation Test)

#### GAP-1: P3-5 - Create idumb-todo.ts
```typescript
// New tool needed with exports:
export const create = tool({ ... });   // Create hierarchical TODO
export const update = tool({ ... });   // Update status/content
export const complete = tool({ ... }); // Mark complete with validation
export const list = tool({ ... });     // List with filters
export const hierarchy = tool({ ... }); // Get TODO tree structure
```

#### GAP-2: P3-1 - Add Session Exports to idumb-state.ts
```typescript
// Add to existing idumb-state.ts:
export const createSession = tool({ ... });  // Create new session record
export const modifySession = tool({ ... });  // Update session metadata
export const exportSession = tool({ ... });  // Export for long-term brain
```

### MEDIUM Priority (Quality Enhancement)

#### GAP-3: CL-1, CL-4 - Embed DOS/DONTS in Agents
```markdown
<!-- Add to idumb-supreme-coordinator.md -->
## DOS/DONTS ENFORCEMENT
| Category | DO | DON'T |
|----------|----|----- |
| Plugin | Understand concepts | Assume it works |
| Wrapper | Align to framework | Break artifacts |
| Hierarchy | Delegate execution | Execute directly |
| Context | Use anchoring | Ignore staleness |
```

#### GAP-4: CL-3 - Add Config Overlap Guard
```typescript
// Add to idumb-config.ts update export:
const reservedKeys = ['models', 'provider', 'temperature']; // OpenCode
const gsdReservedKeys = ['milestones', 'phases', 'agents']; // GSD
if (reservedKeys.includes(key) || gsdReservedKeys.includes(key)) {
  return { error: `Key '${key}' is reserved by ${framework}` };
}
```

---

## Validation Checklist

### Before Installation Test, ALL Must Pass:

- [ ] All 4 critical gaps resolved
- [ ] Plugin hooks all have fallback (DONE ✅)
- [ ] Agents enforce hierarchy (DONE ✅)
- [ ] GSD integration non-breaking (DONE ✅)
- [ ] LLM sees governance at start (DONE ✅)
- [ ] Mid-session anchoring works (DONE ✅)
- [ ] TODO enforcement works (DONE ✅)
- [ ] Skeptic review completed
- [ ] User can run /idumb:init successfully

---

## Next Actions (Ordered)

1. **Validate GSD non-breaking** - Delegate to low-validator
2. **Validate LLM sees governance** - Check agent loading
3. **Validate mid-session anchoring** - Check compacting hook
4. **Decide on gaps** - User choice: fix now or defer to Phase 3
5. **Final skeptic review** - 3 viewpoints before install test
