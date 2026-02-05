/**
 * Frontmatter Auto-Generation for iDumb Documents
 *
 * Intercepts write/edit operations and injects YAML frontmatter
 * for documents in .idumb/ locations.
 *
 * Features:
 * - UUID v7 time-ordered IDs
 * - Location-based detection (only .idumb/ paths)
 * - Type detection from file path
 * - Title extraction from content or filename
 * - Preserves existing non-iDumb frontmatter
 *
 * @module frontmatter
 */

import matter from 'gray-matter'
import { v7 as uuidv7 } from 'uuid'

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Paths that receive automatic frontmatter injection
 */
const AUTO_FRONTMATTER_PATHS = [
  '.idumb/project-output/',
  '.idumb/sessions/',
  '.idumb/brain/governance/',
  '.idumb/brain/context/',
  '.idumb/brain/drift/',
] as const

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * iDumb frontmatter schema
 *
 * Phase 7 Enhanced: Extended with relationship tracking and decision trail fields
 */
export interface IdumbFrontmatter {
  /** UUID v7 identifier (time-ordered, sortable) */
  id: string
  /** Document title (extracted from content or filename) */
  title: string
  /** Document type (detected from path) */
  type: 'phase' | 'task' | 'research' | 'decision' | 'validation' | 'session' | 'checkpoint'
  /** ISO 8601 creation timestamp */
  created: string
  /** ISO 8601 update timestamp (present on updates) */
  updated?: string
  /** Session ID or parent document ID */
  parent_id?: string
  /** Agent that created this document */
  source_agent?: string
  /** Document lifecycle status */
  status?: 'draft' | 'active' | 'archived' | 'deleted'
  /** Optional description */
  description?: string
  /** Optional tags */
  tags?: string[]
  /** Priority level */
  priority?: 'low' | 'medium' | 'high' | 'critical'
  /** Associated milestone */
  milestone?: string
  /** Dependency IDs */
  dependencies?: string[]

  // ===== PHASE 7: ENHANCED RELATIONSHIP TRACKING FIELDS =====
  /** IDs of child documents (reverse lookup cache, auto-maintained) */
  child_ids?: string[]
  /** IDs of loosely referenced documents (non-dependencies) */
  references?: string[]
  /**
   * Schema type for validation
   * Auto-detected from document type (e.g., "phase-v1", "decision-v1")
   */
  schema_type?: string
  /**
   * Rationale for why this document exists
   * Particularly important for decision documents
   */
  decision_reason?: string
  /**
   * Post-mortem analysis of what went wrong
   * Used for learning from failures
   */
  failure_analysis?: string
  /** Linked requirement or milestone IDs */
  requirement_ids?: string[]
  /** Associated validation report IDs */
  validation_ids?: string[]
  /**
   * Extension point for user-defined metadata
   * Allows arbitrary custom fields while maintaining schema validation
   */
  custom?: Record<string, any>
}

// ============================================================================
// LOCATION DETECTION
// ============================================================================

/**
 * Determines if a file path should receive automatic frontmatter injection
 * @param filePath - Absolute or relative file path
 * @returns true if path is in managed .idumb/ location
 */
export function shouldAutoFrontmatter(filePath: string): boolean {
  return AUTO_FRONTMATTER_PATHS.some(p => filePath.includes(p))
}

/**
 * Detects document type from file path
 * @param filePath - File path to analyze
 * @returns Document type string
 */
export function detectDocumentType(filePath: string): string {
  const path = filePath.toLowerCase()

  // Check for specific patterns FIRST (most specific to least specific)
  if (path.includes('/phases/') || path.includes('/phase')) return 'phase'
  if (path.includes('/tasks/') || path.includes('/task')) return 'task'
  if (path.includes('/todo')) return 'task'
  if (path.includes('/research')) return 'research'
  if (path.includes('/decision') || path.includes('/decisions') || path.includes('/adr-')) return 'decision'
  if (path.includes('/validation') || path.includes('/validations')) return 'validation'
  if (path.includes('/sessions/')) return 'session'
  if (path.includes('/checkpoint')) return 'checkpoint'

  // Check filename patterns (for files directly under .idumb/)
  const filename = filePath.split('/').pop() || ''
  // Match P1-, 1-, phase- prefix patterns (at start of filename, case-insensitive)
  const prefixMatch = filename.match(/^(p?\d+|phase)[-._]/i)
  if (prefixMatch) return 'phase'
  if (filename.includes('phase')) return 'phase'
  if (filename.includes('task') || filename.includes('todo')) return 'task'
  if (filename.includes('research')) return 'research'
  if (filename.includes('decision') || filename.startsWith('adr-')) return 'decision'
  if (filename.includes('validation')) return 'validation'

  // Default: use parent directory name
  const parts = filePath.split('/')
  const parent = parts[parts.length - 2] || ''

  // Special case: .idumb directory should default to filename-based type
  if (parent === '.idumb' || parent === 'idumb') {
    // Use filename (without extension) as type
    const filenameWithoutExt = filename.replace(/\.(md|json|txt)$/, '')
    return filenameWithoutExt || 'unknown'
  }

  // Remove extension if parent is a filename
  const parentWithoutExt = parent.replace(/\.(md|json|txt)$/, '')

  // Convert plural to singular and return
  return parentWithoutExt.replace(/s$/, '') || 'unknown'
}

// ============================================================================
// FRONTMATTER GENERATION
// ============================================================================

