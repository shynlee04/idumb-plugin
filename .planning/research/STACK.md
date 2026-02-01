# Technology Stack: iDumb Meta-Framework Plugin

**Project:** iDumb Meta-Framework Plugin for OpenCode  
**Researched:** 2026-02-01  
**Confidence:** HIGH (verified with Context7, official docs, and multiple sources)

---

## Executive Summary

iDumb is a client-side OpenCode plugin that wraps spec-driven development frameworks (GSD, BMAD, Speckit). The stack prioritizes **Bun runtime for speed**, **TypeScript for type safety**, and leverages OpenCode's official Plugin SDK for integration. This is a **greenfield project** requiring CLI tooling for configuration, state persistence, and framework orchestration.

**Key architectural decision:** This is an OpenCode *plugin* (not a standalone app), meaning it runs client-side inside OpenCode's Bun runtime with access to their Plugin SDK. CLI tools are separate utilities that configure the plugin, not the plugin itself.

---

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **@opencode-ai/plugin** | ^1.1.40 | Plugin SDK for OpenCode integration | Official SDK. Provides `Plugin` type, `tool` helper, event hooks, and full TypeScript support. **Required** for all OpenCode plugins. |
| **@opencode-ai/sdk** | ^1.x | Server API client | For advanced session manipulation, TUI control, and file operations. Use via `ctx.client` in plugins. |
| **TypeScript** | ^5.5+ | Type safety and DX | Bun has excellent TypeScript support. Use for type-safe hooks, custom tools, and state management. |
| **Bun** | ^1.2.x | Runtime, package manager, test runner | OpenCode uses Bun internally. Consistent runtime, faster than Node.js, built-in bundler and test runner. |

**Confidence:** HIGH - Verified from official OpenCode docs and existing prototype

### Plugin State Persistence

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Bun.file() API** | Built-in | File I/O operations | Bun's native file API is 2-3x faster than Node's fs. Use for reading/writing state files. |
| **YAML** | via `yaml` package | Human-readable state/config files | Better for git diffs than JSON. Framework configs (GSD, BMAD) use YAML patterns. |
| **Zod** | ^3.x | Schema validation for state and tool args | Tool args in OpenCode use Zod schemas. Also validate persisted state on load. |

**Confidence:** HIGH - Confirmed from prototype implementation and OpenCode tool patterns

### CLI Tooling (Separate from Plugin)

iDumb needs CLI tools for:
- Framework initialization (`idumb init gsd|bmad|speckit`)
- Configuration management (`idumb config set framework gsd`)
- Status checking (`idumb status`)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Commander.js** | ^12.x | CLI argument parsing and command structure | **Recommended over oclif** for this use case. Lighter weight, better TypeScript inference, perfect for simple-moderate CLI tools. Has excellent async support via `parseAsync()`. |
| **@commander-js/extra-typings** | ^12.x | Enhanced TypeScript types | Strong typing for `.opts()` and `.action()` parameters. Auto-infers types from option definitions. |
| **picocolors** | ^1.x | Terminal colors | Smaller and faster than chalk. Good enough for CLI output. |
| **@inquirer/prompts** | ^7.x | Interactive prompts | Modern replacement for inquirer. Better TypeScript, smaller bundle. |

**Confidence:** MEDIUM-HIGH - Commander is well-established (Context7 verified). Choice over oclif is opinionated based on project scope.

### Development & Testing

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **bun:test** | Built-in | Unit and integration testing | Bun's built-in test runner. Jest-compatible API, no extra dependencies, much faster. |
| **@types/node** | ^20.x | Node.js type definitions | Still needed even with Bun for Node-compatible APIs. |

**Confidence:** HIGH - Bun's test runner is production-ready and recommended by Bun team

---

## Alternatives Considered

### CLI Framework: Commander.js vs oclif vs yargs

| Framework | When to Use | Why NOT for iDumb |
|-----------|-------------|-------------------|
| **oclif** | Enterprise CLIs with plugins, complex subcommand hierarchies | Overkill for iDumb's CLI needs. Steeper learning curve, larger bundle. Heroku/Salesforce heritage but unnecessarily complex for simple framework wrappers. |
| **yargs** | When you need declarative syntax and built-in help generation | Verbose API for simple use cases. Commander's chainable API is cleaner for the limited commands iDumb needs. |
| **Commander.js** | General-purpose CLIs, good balance of features and simplicity | **CHOSEN** - Right complexity level, excellent TypeScript support, proven at scale. |

**Confidence:** MEDIUM - This is an opinionated choice based on project scope. If iDumb CLI grows to 15+ commands with complex plugin architecture, oclif would be worth revisiting.

