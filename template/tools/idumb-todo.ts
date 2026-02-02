/**
 * iDumb TODO Management Tool
 * 
 * Hierarchical TODO management for governance workflows
 * Works with OpenCode's built-in todoread/todowrite but adds:
 * - Hierarchical prefixes [P1][P2][V][B][GAP]
 * - Metadata extraction
 * - Status tracking
 * 
 * IMPORTANT: No console.log - would pollute TUI
 */

import { tool } from "@opencode-ai/plugin"
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs"
import { join } from "path"

// Hierarchical TODO prefixes per governance protocol
const TODO_PREFIXES = {
  P1: "Phase 1",
  P2: "Phase 2", 
  P3: "Phase 3",
  V: "Validation Required",
  B: "Blocked",
  GAP: "Gap to Fill",
  BLOCKER: "Critical Blocker",
  MAJOR: "Major Issue",
  TEST: "Testing Required",
}

interface HierarchicalTodo {
  id: string
  content: string
  status: "pending" | "in_progress" | "completed" | "cancelled"
  priority: "high" | "medium" | "low"
  prefix?: string
  phase?: string
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
}

interface TodoState {
  version: string
  todos: HierarchicalTodo[]
  completedCount: number
  lastUpdated: string
}

function getTodoPath(directory: string): string {
  return join(directory, ".idumb", "brain", "todos.json")
}

function ensureDirectory(directory: string): void {
  const brainDir = join(directory, ".idumb", "brain")
  if (!existsSync(brainDir)) {
    mkdirSync(brainDir, { recursive: true })
  }
}

function readTodoState(directory: string): TodoState {
  const todoPath = getTodoPath(directory)
  if (!existsSync(todoPath)) {
    return {
      version: "0.1.0",
      todos: [],
      completedCount: 0,
      lastUpdated: new Date().toISOString(),
    }
  }
  try {
    return JSON.parse(readFileSync(todoPath, "utf8"))
  } catch {
    return {
      version: "0.1.0",
      todos: [],
      completedCount: 0,
      lastUpdated: new Date().toISOString(),
    }
  }
}

function writeTodoState(directory: string, state: TodoState): void {
  ensureDirectory(directory)
  state.lastUpdated = new Date().toISOString()
  writeFileSync(getTodoPath(directory), JSON.stringify(state, null, 2))
}

function extractPrefix(content: string): { prefix: string | null; cleanContent: string } {
  const match = content.match(/^\[([A-Z0-9-]+)\]\s*(.*)$/)
  if (match) {
    return { prefix: match[1], cleanContent: match[2] }
  }
  return { prefix: null, cleanContent: content }
}

