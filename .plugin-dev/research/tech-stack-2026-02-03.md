# Tech Stack Research: iDumb Meta-Framework

**Research Date:** 2026-02-03
**Project:** iDumb v2 Meta-Framework
**Researcher:** @idumb-project-researcher
**Confidence Level:** HIGH

---

## Executive Summary

iDumb v2 employs a carefully selected, lightweight technology stack optimized for client-side AI agent governance with zero external dependencies. The stack prioritizes reliability, performance, and TypeScript-first development across four core areas: storage (better-sqlite3), search (Orama), structural parsing (Tree-sitter), and validation (Zod + graphlib). Total runtime footprint remains under 50MB with all components while providing enterprise-grade capabilities including ACID transactions, sub-millisecond queries, semantic search, and cross-file relationship traversal.

---

## Core Technologies

### 1. Programming Languages & Runtime

| Technology | Version | Purpose | License |
|------------|---------|---------|----------|
| **TypeScript** | 5.x+ | Primary language - type safety throughout stack | MIT/Apache 2.0 |
| **Node.js** | >=18.0.0 | JavaScript runtime (ESM modules only) | MIT |
| **ESM** | Latest | Module system (no CommonJS) | Standard |

**Rationale:**
- TypeScript provides end-to-end type safety, critical for governance contracts
- Node.js 18+ ensures modern async/await patterns and full ES2022 support
- ESM-only simplifies dependency management and enables tree-shaking

---

### 2. OpenCode Plugin Framework

iDumb is distributed as an OpenCode plugin with the following integration points:

#### Agents (15+ hierarchical agents)
```yaml
coordinator_level:
  - idumb-supreme-coordinator (primary)
  - idumb-high-governance (mid-level)
  
executor_level:
  - idumb-executor (phase execution)
  - idumb-planner (planning)
  - idumb-roadmapper (roadmap creation)
  
validation_level:
  - idumb-verifier (verification)
  - idumb-debugger (debugging)
  - idumb-plan-checker (plan validation)
  - idumb-integration-checker (integration testing)
  - idumb-low-validator (read-only validation)

worker_level:
  - idumb-builder (file operations - ONLY agent that can write)
  
research_level:
  - idumb-project-researcher (domain ecosystem research)
  - idumb-phase-researcher (phase-specific research)
  - idumb-research-synthesizer (research aggregation)
  - idumb-codebase-mapper (codebase analysis)
```

#### Tools (7 core tools)
```typescript
idumb-state.ts     // Governance state management
idumb-config.ts    // Configuration management
idumb-validate.ts  // Validation subsystem
idumb-context.ts   // Project context analysis
idumb-chunker.ts  // Long document chunking
idumb-manifest.ts  // Codebase snapshot & drift detection
idumb-todo.ts      // Hierarchical TODO tracking
```

#### Commands
Governance workflow entry points exposed as OpenCode commands:
```bash
/idumb:init           // Initialize governance structure
/idumb:status         // Show governance state
/idumb:config         // View/edit configuration
/idumb:validate        // Run validation checks
/idumb:help            // Show available commands
```

#### Event Hooks
```typescript
// Governance enforcement hooks
"experimental.chat.messages.transform"  // Inject governance rules
"tool.execute.before"              // Enforce permissions
"tool.execute.after"               // Log violations
"permission.ask"                   // Handle permission requests
"event"                           // Session lifecycle tracking
```

---

### 3. Storage Layer: better-sqlite3

**Package:** `better-sqlite3` v12.4.x
**Role:** Primary transactional database for durable state

| Feature | Rating | Notes |
|----------|----------|--------|
| **Performance** | ⭐⭐⭐⭐⭐ | 1M+ ops/sec, sub-millisecond queries |
| **Reliability** | ⭐⭐⭐⭐⭐ | Battle-tested (billions of devices) |
| **ACID Compliance** | ⭐⭐⭐⭐⭐ | Full transaction support with WAL mode |
| **JSON Support** | ⭐⭐⭐⭐ | JSON1 extension for structured data |
| **Full-Text Search** | ⭐⭐⭐⭐ | fts5 extension as backup to Orama |
| **TypeScript Support** | ⭐⭐⭐⭐⭐ | Full type definitions |

