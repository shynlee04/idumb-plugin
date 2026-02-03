# 01-05-PLAN: Validation Matrix Enforcement Implementation

> **Phase:** 01-contracts-first-governance-core  
> **Plan ID:** 01-05  
> **Status:** READY  
> **Created:** 2026-02-03  
> **Owner:** @idumb-planner  
> **Estimated Duration:** 6 hours

---

## Objective

Convert existing validation YAML documents into executable enforcement code. The `chain-enforcement.md` defines rules but NOTHING implements them. This plan bridges the gap between documentation and runtime enforcement.

---

## Current State Analysis

### What Exists (Documentation):
| Artifact | Location | Status |
|----------|----------|--------|
| Chain enforcement rules | `template/router/chain-enforcement.md` | ✅ Defined, ❌ Not enforced |
| Validation tools | `template/tools/idumb-validate.ts` | ✅ Outputs results, ❌ Ignored |
| Core plugin hooks | `template/plugins/idumb-core.ts` | ✅ Tool interception, ❌ No command chain |

### What's Missing (Implementation):
1. **Chain enforcement in `command.execute.before`** - Currently just logs commands
2. **Validation output consumption** - Results are returned but nothing acts on failures
3. **Integration point counting** - No mechanism to enforce minimum integrations
4. **Schema validation** - No YAML/JSON structure enforcement at runtime

---

## Implementation Plan

