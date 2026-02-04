/**
 * iDumb Plugin Chain Rules Enforcement
 * 
 * Enforces MUST-BEFORE and SHOULD-BEFORE dependencies between commands.
 * Implements blocking and warning mechanisms per chain-enforcement.md.
 * 
 * CRITICAL: NO console.log anywhere - causes TUI background text exposure
 */

import { existsSync } from "fs"
import { join } from "path"
import type { ChainRule, Prerequisite } from "./types"
import { readState } from "./state"

// ============================================================================
// READONLY COMMANDS (bypass chain enforcement)
// ============================================================================

export const READONLY_COMMANDS = [
    "/idumb:status",
    "/idumb:help",
    "/idumb:validate",
    "/idumb:init"
]

// ============================================================================
// CHAIN RULES
// ============================================================================

/**
 * Returns hardcoded chain rules from chain-enforcement.md
 * These enforce MUST-BEFORE dependencies between commands
 */
export function getChainRules(): ChainRule[] {
    return [
        // INIT-01: All idumb commands require state.json except init/help
        {
            id: "INIT-01",
            command: "idumb:*",
            mustBefore: [{ type: "exists", path: ".idumb/idumb-brain/state.json" }],
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

// ============================================================================
// PATTERN MATCHING
// ============================================================================

/**
 * Pattern matcher for commands
 * Supports wildcards like "idumb:*" to match any idumb command
 */
export function matchCommand(pattern: string, command: string): boolean {
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
export function resolvePhaseInPath(pathTemplate: string, commandArgs?: string, currentPhase?: string): string {
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
// PREREQUISITE CHECKING
// ============================================================================

/**
 * Check a single prerequisite
 * Returns { passed: boolean; message?: string }
 */
export function checkPrerequisite(
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
export function checkPrerequisites(
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

// ============================================================================
// GUIDANCE BUILDING
// ============================================================================

/**
 * Build guidance for satisfying a prerequisite (P3-T1)
 */
export function buildPrerequisiteGuidance(failure: string): string {
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
export function buildChainBlockMessage(
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
export function buildChainWarnMessage(
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
