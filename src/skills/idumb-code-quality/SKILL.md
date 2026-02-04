---
name: idumb-code-quality
description: "CODE-QUALITY package for iDumb framework - enforces error handling standards, cross-platform compatibility, documentation completeness, and consistent error message formats. Use when: validating bash scripts, checking tool error handling, reviewing documentation coverage, or ensuring cross-platform compatibility."
version: 1.0.0
license: MIT
metadata:
  audience: ai-agents
  workflow: code-quality-validation
  package: CODE-QUALITY
  activation: coordinator-driven
  modes:
    - pre-commit: "Before committing code changes"
    - validation: "During code review"
    - continuous: "Background quality monitoring"
---

# iDumb Code Quality Skill (CODE-QUALITY Package)

<purpose>
I am the CODE-QUALITY validation skill that ensures all iDumb framework code meets professional standards for error handling, cross-platform compatibility, and documentation. I validate that every operation handles failures gracefully and works across different environments.
</purpose>

<philosophy>
## Core Principles

1. **Fail Gracefully**: Every operation must handle errors appropriately
2. **Platform Agnostic**: Code must work on macOS, Linux, and Windows (WSL)
3. **Document Everything**: Every function, tool, and command must be documented
4. **Consistent Messaging**: Error messages follow a standard format
5. **No Silent Failures**: All errors are logged and reported
</philosophy>

---

## Quality Categories

<quality_category name="error-handling">
### Error Handling Standards

**Issue**: Commands don't handle failures gracefully

#### Detection Rules

```yaml
error_handling_patterns:
  missing_error_check:
    pattern: 'jq\s+-r.*[^|&]$'
    risk: "jq failure causes variable to be empty/invalid"
    severity: "HIGH"
    fix: "Add '|| error_handler' after command"

  unset_variable_use:
    pattern: '\$\{[^}]+\}[^|]*$'
    risk: "Unset variable causes unexpected behavior"
    severity: "MEDIUM"
    fix: "Add ':-default' or check with 'test -n'"

  missing_directory_check:
    pattern: '(mkdir|cp|mv).*[^\s)]$'
    risk: "Operation fails if directory doesn't exist"
    severity: "MEDIUM"
    fix: "Add 'mkdir -p' or check with 'test -d'"
```

#### Required Error Handling Pattern

```bash
# Standard error handling pattern
#!/bin/bash
set -euo pipefail  # Exit on error, unset vars, pipe failures

# Error handler function
error_exit() {
    local msg="$1"
    local exit_code="${2:-1}"
    echo "ERROR: $msg" >&2
    exit "$exit_code"
}

# Usage with commands
COMMAND_RESULT=$(some_command) || error_exit "some_command failed: $?"

# With jq
LAST_VALIDATION=$(jq -r '.lastValidation // "1970-01-01T00:00:00Z"' .idumb/idumb-brain/state.json) || {
    echo "ERROR: Failed to read state.json" >&2
    exit 1
}

# Directory operations
mkdir -p .idumb/idumb-brain/governance || error_exit "Cannot create governance directory"
```

#### Validation Checklist

```yaml
error_handling_checklist:
  bash_scripts:
    - [ ] "set -euo pipefail" at top of script
    - [ ] All command substitutions have error handling
    - [ ] All file operations check for success
    - [ ] Error messages written to stderr
    - [ ] Meaningful exit codes

  typescript_tools:
    - [ ] All async functions have try-catch
    - [ ] All errors returned, not thrown
    - [ ] Error messages include context
    - [ ] No console.log (use log() function)
    - [ ] Input validation on all parameters
```
</quality_category>

<quality_category name="cross-platform">
### Cross-Platform Compatibility

**Issue**: State freshness calculation assumes GNU date

#### Detection Rules

