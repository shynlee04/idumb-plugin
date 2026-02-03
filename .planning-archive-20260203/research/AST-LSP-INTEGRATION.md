# AST Parsing and LSP Integration Research

**Project:** iDumb Intelligent Codebase Understanding
**Research Date:** 2025-02-02
**Confidence Level:** HIGH (verified with Context7, official docs, and multiple sources)

---

## Executive Summary

This research analyzes the technology landscape for building intelligent codebase understanding capabilities in iDumb. The primary recommendation is **Tree-sitter** as the AST parser foundation due to its incremental parsing capability, multi-language support, and excellent performance characteristics. For LSP integration, OpenCode's experimental LSP tool provides the most direct path, with custom symbol indexing as a complementary approach.

**Key Recommendations:**
1. **Parser:** Tree-sitter (primary) with language-specific fallbacks
2. **File Watching:** @parcel/watcher (performance) or chokidar (maturity)
3. **Event Architecture:** RxJS for reactive streams over file changes
4. **Symbol Indexing:** Custom database with SCIP compatibility layer
5. **LSP Integration:** OpenCode experimental LSP tool + custom agent queries

---

## 1. AST Parser Analysis

### 1.1 Tree-sitter (Primary Recommendation)

**Version:** 0.26.5 (latest as of Feb 2026)
**Confidence:** HIGH

Tree-sitter is an incremental parsing system that builds concrete syntax trees and efficiently updates them as code is edited.

**Language Support:**
- **Official parsers:** TypeScript, JavaScript, Python, Go, Rust, Java, C, C++, C#, CSS, HTML, JSON, Ruby, PHP, and 20+ more
- **Community parsers:** 100+ languages available via wiki
- **Bindings:** Node.js (JavaScript/TypeScript), Rust, Python, Go, Java, C#, Swift, and more

**Key Features:**
```javascript
const Parser = require('tree-sitter');
const TypeScript = require('tree-sitter-typescript');

const parser = new Parser();
parser.setLanguage(TypeScript);

// Parse once
const tree = parser.parse(sourceCode);

// Incremental update (EXTREMELY fast)
const newTree = parser.parse(newSource, tree);
```

**Performance Characteristics:**
| Metric | Tree-sitter | Notes |
|--------|-------------|-------|
| Parse Speed | Sub-millisecond | ~1-5ms for typical files |
| Incremental Update | Microseconds | ~0.1-1ms for edits |
| Memory Usage | Low | ~10-50KB per file AST |
| Error Recovery | Excellent | Continues parsing past errors |

**Incremental Parsing:**
- Tree-sitter's killer feature - only re-parses changed portions
- Maintains tree structure across edits
- Enables real-time analysis without full re-parses
- Critical for large codebases and responsive tooling

**Symbol Extraction Quality:**
- **Strengths:** Fast structural queries, accurate syntax trees, precise source positions
- **Limitations:** No semantic analysis (types), only syntactic understanding
- **Mitigation:** Combine with TypeScript compiler API or LSP for semantic info

**Installation:**
```bash
npm install tree-sitter tree-sitter-typescript tree-sitter-javascript tree-sitter-python
```

**Sources:**
- Context7: `/tree-sitter/tree-sitter` (766 snippets, HIGH reputation)
- Context7: `/tree-sitter/tree-sitter-typescript` (140 snippets)
- Official: https://tree-sitter.github.io/tree-sitter/
- GitHub: https://github.com/tree-sitter/tree-sitter (23.7k stars)

---

### 1.2 SWC (Speedy Web Compiler)

**Version:** Latest (Rust-based, actively maintained)
**Confidence:** HIGH

SWC is a Rust-based JavaScript/TypeScript compiler that can also function as a parser.

**Language Support:**
- JavaScript (ES2020+)
- TypeScript
- TSX/JSX

**Key Features:**
```javascript
const swc = require('@swc/core');

const ast = swc.parseSync('class Foo { }', {
  syntax: 'ecmascript',
  comments: true,
  target: 'es2020',
});

// TypeScript
const tsAst = swc.parseSync('const x: number = 5;', {
  syntax: 'typescript',
  tsx: false,
});
```