/**
 * Generates complete iDumb frontmatter for a document
 * @param filePath - File path (for type detection)
 * @param content - Document content (for title extraction)
 * @param agentRole - Agent creating this document
 * @param sessionId - Optional session ID for parent tracking
 * @returns Complete frontmatter object
 */
/**
 * Maps document type to schema version
 * @param docType - Document type string
 * @returns Schema version string (e.g., "phase-v1", "base-v1")
 */
function mapTypeToSchema(docType: string): string {
  const schemaMap: Record<string, string> = {
    'phase': 'phase-v1',
    'task': 'task-v1',
    'research': 'research-v1',
    'decision': 'decision-v1',
    'validation': 'base-v1',
    'session': 'base-v1',
    'checkpoint': 'base-v1',
  }
  return schemaMap[docType] || 'base-v1'
}

export function generateIdumbFrontmatter(
  filePath: string,
  content: string,
  agentRole: string,
  sessionId?: string
): IdumbFrontmatter {
  // Handle empty content - use 'Untitled' instead of filename
  const hasContent = content && content.trim().length > 0
  const title = hasContent
    ? (extractTitle(content) || extractTitleFromPath(filePath))
    : 'Untitled'

  const docType = detectDocumentType(filePath) as IdumbFrontmatter['type']

  return {
    id: uuidv7(),
    title,
    type: docType,
    created: new Date().toISOString(),
    parent_id: sessionId,
    source_agent: agentRole,
    status: 'active',
    // Phase 7: Auto-detect schema type from document type
    schema_type: mapTypeToSchema(docType),
  }
}

/**
 * Extracts title from document content (first # heading)
 * @param content - Markdown content
 * @returns Extracted title or null if not found
 */
export function extractTitle(content: string): string | null {
  const match = content.match(/^#\s+(.+)$/m)
  return match ? match[1].trim() : null
}

/**
 * Generates title from file path when content has no heading
 * @param filePath - File path
 * @returns Generated title
 */
export function extractTitleFromPath(filePath: string): string {
  const parts = filePath.split('/')
  const filename = parts[parts.length - 1] || 'untitled'
  return filename
    .replace(/\.(md|json)$/, '')
    .replace(/-/g, ' ')
    .replace(/^./, c => c.toUpperCase())
}

// ============================================================================
// FRONTMATTER INJECTION
// ============================================================================

/**
 * Injects iDumb frontmatter into document content
 * @param filePath - File path
 * @param content - Original content
 * @param agentRole - Agent creating document
 * @param sessionId - Optional session ID
 * @returns Content with frontmatter injected, or original content if not markdown
 */
export function injectFrontmatter(
  filePath: string,
  content: string,
  agentRole: string,
  sessionId?: string
): string {
  // Only process markdown files
  if (!filePath.endsWith('.md')) {
    return content
  }

  // Parse existing content
  const parsed = matter(content)

  // Check if already has iDumb frontmatter
  const hasIdumbFrontmatter = parsed.data.id && parsed.data.type

  // Generate new frontmatter
  const frontmatter = generateIdumbFrontmatter(filePath, content, agentRole, sessionId)

  // Build merged data
  let mergedData: Record<string, any>

  if (hasIdumbFrontmatter) {
    // Updating existing iDumb frontmatter: preserve critical fields, update others
    mergedData = {
      ...frontmatter,
      id: parsed.data.id, // Preserve original ID
      type: parsed.data.type, // Preserve original type
      created: parsed.data.created instanceof Date
        ? parsed.data.created.toISOString()
        : parsed.data.created, // Preserve original created timestamp as ISO string
      updated: new Date().toISOString(),
      // Phase 7: Preserve relationship tracking fields
      child_ids: parsed.data.child_ids,
      references: parsed.data.references,
      decision_reason: parsed.data.decision_reason,
      failure_analysis: parsed.data.failure_analysis,
      requirement_ids: parsed.data.requirement_ids,
      validation_ids: parsed.data.validation_ids,
      // Merge custom fields (new custom takes precedence for conflicts)
      custom: {
        ...(parsed.data.custom || {}),
        ...(frontmatter.custom || {}),
      },
    }
  } else {
    // New document: merge non-iDumb fields with new iDumb frontmatter
    mergedData = {
      ...parsed.data, // Preserve existing non-iDumb fields
      ...frontmatter, // Add iDumb fields
      updated: new Date().toISOString(),
    }
  }

  // Remove undefined values (js-yaml can't serialize them)
  Object.keys(mergedData).forEach(key => {
    if (mergedData[key] === undefined) {
      delete mergedData[key]
    }
  })

  // Rebuild document with merged frontmatter
  const rebuilt = matter.stringify(parsed.content || content, mergedData)

  return rebuilt
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validates iDumb frontmatter structure
 * @param data - Frontmatter data object
 * @returns Validation result with errors array
 */
export function validateIdumbFrontmatter(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!data.id) errors.push('Missing required field: id')
  else if (!isValidUUIDv7(data.id)) errors.push('Invalid UUID v7 format for id')

  if (!data.title) errors.push('Missing required field: title')
  if (!data.type) errors.push('Missing required field: type')
  if (!data.created) errors.push('Missing required field: created')

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Checks if string is valid UUID v7 format
 * @param id - UUID string to validate
 * @returns true if valid UUID v7
 */
function isValidUUIDv7(id: string): boolean {
  // UUID v7 format: xxxxxxxx-xxxx-7xxx-yxxx-xxxxxxxxxxxx
  // where y is 8, 9, a, or b (variant)
  const uuidv7Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidv7Regex.test(id)
}
