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
const SRC_DIR = join(__dirname, '..', 'src');

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
// i18n LOCALIZATION
// ============================================================================

import i18n from './i18n/index.js';
const { t, setLocale, getLocale } = i18n;

// ============================================================================
// INSTALLATION STEPS
// ============================================================================

/**
 * Step 0: Language Selection (MUST BE FIRST)
 * This sets the language for all subsequent installer output AND
 * configures the agent language enforcement
 */
async function step0_selectLanguage() {
    print('');
    print('┌─────────────────────────────────────────────────────────────┐');
    print('│  🌐 Select Language / Chọn Ngôn Ngữ                         │');
    print('└─────────────────────────────────────────────────────────────┘');
    print('');
    print('  [1] English');
    print('  [2] Tiếng Việt');
    print('');

    const answer = await prompt('Choose / Chọn [1-2]: ', '1');

    if (answer === '2' || answer === 'vi' || answer === 'vietnamese') {
        setLocale('vi');
        return 'vi';
    } else {
        setLocale('en');
        return 'en';
    }
}

/**
 * Step 0b: Show Introduction
 * Explains what iDumb is and its core concepts
 */
async function step0b_showIntroduction() {
    const intro = getLocale() === 'vi'
        ? {
            title: 'iDumb là gì?',
            desc: 'iDumb là meta-framework giúp AI agents:',
            features: [
                { icon: '✦', name: 'PHÂN CẤP', desc: 'Ủy quyền 4 tầng (Supreme → High → Mid → Low)' },
                { icon: '✦', name: 'QUẢN TRỊ', desc: 'Bảo đảm chuỗi, không lỗi thầm lặng, leo thang' },
                { icon: '✦', name: 'NHẬN THỨC NGỮ CẢNH', desc: 'Bộ làm việc tinh lọc, ít token' },
                { icon: '✦', name: 'THÔNG MINH', desc: 'Quyết định cấp chuyên gia cho mọi user' }
            ],
            conceptsTitle: 'Khái niệm cốt lõi:',
            concepts: [
                'Supreme Coordinator → điều phối toàn bộ',
                'Checkpoints → không bao giờ mất tiến độ',
                'Chain Rules → ngăn quá tải lệnh',
                'Stall Detection → leo thang, không loop mãi'
            ],
            continuePrompt: 'Nhấn Enter để tiếp tục...'
        }
        : {
            title: 'What is iDumb?',
            desc: 'iDumb is a meta-framework that makes AI agents:',
            features: [
                { icon: '✦', name: 'HIERARCHICAL', desc: '4-tier agent delegation (Supreme → High → Mid → Low)' },
                { icon: '✦', name: 'GOVERNED', desc: 'Chain enforcement, never silent failure, escalation' },
                { icon: '✦', name: 'CONTEXT-AWARE', desc: 'Purified working set, minimal tokens' },
                { icon: '✦', name: 'INTELLIGENT', desc: 'Expert-level decisions for all users' }
            ],
            conceptsTitle: 'Core Concepts:',
            concepts: [
                'Supreme Coordinator → orchestrates all work',
                'Checkpoints → never lose progress',
                'Chain Rules → prevent command overload',
                'Stall Detection → escalate, never loop forever'
            ],
            continuePrompt: 'Press Enter to continue...'
        };

    print('');
    print('┌─────────────────────────────────────────────────────────────┐');
    print(`│  📖 ${intro.title.padEnd(54)}│`);
    print('├─────────────────────────────────────────────────────────────┤');
    print('│                                                             │');
    print(`│  ${intro.desc.padEnd(58)}│`);
    print('│                                                             │');

    for (const feature of intro.features) {
        print(`│  ${feature.icon} ${feature.name.padEnd(18)} ${feature.desc.slice(0, 35)}│`);
    }

    print('│                                                             │');
    print(`│  📚 ${intro.conceptsTitle.padEnd(54)}│`);

    for (const concept of intro.concepts) {
        print(`│  • ${concept.padEnd(56)}│`);
    }

    print('│                                                             │');
    print('└─────────────────────────────────────────────────────────────┘');
    print('');

    await prompt(intro.continuePrompt, '');
}

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
    print('│  👤 Step 4/8: Installing iDumb Agents (18)                  │');
    print('└─────────────────────────────────────────────────────────────┘');

    const agentsDir = join(targetDir, 'agents');
    mkdirSync(agentsDir, { recursive: true });

    copyDir(join(SRC_DIR, 'agents'), agentsDir);

    print('  Tier 1 (primary):');
    print('    ✓ idumb-supreme-coordinator.md');
    print('  Tier 2 (orchestrators):');
    print('    ✓ idumb-high-governance.md, idumb-mid-coordinator.md');
    print('  Tier 3 (specialists):');
    print('    ✓ idumb-planner.md, idumb-plan-checker.md, idumb-executor.md');
    print('    ✓ idumb-verifier.md, idumb-skeptic-validator.md, idumb-debugger.md');
    print('    ✓ idumb-roadmapper.md, idumb-codebase-mapper.md');
    print('    ✓ idumb-phase-researcher.md, idumb-project-researcher.md');
    print('    ✓ idumb-research-synthesizer.md, idumb-project-explorer.md');
    print('  Tier 4 (workers):');
    print('    ✓ idumb-low-validator.md, idumb-builder.md, idumb-integration-checker.md');
}

