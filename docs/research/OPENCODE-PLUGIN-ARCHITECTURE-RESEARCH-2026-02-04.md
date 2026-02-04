---

# OpenCode Plugin Architecture & Lifecycle - Deep Research Report

**Research Date:** 2026-02-04
**Researcher:** @idumb-project-researcher
**Purpose:** Comprehensive investigation of OpenCode plugin system for iDumb integration authenticity

---

## Executive Summary

### Key Findings
- OpenCode plugins are TypeScript/JavaScript modules with a powerful event-driven architecture
- Plugin lifecycle includes initialization, event subscription, tool registration, and session hooks
- Agents are configured via YAML frontmatter or JSON configuration
- Tools use Zod schemas for type-safe parameter validation
- State management relies on file-based persistence and context injection
- Multiple extensibility mechanisms: plugins, commands, agents, tools, MCP servers, skills

### Strategic Implications for iDumb
- iDumb's current implementation aligns with OpenCode plugin best practices
- The event-driven architecture allows for sophisticated governance hooks
- Context preservation through compaction hooks is critical for multi-agent workflows
- Tool permission system provides granular control for agent capabilities

### Recommendations
1. **Leverage session.compacting hooks** for context preservation across agent handoffs
2. **Use tool.execute.before/after** for permission enforcement at tool level
3. **Implement agent-specific permissions** via YAML frontmatter
4. **Use client.app.log()** instead of console.log for structured logging
5. **Take advantage of directory/worktree context** for project-aware operations

---

## 1. OpenCode Plugin System Fundamentals

### 1.1 Plugin Registration in package.json

OpenCode plugins can be registered in two ways:

#### Method 1: Local Plugin Files
Plugins placed in directory are automatically loaded:
- `.opencode/plugins/` - Project-level plugins
- `~/.config/opencode/plugins/` - Global plugins

**Example:**
```json
// package.json for npm-published plugins
{
  "name": "idumb-plugin",
  "version": "0.2.0",
  "main": "./template/plugins/idumb-core.ts"
}
```

#### Method 2: opencode.json Configuration
Plugins specified in config:
```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": [
    "opencode-helicone-session",
    "opencode-wakatime",
    "@my-org/custom-plugin"
  ]
}
```

### 1.2 Plugin Entry Point and Initialization

**Plugin Structure:**
```typescript
// .opencode/plugins/my-plugin.ts
import type { Plugin } from "@opencode-ai/plugin"

export const MyPlugin: Plugin = async ({ project, client, $, directory, worktree }) => {
  console.log("Plugin initialized!")
  
  return {
    // Hook implementations go here
  }
}
```

**Context Object Properties:**
- `project`: The current project information
- `directory`: The current working directory
- `worktree`: The git worktree path
- `client`: OpenCode SDK client for AI interaction
- `$`: Bun's shell API for executing commands

### 1.3 Plugin Lifecycle

#### Load Order (Critical for iDumb):
```
1. Global config (~/.config/opencode/opencode.json)
2. Project config (opencode.json)
3. Global plugin directory (~/.config/opencode/plugins/)
4. Project plugin directory (.opencode/plugins/)
```

**Rules:**
- Duplicate npm packages with same name and version loaded ONCE
- Local plugin and npm plugin with same name loaded separately
- All hooks run in sequence by load order

#### Plugin Initialization Flow:
```
OpenCode Startup
  ↓
Load all plugins (load order)
  ↓
Call each plugin function with context
  ↓
Collect all returned hooks
  ↓
Register hooks for events
  ↓
Plugin Ready
```

### 1.4 Plugin Manifest/Schema Requirements

**For npm packages:**
- Must export a Plugin function
- TypeScript plugins can import types from @opencode-ai/plugin
- package.json with main field pointing to plugin entry

**For local files:**
- .ts or .js files in plugins directory auto-loaded
- No explicit manifest file required for local plugins

---

## 2. OpenCode Agent System

### 2.1 Agent Definition Formats

#### Format 1: YAML Frontmatter (Markdown Files)
**Location:**
- Global: `~/.config/opencode/agents/`
- Per-project: `.opencode/agents/`

**Example:**
```yaml
---
description: "Supreme coordinator - NEVER executes directly, ONLY delegates"
mode: primary
scope: bridge
temperature: 0.1
permission:
  task:
    "idumb-high-governance": allow
    "idumb-mid-coordinator": allow
    "idumb-executor": allow
    "idumb-builder": allow
    "idumb-low-validator": allow
    # No "*" = deny unspecified by default
  bash:
    "git status": allow
    "git diff*": allow
    "git log*": allow
  edit: deny
  write: deny
tools:
  task: true
  read: true
  glob: true
  grep: true
  idumb-state: true
  idumb-config: true
---

# Agent Name

## Purpose
Top-level orchestration agent that delegates all work.
```

**Required Frontmatter Fields:**
- `description` (required): Brief description of agent
- `mode` (optional): "primary" | "all" | "all"
- `temperature` (optional): 0.0-1.0 (default: model-specific)
- `model` (optional): Override model (format: provider/model-id)
- `prompt` (optional): Path to custom system prompt file

#### Format 2: JSON Configuration
**Location:** opencode.json

```json
{
  "$schema": "https://opencode.ai/config.json",
  "agent": {
    "build": {
      "mode": "primary",
      "model": "anthropic/claude-sonnet-4-20250514",
      "prompt": "{file:./prompts/build.txt}",
      "tools": {
        "write": true,
        "edit": true,
        "bash": true
      }
    },
    "plan": {
      "mode": "primary",
      "model": "anthropic/claude-haiku-4-20250514",
      "tools": {
        "write": false,
        "edit": false,
        "bash": false
      }
    }
  }
}
```

### 2.2 Agent Permissions System

**Three Permission Levels:**

| Tool Type | Permission Values | Behavior |
|------------|-------------------|----------|
| `bash` | "allow" | Run without approval |
| `bash` | "ask" | Prompt for user approval |
| `bash` | "deny" | Tool completely disabled |
| `edit` | "allow"/"ask"/"deny" | Control file modifications |
| `write` | "allow"/"ask"/"deny" | Control file creation |
| `webfetch` | "allow"/"ask"/"deny" | Control web fetching |

**Permission Override Hierarchy:**
1. Global permissions (opencode.json permission section)
2. Agent-specific permissions (agent config)
3. Agent permissions override global config
4. Wildcard patterns for granular control

**Example Wildcard Permissions:**
```json
{
  "permission": {
    "bash": {
      "*": "ask",
      "git *": "allow"
    },
    "mymcp_*": "allow",
    "edit": "ask"
  }
}
```

### 2.3 Agent Hierarchy and Delegation

**Agent Types:**

| Type | Mode | Can Delegate | Description |
|------|-------|--------------|-------------|
| Primary | `primary` | Yes (via task tool, @mention) | Main conversational agents |
| all | `all` | No (leaf node) | Specialized assistants |

**Built-in Agents:**
- **Build** (primary): Full tool access, standard for development
- **Plan** (primary): Restricted, analysis and planning only
- **General** (all): Multi-step tasks, full access
- **Explore** (all): Read-only exploration

**Delegation Patterns:**

1. **@mention in conversation:**
   ```
   @general help me search for this function
   ```

2. **Task tool invocation:**
   ```
   // Agent programmatically invokes another agent
   ```

3. **Agent switching:**
   - Tab key: Cycle through primary agents
   - Configured keybind: switch_agent

