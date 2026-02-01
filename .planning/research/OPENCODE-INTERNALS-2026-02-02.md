# OpenCode Internals Research

**Project:** iDumb Meta-Framework Plugin
**Researched:** 2026-02-02
**Source Confidence:** HIGH (Official documentation: opencode.ai/docs)

---

## Executive Summary

OpenCode is an open-source, provider-agnostic AI coding agent platform with a TUI/CLI architecture. It provides extensive extensibility through plugins, agents, commands, tools, and skills. This research covers all integration points relevant to the iDumb meta-framework wrapper.

---

## Core Architecture

### Configuration Hierarchy

| Level | Location | Priority | Use Case |
|-------|----------|----------|----------|
| Global | `~/.config/opencode/` | Lowest | User-wide defaults |
| Project | `opencode.json` or `.opencode/` | Higher | Project-specific |
| Session | Runtime | Highest | Dynamic per-session |

**Key Files:**
- `opencode.json` - Main configuration (JSON)
- `.opencode/agents/*.md` - Agent definitions (Markdown)
- `.opencode/commands/*.md` - Custom commands (Markdown)
- `.opencode/tools/*.ts` - Custom tools (TypeScript/JavaScript)
- `.opencode/plugins/*.ts` - Plugin files (TypeScript/JavaScript)
- `.opencode/skills/*/SKILL.md` - Skill definitions

---

## Agents

### Types

| Type | Mode Value | Description | User Interaction |
|------|------------|-------------|------------------|
| **Primary** | `primary` | Main conversation agents | Tab key to switch |
| **Subagent** | `subagent` | Specialized assistants invoked by primary agents | `@mention` or auto-invoked |
| **All** | `all` (default) | Can act as both primary and subagent | Both methods |

### Built-in Agents

| Agent | Mode | Tools | Purpose |
|-------|------|-------|---------|
| **Build** | `primary` | All enabled | Default dev agent, full access |
| **Plan** | `primary` | Writes restricted | Analysis/planning, read-only |
| **General** | `subagent` | Full (except todo) | Multi-step research tasks |
| **Explore** | `subagent` | Read-only | Fast codebase exploration |

### Agent Configuration Options

```yaml
# Required
description: "Brief description of what agent does"

# Optional
mode: primary | subagent | all
model: "provider/model-id"
prompt: "{file:./prompts/custom.txt}"
temperature: 0.0 - 1.0
steps: <number>  # Max agentic iterations
hidden: true  # Hide from @ autocomplete (subagents only)
disable: true  # Disable the agent

# Tool Control
tools:
  write: true | false
  edit: true | false
  bash: true | false
  skill: true | false
  mymcp_*: false  # Wildcard patterns supported

# Permission Control
permission:
  edit: allow | ask | deny
  bash:
    "*": ask
    "git diff": allow
    "git log*": allow
  webfetch: deny
  skill:
    "*": allow
    "internal-*": deny
  task:
    "*": deny
    "my-helper-*": allow
```

### Session & Child Navigation

- Primary agents can spawn child sessions via Task tool
- Navigate: `<Leader>+Right/Left` cycles through parent/child sessions
- Subagent work happens in isolated context windows

---

## Commands

### Purpose
User-facing slash commands (`/command-name`) that execute predefined prompts.

### Location
- Global: `~/.config/opencode/commands/*.md`
- Project: `.opencode/commands/*.md`

### Configuration

```yaml
---
description: "What command does"
agent: build | plan | <custom-agent>
model: "provider/model-id"  # Optional override
subtask: true  # Force subagent execution
---

Command template with $ARGUMENTS placeholder.
Supports $1, $2, $3 for positional args.
Include file with @src/file.ts
Include shell output with !`git status`
```

### Key Features
- `$ARGUMENTS` - All arguments passed
- `$1, $2, $3...` - Positional arguments
- `@path/to/file` - File content inclusion
- `` !`command` `` - Shell output injection

---

