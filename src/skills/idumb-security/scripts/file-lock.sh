#!/bin/bash
# Atomic write with file locking to prevent race conditions
# Usage: ./file-lock.sh <target-file> <content>

set -euo pipefail

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
        echo "ERROR: Could not acquire lock for $target_file" >&2
        return 1
    fi

    # Create lock file
    touch "$lock_file"

    # Write to temp file
    if ! echo "$content" > "$temp_file"; then
        rm -f "$lock_file" "$temp_file"
        return 1
    fi

    # Atomic move
    if ! mv "$temp_file" "$target_file"; then
        rm -f "$lock_file" "$temp_file"
        return 1
    fi

    # Release lock
    rm -f "$lock_file"
    return 0
}

if [[ $# -ge 2 ]]; then
    atomic_write "$1" "$2"
else
    echo "Usage: $0 <target-file> <content>"
    exit 1
fi
