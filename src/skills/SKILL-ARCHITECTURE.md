# iDumb Skill Architecture Summary

**Date**: 2026-02-04
**Version**: 1.0.0
**Status**: Active

---

## Overview

The iDumb framework now includes 10 complementary skills that provide comprehensive coverage of compliance, logic, integration, security, performance, and governance. Each skill has a distinct purpose with minimal overlap.

## Skill Registry

| Skill | Package | Primary Domain | Integration Threshold |
|-------|---------|-----------------|----------------------|
| **idumb-meta-orchestrator** | META | Coordination - activates other skills based on context | 30+ |
| **idumb-security** | SECURITY | Security validation (injection, traversal, permissions) | 20+ |
| **idumb-code-quality** | CODE-QUALITY | Error handling, cross-platform, documentation | 20+ |
| **idumb-performance** | PERFORMANCE | Efficiency, cleanup, iteration limits | 15+ |
| **idumb-validation** | VALIDATION | Integration points, gap detection, completeness | 25+ |
| **idumb-governance** | GOVERNANCE | Hierarchy, delegation, state management | 25+ |
| **hierarchical-mindfulness** | MINDFULNESS | Chain integrity, delegation depth | 20+ |
| **idumb-project-validation** | PROJECT | Greenfield/brownfield, health checks | 20+ |
| **idumb-stress-test** | META | Agent coordination, regression sweeps | 25+ |
| **idumb-meta-builder** | META | Framework ingestion, transformation | 30+ |

---

## Domain Coverage Matrix

| Domain | Skills | Coverage |
|--------|--------|----------|
| **Security** | idumb-security, idumb-governance | Bash injection, path traversal, permissions, secrets |
| **Code Quality** | idumb-code-quality | Error handling, cross-platform, documentation, standards |
| **Performance** | idumb-performance | Efficient scanning, cleanup policies, iteration limits |
| **Integration** | idumb-validation, idumb-stress-test | Integration points, gap detection, regression |
| **Governance** | idumb-governance, hierarchical-mindfulness | Hierarchy, delegation, chain integrity, state |
| **Project** | idumb-project-validation | Greenfield/brownfield, health monitoring |
| **Coordination** | idumb-meta-orchestrator | Context-aware skill activation |
| **Meta** | idumb-meta-builder | Framework ingestion and transformation |

---

## Non-Overlapping Design

### idumb-validation vs idumb-stress-test

**Original Concern**: Both skills covered integration point validation

**Resolution**:
- **idumb-validation**: Focuses on **framework-level** validation - ensuring agents, tools, commands have proper integration points (30/15/10 thresholds)
- **idumb-stress-test**: Focuses on **runtime validation** - testing agent coordination, regression sweeps, and behavioral consistency

**Distinct Purposes**:
```yaml
idumb_validation:
  primary: "Structure and integration completeness"
  checks:
    - "Component has required integration points"
    - "Frontmatter schema is valid"
    - "Required fields present"

idumb_stress_test:
  primary: "Runtime behavior and coordination"
  checks:
    - "Agents spawn correctly"
    - "Delegation chains complete"
    - "No regressions introduced"
```

### idumb-governance vs hierarchical-mindfulness

**Original Concern**: Both covered delegation patterns

**Resolution**:
- **idumb-governance**: Framework structure (META vs PROJECT agents), permission matrix, state schema
- **hierarchical-mindfulness**: Session state awareness, delegation depth tracking, chain enforcement during execution

**Distinct Purposes**:
```yaml
idumb_governance:
  primary: "Governance system architecture"
  scope:
    - "Agent category definitions"
    - "Permission matrix rules"
    - "State schema validation"

hierarchical_mindfulness:
  primary: "Runtime delegation mindfulness"
  scope:
    - "Delegation depth tracking"
    - "Session resumption protocols"
    - "Chain violation detection"
```

---

## Code Review Issue Coverage

| Issue Category | Affected Skills | Coverage |
|----------------|-----------------|----------|
| **Bash Script Injection** | idumb-security, idumb-code-quality | ✅ Full |
| **Missing Error Handling** | idumb-code-quality | ✅ Full |
| **Race Conditions** | idumb-security | ✅ Full (atomic writes, file locking) |
| **Infinite Loop Potential** | idumb-performance | ✅ Full (iteration limit validation) |
| **Permission Bypass** | idumb-security, idumb-governance | ✅ Full |
| **Logic Errors** | idumb-validation, idumb-code-quality | ✅ Full |
| **Security Vulnerabilities** | idumb-security | ✅ Full |
| **Performance Issues** | idumb-performance | ✅ Full |
| **Code Quality** | idumb-code-quality | ✅ Full |

