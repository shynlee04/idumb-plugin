---
description: "Initialize a new iDumb-governed project with full governance structure"
id: cmd-new-project
parent: commands-idumb
agent: idumb-supreme-coordinator
---

# /idumb:new-project

Initialize a new iDumb-governed project with full governance structure.

## Usage

```
/idumb:new-project [project-name] [--framework=planning|bmad|custom] [--template=web|api|library|cli]
```

## Description

Creates a complete iDumb project structure including:
- `.idumb/` directory with brain, governance, and context subdirectories
- `config.json` with user preferences and hierarchy settings
- `state.json` with initial project state
- Project-specific templates based on selected framework
- Git hooks for interception (optional)

## Workflow

```yaml
steps:
  1_validate:
    action: Check if .idumb/ already exists
    on_conflict: Prompt for overwrite or abort
    
  2_create_structure:
    action: Create .idumb/ directory hierarchy
    paths:
      - .idumb/idumb-brain/
      - .idumb/idumb-brain/history/
      - .idumb/idumb-brain/context/
      - .idumb/idumb-brain/governance/
      - .idumb/idumb-brain/governance/validations/
      - .idumb/idumb-brain/anchors/
      - .idumb/idumb-brain/sessions/
      
  3_initialize_config:
    action: Create config.json with defaults
    tool: idumb-config:init
    
  4_initialize_state:
    action: Create state.json with initial values
    tool: idumb-state:write
    values:
      version: "0.1.0"
      initialized: "<timestamp>"
      framework: "<selected>"
      phase: "init"
      
  5_detect_existing:
    action: Check for existing frameworks
    checks:
      - .planning/ (planning artifacts)
      - PROJECT.md (BMAD)
      - package.json (Node)
      - Cargo.toml (Rust)
      - go.mod (Go)
      
  6_create_templates:
    action: Generate framework-specific templates
    based_on: selected_framework
    
  7_report:
    action: Display initialization summary
```

## Arguments

| Argument | Description | Default |
|----------|-------------|---------|
| `project-name` | Name of the project | Current directory name |
| `--framework` | Governance framework | `custom` |
| `--template` | Project template | `web` |
| `--skip-git` | Skip git hooks | `false` |

## Examples

```bash
# Initialize with planning framework
/idumb:new-project my-app --framework=planning

# Initialize library project
/idumb:new-project my-lib --template=library --framework=custom

# Initialize with custom settings
/idumb:new-project --framework=bmad --template=api
```

## Output

On success, displays:
```
✓ iDumb project initialized
  Project: <name>
  Framework: <framework>
  Location: <path>/.idumb/
  
  Next steps:
  1. /idumb:research - Research project requirements
  2. /idumb:roadmap - Create project roadmap
```

## Error Handling

| Error | Cause | Resolution |
|-------|-------|------------|
| `E001` | .idumb/ already exists | Use --force to overwrite or choose different directory |
| `E002` | Permission denied | Check directory write permissions |
| `E003` | Invalid framework | Use: planning, bmad, or custom |

## Related Commands

- `/idumb:init` - Initialize iDumb in existing project
- `/idumb:status` - Check project status
- `/idumb:research` - Begin research phase

## Governance

**Delegation Chain:**
```
user → supreme-coordinator → high-governance → builder
```

**Validation Points:**
- Pre: Check directory permissions
- Post: Verify all files created
- Post: Validate JSON syntax

## Metadata

```yaml
category: project-lifecycle
priority: P0
complexity: medium
version: 0.1.0
```