async function step5_installCommands(targetDir) {
    print('');
    print('┌─────────────────────────────────────────────────────────────┐');
    print('│  🔧 Step 5/8: Installing iDumb Commands (15)                │');
    print('└─────────────────────────────────────────────────────────────┘');

    const commandsDir = join(targetDir, 'commands', 'idumb');
    mkdirSync(commandsDir, { recursive: true });

    copyDir(join(SRC_DIR, 'commands', 'idumb'), commandsDir);

    print('  Core:');
    print('    ✓ /idumb:init, /idumb:status, /idumb:config, /idumb:help');
    print('  Project Setup:');
    print('    ✓ /idumb:new-project, /idumb:map-codebase, /idumb:roadmap');
    print('  Research & Planning:');
    print('    ✓ /idumb:research, /idumb:discuss-phase, /idumb:plan-phase');
    print('  Execution & Verification:');
    print('    ✓ /idumb:execute-phase, /idumb:verify-work, /idumb:validate');
    print('  Utilities:');
    print('    ✓ /idumb:debug, /idumb:resume');
}

async function step6_installTools(targetDir) {
    print('');
    print('┌─────────────────────────────────────────────────────────────┐');
    print('│  🛠️  Step 6/8: Installing iDumb Tools (7)                    │');
    print('└─────────────────────────────────────────────────────────────┘');

    const toolsDir = join(targetDir, 'tools');
    mkdirSync(toolsDir, { recursive: true });

    copyDir(join(SRC_DIR, 'tools'), toolsDir);

    print('  ✓ idumb-state.ts - State management + sessions');
    print('  ✓ idumb-validate.ts - Validation runner');
    print('  ✓ idumb-context.ts - Context classification');
    print('  ✓ idumb-config.ts - Configuration management');
    print('  ✓ idumb-manifest.ts - Drift/conflict detection');
    print('  ✓ idumb-chunker.ts - Chunk reading for long docs');
    print('  ✓ idumb-todo.ts - Hierarchical TODO management');
}

async function step7_installPlugin(targetDir) {
    print('');
    print('┌─────────────────────────────────────────────────────────────┐');
    print('│  ⚡ Step 7/8: Installing iDumb Plugin                       │');
    print('└─────────────────────────────────────────────────────────────┘');

    const pluginsDir = join(targetDir, 'plugins');
    mkdirSync(pluginsDir, { recursive: true });

    copyDir(join(SRC_DIR, 'plugins'), pluginsDir);

    print('  ✓ idumb-core.ts - Event hooks & orchestration');
    print('  ✓ lib/ modules:');
    print('    ├── types.ts - Shared interfaces');
    print('    ├── logging.ts - File logging');
    print('    ├── state.ts - State management');
    print('    ├── checkpoint.ts - Checkpoint CRUD');
    print('    ├── execution-metrics.ts - Stall detection');
    print('    ├── chain-rules.ts - Chain enforcement');
    print('    ├── session-tracker.ts - Session tracking');
    print('    ├── governance-builder.ts - Context building');
    print('    ├── schema-validator.ts - Runtime validation');
    print('    └── index.ts - Barrel export');
}