### State Format: YAML vs JSON

| Format | Pros | Cons | Verdict |
|--------|------|------|---------|
| **JSON** | Native to JS, fast parsing | Poor git diffs, no comments | Use for machine-generated state only |
| **YAML** | Human-readable, comments, good diffs | Slightly slower parsing | **CHOSEN** - For framework configs and state that humans may edit |
| **TOML** | Good for configs | Less ecosystem support in TS | Skip - YAML is standard in this ecosystem |

**Confidence:** HIGH - YAML is standard for framework configs (BMAD, GSD patterns observed)

---

## Architecture Decision Records

### ADR-1: Bun Over Node.js

**Context:** OpenCode uses Bun internally. Plugin runs in OpenCode's Bun runtime.

**Decision:** Use Bun for all tooling and development.

**Consequences:**
- ✅ Consistent runtime between plugin and CLI tools
- ✅ Faster package installation and script execution
- ✅ Built-in TypeScript support (no ts-node needed)
- ⚠️ Some npm packages may have Bun compatibility issues (rare in 2025)
- ⚠️ Team must be familiar with Bun-specific APIs (Bun.file, $ shell)

### ADR-2: Plugin vs CLI Separation

**Context:** iDumb has two distinct components:
1. OpenCode plugin (runs inside OpenCode, uses Plugin SDK)
2. CLI tools (standalone, run from terminal)

**Decision:** Separate packages:
- `packages/idumb-plugin/` - OpenCode plugin
- `packages/idumb-cli/` - CLI tooling

**Consequences:**
- ✅ Clear separation of concerns
- ✅ Plugin can be distributed via npm (`opencode-idumb`)
- ✅ CLI can be installed globally (`npm install -g idumb-cli`)
- ✅ Each can have independent versioning

### ADR-3: Commander Over oclif for CLI

**Context:** Need CLI for framework initialization and configuration.

**Decision:** Use Commander.js, not oclif.

**Rationale:**
- iDumb CLI has ~5-8 commands, not 50+
- No need for plugin architecture in CLI itself
- Commander's chainable API is more readable for small command sets
- Smaller bundle size, faster startup

**Revisit when:** CLI grows beyond 15 commands or needs plugin extensibility.

---

## Package Structure

```
idumb/
├── packages/
│   ├── idumb-plugin/          # OpenCode plugin
│   │   ├── src/
│   │   │   ├── index.ts       # Main plugin export
│   │   │   ├── tools/         # Custom tool definitions
│   │   │   ├── hooks/         # Event hooks (session, tool, compaction)
│   │   │   └── state/         # State persistence layer
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── idumb-cli/             # CLI tooling
│       ├── src/
│       │   ├── index.ts       # CLI entry point
│       │   ├── commands/      # Command implementations
│       │   └── config/        # Config management
│       ├── package.json
│       └── tsconfig.json
│
├── package.json               # Workspace root
└── tsconfig.json              # Shared TS config
```

---

## Dependencies

### Plugin Package (`packages/idumb-plugin/package.json`)

```json
{
  "name": "@idumb/plugin",
  "version": "0.1.0",
  "type": "module",
  "dependencies": {
    "@opencode-ai/plugin": "^1.1.40",
    "@opencode-ai/sdk": "^1.0.0",
    "yaml": "^2.5.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.5.0"
  }
}
```

### CLI Package (`packages/idumb-cli/package.json`)

```json
{
  "name": "idumb-cli",
  "version": "0.1.0",
  "type": "module",
  "bin": {
    "idumb": "./dist/index.js"
  },
  "dependencies": {
    "commander": "^12.0.0",
    "@commander-js/extra-typings": "^12.0.0",
    "picocolors": "^1.0.0",
    "@inquirer/prompts": "^7.0.0",
    "yaml": "^2.5.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.5.0"
  }
}
```

### Root Workspace (`package.json`)

```json
{
  "name": "idumb",
  "private": true,
  "workspaces": ["packages/*"],
  "devDependencies": {
    "typescript": "^5.5.0"
  }
}
```

---

## Installation Commands

```bash
# Initialize workspace
bun init

# Install plugin dependencies
cd packages/idumb-plugin
bun install

# Install CLI dependencies
cd ../idumb-cli
bun install

# Install globally for CLI usage
bun install -g ./packages/idumb-cli

# Or use via npx
npx idumb-cli@latest
```

---

## TypeScript Configuration

### Plugin (`packages/idumb-plugin/tsconfig.json`)

```json
{
  "extends": "@tsconfig/node22/tsconfig.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "module": "preserve",
    "moduleResolution": "bundler",
    "declaration": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"]
}
```

