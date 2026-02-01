# Plugin Distribution Research

**Project:** iDumb Meta-Framework Plugin
**Researched:** 2026-02-02
**Source Confidence:** HIGH (OpenCode official docs, npm patterns)

---

## Executive Summary

iDumb should be distributed as an npm package with an npx installer (similar to GSD). The package installs files into OpenCode's configuration directories, making the plugin, agents, commands, and tools available.

---

## Distribution Models

### Model 1: npx Installer (RECOMMENDED)

**Pattern:** `npx @idumb/create` or `npx create-idumb`

**How GSD Does It:**
```bash
npx get-shit-done-cc
# Prompts for:
# 1. Runtime (Claude Code, OpenCode, Gemini, or all)
# 2. Location (Global or local)
```

**Installation Targets:**
| Location | Path | Scope |
|----------|------|-------|
| Global OpenCode | `~/.config/opencode/` | All projects |
| Local OpenCode | `.opencode/` | Current project |
| Global Claude | `~/.claude/` | All projects |
| Local Claude | `.claude/` | Current project |

**Advantages:**
- Interactive setup with prompts
- Handles file copying, configuration
- Can run init scripts, codebase analysis
- Supports uninstall (`--uninstall` flag)
- Non-interactive mode for CI/Docker

### Model 2: npm Plugin Reference

**Pattern:** Configure in `opencode.json`

```json
{
  "plugin": ["@idumb/opencode-plugin"]
}
```

**How It Works:**
- OpenCode auto-installs via Bun at startup
- Cached in `~/.cache/opencode/node_modules/`
- Plugin code runs, can register tools/hooks

**Limitations:**
- Only loads plugin file, not agents/commands/skills
- No interactive setup
- Can't copy files to config directories

### Model 3: Hybrid (RECOMMENDED)

**Use both approaches:**

1. **npx installer** - Initial setup, copies all files
2. **npm plugin reference** - Runtime hooks, state management

```bash
# Initial setup
npx @idumb/create

# This adds to opencode.json:
{
  "plugin": ["@idumb/opencode-plugin"]
}

# And copies:
# ~/.config/opencode/agents/idumb-*.md
# ~/.config/opencode/commands/idumb/*.md
# ~/.config/opencode/tools/idumb-*.ts
# ~/.config/opencode/skills/idumb-*/SKILL.md
```

---

## Package Structure

### Recommended Layout

```
@idumb/opencode-plugin/
├── package.json
├── bin/
│   └── install.js          # npx entry point
├── src/
│   └── plugin.ts           # Main plugin (npm reference)
├── dist/
│   └── plugin.js           # Compiled plugin
├── template/
│   ├── agents/
│   │   ├── idumb-coordinator.md
│   │   ├── idumb-governor.md
│   │   └── idumb-validator.md
│   ├── commands/
│   │   └── idumb/
│   │       ├── init.md
│   │       ├── status.md
│   │       └── validate.md
│   ├── tools/
│   │   ├── idumb-state.ts
│   │   └── idumb-validate.ts
│   ├── skills/
│   │   └── idumb-expert-skeptic/
│   │       └── SKILL.md
│   └── prompts/
│       ├── build.txt
│       └── governance.txt
└── README.md
```

### package.json

```json
{
  "name": "@idumb/opencode-plugin",
  "version": "0.1.0",
  "description": "Meta-framework plugin for OpenCode wrapping GSD/BMAD/Speckit",
  "main": "dist/plugin.js",
  "types": "dist/plugin.d.ts",
  "bin": {
    "idumb": "bin/install.js",
    "create-idumb": "bin/install.js"
  },
  "files": [
    "dist",
    "bin",
    "template"
  ],
  "exports": {
    ".": {
      "import": "./dist/plugin.js",
      "types": "./dist/plugin.d.ts"
    }
  },
  "scripts": {
    "build": "tsup src/plugin.ts --format esm --dts",
    "prepublishOnly": "npm run build"
  },
  "keywords": [
    "opencode",
    "plugin",
    "gsd",
    "bmad",
    "ai-coding",
    "meta-framework"
  ],
  "peerDependencies": {
    "@opencode-ai/plugin": "^1.0.0"
  },
  "devDependencies": {
    "@opencode-ai/plugin": "^1.0.0",
    "tsup": "^8.0.0",
    "typescript": "^5.0.0"
  }
}
```

---

## Installer Script Pattern

### bin/install.js

```javascript
#!/usr/bin/env node

import { existsSync, cpSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createInterface } from 'readline';

const __dirname = dirname(fileURLToPath(import.meta.url));
const templateDir = join(__dirname, '..', 'template');

// Parse CLI args
const args = process.argv.slice(2);
const isGlobal = args.includes('--global') || args.includes('-g');
const isLocal = args.includes('--local') || args.includes('-l');
const isUninstall = args.includes('--uninstall');

// Determine target directory
async function getTargetDir() {
  if (isGlobal) {
    return join(process.env.HOME, '.config', 'opencode');
  }
  if (isLocal) {
    return join(process.cwd(), '.opencode');
  }
  
  // Interactive prompt
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question('Install globally or locally? (g/l): ', (answer) => {
      rl.close();
      if (answer.toLowerCase() === 'g') {
        resolve(join(process.env.HOME, '.config', 'opencode'));
      } else {
        resolve(join(process.cwd(), '.opencode'));
      }
    });
  });
}

async function install() {
  const targetDir = await getTargetDir();
  
  console.log(`Installing iDumb to ${targetDir}...`);
  
  // Copy template files
  const dirs = ['agents', 'commands', 'tools', 'skills', 'prompts'];
  for (const dir of dirs) {
    const src = join(templateDir, dir);
    const dest = join(targetDir, dir);
    if (existsSync(src)) {
      mkdirSync(dest, { recursive: true });
      cpSync(src, dest, { recursive: true });
      console.log(`  ✓ Copied ${dir}/`);
    }
  }
  
  // Update opencode.json to add plugin reference
  const configPath = join(targetDir, 'opencode.json');
  let config = {};
  if (existsSync(configPath)) {
    config = JSON.parse(readFileSync(configPath, 'utf8'));
  }
  
  config.plugin = config.plugin || [];
  if (!config.plugin.includes('@idumb/opencode-plugin')) {
    config.plugin.push('@idumb/opencode-plugin');
  }
  
  writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log('  ✓ Updated opencode.json');
  
  console.log('\n✅ iDumb installed successfully!');
  console.log('Restart OpenCode and run /idumb:init to get started.');
}

async function uninstall() {
  const targetDir = await getTargetDir();
  
  console.log(`Removing iDumb from ${targetDir}...`);
  
  // Remove iDumb-prefixed files
  // ... (implementation)
  
  console.log('\n✅ iDumb uninstalled successfully!');
}

if (isUninstall) {
  uninstall();
} else {
  install();
}
```

