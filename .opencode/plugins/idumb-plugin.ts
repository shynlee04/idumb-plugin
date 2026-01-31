/**
 * ============================================================================
 * iDumb Meta-Framework Plugin - PROTOTYPE v0.1.0
 * ============================================================================
 * A client-side OpenCode plugin testing all context manipulation concepts.
 * 
 * CAPABILITIES TESTED:
 * 1. Session lifecycle hooks (session.created, session.compacted)
 * 2. Tool interception (tool.execute.before, tool.execute.after)
 * 3. Custom tools for agent context injection
 * 4. System prompt injection via session.prompt({ system })
 * 5. Compaction context anchoring
 * 6. Permission auto-handling
 * 7. State persistence via file system
 * 
 * Based on: opencode-plugin-api-facts-2026-02-01.md research
 * ============================================================================
 */

import type { Plugin } from "@opencode-ai/plugin"
import { tool } from "@opencode-ai/plugin"
import * as fs from "fs"
import * as path from "path"

// ============================================================================
// CONFIGURATION
// ============================================================================
const CONFIG = {
    STATE_FILE: ".idumb/state.json",
    CONTEXTS_DIR: ".idumb/contexts",
    ANCHORS_MAX: 5,
    DEBUG: true,
}

// ============================================================================
// STATE MANAGEMENT
// ============================================================================
interface IdumbState {
    version: string
    initialized: boolean
    sessions: Record<string, SessionState>
    anchors: AnchorEntry[]
}

interface SessionState {
    id: string
    agent: string | null
    parentId: string | null
    turnOneIntent: string | null
    createdAt: string
    lastActive: string
    contextInjected: boolean
}

interface AnchorEntry {
    sessionId: string
    intent: string
    timestamp: string
    preserved: boolean
}

// Initialize or load state
function loadState(directory: string): IdumbState {
    const statePath = path.join(directory, CONFIG.STATE_FILE)
    try {
        if (fs.existsSync(statePath)) {
            return JSON.parse(fs.readFileSync(statePath, "utf8"))
        }
    } catch (e) {
        console.error("[iDumb] Error loading state:", e)
    }
    return createInitialState()
}

function createInitialState(): IdumbState {
    return {
        version: "0.1.0",
        initialized: false,
        sessions: {},
        anchors: [],
    }
}

