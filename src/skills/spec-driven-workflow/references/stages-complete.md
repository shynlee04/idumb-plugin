# Complete Stage Reference

Full specification of all 56 sub-stages with entry conditions, agents, validation gates, hop paths, and outputs.

## Stage 0: Discovery & Routing

### 0.1 Entry Detection

```yaml
stage: "0.1"
name: "Entry Detection"
purpose: "Identify how workflow was triggered"

entry_conditions:
  - "User invoked command"
  - "OR Agent detected implementation request"
  - "OR Workflow continuation from checkpoint"

agent: "@idumb-project-explorer"
tools: ["idumb-context", "idumb-state"]

actions:
  - Detect entry type: manual | agent_trigger | continuation
  - Extract initial request context
  - Check for existing checkpoint to resume

outputs:
  - entry_type: "manual | agent_trigger | continuation"
  - initial_context: "{extracted context}"
  - checkpoint_ref: "{path or null}"

validation_gate:
  name: "Entry Identified"
  checks:
    - "Entry type is one of: manual, agent_trigger, continuation"
  on_fail: "Ask user to clarify request"

hop_paths:
  - condition: "Entry includes clear, complete idea"
    hop_to: "1.1"
    skip: []
  - condition: "Continuation from checkpoint"
    hop_to: "{checkpoint.last_stage}"
    skip: "all prior stages"
```

### 0.2 Codebase State Analysis

```yaml
stage: "0.2"
name: "Codebase State Analysis"
purpose: "Classify project type for routing"

entry_conditions:
  - "0.1 complete"

agent: "@idumb-project-explorer"
tools: ["idumb-context", "glob", "read"]

actions:
  - Check for src/, lib/, app/ directories
  - Analyze package.json, requirements.txt, go.mod
  - Detect framework markers
  - Count existing code files
  - Check for .planning/, .idumb/ directories

outputs:
  - codebase_state: "greenfield | brownfield | modernize | hybrid"
  - detected_sector: "{sector_id}"
  - detected_stack: "{stack_info}"
  - file_count: "{number}"
  - CODEBASE-STATE.json

validation_gate:
  name: "State Classified"
  checks:
    - "codebase_state is valid enum"
    - "detected_sector matches known sectors"
  on_fail: "Default to 'brownfield' with warning"

hop_paths:
  - condition: "greenfield + no existing planning"
    hop_to: "1.1"
    context: "Fresh start"
```

### 0.3 Research Tool Inventory

```yaml
stage: "0.3"
name: "Research Tool Inventory"
purpose: "Verify research capability before proceeding"

entry_conditions:
  - "0.2 complete"

agent: "@idumb-project-explorer"
tools: ["bash", "idumb-config"]

actions:
  - Check for Context7 availability
  - Check for Deepwiki availability
  - Check for Tavily/Exa availability
  - Check for Brave Search availability
  - Count available tools
  - Compare against complexity requirements

outputs:
  - tools_available: ["context7", "deepwiki", ...]
  - tool_count: "{number}"
  - tier: "full | standard | degraded | blocked"
  - TOOL-INVENTORY.json

validation_gate:
  name: "Research Capability Gate"
  checks:
    - "tool_count >= min_for_complexity"
  on_fail:
    action: "Show installation guide"
    block: true
    message: |
      Research requires at least {min} tools.
      
      FREE options:
      1. Context7: npx -y @anthropic/context7-mcp
      2. Deepwiki: [installation instructions]
      
      Install and retry.

hop_paths:
  - condition: "tool_count == 0"
    hop_to: "BLOCKED"
    action: "Cannot proceed without tools"
  - condition: "simple complexity + 1 tool"
    hop_to: "0.4"
    flag: "degraded_research"
```

### 0.4 User Settings Load

