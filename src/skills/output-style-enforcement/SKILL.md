---
name: output-style-enforcement
description: Monitors agent responses for style compliance and provides correction hints
version: 1.0.0
license: MIT
metadata:
  audience: ai-agents
  workflow: style-enforcement
  package: STYLE
  activation: manual
---

# Output Style Enforcement Skill

## Purpose

Guide agents to follow their designated output styles through pattern-based detection and reminder injection. This skill provides reference documentation for AI behavior - actual enforcement happens in the plugin hooks.

## Scope

This skill applies to:
- All iDumb agents with `output-style:` configuration
- Global styles set via `/idumb:style` command
- Style anchors that survive compaction

## Detection Patterns

### 1. Section Compliance

Expected sections are defined in the agent's `output-style.sections[]` array.

**Detection Method:** Regex for heading patterns
```javascript
const sectionPattern = /^#{1,3}\s+(.+)$/gm
const headings = response.match(sectionPattern)
const missingCount = expectedSections.filter(s => 
  !headings?.some(h => h.toLowerCase().includes(s.toLowerCase()))
).length
```

**Threshold:** Trigger reminder if >50% expected sections missing

### 2. Length Compliance

Expected length categories:
- `concise`: <300 words
- `moderate`: 300-800 words  
- `comprehensive`: >800 words

**Detection Method:** Word count
```javascript
const wordCount = response.split(/\s+/).length
```

**Threshold:** Trigger if >2x or <0.5x expected

### 3. Format Elements

Check for expected format elements:
- `evidence-table` → Look for markdown table syntax `|---|`
- `code-highlights` → Look for code blocks ```
- `bullet-lists` → Look for `- ` or `* ` patterns

## Enforcement Actions

When deviation detected (in `experimental.chat.messages.transform`):

1. **Log deviation** to governance history
2. **Inject reminder** in next message transform
3. **Track pattern** for session flow anchor
4. **Never block** - reminders only

## Integration Points

### Works With
- `experimental.chat.system.transform` hook (style injection)
- `idumb-state_anchor` (deviation tracking)
- `idumb-orchestrator` (coordination)

### Does NOT
- Automatically load (skills are reference documents)
- Block responses (only remind)
- Perform semantic analysis (too expensive)

## Example Reminder

When deviation detected, add to next `messages.transform`:

```markdown
---
⚠️ **Style Deviation Detected**

Your designated style is **governance-report** which requires:
- ✅ status-header (found)
- ❌ evidence-table (missing)
- ❌ recommendations (missing)

Please include these sections in your response.
---
```

## Thresholds

| Check | Trigger Condition | Action |
|-------|-------------------|--------|
| Missing Sections | >50% expected missing | Reminder |
| Wrong Length | >2x or <0.5x expected | Reminder |
| Missing Format | Key format element absent | Soft reminder |
| Repeated Violation | 3+ in same session | Stronger reminder |

## Configuration

Style enforcement can be configured in `.idumb/idumb-brain/config.json`:

```json
{
  "style": {
    "enforcement": "reminder",
    "reminderFrequency": 3,
    "trackHistory": true
  }
}
```
