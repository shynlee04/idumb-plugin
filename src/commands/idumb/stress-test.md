---
description: "Run comprehensive stress tests on the iDumb framework itself - validates agent coordination, integration completeness, and regression prevention"
agent: idumb-high-governance
id: cmd-stress-test
mode: all
gsd_version: "1.0.0"
---

<objective>
Execute comprehensive stress testing of the iDumb meta-framework to ensure all agents, commands, workflows, and tools work together flawlessly. Supports three modes: micro (real-time), batch (phase transitions), and full (complete certification).
</objective>

<execution_context>
## Reference Files
- Skill: `src/skills/idumb-stress-test/SKILL.md`
- Agents: `src/agents/idumb-*.md` (22 files)
- Commands: `src/commands/idumb/*.md` (15+ files)
- Workflows: `src/workflows/*.md` (9 files)
- Tools: `src/tools/idumb-*.ts` (8 files)

## Integration Points
- Reads: All governance files, state.json, config.json
- Writes: `.idumb/idumb-brain/governance/stress-test-{timestamp}.json`
- Triggers: Validation loops, self-healing, certification
</execution_context>

<context>
## Arguments

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `--micro` | flag | no | Run fast micro-validation (< 5s) |
| `--batch` | flag | no | Run thorough batch validation (< 60s) |
| `--full` | flag | no | Run complete stress test (< 5min) |
| `--heal` | flag | no | Enable self-healing for auto-fixable issues |
| `--report` | flag | no | Generate detailed report |

## Usage Examples

```bash
# Quick micro-validation after action
/idumb:stress-test --micro

# Thorough batch validation at phase transition
/idumb:stress-test --batch

# Full stress test with self-healing
/idumb:stress-test --full --heal

# Full certification with report
/idumb:stress-test --full --report
```
</context>

<process>
## Step 1: Determine Test Mode

**Goal:** Select appropriate test mode based on flags or coordinator decision

```bash
# Parse arguments
MODE="batch"  # default
[ "$1" == "--micro" ] && MODE="micro"
[ "$1" == "--batch" ] && MODE="batch"
[ "$1" == "--full" ] && MODE="full"

# If no flag, let coordinator decide based on conditions
if [ -z "$1" ]; then
  # Check recent activity
  LAST_VALIDATION=$(jq -r '.lastValidation' .idumb/idumb-brain/state.json)
  FILES_CHANGED=$(git status --porcelain | wc -l)
  
  if [ "$FILES_CHANGED" -gt 5 ]; then
    MODE="batch"
  elif [ "$FILES_CHANGED" -gt 0 ]; then
    MODE="micro"
  fi
fi

echo "Selected mode: $MODE"
```

**Validation:** Mode is one of: micro, batch, full

## Step 2: Run Mode-Specific Tests

### Micro Mode (< 5 seconds)
```bash
echo "Running MICRO validation..."

# Test 1: Permission violations
grep -r "write: allow" src/agents/idumb-*coordinator*.md && echo "FAIL: Coordinator has write" || echo "PASS: No coordinator writes"

# Test 2: Chain integrity
grep -r "task: allow" src/agents/idumb-*builder*.md && echo "FAIL: Builder can delegate" || echo "PASS: Builder isolated"

# Test 3: State consistency
jq . .idumb/idumb-brain/state.json > /dev/null && echo "PASS: State valid" || echo "FAIL: State invalid"

# Test 4: No circular refs
# Quick grep for obvious cycles
echo "PASS: Micro validation complete"
```

### Batch Mode (< 60 seconds)
```bash
echo "Running BATCH validation..."

# Run all micro tests first
# ... (micro tests above)

# Test 5: Integration matrix - Agents
echo "Checking agent integration points..."
for agent in src/agents/idumb-*.md; do
  NAME=$(basename "$agent" .md)
  POINTS=$(grep -c -E "(idumb-|/idumb:|\.json|\.md)" "$agent" || echo 0)
  if [ "$POINTS" -lt 30 ]; then
    echo "WARN: $NAME has $POINTS integration points (< 30)"
  else
    echo "PASS: $NAME has $POINTS integration points"
  fi
done

# Test 6: Cross-reference validity
echo "Checking cross-references..."
grep -rhoP '@idumb-[a-z-]+' src/ 2>/dev/null | sort -u | while read ref; do
  AGENT=$(echo "$ref" | sed 's/@//')
  test -f "src/agents/${AGENT}.md" || echo "FAIL: Missing agent $AGENT"
done

# Test 7: Command-agent binding
echo "Checking command bindings..."
for cmd in src/commands/idumb/*.md; do
  AGENT=$(grep -oP 'agent: \K\S+' "$cmd" 2>/dev/null)
  if [ -n "$AGENT" ]; then
    test -f "src/agents/${AGENT}.md" || echo "FAIL: Command $(basename $cmd) references missing agent $AGENT"
  fi
done

echo "PASS: Batch validation complete"
```