**Navigation between sessions:**
- `<Leader>+Right`: Parent → child1 → child2 → … → parent
- `<Leader>+Left`: Parent ← child1 ← child2 ← … ← parent

### 2.4 Agent Configuration Options

**Common Options:**
- `description`: Brief description
- `temperature`: 0.0-1.0 (lower = more focused, higher = more creative)
- `maxSteps` (deprecated, use `steps`): Limit agentic iterations
- `disable`: Hide agent from UI
- `hidden`: Remove from @autocomplete (alls only)
- `model`: Override default model
- `tools`: Enable/disable specific tools
- `permission`: Granular permission control
- `task`: Control which alls can be invoked
- `subtask`: Force all invocation
- `color`: UI hex color
- `top_p`: Response diversity (0.0-1.0)

---

## 3. OpenCode Command System

### 3.1 Command Definition

**Method 1: Markdown Files**
**Location:**
- Global: `~/.config/opencode/commands/`
- Per-project: `.opencode/commands/`

**Example:**
```yaml
---
description: Run tests with coverage
agent: build
model: anthropic/claude-3-5-sonnet-20241022
---
Run full test suite with coverage report and show any failures.
Focus on failing tests and suggest fixes.
```

**Method 2: JSON Configuration**
```json
{
  "$schema": "https://opencode.ai/config.json",
  "command": {
    "test": {
      "description": "Run tests with coverage",
      "agent": "build",
      "model": "anthropic/claude-3-5-sonnet-20241022"
    }
  }
}
```

### 3.2 Command Metadata

**Required Fields:**
- `description` (required): Shown in TUI autocomplete

**Optional Fields:**
- `agent`: Which agent should execute command
- `model`: Override model for this command
- `template`: Prompt template (for JSON config)
- `subtask`: Force all invocation

### 3.3 Command Execution Flow

```
User types /command
  ↓
Parse command name
  ↓
Load command definition (markdown or JSON)
  ↓
Inject command prompt into AI context
  ↓
Load specified agent (if configured)
  ↓
AI generates response
  ↓
Execute with tool context (directory, worktree)
```

### 3.4 Command Features

**Arguments:**
- `$ARGUMENTS`: All arguments as single string
- `$1`, `$2`, `$3`: Positional arguments
- `@filename`: Include file content in prompt

**Shell Output:**
- `!command*`: Inject bash command output into prompt

**File References:**
- `@filename`: Include file content in prompt

---

## 4. OpenCode Tool System

### 4.1 Tool Exposure to Agents

**Two Mechanisms:**

1. **Built-in Tools:** Always available (read, write, edit, bash, etc.)
2. **Custom Tools:** Defined in plugins or tools directory
3. **MCP Servers:** External tools via Model Context Protocol
4. **Skills:** Loaded from .claude/skills/ or SKILL.md

### 4.2 Tool Parameter Validation (Zod Schemas)

**Tool Definition Pattern:**
```typescript
import { tool } from "@opencode-ai/plugin"

export const myTool = tool({
  description: "This is a custom tool",
  args: {
    foo: tool.schema.string().describe("String parameter"),
    count: tool.schema.number().default(1).describe("Number of items"),
    optional: tool.schema.boolean().optional().describe("Optional flag")
  },
  async execute(args, context) {
    const { directory, worktree } = context
    return `Hello ${args.foo} from ${directory} (worktree: ${worktree})`
  }
})
```

**Zod Schema Features:**
- Type-safe parameter definitions
- Default values
- Optional fields
- Custom error messages
- Nested schemas
- Coercion rules

**Zod Common Patterns:**
```typescript
// String validation
tool.schema.string().min(1).max(100)

// Number validation
tool.schema.number().positive().int()

// Enum validation
tool.schema.enum(["option1", "option2", "option3"])

// Object validation
tool.schema.object({
  name: tool.schema.string(),
  age: tool.schema.number()
})

// Array validation
tool.schema.array(tool.schema.string()).min(1)
```

### 4.3 Tool Execution Context

**Context Object:**
```typescript
interface ToolContext {
  directory: string        // Current working directory
  worktree: string       // Git worktree path
  project: ProjectInfo   // Project metadata
  client: SDKClient         // OpenCode SDK client
  $: ShellAPI             // Bun shell API
}
```

**Example Usage:**
```typescript
async execute(args, context) {
  // Access current directory
  const files = await context.$`ls ${context.directory}`
  
  // Execute shell commands
  await context.$`git status`
  
  // Use SDK client for advanced operations
  await context.client.app.log({
    service: "my-tool",
    level: "info",
    message: "Tool executed"
  })
}
```

### 4.4 Tool Error Handling

**Best Practices:**
1. **Always try-catch:**
```typescript
async execute(args, context) {
  try {
    const result = riskyOperation()
    return { success: true, data: result }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error)
    }
  }
}
```

2. **Use structured logging:**
```typescript
async execute(args, context) {
  try {
    // ... operation
  } catch (error) {
    await context.client.app.log({
      service: "my-plugin",
      level: "error",
      message: "Operation failed",
      extra: { error: error.message }
    })
    throw error  // Re-throw for expected flow
  }
}
```

3. **Silent fail with fallback:**
```typescript
function readState(directory: string): IdumbState | null {
  try {
    const content = readFileSync(statePath, "utf8")
    return JSON.parse(content) as IdumbState
  } catch {
    return null  // Silent fail - let caller handle it
  }
}
```

---

## 5. State & Context Management

### 5.1 Plugin State Persistence

**File-Based State:**
```typescript
// Read state
function readState(directory: string): Config {
  const configPath = join(directory, ".idumb", "config.json")
  const content = readFileSync(configPath, "utf8")
  return JSON.parse(content)
}

// Write state
function writeState(directory: string, config: Config): void {
  const configPath = join(directory, ".idumb", "config.json")
  writeFileSync(configPath, JSON.stringify(config, null, 2))
}
```

**Directory Paths for State:**
- `.idumb/idumb-brain/state.json` - Governance state
- `.idumb/idumb-brain/config.json` - Configuration
- `.idumb/idumb-brain/governance/` - Validation reports
- `.idumb/idumb-brain/anchors/` - Persistent context

### 5.2 Context Sharing Across Agents

**Agent Delegation Context:**
```typescript
// Agent spawns all with context
const taskResult = await context.client.task.invoke({
  agent: "idumb-builder",
  input: {
    task: "Modify this file",
    filePath: "src/main.ts",
    changes: "Add new function"
  }
})
```

**Session Context Preservation:**
- Directory/worktree available to all tools
- Context persists within session
- Compaction may reduce context (but hooks can inject)

### 5.3 Compaction Mechanisms

**Compaction Hook:**
```typescript
export const CompactionPlugin: Plugin = async (ctx) => {
  return {
    "experimental.session.compacting": async (input, output) => {
      // Inject additional context before compaction
      output.context.push(`
## Critical Context
- Current phase: ${input.session.phase}
- Active tasks: ${input.session.todos}
- Last decision: Implement state pattern
      `)
      
      // Or replace entire prompt
      output.prompt = `You are generating a continuation prompt...
Custom compaction instructions:
1. Preserve current task status
2. Track active agents
3. Remember last 3 actions
      `
    }
  }
}
```

**Compaction Behavior:**
- Triggers when session hits token limits
- Reduces context to summarize past work
- `output.context.push()` adds to default summary
- `output.prompt =` completely replaces default summary

### 5.4 Anchor System

