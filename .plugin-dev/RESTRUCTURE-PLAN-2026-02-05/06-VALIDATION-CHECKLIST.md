# iDumb Tools Restructure: Validation Checklist

**Generated:** 2026-02-05  
**Phase:** tools-restructure-planning  
**Document:** 06-VALIDATION-CHECKLIST.md  
**Author:** @idumb-verifier  
**Verification Method:** Goal-backward verification with four-level checks

---

## Executive Summary

This document defines the verification criteria to confirm the tools restructure (Option B: Hook-First Migration) has achieved its goals. The checklist uses goal-backward methodology: we start from what SHOULD exist after the restructure and verify it actually works.

| Category | Checkpoints | Critical | Non-Critical |
|----------|-------------|----------|--------------|
| Pre-Restructure Baseline | 7 | 4 | 3 |
| Per-Phase Validation | 28 (7 phases × 4 gates) | 14 | 14 |
| Post-Restructure Verification | 15 | 10 | 5 |
| **Total** | **50** | **28** | **22** |

**Success Threshold:** 28/28 critical checks must pass. Non-critical failures are documented but don't block.

---

## 1. Pre-Restructure Baseline [GATE 0]

**Purpose:** Document current state so we can measure improvement and detect regressions.

### 1.1 TypeScript Compilation Baseline

```bash
# Run this and save output
npx tsc --noEmit 2>&1 | tee .plugin-dev/RESTRUCTURE-PLAN-2026-02-05/.baseline-tsc.txt
```

**Current Baseline (2026-02-05):**

| File | Error Count | Error Type |
|------|-------------|------------|
| `src/tools/idumb-chunker.ts` | 8 | TS2339: Property not on 'never' |
| All other tools | 0 | - |
| **Total** | **8** | - |

- [ ] **CRITICAL:** Baseline TypeScript errors documented
  - Record: 8 errors in idumb-chunker.ts
  - Expected after restructure: ≤8 (same or fewer)

### 1.2 Tool Inventory Baseline

```bash
# Document current tool count and line counts
wc -l src/tools/*.ts | sort -n > .plugin-dev/RESTRUCTURE-PLAN-2026-02-05/.baseline-tools.txt
ls src/tools/idumb-*.ts | wc -l
```

**Current Baseline:**

| Metric | Value |
|--------|-------|
| Tool file count | 12 |
| Total tool lines | 6,939 |
| Active tools | 2 (idumb-state, idumb-todo) |
| Orphaned tools | 9 |
| Partial tools | 1 (idumb-style) |

- [ ] **CRITICAL:** Current tool count documented: **12 tools**
- [ ] **CRITICAL:** Current total lines documented: **6,939 lines**
- [ ] Current tool status matrix captured

### 1.3 Backup Verification

```bash
# Create and verify backup
BACKUP_DIR="$HOME/.idumb-backups/pre-restructure-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp -R .idumb "$BACKUP_DIR/idumb-brain-backup"
cp -R .opencode "$BACKUP_DIR/opencode-backup"

# Verify backup can be restored
TEST_DIR="/tmp/idumb-restore-test"
mkdir -p "$TEST_DIR"
cp -R "$BACKUP_DIR/idumb-brain-backup" "$TEST_DIR/idumb"
node -e "JSON.parse(require('fs').readFileSync('$TEST_DIR/idumb/idumb-brain/state.json'))"
rm -rf "$TEST_DIR"
echo "Backup verified at: $BACKUP_DIR"
```

- [ ] **CRITICAL:** Backup created at documented location
- [ ] **CRITICAL:** Backup verified restorable (JSON.parse succeeds)
- [ ] Backup manifest file created

### 1.4 Git Tag Checkpoint

```bash
git add -A
git commit -m "chore: checkpoint before tools-restructure" --allow-empty
git tag -a "pre-restructure-2026-02-05" -m "Safe restore point before tools restructure"
git tag -l | grep pre-restructure
```

