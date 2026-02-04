# iDumb Tools Restructure: Execution Order

**Generated:** 2026-02-05  
**Phase:** tools-restructure-planning  
**Document:** 04-EXECUTION-ORDER.md  
**Status:** PLAN APPROVED - Ready for execution

---

## Critical Dependencies Summary

```
                    ┌─────────────────────────────────────────────────────────┐
                    │                     INSTALLER                           │
                    │                   (bin/install.js)                       │
                    │              Copies everything to .opencode/             │
                    └─────────────────────────────────────────────────────────┘
                                              ▲
                                              │ copies from
                    ┌─────────────────────────────────────────────────────────┐
                    │                                                          │
    ┌───────────────┴───────────────┐    ┌─────────────────────────────────────┘
    │                               │    │
    ▼                               ▼    ▼
┌──────────┐                ┌───────────────────┐
│ PLUGIN   │◄───imports────│  PLUGIN LIB (12)  │
│ (core.ts)│                │ src/plugins/lib/* │
└──────────┘                └───────────────────┘
    │                               │
    │ provides hooks to             │ shared by
    ▼                               ▼
┌──────────────────────────────────────────────────────────────┐
│                        TOOLS (12)                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌───────────────┐ │
│  │ STANDALONE (10) │  │ idumb-chunker   │  │ idumb-style   │ │
│  │ - state         │  │ (uses tools/lib)│  │(uses plugins/ │ │
│  │ - config        │  │                 │  │     lib)      │ │
│  │ - validate      │  │                 │  │               │ │
│  │ - context       │  └─────────────────┘  └───────────────┘ │
│  │ - manifest      │                                          │
│  │ - todo          │                                          │
│  │ - orchestrator  │                                          │
│  │ - performance   │                                          │
│  │ - security      │                                          │
│  │ - quality       │                                          │
│  └─────────────────┘                                          │
└──────────────────────────────────────────────────────────────┘
                    │
                    │ consumed by
                    ▼
┌──────────────────────────────────────────────────────────────┐
│                     CONSUMERS                                 │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌─────────┐│
│  │ AGENTS (22)│  │COMMANDS(20)│  │WORKFLOWS   │  │ SKILLS  ││
│  │            │  │            │  │   (11)     │  │ (11+21) ││
│  └────────────┘  └────────────┘  └────────────┘  └─────────┘│
└──────────────────────────────────────────────────────────────┘
```

---

## Execution Principles

| Principle | Rule | Rationale |
|-----------|------|-----------|
| **1. Never break plugin** | Plugin must compile at all times | OpenCode won't load without it |
| **2. Test after each atomic change** | `npm run install:local` after each phase | Catches breaks immediately |
| **3. Deprecate before remove** | Add @deprecated JSDoc first | Gives consumers time to adapt |
| **4. Update references before removing sources** | Fix agents/commands first | Prevents dangling references |
| **5. Bottom-up for libs, top-down for consumers** | Change foundations first, consumers last | Respects dependency flow |
| **6. Atomic commits** | One logical change per commit | Easy rollback if needed |

---

## Phase 0: Pre-Flight Validation (GATE)

**Goal:** Verify current state compiles and installs before any changes

**Files Verified:**
- `src/plugins/idumb-core.ts` - Must compile
- `src/plugins/lib/*.ts` - All 12 lib files must import correctly
- `src/tools/*.ts` - All 12 tools must compile
- `bin/install.js` - Must run without errors

**Validation Commands:**
```bash
# 1. TypeScript compilation check
npx tsc --noEmit 2>&1 | head -50

# 2. Install to local .opencode/
npm run install:local

# 3. Verify all files copied
ls -la .opencode/tools/idumb-*.ts | wc -l  # Should show 12
ls -la .opencode/plugins/idumb-core.ts    # Must exist
ls -la .opencode/agents/idumb-*.md | wc -l # Should show 22

# 4. Check plugin loads (if opencode installed)
# opencode --check-plugins 2>&1 | grep idumb
```

**Rollback:** N/A - This is read-only validation

**Dependencies:** None - This is the first gate

**Success Criteria:**
- [ ] TypeScript compiles without errors
- [ ] Install completes successfully
- [ ] All expected files present in .opencode/

---

## Phase 1: Plugin Lib Stabilization

**Goal:** Ensure plugin lib is robust before any tool changes

### Wave 1.1: Add missing type exports

**Files Modified:**
- `src/plugins/lib/types.ts` - Add any missing interfaces
- `src/plugins/lib/index.ts` - Verify all re-exports complete

**Validation:**
```bash
# Check types.ts exports
grep "^export" src/plugins/lib/types.ts | wc -l

# Verify index re-exports all
grep "export \* from" src/plugins/lib/index.ts
```