```yaml
implementation_plan:
  # ═══════════════════════════════════════════════════════════════════════════
  # PART 1: CHAIN ENFORCEMENT IMPLEMENTATION
  # ═══════════════════════════════════════════════════════════════════════════
  part_1_chain_enforcement:
    location: "template/plugins/idumb-core.ts:1319-1335"
    hook: "command.execute.before"
    
    existing_code: |
      "command.execute.before": async (input, output) => {
        try {
          const { command } = input
          if (command.startsWith("idumb:") || command.startsWith("idumb-")) {
            log(directory, `[CMD] iDumb command starting: ${command}`)
          }
          // DO NOT modify output.parts - let commands execute cleanly
        } catch (error) {
          log(directory, `[ERROR] command.execute.before failed`)
        }
      }
    
    new_implementation:
      step_1_parse_chain_rules:
        description: "Load and parse chain-enforcement.md YAML rules"
        code_location: "New function: parseChainRules()"
        output: "ChainRules object with MUST-BEFORE mappings"
        
      step_2_check_prerequisites:
        description: "Validate MUST-BEFORE conditions for the command"
        checks:
          - file_exists: "existsSync(path)"
          - state_condition: "Parse state.json, evaluate condition"
          - validation_age: "Compare timestamps"
        code_location: "New function: checkPrerequisites(command, rules)"
        
      step_3_enforcement_action:
        description: "Take action on violation"
        actions:
          HARD_BLOCK:
            behavior: "Stop execution, inject error message"
            output_modification: "output.parts = [{type: 'text', text: errorMessage}]"
            continue: false
          SOFT_BLOCK:
            behavior: "Check for --force flag"
            output_modification: "Warn, then continue if --force present"
            continue: "args includes '--force'"
          WARN:
            behavior: "Log warning, continue"
            output_modification: "output.parts.unshift({type: 'text', text: warning})"
            continue: true
            
      step_4_log_violation:
        description: "Record violation in state.json history"
        code_location: "Existing: addHistoryEntry()"
        
    changes:
      - file: "template/plugins/idumb-core.ts"
        action: "Add new interface ChainRules"
        lines: "~50"
        
      - file: "template/plugins/idumb-core.ts"
        action: "Add parseChainRules() function"
        lines: "~70"
        
      - file: "template/plugins/idumb-core.ts"
        action: "Add checkPrerequisites() function"
        lines: "~80"
        
      - file: "template/plugins/idumb-core.ts"
        action: "Modify command.execute.before hook"
        lines: "1319-1335"
        
    test_cases:
      - name: "INIT-01: Block /idumb:roadmap without state.json"
        input: "Command: /idumb:roadmap, No .idumb/brain/state.json"
        expected: "HARD_BLOCK, redirect to /idumb:init"
        
      - name: "PROJ-01: Block /idumb:roadmap without PROJECT.md"
        input: "Command: /idumb:roadmap, No .planning/PROJECT.md"
        expected: "HARD_BLOCK, message about missing PROJECT.md"
        
      - name: "Allow readonly commands without state"
        input: "Command: /idumb:help"
        expected: "PASS (exception list)"
        
      - name: "SOFT_BLOCK with --force"
        input: "Command: /idumb:plan-phase --force, missing CONTEXT.md"
        expected: "WARN, continue execution"

  # ═══════════════════════════════════════════════════════════════════════════
  # PART 2: TOOL OUTPUT CONSUMPTION
  # ═══════════════════════════════════════════════════════════════════════════
  part_2_output_consumption:
    principle: "Validation tool outputs MUST be consumed and acted upon"
    
    per_tool:
      idumb-validate_structure:
        output_type: |
          {
            overall: "pass" | "fail" | "warning",
            checks: ValidationResult[]
          }
        consumer: "command.execute.before OR tool.execute.after"
        blocking_condition: "overall === 'fail'"
        blocking_logic: |
          Location: idumb-core.ts, new function consumeValidationResult()
          
          Action on fail:
          1. Log violation to state.json history
          2. Store in pendingViolations map (like pendingDenials)
          3. In tool.execute.after, if pendingViolation exists:
             - Replace output with actionable error
             - Include recovery steps
             - Block further execution
        
      idumb-validate_schema:
        output_type: |
          {
            overall: "pass" | "fail",
            checks: ValidationResult[]
          }
        consumer: "Called during init, sync, and phase transitions"
        blocking_condition: "Missing required fields: version, framework, phase"
        blocking_logic: |
          Location: idumb-core.ts, session.created event handler
          
          On session.created:
          1. Call idumb-validate_schema internally
          2. If fail, inject governance warning in first message
          3. Force /idumb:init before any other command
          
      idumb-validate_freshness:
        output_type: |
          {
            overall: "pass" | "warning",
            staleFiles: string[]
          }
        consumer: "session.created and command.execute.before"
        blocking_condition: "Never blocks, always warns"
        blocking_logic: |
          Location: idumb-core.ts, buildGovernancePrefix()
          
          Action on stale:
          1. Append staleness warning to governance prefix
          2. Suggest /idumb:validate to verify current state
          
      idumb-validate_planningAlignment:
        output_type: |
          {
            overall: "pass" | "warning" | "fail",
            planningPresent: boolean
          }
        consumer: "config sync operations"
        blocking_condition: "fail when framework mismatch detected"
        blocking_logic: |
          Location: idumb-core.ts, tool.execute.after for idumb-config_sync
          
          On mismatch:
          1. Warn user about misalignment
          2. Suggest running /idumb:init to realign
          
      idumb-validate (full):
        output_type: |
          {
            timestamp: string,
            overall: "pass" | "fail" | "warning",
            critical: string[],
            warnings: string[],
            checks: ValidationResult[]
          }
        consumer: "Phase transitions, verify-work, commit operations"
        blocking_condition: "critical.length > 0"
        blocking_logic: |
          Location: idumb-core.ts, command.execute.before for phase commands
          
          On critical failures:
          1. HARD_BLOCK phase transition
          2. Display critical issues list
          3. Require resolution before continuing
          
    implementation_changes:
      - file: "template/plugins/idumb-core.ts"
        action: "Add pendingViolations Map (like pendingDenials)"
        
      - file: "template/plugins/idumb-core.ts"
        action: "Add consumeValidationResult() function"
        
      - file: "template/plugins/idumb-core.ts"
        action: "Add runValidation() internal caller"
        
      - file: "template/plugins/idumb-core.ts"
        action: "Modify session.created to run schema validation"
        
      - file: "template/plugins/idumb-core.ts"
        action: "Modify tool.execute.after to handle pendingViolations"

  # ═══════════════════════════════════════════════════════════════════════════
  # PART 3: INTEGRATION POINT ENFORCEMENT
  # ═══════════════════════════════════════════════════════════════════════════
  part_3_integration_points:
    description: "Ensure artifacts have minimum integration points"
    
    tiers:
      tier_1_agent:
        type: "Agent markdown files"
        minimum_integrations: 2
        required_integrations:
          - "At least 1 delegation target (permission.task)"
          - "At least 1 tool reference"
        location: "template/agents/idumb-*.md"
        
      tier_2_command:
        type: "Command markdown files"
        minimum_integrations: 1
        required_integrations:
          - "agent: field must reference valid agent"
        location: "template/commands/idumb/*.md"
        
      tier_3_tool:
        type: "Tool TypeScript files"
        minimum_integrations: 1
        required_integrations:
          - "Must export at least one tool() function"
        location: "template/tools/idumb-*.ts"
        
      tier_4_artifact:
        type: "Planning artifacts (PLAN.md, SUMMARY.md)"
        minimum_integrations: 0
        optional_integrations:
          - "depends_on references valid plans"
          - "files_modified references real files"
        location: ".planning/phases/**/*.md"
        
    validation_code:
      location: "template/tools/idumb-validate.ts"
      new_export: "integrationPoints"
      
      implementation: |
        export const integrationPoints = tool({
          description: "Validate integration point count per artifact tier",
          args: {
            tier: tool.schema.string().optional()
              .describe("Specific tier: agent, command, tool, artifact")
          },
          async execute(args, context) {
            // Tier-specific validation logic
            const results = {
              agents: await validateAgentIntegrations(context.directory),
              commands: await validateCommandIntegrations(context.directory),
              tools: await validateToolIntegrations(context.directory),
              artifacts: await validateArtifactIntegrations(context.directory)
            }
            
            return JSON.stringify({
              overall: calculateOverall(results),
              tiers: results
            })
          }
        })
        
    when_validation_runs:
      - trigger: "session.created (first time only)"
        action: "Warn if integration count below minimum"
        
      - trigger: "artifact creation (write/edit of tracked files)"
        action: "Validate new artifact has required integrations"
        
      - trigger: "/idumb:validate command"
        action: "Full integration point audit"
        
    failure_behavior:
      agent_missing_delegation:
        severity: "WARN"
        message: "Agent {name} has no delegation targets. Consider adding permission.task entries."
        
      command_missing_agent:
        severity: "FAIL"
        message: "Command {name} has no agent binding. Add 'agent: idumb-*' to frontmatter."
        
      tool_no_exports:
        severity: "FAIL"
        message: "Tool file {name} exports no tool() functions. Not loadable by OpenCode."

  # ═══════════════════════════════════════════════════════════════════════════
  # PART 4: SCHEMA VALIDATION
  # ═══════════════════════════════════════════════════════════════════════════
  part_4_schema:
    principle: "All artifacts must conform to defined schemas"
    
    artifact_schemas:
      agent_frontmatter:
        required_fields:
          - description: "string, non-empty"
          - mode: "string, one of: primary, subagent, all"
          - permission: "object with task, bash keys"
        optional_fields:
          - temperature: "number, 0.0-2.0"
          - maxTokens: "number, positive"
        validation_timing: "read time (on agent load)"
        location: "template/agents/idumb-*.md"
        
      command_frontmatter:
        required_fields:
          - description: "string, non-empty"
          - agent: "string, must match existing agent"
        optional_fields:
          - category: "string"
          - mode: "string"
        validation_timing: "read time (on command load)"
        location: "template/commands/idumb/*.md"
        
      plan_frontmatter:
        required_fields:
          - phase: "string"
          - plan: "string"
          - status: "string, one of: pending, in_progress, complete, blocked"
        optional_fields:
          - wave: "number"
          - depends_on: "string[]"
          - files_modified: "string[]"
          - autonomous: "boolean"
          - must_haves: "string[]"
        validation_timing: "read time (on phase execution)"
        location: ".planning/phases/**/*PLAN.md"
        
      summary_frontmatter:
        required_fields:
          - phase: "string"
          - plan: "string"
          - status: "string"
        optional_fields:
          - completed_at: "string (ISO)"
          - files_created: "string[]"
          - files_modified: "string[]"
        validation_timing: "write time (after plan execution)"
        location: ".planning/phases/**/*SUMMARY.md"
        
    config_schemas:
      idumb_state_json:
        required_fields:
          - version: "string"
          - initialized: "string (ISO)"
          - framework: "string, one of: bmad, planning, idumb, custom, none"
          - phase: "string"
        optional_fields:
          - lastValidation: "string (ISO) | null"
          - validationCount: "number"
          - anchors: "Anchor[]"
          - history: "HistoryEntry[]"
        validation_timing: "read/write time"
        location: ".idumb/brain/state.json"
        
      idumb_config_json:
        required_fields:
          - version: "string"
          - initialized: "string (ISO)"
          - user: "object with name, experience, language"
          - hierarchy: "object with levels, agents"
        optional_fields:
          - status: "object"
          - automation: "object"
          - paths: "object"
          - staleness: "object"
          - timestamps: "object"
          - enforcement: "object"
        validation_timing: "read/write time"
        location: ".idumb/config.json"
        
    validation_implementation:
      location: "template/tools/idumb-validate.ts"
      new_exports:
        - "frontmatter" - Validate YAML frontmatter in markdown files
        - "configSchema" - Validate JSON config files
        
      frontmatter_validator: |
        export const frontmatter = tool({
          description: "Validate YAML frontmatter against artifact schema",
          args: {
            path: tool.schema.string().describe("Path to markdown file"),
            type: tool.schema.string().describe("Type: agent, command, plan, summary")
          },
          async execute(args, context) {
            const content = readFileSync(join(context.directory, args.path), 'utf8')
            const frontmatter = extractFrontmatter(content)
            const schema = getSchemaForType(args.type)
            return validateAgainstSchema(frontmatter, schema)
          }
        })
        
    error_messages:
      missing_required_field: |
        ❌ SCHEMA VIOLATION: {artifact_type}
        
        Missing required field: {field_name}
        Expected: {field_type}
        Location: {file_path}
        
        To fix:
        1. Open {file_path}
        2. Add '{field_name}: {example_value}' to frontmatter
        
      invalid_field_value: |
        ❌ SCHEMA VIOLATION: {artifact_type}
        
        Invalid value for field: {field_name}
        Got: {actual_value}
        Expected: {expected_type}
        Location: {file_path}
        
      recovery_steps:
        - "Run /idumb:validate to see all schema issues"
        - "Use idumb-validate_schema to check specific files"
        - "Fix issues before continuing with phase execution"

  # ═══════════════════════════════════════════════════════════════════════════
  # IMPLEMENTATION ORDER (Prioritized)
  # ═══════════════════════════════════════════════════════════════════════════
  implementation_order:
    priority_1_blocking:
      - id: "P1-1"
        task: "Add ChainRules interface and parseChainRules() function"
        file: "idumb-core.ts"
        effort: "30m"
        blocks: ["P1-2", "P1-3"]
        
      - id: "P1-2"
        task: "Add checkPrerequisites() function"
        file: "idumb-core.ts"
        effort: "45m"
        blocks: ["P1-3"]
        
      - id: "P1-3"
        task: "Modify command.execute.before to enforce chain rules"
        file: "idumb-core.ts"
        effort: "1h"
        blocks: []
        
    priority_2_consumption:
      - id: "P2-1"
        task: "Add pendingViolations Map and consumeValidationResult()"
        file: "idumb-core.ts"
        effort: "30m"
        blocks: ["P2-2"]
        
      - id: "P2-2"
        task: "Add runValidation() internal caller"
        file: "idumb-core.ts"
        effort: "45m"
        blocks: ["P2-3", "P2-4"]
        
      - id: "P2-3"
        task: "Modify session.created to run schema validation"
        file: "idumb-core.ts"
        effort: "30m"
        blocks: []
        
      - id: "P2-4"
        task: "Modify tool.execute.after to handle pendingViolations"
        file: "idumb-core.ts"
        effort: "30m"
        blocks: []
        
    priority_3_integration:
      - id: "P3-1"
        task: "Add validateAgentIntegrations() function"
        file: "idumb-validate.ts"
        effort: "45m"
        blocks: ["P3-4"]
        
      - id: "P3-2"
        task: "Add validateCommandIntegrations() function"
        file: "idumb-validate.ts"
        effort: "30m"
        blocks: ["P3-4"]
        
      - id: "P3-3"
        task: "Add validateToolIntegrations() function"
        file: "idumb-validate.ts"
        effort: "30m"
        blocks: ["P3-4"]
        
      - id: "P3-4"
        task: "Export integrationPoints tool"
        file: "idumb-validate.ts"
        effort: "15m"
        blocks: []
        
    priority_4_schema:
      - id: "P4-1"
        task: "Define schema interfaces for all artifact types"
        file: "idumb-validate.ts"
        effort: "30m"
        blocks: ["P4-2"]
        
      - id: "P4-2"
        task: "Add extractFrontmatter() and validateAgainstSchema()"
        file: "idumb-validate.ts"
        effort: "45m"
        blocks: ["P4-3"]
        
      - id: "P4-3"
        task: "Export frontmatter and configSchema validation tools"
        file: "idumb-validate.ts"
        effort: "30m"
        blocks: []

  # ═══════════════════════════════════════════════════════════════════════════
  # ESTIMATED CHANGES
  # ═══════════════════════════════════════════════════════════════════════════
  estimated_changes:
    files:
      - path: "template/plugins/idumb-core.ts"
        additions: "~200 lines"
        modifications: "~50 lines"
        
      - path: "template/tools/idumb-validate.ts"
        additions: "~300 lines"
        modifications: "~20 lines"
        
    summary:
      total_files: 2
      total_additions: "~500 lines"
      total_modifications: "~70 lines"
      total_effort: "6 hours"
```