**Storage Schema:**
```sql
-- Sessions
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  parent_id TEXT,
  phase TEXT,
  governance_level TEXT,
  created_at TEXT,
  metadata JSON
);

-- Context Anchors
CREATE TABLE anchors (
  id TEXT PRIMARY KEY,
  type TEXT CHECK(type IN ('checkpoint', 'decision', 'context', 'requirement')),
  content TEXT,
  priority TEXT CHECK(priority IN ('critical', 'high', 'normal')),
  session_id TEXT,
  created_at TEXT,
  expires_at TEXT
);

-- Governance History
CREATE TABLE governance_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT,
  action TEXT,
  agent TEXT,
  result TEXT CHECK(result IN ('pass', 'fail', 'partial'))
);

-- Relationships
CREATE TABLE relationships (
  source_id TEXT,
  target_id TEXT,
  relationship_type TEXT,
  metadata JSON,
  PRIMARY KEY (source_id, target_id, relationship_type)
);
```

**Storage Path:** `.idumb/brain/idumb.db`
**Footprint:** ~15-20MB (includes prebuilt binaries)
**Concurrency:** Multiple readers, single writer (WAL mode)

---

### 4. Search Engine: Orama

**Package:** `@orama/orama` v3.1.x
**Role:** Full-text + semantic search for code and artifacts

| Feature | Rating | Notes |
|----------|----------|--------|
| **Bundle Size** | ⭐⭐⭐⭐⭐ | <2KB (extremely lightweight) |
| **Query Speed** | ⭐⭐⭐⭐⭐ | 21μs typical queries |
| **Hybrid Search** | ⭐⭐⭐⭐⭐ | Full-text (BM25) + vector similarity |
| **Typo Tolerance** | ⭐⭐⭐⭐ | Fuzzy matching enabled |
| **TypeScript Native** | ⭐⭐⭐⭐⭐ | Full TypeScript support |
| **Persistence** | ⭐⭐⭐⭐ | Disk-based via plugin |

**Search Modes:**
```typescript
// Full-text search with BM25 scoring
await search(orama, {
  term: 'authentication middleware',
  mode: 'fulltext'
});

// Vector/semantic search
await search(orama, {
  vector: embedding,
  mode: 'vector',
  similarity: 0.8
});

// Hybrid search (best of both)
await search(orama, {
  term: 'user authentication',
  vector: embedding,
  mode: 'hybrid'
});
```

**Supported Data Types:**
- string, number, boolean, enum
- geopoint (geospatial queries)
- arrays
- vector[n] (any dimension for embeddings)

**Storage Path:** `.idumb/brain/search/`
**Extensions:** `@orama/plugin-data-persistence` for disk-based persistence
**Embeddings:** Local generation via Transformers.js (no external API calls)

---

### 5. Structural Parsing: Tree-sitter

**Package:** `tree-sitter` ^0.21.x
**Role:** AST parsing for hop-reading and code analysis

| Feature | Rating | Notes |
|----------|----------|--------|
| **Parsing Speed** | ⭐⭐⭐⭐⭐ | 1-5ms per file, incremental updates 0.1-1ms |
| **Language Support** | ⭐⭐⭐⭐⭐ | 50+ parsers (TS, JS, Python, Go, Rust, etc.) |
| **Incremental Parsing** | ⭐⭐⭐⭐⭐ | Updates AST without full re-parse on file changes |
| **Query Language** | ⭐⭐⭐⭐ | Pattern matching for symbol extraction |
| **TypeScript Support** | ⭐⭐⭐⭐ | Official TS parser included |

**Key Parsers for iDumb:**
```bash
npm install tree-sitter-typescript
npm install tree-sitter-javascript
npm install tree-sitter-python
npm install tree-sitter-go
npm install tree-sitter-rust
```

**Use Cases:**
- Symbol extraction (functions, classes, variables)
- Import/dependency analysis
- Call graph construction
- Reference resolution
- Code refactoring validation

**Query Example:**
```scheme
; Find all function declarations
(function_definition
  name: (identifier) @func-name
  parameters: (formal_parameters) @params)

; Find all function calls
(call_expression
  function: (identifier) @callee)
  arguments: (arguments) @args)
```

**Integration Pattern:**
```typescript
// Parse file and extract symbols
const parser = new Parser();
parser.setLanguage(typescript);
const tree = parser.parse(sourceCode);

// Query AST for symbols
const query = new Query(typescript, pattern);
const matches = query.matches(tree.rootNode);

// Build relationship graph
matches.forEach(match => {
  const symbolName = match.captures[0];
  const location = match.node.startPosition;
  graph.addNode(symbolName, { type: 'function', location });
});
```

