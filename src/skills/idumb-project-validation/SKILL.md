---
name: idumb-project-validation
description: "PROJECT package for validating user projects - works in greenfield and brownfield, ensures governance without blocking development"
version: 1.0.0
license: MIT
metadata:
  audience: ai-agents
  workflow: project-validation
  package: PROJECT
  activation: coordinator-driven
  modes:
    - pre-flight: "Before starting work"
    - continuous: "During development"
    - health-check: "On-demand status"
---

# iDumb Project Validation Skill (PROJECT Package)

<purpose>
I am the PROJECT validation skill that ensures iDumb governance works seamlessly in any user project - greenfield or brownfield, simple or complex. I validate without blocking, guide without restricting, and heal without breaking.
</purpose>

<philosophy>
## Core Principles

1. **Project-First**: User's project takes priority; governance adapts to project, not vice versa
2. **Non-Invasive**: Validation runs alongside development, never blocking
3. **Context-Aware**: Greenfield vs brownfield, complexity level, project purpose
4. **Incremental Adoption**: Start light, increase governance as project matures
5. **OpenCode Compatible**: Certified to work with OpenCode CLI environment
6. **Environment Agnostic**: Works with any tech stack, framework, or tooling
</philosophy>

---

## Project Type Detection

<project_detection>
### Greenfield Detection
```yaml
greenfield_indicators:
  strong:
    - no_src_directory: true
    - no_package_json: true
    - empty_git_history: "< 5 commits"
    - no_existing_governance: "no .planning/, no .idumb/"
    
  moderate:
    - recent_init: "created < 7 days ago"
    - minimal_files: "< 20 files"
    - no_tests: true
    
  detection_command: |
    FILES=$(find . -type f | grep -v node_modules | grep -v .git | wc -l)
    COMMITS=$(git log --oneline 2>/dev/null | wc -l)
    [ "$FILES" -lt 20 ] && [ "$COMMITS" -lt 5 ] && echo "GREENFIELD"
```

### Brownfield Detection
```yaml
brownfield_indicators:
  strong:
    - existing_src: true
    - package_json_with_deps: "> 5 dependencies"
    - git_history: "> 20 commits"
    - existing_tests: true
    
  moderate:
    - documentation_exists: "README.md with content"
    - ci_cd_configured: ".github/workflows/ exists"
    - multiple_contributors: "> 1 author in git"
    
  detection_command: |
    COMMITS=$(git log --oneline 2>/dev/null | wc -l)
    DEPS=$(jq '.dependencies | length' package.json 2>/dev/null || echo 0)
    [ "$COMMITS" -gt 20 ] || [ "$DEPS" -gt 5 ] && echo "BROWNFIELD"
```

### Complexity Assessment
```yaml
complexity_levels:
  simple:
    files: "< 50"
    languages: 1
    frameworks: "0-1"
    team_size: 1
    
  moderate:
    files: "50-500"
    languages: "1-3"
    frameworks: "1-3"
    team_size: "1-5"
    
  complex:
    files: "> 500"
    languages: "> 3"
    frameworks: "> 3"
    team_size: "> 5"
    
  detection_command: |
    FILES=$(find . -type f | grep -v node_modules | grep -v .git | wc -l)
    LANGS=$(find . -type f -name "*.ts" -o -name "*.js" -o -name "*.py" -o -name "*.go" | 
            sed 's/.*\.//' | sort -u | wc -l)
    
    if [ "$FILES" -lt 50 ] && [ "$LANGS" -le 1 ]; then
      echo "SIMPLE"
    elif [ "$FILES" -lt 500 ] && [ "$LANGS" -le 3 ]; then
      echo "MODERATE"
    else
      echo "COMPLEX"
    fi
```
</project_detection>

---

## Validation Modes

<validation_modes>
### Mode 1: Pre-Flight Check

**When:** Before starting any work on a project

**Purpose:** Ensure environment is ready for iDumb governance