---

## Tasks

<task id="01-05-T1" priority="P0">
### Task 1: Chain Rule Parser

**Objective:** Parse chain-enforcement.md YAML rules into executable code.

**Acceptance Criteria:**
- [ ] ChainRules interface defined with rule types
- [ ] parseChainRules() reads and parses YAML from markdown
- [ ] Rule matching by command pattern (glob-style)
- [ ] Prerequisite types: file_exists, state_condition, validation_age

**Implementation Notes:**
```typescript
interface ChainRule {
  id: string
  command: string  // Pattern like "/idumb:*" or "/idumb:roadmap"
  mustBefore: Prerequisite[]
  shouldBefore?: Prerequisite[]
  onViolation: ViolationAction
  except?: string[]
}

interface Prerequisite {
  type: 'file_exists' | 'state_condition' | 'validation_age' | 'one_of'
  path?: string
  condition?: string
  maxAgeMinutes?: number
  options?: Prerequisite[]
}

interface ViolationAction {
  action: 'redirect' | 'block' | 'warn'
  target?: string
  message: string
  continue?: boolean
}
```

**Estimated Effort:** 1 hour  
**Delegated To:** idumb-builder
</task>

---

<task id="01-05-T2" priority="P0">
### Task 2: Chain Enforcement in command.execute.before