- [ ] **CRITICAL:** Git tag `pre-restructure-2026-02-05` created
- [ ] Tag is reachable: `git log --oneline pre-restructure-2026-02-05 -1`

### 1.5 Reference Counts Baseline

```bash
# Document agent references to tools
grep -roh "idumb-[a-z_]*" src/agents/*.md | sort | uniq -c | sort -rn > .plugin-dev/RESTRUCTURE-PLAN-2026-02-05/.baseline-agent-refs.txt

# Document command references
grep -roh "idumb-[a-z_]*" src/commands/idumb/*.md | sort | uniq -c | sort -rn > .plugin-dev/RESTRUCTURE-PLAN-2026-02-05/.baseline-cmd-refs.txt

# Document skill references
grep -roh "idumb-[a-z_]*" src/skills/*/SKILL.md | sort | uniq -c | sort -rn > .plugin-dev/RESTRUCTURE-PLAN-2026-02-05/.baseline-skill-refs.txt
```

- [ ] Agent reference baseline captured
- [ ] Command reference baseline captured
- [ ] Skill reference baseline captured

---

## 2. Per-Phase Validation Gates

Each phase has 4 validation gates:
1. **Compilation Gate** - TypeScript compiles without new errors
2. **Runtime Test** - Specific tool invocation succeeds
3. **Integration Gate** - `npm run install:local` succeeds
4. **Reference Gate** - No broken imports/references

### Phase 0: Pre-Flight Validation

**Goal:** Verify current state compiles and installs before any changes

#### Compilation Gate
```bash
npx tsc --noEmit 2>&1 | grep -c "error TS"
# Expected: 8 (baseline)
```
- [ ] **CRITICAL:** TypeScript errors ≤ baseline (8)

#### Runtime Test
```bash
node -e "require('./src/tools/idumb-state.ts')" 2>&1 || echo "FAIL"
# Note: Will fail due to ESM/plugin imports - this is expected
# Alternative: Check syntax only
npx tsc --noEmit --skipLibCheck src/tools/idumb-state.ts
```
- [ ] Core tools syntax-valid (state, todo, config)

#### Integration Gate
```bash
npm run install:local 2>&1 | tail -5
ls -la .opencode/tools/idumb-*.ts | wc -l
# Expected: 12 tools installed
```
- [ ] **CRITICAL:** Install completes without errors
- [ ] **CRITICAL:** 12 tool files in .opencode/tools/

#### Reference Gate
```bash
ls .opencode/plugins/idumb-core.ts
ls .opencode/agents/idumb-*.md | wc -l
# Expected: 22 agents
```
- [ ] Plugin file exists
- [ ] 22 agent files installed

---

### Phase 1: Plugin Lib Stabilization

**Goal:** Ensure plugin lib is robust before any tool changes

#### Compilation Gate
```bash
npx tsc --noEmit src/plugins/lib/*.ts 2>&1 | grep -c "error" || echo 0
# Expected: 0
```
- [ ] **CRITICAL:** All lib modules compile

#### Runtime Test
```bash
# Verify all exports in index.ts
grep "export \* from" src/plugins/lib/index.ts | wc -l
# Expected: ≥10 re-exports
```
- [ ] Index re-exports complete

#### Integration Gate
```bash
# Plugin imports all libs successfully
grep -c "from './lib" src/plugins/idumb-core.ts
# Expected: ≥3 imports
```
- [ ] Plugin imports lib modules

#### Reference Gate
```bash
# README exists and documents modules
[ -f src/plugins/lib/README.md ] && echo "EXISTS" || echo "MISSING"
```
- [ ] Lib README.md created (Wave 1.2)

---

### Phase 2: Tool Consolidation Preparation

**Goal:** Mark orphaned tools for deprecation without removing

#### Compilation Gate
```bash
npx tsc --noEmit 2>&1 | grep -c "error TS"
# Expected: ≤8
```
- [ ] TypeScript errors ≤ baseline

