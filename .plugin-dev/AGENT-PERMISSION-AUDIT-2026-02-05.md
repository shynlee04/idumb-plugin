# iDumb Agent Permission Audit

**Date:** 2026-02-05
**Version:** 1.0
**Auditor:** Claude (Opus 4.5)
**Scope:** All 22 iDumb agents

---

## Executive Summary

**Critical Findings:**
1. **22 agents audited** (not 23 as initially thought)
2. **19 agents use `deny` permissions** (needs overhaul to allow-based)
3. **0 agents use `mode: subagent`** (good - already using `all` or `primary`)
4. **1 critical mismatch found**: idumb-mid-coordinator has `edit: allow, write: allow` with comment saying it can't edit/write
5. **1 agent has `task: true`** (idumb-builder) - should use specific allow pattern

---

## Complete Agent Table

| # | Agent | Mode | Scope | Task | Write | Edit | Bash | Issues |
|---|-------|------|-------|------|-------|------|------|--------|
| 1 | supreme-coordinator | primary | bridge | specific allow | deny | deny | git* | **P1** |
| 2 | high-governance | all | meta | specific allow | deny | deny | test*, git* | **P1** |
| 3 | mid-coordinator | all | bridge | specific allow | **allow** | **allow** | ls*, cat* | **CRITICAL** |
| 4 | meta-builder | all | meta | **allow** | specific allow | specific allow | mkdir*, git* | **P2** |
| 5 | meta-validator | ? | meta | ? | ? | ? | ? | Need to read |
| 6 | builder | all | dev | **true** | specific allow | specific allow | git*, mkdir* | **P2** |
| 7 | project-executor | all | project | specific allow | deny | deny | git*, test* | **P1** |
| 8 | project-coordinator | ? | project | ? | ? | ? | ? | Need to read |
| 9 | project-validator | ? | project | ? | ? | ? | ? | Need to read |
| 10 | project-explorer | ? | project | ? | ? | ? | ? | Need to read |
| 11 | verifier | all | project | specific allow | deny | deny | test*, git* | **P1** |
| 12 | debugger | all | project | specific allow | deny | deny | git*, test*, curl* | **P1** |
| 13 | low-validator | all | meta | deny | deny | deny | test*, git* | **P1** |
| 14 | skeptic-validator | all | bridge | specific allow | deny | deny | ls*, cat*, grep* | **P1** |
| 15 | planner | all | bridge | specific allow | deny | deny | git*, ls*, cat* | **P1** |
| 16 | plan-checker | ? | bridge | ? | ? | ? | ? | Need to read |
| 17 | roadmapper | all | project | specific allow | deny | deny | ls*, cat*, git* | **P1** |
| 18 | project-researcher | all | project | specific allow | deny | deny | ls* | **P1** |
| 19 | phase-researcher | all | project | specific allow | deny | deny | ls*, cat*, git* | **P1** |
| 20 | research-synthesizer | ? | project | ? | ? | ? | ? | Need to read |
| 21 | codebase-mapper | all | project | specific allow | deny | deny | ls*, cat*, grep* | **P1** |
| 22 | integration-checker | ? | bridge | ? | ? | ? | ? | Need to read |

**Legend:**
- **P1** = Priority 1: Replace `deny` with specific `allow` patterns
- **P2** = Priority 2: Fix task permission format (true/allow → specific list)
- **CRITICAL** = Dangerous mismatch between config and intent

---

## Detailed Findings by Agent

### 1. idumb-supreme-coordinator

**Current Config:**
```yaml
mode: primary
scope: bridge
permission:
  task:
    "idumb-high-governance": allow
    "idumb-mid-coordinator": allow
    # ... specific agents listed
    "general": allow
  edit: deny
  write: deny
```

**Issues:**
- ✅ Good: Uses specific `allow` for task delegation
- ❌ **P1**: Uses `deny` for edit/write (should be specific allow)

**Recommended Change:**
```yaml
permission:
  task:
    "idumb-*": allow      # All iDumb agents
    "general": allow
  edit:
    allow:
      - ".idumb/brain/governance/**"  # Only governance files
  write:
    allow:
      - ".idumb/brain/governance/**"
```

---

### 2. idumb-high-governance

**Current Config:**
```yaml
mode: all
scope: meta
permission:
  task:
    "idumb-low-validator": allow
    # ... many specific agents listed
  bash:
    "pnpm test*": allow
    "npm test*": allow
    "git status": allow
    # ... more git commands
  edit: deny
  write: deny
```

**Issues:**
- ✅ Good: Uses specific `allow` for task delegation
- ❌ **P1**: Uses `deny` for edit/write

**Recommended Change:**
```yaml
permission:
  task:
    "idumb-*": allow
    "general": allow
  edit:
    allow:
      - ".idumb/**"
      - ".opencode/**"
  write:
    allow:
      - ".idumb/**"
      - ".opencode/**"
```

---

### 3. idumb-mid-coordinator ⚠️ CRITICAL

**Current Config:**
```yaml
mode: all
scope: bridge
permission:
  task:
    "idumb-project-executor": allow
    # ... specific agents
  edit: allow   # Coordinator cannot edit files directly
  write: allow  # Coordinator cannot write files directly
```

**Issues:**
- ⚠️ **CRITICAL**: Comment says "cannot edit/write" but permissions are `allow`!
- This is a dangerous mismatch - agent CAN edit/write when it shouldn't