```yaml
stage: "0.4"
name: "User Settings Load"
purpose: "Load user preferences and governance settings"

entry_conditions:
  - "0.3 complete (not blocked)"

agent: "@idumb-project-explorer"
tools: ["idumb-config", "idumb-state"]

actions:
  - Load .idumb/brain/config.json
  - Extract research_threshold preference
  - Extract language preferences
  - Extract automation level
  - Apply defaults for missing settings

outputs:
  - config_loaded: true
  - research_threshold: "low | medium | high"
  - automation_level: "manual | semi | auto"
  - language: "{language_code}"

validation_gate:
  name: "Config Valid"
  checks:
    - "Config file parseable OR defaults applied"
  on_fail: "Apply all defaults, warn user"
```

### 0.5 Complexity Pre-Assessment

```yaml
stage: "0.5"
name: "Complexity Pre-Assessment"
purpose: "Estimate complexity for governance scaling"

entry_conditions:
  - "0.4 complete"

agent: "@idumb-project-explorer"
tools: ["idumb-context", "idumb-validate"]

actions:
  - Analyze request scope
  - Estimate file count impact
  - Check for cross-dependencies in request
  - Check for new patterns/tech
  - Calculate complexity score

outputs:
  - complexity: "simple | moderate | complex | enterprise"
  - estimated_files: "{range}"
  - cross_dependencies: "{count}"
  - new_patterns: "{count}"
  - COMPLEXITY-ASSESSMENT.json

validation_gate:
  name: "Complexity Determined"
  checks:
    - "complexity is valid enum"
    - "If complex/enterprise, tool_count >= 2"
  on_fail: "Default to 'moderate'"

hop_paths:
  - condition: "simple + high clarity input"
    hop_to: "3.1"
    skip: ["1.x", "2.x"]
    flag: "fast_track"
  - condition: "complex + tool_count < 2"
    hop_to: "0.3"
    action: "Upgrade tools before proceeding"
```

### 0.6 Route Determination

```yaml
stage: "0.6"
name: "Route Determination"
purpose: "Select workflow path based on all factors"

entry_conditions:
  - "0.5 complete"

agent: "@idumb-project-explorer"
tools: ["idumb-state"]

actions:
  - Combine: codebase_state + complexity + user_prefs + tool_tier
  - Select workflow template
  - Determine required stages
  - Determine skippable stages
  - Generate route decision

outputs:
  - route: "full | research_first | spec_only | fast_track"
  - required_stages: [...]
  - optional_stages: [...]
  - first_stage: "{stage_id}"
  - ROUTE-DECISION.json

validation_gate:
  name: "Route Selected"
  checks:
    - "route is valid"
    - "first_stage is reachable"
  on_fail: "Default to 'full' route"

routing_matrix:
  greenfield_simple:
    route: "full"
    stages: "all"
  greenfield_complex:
    route: "research_first"
    stages: "all with deep research"
  brownfield_simple:
    route: "fast_track"
    stages: "0 → 3 → 4 → 5 → 6"
  brownfield_complex:
    route: "full"
    stages: "all"
  modernize:
    route: "research_first"
    stages: "all with migration focus"
```

---

## Stage 1: Ideation & Brainstorm

### 1.1 - 1.7 Summary

```yaml
stages:
  1.1:
    name: "Idea Capture"
    purpose: "Capture raw input"
    output: "RAW-IDEA.md"
    gate: "Idea captured"
    
  1.2:
    name: "Intent Clarification"
    purpose: "Define problem and success"
    output: "Intent statement"
    gate: "Intent clear (no vague language)"
    loop_on_fail: "Ask clarifying questions"
    
  1.3:
    name: "Constraint Identification"
    purpose: "Document limitations"
    output: "CONSTRAINTS.md"
    gate: "At least 1 constraint (or explicit none)"
    
  1.4:
    name: "Scope Bounding"
    purpose: "Define IN/OUT scope"
    output: "SCOPE.md"
    gate: "Both IN and OUT lists present"
    hop_if: "Scope too large → Split phases → Return"
    
  1.5:
    name: "Assumption Surfacing"
    purpose: "Make assumptions explicit"
    output: "ASSUMPTIONS.md"
    gate: "Assumptions listed with confidence"
    
  1.6:
    name: "Clarity Scoring"
    purpose: "Quality gate check"
    output: "CLARITY-REPORT.json"
    gate: "Score ≥ 70 OR explicit skip"
    loop_on_fail: "Return to 1.2-1.5"
    
  1.7:
    name: "Brainstorm Synthesis"
    purpose: "Combine into single document"
    output: "IDEA-BRIEF.md"
    gate: "Brief complete"
    hop_if: "User skips → Flag 'unvalidated-entry'"
```

