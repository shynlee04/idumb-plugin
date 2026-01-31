# iDumb - OpenCode Meta-Framework

> 🧠 Context manipulation, governance enforcement, and agent orchestration for OpenCode

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## What's Inside

This monorepo contains:

| Package | Description | Status |
|---------|-------------|--------|
| [`@idumb/opencode-plugin`](./packages/idumb-plugin) | Core OpenCode plugin | ✅ Prototype |
| `@idumb/cli` | CLI for project initialization | 🚧 Planned |
| `@idumb/bmad-wrapper` | BMAD framework wrapper | 🚧 Planned |

## Quick Install

```bash
# Install the plugin in your project
npm install @idumb/opencode-plugin
# or
pnpm add @idumb/opencode-plugin
# or from GitHub
npx github:shynlee04/idumb-plugin init
```

## Core Features

### 🎯 Zero-Turn Agent Priming
Inject governance context before the agent's first response.

### 🔒 SACRED Turn-1 Anchoring
Preserve original user intent through session compaction.

### 🎨 Agent-Specific Context
Load role-based instructions per agent type.

### 🔗 Delegation Interception
Automatically inject context into child agent sessions.

### ✅ Completion Validation
Enforce verification before task completion claims.

### 📊 State Persistence
Track sessions, anchors, and context across restarts.

## Wrapped Frameworks

iDumb acts as a wrapper/enhancer for:

- **BMAD** - Full software development lifecycle
- **Speckit** - Specification-driven development (planned)
- **GSD** - Get Sh*t Done methodology (planned)

## Documentation

- [Plugin README](./packages/idumb-plugin/README.md) - Installation & usage
- [Research Findings](./_bmad-output/planning-artifacts/research/) - Technical research

## Development

```bash
# Clone the repo
git clone https://github.com/shynlee04/idumb-plugin.git
cd idumb-plugin

# Install dependencies
bun install

# Build the plugin
cd packages/idumb-plugin
bun run build
```

## Project Structure

```
idumb/
├── packages/
│   └── idumb-plugin/          # Main OpenCode plugin
│       ├── src/index.ts       # Plugin source
│       ├── contexts/          # Default agent contexts
│       └── README.md          # Package documentation
├── .opencode/                 # Local OpenCode setup
│   └── plugins/               # Local plugin testing
├── .idumb/                    # Local state directory
│   ├── state.json             # Session state
│   └── contexts/              # Agent context files
├── _bmad-output/              # BMAD workflow outputs
│   └── planning-artifacts/    # Research & planning docs
└── bmm-workflow-status.yaml   # Project status tracking
```

## Research

Based on fact-based research of OpenCode's public plugin API:
- [Plugin API Facts](./_bmad-output/planning-artifacts/research/opencode-plugin-api-facts-2026-02-01.md)

## License

MIT © [shynlee04](https://github.com/shynlee04)

---

**Built for the [OpenCode](https://opencode.ai) ecosystem** 🚀