**Rollback:**
```bash
git checkout src/plugins/lib/types.ts src/plugins/lib/index.ts
npm run install:local
```

**Dependencies:** Phase 0 passed

### Wave 1.2: Document lib module boundaries

**Files Modified:**
- `src/plugins/lib/README.md` (NEW) - Document each module's purpose

**Validation:**
```bash
# File should exist and have content
wc -l src/plugins/lib/README.md
```

**Rollback:**
```bash
rm src/plugins/lib/README.md
```

**Dependencies:** Wave 1.1 complete

---

## Phase 2: Tool Consolidation Preparation

**Goal:** Mark orphaned tools for deprecation without removing

### Wave 2.1: Add deprecation notices to orphaned tools

**Files Modified (add @deprecated JSDoc):**
- `src/tools/idumb-quality.ts` - Merge candidate → validate
- `src/tools/idumb-orchestrator.ts` - Merge candidate → state
- `src/tools/idumb-style.ts` - Removal candidate

**Changes:**
```typescript
/**
 * @deprecated This tool will be merged into idumb-validate in Phase 3.
 * Functionality will be preserved under idumb-validate.checkQuality()
 */
```

**Validation:**
```bash
# Check deprecation notices added
grep -l "@deprecated" src/tools/idumb-*.ts

# Must still compile
npx tsc --noEmit
```

**Rollback:**
```bash
git checkout src/tools/idumb-quality.ts src/tools/idumb-orchestrator.ts src/tools/idumb-style.ts
```

**Dependencies:** Phase 1 complete

### Wave 2.2: Document target consolidation structure

**Files Modified:**
- `.plugin-dev/RESTRUCTURE-PLAN-2026-02-05/05-TOOL-CONSOLIDATION-MAP.md` (NEW)

**Content:** Maps which functions move where

**Validation:**
```bash
# Document exists with mapping
grep -c "→" .plugin-dev/RESTRUCTURE-PLAN-2026-02-05/05-TOOL-CONSOLIDATION-MAP.md
```

**Rollback:**
```bash
rm .plugin-dev/RESTRUCTURE-PLAN-2026-02-05/05-TOOL-CONSOLIDATION-MAP.md
```

**Dependencies:** Wave 2.1 complete

---

## Phase 3: Consumer Reference Updates

**Goal:** Update agents/commands to reference correct tools BEFORE any tool removals

### Wave 3.1: Audit all agent tool references

**Files Checked (READ-ONLY analysis):**
- All `src/agents/idumb-*.md` (22 files)
- Check frontmatter `tools:` sections

**Output:**
- `.plugin-dev/RESTRUCTURE-PLAN-2026-02-05/06-REFERENCE-AUDIT.md`

**Validation:**
```bash
# Count tools mentioned in agents
grep -h "idumb-" src/agents/idumb-*.md | grep -E "(tools:|idumb-[a-z]+)" | sort | uniq -c
```

**Rollback:** N/A - Read-only analysis

**Dependencies:** Phase 2 complete

### Wave 3.2: Update agent frontmatter (orphaned tool references)

**Files Modified:**
- Agents referencing deprecated tools need updates
- Remove `idumb-style` from any agent references (currently 0)
- Update `idumb-quality` refs to `idumb-validate.checkQuality`

**Validation:**
```bash
# No references to deprecated tools
grep -l "idumb-style" src/agents/idumb-*.md  # Should be empty
grep -l "idumb-quality" src/agents/idumb-*.md | wc -l  # Track count

# Install and verify
npm run install:local
```

**Rollback:**
```bash
git checkout src/agents/
npm run install:local
```

**Dependencies:** Wave 3.1 complete

### Wave 3.3: Update command references

**Files Modified:**
- `src/commands/idumb/style.md` - Update or mark deprecated
- Any commands referencing deprecated tools

**Validation:**
```bash
# Commands should reference valid tools
grep -r "idumb-quality" src/commands/idumb/*.md
grep -r "idumb-orchestrator" src/commands/idumb/*.md

npm run install:local
```

**Rollback:**
```bash
git checkout src/commands/idumb/
npm run install:local
```

**Dependencies:** Wave 3.2 complete

---

## Phase 4: Tool Merger Execution

**Goal:** Consolidate orphaned tools into core tools

### Wave 4.1: Merge idumb-quality → idumb-validate

**Files Modified:**
- `src/tools/idumb-validate.ts` - Add quality check functions
- `src/tools/idumb-quality.ts` - Keep as deprecated wrapper (for transition)

**Changes:**
```typescript
// In idumb-validate.ts, add:
export const checkQuality = {
  // ... merged from idumb-quality.ts
}
```

**Validation:**
```bash
# Validate compiles
npx tsc --noEmit

# Install and test
npm run install:local

# Check both old and new exports work
grep "checkQuality" .opencode/tools/idumb-validate.ts
```

