/**
 * iDumb Configuration Management Tool
 * 
 * Manages .idumb/config.json with user preferences, hierarchical paths,
 * and planning system integration (reads from .planning/config.json)
 * 
 * IMPORTANT: No console.log - would pollute TUI
 */

import { tool } from "@opencode-ai/plugin"
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs"
import { join } from "path"

// ============================================================================
// TYPES AND SCHEMA
// ============================================================================

// Config values that ENFORCE automation and INTEGRATE with planning systems are ALLOWED
// Values that BLOCK functionality (like specific model IDs) are NOT allowed
interface IdumbConfig {
  version: string
  // User preferences (line 202) - allowed: "what to call user, language"
  user: {
    name: string
    language: {
      communication: string  // Language for AI responses
      documents: string      // Language for generated artifacts
    }
  }
  // Governance settings - ALLOWED: enforces validation/automation
  governance: {
    level: "light" | "moderate" | "strict"  // Governance strictness level
    expertSkeptic: boolean                   // Enforces critical thinking
    autoValidation: boolean                  // Enables automatic governance
  }
  // Hierarchical paths (lines 204-210) - required
  paths: {
    state: {
      brain: string
      history: string
      anchors: string
    }
    artifacts: {
      governance: string
      validations: string
    }
    context: {
      codebase: string
      sessions: string
    }
  }
  // Hierarchy mapping (milestone → phase → plan → task)
  hierarchy: {
    status: string[]    // ["milestone", "phase", "plan", "task"]
    agents: string[]    // ["coordinator", "governor", "validator", "builder"]
  }
  // Planning system integration - reads from .planning/config.json
  frameworks: {
    planning: {
      detected: boolean
      configPath: string
      syncEnabled: boolean
    }
  }
  // Staleness detection (line 219, 237) - for stale check
  staleness: {
    warningThresholdHours: number
    purgeThresholdHours: number
  }
  // Timestamp injection settings (line 219)
  timestamps: {
    enabled: boolean
    format: "ISO8601" | "relative"
    frontmatterInjection: boolean
  }
}

interface PlanningConfig {
  mode?: "yolo" | "interactive"
  depth?: "quick" | "standard" | "comprehensive"
  profile?: "quality" | "balanced" | "budget"
  workflow?: {
    research?: boolean
    plan_check?: boolean
    verifier?: boolean
  }
  parallelization?: { enabled?: boolean }
  git?: {
    branching_strategy?: "none" | "phase" | "milestone"
  }
  commit_docs?: boolean
}

// ============================================================================
// DEFAULT CONFIG
// ============================================================================

