# Validation & Integration Stress Test Module

## Module Index

**Version:** 1.0.0
**Created:** 2026-02-04
**Purpose:** Comprehensive validation and stress testing for iDumb framework

---

## Module Structure

```
validation-stress-test-module/
├── META Package (Self-Testing iDumb)
│   ├── Skills
│   │   └── idumb-stress-test/SKILL.md
│   ├── Commands
│   │   ├── stress-test.md
│   │   └── certify.md
│   ├── Workflows
│   │   └── stress-test.md
│   └── References
│       └── auto-activation-hooks.md
│
├── PROJECT Package (Any User Project)
│   ├── Skills
│   │   └── idumb-project-validation/SKILL.md
│   ├── Commands
│   │   ├── pre-flight.md
│   │   └── health-check.md
│   └── Workflows
│       └── continuous-validation.md
│
└── Shared Governance Layer
    ├── Coordinator Decision Logic
    ├── Loop Controllers
    ├── Conflict Detectors
    ├── Gap Detectors
    └── Drift Detectors
```

---

## Package Descriptions

### META Package: Self-Testing iDumb

**Purpose:** Validate the iDumb framework itself

**Components:**
| Component | Path | Lines | Description |
|-----------|------|-------|-------------|
| Skill | `src/skills/idumb-stress-test/SKILL.md` | ~600 | Comprehensive stress testing skill |
| Command | `src/commands/idumb/stress-test.md` | ~450 | Run stress tests (micro/batch/full) |
| Command | `src/commands/idumb/certify.md` | ~400 | Certify framework for production |
| Workflow | `src/workflows/stress-test.md` | ~400 | Orchestrate stress test execution |
| Reference | `references/auto-activation-hooks.md` | ~350 | Hook definitions and flows |

**Capabilities:**
- Agent coordination testing (22 agents)
- Integration matrix validation (30/15/20 thresholds)
- Regression sweep across all components
- Conflict detection (circular, permission, duplicate)
- Self-healing for auto-fixable issues
- OpenCode compatibility certification

### PROJECT Package: Any User Project

**Purpose:** Validate governance in user projects

**Components:**
| Component | Path | Lines | Description |
|-----------|------|-------|-------------|
| Skill | `src/skills/idumb-project-validation/SKILL.md` | ~550 | Project validation skill |
| Command | `src/commands/idumb/pre-flight.md` | ~400 | Pre-flight environment check |
| Command | `src/commands/idumb/health-check.md` | ~400 | Comprehensive health assessment |
| Workflow | `src/workflows/continuous-validation.md` | ~400 | Continuous validation loop |

**Capabilities:**
- Project type detection (greenfield/brownfield)
- Environment readiness validation
- Governance health assessment
- Health score calculation (governance/project/integration)
- Non-blocking continuous validation
- Greenfield bootstrap support
- Brownfield integration support

---

## Activation Modes

### Mode 1: Micro-Validation (Real-Time)

**When:** After each action, file change, or delegation
**Duration:** < 5 seconds
**Blocking:** No (unless critical)

**Checks:**
- State consistency
- Permission violations
- Chain integrity
- Quick conflict scan

**Triggers:**
```yaml
micro_triggers:
  - file_modified: "src/(agents|commands|workflows)/*.md"
  - agent_spawned: true
  - tool_executed: true
  - state_written: true
```

### Mode 2: Batch-Validation (Phase Transition)

**When:** At phase boundaries, commits, milestones
**Duration:** < 60 seconds
**Blocking:** Yes (at boundaries)

**Checks:**
- Full governance validation
- Integration matrix
- Cross-reference validity
- Conflict detection
- Regression sweep

**Triggers:**
```yaml
batch_triggers:
  - phase_transition: true
  - milestone_complete: true
  - commit_pending: true
  - time_elapsed: "> 30 minutes"
```

### Mode 3: Full Stress Test (Comprehensive)

