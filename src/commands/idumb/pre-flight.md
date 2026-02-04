---
description: "Pre-flight validation before starting work on any project - checks environment, governance state, and project readiness"
agent: idumb-low-validator
id: cmd-pre-flight
mode: all
gsd_version: "1.0.0"
---

<objective>
Execute pre-flight validation checks before starting development work on a project. Ensures the environment is ready, iDumb is properly initialized, and no conflicts exist. Works for both greenfield and brownfield projects.
</objective>

<execution_context>
## Reference Files
- Skill: `src/skills/idumb-project-validation/SKILL.md`
- State: `.idumb/idumb-brain/state.json`
- Config: `.idumb/idumb-brain/config.json`

## Integration Points
- Reads: Environment, git state, project structure
- Writes: `.idumb/idumb-brain/governance/pre-flight-{timestamp}.json`
- Triggers: Auto-validation on session start
</execution_context>

<context>
## Arguments

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `--quick` | flag | no | Run minimal checks only (< 3s) |
| `--full` | flag | no | Run comprehensive checks (< 30s) |
| `--fix` | flag | no | Attempt to fix issues automatically |
| `--greenfield` | flag | no | Optimize for new project |
| `--brownfield` | flag | no | Optimize for existing project |

## Usage Examples

```bash
# Standard pre-flight check
/idumb:pre-flight

# Quick check before resuming
/idumb:pre-flight --quick

# Full check with auto-fix
/idumb:pre-flight --full --fix

# Greenfield project setup
/idumb:pre-flight --greenfield
```
</context>

<process>
## Step 1: Detect Project Type

**Goal:** Determine if project is greenfield or brownfield

```bash
# Security: Add error handling and input validation
set -euo pipefail

# Security: Validate and sanitize inputs
QUICK="${QUICK:-false}"
FULL="${FULL:-false}"
FIX="${FIX:-false}"
GREENFIELD="${GREENFIELD:-false}"
BROWNFIELD="${BROWNFIELD:-false}"

echo "Detecting project type..."

# Count files (excluding node_modules, .git)
FILES=$(find . -type f \( -name "*.ts" -o -name "*.js" -o -name "*.md" \) | grep -v node_modules | grep -v .git | wc -l)

# Count git commits
COMMITS=$(git log --oneline 2>/dev/null | wc -l || echo 0)

# Check for existing governance
HAS_PLANNING=$(test -d ".planning" && echo "yes" || echo "no")
HAS_IDUMB=$(test -d ".idumb" && echo "yes" || echo "no")

# Determine type
if [ "$FILES" -lt 20 ] && [ "$COMMITS" -lt 5 ] && [ "$HAS_PLANNING" == "no" ]; then
  PROJECT_TYPE="GREENFIELD"
elif [ "$FILES" -gt 100 ] || [ "$COMMITS" -gt 20 ]; then
  PROJECT_TYPE="BROWNFIELD"
else
  PROJECT_TYPE="TRANSITIONAL"
fi

echo "Project type: $PROJECT_TYPE"
echo "Files: $FILES, Commits: $COMMITS"
```

**Validation:** Project type determined

## Step 2: Environment Checks

**Goal:** Verify development environment is ready

```bash
echo "Running environment checks..."

CHECKS_PASSED=0
CHECKS_FAILED=0

# Check 1: Node.js version
NODE_VERSION=$(node --version 2>/dev/null | sed 's/v//')
if [ -n "$NODE_VERSION" ]; then
  MAJOR=$(echo "$NODE_VERSION" | cut -d. -f1)
  if [ "$MAJOR" -ge 18 ]; then
    echo "✓ Node.js $NODE_VERSION (>= 18)"
    ((CHECKS_PASSED++))
  else
    echo "✗ Node.js $NODE_VERSION (requires >= 18)"
    ((CHECKS_FAILED++))
  fi
else
  echo "✗ Node.js not found"
  ((CHECKS_FAILED++))
fi

# Check 2: Git available
if command -v git &> /dev/null; then
  echo "✓ Git available"
  ((CHECKS_PASSED++))
else
  echo "✗ Git not found"
  ((CHECKS_FAILED++))
fi

# Check 3: Git initialized
if [ -d ".git" ]; then
  echo "✓ Git repository initialized"
  ((CHECKS_PASSED++))
else
  echo "✗ Not a git repository"
  ((CHECKS_FAILED++))
fi

# Check 4: OpenCode tools
if [ -d ".opencode" ]; then
  AGENT_COUNT=$(ls .opencode/agents/idumb-*.md 2>/dev/null | wc -l)
  if [ "$AGENT_COUNT" -gt 0 ]; then
    echo "✓ OpenCode agents available ($AGENT_COUNT agents)"
    ((CHECKS_PASSED++))
  else
    echo "✗ No iDumb agents in .opencode/"
    ((CHECKS_FAILED++))
  fi
else
  echo "⚠ .opencode/ directory not found"
  ((CHECKS_FAILED++))
fi

echo "Environment: $CHECKS_PASSED passed, $CHECKS_FAILED failed"
```