function getDefaultConfig(): IdumbConfig {
  return {
    version: "0.1.0",
    user: {
      name: "Developer",
      language: {
        communication: "english",
        documents: "english"
      }
    },
    governance: {
      level: "moderate",
      expertSkeptic: true,
      autoValidation: true
    },
    paths: {
      state: {
        brain: ".idumb/brain/state.json",
        history: ".idumb/brain/history/",
        anchors: ".idumb/anchors/"
      },
      artifacts: {
        governance: ".idumb/governance/",
        validations: ".idumb/governance/validations/"
      },
      context: {
        codebase: ".idumb/brain/context/codebase.md",
        sessions: ".idumb/brain/context/sessions.md"
      }
    },
    hierarchy: {
      status: ["milestone", "phase", "plan", "task"],
      agents: ["coordinator", "governor", "validator", "builder"]
    },
    frameworks: {
      planning: {
        detected: false,
        configPath: ".planning/config.json",
        syncEnabled: true
      }
    },
    staleness: {
      warningThresholdHours: 48,
      purgeThresholdHours: 168
    },
    timestamps: {
      enabled: true,
      format: "ISO8601",
      frontmatterInjection: true
    }
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getConfigPath(directory: string): string {
  return join(directory, ".idumb", "config.json")
}

function getPlanningConfigPath(directory: string): string {
  return join(directory, ".planning", "config.json")
}

function loadConfig(directory: string): IdumbConfig {
  const configPath = getConfigPath(directory)
  
  if (existsSync(configPath)) {
    try {
      const content = readFileSync(configPath, "utf8")
      const loaded = JSON.parse(content)
      // Merge with defaults to handle missing fields
      return { ...getDefaultConfig(), ...loaded }
    } catch {
      return getDefaultConfig()
    }
  }
  
  return getDefaultConfig()
}

function saveConfig(directory: string, config: IdumbConfig): void {
  const configPath = getConfigPath(directory)
  const idumbDir = join(directory, ".idumb")
  
  if (!existsSync(idumbDir)) {
    mkdirSync(idumbDir, { recursive: true })
  }
  
  writeFileSync(configPath, JSON.stringify(config, null, 2))
}

function loadPlanningConfig(directory: string): PlanningConfig | null {
  const planningPath = getPlanningConfigPath(directory)
  
  if (existsSync(planningPath)) {
    try {
      return JSON.parse(readFileSync(planningPath, "utf8"))
    } catch {
      return null
    }
  }
  
  return null
}

// Reserved keys that iDumb must not allow users to set
// These are controlled by OpenCode or planning systems, not by iDumb
const RESERVED_OPENCODE_KEYS = ['models', 'provider', 'temperature', 'topP', 'topK']
const RESERVED_PLANNING_KEYS = ['milestones', 'phases', 'agents', 'mode', 'depth', 'profile']

function isReservedKey(section: string, key: string): { reserved: boolean; owner?: string } {
  // Check if the key matches OpenCode or planning reserved patterns
  if (RESERVED_OPENCODE_KEYS.some(r => key.includes(r) || r.includes(key))) {
    return { reserved: true, owner: 'OpenCode' }
  }
  if (RESERVED_PLANNING_KEYS.some(r => key.includes(r) || r.includes(key))) {
    return { reserved: true, owner: 'planning system' }
  }
  return { reserved: false }
}

// ============================================================================
// TOOLS
// ============================================================================

// Read configuration
export const read = tool({
  description: "Read iDumb configuration (merges with planning config if present)",
  args: {
    section: tool.schema.string().optional().describe("Specific section: user, governance, paths, hierarchy, frameworks, staleness, timestamps")
  },
  async execute(args, context) {
    const config = loadConfig(context.directory)
    const planningConfig = loadPlanningConfig(context.directory)
    
    // Update planning detection
    config.frameworks.planning.detected = planningConfig !== null
    
    // Build merged view
    const result: any = {
      idumb: args.section ? (config as any)[args.section] : config,
      planning: planningConfig || { detected: false },
      merged: {
        // Derive effective settings from both configs
        mode: planningConfig?.mode || "interactive",
        profile: planningConfig?.profile || "balanced",
        governance: config.governance.level
      }
    }
    
    return JSON.stringify(result, null, 2)
  }
})

// Update configuration
export const update = tool({
  description: "Update iDumb configuration values",
  args: {
    section: tool.schema.string().describe("Section to update: user, governance, paths, staleness, timestamps"),
    key: tool.schema.string().describe("Key within section (dot notation for nested, e.g., 'language.communication')"),
    value: tool.schema.string().describe("New value (JSON parsed if valid)")
  },
  async execute(args, context) {
    const config = loadConfig(context.directory)
    
    // Check for reserved keys
    const reservedCheck = isReservedKey(args.section, args.key)
    if (reservedCheck.reserved) {
      return JSON.stringify({
        error: `Key '${args.key}' is reserved by ${reservedCheck.owner}`,
        message: `This value is controlled by ${reservedCheck.owner}, not iDumb. ` +
                 `To change ${reservedCheck.owner} settings, use their respective configuration.`,
        reservedKeys: {
          opencode: RESERVED_OPENCODE_KEYS,
          planning: RESERVED_PLANNING_KEYS
        }
      }, null, 2)
    }
    
    try {
      // Parse value (might be JSON)
      let parsedValue: any
      try {
        parsedValue = JSON.parse(args.value)
      } catch {
        parsedValue = args.value
      }
      
      // Navigate to section
      const section = (config as any)[args.section]
      if (!section) {
        return JSON.stringify({ error: `Unknown section: ${args.section}` })
      }
      
      // Handle dot notation
      const keys = args.key.split(".")
      let target = section
      for (let i = 0; i < keys.length - 1; i++) {
        target = target[keys[i]]
        if (!target) {
          return JSON.stringify({ error: `Unknown key path: ${args.key}` })
        }
      }
      
      const finalKey = keys[keys.length - 1]
      const oldValue = target[finalKey]
      target[finalKey] = parsedValue
      
      saveConfig(context.directory, config)
      
      return JSON.stringify({
        updated: true,
        section: args.section,
        key: args.key,
        oldValue,
        newValue: parsedValue
      }, null, 2)
      
    } catch (e) {
      return JSON.stringify({ error: (e as Error).message })
    }
  }
})

// Initialize configuration
export const init = tool({
  description: "Initialize .idumb/config.json with defaults and planning system detection",
  args: {
    userName: tool.schema.string().optional().describe("User's preferred name"),
    language: tool.schema.string().optional().describe("Communication language (english, vietnamese, etc.)"),
    governanceLevel: tool.schema.string().optional().describe("Governance level: light, moderate, strict")
  },
  async execute(args, context) {
    const config = getDefaultConfig()
    
    // Apply overrides
    if (args.userName) {
      config.user.name = args.userName
    }
    if (args.language) {
      config.user.language.communication = args.language
      config.user.language.documents = args.language
    }
    if (args.governanceLevel) {
      config.governance.level = args.governanceLevel as any
    }
    
    // Detect planning system
    const planningConfig = loadPlanningConfig(context.directory)
    config.frameworks.planning.detected = planningConfig !== null
    
    // Create paths
    const pathsToCreate = [
      join(context.directory, ".idumb", "brain"),
      join(context.directory, ".idumb", "brain", "history"),
      join(context.directory, ".idumb", "brain", "context"),
      join(context.directory, ".idumb", "governance"),
      join(context.directory, ".idumb", "governance", "validations"),
      join(context.directory, ".idumb", "anchors")
    ]
    
    for (const path of pathsToCreate) {
      if (!existsSync(path)) {
        mkdirSync(path, { recursive: true })
      }
    }
    
    saveConfig(context.directory, config)
    
    return JSON.stringify({
      initialized: true,
      config,
      planningDetected: planningConfig !== null,
      pathsCreated: pathsToCreate.length
    }, null, 2)
  }
})

// Get hierarchical status (from STATE.md)
export const status = tool({
  description: "Get current status at each hierarchy level (milestone, phase, plan, task)",
  args: {},
  async execute(args, context) {
    const config = loadConfig(context.directory)
    const result: any = {
      hierarchy: config.hierarchy.status,
      current: {}
    }
    
    // Check STATE.md in .planning/
    const stateMdPath = join(context.directory, ".planning", "STATE.md")
    if (existsSync(stateMdPath)) {
      try {
        const content = readFileSync(stateMdPath, "utf8")
        
        // Parse phase
        const phaseMatch = content.match(/Phase:\s*\[(\d+)\]\s*of\s*\[(\d+)\]\s*\(([^)]+)\)/i)
        if (phaseMatch) {
          result.current.phase = {
            current: parseInt(phaseMatch[1]),
            total: parseInt(phaseMatch[2]),
            name: phaseMatch[3]
          }
        }
        
        // Parse plan
        const planMatch = content.match(/Plan:\s*\[(\d+)\]\s*of\s*\[(\d+)\]/i)
        if (planMatch) {
          result.current.plan = {
            current: parseInt(planMatch[1]),
            total: parseInt(planMatch[2])
          }
        }
        
        // Parse task
        const taskMatch = content.match(/Task:\s*\[(\d+)\]\s*of\s*\[(\d+)\]/i)
        if (taskMatch) {
          result.current.task = {
            current: parseInt(taskMatch[1]),
            total: parseInt(taskMatch[2])
          }
        }
        
      } catch {
        result.error = "Could not parse STATE.md"
      }
    } else {
      result.planningNotFound = true
    }
    
    return JSON.stringify(result, null, 2)
  }
})

// Sync with planning config
export const sync = tool({
  description: "Sync iDumb config with .planning/config.json",
  args: {},
  async execute(args, context) {
    const config = loadConfig(context.directory)
    const planningConfig = loadPlanningConfig(context.directory)
    
    if (!planningConfig) {
      return JSON.stringify({
        synced: false,
        reason: "Planning config not found at .planning/config.json"
      })
    }
    
    // Update detection
    config.frameworks.planning.detected = true
    
    // Map planning settings to governance
    if (planningConfig.mode === "yolo") {
      config.governance.level = "light"
    } else if (planningConfig.mode === "interactive") {
      config.governance.level = "moderate"
    }
    
    saveConfig(context.directory, config)
    
    return JSON.stringify({
      synced: true,
      planningConfig,
      derivedGovernance: config.governance.level
    }, null, 2)
  }
})

// Default export: read full config
export default tool({
  description: "Read full iDumb configuration with planning system integration",
  args: {},
  async execute(args, context) {
    const config = loadConfig(context.directory)
    const planningConfig = loadPlanningConfig(context.directory)
    
    config.frameworks.planning.detected = planningConfig !== null
    
    return JSON.stringify({
      config,
      planning: planningConfig || null,
      configPath: getConfigPath(context.directory),
      planningConfigPath: existsSync(getPlanningConfigPath(context.directory)) 
        ? getPlanningConfigPath(context.directory) 
        : null
    }, null, 2)
  }
})
