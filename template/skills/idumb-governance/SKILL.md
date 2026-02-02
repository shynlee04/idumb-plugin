---
name: idumb-governance
description: "Complete iDumb governance protocols - hierarchical delegation, validation patterns, context anchoring, and expert-skeptic mode guidelines"
license: MIT
compatibility: opencode
metadata:
  audience: ai-agents
  workflow: governance
---

# iDumb Governance Skill

Complete protocols for operating within the iDumb hierarchical governance system.

## Governance Philosophy

### Expert-Skeptic Mode

**NEVER assume. ALWAYS verify.**

- Don't trust file contents are current - check timestamps
- Don't trust state is consistent - validate structure
- Don't trust context survives compaction - anchor critical decisions
- Don't trust previous agent conclusions - verify with evidence

### Context-First

Before ANY action:

1. Read `.idumb/brain/state.json`
2. Check current phase
3. Identify stale context (>48h old)
4. Anchor decisions that must survive compaction

### Evidence-Based Results

Every validation must return:

```yaml
result:
  status: pass | fail | warning
  evidence: [what was checked]
  proof: [how it was verified]
  timestamp: [when checked]
```

---

## Agent Hierarchy

### Level 1: Supreme Coordinator

**Agent:** `@idumb-supreme-coordinator`
**Mode:** `primary`
**Role:** Top-level orchestration

**Rules:**
- NEVER execute code directly
- NEVER write files directly
- ALWAYS delegate to governance layer
- ALWAYS track what was delegated

**Delegation pattern:**
```
@idumb-high-governance
Task: [what needs doing]
Context: [relevant state]
Requirements: [constraints]
Report: [expected format]
```

### Level 2: High Governance

**Agent:** `@idumb-high-governance`
**Mode:** `all`
**Role:** Mid-level coordination

**Rules:**
- Receives delegation from coordinator
- Further delegates to validators/builders
- Synthesizes results from sub-agents
- Reports back to coordinator

**Delegation pattern:**
```
@idumb-low-validator
Check: [what to validate]
Method: [how to check]
Return: [expected evidence]
```

### Level 3: Low Validator

**Agent:** `@idumb-low-validator`
**Mode:** `subagent`
**Hidden:** `true`
**Role:** Actual validation work

**Capabilities:**
- grep, glob, file reads
- Test execution
- Structure validation
- Evidence gathering

**Return format:**
```yaml
validation:
  check: [what was checked]
  status: pass | fail
  evidence: [proof]
  details: [explanation]
```

### Level 4: Builder

**Agent:** `@idumb-builder`
**Mode:** `subagent`
**Hidden:** `true`
**Role:** Actual execution work

**Capabilities:**
- File creation, editing, deletion
- Tool execution
- State updates

**Return format:**
```yaml
execution:
  action: [what was done]
  files: [modified paths]
  status: success | partial | failed
  changes: [summary]
```

---

## Validation Protocols

### Structure Validation

Check `.idumb/` directory integrity:

```
.idumb/
├── brain/
│   └── state.json      # REQUIRED
├── governance/         # Optional
│   └── plugin.log      # Created by plugin
└── anchors/            # Optional
```

### Schema Validation

Required fields in `state.json`:

```json
{
  "version": "string",
  "initialized": "ISO date string",
  "framework": "idumb | bmad | planning | custom | none",
  "phase": "string",
  "lastValidation": "ISO date string | null",
  "validationCount": "number",
  "anchors": "array",
  "history": "array"
}
```

### Freshness Validation

- Files older than 48 hours are "stale"
- Stale context must be refreshed before use
- Anchors older than 48h should be reviewed

### Planning Alignment Validation

If planning framework detected:

1. Check `.planning/` exists
2. Check `ROADMAP.md` exists
3. Check `PROJECT.md` exists
4. Verify iDumb phase matches planning phase
5. Report any misalignment

---

## Context Anchoring

### When to Anchor

Create anchors for:

- **Critical decisions** that change project direction
- **Discovered constraints** that affect future work
- **Phase transitions** marking completion of major work
- **Error resolutions** documenting how issues were fixed

### Anchor Types

| Type | Use | Priority |
|------|-----|----------|
| `decision` | Strategic choices | critical/high |
| `context` | Background information | normal/high |
| `checkpoint` | Phase completion markers | high |

### Anchor Format

```yaml
anchor:
  type: decision | context | checkpoint
  content: "Brief description of what to remember"
  priority: critical | high | normal
```

### Anchor Limits

- Maximum 20 anchors stored
- Old normal-priority anchors pruned first
- Critical anchors always preserved

---

## Planning Integration

### Principle: Wrap, Don't Break

- Planning commands work normally
- iDumb intercepts via plugin hooks
- Validation happens post-execution
- State tracked separately in `.idumb/`

### Planning File Locations

| File | Purpose | iDumb Access |
|------|---------|--------------|
| `.planning/` | Planning artifacts | READ ONLY |
| `ROADMAP.md` | Project roadmap | READ ONLY |
| `PROJECT.md` | Project description | READ ONLY |
| `phases/` | Phase-specific plans | READ ONLY |

### Sync Protocol

After planning operations:

1. Read `PROJECT.md` for current phase
2. Update `.idumb/brain/state.json` phase
3. Log sync in governance history

---

## Compaction Survival

### What Gets Injected

During compaction, the plugin injects:

1. Current phase and framework
2. Critical and high-priority anchors
3. Recent action history (last 5)

### What Gets Lost

- Normal-priority anchors (unless recent)
- Full history beyond last 5 entries
- Detailed validation reports

### Pre-Compaction Checklist

Before context window fills:

1. Anchor all critical decisions
2. Summarize current state
3. Document next steps
4. Ensure state.json is current

---

## Error Handling

### Validation Failures

When validation fails:

1. Report specific failure reason
2. Provide evidence of failure
3. Suggest remediation
4. Do NOT auto-fix without delegation

### State Corruption

If `state.json` is corrupted:

1. Report corruption detected
2. Attempt to read what's salvageable
3. Recommend re-initialization
4. Preserve anchors if possible

### Missing Dependencies

If `.idumb/` doesn't exist:

1. Inform user to run `/idumb:init`
2. Do NOT auto-create structure
3. Operate in degraded mode if needed

---

## Command Reference

| Command | Purpose | Agent |
|---------|---------|-------|
| `/idumb:init` | Initialize governance | supreme-coordinator |
| `/idumb:status` | Show current state | supreme-coordinator |
| `/idumb:validate` | Run validation | supreme-coordinator |
| `/idumb:help` | Show help | supreme-coordinator |

---

## Tool Reference

| Tool | Purpose | Exports |
|------|---------|---------|
| `idumb-state` | State management | read, write, anchor, history, getAnchors |
| `idumb-validate` | Validation runner | structure, schema, freshness, planningAlignment, default (full) |
| `idumb-context` | Context detection | default (classify), summary, patterns |

---

## Best Practices

### For Coordinators

1. Always check state before delegating
2. Provide full context in delegation
3. Synthesize results before reporting
4. Anchor significant outcomes

### For Validators

1. Never assume - verify everything
2. Return structured evidence
3. Be specific about failures
4. Include timestamps

### For Builders

1. Report all file changes
2. Don't modify state directly
3. Return to governance layer
4. Log actions taken

### For All Agents

1. Context first, action second
2. Evidence-based conclusions only
3. Anchor critical discoveries
4. Respect the hierarchy
