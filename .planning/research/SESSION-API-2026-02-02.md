# OpenCode Session API Research

**Project:** iDumb Meta-Framework Plugin
**Researched:** 2026-02-02
**Objective:** Investigate session manipulation capabilities for plugins
**Source Confidence:** HIGH (Official SDK docs, Context7, Official documentation)

---

## Executive Summary

OpenCode provides a **comprehensive Session API** through both the SDK (`@opencode-ai/sdk`) and plugin hooks. Plugins can create, modify, fork, and share sessions. However, **direct metadata manipulation is limited** - there's no arbitrary custom metadata field. Session titles can be set at creation and via CLI, and there's a `/rename` command for users. Export/import is supported via CLI.

**Key Finding:** Plugins have significant session control through events and the SDK client, but must work within the session model's structure rather than extending it arbitrarily.

---

## 1. Session Creation API

### Can plugins create new sessions programmatically?

**Answer: YES** - HIGH Confidence

**Via SDK Client:**
```typescript
import { createOpencode } from "@opencode-ai/sdk"

const { client } = await createOpencode()

// Create a new session
const session = await client.session.create()
console.log(`Session created: ${session.id}`)

// With title (via CLI integration or body)
const session = await client.session.create({
  body: { title: "My session" }
})
```

**Via Session Tool (for agents):**
```typescript
// Creates a fresh session with a new agent
session({
  mode: "new",
  agent: "researcher",
  text: "Research best practices for API rate limiting"
})
// Returns: "New session created with researcher agent (ID: session-abc-123)"
```

**Via Fork (preserves history):**
```typescript
session({
  mode: "fork",
  agent: "build",
  text: "Implement using approach A"
})
// Returns: "Forked session with build agent - history preserved (ID: fork-xyz-456)"
```

### What metadata can be attached to sessions?

**Built-in Session Fields (from SDK types):**
```typescript
interface Session {
  id: string;           // Auto-generated unique ID
  title: string;        // Session title (auto-generated from first prompt or manual)
  version: string;      // OpenCode version
  parentID?: string;    // For forked sessions
  time: {
    created: number;    // Unix timestamp
    updated: number;    // Last update timestamp
  };
  revert?: {            // Revert state if applicable
    messageID: string;
    diff?: string;
    partID?: string;
    snapshot?: string;
  };
  share?: {             // Share info if shared
    url: string;        // e.g., opncd.ai/s/abc123
  };
}
```

**Limitations:**
- NO arbitrary custom metadata field on Session object
- NO `session.metadata` API
- Metadata is **implicit** (via parentID, time, share, revert)

### Can session names be changed?

**Answer: YES, with limitations** - HIGH Confidence

**Via CLI:**
```bash
# Set title at creation time
opencode run --title "Payment API refactor" "Refactor the payment code"

# Rename existing session (user command, not API)
/rename "New session title"
```

**Via SDK:** No direct `session.rename()` or `session.update()` method found.

**Feature Request Status:** GitHub Issue #1389 requests better session renaming. Issue #4040 reports auto-naming regression. Issue #9398 proposes AI-powered rename.

---

## 2. Session Modification API

### Can plugins modify running session state?

**Answer: PARTIALLY** - HIGH Confidence

**Context Injection WITHOUT AI Response:**
```typescript
// Inject context without triggering AI response (useful for plugins)
await client.session.prompt({
  path: { id: session.id },
  body: {
    noReply: true,  // Key: adds context without AI processing
    parts: [{ type: 'text', text: 'You are a helpful assistant.' }],
  },
})
```

**Send Messages to Session:**
```typescript
await client.session.chat(sessionId, {
  parts: [
    { type: 'text', text: 'Analyze this file and suggest improvements' },
    { type: 'file', source: { type: 'path', path: './src/main.ts' } }
  ],
  modelID: 'claude-4-sonnet',
  providerID: 'anthropic'
})
```

### Can we inject context mid-session?

**Answer: YES** - HIGH Confidence

**Method 1: noReply Prompt (SDK)**
```typescript
await client.session.prompt({
  path: { id: sessionId },
  body: {
    noReply: true,
    parts: [{ 
      type: 'text', 
      text: `<context-injection>
        Current phase: 2
        Files in progress: src/auth.ts, src/api.ts
        Governance level: STRICT
      </context-injection>` 
    }],
  },
})
```

**Method 2: Compaction Hook (Plugin)**
```typescript
export const CompactionPlugin: Plugin = async (ctx) => {
  return {
    "experimental.session.compacting": async (input, output) => {
      // Inject additional context that survives compaction
      output.context.push(`<preserved-state>
        Task progress: 75%
        Files modified: src/main.ts
      </preserved-state>`)
      
      // Or replace entire compaction prompt
      output.prompt = `Custom compaction instructions...`
    },
  }
}
```

**Method 3: System Prompt Transform (Plugin)**
```typescript
export const ContextPlugin: Plugin = async ({ client }) => {
  return {
    "system.prompt.transform": async (prompt) => {
      // Prepend governance context to every prompt
      return `<governance>\n${await loadGovernanceContext()}\n</governance>\n\n${prompt}`
    }
  }
}
```