function saveState(directory: string, state: IdumbState): void {
    const statePath = path.join(directory, CONFIG.STATE_FILE)
    const dir = path.dirname(statePath)
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(statePath, JSON.stringify(state, null, 2))
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
function log(message: string, data?: any): void {
    if (CONFIG.DEBUG) {
        console.log(`[iDumb] ${message}`, data ? JSON.stringify(data) : "")
    }
}

function detectAgentFromTitle(title: string): string | null {
    // Parse agent from session title patterns like "@agent" or "(agent subagent)"
    const atMatch = title.match(/@(\w+)/)
    if (atMatch) return atMatch[1]

    const subagentMatch = title.match(/\((@?\w+)\s+subagent\)/)
    if (subagentMatch) return subagentMatch[1].replace("@", "")

    return null
}

function getGovernanceContext(agent: string, directory: string): string {
    // Load agent-specific context if exists
    const contextPath = path.join(directory, CONFIG.CONTEXTS_DIR, `${agent}.md`)
    let agentContext = ""

    try {
        if (fs.existsSync(contextPath)) {
            agentContext = fs.readFileSync(contextPath, "utf8")
        }
    } catch (e) {
        log(`No context file for agent: ${agent}`)
    }

    // Default governance rules
    return `
## iDumb GOVERNANCE CONTEXT

### Agent: ${agent.toUpperCase()}
${agentContext || "No specific context defined."}

### Mandatory Rules
1. ⚠️ Call \`idumb_init\` tool FIRST on every session to receive governance context
2. ⚠️ Validate claims with evidence (run commands, show output)
3. ⚠️ Call \`idumb_complete\` before claiming task completion
4. ⚠️ Stay in scope - do ONLY what was delegated
5. ⚠️ Never skip verification steps

### Available iDumb Tools
- \`idumb_init\` - Get your context and current state
- \`idumb_complete\` - Record completion before finishing
- \`idumb_anchor\` - Save critical context to persist through compaction
`
}

function buildSacredAnchors(state: IdumbState, sessionId: string): string {
    const session = state.sessions[sessionId]
    if (!session?.turnOneIntent) return ""

    return `
## SACRED ANCHOR - ORIGINAL INTENT (VERBATIM)

> ${session.turnOneIntent}

⚠️ This was the user's exact original request. Do NOT drift from this goal.
⚠️ All work must trace back to this intent.
`
}

// ============================================================================
// PLUGIN EXPORT
// ============================================================================
export const IdumbPlugin: Plugin = async (ctx) => {
    const { client, directory } = ctx

    let state = loadState(directory)
    log("Plugin initialized", { directory, stateVersion: state.version })

    return {
        // ========================================================================
        // CUSTOM TOOLS - Agent can call these
        // ========================================================================
        tool: {
            /**
             * idumb_init - Agent MUST call this first to receive governance context
             * Solves: Agent blind spot (knows which agent is calling)
             */
            idumb_init: tool({
                description: "MANDATORY: Call this FIRST in every session to receive your governance context, current state, and mandatory rules. Returns agent-specific instructions and project state.",
                args: {},
                async execute(args, context) {
                    const { agent, sessionID, directory } = context
                    log("idumb_init called", { agent, sessionID })

                    // Update session state
                    if (!state.sessions[sessionID]) {
                        state.sessions[sessionID] = {
                            id: sessionID,
                            agent,
                            parentId: null,
                            turnOneIntent: null,
                            createdAt: new Date().toISOString(),
                            lastActive: new Date().toISOString(),
                            contextInjected: false,
                        }
                    }
                    state.sessions[sessionID].agent = agent
                    state.sessions[sessionID].lastActive = new Date().toISOString()
                    state.sessions[sessionID].contextInjected = true
                    saveState(directory, state)

                    // Get agent-specific context
                    const governance = getGovernanceContext(agent, directory)

                    // Get active anchors
                    const activeAnchors = state.anchors
                        .filter(a => a.preserved)
                        .slice(-CONFIG.ANCHORS_MAX)

                    return `${governance}

### Current Session State
- Session ID: ${sessionID}
- Agent: ${agent}
- Initialized: ${new Date().toISOString()}

### Active Anchors (${activeAnchors.length})
${activeAnchors.map(a => `- [${a.timestamp}] ${a.intent.slice(0, 100)}...`).join("\n") || "None"}

---
✅ Context loaded. Proceed with your task.
`
                },
            }),

            /**
             * idumb_complete - Agent MUST call before claiming completion
             * Solves: Premature completion claims
             */
            idumb_complete: tool({
                description: "MANDATORY: Call this when completing a task to record what was accomplished. Must be called before claiming work is done.",
                args: {
                    summary: tool.schema.string().describe("What was accomplished"),
                    artifacts: tool.schema.array(tool.schema.string()).optional().describe("List of files created/modified"),
                    verified: tool.schema.boolean().optional().describe("Was the work verified (tests pass, builds clean)?"),
                },
                async execute(args, context) {
                    const { agent, sessionID, directory } = context
                    log("idumb_complete called", { agent, sessionID, summary: args.summary })

                    // Validate verification status
                    if (!args.verified) {
                        return `⚠️ WARNING: Work not marked as verified!

Before completing, you MUST:
1. Run relevant tests
2. Check for linting/type errors
3. Confirm build succeeds

Call idumb_complete again with verified: true after verification.
`
                    }

                    // Record completion
                    const session = state.sessions[sessionID]
                    if (session) {
                        session.lastActive = new Date().toISOString()
                    }
                    saveState(directory, state)

                    return `✅ Completion recorded.

Summary: ${args.summary}
Artifacts: ${args.artifacts?.join(", ") || "None specified"}
Verified: ${args.verified ? "YES" : "NO"}
Timestamp: ${new Date().toISOString()}

You may now report completion to the user or parent orchestrator.
`
                },
            }),

            /**
             * idumb_anchor - Save critical context for compaction survival
             * Solves: Context loss during compaction
             */
            idumb_anchor: tool({
                description: "Save critical context that MUST survive session compaction. Use for key decisions, original intent, or important state.",
                args: {
                    intent: tool.schema.string().describe("The critical context to preserve"),
                    priority: tool.schema.enum(["critical", "important", "normal"]).optional(),
                },
                async execute(args, context) {
                    const { sessionID, directory } = context
                    log("idumb_anchor called", { sessionID, intent: args.intent.slice(0, 50) })

                    // Add to anchors
                    state.anchors.push({
                        sessionId: sessionID,
                        intent: args.intent,
                        timestamp: new Date().toISOString(),
                        preserved: args.priority === "critical" || args.priority === "important",
                    })

                    // Keep only recent anchors
                    if (state.anchors.length > CONFIG.ANCHORS_MAX * 2) {
                        state.anchors = state.anchors.slice(-CONFIG.ANCHORS_MAX)
                    }

                    saveState(directory, state)

                    return `🔒 Anchor saved (priority: ${args.priority || "normal"})

This context will be injected during session compaction to prevent drift.
`
                },
            }),
        },

        // ========================================================================
        // SESSION LIFECYCLE HOOKS
        // ========================================================================

        /**
         * session.created - Fires when new session starts
         * Solves: Zero-turn agent priming
         */
        "session.created": async (event) => {
            const sessionId = event.properties.info.id
            const title = event.properties.info.title || ""

            log("session.created", { sessionId, title })

            // Detect agent from title
            const agent = detectAgentFromTitle(title)

            // Initialize session state
            state.sessions[sessionId] = {
                id: sessionId,
                agent,
                parentId: event.properties.info.parentID || null,
                turnOneIntent: null,
                createdAt: new Date().toISOString(),
                lastActive: new Date().toISOString(),
                contextInjected: false,
            }
            saveState(directory, state)

            // If agent detected, inject governance context
            if (agent) {
                try {
                    const governance = getGovernanceContext(agent, directory)

                    await client.session.prompt({
                        path: { id: sessionId },
                        body: {
                            noReply: true,
                            system: governance,
                            parts: [{
                                type: "text",
                                text: `## iDumb Agent Initialization
You are ${agent}. 
⚠️ MANDATORY: Call \`idumb_init\` tool immediately before any other action.
This ensures you receive your governance context and current project state.
`
                            }]
                        }
                    })

                    log("Governance injected for agent", { agent, sessionId })
                    state.sessions[sessionId].contextInjected = true
                    saveState(directory, state)
                } catch (e) {
                    log("Error injecting governance", { error: e })
                }
            }
        },

        /**
         * session.updated - Fires on session changes
         * Solves: Capturing Turn-1 intent
         */
        "session.updated": async (event) => {
            const sessionId = event.properties.info.id
            const session = state.sessions[sessionId]

            // Only capture if we haven't already
            if (session && !session.turnOneIntent) {
                try {
                    const messages = await client.session.messages({
                        path: { id: sessionId }
                    })

                    // Find first user message
                    const firstUser = messages.find(m => m.info.role === "user")
                    if (firstUser?.parts?.[0]?.text) {
                        session.turnOneIntent = firstUser.parts[0].text
                        session.lastActive = new Date().toISOString()
                        saveState(directory, state)
                        log("Captured Turn-1 intent", { sessionId, intent: session.turnOneIntent.slice(0, 50) })

                        // Auto-save as anchor
                        state.anchors.push({
                            sessionId,
                            intent: session.turnOneIntent,
                            timestamp: new Date().toISOString(),
                            preserved: true,
                        })
                        saveState(directory, state)
                    }
                } catch (e) {
                    log("Error capturing Turn-1 intent", { error: e })
                }
            }
        },

        // ========================================================================
        // TOOL INTERCEPTION HOOKS
        // ========================================================================

        /**
         * tool.execute.before - Intercept before tool execution
         * Solves: Delegation context injection, blocking dangerous tools
         */
        "tool.execute.before": async (input, output) => {
            log("tool.execute.before", { tool: input.tool, sessionID: input.sessionID })

            // DELEGATION INTERCEPTION
            if (input.tool === "task") {
                const parentSession = state.sessions[input.sessionID]

                // Inject governance context into delegation prompt
                const parentContext = parentSession?.turnOneIntent
                    ? `\n\n## PARENT CONTEXT\nOriginal Intent: ${parentSession.turnOneIntent}\n`
                    : ""

                if (output.args?.prompt) {
                    output.args.prompt = `## iDumb DELEGATION HANDOFF
${parentContext}

### Delegation Rules
1. Call \`idumb_init\` FIRST to receive your context
2. Stay in scope - do ONLY what was delegated
3. Call \`idumb_complete\` when done
4. Report back with evidence of completion

---

${output.args.prompt}`
                }

                log("Delegation context injected", {
                    tool: input.tool,
                    hasParentContext: !!parentContext
                })
            }

            // ENV PROTECTION (example of blocking)
            if (input.tool === "read" && output.args?.filePath?.includes(".env")) {
                // Don't throw - just log warning. Throwing blocks the tool.
                log("WARNING: .env file access attempted", { file: output.args.filePath })
                // To block: throw new Error("Cannot read .env files")
            }
        },

        /**
         * tool.execute.after - After tool completes
         * Solves: Tracking delegation results
         */
        "tool.execute.after": async (input, output) => {
            log("tool.execute.after", {
                tool: input.tool,
                title: output.title,
                hasOutput: !!output.output
            })

            // Track task completion
            if (input.tool === "task") {
                // Extract child session ID from output if available
                const match = output.output?.match(/session_id:\s*([^\s<]+)/)
                if (match?.[1]) {
                    const childSessionId = match[1]
                    const parentSession = state.sessions[input.sessionID]

                    if (parentSession && state.sessions[childSessionId]) {
                        state.sessions[childSessionId].parentId = input.sessionID
                        saveState(directory, state)
                        log("Linked child session to parent", {
                            child: childSessionId,
                            parent: input.sessionID
                        })
                    }
                }
            }
        },

        // ========================================================================
        // COMPACTION HOOK
        // ========================================================================

        /**
         * experimental.session.compacting - Before compaction
         * Solves: SACRED anchor preservation
         */
        "experimental.session.compacting": async (input, output) => {
            log("session.compacting", { sessionID: input.sessionID })

            const session = state.sessions[input.sessionID]

            // Build anchor context
            const anchors = buildSacredAnchors(state, input.sessionID)

            // Inject all relevant context
            const contextParts: string[] = []

            // 1. Turn-1 Intent
            if (session?.turnOneIntent) {
                contextParts.push(`## SACRED ANCHOR - ORIGINAL INTENT

> ${session.turnOneIntent}

⚠️ Do NOT drift from this original goal.`)
            }

            // 2. Session lineage
            if (session?.parentId) {
                const parent = state.sessions[session.parentId]
                if (parent?.turnOneIntent) {
                    contextParts.push(`## PARENT CONTEXT

Parent Intent: ${parent.turnOneIntent.slice(0, 200)}...`)
                }
            }

            // 3. Active anchors
            const activeAnchors = state.anchors.filter(a =>
                a.sessionId === input.sessionID && a.preserved
            )
            if (activeAnchors.length > 0) {
                contextParts.push(`## USER-SAVED ANCHORS

${activeAnchors.map(a => `- ${a.intent.slice(0, 200)}`).join("\n")}`)
            }

            // 4. iDumb governance reminder
            contextParts.push(`## iDumb GOVERNANCE REMINDER

- Original agent: ${session?.agent || "unknown"}
- Call \`idumb_init\` if you need to refresh context
- All work must trace to original intent
- Call \`idumb_complete\` before claiming completion`)

            // Inject to compaction context
            output.context.push(contextParts.join("\n\n---\n\n"))

            log("Compaction context injected", {
                sessionId: input.sessionID,
                partsCount: contextParts.length
            })
        },

        // ========================================================================
        // PERMISSION HANDLING
        // ========================================================================

        /**
         * permission.asked - Permission request interceptor
         * Solves: Auto-approval based on rules
         */
        "permission.asked": async (event) => {
            log("permission.asked", {
                permission: event.properties.permission.permission,
                sessionID: event.properties.sessionID
            })

            // Example: Auto-approve read permissions
            // Uncomment to enable:
            /*
            if (event.properties.permission.permission === "read") {
              await client.postSessionByIdPermissionsByPermissionId({
                path: { 
                  id: event.properties.sessionID, 
                  permissionID: event.properties.permission.id 
                },
                body: { response: "allow", remember: true }
              })
              log("Auto-approved read permission")
            }
            */
        },

        // ========================================================================
        // EVENT LISTENER (catch-all)
        // ========================================================================

        event: async ({ event }) => {
            // Log all events for debugging
            if (CONFIG.DEBUG) {
                // Only log certain events to avoid noise
                const trackedEvents = [
                    "session.idle",
                    "session.error",
                    "file.edited",
                ]
                if (trackedEvents.includes(event.type)) {
                    log(`Event: ${event.type}`, event.properties)
                }
            }
        },
    }
}

// Default export for OpenCode
export default IdumbPlugin