#### Runtime Test
```bash
# Deprecation notices added
grep -l "@deprecated" src/tools/idumb-*.ts | wc -l
# Expected: ≥3 (quality, orchestrator, style)
```
- [ ] **CRITICAL:** Deprecation notices in ≥3 tools

#### Integration Gate
```bash
npm run install:local
ls .opencode/tools/idumb-*.ts | wc -l
# Expected: 12 (all still present)
```
- [ ] Install succeeds
- [ ] All 12 tools still present

#### Reference Gate
```bash
[ -f .plugin-dev/RESTRUCTURE-PLAN-2026-02-05/05-TOOL-CONSOLIDATION-MAP.md ] && echo "EXISTS" || echo "MISSING"
```
- [ ] Consolidation map document created (Wave 2.2)

---

### Phase 3: Consumer Reference Updates

**Goal:** Update agents/commands to reference correct tools BEFORE any tool removals

#### Compilation Gate
```bash
# YAML frontmatter valid in all agents
for f in src/agents/*.md; do
  head -50 "$f" | grep -E "^---$" | wc -l | grep -q "2" || echo "INVALID: $f"
done
```
- [ ] **CRITICAL:** All agent frontmatter valid YAML

#### Runtime Test
```bash
# Reference audit completed
[ -f .plugin-dev/RESTRUCTURE-PLAN-2026-02-05/06-REFERENCE-AUDIT.md ] && echo "EXISTS" || echo "MISSING"
```
- [ ] Reference audit document created (Wave 3.1)

#### Integration Gate
```bash
npm run install:local
ls .opencode/agents/idumb-*.md | wc -l
# Expected: 22
```
- [ ] Install succeeds
- [ ] 22 agent files installed

#### Reference Gate
```bash
# No references to deprecated tools in agents (after updates)
grep -c "idumb-style" src/agents/*.md | grep -v ":0$" | wc -l
# Expected: 0
```
- [ ] No references to idumb-style in agents

---

### Phase 4: Tool Merger Execution

**Goal:** Consolidate orphaned tools into core tools

#### Compilation Gate
```bash
npx tsc --noEmit 2>&1 | grep -c "error TS"
# Expected: ≤8
```
- [ ] **CRITICAL:** TypeScript errors ≤ baseline

#### Runtime Test
```bash
# idumb-validate has checkQuality export
grep -c "checkQuality" src/tools/idumb-validate.ts
# Expected: ≥1

# idumb-state has orchestrate functions
grep -c "orchestrate\|phaseTransition" src/tools/idumb-state.ts
# Expected: ≥1
```
- [ ] **CRITICAL:** idumb-validate includes quality checks
- [ ] **CRITICAL:** idumb-state includes orchestrator functions

#### Integration Gate
```bash
npm run install:local
grep "checkQuality" .opencode/tools/idumb-validate.ts
```
- [ ] **CRITICAL:** Install copies merged tools correctly

#### Reference Gate
```bash
# Deprecated tools still exist as shims
[ -f src/tools/idumb-quality.ts ] && echo "EXISTS as shim" || echo "REMOVED"
[ -f src/tools/idumb-orchestrator.ts ] && echo "EXISTS as shim" || echo "REMOVED"
```
- [ ] Deprecated tools retained as shims (backwards compat)

---

### Phase 5: Installer Update

**Goal:** Update installer to handle deprecated tools correctly

#### Compilation Gate
```bash
# Installer is JavaScript, check syntax
node --check bin/install.js 2>&1 || echo "SYNTAX ERROR"
```
- [ ] Installer syntax valid

#### Runtime Test
```bash
npm run install:local
echo "Exit code: $?"
```
- [ ] **CRITICAL:** Install exit code 0

#### Integration Gate
```bash
# Verify correct files copied
ls -la .opencode/tools/idumb-*.ts | wc -l
# Option B target: Still 12 (shims retained) or 9 (if shims skip logic added)
```
- [ ] Expected tool count in .opencode/

#### Reference Gate
```bash
# Documentation updated
grep -i "deprecated" README.md || echo "No deprecation docs"
```
- [ ] Deprecation documented in README

