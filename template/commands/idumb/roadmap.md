---
description: "Create or update project roadmap based on research and requirements"
agent: idumb-supreme-coordinator
---

# /idumb:roadmap

Create or update project roadmap based on research and requirements.

## Usage

```
/idumb:roadmap [--from-research] [--phases=N] [--update]
```

## Description

Generates a structured project roadmap with:
- Phase definitions with clear objectives
- Milestone markers
- Dependency mapping
- Timeline estimates
- Resource allocation hints

Integrates with .planning/ROADMAP.md if present, or creates iDumb-native roadmap.

## Workflow

```yaml
steps:
  1_validate_prerequisites:
    action: Check for research or requirements
    sources:
      - .idumb/governance/research/
      - PROJECT.md
      - requirements.md
      - User input
      
  2_load_context:
    action: Gather project context
    tools:
      - idumb-context:summary
      - idumb-config:read
      
  3_delegate_roadmapper:
    action: Delegate to roadmapper agent
    agent: idumb-roadmapper
    inputs:
      - research_findings
      - project_context
      - constraints
      
  4_generate_phases:
    action: Create phase structure
    for_each: major_deliverable
    create:
      - phase_definition
      - objectives
      - milestones
      - dependencies
      
  5_validate_roadmap:
    action: Check roadmap validity
    agent: idumb-low-validator
    checks:
      - logical_flow
      - dependency_cycles
      - realistic_scope
      
  6_store_roadmap:
    action: Save roadmap
    paths:
       - .idumb/governance/roadmap.md
       - .planning/ROADMAP.md (if planning framework)
       
   7_update_state:
    action: Record roadmap creation
    tool: idumb-state:write
    phase: roadmap_created
    
  8_report:
    action: Display roadmap summary
```

## Arguments

| Argument | Description | Default |
|----------|-------------|---------|
| `--from-research` | Use latest research | `false` |
| `--phases` | Number of phases | Auto-detect |
| `--update` | Update existing roadmap | `false` |
| `--format` | Output format | `markdown` |
| `--timeline` | Include timelines | `true` |

## Roadmap Structure

```markdown
# Project Roadmap

## Overview
[Project summary and goals]

## Phase 1: [Name]
**Objective:** [Clear objective statement]
**Duration:** [Estimated duration]

### Milestones
- [ ] M1.1: [Milestone name]
- [ ] M1.2: [Milestone name]

### Deliverables
- [Deliverable 1]
- [Deliverable 2]

### Dependencies
- [Dependency 1]

## Phase 2: [Name]
...

## Timeline
[Gantt-style or list timeline]

## Risk Mitigation
[Identified risks and mitigations]
```

## Phase Types

| Type | Description | Example |
|------|-------------|---------|
| `research` | Investigation and discovery | Market research, tech evaluation |
| `foundation` | Core infrastructure setup | Architecture, CI/CD, tooling |
| `feature` | Feature development | User stories, functionality |
| `integration` | System integration | API connections, data migration |
| `polish` | Quality improvements | Testing, docs, performance |
| `launch` | Release preparation | Deployment, monitoring, support |

## Examples

```bash
# Create roadmap from research
/idumb:roadmap --from-research

# Create 5-phase roadmap
/idumb:roadmap --phases=5

# Update existing roadmap
/idumb:roadmap --update
```

## Integration with Planning

If planning framework is detected:
- Reads existing ROADMAP.md from `.planning/`
- Preserves planning format and structure
- Adds iDumb governance metadata
- Syncs with planning STATE.md

## Error Handling

| Error | Cause | Resolution |
|-------|-------|------------|
| `M001` | No research available | Run /idumb:research first |
| `M002` | Invalid phase count | Use 1-10 phases |
| `M003` | Dependency cycle detected | Review phase ordering |

## Related Commands

- `/idumb:research` - Conduct research
- `/idumb:discuss-phase` - Discuss specific phase
- `/idumb:plan-phase` - Create phase plan

## Governance

**Delegation Chain:**
```
user → supreme-coordinator → high-governance → roadmapper
```

**Validation Points:**
- Pre: Research or requirements available
- Post: Roadmap structure valid
- Post: No dependency cycles
- Post: Stored in correct location

## Metadata

```yaml
category: planning
priority: P1
complexity: high
version: 0.1.0
```
