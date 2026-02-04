# iDumb Skills Integration Guide

**Date**: 2026-02-04
**Version**: 1.0.0
**Status**: Active

---

## Overview

This guide documents the complete integration of iDumb validation skills into the OpenCode plugin ecosystem. The skills provide security, code quality, and performance validation for iDumb framework development.

---

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                    OpenCode Plugin System                      │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  iDumb Core Plugin (.opencode/plugins/idumb-core/)       │  │
│  │  ├── Custom Tools (tool.execute.before/after hooks)       │  │
│  │  ├── Session Compaction (experimental.session.compacting) │  │
│  │  └── Event Bus (event hook for monitoring)               │  │
│  └────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                   iDumb Skills Layer                          │
│  ┌──────────┐  ┌────────────┐  ┌──────────────┐  ┌─────────┐  │
│  │ Security │  │Code Quality │  │ Performance │  │Orchestrator│ │
│  │  Skill   │  │    Skill    │  │    Skill     │  │  Skill  │  │
│  └────┬─────┘  └──────┬───────┘  └──────┬───────┘  └────┬────┘  │
│       │              │                │              │        │
│       └──────────────┴────────────────┴──────────────┘        │
│                                │                                │
│                                ▼                                │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                   iDumb META Agents                           ││
│  │  ┌─────────────────┐  ┌──────────────┐  ┌─────────────────┐  ││
│  │  │ idumb-meta     │  │ idumb-builder │  │ idumb-meta-     │  ││
│  │  │    -builder    │  │              │  │    -validator   │  ││
│  │  └─────────────────┘  └──────────────┘  └─────────────────┘  ││
│  └─────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

## Created Files

### TypeScript Tools (src/tools/)

| File | Purpose | Exports |
|------|---------|---------|
| `idumb-security.ts` | Security validation | `validate`, `scan`, `default` |
| `idumb-quality.ts` | Code quality validation | `validate`, `checkDocs`, `checkErrorHandling`, `default` |
| `idumb-performance.ts` | Performance validation | `validate`, `monitor`, `checkIterationLimits`, `default` |
| `idumb-orchestrator.ts` | Meta-orchestrator coordination | `orchestrate`, `preWrite`, `preDelegate`, `phaseTransition`, `activateSkills`, `default` |

### Documentation (.plugin-dev/)

| File | Purpose |
|------|---------|
| `OPENCODE-INTEGRATION-PLAN.md` | Architectural integration plan |
| `SKILL-INVOCATION-PATTERNS.md` | Usage patterns and workflows |
| `SKILL-INTEGRATION-GUIDE.md` | This document |

### Updated Agent Files

| File | Changes |
|------|---------|
| `src/agents/idumb-meta-builder.md` | Added skill validation tools |
| `src/agents/idumb-builder.md` | Added skill validation tools |
| `src/agents/idumb-meta-validator.md` | Added skill validation tools |

---

## Tool Reference

### idumb-security

**Purpose**: Validate bash scripts for security vulnerabilities

**Tools**:
- `idumb-security_validate`: Full security validation
- `idumb-security_scan`: Quick scan for critical issues
- `idumb-security` (default): Alias for validate

**Parameters**:
```yaml
target_path: string  # File or directory to validate
patterns: array      # [injection, traversal, permissions, race-conditions, all]
mode: string         # [auto, strict, permissive]
```

**Returns**:
```json
{
  "status": "pass|fail|partial",
  "issues": [...],
  "summary": { "total": 0, "critical": 0, "high": 0, "medium": 0, "low": 0 }
}
```

### idumb-quality

**Purpose**: Validate code quality, error handling, cross-platform compatibility, documentation

**Tools**:
- `idumb-quality_validate`: Full quality validation
- `idumb-quality_checkDocs`: Documentation coverage check
- `idumb-quality_checkErrorHandling`: Error handling patterns check
- `idumb-quality` (default): Alias for validate

**Parameters**:
```yaml
target_path: string  # File or directory to validate
checks: array        # [error-handling, cross-platform, documentation, all]
file_type: string    # Filter by file type (sh, ts, md)
```

### idumb-performance

**Purpose**: Validate performance, efficiency, cleanup policies

**Tools**:
- `idumb-performance_validate`: Full performance validation
- `idumb-performance_monitor`: Check .idumb resource usage
- `idumb-performance_checkIterationLimits`: Check for unbounded loops
- `idumb-performance` (default): Alias for validate