---

## Stage 2: Research & Validation

### 2.1 - 2.9 Summary

```yaml
stages:
  2.1:
    name: "Research Trigger Evaluation"
    purpose: "Determine if/what research needed"
    output: "RESEARCH-SCOPE.json"
    gate: "Scope defined"
    hop_if: "Simple + high clarity → Skip to 2.8"
    
  2.2:
    name: "Existing Codebase Analysis"
    purpose: "Find patterns in current code"
    output: "CODEBASE-ANALYSIS.md"
    gate: "Analysis complete (or greenfield marker)"
    
  2.3:
    name: "Tech Stack Research"
    purpose: "Document and validate stack"
    output: "TECH-STACK-ANALYSIS.md"
    gate: "Stack documented with versions"
    loop_on_fail: "Unknown tech → 2.4 → Return"
    
  2.4:
    name: "External Research (MCP)"
    purpose: "Query external sources"
    tools: ["context7", "deepwiki", "tavily", "exa", "brave"]
    output: "EXTERNAL-RESEARCH.md"
    gate: "Min sources met per tier"
    loop_on_fail: "Conflicting sources → Deeper research"
    
  2.5:
    name: "Assumption Validation"
    purpose: "Test assumptions from 1.5"
    output: "ASSUMPTION-VALIDATION.md"
    gate: "All assumptions addressed"
    hop_if: "Critical invalid → Back to 1.4"
    
  2.6:
    name: "Cross-Dependency Mapping"
    purpose: "Map all dependencies"
    output: "DEPENDENCY-MAP.md"
    gate: "No orphan dependencies"
    hop_if: "Complex deps → Upgrade tier → Re-check 0.3"
    
  2.7:
    name: "Risk Identification"
    purpose: "Surface risks"
    output: "RISK-REGISTER.md"
    gate: "Risks with probability/impact"
    
  2.8:
    name: "Research Synthesis"
    purpose: "Consolidate findings"
    agent: "@idumb-research-synthesizer"
    output: "RESEARCH-SYNTHESIS.md"
    gate: "Confidence ≥ threshold"
    loop_on_fail: "Low confidence → Targeted re-research"
    
  2.9:
    name: "Research-to-Spec Readiness"
    purpose: "Final research quality gate"
    output: "RESEARCH-COMPLETE.json"
    gate: "All checks pass"
    hop_if: "Fails → Route to specific 2.x"
```

---

## Stage 3: Specification Development

### 3.1 - 3.12 Summary