**Creating Anchors:**
```typescript
export const AnchorPlugin: Plugin = async (ctx) => {
  return {
    "session.created": async (event) => {
      const anchorId = `anchor-${event.properties.sessionId}-${Date.now()}`
      await context.client.app.log({
        service: "anchor-system",
        level: "info",
        message: "Created anchor",
        extra: { anchorId }
      })
      
      // Store anchor in state
      // Anchors survive compaction
    }
  }
}
```

**Anchor Survival:**
- Anchors are critical decisions/context that MUST survive context compaction
- Stored in state.json anchors array
- Injected via compaction hooks

---

## 6. Best Practices from Official Plugins

### 6.1 State Management Patterns

**Pattern: Ensure State Exists**
```typescript
function ensureConfigExists(directory: string): Config {
  const configPath = join(directory, ".idumb", "config.json")
  
  if (!existsSync(configPath)) {
    const defaultConfig = getDefaultConfig("guided")
    
    // Create all required directories
    const dirs = [
      join(directory, ".idumb", "brain"),
      join(directory, ".idumb", "brain", "history"),
      join(directory, ".idumb", "brain", "context"),
      join(directory, ".idumb", "governance")
    ]
    
    for (const dir of dirs) {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true })
      }
    }
    
    writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2))
  }
  
  return loadConfig(directory)
}
```

**Pattern: Auto-Generate with Validation**
```typescript
function loadConfig(directory: string): Config {
  if (existsSync(configPath)) {
    try {
      const content = readFileSync(configPath, "utf8")
      const config = JSON.parse(content) as Config
      
      // Validate required fields
      if (!config.version || !config.user || !config.hierarchy) {
        throw new Error("Config missing required fields")
      }
      
      return config
    } catch (error) {
      // Config corrupted - backup and regenerate
      const backupPath = join(idumbDir, `config.backup.${Date.now()}.json`)
      writeFileSync(backupPath, readFileSync(configPath))
      
      return getDefaultConfig("guided")
    }
  }
  
  return getDefaultConfig("guided")
}
```

### 6.2 Logging Patterns

**CRITICAL: Use client.app.log() NOT console.log()**
```typescript
// ❌ WRONG - Pollutes TUI background
console.log("Plugin initialized!")

// ✅ CORRECT - Structured logging
await context.client.app.log({
  service: "my-plugin",
  level: "info",
  message: "Plugin initialized",
  extra: { foo: "bar" }
})
```

**Log Levels:**
- `debug`: Detailed debugging info
- `info`: General information
- `warn`: Warning messages
- `error`: Error conditions

**Log Rotation (from iDumb):**
```typescript
const MAX_LOG_SIZE_MB = 5
const MAX_ARCHIVED_LOGS = 3

function rotateLogIfNeeded(directory: string): void {
  const logPath = join(directory, ".idumb", "governance", "plugin.log")
  
  // Check file size
  const stats = statSync(logPath)
  const sizeMB = stats.size / (1024 * 1024)
  
  if (sizeMB > MAX_LOG_SIZE_MB) {
    // Archive current log
    const archivePath = join(logDir, `plugin.${Date.now()}.log`)
    moveSync(logPath, archivePath)
    
    // Keep only recent archives
    const archives = readdirSync(logDir)
      .filter(f => f.startsWith("plugin.") && f.endsWith(".log"))
      .sort()
      .reverse()
    
    // Delete old archives beyond MAX_ARCHIVED_LOGS
    for (const archive of archives.slice(MAX_ARCHIVED_LOGS)) {
      unlinkSync(join(logDir, archive))
    }
  }
}
```

### 6.3 Error Handling Patterns

**Pattern: Try-Catch-Fallback**
```typescript
export const myTool = tool({
  args: { /* ... */ },
  async execute(args, context) {
    try {
      const result = performOperation(args, context)
      return JSON.stringify(result, null, 2)
    } catch (error) {
      await context.client.app.log({
        service: "my-tool",
        level: "error",
        message: "Operation failed",
        extra: { 
          error: error instanceof Error ? error.message : String(error),
          args 
        }
      })
      
      return JSON.stringify({
        error: true,
        message: error instanceof Error ? error.message : "Unknown error"
      }, null, 2)
    }
  }
})
```

**Pattern: Graceful Degradation**
```typescript
async function getProjectInfo(directory: string): Promise<ProjectInfo> {
  try {
    // Try primary method
    return await readProjectMetadata(directory)
  } catch (primaryError) {
    await context.client.app.log({
      service: "project-info",
      level: "warn",
      message: "Primary method failed, trying fallback"
    })
    
    try {
      // Fallback method
      return await basicProjectDetection(directory)
    } catch (fallbackError) {
      // Return minimal info instead of failing
      return {
        name: "Unknown Project",
        type: "detected"
      }
    }
  }
}
```

### 6.4 Testing Patterns

**Pattern: Validation Tools**
```typescript
export const validateStructure = tool({
  args: {},
  async execute(args, context) {
    const issues: string[] = []
    
    // Check required files exist
    const requiredFiles = [
      ".idumb/idumb-brain/state.json",
      ".idumb/idumb-brain/config.json",
      ".idumb/idumb-brain/governance/"
    ]
    
    for (const file of requiredFiles) {
      const path = join(context.directory, file)
      if (!existsSync(path)) {
        issues.push(`Missing required file: ${file}`)
      }
    }
    
    return JSON.stringify({
      valid: issues.length === 0,
      issues
    })
  }
}
```

**Pattern: Integration Testing**
```typescript
// Mock context for testing
const mockContext: ToolContext = {
  directory: "/tmp/test-project",
  worktree: "/tmp/test-project",
  project: { name: "Test" },
  client: createMockClient(),
  $: createMockShell()
}
```

---

## 7. Integration Patterns

### 7.1 Plugin-OpenCode Core Integration

**Event Subscription:**
```typescript
export const iDumbPlugin: Plugin = async (ctx) => {
  return {
    // Session lifecycle events
    "session.created": async (event) => {
      await initializeSession(event, ctx)
    },
    
    "session.compacted": async (event) => {
      await injectCompactionContext(event, ctx)
    },
    
    "session.idle": async (event) => {
      await onSessionComplete(event, ctx)
    },
    
    // Tool execution hooks
    "tool.execute.before": async (input, output) => {
      await enforcePermissions(input, output, ctx)
    },
    
    "tool.execute.after": async (input, output) => {
      await trackExecution(input, output, ctx)
    },
    
    // File events
    "file.edited": async (event) => {
      await onFileChanged(event, ctx)
    },
    
    // Permission events
    "permission.asked": async (event) => {
      await onPermissionRequest(event, ctx)
    }
  }
}
```

### 7.2 Custom Tool Registration

**Pattern: Tool Collection Plugin:**
```typescript
export const iDumbToolsPlugin: Plugin = async (ctx) => {
  return {
    tool: {
      // State management tools
      idumb_state_read: tool({
        description: "Read governance state",
        args: {},
        async execute(args, context) {
          return JSON.stringify(readState(context.directory))
        }
      }),
      
      idumb_config_read: tool({
        description: "Read configuration",
        args: { 
          section: tool.schema.string().optional()
        },
        async execute(args, context) {
          return JSON.stringify(readConfig(context.directory))
        }
      }),
      
      // TODO management tools
      idumb_todo: tool({
        description: "Get TODO list",
        args: {},
        async execute(args, context) {
          return JSON.stringify(getTodos(context.directory))
        }
      }),
      
      idumb_todo_complete: tool({
        description: "Complete TODO item",
        args: {
          id: tool.schema.string()
        },
        async execute(args, context) {
          completeTodo(context.directory, args.id)
          return JSON.stringify({ completed: true, id: args.id })
        }
      })
    }
  }
}
```

