---
description: "Map codebase structure and generate analysis documents"
id: cmd-map-codebase
parent: commands-idumb
agent: "idumb-supreme-coordinator"
triggers: ["/idumb:map-codebase", "/map-codebase"]
---

# /idumb:map-codebase

<objective>
Comprehensively map the existing codebase structure through parallel analysis agents. Generate structured data (JSON) and human-readable documents (Markdown) covering technology stack, architecture patterns, code quality metrics, and areas of concern. This mapping serves as the foundation for planning and governance decisions.
</objective>

<context>

## Usage

```bash
/idumb:map-codebase [focus-area] [--depth=shallow|standard|deep] [--output=json|md|both]
```

## Arguments

| Argument | Type | Description | Default |
|----------|------|-------------|---------|
| `focus-area` | enum | Specific focus area | `all` |
| `--depth` | enum | Analysis depth | `standard` |
| `--output` | enum | Output format | `both` |

## Focus Areas

| Focus | What It Analyzes |
|-------|------------------|
| `tech` | Technology stack, dependencies, versions |
| `arch` | Architecture patterns, layer structure, boundaries |
| `quality` | Code quality metrics, test coverage, complexity |
| `concerns` | Problem areas, tech debt, anti-patterns |
| `all` | Complete analysis of all areas |

## Prerequisites

- `.idumb/` directory initialized
- Codebase exists with source files
- Templates directory available (optional)

</context>

<skills>

## Auto-Activated Skills

When this command is executed, the following skills are automatically activated:

| Skill | Purpose | Activated For |
|-------|---------|--------------|
| `idumb-codebase-chunker` | Split large codebases | codebase-mapper (when > 50 files) |
| `idumb-research-writer` | Write codebase artifacts | codebase-mapper |

## Skill-Driven Flow Control

The map-codebase command forces specific flows through skill activations:

1. **Codebase Chunking** (`idumb-codebase-chunker`)
   - Triggered when codebase has > 50 source files
   - Automatically organizes analysis by feature/domain
   - Prevents context overflow from scanning entire codebase

2. **Research Artifact Writing** (`idumb-research-writer`)
   - Writes structured artifacts to `.idumb/idumb-project-output/codebase/`
   - Enables persistent codebase analysis results

</skills>

<process>

<process>

## Step 1: Validate Prerequisites

Ensure environment is ready for mapping.

```bash
# Check iDumb is initialized
if [ ! -d ".idumb" ]; then
  echo "ERROR: iDumb not initialized. Run /idumb:init first."
  exit 1
fi

# Check output directory
mkdir -p .idumb/idumb-project-output/codebase

# Verify templates (optional)
[ -d ".opencode/templates" ] && HAS_TEMPLATES=true
```

## Step 2: Spawn Parallel Scanners

Launch multiple scanner agents for concurrent analysis.

```yaml
parallel_scanners:
  tech_scanner:
    agent: @idumb-codebase-mapper
    focus: tech
    task: |
      Analyze technology stack:
      - Languages and versions
      - Frameworks detected
      - Dependencies (package.json, Cargo.toml, go.mod, etc.)
      - Build tools and configuration
      - Runtime requirements
    output: .idumb/idumb-project-output/codebase/tech-stack.json

  arch_scanner:
    agent: @idumb-codebase-mapper
    focus: arch
    task: |
      Analyze architecture:
      - Directory structure patterns
      - Layer separation (api, domain, infra)
      - Module boundaries
      - Entry points
      - Dependency flow direction
    output: .idumb/idumb-project-output/codebase/architecture.json

  quality_scanner:
    agent: @idumb-codebase-mapper
    focus: quality
    task: |
      Analyze code quality:
      - Test coverage (files, not lines)
      - Test frameworks detected
      - Linting configuration
      - Type safety (TypeScript strict, etc.)
      - Documentation coverage
    output: .idumb/idumb-project-output/codebase/quality.json

  concerns_scanner:
    agent: @idumb-codebase-mapper
    focus: concerns
    task: |
      Identify concerns:
      - TODO/FIXME/HACK comments
      - Large files (>500 lines)
      - Complex functions (high nesting)
      - Circular dependencies
      - Security anti-patterns
      - Outdated dependencies
    output: .idumb/idumb-project-output/codebase/concerns.json
```

