#!/usr/bin/env node
/**
 * iDumb Installer
 * 
 * Installs iDumb hierarchical governance framework for OpenCode
 * Archives any existing GSD files during install (replaced by iDumb)
 */

// Node.js version check - require 18+
const nodeVersion = parseInt(process.versions.node.split('.')[0], 10);
if (nodeVersion < 18) {
    console.error('Error: Node.js 18 or higher is required.');
    console.error(`Current version: ${process.versions.node}`);
    console.error('Please upgrade: https://nodejs.org/');
    process.exit(1);
}

import { existsSync, mkdirSync, cpSync, readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname, basename, sep } from 'path';
import { fileURLToPath } from 'url';
import { createInterface } from 'readline';
import { execSync } from 'child_process';
import { homedir } from 'os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATE_DIR = join(__dirname, '..', 'template');

// ============================================================================
// CONFIGURATION
// ============================================================================

const OPENCODE_GLOBAL = join(process.env.HOME || process.env.USERPROFILE || homedir(), '.config', 'opencode');
const OPENCODE_LOCAL = join(process.cwd(), '.opencode');
// GSD_REPO removed - iDumb is standalone framework

// ============================================================================
// UTILITIES
// ============================================================================

function print(msg) {
    console.log(msg);
}

function printHeader() {
    print('');
    print('╔══════════════════════════════════════════════════════════════════╗');
    print('║                                                                  ║');
    print('║   ██╗██████╗ ██╗   ██╗███╗   ███╗██████╗                         ║');
    print('║   ██║██╔══██╗██║   ██║████╗ ████║██╔══██╗                        ║');
    print('║   ██║██║  ██║██║   ██║██╔████╔██║██████╔╝                        ║');
    print('║   ██║██║  ██║██║   ██║██║╚██╔╝██║██╔══██╗                        ║');
    print('║   ██║██████╔╝╚██████╔╝██║ ╚═╝ ██║██████╔╝                        ║');
    print('║   ╚═╝╚═════╝  ╚═════╝ ╚═╝     ╚═╝╚═════╝                         ║');
    print('║                                                                  ║');
    print('║        Hierarchical AI Governance Framework v0.2.0              ║');
    print('║        "Intelligent Delegation Using Managed Boundaries"        ║');
    print('║                                                                  ║');
    print('╚══════════════════════════════════════════════════════════════════╝');
    print('');
}

/**
 * Cross-platform prompt with TTY detection and timeout
 * Falls back to default values in non-interactive environments
 */
function prompt(question, defaultValue = '') {
    // Check if running in non-interactive environment
    if (!process.stdin.isTTY) {
        print(`  [Non-interactive] Using default: ${defaultValue || '(empty)'}`);
        return Promise.resolve(defaultValue);
    }
    
    const rl = createInterface({ 
        input: process.stdin, 
        output: process.stdout,
        terminal: true
    });
    
    return new Promise((resolve) => {
        // 30 second timeout for interactive prompts
        const timeout = setTimeout(() => {
            print(`  [Timeout] Using default: ${defaultValue || '(empty)'}`);
            rl.close();
            resolve(defaultValue);
        }, 30000);
        
        rl.question(question, answer => {
            clearTimeout(timeout);
            rl.close();
            resolve(answer.trim().toLowerCase() || defaultValue);
        });
        
        // Handle stdin close (Ctrl+D)
        rl.on('close', () => {
            clearTimeout(timeout);
        });
        
        // Handle errors gracefully
        rl.on('error', () => {
            clearTimeout(timeout);
            rl.close();
            resolve(defaultValue);
        });
    });
}

function copyDir(src, dest) {
    if (!existsSync(src)) return;
    mkdirSync(dest, { recursive: true });
    
    const entries = readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = join(src, entry.name);
        const destPath = join(dest, entry.name);
        
        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            const content = readFileSync(srcPath, 'utf8');
            writeFileSync(destPath, content);
        }
    }
}

