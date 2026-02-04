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
import { existsSync, readFileSync, writeFileSync, mkdirSync, appendFileSync, readdirSync, unlinkSync } from "fs"
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
// EXECUTION METRICS INTERFACE (P3-T2)
// ============================================================================

interface ExecutionMetrics {
  sessionId: string
  startedAt: string
  iterationCounts: {
    plannerChecker: number
    validatorFix: number
    total: number
  }
  agentSpawns: {
    total: number
    byAgent: Record<string, number>
  }
  errors: {
    total: number
    byType: Record<string, number>
    recent: string[]
  }
  limits: {
    // NOTE: maxIterations REMOVED per user principle "NEVER define iteration with numbers"
    // Replaced by acceptance-criteria-based validation gates
    maxDelegationDepth: number
    maxErrors: number
  }
}

// ============================================================================
// STALL DETECTION INTERFACES (P3-T3)
// ============================================================================

interface StallDetection {
  plannerChecker: {
    issuesHashHistory: string[]
    stallCount: number
    lastScore: number | null
    scoreHistory: number[]
  }
  validatorFix: {
    errorHashHistory: string[]
    repeatCount: number
  }
  delegation: {
    depth: number
    callStack: string[]
  }
}

// ============================================================================
// CHECKPOINT MANAGEMENT INTERFACES (P3-T4)
// ============================================================================

interface Checkpoint {
  id: string
  version: string
  createdAt: string
  phase: string
  task: string
  type: "manual" | "auto" | "pre_task" | "post_task" | "emergency"
  status: "valid" | "corrupted" | "stale"
  state: {
    gitHash: string | null
    filesModified: string[]
    filesCreated: string[]
    filesDeleted: string[]
  }
  execution: {
    tasksCompleted: string[]
    tasksInProgress: string[]
    tasksFailed: string[]
    currentTask: string | null
  }
  metrics: {
    iterationCount: number
    agentSpawns: number
    errorCount: number
    duration: number
  }
  context: {
    anchors: Anchor[]
    notes: string
  }
}

// ============================================================================
// CHECKPOINT MANAGEMENT FUNCTIONS (P3-T4)
// ============================================================================

/**
 * Get the checkpoint directory path for a phase
 */
function getCheckpointDir(directory: string, phase: string): string {
  return join(directory, ".idumb", "execution", phase)
}

/**
 * Generate a unique checkpoint ID
 * Format: checkpoint-{phase}-{task}-{timestamp}
 */
function generateCheckpointId(phase: string, task: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const safePhase = phase.replace(/[^a-zA-Z0-9_-]/g, '-')
  const safeTask = task.replace(/[^a-zA-Z0-9_-]/g, '-')
  return `checkpoint-${safePhase}-${safeTask}-${timestamp}`
}

/**
 * Get current git hash if in a git repository
 */
function getCurrentGitHash(directory: string): string | null {
  try {
    const gitHeadPath = join(directory, ".git", "HEAD")
    if (!existsSync(gitHeadPath)) {
      return null
    }

    const headContent = readFileSync(gitHeadPath, "utf8").trim()

    // If HEAD is a reference to a branch
    if (headContent.startsWith("ref: ")) {
      const refPath = headContent.substring(5)
      const fullRefPath = join(directory, ".git", refPath)
      if (existsSync(fullRefPath)) {
        return readFileSync(fullRefPath, "utf8").trim()
      }
    } else {
      // Detached HEAD - content is the hash directly
      return headContent
    }

    return null
  } catch {
    return null
  }
}

/**
 * Get file changes by comparing with previous checkpoint or git
 */
function getFileChanges(directory: string, phase: string): {
  modified: string[]
  created: string[]
  deleted: string[]
} {
  const modified: string[] = []
  const created: string[] = []
  const deleted: string[] = []

  try {
    // Try to get changes from git if available
    const gitIndexPath = join(directory, ".git", "index")
    if (existsSync(gitIndexPath)) {
      // Note: In a real implementation, this would use git status
      // For now, we track based on session history
      const state = readState(directory)
      if (state?.history) {
        const recentHistory = state.history.slice(-10)
        for (const entry of recentHistory) {
          if (entry.action.includes("file_modified") || entry.action.includes("edit")) {
            // Extract file path from action if possible
            const match = entry.action.match(/:\s*(.+)$/)
            if (match && !modified.includes(match[1])) {
              modified.push(match[1])
            }
          } else if (entry.action.includes("file_created") || entry.action.includes("write")) {
            const match = entry.action.match(/:\s*(.+)$/)
            if (match && !created.includes(match[1])) {
              created.push(match[1])
            }
          }
        }
      }
    }
  } catch {
    // Silent fail - return empty arrays
  }

  return { modified, created, deleted }
}

/**
 * Create a new checkpoint
 */
async function createCheckpoint(
  directory: string,
  phase: string,
  task: string,
  type: Checkpoint["type"],
  notes?: string
): Promise<Checkpoint | null> {
  try {
    // 1. Get current git hash
    const gitHash = getCurrentGitHash(directory)

    // 2. Get current state
    const state = readState(directory)
    if (!state) {
      log(directory, "Cannot create checkpoint: No state found")
      return null
    }

    // 3. Get file changes
    const fileChanges = getFileChanges(directory, phase)

    // 4. Build checkpoint object
    const checkpoint: Checkpoint = {
      id: generateCheckpointId(phase, task),
      version: state.version,
      createdAt: new Date().toISOString(),
      phase,
      task,
      type,
      status: "valid",
      state: {
        gitHash,
        filesModified: fileChanges.modified,
        filesCreated: fileChanges.created,
        filesDeleted: fileChanges.deleted
      },
      execution: {
        tasksCompleted: [],
        tasksInProgress: [],
        tasksFailed: [],
        currentTask: task
      },
      metrics: {
        iterationCount: state.validationCount || 0,
        agentSpawns: 0, // Would be tracked in session metadata
        errorCount: state.history.filter(h => h.result === "fail").length,
        duration: 0 // Would be calculated from session start
      },
      context: {
        anchors: state.anchors.filter(a =>
          a.priority === "critical" || a.priority === "high"
        ),
        notes: notes || `Checkpoint created at ${type} checkpoint`
      }
    }

    // 5. Ensure checkpoint directory exists
    const checkpointDir = getCheckpointDir(directory, phase)
    if (!existsSync(checkpointDir)) {
      mkdirSync(checkpointDir, { recursive: true })
    }

    // 6. Write checkpoint file
    const checkpointPath = join(checkpointDir, `${checkpoint.id}.json`)
    writeFileSync(checkpointPath, JSON.stringify(checkpoint, null, 2))

    log(directory, `Checkpoint created: ${checkpoint.id}`)

    // 7. Add to history
    addHistoryEntry(
      directory,
      `checkpoint_created:${checkpoint.id}:${type}`,
      "plugin",
      "pass"
    )

    return checkpoint
  } catch (error) {
    log(directory, `Failed to create checkpoint: ${error}`)
    return null
  }
}

/**
 * Load a checkpoint from file
 */
function loadCheckpoint(directory: string, checkpointId: string): Checkpoint | null {
  try {
    // Extract phase from checkpoint ID
    const parts = checkpointId.split('-')
    if (parts.length < 3) {
      log(directory, `Invalid checkpoint ID format: ${checkpointId}`)
      return null
    }

    const phase = parts[1]
    const checkpointDir = getCheckpointDir(directory, phase)
    const checkpointPath = join(checkpointDir, `${checkpointId}.json`)

    if (!existsSync(checkpointPath)) {
      log(directory, `Checkpoint not found: ${checkpointPath}`)
      return null
    }

    const content = readFileSync(checkpointPath, "utf8")
    const checkpoint = JSON.parse(content) as Checkpoint

    // Validate checkpoint status
    const checkpointAge = (new Date().getTime() - new Date(checkpoint.createdAt).getTime()) / (1000 * 60 * 60)
    if (checkpointAge > 48) {
      checkpoint.status = "stale"
    }

    return checkpoint
  } catch (error) {
    log(directory, `Failed to load checkpoint: ${error}`)
    return null
  }
}

/**
 * List all checkpoints for a phase
 */
function listCheckpoints(directory: string, phase: string): Checkpoint[] {
  try {
    const checkpointDir = getCheckpointDir(directory, phase)

    if (!existsSync(checkpointDir)) {
      return []
    }

    const checkpoints: Checkpoint[] = []
    const files = readdirSync(checkpointDir)

    for (const file of files) {
      if (file.endsWith('.json')) {
        const checkpointId = file.replace('.json', '')
        const checkpoint = loadCheckpoint(directory, checkpointId)
        if (checkpoint) {
          checkpoints.push(checkpoint)
        }
      }
    }

    // Sort by createdAt descending (newest first)
    return checkpoints.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  } catch (error) {
    log(directory, `Failed to list checkpoints: ${error}`)
    return []
  }
}

/**
 * Get the most recent valid checkpoint for a phase
 */
function getLatestCheckpoint(directory: string, phase: string): Checkpoint | null {
  const checkpoints = listCheckpoints(directory, phase)

  // Find first valid checkpoint
  for (const checkpoint of checkpoints) {
    if (checkpoint.status === "valid") {
      return checkpoint
    }
  }

  // If no valid checkpoint, return the most recent one (even if stale)
  return checkpoints.length > 0 ? checkpoints[0] : null
}

/**
 * Mark a checkpoint as corrupted
 */
function markCheckpointCorrupted(directory: string, checkpointId: string): boolean {
  try {
    const checkpoint = loadCheckpoint(directory, checkpointId)
    if (!checkpoint) {
      return false
    }

    checkpoint.status = "corrupted"

    const parts = checkpointId.split('-')
    const phase = parts[1]
    const checkpointDir = getCheckpointDir(directory, phase)
    const checkpointPath = join(checkpointDir, `${checkpointId}.json`)

    writeFileSync(checkpointPath, JSON.stringify(checkpoint, null, 2))

    log(directory, `Checkpoint marked as corrupted: ${checkpointId}`)
    return true
  } catch (error) {
    log(directory, `Failed to mark checkpoint as corrupted: ${error}`)
    return false
  }
}

/**
 * Delete a checkpoint
 */
function deleteCheckpoint(directory: string, checkpointId: string): boolean {
  try {
    const parts = checkpointId.split('-')
    if (parts.length < 3) {
      return false
    }

    const phase = parts[1]
    const checkpointDir = getCheckpointDir(directory, phase)
    const checkpointPath = join(checkpointDir, `${checkpointId}.json`)

    if (!existsSync(checkpointPath)) {
      return false
    }

    // Delete the checkpoint file
    unlinkSync(checkpointPath)

    log(directory, `Checkpoint deleted: ${checkpointId}`)

    addHistoryEntry(
      directory,
      `checkpoint_deleted:${checkpointId}`,
      "plugin",
      "pass"
    )

    return true
  } catch (error) {
    log(directory, `Failed to delete checkpoint: ${error}`)
    return false
  }
}

