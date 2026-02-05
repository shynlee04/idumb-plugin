# Spec-Driven Workflow Skill

**Version:** 1.0.0
**Date:** 2026-02-05
**Status:** Active

## Overview

This skill provides a comprehensive, spec-driven development workflow that enforces quality through mandatory research, validated specifications, and systematic execution. It adapts to any project sector (web, mobile, API, CLI, AI/ML, etc.) and complexity tier (simple to enterprise).

## Triggers

Use this skill when:
- User says: "build", "implement", "create feature", "add functionality"
- Agent detects: implementation request without existing spec
- Workflow hits: unvalidated technical decision
- Command: `/idumb:spec`, `/idumb:build`, `/idumb:implement`

## Core Principles

1. **Nothing Ships Without Spec** — Every implementation traces to a validated specification
2. **Research Before Commitment** — Unknown tech/patterns trigger mandatory research
3. **Multi-Source Validation** — Minimum 2 research tools for cross-referencing
4. **Sector-Aware Templates** — Different app types need different structures
5. **Complexity-Scaled Governance** — Simple projects get light gates, complex get heavy

## Research Tool Requirements

### Pre-Flight Check

Before any research stage, verify available tools:

```yaml
tool_inventory:
  tier_1_free:
    - context7: "Library docs, SDK patterns"
    - deepwiki: "GitHub repo analysis"
    - brave_search: "General web search"
  
  tier_2_paid:
    - tavily: "Web search + extraction"
    - exa: "AI-powered search"

minimum_requirements:
  simple: 1 tool (with warning)
  moderate: 2 tools (required)
  complex: 2 tools (required)
  cross_deps: 3 tools (recommended)
```

### Installation Guide (When Tools Missing)

```markdown
## Missing Research Tools - Installation Required

Your current setup has insufficient research tools for reliable spec development.

### Recommended FREE Setup:

**1. Context7** (Library documentation)
```bash
# Add to MCP settings
npx -y @anthropic/context7-mcp
```

**2. Deepwiki** (GitHub repo analysis)
```bash
# Add to MCP settings - check deepwiki documentation
```

**3. Brave Search** (General web - FREE tier available)
```bash
# Requires API key from brave.com/search/api
```

### After Installation:
Run `/idumb:status` to verify tools are detected.
```

## Sector Definitions

### Sector Registry

| Sector ID | Name | Key Patterns | Template Set |
|-----------|------|--------------|--------------|
| `web-fe` | Web Frontend | Components, State, Routing | react/, vue/, svelte/ |
| `web-be` | Web Backend | API, DB, Auth | node/, python/, go/ |
| `fullstack` | Full-Stack | SSR, Data Fetching | nextjs/, nuxt/, remix/ |
| `api` | API/Microservices | Schema, Versioning | rest/, graphql/, grpc/ |
| `cli` | CLI Tools | Args, Output | node-cli/, python-cli/ |
| `mobile` | Mobile Apps | Platform, Deploy | react-native/, flutter/ |
| `desktop` | Desktop Apps | Cross-platform | electron/, tauri/ |
| `aiml` | AI/ML Apps | Models, Pipelines | langchain/, agents/ |
| `data` | Data/ETL | Transforms, Schema | pipeline/, etl/ |
| `devops` | DevOps/Infra | IaC, Deploy | terraform/, docker/, k8s/ |

### Sector Detection