```yaml
stages:
  3.1:
    name: "Requirements Extraction"
    output: "REQUIREMENTS.md"
    gate: "Each req has ID, priority, source"
    loop_if: "Ambiguous → Back to 1.2 or 2.4"
    
  3.2:
    name: "Requirements-Research Alignment"
    output: "REQ-RESEARCH-MATRIX.md"
    gate: "All reqs have research backing"
    loop_if: "Orphan reqs → Back to 2.4"
    
  3.3:
    name: "Technical Approach Selection"
    output: "APPROACH-OPTIONS.md"
    gate: "Approach selected with reasoning"
    hop_if: "User rejects all → Back to 2.3"
    
  3.4:
    name: "Architecture Decision"
    output: "ARCHITECTURE.md"
    gate: "Architecture addresses all reqs"
    loop_if: "Gap → Add component → Re-validate"
    
  3.5:
    name: "Interface Definitions"
    output: "INTERFACES.md"
    gate: "Interfaces typed and documented"
    hop_if: "Existing system → Validate against 2.2"
    
  3.6:
    name: "Acceptance Criteria Definition"
    output: "ACCEPTANCE-CRITERIA.md"
    gate: "Each req has ≥1 criterion"
    loop_if: "Missing → Define → Validate"
    
  3.7:
    name: "Spec Internal Consistency"
    output: "CONSISTENCY-REPORT.json"
    gate: "No internal conflicts"
    loop_if: "Conflicts → Fix in 3.1-3.6"
    
  3.8:
    name: "Spec-Research Alignment"
    output: "SPEC-RESEARCH-ALIGNMENT.json"
    gate: "Alignment ≥ 90%"
    loop_if: "Misalignment → 2.4 or 3.3-3.5"
    
  3.9:
    name: "Under-Clarification Detection"
    output: "CLARITY-SCAN.json"
    gate: "Zero blockers"
    loop_if: "Blockers → Fix in 3.x"
    patterns:
      blockers: ["TBD", "TODO", "FIXME", "?$"]
      warnings: ["maybe", "might", "possibly", "should work"]
    
  3.10:
    name: "Spec Synthesis & Versioning"
    output: "SPEC-v0.1.0.md"
    gate: "Spec complete with version"
    
  3.11:
    name: "Spec Validation (Multi-Agent)"
    agents: ["@idumb-skeptic-validator", "@idumb-plan-checker", "@idumb-integration-checker"]
    output: "SPEC-VALIDATION-REPORT.md"
    gate: "All validators pass"
    loop_if: "Fails → Route to 3.x"
    
  3.12:
    name: "Spec Approval Gate"
    output: "SPEC-v1.0.0.md (locked)"
    gate: "User approval"
    options: ["Approve", "Request changes", "Reject"]
    hop_if: "Reject → Back to 1 or 2"
```

---

## Stage 4: Planning & Task Breakdown

### 4.1 - 4.10 Summary

```yaml
stages:
  4.1:
    name: "Spec-to-Task Decomposition"
    output: "TASK-LIST.md"
    gate: "All reqs have ≥1 task"
    rule: "Max task size: 2 hours"
    
  4.2:
    name: "Task Dependency Analysis"
    output: "TASK-DEPENDENCIES.md"
    gate: "No circular dependencies"
    loop_if: "Circular → Restructure"
    
  4.3:
    name: "Critical Path Identification"
    output: "CRITICAL-PATH.md"
    gate: "Critical path documented"
    
  4.4:
    name: "Estimation"
    output: "ESTIMATES.md"
    gate: "All tasks estimated"
    hop_if: "Total > phase limit → Split phase"
    buffer: "20% minimum"
    
  4.5:
    name: "Risk-Task Mapping"
    output: "RISK-TASK-MATRIX.md"
    gate: "All risks mapped to mitigation"
    
  4.6:
    name: "Checkpoint Placement"
    output: "CHECKPOINT-PLAN.md"
    gate: "≥1 checkpoint per 5 tasks"
    
  4.7:
    name: "Acceptance Criteria Mapping"
    output: "ACCEPTANCE-TASK-MATRIX.md"
    gate: "100% criteria coverage"
    loop_if: "Missing → Add test tasks"
    
  4.8:
    name: "Plan Synthesis"
    output: "PLAN-v0.1.0.md"
    gate: "Plan complete"
    
  4.9:
    name: "Plan Validation"
    agent: "@idumb-plan-checker"
    output: "PLAN-VALIDATION-REPORT.md"
    gate: "Validation passes"
    loop_if: "Fails → Fix 4.1-4.7 (max 3)"
    checks:
      - "Atomic tasks (≤2h)"
      - "Valid DAG"
      - "Realistic estimates"
      - "Context budget ≤50%"
    
  4.10:
    name: "Plan Approval Gate"
    output: "PLAN-v1.0.0.md (locked)"
    gate: "User approval"
    options: ["Execute", "Modify", "Defer"]
```

---

## Stage 5: Execution & Implementation

### 5.1 - 5.11 Summary