### CLI (`packages/idumb-cli/tsconfig.json`)

```json
{
  "extends": "@tsconfig/node22/tsconfig.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "module": "preserve",
    "moduleResolution": "bundler",
    "declaration": true,
    "strict": true
  },
  "include": ["src/**/*"]
}
```

---

## Anti-Stack (What NOT to Use)

| Technology | Why Not | Use Instead |
|------------|---------|-------------|
| **Node.js runtime** | OpenCode uses Bun internally; inconsistent runtime | Bun |
| **oclif** | Overkill for simple CLI. Complex plugin architecture not needed. | Commander.js |
| **Jest** | Heavier, slower than bun:test. Redundant with Bun. | bun:test |
| **chalk** | Larger than picocolors. No significant feature advantage. | picocolors |
| **inquirer** (old) | Unmaintained, poor TypeScript. | @inquirer/prompts |
| **JSON for config** | Poor diffs, no comments. | YAML |
| **Standalone HTTP server** | Plugin runs client-side in OpenCode. No server needed. | Plugin SDK via `ctx.client` |

---

## Version Pinning Strategy

| Package Type | Strategy | Rationale |
|--------------|----------|-----------|
| `@opencode-ai/*` | Caret (`^`) minor | Follow OpenCode's SDK updates. Test before minor version bumps. |
| CLI frameworks | Caret (`^`) minor | Commander is stable. Breaking changes rare. |
| TypeScript | Caret (`^`) minor | TS doesn't follow semver strictly. Minor versions are safe. |
| Bun | Exact in CI, latest locally | Pin in `.bun-version` or CI for reproducibility. |

---

## Sources

### Official Documentation (HIGH Confidence)

1. **OpenCode Plugin Docs**: https://opencode.ai/docs/plugins/ (Accessed 2026-02-01)
   - Verified plugin structure, hooks, custom tools
   - Confirmed TypeScript support and SDK APIs

2. **OpenCode SDK Docs**: https://opencode.ai/docs/sdk/ (Accessed 2026-02-01)
   - Verified all client APIs for session management
   - Confirmed `session.prompt({ noReply: true })` for context injection

3. **Commander.js Docs**: https://github.com/tj/commander.js (via Context7)
   - Verified async action support via `parseAsync()`
   - Confirmed TypeScript integration with `@commander-js/extra-typings`

### Community Resources (MEDIUM Confidence)

4. **OpenCode Plugin Development Guide** (Gist by rstacruz): https://gist.github.com/rstacruz/946d02757525c9a0f49b25e316fbe715
   - Community-sourced but based on official source code analysis
   - Provides practical patterns for tool definition and hooks

5. **Existing iDumb Prototype**: `.opencode/plugins/idumb-plugin.ts`
   - Working implementation of OpenCode plugin patterns
   - Demonstrates state persistence, custom tools, and hooks

### Research Notes (MEDIUM Confidence)

6. **CLI Framework Comparison**: Multiple web sources comparing Commander vs oclif vs yargs
   - Reddit r/typescript, r/node discussions
   - Blog posts from 2024-2025

7. **Bun Version**: bun.com/blog shows 1.2.x is current stable (as of Jan 2026)

---

## Research Gaps & Open Questions

| Topic | Gap | Recommendation |
|-------|-----|----------------|
| **@opencode-ai/plugin exact version** | Latest version unknown beyond 1.1.40 | Check npm registry during implementation phase |
| **Bun workspace monorepo patterns** | Limited documentation on complex workspaces | Start simple, add Turborepo only if needed |
| **Plugin distribution** | Unclear how users install plugins globally | Research `opencode-` npm prefix pattern |

---

## Roadmap Implications

Based on this stack research, the implementation roadmap should be:

### Phase 1: Plugin Core (Foundation)
- Set up Bun workspace with two packages
- Implement Plugin SDK integration with basic hooks
- Build state persistence layer (YAML + Zod)

### Phase 2: Custom Tools
- Implement `idumb_init` tool (agent context)
- Implement `idumb_complete` tool (task completion)
- Implement `idumb_anchor` tool (context preservation)

### Phase 3: CLI Tooling
- Build Commander.js-based CLI
- Framework initialization commands
- Configuration management

### Phase 4: Framework Wrappers
- GSD integration
- BMAD integration
- Speckit integration

### Phase 5: Polish
- Error handling and validation
- Documentation
- Publishing to npm

**Confidence Assessment:**
- Stack recommendations: HIGH (official docs + prototype)
- CLI framework choice: MEDIUM (opinionated but justified)
- Version numbers: MEDIUM (will need verification at implementation)
