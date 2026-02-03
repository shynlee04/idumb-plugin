# Metadata Schema Tools Research

**Project:** iDumb Brain Metadata Management  
**Researched:** 2026-02-02  
**Focus:** Schema validation, metadata extraction, relational data handling for governance artifacts

---

## Executive Summary

This research evaluates tools for iDumb's "brain" concept - a metadata layer that tracks sessions, tasks, files, decisions, and their relationships. The recommended core stack is **Zod + gray-matter + graphlib** based on:

- **Zod**: TypeScript-native, excellent DX, robust ecosystem, type inference
- **gray-matter**: Fast, reliable frontmatter parsing with YAML/JSON/TOML support
- **graphlib**: Proven graph algorithms (DAG, topological sort, shortest path) for relationship tracking

Alternative stacks considered: Valibot (smaller bundle), AJV + JSON Schema (standard compliance), Drizzle ORM (if SQL backend needed).

---

## 1. Schema Validation Libraries

### 1.1 Zod (Recommended)

| Attribute | Value |
|-----------|-------|
| **Bundle Size** | ~17.7 kB (v3), ~6.88 kB (v4 mini), ~3.94 kB (v4 mini + Rolldown) |
| **TypeScript Support** | Native, first-class |
| **Performance** | ~3,500 ops/sec (middle of pack) |
| **Maintenance** | Very active (v4 released 2025) |

**Why Recommended:**
- TypeScript-first design with automatic type inference
- Intuitive chainable API: `z.object({ name: z.string() })`
- Strong ecosystem integration (React Hook Form, tRPC, etc.)
- `z.infer<typeof Schema>` extracts types automatically
- Schema composition via `.extend()`, `.pick()`, `.omit()`, `.partial()`
- Built-in transformations with `.transform()`
- Custom validations with `.refine()` and `.superRefine()`

**Code Example:**
```typescript
import { z } from 'zod';

const SessionSchema = z.object({
  sessionId: z.string(),
  createdAt: z.string().datetime(),
  phase: z.enum(['init', 'planning', 'execution', 'review']),
  governanceLevel: z.enum(['minimal', 'standard', 'high', 'supreme']),
  delegationDepth: z.number().int().min(0),
  parentSession: z.string().nullable(),
  metadata: z.record(z.unknown()).optional()
});

type Session = z.infer<typeof SessionSchema>;

// Validation
const result = SessionSchema.safeParse(data);
if (result.success) {
  const session: Session = result.data;
}
```

**Sources:** Context7 `/colinhacks/zod`, valibot.dev comparison benchmarks

---

### 1.2 Valibot (Alternative - Smaller Bundle)

| Attribute | Value |
|-----------|-------|
| **Bundle Size** | ~1.37 kB (90% smaller than Zod) |
| **TypeScript Support** | Native |
| **Performance** | ~2x faster than Zod v3 |
| **Maintenance** | Active |

**Why Consider:**
- Tree-shakeable modular design
- Excellent for client-side validation where bundle size matters
- Similar API to Zod via `v.pipe()` composition
- Growing ecosystem

**Trade-offs:**
- Smaller ecosystem than Zod
- Less mature (fewer integrations)
- Slightly different mental model (pipe-based vs chain-based)

**Code Example:**
```typescript
import * as v from 'valibot';

const SessionSchema = v.object({
  sessionId: v.pipe(v.string(), v.nonEmpty()),
  phase: v.union([
    v.literal('init'),
    v.literal('planning'),
    v.literal('execution')
  ])
});

type Session = v.InferOutput<typeof SessionSchema>;
```

**Verdict:** Use Valibot if bundle size is critical (browser/edge functions). Use Zod for server-side metadata validation where ecosystem matters.

---

### 1.3 AJV + JSON Schema (Standard Compliance)

| Attribute | Value |
|-----------|-------|
| **Bundle Size** | ~18 kB (AJV core) |
| **TypeScript Support** | Via `JSONSchemaType<T>` |
| **Performance** | ~8.9M ops/sec (fastest) |
| **Maintenance** | Very active |

**Why Consider:**
- JSON Schema standard compliance (interoperability)
- Fastest validation performance
- Schema can be shared across languages
- Pre-compilation for production performance

**Trade-offs:**
- Separate schema definition from TypeScript types
- More verbose than Zod/Valibot
- JSON Schema syntax less ergonomic

