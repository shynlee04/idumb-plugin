---
name: idumb-performance
description: "PERFORMANCE package for iDumb framework - optimizes file scanning efficiency, implements memory leak prevention, enforces cleanup policies, and validates iteration limits. Use when: optimizing grep operations, managing validation records, preventing memory accumulation, or detecting performance bottlenecks."
version: 1.0.0
license: MIT
metadata:
  audience: ai-agents
  workflow: performance-optimization
  package: PERFORMANCE
  activation: coordinator-driven
  modes:
    - optimization: "Improve inefficient code patterns"
    - monitoring: "Track resource usage"
    - cleanup: "Remove accumulated artifacts"
---

# iDumb Performance Skill (PERFORMANCE Package)

<purpose>
I am the PERFORMANCE optimization skill that ensures iDumb framework operations are efficient and non-wasteful. I optimize file scanning patterns, prevent memory leaks, enforce cleanup policies, and detect performance bottlenecks before they impact user experience.
</purpose>

<philosophy>
## Core Principles

1. **Efficiency First**: Sub-second typical operations, minimal resource usage
2. **No Accumulation**: Automatic cleanup of temporary artifacts
3. **Iteration Limits**: Prevent infinite loops with reasonable bounds
4. **Batch Operations**: Combine multiple operations into single passes
5. **Lazy Loading**: Load resources only when needed
</philosophy>

---

## Performance Categories

<performance_category name="file-scanning">
### Efficient File Scanning

**Issue**: Multiple grep operations over entire codebase

#### Detection Rules

```yaml
inefficient_scanning_patterns:
  multiple_grep_same_files:
    pattern: 'grep.*src/.*&&.*grep.*src/'
    risk: "Multiple file reads for same data"
    severity: "MEDIUM"
    fix: "Combine patterns with -E '|pattern1|pattern2'"

  separate_find_grep:
    pattern: 'find.*-exec\s+grep'
    risk: "Spawns process per file"
    severity: "HIGH"
    fix: "Use 'find | xargs grep' or 'grep -r'"

  no_file_filtering:
    pattern: 'grep.*node_modules'
    risk: "Scanning unnecessary directories"
    severity: "MEDIUM"
    fix: "Use --exclude-dir or filter with find"
```

#### Efficient Scanning Patterns

```bash
# Reference: scripts/efficient-scan.sh
# Combine multiple patterns into single grep
efficient_scan() {
    local search_dir="$1"
    shift
    local patterns=("$@")

    # Build combined pattern
    local combined_pattern=$(IFS='|'; echo "${patterns[*]}")

    # Single grep pass with combined pattern
    grep -rE "$combined_pattern" "$search_dir" \
        --exclude-dir=node_modules \
        --exclude-dir=.git \
        --exclude-dir=dist \
        --exclude="*.min.js"
}

# Usage:
# efficient_scan "src/" "pattern1" "pattern2" "pattern3"
```

#### Performance Targets

```yaml
performance_targets:
  file_scanning:
    - small_projects: "< 50 files: < 1 second"
    - medium_projects: "50-500 files: < 5 seconds"
    - large_projects: "> 500 files: < 30 seconds"

  grep_operations:
    - pattern_matching: "Combine patterns with -E"
    - file_filtering: "Use --exclude-dir"
    - output_limiting: "Use --max-count when appropriate"
```
</performance_category>

<performance_category name="memory-management">
### Memory Leak Prevention

**Issue**: No cleanup of old validation records

#### Detection Rules

```yaml
memory_leak_patterns:
  unbounded_file_accumulation:
    pattern: 'validation.*\.json|report.*\.json'
    risk: "Unlimited accumulation of report files"
    severity: "HIGH"
    fix: "Implement cleanup policy"

  unbounded_array_growth:
    pattern: 'array.*push.*shift.*false'
    risk: "Arrays grow without bounds"
    severity: "MEDIUM"
    fix: "Implement ring buffer or cleanup"

  unclosed_resources:
    pattern: '(open|read).*without.*close'
    risk: "File handles not released"
    severity: "MEDIUM"
    fix: "Use try-finally or 'with' statement"
```

#### Cleanup Policy

