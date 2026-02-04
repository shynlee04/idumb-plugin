# Frontmatter Metadata & ID Chain Systems - Comprehensive Research

**Research Date:** 2026-02-04
**Researcher:** @idumb-phase-researcher
**Scope:** YAML Frontmatter, ID Chain Systems, Document Lifecycle, Staleness Tracking, Validation
**Status:** Complete

---

## Executive Summary

This research provides comprehensive guidance for implementing a robust frontmatter metadata system in iDumb, covering:
- YAML frontmatter standards from industry leaders (Jekyll, Hugo, Docusaurus, GitBook, Obsidian)
- Unique ID generation strategies and parent-child relationship patterns
- Document lifecycle state management
- Staleness tracking mechanisms using ISO 8601 timestamps
- Frontmatter validation approaches with JSON schemas
- Best practices for traceability and governance

**Key Recommendations:**
1. Use gray-matter for frontmatter parsing with custom delimiter support
2. Implement UUID v7 (time-ordered) for document IDs
3. Adopt 4-state lifecycle model (draft, active, archived, deleted)
4. Track staleness with ISO 8601 timestamps and configurable thresholds
5. Validate frontmatter using remark-lint-frontmatter-schema with JSON schemas
6. Implement chain detection algorithms for parent-child relationships

---

## 1. YAML Frontmatter Standards

### 1.1 Standard Frontmatter Format

Industry-standard frontmatter format uses YAML delimiters:

```yaml
---
# YAML metadata here
title: "Document Title"
description: "Document description"
---

# Markdown content here
```

**Delimiter Variants:**
- Standard: `---` (three hyphens) - **Recommended for iDumb**
- Alternative: `~~~` (three tildes)
- Custom: Any string via gray-matter options

**Key Industry Standards:**

| System | Delimiter | Fields | Purpose |
|---------|-----------|---------|----------|
| Jekyll | `---` | layout, title, date, categories | Static site generation |
| Hugo | `---` | title, date, tags, categories, draft | Static site generation |
| Docusaurus | `---` | id, title, description, slug, sidebar_label, tags | Technical documentation |
| GitBook | `---` (auto-managed) | title, description, visibility, cover | Team documentation |
| Obsidian | `---` | title, tags, date, type, properties | Personal knowledge management |

### 1.2 Required vs Optional Fields

**iDumb Recommended Frontmatter Schema:**

```yaml
---
# ===== REQUIRED FIELDS =====
id: "uuid-v7-string"              # Unique identifier (UUID v7 recommended)
title: "Human readable title"       # Document title
type: "document-type"              # Document type (agent, command, research, etc.)
created: "2026-02-04T12:00:00Z" # ISO 8601 creation timestamp

# ===== HIGHLY RECOMMENDED =====
updated: "2026-02-04T12:00:00Z"  # ISO 8601 update timestamp
status: "draft|active|archived|deleted"  # Lifecycle status
parent_id: "uuid-v7-string"        # Parent document ID (if applicable)
author: "agent-or-human-name"       # Creator

# ===== OPTIONAL FIELDS =====
description: "Short description"      # SEO/search summary
tags: ["tag1", "tag2"]            # Categorization
priority: "low|medium|high|critical" # Importance
milestone: "phase-number"           # Associated milestone
version: "semantic-version"          # Document version
dependencies: ["id1", "id2"]      # Related documents
stale_after: "48h"                 # Staleness threshold
---
```

**Field Categories:**

| Category | Required | Fields | Purpose |
|----------|----------|---------|---------|
| Identification | ✅ | `id`, `title`, `type` | Unique identification |
| Timestamps | ✅ | `created`, `updated` | Lifecycle tracking |
| Status | ❌ | `status` | Lifecycle state |
| Relationships | ❌ | `parent_id`, `dependencies` | Chain tracking |
| Metadata | ❌ | `description`, `tags`, `priority` | Classification |
| Governance | ❌ | `author`, `version`, `milestone` | Traceability |

### 1.3 Common Field Types

**String Types:**
```yaml
title: "String value"           # Free-form text
id: "550e8400-e29b-41d4-a716-446655440000"  # UUID
description: "Multi-word description"
type: "agent|command|research|template"
```

**Date/Timestamp Types:**
```yaml
created: "2026-02-04T12:00:00Z"      # ISO 8601 with timezone
updated: "2026-02-04T12:00:00+00:00"  # ISO 8601 with offset
last_checked: "2026-02-04"           # Date only (YYYY-MM-DD)
```

**Array Types:**
```yaml
tags: ["tag1", "tag2", "tag3"]
dependencies: ["doc-id-1", "doc-id-2"]
authors: ["agent-name", "human-name"]
```

**Enum Types:**
```yaml
status: draft      # draft, active, archived, deleted
priority: critical  # low, medium, high, critical
type: agent       # agent, command, research, template, governance
```

**Boolean Types:**
```yaml
verified: true
archived: false
locked: true
```

**Number Types:**
```yaml
version: 1.0.0        # Semantic version
milestone: 3           # Phase number
threshold: 48           # Hours
```

---

## 2. ID Chain Systems

### 2.1 Unique ID Generation Strategies

**Recommended: UUID v7 (Time-Ordered)**

UUID v7 combines random uniqueness with time-based sorting, ideal for document IDs:

```typescript
import { randomUUID } from 'crypto'

// Node.js 16+ (built-in)
function generateUUIDv7(): string {
  // Generate time-based UUID for natural sorting
  const timestamp = Date.now()
  const randomBytes = new Uint8Array(10)
  crypto.getRandomValues(randomBytes)
  
  // Combine timestamp and random bytes (simplified v7)
  const timeHex = timestamp.toString(16).padStart(12, '0')
  const randomHex = Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
  
  return `${timeHex.substring(0, 12)}-${timeHex.substring(12, 16)}-${timeHex.substring(16, 20)}-${randomHex.substring(0, 4)}-${randomHex.substring(4)}`
}

// Or use uuid npm package (industry standard)
import { v7 as uuidv7 } from 'uuid'
const documentId = uuidv7()  // "018f4b7a-7d0f-7a0c-b530-0d7a0f7d0f7a"
```

**Alternative ID Strategies:**

| Strategy | Pros | Cons | Use Case |
|----------|-------|-------|----------|
| **UUID v7** (Recommended) | Time-ordered, unique, standard | 36 chars, not human-readable | General documents |
| **UUID v4** | Random, collision-proof | Not sorted, random | Isolated docs |
| **ULID** | Time-ordered, 26 chars | Less common | Compact IDs |
| **Nano ID** | Short (21 chars), URL-safe | Collision risk | User-facing IDs |
| **Custom Sequential** | Short, readable | Coordination required | Internal numbering |

**Nano ID Example (User-Facing):**
```typescript
import { nanoid } from 'nanoid'
const slugId = nanoid(12)  // "V1StGXR8_Z5jdj"
```

### 2.2 Parent-Child Relationship Patterns

**Hierarchical Model (Recommended for iDumb):**

```yaml
---
# Parent Document (Phase Plan)
id: "phase-3-plan-uuid-v7"
title: "Phase 3 Execution Plan"
type: phase-plan
parent_id: null          # Root document has no parent
created: "2026-02-04T12:00:00Z"
updated: "2026-02-04T12:00:00Z"
status: active
---

# Phase 3 Execution Plan

...

---

# Child Document (Task)
---
id: "task-3-1-uuid-v7"
title: "Task 3.1: Implement Core Features"
type: task
parent_id: "phase-3-plan-uuid-v7"  # Links to parent
created: "2026-02-04T13:00:00Z"
updated: "2026-02-04T13:00:00Z"
status: draft
---

## Task 3.1

...
```

**Multi-Parent Relationships:**
```yaml
---
id: "validation-report-uuid"
title: "Phase 3 Validation Report"
type: report
# Multiple parents (array)
parent_id:
  - "phase-3-plan-uuid"
  - "verification-doc-uuid"
# Or separate fields
phase_parent: "phase-3-plan-uuid"
report_parent: "verification-doc-uuid"
---
```

**Relationship Types:**

| Relationship | Pattern | Example | iDumb Use |
|-------------|----------|----------|-------------|
| **Hierarchy** | Single parent | Plan → Tasks | Phase plans to tasks |
| **Dependency** | bidirectional | Task A ↔ Task B | Task dependencies |
| **Reference** | One-way | Research → Implementation | Citing sources |
| **Component** | Part-of | Component → System | Code structure |
| **Versioning** | Previous → Next | v1.0 → v1.1 | Document history |

