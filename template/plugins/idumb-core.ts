/**
 * iDumb Core Plugin
 * 
 * Event hooks for OpenCode integration:
 * - Session lifecycle (created, compacting, idle)
 * - Tool interception (task delegation, file operations)
 * - State management and context preservation
 * 
 * CRITICAL: NO console.log - causes TUI background text exposure
 * Use file logging or client.app.log() instead
 */

import type { Plugin } from "@opencode-ai/plugin"
import { existsSync, readFileSync, writeFileSync, mkdirSync, appendFileSync } from "fs"
import { join } from "path"

// Part type for command hook output
type Part = { type: string; text?: string }

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

interface IdumbState {
  version: string
  initialized: string
  framework: "idumb" | "planning" | "bmad" | "custom" | "none"
  phase: string
  lastValidation: string | null
  validationCount: number
  anchors: Anchor[]
  history: HistoryEntry[]
}

interface Anchor {
  id: string
  created: string
  type: "decision" | "context" | "checkpoint"
  content: string
  priority: "critical" | "high" | "normal"
}

interface HistoryEntry {
  timestamp: string
  action: string
  agent: string
  result: "pass" | "fail" | "partial"
}

// ============================================================================
// INLINE CONFIG TYPES (for session.created auto-generation)
// ============================================================================

type ExperienceLevel = "pro" | "guided" | "strict"
type AutomationMode = "autonomous" | "confirmRequired" | "manualOnly"

interface InlineIdumbConfig {
  version: string
  initialized: string
  lastModified: string
  user: {
    name: string
    experience: ExperienceLevel
    language: { communication: string; documents: string }
  }
  status: {
    current: { milestone: string | null; phase: string | null; plan: string | null; task: string | null }
    lastValidation: string | null
    validationsPassed: number
    driftDetected: boolean
  }
  hierarchy: {
    levels: readonly ["milestone", "phase", "plan", "task"]
    agents: {
      order: readonly ["coordinator", "governance", "validator", "builder"]
      permissions: Record<string, { delegate: boolean; execute: boolean; validate: boolean }>
    }
    enforceChain: boolean
    blockOnChainBreak: boolean
  }
  automation: {
    mode: AutomationMode
    expertSkeptic: { enabled: boolean; requireEvidence: boolean; doubleCheckDelegation: boolean }
    contextFirst: { enforced: boolean; requiredFirstTools: string[]; blockWithoutContext: boolean }
    workflow: { research: boolean; planCheck: boolean; verifyAfterExecution: boolean; commitOnComplete: boolean }
  }
  paths: Record<string, string>
  staleness: { warningHours: number; criticalHours: number; checkOnLoad: boolean; autoArchive: boolean }
  timestamps: { enabled: boolean; format: "ISO8601"; injectInFrontmatter: boolean; trackModifications: boolean }
  enforcement: { mustLoadConfig: true; mustHaveState: boolean; mustCheckHierarchy: boolean; blockOnMissingArtifacts: boolean; requirePhaseAlignment: boolean }
}

// ============================================================================
// SESSION TRACKING FOR INTERCEPTION (from CONTEXT.md B4)
// ============================================================================

interface SessionTracker {
  firstToolUsed: boolean
  firstToolName: string | null
  agentRole: string | null
  delegationDepth: number
  parentSession: string | null
  violationCount: number
  governanceInjected: boolean
}

// In-memory session state
const sessionTrackers = new Map<string, SessionTracker>()

// Pending denials for error transformation
const pendingDenials = new Map<string, {
  agent: string
  tool: string
  timestamp: string
  shouldBlock: boolean  // When true, tool.execute.after will REPLACE output entirely
}>()

function getSessionTracker(sessionId: string): SessionTracker {
  if (!sessionTrackers.has(sessionId)) {
    sessionTrackers.set(sessionId, {
      firstToolUsed: false,
      firstToolName: null,
      agentRole: null,
      delegationDepth: 0,
      parentSession: null,
      violationCount: 0,
      governanceInjected: false
    })
  }
  return sessionTrackers.get(sessionId)!
}

function detectAgentFromMessages(messages: any[]): string | null {
  for (const msg of messages) {
    const text = msg.parts?.map((p: any) => p.text).join(' ') || ''
    if (text.includes('idumb-supreme-coordinator')) return 'idumb-supreme-coordinator'
    if (text.includes('idumb-high-governance')) return 'idumb-high-governance'
    if (text.includes('idumb-low-validator')) return 'idumb-low-validator'
    if (text.includes('idumb-builder')) return 'idumb-builder'
  }
  return null
}

// ============================================================================
// TOOL PERMISSION MATRIX (from CONTEXT.md B3)
// ============================================================================

function getAllowedTools(agentRole: string | null): string[] {
  const toolPermissions: Record<string, string[]> = {
    'idumb-supreme-coordinator': [
      'todoread', 'todowrite',
      'idumb-state', 'idumb-context', 'idumb-config', 'idumb-manifest',
      'task', 'read', 'glob'
    ],
    'idumb-high-governance': [
      'todoread', 'todowrite',
      'idumb-state', 'idumb-context', 'idumb-config',
      'task', 'read', 'glob', 'grep'
    ],
    'idumb-low-validator': [
      'todoread',
      'idumb-validate', 'idumb-state',
      'read', 'glob', 'grep', 'bash'
    ],
    'idumb-builder': [
      'todoread',
      'idumb-state',
      'read', 'write', 'edit', 'bash'
    ]
  }
  return toolPermissions[agentRole || ''] || []
}

