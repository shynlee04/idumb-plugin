---
name: map-codebase
id: wf-map-codebase
parent: workflows
description: "Maps codebase structure by spawning parallel scanner agents"
type: workflow
version: 1.0.0
gsd_version: "1.0.0"
last_updated: 2026-02-04
interactive: false
internal: false
---

<purpose>
I am the Codebase Mapping Workflow - an executable orchestration program that discovers, analyzes, and documents the complete structure of a codebase through parallel scanning agents. I produce a comprehensive `codebase-map.json` and human-readable documentation that becomes the foundation for all future planning and execution decisions.
</purpose>

<philosophy>
Core principles that guide my execution:

1. **Parallel Discovery First**: Launch all scanners simultaneously to minimize latency - each scanner operates independently on different aspects of the codebase.

2. **Evidence-Based Mapping**: Every claim in the map must trace to actual file paths, pattern matches, or tool output - never assume or infer without evidence.

3. **Graceful Degradation**: If one scanner fails, continue with others - partial maps are better than no maps. Log failures, don't abort.

4. **Security-Conscious**: Never expose sensitive files (.env, credentials, secrets) in any output artifact.

5. **Reproducible Results**: Same codebase should produce same map - timestamps aside, the output must be deterministic.
</philosophy>

<entry_check>
## Pre-flight Validation

```bash
# Check iDumb is initialized
test -d ".idumb/idumb-brain" || { echo "ERROR: iDumb not initialized. Run /idumb:init first"; exit 1; }

# Check we're at project root (has package.json, Cargo.toml, or similar)
PROJ_ROOT=false
for f in package.json Cargo.toml go.mod requirements.txt pyproject.toml Makefile; do
  [ -f "$f" ] && PROJ_ROOT=true && break
done
[ "$PROJ_ROOT" = "false" ] && echo "WARNING: May not be at project root - no common project files found"

# Check output directory exists or create it
mkdir -p .idumb/idumb-project-output/codebase

# Check for previous map (for incremental updates)
if [ -f ".idumb/idumb-project-output/codebase/codebase-map.json" ]; then
  PREV_MAP_DATE=$(jq -r '.timestamp // "unknown"' .idumb/idumb-project-output/codebase/codebase-map.json 2>/dev/null)
  echo "INFO: Previous map found from $PREV_MAP_DATE - will generate fresh map"
fi

echo "Entry check passed. Ready to map codebase."
```

**On failure:** If iDumb not initialized, abort and instruct user to run `/idumb:init`. Otherwise, warn but continue.
</entry_check>

<execution_flow>

## Phase 1: Parallel Scanning (4 Concurrent Agents)

All four scanners launch simultaneously using Task tool delegation.

---

### Scanner 1: Technology Stack Detection

**Agent:** idumb-codebase-mapper
**Focus:** `tech`
**Goal:** Identify all languages, frameworks, dependencies, and configuration

**Commands:**
```bash
# Language detection via package managers
[ -f "package.json" ] && echo "NODE_PROJECT" && jq -r '.dependencies // {} | keys[]' package.json 2>/dev/null | head -50
[ -f "Cargo.toml" ] && echo "RUST_PROJECT" && grep -E '^(name|version|dependencies)' Cargo.toml | head -30
[ -f "go.mod" ] && echo "GO_PROJECT" && head -5 go.mod
[ -f "requirements.txt" ] && echo "PYTHON_PROJECT" && head -20 requirements.txt
[ -f "pyproject.toml" ] && echo "PYTHON_PROJECT_MODERN" && grep -A10 '\[project\]' pyproject.toml 2>/dev/null

# Framework detection
grep -rls '"react"' package.json 2>/dev/null && echo "FRAMEWORK:React"
grep -rls '"next"' package.json 2>/dev/null && echo "FRAMEWORK:Next.js"
grep -rls '"vue"' package.json 2>/dev/null && echo "FRAMEWORK:Vue"
grep -rls '"express"' package.json 2>/dev/null && echo "FRAMEWORK:Express"
grep -rls '"fastify"' package.json 2>/dev/null && echo "FRAMEWORK:Fastify"

# Config file discovery
find . -maxdepth 2 -name "tsconfig*.json" -o -name "*.config.js" -o -name "*.config.ts" -o -name ".eslintrc*" -o -name ".prettierrc*" 2>/dev/null | grep -v node_modules | head -20

# Dependency count
DEP_COUNT=$(jq -r '(.dependencies // {}) + (.devDependencies // {}) | length' package.json 2>/dev/null || echo "0")
echo "DEPENDENCY_COUNT:$DEP_COUNT"
```