### 2.3 Chain Detection Algorithm

**Forward Chain Traversal (Parent to Children):**

```typescript
interface Document {
  id: string
  title: string
  parent_id: string | string[] | null
  children?: Document[]
}

function findChildren(documentId: string, allDocuments: Document[]): Document[] {
  return allDocuments.filter(doc => {
    const parentId = doc.parent_id
    if (Array.isArray(parentId)) {
      return parentId.includes(documentId)
    }
    return parentId === documentId
  })
}

function buildHierarchy(rootId: string, allDocuments: Document[]): Document[] {
  const root = allDocuments.find(doc => doc.id === rootId)
  if (!root) return []
  
  const children = findChildren(rootId, allDocuments)
  return children.map(child => ({
    ...child,
    children: buildHierarchy(child.id, allDocuments)
  }))
}

// Example usage
const hierarchy = buildHierarchy('phase-3-plan-uuid', allDocs)
console.log(JSON.stringify(hierarchy, null, 2))
```

**Backward Chain Traversal (Child to Parents):**

```typescript
function findParents(documentId: string, allDocuments: Document[]): Document[] {
  const doc = allDocuments.find(d => d.id === documentId)
  if (!doc || !doc.parent_id) return []
  
  const parentIds = Array.isArray(doc.parent_id) ? doc.parent_id : [doc.parent_id]
  return allDocuments.filter(d => parentIds.includes(d.id))
}

function traceChain(documentId: string, allDocuments: Document[]): Document[] {
  const chain: Document[] = []
  let currentId = documentId
  
  while (currentId) {
    const doc = allDocuments.find(d => d.id === currentId)
    if (!doc) break
    
    chain.unshift(doc)  // Add to front of chain
    currentId = Array.isArray(doc.parent_id) ? doc.parent_id[0] : doc.parent_id
  }
  
  return chain
}

// Example usage
const chain = traceChain('task-3-5-uuid', allDocs)
console.log('Chain:', chain.map(d => d.title).join(' → '))
// Output: "Phase 3 Plan → Task 3.1 → Task 3.5"
```

**Bidirectional Chain Traversal (Full Dependency Graph):**

```typescript
interface DependencyGraph {
  nodes: Map<string, Document>
  edges: Map<string, string[]>  // id → dependent IDs
  reverseEdges: Map<string, string[]>  // id → prerequisite IDs
}

function buildGraph(allDocuments: Document[]): DependencyGraph {
  const graph: DependencyGraph = {
    nodes: new Map(),
    edges: new Map(),
    reverseEdges: new Map()
  }
  
  // Build nodes
  allDocuments.forEach(doc => {
    graph.nodes.set(doc.id, doc)
    graph.edges.set(doc.id, [])
    graph.reverseEdges.set(doc.id, [])
  })
  
  // Build edges
  allDocuments.forEach(doc => {
    if (doc.dependencies) {
      doc.dependencies.forEach(depId => {
        graph.edges.get(depId)?.push(doc.id)
        graph.reverseEdges.get(doc.id)?.push(depId)
      })
    }
  })
  
  return graph
}

function findCycle(graph: DependencyGraph, startId: string): string[] | null {
  const visited = new Set<string>()
  const path: string[] = []
  
  function dfs(nodeId: string): boolean {
    if (path.includes(nodeId)) {
      const cycleStart = path.indexOf(nodeId)
      return path.slice(cycleStart)
    }
    if (visited.has(nodeId)) return false
    
    visited.add(nodeId)
    path.push(nodeId)
    
    const dependencies = graph.reverseEdges.get(nodeId) || []
    for (const depId of dependencies) {
      const cycle = dfs(depId)
      if (cycle) return cycle
    }
    
    path.pop()
    return false
  }
  
  return dfs(startId) || null
}
```

### 2.4 Broken Chain Detection

**Detection Algorithm:**

```typescript
interface ChainValidationResult {
  valid: boolean
  brokenChains: Array<{
    documentId: string
    missingParentId: string | string[]
  }>
  orphanedDocuments: Document[]
}

function validateChains(allDocuments: Document[]): ChainValidationResult {
  const idSet = new Set(allDocuments.map(d => d.id))
  const brokenChains: ChainValidationResult['brokenChains'] = []
  const orphanedDocuments: Document[] = []
  
  // Check for broken parent references
  allDocuments.forEach(doc => {
    if (doc.parent_id) {
      const parentIds = Array.isArray(doc.parent_id) ? doc.parent_id : [doc.parent_id]
      
      parentIds.forEach(parentId => {
        if (!idSet.has(parentId)) {
          brokenChains.push({
            documentId: doc.id,
            missingParentId: parentId
          })
        }
      })
    }
  })
  
  // Check for orphans (documents with no parent that should have one)
  allDocuments.forEach(doc => {
    const shouldHaveParent = ['task', 'deliverable', 'report'].includes(doc.type)
    if (shouldHaveParent && !doc.parent_id) {
      orphanedDocuments.push(doc)
    }
  })
  
  return {
    valid: brokenChains.length === 0 && orphanedDocuments.length === 0,
    brokenChains,
    orphanedDocuments
  }
}

// Example usage
const validation = validateChains(allDocs)
if (!validation.valid) {
  console.error('Broken chains found:', validation.brokenChains)
  console.error('Orphaned documents:', validation.orphanedDocuments.map(d => d.title))
}
```

**Automated Chain Healing:**

```typescript
async function healBrokenChains(
  brokenChains: ChainValidationResult['brokenChains'],
  allDocuments: Document[]
): Promise<void> {
  for (const broken of brokenChains) {
    const doc = allDocuments.find(d => d.id === broken.documentId)
    if (!doc) continue
    
    // Strategy 1: Find potential matches by title similarity
    const potentialParents = allDocuments.filter(d => 
      d.title.toLowerCase().includes(doc.title.split(':')[0].toLowerCase())
    )
    
    if (potentialParents.length === 1) {
      console.log(`Auto-healing: Linking ${doc.id} to ${potentialParents[0].id}`)
      doc.parent_id = potentialParents[0].id
      // Update document...
    } else {
      // Strategy 2: Mark for manual review
      doc.status = 'draft'
      doc.description = `[CHAIN-BROKEN] Missing parent: ${broken.missingParentId}`
      // Flag for human review
    }
  }
}
```

### 2.5 Orphaned Document Detection

**Orphan Categories:**

```typescript
interface OrphanType {
  type: 'no-parent' | 'unreferenced' | 'orphaned-branch'
  count: number
  documents: Document[]
}

function detectOrphans(allDocuments: Document[]): OrphanType[] {
  const referencedIds = new Set<string>()
  
  // Build reference map
  allDocuments.forEach(doc => {
    if (doc.dependencies) {
      doc.dependencies.forEach(depId => referencedIds.add(depId))
    }
    if (doc.parent_id) {
      const parentIds = Array.isArray(doc.parent_id) ? doc.parent_id : [doc.parent_id]
      parentIds.forEach(id => referencedIds.add(id))
    }
  })
  
  const orphans: OrphanType[] = []
  
  // Type 1: Documents with no parent that should have one
  const noParent = allDocuments.filter(doc => 
    ['task', 'deliverable', 'report'].includes(doc.type) && !doc.parent_id
  )
  if (noParent.length > 0) {
    orphans.push({
      type: 'no-parent',
      count: noParent.length,
      documents: noParent
    })
  }
  
  // Type 2: Documents never referenced
  const unreferenced = allDocuments.filter(doc => 
    !referencedIds.has(doc.id) && !['root', 'project'].includes(doc.type)
  )
  if (unreferenced.length > 0) {
    orphans.push({
      type: 'unreferenced',
      count: unreferenced.length,
      documents: unreferenced
    })
  }
  
  // Type 3: Orphaned branches (subtrees with no connection to main)
  const orphanedBranches = findOrphanedBranches(allDocuments)
  if (orphanedBranches.length > 0) {
    orphans.push({
      type: 'orphaned-branch',
      count: orphanedBranches.length,
      documents: orphanedBranches
    })
  }
  
  return orphans
}

function findOrphanedBranches(allDocuments: Document[]): Document[] {
  const roots = allDocuments.filter(doc => !doc.parent_id && doc.type !== 'root')
  
  // Check if root has any connection to main project
  const connected = new Set<string>()
  const projectRoot = allDocuments.find(doc => doc.type === 'root')
  
  if (projectRoot) {
    const visited = new Set<string>()
    const stack = [projectRoot.id]
    
    while (stack.length > 0) {
      const currentId = stack.pop()!
      if (visited.has(currentId)) continue
      visited.add(currentId)
      connected.add(currentId)
      
      const children = findChildren(currentId, allDocuments)
      children.forEach(child => stack.push(child.id))
    }
  }
  
  // Roots not in connected set are orphaned
  return roots.filter(root => !connected.has(root.id))
}
```

