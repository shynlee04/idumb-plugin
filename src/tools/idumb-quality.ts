/**
 * iDumb Code Quality Validation Tool
 *
 * Validates code for:
 * - Error handling (try-catch, error checking)
 * - Cross-platform compatibility (GNU vs BSD commands)
 * - Documentation completeness (docstrings, comments)
 * - Code duplication
 *
 * IMPORTANT: No console.log - use file logging only
 */

import { tool } from "@opencode-ai/plugin"
import { readFileSync, existsSync, readdirSync } from "fs"
import { join } from "path"

// ============================================================================
// TYPES
// ============================================================================

interface QualityIssue {
  type: "missing-error-handling" | "platform-specific" | "missing-docs" | "inconsistent-format" | "duplication"
  severity: "high" | "medium" | "low"
  location: string
  line?: number
  description: string
  suggestion: string
}

interface QualityValidationResult {
  status: "pass" | "fail" | "partial"
  issues: QualityIssue[]
  summary: {
    total: number
    high: number
    medium: number
    low: number
  }
  coverage: {
    errorHandling: number
    documentation: number
    crossPlatform: number
  }
}

type QualityCheck = "error-handling" | "cross-platform" | "documentation" | "all"

// ============================================================================
// ERROR HANDLING DETECTION
// ============================================================================

const ERROR_HANDLING_PATTERNS = [
  {
    pattern: /\bjq\s+-r/,
    type: "missing-error-handling" as const,
    severity: "high" as const,
    description: "jq without error handling - failure causes empty/invalid output",
    suggestion: "Add '|| { echo \"ERROR: ...\"; exit 1; }' after jq command"
  },
  {
    pattern: /\$\{[^}]+\}(?![|?])/,
    type: "missing-error-handling" as const,
    severity: "medium" as const,
    description: "Variable without default or error check",
    suggestion: "Use '${VAR:-default}' or check with 'test -n \"$VAR\"'"
  },
  {
    pattern: /(?:mkdir|cp|mv|rm)\s+(?!\s*-p)/,
    type: "missing-error-handling" as const,
    severity: "medium" as const,
    description: "File operation without error checking",
    suggestion: "Add '|| error_exit \"operation failed\"' after command"
  },
  {
    pattern: /(?:grep|sed|awk)(?!\s*\|\|)/,
    type: "missing-error-handling" as const,
    severity: "low" as const,
    description: "Text processing command without error handling",
    suggestion: "Consider adding error handling for command failures"
  }
]

