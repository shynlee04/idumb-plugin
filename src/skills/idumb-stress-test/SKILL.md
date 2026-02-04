---
name: idumb-stress-test
description: "META package for stress-testing the iDumb framework itself - validates agent coordination, integration completeness, and regression prevention"
version: 1.0.0
license: MIT
metadata:
  audience: ai-agents
  workflow: meta-validation
  package: META
  activation: coordinator-driven
  modes:
    - micro: "Real-time validation after each action"
    - batch: "Phase transition validation"
    - full: "Complete stress test suite"
---

# iDumb Stress Test Skill (META Package)

<purpose>
I am the META stress-testing skill for the iDumb framework itself. I validate that all agents, commands, workflows, and tools work together flawlessly. I am the perfectionist's tool for ensuring zero conflicts, zero gaps, and zero drift in the governance system.
</purpose>

<philosophy>
## Core Principles

1. **Coordinator-Driven Activation**: The coordinator decides when to run micro vs batch validation based on conditions
2. **Iterative Until Pass**: Loops continue until ALL checks pass, not until a counter expires
3. **Self-Healing**: Automatically fix what can be fixed, escalate what cannot
4. **Non-Blocking**: Validations run without blocking development flow
5. **Evidence-Based**: Every claim backed by file:line citations
6. **Regression Prevention**: Changes never break existing functionality
</philosophy>

---

## Activation Modes

<activation_modes>
### Mode 1: Micro-Validation (Real-Time)

**Trigger Conditions:**
```yaml
micro_validation_triggers:
  - agent_action_complete: true
  - file_modified: "src/agents/*.md OR src/commands/*.md OR src/workflows/*.md"
  - delegation_chain_extended: true
  - state_write_occurred: true
```

**Coordinator Decision Logic:**
```yaml
use_micro_when:
  - high_risk_action: "write to governance files"
  - chain_depth: "> 2"
  - previous_validation_failed: true
  - user_requested: "strict mode"
```

**Checks (Fast, <5s):**
- Permission violation detection
- Chain integrity verification
- State consistency check
- Immediate conflict detection

### Mode 2: Batch-Validation (Phase Transition)

**Trigger Conditions:**
```yaml
batch_validation_triggers:
  - phase_transition: "discussed → planned → executed → verified"
  - milestone_complete: true
  - session_end: true
  - user_requested: "/idumb:stress-test"
```

**Coordinator Decision Logic:**
```yaml
use_batch_when:
  - phase_boundary_reached: true
  - multiple_files_changed: "> 5 files"
  - significant_time_elapsed: "> 30 minutes since last"
  - before_commit: true
```

**Checks (Thorough, <60s):**
- Full integration matrix validation
- Agent coordination stress test
- Regression sweep across all components
- Gap detection with resolution planning

### Mode 3: Full Stress Test (Comprehensive)

**Trigger Conditions:**
```yaml
full_stress_test_triggers:
  - user_requested: "/idumb:stress-test --full"
  - major_release_prep: true
  - post_transformation: true
  - certification_required: true
```

**Checks (Complete, <5min):**
- All micro checks
- All batch checks
- Agent spawning simulation
- Workflow chain execution
- Conflict matrix generation
- OpenCode compatibility verification
</activation_modes>

---

## Stress Test Categories

<test_category name="agent-coordination">
### Agent Coordination Tests

**Purpose:** Verify all 22 agents work together without conflicts

#### Test 1: Delegation Chain Integrity
```yaml
test: delegation_chain_integrity
description: "Verify delegation paths are valid and complete"

checks:
  - for_each_agent:
      - parent_exists: "parent agent ID is valid"
      - can_delegate_to_children: "delegation targets exist"
      - no_circular_delegation: "A→B→C→A not allowed"
      - leaf_nodes_cannot_delegate: "builder, validator have task: deny"

validation_command: |
  grep -r "parent:" src/agents/*.md | 
  while read line; do
    PARENT=$(echo "$line" | grep -oP 'parent: \K\S+')
    test -f "src/agents/idumb-${PARENT}.md" || echo "FAIL: Invalid parent $PARENT"
  done

pass_criteria:
  - all_parents_exist: true
  - no_orphan_agents: true
  - no_circular_refs: true
```

