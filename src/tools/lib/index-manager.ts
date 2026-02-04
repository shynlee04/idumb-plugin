/**
 * Index Manager for Hierarchical Data
 * 
 * Creates searchable indexes with unique IDs for fast lookup.
 * Stores indexes in .idumb/idumb-brain/indexes/
 * 
 * CRITICAL: NO console.log - would pollute TUI
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs"
import { join, basename } from "path"

// ============================================================================
// TYPES
// ============================================================================

export interface HierarchyNode {
    id: string           // Unique ID for this node (e.g., "SEC-1.2.3")
    level: number        // Depth in hierarchy (0 = root)
    type: string         // Element type (tag, key, header, object, array)
    name: string         // Node name (tag name, key, header text)
    content: string      // Node content (truncated for large content)
    children: HierarchyNode[]
    parent: string | null // Parent ID for ancestry tracking
    startLine: number
    endLine: number
    path: string         // Full path in hierarchy (e.g., "/root/section/item")
}

export interface IndexEntry {
    id: string           // Unique hierarchical ID
    path: string         // Full path within document
    type: string         // Node type
    name: string         // Node name
    preview: string      // First 100 chars of content
    line: number         // Start line
    endLine: number      // End line
    level: number        // Hierarchy depth
    parent: string | null // Parent ID
    children: string[]   // Child IDs
}

export interface Index {
    version: string
    created: string
    lastAccessed: string
    sourceFile: string
    sourceHash: string   // For cache invalidation
    format: string
    totalNodes: number
    maxDepth: number
    entries: IndexEntry[]
}

// ============================================================================
// ID GENERATION
// ============================================================================

/**
 * Generate unique ID based on hierarchy position
 * Format: TYPE-level.index.subindex (e.g., SEC-1.2.3)
 */
export function generateHierarchyId(
    parent: string | null,
    index: number,
    type: string
): string {
    // Type prefix (first 3 chars uppercase)
    const typePrefix: Record<string, string> = {
        'header': 'HDR',
        'section': 'SEC',
        'element': 'ELM',
        'object': 'OBJ',
        'array': 'ARR',
        'key': 'KEY',
        'text': 'TXT',
        'root': 'ROOT',
        'frontmatter': 'FRM'
    }
    const prefix = typePrefix[type.toLowerCase()] || type.substring(0, 3).toUpperCase()

    if (!parent) {
        return `${prefix}-${index}`
    }

    // Extract numeric part from parent and append
    const parentNumeric = parent.replace(/^[A-Z]+-/, '')
    return `${prefix}-${parentNumeric}.${index}`
}

/**
 * Generate simple content hash for cache invalidation
 */
export function hashContent(content: string): string {
    let hash = 0
    for (let i = 0; i < content.length; i++) {
        const char = content.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16)
}

// ============================================================================
// INDEX CREATION
// ============================================================================

/**
 * Create index from hierarchy tree
 */
export function createIndex(
    hierarchy: HierarchyNode,
    sourcePath: string,
    format: string
): Index {
    const entries: IndexEntry[] = []
    let maxDepth = 0

    function traverse(node: HierarchyNode): void {
        maxDepth = Math.max(maxDepth, node.level)

        entries.push({
            id: node.id,
            path: node.path,
            type: node.type,
            name: node.name,
            preview: node.content.substring(0, 100),
            line: node.startLine,
            endLine: node.endLine,
            level: node.level,
            parent: node.parent,
            children: node.children.map(c => c.id)
        })

        for (const child of node.children) {
            traverse(child)
        }
    }

    traverse(hierarchy)

    const sourceContent = existsSync(sourcePath) ? readFileSync(sourcePath, 'utf8') : ''

    return {
        version: '1.0.0',
        created: new Date().toISOString(),
        lastAccessed: new Date().toISOString(),
        sourceFile: sourcePath,
        sourceHash: hashContent(sourceContent),
        format,
        totalNodes: entries.length,
        maxDepth,
        entries
    }
}

// ============================================================================
// INDEX STORAGE
// ============================================================================

/**
 * Get indexes directory path
 */
export function getIndexesDir(directory: string): string {
    return join(directory, '.idumb', 'idumb-brain', 'indexes')
}

/**
 * Save index to disk
 * @returns Path to saved index
 */
