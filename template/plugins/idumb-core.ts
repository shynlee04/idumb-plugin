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
// SESSION METADATA STORAGE (Phase 3)
// ============================================================================

interface SessionMetadata {
  sessionId: string
  createdAt: string
  lastUpdated: string
  phase: string
  governanceLevel: string
  delegationDepth: number
  parentSession: string | null
}

function getSessionsDir(directory: string): string {
  return join(directory, ".idumb", "sessions")
}

function storeSessionMetadata(directory: string, sessionId: string): void {
  const sessionsDir = getSessionsDir(directory)
  if (!existsSync(sessionsDir)) {
    mkdirSync(sessionsDir, { recursive: true })
  }
  
  const metadataPath = join(sessionsDir, `${sessionId}.json`)
  
  // Check if metadata already exists
  if (existsSync(metadataPath)) {
    // Update lastUpdated only
    try {
      const existing = JSON.parse(readFileSync(metadataPath, "utf8")) as SessionMetadata
      existing.lastUpdated = new Date().toISOString()
      writeFileSync(metadataPath, JSON.stringify(existing, null, 2))
    } catch {
      // Ignore parse errors
    }
    return
  }
  
  // Create new metadata
  const state = readState(directory)
  const metadata: SessionMetadata = {
    sessionId,
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    phase: state?.phase || "init",
    governanceLevel: "standard",
    delegationDepth: 0,
    parentSession: null,
  }
  
  writeFileSync(metadataPath, JSON.stringify(metadata, null, 2))
}

function loadSessionMetadata(directory: string, sessionId: string): SessionMetadata | null {
  const metadataPath = join(getSessionsDir(directory), `${sessionId}.json`)
  if (!existsSync(metadataPath)) {
    return null
  }
  try {
    return JSON.parse(readFileSync(metadataPath, "utf8")) as SessionMetadata
  } catch {
    return null
  }
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
// TIMESTAMP FRONTMATTER INJECTION
// ============================================================================

// GSD short-lived artifacts that should have timestamps
const GSD_TIMESTAMPED_PATTERNS = [
  /\.planning\/phases\/.*-PLAN\.md$/,
  /\.planning\/phases\/.*-RESEARCH\.md$/,
  /\.planning\/phases\/.*-CONTEXT\.md$/,
  /\.planning\/STATE\.md$/,
  /\.planning\/todos\/.*\.md$/,
]

interface FrontmatterTimestamp {
  created?: string
  modified: string
  staleAfterHours: number
}

function shouldInjectTimestamp(filePath: string): boolean {
  return GSD_TIMESTAMPED_PATTERNS.some(pattern => pattern.test(filePath))
}

function extractFrontmatter(content: string): { frontmatter: Record<string, any> | null; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) {
    return { frontmatter: null, body: content }
  }
  
  try {
    // Simple YAML-like parsing (just key: value pairs)
    const frontmatter: Record<string, any> = {}
    const lines = match[1].split("\n")
    for (const line of lines) {
      const colonIndex = line.indexOf(":")
      if (colonIndex > 0) {
        const key = line.slice(0, colonIndex).trim()
        const value = line.slice(colonIndex + 1).trim()
        frontmatter[key] = value
      }
    }
    return { frontmatter, body: match[2] }
  } catch {
    return { frontmatter: null, body: content }
  }
}