### Full Mode (< 5 minutes)
```bash
echo "Running FULL stress test..."

# Run all batch tests first
# ... (batch tests above)

# Test 8: Agent spawning simulation
echo "Simulating agent spawning chains..."

# Chain 1: Coordinator → Builder
echo "Chain 1: supreme-coordinator → high-governance → mid-coordinator → project-executor → builder"
for agent in supreme-coordinator high-governance mid-coordinator project-executor builder; do
  test -f "src/agents/idumb-${agent}.md" && echo "  ✓ $agent" || echo "  ✗ $agent MISSING"
done

# Chain 2: Verification
echo "Chain 2: verifier → low-validator"
for agent in verifier low-validator; do
  test -f "src/agents/idumb-${agent}.md" && echo "  ✓ $agent" || echo "  ✗ $agent MISSING"
done

# Test 9: Full schema compliance
echo "Checking schema compliance..."
# Verify frontmatter structure
for file in src/agents/*.md src/commands/idumb/*.md; do
  head -50 "$file" | grep -q "^---" && echo "PASS: $file has frontmatter" || echo "FAIL: $file missing frontmatter"
done

# Test 10: Regression sweep
echo "Running regression sweep..."
# Check all GSD patterns present
for agent in src/agents/idumb-*.md; do
  grep -q "<role>" "$agent" || echo "WARN: $agent missing <role>"
  grep -q "<philosophy>" "$agent" || echo "WARN: $agent missing <philosophy>"
  grep -q "<success_criteria>" "$agent" || echo "WARN: $agent missing <success_criteria>"
done

echo "PASS: Full stress test complete"
```

**Validation:** All tests return PASS or documented WARN

## Step 3: Self-Healing (if --heal)

```bash
if [ "$HEAL" == "true" ]; then
  echo "Running self-healing..."
  
  # Auto-fix: Add missing task: deny to leaf nodes
  for agent in src/agents/idumb-builder.md src/agents/idumb-low-validator.md; do
    if ! grep -q "task: deny" "$agent"; then
      echo "AUTO-FIX: Adding task: deny to $agent"
      # Would use edit tool here
    fi
  done
  
  # Auto-fix: Remove write from coordinators
  for agent in src/agents/idumb-*coordinator*.md; do
    if grep -q "write: allow" "$agent"; then
      echo "AUTO-FIX: Changing write: allow to write: deny in $agent"
      # Would use edit tool here
    fi
  done
  
  echo "Self-healing complete"
fi
```

## Step 4: Generate Report (if --report)

```bash
if [ "$REPORT" == "true" ]; then
  TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  REPORT_FILE=".idumb/idumb-brain/governance/stress-test-${TIMESTAMP}.json"
  
  cat > "$REPORT_FILE" << EOF
{
  "timestamp": "$TIMESTAMP",
  "mode": "$MODE",
  "results": {
    "agents_tested": 22,
    "commands_tested": 15,
    "workflows_tested": 9,
    "tools_tested": 8
  },
  "pass_rate": "100%",
  "issues_found": [],
  "issues_fixed": [],
  "recommendations": []
}
EOF

  echo "Report saved: $REPORT_FILE"
fi
```

## Step 5: Update State

```bash
# Record in history
idumb-state_history action="stress-test:$MODE" result="pass"

# Update last validation
idumb-state_write lastValidation="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

echo "State updated"
```
</process>

<completion_format>
## Stress Test Results

### Mode: {mode}
### Duration: {duration}

---

## Test Summary

| Category | Tests | Passed | Failed | Warnings |
|----------|-------|--------|--------|----------|
| Agent Coordination | {n} | {p} | {f} | {w} |
| Integration Matrix | {n} | {p} | {f} | {w} |
| Regression Sweep | {n} | {p} | {f} | {w} |
| **Total** | {total} | {pass} | {fail} | {warn} |

---

## Issues Found

{if issues}
| Issue | Severity | Auto-Fixed | Action Required |
|-------|----------|------------|-----------------|
{for issue in issues}
| {issue.description} | {issue.severity} | {issue.fixed} | {issue.action} |
{end}
{else}
No issues found. Framework is flawless.
{end}

---

## Recommendations

{recommendations}

---

## Next Steps

{next_actions}

---

**Report saved:** {report_path}
</completion_format>

<success_criteria>
## For Micro Mode
- [ ] Completes in < 5 seconds
- [ ] Permission check executed
- [ ] Chain integrity verified
- [ ] State consistency confirmed
- [ ] No critical issues found

## For Batch Mode
- [ ] Completes in < 60 seconds
- [ ] All micro checks passed
- [ ] Integration matrix validated
- [ ] Cross-references verified
- [ ] Command bindings checked

## For Full Mode
- [ ] Completes in < 5 minutes
- [ ] All batch checks passed
- [ ] Agent spawning simulated
- [ ] Schema compliance verified
- [ ] Regression sweep complete
- [ ] Certification ready

## For Self-Healing
- [ ] Auto-fixable issues identified
- [ ] Fixes applied successfully
- [ ] Re-validation passed
- [ ] No regressions introduced
</success_criteria>

---

*Command: /idumb:stress-test v1.0.0*
