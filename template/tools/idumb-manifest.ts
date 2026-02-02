/**
 * iDumb Manifest Watch Tool
 * 
 * Monitors codebase for drift, conflicts, and structural violations:
 * - File structure drift from expected patterns
 * - Overlapping or conflicting file changes
 * - Git hash control integration for atomic commits
 * - One-version control for dependencies
 * 
 * IMPORTANT: No console.log - would pollute TUI
 */

import { tool } from "@opencode-ai/plugin"
import { existsSync, readFileSync, writeFileSync, readdirSync, statSync, mkdirSync } from "fs"
import { join, relative, extname } from "path"
import { execSync } from "child_process"

// ============================================================================
// TYPES
// ============================================================================

interface ManifestEntry {
  path: string
  type: "file" | "directory"
  hash?: string           // Git object hash
  size?: number
  lastModified: string
  category: FileCategory
}

interface FileCategory {
  domain: string          // e.g., "components", "api", "utils", "config"
  layer: string           // e.g., "presentation", "business", "data"
  phase?: number          // Which phase created this
}

interface Manifest {
  version: string
  created: string
  updated: string
  projectRoot: string
  entries: ManifestEntry[]
  gitHead?: string
  currentPhase?: string
}

interface DriftResult {
  type: "added" | "removed" | "modified" | "conflict"
  path: string
  details: string
  severity: "low" | "medium" | "high" | "critical"
}

interface ConflictResult {
  paths: string[]
  type: "naming" | "circular" | "duplicate" | "structure"
  description: string
  resolution?: string
}

// ============================================================================
// MANIFEST MANAGEMENT
// ============================================================================

function getManifestPath(directory: string): string {
  return join(directory, ".idumb", "governance", "manifest.json")
}

function loadManifest(directory: string): Manifest | null {
  const manifestPath = getManifestPath(directory)
  if (!existsSync(manifestPath)) {
    return null
  }
  try {
    return JSON.parse(readFileSync(manifestPath, "utf8"))
  } catch {
    return null
  }
}

function saveManifest(directory: string, manifest: Manifest): void {
  const manifestPath = getManifestPath(directory)
  const dir = join(directory, ".idumb", "governance")
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
}

function getGitHead(directory: string): string | null {
  try {
    return execSync("git rev-parse HEAD", { cwd: directory, encoding: "utf8" }).trim()
  } catch {
    return null
  }
}

function getGitFileHash(directory: string, filePath: string): string | null {
  try {
    return execSync(`git hash-object "${filePath}"`, { cwd: directory, encoding: "utf8" }).trim()
  } catch {
    return null
  }
}

function getGitStatus(directory: string): { modified: string[]; added: string[]; deleted: string[] } {
  try {
    const status = execSync("git status --porcelain", { cwd: directory, encoding: "utf8" })
    const modified: string[] = []
    const added: string[] = []
    const deleted: string[] = []
    
    for (const line of status.split("\n")) {
      if (!line) continue
      const code = line.slice(0, 2)
      const path = line.slice(3)
      
      if (code.includes("M")) modified.push(path)
      if (code.includes("A") || code.includes("?")) added.push(path)
      if (code.includes("D")) deleted.push(path)
    }
    
    return { modified, added, deleted }
  } catch {
    return { modified: [], added: [], deleted: [] }
  }
}

// ============================================================================
// FILE CATEGORIZATION
// ============================================================================

function categorizeFile(filePath: string): FileCategory {
  const path = filePath.toLowerCase()
  
  // Domain detection
  let domain = "unknown"
  if (path.includes("component") || path.includes("ui/") || path.includes("views/")) {
    domain = "components"
  } else if (path.includes("api/") || path.includes("routes/") || path.includes("handlers/")) {
    domain = "api"
  } else if (path.includes("util") || path.includes("helper") || path.includes("lib/")) {
    domain = "utils"
  } else if (path.includes("config") || path.includes("env") || path.includes("settings")) {
    domain = "config"
  } else if (path.includes("test") || path.includes("spec") || path.includes("__test")) {
    domain = "tests"
  } else if (path.includes("type") || path.includes("interface") || path.includes("schema")) {
    domain = "types"
  } else if (path.includes("hook") || path.includes("context/")) {
    domain = "hooks"
  } else if (path.includes("store") || path.includes("state/") || path.includes("redux")) {
    domain = "state"
  } else if (path.includes("service") || path.includes("client/")) {
    domain = "services"
  }
  
  // Layer detection
  let layer = "unknown"
  if (path.includes("ui/") || path.includes("component") || path.includes("page")) {
    layer = "presentation"
  } else if (path.includes("service") || path.includes("logic") || path.includes("domain")) {
    layer = "business"
  } else if (path.includes("data") || path.includes("repository") || path.includes("db")) {
    layer = "data"
  } else if (path.includes("api/") || path.includes("routes/")) {
    layer = "transport"
  }
  
  return { domain, layer }
}

