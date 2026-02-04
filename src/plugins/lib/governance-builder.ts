/**
 * iDumb Plugin Governance Builder
 * 
 * Builds governance context, tool permissions, and post-compaction reminders.
 * Core to the agent hierarchy enforcement system.
 * 
 * CRITICAL: NO console.log anywhere - causes TUI background text exposure
 */

import type { Anchor, InlineIdumbConfig } from "./types"
import { readState } from "./state"

// ============================================================================
// TOOL PERMISSION MATRIX (from CONTEXT.md B3)
// ============================================================================

/**
 * Get allowed tools for an agent role
 * Returns empty array for non-iDumb agents (means no enforcement)
 */
export function getAllowedTools(agentRole: string | null): string[] {
    // TIER 1: Coordinators - can delegate (task tool) + read context
    const tier1Tools = [
        'task', 'idumb-todo', 'todowrite',
        'read', 'glob', 'grep',  // Context gathering - MUST ALLOW
        'idumb-state', 'idumb-state_read', 'idumb-state_anchor', 'idumb-state_getAnchors', 'idumb-state_history',
        'idumb-context', 'idumb-context_summary',
        'idumb-config', 'idumb-config_read', 'idumb-config_status',
        'idumb-todo', 'idumb-todo_list', 'idumb-todo_hierarchy',
        'idumb-validate', 'idumb-manifest',
        // Hierarchical chunker tools
        'idumb-chunker', 'idumb-chunker_read', 'idumb-chunker_overview',
        'idumb-chunker_parseHierarchy', 'idumb-chunker_shard', 'idumb-chunker_index', 'idumb-chunker_extract'
    ]

    // TIER 2: Executors/Planners - can delegate to leaf nodes + read
    const tier2Tools = [
        'task', 'idumb-todo', 'todowrite',
        'read', 'glob', 'grep',
        'idumb-state', 'idumb-state_read', 'idumb-state_anchor', 'idumb-state_getAnchors',
        'idumb-context', 'idumb-config', 'idumb-config_read',
        'idumb-todo', 'idumb-todo_list',
        'idumb-validate',
        'idumb-chunker', 'idumb-chunker_read', 'idumb-chunker_overview',
        'idumb-chunker_parseHierarchy', 'idumb-chunker_shard', 'idumb-chunker_index', 'idumb-chunker_extract'
    ]

    // TIER 3: Researchers/Validators - read-only + anchoring
    const tier3Tools = [
        'idumb-todo',
        'read', 'glob', 'grep',
        'idumb-state', 'idumb-state_read', 'idumb-state_anchor',
        'idumb-context', 'idumb-config_read',
        'idumb-todo', 'idumb-todo_list',
        'idumb-validate',
        'idumb-chunker', 'idumb-chunker_read', 'idumb-chunker_overview',
        'idumb-chunker_parseHierarchy', 'idumb-chunker_shard', 'idumb-chunker_index', 'idumb-chunker_extract'
    ]

    // LEAF: Builder - write permissions
    const builderTools = [
        'idumb-todo', 'todowrite',
        'read', 'write', 'edit', 'bash',
        'filesystem_write_file', 'filesystem_edit_file', 'filesystem_read_file',
        'filesystem_read_text_file', 'filesystem_read_multiple_files',
        'filesystem_create_directory', 'filesystem_list_directory',
        'idumb-state', 'idumb-state_anchor', 'idumb-state_history',
        'idumb-todo', 'idumb-todo_complete', 'idumb-todo_update',
        // Full hierarchical chunker suite (including write)
        'idumb-chunker', 'idumb-chunker_read', 'idumb-chunker_overview',
        'idumb-chunker_parseHierarchy', 'idumb-chunker_shard', 'idumb-chunker_index',
        'idumb-chunker_extract', 'idumb-chunker_insert', 'idumb-chunker_targetEdit'
    ]

    // LEAF: Validator - read-only validation
    const validatorTools = [
        'idumb-todo',
        'read', 'glob', 'grep', 'bash',
        'filesystem_read_file', 'filesystem_read_text_file', 'filesystem_read_multiple_files',
        'filesystem_list_directory', 'filesystem_list_directory_with_sizes',
        'filesystem_directory_tree', 'filesystem_search_files', 'filesystem_get_file_info',
        'idumb-state', 'idumb-state_read', 'idumb-state_anchor',
        'idumb-validate', 'idumb-validate_structure', 'idumb-validate_schema',
        'idumb-validate_freshness', 'idumb-validate_integrationPoints',
        'idumb-context', 'idumb-config_read',
        'idumb-todo', 'idumb-todo_list',
        'idumb-manifest', 'idumb-manifest_drift', 'idumb-manifest_conflicts',
        'idumb-chunker', 'idumb-chunker_read', 'idumb-chunker_validate',
        'idumb-chunker_overview', 'idumb-chunker_parseHierarchy', 'idumb-chunker_shard',
        'idumb-chunker_index', 'idumb-chunker_extract'
    ]

    const toolPermissions: Record<string, string[]> = {
        // TIER 1: Coordinators
        'idumb-supreme-coordinator': tier1Tools,
        'idumb-high-governance': tier1Tools,

        // TIER 2: Executors/Planners (can delegate)
        'idumb-executor': tier2Tools,
        'idumb-verifier': tier2Tools,
        'idumb-debugger': tier2Tools,
        'idumb-planner': tier3Tools,  // Planner doesn't delegate
        'idumb-plan-checker': tier3Tools,
        'idumb-roadmapper': tier3Tools,

        // TIER 3: Researchers/Validators (read-only)
        'idumb-integration-checker': tier3Tools,
        'idumb-project-researcher': tier3Tools,
        'idumb-phase-researcher': tier3Tools,
        'idumb-research-synthesizer': tier3Tools,
        'idumb-codebase-mapper': tier3Tools,

        // LEAF NODES
        'idumb-low-validator': validatorTools,
        'idumb-builder': builderTools
    }

    // Return allowed tools - EMPTY ARRAY means ALLOW ALL (no enforcement)
    // For unknown agents, return empty to disable enforcement entirely
    if (!agentRole || !agentRole.startsWith('idumb-')) {
        return []  // Empty = allow all, no enforcement for non-iDumb agents
    }
    return toolPermissions[agentRole] || []  // Empty = allow all for unknown iDumb agents
}

