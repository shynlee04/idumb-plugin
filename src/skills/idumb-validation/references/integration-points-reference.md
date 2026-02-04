# iDumb Integration Points Reference

Complete integration point matrices for all iDumb components. Use as reference when validating new or existing components.

## Component: idumb-supreme-coordinator

**Type:** Agent | **Tier:** Highest | **Threshold:** 30+

### Integration Points (35 documented)

#### Reads From (8)
| Source | Fields | Purpose |
|--------|--------|---------|
| `.idumb/brain/state.json` | phase, framework, anchors | Get current governance state |
| `.idumb/config.json` | user, governance, automation | Get user preferences |
| `todoread` tool | all TODOs | Check pending work |
| `idumb-state` tool | all exports | Read governance state |
| `idumb-context` tool | project classification | Understand project type |
| `idumb-config` tool | current settings | Get configuration |
| `.planning/ROADMAP.md` | phases | Check project phases |
| `.planning/STATE.md` | current phase | Verify planning alignment |

#### Writes To (6)
| Target | Fields | Purpose |
|--------|--------|---------|
| `.idumb/brain/state.json` | history, lastValidation | Record actions |
| `.idumb/brain/history/` | action entries | Archive history |
| `todowrite` tool | task updates | Track progress |
| `idumb-state_history` tool | entries | Log actions |
| `idumb-state_anchor` tool | critical decisions | Persist decisions |
| Validation reports | findings | Document results |

#### Validates Against (4)
| Schema/Rules | Enforcement | Purpose |
|--------------|-------------|---------|
| `deny-rules.yaml` | delegation allows | Check permission |
| `chain-enforcement.md` | MUST-BEFORE rules | Verify prerequisites |
| `completion-definitions.yaml` | exit conditions | Ensure completion |
| `brain-state-schema.json` | state structure | Validate state |

#### Triggers (7)
| Action | Target | Condition |
|--------|--------|----------|
| Delegate to agent | idumb-high-governance | Meta-framework work |
| Delegate to agent | idumb-mid-coordinator | Project execution |
| Delegate to agent | idumb-planner | Planning phase |
| Delegate to agent | idumb-verifier | Verification phase |
| Delegate to agent | idumb-debugger | Debug phase |
| Command `/idumb:init` | idumb-builder | Initialization |
| Command `/idumb:validate` | idumb-low-validator | Validation |

#### Triggered By (2)
| Source | Event |
|--------|-------|
| User input | Initial request |
| Resume | Session restoration |

#### Depends On (3)
| Component | Reason |
|-----------|--------|
| `.idumb/brain/state.json` | Required for context |
| Agent profiles | Delegation targets must exist |
| Tool definitions | Must have tools to call |

#### Blocks (3)
| Component | Reason |
|-----------|--------|
| Phase execution | Must validate first |
| Meta changes | Must follow governance |
| Uncoordinated writes | Enforces hierarchy |

#### Relates To (2)
| Component | Relationship |
|-----------|--------------|
| OpenCode primary agent | Alternative orchestration |
| GSD commands | Coexisting framework |

---

## Component: idumb-validate Tool

**Type:** Tool | **Tier:** Middle | **Threshold:** 15+

### Integration Points (22 documented)

#### Reads From (6)
| Source | Fields | Purpose |
|--------|--------|---------|
| `.idumb/brain/state.json` | all | Schema validation |
| `.idumb/config.json` | all | Config validation |
| `.idumb/` directory | structure | Structure check |
| `.planning/` directory | files | Alignment check |
| `src/schemas/*.json` | definitions | Schema references |
| File timestamps | age | Freshness check |

#### Writes To (3)
| Target | Fields | Purpose |
|--------|--------|---------|
| Validation reports | all findings | Return results |
| `.idumb/governance/validations/` | JSON | Persistent records |
| Console output | structured JSON | User feedback |

#### Validates Against (5)
| Schema/Rules | Enforcement | Purpose |
|--------------|-------------|---------|
| `brain-state-schema.json` | Runtime | State validation |
| `checkpoint-schema.json` | Runtime | Checkpoint validation |
| Agent frontmatter | YAML parsing | Agent validation |
| Tool exports | Code analysis | Tool validation |
| Completion definitions | Exit criteria | Workflow validation |

