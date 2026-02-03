# 01-05-IMPL: Validation Matrix Code Specification

> **Companion to:** 01-05-PLAN-validation-matrix-enforcement-2026-02-03.md  
> **Purpose:** Exact code changes for builder agent execution  
> **Created:** 2026-02-03

---

## File 1: template/plugins/idumb-core.ts

### Insert Location: After line ~50 (after existing interfaces)

```typescript
// ============================================================================
// CHAIN ENFORCEMENT TYPES (from chain-enforcement.md)
// ============================================================================

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

interface ChainRule {
  id: string
  command: string  // Pattern like "/idumb:*" or "/idumb:roadmap"
  mustBefore: Prerequisite[]
  shouldBefore?: Prerequisite[]
  onViolation: ViolationAction
  except?: string[]
}

interface PrerequisiteResult {
  passed: boolean
  violations: string[]
}

// Commands that bypass chain enforcement
const READONLY_COMMANDS = [
  'idumb:status',
  'idumb:help',
  'idumb:validate',
  'idumb-help',
  'idumb-status'
]
```

### Insert Location: After line ~115 (after pendingDenials)

```typescript
// Pending validation violations for blocking
const pendingViolations = new Map<string, {
  tool: string
  timestamp: string
  overall: 'fail' | 'warning'
  critical: string[]
  message: string
}>()
```

### Insert Location: After line ~425 (new function section)

