---
description: "Run comprehensive health check on project governance - calculates health score and provides actionable recommendations"
agent: idumb-low-validator
id: cmd-health-check
mode: all
gsd_version: "1.0.0"
---

<objective>
Execute a comprehensive health check on the project's governance state. Calculates a health score across governance, project, and integration dimensions. Provides actionable recommendations for improvement.
</objective>

<execution_context>
## Reference Files
- Skill: `src/skills/idumb-project-validation/SKILL.md`
- State: `.idumb/idumb-brain/state.json`
- Config: `.idumb/idumb-brain/config.json`
- Validation: Previous validation reports

## Integration Points
- Reads: All governance files, project structure, git state
- Writes: `.idumb/idumb-brain/governance/health-check-{timestamp}.json`
- Triggers: Can trigger self-healing if issues found
</execution_context>

<context>
## Arguments

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `--detailed` | flag | no | Include detailed breakdown |
| `--json` | flag | no | Output as JSON |
| `--fix` | flag | no | Auto-fix issues where possible |

## Usage Examples

```bash
# Standard health check
/idumb:health-check

# Detailed health check
/idumb:health-check --detailed

# Health check with auto-fix
/idumb:health-check --fix

# JSON output for tooling
/idumb:health-check --json
```
</context>

<process>
## Step 1: Governance Health Assessment

**Goal:** Evaluate iDumb governance state

```bash
echo "Assessing governance health..."

GOVERNANCE_SCORE=0
GOVERNANCE_MAX=100

# Check 1: State file valid (25 points)
if jq . .idumb/idumb-brain/state.json > /dev/null 2>&1; then
  echo "✓ state.json valid"
  GOVERNANCE_SCORE=$((GOVERNANCE_SCORE + 25))
else
  echo "✗ state.json invalid"
fi

# Check 2: Config file valid (25 points)
if jq . .idumb/idumb-brain/config.json > /dev/null 2>&1; then
  echo "✓ config.json valid"
  GOVERNANCE_SCORE=$((GOVERNANCE_SCORE + 25))
else
  echo "✗ config.json invalid"
fi

# Check 3: State freshness (25 points)
LAST_VALIDATION=$(jq -r '.lastValidation // "1970-01-01T00:00:00Z"' .idumb/idumb-brain/state.json)
HOURS_OLD=$(( ($(date +%s) - $(date -d "$LAST_VALIDATION" +%s 2>/dev/null || echo 0)) / 3600 ))
if [ "$HOURS_OLD" -lt 48 ]; then
  echo "✓ State is fresh ($HOURS_OLD hours old)"
  GOVERNANCE_SCORE=$((GOVERNANCE_SCORE + 25))
elif [ "$HOURS_OLD" -lt 168 ]; then
  echo "⚠ State is stale ($HOURS_OLD hours old)"
  GOVERNANCE_SCORE=$((GOVERNANCE_SCORE + 15))
else
  echo "✗ State is very stale ($HOURS_OLD hours old)"
fi

# Check 4: Agents synced (25 points)
SRC_AGENTS=$(ls src/agents/idumb-*.md 2>/dev/null | wc -l)
OPENCODE_AGENTS=$(ls .opencode/agents/idumb-*.md 2>/dev/null | wc -l)
if [ "$SRC_AGENTS" -eq "$OPENCODE_AGENTS" ]; then
  echo "✓ Agents synced ($SRC_AGENTS files)"
  GOVERNANCE_SCORE=$((GOVERNANCE_SCORE + 25))
else
  echo "⚠ Agents not synced (src: $SRC_AGENTS, .opencode: $OPENCODE_AGENTS)"
  GOVERNANCE_SCORE=$((GOVERNANCE_SCORE + 10))
fi

GOVERNANCE_PERCENT=$((GOVERNANCE_SCORE * 100 / GOVERNANCE_MAX))
echo "Governance score: $GOVERNANCE_PERCENT%"
```

## Step 2: Project Health Assessment

**Goal:** Evaluate project codebase health