**Validation:** All environment checks logged

## Step 3: Governance State Checks

**Goal:** Verify iDumb governance is properly configured

```bash
echo "Running governance checks..."

# Check 1: iDumb initialized
if [ -d ".idumb/idumb-brain" ]; then
  echo "✓ iDumb brain directory exists"
  
  # Check 2: state.json valid
  if jq . .idumb/idumb-brain/state.json > /dev/null 2>&1; then
    echo "✓ state.json is valid JSON"
    
    # Check 3: State freshness
    LAST_VALIDATION=$(jq -r '.lastValidation // "never"' .idumb/idumb-brain/state.json)
    echo "  Last validation: $LAST_VALIDATION"
  else
    echo "✗ state.json is invalid or missing"
  fi
  
  # Check 4: config.json valid
  if jq . .idumb/idumb-brain/config.json > /dev/null 2>&1; then
    echo "✓ config.json is valid JSON"
  else
    echo "✗ config.json is invalid or missing"
  fi
else
  echo "⚠ iDumb not initialized - run /idumb:init"
fi
```

**Validation:** Governance state assessed

## Step 4: Project State Checks

**Goal:** Verify project is ready for development

```bash
echo "Running project checks..."

# Check 1: Uncommitted changes
UNCOMMITTED=$(git status --porcelain 2>/dev/null | wc -l)
if [ "$UNCOMMITTED" -eq 0 ]; then
  echo "✓ No uncommitted changes"
else
  echo "⚠ $UNCOMMITTED uncommitted changes"
fi

# Check 2: Current branch
BRANCH=$(git branch --show-current 2>/dev/null)
if [ -n "$BRANCH" ]; then
  echo "✓ On branch: $BRANCH"
  if [ "$BRANCH" == "main" ] || [ "$BRANCH" == "master" ]; then
    echo "  ⚠ Consider using a feature branch"
  fi
else
  echo "✗ Not on any branch (detached HEAD?)"
fi

# Check 3: Upstream status
git fetch --quiet 2>/dev/null
BEHIND=$(git rev-list --count HEAD..@{u} 2>/dev/null || echo 0)
AHEAD=$(git rev-list --count @{u}..HEAD 2>/dev/null || echo 0)
if [ "$BEHIND" -eq 0 ] && [ "$AHEAD" -eq 0 ]; then
  echo "✓ Branch is up to date with remote"
elif [ "$BEHIND" -gt 0 ]; then
  echo "⚠ Branch is $BEHIND commits behind remote"
elif [ "$AHEAD" -gt 0 ]; then
  echo "✓ Branch is $AHEAD commits ahead of remote"
fi

# Check 4: Conflicts
CONFLICTS=$(git diff --name-only --diff-filter=U 2>/dev/null | wc -l)
if [ "$CONFLICTS" -eq 0 ]; then
  echo "✓ No merge conflicts"
else
  echo "✗ $CONFLICTS files with merge conflicts"
fi
```

**Validation:** Project state assessed

## Step 5: Auto-Fix (if --fix)

**Goal:** Automatically fix resolvable issues