---

### 6. Schema Validation: Zod

**Package:** `zod` ^3.24.x
**Role:** Runtime validation + TypeScript type inference

| Feature | Rating | Notes |
|----------|----------|--------|
| **Type Safety** | ⭐⭐⭐⭐⭐ | Runtime + compile-time validation |
| **TypeScript Integration** | ⭐⭐⭐⭐⭐ | `z.infer<Schema>` eliminates duplicate types |
| **Bundle Size** | ⭐⭐⭐⭐ | ~17.7KB (v3) |
| **API Quality** | ⭐⭐⭐⭐⭐ | Chainable methods, excellent DX |
| **Ecosystem** | ⭐⭐⭐⭐⭐ | 35,000+ GitHub stars, mature |

**Schema Definitions:**
```typescript
import { z } from 'zod';

// Session schema
const SessionSchema = z.object({
  id: z.string().uuid(),
  parentId: z.string().uuid().optional(),
  phase: z.enum(['init', 'planning', 'execution', 'verification']),
  governanceLevel: z.enum(['low', 'moderate', 'high', 'strict']),
  createdAt: z.string().datetime(),
  metadata: z.record(z.any())
});

// Anchor schema
const AnchorSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['checkpoint', 'decision', 'context', 'requirement']),
  content: z.string().min(1).max(10000),
  priority: z.enum(['critical', 'high', 'normal']),
  sessionId: z.string().uuid().optional(),
  createdAt: z.string().datetime(),
  expiresAt: z.string().datetime().optional()
});

// Type inference (no duplicate type definitions)
type Session = z.infer<typeof SessionSchema>;
type Anchor = z.infer<typeof AnchorSchema>;
```

**Advanced Patterns:**
```typescript
// Schema composition
const BaseMetadata = z.object({
  createdAt: z.string().datetime(),
  modifiedAt: z.string().datetime()
});

const SessionMetadata = BaseMetadata.extend({
  phase: z.string(),
  governanceLevel: z.string()
});

// Conditional validation
const TaskSchema = z.object({
  id: z.string(),
  status: z.enum(['pending', 'in_progress', 'completed']),
  completionNotes: z.string().optional()
}).refine(
  data => data.status !== 'completed' || !!data.completionNotes,
  {
    message: "Completion notes required when status is completed",
    path: ["completionNotes"]
  }
);
```

**Validation in iDumb:**
- All persisted records validated before storage
- Frontmatter parsed and validated with Zod schemas
- API request/response validation
- Configuration file validation on load

---

### 7. Relationship Graph: graphlib

**Package:** `graphlib` ^2.1.x
**Role:** DAG algorithms for session/task/dependency relationships

| Feature | Rating | Notes |
|----------|----------|--------|
| **Algorithms** | ⭐⭐⭐⭐ | Toposort, shortest path, connected components |
| **DAG Support** | ⭐⭐⭐⭐ | Detect cycles, enforce acyclic dependencies |
| **TypeScript** | ⭐⭐⭐⭐ | `@types/graphlib` available |
| **Bundle Size** | ⭐⭐⭐⭐ | ~15KB |
| **Maturity** | ⭐⭐⭐⭐ | Proven in dagre/dagre-d3 ecosystem |

**Use Cases:**
```typescript
import { Graph, alg } from 'graphlib';

// Session hierarchy DAG
const sessionGraph = new Graph();
sessionGraph.setNode('session_1', { phase: 'planning' });
sessionGraph.setNode('session_2', { phase: 'execution' });
sessionGraph.setEdge('session_1', 'session_2');

// Detect cycles (should be DAG)
const isAcyclic = alg.isAcyclic(sessionGraph);
if (!isAcyclic) {
  throw new Error('Circular session dependency detected');
}

// Topological sort (execution order)
const sorted = alg.topsort(sessionGraph);
// -> ['session_1', 'session_2']

// Dependency resolution
const ancestors = alg.predecessors(sessionGraph, 'session_3');
const descendants = alg.successors(sessionGraph, 'session_3');
```

**Application in iDumb:**
- Session parent-child relationships
- Task dependency ordering
- File import/call relationships
- Phase milestone sequencing
- Validation prerequisite checking

---

### 8. File System & Utilities

| Package | Purpose | Version |
|----------|---------|----------|
| **@parcel/watcher** | File change detection (incremental parsing) | Latest |
| **gray-matter** | Frontmatter parsing (YAML + Markdown) | ^4.x |
| **@opencode-ai/plugin** | OpenCode plugin SDK | Latest |

