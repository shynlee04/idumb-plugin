/**
 * iDumb Plugin Checkpoint Management
 * 
 * Checkpoint CRUD operations for execution state snapshots.
 * Stores checkpoints in .idumb/brain/execution/{phase}/
 * 
 * CRITICAL: NO console.log anywhere - causes TUI background text exposure
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync } from "fs"
import { join } from "path"
import type { Checkpoint } from "./types"
import { log } from "./logging"
import { readState, addHistoryEntry } from "./state"

// ============================================================================
// PATH HELPERS
// ============================================================================

/**
 * Get the checkpoint directory path for a phase
 */
export function getCheckpointDir(directory: string, phase: string): string {
    return join(directory, ".idumb", "brain", "execution", phase)
}

/**
 * Generate a unique checkpoint ID
 * Format: checkpoint-{phase}-{task}-{timestamp}
 */
export function generateCheckpointId(phase: string, task: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const safePhase = phase.replace(/[^a-zA-Z0-9_-]/g, '-')
    const safeTask = task.replace(/[^a-zA-Z0-9_-]/g, '-')
    return `checkpoint-${safePhase}-${safeTask}-${timestamp}`
}

// ============================================================================
// GIT INTEGRATION
// ============================================================================

/**
 * Get current git hash if in a git repository
 */
export function getCurrentGitHash(directory: string): string | null {
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
export function getFileChanges(directory: string, phase: string): {
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

// ============================================================================
// CHECKPOINT CRUD OPERATIONS
// ============================================================================

/**
 * Create a new checkpoint
 */
export async function createCheckpoint(
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
export function loadCheckpoint(directory: string, checkpointId: string): Checkpoint | null {
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
export function listCheckpoints(directory: string, phase: string): Checkpoint[] {
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
export function getLatestCheckpoint(directory: string, phase: string): Checkpoint | null {
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
export function markCheckpointCorrupted(directory: string, checkpointId: string): boolean {
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
export function deleteCheckpoint(directory: string, checkpointId: string): boolean {
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