**Code Example:**
```typescript
import Ajv, { JSONSchemaType } from 'ajv';

interface Session {
  sessionId: string;
  phase: 'init' | 'planning' | 'execution';
}

const schema: JSONSchemaType<Session> = {
  type: "object",
  properties: {
    sessionId: { type: "string" },
    phase: { type: "string", enum: ['init', 'planning', 'execution'] }
  },
  required: ["sessionId", "phase"]
};

const ajv = new Ajv();
const validate = ajv.compile(schema);
```

**Verdict:** Use if you need JSON Schema interoperability or maximum performance. Not recommended for iDumb due to DX overhead.

---

### 1.4 Yup

| Attribute | Value |
|-----------|-------|
| **Bundle Size** | ~20 kB |
| **TypeScript Support** | Good (InferType) |
| **Performance** | ~123k ops/sec |
| **Maintenance** | Active |

**Why Consider:**
- Popular in React ecosystem (Formik)
- Conditional validation with `.when()`
- Good error message customization

**Trade-offs:**
- Larger bundle than Zod
- Slower than Zod
- InferType less precise than Zod's inference

**Verdict:** Not recommended for iDumb. Use Zod instead (similar features, better TypeScript).

---

### 1.5 Joi

| Attribute | Value |
|-----------|-------|
| **Bundle Size** | ~30 kB+ |
| **TypeScript Support** | Via @types/joi |
| **Performance** | Good |
| **Maintenance** | Active (Hapi.js ecosystem) |

**Why Consider:**
- Most powerful validation features
- Extensive rule set
- Enterprise-grade

**Trade-offs:**
- Heavy bundle
- Not TypeScript-native
- Overkill for iDumb's needs

**Verdict:** Not recommended. Too heavy for metadata validation.

---

### 1.6 io-ts

| Attribute | Value |
|-----------|-------|
| **Bundle Size** | ~15 kB |
| **TypeScript Support** | Native (functional approach) |
| **Performance** | Good |
| **Maintenance** | Stable |

**Why Consider:**
- Functional programming approach
- Runtime type validation with fp-ts integration
- Precise control over error handling

**Trade-offs:**
- Steeper learning curve (FP concepts)
- Smaller ecosystem
- Verbose syntax

**Verdict:** Not recommended unless team is familiar with FP. Zod provides similar benefits with better DX.

---

## Schema Validation Summary

| Library | Bundle Size | TypeScript | Performance | Recommendation |
|---------|-------------|------------|-------------|----------------|
| **Zod** | ~17.7 kB | Native | Medium | **Primary** |
| Valibot | ~1.37 kB | Native | Fast | Alternative (bundle-critical) |
| AJV | ~18 kB | Good | Fastest | JSON Schema needs |
| Yup | ~20 kB | Good | Medium | Not recommended |
| Joi | ~30 kB | Via types | Good | Too heavy |
| io-ts | ~15 kB | Native | Good | FP teams only |

---

## 2. Metadata Extraction Libraries

### 2.1 gray-matter (Recommended)

| Attribute | Value |
|-----------|-------|
| **Bundle Size** | ~8 kB |
| **Formats** | YAML, JSON, TOML, Coffee |
| **Performance** | Fast (benchmarked) |
| **Maintenance** | Mature, stable |

**Why Recommended:**
- Simple, reliable API
- Multiple frontmatter format support
- Returns `{ data, content, orig }` structure
- Extensive real-world usage (Gatsby, etc.)

**Code Example:**
```typescript
import matter from 'gray-matter';

const file = `---
sessionId: ses_3e425e1aeffe
phase: execution
governanceLevel: high
---
# Session Content

Task execution details here...`;

const parsed = matter(file);
// parsed.data = { sessionId, phase, governanceLevel }
// parsed.content = '# Session Content...'
// parsed.orig = original string

// With options
const parsed = matter(file, {
  language: 'yaml',      // Explicit language
  delimiters: '---',     // Custom delimiters
  engines: {
    yaml: (str) => yaml.parse(str)  // Custom parser
  }
});
```

**Sources:** Context7 `/jonschlinkert/gray-matter`

---

### 2.2 remark-frontmatter (Unified Ecosystem)

| Attribute | Value |
|-----------|-------|
| **Bundle Size** | ~5 kB + unified deps |
| **Formats** | YAML, TOML, custom |
| **Performance** | Good |
| **Maintenance** | Active (Unified ecosystem) |