```bash
if [ "$FIX" == "true" ]; then
  echo "Running auto-fix..."
  
  # Fix 1: Initialize iDumb if missing
  if [ ! -d ".idumb/idumb-brain" ]; then
    echo "AUTO-FIX: Initializing iDumb..."
    mkdir -p .idumb/idumb-brain
    TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    echo '{"version":"0.3.0","initialized":"'$TIMESTAMP'","framework":"idumb","phase":"init"}' > .idumb/idumb-brain/state.json
    echo '{"governance":{"level":"standard"}}' > .idumb/idumb-brain/config.json
  fi
  
  # Fix 2: Create missing directories with security checks
  for dir in ".idumb/idumb-project-output" ".idumb/idumb-brain/governance" ".idumb/idumb-brain/history"; do
    if [ ! -d "$dir" ]; then
      echo "AUTO-FIX: Creating $dir"
      # Security: Validate directory path
      if [[ "$dir" == *".."* ]] || [[ "$dir" == *"//"* ]] || [[ "$dir" == *"&"* ]]; then
        echo "ERROR: Unsafe directory path: $dir"
        exit 1
      fi
      mkdir -p "$dir"
    fi
  done
  
  echo "Auto-fix complete"
fi
```

## Step 6: Generate Summary

```bash
# Calculate overall status
if [ "$CHECKS_FAILED" -eq 0 ]; then
  OVERALL="PASS"
  MESSAGE="Environment ready for development"
elif [ "$CHECKS_FAILED" -le 2 ]; then
  OVERALL="WARN"
  MESSAGE="Some issues detected, can proceed with caution"
else
  OVERALL="FAIL"
  MESSAGE="Critical issues detected, fix before proceeding"
fi

echo ""
echo "=========================================="
echo "PRE-FLIGHT CHECK: $OVERALL"
echo "=========================================="
echo ""
echo "$MESSAGE"
echo ""
echo "Project type: $PROJECT_TYPE"
echo "Checks passed: $CHECKS_PASSED"
echo "Checks failed: $CHECKS_FAILED"
echo ""
```
</process>

<completion_format>
## Pre-Flight Check Results

### Overall: {PASS|WARN|FAIL}

---

## Project Profile

| Property | Value |
|----------|-------|
| Type | {greenfield/brownfield/transitional} |
| Files | {count} |
| Commits | {count} |
| Branch | {branch_name} |

---

## Environment Checks

| Check | Status | Details |
|-------|--------|---------|
| Node.js | {✓/✗} | {version} |
| Git | {✓/✗} | {available} |
| Repository | {✓/✗} | {initialized} |
| OpenCode | {✓/✗} | {agent_count} agents |

---

## Governance Checks

| Check | Status | Details |
|-------|--------|---------|
| iDumb Initialized | {✓/✗} | {path} |
| State Valid | {✓/✗} | {last_validation} |
| Config Valid | {✓/✗} | {governance_level} |

---

## Project State

| Check | Status | Details |
|-------|--------|---------|
| Uncommitted Changes | {✓/⚠} | {count} files |
| Branch Status | {✓/⚠} | {ahead}/{behind} remote |
| Merge Conflicts | {✓/✗} | {count} files |

---

## Issues & Fixes

{if issues}
| Issue | Severity | Fixed | Action |
|-------|----------|-------|--------|
{for issue in issues}
| {issue} | {severity} | {fixed} | {action} |
{end}
{else}
No issues detected.
{end}

---

## Recommendation

{recommendation}

---

**Ready to proceed:** {yes/no}
</completion_format>

<success_criteria>
## For Quick Mode
- [ ] Completes in < 3 seconds
- [ ] Environment basics checked
- [ ] Governance existence verified
- [ ] Overall status determined

## For Standard Mode
- [ ] Completes in < 10 seconds
- [ ] All environment checks run
- [ ] All governance checks run
- [ ] All project checks run
- [ ] Issues classified

## For Full Mode
- [ ] Completes in < 30 seconds
- [ ] Deep environment analysis
- [ ] Full governance validation
- [ ] Project health assessment
- [ ] Recommendations provided

## For Auto-Fix
- [ ] Fixable issues identified
- [ ] Fixes applied safely
- [ ] Re-verification passed
- [ ] No new issues introduced
</success_criteria>

---

*Command: /idumb:pre-flight v1.0.0*
