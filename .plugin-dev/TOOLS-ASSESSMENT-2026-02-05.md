# iDumb Tools Assessment Report

**Date:** 2026-02-05  
**Scope:** All tools in `src/tools/` (12 tools + 3 lib modules)  
**Status:** Research Complete - Awaiting Approval for Gap-Filling Plan

---

## Executive Summary

### The Problem
**75% of iDumb tools are orphaned** - extensively declared in agent frontmatter but never actually executed. Only 3 of 12 tools (25%) show runtime evidence of usage.

### Root Cause
1. **Too many tools = LLM confusion** - Agents fall back to innate tools (read, write, grep)
2. **No hook-based activation** - Tools require explicit agent decision instead of automatic triggering
3. **Declaration ≠ Integration** - Tools in frontmatter aren't wired to plugin execution

### The Solution
Convert orphaned tools from "agent-callable" to "hook-triggered" - automatic activation based on conditions, not LLM decision.

---

## Part 1: Tool Inventory

### Full Tool Matrix

| Tool | Lines | Exports | Status | Agent Refs | Cmd Refs | Runtime Evidence |
|------|-------|---------|--------|------------|----------|------------------|
| **idumb-state** | 557 | 10 | ✅ ACTIVE | 18 | 8 | state.json updates, logs |
| **idumb-todo** | 385 | 6 | ✅ ACTIVE | 22 | 5 | todos.json exists |
| **idumb-style** | 196 | 4 | ⚠️ PARTIAL | 0 | 1 | styles/ dir exists |
| **idumb-config** | 1022 | 6 | ❌ ORPHANED | 5 | 5 | config from installer only |
| **idumb-validate** | 1043 | 7 | ❌ ORPHANED | 13 | 5 | no execution artifacts |
| **idumb-context** | 277 | 3 | ❌ ORPHANED | 18 | 4 | no execution evidence |
| **idumb-chunker** | 930 | 10 | ❌ ORPHANED | 16 | 1 | no execution evidence |
| **idumb-manifest** | 598 | 4 | ❌ ORPHANED | 5 | 1 | no execution evidence |
| **idumb-orchestrator** | 527 | 5 | ❌ ORPHANED | 4 | 0 | no execution evidence |
| **idumb-performance** | 533 | 3 | ❌ ORPHANED | 5 | 0 | no execution evidence |
| **idumb-quality** | 524 | 3 | ❌ ORPHANED | 5 | 0 | no execution evidence |
| **idumb-security** | 359 | 2 | ❌ ORPHANED | 5 | 0 | no execution evidence |

**Total:** 6,951 lines across 12 tools, **only 1,138 lines (16%) actively used**

### Library Modules

| Library | Lines | Purpose |
|---------|-------|---------|
| bash-executors.ts | 429 | Fast file ops via jq/yq/sed |
| hierarchy-parsers.ts | 567 | XML/YAML/JSON/MD parsing |
| index-manager.ts | 373 | Searchable hierarchical indexes |

---

## Part 2: What's Actually Used vs. Orphaned

### Tier 1: ACTIVE (25%)

#### idumb-state ✅
- **Why it works:** Plugin calls it directly (`governance-builder.ts`)
- **Evidence:** state.json with 6 anchors, 50+ history entries
- **Integration:** First-tool enforcement, compaction context

#### idumb-todo ✅
- **Why it works:** Most referenced tool (22 agents), first-tool required
- **Evidence:** todos.json with 13+ completed tasks
- **Integration:** Plugin enforces as context-first tool

#### idumb-style ⚠️
- **Why partial:** Just implemented, not in agent frontmatter yet
- **Evidence:** styles/ directory with 5 style files
- **Integration:** Works via plugin hook, not agent call

### Tier 2: ORPHANED BUT HIGH-VALUE (42%)

| Tool | Why Orphaned | Potential Value |
|------|--------------|-----------------|
| **idumb-validate** | No plugin invocation | HIGH - 7 validation functions |
| **idumb-config** | Config created by installer | MEDIUM - runtime updates |
| **idumb-context** | Never called despite 18 agent refs | HIGH - project detection |
| **idumb-chunker** | Complex, 10 exports overwhelm | HIGH - long doc handling |
| **idumb-manifest** | No drift detection wired | MEDIUM - change tracking |

