# iDumb Interception Implementation Guide

**Objective:** Transform `idumb-core.ts` to enforce governance through message/tool/error interception

---

## Part 1: Session State Tracking (Foundation)

Add session tracking to know where we are in the lifecycle:

```typescript
// Add at top of file, after imports

// ============================================================================
// SESSION TRACKING FOR INTERCEPTION
// ============================================================================

interface SessionTracker {
  firstToolUsed: boolean
  firstToolName: string | null
  agentRole: string | null
  delegationDepth: number
  parentSession: string | null
  violationCount: number
  governanceInjected: boolean
}

// In-memory session state (lost on restart, but that's ok)
const sessionTrackers = new Map<string, SessionTracker>()

// Persistent pending denials for error transformation
const pendingDenials = new Map<string, {
  agent: string
  tool: string
  timestamp: string
}>()

function getSessionTracker(sessionId: string): SessionTracker {
  if (!sessionTrackers.has(sessionId)) {
    sessionTrackers.set(sessionId, {
      firstToolUsed: false,
      firstToolName: null,
      agentRole: null,
      delegationDepth: 0,
      parentSession: null,
      violationCount: 0,
      governanceInjected: false
    })
  }
  return sessionTrackers.get(sessionId)!
}

function detectAgentFromMessages(messages: any[]): string | null {
  // Detect which agent is active based on system prompt or context
  for (const msg of messages) {
    const text = msg.parts?.map((p: any) => p.text).join(' ') || ''
    if (text.includes('idumb-supreme-coordinator')) return 'idumb-supreme-coordinator'
    if (text.includes('idumb-high-governance')) return 'idumb-high-governance'
    if (text.includes('idumb-low-validator')) return 'idumb-low-validator'
    if (text.includes('idumb-builder')) return 'idumb-builder'
  }
  return null
}

function getAllowedTools(agentRole: string | null): string[] {
  const toolPermissions: Record<string, string[]> = {
    'idumb-supreme-coordinator': [
      'idumb-todo', 'todowrite',
      'idumb-state', 'idumb-context', 'idumb-config', 'idumb-manifest',
      'task', 'read', 'glob'  // Read-only tools + delegation
    ],
    'idumb-high-governance': [
      'idumb-todo', 'todowrite',
      'idumb-state', 'idumb-context', 'idumb-config',
      'task', 'read', 'glob', 'grep'
    ],
    'idumb-low-validator': [
      'idumb-todo',
      'idumb-validate', 'idumb-state',
      'read', 'glob', 'grep', 'bash'  // Validation tools only
    ],
    'idumb-builder': [
      'idumb-todo',
      'idumb-state',
      'read', 'write', 'edit', 'bash'  // Execution tools
    ]
  }
  return toolPermissions[agentRole || ''] || []
}

function getRequiredFirstTools(agentRole: string | null): string[] {
  const firstTools: Record<string, string[]> = {
    'idumb-supreme-coordinator': ['idumb-todo', 'idumb-state', 'idumb-context'],
    'idumb-high-governance': ['idumb-todo', 'idumb-state'],
    'idumb-low-validator': ['idumb-todo', 'idumb-validate'],
    'idumb-builder': ['read']  // Builder should read before writing
  }
  return firstTools[agentRole || ''] || ['idumb-todo']
}
```

---

## Part 2: Message Transform Hook (Strategy 1)

Implement the `experimental.chat.messages.transform` hook:

```typescript
// Inside plugin return object, add this hook:

"experimental.chat.messages.transform": async (input, output) => {
  try {
    log(directory, "Transforming messages for governance injection")
    
    // Detect agent role from messages
    const agentRole = detectAgentFromMessages(output.messages)
    
    // Find session ID from context (may need to pass through or detect)
    const sessionId = detectSessionId(output.messages) || 'unknown'
    const tracker = getSessionTracker(sessionId)
    tracker.agentRole = agentRole
    
    // ==========================================
    // ENTRY POINT 1: Session Start (Cold Start)
    // ==========================================
    
    // Detect if this is the start of a session (no user messages yet processed)
    const userMessages = output.messages.filter(m => 
      m.info?.role === 'user' || 
      m.parts?.some((p: any) => p.type === 'text' && !p.text?.includes('governance'))
    )
    
    const isSessionStart = userMessages.length <= 1 && !tracker.governanceInjected
    
    if (isSessionStart && agentRole) {
      log(directory, `Session start detected for ${agentRole}`)
      
      // Build governance prefix
      const governancePrefix = buildGovernancePrefix(agentRole, directory)
      
      // Find the first actual user message (not system, not already processed)
      const firstUserMsgIndex = output.messages.findIndex(m => 
        m.info?.role === 'user' && 
        !m.parts?.some((p: any) => p.text?.includes('iDumb Governance'))
      )
      
      if (firstUserMsgIndex >= 0) {
        // PREPEND governance to first user message
        output.messages[firstUserMsgIndex].parts.unshift({
          type: 'text',
          text: governancePrefix
        })
        
        tracker.governanceInjected = true
        log(directory, `Governance injected for ${agentRole}`)
      }
    }
    
    // ==========================================
    // ENTRY POINT 2: Post-Compaction Recovery
    // ==========================================
    
    // Detect compacted session by looking for compaction indicators
    const isCompacted = output.messages.some(m =>
      m.parts?.some((p: any) => 
        p.text?.includes('compacted') || 
        p.text?.includes('summary of our conversation')
      )
    )
    
    if (isCompacted && agentRole) {
      log(directory, `Post-compact recovery for ${agentRole}`)
      
      // Find the last message (usually the compacted summary)
      const lastMsg = output.messages[output.messages.length - 1]
      
      // Append governance reminder AFTER the compacted summary
      if (lastMsg) {
        const reminder = buildPostCompactReminder(agentRole, directory)
        lastMsg.parts.push({
          type: 'text',
          text: reminder
        })
        
        tracker.governanceInjected = true
      }
    }
    
  } catch (error) {
    log(directory, `[ERROR] messages.transform failed: ${error instanceof Error ? error.message : String(error)}`)
  }
},

// Helper functions

function buildGovernancePrefix(agentRole: string, directory: string): string {
  const state = readState(directory)
  
  const roleInstructions: Record<string, string> = {
    'idumb-supreme-coordinator': `
⚡ IDUMB GOVERNANCE PROTOCOL ⚡

YOU ARE: Supreme Coordinator (TOP OF HIERARCHY)

🚫 ABSOLUTE RULES:
1. NEVER execute code directly
2. NEVER write files directly  
3. NEVER validate directly
4. ALWAYS delegate ALL work

✅ YOUR HIERARCHY:
YOU → @idumb-high-governance → @idumb-low-validator/@idumb-builder

✅ REQUIRED FIRST ACTION:
Use 'idumb-todo' tool to check current TODO list

✅ DELEGATION PATTERN:
- Validation work → @idumb-low-validator
- Execution work → @idumb-high-governance (who delegates to builder)

Current Phase: ${state?.phase || 'init'}
Framework: ${state?.framework || 'none'}

---
`,
    'idumb-high-governance': `
⚡ IDUMB GOVERNANCE PROTOCOL ⚡

YOU ARE: High Governance (MID-LEVEL COORDINATION)

🚫 RULES:
1. NEVER modify files directly (no write/edit)
2. ALWAYS delegate execution to builder
3. ALWAYS delegate validation to validator

✅ YOUR HIERARCHY:
@idumb-supreme-coordinator → YOU → @idumb-low-validator/@idumb-builder

✅ REQUIRED FIRST ACTION:
Use 'idumb-todo' tool to check current TODO list

Current Phase: ${state?.phase || 'init'}

---
`,
    'idumb-low-validator': `
⚡ IDUMB GOVERNANCE PROTOCOL ⚡

YOU ARE: Low Validator (VALIDATION WORKER)

🚫 RULES:
1. NEVER modify files (no write/edit)
2. ONLY use read/validation tools
3. Report findings, don't fix