---

### Phase 6: Skill Updates

**Goal:** Update skills to reference consolidated tools

#### Compilation Gate
```bash
# Skills are markdown - validate structure
for skill in src/skills/*/SKILL.md; do
  [ -f "$skill" ] && echo "✓ $(dirname $skill | xargs basename)" || echo "✗ Missing"
done
```
- [ ] All 11 skills have SKILL.md

#### Runtime Test
```bash
# idumb-code-quality skill references idumb-validate
grep -c "idumb-validate" src/skills/idumb-code-quality/SKILL.md
# Expected: ≥1
```
- [ ] Skills reference correct (consolidated) tools

#### Integration Gate
```bash
npm run install:local
ls .opencode/skills/*/SKILL.md | wc -l
# Expected: ≥11
```
- [ ] Skills installed correctly

#### Reference Gate
```bash
# No orphan tool references in skills
for tool in idumb-quality idumb-orchestrator idumb-style; do
  count=$(grep -r "$tool" src/skills/*/SKILL.md 2>/dev/null | wc -l)
  [ "$count" -gt 0 ] && echo "⚠ $tool still referenced: $count times"
done
```
- [ ] No references to removed tools in skills

---

### Phase 7: Final Cleanup (After 7-Day Grace)

**Goal:** Remove deprecated code after consumers have adapted

**⚠️ WARNING: Do NOT execute Phase 7 until 7 days after Phase 6 completion**

#### Compilation Gate
```bash
npx tsc --noEmit 2>&1 | grep -c "error TS"
# Expected: ≤8 (ideally lower after chunker cleanup)
```
- [ ] **CRITICAL:** TypeScript compiles

#### Runtime Test
```bash
# Verify removed files are actually gone
[ ! -f src/tools/idumb-quality.ts ] && echo "REMOVED" || echo "STILL EXISTS"
[ ! -f src/tools/idumb-orchestrator.ts ] && echo "REMOVED" || echo "STILL EXISTS"
[ ! -f src/tools/idumb-style.ts ] && echo "REMOVED" || echo "STILL EXISTS"
```
- [ ] **CRITICAL:** Deprecated tools removed from src/

#### Integration Gate
```bash
npm run install:local
ls .opencode/tools/idumb-*.ts | wc -l
# Expected: 9 (final target)
```
- [ ] **CRITICAL:** Install completes with 9 tools

#### Reference Gate
```bash
# AGENTS.md updated with new tool count
grep -E "Tools.*\|.*9" AGENTS.md || echo "Needs update"
```
- [ ] Documentation reflects new tool count

---

## 3. Post-Restructure Verification

### 3.1 Tool Count Validation

**Target:** Reduce from 12 to 9 tools (Option B)

```bash
ls src/tools/idumb-*.ts | wc -l
# Expected: 9

ls .opencode/tools/idumb-*.ts | wc -l  
# Expected: 9
```

| Metric | Before | Target | Actual | Pass |
|--------|--------|--------|--------|------|
| src/ tools | 12 | 9 | ⬜ | ⬜ |
| .opencode/ tools | 12 | 9 | ⬜ | ⬜ |

- [ ] **CRITICAL:** Tool count reduced from 12 to 9

### 3.2 Active Tool Verification

All ACTIVE tools must still function:

```bash
# Test each active tool in OpenCode
```

| Tool | Command to Test | Expected Result | Pass |
|------|-----------------|-----------------|------|
| idumb-state | `/idumb:status` | Shows state | ⬜ |
| idumb-todo | `idumb-todo_list` | Lists todos | ⬜ |
| idumb-config | `idumb-config_read` | Returns config | ⬜ |
| idumb-validate | `idumb-validate_structure` | Validation report | ⬜ |
| idumb-context | `idumb-context_summary` | Context summary | ⬜ |
| idumb-chunker | `idumb-chunker_overview path="..."` | Document overview | ⬜ |
| idumb-manifest | `idumb-manifest_snapshot` | Creates snapshot | ⬜ |
| idumb-performance | `idumb-performance_monitor` | Resource report | ⬜ |
| idumb-security | `idumb-security_scan` | Security scan | ⬜ |