**Rollback:**
```bash
git checkout src/tools/idumb-validate.ts src/tools/idumb-quality.ts
npm run install:local
```

**Dependencies:** Phase 3 complete

### Wave 4.2: Merge idumb-orchestrator → idumb-state

**Files Modified:**
- `src/tools/idumb-state.ts` - Add orchestration functions
- `src/tools/idumb-orchestrator.ts` - Keep as deprecated wrapper

**Validation:**
```bash
npx tsc --noEmit
npm run install:local
```

**Rollback:**
```bash
git checkout src/tools/idumb-state.ts src/tools/idumb-orchestrator.ts
npm run install:local
```

**Dependencies:** Wave 4.1 complete

### Wave 4.3: Deprecate idumb-style

**Files Modified:**
- `src/tools/idumb-style.ts` - Full deprecation notice
- `src/commands/idumb/style.md` - Mark as deprecated
- `src/plugins/lib/styles.ts` - This stays (plugin uses it internally)

**Validation:**
```bash
# Tool marked deprecated
grep "@deprecated" src/tools/idumb-style.ts

# Plugin still works (styles.ts is lib, not tool)
npm run install:local
```

**Rollback:**
```bash
git checkout src/tools/idumb-style.ts src/commands/idumb/style.md
npm run install:local
```

**Dependencies:** Wave 4.2 complete

---

## Phase 5: Installer Update

**Goal:** Update installer to handle deprecated tools correctly

### Wave 5.1: Add deprecation handling to installer

**Files Modified:**
- `bin/install.js` - Add logic to optionally skip deprecated tools

**Validation:**
```bash
# Installer still works
npm run install:local

# Check deprecated tools NOT copied (if skip logic added)
# OR check they ARE copied with .deprecated suffix
ls -la .opencode/tools/idumb-*.ts
```

**Rollback:**
```bash
git checkout bin/install.js
npm run install:local
```

**Dependencies:** Phase 4 complete

### Wave 5.2: Update installer documentation

**Files Modified:**
- `README.md` or `INSTALLING.md` - Document deprecated tools

**Validation:**
```bash
# Doc updated
grep -i "deprecated" README.md
```

**Rollback:**
```bash
git checkout README.md
```

**Dependencies:** Wave 5.1 complete

---

## Phase 6: Skill Updates

**Goal:** Update skills to reference consolidated tools

### Wave 6.1: Update skill tool references

**Files Modified:**
- `src/skills/idumb-performance/SKILL.md` - References idumb-performance (KEEP)
- `src/skills/idumb-security/SKILL.md` - References idumb-security (KEEP)
- `src/skills/idumb-code-quality/SKILL.md` - Update to idumb-validate.checkQuality

**Validation:**
```bash
# Skill references updated
grep "idumb-validate" src/skills/idumb-code-quality/SKILL.md
npm run install:local
```

**Rollback:**
```bash
git checkout src/skills/
npm run install:local
```

**Dependencies:** Phase 5 complete

---

## Phase 7: Final Cleanup (AFTER 7-day deprecation period)

**Goal:** Remove deprecated code after consumers have adapted

**WARNING:** This phase should NOT be executed immediately. Wait 7 days minimum.

### Wave 7.1: Remove deprecated tool files

**Files Removed:**
- `src/tools/idumb-quality.ts` (merged into validate)
- `src/tools/idumb-orchestrator.ts` (merged into state)
- `src/tools/idumb-style.ts` (orphaned)
- `src/commands/idumb/style.md` (orphaned)

**Validation:**
```bash
# Files removed
ls src/tools/idumb-quality.ts 2>&1 | grep "No such file"
ls src/tools/idumb-orchestrator.ts 2>&1 | grep "No such file"

# Install still works
npm run install:local

# No broken imports
npx tsc --noEmit
```

**Rollback:**
```bash
# Restore from git
git checkout HEAD~1 -- src/tools/idumb-quality.ts src/tools/idumb-orchestrator.ts src/tools/idumb-style.ts src/commands/idumb/style.md
npm run install:local
```

**Dependencies:** 7-day grace period from Phase 6 completion

### Wave 7.2: Update tool count documentation

**Files Modified:**
- `AGENTS.md` - Update tool count (12 → 9)
- `.plugin-dev/RESTRUCTURE-PLAN-2026-02-05/01-ENTITY-MANIFEST.md` - Update

**Validation:**
```bash
grep "Tools.*|.*9" AGENTS.md
```

**Rollback:**
```bash
git checkout AGENTS.md
```

**Dependencies:** Wave 7.1 complete

---

## Execution Checklist

### Pre-Execution Gates

- [ ] **GATE 0:** Phase 0 validation passed
- [ ] **GATE 1:** All lib modules compile
- [ ] **GATE 2:** All tools compile
- [ ] **GATE 3:** Plugin loads in OpenCode
- [ ] **GATE 4:** `npm run install:local` succeeds

