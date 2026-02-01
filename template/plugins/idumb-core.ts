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
 */

import type { Plugin } from "@opencode-ai/plugin"
import { existsSync, readFileSync, writeFileSync, mkdirSync, appendFileSync } from "fs"
import { join } from "path"

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

interface IdumbState {
  version: string
  initialized: string
  framework: "gsd" | "bmad" | "custom" | "none"
  phase: string
  lastValidation: string | null
  validationCount: number
  anchors: Anchor[]
  history: HistoryEntry[]
}

interface Anchor {
  id: string
  created: string
  type: "decision" | "context" | "checkpoint"
  content: string
  priority: "critical" | "high" | "normal"
}

interface HistoryEntry {
  timestamp: string
  action: string
  agent: string
  result: "pass" | "fail" | "partial"
}

function getStatePath(directory: string): string {
  return join(directory, ".idumb", "brain", "state.json")
}

function getLogPath(directory: string): string {
  return join(directory, ".idumb", "governance", "plugin.log")
}

function log(directory: string, message: string): void {
  // File-based logging instead of console.log
  try {
    const logPath = getLogPath(directory)
    const logDir = join(directory, ".idumb", "governance")
    if (!existsSync(logDir)) {
      mkdirSync(logDir, { recursive: true })
    }
    const timestamp = new Date().toISOString()
    appendFileSync(logPath, `[${timestamp}] ${message}\n`)
  } catch {
    // Silent fail - don't break on logging errors
  }
}

