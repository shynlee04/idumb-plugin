---
description: "Create or update project roadmap based on research and requirements"
id: cmd-roadmap
parent: commands-idumb
agent: idumb-supreme-coordinator
---

# /idumb:roadmap

Create or update project roadmap based on research and requirements.

<objective>
Generate a structured project roadmap with phases, milestones, dependencies, and timeline estimates. The roadmap serves as the master plan that guides all phase execution and provides the hierarchical structure for iDumb governance (Milestone → Phase → Plan → Task).
</objective>

<execution_context>

## Reference Files (Read Before Execution)
- `.idumb/idumb-brain/state.json` - Current governance state
- `.idumb/idumb-brain/config.json` - User settings
- `.idumb/idumb-project-output/research/*.md` - Research outputs
- `.planning/PROJECT.md` - Project definition (if exists)
- `.planning/ROADMAP.md` - Existing roadmap (if updating)
- `PROJECT.md` or `README.md` - Project requirements (fallback)

## Agents Involved
| Agent | Role | Mode |
|-------|------|------|
| @idumb-supreme-coordinator | Command entry, routing | primary |
| @idumb-roadmapper | Roadmap creation/update | delegated |
| @idumb-low-validator | Roadmap validation | hidden |
| @idumb-builder | File writing | hidden |

</execution_context>

<context>

## Usage

```bash
/idumb:roadmap [flags]
```

## Flags

| Flag | Description | Values | Default |
|------|-------------|--------|---------|
| `--from-scratch` | Create new roadmap ignoring existing | Boolean | `false` |
| `--update` | Update existing roadmap with new info | Boolean | `false` |
| `--from-research` | Base roadmap on latest research | Boolean | `false` |
| `--phases` | Target number of phases | Number 1-10 | Auto-detect |
| `--format` | Output format | `markdown`, `json` | `markdown` |
| `--timeline` | Include timeline estimates | Boolean | `true` |
| `--risks` | Include risk analysis | Boolean | `true` |

## Examples

```bash
# Create roadmap from research
/idumb:roadmap --from-research

# Create 5-phase roadmap
/idumb:roadmap --phases=5

# Update existing roadmap
/idumb:roadmap --update

# Create new roadmap, ignoring existing
/idumb:roadmap --from-scratch

# Minimal roadmap without timeline/risks
/idumb:roadmap --timeline=false --risks=false
```

## Phase Types

| Type | Description | Typical Duration | Example |
|------|-------------|------------------|---------|
| `research` | Investigation and discovery | 1-2 weeks | Market research, tech evaluation |
| `foundation` | Core infrastructure setup | 2-4 weeks | Architecture, CI/CD, tooling |
| `feature` | Feature development | 2-6 weeks | User stories, functionality |
| `integration` | System integration | 1-3 weeks | API connections, data migration |
| `polish` | Quality improvements | 1-2 weeks | Testing, docs, performance |
| `launch` | Release preparation | 1-2 weeks | Deployment, monitoring, support |

</context>

<process>

## Step 1: Validate Prerequisites

```yaml
validation:
  tool: idumb-validate_structure
  checks:
    - .idumb/ exists
    - state.json valid
  
input_sources:
  check_in_order:
    1: ".idumb/idumb-project-output/research/*.md" (if --from-research)
    2: ".planning/PROJECT.md"
    3: "PROJECT.md" (root)
    4: "README.md"
    5: User input (prompt if none found)
  
  on_no_sources: |
    ## No Project Context Found
    
    To create a roadmap, I need project context.
    
    **Options:**
    1. Run `/idumb:research "{project topic}"` first
    2. Run `/idumb:new-project` to define project
    3. Provide project description now
```

## Step 2: Load Existing Roadmap (if applicable)

```yaml
existing_roadmap:
  check: ".planning/ROADMAP.md" exists
  
  if_exists_and_update_flag:
    action: Load and parse existing roadmap
    preserve: Phase IDs, completed milestones, existing dependencies
    update: Scope, timeline, new phases as needed
    
  if_exists_and_from_scratch_flag:
    action: Archive existing to ".planning/roadmap-{date}.md.bak"
    create: Fresh roadmap
    
  if_not_exists:
    action: Create new roadmap
```

## Step 3: Gather Project Context

```yaml
context_gathering:
  tools:
    - idumb-context: Detect framework, languages, project type
    - idumb-config_read: User preferences
    
  from_research:
    condition: --from-research flag
    action: Load latest research from .idumb/idumb-project-output/research/
    extract:
      - Technical recommendations
      - User requirements
      - Market constraints
      - Competitor insights
      
  from_project_md:
    action: Parse PROJECT.md for:
      - Goals and objectives
      - Scope definition
      - Constraints
      - Target timeline
```

## Step 4: Delegate to Roadmapper

```yaml
delegation:
  agent: "@idumb-roadmapper"
  prompt: |
    ## Roadmap Creation Task
    
    **Mode:** {from-scratch | update | from-research}
    **Target Phases:** {phases count or "auto"}
    **Include Timeline:** {timeline flag}
    **Include Risks:** {risks flag}
    
    **Project Context:**
    {context from Step 3}
    
    **Research Findings (if applicable):**
    {research summary from Step 3}
    
    **Existing Roadmap (if updating):**
    {existing roadmap content}
    
    **Instructions:**
    1. Use goal-backward planning (start from end state)
    2. Define clear phase boundaries
    3. Identify cross-phase dependencies
    4. Estimate realistic timelines
    5. Include measurable milestones
    6. Flag risks and mitigations
    
    **Expected Output:**
    Follow your <structured_returns> ROADMAP_OUTPUT format.
```

## Step 5: Validate Roadmap

