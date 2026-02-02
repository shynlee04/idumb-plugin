# iDumb - Hierarchical Governance for OpenCode

> **Intelligent Delegation Using Managed Boundaries**

iDumb is a hierarchical AI governance framework that ensures safe, controlled, and systematic code development through agent delegation and permission management.

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/shynlee04/idumb-plugin.git
cd idumb-plugin

# Install in your project (run from your project directory)
node /path/to/idumb-plugin/bin/install.js --local

# Or install globally
node /path/to/idumb-plugin/bin/install.js --global
```

> **Note**: This package is not yet published to npm. Install from source.

## 🎯 Key Features

### Hierarchical Agent System
- **Supreme Coordinator**: Plans, delegates, never executes
- **High Governance**: Validates, orchestrates sub-agents
- **Low Validator**: Read-only verification (grep, glob, tests)
- **Builder**: The ONLY agent that can write files

### Experience Levels
| Level | Description |
|-------|-------------|
| **pro** | User drives, AI suggests. Minimal guardrails. |
| **guided** | AI explains rationale, confirms before actions. (Default) |
| **strict** | Non-negotiable guardrails, blocks unsafe actions. |

### Language Support
Configure AI communication and document languages separately:
```
/idumb:config language communication vi  # AI speaks Vietnamese
/idumb:config language documents en       # Docs in English
```

## 📁 Project Structure

```
.idumb/
├── config.json          # Master configuration (SINGLE SOURCE OF TRUTH)
├── brain/
│   ├── state.json       # Current governance state
│   ├── history/         # Action history
│   └── context/         # Preserved context
├── governance/
│   └── validations/     # Validation reports
├── anchors/             # Critical decisions that survive compaction
└── sessions/            # Session metadata

.opencode/
├── agents/idumb-*.md    # Agent profiles
├── commands/idumb/*.md  # Commands
├── tools/idumb-*.ts     # Tools
└── plugins/idumb-core.ts # Event hooks
```

## 🔧 Commands

| Command | Description |
|---------|-------------|
| `/idumb:init` | Initialize iDumb in current project |
| `/idumb:status` | Show current governance state |
| `/idumb:config` | View/edit configuration |
| `/idumb:validate` | Run all validation checks |
| `/idumb:help` | Show help and available commands |

## ⚡ The Hierarchy Rule

```
Milestone → Phase → Plan → Task
     ↓
coordinator → governance → validator → builder
```

**The Chain Cannot Break:**
- Coordinators delegate, never execute
- Only builders can write files
- Every action is logged and traceable

## 📝 License

MIT

## 🌐 Documentation

- [English Documentation](./docs/en/README.md)
- [Tài liệu tiếng Việt](./docs/vi/README.md)