function generateId(): string {
  return `todo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Create a new hierarchical TODO
export const create = tool({
  description: "Create a new hierarchical TODO with optional prefix like [P1], [V], [BLOCKER]",
  args: {
    content: tool.schema.string().describe("TODO content, optionally prefixed with [P1], [V], [B], etc."),
    priority: tool.schema.string().optional().describe("Priority: high, medium, low (default: medium)"),
    metadata: tool.schema.string().optional().describe("JSON string of additional metadata"),
  },
  async execute(args, context) {
    const state = readTodoState(context.directory)
    const { prefix, cleanContent } = extractPrefix(args.content)
    
    const todo: HierarchicalTodo = {
      id: generateId(),
      content: cleanContent,
      status: "pending",
      priority: (args.priority as "high" | "medium" | "low") || "medium",
      prefix: prefix || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    if (args.metadata) {
      try {
        todo.metadata = JSON.parse(args.metadata)
      } catch {
        // Ignore invalid JSON
      }
    }
    
    state.todos.push(todo)
    writeTodoState(context.directory, state)
    
    return JSON.stringify({
      status: "created",
      todo: todo,
      totalTodos: state.todos.length,
    }, null, 2)
  },
})

// Update a TODO status
export const update = tool({
  description: "Update a TODO's status, content, or priority",
  args: {
    id: tool.schema.string().describe("TODO ID to update"),
    status: tool.schema.string().optional().describe("New status: pending, in_progress, completed, cancelled"),
    content: tool.schema.string().optional().describe("New content"),
    priority: tool.schema.string().optional().describe("New priority: high, medium, low"),
  },
  async execute(args, context) {
    const state = readTodoState(context.directory)
    const todo = state.todos.find(t => t.id === args.id)
    
    if (!todo) {
      return JSON.stringify({
        status: "error",
        message: `TODO not found: ${args.id}`,
        availableIds: state.todos.map(t => t.id),
      }, null, 2)
    }
    
    if (args.status) {
      const oldStatus = todo.status
      todo.status = args.status as HierarchicalTodo["status"]
      if (args.status === "completed" && oldStatus !== "completed") {
        state.completedCount++
      }
    }
    if (args.content) {
      const { prefix, cleanContent } = extractPrefix(args.content)
      todo.content = cleanContent
      if (prefix) todo.prefix = prefix
    }
    if (args.priority) {
      todo.priority = args.priority as HierarchicalTodo["priority"]
    }
    todo.updatedAt = new Date().toISOString()
    
    writeTodoState(context.directory, state)
    
    return JSON.stringify({
      status: "updated",
      todo: todo,
    }, null, 2)
  },
})

// Complete a TODO with optional reason
export const complete = tool({
  description: "Mark a TODO as completed with optional completion notes",
  args: {
    id: tool.schema.string().describe("TODO ID to complete"),
    notes: tool.schema.string().optional().describe("Completion notes or evidence"),
  },
  async execute(args, context) {
    const state = readTodoState(context.directory)
    const todo = state.todos.find(t => t.id === args.id)
    
    if (!todo) {
      return JSON.stringify({
        status: "error",
        message: `TODO not found: ${args.id}`,
      }, null, 2)
    }
    
    const wasCompleted = todo.status === "completed"
    todo.status = "completed"
    todo.updatedAt = new Date().toISOString()
    
    if (args.notes) {
      todo.metadata = { ...todo.metadata, completionNotes: args.notes }
    }
    
    if (!wasCompleted) {
      state.completedCount++
    }
    
    writeTodoState(context.directory, state)
    
    return JSON.stringify({
      status: "completed",
      todo: todo,
      totalCompleted: state.completedCount,
    }, null, 2)
  },
})

// List TODOs with filtering
export const list = tool({
  description: "List TODOs with optional filtering by status, priority, or prefix",
  args: {
    status: tool.schema.string().optional().describe("Filter by status: pending, in_progress, completed, cancelled"),
    priority: tool.schema.string().optional().describe("Filter by priority: high, medium, low"),
    prefix: tool.schema.string().optional().describe("Filter by prefix: P1, P2, V, B, GAP, BLOCKER, etc."),
  },
  async execute(args, context) {
    const state = readTodoState(context.directory)
    let todos = state.todos
    
    if (args.status) {
      todos = todos.filter(t => t.status === args.status)
    }
    if (args.priority) {
      todos = todos.filter(t => t.priority === args.priority)
    }
    if (args.prefix) {
      todos = todos.filter(t => t.prefix === args.prefix)
    }
    
    // Format for display
    const formatted = todos.map(t => {
      const prefixStr = t.prefix ? `[${t.prefix}] ` : ""
      const statusIcon = {
        pending: "○",
        in_progress: "◐",
        completed: "●",
        cancelled: "✗",
      }[t.status]
      return `${statusIcon} ${prefixStr}${t.content} (${t.priority}, ${t.id})`
    })
    
    return JSON.stringify({
      count: todos.length,
      todos: todos,
      formatted: formatted.join("\n"),
      summary: {
        total: state.todos.length,
        pending: state.todos.filter(t => t.status === "pending").length,
        in_progress: state.todos.filter(t => t.status === "in_progress").length,
        completed: state.completedCount,
      },
    }, null, 2)
  },
})

// Get hierarchical tree of TODOs
export const hierarchy = tool({
  description: "Get TODOs organized by their hierarchical prefixes",
  args: {},
  async execute(args, context) {
    const state = readTodoState(context.directory)
    
    // Group by prefix
    const groups: Record<string, HierarchicalTodo[]> = {}
    const unprefixed: HierarchicalTodo[] = []
    
    for (const todo of state.todos) {
      if (todo.prefix) {
        if (!groups[todo.prefix]) {
          groups[todo.prefix] = []
        }
        groups[todo.prefix].push(todo)
      } else {
        unprefixed.push(todo)
      }
    }
    
    // Format as tree
    const lines: string[] = ["# Hierarchical TODO Tree", ""]
    
    for (const [prefix, todos] of Object.entries(groups).sort()) {
      const label = TODO_PREFIXES[prefix as keyof typeof TODO_PREFIXES] || prefix
      const incomplete = todos.filter(t => t.status !== "completed" && t.status !== "cancelled").length
      lines.push(`## [${prefix}] ${label} (${incomplete}/${todos.length} remaining)`)
      
      for (const todo of todos) {
        const statusIcon = {
          pending: "○",
          in_progress: "◐",
          completed: "●",
          cancelled: "✗",
        }[todo.status]
        lines.push(`  ${statusIcon} ${todo.content}`)
      }
      lines.push("")
    }
    
    if (unprefixed.length > 0) {
      lines.push("## [Other] Unprefixed Tasks")
      for (const todo of unprefixed) {
        const statusIcon = {
          pending: "○",
          in_progress: "◐",
          completed: "●",
          cancelled: "✗",
        }[todo.status]
        lines.push(`  ${statusIcon} ${todo.content}`)
      }
    }
    
    return JSON.stringify({
      tree: lines.join("\n"),
      groups: Object.keys(groups),
      prefixes: TODO_PREFIXES,
    }, null, 2)
  },
})

// Sync with OpenCode's built-in TODO
export const sync = tool({
  description: "Sync iDumb hierarchical TODOs with OpenCode's built-in TODO system",
  args: {
    direction: tool.schema.string().optional().describe("Sync direction: 'import' from OpenCode or 'export' to OpenCode (default: import)"),
  },
  async execute(args, context) {
    // This tool provides the data format that can be used with OpenCode's todoread/todowrite
    // It doesn't directly call OpenCode APIs but formats data for compatibility
    
    const state = readTodoState(context.directory)
    const direction = args.direction || "import"
    
    if (direction === "export") {
      // Format for OpenCode's todowrite
      const opencodeFormat = state.todos.map(t => ({
        id: t.id,
        content: t.prefix ? `[${t.prefix}] ${t.content}` : t.content,
        status: t.status,
        priority: t.priority,
      }))
      
      return JSON.stringify({
        status: "export_ready",
        message: "Use this data with todowrite tool",
        todos: opencodeFormat,
      }, null, 2)
    } else {
      return JSON.stringify({
        status: "import_instructions",
        message: "To import from OpenCode, use todoread first, then pass results to idumb-todo_create for each item",
        currentCount: state.todos.length,
      }, null, 2)
    }
  },
})

// Default export - list all TODOs
export default tool({
  description: "Read iDumb hierarchical TODOs - returns all tasks with their prefixes and statuses",
  args: {},
  async execute(args, context) {
    const state = readTodoState(context.directory)
    return JSON.stringify(state, null, 2)
  },
})
