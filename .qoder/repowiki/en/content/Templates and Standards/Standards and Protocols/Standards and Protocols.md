# Standards and Protocols

<cite>
**Referenced Files in This Document**
- [verification-patterns.md](file://src/references/verification-patterns.md)
- [model-profiles.md](file://src/references/model-profiles.md)
- [tdd.md](file://src/references/tdd.md)
- [ui-brand.md](file://src/references/ui-brand.md)
- [VALIDATION-CHECKLIST-2026-02-02.md](file://docs/VALIDATION-CHECKLIST-2026-02-02.md)
- [validation-patterns.md](file://src/skills/idumb-meta-builder/references/validation-patterns.md)
- [integration-checklist.md](file://src/skills/idumb-meta-builder/references/integration-checklist.md)
- [module-schema.md](file://src/skills/idumb-meta-builder/references/module-schema.md)
- [idumb-validation/SKILL.md](file://src/skills/idumb-validation/SKILL.md)
- [idumb-stress-test/SKILL.md](file://src/skills/idumb-stress-test/SKILL.md)
- [idumb-project-validation/SKILL.md](file://src/skills/idumb-project-validation/SKILL.md)
- [idumb-code-quality/SKILL.md](file://src/skills/idumb-code-quality/SKILL.md)
- [idumb-performance/SKILL.md](file://src/skills/idumb-performance/SKILL.md)
- [idumb-security/SKILL.md](file://src/skills/idumb-security/SKILL.md)
- [continuous-validation.md](file://src/workflows/continuous-validation.md)
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
This document defines iDumb’s quality assurance frameworks and development standards. It covers verification patterns for agent validation, completion criteria, acceptance testing, model profiles for agent selection and performance optimization, Test-Driven Development (TDD) practices, integration testing protocols, UI branding and consistency standards, quality assurance checklists, validation matrices, compliance frameworks, documentation quality standards, code review processes, continuous improvement protocols, and integration standards with external frameworks and APIs. Practical examples of standard implementation, measurement, and auditing procedures are included.

## Project Structure
iDumb organizes QA and governance across:
- References: Core standards and patterns (verification, model profiles, TDD, UI brand)
- Skills: Specialized validation packages (validation, stress-test, project-validation, code-quality, performance, security)
- Workflows: Operational flows (continuous validation)
- Docs: Installation and governance validation checklists

```mermaid
graph TB
subgraph "References"
VP["verification-patterns.md"]
MP["model-profiles.md"]
TDD["tdd.md"]
UIB["ui-brand.md"]
end
subgraph "Skills"
VAL["idumb-validation/SKILL.md"]
ST["idumb-stress-test/SKILL.md"]
PV["idumb-project-validation/SKILL.md"]
QC["idumb-code-quality/SKILL.md"]
PERF["idumb-performance/SKILL.md"]
SEC["idumb-security/SKILL.md"]
VREF["validation-patterns.md (meta-builder)"]
ICHK["integration-checklist.md (meta-builder)"]
MSCH["module-schema.md (meta-builder)"]
end
subgraph "Workflows"
CV["continuous-validation.md"]
end
subgraph "Docs"
INST["VALIDATION-CHECKLIST-2026-02-02.md"]
end
VP --> VAL
MP --> VAL
TDD --> VAL
UIB --> VAL
VREF --> VAL
ICHK --> VAL
MSCH --> VAL
ST --> VAL
PV --> VAL
QC --> VAL
PERF --> VAL
SEC --> VAL
CV --> VAL
INST --> VAL
```

**Diagram sources**
- [verification-patterns.md](file://src/references/verification-patterns.md#L1-L601)
- [model-profiles.md](file://src/references/model-profiles.md#L1-L178)
- [tdd.md](file://src/references/tdd.md#L1-L282)
- [ui-brand.md](file://src/references/ui-brand.md#L1-L300)
- [idumb-validation/SKILL.md](file://src/skills/idumb-validation/SKILL.md#L1-L720)
- [idumb-stress-test/SKILL.md](file://src/skills/idumb-stress-test/SKILL.md#L1-L704)
- [idumb-project-validation/SKILL.md](file://src/skills/idumb-project-validation/SKILL.md#L1-L688)
- [idumb-code-quality/SKILL.md](file://src/skills/idumb-code-quality/SKILL.md#L1-L480)
- [idumb-performance/SKILL.md](file://src/skills/idumb-performance/SKILL.md#L1-L478)
- [idumb-security/SKILL.md](file://src/skills/idumb-security/SKILL.md#L1-L337)
- [validation-patterns.md](file://src/skills/idumb-meta-builder/references/validation-patterns.md#L1-L389)
- [integration-checklist.md](file://src/skills/idumb-meta-builder/references/integration-checklist.md#L1-L315)
- [module-schema.md](file://src/skills/idumb-meta-builder/references/module-schema.md#L1-L377)
- [continuous-validation.md](file://src/workflows/continuous-validation.md#L1-L420)
- [VALIDATION-CHECKLIST-2026-02-02.md](file://docs/VALIDATION-CHECKLIST-2026-02-02.md#L1-L162)

**Section sources**
- [verification-patterns.md](file://src/references/verification-patterns.md#L1-L601)
- [model-profiles.md](file://src/references/model-profiles.md#L1-L178)
- [tdd.md](file://src/references/tdd.md#L1-L282)
- [ui-brand.md](file://src/references/ui-brand.md#L1-L300)
- [idumb-validation/SKILL.md](file://src/skills/idumb-validation/SKILL.md#L1-L720)
- [idumb-stress-test/SKILL.md](file://src/skills/idumb-stress-test/SKILL.md#L1-L704)
- [idumb-project-validation/SKILL.md](file://src/skills/idumb-project-validation/SKILL.md#L1-L688)
- [idumb-code-quality/SKILL.md](file://src/skills/idumb-code-quality/SKILL.md#L1-L480)
- [idumb-performance/SKILL.md](file://src/skills/idumb-performance/SKILL.md#L1-L478)
- [idumb-security/SKILL.md](file://src/skills/idumb-security/SKILL.md#L1-L337)
- [validation-patterns.md](file://src/skills/idumb-meta-builder/references/validation-patterns.md#L1-L389)
- [integration-checklist.md](file://src/skills/idumb-meta-builder/references/integration-checklist.md#L1-L315)
- [module-schema.md](file://src/skills/idumb-meta-builder/references/module-schema.md#L1-L377)
- [continuous-validation.md](file://src/workflows/continuous-validation.md#L1-L420)
- [VALIDATION-CHECKLIST-2026-02-02.md](file://docs/VALIDATION-CHECKLIST-2026-02-02.md#L1-L162)

## Core Components
- Verification Patterns: Multi-level verification (existence, substantive, wiring, functional) with automated and human verification tiers.
- Model Profiles: Agent-to-model mapping and tiered profiles balancing quality vs speed/cost with override rules and thinking-mode guidance.
- TDD Reference: Red-Green-Refactor cycle, candidate identification, plan structure, and error handling.
- UI Branding: Stage banners, checkpoint boxes, status symbols, progress displays, delegation and error displays, color guidelines.
- Validation Layers: Schema, integration, completeness, and governance validation with meta-builder references.
- Integration Checklist: Agent, tool, and command binding rules, file I/O validation, and integration testing.
- Module Schema: YAML frontmatter, workflow steps, checkpoints, integration points, validation criteria, error handling, and versioning.
- Validation Skill: Three-layer validation (structure, integration, behavior), gap detection, stall detection, and self-healing.
- Stress Test Skill: Micro/batch/full validation modes, agent coordination tests, integration matrix tests, regression sweeps, conflict detection, and self-healing.
- Project Validation Skill: Greenfield/brownfield detection, pre-flight, continuous validation, health checks, and OpenCode compatibility.
- Code Quality Skill: Error handling, cross-platform compatibility, documentation standards, error message formats, and code duplication.
- Performance Skill: Efficient file scanning, memory leak prevention, iteration limits, batch operations, and resource monitoring.
- Security Skill: Bash injection prevention, path traversal, permission bypass, race condition prevention, and secure atomic writes.
- Continuous Validation Workflow: Trigger detection, coordinator-driven mode selection, micro/batch validation, state updates, and result handling.

**Section sources**
- [verification-patterns.md](file://src/references/verification-patterns.md#L1-L601)
- [model-profiles.md](file://src/references/model-profiles.md#L1-L178)
- [tdd.md](file://src/references/tdd.md#L1-L282)
- [ui-brand.md](file://src/references/ui-brand.md#L1-L300)
- [validation-patterns.md](file://src/skills/idumb-meta-builder/references/validation-patterns.md#L1-L389)
- [integration-checklist.md](file://src/skills/idumb-meta-builder/references/integration-checklist.md#L1-L315)
- [module-schema.md](file://src/skills/idumb-meta-builder/references/module-schema.md#L1-L377)
- [idumb-validation/SKILL.md](file://src/skills/idumb-validation/SKILL.md#L1-L720)
- [idumb-stress-test/SKILL.md](file://src/skills/idumb-stress-test/SKILL.md#L1-L704)
- [idumb-project-validation/SKILL.md](file://src/skills/idumb-project-validation/SKILL.md#L1-L688)
- [idumb-code-quality/SKILL.md](file://src/skills/idumb-code-quality/SKILL.md#L1-L480)
- [idumb-performance/SKILL.md](file://src/skills/idumb-performance/SKILL.md#L1-L478)
- [idumb-security/SKILL.md](file://src/skills/idumb-security/SKILL.md#L1-L337)
- [continuous-validation.md](file://src/workflows/continuous-validation.md#L1-L420)

## Architecture Overview
The QA architecture integrates layered validation, governance, and operational workflows:

```mermaid
graph TB
subgraph "Governance & Control"
CV["continuous-validation.md"]
COORD["Coordinator Decisions"]
end
subgraph "Validation Layers"
L1["Schema Validation"]
L2["Integration Validation"]
L3["Completeness Validation"]
L4["Governance Validation"]
end
subgraph "Validation Packages"
VALPKG["idumb-validation"]
STRESS["idumb-stress-test"]
PROJ["idumb-project-validation"]
QUAL["idumb-code-quality"]
PERF["idumb-performance"]
SEC["idumb-security"]
end
subgraph "Standards & References"
VPAT["verification-patterns.md"]
MPFL["model-profiles.md"]
TDDF["tdd.md"]
UIBR["ui-brand.md"]
MODSC["module-schema.md"]
INTCL["integration-checklist.md"]
end
CV --> COORD
COORD --> VALPKG
VALPKG --> L1
VALPKG --> L2
VALPKG --> L3
VALPKG --> L4
VALPKG --> VPAT
VALPKG --> MODSC
VALPKG --> INTCL
VALPKG --> STRESS
VALPKG --> PROJ
VALPKG --> QUAL
VALPKG --> PERF
VALPKG --> SEC
STRESS --> MPFL
PROJ --> MPFL
QUAL --> MPFL
PERF --> MPFL
SEC --> MPFL
TDDF --> VALPKG
UIBR --> VALPKG
```

**Diagram sources**
- [continuous-validation.md](file://src/workflows/continuous-validation.md#L1-L420)
- [idumb-validation/SKILL.md](file://src/skills/idumb-validation/SKILL.md#L1-L720)
- [idumb-stress-test/SKILL.md](file://src/skills/idumb-stress-test/SKILL.md#L1-L704)
- [idumb-project-validation/SKILL.md](file://src/skills/idumb-project-validation/SKILL.md#L1-L688)
- [idumb-code-quality/SKILL.md](file://src/skills/idumb-code-quality/SKILL.md#L1-L480)
- [idumb-performance/SKILL.md](file://src/skills/idumb-performance/SKILL.md#L1-L478)
- [idumb-security/SKILL.md](file://src/skills/idumb-security/SKILL.md#L1-L337)
- [verification-patterns.md](file://src/references/verification-patterns.md#L1-L601)
- [model-profiles.md](file://src/references/model-profiles.md#L1-L178)
- [tdd.md](file://src/references/tdd.md#L1-L282)
- [ui-brand.md](file://src/references/ui-brand.md#L1-L300)
- [module-schema.md](file://src/skills/idumb-meta-builder/references/module-schema.md#L1-L377)
- [integration-checklist.md](file://src/skills/idumb-meta-builder/references/integration-checklist.md#L1-L315)

## Detailed Component Analysis

### Verification Patterns and Agent Validation
- Multi-level verification: existence, substantive, wiring, functional.
- Stub detection patterns for React components, API routes, database schemas, TypeScript tools, and agent profiles.
- Wiring verification: component-to-API, API-to-database, agent-to-tool, command-to-agent.
- Automated verification script and human verification triggers.
- Verification report format and quick checklist.

```mermaid
flowchart TD
Start(["Artifact Under Test"]) --> Exists["Exists Check"]
Exists --> Subst["Substantive Check"]
Subst --> Wired["Wiring Check"]
Wired --> Func["Functional Check"]
Func --> Human{"Needs Human Verification?"}
Human --> |Yes| HumanTest["Human Verification Required"]
Human --> |No| Pass["Pass"]
HumanTest --> Pass
```

**Diagram sources**
- [verification-patterns.md](file://src/references/verification-patterns.md#L1-L601)

**Section sources**
- [verification-patterns.md](file://src/references/verification-patterns.md#L1-L601)

### Model Profiles and Agent Selection
- Tiered profiles: quality (best), balanced (good), budget (fast/cheap).
- Agent-to-profile mapping and rationale.
- Profile definitions with model, temperature, tokens, thinking mode.
- Override rules for complexity upgrades/downgrades.
- Thinking mode guidelines and cost optimization.

```mermaid
classDiagram
class Profile {
+string profile
+string model
+number temperature
+number max_tokens
+boolean thinking
+use_for array
}
class AgentMapping {
+string agent
+string profile
+string rationale
}
Profile <.. AgentMapping : "assigned to"
```

**Diagram sources**
- [model-profiles.md](file://src/references/model-profiles.md#L1-L178)

**Section sources**
- [model-profiles.md](file://src/references/model-profiles.md#L1-L178)

### Test-Driven Development (TDD) Practices
- When to use TDD vs standard plans.
- TDD plan structure with objective, context, feature, verification, success criteria.
- Red-Green-Refactor cycle with agent roles.
- Test quality guidelines and framework setup.
- Error handling and escalation to debugger.
- Commit patterns and context budget.

```mermaid
sequenceDiagram
participant Exec as "idumb-executor"
participant Builder as "idumb-builder"
participant LowVal as "idumb-low-validator"
Exec->>Builder : RED - Write failing test
Builder-->>Exec : Test file committed
Exec->>LowVal : Expect fail
LowVal-->>Exec : Fail
Exec->>Builder : GREEN - Implement to pass
Builder-->>Exec : Implementation committed
Exec->>LowVal : Expect pass
LowVal-->>Exec : Pass
Exec->>Builder : REFACTOR (optional)
Builder-->>Exec : Refactor committed
Exec->>LowVal : Verify pass
LowVal-->>Exec : Pass
```

**Diagram sources**
- [tdd.md](file://src/references/tdd.md#L1-L282)

**Section sources**
- [tdd.md](file://src/references/tdd.md#L1-L282)

### UI Branding and Consistency Standards
- Branding: framework name, prefixes, symbol, box styles.
- Stage banners, checkpoint boxes, status symbols, progress displays, delegation and error displays.
- Governance display and color guidelines for terminal/TUI.

```mermaid
graph LR
Brand["Brand Identity"] --> Banners["Stage Banners"]
Brand --> Checkpoints["Checkpoint Boxes"]
Brand --> Status["Status Symbols"]
Brand --> Progress["Progress Display"]
Brand --> Delegation["Delegation Display"]
Brand --> Errors["Error Display"]
Brand --> Colors["Color Guidelines"]
```

**Diagram sources**
- [ui-brand.md](file://src/references/ui-brand.md#L1-L300)

**Section sources**
- [ui-brand.md](file://src/references/ui-brand.md#L1-L300)

### Validation Layers and Compliance Frameworks
- Four-layer validation: schema, integration, completeness, governance.
- Validation outputs, scoring, and aggregation.
- Compliance with governance rules, chain integrity, permission alignment, and context requirements.

```mermaid
flowchart TD
A["Module Input"] --> L1["Schema Validation"]
L1 --> L2["Integration Validation"]
L2 --> L3["Completeness Validation"]
L3 --> L4["Governance Validation"]
L4 --> Summary["Aggregated Validation Result"]
```

**Diagram sources**
- [validation-patterns.md](file://src/skills/idumb-meta-builder/references/validation-patterns.md#L1-L389)

**Section sources**
- [validation-patterns.md](file://src/skills/idumb-meta-builder/references/validation-patterns.md#L1-L389)

### Integration Testing Protocols
- Agent binding: permissions, delegation chains, mode compatibility.
- Tool binding: exports, parameters, availability.
- Command binding: schema, agent binding, chaining rules.
- File I/O validation: read/write/modify operations with scope and safety checks.
- Integration testing checklist and common integration issues.

```mermaid
flowchart TD
A["Agent Profile"] --> Perm["Permission Check"]
A --> Mode["Mode Compatibility"]
T["Tool Definition"] --> Export["Export Validation"]
T --> Params["Parameter Validation"]
C["Command Definition"] --> AgentBind["Agent Binding"]
C --> Chain["Chaining Rules"]
IO["File I/O"] --> Read["Read Validation"]
IO --> Write["Write Validation"]
IO --> Modify["Modify Validation"]
```

**Diagram sources**
- [integration-checklist.md](file://src/skills/idumb-meta-builder/references/integration-checklist.md#L1-L315)

**Section sources**
- [integration-checklist.md](file://src/skills/idumb-meta-builder/references/integration-checklist.md#L1-L315)

### Module Schema and Acceptance Criteria
- YAML frontmatter schema, body sections, workflow steps, checkpoints, integration points.
- Validation criteria: schema, integration, completeness, drift detection, success metrics.
- Error handling, rollback, and fallback strategies.
- Version history and composition rules.

```mermaid
erDiagram
MODULE {
string type
string name
string version
enum workflow_type
enum complexity
string created
string created_by
string validated_by
number coverage_score
enum status
}
STEP {
number step_number
string title
string agent
string action
string[] inputs
string[] outputs
string[] validations
string on_failure
}
MODULE ||--o{ STEP : "contains"
```

**Diagram sources**
- [module-schema.md](file://src/skills/idumb-meta-builder/references/module-schema.md#L1-L377)

**Section sources**
- [module-schema.md](file://src/skills/idumb-meta-builder/references/module-schema.md#L1-L377)

### Validation Skill: Iterative Gap Detection and Self-Healing
- Three-layer validation model and lifecycle.
- Assessment, resolution, and verification phases.
- Stall detection and escalation protocol.
- Integration point matrix template and quick reference checklist.

```mermaid
sequenceDiagram
participant Val as "idumb-validation"
participant Repo as "Repository"
participant User as "User"
Val->>Repo : Initial Scan
Repo-->>Val : Gaps Detected
Val->>Val : Classify Gaps
Val->>Repo : Resolve Fixable Gaps
Repo-->>Val : Regressions Check
Val->>Val : Verify Completion
alt Stall Detected
Val->>User : Present Options
end
Val-->>Repo : Update State & Anchor
```

**Diagram sources**
- [idumb-validation/SKILL.md](file://src/skills/idumb-validation/SKILL.md#L1-L720)

**Section sources**
- [idumb-validation/SKILL.md](file://src/skills/idumb-validation/SKILL.md#L1-L720)

### Stress Test Skill: Framework Self-Assessment
- Micro/batch/full validation modes with triggers and coordinator decisions.
- Agent coordination tests, integration matrix tests, regression sweeps, conflict detection, and self-healing.
- Gap detection categories and loop controller logic.

```mermaid
flowchart TD
Trigger["Activation Trigger"] --> ModeSel["Coordinator Mode Selection"]
ModeSel --> Micro["Micro-Validation"]
ModeSel --> Batch["Batch-Validation"]
ModeSel --> Full["Full Stress Test"]
Micro --> A1["Delegation Chain Integrity"]
Micro --> A2["Permission Matrix Consistency"]
Micro --> A3["Agent Spawning Simulation"]
Batch --> B1["Agent Integration Points"]
Batch --> B2["Command Integration Points"]
Batch --> B3["Workflow Integration Points"]
Full --> C1["All Micro Checks"]
Full --> C2["All Batch Checks"]
Full --> C3["Agent Spawning Simulation"]
Full --> C4["Workflow Chain Execution"]
Full --> C5["Conflict Matrix Generation"]
Full --> C6["OpenCode Compatibility"]
```

**Diagram sources**
- [idumb-stress-test/SKILL.md](file://src/skills/idumb-stress-test/SKILL.md#L1-L704)

**Section sources**
- [idumb-stress-test/SKILL.md](file://src/skills/idumb-stress-test/SKILL.md#L1-L704)

### Project Validation Skill: Greenfield and Brownfield Integration
- Project type detection (greenfield/brownfield/complexity).
- Pre-flight checks, continuous validation, health checks, and OpenCode compatibility.
- Greenfield bootstrap and brownfield integration with conflict avoidance.

```mermaid
flowchart TD
Detect["Project Type Detection"] --> GF{"Greenfield?"}
GF --> |Yes| Boot["Greenfield Bootstrap"]
GF --> |No| BF{"Brownfield?"}
BF --> |Yes| Int["Brownfield Integration"]
BF --> |No| Adapt["Adapt Existing Project"]
Boot --> Init["Initialize iDumb"]
Boot --> Config["Configure Governance Level"]
Boot --> Scaffold["Create Planning Structure"]
Boot --> Validate["Initial Validation"]
Boot --> Anchor["Create Bootstrap Anchor"]
Int --> Assess["Assess Existing Project"]
Int --> Plan["Plan Integration"]
Int --> Minimal["Minimal Init"]
Int --> Shadow["Shadow Mode"]
Int --> Activate["Gradual Activation"]
Int --> Verify["Verify No Disruption"]
```

**Diagram sources**
- [idumb-project-validation/SKILL.md](file://src/skills/idumb-project-validation/SKILL.md#L1-L688)

**Section sources**
- [idumb-project-validation/SKILL.md](file://src/skills/idumb-project-validation/SKILL.md#L1-L688)

### Code Quality Standards
- Error handling standards, cross-platform compatibility, documentation completeness, consistent error message formats.
- Quality validation workflow and scripts for detection and remediation.

```mermaid
flowchart TD
Review["Code Review Validation"] --> EH["Error Handling"]
Review --> CP["Cross-Platform"]
Review --> DOC["Documentation"]
Review --> EM["Error Messages"]
Review --> DUPE["Code Duplication"]
EH --> AutoEH["Automated Error Handling Checks"]
CP --> AutoCP["Cross-Platform Detection"]
DOC --> AutoDOC["Documentation Coverage"]
EM --> AutoEM["Error Message Validation"]
DUPE --> AutoDUPE["Duplication Detection"]
```

**Diagram sources**
- [idumb-code-quality/SKILL.md](file://src/skills/idumb-code-quality/SKILL.md#L1-L480)

**Section sources**
- [idumb-code-quality/SKILL.md](file://src/skills/idumb-code-quality/SKILL.md#L1-L480)

### Performance Optimization Standards
- Efficient file scanning, memory leak prevention, iteration limits, batch operations, and resource monitoring.
- Performance optimization workflow and scripts.

```mermaid
flowchart TD
Detect["Detect Performance Issues"] --> Scan["Optimize File Scanning"]
Detect --> Clean["Implement Cleanup Policy"]
Detect --> Limits["Add Iteration Limits"]
Detect --> BatchOps["Enable Batch Operations"]
Detect --> Monitor["Monitor Resource Usage"]
Scan --> EffScan["Efficient Scan Script"]
Clean --> CleanPolicy["Cleanup Policy Script"]
Limits --> IterLimits["Iteration Limits Validator"]
BatchOps --> BatchOpsScript["Batch Operations Script"]
Monitor --> ResMon["Resource Monitor Script"]
```

**Diagram sources**
- [idumb-performance/SKILL.md](file://src/skills/idumb-performance/SKILL.md#L1-L478)

**Section sources**
- [idumb-performance/SKILL.md](file://src/skills/idumb-performance/SKILL.md#L1-L478)

### Security Standards
- Bash injection prevention, path traversal, permission bypass, race condition prevention.
- Security validation workflow and scripts.

```mermaid
flowchart TD
PreWrite["Pre-Write Validation"] --> BashSec["Validate Bash Scripts"]
PreWrite --> PathSan["Sanitize Paths"]
PreWrite --> PermMat["Validate Permission Matrix"]
PreDelegate["Pre-Delegate Validation"] --> ParentChild["Validate Parent-Child"]
PreDelegate --> OpScope["Validate Operation Scope"]
BashSec --> SecScripts["Security Scripts"]
PathSan --> SecScripts
PermMat --> SecScripts
ParentChild --> SecScripts
OpScope --> SecScripts
```

**Diagram sources**
- [idumb-security/SKILL.md](file://src/skills/idumb-security/SKILL.md#L1-L337)

**Section sources**
- [idumb-security/SKILL.md](file://src/skills/idumb-security/SKILL.md#L1-L337)

### Continuous Validation Workflow
- Trigger detection, coordinator-driven mode selection (micro/batch/skip), execution flow, state updates, and result handling.
- Loop controller with stall prevention and progress thresholds.

```mermaid
sequenceDiagram
participant FS as "File System"
participant CMD as "Commands"
participant PHASE as "Phase Transitions"
participant Coord as "Coordinator"
participant Val as "Validation"
FS->>Coord : File Events
CMD->>Coord : Command Events
PHASE->>Coord : Phase Events
Coord->>Val : Select Mode (Micro/Batch/Skip)
Val->>Val : Execute Checks
Val->>FS : Update State & Records
Val-->>Coord : Result (Pass/Warn/Fail)
Coord-->>FS : Continue/Block Based on Result
```

**Diagram sources**
- [continuous-validation.md](file://src/workflows/continuous-validation.md#L1-L420)

**Section sources**
- [continuous-validation.md](file://src/workflows/continuous-validation.md#L1-L420)

## Dependency Analysis
- Validation Skill depends on verification patterns, module schema, integration checklist, and stress-test skill.
- Stress Test Skill depends on model profiles for agent selection and performance optimization.
- Project Validation Skill coordinates with OpenCode compatibility and governance state.
- Code Quality, Performance, and Security Skills provide cross-cutting validation across all components.

```mermaid
graph TB
VAL["idumb-validation"] --> VPAT["verification-patterns"]
VAL --> MODSC["module-schema"]
VAL --> INTCL["integration-checklist"]
VAL --> STRESS["idumb-stress-test"]
VAL --> PROJ["idumb-project-validation"]
VAL --> QC["idumb-code-quality"]
VAL --> PERF["idumb-performance"]
VAL --> SEC["idumb-security"]
STRESS --> MPFL["model-profiles"]
PROJ --> MPFL
QC --> MPFL
PERF --> MPFL
SEC --> MPFL
```

**Diagram sources**
- [idumb-validation/SKILL.md](file://src/skills/idumb-validation/SKILL.md#L1-L720)
- [idumb-stress-test/SKILL.md](file://src/skills/idumb-stress-test/SKILL.md#L1-L704)
- [idumb-project-validation/SKILL.md](file://src/skills/idumb-project-validation/SKILL.md#L1-L688)
- [idumb-code-quality/SKILL.md](file://src/skills/idumb-code-quality/SKILL.md#L1-L480)
- [idumb-performance/SKILL.md](file://src/skills/idumb-performance/SKILL.md#L1-L478)
- [idumb-security/SKILL.md](file://src/skills/idumb-security/SKILL.md#L1-L337)
- [verification-patterns.md](file://src/references/verification-patterns.md#L1-L601)
- [module-schema.md](file://src/skills/idumb-meta-builder/references/module-schema.md#L1-L377)
- [integration-checklist.md](file://src/skills/idumb-meta-builder/references/integration-checklist.md#L1-L315)
- [model-profiles.md](file://src/references/model-profiles.md#L1-L178)

**Section sources**
- [idumb-validation/SKILL.md](file://src/skills/idumb-validation/SKILL.md#L1-L720)
- [idumb-stress-test/SKILL.md](file://src/skills/idumb-stress-test/SKILL.md#L1-L704)
- [idumb-project-validation/SKILL.md](file://src/skills/idumb-project-validation/SKILL.md#L1-L688)
- [idumb-code-quality/SKILL.md](file://src/skills/idumb-code-quality/SKILL.md#L1-L480)
- [idumb-performance/SKILL.md](file://src/skills/idumb-performance/SKILL.md#L1-L478)
- [idumb-security/SKILL.md](file://src/skills/idumb-security/SKILL.md#L1-L337)
- [verification-patterns.md](file://src/references/verification-patterns.md#L1-L601)
- [module-schema.md](file://src/skills/idumb-meta-builder/references/module-schema.md#L1-L377)
- [integration-checklist.md](file://src/skills/idumb-meta-builder/references/integration-checklist.md#L1-L315)
- [model-profiles.md](file://src/references/model-profiles.md#L1-L178)

## Performance Considerations
- Use budget profile for initial exploration and quality for final synthesis.
- Cache codebase context to avoid re-reading.
- Batch similar operations and use progressive disclosure.
- Optimize file scanning with combined patterns and filtered directories.
- Enforce iteration limits and implement cleanup policies to prevent memory accumulation.
- Monitor resource usage and maintain .idumb directory size within limits.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
- Installation validation checklist and expected results for governance, agents, tools, commands, plugin hooks, and installation script.
- Validation report format and human verification triggers for functional checks requiring human judgment.
- Error handling in TDD plans and escalation to debugger for persistent failures.
- Continuous validation loop controller with stall detection and escalation options.

**Section sources**
- [VALIDATION-CHECKLIST-2026-02-02.md](file://docs/VALIDATION-CHECKLIST-2026-02-02.md#L1-L162)
- [verification-patterns.md](file://src/references/verification-patterns.md#L513-L601)
- [tdd.md](file://src/references/tdd.md#L208-L234)
- [continuous-validation.md](file://src/workflows/continuous-validation.md#L366-L406)

## Conclusion
iDumb’s standards and protocols establish a robust quality assurance framework integrating multi-level verification, model-driven agent selection, TDD practices, comprehensive validation layers, UI branding consistency, and cross-cutting quality, performance, and security controls. The framework emphasizes completion-driven validation, self-healing workflows, and continuous improvement through governance-aligned practices.

[No sources needed since this section summarizes without analyzing specific files]

## Appendices
- Practical examples of standard implementation, measurement, and auditing procedures are embedded throughout the referenced files and skills, including automated verification scripts, validation reports, and workflow templates.

[No sources needed since this section provides general guidance]