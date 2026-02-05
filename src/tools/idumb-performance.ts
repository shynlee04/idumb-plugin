/**
 * iDumb Performance Validation Tool
 *
 * Validates code for performance issues:
 * - Inefficient scanning (multiple grep, no file filtering)
 * - Memory leaks (unbounded arrays, no cleanup)
 * - Iteration limits (unbounded loops)
 * - Batch operations (inefficient single operations)
 *
 * IMPORTANT: No console.log - use file logging only
 */

import { tool } from "@opencode-ai/plugin"
import { readFileSync, existsSync, readdirSync, statSync } from "fs"
import { join } from "path"

// ============================================================================
// TYPES
// ============================================================================

interface PerformanceIssue {
  type: "inefficient-scan" | "memory-leak" | "unbounded-loop" | "inefficient-batch" | "resource-waste"
  severity: "critical" | "high" | "medium" | "low"
  location: string
  line?: number
  description: string
  suggestion: string
  metrics?: {
    estimatedImpact: string
  }
}

interface PerformanceValidationResult {
  status: "pass" | "fail" | "partial"
  issues: PerformanceIssue[]
  summary: {
    total: number
    critical: number
    high: number
    medium: number
    low: number
  }
  metrics: {
    scanEfficiency: number
    memorySafety: number
    iterationSafety: number
  }
}

type PerformanceCheck = "scanning" | "cleanup" | "iteration-limits" | "all"

// ============================================================================
// SCANNING EFFICIENCY DETECTION
// ============================================================================

const SCANNING_PATTERNS = [
  {
    pattern: /grep.*src\/.*&&.*grep.*src\//,
    type: "inefficient-scan" as const,
    severity: "medium" as const,
    description: "Multiple grep operations on same files",
    suggestion: "Combine patterns with -E '|pattern1|pattern2'",
    metrics: { estimatedImpact: "2-5x slower" }
  },
  {
    pattern: /find\s+.*\s+-exec\s+grep/,
    type: "inefficient-scan" as const,
    severity: "high" as const,
    description: "find -exec grep spawns process per file",
    suggestion: "Use 'find | xargs grep' or 'grep -r'",
    metrics: { estimatedImpact: "10-100x slower" }
  },
  {
    pattern: /grep.*node_modules(?!\s+--exclude)/,
    type: "inefficient-scan" as const,
    severity: "medium" as const,
    description: "Scanning node_modules without exclusion",
    suggestion: "Add --exclude-dir=node_modules",
    metrics: { estimatedImpact: "100-1000x slower" }
  },
  {
    pattern: /for\s+file\s+in.*\*\.md.*do.*grep/,
    type: "inefficient-scan" as const,
    severity: "low" as const,
    description: "Loop with separate grep per file",
    suggestion: "Use single grep -r with file list",
    metrics: { estimatedImpact: "2-3x slower" }
  }
]

function checkScanEfficiency(content: string): PerformanceIssue[] {
  const issues: PerformanceIssue[] = []
  const lines = content.split('\n')

  for (const rule of SCANNING_PATTERNS) {
    for (let i = 0; i < lines.length; i++) {
      if (rule.pattern.test(lines[i])) {
        issues.push({
          type: rule.type,
          severity: rule.severity,
          location: `line ${i + 1}`,
          line: i + 1,
          description: rule.description,
          suggestion: rule.suggestion,
          metrics: rule.metrics
        })
      }
    }
  }

  // Check for exclude-dir usage
  if (/grep\s+-r/.test(content) && !/--exclude-dir/.test(content)) {
    issues.push({
      type: "inefficient-scan",
      severity: "low",
      location: "grep usage",
      description: "grep -r without --exclude-dir",
      suggestion: "Add --exclude-dir={node_modules,dist,.git}",
      metrics: { estimatedImpact: "Potential 10-100x improvement" }
    })
  }

  return issues
}

// ============================================================================
// MEMORY LEAK DETECTION
// ============================================================================

const MEMORY_LEAK_PATTERNS = [
  {
    pattern: /array.*push.*shift.*false/i,
    type: "memory-leak" as const,
    severity: "medium" as const,
    description: "Array growth without cleanup (unbounded)",
    suggestion: "Implement ring buffer or periodic cleanup"
  },
  {
    pattern: /while.*true|for.*\(;;\)|max_iterations:\s*null/,
    type: "unbounded-loop" as const,
    severity: "critical" as const,
    description: "Unbounded loop with no exit condition",
    suggestion: "Add iteration limit (max 10-100)"
  },
  {
    pattern: /retry.*until.*success/i,
    type: "unbounded-loop" as const,
    severity: "high" as const,
    description: "Retry loop without max attempt limit",
    suggestion: "Add max retry count with exponential backoff"
  }
]

