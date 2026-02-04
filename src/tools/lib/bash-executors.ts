/**
 * Bash Executors for Fast File Operations
 * 
 * Uses jq, yq, xmllint for performance on large files.
 * Falls back to native JS parsing when bash tools unavailable.
 * 
 * CRITICAL: NO console.log - would pollute TUI
 */

import { execSync, spawn, ChildProcess } from "child_process"
import { existsSync } from "fs"

// ============================================================================
// TYPES
// ============================================================================

export interface BashExecutorResult {
    success: boolean
    output: string
    executionTime: number
    tool: string
    fallback?: boolean
}

export interface AvailableTools {
    jq: boolean
    yq: boolean
    xmllint: boolean
    sed: boolean
    awk: boolean
}

// ============================================================================
// TOOL DETECTION
// ============================================================================

let cachedTools: AvailableTools | null = null

/**
 * Check which bash tools are available on the system
 * Results are cached for performance
 */
export function checkBashTools(): AvailableTools {
    if (cachedTools) return cachedTools

    const check = (cmd: string): boolean => {
        try {
            execSync(`which ${cmd}`, { stdio: 'pipe' })
            return true
        } catch {
            return false
        }
    }

    cachedTools = {
        jq: check('jq'),
        yq: check('yq'),
        xmllint: check('xmllint'),
        sed: check('sed'),
        awk: check('awk')
    }

    return cachedTools
}

/**
 * Reset tool cache (for testing)
 */
export function resetToolCache(): void {
    cachedTools = null
}

// ============================================================================
// JSON EXTRACTION (jq)
// ============================================================================

/**
 * Extract JSON data using jq
 * @param filePath Path to JSON file
 * @param query jq query string (e.g., '.dependencies | keys')
 */
