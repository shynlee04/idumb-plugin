/**
 * iDumb Plugin Shared Types
 * 
 * All interfaces and type definitions used across plugin modules.
 * This is the single source of truth to prevent type duplication.
 * 
 * CRITICAL: NO console.log anywhere - causes TUI background text exposure
 */

// ============================================================================
// PART TYPE (for command hook output)
// ============================================================================

export type Part = { type: string; text?: string }

// ============================================================================
// STATE MANAGEMENT TYPES
// ============================================================================

export interface IdumbState {
    version: string
    initialized: string
    framework: "idumb" | "planning" | "bmad" | "custom" | "none"
    phase: string
    lastValidation: string | null
    validationCount: number
    anchors: Anchor[]
    history: HistoryEntry[]
}

export interface Anchor {
    id: string
    created: string
    type: "decision" | "context" | "checkpoint"
    content: string
    priority: "critical" | "high" | "normal"
}

export interface HistoryEntry {
    timestamp: string
    action: string
    agent: string
    result: "pass" | "fail" | "partial"
}

// ============================================================================
// INLINE CONFIG TYPES (for session.created auto-generation)
// ============================================================================

export type ExperienceLevel = "pro" | "guided" | "strict"
export type AutomationMode = "autonomous" | "confirmRequired" | "manualOnly"

export interface InlineIdumbConfig {
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

export interface ExecutionMetrics {
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
        // NOTE: maxDelegationDepth REMOVED - agents in mode: all can do anything
        maxErrors: number
    }
}

// ============================================================================
// STALL DETECTION INTERFACES (P3-T3)
// ============================================================================

export interface StallDetection {
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
}

// ============================================================================
// CHECKPOINT MANAGEMENT INTERFACES (P3-T4)
// ============================================================================

export interface Checkpoint {
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
// CHAIN RULE INTERFACES (from chain-enforcement.md)
// ============================================================================

export type ViolationActionType = "block" | "redirect" | "warn"
export type PrerequisiteType = "exists" | "state" | "validation" | "one_of"

export interface Prerequisite {
    type: PrerequisiteType
    path?: string
    state?: string
    validation?: string
    alternatives?: Prerequisite[]
}

export interface ViolationAction {
    action: ViolationActionType
    target?: string
    message: string
    continue?: boolean
}

export interface ChainRule {
    id: string
    command: string
    mustBefore?: Prerequisite[]
    shouldBefore?: Prerequisite[]
    except?: string[]
    onViolation: ViolationAction
}

// ============================================================================
// SESSION TRACKING INTERFACES (from CONTEXT.md B4)
// ============================================================================

export interface SessionTracker {
    firstToolUsed: boolean
    firstToolName: string | null
    agentRole: string | null
    violationCount: number
    governanceInjected: boolean
}

// ============================================================================
// SESSION METADATA STORAGE (Phase 3)
// ============================================================================

export interface SessionMetadata {
    sessionId: string
    createdAt: string
    lastUpdated: string
    phase: string
    governanceLevel: string
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

// ============================================================================
// TIMESTAMP FRONTMATTER INTERFACES
// ============================================================================

export interface FrontmatterTimestamp {
    created?: string
    modified: string
    staleAfterHours: number
}

export interface TimestampRecord {
    originalPath: string
    created: string
    modified: string
    staleAfterHours: number
}

// ============================================================================
// PENDING DENIAL/VIOLATION TRACKING
// ============================================================================

export interface PendingDenial {
    agent: string
    tool: string
    timestamp: string
    shouldBlock: boolean  // When true, tool.execute.after will REPLACE output entirely
}

export interface PendingViolation {
    agent: string
    tool: string
    timestamp: string
    violations: string[]
    shouldBlock: boolean
}
