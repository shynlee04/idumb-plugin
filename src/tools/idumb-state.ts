/**
 * iDumb State Management Tool
 * 
 * Read and write the governance state stored in .idumb/brain/state.json
 * 
 * IMPORTANT: No console.log - would pollute TUI
 */

import { tool } from "@opencode-ai/plugin"
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, unlinkSync, rmdirSync } from "fs"
import { join } from "path"
import { smartDelegate, enhanceDelegation } from "../lib/smart-delegate"

interface IdumbState {
  version: string
  initialized: string
  framework: "bmad" | "planning" | "idumb" | "custom" | "none"
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

const DEFAULT_STATE: IdumbState = {
  version: "0.1.0",
  initialized: new Date().toISOString(),
  framework: "none",
  phase: "init",
  lastValidation: null,
  validationCount: 0,
  anchors: [],
  history: []
}

function getStatePath(directory: string): string {
  return join(directory, ".idumb", "brain", "state.json")
}

function ensureDirectory(directory: string): void {
  const brainDir = join(directory, ".idumb", "brain")
  if (!existsSync(brainDir)) {
    mkdirSync(brainDir, { recursive: true })
  }
}

function readState(directory: string): IdumbState {
  const statePath = getStatePath(directory)
  if (!existsSync(statePath)) {
    return { ...DEFAULT_STATE }
  }
  try {
    const content = readFileSync(statePath, "utf8")
    return JSON.parse(content) as IdumbState
  } catch {
    return { ...DEFAULT_STATE }
  }
}

function writeState(directory: string, state: IdumbState): void {
  ensureDirectory(directory)
  const statePath = getStatePath(directory)
  writeFileSync(statePath, JSON.stringify(state, null, 2))
}

// Read state
export const read = tool({
  description: "Read current iDumb governance state from .idumb/brain/state.json",
  args: {},
  async execute(args, context) {
    const state = readState(context.directory)
    return JSON.stringify(state, null, 2)
  },
})

// Write/update state
export const write = tool({
  description: "Write or update iDumb governance state",
  args: {
    phase: tool.schema.string().optional().describe("Set current phase"),
    framework: tool.schema.string().optional().describe("Set framework type: bmad, planning, idumb, custom, none"),
    lastValidation: tool.schema.string().optional().describe("Set last validation timestamp (ISO)"),
    incrementValidation: tool.schema.boolean().optional().describe("Increment validation count"),
  },
  async execute(args, context) {
    const state = readState(context.directory)

    if (args.phase) state.phase = args.phase
    if (args.framework) state.framework = args.framework as IdumbState["framework"]
    if (args.lastValidation) state.lastValidation = args.lastValidation
    if (args.incrementValidation) state.validationCount++

    writeState(context.directory, state)
    return `State updated: ${JSON.stringify(state, null, 2)}`
  },
})

// Add anchor
export const anchor = tool({
  description: "Add a context anchor that survives compaction",
  args: {
    type: tool.schema.string().describe("Anchor type: decision, context, checkpoint"),
    content: tool.schema.string().describe("Anchor content to preserve"),
    priority: tool.schema.string().optional().describe("Priority: critical, high, normal"),
  },
  async execute(args, context) {
    const state = readState(context.directory)

    const anchor: Anchor = {
      id: `anchor-${Date.now()}`,
      created: new Date().toISOString(),
      type: args.type as Anchor["type"],
      content: args.content,
      priority: (args.priority || "normal") as Anchor["priority"],
    }

    state.anchors.push(anchor)

    // Keep only last 20 anchors
    if (state.anchors.length > 20) {
      // Keep critical ones, remove oldest normals first
      const critical = state.anchors.filter(a => a.priority === "critical")
      const high = state.anchors.filter(a => a.priority === "high")
      const normal = state.anchors.filter(a => a.priority === "normal")

      state.anchors = [
        ...critical.slice(-5),
        ...high.slice(-10),
        ...normal.slice(-5),
      ]
    }

    writeState(context.directory, state)
    return `Anchor created: ${anchor.id} (${anchor.type})`
  },
})

// Record history
export const history = tool({
  description: "Record an action in governance history",
  args: {
    action: tool.schema.string().describe("Action performed"),
    result: tool.schema.string().describe("Result: pass, fail, partial"),
  },
  async execute(args, context) {
    const state = readState(context.directory)

    const entry: HistoryEntry = {
      timestamp: new Date().toISOString(),
      action: args.action,
      agent: context.agent,
      result: args.result as HistoryEntry["result"],
    }

    state.history.push(entry)

    // Keep last 50 entries
    if (state.history.length > 50) {
      state.history = state.history.slice(-50)
    }

    writeState(context.directory, state)
    return `History recorded: ${entry.action} -> ${entry.result}`
  },
})

// Get anchors for compaction
export const getAnchors = tool({
  description: "Get all anchors formatted for context injection during compaction",
  args: {
    priorityFilter: tool.schema.string().optional().describe("Filter by priority: critical, high, normal, all"),
  },
  async execute(args, context) {
    const state = readState(context.directory)
    const filter = args.priorityFilter || "all"

    let anchors = state.anchors
    if (filter !== "all") {
      anchors = anchors.filter(a => a.priority === filter)
    }

    if (anchors.length === 0) {
      return "No anchors found"
    }

    const formatted = anchors.map(a =>
      `[${a.priority.toUpperCase()}] ${a.type}: ${a.content}`
    ).join("\n")

    return `## iDumb Anchors (${anchors.length})\n\n${formatted}`
  },
})

// ============================================================================
// SESSION MANAGEMENT (Phase 3)
// ============================================================================

interface SessionRecord {
  sessionId: string
  createdAt: string
  updatedAt: string
  phase: string
  agent: string
  status: "active" | "completed" | "exported"
  metadata?: Record<string, any>
  summary?: string
}

function getSessionsDir(directory: string): string {
  return join(directory, ".idumb", "sessions")
}

function ensureSessionsDir(directory: string): void {
  const sessionsDir = getSessionsDir(directory)
  if (!existsSync(sessionsDir)) {
    mkdirSync(sessionsDir, { recursive: true })
  }
}

// Create a new session record
export const createSession = tool({
  description: "Create a new session record for long-term tracking",
  args: {
    sessionId: tool.schema.string().describe("Session ID from OpenCode"),
    phase: tool.schema.string().optional().describe("Current project phase"),
    metadata: tool.schema.string().optional().describe("JSON string of additional metadata"),
  },
  async execute(args, context) {
    ensureSessionsDir(context.directory)
    const state = readState(context.directory)

    const record: SessionRecord = {
      sessionId: args.sessionId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      phase: args.phase || state.phase,
      agent: context.agent || "unknown",
      status: "active",
    }

    if (args.metadata) {
      try {
        record.metadata = JSON.parse(args.metadata)
      } catch {
        // Ignore invalid JSON
      }
    }

    const sessionPath = join(getSessionsDir(context.directory), `${args.sessionId}.json`)
    writeFileSync(sessionPath, JSON.stringify(record, null, 2))

    return JSON.stringify({
      status: "created",
      session: record,
    }, null, 2)
  },
})

// Modify an existing session record
export const modifySession = tool({
  description: "Update an existing session record",
  args: {
    sessionId: tool.schema.string().describe("Session ID to update"),
    status: tool.schema.string().optional().describe("New status: active, completed, exported"),
    summary: tool.schema.string().optional().describe("Session summary for long-term context"),
    metadata: tool.schema.string().optional().describe("JSON string of additional metadata to merge"),
  },
  async execute(args, context) {
    const sessionPath = join(getSessionsDir(context.directory), `${args.sessionId}.json`)

    if (!existsSync(sessionPath)) {
      return JSON.stringify({
        status: "error",
        message: `Session not found: ${args.sessionId}`,
      }, null, 2)
    }

    let record: SessionRecord
    try {
      record = JSON.parse(readFileSync(sessionPath, "utf8"))
    } catch {
      return JSON.stringify({
        status: "error",
        message: "Failed to read session file",
      }, null, 2)
    }

    if (args.status) {
      record.status = args.status as SessionRecord["status"]
    }
    if (args.summary) {
      record.summary = args.summary
    }
    if (args.metadata) {
      try {
        record.metadata = { ...record.metadata, ...JSON.parse(args.metadata) }
      } catch {
        // Ignore invalid JSON
      }
    }
    record.updatedAt = new Date().toISOString()

    writeFileSync(sessionPath, JSON.stringify(record, null, 2))

    return JSON.stringify({
      status: "updated",
      session: record,
    }, null, 2)
  },
})

// Export a session for long-term brain storage
export const exportSession = tool({
  description: "Export a session's context for long-term brain storage",
  args: {
    sessionId: tool.schema.string().describe("Session ID to export"),
    includeHistory: tool.schema.boolean().optional().describe("Include full history (default: true)"),
    includeAnchors: tool.schema.boolean().optional().describe("Include all anchors (default: true)"),
  },
  async execute(args, context) {
    const sessionPath = join(getSessionsDir(context.directory), `${args.sessionId}.json`)
    const state = readState(context.directory)

    let sessionRecord: SessionRecord | null = null
    if (existsSync(sessionPath)) {
      try {
        sessionRecord = JSON.parse(readFileSync(sessionPath, "utf8"))
      } catch {
        // Continue without session record
      }
    }

    const includeHistory = args.includeHistory !== false
    const includeAnchors = args.includeAnchors !== false

    const exportData = {
      exportedAt: new Date().toISOString(),
      sessionId: args.sessionId,
      session: sessionRecord,
      state: {
        phase: state.phase,
        framework: state.framework,
        validationCount: state.validationCount,
      },
      anchors: includeAnchors ? state.anchors.filter(a =>
        a.priority === "critical" || a.priority === "high"
      ) : [],
      history: includeHistory ? state.history.slice(-20) : [],
    }

    // Save to exports directory
    const exportsDir = join(context.directory, ".idumb", "brain", "exports")
    if (!existsSync(exportsDir)) {
      mkdirSync(exportsDir, { recursive: true })
    }

    const exportPath = join(exportsDir, `${args.sessionId}-export.json`)
    writeFileSync(exportPath, JSON.stringify(exportData, null, 2))

    // Update session status
    if (sessionRecord) {
      sessionRecord.status = "exported"
      sessionRecord.updatedAt = new Date().toISOString()
      writeFileSync(sessionPath, JSON.stringify(sessionRecord, null, 2))
    }

    return JSON.stringify({
      status: "exported",
      path: exportPath,
      anchorsCount: exportData.anchors.length,
      historyCount: exportData.history.length,
    }, null, 2)
  },
})

// List all sessions
export const listSessions = tool({
  description: "List all tracked sessions with their status",
  args: {
    status: tool.schema.string().optional().describe("Filter by status: active, completed, exported"),
  },
  async execute(args, context) {
    const sessionsDir = getSessionsDir(context.directory)

    if (!existsSync(sessionsDir)) {
      return JSON.stringify({
        sessions: [],
        count: 0,
      }, null, 2)
    }

    const files = readdirSync(sessionsDir).filter(f => f.endsWith(".json"))
    const sessions: SessionRecord[] = []

    for (const file of files) {
      try {
        const record = JSON.parse(readFileSync(join(sessionsDir, file), "utf8"))
        if (!args.status || record.status === args.status) {
          sessions.push(record)
        }
      } catch {
        // Skip invalid files
      }
    }

    // Sort by updatedAt descending
    sessions.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

    return JSON.stringify({
      sessions: sessions,
      count: sessions.length,
      summary: {
        active: sessions.filter(s => s.status === "active").length,
        completed: sessions.filter(s => s.status === "completed").length,
        exported: sessions.filter(s => s.status === "exported").length,
      },
    }, null, 2)
  },
})

// =============================================================================
// GARBAGE COLLECTION - Clean up old sessions and halt checkpoints
// =============================================================================

export const purgeOldSessions = tool({
  description: "Purge old session files and halt checkpoints (default: older than 7 days)",
  args: {
    maxAgeHours: tool.schema.number().optional().describe("Max age in hours (default: 168 = 7 days)"),
    dryRun: tool.schema.boolean().optional().describe("If true, only report what would be deleted"),
  },
  async execute(args, context) {
    const maxAge = (args.maxAgeHours || 168) * 60 * 60 * 1000 // Convert to milliseconds
    const now = Date.now()
    const dryRun = args.dryRun || false

    const deleted: { sessions: string[]; halts: string[] } = { sessions: [], halts: [] }
    const errors: string[] = []

    // 1. Clean up old session files
    const sessionsDir = getSessionsDir(context.directory)
    if (existsSync(sessionsDir)) {
      const files = readdirSync(sessionsDir).filter(f => f.endsWith(".json"))

      for (const file of files) {
        try {
          const filePath = join(sessionsDir, file)
          const stats = statSync(filePath)
          const age = now - stats.mtimeMs

          if (age > maxAge) {
            if (!dryRun) {
              unlinkSync(filePath)
            }
            deleted.sessions.push(file)
          }
        } catch (e) {
          errors.push(`Session ${file}: ${e instanceof Error ? e.message : String(e)}`)
        }
      }
    }

    // 2. Clean up old halt checkpoints
    const executionDir = join(context.directory, ".idumb", "execution")
    if (existsSync(executionDir)) {
      const dirs = readdirSync(executionDir).filter(d => d.startsWith("halt-"))

      for (const dir of dirs) {
        try {
          const dirPath = join(executionDir, dir)
          const stats = statSync(dirPath)
          const age = now - stats.mtimeMs

          if (age > maxAge) {
            if (!dryRun) {
              // Remove directory recursively
              const files = readdirSync(dirPath)
              for (const file of files) {
                unlinkSync(join(dirPath, file))
              }
              rmdirSync(dirPath)
            }
            deleted.halts.push(dir)
          }
        } catch (e) {
          errors.push(`Halt ${dir}: ${e instanceof Error ? e.message : String(e)}`)
        }
      }
    }

    // 3. Trim state.json history if too long
    if (!dryRun) {
      const state = readState(context.directory)
      if (state.history.length > 50) {
        // Archive old history entries
        const historyDir = join(context.directory, ".idumb", "brain", "history")
        if (!existsSync(historyDir)) {
          mkdirSync(historyDir, { recursive: true })
        }

        // Save excess history to archive
        const excess = state.history.slice(0, state.history.length - 50)
        const archivePath = join(historyDir, `history-${Date.now()}.json`)
        writeFileSync(archivePath, JSON.stringify(excess, null, 2))

        // Keep only last 50 entries
        state.history = state.history.slice(-50)
        const statePath = join(context.directory, ".idumb", "brain", "state.json")
        writeFileSync(statePath, JSON.stringify(state, null, 2))
      }

      // 4. Trim anchors if too many
      if (state.anchors.length > 20) {
        // Archive excess anchors, keeping critical/high priority
        const criticalAnchors = state.anchors.filter(a => a.priority === "critical" || a.priority === "high")
        const normalAnchors = state.anchors.filter(a => a.priority === "normal")

        // Keep all critical/high, trim normal to fit in 20
        const maxNormal = 20 - criticalAnchors.length
        const keptAnchors = [...criticalAnchors, ...normalAnchors.slice(-Math.max(0, maxNormal))]

        state.anchors = keptAnchors
        const statePath = join(context.directory, ".idumb", "brain", "state.json")
        writeFileSync(statePath, JSON.stringify(state, null, 2))
      }
    }

    return JSON.stringify({
      status: dryRun ? "dry_run" : "purged",
      deleted: {
        sessions: deleted.sessions.length,
        halts: deleted.halts.length,
        sessionFiles: deleted.sessions,
        haltDirs: deleted.halts,
      },
      errors: errors.length > 0 ? errors : undefined,
      maxAgeHours: args.maxAgeHours || 168,
    }, null, 2)
  },
})

// Default export for simple state read
export default read
