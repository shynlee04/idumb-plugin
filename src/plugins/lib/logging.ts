/**
 * iDumb Plugin Logging Utilities
 * 
 * File-based logging for plugin operations.
 * Uses log rotation to prevent unbounded growth.
 * 
 * CRITICAL: NO console.log anywhere - causes TUI background text exposure
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, appendFileSync } from "fs"
import { join } from "path"

// ============================================================================
// LOG ROTATION CONSTANTS (P3-T8)
// ============================================================================

const MAX_LOG_SIZE_MB = 5
const MAX_ARCHIVED_LOGS = 3

// ============================================================================
// PATH HELPERS
// ============================================================================

export function getLogPath(directory: string): string {
    return join(directory, ".idumb", "governance", "plugin.log")
}

export function getLogArchivePath(directory: string, index: number): string {
    return join(directory, ".idumb", "governance", `plugin.log.${index}`)
}

// ============================================================================
// LOG ROTATION
// ============================================================================

export function rotateLogs(directory: string): void {
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

// ============================================================================
// MAIN LOGGING FUNCTION
// ============================================================================

/**
 * File-based logging instead of console.log
 * Includes automatic log rotation when size exceeds MAX_LOG_SIZE_MB
 */
export function log(directory: string, message: string): void {
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
