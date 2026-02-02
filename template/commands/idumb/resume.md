---
description: "Resume work from last session with context restoration"
agent: idumb-supreme-coordinator
---

# /idumb:resume

Resume work from last session with automatic context restoration.

## Usage

```
/idumb:resume [--force-refresh] [--skip-validation]
```

## Description

Restores project context after session break:
- Loads state from `.idumb/brain/state.json`
- Validates context freshness (warns if >48h stale)
- Detects where work left off
- Routes to appropriate workflow

## Workflow Reference

See: `workflows/resume-project.md`

## Arguments

| Argument | Description | Default |
|----------|-------------|---------|
| `--force-refresh` | Reload all context | `false` |
| `--skip-validation` | Skip freshness check | `false` |

## Exit Behavior

Routes to one of:
- `/idumb:execute-phase` (if plan exists, execution incomplete)
- `/idumb:verify-work` (if execution complete, unverified)
- `/idumb:plan-phase` (if context exists, no plan)
- `/idumb:discuss-phase` (if roadmap exists, no context)
- `/idumb:roadmap` (if project exists, no roadmap)

## Governance

**Delegation Chain:**
```
user → supreme-coordinator → high-governance
  └─→ low-validator (state checks)
```

## Metadata

```yaml
category: session
priority: P0
complexity: low
version: 0.1.0
```
