/**
 * iDumb Plugin Library - Barrel Export
 * 
 * Re-exports all modules for convenient importing in the main plugin file.
 */

// Types
export * from "./types"

// Logging utilities
export { log, getLogPath } from "./logging"

// State management
export {
    readState,
    writeState,
    getStatePath,
    getDefaultState,
    addHistoryEntry
} from "./state"

// Config management
export {
    readConfig,
    writeConfig,
    getConfigPath,
    getIdumbDir,
    getDefaultConfig,
    ensureIdumbConfig,
    validateEnforcementSettings
} from "./config"


// Checkpoint management
export {
    createCheckpoint,
    loadCheckpoint,
    listCheckpoints,
    getLatestCheckpoint,
    markCheckpointCorrupted,
    deleteCheckpoint,
    getCheckpointDir
} from "./checkpoint"

// Execution metrics and stall detection
export {
    initializeExecutionMetrics,
    loadExecutionMetrics,
    saveExecutionMetrics,
    trackIteration,
    trackAgentSpawn,
    trackError,
    checkLimits,
    detectPlannerCheckerStall,
    detectValidatorFixStall,
    getStallDetectionState,
    trackDelegationDepth,
    popDelegationDepth,
    triggerEmergencyHalt
} from "./execution-metrics"

// Chain rules enforcement
export {
    READONLY_COMMANDS,
    getChainRules,
    matchCommand,
    resolvePhaseInPath,
    checkPrerequisite,
    checkPrerequisites,
    buildPrerequisiteGuidance,
    buildChainBlockMessage,
    buildChainWarnMessage
} from "./chain-rules"

// Session tracking
export {
    getSessionsDir,
    getSessionTracker,
    cleanupStaleSessions,
    addPendingDenial,
    consumePendingDenial,
    addPendingViolation,
    consumeValidationResult,
    detectAgentFromMessages,
    extractToolName,
    storeSessionMetadata,
    loadSessionMetadata,
    checkIfResumedSession,
    buildResumeContext,
    getPendingTodoCount,
    isStateStale
} from "./session-tracker"

// Governance building
export {
    getAllowedTools,
    getRequiredFirstTools,
    buildGovernancePrefix,
    detectSessionId,
    buildValidationFailureMessage,
    buildViolationGuidance,
    buildPostCompactReminder,
    buildCompactionContext
} from "./governance-builder"

// Schema validation
export {
    validateAgainstSchema,
    validateState,
    validateCheckpoint,
    isValidState,
    isValidCheckpoint,
    formatValidationErrors
} from "./schema-validator"

// Style management
export {
  getStylesDir,
  ensureStylesDir,
  parseStyleFile,
  listAvailableStyles,
  loadStyle,
  loadActiveStyle,
  setActiveStyle,
  type StyleConfig,
  type StyleContent
} from "./styles"

