# Implementation Plan: Output-Style Functionality for iDumb in OpenCode

**Project:** iDumb Framework
**Date:** 2026-02-04
**Status:** Enhanced - Hook Investigation Complete

---

## Executive Summary

Implement Claude Code-style "Output Styles" functionality in OpenCode for the iDumb framework. Since OpenCode lacks a direct equivalent to Claude Code's `--append-system-prompt` flag, we will implement a hybrid approach using:

1. **Agent-level prompt enhancement** (base layer)
2. **Plugin hook for global behavior** (`experimental.chat.system.transform`)
3. **Skill-based style profiles** (autoloadable behaviors)
4. **Command for style switching** (user-facing interface)

---

## Background: Research Findings

### Claude Code Output Styles
- **Direct system prompt modification** via markdown files
- Built-in styles: Default, Explanatory, Learning
- Custom styles in `~/.claude/output-styles/` or `.claude/output-styles/`
- Frontmatter format: `name`, `description`, `keep-coding-instructions`

### OpenCode Equivalents (No Direct Replacement)
| Approach | Pros | Cons |
|----------|------|------|
| Agent prompts | Built-in, per-agent | Agent-specific, not global |
| `experimental.chat.system.transform` hook | Global modification | Requires plugin development |
| Skills | Autoloadable, reusable | Task-specific, not always active |
| Commands | Quick, shell output injection | One-time, not persistent |

### Key Difference
- **Claude Code**: Output styles modify the system prompt globally
- **OpenCode**: No global style setting; must use hooks or agent-specific prompts

---

## OpenCode Hook Timing & Behavior

### Hook Sequence by Session Stage

#### 1. Session Start
```
session.created event
        ↓
experimental.chat.messages.transform (first message only)
        ↓
[LLM Processing]
        ↓
experimental.text.complete
```

**Key Hooks for Output Styles:**
- `session.created` - Initialize style state for new session
- `experimental.chat.messages.transform` - Inject style into first user message
- `experimental.chat.system.transform` - **PRIMARY** - Modify system prompt before LLM

#### 2. Mid-Session (After User Prompt)
```
User sends message
        ↓
experimental.chat.messages.transform (every message)
        ↓
[Style injection opportunity via system transform]
        ↓
tool.execute.before (if tools called)
        ↓
[Tool execution]
        ↓
tool.execute.after
        ↓
[LLM Processing]
        ↓
experimental.text.complete (post-process LLM output)
```

**Key Hooks for Output Styles:**
- `experimental.chat.messages.transform` - Modify user messages before LLM (fires every message)
- `experimental.chat.system.transform` - **PRIMARY** - Inject style instructions into system prompt
- `tool.execute.before/after` - Track tool usage for style-aware behavior
- `experimental.text.complete` - Post-process LLM response (optional for style formatting)

#### 3. Session Compaction
```
Session reaches token limit
        ↓
experimental.session.compacting
        ↓
[Preserve style metadata in anchors]
        ↓
Old messages removed
        ↓
New session with preserved context
```

**Key Hooks for Output Styles:**
- `experimental.session.compacting` - **CRITICAL** - Preserve active style across compaction
- Store `activeStyle` in state anchors (not just state.json)
- Inject style summary into preserved context

### Hook Timing Table

| Hook | Session Stage | Input | Output | Use for Styles |
|------|--------------|-------|--------|----------------|
| `session.created` | Start | `{ sessionID }` | N/A | Initialize style state |
| `experimental.chat.messages.transform` | Every message | `{ messages, sessionID }` | `{ messages }` | Message-level style tweaks |
| `experimental.chat.system.transform` | Every message | `{ sessionID }` | `{ system: string[] }` | **MAIN** - Inject style instructions |
| `tool.execute.before` | Tool calls | `{ tool, args }` | N/A | Style-aware tool logging |
| `tool.execute.after` | Tool returns | `{ tool, result }` | N/A | Style-aware validation |
| `experimental.text.complete` | After LLM | `{ text }` | `{ text }` | Post-process for style |
| `experimental.session.compacting` | Compaction | `{ sessionID, context }` | `{ context }` | **CRITICAL** - Preserve style |