**Parameters**:
```yaml
target_path: string      # File or directory to validate
checks: array            # [scanning, cleanup, iteration-limits, all]
check_resources: boolean # Also check .idumb resource usage
```

### idumb-orchestrator

**Purpose**: Coordinate skill activation based on context

**Tools**:
- `idumb-orchestrator_orchestrate`: Context-aware skill activation
- `idumb-orchestrator_preWrite`: Pre-write validation hook
- `idumb-orchestrator_preDelegate`: Pre-delegation validation
- `idumb-orchestrator_phaseTransition`: Phase boundary validation
- `idumb-orchestrator_activateSkills`: Manual skill activation
- `idumb-orchestrator` (default): Alias for orchestrate

**Parameters**:
```yaml
operation_type: string  # [create, edit, delete, commit, build-agent, ...]
target_path: string     # Target file or directory
risk_level: string      # [critical, high, medium, low, auto]
dry_run: boolean        # Show what would be validated without running
```

---

## Agent Integration

### idumb-meta-builder

**New Tools Available**:
- All skill validation tools (security, quality, performance, orchestrator)
- Use for pre-build validation and post-build verification

**Integration Pattern**:
```yaml
before_building_agent:
  1. Run idumb-orchestrator_preWrite for risk assessment
  2. Apply BMAD patterns automatically
  3. Validate against skill requirements
  4. Block on critical issues
```

### idumb-builder

**New Tools Available**:
- Core skill validation tools (security, quality, performance)
- Pre-write validation orchestrator

**Integration Pattern**:
```yaml
before_any_write:
  1. Run idumb-orchestrator_preWrite
  2. Check security for bash content
  3. Check quality for documentation
  4. Block on critical security issues
```

### idumb-meta-validator

**New Tools Available**:
- Read-only skill validation tools
- Use for comprehensive validation sweeps

**Integration Pattern**:
```yaml
validation_workflow:
  1. Run security validation
  2. Run quality validation
  3. Run performance validation
  4. Aggregate results
  5. Report comprehensive status
```

---

## Usage Examples

### Example 1: Building a New Agent with Validation

```bash
# Step 1: Assess risk
idumb-orchestrator_orchestrate \
  operation_type="build-agent" \
  target_path="src/agents/idumb-new-agent.md" \
  dry_run=true

# Step 2: Build the agent
# (agent creation process)

# Step 3: Post-build validation
idumb-orchestrator_activateSkills \
  skills=["quality", "security"] \
  target="src/agents/idumb-new-agent.md"
```

### Example 2: Creating a Command with Bash Script

```bash
# Step 1: Pre-validation
idumb-orchestrator_preWrite \
  file_path="src/commands/idumb/deploy.sh" \
  content="#!/bin/bash\n..."

# Step 2: Security check
idumb-security_scan file="src/commands/idumb/deploy.sh"

# Step 3: Quality check
idumb-quality_checkErrorHandling target="src/commands/idumb/deploy.sh"
```

### Example 3: Phase Transition Validation

```bash
idumb-orchestrator_phaseTransition \
  from_phase="planning" \
  to_phase="execution" \
  validation_scope="full"
```

### Example 4: Resource Monitoring

```bash
# Check .idumb resource usage
idumb-performance_monitor

# Output includes:
# - .idumb directory size
# - Number of report files
# - Cleanup recommendations
```

---

## Installation

The skill tools are automatically installed as part of the iDumb plugin:

```bash
# Local install (current project only)
npm run install:local

# Verify installation
ls -la src/tools/idumb-security.ts
ls -la src/tools/idumb-quality.ts
ls -la src/tools/idumb-performance.ts
ls -la src/tools/idumb-orchestrator.ts
```

---

## TUI Compatibility

The skill tools follow TUI-safe patterns:

1. **No console.log** - All output via JSON return values
2. **Async operations** - Non-blocking execution
3. **Structured returns** - Consistent JSON format
4. **Error handling** - Errors in return value, not thrown

---

## Next Steps

1. **Testing**: Run validation on existing META files
2. **Plugin hooks**: Integrate with tool.execute.before in idumb-core.ts
3. **Documentation**: Update agent profiles with skill usage
4. **Automation**: Add skill validation to build workflows

---

*Document: SKILL-INTEGRATION-GUIDE.md - v1.0.0*