```yaml
detection_rules:
  web-fe:
    indicators:
      - package.json contains: ["react", "vue", "svelte", "angular"]
      - directories: ["src/components", "src/pages", "src/views"]
      - files: ["vite.config", "webpack.config", "tailwind.config"]
  
  web-be:
    indicators:
      - package.json contains: ["express", "fastify", "hono", "koa"]
      - files: ["requirements.txt", "pyproject.toml", "go.mod"]
      - directories: ["src/routes", "src/controllers", "src/api"]
  
  fullstack:
    indicators:
      - package.json contains: ["next", "nuxt", "remix", "sveltekit"]
      - directories: ["app/", "pages/", "src/app"]
      - files: ["next.config", "nuxt.config", "remix.config"]
  
  api:
    indicators:
      - files: ["openapi.yaml", "schema.graphql", "*.proto"]
      - directories: ["src/resolvers", "src/handlers"]
      - package.json contains: ["@apollo", "graphql", "grpc"]
  
  cli:
    indicators:
      - package.json.bin exists
      - files: ["cli.js", "cli.py", "main.go"]
      - package.json contains: ["commander", "yargs", "oclif"]
  
  mobile:
    indicators:
      - files: ["app.json", "pubspec.yaml", "Podfile"]
      - directories: ["ios/", "android/", "lib/"]
  
  desktop:
    indicators:
      - package.json contains: ["electron", "@tauri-apps"]
      - files: ["electron.js", "tauri.conf.json"]
  
  aiml:
    indicators:
      - package.json contains: ["langchain", "@anthropic", "openai"]
      - files: ["requirements.txt"] + contains: ["langchain", "transformers"]
      - directories: ["agents/", "chains/", "prompts/"]
  
  data:
    indicators:
      - files: ["dbt_project.yml", "airflow.cfg", "dagster.yaml"]
      - directories: ["pipelines/", "transforms/", "models/"]
  
  devops:
    indicators:
      - files: ["*.tf", "docker-compose.yml", "Dockerfile"]
      - directories: ["terraform/", "k8s/", "helm/"]
```

## Complexity Tiers

### Tier Definitions

```yaml
tiers:
  simple:
    description: "Single feature, 1-5 files, clear scope"
    indicators:
      - estimated_files: "1-5"
      - cross_dependencies: 0
      - new_patterns: 0
      - integration_points: "0-1"
    governance:
      min_research_tools: 1
      spec_sections_required: ["overview", "requirements", "acceptance"]
      validation_depth: "light"
      checkpoints: 1
  
  moderate:
    description: "Multi-component, established patterns"
    indicators:
      - estimated_files: "5-15"
      - cross_dependencies: "1-3"
      - new_patterns: "0-1"
      - integration_points: "2-5"
    governance:
      min_research_tools: 2
      spec_sections_required: ["overview", "requirements", "architecture", "interfaces", "acceptance", "risks"]
      validation_depth: "standard"
      checkpoints: 3
  
  complex:
    description: "Cross-cutting, new architecture"
    indicators:
      - estimated_files: "15-50"
      - cross_dependencies: "3+"
      - new_patterns: "1+"
      - integration_points: "5+"
    governance:
      min_research_tools: 2
      spec_sections_required: "all"
      validation_depth: "heavy"
      checkpoints: 5
      multi_agent_validation: true
  
  enterprise:
    description: "Compliance, security, scale requirements"
    indicators:
      - compliance_requirements: true
      - security_critical: true
      - multi_team: true
    governance:
      min_research_tools: 3
      spec_sections_required: "all + compliance + security"
      validation_depth: "full"
      checkpoints: "per-task"
      audit_trail: true
      sign_off_required: true
```

## Document Quality Gates

### Under-Clarification Detection

```yaml
under_clarification_signals:
  blockers:
    - pattern: "TBD|TODO|FIXME|XXX"
      severity: "block"
      action: "Must resolve before proceeding"
    
    - pattern: "\\?$"  # Lines ending with ?
      severity: "block"
      action: "Unresolved questions must be answered"
    
    - pattern: "maybe|might|possibly|could be"
      severity: "warn"
      action: "Vague language - clarify or research"
    
    - pattern: "should work|probably|assume"
      severity: "warn"
      action: "Unvalidated assumption - verify"

  missing_sections:
    - section: "Dependencies"
      required_for: ["moderate", "complex", "enterprise"]
    
    - section: "Constraints"
      required_for: ["all"]
    
    - section: "Acceptance Criteria"
      required_for: ["all"]
    
    - section: "Risk Assessment"
      required_for: ["complex", "enterprise"]

  stale_content:
    - age_hours: 48
      action: "Warn - content may be outdated"
    
    - age_hours: 168  # 1 week
      action: "Force fresh research"
    
    - references_version: "check against latest"
      action: "Validate versions still current"

  missing_citations:
    - claim_type: "technical_decision"
      requires: "source_url OR research_reference"
    
    - claim_type: "best_practice"
      requires: "2+ sources"
    
    - claim_type: "version_specific"
      requires: "official_docs_link"
```

### Clarity Score Calculation