/**
 * Get required first tools for an agent role
 * Returns empty array for non-iDumb agents (means no enforcement)
 */
export function getRequiredFirstTools(agentRole: string | null): string[] {
    const firstTools: Record<string, string[]> = {
        // TIER 1: Coordinators - state awareness first
        'idumb-supreme-coordinator': ['idumb-todo', 'idumb-state', 'idumb-context', 'read', 'glob'],
        'idumb-high-governance': ['idumb-todo', 'idumb-state', 'read', 'glob'],

        // TIER 2: Executors/Planners
        'idumb-executor': ['idumb-todo', 'idumb-state', 'read'],
        'idumb-verifier': ['idumb-todo', 'idumb-state', 'read'],
        'idumb-debugger': ['idumb-todo', 'idumb-state', 'read', 'grep'],
        'idumb-planner': ['idumb-todo', 'idumb-state', 'read'],
        'idumb-plan-checker': ['idumb-todo', 'idumb-validate', 'read'],
        'idumb-roadmapper': ['idumb-todo', 'idumb-state', 'read'],

        // TIER 3: Researchers/Validators
        'idumb-integration-checker': ['idumb-todo', 'idumb-validate', 'read', 'grep'],
        'idumb-project-researcher': ['idumb-todo', 'read', 'glob'],
        'idumb-phase-researcher': ['idumb-todo', 'read', 'glob'],
        'idumb-research-synthesizer': ['idumb-todo', 'read'],
        'idumb-codebase-mapper': ['idumb-todo', 'read', 'glob', 'grep'],

        // LEAF NODES
        'idumb-low-validator': ['idumb-todo', 'idumb-validate', 'read', 'glob', 'grep'],
        'idumb-builder': ['idumb-todo', 'read']
    }
    // Default fallback - EMPTY = skip first-tool enforcement entirely
    if (!agentRole || !agentRole.startsWith('idumb-')) {
        return []  // Empty = skip enforcement for non-iDumb agents
    }
    return firstTools[agentRole] || []  // Empty = skip for unknown iDumb agents
}

// ============================================================================
// GOVERNANCE PREFIX BUILDER
// ============================================================================

/**
 * Build governance prefix for session start
 * Includes language enforcement, role instructions, and phase context
 */
