#!/bin/bash
# Verify permission matrix compliance
# Usage: ./validate-permissions.sh

set -euo pipefail

validate_agent_file() {
    local agent_file="$1"
    local agent_name=$(basename "$agent_file" .md)

    # Extract permissions
    local write=$(grep -A5 "permission:" "$agent_file" | grep "write:" | head -1)
    local task=$(grep -A5 "permission:" "$agent_file" | grep "task:" | head -1)

    local issues=0

    # Check coordinator rules
    if [[ "$agent_name" =~ (coordinator|governance) ]]; then
        if ! echo "$write" | grep -q "deny"; then
            echo "  FAIL: $agent_name should have write: deny"
            ((issues++))
        fi
    fi

    # Check builder rules
    if [[ "$agent_name" =~ builder ]]; then
        if ! echo "$task" | grep -q "deny"; then
            echo "  FAIL: $agent_name should have task: deny"
            ((issues++))
        fi
    fi

    return $issues
}

# Validate all agent files
echo "Validating permission matrix..."
for agent in .opencode/agents/idumb-*.md; do
    if [[ -f "$agent" ]]; then
        validate_agent_file "$agent"
    fi
done

echo "Permission validation complete"
