---
name: idumb-security
description: "SECURITY package for iDumb framework - validates bash scripts against injection vulnerabilities, enforces path sanitization, prevents permission bypass, and detects information disclosure patterns. Use when: creating bash scripts, validating file operations, checking agent permissions, scanning for secrets, or preventing race conditions."
version: 1.0.0
license: MIT
metadata:
  audience: ai-agents
  workflow: security-validation
  package: SECURITY
  activation: coordinator-driven
  modes:
    - pre-commit: "Before any file write operations"
    - pre-delegate: "Before agent spawning"
    - continuous: "Background security monitoring"
---

# iDumb Security Skill (SECURITY Package)

<purpose>
I am the SECURITY validation skill that protects the iDumb framework and user projects from security vulnerabilities. I validate bash scripts, sanitize file paths, enforce permission boundaries, and prevent information disclosure.
</purpose>

<philosophy>
## Core Principles

1. **Security First**: Every operation validated before execution
2. **Zero Trust**: All inputs considered malicious until proven safe
3. **Fail-Safe**: Security violations block execution or escalate immediately
4. **Evidence-Based**: Every security claim backed by proof
5. **Defense in Depth**: Multiple validation layers at different boundaries
</philosophy>

---

## Security Categories

<security_category name="bash-injection">
### Bash Script Injection Prevention

**Critical Vulnerability**: Unsafe variable interpolation in bash scripts

#### Detection Rules

```yaml
bash_injection_patterns:
  unsafe_variable_interpolation:
    pattern: 'CERT_FILE=".*\$\{[^}]\}[^"]*"'
    risk: "Command injection if variable contains malicious input"
    severity: "CRITICAL"
    fix: "Quote all variable expansions: \"\${VAR}\""

  unsafe_command_substitution:
    pattern: '\$\(.*\$\{[^}]\}.*\)'
    risk: "Command injection through nested substitution"
    severity: "CRITICAL"
    fix: "Validate input before substitution"

  unsafe_eval:
    pattern: 'eval\s.*\$\{'
    risk: "Arbitrary code execution"
    severity: "CRITICAL"
    fix: "Never use eval with variable input"
```

#### Safe Patterns

```yaml
safe_bash_patterns:
  file_paths:
    safe: 'CERT_FILE=".idumb/brain/governance/certificate-\${TIMESTAMP}.json"'
    reason: "Variable at end, quoted, TIMESTAMP generated internally"

    unsafe: 'CERT_FILE="${USER_INPUT}/${FILE_NAME}"'
    fix: 'CERT_FILE=".idumb/brain/governance/$(basename "${USER_INPUT}")"'

  command_execution:
    safe: 'mkdir -p ".idumb/brain/governance"'
    reason: "Static path, no variables"
```
</security_category>

<security_category name="path-traversal">
### Path Traversal Prevention

**Critical Vulnerability**: User input not sanitized when constructing file paths

#### Detection Rules

```yaml
path_traversal_patterns:
  dot_dot_slash:
    pattern: '\.\./'
    risk: "Directory traversal attack"
    severity: "CRITICAL"

  absolute_path_breakout:
    pattern: '^/'
    risk: "Absolute path escapes project root"
    severity: "HIGH"

  null_byte_injection:
    pattern: '\0'
    risk: "Null byte truncation attack"
    severity: "CRITICAL"
```

#### Sanitization Function

```bash
# Reference: scripts/sanitize-path.sh
sanitize_path() {
    local input="$1"
    local output

    # Remove null bytes
    output="${input//\0/}"

    # Remove ../ sequences
    output="${output//..\//}"

    # Remove leading ../
    output="${output#\.\./}"

    # Remove any remaining .. at start
    output="${output#\.\.}"

    # Ensure path starts under project root
    if [[ "$output" == /* ]]; then
        output=".idumb/${output#/}"
    fi

    echo "$output"
    return 0
}
```
</security_category>

<security_category name="permission-bypass">
### Permission Bypass Prevention

**Critical Vulnerability**: Self-healing modifies files without permission validation

#### Detection Rules

