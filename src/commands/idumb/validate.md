---
description: "Run full validation hierarchy - checks governance state, context integrity, and planning alignment"
agent: idumb-supreme-coordinator
---

# iDumb Validation

Run the full validation hierarchy to verify governance integrity.

## YOUR TASK

1. **Delegate to @idumb-high-governance:**
   ```
   @idumb-high-governance
   Execute: full governance validation
   Scope: $ARGUMENTS (or "all" if empty)
   Requirements:
     - Validate .idumb/ structure integrity
     - Validate state.json schema
     - Validate anchor freshness
      - Check for stale context (>48h)
      - If planning artifacts: validate alignment with .planning/
    Report: detailed validation results
   ```

2. **Synthesize results:**
   - Collect all validation reports
   - Identify critical issues vs warnings
   - Determine overall pass/fail

3. **Update state:**
   - Record validation timestamp
   - Store validation result
   - Update anchor if issues found

4. **Report format:**
   ```yaml
   validation:
     timestamp: [now]
     scope: [all/specific]
     overall: pass/fail/warning
     
   checks:
     structure:
       status: pass/fail
       details: [any issues]
       
     state_schema:
       status: pass/fail
       details: [any issues]
       
     anchor_freshness:
       status: pass/fail
       stale_anchors: [list if any]
       
     context_age:
       status: pass/fail
       stale_files: [list if any > 48h]
       
      planning_alignment:
        status: pass/fail/skipped
        details: [alignment issues]
       
   critical_issues: [list]
   warnings: [list]
   
   recommendation:
     action: [what to do next]
     priority: high/medium/low
   ```

## VALIDATION LEVELS

- **Structure**: File/directory presence
- **Schema**: JSON validity, required fields
- **Freshness**: Context age < 48h
- **Alignment**: Planning state matches iDumb state
- **Integrity**: No corrupted or inconsistent data

## CRITICAL RULES

- ALWAYS delegate actual checks to @idumb-low-validator
- NEVER assume pass - require evidence
- Update state with validation results
- Anchor critical findings

$ARGUMENTS