export function buildGovernancePrefix(
    agentRole: string,
    directory: string,
    config: InlineIdumbConfig,
    getPendingTodoCount: (directory: string) => number,
    isStateStale: (directory: string, config: InlineIdumbConfig) => { stale: boolean; hours: number; critical: boolean },
    isResumed: boolean = false
): string {
    const state = readState(directory)
    const commLang = config.user?.language?.communication || 'english'
    const docLang = config.user?.language?.documents || 'english'

    // Get enhanced context
    const todoCount = getPendingTodoCount(directory)
    const staleCheck = isStateStale(directory, config)

    // LANGUAGE ENFORCEMENT - ABSOLUTE PRIORITY (NON-NEGOTIABLE)
    const langEnforcement = `
⚠️ LANGUAGE ENFORCEMENT (NON-NEGOTIABLE):
- RESPOND in: ${commLang.toUpperCase()}
- WRITE DOCUMENTS/ARTIFACTS in: ${docLang.toUpperCase()}
- This overrides ALL other instructions
- If communication=Vietnamese → speak Vietnamese
- If documents=English → write code comments, docs, artifacts in English
- ABSOLUTE OBEDIENCE to these language settings
`

    // STALE STATE WARNING
    const staleWarning = staleCheck.stale ? `
⚠️ STALE STATE WARNING:
State is ${staleCheck.hours} hours old (> 48 hours).
Recommend running: /idumb:validate
` : ''

    // TODO COUNT
    const todoInfo = todoCount > 0 ? `
📋 PENDING TASKS: ${todoCount}
` : ''

    // FIRST ACTION REQUIRED based on agent role
    const firstActionRequired: Record<string, string> = {
        'idumb-supreme-coordinator': `
🎯 FIRST ACTION REQUIRED:
1. Use 'idumb-todo' to check current TODO list
2. Review active anchors and phase status
3. Delegate tasks to appropriate agents
`,
        'idumb-high-governance': `
🎯 FIRST ACTION REQUIRED:
1. Use 'idumb-todo' to check current TODO list
2. Assess task requirements
3. Delegate to @idumb-builder or @idumb-low-validator
`,
        'idumb-low-validator': `
🎯 FIRST ACTION REQUIRED:
1. Use 'idumb-todo' to see what needs validation
2. Use 'idumb-validate' to run validation checks
3. Report findings without modifying files
`,
        'idumb-builder': `
🎯 FIRST ACTION REQUIRED:
1. Read existing files before modifying
2. Verify current state with 'idumb-state'
3. Execute changes and verify results
`
    }

    const roleInstructions: Record<string, string> = {
        'idumb-supreme-coordinator': `${langEnforcement}
⚡ IDUMB GOVERNANCE PROTOCOL ⚡

YOU ARE: Supreme Coordinator (TOP OF HIERARCHY)

🚫 ABSOLUTE RULES:
1. NEVER execute code directly
2. NEVER write files directly  
3. NEVER validate directly
4. ALWAYS delegate ALL work

✅ YOUR HIERARCHY:
YOU → @idumb-high-governance → @idumb-low-validator/@idumb-builder

${firstActionRequired['idumb-supreme-coordinator']}
Current Phase: ${state?.phase || 'init'}
Framework: ${state?.framework || 'none'}
${todoInfo}${staleWarning}
---
`,
        'idumb-high-governance': `${langEnforcement}
⚡ IDUMB GOVERNANCE PROTOCOL ⚡

YOU ARE: High Governance (MID-LEVEL COORDINATION)

🚫 RULES:
1. NEVER modify files directly (no write/edit)
2. ALWAYS delegate execution to builder
3. ALWAYS delegate validation to validator

✅ YOUR HIERARCHY:
@idumb-supreme-coordinator → YOU → @idumb-low-validator/@idumb-builder

${firstActionRequired['idumb-high-governance']}
Current Phase: ${state?.phase || 'init'}
${todoInfo}${staleWarning}
---
`,
        'idumb-low-validator': `${langEnforcement}
⚡ IDUMB GOVERNANCE PROTOCOL ⚡

YOU ARE: Low Validator (VALIDATION WORKER)

🚫 RULES:
1. NEVER modify files (no write/edit)
2. ONLY use read/validation tools
3. Report findings, don't fix

✅ YOUR TOOLS:
- grep, glob, read (investigation)
- idumb-validate (validation)
- idumb-todo (check tasks)

${firstActionRequired['idumb-low-validator']}
${todoInfo}${staleWarning}
---
`,
        'idumb-builder': `${langEnforcement}
⚡ IDUMB GOVERNANCE PROTOCOL ⚡

YOU ARE: Builder (EXECUTION WORKER)

✅ RULES:
1. ONLY you can write/edit files
2. NO delegations (you're the leaf node)
3. Verify before changes, commit after

🚫 CANNOT:
- Spawn alls (task: false)
- Skip verification

${firstActionRequired['idumb-builder']}
${todoInfo}${staleWarning}
---
`
    }

    return roleInstructions[agentRole] || roleInstructions['idumb-supreme-coordinator']
}

