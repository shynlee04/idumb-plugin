---
description: "Diagnose and resolve issues in the project or workflow"
id: cmd-debug
parent: commands-idumb
agent: idumb-supreme-coordinator
---

# /idumb:debug

Diagnose and resolve issues in the project or workflow.

<objective>
Apply scientific debugging methodology to systematically diagnose, isolate, and resolve issues. The debugger uses hypothesis-driven investigation, evidence collection, and isolation techniques to identify root causes before proposing fixes. All fixes require validation to confirm resolution without regression.
</objective>

<execution_context>

## Reference Files (Read Before Execution)
- `.idumb/idumb-brain/state.json` - Current governance state and history
- `.idumb/idumb-brain/governance/validations/*.json` - Recent validation reports
- Git history: `git log -10 --oneline` - Recent changes
- Error logs: Application logs, test output, stack traces
- `.planning/phases/*/PLAN.md` - Current phase context

## Agents Involved
| Agent | Role | Mode |
|-------|------|------|
| @idumb-supreme-coordinator | Command entry, routing | primary |
| @idumb-debugger | Scientific debugging | delegated |
| @idumb-low-validator | Diagnostic validation, test execution | hidden |
| @idumb-builder | Fix application (if --auto-fix) | hidden |
| @idumb-verifier | Fix verification | hidden |

</execution_context>

<skills>

## Auto-Activated Skills

When this command is executed, the following skills are automatically activated:

| Skill | Purpose | Activated For |
|-------|---------|--------------|
| `idumb-debug-strategy` | Strategic debugging patterns | debugger, verifier |
| `idumb-validation-reporter` | Standardize debug reports | verifier, low-validator |
| `idumb-codebase-chunker` | Isolate problematic domains | debugger (for code issues) |

## Skill-Driven Flow Control

The debug command forces specific flows through skill activations:

1. **Architecture-Level Debugging** (`idumb-debug-strategy`)
   - `--scope=code --depth=deep` triggers architectural strategy
   - Maps layers, identifies boundaries, checks integration
   - Delegates to idumb-atomic-explorer for domain isolation

2. **Validation Reporting** (`idumb-validation-reporter`)
   - All debug scopes use standardized report format
   - Generates `.idumb/idumb-project-output/debug/REPORT-YYYY-MM-DD.md`

3. **Domain Isolation** (`idumb-codebase-chunker`)
   - When issue spans multiple domains, chunks codebase
   - Each chunk analyzed separately to isolate problem

</skills>

<context>

## Usage

```bash
/idumb:debug [issue-description] [flags]
```

## Flags

| Flag | Description | Values | Default |
|------|-------------|--------|---------|
| `--scope` | Debug scope | `code`, `workflow`, `test`, `performance`, `all` | `code` |
| `--auto-fix` | Apply fixes automatically (simple issues only) | Boolean | `false` |
| `--depth` | Analysis depth | `quick`, `standard`, `deep` | `standard` |
| `--history` | Check recent git changes | Boolean | `true` |
| `--related` | Check for related issues after fix | Boolean | `true` |
| `--isolation` | Run in isolation mode | Boolean | `false` |

## Examples

```bash
# Debug a test failure
/idumb:debug "User API tests failing with 404"

# Debug workflow issue
/idumb:debug "Plan validation failing" --scope=workflow

# Debug with auto-fix for simple issues
/idumb:debug "Type error in auth module" --auto-fix

# Debug performance issue
/idumb:debug "Slow response times" --scope=performance

# Deep debugging with isolation
/idumb:debug "Intermittent crash in payment flow" --depth=deep --isolation
```

## Debug Scopes

### Code (`--scope=code`)
- Syntax errors
- Logic errors
- Type errors
- Runtime exceptions
- Import/export issues
- Null/undefined errors

### Workflow (`--scope=workflow`)
- Command failures
- Agent delegation issues
- State inconsistencies
- Validation failures
- Configuration errors

### Test (`--scope=test`)
- Test failures
- Coverage gaps
- Flaky tests
- Mock issues
- Assertion failures
- Test isolation problems

### Performance (`--scope=performance`)
- Slow operations
- Memory leaks
- Resource contention
- Bottlenecks
- Database query issues
- API latency

</context>

<process>

## Step 1: Collect Symptoms

```yaml
symptom_collection:
  sources:
    user_description: Parse issue description for keywords, error messages
    error_logs: Check recent error output, stack traces
    recent_changes: "git diff HEAD~5" for recent modifications
    state_history: Review idumb-state history for failures
    test_output: Capture failing test details if applicable
    
  extract:
    error_type: Classification (syntax, runtime, logic, config, etc.)
    error_message: Exact error text
    affected_files: Files mentioned in error or stack trace
    trigger_conditions: What causes the issue
    frequency: Always, intermittent, first-time
    
  format_symptoms: |
    ## Symptom Report
    
    **Reported Issue:** {user description}
    **Error Type:** {classified type}
    **Error Message:** {exact message}
    **Affected Files:** {list}
    **Trigger:** {conditions}
    **Frequency:** {always/intermittent}
    **Recent Changes:** {git summary}
```

