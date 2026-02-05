/**
 * iDumb Chunker Tool
 * 
 * Comprehensive hierarchical data processor with:
 * - Chunked sequential reading and validation of long documents
 * - Hierarchical parsing for XML, YAML, JSON, Markdown
 * - Database-like indexing with unique IDs
 * - Bash integration for fast extraction (jq, yq, xmllint)
 * - Sharding by hierarchy levels for parallel processing
 * 
 * IMPORTANT: No console.log - would pollute TUI
 */

import { tool } from "@opencode-ai/plugin"
import { existsSync, readFileSync, statSync, writeFileSync, appendFileSync } from "fs"
import { join } from "path"

// Import hierarchical data processing modules
import {
  parseHierarchy as parseHierarchyFn,
  parseHierarchyFromString,
  shardHierarchy,
  getShardById,
  getNodesAtLevel,
  detectFormat,
  type SupportedFormat,
  type Shard
} from "./lib/hierarchy-parsers"

import {
  createIndex,
  saveIndex,
  loadIndex,
  getValidIndex,
  queryById,
  queryByPath,
  queryByType,
  queryByLevel,
  queryByContent,
  getDescendants,
  getAncestors,
  type HierarchyNode,
  type Index,
  type IndexEntry
} from "./lib/index-manager"

import {
  checkBashTools,
  jqExtract,
  yqExtract,
  xmlExtract,
  bashInsertAt,
  bashExtractLines,
  bashGrepExtract,
  autoExtract,
  type BashExecutorResult
} from "./lib/bash-executors"



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
    rules: tool.schema.string().optional().describe("Validation rules: 'governance' for governance artifacts, 'frontmatter' for YAML check")
  },
  async execute(args, context) {
    const filePath = join(context.directory, args.path)
    const rules = args.rules || "governance"

    if (!existsSync(filePath)) {
      return JSON.stringify({ error: `File not found: ${args.path}` })
    }

    const lines = getFileLines(filePath)
    const results: ValidationResult[] = []

    // Governance validation rules
    if (rules === "governance" || rules === "all") {
      const issues: string[] = []
      const suggestions: string[] = []

      // Check frontmatter
      if (lines[0] !== "---") {
        issues.push("Missing YAML frontmatter")
        suggestions.push("Add --- at start of file")
      }

      // Check for required fields in frontmatter
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
        validate: `Use idumb-chunker.validate for governance compliance`
      }
    }, null, 2)
  }
})

// ============================================================================
// HIERARCHICAL DATA TOOLS (NEW)
// ============================================================================

// Parse hierarchical data (XML, YAML, JSON, MD)
export const parseHierarchy = tool({
  description: "Parse hierarchical data (XML, YAML, JSON, MD) and extract by level or query. Returns structured hierarchy tree.",
  args: {
    path: tool.schema.string().describe("Path to file (relative to project root)"),
    format: tool.schema.string().optional().describe("Format: xml, yaml, json, md, auto (default: auto-detect)"),
    level: tool.schema.number().optional().describe("Hierarchy level to extract (0=root, 1=first level, etc.)"),
    query: tool.schema.string().optional().describe("Query string (xpath for XML, dot-path for YAML/JSON, header text for MD)")
  },
  async execute(args, context) {
    const filePath = join(context.directory, args.path)

    if (!existsSync(filePath)) {
      return JSON.stringify({ error: `File not found: ${args.path}` })
    }

    const content = readFileSync(filePath, "utf8")
    const format = (args.format as SupportedFormat) || detectFormat(filePath, content)
    const hierarchy = parseHierarchyFn(filePath, format)

    if (!hierarchy) {
      return JSON.stringify({ error: `Failed to parse ${args.path} as ${format}` })
    }

    // If level specified, filter to that level
    if (typeof args.level === "number") {
      const nodesAtLevel = getNodesAtLevel(hierarchy, args.level)
      return JSON.stringify({
        path: args.path,
        format,
        level: args.level,
        nodeCount: nodesAtLevel.length,
        nodes: nodesAtLevel.map(n => ({
          id: n.id,
          name: n.name,
          type: n.type,
          path: n.path,
          preview: n.content.substring(0, 100),
          childCount: n.children.length
        }))
      }, null, 2)
    }

    // If query specified, search for matching nodes
    if (args.query) {
      // Simple path-based query
      const matchingNodes: HierarchyNode[] = []
      const queryLower = args.query.toLowerCase()

      function search(node: HierarchyNode): void {
        if (
          node.path.toLowerCase().includes(queryLower) ||
          node.name.toLowerCase().includes(queryLower) ||
          node.content.toLowerCase().includes(queryLower)
        ) {
          matchingNodes.push(node)
        }
        for (const child of node.children) {
          search(child)
        }
      }
      search(hierarchy)

      return JSON.stringify({
        path: args.path,
        format,
        query: args.query,
        matchCount: matchingNodes.length,
        matches: matchingNodes.map(n => ({
          id: n.id,
          name: n.name,
          path: n.path,
          line: n.startLine,
          preview: n.content.substring(0, 100)
        }))
      }, null, 2)
    }

    // Return full hierarchy overview
    return JSON.stringify({
      path: args.path,
      format,
      root: {
        id: hierarchy.id,
        name: hierarchy.name,
        childCount: hierarchy.children.length
      },
      maxDepth: getMaxDepth(hierarchy),
      totalNodes: countNodes(hierarchy),
      structure: serializeHierarchy(hierarchy, 2) // Limited depth for overview
    }, null, 2)
  }
})

