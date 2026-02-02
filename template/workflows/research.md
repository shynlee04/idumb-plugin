---
name: research
description: "Orchestrates parallel research agents to gather comprehensive project intelligence"
type: workflow
version: 0.1.0
last_updated: 2026-02-03
---

# Research Workflow

Orchestrates parallel research agents to gather comprehensive intelligence for project planning.

## Entry Conditions

```yaml
entry_conditions:
  must_have:
    - exists: ".idumb/brain/state.json"
    - state: "initialized = true"
  should_have:
    - exists: ".planning/PROJECT.md"
  blocked_when:
    - condition: "!exists('.idumb/brain/state.json')"
      redirect: "/idumb:init"
      message: "iDumb not initialized"
```

## Workflow Steps

```yaml
workflow:
  name: research
  interactive: false  # Agent-driven
  
  steps:
    1_validate_context:
      action: "Check project initialization"
      tool: idumb-validate:structure
      
    2_determine_scope:
      action: "Analyze research request"
      extract:
        - topic_domain
        - depth_requirement
        - focus_areas
        
    3_spawn_researchers:
      action: "Delegate to parallel research agents"
      parallel: true
      agents:
        - idumb-project-researcher (tech)
        - idumb-project-researcher (market)
        - idumb-project-researcher (user)
        - idumb-project-researcher (competitor)
      timeout: 300s
      
    4_collect_findings:
      action: "Gather research outputs"
      wait_for: all_agents
      
    5_synthesize:
      action: "Delegate to research synthesizer"
      agent: idumb-research-synthesizer
      inputs: all_research_outputs
      
    6_validate_synthesis:
      action: "Check synthesis completeness"
      agent: idumb-low-validator
      checks:
        - coverage_all_domains
        - actionable_insights
        - source_attribution
        
    7_store_research:
      action: "Save research document"
      path: ".idumb/governance/research/{timestamp}-{topic}.md"
      
    8_update_state:
      action: "Record research completion"
      tool: idumb-state:history
      action_name: research_completed
```

## Output Artifact

```yaml
artifact:
  name: "{timestamp}-{topic}.md"
  path: ".idumb/governance/research/"
  sections:
    - executive_summary: "2-3 paragraph overview"
    - technical_findings: "Options, recommendations, risks"
    - market_findings: "Trends, opportunities, threats"
    - user_findings: "Personas, needs, priorities"
    - competitor_findings: "Landscape, gaps, differentiation"
    - synthesis: "Key insights, action items, open questions"
    - sources: "Attribution list"
```

## Exit Conditions

```yaml
exit_conditions:
  success:
    - artifact_created: true
    - synthesis_validated: true
    - state_updated: true
  failure:
    - timeout: "Report partial results"
    - no_sources: "Warn and suggest manual research"
```

## Chain Rules

```yaml
chains_to:
  on_success:
    command: "/idumb:roadmap --from-research"
    message: "Research complete. Create roadmap?"
    auto: false
```

## Integration Points

```yaml
integration:
  reads_from:
    - ".idumb/brain/state.json"
    - ".planning/PROJECT.md"
  writes_to:
    - ".idumb/governance/research/"
    - ".idumb/brain/state.json"
```

---
*Workflow: research v0.1.0*