### Hook Interaction Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    SESSION START                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  session.created ──────► Initialize style state                  │
│        │                                                         │
│        ▼                                                         │
│  Load active style from state.json                               │
│        │                                                         │
│        ▼                                                         │
│  Cache style instructions in memory                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                 USER MESSAGE LOOP                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User sends prompt                                               │
│        │                                                         │
│        ▼                                                         │
│  experimental.chat.messages.transform ───► Optional tweak       │
│        │                                                         │
│        ▼                                                         │
│  experimental.chat.system.transform ───► INJECT STYLE           │
│        │                                                         │
│        ▼                                                         │
│  [LLM processes with enhanced system prompt]                    │
│        │                                                         │
│        ▼                                                         │
│  experimental.text.complete ───► Optional formatting            │
│        │                                                         │
│        ▼                                                         │
│  Return to user                                                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                 COMPACTION EVENT                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Token limit approaching                                        │
│        │                                                         │
│        ▼                                                         │
│  experimental.session.compacting                                 │
│        │                                                         │
│        ├─► Create anchor: "Active style: {name}"                │
│        ├─► Inject style summary into preserved context          │
│        └─► Ensure state.json activeStyle field is current       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Hook Coherence & Chain Prevention

### OpenCode Hook Guarantees

#### 1. Fail-Safe Execution
All hooks are automatically wrapped in try/catch by OpenCode:
```typescript
// OpenCode internally wraps all hooks
try {
  await pluginHook(input, output)
} catch (error) {
  // Log error, continue to next hook
  // Never break the hook chain
}
```

**Implication for iDumb:**
- A failing style hook will NOT break other plugins
- Style system errors are isolated
- No need for additional try/catch (but recommended for logging)

#### 2. Sequential Hook Execution
Hooks run in **fixed, predictable order**:
```
1. Global config plugins
2. Project config plugins
3. Global plugins (alphabetical)
4. Project plugins (alphabetical)
```

**Implication for iDumb:**
- iDumb loads as a project plugin
- Other plugins cannot short-circuit iDumb's hooks
- iDumb's hooks always run, regardless of other plugins

#### 3. No Short-Circuiting
Hooks **cannot** prevent other hooks from running:
```typescript
// This does NOT work:
"experimental.chat.messages.transform": async (input, output) => {
  if (shouldSkip) {
    return // ❌ Does NOT stop other hooks
  }
}
```

**Implication for iDumb:**
- Style injection happens regardless of other plugins' behavior
- No coordination needed with other plugins
- Each plugin operates independently

#### 4. Output Mutation Only
Hooks modify `output` parameter, never `input`:
```typescript
"experimental.chat.system.transform": async (input, output) => {
  // input.sessionID is READ-ONLY
  // output.system is MUTABLE
  output.system.push("Style instructions here")
}
```

**Implication for iDumb:**
- Style system cannot modify user messages directly
- Style instructions go into system prompt only
- Clean separation of concerns

### Hook Chain Prevention Strategies

#### 1. Idempotency
Ensure hooks can run multiple times without side effects:
```typescript
"experimental.chat.system.transform": async (input, output) => {
  // Check if already injected to prevent duplication
  if (output.system.some(s => s.includes("[STYLE_INJECTION]"))) {
    return // Already injected
  }
  output.system.push("[STYLE_INJECTION]\n" + styleInstructions)
}
```

#### 2. Validation Before Mutation
```typescript
"experimental.chat.system.transform": async (input, output) => {
  const activeStyle = loadActiveStyle(directory)
  if (!activeStyle || activeStyle === 'default') {
    return // Nothing to inject
  }

  const styleContent = parseStyleFile(activeStyle)
  if (!styleContent?.instructions) {
    log(directory, `[STYLE] Invalid style file: ${activeStyle}`)
    return // Fail gracefully
  }

  // Only inject if valid
  output.system.push(styleContent.instructions)
}
```

#### 3. Session Boundaries
Track session state to prevent cross-contamination:
```typescript
// Session-level style cache
const sessionStyles = new Map<string, string>()

"session.created": async ({ sessionID }) => {
  // Initialize style for this session
  const activeStyle = loadActiveStyle(directory)
  sessionStyles.set(sessionID, activeStyle)
}

"experimental.chat.system.transform": async (input, output) => {
  const { sessionID } = input
  const activeStyle = sessionStyles.get(sessionID) || 'default'
  // Use session-specific style
}
```

