---
name: hierarchical-mindfulness
description: This skill should be used when the user asks to "orchestrate", "delegate", "coordinate agents", "enforce hierarchy", "mindful delegation", "hierarchical thinking", "chain of command", or "orchestrator patterns". Essential for coordinators and high-governance agents to maintain delegation integrity.
version: 0.1.0
license: MIT
metadata:
  audience: ai-agents
  workflow: orchestration
---

# Hierarchical Mindfulness

Mindful orchestration through constant awareness of delegation hierarchy, session state, and chain integrity.

`★ Insight ─────────────────────────────────────`
- The "Chain Cannot Break": every action must trace back through Milestone → Phase → Plan → Task
- Delegation depth awareness prevents infinite loops and context pollution
- Session resumption requires detecting idle time, governance level, and phase alignment
`─────────────────────────────────────────────────`

## Core Philosophy

### Mindful Orchestration

Mindful orchestration operates on three principles:

1. **Hierarchy First**: Always know position in the chain before acting
2. **Context Awareness**: Understand session state, delegation depth, and phase
3. **Evidence-Based**: Every delegation returns structured proof of completion

### The Unbreakable Chain

```
Milestone → Phase → Plan → Task
     ↓
coordinator → governance → validator → builder
```

**Critical Rule**: Each level delegates ONLY to the level directly below it. Never skip levels.

```yaml
forbidden_patterns:
  - "coordinator → builder"     # Skips governance and validator
  - "governance → builder"      # Skips validator
  - "validator → coordinator"   # Upward delegation violates chain

valid_patterns:
  - "coordinator → governance"  # Direct child
  - "governance → validator"    # Direct child
  - "validator → builder"       # Direct child
```

---

## Session State Awareness

Before ANY delegation, assess session state:

### Session Lifecycle Detection

| State | Condition | Behavior |
|-------|-----------|----------|
| **New** | First tool not yet used | Inject full governance context |
| **Active** | < 1 hour idle | Continue normal delegation |
| **Resumed** | 1-48 hours idle | Re-establish context, verify phase |
| **Stale** | > 48 hours idle | Require user confirmation |
| **Compacted** | Context window full | Use anchors for continuity |

### Delegation Depth Tracking

```yaml
depth_levels:
  0: "Root session (user)"
  1: "Primary agent (@idumb-supreme-coordinator)"
  2: "Mid-level governance (@idumb-high-governance)"
  3: "Validator (@idumb-low-validator)"
  4: "Builder (@idumb-builder)"

rules:
  - Max depth: 4
  - Depth > 4: Indicates potential loop
  - Each delegation increments depth
  - Return decrements depth
```

### Governance Level Assessment

| Level | Description | Protocol |
|-------|-------------|----------|
| **strict** | Zero tolerance for violations | Block on any chain break |
| **standard** | Warn on soft violations | Allow with --force override |
| **minimal** | Log only | Observe without blocking |

---

## Orchestration Protocol

### Step 1: Assess Position

Before delegating, verify:

```yaml
checklist:
  1: "Read .idumb/brain/state.json"
  2: "Identify current phase"
  3: "Check delegation depth"
  4: "Verify agent role matches permissions"
  5: "Confirm target is valid child in hierarchy"
```

### Step 2: Delegate Mindfully

Structure every delegation:

```yaml
delegation_template:
  agent: "[valid child agent]"
  context:
    phase: "[current phase]"
    state_snapshot: "[relevant state]"
    anchors: "[critical anchors]"
  requirements:
    constraints: "[what cannot be done]"
    permissions: "[what tools are allowed]"
    deliverable: "[expected return format]"
  tracking:
    delegation_id: "[unique identifier]"
    parent_session: "[for traceability]"
```

### Step 3: Validate Return

Never accept unstructured responses:

```yaml
required_return_format:
  status: "pass | fail | partial"
  evidence: "[what was verified]"
  actions_taken: "[list of operations]"
  files_modified: "[if applicable]"
  next_action: "[recommended continuation]"
  delegation_id: "[matching request]"
```

---

## Chain Enforcement

### MUST-BEFORE Rules

Certain operations have prerequisites:

```yaml
init_chain:
  - "All /idumb:* commands require state.json"
  - "Exception: /idumb:init, /idumb:help"

project_chain:
  - "/idumb:roadmap requires PROJECT.md"
  - "/idumb:discuss-phase requires ROADMAP.md"

phase_chain:
  - "/idumb:execute-phase requires PLAN.md"
  - "/idumb:verify-work requires execution evidence"

validation_chain:
  - "Phase complete requires VERIFICATION.md"
  - "Commit suggests recent validation"
```