### 7.3 Configuration Management

**Pattern: Configuration Sync:**
```typescript
export const configSyncPlugin: Plugin = async (ctx) => {
  return {
    "session.created": async (event) => {
      // Detect planning system
      const planningConfig = loadPlanningConfig(ctx.directory)
      
      if (planningConfig) {
        // Sync settings from planning
        const idumbConfig = loadIdumbConfig(ctx.directory)
        
        // Map planning mode to iDumb experience
        if (planningConfig.mode === "yolo") {
          idumbConfig.user.experience = "pro"
          idumbConfig.automation.mode = "autonomous"
        } else if (planningConfig.mode === "interactive") {
          idumbConfig.user.experience = "guided"
          idumbConfig.automation.mode = "confirmRequired"
        }
        
        // Save synced config
        saveConfig(ctx.directory, idumbConfig)
      }
    }
  }
}
```

### 7.4 Event-Driven Architecture

**Event Types Reference:**

| Category | Event | Purpose | iDumb Use Case |
|----------|-------|---------|----------------|
| Session | `session.created` | Initialize governance | Setup state, create anchors |
| Session | `session.compacted` | Preserve context | Inject critical context before compaction |
| Session | `session.idle` | Detect completion | Update TODOs, track metrics |
| Session | `session.updated` | Track progress | Update status, check invariants |
| Tool | `tool.execute.before` | Enforce permissions | Block unauthorized operations |
| Tool | `tool.execute.after` | Track execution | Log actions, validate results |
| File | `file.edited` | Monitor changes | Check for drift, trigger validation |
| Permission | `permission.asked` | Handle approvals | Log permission requests |
| Message | `message.updated` | Track context | Update history, detect patterns |

---

## 8. Architecture Diagrams

