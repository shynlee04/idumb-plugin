/**
 * iDumb Configuration Management Tool
 * 
 * Manages .idumb/config.json with user preferences, hierarchical paths,
 * and GSD integration (reads from .planning/config.json)
 * 
 * IMPORTANT: No console.log - would pollute TUI
 */

import { tool } from "@opencode-ai/plugin"
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs"
import { join } from "path"

// ============================================================================
// TYPES AND SCHEMA
// ============================================================================

// Config values that ENFORCE automation and INTEGRATE with GSD are ALLOWED
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
  // Governance settings - ALLOWED: enforces validation/automation, integrates with GSD mode
  governance: {
    level: "light" | "moderate" | "strict"  // Derived from GSD mode
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
  // GSD hierarchy mapping (mirrors GSD's milestone → phase → plan → task)
  hierarchy: {
    status: string[]    // ["milestone", "phase", "plan", "task"]
    agents: string[]    // ["coordinator", "governor", "validator", "builder"]
  }
  // GSD framework integration (line 212) - traces to GSD config.json
  frameworks: {
    gsd: {
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

interface GSDConfig {
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
      gsd: {
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

function getGSDConfigPath(directory: string): string {
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

function loadGSDConfig(directory: string): GSDConfig | null {
  const gsdPath = getGSDConfigPath(directory)
  
  if (existsSync(gsdPath)) {
    try {
      return JSON.parse(readFileSync(gsdPath, "utf8"))
    } catch {
      return null
    }
  }
  
  return null
}

// Reserved keys that iDumb must not allow users to set
// These are controlled by OpenCode or GSD, not by iDumb
const RESERVED_OPENCODE_KEYS = ['models', 'provider', 'temperature', 'topP', 'topK']
const RESERVED_GSD_KEYS = ['milestones', 'phases', 'agents', 'mode', 'depth', 'profile']

function isReservedKey(section: string, key: string): { reserved: boolean; owner?: string } {
  // Check if the key matches OpenCode or GSD reserved patterns
  if (RESERVED_OPENCODE_KEYS.some(r => key.includes(r) || r.includes(key))) {
    return { reserved: true, owner: 'OpenCode' }
  }
  if (RESERVED_GSD_KEYS.some(r => key.includes(r) || r.includes(key))) {
    return { reserved: true, owner: 'GSD' }
  }
  return { reserved: false }
}

// ============================================================================
// TOOLS
// ============================================================================

// Read configuration
export const read = tool({
  description: "Read iDumb configuration (merges with GSD config if present)",
  args: {
    section: tool.schema.string().optional().describe("Specific section: user, governance, paths, hierarchy, frameworks, staleness, timestamps")
  },
  async execute(args, context) {
    const config = loadConfig(context.directory)
    const gsdConfig = loadGSDConfig(context.directory)
    
    // Update GSD detection
    config.frameworks.gsd.detected = gsdConfig !== null
    
    // Build merged view
    const result: any = {
      idumb: args.section ? (config as any)[args.section] : config,
      gsd: gsdConfig || { detected: false },
      merged: {
        // Derive effective settings from both configs
        mode: gsdConfig?.mode || "interactive",
        profile: gsdConfig?.profile || "balanced",
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
          gsd: RESERVED_GSD_KEYS
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
  description: "Initialize .idumb/config.json with defaults and GSD detection",
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
    
    // Detect GSD
    const gsdConfig = loadGSDConfig(context.directory)
    config.frameworks.gsd.detected = gsdConfig !== null
    
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
      gsdDetected: gsdConfig !== null,
      pathsCreated: pathsToCreate.length
    }, null, 2)
  }
})

// Get hierarchical status (from GSD STATE.md)
export const status = tool({
  description: "Get current status at each hierarchy level (milestone, phase, plan, task)",
  args: {},
  async execute(args, context) {
    const config = loadConfig(context.directory)
    const result: any = {
      hierarchy: config.hierarchy.status,
      current: {}
    }
    
    // Check GSD STATE.md
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
      result.gsdNotFound = true
    }
    
    return JSON.stringify(result, null, 2)
  }
})

// Sync with GSD config
export const sync = tool({
  description: "Sync iDumb config with GSD .planning/config.json",
  args: {},
  async execute(args, context) {
    const config = loadConfig(context.directory)
    const gsdConfig = loadGSDConfig(context.directory)
    
    if (!gsdConfig) {
      return JSON.stringify({
        synced: false,
        reason: "GSD config not found at .planning/config.json"
      })
    }
    
    // Update detection
    config.frameworks.gsd.detected = true
    
    // Map GSD settings to governance
    if (gsdConfig.mode === "yolo") {
      config.governance.level = "light"
    } else if (gsdConfig.mode === "interactive") {
      config.governance.level = "moderate"
    }
    
    saveConfig(context.directory, config)
    
    return JSON.stringify({
      synced: true,
      gsdConfig,
      derivedGovernance: config.governance.level
    }, null, 2)
  }
})

// Default export: read full config
export default tool({
  description: "Read full iDumb configuration with GSD integration",
  args: {},
  async execute(args, context) {
    const config = loadConfig(context.directory)
    const gsdConfig = loadGSDConfig(context.directory)
    
    config.frameworks.gsd.detected = gsdConfig !== null
    
    return JSON.stringify({
      config,
      gsd: gsdConfig || null,
      configPath: getConfigPath(context.directory),
      gsdConfigPath: existsSync(getGSDConfigPath(context.directory)) 
        ? getGSDConfigPath(context.directory) 
        : null
    }, null, 2)
  }
})