function detectProject() {
    const cwd = process.cwd();
    const hasPlanning = existsSync(join(cwd, '.planning')) || 
                        existsSync(join(cwd, 'PROJECT.md')) ||
                        existsSync(join(cwd, 'ROADMAP.md'));
    const hasPackageJson = existsSync(join(cwd, 'package.json'));
    const hasSrc = existsSync(join(cwd, 'src'));
    const hasGit = existsSync(join(cwd, '.git'));
    
    let projectName = 'unknown';
    if (hasPackageJson) {
        try {
            projectName = JSON.parse(readFileSync(join(cwd, 'package.json'), 'utf8')).name || 'unknown';
        } catch {
            projectName = basename(cwd);
        }
    } else {
        projectName = basename(cwd);
    }
    
    return {
        isProject: hasPackageJson || hasSrc || hasGit,
        hasPlanning,
        projectName
    };
}

// ============================================================================
// INSTALLATION STEPS
// ============================================================================

async function step1_selectLocation() {
    print('');
    print('┌─────────────────────────────────────────────────────────────┐');
    print('│  📍 Step 1/8: Select Installation Location                  │');
    print('└─────────────────────────────────────────────────────────────┘');
    print('');
    print('  [g] Global  (~/.config/opencode/) - Available in all projects');
    print('  [l] Local   (./.opencode/)        - Current project only');
    print('');
    
    const answer = await prompt('Choose [g/l]: ', 'l');
    
    if (answer === 'g' || answer === 'global') {
        return { type: 'global', path: OPENCODE_GLOBAL };
    } else {
        return { type: 'local', path: OPENCODE_LOCAL };
    }
}

async function step2_detectProject() {
    print('');
    print('┌─────────────────────────────────────────────────────────────┐');
    print('│  🔍 Step 2/8: Analyzing Project                             │');
    print('└─────────────────────────────────────────────────────────────┘');
    
    const detection = detectProject();
    
    if (detection.isProject) {
        print(`  ✓ Project detected: ${detection.projectName}`);
        if (detection.hasPlanning) {
            print('  ✓ Planning structure detected');
        } else {
            print('  ⚠ No planning structure detected');
        }
    } else {
        print('  ⚠ No project detected in current directory');
    }
    
    return detection;
}

// step3_checkGSD REMOVED - iDumb is standalone

async function step3_archiveExistingGSD(targetDir) {
    print('');
    print('┌─────────────────────────────────────────────────────────────┐');
    print('│  📦 Step 3/8: Checking for Legacy Files                     │');
    print('└─────────────────────────────────────────────────────────────┘');
    
    const gsdAgents = join(targetDir, 'agents');
    const gsdCommands = join(targetDir, 'commands', 'gsd');
    const gsdDir = join(targetDir, 'get-shit-done');
    
    let archived = [];
    
    const { rmSync } = await import('fs');
    
    // Archive GSD agents if they exist
    if (existsSync(gsdAgents)) {
        const entries = readdirSync(gsdAgents);
        for (const entry of entries) {
            if (entry.startsWith('gsd-')) {
                const archiveDir = join(targetDir, '.gsd-archive', 'agents');
                mkdirSync(archiveDir, { recursive: true });
                const src = join(gsdAgents, entry);
                const dest = join(archiveDir, entry);
                cpSync(src, dest);
                rmSync(src);
                archived.push(`agents/${entry}`);
            }
        }
    }
    
    // Archive GSD commands if they exist
    if (existsSync(gsdCommands)) {
        const archiveDir = join(targetDir, '.gsd-archive', 'commands');
        mkdirSync(archiveDir, { recursive: true });
        cpSync(gsdCommands, join(archiveDir, 'gsd'), { recursive: true });
        rmSync(gsdCommands, { recursive: true });
        archived.push('commands/gsd/');
    }
    
    // Archive get-shit-done directory if it exists
    if (existsSync(gsdDir)) {
        const archiveDir = join(targetDir, '.gsd-archive');
        mkdirSync(archiveDir, { recursive: true });
        cpSync(gsdDir, join(archiveDir, 'get-shit-done'), { recursive: true });
        rmSync(gsdDir, { recursive: true });
        archived.push('get-shit-done/');
    }
    
    if (archived.length > 0) {
        print('  ⚠ GSD files found and archived to .gsd-archive/');
        for (const item of archived) {
            print(`    ✓ Archived: ${item}`);
        }
        print('');
        print('  Note: iDumb replaces GSD. Original files preserved in .gsd-archive/');
    } else {
        print('  ✓ No GSD files to archive');
    }
}

