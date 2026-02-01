# OpenCode Delegation/Task Tool Hook Capabilities Research

**Project:** iDumb Meta-Framework Plugin  
**Researched:** 2026-02-02  
**Domain:** OpenCode Task Tool, Plugin Hooks, Agent Delegation  
**Confidence:** HIGH (Official docs + Confirmed GitHub issues)

---

## Executive Summary

This research investigates OpenCode's capabilities for delegation manipulation, task tool interception, and multi-cycle agent coordination. The findings reveal **significant limitations** that impact iDumb's governance architecture, particularly a **critical known bug** where plugin hooks don't intercept subagent tool calls.

**Key Findings:**
1. Plugin hooks (`tool.execute.before`/`after`) exist but **DO NOT fire for subagent tool calls** - confirmed bug (#5894)
2. Task tool permissions CAN be configured per-agent to restrict delegation targets
3. No native "bounce-back" or cycle control mechanisms exist
4. Workarounds exist through agent-level configuration and custom tool implementation

**Primary Recommendation:** iDumb must implement governance at the agent configuration level (not plugin hooks) and use custom tools for delegation orchestration.

---

## 1. Task Tool Interception

### What IS Possible

| Capability | Confidence | Evidence |
|------------|------------|----------|
| **Intercept PRIMARY agent tool calls** | HIGH | Official docs + confirmed working |
| **Modify tool arguments via `output.args`** | HIGH | Context7 code examples |
| **Block tools by throwing errors** | HIGH | .env protection example in docs |
| **Access tool context (agent, session, directory)** | HIGH | Official plugin docs |

**Working Code Example (PRIMARY agent only):**
```typescript
import type { Plugin } from "@opencode-ai/plugin"

export const InterceptPlugin: Plugin = async (ctx) => {
  return {
    "tool.execute.before": async (input, output) => {
      // Works for primary agents, NOT subagents!
      console.log(`Tool: ${input.tool}`)
      console.log(`Args: ${JSON.stringify(output.args)}`)
      
      // Modify arguments before execution
      if (input.tool === "bash") {
        output.args.command = `# Governance check\n${output.args.command}`
      }
      
      // Block if needed
      if (input.tool === "task" && shouldBlock(output.args)) {
        throw new Error("Delegation blocked by governance")
      }
    },
    
    "tool.execute.after": async (input, output) => {
      // Access result after tool execution
      console.log(`Tool ${input.tool} completed`)
      console.log(`Result: ${output.result}`)
    }
  }
}
```

### What is NOT Possible

| Limitation | Confidence | Impact | Evidence |
|------------|------------|--------|----------|
| **Intercept SUBAGENT tool calls** | HIGH | CRITICAL - Security bypass | GitHub Issue #5894 |
| **Modify task tool return values** | MEDIUM | Can't transform delegation results | No documented mechanism |
| **Inject context into delegated tasks** | HIGH | Can't prepend governance context | No mechanism exists |
| **Track delegation depth natively** | HIGH | No built-in depth tracking | Not in API |

**The Critical Bug (GitHub Issue #5894):**
```
[BUG] Plugin hooks (tool.execute.before) don't intercept subagent tool calls

Status: OPEN, assigned, labeled "bug"
Impact: Security policies implemented via plugins can be COMPLETELY BYPASSED
       by delegating work to subagents using the Task tool.

Attack Vector: Primary agent → Task tool → Subagent → Plugin hooks DON'T FIRE
```

### Workarounds

**Workaround 1: Agent-Level Tool Configuration**
```json
{
  "agent": {
    "build": {
      "tools": {
        "write": false,
        "edit": false,
        "bash": false
      }
    }
  }
}
```
**Limitation:** Must configure every agent manually, doesn't work for custom subagents.

**Workaround 2: Custom Delegation Tool**
Create a custom `idumb-delegate` tool that wraps the native task tool with governance:
```typescript
import { tool } from "@opencode-ai/plugin"

