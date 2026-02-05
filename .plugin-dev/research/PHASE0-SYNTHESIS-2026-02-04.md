# PHASE 0 Synthesis: Permission Manipulation Design

**Date:** 2026-02-04
**Status:** Research Complete → Design Phase
**Goal:** Fix design flaws in permission system, brain consumption, and agent scoping

---

## Key Findings from Research

### 1. Permission System Issues

**Current State:**
- LOG-ONLY mode: `output.status = "deny"` is **COMMENTED OUT**
- Only MAX_DELEGATION_DEPTH (>3) is actively enforced
- `pendingDenials` tracks violations but doesn't block

**TUI Risk Factors (HIGH PRIORITY):**
- 73 emoji/box-drawing matches in `idumb-core.ts`
- Only `buildViolationGuidance()` is properly simplified
- Other functions (`buildChainBlockMessage`, `triggerEmergencyHalt`) still use heavy unicode

**Critical Fix Needed:**
- DENY must be SPECIFIC (file types, specific agents, regex)
- Every DENY must have a matching contextual message
- NO broad denies like `"*": deny`
- ASK should be minimized/removed (breaks automation UX)

### 2. Brain/State Files Issues

**Current State:**
```
.idumb/
├── brain/
│   ├── state.json        ← Used (phase, anchors, history)
│   ├── todos.json        ← Used by idumb-todo
│   ├── execution-metrics.json ← Used for iteration tracking
│   ├── context/          ← UNUSED
│   └── history/          ← UNUSED
├── governance/
│   ├── plugin.log        ← Used (logging only)
│   └── validations/      ← Manual artifacts only
├── sessions/             ← Used (session metadata)
├── timestamps/           ← Used (file tracking)
├── anchors/              ← UNUSED (anchors in state.json)
└── execution/            ← Used (emergency halt checkpoints)
```

**Enforcement Status:**
- Config auto-generation: **ENFORCED** (session.created)
- Chain rules: **NOT ENFORCED** (defined but never called)
- First tool check: **LOG ONLY**
- File mod by non-builder: **LOG ONLY**

### 3. Session States & Hierarchy

**5 Session States:**
| State | Hook | Governance |
|-------|------|------------|
| New Conversation | session.created | FULL prefix |
| Compact | session.compacting + messages.transform | Post-compact reminder |
| Between-Turn | messages.transform | First message injection |
| User-Stop | session.idle | Archive, no injection |
| Resume | session.resumed + messages.transform | Resume context + prefix |

**3 Hierarchy Levels:**
| Level | Governance | User Control |
|-------|-----------|--------------|
| 0 (User↔Coordinator) | FULL | ✅ Full |
| 1 (First delegation) | FULL | ⚠️ Can stop |
| 2+ (Nested) | LOG ONLY | ❌ Opaque |

---

## Design Requirements (Your Specifications)

### 1. Deny Pattern Rules

**WRONG:**
```yaml
permission:
  task:
    "*": deny  # ❌ Too broad, blocks parent group
  bash:
    "*": deny  # ❌ Too broad
```

**CORRECT:**
```yaml
permission:
  task:
    "idumb-builder": deny  # ✅ Specific agent
    "idumb-low-validator": deny  # ✅ Specific agent
  bash:
    "rm -rf*": deny  # ✅ Specific pattern
    "chmod 777*": deny  # ✅ Specific pattern
```

**BETTER - Use Allow instead of Deny:**
```yaml
permission:
  bash:
    "git status": allow
    "git diff*": allow
    "pnpm test*": allow
    "npm test*": allow
    # Unspecified = deny by default (implicit)
  edit:
    "*.md": allow
    "*.yaml": allow
    "*.json": allow
    # Unspecified = deny
```

### 2. Deny Message Requirements

Every deny MUST have a matching contextual message:

```typescript
interface DenyRule {
  pattern: string           // What to deny (regex)
  message: string           // Why denied (contextual)
  suggestion: string        // What to do instead
  severity: 'block' | 'warn'
}

const denyRules: DenyRule[] = [
  {
    pattern: 'rm -rf*',
    message: 'Destructive deletion blocked for safety',
    suggestion: 'Use git revert or ask user to manually delete',
    severity: 'block'
  },
  {
    pattern: 'chmod 777*',
    message: 'Insecure permission change blocked',
    suggestion: 'Use chmod 755 or more restrictive',
    severity: 'warn'
  }
]
```

### 3. Ask Permission Rules

**REMOVE `ask` from almost everything:**
- Git revert exists for recovery
- Users can configure exceptions
- Ask breaks automation flow

**ONLY use `ask` for:**
- User-configurable harm prevention
- Actions that affect external systems (API keys, deployments)
- Actions that cannot be reverted

### 4. Agent Scope Clarification

**META Agents (manipulate .idumb/, .opencode/, template/):**
- `idumb-builder` - META file operations
- `idumb-low-validator` - META validation
- `idumb-high-governance` - META coordination