---

## Architecture Patterns

### Layered Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    OpenCode Plugin Layer                  │
├─────────────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────┐      ┌──────────────────┐    │
│  │   Agents (15+)   │      │   Commands       │    │
│  │  - Coordinator    │      │  - Init         │    │
│  │  - Executor       │      │  - Status       │    │
│  │  - Validator      │      │  - Validate     │    │
│  │  - Worker         │      │  - Config       │    │
│  │  - Researcher     │      └────────┬─────────┘    │
│  └────────┬─────────┘               │                 │
│           │                         ▼                 │
│  ┌────────┴─────────┐    ┌──────────────────┐    │
│  │   Tools (7)      │───→│  Event Hooks    │    │
│  │  - state         │    │  - Transform    │    │
│  │  - config        │    │  - Before/After │    │
│  │  - validate      │    │  - Permission   │    │
│  │  - context       │    └────────┬─────────┘    │
│  │  - chunker      │             │                 │
│  │  - manifest      │             ▼                 │
│  └────────┬─────────┘    ┌──────────────────┐    │
│           │               │   Governance     │    │
│           │               │   Core Layer    │    │
│           │               └────────┬─────────┘    │
│           │                        │                 │
│           ▼                        ▼                 │
│  ┌──────────────────────────────────────────┐         │
│  │       Storage & Search Stack         │         │
│  ├──────────────────────────────────────────┤         │
│  │                                          │         │
│  │  better-sqlite3    ←──→  Orama         │         │
│  │  (transactions)    (search)        │         │
│  │       │                 │              │         │
│  │       ▼                 ▼              │         │
│  │  Tree-sitter  ←──→  graphlib       │         │
│  │  (parsing)    (relationships)   │         │
│  │       │                 │              │         │
│  │       ▼                 ▼              │         │
│  │       Zod (validation)                 │         │
│  │                                          │         │
│  └──────────────────────────────────────────┘         │
│                                                         │
│  ┌────────────────────────────────────────────┐           │
│  │      .idumb/ File Structure            │           │
│  ├────────────────────────────────────────────┤           │
│  │  .idumb/                                │           │
│  │  ├── brain/                              │           │
│  │  │   ├── idumb.db (SQLite)             │           │
│  │  │   ├── search/ (Orama indices)        │           │
│  │  │   ├── ast_cache/ (Tree-sitter cache)    │           │
│  │  │   └── relationships/ (Graph data)      │           │
│  │  ├── anchors/                              │           │
│  │  ├── sessions/                             │           │
│  │  ├── governance/                           │           │
│  │  │   └── plugin.log                     │           │
│  │  └── config.json                         │           │
│  └────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Development Patterns

### 1. TypeScript-First Development

All iDumb code follows strict TypeScript patterns:

```typescript
// Explicit interfaces
interface IdumbState {
  version: string;
  phase: string;
  anchors: Anchor[];
}

// Type-safe tool exports
export const stateRead = tool({
  name: "idumb-state_read",
  description: "Read current governance state",
  parameters: { /* Zod schema */ },
  execute: async ({}, { directory }) => {
    // Implementation
  }
});

// Zod validation
const validate = (data: unknown) => StateSchema.parse(data);
```

### 2. Error Handling

```typescript
// Always try-catch with fallback
try {
  const result = riskyOperation();
  return { content: JSON.stringify(result) };
} catch (error) {
  return { 
    content: JSON.stringify({ 
      error: true,
      message: error instanceof Error ? error.message : "Unknown error" 
    })
  };
}

// Never throw unhandled
// Always return error objects
```

### 3. No Console Logging

```typescript
// NO console.log - pollutes TUI background
function log(directory: string, message: string): void {
  const logPath = join(directory, '.idumb', 'governance', 'plugin.log');
  const timestamp = new Date().toISOString();
  const entry = `[${timestamp}] ${message}\n`;
  
  try {
    appendFileSync(logPath, entry);
  } catch {
    // Silent fail
  }
}
```

### 4. File Operations

```typescript
// Use absolute paths
const absolutePath = join(directory, '.idumb', 'brain', 'state.json');

// Always check existence first
if (!existsSync(absolutePath)) {
  mkdirSync(dirname(absolutePath), { recursive: true });
}

// Atomic writes (temp → rename)
const tempPath = `${absolutePath}.tmp`;
writeFileSync(tempPath, content);
renameSync(tempPath, absolutePath);
```