### 8.1 Plugin Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│              OpenCode Application                 │
└─────────────────────┬───────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────┐
│         Plugin System                     │
├──────────────────────────────────────────────┤
│                                          │
│  ┌────────────┐  ┌────────────┐  │
│  │   Local    │  │    npm     │  │
│  │  Plugins  │  │  Packages  │  │
│  │  .opencode/│  │ opencode.json │  │
│  │  plugins/  │  │             │  │
│  └────────────┘  └────────────┘  │
│              ↓                    │
│  ┌────────────────────────────┐│
│  │   Load Order:          ││
│  │ 1. Global Config         ││
│  │ 2. Project Config       ││
│  │ 3. Global Plugin Dir     ││
│  │ 4. Project Plugin Dir    ││
│  └────────────────────────────┘│
│              ↓                    │
│  ┌────────────────────────────┐│
│  │   Plugin Function         ││
│  │   (context) => {       ││
│  │     return {           ││
│  │       hooks...        ││
│  │     }                ││
│  └────────────────────────────┘│
│              ↓                    │
│  ┌────────────────────────────┐│
│  │  Registered Hooks       ││
│  │  - session.created       ││
│  │  - tool.execute.before  ││
│  │  - file.edited        ││
│  │  - session.compacted   ││
│  └────────────────────────────┘│
└──────────────────────────────────────────────┘
```

### 8.2 Agent Lifecycle Flow

```
User Request (/idumb:init)
      ↓
┌──────────────────────────────┐
│  Primary Agent Selection     │
│  (idumb-supreme-coordinator)│
└──────────┬─────────────────────┘
           ↓
┌──────────────────────────────┐
│  Load Agent Configuration │
│  - YAML frontmatter       │
│  - opencode.json          │
└──────────┬─────────────────────┘
           ↓
┌──────────────────────────────┐
│  Initialize Agent Context │
│  - Read state.json       │
│  - Check TODOs            │
│  - Load config           │
└──────────┬─────────────────────┘
           ↓
┌──────────────────────────────┐
│  Process User Request     │
│  - Detect intent          │
│  - Validate prerequisites  │
│  - Select workflow       │
└──────────┬─────────────────────┘
           ↓
┌──────────────────────────────┐
│  Delegation Decision     │
│  - @idumb-high-governance│
│  - @idumb-builder         │
│  - @idumb-low-validator  │
└──────────┬─────────────────────┘
           ↓
┌──────────────────────────────┐
│  Execute Delegated Task │
│  - Use tools (read, etc) │
│  - Enforce permissions     │
│  - Log actions           │
└──────────┬─────────────────────┘
           ↓
┌──────────────────────────────┐
│  Return Result & Update   │
│  - Synthesize output      │
│  - Update state.json      │
│  - Add history entry      │
│  - Report to user        │
└──────────┬─────────────────────┘
           ↓
           User Response
```

### 8.3 Tool Registration Pattern

```
Plugin Initialization
      ↓
┌──────────────────────────────┐
│  Tool Collection Plugin   │
│  .opencode/tools/*.ts   │
└──────────┬─────────────────────┘
           ↓
┌──────────────────────────────┐
│  Export Tool Functions  │
│  export const myTool =  │
│  tool({                 │
│    args: { ... },        │
│    async execute() {    │
│      // implementation  │
│    }                   │
└──────────┬─────────────────────┘
           ↓
┌──────────────────────────────┐
│  Tool Registration        │
│  - Type-safe (Zod)      │
│  - Available to agents    │
│  - Invoked via AI       │
└──────────┬─────────────────────┘
           ↓
┌──────────────────────────────┐
│  Tool Execution          │
│  - Context: {            │
│    directory, worktree   │
│    project, client       │
│  - Permissions checked     │
│  - Execute with validation│
│  - Return result         │
└──────────┬─────────────────────┘
           ↓
┌──────────────────────────────┐
│  Error Handling          │
│  - client.app.log()       │
│  - Try-catch-fallback    │
│  - Graceful degradation   │
└──────────┬─────────────────────┘
           ↓
           Success/Failure
```

---

## 9. Common Pitfalls & How to Avoid Them

### 9.1 Console.log Anti-Pattern

**Pitfall:**
```typescript
// ❌ PROBLEM - Pollutes TUI
export const MyPlugin: Plugin = async (ctx) => {
  console.log("Plugin loaded!")
  console.log("Tool executed")
  return {}
}
```

**Impact:**
- Text appears in OpenCode TUI background
- Breaks user experience
- Logs not structured for debugging

**Solution:**
```typescript
// ✅ CORRECT - Structured logging
export const MyPlugin: Plugin = async (ctx) => {
  await ctx.client.app.log({
    service: "my-plugin",
    level: "info",
    message: "Plugin loaded"
  })
  
  return {
    "tool.execute.after": async (input, output) => {
      await ctx.client.app.log({
        service: "my-plugin",
        level: "debug",
        message: `Tool ${input.tool} executed`,
        extra: { args: input.args }
      })
    }
  }
}
```

### 9.2 Missing State Initialization

**Pitfall:**
```typescript
// ❌ PROBLEM - Assumes state exists
export const myTool = tool({
  async execute(args, context) {
    const state = JSON.parse(
      readFileSync(join(context.directory, ".idumb", "brain", "state.json"), "utf8"
    )
    // State might not exist or be corrupted
  }
})
```

**Impact:**
- Plugin crashes on first run
- Poor user experience
- Unclear error messages

**Solution:**
```typescript
// ✅ CORRECT - Ensure state exists
function readState(directory: string): IdumbState | null {
  try {
    const statePath = join(directory, ".idumb", "brain", "state.json")
    
    if (!existsSync(statePath)) {
      // Auto-generate default state
      const defaultState = getDefaultState()
      mkdirSync(dirname(statePath), { recursive: true })
      writeFileSync(statePath, JSON.stringify(defaultState, null, 2))
      
      await context.client.app.log({
        service: "state",
        level: "info",
        message: "Auto-generated default state"
      })
      
      return defaultState
    }
    
    const content = readFileSync(statePath, "utf8")
    return JSON.parse(content) as IdumbState
  } catch (error) {
    await context.client.app.log({
      service: "state",
      level: "error",
      message: "Failed to read state",
      extra: { error: error instanceof Error ? error.message : String(error) }
    })
    
    return null  // Silent fail, let caller handle it
  }
}
```

### 9.3 Tool Permission Violations

**Pitfall:**
```typescript
// ❌ PROBLEM - Coordinators can write files
export const myTool = tool({
  async execute(args, context) => {
    await writeFileSync(join(context.directory, "output.txt"), "data")
    return { success: true }
  }
})
```

**Impact:**
- Breaks iDumb governance hierarchy
- Security risk if coordinator can modify files
- Violates delegation model

**Solution:**
```typescript
// ✅ CORRECT - Enforce permissions in plugin
export const GovernancePlugin: Plugin = async (ctx) => {
  return {
    "tool.execute.before": async (input, output) => {
      // Check agent role
      const agentRole = detectAgentFromSession(ctx)
      const allowedTools = getAllowedTools(agentRole)
      
      if (!allowedTools.includes(input.tool)) {
        const errorMessage = buildGovernancePrefix(agentRole, ctx.directory, false)
        
        await ctx.client.app.log({
          service: "governance",
          level: "warn",
          message: `Tool blocked: ${input.tool} for ${agentRole}`,
          extra: { 
            tool: input.tool,
            agent: agentRole,
            allowedTools 
          }
        })
        
        // Block execution - transform error
        throw new Error(errorMessage)
      }
    }
  }
}
```

### 9.4 Context Loss on Compaction

**Pitfall:**
```typescript
// ❌ PROBLEM - Critical context lost during compaction
export const iDumbPlugin: Plugin = async (ctx) => {
  return {
    // No compaction hook - context lost!
  }
}
```

**Impact:**
- Agent forgets critical decisions after compaction
- Breaks workflow continuity
- Users must repeat context

**Solution:**
```typescript
// ✅ CORRECT - Inject critical context
export const iDumbPlugin: Plugin = async (ctx) => {
  return {
    "experimental.session.compacting": async (input, output) => {
      // Get current state
      const state = readState(ctx.directory)
      
      // Get critical anchors
      const criticalAnchors = state.anchors.filter(
        a => a.priority === "critical" || a.priority === "high"
      )
      
      // Build context string
      const preservedContext = criticalAnchors.map(anchor => 
        `- [${anchor.priority.toUpperCase()}] ${anchor.content}`
      ).join("\n")
      
      // Inject into compaction
      output.context.push(preservedContext)
      
      await ctx.client.app.log({
        service: "compaction",
        level: "info",
        message: `Injected ${criticalAnchors.length} critical anchors`
      })
    }
  }
}
```

### 9.5 Race Conditions in Event Hooks

**Pitfall:**
```typescript
// ❌ PROBLEM - Multiple plugins modifying same state
export const PluginA = async (ctx) => {
  return {
    "session.created": async (event) => {
      const state = readState(ctx.directory)
      state.phase = "init"
      writeState(ctx.directory, state) // May be overwritten
    }
  }
}

export const PluginB = async (ctx) => {
  return {
    "session.created": async (event) => {
      const state = readState(ctx.directory)
      state.phase = "initialized" // Race!
      writeState(ctx.directory, state)
    }
  }
}
```

**Impact:**
- Unpredictable plugin behavior
- State corruption
- Last plugin wins

**Solution:**
```typescript
// ✅ CORRECT - Use atomic operations or coordinated hooks
export const CoordinatedPlugin = async (ctx) => {
  return {
    "session.created": async (event) => {
      // Use session-specific storage or coordination
      const sessionId = event.properties.sessionID
      const sessionState = getSessionState(sessionId)
      
      if (!sessionState) {
        // First plugin to initialize
        const state = readState(ctx.directory)
        state.phase = "init"
        writeState(ctx.directory, state)
        setSessionState(sessionId, { initialized: true })
      } else {
        // Subsequent plugins skip or coordinate
        await ctx.client.app.log({
          service: "coordination",
          level: "debug",
          message: `Session ${sessionId} already initialized`
        })
      }
    }
  }
}
```

---

## 10. Code Examples for Each Pattern

### 10.1 Plugin Initialization Example

**Complete Plugin Template:**
```typescript
/**
 * iDumb Core Plugin
 * 
 * Event hooks for OpenCode integration:
 * - Session lifecycle (created, compacting, idle)
 * - Tool interception (before/after)
 * - State management and context preservation
 * 
 * CRITICAL: NO console.log - use client.app.log() instead
 */

import type { Plugin } from "@opencode-ai/plugin"
import { existsSync, readFileSync, writeFileSync, mkdirSync, join } from "fs"

export const iDumbPlugin: Plugin = async (ctx) => {
  const { directory, client } = ctx
  
  // Log plugin initialization
  await client.app.log({
    service: "idumb-plugin",
    level: "info",
    message: "iDumb plugin loaded",
    extra: { version: "0.2.0" }
  })
  
  return {
    // Session lifecycle hooks
    "session.created": async (event) => {
      const sessionId = event.properties.sessionID || "unknown"
      
      await client.app.log({
        service: "idumb-plugin",
        level: "info",
        message: `Session created: ${sessionId}`,
        extra: { sessionId }
      })
      
      // Initialize governance state
      await initializeGovernance(directory, client, sessionId)
    },
    
    "session.compacted": async (event) => {
      await handleCompaction(event, ctx)
    },
    
    "session.idle": async (event) => {
      await onSessionComplete(event, ctx)
    },
    
    // Tool execution hooks for governance
    "tool.execute.before": async (input, output) => {
      await enforceToolPermissions(input, output, ctx)
    },
    
    "tool.execute.after": async (input, output) => {
      await trackToolExecution(input, output, ctx)
    },
    
    // File monitoring
    "file.edited": async (event) => {
      await onFileChanged(event, ctx)
    }
  }
}

/**
 * Initialize governance structure
 */
async function initializeGovernance(directory: string, client: any, sessionId: string): Promise<void> {
  // Check if .idumb exists
  const idumbDir = join(directory, ".idumb")
  
  if (!existsSync(idumbDir)) {
    // Create all required directories
    const dirs = [
      join(idumbDir, "brain"),
      join(idumbDir, "brain", "history"),
      join(idumbDir, "brain", "context"),
      join(idumbDir, "governance"),
      join(idumbDir, "governance", "validations"),
      join(idumbDir, "anchors"),
      join(idumbDir, "sessions")
    ]
    
    for (const dir of dirs) {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true })
      }
    }
    
    await client.app.log({
      service: "idumb-plugin",
      level: "info",
      message: "Created .idumb directory structure"
    })
  }
  
  // Ensure config exists (auto-generate if missing)
  await ensureConfigExists(directory)
}

