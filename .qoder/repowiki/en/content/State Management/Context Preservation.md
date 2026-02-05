# Context Preservation

<cite>
**Referenced Files in This Document**
- [continuation-format.md](file://src/references/continuation-format.md)
- [checkpoints.md](file://src/references/checkpoints.md)
- [session-tracker.ts](file://src/plugins/lib/session-tracker.ts)
- [types.ts](file://src/plugins/lib/types.ts)
- [state.ts](file://src/plugins/lib/state.ts)
- [checkpoint.ts](file://src/plugins/lib/checkpoint.ts)
- [idumb-core.ts](file://src/plugins/idumb-core.ts)
- [context.md](file://src/templates/context.md)
- [resumed-session.md](file://src/skills/hierarchical-mindfulness/examples/resumed-session.md)
- [resume.md](file://src/commands/idumb/resume.md)
- [MESSAGE-INTERCEPTION-SPEC.md](file://.plugin-dev/research/MESSAGE-INTERCEPTION-SPEC.md)
- [NEW-SESSION-VALIDATION.md](file://.plugin-dev/research/NEW-SESSION-VALIDATION.md)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)

## Introduction
This document explains iDumb’s context preservation mechanisms with a focus on the continuation format and the anchor system. It details how critical decisions, context, and checkpoints are preserved across state changes and session compaction. It covers the anchor prioritization system (critical, high, normal), automatic cleanup algorithms that maintain optimal memory usage, and practical examples of anchor creation, retrieval, filtering, and formatting for context injection. It also clarifies the relationship between anchors and session resumption, ensuring workflow continuity across interruptions.

## Project Structure
The context preservation system spans several modules:
- Anchor and state management: persistent anchors stored in state.json
- Session tracking: in-memory trackers and metadata persistence
- Checkpoint management: execution snapshots capturing context anchors
- Message transformation hooks: inject governance and resumption context
- Templates and references: define continuation and checkpoint formats

```mermaid
graph TB
subgraph "State and Anchors"
A[".idumb/brain/state.json<br/>IdumbState.anchors[]"]
B["Anchor Types<br/>decision/context/checkpoint/output_style/session_flow"]
C["Priority Levels<br/>critical/high/normal"]
end
subgraph "Session Management"
D["SessionTracker<br/>in-memory"]
E["SessionMetadata<br/>on disk"]
end
subgraph "Execution Context"
F["Checkpoint<br/>execution snapshots"]
G["Continuation Format<br/>templates"]
end
A --> B
B --> C
D --> E
A --> F
D --> G
```

**Diagram sources**
- [state.ts](file://src/plugins/lib/state.ts#L174-L189)
- [types.ts](file://src/plugins/lib/types.ts#L38-L44)
- [session-tracker.ts](file://src/plugins/lib/session-tracker.ts#L35-L117)
- [checkpoint.ts](file://src/plugins/lib/checkpoint.ts#L123-L204)
- [continuation-format.md](file://src/references/continuation-format.md#L16-L36)

**Section sources**
- [state.ts](file://src/plugins/lib/state.ts#L174-L189)
- [types.ts](file://src/plugins/lib/types.ts#L38-L44)
- [session-tracker.ts](file://src/plugins/lib/session-tracker.ts#L35-L117)
- [checkpoint.ts](file://src/plugins/lib/checkpoint.ts#L123-L204)
- [continuation-format.md](file://src/references/continuation-format.md#L16-L36)

## Core Components
- Anchor model and priorities: anchors are typed and prioritized, persisted in state.json, and filtered for context injection.
- Session resumption: detects resumed sessions and builds contextual reminders to maintain workflow continuity.
- Checkpointing: captures critical and high-priority anchors at execution boundaries for recovery.
- Continuation format: standardized presentation of next steps to keep context clean and actionable.
- Automatic cleanup: memory and disk cleanup policies to maintain performance and storage hygiene.

**Section sources**
- [types.ts](file://src/plugins/lib/types.ts#L38-L44)
- [session-tracker.ts](file://src/plugins/lib/session-tracker.ts#L269-L332)
- [checkpoint.ts](file://src/plugins/lib/checkpoint.ts#L123-L204)
- [continuation-format.md](file://src/references/continuation-format.md#L16-L36)

## Architecture Overview
The system integrates hooks and utilities to preserve and recover context across interruptions and compactions.

```mermaid
sequenceDiagram
participant User as "User"
participant Core as "idumb-core.ts"
participant Tracker as "SessionTracker"
participant State as "State (state.json)"
participant Meta as "SessionMetadata"
User->>Core : "Start or resume session"
Core->>Tracker : "getSessionTracker()"
Core->>Core : "Detect session start/resumed"
alt Resumed session
Core->>Meta : "loadSessionMetadata()"
Meta-->>Core : "createdAt/lastUpdated/phase"
Core->>State : "readState()"
State-->>Core : "anchors[], history"
Core->>Core : "buildResumeContext()"
Core->>User : "Inject resume context + governance"
else New session
Core->>Core : "buildGovernancePrefix()"
Core->>User : "Inject governance"
end
```

**Diagram sources**
- [idumb-core.ts](file://src/plugins/idumb-core.ts#L446-L493)
- [session-tracker.ts](file://src/plugins/lib/session-tracker.ts#L269-L332)
- [state.ts](file://src/plugins/lib/state.ts#L34-L45)

## Detailed Component Analysis

### Anchor System and Priorities
- Anchor types: decision, context, checkpoint, output_style, session_flow.
- Priority levels: critical, high, normal.
- Persistence: anchors stored in state.json under IdumbState.anchors.
- Filtering: commonly used to select critical and high anchors for context injection and checkpointing.

```mermaid
classDiagram
class IdumbState {
+string version
+string initialized
+string framework
+string phase
+string lastValidation
+number validationCount
+Anchor[] anchors
+HistoryEntry[] history
+string activeStyle
}
class Anchor {
+string id
+string created
+string type
+string content
+string priority
}
IdumbState --> Anchor : "contains"
```

**Diagram sources**
- [types.ts](file://src/plugins/lib/types.ts#L20-L36)
- [types.ts](file://src/plugins/lib/types.ts#L38-L44)

**Section sources**
- [types.ts](file://src/plugins/lib/types.ts#L38-L44)
- [state.ts](file://src/plugins/lib/state.ts#L174-L189)

### Session Resumption and Resume Context
- Resumption detection: identifies sessions idle between 1 and 48 hours.
- Resume context construction: includes idle duration, previous session date, current phase, and active anchors.
- Conditional injection: prepends resume context to governance prefix when resuming.

```mermaid
flowchart TD
Start(["Session start/resumed"]) --> CheckResumed["Check if resumed (1-48h idle)"]
CheckResumed --> |Yes| LoadMeta["Load SessionMetadata"]
LoadMeta --> LoadState["Read IdumbState"]
LoadState --> FilterAnchors["Filter anchors: critical + high"]
FilterAnchors --> BuildCtx["Build resume context"]
BuildCtx --> Inject["Inject resume context + governance"]
CheckResumed --> |No| BuildGov["Build governance prefix"]
BuildGov --> Inject
Inject --> End(["Continue workflow"])
```

**Diagram sources**
- [session-tracker.ts](file://src/plugins/lib/session-tracker.ts#L269-L332)
- [idumb-core.ts](file://src/plugins/idumb-core.ts#L465-L493)

**Section sources**
- [session-tracker.ts](file://src/plugins/lib/session-tracker.ts#L269-L332)
- [idumb-core.ts](file://src/plugins/idumb-core.ts#L465-L493)
- [resumed-session.md](file://src/skills/hierarchical-mindfulness/examples/resumed-session.md#L1-L182)

### Checkpointing and Session Compaction
- Checkpoint creation: captures git hash, file changes, and critical/high anchors.
- Compaction hook: injects context before model receives truncated context.
- Automatic cleanup: preserves critical/high anchors across compaction and limits checkpoint count.

```mermaid
sequenceDiagram
participant Exec as "Executor"
participant State as "State (state.json)"
participant CP as "Checkpoint Manager"
participant Core as "idumb-core.ts"
Exec->>CP : "createCheckpoint(phase, task, type, notes)"
CP->>State : "readState()"
State-->>CP : "anchors[], history"
CP->>CP : "Filter critical/high anchors"
CP->>CP : "Compute file changes"
CP-->>Exec : "Checkpoint JSON saved"
Core->>Core : "experimental.session.compacting"
Core->>Exec : "Append compaction context"
```

**Diagram sources**
- [checkpoint.ts](file://src/plugins/lib/checkpoint.ts#L123-L204)
- [idumb-core.ts](file://src/plugins/idumb-core.ts#L347-L378)

**Section sources**
- [checkpoint.ts](file://src/plugins/lib/checkpoint.ts#L123-L204)
- [idumb-core.ts](file://src/plugins/idumb-core.ts#L347-L378)

### Continuation Format
- Standardized presentation of next steps after commands or workflows.
- Core structure emphasizes clarity, actionable commands, and context hygiene (/clear guidance).
- Variants cover executing next plans, final plans, planning vs researching, and milestone completions.

```mermaid
flowchart TD
A["Command/Workflow completes"] --> B["Select variant based on phase/status"]
B --> C["Render core structure:<br/>Next Up, Command, /clear note"]
C --> D["Optional: Also available alternatives"]
D --> E["Present to user"]
```

**Diagram sources**
- [continuation-format.md](file://src/references/continuation-format.md#L16-L135)

**Section sources**
- [continuation-format.md](file://src/references/continuation-format.md#L16-L283)

### Automatic Cleanup Algorithms
- In-memory session cleanup: evicts stale sessions older than 24 hours or applies LRU eviction beyond 100 concurrent sessions.
- Anchor pruning: maintains a bounded number of anchors, keeping recent critical and high anchors and discarding older normal anchors.
- Checkpoint lifecycle: marks checkpoints as stale after 48 hours and supports deletion.

```mermaid
flowchart TD
Start(["Cleanup trigger"]) --> MemCleanup["Cleanup stale sessions (>24h)<br/>or LRU beyond 100"]
MemCleanup --> AnchorPrune["Prune anchors:<br/>keep recent critical/high,<br/>drop oldest normals"]
AnchorPrune --> CheckpointClean["Mark checkpoints stale (>48h)<br/>and optionally delete"]
CheckpointClean --> End(["Memory and disk optimized"])
```

**Diagram sources**
- [session-tracker.ts](file://src/plugins/lib/session-tracker.ts#L54-L88)
- [state.ts](file://src/plugins/lib/state.ts#L175-L189)
- [checkpoint.ts](file://src/plugins/lib/checkpoint.ts#L231-L241)

**Section sources**
- [session-tracker.ts](file://src/plugins/lib/session-tracker.ts#L54-L88)
- [state.ts](file://src/plugins/lib/state.ts#L175-L189)
- [checkpoint.ts](file://src/plugins/lib/checkpoint.ts#L231-L241)

### Anchor Creation, Retrieval, Filtering, and Formatting
- Creation: add an anchor with type, content, and optional priority; prune to bounds after insertion.
- Retrieval: filter anchors by priority for context injection or checkpointing.
- Formatting: serialize content for compatibility (e.g., style anchors) and apply replacement policies per agent.
- Examples of anchor types and priorities are documented in command references and checkpoint definitions.

```mermaid
flowchart TD
Create["Create anchor"] --> Insert["Insert into state.anchors"]
Insert --> Bounds["Enforce bounds:<br/>limit critical/high/normals"]
Bounds --> Persist["writeState()"]
Retrieve["Retrieve anchors"] --> Filter["Filter by priority:<br/>critical + high"]
Filter --> Format["Format for context/injection"]
```

**Diagram sources**
- [state.ts](file://src/plugins/lib/state.ts#L155-L189)
- [checkpoint.ts](file://src/plugins/lib/checkpoint.ts#L171-L177)
- [resume.md](file://src/commands/idumb/resume.md#L156-L220)

**Section sources**
- [state.ts](file://src/plugins/lib/state.ts#L155-L189)
- [checkpoint.ts](file://src/plugins/lib/checkpoint.ts#L171-L177)
- [resume.md](file://src/commands/idumb/resume.md#L156-L220)

### Relationship Between Anchors and Session Resumption
- Active anchors (critical + high) are highlighted during resumption to refresh context quickly.
- Resume context informs the user of idle duration, previous session timing, current phase, and key decisions.
- This ensures continuity without requiring the user to re-explain prior decisions or recent progress.

**Section sources**
- [session-tracker.ts](file://src/plugins/lib/session-tracker.ts#L303-L332)
- [resumed-session.md](file://src/skills/hierarchical-mindfulness/examples/resumed-session.md#L32-L140)

### Context Purification and Automatic Triggers (Research and Implementation Notes)
- Research proposes a context purity scoring algorithm and a purification trigger that creates a checkpoint before purification and stores critical context for the next session.
- Implementation gaps indicate missing integration points in the main conversation and accumulation scoring.

```mermaid
flowchart TD
Detect["Accumulated score > threshold"] --> CreateCP["Create checkpoint<br/>with critical anchors"]
CreateCP --> BuildCtx["Build purification context"]
BuildCtx --> ResetScore["Reset accumulated score"]
ResetScore --> StoreCtx["Store purification context"]
StoreCtx --> LogEvent["Log purification event"]
```

**Diagram sources**
- [.plugin-dev/research/MESSAGE-INTERCEPTION-SPEC.md](file://.plugin-dev/research/MESSAGE-INTERCEPTION-SPEC.md#L499-L582)

**Section sources**
- [.plugin-dev/research/MESSAGE-INTERCEPTION-SPEC.md](file://.plugin-dev/research/MESSAGE-INTERCEPTION-SPEC.md#L499-L582)
- [.plugin-dev/research/NEW-SESSION-VALIDATION.md](file://.plugin-dev/research/NEW-SESSION-VALIDATION.md#L449-L508)

## Dependency Analysis
The anchor and session systems depend on shared types and state management utilities. Checkpointing depends on state and file-change detection. Message transformation hooks depend on session tracking and state to build contextual prefixes.

```mermaid
graph LR
Types["types.ts"] --> State["state.ts"]
Types --> Session["session-tracker.ts"]
Types --> Checkpoint["checkpoint.ts"]
State --> Checkpoint
State --> Session
Session --> Hooks["idumb-core.ts"]
Checkpoint --> Hooks
```

**Diagram sources**
- [types.ts](file://src/plugins/lib/types.ts#L38-L44)
- [state.ts](file://src/plugins/lib/state.ts#L34-L45)
- [session-tracker.ts](file://src/plugins/lib/session-tracker.ts#L35-L117)
- [checkpoint.ts](file://src/plugins/lib/checkpoint.ts#L123-L204)
- [idumb-core.ts](file://src/plugins/idumb-core.ts#L446-L493)

**Section sources**
- [types.ts](file://src/plugins/lib/types.ts#L38-L44)
- [state.ts](file://src/plugins/lib/state.ts#L34-L45)
- [session-tracker.ts](file://src/plugins/lib/session-tracker.ts#L35-L117)
- [checkpoint.ts](file://src/plugins/lib/checkpoint.ts#L123-L204)
- [idumb-core.ts](file://src/plugins/idumb-core.ts#L446-L493)

## Performance Considerations
- Memory management: in-memory session eviction prevents unbounded growth; consider adjusting TTL and max sessions based on workload.
- Anchor pruning: maintains bounded anchor lists to reduce state size and improve read/write performance.
- Checkpoint aging: marking checkpoints stale after 48 hours reduces unnecessary disk usage.
- Context injection budgeting: compaction preserves minimal style context to avoid exceeding character budgets.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
- Resumption context not injected: verify session resumption detection and that resume context is prepended to governance prefix.
- Missing anchors in context: confirm anchor filtering for critical/high and that state is readable.
- Checkpoint not created: ensure state is available, file changes are computed, and checkpoint directory exists.
- Excessive memory usage: review cleanup thresholds and consider reducing max sessions or TTL.
- Purification not triggered: check accumulation scoring and threshold logic; ensure integration with message transformation hooks.

**Section sources**
- [session-tracker.ts](file://src/plugins/lib/session-tracker.ts#L269-L332)
- [checkpoint.ts](file://src/plugins/lib/checkpoint.ts#L123-L204)
- [state.ts](file://src/plugins/lib/state.ts#L34-L45)
- [idumb-core.ts](file://src/plugins/idumb-core.ts#L347-L378)
- [.plugin-dev/research/MESSAGE-INTERCEPTION-SPEC.md](file://.plugin-dev/research/MESSAGE-INTERCEPTION-SPEC.md#L499-L582)

## Conclusion
iDumb’s context preservation relies on a robust anchor system, precise session resumption logic, and disciplined checkpointing. The anchor prioritization (critical, high, normal) ensures essential context is retained across interruptions and compaction. Automatic cleanup algorithms maintain performance and storage efficiency. Together, these mechanisms sustain workflow continuity and enable reliable session resumption with minimal user intervention.