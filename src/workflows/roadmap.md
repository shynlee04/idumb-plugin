---
description: "Roadmap creation workflow for project planning and milestone definition"
id: wf-roadmap
parent: workflows
created: "2026-02-03"
version: "1.0.0"
---

# Roadmap Workflow

## Purpose
Create comprehensive project roadmaps with phases, milestones, dependencies, and timelines.

## When to Use
- Starting a new project
- Defining project scope and timeline
- Planning major releases
- Aligning team on project direction

## Prerequisites
- PROJECT.md exists with project definition
- Research completed (if needed)
- Stakeholder requirements gathered

## Input
- Project goals and objectives
- Constraints and requirements
- Available resources
- Target timeline

## Output
- ROADMAP.md with:
  - Phase breakdown
  - Milestone definitions
  - Dependency mapping
  - Timeline estimates
  - Success criteria

## Steps

### Step 1: Analyze Project Requirements
**Agent:** @idumb-roadmapper

Review:
- PROJECT.md for scope
- Research findings (if available)
- Constraints and requirements
- Resource availability

### Step 2: Define Phases
**Agent:** @idumb-roadmapper

Create phases with:
- Clear objectives
- Deliverables
- Entry/exit criteria
- Estimated duration

### Step 3: Map Dependencies
**Agent:** @idumb-roadmapper

Identify:
- Phase dependencies
- Task dependencies
- External dependencies
- Critical path

### Step 4: Create Timeline
**Agent:** @idumb-roadmapper

Estimate:
- Phase durations
- Milestone dates
- Buffer time
- Review points

### Step 5: Validate Roadmap
**Agent:** @idumb-integration-checker

Check:
- Dependencies are realistic
- Timeline is achievable
- Resource constraints met
- Integration points covered

### Step 6: Document and Publish
**Agent:** @idumb-roadmapper

Create ROADMAP.md with:
- Executive summary
- Phase details
- Timeline visualization
- Risk mitigation
- Success metrics

## Roadmap Structure

```
ROADMAP.md
├── Project Overview
├── Phase Summary
├── Detailed Phases
│   ├── Phase 1: [Name]
│   ├── Phase 2: [Name]
│   └── ...
├── Dependency Matrix
├── Timeline
├── Risk Assessment
└── Success Criteria
```

## Success Criteria
1. All phases have clear objectives
2. Dependencies are mapped and realistic
3. Timeline is achievable
4. Success criteria are measurable
5. Team alignment achieved

## Related Workflows
- Research Workflow - Provides input for roadmap
- Planning Workflow - Creates phase plans from roadmap
