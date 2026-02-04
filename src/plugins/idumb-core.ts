/**
 * iDumb Core Plugin
 * 
 * Event hooks for OpenCode integration:
 * - Session lifecycle (created, compacting, idle)
 * - Tool interception (task delegation, file operations)
 * - State management and context preservation
 * 
 * CRITICAL: NO console.log - causes TUI background text exposure
 * Use file logging or client.app.log() instead
 * 
 * REFACTORED: All utilities imported from ./lib modules
 */

import type { Plugin } from "@opencode-ai/plugin"
import { existsSync, mkdirSync } from "fs"
import { join } from "path"

// Import all utilities from lib modules
import {
  // Types
  type IdumbState,
  type Anchor,
  type HistoryEntry,
  type ExecutionMetrics,
  type StallDetection,
  type Checkpoint,
  type InlineIdumbConfig,
  type SessionTracker,
  type ChainRule,
  type Prerequisite,

  // Logging
  log,
  getLogPath,

  // State management
  readState,
  writeState,
  getStatePath,
  getDefaultState,
  addHistoryEntry,

  // Config management
  ensureIdumbConfig,
  validateEnforcementSettings,
  getDefaultConfig,

  // Checkpoint management
  createCheckpoint,
  loadCheckpoint,
  listCheckpoints,
  getLatestCheckpoint,
  getCheckpointDir,

  // Execution metrics
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
  triggerEmergencyHalt,

  // Chain rules
  READONLY_COMMANDS,
  getChainRules,
  matchCommand,
  resolvePhaseInPath,
  checkPrerequisite,
  checkPrerequisites,
  buildChainBlockMessage,
  buildChainWarnMessage,

  // Session tracking
  getSessionsDir,
  getSessionTracker,
  addPendingDenial,
  consumePendingDenial,
  addPendingViolation,
  consumeValidationResult,
  detectAgentFromMessages,
  detectSubagentSession,
  extractToolName,
  storeSessionMetadata,
  loadSessionMetadata,
  isStateStale,

  // Governance building
  getAllowedTools,
  getRequiredFirstTools,
  buildGovernancePrefix,
  detectSessionId,
  buildValidationFailureMessage,
  buildViolationGuidance,
  buildPostCompactReminder,
  buildCompactionContext
} from "./lib"

// Part type for command hook output
type Part = { type: string; text?: string }

// Pending denials map (kept in core for event handling)
const pendingDenials = new Map<string, { agent: string; tool: string }>()