// Shard document by hierarchy levels
export const shard = tool({
  description: "Shard a document by hierarchy levels for parallel processing. Returns independent chunks with IDs.",
  args: {
    path: tool.schema.string().describe("Path to file (relative to project root)"),
    maxDepth: tool.schema.number().optional().describe("Max depth to shard (default: 2)"),
    format: tool.schema.string().optional().describe("Format: xml, yaml, json, md, auto (default: auto-detect)")
  },
  async execute(args, context) {
    const filePath = join(context.directory, args.path)

    if (!existsSync(filePath)) {
      return JSON.stringify({ error: `File not found: ${args.path}` })
    }

    const content = readFileSync(filePath, "utf8")
    const format = (args.format as SupportedFormat) || detectFormat(filePath, content)
    const hierarchy = parseHierarchyFn(filePath, format)

    if (!hierarchy) {
      return JSON.stringify({ error: `Failed to parse ${args.path} as ${format}` })
    }

    const maxDepth = args.maxDepth || 2
    const shards = shardHierarchy(hierarchy, maxDepth)

    return JSON.stringify({
      path: args.path,
      format,
      maxDepth,
      shardCount: shards.length,
      shards: shards.map(s => ({
        id: s.id,
        level: s.level,
        path: s.path,
        lines: `${s.startLine}-${s.endLine}`,
        childCount: s.childCount,
        preview: s.content.substring(0, 80)
      }))
    }, null, 2)
  }
})

// Create searchable index with IDs
export const index = tool({
  description: "Create ID-based index of hierarchical data for fast lookup. Stores in .idumb/brain/indexes/",
  args: {
    path: tool.schema.string().describe("Path to file (relative to project root)"),
    force: tool.schema.boolean().optional().describe("Force re-index even if cached index exists")
  },
  async execute(args, context) {
    const filePath = join(context.directory, args.path)

    if (!existsSync(filePath)) {
      return JSON.stringify({ error: `File not found: ${args.path}` })
    }

    // Check for valid cached index
    if (!args.force) {
      const existingIndex = getValidIndex(context.directory, filePath)
      if (existingIndex) {
        return JSON.stringify({
          path: args.path,
          cached: true,
          indexPath: `${filePath}.index.json`,
          totalNodes: existingIndex.totalNodes,
          maxDepth: existingIndex.maxDepth,
          created: existingIndex.created,
          message: "Using cached index. Use force: true to re-index."
        }, null, 2)
      }
    }

    const content = readFileSync(filePath, "utf8")
    const format = detectFormat(filePath, content)
    const hierarchy = parseHierarchyFn(filePath, format)

    if (!hierarchy) {
      return JSON.stringify({ error: `Failed to parse ${args.path} as ${format}` })
    }

    const newIndex = createIndex(hierarchy, filePath, format)
    const indexPath = saveIndex(newIndex, context.directory)

    return JSON.stringify({
      path: args.path,
      format,
      indexPath,
      totalNodes: newIndex.totalNodes,
      maxDepth: newIndex.maxDepth,
      created: newIndex.created,
      usage: {
        query: "Use idumb-chunker.extract with query to search the index"
      }
    }, null, 2)
  }
})