**Why Consider:**
- Part of powerful Unified/Remark ecosystem
- Supports custom frontmatter types
- Can be combined with other remark plugins

**Trade-offs:**
- More complex setup (Unified pipeline)
- Overkill if only parsing frontmatter

**Code Example:**
```typescript
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkFrontmatter from 'remark-frontmatter';
import remarkParseFrontmatter from 'remark-parse-frontmatter';

const file = unified()
  .use(remarkParse)
  .use(remarkFrontmatter, ['yaml', 'toml'])
  .use(remarkParseFrontmatter)
  .processSync(content);

const frontmatter = file.data.frontmatter;
```

**Verdict:** Use if already in Unified ecosystem. Otherwise, gray-matter is simpler.

---

### 2.3 TOML Parsing (@iarna/toml)

| Attribute | Value |
|-----------|-------|
| **Bundle Size** | ~15 kB |
| **Spec Compliance** | TOML 1.0 |
| **Features** | Parse, stringify, streaming |
| **Maintenance** | Mature |

**Why Consider:**
- Best TOML parser for JavaScript
- TypeScript support via `@types/iarna__toml`
- Handles complex nested structures
- Good error messages

**Code Example:**
```typescript
import TOML from '@iarna/toml';

const parsed = TOML.parse(`
[session]
id = "ses_123"
phase = "execution"

[metadata]
priority = "high"
tags = ["critical", "review-needed"]
`);

const stringified = TOML.stringify(parsed);
```

**Verdict:** Use if TOML is your primary frontmatter format. gray-matter includes TOML support via this library.

---

## Metadata Extraction Summary

| Library | Bundle | Formats | Use Case |
|---------|--------|---------|----------|
| **gray-matter** | ~8 kB | YAML/JSON/TOML | **Primary choice** |
| remark-frontmatter | ~5 kB+ | YAML/TOML/custom | Unified ecosystem |
| @iarna/toml | ~15 kB | TOML only | TOML-heavy projects |

---

## 3. Relational Data Management

### 3.1 Drizzle ORM (Recommended for SQL)

| Attribute | Value |
|-----------|-------|
| **Bundle Size** | ~15 kB (tree-shakeable) |
| **TypeScript Support** | Native, SQL-like |
| **Performance** | Excellent |
| **Maintenance** | Very active (2024-2025) |

**Why Consider:**
- TypeScript-first, SQL-like syntax
- Tree-shakeable (only include what you use)
- Excellent query builder API
- Relations support with RQB (Relational Query Builder)
- Supports SQLite, PostgreSQL, MySQL

**Trade-offs:**
- Newer ecosystem (growing rapidly)
- Requires database connection

**Code Example:**
```typescript
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { eq, and } from 'drizzle-orm';

// Schema definition
const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  phase: text('phase').notNull(),
  parentId: text('parent_id')
});

// Querying with relations
const db = drizzle({ schema: { sessions } });

const result = await db.query.sessions.findMany({
  where: eq(sessions.phase, 'execution'),
  with: {
    parent: true  // Relations
  }
});
```

**Verdict:** Use if iDumb needs SQL backend. Overkill for file-based metadata.

---

### 3.2 Knex.js (Query Builder)

| Attribute | Value |
|-----------|-------|
| **Bundle Size** | ~30 kB |
| **TypeScript Support** | Good |
| **Performance** | Good |
| **Maintenance** | Mature |

**Why Consider:**
- Universal query builder (works with any SQL DB)
- Migrations support
- Extensive documentation

**Trade-offs:**
- Not TypeScript-native (types added later)
- Larger bundle
- Requires query builder knowledge

**Verdict:** Not recommended for iDumb. Use Drizzle if SQL needed.

---

### 3.3 File-Based (Recommended for iDumb)

For iDumb's brain concept, a file-based approach with structured JSON/metadata files is likely sufficient:

```typescript
// Proposed structure
.idumb/
  brain/
    state.json           # Current state
    sessions/
      ses_xxx.json       # Individual sessions
    history/
      2026-02-02.json    # Daily history logs
    anchors/
      anchor_xxx.json    # Persistent anchors
  governance/
    validations/
      val_xxx.json       # Validation results
```

**Benefits:**
- No database setup required
- Git-friendly (version control)
- Easy to inspect/debug
- Simple backup/restore
- No runtime dependencies

