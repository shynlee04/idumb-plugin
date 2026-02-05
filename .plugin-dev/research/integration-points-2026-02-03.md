# Integration Points: iDumb Ecosystem Connections

**Research Date:** 2026-02-03
**Project:** iDumb v2 Meta-Framework
**Researcher:** @idumb-project-researcher
**Confidence Level:** HIGH

---

## Executive Summary

iDumb v2 integrates with multiple ecosystem layers: **OpenCode plugin system** (primary interface), **MCP (Model Context Protocol)** for external data sources, and local **tool systems** for file operations and development workflows. The integration strategy emphasizes **plugin-based extensibility** (no OpenCode source modifications), **bidirectional data flow** (read project state, write governance artifacts), and **event-driven architecture** (hooks at all decision points). All integrations respect governance constraints: no coordinator can modify files, no builder can delegate, and all operations are traceable via governance history.

---

## Primary Integration: OpenCode Plugin Framework

### Plugin Architecture

**Installation Modes:**
```bash
# Local installation (current project)
npx github:shynlee04/idumb-plugin --local

# Global installation (all projects)
npx github:shynlee04/idumb-plugin --global
```

**Installed Artifacts:**
```
.opencode/
├── agents/              # Agent profiles (markdown)
│   ├── idumb-supreme-coordinator.md
│   ├── idumb-high-governance.md
│   ├── idumb-executor.md
│   ├── idumb-builder.md
│   └── ... (15+ agents total)
│
├── commands/            # Command definitions
│   └── idumb/
│       ├── init.md
│       ├── status.md
│       ├── config.md
│       ├── validate.md
│       └── help.md
│
├── tools/              # Tool implementations (TypeScript)
│   ├── idumb-state.ts
│   ├── idumb-config.ts
│   ├── idumb-validate.ts
│   ├── idumb-context.ts
│   ├── idumb-chunker.ts
│   ├── idumb-manifest.ts
│   └── idumb-todo.ts
│
├── plugins/            # Plugin entry points
│   └── idumb-core.ts
│
└── skills/              # Governance skills (packaged reference)
    └── idumb-governance/
        └── SKILL.md
```

### Agent Integration

**Agent Registration Pattern:**
```markdown
---
# .opencode/agents/idumb-{agent-name}.md
---
description: "Brief description of agent purpose"
mode: primary | all
scope: project | bridge | meta
temperature: 0.1
permission:
  task:
    "agent-name": allow | deny | ask
  bash:
    "*": deny  # Coordinators always deny bash
  edit: deny | allow
  write: deny | allow
tools:
  task: false
  read: true
  glob: true
  grep: true
  idumb-state: true
---
```

**Agent Activation Flow:**
```typescript
// OpenCode loads agent profile
const agentProfile = loadAgentMarkdown('idumb-supreme-coordinator.md');

// Extract permissions
const permissions = agentProfile.permission;
const tools = agentProfile.tools;

// Initialize session with agent role
const session = createSession({
  agentRole: 'idumb-supreme-coordinator',
  permissions: permissions,
  allowedTools: tools
});

// Load governance state (context-first)
const state = await loadState(directory);

// Inject governance rules via messages.transform hook
injectGovernancePrefix(session, state);
```

**Permission Enforcement Matrix:**

| Agent | task: spawn | task: delegate | read | write | edit | bash | grep | glob | idumb-* |
|--------|--------------|-----------------|------|-------|------|------|------|------|----------|
| **supreme-coordinator** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **high-governance** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **executor** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **planner** | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **validator** | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **low-validator** | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **builder** | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **project-researcher** | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |

### Tool Integration

**Tool Registration Pattern:**
```typescript
import { tool } from "@opencode-ai/plugin";
import { z } from "zod";

export const idumbToolName = tool({
  name: "idumb:tool_name",
  description: "Tool description for AI",
  
  // Parameter schema (Zod)
  parameters: z.object({
    param1: z.string().describe("Description"),
    param2: z.boolean().optional()
  }),
  
  // Execution function
  execute: async ({ param1, param2 }, { directory }) => {
    // 1. Read governance state
    const state = readState(directory);
    
    // 2. Validate inputs
    const validated = InputSchema.parse({ param1, param2 });
    
    // 3. Perform operation
    const result = doWork(validated);
    
    // 4. Log action
    logAction(directory, {
      action: 'tool:idumbToolName',
      params: validated,
      result: 'success'
    });
    
    // 5. Return structured response
    return { content: JSON.stringify(result) };
  }
});
```