#### 4. Compaction Safety
Ensure style survives session compaction:
```typescript
"experimental.session.compacting": async (input, output) => {
  const { sessionID } = input
  const activeStyle = loadActiveStyle(directory)

  // Add to anchors (survives compaction)
  output.context.push({
    type: "style_anchor",
    content: `Active output style: ${activeStyle}`,
    priority: "high"
  })
}
```

### Error Recovery Matrix

| Error Type | Detection | Recovery | User Impact |
|------------|-----------|----------|-------------|
| Invalid style file | Parse fails | Fall back to 'default' | None - silent fallback |
| Missing styles dir | File not found | Create on next style set | None - auto-create |
| Corrupt state.json | JSON parse error | Reset to default style | None - auto-reset |
| Hook timeout | >5s execution | Log and skip injection | Mild - no style this message |
| Concurrent writes | Race condition | Last write wins | Minimal - style updates |

### Hook Coherence Checklist

- [ ] All hooks wrapped in try/catch for logging
- [ ] Style injection is idempotent (can run multiple times)
- [ ] Style validation before mutation
- [ ] Session-aware style tracking
- [ ] Compaction-safe anchor creation
- [ ] No console.log (use log() function)
- [ ] Cache style files to avoid I/O per message
- [ ] Fallback to 'default' on any error

---

## Proposed Solution: Hybrid Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Output Style System                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────┐    ┌──────────────┐    ┌──────────────┐   │
│  │   Command   │───▶│   Config     │───▶│   Plugin     │   │
│  │ /id:style   │    │   Storage    │    │   Hook       │   │
│  └─────────────┘    └──────────────┘    └──────────────┘   │
│                            │                    │            │
│                            ▼                    ▼            │
│                   ┌──────────────┐    ┌──────────────┐     │
│                   │ Active Style │    │  System      │     │
│                   │   Metadata   │    │  Transform   │     │
│                   └──────────────┘    └──────────────┘     │
│                            │                    │            │
│                            └────────┬───────────┘            │
│                                     ▼                        │
│                          ┌──────────────────┐               │
│                          │  Agent Prompts   │               │
│                          │  (Base Layer)    │               │
│                          └──────────────────┘               │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Steps

### Phase 1: Core Infrastructure

#### 1.1 Style Storage Location
```
.idumb/
└── idumb-brain/
    └── styles/
        ├── default.md
        ├── explanatory.md
        ├── learning.md
        ├── governance.md
        └── custom/
            └── [user-defined styles]
```

#### 1.2 Style Format (Compatible with Claude Code)
```yaml
---
name: Governance Style
description: Enhanced governance prompts for iDumb agents
keep-coding-instructions: true
mode: global
compatibility: idumb
---

# Style Instructions

You are operating in **Governance Mode**. Additional behaviors:
- Always check hierarchy before delegation
- Verify permissions before file operations
- Log all governance decisions
```

#### 1.3 State Extension
Add to `.idumb/brain/state.json`:
```json
{
  "activeStyle": "default",
  "styleHistory": []
}
```

---

### Phase 2: Plugin Hook Implementation

#### 2.1 Hook Architecture

Based on investigation, we use **3 hooks** for comprehensive style coverage:

| Hook | Purpose | Timing |
|------|---------|--------|
| `session.created` | Initialize style state | Session start |
| `experimental.chat.system.transform` | Inject style instructions | Every message (primary) |
| `experimental.session.compacting` | Preserve style across compaction | Token limit |

#### 2.2 Hooks to Add in `src/plugins/idumb-core.ts`

Add after existing hooks (around line 951):