**When:** Certification, major refactors, releases
**Duration:** < 5 minutes
**Blocking:** Yes

**Checks:**
- All micro checks
- All batch checks
- Agent spawning simulation
- OpenCode compatibility
- Schema compliance
- Full certification

**Triggers:**
```yaml
full_triggers:
  - user_request: "/idumb:stress-test --full"
  - certification: "/idumb:certify"
  - major_release: true
```

---

## Coordinator Decision Logic

The coordinator decides which mode to use based on conditions:

```yaml
coordinator_decides:
  # Evaluate conditions
  conditions:
    files_changed: $(git status --porcelain | wc -l)
    minutes_since_validation: $(($(date +%s) - last_validation) / 60)
    is_phase_boundary: $(check_phase_status)
    is_high_risk: $(check_action_risk)
    
  # Decision tree
  decision:
    if phase_boundary OR milestone_complete:
      mode: batch
    elif files_changed > 3:
      mode: batch
    elif minutes_since_validation > 30:
      mode: batch
    elif files_changed == 0 AND minutes_since_validation < 5:
      mode: skip
    else:
      mode: micro
```

---

## Loop Controller

The loop controller ensures validation continues until pass:

```yaml
loop_controller:
  mode: "iteration_until_pass"
  
  exit_conditions:
    success:
      - all_critical_pass: true
      - no_conflicts: true
      - integration_threshold_met: true
      
    partial:
      - critical_pass: true
      - warnings_documented: true
      
    stall:
      - same_output_3_times: true
      - no_progress_2_cycles: true
      
  stall_handling:
    - checkpoint_state
    - report_progress
    - request_guidance
    
  never_exit_when:
    - critical_conflicts_exist: true
    - permission_violations: true
```

---

## Usage

### META Package Commands

```bash
# Run micro-validation (quick)
/idumb:stress-test --micro

# Run batch-validation (thorough)
/idumb:stress-test --batch

# Run full stress test with healing
/idumb:stress-test --full --heal

# Certify for production
/idumb:certify --level strict --report
```

### PROJECT Package Commands

```bash
# Pre-flight check before work
/idumb:pre-flight

# Comprehensive health check
/idumb:health-check --detailed

# With auto-fix
/idumb:pre-flight --fix
```

---

## Integration Points

### With iDumb Framework

- **Reads:** All governance files, state.json, config.json
- **Writes:** Validation reports in `.idumb/idumb-brain/governance/`
- **Triggers:** Commands, workflows, agent spawning
- **Updates:** state.json history, anchors

### With OpenCode

- **Compatible:** All tools, agents, commands work in OpenCode CLI
- **Non-Polluting:** No console.log, clean TUI
- **Portable:** Works across projects

### With User Projects

- **Non-Invasive:** Doesn't modify project code
- **Adaptive:** Works greenfield and brownfield
- **Non-Blocking:** Warns but doesn't block (by default)

---

## Success Metrics

### For META Package
- [ ] All 22 agents validated
- [ ] All 15+ commands validated
- [ ] All 9 workflows validated
- [ ] Integration thresholds met (30/15/20)
- [ ] No conflicts detected
- [ ] Certification passed (≥ 85%)

### For PROJECT Package
- [ ] Pre-flight completes in < 10s
- [ ] Health check provides actionable score
- [ ] Continuous validation non-blocking
- [ ] Works in greenfield projects
- [ ] Works in brownfield projects
- [ ] OpenCode compatible

---

## Total Lines Created

| Category | Files | Lines |
|----------|-------|-------|
| META Skills | 1 | ~600 |
| META Commands | 2 | ~850 |
| META Workflows | 1 | ~400 |
| META References | 1 | ~350 |
| PROJECT Skills | 1 | ~550 |
| PROJECT Commands | 2 | ~800 |
| PROJECT Workflows | 1 | ~400 |
| **Total** | **9** | **~3,950** |

---

*Module: validation-stress-test v1.0.0*
