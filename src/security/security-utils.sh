#!/bin/bash

# Security utilities for iDumb framework
# This file provides common security functions for all iDumb commands

# Enable strict error handling
set -euo pipefail

# Security: Validate timestamp format
validate_timestamp() {
    local ts="$1"
    if [[ ! "$ts" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$ ]]; then
        echo "ERROR: Invalid timestamp format: $ts" >&2
        return 1
    fi
}

# Security: Sanitize file paths
sanitize_path() {
    local path="$1"
    # Remove dangerous characters
    path="${path//../}"
    path="${path//;/}"
    path="${path//&/}"
    path="${path//|/}"
    path="${path//`/}"
    path="${path//$/}"
    # Ensure path doesn't start with /
    path="${path#/}"
    # Remove any remaining dangerous patterns
    path="${path//..//}"
    path="${path//\//}"
    echo "$path"
}

# Security: Create safe directory path
safe_mkdir() {
    local dir="$1"
    dir=$(sanitize_path "$dir")
    if [[ "$dir" == *".."* ]] || [[ "$dir" == *"//"* ]] || [[ "$dir" == *"&"* ]]; then
        echo "ERROR: Unsafe directory path: $dir" >&2
        return 1
    fi
    mkdir -p "$dir"
}

# Security: Cross-platform date arithmetic
calculate_hours_old() {
    local last_validation="$1"
    # Use node for cross-platform date handling
    if command -v node &> /dev/null; then
        node -e "console.log(Math.floor((Date.now() - new Date('$last_validation').getTime()) / 3600000))" 2>/dev/null || echo 0
    elif command -v python3 &> /dev/null; then
        python3 -c "import datetime; print(int((datetime.datetime.utcnow() - datetime.datetime.fromisoformat('$last_validation'.replace('Z', '+00:00'))).total_seconds() / 3600))" 2>/dev/null || echo 0
    else
        # Fallback: assume very old if can't calculate
        echo 999
    fi
}

# Security: Validate permission changes before auto-fixing
validate_permission_change() {
    local agent_file="$1"
    local change="$2"
    
    # Check if agent exists
    if [ ! -f "$agent_file" ]; then
        echo "ERROR: Agent file not found: $agent_file" >&2
        return 1
    fi
    
    # Check if change is safe
    case "$change" in
        "task: deny")
            # Safe to add task: deny to leaf nodes
            return 0
            ;;
        "write: deny")
            # Safe to change write: allow to write: deny in coordinators
            if [[ "$agent_file" == *"coordinator"* ]] || [[ "$agent_file" == *"governance"* ]]; then
                return 0
            else
                echo "ERROR: Cannot remove write permission from non-coordinator: $agent_file" >&2
                return 1
            fi
            ;;
        *)
            echo "ERROR: Unknown permission change: $change" >&2
            return 1
            ;;
    esac
}

# Security: Atomic file write with validation
atomic_write() {
    local content="$1"
    local target_file="$2"
    
    # Sanitize target file path
    target_file=$(sanitize_path "$target_file")
    
    # Create directory if needed
    local dir=$(dirname "$target_file")
    safe_mkdir "$dir"
    
    # Create temporary file
    local temp_file="${target_file}.tmp.$$"
    
    # Write content to temp file
    echo "$content" > "$temp_file"
    
    # Validate JSON if it looks like JSON
    if echo "$content" | head -1 | grep -q "^{"; then
        if ! jq . "$temp_file" > /dev/null 2>&1; then
            echo "ERROR: Invalid JSON generated" >&2
            rm -f "$temp_file"
            return 1
        fi
    fi
    
    # Atomic move
    mv "$temp_file" "$target_file"
}

# Security: Validate mode parameter
validate_mode() {
    local mode="$1"
    local valid_modes=("auto" "micro" "batch" "full" "basic" "standard" "strict")
    
    for valid_mode in "${valid_modes[@]}"; do
        if [ "$mode" = "$valid_mode" ]; then
            return 0
        fi
    done
    
    echo "ERROR: Invalid mode: $mode" >&2
    return 1
}

# Security: Check for file locking to prevent race conditions
acquire_lock() {
    local lock_file="$1"
    local timeout="${2:-30}"
    
    # Try to acquire lock with timeout
    if command -v flock &> /dev/null; then
        # Use flock if available
        exec 200>"$lock_file"
        if flock -x -w "$timeout" 200; then
            return 0
        else
            echo "ERROR: Could not acquire lock within ${timeout}s" >&2
            return 1
        fi
    else
        # Fallback: simple lock file with timeout
        local count=0
        while [ -f "$lock_file" ] && [ $count -lt $timeout ]; do
            sleep 1
            ((count++))
        done
        
        if [ -f "$lock_file" ]; then
            echo "ERROR: Could not acquire lock within ${timeout}s" >&2
            return 1
        fi
        
        echo $$ > "$lock_file"
        return 0
    fi
}

# Security: Release file lock
release_lock() {
    local lock_file="$1"
    
    if command -v flock &> /dev/null; then
        # flock releases automatically when file descriptor closes
        :
    else
        # Remove simple lock file
        rm -f "$lock_file"
    fi
}

# Security: Validate JSON file
validate_json_file() {
    local file="$1"
    
    if [ ! -f "$file" ]; then
        echo "ERROR: File not found: $file" >&2
        return 1
    fi
    
    if ! jq . "$file" > /dev/null 2>&1; then
        echo "ERROR: Invalid JSON in file: $file" >&2
        return 1
    fi
    
    return 0
}

# Security: Safe file operations wrapper
safe_file_operation() {
    local operation="$1"
    shift
    local args=("$@")
    
    case "$operation" in
        "read")
            # Validate file exists and is readable
            local file="${args[0]}"
            if [ ! -f "$file" ]; then
                echo "ERROR: File not found: $file" >&2
                return 1
            fi
            if [ ! -r "$file" ]; then
                echo "ERROR: File not readable: $file" >&2
                return 1
            fi
            ;;
        "write")
            # Use atomic write
            local content="${args[0]}"
            local target="${args[1]}"
            atomic_write "$content" "$target"
            return $?
            ;;
        *)
            echo "ERROR: Unknown file operation: $operation" >&2
            return 1
            ;;
    esac
}

# Export all functions for use in other scripts
export -f validate_timestamp sanitize_path safe_mkdir calculate_hours_old
export -f validate_permission_change atomic_write validate_mode
export -f acquire_lock release_lock validate_json_file safe_file_operation