---

## Relational Data Summary

| Approach | Complexity | Persistence | Use Case |
|----------|------------|-------------|----------|
| **File-based JSON** | Low | File system | **iDumb default** |
| Drizzle ORM | Medium | SQL | Scale/relations needed |
| Knex.js | Medium | SQL | Legacy/compatibility |

---

## 4. Graph/Relationship Tracking

### 4.1 graphlib (Recommended)

| Attribute | Value |
|-----------|-------|
| **Bundle Size** | ~15 kB |
| **Algorithms** | DAG, topsort, shortest path, connected components |
| **TypeScript Support** | Via @types/graphlib |
| **Maintenance** | Mature (dagrejs org) |

**Why Recommended:**
- Proven graph algorithms
- Directed graph support
- Topological sorting (dependency resolution)
- Shortest path algorithms
- Cycle detection

**Code Example:**
```typescript
import * as graphlib from 'graphlib';

// Create graph
const g = new graphlib.Graph({ directed: true });

// Add nodes (sessions, tasks, files)
g.setNode('ses_001', { type: 'session', phase: 'execution' });
g.setNode('task_001', { type: 'task', status: 'completed' });
g.setNode('file_001', { type: 'file', path: '/src/index.ts' });

// Add edges (relationships)
g.setEdge('ses_001', 'task_001', { relation: 'contains' });
g.setEdge('task_001', 'file_001', { relation: 'modifies' });

// Algorithms
const isAcyclic = graphlib.alg.isAcyclic(g);  // true
const topsort = graphlib.alg.topsort(g);      // dependency order
const path = graphlib.alg.dijkstra(g, 'ses_001');  // shortest paths
```

**Graph Operations for iDumb:**
```typescript
// Session dependency graph
function buildSessionGraph(sessions: Session[]) {
  const g = new graphlib.Graph({ directed: true });
  
  sessions.forEach(s => {
    g.setNode(s.sessionId, s);
    if (s.parentSession) {
      g.setEdge(s.parentSession, s.sessionId, { type: 'parent' });
    }
  });
  
  return g;
}

// Find all sessions that depend on a given session
function getDependents(graph: graphlib.Graph, sessionId: string): string[] {
  return graph.successors(sessionId) as string[];
}

// Get execution order (respecting dependencies)
function getExecutionOrder(graph: graphlib.Graph): string[] {
  return graphlib.alg.topsort(graph);
}
```

---

### 4.2 graph-data-structure

| Attribute | Value |
|-----------|-------|
| **Bundle Size** | ~5 kB |
| **Algorithms** | Topological sort, shortest path |
| **TypeScript Support** | Limited |
| **Maintenance** | Stable |

**Why Consider:**
- Lightweight
- Simple API

**Trade-offs:**
- Fewer algorithms than graphlib
- Less TypeScript support

**Verdict:** Use graphlib instead (more mature, better algorithms).

---

### 4.3 Graphology

| Attribute | Value |
|-----------|-------|
| **Bundle Size** | ~20 kB |
| **Algorithms** | Extensive via plugins |
| **TypeScript Support** | Native |
| **Maintenance** | Active |

**Why Consider:**
- Modern graph library
- Plugin ecosystem
- Good performance

**Trade-offs:**
- More complex API
- Larger bundle

**Verdict:** Overkill for iDumb's needs. graphlib is sufficient.

---

## Graph Library Summary

| Library | Bundle | Algorithms | TypeScript | Recommendation |
|---------|--------|------------|------------|----------------|
| **graphlib** | ~15 kB | DAG, topsort, paths | Via types | **Primary** |
| graph-data-structure | ~5 kB | Basic | Limited | Lightweight alt |
| Graphology | ~20 kB | Extensive | Native | Complex needs |

---

## 5. Time-Series Metadata

### 5.1 Event Sourcing Pattern

For iDumb's history tracking, an event-sourcing approach works well:

```typescript
// Event types
interface HistoryEvent {
  id: string;
  timestamp: string;
  type: 'session.created' | 'task.started' | 'validation.completed' | 'anchor.added';
  payload: Record<string, unknown>;
  metadata: {
    agent: string;
    version: string;
  };
}

// Append-only event log
const eventLog: HistoryEvent[] = [];

// Current state derived from events
function computeState(events: HistoryEvent[]): BrainState {
  return events.reduce((state, event) => {
    switch (event.type) {
      case 'session.created':
        state.sessions.push(event.payload as Session);
        break;
      case 'anchor.added':
        state.anchors.push(event.payload as Anchor);
        break;
    }
    return state;
  }, { sessions: [], anchors: [] });
}
```