---

## 3. Document Lifecycle States

### 3.1 State Model (4-State)

**Recommended iDumb State Machine:**

```
┌─────────────────────────────────────────────────────────────────┐
│                     DRAFT                                   │
│  - Initial state                                        │
│  - Work in progress                                     │
│  - Not validated                                        │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     │ validate/complete
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│                     ACTIVE                                 │
│  - Validated and approved                               │
│  - Production-ready                                      │
│  - Can be referenced                                    │
└────────────┬────────────────────────────────┬────────────────┘
             │ archive                      │ delete
             ↓                              ↓
┌──────────────────────┐      ┌──────────────────────┐
│     ARCHIVED       │      │      DELETED       │
│  - Historical       │      │  - Marked for      │
│  - Read-only        │      │    removal          │
│  - Preserved        │      │  - Hidden from     │
└──────────────────────┘      │    search           │
                            └──────────────────────┘
```

**State Definitions:**

| State | Description | Transitions | Use Cases |
|-------|-------------|--------------|------------|
| **draft** | Initial creation, work in progress | draft → active, draft → deleted | New tasks, plans in development |
| **active** | Validated, production-ready | active → archived, active → draft (revision), active → deleted | Completed plans, approved documentation |
| **archived** | Historical, read-only | archived → active (restore), archived → deleted | Old phases, completed projects |
| **deleted** | Marked for removal | deleted → active (restore) | Removed documents, discarded work |

### 3.2 State Transition Rules

**Valid Transitions:**

```typescript
type DocumentStatus = 'draft' | 'active' | 'archived' | 'deleted'

interface TransitionRule {
  from: DocumentStatus
  to: DocumentStatus
  condition: (doc: Document) => boolean
  autoTransition?: boolean
}

const transitionRules: TransitionRule[] = [
  {
    from: 'draft',
    to: 'active',
    condition: (doc) => doc.verified === true && doc.validation_passed === true,
    autoTransition: false  // Requires manual approval
  },
  {
    from: 'active',
    to: 'archived',
    condition: (doc) => {
      const ageDays = (Date.now() - new Date(doc.updated).getTime()) / (1000 * 60 * 60 * 24)
      return ageDays > 30 && doc.status === 'active'
    },
    autoTransition: true  // Auto-archive after 30 days
  },
  {
    from: 'active',
    to: 'draft',
    condition: (doc) => doc.needs_revision === true,
    autoTransition: false  // Requires manual approval
  },
  {
    from: 'archived',
    to: 'active',
    condition: (doc) => doc.restored === true,
    autoTransition: false  // Requires manual approval
  },
  {
    from: 'draft',
    to: 'deleted',
    condition: (doc) => doc.discarded === true,
    autoTransition: true  // Allow immediate deletion of drafts
  },
  {
    from: 'active',
    to: 'deleted',
    condition: (doc) => doc.obsolete === true && !hasDependencies(doc),
    autoTransition: false  // Requires approval if has dependencies
  },
  {
    from: 'archived',
    to: 'deleted',
    condition: (doc) => {
      const ageDays = (Date.now() - new Date(doc.updated).getTime()) / (1000 * 60 * 60 * 24)
      return ageDays > 365 && !hasDependencies(doc)
    },
    autoTransition: true  // Auto-delete after 1 year
  }
]

function canTransition(
  doc: Document,
  newStatus: DocumentStatus
): { allowed: boolean; reason?: string } {
  const rule = transitionRules.find(r => r.from === doc.status && r.to === newStatus)
  
  if (!rule) {
    return { allowed: false, reason: `No transition rule from ${doc.status} to ${newStatus}` }
  }
  
  if (!rule.condition(doc)) {
    return { allowed: false, reason: `Transition condition not met` }
  }
  
  return { allowed: true }
}

function transition(doc: Document, newStatus: DocumentStatus): Document {
  const validation = canTransition(doc, newStatus)
  if (!validation.allowed) {
    throw new Error(validation.reason)
  }
  
  return {
    ...doc,
    status: newStatus,
    updated: new Date().toISOString()
  }
}

function hasDependencies(doc: Document): boolean {
  return !!(doc.dependencies && doc.dependencies.length > 0)
}
```

### 3.3 Automated State Changes

**Staleness-Based Auto-Archive:**

```typescript
function checkStaleness(
  doc: Document,
  staleThreshold: number = 30  // days
): { stale: boolean; action?: 'archive' | 'delete' } {
  const lastUpdated = new Date(doc.updated)
  const ageDays = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24)
  
  if (ageDays > staleThreshold) {
    if (doc.status === 'active') {
      return { stale: true, action: 'archive' }
    }
    
    if (doc.status === 'archived' && ageDays > 365) {
      return { stale: true, action: 'delete' }
    }
  }
  
  return { stale: false }
}

async function processStaleDocuments(
  allDocuments: Document[]
): Promise<Document[]> {
  const updatedDocuments: Document[] = []
  
  for (const doc of allDocuments) {
    const staleness = checkStaleness(doc, doc.stale_after || 30)
    
    if (staleness.stale && staleness.action) {
      console.log(`Processing stale document: ${doc.title} (${staleness.action})`)
      
      const newStatus = staleness.action === 'archive' ? 'archived' : 'deleted'
      const updated = transition(doc, newStatus)
      
      // Add transition note
      updated.description = `${updated.description || ''}\n\n[AUTO-ARCHIVED] Stale after ${staleness.days} days`
      
      updatedDocuments.push(updated)
    }
  }
  
  return updatedDocuments
}
```

**Completion-Based State Changes:**

```typescript
interface PhaseCompletionRule {
  status: DocumentStatus
  completionCriteria: (doc: Document) => boolean
  onSuccess: (doc: Document) => DocumentStatus
}

function processCompletion(doc: Document): Document {
  const criteria = {
    draft: {
      completionCriteria: (d) => d.validation_passed === true && d.approved === true,
      onSuccess: () => 'active'
    },
    active: {
      completionCriteria: (d) => d.completed === true && d.verified === true,
      onSuccess: () => 'archived'
    }
  }
  
  const rule = criteria[doc.status as keyof typeof criteria]
  if (!rule) return doc
  
  if (rule.completionCriteria(doc)) {
    return {
      ...doc,
      status: rule.onSuccess(doc),
      updated: new Date().toISOString()
    }
  }
  
  return doc
}
```

### 3.4 Manual Override Mechanisms

**Override Flags:**

```yaml
---
id: "task-uuid"
title: "Task Title"
status: draft

# Override flags
override_staleness: false      # Skip auto-archive
override_validation: false     # Skip validation checks
override_dependencies: false    # Ignore missing dependencies
force_status: "active"       # Force to specific status (with reason)
override_reason: "Emergency production fix required"
---
```

**Override Implementation:**

```typescript
function applyOverride(doc: Document): Document {
  if (doc.force_status) {
    const overrideValidation = canTransition(doc, doc.force_status)
    
    if (!overrideValidation.allowed && !doc.override_reason) {
      throw new Error('force_status requires override_reason')
    }
    
    return {
      ...doc,
      status: doc.force_status,
      updated: new Date().toISOString(),
      description: `${doc.description || ''}\n\n[STATUS-OVERRIDE] ${doc.override_reason}`
    }
  }
  
  return doc
}

// Audit trail for overrides
interface OverrideAudit {
  documentId: string
  originalStatus: DocumentStatus
  newStatus: DocumentStatus
  reason: string
  timestamp: string
  author: string
}

function logOverride(doc: Document, audit: OverrideAudit[]): void {
  if (doc.force_status) {
    audit.push({
      documentId: doc.id,
      originalStatus: doc.status,
      newStatus: doc.force_status,
      reason: doc.override_reason || 'No reason provided',
      timestamp: new Date().toISOString(),
      author: doc.last_author || 'system'
    })
  }
}
```

---

## 4. Staleness Tracking

### 4.1 Timestamp Formats (ISO 8601)

**ISO 8601 Compliance:**