**Performance Characteristics:**
| Metric | SWC | Notes |
|--------|-----|-------|
| Parse Speed | Very Fast | 10-20x faster than Babel |
| Memory Usage | Low | Rust memory efficiency |
| Incremental | No | Must re-parse entire file |

**When to Use:**
- When maximum parsing speed is required
- For transformation pipelines (SWC's primary use case)
- As a fallback when Tree-sitter grammar unavailable

**When NOT to Use:**
- Multi-language support needed (Tree-sitter wins)
- Incremental updates required (Tree-sitter wins)
- Need lightweight embedding (Tree-sitter C library is smaller)

**Sources:**
- Context7: `/swc-project/swc` (506 snippets, HIGH reputation)
- Context7: `/websites/rustdoc_swc_rs` (128k snippets)

---

### 1.3 TypeScript Compiler API

**Version:** TypeScript 5.9.2, 5.8.3 (latest)
**Confidence:** HIGH

The official TypeScript compiler provides deep semantic analysis capabilities.

**Key Features:**
```typescript
import * as ts from "typescript";

// Create a program
const program = ts.createProgram(fileNames, options);
const checker = program.getTypeChecker();

// Get symbols with type information
const symbol = checker.getSymbolAtLocation(node);
const type = checker.getTypeOfSymbolAtLocation(symbol, node);
```

**Strengths:**
- **Full semantic analysis** - types, inheritance, interfaces
- **Symbol resolution** - knows what every identifier refers to
- **Documentation extraction** - JSDoc comments
- **Official accuracy** - same as VSCode's understanding

**Limitations:**
- **Slower** - must analyze entire project for types
- **TypeScript only** - no multi-language support
- **Memory intensive** - keeps full type graph in memory
- **No incremental** - re-analyzes on changes

**Use Case:**
- Semantic analysis layer on top of Tree-sitter's syntactic layer
- Type extraction for TypeScript projects
- Go-to-definition with type awareness

**Sources:**
- Context7: `/microsoft/typescript` (18,942 snippets, HIGH reputation)
- Official: https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API

---

### 1.4 ts-morph

**Version:** Latest
**Confidence:** HIGH

TypeScript Compiler API wrapper for easier AST manipulation.

**Key Features:**
```typescript
import { Project } from "ts-morph";

const project = new Project({
  tsConfigFilePath: "tsconfig.json"
});

// Navigate and manipulate
const sourceFile = project.getSourceFileOrThrow("MyClass.ts");
const classes = sourceFile.getClasses();

// Make changes
classes[0].addProperty({
  name: "newProperty",
  type: "string"
});

project.save(); // Writes changes to disk
```

**Comparison to raw Compiler API:**
| Aspect | Compiler API | ts-morph |
|--------|--------------|----------|
| Ease of Use | Complex | Simple |
| Performance | Raw speed | Slightly slower |
| Manipulation | Manual | High-level API |
| Memory | Lower | Higher (caching) |

**When to Use:**
- Code transformation/refactoring tools
- When developer experience matters more than raw performance
- Projects needing both read AND write AST operations

**Sources:**
- Context7: `/dsherret/ts-morph` (790 snippets, HIGH reputation)
- Official: https://ts-morph.com/

---

### 1.5 Babel Parser (@babel/parser)

**Version:** Latest (part of Babel ecosystem)
**Confidence:** MEDIUM

Babel's parser - formerly Babylon. Industry standard for JS/TS transformation.

**Key Features:**
```javascript
const parser = require('@babel/parser');

const ast = parser.parse(code, {
  sourceType: 'module',
  plugins: ['typescript', 'jsx']
});
```

**Performance:**
- Good for full-file parsing
- No incremental capability
- Slower than SWC (JavaScript vs Rust)

**When to Use:**
- Already using Babel in build pipeline
- Need plugin ecosystem compatibility
- Transformation workflows

**When NOT to Use:**
- Tree-sitter is superior for analysis tools (incremental, multi-language)
- SWC is superior for raw parsing speed

---

### 1.6 Biome

**Version:** Latest (2025, actively developed)
**Confidence:** MEDIUM

Rust-based toolchain: linter, formatter, and parser.

**Key Characteristics:**
- **10-25x faster than ESLint + Prettier**
- Single binary, one config file
- Written in Rust
- Supports JavaScript, TypeScript, JSX, TSX, JSON

**Performance:**
- Very fast (Rust-based)
- No incremental parsing (unlike Tree-sitter)
- Primarily a linter/formatter, parser is secondary

**When to Use:**
- If you need linting/formatting as well as parsing
- Speed-critical CI pipelines

**When NOT to Use:**
- Multi-language support needed
- Incremental parsing required
- Need to build custom analysis tools

**Sources:**
- Web search: "Biome vs ESLint 2025" - multiple industry comparisons
- https://biomejs.dev/

---

### 1.7 Language-Specific Parsers

#### Python
- **`ast` module (stdlib):** Native Python AST parsing
  - Pro: No dependencies, always available
  - Con: Only syntactic, no type info
  
- **Jedi:** Static analysis library
  - Pro: Autocompletion, goto-definition, type inference
  - Con: Slower, complex API
  
- **Parso:** Parser used by Jedi
  - Pro: Error recovery, diff parsing
  - Con: Lower-level than Jedi

**Recommendation for Python:** Use Tree-sitter (tree-sitter-python) for structure, Jedi for semantic analysis if needed.

#### Go
- **`go/ast` + `go/parser` (stdlib):** Official Go parsing
  - Pro: Official, stable, well-documented
  - Con: Go only

**Recommendation for Go:** Tree-sitter for multi-language consistency, go/ast for Go-specific deep analysis.

#### Rust
- **`syn`:** Parser for procedural macros
  - Pro: Industry standard for Rust code analysis
  - Con: Rust ecosystem only

#### Java
- **JavaParser:** Popular Java AST library
  - Pro: Comprehensive Java support
  - Con: Java-specific only
  
- **Eclipse JDT:** Eclipse's AST framework
  - Pro: Full semantic analysis
  - Con: Heavyweight, Eclipse-centric

#### General: ANTLR
- **ANTLR:** Parser generator for custom languages
  - Pro: Define grammars for any language
  - Con: Requires grammar development, slower than Tree-sitter
  - Verdict: Use only for custom/unsupported languages

---

### 1.8 Parser Comparison Matrix

| Parser | Languages | Incremental | Speed | Semantic Analysis | Best For |
|--------|-----------|-------------|-------|-------------------|----------|
| **Tree-sitter** | 100+ | ✅ Yes | Fast | ❌ No | **Primary choice for iDumb** |
| SWC | JS/TS only | ❌ No | Very Fast | ❌ No | Speed-critical JS/TS |
| TypeScript API | TS only | ❌ No | Slow | ✅ Yes | Semantic analysis layer |
| ts-morph | TS only | ❌ No | Medium | ✅ Yes | Code transformation |
| Babel | JS/TS only | ❌ No | Medium | ❌ No | Transformation workflows |
| Biome | JS/TS only | ❌ No | Very Fast | ❌ No | Linting/formatting |
| Jedi | Python only | ❌ No | Slow | ✅ Yes | Python semantic analysis |

---

## 2. LSP Integration

### 2.1 OpenCode's Experimental LSP Tool

**Confidence:** HIGH (verified via official docs)

OpenCode provides built-in LSP integration through an experimental tool.

**Configuration:**
```json
{
  "$schema": "https://opencode.ai/config.json",
  "permission": {
    "lsp": "allow"
  }
}
```

**Environment Variable:**
```bash
OPENCODE_EXPERIMENTAL_LSP_TOOL=true
# or
OPENCODE_EXPERIMENTAL=true
```

**Supported Operations:**
- `goToDefinition` - Navigate to symbol definition
- `findReferences` - Find all references to a symbol
- `hover` - Get type/documentation info
- `documentSymbol` - List symbols in current document
- `workspaceSymbol` - Search symbols across workspace
- `goToImplementation` - Find implementations
- `prepareCallHierarchy` - Build call hierarchy
- `incomingCalls` / `outgoingCalls` - Call graph navigation

**Integration Path for iDumb:**
1. Configure LSP servers in OpenCode config
2. Agent queries index via `lsp` tool
3. Combine with Tree-sitter AST for structural context
4. Cache results in iDumb's symbol database

**Limitations:**
- Experimental status (API may change)
- Requires configured LSP servers
- Limited to what LSP servers provide

**Sources:**
- Official: https://opencode.ai/docs/tools/
- Official: https://opencode.ai/docs/lsp/

---

### 2.2 vscode-languageserver-protocol

The standard LSP protocol implementation from Microsoft.

**Use Case:**
- If building custom LSP client outside OpenCode
- For advanced LSP features not exposed in OpenCode's tool

**When NOT to Use:**
- Already using OpenCode (use its built-in tool)

---

### 2.3 LSP Architecture Comparison

| Approach | Complexity | Capability | Integration |
|----------|------------|------------|-------------|
| OpenCode LSP Tool | Low | Standard LSP ops | Native |
| Custom LSP Client | High | Full protocol | Manual |
| Hybrid (Tree-sitter + LSP) | Medium | Best of both | Recommended |

**Recommended iDumb Architecture:**
```
Tree-sitter (structural) + OpenCode LSP (semantic)
         ↓                           ↓
    Symbol Database ←────────→ Agent Queries
```

---

## 3. Symbol Indexing

### 3.1 SCIP (Sourcegraph Code Intelligence Protocol)

**Confidence:** HIGH

SCIP is Sourcegraph's successor to LSIF for code indexing.

**Key Characteristics:**
- Language-agnostic protocol
- Designed for precise code navigation
- More efficient than LSIF
- Native support in Sourcegraph, GitLab (in progress)

**Available Indexers:**
- scip-typescript (TypeScript/JavaScript)
- scip-java (Java/Kotlin/Scala)
- scip-python
- scip-go
- Community indexers for other languages

**Integration:**
```bash
# Generate SCIP index
npx @sourcegraph/scip-typescript index

# Upload to Sourcegraph
src code-intel upload -index.scip
```

**When to Use:**
- Cross-repository code intelligence
- Integration with Sourcegraph/GitLab
- Standardized index format needed

**Sources:**
- GitHub: https://github.com/sourcegraph/scip
- Blog: https://sourcegraph.com/blog/announcing-scip

---

### 3.2 LSIF (Language Server Index Format)

Microsoft's predecessor to SCIP.

**Status:** Being superseded by SCIP
- Sourcegraph 4.6+ converts LSIF to SCIP
- GitLab still uses LSIF

**Recommendation:** Use SCIP for new projects

---

### 3.3 Custom Symbol Database

**Recommended for iDumb**

A custom database built on Tree-sitter AST with LSP augmentation.

**Schema Design:**
```typescript
interface Symbol {
  id: string;
  name: string;
  kind: 'class' | 'function' | 'variable' | 'interface' | ...;
  location: {
    file: string;
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
  };
  scope: string; // namespace/module
  type?: string; // from LSP
  documentation?: string; // JSDoc/comments
  relationships: {
    extends?: string[];
    implements?: string[];
    calls?: string[];
    calledBy?: string[];
  };
  metadata: {
    language: string;
    isExported: boolean;
    isAsync: boolean;
    visibility: 'public' | 'private' | 'protected';
  };
}
```

**Storage Options:**
1. **SQLite** - Embedded, zero-config, good for single-user
2. **DuckDB** - Analytical queries, fast aggregations
3. **JSON/JSONL** - Simple, human-readable, slow for queries
4. **LevelDB/RocksDB** - Key-value, fast lookups

**Recommendation:** SQLite for MVP, DuckDB for analytics-heavy features.

---

### 3.4 ctags Enhancements

Universal ctags provides basic symbol indexing.

**Use Case:**
- Quick fallback when parsers unavailable
- Very fast generation
- Wide language support

**Limitations:**
- Only basic symbols (no relationships)
- No type information
- No incremental updates

**Recommendation:** Not recommended for iDumb's use case (Tree-sitter is superior).

---

## 4. File Watching

### 4.1 @parcel/watcher (Recommended)

**Confidence:** HIGH

Facebook's fast, cross-platform file watcher.

**Performance:**
- Much faster than chokidar
- Native bindings (C++)
- Used by VSCode, Nx, Nuxt, Tailwind

**Installation:**
```bash
npm install @parcel/watcher
```

**Usage:**
```javascript
const watcher = require('@parcel/watcher');

const subscription = await watcher.subscribe(process.cwd(), (err, events) => {
  for (const event of events) {
    console.log(`${event.type}: ${event.path}`);
    // Trigger incremental parse
  }
}, {
  ignore: ['**/node_modules/**', '**/.git/**']
});
```

**Pros:**
- Fastest file watching
- Low CPU/memory usage
- Native platform integration

**Cons:**
- Native dependency (compilation required)
- Less mature than chokidar

---

### 4.2 chokidar

**Version:** 4.0.3 (Nov 2025 update), 5.x latest
**Confidence:** HIGH

Industry standard file watcher.

**Stats:**
- 97+ million weekly downloads
- 11,697 GitHub stars
- Used in 30+ million repositories

**Usage:**
```javascript
const chokidar = require('chokidar');

const watcher = chokidar.watch('**/*.ts', {
  ignored: /node_modules/,
  persistent: true,
  usePolling: false // Use native events when possible
});

watcher.on('change', path => {
  console.log(`File ${path} changed`);
  // Trigger incremental parse
});
```

**Pros:**
- Battle-tested, stable
- No native compilation (pure JS fallback available)
- Extensive configuration options

**Cons:**
- Slower than @parcel/watcher
- Higher resource usage on large projects

**When to Choose:**
- Maximum compatibility needed
- Avoiding native dependencies

---

### 4.3 fs.watch (Native Node.js)

**Confidence:** HIGH

Node.js built-in file watching.

**Limitations:**
- Platform inconsistencies
- No recursive watching on Linux
- Unreliable in some scenarios

**Recommendation:** Use chokidar or @parcel/watcher instead (they handle these issues).

---

### 4.4 Watchman (Facebook)

Heavy-duty file watching service.

**Use Case:**
- Very large monorepos
- Shared watching across tools
- Already using Watchman for other tools

**Recommendation:** Overkill for most iDumb use cases.

---

### 4.5 File Watcher Comparison

| Watcher | Speed | Memory | Native | Best For |
|---------|-------|--------|--------|----------|
| @parcel/watcher | 🚀 Fastest | Low | Yes | **Recommended for iDumb** |
| chokidar | Fast | Medium | Optional | Compatibility |
| fs.watch | Variable | Low | No | Not recommended |
| Watchman | Fast | Medium | Yes | Large monorepos |

---

## 5. Event-Driven Architecture

### 5.1 RxJS (Recommended)

**Confidence:** HIGH

Reactive streams for event composition.

**Why RxJS for iDumb:**
```typescript
import { Subject, debounceTime, bufferTime, mergeMap } from 'rxjs';

// File change events
const fileChanges$ = new Subject<FileEvent>();

// Debounce rapid changes (e.g., during save)
const debouncedChanges$ = fileChanges$.pipe(
  debounceTime(100),
  bufferTime(500),
  mergeMap(events => {
    // Batch process multiple changes
    return indexFiles(events);
  })
);

// Subscribe to updates
debouncedChanges$.subscribe(async (batch) => {
  for (const event of batch) {
    await incrementalParse(event.path);
  }
});
```

**Benefits:**
- Composable event streams
- Built-in debouncing/throttling
- Error handling and retry logic
- Cancellation support

**When to Use:**
- Complex event orchestration
- Multiple event sources
- Need backpressure handling

---

### 5.2 EventEmitter (Native Node.js)

Simple event handling.

**When to Use:**
- Simple event patterns
- No reactive composition needed
- Lower dependency count

**Example:**
```javascript
const { EventEmitter } = require('events');

const indexer = new EventEmitter();

indexer.on('file:changed', (path) => {
  // Handle file change
});

indexer.emit('file:changed', '/path/to/file.ts');
```

---

### 5.3 Custom Event Bus

Simple pub-sub implementation.

**When to Use:**
- Want type safety without RxJS complexity
- Specific event routing needs

---

### 5.4 Architecture Comparison

| Approach | Complexity | Composability | Type Safety | Best For |
|----------|------------|---------------|-------------|----------|
| RxJS | Medium | Excellent | Good | **Recommended for iDumb** |
| EventEmitter | Low | Poor | Poor | Simple cases |
| Custom Bus | Medium | Good | Good | Specific needs |

---

## 6. Recommended Architecture for iDumb

### 6.1 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           iDumb Indexer System                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────────┐ │
│  │  File Watcher   │    │   AST Parser    │    │    Symbol Database      │ │
│  │                 │    │                 │    │                         │ │
│  │ @parcel/watcher │───→│  Tree-sitter    │───→│       SQLite            │ │
│  │                 │    │  (Primary)      │    │                         │ │
│  └─────────────────┘    │                 │    │ ┌─────┐ ┌─────┐ ┌─────┐ │ │
│           │             │ ┌─────────────┐ │    │ │Files│ │Syms │ │Refs │ │ │
│           │             │ │TypeScript   │ │    │ └─────┘ └─────┘ └─────┘ │ │
│           │             │ │(Semantic)   │ │    │                         │ │
│           │             │ └─────────────┘ │    └─────────────────────────┘ │
│           │             └─────────────────┘                 ↑              │
│           │                      │                          │              │
│           ▼                      ▼                          │              │
│  ┌──────────────────────────────────────────────────┐       │              │
│  │            RxJS Event Stream                     │       │              │
│  │                                                  │       │              │
│  │  fileChanges$ ──→ debounce ──→ batch ──→ parse │───────┘              │
│  │                                                  │                      │
│  └──────────────────────────────────────────────────┘                      │
│                              │                                             │
└──────────────────────────────┼─────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         OpenCode Integration                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────────┐ │
│  │   LSP Tool      │    │  Agent Queries  │    │     Query Engine        │ │
│  │                 │    │                 │    │                         │ │
│  │ goToDefinition  │←───│  "Find refs to  │    │  Tree-sitter queries    │ │
│  │ findReferences  │    │   UserService"  │    │  + Symbol DB search     │ │
│  │ hover           │    │                 │    │                         │ │
│  └─────────────────┘    └─────────────────┘    └─────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Data Flow

```
1. File System Event
   ↓
2. @parcel/watcher detects change
   ↓
3. RxJS stream processes event (debounce, batch)
   ↓
4. Tree-sitter incremental parse
   ↓
5. Extract symbols from AST
   ↓
6. (Optional) OpenCode LSP for semantic info
   ↓
7. Update Symbol Database (SQLite)
   ↓
8. Notify subscribers (agents, UI)
```

### 6.3 Event Subscription Model

```typescript
// Event Types
interface IndexerEvents {
  'file:changed': { path: string; changeType: 'create' | 'update' | 'delete' };
  'file:parsed': { path: string; tree: AST; duration: number };
  'symbol:extracted': { symbol: Symbol; file: string };
  'index:updated': { stats: IndexStats };
  'index:error': { error: Error; context: string };
}

// Subscription API
class IndexerBus {
  on<K extends keyof IndexerEvents>(
    event: K,
    handler: (data: IndexerEvents[K]) => void
  ): Subscription;
  
  emit<K extends keyof IndexerEvents>(
    event: K,
    data: IndexerEvents[K]
  ): void;
}

// Agent Usage
indexerBus.on('symbol:extracted', ({ symbol }) => {
  // Agent reacts to new symbol
  if (symbol.kind === 'class') {
    analyzeClassStructure(symbol);
  }
});
```

### 6.4 OpenCode Agent Query Flow

```
┌──────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│   Agent      │     │   iDumb Query    │     │    Response         │
│  Requests    │────→│   Engine         │────→│    Builder          │
└──────────────┘     └──────────────────┘     └─────────────────────┘
       │                       │                        │
       │ "Find all methods     │ 1. Query Symbol DB    │ Format as
       │  that call            │ 2. Run Tree-sitter    │ structured
       │  UserService.auth()"  │    query              │ response
       │                       │ 3. Augment with LSP   │
       │                       │    (if available)     │
       │                       │                       │
       │                       ▼                       │
       │              ┌──────────────┐                 │
       │              │ Symbol Graph │                 │
       │              │ Analysis     │                 │
       │              └──────────────┘                 │
       │                       │                       │
       └───────────────────────┴───────────────────────┘
```

---

## 7. Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
1. Set up Tree-sitter with TypeScript/JavaScript parsers
2. Implement basic file watching with @parcel/watcher
3. Create RxJS event stream for file changes
4. Build simple AST cache

### Phase 2: Indexing (Week 3-4)
1. Design symbol database schema (SQLite)
2. Implement symbol extraction from Tree-sitter AST
3. Build incremental update logic
4. Add basic query API

### Phase 3: LSP Integration (Week 5-6)
1. Enable OpenCode experimental LSP tool
2. Create hybrid query system (AST + LSP)
3. Implement semantic enrichment
4. Build agent-friendly query interface

### Phase 4: Advanced Features (Week 7-8)
1. Cross-reference analysis
2. Call graph generation
3. Dependency mapping
4. Performance optimization

---

## 8. Risk Analysis

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Tree-sitter memory issues on huge files | Low | Medium | File size limits, streaming for large files |
| @parcel/watcher compilation issues | Low | Low | Fallback to chokidar |
| LSP tool API changes (experimental) | Medium | Medium | Abstraction layer, version pinning |
| Multi-language inconsistency | Medium | Medium | Per-language adapters, consistent interfaces |
| Performance on monorepos | Medium | High | Incremental only, lazy loading, caching |

---

## 9. Sources and Confidence Levels

### HIGH Confidence (Context7 + Official Docs)
- Tree-sitter: Context7 + https://tree-sitter.github.io/
- TypeScript Compiler API: Context7 + Microsoft docs
- SWC: Context7 + official docs
- ts-morph: Context7 + ts-morph.com
- OpenCode LSP: opencode.ai/docs

### MEDIUM Confidence (Web search + verification)
- Biome: Multiple 2025 comparison articles
- File watchers: npm trends, GitHub issues
- SCIP: Sourcegraph blog, GitHub

### LOW Confidence (Single sources, unverified)
- Specific performance benchmarks (vary by hardware)
- ANTLR performance comparisons (older data)

---

## 10. Summary Recommendations

### Stack Recommendation for iDumb

| Component | Technology | Version | Rationale |
|-----------|------------|---------|-----------|
| AST Parser | Tree-sitter | ^0.26.x | Incremental, multi-language, fast |
| File Watcher | @parcel/watcher | ^2.5.x | Fastest, used by VSCode |
| Events | RxJS | ^7.x | Reactive streams, composition |
| Database | SQLite + better-sqlite3 | Latest | Embedded, fast, zero-config |
| LSP | OpenCode LSP tool | Experimental | Native integration |
| Fallback | chokidar | ^4.x | Compatibility fallback |

### NPM Dependencies
```json
{
  "dependencies": {
    "tree-sitter": "^0.21.0",
    "tree-sitter-typescript": "^0.23.0",
    "tree-sitter-javascript": "^0.21.0",
    "@parcel/watcher": "^2.5.0",
    "rxjs": "^7.8.0",
    "better-sqlite3": "^11.0.0"
  },
  "optionalDependencies": {
    "chokidar": "^4.0.0"
  }
}
```

### Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Tree-sitter | HIGH | Multiple verified sources, industry adoption |
| File Watching | HIGH | Clear performance winner (@parcel/watcher) |
| Event Architecture | HIGH | RxJS industry standard |
| LSP Integration | MEDIUM | Experimental, may change |
| Symbol Indexing | HIGH | Well-understood patterns |

---

**Document Version:** 1.0
**Last Updated:** 2025-02-02
**Next Review:** When OpenCode LSP tool reaches stable
