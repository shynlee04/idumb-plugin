# Cycle 1: The Wrapper Era — Lessons from Failure

**Date:** 2026-02-02  
**Status:** ANALYSIS COMPLETE  
**Cycle:** 1 of 5 in iDumb Evolution Analysis  

---

## Executive Summary

The "Wrapper Era" represents iDumb's initial architectural approach: building a governance framework that wraps around OpenCode's plugin system to enforce hierarchical agent behavior through interception. We attempted to solve the fundamental problem of "agents don't follow their roles" by intercepting messages at 4 critical entry points (session start, post-compaction, delegation handoff, and tool decisions) using 3 strategies (message control, first tool enforcement, and error transformation).

The approach was technically sophisticated but ultimately flawed. While we correctly identified the core problem—governance instructions in system prompts get buried and ignored—we over-engineered the solution. The interception architecture required deep integration with OpenCode's experimental hooks (`experimental.chat.messages.transform`, `tool.execute.before`, `permission.ask`) that proved fragile and assumption-heavy. We built a complex enforcement matrix without validating that the underlying plugin infrastructure could reliably support it.

The Wrapper Era taught us that **interception alone cannot create reliable governance**. The LLM's behavior is fundamentally probabilistic, and attempting to enforce deterministic rules through message manipulation creates an adversarial relationship with the model rather than cooperative alignment. The architecture assumed we could control the LLM's decision-making process, when in reality we can only influence it.

---

## Original Wrapper Approach

### What We Were Trying to Build

iDumb as a **GSD Wrapper** — a governance layer that sits between the user and OpenCode, enforcing:

1. **Hierarchical Agent Delegation**: Supreme Coordinator → High Governance → Low Validator/Builder
2. **Role-Based Tool Permissions**: Each agent type has a whitelist of allowed tools
3. **Context-First Enforcement**: First tool use must be context-gathering (todoread)
4. **Post-Compaction Recovery**: Governance survives context window limits
5. **Delegation Chain Preservation**: Subagents know their place in the hierarchy

### The 4 Entry Points Strategy

| Entry Point | Problem | Wrapper Solution |
|-------------|---------|------------------|
| **Session Start** | Governance in system prompt gets ignored | Prepend governance to first user message |
| **Post-Compaction** | Context lost after compaction | Inject hierarchy reminder after summary |
| **Delegation Handoff** | Subagent doesn't know it's delegated | Modify task prompt with delegation context |
| **Tool Decision** | Wrong tool used for role | Block non-allowed tools in real-time |

### The 3 Interception Strategies