```typescript
// ============================================================================
// CHAIN ENFORCEMENT FUNCTIONS
// ============================================================================

/**
 * Parse chain rules from chain-enforcement.md
 * NOTE: For now, hardcoded rules. Future: parse YAML from markdown file.
 */
function getChainRules(): ChainRule[] {
  return [
    // INIT-01: No commands without init (except init, help)
    {
      id: 'INIT-01',
      command: 'idumb:*',
      mustBefore: [
        { type: 'file_exists', path: '.idumb/brain/state.json' }
      ],
      except: ['idumb:init', 'idumb:help', 'idumb-init', 'idumb-help'],
      onViolation: {
        action: 'redirect',
        target: 'idumb:init',
        message: 'iDumb not initialized. Run /idumb:init first.'
      }
    },
    // PROJ-01: Roadmap requires PROJECT.md
    {
      id: 'PROJ-01',
      command: 'idumb:roadmap',
      mustBefore: [
        { type: 'file_exists', path: '.planning/PROJECT.md' }
      ],
      onViolation: {
        action: 'block',
        message: 'PROJECT.md required. Create project definition first.'
      }
    },
    // PROJ-02: discuss-phase requires ROADMAP.md
    {
      id: 'PROJ-02',
      command: 'idumb:discuss-phase',
      mustBefore: [
        { type: 'file_exists', path: '.planning/ROADMAP.md' }
      ],
      onViolation: {
        action: 'redirect',
        target: 'idumb:roadmap',
        message: 'ROADMAP.md required. Run /idumb:roadmap first.'
      }
    },
    // PHASE-01: execute-phase requires PLAN.md
    {
      id: 'PHASE-01',
      command: 'idumb:execute-phase',
      mustBefore: [
        { type: 'file_exists', path: '.planning/phases/{phase}/*PLAN.md' }
      ],
      onViolation: {
        action: 'redirect',
        target: 'idumb:plan-phase',
        message: 'PLAN.md required. Run /idumb:plan-phase first.'
      }
    },
    // PHASE-02: execute-phase should have CONTEXT.md (warn only)
    {
      id: 'PHASE-02',
      command: 'idumb:execute-phase',
      shouldBefore: [
        { type: 'file_exists', path: '.planning/phases/{phase}/*CONTEXT.md' }
      ],
      mustBefore: [],
      onViolation: {
        action: 'warn',
        message: 'No CONTEXT.md found. Consider /idumb:discuss-phase first.',
        continue: true
      }
    },
    // PHASE-03: verify-work requires evidence
    {
      id: 'PHASE-03',
      command: 'idumb:verify-work',
      mustBefore: [
        {
          type: 'one_of',
          options: [
            { type: 'file_exists', path: '.planning/phases/{phase}/*SUMMARY.md' },
            { type: 'state_condition', condition: "phase.status IN ('in_progress', 'completed')" }
          ]
        }
      ],
      onViolation: {
        action: 'block',
        message: 'No execution evidence found. Nothing to verify.'
      }
    },
    // VAL-01: Phase complete requires VERIFICATION.md
    {
      id: 'VAL-01',
      command: 'idumb:complete-phase',
      mustBefore: [
        { type: 'file_exists', path: '.planning/phases/{phase}/*VERIFICATION.md' }
      ],
      onViolation: {
        action: 'block',
        message: 'Cannot mark complete without verification. Run /idumb:verify-work first.'
      }
    }
  ]
}

/**
 * Match command against pattern
 */
function matchCommand(command: string, pattern: string, except?: string[]): boolean {
  // Check exceptions first
  if (except && except.some(e => command === e || command.startsWith(e.replace('*', '')))) {
    return false
  }
  
  // Handle wildcard patterns
  if (pattern.endsWith('*')) {
    const prefix = pattern.slice(0, -1)
    return command.startsWith(prefix)
  }
  
  return command === pattern
}

/**
 * Resolve {phase} placeholders in paths
 */
function resolvePhaseInPath(path: string, directory: string): string {
  // Try to get current phase from state
  const state = readState(directory)
  if (!state || !state.phase) {
    return path.replace('{phase}', '*')
  }
  
  // Extract phase number from state.phase (e.g., "Phase 1" -> "01")
  const phaseMatch = state.phase.match(/(\d+)/)
  if (phaseMatch) {
    const phaseNum = phaseMatch[1].padStart(2, '0')
    return path.replace('{phase}', `${phaseNum}-*`)
  }
  
  return path.replace('{phase}', '*')
}

/**
 * Check if a prerequisite is satisfied
 */
function checkPrerequisite(directory: string, prereq: Prerequisite): PrerequisiteResult {
  const result: PrerequisiteResult = { passed: true, violations: [] }
  
  switch (prereq.type) {
    case 'file_exists': {
      const resolvedPath = resolvePhaseInPath(prereq.path || '', directory)
      
      // Handle glob patterns
      if (resolvedPath.includes('*')) {
        // Check if any matching file exists
        try {
          const basePath = resolvedPath.split('*')[0]
          const fullBase = join(directory, basePath)
          
          if (existsSync(fullBase)) {
            // Directory exists, check for files
            const files = readdirSync(fullBase)
            const pattern = resolvedPath.split('/').pop() || '*'
            const regex = new RegExp(pattern.replace(/\*/g, '.*'))
            
            const hasMatch = files.some(f => regex.test(f))
            if (!hasMatch) {
              result.passed = false
              result.violations.push(`No file matching ${resolvedPath}`)
            }
          } else {
            result.passed = false
            result.violations.push(`Directory not found: ${basePath}`)
          }
        } catch {
          result.passed = false
          result.violations.push(`Cannot check path: ${resolvedPath}`)
        }
      } else {
        // Exact path check
        const fullPath = join(directory, resolvedPath)
        if (!existsSync(fullPath)) {
          result.passed = false
          result.violations.push(`Missing file: ${resolvedPath}`)
        }
      }
      break
    }
    
    case 'state_condition': {
      const state = readState(directory)
      if (!state) {
        result.passed = false
        result.violations.push('State file not found')
        break
      }
      
      // Simple condition parser
      const condition = prereq.condition || ''
      if (condition.includes('phase.status')) {
        // Check phase status
        if (!['in_progress', 'completed', 'complete'].includes(state.phase.toLowerCase())) {
          result.passed = false
          result.violations.push(`Phase status check failed: ${condition}`)
        }
      }
      break
    }
    
    case 'validation_age': {
      const state = readState(directory)
      if (!state || !state.lastValidation) {
        result.passed = false
        result.violations.push('No validation timestamp found')
        break
      }
      
      const lastVal = new Date(state.lastValidation).getTime()
      const now = Date.now()
      const ageMinutes = (now - lastVal) / (1000 * 60)
      const maxAge = prereq.maxAgeMinutes || 10
      
      if (ageMinutes > maxAge) {
        result.passed = false
        result.violations.push(`Last validation was ${Math.round(ageMinutes)} minutes ago (max: ${maxAge})`)
      }
      break
    }
    
    case 'one_of': {
      // At least one of the options must pass
      const options = prereq.options || []
      let anyPassed = false
      const allViolations: string[] = []
      
      for (const opt of options) {
        const optResult = checkPrerequisite(directory, opt)
        if (optResult.passed) {
          anyPassed = true
          break
        }
        allViolations.push(...optResult.violations)
      }
      
      if (!anyPassed) {
        result.passed = false
        result.violations.push(`None of the following satisfied: ${allViolations.join(', ')}`)
      }
      break
    }
  }
  
  return result
}

/**
 * Check all prerequisites for a chain rule
 */
function checkPrerequisites(directory: string, prereqs: Prerequisite[]): PrerequisiteResult {
  const result: PrerequisiteResult = { passed: true, violations: [] }
  
  for (const prereq of prereqs) {
    const prereqResult = checkPrerequisite(directory, prereq)
    if (!prereqResult.passed) {
      result.passed = false
      result.violations.push(...prereqResult.violations)
    }
  }
  
  return result
}

/**
 * Build block message for chain violation
 */
function buildChainBlockMessage(rule: ChainRule, violations: string[]): string {
  return `