**Benefits:**
- Immutable history
- Audit trail
- Can reconstruct state at any point

---

### 5.2 Git-like Versioning

For metadata versioning:

```typescript
interface MetadataVersion {
  hash: string;           // Content hash
  parent: string | null;  // Previous version
  timestamp: string;
  author: string;
  message: string;
  content: unknown;
}

// Simple content-addressable storage
const versionStore = new Map<string, MetadataVersion>();
```

---

## 6. ID Generation

### 6.1 ULID (Recommended)

| Attribute | Value |
|-----------|-------|
| **Length** | 26 characters |
| **Sortable** | Yes (timestamp prefix) |
| **Collision Risk** | Negligible |
| **Performance** | Very fast |

**Why Recommended:**
- Lexicographically sortable (database-friendly)
- Timestamp embedded (no need for separate createdAt index)
- URL-safe (Crockford's base32)
- No special characters

**Code Example:**
```typescript
import { ulid } from 'ulid';

const id = ulid();  // 01ARZ3NDEKTSV4RRFFQ69G5FAV

// With timestamp (for testing)
const id = ulid(1469918176385);

// Monotonic (for same-millisecond ordering)
import { monotonicFactory } from 'ulid';
const ulid = monotonicFactory();
```

**For iDumb:**
- `ses_` + ULID = session IDs
- `task_` + ULID = task IDs  
- `anchor_` + ULID = anchor IDs

---

### 6.2 nanoid (Alternative)

| Attribute | Value |
|-----------|-------|
| **Length** | 21 characters (default) |
| **Sortable** | No |
| **Collision Risk** | Negligible |
| **Bundle** | Very small (~130 bytes) |

**Why Consider:**
- Smallest bundle
- Fastest generation
- Customizable alphabet

**Trade-offs:**
- Not sortable
- No timestamp info

**Verdict:** Use ULID for iDumb (sortability valuable for chronological queries).

---

### 6.3 UUID v4

| Attribute | Value |
|-----------|-------|
| **Length** | 36 characters |
| **Sortable** | No |
| **Standard** | RFC 4122 |

**Verdict:** Not recommended. ULID has all benefits plus sortability.

---

### 6.4 Custom Hierarchical IDs

For governance hierarchy (REQ-001, TASK-01-02):

```typescript
// Hierarchical ID generator
class HierarchicalId {
  private counters = new Map<string, number>();
  
  generate(type: 'REQ' | 'TASK' | 'PLAN', parent?: string): string {
    const key = parent ? `${type}-${parent}` : type;
    const count = (this.counters.get(key) || 0) + 1;
    this.counters.set(key, count);
    
    return parent ? `${type}-${parent}-${String(count).padStart(2, '0')}` : `${type}-${String(count).padStart(3, '0')}`;
  }
}

const ids = new HierarchicalId();
ids.generate('REQ');        // REQ-001
ids.generate('TASK', '001'); // TASK-001-01
```

**Verdict:** Useful for human-readable references. Use alongside ULIDs for internal IDs.

---

## ID Generation Summary

| Generator | Length | Sortable | Bundle | Use Case |
|-----------|--------|----------|--------|----------|
| **ULID** | 26 | Yes | Small | **Primary** |
| nanoid | 21 | No | Tiny | Bundle-critical |
| UUID | 36 | No | Small | Standards compliance |
| Custom | Variable | Yes | N/A | Human-readable refs |

---

## 7. Diff and Patch

### 7.1 fast-json-patch (Recommended)

| Attribute | Value |
|-----------|-------|
| **Standard** | RFC 6902 (JSON Patch) |
| **Bundle Size** | ~5 kB |
| **Operations** | add, remove, replace, move, copy, test |
| **Maintenance** | Mature |

**Why Recommended:**
- RFC 6902 compliant (interoperable)
- Compact diff format
- Reversible operations

**Code Example:**
```typescript
import * as jsonpatch from 'fast-json-patch';

const original = { phase: 'init', taskCount: 0 };
const modified = { phase: 'execution', taskCount: 5, completed: true };

// Generate patch
const patch = jsonpatch.compare(original, modified);
// [
//   { op: 'replace', path: '/phase', value: 'execution' },
//   { op: 'replace', path: '/taskCount', value: 5 },
//   { op: 'add', path: '/completed', value: true }
// ]

// Apply patch
const result = jsonpatch.applyPatch(original, patch).newDocument;

// Generate observer for live patches
const observer = jsonpatch.observe(original);
// ... make changes ...
const patches = jsonpatch.generate(observer);
```

---

### 7.2 jsondiffpatch

| Attribute | Value |
|-----------|-------|
| **Format** | Custom (visual diffs) |
| **Bundle Size** | ~15 kB |
| **Features** | Array diffing, text diffing, visual formatters |

**Why Consider:**
- Better array diffing (LCS algorithm)
- Visual formatters (HTML, console)
- Text diffing for strings

**Verdict:** Use if visual diffs needed. fast-json-patch is standard and smaller.

---

## Diff/Patch Summary

| Library | Standard | Size | Arrays | Recommendation |
|---------|----------|------|--------|----------------|
| **fast-json-patch** | RFC 6902 | ~5 kB | Basic | **Primary** |
| jsondiffpatch | Custom | ~15 kB | Advanced | Visual diffs |

---

## 8. Recommended Stack for iDumb

### Core Stack

```typescript
// package.json dependencies
{
  "dependencies": {
    "zod": "^3.24.0",           // Schema validation
    "gray-matter": "^4.0.3",    // Frontmatter parsing
    "graphlib": "^2.1.8",       // Graph algorithms
    "ulid": "^2.3.0",           // ID generation
    "fast-json-patch": "^3.1.1" // Diff/patch
  },
  "devDependencies": {
    "@types/graphlib": "^2.1.12"
  }
}
```

### Schema Definitions

```typescript
// schemas.ts
import { z } from 'zod';

// Core schemas
export const SessionSchema = z.object({
  sessionId: z.string(),
  createdAt: z.string().datetime(),
  lastUpdated: z.string().datetime(),
  phase: z.enum(['init', 'planning', 'execution', 'review', 'completed']),
  governanceLevel: z.enum(['minimal', 'standard', 'high', 'supreme']),
  delegationDepth: z.number().int().min(0).default(0),
  parentSession: z.string().nullable().default(null),
  childSessions: z.array(z.string()).default([]),
  anchors: z.array(z.string()).default([]),
  tasks: z.array(z.string()).default([]),
  metadata: z.record(z.unknown()).default({})
});

export const AnchorSchema = z.object({
  id: z.string(),
  type: z.enum(['checkpoint', 'decision', 'context', 'requirement']),
  priority: z.enum(['critical', 'high', 'medium', 'low']),
  content: z.string(),
  created: z.string().datetime(),
  sessionId: z.string(),
  expiresAt: z.string().datetime().optional(),
  tags: z.array(z.string()).default([])
});

export const TaskSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  type: z.enum(['research', 'implement', 'validate', 'document']),
  status: z.enum(['pending', 'in-progress', 'completed', 'blocked']),
  description: z.string(),
  createdAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
  dependencies: z.array(z.string()).default([]),
  outputs: z.array(z.string()).default([])
});

export const FileRelationshipSchema = z.object({
  id: z.string(),
  sourceId: z.string(),  // session or task
  targetPath: z.string(),
  relationship: z.enum(['creates', 'modifies', 'reads', 'depends-on']),
  timestamp: z.string().datetime()
});

export const ValidationResultSchema = z.object({
  id: z.string(),
  timestamp: z.string().datetime(),
  scope: z.enum(['schema', 'structure', 'drift', 'gsd']),
  status: z.enum(['pass', 'fail', 'warning']),
  checks: z.array(z.object({
    name: z.string(),
    status: z.enum(['pass', 'fail', 'warning']),
    message: z.string()
  })),
  metadata: z.record(z.unknown())
});

// Type inference
export type Session = z.infer<typeof SessionSchema>;
export type Anchor = z.infer<typeof AnchorSchema>;
export type Task = z.infer<typeof TaskSchema>;
export type FileRelationship = z.infer<typeof FileRelationshipSchema>;
export type ValidationResult = z.infer<typeof ValidationResultSchema>;
```

### Metadata Extraction

```typescript
// metadata.ts
import matter from 'gray-matter';
import { z } from 'zod';

interface ParsedDocument<T> {
  data: T;
  content: string;
  original: string;
}

export function parseMetadata<T>(
  content: string,
  schema: z.ZodSchema<T>
): { success: true; result: ParsedDocument<T> } | { success: false; errors: z.ZodError } {
  const parsed = matter(content);
  
  const validation = schema.safeParse(parsed.data);
  
  if (!validation.success) {
    return { success: false, errors: validation.error };
  }
  
  return {
    success: true,
    result: {
      data: validation.data,
      content: parsed.content,
      original: parsed.orig
    }
  };
}

export function stringifyMetadata<T>(
  data: T,
  content: string,
  options?: matter.GrayMatterOption<string, unknown>
): string {
  return matter.stringify(content, data, options);
}
```

### Graph Relationships

```typescript
// relationships.ts
import * as graphlib from 'graphlib';
import type { Session, Task, FileRelationship } from './schemas';

export class RelationshipGraph {
  private graph: graphlib.Graph;
  
  constructor() {
    this.graph = new graphlib.Graph({ directed: true, compound: false, multigraph: false });
  }
  
  addSession(session: Session): void {
    this.graph.setNode(session.sessionId, { type: 'session', data: session });
    
    if (session.parentSession) {
      this.graph.setEdge(session.parentSession, session.sessionId, { type: 'parent' });
    }
  }
  
  addTask(task: Task): void {
    this.graph.setNode(task.id, { type: 'task', data: task });
    this.graph.setEdge(task.sessionId, task.id, { type: 'contains' });
    
    task.dependencies.forEach(depId => {
      this.graph.setEdge(depId, task.id, { type: 'depends-on' });
    });
  }
  
  addFileRelationship(rel: FileRelationship): void {
    this.graph.setEdge(rel.sourceId, rel.targetPath, { type: rel.relationship });
  }
  
  getSessionTree(rootSessionId: string): string[] {
    // BFS traversal
    const visited = new Set<string>();
    const queue = [rootSessionId];
    const result: string[] = [];
    
    while (queue.length > 0) {
      const id = queue.shift()!;
      if (visited.has(id)) continue;
      
      visited.add(id);
      result.push(id);
      
      const children = this.graph.successors(id) || [];
      queue.push(...children);
    }
    
    return result;
  }
  
  getExecutionOrder(): string[] {
    if (!graphlib.alg.isAcyclic(this.graph)) {
      throw new Error('Circular dependency detected');
    }
    return graphlib.alg.topsort(this.graph);
  }
  
  getDependents(nodeId: string): string[] {
    return (this.graph.successors(nodeId) || []) as string[];
  }
  
  getDependencies(nodeId: string): string[] {
    return (this.graph.predecessors(nodeId) || []) as string[];
  }
  
  findPath(from: string, to: string): string[] | null {
    try {
      return graphlib.alg.dijkstra(this.graph, from)[to].path;
    } catch {
      return null;
    }
  }
}
```

---

## 9. Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Schema Validation | **HIGH** | Zod is well-documented, widely used, Context7 verified |
| Metadata Extraction | **HIGH** | gray-matter mature, extensively tested |
| Graph Algorithms | **HIGH** | graphlib proven in dagre/dagre-d3 |
| ID Generation | **HIGH** | ULID standard well-established |
| Diff/Patch | **MEDIUM** | RFC 6902 standard, but iDumb-specific needs TBD |
| Relational Data | **MEDIUM** | File-based approach recommended, but scale limits unknown |

---

## 10. Sources

- **Zod Documentation**: Context7 `/colinhacks/zod` (HIGH confidence)
- **gray-matter**: Context7 `/jonschlinkert/gray-matter` (HIGH confidence)
- **Valibot Comparison**: valibot.dev/guides/comparison/ (HIGH confidence)
- **ULID Specification**: github.com/ulid/spec (HIGH confidence)
- **Drizzle ORM**: orm.drizzle.team/docs (HIGH confidence)
- **graphlib**: github.com/dagrejs/graphlib (MEDIUM confidence)
- **fast-json-patch**: github.com/Starcounter-Jack/JSON-Patch (MEDIUM confidence)

---

*Research completed: 2026-02-02*
*Recommended action: Proceed with Zod + gray-matter + graphlib stack*
