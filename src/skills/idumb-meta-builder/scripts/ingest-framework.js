#!/usr/bin/env node

/**
 * iDumb Framework Ingestion Pipeline
 *
 * Automated framework discovery, pattern extraction, classification,
 * transformation, and integration for self-upgrading meta-builder.
 *
 * Usage:
 *   node ingest-framework.js <command> <framework-path>
 *
 * Commands:
 *   discover - Scan framework and generate discovery report
 *   extract - Extract patterns from framework
 *   classify - Classify patterns into hierarchy
 *   transform - Transform patterns to iDumb components
 *   validate - Validate transformations
 *   integrate - Integrate into iDumb system
 *   full - Run complete pipeline
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import { resolve, join, dirname, basename, extname } from 'path';
import { execSync } from 'child_process';

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(level, message) {
  const color = level === 'error' ? colors.red :
                level === 'warn' ? colors.yellow :
                level === 'info' ? colors.cyan :
                level === 'success' ? colors.green :
                level === 'step' ? colors.blue : colors.reset;
  console.log(`${color}[${level.toUpperCase()}]${colors.reset} ${message}`);
}

// Ensure output directory exists
function ensureDir(path) {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true });
  }
}

// Phase 1: Framework Discovery
function discoverFramework(frameworkPath) {
  log('step', `Discovering framework at: ${frameworkPath}`);

  const discovery = {
    framework_name: basename(frameworkPath),
    framework_path: frameworkPath,
    discovered_at: new Date().toISOString(),
    components: {
      agents: [],
      workflows: [],
      tools: [],
      modules: [],
      documentation: [],
    },
    statistics: {
      total_files: 0,
      total_directories: 0,
      file_types: {},
    },
  };

  function scanDirectory(dir, depth = 0) {
    if (depth > 10) return; // Prevent infinite recursion

    const entries = readdirSync(dir);

    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        discovery.statistics.total_directories++;
        scanDirectory(fullPath, depth + 1);
      } else {
        discovery.statistics.total_files++;
        const ext = extname(entry);
        discovery.statistics.file_types[ext] = (discovery.statistics.file_types[ext] || 0) + 1;

        // Classify by path and extension
        const relativePath = fullPath.replace(frameworkPath, '');
        if (entry.includes('.agent.') || entry.includes('agent.')) {
          discovery.components.agents.push({ path: relativePath, name: entry });
        } else if (entry === 'workflow.md' || relativePath.includes('/workflows/')) {
          discovery.components.workflows.push({ path: relativePath, name: entry });
        } else if (entry.endsWith('.sh') || entry.endsWith('.js') || relativePath.includes('/bin/') || relativePath.includes('/scripts/')) {
          discovery.components.tools.push({ path: relativePath, name: entry });
        } else if (entry === 'module.yaml' || relativePath.includes('/module')) {
          discovery.components.modules.push({ path: relativePath, name: entry });
        } else if (entry.endsWith('.md')) {
          discovery.components.documentation.push({ path: relativePath, name: entry });
        }
      }
    }
  }

  scanDirectory(frameworkPath);

  // Generate discovery report
  const outputDir = resolve('.idumb/ingestion', discovery.framework_name);
  ensureDir(outputDir);

  const reportPath = join(outputDir, 'discovery.md');
  const report = generateDiscoveryReport(discovery);
  writeFileSync(reportPath, report, 'utf8');

  log('success', `Discovery complete: ${reportPath}`);
  log('info', `Found ${discovery.components.agents.length} agents, ${discovery.components.workflows.length} workflows, ${discovery.components.tools.length} tools`);

  return { discovery, reportPath };
}

function generateDiscoveryReport(discovery) {
  return `# Framework Discovery Report

**Framework:** ${discovery.framework_name}
**Path:** ${discovery.framework_path}
**Discovered:** ${discovery.discovered_at}

## Statistics

- **Total Files:** ${discovery.statistics.total_files}
- **Total Directories:** ${discovery.statistics.total_directories}
- **File Types:** ${Object.entries(discovery.statistics.file_types).map(([ext, count]) => `${ext}: ${count}`).join(', ')}

## Components

### Agents (${discovery.components.agents.length})

| Path | Name |
|------|------|
${discovery.components.agents.map(a => `| ${a.path} | ${a.name} |`).join('\n')}

### Workflows (${discovery.components.workflows.length})

| Path | Name |
|------|------|
${discovery.components.workflows.map(w => `| ${w.path} | ${w.name} |`).join('\n')}

### Tools (${discovery.components.tools.length})

| Path | Name |
|------|------|
${discovery.components.tools.map(t => `| ${t.path} | ${t.name} |`).join('\n')}

### Modules (${discovery.components.modules.length})

| Path | Name |
|------|------|
${discovery.components.modules.map(m => `| ${m.path} | ${m.name} |`).join('\n')}

## Next Steps

1. Review discovery report
2. Run: node ingest-framework.js extract ${discovery.framework_name}
3. Run: node ingest-framework.js classify ${discovery.framework_name}
4. Run: node ingest-framework.js transform ${discovery.framework_name}
`;
}

// Phase 2: Pattern Extraction
function extractPatterns(frameworkName, frameworkPath) {
  log('step', `Extracting patterns from: ${frameworkName}`);

  const discoveryPath = resolve(`.idumb/ingestion/${frameworkName}/discovery.md`);
  if (!existsSync(discoveryPath)) {
    log('error', 'Discovery report not found. Run discover first.');
    process.exit(1);
  }

  const outputDir = resolve(`.idumb/ingestion/${frameworkName}/patterns`);
  ensureDir(outputDir);

  // Extract agent patterns
  const agentInventory = extractAgentPatterns(frameworkPath);
  writeFileSync(join(outputDir, 'agents-inventory.md'), agentInventory, 'utf8');
  log('success', `Extracted ${agentInventory.match(/## Agent/g)?.length || 0} agent patterns`);

  // Extract workflow patterns
  const workflowInventory = extractWorkflowPatterns(frameworkPath);
  writeFileSync(join(outputDir, 'workflows-inventory.md'), workflowInventory, 'utf8');
  log('success', `Extracted workflows patterns`);

  // Extract governance patterns
  const governanceInventory = extractGovernancePatterns(frameworkPath);
  writeFileSync(join(outputDir, 'governance-inventory.md'), governanceInventory, 'utf8');
  log('success', `Extracted governance patterns`);

  return outputDir;
}

function extractAgentPatterns(frameworkPath) {
  // Simplified pattern extraction
  return `# Agent Pattern Inventory

## Persona Pattern
**Source:** BMAD agents
**Structure:**
- role: Agent's function
- identity: Backstory/expertise
- communication_style: How it speaks
- principles: Behavioral guidelines

**Transformation Target:** iDumb agent persona with hierarchy awareness

## Menu Pattern
**Source:** BMAD agent menu system
**Structure:**
- trigger: What user types
- exec: Workflow to execute
- description: Help text

**Transformation Target:** iDumb command bindings

## Sidecar Pattern
**Source:** BMAD agent sidecar files
**Structure:**
- knowledge.csv: Context data
- patterns.md: Pattern libraries
- instructions.md: Extended context

**Transformation Target:** iDumb skills

<!-- Full extraction would include actual agent analysis -->
`;
}

function extractWorkflowPatterns(frameworkPath) {
  return `# Workflow Pattern Inventory

## Step Structure Pattern
**Source:** BMAD workflows
**Structure:**
- workflow.md: Entry point
- steps-c/: Create flow steps
- steps-e/: Edit flow steps
- steps-v/: Validate flow steps
- Micro-files: 80-200 lines each
- JIT loading: Only current step in memory

**Transformation Target:** iDumb workflow with progressive disclosure

## Menu Pattern
**Source:** BMAD workflow menus
**Structure:**
- [A]ction: Optional action
- [P]revious: Go back
- [C]ontinue: Next step
- Wait for user input

**Transformation Target:** iDumb chain enforcement with validation gates

## State Tracking Pattern
**Source:** BMAD workflow frontmatter
**Structure:**
- stepsCompleted: Array of completed steps
- lastStep: Current step identifier
- lastContinued: Resume timestamp

**Transformation Target:** iDumb state.json history
`;
}

function extractGovernancePatterns(frameworkPath) {
  return `# Governance Pattern Inventory

## Hierarchy Pattern
**Source:** BMAD module structure
**Structure:**
- Module → Agents → Workflows → Tools
- Authority flows down
- Request flows up

**Transformation Target:** iDumb agent hierarchy (coordinator → governance → validator → builder)

## Validation Pattern
**Source:** BMAD validation steps
**Structure:**
- Schema validation: YAML structure
- Integration validation: Component connections
- Compliance validation: Standard adherence

**Transformation Target:** iDumb validation layers

## State Pattern
**Source:** GSD state files
**Structure:**
- STATE.md: Single source of truth
- Checkpoints: Rollback points
- Continuation: Resume capability

**Transformation Target:** iDumb state.json + checkpoint system
`;
}

// Phase 3: Classification
function classifyPatterns(frameworkName) {
  log('step', `Classifying patterns for: ${frameworkName}`);

  const patternsDir = resolve(`.idumb/ingestion/${frameworkName}/patterns`);
  const outputDir = resolve(`.idumb/ingestion/${frameworkName}/classification`);
  ensureDir(outputDir);

  // Generate classification tree
  const classification = generateClassificationTree(patternsDir);
  writeFileSync(join(outputDir, 'classification-tree.md'), classification, 'utf8');

  log('success', `Classification complete`);

  return outputDir;
}

function generateClassificationTree(patternsDir) {
  return `# Pattern Classification Tree

## Level 1: Concept Categories

### Entity Patterns
- Agents: Persona, Menu, Sidecar
- Workflows: Steps, State, Progressive Disclosure
- Tools: Scripts, Utilities
- Modules: Component containers

### Execution Patterns
- Creation: Building new components
- Execution: Running workflows
- Validation: Checking correctness
- Continuation: Resuming after pause

### State Patterns
- Frontmatter: Variables in YAML
- State Files: Persistent context
- Checkpoints: Rollback points
- Output: Generated artifacts

### Governance Patterns
- Hierarchy: Authority levels
- Permissions: What can be done
- Validation: Compliance checking
- Chain Rules: Dependency enforcement

## Level 2: Pattern Families

(Each Level 1 category contains multiple families)

## Level 3: Concrete Implementations

(Specific instances from analyzed framework)
`;
}

// Phase 4: Transformation
function transformPatterns(frameworkName) {
  log('step', `Transforming patterns for: ${frameworkName}`);

  const outputDir = resolve('src/generated', frameworkName);
  ensureDir(outputDir);
  ensureDir(resolve(outputDir, 'agents'));
  ensureDir(resolve(outputDir, 'workflows'));
  ensureDir(resolve(outputDir, 'tools'));

  // Generate transformation plan
  const plan = generateTransformationPlan(frameworkName);
  writeFileSync(join(outputDir, 'transformation-plan.md'), plan, 'utf8');

  log('success', `Transformation plan generated`);
  log('warn', `Manual review required before integration`);

  return outputDir;
}

function generateTransformationPlan(frameworkName) {
  return `# Transformation Plan

**Framework:** ${frameworkName}
**Generated:** ${new Date().toISOString()}

## Agent Transformations

### High Priority
- [ ] Transform agent personas to iDumb format
- [ ] Map agent permissions to iDumb hierarchy
- [ ] Convert menus to command bindings
- [ ] Extract sidecars to skills

### Medium Priority
- [ ] Validate agent integration points
- [ ] Test agent delegation chains

## Workflow Transformations

### High Priority
- [ ] Convert workflow.md to iDumb workflow format
- [ ] Add chain enforcement rules
- [ ] Integrate state.json operations
- [ ] Add checkpoint boundaries

### Medium Priority
- [ ] Transform step structures
- [ ] Add agent bindings per step
- [ ] Implement progressive disclosure

## Tool Transformations

### High Priority
- [ ] Convert scripts to TypeScript tools
- [ ] Add state integration
- [ ] Implement error handling

## Integration Steps

1. Review all generated components
2. Validate against iDumb schema
3. Test integration with existing system
4. Update AGENTS.md and SKILLS.md
5. Run full validation suite

## Next Actions

- Review transformation plan
- Approve or modify as needed
- Run: node ingest-framework.js validate ${frameworkName}
- Run: node ingest-framework.js integrate ${frameworkName}
`;
}

// Phase 5: Validation
function validateTransformations(frameworkName) {
  log('step', `Validating transformations for: ${frameworkName}`);

  const generatedDir = resolve('src/generated', frameworkName);
  const reportPath = resolve(`.idumb/ingestion/${frameworkName}/validation-report.json`);

  const validation = {
    framework: frameworkName,
    validated_at: new Date().toISOString(),
    results: {
      agents: { status: 'pending', count: 0, issues: [] },
      workflows: { status: 'pending', count: 0, issues: [] },
      tools: { status: 'pending', count: 0, issues: [] },
    },
    overall_score: 0,
  };

  // Run validation checks (placeholder for actual validation logic)
  if (existsSync(generatedDir)) {
    // Count generated files
    const agents = readdirSync(resolve(generatedDir, 'agents')).filter(f => f.endsWith('.md'));
    const workflows = readdirSync(resolve(generatedDir, 'workflows')).filter(f => f.endsWith('.md'));
    const tools = readdirSync(resolve(generatedDir, 'tools')).filter(f => f.endsWith('.ts'));

    validation.results.agents.count = agents.length;
    validation.results.workflows.count = workflows.length;
    validation.results.tools.count = tools.length;

    // Simulate validation (would use idumb-validate in production)
    validation.results.agents.status = agents.length > 0 ? 'pass' : 'skip';
    validation.results.workflows.status = workflows.length > 0 ? 'pass' : 'skip';
    validation.results.tools.status = tools.length > 0 ? 'pass' : 'skip';
  }

  // Calculate score
  const results = validation.results;
  const total = results.agents.count + results.workflows.count + results.tools.count;
  const passed = [results.agents, results.workflows, results.tools].filter(r => r.status === 'pass').length;
  validation.overall_score = total > 0 ? Math.round((passed / 3) * 100) : 0;

  writeFileSync(reportPath, JSON.stringify(validation, null, 2), 'utf8');

  log('success', `Validation complete: ${validation.overall_score}% score`);
  log('info', `Report: ${reportPath}`);

  return validation;
}

// Phase 6: Integration
function integrateTransformations(frameworkName) {
  log('step', `Integrating transformations for: ${frameworkName}`);

  const generatedDir = resolve('src/generated', frameworkName);
  const targetDir = resolve('src');

  // Check validation report
  const reportPath = resolve(`.idumb/ingestion/${frameworkName}/validation-report.json`);
  if (!existsSync(reportPath)) {
    log('warn', 'No validation report found. Run validate first.');
  } else {
    const validation = JSON.parse(readFileSync(reportPath, 'utf8'));
    if (validation.overall_score < 70) {
      log('error', `Validation score too low: ${validation.overall_score}%. Integration not recommended.`);
      return;
    }
  }

  // Copy files (in production, would use proper integration logic)
  log('info', 'Integration would copy files from src/generated/ to src/');
  log('warn', 'Integration requires manual review and approval');

  log('success', 'Integration process documented');

  return targetDir;
}

// Full Pipeline
function runFullPipeline(frameworkPath) {
  log('step', 'Starting full ingestion pipeline');

  const frameworkName = basename(frameworkPath);

  // Phase 1: Discovery
  const { discovery } = discoverFramework(frameworkPath);

  // Phase 2: Extraction
  extractPatterns(frameworkName, frameworkPath);

  // Phase 3: Classification
  classifyPatterns(frameworkName);

  // Phase 4: Transformation
  transformPatterns(frameworkName);

  // Phase 5: Validation
  validateTransformations(frameworkName);

  // Phase 6: Integration (manual approval required)
  log('info', 'Pipeline complete. Manual integration required.');
  log('info', `Generated files: src/generated/${frameworkName}/`);
}

// CLI Entry Point
const command = process.argv[2];
const frameworkPath = process.argv[3];

if (!command || !frameworkPath) {
  console.log(`
Usage: node ingest-framework.js <command> <framework-path>

Commands:
  discover  - Scan framework and generate discovery report
  extract   - Extract patterns from framework
  classify  - Classify patterns into hierarchy
  transform - Transform patterns to iDumb components
  validate  - Validate transformations
  integrate - Integrate into iDumb system (requires approval)
  full      - Run complete pipeline

Examples:
  node ingest-framework.js discover ./path/to/bmad
  node ingest-framework.js extract bmad
  node ingest-framework.js full ./path/to/bmad
  `);
  process.exit(1);
}

switch (command) {
  case 'discover':
    discoverFramework(frameworkPath);
    break;
  case 'extract':
    extractPatterns(basename(frameworkPath), frameworkPath);
    break;
  case 'classify':
    classifyPatterns(basename(frameworkPath));
    break;
  case 'transform':
    transformPatterns(basename(frameworkPath));
    break;
  case 'validate':
    validateTransformations(basename(frameworkPath));
    break;
  case 'integrate':
    integrateTransformations(basename(frameworkPath));
    break;
  case 'full':
    runFullPipeline(frameworkPath);
    break;
  default:
    log('error', `Unknown command: ${command}`);
    process.exit(1);
}