```yaml
pre_flight_checks:
  environment:
    - opencode_available: "which opencode"
    - node_version: ">= 18"
    - git_available: "which git"
    - git_initialized: "test -d .git"
    
  idumb_state:
    - idumb_initialized: "test -d .idumb"
    - state_valid: "jq . .idumb/brain/state.json"
    - config_valid: "jq . .idumb/brain/config.json"
    
  project_state:
    - no_uncommitted_changes: "git status --porcelain"
    - on_feature_branch: "git branch --show-current"
    - upstream_current: "git fetch && git status -uno"
    
  governance_state:
    - agents_available: "ls .opencode/agents/idumb-*.md"
    - commands_available: "ls .opencode/commands/idumb/*.md"
    - tools_available: "ls .opencode/tools/idumb-*.ts"

pre_flight_output:
  pass:
    message: "Environment ready for iDumb governance"
    proceed: true
    
  fail:
    message: "Pre-flight checks failed"
    issues: "list of failed checks"
    fixes: "suggested fixes for each"
    proceed: false
    
  partial:
    message: "Some checks failed but can proceed"
    warnings: "list of warnings"
    proceed: true
```

### Mode 2: Continuous Validation

**When:** During active development, triggered by coordinator

**Purpose:** Ensure ongoing work doesn't violate governance

```yaml
continuous_validation:
  triggers:
    micro_triggers:
      - file_saved: "*.ts, *.md, *.json"
      - command_executed: "/idumb:*"
      - agent_spawned: true
      
    batch_triggers:
      - phase_transition: true
      - milestone_complete: true
      - commit_made: true
      
  coordinator_decision:
    use_micro_when:
      - editing_governance_files: true
      - high_risk_action: true
      - previous_validation_failed: true
      
    use_batch_when:
      - phase_boundary: true
      - multiple_changes: "> 5 files"
      - time_elapsed: "> 30 min"

continuous_checks:
  always_check:
    - state_consistency: "state.json valid"
    - no_conflicts: "no circular refs"
    - chain_integrity: "delegation valid"
    
  on_file_change:
    - file_in_scope: "matches governance patterns"
    - no_secrets: "scan for API keys"
    - syntax_valid: "YAML/JSON parseable"
    
  on_phase_transition:
    - phase_complete: "all tasks done"
    - artifacts_exist: "expected files created"
    - verification_passed: "quality gates met"
```

### Mode 3: Health Check

**When:** On-demand status check

**Purpose:** Comprehensive project health assessment

```yaml
health_check:
  categories:
    governance_health:
      - idumb_state: "valid, fresh"
      - agents_synced: "src/ matches .opencode/"
      - config_current: "version matches"
      
    project_health:
      - tests_passing: "npm test"
      - build_working: "npm run build"
      - no_lint_errors: "npm run lint"
      
    integration_health:
      - git_clean: "no uncommitted changes"
      - branch_current: "up to date with main"
      - dependencies_fresh: "npm outdated"

health_score:
  calculation: |
    GOVERNANCE=$(check_governance_health)  # 0-100
    PROJECT=$(check_project_health)         # 0-100
    INTEGRATION=$(check_integration_health) # 0-100
    
    SCORE=$((GOVERNANCE * 0.3 + PROJECT * 0.4 + INTEGRATION * 0.3))
    
  ratings:
    excellent: ">= 90"
    good: "70-89"
    fair: "50-69"
    poor: "< 50"
```
</validation_modes>

---

## Greenfield Bootstrap

<greenfield_bootstrap>
### Purpose
Set up optimal iDumb governance from scratch

### Bootstrap Steps

```yaml
greenfield_bootstrap:
  step_1_detect:
    action: "Confirm greenfield status"
    command: "run project detection"
    output: "GREENFIELD confirmed"
    
  step_2_initialize:
    action: "Initialize iDumb framework"
    command: "/idumb:init"
    creates:
      - ".idumb/brain/state.json"
      - ".idumb/brain/config.json"
      - ".idumb/project-output/"
      
  step_3_configure:
    action: "Configure for project type"
    prompts:
      - "Project name?"
      - "Primary language?"
      - "Framework (if any)?"
      - "Governance level (light/standard/strict)?"
    output: "config.json updated"
    
  step_4_scaffold:
    action: "Create initial planning structure"
    command: "/idumb:new-project"
    creates:
      - ".planning/PROJECT.md"
      - ".planning/ROADMAP.md (if full governance)"
      
  step_5_validate:
    action: "Run initial validation"
    command: "/idumb:validate"
    expect: "all checks pass"
    
  step_6_anchor:
    action: "Create bootstrap anchor"
    content: "Greenfield bootstrap complete"
    priority: "high"
```

### Governance Levels for Greenfield