### Violation Handling

| Severity | Action | User Override |
|----------|--------|---------------|
| **HARD_BLOCK** | Stop execution | No |
| **SOFT_BLOCK** | Block with --force option | Yes |
| **WARN** | Continue with warning | N/A |

---

## Session Resumption Protocol

### Conditional Resumption

```yaml
if_idle_hours:
  1-48:
    action: "Resume with context injection"
    inject:
      - "Current phase"
      - "Active anchors (critical/high)"
      - "Pending TODOs"
      - "Last action history (5)"

  48-168:
    action: "Warn user of staleness"
    require:
      - "User confirmation to continue"
      - "Phase verification"
      - "Optional: create checkpoint"

  >168:
    action: "Critical staleness"
    require:
      - "Explicit user acknowledgment"
      - "State refresh recommendation"
      - "Archive old context if continuing"
```

### Governance Injection on Resume

When resuming, inject based on session level:

```yaml
root_session:
  inject: "Full governance context + anchors"
  reason: "Primary orchestration layer"

all_session:
  inject: "Minimal context + task scope"
  reason: "Prevent context bloat in delegation"

resumed_all:
  inject: "Re-establish delegation chain"
  reason: "Mindfulness of parent session context"
```

---

## Mindfulness Triggers

### When to Pause and Reassess

Pause delegation when:

1. **Delegation depth exceeds 4**: Potential infinite loop
2. **Same agent spawns repeatedly**: Detection needed
3. **Chain violation detected**: Must address before continuing
4. **Context window > 80%**: Pre-compaction checkpoint
5. **Session idle > 1 hour**: Resumption protocol

### When to Force Checkpoint

Create checkpoints before:

1. **Phase transitions**
2. **Major structural changes**
3. **After 10+ iterations**
4. **Before potential breaking operations**
5. **When session shows signs of stall**

---

## Error Recovery

### Chain Break Recovery

```yaml
if_chain_break_detected:
  1: "Identify break point in chain"
  2: "Log violation with evidence"
  3: "Determine if HARD_BLOCK or SOFT_BLOCK"
  4: "Apply appropriate action"
  5: "Offer user remediation options"

remediation_options:
  - "Run prerequisite command"
  - "Override with --force (if allowed)"
  - "Create missing artifact"
  - "Return to parent agent"
```

### Delegation Loop Detection

```yaml
loop_indicators:
  - "Same agent spawned 3+ times"
  - "Delegation depth > 5"
  - "Same task delegated repeatedly"
  - "No progress after 5 iterations"

actions:
  - "Log stall detection"
  - "Return to parent with error"
  - "Suggest alternative approach"
  - "Never auto-fix loop"
```

---

## Additional Resources

### Reference Files

For detailed implementation guidance, consult:

- **`references/chain-enforcement.md`** - Complete MUST-BEFORE dependency rules
- **`references/agent-hierarchy.md`** - Agent permission matrix and delegation patterns
- **`references/session-tracking.md`** - Session state and delegation depth management
- **`references/mindfulness-protocols.md`** - Advanced orchestration patterns

### Example Delegations

Working examples in `examples/`:

- **`examples/valid-delegation.md`** - Proper coordinator → governance delegation
- **`examples/resumed-session.md`** - Session resumption with context injection
- **`examples/chain-recovery.md`** - Recovering from chain violations

---

## Quick Reference

### Valid Delegation Paths

```
coordinator       →  governance →  validator  →  builder
     ↓                ↓              ↓              ↓
  task:true        task:true      read-only     write:true
  write:false      write:false    tools:limited  bash:true
  bash:false       bash:false     grep,glob
```

### Session State Commands

| Tool | Purpose |
|------|---------|
| `idumb-state read` | Get current session state |
| `idumb-state anchor` | Store critical context |
| `idumb-validate freshness` | Check for staleness |
| `idumb-context summary` | Get compaction-friendly context |

### Emergency Protocols

```yaml
if_stall_detected:
  command: "/idumb:debug"
  action: "Analyze delegation history for loops"

if_context_full:
  command: "Create checkpoint"
  action: "Store state before compaction"

if_chain_violation:
  command: "Check chain-enforcement.md"
  action: "Verify prerequisites before proceeding"
```

---

`★ Insight ─────────────────────────────────────`
- Mindful orchestration prevents the 80% context window saturation problem
- Every delegation should be traceable back to user intent through the chain
- Session resumption is the most dangerous time for governance drift
- Anchors are the only thing that survives compaction with full fidelity
`─────────────────────────────────────────────────`
