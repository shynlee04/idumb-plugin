/**
 * ============================================================================
 * iDumb Meta-Framework Plugin for OpenCode
 * ============================================================================
 * Version: 0.1.0
 * 
 * This plugin runs in the USER'S project directory, not in the npm package.
 * It looks for .idumb/ directory in the project for configuration.
 * 
 * Install: npm install @idumb/opencode-plugin
 * Initialize: npx @idumb/opencode-plugin init
 * Activate: Add "@idumb/opencode-plugin" to opencode.json plugin array
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
    IDUMB_DIR: ".idumb",
    STATE_FILE: "state.json",
    CONTEXTS_DIR: "contexts",
    ANCHORS_MAX: 5,
    DEBUG: process.env.IDUMB_DEBUG === "true",
}

// ============================================================================
// TYPES
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

// ============================================================================
// STATE MANAGEMENT
// ============================================================================
function getIdumbPath(directory: string): string {
    return path.join(directory, CONFIG.IDUMB_DIR)
}

function isIdumbInitialized(directory: string): boolean {
    return fs.existsSync(getIdumbPath(directory))
}

function loadState(directory: string): IdumbState | null {
    const statePath = path.join(getIdumbPath(directory), CONFIG.STATE_FILE)
    try {
        if (fs.existsSync(statePath)) {
            return JSON.parse(fs.readFileSync(statePath, "utf8"))
        }
    } catch (e) {
        log(directory, "Error loading state:", e)
    }
    return null
}

function saveState(directory: string, state: IdumbState): void {
    const statePath = path.join(getIdumbPath(directory), CONFIG.STATE_FILE)
    try {
        fs.writeFileSync(statePath, JSON.stringify(state, null, 2))
    } catch (e) {
        log(directory, "Error saving state:", e)
    }
}

// ============================================================================
// HELPERS
// ============================================================================
function log(directory: string, message: string, data?: any): void {
    if (CONFIG.DEBUG) {
        console.log(`[iDumb] ${message}`, data ? JSON.stringify(data) : "")
    }
}

function detectAgentFromTitle(title: string): string | null {
    const atMatch = title.match(/@(\w+)/)
    if (atMatch) return atMatch[1]

    const subagentMatch = title.match(/\((@?\w+)\s+subagent\)/)
    if (subagentMatch) return subagentMatch[1].replace("@", "")

    return null
}

function loadAgentContext(directory: string, agent: string): string {
    const contextPath = path.join(
        getIdumbPath(directory),
        CONFIG.CONTEXTS_DIR,
        `${agent}.md`
    )

    try {
        if (fs.existsSync(contextPath)) {
            return fs.readFileSync(contextPath, "utf8")
        }
    } catch (e) {
        log(directory, `No context file for agent: ${agent}`)
    }

    return ""
}

function getGovernanceContext(directory: string, agent: string): string {
    const agentContext = loadAgentContext(directory, agent)

    return `
## iDumb GOVERNANCE CONTEXT

### Agent: ${agent.toUpperCase()}
${agentContext || "No specific context defined. Add .idumb/contexts/${agent}.md to customize."}

### Mandatory Rules
1. ⚠️ Call \`idumb_init\` tool FIRST to receive governance context
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

// ============================================================================
// PLUGIN EXPORT
// ============================================================================
export const IdumbPlugin: Plugin = async (ctx) => {
    const { client, directory } = ctx

    // Check if iDumb is initialized in this project
    if (!isIdumbInitialized(directory)) {
        console.log(`[iDumb] Not initialized in ${directory}. Run: npx @idumb/opencode-plugin init`)
        return {} // Return empty hooks - plugin is inactive
    }

    let state = loadState(directory)
    if (!state) {
        console.log(`[iDumb] Could not load state from ${directory}/.idumb/state.json`)
        return {}
    }

    log(directory, "Plugin initialized", { directory, version: state.version })

    return {
        // ========================================================================
        // CUSTOM TOOLS
        // ========================================================================
        tool: {
            idumb_init: tool({
                description: "MANDATORY: Call this FIRST in every session to receive your governance context, current state, and mandatory rules.",
                args: {},
                async execute(args, context) {
                    const { agent, sessionID, directory: ctxDir } = context
                    log(ctxDir, "idumb_init called", { agent, sessionID })

                    if (!state) return "Error: iDumb state not loaded"

                    // Update session
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
                    saveState(ctxDir, state)

                    const governance = getGovernanceContext(ctxDir, agent)
                    const activeAnchors = state.anchors
                        .filter(a => a.preserved)
                        .slice(-CONFIG.ANCHORS_MAX)

                    return `${governance}

### Current Session
- Session ID: ${sessionID}
- Agent: ${agent}
- Project: ${ctxDir}
- Timestamp: ${new Date().toISOString()}

### Active Anchors (${activeAnchors.length})
${activeAnchors.map(a => `- [${a.timestamp}] ${a.intent.slice(0, 100)}...`).join("\n") || "None"}

---
✅ Context loaded. Proceed with your task.
`
                },
            }),

            idumb_complete: tool({
                description: "MANDATORY: Call when completing a task to record outcome. Must be called before claiming work is done.",
                args: {
                    summary: tool.schema.string().describe("What was accomplished"),
                    artifacts: tool.schema.array(tool.schema.string()).optional(),
                    verified: tool.schema.boolean().optional().describe("Was work verified?"),
                },
                async execute(args, context) {
                    const { agent, sessionID, directory: ctxDir } = context
                    log(ctxDir, "idumb_complete called", { agent, summary: args.summary })

                    if (!args.verified) {
                        return `⚠️ Work not marked as verified!

Before completing:
1. Run relevant tests
2. Check for errors
3. Confirm build succeeds

Call idumb_complete again with verified: true after verification.
`
                    }

                    if (state?.sessions[sessionID]) {
                        state.sessions[sessionID].lastActive = new Date().toISOString()
                        saveState(ctxDir, state)
                    }

                    return `✅ Completion recorded.

Summary: ${args.summary}
Artifacts: ${args.artifacts?.join(", ") || "None"}
Verified: YES
Timestamp: ${new Date().toISOString()}
`
                },
            }),

            idumb_anchor: tool({
                description: "Save critical context that MUST survive session compaction.",
                args: {
                    intent: tool.schema.string().describe("The critical context to preserve"),
                    priority: tool.schema.enum(["critical", "important", "normal"]).optional(),
                },
                async execute(args, context) {
                    const { sessionID, directory: ctxDir } = context
                    log(ctxDir, "idumb_anchor called", { intent: args.intent.slice(0, 50) })

                    if (!state) return "Error: State not loaded"

                    state.anchors.push({
                        sessionId: sessionID,
                        intent: args.intent,
                        timestamp: new Date().toISOString(),
                        preserved: args.priority === "critical" || args.priority === "important",
                    })

                    if (state.anchors.length > CONFIG.ANCHORS_MAX * 2) {
                        state.anchors = state.anchors.slice(-CONFIG.ANCHORS_MAX)
                    }

                    saveState(ctxDir, state)

                    return `🔒 Anchor saved (priority: ${args.priority || "normal"})`
                },
            }),
        },

        // ========================================================================
        // SESSION LIFECYCLE
        // ========================================================================
        "session.created": async (event) => {
            const sessionId = event.properties.info.id
            const title = event.properties.info.title || ""
            const agent = detectAgentFromTitle(title)

            log(directory, "session.created", { sessionId, agent })

            if (!state) return

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

            // Inject governance if agent detected
            if (agent) {
                try {
                    const governance = getGovernanceContext(directory, agent)
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
`
                            }]
                        }
                    })
                    state.sessions[sessionId].contextInjected = true
                    saveState(directory, state)
                } catch (e) {
                    log(directory, "Error injecting governance", { error: e })
                }
            }
        },

        "session.updated": async (event) => {
            const sessionId = event.properties.info.id
            const session = state?.sessions[sessionId]

            if (session && !session.turnOneIntent) {
                try {
                    const messages = await client.session.messages({ path: { id: sessionId } })
                    const firstUser = messages.find(m => m.info.role === "user")

                    if (firstUser?.parts?.[0]?.text) {
                        session.turnOneIntent = firstUser.parts[0].text
                        session.lastActive = new Date().toISOString()

                        state?.anchors.push({
                            sessionId,
                            intent: session.turnOneIntent,
                            timestamp: new Date().toISOString(),
                            preserved: true,
                        })

                        saveState(directory, state!)
                        log(directory, "Captured Turn-1 intent", { intent: session.turnOneIntent.slice(0, 50) })
                    }
                } catch (e) {
                    log(directory, "Error capturing intent", { error: e })
                }
            }
        },

        // ========================================================================
        // TOOL INTERCEPTION
        // ========================================================================
        "tool.execute.before": async (input, output) => {
            if (input.tool === "task" && output.args?.prompt) {
                const parentSession = state?.sessions[input.sessionID]
                const parentContext = parentSession?.turnOneIntent
                    ? `\n\n## PARENT CONTEXT\nOriginal Intent: ${parentSession.turnOneIntent}\n`
                    : ""

                output.args.prompt = `## iDumb DELEGATION HANDOFF
${parentContext}
### Rules
1. Call \`idumb_init\` FIRST
2. Stay in scope
3. Call \`idumb_complete\` when done
4. Report back with evidence

---

${output.args.prompt}`

                log(directory, "Delegation context injected")
            }
        },

        // ========================================================================
        // COMPACTION
        // ========================================================================
        "experimental.session.compacting": async (input, output) => {
            const session = state?.sessions[input.sessionID]
            const contextParts: string[] = []

            if (session?.turnOneIntent) {
                contextParts.push(`## SACRED ANCHOR - ORIGINAL INTENT

> ${session.turnOneIntent}

⚠️ Do NOT drift from this original goal.`)
            }

            if (session?.parentId && state?.sessions[session.parentId]?.turnOneIntent) {
                contextParts.push(`## PARENT CONTEXT

Parent Intent: ${state.sessions[session.parentId].turnOneIntent?.slice(0, 200)}...`)
            }

            const activeAnchors = state?.anchors.filter(a =>
                a.sessionId === input.sessionID && a.preserved
            ) || []

            if (activeAnchors.length > 0) {
                contextParts.push(`## USER-SAVED ANCHORS

${activeAnchors.map(a => `- ${a.intent.slice(0, 200)}`).join("\n")}`)
            }

            contextParts.push(`## iDumb GOVERNANCE REMINDER

- Agent: ${session?.agent || "unknown"}
- Call \`idumb_init\` to refresh context
- Call \`idumb_complete\` before completion`)

            output.context.push(contextParts.join("\n\n---\n\n"))
            log(directory, "Compaction context injected", { parts: contextParts.length })
        },
    }
}

// Default export for OpenCode plugin loading
export default IdumbPlugin