function scanDirectory(
  directory: string, 
  basePath: string = "", 
  entries: ManifestEntry[] = [],
  excludePatterns: string[] = ["node_modules", ".git", "dist", "build", ".next", ".idumb"]
): ManifestEntry[] {
  const fullPath = join(directory, basePath)
  
  if (!existsSync(fullPath)) return entries
  
  const items = readdirSync(fullPath)
  
  for (const item of items) {
    // Skip excluded patterns
    if (excludePatterns.some(pattern => item.includes(pattern))) continue
    
    const itemPath = join(basePath, item)
    const fullItemPath = join(directory, itemPath)
    const stat = statSync(fullItemPath)
    
    if (stat.isDirectory()) {
      entries.push({
        path: itemPath,
        type: "directory",
        lastModified: stat.mtime.toISOString(),
        category: categorizeFile(itemPath)
      })
      
      // Recurse into directory
      scanDirectory(directory, itemPath, entries, excludePatterns)
    } else {
      const ext = extname(item)
      // Only track code files
      if ([".ts", ".tsx", ".js", ".jsx", ".json", ".md", ".yaml", ".yml"].includes(ext)) {
        entries.push({
          path: itemPath,
          type: "file",
          hash: getGitFileHash(directory, fullItemPath) || undefined,
          size: stat.size,
          lastModified: stat.mtime.toISOString(),
          category: categorizeFile(itemPath)
        })
      }
    }
  }
  
  return entries
}

// ============================================================================
// DRIFT DETECTION
// ============================================================================

function detectDrift(directory: string, manifest: Manifest): DriftResult[] {
  const results: DriftResult[] = []
  const currentEntries = scanDirectory(directory)
  
  const manifestPaths = new Set(manifest.entries.map(e => e.path))
  const currentPaths = new Set(currentEntries.map(e => e.path))
  
  // Check for added files
  for (const entry of currentEntries) {
    if (!manifestPaths.has(entry.path)) {
      results.push({
        type: "added",
        path: entry.path,
        details: `New ${entry.type} not in manifest`,
        severity: entry.category.domain === "config" ? "high" : "low"
      })
    }
  }
  
  // Check for removed files
  for (const entry of manifest.entries) {
    if (!currentPaths.has(entry.path)) {
      results.push({
        type: "removed",
        path: entry.path,
        details: `${entry.type} was removed`,
        severity: entry.category.domain === "config" ? "high" : "medium"
      })
    }
  }
  
  // Check for modified files
  const currentMap = new Map(currentEntries.map(e => [e.path, e]))
  for (const entry of manifest.entries) {
    const current = currentMap.get(entry.path)
    if (current && entry.type === "file" && current.type === "file") {
      if (entry.hash && current.hash && entry.hash !== current.hash) {
        results.push({
          type: "modified",
          path: entry.path,
          details: `File content changed (hash: ${entry.hash?.slice(0, 8)} → ${current.hash?.slice(0, 8)})`,
          severity: "low"
        })
      }
    }
  }
  
  return results
}

// ============================================================================
// CONFLICT DETECTION
// ============================================================================

