---
description: Manage and switch output styles for iDumb agents
id: idumb:style
parent: idumb
agent: idumb-high-governance
---

# /idumb:style

<objective>
Manage output styles that control how iDumb agents format their responses.
</objective>

<execution_context>
- Agent: @idumb-high-governance (read/write state access)
- Trigger: User runs `/idumb:style [action] [args]`
- Scope: Session-wide style changes, persisted to state.json
</execution_context>

<context>

## Usage

```bash
/idumb:style             # List all available styles
/idumb:style <name>      # Switch to specified style
/idumb:style --info <name>  # Show style details
/idumb:style --reset     # Return to default style
```

## Arguments

| Argument | Type | Description |
|----------|------|-------------|
| (none) | - | List all styles, highlight current |
| `<name>` | string | Switch to specified style |
| `--info <name>` | string | Show style details |
| `--reset` | flag | Return to default style |

## Prerequisites

- `.idumb/` directory must exist (run `/idumb:init` first)
- Styles are stored in `.idumb/brain/styles/`

## Style File Format

Style files are markdown with YAML frontmatter:

```markdown
---
name: casual
description: Relaxed conversational tone
keep-coding-instructions: true
mode: global
compatibility: [idumb]
---

Use a casual, friendly tone. Be conversational.
```

</context>

<process>

## Step 1: Parse Arguments

Extract action from user input:
- No arguments → LIST action
- Style name → SET action
- `--info <name>` → INFO action
- `--reset` → RESET action

## Step 2: Execute Action

### LIST Action

1. Use `idumb-style_list` tool to get all available styles
2. Display formatted list with current style highlighted
3. Show style descriptions

### SET Action

1. Validate style name is provided
2. Use `idumb-style_set` tool with style name
3. Confirm change to user
4. Show style will take effect on next agent response

### INFO Action

1. Extract style name from `--info <name>`
2. Use `idumb-style_info` tool
3. Display full style details including:
   - Name and description
   - Mode and compatibility
   - Instructions preview

### RESET Action

1. Use `idumb-style_reset` tool
2. Confirm reset to default style
3. Explain default behavior

</process>

<completion_format>

## Success Response

**LIST:**
```
## Available Styles

→ **default** (current)
    Standard iDumb behavior

  **casual**
    Relaxed conversational tone

  **formal**
    Professional documentation style
```

**SET:**
```
✅ Style changed to: **casual**

Previous: default
```

**INFO:**
```
## Style: casual

**Description:** Relaxed conversational tone
**Mode:** global
**Keep Coding Instructions:** Yes
**Compatibility:** idumb

### Instructions Preview

Use a casual, friendly tone...
```

**RESET:**
```
✅ Style reset to **default**

Previous: casual
```

## Error Response

**Style not found:**
```
❌ Style not found: **unknown-style**

Available styles: default, casual, formal

Use `/idumb:style --info <name>` to see style details.
```

**Not initialized:**
```
❌ iDumb not initialized

Run `/idumb:init` to set up governance.
```

</completion_format>
