#!/bin/bash
# Scan bash scripts for injection vulnerabilities
# Usage: ./validate-bash.sh <file>

set -euo pipefail

validate_bash_file() {
    local file="$1"
    local issues=0

    echo "Validating: $file"

    # Check for unsafe variable interpolation in file paths
    if grep -qE 'FILE="[^"]*\$\{[^}]+\}[^"]*"' "$file"; then
        echo "  CRITICAL: Unsafe file path with variable interpolation"
        ((issues++))
    fi

    # Check for unquoted variables in command contexts
    if grep -qE '(mkdir|cp|mv|rm|cat|touch)\s+\$\{' "$file"; then
        echo "  CRITICAL: Unquoted variable in command"
        ((issues++))
    fi

    # Check for eval with variables
    if grep -qE 'eval\s.*\$' "$file"; then
        echo "  CRITICAL: eval with variable content"
        ((issues++))
    fi

    # Check for source with variables
    if grep -qE '(source|\.)\s+.*\$\{' "$file"; then
        echo "  CRITICAL: source with variable path"
        ((issues++))
    fi

    if [[ $issues -eq 0 ]]; then
        echo "  PASS: No vulnerabilities detected"
    fi

    return $issues
}

# If file argument provided, validate it
if [[ $# -gt 0 ]]; then
    validate_bash_file "$1"
else
    echo "Usage: $0 <file>"
    exit 1
fi
