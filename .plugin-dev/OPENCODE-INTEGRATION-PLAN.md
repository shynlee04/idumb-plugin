# OpenCode Plugin Integration Plan for iDumb Skills

**Date**: 2026-02-04
**Version**: 1.0.0
**Status**: Active

---

## Overview

This document defines the integration strategy for making iDumb's validation skills work as an OpenCode plugin package. The skills (idumb-security, idumb-code-quality, idumb-performance, idumb-meta-orchestrator) will be accessible as custom tools and integrated into the META agents (idumb-builder, idumb-meta-builder, idumb-meta-validator).

---

## Architecture

### Plugin Structure

```
.opencode/plugins/idumb-core/
├── index.ts                 # Main plugin entry point
├── tools/
│   ├── idumb-security.ts     # Security validation tool
│   ├── idumb-quality.ts      # Code quality validation tool
│   ├── idumb-performance.ts   # Performance validation tool
│   └── idumb-orchestrator.ts # Meta-orchestrator coordination tool
└── package.json              # Plugin package metadata
```

### Integration Points

```
┌─────────────────────────────────────────────────────────────────┐
│                    OpenCode Plugin System                      │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  iDumb Core Plugin (.opencode/plugins/idumb-core/)       │  │
│  │  ├── Custom Tools (tool.execute.before/after hooks)       │  │
│  │  ├── Message Transform (experimental.chat.messages)        │  │
│  │  ├── Session Compaction (experimental.session.compacting) │  │
│  │  └── Event Bus (event hook for monitoring)               │  │
│  └────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                     iDumb Skills Layer                          │
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

## Tool Specifications

### Tool: idumb-security-validate

**Description**: Validate bash scripts for security vulnerabilities including injection, path traversal, and permission bypass.

```yaml
tool: idumb-security-validate
args:
  target_path:
    description: "File or directory to validate"
    type: string
  patterns:
    description: "Security patterns to check (default: all)"
    type: array
    items:
      type: string
      enum: [injection, traversal, permissions, race-conditions, all]
  mode:
    description: "Validation mode (default: auto)"
    type: string
    enum: [auto, strict, permissive]
```

**Returns**:
```json
{
  "status": "pass|fail|partial",
  "issues": [
    {
      "type": "bash-injection|path-traversal|permission-bypass",
      "severity": "critical|high|medium|low",
      "location": "file:line",
      "description": "Issue description",
      "suggestion": "Fix suggestion"
    }
  ],
  "summary": {
    "total": 0,
    "critical": 0,
    "high": 0,
    "medium": 0,
    "low": 0
  }
}
```

### Tool: idumb-quality-validate

**Description**: Validate code for error handling, cross-platform compatibility, and documentation standards.

```yaml
tool: idumb-quality-validate
args:
  target_path:
    description: "File or directory to validate"
    type: string
  checks:
    description: "Quality checks to perform (default: all)"
    type: array
    items:
      type: string
      enum: [error-handling, cross-platform, documentation, all]
```

**Returns**:
```json
{
  "status": "pass|fail|partial",
  "issues": [
    {
      "type": "missing-error-handling|platform-specific|missing-docs",
      "severity": "high|medium|low",
      "location": "file:line",
      "description": "Issue description",
      "suggestion": "Fix suggestion"
    }
  ]
}
```

### Tool: idumb-performance-validate

**Description**: Validate code for performance issues including inefficient scanning, memory leaks, and infinite loops.

```yaml
tool: idumb-performance-validate
args:
  target_path:
    description: "File or directory to validate"
    type: string
  checks:
    description: "Performance checks to perform (default: all)"
    type: array
    items:
      type: string
      enum: [scanning, cleanup, iteration-limits, all]