```yaml
# Complete timestamp with timezone (recommended)
created: "2026-02-04T12:34:56.789Z"           # UTC with milliseconds
updated: "2026-02-04T12:34:56.789+00:00"      # UTC with offset

# Date only (for thresholds)
stale_after_date: "2026-03-04"                    # YYYY-MM-DD

# Time only (rare use case)
scheduled_time: "12:34:56Z"                     # HH:MM:SS

# Duration (for thresholds)
stale_after: "P30D"                                # Period notation (30 days)
review_interval: "PT48H"                           # Period notation (48 hours)
```

**ISO 8601 Parsing:**

```typescript
function parseISO8601(timestamp: string): Date {
  // Native JavaScript Date.parse handles ISO 8601
  const date = new Date(timestamp)
  
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid ISO 8601 timestamp: ${timestamp}`)
  }
  
  return date
}

function formatISO8601(date: Date): string {
  return date.toISOString()  // Returns ISO 8601 format
}

// Period notation parsing (P30D, PT48H)
function parsePeriod(period: string): number {  // returns milliseconds
  const match = period.match(/P(\d+D)?(T(\d+H)?)?(\d+M)?/)
  if (!match) throw new Error(`Invalid period: ${period}`)
  
  let ms = 0
  if (match[1]) ms += parseInt(match[1]) * 24 * 60 * 60 * 1000  // Days
  if (match[2]) ms += parseInt(match[2]) * 60 * 60 * 1000   // Hours
  if (match[3]) ms += parseInt(match[3]) * 60 * 1000          // Minutes
  
  return ms
}
```

### 4.2 Created vs Updated Timestamps

**Timestamp Tracking Strategy:**

```yaml
---
id: "doc-uuid"
title: "Document Title"

# Creation timestamp (immutable after creation)
created: "2026-02-01T10:00:00Z"

# Last update timestamp (mutable)
updated: "2026-02-04T14:30:00Z"

# Optional: Last access/read timestamp
last_accessed: "2026-02-04T14:30:00Z"

# Optional: Published timestamp
published: "2026-02-03T09:00:00Z"

# Optional: Last validated timestamp
last_validated: "2026-02-04T12:00:00Z"
---
```

**Timestamp Update Logic:**

```typescript
function updateDocument(
  doc: Document,
  updates: Partial<Document>
): Document {
  return {
    ...doc,
    ...updates,
    updated: new Date().toISOString()  // Always update 'updated'
  }
}

function accessDocument(doc: Document): Document {
  return {
    ...doc,
    last_accessed: new Date().toISOString()
  }
}

function publishDocument(doc: Document): Document {
  return {
    ...doc,
    published: new Date().toISOString(),
    updated: new Date().toISOString(),
    status: 'active'
  }
}
```

### 4.3 Stale-After Thresholds

**Threshold Specification:**

```yaml
# Hours
stale_after: "48h"          # Stale after 48 hours
stale_after: 48               # Same as 48h (number = hours)

# Days
stale_after: "30d"          # Stale after 30 days
stale_after: 30               # Same as 30d (number = days)

# ISO 8601 period notation
stale_after: "P30D"         # Stale after 30 days
stale_after: "PT48H"        # Stale after 48 hours

# Absolute date
stale_date: "2026-03-01"    # Stale after this date
```

**Threshold Parsing:**

```typescript
function parseStaleThreshold(threshold: string | number): number {  // milliseconds
  if (typeof threshold === 'number') {
    // Default: number = days
    return threshold * 24 * 60 * 60 * 1000
  }
  
  if (threshold.endsWith('h') || threshold.endsWith('H')) {
    return parseInt(threshold) * 60 * 60 * 1000
  }
  
  if (threshold.endsWith('d') || threshold.endsWith('D')) {
    return parseInt(threshold) * 24 * 60 * 60 * 1000
  }
  
  if (threshold.startsWith('P') || threshold.startsWith('PT')) {
    return parsePeriod(threshold)
  }
  
  // Default: 30 days
  return 30 * 24 * 60 * 60 * 1000
}

function isStale(doc: Document, now: Date = new Date()): boolean {
  if (!doc.stale_after && !doc.stale_date) {
    // Default threshold: 30 days
    const threshold = 30 * 24 * 60 * 60 * 1000
    const age = now.getTime() - new Date(doc.updated).getTime()
    return age > threshold
  }
  
  if (doc.stale_date) {
    return now.getTime() > new Date(doc.stale_date).getTime()
  }
  
  const thresholdMs = parseStaleThreshold(doc.stale_after!)
  const age = now.getTime() - new Date(doc.updated).getTime()
  return age > thresholdMs
}

function stalenessPercentage(doc: Document): number {
  const threshold = parseStaleThreshold(doc.stale_after || 30)
  const age = Date.now() - new Date(doc.updated).getTime()
  return Math.min(100, (age / threshold) * 100)
}
```

### 4.4 Automatic Staleness Detection

**Batch Detection:**

```typescript
interface StaleDocument {
  document: Document
  ageDays: number
  stalePercentage: number
  suggestedAction: 'archive' | 'delete' | 'review' | 'none'
}

function detectStaleDocuments(
  allDocuments: Document[]
): StaleDocument[] {
  const now = new Date()
  const staleDocs: StaleDocument[] = []
  
  allDocuments.forEach(doc => {
    if (doc.status === 'deleted') return
    if (doc.override_staleness) return
    
    const ageMs = now.getTime() - new Date(doc.updated).getTime()
    const ageDays = ageMs / (1000 * 60 * 60 * 24)
    
    // Check custom threshold
    const thresholdMs = parseStaleThreshold(doc.stale_after || 30)
    const stalePercentage = (ageMs / thresholdMs) * 100
    
    if (ageMs > thresholdMs) {
      let action: StaleDocument['suggestedAction'] = 'none'
      
      if (doc.status === 'draft') {
        action = 'delete'
      } else if (doc.status === 'active' && ageDays > 30) {
        action = 'archive'
      } else if (doc.status === 'archived' && ageDays > 365) {
        action = 'delete'
      } else if (stalePercentage > 200) {
        action = 'review'
      }
      
      staleDocs.push({
        document: doc,
        ageDays,
        stalePercentage,
        suggestedAction: action
      })
    }
  })
  
  // Sort by stalest first
  return staleDocs.sort((a, b) => b.stalePercentage - a.stalePercentage)
}
```

**Notification System:**

```typescript
interface StalenessAlert {
  documentId: string
  title: string
  ageDays: number
  suggestedAction: string
  severity: 'info' | 'warning' | 'critical'
}

function generateStalenessAlerts(
  staleDocs: StaleDocument[]
): StalenessAlert[] {
  return staleDocs.map(stale => {
    let severity: StalenessAlert['severity'] = 'info'
    
    if (stale.suggestedAction === 'delete') {
      severity = 'critical'
    } else if (stale.suggestedAction === 'archive') {
      severity = 'warning'
    }
    
    return {
      documentId: stale.document.id,
      title: stale.document.title,
      ageDays: stale.ageDays,
      suggestedAction: stale.suggestedAction,
      severity
    }
  })
}

async function notifyStaleDocuments(
  allDocuments: Document[]
): Promise<void> {
  const staleDocs = detectStaleDocuments(allDocuments)
  const alerts = generateStalenessAlerts(staleDocs)
  
  if (alerts.length === 0) {
    console.log('No stale documents detected')
    return
  }
  
  console.log(`Found ${alerts.length} stale documents:`)
  
  alerts.forEach(alert => {
    const emoji = alert.severity === 'critical' ? '🚨' : 
                  alert.severity === 'warning' ? '⚠️' : 'ℹ️'
    
    console.log(`${emoji} ${alert.title} (${alert.ageDays.toFixed(1)} days old)`)
    console.log(`   Action: ${alert.suggestedAction}`)
  })
  
  // Write to governance state
  await logStalenessAlerts(alerts)
}
```

### 4.5 Stale Document Handling

**Automated Actions:**

```typescript
async function handleStaleDocuments(
  allDocuments: Document[],
  options: {
    autoArchive?: boolean
    autoDelete?: boolean
    dryRun?: boolean
  } = {}
): Promise<{ archived: number; deleted: number; reviewed: number }> {
  const staleDocs = detectStaleDocuments(allDocuments)
  
  let archived = 0
  let deleted = 0
  let reviewed = 0
  
  for (const stale of staleDocs) {
    if (options.dryRun) {
      console.log(`[DRY RUN] ${stale.suggestedAction}: ${stale.document.title}`)
      continue
    }
    
    switch (stale.suggestedAction) {
      case 'archive':
        if (options.autoArchive) {
          await updateDocument(stale.document.id, { status: 'archived' })
          archived++
        }
        break
        
      case 'delete':
        if (options.autoDelete) {
          await deleteDocument(stale.document.id)
          deleted++
        }
        break
        
      case 'review':
        // Mark for manual review
        await updateDocument(stale.document.id, {
          needs_review: true,
          review_reason: `Stale (${stale.ageDays.toFixed(1)} days)`
        })
        reviewed++
        break
        
      case 'none':
        // No action needed
        break
    }
  }
  
  return { archived, deleted, reviewed }
}
```

**Manual Review Workflow:**

```typescript
interface StaleReview {
  documentId: string
  title: string
  ageDays: number
  actions: Array<{
    type: 'keep' | 'archive' | 'delete' | 'update'
    reason?: string
  }>
}

