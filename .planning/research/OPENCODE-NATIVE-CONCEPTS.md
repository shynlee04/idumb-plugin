# OpenCode Native Concepts - Comprehensive Research

**Research Date:** 2026-02-02  
**Confidence Level:** HIGH (based on official OpenCode documentation and authoritative sources)

## Executive Summary

This document provides a comprehensive analysis of OpenCode's native concepts that are critical for iDumb v2's "Less for More" architecture. OpenCode provides a sophisticated multi-agent system with granular permissions, lazy-loaded skills, and a hierarchical agent delegation model that can be leveraged to build efficient, context-aware development workflows.

Key architectural insights for iDumb v2:
- **Agent Modes**: `primary`, `subagent`, and `all` modes enable clear separation of concerns
- **Lazy Loading**: Skills are discovered but not loaded until explicitly requested (opencode-skillful pattern)
- **Granular Permissions**: Tool-level, agent-level, and command-level permissions with pattern matching
- **Hierarchical Delegation**: Subagents can spawn child sessions with independent contexts
- **Command System**: Custom commands can trigger specific agents or subagents with predefined prompts

---

## 1. Native Tools

### 1.1 Built-in Tools Reference

OpenCode provides 14 built-in tools for AI agents to interact with the codebase:

| Tool | Purpose | Permission Key | Notes |
|------|---------|----------------|-------|
| `bash` | Execute shell commands | `bash` | Full terminal access |
| `edit` | Modify existing files | `edit` | Exact string replacement |
| `write` | Create/overwrite files | `edit` | Controlled by `edit` permission |
| `read` | Read file contents | `read` | Supports line range specification |
| `grep` | Search file contents | `grep` | Full regex support, uses ripgrep |
| `glob` | Find files by pattern | `glob` | Glob patterns like `**/*.ts` |
| `list` | List directory contents | `list` | Accepts glob patterns |
| `lsp` | LSP server queries | `lsp` | Requires `OPENCODE_EXPERIMENTAL_LSP_TOOL=true` |
| `patch` | Apply patch files | `edit` | Controlled by `edit` permission |
| `skill` | Load SKILL.md files | `skill` | Native skill loading |
| `todowrite` | Manage todo lists | `todowrite` | Disabled for subagents by default |
| `todoread` | Read todo lists | `todoread` | Disabled for subagents by default |
| `webfetch` | Fetch web content | `webfetch` | HTTP/HTTPS requests |
| `question` | Ask user questions | `question` | Interactive user prompts |

### 1.2 Tool Permissions and Restrictions

**Permission Levels:**
- `"allow"` - Run without approval
- `"ask"` - Prompt for approval
- `"deny"` - Block the action

**Configuration Example:**
```json
{
  "$schema": "https://opencode.ai/config.json",
  "permission": {
    "*": "ask",
    "bash": "allow",
    "edit": "deny",
    "read": "allow",
    "webfetch": "allow"
  }
}
```

**Granular Bash Permissions:**
```json
{
  "permission": {
    "bash": {
      "*": "ask",
      "git status *": "allow",
      "git log*": "allow",
      "grep *": "allow",
      "rm *": "deny"
    }
  }
}
```

**Key Insight:** Rules are evaluated with **last matching rule wins**. Put catch-all `*` first, then specific rules after.

### 1.3 Tool Registration and Calling

Tools are registered automatically by OpenCode. The LLM calls tools via function calling:

```typescript
// Tool call format (conceptual)
{
  "tool": "read",
  "parameters": {
    "filePath": "/path/to/file.ts"
  }
}
```

**Tool Call Flow:**
1. LLM generates tool call request
2. OpenCode validates permission for the tool
3. If permission is `ask`, prompt user for approval
4. Execute tool
5. Return result to LLM

**Special Permission Notes:**
- `write`, `patch` are controlled by `edit` permission
- `edit` permission covers all file modifications: `edit`, `write`, `patch`, `multiedit`
- `doom_loop` triggers when same tool call repeats 3 times with identical input

### 1.4 Custom Tools

Custom tools can be defined in `opencode.json`:

```json
{
  "tools": {
    "myCustomTool": {
      "description": "Description of what this tool does",
      "parameters": {
        "type": "object",
        "properties": {
          "param1": { "type": "string" }
        }
      }
    }
  }
}
```

---

## 2. Agents System

### 2.1 Agent Modes

OpenCode has three agent modes:

| Mode | Description | Usage |
|------|-------------|-------|
| `primary` | Main assistants users interact with directly | Switched via Tab key |
| `subagent` | Specialized assistants invoked for specific tasks | Called via `@mention` or Task tool |
| `all` | Can function as both primary and subagent | Default if no mode specified |

### 2.2 Built-in Agents

**Primary Agents:**

| Agent | Mode | Description | Default Tools |
|-------|------|-------------|---------------|
| `build` | primary | Default development agent | All tools enabled |
| `plan` | primary | Restricted planning agent | File edits: `ask`, Bash: `ask` |

**Subagents:**

| Agent | Mode | Description | Tool Access |
|-------|------|-------------|-------------|
| `general` | subagent | General-purpose multi-step tasks | Full (except todo) |
| `explore` | subagent | Read-only codebase exploration | Read-only |

### 2.3 Agent Configuration

**JSON Configuration:**
```json
{
  "$schema": "https://opencode.ai/config.json",
  "agent": {
    "build": {
      "mode": "primary",
      "model": "anthropic/claude-sonnet-4-20250514",
      "prompt": "{file:./prompts/build.txt}",
      "temperature": 0.3,
      "steps": 50,
      "tools": {
        "write": true,
        "edit": true,
        "bash": true
      },
      "permission": {
        "edit": "ask",
        "bash": {
          "*": "ask",
          "git *": "allow"
        }
      },
      "hidden": false,
      "color": "#ff6b6b"
    }
  }
}
```

**Markdown Configuration (Agent Files):**

Location options:
- Global: `~/.config/opencode/agents/<name>.md`
- Per-project: `.opencode/agents/<name>.md`

```markdown
---
description: Reviews code for best practices
mode: subagent
model: anthropic/claude-sonnet-4-20250514
temperature: 0.1
tools:
  write: false
  edit: false
  bash: false
permission:
  skill:
    "documents-*": "allow"
hidden: false
color: "#4CAF50"
---
You are a code reviewer. Focus on:
- Code quality and best practices
- Potential bugs and edge cases
- Performance implications
- Security considerations

Provide constructive feedback without making direct changes.
```

### 2.4 Agent Options Reference

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `mode` | string | `primary`, `subagent`, or `all` | `all` |
| `description` | string | What the agent does (required) | - |
| `prompt` | string | System prompt or `{file:path}` reference | - |
| `model` | string | Model ID (`provider/model-id`) | Global config model |
| `temperature` | number | 0.0-1.0 creativity control | Model-specific (0 for most) |
| `top_p` | number | 0.0-1.0 response diversity | - |
| `steps` | number | Max agentic iterations | Unlimited |
| `tools` | object | Tool enable/disable map | All enabled |
| `permission` | object | Tool-specific permissions | Global permissions |
| `hidden` | boolean | Hide from `@` autocomplete | `false` |
| `color` | string | Hex color for UI | - |
| `disable` | boolean | Disable the agent | `false` |

### 2.5 Agent Spawning and Management

**Invoking Subagents:**

1. **Automatic Invocation:**
   - Primary agents automatically invoke subagents based on their descriptions
   - Uses Task tool internally

2. **Manual Invocation (@mention):**
   ```
   @general help me search for this function
   @explore find all React components
   @security-auditor review this code
   ```

3. **Task Tool Invocation:**
   ```typescript
   // Agents can spawn subagents via Task tool
   {
     "tool": "task",
     "parameters": {
       "agent": "explore",
       "prompt": "Search for auth-related code"
     }
   }
   ```

**Session Navigation:**
- `<Leader>+Right` / `session_child_cycle` - Forward: parent → child1 → child2 → parent
- `<Leader>+Left` / `session_child_cycle_reverse` - Backward: parent ← child1 ← child2 ← parent

### 2.6 Agent Hierarchy and Delegation

