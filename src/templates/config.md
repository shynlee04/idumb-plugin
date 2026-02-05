---
name: config-template
id: tpl-config
parent: templates
description: "Template for iDumb configuration schema"
type: template
version: 0.1.0
output_pattern: ".idumb/brain/config.json"
---

# Config Template

Defines the schema for `.idumb/brain/config.json` - user/project configuration for iDumb.

## JSON Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "iDumb Configuration",
  "type": "object",
  "properties": {
    "user": {
      "type": "object",
      "properties": {
        "name": { "type": "string" },
        "language": { "type": "string", "default": "en" },
        "timezone": { "type": "string" }
      }
    },
    "governance": {
      "type": "object",
      "properties": {
        "level": {
          "type": "string",
          "enum": ["strict", "normal", "relaxed"],
          "default": "normal"
        },
        "autoValidate": { "type": "boolean", "default": true },
        "autoCheckpoint": { "type": "boolean", "default": true },
        "stalenessWarningHours": { "type": "integer", "default": 48 }
      }
    },
    "integration": {
      "type": "object",
      "properties": {
        "planning": {
          "type": "object",
          "properties": {
            "enabled": { "type": "boolean", "default": true },
            "syncState": { "type": "boolean", "default": true }
          }
        },
        "git": {
          "type": "object",
          "properties": {
            "trackCommits": { "type": "boolean", "default": true },
            "requireCleanState": { "type": "boolean", "default": false }
          }
        }
      }
    },
    "paths": {
      "type": "object",
      "properties": {
        "planning": { "type": "string", "default": ".planning" },
        "idumb": { "type": "string", "default": ".idumb" },
        "archive": { "type": "string", "default": ".idumb/brain/archive" }
      }
    },
    "agents": {
      "type": "object",
      "properties": {
        "defaultTimeout": { "type": "integer", "default": 300 },
        "maxRetries": { "type": "integer", "default": 3 },
        "verboseLogging": { "type": "boolean", "default": false }
      }
    },
    "prompts": {
      "type": "object",
      "properties": {
        "sessionStart": { "type": "boolean", "default": true },
        "confirmDestructive": { "type": "boolean", "default": true },
        "showProgressHints": { "type": "boolean", "default": true }
      }
    }
  }
}
```

## Example Configuration

```json
{
  "user": {
    "name": "Developer",
    "language": "en",
    "timezone": "UTC"
  },
  "governance": {
    "level": "normal",
    "autoValidate": true,
    "autoCheckpoint": true,
    "stalenessWarningHours": 48
  },
  "integration": {
    "planning": {
      "enabled": true,
      "syncState": true
    },
    "git": {
      "trackCommits": true,
      "requireCleanState": false
    }
  },
  "paths": {
    "planning": ".planning",
    "idumb": ".idumb",
    "archive": ".idumb/brain/archive"
  },
  "agents": {
    "defaultTimeout": 300,
    "maxRetries": 3,
    "verboseLogging": false
  },
  "prompts": {
    "sessionStart": true,
    "confirmDestructive": true,
    "showProgressHints": true
  }
}
```

## Governance Levels

```yaml
governance_levels:
  strict:
    description: "Maximum enforcement, all checks required"
    settings:
      - autoValidate: true (cannot disable)
      - autoCheckpoint: true (cannot disable)
      - confirmDestructive: true (cannot disable)
      - chain enforcement: HARD_BLOCK only
      - skip conditions: disabled
      
  normal:
    description: "Balanced enforcement with flexibility"
    settings:
      - autoValidate: configurable
      - autoCheckpoint: configurable
      - confirmDestructive: true (default)
      - chain enforcement: HARD_BLOCK + SOFT_BLOCK
      - skip conditions: with --force flag
      
  relaxed:
    description: "Minimal enforcement, maximum speed"
    settings:
      - autoValidate: false (default)
      - autoCheckpoint: false (default)
      - confirmDestructive: false (default)
      - chain enforcement: WARN only
      - skip conditions: always available
```

## Planning Integration Settings

```yaml
planning_integration:
  enabled:
    true: "Full integration with .planning directory"
    false: "Standalone iDumb operation"
    
  syncState:
    true: "Keep .idumb state in sync with .planning"
    false: "Independent state tracking"
```

## Config Operations

```yaml
operations:
  read:
    tool: "idumb-config_read"
    params: [section]  # Optional, returns full if omitted
    
  update:
    tool: "idumb-config_update"
    params: [section, key, value]
    
  init:
    tool: "idumb-config_init"
    params: [userName, language, governanceLevel]
    
  sync:
    tool: "idumb-config_sync"
    description: "Sync with planning config if present"
    
  status:
    tool: "idumb-config_status"
    returns: "Current status at each hierarchy level"
```

## Merging with Planning Config

```yaml
merge_strategy:
  description: |
    When .planning/config.json exists, iDumb config
    merges with it. iDumb-specific settings take precedence.
    
  merge_rules:
    - Planning paths → use as-is
    - Project info → read-only
    - iDumb governance → override
    - iDumb agents → iDumb-only
    
  conflict_resolution:
    - Log conflict to history
    - Use iDumb value
    - Warn user of divergence
```

---
*Template: config v0.1.0*