/**
 * Handle session compaction - preserve critical context
 */
async function handleCompaction(event: any, ctx: any): Promise<void> {
  const { directory, client } = ctx
  
  // Read current state to get anchors
  const state = readState(directory)
  const criticalAnchors = state?.anchors?.filter(
    (a: any) => a.priority === "critical" || a.priority === "high"
  ) || []
  
  if (criticalAnchors.length > 0) {
    await client.app.log({
      service: "idumb-plugin",
      level: "info",
      message: `Preserving ${criticalAnchors.length} critical anchors across compaction`
    })
  }
}
```

### 10.2 Custom Tool Registration Example

**Tool with State Management:**
```typescript
/**
 * iDumb State Management Tools
 * 
 * Provides CRUD operations for governance state
 * with validation and error handling
 */

import { tool } from "@opencode-ai/plugin"
import { existsSync, readFileSync, writeFileSync, mkdirSync, join } from "fs"

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Read state - always returns valid state or null
 */
function readState(directory: string): any | null {
  try {
    const statePath = join(directory, ".idumb", "brain", "state.json")
    
    if (!existsSync(statePath)) {
      return null
    }
    
    const content = readFileSync(statePath, "utf8")
    return JSON.parse(content)
  } catch (error) {
    return null  // Silent fail
  }
}

/**
 * Write state with timestamp
 */
function writeState(directory: string, state: any): void {
  const statePath = join(directory, ".idumb", "brain", "state.json")
  
  if (!existsSync(dirname(statePath))) {
    mkdirSync(dirname(statePath), { recursive: true })
  }
  
  state.lastModified = new Date().toISOString()
  writeFileSync(statePath, JSON.stringify(state, null, 2))
}

// ============================================================================
// TOOL EXPORTS
// ============================================================================

/**
 * Read configuration
 */
export const configRead = tool({
  description: "Read iDumb configuration (merges with planning config if present)",
  args: {
    section: tool.schema.string().optional().describe("Specific section: user, status, hierarchy, automation, paths, staleness, timestamps, enforcement")
  },
  async execute(args, context) {
    const { directory, client } = context
    
    try {
      const config = ensureConfigExists(directory)
      
      if (args.section) {
        const section = (config as any)[args.section]
        return JSON.stringify(section, null, 2)
      }
      
      return JSON.stringify(config, null, 2)
    } catch (error) {
      await client.app.log({
        service: "config",
        level: "error",
        message: "Failed to read config",
        extra: { error: error instanceof Error ? error.message : String(error) }
      })
      
      return JSON.stringify({
        error: true,
        message: error instanceof Error ? error.message : "Unknown error"
      }, null, 2)
    }
  }
})

/**
 * Create or update anchor
 */
export const anchorCreate = tool({
  description: "Add a context anchor that survives compaction",
  args: {
    type: tool.schema.enum(["decision", "context", "checkpoint"]).describe("Anchor type"),
    content: tool.schema.string().describe("Anchor content"),
    priority: tool.schema.enum(["critical", "high", "normal"]).default("normal").describe("Priority level")
  },
  async execute(args, context) {
    const { directory, client } = context
    
    try {
      const state = readState(directory)
      if (!state) {
        throw new Error("State not initialized. Run /idumb:init first.")
      }
      
      const anchor = {
        id: `anchor-${Date.now()}`,
        created: new Date().toISOString(),
        type: args.type,
        content: args.content,
        priority: args.priority
      }
      
      state.anchors.push(anchor)
      writeState(directory, state)
      
      await client.app.log({
        service: "anchor",
        level: "info",
        message: `Created ${args.type} anchor`,
        extra: { id: anchor.id, priority: args.priority }
      })
      
      return JSON.stringify({
        created: true,
        anchor: anchor
      }, null, 2)
    } catch (error) {
      await client.app.log({
        service: "anchor",
        level: "error",
        message: "Failed to create anchor",
        extra: { error: error instanceof Error ? error.message : String(error) }
      })
      
      return JSON.stringify({
        error: true,
        message: error instanceof Error ? error.message : "Unknown error"
      }, null, 2)
    }
  }
})

/**
 * Ensure config exists - auto-generate if missing
 */
export const configEnsure = tool({
  description: "Ensure config exists - auto-generates if missing. MUST be called at session start by all agents.",
  args: {
    experience: tool.schema.string().optional().describe("Experience level for new config: pro, guided, strict")
  },
  async execute(args, context) {
    const { directory, client } = context
    const configPath = join(directory, ".idumb", "config.json")
    const existed = existsSync(configPath)
    
    try {
      let config = getDefaultConfig(args.experience || "guided")
      
      // If config exists, validate and load
      if (existed) {
        const content = readFileSync(configPath, "utf8")
        config = JSON.parse(content)
        
        // Validate required fields
        if (!config.version || !config.user || !config.hierarchy) {
          throw new Error("Config corrupted - missing required fields")
        }
      } else {
        // Create all required directories
        const dirs = [
          join(directory, ".idumb", "brain"),
          join(directory, ".idumb", "brain", "history"),
          join(directory, ".idumb", "brain", "context"),
          join(directory, ".idumb", "governance")
        ]
        
        for (const dir of dirs) {
          if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true })
          }
        }
      }
      
      writeFileSync(configPath, JSON.stringify(config, null, 2))
      
      await client.app.log({
        service: "config",
        level: "info",
        message: existed ? "Config loaded" : "Config auto-generated",
        extra: { 
          experience: config.user.experience,
          configPath 
        }
      })
      
      return JSON.stringify({
        existed,
        created: !existed,
        experience: config.user.experience
      }, null, 2)
    } catch (error) {
      await client.app.log({
        service: "config",
        level: "error",
        message: "Failed to ensure config",
        extra: { error: error instanceof Error ? error.message : String(error) }
      })
      
      return JSON.stringify({
        error: true,
        message: error instanceof Error ? error.message : "Unknown error"
      }, null, 2)
    }
  }
})

function getDefaultConfig(experience: string): any {
  const now = new Date().toISOString()
  
  return {
    version: "0.2.0",
    initialized: now,
    lastModified: now,
    user: {
      name: "Developer",
      experience,
      language: {
        communication: "english",
        documents: "english"
      }
    },
    governance: {
      level: "moderate",
      expertSkeptic: true,
      autoValidation: true
    }
  }
}
```

### 10.3 Event-Driven Plugin Example

**Permission Enforcement Plugin:**
```typescript
/**
 * iDumb Permission Enforcement Plugin
 * 
 * Enforces agent hierarchy by blocking unauthorized tool usage
 * and providing clear error messages
 */

import type { Plugin } from "@opencode-ai/plugin"
import { readFileSync, writeFileSync, join } from "fs"

export const PermissionPlugin: Plugin = async (ctx) => {
  const { directory, client } = ctx
  
  return {
    "tool.execute.before": async (input, output) => {
      // Detect agent role from session
      const agentRole = detectAgentRole(ctx, input)
      const allowedTools = getAllowedTools(agentRole)
      
      // Check if tool is allowed
      if (!allowedTools.includes(input.tool)) {
        // Build detailed error message
        const errorMessage = buildViolationMessage(agentRole, input.tool)
        
        await client.app.log({
          service: "permissions",
          level: "warn",
          message: `Blocked tool: ${input.tool} for agent: ${agentRole}`,
          extra: { 
            tool: input.tool,
            agent: agentRole,
            allowedTools 
          }
        })
        
        // Throw error to block execution
        throw new Error(errorMessage)
      }
      
      // Tool is allowed - let it proceed
      await client.app.log({
        service: "permissions",
        level: "debug",
        message: `Allowed tool: ${input.tool} for agent: ${agentRole}`,
        extra: { agent: agentRole, tool: input.tool }
      })
    }
  }
}