#### Test 2: Permission Matrix Consistency
```yaml
test: permission_matrix_consistency
description: "Verify permission rules don't conflict"

checks:
  - coordinators:
      - write: deny
      - edit: deny
      - task: allow
  - builders:
      - write: allow
      - edit: allow
      - task: deny
  - validators:
      - write: deny
      - edit: deny
      - bash: "read-only"

validation_command: |
  for agent in src/agents/idumb-*.md; do
    NAME=$(basename "$agent" .md)
    WRITE=$(grep -A5 "permission:" "$agent" | grep "write:" | head -1)
    TASK=$(grep -A5 "permission:" "$agent" | grep "task:" | head -1)
    
    # Check coordinator rule
    if echo "$NAME" | grep -q "coordinator\|governance"; then
      echo "$WRITE" | grep -q "deny" || echo "FAIL: $NAME should deny write"
    fi
    
    # Check builder rule
    if echo "$NAME" | grep -q "builder"; then
      echo "$TASK" | grep -q "deny" || echo "FAIL: $NAME should deny task"
    fi
  done

pass_criteria:
  - no_coordinator_writes: true
  - no_builder_delegates: true
  - all_leaf_nodes_blocked: true
```

#### Test 3: Agent Spawning Simulation
```yaml
test: agent_spawning_simulation
description: "Simulate agent spawning to verify no deadlocks"

simulation:
  - spawn: idumb-supreme-coordinator
  - delegate_to: idumb-high-governance
  - delegate_to: idumb-mid-coordinator
  - delegate_to: idumb-project-executor
  - delegate_to: idumb-builder
  - verify: "chain completes without loop"

  - spawn: idumb-verifier
  - delegate_to: idumb-low-validator
  - verify: "validation chain completes"

  - spawn: idumb-planner
  - delegate_to: idumb-plan-checker
  - verify: "planning chain completes"

pass_criteria:
  - all_chains_complete: true
  - no_infinite_loops: true
  - max_depth_respected: "≤ 5"
```
</test_category>

<test_category name="integration-matrix">
### Integration Matrix Tests

**Purpose:** Verify all components have sufficient integration points (30/15/10 thresholds)

#### Test 4: Agent Integration Points
```yaml
test: agent_integration_points
threshold: 30

for_each_agent:
  count_integration_points:
    - tools_referenced: "count tool names in frontmatter"
    - files_read: "count file paths in execution_flow"
    - files_written: "count file paths in output sections"
    - agents_delegated_to: "count @agent references"
    - agents_delegated_from: "count parent references"
    - state_fields_accessed: "count state.json keys"
    - commands_triggered: "count /idumb: references"
    - workflows_used: "count workflow references"

  report:
    - agent_name: "name"
    - total_points: "sum of above"
    - meets_threshold: "≥ 30"
    - gap_if_not: "list missing connections"

pass_criteria:
  - all_agents: "≥ 30 integration points"
  - average: "≥ 35 integration points"
```

#### Test 5: Command Integration Points
```yaml
test: command_integration_points
threshold: 15

for_each_command:
  count_integration_points:
    - agent_binding: "which agent handles"
    - tools_used: "idumb-* tool calls"
    - state_access: "reads/writes state"
    - workflow_triggers: "chained workflows"
    - prerequisite_checks: "entry conditions"
    - output_artifacts: "files created"
    - chain_rules: "success/failure paths"

pass_criteria:
  - all_commands: "≥ 15 integration points"
```

#### Test 6: Workflow Integration Points
```yaml
test: workflow_integration_points
threshold: 20

for_each_workflow:
  count_integration_points:
    - agents_spawned: "delegation matrix"
    - tools_invoked: "tool calls in steps"
    - state_transitions: "before/after states"
    - artifacts_produced: "output files"
    - entry_conditions: "prerequisites"
    - exit_conditions: "completion criteria"
    - chain_rules: "next workflows"

pass_criteria:
  - all_workflows: "≥ 20 integration points"
```
</test_category>

<test_category name="regression-sweep">
### Regression Sweep Tests

**Purpose:** Ensure changes don't break existing functionality

#### Test 7: Schema Compliance
```yaml
test: schema_compliance
description: "All artifacts match their schemas"

checks:
  - agent_frontmatter:
      schema: "src/schemas/agent-frontmatter.json"
      files: "src/agents/*.md"
      
  - command_frontmatter:
      schema: "src/schemas/command-frontmatter.json"
      files: "src/commands/idumb/*.md"
      
  - workflow_structure:
      schema: "src/schemas/workflow-structure.json"
      files: "src/workflows/*.md"
      
  - state_json:
      schema: "src/schemas/state.json"
      file: ".idumb/idumb-brain/state.json"

pass_criteria:
  - all_files_valid: true
  - no_schema_violations: true
```

