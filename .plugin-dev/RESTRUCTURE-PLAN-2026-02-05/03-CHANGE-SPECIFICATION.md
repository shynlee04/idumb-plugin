# iDumb Tools Restructure: Change Specification

**Generated:** 2026-02-05  
**Phase:** tools-restructure-planning  
**Author:** @idumb-planner  
**Status:** PROPOSAL (awaiting decision)

---

## Executive Summary

| Metric | Option A | Option B | Option C |
|--------|----------|----------|----------|
| Files Modified | 23 | 42 | 67 |
| Lines Changed (est.) | ~500 | ~2,100 | ~4,800 |
| Breaking Changes | 0 | 2 (soft) | 7 (hard) |
| Risk Level | LOW | MEDIUM | HIGH |
| Effort (Claude-hours) | 2-3 | 6-8 | 12-16 |
| Maintenance Burden After | HIGH | LOW | LOWEST |

**Recommendation:** Option B (Hook-First Migration) - balances risk with sustainable architecture.

---

## Current State Summary

### Tools by Category

| Status | Tools | Lines | % of Total |
|--------|-------|-------|------------|
| ✅ ACTIVE | idumb-state, idumb-todo | 940 | 13.5% |
| ⚠️ PARTIAL | idumb-style | 195 | 2.8% |
| ❌ ORPHANED | 9 tools | 5,804 | 83.7% |
| **TOTAL** | **12** | **6,939** | **100%** |

### Critical Dependencies (Cannot Break)

```
idumb-state  → 22 agents, 16 commands, 7 workflows (CATASTROPHIC if broken)
idumb-validate → 12 agents, 6 commands (SEVERE if broken)
idumb-config → 3 agents, 6 commands (HIGH if broken)
```

---

## Option A: Minimal Changes (Frontmatter Fix Only)

### Philosophy
Keep all 12 tools as-is. Only update agent/command frontmatter to declare correct tool dependencies.

### Files to Modify

#### Agents (22 files)

| File | Change | Lines |
|------|--------|-------|
| `src/agents/idumb-builder.md` | Add `tools: [idumb-state, idumb-todo, idumb-chunker]` to frontmatter | +3 |
| `src/agents/idumb-codebase-mapper.md` | Add `tools: [idumb-context, idumb-chunker]` | +3 |
| `src/agents/idumb-debugger.md` | Add `tools: [idumb-state, idumb-context]` | +3 |
| `src/agents/idumb-high-governance.md` | Add `tools: [idumb-state, idumb-config, idumb-validate]` | +3 |
| `src/agents/idumb-integration-checker.md` | Add `tools: [idumb-validate, idumb-manifest]` | +3 |
| `src/agents/idumb-low-validator.md` | Add `tools: [idumb-validate, idumb-chunker]` | +3 |
| `src/agents/idumb-meta-builder.md` | Add `tools: [idumb-state, idumb-orchestrator, idumb-performance, idumb-security, idumb-quality]` | +5 |
| `src/agents/idumb-meta-validator.md` | Add `tools: [idumb-validate, idumb-orchestrator]` | +3 |
| `src/agents/idumb-mid-coordinator.md` | Add `tools: [idumb-state, idumb-config, idumb-manifest]` | +3 |
| `src/agents/idumb-phase-researcher.md` | Add `tools: [idumb-context, idumb-chunker]` | +3 |
| `src/agents/idumb-plan-checker.md` | Add `tools: [idumb-validate, idumb-context]` | +3 |
| `src/agents/idumb-planner.md` | Add `tools: [idumb-state, idumb-context]` | +3 |
| `src/agents/idumb-project-coordinator.md` | Add `tools: [idumb-todo]` | +2 |
| `src/agents/idumb-project-executor.md` | Add `tools: [idumb-state, idumb-todo]` | +3 |
| `src/agents/idumb-project-explorer.md` | Add `tools: [idumb-context, idumb-chunker]` | +3 |
| `src/agents/idumb-project-researcher.md` | Add `tools: [idumb-context, idumb-chunker]` | +3 |
| `src/agents/idumb-project-validator.md` | Add `tools: [idumb-validate]` | +2 |
| `src/agents/idumb-research-synthesizer.md` | Add `tools: [idumb-context, idumb-chunker]` | +3 |
| `src/agents/idumb-roadmapper.md` | Add `tools: [idumb-state, idumb-context]` | +3 |
| `src/agents/idumb-skeptic-validator.md` | Add `tools: [idumb-validate, idumb-context]` | +3 |
| `src/agents/idumb-supreme-coordinator.md` | Add `tools: [idumb-state, idumb-config, idumb-manifest]` | +3 |
| `src/agents/idumb-verifier.md` | Add `tools: [idumb-validate, idumb-context]` | +3 |

