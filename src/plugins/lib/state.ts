/**
 * iDumb Plugin State Management
 * 
 * Read/write functions for .idumb/idumb-brain/state.json
 * Core state operations used by multiple modules.
 * 
 * CRITICAL: NO console.log anywhere - causes TUI background text exposure
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, renameSync, unlinkSync } from "fs"
import { join } from "path"
import type { IdumbState } from "./types"

// ============================================================================
// STATE PATH HELPERS
// ============================================================================

export function getStatePath(directory: string): string {
    return join(directory, ".idumb", "idumb-brain", "state.json")
}

export function getBrainDir(directory: string): string {
    return join(directory, ".idumb", "idumb-brain")
}

// ============================================================================
// STATE CRUD OPERATIONS
// ============================================================================

/**
 * Read state from .idumb/idumb-brain/state.json
 * Returns null if state file doesn't exist or is corrupted
 */
export function readState(directory: string): IdumbState | null {
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

/**
 * Write state to .idumb/idumb-brain/state.json
 * Uses atomic write pattern (write temp, then rename) to prevent corruption
 */
export function writeState(directory: string, state: IdumbState): void {
    const brainDir = getBrainDir(directory)
    if (!existsSync(brainDir)) {
        mkdirSync(brainDir, { recursive: true })
    }
    const statePath = getStatePath(directory)
    const tempPath = statePath + ".tmp." + Date.now()
    
    try {
        // Write to temp file first
        writeFileSync(tempPath, JSON.stringify(state, null, 2))
        // Atomic rename (safe on POSIX, mostly safe on Windows)
        renameSync(tempPath, statePath)
    } catch (error) {
        // Clean up temp file on failure
        try {
            if (existsSync(tempPath)) {
                unlinkSync(tempPath)
            }
        } catch {}
        throw error
    }
}

/**
 * Add an entry to state history
 * Keeps last 50 entries to prevent unbounded growth
 */
export function addHistoryEntry(
    directory: string,
    action: string,
    agent: string,
    result: "pass" | "fail" | "partial"
): void {
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
// DEFAULT STATE FACTORY
// ============================================================================

export function getDefaultState(): IdumbState {
    return {
        version: "0.3.1",
        initialized: new Date().toISOString(),
        framework: "none",
        phase: "init",
        lastValidation: null,
        validationCount: 0,
        anchors: [],
        history: [],
        // NEW: Output style tracking
        activeStyle: "default",
        styleHistory: []
    }
}
