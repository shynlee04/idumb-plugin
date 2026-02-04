---
name: state-template
id: tpl-state
parent: templates
description: "Template for iDumb state documentation and schema"
type: template
version: 0.1.0
output_pattern: ".idumb/idumb-brain/state.json"
---

# State Template

Defines the schema for `.idumb/idumb-brain/state.json` - the central state store for iDumb governance.

## JSON Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "iDumb State",
  "type": "object",
  "required": ["version", "initialized", "phase"],
  "properties": {
    "version": {
      "type": "string",
      "description": "iDumb version",
      "pattern": "^\\d+\\.\\d+\\.\\d+$"
    },
    "initialized": {
      "type": "string",
      "format": "date-time",
      "description": "When iDumb was initialized"
    },
    "framework": {
      "type": "string",
      "enum": ["bmad", "agile", "custom", "none"],
      "description": "Detected project framework"
    },
    "phase": {
      "type": "string",
      "description": "Current phase identifier (e.g., '1/5 (Phase Name)')"
    },
    "phaseStatus": {
      "type": "string",
      "enum": ["not_started", "discussed", "planned", "executing", "executed", "verified", "complete"],
      "description": "Status within current phase"
    },
    "currentMilestone": {
      "type": "string",
      "description": "Current milestone identifier"
    },
    "completedPhases": {
      "type": "array",
      "items": { "type": "integer" },
      "description": "List of completed phase numbers"
    },
    "lastValidation": {
      "type": "string",
      "format": "date-time",
      "description": "Last validation timestamp"
    },
    "validationCount": {
      "type": "integer",
      "description": "Total validations performed"
    },
    "anchors": {
      "type": "array",
      "items": { "$ref": "#/definitions/anchor" },
      "description": "Context anchors for compaction survival"
    },
    "history": {
      "type": "array",
      "items": { "$ref": "#/definitions/historyEntry" },
      "description": "Action history log"
    }
  },
  "definitions": {
    "anchor": {
      "type": "object",
      "required": ["id", "created", "type", "content"],
      "properties": {
        "id": { "type": "string" },
        "created": { "type": "string", "format": "date-time" },
        "type": { 
          "type": "string",
          "enum": ["checkpoint", "decision", "constraint", "warning", "context"]
        },
        "content": { "type": "string" },
        "priority": {
          "type": "string",
          "enum": ["critical", "high", "normal", "low"]
        }
      }
    },
    "historyEntry": {
      "type": "object",
      "required": ["timestamp", "action", "result"],
      "properties": {
        "timestamp": { "type": "string", "format": "date-time" },
        "action": { "type": "string" },
        "agent": { "type": "string" },
        "result": { "type": "string" }
      }
    }
  }
}
```

## Example State

```json
{
  "version": "0.1.0",
  "initialized": "2026-02-03T10:00:00.000Z",
  "framework": "bmad",
  "phase": "2/5 (Implementation Core)",
  "phaseStatus": "executing",
  "currentMilestone": "MVP",
  "completedPhases": [1],
  "lastValidation": "2026-02-03T14:30:00.000Z",
  "validationCount": 5,
  "anchors": [
    {
      "id": "anchor-1234567890",
      "created": "2026-02-03T10:15:00.000Z",
      "type": "decision",
      "content": "Using TypeScript for all new code",
      "priority": "high"
    },
    {
      "id": "anchor-1234567891",
      "created": "2026-02-03T11:00:00.000Z",
      "type": "constraint",
      "content": "Must maintain backward compatibility with v0.x API",
      "priority": "critical"
    }
  ],
  "history": [
    {
      "timestamp": "2026-02-03T10:00:00.000Z",
      "action": "init",
      "agent": "idumb-supreme-coordinator",
      "result": "pass"
    },
    {
      "timestamp": "2026-02-03T10:30:00.000Z",
      "action": "discuss-phase:1:complete",
      "agent": "user",
      "result": "pass"
    }
  ]
}
```

## State Transitions

```yaml
phase_status_transitions:
  not_started:
    can_go_to: [discussed]
    triggered_by: "/idumb:discuss-phase"
    
  discussed:
    can_go_to: [planned, not_started]
    triggered_by: "/idumb:plan-phase"
    can_revert_to: not_started  # If discussion abandoned
    
  planned:
    can_go_to: [executing, discussed]
    triggered_by: "/idumb:execute-phase"
    can_revert_to: discussed  # If plan rejected
    
  executing:
    can_go_to: [executed, planned]
    triggered_by: "Execution completion"
    can_revert_to: planned  # If restart needed
    
  executed:
    can_go_to: [verified, executing]
    triggered_by: "/idumb:verify-work"
    can_revert_to: executing  # If issues found
    
  verified:
    can_go_to: [complete, executed]
    triggered_by: "workflows/transition.md"
    can_revert_to: executed  # If verification failed
    
  complete:
    can_go_to: []  # Terminal state for phase
    triggered_by: "Phase completion"
```

## State Operations

```yaml
operations:
  read:
    tool: "idumb-state_read"
    returns: "Full state JSON"
    
  write:
    tool: "idumb-state_write"
    params: [phase, framework, lastValidation, incrementValidation]
    
  add_anchor:
    tool: "idumb-state_anchor"
    params: [type, content, priority]
    
  add_history:
    tool: "idumb-state_history"
    params: [action, result]
    
  get_anchors:
    tool: "idumb-state_getAnchors"
    params: [priorityFilter]
    returns: "Formatted anchors for injection"
```

## Compaction Survival

```yaml
compaction:
  description: |
    When LLM context is compacted, critical state must survive.
    Anchors with priority 'critical' or 'high' are injected
    into the compressed context.
    
  injection_format: |
    ## Context Anchors (Preserved from compaction)
    
    {for anchor in high_priority_anchors}
    - **[{anchor.type}]** {anchor.content}
    {end}
    
    Current State: Phase {N}, Status: {status}
```

## Validation

```yaml
validation:
  tool: "idumb-validate_schema"
  checks:
    - "All required fields present"
    - "version matches semantic versioning"
    - "timestamps are valid ISO 8601"
    - "phaseStatus is valid enum value"
    - "anchors have required fields"
    - "history entries have required fields"
```

---
*Template: state v0.1.0*