async function step8_installSkills(targetDir) {
    print('');
    print('┌─────────────────────────────────────────────────────────────┐');
    print('│  📚 Step 8/8: Installing iDumb Skills                       │');
    print('└─────────────────────────────────────────────────────────────┘');

    const skillsDir = join(targetDir, 'skills');
    mkdirSync(skillsDir, { recursive: true });

    copyDir(join(SRC_DIR, 'skills'), skillsDir);

    // All 3 skills with their full directory structures
    print('  ✓ hierarchical-mindfulness/');
    print('    ├── SKILL.md');
    print('    ├── examples/ (3 files: chain-recovery, resumed-session, valid-delegation)');
    print('    └── references/ (4 files: agent-hierarchy, chain-enforcement, mindfulness-protocols, session-tracking)');
    print('  ✓ idumb-governance/');
    print('    └── SKILL.md - Governance protocols');
    print('  ✓ idumb-meta-builder/');
    print('    ├── SKILL.md + INDEX.md');
    print('    ├── examples/ (3 files: bmad-to-idumb, pattern-extraction, spec-to-module)');
    print('    ├── references/ (8 files: classification-tree, drift-detection, framework-patterns, ...)');
    print('    ├── scripts/ (3 files: ingest-framework, transform-agent, validate-module)');
    print('    └── templates/ (3 files: agent-template, MODULE_INDEX, workflow-template)');
}

async function step8b_installWorkflows(targetDir) {
    print('');
    print('┌─────────────────────────────────────────────────────────────┐');
    print('│  📋 Installing iDumb Workflows (9)                          │');
    print('└─────────────────────────────────────────────────────────────┘');

    const workflowsDir = join(targetDir, 'workflows');
    mkdirSync(workflowsDir, { recursive: true });

    copyDir(join(SRC_DIR, 'workflows'), workflowsDir);

    print('  ✓ discuss-phase.md, execute-phase.md, plan-phase.md');
    print('  ✓ map-codebase.md, research.md, resume-project.md');
    print('  ✓ roadmap.md, transition.md, verify-phase.md');
}

async function step8c_installTemplates(targetDir) {
    print('');
    print('┌─────────────────────────────────────────────────────────────┐');
    print('│  📄 Installing iDumb Templates (12)                         │');
    print('└─────────────────────────────────────────────────────────────┘');

    const templatesDir = join(targetDir, 'templates');
    mkdirSync(templatesDir, { recursive: true });

    copyDir(join(SRC_DIR, 'templates'), templatesDir);

    print('  ✓ codebase/ - architecture.md, conventions.md, stack.md, structure.md');
    print('  ✓ Core: config.md, context.md, continue-here.md, plan.md');
    print('  ✓ State: state.md, summary.md, verification.md, milestone-summary.md');
}

async function step8d_installRouter(targetDir) {
    print('');
    print('┌─────────────────────────────────────────────────────────────┐');
    print('│  🔀 Installing iDumb Router Rules (3)                       │');
    print('└─────────────────────────────────────────────────────────────┘');

    const routerDir = join(targetDir, 'router');
    mkdirSync(routerDir, { recursive: true });

    copyDir(join(SRC_DIR, 'router'), routerDir);

    print('  ✓ chain-enforcement.md - Chain validation rules');
    print('  ✓ routing-rules.md - Agent routing logic');
    print('  ✓ SESSION-STATES-GOVERNANCE.md - Session state machine');
}

async function step8e_installConfig(targetDir) {
    print('');
    print('┌─────────────────────────────────────────────────────────────┐');
    print('│  ⚙️  Installing iDumb Config (2)                             │');
    print('└─────────────────────────────────────────────────────────────┘');

    const configDir = join(targetDir, 'config');
    mkdirSync(configDir, { recursive: true });

    copyDir(join(SRC_DIR, 'config'), configDir);

    print('  ✓ completion-definitions.yaml - Completion criteria');
    print('  ✓ deny-rules.yaml - Permission deny rules');
}

