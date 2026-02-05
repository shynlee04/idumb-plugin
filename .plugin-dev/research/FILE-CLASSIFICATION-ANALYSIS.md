# Project-Specific vs Plugin-Packaged File Analysis

**Date:** 2026-02-04  
**Purpose:** Identify files generated during plugin usage vs files that are part of the plugin package

---

## 1. File Classification

### ✅ PLUGIN-PACKAGED (Distributed with npm package)

These belong in `src/` and are installed to `.opencode/`:

| Path | Type | Purpose |
|------|------|---------|
| `src/agents/*.md` | 18 agents | Agent definitions |
| `src/commands/idumb/*.md` | 15 commands | Slash command definitions |
| `src/plugins/idumb-core.ts` | Plugin | Main hook implementation |
| `src/tools/*.ts` | 7 tools | Tool implementations |
| `src/config/*.yaml` | Config | Default deny rules |
| `src/schemas/*.json` | Schemas | Validation schemas |
| `src/router/*.md` | Router | Chain enforcement rules |
| `src/templates/*.md` | Templates | Output templates |
| `src/workflows/*.md` | Workflows | Agent workflow definitions |
| `src/skills/idumb-governance/` | Skill | Governance skill |
| `src/types/*.d.ts` | Types | TypeScript definitions |

### ⚠️ PROJECT-SPECIFIC (Generated at Runtime)

These are created **WHEN USING THE PLUGIN ON A PROJECT**:

| Current Path | Status | Correct Location | Notes |
|--------------|--------|------------------|-------|
| `.idumb/` | ✅ CORRECT | `.idumb/` | Runtime state directory |
| `.idumb/brain/` | ✅ CORRECT | `.idumb/brain/` | Session state |
| `.idumb/brain/sessions/` | ✅ CORRECT | `.idumb/brain/sessions/` | Session metadata |
| `.idumb/brain/execution/` | ✅ CORRECT | `.idumb/brain/execution/` | Execution metrics |
| `.idumb/brain/governance/` | ✅ CORRECT | `.idumb/brain/governance/` | Validation logs |
| `.idumb/brain/config.json` | ✅ CORRECT | `.idumb/brain/config.json` | User configuration |
| `.planning/` | ❌ WRONG | Should be read-only external | This is the iDumb REPO's planning |
| `docs/` | ⚠️ MIXED | See below | Contains both |
| `documents/` | ❌ WRONG | Archive or delete | Old planning artifacts |
| `.planning-archive-20260203/` | ❌ WRONG | Archive or delete | Old archive |

---

## 2. Problem Areas

### Problem 1: `.planning/` is Plugin Development Planning

**Current State:**
```
.planning/
├── PROJECT.md           # iDumb plugin's own project definition
├── ROADMAP.md           # iDumb plugin's roadmap
├── MASTER-REDESIGN-PLAN-2026-02-04.md
└── research/            # 18 research files for the PLUGIN itself
```

**Issue:** This is the iDumb PLUGIN's own planning, NOT a target project's planning. When someone uses iDumb on their project, they would have their OWN `.planning/` directory.

**Fix:** Move iDumb's internal planning to a dedicated location:
- Option A: `.plugin-dev/` (internal development)
- Option B: `dev/planning/` (clearly separate)
- Option C: Keep but add to `.npmignore`

### Problem 2: `documents/planning-artifacts/` is Stale

**Current State:**
```
documents/planning-artifacts/
└── research/            # 105 old research files
```

**Issue:** These are outdated artifacts from earlier development phases.

**Fix:** Archive or delete. Research has moved to `.planning/research/`.

### Problem 3: `docs/` Contains Both Plugin Docs and Generated Docs

**Current State:**
```
docs/
├── AGENTS.md                  # Plugin documentation (KEEP)
├── IMPLEMENTATION-GUIDE.md    # Plugin documentation (KEEP)
├── CROSS-CONCEPT-MATRIX-*.md  # Generated during dev (ARCHIVE)
├── VALIDATION-CHECKLIST-*.md  # Generated during dev (ARCHIVE)
├── en/                        # Plugin docs (KEEP)
├── vi/                        # Plugin docs (KEEP)
└── research/                  # Older research (ARCHIVE)
```

