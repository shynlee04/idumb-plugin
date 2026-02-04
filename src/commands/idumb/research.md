---
description: "Execute comprehensive research phase using parallel agent mode"
id: cmd-research
parent: commands-idumb
agent: idumb-supreme-coordinator
---

# /idumb:research

Execute comprehensive research phase using parallel agent mode.

<objective>
Conduct thorough domain-specific or phase-specific research by orchestrating specialized research agents. Synthesize findings into actionable intelligence that informs roadmap creation, phase planning, and technical decisions.
</objective>

<execution_context>

## Reference Files (Read Before Execution)
- `.idumb/idumb-brain/state.json` - Current governance state
- `.idumb/idumb-brain/config.json` - User settings and research preferences
- `.planning/PROJECT.md` - Project definition (if exists)
- `.planning/ROADMAP.md` - Current roadmap for phase context
- `.idumb/idumb-brain/governance/research/*.md` - Previous research outputs

## Agents Involved
| Agent | Role | Mode |
|-------|------|------|
| @idumb-supreme-coordinator | Command entry, routing | primary |
| @idumb-project-researcher | Domain research (tech/market/user) | delegated |
| @idumb-phase-researcher | Phase-specific research | delegated |
| @idumb-research-synthesizer | Synthesis and conflict resolution | delegated |
| @idumb-low-validator | Research validation | hidden |

</execution_context>

<skills>

## Auto-Activated Skills

When this command is executed, the following skills are automatically activated:

| Skill | Purpose | Activated For |
|-------|---------|--------------|
| `idumb-research-writer` | Write research artifacts | project-researcher, phase-researcher |
| `idumb-codebase-chunker` | Split large codebases | project-researcher (when analyzing existing code) |

## Skill-Driven Flow Control

The research command forces specific flows through skill activations:

1. **Research Output Mode** (`idumb-research-writer`)
   - When research produces findings > 10KB context
   - Automatically writes to `.idumb/idumb-project-output/research/`
   - Enables intermediate artifact saving for context management

2. **Codebase Chunking** (`idumb-codebase-chunker`)
   - When analyzing codebases > 50 files
   - Automatically organizes by feature/domain chunks
   - Each chunk analyzed separately, then synthesized

</skills>

<context>

## Usage

```bash
/idumb:research [topic] [flags]
```

## Flags

| Flag | Description | Values | Default |
|------|-------------|--------|---------|
| `--domain` | Research domain focus | `tech`, `market`, `user`, `competitor`, `all` | `all` |
| `--phase` | Research for specific phase | Phase ID like `01`, `02-01` | Current phase |
| `--ecosystem` | Include ecosystem analysis | Boolean | `false` |
| `--depth` | Research thoroughness | `quick`, `standard`, `deep` | `standard` |
| `--sources` | Maximum sources to consult | Number 1-20 | `10` |
| `--output` | Output format | `markdown`, `json` | `markdown` |

## Examples

```bash
# Quick technical research
/idumb:research "authentication libraries" --domain=tech --depth=quick

# Deep market research
/idumb:research "SaaS pricing models" --domain=market --depth=deep

# Phase-specific research
/idumb:research "API design patterns" --phase=02-01

# Ecosystem research
/idumb:research "React state management" --ecosystem

# Full research (all domains)
/idumb:research "user onboarding best practices"
```

## Research Domains

### Technical (`--domain=tech`)
- Technology stack options
- Architecture patterns
- Library/framework evaluation
- Performance benchmarks
- Security considerations
- API design patterns

### Market (`--domain=market`)
- Industry trends
- Target audience
- Market size/opportunity
- Regulatory landscape
- Pricing models

### User (`--domain=user`)
- User personas
- Pain points
- Feature priorities
- UX patterns
- Accessibility needs

### Competitor (`--domain=competitor`)
- Competitor features
- Market positioning
- Differentiation opportunities
- Technical approaches
- Pricing strategies

</context>

<process>

