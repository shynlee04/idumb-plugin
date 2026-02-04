---
description: "Show current iDumb governance state, active anchors, and validation history"
agent: idumb-supreme-coordinator
---

# iDumb Status Report

Generate a comprehensive status report of the current governance state.

## YOUR TASK

1. **Read current state:**
   - Load `.idumb/brain/state.json`
   - Parse current phase, anchors, last validation

2. **Check governance health:**
   - Delegate to @idumb-low-validator:
     ```
     @idumb-low-validator
     Check: governance integrity
     Method: validate state.json, check .idumb/ structure
     Return: pass/fail with issues
     ```

3. **Gather context age:**
   - Check age of all files in `.idumb/`
   - Flag anything older than 48 hours
    - Check if planning files exist and their state

4. **Report format:**
   ```yaml
   status:
     initialized: true/false
     version: "0.1.0"
     phase: [current phase]
      framework: planning/bmad/custom
     
   governance:
     last_validation: [timestamp]
     validation_count: [number]
     active_anchors: [count]
     
   health:
     state_file: ok/missing/stale
     brain_dir: ok/missing
     governance_dir: ok/missing
     stale_files: [list if any > 48h]
     
   hierarchy:
     coordinator: idumb-supreme-coordinator (primary)
     governance: idumb-high-governance (all)
     validator: idumb-low-validator (hidden)
     builder: idumb-builder (hidden)
     
    planning_integration:
     detected: true/false
     planning_dir: exists/missing
     roadmap: exists/missing
     state: exists/missing
     
   recommendations:
     - [any actions needed]
   ```

## CRITICAL RULES

- ALWAYS delegate validation checks to @idumb-low-validator
- NEVER modify state during status check
- Report honestly - don't hide issues

$ARGUMENTS
