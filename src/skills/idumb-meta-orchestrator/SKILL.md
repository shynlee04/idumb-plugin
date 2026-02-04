---
name: idumb-meta-orchestrator
description: "META-ORCHESTRATOR for iDumb framework - master coordinator that activates appropriate validation skills (security, code-quality, performance, validation, governance) based on context, operation type, and risk level. Use when: coordinating multi-skill validation, determining which checks to run, or orchestrating framework-level operations."
version: 1.0.0
license: MIT
metadata:
  audience: ai-agents
  workflow: meta-orchestration
  package: META
  activation: automatic
  modes:
    - pre-write: "Before file modifications"
    - pre-delegate: "Before agent spawning"
    - phase-transition: "At phase boundaries"
    - continuous: "Background monitoring"
---

# iDumb Meta Orchestrator (META Package)

<purpose>
I am the META-ORCHESTRATOR that coordinates all iDumb validation skills. I analyze context, risk level, and operation type to automatically activate the appropriate combination of security, code-quality, performance, and validation checks.
</purpose>

<philosophy>
## Core Principles

1. **Context-Aware Activation**: Different operations require different validation combinations
2. **Risk-Based Selection**: High-risk operations trigger more comprehensive checks
3. **Non-Blocking By Default**: Validation informs, rarely blocks development
4. **Incremental Escalation**: Start with fast checks, escalate only if issues found
5. **Evidence-Based Reporting**: Every validation returns structured proof
</philosophy>

---

## Skill Registry

The meta-orchestrator coordinates these validation skills:

| Skill | Package | Purpose | Trigger |
|-------|---------|---------|---------|
| **idumb-security** | SECURITY | Bash injection, path traversal, permissions | Pre-write, pre-delegate |
| **idumb-code-quality** | CODE-QUALITY | Error handling, cross-platform, docs | Pre-commit, code review |
| **idumb-performance** | PERFORMANCE | Efficient scanning, cleanup, iteration limits | Continuous, post-operation |
| **idumb-validation** | VALIDATION | Integration points, gap detection, completeness | Phase transitions |
| **idumb-governance** | GOVERNANCE | Hierarchy, delegation, state management | Pre-delegate, session start |
| **hierarchical-mindfulness** | MINDFULNESS | Chain integrity, delegation depth | All delegations |
| **idumb-project-validation** | PROJECT | Greenfield/brownfield, health checks | Project operations |
| **idumb-stress-test** | META | Agent coordination, regression sweeps | Phase transitions, certification |
| **idumb-meta-builder** | META | Framework ingestion, transformation | External framework integration |

---

## Activation Matrix

<activation_matrix>
### By Operation Type

| Operation | Security | Quality | Performance | Validation | Governance |
|-----------|----------|---------|-------------|------------|------------|
| **Write file** | ✅ Critical | ✅ High | ⚪ Optional | ⚪ Optional | ✅ Critical |
| **Spawn agent** | ✅ Critical | ⚪ Optional | ⚪ Optional | ⚪ Optional | ✅ Critical |
| **Create command** | ✅ Critical | ✅ High | ⚪ Optional | ✅ High | ⚪ Optional |
| **Create tool** | ⚪ Optional | ✅ High | ⚪ Optional | ✅ High | ⚪ Optional |
| **Phase transition** | ⚪ Optional | ⚪ Optional | ⚪ Optional | ✅ Critical | ✅ High |
| **Framework ingest** | ✅ High | ✅ High | ⚪ Optional | ✅ Critical | ✅ Critical |
| **Cleanup** | ⚪ Optional | ⚪ Optional | ✅ Critical | ⚪ Optional | ⚪ Optional |

### By Risk Level

| Risk | Security | Quality | Performance | Validation | Governance |
|------|----------|---------|-------------|------------|------------|
| **Critical** | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| **High** | ✅ Full | ✅ High | ✅ High | ✅ High | ✅ High |
| **Medium** | ✅ High | ⚪ Optional | ⚪ Optional | ⚪ Optional | ⚪ Optional |
| **Low** | ⚪ Optional | ⚪ Optional | ⚪ Optional | ⚪ Optional | ⚪ Optional |

### By File Type

| File Type | Security | Quality | Performance | Validation | Governance |
|-----------|----------|---------|-------------|------------|------------|
| **.sh (bash)** | ✅ Critical | ✅ Critical | ⚪ Optional | ⚪ Optional | ⚪ Optional |
| **.ts (tool)** | ⚪ Optional | ✅ Critical | ⚪ Optional | ✅ High | ⚪ Optional |
| **.md (agent)** | ⚪ Optional | ✅ High | ⚪ Optional | ✅ Critical | ✅ Critical |
| **.md (command)** | ✅ Critical | ✅ High | ⚪ Optional | ✅ High | ⚪ Optional |
| **.md (workflow)** | ⚪ Optional | ⚪ Optional | ⚪ Optional | ✅ Critical | ✅ High |
| **.json (state)** | ✅ High | ⚪ Optional | ✅ High | ✅ High | ✅ Critical |
</activation_matrix>

---

## Orchestration Workflows

<orchestration_workflow name="pre-write-validation">
### Pre-Write Validation Workflow

Triggered before any file write operation.

```yaml
pre_write_workflow:
  step_1_classify:
      input: "file path, content type"
      output: "risk_level, file_type"

  step_2_select_checks:
      if_risk_critical:
          - "security: full scan"
          - "quality: full scan"
          - "performance: full scan"
          - "validation: integration check"
          - "governance: permission check"

      if_risk_high:
          - "security: bash injection scan"
          - "quality: error handling check"
          - "governance: permission check"

      if_risk_medium:
          - "security: path traversal check"
          - "governance: permission check"

      if_risk_low:
          - "governance: permission check"

  step_3_execute_parallel:
      parallel_run: "all selected checks"
      timeout: 30  # seconds

  step_4_aggregate_results:
      output:
          status: "pass | fail | partial"
          issues: "list of detected issues"
          blockers: "issues that prevent write"
          warnings: "issues that allow write with notice"

  step_5_decision:
      if_blockers_exist:
          action: "block write"
          require: "--force override"

      if_warnings_exist:
          action: "allow write with warning"

      if_no_issues:
          action: "proceed with write"
```
</orchestration_workflow>