---

## Plugin Entry Point

### src/plugin.ts

```typescript
import type { Plugin } from "@opencode-ai/plugin"
import { tool } from "@opencode-ai/plugin"

export const IdumbPlugin: Plugin = async ({ 
  project, 
  directory, 
  worktree, 
  client, 
  $ 
}) => {
  await client.app.log({
    service: "idumb-plugin",
    level: "info",
    message: "iDumb plugin initialized",
  })
  
  return {
    // Session lifecycle hooks
    event: async ({ event }) => {
      if (event.type === "session.created") {
        // Initialize iDumb state
      }
      if (event.type === "session.idle") {
        // Checkpoint state
      }
    },
    
    // Compaction hook - preserve critical context
    "experimental.session.compacting": async (input, output) => {
      output.context.push(`## iDumb State
- Current phase: ...
- Governance status: ...
- Last validation: ...`)
    },
    
    // Tool interception for validation
    "tool.execute.before": async (input, output) => {
      // Inject governance checks
    },
    
    // Custom tools
    tool: {
      idumb_status: tool({
        description: "Get current iDumb governance status",
        args: {},
        async execute(args, context) {
          // Implementation
          return "Status: OK"
        },
      }),
      
      idumb_validate: tool({
        description: "Run governance validation on current state",
        args: {
          level: tool.schema.enum(["quick", "thorough", "full"]),
        },
        async execute(args, context) {
          // Implementation
          return "Validation passed"
        },
      }),
    },
  }
}

// Default export for OpenCode auto-discovery
export default IdumbPlugin
```

---

## Naming Conventions

### Package Names

| Pattern | Example | Use |
|---------|---------|-----|
| Scoped | `@idumb/opencode-plugin` | Recommended for organization |
| create-* | `create-idumb` | npx convention for scaffolding |
| *-opencode | `idumb-opencode` | Platform-specific suffix |

### Command Prefix

All commands should use `idumb:` prefix to avoid conflicts:
- `/idumb:init`
- `/idumb:status`
- `/idumb:validate`
- `/idumb:brain`

### Agent Names

Use `idumb-` prefix:
- `idumb-coordinator`
- `idumb-governor`
- `idumb-validator`

### Tool Names

Filename becomes tool name. Use `idumb-` prefix:
- `idumb-state.ts` → `idumb-state` tool
- `idumb-validate.ts` → `idumb-validate` tool

---

## Version Management

### Semantic Versioning

```
MAJOR.MINOR.PATCH
  │      │     │
  │      │     └── Bug fixes, patches
  │      └──────── New features, backward compatible
  └─────────────── Breaking changes
```

### Update Pattern (like GSD)

```bash
# Check for updates
npx @idumb/create@latest --dry-run

# Update
npx @idumb/create@latest
```

---

## Testing Strategy

### Pre-publish Checklist

1. **Local testing** - Install to test project, verify all commands work
2. **OpenCode TUI testing** - Ensure no background text exposure
3. **Plugin hooks testing** - Verify all events fire correctly
4. **Tool testing** - Test all custom tools
5. **Uninstall testing** - Verify clean removal

### Test Installation

```bash
# From local development
node bin/install.js --local

# Verify
opencode
/idumb:help
```

---

## Key Insights

### What Works for GSD
1. **npx installer** - Easy onboarding
2. **Interactive prompts** - Guide user through setup
3. **Global vs local** - Flexibility for different use cases
4. **Uninstall support** - Clean removal
5. **Non-interactive mode** - CI/Docker support

### iDumb Should Add
1. **Wrapped framework selection** - GSD, BMAD, Speckit
2. **Project type detection** - Greenfield vs brownfield
3. **Configuration wizard** - Set up governance levels
4. **Health check** - Verify installation works

---

## Recommended Approach

### Phase 1: Minimal Viable Plugin
1. npm package with npx installer
2. Copies basic agents, commands, tools
3. Single wrapper (GSD first)
4. Test installation in OpenCode

### Phase 2: Enhanced Installation
1. Interactive framework selection
2. Project type detection
3. Configuration wizard
4. Brownfield codebase analysis

### Phase 3: Multi-Framework Support
1. BMAD wrapper
2. Speckit wrapper
3. Framework auto-detection
4. Migration tools

---

## Sources

- https://opencode.ai/docs/plugins/#from-npm
- https://github.com/glittercowboy/get-shit-done/blob/main/bin/install.js
- https://docs.npmjs.com/cli/v9/commands/npx