## Tools

### Built-in Tools
- `read`, `write`, `edit` - File operations
- `bash` - Shell commands
- `glob`, `grep` - Search operations
- `task` - Spawn subagents
- `skill` - Load skills on-demand
- `todo` - Manage task lists
- `webfetch` - Fetch web content

### Custom Tools

**Location:** `.opencode/tools/*.ts` or `~/.config/opencode/tools/*.ts`

**Structure:**
```typescript
import { tool } from "@opencode-ai/plugin"

export default tool({
  description: "Tool description",
  args: {
    param: tool.schema.string().describe("Parameter description"),
    count: tool.schema.number().describe("Number parameter"),
  },
  async execute(args, context) {
    const { agent, sessionID, messageID, directory, worktree } = context
    // Implementation
    return "result"
  },
})
```

**Context Object:**
- `agent` - Current agent name
- `sessionID` - Active session identifier
- `messageID` - Current message ID
- `directory` - Session working directory
- `worktree` - Git worktree root

**Multiple Tools Per File:**
- Named exports create tools as `filename_exportname`
- Default export creates tool as `filename`

---

## Skills

### Purpose
On-demand reusable instructions loaded via the `skill` tool. Agents see skill names/descriptions and can load full content when needed.

### Location
- `.opencode/skills/<name>/SKILL.md`
- `~/.config/opencode/skills/<name>/SKILL.md`
- `.claude/skills/<name>/SKILL.md` (Claude-compatible)
- `~/.claude/skills/<name>/SKILL.md` (Claude-compatible)

### Format

```yaml
---
name: skill-name  # Required: 1-64 chars, lowercase alphanumeric with hyphens
description: "What this skill does"  # Required: 1-1024 chars
license: MIT  # Optional
compatibility: opencode  # Optional
metadata:  # Optional: string-to-string map
  audience: maintainers
  workflow: github
---

## Skill Content

Full instructions for the agent...
```

### Name Validation Rules
- 1-64 characters
- Lowercase alphanumeric with single hyphen separators
- No start/end with `-`, no `--`
- Must match directory name

### Permissions
```json
{
  "permission": {
    "skill": {
      "*": "allow",
      "internal-*": "deny",
      "experimental-*": "ask"
    }
  }
}
```

---

## Plugins

### Purpose
Extend OpenCode by hooking into events and customizing behavior.

### Location
- Local files: `.opencode/plugins/*.ts`
- Global: `~/.config/opencode/plugins/*.ts`
- npm packages: Configured in `opencode.json`

### Load Order
1. Global config (`~/.config/opencode/opencode.json`)
2. Project config (`opencode.json`)
3. Global plugin directory
4. Project plugin directory

### Plugin Structure

```typescript
import type { Plugin } from "@opencode-ai/plugin"

export const MyPlugin: Plugin = async ({ 
  project,   // Project information
  directory, // Working directory
  worktree,  // Git worktree path
  client,    // OpenCode SDK client
  $,         // Bun shell API
}) => {
  console.log("Plugin initialized!")
  
  return {
    // Event subscriptions and hooks
  }
}
```

### Available Events

**Session Events:**
- `session.created`
- `session.compacted`
- `session.deleted`
- `session.diff`
- `session.error`
- `session.idle`
- `session.status`
- `session.updated`

**Tool Events:**
- `tool.execute.before` - Intercept before tool runs
- `tool.execute.after` - React after tool completes

**Message Events:**
- `message.part.removed`
- `message.part.updated`
- `message.removed`
- `message.updated`

**File Events:**
- `file.edited`
- `file.watcher.updated`

**Other Events:**
- `command.executed`
- `permission.asked`
- `permission.replied`
- `todo.updated`
- `lsp.client.diagnostics`
- `lsp.updated`
- `installation.updated`
- `server.connected`
- `tui.prompt.append`
- `tui.command.execute`
- `tui.toast.show`

### Compaction Hook (Experimental)