### Tier 3: SKILL TOOLS NOT WIRED (33%)

| Tool | Purpose | Problem |
|------|---------|---------|
| **idumb-orchestrator** | Meta-orchestrator | Coordinates nothing |
| **idumb-performance** | Performance validation | No hook integration |
| **idumb-quality** | Code quality checks | No hook integration |
| **idumb-security** | Security scanning | No hook integration |

---

## Part 3: Design Quality Assessment

### Overall Score: 4.3/5.0

| Criterion | Score | Notes |
|-----------|-------|-------|
| Export Pattern | 5.0 | All use `tool()` wrapper correctly |
| Parameter Validation | 4.0 | Good Zod schemas, missing enums |
| Error Handling | 4.0 | Try/catch present, some empty blocks |
| Logging | 5.0 | Zero console.log (TUI safe) |
| Documentation | 4.0 | Module-level good, function-level sparse |
| TypeScript | 4.3 | Strong types, minor require() issues |

### Critical Issues

1. **`require("fs")` in 4 locations** - violates ES module pattern
   - `idumb-quality.ts:433`
   - `idumb-security.ts:268`
   - `lib/index-manager.ts:331,362`

2. **`idumb-style.ts` wrong default export**
   - Exports object `{ list, set, info, reset }` instead of single tool
   - May break OpenCode tool discovery

3. **TypeScript errors in idumb-chunker.ts**
   - Lines 780, 867, 893: Property access on `never` type
   - Pre-existing, not from recent changes

---

## Part 4: Overlap Analysis

### Detected Overlaps

| Area | Tools Involved | Conflict? |
|------|----------------|-----------|
| State management | idumb-state, idumb-config | NO - different scopes |
| Validation | idumb-validate, idumb-quality, idumb-security, idumb-performance | **YES - unclear boundaries** |
| Context | idumb-context, idumb-state | MINOR - context could use state |

### Validation Tool Confusion

```
idumb-validate      → structure, schema, freshness, integration
idumb-quality       → error handling, docs, cross-platform
idumb-security      → bash injection, path traversal
idumb-performance   → scanning, memory, iteration
idumb-orchestrator  → coordinates all above

Problem: 5 tools, 20+ exports, no clear entry point
LLM behavior: Ignores all, uses innate tools instead
```

---

## Part 5: Why Tools Go Unused

### The Core Problem

```
┌─────────────────────────────────────────────────────────┐
│  CURRENT: Tools require explicit LLM decision           │
│                                                         │
│  User prompt → LLM thinks → "should I use idumb-X?" →  │
│  → Too many options → Decision fatigue → Skip all →    │
│  → Falls back to read/grep/write                       │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  NEEDED: Hooks trigger tools automatically              │
│                                                         │
│  Hook fires → Condition matches → Tool runs →          │
│  → Result injected → LLM receives context →            │
│  → No decision needed                                  │
└─────────────────────────────────────────────────────────┘
```

### Evidence from idumb-style

The ONLY recently working new tool is `idumb-style`. Why?

**It doesn't rely on LLM calling it.** The plugin's `experimental.chat.system.transform` hook calls style functions automatically.

---

## Part 6: Gap-Filling Plan

### Philosophy: Reduce, Automate, Consolidate

| Principle | Action |
|-----------|--------|
| **Reduce** | Merge 5 validation tools into 1 unified entry point |
| **Automate** | Wire high-value tools to existing hooks |
| **Consolidate** | Remove agent frontmatter clutter, fewer choices = more use |

### Phase A: Hook-Based Automation (Minimal Effort, High Impact)

Wire 3 high-value tools into existing plugin hooks:

| Hook | Tool to Wire | Trigger Condition |
|------|--------------|-------------------|
| `session.created` | idumb-context | Always run, cache result |
| `tool.execute.before` (on file writes) | idumb-validate | Before any write operation |
| `experimental.session.compacting` | idumb-state_getAnchors | Already done |