```

**Returns**:
```json
{
  "status": "pass|fail|partial",
  "issues": [
    {
      "type": "inefficient-scan|memory-leak|unbounded-loop",
      "severity": "critical|high|medium|low",
      "location": "file:line",
      "description": "Issue description",
      "suggestion": "Fix suggestion"
    }
  ]
}
```

### Tool: idumb-orchestrate-validate

**Description**: Meta-orchestrator that runs appropriate validation based on context, risk level, and file type.

```yaml
tool: idumb-orchestrate-validate
args:
  operation_type:
    description: "Type of operation being performed"
    type: string
    enum: [create, edit, delete, commit, build-agent, build-workflow]
  target_path:
    description: "Target file or directory"
    type: string
  risk_level:
    description: "Risk level (default: auto-detect)"
    type: string
    enum: [critical, high, medium, low, auto]
```

**Returns**:
```json
{
  "status": "pass|fail|partial",
  "activated_skills": ["security", "quality", "performance"],
  "issues": {
    "security": [...],
    "quality": [...],
    "performance": [...]
  },
  "blockers": [],
  "warnings": []
}
```

---

## Agent Integration

### idumb-meta-builder Integration

**New Commands**:
- `/idumb:build-agent` - Create agent with security/quality/performance validation
- `/idumb:build-workflow` - Create workflow with validation checkpoints
- `/idumb:build-command` - Create command with security validation

**Pre-Build Validation**:
```yaml
before_building:
  - "idumb-orchestrate-validate: pre-build check"
  - "Apply BMAD patterns automatically"
  - "Validate against skill requirements"
```

### idumb-builder Integration

**Write Operations**:
```yaml
before_write:
  - "idumb-orchestrate-validate: pre-write validation"
  - "Check security, quality, performance based on risk"
  - "Block on critical issues"
```

### idumb-meta-validator Integration

**Validation Workflow**:
```yaml
validation_steps:
  - "Run security validation"
  - "Run quality validation"
  - "Run performance validation"
  - "Aggregate results"
```

---

## Event Hooks

### tool.execute.before Hook

Intercept tool execution to run pre-validation:

```typescript
"tool.execute.before": async (input, output) => {
  // Intercept write, edit, bash operations
  if (['write', 'edit', 'bash'].includes(input.tool)) {
    // Run orchestrator validation
    const result = await validateBeforeOperation(input, output)
    if (result.blockers.length > 0) {
      throw new ValidationError(result.blockers.join('; '))
    }
  }
}
```

### experimental.session.compacting Hook

Inject skill context into session compaction:

```typescript
"experimental.session.compacting": async (input, output) => {
  output.context.push(`
## iDumb Validation Context

Active skills: security, code-quality, performance, governance
Recent validation: ${lastValidationResult}
Pending issues: ${pendingIssuesCount}
  `.trim())
}
```

---

## TUI Anti-Patterns

### Patterns That Break TUI

1. **Synchronous Long Operations**: Any validation taking >2s blocks TUI rendering
2. **Excessive Output**: Large JSON responses (>10KB) cause display issues
3. **Blocking Hooks**: Throwing errors in `tool.execute.before` without clear messages
4. **Recursive Tool Calls**: Tool calling itself or causing chain reactions

### Plugin Conflict Prevention

1. **Tool Name Collision**: Prefix all custom tools with `idumb-`
2. **Event Hook Overload**: Combine multiple checks in single hook to reduce passes
3. **Resource Contention**: Use async/await properly to prevent blocking
4. **State Pollution**: Don't modify global state; use local scope

---

## Implementation Checklist

- [ ] Create `.opencode/plugins/idumb-core/index.ts`
- [ ] Create `tools/idumb-security.ts`
- [ ] Create `tools/idumb-quality.ts`
- [ ] Create `tools/idumb-performance.ts`
- [ ] Create `tools/idumb-orchestrator.ts`
- [ ] Update `idumb-meta-builder.md` with skill integration
- [ ] Update `idumb-builder.md` with skill integration
- [ ] Update `idumb-meta-validator.md` with skill integration
- [ ] Create usage examples in `.plugin-dev/`
- [ ] Test plugin installation and tool registration
- [ ] Validate TUI compatibility

---

*Document: OPENCODE-INTEGRATION-PLAN.md - v1.0.0*
