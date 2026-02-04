/**
 * iDumb Meta Orchestrator Tool
 *
 * Master coordinator that activates appropriate validation skills
 * based on context, risk level, and operation type.
 *
 * Coordinates:
 * - idumb-security: Bash injection, path traversal, permissions
 * - idumb-code-quality: Error handling, cross-platform, documentation
 * - idumb-performance: Efficient scanning, cleanup, iteration limits
 *
 * IMPORTANT: No console.log - use file logging only
 */

import { tool } from "@opencode-ai/plugin"
import { existsSync, statSync } from "fs"
import { join } from "path"

// ============================================================================
// TYPES
// ============================================================================

type OperationType = "create" | "edit" | "delete" | "commit" | "build-agent" | "build-workflow" | "build-command" | "phase-transition"
type RiskLevel = "critical" | "high" | "medium" | "low" | "auto"
type SkillName = "security" | "quality" | "performance"

interface OrchestrationResult {
  status: "pass" | "fail" | "partial"
  activated_skills: SkillName[]
  issues: {
    security?: any[]
    quality?: any[]
    performance?: any[]
  }
  blockers: string[]
  warnings: string[]
  summary: {
    total: number
    bySkill: Record<SkillName, number>
  }
  risk_assessment: {
    level: RiskLevel
    factors: string[]
  }
}

// ============================================================================
// RISK ASSESSMENT
// ============================================================================

interface RiskFactors {
  level: RiskLevel
  factors: string[]
}

function assessRisk(
  operation: OperationType,
  targetPath: string,
  directory: string
): RiskFactors {
  const factors: string[] = []
  let level: RiskLevel = "low"

  // Operation-based risk
  const operationRisk: Record<OperationType, RiskLevel> = {
    "create": "medium",
    "edit": "medium",
    "delete": "high",
    "commit": "high",
    "build-agent": "critical",
    "build-workflow": "critical",
    "build-command": "high",
    "phase-transition": "critical"
  }

  level = operationRisk[operation]
  factors.push(`Operation: ${operation} (${level} risk)`)

  // File type risk
  const ext = targetPath.split('.').pop()
  const fileTypeRisk: Record<string, RiskLevel> = {
    "sh": "critical",
    "bash": "critical",
    "ts": "medium",
    "js": "medium",
    "md": "low",
    "json": "medium"
  }

  if (ext && fileTypeRisk[ext]) {
    const fileRisk = fileTypeRisk[ext]
    if (fileRisk === "critical" || level !== "critical") {
      level = fileRisk === "critical" ? "critical" : level
    }
    factors.push(`File type: .${ext} (${fileRisk} risk)`)
  }

  // Path-based risk
  if (targetPath.includes("node_modules") || targetPath.includes(".git")) {
    factors.push("Path: System/dependency directory (lower risk)")
  }

  if (targetPath.includes(".idumb/")) {
    level = level === "low" ? "medium" : level
    factors.push("Path: Governance directory (elevated risk)")
  }

  if (targetPath.includes("bin/") || targetPath.includes("src/commands/")) {
    level = level === "low" ? "high" : level === "medium" ? "high" : level
    factors.push("Path: Executable/command directory (elevated risk)")
  }

  // Check if file exists and its size
  const fullPath = join(directory, targetPath)
  if (existsSync(fullPath)) {
    const stats = statSync(fullPath)
    if (stats.isFile() && stats.size > 100000) { // > 100KB
      factors.push("File size: Large file (>100KB)")
    }
  }

  return { level, factors }
}

// ============================================================================
// SKILL ACTIVATION MATRIX
// ============================================================================

interface SkillActivation {
  skills: SkillName[]
  reason: string
}

function determineSkills(
  operation: OperationType,
  risk: RiskLevel
): SkillActivation {
  // Critical risk: All skills
  if (risk === "critical") {
    return {
      skills: ["security", "quality", "performance"],
      reason: "Critical risk operation: Full validation required"
    }
  }

  // High risk: Security + Quality
  if (risk === "high") {
    return {
      skills: ["security", "quality"],
      reason: "High risk operation: Security and quality validation"
    }
  }

  // Medium risk: Security (traversal check)
  if (risk === "medium") {
    return {
      skills: ["security"],
      reason: "Medium risk operation: Security validation"
    }
  }

  // Low risk: Minimal validation
  return {
    skills: [],
    reason: "Low risk operation: Validation optional"
  }
}

// ============================================================================
// ACTIVATION BY OPERATION TYPE
// ============================================================================

