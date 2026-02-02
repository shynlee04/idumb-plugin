---
description: "Interactive discussion about phase implementation approach"
agent: idumb-supreme-coordinator
---

# /idumb:discuss-phase

Interactive discussion about phase implementation approach.

## Usage

```
/idumb:discuss-phase [phase-number|phase-name] [--topic=approach|risks|resources]
```

## Description

Facilitates structured discussion about a specific phase before planning:
- Clarifies requirements and constraints
- Explores implementation approaches
- Identifies risks and mitigations
- Determines resource needs
- Records decisions as anchors

## Workflow

```yaml
steps:
  1_validate_phase:
    action: Verify phase exists in roadmap
    tool: idumb-config:status
    
  2_load_context:
    action: Gather phase context
    sources:
      - roadmap.md
      - previous_phase_outputs
      - research_documents
      
  3_spawn_researcher:
    action: Delegate to phase researcher
    agent: idumb-phase-researcher
    task: gather_phase_specific_context
    
  4_conduct_discussion:
    action: Interactive discussion loop
    while: user_has_questions
    do:
      - present_options
      - answer_questions
      - record_decisions
      
  5_synthesize_decisions:
    action: Compile discussion outcomes
    create:
      - approach_decision
      - risk_register
      - resource_plan
      - open_questions
      
  6_create_anchors:
    action: Store critical decisions
    tool: idumb-state:anchor
    for_each: critical_decision
    
  7_store_context:
    action: Save phase context
    path: .idumb/governance/phases/<phase>-context.md
    
  8_report:
    action: Display discussion summary
```

## Arguments

| Argument | Description | Default |
|----------|-------------|---------|
| `phase` | Phase number or name | Current phase |
| `--topic` | Discussion focus | `approach` |
| `--duration` | Max discussion time | `30m` |
| `--participants` | Agent specializations | `all` |

## Discussion Topics

### Approach
- Architecture decisions
- Technology choices
- Implementation patterns
- Integration strategies

### Risks
- Technical risks
- Timeline risks
- Resource risks
- External dependencies

### Resources
- Team composition
- Skill requirements
- Tooling needs
- Budget considerations

## Output

Phase context document:
```markdown
# Phase X Discussion: [Phase Name]

## Date
[Discussion timestamp]

## Participants
- User
- [Agents involved]

## Decisions Made
### [Decision 1]
**Context:** [Why this decision]
**Approach:** [What was decided]
**Rationale:** [Why this approach]

## Risks Identified
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| [Risk] | High/Med/Low | High/Med/Low | [Strategy] |

## Resources Required
- [Resource 1]
- [Resource 2]

## Open Questions
- [Question 1] → Assigned to: [Agent/Owner]

## Next Steps
1. [Step 1]
2. [Step 2]
```

## Examples

```bash
# Discuss current phase
/idumb:discuss-phase

# Discuss specific phase
/idumb:discuss-phase 2

# Focus on risks
/idumb:discuss-phase 3 --topic=risks

# Discuss by name
/idumb:discuss-phase "API Development"
```

## Decision Anchors

Critical decisions are stored as anchors:
```yaml
anchor:
  id: "decision-phase2-architecture"
  type: "decision"
  priority: "critical"
  content: "Use microservices architecture for Phase 2"
  created: "2026-02-03T10:00:00Z"
```

## Error Handling

| Error | Cause | Resolution |
|-------|-------|------------|
| `D001` | Phase not found | Check roadmap for valid phases |
| `D002` | No roadmap exists | Run /idumb:roadmap first |
| `D003` | Discussion timeout | Continue in new session |

## Related Commands

- `/idumb:roadmap` - View roadmap
- `/idumb:plan-phase` - Create plan after discussion
- `/idumb:research` - Research specific topics

## Governance

**Delegation Chain:**
```
user → supreme-coordinator → high-governance → phase-researcher
```

**Validation Points:**
- Pre: Phase exists in roadmap
- Post: Decisions recorded as anchors
- Post: Context document created

## Metadata

```yaml
category: planning
priority: P2
complexity: medium
interactive: true
version: 0.1.0
```
