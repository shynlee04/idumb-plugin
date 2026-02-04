# iDumb Skill Invocation Patterns and Workflows

**Date**: 2026-02-04
**Version**: 1.0.0
**Status**: Active

---

## Overview

This document defines the patterns and workflows for invoking iDumb validation skills. Skills can be invoked directly via tools, coordinated through the meta-orchestrator, or integrated into agent workflows.

---

## Direct Tool Invocation

### Security Validation

```bash
# Validate a specific bash file
idumb-security_validate target_path="src/commands/idumb/example.sh" patterns=["all"] mode="auto"

# Quick security scan
idumb-security_scan file="src/commands/idumb/deploy.sh"
```

### Quality Validation

```bash
# Full quality validation
idumb-quality_validate target_path="src/tools/idumb-validate.ts" checks=["all"]

# Check documentation only
idumb-quality_checkDocs target="src/agents/idumb-builder.md"

# Check error handling only
idumb-quality_checkErrorHandling target="src/commands/idumb/init.md"
```

### Performance Validation

```bash
# Full performance validation
idumb-performance_validate target_path="src/plugins/" checks=["all"] check_resources=true

# Monitor resource usage
idumb-performance_monitor

# Check iteration limits
idumb-performance_checkIterationLimits target="src/workflows/plan-phase.md"
```

---

## Orchestrator Invocation

### Pre-Write Validation

Before any file write operation:

```bash
idumb-orchestrator_preWrite file_path="src/agents/new-agent.md" content="#!/bin/bash..."
```

**Returns:**
```json
{
  "status": "pass|fail|partial",
  "activated_skills": ["security", "quality"],
  "blockers": [],
  "warnings": []
}
```

### Pre-Delegate Validation

Before delegating to another agent:

```bash
idumb-orchestrator_preDelegate \
  parent_agent="idumb-high-governance" \
  child_agent="idumb-meta-builder" \
  operation="build_agent"
```

### Phase Transition Validation

At phase boundaries:

```bash
idumb-orchestrator_phaseTransition \
  from_phase="planning" \
  to_phase="execution" \
  validation_scope="full"
```

### Context-Aware Orchestration

Let the orchestrator determine which skills to run:

```bash
idumb-orchestrator_orchestrate \
  operation_type="create" \
  target_path="src/commands/idumb/new-command.md" \
  risk_level="auto" \
  dry_run=false
```

**Dry run to see what would be validated:**
```bash
idumb-orchestrator_orchestrate \
  operation_type="build-agent" \
  target_path="src/agents/new-agent.md" \
  dry_run=true
```

### Manual Skill Activation

Explicitly activate specific skills:

```bash
idumb-orchestrator_activateSkills \
  skills=["security", "quality"] \
  target="src/commands/idumb/deploy.sh"
```

---

## Agent Integration Patterns

### Pattern 1: Before Building an Agent

```yaml
workflow_build_agent:
  step_1_validate_request:
    tool: "idumb-orchestrator_orchestrate"
    args:
      operation_type: "build-agent"
      target_path: "src/agents/{{agent_name}}.md"
      risk_level: "critical"

  step_2_if_blocked:
    condition: "step_1.status == 'fail'"
    action: "Report blockers, abort build"

  step_3_if_warnings:
    condition: "step_1.status == 'partial'"
    action: "Display warnings, prompt for confirmation"

  step_4_build:
    condition: "step_1.status != 'fail'"
    action: "Proceed with agent creation"

  step_5_post_build_validate:
    tool: "idumb-orchestrator_activateSkills"
    args:
      skills: ["quality"]
      target: "src/agents/{{agent_name}}.md"
```

### Pattern 2: Before Creating a Command with Bash

```yaml
workflow_build_command:
  step_1_pre_validation:
    tool: "idumb-security_validate"
    args:
      target_path: "src/commands/idumb/{{command_name}}.md"
      patterns: ["injection", "permissions"]
      mode: "strict"

  step_2_quality_check:
    tool: "idumb-quality_checkErrorHandling"
    args:
      target: "src/commands/idumb/{{command_name}}.md"

  step_3_build:
    condition: "No critical issues"
    action: "Create command file"

  step_4_validate_bash_block:
    tool: "idumb-security_scan"
    args:
      file: "src/commands/idumb/{{command_name}}.md"
```

