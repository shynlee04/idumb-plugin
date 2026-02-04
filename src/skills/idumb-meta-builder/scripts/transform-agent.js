#!/usr/bin/env node

/**
 * Agent Transformation Script
 *
 * Transforms external agent definitions (e.g., BMAD .agent.yaml)
 * into iDumb-compatible agent profiles with hierarchy integration.
 *
 * Usage: node transform-agent.js <agent-file> <hierarchy-level>
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname, basename } from 'path';
import { parse as parseYaml } from 'yaml';

// Hierarchy level mappings
const HIERARCHY_LEVELS = {
  'coordinator': {
    level: 1,
    iDumb_agent: 'idumb-supreme-coordinator',
    permissions: { task: true, write: false, edit: false, bash: false, delegate: true }
  },
  'governance': {
    level: 2,
    iDumb_agent: 'idumb-high-governance',
    permissions: { task: true, write: false, edit: false, bash: false, delegate: true }
  },
  'validator': {
    level: 3,
    iDumb_agent: 'idumb-low-validator',
    permissions: { task: false, write: false, edit: false, bash: 'read', delegate: false }
  },
  'builder': {
    level: 4,
    iDumb_agent: 'idumb-builder',
    permissions: { task: false, write: true, edit: true, bash: true, delegate: false }
  }
};

function transformAgent(agentFile, hierarchyLevel) {
  const input = readFileSync(agentFile, 'utf8');
  const source = parseYaml(input);

  if (!source.agent) {
    console.error('Invalid agent file: missing agent key');
    process.exit(1);
  }

  const level = HIERARCHY_LEVELS[hierarchyLevel] || HIERARCHY_LEVELS.governance;
  const meta = source.agent.metadata || {};
  const persona = source.agent.persona || {};

  // Generate iDumb agent markdown
  const iDumbAgent = generateIDumbAgent(meta, persona, source.agent.menu, level);

  // Output file
  const outputFile = resolve(`src/agents/idumb-${meta.name?.toLowerCase().replace(/\s+/g, '-') || 'transformed'}.md`);
  writeFileSync(outputFile, iDumbAgent, 'utf8');

  console.log(`✓ Transformed agent: ${outputFile}`);
  return outputFile;
}

function generateIDumbAgent(metadata, persona, menu, level) {
  const name = metadata.name || 'Transformed Agent';
  const category = name.toLowerCase().replace(/\s+/g, '-');

  return `---
name: idumb-${category}
description: ${metadata.title || name} - Transformed from external framework
version: 1.0.0
mode: agent
permission:
  write: ${level.permissions.write}
  edit: ${level.permissions.edit}
  bash: ${level.permissions.bash}
  task: ${level.permissions.task}
  delegate: ${level.permissions.delegate}
tools:
  - Read
  - Glob
  - Grep
  ${level.permissions.write ? '- Edit\n  - Write' : ''}
  ${level.permissions.delegate ? '- Task' : ''}
temperature: 0.1
---

# ${name}

**Level ${level.level} Agent**: ${level.iDumb_agent}

## Persona

${persona.role ? `**Role:** ${persona.role}` : ''}

${persona.identity ? `**Identity:** ${persona.identity}` : ''}

${persona.communication_style ? `**Communication Style:** ${persona.communication_style}` : ''}

### Principles

${persona.principles ? persona.principles.split('\n').map(p => p.trim().replace(/^-/, '').trim()).map(p => `- ${p}`).join('\n') : '- Respect iDumb hierarchy\n- Follow chain enforcement rules\n- Maintain state.json tracking'}

## Hierarchy Awareness

This agent operates at **Level ${level.level}** of the iDumb delegation chain:

${Object.entries(HIERARCHY_LEVELS).map(([key, val]) => {
  return `  ${val.level === level.level ? '→' : ' '} ${val.level}: ${val.iDumb_agent}`;
}).join('\n')}

**Position Rules:**
${level.permissions.delegate ? '- Can delegate to lower levels' : '- Cannot delegate (leaf node)'}
${level.permissions.write ? '- Can write and edit files directly' : '- Must delegate to builder for file operations'}
- Must respect chain enforcement rules
- Must create checkpoints before risky operations

## Menu Integration

${menu ? menu.map(item => {
  return `### Trigger: ${item.trigger}

**Workflow:** ${item.exec}
**Description:** ${item.description}

`;
}).join('\n') : '*Menu items would be converted to command bindings*'}

## State Integration

This agent integrates with iDumb state management:

- **Read State**: Before operations, read current state from `.idumb/idumb-brain/state.json`
- **Update State**: After operations, update phase, validation count, or history
- **Create Anchors**: For critical decisions, create context anchors
- **Record History**: Log all actions to governance history
`;
}

// CLI
const agentFile = process.argv[2];
const hierarchyLevel = process.argv[3] || 'governance';

if (!agentFile) {
  console.log('Usage: node transform-agent.js <agent-file> [hierarchy-level]');
  console.log('');
  console.log('Hierarchy levels: coordinator, governance, validator, builder');
  process.exit(1);
}

if (!existsSync(agentFile)) {
  console.error(`Agent file not found: ${agentFile}`);
  process.exit(1);
}

transformAgent(agentFile, hierarchyLevel);