- [ ] **CRITICAL:** All 9 retained tools respond without errors

### 3.3 Agent Loading Verification

```bash
# Verify all agents load without YAML errors
for agent in .opencode/agents/idumb-*.md; do
  # Check frontmatter parseable
  head -50 "$agent" | python3 -c "import sys, yaml; yaml.safe_load(sys.stdin.read().split('---')[1])" 2>/dev/null
  [ $? -eq 0 ] && echo "✓ $(basename $agent)" || echo "✗ $(basename $agent)"
done
```

- [ ] **CRITICAL:** All 22 agents load without YAML errors

### 3.4 Command Execution Verification

```bash
# Test critical commands
```

| Command | Expected | Pass |
|---------|----------|------|
| `/idumb:status` | Shows governance state | ⬜ |
| `/idumb:validate` | Runs validation | ⬜ |
| `/idumb:health-check` | Health report | ⬜ |
| `/idumb:help` | Lists commands | ⬜ |
| `/idumb:config` | Shows config | ⬜ |

- [ ] **CRITICAL:** All 5 critical commands execute without error

### 3.5 Orphaned Reference Check

```bash
# Check for references to removed tools
REMOVED_TOOLS="idumb-quality idumb-orchestrator idumb-style"
for tool in $REMOVED_TOOLS; do
  count=$(grep -r "$tool" src/agents/*.md src/commands/idumb/*.md src/skills/*/SKILL.md 2>/dev/null | wc -l)
  [ "$count" -gt 0 ] && echo "⚠ ORPHAN: $tool referenced $count times" || echo "✓ $tool: no orphans"
done
```

- [ ] **CRITICAL:** No orphaned skill references

### 3.6 State Integrity Verification

```bash
# Verify state.json still works
node -e "JSON.parse(require('fs').readFileSync('.idumb/idumb-brain/state.json'))"
echo "Exit: $?"

# Anchor count preserved
ANCHOR_COUNT=$(grep -c '"anchor-' .idumb/idumb-brain/state.json)
echo "Anchors: $ANCHOR_COUNT"
# Expected: ≥8
```

- [ ] **CRITICAL:** state.json valid JSON
- [ ] **CRITICAL:** state.json read/write still works
- [ ] Anchor count ≥ baseline (8)

### 3.7 Plugin Hook Verification

```bash
# Plugin loads and hooks fire
grep -c "hooks.subscribe" src/plugins/idumb-core.ts
# Expected: ≥3 hooks

# Verify new hook integrations exist (Option B)
grep -c "session.created\|tool.pre\|session.idle" src/plugins/idumb-core.ts
```

- [ ] **CRITICAL:** Plugin hooks still fire
- [ ] New hooks added (validation, context detection)

### 3.8 Skill Reference Validation

```bash
# Count skill references to active tools
for tool in idumb-state idumb-validate idumb-config idumb-context idumb-chunker idumb-manifest idumb-performance idumb-security idumb-todo; do
  count=$(grep -r "$tool" src/skills/*/SKILL.md 2>/dev/null | wc -l)
  echo "$tool: $count refs"
done
```

- [ ] Skills reference only existing tools
- [ ] No references to removed tools

---

## 4. Success Metrics

### 4.1 Quantifiable Targets

| Metric | Before | Target | Acceptable Range | Weight |
|--------|--------|--------|------------------|--------|
| **Lines of code removed** | 6,939 | ~1,700 | ≥1,500 | HIGH |
| **Tool count** | 12 | 9 | 9 exactly | CRITICAL |
| **Agent frontmatter errors** | Unknown | 0 | 0 | CRITICAL |
| **TypeScript errors** | 8 | ≤8 | ≤10 | HIGH |
| **LLM tool exports** | ~50 | ~35 | ≤40 | MEDIUM |
| **Orphaned tool percentage** | 75% | 0% | ≤10% | HIGH |
| **Active tool coverage** | 16.7% | 100% | ≥90% | HIGH |
| **Breaking changes** | 0 | 2 (soft) | ≤3 (soft) | MEDIUM |