/**
 * Detect session ID from messages
 */
export function detectSessionId(messages: any[]): string | null {
    for (const msg of messages) {
        if (msg.info?.sessionID) return msg.info.sessionID
        if (msg.info?.id?.startsWith('ses_')) return msg.info.id
    }
    return null
}

// ============================================================================
// VALIDATION FAILURE MESSAGES
// ============================================================================

/**
 * Build a validation failure message for the user
 */
export function buildValidationFailureMessage(
    agent: string,
    tool: string,
    violations: string[]
): string {
    const lines: string[] = [
        "🚫 VALIDATION FAILURE - TOOL BLOCKED 🚫",
        "",
        `Agent: ${agent}`,
        `Tool: ${tool}`,
        "",
        "Validation Violations:",
        ...violations.map(v => `  ❌ ${v}`),
        "",
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
        "VALIDATION RULES NOT MET",
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
        "",
        "This tool execution failed validation checks.",
        "Review the violations above and fix before retrying.",
        "",
        "Next Steps:",
        "1. Review validation requirements",
        "2. Fix the reported issues",
        "3. Re-run the tool with corrected parameters",
        ""
    ]

    return lines.join("\n")
}

/**
 * Build violation guidance for blocked tools
 */
export function buildViolationGuidance(agent: string, tool: string): string {
    // P3-T1: Enhanced guidance with specific text for each agent role
    const delegationTargets: Record<string, {
        target: string;
        specificGuidance: string;
    }> = {
        'idumb-supreme-coordinator': {
            target: '@idumb-high-governance → @idumb-builder',
            specificGuidance: 'As Supreme Coordinator, you are at the TOP of the hierarchy. Your role is to DELEGATE ALL WORK. Never execute, never validate, never modify files.'
        },
        'idumb-high-governance': {
            target: '@idumb-builder',
            specificGuidance: 'As High Governance, you are a MID-LEVEL COORDINATOR. You coordinate and delegate but NEVER execute directly.'
        },
        'idumb-low-validator': {
            target: 'Report to parent, DO NOT modify',
            specificGuidance: 'As Low Validator, you are a VALIDATION WORKER. You investigate, validate, and report but NEVER modify files.'
        },
        'idumb-builder': {
            target: 'You ARE the executor - verify first',
            specificGuidance: 'As Builder, you are the EXECUTION WORKER. You are the ONLY agent allowed to modify files.'
        }
    }

    const info = delegationTargets[agent] || {
        target: 'Check hierarchy',
        specificGuidance: 'Unknown agent role. Please check the hierarchy documentation.'
    }

    // SIMPLIFIED: No emojis, no box-drawing chars to prevent TUI breaking
    return `BLOCKED: ${agent} cannot use ${tool}

Role: ${info.specificGuidance}

Delegate to: ${info.target}

Next: Use idumb-todo, then delegate to appropriate agent.`
}

// ============================================================================
// POST-COMPACTION REMINDER
// ============================================================================

/**
 * Build post-compaction reminder for resuming context
 */