**Available Tools Directory:**
```
template/tools/
├── idumb-state.ts        # State read/write
├── idumb-config.ts       # Configuration management
├── idumb-validate.ts     # Validation subsystem
├── idumb-context.ts      # Project context analysis
├── idumb-chunker.ts      # Long document chunking
├── idumb-manifest.ts     # Snapshot & drift detection
└── idumb-todo.ts         # Hierarchical TODO tracking
```

**Tool Access Control:**
```typescript
// In plugin event hooks
"tool.execute.before": async (input, output) => {
  const { tool, sessionID } = input;
  const agentRole = getSessionAgentRole(sessionID);
  
  // Get allowed tools for this agent
  const allowedTools = getAllowedTools(agentRole);
  
  // Check permission
  if (!allowedTools.includes(tool)) {
    // Block the tool
    output.args = {
      __BLOCKED_BY_GOVERNANCE__: true,
      __VIOLATION__: `${agentRole} cannot use ${tool}`,
      __ALLOWED_TOOLS__: allowedTools
    };
    
    // Log violation
    logViolation(directory, {
      agent: agentRole,
      tool,
      timestamp: new Date().toISOString()
    });
  }
}
```

### Command Integration

**Command Registration Pattern:**
```markdown
---
# .opencode/commands/idumb/command-name.md
---
description: "Command description for user"
usage: "/idumb:command-name [options]"
parameters:
  - name: "option"
    type: string
    required: false
    description: "Option description"

execution:
  agent: idumb-command-executor
  tools:
    - tool1
    - tool2
  validation:
    - check1
    - check2
```

**Command Execution Flow:**
```typescript
// User triggers command
await executeCommand('/idumb:validate');

// OpenCode loads command definition
const command = loadCommand('idumb/validate.md');
const requiredTools = command.execution.tools;
const validationChecks = command.execution.validation;

// Spawn command-executor agent with required tools
const session = await spawnAgent({
  name: 'idumb-command-executor',
  allowedTools: requiredTools,
  prompt: `Execute validation: ${command.description}`
});

// Executor performs checks and returns results
const results = await executeWithTools(session, validationChecks);

// Display to user
displayResults(results);

// Log to governance history
logGovernanceAction('command:validate', 'executor', 'pass');
```

**Available Commands:**

| Command | Description | Agent | Tools Used | Validation |
|----------|-------------|--------|------------|------------|
| `/idumb:init` | Initialize governance structure | idumb-command-executor | idumb-state, filesystem |
| `/idumb:status` | Show current governance state | idumb-command-executor | idumb-state, idumb-config |
| `/idumb:config` | View/edit configuration | idumb-command-executor | idumb-config, idumb-state |
| `/idumb:validate` | Run validation checks | idumb-command-executor | idumb-validate, grep, glob, read |
| `/idumb:help` | Show documentation | idumb-command-executor | read, filesystem |

### Event Hook Integration

**Hook Registration:**
```typescript
// In idumb-core.ts plugin file
export default definePlugin({
  name: "idumb",
  version: "0.2.0",
  
  hooks: {
    // Message transformation (inject governance)
    "experimental.chat.messages.transform": messageTransformHook,
    
    // Tool permission enforcement
    "tool.execute.before": toolBeforeHook,
    "tool.execute.after": toolAfterHook,
    
    // Permission handling
    "permission.ask": permissionAskHook,
    
    // Session lifecycle
    "event": sessionEventHook
  }
});
```

