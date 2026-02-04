#!/bin/bash
# Sanitize file paths to prevent traversal attacks
# Usage: ./sanitize-path.sh <path>

set -euo pipefail

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

    # Prevent absolute paths
    if [[ "$output" == /* ]]; then
        output=".idumb/${output#/}"
    fi

    echo "$output"
}

if [[ $# -gt 0 ]]; then
    sanitize_path "$1"
else
    echo "Usage: $0 <path>"
    exit 1
fi
