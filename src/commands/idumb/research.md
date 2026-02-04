---
description: "Execute comprehensive research phase using parallel agent mode"
agent: idumb-supreme-coordinator
---

# /idumb:research

Execute comprehensive research phase using parallel agent mode.

## Usage

```
/idumb:research [topic] [--depth=quick|standard|deep] [--focus=tech|market|user|competitor]
```

## Description

Replaces 4 research agents with a single orchestrated research command that:
- Spawns parallel research agents for different domains
- Synthesizes findings into unified research document
- Produces actionable insights for roadmap creation
- Maintains research context across phases

## Workflow

```yaml
steps:
  1_validate_context:
    action: Check project initialization
    tool: idumb-validate:structure
    
  2_determine_scope:
    action: Analyze research request
    extract:
      - topic_domain
      - depth_requirement
      - focus_areas
      
  3_spawn_researchers:
    action: Delegate to parallel research agents
    parallel: true
    agents:
      - idumb-project-researcher (tech)
      - idumb-project-researcher (market)
      - idumb-project-researcher (user)
      - idumb-project-researcher (competitor)
    
  4_collect_findings:
    action: Gather research outputs
    wait_for: all_agents
    timeout: 300s
    
  5_synthesize:
    action: Delegate to research synthesizer
    agent: idumb-research-synthesizer
    inputs: all_research_outputs
    
  6_validate_synthesis:
    action: Check synthesis completeness
    agent: idumb-low-validator
    checks:
      - coverage_all_domains
      - actionable_insights
      - source_attribution
      
  7_store_research:
    action: Save research document
    path: .idumb/governance/research/<timestamp>-<topic>.md
    
  8_update_state:
    action: Record research completion
    tool: idumb-state:history
    action_name: research_completed
    result: pass
    
  9_report:
    action: Display research summary
```

## Arguments

| Argument | Description | Default |
|----------|-------------|---------|
| `topic` | Research topic/question | Required |
| `--depth` | Research thoroughness | `standard` |
| `--focus` | Primary focus area | `all` |
| `--output` | Output format | `markdown` |
| `--sources` | Max sources to consult | `10` |

## Research Domains

### Technical Research
- Technology stack options
- Architecture patterns
- Library/framework evaluation
- Performance benchmarks
- Security considerations

### Market Research
- Industry trends
- Target audience
- Market size/opportunity
- Regulatory landscape
- Pricing models

### User Research
- User personas
- Pain points
- Feature priorities
- UX patterns
- Accessibility needs

### Competitor Research
- Competitor features
- Market positioning
- Differentiation opportunities
- Technical approaches
- Pricing strategies

## Output Format

Research document structure:
```markdown
# Research: [Topic]

## Executive Summary
[2-3 paragraph overview]

## Technical Findings
### Options Evaluated
### Recommendations
### Risks

## Market Findings
### Trends
### Opportunities
### Threats

## User Findings
### Personas
### Needs
### Priorities

## Competitor Findings
### Landscape
### Gaps
### Differentiation

## Synthesis
### Key Insights
### Action Items
### Open Questions

## Sources
[Attribution list]
```

## Examples

```bash
# Quick research on authentication options
/idumb:research "authentication libraries" --depth=quick --focus=tech

# Deep market research
/idumb:research "SaaS pricing models" --depth=deep --focus=market

# Comprehensive research
/idumb:research "user onboarding best practices"
```

## Error Handling

| Error | Cause | Resolution |
|-------|-------|------------|
| `R001` | Topic too vague | Provide specific research question |
| `R002` | Research timeout | Increase timeout or reduce scope |
| `R003` | Insufficient sources | Broaden search terms |

## Related Commands

- `/idumb:roadmap` - Create roadmap from research
- `/idumb:discuss-phase` - Discuss phase implementation
- `/idumb:plan-phase` - Create phase plan

## Governance

**Delegation Chain:**
```
user → supreme-coordinator → high-governance
  ├─→ project-researcher (tech) ─┐
  ├─→ project-researcher (market)─┼─→ research-synthesizer
  ├─→ project-researcher (user) ──┤
  └─→ project-researcher (competitor)─┘
```

**Validation Points:**
- Pre: Project initialized
- During: All research agents complete
- Post: Synthesis validated
- Post: Research document stored

## Metadata

```yaml
category: research
priority: P1
complexity: high
parallel: true
version: 0.1.0
```
