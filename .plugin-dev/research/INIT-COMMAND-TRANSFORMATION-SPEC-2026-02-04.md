# iDumb Init Command Transformation - Complete Specification

**Document Type:** Master Specification
**Project:** iDumb v2 Meta-Framework
**Created:** 2026-02-04
**Version:** 1.0.0
**Purpose:** Complete specification for transforming the iDumb init command from a basic installer into an intelligent, configurable governance initialization system

---

## Table of Contents

1. [Overview & Vision](#1-over)--vision)
2. [Current State Analysis](#2-current-state-analysis)
3. [User Journey Transformation](#3-user-journey-transformation)
4. [Folder Hierarchy Restructure](#4-folder-hierarchy-restructure)
5. [Configuration System](#5-configuration-system)
6. [Language & Localization](#6-language--localization)
7. [Governance Levels](#7-governance-levels)
8. [Git Integration](#8-git-integration)
9. [Implementation Roadmap](#9-implementation-roadmap)
10. [Validation Criteria](#10-validation-criteria)

---

## 1. Overview & Vision

### 1.1 Problem Statement

The current iDumb init command is a basic installer that:
- ❌ Shows no introduction to the framework
- ❌ Lacks meaningful configuration options
- ❌ Does not scan or analyze the codebase intelligently
- ❌ Does not set up Git integration
❌ Does not configure MCP servers for research
- ❌ Creates a mess of directories without clear purpose
- ❌ Stores values that nothing reads or enforces

### 1.2 Vision Statement

The transformed init command will be the **gateway to trustworthy AI governance** - demonstrating:
1. **Auto & Accurate Governance** - Framework that actually enforces rules
2. **Expert-Level AI for All Users** - From pro to retard mode
3. **Advanced Purified Context** - Token-efficient context management
4. **No Hustle for YOLO-Coders** - Zero-configuration when needed

### 1.3 Design Principles

```
★ Insight ─────────────────────────────────────
The init command is the FIRST impression users have.
If it fails to inspire confidence, the entire framework is judged.
This transformation focuses on TRUST through intelligence.
─────────────────────────────────────────────────
```

**Principles:**
1. **Show, Don't Just Tell** - Display framework capabilities, don't explain them
2. **Configure Meaningfully** - Every option affects behavior
3. **Intelligent by Default** - Scan codebase, suggest optimizations
4. **Proven by Evidence** - Generate validation reports, not promises
5. **Language-Native** - Support Vietnamese and English equally

---

## 2. Current State Analysis

### 2.1 Current Init Flow

```
npm run install:local
  ↓
[ASCII Art Banner]
  ↓
Language Selection (EN/VI)
  ↓
Introduction (scrolls too fast)
  ↓
Install Location (global/local)
  ↓
Project Detection (basic)
  ↓
Archive GSD Files
  ↓
Install Agents/Commands/Tools/Plugins/Skills
  ↓
Create .idumb/ Directories
  ↓
Complete Message
```

### 2.2 Current Gaps Identified

| Area | Gap | Severity |
|------|-----|----------|
| **UX** | No explanation of what iDumb is or does | CRITICAL |
| **Config** | No governance/experience/research settings | CRITICAL |
| **Scanning** | No codebase analysis or documentation | HIGH |
| **Git** | No integration for atomic commits | HIGH |
| **Research** | No MCP server configuration | MEDIUM |
| **Language** | Language not enforced in agents | CRITICAL |
| **Validation** | No validation of init configuration | MEDIUM |
| **Feedback** | No confirmation of what was configured | MEDIUM |

### 2.3 User Disappointment Summary

From the user's disappointment session:
> "The init CLI is ugly, lacks information, unthoughtful of users and the iDumb framework as for it lacks intro when running the CLI I don't know the core concepts"

**Key Pain Points:**
1. No framework introduction
2. No configuration that affects behavior
3. No path detection/validation
4. No codebase scanning
5. No Git integration
6. Language not enforced
7. Non-sensical config values (agents don't obey)
8. No iteration limits

---

## 3. User Journey Transformation

### 3.1 New User Journey (Interactive Mode)

```
User runs: npm run install:local
  ↓
════════════════════════════════════════════════════════════════
                   Welcome to iDumb
      Intelligent Delegation Using Managed Boundaries
════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────┐
│  What iDumb Does:                                                  │
│                                                                     │
│  ✦ HIERARCHICAL     4-tier agent delegation for safety            │
│  ✦ GOVERNED        Chain enforcement, no silent failures           │
│  ✦ CONTEXT-AWARE    Purified working set, minimal tokens           │
│  ✦ INTELLIGENT      Expert decisions for all user levels           │
│                                                                     │
│  Core Concepts:                                                      │
│  • Supreme Coordinator → Orchestrates all work                     │
│  • Checkpoints → Never lose progress                                  │
│  • Chain Rules → Prevent command overload                          │
│  • Stall Detection → Never loop forever                             │
└─────────────────────────────────────────────────────────────────┘

Press Enter to continue...
  ↓
┌─────────────────────────────────────────────────────────────────┐
│  🌐 Select Language / Chọn Ngôn Ngữ                                │
├─────────────────────────────────────────────────────────────────┤
│  [1] English                    [2] Tiếng Việt                   │
└─────────────────────────────────────────────────────────────────┘

Language [2]: Vietnamese
  ↓
┌─────────────────────────────────────────────────────────────────┐
│  👤 User Experience Level / Trình Đẳng Kinh Nghiệm               │
├─────────────────────────────────────────────────────────────────┤
│  [1] Pro      • Bạn dẫn dắt, AI gợi ý                        │
│  [2] New      • AI giải thích, gợi ý con đường                  │
│  [3] Retard   • Hạn chế tường trường, chặn nguy hiểm             │
└─────────────────────────────────────────────────────────────────┘

Experience [2]: New
  ↓
┌─────────────────────────────────────────────────────────────────┐
│  ⚙️  Governance Level / Mức Độ Quản Trị                         │
├─────────────────────────────────────────────────────────────────┤
│  [1] Efficient    • Unit + Integration + Node (không incremental) │
│  [2] Strict        • Tất cả trên + Incremental validation      │
│  [3] Intelligent • Full coverage + Global/Local assessments    │
└─────────────────────────────────────────────────────────────────┘

Governance [3]: Intelligent
  ↓
┌─────────────────────────────────────────────────────────────────┐
│  🤖 AI Decision Mode / Chế Độ Quyết Định AI                     │
├─────────────────────────────────────────────────────────────────┤
│  [1] Default      • Hiển thị lựa chọn, khuyến nghị                  │
│  [2] Advanced     • AI-first, dựa trên điểm số và lý do          │
│  [3] Autonomous  • AI quyết định đầy đủ (thử nghiệm)            │
└─────────────────────────────────────────────────────────────────┘

AI Mode [1]: Default
  ↓
┌─────────────────────────────────────────────────────────────────┐
│  📊 Research Configuration / Cấu Hình Nghiên Cứu                │
├─────────────────────────────────────────────────────────────────┤
│  Research servers needed for intelligent codebase analysis:     │
│  ✓ Context7    (Library documentation)                        │
│  ✓ Tavily      (Web search)                                   │
│  ✓ DeepWiki    (GitHub repository deep dive)                   │
│                                                                     │
│  Auto-install missing servers? [Y/n]: Y                       │
│  Interactive mode for setup? [Y/n]: Y                             │
└─────────────────────────────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────────────────────────────┐
│  🔍 Codebase Analysis / Phân Tích Codebase                        │
├─────────────────────────────────────────────────────────────────┤
│  Scanning project: /Users/apple/Documents/coding-projects/idumb │
│                                                                     │
│  Detected: TypeScript Project (Node.js + OpenCode Plugin)       │
│  Files: 1,247 | Lines: 156,832 | Commits: 847                    │
│                                                                     │
│  Legacy Documents Found:                                         │
│    • .planning/STATE.md (GSD format) → Archive? [Y/n]: Y        │
│    • ROADMAP.md (keep) → Keep for reference                       │
│                                                                     │
│  Suggested Configuration:                                          │
│    • Governance Level: Strict (project has integration tests)    │
│    • Max Delegation Depth: 5 (hierarchical complexity)         │
│    • Iteration Limits: Enabled (prevent infinite loops)        │
│                                                                     │
│  Accept suggestions? [Y/n]: Y                                    │
└─────────────────────────────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────────────────────────────┐
│  📋 Summary / Tóm Tắt                                              │
├─────────────────────────────────────────────────────────────────┤
│  Configuration:                                                     │
│    Language: Vietnamese                                          │
│    Experience: New (AI explains decisions)                        │
│    Governance: Intelligent (full coverage assessments)           │
│    AI Mode: Default (choices with recommendations)               │
│    Research: All 3 servers enabled                              │
│                                                                     │
│  Directory Structure:                                              │
│    ✓ .idumb/brain/     (Governance memory)               │
│    ✓ .idumb/project-output/ (Artifacts, not plans)        │
│    ✓ .idumb/modules/      (Extensions)                   │
│                                                                     │
│  Next Steps:                                                        │
│    1. Run /idumb:status to verify governance                   │
│    2. Run /idumb:map-codebase to analyze project                 │
│    3. Run /idumb:roadmap to create project roadmap                │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Non-Interactive Mode

```bash
# Zero-configuration init with smart defaults
npm run install:local --non-interactive

# Full configuration via flags
npm run install:local \
  --language=vietnamese \
  --experience=new \
  --governance=strict \
  --ai-mode=default \
  --research-servers=context7,tavily \
  --no-scan \
  --overwrite
```

---

## 4. Folder Hierarchy Restructure

### 4.1 New Directory Structure

```
.idumb/
├── idumb-brain/                    # AI Governance Memory (NEW NAME)
│   ├── state.json                  # Master governance state
│   ├── config.json                 # User + system configuration
│   ├── sessions/                   # Session work tracking
│   │   ├── ses_*.json             # Session metadata
│   │   └── session-index.json     # Session catalog
│   ├── context/                    # Preserved context artifacts
│   │   ├── checkpoints/           # Pre-compaction checkpoints
│   │   └── anchors/               # Critical decisions
│   ├── governance/                # Governance memory
│   │   ├── validations/           # Validation reports
│   │   ├── chain-traces/          # Delegation history
│   │   └── audit-log/             # All governance actions
│   ├── drift/                      # Stale and drift status
│   │   ├── stale-artifacts/       # Outdated items
│   │   └── drift-detections/     # Changes to review
│   └── metadata/                   # Meta data traceable
│       ├── relationships/         # Artifact links
│       └── timestamps/           # Temporal tracking
│
├── idumb-project-output/          # Project Artifacts (REPLACES .planning/)
│   ├── PROJECT.md                  # Project overview (YAML frontmatter)
│   ├── ROADMAP.md                  # Project roadmap (YAML frontmatter)
│   ├── phases/                     # Phase artifacts
│   │   ├── phase-01-foundation/
│   │   │   ├── PHASE.md
│   │   │   ├── PLAN.md
│   │   │   ├── STATE.md
│   │   │   ├── RESEARCH/
│   │   │   └── ARTIFACTS/
│   │   └── ...
│   ├── research/                   # Research outputs
│   │   ├── tech-stack-{date}.md
│   │   ├── architecture-{date}.md
│   │   └── ...
│   └── validations/                # Validation reports
│       ├── validation-{timestamp}.json
│       └── ...
│
├── idumb-modules/                # User-Generated Extensions
│   ├── tools/                      # Custom tools created by idumb-builder
│   ├── workflows/                   # Custom workflows
│   ├── templates/                   # Custom templates
│   └── agents/                      # Custom agents
│
└── .gsd-archive/                   # Archived GSD files (if found)
    ├── agents/
    └── commands/
```

### 4.2 Frontmatter Schema

All documents in `idumb-project-output/` use YAML frontmatter:

```yaml
---
id: artifact-{timestamp}
created: 2026-02-04T10:30:00.000Z
modified: 2026-02-04T10:30:00.000Z
status: draft | active | complete | archived
type: project | phase | plan | research | validation
tier: 1 | 2 | 3 | 4
parent: null | {parent-id}
phase: null | {phase-id}
tags: []
language: english | vietnamese
contributors: []
---

# Document Title
...
```

### 4.3 ID-Based Chain Detection

```typescript
// Artifact ID format
interface ArtifactID {
  prefix: string      // 'project', 'phase', 'plan', 'research'
  timestamp: number   // Unix timestamp
  sequence: number    // Sequential number
  tier: number         // 1-4
  checksum: string     // Content hash
}

// Example: project-1707034200000-001-1-a3f5
//         ^       ^            ^    ^   ^
//         |       |            |    |   └─ checksum
//         |       |            |    └─ tier
//         |       |            └─ sequence
//         |       └─ timestamp
//         └─ prefix

// Chain validation
function validateChain(artifact: Artifact): boolean {
  // Check parent exists and references this child
  if (artifact.parent) {
    const parent = loadArtifact(artifact.parent);
    if (!parent) return false;
    if (!parent.children.includes(artifact.id)) return false;
  }

  // Check phase consistency
  if (artifact.phase) {
    const phase = loadArtifact(artifact.phase);
    if (!phase || phase.type !== 'phase') return false;
  }

  // Check for stale detection
  const age = Date.now() - artifact.modified;
  if (age > STALE_THRESHOLD_MS) {
    artifact.status = 'stale';
  }

  return true;
}
```

---

## 5. Configuration System

### 5.1 Complete Configuration Schema

```json
{
  "version": "0.3.0",
  "initialized": "2026-02-04T00:00:00.000Z",
  "lastModified": "2026-02-04T00:00:00.000Z",

  "user": {
    "name": "Developer",
    "experience": "guided",
    "timezone": "UTC",
    "language": {
      "communication": "english",
      "documents": "english",
      "enforcement": "strict"
    }
  },

  "governance": {
    "level": "strict",
    "autoExpertMode": "default",
    "validation": {
      "incremental": true,
      "globalAssessments": false,
      "localAssessments": false,
      "unitTests": true,
      "integrationTests": true,
      "nodeValidation": true
    }
  },

  "iteration": {
    "maxDelegationDepth": 5,
    "maxTotalIterations": 1000,
    "maxSessionDuration": 1800,
    "emergencyBypassAllowed": false,
    "stallDetection": {
      "maxRetries": 3,
      "maxSameIssues": 5,
      "timeoutSeconds": 60
    }
  },

  "automation": {
    "mode": "confirmRequired",
    "contextFirst": {
      "enabled": true,
      "requiredTools": ["read", "glob", "idumb-state"],
      "blockWithoutContext": false
    },
    "workflow": {
      "research": true,
      "planCheck": true,
      "verifyAfterExecution": true,
      "commitOnComplete": false
    }
  },

  "research": {
    "enabled": true,
    "servers": {
      "context7": {
        "enabled": true,
        "required": true,
        "config": {
          "maxResults": 10,
          "timeout": 30000
        }
      },
      "tavily": {
        "enabled": true,
        "required": true,
        "config": {
          "timeout": 30000,
          "maxResults": 10
        }
      },
      "deepwiki": {
        "enabled": true,
        "required": false,
        "config": {
          "maxRepositories": 1,
          "maxDepth": 3,
          "timeout": 45000
        }
      }
    }
  },

  "paths": {
    "brain": ".idumb/brain/",
    "state": ".idumb/brain/state.json",
    "config": ".idumb/brain/config.json",
    "projectOutput": ".idumb/project-output/",
    "modules": ".idumb/modules/"
  }
}
```

### 5.2 Configuration Validation

```typescript
function validateConfig(config: IdumbConfig): ValidationResult {
  const errors: string[] = [];

  // User section
  if (!config.user?.experience || !['pro', 'new', 'retard'].includes(config.user.experience)) {
    errors.push('user.experience must be one of: pro, new, retard');
  }

  // Governance section
  if (!config.governance?.level || !['efficient', 'strict', 'intelligent'].includes(config.governance.level)) {
    errors.push('governance.level must be one of: efficient, strict, intelligent');
  }

  // Cross-field validation
  if (config.user?.experience === 'retard' && config.governance?.level === 'efficient') {
    errors.push('retard mode requires at least strict governance level');
  }

  // Language enforcement
  if (config.user?.language?.enforcement === 'strict' && !config.user?.language?.communication) {
    errors.push('strict language enforcement requires communication language to be set');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: []
  };
}
```

---

## 6. Language & Localization

### 6.1 Bilingual Support Architecture

```typescript
// Localization map
const i18n = {
  en: {
    welcome: 'Welcome to iDumb',
    whatIdumbDoes: 'What iDumb Does',
    coreConcepts: 'Core Concepts',
    selectLanguage: 'Select Language',
    selectExperience: 'Select Experience Level',
    selectGovernance: 'Select Governance Level',
    selectAIMode: 'Select AI Decision Mode',
    configureResearch: 'Research Configuration',
    codebaseAnalysis: 'Codebase Analysis',
    summary: 'Summary',
    nextSteps: 'Next Steps'
  },
  vi: {
    welcome: 'Chào mừng đến iDumb',
    whatIdumbDoes: 'iDumb Làm Gì',
    coreConcepts: 'Khái Niên Cốt Lõi',
    selectLanguage: 'Chọn Ngôn Ngữ',
    selectExperience: 'Chọn Trình Đẳng',
    selectGovernance: 'Chọn Mức Độ Quản Trị',
    selectAIMode: 'Chọn Chế Độ Quyết Định AI',
    configureResearch: 'Cấu Hình Nghiên Cứu',
    codebaseAnalysis: 'Phân Tích Codebase',
    summary: 'Tóm Tắt',
    nextSteps: 'Bước Tiếp Theo'
  }
};
```

### 6.2 Agent Language Enforcement

```yaml
# Agent profile template with language injection
---
name: idumb-supreme-coordinator
mode: primary
temperature: 0.1
language: {{config.user.language.communication}}
description: Supreme coordinator for iDumb governance
---

{{#if config.user.language.communication == 'vietnamese'}}
⚡ GIAO THỨ CỦA iDUMB ⚡

Bạn là: idumb-supreme-coordinator (Điều phối viên tối cao)

🚫 QUY TẮC KHÔNG ĐƯỢC VƯỢT QUA TẮC:
1. KHÔNG BAO GIỜ THỰC! Chỉ ủy quyền, không tự thực thi
2. LUÔN đọc state trước khi hành động (dùng idumb-state)
3. PHẢI điều phối xuống mức thấp hơn (high-governance, executor)

Cách hoạt động:
- Tác vụ xử lý → @idumb-high-governance
- Tác vụ xác thực → @idumb-low-validator
- Tác vụ thực thi → @idumb-builder

{{else}}
⚡ IDUMB GOVERNANCE PROTOCOL ⚡

You are: idumb-supreme-coordinator (Supreme Coordinator)

🚫 ABSOLUTE RULES:
1. NEVER execute directly! Always delegate
2. ALWAYS read state first with idumb-state
3. Delegate to lower levels: high-governance, executor

Workflow:
- Research tasks → @idumb-high-governance
- Validation → @idumb-low-validator
- Execution → @idumb-builder

{{/if}}

Current Phase: {{config.governance.phase}}
Language: {{config.user.language.communication}}
```

---

## 7. Governance Levels

### 7.1 Level Definitions

| Level | Validation | Incremental | Global/Local | Use Case |
|-------|------------|------------|--------------|----------|
| **Efficient** | Unit + Integration + Node | ❌ No | ❌ No | Quick projects, trusted code |
| **Strict** | All above | ✓ Yes | ❌ No | Standard development |
| **Intelligent** | All above | ✓ Yes | ✓ Yes | Critical systems, high reliability |

### 7.2 Implementation in Agents

```typescript
// Inject governance level behavior
function getValidationBehavior(config: IdumbConfig): ValidationBehavior {
  switch (config.governance.level) {
    case 'efficient':
      return {
        modes: ['unit', 'integration', 'node'],
        incremental: false,
        globalAssessment: false,
        localAssessment: false,
        stopOnFirstFail: false,
        parallelValidation: true
      };

    case 'strict':
      return {
        modes: ['unit', 'integration', 'node', 'security'],
        incremental: true,
        globalAssessment: false,
        localAssessment: false,
        stopOnFirstFail: false,
        parallelValidation: false
      };

    case 'intelligent':
      return {
        modes: ['unit', 'integration', 'node', 'security', 'performance'],
        incremental: true,
        globalAssessment: true,
        localAssessment: true,
        stopOnFirstFail: false,
        parallelValidation: true,
        adaptiveThreshold: true
      };
  }
}
```

---

## 8. Git Integration

### 8.1 Atomic Commit Strategy

```typescript
// Commit message generation
function generateCommitMetadata(action: string, context: any): CommitMetadata {
  return {
    type: getCommitType(action),
    scope: getCommitScope(context),
    subject: getCommitSubject(action, context),
    body: getCommitBody(action, context),
    footers: {
      'Related': getRelatedArtifacts(context),
      'State': getStateReference(),
      'Validation': getValidationStatus(),
      'Session': getSessionId()
    }
  };
}

// Example output
feat(phase-02): implement JWT authentication

- Add JWT generation utility
- Add token validation middleware
- Add refresh endpoint
- Update tests

Related: .idumb/project-output/phases/phase-02-auth/PLAN.md
State: phase="02"
Validation: PASSED (2026-02-04T12:00:00Z)
Session: ses_abc123
```

### 8.2 Checkpoint System

```bash
# Create checkpoint
git tag checkpoint-20260204-phase02-task3

# Store in state
echo '{"lastCheckpoint": "checkpoint-20260204-phase02-task3"}' >> .idumb/brain/state.json

# Git commit with metadata
git commit -m "chore(checkpoint): checkpoint after task-003

Tag: checkpoint-20260204-phase02-task3
State: updated
Phase: 02
Task: 003
"
```

---

## 9. Implementation Roadmap

### 9.1 Sprint 1 (Week 1-2) - Critical Foundation

| Task | Days | Dependencies | Deliverable |
|------|------|--------------|------------|
| 1.1 Enhance init wizard with all prompts | 4 | None | Interactive configuration flow |
| 1.2 Implement language enforcement | 2 | None | Agents use configured language |
| 1.3 Add config value enforcement | 3 | 1.2 | Config values actually work |
| 1.4 Re-enable granular permission blocking | 5 | 1.3 | Permissions actually enforced |

### 9.2 Sprint 2 (Week 3) - Intelligence Features

| Task | Days | Dependencies | Deliverable |
|------|------|--------------|------------|
| 2.1 Codebase scanning workflow | 5 | None | Intelligent project analysis |
| 2.2 MCP server integration | 3 | None | Research server setup |
| 2.3 Git integration hooks | 4 | None | Atomic commit system |
| 2.4 Validation result consumption | 3 | 2.1 | Validation affects behavior |

### 9.3 Sprint 3 (Week 4) - Polish & Documentation

| Task | Days | Dependencies | Deliverable |
|------|------|--------------|------------|
| 3.1 Folder structure migration | 3 | None | New directory structure |
| 3.2 Frontmatter schema implementation | 3 | 3.1 | Artifact metadata system |
| 3.3 Documentation updates | 4 | All | Complete, accurate docs |
| 3.4 Non-interactive mode | 2 | None | Flags for automation |

---

## 10. Validation Criteria

### 10.1 Acceptance Criteria

| Criterion | Test | Success |
|----------|-----|--------|
| **AC-1** | Run `/idumb:init` in Vietnamese | All UI in Vietnamese |
| **AC-2** | Select "retard" experience | Strict guardrails active |
| **AC-3** | Select "strict" governance | Incremental validation on |
| **AC-4** | Coordinator tries to write | Operation blocked |
| **AC-5** | Builder tries to write | Operation succeeds |
| **AC-6** | Validation fails | Blocks with remediation |
| **AC-7** | Config changes | Agents adapt behavior |
| **AC-8** | Git commit created | Has proper metadata |

### 10.2 Test Plan

```yaml
Test Suite: iDumb Init Transformation

TC-LANG-01: Vietnamese Language Mode
  Given: User selects Vietnamese during init
  When: Agent responds to user message
  Then: Response is in Vietnamese

TC-CONFIG-01: Retard Mode Guardrails
  Given: User selects "retard" experience
  When: User tries dangerous operation
  Then: Operation blocked with explanation

TC-CONFIG-02: Strict Governance Validation
  Given: User selects "strict" governance
  When: Code execution happens
  Then: Incremental validation runs

TC-PERM-01: Coordinator Cannot Write
  Given: Coordinator agent active
  When: Write operation attempted
  Then: Blocked with delegation suggestion

TC-PERM-02: Builder Can Write
  Given: Builder agent active
  When: Write operation attempted
  Then: Operation succeeds

TC-SCAN-01: Codebase Analysis
  Given: Project has legacy docs
  When: Init command runs
  Then: Archives suggested, not deleted

TC-GIT-01: Atomic Commits
  Given: Work completed
  When: Git commit created
  Then: Contains all metadata footers
```

---

## Appendix A: File Changes Summary

### New Files Created

1. `.idumb/brain/config.json` - Enhanced configuration schema
2. `.idumb/brain/schema.json` - Configuration validation schema
3. `.plugin-dev/research/GOVERNANCE-CONFIG-SYSTEM-2026-02-04.md` - Config specification
4. `.plugin-dev/research/PHASE-1-VALIDATION-GAP-ANALYSIS-2026-02-04.md` - Gap analysis

### Files Modified

1. `bin/install.js` - Enhanced with configuration wizard
2. `src/plugins/idumb-core.ts` - Re-enable selective blocking
3. All agent profiles - Add language enforcement
4. `CLAUDE.md` - Update with new structure

### Files Removed

1. `.planning/` (migrated to `.idumb/project-output/planning/`)
2. Old config.json format (migrated to new schema)

---

## Appendix B: Command Reference

### New Init Command Options

```bash
# Interactive mode (default)
npm run install:local

# Non-interactive with defaults
npm run install:local --non-interactive

# Full configuration
npm run install:local \
  --language=vietnamese \
  --experience=new \
  --governance=intelligent \
  --ai-mode=default \
  --research-servers=context7,tavily,deepwiki \
  --scan-codebase \
  --max-delegation-depth=5

# Fresh start (clear existing)
npm run install:local --fresh

# Help
npm run install:local --help
```

### Post-Init Commands

```bash
/idumb:status        # Show governance status
/idumb:config        # View/edit configuration
/idumb:map-codebase  # Analyze codebase deeply
/idumb:roadmap      # Generate project roadmap
```

---

**Document Status:** ✅ Complete Specification
**Version:** 1.0.0
**Ready for:** Implementation
**Estimated Effort:** 15 working days (3 sprints)

---

*This specification synthesizes all research, gap analysis, and user requirements into a single actionable document. It is the blueprint for transforming iDumb's init command from a basic installer into an intelligent, trustworthy gateway to AI governance.*
