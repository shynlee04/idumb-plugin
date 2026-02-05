# iDumb Installation Validation Checklist
**Date:** 2026-02-02
**Status:** VALIDATED

## How iDumb Governance Actually Works

### What the LLM Sees

| When | What LLM Sees | Controlled By |
|------|---------------|---------------|
| Session Start | Agent system prompt | `agents/idumb-supreme-coordinator.md` |
| During Session | Tool outputs | `tools/idumb-*.ts` when called |
| After Compaction | Anchors + state | Plugin `experimental.session.compacting` hook |
| Command Execution | Command definition | `commands/idumb/*.md` |

### What Plugin Does (Background)

| Hook | Purpose | LLM Visible? |
|------|---------|--------------|
| `event` → `session.created` | Load state, sync GSD | No (background) |
| `event` → `command.executed` | Sync state after GSD commands | No (background) |
| `experimental.session.compacting` | Inject anchors into compaction | Yes (after compaction) |
| `tool.execute.before` | Add timestamps to GSD artifacts | Partially (file content) |
| `stop` | Check TODOs, prompt if incomplete | Yes (triggers prompt) |

### Key Design Principle

**Governance is enforced through AGENT SYSTEM PROMPTS, not plugin injections.**

The agent .md files define the LLM's "personality". The plugin silently tracks state but does NOT inject noise into conversations (which breaks GSD).

---

## Validation Results

### ✅ V1: Agent Files (PASS)

All 4 agent files have correct OpenCode frontmatter:

| Agent | Mode | Hidden | Permission | Tools |
|-------|------|--------|------------|-------|
| idumb-supreme-coordinator | `primary` | - | edit: deny, write: deny | idumb-* |
| idumb-high-governance | `all` | `true` | edit: deny, write: deny | idumb-* |
| idumb-low-validator | `all` | `true` | edit: deny, write: deny, task: deny | idumb-* |
| idumb-builder | `all` | `true` | edit: allow, write: allow, task: deny | idumb-* |

### ✅ V2: Tools (PASS)

All 6 tool files use correct `tool()` export format:

| File | Exports |
|------|---------|
| idumb-state.ts | read, write, anchor, history, getAnchors, default |
| idumb-validate.ts | structure, schema, freshness, gsdAlignment, default |
| idumb-config.ts | read, update, init, status, sync, default |
| idumb-context.ts | default, summary, patterns |
| idumb-manifest.ts | snapshot, drift, conflicts, verifyGitHash, default |
| idumb-chunker.ts | read, overview, validate, append, default |

**Total:** 29 tool exports, all using `tool()` from `@opencode-ai/plugin`

### ✅ V3: Commands (PASS)

Commands in correct path `template/commands/idumb/`:
- help.md
- init.md
- status.md
- validate.md

### ✅ V4: Plugin Hooks (PASS)

Plugin uses valid OpenCode hook signatures:
- `event` - Receives all Bus events
- `experimental.session.compacting` - Injects context during compaction
- `tool.execute.before` - Intercepts tool calls (for timestamp injection)
- `tool.execute.after` - Tracks tool results
- `command.execute.before` - Observes commands (no injection)
- `stop` - Enforces TODO completion

### ✅ V5: Install Script (PASS)

`bin/install.js` copies to correct paths:
- `agents/` → `.opencode/agents/`
- `commands/idumb/` → `.opencode/commands/idumb/`
- `tools/` → `.opencode/tools/`
- `plugins/` → `.opencode/plugins/`
- `skills/` → `.opencode/skills/`

Creates `.idumb/` structure:
- `.idumb/brain/state.json`
- `.idumb/brain/config.json`
- `.idumb/brain/governance/`
- `.idumb/brain/anchors/`
- `.idumb/brain/sessions/`

---

## Installation Test Procedure

### For User Testing

```bash
# 1. Go to a test project
cd /path/to/test-project

# 2. Install iDumb
npx github:shynlee04/idumb-plugin --local

# 3. Restart OpenCode
# (Close and reopen OpenCode TUI)

# 4. Verify agents loaded
# Switch agent with Tab - should see idumb-supreme-coordinator

# 5. Initialize
/idumb:init

# 6. Check status
/idumb:status

# 7. Verify GSD works (if GSD installed)
/gsd:help
```

### Expected Results

1. **Installation completes** with summary showing 4 agents, 4 commands, 6 tools, 1 plugin
2. **Agent switch (Tab)** shows `idumb-supreme-coordinator` as an option
3. **`/idumb:init`** creates `.idumb/` structure
4. **`/idumb:status`** shows governance state
5. **GSD commands** work normally without iDumb noise

---

## What Makes This Work

1. **Agent .md files** → LLM sees these as system prompt. Contains all governance rules.
2. **Tools** → LLM calls these to read/write state. Tools are visible to LLM.
3. **Commands** → User triggers these. LLM executes the command definition.
4. **Plugin** → Silent background work. Only compaction hook and stop hook interact with LLM.

## What Was Fixed

1. **Removed `output.parts.push()`** from `command.execute.before` - was injecting noise into GSD commands
2. **Removed context injection** from `tool.execute.before` for task delegations - was breaking agent workflows
3. **Changed philosophy**: Governance via agent prompts, not plugin injections

## File Inventory

```
template/
├── agents/                    # 4 files - Agent system prompts
├── commands/idumb/           # 4 files - Slash command definitions
├── plugins/idumb-core.ts     # 1 file - Event hooks (697 lines → 670 lines after fix)
├── tools/                    # 6 files - LLM-callable tools
├── skills/idumb-governance/  # 1 file - Skill reference
└── types/opencode.d.ts       # TypeScript types

bin/
└── install.js                # Installation script (631 lines)
```