export default tool({
  description: "Delegate with governance",
  args: {
    agent: tool.schema.string(),
    prompt: tool.schema.string(),
  },
  async execute(args, context) {
    // Inject governance context
    const governedPrompt = `
## Governance Context
${await loadGovernance()}

## Delegated Task
${args.prompt}
    `
    // Cannot call task tool directly - must return instructions
    return `Execute: Task with agent=${args.agent}, prompt=<governed>`
  }
})
```
**Limitation:** Can't programmatically invoke native task tool.

---

## 2. Bounce-Back Loops / Result Routing

### What IS Possible

| Capability | Confidence | Evidence |
|------------|------------|----------|
| **Subagent results return to parent** | HIGH | Native behavior |
| **Navigate parent/child sessions** | HIGH | `<Leader>+Right/Left` keybinds |
| **Persist delegation results to disk** | HIGH | opencode-background-agents plugin |

**Native Behavior:**
```
Primary Agent → Task Tool → Subagent Session → [Work] → Result returns to Primary
```
The result automatically comes back. However:
- No hook fires when result returns
- Can't modify result before it reaches primary
- Can't route result elsewhere

### What is NOT Possible

| Limitation | Confidence | Impact |
|------------|------------|--------|
| **Task completion event hook** | HIGH | No `task.complete` event exists |
| **Intercept/modify return values** | HIGH | Can't transform delegation results |
| **Multi-cycle orchestration natively** | HIGH | Each delegation is atomic |
| **Force "return to coordinator" pattern** | MEDIUM | Must use prompt engineering |

### Workarounds

**Workaround 1: opencode-background-agents Plugin**
```
- Adds: delegate(prompt, agent), delegation_read(id), delegation_list()
- Results persisted to ~/.local/share/opencode/delegations/
- Survives context compaction
- Limitation: Only read-only agents can use delegate()
```

**Workaround 2: Prompt-Based Coordination**
Include in agent prompts:
```markdown
## Coordination Protocol
When you receive delegated work:
1. Complete the task
2. Report back with structured format:
   ```
   ## Delegation Result
   Status: [COMPLETE|BLOCKED|NEEDS_REVIEW]
   Summary: [brief summary]
   Details: [full findings]
   ```
3. The coordinator will synthesize and continue
```
**Limitation:** Relies on LLM compliance, no enforcement.

---

## 3. Delegation Cycle Control

### What IS Possible

| Capability | Confidence | Evidence |
|------------|------------|----------|
| **Set max steps per agent** | HIGH | `steps` config option |
| **Restrict which agents can be invoked** | HIGH | `permission.task` config |
| **Hide agents from @ menu** | HIGH | `hidden: true` |

**Task Permission Configuration:**
```json
{
  "agent": {
    "coordinator": {
      "mode": "primary",
      "permission": {
        "task": {
          "*": "deny",
          "governor-*": "allow",
          "validator-*": "allow"
        }
      }
    },
    "governor-high": {
      "mode": "subagent",
      "permission": {
        "task": {
          "*": "deny",
          "validator-*": "allow"
        }
      }
    }
  }
}
```
**Key Insight:** Last matching pattern wins. Use `*: deny` first, then allow specifics.

### What is NOT Possible

| Limitation | Confidence | Impact |
|------------|------------|--------|
| **Track delegation depth programmatically** | HIGH | No depth counter in API |
| **Limit total delegation chain length** | HIGH | No chain limit mechanism |
| **Force validation before completion** | HIGH | No hooks on completion |
| **Append context to returns** | HIGH | No return modification |

### Workarounds

**Workaround 1: Hierarchical Naming Convention + Task Permissions**
```
Level 1: idumb-coordinator (can only delegate to level-2-*)
Level 2: idumb-level-2-* (can only delegate to level-3-*)
Level 3: idumb-level-3-* (cannot delegate, permission.task: "*": "deny")
```

**Workaround 2: Custom Depth Tracking via State**
```typescript
// In custom tool or plugin state
const delegationStack: string[] = []

// Before delegation (in governance prompt)
delegationStack.push(agentName)
if (delegationStack.length > 3) {
  throw new Error("Max delegation depth exceeded")
}

// After delegation (must be prompt-based, no hook)
// Rely on agent reporting: "Delegation complete, depth: X"
```

---

## 4. Agent Hierarchy Enforcement

### What IS Possible

| Capability | Confidence | Evidence |
|------------|------------|----------|
| **Define which agents can invoke which** | HIGH | `permission.task` per agent |
| **Restrict tool access per agent** | HIGH | `tools` config |
| **Override permissions per agent** | HIGH | Agent-level permission config |
| **Control via patterns/wildcards** | HIGH | Glob patterns supported |

**Comprehensive Hierarchy Example:**
```json
{
  "agent": {
    "idumb-supreme-coordinator": {
      "mode": "primary",
      "description": "Top-level coordinator, never executes work directly",
      "tools": {
        "write": false,
        "edit": false,
        "bash": false
      },
      "permission": {
        "task": {
          "*": "deny",
          "idumb-governor-*": "allow"
        }
      }
    },
    "idumb-governor-high": {
      "mode": "subagent",
      "description": "Cross-phase validation",
      "tools": {
        "write": false,
        "edit": false
      },
      "permission": {
        "task": {
          "*": "deny",
          "idumb-validator-*": "allow"
        }
      }
    },
    "idumb-validator-code": {
      "mode": "subagent",
      "hidden": true,
      "tools": {
        "write": false,
        "edit": false,
        "bash": false
      },
      "permission": {
        "task": {
          "*": "deny"
        }
      }
    }
  }
}
```

### What is NOT Possible

| Limitation | Confidence | Impact |
|------------|------------|--------|
| **Plugin override of permission.task** | MEDIUM | No dynamic modification |
| **Inject governance into ALL delegations** | HIGH | Only via agent prompts |
| **Runtime hierarchy modification** | HIGH | Static config only |
| **User bypass still possible** | HIGH | Users can @ any agent |

**Important:** Even with `permission.task: deny`, users can still manually invoke any subagent via the `@` autocomplete menu.

### Workarounds

**Workaround 1: Prompt-Based Governance Injection**
In each agent's prompt file:
```markdown
## Mandatory Governance Protocol