### Problem 4: `src/config/SESSION-STATES-GOVERNANCE.md` is Misplaced

**Issue:** I just created this file in `src/config/` but it's a reference document, not a config file.

**Correct Location:** `docs/` or `src/router/`

---

## 3. Recommended Directory Structure

### For the iDumb Plugin Package (npm distributed):

```
src/                           # Plugin source (npm packaged)
├── agents/                    # Agent definitions
├── commands/                  # Command definitions  
├── config/                    # Default configuration files
│   ├── deny-rules.yaml
│   └── completion-definitions.yaml
├── plugins/                   # Plugin implementation
├── router/                    # Chain enforcement
│   ├── chain-enforcement.md
│   ├── routing-rules.md
│   └── SESSION-STATES-GOVERNANCE.md  # MOVE HERE
├── schemas/                   # JSON schemas
├── skills/                    # Skills
├── templates/                 # Output templates
├── tools/                     # Tool implementations
├── types/                     # TypeScript types
└── workflows/                 # Workflow definitions

docs/                          # Plugin documentation (npm packaged)
├── AGENTS.md
├── IMPLEMENTATION-GUIDE.md
├── en/
└── vi/

bin/                           # CLI scripts (npm packaged)
└── install.js
```

### For iDumb Plugin Development (NOT npm distributed):

```
.plugin-dev/                   # Internal plugin development (add to .npmignore)
├── PROJECT.md
├── ROADMAP.md
├── MASTER-REDESIGN-PLAN-*.md
└── research/
    └── *.md

.archive/                      # Archived files (add to .npmignore)
├── documents/
└── old-research/
```

### For Target Projects Using iDumb (generated at runtime):

```
.idumb/                        # iDumb runtime state (gitignored per preference)
├── brain/
├── config.json
├── governance/
├── sessions/
└── execution/

.planning/                     # Project planning (if using planning framework)
├── PROJECT.md                 # User's project
├── ROADMAP.md                 # User's roadmap
└── phases/

.opencode/                     # OpenCode installation
├── agents/                    # Copied from src/agents/
├── plugins/                   # Copied from src/plugins/
└── ...
```

---

## 4. Commands/Workflows Generating Project-Specific Files

| Command/Workflow | Generates To | Correct? |
|------------------|--------------|----------|
| `/idumb:init` | `.idumb/brain/config.json` | ✅ YES |
| `/idumb:new-project` | `.planning/PROJECT.md` | ✅ YES |
| `/idumb:roadmap` | `.idumb/brain/governance/roadmap.md` OR `.planning/ROADMAP.md` | ✅ YES |
| `/idumb:research` | `.idumb/brain/governance/research/` | ✅ YES |
| `/idumb:plan-phase` | `.idumb/brain/governance/plans/` | ✅ YES |
| `/idumb:discuss-phase` | `.idumb/brain/governance/phases/` | ✅ YES |
| Plugin hooks | `.idumb/brain/sessions/`, `.idumb/brain/` | ✅ YES |
| iDumb development | `.planning/` | ❌ SHOULD BE `.plugin-dev/` |

---

## 5. Action Items

### Immediate (This Session)

1. [x] Move `src/config/SESSION-STATES-GOVERNANCE.md` → `src/router/`
2. [ ] Add `.plugin-dev/` to package structure
3. [ ] Move `.planning/` → `.plugin-dev/`
4. [ ] Archive `documents/` and `.planning-archive-20260203/`
5. [ ] Update `.npmignore` to exclude dev files

### Future (P6-INIT tasks)

1. [ ] Update `/idumb:init` to clearly separate target project dirs
2. [ ] Document the 3-context model in SKILL.md
3. [ ] Create `.plugin-dev/` management workflow
