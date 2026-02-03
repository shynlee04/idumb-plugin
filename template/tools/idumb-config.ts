/**
 * iDumb Master Configuration Tool
 * 
 * THIS IS THE SINGLE SOURCE OF TRUTH
 * - Loaded at session start by ALL agents
 * - Controls ALL workflow behavior
 * - MUST exist - auto-generated if missing
 * - Hierarchical values are linked and protected
 * 
 * CRITICAL: No console.log - would pollute TUI
 */

import { tool } from "@opencode-ai/plugin"
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs"
import { join } from "path"

// ============================================================================
// TYPES AND SCHEMA - THE SINGLE SOURCE OF TRUTH
// ============================================================================

/**
 * User experience levels - control automation behavior
 * 
 * pro: User drives, agents suggest
 * guided: Agents give rationale, suggest paths with explanation
 * strict: Non-negotiable guardrails, block unsafe actions
 */
type ExperienceLevel = "pro" | "guided" | "strict"

/**
 * Automation mode - derived from experience level
 */
type AutomationMode = "autonomous" | "confirmRequired" | "manualOnly"

/**
 * Agent permission definition
 */
interface AgentPermission {
  delegate: boolean
  execute: boolean
  validate: boolean
}

/**
 * iDumb Master Configuration Interface
 * 
 * THIS IS THE SINGLE SOURCE OF TRUTH
 * - Loaded at session start by ALL agents
 * - Controls ALL workflow behavior
 * - MUST exist - auto-generated if missing
 * - Hierarchical values are linked and protected
 */
interface IdumbConfig {
  // ═══════════════════════════════════════════════════════════════════════════
  // SCHEMA METADATA - Never modify directly
  // ═══════════════════════════════════════════════════════════════════════════
  version: string                    // Schema version "0.2.0"
  initialized: string                // ISO timestamp of creation
  lastModified: string               // ISO timestamp of last change
  
