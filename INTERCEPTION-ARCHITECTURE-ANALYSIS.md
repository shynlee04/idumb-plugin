# iDumb Interception Architecture: The "HOW" Deep Dive

**Date:** 2026-02-02  
**Status:** Analysis Complete - Implementation Roadmap  
**Objective:** Untangle the knot of "nothing truly works" by understanding and controlling the 4 LLM message entry points

---

## The Core Problem

> "Nothing truly works and it is hard to explain why"

**Root Cause:** Agents receive governance instructions but don't consistently follow them because:
1. **Context arrives at wrong time** - Instructions in system prompts get buried by conversation
2. **No enforcement at decision points** - When LLM decides to execute vs delegate, no guard exists
3. **Delegation handoff is lossy** - Context doesn't survive the `@agent` → subagent transition
4. **Post-compact amnesia** - After context compaction, governance is forgotten

**Solution:** Intercept and transform messages at 4 critical entry points.

---

## The 4 Entry Points (What LLM Sees)

### Entry Point 1: Session Start (Cold Start)

**When:** New session created, first message to LLM  
**What LLM sees:** System prompt + first user message  
**Current Gap:** Agents load but governance context competes with everything else  
**Goal:** Force governance hierarchy to be top-of-mind before any decision

```
[Session Created]
    ↓
[System Prompt Loads]
    ↓
[First User Message]
    ↓
⚠️ PROBLEM: Agent sees everything at once, hierarchy gets lost
```

### Entry Point 2: Post-Compaction Recovery

**When:** Context window fills, compaction runs, new session starts  
**What LLM sees:** Compacted summary + system prompt  
**Current Gap:** iDumb injects via `experimental.session.compacting` but it's text, not enforcement  
**Goal:** Restore not just context, but mandatory hierarchy constraints

```
[Context Full]
    ↓
[Compaction Runs]
    ↓
[New Session with Summary]
    ↓
⚠️ PROBLEM: Summary doesn't include "you must delegate" enforcement
```

### Entry Point 3: Delegation Handoff

**When:** Parent delegates to subagent via `task` tool  
**What subagent sees:** Its own system prompt + delegated prompt  
**Current Gap:** No guarantee subagent knows it's in a delegation chain or what role to play  
**Goal:** Inject delegation context so subagent knows its place in hierarchy

```
[@coordinator calls task tool]
    ↓
[Subagent spawned]
    ↓
[Subagent sees: its prompt + task]
    ↓
⚠️ PROBLEM: Subagent doesn't know it's delegated to, acts independently
```

### Entry Point 4: Tool Decision Points

**When:** LLM decides which tool to use  
**What LLM sees:** Available tools, decides based on context  
**Current Gap:** Nothing stops coordinator from using `edit` instead of delegating to builder  
**Goal:** Force first tool use to be context-gathering, enforce role-based tool permissions

```
[User: "Fix the bug"]
    ↓
[LLM decides: I'll use edit tool directly]
    ↓
⚠️ PROBLEM: Coordinator violated "NEVER execute directly" rule
```

---

## The 3 Interception Strategies

### Strategy 1: Message Pre-Processing (The "WHAT" Control)

**Mechanism:** `experimental.chat.messages.transform` hook  
**What it does:** Transform ALL messages before they reach LLM  
**Power Level:** HIGHEST - Can modify, inject, reorder, or block messages

**Implementation Matrix:**

| Entry Point | Hook Used | Action | Content Injected |
|-------------|-----------|--------|------------------|
| Session Start | `messages.transform` | Prepend to first user message | Hierarchy reminder + active anchors |
| Post-Compact | `session.compacting` → `messages.transform` | Inject after compaction | "You are in delegation chain" |
| Delegation | `tool.execute.before` (task) + `messages.transform` | Modify task prompt | Delegation context |
| Tool Decision | `tool.execute.before` (all) | Enforce tool whitelist | Error if wrong tool used |

