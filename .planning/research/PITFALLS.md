# Domain Pitfalls: OpenCode Plugin & Agent Orchestration

**Domain:** OpenCode Plugin Development / Agent Orchestration Systems
**Project:** iDumb Meta Framework Plugin
**Researched:** 2026-02-01
**Confidence:** HIGH (based on official OpenCode docs and verified GitHub issues)

---

## Critical Pitfalls

Mistakes that cause rewrites, security vulnerabilities, or complete feature failure.

---

### Pitfall 1: Subagent Hook Bypass (Security Critical)

**What goes wrong:**
Plugin hooks using `tool.execute.before` successfully block tool calls from primary agents but **do not intercept tool calls from subagents** spawned via the `task` tool. This allows any security policy implemented via plugins to be completely bypassed by delegating to a subagent.

**Why it happens:**
- Plugin hooks are only registered at the primary agent level
- Subagents spawned via `task` tool run in isolated contexts without inheriting parent plugin hooks
- The delegation mechanism doesn't propagate hook registrations through the agent hierarchy

**Consequences:**
- Security policies (access control, audit logging, guardrails) become ineffective
- Code quality enforcement can be bypassed by simply using `@agent` delegation
- Compliance requirements cannot be met if agents can circumvent monitoring

**Prevention:**
1. **Never rely solely on plugin hooks for security** — always implement defense in depth
2. **Configure tool restrictions at agent level** in `opencode.json` for built-in subagents
3. **Document the limitation clearly** in any plugin that implements security policies
4. **Consider custom agent definitions** with restricted toolsets instead of runtime hook blocking

**Detection:**
- Test all plugin restrictions with both direct agent commands AND `@agent` delegation
- Look for successful tool execution in subagent sessions that should be blocked
- Monitor for unexpected tool calls in session logs

**Phase to address:** Phase 1 (Foundation) — Must design security model assuming hook bypass