```
┌─────────────────────────────────────────────────────────────┐
│ Strategy 1: Message Control                                  │
│ Hook: experimental.chat.messages.transform                   │
│ Power: Transform ALL messages before LLM sees them           │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ Strategy 2: First Tool Enforcement                           │
│ Hook: tool.execute.before                                    │
│ Power: Block tools, force specific first actions             │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ Strategy 3: Error Transformation                             │
│ Hook: permission.ask + tool.execute.after                    │
│ Power: Turn denials into teachable moments                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Failures and Limitations Identified

### Failure 1: Over-Reliance on Experimental Hooks

**The Problem:** The entire architecture depended on OpenCode's `experimental.chat.messages.transform` hook and other experimental APIs that:
- Were not guaranteed to be stable
- Had unclear execution order guarantees
- Required assumptions about message structure that could change

**Evidence from Implementation Guide:**
```typescript
// From IMPLEMENTATION-GUIDE.md — heavy assumptions about message format
const firstUserMsgIndex = output.messages.findIndex(m => 
  m.info?.role === 'user' && 
  !m.parts?.some((p: any) => p.text?.includes('iDumb Governance'))
)
```

### Failure 2: Adversarial vs. Cooperative Approach

**The Problem:** The wrapper tried to **force** behavior through technical enforcement rather than **guide** behavior through clear instructions. This created:
- Complex workarounds (blocking tools by invalidating args)
- Violation injection that interrupts flow
- An antagonistic relationship with the LLM

**Evidence from Architecture Analysis:**
```typescript
// Making tool fail by providing invalid args
output.args = { __BLOCKED__: true, __REASON__: 'context-first-required' }
```

### Failure 3: Assumed Control Over LLM Decision-Making

**The Problem:** We assumed we could intercept and modify the LLM's tool selection at the moment of decision. In reality:
- The LLM decides based on its training and context
- We can only react after the decision is made
- Blocking creates confusion, not learning

**Evidence from Solution Summary:**
> "The LLM sees governance once, then forgets it when making actual tool choices."

### Failure 4: Complexity Without Validation

**The Problem:** We built a 784-line implementation guide and 448-line architecture analysis **before** validating that:
- The hooks work as documented
- The message transformation actually influences behavior
- The enforcement doesn't break normal operation

**Cross-Concept Matrix Finding (P3-5, P3-1):**
> Critical gaps in TODO manipulation and session management tools existed while we were designing complex interception logic.

### Failure 5: Ignored the Real Problem

**The Problem:** We focused on **technical enforcement** when the real issue was **clarity of instruction**. The wrapper tried to solve "agents don't follow roles" by adding more technical controls, when the solution was simpler: better agent definitions, clearer hierarchy communication, and appropriate tool scoping.

---

## Concepts That Survived (Still Valid for Meta-Framework)

Despite the wrapper approach's failures, several core concepts remain valid and essential:

### ✅ Surviving Concept 1: Hierarchical Agent Structure

**Still Valid:** The 4-tier agent hierarchy (Supreme Coordinator → High Governance → Low Validator → Builder) correctly models separation of concerns.

**Why It Survived:** This isn't a technical enforcement—it's an organizational pattern. The hierarchy reflects real governance needs:
- Coordination at the top
- Validation in the middle  
- Execution at the bottom

**Evidence:** Cross-Concept Matrix shows DG-1 and DG-2 (delegation requirements) as fully satisfied.

### ✅ Surviving Concept 2: Context-First Workflow

**Still Valid:** Agents should gather context before acting.

**Why It Survived:** This is a best practice, not an enforcement mechanism. The problem wasn't the concept—it was trying to **force** it through interception instead of **teaching** it through clear instructions.

**Evidence:** Supreme Coordinator agent definition lines 91-97: "Use 'todoread' first to understand context."

### ✅ Surviving Concept 3: Post-Compaction Anchoring

**Still Valid:** Critical context must survive context window limits.

**Why It Survived:** The `session.compacting` hook is a legitimate OpenCode feature for preserving context. The wrapper's approach of injecting reminders is valid—just over-engineered.

**Evidence:** Cross-Concept Matrix shows CL-6 (mid-session anchoring) as fully satisfied.

### ✅ Surviving Concept 4: Tool Permission Boundaries

**Still Valid:** Different agents should have different tool access.

**Why It Survived:** This is properly implemented through agent definitions (`edit: deny` in agent configs), not runtime interception. The wrapper tried to add a second layer of enforcement that conflicted with the first.

**Evidence:** Agent definitions correctly specify tool permissions; wrapper tried to duplicate this at runtime.

### ✅ Surviving Concept 5: GSD Integration Without Breaking

**Still Valid:** iDumb must coexist with GSD without breaking GSD artifacts.

**Why It Survived:** This was always about **respecting boundaries**, not enforcing them. The wrapper correctly identified that iDumb should not inject into `.planning/` files.

**Evidence:** Cross-Concept Matrix shows CL-7 (wrappers un-break regulation) as fully satisfied.

### ✅ Surviving Concept 6: The 4 Entry Points as Awareness Points

**Still Valid:** Session start, post-compaction, delegation, and tool decision are critical moments.

**Why It Survived:** These are **observation points**, not just interception points. Understanding when the LLM receives input helps design better prompts and agent definitions.

**Evidence:** The entry point analysis correctly identified when governance context is most at risk.

---

## Why Interception Alone Wasn't Enough

### The Fundamental Misconception

The Wrapper Era assumed:
> "If we can intercept and modify every message/tool/error, we can enforce governance."

The reality:
> "LLMs are probabilistic systems that respond to clear instructions, not adversarial controls."

### Technical Limitations

| Assumption | Reality |
|------------|---------|
| We can block tools by modifying args | LLM gets confused, tries again differently |
| We can prepend governance to messages | LLM may still ignore it if not relevant |
| We can detect agent from message content | Detection is heuristic, not guaranteed |
| We can track session state reliably | State is lost on restart, race conditions possible |
| Permission denials teach the LLM | LLM learns to work around blocks, not understand rules |

### The Better Approach

Instead of **interception**, the meta-framework should focus on:

1. **Clear Agent Definitions**: Each agent knows its role from clear, concise system prompts
2. **Appropriate Tool Scoping**: Give agents only the tools they should use (native OpenCode feature)
3. **Delegation Patterns**: Well-defined handoff patterns that don't require runtime injection
4. **Observation, Not Control**: Use hooks for logging and awareness, not enforcement
5. **Prompt Engineering**: Better instructions beat technical enforcement

---

## Cross-Concept Matrix Validation

The Cross-Concept Matrix (CROSS-CONCEPT-MATRIX-2026-02-02.md) validates our findings:

### What Was Working (60% Fully Satisfied)

- **Hooks**: 6 of 8 requirements fully satisfied — the infrastructure was sound
- **Agents**: Core hierarchy (DG-1, DG-2) was correctly defined
- **GSD Integration**: Non-breaking integration worked (CL-7)

### Critical Gaps (13% Missing)

| Gap | What It Reveals |
|-----|-----------------|
| **P3-5**: No TODO manipulation tool | We built interception before basic tools |
| **P3-1**: No session CRUD exports | Complex state tracking without fundamentals |
| **CL-1**: DOS/DONTS not embedded | Rules existed in docs, not in agents |
| **CL-3**: No config overlap guard | Assumed protection that didn't exist |

These gaps prove the wrapper was **putting the cart before the horse** — building complex enforcement before basic functionality.

---

## Lessons for the Meta-Framework

### Lesson 1: Start with Clear Contracts, Not Enforcement

The wrapper tried to enforce contracts that weren't clearly defined. The meta-framework should:
- Define clear agent roles in system prompts
- Use OpenCode's native tool scoping
- Trust the LLM to follow clear instructions

### Lesson 2: Use Hooks for Observation, Not Control

The wrapper used hooks to block and modify. The meta-framework should:
- Use hooks for logging and metrics
- Use hooks for context injection (not enforcement)
- Never block tools — let agent definitions handle permissions

### Lesson 3: Simplicity Beats Sophistication

The wrapper was 784 lines of complex interception logic. The meta-framework should:
- Favor clear prompts over complex code
- Use native features where possible
- Add complexity only when simple solutions fail

### Lesson 4: Validate Assumptions Early

The wrapper assumed experimental hooks would work reliably. The meta-framework should:
- Test assumptions with minimal prototypes
- Build on stable APIs, not experimental features
- Fail fast if an approach doesn't work

### Lesson 5: The Problem Was Communication, Not Control

The wrapper tried to control behavior. The meta-framework should:
- Focus on clear communication of expectations
- Design for cooperation, not enforcement
- Accept that LLMs are probabilistic, not deterministic

---

## Files from the Wrapper Era

| File | Purpose | Status |
|------|---------|--------|
| `INTERCEPTION-ARCHITECTURE-ANALYSIS.md` | Deep dive into interception | ARCHIVE — lessons extracted |
| `IMPLEMENTATION-GUIDE.md` | Step-by-step code | ARCHIVE — too complex |
| `INTERCEPTION-SOLUTION-SUMMARY.md` | Executive summary | ARCHIVE — approach abandoned |
| `CROSS-CONCEPT-MATRIX-2026-02-02.md` | Requirements validation | KEEP — gap analysis still valid |

---

## Conclusion

The Wrapper Era was a necessary exploration that revealed what **doesn't** work. We learned that:

1. **Interception is fragile** — depends on experimental APIs and assumptions
2. **Enforcement creates adversarial relationships** — LLMs respond better to guidance
3. **Complexity hid fundamental gaps** — we built enforcement before basics
4. **Clear instructions beat technical controls** — the solution is prompt engineering, not interception

The concepts that survive (hierarchy, context-first, anchoring, tool boundaries) will inform the meta-framework, but the **implementation approach** (interception, blocking, injection) is abandoned.

**Cycle 1 Complete:** We now understand why the wrapper failed and what principles to carry forward.

---

## Next: Cycle 2

Cycle 2 will analyze the **Meta-Framework Pivot** — how we moved from "control the LLM" to "guide the LLM through clear contracts and appropriate scoping."

**Key Questions for Cycle 2:**
- How do we define agent roles without runtime enforcement?
- What is the minimal viable governance layer?
- How do we use OpenCode's native features effectively?