<orchestration_workflow name="pre-delegate-validation">
### Pre-Delegate Validation Workflow

Triggered before delegating to another agent.

```yaml
pre_delegate_workflow:
  step_1_validate_hierarchy:
      check: "idumb-governance or hierarchical-mindfulness"
      validate:
          - "Parent agent exists"
          - "Delegation path is valid"
          - "Delegation depth < 5"

  step_2_validate_permissions:
      check: "idumb-governance"
      validate:
          - "Parent has task: allow"
          - "Child agent exists"
          - "Operation within child's scope"

  step_3_validate_operation:
      check: "idumb-security"
      validate:
          - "Target directory allowed for parent"
          - "Target directory allowed for child"
          - "No permission bypass"

  step_4_decision:
      if_all_pass:
          action: "allow delegation"

      if_any_fail:
          action: "block delegation"
          report: "specific violation"
```
</orchestration_workflow>

<orchestration_workflow name="phase-transition-validation">
### Phase Transition Validation Workflow

Triggered at phase boundaries.

```yaml
phase_transition_workflow:
  step_1_run_comprehensive_validation:
      parallel_execute:
          - "idumb-validation: integration matrix"
          - "idumb-validation: gap detection"
          - "idumb-stress-test: agent coordination"
          - "idumb-performance: resource check"

  step_2_completion_check:
      require:
          - "All critical gaps resolved"
          - "Integration points >= threshold"
          - "No regressions detected"

  step_3_anchor_transition:
      action: "Create checkpoint anchor"
      content:
          - "Phase being completed"
          - "Validation results"
          - "Next phase requirements"

  step_4_decision:
      if_ready:
          action: "allow phase transition"
          update_state: "new phase"

      if_not_ready:
          action: "block transition"
          report: "remaining work"
```
</orchestration_workflow>

<orchestration_workflow name="continuous-monitoring">
### Continuous Monitoring Workflow

Background monitoring for health and drift.

```yaml
continuous_monitoring_workflow:
  triggers:
      - "Every 30 minutes of active development"
      - "After 10+ file modifications"
      - "When context window > 80%"

  checks:
      lightweight:
          - "idumb-performance: resource usage"
          - "idumb-governance: state consistency"

      periodic:
          - "idumb-performance: cleanup old records"
          - "idumb-code-quality: check for drift"

      on_drift_detected:
          - "idumb-validation: scan for gaps"
          - "idumb-governance: verify hierarchy"
```
</orchestration_workflow>

---

## Skill Activation Rules

<activation_rules>
### Rule 1: Critical Security First

**When**: Any bash script, file path with variables, or permission check

```yaml
activate:
  - "idumb-security: injection scan"
  - "idumb-security: path traversal check"
  - "idumb-security: permission validation"

block_on: "CRITICAL security issues"
```

### Rule 2: Code Quality on Creation

**When**: Creating new tools, commands, or agents

```yaml
activate:
  - "idumb-code-quality: error handling check"
  - "idumb-code-quality: documentation check"
  - "idumb-validation: integration point check"

warn_on: "Missing documentation or error handling"
```

### Rule 3: Performance on Batch Operations

**When**: Operations affecting 10+ files or >5 seconds

```yaml
activate:
  - "idumb-performance: scan efficiency check"
  - "idumb-performance: iteration limit check"

suggest: "Optimization opportunities"
```

### Rule 4: Validation at Boundaries

**When**: Phase transitions, milestone completions, commits

```yaml
activate:
  - "idumb-validation: full integration scan"
  - "idumb-stress-test: regression sweep"
  - "idumb-governance: state validation"

block_on: "Critical gaps or regressions"
```

### Rule 5: Governance on Delegation

**When**: Any agent delegation

```yaml
activate:
  - "hierarchical-mindfulness: chain integrity check"
  - "idumb-governance: permission matrix check"

block_on: "Chain violations or permission bypass"
```
</activation_rules>

---

## Quick Reference

### Orchestration Commands

```bash
# Run pre-write validation
idumb-orchestrate pre-write --file <path>

# Run pre-delegate validation
idumb-orchestrate pre-delegate --parent <agent> --child <agent>

# Run phase transition validation
idumb-orchestrate phase-transition --from <phase> --to <phase>

# Run continuous monitoring
idumb-orchestrate monitor

# Run comprehensive validation
idumb-orchestrate validate-all
```

### Integration Points

```yaml
reads_from:
  - ".idumb/idumb-brain/state.json" (current state)
  - "src/skills/*/SKILL.md" (skill registry)
  - ".opencode/agents/idumb-*.md" (agent definitions)

writes_to:
  - ".idumb/idumb-brain/governance/orchestration-reports/"
  - ".idumb/idumb-brain/governance/validation-queue/"

coordinates:
  - "idumb-security"
  - "idumb-code-quality"
  - "idumb-performance"
  - "idumb-validation"
  - "idumb-governance"
  - "hierarchical-mindfulness"
  - "idumb-project-validation"
  - "idumb-stress-test"
  - "idumb-meta-builder"

triggered_by:
  - "All file write operations"
  - "All agent delegations"
  - "All phase transitions"
  - "User commands: /idumb:validate, /idumb:stress-test"
```

---

*Skill: idumb-meta-orchestrator v1.0.0 - META Package*