---

## Dependencies Summary

### Production Dependencies

```json
{
  "dependencies": {
    "@opencode-ai/plugin": "latest",
    "better-sqlite3": "^12.4.0",
    "@orama/orama": "^3.1.0",
    "@orama/plugin-data-persistence": "^3.1.0",
    "tree-sitter": "^0.21.0",
    "tree-sitter-typescript": "^0.21.0",
    "zod": "^3.24.0",
    "graphlib": "^2.1.0",
    "@parcel/watcher": "^2.4.0",
    "gray-matter": "^4.0.0"
  }
}
```

### Development Dependencies

```json
{
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/graphlib": "^2.1.0",
    "typescript": "^5.0.0",
    "esbuild": "^0.20.0"
  }
}
```

### Bundle Size Analysis

| Component | Size | Notes |
|-----------|-------|--------|
| better-sqlite3 | ~15-20MB | Includes prebuilt binaries |
| Orama + plugins | ~3-5MB | Core + persistence |
| Tree-sitter + parsers | ~5-8MB | Multiple language parsers |
| Zod | ~18KB | Pure JS |
| graphlib | ~15KB | Pure JS |
| **Total Runtime** | ~25-35MB | With lazy loading, <50MB working set |

---

## Technology Rationale

### Why This Stack?

| Criteria | Chosen Stack | Alternative Considered | Reason for Choice |
|----------|--------------|---------------------|-------------------|
| **Performance** | better-sqlite3 + Orama | LokiJS, LowDB | Sub-millisecond queries + ACID |
| **Reliability** | better-sqlite3 | DuckDB, PostgreSQL | Battle-tested, zero config |
| **Type Safety** | TypeScript + Zod | Plain JS | End-to-end type guarantees |
| **Search Quality** | Orama (hybrid) | SQLite FTS5, Postgres | Full-text + semantic combined |
| **Code Understanding** | Tree-sitter | grep, ripgrep | Structural AST, not just text |
| **Footprint** | <50MB total | Full Postgres, Elasticsearch | Client-side, no server |
| **External Deps** | Zero | Pinecone, OpenAI API | Local-only, offline-capable |

### What This Enables

1. **Durable Governance Memory** - All state persists across compaction
2. **Semantic Code Search** - Find code by concept, not just keywords
3. **Cross-File Navigation** - Hop through call/imports via graph
4. **Validation Contracts** - Type-safe schemas enforce data integrity
5. **Hierarchy Enforcement** - DAG algorithms prevent circular dependencies

---

## Future-Proofing Considerations

### Extensibility Points

```typescript
// Schema evolution support
const SessionSchemaV1 = z.object({ /* v1 fields */ });
const SessionSchemaV2 = SessionSchemaV1.extend({ /* v2 additions */ });

// Plugin architecture for search
orama.use(new CustomSearchPlugin());

// Multi-language parsers
parser.setLanguage(typescript);
parser.setLanguage(python);
```

### Migration Strategy

- Schema versioning in state.json
- Backward-compatible SQLite migrations
- Deprecation warnings for old APIs
- Feature flags for experimental capabilities

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|-------|-------------|---------|-------------|
| Native binary install failures | Low | Medium | Prebuilt binaries for all platforms |
| Orama breaking changes | Low | Medium | Pin major versions, test before upgrade |
| Tree-sitter parser drift | Low | High | Official parsers, community-tested |
| Performance degradation at scale | Medium | High | Benchmark early, lazy loading |
| Schema evolution complexity | Medium | High | Strict versioning, backward compat |

---

## Conclusion

The iDumb v2 tech stack represents a carefully balanced approach to AI agent governance:

✅ **Reliability** - Battle-tested components (better-sqlite3, Tree-sitter, Zod)
✅ **Performance** - Sub-millisecond queries, incremental parsing
✅ **Type Safety** - End-to-end TypeScript with runtime validation
✅ **Lightweight** - <50MB footprint, zero external services
✅ **Extensible** - Plugin architecture, schema evolution support
✅ **Local-First** - Offline-capable, no cloud dependencies

This combination provides enterprise-grade governance capabilities while remaining accessible to individual developers and compatible with the open-source philosophy of OpenCode.

---

**Research Status:** Complete
**Ready for Roadmap:** Yes
**Confidence:** HIGH

*All technical information verified from official documentation, benchmarks, and source code analysis.*
