/**
 * iDumb Chunker Tool
 * 
 * Handles chunked sequential reading and validation of long documents.
 * Per line 238: "for foreseeable these types of documents or artifacts that may get long
 * >>> come up with tools, script that activate chunk sequential chunk reading 
 * >>> validating, and appending content in chunk (but still gain exact accuracy)"
 * 
 * IMPORTANT: No console.log - would pollute TUI
 */

import { tool } from "@opencode-ai/plugin"
import { existsSync, readFileSync, statSync, writeFileSync, appendFileSync } from "fs"
import { join } from "path"

// ============================================================================
// TYPES
// ============================================================================

interface ChunkResult {
  path: string
  chunk: number
  totalChunks: number
  startLine: number
  endLine: number
  content: string
  hasMore: boolean
  metadata?: {
    totalLines: number
    fileSize: number
    lastModified: string
  }
}

interface ValidationResult {
  chunk: number
  valid: boolean
  issues: string[]
  suggestions: string[]
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_CHUNK_SIZE = 100  // lines per chunk
const MAX_CHUNK_SIZE = 500      // safety limit

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getFileLines(filePath: string): string[] {
  if (!existsSync(filePath)) {
    return []
  }
  const content = readFileSync(filePath, "utf8")
  return content.split("\n")
}

function getFileMetadata(filePath: string): { totalLines: number; fileSize: number; lastModified: string } | null {
  if (!existsSync(filePath)) {
    return null
  }
  const stat = statSync(filePath)
  const lines = getFileLines(filePath)
  return {
    totalLines: lines.length,
    fileSize: stat.size,
    lastModified: stat.mtime.toISOString()
  }
}

// ============================================================================
// TOOLS
// ============================================================================

// Read a document in chunks
export const read = tool({
  description: "Read a long document in sequential chunks for processing without context overflow",
  args: {
    path: tool.schema.string().describe("Path to the file (relative to project root)"),
    chunk: tool.schema.number().optional().describe("Chunk number to read (1-based, default: 1)"),
    chunkSize: tool.schema.number().optional().describe("Lines per chunk (default: 100, max: 500)")
  },
  async execute(args, context) {
    const filePath = join(context.directory, args.path)
    const chunkNumber = args.chunk || 1
    const chunkSize = Math.min(args.chunkSize || DEFAULT_CHUNK_SIZE, MAX_CHUNK_SIZE)
    
    if (!existsSync(filePath)) {
      return JSON.stringify({ error: `File not found: ${args.path}` })
    }
    
    const lines = getFileLines(filePath)
    const totalLines = lines.length
    const totalChunks = Math.ceil(totalLines / chunkSize)
    
    if (chunkNumber < 1 || chunkNumber > totalChunks) {
      return JSON.stringify({ 
        error: `Invalid chunk number: ${chunkNumber}. Valid range: 1-${totalChunks}`,
        totalChunks
      })
    }
    
    const startLine = (chunkNumber - 1) * chunkSize
    const endLine = Math.min(startLine + chunkSize, totalLines)
    const chunkContent = lines.slice(startLine, endLine).join("\n")
    
    const result: ChunkResult = {
      path: args.path,
      chunk: chunkNumber,
      totalChunks,
      startLine: startLine + 1,  // 1-based for human readability
      endLine,
      content: chunkContent,
      hasMore: chunkNumber < totalChunks,
      metadata: getFileMetadata(filePath) || undefined
    }
    
    return JSON.stringify(result, null, 2)
  }
})

// Get document overview without full content
export const overview = tool({
  description: "Get overview of a document (metadata, structure) without reading full content",
  args: {
    path: tool.schema.string().describe("Path to the file (relative to project root)")
  },
  async execute(args, context) {
    const filePath = join(context.directory, args.path)
    
    if (!existsSync(filePath)) {
      return JSON.stringify({ error: `File not found: ${args.path}` })
    }
    
    const lines = getFileLines(filePath)
    const metadata = getFileMetadata(filePath)
    
    // Extract structure (headers, sections)
    const headers: { line: number; level: number; text: string }[] = []
    const frontmatterEnd = lines.findIndex((l, i) => i > 0 && l === "---")
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const headerMatch = line.match(/^(#{1,6})\s+(.+)$/)
      if (headerMatch) {
        headers.push({
          line: i + 1,
          level: headerMatch[1].length,
          text: headerMatch[2]
        })
      }
    }
    
    // Extract frontmatter if present
    let frontmatter: Record<string, string> | null = null
    if (lines[0] === "---" && frontmatterEnd > 0) {
      frontmatter = {}
      for (let i = 1; i < frontmatterEnd; i++) {
        const colonIndex = lines[i].indexOf(":")
        if (colonIndex > 0) {
          const key = lines[i].slice(0, colonIndex).trim()
          const value = lines[i].slice(colonIndex + 1).trim()
          frontmatter[key] = value
        }
      }
    }
    
    // Recommended chunk size based on file size
    const recommendedChunkSize = metadata && metadata.totalLines > 500 ? 100 :
                                  metadata && metadata.totalLines > 200 ? 50 : 
                                  metadata?.totalLines || 100
    
    return JSON.stringify({
      path: args.path,
      metadata,
      structure: {
        hasFrontmatter: frontmatter !== null,
        frontmatter,
        headers,
        sectionCount: headers.filter(h => h.level <= 2).length
      },
      chunking: {
        recommendedChunkSize,
        estimatedChunks: Math.ceil((metadata?.totalLines || 0) / recommendedChunkSize)
      }
    }, null, 2)
  }
})

// Validate a chunk against schema/rules
export const validate = tool({
  description: "Validate a document chunk for completeness, consistency, and governance compliance",
  args: {
    path: tool.schema.string().describe("Path to the file"),
    chunk: tool.schema.number().optional().describe("Chunk number to validate (or all if omitted)"),
    rules: tool.schema.string().optional().describe("Validation rules: 'gsd' for GSD artifacts, 'frontmatter' for YAML check")
  },
  async execute(args, context) {
    const filePath = join(context.directory, args.path)
    const rules = args.rules || "gsd"
    
    if (!existsSync(filePath)) {
      return JSON.stringify({ error: `File not found: ${args.path}` })
    }
    
    const lines = getFileLines(filePath)
    const results: ValidationResult[] = []
    
    // GSD validation rules
    if (rules === "gsd" || rules === "all") {
      const issues: string[] = []
      const suggestions: string[] = []
      
      // Check frontmatter
      if (lines[0] !== "---") {
        issues.push("Missing YAML frontmatter")
        suggestions.push("Add --- at start of file")
      }
      
      // Check for required GSD fields in frontmatter
      const frontmatterEnd = lines.findIndex((l, i) => i > 0 && l === "---")
      if (frontmatterEnd > 0) {
        const frontmatterContent = lines.slice(1, frontmatterEnd).join("\n")
        
        // Check for timestamp (line 219 requirement)
        if (!frontmatterContent.includes("idumb_created") && 
            !frontmatterContent.includes("idumb_modified")) {
          suggestions.push("Add iDumb timestamps for staleness tracking")
        }
      }
      
      // Check for required sections
      const hasPhase = lines.some(l => /phase/i.test(l))
      const hasTasks = lines.some(l => /<task/i.test(l) || /##.*task/i.test(l))
      
      if (args.path.includes("PLAN") && !hasTasks) {
        issues.push("PLAN file missing task definitions")
      }
      
      // Check line count (STATE.md should be < 100 lines)
      if (args.path.includes("STATE") && lines.length > 100) {
        issues.push(`STATE.md is ${lines.length} lines (should be < 100)`)
        suggestions.push("Consolidate STATE.md to keep under 100 lines")
      }
      
      results.push({
        chunk: 1,
        valid: issues.length === 0,
        issues,
        suggestions
      })
    }
    
    // Frontmatter validation
    if (rules === "frontmatter" || rules === "all") {
      const issues: string[] = []
      const suggestions: string[] = []
      
      if (lines[0] !== "---") {
        issues.push("No frontmatter found")
      } else {
        const frontmatterEnd = lines.findIndex((l, i) => i > 0 && l === "---")
        if (frontmatterEnd < 0) {
          issues.push("Frontmatter not closed (missing ---)")
        }
      }
      
      results.push({
        chunk: 0,  // 0 = frontmatter
        valid: issues.length === 0,
        issues,
        suggestions
      })
    }
    
    const overallValid = results.every(r => r.valid)
    
    return JSON.stringify({
      path: args.path,
      rules,
      overallValid,
      results
    }, null, 2)
  }
})

// Append content to a document in chunks
export const append = tool({
  description: "Append content to a document in a controlled manner with validation",
  args: {
    path: tool.schema.string().describe("Path to the file"),
    content: tool.schema.string().describe("Content to append"),
    section: tool.schema.string().optional().describe("Section header to append under (creates if missing)")
  },
  async execute(args, context) {
    const filePath = join(context.directory, args.path)
    
    if (!existsSync(filePath)) {
      return JSON.stringify({ error: `File not found: ${args.path}` })
    }
    
    const lines = getFileLines(filePath)
    const beforeLength = lines.length
    
    if (args.section) {
      // Find section and insert after it
      const sectionIndex = lines.findIndex(l => 
        l.includes(args.section!) && /^#{1,6}\s/.test(l)
      )
      
      if (sectionIndex >= 0) {
        // Find next section
        let insertIndex = sectionIndex + 1
        for (let i = sectionIndex + 1; i < lines.length; i++) {
          if (/^#{1,6}\s/.test(lines[i])) {
            insertIndex = i
            break
          }
          insertIndex = i + 1
        }
        
        // Insert content
        lines.splice(insertIndex, 0, "", args.content)
        writeFileSync(filePath, lines.join("\n"))
        
        return JSON.stringify({
          success: true,
          path: args.path,
          section: args.section,
          insertedAt: insertIndex + 1,
          linesBefore: beforeLength,
          linesAfter: lines.length
        }, null, 2)
      } else {
        // Create section and append
        appendFileSync(filePath, `\n\n## ${args.section}\n\n${args.content}`)
        
        return JSON.stringify({
          success: true,
          path: args.path,
          section: args.section,
          action: "created_section",
          linesBefore: beforeLength,
          linesAfter: getFileLines(filePath).length
        }, null, 2)
      }
    } else {
      // Simple append
      appendFileSync(filePath, `\n${args.content}`)
      
      return JSON.stringify({
        success: true,
        path: args.path,
        action: "appended",
        linesBefore: beforeLength,
        linesAfter: getFileLines(filePath).length
      }, null, 2)
    }
  }
})

// Default: read first chunk
export default tool({
  description: "Read a long document in chunks - default returns first chunk with metadata",
  args: {
    path: tool.schema.string().describe("Path to the file (relative to project root)")
  },
  async execute(args, context) {
    const filePath = join(context.directory, args.path)
    
    if (!existsSync(filePath)) {
      return JSON.stringify({ error: `File not found: ${args.path}` })
    }
    
    const lines = getFileLines(filePath)
    const metadata = getFileMetadata(filePath)
    const chunkSize = lines.length > 500 ? 100 : lines.length > 200 ? 50 : lines.length
    const totalChunks = Math.ceil(lines.length / chunkSize)
    
    // Return first chunk
    const content = lines.slice(0, chunkSize).join("\n")
    
    return JSON.stringify({
      path: args.path,
      chunk: 1,
      totalChunks,
      chunkSize,
      startLine: 1,
      endLine: Math.min(chunkSize, lines.length),
      content,
      hasMore: totalChunks > 1,
      metadata,
      usage: {
        nextChunk: `Use idumb-chunker.read with chunk: 2`,
        overview: `Use idumb-chunker.overview for structure`,
        validate: `Use idumb-chunker.validate for GSD compliance`
      }
    }, null, 2)
  }
})