### Is there a session.update() or similar API?

**Answer: NO direct update(), but alternatives exist** - HIGH Confidence

**Available Modification Methods:**
| Method | What It Does | Use Case |
|--------|--------------|----------|
| `session.chat()` | Send message + get response | Normal interaction |
| `session.prompt()` with `noReply: true` | Inject context silently | Plugin context injection |
| `session.init()` | Initialize with analysis | Project setup |
| `session.revert()` | Roll back to message | Undo changes |
| `session.unrevert()` | Restore after revert | Redo |
| `session.summarize()` | Create summary | Token management |

**NOT Available:**
- `session.update({ title, metadata })`
- `session.setMetadata()`
- `session.rename()`

---

## 3. Session Export API

### Can sessions be exported to files?

**Answer: YES** - HIGH Confidence

**Via CLI:**
```bash
# Export session to JSON
opencode export [sessionID]

# If no session ID provided, interactive selection
opencode export
```

### What format (JSON, markdown)?

**Answer: JSON** - HIGH Confidence

Export format is JSON containing:
- Session metadata
- Full conversation history
- Message parts (text, files, tools)
- Timestamps
- Token usage

**Summarize also available (for markdown-like output):**
```typescript
const summary = await client.session.summarize(sessionId, {
  format: 'markdown',
  modelID: 'claude-4-sonnet',
  providerID: 'anthropic'
})
```

### Can exported sessions be re-imported?

**Answer: YES** - HIGH Confidence

```bash
# Import from local file
opencode import session.json

# Import from OpenCode share URL
opencode import https://opncd.ai/s/abc123
```

---

## 4. Metadata Manipulation

### What metadata fields exist on sessions?

| Field | Type | Mutable | Notes |
|-------|------|---------|-------|
| `id` | string | NO | Auto-generated UUID |
| `title` | string | PARTIAL | Via CLI --title or /rename |
| `version` | string | NO | OpenCode version |
| `parentID` | string? | NO | Set on fork |
| `time.created` | number | NO | Unix timestamp |
| `time.updated` | number | AUTO | Updates on activity |
| `revert` | object? | API | Set via revert() |
| `share.url` | string? | API | Set via share() |

### Can custom metadata be attached?

**Answer: NO** - HIGH Confidence

There is no `metadata: { [key: string]: unknown }` field on Session.

**Workarounds:**

1. **Plugin State Management (In-Memory):**
```typescript
const sessionState = new Map<string, CustomMetadata>()

export const StatePlugin: Plugin = async ({ client }) => {
  return {
    event: async ({ event }) => {
      const sessionId = (event as any).sessionID
      
      if (event.type === "session.created" && sessionId) {
        sessionState.set(sessionId, { 
          phase: 1, 
          governanceLevel: 'strict',
          filesModified: [] 
        })
      }
      
      if (event.type === "session.deleted" && sessionId) {
        sessionState.delete(sessionId)
      }
    }
  }
}
```

2. **File-Based Persistence (via .idumb/):**
```typescript
// Store session metadata in .idumb/sessions/<sessionId>.json
const metadataPath = `.idumb/sessions/${sessionId}.json`
await Bun.write(metadataPath, JSON.stringify({
  sessionId,
  phase: 2,
  governanceLevel: 'moderate',
  createdBy: 'gsd-planner'
}))
```

3. **Context Injection (preserves in conversation):**
```typescript
// Inject metadata as context at session start
await client.session.prompt({
  path: { id: sessionId },
  body: {
    noReply: true,
    parts: [{ 
      type: 'text', 
      text: `<session-metadata phase="2" governance="strict" />` 
    }]
  }
})
```

### Is there a session.metadata API?

**Answer: NO** - HIGH Confidence

No `session.metadata` getter/setter exists.

---

## Summary: What IS Possible

| Capability | Method | Confidence |
|------------|--------|------------|
| Create sessions programmatically | `client.session.create()` | HIGH |
| Set title at creation | CLI `--title` flag | HIGH |
| Fork sessions (preserve history) | `session({ mode: "fork" })` | HIGH |
| Create new clean sessions | `session({ mode: "new" })` | HIGH |
| Inject context without AI reply | `noReply: true` in prompt | HIGH |
| Preserve context through compaction | Compaction hook | HIGH |
| Track session state in plugin | Map keyed by sessionID | HIGH |
| Export sessions to JSON | `opencode export` | HIGH |
| Import sessions from file/URL | `opencode import` | HIGH |
| Share sessions publicly | `client.session.share()` | HIGH |
| Revert/unrevert sessions | `client.session.revert()` | HIGH |
| Get message history | `client.session.messages()` | HIGH |
| Subscribe to session events | Plugin event hook | HIGH |

---

## Summary: What is NOT Possible