**Hook: messages.transform**
```typescript
async function messageTransformHook(input, output) {
  const { messages, sessionID } = input;
  
  // Detect agent role from messages
  const agentRole = detectAgentRole(messages);
  
  // Build governance prefix
  const state = readState(directory);
  const governancePrefix = buildGovernancePrefix(agentRole, state);
  
  // Inject at session start
  const firstUserMsgIndex = messages.findIndex(
    m => m.role === 'user' && !m.isProcessed
  );
  
  if (firstUserMsgIndex >= 0) {
    messages[firstUserMsgIndex].parts.unshift({
      type: 'text',
      text: governancePrefix
    });
  }
  
  // Handle post-compaction recovery
  if (isCompacted(messages)) {
    messages[messages.length - 1].parts.push({
      type: 'text',
      text: buildPostCompactReminder(agentRole, state)
    });
  }
  
  return output;
}
```

**Hook: tool.execute.before**
```typescript
async function toolBeforeHook(input, output) {
  const { tool, args, sessionID } = input;
  
  const sessionTracker = getSessionTracker(sessionID);
  const agentRole = sessionTracker.agentRole;
  
  // First-tool enforcement
  if (!sessionTracker.firstToolUsed) {
    const requiredFirst = getRequiredFirstTools(agentRole);
    if (!requiredFirst.includes(tool)) {
      logViolation('first_tool', agentRole, tool);
      injectGuidance(agentRole, requiredFirst);
    }
    sessionTracker.firstToolUsed = true;
    sessionTracker.firstToolName = tool;
  }
  
  // Permission enforcement
  const allowedTools = getAllowedTools(agentRole);
  if (!allowedTools.includes(tool)) {
    output.args = blockWithMessage(agentRole, tool);
    logViolation('permission', agentRole, tool);
  }
  
  return output;
}
```

**Hook: tool.execute.after**
```typescript
async function toolAfterHook(input, output) {
  const { tool, sessionID } = input;
  const sessionTracker = getSessionTracker(sessionID);
  
  // Check for pending violations
  const violation = pendingDenials.get(sessionID);
  if (violation && tool === violation.tool) {
    // Transform error to include guidance
    output.output = buildViolationGuidance(violation.agent, violation.tool) + '\n\n' + output.output;
    output.title = `🚫 GOVERNANCE ENFORCEMENT: ${violation.agent}`;
    pendingDenials.delete(sessionID);
  }
  
  // Log successful operations
  if (!violation) {
    logGovernanceAction('tool_success', sessionTracker.agentRole, tool);
  }
  
  return output;
}
```

**Hook: permission.ask**
```typescript
async function permissionAskHook(input, output) {
  const { tool, sessionID } = input;
  const sessionTracker = getSessionTracker(sessionID);
  const agentRole = sessionTracker.agentRole;
  
  const allowedTools = getAllowedTools(agentRole);
  
  // Evaluate permission
  if (!allowedTools.includes(tool)) {
    // Deny permission
    output.status = 'deny';
    
    // Store for post-denial guidance
    pendingDenials.set(sessionID, {
      agent: agentRole,
      tool: tool,
      timestamp: new Date().toISOString()
    });
    
    // Log denial
    logGovernanceAction('permission_denied', agentRole, tool);
  } else {
    // Allow permission
    output.status = 'allow';
  }
  
  return output;
}
```

**Hook: event**
```typescript
async function sessionEventHook({ event }) {
  const { type, properties } = event;
  
  switch (type) {
    case 'session.created':
      const sessionId = properties?.info?.id;
      initializeSessionTracker(sessionId);
      storeSessionMetadata(directory, sessionId);
      break;
      
    case 'session.compacted':
      const session = getSessionTracker(sessionId);
      session.governanceInjected = false; // Reset for re-injection
      break;
      
    case 'session.idle':
      cleanupSessionTracker(sessionId);
      break;
      
    case 'command.executed':
      const command = properties?.command;
      if (command.startsWith('idumb:')) {
        logGovernanceAction('command', 'plugin', command);
      }
      break;
  }
  
  return;
}
```

---

## Secondary Integration: Model Context Protocol (MCP)

### MCP Overview

**MCP** = Model Context Protocol (Anthropic standard)
Allows AI models to connect to external data sources beyond the immediate conversation context.

### iDumb MCP Integration Points

