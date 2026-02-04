# Model Profiles

Agent-to-model mapping for optimal task execution. iDumb uses tiered profiles to balance quality vs speed/cost.

<overview>
**Principle:** Match model capability to task complexity. Use expensive models only where quality matters.

**Profile Tiers:**
- `quality` - Best available, unlimited thinking (claude-opus-4, thinking mode)
- `balanced` - Good quality, reasonable speed (claude-sonnet-4, default)
- `budget` - Fast, cheap, for simple tasks (claude-haiku, gpt-4o-mini)
</overview>

<agent_model_mapping>

## Agent-to-Profile Mapping

| Agent | Profile | Rationale |
|-------|---------|-----------|
| **Coordinators** | | |
| idumb-supreme-coordinator | balanced | Orchestration, delegation |
| idumb-high-governance | balanced | Meta-level coordination |
| idumb-mid-coordinator | balanced | Project coordination |
| idumb-executor | balanced | Phase execution |
| **Planners** | | |
| idumb-planner | quality | Plans require deep thinking |
| idumb-roadmapper | quality | Roadmaps are foundational |
| idumb-plan-checker | quality | Validation requires rigor |
| **Researchers** | | |
| idumb-project-researcher | balanced | Research is exploration |
| idumb-phase-researcher | balanced | Phase research |
| idumb-codebase-mapper | budget | Pattern matching, not synthesis |
| idumb-research-synthesizer | quality | Synthesis requires depth |
| **Validators** | | |
| idumb-low-validator | budget | Simple checks, read-only |
| idumb-skeptic-validator | quality | Challenging requires depth |
| idumb-integration-checker | balanced | Wiring analysis |
| idumb-verifier | balanced | Orchestrates validation |
| **Workers** | | |
| idumb-builder | quality | Code generation quality matters |
| idumb-debugger | quality | Root cause analysis |
| idumb-project-explorer | budget | Navigation, not analysis |

</agent_model_mapping>

<profile_definitions>

## Profile Definitions

### Quality Profile
```yaml
profile: quality
model: claude-opus-4 or claude-sonnet-4 with thinking
temperature: 0.1
max_tokens: 16000
thinking: enabled
use_for:
  - Planning phases
  - Architecture decisions
  - Code generation
  - Synthesis tasks
  - Deep analysis
```

### Balanced Profile
```yaml
profile: balanced
model: claude-sonnet-4
temperature: 0.3
max_tokens: 8000
thinking: disabled
use_for:
  - Coordination
  - Standard research
  - Verification orchestration
  - Routine operations
```

### Budget Profile
```yaml
profile: budget
model: claude-haiku or gpt-4o-mini
temperature: 0.1
max_tokens: 4000
thinking: disabled
use_for:
  - Simple validations
  - File navigation
  - Pattern matching
  - Quick checks
```

</profile_definitions>

<override_rules>

## Override Rules

Sometimes agents need profile overrides based on context:

### Complexity Upgrade
```yaml
# If task complexity detected, upgrade profile
triggers:
  - lines_changed > 500
  - file_count > 10
  - cross_cutting_concern: true
  - security_related: true
action: upgrade_to_quality
```

### Simplicity Downgrade
```yaml
# If task is simple, downgrade to save resources
triggers:
  - single_file_edit: true
  - lines_changed < 20
  - typo_fix: true
  - formatting_only: true
action: downgrade_to_budget
```

</override_rules>

<thinking_mode>

## Thinking Mode Guidelines

Extended thinking is enabled for:
1. **Planning** - Roadmaps, phase plans, task breakdown
2. **Debugging** - Root cause analysis, hypothesis testing
3. **Architecture** - System design, integration patterns
4. **Synthesis** - Combining research into actionable insights
5. **Verification** - Goal-backward analysis

Extended thinking is NOT needed for:
1. **Coordination** - Delegation, routing
2. **Validation** - Checklist verification
3. **Navigation** - File exploration
4. **Simple edits** - Formatting, typos

```yaml
# Agent thinking config example
idumb-planner:
  profile: quality
  thinking:
    enabled: true
    budget: 10000  # tokens for thinking
    trigger: always

idumb-low-validator:
  profile: budget
  thinking:
    enabled: false
```

</thinking_mode>

<cost_optimization>

## Cost Optimization

**Estimated token costs per phase execution:**

| Profile | Input $/1M | Output $/1M | Avg Phase Cost |
|---------|------------|-------------|----------------|
| quality | $15 | $75 | ~$2-5 |
| balanced | $3 | $15 | ~$0.30-1.00 |
| budget | $0.25 | $1.25 | ~$0.05-0.20 |

**Optimization strategies:**
1. Use budget for initial exploration, quality for final synthesis
2. Cache codebase context to avoid re-reading
3. Batch similar operations
4. Use progressive disclosure (don't load all context upfront)

</cost_optimization>