// Fast extraction via bash integration
export const extract = tool({
  description: "Fast extract using bash tools (jq, yq, xmllint) for large files. Falls back to native parsing if tools unavailable.",
  args: {
    path: tool.schema.string().describe("Path to file (relative to project root)"),
    query: tool.schema.string().describe("Query string (jq syntax for JSON, yq for YAML, xpath for XML)"),
    useBash: tool.schema.boolean().optional().describe("Force bash tools (default: auto-detect based on file size)")
  },
  async execute(args, context) {
    const filePath = join(context.directory, args.path)

    if (!existsSync(filePath)) {
      return JSON.stringify({ error: `File not found: ${args.path}` })
    }

    const format = detectFormat(filePath)
    const stats = statSync(filePath)
    const useBash = args.useBash ?? (stats.size > 100 * 1024) // Default to bash for files > 100KB

    let result: BashExecutorResult

    if (useBash) {
      // Check available tools
      const tools = checkBashTools()

      if (format === "json" && tools.jq) {
        result = await jqExtract(filePath, args.query)
      } else if (format === "yaml" && tools.yq) {
        result = await yqExtract(filePath, args.query)
      } else if (format === "xml" && tools.xmllint) {
        result = await xmlExtract(filePath, args.query)
      } else {
        result = await autoExtract(filePath, args.query)
      }
    } else {
      // Use native parsing
      const hierarchy = parseHierarchyFn(filePath, format)
      if (!hierarchy) {
        return JSON.stringify({ error: `Failed to parse ${args.path}` })
      }

      // Search hierarchy for query matches
      const matches: string[] = []
      const queryLower = args.query.toLowerCase()

      function search(node: HierarchyNode): void {
        if (node.name.toLowerCase().includes(queryLower) || node.path.includes(args.query)) {
          matches.push(node.content || node.name)
        }
        for (const child of node.children) {
          search(child)
        }
      }
      search(hierarchy)

      result = {
        success: true,
        output: matches.join("\n"),
        executionTime: 0,
        tool: "native"
      }
    }

    return JSON.stringify({
      path: args.path,
      query: args.query,
      format,
      usedBash: useBash && !result.fallback,
      tool: result.tool,
      success: result.success,
      executionTime: `${result.executionTime}ms`,
      output: result.output
    }, null, 2)
  }
})

// Insert content at hierarchy position
export const insert = tool({
  description: "Insert content at specific hierarchy position. Uses bash (sed) for fast insertion on large files.",
  args: {
    path: tool.schema.string().describe("Path to file (relative to project root)"),
    after: tool.schema.string().optional().describe("Insert after this element/header (by ID, path, or text)"),
    before: tool.schema.string().optional().describe("Insert before this element/header (by ID, path, or text)"),
    atLine: tool.schema.number().optional().describe("Insert at specific line number"),
    content: tool.schema.string().describe("Content to insert")
  },
  async execute(args, context) {
    const filePath = join(context.directory, args.path)

    if (!existsSync(filePath)) {
      return JSON.stringify({ error: `File not found: ${args.path}` })
    }

    if (!args.after && !args.before && !args.atLine) {
      return JSON.stringify({ error: "Must specify 'after', 'before', or 'atLine'" })
    }

    const lines = getFileLines(filePath)
    let insertLine: number

    if (args.atLine) {
      insertLine = args.atLine
    } else {
      // Find position by parsing hierarchy
      const format = detectFormat(filePath)
      const hierarchy = parseHierarchyFn(filePath, format)
      if (!hierarchy) {
        return JSON.stringify({ error: `Failed to parse ${args.path}` })
      }

      const target = args.after || args.before
      const targetLower = target!.toLowerCase()

      // Find matching node
      let matchedNode: HierarchyNode | null = null
      function findNode(node: HierarchyNode): void {
        if (matchedNode) return
        if (
          node.id === target ||
          node.path.toLowerCase().includes(targetLower) ||
          node.name.toLowerCase().includes(targetLower)
        ) {
          matchedNode = node
        }
        for (const child of node.children) {
          findNode(child)
        }
      }
      findNode(hierarchy)

      if (!matchedNode) {
        return JSON.stringify({ error: `Target not found: ${target}` })
      }

      insertLine = args.after ? matchedNode.endLine + 1 : matchedNode.startLine
    }

    // Validate line number
    if (insertLine < 1 || insertLine > lines.length + 1) {
      return JSON.stringify({ error: `Invalid line number: ${insertLine}` })
    }

    // Use bash for large files
    const stats = statSync(filePath)
    if (stats.size > 100 * 1024) {
      const result = await bashInsertAt(filePath, insertLine, args.content)
      if (result.success) {
        return JSON.stringify({
          success: true,
          path: args.path,
          insertedAt: insertLine,
          tool: "bash",
          executionTime: `${result.executionTime}ms`
        }, null, 2)
      }
    }

    // Native insertion
    lines.splice(insertLine - 1, 0, args.content)
    writeFileSync(filePath, lines.join("\n"))

    return JSON.stringify({
      success: true,
      path: args.path,
      insertedAt: insertLine,
      tool: "native",
      newLineCount: lines.length
    }, null, 2)
  }
})