### 4.2 Code Reduction Metrics

```bash
# Calculate lines removed
BEFORE=6939
AFTER=$(wc -l src/tools/*.ts | tail -1 | awk '{print $1}')
REMOVED=$((BEFORE - AFTER))
echo "Lines removed: $REMOVED"
echo "Reduction: $(( (REMOVED * 100) / BEFORE ))%"
```

| Category | Expected Removal |
|----------|-----------------|
| idumb-quality.ts | 523 lines |
| idumb-orchestrator.ts | 526 lines |
| idumb-style.ts | 195 lines |
| Tool shim reductions | ~500 lines |
| **Total** | **~1,744 lines** |

- [ ] Lines removed ≥ 1,500
- [ ] Tool files reduced by 3

### 4.3 Tool Consolidation Metrics

**Before:**
```
idumb-state:        557 lines (ACTIVE)
idumb-todo:         385 lines (ACTIVE)
idumb-style:        196 lines (PARTIAL → REMOVE)
idumb-config:     1,022 lines (ORPHANED → MONITOR)
idumb-validate:   1,043 lines (ORPHANED → ENHANCED)
idumb-context:      277 lines (ORPHANED → SHIM)
idumb-chunker:      930 lines (ORPHANED → MONITOR)
idumb-manifest:     598 lines (ORPHANED → MONITOR)
idumb-orchestrator: 527 lines (ORPHANED → REMOVE)
idumb-performance:  533 lines (SKILL-ONLY → KEEP)
idumb-quality:      524 lines (ORPHANED → REMOVE)
idumb-security:     359 lines (SKILL-ONLY → KEEP)
```

**After (Expected):**
```
idumb-state:        ~700 lines (ENHANCED + orchestrator)
idumb-todo:         385 lines (ACTIVE)
idumb-config:     1,022 lines (MONITOR)
idumb-validate:   ~1,100 lines (ENHANCED + quality)
idumb-context:      ~100 lines (SHIM)
idumb-chunker:      930 lines (MONITOR)
idumb-manifest:     598 lines (MONITOR)
idumb-performance:  533 lines (SKILL-ONLY)
idumb-security:     359 lines (SKILL-ONLY)
```

- [ ] idumb-validate includes quality functions
- [ ] idumb-state includes orchestrator functions
- [ ] 3 tools removed (quality, orchestrator, style)

### 4.4 LLM Decision Fatigue Metric

```bash
# Count total exported tool functions
grep -h "export const" src/tools/idumb-*.ts | wc -l
# Before: ~50 exports
# Target: ~35 exports
```

| Phase | Export Count | Decision Complexity |
|-------|--------------|---------------------|
| Before | ~50 | HIGH (too many options) |
| After | ~35 | MEDIUM (focused options) |

- [ ] Tool exports reduced by ≥30%

---

## 5. Failure Indicators

### 5.1 Critical Failures (IMMEDIATE ROLLBACK)

| Indicator | Detection Method | Rollback Command |
|-----------|------------------|------------------|
| Plugin fails to load | OpenCode startup error | `git reset --hard pre-restructure-2026-02-05` |
| state.json corruption | `node -e "JSON.parse(require('fs').readFileSync('.idumb/idumb-brain/state.json'))"` fails | Restore from backup |
| All idumb tools missing | `/idumb:status` → "tool not found" | Full rollback |
| TypeScript errors > 15 | `npx tsc --noEmit | grep -c error` | Phase rollback |
| Install fails mid-way | `npm run install:local` exit ≠ 0 | Restore .opencode/ from backup |

### 5.2 Warning Failures (INVESTIGATE)

