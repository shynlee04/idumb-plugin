---
description: "Verify completion of work against acceptance criteria"
id: cmd-verify-work
parent: commands-idumb
agent: idumb-supreme-coordinator
---

# /idumb:verify-work

Verify completion of work against acceptance criteria.

## Usage

```
/idumb:verify-work [scope=phase|task|all] [--strict] [--evidence]
```

## Description

Comprehensive verification that work meets requirements:
- Checks acceptance criteria
- Validates file changes
- Runs tests
- Verifies no regressions
- Produces verification report

## Workflow

```yaml
steps:
  1_determine_scope:
    action: Identify verification scope
    options:
      - specific_task
      - specific_phase
      - all_work
      
  2_load_criteria:
    action: Load acceptance criteria
    sources:
      - plan.md
      - task_definitions
      - user_requirements
      
  3_delegate_verifier:
    action: Delegate to verifier agent
    agent: idumb-verifier
    inputs:
      - scope
      - criteria
      - expected_outputs
      
  4_run_checks:
    action: Execute verification checks
    parallel: true
    checks:
      - file_existence
      - content_validation
      - test_execution
      - regression_check
      - integration_check
      
  5_collect_evidence:
    action: Gather verification evidence
    for_each: check
    collect:
      - status
      - output
      - artifacts
      
  6_generate_report:
    action: Create verification report
    format: markdown
    sections:
      - summary
      - detailed_results
      - evidence
      - recommendations
      
  7_update_state:
    action: Record verification results
    tool: idumb-state:history
    action_name: verification_completed
    result: "<pass|fail|partial>"
    
  8_report:
    action: Display verification summary
```

## Arguments

| Argument | Description | Default |
|----------|-------------|---------|
| `scope` | What to verify | `phase` |
| `--strict` | Fail on warnings | `false` |
| `--evidence` | Include full evidence | `true` |
| `--tests` | Run test suite | `true` |
| `--regression` | Check for regressions | `true` |

## Verification Checks

### File Existence
- All expected files created
- No unexpected deletions
- Correct file locations

### Content Validation
- Code follows patterns
- Documentation complete
- Configuration valid

### Test Execution
- Unit tests pass
- Integration tests pass
- Coverage maintained

### Regression Check
- Existing functionality works
- No breaking changes
- Performance not degraded

### Integration Check
- Components work together
- APIs functional
- Data flows correctly

## Verification Report

```markdown
# Verification Report

## Summary
**Scope:** Phase 2
**Status:** ✅ PASS
**Date:** 2026-02-03

## Results
| Check | Status | Details |
|-------|--------|---------|
| File Existence | ✅ Pass | 15/15 files found |
| Content Validation | ✅ Pass | All patterns match |
| Test Execution | ✅ Pass | 45/45 tests pass |
| Regression Check | ✅ Pass | No regressions |
| Integration Check | ✅ Pass | All integrations work |

## Evidence
### File Existence
```
src/api/users.ts - EXISTS
src/api/auth.ts - EXISTS
...
```

## Recommendations
- None - all checks passed
```

## Examples

```bash
# Verify current phase
/idumb:verify-work

# Verify specific task
/idumb:verify-work task P2-T5

# Strict verification
/idumb:verify-work --strict

# Verify all work
/idumb:verify-work all
```

## Status Levels

| Status | Description | Action |
|--------|-------------|--------|
| `pass` | All checks passed | Proceed |
| `partial` | Some checks passed | Review warnings |
| `fail` | Critical checks failed | Fix and retry |

## Error Handling

| Error | Cause | Resolution |
|-------|-------|------------|
| `V001` | No work to verify | Complete work first |
| `V002` | Criteria not defined | Define acceptance criteria |
| `V003` | Tests failed | Fix failing tests |
| `V004` | Regression detected | Investigate and fix |

## Related Commands

- `/idumb:execute-phase` - Execute work
- `/idumb:debug` - Debug failures
- `/idumb:validate` - Run validation

## Governance

**Delegation Chain:**
```
user → supreme-coordinator → high-governance → verifier
  ├─→ low-validator (file checks)
  └─→ builder (test execution)
```

**Validation Points:**
- Pre: Work completed
- Post: All checks executed
- Post: Evidence collected
- Post: Report generated

## Metadata

```yaml
category: verification
priority: P1
complexity: medium
version: 0.1.0
```