**Code change:** ~50 lines in `idumb-core.ts`

### Phase B: Validation Consolidation (Medium Effort)

Merge fragmented validation into single entry:

```
BEFORE (5 tools, 20 exports):
  idumb-validate (7)
  idumb-quality (3)
  idumb-security (2)
  idumb-performance (3)
  idumb-orchestrator (5)

AFTER (1 tool, 3 exports):
  idumb-check
    ├── quick   (fast, non-blocking)
    ├── full    (comprehensive)
    └── report  (generate validation report)
```

**Benefits:**
- Single entry point reduces LLM decision fatigue
- Hook can call `quick` automatically, `full` on user request
- Individual checks become internal implementation

### Phase C: Agent Frontmatter Cleanup (Low Effort)

Remove unused tool references from agent frontmatter:

| Agent | Current Tools | After Cleanup |
|-------|---------------|---------------|
| All coordinators | 30+ tool refs | 5-8 essential tools |
| All validators | 20+ tool refs | 3-5 validation tools |
| Builder | 25+ tool refs | 8-10 execution tools |

**Why:** Fewer declared tools = less prompt token waste, clearer agent scope

### Phase D: Deprecation (Optional)

Consider deprecating truly unused tools:

| Candidate | Lines | Reason |
|-----------|-------|--------|
| idumb-manifest | 598 | Drift detection unused, git does this natively |
| idumb-orchestrator | 527 | Coordination can be inline in hooks |
| lib/bash-executors | 429 | jq/yq rarely available in target environments |

**Before deprecating:** Verify no command/workflow depends on them

---

## Part 7: "I Can Do This Much Better" Analysis

### What I See Looking Across

| Observation | Current State | Better Approach |
|-------------|---------------|-----------------|
| **Vertical:** 12 tools, 8 orphaned | Complexity without value | 4-5 focused tools with hook automation |
| **Horizontal:** Same patterns repeated | Each tool has ~100 lines of boilerplate | Shared validation framework |
| **Exposure:** 116 tool refs across agents | LLM overwhelmed | Fewer refs, auto-activated |
| **Integration:** Tool → Agent → Execution | Agent must decide | Hook → Tool → Injection |

### The Real Problem

The framework has **too many entities**:
- 23 agents
- 19 commands
- 12 tools (with 50+ exports)
- 10+ skills

**This is an agentic framework anti-pattern.** LLMs perform WORSE with more choices.

### Recommended Posture

```
MINIMIZE exposed tools → MAXIMIZE hook automation

Goal: LLM sees 3-5 essential tools
Reality: Everything else runs via hooks without LLM decision
```

---

## Part 8: Summary of Proposed Changes

### Quick Wins (Ready to Implement)

| Change | Files | Lines | Impact |
|--------|-------|-------|--------|
| Fix require() → import | 4 files | ~10 | TypeScript compliance |
| Fix idumb-style default export | 1 file | ~5 | Tool discovery |
| Wire idumb-context to session.created | 1 file | ~20 | Auto project detection |

### Medium Term (Needs Design)

| Change | Effort | Impact |
|--------|--------|--------|
| Merge validation tools into idumb-check | 2-3 hours | Reduce tool count by 4 |
| Clean agent frontmatter | 1-2 hours | Reduce token waste |
| Add pre-write validation hook | 1 hour | Automatic safety |

### Awaiting Approval

Before proceeding:
1. Do you want Phase A (hook automation) implemented?
2. Do you want Phase B (validation consolidation)?
3. Should I clean agent frontmatter (Phase C)?
4. Any tools you want explicitly kept despite low usage?

---

## Appendix: Research Sources

- 4 parallel research agents
- Files analyzed: 15 tools + 23 agents + 19 commands + 9 workflows
- Total lines reviewed: ~15,000
- Execution evidence from: `.idumb/`, plugin logs, git history

---

*Report generated by @idumb-supreme-coordinator research synthesis*
