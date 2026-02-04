/**
 * iDumb Validation Runner Tool
 * 
 * Runs validation checks on governance state, structure, and alignment
 * 
 * IMPORTANT: No console.log - would pollute TUI
 */

import { tool } from "@opencode-ai/plugin"
import { existsSync, readFileSync, statSync, readdirSync } from "fs"
import { join } from "path"

interface ValidationResult {
  check: string
  status: "pass" | "fail" | "warning"
  message: string
  evidence?: string
}

interface FullValidation {
  timestamp: string
  overall: "pass" | "fail" | "warning"
  checks: ValidationResult[]
  critical: string[]
  warnings: string[]
}

// Validate .idumb/ structure exists
export const structure = tool({
  description: "Validate .idumb/ directory structure integrity",
  args: {},
  async execute(args, context) {
    const results: ValidationResult[] = []
    const idumbDir = join(context.directory, ".idumb")

    // Check .idumb/ exists
    if (!existsSync(idumbDir)) {
      results.push({
        check: "idumb_dir",
        status: "fail",
        message: ".idumb/ directory does not exist",
        evidence: "Run /idumb:init to create"
      })
      return JSON.stringify({ overall: "fail", checks: results })
    }
    results.push({
      check: "idumb_dir",
      status: "pass",
      message: ".idumb/ directory exists"
    })

    // Check brain/ subdirectory
    const brainDir = join(idumbDir, "idumb-brain")
    if (!existsSync(brainDir)) {
      results.push({
        check: "brain_dir",
        status: "fail",
        message: ".idumb/idumb-brain/ directory missing"
      })
    } else {
      results.push({
        check: "brain_dir",
        status: "pass",
        message: ".idumb/idumb-brain/ exists"
      })
    }

    // Check state.json
    const stateFile = join(brainDir, "state.json")
    if (!existsSync(stateFile)) {
      results.push({
        check: "state_file",
        status: "fail",
        message: ".idumb/idumb-brain/state.json missing"
      })
    } else {
      results.push({
        check: "state_file",
        status: "pass",
        message: "state.json exists"
      })
    }

    // Check governance/ subdirectory
    const govDir = join(idumbDir, "governance")
    if (!existsSync(govDir)) {
      results.push({
        check: "governance_dir",
        status: "warning",
        message: ".idumb/idumb-brain/governance/ missing (optional)"
      })
    } else {
      results.push({
        check: "governance_dir",
        status: "pass",
        message: ".idumb/idumb-brain/governance/ exists"
      })
    }

    const overall = results.some(r => r.status === "fail") ? "fail" :
      results.some(r => r.status === "warning") ? "warning" : "pass"

    return JSON.stringify({ overall, checks: results }, null, 2)
  },
})

// Validate state.json schema
export const schema = tool({
  description: "Validate state.json has required fields and valid values",
  args: {},
  async execute(args, context) {
    const results: ValidationResult[] = []
    const stateFile = join(context.directory, ".idumb", "brain", "state.json")

    if (!existsSync(stateFile)) {
      return JSON.stringify({
        overall: "fail",
        checks: [{
          check: "file_exists",
          status: "fail",
          message: "state.json does not exist"
        }]
      })
    }

    try {
      const content = readFileSync(stateFile, "utf8")
      const state = JSON.parse(content)

      // Required fields
      const required = ["version", "initialized", "framework", "phase"]
      for (const field of required) {
        if (state[field] === undefined) {
          results.push({
            check: `field_${field}`,
            status: "fail",
            message: `Missing required field: ${field}`
          })
        } else {
          results.push({
            check: `field_${field}`,
            status: "pass",
            message: `${field}: ${state[field]}`
          })
        }
      }

      // Framework validation
      const validFrameworks = ["bmad", "planning", "idumb", "custom", "none"]
      if (state.framework && !validFrameworks.includes(state.framework)) {
        results.push({
          check: "framework_value",
          status: "warning",
          message: `Unknown framework: ${state.framework}`,
          evidence: `Valid: ${validFrameworks.join(", ")}`
        })
      }

      // Anchors array
      if (!Array.isArray(state.anchors)) {
        results.push({
          check: "anchors_array",
          status: "warning",
          message: "anchors should be an array"
        })
      } else {
        results.push({
          check: "anchors_array",
          status: "pass",
          message: `${state.anchors.length} anchors stored`
        })
      }

    } catch (e) {
      results.push({
        check: "json_parse",
        status: "fail",
        message: `Invalid JSON: ${(e as Error).message}`
      })
    }

    const overall = results.some(r => r.status === "fail") ? "fail" :
      results.some(r => r.status === "warning") ? "warning" : "pass"

    return JSON.stringify({ overall, checks: results }, null, 2)
  },
})