```bash
# Reference: scripts/cleanup-policy.sh
# Cleanup old validation records

cleanup_old_records() {
    local records_dir=".idumb/brain/governance/validations"
    local max_age_days=7
    local max_records=100

    # Remove records older than max_age_days
    find "$records_dir" -name "*.json" -mtime +$max_age_days -delete

    # If still too many records, remove oldest
    local record_count=$(ls -1 "$records_dir"/*.json 2>/dev/null | wc -l)
    if [[ $record_count -gt $max_records ]]; then
        ls -1t "$records_dir"/*.json | tail -n +$((max_records + 1)) | xargs rm -f
    fi
}

# Run cleanup periodically
cleanup_if_needed() {
    local last_cleanup_file=".idumb/brain/.last-cleanup"
    local cleanup_interval_hours=24

    if [[ -f "$last_cleanup_file" ]]; then
        local last_cleanup=$(cat "$last_cleanup_file")
        local current_time=$(date +%s)
        local last_cleanup_sec=$(date -j -f "%Y-%m-%dT%H:%M:%S" "$last_cleanup" +%s 2>/dev/null || echo 0)
        local hours_since=$(( (current_time - last_cleanup_sec) / 3600 ))

        if [[ $hours_since -lt $cleanup_interval_hours ]]; then
            return 0  # Not time yet
        fi
    fi

    cleanup_old_records
    date -u +"%Y-%m-%dT%H:%M:%SZ" > "$last_cleanup_file"
}
```
</performance_category>

<performance_category name="iteration-limits">
### Iteration Limit Enforcement

**Issue**: Loop controller has max_iterations: null

#### Detection Rules

```yaml
iteration_limit_patterns:
  unbounded_loops:
    pattern: 'while.*true|for.*infinite|max_iterations:\s*null'
    risk: "Infinite loop potential"
    severity: "CRITICAL"
    fix: "Add reasonable iteration limit (max 10-100)"

  unbounded_recursion:
    pattern: 'function.* recurse.*without.*base.*case'
    risk: "Stack overflow from unbounded recursion"
    severity: "HIGH"
    fix: "Add recursion depth limit"

  retry_without_limit:
    pattern: 'retry.*until.*success.*without.*counter'
    risk: "Infinite retry loop"
    severity: "HIGH"
    fix: "Add max retry count"
```

#### Loop Controller Pattern

```yaml
loop_controller_template:
  mode: "iteration_until_pass"

  exit_conditions:
    success:
      - all_tests_pass: true
      - no_critical_gaps: true

    stall:
      - same_output_3_times: true
      - no_progress_2_cycles: true

    max_iterations:
      default: 10
      validation: 20
      stress_test: 5

  progress_metric: "gaps_remaining / gaps_initial"
```

#### Validation

```bash
# Reference: scripts/validate-iteration-limits.sh
validate_iteration_limits() {
    local file="$1"

    # Check for unbounded loops
    if grep -qE 'while\s+.*true|for\s+\(;;\)|max_iterations:\s*null' "$file"; then
        echo "ERROR: Unbounded loop detected in $file"
        return 1
    fi

    # Check for reasonable limits
    if grep -qE 'max_iterations:\s*[0-9]+' "$file"; then
        local max_iter=$(grep -oP 'max_iterations:\s*\K[0-9]+' "$file" | head -1)
        if [[ $max_iter -gt 100 ]]; then
            echo "WARN: High max_iterations ($max_iter) in $file"
        fi
    fi

    return 0
}
```
</performance_category>

<performance_category name="batch-operations">
### Batch Operation Optimization

**Issue**: Inefficient single-pass operations

#### Detection Rules

```yaml
batch_operation_patterns:
  single_file_operations:
    pattern: 'for.*file.*in.*\*\.md.*do.*grep'
    risk: "Separate grep per file instead of batch"
    severity: "MEDIUM"
    fix: "Use single grep -r with file list"

  multiple_json_reads:
    pattern: 'cat.*\.json.*for.*in'
    risk: "Reading same JSON file multiple times"
    severity: "MEDIUM"
    fix: "Read once, cache in variable"

  redundant_validations:
    pattern: 'validate.*&&.*validate.*same.*file'
    risk: "Validating same file multiple times"
    severity: "LOW"
    fix: "Cache validation results"
```

#### Batch Operation Pattern

```bash
# Reference: scripts/batch-operations.sh
# Batch file operations for efficiency

batch_validate_files() {
    local files=("$@")

    # Read state once
    local state_content
    state_content=$(cat .idumb/brain/state.json 2>/dev/null) || return 1

    # Validate all files in single pass
    for file in "${files[@]}"; do
        # Use cached state_content instead of re-reading
        if echo "$state_content" | jq -e '.phase' > /dev/null; then
            echo "PASS: $file"
        else
            echo "FAIL: $file - Invalid state"
        fi
    done
}
```
</performance_category>