async function step4_installAgents(targetDir) {
    print('');
    print('┌─────────────────────────────────────────────────────────────┐');
    print('│  👤 Step 4/8: Installing iDumb Agents                       │');
    print('└─────────────────────────────────────────────────────────────┘');
    
    const agentsDir = join(targetDir, 'agents');
    mkdirSync(agentsDir, { recursive: true });
    
    copyDir(join(TEMPLATE_DIR, 'agents'), agentsDir);
    
    print('  ✓ idumb-supreme-coordinator.md (mode: primary)');
    print('  ✓ idumb-high-governance.md (mode: all)');
    print('  ✓ idumb-low-validator.md (mode: subagent, hidden)');
    print('  ✓ idumb-builder.md (mode: subagent, hidden)');
}

async function step5_installCommands(targetDir) {
    print('');
    print('┌─────────────────────────────────────────────────────────────┐');
    print('│  🔧 Step 5/8: Installing iDumb Commands                     │');
    print('└─────────────────────────────────────────────────────────────┘');
    
    const commandsDir = join(targetDir, 'commands', 'idumb');
    mkdirSync(commandsDir, { recursive: true });
    
    copyDir(join(TEMPLATE_DIR, 'commands', 'idumb'), commandsDir);
    
    print('  ✓ /idumb:init - Initialize project');
    print('  ✓ /idumb:status - Check governance state');
    print('  ✓ /idumb:validate - Run validation');
    print('  ✓ /idumb:help - Show all commands');
}

async function step6_installTools(targetDir) {
    print('');
    print('┌─────────────────────────────────────────────────────────────┐');
    print('│  🛠️  Step 6/8: Installing iDumb Tools                        │');
    print('└─────────────────────────────────────────────────────────────┘');
    
    const toolsDir = join(targetDir, 'tools');
    mkdirSync(toolsDir, { recursive: true });
    
    copyDir(join(TEMPLATE_DIR, 'tools'), toolsDir);
    
    print('  ✓ idumb-state.ts - State management + sessions');
    print('  ✓ idumb-validate.ts - Validation runner');
    print('  ✓ idumb-context.ts - Context classification');
    print('  ✓ idumb-config.ts - Configuration management');
    print('  ✓ idumb-manifest.ts - Drift/conflict detection');
    print('  ✓ idumb-chunker.ts - Chunk reading for long docs');
    print('  ✓ idumb-todo.ts - Hierarchical TODO management');
    print('  ✓ idumb-todo.ts - Compatibility wrapper for idumb-todo');
}

async function step7_installPlugin(targetDir) {
    print('');
    print('┌─────────────────────────────────────────────────────────────┐');
    print('│  ⚡ Step 7/8: Installing iDumb Plugin                       │');
    print('└─────────────────────────────────────────────────────────────┘');
    
    const pluginsDir = join(targetDir, 'plugins');
    mkdirSync(pluginsDir, { recursive: true });
    
    copyDir(join(TEMPLATE_DIR, 'plugins'), pluginsDir);
    
    print('  ✓ idumb-core.ts - Event hooks & orchestration');
}

async function step8_installSkills(targetDir) {
    print('');
    print('┌─────────────────────────────────────────────────────────────┐');
    print('│  📚 Step 8/8: Installing iDumb Skills                       │');
    print('└─────────────────────────────────────────────────────────────┘');
    
    const skillsDir = join(targetDir, 'skills');
    mkdirSync(skillsDir, { recursive: true });
    
    copyDir(join(TEMPLATE_DIR, 'skills'), skillsDir);
    
    print('  ✓ idumb-governance/SKILL.md - Governance protocols');
}

// step9_installWorkflows REMOVED - iDumb is standalone

// step10_installTemplates REMOVED - iDumb is standalone

// step11_installReferences REMOVED - iDumb is standalone

// step12_installRouter REMOVED - iDumb is standalone