// Validate context freshness
export const freshness = tool({
  description: "Check for stale context (files older than 48 hours)",
  args: {
    maxAgeHours: tool.schema.number().optional().describe("Max age in hours (default: 48)")
  },
  async execute(args, context) {
    const results: ValidationResult[] = []
    const maxAge = (args.maxAgeHours || 48) * 60 * 60 * 1000 // Convert to ms
    const now = Date.now()
    const staleFiles: string[] = []

    const idumbDir = join(context.directory, ".idumb")
    if (!existsSync(idumbDir)) {
      return JSON.stringify({
        overall: "warning",
        checks: [{
          check: "idumb_exists",
          status: "warning",
          message: ".idumb/ not initialized"
        }]
      })
    }

    // Check key files
    const filesToCheck = [
      join(idumbDir, "brain", "state.json"),
    ]

    for (const file of filesToCheck) {
      if (existsSync(file)) {
        const stat = statSync(file)
        const age = now - stat.mtimeMs
        const ageHours = Math.round(age / (60 * 60 * 1000))

        if (age > maxAge) {
          staleFiles.push(file)
          results.push({
            check: `file_age_${file.split("/").pop()}`,
            status: "warning",
            message: `${file.split("/").pop()} is ${ageHours}h old (stale)`,
            evidence: `Last modified: ${new Date(stat.mtimeMs).toISOString()}`
          })
        } else {
          results.push({
            check: `file_age_${file.split("/").pop()}`,
            status: "pass",
            message: `${file.split("/").pop()} is ${ageHours}h old (fresh)`
          })
        }
      }
    }

    // Check anchors freshness
    const stateFile = join(idumbDir, "brain", "state.json")
    if (existsSync(stateFile)) {
      try {
        const state = JSON.parse(readFileSync(stateFile, "utf8"))
        if (Array.isArray(state.anchors)) {
          const staleAnchors = state.anchors.filter((a: any) => {
            const created = new Date(a.created).getTime()
            return (now - created) > maxAge
          })

          if (staleAnchors.length > 0) {
            results.push({
              check: "stale_anchors",
              status: "warning",
              message: `${staleAnchors.length} anchors are stale (>${args.maxAgeHours || 48}h)`
            })
          } else {
            results.push({
              check: "stale_anchors",
              status: "pass",
              message: "All anchors are fresh"
            })
          }
        }
      } catch {
        // Ignore parse errors here - schema check handles it
      }
    }

    const overall = staleFiles.length > 0 ? "warning" : "pass"

    return JSON.stringify({
      overall,
      checks: results,
      staleFiles
    }, null, 2)
  },
})