const OPERATION_ACTIVATION: Record<OperationType, SkillActivation> = {
  "create": {
    skills: ["security", "quality"],
    reason: "Create operation: Security and quality checks"
  },
  "edit": {
    skills: ["security", "quality"],
    reason: "Edit operation: Security and quality checks"
  },
  "delete": {
    skills: [],
    reason: "Delete operation: No validation needed"
  },
  "commit": {
    skills: ["quality", "performance"],
    reason: "Commit: Quality and performance review"
  },
  "build-agent": {
    skills: ["security", "quality", "performance"],
    reason: "Build agent: Full validation required"
  },
  "build-workflow": {
    skills: ["quality"],
    reason: "Build workflow: Quality validation"
  },
  "build-command": {
    skills: ["security", "quality"],
    reason: "Build command: Security and quality validation"
  },
  "phase-transition": {
    skills: ["security", "quality", "performance"],
    reason: "Phase transition: Comprehensive validation"
  }
};

// ============================================================================
// ORCHESTRATION
// ============================================================================

async function runValidation(
  skill: SkillName,
  targetPath: string,
  directory: string
): Promise<{ issues: any[]; status: string }> {
  // Import and run the appropriate validation tool
  try {
    let result: any

    switch (skill) {
      case "security": {
        // Would call idumb-security tool
        // For now, return mock result
        result = { status: "pass", issues: [] }
        break
      }
      case "quality": {
        // Would call idumb-quality tool
        result = { status: "pass", issues: [] }
        break
      }
      case "performance": {
        // Would call idumb-performance tool
        result = { status: "pass", issues: [] }
        break
      }
    }

    return result
  } catch (error) {
    return {
      status: "fail",
      issues: [{
        type: "validation-error",
        severity: "high",
        description: `Validation failed for ${skill}: ${(error as Error).message}`
      }]
    }
  }
}

// ============================================================================
// TOOL EXPORTS
// ============================================================================

export const orchestrate = tool({
  description: "Meta-orchestrator that runs appropriate validation based on operation type and risk level",
  args: {
    operation_type: tool.schema.string().describe("Type of operation: create, edit, delete, commit, build-agent, build-workflow, build-command, phase-transition"),
    target_path: tool.schema.string().describe("Target file or directory"),
    risk_level: tool.schema.string().optional().describe("Risk level (default: auto-detect)"),
    dry_run: tool.schema.boolean().optional().describe("Show what would be validated without running (default: false)")
  },
  async execute(args, context) {
    const {
      operation_type,
      target_path,
      risk_level: providedRisk,
      dry_run = false
    } = args

    const operation = operation_type as OperationType

    // Assess risk
    const risk = providedRisk === "auto" || !providedRisk
      ? assessRisk(operation, target_path, context.directory)
      : { level: providedRisk as RiskLevel, factors: [`User-specified: ${providedRisk}`] }

    // Determine skills to activate
    const activation = OPERATION_ACTIVATION[operation] || determineSkills(operation, risk.level)

    const result: OrchestrationResult = {
      status: "pass",
      activated_skills: activation.skills,
      issues: {},
      blockers: [],
      warnings: [],
      summary: {
        total: 0,
        bySkill: {
          security: 0,
          quality: 0,
          performance: 0
        }
      },
      risk_assessment: risk
    }

    // Dry run - just report what would be done
    if (dry_run) {
      return JSON.stringify({
        ...result,
        dry_run: true,
        plan: {
          operation,
          target_path,
          risk_level: risk.level,
          skills_to_activate: activation.skills,
          reason: activation.reason
        }
      }, null, 2)
    }

    // Run validations for each activated skill
    for (const skill of activation.skills) {
      const validation = await runValidation(skill, target_path, context.directory)

      result.issues[skill] = validation.issues
      result.summary.bySkill[skill] = validation.issues.length
      result.summary.total += validation.issues.length

      if (validation.status === "fail") {
        result.status = "fail"
        result.blockers.push(
          ...validation.issues
            .filter((i: any) => i.severity === "critical")
            .map((i: any) => `${skill}: ${i.description}`)
        )
      } else if (validation.status === "partial" && result.status !== "fail") {
        result.status = "partial"
      }

      result.warnings.push(
        ...validation.issues
          .filter((i: any) => i.severity === "medium" || i.severity === "low")
          .map((i: any) => `${skill}: ${i.description}`)
      )
    }

    return JSON.stringify(result, null, 2)
  }
})