function createStaleReview(
  staleDocs: StaleDocument[]
): StaleReview[] {
  return staleDocs.map(stale => ({
    documentId: stale.document.id,
    title: stale.document.title,
    ageDays: stale.ageDays,
    actions: [
      { type: 'keep', reason: 'Document still relevant' },
      { type: 'update', reason: 'Update document to refresh' },
      stale.suggestedAction === 'archive' ? 
        { type: 'archive', reason: 'Archive for historical reference' } :
      stale.suggestedAction === 'delete' ? 
        { type: 'delete', reason: 'Remove outdated content' } :
        { type: 'review', reason: 'Manual review required' }
    ]
  }))
}

async function processReview(review: StaleReview, action: string): Promise<void> {
  switch (action) {
    case 'keep':
      // Update to reset staleness
      await updateDocument(review.documentId, {
        updated: new Date().toISOString()
      })
      break
      
    case 'archive':
      await updateDocument(review.documentId, { status: 'archived' })
      break
      
    case 'delete':
      await deleteDocument(review.documentId)
      break
      
    case 'update':
      await updateDocument(review.documentId, {
        updated: new Date().toISOString(),
        needs_review: false
      })
      break
  }
}
```

---

## 5. Frontmatter Validation

### 5.1 Validation Libraries

**Recommended Libraries:**

| Library | Purpose | Pros | Cons |
|---------|---------|-------|-------|
| **remark-lint-frontmatter-schema** | JSON Schema validation | Type-safe, auto-fixes | Requires remark ecosystem |
| **gray-matter** | Parsing | Fast, reliable, custom delimiters | No built-in validation |
| **yaml-fm-lint** | Linting standalone | CLI tool | Node.js only |
| **front-matter-schema** | GitHub Action | CI/CD integration | Limited to GitHub |

**Installation:**

```bash
# Core parsing
npm install gray-matter

# Validation with remark
npm install remark remark-lint remark-lint-frontmatter-schema

# Alternative: standalone linting
npm install yaml-fm-lint
```

### 5.2 JSON Schema Definition

**iDumb Frontmatter Schema:**

```typescript
// .idumb/schemas/frontmatter-schema.json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://idumb.dev/schemas/frontmatter",
  "title": "iDumb Frontmatter Schema",
  "description": "Schema for validating iDumb document frontmatter",
  "type": "object",
  "required": ["id", "title", "type", "created"],
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid",
      "description": "Unique document identifier (UUID v7 recommended)",
      "pattern": "^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"
    },
    "title": {
      "type": "string",
      "minLength": 1,
      "maxLength": 200,
      "description": "Document title"
    },
    "type": {
      "type": "string",
      "enum": [
        "agent",
        "command",
        "research",
        "template",
        "governance",
        "phase-plan",
        "task",
        "deliverable",
        "report",
        "project",
        "root"
      ],
      "description": "Document type"
    },
    "created": {
      "type": "string",
      "format": "date-time",
      "pattern": "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z$",
      "description": "ISO 8601 creation timestamp"
    },
    "updated": {
      "type": "string",
      "format": "date-time",
      "pattern": "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z$",
      "description": "ISO 8601 update timestamp"
    },
    "status": {
      "type": "string",
      "enum": ["draft", "active", "archived", "deleted"],
      "description": "Document lifecycle status"
    },
    "parent_id": {
      "oneOf": [
        { "type": "string", "format": "uuid" },
        { "type": "array", "items": { "type": "string", "format": "uuid" } },
        { "type": "null" }
      ],
      "description": "Parent document ID(s)"
    },
    "dependencies": {
      "type": "array",
      "items": { "type": "string", "format": "uuid" },
      "uniqueItems": true,
      "description": "Related document IDs"
    },
    "tags": {
      "type": "array",
      "items": {
        "type": "string",
        "pattern": "^[a-z0-9-]+$"
      },
      "uniqueItems": true,
      "description": "Document tags (lowercase, alphanumeric, hyphens)"
    },
    "priority": {
      "type": "string",
      "enum": ["low", "medium", "high", "critical"],
      "description": "Document priority"
    },
    "author": {
      "type": "string",
      "description": "Document author"
    },
    "description": {
      "type": "string",
      "maxLength": 500,
      "description": "Document description"
    },
    "version": {
      "type": "string",
      "pattern": "^\\d+\\.\\d+\\.\\d+$",
      "description": "Semantic version (e.g., 1.0.0)"
    },
    "milestone": {
      "type": "string",
      "pattern": "^\\d+$",
      "description": "Associated milestone/phase number"
    },
    "stale_after": {
      "oneOf": [
        { "type": "string", "pattern": "^\\d+[hdHD]?$" },
        { "type": "string", "pattern": "^P\\d+[D]?$" },
        { "type": "string", "pattern": "^PT\\d+[H]?$" },
        { "type": "number" }
      ],
      "description": "Staleness threshold"
    },
    "stale_date": {
      "type": "string",
      "format": "date",
      "pattern": "^\\d{4}-\\d{2}-\\d{2}$",
      "description": "Absolute staleness date"
    },
    "override_staleness": {
      "type": "boolean",
      "description": "Skip automatic staleness handling"
    },
    "override_reason": {
      "type": "string",
      "description": "Reason for status override"
    },
    "force_status": {
      "type": "string",
      "enum": ["draft", "active", "archived", "deleted"],
      "description": "Force document to specific status"
    },
    "verified": {
      "type": "boolean",
      "description": "Document has been verified"
    },
    "validation_passed": {
      "type": "boolean",
      "description": "Document passed validation"
    }
  },
  "additionalProperties": false,
  "anyOf": [
    { "required": ["id", "title", "type", "created"] }
  ]
}
```

### 5.3 Required vs Optional Fields

**Validation Rules:**

```typescript
interface ValidationRule {
  field: string
  required: boolean
  condition?: (value: any) => boolean
  errorMessage: string
}

const validationRules: ValidationRule[] = [
  {
    field: 'id',
    required: true,
    condition: (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value),
    errorMessage: 'id must be a valid UUID v7 format'
  },
  {
    field: 'title',
    required: true,
    condition: (value) => value && value.length > 0 && value.length <= 200,
    errorMessage: 'title must be between 1 and 200 characters'
  },
  {
    field: 'type',
    required: true,
    condition: (value) => ['agent', 'command', 'research', 'template', 'governance', 'phase-plan', 'task', 'deliverable', 'report', 'project', 'root'].includes(value),
    errorMessage: 'type must be one of: agent, command, research, template, governance, phase-plan, task, deliverable, report, project, root'
  },
  {
    field: 'created',
    required: true,
    condition: (value) => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value),
    errorMessage: 'created must be ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)'
  },
  {
    field: 'updated',
    required: false,
    condition: (value) => !value || /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value),
    errorMessage: 'updated must be ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ) if provided'
  },
  {
    field: 'status',
    required: false,
    condition: (value) => !value || ['draft', 'active', 'archived', 'deleted'].includes(value),
    errorMessage: 'status must be one of: draft, active, archived, deleted'
  },
  {
    field: 'parent_id',
    required: false,
    condition: (value) => {
      if (!value) return true
      if (Array.isArray(value)) {
        return value.every(id => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(id))
      }
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(value)
    },
    errorMessage: 'parent_id must be a valid UUID or array of UUIDs'
  },
  {
    field: 'tags',
    required: false,
    condition: (value) => {
      if (!value) return true
      return Array.isArray(value) && value.every(tag => /^[a-z0-9-]+$/.test(tag))
    },
    errorMessage: 'tags must be array of lowercase alphanumeric tags with hyphens'
  }
]

