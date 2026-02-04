/**
 * Style Management Library
 * 
 * Handles loading, parsing, and caching of output style files.
 * CRITICAL: NO console.log - causes TUI background text exposure
 */

import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync } from "fs"
import { join, basename } from "path"
import { log } from "./logging"

// ========================================================================
// TYPES
// ========================================================================

export interface StyleConfig {
  name: string
  description: string
  keepCodingInstructions: boolean
  mode: 'global' | 'agent'
  compatibility: string[]
}

export interface StyleContent extends StyleConfig {
  instructions: string
  raw: string
}

// ========================================================================
// PATHS
// ========================================================================

export function getStylesDir(directory: string): string {
  return join(directory, ".idumb", "idumb-brain", "styles")
}

export function ensureStylesDir(directory: string): string {
  const stylesDir = getStylesDir(directory)
  if (!existsSync(stylesDir)) {
    mkdirSync(stylesDir, { recursive: true })
    log(directory, `[STYLE] Created styles directory: ${stylesDir}`)
  }
  return stylesDir
}

// ========================================================================
// PARSING
// ========================================================================

export function parseStyleFile(stylePath: string): StyleContent | null {
  try {
    if (!existsSync(stylePath)) {
      return null
    }
    
    const raw = readFileSync(stylePath, "utf-8")
    if (!raw.trim()) {
      return null
    }
    
    // Extract YAML frontmatter
    const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/)
    if (!match) {
      // No frontmatter, treat entire content as instructions
      return {
        name: basename(stylePath, ".md"),
        description: "",
        keepCodingInstructions: true,
        mode: "global",
        compatibility: ["idumb"],
        instructions: raw.trim(),
        raw
      }
    }
    
    const [, frontmatter, content] = match
    const config = parseYamlFrontmatter(frontmatter)
    
    return {
      name: config.name || basename(stylePath, ".md"),
      description: config.description || "",
      keepCodingInstructions: config["keep-coding-instructions"] !== false,
      mode: config.mode || "global",
      compatibility: config.compatibility || ["idumb"],
      instructions: content.trim(),
      raw
    }
  } catch (error) {
    return null
  }
}

function parseYamlFrontmatter(yaml: string): Record<string, any> {
  const result: Record<string, any> = {}
  const lines = yaml.split("\n")
  
  for (const line of lines) {
    const colonIndex = line.indexOf(":")
    if (colonIndex === -1) continue
    
    const key = line.substring(0, colonIndex).trim()
    let value: any = line.substring(colonIndex + 1).trim()
    
    // Handle arrays: [item1, item2]
    if (value.startsWith("[") && value.endsWith("]")) {
      value = value.slice(1, -1).split(",").map((s: string) => s.trim())
    }
    // Handle booleans
    else if (value === "true") value = true
    else if (value === "false") value = false
    
    result[key] = value
  }
  
  return result
}

// ========================================================================
// STYLE OPERATIONS
// ========================================================================

export function listAvailableStyles(directory: string): string[] {
  const stylesDir = getStylesDir(directory)
  if (!existsSync(stylesDir)) {
    return ["default"]
  }
  
  try {
    const files = readdirSync(stylesDir)
    const styles = files
      .filter(f => f.endsWith(".md"))
      .map(f => f.replace(".md", ""))
    
    // Always include default even if no file exists
    if (!styles.includes("default")) {
      styles.unshift("default")
    }
    
    return styles
  } catch {
    return ["default"]
  }
}

export function loadStyle(directory: string, styleName: string): StyleContent | null {
  if (styleName === "default") {
    return {
      name: "default",
      description: "Standard iDumb behavior",
      keepCodingInstructions: true,
      mode: "global",
      compatibility: ["idumb"],
      instructions: "",
      raw: ""
    }
  }
  
  const stylePath = join(getStylesDir(directory), `${styleName}.md`)
  return parseStyleFile(stylePath)
}

export function loadActiveStyle(directory: string, state: any): StyleContent | null {
  const styleName = state?.activeStyle || "default"
  return loadStyle(directory, styleName)
}

export function setActiveStyle(directory: string, styleName: string): boolean {
  // Validate style exists (unless default)
  if (styleName !== "default") {
    const stylePath = join(getStylesDir(directory), `${styleName}.md`)
    if (!existsSync(stylePath)) {
      return false
    }
  }
  
  // State update is handled by the calling code (state.ts)
  return true
}