// Target edit at specific hierarchy node
export const targetEdit = tool({
  description: "Edit content at specific hierarchy location by ID, path, or text match.",
  args: {
    path: tool.schema.string().describe("Path to file (relative to project root)"),
    target: tool.schema.string().describe("Target selector (node ID, path like '/root/section', or text match)"),
    newContent: tool.schema.string().describe("New content to replace the target"),
    mode: tool.schema.string().optional().describe("Mode: 'replace' (default), 'append', 'prepend'")
  },
  async execute(args, context) {
    const filePath = join(context.directory, args.path)

    if (!existsSync(filePath)) {
      return JSON.stringify({ error: `File not found: ${args.path}` })
    }

    const format = detectFormat(filePath)
    const hierarchy = parseHierarchyFn(filePath, format)
    if (!hierarchy) {
      return JSON.stringify({ error: `Failed to parse ${args.path}` })
    }

    const targetLower = args.target.toLowerCase()

    // Find matching node
    let matchedNode: HierarchyNode | null = null
    function findNode(node: HierarchyNode): void {
      if (matchedNode) return
      if (
        node.id === args.target ||
        node.path === args.target ||
        node.path.toLowerCase().includes(targetLower) ||
        node.name.toLowerCase().includes(targetLower)
      ) {
        matchedNode = node
      }
      for (const child of node.children) {
        findNode(child)
      }
    }
    findNode(hierarchy)

    if (!matchedNode) {
      return JSON.stringify({ error: `Target not found: ${args.target}` })
    }

    // Read file and apply edit
    const lines = getFileLines(filePath)
    const mode = args.mode || "replace"

    const startIdx = matchedNode.startLine - 1
    const endIdx = matchedNode.endLine

    // Get existing content
    const existingContent = lines.slice(startIdx, endIdx).join("\n")

    let newLines: string[]
    switch (mode) {
      case "append":
        newLines = [...lines.slice(0, endIdx), args.newContent, ...lines.slice(endIdx)]
        break
      case "prepend":
        newLines = [...lines.slice(0, startIdx), args.newContent, ...lines.slice(startIdx)]
        break
      case "replace":
      default:
        newLines = [...lines.slice(0, startIdx), args.newContent, ...lines.slice(endIdx)]
    }

    writeFileSync(filePath, newLines.join("\n"))

    return JSON.stringify({
      success: true,
      path: args.path,
      target: args.target,
      matchedNode: {
        id: matchedNode.id,
        path: matchedNode.path,
        lines: `${matchedNode.startLine}-${matchedNode.endLine}`
      },
      mode,
      previousLength: existingContent.length,
      newLength: args.newContent.length
    }, null, 2)
  }
})

// ============================================================================
// HELPER FUNCTIONS FOR NEW TOOLS
// ============================================================================

function getMaxDepth(node: HierarchyNode): number {
  if (node.children.length === 0) return node.level
  return Math.max(...node.children.map(getMaxDepth))
}

function countNodes(node: HierarchyNode): number {
  return 1 + node.children.reduce((sum, child) => sum + countNodes(child), 0)
}

function serializeHierarchy(node: HierarchyNode, maxDepth: number): any {
  if (node.level > maxDepth) {
    return { id: node.id, name: node.name, childCount: node.children.length }
  }
  return {
    id: node.id,
    name: node.name,
    type: node.type,
    level: node.level,
    children: node.children.map(c => serializeHierarchy(c, maxDepth))
  }
}

