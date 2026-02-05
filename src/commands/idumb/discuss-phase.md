---
description: "Interactive discussion about phase implementation approach"
id: cmd-discuss-phase
parent: commands-idumb
agent: idumb-supreme-coordinator
---

# /idumb:discuss-phase

<objective>
Facilitate structured, interactive discussion about a specific phase before detailed planning begins. Clarify requirements and constraints, explore implementation approaches, identify risks and mitigations, determine resource needs, and record critical decisions as governance anchors for future context recovery.
</objective>

<context>

## Usage

```bash
/idumb:discuss-phase [phase-number|phase-name] [--topic=approach|risks|resources|all] [--duration=30m] [--depth=shallow|deep]
```

## Arguments

| Argument | Type | Description | Default |
|----------|------|-------------|---------|
| `phase` | string/number | Phase number (e.g., `2`) or name (e.g., `"API Development"`) | Current phase |
| `--topic` | enum | Discussion focus area | `approach` |
| `--duration` | duration | Maximum discussion time | `30m` |
| `--depth` | enum | Analysis depth | `deep` |

## Topic Options

| Topic | Focus Areas |
|-------|-------------|
| `approach` | Architecture, technology choices, patterns, integration |
| `risks` | Technical risks, timeline risks, resource risks, dependencies |
| `resources` | Team composition, skills, tooling, budget |
| `all` | Comprehensive discussion covering all topics |

## Prerequisites

- Roadmap exists (via `/idumb:roadmap`)
- Phase is defined in roadmap
- Research completed for the phase context

</context>

<process>

## Step 1: Validate Phase Exists

Verify the requested phase is in the roadmap.

```bash
# Check roadmap exists
if [ ! -f ".planning/ROADMAP.md" ] && [ ! -f ".idumb/project-output/roadmaps/roadmap.md" ]; then
  echo "ERROR: No roadmap found. Run /idumb:roadmap first."
  exit 1
fi
```

```
Use tool: idumb-config_status

Expected: Phase <N> exists in roadmap
```

## Step 2: Load Phase Context

Gather all relevant context for the discussion.

**Context Sources:**
```yaml
sources:
  - .planning/ROADMAP.md (if planning framework)
  - .idumb/project-output/roadmaps/roadmap.md
  - Previous phase outputs (if not phase 1)
  - Research documents for this phase
  - Existing anchors related to phase
```

```
Delegate to: @idumb-phase-researcher

Task: Gather phase-specific context
Include:
  - Phase goals and scope
  - Dependencies on previous phases
  - Technical requirements
  - Known constraints
```

## Step 3: Present Phase Overview

Display current understanding of the phase.

```markdown
## Phase <N>: <Name>

**Goal:** <Phase objective>

**Scope:**
- <Deliverable 1>
- <Deliverable 2>
- <Deliverable 3>

**Dependencies:**
- <From previous phase>
- <External dependencies>

**Current Understanding:**
<Summary of what we know>

**Open Questions:**
1. <Question needing clarification>
2. <Question needing clarification>
```

## Step 4: Conduct Interactive Discussion

Enter discussion loop based on topic.

### For Topic: `approach`

```yaml
discussion_points:
  architecture:
    - "What architecture pattern fits best?"
    - "Monolith vs microservices vs modular monolith?"
    - "What are the scalability requirements?"
  
  technology:
    - "Which technologies are required vs optional?"
    - "Are there team expertise constraints?"
    - "What's the maintenance overhead?"
  
  patterns:
    - "What design patterns should we apply?"
    - "How do we handle cross-cutting concerns?"
    - "What abstraction level is appropriate?"
  
  integration:
    - "How does this integrate with existing systems?"
    - "What APIs are consumed/exposed?"
    - "What's the data flow?"
```

### For Topic: `risks`

```yaml
risk_categories:
  technical:
    - "What could go technically wrong?"
    - "Are there unproven technologies?"
    - "What's the complexity level?"
  
  timeline:
    - "Is the schedule realistic?"
    - "What could cause delays?"
    - "Are there hard deadlines?"
  
  resources:
    - "Do we have the right skills?"
    - "Are there availability constraints?"
    - "What's the bus factor?"
  
  external:
    - "What external dependencies exist?"
    - "What's outside our control?"
    - "Are there regulatory concerns?"
```

### For Topic: `resources`

```yaml
resource_areas:
  team:
    - "Who needs to be involved?"
    - "What roles are required?"
    - "What's the time commitment?"
  
  skills:
    - "What skills are needed?"
    - "Are there skill gaps?"
    - "Is training required?"
  
  tooling:
    - "What tools are needed?"
    - "Are there licensing costs?"
    - "What infrastructure is required?"
```

## Step 5: Record Decisions

As decisions are made, record them immediately.

```
Use tool: idumb-state_anchor

For each critical decision:
  type: "decision"
  content: "<Decision description with rationale>"
  priority: "critical" or "high"
```

**Decision Format:**
```yaml
decision:
  id: "decision-phase<N>-<topic>"
  summary: "<What was decided>"
  context: "<Why this decision was needed>"
  rationale: "<Why this choice over alternatives>"
  alternatives_considered:
    - "<Alternative 1> - rejected because: <reason>"
    - "<Alternative 2> - rejected because: <reason>"
  implications:
    - "<Consequence 1>"
    - "<Consequence 2>"
```