### Pattern 3: Continuous Monitoring During Session

```yaml
workflow_monitoring:
  trigger: "Every 30 minutes or after 10 file operations"

  step_1_resource_check:
    tool: "idumb-performance_monitor"
    action: "Check .idumb size and report count"

  step_2_cleanup_if_needed:
    condition: "resources.exceed_limits"
    action: "Prompt for cleanup: /idumb:cleanup"

  step_3_drift_check:
    tool: "idumb-quality_validate"
    args:
      target_path: "src/agents/"
      checks: ["documentation"]
```

---

## Activation Matrix Reference

| Operation Type | Security | Quality | Performance | Governance |
|---------------|----------|---------|-------------|------------|
| **Write file** | ✅ Critical | ✅ High | ⚪ Optional | ✅ Critical |
| **Spawn agent** | ✅ Critical | ⚪ Optional | ⚪ Optional | ✅ Critical |
| **Create command** | ✅ Critical | ✅ High | ⚪ Optional | ✅ High |
| **Build agent** | ✅ Critical | ✅ High | ✅ High | ✅ Critical |
| **Phase transition** | ⚪ Optional | ⚪ Optional | ✅ High | ✅ Critical |
| **Commit** | ⚪ Optional | ✅ High | ✅ High | ⚪ Optional |

---

## Risk-Based Activation

### Critical Risk (All Skills)

Operations:
- Building agents
- Phase transitions
- Framework ingestion

```yaml
activated_skills:
  - idumb-security: "full scan"
  - idumb-quality: "full scan"
  - idumb-performance: "full scan"
  - idumb-governance: "permission check"

block_on: "Critical security issues"
```

### High Risk (Security + Quality)

Operations:
- Creating commands with bash
- Deleting META files
- Committing changes

```yaml
activated_skills:
  - idumb-security: "bash injection scan"
  - idumb-quality: "error handling check"

block_on: "Critical security issues"
warn_on: "Missing error handling"
```

### Medium Risk (Security)

Operations:
- Editing existing files
- Creating markdown documents

```yaml
activated_skills:
  - idumb-security: "path traversal check"
  - idumb-governance: "permission check"

block_on: "Permission violations"
```

### Low Risk (Minimal)

Operations:
- Reading files
- Listing directories
- Querying state

```yaml
activated_skills:
  - idumb-governance: "permission check only"

block_on: "Nothing (informational)"
```

---

## Return Format Standards

All skill tools return JSON with this structure:

```json
{
  "status": "pass|fail|partial",
  "issues": [
    {
      "type": "issue-type",
      "severity": "critical|high|medium|low",
      "location": "file:line or component",
      "description": "What the issue is",
      "suggestion": "How to fix it"
    }
  ],
  "summary": {
    "total": 0,
    "by_severity": {
      "critical": 0,
      "high": 0,
      "medium": 0,
      "low": 0
    }
  }
}
```

### Status Meanings

- **pass**: No issues found, operation can proceed
- **fail**: Critical issues found, operation should block
- **partial**: Non-critical issues found, operation can proceed with warnings

---

## Integration Hooks

### Plugin Hooks (idumb-core.ts)

```typescript
// tool.execute.before hook
"tool.execute.before": async (input, output) => {
  if (['write', 'edit'].includes(input.tool)) {
    // Run orchestrator validation
    const result = await idumbOrchestratorPreWrite({
      file_path: input.filePath,
      content: input.content
    })

    if (result.blockers.length > 0) {
      throw new ValidationError(result.blockers.join('; '))
    }
  }
}

// experimental.session.compacting hook
"experimental.session.compacting": async (input, output) => {
  // Inject skill context
  output.context.push(`
## iDumb Validation Context
Active skills: security, code-quality, performance
Recent validation: ${lastValidationResult}
Pending issues: ${pendingIssuesCount}
  `.trim())
}
```

---

## Quick Reference Commands

```bash
# Quick security scan of bash file
/idumb:security-scan src/commands/idumb/deploy.sh

# Full validation before commit
/idumb:orchestrate operation_type="commit" target_path="."

# Phase transition validation
/idumb:phase-transition from="planning" to="execution"

# Resource monitoring
/idumb:performance-monitor

# Documentation check
/idumb:quality-check-docs src/agents/
```

---

*Document: SKILL-INVOCATION-PATTERNS.md - v1.0.0*