| Limitation | Impact | Workaround |
|------------|--------|------------|
| No `session.update()` | Can't modify session props | Use events + external state |
| No custom metadata field | Can't store arbitrary data on session | Store in Map or files |
| No `session.rename()` API | Can't rename via SDK | CLI only (/rename) |
| No title modification via SDK | Can't update title programmatically | User must use /rename |
| Session state not persisted | Plugin state lost on restart | Store in .idumb/ files |
| No session.metadata getter | Can't retrieve custom metadata | Use external storage |

---

## Workarounds for Limitations

### Custom Metadata Storage Pattern
```typescript
import type { Plugin } from "@opencode-ai/plugin"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs"
import { join } from "path"

interface SessionMetadata {
  sessionId: string
  phase: number
  governanceLevel: string
  parentSession?: string
  createdAt: number
  lastUpdated: number
}

const METADATA_DIR = ".idumb/sessions"

function ensureDir() {
  if (!existsSync(METADATA_DIR)) {
    mkdirSync(METADATA_DIR, { recursive: true })
  }
}

function getMetadataPath(sessionId: string): string {
  return join(METADATA_DIR, `${sessionId}.json`)
}

function loadMetadata(sessionId: string): SessionMetadata | null {
  const path = getMetadataPath(sessionId)
  if (existsSync(path)) {
    return JSON.parse(readFileSync(path, 'utf-8'))
  }
  return null
}

function saveMetadata(metadata: SessionMetadata): void {
  ensureDir()
  writeFileSync(getMetadataPath(metadata.sessionId), JSON.stringify(metadata, null, 2))
}

export const SessionMetadataPlugin: Plugin = async ({ client }) => {
  const inMemoryState = new Map<string, SessionMetadata>()
  
  return {
    event: async ({ event }) => {
      const sessionId = (event as any).sessionID || (event as any).session_id
      
      if (event.type === "session.created" && sessionId) {
        // Check for existing metadata (session might be restored)
        let metadata = loadMetadata(sessionId)
        if (!metadata) {
          metadata = {
            sessionId,
            phase: 1,
            governanceLevel: 'standard',
            createdAt: Date.now(),
            lastUpdated: Date.now()
          }
          saveMetadata(metadata)
        }
        inMemoryState.set(sessionId, metadata)
      }
      
      if (event.type === "session.deleted" && sessionId) {
        inMemoryState.delete(sessionId)
        // Optionally delete the file or archive it
      }
    },
    
    // Expose custom tool for agents to read/update metadata
    tool: {
      "idumb:session-meta": tool({
        description: "Get or set iDumb session metadata",
        args: {
          action: tool.schema.enum(["get", "set"]),
          field: tool.schema.string().optional(),
          value: tool.schema.string().optional()
        },
        async execute(args, ctx) {
          const metadata = inMemoryState.get(ctx.sessionID)
          if (!metadata) return "No metadata for this session"
          
          if (args.action === "get") {
            return JSON.stringify(metadata, null, 2)
          }
          
          if (args.action === "set" && args.field && args.value) {
            (metadata as any)[args.field] = args.value
            metadata.lastUpdated = Date.now()
            saveMetadata(metadata)
            inMemoryState.set(ctx.sessionID, metadata)
            return `Set ${args.field} to ${args.value}`
          }
          
          return "Invalid action"
        }
      })
    }
  }
}
```

---

## Open Questions

1. **Will `noReply: true` context injection work reliably?**
   - Documented in official SDK docs, but needs validation
   - May need testing for large context injections

2. **Is compaction hook stable?**
   - Marked as `experimental.session.compacting`
   - API may change in future versions

3. **Session title from SDK:**
   - CLI documentation shows `--title` flag
   - SDK docs show `body: { title: "..." }` in create
   - TypeScript types don't show this param - may be optional/untyped

---

## Sources

### Primary (HIGH Confidence)
- Context7: `/sst/opencode-sdk-js` - Full SDK API documentation
- Context7: `/malhashemi/opencode-sessions` - Session tool modes
- Official docs: https://opencode.ai/docs/sdk/ (Jan 31, 2026)
- Official docs: https://opencode.ai/docs/cli/ (Jan 31, 2026)
- Official docs: https://opencode.ai/docs/share/ (Jan 31, 2026)
- Official docs: https://opencode.ai/docs/plugins/ (Jan 31, 2026)

### Secondary (MEDIUM Confidence)
- GitHub Gist: johnlindquist/0adf1032b4e84942f3e1050aba3c5e4a - Plugin patterns
- GitHub Issues: #1389, #4040, #9398 - Session rename feature requests
- Project research: OPENCODE-INTERNALS-2026-02-02.md

### Tertiary (LOW Confidence)
- WebSearch: Various blog posts and tutorials (cross-verified with official)

---

## Recommendations for iDumb Plugin

1. **Use file-based metadata storage** in `.idumb/sessions/` for persistence
2. **Use in-memory Map** for fast access during session
3. **Hook into `session.created`/`session.deleted`** for lifecycle
4. **Use `noReply: true` prompt injection** for context injection
5. **Use compaction hook** to preserve critical state
6. **Don't rely on session title** for metadata - too limited
7. **Export/import can be wrapped** in custom commands if needed
