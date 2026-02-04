# Permission Deny System Research

**Date:** 2026-02-04  
**Researcher:** @idumb-phase-researcher  
**Domain:** Technical Implementation Research  
**Phase:** Phase 0 - Foundation  
**Status:** Complete

---

## Executive Summary

This research documents the current state of the permission deny system in iDumb plugin and OpenCode, analyzing gaps between the current implementation and user requirements. The key finding is that **OpenCode's `permission.ask` hook is currently NOT triggered** (confirmed via GitHub issues #7006 and #9229), which means the plugin's permission enforcement is LOG-ONLY and cannot actually block operations.

### Critical Findings

| Area | Current State | Required State | Gap |
|------|---------------|----------------|-----|
| `permission.ask` hook | Defined but never called by OpenCode | Should intercept and auto-deny | **CRITICAL: Hook is broken upstream** |
| Agent profiles | Use frontmatter permissions | Should use specific patterns | **HIGH: Needs update** |
| Deny rules YAML | Well-designed patterns | Should integrate with plugin | **MEDIUM: Not connected** |
| Plugin enforcement | LOG-ONLY (line 2956) | Should actively block | **HIGH: But blocked by upstream** |

---

## 1. Current State Analysis

### 1.1 Plugin Permission Hook Status

**Location:** `template/plugins/idumb-core.ts` lines 2930-2991

**Current Implementation:**
```typescript
"permission.ask": async (input: any, output: any) => {
  // ... agent detection and tool checking ...
  
  if (agentRole && allowedTools.length > 0 && !isAllowed) {
    // LOG ONLY - DO NOT DENY
    // output.status = "deny"  // <-- COMMENTED OUT
    log(directory, `[WARN] ${agentRole} permission for ${toolName} - LOG ONLY, not blocking`)
    
    // ... tracking code ...
  }
}
```

**Problem:** The `output.status = "deny"` line is commented out because OpenCode's permission system never actually calls this hook.

### 1.2 OpenCode Upstream Bug

**GitHub Issues Confirming Bug:**

1. **Issue #7006** (Jan 5, 2026): "permission.ask plugin hook is defined but not triggered"
   - Status: Open, assigned to `@rekram1-node`
   - Label: bug
   - Confirmed: The hook exists in types but is never called

2. **Issue #9229** (Jan 18, 2026): "Plugin SDK: permission.ask hook is never called"
   - Status: Closed as duplicate of #7006
   - Root cause: OpenCode uses `PermissionNext.ask()` which emits Bus events instead of calling `Plugin.trigger("permission.ask", ...)`

**Root Cause Analysis:**
```typescript
// packages/opencode/src/permission/next.ts:128-141 (ACTIVELY USED)
if (rule.action === "ask") {
  const id = input.id ?? Identifier.ascending("permission")
  return new Promise<void>((resolve, reject) => {
    const info: Request = { id, ...request }
    s.pending[id] = { info, resolve, reject }
    Bus.publish(Event.Asked, info)  // <-- Emits "permission.asked", NOT "permission.ask" hook
  })
}
```