/**
 * Get allowed tools for an agent role
 */
function getAllowedTools(agentRole: string | null): string[] {
  const toolPermissions: Record<string, string[]> = {
    // Tier 1: Coordinators - can delegate + read context
    "idumb-supreme-coordinator": [
      "task", "idumb-todo", "todowrite",
      "read", "glob", "grep",
      "idumb-state", "idumb-state_read", "idumb-state_anchor",
      "idumb-state_getAnchors", "idumb-state_history",
      "idumb-context", "idumb-context_summary",
      "idumb-config", "idumb-config_read", "idumb-config_status",
      "idumb-todo", "idumb-todo_list", "idumb-todo_hierarchy",
      "idumb-validate", "idumb-manifest", "idumb-chunker"
    ],
    
    "idumb-high-governance": [
      "task", "idumb-todo",
      "read", "glob", "grep",
      "idumb-state", "idumb-state_read", "idumb-state_anchor",
      "idumb-context", "idumb-config", "idumb-config_read"
    ],
    
    // Tier 2: Executors/Planners
    "idumb-executor": [
      "task", "idumb-todo",
      "read", "glob", "grep",
      "idumb-state", "idumb-state_read",
      "idumb-context", "idumb-config", "idumb-config_read",
      "idumb-todo", "idumb-todo_list",
      "idumb-validate", "idumb-chunker"
    ],
    
    // Tier 3: Researchers/Validators
    "idumb-project-researcher": [
      "idumb-todo",
      "read", "glob", "grep",
      "idumb-state", "idumb-state_read", "idumb-state_anchor",
      "idumb-context", "idumb-config_read",
      "idumb-todo", "idumb-todo_list",
      "idumb-validate", "idumb-chunker"
    ],
    
    // LEAF: Builder - write permissions
    "idumb-builder": [
      "idumb-todo", "todowrite",
      "read", "write", "edit", "bash",
      "filesystem_write_file", "filesystem_edit_file",
      "idumb-state", "idumb-state_anchor", "idumb-state_history",
      "idumb-todo", "idumb-todo_complete", "idumb-todo_update"
    ],
    
    // LEAF: Validator - read-only validation
    "idumb-low-validator": [
      "idumb-todo",
      "read", "glob", "grep", "bash",
      "filesystem_read_file", "filesystem_read_text_file", "filesystem_read_multiple_files",
      "filesystem_list_directory", "filesystem_directory_tree",
      "idumb-state", "idumb-state_read", "idumb-state_anchor",
      "idumb-validate", "idumb-validate_structure", "idumb-validate_schema",
      "idumb-validate_freshness", "idumb-validate_integrationPoints",
      "idumb-config_read", "idumb-todo", "idumb-todo_list",
      "idumb-manifest", "idumb-manifest_drift", "idumb-manifest_conflicts",
      "idumb-chunker", "idumb-chunker_read", "idumb-chunker_validate"
    ]
  }
  
  // For unknown agents, allow all tools
  return toolPermissions[agentRole] || []
}

/**
 * Detect agent role from session
 */
function detectAgentRole(ctx: any, input: any): string | null {
  // Check messages for agent mentions
  const messages = ctx.messages || []
  
  for (const msg of messages) {
    if (msg.role === "system" || msg.role === "assistant") {
      const text = typeof msg.parts === "string" ? msg.parts : msg.parts?.map((p: any) => p.text).join(' ') || ''
      
      if (text.includes("idumb-supreme-coordinator")) return "idumb-supreme-coordinator"
      if (text.includes("idumb-high-governance")) return "idumb-high-governance"
      if (text.includes("idumb-builder")) return "idumb-builder"
      if (text.includes("idumb-low-validator")) return "idumb-low-validator"
    }
  }
  
  return null
}

/**
 * Build violation error message
 */
function buildViolationMessage(agent: string, tool: string): string {
  const delegations: Record<string, { target: string; example: string }> = {
    "idumb-supreme-coordinator": {
      target: "@idumb-high-governance → @idumb-low-validator/@idumb-builder",
      example: `@idumb-high-governance
Task: Coordinate file modification
Sub-delegate to: @idumb-builder
Details: [your specific request]
Constraints: [limitations, MUST-BEFORE rules]
Success criteria: [how to measure completion]
Report format: [expected output structure]
`
    },
    "idumb-high-governance": {
      target: "@idumb-builder",
      example: `@idumb-builder
Task: Modify file [path]
Content: [what to change]
Verify: Read file first, commit after`
    },
    "idumb-builder": {
      target: "You ARE executor - verify first",
      example: `Use 'read' tool first to verify target file, then proceed.`
    },
    "idumb-low-validator": {
      target: "Report to parent, DO NOT modify",
      example: `VALIDATION REPORT:
File: [path]
Issue: [what you found]
Recommendation: Delegate to @idumb-builder for fix`
    }
  }
  
  const info = delegations[agent] || { target: "Check hierarchy", example: "Use idumb-todo to see workflow" }
  
  return `BLOCKED: ${agent} cannot use ${tool}

Role: ${info.example}

Delegate to: ${info.target}

Next: Use idumb-todo, then delegate to appropriate agent.`
}
```

### 10.4 Command Definition Example

**iDumb Init Command:**
```yaml
---
description: "Initialize iDumb governance for this project with bounce-back validation loops."
agent: idumb-supreme-coordinator
---

# Initialize iDumb Governance

You are initializing iDumb governance for this project.

**REMEMBER:** You (supreme-coordinator) have `write: false` and `edit: false`. You MUST delegate all file operations to @idumb-builder.

## INITIALIZATION FLOW

1. **Check for existing setup**
   - Use `glob` to check for `.idumb/` directory
   - Read `.idumb/idumb-brain/state.json` if exists
   - Read `.idumb/idumb-brain/config.json` if exists

2. **Detect project context**
   - Check for `.planning/` directory (planning indicator)
   - Check for `.planning/PROJECT.md` (project definition)
   - Check for `.planning/STATE.md` (state file)
   - Check for `.planning/ROADMAP.md` (roadmap)
   - Check for `PROJECT.md` in root (BMAD indicator)
   - Check for `_bmad-output/` (BMAD output)

3. **Create iDumb governance structure**
   **DELEGATE TO @idumb-builder** to create:
   - `.idumb/idumb-brain/`
   - `.idumb/idumb-brain/history/`
   - `.idumb/idumb-brain/context/`
   - `.idumb/idumb-brain/governance/`
   - `.idumb/idumb-brain/governance/validations/`
   - `.idumb/idumb-brain/anchors/`
   - `.idumb/idumb-brain/sessions/`

