# Phase Research: Brain Artifacts and State System

**Phase:** iDumb Meta-Framework Core
**Research Date:** 2026-02-04
**Researcher:** @idumb-phase-researcher

---

## 1. Current Directory Structure

The `.idumb/` directory is the **runtime brain** of the iDumb governance framework:

```
.idumb/
├── SYSTEM-MANIFEST.yaml           # THE single source of truth (Tier 1)
├── config.json                    # Master configuration (Tier 1)
├── config.backup.{timestamp}.json # Auto-backup on corruption
│
├── brain/                         # Core governance state
│   ├── state.json                 # Runtime state, anchors, history (Tier 1)
│   ├── todos.json                 # Task tracking (Tier 1)
│   ├── execution-metrics.json     # Session execution metrics (Tier 2)
│   ├── context/                   # EMPTY - planned for context storage
│   ├── history/                   # EMPTY - planned for history archive
│   └── SESSION-HANDOFF-*.md       # Manual session handoff notes
│
├── execution/                     # Execution checkpoints
│   └── halt-{timestamp}/          # Emergency halt checkpoints (~35 entries)
│       └── halt-context.json      # Checkpoint data with metrics
│
├── governance/                    # Validation and rules
│   ├── plugin.log                 # Plugin activity log (ephemeral)
│   └── validations/               # Validation results
│       ├── agent-chain-*.json     # Agent validation results
│       ├── command-chain-*.json   # Command chain validation
│       ├── e2e-chain-*.json       # E2E validation
│       └── permission-system-*.md # Permission analysis docs
│
├── sessions/                      # Session metadata (~180 files!)
│   └── ses_{id}.json              # Per-session metadata
│
├── timestamps/                    # File modification tracking
│   └── {sanitized-path}.json      # Tracks created/modified times
│
└── anchors/                       # EMPTY - planned for persistent anchors
```

### Key Observations

1. **Explosive Session Growth:** 180+ session files accumulated
2. **No Archive Mechanism:** Historical data retained forever
3. **Empty Directories:** `context/`, `history/`, `anchors/` are unused
4. **Halt Accumulation:** 35+ halt checkpoints without cleanup

---

## 2. Artifact Generation Matrix (What Creates What)