```typescript
export const CompactionPlugin: Plugin = async (ctx) => {
  return {
    "experimental.session.compacting": async (input, output) => {
      // Inject additional context
      output.context.push(`## Critical State\n- Current phase: 2\n- Files in progress: ...`)
      
      // Or replace entire prompt
      output.prompt = `Custom compaction prompt...`
    },
  }
}
```

### Custom Tools via Plugin

```typescript
import { type Plugin, tool } from "@opencode-ai/plugin"

export const CustomToolsPlugin: Plugin = async (ctx) => {
  return {
    tool: {
      mytool: tool({
        description: "Custom tool description",
        args: {
          foo: tool.schema.string(),
        },
        async execute(args, context) {
          return `Result: ${args.foo}`
        },
      }),
    },
  }
}
```

### Dependencies

Local plugins can use external npm packages:

```json
// .opencode/package.json
{
  "dependencies": {
    "shescape": "^2.1.0"
  }
}
```

OpenCode runs `bun install` at startup.

---

## Plugin Distribution via npm

### Installation Methods

**From npm:**
```json
// opencode.json
{
  "plugin": ["opencode-helicone-session", "opencode-wakatime", "@my-org/custom-plugin"]
}
```

**How It Works:**
- npm plugins auto-installed via Bun at startup
- Cached in `~/.cache/opencode/node_modules/`
- Both regular and scoped packages supported

---

## Integration Points for iDumb

### Recommended Approach

| Component | Purpose | Implementation |
|-----------|---------|----------------|
| **Plugin (npm)** | Entry point, initialization | npm package in `plugin` config |
| **Custom Commands** | User-facing workflows | Markdown in `commands/gsd/` |
| **Custom Agents** | Specialized assistants | Markdown in `agents/` |
| **Custom Tools** | Agent capabilities | TypeScript in `tools/` |
| **Skills** | On-demand instructions | SKILL.md in `skills/` |
| **Event Hooks** | State management, validation | Plugin event subscriptions |

### Critical Hooks for Governance

1. **`session.created`** - Initialize state, load context
2. **`session.compacting`** - Preserve critical state across compaction
3. **`tool.execute.before`** - Validate actions, inject context
4. **`tool.execute.after`** - Track changes, update state
5. **`session.idle`** - Checkpoint, cleanup

### Configuration Pattern

```json
// opencode.json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["@idumb/opencode-plugin"],
  "agent": {
    "build": {
      "prompt": "{file:./.idumb/prompts/build.txt}"
    }
  }
}
```

---

## Key Insights

### What Works Well
1. **Markdown-based configuration** - Easy to generate/modify programmatically
2. **Event-driven plugins** - Rich hooks for all lifecycle events
3. **Session/compaction hooks** - Can preserve state across context limits
4. **Tool context** - Full access to session state in tool execution
5. **Parallel subagent execution** - Fresh contexts for heavy work

### Limitations to Consider
1. **No direct context injection** - Can't prepend to every LLM call automatically
2. **Compaction is experimental** - May change
3. **No prompt manipulation** - Can't modify system prompts at runtime (except via agent config)
4. **TUI background exposure** - Plugins must NOT interfere with TUI rendering

### Verified Facts (HIGH Confidence)
- Agents support `mode: primary | subagent | all`
- `hidden: true` hides subagent from `@` menu but allows Task tool invocation
- Commands support `subtask: true` to force subagent execution
- Skills are loaded on-demand via `skill` tool, not always present
- Compaction hook can inject context via `output.context.push()`
- Custom tools receive full session context

---

## Sources

- https://opencode.ai/docs/plugins/ (Jan 31, 2026)
- https://opencode.ai/docs/agents/ (Jan 31, 2026)
- https://opencode.ai/docs/commands/ (Jan 31, 2026)
- https://opencode.ai/docs/custom-tools/ (Jan 31, 2026)
- https://opencode.ai/docs/skills/ (Jan 31, 2026)
