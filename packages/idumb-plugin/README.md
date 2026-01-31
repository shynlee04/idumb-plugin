# @idumb/opencode-plugin

> 🧠 **iDumb Meta-Framework Plugin** - Context manipulation, governance enforcement, and agent orchestration for OpenCode

[![npm version](https://img.shields.io/npm/v/@idumb/opencode-plugin.svg)](https://www.npmjs.com/package/@idumb/opencode-plugin)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## What is iDumb?

iDumb is a meta-framework plugin that enhances OpenCode with:

- **🎯 Zero-Turn Agent Priming** - Inject governance context before first response
- **🔒 SACRED Turn-1 Anchoring** - Preserve original intent through compaction
- **🎨 Agent-Specific Context** - Load role-based instructions per agent
- **🔗 Delegation Interception** - Inject context into child agent sessions
- **✅ Completion Validation** - Enforce verification before task completion
- **📊 State Persistence** - Track sessions, anchors, and context across restarts

## Installation

### Option 1: From npm (when published)

```bash
npm install @idumb/opencode-plugin
# or
pnpm add @idumb/opencode-plugin
# or
bun add @idumb/opencode-plugin
```

Then add to your OpenCode config:

```yaml
# .opencode/config.yaml
plugins:
  - "@idumb/opencode-plugin"
```

### Option 2: Local installation

```bash
# Clone and install
git clone https://github.com/shynlee04/idumb-plugin.git
cd idumb-plugin
bun install
bun run build

# Add to your project's .opencode/plugins/
cp -r dist/* /path/to/your/project/.opencode/plugins/
```

### Option 3: Direct from GitHub

```yaml
# .opencode/config.yaml
plugins:
  - "github:shynlee04/idumb-plugin"
```

## Quick Start

### 1. Initialize iDumb in your project

```bash
# Create the .idumb directory structure
mkdir -p .idumb/contexts
```

### 2. Create agent context files (optional)

```markdown
<!-- .idumb/contexts/dev.md -->
# Developer Agent Context

## Role
You are a Developer Agent focused on implementation.

## Mandatory Behaviors
- Run tests before claiming completion
- Follow existing patterns
- Stay in scope
```

### 3. The plugin auto-activates

When you start OpenCode in your project, iDumb will:
1. Load on plugin initialization
2. Listen for session events
3. Inject governance context on session creation
4. Provide custom tools to agents

## Custom Tools Available to Agents

### `idumb_init`

**MANDATORY first call** for agents to receive their context.

```
Agent must call: idumb_init
Returns: Governance rules, current state, active anchors
```

### `idumb_complete`

**MANDATORY before claiming completion** - records outcomes.

```typescript
idumb_complete({
  summary: "What was accomplished",
  artifacts: ["file1.ts", "file2.ts"],
  verified: true  // Must be true to complete
})
```

### `idumb_anchor`

Save critical context that survives compaction.

```typescript
idumb_anchor({
  intent: "The user's original goal was to...",
  priority: "critical"  // critical | important | normal
})
```

## How It Works

### Session Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│                     SESSION CREATED                          │
│  • Detect agent from title                                   │
│  • Initialize session state                                  │
│  • Inject governance via session.prompt({ system: ... })     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    FIRST USER MESSAGE                        │
│  • Capture Turn-1 intent                                     │
│  • Auto-save as SACRED anchor                                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     DURING SESSION                           │
│  • Agent calls idumb_init (gets context)                     │
│  • Agent calls idumb_anchor (saves critical info)            │
│  • Delegation → tool.execute.before injects context          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      ON COMPACTION                           │
│  • Inject Turn-1 intent as SACRED anchor                     │
│  • Include parent context if delegated session               │
│  • Add user-saved anchors                                    │
│  • Add governance reminder                                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     ON COMPLETION                            │
│  • Agent calls idumb_complete                                │
│  • Validates verified: true                                  │
│  • Records outcome in state                                  │
└─────────────────────────────────────────────────────────────┘
```

### Delegation Interception

When an agent delegates via `task` tool, iDumb:

1. Intercepts `tool.execute.before`
2. Injects parent context + governance rules
3. Modifies the prompt with:
   - Parent's original intent
   - Delegation rules
   - Required tool calls

## Configuration

### State File Structure

```json
// .idumb/state.json
{
  "version": "0.1.0",
  "initialized": true,
  "sessions": {
    "session-123": {
      "id": "session-123",
      "agent": "dev",
      "parentId": null,
      "turnOneIntent": "Create a login form...",
      "createdAt": "2026-02-01T...",
      "contextInjected": true
    }
  },
  "anchors": [
    {
      "sessionId": "session-123",
      "intent": "Original user goal...",
      "timestamp": "2026-02-01T...",
      "preserved": true
    }
  ]
}
```

### Agent Context Files

Place `.md` files in `.idumb/contexts/`:

- `supreme-coordinator.md` - Top-level orchestrator context
- `dev.md` - Developer agent context
- `architect.md` - Architecture agent context
- `reviewer.md` - Code review agent context

Files are named by agent slug (lowercase).

## Debugging

Enable debug mode by setting in the plugin:

```typescript
const CONFIG = {
  DEBUG: true,  // Set to true for verbose logging
}
```

Logs appear with `[iDumb]` prefix in OpenCode output.

## API Reference

### Events Handled

| Event | Purpose |
|-------|---------|
| `session.created` | Initialize session, inject governance |
| `session.updated` | Capture Turn-1 intent |
| `tool.execute.before` | Intercept delegations, inject context |
| `tool.execute.after` | Track delegation results |
| `experimental.session.compacting` | Inject SACRED anchors |
| `permission.asked` | Optional auto-approval rules |

### Hooks Provided

| Hook | Capability |
|------|------------|
| Custom Tools | `idumb_init`, `idumb_complete`, `idumb_anchor` |
| System Prompt | Via `session.prompt({ system: ... })` |
| Task Args | Modified via `output.args` in `tool.execute.before` |
| Compaction Context | Via `output.context.push()` |

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT © [shynlee04](https://github.com/shynlee04)

---

**Built for the [OpenCode](https://opencode.ai) ecosystem** 🚀