**Output Schema:**
```json
{
  "languages": ["TypeScript", "JavaScript", "Rust"],
  "primaryLanguage": "TypeScript",
  "frameworks": ["React", "Next.js"],
  "dependencies": {
    "production": 45,
    "development": 32
  },
  "configs": [
    {"name": "tsconfig.json", "type": "typescript"},
    {"name": "next.config.js", "type": "bundler"}
  ],
  "packageManager": "npm|yarn|pnpm|cargo|go"
}
```

**Validation:** Must return at least 1 language detected
**On failure:** Default to filesystem-based detection (file extensions)

---

### Scanner 2: Architecture Analysis

**Agent:** idumb-codebase-mapper
**Focus:** `arch`
**Goal:** Map entry points, module structure, API endpoints, data flow

**Commands:**
```bash
# Entry point detection
for entry in "src/index.ts" "src/main.ts" "src/app.ts" "index.js" "main.js" "server.js" "app.js"; do
  [ -f "$entry" ] && echo "ENTRY:$entry"
done

# Next.js/App Router detection
[ -d "app" ] && echo "ARCH:Next.js App Router" && find app -name "page.tsx" -o -name "route.ts" 2>/dev/null | head -20
[ -d "pages" ] && echo "ARCH:Next.js Pages Router" && find pages -name "*.tsx" -o -name "*.ts" 2>/dev/null | head -20
[ -d "pages/api" ] && echo "API_DIR:pages/api" && ls pages/api/*.ts 2>/dev/null | head -10

# Standard API routes
[ -d "src/routes" ] && echo "API_DIR:src/routes" && ls src/routes/ 2>/dev/null | head -10
[ -d "routes" ] && echo "API_DIR:routes" && ls routes/ 2>/dev/null | head -10
[ -d "api" ] && echo "API_DIR:api" && ls api/ 2>/dev/null | head -10

# Module structure
find . -type d -name "components" -not -path "*/node_modules/*" 2>/dev/null | head -5
find . -type d -name "services" -not -path "*/node_modules/*" 2>/dev/null | head -5
find . -type d -name "lib" -not -path "*/node_modules/*" 2>/dev/null | head -5
find . -type d -name "utils" -not -path "*/node_modules/*" 2>/dev/null | head -5
find . -type d -name "hooks" -not -path "*/node_modules/*" 2>/dev/null | head -5

# Count modules
SRC_DIRS=$(find . -type d -not -path "*/node_modules/*" -not -path "*/.git/*" -not -name ".*" 2>/dev/null | wc -l)
echo "MODULE_COUNT:$SRC_DIRS"
```

**Output Schema:**
```json
{
  "entryPoints": [
    {"path": "src/index.ts", "type": "main"},
    {"path": "src/server.ts", "type": "server"}
  ],
  "modules": [
    {"name": "components", "path": "src/components", "fileCount": 24},
    {"name": "services", "path": "src/services", "fileCount": 8}
  ],
  "apiEndpoints": [
    {"path": "/api/users", "file": "pages/api/users.ts", "methods": ["GET", "POST"]},
    {"path": "/api/auth", "file": "pages/api/auth/[...nextauth].ts", "methods": ["*"]}
  ],
  "architecture": "Next.js App Router | Monolith | Microservices"
}
```

**Validation:** Must identify at least 1 entry point
**On failure:** Create minimal structure from file tree

---

### Scanner 3: Code Quality Assessment

**Agent:** idumb-codebase-mapper
**Focus:** `quality`
**Goal:** Assess test coverage, linting, type safety, CI/CD