export function saveIndex(index: Index, directory: string): string {
    const indexDir = getIndexesDir(directory)

    // Ensure directory exists
    if (!existsSync(indexDir)) {
        mkdirSync(indexDir, { recursive: true })
    }

    // Generate index filename from source file
    const sourceBasename = basename(index.sourceFile)
    const indexFilename = `${sourceBasename}.index.json`
    const indexPath = join(indexDir, indexFilename)

    writeFileSync(indexPath, JSON.stringify(index, null, 2))

    return indexPath
}

/**
 * Load index from disk
 */
export function loadIndex(indexPath: string): Index | null {
    if (!existsSync(indexPath)) {
        return null
    }

    try {
        const content = readFileSync(indexPath, 'utf8')
        const index = JSON.parse(content) as Index

        // Update last accessed
        index.lastAccessed = new Date().toISOString()
        writeFileSync(indexPath, JSON.stringify(index, null, 2))

        return index
    } catch {
        return null
    }
}

/**
 * Check if index is stale (source file changed)
 */
export function isIndexStale(index: Index): boolean {
    if (!existsSync(index.sourceFile)) {
        return true
    }

    const currentContent = readFileSync(index.sourceFile, 'utf8')
    const currentHash = hashContent(currentContent)

    return currentHash !== index.sourceHash
}

// ============================================================================
// INDEX QUERYING
// ============================================================================

/**
 * Query index by ID
 */
export function queryById(index: Index, id: string): IndexEntry | null {
    return index.entries.find(e => e.id === id) || null
}

/**
 * Query index by path pattern
 * Supports wildcards: * (any segment), ** (any depth)
 */
export function queryByPath(index: Index, pathPattern: string): IndexEntry[] {
    const pattern = pathPattern
        .replace(/\*\*/g, '.*')
        .replace(/\*/g, '[^/]+')

    const regex = new RegExp(`^${pattern}$`)
    return index.entries.filter(e => regex.test(e.path))
}

/**
 * Query index by type
 */
export function queryByType(index: Index, type: string): IndexEntry[] {
    return index.entries.filter(e => e.type.toLowerCase() === type.toLowerCase())
}

/**
 * Query index by level
 */
export function queryByLevel(index: Index, level: number): IndexEntry[] {
    return index.entries.filter(e => e.level === level)
}

/**
 * Query index by content preview (substring match)
 */
export function queryByContent(index: Index, substring: string): IndexEntry[] {
    const lower = substring.toLowerCase()
    return index.entries.filter(e =>
        e.preview.toLowerCase().includes(lower) ||
        e.name.toLowerCase().includes(lower)
    )
}

/**
 * Get all children of a node (recursive)
 */
export function getDescendants(index: Index, parentId: string): IndexEntry[] {
    const parent = queryById(index, parentId)
    if (!parent) return []

    const descendants: IndexEntry[] = []
    const queue = [...parent.children]

    while (queue.length > 0) {
        const childId = queue.shift()!
        const child = queryById(index, childId)
        if (child) {
            descendants.push(child)
            queue.push(...child.children)
        }
    }

    return descendants
}

/**
 * Get ancestors of a node (up to root)
 */
export function getAncestors(index: Index, nodeId: string): IndexEntry[] {
    const ancestors: IndexEntry[] = []
    let current = queryById(index, nodeId)

    while (current && current.parent) {
        const parent = queryById(index, current.parent)
        if (parent) {
            ancestors.push(parent)
            current = parent
        } else {
            break
        }
    }

    return ancestors
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * List all indexes in directory
 */
export function listIndexes(directory: string): string[] {
    const indexDir = getIndexesDir(directory)

    if (!existsSync(indexDir)) {
        return []
    }

    const { readdirSync } = require('fs')
    const files = readdirSync(indexDir) as string[]

    return files
        .filter(f => f.endsWith('.index.json'))
        .map(f => join(indexDir, f))
}

/**
 * Get index for a source file (if exists and not stale)
 */
export function getValidIndex(directory: string, sourceFile: string): Index | null {
    const indexDir = getIndexesDir(directory)
    const sourceBasename = basename(sourceFile)
    const indexPath = join(indexDir, `${sourceBasename}.index.json`)

    const index = loadIndex(indexPath)
    if (!index) return null

    // Check if stale
    if (isIndexStale(index)) {
        return null
    }

    return index
}

/**
 * Clear index for a source file
 */
export function clearIndex(directory: string, sourceFile: string): boolean {
    const { unlinkSync } = require('fs')
    const indexDir = getIndexesDir(directory)
    const sourceBasename = basename(sourceFile)
    const indexPath = join(indexDir, `${sourceBasename}.index.json`)

    if (existsSync(indexPath)) {
        unlinkSync(indexPath)
        return true
    }
    return false
}
