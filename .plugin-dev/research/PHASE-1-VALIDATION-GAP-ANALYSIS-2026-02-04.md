# Phase 1 Validation Gap Analysis & Remediation Plan

**Document Type:** Validation Gap Analysis
**Domain:** Technical Architecture - iDumb Governance System
**Created:** 2026-02-04
**Version:** 1.0.0
**Purpose:** Comprehensive Phase 1 validation analysis against roadmap success criteria

---

## Executive Summary

**CRITICAL FINDING:** Phase 1 "Contracts-First Governance Core" has SIGNIFICANT GAPS across all three success criteria. The current implementation is in LOG-ONLY mode and does NOT provide deterministic governance.

**Success Criteria Assessment:**
| Criterion | Status | Evidence |
|-----------|--------|----------|
| 1. User can run `/idumb:init` and see stable governance state | **PARTIAL** | Init runs, but config is non-functional |
| 2. Coordinator cannot write/edit; builder can; validator is read-only | **FAIL** | No enforcement, LOG-ONLY mode active |
| 3. Any governance run produces validation result with evidence | **FAIL** | Validation happens but no enforcement |

**Overall Status:** ❌ **PHASE 1 NOT COMPLETE**

---

## Part 1: Success Criterion 1 - Init Command & Governance State

### Criterion Statement
> User can run `/idumb:init` and see stable governance state created/updated under `.idumb/`

### Current Implementation Assessment

#### What Works ✓
- Language selection (English/Vietnamese) exists
- Directory creation happens (`.idumb/` structure)
- Basic `state.json` and `config.json` created
- GSD file archiving works

#### What's Missing ✗

| Gap ID | Gap Description | Severity | Impact |
|--------|----------------|----------|--------|
| **G1-01** | No governance level configuration in init | HIGH | User cannot select efficient/strict/intelligent mode |
| **G1-02** | No auto-expert mode selection | HIGH | User cannot choose default/advanced/autonomous mode |
| **G1-03** | No research level configuration | MEDIUM | MCP server setup not prompted |
| **G1-04** | No user experience level (pro/new/retard) selection | HIGH | Guardrails not configured per user type |
| **G1-05** | Config values not enforced by agents | CRITICAL | Settings in config.json ignored |
| **G1-06** | Language selection does not affect agent behavior | CRITICAL | Agents don't obey language setting |
| **G1-07** | No path detection/validation | MEDIUM | Cannot verify project root correctness |
| **G1-08** | No iteration limits configuration | HIGH | No max delegation depth configured |

### Validation Evidence

```yaml
Test: Run /idumb:init with Vietnamese language selection
Expected: Agents respond in Vietnamese
Actual: Config shows "vietnamese" but agents use English
Result: FAIL - G1-06

Test: Select "strict" governance level in config
Expected: Incremental validation enabled
Actual: No effect on validation behavior
Result: FAIL - G1-05

Test: Select "retard" user experience
Expected: Strict guardrails, block unsafe actions
Actual: No behavioral change
Result: FAIL - G1-04
```

### Required Remediation Actions

#### R1-01: Enhance Init Command with Configuration Wizard (P0)

**Current State:** install.js has basic prompts (location, project detection)

**Required State:** Full configuration wizard with:
1. User experience level selection (pro/new/retard)
2. Governance level selection (efficient/strict/intelligent)
3. Auto-expert mode selection (default/advanced/autonomous)
4. Research level configuration (MCP server choices)
5. Language confirmation and enforcement

**Implementation Plan:**
```javascript
// Add to install.js after language selection
async function step1_configureUserExperience() {
  print('')
  print('┌─────────────────────────────────────────────────────────────┐')
  print('│  👤 User Experience Level / Cấp Trình Kinh Nghiệm          │')
  print('└─────────────────────────────────────────────────────────────┘')
  print('')
  const isVi = getLocale() === 'vi'

  if (isVi) {
    print('  [1] Pro   - Bạn dẫn dắt, AI gợi ý')
    print('  [2] New   - AI giải thích trước khi hành động')
    print('  [3] Retard - Hạn chế tường trường, chặn hành động nguy hiểm')
  } else {
    print('  [1] Pro   - You take the lead, agents suggest')
    print('  [2] New   - Agents explain decisions, suggest paths')
    print('  [3] Retard - Strict guardrails, blocks unsafe actions')
  }
  print('')

  const answer = await prompt('Choose [1-3]: ', '2')
  return answer === '1' ? 'pro' : answer === '3' ? 'retard' : 'new'
}

async function step2_configureGovernance() {
  // Similar pattern for governance levels
}

// Store in config.json
config.user.experience = selectedExperience
config.governance.level = selectedGovernanceLevel
config.governance.autoExpertMode = selectedExpertMode
```