```yaml
permission_bypass_patterns:
  self_healing_write:
    pattern: 'auto_fix.*write.*file'
    risk: "Self-healing bypasses permission matrix"
    severity: "HIGH"
    check: "Does auto-fix validate against permission matrix?"

  coordinator_write:
    pattern: 'coordinator.*write:.*true'
    risk: "Coordinator has write permission"
    severity: "CRITICAL"
```

#### Permission Matrix Validation

```yaml
permission_matrix_rules:
  coordinators:
    write: "deny"
    edit: "deny"
    bash: "deny"
    task: "allow"

  validators:
    write: "deny"
    edit: "deny"
    bash: "read-only"
    task: "deny"

  builders:
    write: "allow"
    edit: "allow"
    bash: "allow"
    task: "deny"
```
</security_category>

<security_category name="race-conditions">
### Race Condition Prevention

**Vulnerability**: Multiple validation processes run simultaneously

#### Prevention Mechanism

```bash
# Reference: scripts/file-lock.sh
# Atomic write with file locking
atomic_write() {
    local target_file="$1"
    local content="$2"
    local temp_file="${target_file}.tmp.$$"
    local lock_file="${target_file}.lock"
    local lock_timeout=5

    # Acquire lock with timeout
    local count=0
    while [[ -f "$lock_file" ]] && [[ $count -lt $lock_timeout ]]; do
        sleep 0.1
        ((count++))
    done

    if [[ -f "$lock_file" ]]; then
        echo "ERROR: Could not acquire lock for $target_file"
        return 1
    fi

    # Create lock file
    touch "$lock_file"

    # Write to temp file
    echo "$content" > "$temp_file" || {
        rm -f "$lock_file" "$temp_file"
        return 1
    }

    # Atomic move
    mv "$temp_file" "$target_file" || {
        rm -f "$lock_file" "$temp_file"
        return 1
    }

    # Release lock
    rm -f "$lock_file"
    return 0
}
```
</security_category>

---

## Security Validation Workflow

<validation_workflow>
### Phase 1: Pre-Write Validation

Before any file write operation:

```yaml
pre_write_checks:
  1_validate_bash:
      if: "file contains bash script"
      run: "security_validate_bash"
      block_on_fail: true

  2_sanitize_path:
      if: "file path contains variables"
      run: "sanitize_path"
      block_on_fail: true

  3_check_permissions:
      if: "agent writing to framework directory"
      run: "validate_permission_matrix"
      block_on_fail: true
```

### Phase 2: Agent Spawning Validation

Before delegating to another agent:

```yaml
pre_delegate_checks:
  1_validate_parent_child:
      check: "Parent is allowed to delegate to child"
      reference: "hierarchical-mindfulness skill"

  2_validate_operation:
      check: "Operation within agent's permission scope"
      reference: "idumb-governance skill"
```
</validation_workflow>

---

## Security Scripts

See **`scripts/`** directory for executable security validation scripts:

- **`validate-bash.sh`** - Scan bash scripts for injection vulnerabilities
- **`sanitize-path.sh`** - Sanitize file paths to prevent traversal
- **`validate-permissions.sh`** - Verify permission matrix compliance
- **`file-lock.sh`** - Atomic file operations to prevent race conditions

---

## Quick Reference

### Security Validation Commands

```bash
# Validate bash scripts
idumb-security validate-bash src/commands/idumb/*.md

# Sanitize a path
idumb-security sanitize-path "$USER_INPUT"

# Check permission matrix
idumb-security validate-permissions

# Full security scan
idumb-security scan
```

### Integration Points

```yaml
reads_from:
  - "src/commands/idumb/*.md" (bash blocks)
  - ".opencode/agents/idumb-*.md" (permissions)
  - ".idumb/brain/state.json" (state)

writes_to:
  - ".idumb/brain/governance/security-reports/"

validates_against:
  - "Permission matrix rules"
  - "Bash security best practices"
  - "OWASP guidelines"

triggers:
  - "Before file write operations"
  - "Before agent delegation"
  - "On file modifications in src/"

triggered_by:
  - "idumb-meta-orchestrator (security validation mode)"
  - "Pre-commit hooks"
```

---

*Skill: idumb-security v1.0.0 - SECURITY Package*