## Step 2: Delegate to Debugger

```yaml
delegation:
  agent: "@idumb-debugger"
  prompt: |
    ## Debug Task
    
    **Scope:** {scope from flag}
    **Depth:** {depth from flag}
    **Issue History Check:** {history flag}
    
    **Symptoms:**
    {symptom report from Step 1}
    
    **Project Context:**
    - Framework: {from state.json}
    - Current Phase: {current phase}
    - Tech Stack: {from idumb-context}
    
    **Instructions:**
    1. Form initial hypotheses based on symptoms
    2. Rank hypotheses by probability
    3. Design minimal tests to validate/invalidate each
    4. Execute investigation systematically
    5. Isolate root cause with evidence
    6. Propose fix options with effort/risk assessment
    
    **Expected Output:**
    Follow your <structured_returns> DEBUG_REPORT format.
```

## Step 3: Execute Diagnostic Investigation

```yaml
investigation:
  agent: "@idumb-debugger"
  method: scientific
  
  hypothesis_formation:
    - Form 2-4 hypotheses based on symptoms
    - Assign probability to each
    - Order by testability (easiest to test first)
    
  hypothesis_testing:
    for_each_hypothesis:
      - Design minimal test
      - Execute test (read code, run validation, check logs)
      - Record evidence (confirmed, refuted, inconclusive)
      - Update probability based on evidence
      
  isolation:
    techniques:
      - Bisect: Narrow down to specific commit/change
      - Reduce: Create minimal reproduction
      - Substitute: Test with known-good alternatives
      - Trace: Follow execution path step by step
      
  root_cause:
    confirm_when:
      - Single hypothesis explains all symptoms
      - Evidence clearly supports conclusion
      - No contradicting evidence
```

## Step 4: Identify Root Cause(s)

```yaml
root_cause_analysis:
  output:
    primary_cause: Single most likely root cause
    confidence: High (>80%), Medium (50-80%), Low (<50%)
    evidence:
      - {Evidence 1 supporting conclusion}
      - {Evidence 2 supporting conclusion}
    contributing_factors:
      - {Factor 1} - {how it contributes}
      - {Factor 2} - {how it contributes}
    hypotheses_eliminated:
      - {Hypothesis}: {why eliminated}
```

## Step 5: Propose Fixes

```yaml
fix_proposals:
  for_each_cause:
    generate_options:
      count: 2-3 options per cause
      include:
        - Description of fix
        - Effort estimate (trivial, small, medium, large)
        - Risk level (low, medium, high)
        - Side effects (none, contained, widespread)
        - Confidence fix will work (%)
        
    categorize:
      auto_fixable:
        - Simple syntax errors
        - Missing imports
        - Clear type mismatches
        - Formatting issues
        criteria: "Low risk, high confidence, no logic changes"
        
      requires_approval:
        - Logic changes
        - API changes
        - Configuration changes
        - Deletions
        - Changes to multiple files
```

## Step 6: Apply Fix (if requested)

```yaml
fix_application:
  condition: "--auto-fix flag AND fix is auto_fixable"
  OR: "User approves fix"
  
  auto_fix_flow:
    delegate_to: "@idumb-builder"
    instructions:
      - Apply the approved fix
      - Stage changes
      - Prepare commit message: "fix({scope}): {brief description}"
      - Wait for validation before committing
      
  manual_fix_flow:
    present: Fix options with pros/cons
    wait: User selection
    then: Delegate to @idumb-builder
```

## Step 7: Validate Fix

```yaml
fix_validation:
  agent: "@idumb-verifier"
  checks:
    original_issue:
      - Issue no longer reproduces
      - Error message no longer appears
      - Test passes (if test-related)
      
    no_regressions:
      - Run related tests
      - Check affected modules
      - Verify no new errors introduced
      
    code_quality:
      - Lint passes
      - Type check passes
      - No new warnings
      
  on_fail:
    action: Revert changes
    notify: User with validation failure details
    suggestion: Alternative fix approaches
```

## Step 8: Check for Related Issues (if --related)

```yaml
related_issues:
  condition: "--related flag (default true)"
  agent: "@idumb-low-validator"
  
  search:
    - Similar patterns in other files
    - Same error type elsewhere
    - Related code paths that might have same issue
    - Tests that might be affected
    
  report:
    found: List of potential related issues
    recommendation: Fix now or track for later
```

## Step 9: Record and Report