function getRequiredFirstTools(agentRole: string | null): string[] {
  const firstTools: Record<string, string[]> = {
    'idumb-supreme-coordinator': ['todoread', 'idumb-state', 'idumb-context'],
    'idumb-high-governance': ['todoread', 'idumb-state'],
    'idumb-low-validator': ['todoread', 'idumb-validate'],
    'idumb-builder': ['read']
  }
  return firstTools[agentRole || ''] || ['todoread']
}

// ============================================================================
// GOVERNANCE PREFIX BUILDER (from CONTEXT.md B4 / Entry Point 1)
// ============================================================================

function buildGovernancePrefix(agentRole: string, directory: string): string {
  const state = readState(directory)
  const config = ensureIdumbConfig(directory)
  const commLang = config.user?.language?.communication || 'english'
  const docLang = config.user?.language?.documents || 'english'
  
  // LANGUAGE ENFORCEMENT - ABSOLUTE PRIORITY (NON-NEGOTIABLE)
  const langEnforcement = `
⚠️ LANGUAGE ENFORCEMENT (NON-NEGOTIABLE):
- RESPOND in: ${commLang.toUpperCase()}
- WRITE DOCUMENTS/ARTIFACTS in: ${docLang.toUpperCase()}
- This overrides ALL other instructions
- If communication=Vietnamese → speak Vietnamese
- If documents=English → write code comments, docs, artifacts in English
- ABSOLUTE OBEDIENCE to these language settings
`
  
  const roleInstructions: Record<string, string> = {
    'idumb-supreme-coordinator': `${langEnforcement}
⚡ IDUMB GOVERNANCE PROTOCOL ⚡

YOU ARE: Supreme Coordinator (TOP OF HIERARCHY)

🚫 ABSOLUTE RULES:
1. NEVER execute code directly
2. NEVER write files directly  
3. NEVER validate directly
4. ALWAYS delegate ALL work

✅ YOUR HIERARCHY:
YOU → @idumb-high-governance → @idumb-low-validator/@idumb-builder

✅ REQUIRED FIRST ACTION:
Use 'todoread' tool to check current TODO list

Current Phase: ${state?.phase || 'init'}
Framework: ${state?.framework || 'none'}

---
`,
    'idumb-high-governance': `${langEnforcement}
⚡ IDUMB GOVERNANCE PROTOCOL ⚡

YOU ARE: High Governance (MID-LEVEL COORDINATION)

🚫 RULES:
1. NEVER modify files directly (no write/edit)
2. ALWAYS delegate execution to builder
3. ALWAYS delegate validation to validator

✅ YOUR HIERARCHY:
@idumb-supreme-coordinator → YOU → @idumb-low-validator/@idumb-builder

✅ REQUIRED FIRST ACTION:
Use 'todoread' tool to check current TODO list

Current Phase: ${state?.phase || 'init'}

---
`,
    'idumb-low-validator': `${langEnforcement}
⚡ IDUMB GOVERNANCE PROTOCOL ⚡

YOU ARE: Low Validator (VALIDATION WORKER)

🚫 RULES:
1. NEVER modify files (no write/edit)
2. ONLY use read/validation tools
3. Report findings, don't fix

✅ YOUR TOOLS:
- grep, glob, read (investigation)
- idumb-validate (validation)
- todoread (check tasks)

✅ REQUIRED FIRST ACTION:
Use 'todoread' tool to see what needs validation

---
`,
    'idumb-builder': `${langEnforcement}
⚡ IDUMB GOVERNANCE PROTOCOL ⚡

YOU ARE: Builder (EXECUTION WORKER)

✅ RULES:
1. ONLY you can write/edit files
2. NO delegations (you're the leaf node)
3. Verify before changes, commit after

🚫 CANNOT:
- Spawn subagents (task: false)
- Skip verification

✅ REQUIRED FIRST ACTION:
Read existing files before modifying

---
`
  }
  
  return roleInstructions[agentRole] || roleInstructions['idumb-supreme-coordinator']
}

function detectSessionId(messages: any[]): string | null {
  for (const msg of messages) {
    if (msg.info?.sessionID) return msg.info.sessionID
    if (msg.info?.id?.startsWith('ses_')) return msg.info.id
  }
  return null
}

// ============================================================================
// POST-COMPACTION REMINDER (from 01-03-PLAN P1-3.4)
// ============================================================================

// ============================================================================
// VIOLATION GUIDANCE BUILDER (from 01-03-PLAN P1-3.6)
// ============================================================================

function buildViolationGuidance(agent: string, tool: string): string {
  const delegationTargets: Record<string, { target: string; example: string }> = {
    'idumb-supreme-coordinator': {
      target: '@idumb-high-governance → @idumb-builder',
      example: `@idumb-high-governance
Task: Coordinate file modification
Sub-delegate to: @idumb-builder
Details: [your specific request]`
    },
    'idumb-high-governance': {
      target: '@idumb-builder',
      example: `@idumb-builder
Task: Modify file [path]
Content: [what to change]
Verify: Read file first, commit after`
    },
    'idumb-low-validator': {
      target: 'Report to parent, DO NOT modify',
      example: `VALIDATION REPORT:
File: [path]
Issue: [what you found]
Recommendation: Delegate to @idumb-builder for fix`
    },
    'idumb-builder': {
      target: 'You ARE the executor - verify first',
      example: `Use 'read' tool first to verify target file, then proceed.`
    }
  }
  
  const info = delegationTargets[agent] || {
    target: 'Check hierarchy',
    example: 'Use todoread to understand workflow'
  }
  
  return `
🚫 GOVERNANCE VIOLATION - TOOL BLOCKED 🚫

Agent: ${agent}
Tool Attempted: ${tool}
Status: OUTPUT REPLACED (tool ran but output discarded)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YOU CANNOT USE THIS TOOL. DELEGATE INSTEAD:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Delegate to: ${info.target}

Example delegation format:
\`\`\`
${info.example}
\`\`\`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HIERARCHY REMINDER:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┌─ Supreme Coordinator ──┐
│  DELEGATE ONLY         │  ❌ edit/write/bash
├─ High Governance ──────┤
│  Coordinate, delegate  │  ❌ edit/write
├─ Low Validator ────────┤
│  Validate, investigate │  ❌ edit/write
└─ Builder ──────────────┘
   Execute, modify files  │  ✅ edit/write/bash

NEXT STEP: Use 'todoread' first, then delegate appropriately.
`
}