**Commands:**
```bash
# Test detection
TEST_COUNT=$(find . -name "*.test.*" -o -name "*.spec.*" -not -path "*/node_modules/*" 2>/dev/null | wc -l)
echo "TEST_FILE_COUNT:$TEST_COUNT"

# Test directories
[ -d "__tests__" ] && echo "TEST_DIR:__tests__" && ls __tests__/ 2>/dev/null | wc -l
[ -d "tests" ] && echo "TEST_DIR:tests" && ls tests/ 2>/dev/null | wc -l
[ -d "test" ] && echo "TEST_DIR:test" && ls test/ 2>/dev/null | wc -l

# Linting configuration
[ -f ".eslintrc.js" ] || [ -f ".eslintrc.json" ] || [ -f ".eslintrc" ] && echo "LINT:eslint"
[ -f ".prettierrc" ] || [ -f ".prettierrc.json" ] || [ -f "prettier.config.js" ] && echo "FORMAT:prettier"
[ -f "biome.json" ] && echo "LINT:biome"

# TypeScript strictness
if [ -f "tsconfig.json" ]; then
  STRICT=$(jq -r '.compilerOptions.strict // false' tsconfig.json 2>/dev/null)
  echo "TS_STRICT:$STRICT"
  NO_IMPLICIT=$(jq -r '.compilerOptions.noImplicitAny // false' tsconfig.json 2>/dev/null)
  echo "TS_NO_IMPLICIT_ANY:$NO_IMPLICIT"
fi

# CI/CD detection
[ -d ".github/workflows" ] && echo "CI:github-actions" && ls .github/workflows/*.yml 2>/dev/null | head -5
[ -f ".gitlab-ci.yml" ] && echo "CI:gitlab"
[ -f "Jenkinsfile" ] && echo "CI:jenkins"
[ -f ".circleci/config.yml" ] && echo "CI:circleci"

# Coverage reports (if exist)
[ -d "coverage" ] && echo "COVERAGE_DIR_EXISTS:true"
[ -f "coverage/coverage-summary.json" ] && jq '.total.lines.pct' coverage/coverage-summary.json 2>/dev/null
```

**Output Schema:**
```json
{
  "testing": {
    "testFiles": 42,
    "testFramework": "jest|vitest|mocha|pytest",
    "coveragePercent": 78.5
  },
  "linting": {
    "eslint": true,
    "prettier": true,
    "biome": false
  },
  "typeSystem": {
    "typescript": true,
    "strict": true,
    "noImplicitAny": true
  },
  "ciCd": {
    "platform": "github-actions",
    "workflows": ["ci.yml", "deploy.yml"]
  }
}
```

**Validation:** Must return boolean quality indicators
**On failure:** Assume no quality tooling present

---

### Scanner 4: Concerns and Risks Detection

**Agent:** idumb-codebase-mapper
**Focus:** `concerns`
**Goal:** Find TODOs, security issues, deprecated patterns, tech debt

**Commands:**
```bash
# TODO/FIXME/HACK detection (count and sample)
TODO_COUNT=$(grep -rn "TODO:" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" . 2>/dev/null | grep -v node_modules | wc -l)
FIXME_COUNT=$(grep -rn "FIXME:" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" . 2>/dev/null | grep -v node_modules | wc -l)
HACK_COUNT=$(grep -rn "HACK:" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" . 2>/dev/null | grep -v node_modules | wc -l)
echo "TODO_COUNT:$TODO_COUNT"
echo "FIXME_COUNT:$FIXME_COUNT"
echo "HACK_COUNT:$HACK_COUNT"

# Security concerns (patterns only, not secrets)
EVAL_COUNT=$(grep -rn "eval(" --include="*.ts" --include="*.tsx" --include="*.js" . 2>/dev/null | grep -v node_modules | wc -l)
INNERHTML_COUNT=$(grep -rn "innerHTML" --include="*.ts" --include="*.tsx" --include="*.js" . 2>/dev/null | grep -v node_modules | wc -l)
DANGEROUS_COUNT=$(grep -rn "dangerouslySetInnerHTML" --include="*.tsx" --include="*.jsx" . 2>/dev/null | grep -v node_modules | wc -l)
echo "SECURITY_EVAL:$EVAL_COUNT"
echo "SECURITY_INNERHTML:$INNERHTML_COUNT"
echo "SECURITY_DANGEROUS:$DANGEROUS_COUNT"

# Console.log in non-test files (tech debt indicator)
CONSOLE_COUNT=$(grep -rn "console.log" --include="*.ts" --include="*.tsx" --include="*.js" . 2>/dev/null | grep -v node_modules | grep -v ".test." | grep -v ".spec." | wc -l)
echo "CONSOLE_LOG_COUNT:$CONSOLE_COUNT"

# Large files (>500 lines - complexity indicator)
find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" 2>/dev/null | \
  grep -v node_modules | xargs wc -l 2>/dev/null | \
  awk '$1 > 500 {print "LARGE_FILE:"$1":"$2}' | head -10

# Deprecated patterns
DEPRECATED_COUNT=$(grep -rn "@deprecated" --include="*.ts" --include="*.tsx" . 2>/dev/null | grep -v node_modules | wc -l)
echo "DEPRECATED_COUNT:$DEPRECATED_COUNT"

# any() usage (TypeScript anti-pattern)
ANY_COUNT=$(grep -rn ": any" --include="*.ts" --include="*.tsx" . 2>/dev/null | grep -v node_modules | wc -l)
echo "TS_ANY_COUNT:$ANY_COUNT"
```