```
Parent Session (Primary Agent)
    │
    ├── Child Session 1 (Subagent: @explore)
    │       └── Grandchild Session (Subagent: @general)
    │
    ├── Child Session 2 (Subagent: @security-auditor)
    │
    └── Child Session 3 (Subagent: @code-reviewer)
```

**Delegation Patterns:**
- **Sequential:** Parent → Child1 (wait) → Child2 (wait) → Parent
- **Parallel:** Parent spawns multiple children simultaneously
- **Nested:** Child can spawn its own children for complex workflows

**Context Isolation:**
- Each subagent session has independent context
- Child sessions don't pollute parent context
- Results must be explicitly returned/synthesized

### 2.7 Task Permissions

Control which subagents an agent can invoke:

```json
{
  "agent": {
    "orchestrator": {
      "mode": "primary",
      "permission": {
        "task": {
          "*": "deny",
          "orchestrator-*": "allow",
          "code-reviewer": "ask"
        }
      }
    }
  }
}
```

**Key Rules:**
- When set to `deny`, subagent is removed from Task tool description entirely
- Last matching rule wins
- Users can always invoke any subagent directly via `@` menu, even if task permissions deny it

---

## 3. Skills System

### 3.1 Native OpenCode Skills

**Skill Discovery Locations:**
1. `.opencode/skills/<name>/SKILL.md` - Project-local
2. `~/.config/opencode/skills/<name>/SKILL.md` - Global
3. `.claude/skills/<name>/SKILL.md` - Claude-compatible (project)
4. `~/.claude/skills/<name>/SKILL.md` - Claude-compatible (global)

**SKILL.md Format:**
```markdown
---
name: git-release
description: Create consistent releases and changelogs
license: MIT
compatibility: opencode
metadata:
  audience: maintainers
  workflow: github
---

## What I do
- Draft release notes from merged PRs
- Propose a version bump
- Provide a copy-pasteable `gh release create` command

## When to use me
Use this when you are preparing a tagged release.
```

**Name Validation Rules:**
- 1-64 characters
- Lowercase alphanumeric with single hyphens
- Cannot start/end with `-`
- No consecutive `--`
- Must match directory name
- Regex: `^[a-z0-9]+(-[a-z0-9]+)*$`

### 3.2 Native Skill Tool

The built-in `skill` tool loads skills into conversation:

```typescript
// Available skills are listed in tool description:
<available_skills>
  <skill>
    <name>git-release</name>
    <description>Create consistent releases and changelogs</description>
  </skill>
</available_skills>

// Agent calls:
skill({ name: "git-release" })
```

**Skill Permissions:**
```json
{
  "permission": {
    "skill": {
      "*": "allow",
      "pr-review": "allow",
      "internal-*": "deny",
      "experimental-*": "ask"
    }
  }
}
```

### 3.3 opencode-skillful Plugin

**Key Differentiators from Native Skills:**

| Aspect | Native OpenCode | opencode-skillful |
|--------|-----------------|-------------------|
| Loading | All skills pre-loaded | Lazy loading (on-demand) |
| Memory | All skills consume tokens | Only loaded skills consume tokens |
| Format | Fixed (markdown) | Configurable (XML/JSON/Markdown) |
| Discovery | Limited built-in set | Extensible custom directories |
| Resources | Direct filesystem | Pre-indexed (security-first) |

**Plugin Tools:**

| Tool | Purpose |
|------|---------|
| `skill_find` | Discover skills by keyword search |
| `skill_use` | Load skills into chat context |
| `skill_resource` | Read specific files from skills |

**Installation:**
```json
{
  "plugins": ["@zenobius/opencode-skillful"]
}
```

### 3.4 Skill Discovery Mechanism (opencode-skillful)

**Search Query Syntax:**
```
skill_find "*"                    # List all skills
skill_find "git commit"           # AND logic (all terms must match)
skill_find "testing -performance" # Exclude performance	skill_find "experts"              # Path prefix matching
skill_find "superpowers/writing"  # Nested path matching
```

**Skill Identifier Generation:**
```
skills/
  experts/
    ai/
      agentic-engineer/     → experts_ai_agentic_engineer
  superpowers/
    writing/
      code-review/          → superpowers_writing_code_review
```