function buildPostCompactReminder(agentRole: string, directory: string): string {
  const state = readState(directory)
  const config = ensureIdumbConfig(directory)
  const commLang = config.user?.language?.communication || 'english'
  const docLang = config.user?.language?.documents || 'english'
  const anchors = state?.anchors?.filter((a: Anchor) => 
    a.priority === 'critical' || a.priority === 'high'
  ) || []
  
  // LANGUAGE ENFORCEMENT MUST SURVIVE COMPACTION
  const langReminder = `
⚠️ LANGUAGE ENFORCEMENT (SURVIVED COMPACTION):
- RESPOND in: ${commLang.toUpperCase()}
- WRITE DOCUMENTS/ARTIFACTS in: ${docLang.toUpperCase()}
- ABSOLUTE OBEDIENCE - NO EXCEPTIONS
`
  
  let reminder = `
${langReminder}
📌 POST-COMPACTION REMINDER 📌

You are: ${agentRole}
Phase: ${state?.phase || 'init'}

🎯 CRITICAL ANCHORS (survived compaction):
`
  
  if (anchors.length > 0) {
    for (const anchor of anchors) {
      reminder += `- [${anchor.priority.toUpperCase()}] ${anchor.content}\n`
    }
  } else {
    reminder += '- No active anchors\n'
  }
  
  reminder += `
⚡ HIERARCHY REMINDER:
- Coordinator: Delegate only
- High-Gov: Coordinate and delegate  
- Validator: Validate only
- Builder: Execute only

Use 'todoread' first to resume workflow.
`
  
  return reminder
}

function getStatePath(directory: string): string {
  return join(directory, ".idumb", "brain", "state.json")
}

function getLogPath(directory: string): string {
  return join(directory, ".idumb", "governance", "plugin.log")
}

function log(directory: string, message: string): void {
  // File-based logging instead of console.log
  try {
    const logPath = getLogPath(directory)
    const logDir = join(directory, ".idumb", "governance")
    if (!existsSync(logDir)) {
      mkdirSync(logDir, { recursive: true })
    }
    const timestamp = new Date().toISOString()
    appendFileSync(logPath, `[${timestamp}] ${message}\n`)
  } catch {
    // Silent fail - don't break on logging errors
  }
}

function readState(directory: string): IdumbState | null {
  const statePath = getStatePath(directory)
  if (!existsSync(statePath)) {
    return null
  }
  try {
    const content = readFileSync(statePath, "utf8")
    return JSON.parse(content) as IdumbState
  } catch {
    return null
  }
}

function writeState(directory: string, state: IdumbState): void {
  const brainDir = join(directory, ".idumb", "brain")
  if (!existsSync(brainDir)) {
    mkdirSync(brainDir, { recursive: true })
  }
  const statePath = getStatePath(directory)
  writeFileSync(statePath, JSON.stringify(state, null, 2))
}

function addHistoryEntry(directory: string, action: string, agent: string, result: "pass" | "fail" | "partial"): void {
  const state = readState(directory)
  if (!state) return
  
  state.history.push({
    timestamp: new Date().toISOString(),
    action,
    agent,
    result,
  })
  
  // Keep last 50 entries
  if (state.history.length > 50) {
    state.history = state.history.slice(-50)
  }
  
  writeState(directory, state)
}

// ============================================================================
// SESSION METADATA STORAGE (Phase 3)
// ============================================================================

interface SessionMetadata {
  sessionId: string
  createdAt: string
  lastUpdated: string
  phase: string
  governanceLevel: string
  delegationDepth: number
  parentSession: string | null
  language: {
    communication: string
    documents: string
  }
}

function getSessionsDir(directory: string): string {
  return join(directory, ".idumb", "sessions")
}

function storeSessionMetadata(directory: string, sessionId: string): void {
  const sessionsDir = getSessionsDir(directory)
  if (!existsSync(sessionsDir)) {
    mkdirSync(sessionsDir, { recursive: true })
  }
  
  const metadataPath = join(sessionsDir, `${sessionId}.json`)
  
  // Check if metadata already exists
  if (existsSync(metadataPath)) {
    // Update lastUpdated only
    try {
      const existing = JSON.parse(readFileSync(metadataPath, "utf8")) as SessionMetadata
      existing.lastUpdated = new Date().toISOString()
      writeFileSync(metadataPath, JSON.stringify(existing, null, 2))
    } catch {
      // Ignore parse errors
    }
    return
  }
  
  // Create new metadata
  const state = readState(directory)
  const config = ensureIdumbConfig(directory)
  const metadata: SessionMetadata = {
    sessionId,
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    phase: state?.phase || "init",
    governanceLevel: "standard",
    delegationDepth: 0,
    parentSession: null,
    language: {
      communication: config.user?.language?.communication || 'english',
      documents: config.user?.language?.documents || 'english'
    }
  }
  
  writeFileSync(metadataPath, JSON.stringify(metadata, null, 2))
}