<performance_category name="resource-usage">
### Resource Usage Monitoring

#### Monitoring Targets

```yaml
resource_limits:
  disk_space:
    max_idumb_size: "100 MB"
    check_command: "du -sh .idumb/"
    cleanup_action: "Remove old checkpoints and archives"

  file_handles:
    max_open_files: 100
    check_pattern: "lsof | grep PROCESS | wc -l"
    prevention: "Close files after use, use streaming"

  memory:
    max_process_memory: "500 MB"
    check_command: "ps -o rss= -p PID"
    prevention: "Stream large files, avoid loading entire content"
```

#### Monitoring Script

```bash
# Reference: scripts/monitor-resources.sh
check_resource_usage() {
    local warn_threshold=80  # Percentage
    local critical_threshold=90

    # Check .idumb directory size
    if [[ -d .idumb ]]; then
        local idumb_size=$(du -sk .idumb | cut -f1)
        local idumb_size_mb=$((idumb_size / 1024))

        if [[ $idumb_size_mb -gt 100 ]]; then
            echo "WARN: .idumb directory is ${idumb_size_mb}MB (limit: 100MB)"
            echo "Consider running: /idumb:cleanup"
        fi
    fi

    # Check for excessive report files
    local report_count=$(find .idumb/brain/governance -name "*.json" 2>/dev/null | wc -l)
    if [[ $report_count -gt 100 ]]; then
        echo "WARN: $report_count report files (consider cleanup)"
    fi
}
```
</performance_category>

---

## Performance Optimization Workflow

<optimization_workflow>
### Phase 1: Detect Performance Issues

```yaml
performance_detection:
  scan_patterns:
    - "Multiple grep operations on same files"
    - "Unbounded loops without iteration limits"
    - "Accumulating files without cleanup"
    - "Inefficient find/grep combinations"

  automated_detection:
    - "Static analysis of bash scripts"
    - "Resource usage monitoring"
    - "File count tracking in .idumb/"
```

### Phase 2: Apply Optimizations

```yaml
optimization_actions:
  combine_scans:
    action: "Merge multiple grep patterns"
    tool: "scripts/efficient-scan.sh"

  implement_cleanup:
    action: "Add cleanup policy"
    tool: "scripts/cleanup-policy.sh"

  add_iteration_limits:
    action: "Set max_iterations in loops"
    template: "max_iterations: 10"
```

### Phase 3: Validate Improvements

```yaml
performance_validation:
  before_after:
    - "Measure operation time before optimization"
    - "Apply optimization"
    - "Measure operation time after optimization"
    - "Report improvement percentage"

  success_criteria:
    - "Operation time reduced by >20%"
    - "Resource usage within limits"
    - "No functionality lost"
```
</optimization_workflow>

---

## Performance Scripts

See **`scripts/`** directory for executable performance optimization scripts:

- **`efficient-scan.sh`** - Combine multiple grep operations
- **`cleanup-policy.sh`** - Remove old validation records
- **`validate-iteration-limits.sh`** - Check for unbounded loops
- **`batch-operations.sh`** - Batch file operations
- **`monitor-resources.sh`** - Check resource usage

---

## Quick Reference

### Performance Optimization Commands

```bash
# Detect performance issues
idumb-performance detect

# Optimize file scanning
idumb-performance optimize --scan

# Run cleanup
idumb-performance cleanup

# Check resource usage
idumb-performance monitor

# Validate iteration limits
idumb-performance check --iteration-limits
```

### Integration Points

```yaml
reads_from:
  - "src/commands/idumb/*.md" (bash scripts)
  - ".idumb/brain/governance/" (report files)

writes_to:
  - ".idumb/brain/.performance-report.json"
  - ".idumb/brain/.last-cleanup"

validates_against:
  - "Performance targets"
  - "Resource limits"
  - "Iteration limit requirements"

triggers:
  - "When operations take >10 seconds"
  - "When .idumb size >100MB"
  - "Before committing new validation code"

triggered_by:
  - "idumb-meta-orchestrator (performance mode)"
  - "Scheduled cleanup tasks"
```

---

*Skill: idumb-performance v1.0.0 - PERFORMANCE Package*