```yaml
governance_levels:
  light:
    description: "Minimal governance for small/solo projects"
    features:
      - basic_state_tracking
      - simple_validation
      - manual_phase_transitions
    agents_active: 5  # core only
    
  standard:
    description: "Balanced governance for typical projects"
    features:
      - full_state_tracking
      - continuous_validation
      - semi-auto_phase_transitions
    agents_active: 12  # core + planning
    
  strict:
    description: "Full governance for complex/team projects"
    features:
      - comprehensive_tracking
      - real_time_validation
      - auto_phase_transitions
      - skeptic_review
    agents_active: 22  # all agents
```
</greenfield_bootstrap>

---

## Brownfield Integration

<brownfield_integration>
### Purpose
Integrate iDumb governance into existing project without disruption

### Integration Steps

```yaml
brownfield_integration:
  step_1_assess:
    action: "Assess existing project"
    checks:
      - existing_governance: ".planning/, .gsd/, other"
      - tech_stack: "languages, frameworks"
      - test_coverage: "existing tests"
      - ci_cd: "automation in place"
    output: "assessment_report.json"
    
  step_2_plan_integration:
    action: "Create integration plan"
    considers:
      - existing_workflows: "preserve what works"
      - migration_path: "incremental adoption"
      - conflict_avoidance: "no breaking changes"
    output: "integration_plan.md"
    
  step_3_minimal_init:
    action: "Initialize iDumb minimally"
    command: "/idumb:init --brownfield"
    creates:
      - ".idumb/brain/state.json (minimal)"
      - ".idumb/brain/config.json (adaptive)"
    does_not_modify:
      - existing_source_code
      - existing_config_files
      - existing_ci_cd
      
  step_4_shadow_mode:
    action: "Run in shadow mode first"
    duration: "1-3 sessions"
    behavior:
      - observe: "log would-be validations"
      - learn: "detect patterns"
      - suggest: "offer improvements"
      - block: "never"
    output: "shadow_mode_report.md"
    
  step_5_gradual_activation:
    action: "Activate governance incrementally"
    phases:
      - phase_1: "state tracking only"
      - phase_2: "add validation (non-blocking)"
      - phase_3: "add auto-activation hooks"
      - phase_4: "full governance (optional)"
      
  step_6_validate_integration:
    action: "Verify no disruption"
    checks:
      - tests_still_pass: "npm test"
      - build_still_works: "npm run build"
      - ci_cd_green: "no pipeline failures"
      - team_workflow_preserved: "existing processes work"
```

### Conflict Avoidance

```yaml
conflict_avoidance:
  existing_governance:
    if_planning_exists:
      action: "Integrate, don't replace"
      strategy: "iDumb reads .planning/, adds .idumb/"
      
    if_gsd_exists:
      action: "Migrate if requested"
      strategy: "Archive GSD, adopt iDumb"
      
    if_custom_exists:
      action: "Coexist"
      strategy: "iDumb operates independently"
      
  existing_tooling:
    preserve:
      - "ESLint config"
      - "Prettier config"
      - "CI/CD pipelines"
      - "Git hooks (add, don't replace)"
      
  existing_workflows:
    respect:
      - "Team branching strategy"
      - "PR review process"
      - "Release workflow"
```
</brownfield_integration>

---

## Continuous Validation Loop

<continuous_loop>
### Loop Architecture

```yaml
continuous_validation_loop:
  trigger_sources:
    - file_watcher: "src/, .planning/, .idumb/"
    - command_hook: "after /idumb:* commands"
    - phase_hook: "on phase transitions"
    - time_based: "every 30 min if active"
    
  loop_controller:
    on_trigger:
      - evaluate_trigger_type
      - select_validation_mode
      - run_appropriate_checks
      - process_results
      
    on_pass:
      - log_success
      - update_last_validation
      - continue_development
      
    on_fail:
      - classify_failures
      - attempt_self_heal
      - report_remaining
      - block_if_critical
      
    on_stall:
      - checkpoint_state
      - report_to_user
      - offer_options
```

### Non-Blocking Behavior

```yaml
non_blocking_validation:
  principle: "Validation informs, rarely blocks"
  
  blocking_conditions:
    block_when:
      - critical_security_issue: true
      - governance_corruption: true
      - circular_dependency: true
      
    warn_when:
      - high_severity_gap: true
      - integration_below_threshold: true
      - stale_context: true
      
    inform_when:
      - medium_severity_gap: true
      - style_inconsistency: true
      - optimization_opportunity: true
      
  user_control:
    override: "--force to bypass warnings"
    disable: "--no-validate to skip"
    strict: "--strict to block on warnings"
```
</continuous_loop>