**PROJECT Agents (manipulate user's codebase):**
- `idumb-executor` - PROJECT code execution (uses `general` not `idumb-builder`)
- `idumb-mid-coordinator` - PROJECT workflow coordination
- `idumb-skeptic-validator` - PROJECT assumption validation
- `idumb-project-explorer` - PROJECT codebase exploration
- `idumb-verifier` - PROJECT verification
- `idumb-debugger` - PROJECT debugging

**BRIDGE Agents (orchestrate both):**
- `idumb-supreme-coordinator` - Top level orchestration
- `idumb-planner` - Planning (read-only)
- `idumb-plan-checker` - Plan validation (read-only)
- `idumb-integration-checker` - Integration validation

---

## Design Specifications

### Spec 1: Deny-with-Message System

```typescript
// NEW: Structured deny rules with messages
interface PermissionRule {
  type: 'allow' | 'deny' | 'ask'
  pattern: string | RegExp
  context: {
    agents?: string[]     // Which agents this applies to
    fileTypes?: string[]  // File patterns
    scopes?: ('meta' | 'project')[]  // Scope filtering
  }
  message?: string        // Required for deny
  suggestion?: string     // Required for deny
}

// NEW: Permission evaluation with message return
function evaluatePermission(
  agent: string,
  tool: string,
  args: any,
  rules: PermissionRule[]
): { allowed: boolean; message?: string; suggestion?: string } {
  for (const rule of rules) {
    if (matchesRule(agent, tool, args, rule)) {
      if (rule.type === 'deny') {
        return {
          allowed: false,
          message: rule.message || 'Action not permitted',
          suggestion: rule.suggestion || 'Contact coordinator'
        }
      }
      if (rule.type === 'allow') {
        return { allowed: true }
      }
    }
  }
  // Default: deny (implicit deny for safety)
  return {
    allowed: false,
    message: 'No matching allow rule found',
    suggestion: 'This tool may not be in your allowed list'
  }
}
```

### Spec 2: TUI-Safe Message Format

```typescript
// REMOVE all emojis and box-drawing from programmatic messages
// Use plain text with markdown headers only

const SAFE_MESSAGE_FORMAT = {
  // ❌ WRONG
  wrong: '🚫 BLOCKED: Agent cannot use tool\n━━━━━━━━━━━━',
  
  // ✅ CORRECT
  correct: `## BLOCKED: Agent cannot use tool

**Reason:** [contextual reason]
**Agent Role:** [what this agent does]
**Suggestion:** [what to do instead]
**Next Steps:**
1. Use idumb-todo to check current tasks
2. Delegate to appropriate agent
`
}
```

### Spec 3: Brain Consumption Hierarchy

```yaml
# Order of consumption for agents at session start
consumption_order:
  level_0_coordinator:
    required:
      - .idumb/brain/state.json      # Phase, anchors
      - .idumb/brain/config.json           # Settings, language
    optional:
      - .idumb/brain/todos.json      # Task list
      - .idumb/brain/sessions/{id}.json    # Session metadata
      
  level_1_delegation:
    required:
      - .idumb/brain/state.json      # Phase only
    optional:
      - .idumb/brain/config.json           # Language only
      
  level_2_plus:
    required: []                      # No required reads
    optional:
      - .idumb/brain/state.json      # Phase check only
```

### Spec 4: Purge/Archive Policy

```yaml
# Temporary memory management
purge_policy:
  state_history:
    max_entries: 50
    archive_to: .idumb/brain/history/
    archive_trigger: entries > 50
    
  sessions:
    max_age_hours: 168  # 7 days
    archive_to: .idumb/archive/sessions/
    purge_trigger: age > 168h
    
  anchors:
    max_count: 20
    priority_preserve: ['critical', 'high']
    auto_demote_after: 48h  # high → normal → delete
    
  execution_metrics:
    reset_on: session.created
    archive_to: .idumb/brain/history/metrics-{date}.json
```

---

## Implementation Priority

### Phase 1: Permission Fixes (This Session)
1. Design deny-with-message interface
2. Create TUI-safe message builder (no emojis)
3. Update agent frontmatter with specific allows
4. Remove all `task: "*": deny` patterns

### Phase 2: Brain Enforcement (Next Session)
1. Implement consumption hierarchy
2. Add schema validation for brain files
3. Design purge/archive automation

### Phase 3: Session Manipulation (Future)
1. Implement new session manipulation
2. Add message interception (short/long)
3. Implement delegation depth awareness

---

## Files to Modify

| File | Changes |
|------|---------|
| `template/plugins/idumb-core.ts` | Add deny-with-message system, TUI-safe messages |
| `template/agents/*.md` | Fix permission patterns in all 18 agents |
| `template/governance/deny-rules.yaml` | NEW: Centralized deny rules |
| `template/governance/brain-schema.json` | NEW: Schema for brain files |

---

*Synthesized by idumb-supreme-coordinator*
*Research from: idumb-project-explorer, idumb-phase-researcher*
*Date: 2026-02-04*