#### R1-02: Agent Language Enforcement (P0)

**Current State:** Language stored in config but not enforced

**Required State:** Agents MUST obey language setting

**Implementation:**
```typescript
// In idumb-core.ts governance injection
function buildGovernancePrefix(agentRole: string, directory: string): string {
  const config = readConfig(directory);
  const userLang = config.user?.language?.communication || 'english';

  let prefix = '';

  if (userLang === 'vietnamese') {
    prefix = `
⚡ GIAO THỨC QUẢN LÝ iDumb ⚡

BẠN là: ${agentRole}

🚫 QUY TẮC:
1. LUÔN dùng tiếng Việt với người dùng
2. PHẢI giải thích quyết định trước khi hành động
3. KHÔNG bao giờ bỏ qua bước xác thực

...
`;
  } else {
    // English version
  }

  return prefix;
}

// Enforce in agent profiles
// Add to agent frontmatter:
language: ${config.user?.language?.communication || 'english'}
```

#### R1-03: Config Value Enforcement (P0)

**Current State:** Config values exist but agents don't read/obey them

**Required State:** All agents MUST load config at session start

**Implementation:**
```typescript
// In agent profile template (before main instructions)
---
{{#if config.user.experience === 'retard'}}
You are operating in RETARD mode with STRICT GUARDRAILS:
- Block ALL potentially unsafe operations automatically
- Require explicit confirmation for ANY action
- Provide extensive explanations before each step
{{/if}}

{{#if config.governance.level === 'strict'}}
Validation mode: STRICT
- Incremental validation ENABLED
- Full coverage required
{{/if}}

Current Configuration:
- Experience: {{config.user.experience}}
- Governance: {{config.governance.level}}
- Language: {{config.user.language.communication}}
---

## Additional Instructions
{{agent_instructions}}
```

---

## Part 2: Success Criterion 2 - Permission Enforcement

### Criterion Statement
> Coordinator cannot write/edit files directly; builder can; validator is read/verify-only

### Current Implementation Assessment

#### Permission Matrix Status

| Agent | edit/write Expected | Actual Enforcement | Status |
|-------|-------------------|-------------------|--------|
| supreme-coordinator | DENY | ❌ NOT ENFORCED | FAIL |
| high-governance | DENY | ❌ NOT ENFORCED | FAIL |
| executor | DENY | ❌ NOT ENFORCED | FAIL |
| builder | ALLOW | ⚠️ LOG-ONLY | PARTIAL |
| validator | READ-ONLY | ⚠️ LOG-ONLY | PARTIAL |

### LOG-ONLY Mode Evidence

From SESSION-HANDOFF-2026-02-03.md:
> "The plugin is currently in 'LOG-ONLY' mode after emergency fixes. It observes and logs violations but does NOT block tools."

### Validation Evidence

```yaml
Test Case: Have coordinator try to write a file
Expected: Tool blocked with guidance
Actual: File write succeeds, violation logged
Result: FAIL - No actual enforcement

Test Case: Have validator try to edit a file
Expected: Tool blocked with guidance
Actual: File edit succeeds, violation logged
Result: FAIL - No actual enforcement
```

### Required Remediation Actions

#### R2-01: Re-enable Permission Blocking (P0)

**Current State:** Blocking was disabled due to TUI issues

**Required State:** Selective, granular blocking re-enabled

**Strategy:**
1. **Use ALLOW lists instead of DENY** - Be specific about what's allowed
2. **Block only specific tools** - Don't block entire tool categories
3. **Block at agent level** - Not tool level (tool applies to all agents)