| Artifact | Generator | Trigger | Location |
|----------|-----------|---------|----------|
| **config.json** | `ensureIdumbConfig()` | session.created hook | `.idumb/brain/config.json` |
| **state.json** | `ensureIdumbConfig()`, `writeState()` | session.created, state changes | `.idumb/brain/state.json` |
| **todos.json** | `idumb-todo.ts` tool | todo_create, todo_complete | `.idumb/brain/todos.json` |
| **execution-metrics.json** | `initializeExecutionMetrics()` | session.created | `.idumb/brain/execution-metrics.json` |
| **sessions/*.json** | `storeSessionMetadata()` | session.created | `.idumb/brain/sessions/` |
| **halt-*/halt-context.json** | `triggerEmergencyHalt()` | MAX_DELEGATION_DEPTH, MAX_ITERATIONS | `.idumb/brain/execution/halt-{timestamp}/` |
| **timestamps/*.json** | `storeTimestamp()` | file modifications | `.idumb/timestamps/` |
| **plugin.log** | `log()` function | all plugin activity | `.idumb/brain/governance/plugin.log` |
| **validations/*.json** | Manual validation runs | /idumb:validate, agent checks | `.idumb/brain/governance/validations/` |
| **SYSTEM-MANIFEST.yaml** | idumb-builder (manual) | framework updates | `.idumb/SYSTEM-MANIFEST.yaml` |
| **config.backup.*.json** | `ensureIdumbConfig()` | config corruption detected | `.idumb/` |

### Generation Code Locations

```typescript
// template/plugins/idumb-core.ts

// Config generation - lines 2238-2303
function ensureIdumbConfig(directory: string): InlineIdumbConfig {
  // Creates directories: brain, brain/history, brain/context, 
  //                      governance, governance/validations, 
  //                      anchors, sessions
  // Creates files: config.json, state.json
}

// Session metadata - lines 1812-1851
function storeSessionMetadata(directory: string, sessionId: string): void {
  // Creates: .idumb/brain/sessions/{sessionId}.json
}

// State management - lines 1744-1783
function readState(directory: string): IdumbState | null
function writeState(directory: string, state: IdumbState): void
function addHistoryEntry(directory: string, action, agent, result): void

// Execution metrics - lines ~2621-2623
function initializeExecutionMetrics(sessionId: string, directory: string): void
  // Creates: .idumb/brain/execution-metrics.json

// Emergency halt - stores halt context
function triggerEmergencyHalt(reason, context, directory): void
  // Creates: .idumb/brain/execution/halt-{timestamp}/halt-context.json

// Timestamp tracking - lines 2047-2100
function storeTimestamp(directory, path, created, modified): void
  // Creates: .idumb/timestamps/{sanitized-path}.json
```

---

## 3. Artifact Consumption Matrix (What Reads What)

| Artifact | Consumers | Consumption Point | Purpose |
|----------|-----------|-------------------|---------|
| **config.json** | ALL agents | session.created → system prompt | Governance settings, paths, enforcement |
| **state.json** | ALL agents, plugin hooks | session.created → system prompt | Current phase, anchors, history |
| **SYSTEM-MANIFEST.yaml** | idumb-supreme-coordinator | session start | Know entire system structure |
| **todos.json** | coordinator, stop hook | workflow enforcement | Task completion tracking |
| **sessions/*.json** | /idumb:resume command | session resumption | Restore context from previous session |
| **execution-metrics.json** | Emergency halt detection | stall detection | Track iterations, spawns, errors |
| **halt-*/halt-context.json** | idumb-debugger | debugging failures | Understand what caused halt |
| **timestamps/*.json** | Freshness validation | staleness checks | Detect stale context (>48 hours) |
| **plugin.log** | idumb-debugger | debugging | Trace plugin activity |
| **validations/*.json** | /idumb:status | reporting | Show validation history |

### Consumption Code Evidence

```typescript
// Config consumption in session.created hook - line 2615
const config = ensureIdumbConfig(directory)
log(directory, `Config loaded: experience=${config.user.experience}`)

// State consumption in multiple functions
const state = readState(directory)  // Used 15+ times in codebase

// Session metadata consumption - lines 1853-1884
function loadSessionMetadata(directory, sessionId): SessionMetadata | null
function checkIfResumedSession(sessionId, directory): boolean
function buildResumeContext(sessionId, directory): string
```

---

## 4. Schema Requirements

### Defined Schemas (template/governance/)

| Schema File | Target | Status |
|-------------|--------|--------|
| `brain-state-schema.json` | `.idumb/brain/state.json` | ✅ Defined |
| `checkpoint-schema.json` | `.idumb/brain/execution/*/halt-context.json` | ✅ Defined |
| `completion-definitions.yaml` | Phase completion criteria | ✅ Defined |
| `deny-rules.yaml` | Permission deny rules | ✅ Defined |

### Schema Coverage Gaps

| Artifact | Schema Status | Issue |
|----------|---------------|-------|
| `config.json` | ❌ No schema file | Uses TypeScript interface only |
| `sessions/*.json` | ❌ No schema file | SessionMetadata interface only |
| `execution-metrics.json` | ❌ No schema file | ExecutionMetrics interface only |
| `timestamps/*.json` | ❌ No schema file | Ad-hoc structure |
| `todos.json` | ❌ No schema file | idumb-todo.ts internal |
| `SYSTEM-MANIFEST.yaml` | ❌ No schema file | Manual YAML |

### state.json Schema (Validated)

```json
{
  "version": "^\\d+\\.\\d+\\.\\d+$",
  "initialized": "date-time",
  "framework": ["idumb", "idumb-only", "planning", "bmad", "custom", "none"],
  "phase": "string",
  "lastValidation": ["date-time", null],
  "validationCount": "integer >= 0",
  "anchors": {
    "maxItems": 20,
    "items": {
      "id": "^anchor-\\d+$",
      "type": ["decision", "context", "checkpoint", "completion"],
      "priority": ["critical", "high", "normal"],
      "content": "maxLength: 1000"
    }
  },
  "history": {
    "maxItems": 50,
    "items": {
      "action": "maxLength: 200",
      "result": ["pass", "fail", "partial", "warn"]
    }
  }
}
```

---

## 5. Purge/Archive Policy Design

### Current State: NO POLICY EXISTS

| Artifact Type | Current Behavior | Issue |
|---------------|------------------|-------|
| Sessions | Never deleted | 180+ files accumulated |
| Halt checkpoints | Never deleted | 35+ checkpoints |
| Plugin log | No rotation | Grows indefinitely |
| Timestamps | Never purged | Accumulates forever |
| History in state.json | Capped at 50 | ✅ Self-managing |
| Anchors in state.json | Capped at 20 | ✅ Self-managing |

### Documented Policy (SYSTEM-MANIFEST.yaml) vs Reality

**Documented in SYSTEM-MANIFEST.yaml:**
```yaml
garbage_collection:
  auto_delete:
    - pattern: ".idumb/brain/sessions/*.json"
      condition: "Older than 7 days"
      action: DELETE
      
    - pattern: "*.log"
      location: ".idumb/brain/governance/"
      condition: "Older than 48 hours"
      action: ROTATE
```

**Reality:** These policies are **DOCUMENTED ONLY** - no implementation exists!

### Recommended Purge Policy Implementation

```yaml
purge_policy:
  sessions:
    retention: 7 days
    action: DELETE
    trigger: session.created (check on every session start)
    implementation: cleanupOldSessions(directory) function
    
  halt_checkpoints:
    retention: 7 days
    action: DELETE (keep latest 5)
    trigger: session.created
    implementation: cleanupHaltCheckpoints(directory) function
    
  plugin_log:
    retention: 48 hours
    action: ROTATE (keep .log and .log.1)
    trigger: log write when size > 1MB
    implementation: rotatePluginLog(directory) function
    
  timestamps:
    retention: 30 days
    action: DELETE
    trigger: session.created
    implementation: cleanupStaleTimestamps(directory) function
    
  execution_metrics:
    retention: per-session (cleaned on session.idle)
    action: ARCHIVE to .idumb/archive/metrics/
    implementation: archiveSessionMetrics(sessionId) function
```

---

## 6. Enforcement Gaps

### GAP 1: Session File Explosion (CRITICAL)
- **Issue:** 180+ session files with no cleanup
- **Impact:** Disk usage, directory listing overhead
- **Root Cause:** `storeSessionMetadata()` creates files but nothing deletes them
- **Fix:** Add `cleanupOldSessions()` in session.created hook

### GAP 2: Halt Checkpoint Accumulation (HIGH)
- **Issue:** 35+ halt checkpoints never cleaned
- **Impact:** Disk usage, confusing for debugging
- **Root Cause:** `triggerEmergencyHalt()` creates but never purges
- **Fix:** Add `cleanupHaltCheckpoints()` keeping only recent 5

### GAP 3: No Schema Validation at Runtime (HIGH)
- **Issue:** Schemas exist but aren't validated
- **Impact:** Corrupted files cause silent failures
- **Root Cause:** No validation function implemented
- **Evidence:** `ensureIdumbConfig()` checks fields but not full schema
- **Fix:** Add `validateAgainstSchema(data, schemaPath)` function

### GAP 4: Empty Directories Never Used (MEDIUM)
- **Issue:** `context/`, `history/`, `anchors/` directories created but empty
- **Impact:** Dead code, misleading structure
- **Root Cause:** Planned features never implemented
- **Fix:** Either implement or remove from `ensureIdumbConfig()`

### GAP 5: Plugin Log No Rotation (MEDIUM)
- **Issue:** plugin.log grows without limit
- **Impact:** Disk usage, slow reads
- **Root Cause:** `log()` function appends without size check
- **Fix:** Add rotation when size > 1MB

### GAP 6: Timestamps Never Purged (LOW)
- **Issue:** Timestamp tracking files accumulate
- **Impact:** Minor disk usage
- **Root Cause:** No cleanup mechanism
- **Fix:** Remove timestamps for files that no longer exist

### GAP 7: Missing Config Schema File (MEDIUM)
- **Issue:** config.json has no JSON Schema file
- **Impact:** Can't validate config.json structure
- **Root Cause:** Oversight during schema creation
- **Fix:** Create `config-schema.json` from InlineIdumbConfig interface

### GAP 8: Documented Policies Not Implemented (CRITICAL)
- **Issue:** SYSTEM-MANIFEST.yaml documents garbage_collection but it's not code
- **Impact:** Users expect behavior that doesn't exist
- **Root Cause:** Documentation without implementation
- **Fix:** Implement all documented policies in idumb-core.ts

---

## 7. Recommended Fixes

### Priority 1: Implement Garbage Collection (Fixes Gaps 1, 2, 5, 6)

```typescript
// Add to template/plugins/idumb-core.ts

function cleanupOldSessions(directory: string, retentionDays: number = 7): void {
  const sessionsDir = join(directory, ".idumb", "sessions")
  if (!existsSync(sessionsDir)) return
  
  const now = Date.now()
  const maxAge = retentionDays * 24 * 60 * 60 * 1000
  
  const files = readdirSync(sessionsDir)
  for (const file of files) {
    const filePath = join(sessionsDir, file)
    try {
      const data = JSON.parse(readFileSync(filePath, "utf8"))
      const createdAt = new Date(data.createdAt).getTime()
      if (now - createdAt > maxAge) {
        unlinkSync(filePath)
        log(directory, `[GC] Deleted old session: ${file}`)
      }
    } catch { /* ignore parse errors */ }
  }
}

