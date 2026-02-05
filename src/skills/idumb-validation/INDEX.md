# iDumb Validation Skill - Complete Index

**Version:** 2.0.0
**Last Updated:** 2026-02-04

## Overview

The iDumb Validation Skill provides comprehensive, completion-driven validation with iterative gap detection and resolution for the iDumb meta-framework.

## Quick Start

```bash
# Run full validation
/idumb:validate

# Check specific component
Use idumb-validate tool with scope parameter

# View validation status
Read .idumb/brain/governance/report-latest.md
```

## File Structure

```
src/skills/idumb-validation/
├── SKILL.md                           # Main skill documentation
├── INDEX.md                           # This file
├── templates/
│   └── integration-matrix-template.yaml  # Template for documenting integrations
├── references/
│   └── integration-points-reference.md    # Complete integration reference
├── examples/
│   └── agent-validation-example.md        # Example validation run
└── workflows/
    └── iterative-validation.md           # Complete validation workflow
```

## Key Concepts

### Completion-Driven Validation

- Validation exits when WORK IS COMPLETE, not when counters expire
- No arbitrary iteration limits (max=N patterns are forbidden)
- Stall detection triggers escalation, never silent failure

### Integration Point Thresholds

| Tier | Threshold | Component Types |
|------|-----------|-----------------|
| Highest | 30+ | Agents, workflows, core governance |
| Middle | 15+ | Tools, commands, templates |
| Lowest | 10+ | Artifacts, configs |

### Three-Layer Validation

1. **Layer 1: Structure** - Files exist in correct format
2. **Layer 2: Integration** - Component has minimum connections
3. **Layer 3: Behavior** - Works as intended

## Validation Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                    STEP 1: ASSESSMENT                        │
│  Run comprehensive scan, identify all gaps                   │
├─────────────────────────────────────────────────────────────┤
│                    STEP 2: CLASSIFICATION                    │
│  Categorize by severity, tier, and fixability                │
├─────────────────────────────────────────────────────────────┤
│                    STEP 3: RESOLUTION                        │
│  Fix gaps in dependency order, track progress                 │
├─────────────────────────────────────────────────────────────┤
│                    STEP 4: VERIFICATION                       │
│  Confirm all fixes, check thresholds, no regressions          │
├─────────────────────────────────────────────────────────────┤
│                    STEP 5: REPORTING                         │
│  Generate comprehensive report with evidence                  │
└─────────────────────────────────────────────────────────────┘
```

## Stall Detection

The workflow detects stalls and escalates:

| Trigger | Action |
|---------|--------|
| Same output 3 cycles | Escalate with current state |
| No progress 2 cycles | Present partial, request guidance |
| Fix fails 3 times | Mark as unfixable, escalate |
| Dependency deadlock | Present deadlock, request resolution |

## Quick Reference

### For Agents

```yaml
validation_checklist:
  structure:
    - [ ] File in src/agents/ with .md extension
    - [ ] YAML frontmatter complete
    - [ ] Description, mode, permission present
    - [ ] No "*": deny patterns
    - [ ] Tools listed in frontmatter

  integration:
    - [ ] Reads from state.json, config.json
    - [ ] Writes to history, anchors
    - [ ] Validates against rules
    - [ ] Delegates to valid children
    - [ ] 30+ integration points total

  behavior:
    - [ ] Respects permissions
    - [ ] Returns structured results
    - [ ] Tracks delegations
    - [ ] Updates state
```

### For Tools

```yaml
validation_checklist:
  structure:
    - [ ] File in src/tools/ with .ts extension
    - [ ] Uses tool() wrapper
    - [ ] Has description and args
    - [ ] Returns JSON string

  integration:
    - [ ] Reads from state or config
    - [ ] Writes to logs or state
    - [ ] Used by at least 2 agents
    - [ ] 15+ integration points total
```

### For Commands

```yaml
validation_checklist:
  structure:
    - [ ] File in src/commands/idumb/ with .md extension
    - [ ] Has description and agent binding
    - [ ] Has usage and examples sections

  integration:
    - [ ] Bound to one primary agent
    - [ ] Uses idumb-* tools
    - [ ] Has prerequisite checks
    - [ ] 15+ integration points total
```

## Related Skills

- **idumb-governance** - Core governance protocols
- **hierarchical-mindfulness** - Delegation and chain enforcement

## Related Files

- `src/config/completion-definitions.yaml` - Completion criteria
- `src/config/deny-rules.yaml` - Permission rules
- `src/schemas/` - Schema definitions
- `src/tools/idumb-validate.ts` - Validation tool

## Usage Examples

See `examples/agent-validation-example.md` for a complete validation walkthrough.
