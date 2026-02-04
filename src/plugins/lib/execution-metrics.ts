/**
 * iDumb Plugin Execution Metrics & Stall Detection
 *
 * Tracks execution metrics, detects planner/validator stalls.
 *
 * CRITICAL: NO console.log anywhere - causes TUI background text exposure
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs"
import { join } from "path"
import type { ExecutionMetrics, StallDetection } from "./types"
import { log } from "./logging"
import { addHistoryEntry } from "./state"

// ============================================================================
// PATH HELPERS
// ============================================================================

export function getExecutionMetricsPath(directory: string): string {
    return join(directory, ".idumb", "brain", "execution-metrics.json")
}

// ============================================================================
// EXECUTION METRICS CRUD
// ============================================================================

/**
 * Initialize execution metrics for a new session
 */
export function initializeExecutionMetrics(sessionId: string, directory: string): ExecutionMetrics {
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
            // NOTE: No maxDelegationDepth - agents in mode: all can do anything
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

/**
 * Load execution metrics from disk
 */
export function loadExecutionMetrics(directory: string): ExecutionMetrics | null {
    try {
        const metricsPath = getExecutionMetricsPath(directory)
        if (!existsSync(metricsPath)) return null
        const content = readFileSync(metricsPath, "utf8")
        return JSON.parse(content) as ExecutionMetrics
    } catch {
        return null
    }
}

/**
 * Save execution metrics to disk
 */
export function saveExecutionMetrics(directory: string, metrics: ExecutionMetrics): void {
    try {
        const metricsPath = getExecutionMetricsPath(directory)
        writeFileSync(metricsPath, JSON.stringify(metrics, null, 2))
    } catch {
        // Silent fail
    }
}

/**
 * Track an iteration
 */
export function trackIteration(directory: string, type: 'plannerChecker' | 'validatorFix'): void {
    const metrics = loadExecutionMetrics(directory)
    if (!metrics) return

    metrics.iterationCounts[type]++
    metrics.iterationCounts.total++
    saveExecutionMetrics(directory, metrics)
    log(directory, `Iteration tracked: ${type} (total: ${metrics.iterationCounts.total})`)
}

/**
 * Track an agent spawn
 */
export function trackAgentSpawn(directory: string, agentName: string): void {
    const metrics = loadExecutionMetrics(directory)
    if (!metrics) return

    metrics.agentSpawns.total++
    metrics.agentSpawns.byAgent[agentName] = (metrics.agentSpawns.byAgent[agentName] || 0) + 1
    saveExecutionMetrics(directory, metrics)
    log(directory, `Agent spawn tracked: ${agentName} (total: ${metrics.agentSpawns.total})`)
}

/**
 * Track an error
 */
export function trackError(directory: string, errorType: string, message: string): void {
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

/**
 * Check if execution limits are exceeded
 */
export function checkLimits(directory: string): { withinLimits: boolean; violations: string[] } {
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
// STALL DETECTION
// ============================================================================

// In-memory stall detection state (per session)
const stallDetectionState = new Map<string, StallDetection>()

/**
 * Get or create stall detection state for a session
 */
export function getStallDetectionState(sessionId: string): StallDetection {
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
            }
        })
    }
    return stallDetectionState.get(sessionId)!
}

/**
 * Simple hash function for detecting unchanged content
 */
export function simpleHash(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash
    }
    return hash.toString(16)
}

/**
 * Detect if planner-checker is in a stall (unchanged issues, no score improvement)
 */
export function detectPlannerCheckerStall(
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

/**
 * Detect if validator-fix is in a stall (same error repeated)
 */
export function detectValidatorFixStall(
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

/**
 * Track delegation depth when spawning a all
 */
export function trackDelegationDepth(
    sessionId: string,
    agentName: string
): { depth: number; maxReached: boolean } {
    // REMOVED: Delegation depth tracking is no longer needed
    // Agents in mode: all can do anything, including further delegation
    return { depth: 0, maxReached: false }
}

/**
 * Pop delegation depth when returning from all
 */
export function popDelegationDepth(sessionId: string): void {
    // REMOVED: Delegation depth tracking is no longer needed
    // This function exists for API compatibility but does nothing
}

/**
 * Trigger emergency halt and create checkpoint
 */
export function triggerEmergencyHalt(
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
EXECUTION STOPPED DUE TO STALL DETECTION
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
