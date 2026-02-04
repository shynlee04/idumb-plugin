# Tools Restructure ROLLBACK PLAN

**Document:** 05-ROLLBACK-PLAN.md  
**Phase:** tools-restructure-planning  
**Author:** @idumb-skeptic-validator  
**Generated:** 2026-02-05  
**Assessment:** REQUIRES THIS BEFORE ANY RESTRUCTURE

---

## ⚠️ SKEPTIC SUMMARY

This rollback plan assumes **everything will go wrong**. The restructure touches:
- 12 TypeScript tool files (7,147 lines)
- 22 agent profiles that reference these tools (15,120 lines)
- 20 commands (8,938 lines)
- 11 skills with 48+ tool references
- Critical runtime state (state.json, 206 sessions, 51 checkpoints)

**The most dangerous assumption:** "We can just git revert."

No. Git only tracks `src/`. It does NOT track:
- `.idumb/` runtime state (not in git)
- `.opencode/` installed files (in .gitignore)
- OpenCode's internal tool schema cache
- Session state created DURING restructure testing

**Point of No Return:** Once you run `node bin/install.js` with new tools, the old `.opencode/tools/*` are overwritten. If the new tools fail to load, OpenCode has NO tools from iDumb.

---

## 1. Pre-Change Checkpoint [CRITICAL]

### 1.1 Git Checkpoint

**Challenge:** Git revert only works if you haven't pushed. If you push restructured code and it breaks, downstream consumers are affected.

**Required Actions:**

```bash
# 1. Commit ALL current changes first (including the 3 modified agent files)
git add -A
git commit -m "chore: checkpoint before tools-restructure"

# 2. Create a TAGGED restore point (tags survive branch deletion)
git tag -a "pre-restructure-2026-02-05" -m "Checkpoint before tools restructure. Safe to revert here."

# 3. Create a backup branch (belt AND suspenders)
git checkout -b backup/pre-restructure-2026-02-05
git checkout -  # go back to previous branch

# 4. Verify tag exists
git tag -l | grep pre-restructure
# Expected: pre-restructure-2026-02-05

# 5. Verify you can actually reach the tag
git log --oneline pre-restructure-2026-02-05 -1
```

**Verification Command:**
```bash
# This should show your tag with the commit hash
git show-ref --tags | grep pre-restructure
```

**What Git Does NOT Capture:**
- `.idumb/` directory (runtime state, not tracked)
- `.opencode/` directory (in .gitignore per inspection)
- `node_modules/` anywhere
- OpenCode cache files

### 1.2 State Checkpoint [THE REAL RISK]

**Challenge:** `.idumb/` is not git-tracked. It contains:
- `state.json` (12,359 bytes) - 8 anchors, 50+ history entries, governance settings
- `config.json` (1,470 bytes) - user settings
- `todos.json` (7,947 bytes) - task tracking
- `sessions/` (206 files, ~66KB) - session records
- `execution/` (51 checkpoint dirs) - halt recovery data
- `styles/` (7 items) - style configuration
- SESSION-HANDOFF files (3 files)

**Required Actions:**

```bash
# Create timestamped backup directory OUTSIDE the project
BACKUP_DIR="$HOME/.idumb-backups/pre-restructure-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

# 1. Full .idumb backup
cp -R .idumb "$BACKUP_DIR/idumb-brain-backup"

# 2. Full .opencode backup (installed files)
cp -R .opencode "$BACKUP_DIR/opencode-backup"

# 3. Verify backup integrity
echo "=== Verification ==="
echo "state.json:" && wc -c "$BACKUP_DIR/idumb-brain-backup/idumb-brain/state.json"
echo "config.json:" && wc -c "$BACKUP_DIR/idumb-brain-backup/idumb-brain/config.json"
echo "sessions:" && ls "$BACKUP_DIR/idumb-brain-backup/idumb-brain/sessions/" | wc -l
echo "execution:" && ls "$BACKUP_DIR/idumb-brain-backup/idumb-brain/execution/" | wc -l
echo "tools:" && ls "$BACKUP_DIR/opencode-backup/tools/" | wc -l

# 4. Create manifest file for what was backed up
find "$BACKUP_DIR" -type f > "$BACKUP_DIR/MANIFEST.txt"
echo "Backed up $(wc -l < "$BACKUP_DIR/MANIFEST.txt") files to $BACKUP_DIR"
```

