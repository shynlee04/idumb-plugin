/**
 * iDumb Context Classification Tool
 * 
 * Classifies project context, detects frameworks, and analyzes codebase type
 * 
 * IMPORTANT: No console.log - would pollute TUI
 */

import { tool } from "@opencode-ai/plugin"
import { existsSync, readFileSync, readdirSync, statSync } from "fs"
import { join } from "path"

interface ProjectContext {
  name: string
  type: "app" | "library" | "monorepo" | "unknown"
  framework: "gsd" | "bmad" | "both" | "none"
  language: string[]
  hasTests: boolean
  hasCI: boolean
  detectedPatterns: string[]
}

// Detect project type and context
export default tool({
  description: "Analyze and classify the project context - detects framework, type, languages",
  args: {},
  async execute(args, context) {
    const dir = context.directory
    const result: ProjectContext = {
      name: "unknown",
      type: "unknown",
      framework: "none",
      language: [],
      hasTests: false,
      hasCI: false,
      detectedPatterns: [],
    }
    
    // Get project name
    const packageJsonPath = join(dir, "package.json")
    if (existsSync(packageJsonPath)) {
      try {
        const pkg = JSON.parse(readFileSync(packageJsonPath, "utf8"))
        result.name = pkg.name || dir.split("/").pop() || "unknown"
        result.detectedPatterns.push("package.json present")
      } catch {
        result.name = dir.split("/").pop() || "unknown"
      }
    } else {
      result.name = dir.split("/").pop() || "unknown"
    }
    
    // Detect project type
    const hasWorkspaces = existsSync(join(dir, "pnpm-workspace.yaml")) ||
                         existsSync(join(dir, "lerna.json")) ||
                         (existsSync(packageJsonPath) && 
                          readFileSync(packageJsonPath, "utf8").includes('"workspaces"'))
    
    if (hasWorkspaces) {
      result.type = "monorepo"
      result.detectedPatterns.push("monorepo detected")
    } else if (existsSync(join(dir, "src", "index.ts")) || 
               existsSync(join(dir, "src", "index.js")) ||
               existsSync(join(dir, "lib"))) {
      // Check if library (has main export) or app
      if (existsSync(packageJsonPath)) {
        const pkg = JSON.parse(readFileSync(packageJsonPath, "utf8"))
        if (pkg.main || pkg.exports || pkg.module) {
          result.type = "library"
          result.detectedPatterns.push("library (has exports)")
        } else {
          result.type = "app"
          result.detectedPatterns.push("application")
        }
      } else {
        result.type = "app"
      }
    }
    
    // Detect frameworks
    // GSD stores STATE.md and ROADMAP.md in .planning/, not project root
    const hasGSDPlanning = existsSync(join(dir, ".planning"))
    const hasGSDState = existsSync(join(dir, ".planning", "STATE.md"))
    const hasGSDRoadmap = existsSync(join(dir, ".planning", "ROADMAP.md"))
    const hasGSDConfig = existsSync(join(dir, ".planning", "config.json"))
    const hasGSD = hasGSDPlanning && (hasGSDState || hasGSDRoadmap || hasGSDConfig)
    
    const hasBMAD = existsSync(join(dir, "PROJECT.md")) ||
                    existsSync(join(dir, "personas")) ||
                    existsSync(join(dir, "_bmad-output"))
    
    if (hasGSD && hasBMAD) {
      result.framework = "both"
      result.detectedPatterns.push("GSD + BMAD detected")
    } else if (hasGSD) {
      result.framework = "gsd"
      result.detectedPatterns.push("GSD framework detected")
    } else if (hasBMAD) {
      result.framework = "bmad"
      result.detectedPatterns.push("BMAD framework detected")
    }
    
    // Detect languages
    const extensions: Record<string, string> = {
      ".ts": "TypeScript",
      ".tsx": "TypeScript/React",
      ".js": "JavaScript",
      ".jsx": "JavaScript/React",
      ".py": "Python",
      ".go": "Go",
      ".rs": "Rust",
      ".java": "Java",
      ".rb": "Ruby",
      ".php": "PHP",
    }
    
    const detectedLangs = new Set<string>()
    
    // Check common source directories
    const srcDirs = ["src", "lib", "app", "pages", "components"]
    for (const srcDir of srcDirs) {
      const srcPath = join(dir, srcDir)
      if (existsSync(srcPath)) {
        try {
          const files = readdirSync(srcPath, { recursive: true }) as string[]
          for (const file of files) {
            for (const [ext, lang] of Object.entries(extensions)) {
              if (String(file).endsWith(ext)) {
                detectedLangs.add(lang)
              }
            }
          }
        } catch {
          // Ignore read errors
        }
      }
    }
    
    result.language = Array.from(detectedLangs)
    
    // Detect tests
    result.hasTests = existsSync(join(dir, "test")) ||
                      existsSync(join(dir, "tests")) ||
                      existsSync(join(dir, "__tests__")) ||
                      existsSync(join(dir, "spec")) ||
                      existsSync(join(dir, "vitest.config.ts")) ||
                      existsSync(join(dir, "jest.config.js")) ||
                      existsSync(join(dir, "jest.config.ts"))
    
    if (result.hasTests) {
      result.detectedPatterns.push("test suite present")
    }
    
    // Detect CI
    result.hasCI = existsSync(join(dir, ".github", "workflows")) ||
                   existsSync(join(dir, ".gitlab-ci.yml")) ||
                   existsSync(join(dir, ".circleci")) ||
                   existsSync(join(dir, "Jenkinsfile"))
    
    if (result.hasCI) {
      result.detectedPatterns.push("CI/CD configured")
    }
    
    return JSON.stringify(result, null, 2)
  },
})