```yaml
stages:
  5.1:
    name: "Pre-Execution Validation"
    gate: "PLAN + SPEC locked and approved"
    hop_if: "Spec unlocked → 3.12"
    
  5.2:
    name: "Execution Context Setup"
    output: "EXECUTION-STATE.json"
    gate: "State initialized"
    
  5.3:
    name: "Task Selection"
    output: "CURRENT-TASK.json"
    gate: "Task selected and ready"
    hop_if: "No executable tasks → 4.2 (dep issue)"
    
  5.4:
    name: "Task Execution"
    agent: "@idumb-builder"
    output: "Task artifacts"
    gate: "Task produces expected outputs"
    loop_if: "Fails → Retry (max 3) → Escalate"
    
  5.5:
    name: "Task Validation"
    output: "TASK-VALIDATION.json"
    gate: "Task acceptance pass"
    loop_if: "Fails → Fix → Re-validate"
    hop_if: "Repeated fails → @idumb-debugger"
    
  5.6:
    name: "Task Completion"
    output: "Updated EXECUTION-STATE.json"
    gate: "Task recorded complete"
    
  5.7:
    name: "Checkpoint Evaluation"
    output: "CHECKPOINT-{id}.json"
    gate: "Checkpoint valid (or not due)"
    hop_if: "Fails → Rollback → Resume"
    
  5.8:
    name: "Deviation Detection"
    output: "DEVIATION-REPORT.json"
    gate: "Deviations within tolerance"
    hop_if: "Major → Replan (4.x)"
    
  5.9:
    name: "Spec Drift Check"
    output: "DRIFT-CHECK.json"
    gate: "No unapproved drift"
    hop_if: "Drift → Update spec or Revert"
    
  5.10:
    name: "Execution Loop Control"
    output: "LOOP-DECISION.json"
    gate: "Continue | Pause | Complete"
    loop_if: "Continue → 5.3"
    hop_if: "Context exceeded → Checkpoint → Resume"
    
  5.11:
    name: "Execution Completion"
    output: "EXECUTION-SUMMARY.md"
    gate: "All planned tasks complete"
    hop_if: "Blocked → Escalate"
```

---

## Stage 6: Verification & Acceptance

### 6.1 - 6.10 Summary

```yaml
stages:
  6.1:
    name: "Execution Completeness Check"
    gate: "Execution complete"
    hop_if: "Incomplete → 5.3"
    
  6.2:
    name: "Spec Compliance Verification"
    output: "SPEC-COMPLIANCE.md"
    gate: "100% compliance (or documented)"
    loop_if: "Non-compliance → Fix"
    
  6.3:
    name: "Acceptance Criteria Testing"
    output: "ACCEPTANCE-TEST-RESULTS.md"
    gate: "All criteria pass"
    loop_if: "Fails → Fix"
    hop_if: "Repeated fails → 5.4"
    
  6.4:
    name: "Regression Testing"
    output: "REGRESSION-REPORT.md"
    gate: "No regressions"
    loop_if: "Regressions → Fix"
    
  6.5:
    name: "Integration Verification"
    output: "INTEGRATION-VERIFICATION.md"
    gate: "Integration tests pass"
    hop_if: "Fails → @idumb-debugger"
    
  6.6:
    name: "Documentation Verification"
    output: "DOC-CHECK.json"
    gate: "Documentation complete"
    loop_if: "Missing → Generate"
    
  6.7:
    name: "Verification Synthesis"
    output: "VERIFICATION-REPORT.md"
    gate: "Report complete"
    
  6.8:
    name: "Stakeholder Review"
    output: "REVIEW-FEEDBACK.md"
    gate: "Review conducted"
    hop_if: "Major feedback → Route to 1-5"
    
  6.9:
    name: "Sign-Off Gate"
    output: "SIGN-OFF.md"
    gate: "User sign-off"
    options: ["Accept", "Accept with notes", "Reject"]
    hop_if: "Reject → Route based on reason"
    
  6.10:
    name: "Completion & Archival"
    output: "PHASE-COMPLETE.json"
    gate: "Phase archived"
    hop_if: "Next phase → 0.1"
```

---

*Reference: stages-complete v1.0.0*
