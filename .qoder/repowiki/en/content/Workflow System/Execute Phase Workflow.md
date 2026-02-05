# Execute Phase Workflow

<cite>
**Referenced Files in This Document**
- [execute-phase.md](file://src/workflows/execute-phase.md)
- [execute-phase.md](file://src/commands/idumb/execute-phase.md)
- [execution-metrics.ts](file://src/plugins/lib/execution-metrics.ts)
- [checkpoint.ts](file://src/plugins/lib/checkpoint.ts)
- [logging.ts](file://src/plugins/lib/logging.ts)
- [state.ts](file://src/plugins/lib/state.ts)
- [idumb-validate.ts](file://src/tools/idumb-validate.ts)
- [completion-definitions.yaml](file://src/config/completion-definitions.yaml)
- [deny-rules.yaml](file://src/config/deny-rules.yaml)
- [integration-matrix-template.yaml](file://src/skills/idumb-validation/templates/integration-matrix-template.yaml)
- [verify-phase.md](file://src/workflows/verify-phase.md)
- [types.ts](file://src/plugins/lib/types.ts)
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
10. [Appendices](#appendices)

## Introduction
This document explains the Execute Phase Workflow that transforms plans into executable outcomes. It covers execution methodology, task coordination, progress monitoring, health and performance integration, quality assurance, execution control, resource management, and progress tracking. It also details execution validation, milestone achievement, completion criteria, integration with task management and monitoring systems, troubleshooting, error recovery, performance tuning, and the relationship between execution and validation workflows.

## Project Structure
The Execute Phase spans two primary layers:
- Workflow specification: defines execution steps, checkpoints, deviation handling, and success criteria
- Command orchestration: coordinates wave-based parallel execution, manages governance state, and integrates with validators and verifiers

```mermaid
graph TB
subgraph "Workflow Layer"
WF["execute-phase.md<br/>Workflow Definition"]
VF["verify-phase.md<br/>Verification Workflow"]
end
subgraph "Command Layer"
CMD["execute-phase.md<br/>Command Orchestrator"]
end
subgraph "Plugins & Tools"
MET["execution-metrics.ts<br/>Metrics & Stall Detection"]
CKPT["checkpoint.ts<br/>Checkpoint Management"]
LOG["logging.ts<br/>File Logging"]
STATE["state.ts<br/>State Management"]
VALID["idumb-validate.ts<br/>Validation Runner"]
end
subgraph "Configuration"
COMPDEF["completion-definitions.yaml<br/>Completion Criteria"]
DENY["deny-rules.yaml<br/>Permissions & Deny Rules"]
IMT["integration-matrix-template.yaml<br/>Integration Matrix"]
end
CMD --> WF
CMD --> MET
CMD --> CKPT
CMD --> STATE
CMD --> VALID
WF --> MET
WF --> CKPT
WF --> STATE
WF --> VALID
CMD --> COMPDEF
CMD --> DENY
CMD --> IMT
VF --> VALID
```

**Diagram sources**
- [execute-phase.md](file://src/workflows/execute-phase.md#L1-L729)
- [execute-phase.md](file://src/commands/idumb/execute-phase.md#L1-L547)
- [execution-metrics.ts](file://src/plugins/lib/execution-metrics.ts#L1-L373)
- [checkpoint.ts](file://src/plugins/lib/checkpoint.ts#L1-L357)
- [logging.ts](file://src/plugins/lib/logging.ts#L1-L118)
- [state.ts](file://src/plugins/lib/state.ts#L1-L189)
- [idumb-validate.ts](file://src/tools/idumb-validate.ts#L1-L800)
- [completion-definitions.yaml](file://src/config/completion-definitions.yaml#L1-L990)
- [deny-rules.yaml](file://src/config/deny-rules.yaml#L1-L398)
- [integration-matrix-template.yaml](file://src/skills/idumb-validation/templates/integration-matrix-template.yaml#L1-L141)
- [verify-phase.md](file://src/workflows/verify-phase.md#L1-L986)

**Section sources**
- [execute-phase.md](file://src/workflows/execute-phase.md#L1-L729)
- [execute-phase.md](file://src/commands/idumb/execute-phase.md#L1-L547)

## Core Components
- Execution orchestration: discovers plans, groups into waves, spawns parallel executors, aggregates results, and transitions to verification
- Task execution engine: builds dependency order, executes tasks with builder/validator cycles, maintains checkpoints, and tracks progress
- Monitoring and governance: metrics, stall detection, checkpoints, logging, and state management
- Validation and verification: goal-backward verification, skeptic review, and integration validation
- Completion criteria: acceptance-criteria-driven exit gates, stall escalation, and milestone achievement

**Section sources**
- [execute-phase.md](file://src/workflows/execute-phase.md#L315-L377)
- [execute-phase.md](file://src/commands/idumb/execute-phase.md#L36-L153)
- [execution-metrics.ts](file://src/plugins/lib/execution-metrics.ts#L146-L164)
- [checkpoint.ts](file://src/plugins/lib/checkpoint.ts#L120-L204)
- [verify-phase.md](file://src/workflows/verify-phase.md#L189-L251)

## Architecture Overview
The Execute Phase uses a wave-based parallel execution model:
- Waves represent topological layers of interdependent plans
- Within each wave, plans execute in parallel
- After each wave, results are verified and the next wave proceeds only after completion

```mermaid
sequenceDiagram
participant Orchestrator as "Command Orchestrator"
participant Wave as "Wave Executor"
participant Executor as "idumb-executor (subagent)"
participant Builder as "idumb-builder"
participant Validator as "idumb-low-validator"
participant State as "State Manager"
participant Metrics as "Execution Metrics"
participant Checkpoint as "Checkpoint Manager"
Orchestrator->>Wave : Discover and group plans by wave
Wave->>Executor : Spawn parallel executors with plan content
Executor->>Builder : Execute task with acceptance criteria
Builder-->>Executor : Modified files, commit
Executor->>Validator : Validate task results
Validator-->>Executor : PASS/PARTIAL/FAIL with citations
Executor->>Checkpoint : Create checkpoint
Executor->>Metrics : Track iterations/spawns/errors
Executor->>State : Update progress and history
Wave-->>Orchestrator : Aggregate SUMMARYs
Orchestrator->>Orchestrator : Proceed to next wave or verification
```

**Diagram sources**
- [execute-phase.md](file://src/commands/idumb/execute-phase.md#L115-L153)
- [execute-phase.md](file://src/workflows/execute-phase.md#L165-L277)
- [execution-metrics.ts](file://src/plugins/lib/execution-metrics.ts#L100-L141)
- [checkpoint.ts](file://src/plugins/lib/checkpoint.ts#L120-L204)
- [state.ts](file://src/plugins/lib/state.ts#L79-L101)

## Detailed Component Analysis

### Execution Methodology and Task Coordination
- Plan discovery and grouping: plans are grouped by wave number and executed sequentially with parallel execution within each wave
- Dependency-aware execution: tasks are sorted topologically; dependencies are verified before execution
- Agent delegation: idumb-builder executes tasks; idumb-low-validator validates results; retry logic up to three attempts
- Timeout management: per-task timeouts derived from estimates; strict timeouts for validation

```mermaid
flowchart TD
Start(["Start Execute Phase"]) --> Discover["Discover Plans"]
Discover --> GroupWaves["Group by Wave"]
GroupWaves --> ForEachWave{"For Each Wave"}
ForEachWave --> SpawnExecutors["Spawn Parallel Executors"]
SpawnExecutors --> TaskLoop["Task Execution Loop"]
TaskLoop --> CheckSkip{"Already Completed?"}
CheckSkip --> |Yes| NextTask["Skip Task"]
CheckSkip --> |No| CheckDeps{"Dependencies Satisfied?"}
CheckDeps --> |No| BlockTask["Mark as Blocked"]
CheckDeps --> |Yes| DelegateBuilder["Delegate to idumb-builder"]
DelegateBuilder --> ValidateResult["Delegate to idumb-low-validator"]
ValidateResult --> Decision{"Validation Result"}
Decision --> |PASS| CreateCheckpoint["Create Checkpoint"]
Decision --> |PARTIAL| Retry["Retry with Feedback"]
Decision --> |FAIL| RetryLimit{"Retry < 3?"}
RetryLimit --> |Yes| DelegateBuilder
RetryLimit --> |No| MarkFailed["Mark Task Failed"]
CreateCheckpoint --> NextTask
BlockTask --> NextTask
MarkFailed --> NextTask
NextTask --> TaskLoop
TaskLoop --> ForEachWave
ForEachWave --> VerifySummaries["Verify SUMMARYs Created"]
VerifySummaries --> NextWave{"More Waves?"}
NextWave --> |Yes| ForEachWave
NextWave --> |No| Aggregate["Aggregate Results"]
Aggregate --> Proceed["Proceed to Verification"]
```

**Diagram sources**
- [execute-phase.md](file://src/commands/idumb/execute-phase.md#L73-L153)
- [execute-phase.md](file://src/workflows/execute-phase.md#L165-L277)

**Section sources**
- [execute-phase.md](file://src/commands/idumb/execute-phase.md#L73-L153)
- [execute-phase.md](file://src/workflows/execute-phase.md#L165-L277)

### Progress Monitoring and Checkpoints
- Checkpoint creation: after each task completion, a checkpoint captures task status, git hash, modified files, and validation result
- Resume capability: progress is tracked in a progress.json; git consistency is verified; resume rebuilds the task queue excluding completed tasks
- Rollback protocol: identifies last good checkpoint, offers options to reset to checkpoint hash or trim progress

```mermaid
flowchart TD
Init(["Initialize/Resume"]) --> LoadProgress["Load progress.json"]
LoadProgress --> VerifyGit["Verify Git Consistency"]
VerifyGit --> BuildQueue["Build Task Queue (exclude completed)"]
BuildQueue --> ExecuteTask["Execute Task"]
ExecuteTask --> CreateCheckpoint["Create Checkpoint"]
CreateCheckpoint --> UpdateProgress["Update progress.json"]
UpdateProgress --> NextTask{"More Tasks?"}
NextTask --> |Yes| ExecuteTask
NextTask --> |No| GenerateSummary["Generate Summary"]
GenerateSummary --> UpdateState["Update Governance State"]
```

**Diagram sources**
- [execute-phase.md](file://src/workflows/execute-phase.md#L102-L136)
- [execute-phase.md](file://src/workflows/execute-phase.md#L279-L362)
- [checkpoint.ts](file://src/plugins/lib/checkpoint.ts#L120-L204)

**Section sources**
- [execute-phase.md](file://src/workflows/execute-phase.md#L394-L469)
- [checkpoint.ts](file://src/plugins/lib/checkpoint.ts#L120-L204)

### Health Check Integration and Performance Monitoring
- Execution metrics: tracks iterations, agent spawns, and errors; detects stalls via planner-checker and validator-fix patterns
- Emergency halt: triggers when stall detection conditions are met, saves halt context, and provides recovery options
- Logging: file-based logging with rotation to prevent unbounded growth; used across plugins and workflows

```mermaid
classDiagram
class ExecutionMetrics {
+string sessionId
+string startedAt
+object iterationCounts
+object agentSpawns
+object errors
+object limits
+trackIteration()
+trackAgentSpawn()
+trackError()
+checkLimits()
}
class StallDetection {
+object plannerChecker
+object validatorFix
+detectPlannerCheckerStall()
+detectValidatorFixStall()
}
class Logging {
+rotateLogs()
+log(message)
}
ExecutionMetrics --> StallDetection : "used by"
ExecutionMetrics --> Logging : "uses"
```

**Diagram sources**
- [execution-metrics.ts](file://src/plugins/lib/execution-metrics.ts#L100-L164)
- [execution-metrics.ts](file://src/plugins/lib/execution-metrics.ts#L210-L285)
- [logging.ts](file://src/plugins/lib/logging.ts#L36-L117)

**Section sources**
- [execution-metrics.ts](file://src/plugins/lib/execution-metrics.ts#L146-L164)
- [execution-metrics.ts](file://src/plugins/lib/execution-metrics.ts#L309-L372)
- [logging.ts](file://src/plugins/lib/logging.ts#L36-L117)

### Quality Assurance During Execution
- Pre-write validation: security and quality checks before file modifications
- Pre-delegate validation: ensures delegation chain integrity
- Validation runner: structure, schema, freshness, planning alignment, and integration points
- Deny rules: comprehensive allowlists and deny rules for bash, delegation, file types, and tools

```mermaid
flowchart TD
PreWrite["Pre-Write Validation"] --> SecurityCheck["Security Checks"]
PreWrite --> QualityCheck["Quality Checks"]
PreWrite --> ApproveWrite{"Approve Write?"}
PreDelegate["Pre-Delegate Validation"] --> CheckAgents["Check Agent Existence"]
PreDelegate --> CheckPermissions["Check Permissions"]
PreDelegate --> ApproveDelegate{"Approve Delegation?"}
ValidateRunner["Validation Runner"] --> Structure["Structure Check"]
ValidateRunner --> Schema["Schema Check"]
ValidateRunner --> Freshness["Freshness Check"]
ValidateRunner --> Alignment["Planning Alignment"]
ValidateRunner --> Integration["Integration Points"]
DenyRules["Deny Rules"] --> Bash["Bash Commands"]
DenyRules --> Delegation["Delegation"]
DenyRules --> Files["File Types"]
DenyRules --> Tools["Tools"]
```

**Diagram sources**
- [execute-phase.md](file://src/workflows/execute-phase.md#L217-L236)
- [execute-phase.md](file://src/workflows/execute-phase.md#L471-L543)
- [idumb-validate.ts](file://src/tools/idumb-validate.ts#L29-L104)
- [idumb-validate.ts](file://src/tools/idumb-validate.ts#L107-L187)
- [idumb-validate.ts](file://src/tools/idumb-validate.ts#L189-L280)
- [idumb-validate.ts](file://src/tools/idumb-validate.ts#L282-L399)
- [idumb-validate.ts](file://src/tools/idumb-validate.ts#L401-L456)
- [deny-rules.yaml](file://src/config/deny-rules.yaml#L18-L135)
- [deny-rules.yaml](file://src/config/deny-rules.yaml#L140-L221)
- [deny-rules.yaml](file://src/config/deny-rules.yaml#L226-L266)
- [deny-rules.yaml](file://src/config/deny-rules.yaml#L271-L301)

**Section sources**
- [execute-phase.md](file://src/workflows/execute-phase.md#L217-L236)
- [idumb-validate.ts](file://src/tools/idumb-validate.ts#L29-L104)
- [idumb-validate.ts](file://src/tools/idumb-validate.ts#L107-L187)
- [idumb-validate.ts](file://src/tools/idumb-validate.ts#L189-L280)
- [idumb-validate.ts](file://src/tools/idumb-validate.ts#L282-L399)
- [deny-rules.yaml](file://src/config/deny-rules.yaml#L18-L135)

### Execution Control, Resource Management, and Progress Tracking
- Resource management: per-task commits staged individually; broad directory staging is prohibited
- Progress tracking: progress.json records completed, failed, and blocked tasks; git hash captured for traceability
- State management: atomic writes to state.json; history entries keep last 50 actions
- Governance state updates: phase status and history entries recorded after execution

```mermaid
sequenceDiagram
participant Builder as "idumb-builder"
participant Git as "Git"
participant State as "State Manager"
participant Progress as "Progress Tracker"
Builder->>Git : Stage modified files
Builder->>Git : Commit with phase-plan prefix
Builder->>State : Update history entry
Builder->>Progress : Append to completed tasks
State-->>Builder : Atomic write success
Progress-->>Builder : Updated progress.json
```

**Diagram sources**
- [execute-phase.md](file://src/commands/idumb/execute-phase.md#L341-L374)
- [state.ts](file://src/plugins/lib/state.ts#L51-L73)
- [state.ts](file://src/plugins/lib/state.ts#L79-L101)

**Section sources**
- [execute-phase.md](file://src/commands/idumb/execute-phase.md#L341-L374)
- [state.ts](file://src/plugins/lib/state.ts#L51-L73)
- [state.ts](file://src/plugins/lib/state.ts#L79-L101)

### Execution Validation, Milestone Achievement, and Completion Criteria
- Acceptance-criteria-driven completion: tasks complete when validated; execution completes when all tasks are resolved
- Consecutive failure detection: halts execution after three consecutive failures
- Checkpoint protocol: enables resume from exact point after interruption
- Verification workflow: goal-backward analysis, skeptic review, and generation of VERIFICATION.md

```mermaid
flowchart TD
TaskExec["Task Execution"] --> Validate["Validation Gate"]
Validate --> Result{"Result"}
Result --> |PASS| NextTask["Next Task"]
Result --> |PARTIAL| Retry["Retry with Feedback"]
Result --> |FAIL| RetryAttempt{"Retry < 3?"}
RetryAttempt --> |Yes| TaskExec
RetryAttempt --> |No| MarkBlocked["Mark Blocked/Failed"]
MarkBlocked --> NextTask
NextTask --> AllResolved{"All Tasks Resolved?"}
AllResolved --> |Yes| GenerateSummary["Generate SUMMARY.md"]
GenerateSummary --> Verification["Run Verification Workflow"]
Verification --> Milestone{"Milestone Achieved?"}
Milestone --> |Yes| Complete["Complete Phase"]
Milestone --> |No| Iterate["Iterate with Fixes"]
```

**Diagram sources**
- [completion-definitions.yaml](file://src/config/completion-definitions.yaml#L314-L377)
- [completion-definitions.yaml](file://src/config/completion-definitions.yaml#L355-L366)
- [verify-phase.md](file://src/workflows/verify-phase.md#L445-L480)

**Section sources**
- [completion-definitions.yaml](file://src/config/completion-definitions.yaml#L314-L377)
- [completion-definitions.yaml](file://src/config/completion-definitions.yaml#L355-L366)
- [verify-phase.md](file://src/workflows/verify-phase.md#L445-L480)

### Examples of Execution Execution, Parameter Configuration, and Performance Optimization
- Parameter configuration: batch size, per-task timeout, interactive/auto mode, gaps-only execution
- Performance optimization: wave-based parallelization, strict timeouts, stall detection, and emergency halt
- Integration examples: checkpoint creation, validation gating, and governance state updates

**Section sources**
- [execute-phase.md](file://src/commands/idumb/execute-phase.md#L24-L31)
- [execute-phase.md](file://src/commands/idumb/execute-phase.md#L302-L326)
- [execution-metrics.ts](file://src/plugins/lib/execution-metrics.ts#L210-L285)

### Relationship Between Execution and Validation Workflows
- Execution produces SUMMARY.md and checkpoints; verification validates goals and generates VERIFICATION.md
- Validation uses goal-backward analysis and skeptic review to ensure value delivery, not just task completion
- Integration validation ensures wiring correctness across components

**Section sources**
- [execute-phase.md](file://src/workflows/execute-phase.md#L279-L362)
- [verify-phase.md](file://src/workflows/verify-phase.md#L189-L251)
- [idumb-validate.ts](file://src/tools/idumb-validate.ts#L722-L754)

## Dependency Analysis
The Execute Phase relies on several internal dependencies:
- Plugins: execution metrics, checkpoint management, logging, and state management
- Tools: validation runner and integration matrix template
- Configuration: completion definitions and deny rules
- Workflows: verification workflow for post-execution validation

```mermaid
graph TB
ExecWF["Execute Phase Workflow"] --> Metrics["Execution Metrics"]
ExecWF --> Checkpoint["Checkpoint Manager"]
ExecWF --> State["State Manager"]
ExecWF --> Validate["Validation Runner"]
ExecWF --> Deny["Deny Rules"]
ExecWF --> CompDef["Completion Definitions"]
ExecWF --> Verify["Verification Workflow"]
Verify --> Validate
Validate --> IMT["Integration Matrix Template"]
```

**Diagram sources**
- [execute-phase.md](file://src/workflows/execute-phase.md#L1-L729)
- [execution-metrics.ts](file://src/plugins/lib/execution-metrics.ts#L1-L373)
- [checkpoint.ts](file://src/plugins/lib/checkpoint.ts#L1-L357)
- [state.ts](file://src/plugins/lib/state.ts#L1-L189)
- [idumb-validate.ts](file://src/tools/idumb-validate.ts#L1-L800)
- [deny-rules.yaml](file://src/config/deny-rules.yaml#L1-L398)
- [completion-definitions.yaml](file://src/config/completion-definitions.yaml#L1-L990)
- [verify-phase.md](file://src/workflows/verify-phase.md#L1-L986)
- [integration-matrix-template.yaml](file://src/skills/idumb-validation/templates/integration-matrix-template.yaml#L1-L141)

**Section sources**
- [types.ts](file://src/plugins/lib/types.ts#L100-L176)

## Performance Considerations
- Prefer wave-based parallelization to maximize throughput while respecting dependencies
- Use strict timeouts to avoid long-running tasks from blocking progress
- Monitor stall detection to proactively escalate issues
- Keep logs rotated to prevent performance degradation from large log files
- Stage per-task changes individually to minimize merge conflicts and improve traceability

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and resolutions:
- Circular dependencies: detected during dependency graph building; resolve by editing plan
- Task failures: retry up to three times; escalate to debugger on persistent failure
- Deviations from plan: unexpected file changes are flagged; choose to accept, revert, or halt
- Git state changes: warning when repository state differs from checkpoint; options to continue, reset, or start fresh
- Consecutive failures: immediate halt with hypotheses and user direction
- Emergency halt: triggered by stall detection; review checkpoint and run validation

**Section sources**
- [execute-phase.md](file://src/workflows/execute-phase.md#L150-L162)
- [execute-phase.md](file://src/workflows/execute-phase.md#L240-L251)
- [execute-phase.md](file://src/workflows/execute-phase.md#L491-L505)
- [execute-phase.md](file://src/workflows/execute-phase.md#L444-L469)
- [execution-metrics.ts](file://src/plugins/lib/execution-metrics.ts#L309-L372)

## Conclusion
The Execute Phase Workflow provides a robust, governance-aligned mechanism to transform plans into validated outcomes. Through dependency-aware execution, strict validation gates, comprehensive checkpoints, and integrated monitoring, it ensures traceability, resumability, and quality. The subsequent verification workflow guarantees value delivery by validating goals rather than merely completing tasks.

[No sources needed since this section summarizes without analyzing specific files]

## Appendices

### Success Criteria Checklist
- Entry validation: plan exists, state initialized, execution directory created, progress file initialized or loaded
- Execution integrity: tasks processed in dependency order, no circular dependencies, each task validated before marking complete, checkpoints created after each task, retry limit respected
- Artifact creation: SUMMARY.md created with required sections, frontmatter valid, file counts match execution
- State management: progress updated throughout, state.json updated with execution result, history entry recorded, git hashes captured
- Error handling: failed tasks marked correctly, dependent tasks blocked appropriately, user notified of deviations, rollback path available
- Chain transition: correct chain command determined, user prompted appropriately, context preserved for next workflow

**Section sources**
- [execute-phase.md](file://src/workflows/execute-phase.md#L657-L695)

### Integration Points Summary
- Reads from: plan files, progress state, governance state, roadmap context
- Writes to: SUMMARY.md, progress.json, checkpoint files, governance state updates
- Git interaction: read current commit and diffs; no writes from execution workflow
- Tool usage: state write/history, todo tracking (optional)

**Section sources**
- [execute-phase.md](file://src/workflows/execute-phase.md#L697-L725)