// Get summary for compaction
export const summary = tool({
  description: "Get a brief context summary suitable for compaction injection",
  args: {},
  async execute(args, context) {
    const dir = context.directory
    const lines: string[] = []
    
    // Project name
    const packageJsonPath = join(dir, "package.json")
    let name = dir.split("/").pop() || "unknown"
    if (existsSync(packageJsonPath)) {
      try {
        const pkg = JSON.parse(readFileSync(packageJsonPath, "utf8"))
        name = pkg.name || name
      } catch {}
    }
    lines.push(`Project: ${name}`)
    
    // Framework
    const hasGSD = existsSync(join(dir, ".planning"))
    const hasBMAD = existsSync(join(dir, "PROJECT.md"))
    if (hasGSD) lines.push("Framework: GSD")
    if (hasBMAD) lines.push("Framework: BMAD")
    if (!hasGSD && !hasBMAD) lines.push("Framework: None detected")
    
    // iDumb state
    const idumbState = join(dir, ".idumb", "brain", "state.json")
    if (existsSync(idumbState)) {
      try {
        const state = JSON.parse(readFileSync(idumbState, "utf8"))
        lines.push(`Phase: ${state.phase}`)
        lines.push(`Anchors: ${state.anchors?.length || 0}`)
      } catch {}
    } else {
      lines.push("iDumb: Not initialized")
    }
    
    return lines.join("\n")
  },
})

// Detect file patterns
export const patterns = tool({
  description: "Detect specific patterns in the codebase",
  args: {
    pattern: tool.schema.string().describe("Pattern to detect: api, database, auth, testing, ui, state")
  },
  async execute(args, context) {
    const dir = context.directory
    const pattern = args.pattern
    const detected: string[] = []
    
    switch (pattern) {
      case "api":
        if (existsSync(join(dir, "src", "api"))) detected.push("src/api/ directory")
        if (existsSync(join(dir, "pages", "api"))) detected.push("pages/api/ (Next.js)")
        if (existsSync(join(dir, "app", "api"))) detected.push("app/api/ (Next.js App Router)")
        if (existsSync(join(dir, "routes"))) detected.push("routes/ directory")
        break
        
      case "database":
        if (existsSync(join(dir, "prisma"))) detected.push("Prisma ORM")
        if (existsSync(join(dir, "drizzle"))) detected.push("Drizzle ORM")
        if (existsSync(join(dir, "migrations"))) detected.push("migrations/ directory")
        if (existsSync(join(dir, "db"))) detected.push("db/ directory")
        break
        
      case "auth":
        if (existsSync(join(dir, "src", "auth"))) detected.push("src/auth/ directory")
        if (existsSync(join(dir, "lib", "auth"))) detected.push("lib/auth/ directory")
        break
        
      case "testing":
        if (existsSync(join(dir, "vitest.config.ts"))) detected.push("Vitest")
        if (existsSync(join(dir, "jest.config.js"))) detected.push("Jest")
        if (existsSync(join(dir, "playwright.config.ts"))) detected.push("Playwright")
        if (existsSync(join(dir, "cypress"))) detected.push("Cypress")
        break
        
      case "ui":
        if (existsSync(join(dir, "components"))) detected.push("components/ directory")
        if (existsSync(join(dir, "src", "components"))) detected.push("src/components/")
        if (existsSync(join(dir, "tailwind.config.js"))) detected.push("Tailwind CSS")
        if (existsSync(join(dir, "tailwind.config.ts"))) detected.push("Tailwind CSS")
        break
        
      case "state":
        // Look for state management
        try {
          if (existsSync(join(dir, "package.json"))) {
            const pkg = readFileSync(join(dir, "package.json"), "utf8")
            if (pkg.includes("zustand")) detected.push("Zustand")
            if (pkg.includes("redux")) detected.push("Redux")
            if (pkg.includes("jotai")) detected.push("Jotai")
            if (pkg.includes("recoil")) detected.push("Recoil")
            if (pkg.includes("mobx")) detected.push("MobX")
          }
        } catch {}
        break
    }
    
    if (detected.length === 0) {
      return `No ${pattern} patterns detected`
    }
    
    return `${pattern} patterns: ${detected.join(", ")}`
  },
})