```bash
echo "Assessing project health..."

PROJECT_SCORE=0
PROJECT_MAX=100

# Check 1: Tests exist (25 points)
if ls **/*.test.* **/*.spec.* __tests__/* tests/* 2>/dev/null | head -1 > /dev/null; then
  TEST_COUNT=$(find . -name "*.test.*" -o -name "*.spec.*" 2>/dev/null | wc -l)
  echo "✓ Tests exist ($TEST_COUNT files)"
  PROJECT_SCORE=$((PROJECT_SCORE + 25))
else
  echo "⚠ No tests found"
fi

# Check 2: Linting configured (25 points)
if [ -f ".eslintrc.js" ] || [ -f ".eslintrc.json" ] || [ -f "eslint.config.js" ] || [ -f "biome.json" ]; then
  echo "✓ Linting configured"
  PROJECT_SCORE=$((PROJECT_SCORE + 25))
else
  echo "⚠ No linting configuration"
fi

# Check 3: TypeScript/Types (25 points)
if [ -f "tsconfig.json" ]; then
  echo "✓ TypeScript configured"
  PROJECT_SCORE=$((PROJECT_SCORE + 25))
elif ls *.d.ts 2>/dev/null | head -1 > /dev/null; then
  echo "✓ Type definitions exist"
  PROJECT_SCORE=$((PROJECT_SCORE + 15))
else
  echo "⚠ No type system"
fi

# Check 4: CI/CD configured (25 points)
if [ -d ".github/workflows" ] || [ -f ".gitlab-ci.yml" ] || [ -f "Jenkinsfile" ]; then
  echo "✓ CI/CD configured"
  PROJECT_SCORE=$((PROJECT_SCORE + 25))
else
  echo "⚠ No CI/CD configuration"
fi

PROJECT_PERCENT=$((PROJECT_SCORE * 100 / PROJECT_MAX))
echo "Project score: $PROJECT_PERCENT%"
```

## Step 3: Integration Health Assessment

**Goal:** Evaluate integration and environment health

```bash
echo "Assessing integration health..."

INTEGRATION_SCORE=0
INTEGRATION_MAX=100

# Check 1: Git clean (25 points)
UNCOMMITTED=$(git status --porcelain 2>/dev/null | wc -l)
if [ "$UNCOMMITTED" -eq 0 ]; then
  echo "✓ Git working directory clean"
  INTEGRATION_SCORE=$((INTEGRATION_SCORE + 25))
elif [ "$UNCOMMITTED" -lt 10 ]; then
  echo "⚠ $UNCOMMITTED uncommitted changes"
  INTEGRATION_SCORE=$((INTEGRATION_SCORE + 15))
else
  echo "✗ Many uncommitted changes ($UNCOMMITTED)"
fi

# Check 2: Branch current (25 points)
git fetch --quiet 2>/dev/null
BEHIND=$(git rev-list --count HEAD..@{u} 2>/dev/null || echo 0)
if [ "$BEHIND" -eq 0 ]; then
  echo "✓ Branch up to date"
  INTEGRATION_SCORE=$((INTEGRATION_SCORE + 25))
elif [ "$BEHIND" -lt 10 ]; then
  echo "⚠ Branch is $BEHIND commits behind"
  INTEGRATION_SCORE=$((INTEGRATION_SCORE + 15))
else
  echo "✗ Branch is very behind ($BEHIND commits)"
fi

# Check 3: Dependencies fresh (25 points)
if [ -f "package.json" ]; then
  OUTDATED=$(npm outdated 2>/dev/null | wc -l)
  if [ "$OUTDATED" -eq 0 ]; then
    echo "✓ Dependencies up to date"
    INTEGRATION_SCORE=$((INTEGRATION_SCORE + 25))
  elif [ "$OUTDATED" -lt 10 ]; then
    echo "⚠ $OUTDATED outdated dependencies"
    INTEGRATION_SCORE=$((INTEGRATION_SCORE + 15))
  else
    echo "✗ Many outdated dependencies ($OUTDATED)"
  fi
else
  echo "⚠ No package.json"
  INTEGRATION_SCORE=$((INTEGRATION_SCORE + 10))
fi

# Check 4: No conflicts (25 points)
CONFLICTS=$(git diff --name-only --diff-filter=U 2>/dev/null | wc -l)
if [ "$CONFLICTS" -eq 0 ]; then
  echo "✓ No merge conflicts"
  INTEGRATION_SCORE=$((INTEGRATION_SCORE + 25))
else
  echo "✗ $CONFLICTS merge conflicts"
fi

INTEGRATION_PERCENT=$((INTEGRATION_SCORE * 100 / INTEGRATION_MAX))
echo "Integration score: $INTEGRATION_PERCENT%"
```

## Step 4: Calculate Overall Health Score

```bash
# Weighted average: Governance 30%, Project 40%, Integration 30%
OVERALL_SCORE=$(( (GOVERNANCE_PERCENT * 30 + PROJECT_PERCENT * 40 + INTEGRATION_PERCENT * 30) / 100 ))

# Determine rating
if [ "$OVERALL_SCORE" -ge 90 ]; then
  RATING="EXCELLENT"
  COLOR="green"
elif [ "$OVERALL_SCORE" -ge 70 ]; then
  RATING="GOOD"
  COLOR="yellow"
elif [ "$OVERALL_SCORE" -ge 50 ]; then
  RATING="FAIR"
  COLOR="orange"
else
  RATING="POOR"
  COLOR="red"
fi

echo ""
echo "=========================================="
echo "OVERALL HEALTH: $OVERALL_SCORE% ($RATING)"
echo "=========================================="
```