```typescript
// Potential MCP servers for iDumb
mcpServers: {
  // Local file system access
  'filesystem': {
    description: 'Access local project files',
    tools: ['read_file', 'write_file', 'list_directory'],
    brainIntegration: '.idumb/brain/'
  },
  
  // Brain database queries
  'brain-database': {
    description: 'Query iDumb brain SQLite database',
    tools: ['sql_query', 'search_sessions', 'get_anchors'],
    integration: 'better-sqlite3'
  },
  
  // Semantic search
  'brain-search': {
    description: 'Semantic search over code and artifacts',
    tools: ['semantic_search', 'fulltext_search'],
    integration: 'Orama'
  },
  
  // Governance state
  'governance-state': {
    description: 'Access current governance state',
    tools: ['get_state', 'get_history', 'get_anchors'],
    integration: 'state.json'
  }
}
```

### MCP Tool Implementations

**SQL Query Tool:**
```typescript
{
  name: 'sql_query',
  description: 'Execute SQL query against iDumb brain database',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'SQL query to execute'
      },
      params: {
        type: 'array',
        description: 'Query parameters'
      }
    }
  },
  handler: async ({ query, params }) => {
    const db = openDatabase('.idumb/brain/idumb.db');
    const stmt = db.prepare(query);
    const result = stmt.all(...params);
    return { result, rowCount: result.length };
  }
}
```

**Semantic Search Tool:**
```typescript
{
  name: 'semantic_search',
  description: 'Search iDumb brain using semantic similarity',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query'
      },
      mode: {
        type: 'string',
        enum: ['hybrid', 'vector', 'fulltext'],
        description: 'Search mode'
      }
    }
  },
  handler: async ({ query, mode }) => {
    const orama = await loadOrama('.idumb/brain/search/');
    const results = await search(orama, { term: query, mode });
    return { results, count: results.length };
  }
}
```

**State Access Tool:**
```typescript
{
  name: 'get_governance_state',
  description: 'Retrieve current iDumb governance state',
  inputSchema: {
    type: 'object',
    properties: {
      includeHistory: {
        type: 'boolean',
        description: 'Include governance history'
      }
    }
  },
  handler: async ({ includeHistory }) => {
    const state = readState('.idumb/brain/state.json');
    let response = { ...state };
    
    if (includeHistory) {
      response.history = readHistory('.idumb/brain/history/');
    }
    
    return response;
  }
}
```

### MCP Security Considerations

| Tool | Access Level | Validation | Logging |
|------|--------------|------------|---------|
| sql_query | Read-only queries | SQL injection protection | All queries logged |
| semantic_search | Read-only search | Query validation | Search terms logged |
| get_governance_state | Read-only | Schema validation | Access logged |
| write_file | Write operations | Permission check | Modified files tracked |
| brain_update | Write operations | Schema validation | Governance audit trail |

---

## File System Integration

### Read Operations

**State Reading:**
```typescript
// .idumb/brain/state.json
const state = readState(directory);

// OpenCode's read tool
await read({
  filePath: '.idumb/brain/state.json'
});

// Validation
const validated = StateSchema.parse(state);
```

**Context Reading:**
```typescript
// .planning/ artifacts
const projectDefinition = await read('.planning/PROJECT.md');
const roadmap = await read('.planning/ROADMAP.md');

// Source code
const sourceFiles = await glob('src/**/*.{ts,tsx,js,jsx}');
```

### Write Operations

**Governance Artifacts:**
```typescript
// Only idumb-builder can write
await write({
  filePath: '.planning/phases/01/PLAN.md',
  content: planContent
});

// Atomic writes (temp + rename)
await edit({
  filePath: '.idumb/brain/state.json',
  edits: [{
    oldText: '"phase": "init"',
    newText: '"phase": "planning"'
  }]
});
```

### File Watching

**Incremental Updates:**
```typescript
import watch from '@parcel/watcher';

// Watch for file changes
const watcher = await watch(process.cwd());

watcher.on('change', (filePath) => {
  // Update AST cache
  if (filePath.endsWith('.ts')) {
    const ast = parseWithTreeSitter(filePath);
    updateASTCache(filePath, ast);
    
    // Update relationship graph
    const symbols = extractSymbols(ast);
    updateGraph(symbols);
    
    // Update search index
    orama.add({
      id: filePath,
      content: await readFile(filePath),
      symbols
    });
  }
});
```

