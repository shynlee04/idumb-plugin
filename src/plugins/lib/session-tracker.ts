/**
 * iDumb Plugin Session Tracking
 *
 * In-memory session state management and metadata persistence.
 * Tracks agent roles and session state.
 *
 * CRITICAL: NO console.log anywhere - causes TUI background text exposure
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs"
import { join } from "path"
import type {
    SessionTracker,
    SessionMetadata,
    Anchor,
    HistoryEntry,
    PendingDenial,
    PendingViolation
} from "./types"
import { readState } from "./state"

// ============================================================================
// PATH HELPERS
// ============================================================================

export function getSessionsDir(directory: string): string {
    return join(directory, ".idumb", "sessions")
}

// ============================================================================
// IN-MEMORY SESSION STATE
// ============================================================================

// In-memory session state
const sessionTrackers = new Map<string, SessionTracker>()

// Pending denials for error transformation
const pendingDenials = new Map<string, PendingDenial>()

// Pending violations for validation results
const pendingViolations = new Map<string, PendingViolation>()

// ============================================================================
// SESSION CLEANUP (Phase 0 - Memory Management)
// ============================================================================

const SESSION_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours
const MAX_SESSIONS = 100

/**
 * Clean up stale sessions to prevent memory leaks
 * Called on session.created and session.idle events
 */
export function cleanupStaleSessions(): number {
    const now = Date.now()
    const toDelete: string[] = []
    
    sessionTrackers.forEach((tracker, sessionId) => {
        const lastActivity = tracker.lastActivity?.getTime() || 0
        if (now - lastActivity > SESSION_TTL_MS) {
            toDelete.push(sessionId)
        }
    })
    
    // LRU eviction if over max
    if (sessionTrackers.size > MAX_SESSIONS) {
        const sorted = [...sessionTrackers.entries()]
            .sort((a, b) => {
                const aTime = a[1].lastActivity?.getTime() || 0
                const bTime = b[1].lastActivity?.getTime() || 0
                return aTime - bTime
            })
        while (sorted.length > MAX_SESSIONS) {
            const [id] = sorted.shift()!
            if (!toDelete.includes(id)) {
                toDelete.push(id)
            }
        }
    }
    
    toDelete.forEach(id => {
        sessionTrackers.delete(id)
        pendingDenials.delete(id)
        pendingViolations.delete(id)
    })
    
    return toDelete.length
}

// ============================================================================
// SESSION TRACKER CRUD
// ============================================================================

/**
 * Get or create session tracker for a session
 */
export function getSessionTracker(sessionId: string): SessionTracker {
    if (!sessionTrackers.has(sessionId)) {
        sessionTrackers.set(sessionId, {
            firstToolUsed: false,
            firstToolName: null,
            agentRole: null,
            violationCount: 0,
            governanceInjected: false,
            lastActivity: new Date(),
            startTime: new Date(),
            activeStyle: undefined,
            styleCache: undefined
        })
    }
    
    // Update last activity on access
    const tracker = sessionTrackers.get(sessionId)!
    tracker.lastActivity = new Date()
    
    return tracker
}

/**
 * Add a pending denial for a session
 */
export function addPendingDenial(sessionId: string, denial: PendingDenial): void {
    pendingDenials.set(sessionId, denial)
}

/**
 * Get and remove pending denial for a session
 */
export function consumePendingDenial(sessionId: string): PendingDenial | null {
    const denial = pendingDenials.get(sessionId)
    if (denial) {
        pendingDenials.delete(sessionId)
        return denial
    }
    return null
}

/**
 * Add a pending violation for a session
 */
export function addPendingViolation(sessionId: string, violation: PendingViolation): void {
    pendingViolations.set(sessionId, violation)
}

/**
 * Consume a validation result for a session
 * Returns the violation data and removes it from pending
 */
export function consumeValidationResult(sessionId: string): {
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

// ============================================================================
// AGENT DETECTION
// ============================================================================

/**
 * Detect agent role from session messages
 */
export function detectAgentFromMessages(messages: any[]): string | null {
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
 * Extract tool name from various tool formats
 * Handles string tool names and object tool references
 */
export function extractToolName(tool: any): string {
    if (typeof tool === 'string') return tool
    if (tool?.name) return tool.name
    if (tool?.tool) return tool.tool
    return 'unknown'
}

// ============================================================================
// SESSION METADATA PERSISTENCE
// ============================================================================

/**
 * Store session metadata to disk
 * Uses ensureIdumbConfig to get language settings
 */
export function storeSessionMetadata(
    directory: string,
    sessionId: string,
    config: { user?: { language?: { communication: string; documents: string } } }
): void {
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
    const metadata: SessionMetadata = {
        sessionId,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        phase: state?.phase || "init",
        governanceLevel: "standard",
        language: {
            communication: config.user?.language?.communication || 'english',
            documents: config.user?.language?.documents || 'english'
        }
    }

    writeFileSync(metadataPath, JSON.stringify(metadata, null, 2))
}

/**
 * Load session metadata from disk
 */
export function loadSessionMetadata(directory: string, sessionId: string): SessionMetadata | null {
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
// SESSION RESUMPTION DETECTION
// ============================================================================

/**
 * Check if this is a resumed session (idle for > 1 hour but < 48 hours)
 * Returns true if session was active but idle, indicating resumption
 */
export function checkIfResumedSession(sessionId: string, directory: string): boolean {
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
export function buildResumeContext(sessionId: string, directory: string): string {
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
export function getPendingTodoCount(directory: string): number {
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
export function isStateStale(
    directory: string,
    config: { staleness?: { warningHours?: number; criticalHours?: number } }
): { stale: boolean; hours: number; critical: boolean } {
    const state = readState(directory)
    if (!state) return { stale: true, hours: Infinity, critical: true }

    // Load staleness thresholds from config (Phase 6)
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
