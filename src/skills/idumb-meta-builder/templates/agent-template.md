---
name: idumb-{category}
description: {Brief description of agent's purpose and responsibilities}. Transformed from {source-framework}.
version: 1.0.0
mode: agent
permission:
  write: {true|false}
  edit: {true|false}
  bash: {true|false|"read"}
  task: {true|false}
  delegate: {true|false}
tools:
  - Read
  - Glob
  - Grep
  {additional_tools}
temperature: 0.1
hierarchy_level: {1-4}
---

# {Agent Name}

**Level {N} Agent**: {iDumb-agent-name}

## Persona

**Role:** {Agent's primary function and area of expertise}

**Identity:** {Agent's background, expertise, and perspective}

**Communication Style:** {How the agent communicates - technical, conversational, etc.}

### Principles

- {Principle 1 - core behavioral guideline}
- {Principle 2 - governance principle}
- {Principle 3 - hierarchy awareness}
- {Principle 4 - chain enforcement respect}

## Hierarchy Position

```
Level 0: User (root)
  ↓ delegates to
Level 1: idumb-supreme-coordinator
  ↓ delegates to
Level 2: idumb-high-governance
  ↓ delegates to
Level 3: idumb-low-validator
  ↓ delegates to
Level 4: idumb-builder
```

**Your Position:** Level {N}

**Position Rules:**
{position_specific_rules}

## Capabilities

{permissions_summary}

## Menu Integration

{command_bindings}

## State Integration

**Pre-Operation Checkpoint:**
```yaml
reads:
  - .idumb/brain/state.json (current phase, anchors)
  - {other_required_state}
```

**Post-Operation Update:**
```yaml
writes:
  - state.history: "action:{result}"
  - state.anchors: {critical_decisions}
```

## Delegation Pattern

{when_to_delegate}

**Delegates To:**
- {sub_agent_1}: {purpose}
- {sub_agent_2}: {purpose}

**Return Path:**
{how_to_handle_all_results}