// Validate planning alignment
export const planningAlignment = tool({
  description: "Check if iDumb state aligns with planning state (if planning is present)",
  args: {},
  async execute(args, context) {
    const results: ValidationResult[] = []

    // Check for planning presence
    // IMPORTANT: STATE.md lives in .planning/, NOT project root
    const planningDir = join(context.directory, ".planning")
    const projectMd = join(context.directory, "PROJECT.md")
    const roadmapMd = join(planningDir, "ROADMAP.md")  // In .planning/
    const stateMd = join(planningDir, "STATE.md")      // In .planning/

    const hasPlanning = existsSync(planningDir)
    const hasProject = existsSync(projectMd)
    const hasRoadmap = existsSync(roadmapMd)
    const hasState = existsSync(stateMd)

    const hasPlanningSystem = hasPlanning || hasProject || hasRoadmap || hasState

    if (!hasPlanningSystem) {
      return JSON.stringify({
        overall: "pass",
        checks: [{
          check: "planning_detected",
          status: "pass",
          message: "No planning system detected - alignment check skipped"
        }],
        planningPresent: false
      })
    }

    results.push({
      check: "planning_detected",
      status: "pass",
      message: "Planning system detected"
    })

    // Check individual planning files
    if (hasPlanning) {
      results.push({
        check: "planning_dir",
        status: "pass",
        message: ".planning/ directory exists"
      })
    }

    if (hasProject) {
      results.push({
        check: "project_md",
        status: "pass",
        message: "PROJECT.md exists"
      })
    }

    if (hasRoadmap) {
      results.push({
        check: "roadmap_md",
        status: "pass",
        message: "ROADMAP.md exists"
      })
    }

    if (hasState) {
      results.push({
        check: "state_md",
        status: "pass",
        message: "STATE.md exists"
      })
    }

    // Check iDumb state framework setting
    const idumbStateFile = join(context.directory, ".idumb", "brain", "state.json")
    if (existsSync(idumbStateFile)) {
      try {
        const idumbState = JSON.parse(readFileSync(idumbStateFile, "utf8"))

        if (idumbState.framework !== "planning" && idumbState.framework !== "bmad" && idumbState.framework !== "idumb") {
          results.push({
            check: "framework_mismatch",
            status: "warning",
            message: `iDumb framework is "${idumbState.framework}" but planning system is detected`,
            evidence: "Consider running /idumb:init to update"
          })
        } else {
          results.push({
            check: "framework_match",
            status: "pass",
            message: `iDumb framework correctly set to '${idumbState.framework}'`
          })
        }
      } catch {
        results.push({
          check: "idumb_state_read",
          status: "fail",
          message: "Could not read iDumb state"
        })
      }
    } else {
      results.push({
        check: "idumb_initialized",
        status: "warning",
        message: "iDumb not initialized but planning system present",
        evidence: "Run /idumb:init"
      })
    }

    const overall = results.some(r => r.status === "fail") ? "fail" :
      results.some(r => r.status === "warning") ? "warning" : "pass"

    return JSON.stringify({
      overall,
      checks: results,
      planningPresent: true
    }, null, 2)
  },
})

// Full validation
export default tool({
  description: "Run all validation checks and return comprehensive report",
  args: {
    scope: tool.schema.string().optional().describe("Scope: all, structure, schema, freshness, alignment")
  },
  async execute(args, context) {
    const scope = args.scope || "all"
    const allResults: ValidationResult[] = []
    const critical: string[] = []
    const warnings: string[] = []

    const runCheck = async (checkFn: any) => {
      const result = await checkFn.execute({}, context)
      const parsed = JSON.parse(result)
      allResults.push(...(parsed.checks || []))
      return parsed
    }

    // Run checks based on scope
    if (scope === "all" || scope === "structure") {
      await runCheck(structure)
    }
    if (scope === "all" || scope === "schema") {
      await runCheck(schema)
    }
    if (scope === "all" || scope === "freshness") {
      await runCheck(freshness)
    }
    if (scope === "all" || scope === "alignment") {
      await runCheck(planningAlignment)
    }

    // Categorize issues
    for (const check of allResults) {
      if (check.status === "fail") {
        critical.push(`${check.check}: ${check.message}`)
      } else if (check.status === "warning") {
        warnings.push(`${check.check}: ${check.message}`)
      }
    }

    const overall = critical.length > 0 ? "fail" :
      warnings.length > 0 ? "warning" : "pass"

    const validation: FullValidation = {
      timestamp: new Date().toISOString(),
      overall,
      checks: allResults,
      critical,
      warnings,
    }

    return JSON.stringify(validation, null, 2)
  },
})