function checkMemoryLeaks(content: string): PerformanceIssue[] {
  const issues: PerformanceIssue[] = []

  for (const rule of MEMORY_LEAK_PATTERNS) {
    const lines = content.split('\n')
    for (let i = 0; i < lines.length; i++) {
      if (rule.pattern.test(lines[i])) {
        issues.push({
          type: rule.type,
          severity: rule.severity,
          location: `line ${i + 1}`,
          line: i + 1,
          description: rule.description,
          suggestion: rule.suggestion
        })
      }
    }
  }

  // Check for max_iterations setting
  const maxIterMatch = content.match(/max_iterations:\s*(\d+)/)
  if (maxIterMatch) {
    const value = parseInt(maxIterMatch[1], 10)
    if (value > 100) {
      issues.push({
        type: "unbounded-loop",
        severity: "medium",
        location: "max_iterations setting",
        description: `High max_iterations (${value}) may cause excessive loops`,
        suggestion: "Consider reducing to 10-20 for typical operations"
      })
    }
  }

  return issues
}

// ============================================================================
// BATCH OPERATION DETECTION
// ============================================================================

const BATCH_PATTERNS = [
  {
    pattern: /cat\s+.*\.json.*for.*in/i,
    type: "inefficient-batch" as const,
    severity: "medium" as const,
    description: "Reading same JSON file multiple times in loop",
    suggestion: "Read once, cache in variable"
  },
  {
    pattern: /validate.*&&.*validate.*same.*file/i,
    type: "inefficient-batch" as const,
    severity: "low" as const,
    description: "Validating same file multiple times",
    suggestion: "Cache validation results"
  }
]

function checkBatchOperations(content: string): PerformanceIssue[] {
  const issues: PerformanceIssue[] = []
  const lines = content.split('\n')

  for (const rule of BATCH_PATTERNS) {
    for (let i = 0; i < lines.length; i++) {
      if (rule.pattern.test(lines[i])) {
        issues.push({
          type: rule.type,
          severity: rule.severity,
          location: `line ${i + 1}`,
          line: i + 1,
          description: rule.description,
          suggestion: rule.suggestion
        })
      }
    }
  }

  return issues
}

// ============================================================================
// RESOURCE MONITORING
// ============================================================================

interface ResourceMetrics {
  idumbSize: number
  reportCount: number
  withinLimits: boolean
}

function checkResourceUsage(directory: string): { metrics: ResourceMetrics; issues: PerformanceIssue[] } {
  const issues: PerformanceIssue[] = []
  const idumbDir = join(directory, ".idumb")

  if (!existsSync(idumbDir)) {
    return { metrics: { idumbSize: 0, reportCount: 0, withinLimits: true }, issues }
  }

  // Calculate .idumb size
  let totalSize = 0
  let reportCount = 0

  const calculateSize = (dir: string) => {
    const entries = readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = join(dir, entry.name)
      if (entry.isDirectory()) {
        calculateSize(fullPath)
      } else if (entry.isFile()) {
        totalSize += statSync(fullPath).size
        if (entry.name.endsWith('.json')) {
          reportCount++
        }
      }
    }
  }

  try {
    calculateSize(idumbDir)
  } catch {
    // Ignore permission errors
  }

  const sizeMB = totalSize / (1024 * 1024)

  if (sizeMB > 100) {
    issues.push({
      type: "resource-waste",
      severity: "high",
      location: ".idumb/",
      description: `.idumb directory is ${sizeMB.toFixed(1)}MB (limit: 100MB)`,
      suggestion: "Run cleanup: remove old checkpoints and archives",
      metrics: { estimatedImpact: "Disk space waste" }
    })
  }

  if (reportCount > 100) {
    issues.push({
      type: "memory-leak",
      severity: "medium",
      location: ".idumb/brain/governance/",
      description: `${reportCount} report files accumulated`,
      suggestion: "Run cleanup: /idumb:cleanup or implement automatic cleanup policy"
    })
  }

  return {
    metrics: {
      idumbSize: Math.round(sizeMB * 10) / 10,
      reportCount,
      withinLimits: sizeMB <= 100 && reportCount <= 100
    },
    issues
  }
}

// ============================================================================
// MAIN VALIDATION
// ============================================================================

function validatePerformance(
  content: string,
  filePath: string,
  checks: PerformanceCheck[],
  directory: string
): PerformanceValidationResult {
  const issues: PerformanceIssue[] = []

  const runChecks = checks.includes("all")
    ? ["scanning", "cleanup", "iteration-limits"] as const
    : checks

  let scanScore = 100
  let memoryScore = 100
  let iterationScore = 100

  for (const check of runChecks) {
    switch (check) {
      case "scanning":
        const scanIssues = checkScanEfficiency(content)
        issues.push(...scanIssues)
        scanScore = scanIssues.length === 0 ? 100 : Math.max(0, 100 - scanIssues.length * 25)
        break

      case "cleanup":
        const resourceResult = checkResourceUsage(directory)
        issues.push(...resourceResult.issues)
        memoryScore = resourceResult.metrics.withinLimits ? 100 : 50
        break

      case "iteration-limits":
        const memoryIssues = checkMemoryLeaks(content)
        issues.push(...memoryIssues)
        iterationScore = memoryIssues.length === 0 ? 100 : Math.max(0, 100 - memoryIssues.length * 30)
        break
    }
  }

  const summary = {
    total: issues.length,
    critical: issues.filter(i => i.severity === "critical").length,
    high: issues.filter(i => i.severity === "high").length,
    medium: issues.filter(i => i.severity === "medium").length,
    low: issues.filter(i => i.severity === "low").length
  }

  const status: "pass" | "fail" | "partial" =
    summary.critical > 0 ? "fail" :
    summary.high > 0 ? "partial" : "pass"

  return {
    status,
    issues,
    summary,
    metrics: {
      scanEfficiency: scanScore,
      memorySafety: memoryScore,
      iterationSafety: iterationScore
    }
  }
}