🚫 CHAIN ENFORCEMENT: ${rule.id} - BLOCKED 🚫

${rule.onViolation.message}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PREREQUISITE VIOLATIONS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${violations.map(v => `• ${v}`).join('\n')}

${rule.onViolation.target ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SUGGESTED ACTION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Run: /${rule.onViolation.target}
` : ''}
Use --force to override (if allowed for this rule).
`
}

/**
 * Build warning message for soft violations
 */
function buildChainWarnMessage(rule: ChainRule, violations: string[]): string {
  return `
⚠️ CHAIN WARNING: ${rule.id}

${rule.onViolation.message}

Violations:
${violations.map(v => `• ${v}`).join('\n')}

(Continuing anyway - this is a soft warning)
---
`
}

/**
 * Consume validation tool result and store for blocking
 */
function consumeValidationResult(sessionId: string, toolName: string, output: string): void {
  try {
    const result = JSON.parse(output)
    
    if (result.overall === 'fail') {
      pendingViolations.set(sessionId, {
        tool: toolName,
        timestamp: new Date().toISOString(),
        overall: 'fail',
        critical: result.critical || [],
        message: `Validation failed with ${result.critical?.length || 0} critical issues`
      })
    }
  } catch {
    // Not JSON or parsing failed - ignore
  }
}

/**
 * Build validation failure message for output replacement
 */