// ============================================================================
// CHAIN RULE INTERFACES (from chain-enforcement.md)
// ============================================================================

type ViolationActionType = "block" | "redirect" | "warn"
type PrerequisiteType = "exists" | "state" | "validation" | "one_of"

interface Prerequisite {
  type: PrerequisiteType
  path?: string
  state?: string
  validation?: string
  alternatives?: Prerequisite[]
}

interface ViolationAction {
  action: ViolationActionType
  target?: string
  message: string
  continue?: boolean
}

interface ChainRule {
  id: string
  command: string
  mustBefore?: Prerequisite[]
  shouldBefore?: Prerequisite[]
  except?: string[]
  onViolation: ViolationAction
}

// Commands that bypass chain enforcement
const READONLY_COMMANDS = [
  "/idumb:status",
  "/idumb:help",
  "/idumb:validate",
  "/idumb:init"
]

// ============================================================================
// LOG ROTATION CONSTANTS (P3-T8)
// ============================================================================

const MAX_LOG_SIZE_MB = 5
const MAX_ARCHIVED_LOGS = 3

// ============================================================================
// EXECUTION METRICS STORAGE (P3-T2)
// ============================================================================

function getExecutionMetricsPath(directory: string): string {
  return join(directory, ".idumb", "brain", "execution-metrics.json")
}

function initializeExecutionMetrics(sessionId: string, directory: string): ExecutionMetrics {
  const metrics: ExecutionMetrics = {
    sessionId,
    startedAt: new Date().toISOString(),
    iterationCounts: {
      plannerChecker: 0,
      validatorFix: 0,
      total: 0
    },
    agentSpawns: {
      total: 0,
      byAgent: {}
    },
    errors: {
      total: 0,
      byType: {},
      recent: []
    },
    limits: {
      // NOTE: No maxIterations - per user principle "NEVER define iteration with numbers"
      // Validation uses acceptance-criteria-based gates, not hardcoded counts
      maxDelegationDepth: 3,
      maxErrors: 20
    }
  }

  try {
    const metricsPath = getExecutionMetricsPath(directory)
    const brainDir = join(directory, ".idumb", "brain")
    if (!existsSync(brainDir)) {
      mkdirSync(brainDir, { recursive: true })
    }
    writeFileSync(metricsPath, JSON.stringify(metrics, null, 2))
    log(directory, `Execution metrics initialized for session ${sessionId}`)
  } catch {
    // Silent fail
  }

  return metrics
}

function loadExecutionMetrics(directory: string): ExecutionMetrics | null {
  try {
    const metricsPath = getExecutionMetricsPath(directory)
    if (!existsSync(metricsPath)) return null
    const content = readFileSync(metricsPath, "utf8")
    return JSON.parse(content) as ExecutionMetrics
  } catch {
    return null
  }
}

function saveExecutionMetrics(directory: string, metrics: ExecutionMetrics): void {
  try {
    const metricsPath = getExecutionMetricsPath(directory)
    writeFileSync(metricsPath, JSON.stringify(metrics, null, 2))
  } catch {
    // Silent fail
  }
}

function trackIteration(directory: string, type: 'plannerChecker' | 'validatorFix'): void {
  const metrics = loadExecutionMetrics(directory)
  if (!metrics) return

  metrics.iterationCounts[type]++
  metrics.iterationCounts.total++
  saveExecutionMetrics(directory, metrics)
  log(directory, `Iteration tracked: ${type} (total: ${metrics.iterationCounts.total})`)
}

function trackAgentSpawn(directory: string, agentName: string): void {
  const metrics = loadExecutionMetrics(directory)
  if (!metrics) return

  metrics.agentSpawns.total++
  metrics.agentSpawns.byAgent[agentName] = (metrics.agentSpawns.byAgent[agentName] || 0) + 1
  saveExecutionMetrics(directory, metrics)
  log(directory, `Agent spawn tracked: ${agentName} (total: ${metrics.agentSpawns.total})`)
}

function trackError(directory: string, errorType: string, message: string): void {
  const metrics = loadExecutionMetrics(directory)
  if (!metrics) return

  metrics.errors.total++
  metrics.errors.byType[errorType] = (metrics.errors.byType[errorType] || 0) + 1
  metrics.errors.recent.push(`[${new Date().toISOString()}] ${errorType}: ${message.substring(0, 100)}`)

  // Keep only last 20 errors
  if (metrics.errors.recent.length > 20) {
    metrics.errors.recent = metrics.errors.recent.slice(-20)
  }

  saveExecutionMetrics(directory, metrics)
  log(directory, `Error tracked: ${errorType} (total: ${metrics.errors.total})`)
}

function checkLimits(directory: string): { withinLimits: boolean; violations: string[] } {
  const metrics = loadExecutionMetrics(directory)
  if (!metrics) return { withinLimits: true, violations: [] }

  const violations: string[] = []

  // NOTE: No maxIterations check - per user principle "NEVER define iteration with numbers"
  // Iteration control is handled by acceptance criteria, not hardcoded limits
  // The system uses: stall detection, requirements completion, and goal-based termination

  if (metrics.errors.total > metrics.limits.maxErrors) {
    violations.push(`Total errors (${metrics.errors.total}) exceeds limit (${metrics.limits.maxErrors})`)
  }

  return {
    withinLimits: violations.length === 0,
    violations
  }
}

// ============================================================================
// STALL DETECTION FUNCTIONS (P3-T3)
// ============================================================================

// In-memory stall detection state (per session)
const stallDetectionState = new Map<string, StallDetection>()

function getStallDetectionState(sessionId: string): StallDetection {
  if (!stallDetectionState.has(sessionId)) {
    stallDetectionState.set(sessionId, {
      plannerChecker: {
        issuesHashHistory: [],
        stallCount: 0,
        lastScore: null,
        scoreHistory: []
      },
      validatorFix: {
        errorHashHistory: [],
        repeatCount: 0
      },
      delegation: {
        depth: 0,
        callStack: []
      }
    })
  }
  return stallDetectionState.get(sessionId)!
}

// Simple hash function for detecting unchanged content
function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return hash.toString(16)
}

function detectPlannerCheckerStall(
  sessionId: string,
  currentIssues: string[],
  currentScore: number
): boolean {
  const state = getStallDetectionState(sessionId)
  const pc = state.plannerChecker

  // Hash the issues array
  const issuesHash = simpleHash(currentIssues.join('|'))
  pc.issuesHashHistory.push(issuesHash)

  // Keep last 5 hashes
  if (pc.issuesHashHistory.length > 5) {
    pc.issuesHashHistory.shift()
  }

  // Track score history
  pc.scoreHistory.push(currentScore)
  if (pc.scoreHistory.length > 5) {
    pc.scoreHistory.shift()
  }

  // Check if issues unchanged for 3 cycles
  const last3Hashes = pc.issuesHashHistory.slice(-3)
  const issuesUnchanged = last3Hashes.length >= 3 &&
    last3Hashes.every(h => h === last3Hashes[0])

  // Check if score unchanged or decreased for 2 cycles
  const last2Scores = pc.scoreHistory.slice(-2)
  const scoreStalled = last2Scores.length >= 2 &&
    last2Scores[1] <= last2Scores[0]

  // Stall detected if issues unchanged AND (score stalled or no progress)
  if (issuesUnchanged && scoreStalled) {
    pc.stallCount++
    return pc.stallCount >= 2 // Trigger after 2 consecutive stall detections
  }

  pc.stallCount = 0
  return false
}

function detectValidatorFixStall(
  sessionId: string,
  errorMessage: string,
  errorLocation: string
): boolean {
  const state = getStallDetectionState(sessionId)
  const vf = state.validatorFix

  // Hash error message + location
  const errorHash = simpleHash(`${errorMessage}:${errorLocation}`)
  vf.errorHashHistory.push(errorHash)

  // Keep last 5 hashes
  if (vf.errorHashHistory.length > 5) {
    vf.errorHashHistory.shift()
  }

  // Check if same error for 3 times
  const last3Hashes = vf.errorHashHistory.slice(-3)
  const sameError = last3Hashes.length >= 3 &&
    last3Hashes.every(h => h === last3Hashes[0])

  if (sameError) {
    vf.repeatCount++
    return vf.repeatCount >= 1 // Trigger immediately on 3 repeats
  }

  vf.repeatCount = 0
  return false
}

function trackDelegationDepth(
  sessionId: string,
  agentName: string
): { depth: number; maxReached: boolean } {
  const state = getStallDetectionState(sessionId)
  const del = state.delegation

  del.callStack.push(agentName)
  del.depth = del.callStack.length

  // Max depth is 3
  const maxReached = del.depth > 3

  return { depth: del.depth, maxReached }
}

function popDelegationDepth(sessionId: string): void {
  const state = stallDetectionState.get(sessionId)
  if (state) {
    state.delegation.callStack.pop()
    state.delegation.depth = state.delegation.callStack.length
  }
}

function triggerEmergencyHalt(
  directory: string,
  sessionId: string,
  reason: string,
  context: any
): string {
  // Log to state.json history
  addHistoryEntry(
    directory,
    `EMERGENCY_HALT: ${reason}`,
    'plugin',
    'fail'
  )

  // Create checkpoint
  const checkpointDir = join(directory, ".idumb", "execution", `halt-${Date.now()}`)
  try {
    if (!existsSync(checkpointDir)) {
      mkdirSync(checkpointDir, { recursive: true })
    }

    // Save halt context
    const haltContext = {
      timestamp: new Date().toISOString(),
      sessionId,
      reason,
      context,
      metrics: loadExecutionMetrics(directory),
      stallState: stallDetectionState.get(sessionId)
    }
    writeFileSync(
      join(checkpointDir, "halt-context.json"),
      JSON.stringify(haltContext, null, 2)
    )
  } catch {
    // Silent fail on checkpoint creation
  }

  log(directory, `EMERGENCY HALT triggered: ${reason}`)

  return `
🚨 EMERGENCY HALT TRIGGERED 🚨

Reason: ${reason}
Session: ${sessionId}
Time: ${new Date().toISOString()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EXECUTION STOPPED D TO STALL DETECTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The system has detected a potential infinite loop or stall:
${JSON.stringify(context, null, 2)}

Options:
1. Review the checkpoint at: ${checkpointDir}
2. Run /idumb:validate to check system state
3. Use --force flag to override (not recommended)
4. Start fresh with /idumb:init

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`
}

/**
 * Returns hardcoded chain rules from chain-enforcement.md
 * These enforce MUST-BEFORE dependencies between commands
 */