**Output Schema:**
```json
{
  "todos": {
    "TODO": 15,
    "FIXME": 3,
    "HACK": 2
  },
  "security": {
    "evalUsage": 0,
    "innerHTML": 4,
    "dangerouslySetInnerHTML": 2
  },
  "technicalDebt": {
    "consoleLogCount": 23,
    "largeFiles": [
      {"path": "src/legacy/BigComponent.tsx", "lines": 842}
    ],
    "deprecatedCount": 5,
    "anyTypeCount": 18
  }
}
```

**Validation:** Must complete without error
**On failure:** Return empty concerns (assume clean codebase)

---

## Phase 2: Results Synthesis

**Goal:** Merge all scanner outputs into unified codebase-map.json

**Commands:**
```bash
# Create timestamp
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Get project name from package.json or directory
PROJECT_NAME=$(jq -r '.name // "unknown"' package.json 2>/dev/null || basename $(pwd))

# Get project root
PROJECT_ROOT=$(pwd)

# Count total files and lines
TOTAL_FILES=$(find . -type f -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" 2>/dev/null | grep -v node_modules | wc -l)
TOTAL_LINES=$(find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) 2>/dev/null | grep -v node_modules | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}')

echo "PROJECT:$PROJECT_NAME"
echo "ROOT:$PROJECT_ROOT"
echo "FILES:$TOTAL_FILES"
echo "LINES:$TOTAL_LINES"
```

**Validation:** All 4 scanner outputs received (or graceful fallbacks applied)
**On failure:** Use partial data with warnings in output
</execution_flow>

<parallel_operations>
## Parallel Scanner Orchestration

### Simultaneous Launch
All 4 scanners are launched via Task tool in a single parallel batch:

```
Task[idumb-codebase-mapper, focus=tech] ──┐
Task[idumb-codebase-mapper, focus=arch] ──┼──> Collect Results ──> Merge
Task[idumb-codebase-mapper, focus=quality] ┼
Task[idumb-codebase-mapper, focus=concerns] ┘
```

### Result Merging Strategy
1. Wait for all scanners to complete (or timeout at 60s each)
2. Parse each scanner's JSON output
3. Merge into unified structure maintaining source attribution
4. Calculate derived metrics (health score)

### Conflict Resolution
If scanners produce conflicting data:
- **Languages:** Union of all detected languages
- **Frameworks:** Include all, note primary based on entry point
- **Counts:** Sum if additive, max if measuring same thing

### Health Score Calculation

```javascript
function calculateHealthScore(map) {
  let score = 0;
  
  // Testing (25 points)
  if (map.quality.testing.testFiles > 0) score += 15;
  if (map.quality.testing.coveragePercent > 60) score += 10;
  
  // Linting (25 points)
  if (map.quality.linting.eslint || map.quality.linting.biome) score += 15;
  if (map.quality.linting.prettier) score += 10;
  
  // Type Safety (25 points)
  if (map.quality.typeSystem.typescript) score += 15;
  if (map.quality.typeSystem.strict) score += 10;
  
  // CI/CD (25 points)
  if (map.quality.ciCd.platform) score += 25;
  
  // Deductions for concerns
  const concernCount = 
    map.concerns.todos.FIXME + 
    map.concerns.todos.HACK +
    map.concerns.security.evalUsage * 5 +
    map.concerns.technicalDebt.largeFiles.length * 2;
  
  score -= Math.min(25, concernCount * 2);
  
  return Math.max(0, Math.min(100, score));
}
```

### Timeout Handling
- Individual scanner timeout: 60 seconds
- Total phase timeout: 90 seconds
- On timeout: Use partial results, mark scanner as failed in metadata
</parallel_operations>

<output_artifact>
## Artifact: codebase-map.json

**Path:** `.idumb/idumb-project-output/codebase/codebase-map.json`

### Complete Structure