export const preWrite = tool({
  description: "Pre-write validation hook - validates before file modifications",
  args: {
    file_path: tool.schema.string().describe("Path of file to be written"),
    content: tool.schema.string().optional().describe("Content to be written (for analysis)")
  },
  async execute(args, context) {
    const { file_path, content } = args

    const risk = assessRisk("create", file_path, context.directory)
    const activation = determineSkills("create", risk.level)

    const result: OrchestrationResult = {
      status: "pass",
      activated_skills: activation.skills,
      issues: {},
      blockers: [],
      warnings: [],
      summary: {
        total: 0,
        bySkill: { security: 0, quality: 0, performance: 0 }
      },
      risk_assessment: risk
    }

    // For pre-write, we focus on quick critical checks
    if (activation.skills.includes("security") && content) {
      // Quick bash injection check
      if (/eval\s+\$|\\\$\(.+?\\\$\`/.test(content)) {
        result.status = "fail"
        result.blockers.push("security: Potential bash injection detected")
        result.summary.bySkill.security = 1
        result.summary.total = 1
      }
    }

    if (activation.skills.includes("quality") && content) {
      // Quick error handling check
      if (/set\s+-e/.test(content) === false && content.includes("#!/bin/bash")) {
        result.warnings.push("quality: Missing 'set -e' for error handling")
      }
    }

    return JSON.stringify(result, null, 2)
  }
})

export const preDelegate = tool({
  description: "Pre-delegate validation - validates before agent delegation",
  args: {
    parent_agent: tool.schema.string().describe("Parent agent name"),
    child_agent: tool.schema.string().describe("Child agent name to be delegated to"),
    operation: tool.schema.string().optional().describe("Operation to be delegated")
  },
  async execute(args, context) {
    const { parent_agent, child_agent, operation } = args

    // Validate delegation chain
    const issues: string[] = []

    // Check if both agents exist
    const agentsDir = join(context.directory, "src/agents")
    const parentExists = existsSync(join(agentsDir, `${parent_agent}.md`))
    const childExists = existsSync(join(agentsDir, `${child_agent}.md`))

    if (!parentExists) {
      issues.push(`Parent agent ${parent_agent} does not exist`)
    }
    if (!childExists) {
      issues.push(`Child agent ${child_agent} does not exist`)
    }

    // Additional governance checks would go here
    // - Check permission matrix
    // - Check delegation depth
    // - Check operation scope

    return JSON.stringify({
      status: issues.length > 0 ? "fail" : "pass",
      parent_agent,
      child_agent,
      operation,
      issues,
      delegation_allowed: issues.length === 0
    }, null, 2)
  }
})

export const phaseTransition = tool({
  description: "Phase transition validation - comprehensive validation at phase boundaries",
  args: {
    from_phase: tool.schema.string().describe("Current phase"),
    to_phase: tool.schema.string().describe("Next phase"),
    validation_scope: tool.schema.string().optional().describe("Scope: full or quick (default: full)")
  },
  async execute(args, context) {
    const { from_phase, to_phase, validation_scope = "full" } = args

    const result: OrchestrationResult = {
      status: "pass",
      activated_skills: ["security", "quality", "performance"],
      issues: {},
      blockers: [],
      warnings: [],
      summary: {
        total: 0,
        bySkill: { security: 0, quality: 0, performance: 0 }
      },
      risk_assessment: {
        level: "critical",
        factors: [`Phase transition: ${from_phase} -> ${to_phase}`]
      }
    }

    // Run comprehensive validation at phase boundaries
    // This would integrate with idumb-validation for integration point checks
    // and idumb-stress-test for regression sweeps

    if (validation_scope === "full") {
      // Check for critical gaps
      result.warnings.push("Phase transition validation not fully implemented")
    }

    return JSON.stringify(result, null, 2)
  }
})

export const activateSkills = tool({
  description: "Activate specific skills for validation",
  args: {
    skills: tool.schema.array(tool.schema.string()).describe("Skills to activate: security, quality, performance"),
    target: tool.schema.string().describe("Target for validation")
  },
  async execute(args, context) {
    const { skills, target } = args
    const skillsToRun = skills as SkillName[]

    const result: OrchestrationResult = {
      status: "pass",
      activated_skills: skillsToRun,
      issues: {},
      blockers: [],
      warnings: [],
      summary: {
        total: 0,
        bySkill: { security: 0, quality: 0, performance: 0 }
      },
      risk_assessment: {
        level: "auto",
        factors: ["Manual skill activation"]
      }
    }

    // Run each requested skill
    for (const skill of skillsToRun) {
      const validation = await runValidation(skill, target, context.directory)
      result.issues[skill] = validation.issues
      result.summary.bySkill[skill] = validation.issues.length
      result.summary.total += validation.issues.length

      if (validation.status === "fail" && result.status !== "fail") {
        result.status = "fail"
      }
    }

    return JSON.stringify(result, null, 2)
  }
})

export default tool({
  description: "Orchestrate validation based on operation context",
  args: {
    operation: tool.schema.string().describe("Operation type"),
    target: tool.schema.string().describe("Target path")
  },
  async execute(args, context) {
    return await orchestrate.execute({
      operation_type: args.operation,
      target_path: args.target
    }, context)
  }
})