**Implementation:**
```typescript
// In tool.execute.before hook
"tool.execute.before": async (input: any, output: any) => {
  const toolName = input.tool;
  const agentRole = detectAgentFromSession();
  const sessionId = input.sessionID || 'unknown';

  // Get agent-specific allowed tools
  const allowedTools = getAllowedTools(agentRole);

  // Check if this specific tool + agent combination is allowed
  if (!allowedTools.includes(toolName)) {
    // Check if there's a more specific rule
    const specificRule = getPermissionRule(agentRole, toolName);

    if (specificRule === 'allow') {
      // Specific allow overrides general deny
      log(directory, `[ALLOW-RULE] ${agentRole} can use ${toolName}`);
      return; // Let it through
    }

    // BLOCK the tool
    log(directory, `[BLOCK] ${agentRole} cannot use ${toolName}`);

    // Modify output to cause graceful failure
    output.tool = toolName;  // Keep tool name for error handling
    output.args = {
      __BLOCKED_BY_GOVERNANCE__: true,
      __AGENT__: agentRole,
      __REASON__: `${agentRole} is not permitted to use ${toolName}`,
      __DELEGATE_TO__: getSuggestedAgent(agentRole, toolName),
      __USE_ALTERNATIVE__: getAlternativeTool(toolName)
    };

    // Store for message transformation
    addPendingDenial(sessionId, {
      agent: agentRole,
      tool: toolName,
      timestamp: new Date().toISOString()
    });
  }
}

// Specific permission rules (most specific first)
function getPermissionRule(agent: string, tool: string): string {
  const rules = [
    // Executor can use bash for testing only
    { agent: 'idumb-executor', tool: 'bash', rule: 'allow-if-validation' },
    // High-governance can use grep for investigation
    { agent: 'idumb-high-governance', tool: 'grep', rule: 'allow' },
    // Default: block
    { agent: 'idumb-high-governance', tool: 'write', rule: 'deny' }
  ];

  return rules.find(r => r.agent === agent && r.tool === tool)?.rule || 'deny';
}
```

#### R2-02: First-Tool Enforcement (P0)

**Current State:** Required first tools tracked but not enforced

**Required State:** Agents MUST use context tools before action tools

**Implementation:**
```typescript
// Track first tool usage
if (!tracker.firstToolUsed) {
  const requiredFirst = getRequiredFirstTools(agentRole);

  if (!requiredFirst.includes(toolName)) {
    // BLOCK until context tools used
    log(directory, `[VIOLATION] ${agentRole} used ${toolName} before context tools`);

    output.args = {
      __BLOCKED_BY_GOVERNANCE__: true,
      __REASON__: `You MUST use context tools first: ${requiredFirst.join(', ')}`,
      __REQUIRED_FIRST__: requiredFirst
    };

    addPendingDenial(sessionId, { agent: agentRole, tool: toolName });
    return;
  }

  tracker.firstToolUsed = true;
  tracker.firstToolName = toolName;
}
```

---

## Part 3: Success Criterion 3 - Validation Results

### Criterion Statement
> Any governance run produces an explicit validation result (pass/fail/partial) with evidence path references

### Current Implementation Assessment

#### Validation Tool Status

| Validation Type | Implemented | Evidence Output | Status |
|-----------------|------------|-----------------|--------|
| Structure validation | ✓ | `.idumb/governance/validations/*.json` | PARTIAL |
| Schema validation | ✓ | Same as above | PARTIAL |
| Freshness check | ✓ | Same as above | PARTIAL |
| Integration points | ✓ | Same as above | PARTIAL |
| Chain rules | ✓ | Logged to history | PARTIAL |

#### Gap Analysis

| Gap ID | Issue | Impact |
|--------|-------|--------|
| **G3-01** | No validation result consumed by agents | Agents ignore validation results |
| **G3-02** | No integration with workflow execution | Validation happens but doesn't affect behavior |
| **G3-03** | No remediation recommendations on failure | Just pass/fail, no "what to do next" |
| **G3-04** | No evidence path references | Results exist but not linked to artifacts |

### Required Remediation Actions

#### R3-01: Validation Result Integration (P0)

**Current State:** Validation runs but results not acted upon

**Required State:** Validation results must:
1. Be checked before major operations
2. Block operations if validation fails
3. Provide remediation guidance