| Indicator | Detection Method | Action |
|-----------|------------------|--------|
| Deprecation warnings | Tool output includes "DEPRECATED" | Document, continue |
| Anchor count decreased | Anchor count < baseline | Investigate, may be OK |
| Single tool fails | One tool errors, others work | Fix tool, continue |
| Schema cache stale | OpenCode shows wrong params | Restart OpenCode |

### 5.3 Silent Failures (REQUIRE EXPLICIT CHECKS)

| Failure Type | Detection Script | Consequence |
|--------------|------------------|-------------|
| Skill references removed tool | `grep -r "idumb-quality" src/skills/` | Skill breaks silently |
| Agent references removed tool | `grep "idumb-orchestrator" src/agents/*.md` | Agent instructions invalid |
| Hook not wiring | Check no validation on writes | Pre-write validation missing |
| Shim not delegating | Test deprecated tool call | Old behavior lost |

### 5.4 Rollback Triggers

Execute FULL rollback if ANY of these occur:

```bash
# TRIGGER 1: Plugin won't load
# Detection: OpenCode startup shows "Failed to load idumb-core"

# TRIGGER 2: State corruption
node -e "JSON.parse(require('fs').readFileSync('.idumb/idumb-brain/state.json'))" 2>&1
# If this exits non-zero, ROLLBACK

# TRIGGER 3: Core tools fail
# Detection: `/idumb:status` returns error

# TRIGGER 4: More than 3 tools broken
# Detection: ≥4 tools return errors when invoked

# TRIGGER 5: Anchor loss
CURRENT_ANCHORS=$(grep -c '"anchor-' .idumb/idumb-brain/state.json)
[ "$CURRENT_ANCHORS" -lt 6 ] && echo "ROLLBACK: Lost anchors"
```

### 5.5 Rollback Procedure

```bash
# Step 1: Stop OpenCode
pkill -f opencode || true

# Step 2: Get backup location
BACKUP_DIR=$(cat .plugin-dev/RESTRUCTURE-PLAN-2026-02-05/.BACKUP_PATH)

# Step 3: Restore .idumb
rm -rf .idumb
cp -R "$BACKUP_DIR/idumb-brain-backup" .idumb

# Step 4: Restore .opencode
rm -rf .opencode
cp -R "$BACKUP_DIR/opencode-backup" .opencode

# Step 5: Git reset
git reset --hard pre-restructure-2026-02-05

# Step 6: Verify
node -e "JSON.parse(require('fs').readFileSync('.idumb/idumb-brain/state.json'))"
ls .opencode/tools/idumb-*.ts | wc -l
```

---

## 6. Verification Execution Schedule

### Recommended Order

| Step | Phase | Duration | Checkpoint |
|------|-------|----------|------------|
| 1 | Pre-restructure baseline | 15 min | `.BACKUP_PATH` exists |
| 2 | Phase 0 validation | 10 min | All 4 gates pass |
| 3 | Phase 1 execution + validation | 30 min | Lib stabilized |
| 4 | Phase 2 execution + validation | 30 min | Deprecations added |
| 5 | Phase 3 execution + validation | 45 min | References updated |
| 6 | Phase 4 execution + validation | 60 min | Tools merged |
| 7 | Phase 5 execution + validation | 30 min | Installer updated |
| 8 | Phase 6 execution + validation | 30 min | Skills updated |
| 9 | Post-restructure verification | 30 min | All metrics pass |
| 10 | **7-day grace period** | - | Monitor for issues |
| 11 | Phase 7 execution + validation | 45 min | Cleanup complete |
| 12 | Final verification | 30 min | Success declared |

**Total estimated time:** 6-8 hours (plus 7-day grace)

---

## 7. Sign-off Checklist

### Pre-Restructure (GATE 0)
- [ ] Baseline TypeScript errors: _____ (record)
- [ ] Baseline tool count: _____ (record)
- [ ] Backup created at: _____________________
- [ ] Backup verified restorable: YES / NO
- [ ] Git tag created: YES / NO
- [ ] Reference baselines captured: YES / NO