**Directory Structure:**
```
my-skill/
  SKILL.md                 # Required
  references/              # Documentation
    guide.md
    examples.md
  assets/                  # Templates, images
    template.html
    logo.png
  scripts/                 # Executable scripts
    setup.sh
    generate.py
```

### 3.5 Lazy Loading and Injection

**Two-Phase Initialization:**

```
PHASE 1: SYNCHRONOUS CREATION
├─ Plugin loads configuration
├─ createApi() called (factory, NOT initialized)
└─ Tools registered immediately

PHASE 2: ASYNCHRONOUS DISCOVERY (Background)
├─ registry.initialise() called
│  ├─ Scan base paths for SKILL.md files
│  ├─ Parse YAML frontmatter
│  ├─ Pre-index all resources
│  └─ Set ready state
│
└─ WHY: Prevents path traversal attacks

PHASE 3: TOOL EXECUTION
├─ User calls: skill_find("git")
├─ Tool waits: await registry.ready.whenReady()
├─ Search registry
└─ Return results
```

**Silent Injection Pattern:**
- Skills inject as user messages
- Persist in conversation history
- NoReply pattern (no immediate AI response)

### 3.6 Skill vs Agent Relationship

| Skill | Agent |
|-------|-------|
| Static instructions (SKILL.md) | Dynamic runtime entity |
| Loaded into context on-demand | Spawned as separate session |
| No independent execution | Has tool access and can execute |
| Provides knowledge/patterns | Performs actions |
| Can be used by any agent | Has specific permissions |

**Relationship:**
- Agents can load skills to augment their capabilities
- Skills provide domain knowledge without spawning new agents
- Multiple agents can share the same skill
- Skills are "libraries of knowledge", agents are "workers"

---

## 4. Commands System

### 4.1 Built-in Commands

OpenCode includes built-in commands accessible via `/`:

| Command | Purpose |
|---------|---------|
| `/init` | Initialize project |
| `/undo` | Undo last action |
| `/redo` | Redo last action |
| `/share` | Share session |
| `/help` | Show help |

### 4.2 Custom Commands

**Markdown Definition:**

Location:
- Global: `~/.config/opencode/commands/<name>.md`
- Per-project: `.opencode/commands/<name>.md`

```markdown
---
description: Run tests with coverage
agent: build
model: anthropic/claude-3-5-sonnet-20241022
subtask: false
---
Run the full test suite with coverage report and show any failures.
Focus on the failing tests and suggest fixes.
```

**JSON Configuration:**
```json
{
  "$schema": "https://opencode.ai/config.json",
  "command": {
    "test": {
      "template": "Run the full test suite with coverage...",
      "description": "Run tests with coverage",
      "agent": "build",
      "model": "anthropic/claude-3-5-sonnet-20241022",
      "subtask": false
    }
  }
}
```

### 4.3 Command Options

| Option | Type | Description | Required |
|--------|------|-------------|----------|
| `template` | string | Prompt sent to LLM | Yes |
| `description` | string | Description shown in TUI | Yes |
| `agent` | string | Agent to execute command | No (defaults to current) |
| `model` | string | Override model for command | No |
| `subtask` | boolean | Force subagent invocation | No (default: false) |

### 4.4 Prompt Templates

**Arguments:**
```markdown
---
description: Create a new component
---
Create a new React component named $ARGUMENTS with TypeScript support.
```

Usage: `/component Button` → `$ARGUMENTS` = `Button`

**Positional Parameters:**
```markdown
---
description: Create a file with content
---
Create a file named $1 in the directory $2 with content: $3
```

Usage: `/create-file config.json src '{ "key": "value" }'`

**Shell Output Injection:**
```markdown
---
description: Analyze test coverage
---
Here are the current test results:
!`npm test`

Based on these results, suggest improvements.
```

**File References:**
```markdown
---
description: Review component
---
Review the component in @src/components/Button.tsx.
Check for performance issues.
```

### 4.5 How Commands Invoke Agents

**Execution Flow:**
```
User types: /test
    ↓
Command resolver finds: .opencode/commands/test.md
    ↓
Parse template with substitutions
    ↓
Determine target agent:
    - If `agent` specified → use that agent
    - If `subtask: true` → spawn as subagent
    - Otherwise → use current agent
    ↓
Execute with resolved model and prompt
```