✅ YOUR TOOLS:
- grep, glob, read (investigation)
- idumb-validate (validation)
- idumb-todo (check tasks)

✅ REQUIRED FIRST ACTION:
Use 'idumb-todo' tool to see what needs validation

---
`,
    'idumb-builder': `
⚡ IDUMB GOVERNANCE PROTOCOL ⚡

YOU ARE: Builder (EXECUTION WORKER)

✅ RULES:
1. ONLY you can write/edit files
2. NO delegations (you're the leaf node)
3. Verify before changes, commit after

🚫 CANNOT:
- Spawn subagents (task: false)
- Skip verification

✅ REQUIRED FIRST ACTION:
Read existing files before modifying

---
`
  }
  
  return roleInstructions[agentRole] || roleInstructions['idumb-supreme-coordinator']
}

function buildPostCompactReminder(agentRole: string, directory: string): string {
  const state = readState(directory)
  const anchors = state?.anchors?.filter((a: any) => 
    a.priority === 'critical' || a.priority === 'high'
  ) || []
  
  let reminder = `

📌 POST-COMPACTION REMINDER 📌

You are: ${agentRole}
Phase: ${state?.phase || 'init'}

🎯 CRITICAL ANCHORS (survived compaction):
`
  
  if (anchors.length > 0) {
    for (const anchor of anchors) {
      reminder += `- [${anchor.priority.toUpperCase()}] ${anchor.content}\n`
    }
  } else {
    reminder += '- No active anchors\n'
  }
  
  reminder += `
⚡ HIERARCHY REMINDER:
- Coordinator: Delegate only
- High-Gov: Coordinate and delegate  
- Validator: Validate only
- Builder: Execute only

Use 'idumb-todo' first to resume workflow.
`
  
  return reminder
}

function detectSessionId(messages: any[]): string | null {
  // Try to extract session ID from message metadata
  for (const msg of messages) {
    if (msg.info?.sessionID) return msg.info.sessionID
    if (msg.info?.id?.startsWith('ses_')) return msg.info.id
  }
  return null
}
```

---

## Part 3: Tool Interception (Strategy 2)

Enhance the `tool.execute.before` hook to enforce first tool rules:

```typescript
"tool.execute.before": async (input: any, output: any) => {
  try {
    const toolName = input.tool
    const sessionId = input.sessionID || 'unknown'
    const tracker = getSessionTracker(sessionId)
    const agentRole = tracker.agentRole || detectAgentFromSession(sessionId)
    
    // ==========================================
    // ENTRY POINT 3: Delegation Context
    // ==========================================
    
    if (toolName === "task") {
      const subagentType = output.args?.subagent_type || 'general'
      const description = output.args?.description || 'unknown'
      
      log(directory, `[DELEGATION] ${agentRole} → ${subagentType}: ${description}`)
      
      // INJECT delegation context into the task prompt
      const originalPrompt = output.args?.prompt || ''
      const delegationContext = buildDelegationContext(agentRole, subagentType, tracker.delegationDepth)
      
      // Prepend delegation context to the task prompt
      output.args.prompt = delegationContext + '\n\n' + originalPrompt
      
      // Track delegation depth
      tracker.delegationDepth++
      
      // Store parent-child relationship
      storeSessionMetadata(directory, `${sessionId}_child_of_${sessionId}`)
    }
    
    // ==========================================
    // ENTRY POINT 4: First Tool Enforcement
    // ==========================================
    
    if (!tracker.firstToolUsed) {
      tracker.firstToolUsed = true
      tracker.firstToolName = toolName
      
      const requiredFirst = getRequiredFirstTools(agentRole)
      
      if (!requiredFirst.includes(toolName)) {
        // VIOLATION: First tool is not context-gathering
        tracker.violationCount++
        
        log(directory, `[VIOLATION] ${agentRole} used ${toolName} as first tool (required: ${requiredFirst.join(', ')})`)
        
        // Inject violation message via client (if available)
        try {
          // We can't block the tool, but we can inject a strong warning
          // The warning will appear in the conversation after tool execution
          
          // Store violation for post-execution injection
          pendingDenials.set(sessionId, {
            agent: agentRole || 'unknown',
            tool: toolName,
            timestamp: new Date().toISOString()
          })
          
          // Log to state for audit
          addHistoryEntry(
            directory,
            `violation:first_tool:${agentRole}:${toolName}`,
            'interceptor',
            'fail'
          )
          
        } catch (e) {
          // Silent fail
        }
      } else {
        log(directory, `[OK] ${agentRole} correctly used ${toolName} as first tool`)
      }
    }
    
    // ==========================================
    // ONGOING: Tool Permission Enforcement
    // ==========================================
    
    const allowedTools = getAllowedTools(agentRole)
    
    // Special check for file modification
    if ((toolName === 'edit' || toolName === 'write') && agentRole !== 'idumb-builder') {
      log(directory, `[BLOCKED] ${agentRole} attempted file modification`)
      
      // Make tool fail by invalidating args
      output.args = {
        __BLOCKED_BY_GOVERNANCE__: true,
        __VIOLATION__: `${agentRole} cannot use ${toolName}`,
        __DELEGATE_TO__: 'idumb-builder'
      }
      
      // Log violation
      addHistoryEntry(
        directory,
        `violation:file_mod:${agentRole}:${toolName}`,
        'interceptor',
        'fail'
      )
      
      return
    }
    
    // General permission check
    if (!allowedTools.includes(toolName)) {
      log(directory, `[DENIED] ${agentRole} attempted unauthorized tool: ${toolName}`)
      
      // Block by invalidating args
      output.args = {
        __BLOCKED_BY_GOVERNANCE__: true,
        __VIOLATION__: `${agentRole} cannot use ${toolName}`,
        __ALLOWED_TOOLS__: allowedTools
      }
      
      return
    }
    
    // Track file operations for timestamp recording
    if (toolName === 'edit' || toolName === 'write') {
      const filePath = output.args?.path || output.args?.filePath || ''
      log(directory, `[FILE] ${toolName}: ${filePath}`)
      
      if (shouldTrackTimestamp(filePath)) {
        recordTimestamp(directory, filePath)
      }
    }
    
  } catch (error) {
    log(directory, `[ERROR] tool.execute.before failed: ${error instanceof Error ? error.message : String(error)}`)
  }
},

// Helper function for delegation context
function buildDelegationContext(parentRole: string | null, childRole: string, depth: number): string {
  return `
⚡ DELEGATION CONTEXT ⚡

You are being delegated to by: ${parentRole || 'unknown'}
Delegation depth: ${depth}

You are: ${childRole}

🎯 REMEMBER:
1. You are in a delegation chain
2. Report back to your parent when done
3. Follow the governance hierarchy
4. Use idumb-todo first to understand context

---

`
}

function detectAgentFromSession(sessionId: string): string | null {
  const tracker = sessionTrackers.get(sessionId)
  return tracker?.agentRole || null
}
```

---

## Part 4: Error Transformation (Strategy 3)

Add permission.ask hook and post-tool violation injection:

```typescript
// Add to plugin hooks:

"permission.ask": async (input: any, output: any) => {
  try {
    const { tool, sessionID } = input
    const sessionId = sessionID || 'unknown'
    const tracker = getSessionTracker(sessionId)
    const agentRole = tracker.agentRole
    
    const allowedTools = getAllowedTools(agentRole)
    
    if (!allowedTools.includes(tool)) {
      // This will be denied - log it
      log(directory, `[PERMISSION DENIED] ${agentRole} attempted ${tool}`)
      
      output.status = "deny"
      
      // Store for post-denial guidance
      pendingDenials.set(sessionId, {
        agent: agentRole || 'unknown',
        tool: tool,
        timestamp: new Date().toISOString()
      })
      
      // Log to history
      addHistoryEntry(
        directory,
        `permission_denied:${agentRole}:${tool}`,
        'interceptor',
        'fail'
      )
    }
  } catch (error) {
    log(directory, `[ERROR] permission.ask failed: ${error instanceof Error ? error.message : String(error)}`)
  }
},

"tool.execute.after": async (input: any, output: any) => {
  try {
    const toolName = input.tool
    const sessionId = input.sessionID || 'unknown'
    
    // Check if there was a pending violation for this session
    const violation = pendingDenials.get(sessionId)
    if (violation && toolName === violation.tool) {
      // This was a blocked tool - transform the error output
      
      const guidance = buildViolationGuidance(violation.agent, violation.tool)
      
      // Modify the output to include educational guidance
      output.output = guidance + '\n\n' + (output.output || '')
      output.title = `🚫 GOVERNANCE ENFORCEMENT: ${violation.agent}`
      
      // Clear the pending denial
      pendingDenials.delete(sessionId)
      
      log(directory, `[GUIDANCE INJECTED] For ${violation.agent} violation`)
    }
    
    // Check if this was a task delegation
    if (toolName === 'task') {
      const outputText = output.output || ''
      const hasError = outputText.toLowerCase().includes('error') || 
                      outputText.toLowerCase().includes('failed')
      
      const result = hasError ? 'fail' : 'pass'
      addHistoryEntry(
        directory,
        `task:${output.title || 'unknown'}`,
        'plugin',
        result as 'pass' | 'fail'
      )
    }
    
    // Track file operations
    if (toolName === 'edit' || toolName === 'write') {
      const outputText = output.output || output.title || ''
      if (outputText.includes('.planning/')) {
        // File in planning directory modified - log it
        log(directory, `Planning file modified: ${outputText}`)
      }
    }
    
  } catch (error) {
    log(directory, `[ERROR] tool.execute.after failed: ${error instanceof Error ? error.message : String(error)}`)
  }
},

function buildViolationGuidance(agent: string, tool: string): string {
  const alternatives: Record<string, string> = {
    'idumb-supreme-coordinator': 'Delegate to @idumb-builder for file operations',
    'idumb-high-governance': 'Delegate to @idumb-builder for file operations',
    'idumb-low-validator': 'Report findings to parent agent, do not modify',
    'idumb-builder': 'Verify with read tool before modifying'
  }
  
  return `
🚫 GOVERNANCE VIOLATION 🚫

Agent: ${agent}
Attempted tool: ${tool}
Status: BLOCKED

Why this was blocked:
- Your role does not have permission to use this tool
- Following iDumb hierarchical governance

What you should do instead:
${alternatives[agent] || 'Check your role permissions and delegate appropriately'}

Hierarchy Reminder:
┌─ Supreme Coordinator ──┐
│  Delegate only         │
├─ High Governance ──────┤
│  Coordinate, delegate  │
├─ Low Validator ────────┤
│  Validate, investigate │
└─ Builder ──────────────┘
   Execute, modify files

Next step: Use 'idumb-todo' to check workflow, then delegate appropriately.
`
}
```

---

## Part 5: Enhanced Event Hooks

Add session lifecycle tracking and cleanup:

```typescript
event: async ({ event }: { event: any }) => {
  try {
    // Session created - initialize tracking
    if (event.type === \"session.created\") {
      const sessionId = event.properties?.info?.id || 'unknown'
      log(directory, `Session created: ${sessionId}`)
      
      // Initialize tracker
      getSessionTracker(sessionId)
      
      // Store metadata
      storeSessionMetadata(directory, sessionId)
    }
    
    // Permission replied - inject guidance if denied
    if (event.type === 'permission.replied') {
      const sessionId = event.properties?.sessionID
      const status = event.properties?.status
      
      if (status === 'deny' && pendingDenials.has(sessionId)) {
        const denial = pendingDenials.get(sessionId)
        log(directory, `[PERMISSION EVENT] Denied ${denial?.agent} using ${denial?.tool}`)
        
        // Guidance will be injected via tool.execute.after
      }
    }
    
    // Session idle - cleanup
    if (event.type === "session.idle") {
      const sessionId = event.properties?.sessionID
      log(directory, `Session idle: ${sessionId}`)
      
      // Cleanup tracker
      if (sessionId && sessionTrackers.has(sessionId)) {
        const tracker = sessionTrackers.get(sessionId)
        log(directory, `Session stats: violations=${tracker?.violationCount}, depth=${tracker?.delegationDepth}`)
        sessionTrackers.delete(sessionId)
      }
    }
    
    // Session compacted
    if (event.type === \"session.compacted\") {
      const sessionId = event.properties?.sessionID
      log(directory, `Session compacted: ${sessionId}`)
      
      // Reset governance injected flag so it will be re-injected
      if (sessionId && sessionTrackers.has(sessionId)) {
        const tracker = sessionTrackers.get(sessionId)
        if (tracker) {
          tracker.governanceInjected = false
        }
      }
    }
      }
      
      syncWithGSD(directory)
    }
    
    // iDumb command executed
    if (event.type === \"command.executed\") {
      const command = event.properties?.command || \"\"
      
      if (command.startsWith(\"idumb:\") || command.startsWith(\"idumb-\")) {
        log(directory, `[CMD] iDumb command: ${command}`)
        addHistoryEntry(directory, `idumb_command:${command}`, \"plugin\", \"pass\")
      }
    }
    }
    
  } catch (error) {
    log(directory, `[ERROR] event hook failed: ${error instanceof Error ? error.message : String(error)}`)
  }
}
```

---

## Part 6: Testing the Implementation

Create a test protocol:

```typescript
// Add test function (call manually or via command)

async function runInterceptionTests(directory: string): Promise<void> {
  log(directory, '=== INTERCEPTION TESTS START ===')
  
  // Test 1: Session tracking
  const testSessionId = 'test_session_123'
  const tracker = getSessionTracker(testSessionId)
  console.assert(tracker.firstToolUsed === false, 'Session should start with firstToolUsed=false')
  
  // Test 2: Agent detection
  const testMessages = [
    { parts: [{ type: 'text', text: 'You are idumb-supreme-coordinator' }] }
  ]
  const detected = detectAgentFromMessages(testMessages)
  console.assert(detected === 'idumb-supreme-coordinator', 'Should detect coordinator')
  
  // Test 3: Tool permissions
  const coordTools = getAllowedTools('idumb-supreme-coordinator')
  console.assert(coordTools.includes('task'), 'Coordinator should delegate')
  console.assert(!coordTools.includes('edit'), 'Coordinator should not edit')
  
  const builderTools = getAllowedTools('idumb-builder')
  console.assert(builderTools.includes('edit'), 'Builder should edit')
  console.assert(!builderTools.includes('task'), 'Builder should not delegate')
  
  // Test 4: First tool requirements
  const coordFirst = getRequiredFirstTools('idumb-supreme-coordinator')
  console.assert(coordFirst.includes('idumb-todo'), 'Coordinator should start with idumb-todo')
  
  log(directory, '=== INTERCEPTION TESTS COMPLETE ===')
}
```

---

## Summary: What Gets Enforced

| Rule | Enforcement Mechanism |
|------|----------------------|
| Coordinator delegates only | Message prefix + tool whitelist (no edit/write) |
| High-gov coordinates only | Message prefix + tool whitelist (no edit/write) |
| Validator validates only | Message prefix + tool whitelist (read-only) |
| Builder executes only | Message prefix + no task delegation |
| First tool is context | Tool interception + violation logging |
| Post-compact recovery | Compaction detection + reminder injection |
| Delegation chain | Task prompt modification |
| Permission violations | Error transformation + guidance |

---

## Next Steps

1. **Copy the code blocks** into `idumb-core.ts`
2. **Add imports** at top of file
3. **Test** with `/idumb:init` and `/idumb:validate`
4. **Monitor logs** in `.idumb/governance/plugin.log`
5. **Iterate** based on violation patterns

This implementation transforms iDumb from "suggested guidelines" to "enforced governance" through technical interception at every critical decision point.