// ============================================================================
// P2-T1: INTEGRATION POINT VALIDATOR
// ============================================================================

interface IntegrationResult {
  tier: "agent" | "command" | "tool"
  name: string
  status: "pass" | "fail" | "warning"
  issues: string[]
  delegations?: string[]
  bindings?: string[]
  exports?: string[]
}

interface IntegrationReport {
  timestamp: string
  overall: "pass" | "fail" | "warning"
  agents: IntegrationResult[]
  commands: IntegrationResult[]
  tools: IntegrationResult[]
  summary: {
    total: number
    pass: number
    fail: number
    warning: number
  }
}

// Extract YAML frontmatter from markdown content
function extractYamlFrontmatter(content: string): Record<string, any> | null {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---/)
  if (!match) return null

  const yaml = match[1]
  const result: Record<string, any> = {}

  // Simple YAML parser for basic types
  const lines = yaml.split('\n')
  let currentKey = ''
  let currentObj: Record<string, any> = result
  const objStack: { key: string; obj: Record<string, any> }[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    // Check for nested object start
    if (trimmed.endsWith(':') && !trimmed.includes(': ')) {
      const key = trimmed.slice(0, -1)
      currentObj[key] = {}
      objStack.push({ key: currentKey, obj: currentObj })
      currentKey = key
      currentObj = currentObj[key]
      continue
    }

    // Check for key-value pair
    const colonIndex = trimmed.indexOf(': ')
    if (colonIndex > 0) {
      const key = trimmed.slice(0, colonIndex)
      let value: any = trimmed.slice(colonIndex + 2).trim()

      // Remove quotes
      if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
      }

      // Parse booleans
      if (value === 'true') value = true
      else if (value === 'false') value = false
      // Parse numbers
      else if (!isNaN(Number(value)) && value !== '') value = Number(value)

      currentObj[key] = value
    }
  }

  return result
}

// Validate agent integrations
async function validateAgentIntegrations(directory: string): Promise<IntegrationResult[]> {
  const results: IntegrationResult[] = []
  const agentsDir = join(directory, "template", "agents")

  if (!existsSync(agentsDir)) {
    return [{
      tier: "agent",
      name: "agents_dir",
      status: "fail",
      issues: ["src/agents/ directory does not exist"]
    }]
  }

  const files = readdirSync(agentsDir).filter(f => f.startsWith("idumb-") && f.endsWith(".md"))

  for (const file of files) {
    const filePath = join(agentsDir, file)
    const content = readFileSync(filePath, "utf8")
    const frontmatter = extractYamlFrontmatter(content)

    const agentName = file.replace(".md", "")
    const issues: string[] = []
    const delegations: string[] = []

    if (!frontmatter) {
      issues.push("Missing or invalid YAML frontmatter")
    } else {
      // Check for permission.task delegations
      if (frontmatter.permission?.task) {
        const taskPerms = frontmatter.permission.task
        for (const [task, perm] of Object.entries(taskPerms)) {
          if (perm === "allow" || perm === "ask") {
            delegations.push(task)
          }
        }
      }

      // Flag agents with no delegations
      if (delegations.length === 0) {
        issues.push("Agent has no task delegations defined")
      }

      // Check for required fields
      if (!frontmatter.description) {
        issues.push("Missing required field: description")
      }
      if (!frontmatter.mode) {
        issues.push("Missing required field: mode")
      }
    }

    const status = issues.length === 0 ? "pass" :
      issues.some(i => i.includes("required")) ? "fail" : "warning"

    results.push({
      tier: "agent",
      name: agentName,
      status,
      issues,
      delegations: delegations.length > 0 ? delegations : undefined
    })
  }

  return results
}

