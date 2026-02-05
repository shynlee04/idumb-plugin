# Git Integration Patterns for AI Governance

**Research Date:** 2026-02-04
**Researcher:** @idumb-phase-researcher
**Framework:** iDumb v0.2.0
**Purpose:** Deep research on Git integration patterns for traceable commits, context intelligence, and atomic operations

---

## Executive Summary

Git integration is critical for iDumb's governance framework, enabling:
- **Traceability**: Every action linked to commits with governance metadata
- **Context Intelligence**: Git history as AI memory for debugging and decision-making
- **Atomicity**: Hash-verified operations with precise rollback capabilities
- **Governance Enforcement**: Hooks and validation for compliance

This research synthesizes Conventional Commits specification, AI framework patterns (GSD, BMAD), and industry best practices into actionable recommendations for iDumb.

---

## Table of Contents

1. [Conventional Commits Standard](#1-conventional-commits-standard)
2. [Governance Metadata in Commits](#2-governance-metadata-in-commits)
3. [Branch Isolation Strategies](#3-branch-isolation-strategies)
4. [Git as Context Intelligence](#4-git-as-context-intelligence)
5. [Atomic Operations & Hash Verification](#5-atomic-operations--hash-verification)
6. [Git Hooks Integration](#6-git-hooks-integration)
7. [AI Framework Patterns](#7-ai-framework-patterns)
8. [Implementation Recommendations](#8-implementation-recommendations)
9. [Sources](#9-sources)

---

## 1. Conventional Commits Standard

### 1.1 Specification Overview

Conventional Commits is a lightweight convention for commit messages that adds human- and machine-readable meaning to commits. It's designed to enable automated changelog generation and semantic versioning.

**Formal Structure:**
```
<type>(<optional scope>): <description>

[optional body]

[optional footer(s)]
```

### 1.2 Required Commit Types

| Type | Description | SemVer Impact |
|-------|-------------|---------------|
| `feat` | Introduces a new feature | Minor version bump |
| `fix` | Patches a bug | Patch version bump |
| `feat!` / `fix!` | Breaking change (indicated by `!` after type) | Major version bump |

### 1.3 Optional Commit Types

| Type | Description | Use Case |
|-------|-------------|----------|
| `docs` | Documentation-only changes | README updates, inline comments |
| `style` | Code style changes (formatting, whitespace) | No logic changes |
| `refactor` | Code change that neither fixes bug nor adds feature | Cleanups, simplifications |
| `perf` | Performance improvements | Optimization commits |
| `test` | Adding missing tests or correcting existing tests | Test-only changes |
| `chore` | Maintenance tasks (build, deps, config) | Package updates, CI changes |
| `build` | Build system or external dependencies | Webpack config, dependency updates |
| `ci` | CI configuration changes | GitHub Actions, GitLab CI |
| `revert` | Reverts a previous commit | Undo operations |

### 1.4 Scope Conventions

The **scope** is an optional noun describing a section of the codebase, enclosed in parentheses.

**Standard Scopes:**
```
feat(auth): add JWT authentication
fix(parser): handle unexpected EOF error
docs(readme): update installation instructions
refactor(api): consolidate endpoints
```

**For iDumb Governance:**
```
feat(phase-02): implement JWT authentication
fix(task-003): resolve null pointer in payment processor
docs(research): complete phase-2-research.md
refactor(tool): optimize state reading mechanism
```

### 1.5 Breaking Change Indicators

**Two Methods:**

1. **Exclamation Mark** (preferred for header clarity):
```
feat!(auth): migrate to OAuth2

BREAKING CHANGE: JWT tokens now use RS256 instead of HS256
```

2. **Footer Only** (legacy):
```
feat(auth): migrate to OAuth2

BREAKING CHANGE: JWT tokens now use RS256 instead of HS256
```

**Note:** Using `!` after type allows omitting `BREAKING CHANGE:` footer. The commit description must still explain the break.

### 1.6 Body and Footer Patterns

**Body (Optional):**
- Free-form text
- Multiple paragraphs
- One blank line after description
- Use imperative mood ("add" not "added")

**Footer (Optional):**
- One blank line after body
- Token-value pairs: `Token: <value>` or `Token #<value>`
- Common tokens:
  - `BREAKING CHANGE:` or `BREAKING-CHANGE:`
  - `Closes #123` or `Fixes #123`
  - `Co-authored-by: @username`
  - `Acked-by: @username`

### 1.7 Line Length Limits

- **Subject line**: Max 72 characters (including type/scope)
- **Body lines**: Max 80 characters (for readability)
- **Footer wrapping**: Max 80 characters

**Rationale:** Git adds 4 characters of padding in log displays, so 72 - 8 = 64 visible characters.

---

## 2. Governance Metadata in Commits

### 2.1 iDumb Entity Encoding Pattern

**Standard Pattern:**
```
<type>(<iDumb-entity>): <description>
```

**iDumb Entities:**

| Entity | Format | Example |
|--------|--------|---------|
| Phase | `phase-<NN>` | `feat(phase-02): implement auth` |
| Plan | `<phase>-<plan>` | `fix(02-03): resolve JWT bug` |
| Task | `task-<XXX>` | `feat(task-003): add refresh token` |
| Milestone | `ms-<name>` | `docs(ms-v1): complete v1 milestone` |
| Agent | `<agent-name>` | `fix(executor): resolve task delegation` |
| Research | `research-<topic>` | `docs(research-auth): complete JWT patterns research` |

### 2.2 Governance Commit Examples

**Phase Initialization:**
```
docs: initialize [project-name] ([N] phases)

- [One-liner from PROJECT.md]

Phases:
1. [phase-name]: [goal]
2. [phase-name]: [goal]
3. [phase-name]: [goal]
```

**Plan Execution (GSD Pattern):**
```
{type}({phase}-{plan}): {task-name}

- [Key change 1]
- [Key change 2]
- [Key change 3]
```

**Phase Completion:**
```
docs({phase}): complete [phase-name] phase

Plans completed: [N]/[N]
- [Plan 1 name]
- [Plan 2 name]
- [Plan 3 name]

State: .idumb/brain/state.json updated
```

**Checkpoint Creation:**
```
chore(checkpoint): [checkpoint-name]

- Session: ses_<session-id>
- Phase: <phase-name>
- Status: <status>
- Timestamp: <ISO8601>
```

**Verification Result:**
```
docs(verify): [phase]-[plan] verification PASSED

- Acceptance criteria: [N]/[N] met
- Evidence: VERIFICATION.md generated
- State: .idumb/brain/state.json updated
```

### 2.3 Traceable ID Systems

**Hierarchical IDs:**
```
Session → Phase → Plan → Task
ses_abc123 → phase-02 → 02-03 → task-003
```

**Encoding in Commits:**
```
# Full hierarchy (verbose, precise)
feat(ses_abc123/phase-02/02-03/task-003): implement JWT refresh

# Phase + Plan (balanced)
feat(02-03/task-003): implement JWT refresh

# Plan + Task only (concise)
feat(task-003): implement JWT refresh
```

**Recommendation:** Use `<phase>-<plan>` as default scope, encode task in body/footer if needed.

### 2.4 Linking Commits to Artifacts

**Reference Patterns:**

| Artifact | Reference Format | Example |
|---------|----------------|---------|
| Phase | `.planning/phases/<N>-name/PHASE.md` | See PHASE.md in phases/02-auth/ |
| Plan | `.planning/phases/<N>-name/<N>-<name>-PLAN.md` | Related to 02-03-PKAN.md |
| Summary | `.planning/phases/<N>-name/<N>-<name>-SUMMARY.md` | Documented in SUMMARY.md |
| Research | `.planning/research/<topic>-YYYY-MM-DD.md` | Research: JWT-PATTERNS-2026-02-04.md |
| State | `.idumb/brain/state.json` | State updated: phase="02" |
| TODO | `.idumb/brain/todo.json` | Closed: task-003 ✓ |

**Footer References:**
```
feat(02-03): implement JWT refresh

Related: .planning/phases/02-auth/02-jwt-PLAN.md
Closes: task-003
State: phase="02"
```

### 2.5 Commit Message Template for iDumb

**Template:**
```
{type}({iDumb-entity}): {imperative description}

- [Change 1: what was done]
- [Change 2: what was done]
- [Change 3: what was done]

[Optional body paragraph]

[Optional footers]
Related: .planning/phases/{N}-name/{N}-{name}-PLAN.md
Closes: task-XXX
State: <key>=<value>
```

**Example:**
```
fix(02-03): resolve null pointer in JWT refresh

- Validate token before accessing payload
- Add error handling for expired tokens
- Update tests to cover edge cases

Related: .planning/phases/02-auth/02-jwt-PLAN.md
Closes: task-003
State: lastValidation="2026-02-04T12:00:00Z"
```

---

## 3. Branch Isolation Strategies

### 3.1 Branch Naming Conventions

**Standard Pattern:**
```
<type>/<entity>/<description>
```

**For iDumb Workflows:**

| Type | Use Case | Example |
|------|----------|---------|
| `phase` | Phase development | `phase/02-auth` |
| `plan` | Plan execution | `plan/02-jwt-implementation` |
| `task` | Single task (rare) | `task/003-refresh-token` |
| `fix` | Bug fix | `fix/02-jwt-null-pointer` |
| `hotfix` | Production emergency | `hotfix/01-governance-halt` |
| `research` | Research branch | `research/git-integration-patterns` |
| `experiment` | Proof of concept | `experiment/ai-commit-generator` |
| `docs` | Documentation | `docs/update-governance-guide` |

### 3.2 AI-Assisted Branch Naming

**For AI-generated work:**
```
ai/<agent-name>/<description>
```

**Examples:**
```
ai/claude/phase-02-research
ai/copilot/task-003-implementation
ai/github/02-jwt-implementation
ai/general/docs-governance-guide
```

**With Dates (for tracking AI sessions):**
```
ai/<agent-name>/YYYYMMDD/<description>
ai/claude/20260204/phase-02-research
```

### 3.3 Branch-to-Phase Mapping

**One Branch Per Phase (Recommended):**
```
main (stable, production-ready)
├── phase/01-foundation
├── phase/02-auth
├── phase/03-products
└── phase/04-checkout
```

**One Branch Per Plan (Alternative):**
```
main
├── phase/02-auth
│   ├── plan/02-jwt-setup
│   ├── plan/02-token-refresh
│   └── plan/02-logout-flow
```

**Recommendation:** One branch per phase keeps history clean and simplifies merging.

### 3.4 Branch Creation Workflow

**Standard iDumb Workflow:**
```bash
# Start new phase
git checkout -b phase/02-auth
git push -u origin phase/02-auth

# Work on phase (per-task commits)
git add src/
git commit -m "feat(02-03): implement JWT refresh"
git push

# Phase complete → merge to main
git checkout main
git merge phase/02-auth --no-ff
git push

# Cleanup
git branch -d phase/02-auth
git push origin --delete phase/02-auth
```

**Git Flow Alternative:**
```bash
# Feature branches for plans
git checkout -b feature/02-jwt-implementation

# Merge to develop
git checkout develop
git merge feature/02-jwt-implementation

# Release branch
git checkout -b release/v0.2.0

# Merge to main
git checkout main
git merge release/v0.2.0
```

### 3.5 Branch Merging Strategies

| Strategy | Best For | Pros | Cons |
|----------|---------|------|------|
| **Fast-forward merge** | Linear history | Clean history | Can't see feature isolation |
| **No-ff merge** | Phase branches | Feature isolation in history | More merge commits |
| **Squash merge** | Multiple small commits | Clean, single commit | Loses atomic granularity |
| **Rebase then merge** | Keeping history clean | Linear, clear history | Rewrites history (dangerous in shared repos) |

**iDumb Recommendation:** Use `--no-ff` for phase branches to preserve isolation context.

---

## 4. Git as Context Intelligence

### 4.1 Using git diff for Change Detection

**Change Detection Patterns:**

```bash
# What changed in last commit
git diff HEAD~1 HEAD

# What changed in plan execution
git diff 02-03-start 02-03-end

# File-specific changes
git diff HEAD~3 HEAD -- src/auth/jwt.ts

# Stat summary (files changed, insertions, deletions)
git diff --stat HEAD~5 HEAD
```

**For AI Context Injection:**
```bash
# Get recent changes for context
git log --oneline --name-status -10

# Detailed diff for specific file
git diff HEAD~1 HEAD -- src/auth/jwt.ts
```

### 4.2 Using git log for History Analysis

**History Analysis Patterns:**

```bash
# All commits for a phase
git log --oneline --grep="02-"

# All commits for a plan
git log --oneline --grep="02-03"

# All commits by type
git log --oneline --grep="^feat"
git log --oneline --grep="^fix"

# All commits with breaking changes
git log --oneline --grep="BREAKING CHANGE"

# Commits affecting specific files
git log --oneline -- src/auth/
```

**Structured Log for AI Parsing:**
```bash
# Full commit history with metadata
git log --pretty=format:"%h|%an|%ae|%ad|%s" --date=short

# Commit with body and footers
git log -p --grep="02-03"
```

### 4.3 Using git blame for Code Origin

**Line-by-Line Attribution:**

```bash
# Who wrote this line?
git blame src/auth/jwt.ts

# When was this function added?
git log -S :functionName:src/auth/jwt.ts

# Trace code evolution
git blame -w -M -C -C src/auth/jwt.ts
```

**For AI Debugging:**
```bash
# Context for specific line
git blame -L 100,110 src/auth/jwt.ts

# Show commit details
git show <commit-hash>
```

### 4.4 Using git show for Commit Details

**Commit Inspection:**

```bash
# Show full commit
git show <commit-hash>

# Show only diff
git show <commit-hash> --stat

# Show commit message only
git show <commit-hash> --format="%s%n%b"

# Show with file blame
git show <commit-hash> --blame
```

**For Governance Verification:**
```bash
# Verify state commit
git show <hash> -- .idumb/brain/state.json

# Check for proper metadata
git show <hash> | grep "Related:"
git show <hash> | grep "Closes:"
git show <hash> | grep "State:"
```

### 4.5 Context Lineage for AI Memory

**Pattern: Use git history as AI's long-term memory**

```bash
# Get full context for phase
git log --all --oneline --name-status --grep="02-"

# Get all commits since last checkpoint
git log --oneline --since="2026-02-04 10:00"

# Get diff summary for plan
git diff <plan-start> <plan-end> --stat
```

**AI Query Patterns:**
```
User: "What changed in the JWT implementation?"

AI executes:
git log --oneline --grep="02-03"
git diff <start-hash> <end-hash> -- src/auth/
```

### 4.6 Git Bisect for Debugging

**Binary Search Through History:**

```bash
# Start bisect
git bisect start

# Mark bad commit (current)
git bisect bad HEAD

# Mark good commit (known working)
git bisect good <known-good-hash>

# Test each commit automatically
git bisect run npm test

# Bisect identifies the culprit
git bisect reset
```

**For iDumb Task Debugging:**
```bash
# Find which task broke the build
git bisect start
git bisect bad HEAD
git bisect good <last-known-good>
git bisect run ./test-phase.sh
```

---

## 5. Atomic Operations & Hash Verification

### 5.1 Atomic Commit Principles

**Definition:** An atomic commit is the smallest possible change that:
1. Can be summarized in one sentence
2. Can be independently applied or reverted
3. Leaves the codebase in a working state (tests passing)

**Example:**
```bash
# NOT atomic (too much in one commit)
git commit -m "feat: implement auth system"
# Changes: JWT, OAuth, session, tokens, middleware, tests

# Atomic (one logical unit)
git commit -m "feat(02-03): implement JWT generation"
# Changes: jwt.ts only, tests included
```

### 5.2 Hash Verification Patterns

**Git Hash Properties:**
- SHA-1 (40 hex chars) uniquely identifies content
- Hashes are cryptographically secure
- Any content change produces different hash
- Parent commit hashes chain commits together

**Verification Commands:**

```bash
# Verify current HEAD hash
git rev-parse HEAD
# Output: a7f2d1b8c9e4f3734c219d5a742b1c259926b

# Verify specific commit exists
git rev-parse --verify <hash>
# Returns hash if valid, error otherwise

# Verify object integrity
git verify-pack .git/objects/pack/*.pack

# Check reflog for hash
git reflog show <hash>
```

### 5.3 Hash-Based State Verification

**iDumb Pattern:** Store expected hash in state.json, verify on commit

```json
// .idumb/brain/state.json
{
  "version": "0.2.0",
  "phase": "02",
  "lastCommitHash": "a7f2d1b8c9e4f3734c219d5a742b1c259926b",
  "expectedHash": "a7f2d1b8c9e4f3734c219d5a742b1c259926b"
}
```

**Verification Hook:**
```bash
#!/bin/bash
# .git/hooks/pre-commit

# Get expected hash from state
EXPECTED=$(jq -r '.expectedHash' .idumb/brain/state.json)
# Get current HEAD hash
ACTUAL=$(git rev-parse HEAD)

if [ "$EXPECTED" != "$ACTUAL" ]; then
  echo "ERROR: Git state mismatch!"
  echo "Expected: $EXPECTED"
  echo "Actual: $ACTUAL"
  exit 1
fi
```

### 5.4 Rollback Strategies

**Soft Rollback (preserve changes):**
```bash
# Undo last commit, keep changes staged
git reset --soft HEAD~1

# Undo last commit, keep changes unstaged
git reset --mixed HEAD~1
```

**Hard Rollback (discard changes):**
```bash
# Reset to specific commit, discard all changes
git reset --hard <commit-hash>

# Reset branch to match remote
git reset --hard origin/main
```

**Safe Revert (new commit):**
```bash
# Revert specific commit
git revert <commit-hash>

# Revert range of commits
git revert <start-hash>^..<end-hash>
```

### 5.5 Checkpoint/Restore Pattern

**Checkpoint:**
```bash
# Create checkpoint tag
git tag checkpoint-20260204-phase02
git push origin checkpoint-20260204-phase02

# Store in state
echo '{"lastCheckpoint":"checkpoint-20260204-phase02"}' >> .idumb/brain/state.json
```

**Restore:**
```bash
# Restore to checkpoint
git checkout checkpoint-20260204-phase02

# Or create branch from checkpoint
git checkout -b restore-20260204 checkpoint-20260204-phase02
```

---

## 6. Git Hooks Integration

### 6.1 Hook Types and Use Cases

| Hook | Trigger | iDumb Use Case |
|------|---------|----------------|
| `pre-commit` | Before commit created | Validate state, run tests, check governance |
| `prepare-commit-msg` | Before commit message editor | Auto-generate commit message, add metadata |
| `commit-msg` | After message written, before commit | Enforce conventional commits, validate format |
| `post-commit` | After commit created | Update state, notify systems |
| `pre-push` | Before push | Run full test suite, validate all commits |
| `post-merge` | After merge | Update state, log merge metadata |

### 6.2 Commit Message Validation Hook

**Implementation (.git/hooks/commit-msg):**
```bash
#!/bin/bash

COMMIT_MSG_FILE=$1
COMMIT_MSG=$(cat "$COMMIT_MSG_FILE")

# Conventional Commits pattern with iDumb scope
PATTERN="^(feat|fix|docs|style|refactor|test|chore|perf|ci|build|revert)(\([a-zA-Z0-9._-]+\))?: .{1,72}"

if ! echo "$COMMIT_MSG" | grep -qE "$PATTERN"; then
  echo "ERROR: Invalid commit message format"
  echo ""
  echo "Expected format: type(scope): description"
  echo ""
  echo "Valid types: feat, fix, docs, style, refactor, test, chore, perf, ci, build, revert"
  echo "iDumb scopes: phase-NN, NN-NN, task-XXX, ms-name, agent-name"
  echo ""
  echo "Examples:"
  echo "  feat(02-03): implement JWT refresh"
  echo "  fix(task-003): resolve null pointer"
  echo "  docs(phase-02): complete auth phase"
  exit 1
fi
```

### 6.3 State Synchronization Hook

**Implementation (.git/hooks/post-commit):**
```bash
#!/bin/bash

# Update lastCommitHash in state
HASH=$(git rev-parse HEAD)
PHASE=$(git log -1 --format=%s | grep -oE 'phase-[0-9]+' || echo "unknown")

jq --arg hash "$HASH" --arg phase "$PHASE" '
  .lastCommitHash = $hash |
  .phase = $phase |
  .lastValidation = now
' .idumb/brain/state.json > .idumb/brain/state.json.tmp

mv .idumb/brain/state.json.tmp .idumb/brain/state.json

# Track commit in history
jq --arg hash "$HASH" --arg type "$(git log -1 --format=%s | cut -d'(' -f1)" --arg action "commit" '
  .history += [{
    timestamp: now,
    commitHash: $hash,
    type: $type,
    action: $action,
    result: "pass"
  }]
' .idumb/brain/state.json > .idumb/brain/state.json.tmp

mv .idumb/brain/state.json.tmp .idumb/brain/state.json
```

### 6.4 AI-Powered Commit Generation Hook

**Using prepare-commit-msg (.git/hooks/prepare-commit-msg):**
```bash
#!/bin/bash

COMMIT_MSG_FILE=$1

# Skip if message already provided
if [ -s "$COMMIT_MSG_FILE" ]; then
  exit 0
fi

# Get diff for context
DIFF=$(git diff --cached | head -100)

# Call AI to generate commit message
MESSAGE=$(echo "$DIFF" | claude generate-commit-message)

# Write generated message
echo "$MESSAGE" > "$COMMIT_MSG_FILE"
```

### 6.5 Pre-Commit Governance Check

**Implementation (.git/hooks/pre-commit):**
```bash
#!/bin/bash

# 1. Check for state drift
EXPECTED=$(jq -r '.expectedHash' .idumb/brain/state.json)
ACTUAL=$(git rev-parse HEAD)

if [ "$EXPECTED" != "$ACTUAL" ] && [ -n "$EXPECTED" ]; then
  echo "ERROR: Git state drift detected!"
  echo "Expected hash: $EXPECTED"
  echo "Actual hash: $ACTUAL"
  echo ""
  echo "Run: git reset --hard $EXPECTED"
  echo "Or update state: jq '.expectedHash = \"$ACTUAL\"' .idumb/brain/state.json"
  exit 1
fi

# 2. Validate iDumb artifacts exist
if git diff --cached --name-only | grep -q "\.planning/"; then
  # Check for required artifacts
  if ! git diff --cached --name-only | grep -q "PLAN.md"; then
    echo "WARNING: Planning artifacts committed but PLAN.md missing"
  fi
fi

# 3. Run fast tests
npm test -- --bail 2>/dev/null
if [ $? -ne 0 ]; then
  echo "ERROR: Tests failed"
  echo "Fix failing tests before committing"
  exit 1
fi

exit 0
```

### 6.6 Server-Side Enforcement (pre-receive)

**On remote server (.git/hooks/pre-receive):**
```bash
#!/bin/bash

while read oldrev newrev refname; do
  # Check each commit being pushed
  for commit in $(git rev-list $oldrev..$newrev); do
    # Verify commit message format
    MSG=$(git cat-file -p $commit | sed -ne '/^$/q; p')

    if ! echo "$MSG" | grep -qE '^(feat|fix|docs|style|refactor|test|chore|perf|ci|build|revert)'; then
      echo "ERROR: Commit $commit has invalid message format"
      echo "Message: $(echo "$MSG" | head -1)"
      exit 1
    fi

    # Check for required metadata in governance commits
    if echo "$MSG" | grep -qE '^(docs|chore)'; then
      if ! git cat-file -p $commit | grep -q "State:"; then
        echo "WARNING: Governance commit without State: metadata ($commit)"
      fi
    fi
  done
done
```

---

## 7. AI Framework Patterns

### 7.1 GSD (Get Shit Done) Patterns

**Key Principles:**
1. **Commit outcomes, not process** - Git log reads like a changelog
2. **Per-task commits** - One commit per task, not per-plan
3. **Metadata commits** - Separate commits for planning artifacts

**GSD Commit Pattern:**
```bash
# Task completion (code)
git commit -m "feat(02-03): implement JWT refresh"

# Plan completion (metadata)
git commit -m "docs(02-03): complete JWT implementation plan

Tasks completed: 5/5
- task-003: implement JWT refresh
- task-004: add refresh endpoint
- task-005: implement logout
- task-006: add tests
- task-007: update docs

SUMMARY: .planning/phases/02-auth/02-jwt-SUMMARY.md"
```

**GSD Anti-Patterns (What NOT to commit):**
- PLAN.md creation (commit with plan completion)
- RESEARCH.md (intermediate)
- DISCOVERY.md (intermediate)
- Minor planning tweaks
- "Fixed typo in roadmap"

### 7.2 BMAD Method Patterns

**Key Principles:**
1. **Submodule-based framework** - BMad as git submodule
2. **Experiment branches** - `test/` for exploration
3. **Feature branches** - `feat/` for implementation
4. **Documentation branches** - `doc/` for docs

**BMAD Branch Strategy:**
```bash
# BMad as submodule
git submodule add https://github.com/bmad-code-org/BMAD-METHOD.git .bmad

# Create experiment branch
git checkout -b test/ai-memory-pattern

# Create feature branch
git checkout -b feat/phase-02-auth

# Create documentation branch
git checkout -b docs/update-governance-guide
```

### 7.3 GitHub Copilot Patterns

**Branch Naming:**
- Copilot always uses `copilot/` prefix (not configurable)
- Workaround: Rename after creation

**Commit Generation:**
- Copilot analyzes diffs and suggests conventional commits
- Requires human review
- Can be enhanced with custom prompts

### 7.4 Cursor AI Patterns

**Commit Analysis:**
- Cursor analyzes diffs and auto-suggests commit messages
- Follows Conventional Commits format
- Includes context-aware suggestions

**Branch Management:**
- AI recommends branch names
- Identifies stale branches
- Predicts merge conflicts

### 7.5 AI Memory Integration

**Pattern: Use git history as AI's long-term memory**

```bash
# Query pattern for AI agents
git log --oneline --name-status --since="2026-02-01"
git diff <start-hash> <end-hash> --stat
git blame <file-path> | head -20
```

**Augment Code's Context Lineage:**
- Injects commit history into AI prompts
- Token-level cost similar to small file
- Provides evolution-aware intelligence

---

## 8. Implementation Recommendations

### 8.1 Commit Message Format Specification

**iDumb Standard Format:**
```
<type>(<scope>): <imperative description>

[optional: bullet points]

[optional body]

[optional footers]
Related: .planning/phases/{N}-name/{N}-{name}-PLAN.md
Closes: task-XXX
State: <key>=<value>
```

**iDumb Scope Hierarchy:**

| Level | Scope Format | Example |
|-------|-------------|---------|
| Phase | `phase-<NN>` | `phase-02` |
| Plan | `<phase>-<plan>` | `02-03` |
| Task | `task-<XXX>` | `task-003` |
| Milestone | `ms-<name>` | `ms-v1` |
| Agent | `<agent-name>` | `executor` |
| Research | `research-<topic>` | `research-git` |

**Commit Type Mapping:**

| iDumb Action | Commit Type | Example |
|--------------|-------------|---------|
| New feature | `feat` | `feat(02-03): add refresh endpoint` |
| Bug fix | `fix` | `fix(task-003): resolve null pointer` |
| Refactor | `refactor` | `refactor(tool): optimize state reading` |
| Test | `test` | `test(02-03): add refresh tests` |
| Documentation | `docs` | `docs(phase-02): complete phase` |
| Governance | `chore` | `chore(checkpoint): create checkpoint` |

### 8.2 Branch Naming Conventions

**iDumb Standard:**
```
<type>/<entity>/<description>
```

**Branch Types:**

| Type | Purpose | Example |
|------|---------|---------|
| `phase` | Phase development | `phase/02-auth` |
| `plan` | Plan execution | `plan/02-jwt-implementation` |
| `fix` | Bug fix | `fix/02-jwt-null-pointer` |
| `hotfix` | Production emergency | `hotfix/01-governance-halt` |
| `research` | Research branch | `research/git-integration` |
| `experiment` | Proof of concept | `experiment/ai-commit-generator` |
| `docs` | Documentation | `docs/update-governance` |
| `ai/<agent>` | AI-assisted work | `ai/claude/phase-02-research` |

### 8.3 Git Tool Integration Patterns

**For iDumb Agents:**

```typescript
// Get current commit info
const currentHash = execSync('git rev-parse HEAD').trim();
const currentBranch = execSync('git rev-parse --abbrev-ref HEAD').trim();
const lastCommitMsg = execSync('git log -1 --format=%s').trim();

// Get commits for phase
const phaseCommits = execSync(`git log --oneline --grep="02-"`).split('\n');

// Get diff for plan
const planDiff = execSync(`git diff ${startHash} ${endHash} --stat`);

// Verify hash
const verifyHash = (expected: string): boolean => {
  const actual = execSync('git rev-parse HEAD').trim();
  return actual === expected;
};

// Rollback to checkpoint
const rollbackToCheckpoint = (tag: string): void => {
  execSync(`git checkout ${tag}`);
};
```

### 8.4 Example Workflows

**Workflow 1: Phase Execution**
```bash
# 1. Create phase branch
git checkout -b phase/02-auth

# 2. Execute tasks (per-task commits)
git add src/auth/jwt.ts
git commit -m "feat(02-03): implement JWT generation"
git push

git add src/auth/refresh.ts
git commit -m "feat(02-04): add token refresh endpoint"
git push

# 3. Complete plan (metadata commit)
git commit -m "docs(02-03): complete JWT setup plan

Tasks completed: 3/3
- task-001: implement JWT generation
- task-002: add token validation
- task-003: create refresh endpoint

SUMMARY: .planning/phases/02-auth/02-jwt-SUMMARY.md"
git push

# 4. Complete phase
git commit -m "docs(phase-02): complete authentication phase

Plans completed: 3/3
- 02-01: JWT setup
- 02-02: token refresh
- 02-03: logout flow

State: .idumb/brain/state.json updated"
git push

# 5. Merge to main
git checkout main
git merge phase/02-auth --no-ff
git push
```

**Workflow 2: Debugging with Bisect**
```bash
# 1. Start bisect
git bisect start

# 2. Mark current as bad
git bisect bad HEAD

# 3. Mark last good as good
git bisect good <last-good-checkpoint>

# 4. Run automated test
git bisect run npm test

# 5. Git finds culprit
# Bisect found: abc1234 is the first bad commit

# 6. Inspect culprit
git show abc1234

# 7. Revert culprit
git revert abc1234

# 8. Reset bisect
git bisect reset
```

**Workflow 3: Checkpoint & Restore**
```bash
# 1. Create checkpoint
git tag checkpoint-20260204-phase02-task3
git push origin checkpoint-20260204-phase02-task3

# 2. Store in state
jq --arg tag "checkpoint-20260204-phase02-task3" '
  .lastCheckpoint = $tag
' .idumb/brain/state.json > .idumb/brain/state.json.tmp

mv .idumb/brain/state.json.tmp .idumb/brain/state.json
git add .idumb/brain/state.json
git commit -m "chore(checkpoint): create checkpoint after task-003

Tag: checkpoint-20260204-phase02-task3
State: updated"
git push

# 3. Later, if something breaks
git checkout checkpoint-20260204-phase02-task3

# 4. Create branch from checkpoint
git checkout -b continue-phase02 checkpoint-20260204-phase02-task3
```

### 8.5 Best Practices Summary

**Commits:**
✅ One logical unit per commit
✅ Imperative mood in subject line
✅ Include bullet points for multi-part changes
✅ Link to planning artifacts in footers
✅ Update state.json in governance commits
❌ Don't commit intermediate artifacts (PLAN.md, RESEARCH.md)
❌ Don't use vague descriptions ("fix bug", "update code")
❌ Don't mix types (feat + fix in one commit)

**Branches:**
✅ One branch per phase (recommended)
✅ Descriptive names with prefixes
✅ Merge with `--no-ff` to preserve context
✅ Delete branches after merge
❌ Don't work directly on main
❌ Don't create unnecessary branches
❌ Don't keep stale branches

**Hooks:**
✅ Enforce conventional commits with commit-msg
✅ Update state.json with post-commit
✅ Validate state drift with pre-commit
✅ Use prepare-commit-msg for AI assistance
✅ Enforce server-side with pre-receive
❌ Don't make hooks too slow
❌ Don't bypass hooks with --no-verify (unless emergency)
❌ Don't commit hooks to .git (use git init)

**Atomicity & Rollback:**
✅ Keep commits small and reversible
✅ Create checkpoints before risky changes
✅ Use git revert for safe rollbacks
✅ Verify hashes before critical operations
❌ Don't use hard reset on shared branches
❌ Don't rewrite public history
❌ Don't lose work without backup

**Context Intelligence:**
✅ Commit frequently for granular history
✅ Write descriptive messages for AI parsing
✅ Use conventional commits for machine readability
✅ Leverage git blame for code archaeology
❌ Don't squash before push (loses atomicity)
❌ Don't commit with "WIP" or "fix later"
❌ Don't ignore test failures in commits

---

## 9. Sources

### 9.1 Official Documentation

1. **Conventional Commits Specification**
   - URL: https://www.conventionalcommits.org/
   - Library ID: /conventional-commits/conventionalcommits.org
   - Focus: Commit message format specification

2. **Git Documentation**
   - Git Hooks: https://git-scm.com/book/en/v2/Customizing-Git-Git-Hooks
   - Git Blame: https://git-scm.com/docs/git-blame
   - Git Bisect: https://git-scm.com/docs/git-bisect

### 9.2 Framework Documentation

3. **GSD Git Integration**
   - File: documents/planning-artifacts/research/get-shit-done/references/git-integration.md
   - Focus: Per-task commits, metadata commits, anti-patterns

4. **BMAD Method**
   - Repository: https://github.com/bmad-code-org/BMAD-METHOD
   - Focus: Submodule-based framework, experiment branches

5. **GitHub Copilot Agent**
   - Discussion: https://github.com/orgs/community/discussions/173717
   - Focus: Branch naming, AI assistance

### 9.3 Industry Best Practices

6. **Commitlint**
   - Repository: https://github.com/conventional-changelog/commitlint
   - Focus: Commit message validation

7. **Semantic Release**
   - Repository: https://github.com/semantic-release/semantic-release
   - Focus: Automated versioning from commits

8. **Pre-commit Framework**
   - URL: https://pre-commit.com/
   - Focus: Multi-language hook management

### 9.4 Research Articles

9. **Atomic Git Commits**
   - URL: https://suchdevblog.com/lessons/AtomicGitCommits.html
   - Focus: Small, reversible commits

10. **Git Best Practices for AI Code**
    - URL: https://www.ranger.net/post/version-control-best-practices-ai-code
    - Focus: Commit conventions for AI workflows

11. **AI-Powered Git Workflow Automation**
    - URL: https://www.augmentcode.com/guides/13-enterprise-version-control-integrations
    - Focus: AI-native automation platforms

12. **Git Memory for AI Agents**
    - URL: https://www.theaistack.dev/p/git-memory
    - Focus: Giving AI agents git memory

13. **AI Governance and Pre-Commit Hooks**
    - URL: https://hoop.dev/blog/ai-governance-and-pre-commit-security-hooks
    - Focus: Security, governance automation

### 9.5 Branch Naming Resources

14. **Git Branch Naming Conventions**
    - URL: https://medium.com/@abhay.pixolo/naming-conventions-for-git-branches-a-cheatsheet-8549feca2534
    - Focus: Standard patterns, Jira integration

15. **GitFlow Tutorial**
    - URL: https://www.datacamp.com/tutorial/gitflow
    - Focus: GitFlow branching strategy

16. **Git Branching Strategies**
    - URL: https://martinfowler.com/articles/branching-patterns.html
    - Focus: Branch isolation strategies

### 9.6 Tool Documentation

17. **Partcad Pre-Commit**
    - Repository: https://github.com/partcad/pre-commit
    - Focus: AI-powered commit message generation

18. **Commitizen**
    - Repository: https://github.com/commitizen/cz-cli
    - Focus: Conventional commit CLI

19. **Git Cliff**
    - Repository: https://github.com/orhun/git-cliff
    - Focus: Changelog generation

### 9.7 Community Knowledge

20. **Stack Overflow: When does git verify integrity?**
    - URL: https://stackoverflow.com/questions/50650364/when-does-git-actually-verify-the-integrity-of-the-commit-chain
    - Focus: Git hash verification

21. **Reddit: How do you correctly use Git with BMAD?**
    - URL: https://www.reddit.com/r/BMAD_Method/comments/1p241hq/how_do_you_correctly_use_git_with_the_bmad_method/
    - Focus: BMAD + Git workflow

22. **Dev.to: Git Commit When AI Met Human Insight**
    - URL: https://medium.com/@eslamhelmy523/git-commit-when-ai-met-human-insight-c3ae00f03cfb
    - Focus: AI-assisted commit messages

---

## Appendix A: Quick Reference

### Conventional Commits Regex
```regex
^(feat|fix|docs|style|refactor|test|chore|perf|ci|build|revert)(\([a-zA-Z0-9._-]+\))?!?: .{1,72}
```

### iDumb Scope Regex
```regex
(phase-[0-9]{2}|[0-9]{2}-[0-9]{2}|task-[0-9]{3}|ms-[a-z0-9-]+|executor|planner|verifier|debugger|research-[a-z]+)
```

### Git Commands Cheat Sheet
```bash
# Commit with conventional format
git commit -m "feat(02-03): implement JWT refresh"

# Verify hash
git rev-parse HEAD

# Get commits for phase
git log --oneline --grep="02-"

# Bisect for debugging
git bisect start; git bisect bad HEAD; git bisect good <hash>; git bisect run npm test

# Create checkpoint
git tag checkpoint-20260204-phase02; git push origin checkpoint-20260204-phase02

# Restore checkpoint
git checkout checkpoint-20260204-phase02

# Merge with context
git merge phase/02-auth --no-ff
```

---

**Document Version:** 1.0.0
**Last Updated:** 2026-02-04
**Next Review:** 2026-02-11 (7 days)
**Status:** Complete - Ready for iDumb Implementation