async function step9_createIdumbDir(location) {
    print('');
    print('┌─────────────────────────────────────────────────────────────┐');
    print('│  ⚙️  Configuration: Creating .idumb Directory                │');
    print('└─────────────────────────────────────────────────────────────┘');
    
    // For global install, don't create .idumb - let plugin create per-project on first use
    if (location.type === 'global') {
        print('  ℹ Global install: .idumb/ will be created per-project when you run /idumb:init');
        return;
    }
    
    const idumbDir = join(process.cwd(), '.idumb');
    const brainDir = join(idumbDir, 'brain');
    const governanceDir = join(idumbDir, 'governance');
    const historyDir = join(brainDir, 'history');
    const contextDir = join(brainDir, 'context');
    const validationsDir = join(governanceDir, 'validations');
    const anchorsDir = join(idumbDir, 'anchors');
    const sessionsDir = join(idumbDir, 'sessions');
    
    // Create all hierarchy paths
    mkdirSync(brainDir, { recursive: true });
    mkdirSync(historyDir, { recursive: true });
    mkdirSync(contextDir, { recursive: true });
    mkdirSync(governanceDir, { recursive: true });
    mkdirSync(validationsDir, { recursive: true });
    mkdirSync(anchorsDir, { recursive: true });
    mkdirSync(sessionsDir, { recursive: true });
    
    // Interactive configuration (interactive mode only)
    let userName = 'Developer';
    let userLanguage = 'english';
    
    if (process.stdin.isTTY) {
        print('');
        print('  User Configuration (press Enter for defaults):');
        print('');
        
        // Ask for user name
        const nameAnswer = await prompt('  Your name [Developer]: ', 'Developer');
        userName = nameAnswer || 'Developer';
        
        // Show language options
        print('');
        print('  Available languages:');
        print('    [1] English');
        print('    [2] Vietnamese');
        print('    [3] Japanese');
        print('    [4] Chinese (Simplified)');
        print('    [5] Spanish');
        print('');
        
        const langAnswer = await prompt('  Choose language [1]: ', '1');
        const langMap = {
            '1': 'english',
            '2': 'vietnamese',
            '3': 'japanese',
            '4': 'chinese',
            '5': 'spanish',
            'english': 'english',
            'vietnamese': 'vietnamese',
            'japanese': 'japanese',
            'chinese': 'chinese',
            'spanish': 'spanish'
        };
        userLanguage = langMap[langAnswer.toLowerCase()] || 'english';
        print('');
    }
    
    // Detect planning structure for initial state
    const detection = detectProject();
    let framework = 'none';
    let phase = 'init';
    let planningDetected = false;
    
    if (detection.hasPlanning) {
        framework = 'planning';
        planningDetected = true;
        // Try to read phase from .planning/STATE.md
        const stateMdPath = join(process.cwd(), '.planning', 'STATE.md');
        if (existsSync(stateMdPath)) {
            try {
                const content = readFileSync(stateMdPath, 'utf8');
                const phaseMatch = content.match(/Phase:\s*\[(\d+)\]\s*of\s*\[(\d+)\]\s*\(([^)]+)\)/i);
                if (phaseMatch) {
                    phase = `${phaseMatch[1]}/${phaseMatch[2]} (${phaseMatch[3]})`;
                }
            } catch (e) {
                // Ignore read errors
            }
        }
    }
    
    // Create initial state file
    const stateFile = join(brainDir, 'state.json');
    if (!existsSync(stateFile)) {
        writeFileSync(stateFile, JSON.stringify({
            version: '0.2.0',
            initialized: new Date().toISOString(),
            framework: framework,
            phase: phase,
            lastValidation: null,
            validationCount: 0,
            anchors: [],
            history: []
        }, null, 2));
    }
    
    // Create config file with hierarchical paths
    // Governance values enforce automation and integrate with planning structure
    const configFile = join(idumbDir, 'config.json');
    if (!existsSync(configFile)) {
        // Default to 'guided' experience (safest for new users)
        const experience = 'guided';
        
        // Automation settings derived from experience level
        const automationSettings = {
            mode: 'confirmRequired',
            expertSkeptic: {
                enabled: true,
                requireEvidence: true,
                doubleCheckDelegation: true
            },
            contextFirst: {
                enforced: true,
                requiredFirstTools: ['idumb-todo', 'idumb-state'],
                blockWithoutContext: true
            },
            workflow: {
                research: true,
                planCheck: true,
                verifyAfterExecution: true,
                commitOnComplete: true
            }
        };
        
        writeFileSync(configFile, JSON.stringify({
            version: '0.2.0',
            initialized: new Date().toISOString(),
            lastModified: new Date().toISOString(),
            
            user: {
                name: userName,
                experience: experience,
                language: {
                    communication: userLanguage,
                    documents: userLanguage
                }
            },
            
            status: {
                current: {
                    milestone: null,
                    phase: phase,
                    plan: null,
                    task: null
                },
                lastValidation: null,
                validationsPassed: 0,
                driftDetected: false
            },
            
            hierarchy: {
                levels: ['milestone', 'phase', 'plan', 'task'],
                agents: {
                    order: ['coordinator', 'governance', 'validator', 'builder'],
                    permissions: {
                        coordinator: { delegate: true, execute: false, validate: false },
                        governance: { delegate: true, execute: false, validate: true },
                        validator: { delegate: false, execute: false, validate: true },
                        builder: { delegate: false, execute: true, validate: false }
                    }
                },
                enforceChain: true,
                blockOnChainBreak: true
            },
            
            automation: automationSettings,
            
            paths: {
                config: '.idumb/config.json',
                state: '.idumb/brain/state.json',
                brain: '.idumb/brain/',
                history: '.idumb/brain/history/',
                context: '.idumb/brain/context/',
                governance: '.idumb/governance/',
                validations: '.idumb/governance/validations/',
                anchors: '.idumb/anchors/',
                sessions: '.idumb/sessions/',
                planning: '.planning/',
                roadmap: '.planning/ROADMAP.md',
                planningState: '.planning/STATE.md'
            },
            
            staleness: {
                warningHours: 48,
                criticalHours: 168,
                checkOnLoad: true,
                autoArchive: false
            },
            
            timestamps: {
                enabled: true,
                format: 'ISO8601',
                injectInFrontmatter: true,
                trackModifications: true
            },
            
            enforcement: {
                mustLoadConfig: true,
                mustHaveState: true,
                mustCheckHierarchy: true,
                blockOnMissingArtifacts: false,
                requirePhaseAlignment: true
            }
        }, null, 2));
    }
    
    print(`  ✓ .idumb/brain/state.json (v0.2.0, framework: ${framework}, phase: ${phase})`);
    print(`  ✓ .idumb/config.json (v0.2.0, user: ${userName}, experience: guided)`);
    print('  ✓ .idumb/governance/');
    print('  ✓ .idumb/anchors/');
    print('  ✓ .idumb/sessions/');
}

