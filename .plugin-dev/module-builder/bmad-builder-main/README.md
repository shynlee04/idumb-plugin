# BMad Builder

[![Version](https://img.shields.io/npm/v/bmad-builder?color=blue&label=version)](https://www.npmjs.com/package/bmad-builder)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Discord](https://img.shields.io/badge/Discord-Join%20Community-7289da?logo=discord&logoColor=white)](https://discord.gg/gk8jAdXWmj)

**Build More, Build better.** Create custom BMad agents, workflows, and domain-specific modules with guided assistance.

## About BMad Builder

BMad Builder (BMB) is a meta-module for BMad Method that helps you create your own agents and workflows. Whether you're building domain-specific expertise or automating repetitive development tasks, BMB guides you through:

- **Agent Builder** — Create specialized AI agents with custom expertise, communication styles, and tool access
- **Workflow Builder** — Design structured workflows with steps, menus, and cross-workflow communication
- **Module Builder** — Package agents and workflows into shareable BMad modules

## Installation

BMad Builder is installed as a module during BMad Method setup:

```bash
npx bmad-method@alpha install
```

Select **BMad Builder** from the modules list.

## Quick Start

After installing BMad Method with BMB, run from your project root:

```
/bmb-agent
```

This launches the Agent Builder workflow that guides you through creating a custom agent.

## What You Can Build

| Type | Description | Workflow |
|------|-------------|----------|
| **Agents** | Domain experts with specialized knowledge and tools | `/bmb-agent` |
| **Workflows** | Structured processes with steps and decision points | `/bmb-workflow` |
| **Modules** | Packaged agents + workflows ready to share | `/bmb-module` |

## Example: Creating a Domain Expert Agent

```
You: /bmb-agent
BMB: What domain should this agent specialize in?
You: Blockchain Development
BMB: Great! A blockchain expert would need to know about...
    [Guides you through agent configuration]
```

## Module Structure

BMad modules follow a standard structure:

```
your-module/
├── src/
│   ├── module.yaml      # Module metadata and install config
│   ├── agents/          # Agent definitions (.agent.yaml)
│   ├── workflows/       # Workflow files
│   └── tools/           # Small reusable tools
└── package.json         # NPM package info
```

## Publishing Your Module

When your module is ready to share:

```bash
# Bump version and create git tag
npm run release

# Or manually:
git tag v1.0.0
git push origin v1.0.0
```

See [bmad-module-template](https://github.com/bmad-code-org/bmad-module-template) for a starting point.

## Documentation

- [BMad Method Docs](http://docs.bmad-method.org)
- [Module Development Guide](http://docs.bmad-method.org/how-to/module-development/)

## Community

- [Discord](https://discord.gg/gk8jAdXWmj) — Get help and share your creations
- [GitHub Issues](https://github.com/bmad-code-org/bmad-builder/issues) — Bug reports and feature requests
- [Discussions](https://github.com/bmad-code-org/BMAD-METHOD/discussions) — Community conversations

## License

MIT License — see [LICENSE](LICENSE) for details.

---

**BMad Builder** — Part of the [BMad Method](https://github.com/bmad-code-org/BMAD-METHOD) ecosystem.

[![Contributors](https://contrib.rocks/image?repo=bmad-code-org/bmad-builder)](https://github.com/bmad-code-org/bmad-builder/graphs/contributors)

See [CONTRIBUTORS.md](CONTRIBUTORS.md) for contributor information.
