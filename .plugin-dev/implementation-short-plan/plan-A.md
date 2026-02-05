# Output Styles Equivalent for OpenCode/iDumb Framework

## Goal

Implement Claude Code's "Output Styles" concept in OpenCode/iDumb framework to achieve:
- Enhanced agent autonomy and self-governance
- Reduced context pollution
- Better session anchoring for conversation turn management
- Hierarchical knowledge of session flows, workflows, and file trees

---

## Research Summary

### Claude Code Output Styles

Output Styles in Claude Code are **system prompt modifications** that control how Claude formats and presents its responses. Key characteristics:

| Feature | Description |
|---------|-------------|
| **Purpose** | Adapt Claude Code for uses beyond software engineering |
| **Mechanism** | Custom instructions appended to system prompt |
| **Storage** | `.claude/output-styles/` directory |
| **Format** | Markdown files with YAML frontmatter |
| **Built-in Styles** | Default, Explanatory, Learning |
| **Key Property** | `keep-coding-instructions` to preserve coding behavior |

**`--append-system-prompt` Flag:**
- CLI flag for injecting custom system prompt content
- Lower precedence than Output Styles
- Useful for quick customizations without creating a file

### OpenCode Capabilities

| Capability | Mechanism | Equivalent To |
|------------|-----------|---------------|
| **Agent System Prompts** | YAML frontmatter in agent [.md](file:///Users/apple/Documents/coding-projects/idumb/AGENTS.md) files | Output Styles (primary) |
| **`experimental.chat.system.transform`** | Plugin hook to modify system prompts | `--append-system-prompt` |
| **Commands with `template`** | Custom command prompts | Specialized invocations |
| **Skills** | Auto-loaded instructions for complex tasks | Claude Code Skills |
| **`experimental.session.compacting`** | Custom compaction context | Session preservation |

---

## Feature Mapping

### ✅ Direct Equivalents

| Claude Code Feature | OpenCode Equivalent | Notes |
|---------------------|---------------------|-------|
| Output Style file format | Agent file with YAML frontmatter | OpenCode agents ARE output styles |
| `--append-system-prompt` | `experimental.chat.system.transform` hook | Plugin can inject content |
| Style switching (`/output-style`) | Agent switching (Tab key, `@mention`) | Built-in functionality |
| Custom style creation | Custom agent creation | Same workflow |
| Skills integration | OpenCode skills in `.opencode/skills/` | Same concept |

### ⚠️ Workarounds Required

| Claude Code Feature | Gap in OpenCode | Workaround |
|---------------------|-----------------|------------|
| `keep-coding-instructions` flag | No explicit toggle | Include coding instructions in agent file |
| Style reminders during conversation | No built-in | Use `experimental.chat.messages.transform` hook |
| Per-conversation style setting | Persisted globally | Use session metadata + plugin hook |

### ❌ Not Available (Hard Limitations)

| Feature | Reason | Mitigation |
|---------|--------|------------|
| CLI `--append-system-prompt` flag | OpenCode TUI doesn't have CLI flags | Use plugin hooks instead |
| Output style in settings.json | Not supported in opencode.json | Configure per-agent instead |

---

## Proposed Implementation for iDumb Framework

### 1. Output Style System for Agents

> [!IMPORTANT]
> Each iDumb agent can have its own **customized output style** defined in the agent file's YAML frontmatter.

#### New YAML Properties

Add to agent frontmatter schema:

```yaml
---
# Existing properties...
description: "Supreme coordinator - NEVER executes directly."
id: agent-idumb-supreme-coordinator
mode: primary

# NEW: Output style configuration
output-style:
  name: "Governance Report Style"
  behavior:
    - Always return structured governance reports
    - Include evidence tables
    - Track hierarchical delegations
  reminders:
    - At session start: "You are the supreme coordinator..."
    - Post-compaction: "Reread state before proceeding..."
  keep-coding-instructions: false  # Governance agents don't write code
---
```

#### Implementation Location

Modify: `src/plugins/idumb-core.ts` → `buildGovernancePrefix()` function

---

### 2. Session Flow Anchoring Mechanism

> [!IMPORTANT]
> Anchors preserve hierarchical knowledge across session boundaries and compaction.

#### Enhanced Anchor Types

Extend existing anchor system in `.idumb/brain/state.json`:

```json
{
  "anchors": [
    {
      "id": "session-flow-001",
      "type": "session_flow",
      "content": {
        "hierarchy": ["supreme-coord", "high-gov", "builder"],
        "workflow": "phase-2-execution",
        "fileTree": ["src/plugins/idumb-core.ts", "src/tools/idumb-state.ts"],
        "artifacts": [".idumb/project-output/phases/phase-2/plan.md"]
      },
      "priority": "critical"
    },
    {
      "id": "output-style-001", 
      "type": "output_style",
      "content": {
        "agent": "idumb-supreme-coordinator",
        "style": "governance-report",
        "lastResponse": "GOVERNANCE REPORT..."
      },
      "priority": "high"
    }
  ]
}
```

#### Implementation Location

Modify: `src/lib/state.ts` → Add new anchor types and handlers

---

### 3. `--append-system-prompt` Equivalent

Create a plugin hook that reads from a configuration file:

#### [NEW] `.idumb/brain/system-prompt-append.md`

```markdown
# Appended System Prompt

This content is injected into the system prompt for all iDumb agents.

## Session Context
- Current phase: {{phase}}
- Framework: {{framework}}

## Behavioral Overrides
- Always check state before actions
- Report in governance format
```

#### Implementation

```typescript
// In idumb-core.ts
"experimental.chat.system.transform": async (input, output) => {
  try {
    const appendPath = join(directory, '.idumb/brain/system-prompt-append.md')
    if (existsSync(appendPath)) {
      const content = readFileSync(appendPath, 'utf-8')
      const state = readState(directory)
      
      // Template substitution
      const processed = content
        .replace('{{phase}}', state.phase)
        .replace('{{framework}}', state.framework)
      
      output.system.push(processed)
      log(directory, 'Appended system prompt content')
    }
  } catch (error) {
    log(directory, `[ERROR] system.transform: ${error}`)
  }
}
```

---

### 4. Hierarchical Knowledge Preservation

#### Last-Message Output Style Capture

Capture the final assistant message format for each agent:

```typescript
// In tool.execute.after hook
if (toolName === 'task' && output.output) {
  const agentRole = tracker.agentRole
  
  // Store last response pattern for this agent
  const lastResponsePattern = extractResponsePattern(output.output)
  storeOutputStyleAnchor(directory, agentRole, lastResponsePattern)
}
```

#### Session Flow Tracking

Track delegation hierarchy in real-time:

```typescript
// Enhanced session tracker
interface SessionFlowTracker {
  hierarchy: string[]           // Agent call stack
  workflow: string              // Current workflow/phase
  filesTouched: Set<string>     // Files modified this session
  artifactsGenerated: string[]  // Planning artifacts created
}
```

---

### 5. Agent-Specific Output Styles

Each agent can adopt customized output styles via their configuration:

#### Example: `idumb-supreme-coordinator.md` Enhancement

```yaml
---
# ... existing config ...

output-style:
  format: governance-report
  sections:
    - status-header
    - evidence-table
    - sub-delegations
    - state-changes
    - recommendations
  tone: confident-factual
  length: comprehensive
---
```

#### Example: `idumb-builder.md` Enhancement

```yaml
---
# ... existing config ...

output-style:
  format: implementation-summary
  sections:
    - files-modified
    - code-changes
    - validation-status
  tone: technical-precise
  length: concise
---
```

---

## Commands and Skills Integration

### Commands for Output Style Management

Create new commands in `src/commands/idumb/`:

#### [NEW] `/idumb:output-style`

```markdown
---
description: Switch or configure output style for current session
template: |
  List available output styles and switch to a new one.
  
  Current agent: {{agent}}
  Current style: {{style}}
  
  Available styles:
  - governance-report: Structured reports with evidence
  - implementation-summary: Technical file change summaries  
  - research-synthesis: Findings with confidence levels
  - debug-analysis: Step-by-step diagnostic output
---
```

### Skills for Output Style Behaviors

Create skill in `.agents/skills/output-style-enforcement/`:

#### [NEW] `SKILL.md`

```markdown
---
name: output-style-enforcement
description: Ensures agents follow their designated output style, triggered when response format deviates from expected pattern.
---

# Output Style Enforcement Skill

This skill monitors agent responses and provides correction hints when
the output deviates from the agent's designated style.

## When to Use

- Agent response doesn't match expected format
- Missing required sections (evidence, recommendations, etc.)
- Tone doesn't match agent's designated tone

## Enforcement Logic

1. Parse agent's output-style configuration
2. Compare response against expected sections
3. If deviation detected, inject reminder
```

---

## Session Lifecycle Considerations

> [!WARNING]
> Different phases of the session (start, during, stop, compaction) require different handling.

| Phase | Output Style Behavior | Implementation |
|-------|----------------------|----------------|
| **Session Start** | Inject full output style instructions | `experimental.chat.system.transform` |
| **During Conversation** | Inject reminders as needed | `experimental.chat.messages.transform` |
| **Agent Stop (by agent)** | Capture last response pattern | `tool.execute.after` for `task` tool |
| **User Cancellation** | No output style (interrupted) | Skip capture |
| **Post-Compaction** | Re-inject with context | `experimental.session.compacting` + reminders |

---

## Proposed Changes

### [MODIFY] `src/plugins/idumb-core.ts`

Add:
- `experimental.chat.system.transform` hook for system prompt appending
- Output style anchor storage in `tool.execute.after`
- Session flow hierarchy tracking

---

### [NEW] `src/lib/output-style.ts`

New module for output style handling:

```typescript
export interface OutputStyleConfig {
  name: string
  format: string
  sections: string[]
  tone: string
  length: 'concise' | 'moderate' | 'comprehensive'
  reminders: {
    sessionStart?: string
    postCompaction?: string
    duringConversation?: string[]
  }
}

export function parseOutputStyle(agentConfig: string): OutputStyleConfig
export function buildStyleReminder(agent: string, phase: string): string
export function captureResponsePattern(response: string): object
```

---

### [MODIFY] Agent Files

Add `output-style` section to YAML frontmatter for key agents:

| Agent | Output Style |
|-------|-------------|
| `idumb-supreme-coordinator.md` | governance-report |
| `idumb-builder.md` | implementation-summary |
| `idumb-research-synthesizer.md` | research-synthesis |
| `idumb-debugger.md` | debug-analysis |
| `idumb-planner.md` | plan-specification |
| `idumb-verifier.md` | verification-report |

---

### [NEW] `.idumb/brain/system-prompt-append.md`

Template file for system prompt appending (equivalent to `--append-system-prompt`).

---

### [NEW] `src/commands/idumb/output-style.md`

Command for managing output styles at runtime.

---

### [NEW] `.agents/skills/output-style-enforcement/SKILL.md`

Skill for enforcing output style compliance.

---

## Verification Plan

### Automated Tests

```bash
# Test system prompt transformation
node test/plugins/system-transform.test.js

# Test output style parsing
node test/lib/output-style.test.js

# Test anchor creation and retrieval
node test/lib/anchors.test.js
```

### Manual Verification

1. **Session Start Injection**
   - Start session with `@idumb-supreme-coordinator`
   - Verify governance prefix includes output style instructions
   
2. **Post-Compaction Recovery**
   - Run long session until compaction
   - Verify output style is re-injected

3. **Agent-Specific Styles**
   - Switch between agents with different styles
   - Verify response formats change accordingly

4. **Hierarchical Anchoring**
   - Run delegation chain: supreme → high-gov → builder
   - Verify hierarchy is captured in session flow anchor

---

## Summary

The implementation leverages OpenCode's existing capabilities:

| Claude Code | OpenCode Implementation |
|-------------|------------------------|
| Output Styles | Agent files with `output-style` YAML section |
| `--append-system-prompt` | `experimental.chat.system.transform` + append.md file |
| Style switching | Agent switching (Tab/`@mention`) |
| Session reminders | `experimental.chat.messages.transform` hook |
| Post-compaction | `experimental.session.compacting` hook |

The iDumb framework already has the infrastructure (plugin hooks, state management, anchors) to implement this. The proposal adds:

1. **Output style schema** in agent YAML frontmatter
2. **System prompt append file** for quick customizations
3. **Session flow anchors** for hierarchical knowledge
4. **Output style enforcement skill** for compliance
5. **Runtime command** for style management