```json
{
  "version": "1.0.0",
  "timestamp": "2026-02-04T10:30:00Z",
  "project": {
    "name": "my-project",
    "root": "/path/to/project",
    "type": "Next.js Application"
  },
  "techStack": {
    "languages": [
      {"name": "TypeScript", "percentage": 85.2},
      {"name": "JavaScript", "percentage": 10.1},
      {"name": "CSS", "percentage": 4.7}
    ],
    "primaryLanguage": "TypeScript",
    "frameworks": [
      {"name": "Next.js", "version": "14.0.0", "role": "primary"},
      {"name": "React", "version": "18.2.0", "role": "dependency"}
    ],
    "dependencies": {
      "production": 45,
      "development": 32,
      "total": 77
    },
    "packageManager": "pnpm",
    "configs": [
      {"name": "tsconfig.json", "type": "typescript", "path": "./tsconfig.json"},
      {"name": "next.config.js", "type": "bundler", "path": "./next.config.js"}
    ]
  },
  "architecture": {
    "pattern": "Next.js App Router",
    "entryPoints": [
      {"path": "src/app/layout.tsx", "type": "layout", "role": "root"},
      {"path": "src/app/page.tsx", "type": "page", "role": "home"}
    ],
    "modules": [
      {"name": "components", "path": "src/components", "fileCount": 24, "role": "ui"},
      {"name": "services", "path": "src/services", "fileCount": 8, "role": "business-logic"},
      {"name": "hooks", "path": "src/hooks", "fileCount": 12, "role": "state"}
    ],
    "apiEndpoints": [
      {"path": "/api/users", "file": "src/app/api/users/route.ts", "methods": ["GET", "POST"]},
      {"path": "/api/auth/[...nextauth]", "file": "src/app/api/auth/[...nextauth]/route.ts", "methods": ["*"]}
    ]
  },
  "quality": {
    "testing": {
      "testFiles": 42,
      "testFramework": "vitest",
      "coveragePercent": 78.5,
      "lastRun": "2026-02-03T15:00:00Z"
    },
    "linting": {
      "eslint": true,
      "prettier": true,
      "biome": false,
      "configPath": ".eslintrc.js"
    },
    "typeSystem": {
      "typescript": true,
      "version": "5.3.0",
      "strict": true,
      "noImplicitAny": true
    },
    "ciCd": {
      "platform": "github-actions",
      "workflows": ["ci.yml", "deploy.yml", "codeql.yml"]
    }
  },
  "concerns": {
    "todos": {
      "TODO": 15,
      "FIXME": 3,
      "HACK": 2,
      "samples": [
        {"file": "src/utils/api.ts", "line": 42, "text": "TODO: Add retry logic"}
      ]
    },
    "security": {
      "evalUsage": 0,
      "innerHTML": 4,
      "dangerouslySetInnerHTML": 2,
      "locations": [
        {"file": "src/components/RichText.tsx", "line": 15, "pattern": "dangerouslySetInnerHTML"}
      ]
    },
    "technicalDebt": {
      "consoleLogCount": 23,
      "largeFiles": [
        {"path": "src/legacy/BigComponent.tsx", "lines": 842}
      ],
      "deprecatedCount": 5,
      "anyTypeCount": 18
    }
  },
  "summary": {
    "totalFiles": 234,
    "totalLines": 45678,
    "languageBreakdown": {
      "TypeScript": 38900,
      "JavaScript": 4600,
      "CSS": 2178
    },
    "healthScore": 82,
    "healthGrade": "B+",
    "generatedBy": "idumb-codebase-mapper v1.0.0"
  },
  "metadata": {
    "scannersCompleted": 4,
    "scannersFailed": 0,
    "scanDuration": "12.4s",
    "warnings": []
  }
}
```

## Generated Documentation

### Document: stack.md
**Path:** `.idumb/idumb-project-output/codebase/stack.md`

```markdown
# Technology Stack

Generated: {{TIMESTAMP}}
Health Score: {{HEALTH_SCORE}}/100 ({{HEALTH_GRADE}})

## Languages
{{#each languages}}
- **{{name}}**: {{percentage}}% ({{lines}} lines)
{{/each}}

## Frameworks
{{#each frameworks}}
- **{{name}}** v{{version}} - {{role}}
{{/each}}

## Dependencies
- Production: {{dependencies.production}}
- Development: {{dependencies.development}}
- Total: {{dependencies.total}}

## Configuration Files
{{#each configs}}
| File | Type | Path |
|------|------|------|
| {{name}} | {{type}} | {{path}} |
{{/each}}
```

