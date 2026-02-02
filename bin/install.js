#!/usr/bin/env node
/**
 * iDumb Installer - npx @anthropic-ai/idumb
 * 
 * Installs iDumb meta-framework for OpenCode
 * Wraps GSD with hierarchical governance
 */

import { existsSync, mkdirSync, cpSync, readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createInterface } from 'readline';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATE_DIR = join(__dirname, '..', 'template');

// ============================================================================
// CONFIGURATION
// ============================================================================

const OPENCODE_GLOBAL = join(process.env.HOME || '', '.config', 'opencode');
const OPENCODE_LOCAL = join(process.cwd(), '.opencode');
const GSD_REPO = 'https://github.com/glittercowboy/get-shit-done.git';

// ============================================================================
// UTILITIES
// ============================================================================

function print(msg) {
    console.log(msg);
}

function printHeader() {
    print('');
    print('╔════════════════════════════════════════════════════════════╗');
    print('║                      iDumb v0.1.0                          ║');
    print('║    Meta-Framework for OpenCode + GSD Governance            ║');
    print('╚════════════════════════════════════════════════════════════╝');
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
    const hasGSD = existsSync(join(cwd, '.planning')) || 
                   existsSync(join(cwd, 'PROJECT.md')) ||
                   existsSync(join(cwd, 'ROADMAP.md'));
    const hasPackageJson = existsSync(join(cwd, 'package.json'));
    const hasSrc = existsSync(join(cwd, 'src'));
    const hasGit = existsSync(join(cwd, '.git'));
    
    return {
        isProject: hasPackageJson || hasSrc || hasGit,
        hasGSD,
        projectName: hasPackageJson ? 
            JSON.parse(readFileSync(join(cwd, 'package.json'), 'utf8')).name || 'unknown' :
            cwd.split('/').pop()
    };
}

function checkGSDInstalled(targetDir) {
    return existsSync(join(targetDir, 'commands', 'gsd'));
}

// ============================================================================
// INSTALLATION STEPS
// ============================================================================

async function step1_selectLocation() {
    print('STEP 1: Select Installation Location');
    print('─────────────────────────────────────');
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
    print('STEP 2: Analyzing Project');
    print('─────────────────────────');
    
    const detection = detectProject();
    
    if (detection.isProject) {
        print(`  ✓ Project detected: ${detection.projectName}`);
        if (detection.hasGSD) {
            print('  ✓ GSD already installed');
        } else {
            print('  ⚠ GSD not detected');
        }
    } else {
        print('  ⚠ No project detected in current directory');
    }
    
    return detection;
}

async function step3_checkGSD(targetDir) {
    print('');
    print('STEP 3: GSD Framework');
    print('─────────────────────');
    
    const hasGSD = checkGSDInstalled(targetDir);
    
    if (hasGSD) {
        print('  ✓ GSD commands found');
        return true;
    }
    
    print('  ⚠ GSD not installed at target location');
    print('');
    const answer = await prompt('Install GSD now? [y/n]: ', 'n');
    
    if (answer === 'y' || answer === 'yes') {
        print('  Installing GSD...');
        try {
            const isGlobal = targetDir === OPENCODE_GLOBAL;
            const gsdFlags = isGlobal ? '--opencode --global' : '--opencode --local';
            execSync(`npx get-shit-done-cc ${gsdFlags}`, { stdio: 'inherit' });
            print('  ✓ GSD installed');
            return true;
        } catch (e) {
            print('  ✗ GSD installation failed');
            print('    Run manually: npx get-shit-done-cc');
            return false;
        }
    }
    
    print('  Skipping GSD installation');
    print('  Note: iDumb works best with GSD');
    return false;
}

