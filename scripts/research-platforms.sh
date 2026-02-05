#!/bin/bash

# Strategic Framework Research Script
# Researches agentic platforms: OpenCode, Claude Code, Cursor, Windsurf

set -euo pipefail

OUTPUT_DIR=".idumb/project-output/research"
mkdir -p "$OUTPUT_DIR"

echo "🔍 Starting Strategic Framework Research..."
echo "Target platforms: OpenCode, Claude Code, Cursor, Windsurf"
echo "Output directory: $OUTPUT_DIR"
echo ""

# Function to search and save results
search_platform() {
    local platform="$1"
    local query="$2"
    local output_file="$OUTPUT_DIR/${platform}-research.json"
    
    echo "Researching $platform..."
    echo "Query: $query"
    
    # Run the search
    infsh app run tavily/search-assistant --input "{\"query\": \"$query\"}" > "$output_file"
    
    echo "Results saved to $output_file"
    echo ""
}

# Research each platform
echo "=== Cycle 1: Platform Concept Mapping ==="
echo ""

search_platform "opencode" "OpenCode AI platform architecture agents subagents orchestrators permissions hooks plugins skills commands workflows documentation"
search_platform "claude-code" "Claude Code AI platform architecture agents tools permissions plugins documentation"
search_platform "cursor" "Cursor AI platform architecture agents tools plugins documentation"
search_platform "windsurf" "Windsurf AI platform architecture agents tools plugins documentation"

echo "=== Research Complete ==="
echo "Next steps:"
echo "1. Analyze the JSON results in $OUTPUT_DIR"
echo "2. Extract key concepts and terminology"
echo "3. Begin comparative matrix building"
echo "4. Identify unique features and gaps"

# Create a summary file
cat > "$OUTPUT_DIR/RESEARCH-SUMMARY.md" << EOF
# Strategic Framework Research Summary

## Research Status
- ✅ OpenCode research completed
- ✅ Claude Code research completed  
- ✅ Cursor research completed
- ✅ Windsurf research completed

## Next Steps
1. Parse JSON results and extract structured data
2. Build Platform Comparison Matrix
3. Analyze context lifecycle behaviors
4. Document plugin capabilities
5. Synthesize non-negotiable principles
6. Design testable hypotheses

## Raw Data Location
All raw search results are stored as JSON files in this directory.
EOF

echo ""
echo "Summary created: $OUTPUT_DIR/RESEARCH-SUMMARY.md"