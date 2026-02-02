---
description: "View and edit iDumb configuration settings"
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

View and edit iDumb configuration settings.

## Usage

```
/idumb:config                    # Show all current settings
/idumb:config view               # Same as above
/idumb:config set <key> <value>  # Set a config value
/idumb:config experience <level> # Set experience: pro | guided | strict
/idumb:config language <type> <lang> # Set language: communication|documents <lang>
```

## Examples

```
/idumb:config                           # View all
/idumb:config experience pro            # Switch to pro mode
/idumb:config language communication vi # AI speaks Vietnamese
/idumb:config language documents en     # Artifacts in English
/idumb:config set user.name "John"      # Set user name
```

## Editable Settings

### User Preferences
| Key | Values | Description |
|-----|--------|-------------|
| user.name | string | How AI addresses you |
| user.experience | pro/guided/strict | Automation level |
| user.language.communication | en/vi/... | AI response language |
| user.language.documents | en/vi/... | Artifact language |

### Automation Control
| Key | Values | Description |
|-----|--------|-------------|
| automation.mode | autonomous/confirmRequired/manualOnly | Execution mode |
| automation.expertSkeptic | true/false | Critical thinking mode |
| automation.contextFirst | true/false | Always read context first |

### Enforcement
| Key | Values | Description |
|-----|--------|-------------|
| enforcement.blockOnMissingArtifacts | true/false | Strict mode |
| enforcement.requirePhaseAlignment | true/false | Check phase match |

## Workflow

1. Read current config using idumb-config_read
2. If setting value: use idumb-config_update with section/key/value
3. Show confirmation of change
4. If language changed: remind user to restart session for full effect

## Language Enforcement

When language settings are changed:
- communication: Changes how AI responds (takes effect on next message)
- documents: Changes artifact language (takes effect immediately on new artifacts)

Example:
- communication=vi, documents=en → AI nói tiếng Việt, but writes docs in English