**Objective:** Implement actual enforcement logic in the command hook.

**Acceptance Criteria:**
- [ ] checkPrerequisites() evaluates all mustBefore conditions
- [ ] HARD_BLOCK stops execution and injects error
- [ ] SOFT_BLOCK checks for --force flag
- [ ] WARN logs and continues
- [ ] Violations logged to state.json history

**Implementation Location:** `idumb-core.ts:1319-1335`

**Before:**
```typescript
"command.execute.before": async (input, output) => {
  // Just logs, no enforcement
}
```

**After:**
```typescript
"command.execute.before": async (input, output) => {
  const { command, arguments: args } = input
  
  // Skip readonly commands
  if (READONLY_COMMANDS.includes(command)) return
  
  // Load chain rules
  const rules = parseChainRules(directory)
  const matchingRules = rules.filter(r => matchCommand(command, r.command, r.except))
  
  for (const rule of matchingRules) {
    const result = checkPrerequisites(directory, rule.mustBefore)
    
    if (!result.passed) {
      const action = rule.onViolation
      
      if (action.action === 'block') {
        // HARD_BLOCK
        output.parts = [{
          type: 'text',
          text: buildBlockMessage(rule, result.violations)
        }]
        return  // Stop execution
      }
      
      if (action.action === 'redirect' && !args.includes('--force')) {
        // SOFT_BLOCK
        output.parts = [{
          type: 'text',
          text: buildRedirectMessage(rule, action.target)
        }]
        return
      }
      
      // WARN
      output.parts.unshift({
        type: 'text',
        text: buildWarnMessage(rule, result.violations)
      })
    }
  }
}
```

