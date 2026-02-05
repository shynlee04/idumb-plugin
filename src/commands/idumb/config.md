---
description: "View and edit iDumb configuration settings"
id: cmd-config
parent: commands-idumb
mode: all
temperature: 0.1
permission:
  task:
    "*": allow
  edit: allow
  write: allow
tools:
  idumb-config: true
  idumb-config_update: true
  idumb-config_read: true
---

# /idumb:config

<objective>
View and modify iDumb configuration settings. Manage user preferences (name, experience level, language), automation controls (execution mode, expert-skeptic mode), and enforcement settings. Changes take effect immediately for new operations, with language changes applying to subsequent messages.
</objective>

<context>

## Usage

```bash
/idumb:config                              # Show all current settings
/idumb:config view                         # Same as above
/idumb:config set <section.key> <value>    # Set a config value
/idumb:config experience <level>           # Shortcut for experience setting
/idumb:config language <type> <lang>       # Shortcut for language setting
/idumb:config reset                        # Reset to defaults
```

## Arguments

| Command | Arguments | Description |
|---------|-----------|-------------|
| `view` | none | Display all configuration |
| `set` | `<key> <value>` | Set any config value |
| `experience` | `pro\|guided\|strict` | Set experience level |
| `language` | `<type> <lang>` | Set communication or document language |
| `reset` | `[section]` | Reset to defaults |

## Configuration Sections

| Section | Purpose |
|---------|---------|
| `user` | User preferences and personalization |
| `hierarchy` | Agent hierarchy and permissions |
| `automation` | Execution mode and behavior |
| `enforcement` | Strictness and blocking rules |

</context>

<process>

## Step 1: Parse Command

Determine the operation type.

```yaml
command_parsing:
  /idumb:config → view
  /idumb:config view → view
  /idumb:config set user.name "John" → set user.name "John"
  /idumb:config experience pro → set user.experience pro
  /idumb:config language communication vi → set user.language.communication vi
  /idumb:config reset → reset all
  /idumb:config reset user → reset user section
```

## Step 2: View Configuration (if view)

Read and display current configuration.

```
Use tool: idumb-config_read

Display all sections:
  - user
  - hierarchy
  - automation
  - enforcement
```

**Display Format:**
```yaml
# iDumb Configuration
# Path: .idumb/brain/config.json

user:
  name: "Developer"
  experience: guided
  language:
    communication: en
    documents: en

hierarchy:
  enforceChain: true
  agents:
    coordinator: idumb-supreme-coordinator
    governance: idumb-high-governance
    validator: idumb-low-validator
    builder: idumb-builder

automation:
  mode: confirmRequired
  expertSkeptic: false
  contextFirst: true

enforcement:
  blockOnMissingArtifacts: false
  requirePhaseAlignment: true
```

## Step 3: Validate New Value (if set)

Validate the value before applying.

```yaml
validation_rules:
  user.experience:
    type: enum
    allowed: [pro, guided, strict]
    
  user.language.communication:
    type: string
    pattern: "^[a-z]{2}$"
    examples: [en, vi, ja, ko, zh]
    
  user.language.documents:
    type: string
    pattern: "^[a-z]{2}$"
    
  automation.mode:
    type: enum
    allowed: [autonomous, confirmRequired, manualOnly]
    
  automation.expertSkeptic:
    type: boolean
    
  automation.contextFirst:
    type: boolean
    
  enforcement.blockOnMissingArtifacts:
    type: boolean
    
  enforcement.requirePhaseAlignment:
    type: boolean
```

## Step 4: Apply Configuration Change (if set)

Update the configuration file.

```
Use tool: idumb-config_update

section: <parsed section>
key: <parsed key>
value: <validated value>
```

**Example:**
```
For: /idumb:config set user.name "John Doe"

Use tool: idumb-config_update
  section: "user"
  key: "name"
  value: "John Doe"
```

## Step 5: Handle Special Cases

### Experience Level Change

```yaml
experience_levels:
  pro:
    description: "Minimal hand-holding, direct responses"
    automation.mode: autonomous
    enforcement.blockOnMissingArtifacts: false
    
  guided:
    description: "Balanced guidance and autonomy"
    automation.mode: confirmRequired
    enforcement.blockOnMissingArtifacts: false
    
  strict:
    description: "Maximum governance, explicit approvals"
    automation.mode: manualOnly
    enforcement.blockOnMissingArtifacts: true
```

### Language Change

```yaml
language_effects:
  communication:
    effect: "AI responds in this language"
    applies: "Next message onwards"
    note: "May require session restart for full effect"
    
  documents:
    effect: "Artifacts written in this language"
    applies: "Immediately for new artifacts"
    note: "Existing artifacts unchanged"
```

## Step 6: Confirm Change

Display confirmation and any side effects.

```
✓ Configuration updated

  Changed: user.experience
  From:    guided
  To:      pro

  Side effects:
  - automation.mode: confirmRequired → autonomous
  - Responses will be more direct

  Note: Changes take effect immediately.
```

## Step 7: Reset Configuration (if reset)