function cleanupHaltCheckpoints(directory: string, keepCount: number = 5): void {
  const executionDir = join(directory, ".idumb", "execution")
  if (!existsSync(executionDir)) return
  
  const halts = readdirSync(executionDir)
    .filter(d => d.startsWith("halt-"))
    .sort()  // Oldest first (timestamp-based names)
  
  if (halts.length > keepCount) {
    const toDelete = halts.slice(0, halts.length - keepCount)
    for (const halt of toDelete) {
      const haltPath = join(executionDir, halt)
      rmSync(haltPath, { recursive: true, force: true })
      log(directory, `[GC] Deleted old halt checkpoint: ${halt}`)
    }
  }
}

function rotatePluginLog(directory: string, maxSizeBytes: number = 1024 * 1024): void {
  const logPath = join(directory, ".idumb", "governance", "plugin.log")
  if (!existsSync(logPath)) return
  
  const stats = statSync(logPath)
  if (stats.size > maxSizeBytes) {
    const backupPath = logPath + ".1"
    if (existsSync(backupPath)) unlinkSync(backupPath)
    renameSync(logPath, backupPath)
    log(directory, `[GC] Rotated plugin.log`)
  }
}

// Call in session.created event:
// cleanupOldSessions(directory)
// cleanupHaltCheckpoints(directory)
```

### Priority 2: Add Schema Validation (Fixes Gap 3)

```typescript
// Add to template/plugins/idumb-core.ts