**HOW - Step by Step:**

```typescript
// In idumb-core.ts plugin
"experimental.chat.messages.transform": async (input, output) => {
  const state = readState(directory)
  const anchors = getActiveAnchors(state)
  
  // INTERCEPTION POINT 1: Session Start
  // Find the first user message and PREPEND governance context
  const firstUserMsg = output.messages.find(m => 
    m.parts.some(p => p.type === 'text' && p.text?.includes('user'))
  )
  
  if (firstUserMsg) {
    // Force governance to be READ FIRST
    const governancePrefix = buildGovernancePrefix(state, anchors)
    firstUserMsg.parts.unshift({
      type: 'text',
      text: governancePrefix
    })
  }
  
  // INTERCEPTION POINT 2: Post-Compaction
  // Detect if this is a compacted session (check message count/context)
  const isCompacted = output.messages.length < 5 && 
    output.messages.some(m => m.info?.role === 'system' && 
      m.parts.some(p => p.text?.includes('compacted')))
  
  if (isCompacted) {
    // Inject reminder after compaction summary
    output.messages.push({
      info: { role: 'user', id: 'governance-reminder' },
      parts: [{
        type: 'text',
        text: buildPostCompactReminder(state)
      }]
    })
  }
}
```

**Key Insight:** By prepending to the FIRST user message (not system prompt), we guarantee governance is consumed before any decision is made. System prompts get ignored; first user message gets attention.

---

### Strategy 2: Force First Tool Use (The "WHEN" Control)

**Mechanism:** `tool.execute.before` hook + message manipulation  
**What it does:** Control which tool gets used first in a session/delegation  
**Power Level:** HIGH - Can block tools, force specific tools, or inject tool selection context

**The Problem:**
- Coordinator sees user request
- Coordinator immediately uses `edit` tool (violation)
- No enforcement existed at decision moment

**The Solution:**
1. Track session state: "has first tool been used?"
2. In `tool.execute.before`, check if this is first tool use
3. If first tool is NOT context-gathering, BLOCK and inject reminder

**HOW - Implementation:**

```typescript
// Track first tool use per session
const sessionFirstTool = new Map<string, boolean>()

"tool.execute.before": async (input, output) => {
  const sessionId = input.sessionID
  const toolName = input.tool
  
  // Check if this is first tool use
  if (!sessionFirstTool.get(sessionId)) {
    sessionFirstTool.set(sessionId, true)
    
    // Get current agent from session metadata
    const agent = getCurrentAgent(sessionId)
    
    // ENFORCE ROLE-BASED FIRST TOOL
    const allowedFirstTools = {
      'idumb-supreme-coordinator': ['idumb-todo', 'idumb-state', 'idumb-context', 'task'],
      'idumb-high-governance': ['idumb-todo', 'idumb-state', 'task'],
      'idumb-low-validator': ['grep', 'glob', 'read', 'idumb-validate'],
      'idumb-builder': ['read', 'write', 'edit']
    }
    
    const allowed = allowedFirstTools[agent] || []
    
    if (!allowed.includes(toolName)) {
      // BLOCK this tool execution
      // Instead of executing, we inject a message forcing context-first
      
      // NOTE: We can't directly block, but we can:
      // 1. Modify args to be invalid (causes error)
      // 2. Use client.session.prompt() to inject reminder
      // 3. Log violation for analysis
      
      log(directory, `[VIOLATION] ${agent} tried to use ${toolName} as first tool`)
      
      // Strategy: Inject reminder via session prompt
      await client.session.prompt(sessionId, {
        message: `\n\n⚠️ GOVERNANCE VIOLATION DETECTED ⚠️\n` +
          `As ${agent}, your FIRST action must be context-gathering.\n` +
          `You attempted: ${toolName}\n` +
          `Required first: ${allowed.join(', ')}\n` +
          `\nDELEGATION HIERARCHY:\n` +
          `coordinator → high-governance → low-validator/builder\n` +
          `\nUse idumb-todo first, then delegate appropriately.`
      })
      
      // Make tool fail by providing invalid args
      output.args = { __BLOCKED__: true, __REASON__: 'context-first-required' }
    }
  }
  
  // INTERCEPTION POINT 4: Ongoing Tool Enforcement
  // Check tool permissions based on agent role
  if (toolName === 'edit' || toolName === 'write') {
    const agent = getCurrentAgent(sessionId)
    const canModifyFiles = ['idumb-builder'].includes(agent)
    
    if (!canModifyFiles) {
      log(directory, `[VIOLATION] ${agent} attempted file modification`)
      // Inject error message
      output.args = { 
        __BLOCKED__: true, 
        __REASON__: `${agent} cannot modify files. Delegate to idumb-builder.`
      }
    }
  }
}
```