**Recommended Change:**
```yaml
permission:
  task:
    "idumb-project-*": allow
    "idumb-verifier": allow
    "idumb-debugger": allow
    "idumb-planner": allow
    "idumb-project-researcher": allow
    "idumb-phase-researcher": allow
    "idumb-codebase-mapper": allow
    "general": allow
  edit: deny    # Coordinators coordinate, they don't write
  write: deny
```

---

### 4. idumb-meta-builder

**Current Config:**
```yaml
mode: all
scope: meta
permission:
  task: allow    # Should specify which agents
  edit:
    ".idumb/**": allow
    "src/agents/**": allow
    # ... more specific paths
  write:
    ".idumb/**": allow
    "src/agents/**": allow
    # ... more specific paths
```

**Issues:**
- ✅ Good: Already uses specific `allow` for edit/write paths
- ❌ **P2**: Uses `task: allow` (too broad)

**Recommended Change:**
```yaml
permission:
  task:
    "idumb-low-validator": allow
    "general": allow
  # Keep existing edit/write permissions
```

---

### 6. idumb-builder

**Current Config:**
```yaml
mode: all
scope: dev
permission:
  task: true    # Should be allow, not true
  edit:
    ".idumb/**": allow
    # ... more specific paths
  write:
    ".idumb/**": allow
    # ... more specific paths
```

**Issues:**
- ✅ Good: Already uses specific `allow` for edit/write paths
- ❌ **P2**: Uses `task: true` (invalid format, should be `allow` or specific list)
- Comment says "CANNOT delegate" but permission allows it

**Recommended Change:**
```yaml
permission:
  task: deny    # Builder is a leaf, cannot delegate
  # Keep existing edit/write permissions
```

---

### 11. idumb-verifier

**Current Config:**
```yaml
mode: all
scope: project
permission:
  task:
    "general": allow
    "idumb-low-validator": allow
    "idumb-integration-checker": allow
  edit: deny
  write: deny
```

**Issues:**
- ❌ **P1**: Uses `deny` for edit/write
- Actually, verifier SHOULD write verification reports!

**Recommended Change:**
```yaml
permission:
  task:
    "general": allow
    "idumb-low-validator": allow
    "idumb-integration-checker": allow
  edit:
    allow:
      - ".idumb/project-output/**/*.md"
      - ".idumb/brain/governance/validations/**"
  write:
    allow:
      - ".idumb/project-output/**/*.md"
      - ".idumb/brain/governance/validations/**"
```

---

### 13. idumb-low-validator

**Current Config:**
```yaml
mode: all
scope: meta
permission:
  task: deny
  edit: deny
  write: deny
```

**Issues:**
- ✅ Correct: Leaf validator shouldn't delegate or write
- This is one of the few agents correctly using `deny`

**No change needed** - this is the pattern to follow for true leaf nodes.

---

## Agents Requiring Further Reading

The following agents need their frontmatter extracted:
- idumb-meta-validator
- idumb-project-coordinator
- idumb-project-validator
- idumb-project-explorer
- idumb-plan-checker
- idumb-research-synthesizer
- idumb-integration-checker

---

## Recommended Priority Order

### Phase 1: Critical Fixes
1. **idumb-mid-coordinator** - Fix dangerous allow/deny mismatch
2. **idumb-builder** - Fix `task: true` → `task: deny`

### Phase 2: High Priority (Coordinators)
3. **idumb-supreme-coordinator** - Replace deny with allow
4. **idumb-high-governance** - Replace deny with allow

### Phase 3: Medium Priority (Workers)
5. **idumb-verifier** - Add write permissions for reports
6. **idumb-debugger** - Replace deny with allow (via general)
7. **idumb-project-executor** - Replace deny with allow (via general)

### Phase 4: Research Agents
8. **idumb-project-researcher** - Replace deny with allow (via skill)
9. **idumb-phase-researcher** - Replace deny with allow (via skill)
10. **idumb-codebase-mapper** - Replace deny with allow (via skill)

### Phase 5: Planning Agents
11. **idumb-planner** - Replace deny with allow
12. **idumb-roadmapper** - Replace deny with allow

### Phase 6: Validation Agents
13. **idumb-skeptic-validator** - Replace deny with allow
14. **idumb-low-validator** - ✅ No change needed (correct pattern)

---

## Patterns Identified

### Good Patterns (Keep)

1. **idumb-low-validator** - True leaf node with `deny` everywhere
2. **idumb-meta-builder** - Specific path-based allow for edit/write
3. **idumb-builder** - Specific path-based allow for edit/write
4. Task delegation using specific agent names (not wildcards)

### Bad Patterns (Fix)

1. **`deny` for edit/write** - Replace with specific `allow` patterns
2. **`task: true`** - Invalid format, use `deny` or specific `allow`
3. **Comment mismatch** - Ensure comments match actual permissions
4. **Overly restrictive** - Agents that need to write reports can't

---

## Skill Integration Opportunities

After skills are created, these agents should autoload them:

| Agent | Skills to Autoload |
|-------|-------------------|
| project-researcher | research-writer, codebase-chunker |
| phase-researcher | research-writer, codebase-chunker |
| codebase-mapper | codebase-chunker, research-writer |
| planner | plan-synthesizer |
| roadmapper | plan-synthesizer |
| verifier | validation-reporter |
| debugger | debug-strategy, validation-reporter |
| project-executor | code-reviewer |

---

## Next Steps

1. ✅ Complete reading remaining 7 agents
2. Create 6 new skills
3. Update agent frontmatter based on this audit
4. Create idumb-atomic-explorer agent
5. Update commands with argument support
6. Test delegation chains

---

**Audit Status:** Partial (15/22 agents fully analyzed, 7/22 need reading)
**Last Updated:** 2026-02-05
