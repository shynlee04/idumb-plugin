---
description: "Certify the iDumb framework for production use - comprehensive validation ensuring OpenCode compatibility and zero conflicts"
agent: idumb-high-governance
id: cmd-certify
mode: all
gsd_version: "1.0.0"
---

<objective>
Run comprehensive certification process for the iDumb framework. Validates that all components work correctly in OpenCode environment, have no conflicts, meet integration thresholds, and are ready for production use in any project type.
</objective>

<execution_context>
## Reference Files
- Skill: `src/skills/idumb-stress-test/SKILL.md`
- All agents, commands, workflows, tools

## Certification Scope
- Agent coordination (22 agents)
- Command execution (15+ commands)
- Workflow chaining (9 workflows)
- Tool integration (8 tools)
- OpenCode compatibility
- Greenfield/brownfield support
</execution_context>

<context>
## Arguments

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `--level` | string | no | Certification level: basic, standard, strict |
| `--report` | flag | no | Generate detailed certification report |

## Usage Examples

```bash
# Standard certification
/idumb:certify

# Strict certification for production
/idumb:certify --level strict --report

# Basic certification for quick check
/idumb:certify --level basic
```
</context>

<process>
## Step 1: Certification Level Selection

**Goal:** Determine certification rigor

```bash
# Source security utilities
source "$(dirname "$0")/../../security/security-utils.sh"
source "$(dirname "$0")/../../security/integration-counter.sh"

# Security: Validate and sanitize inputs
LEVEL="${1:-standard}"

validate_mode "$LEVEL" || exit 1

case "$LEVEL" in
  basic)
    echo "Running BASIC certification..."
    TESTS="core"
    THRESHOLD=70
    ;;
  standard)
    echo "Running STANDARD certification..."
    TESTS="all"
    THRESHOLD=85
    ;;
  strict)
    echo "Running STRICT certification..."
    TESTS="all+edge"
    THRESHOLD=95
    ;;
esac

## Step 2: Component Inventory

**Goal:** Count and verify all components exist

```bash
echo "Building component inventory..."

# Count agents
AGENTS=$(ls src/agents/idumb-*.md 2>/dev/null | wc -l)
echo "Agents: $AGENTS"

# Count commands
COMMANDS=$(ls src/commands/idumb/*.md 2>/dev/null | wc -l)
echo "Commands: $COMMANDS"

# Count workflows
WORKFLOWS=$(ls src/workflows/*.md 2>/dev/null | wc -l)
echo "Workflows: $WORKFLOWS"

# Count tools
TOOLS=$(ls src/tools/idumb-*.ts 2>/dev/null | wc -l)
echo "Tools: $TOOLS"

# Count skills
SKILLS=$(ls -d src/skills/idumb-*/ 2>/dev/null | wc -l)
echo "Skills: $SKILLS"

TOTAL=$((AGENTS + COMMANDS + WORKFLOWS + TOOLS + SKILLS))
echo "Total components: $TOTAL"
```

## Step 3: OpenCode Compatibility Tests

**Goal:** Verify works correctly in OpenCode

```bash
echo "Testing OpenCode compatibility..."

COMPAT_PASS=0
COMPAT_FAIL=0

# Test 1: Tools use correct wrapper
echo "Test: Tool wrapper usage..."
for tool in src/tools/idumb-*.ts; do
  if grep -q "export const.*= tool(" "$tool"; then
    echo "  ✓ $(basename $tool)"
    ((COMPAT_PASS++))
  else
    echo "  ✗ $(basename $tool) - missing tool() wrapper"
    ((COMPAT_FAIL++))
  fi
done

# Test 2: No console.log in tools
echo "Test: No console.log pollution..."
for tool in src/tools/idumb-*.ts; do
  if ! grep -q "console\.log" "$tool"; then
    echo "  ✓ $(basename $tool)"
    ((COMPAT_PASS++))
  else
    echo "  ✗ $(basename $tool) - has console.log"
    ((COMPAT_FAIL++))
  fi
done

# Test 3: Agents have valid frontmatter
echo "Test: Agent frontmatter..."
for agent in src/agents/idumb-*.md; do
  if head -1 "$agent" | grep -q "^---"; then
    if grep -q "description:" "$agent" && grep -q "mode:" "$agent"; then
      echo "  ✓ $(basename $agent)"
      ((COMPAT_PASS++))
    else
      echo "  ✗ $(basename $agent) - missing required fields"
      ((COMPAT_FAIL++))
    fi
  else
    echo "  ✗ $(basename $agent) - no frontmatter"
    ((COMPAT_FAIL++))
  fi
done