#### Test 8: Cross-Reference Validity
```yaml
test: cross_reference_validity
description: "All references point to existing entities"

checks:
  - agent_references:
      pattern: "@idumb-[a-z-]+"
      must_exist: "src/agents/idumb-{name}.md"
      
  - command_references:
      pattern: "/idumb:[a-z-]+"
      must_exist: "src/commands/idumb/{name}.md"
      
  - workflow_references:
      pattern: "workflows/[a-z-]+\\.md"
      must_exist: "src/workflows/{name}.md"
      
  - tool_references:
      pattern: "idumb-[a-z]+"
      must_exist: "src/tools/idumb-{name}.ts"

validation_command: |
  # Find all agent references
  grep -rhoP '@idumb-[a-z-]+' src/ | sort -u | while read ref; do
    AGENT=$(echo "$ref" | sed 's/@//')
    test -f "src/agents/${AGENT}.md" || echo "FAIL: Missing agent $AGENT"
  done

pass_criteria:
  - all_references_valid: true
  - no_dangling_refs: true
```

#### Test 9: Behavioral Consistency
```yaml
test: behavioral_consistency
description: "Components behave as documented"

checks:
  - coordinators_dont_write:
      test: "grep 'write:' in coordinator agents"
      expect: "all deny"
      
  - builders_dont_delegate:
      test: "grep 'task:' in builder agents"
      expect: "all deny"
      
  - validators_are_readonly:
      test: "check bash permissions in validators"
      expect: "read-only or deny"
      
  - all_have_structured_returns:
      test: "grep '<structured_returns>' in all agents"
      expect: "section exists"

pass_criteria:
  - all_behaviors_match: true
  - no_permission_violations: true
```
</test_category>

---

## Conflict Detection

<conflict_detection>
### Conflict Types

#### Type 1: Agent-Agent Conflicts
```yaml
agent_agent_conflicts:
  - duplicate_scope:
      detect: "Two agents claim same responsibility"
      example: "Both executor and builder try to write"
      resolution: "Clarify delegation boundaries"
      
  - circular_delegation:
      detect: "A delegates to B, B delegates to A"
      resolution: "Break cycle by hierarchy"
      
  - permission_overlap:
      detect: "Non-leaf has write + task permissions"
      resolution: "Remove one permission"
```

#### Type 2: Agent-Tool Conflicts
```yaml
agent_tool_conflicts:
  - missing_tool:
      detect: "Agent references tool that doesn't exist"
      resolution: "Create tool or remove reference"
      
  - tool_permission_mismatch:
      detect: "Agent calls tool it can't use"
      resolution: "Update agent permissions"
```

#### Type 3: Command-Workflow Conflicts
```yaml
command_workflow_conflicts:
  - missing_workflow:
      detect: "Command triggers non-existent workflow"
      resolution: "Create workflow or update command"
      
  - circular_chaining:
      detect: "Workflow A chains to B, B chains to A"
      resolution: "Redesign chain"
```

### Conflict Detection Algorithm
```yaml
conflict_detection_algorithm:
  step_1_build_graph:
    - nodes: "all agents, commands, workflows, tools"
    - edges: "references between nodes"
    
  step_2_detect_cycles:
    - algorithm: "Tarjan's strongly connected components"
    - report: "all cycles as conflicts"
    
  step_3_detect_overlaps:
    - for_each_pair:
        - check_scope_overlap
        - check_permission_overlap
        - check_responsibility_overlap
        
  step_4_detect_gaps:
    - for_each_node:
        - check_integration_threshold
        - check_required_connections
        - check_orphan_status
```
</conflict_detection>

---

## Gap Detection

<gap_detection>
### Gap Categories

#### Category 1: Missing Integrations
```yaml
missing_integrations:
  - agent_without_parent:
      detect: "parent field missing or invalid"
      severity: critical
      auto_fix: false
      
  - command_without_agent:
      detect: "agent field missing"
      severity: critical
      auto_fix: false
      
  - workflow_without_chain:
      detect: "no chain_rules section"
      severity: high
      auto_fix: "add empty chain_rules"
```

#### Category 2: Incomplete Coverage
```yaml
incomplete_coverage:
  - agent_missing_structured_returns:
      detect: "no <structured_returns> section"
      severity: high
      auto_fix: "generate from template"
      
  - command_missing_success_criteria:
      detect: "no <success_criteria> section"
      severity: medium
      auto_fix: "generate checklist"
      
  - workflow_missing_entry_check:
      detect: "no <entry_check> section"
      severity: high
      auto_fix: "generate validation"
```