```yaml
validation:
  agent: "@idumb-low-validator"
  checks:
    logical_flow:
      - Each phase has clear objective
      - Dependencies are valid (no forward references)
      - No circular dependencies
      
    completeness:
      - All major project goals covered
      - Each phase has milestones
      - Deliverables are measurable
      
    feasibility:
      - Phase scopes are reasonable
      - No "kitchen sink" phases
      - Clear definition of done per phase
      
  on_fail:
    action: Return to @idumb-roadmapper with specific issues
    max_retries: 2
```

## Step 6: Store Roadmap

```yaml
storage:
  delegate_to: "@idumb-builder"
  
  primary_path: ".planning/ROADMAP.md"
  backup_path: ".idumb/idumb-project-output/roadmaps/{date}-roadmap.md"
  
  state_update:
    tool: idumb-state_write
    phase: "roadmap_created"
    
  history:
    tool: idumb-state_history
    action: "roadmap_created"
    result: "pass"
    metadata: |
      phases: {phase count}
      milestones: {milestone count}
      timeline: {estimated duration}
```

## Step 7: Create Phase Directories (if new roadmap)

```yaml
phase_scaffolding:
  condition: New roadmap (not update)
  delegate_to: "@idumb-builder"
  
  for_each_phase:
    create_directory: ".planning/phases/{phase_id}/"
    create_files:
      - ".planning/phases/{phase_id}/README.md" (phase summary)
    
  update_state:
    tool: idumb-state_write
    phase: "phase_00" (or first phase ID)
```

## Step 8: Report to User

```yaml
report:
  display:
    - Roadmap overview
    - Phase summary table
    - Key milestones
    - Timeline visualization (ASCII)
    - Identified risks
    - Next steps
```

</process>

<completion_format>

## ROADMAP CREATED

```markdown
# Project Roadmap

**Created:** {YYYY-MM-DD}
**Last Updated:** {YYYY-MM-DD}
**Total Phases:** {count}
**Estimated Duration:** {weeks/months}

## Overview

{2-3 paragraph project summary and high-level roadmap overview}

---

## Phase 1: {Phase Name}

**ID:** `01`
**Type:** {foundation | feature | integration | polish | launch}
**Objective:** {Clear, measurable objective}
**Duration:** {Estimated duration}
**Status:** Not Started

### Milestones

- [ ] **M1.1:** {Milestone name} - {brief description}
- [ ] **M1.2:** {Milestone name} - {brief description}

### Deliverables

- {Deliverable 1}
- {Deliverable 2}

### Dependencies

- None (first phase) OR
- Phase {X} completion required

### Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| {Risk 1} | Medium | High | {Mitigation strategy} |

---

## Phase 2: {Phase Name}

**ID:** `02`
...

---

## Timeline

```
Phase 1 ████████░░░░░░░░░░░░ Weeks 1-4
Phase 2 ░░░░████████░░░░░░░░ Weeks 5-8
Phase 3 ░░░░░░░░████████░░░░ Weeks 9-12
Phase 4 ░░░░░░░░░░░░████████ Weeks 13-16
```

## Dependency Graph

```
Phase 1 ──→ Phase 2 ──→ Phase 4
              ↓
           Phase 3 ─────────↗
```

## Risk Summary

| Phase | Key Risk | Status |
|-------|----------|--------|
| 1 | {Risk} | Not Mitigated |
| 2 | {Risk} | Mitigation Planned |

## Success Criteria

- [ ] {Overall project success criterion 1}
- [ ] {Overall project success criterion 2}
- [ ] {Overall project success criterion 3}
```

## Stored At

- Primary: `.planning/ROADMAP.md`
- Backup: `.idumb/idumb-project-output/roadmaps/{date}-roadmap.md`

## Next Steps

| Action | Command |
|--------|---------|
| Discuss Phase 1 | `/idumb:discuss-phase 01` |
| Plan Phase 1 | `/idumb:plan-phase 01` |
| View status | `/idumb:status` |
| Run research for phase | `/idumb:research --phase=01` |

</completion_format>

<error_handling>

| Error Code | Cause | Resolution |
|------------|-------|------------|
| `M001` | No research or requirements available | Run `/idumb:research` or `/idumb:new-project` first |
| `M002` | Invalid phase count | Use 1-10 phases |
| `M003` | Dependency cycle detected | Review phase ordering, remove circular deps |
| `M004` | Phase scope too large | Break into smaller phases |
| `M005` | Governance not initialized | Run `/idumb:init` first |

</error_handling>

<governance>

## Delegation Chain

```
user → supreme-coordinator → high-governance
                                   ↓
                             roadmapper
                                   ↓
                            low-validator
                                   ↓
                              builder
```

## Validation Points

| Point | Check | Agent |
|-------|-------|-------|
| Pre | Governance initialized | low-validator |
| Pre | Input sources available | supreme-coordinator |
| During | Roadmap structure valid | low-validator |
| During | No dependency cycles | low-validator |
| Post | Roadmap stored | builder |
| Post | Phase directories created | builder |

## Permission Model

| Agent | Can Delegate | Can Write | Can Read |
|-------|--------------|-----------|----------|
| supreme-coordinator | Yes | No | Yes |
| roadmapper | No | No | Yes |
| low-validator | No | No | Yes |
| builder | No | Yes | Yes |

## Planning Integration

If `.planning/` framework detected:
- Read existing `ROADMAP.md` format
- Preserve planning-specific metadata
- Add iDumb governance tracking
- Sync with `STATE.md`

</governance>

<metadata>
```yaml
category: planning
priority: P1
complexity: high
version: 0.2.0
requires: governance-initialized
outputs:
  - .planning/ROADMAP.md
  - .planning/phases/*/README.md
  - .idumb/idumb-project-output/roadmaps/*.md
```
</metadata>