**Expected Output:**
```
state.json:   12359 bytes
config.json:  1470 bytes  
sessions:     206 files
execution:    51 directories
tools:        13 files
```

**Store the backup path:**
```bash
echo "$BACKUP_DIR" > .plugin-dev/RESTRUCTURE-PLAN-2026-02-05/.BACKUP_PATH
```

### 1.3 Environment Checkpoint

**Challenge:** The restructure may change tool schemas. OpenCode caches tool definitions. If new tools have different schemas, OpenCode may hold stale schema in memory.

**Required Actions:**

```bash
# 1. Record current lockfile hash
shasum package-lock.json > .plugin-dev/RESTRUCTURE-PLAN-2026-02-05/.lockfile-hash.txt

# 2. Record current tool file hashes
find src/tools -name "*.ts" -exec shasum {} \; > .plugin-dev/RESTRUCTURE-PLAN-2026-02-05/.tool-hashes.txt

# 3. Record installed tool hashes
find .opencode/tools -name "*.ts" -exec shasum {} \; > .plugin-dev/RESTRUCTURE-PLAN-2026-02-05/.installed-tool-hashes.txt

# 4. Record node_modules state (for both locations)
ls -la node_modules/ > .plugin-dev/RESTRUCTURE-PLAN-2026-02-05/.node_modules-root.txt 2>/dev/null || echo "None"
ls -la .opencode/node_modules/ > .plugin-dev/RESTRUCTURE-PLAN-2026-02-05/.node_modules-opencode.txt 2>/dev/null || echo "None"

# 5. Record OpenCode version if available
opencode --version 2>/dev/null || echo "Unknown" > .plugin-dev/RESTRUCTURE-PLAN-2026-02-05/.opencode-version.txt
```

**Critical Note on .opencode/node_modules:**
Current state shows:
- `@opencode-ai/` - plugin SDK
- `zod/` - schema validation

These are REQUIRED for tools to work. If they get corrupted or removed, ALL tools fail.

### 1.4 Test Restore Procedure BEFORE Starting

**Challenge:** Backups are useless if you can't restore them. Test this NOW.

```bash
# Create a test restore directory
TEST_RESTORE="/tmp/idumb-restore-test-$(date +%s)"
mkdir -p "$TEST_RESTORE"

# Test restore .idumb
BACKUP_DIR=$(cat .plugin-dev/RESTRUCTURE-PLAN-2026-02-05/.BACKUP_PATH)
cp -R "$BACKUP_DIR/idumb-brain-backup" "$TEST_RESTORE/idumb"

# Verify key files exist and are valid JSON
node -e "JSON.parse(require('fs').readFileSync('$TEST_RESTORE/idumb/idumb-brain/state.json'))"
echo "state.json: VALID JSON"

node -e "JSON.parse(require('fs').readFileSync('$TEST_RESTORE/idumb/idumb-brain/config.json'))"
echo "config.json: VALID JSON"

# Compare sizes
echo "=== Size Comparison ==="
echo "Original state.json: $(wc -c < .idumb/idumb-brain/state.json)"
echo "Backup state.json:   $(wc -c < "$TEST_RESTORE/idumb/idumb-brain/state.json")"

# Cleanup test
rm -rf "$TEST_RESTORE"
echo "✓ Restore test passed"
```

**If this test fails, DO NOT proceed with restructure.**

---

## 2. Mid-Change Recovery [HIGH RISK]

### 2.1 Point of No Return Identification

**The restructure has multiple danger zones:**