function loadSessionMetadata(directory: string, sessionId: string): SessionMetadata | null {
  const metadataPath = join(getSessionsDir(directory), `${sessionId}.json`)
  if (!existsSync(metadataPath)) {
    return null
  }
  try {
    return JSON.parse(readFileSync(metadataPath, "utf8")) as SessionMetadata
  } catch {
    return null
  }
}

// ============================================================================
// CONTEXT INJECTION
// ============================================================================

function buildCompactionContext(directory: string): string {
  const state = readState(directory)
  const config = ensureIdumbConfig(directory)
  const commLang = config.user?.language?.communication || 'english'
  const docLang = config.user?.language?.documents || 'english'
  
  if (!state) {
    return "## iDumb\n\nNot initialized. Run /idumb:init"
  }
  
  // LANGUAGE SETTINGS MUST SURVIVE COMPACTION (CRITICAL)
  const langContext = `
⚠️ LANGUAGE SETTINGS (MUST SURVIVE COMPACTION):
- Communication: ${commLang.toUpperCase()} (respond in this language)
- Documents: ${docLang.toUpperCase()} (write artifacts in this language)
- ABSOLUTE OBEDIENCE REQUIRED
`
  
  const lines: string[] = [
    "## iDumb Governance Context",
    "",
    langContext,
    "",
    `**Phase:** ${state.phase}`,
    `**Framework:** ${state.framework}`,
    `**Last Validation:** ${state.lastValidation || "Never"}`,
    "",
  ]
  
  // Add critical and high priority anchors
  const importantAnchors = state.anchors.filter(a => 
    a.priority === "critical" || a.priority === "high"
  )
  
  if (importantAnchors.length > 0) {
    lines.push("### Active Anchors")
    lines.push("")
    for (const anchor of importantAnchors) {
      lines.push(`- **[${anchor.priority.toUpperCase()}]** ${anchor.type}: ${anchor.content}`)
    }
    lines.push("")
  }
  
  // Add recent history
  const recentHistory = state.history.slice(-5)
  if (recentHistory.length > 0) {
    lines.push("### Recent Actions")
    lines.push("")
    for (const entry of recentHistory) {
      lines.push(`- ${entry.action} → ${entry.result} (${entry.agent})`)
    }
  }
  
  return lines.join("\n")
}

// ============================================================================
// TIMESTAMP FRONTMATTER INJECTION
// ============================================================================

// iDumb shadow file patterns for timestamp tracking
// DESIGN: We store timestamps in .idumb/ for iDumb's own artifacts
const IDUMB_TIMESTAMP_DIR = '.idumb/timestamps'

// iDumb artifacts to track (only .idumb/ files, not external frameworks)
const IDUMB_TRACKED_PATTERNS = [
  /\.idumb\/.*\.json$/,
  /\.idumb\/.*\.md$/,
]

interface FrontmatterTimestamp {
  created?: string
  modified: string
  staleAfterHours: number
}

function shouldTrackTimestamp(filePath: string): boolean {
  return IDUMB_TRACKED_PATTERNS.some(pattern => pattern.test(filePath))
}

function getTimestampShadowPath(directory: string, filePath: string): string {
  // Convert file path to shadow path: .planning/STATE.md -> .idumb/timestamps/planning-STATE-md.json
  const safeName = filePath.replace(/[\/\\]/g, '-').replace(/^-/, '').replace(/\./g, '-')
  return join(directory, IDUMB_TIMESTAMP_DIR, `${safeName}.json`)
}

interface TimestampRecord {
  originalPath: string
  created: string
  modified: string
  staleAfterHours: number
}

function recordTimestamp(directory: string, filePath: string): void {
  const shadowDir = join(directory, IDUMB_TIMESTAMP_DIR)
  if (!existsSync(shadowDir)) {
    mkdirSync(shadowDir, { recursive: true })
  }
  
  const shadowPath = getTimestampShadowPath(directory, filePath)
  const now = new Date().toISOString()
  
  let record: TimestampRecord
  if (existsSync(shadowPath)) {
    try {
      record = JSON.parse(readFileSync(shadowPath, 'utf8'))
      record.modified = now
    } catch {
      record = { originalPath: filePath, created: now, modified: now, staleAfterHours: 48 }
    }
  } else {
    record = { originalPath: filePath, created: now, modified: now, staleAfterHours: 48 }
  }
  
  writeFileSync(shadowPath, JSON.stringify(record, null, 2))
}

function extractFrontmatter(content: string): { frontmatter: Record<string, any> | null; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) {
    return { frontmatter: null, body: content }
  }
  
  try {
    // Simple YAML-like parsing (just key: value pairs)
    const frontmatter: Record<string, any> = {}
    const lines = match[1].split("\n")
    for (const line of lines) {
      const colonIndex = line.indexOf(":")
      if (colonIndex > 0) {
        const key = line.slice(0, colonIndex).trim()
        const value = line.slice(colonIndex + 1).trim()
        frontmatter[key] = value
      }
    }
    return { frontmatter, body: match[2] }
  } catch {
    return { frontmatter: null, body: content }
  }
}