### Per-Phase Checklist

| Phase | Description | Gate | Status |
|-------|-------------|------|--------|
| 0 | Pre-flight validation | Compile + Install | ⬜ |
| 1 | Plugin lib stabilization | Lib compiles | ⬜ |
| 2 | Deprecation marking | Deprecations added | ⬜ |
| 3 | Consumer reference updates | No broken refs | ⬜ |
| 4 | Tool merger execution | Mergers compile | ⬜ |
| 5 | Installer updates | Install works | ⬜ |
| 6 | Skill updates | Skills valid | ⬜ |
| 7 | Final cleanup | Full compile + install | ⬜ |

### Rollback Triggers

Execute rollback if ANY of these occur:

1. **TypeScript compilation fails** → Rollback immediately
2. **`npm run install:local` fails** → Rollback phase
3. **Plugin fails to load** → Rollback to last working commit
4. **Agent references broken** → Rollback consumer updates
5. **Tool function missing after merge** → Rollback merger

### Emergency Rollback Command

```bash
# Nuclear option: Reset to pre-restructure state
git checkout main -- src/tools/ src/plugins/ src/agents/ src/commands/ bin/
npm run install:local
```

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Plugin breaks during lib changes | LOW | CRITICAL | Test after every lib change |
| Tool merger loses functionality | MEDIUM | HIGH | Keep deprecated wrappers initially |
| Agent references break | MEDIUM | MEDIUM | Update refs before removing sources |
| Installer copies wrong files | LOW | MEDIUM | Test install after each phase |
| Skill-only tools orphaned further | HIGH | LOW | Document but don't remove |

---

## Summary: Safe Execution Order

```
Phase 0: PRE-FLIGHT VALIDATION (GATE)
    └── Must pass before any changes

Phase 1: PLUGIN LIB STABILIZATION
    ├── Wave 1.1: Type exports
    └── Wave 1.2: Documentation

Phase 2: DEPRECATION MARKING
    ├── Wave 2.1: Add @deprecated to orphans
    └── Wave 2.2: Document consolidation map

Phase 3: CONSUMER REFERENCE UPDATES
    ├── Wave 3.1: Audit agent refs (read-only)
    ├── Wave 3.2: Update agent frontmatter
    └── Wave 3.3: Update command refs

Phase 4: TOOL MERGER EXECUTION
    ├── Wave 4.1: quality → validate
    ├── Wave 4.2: orchestrator → state
    └── Wave 4.3: Deprecate style

Phase 5: INSTALLER UPDATE
    ├── Wave 5.1: Deprecation handling
    └── Wave 5.2: Documentation

Phase 6: SKILL UPDATES
    └── Wave 6.1: Update skill refs

--- 7 DAY GRACE PERIOD ---

Phase 7: FINAL CLEANUP
    ├── Wave 7.1: Remove deprecated files
    └── Wave 7.2: Update documentation
```

---

## Tool Status After Restructure

| Tool | Current Status | After Phase 6 | After Phase 7 |
|------|----------------|---------------|---------------|
| idumb-state | ✅ ACTIVE | ✅ + orchestrator | ✅ ENHANCED |
| idumb-todo | ✅ ACTIVE | ✅ ACTIVE | ✅ ACTIVE |
| idumb-config | ❌ ORPHANED | ⚠️ MONITOR | ⚠️ MONITOR |
| idumb-validate | ❌ ORPHANED | ✅ + quality | ✅ ENHANCED |
| idumb-context | ❌ ORPHANED | ⚠️ WIRE NEXT | ⚠️ WIRE NEXT |
| idumb-chunker | ❌ ORPHANED | ⚠️ MONITOR | ⚠️ MONITOR |
| idumb-manifest | ❌ ORPHANED | ⚠️ MONITOR | ⚠️ MONITOR |
| idumb-performance | ❌ SKILL-ONLY | ⚠️ SKILL-ONLY | ⚠️ SKILL-ONLY |
| idumb-security | ❌ SKILL-ONLY | ⚠️ SKILL-ONLY | ⚠️ SKILL-ONLY |
| idumb-quality | ❌ ORPHANED | 📦 DEPRECATED | ❌ REMOVED |
| idumb-orchestrator | ❌ ORPHANED | 📦 DEPRECATED | ❌ REMOVED |
| idumb-style | ⚠️ PARTIAL | 📦 DEPRECATED | ❌ REMOVED |

**Final Count:** 12 → 9 tools (3 consolidated/removed)

---

*Document generated by @idumb-plan-checker for tools-restructure-planning phase*
*Source: 01-ENTITY-MANIFEST.md, 02-DEPENDENCY-GRAPH.md, idumb-core.ts analysis*