#### Triggers (1)
| Action | Target | Condition |
|--------|--------|----------|
| Fix creation | idumb-builder | When gaps found |

#### Triggered By (5)
| Source | Event |
|--------|-------|
| `/idumb:validate` command | User request |
| `/idumb:status` command | Status check |
| Phase transitions | Automatic validation |
| Agent delegations | Validation requests |
| Session resume | State verification |

#### Depends On (2)
| Component | Reason |
|-----------|--------|
| `.idumb/` directory | Must exist to validate |
| Schema files | Required for validation |

---

## Component: completion-definitions.yaml

**Type:** Config | **Tier:** Highest | **Threshold:** 30+

### Integration Points (28 documented)

#### Reads From (3)
| Source | Fields | Purpose |
|--------|--------|---------|
| All workflows | exit conditions | Define completion |
| Agent profiles | workflow patterns | Ensure alignment |
| Tool outputs | results | Verify conditions |

#### Validates Against (2)
| Schema/Rules | Enforcement | Purpose |
|--------------|-------------|---------|
| Workflow definitions | Pattern check | No arbitrary limits |
| Agent behavior | Exit criteria | Completeness |

#### Triggered By (8)
| Source | Event |
|--------|-------|
| All commands | Completion check |
| All workflows | Exit verification |
| Planner agent | Plan validation |
| Executor agent | Task completion |
| Verifier agent | Verification |
| Debugger agent | Fix validation |
| Researcher agent | Research completion |
| Builder agent | Build validation |

#### Validates (15)
| Component | Aspect | Purpose |
|-----------|--------|---------|
| `init.md` command | Exit conditions | Initialization complete |
| `map-codebase.md` command | File coverage | Codebase scanned |
| `research.md` command | Synthesis quality | Research complete |
| `roadmap.md` command | Phase structure | Roadmap valid |
| `discuss-phase.md` command | User confirmation | Context captured |
| `plan-phase.md` command | Checker pass | Plan validated |
| `execute-phase.md` command | Task resolution | Phase complete |
| `verify-work.md` command | Criteria checked | Verification done |
| `debug.md` command | Root cause | Issue diagnosed |
| `validate.md` command | Checks executed | Validation complete |
| `resume.md` command | Routing | Session restored |
| `planner_checker_loop` | Stall detection | Plan improvement |
| `validator_fix_loop` | Task verification | Fix validated |
| `research_synthesis_loop` | Research complete | Findings integrated |
| `delegation_cycle` | Result received | Delegation complete |

---

## Integration Point Counting Methodology

### What Counts As An Integration Point

Each UNIQUE connection in these categories counts as **1 point**:

1. **Reads From**: Each file/schema/tool read
2. **Writes To**: Each file/state/tool modified
3. **Validates Against**: Each schema/rule checked
4. **Triggers**: Each action initiated
5. **Triggered By**: Each event that invokes this
6. **Depends On**: Each prerequisite
7. **Blocks**: Each dependent component
8. **Relates To**: Each associated component

### Counting Rules

```yaml
counting_rules:
  unique_connections:
      - "Same target, different field: counts as 1"
      - "Same target, different purpose: counts as 2"
      - "Different targets: always count separately"

  does_not_count:
      - "Generic file I/O (read, write without specific target)"
      - "Internal functions"
      - "Comments or documentation only"

  bonus_points:
      - "Bidirectional connection: +1"
      - "Validates AND is validated by same component: +1"
      - "Multiple trigger conditions: +1 per condition"
```

### Thresholds by Tier

| Tier | Threshold | Rationale |
|------|-----------|-----------|
| **Highest** | 30+ | Agents, workflows, core governance touch everything |
| **Middle** | 15+ | Tools, commands, templates have moderate cross-cutting |
| **Lowest** | 10+ | Individual artifacts, configs have focused scope |

### Gap Analysis

If a component falls below threshold:

```yaml
gap_analysis:
  if_below_threshold:
      1: "Document why threshold not met"
      2: "Identify missing integration types"
      3: "Propose new integrations"
      4: "Assess if component is underspecialized"

  resolution_options:
      - "Add missing connections"
      - "Document hidden connections"
      - "Refactor into multiple components"
      - "Accept gap with justification"
```