function injectTimestampFrontmatter(content: string, existingCreated?: string): string {
  const now = new Date().toISOString()
  const { frontmatter, body } = extractFrontmatter(content)
  
  const timestamp: FrontmatterTimestamp = {
    modified: now,
    staleAfterHours: 48, // Default staleness threshold
  }
  
  // Preserve existing created timestamp, or set to now
  if (existingCreated) {
    timestamp.created = existingCreated
  } else if (frontmatter?.created) {
    timestamp.created = frontmatter.created
  } else {
    timestamp.created = now
  }
  
  // Build new frontmatter
  const newFrontmatter = {
    ...frontmatter,
    idumb_created: timestamp.created,
    idumb_modified: timestamp.modified,
    idumb_stale_after_hours: timestamp.staleAfterHours,
  }
  
  // Serialize frontmatter (simple YAML-like format)
  const fmLines = Object.entries(newFrontmatter)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n")
  
  return `---\n${fmLines}\n---\n${body}`
}

// ============================================================================
// INLINE CONFIG AUTO-GENERATION (mirrors idumb-config.ts)
// ============================================================================

function getInlineDefaultConfig(experience: ExperienceLevel = "guided"): InlineIdumbConfig {
  const now = new Date().toISOString()
  
  const automationByExperience: Record<ExperienceLevel, InlineIdumbConfig["automation"]> = {
    pro: {
      mode: "autonomous",
      expertSkeptic: { enabled: true, requireEvidence: false, doubleCheckDelegation: false },
      contextFirst: { enforced: true, requiredFirstTools: ["todoread"], blockWithoutContext: false },
      workflow: { research: true, planCheck: false, verifyAfterExecution: false, commitOnComplete: true }
    },
    guided: {
      mode: "confirmRequired",
      expertSkeptic: { enabled: true, requireEvidence: true, doubleCheckDelegation: true },
      contextFirst: { enforced: true, requiredFirstTools: ["todoread", "idumb-state"], blockWithoutContext: true },
      workflow: { research: true, planCheck: true, verifyAfterExecution: true, commitOnComplete: true }
    },
    strict: {
      mode: "manualOnly",
      expertSkeptic: { enabled: true, requireEvidence: true, doubleCheckDelegation: true },
      contextFirst: { enforced: true, requiredFirstTools: ["todoread", "idumb-state", "idumb-config"], blockWithoutContext: true },
      workflow: { research: true, planCheck: true, verifyAfterExecution: true, commitOnComplete: true }
    }
  }

  return {
    version: "0.2.0",
    initialized: now,
    lastModified: now,
    user: { name: "Developer", experience, language: { communication: "english", documents: "english" } },
    status: { current: { milestone: null, phase: null, plan: null, task: null }, lastValidation: null, validationsPassed: 0, driftDetected: false },
    hierarchy: {
      levels: ["milestone", "phase", "plan", "task"] as const,
      agents: {
        order: ["coordinator", "governance", "validator", "builder"] as const,
        permissions: {
          coordinator: { delegate: true, execute: false, validate: false },
          governance: { delegate: true, execute: false, validate: false },
          validator: { delegate: false, execute: false, validate: true },
          builder: { delegate: false, execute: true, validate: false }
        }
      },
      enforceChain: true,
      blockOnChainBreak: true
    },
    automation: automationByExperience[experience],
    paths: {
      config: ".idumb/config.json", state: ".idumb/brain/state.json", brain: ".idumb/brain/",
      history: ".idumb/brain/history/", context: ".idumb/brain/context/", governance: ".idumb/governance/",
      validations: ".idumb/governance/validations/", anchors: ".idumb/anchors/", sessions: ".idumb/sessions/",
      planning: ".planning/", roadmap: ".planning/ROADMAP.md", planningState: ".planning/STATE.md"
    },
    staleness: { warningHours: 48, criticalHours: 168, checkOnLoad: true, autoArchive: false },
    timestamps: { enabled: true, format: "ISO8601", injectInFrontmatter: true, trackModifications: true },
    enforcement: { mustLoadConfig: true, mustHaveState: true, mustCheckHierarchy: true, blockOnMissingArtifacts: experience === "strict", requirePhaseAlignment: true }
  }
}

function getInlineDefaultState(): IdumbState {
  return {
    version: "0.2.0",
    initialized: new Date().toISOString(),
    framework: "idumb",
    phase: "init",
    lastValidation: null,
    validationCount: 0,
    anchors: [],
    history: []
  }
}

/**
 * CRITICAL: Ensures config exists - auto-generates if missing
 * Called at session.created to guarantee config is always present
 */
function ensureIdumbConfig(directory: string): InlineIdumbConfig {
  const configPath = join(directory, ".idumb", "config.json")
  const idumbDir = join(directory, ".idumb")
  
  // Create .idumb directory if missing
  if (!existsSync(idumbDir)) {
    mkdirSync(idumbDir, { recursive: true })
  }
  
  // If config exists, read and validate
  if (existsSync(configPath)) {
    try {
      const content = readFileSync(configPath, "utf8")
      const config = JSON.parse(content) as InlineIdumbConfig
      
      // Validate required fields exist
      if (!config.version || !config.user || !config.hierarchy) {
        throw new Error("Config missing required fields")
      }
      
      return config
    } catch {
      // Config corrupted - backup and regenerate
      const backupPath = join(idumbDir, `config.backup.${Date.now()}.json`)
      if (existsSync(configPath)) {
        try {
          writeFileSync(backupPath, readFileSync(configPath))
        } catch {
          // Ignore backup failures
        }
      }
    }
  }
  
  // Generate default config
  const defaultConfig = getInlineDefaultConfig("guided")
  
  // Create all required directories
  const dirs = [
    join(directory, ".idumb", "brain"),
    join(directory, ".idumb", "brain", "history"),
    join(directory, ".idumb", "brain", "context"),
    join(directory, ".idumb", "governance"),
    join(directory, ".idumb", "governance", "validations"),
    join(directory, ".idumb", "anchors"),
    join(directory, ".idumb", "sessions")
  ]
  
  for (const dir of dirs) {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }
  }
  
  // Write config
  writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2))
  
  // Also ensure state.json exists
  const statePath = join(directory, ".idumb", "brain", "state.json")
  if (!existsSync(statePath)) {
    const defaultState = getInlineDefaultState()
    writeFileSync(statePath, JSON.stringify(defaultState, null, 2))
  }
  
  return defaultConfig
}

