/**
 * Hierarchy Parsers for XML, YAML, JSON, and Markdown
 * 
 * Converts structured documents into HierarchyNode trees for sharding and indexing.
 * 
 * CRITICAL: NO console.log - would pollute TUI
 */

import { existsSync, readFileSync } from "fs"
import type { HierarchyNode } from "./index-manager"
import { generateHierarchyId } from "./index-manager"

// ============================================================================
// FORMAT DETECTION
// ============================================================================

export type SupportedFormat = "xml" | "yaml" | "json" | "md"

/**
 * Detect file format from extension and content
 */
export function detectFormat(filePath: string, content?: string): SupportedFormat {
    const ext = filePath.split('.').pop()?.toLowerCase()

    // Extension-based detection
    if (ext === 'xml') return 'xml'
    if (ext === 'yaml' || ext === 'yml') return 'yaml'
    if (ext === 'json') return 'json'
    if (ext === 'md' || ext === 'markdown') return 'md'

    // Content sniffing
    if (content) {
        const trimmed = content.trim()
        if (trimmed.startsWith('<?xml') || trimmed.startsWith('<')) return 'xml'
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) return 'json'
        if (trimmed.startsWith('---') || /^\w+:\s/m.test(trimmed)) return 'yaml'
    }

    // Default to markdown
    return 'md'
}

// ============================================================================
// MARKDOWN PARSER
// ============================================================================

/**
 * Parse Markdown into hierarchy based on headers
 * Headers create hierarchy: # = level 1, ## = level 2, etc.
 */