**Key Insight:** By tracking session state and checking tool execution, we create runtime enforcement of hierarchy rules. The violation message gets injected into the conversation, forcing the LLM to see and acknowledge the error before continuing.

---

### Strategy 3: Error Message Manipulation (The "WHY" Control)

**Mechanism:** `permission.ask` hook + `tool.execute.after` error modification  
**What it does:** Transform permission denials into governance reminders  
**Power Level:** MEDIUM - Can't prevent denial, but can shape the message

**The Problem:**
- Tool permission denied → Generic error → LLM confused → Tries different approach
- No learning from denial, no reinforcement of hierarchy

**The Solution:**
- Intercept permission denials
- Replace generic error with governance-specific guidance
- Use denial as teaching moment

**HOW - Implementation:**

```typescript
"permission.ask": async (input, output) => {
  const { tool, agent } = input
  
  // Check if this would be denied based on role
  const agentRole = getAgentRole(agent)
  const allowedTools = getAllowedTools(agentRole)
  
  if (!allowedTools.includes(tool)) {
    // This will be denied - transform the response
    output.status = "deny"
    
    // The denial message goes to LLM - make it educational
    // We can't directly modify the message here, but we can:
    // 1. Log the attempt
    // 2. Use event hook to catch the denial and inject context
    
    log(directory, `[PERMISSION DENIED] ${agent} attempted ${tool}`)
    
    // Store for post-denial injection
    pendingDenials.set(input.sessionID, {
      agent,
      tool,
      reason: buildDenialReason(agent, tool),
      alternatives: buildAlternatives(agent, tool)
    })
  }
}

// Then in event hook, catch the denial and inject guidance
event: async ({ event }) => {
  if (event.type === 'permission.replied' && event.properties?.status === 'deny') {
    const sessionId = event.properties.sessionID
    const denialInfo = pendingDenials.get(sessionId)
    
    if (denialInfo) {
      // Inject educational message after denial
      await client.session.prompt(sessionId, {
        message: `\n\n🚫 PERMISSION DENIED: Governance Enforcement 🚫\n\n` +
          `Agent: ${denialInfo.agent}\n` +
          `Attempted: ${denialInfo.tool}\n\n` +
          `Why: ${denialInfo.reason}\n\n` +
          `Instead: ${denialInfo.alternatives}\n\n` +
          `Hierarchy Reminder:\n` +
          `• Supreme Coordinator: Delegate only, no execution\n` +
          `• High Governance: Coordinate, delegate to validators/builders\n` +
          `• Low Validator: Validate only (read tools)\n` +
          `• Builder: Execute only (write/edit tools)\n`
      })
      
      pendingDenials.delete(sessionId)
    }
  }
}
```

**Key Insight:** Permission denials become teachable moments. Instead of LLM getting confused by generic "permission denied", it receives specific guidance on hierarchy and correct delegation path.

---

## Integration Matrix: 4 Entry Points × 3 Strategies