**Subtotal:** 22 files, ~68 lines added

#### Commands (1 file)

| File | Change | Lines |
|------|--------|-------|
| `src/commands/idumb/style.md` | Verify frontmatter tools declaration | +0 (already correct) |

**Subtotal:** 1 file, 0 lines changed

### No Tool Changes Required

All tools remain exactly as-is.

### Pros
- **Zero risk of breaking runtime behavior**
- **Fast implementation** (2-3 hours)
- **No migration period needed**
- **Fully reversible** - just remove frontmatter entries

### Cons
- **Does not address LLM decision fatigue** - 50+ exports still visible
- **Orphaned tools remain dead code** - 5,804 lines of unused code
- **No hook integration** - tools still require manual invocation
- **Technical debt compounds** - problem persists

### Breaking Changes
None.

### Migration Notes
No migration required. Simply update frontmatter.

---

## Option B: Hook-First Migration (RECOMMENDED)

### Philosophy
Move orphaned tool logic into hook-triggered lib functions. Tools become thin wrappers or are deprecated with backwards-compatible shims.

### Architecture

```
BEFORE:
  Agent → manually calls → idumb-validate tool → runs validation

AFTER:
  Agent → triggers hook → plugin lib → runs validation automatically
  Agent → (optional) calls → idumb-validate shim → delegates to lib
```

### Phase 1: Create New Lib Modules (NEW FILES)

| File | Purpose | Lines (est.) |
|------|---------|--------------|
| `src/plugins/lib/validation.ts` | Consolidate validate + quality logic | ~400 |
| `src/plugins/lib/context-detector.ts` | Move context detection from idumb-context | ~150 |
| `src/plugins/lib/security-scanner.ts` | Move security checks from idumb-security | ~200 |
| `src/plugins/lib/performance-monitor.ts` | Move performance checks from idumb-performance | ~180 |

**Subtotal:** 4 new files, ~930 lines

### Phase 2: Wire Hooks in Plugin Core

| File | Change | Lines |
|------|--------|-------|
| `src/plugins/idumb-core.ts` | Add hook integrations for validation, context, security | +120 |
| `src/plugins/lib/index.ts` | Export new lib modules | +8 |

**Hook Integration Points:**

```typescript
// session.created → context detection
hooks.subscribe("session.created", async ({ client }) => {
  const context = detectProjectContext(process.cwd());
  await client.app.log({ level: "info", message: `Detected: ${context.type}` });
});

// tool.pre → validation before writes
hooks.subscribe("tool.pre", async ({ tool, input }) => {
  if (tool === "write" || tool === "edit") {
    const result = await validatePreWrite(input.path, input.content);
    if (!result.valid) {
      return { blocked: true, reason: result.errors };
    }
  }
});

// session.idle → performance monitoring
hooks.subscribe("session.idle", async () => {
  const metrics = await monitorResourceUsage();
  if (metrics.concernLevel === "high") {
    await triggerCleanupSuggestion();
  }
});
```

**Subtotal:** 2 files, ~128 lines

### Phase 3: Convert Orphaned Tools to Shims