## Step 1: Validate Governance State

```yaml
validation:
  tool: idumb-validate_structure
  checks:
    - .idumb/ exists
    - state.json valid
    - User is in valid governance session
  on_fail: "Run /idumb:init first to initialize governance"
```

## Step 2: Parse Research Request

```yaml
request_parsing:
  extract:
    topic: User-provided topic/question
    domain: --domain flag or "all"
    phase: --phase flag or current phase from state.json
    ecosystem: --ecosystem flag (boolean)
    depth: --depth flag or "standard"
    sources: --sources flag or 10
  validate:
    topic_not_empty: Required
    topic_not_vague: Length > 10 chars, contains specific terms
  on_vague: |
    ## Research Topic Too Vague
    
    Please provide a specific research question, not just a keyword.
    
    **Instead of:** "auth"
    **Try:** "OAuth2 vs JWT for API authentication in Node.js"
```

## Step 3: Determine Research Strategy

```yaml
strategy_selection:
  if: --phase flag provided
    agent: "@idumb-phase-researcher"
    mode: phase-specific
    context: Load phase definition from .planning/phases/{phase}/
  elif: --domain flag != "all"
    agent: "@idumb-project-researcher"
    mode: domain-specific
    focus: Single domain from flag
  else:
    agent: "@idumb-project-researcher"
    mode: parallel-domains
    domains: [tech, market, user, competitor]
```

## Step 4: Delegate to Research Agent(s)

### For Domain Research (--domain flag or all domains)

```yaml
delegation_domain:
  agent: "@idumb-project-researcher"
  prompt: |
    ## Research Task
    
    **Topic:** {topic}
    **Domain:** {domain}
    **Depth:** {depth}
    **Max Sources:** {sources}
    **Ecosystem Analysis:** {ecosystem}
    
    **Project Context:**
    - Framework: {framework from state.json}
    - Current Phase: {phase}
    - Tech Stack: {detected from idumb-context}
    
    **Expected Output:**
    Follow your <structured_returns> RESEARCH_OUTPUT format.
    Include source attribution for all findings.
    
  parallel: true (if domain == "all")
  timeout: 300s
```

### For Phase Research (--phase flag)

```yaml
delegation_phase:
  agent: "@idumb-phase-researcher"
  prompt: |
    ## Phase Research Task
    
    **Phase:** {phase}
    **Topic:** {topic}
    **Depth:** {depth}
    
    **Phase Context:**
    Load from .planning/phases/{phase}/PLAN.md
    
    **Expected Output:**
    Follow your <structured_returns> format.
    Focus on implementation requirements for this phase.
```

## Step 5: Collect and Validate Research Outputs

```yaml
collection:
  wait_for: all delegated agents
  timeout: 300s per agent, 600s total
  
validation:
  agent: "@idumb-low-validator"
  checks:
    - All requested domains covered
    - Sources are attributed
    - Findings are actionable (not just summaries)
    - No contradictions without resolution
  on_incomplete:
    action: Request specific gaps to be filled
    retry: Once per domain
```

## Step 6: Synthesize (if multiple domains)

```yaml
synthesis:
  condition: More than 1 domain researched
  agent: "@idumb-research-synthesizer"
  inputs:
    - All research outputs from Step 4
    - Project context
    - Phase requirements (if applicable)
  output:
    format: Unified RESEARCH.md
    sections:
      - Executive Summary
      - Per-Domain Findings
      - Cross-Domain Insights
      - Recommendations
      - Open Questions
      - Sources
```

## Step 7: Store Research Output

```yaml
storage:
  delegate_to: "@idumb-builder"
  path: ".idumb/idumb-project-output/research/{YYYY-MM-DD}-{topic-slug}.md"
  also_copy_to: ".planning/research/{topic-slug}.md" (if planning framework)
  
state_update:
  tool: idumb-state_history
  action: "research_completed"
  result: "pass"
  metadata: |
    topic: {topic}
    domains: {domains researched}
    sources: {source count}
```