function buildValidationFailureMessage(violation: {
  tool: string
  critical: string[]
  message: string
}): string {
  return `
❌ VALIDATION FAILED: ${violation.tool}

${violation.message}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL ISSUES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${violation.critical.map(c => `• ${c}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NEXT STEPS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Fix the issues listed above
2. Run /idumb:validate to verify fixes
3. Retry the operation
`
}
```

### Replace Location: Lines 1319-1335 (command.execute.before hook)

```typescript
    "command.execute.before": async (
      input: { command: string; sessionID: string; arguments: string },
      output: { parts: Part[] }
    ) => {
      try {
        const { command, arguments: args, sessionID } = input
        
        // Log iDumb command execution
        if (command.startsWith("idumb:") || command.startsWith("idumb-")) {
          log(directory, `[CMD] iDumb command starting: ${command}`)
        }
        
        // ==========================================
        // CHAIN ENFORCEMENT (from chain-enforcement.md)
        // ==========================================
        
        // Skip readonly commands
        if (READONLY_COMMANDS.includes(command)) {
          log(directory, `[CHAIN] Readonly command, skipping enforcement: ${command}`)
          return
        }
        
        // Check for emergency bypass
        if (args.includes('--emergency') || args.includes('--bypass-chain')) {
          log(directory, `[CHAIN] Emergency bypass used for: ${command}`)
          addHistoryEntry(directory, `chain_bypass:${command}`, 'plugin', 'pass')
          return
        }
        
        // Load chain rules
        const rules = getChainRules()
        
        // Find matching rules
        const matchingRules = rules.filter(r => 
          matchCommand(command, r.command, r.except)
        )
        
        for (const rule of matchingRules) {
          // Check mustBefore prerequisites
          if (rule.mustBefore && rule.mustBefore.length > 0) {
            const result = checkPrerequisites(directory, rule.mustBefore)
            
            if (!result.passed) {
              const action = rule.onViolation
              
              if (action.action === 'block') {
                // HARD_BLOCK - stop execution
                log(directory, `[CHAIN BLOCK] ${rule.id}: ${result.violations.join(', ')}`)
                
                output.parts = [{
                  type: 'text',
                  text: buildChainBlockMessage(rule, result.violations)
                }]
                
                addHistoryEntry(
                  directory,
                  `chain_block:${rule.id}:${command}`,
                  'chain-enforcer',
                  'fail'
                )
                
                return  // Stop execution
              }
              
              if (action.action === 'redirect') {
                // SOFT_BLOCK - check for --force
                if (!args.includes('--force')) {
                  log(directory, `[CHAIN REDIRECT] ${rule.id}: ${result.violations.join(', ')}`)
                  
                  output.parts = [{
                    type: 'text',
                    text: buildChainBlockMessage(rule, result.violations)
                  }]
                  
                  addHistoryEntry(
                    directory,
                    `chain_redirect:${rule.id}:${command}`,
                    'chain-enforcer',
                    'fail'
                  )
                  
                  return
                }
                
                // --force used, log and continue
                log(directory, `[CHAIN] --force override for ${rule.id}`)
                addHistoryEntry(
                  directory,
                  `chain_force_override:${rule.id}:${command}`,
                  'chain-enforcer',
                  'partial'
                )
              }
              
              if (action.action === 'warn') {
                // WARN - log and continue
                log(directory, `[CHAIN WARN] ${rule.id}: ${result.violations.join(', ')}`)
                
                output.parts.unshift({
                  type: 'text',
                  text: buildChainWarnMessage(rule, result.violations)
                })
                
                addHistoryEntry(
                  directory,
                  `chain_warn:${rule.id}:${command}`,
                  'chain-enforcer',
                  'partial'
                )
              }
            }
          }
          
          // Check shouldBefore (warnings only)
          if (rule.shouldBefore && rule.shouldBefore.length > 0) {
            const result = checkPrerequisites(directory, rule.shouldBefore)
            
            if (!result.passed) {
              log(directory, `[CHAIN SUGGEST] ${rule.id}: ${result.violations.join(', ')}`)
              
              output.parts.unshift({
                type: 'text',
                text: buildChainWarnMessage(rule, result.violations)
              })
            }
          }
        }
        
      } catch (error) {
        log(directory, `[ERROR] command.execute.before failed: ${error instanceof Error ? error.message : String(error)}`)
      }
    },
```

### Modify Location: tool.execute.after (add validation consumption, after line ~1280)

```typescript
        // ==========================================
        // VALIDATION OUTPUT CONSUMPTION
        // ==========================================
        
        if (toolName.startsWith('idumb-validate')) {
          consumeValidationResult(sessionId, toolName, output.output)
          
          // Check if we should block based on validation result
          const violation = pendingViolations.get(sessionId)
          if (violation && violation.overall === 'fail') {
            // Check if this is a blocking context
            const tracker = getSessionTracker(sessionId)
            
            // For now, just log - actual blocking happens on next action
            log(directory, `[VALIDATION FAIL] ${violation.tool}: ${violation.critical.length} critical issues`)
          }
        }
```

---

## File 2: template/tools/idumb-validate.ts

### Insert Location: After line ~27 (after existing interfaces)

```typescript
// ============================================================================
// INTEGRATION POINT TYPES
// ============================================================================

interface IntegrationResult {
  artifact: string
  tier: string
  integrations: number
  required: number
  passed: boolean
  details: string[]
}

interface IntegrationReport {
  overall: 'pass' | 'fail' | 'warning'
  tiers: {
    agents: IntegrationResult[]
    commands: IntegrationResult[]
    tools: IntegrationResult[]
  }
  summary: {
    total: number
    passed: number
    failed: number
  }
}

// ============================================================================
// SCHEMA TYPES
// ============================================================================

interface SchemaField {
  name: string
  type: 'string' | 'number' | 'boolean' | 'array' | 'object'
  required: boolean
  enum?: string[]
}

interface ArtifactSchema {
  type: string
  requiredFields: SchemaField[]
  optionalFields: SchemaField[]
}

const AGENT_SCHEMA: ArtifactSchema = {
  type: 'agent',
  requiredFields: [
    { name: 'description', type: 'string', required: true },
    { name: 'mode', type: 'string', required: true, enum: ['primary', 'subagent', 'all'] },
    { name: 'permission', type: 'object', required: true }
  ],
  optionalFields: [
    { name: 'temperature', type: 'number', required: false },
    { name: 'maxTokens', type: 'number', required: false }
  ]
}

const COMMAND_SCHEMA: ArtifactSchema = {
  type: 'command',
  requiredFields: [
    { name: 'description', type: 'string', required: true },
    { name: 'agent', type: 'string', required: true }
  ],
  optionalFields: [
    { name: 'category', type: 'string', required: false },
    { name: 'mode', type: 'string', required: false }
  ]
}

const PLAN_SCHEMA: ArtifactSchema = {
  type: 'plan',
  requiredFields: [
    { name: 'phase', type: 'string', required: true },
    { name: 'plan', type: 'string', required: true },
    { name: 'status', type: 'string', required: true, enum: ['pending', 'in_progress', 'complete', 'blocked'] }
  ],
  optionalFields: [
    { name: 'wave', type: 'number', required: false },
    { name: 'depends_on', type: 'array', required: false },
    { name: 'files_modified', type: 'array', required: false },
    { name: 'autonomous', type: 'boolean', required: false },
    { name: 'must_haves', type: 'array', required: false }
  ]
}
```

### Insert Location: After line ~105 (after structure tool)

```typescript
// ============================================================================
// INTEGRATION POINT VALIDATION
// ============================================================================

/**
 * Validate agent integration points
 */
async function validateAgentIntegrations(directory: string): Promise<IntegrationResult[]> {
  const results: IntegrationResult[] = []
  const agentsDir = join(directory, 'template', 'agents')
  
  if (!existsSync(agentsDir)) {
    return results
  }
  
  const files = readdirSync(agentsDir).filter(f => f.startsWith('idumb-') && f.endsWith('.md'))
  
  for (const file of files) {
    const content = readFileSync(join(agentsDir, file), 'utf8')
    const integrations: string[] = []
    
    // Check for delegation targets (permission.task)
    if (content.includes('permission:') && content.includes('task:')) {
      const taskMatch = content.match(/task:\s*\n([\s\S]*?)(?=\n\s*\w+:|---)/i)
      if (taskMatch) {
        const delegations = taskMatch[1].match(/"[^"]+"\s*:\s*(allow|deny)/g) || []
        integrations.push(...delegations.filter(d => d.includes('allow')).map(() => 'delegation'))
      }
    }
    
    // Check for tool references
    const toolRefs = content.match(/idumb-\w+/g) || []
    const uniqueTools = [...new Set(toolRefs)]
    integrations.push(...uniqueTools.map(t => `tool:${t}`))
    
    results.push({
      artifact: file,
      tier: 'agent',
      integrations: integrations.length,
      required: 2,
      passed: integrations.length >= 2,
      details: integrations
    })
  }
  
  return results
}

/**
 * Validate command integration points
 */
async function validateCommandIntegrations(directory: string): Promise<IntegrationResult[]> {
  const results: IntegrationResult[] = []
  const commandsDir = join(directory, 'template', 'commands', 'idumb')
  
  if (!existsSync(commandsDir)) {
    return results
  }
  
  const files = readdirSync(commandsDir).filter(f => f.endsWith('.md'))
  
  for (const file of files) {
    const content = readFileSync(join(commandsDir, file), 'utf8')
    const integrations: string[] = []
    
    // Check for agent binding
    const agentMatch = content.match(/agent:\s*(\S+)/i)
    if (agentMatch && agentMatch[1] !== 'none') {
      integrations.push(`agent:${agentMatch[1]}`)
    }
    
    results.push({
      artifact: file,
      tier: 'command',
      integrations: integrations.length,
      required: 1,
      passed: integrations.length >= 1,
      details: integrations
    })
  }
  
  return results
}

/**
 * Validate tool integration points
 */
async function validateToolIntegrations(directory: string): Promise<IntegrationResult[]> {
  const results: IntegrationResult[] = []
  const toolsDir = join(directory, 'template', 'tools')
  
  if (!existsSync(toolsDir)) {
    return results
  }
  
  const files = readdirSync(toolsDir).filter(f => f.startsWith('idumb-') && f.endsWith('.ts'))
  
  for (const file of files) {
    const content = readFileSync(join(toolsDir, file), 'utf8')
    const integrations: string[] = []
    
    // Check for tool exports
    const exports = content.match(/export\s+(const|default)\s+\w+\s*=\s*tool\(/g) || []
    integrations.push(...exports.map((_, i) => `export:${i + 1}`))
    
    results.push({
      artifact: file,
      tier: 'tool',
      integrations: integrations.length,
      required: 1,
      passed: integrations.length >= 1,
      details: integrations
    })
  }
  
  return results
}

// Integration points validation tool
export const integrationPoints = tool({
  description: "Validate integration point count per artifact tier",
  args: {
    tier: tool.schema.string().optional().describe("Specific tier: agent, command, tool")
  },
  async execute(args, context) {
    const tier = args.tier
    
    let agents: IntegrationResult[] = []
    let commands: IntegrationResult[] = []
    let tools: IntegrationResult[] = []
    
    if (!tier || tier === 'agent') {
      agents = await validateAgentIntegrations(context.directory)
    }
    if (!tier || tier === 'command') {
      commands = await validateCommandIntegrations(context.directory)
    }
    if (!tier || tier === 'tool') {
      tools = await validateToolIntegrations(context.directory)
    }
    
    const allResults = [...agents, ...commands, ...tools]
    const passed = allResults.filter(r => r.passed).length
    const failed = allResults.filter(r => !r.passed).length
    
    const report: IntegrationReport = {
      overall: failed > 0 ? 'fail' : 'pass',
      tiers: { agents, commands, tools },
      summary: {
        total: allResults.length,
        passed,
        failed
      }
    }
    
    return JSON.stringify(report, null, 2)
  }
})
```

### Insert Location: After integrationPoints (new frontmatter validation)

```typescript
// ============================================================================
// FRONTMATTER VALIDATION
// ============================================================================

/**
 * Extract YAML frontmatter from markdown content
 */
function extractYamlFrontmatter(content: string): Record<string, any> | null {
  const match = content.match(/^---\n([\s\S]*?)\n---/)
  if (!match) return null
  
  try {
    const yaml = match[1]
    const result: Record<string, any> = {}
    
    let currentKey = ''
    let inArray = false
    let arrayKey = ''
    
    for (const line of yaml.split('\n')) {
      // Skip empty lines
      if (!line.trim()) continue
      
      // Check for array item
      if (line.trim().startsWith('-') && inArray) {
        const value = line.trim().slice(1).trim()
        if (!result[arrayKey]) result[arrayKey] = []
        result[arrayKey].push(value.replace(/^["']|["']$/g, ''))
        continue
      }
      
      // Check for key-value
      const kvMatch = line.match(/^(\s*)(\w+):\s*(.*)$/)
      if (kvMatch) {
        const [, indent, key, value] = kvMatch
        
        if (indent === '') {
          currentKey = key
          inArray = false
          
          if (value === '') {
            // Start of object or array
            result[key] = {}
          } else if (value === '|' || value === '>') {
            // Multi-line string (skip for now)
            result[key] = ''
          } else {
            // Simple value
            result[key] = value.replace(/^["']|["']$/g, '')
          }
        } else if (indent) {
          // Nested value
          if (!result[currentKey] || typeof result[currentKey] !== 'object') {
            result[currentKey] = {}
          }
          result[currentKey][key] = value.replace(/^["']|["']$/g, '')
        }
      }
      
      // Check for array start
      if (line.match(/^\w+:\s*$/)) {
        const key = line.replace(':', '').trim()
        arrayKey = key
        inArray = true
      }
    }
    
    return result
  } catch {
    return null
  }
}

/**
 * Validate frontmatter against schema
 */
function validateFrontmatterAgainstSchema(
  frontmatter: Record<string, any>,
  schema: ArtifactSchema
): ValidationResult[] {
  const results: ValidationResult[] = []
  
  // Check required fields
  for (const field of schema.requiredFields) {
    if (frontmatter[field.name] === undefined) {
      results.push({
        check: `field_${field.name}`,
        status: 'fail',
        message: `Missing required field: ${field.name}`,
        evidence: `Expected type: ${field.type}`
      })
    } else {
      // Check type
      const value = frontmatter[field.name]
      let typeValid = true
      
      switch (field.type) {
        case 'string':
          typeValid = typeof value === 'string'
          break
        case 'number':
          typeValid = typeof value === 'number' || !isNaN(Number(value))
          break
        case 'boolean':
          typeValid = typeof value === 'boolean' || value === 'true' || value === 'false'
          break
        case 'array':
          typeValid = Array.isArray(value)
          break
        case 'object':
          typeValid = typeof value === 'object' && !Array.isArray(value)
          break
      }
      
      if (!typeValid) {
        results.push({
          check: `field_${field.name}_type`,
          status: 'fail',
          message: `Invalid type for ${field.name}: expected ${field.type}`,
          evidence: `Got: ${typeof value}`
        })
      } else if (field.enum && !field.enum.includes(value)) {
        results.push({
          check: `field_${field.name}_enum`,
          status: 'fail',
          message: `Invalid value for ${field.name}`,
          evidence: `Expected one of: ${field.enum.join(', ')}. Got: ${value}`
        })
      } else {
        results.push({
          check: `field_${field.name}`,
          status: 'pass',
          message: `${field.name}: ${value}`
        })
      }
    }
  }
  
  return results
}

// Frontmatter validation tool
export const frontmatter = tool({
  description: "Validate YAML frontmatter against artifact schema",
  args: {
    path: tool.schema.string().describe("Path to markdown file"),
    type: tool.schema.string().describe("Type: agent, command, plan, summary")
  },
  async execute(args, context) {
    const fullPath = join(context.directory, args.path)
    
    if (!existsSync(fullPath)) {
      return JSON.stringify({
        overall: 'fail',
        checks: [{
          check: 'file_exists',
          status: 'fail',
          message: `File not found: ${args.path}`
        }]
      })
    }
    
    const content = readFileSync(fullPath, 'utf8')
    const fm = extractYamlFrontmatter(content)
    
    if (!fm) {
      return JSON.stringify({
        overall: 'fail',
        checks: [{
          check: 'frontmatter_exists',
          status: 'fail',
          message: 'No YAML frontmatter found'
        }]
      })
    }
    
    let schema: ArtifactSchema
    switch (args.type) {
      case 'agent':
        schema = AGENT_SCHEMA
        break
      case 'command':
        schema = COMMAND_SCHEMA
        break
      case 'plan':
        schema = PLAN_SCHEMA
        break
      default:
        return JSON.stringify({
          overall: 'fail',
          checks: [{
            check: 'type_valid',
            status: 'fail',
            message: `Unknown type: ${args.type}. Use: agent, command, plan`
          }]
        })
    }
    
    const results = validateFrontmatterAgainstSchema(fm, schema)
    const hasFail = results.some(r => r.status === 'fail')
    
    return JSON.stringify({
      overall: hasFail ? 'fail' : 'pass',
      frontmatter: fm,
      checks: results
    }, null, 2)
  }
})

// Config schema validation tool
export const configSchema = tool({
  description: "Validate JSON config file against schema",
  args: {
    configType: tool.schema.string().describe("Type: state, config")
  },
  async execute(args, context) {
    const paths: Record<string, string> = {
      state: '.idumb/brain/state.json',
      config: '.idumb/config.json'
    }
    
    const path = paths[args.configType]
    if (!path) {
      return JSON.stringify({
        overall: 'fail',
        checks: [{
          check: 'type_valid',
          status: 'fail',
          message: `Unknown config type: ${args.configType}. Use: state, config`
        }]
      })
    }
    
    const fullPath = join(context.directory, path)
    
    if (!existsSync(fullPath)) {
      return JSON.stringify({
        overall: 'fail',
        checks: [{
          check: 'file_exists',
          status: 'fail',
          message: `Config not found: ${path}`
        }]
      })
    }
    
    try {
      const content = readFileSync(fullPath, 'utf8')
      const config = JSON.parse(content)
      
      const results: ValidationResult[] = []
      
      // State schema validation
      if (args.configType === 'state') {
        const required = ['version', 'initialized', 'framework', 'phase']
        for (const field of required) {
          if (config[field] === undefined) {
            results.push({
              check: `field_${field}`,
              status: 'fail',
              message: `Missing required field: ${field}`
            })
          } else {
            results.push({
              check: `field_${field}`,
              status: 'pass',
              message: `${field}: ${config[field]}`
            })
          }
        }
      }
      
      // Config schema validation
      if (args.configType === 'config') {
        const required = ['version', 'initialized', 'user', 'hierarchy']
        for (const field of required) {
          if (config[field] === undefined) {
            results.push({
              check: `field_${field}`,
              status: 'fail',
              message: `Missing required field: ${field}`
            })
          } else {
            results.push({
              check: `field_${field}`,
              status: 'pass',
              message: `${field}: ${typeof config[field] === 'object' ? 'object' : config[field]}`
            })
          }
        }
      }
      
      const hasFail = results.some(r => r.status === 'fail')
      
      return JSON.stringify({
        overall: hasFail ? 'fail' : 'pass',
        checks: results
      }, null, 2)
      
    } catch (e) {
      return JSON.stringify({
        overall: 'fail',
        checks: [{
          check: 'json_parse',
          status: 'fail',
          message: `Invalid JSON: ${(e as Error).message}`
        }]
      })
    }
  }
})
```

---

## Verification Checklist

After implementation, verify:

### Chain Enforcement
- [ ] `/idumb:roadmap` blocked without state.json → redirects to init
- [ ] `/idumb:roadmap` blocked without PROJECT.md → shows error
- [ ] `/idumb:help` works without any prerequisites
- [ ] `/idumb:execute-phase --force` works despite missing CONTEXT.md
- [ ] Violations logged in state.json history

### Validation Consumption
- [ ] `idumb-validate` returns JSON with overall status
- [ ] Failed validations stored in pendingViolations
- [ ] Plugin logs validation failures

### Integration Points
- [ ] `idumb-validate integrationPoints` returns tier results
- [ ] Agents with no delegations marked as failed
- [ ] Commands with no agent binding marked as failed

### Schema Validation
- [ ] `idumb-validate frontmatter --path=... --type=agent` works
- [ ] Missing required fields reported as failures
- [ ] `idumb-validate configSchema --configType=state` works

---

*Implementation Spec | 2026-02-03*