**Scanner Execution:**
```
Delegate to: @idumb-codebase-mapper (4 parallel instances)

Each scanner runs independently:
- Uses glob patterns to find relevant files
- Uses grep for pattern detection
- Analyzes without modifying files
- Returns structured JSON
```

## Step 3: Collect Scanner Results

Wait for all scanners to complete and validate outputs.

```bash
# Verify all outputs exist
for focus in tech arch quality concerns; do
  file=".idumb/idumb-project-output/codebase/${focus}.json"
  if [ ! -f "$file" ]; then
    echo "WARNING: Scanner output missing: $file"
  fi
done
```

## Step 4: Synthesize Results

Merge all scanner outputs into unified codebase map.

```
Delegate to: @idumb-research-synthesizer

Task: Synthesize codebase analysis
Inputs:
  - tech-stack.json
  - architecture.json
  - quality.json
  - concerns.json
Output: codebase-map.json

Include:
  - Cross-cutting patterns
  - Inconsistencies between scanners
  - Priority ranking of concerns
  - Summary statistics
```

**Synthesis Logic:**
```yaml
synthesis:
  merge_strategy: deep_merge
  conflict_resolution: latest_wins
  
  cross_analysis:
    - tech_arch_alignment: "Do technologies match architecture patterns?"
    - quality_concern_correlation: "Do quality metrics explain concerns?"
    - coverage_gaps: "What areas lack analysis data?"
  
  priority_ranking:
    critical: "Security issues, breaking changes"
    high: "Major tech debt, complexity hotspots"
    medium: "Minor inconsistencies, style issues"
    low: "Documentation gaps, nice-to-haves"
```

## Step 5: Generate Summary Statistics

Calculate aggregate metrics.

```yaml
statistics:
  files:
    total: <count>
    by_language:
      typescript: <count>
      javascript: <count>
      python: <count>
      ...
    
  complexity:
    average_file_size: <lines>
    largest_files: [<top 5>]
    deepest_nesting: <level>
    
  quality:
    test_file_ratio: <percentage>
    typed_file_ratio: <percentage>
    documented_exports: <percentage>
    
  concerns:
    total_todos: <count>
    security_issues: <count>
    complexity_hotspots: <count>
```

## Step 6: Generate Markdown Documents

Transform JSON data into readable documents.

```
Delegate to: @idumb-builder

Task: Generate codebase documentation
Template: (if available) .opencode/templates/codebase-docs.md

Generate:
  - .idumb/idumb-project-output/codebase/README.md (overview)
  - .idumb/idumb-project-output/codebase/tech-stack.md
  - .idumb/idumb-project-output/codebase/architecture.md
  - .idumb/idumb-project-output/codebase/quality-report.md
  - .idumb/idumb-project-output/codebase/concerns-report.md
```

## Step 7: Create Anchors for Critical Findings

Record significant discoveries as governance anchors.

```
Use tool: idumb-state_anchor

For each critical finding:
  type: "context"
  content: "<Finding with implications>"
  priority: "high" or "critical"
```

## Step 8: Update Governance State

Record mapping completion in state.

```
Use tool: idumb-state_history

action: "codebase:mapped"
result: "pass"
```

</process>

<completion_format>

## Codebase Map JSON Structure

**Path:** `.idumb/idumb-project-output/codebase/codebase-map.json`

```json
{
  "version": "1.0.0",
  "timestamp": "<ISO-8601>",
  "project": {
    "name": "<project-name>",
    "root": "<absolute-path>"
  },
  "tech": {
    "languages": {
      "primary": "typescript",
      "secondary": ["javascript", "css"],
      "config": ["json", "yaml"]
    },
    "frameworks": ["nextjs", "react"],
    "runtime": "node-20",
    "package_manager": "npm",
    "dependencies": {
      "production": 45,
      "development": 23
    }
  },
  "architecture": {
    "pattern": "layered|modular|monolith|microservices",
    "structure": {
      "src/": "source code",
      "tests/": "test files",
      "docs/": "documentation"
    },
    "entry_points": ["src/index.ts", "src/app/page.tsx"],
    "layers": ["presentation", "domain", "infrastructure"]
  },
  "quality": {
    "test_coverage": {
      "files_with_tests": 34,
      "total_source_files": 89,
      "ratio": 0.38
    },
    "type_safety": "strict",
    "linting": "eslint",
    "formatting": "prettier"
  },
  "concerns": {
    "critical": [],
    "high": [
      {"type": "complexity", "file": "src/legacy/handler.ts", "detail": "500+ lines"}
    ],
    "medium": [
      {"type": "todo", "count": 23, "pattern": "TODO|FIXME"}
    ],
    "low": []
  },
  "statistics": {
    "total_files": 156,
    "total_lines": 24500,
    "average_file_size": 157
  }
}
```