  // ═══════════════════════════════════════════════════════════════════════════
  // USER PREFERENCES - Personalization
  // ═══════════════════════════════════════════════════════════════════════════
  user: {
    name: string                     // How to address user
    experience: ExperienceLevel      // "pro" | "guided" | "strict"
    language: {
      communication: string          // AI response language
      documents: string              // Artifact language
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // GOVERNANCE STATUS - Current state (linked to state.json)
  // ═══════════════════════════════════════════════════════════════════════════
  status: {
    current: {
      milestone: string | null       // e.g., "M1"
      phase: string | null           // e.g., "1/5 (Core Config)"
      plan: string | null            // e.g., "01-02-PLAN"
      task: string | null            // e.g., "T3"
    }
    lastValidation: string | null    // ISO timestamp
    validationsPassed: number        // Count of successful validations
    driftDetected: boolean           // True if state differs from artifacts
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // HIERARCHY CONTROL - The chain that cannot break
  // ═══════════════════════════════════════════════════════════════════════════
  hierarchy: {
    // Status progression - each level depends on prior
    levels: readonly ["milestone", "phase", "plan", "task"]
    
    // Agent delegation chain - strict order
    agents: {
      order: readonly ["coordinator", "governance", "validator", "builder"]
      permissions: {
        coordinator: AgentPermission
        governance: AgentPermission
        validator: AgentPermission
        builder: AgentPermission
      }
    }
    
    // Chain integrity - if broken, block operations
    enforceChain: boolean            // Default: true
    blockOnChainBreak: boolean       // Default: true
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // AUTOMATION CONTROL - How agents behave
  // ═══════════════════════════════════════════════════════════════════════════
  automation: {
    // Derived from user.experience, but can be overridden
    mode: AutomationMode
    
    // Expert-skeptic mode (from governance protocol)
    expertSkeptic: {
      enabled: boolean               // Always verify before acting
      requireEvidence: boolean       // Demand proof for claims
      doubleCheckDelegation: boolean // Verify delegation chains
    }
    
    // Context-first enforcement
    contextFirst: {
      enforced: boolean              // Must read context before acting
      requiredFirstTools: string[]   // ["idumb-todo", "idumb-state"]
      blockWithoutContext: boolean   // Block if context not gathered
    }
    
    // Workflow controls
    workflow: {
      research: boolean              // Enable research phase
      planCheck: boolean             // Verify plans before execution
      verifyAfterExecution: boolean  // Validate after each task
      commitOnComplete: boolean      // Git commit on phase complete
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // PATH CONFIGURATION - Where everything lives
  // ═══════════════════════════════════════════════════════════════════════════
  paths: {
    config: string                   // This file (self-referential)
    state: string                    // Runtime state
    
    // Directories
    brain: string
    history: string
    context: string
    governance: string
    validations: string
    anchors: string
    sessions: string
    
    // Planning artifacts (read-only for iDumb)
    planning: string
    roadmap: string
    planningState: string
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // STALENESS DETECTION - Prevent drift
  // ═══════════════════════════════════════════════════════════════════════════
  staleness: {
    warningHours: number             // Warn if artifacts older than this
    criticalHours: number            // Block if older than this
    checkOnLoad: boolean             // Check staleness at session start
    autoArchive: boolean             // Archive stale artifacts
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // TIMESTAMPS - Metadata control
  // ═══════════════════════════════════════════════════════════════════════════
  timestamps: {
    enabled: boolean
    format: "ISO8601"
    injectInFrontmatter: boolean     // Add to YAML headers
    trackModifications: boolean      // Shadow tracking
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // ENFORCEMENT FLAGS - What to check on load
  // ═══════════════════════════════════════════════════════════════════════════
  enforcement: {
    mustLoadConfig: true             // ALWAYS TRUE - non-negotiable
    mustHaveState: boolean           // state.json must exist
    mustCheckHierarchy: boolean      // Validate hierarchy chain
    blockOnMissingArtifacts: boolean // Block if required files missing
    requirePhaseAlignment: boolean   // Phase in config == phase in state
  }
}

/**
 * Planning config interface (for sync with .planning/config.json)
 */
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

/**
 * Default state interface for state.json
 */
interface IdumbState {
  version: string
  initialized: string
  framework: "idumb" | "planning" | "bmad" | "custom" | "none"
  phase: string
  lastValidation: string | null
  validationCount: number
  anchors: Array<{
    id: string
    created: string
    type: string
    content: string
    priority: string
  }>
  history: Array<{
    timestamp: string
    action: string
    agent: string
    result: string
  }>
}

// ============================================================================
// AUTOMATION SETTINGS BY EXPERIENCE LEVEL
// ============================================================================

/**
 * Get automation settings based on experience level
 */
function getAutomationByExperience(experience: ExperienceLevel): IdumbConfig["automation"] {
  const settings: Record<ExperienceLevel, IdumbConfig["automation"]> = {
    pro: {
      mode: "autonomous",
      expertSkeptic: {
        enabled: true,
        requireEvidence: false,
        doubleCheckDelegation: false
      },
      contextFirst: {
        enforced: true,
        requiredFirstTools: ["idumb-todo"],
        blockWithoutContext: false
      },
      workflow: {
        research: true,
        planCheck: false,
        verifyAfterExecution: false,
        commitOnComplete: true
      }
    },
    guided: {
      mode: "confirmRequired",
      expertSkeptic: {
        enabled: true,
        requireEvidence: true,
        doubleCheckDelegation: true
      },
      contextFirst: {
        enforced: true,
        requiredFirstTools: ["idumb-todo", "idumb-state"],
        blockWithoutContext: true
      },
      workflow: {
        research: true,
        planCheck: true,
        verifyAfterExecution: true,
        commitOnComplete: true
      }
    },
    strict: {
      mode: "manualOnly",
      expertSkeptic: {
        enabled: true,
        requireEvidence: true,
        doubleCheckDelegation: true
      },
      contextFirst: {
        enforced: true,
        requiredFirstTools: ["idumb-todo", "idumb-state", "idumb-config"],
        blockWithoutContext: true
      },
      workflow: {
        research: true,
        planCheck: true,
        verifyAfterExecution: true,
        commitOnComplete: true
      }
    }
  }
  
  return settings[experience]
}

// ============================================================================
// DEFAULT CONFIG GENERATOR
// ============================================================================

/**
 * Generate default config based on experience level
 * 
 * @param experience - User's experience level (default: "guided")
 * @returns Complete IdumbConfig object
 */
function getDefaultConfig(experience: ExperienceLevel = "guided"): IdumbConfig {
  const now = new Date().toISOString()
  
  return {
    version: "0.2.0",
    initialized: now,
    lastModified: now,
    
    user: {
      name: "Developer",
      experience,
      language: {
        communication: "english",
        documents: "english"
      }
    },
    
    status: {
      current: {
        milestone: null,
        phase: null,
        plan: null,
        task: null
      },
      lastValidation: null,
      validationsPassed: 0,
      driftDetected: false
    },
    
    hierarchy: {
      levels: ["milestone", "phase", "plan", "task"] as const,
      agents: {
        order: ["coordinator", "governance", "validator", "builder"] as const,
        permissions: {
          coordinator: { delegate: true, execute: false, validate: false },
          governance: { delegate: true, execute: false, validate: false },
          validator: { delegate: false, execute: false, validate: true },
          builder: { delegate: false, execute: true, validate: false }
        }
      },
      enforceChain: true,
      blockOnChainBreak: true
    },
    
    automation: getAutomationByExperience(experience),
    
    paths: {
      config: ".idumb/config.json",
      state: ".idumb/brain/state.json",
      brain: ".idumb/brain/",
      history: ".idumb/brain/history/",
      context: ".idumb/brain/context/",
      governance: ".idumb/governance/",
      validations: ".idumb/governance/validations/",
      anchors: ".idumb/anchors/",
      sessions: ".idumb/sessions/",
      planning: ".planning/",
      roadmap: ".planning/ROADMAP.md",
      planningState: ".planning/STATE.md"
    },
    
    staleness: {
      warningHours: 48,
      criticalHours: 168,
      checkOnLoad: true,
      autoArchive: false
    },
    
    timestamps: {
      enabled: true,
      format: "ISO8601",
      injectInFrontmatter: true,
      trackModifications: true
    },
    
    enforcement: {
      mustLoadConfig: true,
      mustHaveState: true,
      mustCheckHierarchy: true,
      blockOnMissingArtifacts: experience === "strict",
      requirePhaseAlignment: true
    }
  }
}

/**
 * Get default state for state.json
 */
function getDefaultState(): IdumbState {
  return {
    version: "0.2.0",
    initialized: new Date().toISOString(),
    framework: "idumb",
    phase: "init",
    lastValidation: null,
    validationCount: 0,
    anchors: [],
    history: []
  }
}

// ============================================================================
// CRITICAL: ENSURE CONFIG EXISTS - AUTO-GENERATE IF MISSING
// ============================================================================

/**
 * CRITICAL: Ensures config exists - generates if missing
 * Called at EVERY session start, by EVERY agent
 * NEVER returns null - always creates if missing
 * 
 * @param directory - Project root directory
 * @returns Complete IdumbConfig object (never null)
 */
function ensureConfigExists(directory: string): IdumbConfig {
  const configPath = join(directory, ".idumb", "config.json")
  const idumbDir = join(directory, ".idumb")
  
  // Create .idumb directory if missing
  if (!existsSync(idumbDir)) {
    mkdirSync(idumbDir, { recursive: true })
  }
  
  // If config exists, read and validate
  if (existsSync(configPath)) {
    try {
      const content = readFileSync(configPath, "utf8")
      const config = JSON.parse(content) as IdumbConfig
      
      // Validate required fields exist
      if (!config.version || !config.user || !config.hierarchy) {
        throw new Error("Config missing required fields")
      }
      
      // Update lastModified for this access
      return config
    } catch (error) {
      // Config corrupted - backup and regenerate
      const backupPath = join(idumbDir, `config.backup.${Date.now()}.json`)
      if (existsSync(configPath)) {
        try {
          writeFileSync(backupPath, readFileSync(configPath))
        } catch {
          // Ignore backup failures
        }
      }
    }
  }
  
  // Generate default config
  const defaultConfig = getDefaultConfig("guided")
  
  // Create all required directories
  const dirs = [
    join(directory, ".idumb", "brain"),
    join(directory, ".idumb", "brain", "history"),
    join(directory, ".idumb", "brain", "context"),
    join(directory, ".idumb", "governance"),
    join(directory, ".idumb", "governance", "validations"),
    join(directory, ".idumb", "anchors"),
    join(directory, ".idumb", "sessions")
  ]
  
  for (const dir of dirs) {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }
  }
  
  // Write config
  writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2))
  
  // Also ensure state.json exists
  const statePath = join(directory, ".idumb", "brain", "state.json")
  if (!existsSync(statePath)) {
    const defaultState = getDefaultState()
    writeFileSync(statePath, JSON.stringify(defaultState, null, 2))
  }
  
  return defaultConfig
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

/**
 * Load config - uses ensureConfigExists to guarantee a config is returned
 */
function loadConfig(directory: string): IdumbConfig {
  return ensureConfigExists(directory)
}

/**
 * Save config with lastModified update
 */
function saveConfig(directory: string, config: IdumbConfig): void {
  const configPath = getConfigPath(directory)
  const idumbDir = join(directory, ".idumb")
  
  if (!existsSync(idumbDir)) {
    mkdirSync(idumbDir, { recursive: true })
  }
  
  config.lastModified = new Date().toISOString()
  writeFileSync(configPath, JSON.stringify(config, null, 2))
}

/**
 * Load planning config (returns null if not found)
 */
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

/**
 * Update config status from STATE.md
 */
function syncStatusFromPlanning(directory: string, config: IdumbConfig): IdumbConfig {
  const stateMdPath = join(directory, ".planning", "STATE.md")
  
  if (existsSync(stateMdPath)) {
    try {
      const content = readFileSync(stateMdPath, "utf8")
      
      // Parse milestone
      const milestoneMatch = content.match(/Milestone:\s*\[([^\]]+)\]/i)
      if (milestoneMatch) {
        config.status.current.milestone = milestoneMatch[1]
      }
      
      // Parse phase
      const phaseMatch = content.match(/Phase:\s*\[(\d+)\]\s*of\s*\[(\d+)\]\s*\(([^)]+)\)/i)
      if (phaseMatch) {
        config.status.current.phase = `${phaseMatch[1]}/${phaseMatch[2]} (${phaseMatch[3]})`
      }
      
      // Parse plan
      const planMatch = content.match(/Plan:\s*\[([^\]]+)\]/i)
      if (planMatch) {
        config.status.current.plan = planMatch[1]
      }
      
      // Parse task
      const taskMatch = content.match(/Task:\s*\[([^\]]+)\]/i)
      if (taskMatch) {
        config.status.current.task = taskMatch[1]
      }
    } catch {
      // Failed to parse - keep current status
    }
  }
  
  return config
}

/**
 * Check for drift between config status and planning artifacts
 */
function detectDrift(directory: string, config: IdumbConfig): boolean {
  // Check if state.json matches config status
  const statePath = join(directory, ".idumb", "brain", "state.json")
  
  if (existsSync(statePath)) {
    try {
      const state = JSON.parse(readFileSync(statePath, "utf8"))
      
      // Compare phase
      if (state.phase && config.status.current.phase) {
        // Simple drift detection - phases should align
        if (!state.phase.includes(config.status.current.phase.split(" ")[0])) {
          return true
        }
      }
    } catch {
      // Can't detect drift if state is corrupted
    }
  }
  
  return false
}

// Reserved keys that iDumb must not allow users to set
const RESERVED_OPENCODE_KEYS = ["models", "provider", "temperature", "topP", "topK"]
const RESERVED_PLANNING_KEYS = ["milestones", "phases", "agents", "mode", "depth", "profile"]

function isReservedKey(section: string, key: string): { reserved: boolean; owner?: string } {
  if (RESERVED_OPENCODE_KEYS.some(r => key.includes(r) || r.includes(key))) {
    return { reserved: true, owner: "OpenCode" }
  }
  if (RESERVED_PLANNING_KEYS.some(r => key.includes(r) || r.includes(key))) {
    return { reserved: true, owner: "planning system" }
  }
  return { reserved: false }
}

// ============================================================================
// TOOLS EXPORT - All configuration management tools
// ============================================================================

/**
 * Read configuration (merges with planning config if present)
 */
export const read = tool({
  description: "Read iDumb configuration (merges with planning config if present)",
  args: {
    section: tool.schema.string().optional().describe("Specific section: user, status, hierarchy, automation, paths, staleness, timestamps, enforcement")
  },
  async execute(args, context) {
    const config = loadConfig(context.directory)
    const planningConfig = loadPlanningConfig(context.directory)
    
    // Sync status from planning if available
    const syncedConfig = syncStatusFromPlanning(context.directory, config)
    
    // Check for drift
    syncedConfig.status.driftDetected = detectDrift(context.directory, syncedConfig)
    
    // Build merged view
    const result: any = {
      idumb: args.section ? (syncedConfig as any)[args.section] : syncedConfig,
      planning: planningConfig || { detected: false },
      merged: {
        mode: planningConfig?.mode || "interactive",
        profile: planningConfig?.profile || "balanced",
        experience: syncedConfig.user.experience,
        automationMode: syncedConfig.automation.mode
      }
    }
    
    return JSON.stringify(result, null, 2)
  }
})

/**
 * Update configuration values
 */
export const update = tool({
  description: "Update iDumb configuration values",
  args: {
    section: tool.schema.string().describe("Section to update: user, automation, staleness, timestamps, enforcement"),
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
    
    // Prevent modification of protected sections
    if (["version", "initialized", "status", "hierarchy"].includes(args.section)) {
      return JSON.stringify({
        error: `Section '${args.section}' is protected`,
        message: "Version, initialized, status, and hierarchy are controlled by the system."
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
      
      // If experience level changed, update automation settings
      if (args.section === "user" && args.key === "experience") {
        const newExperience = parsedValue as ExperienceLevel
        if (["pro", "guided", "strict"].includes(newExperience)) {
          config.automation = getAutomationByExperience(newExperience)
        }
      }
      
      saveConfig(context.directory, config)
      
      return JSON.stringify({
        updated: true,
        section: args.section,
        key: args.key,
        oldValue,
        newValue: parsedValue,
        experienceTriggeredAutomationUpdate: args.key === "experience"
      }, null, 2)
      
    } catch (e) {
      return JSON.stringify({ error: (e as Error).message })
    }
  }
})

/**
 * Initialize configuration with defaults and planning detection
 */
export const init = tool({
  description: "Initialize .idumb/config.json with defaults and planning system detection",
  args: {
    userName: tool.schema.string().optional().describe("User's preferred name"),
    language: tool.schema.string().optional().describe("Communication language (english, vietnamese, etc.)"),
    governanceLevel: tool.schema.string().optional().describe("DEPRECATED - use experience instead"),
    experience: tool.schema.string().optional().describe("Experience level: pro, guided, strict")
  },
  async execute(args, context) {
    // Determine experience level
    let experience: ExperienceLevel = "guided"
    if (args.experience && ["pro", "guided", "strict"].includes(args.experience)) {
      experience = args.experience as ExperienceLevel
    } else if (args.governanceLevel) {
      // Map old governance levels to experience
      const mapping: Record<string, ExperienceLevel> = {
        "light": "pro",
        "moderate": "guided",
        "strict": "strict"
      }
      experience = mapping[args.governanceLevel] || "guided"
    }
    
    const config = getDefaultConfig(experience)
    
    // Apply overrides
    if (args.userName) {
      config.user.name = args.userName
    }
    if (args.language) {
      config.user.language.communication = args.language
      config.user.language.documents = args.language
    }
    
    // Detect planning system
    const planningConfig = loadPlanningConfig(context.directory)
    
    // Create all paths
    const pathsToCreate = [
      join(context.directory, ".idumb", "brain"),
      join(context.directory, ".idumb", "brain", "history"),
      join(context.directory, ".idumb", "brain", "context"),
      join(context.directory, ".idumb", "governance"),
      join(context.directory, ".idumb", "governance", "validations"),
      join(context.directory, ".idumb", "anchors"),
      join(context.directory, ".idumb", "sessions")
    ]
    
    for (const path of pathsToCreate) {
      if (!existsSync(path)) {
        mkdirSync(path, { recursive: true })
      }
    }
    
    saveConfig(context.directory, config)
    
    // Ensure state.json exists
    const statePath = join(context.directory, ".idumb", "brain", "state.json")
    if (!existsSync(statePath)) {
      const defaultState = getDefaultState()
      writeFileSync(statePath, JSON.stringify(defaultState, null, 2))
    }
    
    return JSON.stringify({
      initialized: true,
      config,
      experience,
      automationMode: config.automation.mode,
      planningDetected: planningConfig !== null,
      pathsCreated: pathsToCreate.length
    }, null, 2)
  }
})

/**
 * Get hierarchical status (milestone, phase, plan, task)
 */
export const status = tool({
  description: "Get current status at each hierarchy level (milestone, phase, plan, task)",
  args: {},
  async execute(args, context) {
    const config = loadConfig(context.directory)
    
    // Sync from planning artifacts
    const syncedConfig = syncStatusFromPlanning(context.directory, config)
    
    // Check for drift
    syncedConfig.status.driftDetected = detectDrift(context.directory, syncedConfig)
    
    const result = {
      hierarchy: {
        levels: syncedConfig.hierarchy.levels,
        agents: syncedConfig.hierarchy.agents.order
      },
      current: syncedConfig.status.current,
      meta: {
        lastValidation: syncedConfig.status.lastValidation,
        validationsPassed: syncedConfig.status.validationsPassed,
        driftDetected: syncedConfig.status.driftDetected
      },
      chain: {
        enforceChain: syncedConfig.hierarchy.enforceChain,
        blockOnChainBreak: syncedConfig.hierarchy.blockOnChainBreak,
        chainIntact: !syncedConfig.status.driftDetected
      }
    }
    
    return JSON.stringify(result, null, 2)
  }
})

/**
 * Sync with planning config
 */
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
    
    // Sync status from STATE.md
    const syncedConfig = syncStatusFromPlanning(context.directory, config)
    
    // Map planning settings to automation
    if (planningConfig.mode === "yolo") {
      syncedConfig.user.experience = "pro"
      syncedConfig.automation = getAutomationByExperience("pro")
    } else if (planningConfig.mode === "interactive") {
      syncedConfig.user.experience = "guided"
      syncedConfig.automation = getAutomationByExperience("guided")
    }
    
    saveConfig(context.directory, syncedConfig)
    
    return JSON.stringify({
      synced: true,
      planningConfig,
      derivedExperience: syncedConfig.user.experience,
      derivedAutomationMode: syncedConfig.automation.mode,
      currentStatus: syncedConfig.status.current
    }, null, 2)
  }
})

/**
 * CRITICAL: Ensure config exists - auto-generate if missing
 * This is the function that MUST be called at session start
 */
export const ensure = tool({
  description: "Ensure config exists - auto-generates if missing. MUST be called at session start by all agents.",
  args: {
    experience: tool.schema.string().optional().describe("Experience level for new config: pro, guided, strict")
  },
  async execute(args, context) {
    const configPath = getConfigPath(context.directory)
    const existed = existsSync(configPath)
    
    // If doesn't exist and experience provided, create with that level
    if (!existed && args.experience && ["pro", "guided", "strict"].includes(args.experience)) {
      const config = getDefaultConfig(args.experience as ExperienceLevel)
      
      // Create directories
      const dirs = [
        join(context.directory, ".idumb", "brain"),
        join(context.directory, ".idumb", "brain", "history"),
        join(context.directory, ".idumb", "brain", "context"),
        join(context.directory, ".idumb", "governance"),
        join(context.directory, ".idumb", "governance", "validations"),
        join(context.directory, ".idumb", "anchors"),
        join(context.directory, ".idumb", "sessions")
      ]
      
      for (const dir of dirs) {
        if (!existsSync(dir)) {
          mkdirSync(dir, { recursive: true })
        }
      }
      
      saveConfig(context.directory, config)
      
      // Ensure state.json
      const statePath = join(context.directory, ".idumb", "brain", "state.json")
      if (!existsSync(statePath)) {
        const defaultState = getDefaultState()
        writeFileSync(statePath, JSON.stringify(defaultState, null, 2))
      }
      
      return JSON.stringify({
        existed: false,
        created: true,
        experience: args.experience,
        configPath,
        message: "Config auto-generated with specified experience level"
      }, null, 2)
    }
    
    // Use ensureConfigExists for standard flow
    const config = ensureConfigExists(context.directory)
    
    return JSON.stringify({
      existed,
      created: !existed,
      version: config.version,
      experience: config.user.experience,
      automationMode: config.automation.mode,
      configPath,
      message: existed ? "Config loaded successfully" : "Config auto-generated with 'guided' experience level"
    }, null, 2)
  }
})

/**
 * Default export: read full config with planning integration
 */
export default tool({
  description: "Read full iDumb configuration with planning system integration",
  args: {},
  async execute(args, context) {
    // CRITICAL: Ensure config exists first
    const config = ensureConfigExists(context.directory)
    const planningConfig = loadPlanningConfig(context.directory)
    
    // Sync status
    const syncedConfig = syncStatusFromPlanning(context.directory, config)
    syncedConfig.status.driftDetected = detectDrift(context.directory, syncedConfig)
    
    return JSON.stringify({
      config: syncedConfig,
      planning: planningConfig || null,
      meta: {
        configPath: getConfigPath(context.directory),
        planningConfigPath: existsSync(getPlanningConfigPath(context.directory)) 
          ? getPlanningConfigPath(context.directory) 
          : null,
        experience: syncedConfig.user.experience,
        automationMode: syncedConfig.automation.mode,
        chainIntact: !syncedConfig.status.driftDetected
      }
    }, null, 2)
  }
})
