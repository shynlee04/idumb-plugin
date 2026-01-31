/**
 * ============================================================================
 * iDumb CLI - Project Initialization
 * ============================================================================
 * Run: npx @idumb/opencode-plugin init
 * Creates .idumb/ directory structure in user's project
 * ============================================================================
 */

import * as fs from "fs"
import * as path from "path"

const TEMPLATES = {
    state: {
        version: "0.1.0",
        initialized: true,
        sessions: {},
        anchors: [],
    },

    supremeCoordinator: `# Supreme Coordinator Context

## Role
You are the Supreme Coordinator - the highest-level orchestrator.

## Responsibilities
1. **Delegation Only** - Do NOT execute tasks directly
2. **Orchestration** - Route to appropriate specialized agents
3. **Validation** - Verify work before accepting completion
4. **Governance** - Enforce project standards

## Mandatory Behaviors
- Check workflow status before delegating
- Require evidence from delegated agents
- Never skip validation steps
- Maintain hierarchical control

## Delegation Rules
- Use \`task\` tool for sub-agent work
- Include parent context in every delegation
- Specify clear acceptance criteria
`,

    dev: `# Developer Agent Context

## Role
You are a Developer Agent - implementation specialist.

## Responsibilities
1. **Implement Features** - Write clean, tested code
2. **Follow Patterns** - Adhere to project conventions
3. **Test First** - TDD approach when applicable
4. **Document Changes** - Update docs as needed

## Mandatory Behaviors
- Run tests before claiming completion
- Check types with build commands
- Follow existing code patterns

## Scope Limits
- Only implement what was delegated
- Do NOT change architecture without escalation
- Do NOT modify unrelated files
`,

    configExample: `# iDumb Configuration Example
# Copy to .idumb/config.yaml and customize

# Frameworks to wrap
frameworks:
  - name: bmad
    enabled: true
    path: ./_bmad/bmm

# Auto-governance settings  
governance:
  require_verification: true
  auto_anchor_turn_one: true
  
# Custom agent contexts (add .md files to .idumb/contexts/)
# The filename (without .md) is used as the agent name
`,
}

function printBanner() {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   ██╗██████╗ ██╗   ██╗███╗   ███╗██████╗                  ║
║   ██║██╔══██╗██║   ██║████╗ ████║██╔══██╗                 ║
║   ██║██║  ██║██║   ██║██╔████╔██║██████╔╝                 ║
║   ██║██║  ██║██║   ██║██║╚██╔╝██║██╔══██╗                 ║
║   ██║██████╔╝╚██████╔╝██║ ╚═╝ ██║██████╔╝                 ║
║   ╚═╝╚═════╝  ╚═════╝ ╚═╝     ╚═╝╚═════╝                  ║
║                                                           ║
║   OpenCode Meta-Framework Plugin                          ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`)
}

function initProject(targetDir: string) {
    const idumbDir = path.join(targetDir, ".idumb")
    const contextsDir = path.join(idumbDir, "contexts")

    console.log(`\n📁 Initializing iDumb in: ${targetDir}\n`)

    // Create directories
    if (!fs.existsSync(idumbDir)) {
        fs.mkdirSync(idumbDir, { recursive: true })
        console.log("  ✅ Created .idumb/")
    } else {
        console.log("  ⚠️  .idumb/ already exists")
    }

    if (!fs.existsSync(contextsDir)) {
        fs.mkdirSync(contextsDir, { recursive: true })
        console.log("  ✅ Created .idumb/contexts/")
    }

    // Create state.json
    const statePath = path.join(idumbDir, "state.json")
    if (!fs.existsSync(statePath)) {
        fs.writeFileSync(statePath, JSON.stringify(TEMPLATES.state, null, 2))
        console.log("  ✅ Created .idumb/state.json")
    }

    // Create context files
    const scPath = path.join(contextsDir, "supreme-coordinator.md")
    if (!fs.existsSync(scPath)) {
        fs.writeFileSync(scPath, TEMPLATES.supremeCoordinator)
        console.log("  ✅ Created .idumb/contexts/supreme-coordinator.md")
    }

    const devPath = path.join(contextsDir, "dev.md")
    if (!fs.existsSync(devPath)) {
        fs.writeFileSync(devPath, TEMPLATES.dev)
        console.log("  ✅ Created .idumb/contexts/dev.md")
    }

    // Create example config
    const configPath = path.join(idumbDir, "config.example.yaml")
    if (!fs.existsSync(configPath)) {
        fs.writeFileSync(configPath, TEMPLATES.configExample)
        console.log("  ✅ Created .idumb/config.example.yaml")
    }

    // Check if opencode.json exists
    const opencodeJsonPath = path.join(targetDir, "opencode.json")
    if (fs.existsSync(opencodeJsonPath)) {
        try {
            const config = JSON.parse(fs.readFileSync(opencodeJsonPath, "utf8"))
            if (!config.plugin) {
                config.plugin = []
            }
            if (!config.plugin.includes("@idumb/opencode-plugin")) {
                console.log(`
  ℹ️  To activate the plugin, add to your opencode.json:
  
     "plugin": ["@idumb/opencode-plugin"]
`)
            } else {
                console.log("  ✅ Plugin already in opencode.json")
            }
        } catch (e) {
            // Ignore parse errors
        }
    } else {
        console.log(`
  ℹ️  Create opencode.json with:
  
     {
       "$schema": "https://opencode.ai/config.json",
       "plugin": ["@idumb/opencode-plugin"]
     }
`)
    }

    console.log(`
✨ iDumb initialized successfully!

📚 Next steps:
   1. Add plugin to opencode.json (see above)
   2. Customize .idumb/contexts/*.md for your agents
   3. Start OpenCode and the plugin will auto-load

🔧 Available tools for agents:
   - idumb_init     → Get governance context
   - idumb_complete → Record task completion  
   - idumb_anchor   → Save context for compaction survival
`)
}

function showHelp() {
    console.log(`
Usage: idumb <command>

Commands:
  init [dir]    Initialize iDumb in a project directory (default: current)
  help          Show this help message
  
Examples:
  npx @idumb/opencode-plugin init
  npx @idumb/opencode-plugin init ./my-project
`)
}

// Main CLI entry
const args = process.argv.slice(2)
const command = args[0]

printBanner()

switch (command) {
    case "init":
        const targetDir = args[1] || process.cwd()
        initProject(path.resolve(targetDir))
        break
    case "help":
    case "--help":
    case "-h":
        showHelp()
        break
    case undefined:
        console.log("No command specified. Use 'init' to initialize a project.\n")
        showHelp()
        break
    default:
        console.log(`Unknown command: ${command}\n`)
        showHelp()
        process.exit(1)
}