## Step 8: Report to User

```yaml
report:
  display: Research summary with key findings
  action_items: Next suggested steps
  links: Path to full research document
```

</process>

<completion_format>

## RESEARCH COMPLETE

```markdown
# Research: {Topic}

**Date:** {YYYY-MM-DD}
**Depth:** {depth}
**Domains:** {domains researched}
**Sources Consulted:** {count}

## Executive Summary

{2-3 paragraphs summarizing key findings across all domains}

## Technical Findings

### Options Evaluated
- **{Option 1}:** {Brief description}
  - Pros: {list}
  - Cons: {list}
  - Recommendation: {use when...}

### Architecture Recommendations
{Based on findings}

### Risks
- {Risk 1}: {Mitigation}

## Market Findings

### Trends
{Key market trends relevant to project}

### Opportunities
{Identified opportunities}

### Threats
{Competitive or market threats}

## User Findings

### Personas
- **{Persona 1}:** {Description}
  - Needs: {list}
  - Pain Points: {list}

### Feature Priorities
1. {Most important}
2. {Second}
3. {Third}

## Competitor Findings

### Landscape
{Overview of competitive landscape}

### Gaps
{Identified gaps in competitor offerings}

### Differentiation
{How to differentiate}

## Synthesis

### Key Insights
1. {Cross-domain insight 1}
2. {Cross-domain insight 2}
3. {Cross-domain insight 3}

### Action Items
- [ ] {Action 1}
- [ ] {Action 2}
- [ ] {Action 3}

### Open Questions
- {Question needing further research}

## Sources

1. [{Source title}]({url}) - {brief note}
2. [{Source title}]({url}) - {brief note}
...
```

## Next Steps

| Action | Command |
|--------|---------|
| Create roadmap from research | `/idumb:roadmap --from-research` |
| Plan specific phase | `/idumb:plan-phase {phase}` |
| Discuss findings | `/idumb:discuss-phase` |
| Run more research | `/idumb:research "{new topic}"` |

## Stored At

- Primary: `.idumb/idumb-project-output/research/{date}-{topic}.md`
- Planning sync: `.planning/research/{topic}.md` (if applicable)

</completion_format>

<error_handling>

| Error Code | Cause | Resolution |
|------------|-------|------------|
| `R001` | Topic too vague | Provide specific research question with context |
| `R002` | Research timeout | Increase timeout or reduce `--depth` to `quick` |
| `R003` | Insufficient sources | Broaden search terms, try `--ecosystem` flag |
| `R004` | Governance not initialized | Run `/idumb:init` first |
| `R005` | Phase not found | Check phase ID exists in `.planning/phases/` |

</error_handling>

<governance>

## Delegation Chain

```
user → supreme-coordinator → high-governance
  ├─→ project-researcher (tech) ─┐
  ├─→ project-researcher (market)─┼─→ research-synthesizer → builder
  ├─→ project-researcher (user) ──┤
  └─→ project-researcher (competitor)─┘
        ↓
    low-validator (verification)
```

## Validation Points

| Point | Check | Agent |
|-------|-------|-------|
| Pre | Governance initialized | low-validator |
| Pre | Topic is specific enough | supreme-coordinator |
| During | Each domain produces output | low-validator |
| Post | Synthesis covers all domains | low-validator |
| Post | Research stored correctly | builder |

## Permission Model

| Agent | Can Delegate | Can Write | Can Read |
|-------|--------------|-----------|----------|
| supreme-coordinator | Yes | No | Yes |
| project-researcher | No | No | Yes (MCP tools) |
| research-synthesizer | No | No | Yes |
| low-validator | No | No | Yes |
| builder | No | Yes | Yes |

</governance>

<metadata>
```yaml
category: research
priority: P1
complexity: high
parallel: true
version: 0.2.0
requires: governance-initialized
outputs:
  - .idumb/idumb-project-output/research/*.md
```
</metadata>