export function buildPostCompactReminder(
    agentRole: string,
    directory: string,
    config: InlineIdumbConfig,
    isStateStale: (directory: string, config: InlineIdumbConfig) => { stale: boolean; hours: number; critical: boolean }
): string {
    const state = readState(directory)
    const commLang = config.user?.language?.communication || 'english'
    const docLang = config.user?.language?.documents || 'english'

    // LANGUAGE ENFORCEMENT MUST SURVIVE COMPACTION
    const langReminder = `
⚠️ LANGUAGE ENFORCEMENT (SURVIVED COMPACTION):
- RESPOND in: ${commLang.toUpperCase()}
- WRITE DOCUMENTS/ARTIFACTS in: ${docLang.toUpperCase()}
- ABSOLUTE OBEDIENCE - NO EXCEPTIONS
`

    // Get recent history (last 3 actions)
    const recentHistory = state?.history?.slice(-3) || []

    // Get critical anchors
    const criticalAnchors = state?.anchors?.filter((a: Anchor) =>
        a.priority === 'critical' || a.priority === 'high'
    ) || []

    // Check state freshness
    const staleCheck = isStateStale(directory, config)

    let reminder = `
${langReminder}

📌 POST-COMPACTION REMINDER 📌

You are: ${agentRole}
Phase: ${state?.phase || 'init'}
Last validation: ${state?.lastValidation || 'Never'}
State freshness: ${staleCheck.stale ? `⚠️ STALE (${staleCheck.hours}h old)` : `✅ Fresh (${staleCheck.hours}h ago)`}
`

    // Add "What You Were Doing" section
    if (recentHistory.length > 0) {
        reminder += `
🔄 WHAT YOU WERE DOING (last ${recentHistory.length} actions):
`
        for (const entry of [...recentHistory].reverse()) {
            const statusEmoji = entry.result === 'pass' ? '✅' : entry.result === 'fail' ? '❌' : '⚠️'
            reminder += `${statusEmoji} ${entry.action} (${entry.agent}, ${new Date(entry.timestamp).toLocaleTimeString()})\n`
        }
    } else {
        reminder += `
🔄 WHAT YOU WERE DOING:
- No recent actions recorded\n`
    }

    // Add critical anchors
    if (criticalAnchors.length > 0) {
        reminder += `
🎯 CRITICAL ANCHORS (survived compaction):
`
        for (const anchor of criticalAnchors.slice(0, 3)) {
            const shortContent = anchor.content.length > 80
                ? anchor.content.substring(0, 80) + '...'
                : anchor.content
            reminder += `- [${anchor.priority.toUpperCase()}] ${shortContent}\n`
        }
        if (criticalAnchors.length > 3) {
            reminder += `- ... and ${criticalAnchors.length - 3} more critical anchors\n`
        }
    } else {
        reminder += `
🎯 CRITICAL ANCHORS:
- No critical anchors active\n`
    }

    // Add next steps based on phase and state
    reminder += `
📋 RECOMMENDED NEXT STEPS:
`

    if (!state?.lastValidation || staleCheck.stale) {
        reminder += `- ⚠️ Run validation: /idumb:validate (state is stale)\n`
    } else {
        reminder += `- ✅ State validated recently, check: /idumb:status\n`
    }

    reminder += `- Check TODOs: Use idumb-todo tool or /idumb:todo\n`
    reminder += `- Review phase status: /idumb:status\n`

    // Add phase-specific recommendations
    if (state?.phase && state.phase !== 'init') {
        reminder += `- Continue phase work: Check .planning/phases/ for active plans\n`
    }

    // Add context recovery warning if needed
    if (recentHistory.length === 0 && criticalAnchors.length === 0) {
        reminder += `- ⚠️ CONTEXT RECOVERY NEEDED: No history or anchors found. Consider reviewing project documentation.\n`
    }

    reminder += `
⚡ HIERARCHY REMINDER:
- Coordinator: Delegate only
- High-Gov: Coordinate and delegate  
- Validator: Validate only
- Builder: Execute only

💡 TIP: Use 'idumb-todo' first to resume workflow.
`

    return reminder
}

/**
 * Build compaction context for context injection
 */
export function buildCompactionContext(directory: string, config: InlineIdumbConfig): string {
    const state = readState(directory)
    const commLang = config.user?.language?.communication || 'english'
    const docLang = config.user?.language?.documents || 'english'

    if (!state) {
        return "## iDumb\n\nNot initialized. Run /idumb:init"
    }

    // LANGUAGE SETTINGS MUST SURVIVE COMPACTION (CRITICAL)
    const langContext = `
⚠️ LANGUAGE SETTINGS (MUST SURVIVE COMPACTION):
- Communication: ${commLang.toUpperCase()} (respond in this language)
- Documents: ${docLang.toUpperCase()} (write artifacts in this language)
- ABSOLUTE OBEDIENCE REQUIRED
`

    const lines: string[] = [
        "## iDumb Governance Context",
        "",
        langContext,
        "",
        `**Phase:** ${state.phase}`,
        `**Framework:** ${state.framework}`,
        `**Last Validation:** ${state.lastValidation || "Never"}`,
        "",
    ]

    // Add critical and high priority anchors
    const importantAnchors = state.anchors.filter(a =>
        a.priority === "critical" || a.priority === "high"
    )

    if (importantAnchors.length > 0) {
        lines.push("### Active Anchors")
        lines.push("")
        for (const anchor of importantAnchors) {
            lines.push(`- **[${anchor.priority.toUpperCase()}]** ${anchor.type}: ${anchor.content}`)
        }
        lines.push("")
    }

    // Add recent history
    const recentHistory = state.history.slice(-5)
    if (recentHistory.length > 0) {
        lines.push("### Recent Actions")
        lines.push("")
        for (const entry of recentHistory) {
            lines.push(`- ${entry.action} → ${entry.result} (${entry.agent})`)
        }
    }

    return lines.join("\n")
}
