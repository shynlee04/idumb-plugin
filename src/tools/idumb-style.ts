/**
 * iDumb Style Management Tool
 * 
 * Provides programmatic access to output style operations.
 * Used by /idumb:style command and direct agent invocation.
 * 
 * CRITICAL: NO console.log - causes TUI background text exposure
 */

import { tool } from "@opencode-ai/plugin"
import { 
  listAvailableStyles, 
  loadStyle,
  ensureStylesDir
} from "../plugins/lib/styles"
import { readState, writeState } from "../plugins/lib/state"
import { log } from "../plugins/lib/logging"

// ============================================================================
// LIST - Show available styles
// ============================================================================

export const list = tool({
  description: "List all available output styles with current selection",
  args: {},
  
  async execute(args, context) {
    const { directory } = context
    
    try {
      const styles = listAvailableStyles(directory)
      const state = readState(directory)
      const current = state?.activeStyle || "default"
      
      const output = styles.map(name => {
        const style = loadStyle(directory, name)
        const marker = name === current ? "→ " : "  "
        const currentTag = name === current ? " (current)" : ""
        return `${marker}**${name}**${currentTag}\n    ${style?.description || "No description"}`
      }).join("\n\n")
      
      return `## Available Styles\n\n${output}`
    } catch (error) {
      log(directory, `[STYLE] list error: ${error}`)
      return "Error listing styles. Check logs for details."
    }
  }
})

// ============================================================================
// SET - Change active style
// ============================================================================

export const set = tool({
  description: "Set the active output style",
  args: {
    style: tool.schema.string().describe("Name of the style to activate")
  },
  
  async execute(args, context) {
    const { directory } = context
    const { style: styleName } = args
    
    try {
      // Ensure styles directory exists
      ensureStylesDir(directory)
      
      // Validate style exists
      const available = listAvailableStyles(directory)
      if (!available.includes(styleName) && styleName !== "default") {
        return `❌ Style not found: **${styleName}**\n\nAvailable styles: ${available.join(", ")}`
      }
      
      // Update state
      const state = readState(directory)
      if (!state) {
        return "❌ State not found. Run /idumb:init first."
      }
      
      const previousStyle = state.activeStyle || "default"
      
      state.activeStyle = styleName
      state.styleHistory = state.styleHistory || []
      state.styleHistory.push({
        style: styleName,
        activatedAt: new Date().toISOString(),
        by: "idumb-style_set"
      })
      
      // Limit history to 50 entries
      if (state.styleHistory.length > 50) {
        state.styleHistory = state.styleHistory.slice(-50)
      }
      
      writeState(directory, state)
      log(directory, `[STYLE] Changed from '${previousStyle}' to '${styleName}'`)
      
      return `✅ Style changed to: **${styleName}**\n\nPrevious: ${previousStyle}`
    } catch (error) {
      log(directory, `[STYLE] set error: ${error}`)
      return `Error setting style: ${error}`
    }
  }
})

// ============================================================================
// INFO - Show style details
// ============================================================================

export const info = tool({
  description: "Show detailed information about a style",
  args: {
    style: tool.schema.string().describe("Name of the style to inspect")
  },
  
  async execute(args, context) {
    const { directory } = context
    const { style: styleName } = args
    
    try {
      const style = loadStyle(directory, styleName)
      if (!style) {
        const available = listAvailableStyles(directory)
        return `❌ Style not found: **${styleName}**\n\nAvailable: ${available.join(", ")}`
      }
      
      const preview = style.instructions.length > 500 
        ? style.instructions.substring(0, 500) + "..."
        : style.instructions
      
      return `## Style: ${style.name}

**Description:** ${style.description || "None"}
**Mode:** ${style.mode}
**Keep Coding Instructions:** ${style.keepCodingInstructions ? "Yes" : "No"}
**Compatibility:** ${style.compatibility.join(", ")}

### Instructions Preview

${preview || "(No additional instructions)"}`
    } catch (error) {
      log(directory, `[STYLE] info error: ${error}`)
      return `Error getting style info: ${error}`
    }
  }
})

// ============================================================================
// RESET - Return to default style
// ============================================================================

export const reset = tool({
  description: "Reset to default output style",
  args: {},
  
  async execute(args, context) {
    const { directory } = context
    
    try {
      const state = readState(directory)
      if (!state) {
        return "❌ State not found. Run /idumb:init first."
      }
      
      const previousStyle = state.activeStyle || "default"
      
      state.activeStyle = "default"
      state.styleHistory = state.styleHistory || []
      state.styleHistory.push({
        style: "default",
        activatedAt: new Date().toISOString(),
        by: "idumb-style_reset"
      })
      
      // Limit history to 50 entries
      if (state.styleHistory.length > 50) {
        state.styleHistory = state.styleHistory.slice(-50)
      }
      
      writeState(directory, state)
      log(directory, `[STYLE] Reset from '${previousStyle}' to 'default'`)
      
      return `✅ Style reset to **default**\n\nPrevious: ${previousStyle}`
    } catch (error) {
      log(directory, `[STYLE] reset error: ${error}`)
      return `Error resetting style: ${error}`
    }
  }
})

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default { list, set, info, reset }