| Tool | Action | Lines Changed |
|------|--------|---------------|
| `src/tools/idumb-validate.ts` | Replace body with lib delegation + deprecation notice | -900, +50 |
| `src/tools/idumb-context.ts` | Replace body with lib delegation + deprecation notice | -230, +40 |
| `src/tools/idumb-quality.ts` | ARCHIVE - merge into validation.ts | -523 (archived) |
| `src/tools/idumb-performance.ts` | Replace body with lib delegation + deprecation notice | -490, +40 |
| `src/tools/idumb-security.ts` | Replace body with lib delegation + deprecation notice | -320, +40 |
| `src/tools/idumb-orchestrator.ts` | ARCHIVE - merge into plugin hooks | -526 (archived) |

**Shim Pattern:**

```typescript
// src/tools/idumb-validate.ts (AFTER)
import { tool } from "@opencode-ai/plugin"
import { runValidation, ValidationScope } from "../plugins/lib/validation"

export const validate = tool({
  description: "Run validation checks (DEPRECATED: use hooks instead)",
  schema: z.object({ scope: z.string().optional() }),
  execute: async ({ scope }) => {
    console.warn("[DEPRECATED] idumb-validate tool is deprecated. Validation now runs automatically via hooks.");
    return await runValidation(scope as ValidationScope);
  }
})
```

**Subtotal:** 6 tools, ~2,000 lines net reduction

### Phase 4: Update Agent Frontmatter

Same as Option A, but with reduced tool lists:

| File | Change | Lines |
|------|--------|-------|
| All 22 agents | Update `tools:` to remove deprecated tools, keep only active | ~0-3 per file |

**Subtotal:** 22 files, ~50 lines

### Phase 5: Archive Removed Code

| Destination | Files |
|-------------|-------|
| `archive/deprecated-tools-2026-02-05/` | idumb-quality.ts, idumb-orchestrator.ts |

### Total Changes Summary (Option B)

| Category | Files | Lines Added | Lines Removed | Net |
|----------|-------|-------------|---------------|-----|
| New lib modules | 4 | 930 | 0 | +930 |
| Plugin core updates | 2 | 128 | 0 | +128 |
| Tool shims | 4 | 170 | 1,940 | -1,770 |
| Tool archives | 2 | 0 | 1,049 | -1,049 |
| Agent frontmatter | 22 | 50 | 0 | +50 |
| **TOTAL** | **34** | **1,278** | **2,989** | **-1,711** |

### Pros
- **Automatic validation** - no manual tool calls needed
- **Reduces tool count** - from 12 to 7 active tools
- **Hook-driven architecture** - aligns with OpenCode design
- **Backwards compatible** - shims preserve old behavior during transition
- **Net code reduction** - ~1,700 lines removed

### Cons
- **Medium implementation effort** - 6-8 hours
- **Requires testing hook integration** - new complexity
- **Transition period** - deprecation warnings for 1-2 releases

### Breaking Changes

1. **Soft Break:** Direct `idumb-validate` calls work but emit deprecation warning
2. **Soft Break:** Direct `idumb-context` calls work but emit deprecation warning

### Migration Notes

```markdown
## Migration Guide: Option B

### For Agent Authors
- Remove explicit `idumb-validate` tool calls from agent logic
- Validation now runs automatically on pre-write hooks
- Context detection happens automatically on session start

### For Command Authors  
- Update frontmatter `tools:` to remove deprecated tools
- Commands using idumb-quality should use idumb-validate instead

### Deprecation Timeline
- v0.3.0: Deprecation warnings added to shim tools
- v0.4.0: Shim tools removed (3 months notice)
```

---

## Option C: Aggressive Consolidation

### Philosophy
Maximum consolidation. Merge tools by domain. Archive everything not strictly necessary.

### Target Architecture

| New Tool | Absorbs | Exports |
|----------|---------|---------|
| **idumb-check** | idumb-validate + idumb-quality + idumb-performance + idumb-security | 8 |
| **idumb-context** | idumb-context + idumb-chunker (partial) | 4 |
| **idumb-state** | idumb-state + idumb-orchestrator (state parts) | 12 |
| **idumb-config** | unchanged | 6 |
| **idumb-todo** | unchanged | 6 |
| **idumb-manifest** | unchanged | 4 |