**Subagent Forcing:**
```json
{
  "command": {
    "analyze": {
      "template": "Analyze this codebase...",
      "subtask": true  // Forces subagent invocation
    }
  }
}
```

### 4.6 Command Overrides

Custom commands can override built-in commands:

```markdown
---
description: Custom help command
---
Show my custom help information...
```

Save as `.opencode/commands/help.md` → overrides `/help`

---

## 5. Permissions System

### 5.1 Granular Permission Architecture

**Three Permission Levels:**

```
┌─────────────────────────────────────────┐
│  Level 1: Global Permissions            │
│  (applies to all agents)                │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│  Level 2: Agent-Specific Permissions    │
│  (overrides global for specific agent)  │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│  Level 3: Tool Input-Level Permissions  │
│  (granular based on command/path/args)  │
└─────────────────────────────────────────┘
```

### 5.2 Available Permissions

| Permission | Matches | Granular |
|------------|---------|----------|
| `read` | File path | Yes |
| `edit` | File path | Yes |
| `glob` | Glob pattern | Yes |
| `grep` | Regex pattern | Yes |
| `list` | Directory path | Yes |
| `bash` | Parsed command | Yes |
| `task` | Subagent type | Yes |
| `skill` | Skill name | Yes |
| `lsp` | LSP operation | No |
| `todoread` | - | No |
| `todowrite` | - | No |
| `webfetch` | URL | Yes |
| `websearch` | Query | Yes |
| `codesearch` | Query | Yes |
| `external_directory` | Path | Yes |
| `doom_loop` | Repeated calls | No |

### 5.3 Tool-Level Permissions

**Basic:**
```json
{
  "permission": {
    "edit": "deny",
    "bash": "ask",
    "read": "allow"
  }
}
```

**Granular (Object Syntax):**
```json
{
  "permission": {
    "bash": {
      "*": "ask",
      "git status *": "allow",
      "git log*": "allow",
      "git commit *": "ask",
      "git push *": "deny",
      "grep *": "allow"
    },
    "edit": {
      "*": "deny",
      "packages/web/src/content/docs/*.mdx": "allow"
    }
  }
}
```

### 5.4 Agent-Level Permissions

**Override global permissions per agent:**
```json
{
  "permission": {
    "bash": { "*": "ask" }
  },
  "agent": {
    "build": {
      "permission": {
        "bash": { "*": "allow" }
      }
    },
    "plan": {
      "permission": {
        "edit": "deny",
        "bash": { "*": "ask", "git status *": "allow" }
      }
    }
  }
}
```

**Markdown Agent Permissions:**
```markdown
---
description: Code review without edits
mode: subagent
permission:
  edit: deny
  bash: ask
  webfetch: deny
---
Only analyze code and suggest changes.
```

### 5.5 Permission Inheritance

**Resolution Order:**
1. Default permissions (most permissive)
2. Global `permission` config
3. Agent-specific `permission` config
4. Most specific rule wins (last matching rule)

**Wildcard Matching:**
- `*` - matches zero or more characters
- `?` - matches exactly one character
- All other characters match literally

**Example Resolution:**
```json
{
  "permission": {
    "bash": {
      "*": "ask",           // ← Rule 1: catch-all
      "git status *": "allow", // ← Rule 2: specific
      "git push *": "deny"    // ← Rule 3: most specific
    }
  }
}
```

For `git push origin main`:
1. Matches `*` → `ask`
2. Matches `git status *` → no
3. Matches `git push *` → `deny` ✓ (last match wins)

### 5.6 External Directory Permissions

Allow access outside working directory:

```json
{
  "permission": {
    "external_directory": {
      "~/projects/personal/**": "allow"
    },
    "edit": {
      "~/projects/personal/**": "deny"  // Read-only
    }
  }
}
```

**Home Directory Expansion:**
- `~/projects/*` → `/Users/username/projects/*`
- `$HOME/projects/*` → `/Users/username/projects/*`

### 5.7 Permission Defaults

If not specified:

| Permission | Default |
|------------|---------|
| Most tools | `"allow"` |
| `doom_loop` | `"ask"` |
| `external_directory` | `"ask"` |
| `.env` files | `"deny"` |

**Built-in .env Protection:**
```json
{
  "permission": {
    "read": {
      "*": "allow",
      "*.env": "deny",
      "*.env.*": "deny",
      "*.env.example": "allow"
    }
  }
}
```

---

## 6. Architecture Patterns for iDumb v2

### 6.1 "Less for More" Design Principles

Based on OpenCode native concepts, iDumb v2 can leverage:

1. **Lazy Loading:** Only load context when needed (skill_use pattern)
2. **Context Isolation:** Subagents maintain separate contexts
3. **Granular Permissions:** Fine-tune what each component can do
4. **Hierarchical Delegation:** Parent → Child → Grandchild workflows
5. **Permission Inheritance:** Global → Agent → Specific overrides

### 6.2 Recommended iDumb v2 Architecture

```
iDumb Orchestrator (Primary Agent)
    │
    ├── Research Subagents
    │   ├── @context-analyzer
    │   ├── @pattern-detector
    │   └── @dependency-mapper
    │
    ├── Execution Subagents
    │   ├── @code-generator
    │   ├── @test-writer
    │   └── @refactoring-engine
    │
    └── Validation Subagents
        ├── @quality-checker
        ├── @security-auditor
        └── @consistency-validator
```

### 6.3 Skill Organization

```
.opencode/skills/
  idumb/
    governance/
      delegation-patterns/
      validation-checks/
    contexts/
      project-analysis/
      architecture-review/
    workflows/
      research-to-code/
      review-to-refactor/
```

### 6.4 Permission Strategy

```json
{
  "agent": {
    "idumb-orchestrator": {
      "mode": "primary",
      "permission": {
        "task": {
          "idumb-*": "allow",
          "research-*": "allow"
        },
        "skill": {
          "idumb-*": "allow"
        }
      }
    },
    "idumb-code-generator": {
      "mode": "subagent",
      "hidden": true,
      "tools": {
        "write": true,
        "edit": true,
        "bash": false
      }
    }
  }
}
```

---

## 7. Implementation Recommendations

### 7.1 For iDumb v2 Core

1. **Use `hidden: true` subagents** for internal workflows that shouldn't be user-visible
2. **Implement lazy skill loading** using opencode-skillful patterns
3. **Create agent hierarchy** with clear parent-child relationships
4. **Use granular permissions** to enforce governance rules

### 7.2 For Skill Development

1. **Follow SKILL.md specification** from Anthropic
2. **Include clear `when to use` sections** for better agent selection
3. **Organize skills hierarchically** by domain/function
4. **Use references/ for documentation**, assets/ for templates

### 7.3 For Command Design

1. **Create project-specific commands** for common iDumb workflows
2. **Use `subtask: true`** for commands that shouldn't pollute main context
3. **Include shell output** (`!`command`) for dynamic context
4. **Use positional parameters** for flexible argument handling

---

## 8. Sources and References

### Official Documentation
- https://opencode.ai/docs/tools/ - Tool configuration and permissions
- https://opencode.ai/docs/agents/ - Agent modes and configuration
- https://opencode.ai/docs/commands/ - Custom commands
- https://opencode.ai/docs/permissions/ - Permission system
- https://opencode.ai/docs/skills/ - Native skills system

### Community/Plugin Resources
- https://github.com/zenobi-us/opencode-skillful - Lazy-loading skills plugin
- https://github.com/anthropics/skills - Anthropic Agent Skills specification

### Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Native Tools | HIGH | Official documentation, verified |
| Agents System | HIGH | Official documentation, comprehensive |
| Skills | HIGH | Both native and skillful plugin documented |
| Commands | HIGH | Official documentation |
| Permissions | HIGH | Official documentation with examples |

---

## RESEARCH COMPLETE

This comprehensive analysis provides the foundation for iDumb v2's architecture. All OpenCode native concepts have been documented with practical examples and implementation recommendations.

**Key Takeaway:** OpenCode's permission system, agent hierarchy, and lazy-loading skills provide exactly the primitives needed for a sophisticated "Less for More" governance framework.