| Phase | Operation | Point of No Return? | Why |
|-------|-----------|---------------------|-----|
| Phase 1 | Modify src/tools/*.ts | **NO** | Git tracked, revertible |
| Phase 2 | Modify src/agents/*.md | **NO** | Git tracked, revertible |
| Phase 3 | Run `node bin/install.js` | **YES - PARTIAL** | Overwrites .opencode/ |
| Phase 4 | Test tools in OpenCode | **YES - FULL** | State.json may be modified |
| Phase 5 | Commit and push | **YES - TEAM** | Others may pull broken code |

**The TRUE Point of No Return:**
The moment `node bin/install.js` runs, `.opencode/tools/` gets overwritten. If:
1. New tools have syntax errors → OpenCode loads no iDumb tools
2. New tools have schema errors → OpenCode shows wrong parameters
3. New tools have runtime errors → Tools fail when called

**Danger: There is no atomic "install or rollback" mechanism in the installer.**

### 2.2 Abort Procedures by Phase

#### Abort During Phase 1 (Modifying src/tools/*.ts)

**Detection:** TypeScript compilation fails
```bash
# Quick syntax check
npx tsc --noEmit src/tools/*.ts 2>&1 | head -20
```

**Abort Procedure:**
```bash
# Discard all tool changes
git checkout -- src/tools/

# Verify original state
git status src/tools/
# Should show: "nothing to commit, working tree clean"
```

#### Abort During Phase 2 (Modifying src/agents/*.md)

**Detection:** Agent frontmatter is malformed

```bash
# Check YAML frontmatter is valid
for f in src/agents/*.md; do
  head -50 "$f" | grep -E "^---$" | wc -l | grep -q "2" || echo "INVALID: $f"
done
```

**Abort Procedure:**
```bash
# Discard agent changes
git checkout -- src/agents/

# Discard command changes if any
git checkout -- src/commands/
```

#### Abort During Phase 3 (Install Failed)

**Detection:** Install script errors out mid-way

**Signs of partial install:**
- Some files in `.opencode/tools/` are new, some old
- `.opencode/agents/` has mix of timestamps
- `.idumb/` directories partially created

**Abort Procedure:**
```bash
# 1. Stop immediately - do not retry install

# 2. Restore .opencode from backup
BACKUP_DIR=$(cat .plugin-dev/RESTRUCTURE-PLAN-2026-02-05/.BACKUP_PATH)
rm -rf .opencode
cp -R "$BACKUP_DIR/opencode-backup" .opencode

# 3. Verify restoration
ls -la .opencode/tools/
# Should match original 13 files

# 4. Revert source changes
git checkout -- src/

# 5. Verify git state
git status
# Should show only untracked backup files
```

#### Abort During Phase 4 (Testing Failed)

**Detection:** Tools don't work when called in OpenCode

**Common failure modes:**
- "Tool not found" → Schema export issue
- "Invalid parameters" → Zod schema mismatch
- "Runtime error" → Import/dependency issue
- "No response" → Tool hangs

**Abort Procedure:**
```bash
# 1. Quit OpenCode to release any file locks

# 2. Full restoration
BACKUP_DIR=$(cat .plugin-dev/RESTRUCTURE-PLAN-2026-02-05/.BACKUP_PATH)

# Restore .opencode
rm -rf .opencode
cp -R "$BACKUP_DIR/opencode-backup" .opencode

# Restore .idumb (in case state was modified during testing)
rm -rf .idumb
cp -R "$BACKUP_DIR/idumb-brain-backup" .idumb

# 3. Revert source
git reset --hard pre-restructure-2026-02-05

# 4. Clear any OpenCode cache (if applicable)
rm -rf ~/.cache/opencode 2>/dev/null || true
rm -rf ~/Library/Caches/opencode 2>/dev/null || true

# 5. Restart OpenCode
```

### 2.3 Partial Rollback Scenarios

#### Scenario: "Changed 3 of 12 tools, then TypeScript failed"

**Problem:** Some tools modified, others not

**Solution:**
```bash
# Just reset all tools to last commit
git checkout -- src/tools/

# Verify
git diff src/tools/
# Should show nothing
```

#### Scenario: "Install ran halfway, then crashed"

**Problem:** .opencode has mixed state - some new tools, some old

**Critical Question:** Which tools are old vs new?

**Solution:**
```bash
# Compare installed tools against backup
BACKUP_DIR=$(cat .plugin-dev/RESTRUCTURE-PLAN-2026-02-05/.BACKUP_PATH)

for tool in .opencode/tools/idumb-*.ts; do
  name=$(basename "$tool")
  if diff -q "$tool" "$BACKUP_DIR/opencode-backup/tools/$name" > /dev/null 2>&1; then
    echo "MATCH: $name"
  else
    echo "DIFF: $name (was modified)"
  fi
done
```

**If ANY tools show DIFF, do full restore:**
```bash
rm -rf .opencode
cp -R "$BACKUP_DIR/opencode-backup" .opencode
```

#### Scenario: "Tools work, but agents don't reference them correctly"

**Problem:** Tool renamed/consolidated, but agents still reference old name

**Detection:**
```bash
# Find references to tools that no longer exist
for tool in idumb-quality idumb-orchestrator; do  # Example: if these were merged
  grep -l "$tool" src/agents/*.md src/commands/idumb/*.md
done
```

**Solution:**
```bash
# Fix agent references, or full revert
git checkout -- src/agents/ src/commands/
```

### 2.4 Known Dangerous Points

#### Danger Point 1: .opencode/ Modification

**When it happens:** `node bin/install.js`

**What gets modified:**
- `.opencode/tools/*.ts` - ALL 12 tool files
- `.opencode/agents/*.md` - ALL 22 agent files  
- `.opencode/commands/idumb/*.md` - ALL 20 commands
- `.opencode/plugins/idumb-core.ts` - The plugin itself

**Why it's dangerous:** No transaction rollback. Files are copied one by one.

#### Danger Point 2: .idumb/ Modification

**When it happens:** 
- Any tool invocation during testing
- Session creation
- State anchoring

**What gets modified:**
- `state.json` - history entries added
- `sessions/` - new session files created
- `execution/` - checkpoint files created

**Why it's dangerous:** Not git-tracked. Any test that invokes `idumb-state_history` or `idumb-state_anchor` WILL modify state.json.

#### Danger Point 3: OpenCode Tool Schema Cache

**When it happens:** OpenCode loads tool files

**What gets cached:** Tool parameter schemas are parsed from TypeScript

**Why it's dangerous:** If you modify a tool's parameters, OpenCode may use stale cached schema until restart.

**Mitigation:** Always restart OpenCode after install.

---

## 3. Post-Change Verification [SILENT FAILURE DETECTION]

### 3.1 TypeScript Verification

**Challenge:** Code compiles doesn't mean it works.

```bash
# 1. Compile all tools (from project root)
npx tsc --noEmit src/tools/*.ts 2>&1
# Expected: No errors

# 2. Check installed tools compile too
npx tsc --noEmit .opencode/tools/*.ts 2>&1
# Expected: No errors (may need skipLibCheck for @opencode-ai imports)

# 3. Verify each tool exports a default
for tool in src/tools/idumb-*.ts; do
  name=$(basename "$tool" .ts)
  grep -q "export default tool" "$tool" && echo "✓ $name" || echo "✗ $name MISSING DEFAULT EXPORT"
done
```

### 3.2 Runtime Verification

**Challenge:** Tool may compile but fail at runtime due to missing imports.

**Manual Test Procedure:**

1. **Start OpenCode** (fresh session)

2. **Test idumb-state (CRITICAL - 186 references)**
```
# In OpenCode, invoke:
/idumb:status

# Expected: Shows current governance state
# Failure: "Tool not found" or "Error reading state.json"
```

3. **Test idumb-config (CORE - 27 references)**
```
# In OpenCode:
Use idumb-config_read

# Expected: Returns config contents
# Failure: "Config file not found" or parse error
```

4. **Test idumb-validate (CRITICAL - 66 references)**
```
# In OpenCode:
Use idumb-validate_structure

# Expected: Validation report
# Failure: Tool errors, missing function
```

5. **Test state.json writes**
```
# BEFORE running this, note current anchor count
cat .idumb/idumb-brain/state.json | grep -c "anchor-"

# Invoke anchor creation
Use idumb-state_anchor type="test" content="Restructure verification test" priority="low"

# AFTER: Verify anchor was added
cat .idumb/idumb-brain/state.json | grep -c "anchor-"
# Should be +1

# Clean up test anchor (manual edit or leave it)
```

### 3.3 Integration Tests

**Run these commands in sequence:**

| # | Command | Expected Result | Failure Mode |
|---|---------|-----------------|--------------|
| 1 | `/idumb:status` | Shows state, phase, anchors | Tool not found |
| 2 | `/idumb:validate` | Runs validation checks | Missing idumb-validate |
| 3 | `/idumb:health-check` | System health report | Missing dependencies |
| 4 | `/idumb:help` | Lists all commands | Command parse error |

**Automated Check Script:**

```bash
#!/bin/bash
# save as: verify-restructure.sh

echo "=== iDumb Restructure Verification ==="

# 1. Check all expected tools exist
EXPECTED_TOOLS="idumb-state idumb-config idumb-validate idumb-todo idumb-context idumb-chunker idumb-manifest"
for tool in $EXPECTED_TOOLS; do
  if [ -f ".opencode/tools/${tool}.ts" ]; then
    echo "✓ ${tool}.ts exists"
  else
    echo "✗ ${tool}.ts MISSING"
  fi
done

# 2. Check tools have default exports
for tool in .opencode/tools/idumb-*.ts; do
  if grep -q "export default tool" "$tool"; then
    echo "✓ $(basename $tool) has default export"
  else
    echo "✗ $(basename $tool) MISSING DEFAULT EXPORT"
  fi
done

# 3. Check state.json is valid
if node -e "JSON.parse(require('fs').readFileSync('.idumb/idumb-brain/state.json'))" 2>/dev/null; then
  echo "✓ state.json is valid JSON"
else
  echo "✗ state.json is INVALID"
fi

# 4. Check no orphaned references
ORPHANED=$(grep -r "idumb-quality\|idumb-orchestrator" src/agents/*.md src/commands/idumb/*.md 2>/dev/null | wc -l)
if [ "$ORPHANED" -gt 0 ]; then
  echo "⚠ Found $ORPHANED references to potentially removed tools"
else
  echo "✓ No orphaned tool references"
fi

echo "=== Verification Complete ==="
```

### 3.4 Silent Failure Detection

**Challenge:** Some failures don't throw errors but cause wrong behavior.

#### Silent Failure 1: Stale Schema Cache

**Symptom:** Tool shows wrong parameter names in OpenCode UI
**Detection:** Compare tool help output with actual code
```bash
# Manual: In OpenCode, ask about a tool's parameters
# Compare with actual Zod schema in the tool file
```

#### Silent Failure 2: Broken Skill Invocations

**48 skill references to tools** - if a tool is renamed, skills break silently.

**Detection:**
```bash
# Find all tool references in skills
grep -r "idumb-" src/skills/*/SKILL.md | grep -v "^#" | sort | uniq