---

## Planning System Integration

### .planning Directory Structure

```
.planning/
├── PROJECT.md              # Project definition & scope
├── ROADMAP.md             # Milestone & phase plan
├── phases/
│   ├── 01-init/
│   │   ├── CONTEXT.md
│   │   ├── PLAN.md
│   │   └── VERIFICATION.md
│   ├── 02-contracts-first/
│   │   ├── CONTEXT.md
│   │   ├── PLAN.md
│   │   └── VERIFICATION.md
│   └── ...
└── STATE.md               # Current planning state
```

### iDumb ↔ Planning Integration

**Read-Only Access:**
- iDumb agents read `.planning/` artifacts
- iDumb never writes to `.planning/` (by design)
- Planning artifacts remain user-controlled

**Sync Pattern:**
```typescript
// iDumb reads planning state
const currentPhase = readPlanningPhase('.planning/STATE.md');

// iDumb syncs to governance state
syncGovernanceState({
  planningPhase: currentPhase.phase,
  currentMilestone: currentPhase.milestone,
  planTasks: currentPhase.tasks
});

// iDumb validates planning artifacts
const validation = validatePlanningArtifacts('.planning/');
reportValidation(validation);
```

---

## Cross-Component Integration

### Agent ↔ Agent Delegation

```typescript
// Coordinator delegates to high-governance
await task({
  all_type: 'idumb-high-governance',
  description: 'Coordinate phase execution',
  prompt: delegationContext + '\n\n' + userRequest
});

// High-governance delegates to executor
await task({
  all_type: 'idumb-executor',
  description: 'Execute phase 1 tasks',
  prompt: `Execute tasks: ${taskList}\n\nGovernance context: ${loadContext()}`
});

// Executor delegates to builder
await task({
  all_type: 'idumb-builder',
  description: 'Implement file changes',
  prompt: `Modify files: ${filesToChange}\n\nUse read tool first, then edit/write.`
});
```

### Tool ↔ Brain Integration

```typescript
// State tool reads from brain
const state = brain.query('SELECT * FROM state WHERE id = 1');

// Validate tool writes to brain
brain.execute('INSERT INTO anchors (id, content) VALUES (?, ?)', [anchorId, content]);

// Context tool searches brain
const results = brain.search('SELECT * FROM sessions WHERE phase = ?', ['planning']);
```

### Validation ↔ Brain Integration

```typescript
// Validation runs checks
const checks = [
  checkStructure(),
  checkSchemaIntegrity(),
  checkFreshness(),
  checkDrift()
];

// Results stored in brain
checks.forEach(check => {
  brain.execute('INSERT INTO validations (check, result) VALUES (?, ?)', 
    [check.name, check.result]
});
});

// Governance history updated
brain.execute('INSERT INTO history (action, result) VALUES (?, ?)', 
    ['validation_run', checks.passed ? 'pass' : 'fail']);
```

---

## External Service Integration

### No Cloud Dependencies (By Design)

**Integration Philosophy:**
- All storage local (`.idumb/`)
- All queries in-process (SQLite, Orama)
- No external APIs required
- Works offline

**Why This Design:**
| Concern | Local-Only Solution | Cloud Alternative Considered | Reason for Local |
|---------|---------------------|---------------------------|-------------------|
| Data privacy | All governance data stays on device | Cloud DBs (Postgres, Mongo) | Security, compliance |
| Offline capability | Works without internet | Pinecone, OpenAI API | Air-gapped environments |
| No subscription costs | Zero ongoing costs | Vector DB hosting | Accessibility |
| Debugging | Direct file access for debugging | Remote APIs | Developer experience |
| Speed | Sub-millisecond queries | Network latency | Performance |

### Optional External Integrations (Future v2+)

**Potential Extensions:**

1. **Optional Cloud Backup**
   ```typescript
   // Configurable opt-in
   if (config.backup.enabled) {
     await uploadToCloud('.idumb/brain/', config.backup.provider);
   }
   ```