You are operating under iDumb governance. Before ANY action:

1. Check your role in the hierarchy:
   - Coordinator: NEVER execute work directly
   - Governor: Validate and delegate to validators
   - Validator: Execute checks, return results

2. Include governance context in all delegations:
   - Current phase: {state.currentPhase}
   - Parent task: {state.parentTask}
   - Delegation depth: {state.depth}

3. Return results in structured format for coordinator synthesis
```

**Workaround 2: Session State Tracking**
Use `session.created` and `experimental.session.compacting` hooks to maintain hierarchy state:
```typescript
export const GovernancePlugin: Plugin = async (ctx) => {
  let hierarchyState = {
    currentDepth: 0,
    delegationChain: [],
    parentAgent: null
  }
  
  return {
    "session.created": async (event) => {
      // Initialize or load hierarchy state
      hierarchyState = await loadFromDisk()
    },
    
    "experimental.session.compacting": async (input, output) => {
      output.context.push(`
## Hierarchy State (Preserved)
- Depth: ${hierarchyState.currentDepth}
- Chain: ${hierarchyState.delegationChain.join(' → ')}
      `)
    }
  }
}
```

---

## Summary: What Works vs What Doesn't

### Available Mechanisms

| Mechanism | Works For | Doesn't Work For |
|-----------|-----------|------------------|
| `tool.execute.before` | Primary agent tools | Subagent tools |
| `tool.execute.after` | Primary agent results | Subagent results |
| `permission.task` | Restricting who can delegate to whom | Dynamic/runtime changes |
| `agent.tools` | Restricting tool access | Per-delegation changes |
| `hidden: true` | Hiding from @ menu | Preventing Task tool invocation |
| `experimental.session.compacting` | Preserving state | Modifying delegation behavior |

### Architectural Implications for iDumb

1. **Governance must be agent-level, not plugin-level**
   - Plugin hooks won't catch subagent activity
   - Use agent configuration + prompts for enforcement

2. **Hierarchy enforcement via naming conventions**
   - `permission.task` patterns: `idumb-tier-2-*`
   - Can prevent tier skipping

3. **No native bounce-back orchestration**
   - Must rely on prompt engineering
   - Or implement custom tools for delegation

4. **Compaction hook is the only reliable state preservation**
   - Use `experimental.session.compacting` for anchored context

---

## Confidence Breakdown

| Area | Confidence | Reasoning |
|------|------------|-----------|
| Plugin hook limitations | **HIGH** | Confirmed by GitHub issue #5894 |
| Agent permission.task | **HIGH** | Official documentation, code examples |
| Tool argument modification | **HIGH** | Official plugin examples |
| Bounce-back limitations | **MEDIUM** | No contradicting evidence, inferred from API |
| Workaround effectiveness | **MEDIUM** | Not battle-tested in production |

---

## Sources

### Primary (HIGH confidence)
- Context7: /sst/opencode - Plugin API, Agent configuration
- https://opencode.ai/docs/plugins/ (Jan 31, 2026)
- https://opencode.ai/docs/agents/ (Jan 31, 2026)
- https://github.com/sst/opencode/issues/5894 - Confirmed bug

### Secondary (MEDIUM confidence)
- https://github.com/kdcokenny/opencode-background-agents - Workaround pattern
- Exa code search - Community patterns

### Tertiary (LOW confidence)
- WebSearch results for "opencode delegation" - Needs verification

---

## Recommendations for iDumb

### Immediate Actions

1. **Do NOT rely on plugin hooks for governance enforcement**
   - The subagent bypass bug makes this insecure

2. **Implement hierarchy via agent configuration**
   - Use `permission.task` with naming conventions
   - Configure `tools` per agent tier

3. **Use prompt-based governance injection**
   - All agent prompts must include governance protocol
   - Structured return formats for synthesis

### Architecture Decisions

1. **Three-tier hierarchy via naming convention:**
   - `idumb-coordinator-*` (tier 1, primary)
   - `idumb-governor-*` (tier 2, subagent)
   - `idumb-validator-*` (tier 3, hidden subagent)

2. **State preservation via compaction hook:**
   - `experimental.session.compacting` for anchored context
   - Persist to `.idumb/brain/` between sessions

3. **Custom delegation tool (future):**
   - `idumb-delegate` that wraps task with governance
   - Tracks depth, injects context, validates before returning

---

## Open Questions

1. **When will bug #5894 be fixed?**
   - If fixed, plugin hooks become viable for governance
   - Monitor issue for updates

2. **Can we hook into session child creation?**
   - Would enable depth tracking
   - Not currently documented

3. **Can custom tools invoke native task tool?**
   - Would enable governed delegation wrapper
   - Needs experimentation

---

**Research Date:** 2026-02-02  
**Valid Until:** 2026-02-16 (pending bug fix status)
