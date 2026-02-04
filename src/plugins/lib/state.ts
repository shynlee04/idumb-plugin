/**
 * iDumb Plugin State Management
 * 
 * Read/write functions for .idumb/brain/state.json
 * Core state operations used by multiple modules.
 * 
 * CRITICAL: NO console.log anywhere - causes TUI background text exposure
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs"
import { join } from "path"
import type { IdumbState } from "./types"

// ============================================================================
// STATE PATH HELPERS
// ============================================================================

export function getStatePath(directory: string): string {
    return join(directory, ".idumb", "brain", "state.json")
}

export function getBrainDir(directory: string): string {
    return join(directory, ".idumb", "brain")
}

// ============================================================================
// STATE CRUD OPERATIONS
// ============================================================================

/**
 * Read state from .idumb/brain/state.json
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
 * Write state to .idumb/brain/state.json
 * Creates brain directory if it doesn't exist
 */
export function writeState(directory: string, state: IdumbState): void {
    const brainDir = getBrainDir(directory)
    if (!existsSync(brainDir)) {
        mkdirSync(brainDir, { recursive: true })
    }
    const statePath = getStatePath(directory)
    writeFileSync(statePath, JSON.stringify(state, null, 2))
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
        version: "0.1.0",
        initialized: new Date().toISOString(),
        framework: "none",
        phase: "init",
        lastValidation: null,
        validationCount: 0,
        anchors: [],
        history: []
    }
}
