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

function prompt(question) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    return new Promise(resolve => {
        rl.question(question, answer => {
            rl.close();
            resolve(answer.trim().toLowerCase());
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
    
    const answer = await prompt('Choose [g/l]: ');
    
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
    const answer = await prompt('Install GSD now? [y/n]: ');
    
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
    print('STEP 9: Creating .idumb Directory');
    print('───────────────────────────────────');
    
    // For global install, don't create .idumb - let plugin create per-project on first use
    if (location.type === 'global') {
        print('  ℹ Global install: .idumb/ will be created per-project when you run /idumb:init');
        return;
    }
    
    const idumbDir = join(process.cwd(), '.idumb');
    const brainDir = join(idumbDir, 'brain');
    const governanceDir = join(idumbDir, 'governance');
    
    mkdirSync(brainDir, { recursive: true });
    mkdirSync(governanceDir, { recursive: true });
    
    // Detect GSD phase for initial state
    const detection = detectProject();
    let framework = 'none';
    let phase = 'init';
    
    if (detection.hasGSD) {
        framework = 'gsd';
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
    
    print(`  ✓ .idumb/brain/state.json (framework: ${framework}, phase: ${phase})`);
    print('  ✓ .idumb/governance/');
}

async function showComplete(targetDir, location) {
    print('');
    print('════════════════════════════════════════════════════════════');
    print('                    ✓ INSTALLATION COMPLETE                 ');
    print('════════════════════════════════════════════════════════════');
    print('');
    print(`Installed to: ${targetDir}`);
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
        const answer = await prompt('Overwrite? [y/n]: ');
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