## Step 6: Build Risk Register

Compile identified risks with mitigations.

```yaml
risks:
  - id: "risk-<N>-001"
    description: "<Risk description>"
    category: "technical|timeline|resource|external"
    likelihood: "high|medium|low"
    impact: "high|medium|low"
    mitigation: "<Mitigation strategy>"
    owner: "<Who monitors this>"
    contingency: "<If risk materializes>"
```

## Step 7: Synthesize Discussion

Compile all discussion outcomes.

```
Delegate to: @idumb-builder

Task: Create phase context document
Path: .idumb/brain/governance/phases/<phase>-context.md
```

## Step 8: Store Context Document

Save the synthesized discussion.

**Document Path:** `.idumb/brain/governance/phases/phase-<N>-context.md`

</process>

<completion_format>

## Phase Context Document

```markdown
# Phase <N> Discussion: <Phase Name>

## Metadata
- **Date:** <Discussion timestamp>
- **Duration:** <Actual duration>
- **Topic Focus:** <approach|risks|resources|all>
- **Participants:** User, <Agents involved>

## Executive Summary
<2-3 sentence summary of key outcomes>

## Decisions Made

### Decision 1: <Title>
**Context:** <Why this decision was needed>
**Choice:** <What was decided>
**Rationale:** <Why this approach>
**Alternatives Rejected:**
- <Alt 1>: <Why rejected>
- <Alt 2>: <Why rejected>

### Decision 2: <Title>
...

## Risks Identified

| ID | Risk | Likelihood | Impact | Mitigation | Owner |
|----|------|------------|--------|------------|-------|
| R-001 | <Description> | High/Med/Low | High/Med/Low | <Strategy> | <Owner> |
| R-002 | <Description> | High/Med/Low | High/Med/Low | <Strategy> | <Owner> |

## Resources Required

### Team
- <Role 1>: <Time commitment>
- <Role 2>: <Time commitment>

### Skills
- <Skill 1>: <Available/Gap>
- <Skill 2>: <Available/Gap>

### Tooling
- <Tool 1>: <Status>
- <Tool 2>: <Status>

## Open Questions
1. <Question> → Assigned to: <Owner> → Due: <Date>
2. <Question> → Assigned to: <Owner> → Due: <Date>

## Next Steps
1. [ ] <Action item 1>
2. [ ] <Action item 2>
3. [ ] <Action item 3>

## Anchors Created
- `decision-phase<N>-<id1>`: <Summary>
- `decision-phase<N>-<id2>`: <Summary>
```

## Console Output

```
✓ Phase discussion completed

  Phase:    <N> - <Name>
  Duration: <actual time>
  Topic:    <focus area>

  Outcomes:
  ├── Decisions made: <count>
  ├── Risks identified: <count>
  ├── Open questions: <count>
  └── Anchors created: <count>

  Document: .idumb/brain/governance/phases/phase-<N>-context.md

  Next:
  1. /idumb:plan-phase <N> - Create detailed plan
  2. /idumb:discuss-phase <N> --topic=risks - Deep-dive on risks
```

## Error Codes

| Code | Cause | Resolution |
|------|-------|------------|
| `D001` | Phase not found | Check roadmap for valid phases |
| `D002` | No roadmap exists | Run `/idumb:roadmap` first |
| `D003` | Discussion timeout | Continue in new session with `/idumb:resume` |
| `D004` | Context too stale | Run `/idumb:validate` then retry |

</completion_format>

<success_criteria>

## Discussion Completion Checklist

- [ ] Phase validated as existing in roadmap
- [ ] Phase context loaded from available sources
- [ ] Interactive discussion conducted
- [ ] At least one decision recorded (for non-trivial phases)
- [ ] Risks identified and registered
- [ ] Resource needs documented
- [ ] Open questions listed with owners
- [ ] Context document created
- [ ] Critical decisions anchored
- [ ] History entry recorded
- [ ] Next steps presented

## Quality Criteria

- [ ] Decisions include rationale, not just choices
- [ ] Risks have likelihood AND impact ratings
- [ ] Each risk has a mitigation strategy
- [ ] Open questions have assigned owners
- [ ] Document is actionable, not vague

## Verification

```bash
# Check context document created
ls .idumb/brain/governance/phases/phase-*-context.md

# Check anchors created
cat .idumb/brain/state.json | jq '.anchors[] | select(.type == "decision")'

# Check history updated
cat .idumb/brain/state.json | jq '.history[-1]'
```

</success_criteria>

## Related Commands

| Command | Purpose |
|---------|---------|
| `/idumb:roadmap` | View/create roadmap |
| `/idumb:plan-phase` | Create plan after discussion |
| `/idumb:research` | Research specific topics |
| `/idumb:validate` | Validate context freshness |

## Governance

**Delegation Chain:**
```
user → supreme-coordinator → high-governance → phase-researcher
                                             → builder (for context doc)
```

**Validation Points:**
- Pre: Phase exists in roadmap
- During: Decisions recorded as made
- Post: Decisions recorded as anchors
- Post: Context document created

## Metadata

```yaml
category: planning
priority: P2
complexity: medium
interactive: true
version: 0.2.0
```