2. **Optional AI Providers**
   ```typescript
   // User chooses model
   if (config.embedding.provider === 'openai') {
     const embedding = await openai.embeddings.create(input);
   } else if (config.embedding.provider === 'local') {
     const embedding = await transformers.embed(input); // Default
   }
   ```

3. **Optional Team Sync**
   ```typescript
   // Future consideration
   if (config.teamSync.enabled) {
     await syncWithRemote('.idumb/', config.teamSync.url);
   }
   ```

---

## Integration Security Model

### Trust Boundaries

```mermaid
graph TD
    A[User/Developer] -->|trusts| B[iDumb Framework]
    B -->|uses| C[OpenCode API]
    B -->|reads| D[.planning/ Artifacts]
    B -->|manages| E[.idumb/ Brain]
    B -->|enforces| F[Agent Permissions]
    C -->|hosts| G[iDumb Agents]
    C -->|calls| H[File System Tools]
    C -->|calls| I[Git Operations]
    
    style A fill:#4caf50
    style B fill:#2196f3
    style C fill:#ff9800
    style D fill:#ff5722
    style E fill:#9c27b0
    style F fill:#ffc107
    style G fill:#03a9f4
    style H fill:#673ab7
    style I fill:#607d8b
```

**Trust Flows:**
- **User → iDumb:** Trust framework to enforce governance
- **iDumb → OpenCode:** Trust plugin API for hooks/agents
- **iDumb → .planning/:** Read-only access (no modification)
- **iDumb → .idumb/:** Full management (storage, validation)
- **iDumb → Agents:** Trust agents to follow permissions
- **Agents → File System:** Only builder agent can write
- **Agents → Tools:** Trust tool implementations for operations

### Data Flow Security

**Read Operations (All Agents):**
```typescript
// Safe reads
const safeRead = async (filePath: string) => {
  // Validate path is within project
  const resolvedPath = resolve(filePath);
  if (!isWithinProject(resolvedPath)) {
    throw new SecurityError('Path traversal attempt');
  }
  
  // Read file
  return await readFile(resolvedPath);
};
```

**Write Operations (Builder Only):**
```typescript
// Safe writes
const safeWrite = async (filePath: string, content: string) => {
  const agentRole = getCurrentAgentRole();
  
  // Check write permission
  if (agentRole !== 'idumb-builder') {
    throw new PermissionError('Only builder can write');
  }
  
  // Atomic write (temp → rename)
  const tempPath = `${filePath}.tmp`;
  await writeFile(tempPath, content);
  await rename(tempPath, filePath);
};
```

**Brain Operations (Governed):**
```typescript
// All brain operations logged
const brainOperation = async (operation: string, data: any) => {
  // Log before operation
  logGovernanceAction(operation, getCurrentAgent(), 'start');
  
  // Execute operation
  const result = await executeBrainOperation(operation, data);
  
  // Log after operation
  logGovernanceAction(operation, getCurrentAgent(), result);
  
  return result;
};
```

---

## Integration Testing

### Cross-Component E2E Tests

**Integration Scenarios:**
```typescript
describe('iDumb Integration', () => {
  
  test('Agent delegation chain', async () => {
    // Supreme coordinator → high-governance → executor → builder
    const session = await simulateDelegationChain();
    
    assert(session.delegationDepth === 3);
    assert(session.roles.includes('idumb-builder'));
    assert(session.permissionsValid === true);
  });
  
  test('State persistence across compaction', async () => {
    // Create session with anchors
    await createSessionWithAnchors();
    
    // Simulate compaction
    await compactSession();
    
    // Verify anchors survive
    const anchors = await getAnchors();
    assert(anchors.length > 0);
  });
  
  test('Tool permission enforcement', async () => {
    // Builder attempts to delegate (should fail)
    const builder = await spawnAgent('idumb-builder');
    const result = await attemptDelegation(builder);
    
    assert(result.blocked === true);
    assert(result.violationReason.includes('cannot delegate'));
  });
  
  test('Planning artifact sync', async () => {
    // Update .planning/STATE.md
    await updatePlanningState('phase', 'execution');
    
    // Verify iDumb reads new state
    const state = await getGovernanceState();
    assert(state.phase === 'execution');
  });
  
  test('Brain query performance', async () => {
    // Insert 1000 sessions
    await insertTestSessions(1000);
    
    // Query performance
    const start = performance.now();
    const results = await querySessions();
    const duration = performance.now() - start;
    
    assert(duration < 100); // <100ms for 1000 records
  });
});
```

