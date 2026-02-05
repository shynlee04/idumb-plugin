---
name: idumb-validation
description: Validates iDumb plugin functionality through systematic pivotal trials and stress testing. Ensures all success criteria are met with concrete evidence. Use when testing any iDumb component or before considering implementation complete.
---

# iDumb Validation Protocol

## Validation Philosophy

Every capability must be proven through systematic testing, not assumed from implementation. Evidence over speculation.

## Pivotal Trial Validation Process

### Before Starting Any Trial

1. **Define Success Criteria**: List exactly what must be demonstrated
2. **Design Concrete Test Steps**: Specific actions that will prove/disprove each criterion
3. **Establish Evidence Standards**: What constitutes proof of success/failure
4. **Plan Measurement Approach**: How to capture performance metrics

### During Trial Execution

1. **Document Everything**: Record each step, result, and measurement
2. **Capture Evidence**: Screenshots, logs, timing measurements, behavioral observations
3. **Compare Against Criteria**: Explicitly check each success criterion
4. **Record Failures**: Document what didn't work and why

### After Trial Completion

1. **Compile Evidence**: Organize all proof materials
2. **Make Pass/Fail Determination**: Based on documented evidence only
3. **Document Learnings**: What worked, what didn't, what to improve
4. **Update Principles Registry**: Add new validated principles or mark failures

## Stress Test Execution Protocol

### STRESS-001: Feature Request Bombardment
**Setup**: 3 anchors established, implementation phase
**Actions**: 20+ contradictory feature requests
**Validation**: Anchors survive, agent acknowledges contradictions, suggests clarification

### STRESS-002: Code Dump Context Pollution
**Setup**: Fresh session, 50KB code injection
**Actions**: Read large files, force compaction, request continuation
**Validation**: Critical analysis anchored, post-compaction recall, proper pruning

### STRESS-003: Delegation Chain Survival
**Setup**: 3-level delegation planned
**Actions**: Delegate research, bombard with questions, force compactions
**Validation**: Results persist to disk, agent retrieves without re-delegation

### STRESS-004: Rapid Signal Cascade
**Setup**: Decision scorer enabled, 60 threshold
**Actions**: 20+ contradictory messages rapidly
**Validation**: Score triggers intervention, collector spawns, TUI feedback shows

### STRESS-005: Focus Directive Survival
**Setup**: 3 attention directives set
**Actions**: 50KB content, 20+ compactions, reference original points
**Validation**: Directives survive, agent recalls specific turns/artifacts

## Evidence Collection Standards

### Performance Metrics
```
Timing Format:
Operation: [description]
Start: [timestamp]
End: [timestamp]
Duration: [milliseconds]
Requirement: [< 100ms]
Status: PASS/FAIL
```

### Behavioral Evidence
```
Scenario: [situation]
Expected: [required behavior]
Observed: [actual behavior]
Evidence: [screenshots/logs/observations]
Status: PASS/FAIL
```

### Compatibility Verification
```
Test: [integration point]
With: [default OpenCode agents]
Result: [successful interaction/conflict]
Evidence: [specific proof]
Status: PASS/FAIL
```

## Validation Report Template

```
## Trial [X]: [Title]

**Date**: [YYYY-MM-DD]
**Duration**: [time spent]
**Participants**: [who was involved]

### Success Criteria
1. [Criterion 1] - STATUS: PASS/FAIL - EVIDENCE: [specific proof]
2. [Criterion 2] - STATUS: PASS/FAIL - EVIDENCE: [specific proof]
3. [Criterion 3] - STATUS: PASS/FAIL - EVIDENCE: [specific proof]

### Performance Results
- Scoring Speed: [Xms] (Requirement: < 100ms) - PASS/FAIL
- Compaction Survival: [X/Y anchors survived] - PASS/FAIL
- TUI Responsiveness: [response time] - PASS/FAIL

### Issues Found
- [Issue 1]: [description and impact]
- [Issue 2]: [description and impact]

### Recommendations
- [Immediate actions needed]
- [Future improvements]
- [Architecture adjustments]

### Overall Status
TRIAL STATUS: PASS/FAIL
BLOCKING ISSUES: YES/NO
NEXT STEPS: [specific actions]
```

## Regression Testing Protocol

Before any new implementation:

1. **Identify Affected Components**: Which existing functionality might be impacted
2. **Run Related Trials**: Execute trials for potentially affected capabilities
3. **Compare Baseline**: Ensure no degradation in previously validated functionality
4. **Document Changes**: Record any behavioral differences

## Quality Gate Checklist

Before considering any implementation complete:

- [ ] All 8 pivotal trials executed and documented
- [ ] All 5 stress tests passed with concrete evidence
- [ ] Performance requirements verified (< 100ms scoring)
- [ ] No regressions in existing validated functionality
- [ ] Works with default OpenCode agents only
- [ ] Zero console.log pollution
- [ ] 100% TypeScript strict compliance
- [ ] Zero lint errors
- [ ] All success criteria have specific evidence

## Failure Response Protocol

When trials fail:

1. **Document the Failure**: Capture exact conditions and evidence
2. **Engage Architects**: Work with idumb-architect to identify root cause
3. **Design Fix**: Create specific solution addressing the failure
4. **Retest**: Execute the trial again with the fix
5. **Verify No Regressions**: Ensure fix doesn't break other validated functionality
6. **Update Documentation**: Record the issue and resolution

Never proceed to the next phase with failing pivotal trials. Each trial represents a fundamental capability that must work for the system to be considered successful.