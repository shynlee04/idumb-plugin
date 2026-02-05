# Workflow Orchestration

<cite>
**Referenced Files in This Document**
- [research.md](file://src/workflows/research.md)
- [roadmap.md](file://src/workflows/roadmap.md)
- [plan-phase.md](file://src/workflows/plan-phase.md)
- [execute-phase.md](file://src/workflows/execute-phase.md)
- [verify-phase.md](file://src/workflows/verify-phase.md)
- [idumb-orchestrator.ts](file://src/tools/idumb-orchestrator.ts)
- [idumb-core.ts](file://src/plugins/idumb-core.ts)
- [routing-rules.md](file://src/router/routing-rules.md)
- [SESSION-STATES-GOVERNANCE.md](file://src/router/SESSION-STATES-GOVERNANCE.md)
- [init.md](file://src/commands/idumb/init.md)
- [roadmap.md](file://src/commands/idumb/roadmap.md)
- [plan-phase.md](file://src/commands/idumb/plan-phase.md)
- [execute-phase.md](file://src/commands/idumb/execute-phase.md)
- [verify-work.md](file://src/commands/idumb/verify-work.md)
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
This document explains the workflow orchestration system that coordinates multi-agent processes across the development lifecycle. It covers how workflows initialize the environment, gather and synthesize research, create roadmaps, plan phases, execute tasks, and verify outcomes. It also details the execution engine, agent delegation and coordination, completion criteria, termination conditions, validation processes, and recovery/error handling mechanisms.

## Project Structure
The orchestration system is implemented as a set of declarative workflows and supporting tools:
- Workflows define the lifecycle stages and validation rules
- Commands expose user-facing entry points
- Tools implement governance, validation, and orchestration
- Plugins enforce session state, permissions, and routing rules

```mermaid
graph TB
subgraph "User Interface"
CLI["CLI Commands"]
end
subgraph "Workflow Layer"
WF_INIT["Initialization Workflow"]
WF_RESEARCH["Research Workflow"]
WF_ROADMAP["Roadmap Workflow"]
WF_PLAN["Plan Phase Workflow"]
WF_EXECUTE["Execute Phase Workflow"]
WF_VERIFY["Verify Phase Workflow"]
end
subgraph "Agent Layer"
AG_COORD["Coordinator Agents"]
AG_SPECIALISTS["Specialist Agents"]
end
subgraph "Governance & Tools"
CORE_PLUGIN["Core Plugin"]
ORCHESTRATOR["Orchestrator Tool"]
ROUTER["Routing Rules"]
end
CLI --> WF_INIT
CLI --> WF_RESEARCH
CLI --> WF_ROADMAP
CLI --> WF_PLAN
CLI --> WF_EXECUTE
CLI --> WF_VERIFY
WF_INIT --> CORE_PLUGIN
WF_RESEARCH --> AG_COORD
WF_ROADMAP --> AG_COORD
WF_PLAN --> AG_COORD
WF_EXECUTE --> AG_COORD
WF_VERIFY --> AG_COORD
AG_COORD --> ORCHESTRATOR
CORE_PLUGIN --> ROUTER
```

**Diagram sources**
- [idumb-core.ts](file://src/plugins/idumb-core.ts#L130-L341)
- [routing-rules.md](file://src/router/routing-rules.md#L14-L118)
- [idumb-orchestrator.ts](file://src/tools/idumb-orchestrator.ts#L257-L343)

**Section sources**
- [idumb-core.ts](file://src/plugins/idumb-core.ts#L130-L341)
- [routing-rules.md](file://src/router/routing-rules.md#L14-L118)

## Core Components
- Workflows: Declarative, stateful processes that define phases, validation, and agent delegation
- Commands: User-facing wrappers around workflows with argument parsing and gating
- Tools: Governance, validation, and orchestration utilities
- Plugins: Session state tracking, permission enforcement, and routing

Key orchestration capabilities:
- Multi-agent delegation with spawn protocols
- Stateful checkpoints and recovery
- Validation loops with retry policies
- Governance-aware routing and permissions

**Section sources**
- [idumb-orchestrator.ts](file://src/tools/idumb-orchestrator.ts#L257-L343)
- [idumb-core.ts](file://src/plugins/idumb-core.ts#L130-L341)

## Architecture Overview
The system separates concerns across layers:
- Command layer: user entry points with validation and routing
- Workflow layer: lifecycle stages with agent delegation and validation
- Agent layer: specialized agents for research, planning, execution, and verification
- Governance layer: state, permissions, and routing enforced by plugins and tools

```mermaid
sequenceDiagram
participant User as "User"
participant Cmd as "Command Handler"
participant WF as "Workflow Engine"
participant Agent as "Specialist Agent"
participant State as "Governance State"
User->>Cmd : Invoke command (e.g., /idumb : plan-phase)
Cmd->>WF : Validate prerequisites and route
WF->>Agent : Spawn agent with context
Agent->>Agent : Execute specialized task
Agent->>WF : Report results and checkpoints
WF->>State : Update governance state
WF-->>Cmd : Chain to next step or completion
Cmd-->>User : Present next steps and artifacts
```

**Diagram sources**
- [plan-phase.md](file://src/workflows/plan-phase.md#L194-L242)
- [execute-phase.md](file://src/workflows/execute-phase.md#L192-L236)
- [verify-phase.md](file://src/workflows/verify-phase.md#L193-L250)

## Detailed Component Analysis

### Initialization Workflow
Responsibilities:
- Create governance structure and state
- Detect project type and integrate with existing frameworks
- Establish anchors and history entries
- Guide users to next steps based on project context

Key behaviors:
- Validates prerequisites and handles reinitialization
- Creates directory scaffolding and configuration
- Performs integrity checks and records history
- Provides project-type-specific guidance

```mermaid
flowchart TD
Start(["Init Command"]) --> CheckExisting["Check Existing Setup"]
CheckExisting --> |Already Init| ForceFlag{"Force Flag?"}
ForceFlag --> |No| Halt["Halt with guidance"]
ForceFlag --> |Yes| Archive["Archive Existing State"]
CheckExisting --> |Not Init| Detect["Detect Project Context"]
Detect --> CreateDirs["Create iDumb Structure"]
CreateDirs --> Validate["Validate Structure"]
Validate --> |Fail| Retry["Retry or escalate"]
Validate --> |Pass| Anchor["Create Anchor"]
Anchor --> History["Record History"]
History --> Integrity["Final Integrity Check"]
Integrity --> |Fail| Retry
Integrity --> |Pass| ProjectType["Detect Project Type"]
ProjectType --> NextSteps["Present Next Steps"]
Retry --> Halt
```

**Diagram sources**
- [init.md](file://src/commands/idumb/init.md#L88-L460)

**Section sources**
- [init.md](file://src/commands/idumb/init.md#L88-L460)

### Research Workflow
Responsibilities:
- Systematic research gathering across codebase and external sources
- Risk assessment and synthesis
- Output creation for downstream planning

Key behaviors:
- Entry validation for topic, MCP tools, and context availability
- Multi-source research with agent protocols
- Synthesis with conflict resolution
- Risk documentation and quality assurance

```mermaid
flowchart TD
Start(["Research Command"]) --> Entry["Entry Validation"]
Entry --> Scope["Define Research Scope"]
Scope --> Codebase["Codebase Analysis"]
Codebase --> External["External Research"]
External --> Synthesize["Synthesize Findings"]
Synthesize --> Risk["Risk Assessment"]
Risk --> Output["Create Research Output"]
Output --> State["Update Governance State"]
State --> End(["Research Complete"])
```

**Diagram sources**
- [research.md](file://src/workflows/research.md#L64-L525)

**Section sources**
- [research.md](file://src/workflows/research.md#L64-L525)

### Roadmap Workflow
Responsibilities:
- Create comprehensive project roadmaps with phases, dependencies, and timelines
- Validate roadmap coherence and achievability
- Prepare phase directories and governance state

Key behaviors:
- Goal-backward decomposition and dependency mapping
- Timeline estimation with uncertainty
- Validation against constraints and integration points
- Quality gates and critical path identification

```mermaid
flowchart TD
Start(["Roadmap Command"]) --> Load["Load Project Context"]
Load --> Define["Define Phases (Goal-Backward)"]
Define --> Dependencies["Map Dependencies"]
Dependencies --> Timeline["Estimate Timeline"]
Timeline --> Validate["Validate Roadmap"]
Validate --> Output["Create ROADMAP.md"]
Output --> State["Update Governance State"]
State --> End(["Roadmap Ready"])
```

**Diagram sources**
- [roadmap.md](file://src/workflows/roadmap.md#L76-L633)

**Section sources**
- [roadmap.md](file://src/workflows/roadmap.md#L76-L633)

### Plan Phase Workflow
Responsibilities:
- Transform roadmap phases into executable plans
- Conditional research and validation loops
- Quality gates and retry policies

Key behaviors:
- Context assembly from roadmap, research, and requirements
- Research agent spawning when needed
- Planner agent creation with structured output
- Plan checker validation with iterative refinement
- State updates and checkpoint creation

```mermaid
sequenceDiagram
participant User as "User"
participant WF as "Plan Phase Workflow"
participant Researcher as "Phase Researcher"
participant Planner as "Planner"
participant Checker as "Plan Checker"
participant State as "Governance State"
User->>WF : Request plan for phase
WF->>WF : Assemble context
WF->>Researcher : Spawn if needed
Researcher-->>WF : Research output
WF->>Planner : Spawn with context
Planner-->>WF : PLAN.md
WF->>Checker : Validate plan
alt Validation fails
Checker-->>WF : Issues
WF->>Planner : Revise with feedback
Planner-->>WF : Updated PLAN.md
WF->>Checker : Re-validate
else Validation passes
Checker-->>WF : PASS
end
WF->>State : Update governance state
WF-->>User : Present results and next steps
```

**Diagram sources**
- [plan-phase.md](file://src/workflows/plan-phase.md#L194-L353)

**Section sources**
- [plan-phase.md](file://src/workflows/plan-phase.md#L90-L388)

### Execute Phase Workflow
Responsibilities:
- Execute phase plans with wave-based parallelism
- Validation checkpoints and deviation handling
- Recovery and rollback mechanisms

Key behaviors:
- Task discovery and dependency resolution
- Wave-based execution with parallel subagents
- Checkpoint creation after each task
- Retry loops with escalation thresholds
- Deviation logging and user notification

```mermaid
flowchart TD
Start(["Execute Phase Command"]) --> Discover["Discover Plans"]
Discover --> Group["Group by Waves"]
Group --> WaveLoop{"For each wave"}
WaveLoop --> Spawn["Spawn Parallel Executors"]
Spawn --> Verify["Collect and Verify Results"]
Verify --> NextWave{"More waves?"}
NextWave --> |Yes| WaveLoop
NextWave --> |No| Summary["Generate Summary"]
Summary --> State["Update Governance State"]
State --> End(["Execution Complete"])
```

**Diagram sources**
- [execute-phase.md](file://src/workflows/execute-phase.md#L165-L276)

**Section sources**
- [execute-phase.md](file://src/workflows/execute-phase.md#L77-L362)

### Verify Phase Workflow
Responsibilities:
- Goal-backward verification of phase completion
- Multi-level verification (existence, substantive, wired, functional)
- Gap diagnosis and fix plan generation

Key behaviors:
- Extract success criteria from plans and context
- Gather execution evidence from summaries and checkpoints
- Spawn validators with structured protocols
- Optional skeptic review for critical phases
- Generate comprehensive verification reports

```mermaid
flowchart TD
Start(["Verify Phase Command"]) --> Criteria["Extract Success Criteria"]
Criteria --> Evidence["Gather Execution Evidence"]
Evidence --> Validate["Spawn Validators (4 Levels)"]
Validate --> Results["Collect Validation Results"]
Results --> Decision{"Gaps Found?"}
Decision --> |No| Report["Create VERIFICATION.md"]
Decision --> |Yes| Fix["Spawn Planner --gaps"]
Fix --> Report
Report --> State["Update Governance State"]
State --> End(["Verification Complete"])
```

**Diagram sources**
- [verify-phase.md](file://src/workflows/verify-phase.md#L94-L480)

**Section sources**
- [verify-phase.md](file://src/workflows/verify-phase.md#L94-L480)

## Dependency Analysis
The orchestration system relies on several interdependent components:

```mermaid
graph TB
subgraph "State Management"
STATE[".idumb/brain/state.json"]
HISTORY[".idumb/brain/history/"]
SESSIONS[".idumb/brain/sessions/"]
end
subgraph "Workflow Artifacts"
RESEARCH[".planning/research/"]
ROADMAP[".planning/ROADMAP.md"]
PHASES[".planning/phases/"]
end
subgraph "Execution Artifacts"
EXEC[".idumb/brain/execution/"]
OUTPUT[".idumb/project-output/"]
end
subgraph "Governance"
CONFIG[".idumb/brain/config.json"]
ROUTER["Routing Rules"]
PLUGIN["Core Plugin"]
end
STATE --> PLUGIN
CONFIG --> PLUGIN
PLUGIN --> ROUTER
PLUGIN --> EXEC
EXEC --> STATE
PHASES --> STATE
ROADMAP --> STATE
RESEARCH --> STATE
OUTPUT --> STATE
```

**Diagram sources**
- [idumb-core.ts](file://src/plugins/idumb-core.ts#L130-L341)
- [routing-rules.md](file://src/router/routing-rules.md#L14-L118)

**Section sources**
- [idumb-core.ts](file://src/plugins/idumb-core.ts#L130-L341)
- [routing-rules.md](file://src/router/routing-rules.md#L14-L118)

## Performance Considerations
- Context budget awareness: workflows constrain agent context to maintain performance
- Parallel execution: wave-based parallelism reduces total execution time
- Checkpoint granularity: frequent checkpoints minimize recovery time
- Validation loops: controlled retries prevent infinite loops while ensuring quality
- State persistence: minimal state footprint enables efficient resume operations

## Troubleshooting Guide
Common issues and resolutions:

### Initialization Failures
- **Symptom**: Initialization fails integrity checks
- **Cause**: Missing directories or invalid JSON
- **Resolution**: Check permissions, retry with force flag, review failed checks

### Research Limitations
- **Symptom**: Research incomplete or inconclusive
- **Cause**: Missing MCP tools or time-box exceeded
- **Resolution**: Install required tools, increase time budget, continue with partial results

### Planning Validation Failures
- **Symptom**: Plan fails checker validation
- **Cause**: Circular dependencies, unrealistic estimates, or missing acceptance criteria
- **Resolution**: Address checker feedback, iterate up to 3 times, then escalate

### Execution Failures
- **Symptom**: Task execution fails or stalls
- **Cause**: Context exhaustion, resource constraints, or agent timeouts
- **Resolution**: Review checkpoint logs, adjust task estimates, or escalate to debug

### Verification Gaps
- **Symptom**: Verification reports gaps or requires human review
- **Cause**: Stub implementations, missing wiring, or incomplete functional tests
- **Resolution**: Generate fix plans, execute gaps-only, or perform manual verification

**Section sources**
- [init.md](file://src/commands/idumb/init.md#L606-L617)
- [research.md](file://src/workflows/research.md#L674-L679)
- [plan-phase.md](file://src/workflows/plan-phase.md#L329-L353)
- [execute-phase.md](file://src/workflows/execute-phase.md#L471-L505)
- [verify-phase.md](file://src/workflows/verify-phase.md#L663-L739)

## Conclusion
The workflow orchestration system provides a robust, governance-aware framework for coordinating multi-agent processes across the development lifecycle. Through structured phases, validation loops, and recovery mechanisms, it ensures quality, compliance, and traceability from research through execution and verification. The system balances automation with human oversight, enabling scalable and reliable software development workflows.