**Implication:** Until OpenCode fixes issue #7006, the plugin's `permission.ask` hook will NEVER be called. All permission enforcement must rely on:
1. Agent frontmatter `permission:` blocks (OpenCode native)
2. `tool.execute.before` hook (can throw to block, but doesn't work for alls per #5894)
3. `event` hook with `permission.asked` type (read-only, cannot modify)

### 1.3 Agent Frontmatter Permissions (Current)

**Location:** `template/agents/idumb-*.md`

**Current Patterns Found:**

| Agent | Permission Block | Issues |
|-------|------------------|--------|
| `idumb-supreme-coordinator` | Specific allows, no `*` | ✅ Correct pattern |
| `idumb-builder` | `bash: "*": allow` | ⚠️ Too permissive for builder |
| `idumb-low-validator` | Specific bash allows | ✅ Correct pattern |
| `idumb-executor` | Has `"*": deny` for task | ❌ Wrong - should be no `*` entry |
| `idumb-verifier` | Specific task allows | ✅ Correct pattern |
| Most research agents | `"*": deny` patterns | ❌ Wrong - too broad |

### 1.4 Deny Rules YAML (Well-Designed but Unused)

**Location:** `template/governance/deny-rules.yaml`

This file contains a well-structured permission system with:
- Specific bash command denies with messages
- Specific bash command allows per agent
- Delegation restrictions per agent
- File type permissions per agent
- Tool restrictions with messages
- Message templates for TUI-safe output

**Problem:** This file is NOT currently integrated with the plugin. The plugin uses hardcoded `getAllowedTools()` function instead.

---

## 2. OpenCode Permission System Documentation

### 2.1 Permission Values

| Value | Behavior |
|-------|----------|
| `"allow"` | Execute without approval |
| `"deny"` | Prevent execution entirely |
| `"ask"` | Prompt user for approval (once/always/reject) |

### 2.2 Configuration Syntax

```json
// Global permissions (opencode.json)
{
  "permission": {
    "*": "ask",        // Default for everything
    "bash": "allow",   // Override for bash
    "edit": "deny"     // Override for edit
  }
}

// Granular patterns (object syntax)
{
  "permission": {
    "bash": {
      "*": "ask",           // Default for bash
      "git *": "allow",     // Allow git commands
      "rm *": "deny"        // Deny rm commands
    },
    "edit": {
      "*": "deny",
      "src/*.ts": "allow"   // Allow editing TypeScript in src/
    }
  }
}
```

### 2.3 Pattern Matching Rules

1. **Last matching rule wins** - Order matters, put `*` first
2. **Wildcards:** `*` matches any characters, `?` matches single character
3. **Home expansion:** `~` or `$HOME` expands to home directory
4. **External directories:** Use `external_directory` for paths outside project

### 2.4 Available Permissions

| Permission | Purpose | Matches |
|------------|---------|---------|
| `read` | Read files | File path |
| `edit` | Modify files | File path |
| `write` | Create files | File path |
| `glob` | Find files | Glob pattern |
| `grep` | Search content | Regex pattern |
| `list` | List directories | Directory path |
| `bash` | Shell commands | Parsed command |
| `task` | Launch alls | all type |
| `skill` | Load skills | Skill name |
| `webfetch` | Fetch URLs | URL |
| `websearch` | Web search | Query |
| `external_directory` | Access outside project | Path pattern |
| `doom_loop` | Prevent infinite loops | N/A |

### 2.5 Per-Agent Permissions (Frontmatter)

```yaml
---
description: "Agent description"
mode: all
permission:
  edit: deny
  bash:
    "*": ask
    "git *": allow
    "rm *": deny
  task:
    "general": allow
    "idumb-builder": allow
---
```

**Key Points:**
- Agent permissions merge with global config
- Agent rules take precedence
- Use pattern matching for commands with arguments

---

## 3. Gap Analysis

### 3.1 Critical Gap: `permission.ask` Hook Not Working

| Aspect | Current | Required | Gap Severity |
|--------|---------|----------|--------------|
| Hook invocation | Never called | Should be called | **CRITICAL** |
| Plugin blocking | LOG-ONLY | Should auto-deny | **HIGH** (blocked by upstream) |
| Workaround available | Use frontmatter | Not as flexible | **MEDIUM** |

**Workaround Options:**
1. **Primary:** Rely entirely on agent frontmatter `permission:` blocks
2. **Secondary:** Use `tool.execute.before` hook with `throw new Error(...)` to block (but won't work for alls)
3. **Tertiary:** Wait for OpenCode to fix #7006

### 3.2 Agent Profile Gaps

| Agent | Current Issue | Required Fix |
|-------|---------------|--------------|
| `idumb-builder` | `bash: "*": allow` | Add specific dangerous denies |
| `idumb-roadmapper` | Missing `task: "general": allow` | Add explicit allow |
| `idumb-project-researcher` | Missing `task: "general": allow` | Add explicit allow |
| `idumb-phase-researcher` | Missing `task: "general": allow` | Add explicit allow |
| `idumb-research-synthesizer` | Missing `task: "general": allow` | Add explicit allow |
| `idumb-codebase-mapper` | Missing `task: "general": allow` | Add explicit allow |

### 3.3 Pattern Issues

**Current Anti-Patterns Found:**

```yaml
# ❌ WRONG - Too broad
bash: deny               # Blocks ALL bash
task: deny              # Blocks ALL delegation
"*": deny               # Blocks everything unspecified

# ❌ WRONG - Ambiguous
bash:
  "git": allow          # Only matches "git" with no args
  
# ❌ WRONG - Missing message
bash: deny              # Why denied? User won't know
```

**Required Patterns:**

```yaml
# ✅ CORRECT - Specific allows with implicit deny
task:
  "idumb-builder": allow
  "idumb-low-validator": allow
  "general": allow
  # (No "*" entry = implicit deny for unspecified)

# ✅ CORRECT - Specific bash allows  
bash:
  "git *": allow        # Matches git with any args
  "npm test*": allow    # Matches npm test commands
  "rm -rf": deny        # Explicit deny for dangerous
  # (No "*" entry = implicit deny for unspecified)

# ✅ CORRECT - With command args
bash:
  "git status": allow       # Exact match
  "git diff*": allow        # With wildcards for args
  "git commit -m *": allow  # With specific flags
```

### 3.4 Missing Integration

| Component | Status | Required Action |
|-----------|--------|-----------------|
| `deny-rules.yaml` | Well-designed | Need to integrate with plugin |
| `getAllowedTools()` | Hardcoded | Should read from YAML or config |
| `buildViolationGuidance()` | Good messages | Should use YAML templates |
| Agent frontmatter | Primary source | Ensure all patterns are correct |

---

## 4. Recommended Fix Approach

### 4.1 Immediate Fixes (Agent Frontmatter - Works Now)

Since `permission.ask` hook is broken, focus on agent frontmatter as primary enforcement:

**Step 1: Update all agent profiles with correct patterns**

For each agent, apply these rules:
1. Remove all `"*": deny` patterns
2. Add explicit `allow` patterns for needed operations
3. Let implicit deny handle unspecified (no `*` entry)
4. Add explicit `deny` only for truly dangerous operations

**Step 2: Add specific dangerous command denies**

```yaml
# Add to agents that have bash access
bash:
  "rm -rf /": deny       # Never allow root delete
  "rm -rf ~": deny       # Never allow home delete
  "rm -rf *": deny       # Never allow wildcard delete
  "chmod 777 *": deny    # Never allow world-writable
  "sudo *": deny         # Never allow sudo
  # Specific allows after...
```

### 4.2 Medium-Term Fixes (Plugin Enhancement)

**Step 1: Add `tool.execute.before` enforcement (with limitation)**

```typescript
"tool.execute.before": async (input: any, output: any) => {
  const toolName = extractToolName(input.tool)
  const agentRole = detectAgentFromSession(input.sessionID)
  
  // Check against deny-rules.yaml loaded patterns
  const denyRule = findDenyRule(agentRole, toolName, input.args)
  if (denyRule) {
    throw new Error(`BLOCKED: ${denyRule.message}\n\nSuggestion: ${denyRule.suggestion}`)
  }
}
```

**Limitation:** This won't work for all tool calls (per GitHub issue #5894).

**Step 2: Integrate deny-rules.yaml**

```typescript
function loadDenyRules(directory: string): DenyRules {
  const rulesPath = join(directory, 'template/governance/deny-rules.yaml')
  if (!existsSync(rulesPath)) return getDefaultDenyRules()
  return yaml.parse(readFileSync(rulesPath, 'utf-8'))
}
```

### 4.3 Long-Term Fix (Wait for OpenCode)

Monitor GitHub issue #7006 for resolution. Once fixed:

1. Uncomment `output.status = "deny"` in `permission.ask` hook
2. Remove workarounds from `tool.execute.before`
3. Full dynamic permission control via plugin

---

## 5. Specific Patterns to Use/Avoid

### 5.1 ALWAYS ALLOWED (Non-Negotiable)

These tools must NEVER be denied as they are essential for context gathering:

```yaml
# These should NEVER appear in deny rules
read: allow       # Essential for context
glob: allow       # Essential for file discovery
grep: allow       # Essential for content search
list: allow       # Essential for directory navigation
todoread: allow   # Essential for task tracking
```

### 5.2 COORDINATOR PATTERN (Supreme Coordinator, High Governance)

```yaml
permission:
  task:
    "idumb-high-governance": allow
    "idumb-mid-coordinator": allow
    "idumb-executor": allow
    # ... all valid delegation targets
    "general": allow
    # No "*" entry = implicit deny
  bash:
    "git status": allow
    "git diff*": allow
    "git log*": allow
    # No "*" entry = implicit deny
  edit: deny
  write: deny
```

### 5.3 EXECUTOR PATTERN (Executor, Verifier, Debugger)

```yaml
permission:
  task:
    "general": allow           # For project file operations
    "idumb-low-validator": allow
    # No "*" entry = implicit deny
  bash:
    "git status": allow
    "git diff*": allow
    "git log*": allow
    "pnpm test*": allow
    "npm test*": allow
    "pnpm run*": allow
    "npm run*": allow
    # No "*" entry = implicit deny
  edit: deny
  write: deny
```

### 5.4 RESEARCHER PATTERN (All research agents)

```yaml
permission:
  task:
    "general": allow           # For web search, exploration
    # No "*" entry = implicit deny
  bash:
    "ls*": allow               # Safe listing
    "cat*": allow              # Safe reading
    # No "*" entry = implicit deny
  edit: deny
  write: deny
```

### 5.5 BUILDER PATTERN (Leaf executor)

```yaml
permission:
  bash:
    "*": allow                 # Needs full execution capability
    "rm -rf /": deny           # Explicit dangerous denies
    "rm -rf ~": deny
    "sudo *": deny
  edit: allow
  write: allow
  # Note: No task permission (leaf node, cannot delegate)
```

### 5.6 VALIDATOR PATTERN (Read-only leaf)

```yaml
permission:
  bash:
    "grep*": allow
    "find*": allow
    "ls*": allow
    "cat*": allow
    "wc*": allow
    "pnpm test*": allow
    "npm test*": allow
    "git status": allow
    "git diff*": allow
    "git log*": allow
    # No "*" entry = implicit deny
  edit: deny
  write: deny
  # Note: No task permission (leaf node, cannot delegate)
```

---

## 6. Sources

### Primary Documentation
1. OpenCode Official Permissions: https://opencode.ai/docs/permissions/
2. OpenCode Agents: https://opencode.ai/docs/agents/
3. OpenCode Plugins: https://opencode.ai/docs/plugins/

### GitHub Issues (Critical Context)
4. Issue #7006: permission.ask hook not triggered
5. Issue #9229: Duplicate of #7006
6. Issue #5894: all tool calls bypass plugin hooks

### Internal Documentation
7. `/template/governance/deny-rules.yaml` - Well-designed deny patterns
8. `/template/plugins/idumb-core.ts` - Current plugin implementation
9. `/.planning/research/PERMISSION-DENY-FIXES.md` - Previous analysis

---

## 7. Recommendations Summary

| Priority | Action | Impact |
|----------|--------|--------|
| **P0** | Update agent frontmatter permissions | Enables OpenCode native enforcement |
| **P1** | Remove all `"*": deny` patterns | Fixes broken delegation |
| **P1** | Add explicit dangerous command denies | Prevents catastrophic operations |
| **P2** | Add `tool.execute.before` blocking | Secondary enforcement layer |
| **P3** | Integrate deny-rules.yaml | Dynamic pattern management |
| **P4** | Monitor #7006 for resolution | Full plugin control when fixed |

---

**Research Complete:** 2026-02-04  
**Next Action:** Update agent profiles with correct permission patterns