async function step4_installAgents(targetDir) {
    print('');
    print('STEP 4: Installing iDumb Agents');
    print('────────────────────────────────');
    
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
    print('STEP 5: Installing iDumb Commands');
    print('──────────────────────────────────');
    
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
    print('STEP 6: Installing iDumb Tools');
    print('───────────────────────────────');
    
    const toolsDir = join(targetDir, 'tools');
    mkdirSync(toolsDir, { recursive: true });
    
    copyDir(join(TEMPLATE_DIR, 'tools'), toolsDir);
    
    print('  ✓ idumb-state.ts - State management');
    print('  ✓ idumb-validate.ts - Validation runner');
    print('  ✓ idumb-context.ts - Context classification');
    print('  ✓ idumb-config.ts - Configuration management');
    print('  ✓ idumb-manifest.ts - Drift/conflict detection');
    print('  ✓ idumb-chunker.ts - Chunk reading for long docs');
}

async function step7_installPlugin(targetDir) {
    print('');
    print('STEP 7: Installing iDumb Plugin');
    print('────────────────────────────────');
    
    const pluginsDir = join(targetDir, 'plugins');
    mkdirSync(pluginsDir, { recursive: true });
    
    copyDir(join(TEMPLATE_DIR, 'plugins'), pluginsDir);
    
    print('  ✓ idumb-core.ts - Event hooks & orchestration');
}

async function step8_installSkills(targetDir) {
    print('');
    print('STEP 8: Installing iDumb Skills');
    print('────────────────────────────────');
    
    const skillsDir = join(targetDir, 'skills');
    mkdirSync(skillsDir, { recursive: true });
    
    copyDir(join(TEMPLATE_DIR, 'skills'), skillsDir);
    
    print('  ✓ idumb-governance/SKILL.md - Governance protocols');
}

