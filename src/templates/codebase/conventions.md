---
id: "template-codebase-conventions"
version: "0.1.0"
created: "2026-02-03"
purpose: "Document coding conventions, style guidelines, and patterns to follow"
consumed_by: ["idumb-codebase-mapper", "idumb-builder", "idumb-planner"]
produces: ".idumb/project-output/codebase/CONVENTIONS.md"
validation:
  required_fields: ["code_style", "patterns", "anti_patterns", "examples"]
  schema: "codebase-conventions-schema-v1"
---

# Codebase Conventions Template

## Purpose

Documents the coding conventions, style guidelines, design patterns, and anti-patterns observed in the codebase. This ensures consistency when making changes and helps AI agents match the existing code style.

## When to Use

- During `/idumb:map-codebase` workflow (after structure analysis)
- Before writing any new code
- When reviewing code for consistency
- When onboarding developers
- When establishing project standards

## Structure

```markdown
# Coding Conventions

> Generated: {iso_timestamp}
> Detected by: idumb-codebase-mapper
> Confidence: {high|medium|low}

## Code Style

### Formatting

| Aspect | Convention | Enforced By |
|--------|------------|-------------|
| Indentation | {spaces/tabs, count} | {tool} |
| Line Length | {max chars} | {tool} |
| Quotes | {single/double} | {tool} |
| Semicolons | {yes/no} | {tool} |
| Trailing Commas | {es5/all/none} | {tool} |

### Formatter Configuration
```{language}
// {config_file} contents
{config}
```

### Linter Rules
```{language}
// {eslint/prettier/etc config}
{rules}
```

## Naming Conventions

### Variables

| Context | Convention | Example | Anti-pattern |
|---------|------------|---------|--------------|
| Local variables | {convention} | `{example}` | `{bad}` |
| Constants | {convention} | `{example}` | `{bad}` |
| Private fields | {convention} | `{example}` | `{bad}` |
| Boolean vars | {convention} | `{example}` | `{bad}` |

### Functions

| Context | Convention | Example |
|---------|------------|---------|
| Regular functions | {convention} | `{example}` |
| Event handlers | {convention} | `{example}` |
| Async functions | {convention} | `{example}` |
| Factory functions | {convention} | `{example}` |

### Types/Interfaces

| Context | Convention | Example |
|---------|------------|---------|
| Interfaces | {convention} | `{example}` |
| Types | {convention} | `{example}` |
| Enums | {convention} | `{example}` |
| Generics | {convention} | `{example}` |

## Code Patterns

### Preferred Patterns

#### Pattern: {Pattern Name}
**Use When:** {situation}

```{language}
// Good - follows pattern
{good_code_example}
```

**Why:** {explanation}

#### Pattern: {Pattern Name 2}
**Use When:** {situation}

```{language}
{good_code_example}
```

### Framework Patterns

#### {Framework} Specific

| Pattern | Usage | Example |
|---------|-------|---------|
| {pattern} | {when} | `{code}` |

## Anti-Patterns

### Avoid: {Anti-pattern Name}

```{language}
// BAD - don't do this
{bad_code}

// GOOD - do this instead
{good_code}
```

**Why:** {explanation}

### Avoid: {Anti-pattern 2}

```{language}
// BAD
{bad_code}

// GOOD
{good_code}
```

## Import/Export Conventions

### Import Order
```{language}
// 1. {category}
{example}

// 2. {category}
{example}

// 3. {category}
{example}
```

### Export Style
- **Preferred:** {named/default/barrel}
- **Pattern:** {description}

```{language}
// Example
{code}
```

## Error Handling

### Pattern
```{language}
{error_handling_pattern}
```

### Error Types
| Type | When | Example |
|------|------|---------|
| {type} | {situation} | `{code}` |

## Async Patterns

### Preferred Style
```{language}
{async_pattern}
```

### Rules
- {rule 1}
- {rule 2}

## Comments & Documentation

### When to Comment
- {rule 1}
- {rule 2}

### JSDoc/Docstring Style
```{language}
{doc_comment_example}
```

## Testing Conventions

### Test Naming
```{language}
{test_naming_example}
```

### Test Structure
```{language}
{test_structure_pattern}
```

## Evidence

### Convention Sources
- `{config_file}` - {what it enforces}
- `{existing_code}` - {pattern observed}

### Enforcement
- **Pre-commit:** {hooks_if_any}
- **CI:** {ci_checks_if_any}
- **Editor:** {editor_config}
```

## Fields

| Field | Required | Description | Detection Method |
|-------|----------|-------------|------------------|
| code_style | Yes | Formatting rules | Config files, sample code |
| naming_conventions | Yes | How to name things | Code analysis |
| patterns | Yes | Preferred patterns | Repeated code patterns |
| anti_patterns | Yes | What to avoid | Comments, inconsistencies |
| import_conventions | No | Import ordering | Import sections analysis |
| error_handling | No | Error patterns | Try-catch usage |
| documentation | No | Comment style | JSDoc/docstring analysis |

## Example

```markdown
# Coding Conventions

> Generated: 2026-02-03T12:00:00.000Z
> Confidence: high

## Code Style

### Formatting

| Aspect | Convention | Enforced By |
|--------|------------|-------------|
| Indentation | 2 spaces | Prettier |
| Line Length | 100 chars | ESLint |
| Quotes | Single | Prettier |
| Semicolons | No | Prettier |
| Trailing Commas | ES5 | Prettier |

## Naming Conventions

### Variables

| Context | Convention | Example | Anti-pattern |
|---------|------------|---------|--------------|
| Local | camelCase | `userName` | `user_name` |
| Constants | SCREAMING_SNAKE | `MAX_RETRIES` | `maxRetries` |
| Boolean | is/has/can prefix | `isLoading` | `loading` |

## Code Patterns

### Pattern: Early Return
**Use When:** Validating inputs or conditions

```typescript
// Good
function process(data: Data | null) {
  if (!data) return null
  if (!data.isValid) return null
  
  return doWork(data)
}
```

## Anti-Patterns

### Avoid: Nested Ternaries

```typescript
// BAD
const result = a ? b ? c : d : e

// GOOD
if (a && b) return c
if (a) return d
return e
```

## Import Order

```typescript
// 1. Node built-ins
import { readFile } from 'fs'

// 2. External packages
import React from 'react'

// 3. Internal aliases
import { Button } from '@/components'

// 4. Relative imports
import { helper } from './utils'
```
```

## Validation Checklist

- [ ] Code style documented (indentation, quotes, etc.)
- [ ] At least 3 naming conventions documented
- [ ] At least 2 preferred patterns with examples
- [ ] At least 2 anti-patterns with corrections
- [ ] Import/export conventions specified
- [ ] Examples show both good and bad code
- [ ] Convention sources cited (config files)
- [ ] Enforcement mechanisms noted

## Related Templates

- [structure.md](./structure.md) - File naming conventions
- [testing.md](./testing.md) - Test-specific conventions
- [architecture.md](./architecture.md) - Architecture patterns
- [stack.md](./stack.md) - Language/framework context

---
*Template: codebase-conventions v0.1.0*