**Implementation:**
```typescript
// Add validation check before critical operations
async function validateBeforeOperation(operation: string, directory: string) {
  const validationResult = await validate(directory, 'default');

  if (validationResult.result === 'fail') {
    // BLOCK the operation
    log(directory, `[BLOCKED] Validation failed before ${operation}`);

    // Provide remediation
    const failures = validationResult.checks.filter(c => c.status === 'fail');
    throw new ValidationError(
      `Cannot proceed: validation failed`,
      {
        operation,
        failures: failures.map(f => ({
          check: f.name,
          reason: f.message,
          evidence: f.evidence
        })),
        remediation: generateRemediation(failures)
      }
    );
  }
}

// Example remediation generator
function generateRemediation(failures: ValidationError[]): string {
  return `
Validation Failures Detected:

${failures.map((f, i) => `
${i + 1}. ${f.check} FAILED
   Reason: ${f.reason}
   Evidence: ${f.evidence}
   Fix: ${getFixSuggestion(f.check)}
`).join('\n')}

Run /idumb:validate to retry after fixes.
  `.trim();
}
```

#### R3-02: Evidence Path References (P1)

**Current State:** Validation results lack artifact links

**Required State:** Each validation must reference:
- File paths checked
- Line numbers (when applicable)
- Commit hashes (when relevant)
- Related artifacts

**Implementation:**
```typescript
interface ValidationCheck {
  name: string
  status: 'pass' | 'fail' | 'warn'
  evidence: {
    files: string[]           // Paths checked
    lines?: number[]          // Line numbers
    commits?: string[]        // Git commits
    artifacts: string[]       // Related artifacts
    timestamps: string[]      // When checked
  }
  message: string
}

// Example validation result
{
  "check": "state.json schema validation",
  "status": "pass",
  "evidence": {
    "files": [".idumb/brain/state.json"],
    "artifacts": ["state-v0.3.0-schema.json"],
    "timestamps": ["2026-02-04T10:30:00Z"]
  },
  "message": "Schema valid"
}
```

---

## Part 4: Cross-Cutting Issues

### Issue C4-01: Non-Sensical Config Values

**Finding:** Config contains values that nothing reads or enforces.

| Config Field | Current Behavior | Required Behavior |
|--------------|-----------------|-------------------|
| `governance.level` | Stored, ignored | Enforced in agents |
| `user.experience` | Stored, ignored | Affects guardrails |
| `language.enforcement` | Stored, ignored | Enforced in all agents |
| `hierarchy.enforceChain` | Stored, ignored | Blocks violations |

**Fix:** Map all config values to enforcement points.

### Issue C4-02: No Integration Points

**Finding:** Phase 1 components exist but don't integrate.

| Component | Integration Status | Required |
|-----------|-------------------|----------|
| `idumb-state.ts` tool | ✓ Created | ✓ Integrated |
| `idumb-validate.ts` tool | ✓ Created | ⚠️ Partially integrated |
| `idumb-config.ts` tool | ✓ Created | ❌ Not integrated |
| `idumb-manifest.ts` tool | ✓ Created | ❌ Not integrated |
| `idumb-todo.ts` tool | ✓ Created | ⚠️ Partially integrated |
| `idumb-core.ts` plugin | ✓ Created | ⚠️ LOG-ONLY mode |

**Fix:** Complete integration loop.

### Issue C4-03: Documentation Not Aligned with Code

**Finding:** Docs say one thing, code does another.

**Examples:**
- `AGENTS.md` says coordinators delegate only - but they can execute (no blocking)
- `IMPLEMENTATION-GUIDE.md` describes enforcement - but it's in LOG-ONLY mode
- `ROADMAP.md` shows Phase 1 not started - but components exist

**Fix:** Update docs or implement to match.

---

## Part 5: Remediation Priority Matrix

### Sprint 1 (Week 1-2) - Critical Path

| Task | Effort | Impact | Dependencies |
|------|--------|-------|--------------|
| R1-03: Config value enforcement | 3 days | HIGH | None |
| R2-01: Re-enable permission blocking | 5 days | HIGH | R1-03 |
| R1-02: Agent language enforcement | 2 days | HIGH | R1-03 |
| R3-01: Validation integration | 3 days | HIGH | R2-01 |