// Validate command integrations
async function validateCommandIntegrations(directory: string): Promise<IntegrationResult[]> {
  const results: IntegrationResult[] = []
  const commandsDir = join(directory, "template", "commands", "idumb")

  if (!existsSync(commandsDir)) {
    return [{
      tier: "command",
      name: "commands_dir",
      status: "fail",
      issues: ["src/commands/idumb/ directory does not exist"]
    }]
  }

  const files = readdirSync(commandsDir).filter(f => f.endsWith(".md"))

  for (const file of files) {
    const filePath = join(commandsDir, file)
    const content = readFileSync(filePath, "utf8")
    const frontmatter = extractYamlFrontmatter(content)

    const commandName = file.replace(".md", "")
    const issues: string[] = []
    let agentBinding: string | undefined

    if (!frontmatter) {
      issues.push("Missing or invalid YAML frontmatter")
    } else {
      // Check for agent binding
      if (frontmatter.agent) {
        agentBinding = frontmatter.agent
      } else {
        issues.push("Command has no agent binding defined")
      }

      // Check for required fields
      if (!frontmatter.description) {
        issues.push("Missing required field: description")
      }
    }

    const status = issues.length === 0 ? "pass" :
      issues.some(i => i.includes("required")) ? "fail" : "warning"

    results.push({
      tier: "command",
      name: commandName,
      status,
      issues,
      bindings: agentBinding ? [agentBinding] : undefined
    })
  }

  return results
}

// Validate tool integrations
async function validateToolIntegrations(directory: string): Promise<IntegrationResult[]> {
  const results: IntegrationResult[] = []
  const toolsDir = join(directory, "template", "tools")

  if (!existsSync(toolsDir)) {
    return [{
      tier: "tool",
      name: "tools_dir",
      status: "fail",
      issues: ["src/tools/ directory does not exist"]
    }]
  }

  const files = readdirSync(toolsDir).filter(f => f.startsWith("idumb-") && f.endsWith(".ts"))

  for (const file of files) {
    const filePath = join(toolsDir, file)
    const content = readFileSync(filePath, "utf8")

    const toolName = file.replace(".ts", "")
    const issues: string[] = []
    const exports: string[] = []

    // Check for exported tools
    const exportMatches = content.match(/export\s+(?:const|function|default)\s+(\w+)/g)
    if (exportMatches) {
      for (const match of exportMatches) {
        const nameMatch = match.match(/export\s+(?:const|function|default)\s+(\w+)/)
        if (nameMatch) {
          exports.push(nameMatch[1])
        }
      }
    }

    // Flag tools with no exports
    if (exports.length === 0) {
      issues.push("Tool has no exports defined")
    }

    // Check for tool() wrapper usage
    if (!content.includes("tool({")) {
      issues.push("Tool does not use @opencode-ai/plugin tool() wrapper")
    }

    const status = issues.length === 0 ? "pass" :
      issues.some(i => i.includes("no exports")) ? "fail" : "warning"

    results.push({
      tier: "tool",
      name: toolName,
      status,
      issues,
      exports: exports.length > 0 ? exports : undefined
    })
  }

  return results
}

// Integration points validation tool
export const integrationPoints = tool({
  description: "Validate integration points between agents, commands, and tools",
  args: {},
  async execute(args, context) {
    const agents = await validateAgentIntegrations(context.directory)
    const commands = await validateCommandIntegrations(context.directory)
    const tools = await validateToolIntegrations(context.directory)

    const allResults = [...agents, ...commands, ...tools]
    const pass = allResults.filter(r => r.status === "pass").length
    const fail = allResults.filter(r => r.status === "fail").length
    const warning = allResults.filter(r => r.status === "warning").length

    const overall = fail > 0 ? "fail" : warning > 0 ? "warning" : "pass"

    const report: IntegrationReport = {
      timestamp: new Date().toISOString(),
      overall,
      agents,
      commands,
      tools,
      summary: {
        total: allResults.length,
        pass,
        fail,
        warning
      }
    }

    return JSON.stringify(report, null, 2)
  }
})