export async function jqExtract(filePath: string, query: string): Promise<BashExecutorResult> {
    const start = Date.now()
    const tools = checkBashTools()

    if (!tools.jq) {
        return {
            success: false,
            output: 'jq not installed. Install with: brew install jq',
            executionTime: Date.now() - start,
            tool: 'jq',
            fallback: true
        }
    }

    if (!existsSync(filePath)) {
        return {
            success: false,
            output: `File not found: ${filePath}`,
            executionTime: Date.now() - start,
            tool: 'jq'
        }
    }

    try {
        // Escape query for shell safety
        const safeQuery = query.replace(/'/g, "'\\''")
        const output = execSync(`jq '${safeQuery}' "${filePath}"`, {
            encoding: 'utf8',
            maxBuffer: 50 * 1024 * 1024 // 50MB buffer for large files
        })
        return {
            success: true,
            output: output.trim(),
            executionTime: Date.now() - start,
            tool: 'jq'
        }
    } catch (e: any) {
        return {
            success: false,
            output: e.message || String(e),
            executionTime: Date.now() - start,
            tool: 'jq'
        }
    }
}

// ============================================================================
// YAML EXTRACTION (yq)
// ============================================================================

/**
 * Extract YAML data using yq
 * @param filePath Path to YAML file
 * @param query yq query string (e.g., '.metadata.name')
 */
export async function yqExtract(filePath: string, query: string): Promise<BashExecutorResult> {
    const start = Date.now()
    const tools = checkBashTools()

    if (!tools.yq) {
        return {
            success: false,
            output: 'yq not installed. Install with: brew install yq',
            executionTime: Date.now() - start,
            tool: 'yq',
            fallback: true
        }
    }

    if (!existsSync(filePath)) {
        return {
            success: false,
            output: `File not found: ${filePath}`,
            executionTime: Date.now() - start,
            tool: 'yq'
        }
    }

    try {
        const safeQuery = query.replace(/'/g, "'\\''")
        const output = execSync(`yq '${safeQuery}' "${filePath}"`, {
            encoding: 'utf8',
            maxBuffer: 50 * 1024 * 1024
        })
        return {
            success: true,
            output: output.trim(),
            executionTime: Date.now() - start,
            tool: 'yq'
        }
    } catch (e: any) {
        return {
            success: false,
            output: e.message || String(e),
            executionTime: Date.now() - start,
            tool: 'yq'
        }
    }
}

// ============================================================================
// XML EXTRACTION (xmllint)
// ============================================================================

/**
 * Extract XML data using xmllint with xpath
 * @param filePath Path to XML file
 * @param xpath XPath query string (e.g., '//dependency/artifactId/text()')
 */
export async function xmlExtract(filePath: string, xpath: string): Promise<BashExecutorResult> {
    const start = Date.now()
    const tools = checkBashTools()

    if (!tools.xmllint) {
        return {
            success: false,
            output: 'xmllint not installed. Install with: brew install libxml2',
            executionTime: Date.now() - start,
            tool: 'xmllint',
            fallback: true
        }
    }

    if (!existsSync(filePath)) {
        return {
            success: false,
            output: `File not found: ${filePath}`,
            executionTime: Date.now() - start,
            tool: 'xmllint'
        }
    }

    try {
        const safeXpath = xpath.replace(/'/g, "'\\''")
        const output = execSync(`xmllint --xpath '${safeXpath}' "${filePath}" 2>/dev/null || true`, {
            encoding: 'utf8',
            maxBuffer: 50 * 1024 * 1024
        })
        return {
            success: true,
            output: output.trim(),
            executionTime: Date.now() - start,
            tool: 'xmllint'
        }
    } catch (e: any) {
        return {
            success: false,
            output: e.message || String(e),
            executionTime: Date.now() - start,
            tool: 'xmllint'
        }
    }
}

// ============================================================================
// FAST LINE OPERATIONS (sed/awk)
// ============================================================================

/**
 * Fast insert content at specific line using sed
 * @param filePath Path to file
 * @param lineNum Line number to insert before (1-based)
 * @param content Content to insert
 */
export async function bashInsertAt(
    filePath: string,
    lineNum: number,
    content: string
): Promise<BashExecutorResult> {
    const start = Date.now()
    const tools = checkBashTools()

    if (!tools.sed) {
        return {
            success: false,
            output: 'sed not available',
            executionTime: Date.now() - start,
            tool: 'sed',
            fallback: true
        }
    }

    if (!existsSync(filePath)) {
        return {
            success: false,
            output: `File not found: ${filePath}`,
            executionTime: Date.now() - start,
            tool: 'sed'
        }
    }

    try {
        // Escape content for sed
        const escapedContent = content
            .replace(/\\/g, '\\\\')
            .replace(/\//g, '\\/')
            .replace(/&/g, '\\&')
            .replace(/\n/g, '\\n')

        // Use sed -i for in-place edit (macOS requires '' after -i)
        const isMac = process.platform === 'darwin'
        const sedCmd = isMac
            ? `sed -i '' '${lineNum}i\\
${escapedContent}
' "${filePath}"`
            : `sed -i '${lineNum}i\\${escapedContent}' "${filePath}"`

        execSync(sedCmd, { encoding: 'utf8' })

        return {
            success: true,
            output: `Inserted at line ${lineNum}`,
            executionTime: Date.now() - start,
            tool: 'sed'
        }
    } catch (e: any) {
        return {
            success: false,
            output: e.message || String(e),
            executionTime: Date.now() - start,
            tool: 'sed'
        }
    }
}

/**
 * Fast line extraction using sed
 * @param filePath Path to file
 * @param startLine Start line (1-based, inclusive)
 * @param endLine End line (1-based, inclusive)
 */
export async function bashExtractLines(
    filePath: string,
    startLine: number,
    endLine: number
): Promise<BashExecutorResult> {
    const start = Date.now()
    const tools = checkBashTools()

    if (!tools.sed) {
        return {
            success: false,
            output: 'sed not available',
            executionTime: Date.now() - start,
            tool: 'sed',
            fallback: true
        }
    }

    if (!existsSync(filePath)) {
        return {
            success: false,
            output: `File not found: ${filePath}`,
            executionTime: Date.now() - start,
            tool: 'sed'
        }
    }

    try {
        const output = execSync(`sed -n '${startLine},${endLine}p' "${filePath}"`, {
            encoding: 'utf8',
            maxBuffer: 50 * 1024 * 1024
        })
        return {
            success: true,
            output,
            executionTime: Date.now() - start,
            tool: 'sed'
        }
    } catch (e: any) {
        return {
            success: false,
            output: e.message || String(e),
            executionTime: Date.now() - start,
            tool: 'sed'
        }
    }
}

/**
 * Fast pattern-based extraction using grep
 * @param filePath Path to file
 * @param pattern Grep pattern (regex)
 * @param context Lines of context around match
 */
export async function bashGrepExtract(
    filePath: string,
    pattern: string,
    context: number = 0
): Promise<BashExecutorResult> {
    const start = Date.now()

    if (!existsSync(filePath)) {
        return {
            success: false,
            output: `File not found: ${filePath}`,
            executionTime: Date.now() - start,
            tool: 'grep'
        }
    }

    try {
        const contextFlag = context > 0 ? `-C ${context}` : ''
        const output = execSync(`grep ${contextFlag} -n "${pattern}" "${filePath}" || true`, {
            encoding: 'utf8',
            maxBuffer: 50 * 1024 * 1024
        })
        return {
            success: true,
            output: output.trim(),
            executionTime: Date.now() - start,
            tool: 'grep'
        }
    } catch (e: any) {
        return {
            success: false,
            output: e.message || String(e),
            executionTime: Date.now() - start,
            tool: 'grep'
        }
    }
}

// ============================================================================
// UTILITY: Auto-detect and extract
// ============================================================================

/**
 * Auto-detect format and use appropriate extractor
 * @param filePath Path to file
 * @param query Query string (format-specific)
 */
export async function autoExtract(filePath: string, query: string): Promise<BashExecutorResult> {
    const ext = filePath.split('.').pop()?.toLowerCase()

    switch (ext) {
        case 'json':
            return jqExtract(filePath, query)
        case 'yaml':
        case 'yml':
            return yqExtract(filePath, query)
        case 'xml':
            return xmlExtract(filePath, query)
        default:
            return bashGrepExtract(filePath, query)
    }
}