```typescript
// ========================================================================
// OUTPUT STYLE SYSTEM
// ========================================================================

// Session-level style cache for isolation
const sessionStyles = new Map<string, string>()
const styleCache = new Map<string, StyleContent>()

// -------------------------------------------------------------------------
// Session Start: Initialize style state
// -------------------------------------------------------------------------

"session.created": async ({ sessionID }: { sessionID: string }) => {
  try {
    const activeStyle = loadActiveStyle(directory) || 'default'
    sessionStyles.set(sessionID, activeStyle)

    // Pre-load and cache style instructions
    if (!styleCache.has(activeStyle)) {
      const stylePath = join(getStylesDir(directory), `${activeStyle}.md`)
      const content = parseStyleFile(stylePath)
      if (content) {
        styleCache.set(activeStyle, content)
      }
    }

    log(directory, `[STYLE] Session ${sessionID} initialized with style: ${activeStyle}`)
  } catch (error) {
    log(directory, `[ERROR] Session style init failed: ${error}`)
  }
},

// -------------------------------------------------------------------------
// Every Message: Inject style into system prompt (PRIMARY HOOK)
// -------------------------------------------------------------------------

"experimental.chat.system.transform": async (input: any, output: any) => {
  try {
    const { sessionID } = input

    // Get session-specific style
    const activeStyle = sessionStyles.get(sessionID) || loadActiveStyle(directory) || 'default'

    // Skip if default (no injection needed)
    if (activeStyle === 'default') {
      return
    }

    // Check for idempotency (prevent double injection)
    const marker = `[IDUMB_STYLE:${activeStyle}]`
    if (output.system.some((s: string) => s.includes(marker))) {
      return // Already injected
    }

    // Get from cache or load
    let styleContent = styleCache.get(activeStyle)
    if (!styleContent) {
      const stylePath = join(getStylesDir(directory), `${activeStyle}.md`)
      styleContent = parseStyleFile(stylePath)
      if (styleContent) {
        styleCache.set(activeStyle, styleContent)
      }
    }

    // Inject style with marker for idempotency check
    if (styleContent?.instructions) {
      output.system.push(`${marker}\n${styleContent.instructions}`)
      log(directory, `[STYLE] Injected ${activeStyle} (${styleContent.instructions.length} chars)`)
    }
  } catch (error) {
    log(directory, `[ERROR] Style transform failed: ${error}`)
    // Fail gracefully - continue without style injection
  }
},

// -------------------------------------------------------------------------
// Compaction: Preserve style metadata across session compaction
// -------------------------------------------------------------------------

"experimental.session.compacting": async (input: any, output: any) => {
  try {
    const { sessionID } = input
    const activeStyle = sessionStyles.get(sessionID) || loadActiveStyle(directory)

    if (activeStyle && activeStyle !== 'default') {
      // Add style anchor to preserved context
      output.context = output.context || []
      output.context.push({
        type: 'style_anchor',
        content: `Active output style: ${activeStyle}`,
        priority: 'high',
        style: activeStyle
      })

      // Also add to state.json anchors for durability
      addHistoryEntry(directory, `style_active:${activeStyle}`, 'compaction', 'pass')

      log(directory, `[STYLE] Preserved style '${activeStyle}' across compaction`)
    }
  } catch (error) {
    log(directory, `[ERROR] Style compaction failed: ${error}`)
  }
},
```

#### 2.3 Cache Invalidation Hook

Add to `command.execute.after` to detect style changes:

```typescript
"command.execute.after": async (input: any, output: any) => {
  // ... existing code ...

  // Clear style cache if style command was executed
  if (input.command === 'idumb:style' && input.args?.length > 0) {
    styleCache.clear()
    log(directory, `[STYLE] Cache cleared after style change`)
  }
},
```

#### 2.2 New Library Module: `src/lib/styles.ts`

```typescript
import { readFileSync, existsSync } from "fs"
import { join } from "path"

export interface StyleConfig {
  name: string
  description: string
  keepCodingInstructions: boolean
  mode: 'global' | 'agent'
  compatibility: string[]
}

export interface StyleContent extends StyleConfig {
  instructions: string
}

export function getStylesDir(directory: string): string {
  return join(directory, '.idumb/brain/styles')
}

export function loadActiveStyle(directory: string): string | null {
  const state = readState(directory)
  return state?.activeStyle || 'default'
}

export function parseStyleFile(stylePath: string): StyleContent | null {
  if (!existsSync(stylePath)) return null

  const content = readFileSync(stylePath, 'utf-8')
  const frontmatterMatch = content.match(/^---\n(.*?)\n---/s)

  if (!frontmatterMatch) return null

  const frontmatter = frontmatterMatch[1]
  const instructions = content.slice(frontmatterMatch[0].length).trim()

  // Parse YAML frontmatter
  const metadata: StyleConfig = parseYAMLFrontmatter(frontmatter)

  return {
    ...metadata,
    instructions
  }
}

export function setActiveStyle(directory: string, styleName: string): boolean {
  const stylePath = join(getStylesDir(directory), `${styleName}.md`)
  if (!existsSync(stylePath)) return false

  writeState(directory, { activeStyle: styleName })
  addHistoryEntry(directory, `style_activated:${styleName}`, 'user', 'pass')
  return true
}
```

