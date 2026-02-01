/**
 * iDumb State Management Tool
 * 
 * Read and write the governance state stored in .idumb/brain/state.json
 * 
 * IMPORTANT: No console.log - would pollute TUI
 */

import { tool } from "@opencode-ai/plugin"
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs"
import { join } from "path"

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
    framework: tool.schema.string().optional().describe("Set framework type: gsd, bmad, custom, none"),
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

// Default export for simple state read
export default read
