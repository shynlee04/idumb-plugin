/**
 * iDumb Plugin Configuration Management
 * 
 * Ensures config exists and validates enforcement settings.
 * Auto-generates config with defaults if missing.
 * 
 * CRITICAL: NO console.log anywhere - causes TUI background text exposure
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs"
import { join } from "path"
import type { InlineIdumbConfig } from "./types"
import { log } from "./logging"
import { getDefaultState } from "./state"

// ============================================================================
// CONFIG PATH HELPERS
// ============================================================================

export function getConfigPath(directory: string): string {
    return join(directory, ".idumb", "idumb-brain", "config.json")
}

export function getIdumbDir(directory: string): string {
    return join(directory, ".idumb")
}

// ============================================================================
// DEFAULT CONFIG FACTORY
// ============================================================================

export function getDefaultConfig(experience: "pro" | "guided" | "strict" = "guided"): InlineIdumbConfig {
    const automationSettings = {
        mode: experience === "pro" ? "autonomous" : experience === "strict" ? "manual" : "confirmRequired",
        expertSkeptic: {
            enabled: true,
            requireEvidence: true,
            doubleCheckDelegation: true
        },
        contextFirst: {
            enforced: true,
            requiredFirstTools: ["idumb-todo", "idumb-state"],
            blockWithoutContext: true
        },
        workflow: {
            research: true,
            planCheck: true,
            verifyAfterExecution: true,
            commitOnComplete: true
        }
    } as const

    return {
        version: "0.3.0",
        initialized: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        user: {
            name: "Developer",
            experience,
            language: {
                communication: "english",
                documents: "english"
            }
        },
        status: {
            current: {
                milestone: null as unknown as string,
                phase: "init",
                plan: null as unknown as string,
                task: null as unknown as string
            },
            lastValidation: null as unknown as string,
            validationsPassed: 0,
            driftDetected: false
        },
        hierarchy: {
            levels: ["milestone", "phase", "plan", "task"],
            agents: {
                order: ["coordinator", "governance", "validator", "builder"],
                permissions: {
                    coordinator: { delegate: true, execute: false, validate: false },
                    governance: { delegate: true, execute: false, validate: true },
                    validator: { delegate: false, execute: false, validate: true },
                    builder: { delegate: false, execute: true, validate: false }
                }
            },
            enforceChain: true,
            blockOnChainBreak: true
        },
        automation: automationSettings as any,
        paths: {
            root: ".idumb/",
            config: ".idumb/idumb-brain/config.json",
            state: ".idumb/idumb-brain/state.json",
            brain: ".idumb/idumb-brain/",
            history: ".idumb/idumb-brain/history/",
            context: ".idumb/idumb-brain/context/",
            governance: ".idumb/idumb-brain/governance/",
            validations: ".idumb/idumb-brain/governance/validations/",
            sessions: ".idumb/idumb-brain/sessions/",
            drift: ".idumb/idumb-brain/drift/",
            metadata: ".idumb/idumb-brain/metadata/",
            output: ".idumb/idumb-project-output/",
            phases: ".idumb/idumb-project-output/phases/",
            roadmaps: ".idumb/idumb-project-output/roadmaps/",
            research: ".idumb/idumb-project-output/research/",
            validationReports: ".idumb/idumb-project-output/validations/",
            modules: ".idumb/idumb-modules/"
        },
        staleness: {
            warningHours: 48,
            criticalHours: 168,
            checkOnLoad: true,
            autoArchive: false
        },
        timestamps: {
            enabled: true,
            format: "ISO8601",
            injectInFrontmatter: true,
            trackModifications: true
        },
        enforcement: {
            mustLoadConfig: true,
            mustHaveState: true,
            mustCheckHierarchy: true,
            blockOnMissingArtifacts: false,
            requirePhaseAlignment: true
        }
    }
}

// ============================================================================
// CONFIG CRUD OPERATIONS
// ============================================================================

/**
 * Read config from .idumb/idumb-brain/config.json
 * Returns null if config doesn't exist or is corrupted
 */
export function readConfig(directory: string): InlineIdumbConfig | null {
    const configPath = getConfigPath(directory)
    if (!existsSync(configPath)) {
        return null
    }
    try {
        const content = readFileSync(configPath, "utf8")
        return JSON.parse(content) as InlineIdumbConfig
    } catch {
        return null
    }
}

/**
 * Write config to .idumb/idumb-brain/config.json
 * Creates .idumb directory if it doesn't exist
 */
export function writeConfig(directory: string, config: InlineIdumbConfig): void {
    const idumbDir = getIdumbDir(directory)
    if (!existsSync(idumbDir)) {
        mkdirSync(idumbDir, { recursive: true })
    }
    const configPath = getConfigPath(directory)
    config.lastModified = new Date().toISOString()
    writeFileSync(configPath, JSON.stringify(config, null, 2))
}

// ============================================================================
// CONFIG INITIALIZATION
// ============================================================================

/**
 * Ensure config exists - auto-generates if missing
 * Called at session.created to guarantee config is always present
 */
export function ensureIdumbConfig(directory: string): InlineIdumbConfig {
    const configPath = getConfigPath(directory)
    const idumbDir = getIdumbDir(directory)

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
    const defaultConfig = getDefaultConfig("guided")

    // Create all required directories
    const dirs = [
        join(directory, ".idumb", "idumb-brain"),
        join(directory, ".idumb", "idumb-brain", "history"),
        join(directory, ".idumb", "idumb-brain", "context"),
        join(directory, ".idumb", "idumb-brain", "governance"),
        join(directory, ".idumb", "idumb-brain", "governance", "validations"),
        join(directory, ".idumb", "idumb-brain", "sessions"),
        join(directory, ".idumb", "idumb-brain", "drift"),
        join(directory, ".idumb", "idumb-brain", "metadata"),
        join(directory, ".idumb", "idumb-project-output"),
        join(directory, ".idumb", "idumb-project-output", "phases"),
        join(directory, ".idumb", "idumb-project-output", "roadmaps"),
        join(directory, ".idumb", "idumb-project-output", "research"),
        join(directory, ".idumb", "idumb-project-output", "validations"),
        join(directory, ".idumb", "idumb-modules")
    ]

    for (const dir of dirs) {
        if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true })
        }
    }

    // Write config
    writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2))

    // Also ensure state.json exists
    const statePath = join(directory, ".idumb", "idumb-brain", "state.json")
    if (!existsSync(statePath)) {
        const defaultState = getDefaultState()
        writeFileSync(statePath, JSON.stringify(defaultState, null, 2))
    }

    return defaultConfig
}

// ============================================================================
// ENFORCEMENT VALIDATION
// ============================================================================

/**
 * Validates enforcement.* settings at session start
 * Per Framework Mindset: "Must at least read and loaded by LLM at starting runtime"
 * Returns validation result with any issues found
 */
export function validateEnforcementSettings(
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
        const statePath = join(directory, '.idumb', 'idumb-brain', 'state.json')
        if (!existsSync(statePath)) {
            log(directory, `[ENFORCEMENT] Creating missing state.json per mustHaveState=true`)
            // Auto-recover: create default state
            const brainDir = join(directory, '.idumb', 'idumb-brain')
            if (!existsSync(brainDir)) {
                mkdirSync(brainDir, { recursive: true })
            }
            const defaultState = getDefaultState()
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