export const IdumbCorePlugin: Plugin = async ({ directory, client }) => {
  log(directory, "iDumb plugin initialized")

  return {
    // ========================================================================
    // SESSION EVENTS
    // ========================================================================

    event: async ({ event }: { event: any }) => {
      try {
        // Session created
        if (event.type === "session.created") {
          const sessionId = event.properties?.info?.id || 'unknown'
          log(directory, `Session created: ${sessionId}`)

          // Initialize tracker
          getSessionTracker(sessionId as string)

          // CRITICAL: Ensure config exists (auto-generate if missing)
          const config = ensureIdumbConfig(directory)
          log(directory, `Config loaded: experience=${config.user.experience}, version=${config.version}`)

          // Store metadata with config info
          storeSessionMetadata(directory, sessionId as string)

          // P3-T2: Initialize execution metrics tracking
          initializeExecutionMetrics(sessionId as string, directory)

          // P3-T3: Initialize stall detection state
          getStallDetectionState(sessionId as string)

          // Phase 7 - Task 7.4: Validate enforcement.* settings at session start
          // Per Framework Mindset: "Must at least read and loaded by LLM at starting runtime"
          const enforcementValidation = validateEnforcementSettings(config, directory)
          if (!enforcementValidation.valid) {
            for (const warning of enforcementValidation.warnings) {
              log(directory, `[ENFORCEMENT WARNING] ${warning}`)
            }
            addHistoryEntry(
              directory,
              `enforcement_warnings:${enforcementValidation.warnings.length}`,
              'plugin',
              'partial'
            )
          } else {
            log(directory, `[ENFORCEMENT] All settings validated successfully`)
          }
        }

        // Permission replied (enhanced)
        if (event.type === 'permission.replied') {
          const sessionId = event.properties?.sessionID
          const status = event.properties?.status
          const tool = event.properties?.tool

          if (sessionId) {
            if (status === 'deny' && pendingDenials.has(sessionId)) {
              const denial = pendingDenials.get(sessionId)
              log(directory, `[PERMISSION EVENT] Denied ${denial?.agent} using ${denial?.tool}`)

              // Store denial in history for pattern tracking
              addHistoryEntry(
                directory,
                `permission_denied:${denial?.agent}:${denial?.tool}`,
                'plugin',
                'fail'
              )
            } else if (status === 'allow') {
              log(directory, `[PERMISSION EVENT] Allowed ${tool} for session ${sessionId}`)

              // Store allow in history
              addHistoryEntry(
                directory,
                `permission_allowed:${tool}`,
                'plugin',
                'pass'
              )
            }
          }
        }

        // Session idle (enhanced)
        if (event.type === "session.idle") {
          const sessionId = event.properties?.sessionID
          log(directory, `Session idle: ${sessionId}`)

          if (sessionId && sessionTrackers.has(sessionId)) {
            const tracker = sessionTrackers.get(sessionId)

            // Archive session stats before cleanup
            addHistoryEntry(
              directory,
              `session_idle:${sessionId}:violations=${tracker?.violationCount}`,
              'plugin',
              'pass'
            )

            log(directory, `Session stats: violations=${tracker?.violationCount}, depth=${tracker?.delegationDepth}`)

            // Update metadata with idle timestamp
            const metadata = loadSessionMetadata(directory, sessionId)
            if (metadata) {
              metadata.lastUpdated = new Date().toISOString()
              // Store updated metadata
              const metadataPath = join(getSessionsDir(directory), `${sessionId}.json`)
              writeFileSync(metadataPath, JSON.stringify(metadata, null, 2))
            }

            // Clean up tracker (but keep metadata for resumption)
            sessionTrackers.delete(sessionId)

            log(directory, `Session ${sessionId} archived for potential resumption`)
          }
        }

        // Session compacted (enhanced)
        if (event.type === "session.compacted") {
          const sessionId = event.properties?.sessionID
          const contextSize = event.properties?.contextSize || 'unknown'
          log(directory, `Session compacted: ${sessionId}, context size: ${contextSize}`)

          if (sessionId && sessionTrackers.has(sessionId)) {
            const tracker = sessionTrackers.get(sessionId)
            if (tracker) {
              tracker.governanceInjected = false  // Re-inject on next message
            }
          }

          // Update metadata with compaction info
          const metadata = loadSessionMetadata(directory, sessionId)
          if (metadata) {
            metadata.compactedAt = new Date().toISOString()
            metadata.contextSize = contextSize
            const metadataPath = join(getSessionsDir(directory), `${sessionId}.json`)
            writeFileSync(metadataPath, JSON.stringify(metadata, null, 2))
          }

          addHistoryEntry(directory, `session_compacted:${sessionId}`, 'plugin', 'pass')
        }

        // Command executed tracking
        if (event.type === "command.executed") {
          const command = event.properties?.command || ""
          log(directory, `[CMD] Command executed: ${command}`)

          // Track iDumb commands
          if (command.startsWith("idumb:") || command.startsWith("idumb-")) {
            addHistoryEntry(directory, `idumb_command:${command}`, "plugin", "pass")
          }
        }

        // NEW: Session resumed handler
        if (event.type === "session.resumed") {
          const sessionId = event.properties?.sessionID
          log(directory, `Session resumed: ${sessionId}`)

          // Re-initialize tracker
          const tracker = getSessionTracker(sessionId as string)
          tracker.governanceInjected = false  // Force re-injection

          // Load previous metadata
          const metadata = loadSessionMetadata(directory, sessionId as string)
          if (metadata) {
            log(directory, `Restored metadata for session ${sessionId}, phase: ${metadata.phase}`)
          }

          addHistoryEntry(directory, `session_resumed:${sessionId}`, 'plugin', 'pass')
        }

        // NEW: Error handling (P3-T2: Track errors in execution metrics)
        if (event.type === "error") {
          const error = event.properties?.error || "Unknown error"
          const context = event.properties?.context || "No context"
          log(directory, `[ERROR] ${error} | Context: ${context}`)
          addHistoryEntry(directory, `error:${error.substring(0, 100)}`, 'plugin', 'fail')

          // P3-T2: Track error in execution metrics
          trackError(directory, 'session_error', error)

          // P3-T3: Check if error limits exceeded
          const limitsCheck = checkLimits(directory)
          if (!limitsCheck.withinLimits) {
            log(directory, `[ERROR LIMITS] ${limitsCheck.violations.join(', ')}`)
            // Note: We don't halt here, just log. The limits are checked at key decision points.
          }
        }

      } catch (error) {
        log(directory, `[ERROR] event hook failed: ${error instanceof Error ? error.message : String(error)}`)
      }
    },

    // ========================================================================
    // COMPACTION HOOK (EXPERIMENTAL)
    // ========================================================================

    "experimental.session.compacting": async (input, output) => {
      // FALLBACK STRATEGY (Line 232): All hooks wrapped in try/catch
      try {
        log(directory, "Compaction triggered - injecting context")

        // Build context from state and anchors
        const context = buildCompactionContext(directory)

        // Append to compaction context (don't replace)
        output.context.push(context)

        log(directory, `Injected ${context.split("\n").length} lines of context`)
      } catch (error) {
        // Silent fail with logging - never break OpenCode
        log(directory, `[ERROR] compaction hook failed: ${error instanceof Error ? error.message : String(error)}`)
      }
    },

    // ========================================================================
    // MESSAGE TRANSFORM (Entry Point 1 - Session Start Governance Injection)
    // ========================================================================

    "experimental.chat.messages.transform": async (input: any, output: any) => {
      try {
        log(directory, "Transforming messages for governance injection")

        const agentRole = detectAgentFromMessages(output.messages)
        const sessionId = detectSessionId(output.messages) || 'unknown'
        const tracker = getSessionTracker(sessionId)
        tracker.agentRole = agentRole

        // S5-R08: Detect if this is a subagent session (Level 2+)
        // Subagent sessions are created via task() calls from parent sessions
        // They should NOT receive full governance injection to avoid context bloat
        const isSubagentSession = detectSubagentSession(output.messages, tracker)
        if (isSubagentSession) {
          tracker.sessionLevel = tracker.delegationDepth + 1 // Inherit from delegation chain
          log(directory, `Subagent session detected (Level ${tracker.sessionLevel}), skipping governance injection`)
          // S5-R08: Skip full governance injection for Level 2+ sessions
          // Subagents inherit governance constraints from parent via task delegation
          return
        }

        // Detect session start (no user messages yet processed)
        const userMessages = output.messages.filter((m: any) =>
          m.info?.role === 'user' ||
          m.parts?.some((p: any) => p.type === 'text' && !p.text?.includes('governance'))
        )

        // P1-T1: Enhanced session detection with resumption check
        const isSessionStart = userMessages.length <= 1 && !tracker.governanceInjected
        const isResumedSession = isSessionStart && checkIfResumedSession(sessionId, directory)

        // S5-R08: Only inject governance for Level 1 (root) sessions
        const isLevel1Session = tracker.sessionLevel === 1

        if ((isSessionStart || isResumedSession) && agentRole && isLevel1Session) {
          log(directory, `Session start detected for ${agentRole} (Level 1 - injecting governance)`)

          // Build governance prefix with resumption awareness
          let governancePrefix = buildGovernancePrefix(agentRole, directory, isResumedSession)

          // P1-T1: If resumed session, prepend resume context
          if (isResumedSession) {
            log(directory, `Session resumption detected for ${sessionId}`)
            const resumeContext = buildResumeContext(sessionId, directory)
            governancePrefix = resumeContext + governancePrefix
          }

          const firstUserMsgIndex = output.messages.findIndex((m: any) =>
            m.info?.role === 'user' &&
            !m.parts?.some((p: any) => p.text?.includes('iDumb Governance'))
          )

          if (firstUserMsgIndex >= 0) {
            output.messages[firstUserMsgIndex].parts.unshift({
              type: 'text',
              text: governancePrefix
            })

            tracker.governanceInjected = true
            log(directory, `Governance injected for ${agentRole}`)
          }
        }

        // ==========================================
        // POST-COMPACT DETECTION (Entry Point 2 - P1-3.4)
        // Phase 3: Enhanced Semantic Pattern Detection
        // ==========================================

        // Compaction indicators - system/technical signals
        const compactionIndicators = [
          'compacted',
          'summary of our conversation',
          'context has been compacted',
          'previous messages have been summarized',
          'conversation summary',
          'context window',
          'memory has been compacted',
          'session compacted',
          // Phase 3 additions - technical compaction signals
          'checkpoint restored',
          'resuming from',
          'context truncated'
        ]

        // Context loss indicators - semantic signals (qualitative, not quantitative per user principle)
        // Phase 3: Detection signals for anchoring, NOT blocking
        const contextLossIndicators = [
          // Existing patterns
          "i'll need you to provide",
          "can you remind me",
          "what were we working on",
          "i don't have context",
          "please provide context",
          // Phase 3.1: Context loss phrases
          "i don't remember",
          "what file",
          "can you repeat",
          "which file were we",
          "what was the task",
          "where did we leave off",
          // Phase 3.1: Agent confusion patterns
          "i'm not sure",
          "could you clarify",
          "which task",
          "can you specify",
          "i need more information",
          // Phase 3.1: Task drift patterns
          "let me start over",
          "different approach",
          "wait, actually",
          "on second thought",
          "let's go back to"
        ]

        // Phase 3.4: "New session" semantic detector patterns
        // Used for detecting when context should be re-injected (detect & anchor, NOT block)
        const newSessionIndicators = [
          "starting a new session",
          "let's begin fresh",
          "new conversation",
          "from the beginning",
          "start fresh",
          "pick up where we left off"
        ]

        // Primary detection: Look for compaction keywords in messages
        const hasCompactionKeyword = output.messages.some((m: any) =>
          m.parts?.some((p: any) =>
            p.text && compactionIndicators.some(indicator =>
              p.text.toLowerCase().includes(indicator.toLowerCase())
            )
          )
        )

        // Secondary detection: Look for context loss indicators
        const hasContextLossIndicator = output.messages.some((m: any) =>
          m.parts?.some((p: any) =>
            p.text && contextLossIndicators.some(indicator =>
              p.text.toLowerCase().includes(indicator.toLowerCase())
            )
          )
        )

        // Phase 3.4: New session semantic detection
        const hasNewSessionIndicator = output.messages.some((m: any) =>
          m.parts?.some((p: any) =>
            p.text && newSessionIndicators.some(indicator =>
              p.text.toLowerCase().includes(indicator.toLowerCase())
            )
          )
        )

        // Tertiary detection: Message count drop (indicative of compaction)
        // If we have very few messages but governance was previously injected,
        // it suggests compaction occurred
        const hasLowMessageCount = output.messages.length < 5 && tracker.governanceInjected

        // Combined detection - determines if context anchoring is needed
        // NOTE: Per user principle, we DETECT and ANCHOR, never BLOCK
        const isCompacted = hasCompactionKeyword || hasContextLossIndicator || hasLowMessageCount
        const needsContextRecovery = isCompacted || hasNewSessionIndicator

        // Log detection details for debugging with specific reason
        if (needsContextRecovery) {
          const detectionReason = hasCompactionKeyword
            ? 'compaction_keyword'
            : hasContextLossIndicator
              ? 'context_loss_indicator'
              : hasNewSessionIndicator
                ? 'new_session_indicator'
                : 'low_message_count'
          log(directory, `[PHASE 3] Context recovery needed via: ${detectionReason}`)

          // Phase 3: Integrate with stall detection for pattern tracking
          const stallState = getStallDetectionState(sessionId)
          if (stallState && detectionReason !== 'low_message_count') {
            // Track context loss frequency for stall detection
            const pcState = stallState.plannerChecker
            pcState.issuesHashHistory.push(detectionReason)
            if (pcState.issuesHashHistory.length > 10) {
              pcState.issuesHashHistory.shift()
            }
          }
        }

        if (needsContextRecovery && agentRole) {
          log(directory, `Post-compact recovery for ${agentRole}`)

          const lastMsg = output.messages[output.messages.length - 1]

          if (lastMsg) {
            const reminder = buildPostCompactReminder(agentRole, directory)
            lastMsg.parts.push({
              type: 'text',
              text: reminder
            })

            tracker.governanceInjected = true

            // Phase 3: Add history entry for context recovery
            addHistoryEntry(
              directory,
              `context_recovery:${agentRole}`,
              'plugin',
              'pass'
            )
          }
        }

      } catch (error) {
        log(directory, `[ERROR] messages.transform failed: ${error instanceof Error ? error.message : String(error)}`)
      }
    },

    // ========================================================================
    // PERMISSION ASK HOOK (Entry Point 4 - Permission Auto-Deny from P1-T3)
    // ========================================================================

    "permission.ask": async (input: any, output: any) => {
      try {
        const { tool, sessionID, messages } = input
        const sessionId = sessionID || 'unknown'
        const tracker = getSessionTracker(sessionId)

        // Detect agent role from tracker or messages
        let agentRole = tracker.agentRole
        if (!agentRole && messages) {
          agentRole = detectAgentFromMessages(messages)
          if (agentRole) {
            tracker.agentRole = agentRole
          }
        }

        const allowedTools = getAllowedTools(agentRole)
        const toolName = extractToolName(tool)

        // Check if tool is allowed for this agent
        const isAllowed = allowedTools.some(allowed =>
          toolName === allowed || toolName.includes(allowed)
        )

        if (agentRole && allowedTools.length > 0 && !isAllowed) {
          // LOG ONLY - DO NOT DENY
          // output.status = "deny"
          log(directory, `[WARN] ${agentRole} permission for ${toolName} - LOG ONLY, not blocking`)

          // Add to pending denials for tracking (but not blocking)
          pendingDenials.set(sessionId, {
            agent: agentRole || 'unknown',
            tool: toolName,
            timestamp: new Date().toISOString(),
            shouldBlock: false  // LOG ONLY - do not block
          })

          // Add to pending violations for tracking (P1-T3) - LOG ONLY
          pendingViolations.set(sessionId, {
            agent: agentRole || 'unknown',
            tool: toolName,
            timestamp: new Date().toISOString(),
            violations: [`Tool '${toolName}' not in allowed list for ${agentRole}`],
            shouldBlock: false  // LOG ONLY - do not block
          })

          addHistoryEntry(
            directory,
            `permission_denied:${agentRole}:${toolName}`,
            'interceptor',
            'fail'
          )

          // Permission denied - output.status already set to "deny"
          return
        }

        // Permission granted - output.status remains default (allow)
      } catch (error) {
        log(directory, `[ERROR] permission.ask failed: ${error instanceof Error ? error.message : String(error)}`)
        // Default to allowing on error (fail open for safety)
      }
    },

    // ========================================================================
    // TOOL INTERCEPTION
    // ========================================================================
    //
    // DESIGN PRINCIPLE: Observe and track, minimal modification.
    // Only inject timestamps into iDumb artifacts (non-breaking metadata).
    // DO NOT inject context into task prompts - it breaks agent workflows.
    //

    "tool.execute.before": async (input: any, output: any) => {
      try {
        const toolName = input.tool
        const sessionId = input.sessionID || 'unknown'
        const tracker = getSessionTracker(sessionId)
        const agentRole = tracker.agentRole || detectAgentFromMessages([])

        // ==========================================
        // FIRST TOOL ENFORCEMENT
        // ==========================================

        if (!tracker.firstToolUsed) {
          tracker.firstToolUsed = true
          tracker.firstToolName = toolName

          const requiredFirst = getRequiredFirstTools(agentRole)

          // SKIP enforcement if empty array (non-iDumb or unknown agent)
          if (requiredFirst.length > 0 && !requiredFirst.includes(toolName)) {
            tracker.violationCount++
            log(directory, `[WARN] ${agentRole} used ${toolName} as first tool (expected: ${requiredFirst.join(', ')})`)
            // LOG ONLY - NO BLOCKING
            addHistoryEntry(
              directory,
              `warn:first_tool:${agentRole}:${toolName}`,
              'interceptor',
              'warn'
            )
          } else {
            log(directory, `[OK] ${agentRole} used ${toolName} as first tool`)
          }
        }

        // ==========================================
        // FILE MODIFICATION ENFORCEMENT - LOG ONLY, NO BLOCKING
        // ==========================================

        if ((toolName === 'edit' || toolName === 'write') && agentRole && agentRole.startsWith('idumb-') && agentRole !== 'idumb-builder') {
          log(directory, `[WARN] ${agentRole} attempted file modification - LOG ONLY`)
          // LOG ONLY - NO BLOCKING - let the tool run
          addHistoryEntry(
            directory,
            `warn:file_mod:${agentRole}:${toolName}`,
            'interceptor',
            'warn'
          )
          // DO NOT return - let tool proceed
        }

        // ==========================================
        // GENERAL PERMISSION CHECK - LOG ONLY, NO BLOCKING
        // ==========================================

        const allowedTools = getAllowedTools(agentRole)

        // Only log if known iDumb agent and tool not in allowed list
        if (agentRole && agentRole.startsWith('idumb-') && allowedTools.length > 0 && !allowedTools.includes(toolName)) {
          log(directory, `[WARN] ${agentRole} used tool not in allowed list: ${toolName} - LOG ONLY`)
          // LOG ONLY - NO BLOCKING - let the tool run
          addHistoryEntry(
            directory,
            `warn:general:${agentRole}:${toolName}`,
            'interceptor',
            'warn'
          )
          // DO NOT return - let tool proceed
        }

        // ==========================================
        // DELEGATION TRACKING (P3-T2, P3-T3)
        // ==========================================

        if (toolName === "task") {
          const desc = output.args?.description || "unknown"
          const agent = output.args?.subagent_type || "general"
          log(directory, `[TASK] Delegation: ${agent} - ${desc}`)
          tracker.delegationDepth++

          // P3-T2: Track agent spawn in execution metrics
          trackAgentSpawn(directory, agent)

          // P3-T3: Track delegation depth with stall detection
          const delegationResult = trackDelegationDepth(sessionId, agent)

          // P3-T3: Check for max delegation depth exceeded
          if (delegationResult.maxReached) {
            const haltMessage = triggerEmergencyHalt(
              directory,
              sessionId,
              "MAX_DELEGATION_DEPTH_EXCEEDED",
              {
                depth: delegationResult.depth,
                maxAllowed: 3,
                agent: agent,
                description: desc
              }
            )

            // Block the delegation by modifying output args
            output.args = {
              __BLOCKED_BY_GOVERNANCE__: true,
              __VIOLATION__: "Maximum delegation depth exceeded (max: 3)",
              __HALT_MESSAGE__: haltMessage
            }

            log(directory, `[EMERGENCY HALT] Max delegation depth exceeded: ${delegationResult.depth}`)
            return
          }
        }

        // ==========================================
        // FILE TIMESTAMP TRACKING (preserve existing)
        // ==========================================

        if (toolName === 'edit' || toolName === 'write') {
          const filePath = output.args?.path || output.args?.filePath || ''
          log(directory, `[FILE] ${toolName}: ${filePath}`)

          if (shouldTrackTimestamp(filePath)) {
            recordTimestamp(directory, filePath)
            log(directory, `[FILE] Timestamp recorded: ${filePath}`)
          }
        }

      } catch (error) {
        log(directory, `[ERROR] tool.execute.before failed: ${error instanceof Error ? error.message : String(error)}`)
      }
    },

    "tool.execute.after": async (input: any, output: any) => {
      // FALLBACK STRATEGY: All hooks wrapped in try/catch
      try {
        const toolName = input.tool
        const sessionId = input.sessionID || 'unknown'

        // ==========================================
        // CRITICAL: BLOCKED TOOL OUTPUT REPLACEMENT
        // ==========================================
        // This is the REAL enforcement - tool.execute.before cannot stop execution,
        // but we CAN replace the output here to hide the actual result

        const violation = pendingDenials.get(sessionId)
        if (violation && violation.shouldBlock && toolName === violation.tool) {
          // BUILD REPLACEMENT OUTPUT - COMPLETELY REPLACES TOOL OUTPUT
          const guidance = buildViolationGuidance(violation.agent, violation.tool)

          // COMPLETELY REPLACE output - DO NOT append original output
          output.output = guidance
          output.title = `🚫 BLOCKED: ${violation.agent} cannot use ${toolName}`

          // Clear the pending denial
          pendingDenials.delete(sessionId)

          log(directory, `[BLOCKED OUTPUT REPLACED] ${violation.agent} tried ${toolName} - output discarded`)

          // STOP PROCESSING - don't track this as a successful operation
          return
        }

        // ==========================================
        // VALIDATION VIOLATION CHECK
        // ==========================================

        const validationResult = consumeValidationResult(sessionId)
        if (validationResult && validationResult.shouldBlock) {
          // Build validation failure message
          const failureMessage = buildValidationFailureMessage(
            validationResult.agent,
            validationResult.tool,
            validationResult.violations
          )

          // COMPLETELY REPLACE output with validation failure message
          output.output = failureMessage
          output.title = `🚫 VALIDATION FAILED: ${validationResult.tool}`

          log(directory, `[VALIDATION BLOCKED] ${validationResult.agent} using ${validationResult.tool} - ${validationResult.violations.length} violations`)

          // STOP PROCESSING
          return
        }

        // ==========================================
        // NORMAL PROCESSING (non-blocked tools)
        // ==========================================

        // Record completed task delegations
        // NOTE: Cannot access original args here per OpenCode API
        // output contains: { title, output, metadata } - no error field
        if (toolName === "task") {
          // P3-T3 BUG FIX: Pop delegation depth when task completes
          // This was never called, causing delegation stack to grow indefinitely
          // and triggering false MAX_DELEGATION_DEPTH_EXCEEDED errors
          popDelegationDepth(sessionId)

          // Infer success from output.metadata or output.output content
          const hasError = output.output?.toLowerCase().includes('error') ||
            output.output?.toLowerCase().includes('failed')
          const result = hasError ? "fail" : "pass"
          addHistoryEntry(directory, `task:${output.title || "unknown"}`, "plugin", result as "pass" | "fail")
          log(directory, `Task completed: ${result} (depth: ${stallDetectionState.get(sessionId)?.delegation.depth || 0})`)
        }

        // Track iDumb file operations
        if (toolName === "edit" || toolName === "write") {
          const outputText = output.output || output.title || ""

          // Track .idumb/ file modifications
          if (outputText.includes(".idumb/")) {
            log(directory, "iDumb file modified")
          }
        }
      } catch (error) {
        // Silent fail with logging - never break OpenCode
        log(directory, `[ERROR] tool.execute.after failed: ${error instanceof Error ? error.message : String(error)}`)
      }
    },

    // ========================================================================
    // COMMAND INTERCEPTION
    // ========================================================================
    // 
    // DESIGN PRINCIPLE: 
    // - BEFORE: Don't inject noise, let commands run cleanly
    // - AFTER: Use client.session.prompt() to trigger governance actions
    //
    // The LLM only sees what's in the prompt. Logging alone does nothing.
    // We must actively inject messages to trigger governance.
    //

    "command.execute.before": async (
      input: { command: string; sessionID: string; arguments: string },
      output: { parts: Part[] }
    ) => {
      try {
        const { command, arguments: args } = input

        // Log iDumb command execution
        if (command.startsWith("idumb:") || command.startsWith("idumb-")) {
          log(directory, `[CMD] iDumb command starting: ${command}`)
        }

        // ==========================================
        // CHAIN ENFORCEMENT (P0-T5)
        // ==========================================

        // 1. Readonly command bypass
        if (READONLY_COMMANDS.includes(command)) {
          log(directory, `[CHAIN] Readonly command bypass: ${command}`)
          return
        }

        // 2. Emergency bypass check
        if (args.includes('--emergency') || args.includes('--bypass-chain')) {
          log(directory, `[CHAIN] Emergency bypass used: ${command}`)
          addHistoryEntry(directory, `chain_bypass:${command}`, 'interceptor', 'pass')
          return
        }

        // 3. Get chain rules and find matching rule
        const rules = getChainRules()
        const matchingRule = rules.find(rule => {
          if (rule.except?.includes(command)) return false
          return matchCommand(rule.command, command)
        })

        if (!matchingRule) {
          log(directory, `[CHAIN] No chain rule for: ${command}`)
          return
        }

        log(directory, `[CHAIN] Checking rule ${matchingRule.id} for ${command}`)

        // 4. Check mustBefore prerequisites (HARD_BLOCK)
        if (matchingRule.mustBefore && matchingRule.mustBefore.length > 0) {
          const { allPassed, failures } = checkPrerequisites(
            matchingRule.mustBefore,
            directory,
            args
          )

          if (!allPassed) {
            // Check for --force override on SOFT_BLOCK only
            if (args.includes('--force') && matchingRule.onViolation.action !== 'block') {
              log(directory, `[CHAIN] --force override used for ${command}`)
              addHistoryEntry(directory, `chain_force:${command}`, 'interceptor', 'pass')
            } else {
              // HARD_BLOCK
              const blockMsg = buildChainBlockMessage(matchingRule, failures, command)

              output.parts.push({
                type: 'text',
                text: blockMsg
              })

              log(directory, `[CHAIN] BLOCKED ${command} - rule ${matchingRule.id}`)
              addHistoryEntry(
                directory,
                `chain_block:${matchingRule.id}:${command}`,
                'interceptor',
                'fail'
              )

              // If redirect target specified, add redirect instruction
              if (matchingRule.onViolation.action === 'redirect' && matchingRule.onViolation.target) {
                output.parts.push({
                  type: 'text',
                  text: `\n\n👉 Redirecting to: ${matchingRule.onViolation.target}`
                })
              }

              return
            }
          }
        }

        // 5. Check shouldBefore prerequisites (WARN)
        if (matchingRule.shouldBefore && matchingRule.shouldBefore.length > 0) {
          const { allPassed, failures } = checkPrerequisites(
            matchingRule.shouldBefore,
            directory,
            args
          )

          if (!allPassed) {
            const warnMsg = buildChainWarnMessage(matchingRule, failures)

            output.parts.push({
              type: 'text',
              text: warnMsg
            })

            log(directory, `[CHAIN] WARNING ${command} - rule ${matchingRule.id}`)
            addHistoryEntry(
              directory,
              `chain_warn:${matchingRule.id}:${command}`,
              'interceptor',
              'partial'
            )

            // Continue execution after warning (shouldBefore is soft)
            if (matchingRule.onViolation.continue !== false) {
              return
            }
          }
        }

        log(directory, `[CHAIN] ALLOWED ${command}`)

      } catch (error) {
        log(directory, `[ERROR] command.execute.before failed: ${error instanceof Error ? error.message : String(error)}`)
      }
    },

    // ========================================================================
    // TODO ENFORCEMENT VIA SESSION.IDLE EVENT
    // ========================================================================
    // NOTE: 'stop' hook does NOT exist in OpenCode API (removed in refactor)
    // Instead, we use the 'session.idle' event to check TODOs when session completes
    // The event handler above (line 472) triggers idle detection
    // Agent system prompts enforce TODO completion before stopping
    //
    // For active enforcement, agents should use idumb-todo/todowrite tools
    // and the STOP PREVENTION protocol in their system prompts.
  }
}

// Default export for plugin loading
export default IdumbCorePlugin
