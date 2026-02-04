# map-codebase Workflow

id: wf-map-codebase
parent: workflows
## Overview
This workflow maps codebase structure by spawning parallel scanner agents.

## Phase 1: Parallel Scanning

### Scanner 1: Technology Stack
**Agent:** idumb-codebase-mapper
**Focus:** tech
**Tasks:**
1. Detect programming languages
2. Identify frameworks and libraries
3. Find configuration files
4. Map dependencies

**Output:** tech-stack section in codebase-map.json

**Detection Patterns:**
- Languages: `package.json` (JS/TS), `Cargo.toml` (Rust), `go.mod` (Go), `requirements.txt` (Python)
- Frameworks: React (`react` in deps), Next.js (`next` in deps), Express (`express` in deps)
- Configs: `tsconfig.json`, `webpack.config.js`, `vite.config.ts`

### Scanner 2: Architecture
**Agent:** idumb-codebase-mapper
**Focus:** arch
**Tasks:**
1. Identify entry points
2. Map module relationships
3. Find API endpoints
4. Document data flow

**Output:** architecture section in codebase-map.json

**Detection Patterns:**
- Entry points: `index.js`, `main.ts`, `app.ts`, `server.js`
- API routes: `routes/`, `api/`, `pages/api/`
- Components: `components/`, `src/components/`
- Services: `services/`, `lib/`, `utils/`

### Scanner 3: Code Quality
**Agent:** idumb-codebase-mapper
**Focus:** quality
**Tasks:**
1. Check test coverage
2. Find linting configuration
3. Identify code patterns
4. Flag potential issues

**Output:** quality section in codebase-map.json

**Detection Patterns:**
- Tests: `*.test.*`, `*.spec.*`, `__tests__/`, `tests/`
- Linting: `.eslintrc*`, `.prettierrc*`, `biome.json`
- Types: `tsconfig.json`, type coverage
- CI/CD: `.github/workflows/`, `.gitlab-ci.yml`

### Scanner 4: Concerns & Risks
**Agent:** idumb-codebase-mapper
**Focus:** concerns
**Tasks:**
1. Find TODO/FIXME comments
2. Identify security concerns
3. Check for deprecated patterns
4. Document technical debt

**Output:** concerns section in codebase-map.json

**Detection Patterns:**
- TODOs: `TODO:`, `FIXME:`, `HACK:`, `XXX:`
- Security: `eval(`, `innerHTML`, `dangerouslySetInnerHTML`
- Deprecated: `@deprecated`, `console.log` in production code
- Debt: Large files (>500 lines), complex functions

## Phase 2: Synthesis

### Combine Results
Merge all scanner outputs into unified codebase-map.json:

```json
{
  "timestamp": "2026-02-03T...",
  "project": {
    "name": "...",
    "root": "..."
  },
  "techStack": {
    "languages": [...],
    "frameworks": [...],
    "dependencies": {...},
    "configs": [...]
  },
  "architecture": {
    "entryPoints": [...],
    "modules": [...],
    "apiEndpoints": [...],
    "dataFlow": [...]
  },
  "quality": {
    "testCoverage": {...},
    "linting": {...},
    "typeCoverage": {...},
    "ciCd": {...}
  },
  "concerns": {
    "todos": [...],
    "security": [...],
    "deprecated": [...],
    "technicalDebt": [...]
  },
  "summary": {
    "totalFiles": 0,
    "totalLines": 0,
    "languages": {...},
    "healthScore": 0
  }
}
```

### Health Score Calculation
```
healthScore = (
  (hasTests ? 25 : 0) +
  (hasLinting ? 25 : 0) +
  (hasTypes ? 25 : 0) +
  (hasCiCd ? 25 : 0) -
  (concernCount * 5)
)
```

## Phase 3: Document Generation

### Template Processing
Use templates from `template/templates/codebase/`:
- `stack.md` → `.idumb/idumb-project-output/codebase/stack.md`
- `architecture.md` → `.idumb/idumb-project-output/codebase/architecture.md`
- `structure.md` → `.idumb/idumb-project-output/codebase/structure.md`
- `conventions.md` → `.idumb/idumb-project-output/codebase/conventions.md`

### Template Variables
Replace placeholders in templates:
- `{{PROJECT_NAME}}` - Project name
- `{{TECH_STACK}}` - Technology list
- `{{ARCHITECTURE}}` - Architecture summary
- `{{TIMESTAMP}}` - Generation time
- `{{HEALTH_SCORE}}` - Calculated health score
- `{{FILE_COUNT}}` - Total file count
- `{{LINE_COUNT}}` - Total line count

### Document Structure

#### stack.md
```markdown
# Technology Stack

## Languages
{{LANGUAGES}}

## Frameworks
{{FRAMEWORKS}}

## Dependencies
{{DEPENDENCIES}}

## Configuration
{{CONFIGS}}
```

#### architecture.md
```markdown
# Architecture

## Entry Points
{{ENTRY_POINTS}}

## Module Structure
{{MODULES}}

## API Endpoints
{{API_ENDPOINTS}}

## Data Flow
{{DATA_FLOW}}
```

#### structure.md
```markdown
# Project Structure

## Directory Tree
{{DIRECTORY_TREE}}

## File Organization
{{FILE_ORGANIZATION}}

## Naming Conventions
{{NAMING_CONVENTIONS}}
```

#### conventions.md
```markdown
# Code Conventions

## Style Guide
{{STYLE_GUIDE}}

## Patterns Used
{{PATTERNS}}

## Best Practices
{{BEST_PRACTICES}}
```

## Error Handling
- If scanner fails, log error and continue
- If template missing, use default
- If output directory missing, create it

## Error Recovery
```yaml
on_scanner_failure:
  action: log_error_continue
  fallback: use_partial_data

on_template_missing:
  action: use_default_template
  default: minimal_template

on_directory_missing:
  action: create_directory
  recursive: true
```

## Completion Criteria
- [ ] All 4 scanners completed
- [ ] codebase-map.json created
- [ ] At least 2 documents generated
- [ ] Health score calculated
- [ ] Timestamp recorded

## Performance Considerations
- Parallel scanning reduces time by ~60%
- Large codebases (>10k files) may need chunked processing
- Template generation is I/O bound, can be async

## Security Notes
- Never expose sensitive data in maps
- Filter out `.env` files and secrets
- Respect `.gitignore` patterns