import Ajv from 'ajv'
import addFormats from 'ajv-formats'

const ajv = new Ajv()
addFormats(ajv)

function validateAgainstSchema(data: any, schemaPath: string): { valid: boolean; errors: string[] } {
  const schema = JSON.parse(readFileSync(schemaPath, "utf8"))
  const validate = ajv.compile(schema)
  const valid = validate(data)
  
  return {
    valid: !!valid,
    errors: valid ? [] : validate.errors?.map(e => e.message || "") || []
  }
}

// Use in ensureIdumbConfig():
// const result = validateAgainstSchema(config, join(directory, "template/governance/brain-state-schema.json"))
```

### Priority 3: Create Missing Schema Files (Fixes Gap 7)

Create `template/governance/config-schema.json`:
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "iDumb Config Schema",
  "type": "object",
  "required": ["version", "initialized", "user", "hierarchy", "automation"],
  "properties": {
    "version": { "type": "string", "pattern": "^\\d+\\.\\d+\\.\\d+$" },
    "user": {
      "type": "object",
      "required": ["name", "experience", "language"],
      "properties": {
        "name": { "type": "string" },
        "experience": { "enum": ["pro", "guided", "strict"] },
        "language": {
          "type": "object",
          "properties": {
            "communication": { "type": "string" },
            "documents": { "type": "string" }
          }
        }
      }
    }
    // ... rest of schema
  }
}
```

### Priority 4: Clean Up Unused Directories (Fixes Gap 4)

Either:
1. **Remove from ensureIdumbConfig()** - lines 2276-2284:
   - Remove: `brain/history/`, `brain/context/`, `anchors/`
   
2. **Or implement features:**
   - `context/`: Store compaction-surviving context
   - `history/`: Archive old history entries beyond 50
   - `anchors/`: Persistent anchors that survive state resets

---

## 8. Integration with SYSTEM-MANIFEST.yaml

The SYSTEM-MANIFEST.yaml (Section 10) documents garbage collection that must be implemented:

```yaml
# Currently documented but NOT implemented:
garbage_collection:
  auto_delete:
    - pattern: ".idumb/brain/sessions/*.json"
      condition: "Older than 7 days"
      
    - pattern: "*.log"
      location: ".idumb/brain/governance/"
      condition: "Older than 48 hours"
      
  validation_rule: "Any tool output with no documented consumer = DELETE"
```

### Action Required
1. Implement all documented garbage collection
2. Add tests to verify GC runs on session.created
3. Update SYSTEM-MANIFEST.yaml to reflect actual implementation status

---

## Summary

| Area | Status | Priority | Effort |
|------|--------|----------|--------|
| Generation | ✅ Working | - | - |
| Consumption | ✅ Working | - | - |
| Schema Definition | ⚠️ Partial | Medium | 2 hours |
| Schema Validation | ❌ Not Implemented | High | 4 hours |
| Garbage Collection | ❌ Not Implemented | Critical | 3 hours |
| Empty Directories | ⚠️ Unused | Low | 1 hour |
| Documentation Sync | ⚠️ Out of Sync | High | 2 hours |

**Total Estimated Effort:** ~12 hours to fully implement brain artifacts lifecycle management.

---

## Sources

1. `/Users/apple/Documents/coding-projects/idumb/template/plugins/idumb-core.ts` - Lines 1744-2700
2. `/Users/apple/Documents/coding-projects/idumb/.idumb/SYSTEM-MANIFEST.yaml` - Sections 2, 7, 10
3. `/Users/apple/Documents/coding-projects/idumb/template/governance/brain-state-schema.json`
4. `/Users/apple/Documents/coding-projects/idumb/template/governance/checkpoint-schema.json`
5. Direct inspection of `.idumb/` directory structure (2026-02-04)