```yaml
clarity_scoring:
  weights:
    no_blockers: 30
    all_sections_present: 25
    no_vague_language: 15
    citations_present: 15
    freshness_valid: 15
  
  thresholds:
    proceed: 70
    warn: 50
    block: 0
  
  calculation: |
    score = 0
    if no_blocker_patterns: score += 30
    if all_required_sections: score += 25
    if vague_count < 3: score += 15
    if citation_ratio > 0.8: score += 15
    if all_content_fresh: score += 15
    return score
```

## Stage Reference

See `references/stages-complete.md` for full 56-stage breakdown with:
- Entry conditions
- Agent assignments
- Validation gates
- Hop paths
- Output artifacts

## Quick Stage Map

```
STAGE 0: DISCOVERY (6 sub-stages)
├── 0.1 Entry Detection
├── 0.2 Codebase State Analysis
├── 0.3 Research Tool Inventory ← CRITICAL GATE
├── 0.4 User Settings Load
├── 0.5 Complexity Pre-Assessment
└── 0.6 Route Determination

STAGE 1: IDEATION (7 sub-stages)
├── 1.1 Idea Capture
├── 1.2 Intent Clarification
├── 1.3 Constraint Identification
├── 1.4 Scope Bounding
├── 1.5 Assumption Surfacing
├── 1.6 Clarity Scoring ← QUALITY GATE
└── 1.7 Brainstorm Synthesis

STAGE 2: RESEARCH (9 sub-stages)
├── 2.1 Research Trigger Evaluation
├── 2.2 Existing Codebase Analysis
├── 2.3 Tech Stack Research
├── 2.4 External Research (MCP) ← TOOL GATE
├── 2.5 Assumption Validation
├── 2.6 Cross-Dependency Mapping
├── 2.7 Risk Identification
├── 2.8 Research Synthesis
└── 2.9 Research-to-Spec Readiness ← QUALITY GATE

STAGE 3: SPECIFICATION (12 sub-stages)
├── 3.1 Requirements Extraction
├── 3.2 Requirements-Research Alignment
├── 3.3 Technical Approach Selection
├── 3.4 Architecture Decision
├── 3.5 Interface Definitions
├── 3.6 Acceptance Criteria Definition
├── 3.7 Spec Internal Consistency ← VALIDATION
├── 3.8 Spec-Research Alignment ← VALIDATION
├── 3.9 Under-Clarification Detection ← QUALITY GATE
├── 3.10 Spec Synthesis & Versioning
├── 3.11 Spec Validation (Multi-Agent)
└── 3.12 Spec Approval Gate ← USER GATE

STAGE 4: PLANNING (10 sub-stages)
├── 4.1 Spec-to-Task Decomposition
├── 4.2 Task Dependency Analysis
├── 4.3 Critical Path Identification
├── 4.4 Estimation
├── 4.5 Risk-Task Mapping
├── 4.6 Checkpoint Placement
├── 4.7 Acceptance Criteria Mapping
├── 4.8 Plan Synthesis
├── 4.9 Plan Validation ← VALIDATION
└── 4.10 Plan Approval Gate ← USER GATE

STAGE 5: EXECUTION (11 sub-stages)
├── 5.1 Pre-Execution Validation
├── 5.2 Execution Context Setup
├── 5.3 Task Selection
├── 5.4 Task Execution
├── 5.5 Task Validation ← PER-TASK GATE
├── 5.6 Task Completion
├── 5.7 Checkpoint Evaluation
├── 5.8 Deviation Detection
├── 5.9 Spec Drift Check ← DRIFT GATE
├── 5.10 Execution Loop Control
└── 5.11 Execution Completion

STAGE 6: VERIFICATION (10 sub-stages)
├── 6.1 Execution Completeness Check
├── 6.2 Spec Compliance Verification
├── 6.3 Acceptance Criteria Testing
├── 6.4 Regression Testing
├── 6.5 Integration Verification
├── 6.6 Documentation Verification
├── 6.7 Verification Synthesis
├── 6.8 Stakeholder Review
├── 6.9 Sign-Off Gate ← USER GATE
└── 6.10 Completion & Archival
```

## File Structure