## Step 5: Generate Recommendations

```bash
echo "Generating recommendations..."

RECOMMENDATIONS=()

# Governance recommendations
if [ "$GOVERNANCE_PERCENT" -lt 100 ]; then
  if [ "$HOURS_OLD" -gt 48 ]; then
    RECOMMENDATIONS+=("Run /idumb:validate to refresh state")
  fi
  if [ "$SRC_AGENTS" -ne "$OPENCODE_AGENTS" ]; then
    RECOMMENDATIONS+=("Sync agents: cp src/agents/idumb-*.md .opencode/agents/")
  fi
fi

# Project recommendations
if [ "$PROJECT_PERCENT" -lt 100 ]; then
  if [ "$TEST_COUNT" -eq 0 ]; then
    RECOMMENDATIONS+=("Add tests to improve project health")
  fi
  if [ ! -f "tsconfig.json" ]; then
    RECOMMENDATIONS+=("Consider adding TypeScript for type safety")
  fi
fi

# Integration recommendations
if [ "$INTEGRATION_PERCENT" -lt 100 ]; then
  if [ "$UNCOMMITTED" -gt 0 ]; then
    RECOMMENDATIONS+=("Commit or stash $UNCOMMITTED uncommitted changes")
  fi
  if [ "$BEHIND" -gt 0 ]; then
    RECOMMENDATIONS+=("Pull latest changes: git pull")
  fi
fi

# Output recommendations
echo ""
echo "Recommendations:"
for rec in "${RECOMMENDATIONS[@]}"; do
  echo "  → $rec"
done
```

## Step 6: Save Report

```bash
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
REPORT_FILE=".idumb/idumb-brain/governance/health-check-${TIMESTAMP}.json"

mkdir -p .idumb/idumb-brain/governance

cat > "$REPORT_FILE" << EOF
{
  "timestamp": "$TIMESTAMP",
  "overall_score": $OVERALL_SCORE,
  "rating": "$RATING",
  "breakdown": {
    "governance": {
      "score": $GOVERNANCE_PERCENT,
      "max": 100
    },
    "project": {
      "score": $PROJECT_PERCENT,
      "max": 100
    },
    "integration": {
      "score": $INTEGRATION_PERCENT,
      "max": 100
    }
  },
  "recommendations": $(printf '%s\n' "${RECOMMENDATIONS[@]}" | jq -R . | jq -s .)
}
EOF

echo ""
echo "Report saved: $REPORT_FILE"

# Update state
idumb-state_history action="health-check:$OVERALL_SCORE%" result="pass"
```
</process>

<completion_format>
## Health Check Report

### Overall Score: {score}% ({EXCELLENT|GOOD|FAIR|POOR})

---

## Score Breakdown

| Category | Score | Weight | Weighted |
|----------|-------|--------|----------|
| Governance | {g}% | 30% | {gw}% |
| Project | {p}% | 40% | {pw}% |
| Integration | {i}% | 30% | {iw}% |
| **Overall** | | | **{total}%** |

---

## Governance Details

| Check | Status | Score |
|-------|--------|-------|
| State Valid | {✓/✗} | /25 |
| Config Valid | {✓/✗} | /25 |
| State Fresh | {✓/⚠/✗} | /25 |
| Agents Synced | {✓/⚠} | /25 |

---

## Project Details

| Check | Status | Score |
|-------|--------|-------|
| Tests Exist | {✓/⚠} | /25 |
| Linting | {✓/⚠} | /25 |
| Type System | {✓/⚠} | /25 |
| CI/CD | {✓/⚠} | /25 |

---

## Integration Details

| Check | Status | Score |
|-------|--------|-------|
| Git Clean | {✓/⚠/✗} | /25 |
| Branch Current | {✓/⚠/✗} | /25 |
| Dependencies | {✓/⚠/✗} | /25 |
| No Conflicts | {✓/✗} | /25 |

---

## Recommendations

{for rec in recommendations}
→ {rec}
{end}

---

**Report saved:** {report_path}
</completion_format>

<success_criteria>
- [ ] Governance health assessed (4 checks)
- [ ] Project health assessed (4 checks)
- [ ] Integration health assessed (4 checks)
- [ ] Overall score calculated
- [ ] Rating determined
- [ ] Recommendations generated
- [ ] Report saved to governance/
- [ ] State history updated
</success_criteria>

---

*Command: /idumb:health-check v1.0.0*