// ============================================================================
// TOOL EXPORTS
// ============================================================================

export const validate = tool({
  description: "Validate code for performance issues including inefficient scanning, memory leaks, and iteration limits",
  args: {
    target_path: tool.schema.string().describe("File or directory to validate"),
    checks: tool.schema.array(tool.schema.string()).optional().describe("Performance checks to perform (default: all)"),
    check_resources: tool.schema.boolean().optional().describe("Also check .idumb resource usage (default: true)")
  },
  async execute(args, context) {
    const { target_path, checks = ["all"], check_resources = true } = args
    const fullPath = join(context.directory, target_path)

    const checksToRun = checks as PerformanceCheck[]

    if (check_resources) {
      checksToRun.push("cleanup")
    }

    if (!existsSync(fullPath)) {
      return JSON.stringify({
        status: "fail",
        issues: [{
          type: "inefficient-scan",
          severity: "high",
          location: target_path,
          description: "Target does not exist",
          suggestion: "Check the target path"
        }],
        summary: { total: 1, critical: 0, high: 1, medium: 0, low: 0 },
        metrics: { scanEfficiency: 0, memorySafety: 0, iterationSafety: 0 }
      })
    }

    const stat = statSync(fullPath)

    if (stat.isFile()) {
      const content = readFileSync(fullPath, "utf8")
      const result = validatePerformance(content, fullPath, checksToRun, context.directory)
      return JSON.stringify(result, null, 2)
    }

    // Directory scan
    const allIssues: PerformanceIssue[] = []
    let scanned = 0

    const scanDirectory = (dir: string) => {
      const entries = readdirSync(dir, { withFileTypes: true })
      for (const entry of entries) {
        const fullPath = join(dir, entry.name)
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== "node_modules") {
          scanDirectory(fullPath)
        } else if (entry.isFile() && (entry.name.endsWith('.sh') || entry.name.endsWith('.ts'))) {
          const content = readFileSync(fullPath, "utf8")
          const result = validatePerformance(content, fullPath, checksToRun, context.directory)
          allIssues.push(...result.issues)
          scanned++
        }
      }
    }

    scanDirectory(fullPath)

    // Also check resource usage for directory scans
    if (check_resources) {
      const resourceResult = checkResourceUsage(context.directory)
      allIssues.push(...resourceResult.issues)
    }

    const summary = {
      total: allIssues.length,
      critical: allIssues.filter(i => i.severity === "critical").length,
      high: allIssues.filter(i => i.severity === "high").length,
      medium: allIssues.filter(i => i.severity === "medium").length,
      low: allIssues.filter(i => i.severity === "low").length
    }

    const status: "pass" | "fail" | "partial" =
      summary.critical > 0 ? "fail" :
      summary.high > 0 ? "partial" : "pass"

    return JSON.stringify({
      status,
      scanned,
      issues: allIssues,
      summary,
      metrics: {
        scanEfficiency: 0, // Aggregated metrics not calculated for directory scans
        memorySafety: 0,
        iterationSafety: 0
      }
    }, null, 2)
  }
})

export const monitor = tool({
  description: "Check .idumb resource usage and report on cleanup needs",
  args: {},
  async execute(args, context) {
    const resourceResult = checkResourceUsage(context.directory)

    return JSON.stringify({
      status: resourceResult.metrics.withinLimits ? "pass" : "partial",
      metrics: resourceResult.metrics,
      issues: resourceResult.issues,
      suggestion: resourceResult.issues.length > 0
        ? "Run /idumb:cleanup to remove old checkpoints and validation reports"
        : "Resource usage is within acceptable limits"
    }, null, 2)
  }
})

export const checkIterationLimits = tool({
  description: "Validate iteration limits and detect unbounded loops",
  args: {
    target: tool.schema.string().describe("File to check")
  },
  async execute(args, context) {
    const { target } = args
    const fullPath = join(context.directory, target)

    if (!existsSync(fullPath)) {
      return JSON.stringify({
        status: "fail",
        error: `File not found: ${target}`
      })
    }

    const content = readFileSync(fullPath, "utf8")
    const issues = checkMemoryLeaks(content)

    return JSON.stringify({
      file: target,
      status: issues.length > 0 ? "partial" : "pass",
      issues: issues.filter(i => i.type === "unbounded-loop"),
      summary: {
        total: issues.length,
        critical: issues.filter(i => i.severity === "critical").length
      }
    }, null, 2)
  }
})

export default tool({
  description: "Run comprehensive performance validation",
  args: {
    target: tool.schema.string().describe("Target file or directory")
  },
  async execute(args, context) {
    return await validate.execute(
      { target_path: args.target, checks: ["all"], check_resources: true },
      context
    )
  }
})