**Sources:**
- GitHub Issue #5894: [Plugin hooks don't intercept subagent tool calls](https://github.com/anomalyco/opencode/issues/5894) (Verified, HIGH confidence)
- OpenCode Docs: [Agents - Tool Restrictions](https://opencode.ai/docs/agents#tools)

---

### Pitfall 2: Compaction Context Loss (Drift)

**What goes wrong:**
After session compaction, agents lose critical context including user-defined rules, original intent, and project constraints. The compacted summary fails to preserve essential constraints, causing agents to violate previously established rules.

**Why it happens:**
- Default compaction prompt only summarizes conversation, not rules/constraints
- User-defined rules in `AGENTS.md` or custom agent definitions are not automatically re-injected
- The compaction process optimizes for token reduction over context preservation
- No built-in mechanism to persist constraint state across compaction boundaries

**Consequences:**
- Agents commit code that violates project standards (e.g., committing when prohibited)
- Security policies are forgotten mid-session
- Original task intent drifts, leading to incorrect implementations
- User must repeatedly re-establish constraints

**Prevention:**
1. **Implement `experimental.session.compacting` hook** to inject rules into compaction prompt:
```typescript
export const CompactionGuard: Plugin = async (ctx) => {
  return {
    "experimental.session.compacting": async (input, output) => {
      output.context.push(`## CRITICAL RULES (MUST PRESERVE)
- NEVER commit or push without explicit user approval
- ALWAYS use GritQL for structural code changes
- Current task: ${ctx.currentTask}`)
    }
  }
}
```

2. **Replace the entire compaction prompt** for critical applications:
```typescript
output.prompt = `You are resuming work with these NON-NEGOTIABLE constraints:
1. [List critical rules]
2. [Current task state]
3. [Files being modified]

Previous context summary: [rest of summary]`
```

3. **Use short-lived sessions** to minimize compaction frequency
4. **Implement session validation** to detect drift post-compaction

**Detection:**
- Monitor agent behavior immediately after compaction events
- Compare pre/post-compaction rule adherence
- Watch for sudden changes in coding style or decision patterns

**Phase to address:** Phase 2 (Context Management) — Core infrastructure for preventing drift

**Sources:**
- GitHub Issue #3099: [Agent no follow rules after compact session](https://github.com/anomalyco/opencode/issues/3099) (Verified, HIGH confidence)
- OpenCode Docs: [Compaction hooks](https://opencode.ai/docs/plugins/#compaction-hooks)

---

### Pitfall 3: Plugin API Over-Engineering

**What goes wrong:**
Attempting to build features that require capabilities not exposed by the OpenCode plugin API, leading to fragile workarounds, monkey-patching, or abandoned features.

**Why it happens:**
- Current plugin architecture supports only ~25-30% of potential feature requirements
- Features needing persistence, schema extensions, TUI integration, or command registration cannot be implemented as plugins
- Developers don't discover limitations until deep into implementation
- Attempting to work around limitations creates maintenance nightmares

**Known API Limitations:**
| Capability | Status | Workaround |
|------------|--------|------------|
| Modify system prompts directly | NOT POSSIBLE | Use `session.prompt({ system: ... })` |
| Inject invisible context | NOT POSSIBLE | Use custom tools with context detection |
| Storage API for persistence | NOT AVAILABLE | External files (fragile) |
| Schema extensions | NOT AVAILABLE | None |
| TUI rendering hooks | NOT AVAILABLE | None |
| Command registration | NOT AVAILABLE | None |
| Direct message history modification | NOT POSSIBLE | Hooks only transform at runtime |

**Consequences:**
- Forked codebase that's hard to maintain
- Features that break with every OpenCode update
- User confusion when plugins don't work as expected
- Abandoned projects due to maintenance burden

**Prevention:**
1. **Validate feasibility BEFORE implementation** using official plugin documentation
2. **Design within constraints** — focus on what plugins CAN do well:
   - Custom tools (powerful and well-supported)
   - Event hooks (tool execution, file changes, sessions)
   - Notifications and logging
   - Compaction customization

3. **For features requiring unsupported APIs**, consider:
   - Contributing to OpenCode core (if appropriate)
   - Using external tools/services instead of plugins
   - Reducing scope to fit plugin capabilities

4. **Document limitations prominently** in plugin READMEs

**Detection:**
- Feature requirements that mention "persist", "modify storage", "custom UI", or "new commands"
- Implementation plans requiring "fork" or "patch"
- Code attempting to access internal OpenCode modules

**Phase to address:** Phase 1 (Foundation) — Scope validation must happen before any implementation

**Sources:**
- GitHub Issue #10868: [Plugin API Extensions for Storage, Schema, TUI, Command Registration](https://github.com/anomalyco/opencode/issues/10868) (Verified, HIGH confidence)
- OpenCode Docs: [Plugins Overview](https://opencode.ai/docs/plugins/)

---

### Pitfall 4: Delegation Chain Context Breakdown

**What goes wrong:**
When agents delegate to subagents via `task` tool, critical context is lost or transformed incorrectly, causing subagents to work with incomplete or incorrect information.

**Why it happens:**
- Context passed to subagents is filtered/summarized, losing nuance
- Tool results from parent agent may not be visible to subagent
- File system state may change between parent and subagent execution
- No guarantee that subagent receives full context of parent's intent

**Consequences:**
- Subagents make incorrect decisions based on partial information
- Duplicate work across agent hierarchy
- Inconsistent results when same task delegated differently
- Debugging becomes extremely difficult (which agent made what decision?)

**Prevention:**
1. **Explicit context passing** — always include full context in task descriptions:
```typescript
// BAD
@architect Review this code

// GOOD
@architect Review this code for security issues.
CONTEXT:
- This is a payment processing module
- Must comply with PCI-DSS
- Previous review found SQL injection risk in line 45
- File: src/payments/checkout.ts
```

2. **Use custom tools for complex delegation** — tools can enforce context requirements
3. **Implement context validation** — subagents should verify they have necessary context before proceeding
4. **Minimize delegation depth** — prefer 1-2 levels over deep hierarchies

**Detection:**
- Subagents asking clarifying questions parent already answered
- Inconsistent results from same subagent on similar tasks
- Subagents making assumptions that contradict parent's context

**Phase to address:** Phase 2 (Agent Orchestration) — Must design delegation patterns carefully

**Sources:**
- Research: [Multi-Agent System Reliability: Failure Patterns](https://www.getmaxim.ai/articles/multi-agent-system-reliability-failure-patterns-root-causes-and-production-validation-strategies/)
- Research: [Why Multi-Agent LLM Systems Fail](https://www.augmentcode.com/guides/why-multi-agent-llm-systems-fail-and-how-to-fix-them)

---

### Pitfall 5: Framework Concept Misalignment

**What goes wrong:**
When wrapping external frameworks (like GSD, BMAD, etc.), the plugin breaks core framework concepts by incorrect hierarchy mapping, wrong abstraction boundaries, or violating framework constraints.

**Why it happens:**
- Plugin developers misunderstand framework's core abstractions
- Attempting to force-fit framework patterns into OpenCode's plugin model
- Not respecting framework's constraints (e.g., BMAD's explicit no-code-changes rule during research)
- Leaky abstractions expose implementation details

**Consequences:**
- Framework guarantees are violated (e.g., research phase modifies code)
- Users get inconsistent behavior between framework documentation and plugin behavior
- Framework-specific tooling becomes incompatible
- Debugging is difficult due to abstraction violations

**Prevention:**
1. **Deeply understand framework before wrapping**:
   - Read framework philosophy and constraints
   - Understand the "why" behind each phase/rule
   - Identify non-negotiable constraints

2. **Map framework concepts correctly**:
   - Framework Phase → OpenCode Agent
   - Framework Tool → OpenCode Custom Tool
   - Framework State → Session context + file state
   - Framework Constraint → Agent rules + tool validation

3. **Validate constraint enforcement**:
   - Test that research agents CANNOT modify files
   - Verify phase transitions happen correctly
   - Ensure framework invariants are maintained

4. **Document differences** — be explicit about where plugin behavior differs from native framework

**Detection:**
- Framework violations in session logs (wrong tool use in wrong phase)
- User reports of "this isn't how [framework] is supposed to work"
- State inconsistencies between plugin and framework expectations

**Phase to address:** Phase 1 (Foundation) — Framework mapping is foundational design decision

**Sources:**
- Research: [API Design Antipattern: Leaky Abstractions](https://apidesignmatters.substack.com/p/api-design-antipattern-leaky-abstractions)
- Research: [LIQUID Anti-Patterns: Erosion of SOLID Principles](https://levelup.gitconnected.com/liquid-anti-patterns-identifying-the-erosion-of-solid-principles-e26233ac8e8d)

---

## Moderate Pitfalls

Mistakes that cause delays, technical debt, or reduced functionality.

---

### Pitfall 6: Plugin Hook Conflicts

**What goes wrong:**
Multiple plugins register hooks on the same event, causing unpredictable behavior, race conditions, or one plugin silently overriding another.

**Why it happens:**
- Plugin load order affects hook execution order
- Hooks may modify shared state (output object) causing conflicts
- No built-in mechanism for plugin coordination
- Plugins assume they're the only ones modifying certain behaviors

**Consequences:**
- Non-deterministic behavior depending on plugin load order
- One plugin's security policy being overridden by another
- Difficult to debug (which plugin caused this change?)
- Plugin combinations that should work together fail

**Prevention:**
1. **Design hooks to be composable**:
   - Add to arrays (`.push()`) rather than replacing
   - Use namespaced keys to avoid collisions
   - Document what your hook modifies

2. **Respect existing modifications**:
```typescript
"tool.execute.before": async (input, output) => {
  // Check if another plugin already modified
  if (output.args.alreadyProcessed) return
  
  // Your modification
  output.args.yourPluginData = { ... }
  output.args.alreadyProcessed = true
}
```

3. **Document hook usage** in plugin README
4. **Test with common plugin combinations**

**Detection:**
- Behavior changes when plugins are loaded in different order
- One plugin's output not appearing when another is enabled
- Console logs showing multiple plugins modifying same data

**Phase to address:** Phase 3 (Plugin Ecosystem) — When multiple plugins may coexist

**Sources:**
- Research: [Plugin hook conflicts - Cypress Issue](https://github.com/cypress-io/cypress/issues/5240)
- Research: [Hook conflict between two plugins - uMod](https://umod.org/community/rust/49389-hook-conflict-between-two-plugins)

---

### Pitfall 7: Session State / File System Desynchronization

**What goes wrong:**
The agent's understanding of file state drifts from actual file system state, causing agents to make decisions based on stale information.

**Why it happens:**
- File changes outside OpenCode aren't immediately visible
- Cached file contents in session context become stale
- Race conditions between file watchers and agent actions
- Compaction may summarize file state incorrectly

**Consequences:**
- Agents edit files based on old versions
- Duplicate or conflicting changes
- "File not found" errors when agent expects file to exist
- Incorrect code analysis based on stale file contents

**Prevention:**
1. **Use file watcher hooks** to detect external changes:
```typescript
"file.watcher.updated": async (event) => {
  // Invalidate cached state for this file
  await invalidateFileCache(event.filePath)
}
```

2. **Re-read files before critical operations** — don't trust session context for file contents
3. **Implement version checking** — compare file modification times
4. **Handle conflicts gracefully** — detect and report when external changes conflict with planned changes

**Detection:**
- Agents reporting file contents that don't match reality
- "Merge conflicts" when there shouldn't be any
- Unexpected file modification times in logs

**Phase to address:** Phase 2 (Context Management) — File state tracking is core context feature

**Sources:**
- Research: [Multi Agent State Sync](https://medium.com/beyond-localhost/multi-agent-state-sync-when-a-thousand-ai-agents-share-one-world-f14b7de7b850)
- Research: [AI Agent state synchronization](https://www.tencentcloud.com/techpedia/126702)

---

### Pitfall 8: Context Window Mismanagement

**What goes wrong:**
Poor context window management causes excessive token usage, frequent compaction (losing context), or hitting provider limits.

**Why it happens:**
- Including unnecessary file contents in context
- Not summarizing or filtering tool outputs
- Redundant context across multiple messages
- Not taking advantage of context compression techniques

**Consequences:**
- High API costs from excessive token usage
- Frequent compaction losing important context
- Hitting context limits mid-task
- Poor agent performance due to "noise" in context

**Prevention:**
1. **Implement context-aware tools** — only include relevant context:
```typescript
// Custom tool that returns only necessary context
export const selectiveRead = tool({
  description: "Read file with context filtering",
  args: { filePath: z.string(), relevantLines: z.array(z.number()).optional() },
  async execute(args, context) {
    const content = await readFile(args.filePath)
    if (args.relevantLines) {
      return filterToRelevantLines(content, args.relevantLines)
    }
    return content
  }
})
```

2. **Summarize large outputs** — tool results over X tokens should be summarized
3. **Use context markers** — allow agents to mark content as "forgettable"
4. **Monitor token usage** — implement alerts when approaching limits

**Detection:**
- Rapid token count growth in session
- Frequent compaction events
- Provider "context length exceeded" errors

**Phase to address:** Phase 2 (Context Management) — Core efficiency concern

**Sources:**
- Research: [Context Engineering: Why Agents Fail](https://inkeep.com/blog/context-engineering-why-agents-fail)
- GitHub Issue #10868: Forget tool proposal for context management

---

## Minor Pitfalls

Mistakes that cause annoyance but are easily fixable.

---

### Pitfall 9: Poor Plugin Load Order Dependencies

**What goes wrong:**
Plugin assumes specific load order or depends on another plugin being loaded first, causing errors when order changes.

**Prevention:**
1. Make plugins self-contained
2. Use explicit dependency declaration if available
3. Handle missing dependencies gracefully

**Phase to address:** Phase 3 (Distribution)

---

### Pitfall 10: Console.log Instead of Structured Logging

**What goes wrong:**
Using `console.log` for plugin logging makes debugging difficult and logs don't integrate with OpenCode's logging system.

**Prevention:**
Always use `client.app.log()`:
```typescript
await client.app.log({
  service: "my-plugin",
  level: "info", // debug, info, warn, error
  message: "Operation completed",
  extra: { operationId, duration }
})
```

**Phase to address:** Phase 1 (Foundation)

**Source:** OpenCode Docs: [Logging](https://opencode.ai/docs/plugins/#logging)

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Security Model Design | Subagent Hook Bypass (Pitfall 1) | Design defense in depth, don't rely solely on hooks |
| Context Management | Compaction Context Loss (Pitfall 2) | Implement compaction hooks, test post-compaction behavior |
| Feature Scoping | Plugin API Over-Engineering (Pitfall 3) | Validate against documented API capabilities |
| Agent Orchestration | Delegation Chain Breakdown (Pitfall 4) | Explicit context passing, minimize delegation depth |
| Framework Integration | Concept Misalignment (Pitfall 5) | Deep framework understanding, constraint validation |
| Multi-Plugin Support | Hook Conflicts (Pitfall 6) | Design composable hooks, document interactions |
| File Operations | State Desynchronization (Pitfall 7) | Re-read before critical ops, use file watchers |
| Performance | Context Window Mismanagement (Pitfall 8) | Summarize outputs, filter context, monitor tokens |

---

## Research Confidence Assessment

| Area | Confidence | Reason |
|------|------------|--------|
| Subagent Hook Bypass | HIGH | Verified GitHub issue #5894, official behavior |
| Compaction Context Loss | HIGH | Verified GitHub issue #3099, documented hook API |
| Plugin API Limitations | HIGH | GitHub issue #10868, official docs |
| Delegation Issues | MEDIUM | Multiple research sources, consistent patterns |
| Framework Misalignment | MEDIUM | Research on abstraction leaks, framework patterns |
| Hook Conflicts | MEDIUM | Research on plugin systems, some verified examples |
| State Desynchronization | MEDIUM | Research on multi-agent state, some verified |
| Context Management | MEDIUM | Research + official compaction docs |

---

## Sources

### Official/OpenCode (HIGH Confidence)
1. OpenCode Plugin Documentation: https://opencode.ai/docs/plugins/
2. GitHub Issue #5894: Plugin hooks don't intercept subagent tool calls
3. GitHub Issue #3099: Agent no follow rules after compact session
4. GitHub Issue #10868: Plugin API Extensions request

### Research/Analysis (MEDIUM Confidence)
5. Multi-Agent System Reliability: Failure Patterns (getmaxim.ai)
6. Why Multi-Agent LLM Systems Fail (augmentcode.com)
7. Context Engineering: Why Agents Fail (inkeep.com)
8. Multi Agent State Sync (medium.com/beyond-localhost)
9. API Design Antipattern: Leaky Abstractions (substack)

### Community/Discussion (LOW Confidence - Patterns Only)
10. Various plugin conflict discussions
11. Framework abstraction articles

---

## Summary for Roadmap

**MUST address in Phase 1 (Foundation):**
- Subagent Hook Bypass — Design security model accordingly
- Plugin API Over-Engineering — Scope validation process
- Framework Concept Misalignment — Deep framework study

**MUST address in Phase 2 (Context Management):**
- Compaction Context Loss — Implement compaction hooks
- Delegation Chain Breakdown — Design explicit context passing
- State Desynchronization — File watcher integration
- Context Window Mismanagement — Efficient context handling

**Address in Phase 3 (Ecosystem):**
- Plugin Hook Conflicts — Composable hook design

**Continuous attention:**
- All minor pitfalls through code review and testing