**Removed entirely:** idumb-style, idumb-chunker (most functions)

### Phase 1: Create Merged Tools

#### idumb-check.ts (NEW - replaces 4 tools)

| File | Lines |
|------|-------|
| `src/tools/idumb-check.ts` | ~800 |

**Exports:**
```typescript
export const validate = tool({ ... })      // from idumb-validate
export const checkQuality = tool({ ... })  // from idumb-quality  
export const checkPerformance = tool({ ... }) // from idumb-performance
export const checkSecurity = tool({ ... }) // from idumb-security
export const runAllChecks = tool({ ... })  // NEW: orchestrated check
export const preWriteGate = tool({ ... })  // from idumb-orchestrator
```

#### Modified idumb-context.ts (absorbs chunker)

| File | Lines |
|------|-------|
| `src/tools/idumb-context.ts` | ~450 (from 276 + selective chunker) |

**Exports:**
```typescript
export const analyze = tool({ ... })       // existing
export const summary = tool({ ... })       // existing
export const patterns = tool({ ... })      // existing
export const readChunked = tool({ ... })   // from idumb-chunker.read
```

#### Modified idumb-state.ts (absorbs orchestrator)

| File | Lines |
|------|-------|
| `src/tools/idumb-state.ts` | ~720 (from 556 + orchestrator parts) |

**New Exports:**
```typescript
export const orchestrate = tool({ ... })   // from idumb-orchestrator
export const phaseTransition = tool({ ... }) // from idumb-orchestrator
```

### Phase 2: Archive Removed Tools

| Archived | Reason |
|----------|--------|
| `idumb-validate.ts` | Merged into idumb-check |
| `idumb-quality.ts` | Merged into idumb-check |
| `idumb-performance.ts` | Merged into idumb-check |
| `idumb-security.ts` | Merged into idumb-check |
| `idumb-orchestrator.ts` | Split between idumb-state and idumb-check |
| `idumb-chunker.ts` | Partial merge into idumb-context, rest archived |
| `idumb-style.ts` | Archived (no agent usage) |

**Archive location:** `archive/consolidated-tools-2026-02-05/`

### Phase 3: Update All Consumers

#### Agents (22 files)

Every agent file requires:
1. Update frontmatter `tools:` section
2. Update body references from old tool names to new
3. Update example invocations in documentation

**Example transformation:**

```markdown
<!-- BEFORE -->
Use `idumb-validate` to check structure integrity.
Then use `idumb-quality` for code quality.

<!-- AFTER -->  
Use `idumb-check_validate` for structure integrity.
Then use `idumb-check_checkQuality` for code quality.
```

**Estimated changes per agent:** 15-30 lines

#### Commands (5 files affected)

| File | Change |
|------|--------|
| `src/commands/idumb/validate.md` | Update tool references to idumb-check |
| `src/commands/idumb/health-check.md` | Update tool references to idumb-check |
| `src/commands/idumb/style.md` | REMOVE command (tool archived) |
| `src/commands/idumb/research.md` | Update idumb-context references |
| `src/commands/idumb/help.md` | Update tool documentation |

#### Workflows (3 files affected)

| File | Change |
|------|--------|
| `src/workflows/verify-phase.md` | Update validate → check references |
| `src/workflows/continuous-validation.md` | Update validate → check references |
| `src/workflows/stress-test.md` | Update tool references |

#### Skills (6 files affected)

| File | Change |
|------|--------|
| `src/skills/idumb-validation/SKILL.md` | Update to reference idumb-check |
| `src/skills/idumb-security/SKILL.md` | Update to reference idumb-check |
| `src/skills/idumb-performance/SKILL.md` | Update to reference idumb-check |
| `src/skills/idumb-code-quality/SKILL.md` | Update to reference idumb-check |
| `src/skills/idumb-project-validation/SKILL.md` | Update tool references |
| `src/skills/idumb-meta-orchestrator/SKILL.md` | Update orchestrator references |