4. **Initialize state files**
   **DELEGATE TO @idumb-builder** to create:
   - `.idumb/idumb-brain/state.json` with template:
     ```json
     {
       "version": "0.2.0",
       "initialized": "[ISO timestamp]",
       "framework": "[detected: planning/bmad/both/none]",
       "phase": "init",
       "lastValidation": null,
       "validationCount": 0,
       "anchors": [],
       "history": []
     }
     ```
   - `.idumb/idumb-brain/config.json` with template:
     ```json
     {
       "version": "0.2.0",
       "user": {
         "name": "Developer",
         "language": {
           "communication": "english",
           "documents": "english"
         }
       },
       "governance": {
         "level": "moderate",
         "expertSkeptic": true,
         "autoValidation": true
       },
       "paths": {
         "state": ".idumb/idumb-brain/state.json",
         "brain": ".idumb/idumb-brain/",
         "history": ".idumb/idumb-brain/history/",
         "context": ".idumb/idumb-brain/context/",
         "governance": ".idumb/idumb-brain/governance/",
         "validations": ".idumb/idumb-brain/governance/validations/",
         "anchors": ".idumb/idumb-brain/anchors/",
         "sessions": ".idumb/idumb-brain/sessions/",
         "planning": ".planning/",
         "roadmap": ".planning/ROADMAP.md",
         "planningState": ".planning/STATE.md"
       }
     }
     ```

5. **Validate structure AND planning completeness**
   **DELEGATE TO @idumb-low-validator** to verify:
   - `.idumb/` directory exists
   - `.idumb/idumb-brain/state.json` exists AND is valid JSON
   - `.idumb/idumb-brain/config.json` exists AND is valid JSON
   - At least 1 anchor exists
   - History has at least 1 entry
   - IF planning detected: Check required planning files exist
     - `.planning/PROJECT.md` (REQUIRED for planning)
     - `.planning/STATE.md` (REQUIRED for workflow)
     - `.planning/ROADMAP.md` (REQUIRED for phases)
     - `.planning/config.json` (REQUIRED for settings)

6. **Create initial anchor**
   **DELEGATE TO @idumb-builder** to create:
   - Use `idumb-state_anchor` tool with:
     - Type: checkpoint
     - Content: "iDumb initialized for [project name] - [framework] detected"
     - Priority: high

7. **Record in history**
   **DELEGATE TO @idumb-builder** to create:
   - Use `idumb-state_history` tool with:
     - Action: "governance_init"
     - Result: "pass"
     - Agent: "plugin"

8. **Final integrity check (MANDATORY)**
   **DELEGATE TO @idumb-low-validator** to verify:
   - state.json exists AND valid JSON AND has required fields
   - config.json exists AND valid JSON
   - At least 1 anchor exists
   - History has at least 1 entry
   - IF planning: All 4 required files exist

9. **Present final menu**
   Report status to user with options for:
   - Run /idumb:status to check state anytime
   - /idumb:validate to run validation checks
   - /idumb:new-project to start project planning
   - /idumb:roadmap to create/view roadmap
   - /idumb:map-codebase to analyze existing code

## ⚡ PLANNING INTEGRATION LOGIC (CRITICAL)

### Detect Project Type
Count source files (excluding node_modules, .git):

$SRC_FILES=$(find . -type f \\( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.py" -o -name "*.go" -o -name "*.rs" \\) -not -path "*/node_modules/*" -not -path "*/.git/*" 2>/dev/null | wc -l)
PLANNING_EXISTS=$([ -d ".planning" ] && echo "true" || echo "false")

Determine project type:
if $SRC_FILES > 5 AND $PLANNING_EXISTS == false
  type: brownfield
  action: Run /idumb:map-codebase to analyze existing code structure
elif $SRC_FILES <= 5 AND $PLANNING_EXISTS == false
  type: greenfield
  action: Run /idumb:new-project to create project context and roadmap
else
  type: existing_planning
  action: Sync with existing .planning/ state

## CRITICAL RULES

1. **NEVER create files directly** - You have write: false, edit: false. You MUST delegate all file operations to @idumb-builder.
2. **ALWAYS delegate validation to @idumb-low-validator** - Validation work requires read-only access.
3. **ALWAYS track delegations** - Know who did what, when.
4. **ALWAYS read state first** - Check .idumb/idumb-brain/state.json before acting.
5. **ALWAYS use todoread first** - Check TODOs before any action.
```

---

## 11. Sources & References

### Primary Sources

1. **OpenCode Official Documentation:**
   - Plugins Guide: https://opencode.ai/docs/plugins/
   - Agents Documentation: https://opencode.ai/docs/agents/
   - Commands Documentation: https://opencode.ai/docs/commands/
   - Tools Documentation: https://opencode.ai/docs/tools/
   - Custom Tools: https://opencode.ai/docs/custom-tools/
   - Permissions: https://opencode.ai/docs/permissions/

2. **Community Resources:**
   - OpenCode GitHub Repository: https://github.com/anomalyco/opencode
   - OpenCode Discord: https://opencode.ai/discord/
   - YouTube Tutorials: Darren Builds AI channel
   - Reddit Community: r/opencodeCLI

3. **iDumb Codebase Analysis:**
   - package.json: Project structure
   - template/plugins/idumb-core.ts: Current implementation
   - template/tools/*: Tool implementations
   - template/agents/*: Agent definitions
   - template/commands/*: Command definitions

4. **OpenCode NPM Package:**
   - @opencode-ai/plugin (latest: 1.1.48)
   - 1.6M weekly downloads
   - Dependencies: zod, @opencode-ai/sdk

### Key References

- **Plugin Types:** https://opencode.ai/docs/plugins/#typescript-support
- **Event Types:** https://opencode.ai/docs/plugins/#events
- **Agent Configuration:** https://opencode.ai/docs/agents/
- **Zod Schemas:** https://zod.dev/
- **SDK Documentation:** https://opencode.ai/docs/sdk/

---

## Appendix: Quick Reference

### Event Types Quick Reference

```
Session Events:
  - session.created: New session started
  - session.compacted: Context compressed (inject critical anchors here!)
  - session.deleted: Session removed
  - session.diff: Session diff available
  - session.error: Error in session
  - session.idle: Agent finished
  - session.updated: Session changed
  - session.status: Status update

Tool Events:
  - tool.execute.before: Before tool execution (enforce permissions)
  - tool.execute.after: After tool execution (track, validate)

File Events:
  - file.edited: File modified
  - file.watcher.updated: File watcher triggered

Permission Events:
  - permission.asked: User approval requested
  - permission.replied: User responded to approval

Message Events:
  - message.updated: Message changed
  - message.removed: Message deleted
  - message.part.removed: Message part removed
  - message.part.updated: Message part updated

Command Events:
  - command.executed: Command executed

Installation Events:
  - installation.updated: Installation updated

LSP Events:
  - lsp.client.diagnostics: LSP diagnostics available
  - lsp.updated: LSP updated

Server Events:
  - server.connected: Server connection established

Todo Events:
  - todo.updated: TODO list updated

TUI Events:
  - tui.prompt.append: Prompt appended
  - tui.command.execute: Command executed in TUI
  - tui.toast.show: Toast notification shown
```

### Permission Levels Quick Reference

```
Permission Values:
  - "allow": Execute without prompting
  - "ask": Prompt user before execution
  - "deny": Disable tool entirely

Tool Categories:
  - read: File read operations
  - write: File write/create operations
  - edit: File modification operations
  - bash: Shell command execution
  - glob: File pattern matching
  - grep: Content search
  - task: Agent/task invocation
  - webfetch: URL fetching
  - skill: Agent skill loading

Special Patterns:
  - "*": Wildcard (matches everything)
  - "git *": Matches git commands
  - "npm test *": Matches npm test commands
  - Last matching rule wins in config
```

---

**END OF RESEARCH DOCUMENT**
---