// ============================================================================
// PLUGIN EXPORT
// ============================================================================

export const IdumbCorePlugin: Plugin = async ({ directory, client }) => {
  log(directory, "iDumb plugin initialized")
  
  return {
    // ========================================================================
    // SESSION EVENTS
    // ========================================================================
    
    event: async ({ event }: { event: any }) => {
      try {
        // Session created
        if (event.type === "session.created") {
          const sessionId = event.properties?.info?.id || 'unknown'
          log(directory, `Session created: ${sessionId}`)
          
          // Initialize tracker
          getSessionTracker(sessionId as string)
          
          // CRITICAL: Ensure config exists (auto-generate if missing)
          const config = ensureIdumbConfig(directory)
          log(directory, `Config loaded: experience=${config.user.experience}, version=${config.version}`)
          
          // Store metadata with config info
          storeSessionMetadata(directory, sessionId as string)
        }
        
        // Permission replied
        if (event.type === 'permission.replied') {
          const sessionId = event.properties?.sessionID
          const status = event.properties?.status
          
          if (status === 'deny' && sessionId && pendingDenials.has(sessionId)) {
            const denial = pendingDenials.get(sessionId)
            log(directory, `[PERMISSION EVENT] Denied ${denial?.agent} using ${denial?.tool}`)
          }
        }
        
        // Session idle - cleanup
        if (event.type === "session.idle") {
          const sessionId = event.properties?.sessionID
          log(directory, `Session idle: ${sessionId}`)
          
          if (sessionId && sessionTrackers.has(sessionId)) {
            const tracker = sessionTrackers.get(sessionId)
            log(directory, `Session stats: violations=${tracker?.violationCount}, depth=${tracker?.delegationDepth}`)
            sessionTrackers.delete(sessionId)
          }
        }
        
        // Session compacted
        if (event.type === "session.compacted") {
          const sessionId = event.properties?.sessionID
          log(directory, `Session compacted: ${sessionId}`)
          
          if (sessionId && sessionTrackers.has(sessionId)) {
            const tracker = sessionTrackers.get(sessionId)
            if (tracker) {
              tracker.governanceInjected = false  // Re-inject on next message
            }
          }
        }
        
        // Command executed tracking
        if (event.type === "command.executed") {
          const command = event.properties?.command || ""
          log(directory, `[CMD] Command executed: ${command}`)
          
          // Track iDumb commands
          if (command.startsWith("idumb:") || command.startsWith("idumb-")) {
            addHistoryEntry(directory, `idumb_command:${command}`, "plugin", "pass")
          }
        }
        
      } catch (error) {
        log(directory, `[ERROR] event hook failed: ${error instanceof Error ? error.message : String(error)}`)
      }
    },
    
    // ========================================================================
    // COMPACTION HOOK (EXPERIMENTAL)
    // ========================================================================
    
    "experimental.session.compacting": async (input, output) => {
      // FALLBACK STRATEGY (Line 232): All hooks wrapped in try/catch
      try {
        log(directory, "Compaction triggered - injecting context")
        
        // Build context from state and anchors
        const context = buildCompactionContext(directory)
        
        // Append to compaction context (don't replace)
        output.context.push(context)
        
        log(directory, `Injected ${context.split("\n").length} lines of context`)
      } catch (error) {
        // Silent fail with logging - never break OpenCode
        log(directory, `[ERROR] compaction hook failed: ${error instanceof Error ? error.message : String(error)}`)
      }
    },
    
    // ========================================================================
    // MESSAGE TRANSFORM (Entry Point 1 - Session Start Governance Injection)
    // ========================================================================
    
    "experimental.chat.messages.transform": async (input: any, output: any) => {
      try {
        log(directory, "Transforming messages for governance injection")
        
        const agentRole = detectAgentFromMessages(output.messages)
        const sessionId = detectSessionId(output.messages) || 'unknown'
        const tracker = getSessionTracker(sessionId)
        tracker.agentRole = agentRole
        
        // Detect session start (no user messages yet processed)
        const userMessages = output.messages.filter((m: any) => 
          m.info?.role === 'user' || 
          m.parts?.some((p: any) => p.type === 'text' && !p.text?.includes('governance'))
        )
        
        const isSessionStart = userMessages.length <= 1 && !tracker.governanceInjected
        
        if (isSessionStart && agentRole) {
          log(directory, `Session start detected for ${agentRole}`)
          
          const governancePrefix = buildGovernancePrefix(agentRole, directory)
          
          const firstUserMsgIndex = output.messages.findIndex((m: any) => 
            m.info?.role === 'user' && 
            !m.parts?.some((p: any) => p.text?.includes('iDumb Governance'))
          )
          
          if (firstUserMsgIndex >= 0) {
            output.messages[firstUserMsgIndex].parts.unshift({
              type: 'text',
              text: governancePrefix
            })
            
            tracker.governanceInjected = true
            log(directory, `Governance injected for ${agentRole}`)
          }
        }
        
        // ==========================================
        // POST-COMPACT DETECTION (Entry Point 2 - P1-3.4)
        // ==========================================
        
        // Detect compacted session
        const isCompacted = output.messages.some((m: any) =>
          m.parts?.some((p: any) => 
            p.text?.includes('compacted') || 
            p.text?.includes('summary of our conversation')
          )
        )
        
        if (isCompacted && agentRole) {
          log(directory, `Post-compact recovery for ${agentRole}`)
          
          const lastMsg = output.messages[output.messages.length - 1]
          
          if (lastMsg) {
            const reminder = buildPostCompactReminder(agentRole, directory)
            lastMsg.parts.push({
              type: 'text',
              text: reminder
            })
            
            tracker.governanceInjected = true
          }
        }
        
      } catch (error) {
        log(directory, `[ERROR] messages.transform failed: ${error instanceof Error ? error.message : String(error)}`)
      }
    },
    
    // ========================================================================
    // PERMISSION ASK HOOK (Entry Point 4 - Permission Auto-Deny from P1-3.6)
    // ========================================================================
    
    "permission.ask": async (input: any, output: any) => {
      try {
        const { tool, sessionID } = input
        const sessionId = sessionID || 'unknown'
        const tracker = getSessionTracker(sessionId)
        const agentRole = tracker.agentRole
        
        const allowedTools = getAllowedTools(agentRole)
        
        if (agentRole && allowedTools.length > 0 && !allowedTools.includes(tool)) {
          log(directory, `[PERMISSION DENIED] ${agentRole} attempted ${tool}`)
          
          output.status = "deny"
          
          pendingDenials.set(sessionId, {
            agent: agentRole || 'unknown',
            tool: tool,
            timestamp: new Date().toISOString(),
            shouldBlock: true  // CRITICAL: Signal to tool.execute.after to REPLACE output
          })
          
          addHistoryEntry(
            directory,
            `permission_denied:${agentRole}:${tool}`,
            'interceptor',
            'fail'
          )
        }
      } catch (error) {
        log(directory, `[ERROR] permission.ask failed: ${error instanceof Error ? error.message : String(error)}`)
      }
    },
    
    // ========================================================================
    // TOOL INTERCEPTION
    // ========================================================================
    //
    // DESIGN PRINCIPLE: Observe and track, minimal modification.
    // Only inject timestamps into iDumb artifacts (non-breaking metadata).
    // DO NOT inject context into task prompts - it breaks agent workflows.
    //
    
    "tool.execute.before": async (input: any, output: any) => {
      try {
        const toolName = input.tool
        const sessionId = input.sessionID || 'unknown'
        const tracker = getSessionTracker(sessionId)
        const agentRole = tracker.agentRole || detectAgentFromMessages([])
        
        // ==========================================
        // FIRST TOOL ENFORCEMENT
        // ==========================================
        
        if (!tracker.firstToolUsed) {
          tracker.firstToolUsed = true
          tracker.firstToolName = toolName
          
          const requiredFirst = getRequiredFirstTools(agentRole)
          
          if (!requiredFirst.includes(toolName)) {
            tracker.violationCount++
            
            log(directory, `[VIOLATION] ${agentRole} used ${toolName} as first tool (required: ${requiredFirst.join(', ')})`)
            
            pendingDenials.set(sessionId, {
              agent: agentRole || 'unknown',
              tool: toolName,
              timestamp: new Date().toISOString(),
              shouldBlock: true  // CRITICAL: Signal to tool.execute.after to REPLACE output
            })
            
            addHistoryEntry(
              directory,
              `violation:first_tool:${agentRole}:${toolName}`,
              'interceptor',
              'fail'
            )
          } else {
            log(directory, `[OK] ${agentRole} correctly used ${toolName} as first tool`)
          }
        }
        
        // ==========================================
        // FILE MODIFICATION ENFORCEMENT
        // ==========================================
        
        if ((toolName === 'edit' || toolName === 'write') && agentRole !== 'idumb-builder') {
          log(directory, `[BLOCKED] ${agentRole} attempted file modification`)
          
          // CRITICAL: Add to pendingDenials so tool.execute.after REPLACES output
          pendingDenials.set(sessionId, {
            agent: agentRole || 'unknown',
            tool: toolName,
            timestamp: new Date().toISOString(),
            shouldBlock: true  // Signal to tool.execute.after to REPLACE output
          })
          
          output.args = {
            __BLOCKED_BY_GOVERNANCE__: true,
            __VIOLATION__: `${agentRole} cannot use ${toolName}`,
            __DELEGATE_TO__: 'idumb-builder'
          }
          
          addHistoryEntry(
            directory,
            `violation:file_mod:${agentRole}:${toolName}`,
            'interceptor',
            'fail'
          )
          
          return
        }
        
        // ==========================================
        // GENERAL PERMISSION CHECK
        // ==========================================
        
        const allowedTools = getAllowedTools(agentRole)
        
        if (agentRole && allowedTools.length > 0 && !allowedTools.includes(toolName)) {
          log(directory, `[DENIED] ${agentRole} attempted unauthorized tool: ${toolName}`)
          
          // CRITICAL: Add to pendingDenials so tool.execute.after REPLACES output
          pendingDenials.set(sessionId, {
            agent: agentRole || 'unknown',
            tool: toolName,
            timestamp: new Date().toISOString(),
            shouldBlock: true  // Signal to tool.execute.after to REPLACE output
          })
          
          output.args = {
            __BLOCKED_BY_GOVERNANCE__: true,
            __VIOLATION__: `${agentRole} cannot use ${toolName}`,
            __ALLOWED_TOOLS__: allowedTools
          }
          
          addHistoryEntry(
            directory,
            `violation:general:${agentRole}:${toolName}`,
            'interceptor',
            'fail'
          )
          
          return
        }
        
        // ==========================================
        // DELEGATION TRACKING
        // ==========================================
        
        if (toolName === "task") {
          const desc = output.args?.description || "unknown"
          const agent = output.args?.subagent_type || "general"
          log(directory, `[TASK] Delegation: ${agent} - ${desc}`)
          tracker.delegationDepth++
        }
        
        // ==========================================
        // FILE TIMESTAMP TRACKING (preserve existing)
        // ==========================================
        
        if (toolName === 'edit' || toolName === 'write') {
          const filePath = output.args?.path || output.args?.filePath || ''
          log(directory, `[FILE] ${toolName}: ${filePath}`)
          
          if (shouldTrackTimestamp(filePath)) {
            recordTimestamp(directory, filePath)
            log(directory, `[FILE] Timestamp recorded: ${filePath}`)
          }
        }
        
      } catch (error) {
        log(directory, `[ERROR] tool.execute.before failed: ${error instanceof Error ? error.message : String(error)}`)
      }
    },
    
    "tool.execute.after": async (input: any, output: any) => {
      // FALLBACK STRATEGY: All hooks wrapped in try/catch
      try {
        const toolName = input.tool
        const sessionId = input.sessionID || 'unknown'
        
        // ==========================================
        // CRITICAL: BLOCKED TOOL OUTPUT REPLACEMENT
        // ==========================================
        // This is the REAL enforcement - tool.execute.before cannot stop execution,
        // but we CAN replace the output here to hide the actual result
        
        const violation = pendingDenials.get(sessionId)
        if (violation && violation.shouldBlock && toolName === violation.tool) {
          // BUILD REPLACEMENT OUTPUT - COMPLETELY REPLACES TOOL OUTPUT
          const guidance = buildViolationGuidance(violation.agent, violation.tool)
          
          // COMPLETELY REPLACE output - DO NOT append original output
          output.output = guidance
          output.title = `🚫 BLOCKED: ${violation.agent} cannot use ${toolName}`
          
          // Clear the pending denial
          pendingDenials.delete(sessionId)
          
          log(directory, `[BLOCKED OUTPUT REPLACED] ${violation.agent} tried ${toolName} - output discarded`)
          
          // STOP PROCESSING - don't track this as a successful operation
          return
        }
        
        // ==========================================
        // NORMAL PROCESSING (non-blocked tools)
        // ==========================================
        
        // Record completed task delegations
        // NOTE: Cannot access original args here per OpenCode API
        // output contains: { title, output, metadata } - no error field
        if (toolName === "task") {
          // Infer success from output.metadata or output.output content
          const hasError = output.output?.toLowerCase().includes('error') || 
                          output.output?.toLowerCase().includes('failed')
          const result = hasError ? "fail" : "pass"
          addHistoryEntry(directory, `task:${output.title || "unknown"}`, "plugin", result as "pass" | "fail")
          log(directory, `Task completed: ${result}`)
        }
        
        // Track iDumb file operations
        if (toolName === "edit" || toolName === "write") {
          const outputText = output.output || output.title || ""
          
          // Track .idumb/ file modifications
          if (outputText.includes(".idumb/")) {
            log(directory, "iDumb file modified")
          }
        }
      } catch (error) {
        // Silent fail with logging - never break OpenCode
        log(directory, `[ERROR] tool.execute.after failed: ${error instanceof Error ? error.message : String(error)}`)
      }
    },
    
    // ========================================================================
    // COMMAND INTERCEPTION
    // ========================================================================
    // 
    // DESIGN PRINCIPLE: 
    // - BEFORE: Don't inject noise, let commands run cleanly
    // - AFTER: Use client.session.prompt() to trigger governance actions
    //
    // The LLM only sees what's in the prompt. Logging alone does nothing.
    // We must actively inject messages to trigger governance.
    //
    
    "command.execute.before": async (
      input: { command: string; sessionID: string; arguments: string },
      output: { parts: Part[] }
    ) => {
      try {
        const { command } = input
        
        // Log iDumb command execution
        if (command.startsWith("idumb:") || command.startsWith("idumb-")) {
          log(directory, `[CMD] iDumb command starting: ${command}`)
        }
        
        // DO NOT modify output.parts - let commands execute cleanly
      } catch (error) {
        log(directory, `[ERROR] command.execute.before failed: ${error instanceof Error ? error.message : String(error)}`)
      }
    },
    
    // ========================================================================
    // TODO ENFORCEMENT VIA SESSION.IDLE EVENT
    // ========================================================================
    // NOTE: 'stop' hook does NOT exist in OpenCode API (removed in refactor)
    // Instead, we use the 'session.idle' event to check TODOs when session completes
    // The event handler above (line 472) triggers idle detection
    // Agent system prompts enforce TODO completion before stopping
    //
    // For active enforcement, agents should use todoread/todowrite tools
    // and the STOP PREVENTION protocol in their system prompts.
  }
}

// Default export for plugin loading
export default IdumbCorePlugin