async function step8f_installSchemas(targetDir) {
    print('');
    print('┌─────────────────────────────────────────────────────────────┐');
    print('│  📐 Installing iDumb Schemas (2)                            │');
    print('└─────────────────────────────────────────────────────────────┘');

    const schemasDir = join(targetDir, 'schemas');
    mkdirSync(schemasDir, { recursive: true });

    copyDir(join(SRC_DIR, 'schemas'), schemasDir);

    print('  ✓ brain-state-schema.json - State validation');
    print('  ✓ checkpoint-schema.json - Checkpoint validation');
}

async function step9_createIdumbDir(location, selectedLanguage = 'en') {
    const stepTitle = getLocale() === 'vi'
        ? '⚙️  Cấu hình: Tạo Thư Mục iDumb'
        : '⚙️  Configuration: Creating iDumb Directories';

    print('');
    print('┌─────────────────────────────────────────────────────────────┐');
    print(`│  ${stepTitle.padEnd(58)}│`);
    print('└─────────────────────────────────────────────────────────────┘');

    // For global install, don't create directories - let plugin create per-project on first use
    if (location.type === 'global') {
        const globalMsg = getLocale() === 'vi'
            ? '  ℹ Cài đặt toàn cục: Thư mục sẽ được tạo khi chạy /idumb:init'
            : '  ℹ Global install: Directories will be created per-project when you run /idumb:init';
        print(globalMsg);
        return;
    }

    const cwd = process.cwd();

    // NEW DIRECTORY STRUCTURE
    // .idumb-brain/ - AI governance memory
    const brainDir = join(cwd, '.idumb-brain');
    const brainSessionsDir = join(brainDir, 'sessions');
    const brainContextDir = join(brainDir, 'context');
    const brainGovernanceDir = join(brainDir, 'governance');
    const brainDriftDir = join(brainDir, 'drift');

    // .idumb-project-output/ - Project artifacts (replaces .plan/)
    const outputDir = join(cwd, '.idumb-project-output');
    const outputPhasesDir = join(outputDir, 'phases');
    const outputArtifactsDir = join(outputDir, 'artifacts');

    // Create .idumb-brain/ structure
    mkdirSync(brainDir, { recursive: true });
    mkdirSync(brainSessionsDir, { recursive: true });
    mkdirSync(brainContextDir, { recursive: true });
    mkdirSync(brainGovernanceDir, { recursive: true });
    mkdirSync(brainDriftDir, { recursive: true });

    // Create .idumb-project-output/ structure
    mkdirSync(outputDir, { recursive: true });
    mkdirSync(outputPhasesDir, { recursive: true });
    mkdirSync(outputArtifactsDir, { recursive: true });

    // Get user name (ask only if interactive)
    let userName = 'Developer';
    if (process.stdin.isTTY) {
        const namePrompt = getLocale() === 'vi' ? '  Tên của bạn [Developer]: ' : '  Your name [Developer]: ';
        const nameAnswer = await prompt(namePrompt, 'Developer');
        userName = nameAnswer || 'Developer';
    }

    // Map language code to full name
    const languageMap = { 'en': 'english', 'vi': 'vietnamese' };
    const userLanguage = languageMap[selectedLanguage] || 'english';

    // Detect existing planning structure
    const detection = detectProject();
    let framework = 'none';
    let phase = 'init';

    if (detection.hasPlanning) {
        framework = 'planning';
        const stateMdPath = join(cwd, '.planning', 'STATE.md');
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

    // Create state.json in .idumb-brain/
    const stateFile = join(brainDir, 'state.json');
    if (!existsSync(stateFile)) {
        writeFileSync(stateFile, JSON.stringify({
            version: '0.3.0',
            initialized: new Date().toISOString(),
            framework: framework,
            phase: phase,
            session: {
                current: null,
                count: 0
            },
            governance: {
                level: 'strict',
                autoExpert: 'default',
                research: 'comprehensive'
            },
            lastValidation: null,
            validationCount: 0,
            anchors: [],
            history: []
        }, null, 2));
    }

    // Create config.json in .idumb-brain/
    const configFile = join(brainDir, 'config.json');
    if (!existsSync(configFile)) {
        writeFileSync(configFile, JSON.stringify({
            version: '0.3.0',
            initialized: new Date().toISOString(),
            lastModified: new Date().toISOString(),

            user: {
                name: userName,
                experience: 'guided',
                language: {
                    communication: userLanguage,
                    documents: userLanguage,
                    enforceAgentLanguage: true
                }
            },

            governance: {
                level: 'strict',
                autoExpert: 'default',
                research: 'comprehensive'
            },

            hierarchy: {
                levels: ['milestone', 'phase', 'plan', 'task'],
                agents: {
                    tiers: ['supreme', 'high', 'mid', 'low'],
                    enforceChain: true,
                    blockOnChainBreak: true
                }
            },

            paths: {
                brain: '.idumb-brain/',
                state: '.idumb-brain/state.json',
                config: '.idumb-brain/config.json',
                sessions: '.idumb-brain/sessions/',
                context: '.idumb-brain/context/',
                governance: '.idumb-brain/governance/',
                drift: '.idumb-brain/drift/',
                output: '.idumb-project-output/',
                phases: '.idumb-project-output/phases/',
                artifacts: '.idumb-project-output/artifacts/'
            },

            staleness: {
                warningHours: 48,
                criticalHours: 168,
                checkOnLoad: true,
                autoArchive: false
            },

            enforcement: {
                mustLoadConfig: true,
                mustHaveState: true,
                mustCheckHierarchy: true,
                blockOnMissingArtifacts: false,
                requirePhaseAlignment: true,
                noNumericIterationLimits: true
            }
        }, null, 2));
    }

    // Create PROJECT.md template in .idumb-project-output/
    const projectFile = join(outputDir, 'PROJECT.md');
    if (!existsSync(projectFile)) {
        const projectContent = `---
id: project_${Date.now()}
created: ${new Date().toISOString()}
modified: ${new Date().toISOString()}
status: draft
---

# ${detection.projectName || 'Project Name'}

## Overview

<!-- Project description -->

## Goals

<!-- Primary objectives -->

## Stack

<!-- Technologies, frameworks, dependencies -->
`;
        writeFileSync(projectFile, projectContent);
    }

    // Output summary
    print('');
    print('  ✓ .idumb-brain/');
    print('    ├── state.json');
    print('    ├── config.json');
    print('    ├── sessions/');
    print('    ├── context/');
    print('    ├── governance/');
    print('    └── drift/');
    print('  ✓ .idumb-project-output/');
    print('    ├── PROJECT.md');
    print('    ├── phases/');
    print('    └── artifacts/');
}

async function showComplete(targetDir, location, selectedLanguage = 'en') {
    const isVi = getLocale() === 'vi';

    print('');
    print('╔══════════════════════════════════════════════════════════════════╗');
    print(isVi
        ? '║                    ✅ CÀI ĐẶT THÀNH CÔNG                         ║'
        : '║                    ✅ INSTALLATION SUCCESSFUL                    ║');
    print('╚══════════════════════════════════════════════════════════════════╝');
    print('');
    print('  📍 ' + (isVi ? 'Vị trí: ' : 'Location: ') +
        (location.type === 'global' ? 'Global (~/.config/opencode/)' : 'Local (./.opencode/)'));
    print('');
    print(isVi ? '  📦 Thành Phần Đã Cài:' : '  📦 Components Installed:');
    print(isVi
        ? '  ├── 👤 Agents    18  (phân cấp 4 tầng: coordinator → governance → specialists → workers)'
        : '  ├── 👤 Agents    18  (4-tier hierarchy: coordinator → governance → specialists → workers)');
    print(isVi
        ? '  ├── 🔧 Commands  15  (/idumb:init, :status, :new-project, :roadmap, :research, ...)'
        : '  ├── 🔧 Commands  15  (/idumb:init, :status, :new-project, :roadmap, :research, ...)');
    print(isVi
        ? '  ├── 🛠️  Tools      7  (state, validate, context, config, manifest, chunker, todo)'
        : '  ├── 🛠️  Tools      7  (state, validate, context, config, manifest, chunker, todo)');
    print(isVi
        ? '  ├── ⚡ Plugins    1  (idumb-core.ts + 10 lib/ modules)'
        : '  ├── ⚡ Plugins    1  (idumb-core.ts + 10 lib/ modules)');
    print(isVi
        ? '  └── 📚 Skills     3  (hierarchical-mindfulness, idumb-governance, idumb-meta-builder)'
        : '  └── 📚 Skills     3  (hierarchical-mindfulness, idumb-governance, idumb-meta-builder)');
    print('');

    // Read config to show user settings for local install
    if (location.type === 'local') {
        // Updated to new path: .idumb-brain/config.json
        const configPath = join(process.cwd(), '.idumb-brain', 'config.json');
        let userName = 'Developer';
        let userLang = selectedLanguage === 'vi' ? 'vietnamese' : 'english';
        if (existsSync(configPath)) {
            try {
                const config = JSON.parse(readFileSync(configPath, 'utf8'));
                userName = config.user?.name || 'Developer';
                userLang = config.user?.language?.communication || userLang;
            } catch (e) { /* ignore */ }
        }
        print(isVi ? '  ⚙️  Cấu Hình:' : '  ⚙️  Configuration:');
        print(isVi
            ? '  ├── Experience: guided (mặc định - AI giải thích trước hành động)'
            : '  ├── Experience: guided (default - AI explains before actions)');
        print(`  ├── ${isVi ? 'Ngôn ngữ' : 'Language'}:   ${userLang.charAt(0).toUpperCase() + userLang.slice(1)}`);
        print(`  └── Config:     .idumb-brain/config.json`);
        print('');
    }

    print(isVi ? '  🚀 Bắt Đầu:' : '  🚀 Quick Start:');
    print('  ┌────────────────────────────────────────────────────────────┐');
    print(isVi
        ? '  │  /idumb:init              # Khởi tạo trong dự án của bạn   │'
        : '  │  /idumb:init              # Initialize in your project    │');
    print(isVi
        ? '  │  /idumb:config            # Xem/sửa cài đặt               │'
        : '  │  /idumb:config            # View/edit settings            │');
    print(isVi
        ? '  │  /idumb:help              # Hiển thị tất cả lệnh          │'
        : '  │  /idumb:help              # Show all commands             │');
    print('  └────────────────────────────────────────────────────────────┘');
    print('');
    print(isVi ? '  📖 Tài Liệu:' : '  📖 Documentation:');
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
        join(targetDir, 'plugins', 'lib'),
        join(targetDir, 'skills', 'idumb-governance'),
        join(targetDir, 'skills', 'hierarchical-mindfulness'),
        join(targetDir, 'skills', 'idumb-meta-builder'),
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
    const langArg = args.find(a => a.startsWith('--lang='));

    // Step 0: Print header first
    printHeader();

    // Step 0a: Language selection (MUST BE FIRST interactive step)
    let selectedLanguage = 'en';
    if (langArg) {
        selectedLanguage = langArg.split('=')[1] === 'vi' ? 'vi' : 'en';
        setLocale(selectedLanguage);
    } else if (process.stdin.isTTY && !isUninstall) {
        selectedLanguage = await step0_selectLanguage();
    }

    // Step 0b: Show introduction (only in interactive mode)
    if (process.stdin.isTTY && !isUninstall) {
        await step0b_showIntroduction();
    }

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
        const overwritePrompt = getLocale() === 'vi'
            ? '⚠ Đã phát hiện cài đặt iDumb trước đó. Ghi đè? [y/n]: '
            : '⚠ Existing iDumb installation detected. Overwrite? [y/n]: ';
        const answer = await prompt(overwritePrompt, 'n');
        if (answer !== 'y' && answer !== 'yes') {
            print(getLocale() === 'vi' ? 'Đã hủy cài đặt.' : 'Installation cancelled.');
            return;
        }
        print(getLocale() === 'vi' ? '  Đang nâng cấp...' : '  Upgrading existing installation...');
    }

    await step4_installAgents(location.path);
    await step5_installCommands(location.path);
    await step6_installTools(location.path);
    await step7_installPlugin(location.path);
    await step8_installSkills(location.path);
    await step8b_installWorkflows(location.path);
    await step8c_installTemplates(location.path);
    await step8d_installRouter(location.path);
    await step8e_installConfig(location.path);
    await step8f_installSchemas(location.path);
    await step9_createIdumbDir(location, selectedLanguage);
    await showComplete(location.path, location, selectedLanguage);
}

main().catch(e => {
    console.error('Installation failed:', e.message);
    process.exit(1);
});
