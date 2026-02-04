#!/bin/bash

# Standardized integration point counting for iDumb framework
# This provides consistent integration point counting across all commands

# Standardized patterns for integration points
AGENT_PATTERNS=(
    "idumb-[a-z-]+"      # Agent references
    "/idumb:[a-z-]+"     # Command references  
    "\.json"             # JSON file references
    "\.md"               # Markdown file references
    "state\|config"      # State/config references
    "read\|write"        # Tool operations
    "parent:"            # Parent references
    "agent:"             # Agent bindings
    "workflow:"          # Workflow references
    "tool:"              # Tool references
)

COMMAND_PATTERNS=(
    "idumb-[a-z-]+"      # Agent references
    "/idumb:[a-z-]+"     # Command references
    "\.json"             # JSON file references
    "\.md"               # Markdown file references
    "state\|config"      # State/config references
    "agent:"             # Agent bindings
    "workflow:"          # Workflow references
    "tool:"              # Tool references
)

WORKFLOW_PATTERNS=(
    "idumb-[a-z-]+"      # Agent references
    "/idumb:[a-z-]+"     # Command references
    "\.json"             # JSON file references
    "\.md"               # Markdown file references
    "state\|config"      # State/config references
    "agent:"             # Agent references
    "workflow:"          # Workflow references
    "tool:"              # Tool references
)

# Count integration points in a file
count_integration_points() {
    local file="$1"
    local file_type="$2"
    local total=0
    
    if [ ! -f "$file" ]; then
        echo "ERROR: File not found: $file" >&2
        return 1
    fi
    
    # Select patterns based on file type
    local patterns=()
    case "$file_type" in
        "agent")
            patterns=("${AGENT_PATTERNS[@]}")
            ;;
        "command")
            patterns=("${COMMAND_PATTERNS[@]}")
            ;;
        "workflow")
            patterns=("${WORKFLOW_PATTERNS[@]}")
            ;;
        *)
            echo "ERROR: Unknown file type: $file_type" >&2
            return 1
            ;;
    esac
    
    # Count matches for each pattern
    for pattern in "${patterns[@]}"; do
        local count
        count=$(grep -c -E "$pattern" "$file" 2>/dev/null || echo 0)
        total=$((total + count))
    done
    
    echo "$total"
}

# Validate integration threshold
validate_integration_threshold() {
    local count="$1"
    local file_type="$2"
    local threshold=0
    
    case "$file_type" in
        "agent")
            threshold=30
            ;;
        "command")
            threshold=15
            ;;
        "workflow")
            threshold=20
            ;;
        *)
            echo "ERROR: Unknown file type: $file_type" >&2
            return 1
            ;;
    esac
    
    if [ "$count" -ge "$threshold" ]; then
        echo "PASS"
    else
        echo "WARN:$count:$threshold"
    fi
}

# Batch process files
process_files() {
    local file_pattern="$1"
    local file_type="$2"
    local verbose="${3:-false}"
    
    local total_passed=0
    local total_failed=0
    local total_warned=0
    
    for file in $file_pattern; do
        if [ ! -f "$file" ]; then
            continue
        fi
        
        local count
        count=$(count_integration_points "$file" "$file_type")
        local result
        result=$(validate_integration_threshold "$count" "$file_type")
        
        case "$result" in
            "PASS")
                ((total_passed++))
                if [ "$verbose" = "true" ]; then
                    echo "✓ $(basename "$file"): $count points"
                fi
                ;;
            WARN:*)
                local actual_count="${result#WARN:}"
                local threshold="${actual_count#*:}"
                actual_count="${actual_count%:*}"
                ((total_warned++))
                echo "⚠ $(basename "$file"): $actual_count points (< $threshold)"
                ;;
        esac
    done
    
    echo "$total_passed $total_failed $total_warned"
}

# Export functions for use in other scripts
export -f count_integration_points validate_integration_threshold process_files