function _checkErrorHandling(content: string, fileType: string): QualityIssue[] {
  const issues: QualityIssue[] = []

  if (fileType === "sh" || fileType === "bash") {
    // Check for set -euo pipefail
    if (!content.includes("set -e") && !content.includes("set -euo")) {
      issues.push({
        type: "missing-error-handling",
        severity: "medium",
        location: "script header",
        description: "Missing 'set -euo pipefail' for error handling",
        suggestion: "Add 'set -euo pipefail' at the top of the script"
      })
    }

    // Check for error handler function
    if (!content.includes("error_exit") && !content.includes("die")) {
      issues.push({
        type: "missing-error-handling",
        severity: "low",
        location: "script",
        description: "No error handler function defined",
        suggestion: "Define an error_exit function for consistent error reporting"
      })
    }

    // Check for patterns
    const lines = content.split('\n')
    for (const rule of ERROR_HANDLING_PATTERNS) {
      for (let i = 0; i < lines.length; i++) {
        if (rule.pattern.test(lines[i])) {
          issues.push({
            type: "missing-error-handling",
            severity: rule.severity,
            location: `line ${i + 1}`,
            line: i + 1,
            description: rule.description,
            suggestion: rule.suggestion
          })
        }
      }
    }
  }

  if (fileType === "ts" || fileType === "js") {
    // Check for console.log (should use logging function)
    const lines = content.split('\n')
    for (let i = 0; i < lines.length; i++) {
      if (/console\.log/.test(lines[i])) {
        issues.push({
          type: "inconsistent-format",
          severity: "medium",
          location: `line ${i + 1}`,
          line: i + 1,
          description: "console.log found - should use logging function",
          suggestion: "Replace console.log with log() or similar logging utility"
        })
      }
    }

    // Check for async functions without try-catch
    const asyncMatches = content.matchAll(/async\s+\w+\s*\([^)]*\)\s*{/g)
    for (const match of asyncMatches) {
      const startIndex = match.index || 0
      // Look ahead for try-catch
      const nextBraces = content.substring(startIndex, startIndex + 500)
      if (!/try\s*{/.test(nextBraces)) {
        issues.push({
          type: "missing-error-handling",
          severity: "high",
          location: "async function",
          description: "Async function without try-catch block",
          suggestion: "Wrap async operations in try-catch for proper error handling"
        })
      }
    }
  }

  return issues
}

// ============================================================================
// CROSS-PLATFORM DETECTION
// ============================================================================

const PLATFORM_SPECIFIC_PATTERNS = [
  {
    pattern: /date\s+-d/,
    type: "platform-specific" as const,
    severity: "high" as const,
    description: "GNU date syntax (-d) fails on macOS/BSD",
    suggestion: "Use portable date arithmetic or detect OS type"
  },
  {
    pattern: /sed\s+-i(?!\s)/,
    type: "platform-specific" as const,
    severity: "medium" as const,
    description: "sed -i behaves differently on macOS vs Linux",
    suggestion: "Use 'sed -i ''' on macOS or detect platform"
  },
  {
    pattern: /grep\s+-P/,
    type: "platform-specific" as const,
    severity: "medium" as const,
    description: "grep -P not available on all systems",
    suggestion: "Use grep -E for extended regex or detect platform"
  },
  {
    pattern: /\/proc\/|\/sys\//,
    type: "platform-specific" as const,
    severity: "high" as const,
    description: "Linux-specific filesystem paths",
    suggestion: "Use portable alternatives or detect OS type"
  }
]

function checkCrossPlatform(content: string, fileType: string): QualityIssue[] {
  const issues: QualityIssue[] = []

  if (fileType === "sh" || fileType === "bash") {
    const lines = content.split('\n')
    for (const rule of PLATFORM_SPECIFIC_PATTERNS) {
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

    // Check for platform detection
    const hasPlatformDetection =
      /uname/.test(content) ||
      /OSTYPE/.test(content) ||
      /darwin|linux|macos/i.test(content)

    if (issues.length > 0 && !hasPlatformDetection) {
      issues.push({
        type: "platform-specific",
        severity: "medium",
        location: "script",
        description: "Platform-specific code without OS detection",
        suggestion: "Add platform detection: 'case \"$(uname -s)\" in ... esac'"
      })
    }
  }

  return issues
}

// ============================================================================
// DOCUMENTATION DETECTION
// ============================================================================

function checkDocumentation(content: string, fileType: string, filePath: string): QualityIssue[] {
  const issues: QualityIssue[] = []

  if (fileType === "md") {
    // Check for description
    if (!content.match(/description:\s*\".{10,}/)) {
      issues.push({
        type: "missing-docs",
        severity: "high",
        location: "frontmatter",
        description: "Missing or too short description (min 10 chars)",
        suggestion: "Add a meaningful description (>10 characters) in frontmatter"
      })
    }

    // Check for purpose section
    if (!/<purpose>/i.test(content)) {
      issues.push({
        type: "missing-docs",
        severity: "medium",
        location: "document",
        description: "Missing <purpose> section",
        suggestion: "Add a <purpose> section explaining what this component does"
      })
    }
  }

  if (fileType === "ts" || fileType === "js") {
    // Check for JSDoc comments on exports
    const exportMatches = content.matchAll(/export\s+(?:const|function|class|default)\s+(\w+)/g)
    for (const match of exportMatches) {
      const name = match[1]
      const startIndex = match.index || 0
      const precedingContent = content.substring(Math.max(0, startIndex - 500), startIndex)

      if (!/\/\*\*/.test(precedingContent) && !/^\/\/\s+/.test(precedingContent)) {
        issues.push({
          type: "missing-docs",
          severity: "medium",
          location: name,
          description: `Export '${name}' lacks JSDoc documentation`,
          suggestion: "Add JSDoc comment with @param, @returns, @throws as needed"
        })
      }
    }

    // Check for tool() wrapper without description
    if (/tool\(\{/.test(content)) {
      const toolMatch = content.match(/tool\(\{\s*description:\s*\"([^\"]+)\"/)
      if (!toolMatch || toolMatch[1].length < 10) {
        issues.push({
          type: "missing-docs",
          severity: "high",
          location: "tool definition",
          description: "Tool has missing or too short description (min 10 chars)",
          suggestion: "Add a clear description of what the tool does (>10 characters)"
        })
      }
    }
  }

  if (fileType === "sh" || fileType === "bash") {
    // Check for script header comments
    const lines = content.split('\n').slice(0, 10)
    const hasComments = lines.some(line => line.trim().startsWith('#'))

    if (!hasComments) {
      issues.push({
        type: "missing-docs",
        severity: "low",
        location: "script header",
        description: "No header comments explaining script purpose",
        suggestion: "Add comment header with script purpose, author, usage"
      })
    }
  }

  return issues
}

// ============================================================================
// MAIN VALIDATION
// ============================================================================

function getFileType(filePath: string): string {
  const ext = filePath.split('.').pop() || ""
  const typeMap: Record<string, string> = {
    "sh": "bash",
    "bash": "bash",
    "ts": "ts",
    "js": "js",
    "md": "md"
  }
  return typeMap[ext] || "unknown"
}

function validateQuality(
  filePath: string,
  checks: QualityCheck[]
): QualityValidationResult {
  const issues: QualityIssue[] = []

  if (!existsSync(filePath)) {
    return {
      status: "fail",
      issues: [{
        type: "missing-error-handling",
        severity: "high",
        location: filePath,
        description: "File does not exist",
        suggestion: "Check file path"
      }],
      summary: { total: 1, high: 1, medium: 0, low: 0 },
      coverage: { errorHandling: 0, documentation: 0, crossPlatform: 0 }
    }
  }

  const content = readFileSync(filePath, "utf8")
  const fileType = getFileType(filePath)

  const runChecks = checks.includes("all")
    ? ["error-handling", "cross-platform", "documentation"] as const
    : checks

  let errorHandlingScore = 0
  let documentationScore = 0
  let crossPlatformScore = 0

  for (const check of runChecks) {
    let checkIssues: QualityIssue[] = []

    switch (check) {
      case "error-handling":
        checkIssues = _checkErrorHandling(content, fileType)
        errorHandlingScore = checkIssues.length === 0 ? 100 : Math.max(0, 100 - checkIssues.length * 20)
        break
      case "cross-platform":
        checkIssues = checkCrossPlatform(content, fileType)
        crossPlatformScore = checkIssues.length === 0 ? 100 : Math.max(0, 100 - checkIssues.length * 25)
        break
      case "documentation":
        checkIssues = checkDocumentation(content, fileType, filePath)
        documentationScore = checkIssues.length === 0 ? 100 : Math.max(0, 100 - checkIssues.length * 15)
        break
    }

    issues.push(...checkIssues)
  }

  const summary = {
    total: issues.length,
    high: issues.filter(i => i.severity === "high").length,
    medium: issues.filter(i => i.severity === "medium").length,
    low: issues.filter(i => i.severity === "low").length
  }

  const status: "pass" | "fail" | "partial" =
    summary.high > 0 ? "fail" :
      summary.medium > 0 ? "partial" : "pass"

  return {
    status,
    issues,
    summary,
    coverage: {
      errorHandling: errorHandlingScore,
      documentation: documentationScore,
      crossPlatform: crossPlatformScore
    }
  }
}

// ============================================================================
// TOOL EXPORTS
// ============================================================================

export const validate = tool({
  description: "Validate code for error handling, cross-platform compatibility, and documentation standards",
  args: {
    target_path: tool.schema.string().describe("File or directory to validate"),
    checks: tool.schema.array(tool.schema.string()).optional().describe("Quality checks to perform (default: all)"),
    file_type: tool.schema.string().optional().describe("Filter by file type (sh, ts, md)")
  },
  async execute(args, context) {
    const { target_path, checks = ["all"], file_type } = args
    const fullPath = join(context.directory, target_path)

    const checksToRun = checks as QualityCheck[]

    // Single file validation
    if (file_type || !existsSync(fullPath) || require("fs").statSync(fullPath).isFile()) {
      const result = validateQuality(fullPath, checksToRun)
      return JSON.stringify(result, null, 2)
    }

    // Directory validation
    const allIssues: QualityIssue[] = []
    let scanned = 0
    const results: Record<string, QualityValidationResult> = {}

    const scanDirectory = (dir: string) => {
      const entries = readdirSync(dir, { withFileTypes: true })
      for (const entry of entries) {
        const fullPath = join(dir, entry.name)
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== "node_modules") {
          scanDirectory(fullPath)
        } else if (entry.isFile()) {
          const ext = entry.name.split('.').pop()
          if (!file_type || ext === file_type) {
            const result = validateQuality(fullPath, checksToRun)
            results[fullPath] = result
            allIssues.push(...result.issues)
            scanned++
          }
        }
      }
    }

    scanDirectory(fullPath)

    const summary = {
      total: allIssues.length,
      high: allIssues.filter(i => i.severity === "high").length,
      medium: allIssues.filter(i => i.severity === "medium").length,
      low: allIssues.filter(i => i.severity === "low").length
    }

    const status: "pass" | "fail" | "partial" =
      summary.high > 0 ? "fail" :
        summary.medium > 0 ? "partial" : "pass"

    return JSON.stringify({
      status,
      scanned,
      issues: allIssues,
      summary,
      results
    }, null, 2)
  }
})

export const checkDocs = tool({
  description: "Check documentation coverage for files",
  args: {
    target: tool.schema.string().describe("File or directory to check")
  },
  async execute(args, context) {
    const { target } = args
    const fullPath = join(context.directory, target)

    const result = validateQuality(fullPath, ["documentation"])
    return JSON.stringify(result, null, 2)
  }
})

export const checkErrors = tool({
  description: "Check error handling patterns in code",
  args: {
    target: tool.schema.string().describe("File to check")
  },
  async execute(args, context) {
    const { target } = args
    const fullPath = join(context.directory, target)

    const result = validateQuality(fullPath, ["error-handling"])
    return JSON.stringify(result, null, 2)
  }
})

export default tool({
  description: "Run comprehensive code quality validation",
  args: {
    target: tool.schema.string().describe("Target file or directory")
  },
  async execute(args, context) {
    return await validate.execute(
      { target_path: args.target, checks: ["all"] },
      context
    )
  }
})