### Phase 4: Update Lib Modules

| File | Change |
|------|--------|
| `src/tools/lib/hierarchy-parsers.ts` | Move to `src/plugins/lib/` |
| `src/tools/lib/index-manager.ts` | Move to `src/plugins/lib/` |
| `src/tools/lib/bash-executors.ts` | Move to `src/plugins/lib/` |

### Total Changes Summary (Option C)

| Category | Files | Lines Added | Lines Removed | Net |
|----------|-------|-------------|---------------|-----|
| New merged tools | 1 | 800 | 0 | +800 |
| Modified tools | 2 | 394 | 0 | +394 |
| Archived tools | 7 | 0 | 3,685 | -3,685 |
| Agent updates | 22 | 440 | 330 | +110 |
| Command updates | 5 | 50 | 169 | -119 |
| Workflow updates | 3 | 30 | 45 | -15 |
| Skill updates | 6 | 90 | 120 | -30 |
| Lib migrations | 3 | 0 | 0 | 0 |
| **TOTAL** | **49** | **1,804** | **4,349** | **-2,545** |

### Pros
- **Maximum code reduction** - ~2,500 lines removed
- **Simplified mental model** - 6 tools instead of 12
- **Unified check interface** - single entry point for all validation
- **Cleanest long-term architecture**

### Cons
- **High risk** - many breaking changes
- **Long implementation** - 12-16 hours
- **Extensive testing required** - all paths affected
- **No backwards compatibility** - hard break for existing users
- **Skill updates required** - external documentation affected

### Breaking Changes

1. **Hard Break:** `idumb-validate` tool removed (use `idumb-check_validate`)
2. **Hard Break:** `idumb-quality` tool removed (use `idumb-check_checkQuality`)
3. **Hard Break:** `idumb-performance` tool removed (use `idumb-check_checkPerformance`)
4. **Hard Break:** `idumb-security` tool removed (use `idumb-check_checkSecurity`)
5. **Hard Break:** `idumb-orchestrator` tool removed (split into idumb-check + idumb-state)
6. **Hard Break:** `idumb-chunker` tool removed (partial merge into idumb-context)
7. **Hard Break:** `idumb-style` tool removed (archived)

### Migration Notes

```markdown
## Migration Guide: Option C

### Tool Rename Mapping

| Old Tool | New Location |
|----------|--------------|
| idumb-validate.* | idumb-check_validate, idumb-check_* |
| idumb-quality.* | idumb-check_checkQuality |
| idumb-performance.* | idumb-check_checkPerformance |
| idumb-security.* | idumb-check_checkSecurity |
| idumb-orchestrator.orchestrate | idumb-state_orchestrate |
| idumb-orchestrator.preWrite | idumb-check_preWriteGate |
| idumb-chunker.read | idumb-context_readChunked |
| idumb-chunker.* (other) | REMOVED - use native file ops |
| idumb-style.* | REMOVED |

### Search & Replace Commands

```bash
# For agents
find src/agents -name "*.md" -exec sed -i '' 's/idumb-validate/idumb-check_validate/g' {} \;
find src/agents -name "*.md" -exec sed -i '' 's/idumb-quality/idumb-check_checkQuality/g' {} \;
find src/agents -name "*.md" -exec sed -i '' 's/idumb-performance/idumb-check_checkPerformance/g' {} \;
find src/agents -name "*.md" -exec sed -i '' 's/idumb-security/idumb-check_checkSecurity/g' {} \;
```

### Version Bump
This requires a MAJOR version bump (0.2.0 → 1.0.0) due to breaking changes.
```

---

## Comparison Matrix