```
src/skills/spec-driven-workflow/
├── SKILL.md                          # This file
├── INDEX.md                          # Quick reference index
│
├── templates/                        # Document templates
│   ├── core/                         # Universal templates
│   │   ├── IDEA-BRIEF.template.md
│   │   ├── RESEARCH.template.md
│   │   ├── SPEC.template.md
│   │   ├── PLAN.template.md
│   │   └── VERIFICATION.template.md
│   │
│   ├── by-sector/                    # Sector-specific templates
│   │   ├── web-fe/
│   │   ├── web-be/
│   │   ├── fullstack/
│   │   ├── api/
│   │   ├── cli/
│   │   ├── mobile/
│   │   ├── desktop/
│   │   ├── aiml/
│   │   ├── data/
│   │   └── devops/
│   │
│   └── by-complexity/                # Complexity-scaled variants
│       ├── simple/
│       ├── moderate/
│       ├── complex/
│       └── enterprise/
│
├── references/                       # Reference documentation
│   ├── stages-complete.md            # Full 56-stage reference
│   ├── hop-paths.md                  # All valid stage transitions
│   ├── validation-rules.md           # All validation criteria
│   │
│   ├── by-stack/                     # Stack-specific patterns
│   │   ├── typescript.md
│   │   ├── python.md
│   │   ├── go.md
│   │   ├── rust.md
│   │   └── ...
│   │
│   └── by-framework/                 # Framework-specific patterns
│       ├── react.md
│       ├── nextjs.md
│       ├── vue.md
│       ├── fastapi.md
│       └── ...
│
├── prompts/                          # Agent prompts per stage
│   ├── stage-0-discovery/
│   ├── stage-1-ideation/
│   ├── stage-2-research/
│   ├── stage-3-specification/
│   ├── stage-4-planning/
│   ├── stage-5-execution/
│   └── stage-6-verification/
│
├── workflows/                        # Sector-specific workflows
│   ├── web-fe-workflow.md
│   ├── web-be-workflow.md
│   ├── fullstack-workflow.md
│   ├── api-workflow.md
│   ├── cli-workflow.md
│   ├── mobile-workflow.md
│   ├── desktop-workflow.md
│   ├── aiml-workflow.md
│   ├── data-workflow.md
│   └── devops-workflow.md
│
├── validators/                       # Validation rule sets
│   ├── clarity-validator.md
│   ├── spec-validator.md
│   ├── plan-validator.md
│   ├── research-validator.md
│   └── by-sector/
│       └── ... (sector-specific validations)
│
└── examples/                         # Complete worked examples
    ├── simple-react-component/
    ├── moderate-api-endpoint/
    ├── complex-fullstack-feature/
    └── enterprise-auth-system/
```

## Integration Points

### Reads From
- `.idumb/brain/config.json` - User preferences, research threshold
- `.idumb/brain/state.json` - Current governance state
- Project codebase - For sector/stack detection
- MCP tool availability - For research capability

### Writes To
- `.idumb/project-output/specs/` - Generated specifications
- `.idumb/project-output/plans/` - Generated plans
- `.idumb/project-output/research/` - Research artifacts
- `.idumb/brain/state.json` - State updates

### Agents Used
| Stage | Primary Agent | Support Agents |
|-------|--------------|----------------|
| 0 | @idumb-project-explorer | - |
| 1 | @idumb-project-researcher | @idumb-skeptic-validator |
| 2 | @idumb-phase-researcher | @idumb-research-synthesizer |
| 3 | @idumb-planner | @idumb-skeptic-validator, @idumb-plan-checker |
| 4 | @idumb-planner | @idumb-plan-checker |
| 5 | @idumb-project-executor | @idumb-builder, @idumb-debugger |
| 6 | @idumb-verifier | @idumb-low-validator |

### Tools Used
- `idumb-state` - State management
- `idumb-config` - Configuration
- `idumb-validate` - Validation checks
- `idumb-context` - Context detection
- `idumb-manifest` - Drift detection
- `context7_*` - Library documentation
- `exa_*` / `tavily_*` - Web research
- `brave-search_*` - General search

## Commands

### /idumb:spec
Start spec-driven workflow from Stage 0.

### /idumb:spec-resume
Resume from last checkpoint.

### /idumb:spec-status
Show current stage and pending gates.

### /idumb:spec-validate
Run validation on current artifacts.

---
*Skill: spec-driven-workflow v1.0.0*
*Created: 2026-02-05*