**Estimated Effort:** 1 hour  
**Delegated To:** idumb-builder
</task>

---

<task id="01-05-T3" priority="P1">
### Task 3: Validation Output Consumption

**Objective:** Make validation tool outputs block execution when they fail.

**Acceptance Criteria:**
- [ ] pendingViolations Map added (parallel to pendingDenials)
- [ ] consumeValidationResult() categorizes and stores results
- [ ] tool.execute.after checks pendingViolations
- [ ] Failed validations replace output with actionable errors

**Key Insight:** The validation tools already return structured JSON. We just need to:
1. Store results in pendingViolations
2. Check in tool.execute.after
3. Replace output if validation failed

**Implementation:**
```typescript
const pendingViolations = new Map<string, {
  tool: string
  timestamp: string
  overall: 'fail' | 'warning'
  critical: string[]
  message: string
}>()

// In tool.execute.after, after idumb-validate* tools:
if (toolName.startsWith('idumb-validate')) {
  try {
    const result = JSON.parse(output.output)
    if (result.overall === 'fail') {
      pendingViolations.set(sessionId, {
        tool: toolName,
        timestamp: new Date().toISOString(),
        overall: 'fail',
        critical: result.critical || [],
        message: buildValidationFailureMessage(result)
      })
    }
  } catch {}
}

// Later checks can then use pendingViolations
```