---

## OpenCode Compatibility

<opencode_compatibility>
### Certification Criteria

```yaml
opencode_certification:
  environment_compatibility:
    - works_in_tui: "no console.log pollution"
    - respects_opencode_config: "reads .opencode/ correctly"
    - tools_export_correctly: "uses tool() wrapper"
    - agents_spawn_correctly: "task delegation works"
    
  cli_compatibility:
    - commands_registered: "/idumb:* available"
    - help_works: "/idumb:help shows all commands"
    - arguments_parsed: "flags and args work"
    
  plugin_compatibility:
    - hooks_fire: "session start/end events"
    - state_persists: "survives sessions"
    - no_memory_leaks: "clean shutdown"
    
  multi_project_compatibility:
    - isolated_state: "per-project .idumb/"
    - no_global_pollution: "doesn't affect other projects"
    - portable: "works when project moved"
```

### Compatibility Checks

```yaml
compatibility_checks:
  check_opencode_version:
    command: "opencode --version"
    minimum: "0.1.0"
    
  check_tool_loading:
    command: "opencode tools list | grep idumb"
    expect: "all idumb-* tools listed"
    
  check_agent_loading:
    command: "opencode agents list | grep idumb"
    expect: "all idumb-* agents listed"
    
  check_command_loading:
    command: "opencode commands list | grep idumb"
    expect: "all /idumb:* commands listed"
    
  check_plugin_loading:
    command: "opencode plugins list | grep idumb-core"
    expect: "idumb-core.ts loaded"
```
</opencode_compatibility>

---

## Integration Points

<integration_points>
### With iDumb Framework

```yaml
framework_integration:
  reads_from:
    - ".idumb/brain/state.json"
    - ".idumb/brain/config.json"
    - ".opencode/agents/idumb-*.md"
    - ".opencode/commands/idumb/*.md"
    - ".opencode/tools/idumb-*.ts"
    
  writes_to:
    - ".idumb/brain/governance/validations/"
    - ".idumb/brain/governance/health-checks/"
    - ".idumb/brain/history/"
    
  triggers:
    - "/idumb:validate"
    - "/idumb:status"
    - "/idumb:health-check"
    
  triggered_by:
    - "Session start (auto)"
    - "Phase transition (auto)"
    - "User command (manual)"
```

### With User Project

```yaml
project_integration:
  respects:
    - existing_tooling: "ESLint, Prettier, etc."
    - existing_ci_cd: "GitHub Actions, etc."
    - existing_governance: ".planning/, etc."
    - existing_tests: "test runners"
    
  enhances:
    - adds_governance: ".idumb/ directory"
    - adds_validation: "continuous checks"
    - adds_guidance: "step-by-step workflows"
    
  never:
    - modifies_source_code: "without explicit request"
    - breaks_existing_workflow: "preserves team process"
    - conflicts_with_tooling: "coexists peacefully"
```
</integration_points>

---

## Usage

### Quick Commands

```bash
# Pre-flight check before starting work
/idumb:pre-flight

# Run health check
/idumb:health-check

# Integration test for brownfield
/idumb:integration-test

# Bootstrap greenfield project
/idumb:init --greenfield

# Integrate with brownfield project
/idumb:init --brownfield
```

### Programmatic Use

```yaml
# In coordinator decisions
on_session_start:
  - run: "pre-flight check"
  - if_fail: "report issues"
  
on_phase_transition:
  - run: "batch validation"
  - if_fail: "block transition"
  
on_commit:
  - run: "health check"
  - if_warn: "log warnings"
```

---

## Success Criteria

<success_criteria>
### For Pre-Flight
- [ ] Detects project type (greenfield/brownfield)
- [ ] Validates environment readiness
- [ ] Reports issues with fixes
- [ ] Completes in < 10 seconds

### For Continuous Validation
- [ ] Non-blocking by default
- [ ] Coordinator-driven mode selection
- [ ] Self-healing for auto-fixable issues
- [ ] Clear reporting of remaining issues

### For Health Check
- [ ] Comprehensive health score
- [ ] Actionable recommendations
- [ ] No false positives
- [ ] Works in any project type

### For OpenCode Compatibility
- [ ] All tools load correctly
- [ ] All agents spawn correctly
- [ ] All commands execute correctly
- [ ] No TUI pollution
- [ ] Survives session restarts
</success_criteria>

---

*Skill: idumb-project-validation v1.0.0 - PROJECT Package*