async function showComplete(targetDir, location) {
    print('');
    print('╔══════════════════════════════════════════════════════════════════╗');
    print('║                    ✅ INSTALLATION SUCCESSFUL                    ║');
    print('╚══════════════════════════════════════════════════════════════════╝');
    print('');
    print('  📍 Location: ' + (location.type === 'global' ? 'Global (~/.config/opencode/)' : 'Local (./.opencode/)'));
    print('');
    print('  📦 Components Installed:');
    print('  ├── 👤 Agents     4  (coordinator, governance, validator, builder)');
    print('  ├── 🔧 Commands   5  (/idumb:init, :status, :config, :validate, :help)');
    print('  ├── 🛠️  Tools      8  (state, validate, context, config, manifest, chunker, todo, idumb-todo)');
    print('  ├── ⚡ Plugins    1  (idumb-core.ts)');
    print('  └── 📚 Skills     1  (idumb-governance/)');
    print('');
    
    // Read config to show user settings for local install
    if (location.type === 'local') {
        const configPath = join(process.cwd(), '.idumb', 'config.json');
        let userName = 'Developer';
        let userLang = 'english';
        if (existsSync(configPath)) {
            try {
                const config = JSON.parse(readFileSync(configPath, 'utf8'));
                userName = config.user?.name || 'Developer';
                userLang = config.user?.language?.communication || 'english';
            } catch (e) { /* ignore */ }
        }
        print('  ⚙️  Configuration:');
        print('  ├── Experience: guided (default - AI explains before actions)');
        print(`  ├── Language:   ${userLang.charAt(0).toUpperCase() + userLang.slice(1)} (communication & documents)`);
        print('  └── Config:     .idumb/config.json');
        print('');
    }
    
    print('  🚀 Quick Start:');
    print('  ┌────────────────────────────────────────────────────────────┐');
    print('  │  /idumb:init              # Initialize in your project    │');
    print('  │  /idumb:config            # View/edit settings            │');
    print('  │  /idumb:help              # Show all commands             │');
    print('  └────────────────────────────────────────────────────────────┘');
    print('');
    print('  📖 Documentation:');
    print('  ├── English:    https://github.com/shynlee04/idumb-plugin#readme');
    print('  └── Tiếng Việt: https://github.com/shynlee04/idumb-plugin/blob/main/README.vi.md');
    print('');
}