function getChainRules(): ChainRule[] {
  return [
    // INIT-01: All idumb commands require state.json except init/help
    {
      id: "INIT-01",
      command: "idumb:*",
      mustBefore: [{ type: "exists", path: ".idumb/brain/state.json" }],
      except: ["/idumb:init", "/idumb:help"],
      onViolation: {
        action: "redirect",
        target: "/idumb:init",
        message: "iDumb not initialized. Running init first."
      }
    },
    // PROJ-01: Roadmap requires PROJECT.md
    {
      id: "PROJ-01",
      command: "/idumb:roadmap",
      mustBefore: [{ type: "exists", path: ".planning/PROJECT.md" }],
      onViolation: {
        action: "block",
        message: "PROJECT.md required. Run /idumb:new-project first."
      }
    },
    // PROJ-02: Discuss-phase requires ROADMAP.md
    {
      id: "PROJ-02",
      command: "/idumb:discuss-phase",
      mustBefore: [{ type: "exists", path: ".planning/ROADMAP.md" }],
      onViolation: {
        action: "redirect",
        target: "/idumb:roadmap",
        message: "ROADMAP.md required before discussing phases."
      }
    },
    // PHASE-01: Execute-phase requires PLAN.md
    {
      id: "PHASE-01",
      command: "/idumb:execute-phase",
      mustBefore: [{ type: "exists", path: ".planning/phases/{phase}/*PLAN.md" }],
      onViolation: {
        action: "redirect",
        target: "/idumb:plan-phase",
        message: "PLAN.md required before execution. Creating plan first."
      }
    },
    // PHASE-02: Execute-phase should have CONTEXT.md (warning only)
    {
      id: "PHASE-02",
      command: "/idumb:execute-phase",
      shouldBefore: [{ type: "exists", path: ".planning/phases/{phase}/*CONTEXT.md" }],
      onViolation: {
        action: "warn",
        message: "No CONTEXT.md found. Recommend /idumb:discuss-phase first.",
        continue: true
      }
    },
    // PHASE-03: Verify-work requires execution evidence
    {
      id: "PHASE-03",
      command: "/idumb:verify-work",
      mustBefore: [{
        type: "one_of",
        alternatives: [
          { type: "exists", path: ".planning/phases/{phase}/*SUMMARY.md" },
          { type: "state", state: "phase.status = 'in_progress' OR 'completed'" }
        ]
      }],
      onViolation: {
        action: "block",
        message: "No execution evidence found. Nothing to verify."
      }
    },
    // VAL-01: Phase complete requires VERIFICATION.md
    {
      id: "VAL-01",
      command: "state.phase = 'complete'",
      mustBefore: [{ type: "exists", path: ".planning/phases/{phase}/*VERIFICATION.md" }],
      onViolation: {
        action: "block",
        message: "Cannot mark phase complete without verification evidence."
      }
    }
  ]
}

/**
 * Pattern matcher for commands
 * Supports wildcards like "idumb:*" to match any idumb command
 */