---

## Activation Patterns

### Automatic Activation

The **idumb-meta-orchestrator** automatically activates skills based on:

1. **Operation Type**: Write, delegate, transition, cleanup
2. **Risk Level**: Critical, High, Medium, Low
3. **File Type**: .sh, .ts, .md (agent), .md (command), .json
4. **Context**: Phase boundaries, session state, resource usage

### Activation Matrix

```
HIGH RISK OPERATIONS (All skills active):
├── idumb-security: Full scan
├── idumb-code-quality: Full scan
├── idumb-performance: Full scan
├── idumb-validation: Integration check
└── idumb-governance: Permission check

MEDIUM RISK OPERATIONS (Selective activation):
├── idumb-security: Path traversal check
├── idumb-governance: Permission check
└── idumb-performance: Optional

LOW RISK OPERATIONS (Minimal activation):
└── idumb-governance: Permission check only
```

---

## Integration Point Validation

Each skill must meet minimum integration point thresholds:

| Skill Type | Minimum Points | Components |
|------------|---------------|------------|
| **META agents** | 30+ | Tools, commands, workflows, state files, other skills |
| **Validation skills** | 20+ | Read sources, write targets, validation rules, triggers |
| **Package skills** | 20+ | Package components, integration points, triggers |

### idumb-meta-orchestrator Integration Points

```yaml
reads_from:
  - ".idumb/brain/state.json" (current state)
  - "src/skills/*/SKILL.md" (skill registry)
  - ".opencode/agents/idumb-*.md" (agent definitions)

writes_to:
  - ".idumb/brain/governance/orchestration-reports/"
  - ".idumb/brain/governance/validation-queue/"

coordinates:
  - idumb-security
  - idumb-code-quality
  - idumb-performance
  - idumb-validation
  - idumb-governance
  - hierarchical-mindfulness
  - idumb-project-validation
  - idumb-stress-test
  - idumb-meta-builder

triggered_by:
  - All file write operations
  - All agent delegations
  - All phase transitions

total_points: 45+
threshold_met: true
```

---

## Usage Examples

### Pre-Write Validation

```yaml
user_action: "Create new command with bash script"
orchestrator activates:
  - idumb-security: "bash injection scan"
  - idumb-code-quality: "error handling check"
  - idumb-validation: "integration point check"
  - idumb-governance: "permission check"

result: "Pass with warnings" or "Block with issues"
```

### Phase Transition

```yaml
user_action: "Move from planning to execution"
orchestrator activates:
  - idumb-validation: "full integration scan"
  - idumb-stress-test: "regression sweep"
  - idumb-performance: "resource check"

result: "Pass to proceed" or "Block with remaining work"
```

### Continuous Monitoring

```yaml
trigger: "30 minutes of active development"
orchestrator activates:
  - idumb-performance: "resource usage check"
  - idumb-governance: "state consistency"
  - idumb-code-quality: "drift detection (periodic)"

result: "Background health report"
```

---

## Consolidation Recommendations

### No Further Consolidation Needed

The current skill architecture is designed with minimal overlap:

1. **Each skill has a distinct primary domain**
2. **Cross-references exist for coordination, not duplication**
3. **The meta-orchestrator manages activation to prevent redundant checks**

### Existing Overlaps (By Design)

Some overlaps are intentional for robustness:

- **Permission validation**: Both idumb-security and idumb-governance check permissions
  - idumb-security: Validates against security rules
  - idumb-governance: Validates against hierarchy rules

- **Integration validation**: Both idumb-validation and idumb-stress-test check connections
  - idumb-validation: Structure completeness
  - idumb-stress-test: Runtime behavior

These overlaps provide defense-in-depth and are complementary, not redundant.

---

## Maintenance Guidelines

1. **When adding new validation**: Add to the most specific skill, avoid duplication
2. **When modifying skills**: Update integration point counts
3. **When adding new packages**: Follow the package naming convention (SECURITY, CODE-QUALITY, etc.)
4. **When triggers change**: Update the meta-orchestrator activation matrix

---

*Document: SKILL-ARCHITECTURE.md - v1.0.0*