| Entry Point | Strategy 1 (Message) | Strategy 2 (First Tool) | Strategy 3 (Errors) |
|-------------|---------------------|------------------------|---------------------|
| **1. Session Start** | Prepend governance to first user message | Force `idumb-todo` as first tool | N/A |
| **2. Post-Compact** | Inject hierarchy reminder after summary | Force context re-verification | N/A |
| **3. Delegation** | Modify task prompt with delegation context | Track delegation depth | Permission check on task spawn |
| **4. Tool Decision** | Tool whitelist in system prompt | Block non-context tools first | Transform denials to guidance |

---

## Implementation Priority

### Phase 1: Message Control (Highest Impact)
1. Implement `experimental.chat.messages.transform`
2. Build governance prefix injector
3. Detect session start vs compacted session
4. Test with all 4 agents

### Phase 2: First Tool Enforcement
1. Add session state tracking (first tool used?)
2. Implement tool whitelist per agent
3. Add violation logging and injection
4. Test delegation chains

### Phase 3: Error Transformation
1. Implement `permission.ask` hook
2. Build denial reason mapper
3. Add post-denial guidance injection
4. Test permission boundary enforcement

---

## Critical Implementation Notes

### 1. Hook Execution Order
```
1. permission.ask (can deny)
2. tool.execute.before (can modify args)
3. [Tool Executes]
4. tool.execute.after (can modify output)
5. experimental.chat.messages.transform (modifies what LLM sees)
```

### 2. Message Transformation Timing
- Transform runs BEFORE LLM sees messages
- Can add, remove, or modify any message
- Changes persist for that turn only
- Next turn starts fresh (unless compacted)

### 3. Session State Persistence
- Use `.idumb/sessions/{sessionId}.json` for metadata
- Track: firstToolUsed, delegationDepth, violationCount
- Clean up on `session.idle` or `session.deleted`

### 4. Subagent Context Injection
- When `task` tool is called, modify `output.args.prompt`
- Add delegation context to the prompt string
- Subagent receives modified prompt in its first message

---

## Validation: How to Test It Works

### Test 1: Session Start Injection
```
[New Session]
User: "Create a file"
Expected: Coordinator sees governance prefix BEFORE user message
Expected: Coordinator uses idumb-todo first
Expected: Coordinator delegates to builder for file creation
```

### Test 2: Post-Compact Recovery
```
[Long conversation]
[Compaction triggers]
[New session starts]
Expected: Compacted summary + hierarchy reminder
Expected: Agent remembers it must delegate
Expected: No direct execution after compact
```

### Test 3: Delegation Chain
```
[Coordinator delegates to high-governance]
Expected: High-governance sees delegation context
Expected: Knows it's in coordinator's chain
Expected: Further delegates to validator/builder appropriately
```

### Test 4: Tool Enforcement
```
[Coordinator tries to use edit directly]
Expected: Tool blocked
Expected: Violation message injected
Expected: Coordinator delegates to builder instead
```

---

## Success Criteria

✅ **Session Start:** First user message always prepended with governance  
✅ **Post-Compact:** Hierarchy restored after compaction  
✅ **Delegation:** Subagents know their place in chain  
✅ **Tool Control:** First tool is always context-gathering  
✅ **Error Learning:** Permission denials teach hierarchy  
✅ **All Agents:** Each respects its role constraints  

---

## Conclusion

The "HOW" is now clear:

1. **Message Interception** (`experimental.chat.messages.transform`) controls WHAT the LLM sees at session start and post-compact
2. **Tool Interception** (`tool.execute.before`) controls WHEN tools are used and ENFORCES role-based permissions
3. **Error Interception** (`permission.ask` + event hooks) controls WHY denials happen and turns them into learning moments

By implementing these 3 strategies at the 4 entry points, we transform "agents should follow roles" into "agents MUST follow roles" through technical enforcement, not just polite suggestions.

**Next Step:** Implement Phase 1 (Message Control) in `idumb-core.ts`.