```yaml
cross_platform_patterns:
  gnu_date_only:
    pattern: 'date\s+-d'
    risk: "Fails on macOS (BSD date)"
    severity: "HIGH"
    fix: "Use portable date arithmetic"

  gnu_sed_only:
    pattern: 'sed\s+-i'
    risk: "Different behavior on macOS/BSD"
    severity: "MEDIUM"
    fix: "Use portable sed -i '' or detect platform"

  gnu_grep_only:
    pattern: 'grep\s+-P'
    risk: "Not available on all systems"
    severity: "MEDIUM"
    fix: "Use extended regex -E or detect platform"

  linux_only_paths:
    pattern: '/proc/|/sys/'
    risk: "Linux-only filesystem paths"
    severity: "HIGH"
    fix: "Use portable alternatives or detect OS"
```

#### Portable Date Arithmetic

```bash
# Reference: scripts/portable-date.sh
# Cross-platform date calculation

# Detect date type
if date --version >/dev/null 2>&1; then
    # GNU date (Linux)
    date_calc() {
        date -d "$1" +%Y-%m-%d
    }
else
    # BSD date (macOS)
    date_calc() {
        date -j -f "%Y-%m-%d" "$1" +%Y-%m-%d
    }
fi

# Usage
TOMORROW=$(date_calc "now + 1 day")
```

#### Platform Detection

```bash
# Detect OS type
detect_os() {
    case "$(uname -s)" in
        Linux*)     echo "linux";;
        Darwin*)    echo "macos";;
        MINGW*|MSYS*|CYGWIN*) echo "windows";;
        *)          echo "unknown";;
    esac
}

OS_TYPE=$(detect_os)

# Use OS-specific commands
case "$OS_TYPE" in
    linux)
        SED_INPLACE="sed -i"
        ;;
    macos)
        SED_INPLACE="sed -i ''"
        ;;
    windows)
        SED_INPLACE="sed -i"
        ;;
esac

# Use in commands
$SED_INPLACE 's/foo/bar/' file.txt
```
</quality_category>

<quality_category name="documentation">
### Documentation Standards

**Issue**: TypeScript implementation examples lack proper error handling

#### Required Documentation

```yaml
documentation_requirements:
  every_function:
    - [ ] Purpose statement (what it does)
    - [ ] Parameter documentation (with types)
    - [ ] Return value documentation
    - [ ] Error conditions documented
    - [ ] Usage example

  every_tool:
    - [ ] Description (min 10 chars)
    - [ ] All args have schema or description
    - [ ] Execute function documented
    - [ ] Error handling documented

  every_agent:
    - [ ] Clear description of role
    - [ ] Permission level documented
    - [ ] Delegation patterns documented
    - [ ] Structured return format documented
```

#### Documentation Template

```typescript
/**
 * Tool description (min 10 characters)
 *
 * @param param1 - Description of parameter 1
 * @param param2 - Description of parameter 2
 * @returns JSON string with result
 * @throws {Error} When condition fails
 *
 * Example:
 * ```bash
 * tool-name param1="value" param2="value"
 * ```
 */
export const toolName = tool({
  description: "Clear description of what this tool does",
  args: {
    param1: {
      description: "Description of parameter 1",
      type: "string",
      required: true
    },
    param2: {
      description: "Description of parameter 2",
      type: "string",
      required: false
    }
  },
  async execute(args) {
    try {
      // Implementation
      return JSON.stringify({ success: true });
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error.message
      });
    }
  }
});
```
</quality_category>

<quality_category name="error-messages">
### Consistent Error Message Format

**Issue**: Inconsistent error message formats and verbosity levels

#### Standard Error Format

```yaml
error_message_standard:
  format: "[LEVEL]: [CONTEXT] - [MESSAGE] - [SUGGESTION]"

  levels:
    - ERROR: "Critical failure, operation blocked"
    - WARN: "Non-critical issue, operation continued"
    - INFO: "Informational message"

  components:
    context: "What operation was being performed"
    message: "What went wrong (specific details)"
    suggestion: "How to fix (when applicable)"
```

#### Examples

```bash
# Good error messages
echo "ERROR: Failed to read state.json - File not found - Run /idumb:init"
echo "WARN: Validation skipped - Timeout exceeded - Retry with longer timeout"
echo "INFO: Validation complete - 0 issues found"

# Bad error messages
echo "Failed"
echo "Error in state"
echo "Something went wrong"
```