```yaml
state_update:
  tool: idumb-state_history
  action: "debug_completed"
  result: "{pass | fail | partial}"
  metadata: |
    issue: {brief description}
    root_cause: {identified cause}
    fix_applied: {yes/no}
    validation: {pass/fail}
    
report:
  display: Full debug report with evidence
  recommendations: Prevention measures
  next_steps: Suggested follow-up actions
```

</process>

<completion_format>

## DEBUG SESSION COMPLETE

```markdown
# Debug Report

**Session ID:** {debug-YYYY-MM-DD-HHMMSS}
**Issue:** {User-reported issue}
**Scope:** {code | workflow | test | performance}
**Duration:** {time spent}
**Status:** {RESOLVED | PARTIAL | UNRESOLVED}

## Issue Summary

{Brief description of what was wrong}

## Diagnosis

### Root Cause
**Primary:** {Root cause description}
**Confidence:** {High | Medium | Low}

**Evidence:**
1. {Evidence supporting conclusion}
2. {Additional evidence}

### Contributing Factors
- {Factor 1}: {how it contributed}
- {Factor 2}: {how it contributed}

### Hypotheses Tested

| Hypothesis | Probability | Result | Evidence |
|------------|-------------|--------|----------|
| {H1} | 60% | Confirmed | {evidence} |
| {H2} | 30% | Eliminated | {evidence} |
| {H3} | 10% | Not tested | Superseded by H1 |

## Analysis

### Code Examination
\`\`\`{language}
// Problematic code
{relevant code snippet}
\`\`\`

**Issue:** {What's wrong with this code}

### Stack Trace (if applicable)
\`\`\`
{relevant portion of stack trace}
\`\`\`

### Git History (if relevant)
\`\`\`
{commit that introduced issue}
\`\`\`

## Fix Applied

### Solution
{Description of the fix}

### Changes
\`\`\`diff
- {old code}
+ {new code}
\`\`\`

### Commit
- **Hash:** {git commit hash}
- **Message:** fix({scope}): {message}

## Validation

### Original Issue
- [x] Issue no longer reproduces
- [x] Error message cleared

### Regression Check
- [x] Related tests pass
- [x] No new errors introduced
- [x] Lint/type check clean

### Test Results
\`\`\`
{test output summary}
\`\`\`

## Prevention

### Recommendations
1. {How to prevent this issue in future}
2. {Process improvement suggestion}
3. {Test coverage suggestion}

### Related Issues Found
| Location | Issue | Status |
|----------|-------|--------|
| {file} | {similar issue} | Tracked |

## Next Steps

| Action | Command |
|--------|---------|
| Verify fix in production | Manual testing |
| Add regression test | `/idumb:plan-phase --add-task "Add test for {issue}"` |
| Check related issues | `/idumb:debug "{related issue}"` |
```

</completion_format>

<error_handling>

| Error Code | Cause | Resolution |
|------------|-------|------------|
| `D001` | Issue not reproducible | Gather more information, check environment |
| `D002` | Multiple root causes | Address sequentially, starting with highest confidence |
| `D003` | Fix validation failed | Revert and propose alternative fix |
| `D004` | Insufficient context | Run with `--depth=deep`, provide more symptoms |
| `D005` | Auto-fix not applicable | Issue requires manual review, present options |
| `D006` | Cannot isolate root cause | Needs bisect or minimal reproduction |

</error_handling>

<governance>

## Delegation Chain

```
user → supreme-coordinator → high-governance
                                   ↓
                              debugger ←───────┐
                              ↓     ↓          │
                    low-validator  builder     │
                              ↓                │
                           verifier ───────────┘
                           (if fix validation fails)
```

## Validation Points

| Point | Check | Agent |
|-------|-------|-------|
| Pre | Issue is described | supreme-coordinator |
| During | Hypotheses are testable | debugger |
| During | Evidence is collected | debugger |
| Post | Root cause identified | debugger |
| Post | Fix validated | verifier |
| Post | No regressions | low-validator |

## Permission Model

| Agent | Can Delegate | Can Write | Can Read | Can Run Tests |
|-------|--------------|-----------|----------|---------------|
| supreme-coordinator | Yes | No | Yes | No |
| debugger | Yes | No | Yes | Via validator |
| low-validator | No | No | Yes | Yes |
| builder | No | Yes | Yes | No |
| verifier | Yes | No | Yes | Via validator |

## Auto-Fix Safety Rules

Automatic fixes ONLY for:
- Syntax errors with clear fix
- Missing imports
- Type mismatches with obvious resolution
- Formatting issues (lint --fix)

NEVER auto-fix:
- Logic changes
- API/interface changes
- Configuration changes
- Deletions
- Multi-file changes
- Changes requiring domain knowledge

</governance>

<metadata>
```yaml
category: debugging
priority: P0
complexity: high
version: 0.2.0
requires: governance-initialized
outputs:
  - Debug report in conversation
  - Fixes via @idumb-builder (if approved)
  - .idumb/idumb-brain/history/ (debug session record)
```
</metadata>