**Estimated Effort:** 1 hour  
**Delegated To:** idumb-builder
</task>

---

<task id="01-05-T4" priority="P1">
### Task 4: Integration Point Validator

**Objective:** Add tool to count and enforce minimum integration points.

**Acceptance Criteria:**
- [ ] validateAgentIntegrations() checks agents have delegation targets
- [ ] validateCommandIntegrations() checks commands have agent binding
- [ ] validateToolIntegrations() checks tools export functions
- [ ] integrationPoints tool combines all checks

**New Exports in idumb-validate.ts:**
```typescript
export const integrationPoints = tool({
  description: "Validate integration point count per artifact tier",
  args: {
    tier: tool.schema.string().optional()
  },
  async execute(args, context) {
    // Implementation
  }
})
```

**Estimated Effort:** 1.5 hours  
**Delegated To:** idumb-builder
</task>

---

<task id="01-05-T5" priority="P2">
### Task 5: Schema Validation Tools

**Objective:** Add tools to validate YAML frontmatter and JSON schemas.

**Acceptance Criteria:**
- [ ] extractFrontmatter() parses YAML from markdown
- [ ] validateAgainstSchema() checks required/optional fields
- [ ] frontmatter tool exported for agent/command/plan validation
- [ ] configSchema tool exported for state.json/config.json validation

**New Exports in idumb-validate.ts:**
```typescript
export const frontmatter = tool({
  description: "Validate YAML frontmatter against artifact schema",
  args: {
    path: tool.schema.string(),
    type: tool.schema.string()
  },
  async execute(args, context) {
    // Implementation
  }
})

export const configSchema = tool({
  description: "Validate JSON config file against schema",
  args: {
    configType: tool.schema.string().describe("state, config")
  },
  async execute(args, context) {
    // Implementation
  }
})
```

**Estimated Effort:** 1 hour  
**Delegated To:** idumb-builder
</task>

---

## Success Criteria

| Metric | Target |
|--------|--------|
| Chain rules parsed from YAML | All rules in chain-enforcement.md |
| Commands with prerequisite enforcement | All /idumb:* except readonly |
| Validation output consumers | All 5 validation tools |
| Integration point validators | 3 (agent, command, tool) |
| Schema validators | 2 (frontmatter, configSchema) |
| HARD_BLOCK enforced | INIT-01, PHASE-01, VAL-01 |
| SOFT_BLOCK with --force | PROJ-01 |

---

## Dependencies

| Dependency | Source | Required For |
|------------|--------|--------------|
| chain-enforcement.md | template/router/ | Task 1, 2 |
| idumb-validate.ts | template/tools/ | Task 3, 4, 5 |
| idumb-core.ts | template/plugins/ | Task 1, 2, 3 |
| OpenCode plugin API | @opencode-ai/plugin | All tasks |

---

## Rollback Plan

If implementation causes issues:
1. Chain enforcement can be disabled by returning early from hook
2. Validation consumption can be disabled by clearing pendingViolations
3. New tools can be unexported without breaking existing functionality
4. All changes are additive, existing behavior preserved as fallback

---

## Sign-off

- [ ] All tasks completed
- [ ] Test cases pass
- [ ] No breaking changes to existing functionality
- [ ] Documentation updated

**Completed By:** _pending_  
**Completion Date:** _pending_

---

*Created by @idumb-planner | 2026-02-03*