async function step9_createIdumbDir(location) {
    print('');
    print('STEP 9: Creating .idumb Directory & Configuration');
    print('──────────────────────────────────────────────────');
    
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
    
    // Detect GSD phase for initial state
    const detection = detectProject();
    let framework = 'none';
    let phase = 'init';
    let gsdDetected = false;
    
    if (detection.hasGSD) {
        framework = 'gsd';
        gsdDetected = true;
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
            version: '0.1.0',
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
    // Governance values are ALLOWED - they enforce automation and integrate with GSD mode
    const configFile = join(idumbDir, 'config.json');
    if (!existsSync(configFile)) {
        writeFileSync(configFile, JSON.stringify({
            version: '0.1.0',
            // User preferences (line 202) - allowed: "what to call user, language"
            user: {
                name: userName,
                language: {
                    communication: userLanguage,
                    documents: userLanguage
                }
            },
            // Governance settings - ALLOWED: enforces validation/automation, integrates with GSD mode
            // GSD mode: "yolo" → level: "light", mode: "interactive" → level: "moderate"
            governance: {
                level: 'moderate',        // Derived from GSD mode, enforces validation strictness
                expertSkeptic: true,      // Enforces critical thinking, context-first
                autoValidation: true      // Enables automatic governance checks
            },
            // Hierarchical paths (lines 204-210) - required
            paths: {
                state: {
                    brain: '.idumb/brain/state.json',
                    history: '.idumb/brain/history/',
                    anchors: '.idumb/anchors/'
                },
                artifacts: {
                    governance: '.idumb/governance/',
                    validations: '.idumb/governance/validations/'
                },
                context: {
                    codebase: '.idumb/brain/context/codebase.md',
                    sessions: '.idumb/brain/context/sessions.md'
                }
            },
            // GSD hierarchy mapping (mirrors GSD's milestone → phase → plan → task)
            hierarchy: {
                status: ['milestone', 'phase', 'plan', 'task'],
                agents: ['coordinator', 'governor', 'validator', 'builder']
            },
            // GSD framework integration (line 212) - traces to GSD config.json
            frameworks: {
                gsd: {
                    detected: gsdDetected,
                    configPath: '.planning/config.json',
                    syncEnabled: true
                }
            },
            // Staleness detection (line 219, 237) - for stale check
            staleness: {
                warningThresholdHours: 48,
                purgeThresholdHours: 168
            },
            // Timestamp injection settings (line 219)
            timestamps: {
                enabled: true,
                format: 'ISO8601',
                frontmatterInjection: true
            }
        }, null, 2));
    }
    
    print(`  ✓ .idumb/brain/state.json (framework: ${framework}, phase: ${phase})`);
    print(`  ✓ .idumb/config.json (user: ${userName}, lang: ${userLanguage})`);
    print('  ✓ .idumb/governance/');
    print('  ✓ .idumb/anchors/');
    print('  ✓ .idumb/sessions/');
}

async function showComplete(targetDir, location) {
    print('');
    print('════════════════════════════════════════════════════════════════');
    print('                    ✓ INSTALLATION COMPLETE                     ');
    print('════════════════════════════════════════════════════════════════');
    print('');
    
    // Installation summary
    print('INSTALLATION SUMMARY:');
    print('─────────────────────');
    print(`  Location:        ${location.type === 'global' ? 'Global (~/.config/opencode/)' : 'Local (./.opencode/)'}`);
    print(`  Target:          ${targetDir}`);
    print('');
    print('  Components Installed:');
    print('  ├── Agents:     4 (coordinator, governance, validator, builder)');
    print('  ├── Commands:   4 (/idumb:init, :status, :validate, :help)');
    print('  ├── Tools:      6 (state, validate, context, config, manifest, chunker)');
    print('  ├── Plugins:    1 (idumb-core.ts)');
    print('  └── Skills:     1 (idumb-governance/)');
    
    if (location.type === 'local') {
        print('');
        print('  Project Setup:');
        print('  ├── .idumb/config.json         ✓');
        print('  ├── .idumb/brain/state.json    ✓');
        print('  ├── .idumb/governance/         ✓');
        print('  ├── .idumb/sessions/           ✓');
        print('  └── .idumb/anchors/            ✓');
        
        // Read config to show user settings
        const configPath = join(process.cwd(), '.idumb', 'config.json');
        if (existsSync(configPath)) {
            try {
                const config = JSON.parse(readFileSync(configPath, 'utf8'));
                print('');
                print('  User Configuration:');
                print(`  ├── Name:     ${config.user?.name || 'Developer'}`);
                print(`  └── Language: ${config.user?.language?.communication || 'english'}`);
            } catch (e) {
                // Ignore config read errors
            }
        }
    }
    print('');
    
    print('NEXT STEPS:');
    print('───────────');
    print('1. Restart OpenCode to load new agents/commands');
    print('2. Run /idumb:init to complete project setup');
    print('3. Run /idumb:help for available commands');
    print('');
    print('AGENT HIERARCHY:');
    print('─────────────────');
    print('  idumb-supreme-coordinator (primary)');
    print('    └─→ idumb-high-governance (all)');
    print('          ├─→ idumb-low-validator (hidden subagent)');
    print('          └─→ idumb-builder (hidden subagent)');
    print('');
    print('GSD INTEGRATION:');
    print('─────────────────');
    print('  /gsd:* commands work normally');
    print('  iDumb intercepts via plugin hooks');
    print('  Governance state in .idumb/');
    print('  Config syncs with .planning/config.json');
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
        join(targetDir, 'plugins', 'idumb-core.ts'),
        join(targetDir, 'skills', 'idumb-governance'),
    ];
    
    const { rmSync } = await import('fs');
    
    for (const path of toRemove) {
        if (existsSync(path)) {
            try {
                rmSync(path, { recursive: true });
                print(`  ✓ Removed ${path.split('/').slice(-2).join('/')}`);
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
    await step3_checkGSD(location.path);
    
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
    await step9_createIdumbDir(location);
    await showComplete(location.path, location.type);
}

main().catch(e => {
    console.error('Installation failed:', e.message);
    process.exit(1);
});