### Document: architecture.md
**Path:** `.idumb/idumb-project-output/codebase/architecture.md`

### Document: quality.md  
**Path:** `.idumb/idumb-project-output/codebase/quality.md`

### Document: concerns.md
**Path:** `.idumb/idumb-project-output/codebase/concerns.md`
</output_artifact>

<recovery_protocol>
## Error Recovery Procedures

### Scanner Timeout
```bash
# If scanner doesn't respond in 60s
SCANNER_TIMEOUT=60
timeout $SCANNER_TIMEOUT <scanner_command> || {
  echo "WARN: Scanner timed out, using fallback"
  # Use minimal detection
}
```

### Corrupted Previous Map
```bash
# Validate JSON before merging
if ! jq empty .idumb/idumb-project-output/codebase/codebase-map.json 2>/dev/null; then
  echo "WARN: Previous map corrupted, creating fresh"
  mv .idumb/idumb-project-output/codebase/codebase-map.json \
     .idumb/idumb-project-output/codebase/codebase-map.json.corrupted.$(date +%s)
fi
```

### Permission Errors
```bash
# Check write permissions
if ! touch .idumb/idumb-project-output/codebase/.write-test 2>/dev/null; then
  echo "ERROR: Cannot write to output directory"
  exit 1
fi
rm -f .idumb/idumb-project-output/codebase/.write-test
```

### Large Codebase Handling
```bash
# If file count > 10000, use sampling
FILE_COUNT=$(find . -type f -not -path "*/node_modules/*" 2>/dev/null | wc -l)
if [ "$FILE_COUNT" -gt 10000 ]; then
  echo "WARN: Large codebase detected ($FILE_COUNT files), using sampling"
  SAMPLE_MODE=true
fi
```
</recovery_protocol>

<chain_rules>
## On Success

**Chain to:** `/idumb:validate` (optional) or display summary
**Auto:** false - Present results to user first

```bash
# After successful mapping
echo "Codebase map generated: .idumb/idumb-project-output/codebase/codebase-map.json"
echo "Health Score: $HEALTH_SCORE/100"
echo ""
echo "Next steps:"
echo "  /idumb:validate     - Validate governance state"
echo "  /idumb:new-project  - Start planning with this context"
echo "  /idumb:roadmap      - Generate project roadmap"
```

## On Partial Success

If some scanners failed:
1. Generate map with available data
2. Mark failed sections as `null` with `error` field
3. Warn user about incomplete map
4. Suggest re-running specific scanners

## Integration with Planning

When `.planning/` exists:
- Cross-reference map with PROJECT.md
- Validate technology claims in planning docs
- Flag discrepancies as concerns
</chain_rules>

<success_criteria>
## Verification Checkboxes

### Pre-execution
- [ ] `.idumb/idumb-brain/` directory exists
- [ ] Project root identified (package.json or equivalent)
- [ ] Output directory writable

### Scanner Execution
- [ ] Tech stack scanner completed (or graceful fallback)
- [ ] Architecture scanner completed (or graceful fallback)  
- [ ] Quality scanner completed (or graceful fallback)
- [ ] Concerns scanner completed (or graceful fallback)

### Output Generation
- [ ] `codebase-map.json` is valid JSON
- [ ] At least 1 language detected
- [ ] At least 1 entry point identified
- [ ] Health score calculated (0-100 range)
- [ ] Timestamp recorded

### Documentation
- [ ] At least `stack.md` generated
- [ ] Documentation reflects actual codebase state
- [ ] No sensitive data exposed in any output

### State Update
- [ ] iDumb state updated with mapping timestamp
- [ ] History entry recorded for mapping action
</success_criteria>

<security_notes>
## Security Considerations

### Never Include
- `.env` file contents
- API keys, tokens, secrets
- Private key files
- Database credentials
- `.npmrc` with auth tokens

### Safe to Include
- File paths (sanitized)
- Package names and versions
- Config file existence (not contents of sensitive ones)
- Count statistics

### Filtering Commands
```bash
# Exclude secrets from grep patterns
EXCLUDE_PATTERNS="*.env*|*credentials*|*secret*|*.pem|*.key"
find . -type f | grep -vE "$EXCLUDE_PATTERNS"
```
</security_notes>

---
*Workflow: map-codebase v1.0.0 (GSD)*