#### Error Message Validation

```bash
# Reference: scripts/validate-error-messages.sh
validate_error_messages() {
    local file="$1"

    # Check for error messages without context
    if grep -E 'echo\s+"Error:|Failed' "$file" | grep -vqE ':.*-'; then
        echo "WARN: Error message lacks context or suggestion"
    fi

    # Check for console.log (should use log function)
    if grep -q 'console\.log' "$file"; then
        echo "ERROR: console.log found - use log() function instead"
    fi

    # Check for bare echo in error paths
    if grep -E 'echo\s+"\$' "$file" | grep -qE '(error|fail|Error)'; then
        echo "WARN: Uninformative error message"
    fi
}
```
</quality_category>

<quality_category name="code-duplication">
### Code Deduplication

**Issue**: Large amounts of duplicated validation logic

#### Detection Rules

```yaml
duplication_detection:
  similar_blocks:
    threshold: 10
    measure: "lines with >80% similarity"
    action: "Extract to shared function"

  repeated_patterns:
    - validation_check: "Should be in idumb-validate tool"
    - error_handler: "Should use common error handling function"
    - file_operations: "Should use common file operation wrappers"
```

#### Refactoring Guidelines

```yaml
when_to_extract:
  - "Same code appears 3+ times"
  - "Code block is >10 lines"
  - "Logic is reusable across tools/commands"

  extraction_target:
    scripts: "For pure bash utilities"
    tools: "For TypeScript operations used by agents"
    references: "For shared validation rules"
```
</quality_category>

---

## Quality Validation Workflow

<validation_workflow>
### Phase 1: Code Review Validation

Before code is committed:

```yaml
code_review_checks:
  error_handling:
    - "All commands have error checking"
    - "All async functions have try-catch"
    - "No bare 'echo' for errors"
    - "Exit codes are meaningful"

  cross_platform:
    - "No GNU-specific commands without fallback"
    - "Date arithmetic is portable"
    - "File paths use correct separators"

  documentation:
    - "All functions have docstrings"
    - "All tools have descriptions"
    - "Error cases are documented"
```

### Phase 2: Automated Testing

Run automated quality checks:

```bash
# Run all quality checks
idumb-code-quality check

# Check specific category
idumb-code-quality check --error-handling
idumb-code-quality check --cross-platform
idumb-code-quality check --documentation
```
</validation_workflow>

---

## Code Quality Scripts

See **`scripts/`** directory for executable quality validation scripts:

- **`validate-error-handling.sh`** - Check error handling patterns
- **`validate-cross-platform.sh`** - Detect platform-specific code
- **`validate-documentation.sh`** - Check documentation coverage
- **`validate-error-messages.sh`** - Check error message format
- **`detect-duplication.sh`** - Find duplicated code blocks

---

## Quick Reference

### Quality Validation Commands

```bash
# Validate error handling
idumb-code-quality check --error-handling src/

# Check cross-platform compatibility
idumb-code-quality check --cross-platform

# Validate documentation
idumb-code-quality check --docs

# Detect code duplication
idumb-code-quality check --duplication

# Full quality scan
idumb-code-quality scan
```

### Integration Points

```yaml
reads_from:
  - "src/tools/*.ts" (TypeScript tools)
  - "src/commands/idumb/*.md" (bash blocks)
  - "src/agents/idumb-*.md" (agent documentation)

writes_to:
  - ".idumb/idumb-brain/governance/quality-reports/"

validates_against:
  - "Error handling standards"
  - "Cross-platform compatibility requirements"
  - "Documentation standards"

triggers:
  - "Before code commits"
  - "After code modifications"
  - "During code review"

triggered_by:
  - "idumb-meta-orchestrator (quality validation mode)"
  - "Pre-commit hooks"
```

---

*Skill: idumb-code-quality v1.0.0 - CODE-QUALITY Package*