function readState(directory: string): IdumbState | null {
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

function writeState(directory: string, state: IdumbState): void {
  const brainDir = join(directory, ".idumb", "brain")
  if (!existsSync(brainDir)) {
    mkdirSync(brainDir, { recursive: true })
  }
  const statePath = getStatePath(directory)
  writeFileSync(statePath, JSON.stringify(state, null, 2))
}

function addHistoryEntry(directory: string, action: string, agent: string, result: "pass" | "fail" | "partial"): void {
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
// CONTEXT INJECTION
// ============================================================================

function buildCompactionContext(directory: string): string {
  const state = readState(directory)
  if (!state) {
    return "## iDumb\n\nNot initialized. Run /idumb:init"
  }
  
  const lines: string[] = [
    "## iDumb Governance Context",
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

// ============================================================================
// GSD INTEGRATION
// ============================================================================

// GSD file paths (STATE.md is in .planning/, not project root)
const GSD_PATHS = {
  planning: ".planning",
  state: ".planning/STATE.md",
  roadmap: ".planning/ROADMAP.md",
  config: ".planning/config.json",
  research: ".planning/research",
  phases: ".planning/phases",
  todos: ".planning/todos",
}

interface GSDState {
  phase: number
  totalPhases: number
  phaseName: string
  plan?: number
  totalPlans?: number
  status?: string
}

function detectGSDPresence(directory: string): boolean {
  return existsSync(join(directory, GSD_PATHS.planning)) &&
         (existsSync(join(directory, GSD_PATHS.state)) ||
          existsSync(join(directory, GSD_PATHS.roadmap)) ||
          existsSync(join(directory, GSD_PATHS.config)))
}

function parseGSDState(directory: string): GSDState | null {
  // GSD STATE.md is in .planning/, not project root
  const stateMdPath = join(directory, GSD_PATHS.state)
  if (!existsSync(stateMdPath)) {
    return null
  }
  
  try {
    const content = readFileSync(stateMdPath, "utf8")
    
    // GSD STATE.md format: "Phase: [1] of [4] (Foundation)"
    const phaseMatch = content.match(/Phase:\s*\[(\d+)\]\s*of\s*\[(\d+)\]\s*\(([^)]+)\)/i)
    if (!phaseMatch) {
      // Fallback: try simpler patterns
      const simpleMatch = content.match(/Phase[:\s]+(\d+)/i)
      if (simpleMatch) {
        return {
          phase: parseInt(simpleMatch[1], 10),
          totalPhases: 0,
          phaseName: `Phase ${simpleMatch[1]}`,
        }
      }
      return null
    }
    
    const result: GSDState = {
      phase: parseInt(phaseMatch[1], 10),
      totalPhases: parseInt(phaseMatch[2], 10),
      phaseName: phaseMatch[3].trim(),
    }
    
    // Try to get plan info: "Plan: [2] of [3] in current phase"
    const planMatch = content.match(/Plan:\s*\[(\d+)\]\s*of\s*\[(\d+)\]/i)
    if (planMatch) {
      result.plan = parseInt(planMatch[1], 10)
      result.totalPlans = parseInt(planMatch[2], 10)
    }
    
    // Try to get status
    const statusMatch = content.match(/Status:\s*([^\n]+)/i)
    if (statusMatch) {
      result.status = statusMatch[1].trim()
    }
    
    return result
  } catch {
    return null
  }
}

function detectGSDPhase(directory: string): string | null {
  const gsdState = parseGSDState(directory)
  if (!gsdState) return null
  
  // Return formatted phase string
  return `${gsdState.phase}/${gsdState.totalPhases} (${gsdState.phaseName})`
}

function syncWithGSD(directory: string): void {
  const gsdPhase = detectGSDPhase(directory)
  if (!gsdPhase) return
  
  const state = readState(directory)
  if (!state) return
  
  // Update phase if GSD has different phase
  if (state.phase !== gsdPhase) {
    state.phase = gsdPhase
    writeState(directory, state)
    log(directory, `Synced phase with GSD: ${gsdPhase}`)
  }
}

// ============================================================================
// PLUGIN EXPORT
// ============================================================================

export const IdumbCorePlugin: Plugin = async ({ directory, client }) => {
  log(directory, "iDumb plugin initialized")
  
  return {
    // ========================================================================
    // SESSION EVENTS
    // ========================================================================
    
    event: async ({ event }: { event: any }) => {
      // Session created - initialize or load state
      if (event.type === "session.created") {
        log(directory, `Session created: ${event.properties?.info?.id || event.properties?.sessionID || "unknown"}`)
        
        const state = readState(directory)
        if (state) {
          // Sync with GSD if present
          syncWithGSD(directory)
          log(directory, `State loaded: phase=${state.phase}, framework=${state.framework}`)
        } else {
          log(directory, "No state found - run /idumb:init")
        }
      }
      
      // Session idle - checkpoint opportunity
      if (event.type === "session.idle") {
        log(directory, "Session idle - considering checkpoint")
        
        // Could add automatic checkpoint logic here
        // For now, just log
      }
      
      // Session compacted - state may need refresh
      if (event.type === "session.compacted") {
        log(directory, "Session compacted")
        
        // Re-sync with GSD after compaction
        syncWithGSD(directory)
      }
    },
    
    // ========================================================================
    // COMPACTION HOOK (EXPERIMENTAL)
    // ========================================================================
    
    "experimental.session.compacting": async (input, output) => {
      log(directory, "Compaction triggered - injecting context")
      
      // Build context from state and anchors
      const context = buildCompactionContext(directory)
      
      // Append to compaction context (don't replace)
      output.context.push(context)
      
      log(directory, `Injected ${context.split("\n").length} lines of context`)
    },
    
    // ========================================================================
    // TOOL INTERCEPTION
    // ========================================================================
    
    "tool.execute.before": async (input: any, output: any) => {
      const toolName = input.tool
      
      // Intercept task tool (agent delegation)
      if (toolName === "task") {
        log(directory, `Task delegation detected: ${JSON.stringify(input.args || {}).slice(0, 100)}`)
        
        const state = readState(directory)
        if (state) {
          // Inject governance context into task prompt
          const governanceContext = [
            "\n\n---",
            "## iDumb Governance Context",
            `Current phase: ${state.phase}`,
            `Framework: ${state.framework}`,
            state.anchors.length > 0 ? 
              `Active anchors: ${state.anchors.filter(a => a.priority !== "normal").length}` :
              "No active anchors",
            "---\n",
          ].join("\n")
          
          // Prepend to task prompt
          if (output.args && typeof output.args.prompt === "string") {
            output.args.prompt = governanceContext + output.args.prompt
            log(directory, "Injected governance context into task delegation")
          }
        }
      }
      
      // Track file edits
      if (toolName === "edit" || toolName === "write") {
        log(directory, `File operation: ${toolName} on ${input.args?.path || input.args?.filePath}`)
      }
    },
    
    "tool.execute.after": async (input: any, output: any) => {
      const toolName = input.tool
      
      // Record completed task delegations
      if (toolName === "task") {
        const result = output.error ? "fail" : "pass"
        addHistoryEntry(directory, `task:${input.args?.description || "unknown"}`, "plugin", result as "pass" | "fail")
        log(directory, `Task completed: ${result}`)
      }
      
      // Sync with GSD after certain operations
      if (toolName === "edit" || toolName === "write") {
        const filePath = input.args?.path || input.args?.filePath || ""
        
        // If editing GSD files, sync state
        if (filePath.includes("STATE.md") || 
            filePath.includes("ROADMAP.md") ||
            filePath.includes(".planning/")) {
          syncWithGSD(directory)
          log(directory, "GSD file modified - synced state")
        }
      }
    },
    
    // ========================================================================
    // COMMAND HOOKS
    // ========================================================================
    
    // Note: Commands are intercepted via command.executed event
    // We log command execution for governance tracking
  }
}

// Default export for plugin loading
export default IdumbCorePlugin
