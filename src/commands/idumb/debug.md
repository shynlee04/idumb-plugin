---
description: "Diagnose and resolve issues in the project or workflow"
id: cmd-debug
parent: commands-idumb
agent: idumb-supreme-coordinator
---

# /idumb:debug

Diagnose and resolve issues in the project or workflow.

## Usage

```
/idumb:debug [issue-description] [--scope=code|workflow|test|performance] [--auto-fix]
```

## Description

Intelligent debugging that:
- Analyzes error patterns
- Examines relevant code/context
- Identifies root causes
- Proposes and applies fixes
- Validates resolutions

## Workflow

```yaml
steps:
  1_collect_symptoms:
    action: Gather issue information
    sources:
      - user_description
      - error_logs
      - recent_changes
      - state_history
      
  2_delegate_debugger:
    action: Delegate to debugger agent
    agent: idumb-debugger
    inputs:
      - symptoms
      - scope
      - context
      
  3_diagnose:
    action: Perform diagnostic analysis
    steps:
      - pattern_matching
      - code_examination
      - dependency_check
      - state_validation
      
  4_identify_causes:
    action: Determine root causes
    output:
      - primary_cause
      - contributing_factors
      - confidence_level
      
  5_propose_fixes:
    action: Generate fix options
    for_each: identified_cause
    propose:
      - fix_description
      - effort_estimate
      - risk_assessment
      
  6_apply_fixes:
    action: Apply selected fixes
    if: auto_fix_enabled or user_approved
    delegate_to: builder
    
  7_validate_fix:
    action: Verify issue resolved
    agent: low-validator
    checks:
      - original_issue_fixed
      - no_new_issues
      - tests_pass
      
  8_update_state:
    action: Record debug session
    tool: idumb-state:history
    action_name: debug_completed
    result: "<pass|fail>"
    
  9_report:
    action: Display debug report
```

## Arguments

| Argument | Description | Default |
|----------|-------------|---------|
| `issue` | Description of the issue | Required |
| `--scope` | Debug scope | `code` |
| `--auto-fix` | Apply fixes automatically | `false` |
| `--depth` | Analysis depth | `standard` |
| `--history` | Check recent changes | `true` |

## Debug Scopes

### Code
- Syntax errors
- Logic errors
- Type errors
- Runtime exceptions

### Workflow
- Command failures
- Agent delegation issues
- State inconsistencies
- Validation failures

### Test
- Test failures
- Coverage gaps
- Flaky tests
- Mock issues

### Performance
- Slow operations
- Memory leaks
- Resource contention
- Bottlenecks

## Debug Report

```markdown
# Debug Report

## Issue
[Description of the issue]

## Diagnosis
**Primary Cause:** [Root cause]
**Confidence:** [High/Medium/Low]
**Contributing Factors:**
- [Factor 1]
- [Factor 2]

## Analysis
### Code Examination
[Relevant code sections]

### Pattern Matching
[Matched error patterns]

### State Check
[State validation results]

## Proposed Fixes
### Option 1: [Description]
**Effort:** [Estimate]
**Risk:** [Low/Med/High]
**Approach:** [Details]

### Option 2: [Description]
...

## Applied Fix
[If fix was applied]

## Validation
**Status:** [Pass/Fail]
**Evidence:** [Test results, etc.]

## Prevention
[Recommendations to prevent recurrence]
```

## Examples

```bash
# Debug a test failure
/idumb:debug "User API tests failing with 404"

# Debug workflow issue
/idumb:debug "Plan validation failing" --scope=workflow

# Debug with auto-fix
/idumb:debug "Type error in auth module" --auto-fix

# Debug performance issue
/idumb:debug "Slow response times" --scope=performance
```

## Auto-Fix Rules

Auto-fix is applied for:
- Simple syntax errors
- Missing imports
- Type mismatches (with clear fixes)
- Formatting issues

Requires approval for:
- Logic changes
- API changes
- Configuration changes
- Deletions

## Error Handling

| Error | Cause | Resolution |
|-------|-------|------------|
| `D001` | Issue not reproducible | Gather more information |
| `D002` | Multiple root causes | Address sequentially |
| `D003` | Fix validation failed | Revert and retry |
| `D004` | Insufficient context | Run with --depth=deep |

## Related Commands

- `/idumb:verify-work` - Verify after fix
- `/idumb:validate` - Run validation
- `/idumb:status` - Check system status

## Governance

**Delegation Chain:**
```
user → supreme-coordinator → high-governance → debugger
  ├─→ low-validator (diagnostics)
  └─→ builder (fix application)
```

**Validation Points:**
- Pre: Issue described
- Post: Root cause identified
- Post: Fix validated
- Post: No regressions

## Metadata

```yaml
category: debugging
priority: P0
complexity: high
version: 0.1.0
```