Reset to defaults.

```yaml
default_configuration:
  version: "0.2.0"
  user:
    name: "Developer"
    experience: guided
    language:
      communication: en
      documents: en
  hierarchy:
    enforceChain: true
    agents:
      coordinator: idumb-supreme-coordinator
      governance: idumb-high-governance
      validator: idumb-low-validator
      builder: idumb-builder
  automation:
    mode: confirmRequired
    expertSkeptic: false
    contextFirst: true
  enforcement:
    blockOnMissingArtifacts: false
    requirePhaseAlignment: true
```

</process>

<completion_format>

## View Output

```
┌─────────────────────────────────────────────────────────────────┐
│                    iDumb Configuration                          │
├─────────────────────────────────────────────────────────────────┤
│ User                                                            │
│ ├── name:         Developer                                     │
│ ├── experience:   guided                                        │
│ └── language:                                                   │
│     ├── communication: en                                       │
│     └── documents:     en                                       │
├─────────────────────────────────────────────────────────────────┤
│ Hierarchy                                                       │
│ ├── enforceChain: true                                          │
│ └── agents:                                                     │
│     ├── coordinator: idumb-supreme-coordinator                  │
│     ├── governance:  idumb-high-governance                      │
│     ├── validator:   idumb-low-validator                        │
│     └── builder:     idumb-builder                              │
├─────────────────────────────────────────────────────────────────┤
│ Automation                                                      │
│ ├── mode:          confirmRequired                              │
│ ├── expertSkeptic: false                                        │
│ └── contextFirst:  true                                         │
├─────────────────────────────────────────────────────────────────┤
│ Enforcement                                                     │
│ ├── blockOnMissingArtifacts: false                              │
│ └── requirePhaseAlignment:   true                               │
└─────────────────────────────────────────────────────────────────┘

To modify: /idumb:config set <key> <value>
Example:   /idumb:config experience pro
```

## Set Output

```
✓ Configuration updated

  Setting: user.experience
  Value:   pro (was: guided)

  Changes applied:
  ├── user.experience: pro
  └── automation.mode: autonomous (implied by pro)

  Effect: Responses will be more direct with less guidance.
```

## Reset Output

```
✓ Configuration reset to defaults

  Affected sections:
  ├── user: reset
  ├── hierarchy: reset
  ├── automation: reset
  └── enforcement: reset

  Note: All custom settings have been cleared.
```

## Error Output

```
✗ Configuration error

  Error:  Invalid value for user.experience
  Given:  "expert"
  Valid:  pro, guided, strict

  Usage: /idumb:config experience <pro|guided|strict>
```

</completion_format>

<success_criteria>

## Configuration Operation Checklist

### For View
- [ ] Config file read successfully
- [ ] All sections displayed
- [ ] Current values shown
- [ ] Help hint displayed

### For Set
- [ ] Key path validated
- [ ] Value type validated
- [ ] Value range validated (if enum)
- [ ] Config file updated
- [ ] Confirmation displayed
- [ ] Side effects noted

### For Reset
- [ ] Backup of current config (optional)
- [ ] Defaults applied
- [ ] Confirmation displayed

## Validation Rules

- [ ] Experience must be: pro, guided, strict
- [ ] Language must be 2-letter code
- [ ] Boolean values must be true/false
- [ ] Mode must be: autonomous, confirmRequired, manualOnly

## Error Handling

| Error | Cause | Resolution |
|-------|-------|------------|
| Invalid key | Key path doesn't exist | Check available keys with /idumb:config view |
| Invalid value | Value fails validation | Check allowed values |
| Permission denied | Config file not writable | Check file permissions |
| Config missing | config.json doesn't exist | Run /idumb:init |

</success_criteria>

## Editable Settings Reference

### User Preferences

| Key | Values | Description |
|-----|--------|-------------|
| `user.name` | string | How AI addresses you |
| `user.experience` | `pro\|guided\|strict` | Automation level |
| `user.language.communication` | `en\|vi\|...` | AI response language |
| `user.language.documents` | `en\|vi\|...` | Artifact language |

### Automation Control

| Key | Values | Description |
|-----|--------|-------------|
| `automation.mode` | `autonomous\|confirmRequired\|manualOnly` | Execution mode |
| `automation.expertSkeptic` | `true\|false` | Critical thinking mode |
| `automation.contextFirst` | `true\|false` | Always read context first |

### Enforcement

| Key | Values | Description |
|-----|--------|-------------|
| `enforcement.blockOnMissingArtifacts` | `true\|false` | Strict mode |
| `enforcement.requirePhaseAlignment` | `true\|false` | Check phase match |

## Related Commands

| Command | Purpose |
|---------|---------|
| `/idumb:status` | View current state |
| `/idumb:init` | Initialize config if missing |
| `/idumb:help` | Show all commands |

## Governance

**Note:** This command modifies config.json directly without full delegation chain since configuration is user-controlled preference data, not governed artifacts.

## Metadata

```yaml
category: configuration
priority: P1
complexity: low
state_modifying: true
version: 0.2.0
```