**Approved to proceed:** ☐ YES ☐ NO

---

### Phase Completion Sign-offs

| Phase | Date | Verification Status | Signed |
|-------|------|---------------------|--------|
| 0 | _____ | ☐ Pass ☐ Fail | _____ |
| 1 | _____ | ☐ Pass ☐ Fail | _____ |
| 2 | _____ | ☐ Pass ☐ Fail | _____ |
| 3 | _____ | ☐ Pass ☐ Fail | _____ |
| 4 | _____ | ☐ Pass ☐ Fail | _____ |
| 5 | _____ | ☐ Pass ☐ Fail | _____ |
| 6 | _____ | ☐ Pass ☐ Fail | _____ |

**7-Day Grace Period Start:** ______________

| Phase | Date | Verification Status | Signed |
|-------|------|---------------------|--------|
| 7 | _____ | ☐ Pass ☐ Fail | _____ |

---

### Post-Restructure Sign-off

| Check | Pass | Notes |
|-------|------|-------|
| Tool count = 9 | ☐ | |
| All active tools work | ☐ | |
| All agents load | ☐ | |
| All commands execute | ☐ | |
| No orphaned references | ☐ | |
| state.json read/write works | ☐ | |
| Plugin hooks fire | ☐ | |
| Lines removed ≥ 1,500 | ☐ | Actual: _____ |
| TypeScript errors ≤ 8 | ☐ | Actual: _____ |

**RESTRUCTURE SUCCESSFUL:** ☐ YES ☐ NO

**Date:** ______________  
**Verified by:** @idumb-verifier

---

## Appendix A: Quick Verification Scripts

### verify-baseline.sh
```bash
#!/bin/bash
echo "=== Pre-Restructure Baseline Verification ==="
echo "TypeScript errors:"
npx tsc --noEmit 2>&1 | grep -c "error TS"
echo "Tool count:"
ls src/tools/idumb-*.ts | wc -l
echo "Total tool lines:"
wc -l src/tools/idumb-*.ts | tail -1
echo "state.json size:"
wc -c < .idumb/idumb-brain/state.json
echo "Anchor count:"
grep -c '"anchor-' .idumb/idumb-brain/state.json
```

### verify-phase.sh
```bash
#!/bin/bash
PHASE=$1
echo "=== Phase $PHASE Verification ==="
echo "1. Compilation:"
npx tsc --noEmit 2>&1 | grep -c "error TS"
echo "2. Install:"
npm run install:local 2>&1 | tail -3
echo "3. Tool count:"
ls .opencode/tools/idumb-*.ts | wc -l
echo "4. Agent count:"
ls .opencode/agents/idumb-*.md | wc -l
```

### verify-final.sh
```bash
#!/bin/bash
echo "=== Final Restructure Verification ==="
echo "1. Tools (target: 9):"
ls src/tools/idumb-*.ts | wc -l
echo "2. Installed tools:"
ls .opencode/tools/idumb-*.ts | wc -l
echo "3. TypeScript errors (target: ≤8):"
npx tsc --noEmit 2>&1 | grep -c "error TS"
echo "4. state.json valid:"
node -e "JSON.parse(require('fs').readFileSync('.idumb/idumb-brain/state.json'))" && echo "YES" || echo "NO"
echo "5. Lines removed:"
BEFORE=6939
AFTER=$(wc -l src/tools/idumb-*.ts | tail -1 | awk '{print $1}')
echo "$((BEFORE - AFTER)) lines"
echo "6. Orphan references:"
grep -r "idumb-quality\|idumb-orchestrator\|idumb-style" src/agents/*.md src/commands/idumb/*.md src/skills/*/SKILL.md 2>/dev/null | wc -l
```

---

*Document generated by @idumb-verifier*
*Verification methodology: Goal-backward with four-level checks*
*Based on: 01-ENTITY-MANIFEST.md, 03-CHANGE-SPECIFICATION.md, 04-EXECUTION-ORDER.md, 05-ROLLBACK-PLAN.md*