| Criterion | Option A | Option B | Option C |
|-----------|----------|----------|----------|
| **Implementation Time** | 2-3 hrs | 6-8 hrs | 12-16 hrs |
| **Risk Level** | LOW | MEDIUM | HIGH |
| **Breaking Changes** | 0 | 2 (soft) | 7 (hard) |
| **Code Reduction** | 0 lines | ~1,700 lines | ~2,500 lines |
| **Tool Count After** | 12 | 7 | 6 |
| **LLM Decision Fatigue** | UNCHANGED | REDUCED | MINIMAL |
| **Hook Integration** | NONE | YES | PARTIAL |
| **Backwards Compatible** | YES | YES (with warnings) | NO |
| **Version Bump Required** | PATCH | MINOR | MAJOR |
| **Maintenance Burden** | HIGH | LOW | LOWEST |
| **Testing Effort** | MINIMAL | MODERATE | EXTENSIVE |
| **Reversibility** | EASY | MODERATE | HARD |

---

## Recommendation: Option B (Hook-First Migration)

### Rationale

1. **Right balance of risk/reward**
   - 1,700 lines removed without breaking existing workflows
   - Hook integration aligns with OpenCode architecture
   - Deprecation warnings give users time to adapt

2. **Addresses root cause**
   - LLM decision fatigue reduced (7 tools vs 12)
   - Automatic validation via hooks (no manual calls needed)
   - Orphaned code archived, not deleted (reversible)

3. **Sustainable path forward**
   - Can evolve to Option C later if needed
   - Establishes lib-based architecture pattern
   - Backwards compatible during transition

4. **Evidence from dependency analysis**
   - 75% of tools are orphaned → need cleanup
   - Skill-only tools (performance, security) → perfect for hook integration
   - Only 3 tools truly critical (state, validate, config)

### Implementation Order

```
Wave 1 (2 hrs): Create lib modules
  → src/plugins/lib/validation.ts
  → src/plugins/lib/context-detector.ts
  
Wave 2 (2 hrs): Wire hooks
  → src/plugins/idumb-core.ts (hook integrations)
  → src/plugins/lib/index.ts (exports)

Wave 3 (2 hrs): Convert tools to shims
  → idumb-validate.ts (shim)
  → idumb-context.ts (shim)
  → Archive idumb-quality.ts, idumb-orchestrator.ts

Wave 4 (2 hrs): Update consumers + testing
  → Agent frontmatter updates
  → Integration testing
  → Documentation updates
```

### Risk Mitigation

1. **Before starting:** Create git branch + full backup
2. **Each wave:** Run installer + verify tool registration
3. **After Wave 2:** Test hooks with sample session
4. **After Wave 3:** Verify deprecation warnings appear
5. **After Wave 4:** Full stress-test workflow

---

## Decision Required

☐ **Option A:** Minimal changes (frontmatter only)  
☐ **Option B:** Hook-first migration (RECOMMENDED)  
☐ **Option C:** Aggressive consolidation  

**To proceed:** User selects option, then `/idumb:plan-phase tools-restructure-implementation` creates executable plans.

---

## Appendix: File Impact Summary

### Files Modified (Option B Detail)

```
NEW FILES:
  src/plugins/lib/validation.ts         (~400 lines)
  src/plugins/lib/context-detector.ts   (~150 lines)
  src/plugins/lib/security-scanner.ts   (~200 lines)
  src/plugins/lib/performance-monitor.ts (~180 lines)

MODIFIED FILES:
  src/plugins/idumb-core.ts             (+120 lines)
  src/plugins/lib/index.ts              (+8 lines)
  src/tools/idumb-validate.ts           (-900, +50 = shim)
  src/tools/idumb-context.ts            (-230, +40 = shim)
  src/tools/idumb-performance.ts        (-490, +40 = shim)
  src/tools/idumb-security.ts           (-320, +40 = shim)
  src/agents/*.md                       (~50 lines total)

ARCHIVED FILES:
  archive/deprecated-tools-2026-02-05/idumb-quality.ts      (523 lines)
  archive/deprecated-tools-2026-02-05/idumb-orchestrator.ts (526 lines)
```

---

*Document generated by @idumb-planner for tools-restructure-planning phase*
*Based on analysis from 01-ENTITY-MANIFEST.md and 02-DEPENDENCY-GRAPH.md*
