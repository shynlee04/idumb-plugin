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
    const brainDir = join(idumbDir, "brain")
    if (!existsSync(brainDir)) {
      results.push({
        check: "brain_dir",
        status: "fail",
        message: ".idumb/brain/ directory missing"
      })
    } else {
      results.push({
        check: "brain_dir",
        status: "pass",
        message: ".idumb/brain/ exists"
      })
    }
    
    // Check state.json
    const stateFile = join(brainDir, "state.json")
    if (!existsSync(stateFile)) {
      results.push({
        check: "state_file",
        status: "fail",
        message: ".idumb/brain/state.json missing"
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
        message: ".idumb/governance/ missing (optional)"
      })
    } else {
      results.push({
        check: "governance_dir",
        status: "pass",
        message: ".idumb/governance/ exists"
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
      const validFrameworks = ["gsd", "bmad", "custom", "none"]
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

// Validate GSD alignment
export const gsdAlignment = tool({
  description: "Check if iDumb state aligns with GSD state (if GSD is present)",
  args: {},
  async execute(args, context) {
    const results: ValidationResult[] = []
    
    // Check for GSD presence
    // IMPORTANT: GSD STATE.md lives in .planning/, NOT project root
    const planningDir = join(context.directory, ".planning")
    const projectMd = join(context.directory, "PROJECT.md")
    const roadmapMd = join(planningDir, "ROADMAP.md")  // In .planning/
    const stateMd = join(planningDir, "STATE.md")      // In .planning/
    
    const hasPlanning = existsSync(planningDir)
    const hasProject = existsSync(projectMd)
    const hasRoadmap = existsSync(roadmapMd)
    const hasState = existsSync(stateMd)
    
    const hasGSD = hasPlanning || hasProject || hasRoadmap || hasState
    
    if (!hasGSD) {
      return JSON.stringify({
        overall: "pass",
        checks: [{
          check: "gsd_detected",
          status: "pass",
          message: "GSD not detected - alignment check skipped"
        }],
        gsdPresent: false
      })
    }
    
    results.push({
      check: "gsd_detected",
      status: "pass",
      message: "GSD framework detected"
    })
    
    // Check individual GSD files
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
        
        if (idumbState.framework !== "gsd") {
          results.push({
            check: "framework_mismatch",
            status: "warning",
            message: `iDumb framework is "${idumbState.framework}" but GSD is detected`,
            evidence: "Consider running /idumb:init to update"
          })
        } else {
          results.push({
            check: "framework_match",
            status: "pass",
            message: "iDumb framework correctly set to 'gsd'"
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
        message: "iDumb not initialized but GSD present",
        evidence: "Run /idumb:init"
      })
    }
    
    const overall = results.some(r => r.status === "fail") ? "fail" : 
                    results.some(r => r.status === "warning") ? "warning" : "pass"
    
    return JSON.stringify({ 
      overall, 
      checks: results,
      gsdPresent: true
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
      await runCheck(gsdAlignment)
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
