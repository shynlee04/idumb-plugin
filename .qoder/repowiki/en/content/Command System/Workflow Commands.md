# Workflow Commands

<cite>
**Referenced Files in This Document**
- [research.md](file://src/commands/idumb/research.md)
- [roadmap.md](file://src/commands/idumb/roadmap.md)
- [plan-phase.md](file://src/commands/idumb/plan-phase.md)
- [execute-phase.md](file://src/commands/idumb/execute-phase.md)
- [validate.md](file://src/commands/idumb/validate.md)
- [research.md](file://src/workflows/research.md)
- [roadmap.md](file://src/workflows/roadmap.md)
- [plan-phase.md](file://src/workflows/plan-phase.md)
- [execute-phase.md](file://src/workflows/execute-phase.md)
- [verify-phase.md](file://src/workflows/verify-phase.md)
- [idumb-supreme-coordinator.md](file://src/agents/idumb-supreme-coordinator.md)
- [idumb-high-governance.md](file://src/agents/idumb-high-governance.md)
- [idumb-mid-coordinator.md](file://src/agents/idumb-mid-coordinator.md)
- [routing-rules.md](file://src/router/routing-rules.md)
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
This document provides comprehensive documentation for iDumb's workflow orchestration commands that drive the development lifecycle. It focuses on the research, roadmap, plan-phase, execute-phase, and validate commands, explaining command sequencing, dependency relationships, and state transitions. It also covers workflow initiation parameters, progress tracking, completion criteria, coordination between agent tiers, permission delegation, examples of typical execution patterns, troubleshooting, output formats, artifact generation, external tool integrations, customization, parallel execution, and scalability considerations.

## Project Structure
The workflow orchestration is implemented through a combination of command definitions and embedded workflows:
- Command-level orchestrators define CLI usage, flags, validation, delegation, and reporting.
- Workflow-level orchestrators define detailed execution flows, checkpoints, validation, and artifacts.
- Agent definitions specify roles, permissions, and delegation capabilities.
- Routing rules enforce state-based command availability and auto-corrections.

```mermaid
graph TB
subgraph "CLI Commands"
CMD_RESEARCH["/idumb:research"]
CMD_ROADMAP["/idumb:roadmap"]
CMD_PLAN["/idumb:plan-phase"]
CMD_EXECUTE["/idumb:execute-phase"]
CMD_VALIDATE["/idumb:validate"]
end
subgraph "Embedded Workflows"
WF_RESEARCH["research workflow"]
WF_ROADMAP["roadmap workflow"]
WF_PLAN["plan-phase workflow"]
WF_EXECUTE["execute-phase workflow"]
WF_VERIFY["verify-phase workflow"]
end
subgraph "Agents"
SUPREME["@idumb-supreme-coordinator"]
HIGH_GOV["@idumb-high-governance"]
MID_COORD["@idumb-mid-coordinator"]
end
CMD_RESEARCH --> WF_RESEARCH
CMD_ROADMAP --> WF_ROADMAP
CMD_PLAN --> WF_PLAN
CMD_EXECUTE --> WF_EXECUTE
CMD_VALIDATE --> WF_RESEARCH
CMD_VALIDATE --> WF_ROADMAP
CMD_VALIDATE --> WF_PLAN
CMD_VALIDATE --> WF_EXECUTE
SUPREME --> HIGH_GOV
SUPREME --> MID_COORD
HIGH_GOV --> WF_RESEARCH
HIGH_GOV --> WF_ROADMAP
HIGH_GOV --> WF_VALIDATE
MID_COORD --> WF_PLAN
MID_COORD --> WF_EXECUTE
```

**Diagram sources**
- [research.md](file://src/commands/idumb/research.md#L1-L469)
- [roadmap.md](file://src/commands/idumb/roadmap.md#L1-L449)
- [plan-phase.md](file://src/commands/idumb/plan-phase.md#L1-L589)
- [execute-phase.md](file://src/commands/idumb/execute-phase.md#L1-L547)
- [validate.md](file://src/commands/idumb/validate.md#L1-L518)
- [research.md](file://src/workflows/research.md#L1-L746)
- [roadmap.md](file://src/workflows/roadmap.md#L1-L800)
- [plan-phase.md](file://src/workflows/plan-phase.md#L1-L800)
- [execute-phase.md](file://src/workflows/execute-phase.md#L1-L729)
- [verify-phase.md](file://src/workflows/verify-phase.md#L1-L800)
- [idumb-supreme-coordinator.md](file://src/agents/idumb-supreme-coordinator.md#L1-L710)
- [idumb-high-governance.md](file://src/agents/idumb-high-governance.md#L1-L717)
- [idumb-mid-coordinator.md](file://src/agents/idumb-mid-coordinator.md#L1-L800)

**Section sources**
- [research.md](file://src/commands/idumb/research.md#L1-L469)
- [roadmap.md](file://src/commands/idumb/roadmap.md#L1-L449)
- [plan-phase.md](file://src/commands/idumb/plan-phase.md#L1-L589)
- [execute-phase.md](file://src/commands/idumb/execute-phase.md#L1-L547)
- [validate.md](file://src/commands/idumb/validate.md#L1-L518)
- [research.md](file://src/workflows/research.md#L1-L746)
- [roadmap.md](file://src/workflows/roadmap.md#L1-L800)
- [plan-phase.md](file://src/workflows/plan-phase.md#L1-L800)
- [execute-phase.md](file://src/workflows/execute-phase.md#L1-L729)
- [verify-phase.md](file://src/workflows/verify-phase.md#L1-L800)
- [idumb-supreme-coordinator.md](file://src/agents/idumb-supreme-coordinator.md#L1-L710)
- [idumb-high-governance.md](file://src/agents/idumb-high-governance.md#L1-L717)
- [idumb-mid-coordinator.md](file://src/agents/idumb-mid-coordinator.md#L1-L800)
- [routing-rules.md](file://src/router/routing-rules.md#L1-L186)

## Core Components
This section outlines the five core workflow commands and their primary responsibilities:
- Research: Multi-domain and phase-specific investigation with synthesis and validation.
- Roadmap: Goal-backward planning with phases, milestones, dependencies, and timelines.
- Plan-phase: Transform roadmap objectives into validated execution plans with tasks, dependencies, and acceptance criteria.
- Execute-phase: Parallel wave-based execution with checkpoints, validation, and deviation handling.
- Validate: Governance-level validation of structure, schema, freshness, alignment, and integrity.

Key characteristics:
- Each command defines usage, flags, validation, delegation, and completion reporting.
- Workflows embed detailed execution logic, checkpoints, and artifact generation.
- Agents enforce permission delegation and orchestrate specialized subagents.
- Routing rules govern command availability based on governance state.

**Section sources**
- [research.md](file://src/commands/idumb/research.md#L1-L469)
- [roadmap.md](file://src/commands/idumb/roadmap.md#L1-L449)
- [plan-phase.md](file://src/commands/idumb/plan-phase.md#L1-L589)
- [execute-phase.md](file://src/commands/idumb/execute-phase.md#L1-L547)
- [validate.md](file://src/commands/idumb/validate.md#L1-L518)
- [idumb-supreme-coordinator.md](file://src/agents/idumb-supreme-coordinator.md#L1-L710)

## Architecture Overview
The orchestration architecture centers on the Supreme Coordinator, which routes requests to specialized agents and workflows. The routing rules enforce state-based command availability and auto-corrections.

```mermaid
sequenceDiagram
participant User as "User"
participant Router as "Routing Rules"
participant Supreme as "@idumb-supreme-coordinator"
participant HighGov as "@idumb-high-governance"
participant MidCoord as "@idumb-mid-coordinator"
User->>Router : Issue command
Router-->>User : Allow/block/auto-redirect
Router->>Supreme : Route command
Supreme->>Supreme : Analyze request and state
alt Meta work
Supreme->>HighGov : Delegate meta-level work
HighGov-->>Supreme : Governance report
else Project work
Supreme->>MidCoord : Delegate project-level work
MidCoord-->>Supreme : Coordination report
end
Supreme-->>User : Structured governance report
```

**Diagram sources**
- [routing-rules.md](file://src/router/routing-rules.md#L14-L118)
- [idumb-supreme-coordinator.md](file://src/agents/idumb-supreme-coordinator.md#L199-L467)
- [idumb-high-governance.md](file://src/agents/idumb-high-governance.md#L208-L437)
- [idumb-mid-coordinator.md](file://src/agents/idumb-mid-coordinator.md#L247-L498)

**Section sources**
- [routing-rules.md](file://src/router/routing-rules.md#L1-L186)
- [idumb-supreme-coordinator.md](file://src/agents/idumb-supreme-coordinator.md#L1-L710)
- [idumb-high-governance.md](file://src/agents/idumb-high-governance.md#L1-L717)
- [idumb-mid-coordinator.md](file://src/agents/idumb-mid-coordinator.md#L1-L800)

## Detailed Component Analysis

### Research Command
The research command coordinates parallel research agents, synthesizes findings, validates outputs, and stores artifacts.

```mermaid
sequenceDiagram
participant User as "User"
participant Cmd as "research command"
participant Supreme as "@idumb-supreme-coordinator"
participant ProjRes as "@idumb-project-researcher"
participant PhaseRes as "@idumb-phase-researcher"
participant Synth as "@idumb-research-synthesizer"
participant LowVal as "@idumb-low-validator"
participant Builder as "@idumb-builder"
User->>Cmd : /idumb : research [topic] [flags]
Cmd->>Supreme : Validate governance state
Cmd->>Supreme : Parse request and strategy
alt Domain research
Supreme->>ProjRes : Research task (parallel if domains)
else Phase research
Supreme->>PhaseRes : Phase research task
end
ProjRes-->>Supreme : Research outputs
PhaseRes-->>Supreme : Phase research output
Supreme->>LowVal : Validate outputs
LowVal-->>Supreme : Validation result
alt Multiple domains
Supreme->>Synth : Synthesize outputs
Synth-->>Supreme : Unified research
end
Supreme->>Builder : Store research output
Builder-->>Supreme : Stored artifacts
Supreme-->>User : Research summary and next steps
```

Key aspects:
- Flags control domain focus, phase targeting, ecosystem inclusion, depth, sources, and output format.
- Validation ensures completeness, attribution, and actionable findings.
- Synthesis combines multiple domains into unified recommendations.
- Artifacts stored under project-output and planning directories.

**Diagram sources**
- [research.md](file://src/commands/idumb/research.md#L134-L305)
- [research.md](file://src/workflows/research.md#L64-L525)

**Section sources**
- [research.md](file://src/commands/idumb/research.md#L1-L469)
- [research.md](file://src/workflows/research.md#L1-L746)

### Roadmap Command
The roadmap command generates structured project roadmaps with phases, milestones, dependencies, and timelines.

```mermaid
sequenceDiagram
participant User as "User"
participant Cmd as "roadmap command"
participant Supreme as "@idumb-supreme-coordinator"
participant Roadmapper as "@idumb-roadmapper"
participant LowVal as "@idumb-low-validator"
participant Builder as "@idumb-builder"
User->>Cmd : /idumb : roadmap [flags]
Cmd->>Supreme : Validate prerequisites
Cmd->>Supreme : Load project context
Supreme->>Roadmapper : Create/update roadmap
Roadmapper-->>Supreme : Roadmap draft
Supreme->>LowVal : Validate roadmap
LowVal-->>Supreme : Validation result
Supreme->>Builder : Store roadmap and create phase dirs
Builder-->>Supreme : Stored artifacts
Supreme-->>User : Roadmap overview and next steps
```

Key aspects:
- Flags control creation mode, phases count, timeline inclusion, and risk analysis.
- Validation ensures logical flow, completeness, and feasibility.
- Artifacts include ROADMAP.md, backup copies, and phase scaffolding.

**Diagram sources**
- [roadmap.md](file://src/commands/idumb/roadmap.md#L88-L275)
- [roadmap.md](file://src/workflows/roadmap.md#L76-L633)

**Section sources**
- [roadmap.md](file://src/commands/idumb/roadmap.md#L1-L449)
- [roadmap.md](file://src/workflows/roadmap.md#L1-L800)

### Plan-Phase Command
The plan-phase command transforms roadmap phases into validated execution plans with tasks, dependencies, and acceptance criteria.

```mermaid
sequenceDiagram
participant User as "User"
participant Cmd as "plan-phase command"
participant Supreme as "@idumb-supreme-coordinator"
participant Planner as "@idumb-planner"
participant PlanChecker as "@idumb-plan-checker"
User->>Cmd : /idumb : plan-phase [phase] [flags]
Cmd->>Supreme : Resolve model profile and validate phase
Cmd->>Supreme : Check context and research
alt Research needed
Supreme->>Planner : Research task
Planner-->>Supreme : Research output
end
Supreme->>Planner : Create detailed execution plan
Planner-->>Supreme : PLAN.md
Supreme->>PlanChecker : Validate plan quality
PlanChecker-->>Supreme : Validation result
alt Validation fails
Supreme->>Planner : Revise plan with feedback
Planner-->>Supreme : Revised PLAN.md
Supreme->>PlanChecker : Re-validate
end
Supreme-->>User : Plan validated and next steps
```

Key aspects:
- Flags control research, gap closure, skipping verification, and model profiles.
- Validation includes structure, task quality, dependencies, risks, and context budget.
- Iterative verification loop with max retries and user overrides.

**Diagram sources**
- [plan-phase.md](file://src/commands/idumb/plan-phase.md#L70-L471)
- [plan-phase.md](file://src/workflows/plan-phase.md#L90-L388)

**Section sources**
- [plan-phase.md](file://src/commands/idumb/plan-phase.md#L1-L589)
- [plan-phase.md](file://src/workflows/plan-phase.md#L1-L800)

### Execute-Phase Command
The execute-phase command orchestrates wave-based parallel execution with checkpoints, validation, and deviation handling.

```mermaid
flowchart TD
Start(["Start execute-phase"]) --> ResolveModel["Resolve model profile"]
ResolveModel --> ValidatePhase["Validate phase exists"]
ValidatePhase --> DiscoverPlans["Discover plans and filter gaps-only"]
DiscoverPlans --> GroupWaves["Group by wave and validate dependencies"]
GroupWaves --> LoopWaves{"More waves?"}
LoopWaves --> |Yes| SpawnExecutors["Spawn parallel executors for wave"]
SpawnExecutors --> VerifySummaries["Verify SUMMARYs created"]
VerifySummaries --> LoopWaves
LoopWaves --> |No| AggregateResults["Aggregate results"]
AggregateResults --> CommitCorrections["Commit orchestrator corrections"]
CommitCorrections --> VerifyGoal["Verify phase goal"]
VerifyGoal --> UpdateState["Update roadmap and state"]
UpdateState --> TraceRequirements["Update requirements traceability"]
TraceRequirements --> CommitCompletion["Commit phase completion"]
CommitCompletion --> OfferNext["Offer next steps"]
OfferNext --> End(["End"])
```

Key aspects:
- Flags control mode, dry-run, resume, batch size, and timeouts.
- Wave-based parallel execution with per-task commits and checkpoint anchoring.
- Deviation handling for bugs, critical gaps, blockers, and architectural changes.
- Integration with verification and governance state updates.

**Diagram sources**
- [execute-phase.md](file://src/commands/idumb/execute-phase.md#L36-L254)
- [execute-phase.md](file://src/workflows/execute-phase.md#L77-L362)

**Section sources**
- [execute-phase.md](file://src/commands/idumb/execute-phase.md#L1-L547)
- [execute-phase.md](file://src/workflows/execute-phase.md#L1-L729)

### Validate Command
The validate command runs a complete governance validation suite across structure, schema, freshness, alignment, and integrity.

```mermaid
sequenceDiagram
participant User as "User"
participant Cmd as "validate command"
participant Supreme as "@idumb-supreme-coordinator"
participant HighGov as "@idumb-high-governance"
participant LowVal as "@idumb-low-validator"
participant Builder as "@idumb-builder"
User->>Cmd : /idumb : validate [scope] [--fix] [--report-only]
Cmd->>Supreme : Initialize validation
Supreme->>HighGov : Delegate governance validation
HighGov-->>Supreme : Validation results
Supreme->>LowVal : Structure, schema, freshness, alignment, integrity checks
LowVal-->>Supreme : Check results
alt --fix
Supreme->>LowVal : Apply fixes
LowVal-->>Supreme : Fixed artifacts
end
Supreme->>Builder : Create validation report
Builder-->>Supreme : Report file
Supreme-->>User : Validation report and recommendations
```

Key aspects:
- Scope controls which validations to run.
- Fixes can be auto-applied when requested.
- Reports are stored for traceability and governance.

**Diagram sources**
- [validate.md](file://src/commands/idumb/validate.md#L53-L328)
- [idumb-high-governance.md](file://src/agents/idumb-high-governance.md#L208-L437)

**Section sources**
- [validate.md](file://src/commands/idumb/validate.md#L1-L518)
- [idumb-high-governance.md](file://src/agents/idumb-high-governance.md#L1-L717)

## Dependency Analysis
This section maps command-level dependencies and state transitions enforced by routing rules.

```mermaid
graph TB
UNINIT["Uninitialized State"]
NOPROJ["No Project"]
NOROAD["No Roadmap"]
DISCUSS["Discuss Phase"]
PLANNING["Planning"]
EXECUTING["Executing"]
VERIFYING["Verifying"]
UNINIT --> INIT["/idumb:init"]
NOPROJ --> NEWPROJ["/idumb:new-project"]
NOROAD --> ROADMAP["/idumb:roadmap"]
DISCUSS --> PLAN["/idumb:plan-phase"]
PLANNING --> EXEC["/idumb:execute-phase"]
EXECUTING --> VERIFY["/idumb:verify-work"]
VERIFYING --> EXEC
ROUTER["Routing Rules"] --> UNINIT
ROUTER --> NOPROJ
ROUTER --> NOROAD
ROUTER --> DISCUSS
ROUTER --> PLANNING
ROUTER --> EXECUTING
ROUTER --> VERIFYING
```

**Diagram sources**
- [routing-rules.md](file://src/router/routing-rules.md#L14-L118)

**Section sources**
- [routing-rules.md](file://src/router/routing-rules.md#L1-L186)

## Performance Considerations
- Parallel execution: Research and plan-phase workflows support parallel delegations to speed up discovery and planning.
- Wave-based execution: Execute-phase groups tasks by wave to maximize throughput while respecting dependencies.
- Checkpoints: Frequent checkpoint creation enables efficient resumption and reduces rework.
- Validation batching: Validate command consolidates checks to minimize overhead.
- Model profiles: Commands resolve model profiles to balance quality and cost.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and resolutions:
- Governance not initialized: Run initialization before issuing workflow commands.
- Missing project or roadmap: Create project and roadmap before execution.
- Phase not found: Ensure phase exists in roadmap and state.
- Validation failures: Use validate command to diagnose and fix issues.
- Execution halts: Review checkpoints, deviate to debug, and resume.
- Plan validation failures: Iterate with feedback or escalate for manual intervention.

**Section sources**
- [routing-rules.md](file://src/router/routing-rules.md#L152-L175)
- [research.md](file://src/commands/idumb/research.md#L409-L419)
- [roadmap.md](file://src/commands/idumb/roadmap.md#L380-L390)
- [plan-phase.md](file://src/commands/idumb/plan-phase.md#L559-L568)
- [execute-phase.md](file://src/commands/idumb/execute-phase.md#L499-L547)
- [validate.md](file://src/commands/idumb/validate.md#L439-L485)

## Conclusion
iDumb's workflow orchestration commands provide a structured, governance-driven development lifecycle. The research, roadmap, plan-phase, execute-phase, and validate commands integrate command-level orchestration with embedded workflows, agent delegation, and state-based routing. This design ensures reproducibility, traceability, and scalability across diverse project contexts.