export function parseMdHierarchy(content: string, filePath: string = ''): HierarchyNode {
    const lines = content.split('\n')
    let currentId = 0

    const root: HierarchyNode = {
        id: generateHierarchyId(null, 0, 'root'),
        level: 0,
        type: 'root',
        name: filePath || 'document',
        content: '',
        children: [],
        parent: null,
        startLine: 1,
        endLine: lines.length,
        path: '/'
    }

    // Parse frontmatter if present
    let frontmatterEnd = 0
    if (lines[0] === '---') {
        frontmatterEnd = lines.findIndex((l, i) => i > 0 && l === '---')
        if (frontmatterEnd > 0) {
            const fmContent = lines.slice(1, frontmatterEnd).join('\n')
            const fmNode: HierarchyNode = {
                id: generateHierarchyId(root.id, ++currentId, 'frontmatter'),
                level: 1,
                type: 'frontmatter',
                name: 'frontmatter',
                content: fmContent,
                children: [],
                parent: root.id,
                startLine: 1,
                endLine: frontmatterEnd + 1,
                path: '/frontmatter'
            }
            root.children.push(fmNode)
        }
    }

    // Parse headers
    const stack: HierarchyNode[] = [root]
    let currentContent: string[] = []
    let contentStartLine = frontmatterEnd + 2

    for (let i = frontmatterEnd + 1; i < lines.length; i++) {
        const line = lines[i]
        const headerMatch = line.match(/^(#{1,6})\s+(.+)$/)

        if (headerMatch) {
            // Save previous section content
            if (stack.length > 1 && currentContent.length > 0) {
                const currentNode = stack[stack.length - 1]
                currentNode.content = currentContent.join('\n')
                currentNode.endLine = i
            }

            const headerLevel = headerMatch[1].length
            const headerText = headerMatch[2]

            // Pop stack until we find parent level
            while (stack.length > 1 && stack[stack.length - 1].level >= headerLevel) {
                stack.pop()
            }

            const parent = stack[stack.length - 1]
            const parentChildIndex = parent.children.length + 1

            const headerNode: HierarchyNode = {
                id: generateHierarchyId(parent.id, parentChildIndex, 'header'),
                level: headerLevel,
                type: 'header',
                name: headerText,
                content: '',
                children: [],
                parent: parent.id,
                startLine: i + 1,
                endLine: lines.length, // Will be updated
                path: `${parent.path === '/' ? '' : parent.path}/${headerText.toLowerCase().replace(/\s+/g, '-')}`
            }

            parent.children.push(headerNode)
            stack.push(headerNode)
            currentContent = []
            contentStartLine = i + 2
        } else {
            currentContent.push(line)
        }
    }

    // Save final section content
    if (stack.length > 1 && currentContent.length > 0) {
        const currentNode = stack[stack.length - 1]
        currentNode.content = currentContent.join('\n')
        currentNode.endLine = lines.length
    }

    return root
}

// ============================================================================
// JSON PARSER
// ============================================================================

/**
 * Parse JSON into hierarchy
 * Objects and arrays create nested levels
 */
export function parseJsonHierarchy(content: string, filePath: string = ''): HierarchyNode {
    let parsed: any
    try {
        parsed = JSON.parse(content)
    } catch (e) {
        // Return error node
        return {
            id: 'ERROR-0',
            level: 0,
            type: 'error',
            name: 'parse_error',
            content: `Failed to parse JSON: ${e}`,
            children: [],
            parent: null,
            startLine: 1,
            endLine: 1,
            path: '/'
        }
    }

    const lines = content.split('\n')
    let currentId = 0

    function parseNode(
        value: any,
        name: string,
        parentId: string | null,
        level: number,
        path: string,
        lineHint: number
    ): HierarchyNode {
        const id = generateHierarchyId(parentId, ++currentId, typeof value === 'object' ? (Array.isArray(value) ? 'array' : 'object') : 'value')

        const node: HierarchyNode = {
            id,
            level,
            type: typeof value === 'object' ? (Array.isArray(value) ? 'array' : 'object') : typeof value,
            name,
            content: typeof value === 'object' ? '' : String(value),
            children: [],
            parent: parentId,
            startLine: lineHint,
            endLine: lineHint, // Will be updated
            path
        }

        if (typeof value === 'object' && value !== null) {
            if (Array.isArray(value)) {
                value.forEach((item, index) => {
                    const childPath = `${path}[${index}]`
                    const child = parseNode(item, `[${index}]`, id, level + 1, childPath, lineHint + index)
                    node.children.push(child)
                })
            } else {
                Object.keys(value).forEach((key, index) => {
                    const childPath = `${path}/${key}`
                    const child = parseNode(value[key], key, id, level + 1, childPath, lineHint + index)
                    node.children.push(child)
                })
            }
        }

        return node
    }

    const root = parseNode(parsed, filePath || 'root', null, 0, '/', 1)
    root.endLine = lines.length

    return root
}

// ============================================================================
// YAML PARSER
// ============================================================================

/**
 * Parse YAML into hierarchy (simplified parser for common YAML structures)
 * Uses indentation-based hierarchy detection
 */
export function parseYamlHierarchy(content: string, filePath: string = ''): HierarchyNode {
    const lines = content.split('\n')
    let currentId = 0

    const root: HierarchyNode = {
        id: generateHierarchyId(null, 0, 'root'),
        level: 0,
        type: 'root',
        name: filePath || 'document',
        content: '',
        children: [],
        parent: null,
        startLine: 1,
        endLine: lines.length,
        path: '/'
    }

    // Handle document separator if present
    let startLine = 0
    if (lines[0] === '---') {
        startLine = 1
    }

    const stack: Array<{ node: HierarchyNode; indent: number }> = [{ node: root, indent: -1 }]

    for (let i = startLine; i < lines.length; i++) {
        const line = lines[i]
        if (line.trim() === '' || line.trim().startsWith('#')) continue
        if (line === '---' || line === '...') continue

        // Calculate indentation
        const indent = line.search(/\S/)
        if (indent === -1) continue

        // Parse key: value or list item
        const keyMatch = line.trim().match(/^([^:]+):\s*(.*)$/)
        const listMatch = line.trim().match(/^-\s*(.*)$/)

        let nodeName: string
        let nodeContent: string
        let nodeType: string

        if (keyMatch) {
            nodeName = keyMatch[1].trim()
            nodeContent = keyMatch[2].trim()
            nodeType = nodeContent ? 'key' : 'object'
        } else if (listMatch) {
            nodeName = `item_${i}`
            nodeContent = listMatch[1].trim()
            nodeType = 'array_item'
        } else {
            continue
        }

        // Pop stack to find parent
        while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
            stack.pop()
        }

        const parent = stack[stack.length - 1].node
        const childIndex = parent.children.length + 1

        const node: HierarchyNode = {
            id: generateHierarchyId(parent.id, childIndex, nodeType),
            level: stack.length,
            type: nodeType,
            name: nodeName,
            content: nodeContent,
            children: [],
            parent: parent.id,
            startLine: i + 1,
            endLine: i + 1,
            path: `${parent.path === '/' ? '' : parent.path}/${nodeName}`
        }

        parent.children.push(node)
        stack.push({ node, indent })
    }

    return root
}

// ============================================================================
// XML PARSER
// ============================================================================

/**
 * Parse XML into hierarchy (simplified DOM-like parser)
 */
export function parseXmlHierarchy(content: string, filePath: string = ''): HierarchyNode {
    const lines = content.split('\n')
    let currentId = 0

    const root: HierarchyNode = {
        id: generateHierarchyId(null, 0, 'root'),
        level: 0,
        type: 'root',
        name: filePath || 'document',
        content: '',
        children: [],
        parent: null,
        startLine: 1,
        endLine: lines.length,
        path: '/'
    }

    // Simple tag-based parsing
    const tagStack: Array<{ node: HierarchyNode; tag: string }> = [{ node: root, tag: '' }]

    // Skip XML declaration
    let startLine = 0
    if (content.trim().startsWith('<?xml')) {
        startLine = content.indexOf('?>') !== -1 ? 1 : 0
    }

    // Regex for tag matching
    const openTagRegex = /<([a-zA-Z_][\w.-]*)\s*([^>]*)>/g
    const closeTagRegex = /<\/([a-zA-Z_][\w.-]*)>/g
    const selfCloseRegex = /<([a-zA-Z_][\w.-]*)\s*([^>]*)\/>/g

    let lineNum = startLine
    for (const line of lines.slice(startLine)) {
        lineNum++

        // Process self-closing tags
        let selfMatch
        while ((selfMatch = selfCloseRegex.exec(line)) !== null) {
            const tagName = selfMatch[1]
            const attrs = selfMatch[2]
            const parent = tagStack[tagStack.length - 1].node
            const childIndex = parent.children.length + 1

            const node: HierarchyNode = {
                id: generateHierarchyId(parent.id, childIndex, 'element'),
                level: tagStack.length,
                type: 'element',
                name: tagName,
                content: attrs.trim(),
                children: [],
                parent: parent.id,
                startLine: lineNum,
                endLine: lineNum,
                path: `${parent.path === '/' ? '' : parent.path}/${tagName}`
            }

            parent.children.push(node)
        }

        // Process opening tags
        let openMatch
        while ((openMatch = openTagRegex.exec(line)) !== null) {
            const tagName = openMatch[1]
            const attrs = openMatch[2]

            // Skip if this was a self-closing tag
            if (attrs.endsWith('/')) continue

            const parent = tagStack[tagStack.length - 1].node
            const childIndex = parent.children.length + 1

            const node: HierarchyNode = {
                id: generateHierarchyId(parent.id, childIndex, 'element'),
                level: tagStack.length,
                type: 'element',
                name: tagName,
                content: '',
                children: [],
                parent: parent.id,
                startLine: lineNum,
                endLine: lineNum,
                path: `${parent.path === '/' ? '' : parent.path}/${tagName}`
            }

            parent.children.push(node)
            tagStack.push({ node, tag: tagName })
        }

        // Process closing tags
        let closeMatch
        while ((closeMatch = closeTagRegex.exec(line)) !== null) {
            const tagName = closeMatch[1]

            // Pop matching tag
            for (let i = tagStack.length - 1; i > 0; i--) {
                if (tagStack[i].tag === tagName) {
                    tagStack[i].node.endLine = lineNum
                    tagStack.splice(i, 1)
                    break
                }
            }
        }
    }

    return root
}

// ============================================================================
// UNIFIED PARSER
// ============================================================================

/**
 * Parse any supported file format into hierarchy
 */
export function parseHierarchy(
    filePath: string,
    format?: SupportedFormat
): HierarchyNode | null {
    if (!existsSync(filePath)) {
        return null
    }

    const content = readFileSync(filePath, 'utf8')
    const detectedFormat = format || detectFormat(filePath, content)

    switch (detectedFormat) {
        case 'md':
            return parseMdHierarchy(content, filePath)
        case 'json':
            return parseJsonHierarchy(content, filePath)
        case 'yaml':
            return parseYamlHierarchy(content, filePath)
        case 'xml':
            return parseXmlHierarchy(content, filePath)
        default:
            return parseMdHierarchy(content, filePath)
    }
}

/**
 * Parse hierarchy from string content
 */
export function parseHierarchyFromString(
    content: string,
    format: SupportedFormat,
    name: string = 'content'
): HierarchyNode {
    switch (format) {
        case 'md':
            return parseMdHierarchy(content, name)
        case 'json':
            return parseJsonHierarchy(content, name)
        case 'yaml':
            return parseYamlHierarchy(content, name)
        case 'xml':
            return parseXmlHierarchy(content, name)
        default:
            return parseMdHierarchy(content, name)
    }
}

// ============================================================================
// SHARDING
// ============================================================================

export interface Shard {
    id: string
    parentId: string | null
    level: number
    path: string
    content: string
    startLine: number
    endLine: number
    childCount: number
}

/**
 * Shard a hierarchy into independent chunks for parallel processing
 * @param hierarchy Root hierarchy node
 * @param maxDepth Maximum depth to shard (default: 2)
 */
export function shardHierarchy(hierarchy: HierarchyNode, maxDepth: number = 2): Shard[] {
    const shards: Shard[] = []

    function traverse(node: HierarchyNode): void {
        // Only shard nodes at or below maxDepth
        if (node.level <= maxDepth) {
            shards.push({
                id: node.id,
                parentId: node.parent,
                level: node.level,
                path: node.path,
                content: node.content,
                startLine: node.startLine,
                endLine: node.endLine,
                childCount: node.children.length
            })
        }

        // Continue traversing children
        for (const child of node.children) {
            traverse(child)
        }
    }

    traverse(hierarchy)
    return shards
}

/**
 * Get a specific shard by ID from hierarchy
 */
export function getShardById(hierarchy: HierarchyNode, shardId: string): HierarchyNode | null {
    if (hierarchy.id === shardId) return hierarchy

    for (const child of hierarchy.children) {
        const found = getShardById(child, shardId)
        if (found) return found
    }

    return null
}

/**
 * Get all nodes at a specific level
 */
export function getNodesAtLevel(hierarchy: HierarchyNode, level: number): HierarchyNode[] {
    const nodes: HierarchyNode[] = []

    function traverse(node: HierarchyNode): void {
        if (node.level === level) {
            nodes.push(node)
        }
        for (const child of node.children) {
            traverse(child)
        }
    }

    traverse(hierarchy)
    return nodes
}