# Compare against actual tool names
ls src/tools/idumb-*.ts | xargs -I {} basename {} .ts

# Any in first list but not second = BROKEN
```

#### Silent Failure 3: History/Anchor Loss

**Symptom:** state.json has fewer anchors/history after restructure
**Detection:**
```bash
BACKUP_DIR=$(cat .plugin-dev/RESTRUCTURE-PLAN-2026-02-05/.BACKUP_PATH 2>/dev/null)
if [ -n "$BACKUP_DIR" ]; then
  BACKUP_ANCHORS=$(grep -c '"anchor-' "$BACKUP_DIR/idumb-brain-backup/idumb-brain/state.json")
  CURRENT_ANCHORS=$(grep -c '"anchor-' .idumb/idumb-brain/state.json)
  
  if [ "$CURRENT_ANCHORS" -lt "$BACKUP_ANCHORS" ]; then
    echo "⚠ ANCHOR LOSS: Was $BACKUP_ANCHORS, now $CURRENT_ANCHORS"
  else
    echo "✓ Anchors preserved ($CURRENT_ANCHORS)"
  fi
fi
```

#### Silent Failure 4: Missing Tool Sub-Commands

If a tool consolidation removes a sub-command, references fail silently.

**Detection:**
```bash
# List all tool invocations in agents/commands
grep -roh "idumb-[a-z_]*" src/agents/*.md src/commands/idumb/*.md | sort | uniq > /tmp/tool-refs.txt

# List all actual exported functions
for tool in src/tools/idumb-*.ts; do
  grep "export const" "$tool" | awk '{print $3}'
done > /tmp/tool-exports.txt

# Compare
comm -23 /tmp/tool-refs.txt /tmp/tool-exports.txt
# Any output = references to non-existent tools
```

### 3.5 User Acceptance Criteria

**The restructure is SUCCESSFUL only if ALL of these pass:**

- [ ] All TypeScript files compile without errors
- [ ] OpenCode loads without tool errors on startup
- [ ] `/idumb:status` returns valid state
- [ ] `/idumb:validate` completes without errors
- [ ] `/idumb:health-check` shows all green
- [ ] state.json anchor count >= pre-restructure count
- [ ] All 8 existing anchors are present
- [ ] No "tool not found" errors when using commands
- [ ] No skill references to removed tools
- [ ] Sessions directory has >= 206 files

---

## 4. Full Rollback Procedure [NUCLEAR OPTION]

### 4.1 When to Trigger Full Rollback

**Trigger if ANY of these occur:**

| Condition | Why It's Critical |
|-----------|-------------------|
| `/idumb:status` fails | Core state management broken |
| `state.json` won't parse | All governance state lost |
| OpenCode won't start | Tool syntax errors |
| < 6 of 8 anchors remain | Critical context lost |
| More than 3 tools fail | Systematic problem |
| `node bin/install.js` throws | Partial installation |

### 4.2 Step-by-Step Reversal

**IMPORTANT: Order matters. Do NOT skip steps.**

```bash
# STEP 1: Stop OpenCode immediately
# (Close the application / kill the process)
pkill -f opencode || true

# STEP 2: Get backup path
BACKUP_DIR=$(cat .plugin-dev/RESTRUCTURE-PLAN-2026-02-05/.BACKUP_PATH)
if [ -z "$BACKUP_DIR" ]; then
  echo "ERROR: No backup path found. Manual recovery needed."
  exit 1
fi

# STEP 3: Verify backup exists and is complete
if [ ! -f "$BACKUP_DIR/idumb-brain-backup/idumb-brain/state.json" ]; then
  echo "ERROR: Backup incomplete - state.json missing"
  exit 1
fi

# STEP 4: Restore .idumb FIRST (most critical)
echo "Restoring .idumb..."
rm -rf .idumb
cp -R "$BACKUP_DIR/idumb-brain-backup" .idumb

# Verify immediately
node -e "JSON.parse(require('fs').readFileSync('.idumb/idumb-brain/state.json'))" && echo "✓ state.json valid" || echo "✗ RESTORE FAILED"

# STEP 5: Restore .opencode SECOND (tools)
echo "Restoring .opencode..."
rm -rf .opencode
cp -R "$BACKUP_DIR/opencode-backup" .opencode

# Verify tool count
TOOL_COUNT=$(ls .opencode/tools/idumb-*.ts 2>/dev/null | wc -l)
echo "Restored $TOOL_COUNT tool files"

# STEP 6: Git reset to tagged checkpoint
echo "Resetting git to pre-restructure tag..."
git reset --hard pre-restructure-2026-02-05

# Verify git state
git status

# STEP 7: Clear any OpenCode caches
rm -rf ~/.cache/opencode 2>/dev/null || true
rm -rf ~/Library/Caches/opencode 2>/dev/null || true

# STEP 8: Final verification
echo ""
echo "=== POST-ROLLBACK VERIFICATION ==="
echo "state.json size: $(wc -c < .idumb/idumb-brain/state.json)"
echo "Anchors: $(grep -c '"anchor-' .idumb/idumb-brain/state.json)"
echo "Tools: $(ls .opencode/tools/idumb-*.ts | wc -l)"
echo "Git status: $(git describe --tags --abbrev=0 2>/dev/null || echo 'No tag')"

echo ""
echo "Rollback complete. Restart OpenCode to verify."
```

### 4.3 Unrecoverable Data

**What CAN'T be recovered:**

| Data | Why Lost |
|------|----------|
| Anchors created AFTER backup | Were added during testing |
| Sessions created DURING restructure | New session files |
| History entries from restructure testing | Added to state.json |
| Any user's work DURING the restructure window | If they pulled broken code |

**Minimizing loss:**

Before restructuring:
1. Create anchor with current context summary
2. Export sessions using `idumb-state_exportSession`
3. Warn team not to pull during restructure window

### 4.4 Post-Rollback Verification

```bash
#!/bin/bash
# save as: verify-rollback.sh

echo "=== Post-Rollback Verification ==="

# 1. State file health
if node -e "JSON.parse(require('fs').readFileSync('.idumb/idumb-brain/state.json'))" 2>/dev/null; then
  echo "✓ state.json valid"
else
  echo "✗ state.json CORRUPT - manual recovery needed"
  exit 1
fi

# 2. Anchor count matches backup
BACKUP_DIR=$(cat .plugin-dev/RESTRUCTURE-PLAN-2026-02-05/.BACKUP_PATH 2>/dev/null)
if [ -n "$BACKUP_DIR" ] && [ -f "$BACKUP_DIR/idumb-brain-backup/idumb-brain/state.json" ]; then
  BACKUP_ANCHORS=$(grep -c '"anchor-' "$BACKUP_DIR/idumb-brain-backup/idumb-brain/state.json")
  CURRENT_ANCHORS=$(grep -c '"anchor-' .idumb/idumb-brain/state.json)
  if [ "$CURRENT_ANCHORS" -eq "$BACKUP_ANCHORS" ]; then
    echo "✓ Anchor count matches: $CURRENT_ANCHORS"
  else
    echo "⚠ Anchor count differs: backup=$BACKUP_ANCHORS current=$CURRENT_ANCHORS"
  fi
fi

# 3. Tool file hashes match backup
echo "Checking tool integrity..."
for tool in .opencode/tools/idumb-*.ts; do
  name=$(basename "$tool")
  if [ -f "$BACKUP_DIR/opencode-backup/tools/$name" ]; then
    if diff -q "$tool" "$BACKUP_DIR/opencode-backup/tools/$name" > /dev/null; then
      echo "✓ $name matches backup"
    else
      echo "✗ $name DIFFERS from backup"
    fi
  fi
done

# 4. Git state
CURRENT_TAG=$(git describe --tags --exact-match 2>/dev/null || echo "NO TAG")
echo "Current git state: $CURRENT_TAG"
if [ "$CURRENT_TAG" = "pre-restructure-2026-02-05" ]; then
  echo "✓ At correct git tag"
else
  echo "⚠ Not at expected tag"
fi

# 5. Installed vs source match
echo "Checking src/tools matches .opencode/tools..."
for tool in src/tools/idumb-*.ts; do
  name=$(basename "$tool")
  if [ -f ".opencode/tools/$name" ]; then
    if diff -q "$tool" ".opencode/tools/$name" > /dev/null; then
      echo "✓ $name in sync"
    else
      echo "✗ $name OUT OF SYNC - re-run installer"
    fi
  fi
done

echo ""
echo "=== Verification Complete ==="
echo "If any checks failed, investigate before using iDumb."
```

---

## 5. Skeptic Challenges Summary

### Assumptions Challenged

| Assumption | Challenge | Mitigation |
|------------|-----------|------------|
| "Git revert is enough" | .idumb/ and .opencode/ aren't tracked | Full filesystem backup before start |
| "TypeScript compiles = works" | Runtime imports may fail, schemas may be wrong | Manual invocation tests of each tool |
| "Orphaned tools are safe to remove" | 48 skill references to "orphaned" tools | Search all skills before removing |
| "Install is atomic" | Files copied one-by-one, no rollback | Full backup + tested restore procedure |
| "OpenCode uses new tools immediately" | Schema cache may be stale | Restart OpenCode after install |
| "State won't change during testing" | ANY tool invocation modifies history | Accept some state loss or test carefully |
| "Backwards compatible" | Old state.json may not work with new tools | Document schema changes explicitly |
| "Sessions are expendable" | 206 sessions may contain important context | Back up sessions directory |
| "Checkpoints are regenerable" | 51 halt checkpoints for recovery | Back up execution directory |

### Risk Matrix

| Failure Mode | Probability | Impact | Detection Method |
|--------------|-------------|--------|------------------|
| TypeScript compile error | LOW | MEDIUM | Caught by tsc before install |
| Tool missing default export | MEDIUM | HIGH | Grep for export pattern |
| Stale OpenCode cache | HIGH | MEDIUM | Restart OpenCode |
| state.json corruption | LOW | CATASTROPHIC | JSON.parse() validation |
| Partial install failure | MEDIUM | HIGH | Compare file timestamps |
| Skill reference to removed tool | HIGH | MEDIUM | Grep skills for tool names |
| Anchor loss | LOW | HIGH | Compare anchor counts |
| Session directory corruption | LOW | MEDIUM | ls -la file count |
| node_modules corruption | LOW | CATASTROPHIC | Check @opencode-ai exists |
| History entry loss | HIGH | LOW | Accept as cost of restructure |

### Final Skeptic Verdict

**This restructure can succeed IF and ONLY IF:**

1. Full backup is created AND tested for restorability
2. Each phase has explicit abort procedures
3. Testing is done in isolation (don't push until verified)
4. All 48 skill references are verified before removing any tool
5. OpenCode is restarted after install
6. State.json is validated after each testing step

**Highest Risk:** The skill-tool references. The manifest shows 48 references to `idumb-performance` and `idumb-security` in skills alone. These tools are marked "orphaned" by the assessment because no agents call them directly - but skills DO reference them. Removing them breaks skill execution.

**Recommendation:** Before ANY tool removal:
```bash
grep -r "TOOL_NAME" src/skills/ | wc -l
```
If > 0, the tool is NOT orphaned - it's skill-invoked.

---

*Document generated by @idumb-skeptic-validator*  
*Challenge everything. Trust nothing. Verify twice.*