# Test 4: Commands have agent binding
echo "Test: Command-agent binding..."
for cmd in src/commands/idumb/*.md; do
  if grep -q "^agent:" "$cmd"; then
    AGENT=$(grep "^agent:" "$cmd" | head -1 | awk '{print $2}')
    if [ -f "src/agents/${AGENT}.md" ]; then
      echo "  ✓ $(basename $cmd) → $AGENT"
      ((COMPAT_PASS++))
    else
      echo "  ✗ $(basename $cmd) → $AGENT (missing)"
      ((COMPAT_FAIL++))
    fi
  else
    echo "  ⚠ $(basename $cmd) - no agent binding"
  fi
done

COMPAT_SCORE=$((COMPAT_PASS * 100 / (COMPAT_PASS + COMPAT_FAIL + 1)))
echo "OpenCode compatibility: $COMPAT_SCORE%"
```

## Step 4: Integration Matrix Validation

**Goal:** Verify integration thresholds met

```bash
echo "Validating integration matrix..."

INTEGRATION_PASS=0
INTEGRATION_FAIL=0

# Agent integration points (threshold: 30)
echo "Agent integration points..."
for agent in src/agents/idumb-*.md; do
  if [ -f "$agent" ]; then
    POINTS=$(count_integration_points "$agent" "agent")
    RESULT=$(validate_integration_threshold "$POINTS" "agent")
    if [ "$RESULT" = "PASS" ]; then
      echo "  ✓ $(basename $agent): $POINTS points"
      ((INTEGRATION_PASS++))
    else
      echo "  ⚠ $(basename $agent): $POINTS points (< 30)"
      ((INTEGRATION_FAIL++))
    fi
  fi
done

# Command integration points (threshold: 15)
echo "Command integration points..."
for cmd in src/commands/idumb/*.md; do
  if [ -f "$cmd" ]; then
    POINTS=$(count_integration_points "$cmd" "command")
    RESULT=$(validate_integration_threshold "$POINTS" "command")
    if [ "$RESULT" = "PASS" ]; then
      echo "  ✓ $(basename $cmd): $POINTS points"
      ((INTEGRATION_PASS++))
    else
      echo "  ⚠ $(basename $cmd): $POINTS points (< 15)"
      ((INTEGRATION_FAIL++))
    fi
  fi
done

INTEGRATION_SCORE=$((INTEGRATION_PASS * 100 / (INTEGRATION_PASS + INTEGRATION_FAIL + 1)))
echo "Integration matrix: $INTEGRATION_SCORE%"
```

## Step 5: Conflict Detection

**Goal:** Ensure no conflicts between components

```bash
echo "Detecting conflicts..."

CONFLICTS=0

# Conflict 1: Circular delegation
echo "Check: Circular delegation..."
# Check if any agent delegates to its parent
for agent in src/agents/idumb-*.md; do
  NAME=$(basename "$agent" .md | sed 's/idumb-//')
  PARENT=$(grep "^parent:" "$agent" 2>/dev/null | awk '{print $2}')
  if [ -n "$PARENT" ]; then
    PARENT_DELEGATES=$(grep -l "idumb-$NAME" "src/agents/idumb-${PARENT}.md" 2>/dev/null)
    if [ -n "$PARENT_DELEGATES" ]; then
      echo "  ⚠ Potential cycle: $NAME ↔ $PARENT"
      ((CONFLICTS++))
    fi
  fi
done

# Conflict 2: Permission violations
echo "Check: Permission violations..."
for agent in src/agents/idumb-*coordinator*.md; do
  if grep -q "write:.*allow" "$agent" 2>/dev/null; then
    echo "  ✗ $(basename $agent): Coordinator has write permission"
    ((CONFLICTS++))
  fi
done

for agent in src/agents/idumb-builder*.md; do
  if grep -q "task:.*allow" "$agent" 2>/dev/null; then
    echo "  ✗ $(basename $agent): Builder has task permission"
    ((CONFLICTS++))
  fi
done

# Conflict 3: Duplicate IDs
echo "Check: Duplicate IDs..."
DUPLICATES=$(grep -h "^id:" src/agents/*.md src/commands/idumb/*.md src/workflows/*.md 2>/dev/null | sort | uniq -d)
if [ -n "$DUPLICATES" ]; then
  echo "  ✗ Duplicate IDs found:"
  echo "$DUPLICATES"
  ((CONFLICTS++))
fi

if [ "$CONFLICTS" -eq 0 ]; then
  echo "No conflicts detected"
  CONFLICT_SCORE=100
else
  echo "$CONFLICTS conflicts detected"
  CONFLICT_SCORE=$((100 - CONFLICTS * 10))
fi
```

## Step 6: Calculate Certification Score

```bash
# Calculate overall certification score
CERT_SCORE=$(( (COMPAT_SCORE + INTEGRATION_SCORE + CONFLICT_SCORE) / 3 ))

# Determine certification status
if [ "$CERT_SCORE" -ge "$THRESHOLD" ]; then
  CERTIFIED="YES"
  STATUS="PASSED"
else
  CERTIFIED="NO"
  STATUS="FAILED"
fi

echo ""
echo "=========================================="
echo "CERTIFICATION: $STATUS"
echo "Score: $CERT_SCORE% (threshold: $THRESHOLD%)"
echo "=========================================="
```

## Step 7: Generate Certificate (if passed)

```bash
if [ "$CERTIFIED" == "YES" ]; then
  TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  validate_timestamp "$TIMESTAMP"
  
  # Security: Sanitize timestamp in filename
  SAFE_TIMESTAMP=$(echo "$TIMESTAMP" | tr -d ':')
  CERT_DIR=".idumb/brain/governance"
  safe_mkdir "$CERT_DIR"
  CERT_FILE="$CERT_DIR/certificate-${SAFE_TIMESTAMP}.json"
  
  # Security: Atomic write with validation
  CERT_CONTENT=$(cat << EOF
{
  "type": "iDumb Framework Certification",
  "version": "1.0.0",
  "timestamp": "$TIMESTAMP",
  "level": "$LEVEL",
  "score": $CERT_SCORE,
  "threshold": $THRESHOLD,
  "status": "CERTIFIED",
  "components": {
    "agents": $AGENTS,
    "commands": $COMMANDS,
    "workflows": $WORKFLOWS,
    "tools": $TOOLS,
    "skills": $SKILLS,
    "total": $TOTAL
  },
  "validation": {
    "opencode_compatibility": $COMPAT_SCORE,
    "integration_matrix": $INTEGRATION_SCORE,
    "conflict_free": $CONFLICT_SCORE
  },
  "certified_for": [
    "OpenCode CLI",
    "Greenfield projects",
    "Brownfield projects",
    "Simple to complex projects",
    "Solo and team development"
  ]
}
EOF
)
  
  # Use atomic write function
  if atomic_write "$CERT_CONTENT" "$CERT_FILE"; then
    echo "Certificate saved: $CERT_FILE"
  else
    echo "ERROR: Failed to save certificate"
    exit 1
  fi
  
  # Update state
  idumb-state_anchor content="Certified: $CERT_SCORE% ($LEVEL level)" priority="critical" type="checkpoint"
fi

idumb-state_history action="certify:$LEVEL:$CERT_SCORE%" result="$STATUS"
```
</process>

<completion_format>
## iDumb Framework Certification

### Status: {PASSED|FAILED}
### Level: {basic|standard|strict}
### Score: {score}% (threshold: {threshold}%)

---

## Component Inventory

| Component | Count | Status |
|-----------|-------|--------|
| Agents | {n} | ✓ |
| Commands | {n} | ✓ |
| Workflows | {n} | ✓ |
| Tools | {n} | ✓ |
| Skills | {n} | ✓ |
| **Total** | **{total}** | |

---

## Validation Scores

| Category | Score | Weight | Status |
|----------|-------|--------|--------|
| OpenCode Compatibility | {n}% | 33% | {✓/✗} |
| Integration Matrix | {n}% | 33% | {✓/✗} |
| Conflict-Free | {n}% | 33% | {✓/✗} |
| **Overall** | **{n}%** | | **{status}** |

---

## Certified For

{if certified}
✓ OpenCode CLI environment
✓ Greenfield projects (new)
✓ Brownfield projects (existing)
✓ Simple to complex projects
✓ Solo and team development
✓ Debug, planning, and execution workflows
{else}
✗ Not certified - score below threshold
{end}

---

## Certificate

{if certified}
**Certificate ID:** {cert_id}
**Issued:** {timestamp}
**Valid for:** iDumb v{version}
**Location:** {cert_file}
{else}
No certificate issued. Fix issues and re-run certification.
{end}

---

## Recommendations

{recommendations}
</completion_format>

<success_criteria>
## For Basic Certification
- [ ] All agents exist and have frontmatter
- [ ] All commands have agent bindings
- [ ] No critical conflicts
- [ ] Score >= 70%

## For Standard Certification
- [ ] All basic checks pass
- [ ] Integration thresholds met (30/15/20)
- [ ] All workflows have chain rules
- [ ] Score >= 85%

## For Strict Certification
- [ ] All standard checks pass
- [ ] Zero conflicts
- [ ] 100% OpenCode compatibility
- [ ] All GSD patterns present
- [ ] Score >= 95%
</success_criteria>

---

*Command: /idumb:certify v1.0.0*