function injectTimestampFrontmatter(content: string, existingCreated?: string): string {
  const now = new Date().toISOString()
  const { frontmatter, body } = extractFrontmatter(content)
  
  const timestamp: FrontmatterTimestamp = {
    modified: now,
    staleAfterHours: 48, // Default staleness threshold
  }
  
  // Preserve existing created timestamp, or set to now
  if (existingCreated) {
    timestamp.created = existingCreated
  } else if (frontmatter?.created) {
    timestamp.created = frontmatter.created
  } else {
    timestamp.created = now
  }
  
  // Build new frontmatter
  const newFrontmatter = {
    ...frontmatter,
    idumb_created: timestamp.created,
    idumb_modified: timestamp.modified,
    idumb_stale_after_hours: timestamp.staleAfterHours,
  }
  
  // Serialize frontmatter (simple YAML-like format)
  const fmLines = Object.entries(newFrontmatter)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n")
  
  return `---\n${fmLines}\n---\n${body}`
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
      // FALLBACK STRATEGY (Line 232): All hooks wrapped in try/catch
      // Errors in plugins must NEVER break OpenCode execution
      try {
        // Session created - initialize or load state
        if (event.type === "session.created") {
          const sessionId = event.properties?.info?.id || event.properties?.sessionID || "unknown"
          log(directory, `Session created: ${sessionId}`)
          
          const state = readState(directory)
          if (state) {
            // Sync with GSD if present
            syncWithGSD(directory)
            log(directory, `State loaded: phase=${state.phase}, framework=${state.framework}`)
          } else {
            log(directory, "No state found - run /idumb:init")
          }
          
          // Store session metadata for tracking (Phase 3)
          storeSessionMetadata(directory, sessionId as string)
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
        
        // TODO updated - sync with governance state (Phase 3)
        if (event.type === "todo.updated") {
          const sessionId = event.properties?.sessionID
          log(directory, `TODOs updated in session: ${sessionId}`)
          
          // Could sync TODO state to .idumb/brain/state.json here
          // For now, just log the event
        }
      } catch (error) {
        // Silent fail with logging - never break OpenCode
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
    // TOOL INTERCEPTION
    // ========================================================================
    
    "tool.execute.before": async (input: any, output: any) => {
      // FALLBACK STRATEGY (Line 232): All hooks wrapped in try/catch
      try {
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
          const filePath = input.args?.path || input.args?.filePath || ""
          log(directory, `File operation: ${toolName} on ${filePath}`)
          
          // Inject timestamp frontmatter for GSD short-lived artifacts
          if (shouldInjectTimestamp(filePath)) {
            log(directory, `Injecting timestamp frontmatter into: ${filePath}`)
            
            // For write operations, inject into content
            if (toolName === "write" && output.args?.content) {
              // Check if file exists to get existing created timestamp
              const fullPath = join(directory, filePath)
              let existingCreated: string | undefined
              if (existsSync(fullPath)) {
                const existing = readFileSync(fullPath, "utf8")
                const { frontmatter } = extractFrontmatter(existing)
                existingCreated = frontmatter?.idumb_created
              }
              
              output.args.content = injectTimestampFrontmatter(output.args.content, existingCreated)
              log(directory, "Timestamp frontmatter injected into write content")
            }
          }
        }
      } catch (error) {
        // Silent fail with logging - never break OpenCode
        log(directory, `[ERROR] tool.execute.before failed: ${error instanceof Error ? error.message : String(error)}`)
      }
    },
    
    "tool.execute.after": async (input: any, output: any) => {
      // FALLBACK STRATEGY (Line 232): All hooks wrapped in try/catch
      try {
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
      } catch (error) {
        // Silent fail with logging - never break OpenCode
        log(directory, `[ERROR] tool.execute.after failed: ${error instanceof Error ? error.message : String(error)}`)
      }
    },
    
    // ========================================================================
    // COMMAND HOOKS
    // ========================================================================
    
    // Note: Commands are intercepted via command.executed event
    // We log command execution for governance tracking
    
    // ========================================================================
    // STOP HOOK - TODO ENFORCEMENT (Phase 3)
    // ========================================================================
    
    stop: async (input: { sessionID?: string; session_id?: string }) => {
      // FALLBACK STRATEGY (Line 232): All hooks wrapped in try/catch
      try {
        const sessionId = input.sessionID || input.session_id
        if (!sessionId) {
          log(directory, "[STOP] No session ID available")
          return
        }
        
        log(directory, `[STOP] Session stop triggered: ${sessionId}`)
        
        // Fetch current TODOs via SDK
        const response = await client.session.todo({ path: { id: sessionId } })
        const todos = response.data || []
        
        // Find incomplete tasks
        const incomplete = todos.filter((t: any) => 
          t.status === "pending" || t.status === "in_progress"
        )
        
        if (incomplete.length > 0) {
          log(directory, `[STOP] Found ${incomplete.length} incomplete TODOs - prompting continuation`)
          
          // Build governance reminder
          const todoList = incomplete
            .map((t: any) => `- [${t.priority?.toUpperCase() || "MEDIUM"}] ${t.content}`)
            .join("\n")
          
          // Prompt agent to continue
          await client.session.prompt({
            path: { id: sessionId },
            body: {
              parts: [{
                type: "text",
                text: `## [iDumb Governance] Incomplete Tasks Detected

You have **${incomplete.length}** incomplete task(s) that must be addressed before stopping:

${todoList}

**Required Actions:**
1. Complete each pending task, OR
2. Mark tasks as \`cancelled\` with a reason if they cannot be completed
3. Update the TODO list using \`todowrite\`

Do NOT stop until all tasks are either \`completed\` or \`cancelled\`.`
              }]
            }
          })
          
          log(directory, "[STOP] Continuation prompt sent")
        } else {
          log(directory, "[STOP] All TODOs complete - allowing stop")
          
          // Record successful completion in history
          addHistoryEntry(directory, "session:stop:clean", "plugin", "pass")
        }
      } catch (error) {
        // Silent fail with logging - never block OpenCode stop
        log(directory, `[ERROR] stop hook failed: ${error instanceof Error ? error.message : String(error)}`)
      }
    },
  }
}

// Default export for plugin loading
export default IdumbCorePlugin