function validateFrontmatter(
  frontmatter: any
): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  validationRules.forEach(rule => {
    const value = frontmatter[rule.field]
    
    if (rule.required && (value === undefined || value === null)) {
      errors.push(`${rule.field} is required`)
      return
    }
    
    if (rule.condition && value !== undefined && value !== null && !rule.condition(value)) {
      errors.push(`${rule.field}: ${rule.errorMessage}`)
    }
  })
  
  return {
    valid: errors.length === 0,
    errors
  }
}
```

### 5.4 Type Validation

**Custom Type Validators:**

```typescript
interface TypeValidator {
  name: string
  validate: (value: any) => boolean
  format?: (value: any) => any
}

const typeValidators: Record<string, TypeValidator> = {
  uuid: {
    name: 'UUID',
    validate: (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(value),
    format: (value) => String(value).toLowerCase()
  },
  
  'iso8601-date-time': {
    name: 'ISO 8601 DateTime',
    validate: (value) => {
      const date = new Date(value)
      return !isNaN(date.getTime())
    },
    format: (value) => new Date(value).toISOString()
  },
  
  'iso8601-date': {
    name: 'ISO 8601 Date',
    validate: (value) => /^\d{4}-\d{2}-\d{2}$/.test(value),
    format: (value) => value
  },
  
  'semver': {
    name: 'Semantic Version',
    validate: (value) => /^\d+\.\d+\.\d+$/.test(value),
    format: (value) => value
  },
  
  'lowercase-kebab': {
    name: 'Lowercase Kebab Case',
    validate: (value) => /^[a-z0-9-]+$/.test(value),
    format: (value) => value.toLowerCase().replace(/_/g, '-')
  },
  
  'priority': {
    name: 'Priority',
    validate: (value) => ['low', 'medium', 'high', 'critical'].includes(value),
    format: (value) => value.toLowerCase()
  }
}

function validateType(
  fieldName: string,
  value: any,
  expectedType: string
): { valid: boolean; formatted?: any; error?: string } {
  const validator = typeValidators[expectedType]
  
  if (!validator) {
    return { valid: false, error: `Unknown type validator: ${expectedType}` }
  }
  
  if (!validator.validate(value)) {
    return { valid: false, error: `${fieldName} must be valid ${validator.name}` }
  }
  
  return {
    valid: true,
    formatted: validator.format ? validator.format(value) : value
  }
}
```

### 5.5 Enum Validation

**Enum Definition:**

```typescript
const enums = {
  status: ['draft', 'active', 'archived', 'deleted'] as const,
  type: ['agent', 'command', 'research', 'template', 'governance', 'phase-plan', 'task', 'deliverable', 'report', 'project', 'root'] as const,
  priority: ['low', 'medium', 'high', 'critical'] as const
}

type EnumValue<T extends readonly any[]> = T[number]

function validateEnum<T extends readonly any[]>(
  fieldName: string,
  value: any,
  enumValues: T
): { valid: boolean; value?: EnumValue<T>; error?: string } {
  if (!value) {
    return { valid: true }
  }
  
  const enumArray = enumValues as any[]
  if (enumArray.includes(value)) {
    return { valid: true, value: value as EnumValue<T> }
  }
  
  return {
    valid: false,
    error: `${fieldName} must be one of: ${enumArray.join(', ')}`
  }
}

// Usage
const statusResult = validateEnum('status', 'draft', enums.status)
console.log(statusResult)  // { valid: true, value: 'draft' }

const invalidResult = validateEnum('status', 'pending', enums.status)
console.log(invalidResult)  // { valid: false, error: 'status must be one of: draft, active, archived, deleted' }
```

### 5.6 Integration with remark-lint

**Remark Plugin Configuration:**

```typescript
import remark from 'remark'
import remarkLint from 'remark-lint'
import remarkLintFrontmatterSchema from 'remark-lint-frontmatter-schema'
import frontmatterSchema from './.idumb/schemas/frontmatter-schema.json'
import matter from 'gray-matter'

const processor = remark()
  .use(remarkLint, {
    plugins: {
      'lint-frontmatter-schema': [
        'error',
        {
          schema: frontmatterSchema,
          frontmatterOptions: {
            delims: '---'
          }
        }
      ]
    }
  })

async function validateDocument(filePath: string): Promise<any> {
  const content = await fs.promises.readFile(filePath, 'utf-8')
  
  try {
    const result = await processor.process(content)
    return { valid: true, document: result }
  } catch (error) {
    return {
      valid: false,
      errors: error.messages || [],
      rawError: error
    }
  }
}

// Batch validation
async function validateAllDocuments(directory: string): Promise<{
  valid: string[]
  invalid: Array<{ filePath: string; errors: any[] }>
}> {
  const files = await glob(`${directory}/**/*.md`)
  const valid: string[] = []
  const invalid: any[] = []
  
  for (const filePath of files) {
    const validation = await validateDocument(filePath)
    
    if (validation.valid) {
      valid.push(filePath)
    } else {
      invalid.push({
        filePath,
        errors: validation.errors
      })
    }
  }
  
  return { valid, invalid }
}
```

---

## 6. Best Practices from Documentation Systems

### 6.1 Docusaurus (Meta/Facebook)

**Key Patterns:**

1. **Structured Frontmatter:**
```yaml
---
id: doc-id                      # URL slug
title: "Page Title"              # Display title
description: "SEO description"   # Meta description
slug: "/custom/path"             # Override URL
sidebar_label: "Custom Label"     # Sidebar navigation
sidebar_position: 2               # Order in sidebar
tags: ['tag1', 'tag2']          # Categorization
keywords: ['seo', 'keywords']     # SEO keywords
image: /img/og-image.png         # OpenGraph image
---
```

2. **Type-Specific Fields:**
```yaml
---
# For blog posts
title: "Blog Title"
author: "Author Name"
date: 2026-02-04T10:00:00Z
tags: ['tutorial', 'guide']

# For docs
id: getting-started
title: "Getting Started"
custom_edit_url: "https://github.com/..."
---
```

**iDumb Adoption:**
- Use `id` for document identifiers (not URL slugs)
- Maintain `title`, `description`, `tags` for consistency
- Add `created` and `updated` timestamps

### 6.2 GitBook (SaaS Platform)

**Key Patterns:**

1. **Auto-Managed Metadata:**
```yaml
---
title: "Document Title"
description: "Short description"
cover: /images/cover.png
visibility: public
---
```

2. **Collaboration Features:**
- Visual editor for frontmatter
- Git sync with automatic metadata updates
- Team permissions integration

**iDumb Adoption:**
- Support optional `visibility` field for future web UI
- Implement `cover` field for document thumbnails
- Maintain human-readable metadata structure

### 6.3 Obsidian (Personal Knowledge Management)

**Key Patterns:**

1. **Properties UI:**
```yaml
---
title: Note Title
tags: [tag1, tag2]
type: zettelkasten
created: 2026-02-04
modified: 2026-02-04
---
```

2. **Dataview Plugin:**
```yaml
---
status: active
priority: high
due_date: 2026-03-01
---
```

**Querying:**
```javascript
// Dataview query example
LIST FROM #project WHERE status = "active" SORT priority DESC
```

**iDumb Adoption:**
- Support Dataview-compatible field names (`modified` vs `updated`)
- Enable query-style document discovery
- Implement status-based filtering

### 6.4 Industry Standards Summary

**Common Patterns Across Systems:**

| Field | Docusaurus | GitBook | Obsidian | iDumb Recommendation |
|-------|-------------|----------|-----------|---------------------|
| `id` | ✅ (slug) | ✅ (auto) | ❌ | ✅ (UUID v7) |
| `title` | ✅ | ✅ | ✅ | ✅ (required) |
| `description` | ✅ | ✅ | ❌ | ✅ (optional) |
| `tags` | ✅ | ❌ | ✅ | ✅ (optional) |
| `created` | ❌ | ❌ | ✅ | ✅ (required, ISO 8601) |
| `updated` | ❌ | ❌ | ✅ | ✅ (optional, ISO 8601) |
| `status` | ❌ | ❌ | ✅ (custom) | ✅ (enum, 4 states) |
| `parent_id` | ❌ | ❌ | ❌ | ✅ (chain tracking) |

**Recommendations for iDumb:**

1. **Maintain Core Fields:** `id`, `title`, `created`, `updated`
2. **Add Governance Fields:** `status`, `parent_id`, `author`
3. **Support Lifecycle:** `stale_after`, `stale_date`
4. **Enable Traceability:** `dependencies`, `milestone`
5. **Allow Extensions:** `tags`, `priority`, `version`

---

## 7. Implementation Examples

### 7.1 Complete Frontmatter Parser

```typescript
import matter from 'gray-matter'
import { validateFrontmatter } from './validation'

interface ParsedDocument {
  frontmatter: any
  content: string
  valid: boolean
  errors: string[]
  excerpt?: string
}

async function parseDocument(
  filePath: string,
  options: { excerpt?: boolean; excerpt_separator?: string } = {}
): Promise<ParsedDocument> {
  const content = await fs.promises.readFile(filePath, 'utf-8')
  
  // Parse with gray-matter
  const { data, content: markdownContent, excerpt } = matter(content, {
    excerpt: options.excerpt || false,
    excerpt_separator: options.excerpt_separator || '<!-- more -->'
  })
  
  // Validate frontmatter
  const validation = validateFrontmatter(data)
  
  return {
    frontmatter: data,
    content: markdownContent,
    valid: validation.valid,
    errors: validation.errors,
    excerpt
  }
}

// Usage
const doc = await parseDocument('/path/to/document.md')
if (!doc.valid) {
  console.error('Validation errors:', doc.errors)
}
```

### 7.2 Frontmatter Auto-Generator

```typescript
interface FrontmatterOptions {
  title: string
  type: string
  parent_id?: string | string[]
  tags?: string[]
  priority?: 'low' | 'medium' | 'high' | 'critical'
  stale_after?: string | number
}

function generateFrontmatter(options: FrontmatterOptions): string {
  const frontmatter: any = {
    id: generateUUIDv7(),
    title: options.title,
    type: options.type,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    status: 'draft',
    author: 'system'
  }
  
  // Optional fields
  if (options.parent_id) {
    frontmatter.parent_id = options.parent_id
  }
  
  if (options.tags) {
    frontmatter.tags = options.tags
  }
  
  if (options.priority) {
    frontmatter.priority = options.priority
  }
  
  if (options.stale_after) {
    frontmatter.stale_after = options.stale_after
  }
  
  // Format as YAML
  return `---\n${formatYAML(frontmatter)}\n---`
}

function formatYAML(obj: any, indent: number = 0): string {
  const spaces = ' '.repeat(indent)
  const lines: string[] = []
  
  for (const [key, value] of Object.entries(obj)) {
    if (Array.isArray(value)) {
      lines.push(`${spaces}${key}:`)
      value.forEach(item => {
        lines.push(`${spaces}  - ${item}`)
      })
    } else if (typeof value === 'string') {
      lines.push(`${spaces}${key}: "${value}"`)
    } else if (typeof value === 'boolean') {
      lines.push(`${spaces}${key}: ${value}`)
    } else if (typeof value === 'number') {
      lines.push(`${spaces}${key}: ${value}`)
    } else if (value === null || value === undefined) {
      // Skip
    } else {
      lines.push(`${spaces}${key}: ${JSON.stringify(value)}`)
    }
  }
  
  return lines.join('\n')
}

// Usage
const newDocFrontmatter = generateFrontmatter({
  title: 'New Document',
  type: 'task',
  parent_id: 'phase-3-plan-uuid',
  tags: ['feature', 'backend'],
  priority: 'high',
  stale_after: '7d'
})

console.log(newDocFrontmatter)
```

### 7.3 Chain Integrity Checker

```typescript
interface ChainIntegrityReport {
  valid: boolean
  totalDocuments: number
  brokenChains: number
  orphanedDocuments: number
  circularReferences: number
  details: {
    broken: Array<{ documentId: string; missingParent: string }>
    orphaned: Array<{ documentId: string; type: string }>
    circular: Array<{ chain: string[] }>
  }
}

async function checkChainIntegrity(
  directory: string
): Promise<ChainIntegrityReport> {
  const files = await glob(`${directory}/**/*.md`)
  const documents: Document[] = []
  
  // Parse all documents
  for (const filePath of files) {
    const parsed = await parseDocument(filePath)
    if (parsed.valid) {
      documents.push({
        ...parsed.frontmatter,
        filePath
      })
    }
  }
  
  // Validate chains
  const chainValidation = validateChains(documents)
  
  // Detect circular references
  const graph = buildGraph(documents)
  const cycles = detectAllCycles(graph)
  
  return {
    valid: chainValidation.valid && cycles.length === 0,
    totalDocuments: documents.length,
    brokenChains: chainValidation.brokenChains.length,
    orphanedDocuments: chainValidation.orphanedDocuments.length,
    circularReferences: cycles.length,
    details: {
      broken: chainValidation.brokenChains,
      orphaned: chainValidation.orphanedDocuments.map(doc => ({
        documentId: doc.id,
        type: 'no-parent'
      })),
      circular: cycles
    }
  }
}

function detectAllCycles(graph: DependencyGraph): string[][] {
  const cycles: string[][] = []
  const visited = new Set<string>()
  
  for (const nodeId of graph.nodes.keys()) {
    if (!visited.has(nodeId)) {
      const cycle = findCycle(graph, nodeId)
      if (cycle) {
        cycles.push(cycle)
        visited.add(...cycle)
      }
    }
  }
  
  return cycles
}

// Usage
const report = await checkChainIntegrity('.planning/phases/3')
if (!report.valid) {
  console.error('Chain integrity issues found:')
  console.error(`  - Broken chains: ${report.brokenChains}`)
  console.error(`  - Orphaned documents: ${report.orphanedDocuments}`)
  console.error(`  - Circular references: ${report.circularReferences}`)
  
  // Generate healing suggestions
  await generateHealingSuggestions(report.details)
}
```

### 7.4 Staleness Monitor

```typescript
import cron from 'node-cron'

class StalenessMonitor {
  private interval: cron.ScheduledTask | null = null
  private checkInterval: string = '0 0 * * *'  // Daily at midnight
  
  constructor(
    private documentDirectory: string,
    private options: {
      autoArchive?: boolean
      autoDelete?: boolean
      notificationCallback?: (alerts: StalenessAlert[]) => void
    } = {}
  ) {}
  
  start(): void {
    if (this.interval) {
      console.warn('Staleness monitor already running')
      return
    }
    
    console.log('Starting staleness monitor...')
    
    this.interval = cron.schedule(this.checkInterval, async () => {
      await this.checkStaleness()
    })
  }
  
  stop(): void {
    if (this.interval) {
      this.interval.stop()
      this.interval = null
      console.log('Staleness monitor stopped')
    }
  }
  
  private async checkStaleness(): Promise<void> {
    console.log(`[${new Date().toISOString()}] Checking for stale documents...`)
    
    const files = await glob(`${this.documentDirectory}/**/*.md`)
    const documents: Document[] = []
    
    for (const filePath of files) {
      const parsed = await parseDocument(filePath)
      if (parsed.valid) {
        documents.push({
          ...parsed.frontmatter,
          filePath
        })
      }
    }
    
    // Detect stale documents
    const staleDocs = detectStaleDocuments(documents)
    
    if (staleDocs.length === 0) {
      console.log('No stale documents found')
      return
    }
    
    // Generate alerts
    const alerts = generateStalenessAlerts(staleDocs)
    
    // Notify
    if (this.options.notificationCallback) {
      await this.options.notificationCallback(alerts)
    }
    
    // Handle automatically if configured
    if (this.options.autoArchive || this.options.autoDelete) {
      await handleStaleDocuments(documents, {
        autoArchive: this.options.autoArchive,
        autoDelete: this.options.autoDelete
      })
    }
  }
}

// Usage
const monitor = new StalenessMonitor('.planning/phases', {
  autoArchive: true,
  autoDelete: false,
  notificationCallback: (alerts) => {
    console.log('Staleness alerts:', alerts)
    // Send to Slack, email, etc.
  }
})

monitor.start()

// Later...
// monitor.stop()
```

---

## 8. Recommendations for iDumb Implementation

### 8.1 Frontmatter Schema

**Adopt this schema for all iDumb documents:**

```yaml
---
# ===== REQUIRED =====
id: "uuid-v7-string"                    # Unique identifier
title: "Document Title"                   # Human-readable name
type: "document-type"                    # agent, command, research, etc.
created: "ISO-8601-timestamp"          # Creation time

# ===== HIGHLY RECOMMENDED =====
updated: "ISO-8601-timestamp"          # Last update time
status: "draft|active|archived|deleted"   # Lifecycle state
parent_id: "uuid-v7-string"             # Parent document
author: "agent-or-human-name"            # Creator

# ===== OPTIONAL =====
description: "Short summary"              # SEO/search
tags: ["tag1", "tag2"]                 # Categories
priority: "low|medium|high|critical"      # Importance
milestone: "phase-number"                # Associated phase
version: "semantic-version"                # Document version
dependencies: ["id1", "id2"]           # Related docs
stale_after: "48h"                       # Staleness threshold
override_staleness: false                  # Skip auto-handling
---
```

### 8.2 ID Generation Strategy

**Use UUID v7 for all documents:**

```typescript
import { v7 as uuidv7 } from 'uuid'

function generateDocumentId(): string {
  return uuidv7()
}

// Example output:
// "018f4b7a-7d0f-7a0c-b530-0d7a0f7d0f7a"
```

**Rationale:**
- Time-ordered for natural sorting
- Globally unique across all projects
- Standard format (RFC 9562)
- Collision-proof at scale

### 8.3 Chain Detection Algorithm

**Implement forward and backward traversal:**

```typescript
// Build dependency graph
const graph = buildGraph(allDocuments)

// Forward: Find children of a document
const children = findChildren(documentId, allDocuments)

// Backward: Trace ancestry
const chain = traceChain(documentId, allDocuments)

// Validate: Check for broken chains
const validation = validateChains(allDocuments)

// Detect cycles
const cycles = detectAllCycles(graph)
```

### 8.4 Staleness Tracking Mechanism

**Track with multiple timestamps:**

```yaml
created: "2026-02-01T10:00:00Z"    # Immutable
updated: "2026-02-04T14:30:00Z"    # Updated on every edit
last_accessed: "2026-02-04T14:30:00Z" # Last read
last_validated: "2026-02-04T12:00:00Z" # Last validation check
```

**Detection logic:**
- Default threshold: 30 days for active, 365 days for archived
- Custom threshold via `stale_after` field
- ISO 8601 format for all timestamps
- Automatic actions configurable (archive/delete/review)

### 8.5 Validation Approach

**Use remark-lint-frontmatter-schema:**

```bash
npm install remark remark-lint remark-lint-frontmatter-schema gray-matter
```

**Validation pipeline:**
1. Parse with gray-matter
2. Validate with JSON schema
3. Type check all fields
4. Enum validation for status/type/priority
5. Chain integrity checks
6. Return structured errors

### 8.6 Implementation Priority

**Phase 1: Core Infrastructure (Week 1)**
- [ ] Implement UUID v7 ID generation
- [ ] Create JSON schema for frontmatter
- [ ] Build gray-matter parser integration
- [ ] Set up remark-lint validation

**Phase 2: Chain Management (Week 2)**
- [ ] Implement forward/backward chain traversal
- [ ] Build chain validation logic
- [ ] Add broken chain detection
- [ ] Create orphan detection

**Phase 3: Lifecycle Management (Week 3)**
- [ ] Implement 4-state model
- [ ] Build state transition rules
- [ ] Add automated state changes
- [ ] Implement override mechanisms

**Phase 4: Staleness Tracking (Week 4)**
- [ ] Implement ISO 8601 timestamp utilities
- [ ] Build staleness detection
- [ ] Create automatic archiving
- [ ] Add staleness monitoring service

**Phase 5: Integration & Testing (Week 5)**
- [ ] Integrate with existing iDumb tools
- [ ] Create validation CLI
- [ ] Build monitoring dashboard
- [ ] Comprehensive testing

---

## 9. Sources

### 9.1 YAML Frontmatter Standards

1. **Jekyll Documentation** - https://jekyllrb.com/docs/front-matter/
2. **Hugo Front Matter** - https://gohugo.io/content-management/front-matter/
3. **Docusaurus Front Matter** - https://docusaurus.io/docs/markdown-features/resources
4. **GitBook Metadata** - https://docs.gitbook.com/
5. **Obsidian Properties** - https://help.obsidian.md/Editing+and+formatting/Properties

### 9.2 Validation Libraries

1. **gray-matter** - https://github.com/jonschlinkert/gray-matter
2. **remark-lint-frontmatter-schema** - https://github.com/JulianCataldo/remark-lint-frontmatter-schema
3. **yaml-fm-lint** - https://github.com/leneti/yaml-fm-lint
4. **front-matter-schema** - https://github.com/hashicorp/front-matter-schema

### 9.3 UUID Generation

1. **uuid npm package** - https://github.com/uuidjs/uuid
2. **Node.js crypto.randomUUID()** - https://nodejs.org/api/crypto.html#cryptorandomuuid
3. **UUID RFC 9562** - https://www.rfc-editor.org/rfc/rfc9562.html

### 9.4 ISO 8601 Standards

1. **ISO 8601 Wikipedia** - https://en.wikipedia.org/wiki/ISO_8601
2. **Date and Time Format** - https://xkcd.com/1179/ (humor)
3. **JavaScript Date Parsing** - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date

### 9.5 Document Lifecycle

1. **Document Lifecycle Management** - https://www.cognidox.com/blog/what-is-document-lifecycle-management
2. **Veeva Vault Document States** - https://platform.veevavault.help/en/gr/14560/
3. **State Machine Design** - https://refactoring.guru/state-pattern

### 9.6 Additional References

1. **Parent-Child Document Retrieval** - Dify Blog (2024-12-26)
2. **Elasticsearch Parent-Child** - https://elastic.co/guide/en/elasticsearch/guide/current/parent-child.html
3. **HiLo Algorithm** - https://docs.ravendb.net/7.1/client-api/document-identifiers/hilo-algorithm/
4. **MongoDB Parent Document Retrieval** - https://mongodb.com/developer/products/atlas/parent-doc-retrieval

---

## Appendix: Quick Reference

### A.1 Common Frontmatter Patterns

```yaml
# Simple document
---
id: "uuid-v7"
title: "Title"
type: "task"
created: "2026-02-04T10:00:00Z"
status: "draft"
---

# Phase plan with hierarchy
---
id: "phase-3-uuid"
title: "Phase 3 Execution"
type: "phase-plan"
parent_id: "project-root-uuid"
milestone: 3
created: "2026-02-01T10:00:00Z"
updated: "2026-02-04T14:30:00Z"
status: "active"
---

# Research document with staleness
---
id: "research-uuid"
title: "Frontmatter Research"
type: "research"
parent_id: "phase-2-uuid"
created: "2026-01-15T10:00:00Z"
updated: "2026-02-01T10:00:00Z"
stale_after: "30d"
status: "active"
tags: ["governance", "metadata"]
---
```

### A.2 Validation Commands

```bash
# Validate single document
npx remark-lint document.md --rule 'lint-frontmatter-schema: error'

# Validate all markdown files
npx remark-lint '**/*.md' --rule 'lint-frontmatter-schema: error'

# Check chain integrity
node scripts/check-chain-integrity.js .planning/phases

# Detect stale documents
node scripts/detect-stale.js .planning/phases
```

### A.3 Timestamp Utilities

```typescript
// Current timestamp in ISO 8601
const now = new Date().toISOString()  // "2026-02-04T12:34:56.789Z"

// Parse timestamp
const date = new Date("2026-02-04T12:34:56.789Z")

// Add days
const future = new Date(date.getTime() + 30 * 24 * 60 * 60 * 1000)

// Format as date only
const dateOnly = date.toISOString().split('T')[0]  // "2026-02-04"

// Age in days
const ageDays = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24)
```

### A.4 Chain Query Examples

```typescript
// Find all children
const children = allDocs.filter(d => d.parent_id === parentId)

// Find all ancestors
function findAncestors(docId: string): Document[] {
  const ancestors: Document[] = []
  let currentId = docId
  
  while (currentId) {
    const parent = allDocs.find(d => d.id === currentId)
    if (!parent || !parent.parent_id) break
    
    ancestors.unshift(parent)
    currentId = Array.isArray(parent.parent_id) ? parent.parent_id[0] : parent.parent_id
  }
  
  return ancestors
}

// Build full hierarchy tree
function buildTree(documents: Document[]): DocumentTree {
  const map = new Map(documents.map(d => [d.id, { ...d, children: [] }]))
  const roots: Document[] = []
  
  documents.forEach(doc => {
    const node = map.get(doc.id)
    
    if (doc.parent_id) {
      const parent = Array.isArray(doc.parent_id) 
        ? map.get(doc.parent_id[0])
        : map.get(doc.parent_id)
      
      if (parent) {
        parent.children!.push(node!)
      }
    } else {
      roots.push(node!)
    }
  })
  
  return roots
}
```

---

**Document Version:** 1.0.0
**Last Updated:** 2026-02-04
**Status:** Complete ✅