#### Category 3: Drift Detection
```yaml
drift_detection:
  - state_schema_drift:
      detect: "state.json doesn't match schema"
      severity: critical
      auto_fix: "migrate state"
      
  - config_version_drift:
      detect: "config version < current"
      severity: medium
      auto_fix: "upgrade config"
      
  - agent_frontmatter_drift:
      detect: "frontmatter missing new required fields"
      severity: high
      auto_fix: "add missing fields"
```
</gap_detection>

---

## Self-Healing Protocol

<self_healing>
### Auto-Fixable Issues

```yaml
auto_fixable:
  - missing_required_field:
      action: "Add field with default value"
      requires_confirmation: false
      
  - syntax_error_yaml:
      action: "Parse and reformat"
      requires_confirmation: false
      
  - missing_section:
      action: "Generate from template"
      requires_confirmation: true
      
  - invalid_reference:
      action: "Update to valid reference"
      requires_confirmation: true
```

### Self-Healing Workflow
```yaml
self_healing_workflow:
  1_detect:
    - run_validation
    - classify_issues
    
  2_plan:
    - separate_auto_fixable
    - create_fix_queue
    
  3_fix:
    - for_each_auto_fixable:
        - apply_fix
        - validate_single
        - rollback_if_failed
        
  4_verify:
    - run_full_validation
    - compare_before_after
    
  5_report:
    - issues_fixed: "count"
    - issues_remaining: "count"
    - manual_action_required: "list"
```
</self_healing>

---

## Iteration Loop Controller

<loop_controller>
### Loop Until Pass Logic

```yaml
loop_controller:
  mode: "iteration_until_pass"
  
  exit_conditions:
    success:
      - all_tests_pass: true
      - no_critical_gaps: true
      - no_conflicts: true
      
    partial:
      - critical_gaps: 0
      - high_gaps: "documented"
      - medium_gaps: "accepted by user"
      
    stall:
      - same_output_3_times: true
      - no_progress_2_cycles: true
      - fix_failed_3_times: true
      
  never_exit_when:
    - critical_conflicts_exist: true
    - permission_violations_exist: true
    - circular_references_exist: true
    
  stall_handling:
    on_stall:
      - checkpoint_state
      - report_progress
      - request_guidance
      
  max_iterations: null  # No arbitrary limit
  progress_metric: "gaps_remaining / gaps_initial"
```

### Coordinator Decision Points
```yaml
coordinator_decisions:
  after_each_iteration:
    - evaluate_progress:
        if_improving: "continue"
        if_stalled: "escalate"
        if_complete: "exit_success"
        
    - evaluate_mode:
        if_high_risk: "switch to micro"
        if_stable: "switch to batch"
        
    - evaluate_resources:
        if_context_high: "checkpoint and compact"
        if_time_exceeded: "partial exit with report"
```
</loop_controller>

---

## Usage

### Quick Commands

```bash
# Run micro-validation (fast, after actions)
/idumb:stress-test --micro

# Run batch-validation (thorough, at transitions)
/idumb:stress-test --batch

# Run full stress test (comprehensive)
/idumb:stress-test --full

# Run with self-healing
/idumb:stress-test --heal

# Run certification check
/idumb:certify
```

### Programmatic Activation

```yaml
# In agent profiles or workflows
auto_validate:
  mode: micro
  conditions:
    - file_modified: "src/agents/*.md"
    - severity: high
    
# At phase transitions
phase_validation:
  mode: batch
  required: true
  block_on_fail: true
```

---

## Success Criteria

<success_criteria>
### For Micro-Validation
- [ ] Completes in < 5 seconds
- [ ] Detects permission violations
- [ ] Detects chain breaks
- [ ] Non-blocking to development

### For Batch-Validation
- [ ] Completes in < 60 seconds
- [ ] Full integration matrix checked
- [ ] All agents tested
- [ ] Gaps classified and reported

### For Full Stress Test
- [ ] All 22 agents validated
- [ ] All 15 commands validated
- [ ] All 9 workflows validated
- [ ] Integration thresholds met (30/15/20)
- [ ] No conflicts detected
- [ ] No critical gaps
- [ ] Self-healing applied where possible
- [ ] Certification report generated
</success_criteria>

---

*Skill: idumb-stress-test v1.0.0 - META Package*
