# @idumb/opencode-plugin

> 🧠 **iDumb Meta-Framework Plugin** - Context manipulation, governance enforcement, and agent orchestration for OpenCode

## Installation

```bash
# Install the plugin
npm install @idumb/opencode-plugin

# Initialize in your project
npx @idumb/opencode-plugin init

# Or with pnpm
pnpm add @idumb/opencode-plugin
pnpm dlx @idumb/opencode-plugin init
```

## Activation

Add to your project's `opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["@idumb/opencode-plugin"]
}
```

## What Gets Created

Running `init` creates in YOUR project:

```
your-project/
├── .idumb/
│   ├── state.json              # Session state (gitignored)
│   ├── config.example.yaml     # Configuration template
│   └── contexts/               # Agent-specific context files
│       ├── supreme-coordinator.md
│       └── dev.md
└── opencode.json               # (you add the plugin here)
```

## How It Works

The plugin loads in YOUR project directory and:

1. **On Session Start** → Detects agent from session title, injects governance context
2. **On First Message** → Captures "Turn-1 Intent" as SACRED anchor
3. **On Delegation** → Injects parent context into child agent prompts
4. **On Compaction** → Preserves original intent and anchors through summarization

## Custom Tools Available

### `idumb_init`
**Agent must call first** to receive governance context.

### `idumb_complete`
**Agent must call before completion** to record outcome.

### `idumb_anchor`
Save critical context that survives session compaction.

## Customization

### Add Agent Contexts

Create `.idumb/contexts/<agent-name>.md` for each agent:

```markdown
<!-- .idumb/contexts/architect.md -->
# Architect Agent Context

## Role
You are an Architecture Specialist.

## Mandatory Behaviors
- Review PRD before making decisions
- Document ADRs for significant choices
```

The filename (without `.md`) is matched against the agent name detected in sessions.

## Environment Variables

- `IDUMB_DEBUG=true` - Enable verbose logging

## How Plugin Discovers Your Project

When OpenCode loads the plugin, it receives:
- `ctx.directory` - Your project's working directory

The plugin then looks for `.idumb/` in that directory. If not found, it stays inactive.

## License

MIT