// ============================================================================
// P2-T2: SCHEMA VALIDATION TOOLS
// ============================================================================

interface SchemaField {
  name: string
  type: "string" | "number" | "boolean" | "array" | "object"
  required: boolean
  allowedValues?: string[]
}

interface ArtifactSchema {
  name: string
  fields: SchemaField[]
}

// Schema definitions
const AGENT_SCHEMA: ArtifactSchema = {
  name: "agent",
  fields: [
    { name: "description", type: "string", required: true },
    { name: "mode", type: "string", required: true, allowedValues: ["primary", "all", "all"] },
    { name: "temperature", type: "number", required: false },
    { name: "permission", type: "object", required: true },
    { name: "tools", type: "object", required: false }
  ]
}

const COMMAND_SCHEMA: ArtifactSchema = {
  name: "command",
  fields: [
    { name: "description", type: "string", required: true },
    { name: "agent", type: "string", required: true },
    { name: "triggers", type: "array", required: false }
  ]
}

const PLAN_SCHEMA: ArtifactSchema = {
  name: "plan",
  fields: [
    { name: "phase", type: "string", required: true },
    { name: "goal", type: "string", required: true },
    { name: "tasks", type: "array", required: true }
  ]
}

// Validate frontmatter against schema
function validateFrontmatterAgainstSchema(
  frontmatter: Record<string, any>,
  schema: ArtifactSchema
): string[] {
  const errors: string[] = []

  for (const field of schema.fields) {
    const value = frontmatter[field.name]

    // Check required fields
    if (field.required && (value === undefined || value === null)) {
      errors.push(`Missing required field: ${field.name}`)
      continue
    }

    // Skip type validation if field is missing and not required
    if (value === undefined || value === null) {
      continue
    }

    // Validate type
    const actualType = Array.isArray(value) ? "array" : typeof value
    if (actualType !== field.type) {
      errors.push(`Field '${field.name}' should be ${field.type}, got ${actualType}`)
      continue
    }

    // Validate allowed values
    if (field.allowedValues && !field.allowedValues.includes(String(value))) {
      errors.push(`Field '${field.name}' value '${value}' not in allowed values: ${field.allowedValues.join(", ")}`)
    }
  }

  return errors
}

// Frontmatter validation tool
export const frontmatter = tool({
  description: "Validate YAML frontmatter against schema",
  args: {
    path: tool.schema.string().describe("Path to markdown file"),
    type: tool.schema.string().describe("Schema type: agent, command, or plan")
  },
  async execute(args, context) {
    const { path: filePath, type: schemaType } = args
    const fullPath = join(context.directory, filePath)

    // Select schema
    let schema: ArtifactSchema
    switch (schemaType) {
      case "agent":
        schema = AGENT_SCHEMA
        break
      case "command":
        schema = COMMAND_SCHEMA
        break
      case "plan":
        schema = PLAN_SCHEMA
        break
      default:
        return JSON.stringify({
          error: true,
          message: `Unknown schema type: ${schemaType}. Use: agent, command, or plan`
        })
    }

    // Check file exists
    if (!existsSync(fullPath)) {
      return JSON.stringify({
        error: true,
        message: `File not found: ${filePath}`
      })
    }

    // Read and parse
    const content = readFileSync(fullPath, "utf8")
    const frontmatterData = extractYamlFrontmatter(content)

    if (!frontmatterData) {
      return JSON.stringify({
        error: true,
        message: "Could not extract YAML frontmatter from file"
      })
    }

    // Validate
    const errors = validateFrontmatterAgainstSchema(frontmatterData, schema)

    return JSON.stringify({
      file: filePath,
      schema: schemaType,
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      frontmatter: frontmatterData
    }, null, 2)
  }
})