// ============================================================================
// UNINSTALL
// ============================================================================

async function uninstall(targetDir) {
    print('');
    print('Uninstalling iDumb...');
    print('');
    
    const toRemove = [
        join(targetDir, 'agents', 'idumb-supreme-coordinator.md'),
        join(targetDir, 'agents', 'idumb-high-governance.md'),
        join(targetDir, 'agents', 'idumb-low-validator.md'),
        join(targetDir, 'agents', 'idumb-builder.md'),
        join(targetDir, 'commands', 'idumb'),
        join(targetDir, 'tools', 'idumb-state.ts'),
        join(targetDir, 'tools', 'idumb-validate.ts'),
        join(targetDir, 'tools', 'idumb-context.ts'),
        join(targetDir, 'tools', 'idumb-config.ts'),
        join(targetDir, 'tools', 'idumb-manifest.ts'),
        join(targetDir, 'tools', 'idumb-chunker.ts'),
        join(targetDir, 'tools', 'idumb-todo.ts'),
        join(targetDir, 'plugins', 'idumb-core.ts'),
        join(targetDir, 'skills', 'idumb-governance'),
    ];
    
    const { rmSync } = await import('fs');
    
    for (const path of toRemove) {
        if (existsSync(path)) {
            try {
                rmSync(path, { recursive: true });
                // Cross-platform path display
                const displayPath = path.split(sep).slice(-2).join('/');
                print(`  ✓ Removed ${displayPath}`);
            } catch (e) {
                print(`  ✗ Failed to remove ${path}`);
            }
        }
    }
    
    print('');
    print('✓ iDumb uninstalled');
    print('Note: .idumb/ directory preserved (contains state)');
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
    const args = process.argv.slice(2);
    
    // Handle flags
    const isGlobal = args.includes('--global') || args.includes('-g');
    const isLocal = args.includes('--local') || args.includes('-l');
    const isUninstall = args.includes('--uninstall');
    
    printHeader();
    
    // Determine target
    let location;
    if (isGlobal) {
        location = { type: 'global', path: OPENCODE_GLOBAL };
    } else if (isLocal) {
        location = { type: 'local', path: OPENCODE_LOCAL };
    } else {
        location = await step1_selectLocation();
    }
    
    // Uninstall
    if (isUninstall) {
        await uninstall(location.path);
        return;
    }
    
    // Install steps
    await step2_detectProject();
    await step3_archiveExistingGSD(location.path);
    
    // Check for existing installation
    const existingAgent = join(location.path, 'agents', 'idumb-supreme-coordinator.md');
    if (existsSync(existingAgent)) {
        print('');
        print('⚠ Existing iDumb installation detected');
        const answer = await prompt('Overwrite? [y/n]: ', 'n');
        if (answer !== 'y' && answer !== 'yes') {
            print('Installation cancelled.');
            return;
        }
        print('  Upgrading existing installation...');
    }
    
    await step4_installAgents(location.path);
    await step5_installCommands(location.path);
    await step6_installTools(location.path);
    await step7_installPlugin(location.path);
    await step8_installSkills(location.path);
    // step9-12 REMOVED - standalone framework, no GSD dependency
    await step9_createIdumbDir(location);
    await showComplete(location.path, location);
}

main().catch(e => {
    console.error('Installation failed:', e.message);
    process.exit(1);
});