---

### Phase 3: Agent Enhancement

#### 3.1 Style-Aware Agent Prompts

Update key agents (planner, builder, validator) to include style injection points:

```markdown
<style_integration>
When a style is active, the following behaviors are enhanced:
{{STYLE_INSTRUCTIONS}}
</style_integration>
```

This allows styles to:
- Modify tone and verbosity
- Add specific verification steps
- Change explanation style
- Enable/disable certain behaviors

---

### Phase 4: User Interface (Commands)

#### 4.1 New Command: `/idumb:style`

Create `src/commands/idumb/style.md`:

```markdown
---
description: Manage and switch output styles
agent: idumb-high-governance
mode: all
---

## Style Management

### Usage
```
/idumb:style                          # List available styles
/idumb:style <name>                   # Set active style
/idumb:style --create <name>          # Create new style interactively
/idumb:style --remove <name>          # Remove a style
/idumb:style --reset                  # Reset to default
```

### Available Styles
- **default**: Standard iDumb behavior
- **governance**: Enhanced governance prompts
- **verbose**: Detailed explanations and reasoning
- **terse**: Minimal output, action-focused
- **learning**: Educational explanations with insights
```

#### 4.2 New Tool: `idumb-style`

Create `src/tools/idumb-style.ts`:

```typescript
import { tool } from "@opencode-ai/plugin"

export const idumbStyleTools = {
  // List available styles
  list: tool({
    description: "List all available output styles",
    args: {},
    async execute(args, context) {
      const { directory } = context
      const stylesDir = getStylesDir(directory)
      // Return list of .md files in styles directory
    }
  }),

  // Set active style
  set: tool({
    description: "Set the active output style",
    args: {
      style: tool.schema.string()
    },
    async execute(args, context) {
      const { directory } = context
      const success = setActiveStyle(directory, args.style)
      return success
        ? `Style changed to: ${args.style}`
        : `Style not found: ${args.style}`
    }
  }),

  // Create new style
  create: tool({
    description: "Create a new output style",
    args: {
      name: tool.schema.string(),
      description: tool.schema.string(),
      instructions: tool.schema.string()
    },
    async execute(args, context) {
      const { directory } = context
      // Create new style file
    }
  })
}
```

---

### Phase 5: Pre-Defined Styles

#### 5.1 Default Styles to Include