// Config schema validation tool
export const configSchema = tool({
  description: "Validate config file against schema",
  args: {
    configType: tool.schema.string().describe("Config type: state, config, etc.")
  },
  async execute(args, context) {
    const { configType } = args

    if (configType === "state") {
      const stateFile = join(context.directory, ".idumb", "brain", "state.json")

      if (!existsSync(stateFile)) {
        return JSON.stringify({
          error: true,
          message: "state.json does not exist"
        })
      }

      try {
        const content = readFileSync(stateFile, "utf8")
        const state = JSON.parse(content)
        const errors: string[] = []

        // Required fields for state.json
        const requiredFields = ["version", "initialized", "framework", "phase"]
        for (const field of requiredFields) {
          if (state[field] === undefined) {
            errors.push(`Missing required field: ${field}`)
          }
        }

        // Type validations
        if (state.version !== undefined && typeof state.version !== "string") {
          errors.push("Field 'version' should be string")
        }
        if (state.initialized !== undefined && typeof state.initialized !== "string") {
          errors.push("Field 'initialized' should be string (ISO date)")
        }
        if (state.framework !== undefined && typeof state.framework !== "string") {
          errors.push("Field 'framework' should be string")
        }
        if (state.phase !== undefined && typeof state.phase !== "string") {
          errors.push("Field 'phase' should be string")
        }

        // Valid framework values
        const validFrameworks = ["bmad", "planning", "idumb", "custom", "none"]
        if (state.framework && !validFrameworks.includes(state.framework)) {
          errors.push(`Framework '${state.framework}' not in valid values: ${validFrameworks.join(", ")}`)
        }

        // Anchors should be array
        if (state.anchors !== undefined && !Array.isArray(state.anchors)) {
          errors.push("Field 'anchors' should be an array")
        }

        return JSON.stringify({
          configType: "state",
          file: ".idumb/idumb-brain/state.json",
          valid: errors.length === 0,
          errors: errors.length > 0 ? errors : undefined,
          state: {
            version: state.version,
            framework: state.framework,
            phase: state.phase,
            initialized: state.initialized
          }
        }, null, 2)

      } catch (e) {
        return JSON.stringify({
          error: true,
          message: `Failed to parse state.json: ${(e as Error).message}`
        })
      }
    }

    if (configType === "config") {
      const configFile = join(context.directory, ".idumb", "config.json")

      if (!existsSync(configFile)) {
        return JSON.stringify({
          error: true,
          message: "config.json does not exist"
        })
      }

      try {
        const content = readFileSync(configFile, "utf8")
        const config = JSON.parse(content)
        const errors: string[] = []

        // Required fields for config.json
        if (config.user === undefined) {
          errors.push("Missing required field: user")
        }
        if (config.governance === undefined) {
          errors.push("Missing required field: governance")
        }

        // Type validations
        if (config.user !== undefined) {
          if (typeof config.user.name !== "string") {
            errors.push("Field 'user.name' should be string")
          }
          if (typeof config.user.language !== "string") {
            errors.push("Field 'user.language' should be string")
          }
        }

        if (config.governance !== undefined) {
          if (typeof config.governance.level !== "string") {
            errors.push("Field 'governance.level' should be string")
          }
          const validLevels = ["strict", "standard", "minimal"]
          if (config.governance.level && !validLevels.includes(config.governance.level)) {
            errors.push(`Governance level '${config.governance.level}' not in valid values: ${validLevels.join(", ")}`)
          }
        }

        return JSON.stringify({
          configType: "config",
          file: ".idumb/idumb-brain/config.json",
          valid: errors.length === 0,
          errors: errors.length > 0 ? errors : undefined
        }, null, 2)

      } catch (e) {
        return JSON.stringify({
          error: true,
          message: `Failed to parse config.json: ${(e as Error).message}`
        })
      }
    }

    return JSON.stringify({
      error: true,
      message: `Unknown config type: ${configType}. Use: state, config`
    })
  }
})