function matchCommand(pattern: string, command: string): boolean {
  // Exact match
  if (pattern === command) return true

  // Wildcard match (e.g., "idumb:*" matches "/idumb:roadmap")
  if (pattern.endsWith("*")) {
    const prefix = pattern.slice(0, -1)
    return command.startsWith(prefix) || command.replace(/^\//, "").startsWith(prefix)
  }

  // Handle commands with or without leading slash
  const normalizedPattern = pattern.replace(/^\//, "")
  const normalizedCommand = command.replace(/^\//, "")

  if (normalizedPattern === normalizedCommand) return true

  // Wildcard without slash
  if (normalizedPattern.endsWith("*")) {
    const prefix = normalizedPattern.slice(0, -1)
    return normalizedCommand.startsWith(prefix)
  }

  return false
}

/**
 * Resolves {phase} placeholder in paths
 * Extracts phase number from command arguments or current state
 */
function resolvePhaseInPath(pathTemplate: string, commandArgs?: string, currentPhase?: string): string {
  if (!pathTemplate.includes("{phase}")) {
    return pathTemplate
  }

  let phase = currentPhase || "01"

  // Try to extract phase from command arguments
  if (commandArgs) {
    const phaseMatch = commandArgs.match(/(\d+)/)
    if (phaseMatch) {
      phase = phaseMatch[1].padStart(2, "0")
    }
  }

  return pathTemplate.replace(/\{phase\}/g, phase)
}

// ============================================================================
// SESSION TRACKING FOR INTERCEPTION (from CONTEXT.md B4)
// ============================================================================

interface SessionTracker {
  firstToolUsed: boolean
  firstToolName: string | null
  agentRole: string | null
  delegationDepth: number
  sessionLevel: number  // S5-R08: Track session hierarchy level (1=root, 2+=subagent)
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

// Pending violations for validation results
const pendingViolations = new Map<string, {
  agent: string
  tool: string
  timestamp: string
  violations: string[]
  shouldBlock: boolean
}>()

function getSessionTracker(sessionId: string): SessionTracker {
  if (!sessionTrackers.has(sessionId)) {
    sessionTrackers.set(sessionId, {
      firstToolUsed: false,
      firstToolName: null,
      agentRole: null,
      delegationDepth: 0,
      sessionLevel: 1,  // S5-R08: Default to root level
      parentSession: null,
      violationCount: 0,
      governanceInjected: false
    })
  }
  return sessionTrackers.get(sessionId)!
}

/**
 * Consume a validation result for a session
 * Returns the violation data and removes it from pending
 */
function consumeValidationResult(sessionId: string): {
  agent: string
  tool: string
  violations: string[]
  shouldBlock: boolean
} | null {
  const violation = pendingViolations.get(sessionId)
  if (!violation) return null

  pendingViolations.delete(sessionId)
  return {
    agent: violation.agent,
    tool: violation.tool,
    violations: violation.violations,
    shouldBlock: violation.shouldBlock
  }
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

/**
 * S5-R08: Detect if this session is a subagent session (Level 2+)
 * Subagent sessions are spawned by task() calls from parent sessions
 * They should NOT receive full governance injection to avoid context bloat
 * 
 * Detection signals:
 * 1. First message contains task() delegation context
 * 2. Tracker has delegationDepth > 0
 * 3. Message contains subagent invocation patterns (@agent-name)
 */
function detectSubagentSession(messages: any[], tracker: SessionTracker): boolean {
  // Signal 1: Tracker already shows delegation depth > 0
  if (tracker.delegationDepth > 0) {
    return true
  }

  // Signal 2: Check for task delegation patterns in first user message
  const firstUserMsg = messages.find((m: any) => m.info?.role === 'user')
  if (firstUserMsg) {
    const text = firstUserMsg.parts?.map((p: any) => p.text || '').join(' ') || ''

    // Task delegation indicators
    const subagentIndicators = [
      'Task:',                    // Explicit task delegation
      'delegated from',           // Delegation context
      '@idumb-',                  // iDumb agent call
      'subagent_type',            // OpenCode task() arg
      'Subtask:',                 // Subtask indicator
      'Delegating to:',           // Delegation marker
      /from @\w+-coordinator/i    // Coordinator delegation
    ]

    for (const indicator of subagentIndicators) {
      if (typeof indicator === 'string') {
        if (text.includes(indicator)) return true
      } else if (indicator instanceof RegExp) {
        if (indicator.test(text)) return true
      }
    }
  }

  return false
}

/**
 * Extract tool name from various tool formats
 * Handles string tool names and object tool references
 */
function extractToolName(tool: any): string {
  if (typeof tool === 'string') return tool
  if (tool?.name) return tool.name
  if (tool?.tool) return tool.tool
  return 'unknown'
}

// ============================================================================
// TOOL PERMISSION MATRIX (from CONTEXT.md B3)
// ============================================================================

function getAllowedTools(agentRole: string | null): string[] {
  // TIER 1: Coordinators - can delegate (task tool) + read context
  const tier1Tools = [
    'task', 'idumb-todo', 'todowrite',
    'read', 'glob', 'grep',  // Context gathering - MUST ALLOW
    'idumb-state', 'idumb-state_read', 'idumb-state_anchor', 'idumb-state_getAnchors', 'idumb-state_history',
    'idumb-context', 'idumb-context_summary',
    'idumb-config', 'idumb-config_read', 'idumb-config_status',
    'idumb-todo', 'idumb-todo_list', 'idumb-todo_hierarchy',
    'idumb-validate', 'idumb-manifest', 'idumb-chunker'
  ]

  // TIER 2: Executors/Planners - can delegate to leaf nodes + read
  const tier2Tools = [
    'task', 'idumb-todo', 'todowrite',
    'read', 'glob', 'grep',
    'idumb-state', 'idumb-state_read', 'idumb-state_anchor', 'idumb-state_getAnchors',
    'idumb-context', 'idumb-config', 'idumb-config_read',
    'idumb-todo', 'idumb-todo_list',
    'idumb-validate', 'idumb-chunker'
  ]

  // TIER 3: Researchers/Validators - read-only + anchoring
  const tier3Tools = [
    'idumb-todo',
    'read', 'glob', 'grep',
    'idumb-state', 'idumb-state_read', 'idumb-state_anchor',
    'idumb-context', 'idumb-config_read',
    'idumb-todo', 'idumb-todo_list',
    'idumb-validate', 'idumb-chunker'
  ]

  // LEAF: Builder - write permissions
  const builderTools = [
    'idumb-todo', 'todowrite',
    'read', 'write', 'edit', 'bash',
    'filesystem_write_file', 'filesystem_edit_file', 'filesystem_read_file',
    'filesystem_read_text_file', 'filesystem_read_multiple_files',
    'filesystem_create_directory', 'filesystem_list_directory',
    'idumb-state', 'idumb-state_anchor', 'idumb-state_history',
    'idumb-todo', 'idumb-todo_complete', 'idumb-todo_update'
  ]

  // LEAF: Validator - read-only validation
  const validatorTools = [
    'idumb-todo',
    'read', 'glob', 'grep', 'bash',
    'filesystem_read_file', 'filesystem_read_text_file', 'filesystem_read_multiple_files',
    'filesystem_list_directory', 'filesystem_list_directory_with_sizes',
    'filesystem_directory_tree', 'filesystem_search_files', 'filesystem_get_file_info',
    'idumb-state', 'idumb-state_read', 'idumb-state_anchor',
    'idumb-validate', 'idumb-validate_structure', 'idumb-validate_schema',
    'idumb-validate_freshness', 'idumb-validate_integrationPoints',
    'idumb-context', 'idumb-config_read',
    'idumb-todo', 'idumb-todo_list',
    'idumb-manifest', 'idumb-manifest_drift', 'idumb-manifest_conflicts',
    'idumb-chunker', 'idumb-chunker_read', 'idumb-chunker_validate'
  ]

  const toolPermissions: Record<string, string[]> = {
    // TIER 1: Coordinators
    'idumb-supreme-coordinator': tier1Tools,
    'idumb-high-governance': tier1Tools,

    // TIER 2: Executors/Planners (can delegate)
    'idumb-executor': tier2Tools,
    'idumb-verifier': tier2Tools,
    'idumb-debugger': tier2Tools,
    'idumb-planner': tier3Tools,  // Planner doesn't delegate
    'idumb-plan-checker': tier3Tools,
    'idumb-roadmapper': tier3Tools,

    // TIER 3: Researchers/Validators (read-only)
    'idumb-integration-checker': tier3Tools,
    'idumb-project-researcher': tier3Tools,
    'idumb-phase-researcher': tier3Tools,
    'idumb-research-synthesizer': tier3Tools,
    'idumb-codebase-mapper': tier3Tools,

    // LEAF NODES
    'idumb-low-validator': validatorTools,
    'idumb-builder': builderTools
  }

  // Return allowed tools - EMPTY ARRAY means ALLOW ALL (no enforcement)
  // For unknown agents, return empty to disable enforcement entirely
  if (!agentRole || !agentRole.startsWith('idumb-')) {
    return []  // Empty = allow all, no enforcement for non-iDumb agents
  }
  return toolPermissions[agentRole] || []  // Empty = allow all for unknown iDumb agents
}

function getRequiredFirstTools(agentRole: string | null): string[] {
  const firstTools: Record<string, string[]> = {
    // TIER 1: Coordinators - state awareness first
    'idumb-supreme-coordinator': ['idumb-todo', 'idumb-state', 'idumb-context', 'read', 'glob'],
    'idumb-high-governance': ['idumb-todo', 'idumb-state', 'read', 'glob'],

    // TIER 2: Executors/Planners
    'idumb-executor': ['idumb-todo', 'idumb-state', 'read'],
    'idumb-verifier': ['idumb-todo', 'idumb-state', 'read'],
    'idumb-debugger': ['idumb-todo', 'idumb-state', 'read', 'grep'],
    'idumb-planner': ['idumb-todo', 'idumb-state', 'read'],
    'idumb-plan-checker': ['idumb-todo', 'idumb-validate', 'read'],
    'idumb-roadmapper': ['idumb-todo', 'idumb-state', 'read'],

    // TIER 3: Researchers/Validators
    'idumb-integration-checker': ['idumb-todo', 'idumb-validate', 'read', 'grep'],
    'idumb-project-researcher': ['idumb-todo', 'read', 'glob'],
    'idumb-phase-researcher': ['idumb-todo', 'read', 'glob'],
    'idumb-research-synthesizer': ['idumb-todo', 'read'],
    'idumb-codebase-mapper': ['idumb-todo', 'read', 'glob', 'grep'],

    // LEAF NODES
    'idumb-low-validator': ['idumb-todo', 'idumb-validate', 'read', 'glob', 'grep'],
    'idumb-builder': ['idumb-todo', 'read']
  }
  // Default fallback - EMPTY = skip first-tool enforcement entirely
  if (!agentRole || !agentRole.startsWith('idumb-')) {
    return []  // Empty = skip enforcement for non-iDumb agents
  }
  return firstTools[agentRole] || []  // Empty = skip for unknown iDumb agents
}

// ============================================================================
// GOVERNANCE PREFIX BUILDER (from CONTEXT.md B4 / Entry Point 1)
// ============================================================================

function buildGovernancePrefix(agentRole: string, directory: string, isResumed: boolean = false): string {
  const state = readState(directory)
  const config = ensureIdumbConfig(directory)
  const commLang = config.user?.language?.communication || 'english'
  const docLang = config.user?.language?.documents || 'english'

  // Get enhanced context
  const todoCount = getPendingTodoCount(directory)
  const staleCheck = isStateStale(directory)

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

  // STALE STATE WARNING
  const staleWarning = staleCheck.stale ? `
⚠️ STALE STATE WARNING:
State is ${staleCheck.hours} hours old (> 48 hours).
Recommend running: /idumb:validate
` : ''

  // TODO COUNT
  const todoInfo = todoCount > 0 ? `
📋 PENDING TASKS: ${todoCount}
` : ''

  // FIRST ACTION REQUIRED based on agent role
  const firstActionRequired: Record<string, string> = {
    'idumb-supreme-coordinator': `
🎯 FIRST ACTION REQUIRED:
1. Use 'idumb-todo' to check current TODO list
2. Review active anchors and phase status
3. Delegate tasks to appropriate agents
`,
    'idumb-high-governance': `
🎯 FIRST ACTION REQUIRED:
1. Use 'idumb-todo' to check current TODO list
2. Assess task requirements
3. Delegate to @idumb-builder or @idumb-low-validator
`,
    'idumb-low-validator': `
🎯 FIRST ACTION REQUIRED:
1. Use 'idumb-todo' to see what needs validation
2. Use 'idumb-validate' to run validation checks
3. Report findings without modifying files
`,
    'idumb-builder': `
🎯 FIRST ACTION REQUIRED:
1. Read existing files before modifying
2. Verify current state with 'idumb-state'
3. Execute changes and verify results
`
  }

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

${firstActionRequired['idumb-supreme-coordinator']}
Current Phase: ${state?.phase || 'init'}
Framework: ${state?.framework || 'none'}
${todoInfo}${staleWarning}
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

${firstActionRequired['idumb-high-governance']}
Current Phase: ${state?.phase || 'init'}
${todoInfo}${staleWarning}
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
- idumb-todo (check tasks)

${firstActionRequired['idumb-low-validator']}
${todoInfo}${staleWarning}
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

${firstActionRequired['idumb-builder']}
${todoInfo}${staleWarning}
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

/**
 * Build a validation failure message for the user
 */
function buildValidationFailureMessage(
  agent: string,
  tool: string,
  violations: string[]
): string {
  const lines: string[] = [
    "🚫 VALIDATION FAILURE - TOOL BLOCKED 🚫",
    "",
    `Agent: ${agent}`,
    `Tool: ${tool}`,
    "",
    "Validation Violations:",
    ...violations.map(v => `  ❌ ${v}`),
    "",
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    "VALIDATION RULES NOT MET",
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    "",
    "This tool execution failed validation checks.",
    "Review the violations above and fix before retrying.",
    "",
    "Next Steps:",
    "1. Review validation requirements",
    "2. Fix the reported issues",
    "3. Re-run the tool with corrected parameters",
    ""
  ]

  return lines.join("\n")
}

function buildViolationGuidance(agent: string, tool: string): string {
  // P3-T1: Enhanced guidance with specific text for each agent role
  const delegationTargets: Record<string, {
    target: string;
    example: string;
    specificGuidance: string;
    actionableSteps: string[];
    documentationLinks: string[];
  }> = {
    'idumb-supreme-coordinator': {
      target: '@idumb-high-governance → @idumb-builder',
      example: `@idumb-high-governance
Task: Coordinate file modification
Sub-delegate to: @idumb-builder
Details: [your specific request]`,
      specificGuidance: 'As Supreme Coordinator, you are at the TOP of the hierarchy. Your role is to DELEGATE ALL WORK. Never execute, never validate, never modify files.',
      actionableSteps: [
        "1. Use 'idumb-todo' to check current TODO list",
        "2. Review active anchors and phase status with 'idumb-state'",
        "3. Delegate tasks to @idumb-high-governance for coordination",
        "4. Follow up on delegated work without doing it yourself"
      ],
      documentationLinks: [
        "- src/agents/idumb-supreme-coordinator.md (your profile)",
        "- src/router/chain-enforcement.md (delegation rules)",
        "- AGENTS.md (hierarchy overview)"
      ]
    },
    'idumb-high-governance': {
      target: '@idumb-builder',
      example: `@idumb-builder
Task: Modify file [path]
Content: [what to change]
Verify: Read file first, commit after`,
      specificGuidance: 'As High Governance, you are a MID-LEVEL COORDINATOR. You coordinate and delegate but NEVER execute directly. Your job is to break down tasks and assign them to builders or validators.',
      actionableSteps: [
        "1. Use 'idumb-todo' to understand current tasks",
        "2. Assess requirements and break down into sub-tasks",
        "3. Delegate execution to @idumb-builder",
        "4. Delegate validation to @idumb-low-validator",
        "5. Synthesize results and report upward"
      ],
      documentationLinks: [
        "- src/agents/idumb-high-governance.md (your profile)",
        "- src/router/chain-enforcement.md (coordination rules)",
        "- .planning/ROADMAP.md (current phase context)"
      ]
    },
    'idumb-low-validator': {
      target: 'Report to parent, DO NOT modify',
      example: `VALIDATION REPORT:
File: [path]
Issue: [what you found]
Recommendation: Delegate to @idumb-builder for fix`,
      specificGuidance: 'As Low Validator, you are a VALIDATION WORKER. You investigate, validate, and report but NEVER modify files. Your findings should be reported to your parent agent.',
      actionableSteps: [
        "1. Use 'idumb-todo' to see what needs validation",
        "2. Use 'read', 'glob', 'grep' to investigate",
        "3. Run 'idumb-validate' for automated checks",
        "4. Report findings to your parent agent",
        "5. DO NOT attempt to fix issues yourself"
      ],
      documentationLinks: [
        "- src/agents/idumb-low-validator.md (your profile)",
        "- src/router/chain-enforcement.md (validation rules)",
        "- .idumb/brain/state.json (current state)"
      ]
    },
    'idumb-builder': {
      target: 'You ARE the executor - verify first',
      example: `Use 'read' tool first to verify target file, then proceed.`,
      specificGuidance: 'As Builder, you are the EXECUTION WORKER. You are the ONLY agent allowed to modify files. You are the LEAF NODE - no further delegation.',
      actionableSteps: [
        "1. Use 'read' to verify target files before modifying",
        "2. Use 'idumb-state' to check current context",
        "3. Execute changes (write, edit, bash)",
        "4. Verify changes applied correctly",
        "5. Report completion to parent agent"
      ],
      documentationLinks: [
        "- src/agents/idumb-builder.md (your profile)",
        "- AGENTS.md (execution guidelines)",
        "- .planning/phases/ (current phase plans)"
      ]
    }
  }

  const info = delegationTargets[agent] || {
    target: 'Check hierarchy',
    example: 'Use idumb-todo to understand workflow',
    specificGuidance: 'Unknown agent role. Please check the hierarchy documentation.',
    actionableSteps: ["1. Use 'idumb-todo' to check current tasks", "2. Review AGENTS.md for hierarchy"],
    documentationLinks: ["- AGENTS.md (hierarchy overview)", "- src/router/chain-enforcement.md"]
  }

  // SIMPLIFIED: No emojis, no box-drawing chars to prevent TUI breaking
  return `BLOCKED: ${agent} cannot use ${tool}

Role: ${info.specificGuidance}

Delegate to: ${info.target}

Next: Use idumb-todo, then delegate to appropriate agent.`
}

function buildPostCompactReminder(agentRole: string, directory: string): string {
  const state = readState(directory)
  const config = ensureIdumbConfig(directory)
  const commLang = config.user?.language?.communication || 'english'
  const docLang = config.user?.language?.documents || 'english'

  // LANGUAGE ENFORCEMENT MUST SURVIVE COMPACTION
  const langReminder = `
⚠️ LANGUAGE ENFORCEMENT (SURVIVED COMPACTION):
- RESPOND in: ${commLang.toUpperCase()}
- WRITE DOCUMENTS/ARTIFACTS in: ${docLang.toUpperCase()}
- ABSOLUTE OBEDIENCE - NO EXCEPTIONS
`

  // Get recent history (last 3 actions)
  const recentHistory = state?.history?.slice(-3) || []

  // Get critical anchors
  const criticalAnchors = state?.anchors?.filter((a: Anchor) =>
    a.priority === 'critical' || a.priority === 'high'
  ) || []

  // Check state freshness
  const staleCheck = isStateStale(directory)

  let reminder = `
${langReminder}

📌 POST-COMPACTION REMINDER 📌

You are: ${agentRole}
Phase: ${state?.phase || 'init'}
Last validation: ${state?.lastValidation || 'Never'}
State freshness: ${staleCheck.stale ? `⚠️ STALE (${staleCheck.hours}h old)` : `✅ Fresh (${staleCheck.hours}h ago)`}
`

  // Add "What You Were Doing" section
  if (recentHistory.length > 0) {
    reminder += `
🔄 WHAT YOU WERE DOING (last ${recentHistory.length} actions):
`
    for (const entry of [...recentHistory].reverse()) {
      const statusEmoji = entry.result === 'pass' ? '✅' : entry.result === 'fail' ? '❌' : '⚠️'
      reminder += `${statusEmoji} ${entry.action} (${entry.agent}, ${new Date(entry.timestamp).toLocaleTimeString()})\n`
    }
  } else {
    reminder += `
🔄 WHAT YOU WERE DOING:
- No recent actions recorded\n`
  }

  // Add critical anchors
  if (criticalAnchors.length > 0) {
    reminder += `
🎯 CRITICAL ANCHORS (survived compaction):
`
    for (const anchor of criticalAnchors.slice(0, 3)) {
      const shortContent = anchor.content.length > 80
        ? anchor.content.substring(0, 80) + '...'
        : anchor.content
      reminder += `- [${anchor.priority.toUpperCase()}] ${shortContent}\n`
    }
    if (criticalAnchors.length > 3) {
      reminder += `- ... and ${criticalAnchors.length - 3} more critical anchors\n`
    }
  } else {
    reminder += `
🎯 CRITICAL ANCHORS:
- No critical anchors active\n`
  }

  // Add next steps based on phase and state
  reminder += `
📋 RECOMMENDED NEXT STEPS:
`

  if (!state?.lastValidation || staleCheck.stale) {
    reminder += `- ⚠️ Run validation: /idumb:validate (state is stale)\n`
  } else {
    reminder += `- ✅ State validated recently, check: /idumb:status\n`
  }

  reminder += `- Check TODOs: Use idumb-todo tool or /idumb:todo\n`
  reminder += `- Review phase status: /idumb:status\n`

  // Add phase-specific recommendations
  if (state?.phase && state.phase !== 'init') {
    reminder += `- Continue phase work: Check .planning/phases/ for active plans\n`
  }

  // Add context recovery warning if needed
  if (recentHistory.length === 0 && criticalAnchors.length === 0) {
    reminder += `- ⚠️ CONTEXT RECOVERY NEEDED: No history or anchors found. Consider reviewing project documentation.\n`
  }

  reminder += `
⚡ HIERARCHY REMINDER:
- Coordinator: Delegate only
- High-Gov: Coordinate and delegate  
- Validator: Validate only
- Builder: Execute only

💡 TIP: Use 'idumb-todo' first to resume workflow.
`

  return reminder
}

function getStatePath(directory: string): string {
  return join(directory, ".idumb", "brain", "state.json")
}

function getLogPath(directory: string): string {
  return join(directory, ".idumb", "governance", "plugin.log")
}

function getLogArchivePath(directory: string, index: number): string {
  return join(directory, ".idumb", "governance", `plugin.log.${index}`)
}

function rotateLogs(directory: string): void {
  try {
    const logPath = getLogPath(directory)

    // Check if current log exists
    if (!existsSync(logPath)) return

    // Read current log content before rotation
    const currentLogContent = readFileSync(logPath, "utf8")

    // Cascade existing archives
    for (let i = MAX_ARCHIVED_LOGS - 1; i >= 1; i--) {
      const oldPath = getLogArchivePath(directory, i)
      const newPath = getLogArchivePath(directory, i + 1)

      if (existsSync(oldPath)) {
        if (i === MAX_ARCHIVED_LOGS - 1) {
          // Delete oldest archive by not copying it
        } else {
          // Copy to next index (since we can't rename easily with our imports)
          try {
            const content = readFileSync(oldPath, "utf8")
            writeFileSync(newPath, content)
          } catch {
            // Ignore copy errors
          }
        }
      }
    }

    // Save current log to .1
    const archivePath = getLogArchivePath(directory, 1)
    writeFileSync(archivePath, currentLogContent)

    // Create new log file with rotation notice
    const timestamp = new Date().toISOString()
    writeFileSync(
      logPath,
      `[${timestamp}] === LOG ROTATED === Previous log moved to plugin.log.1\n`
    )
  } catch {
    // Silent fail - don't break on rotation errors
  }
}

function log(directory: string, message: string): void {
  // File-based logging instead of console.log
  try {
    const logPath = getLogPath(directory)
    const logDir = join(directory, ".idumb", "governance")
    if (!existsSync(logDir)) {
      mkdirSync(logDir, { recursive: true })
    }

    // Check log size before writing (P3-T8)
    if (existsSync(logPath)) {
      try {
        // Get file size by reading and checking byte length
        const currentContent = readFileSync(logPath, "utf8")
        // Approximate byte size: 1 char ≈ 1-2 bytes for UTF-8
        const approxSizeMB = currentContent.length * 2 / (1024 * 1024)
        if (approxSizeMB > MAX_LOG_SIZE_MB) {
          rotateLogs(directory)
        }
      } catch {
        // Ignore stat errors
      }
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
  // Enhanced lifecycle tracking
  compactedAt?: string
  contextSize?: string | number
  resumedAt?: string
  idleAt?: string
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
// SESSION RESUMPTION DETECTION (P1-T1 Enhancement)
// ============================================================================

/**
 * Check if this is a resumed session (idle for > 1 hour but < 48 hours)
 * Returns true if session was active but idle, indicating resumption
 */
function checkIfResumedSession(sessionId: string, directory: string): boolean {
  const metadata = loadSessionMetadata(directory, sessionId)
  if (metadata) {
    const lastUpdated = new Date(metadata.lastUpdated)
    const now = new Date()
    const hoursSinceUpdate = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60)
    // If session was active but idle for > 1 hour, consider it resumed
    // Cap at 48 hours to avoid treating very old sessions as resumed
    return hoursSinceUpdate > 1 && hoursSinceUpdate < 48
  }
  return false
}

/**
 * Build resume context for resumed sessions
 * Includes previous session info, current phase, and active anchors
 */
function buildResumeContext(sessionId: string, directory: string): string {
  const state = readState(directory)
  const metadata = loadSessionMetadata(directory, sessionId)

  if (!metadata) {
    return `
📋 SESSION RESUMED

Previous session data not available.
Resuming workflow...
`
  }

  const hoursSinceLastUpdate = Math.round(
    (new Date().getTime() - new Date(metadata.lastUpdated).getTime()) / (1000 * 60 * 60)
  )

  // Get high priority anchors
  const activeAnchors = state?.anchors?.filter((a: Anchor) =>
    a.priority === 'critical' || a.priority === 'high'
  ) || []

  let context = `
📋 SESSION RESUMED

⏱️  Idle Duration: ${hoursSinceLastUpdate} hour${hoursSinceLastUpdate !== 1 ? 's' : ''}
📅 Previous Session: ${new Date(metadata.createdAt).toLocaleString()}
🎯 Current Phase: ${state?.phase || metadata.phase || 'init'}
📌 Active Anchors: ${activeAnchors.length}
`

  // Add anchor summaries if available
  if (activeAnchors.length > 0) {
    context += `
🔔 Key Context:
`
    for (const anchor of activeAnchors.slice(0, 3)) {
      context += `   • [${anchor.priority.toUpperCase()}] ${anchor.content.substring(0, 80)}${anchor.content.length > 80 ? '...' : ''}\n`
    }
  }

  context += `
⚡ Resuming workflow...
`

  return context
}

/**
 * Get count of pending TODOs from state history
 * Looks for incomplete task entries in recent history
 */
function getPendingTodoCount(directory: string): number {
  const state = readState(directory)
  if (!state || !state.history) return 0

  // Count recent task entries that don't have completion markers
  const recentTasks = state.history.filter((entry: HistoryEntry) => {
    const isTask = entry.action.startsWith('task:') || entry.action.includes('TODO')
    const isIncomplete = entry.result !== 'pass' || !entry.action.includes('complete')
    return isTask && isIncomplete
  })

  // Also check for explicit todo entries
  const todoEntries = state.history.filter((entry: HistoryEntry) =>
    entry.action.toLowerCase().includes('todo') &&
    !entry.action.toLowerCase().includes('complete')
  )

  return Math.max(recentTasks.length, todoEntries.length, 0)
}

/**
 * Check if state is stale based on config.staleness settings
 * Phase 6 Task 6.2: Uses config thresholds instead of hardcoded values
 */
function isStateStale(directory: string): { stale: boolean; hours: number; critical: boolean } {
  const state = readState(directory)
  if (!state) return { stale: true, hours: Infinity, critical: true }

  // Load staleness thresholds from config (Phase 6)
  const config = ensureIdumbConfig(directory)
  const warningHours = config.staleness?.warningHours ?? 48
  const criticalHours = config.staleness?.criticalHours ?? 168

  const lastValidation = state.lastValidation
    ? new Date(state.lastValidation)
    : new Date(state.initialized)
  const now = new Date()
  const hoursSince = (now.getTime() - lastValidation.getTime()) / (1000 * 60 * 60)

  return {
    stale: hoursSince > warningHours,
    critical: hoursSince > criticalHours,
    hours: Math.round(hoursSince)
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
      contextFirst: { enforced: true, requiredFirstTools: ["idumb-todo"], blockWithoutContext: false },
      workflow: { research: true, planCheck: false, verifyAfterExecution: false, commitOnComplete: true }
    },
    guided: {
      mode: "confirmRequired",
      expertSkeptic: { enabled: true, requireEvidence: true, doubleCheckDelegation: true },
      contextFirst: { enforced: true, requiredFirstTools: ["idumb-todo", "idumb-state"], blockWithoutContext: true },
      workflow: { research: true, planCheck: true, verifyAfterExecution: true, commitOnComplete: true }
    },
    strict: {
      mode: "manualOnly",
      expertSkeptic: { enabled: true, requireEvidence: true, doubleCheckDelegation: true },
      contextFirst: { enforced: true, requiredFirstTools: ["idumb-todo", "idumb-state", "idumb-config"], blockWithoutContext: true },
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
// ENFORCEMENT VALIDATION (Phase 7 - Task 7.4)
// ============================================================================

/**
 * Validates enforcement.* settings at session start
 * Per Framework Mindset: "Must at least read and loaded by LLM at starting runtime"
 * Returns validation result with any issues found
 */
function validateEnforcementSettings(
  config: InlineIdumbConfig,
  directory: string
): { valid: boolean; warnings: string[] } {
  const warnings: string[] = []

  // Check mustLoadConfig (always true, already satisfied by loading config)
  if (!config.enforcement?.mustLoadConfig) {
    log(directory, `[ENFORCEMENT] Warning: mustLoadConfig is disabled, should be true`)
    warnings.push('enforcement.mustLoadConfig should be true for proper governance')
  }

  // Check mustHaveState - verify state.json exists
  if (config.enforcement?.mustHaveState) {
    const statePath = join(directory, '.idumb', 'brain', 'state.json')
    if (!existsSync(statePath)) {
      log(directory, `[ENFORCEMENT] Creating missing state.json per mustHaveState=true`)
      // Auto-recover: create default state
      const brainDir = join(directory, '.idumb', 'brain')
      if (!existsSync(brainDir)) {
        mkdirSync(brainDir, { recursive: true })
      }
      const defaultState = getInlineDefaultState()
      writeFileSync(statePath, JSON.stringify(defaultState, null, 2))
      warnings.push('state.json was missing - auto-created with defaults')
    }
  }

  // Check mustCheckHierarchy - verify hierarchy levels defined
  if (config.enforcement?.mustCheckHierarchy) {
    if (!config.hierarchy?.levels) {
      warnings.push('hierarchy.levels not defined - agent hierarchy may not work correctly')
    }
    if (!config.hierarchy?.agents?.order) {
      warnings.push('hierarchy.agents.order not defined - delegation chain may fail')
    }
  }

  // Check blockOnMissingArtifacts - SHOULD be false per user principle "blocking = last resort"
  // Just log a note if it's true (user explicitly wants strict mode)
  if (config.enforcement?.blockOnMissingArtifacts === true) {
    log(directory, `[ENFORCEMENT] Note: blockOnMissingArtifacts=true (strict mode enabled)`)
  }

  // Validate requiredFirstTools includes context-first tools
  const requiredFirstTools = config.automation?.contextFirst?.requiredFirstTools || []
  if (!requiredFirstTools.includes('idumb-todo')) {
    warnings.push('requiredFirstTools missing idumb-todo - context anchoring may fail')
  }

  return {
    valid: warnings.length === 0,
    warnings
  }
}

// ============================================================================
// CHAIN ENFORCEMENT FUNCTIONS (P0-T5)
// ============================================================================

/**
 * Check a single prerequisite
 * Returns { passed: boolean; message?: string }
 */
function checkPrerequisite(
  prereq: Prerequisite,
  directory: string,
  commandArgs?: string
): { passed: boolean; message?: string } {
  const state = readState(directory)
  const currentPhase = state?.phase || "01"

  switch (prereq.type) {
    case "exists": {
      if (!prereq.path) {
        return { passed: false, message: "Prerequisite missing path" }
      }
      // Resolve {phase} placeholder
      const resolvedPath = resolvePhaseInPath(prereq.path, commandArgs, currentPhase)
      const fullPath = join(directory, resolvedPath)
      const exists = existsSync(fullPath)

      if (!exists) {
        return {
          passed: false,
          message: `Required file not found: ${resolvedPath}`
        }
      }
      return { passed: true }
    }

    case "state": {
      if (!prereq.state) {
        return { passed: false, message: "Prerequisite missing state check" }
      }
      // Simple state checks
      if (prereq.state.includes("phase.status")) {
        // Check if phase is in_progress or completed
        const phaseStatus = state?.phase || "init"
        if (prereq.state.includes("in_progress") || prereq.state.includes("completed")) {
          const validStatuses = ["Phase 1", "Phase 2", "Phase 3", "Phase 4", "completed"]
          const isValid = validStatuses.some(s => phaseStatus.toLowerCase().includes(s.toLowerCase()))
          if (!isValid) {
            return {
              passed: false,
              message: `Phase status check failed: ${phaseStatus}`
            }
          }
        }
      }
      return { passed: true }
    }

    case "validation": {
      if (!prereq.validation) {
        return { passed: false, message: "Prerequisite missing validation check" }
      }
      // Check if validation passed in state
      const lastValidation = state?.lastValidation
      if (!lastValidation) {
        return {
          passed: false,
          message: `Validation required: ${prereq.validation}`
        }
      }
      return { passed: true }
    }

    case "one_of": {
      if (!prereq.alternatives || prereq.alternatives.length === 0) {
        return { passed: false, message: "one_of prerequisite missing alternatives" }
      }
      // Check if any alternative passes
      for (const alt of prereq.alternatives) {
        const result = checkPrerequisite(alt, directory, commandArgs)
        if (result.passed) {
          return { passed: true }
        }
      }
      return {
        passed: false,
        message: "None of the alternative prerequisites passed"
      }
    }

    default:
      return { passed: false, message: `Unknown prerequisite type: ${prereq.type}` }
  }
}

/**
 * Check all prerequisites
 * Returns { allPassed: boolean; failures: string[] }
 */
function checkPrerequisites(
  prereqs: Prerequisite[],
  directory: string,
  commandArgs?: string
): { allPassed: boolean; failures: string[] } {
  const failures: string[] = []

  for (const prereq of prereqs) {
    const result = checkPrerequisite(prereq, directory, commandArgs)
    if (!result.passed && result.message) {
      failures.push(result.message)
    }
  }

  return {
    allPassed: failures.length === 0,
    failures
  }
}

/**
 * Build guidance for satisfying a prerequisite (P3-T1)
 */
function buildPrerequisiteGuidance(failure: string): string {
  // Map common failure patterns to actionable guidance
  if (failure.includes("state.json")) {
    return `
    📋 To satisfy: Initialize iDumb
    Command: /idumb:init
    Or: Run 'idumb-state' tool to auto-initialize
    
    📖 See: src/router/chain-enforcement.md (INIT-01)`
  }

  if (failure.includes("PROJECT.md")) {
    return `
    📋 To satisfy: Create project definition
    Command: /idumb:new-project
    
    📖 See: src/router/chain-enforcement.md (PROJ-01)`
  }

  if (failure.includes("ROADMAP.md")) {
    return `
    📋 To satisfy: Generate roadmap
    Command: /idumb:roadmap
    Prerequisites: PROJECT.md must exist first
    
    📖 See: src/router/chain-enforcement.md (PROJ-02)`
  }

  if (failure.includes("PLAN.md")) {
    return `
    📋 To satisfy: Create phase plan
    Command: /idumb:plan-phase [phase-number]
    Example: /idumb:plan-phase 1
    
    📖 See: src/router/chain-enforcement.md (PHASE-01)`
  }

  if (failure.includes("CONTEXT.md")) {
    return `
    📋 To satisfy: Discuss phase context
    Command: /idumb:discuss-phase [phase-number]
    Example: /idumb:discuss-phase 1
    
    📖 See: src/router/chain-enforcement.md (PHASE-02)`
  }

  if (failure.includes("VERIFICATION.md") || failure.includes("verification evidence")) {
    return `
    📋 To satisfy: Complete verification
    Command: /idumb:verify-work
    Or: Create VERIFICATION.md in phase directory
    
    📖 See: src/router/chain-enforcement.md (VAL-01)`
  }

  if (failure.includes("execution evidence")) {
    return `
    📋 To satisfy: Execute phase work
    Command: /idumb:execute-phase [phase-number]
    Or: Create SUMMARY.md in phase directory
    
    📖 See: src/router/chain-enforcement.md (PHASE-03)`
  }

  return `
    📋 To satisfy: Review chain rules
    Command: /idumb:help
    Or: Read src/router/chain-enforcement.md
    
    📖 See: src/router/chain-enforcement.md`
}

/**
 * Build HARD_BLOCK message for chain violations (P3-T1 Enhanced)
 */
function buildChainBlockMessage(
  rule: ChainRule,
  failures: string[],
  command: string
): string {
  const lines: string[] = [
    "🚫 CHAIN ENFORCEMENT BLOCK 🚫",
    "",
    `Rule: ${rule.id}`,
    `Command: ${command}`,
    `Action Type: ${rule.onViolation.action.toUpperCase()}`,
    "",
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    "MISSING PREREQUISITES",
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    "",
    ...failures.map(f => `  ❌ ${f}`),
    "",
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    "HOW TO SATISFY PREREQUISITES",
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    ""
  ]

  // Add specific guidance for each failure
  for (const failure of failures) {
    lines.push(buildPrerequisiteGuidance(failure))
    lines.push("")
  }

  lines.push("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  lines.push("IMMEDIATE ACTION REQUIRED")
  lines.push("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  lines.push("")
  lines.push(rule.onViolation.message)
  lines.push("")

  if (rule.onViolation.action === 'redirect' && rule.onViolation.target) {
    lines.push(`👉 Redirect target: ${rule.onViolation.target}`)
    lines.push(`   Run this command first, then retry: ${command}`)
  }

  lines.push("")
  lines.push("📖 Documentation: src/router/chain-enforcement.md")
  lines.push("💡 Tip: Use --force flag to override (not recommended for block-level violations)")

  return lines.join("\n")
}

/**
 * Build WARN message for chain violations (non-blocking) (P3-T1 Enhanced)
 */
function buildChainWarnMessage(
  rule: ChainRule,
  failures: string[]
): string {
  const lines: string[] = [
    "⚠️ CHAIN ENFORCEMENT WARNING ⚠️",
    "",
    `Rule: ${rule.id}`,
    `Action Type: ${rule.onViolation.action.toUpperCase()}`,
    "",
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    "RECOMMENDED PREREQUISITES MISSING",
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    "",
    ...failures.map(f => `  ⚠️ ${f}`),
    "",
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    "RECOMMENDED ACTIONS",
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    ""
  ]

  // Add specific guidance for each failure
  for (const failure of failures) {
    lines.push(buildPrerequisiteGuidance(failure))
    lines.push("")
  }

  lines.push("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  lines.push("CONTINUING WITH WARNING")
  lines.push("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  lines.push("")
  lines.push(rule.onViolation.message)
  lines.push("")
  lines.push("⚠️ This is a WARNING - execution will continue.")
  lines.push("   However, following the recommendations above is advised.")
  lines.push("")
  lines.push("📖 Documentation: src/router/chain-enforcement.md")

  return lines.join("\n")
}

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

          // P3-T2: Initialize execution metrics tracking
          initializeExecutionMetrics(sessionId as string, directory)

          // P3-T3: Initialize stall detection state
          getStallDetectionState(sessionId as string)

          // Phase 7 - Task 7.4: Validate enforcement.* settings at session start
          // Per Framework Mindset: "Must at least read and loaded by LLM at starting runtime"
          const enforcementValidation = validateEnforcementSettings(config, directory)
          if (!enforcementValidation.valid) {
            for (const warning of enforcementValidation.warnings) {
              log(directory, `[ENFORCEMENT WARNING] ${warning}`)
            }
            addHistoryEntry(
              directory,
              `enforcement_warnings:${enforcementValidation.warnings.length}`,
              'plugin',
              'partial'
            )
          } else {
            log(directory, `[ENFORCEMENT] All settings validated successfully`)
          }
        }

        // Permission replied (enhanced)
        if (event.type === 'permission.replied') {
          const sessionId = event.properties?.sessionID
          const status = event.properties?.status
          const tool = event.properties?.tool

          if (sessionId) {
            if (status === 'deny' && pendingDenials.has(sessionId)) {
              const denial = pendingDenials.get(sessionId)
              log(directory, `[PERMISSION EVENT] Denied ${denial?.agent} using ${denial?.tool}`)

              // Store denial in history for pattern tracking
              addHistoryEntry(
                directory,
                `permission_denied:${denial?.agent}:${denial?.tool}`,
                'plugin',
                'fail'
              )
            } else if (status === 'allow') {
              log(directory, `[PERMISSION EVENT] Allowed ${tool} for session ${sessionId}`)

              // Store allow in history
              addHistoryEntry(
                directory,
                `permission_allowed:${tool}`,
                'plugin',
                'pass'
              )
            }
          }
        }

        // Session idle (enhanced)
        if (event.type === "session.idle") {
          const sessionId = event.properties?.sessionID
          log(directory, `Session idle: ${sessionId}`)

          if (sessionId && sessionTrackers.has(sessionId)) {
            const tracker = sessionTrackers.get(sessionId)

            // Archive session stats before cleanup
            addHistoryEntry(
              directory,
              `session_idle:${sessionId}:violations=${tracker?.violationCount}`,
              'plugin',
              'pass'
            )

            log(directory, `Session stats: violations=${tracker?.violationCount}, depth=${tracker?.delegationDepth}`)

            // Update metadata with idle timestamp
            const metadata = loadSessionMetadata(directory, sessionId)
            if (metadata) {
              metadata.lastUpdated = new Date().toISOString()
              // Store updated metadata
              const metadataPath = join(getSessionsDir(directory), `${sessionId}.json`)
              writeFileSync(metadataPath, JSON.stringify(metadata, null, 2))
            }

            // Clean up tracker (but keep metadata for resumption)
            sessionTrackers.delete(sessionId)

            log(directory, `Session ${sessionId} archived for potential resumption`)
          }
        }

        // Session compacted (enhanced)
        if (event.type === "session.compacted") {
          const sessionId = event.properties?.sessionID
          const contextSize = event.properties?.contextSize || 'unknown'
          log(directory, `Session compacted: ${sessionId}, context size: ${contextSize}`)

          if (sessionId && sessionTrackers.has(sessionId)) {
            const tracker = sessionTrackers.get(sessionId)
            if (tracker) {
              tracker.governanceInjected = false  // Re-inject on next message
            }
          }

          // Update metadata with compaction info
          const metadata = loadSessionMetadata(directory, sessionId)
          if (metadata) {
            metadata.compactedAt = new Date().toISOString()
            metadata.contextSize = contextSize
            const metadataPath = join(getSessionsDir(directory), `${sessionId}.json`)
            writeFileSync(metadataPath, JSON.stringify(metadata, null, 2))
          }

          addHistoryEntry(directory, `session_compacted:${sessionId}`, 'plugin', 'pass')
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

        // NEW: Session resumed handler
        if (event.type === "session.resumed") {
          const sessionId = event.properties?.sessionID
          log(directory, `Session resumed: ${sessionId}`)

          // Re-initialize tracker
          const tracker = getSessionTracker(sessionId as string)
          tracker.governanceInjected = false  // Force re-injection

          // Load previous metadata
          const metadata = loadSessionMetadata(directory, sessionId as string)
          if (metadata) {
            log(directory, `Restored metadata for session ${sessionId}, phase: ${metadata.phase}`)
          }

          addHistoryEntry(directory, `session_resumed:${sessionId}`, 'plugin', 'pass')
        }

        // NEW: Error handling (P3-T2: Track errors in execution metrics)
        if (event.type === "error") {
          const error = event.properties?.error || "Unknown error"
          const context = event.properties?.context || "No context"
          log(directory, `[ERROR] ${error} | Context: ${context}`)
          addHistoryEntry(directory, `error:${error.substring(0, 100)}`, 'plugin', 'fail')

          // P3-T2: Track error in execution metrics
          trackError(directory, 'session_error', error)

          // P3-T3: Check if error limits exceeded
          const limitsCheck = checkLimits(directory)
          if (!limitsCheck.withinLimits) {
            log(directory, `[ERROR LIMITS] ${limitsCheck.violations.join(', ')}`)
            // Note: We don't halt here, just log. The limits are checked at key decision points.
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

        // S5-R08: Detect if this is a subagent session (Level 2+)
        // Subagent sessions are created via task() calls from parent sessions
        // They should NOT receive full governance injection to avoid context bloat
        const isSubagentSession = detectSubagentSession(output.messages, tracker)
        if (isSubagentSession) {
          tracker.sessionLevel = tracker.delegationDepth + 1 // Inherit from delegation chain
          log(directory, `Subagent session detected (Level ${tracker.sessionLevel}), skipping governance injection`)
          // S5-R08: Skip full governance injection for Level 2+ sessions
          // Subagents inherit governance constraints from parent via task delegation
          return
        }

        // Detect session start (no user messages yet processed)
        const userMessages = output.messages.filter((m: any) =>
          m.info?.role === 'user' ||
          m.parts?.some((p: any) => p.type === 'text' && !p.text?.includes('governance'))
        )

        // P1-T1: Enhanced session detection with resumption check
        const isSessionStart = userMessages.length <= 1 && !tracker.governanceInjected
        const isResumedSession = isSessionStart && checkIfResumedSession(sessionId, directory)

        // S5-R08: Only inject governance for Level 1 (root) sessions
        const isLevel1Session = tracker.sessionLevel === 1

        if ((isSessionStart || isResumedSession) && agentRole && isLevel1Session) {
          log(directory, `Session start detected for ${agentRole} (Level 1 - injecting governance)`)

          // Build governance prefix with resumption awareness
          let governancePrefix = buildGovernancePrefix(agentRole, directory, isResumedSession)

          // P1-T1: If resumed session, prepend resume context
          if (isResumedSession) {
            log(directory, `Session resumption detected for ${sessionId}`)
            const resumeContext = buildResumeContext(sessionId, directory)
            governancePrefix = resumeContext + governancePrefix
          }

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
        // Phase 3: Enhanced Semantic Pattern Detection
        // ==========================================

        // Compaction indicators - system/technical signals
        const compactionIndicators = [
          'compacted',
          'summary of our conversation',
          'context has been compacted',
          'previous messages have been summarized',
          'conversation summary',
          'context window',
          'memory has been compacted',
          'session compacted',
          // Phase 3 additions - technical compaction signals
          'checkpoint restored',
          'resuming from',
          'context truncated'
        ]

        // Context loss indicators - semantic signals (qualitative, not quantitative per user principle)
        // Phase 3: Detection signals for anchoring, NOT blocking
        const contextLossIndicators = [
          // Existing patterns
          "i'll need you to provide",
          "can you remind me",
          "what were we working on",
          "i don't have context",
          "please provide context",
          // Phase 3.1: Context loss phrases
          "i don't remember",
          "what file",
          "can you repeat",
          "which file were we",
          "what was the task",
          "where did we leave off",
          // Phase 3.1: Agent confusion patterns
          "i'm not sure",
          "could you clarify",
          "which task",
          "can you specify",
          "i need more information",
          // Phase 3.1: Task drift patterns
          "let me start over",
          "different approach",
          "wait, actually",
          "on second thought",
          "let's go back to"
        ]

        // Phase 3.4: "New session" semantic detector patterns
        // Used for detecting when context should be re-injected (detect & anchor, NOT block)
        const newSessionIndicators = [
          "starting a new session",
          "let's begin fresh",
          "new conversation",
          "from the beginning",
          "start fresh",
          "pick up where we left off"
        ]

        // Primary detection: Look for compaction keywords in messages
        const hasCompactionKeyword = output.messages.some((m: any) =>
          m.parts?.some((p: any) =>
            p.text && compactionIndicators.some(indicator =>
              p.text.toLowerCase().includes(indicator.toLowerCase())
            )
          )
        )

        // Secondary detection: Look for context loss indicators
        const hasContextLossIndicator = output.messages.some((m: any) =>
          m.parts?.some((p: any) =>
            p.text && contextLossIndicators.some(indicator =>
              p.text.toLowerCase().includes(indicator.toLowerCase())
            )
          )
        )

        // Phase 3.4: New session semantic detection
        const hasNewSessionIndicator = output.messages.some((m: any) =>
          m.parts?.some((p: any) =>
            p.text && newSessionIndicators.some(indicator =>
              p.text.toLowerCase().includes(indicator.toLowerCase())
            )
          )
        )

        // Tertiary detection: Message count drop (indicative of compaction)
        // If we have very few messages but governance was previously injected,
        // it suggests compaction occurred
        const hasLowMessageCount = output.messages.length < 5 && tracker.governanceInjected

        // Combined detection - determines if context anchoring is needed
        // NOTE: Per user principle, we DETECT and ANCHOR, never BLOCK
        const isCompacted = hasCompactionKeyword || hasContextLossIndicator || hasLowMessageCount
        const needsContextRecovery = isCompacted || hasNewSessionIndicator

        // Log detection details for debugging with specific reason
        if (needsContextRecovery) {
          const detectionReason = hasCompactionKeyword
            ? 'compaction_keyword'
            : hasContextLossIndicator
              ? 'context_loss_indicator'
              : hasNewSessionIndicator
                ? 'new_session_indicator'
                : 'low_message_count'
          log(directory, `[PHASE 3] Context recovery needed via: ${detectionReason}`)

          // Phase 3: Integrate with stall detection for pattern tracking
          const stallState = getStallDetectionState(sessionId)
          if (stallState && detectionReason !== 'low_message_count') {
            // Track context loss frequency for stall detection
            const pcState = stallState.plannerChecker
            pcState.issuesHashHistory.push(detectionReason)
            if (pcState.issuesHashHistory.length > 10) {
              pcState.issuesHashHistory.shift()
            }
          }
        }

        if (needsContextRecovery && agentRole) {
          log(directory, `Post-compact recovery for ${agentRole}`)

          const lastMsg = output.messages[output.messages.length - 1]

          if (lastMsg) {
            const reminder = buildPostCompactReminder(agentRole, directory)
            lastMsg.parts.push({
              type: 'text',
              text: reminder
            })

            tracker.governanceInjected = true

            // Phase 3: Add history entry for context recovery
            addHistoryEntry(
              directory,
              `context_recovery:${agentRole}`,
              'plugin',
              'pass'
            )
          }
        }

      } catch (error) {
        log(directory, `[ERROR] messages.transform failed: ${error instanceof Error ? error.message : String(error)}`)
      }
    },

    // ========================================================================
    // PERMISSION ASK HOOK (Entry Point 4 - Permission Auto-Deny from P1-T3)
    // ========================================================================

    "permission.ask": async (input: any, output: any) => {
      try {
        const { tool, sessionID, messages } = input
        const sessionId = sessionID || 'unknown'
        const tracker = getSessionTracker(sessionId)

        // Detect agent role from tracker or messages
        let agentRole = tracker.agentRole
        if (!agentRole && messages) {
          agentRole = detectAgentFromMessages(messages)
          if (agentRole) {
            tracker.agentRole = agentRole
          }
        }

        const allowedTools = getAllowedTools(agentRole)
        const toolName = extractToolName(tool)

        // Check if tool is allowed for this agent
        const isAllowed = allowedTools.some(allowed =>
          toolName === allowed || toolName.includes(allowed)
        )

        if (agentRole && allowedTools.length > 0 && !isAllowed) {
          // LOG ONLY - DO NOT DENY
          // output.status = "deny"
          log(directory, `[WARN] ${agentRole} permission for ${toolName} - LOG ONLY, not blocking`)

          // Add to pending denials for tracking (but not blocking)
          pendingDenials.set(sessionId, {
            agent: agentRole || 'unknown',
            tool: toolName,
            timestamp: new Date().toISOString(),
            shouldBlock: false  // LOG ONLY - do not block
          })

          // Add to pending violations for tracking (P1-T3) - LOG ONLY
          pendingViolations.set(sessionId, {
            agent: agentRole || 'unknown',
            tool: toolName,
            timestamp: new Date().toISOString(),
            violations: [`Tool '${toolName}' not in allowed list for ${agentRole}`],
            shouldBlock: false  // LOG ONLY - do not block
          })

          addHistoryEntry(
            directory,
            `permission_denied:${agentRole}:${toolName}`,
            'interceptor',
            'fail'
          )

          // Permission denied - output.status already set to "deny"
          return
        }

        // Permission granted - output.status remains default (allow)
      } catch (error) {
        log(directory, `[ERROR] permission.ask failed: ${error instanceof Error ? error.message : String(error)}`)
        // Default to allowing on error (fail open for safety)
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

          // SKIP enforcement if empty array (non-iDumb or unknown agent)
          if (requiredFirst.length > 0 && !requiredFirst.includes(toolName)) {
            tracker.violationCount++
            log(directory, `[WARN] ${agentRole} used ${toolName} as first tool (expected: ${requiredFirst.join(', ')})`)
            // LOG ONLY - NO BLOCKING
            addHistoryEntry(
              directory,
              `warn:first_tool:${agentRole}:${toolName}`,
              'interceptor',
              'warn'
            )
          } else {
            log(directory, `[OK] ${agentRole} used ${toolName} as first tool`)
          }
        }

        // ==========================================
        // FILE MODIFICATION ENFORCEMENT - LOG ONLY, NO BLOCKING
        // ==========================================

        if ((toolName === 'edit' || toolName === 'write') && agentRole && agentRole.startsWith('idumb-') && agentRole !== 'idumb-builder') {
          log(directory, `[WARN] ${agentRole} attempted file modification - LOG ONLY`)
          // LOG ONLY - NO BLOCKING - let the tool run
          addHistoryEntry(
            directory,
            `warn:file_mod:${agentRole}:${toolName}`,
            'interceptor',
            'warn'
          )
          // DO NOT return - let tool proceed
        }

        // ==========================================
        // GENERAL PERMISSION CHECK - LOG ONLY, NO BLOCKING
        // ==========================================

        const allowedTools = getAllowedTools(agentRole)

        // Only log if known iDumb agent and tool not in allowed list
        if (agentRole && agentRole.startsWith('idumb-') && allowedTools.length > 0 && !allowedTools.includes(toolName)) {
          log(directory, `[WARN] ${agentRole} used tool not in allowed list: ${toolName} - LOG ONLY`)
          // LOG ONLY - NO BLOCKING - let the tool run
          addHistoryEntry(
            directory,
            `warn:general:${agentRole}:${toolName}`,
            'interceptor',
            'warn'
          )
          // DO NOT return - let tool proceed
        }

        // ==========================================
        // DELEGATION TRACKING (P3-T2, P3-T3)
        // ==========================================

        if (toolName === "task") {
          const desc = output.args?.description || "unknown"
          const agent = output.args?.subagent_type || "general"
          log(directory, `[TASK] Delegation: ${agent} - ${desc}`)
          tracker.delegationDepth++

          // P3-T2: Track agent spawn in execution metrics
          trackAgentSpawn(directory, agent)

          // P3-T3: Track delegation depth with stall detection
          const delegationResult = trackDelegationDepth(sessionId, agent)

          // P3-T3: Check for max delegation depth exceeded
          if (delegationResult.maxReached) {
            const haltMessage = triggerEmergencyHalt(
              directory,
              sessionId,
              "MAX_DELEGATION_DEPTH_EXCEEDED",
              {
                depth: delegationResult.depth,
                maxAllowed: 3,
                agent: agent,
                description: desc
              }
            )

            // Block the delegation by modifying output args
            output.args = {
              __BLOCKED_BY_GOVERNANCE__: true,
              __VIOLATION__: "Maximum delegation depth exceeded (max: 3)",
              __HALT_MESSAGE__: haltMessage
            }

            log(directory, `[EMERGENCY HALT] Max delegation depth exceeded: ${delegationResult.depth}`)
            return
          }
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
        // VALIDATION VIOLATION CHECK
        // ==========================================

        const validationResult = consumeValidationResult(sessionId)
        if (validationResult && validationResult.shouldBlock) {
          // Build validation failure message
          const failureMessage = buildValidationFailureMessage(
            validationResult.agent,
            validationResult.tool,
            validationResult.violations
          )

          // COMPLETELY REPLACE output with validation failure message
          output.output = failureMessage
          output.title = `🚫 VALIDATION FAILED: ${validationResult.tool}`

          log(directory, `[VALIDATION BLOCKED] ${validationResult.agent} using ${validationResult.tool} - ${validationResult.violations.length} violations`)

          // STOP PROCESSING
          return
        }

        // ==========================================
        // NORMAL PROCESSING (non-blocked tools)
        // ==========================================

        // Record completed task delegations
        // NOTE: Cannot access original args here per OpenCode API
        // output contains: { title, output, metadata } - no error field
        if (toolName === "task") {
          // P3-T3 BUG FIX: Pop delegation depth when task completes
          // This was never called, causing delegation stack to grow indefinitely
          // and triggering false MAX_DELEGATION_DEPTH_EXCEEDED errors
          popDelegationDepth(sessionId)

          // Infer success from output.metadata or output.output content
          const hasError = output.output?.toLowerCase().includes('error') ||
            output.output?.toLowerCase().includes('failed')
          const result = hasError ? "fail" : "pass"
          addHistoryEntry(directory, `task:${output.title || "unknown"}`, "plugin", result as "pass" | "fail")
          log(directory, `Task completed: ${result} (depth: ${stallDetectionState.get(sessionId)?.delegation.depth || 0})`)
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
        const { command, arguments: args } = input

        // Log iDumb command execution
        if (command.startsWith("idumb:") || command.startsWith("idumb-")) {
          log(directory, `[CMD] iDumb command starting: ${command}`)
        }

        // ==========================================
        // CHAIN ENFORCEMENT (P0-T5)
        // ==========================================

        // 1. Readonly command bypass
        if (READONLY_COMMANDS.includes(command)) {
          log(directory, `[CHAIN] Readonly command bypass: ${command}`)
          return
        }

        // 2. Emergency bypass check
        if (args.includes('--emergency') || args.includes('--bypass-chain')) {
          log(directory, `[CHAIN] Emergency bypass used: ${command}`)
          addHistoryEntry(directory, `chain_bypass:${command}`, 'interceptor', 'pass')
          return
        }

        // 3. Get chain rules and find matching rule
        const rules = getChainRules()
        const matchingRule = rules.find(rule => {
          if (rule.except?.includes(command)) return false
          return matchCommand(rule.command, command)
        })

        if (!matchingRule) {
          log(directory, `[CHAIN] No chain rule for: ${command}`)
          return
        }

        log(directory, `[CHAIN] Checking rule ${matchingRule.id} for ${command}`)

        // 4. Check mustBefore prerequisites (HARD_BLOCK)
        if (matchingRule.mustBefore && matchingRule.mustBefore.length > 0) {
          const { allPassed, failures } = checkPrerequisites(
            matchingRule.mustBefore,
            directory,
            args
          )

          if (!allPassed) {
            // Check for --force override on SOFT_BLOCK only
            if (args.includes('--force') && matchingRule.onViolation.action !== 'block') {
              log(directory, `[CHAIN] --force override used for ${command}`)
              addHistoryEntry(directory, `chain_force:${command}`, 'interceptor', 'pass')
            } else {
              // HARD_BLOCK
              const blockMsg = buildChainBlockMessage(matchingRule, failures, command)

              output.parts.push({
                type: 'text',
                text: blockMsg
              })

              log(directory, `[CHAIN] BLOCKED ${command} - rule ${matchingRule.id}`)
              addHistoryEntry(
                directory,
                `chain_block:${matchingRule.id}:${command}`,
                'interceptor',
                'fail'
              )

              // If redirect target specified, add redirect instruction
              if (matchingRule.onViolation.action === 'redirect' && matchingRule.onViolation.target) {
                output.parts.push({
                  type: 'text',
                  text: `\n\n👉 Redirecting to: ${matchingRule.onViolation.target}`
                })
              }

              return
            }
          }
        }

        // 5. Check shouldBefore prerequisites (WARN)
        if (matchingRule.shouldBefore && matchingRule.shouldBefore.length > 0) {
          const { allPassed, failures } = checkPrerequisites(
            matchingRule.shouldBefore,
            directory,
            args
          )

          if (!allPassed) {
            const warnMsg = buildChainWarnMessage(matchingRule, failures)

            output.parts.push({
              type: 'text',
              text: warnMsg
            })

            log(directory, `[CHAIN] WARNING ${command} - rule ${matchingRule.id}`)
            addHistoryEntry(
              directory,
              `chain_warn:${matchingRule.id}:${command}`,
              'interceptor',
              'partial'
            )

            // Continue execution after warning (shouldBefore is soft)
            if (matchingRule.onViolation.continue !== false) {
              return
            }
          }
        }

        log(directory, `[CHAIN] ALLOWED ${command}`)

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
    // For active enforcement, agents should use idumb-todo/todowrite tools
    // and the STOP PREVENTION protocol in their system prompts.
  }
}

// Default export for plugin loading
export default IdumbCorePlugin