### Sprint 2 (Week 3) - High Priority

| Task | Effort | Impact | Dependencies |
|------|--------|-------|--------------|
| R1-01: Enhanced init wizard | 4 days | MEDIUM | None |
| R2-02: First-tool enforcement | 2 days | MEDIUM | R2-01 |
| R3-02: Evidence path references | 2 days | MEDIUM | R3-01 |
| C4-01: Fix non-sensical configs | 2 days | MEDIUM | R1-03 |

### Sprint 3 (Week 4) - Medium Priority

| Task | Effort | Impact | Dependencies |
|------|--------|-------|--------------|
| C4-02: Complete integration | 5 days | MEDIUM | Sprint 1 |
| C4-03: Update documentation | 3 days | LOW | Sprint 2 |

---

## Part 6: Validation Test Plan

### Test Cases for Phase 1 Completion

```yaml
Test Suite: Phase 1 Governance Core Validation

TC-INIT-01: Language Enforcement
  Given: User selects Vietnamese during init
  When: Agent responds to user
  Then: Response must be in Vietnamese
  Status: ❌ FAIL

TC-INIT-02: Governance Level Selection
  Given: User selects "strict" governance
  When: Validation runs
  Then: Incremental validation must be enabled
  Status: ❌ FAIL

TC-PERM-01: Coordinator Cannot Write
  Given: supreme-coordinator agent active
  When: Agent attempts write operation
  Then: Operation blocked with guidance
  Status: ❌ FAIL

TC-PERM-02: Builder Can Write
  Given: builder agent active
  When: Agent attempts write operation
  Then: Operation succeeds
  Status: ⚠️ PARTIAL

TC-PERM-03: Validator Read-Only
  Given: low-validator agent active
  When: Agent attempts write operation
  Then: Operation blocked
  Status: ❌ FAIL

TC-VAL-01: Validation Produces Result
  Given: /idumb:validate command executed
  When: Validation completes
  Then: Explicit pass/fail/partial with evidence
  Status: ⚠️ PARTIAL

TC-VAL-02: Validation Blocks on Fail
  Given: Validation failed
  When: User attempts execute-phase
  Then: Operation blocked with remediation
  Status: ❌ FAIL
```

---

## Part 7: Conclusion

### Phase 1 Status: ❌ NOT COMPLETE

**Summary:** Phase 1 has foundational components in place but critical enforcement mechanisms are disabled or incomplete. The system can initialize governance state but cannot enforce governance rules.

**Path to Complete:**
1. Enable selective, granular permission blocking (5 days)
2. Integrate config values with agent behavior (3 days)
3. Add validation result consumption (3 days)
4. Enhance init command with configuration wizard (4 days)

**Estimated Time to Complete Phase 1:** 15 working days

**Risks:**
- TUI breakage from blocking (mitigation: use ALLOW lists, test extensively)
- Performance overhead from hook checks (mitigation: cache lookups, optimize hot paths)
- Config complexity overwhelming users (mitigation: smart defaults, progressive disclosure)

---

**Document Version:** 1.0.0
**Last Updated:** 2026-02-04
**Next Review:** After Sprint 1 completion
**Status:** Ready for remediation

---

## Appendix: File References

| File | Purpose | Status |
|------|---------|--------|
| `.plugin-dev/research/SESSION-STATES-RESEARCH-2026-02-04.md` | Session state analysis | ✓ Complete |
| `.plugin-dev/research/ITERATION-LIMITS-LOOP-TERMINATION-2026-02-04.md` | Loop termination research | ✓ Complete |
| `.plugin-dev/research/GIT-INTEGRATION-PATTERNS-2026-02-04.md` | Git integration patterns | ✓ Complete |
| `.plugin-dev/research/PERMISSION-ENTITY-MATRIX.md` | Permission analysis | ✓ Complete |
| `src/plugins/idumb-core.ts` | Core plugin implementation | ⚠️ LOG-ONLY mode |
| `bin/install.js` | Init/installer | ⚠️ Missing configuration |
| `.plugin-dev/ROADMAP.md` | Project roadmap | ⚠️ Phase 1 incomplete |