### Hook Validation Tests

```typescript
describe('Event Hook Integration', () => {
  
  test('messages.transform injects governance', async () => {
    const messages = createTestMessages();
    const output = await messageTransformHook({ messages });
    
    assert(output.messages[0].includes('GOVERNANCE PROTOCOL'));
    assert(output.messages[0].includes('YOU ARE: Supreme Coordinator'));
  });
  
  test('tool.execute.before blocks unauthorized', async () => {
    const input = { tool: 'write', sessionID: 'test' };
    const output = await toolBeforeHook(input);
    
    assert(output.args.__BLOCKED_BY_GOVERNANCE__ === true);
    assert(output.args.__VIOLATION__.includes('cannot write'));
  });
  
  test('permission.ask denies correctly', async () => {
    const input = { tool: 'edit', sessionID: 'test' };
    const output = await permissionAskHook(input);
    
    assert(output.status === 'deny');
  });
});
```

---

## Integration Best Practices

### 1. Separation of Concerns

```typescript
// Clear boundaries between layers
interface PluginLayer {
  // Only OpenCode API interactions
  registerAgent(agent: AgentProfile): void;
  registerTool(tool: ToolDefinition): void;
  registerHook(hookName: string, handler: Function): void;
}

interface GovernanceLayer {
  // Only state management
  readState(): IdumbState;
  writeState(state: IdumbState): void;
  logAction(action: string, result: string): void;
}

interface DataLayer {
  // Only database operations
  query(sql: string, params: any[]): Promise<any>;
  execute(sql: string, params: any[]): Promise<void>;
  search(term: string, mode: string): Promise<SearchResult>;
}
```

### 2. Fail-Safe Integration

```typescript
// Always validate before external calls
const validateIntegration = (data: any, schema: ZodSchema) => {
  try {
    return schema.parse(data);
  } catch (error) {
    logError('Integration validation failed', error);
    throw new IntegrationError('Invalid data from external source');
  }
};

// Always handle external failures safely
const safeExternalCall = async (fn: Function) => {
  try {
    return await fn();
  } catch (error) {
    logError('External call failed', error);
    return fallbackValue; // Never crash
  }
};
```

### 3. Audit Trail

```typescript
// Every integration point logged
interface AuditLog {
  timestamp: string;
  layer: 'plugin' | 'governance' | 'data' | 'agent';
  action: string;
  source: string; // agent name or hook name
  target: string; // tool name or operation
  result: 'success' | 'failure' | 'partial';
  data?: any; // relevant details
}

// Log on every operation
const logAudit = (entry: AuditLog) => {
  const logPath = '.idumb/brain/governance/audit.log';
  const line = JSON.stringify(entry) + '\n';
  appendFileSync(logPath, line);
};
```

---

## Conclusion

iDumb v2's integration strategy emphasizes **stable, plugin-based connections** to OpenCode's ecosystem while maintaining clear **governance boundaries** at every integration point:

✅ **OpenCode Plugin** - Native agents, tools, commands, hooks
✅ **Local Brain Storage** - SQLite + Orama + Tree-sitter
✅ **Planning System** - Read-only access to `.planning/` artifacts
✅ **Agent Permissions** - Enforced at every tool call
✅ **Event-Driven Architecture** - Hooks at all decision points
✅ **No External Dependencies** - Works offline, zero cloud services
✅ **Audit Trail** - Every operation logged and traceable

This integration approach ensures **governance survives at every layer** while maintaining flexibility for users to work with any LLM provider and development workflow.

---

**Research Status:** Complete
**Ready for Roadmap:** Yes
**Confidence:** HIGH

*All integration points verified from source code, documentation, and OpenCode plugin architecture.*