function detectConflicts(directory: string): ConflictResult[] {
  const results: ConflictResult[] = []
  const entries = scanDirectory(directory)
  
  // Group files by base name (without extension)
  const baseNameGroups = new Map<string, string[]>()
  for (const entry of entries) {
    if (entry.type !== "file") continue
    const parts = entry.path.split("/")
    const fileName = parts[parts.length - 1]
    const baseName = fileName.replace(/\.[^.]+$/, "").toLowerCase()
    
    if (!baseNameGroups.has(baseName)) {
      baseNameGroups.set(baseName, [])
    }
    baseNameGroups.get(baseName)!.push(entry.path)
  }
  
  // Check for potential naming conflicts
  for (const [baseName, paths] of baseNameGroups) {
    if (paths.length > 2) {
      // More than 2 files with same base name in different locations
      const domains = paths.map(p => categorizeFile(p).domain)
      const uniqueDomains = new Set(domains)
      
      if (uniqueDomains.size < paths.length / 2) {
        results.push({
          type: "naming",
          paths,
          description: `Multiple files named "${baseName}" may cause confusion`,
          resolution: "Consider renaming to be more specific or consolidating"
        })
      }
    }
  }
  
  // Check for circular dependency patterns (heuristic)
  const importPatterns = new Map<string, string[]>()
  for (const entry of entries) {
    if (entry.type !== "file") continue
    if (!entry.path.endsWith(".ts") && !entry.path.endsWith(".tsx")) continue
    
    try {
      const content = readFileSync(join(directory, entry.path), "utf8")
      const imports = content.match(/from\s+["']([^"']+)["']/g) || []
      const resolvedImports = imports
        .map(i => i.match(/from\s+["']([^"']+)["']/)?.[1])
        .filter(Boolean) as string[]
      importPatterns.set(entry.path, resolvedImports)
    } catch {
      // Skip files that can't be read
    }
  }
  
  // Simple circular detection (A imports B, B imports A)
  for (const [file, imports] of importPatterns) {
    for (const imp of imports) {
      if (!imp.startsWith(".")) continue // Skip external imports
      
      // Resolve relative import
      const parts = file.split("/")
      parts.pop()
      const resolved = [...parts, imp.replace(/^\.\//, "")].join("/")
      
      const otherImports = importPatterns.get(resolved + ".ts") || 
                          importPatterns.get(resolved + ".tsx") ||
                          importPatterns.get(resolved + "/index.ts")
      
      if (otherImports) {
        for (const otherImp of otherImports) {
          if (otherImp.endsWith(file.split("/").pop()!.replace(/\.[^.]+$/, ""))) {
            results.push({
              type: "circular",
              paths: [file, resolved],
              description: "Potential circular dependency detected",
              resolution: "Extract shared code to a separate module"
            })
          }
        }
      }
    }
  }
  
  return results
}

// ============================================================================
// TOOLS
// ============================================================================

// Create or update manifest
export const snapshot = tool({
  description: "Create or update the codebase manifest snapshot",
  args: {
    force: tool.schema.boolean().optional().describe("Force full rescan even if recent")
  },
  async execute(args, context) {
    const existingManifest = loadManifest(context.directory)
    const now = new Date().toISOString()
    
    // Check if we need to scan
    if (!args.force && existingManifest) {
      const lastUpdate = new Date(existingManifest.updated)
      const hoursSince = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60)
      
      if (hoursSince < 1) {
        return JSON.stringify({
          updated: false,
          reason: "Manifest is less than 1 hour old",
          lastUpdate: existingManifest.updated,
          entryCount: existingManifest.entries.length
        })
      }
    }
    
    // Scan directory
    const entries = scanDirectory(context.directory)
    const gitHead = getGitHead(context.directory)
    
    // Read current phase if present
    let currentPhase: string | undefined
    const stateMdPath = join(context.directory, ".planning", "STATE.md")
    if (existsSync(stateMdPath)) {
      try {
        const content = readFileSync(stateMdPath, "utf8")
        const match = content.match(/Phase:\s*\[(\d+)\]\s*of\s*\[(\d+)\]\s*\(([^)]+)\)/i)
        if (match) {
          currentPhase = `${match[1]}/${match[2]} (${match[3]})`
        }
      } catch {
        // Ignore
      }
    }
    
    const manifest: Manifest = {
      version: "0.1.0",
      created: existingManifest?.created || now,
      updated: now,
      projectRoot: context.directory,
      entries,
      gitHead: gitHead || undefined,
      currentPhase
    }
    
    saveManifest(context.directory, manifest)
    
    // Summarize by domain
    const domainCounts = entries.reduce((acc, e) => {
      const domain = e.category.domain
      acc[domain] = (acc[domain] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return JSON.stringify({
      updated: true,
      entryCount: entries.length,
      gitHead: gitHead || "not a git repo",
      currentPhase: currentPhase || "not detected",
      domainBreakdown: domainCounts
    }, null, 2)
  }
})

// Check for drift
export const drift = tool({
  description: "Check for drift from the last manifest snapshot",
  args: {},
  async execute(args, context) {
    const manifest = loadManifest(context.directory)
    
    if (!manifest) {
      return JSON.stringify({
        error: "No manifest found. Run idumb-manifest snapshot first."
      })
    }
    
    const driftResults = detectDrift(context.directory, manifest)
    
    // Categorize by severity
    const critical = driftResults.filter(r => r.severity === "critical")
    const high = driftResults.filter(r => r.severity === "high")
    const medium = driftResults.filter(r => r.severity === "medium")
    const low = driftResults.filter(r => r.severity === "low")
    
    return JSON.stringify({
      manifestAge: manifest.updated,
      gitHead: {
        manifest: manifest.gitHead,
        current: getGitHead(context.directory)
      },
      driftDetected: driftResults.length > 0,
      summary: {
        critical: critical.length,
        high: high.length,
        medium: medium.length,
        low: low.length
      },
      issues: driftResults
    }, null, 2)
  }
})

// Check for conflicts
export const conflicts = tool({
  description: "Detect naming conflicts, circular dependencies, and structural issues",
  args: {},
  async execute(args, context) {
    const conflictResults = detectConflicts(context.directory)
    
    return JSON.stringify({
      conflictsDetected: conflictResults.length > 0,
      count: conflictResults.length,
      conflicts: conflictResults
    }, null, 2)
  }
})

// Git hash verification (for atomic commits)
export const verifyGitHash = tool({
  description: "Verify current git state matches expected hash (for atomic commit control)",
  args: {
    expectedHash: tool.schema.string().describe("Expected git commit hash to verify against")
  },
  async execute(args, context) {
    const currentHead = getGitHead(context.directory)
    
    if (!currentHead) {
      return JSON.stringify({
        verified: false,
        error: "Not a git repository or git not available"
      })
    }
    
    const matches = currentHead === args.expectedHash || 
                    currentHead.startsWith(args.expectedHash) ||
                    args.expectedHash.startsWith(currentHead)
    
    const status = getGitStatus(context.directory)
    const hasUncommittedChanges = status.modified.length > 0 || 
                                   status.added.length > 0 || 
                                   status.deleted.length > 0
    
    return JSON.stringify({
      verified: matches && !hasUncommittedChanges,
      currentHead,
      expectedHash: args.expectedHash,
      hashMatch: matches,
      uncommittedChanges: hasUncommittedChanges ? status : null,
      recommendation: !matches ? "Commit hash mismatch - verify you're on the correct branch" :
                      hasUncommittedChanges ? "Uncommitted changes detected - commit or stash before proceeding" :
                      "All good"
    }, null, 2)
  }
})

// Full check (snapshot + drift + conflicts)
export default tool({
  description: "Run full manifest check: snapshot, drift detection, and conflict detection",
  args: {},
  async execute(args, context) {
    // Take snapshot
    const entries = scanDirectory(context.directory)
    const gitHead = getGitHead(context.directory)
    const existingManifest = loadManifest(context.directory)
    const now = new Date().toISOString()
    
    // Detect drift (if we have an existing manifest)
    let driftResults: DriftResult[] = []
    if (existingManifest) {
      driftResults = detectDrift(context.directory, existingManifest)
    }
    
    // Detect conflicts
    const conflictResults = detectConflicts(context.directory)
    
    // Update manifest
    const manifest: Manifest = {
      version: "0.1.0",
      created: existingManifest?.created || now,
      updated: now,
      projectRoot: context.directory,
      entries,
      gitHead: gitHead || undefined
    }
    saveManifest(context.directory, manifest)
    
    // Calculate overall health
    const criticalDrift = driftResults.filter(r => r.severity === "critical" || r.severity === "high").length
    const health = criticalDrift > 0 ? "unhealthy" :
                   driftResults.length > 10 ? "needs-attention" :
                   conflictResults.length > 0 ? "has-warnings" :
                   "healthy"
    
    return JSON.stringify({
      health,
      manifest: {
        entryCount: entries.length,
        updated: now,
        gitHead: gitHead || "not a git repo"
      },
      drift: {
        detected: driftResults.length > 0,
        count: driftResults.length,
        critical: driftResults.filter(r => r.severity === "critical").length,
        high: driftResults.filter(r => r.severity === "high").length
      },
      conflicts: {
        detected: conflictResults.length > 0,
        count: conflictResults.length
      },
      recommendations: [
        criticalDrift > 0 ? "Review critical drift issues immediately" : null,
        conflictResults.length > 0 ? "Resolve naming/structure conflicts" : null,
        !gitHead ? "Initialize git repository for full tracking" : null
      ].filter(Boolean)
    }, null, 2)
  }
})