1. **default.md** - Standard iDumb behavior
2. **governance.md** - Enhanced governance mode
3. **verbose.md** - Detailed explanations
4. **terse.md** - Minimal output
5. **learning.md** - Educational mode (like Claude Code's Learning style)

---

## File Structure Summary

```
src/
├── plugins/
│   └── idumb-core.ts           # ADD: 3 new hooks (session.created,
                                #      experimental.chat.system.transform,
                                #      experimental.session.compacting)
│                                # MODIFY: command.execute.after for cache invalidation
├── lib/
│   ├── styles.ts               # NEW: Style management utilities
│   └── logging.ts              # EXISTING: Use for log() function
├── tools/
│   └── idumb-style.ts          # NEW: Style management tools (list, set, create)
├── commands/idumb/
│   └── style.md                # NEW: Style management command
├── types/
│   └── styles.ts               # NEW: TypeScript interfaces for style config
└── agents/
    └── [existing agents]       # OPTIONAL: Add style injection points

.idumb/brain/
├── state.json                  # MODIFY: Add activeStyle field
├── config.json                 # OPTIONAL: Add style preferences
└── styles/                     # NEW: Style storage directory
    ├── default.md
    ├── governance.md
    ├── verbose.md
    ├── terse.md
    └── learning.md
```

### Files to Modify

| File | Changes | Lines |
|------|---------|-------|
| `src/plugins/idumb-core.ts` | Add 3 hooks, modify 1 | ~80 |
| `src/lib/styles.ts` | Create new file | ~100 |
| `src/tools/idumb-style.ts` | Create new file | ~60 |
| `src/commands/idumb/style.md` | Create new file | ~40 |
| `src/types/styles.ts` | Create new file | ~20 |
| `.idumb/brain/state.json` | Add activeStyle field | 2 |
| `.idumb/brain/styles/*.md` | Create 5 style files | ~200 |

**Total Estimated Changes**: ~500 lines across 12 files

---

## TUI Stability Considerations

### Critical Constraints (from plugin development guidelines)

1. **NO console.log** - Causes TUI background text pollution
   - Use `log()` function from `./lib/logging.ts`

2. **Error Handling** - All hooks wrapped in try/catch
   - Never break OpenCode on plugin errors

3. **Plugin Load Order** - iDumb should load early but not conflict
   - Check for existing style systems before initializing

4. **Performance** - Minimal overhead per message
   - Cache style files after first read
   - Avoid file I/O on every message

### Hook Coherence Implementation

#### 1. Idempotency Pattern
```typescript
// Prevent double injection with marker
const marker = `[IDUMB_STYLE:${activeStyle}]`
if (output.system.some((s: string) => s.includes(marker))) {
  return // Already injected
}
```

#### 2. Session Isolation
```typescript
// Per-session style tracking prevents cross-contamination
const sessionStyles = new Map<string, string>()
```

#### 3. Graceful Degradation
```typescript
// Always fall back to default on errors
if (!styleContent?.instructions) {
  return // Continue without style, don't break
}
```

#### 4. Cache Invalidation
```typescript
// Clear cache when style changes
if (input.command === 'idumb:style') {
  styleCache.clear()
}
```

### Testing for Hook Coherence

1. **Idempotency Test**: Send same message twice, verify style only injected once
2. **Session Isolation Test**: Multiple concurrent sessions with different styles
3. **Compaction Test**: Trigger compaction, verify style persists
4. **Error Recovery Test**: Corrupt style file, verify fallback to default
5. **Performance Test**: 100 messages with style, verify no slowdown

---

## Testing & Verification

### Manual Testing Steps

1. **Install plugin locally**
   ```bash
   npm run install:local
   ```

2. **Verify style files exist**
   ```bash
   ls -la .idumb/brain/styles/
   ```

3. **Test style switching**
   ```bash
   /idumb:style                    # List styles
   /idumb:style learning          # Switch to learning mode
   ```

4. **Verify system prompt injection**
   - Start a new session
   - Check agent behavior matches active style

5. **Test TUI stability**
   - Run multiple style switches
   - Verify no background text pollution
   - Check no crashes or hangs

### Hook Behavior Verification

#### Session Start Test
```bash
# Start new session
/idumb:style verbose
# Send message - verify verbose behavior in first response
```

#### Mid-Session Style Change Test
```bash
# Start session
# Send message (default style)
/idumb:style terse
# Send message - verify terse behavior immediately
```

#### Compaction Survival Test
```bash
# Set style
/idumb:style governance
# Send many messages to trigger compaction
# Verify governance behavior persists after compaction
```

#### Idempotency Test
```bash
# Set style
/idumb:style verbose
# Send same message twice
# Verify style marker only appears once in system prompt
```

#### Error Recovery Test
```bash
# Corrupt a style file
echo "invalid" > .idumb/brain/styles/verbose.md
# Set that style
/idumb:style verbose
# Verify fallback to default, no crash
```

### Verification Checklist

- [ ] Style files created in `.idumb/brain/styles/`
- [ ] `state.json` has `activeStyle` field
- [ ] `/idumb:style` command lists all styles
- [ ] Style switching changes agent behavior immediately
- [ ] Style persists across session compaction
- [ ] No console.log output (use log() only)
- [ ] No TUI background text pollution
- [ ] Graceful fallback on invalid style files
- [ ] Cache invalidation works when style changes
- [ ] Multiple sessions can have different styles

---

## Rollback Strategy

If issues occur:
1. Disable style hook by removing from `idumb-core.ts`
2. Keep style files (no harm, unused)
3. Revert state.json changes
4. Reinstall plugin: `npm run install:local`

---

## Open Questions for User

1. **Style persistence**: Should active style persist across sessions? (Currently: yes, stored in state.json)
2. **Style granularity**: Should styles be per-agent or global? (Proposed: global with agent overrides)
3. **Custom styles**: Allow users to create styles interactively or edit files manually? (Proposed: both)
4. **Migration**: Convert existing Claude Code output styles to iDumb format? (Proposed: yes, provide converter)

---

## References

- Claude Code Output Styles: https://code.claude.com/docs/en/output-styles
- OpenCode Plugins: https://opencode.ai/docs/plugins/
- OpenCode Hooks Documentation: See plugin development guidelines in `.plugin-dev/`
- iDumb Architecture: See `CLAUDE.md` in project root