## Console Output

```
✓ Codebase mapping completed

  Project: <name>
  Analyzed: <file-count> files
  Duration: <time>

  Technology Stack:
  ├── Primary: TypeScript (89%)
  ├── Frameworks: Next.js, React
  ├── Runtime: Node.js 20
  └── Dependencies: 45 prod, 23 dev

  Architecture:
  ├── Pattern: Layered Architecture
  ├── Entry Points: 2
  └── Layers: presentation, domain, infrastructure

  Quality:
  ├── Test Coverage: 38% (file ratio)
  ├── Type Safety: Strict mode
  └── Linting: ESLint + Prettier

  Concerns:
  ├── Critical: 0
  ├── High: 3 (complexity hotspots)
  ├── Medium: 23 (TODOs)
  └── Low: 12 (style issues)

  Output:
  ├── .idumb/idumb-project-output/codebase/codebase-map.json
  ├── .idumb/idumb-project-output/codebase/README.md
  ├── .idumb/idumb-project-output/codebase/tech-stack.md
  ├── .idumb/idumb-project-output/codebase/architecture.md
  ├── .idumb/idumb-project-output/codebase/quality-report.md
  └── .idumb/idumb-project-output/codebase/concerns-report.md

  Next:
  1. /idumb:research - Research specific concerns
  2. /idumb:roadmap - Create improvement roadmap
```

## Error Codes

| Code | Cause | Resolution |
|------|-------|------------|
| `M001` | iDumb not initialized | Run `/idumb:init` first |
| `M002` | No source files found | Verify codebase exists |
| `M003` | Scanner timeout | Retry with `--depth=shallow` |
| `M004` | Permission denied | Check file read permissions |

</completion_format>

<success_criteria>

## Mapping Completion Checklist

- [ ] All 4 scanner agents spawned
- [ ] tech-stack.json created with valid JSON
- [ ] architecture.json created with valid JSON
- [ ] quality.json created with valid JSON
- [ ] concerns.json created with valid JSON
- [ ] codebase-map.json synthesized
- [ ] README.md generated
- [ ] Markdown documents generated
- [ ] Critical findings anchored
- [ ] History entry recorded
- [ ] Summary displayed to user

## Quality Criteria

- [ ] Languages detected correctly
- [ ] Framework detection accurate
- [ ] Architecture pattern identified
- [ ] Test coverage calculated
- [ ] Concerns prioritized
- [ ] No scanner errors

## Verification

```bash
# Verify outputs exist
ls -la .idumb/idumb-project-output/codebase/

# Validate JSON syntax
cat .idumb/idumb-project-output/codebase/codebase-map.json | jq .

# Check summary
head -50 .idumb/idumb-project-output/codebase/README.md
```

</success_criteria>

## Related Commands

| Command | Purpose |
|---------|---------|
| `/idumb:init` | Initialize before mapping |
| `/idumb:research` | Deep-dive on specific findings |
| `/idumb:roadmap` | Plan improvements based on mapping |
| `/idumb:validate` | Validate mapping freshness |

## Governance

**Delegation Chain:**
```
user → supreme-coordinator → codebase-mapper (x4 parallel)
                           → research-synthesizer
                           → builder
```

**Validation Points:**
- Pre: iDumb initialized
- During: Each scanner validates its output
- Post: Synthesized map validates
- Post: Critical findings anchored

## Metadata

```yaml
category: analysis
priority: P1
complexity: high
parallel: true
version: 0.2.0
```
