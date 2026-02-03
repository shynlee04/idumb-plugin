# Advanced Search, Indexing, and Hop-Reading Technologies Research

**Project:** iDumb Brain Concept  
**Research Date:** 2026-02-02  
**Researcher:** GSD Project Researcher  
**Confidence Level:** HIGH (verified with Context7, official docs, and multiple sources)

---

## Executive Summary

This research surveys the ecosystem of advanced search and indexing technologies suitable for implementing "hop-reading" capabilities in iDumb's brain concept. Hop-reading enables traversing code relationships (imports → definitions → usages) across files, going far beyond basic grep/glob patterns.

**Key Finding:** A hybrid architecture combining **Tree-sitter for structural parsing**, **ts-morph for TypeScript-specific navigation**, **MiniSearch for fast fuzzy text search**, and **FastEmbed for semantic vector search** provides the most powerful and flexible foundation for iDumb's brain.

---

## 1. Code Search Engines (Lightweight/Embedded)

### 1.1 ripgrep + ripgrep-all (rga)

**Overview:**  
ripgrep (`rg`) is a line-oriented search tool that recursively searches directories for regex patterns. ripgrep-all (`rga`) extends ripgrep to search within PDFs, E-Books, Office documents, zip/tar.gz archives, and even images (via OCR).

**Key Capabilities:**
- Extremely fast regex-based text search
- Respects `.gitignore` patterns by default
- Parallel search across files
- rga adapters for binary formats (pandoc, poppler, ffmpeg)
- Caching of extracted text for repeated searches

**Setup Complexity:** LOW  
**Index Size:** None (stateless)  
**Query Speed:** Extremely fast (millions of lines/sec)  
**Incremental Updates:** N/A (scans on each query)  

**Integration with OpenCode Agents:**
```bash
# Search for function definitions
rg "^\s*(export\s+)?(async\s+)?function\s+\w+" --type ts

# Search within archives
rga "class.*Component" src/

# Find all imports of a specific module
rg "import.*from\s+['\"]@opencode" --type ts
```

**Limitations for Hop-Reading:**
- Purely text-based; no semantic understanding
- Cannot follow symbol references across files
- No AST awareness
- **Verdict:** Good for initial filtering, insufficient for hop-reading alone

**Sources:**
- [GitHub: ripgrep-all](https://github.com/phiresky/ripgrep-all) - HIGH confidence
- [ripgrep documentation](https://github.com/BurntSushi/ripgrep) - HIGH confidence

---

### 1.2 SCIP (Sourcegraph Code Intelligence Protocol)

**Overview:**  
SCIP (pronounced "skip") is a language-agnostic protocol for indexing source code, designed as a successor to LSIF. It powers precise code navigation features like Go to Definition, Find References, and Find Implementations.

**Key Capabilities:**
- Cross-repository navigation
- Precise "Go to Definition" via symbol resolution
- "Find References" across entire codebase
- "Find Implementations" for interfaces/classes
- Human-readable symbol names (unlike LSIF's numeric IDs)
- 4x smaller index size than LSIF when compressed

**Available Indexers:**
- scip-typescript (TypeScript/JavaScript)
- scip-python
- scip-java (Java/Kotlin/Scala)
- scip-go
- scip-clang (C/C++)
- scip-ruby

**Setup Complexity:** MEDIUM-HIGH  
**Index Size:** ~20-50MB per 100K LOC (compressed)  
**Query Speed:** Fast (pre-indexed)  
**Incremental Updates:** Partial (re-index changed files)

**Usage Example:**
```bash
# Index TypeScript project
npm install -g @sourcegraph/scip-typescript
scip-typescript index

# Produces index.scip file
# Query via SCIP CLI or load into vector DB
```

**SCIP File Format:**
- Protocol Buffers-based
- Contains symbol definitions, references, relationships
- Symbols use structured URIs: `scheme:package:descriptor`

**Integration with OpenCode Agents:**
SCIP indices can be queried programmatically:
```typescript
// Load SCIP index
const index = scip.Index.deserialize(binaryData);

// Find all references to a symbol
for (const document of index.documents) {
  for (const occurrence of document.occurrences) {
    if (occurrence.symbol === targetSymbol) {
      // Found reference at occurrence.range
    }
  }
}
```

**Limitations:**
- Requires re-indexing for updates
- Indexing can be slow for large codebases (minutes)
- Limited customization of indexing behavior
- **Verdict:** Excellent for precise navigation, but heavy for real-time use

**Sources:**
- [GitHub: sourcegraph/scip](https://github.com/sourcegraph/scip) - HIGH confidence
- [Sourcegraph Blog: Announcing SCIP](https://sourcegraph.com/blog/announcing-scip) - HIGH confidence

---

### 1.3 Tree-sitter (Structural Search)

**Overview:**  
Tree-sitter is a parser generator tool and incremental parsing library that builds concrete syntax trees for source files and efficiently updates them as code is edited.

**Key Capabilities:**
- Incremental parsing (updates AST as files change)
- Query language for pattern matching on syntax trees
- 50+ language parsers available
- Fast enough for real-time syntax highlighting
- Maintains parse tree validity during edits

**Tree-sitter Query Syntax:**
```scheme
; Match all function declarations
(function_declaration
  name: (identifier) @function.name
  body: (block) @function.body)

; Match class methods with specific pattern
(class_declaration
  name: (identifier) @class.name
  body: (class_body
    (method_definition
      name: (property_identifier) @method.name)))

; Match imports from specific module
(import_statement
  source: (string) @import.source
  (#match? @import.source "@opencode"))
```

**JavaScript/TypeScript API:**
```typescript
import Parser from 'tree-sitter';
import TypeScript from 'tree-sitter-typescript';

const parser = new Parser();
parser.setLanguage(TypeScript);

const tree = parser.parse(sourceCode);
const rootNode = tree.rootNode;

// Query for specific patterns
const query = new Parser.Query(TypeScript, `
  (function_declaration name: (identifier) @name)
`);

const matches = query.matches(rootNode);
```

**Setup Complexity:** LOW-MEDIUM  
**Index Size:** None (parses on demand)  
**Query Speed:** Very fast (native C with bindings)  
**Incremental Updates:** YES (core feature)

**Integration with OpenCode Agents:**
```typescript
// Multi-hop: Find function → Find its calls
const functionQuery = new Parser.Query(lang, `
  (function_declaration
    name: (identifier) @func_name)
`);

const callQuery = new Parser.Query(lang, `
  (call_expression
    function: (identifier) @called_func)
`);

// Parse and find relationships
const tree = parser.parse(fileContent);
const functions = functionQuery.matches(tree.rootNode);
const calls = callQuery.matches(tree.rootNode);

// Build call graph
const callGraph = buildCallGraph(functions, calls);
```

**Verdict:** Essential foundation for structural hop-reading. Combine with symbol resolution for full power.

**Sources:**
- [Tree-sitter Documentation](https://tree-sitter.github.io/tree-sitter/) - HIGH confidence
- Context7: `/tree-sitter/tree-sitter` - HIGH confidence

---

### 1.4 Universal Ctags

**Overview:**  
Universal Ctags is a maintained implementation of ctags that generates an index (tag file) of language objects found in source files. It supports reference tags (not just definitions) and has parsers for many languages.

**Key Capabilities:**
- Generates tag files for quick symbol lookup
- Supports definition AND reference tags
- Exuberant Ctags compatible
- Customizable via `.ctags` files
- Fast indexing of large codebases

**Usage:**
```bash
# Generate tags
ctags -R --languages=TypeScript,JavaScript src/

# Find symbol definition
grep "^myFunction" tags

# List all class definitions
ctags -x --c-types=c src/
```

**Setup Complexity:** LOW  
**Index Size:** ~1-5MB per 100K LOC  
**Query Speed:** Fast (file-based lookup)  
**Incremental Updates:** Manual (append mode available)

**Limitations:**
- Limited relationship tracking (no call graphs)
- No type information
- Requires manual tag file updates
- **Verdict:** Good for basic symbol indexing, insufficient for hop-reading alone

**Sources:**
- [GitHub: universal-ctags/ctags](https://github.com/universal-ctags/ctags) - HIGH confidence

---

## 2. Full-Text Search Libraries

### 2.1 FlexSearch

**Overview:**  
FlexSearch is a Next-generation full-text search library focused on speed and memory efficiency. Uses a "Contextual Index" algorithm for pre-scored lexical dictionaries.

**Key Capabilities:**
- Fastest JavaScript full-text search (50M+ ops/sec)
- Multiple profiles: `memory`, `performance`, `match`, `score`
- Document-based indexing (multi-field)
- Web worker support for non-blocking operations
- Phonetic transformations

**Performance (from benchmarks):**
| Library | Memory (MB) | Single Query | Multi Query | Not Found |
|---------|-------------|--------------|-------------|-----------|
| flexsearch | 16 | 50,955,718 | 11,912,730 | 51,706,499 |
| minisearch | 4,777 | 30,589 | 191,657 | 304,233 |
| fuse | 247,107 | 422 | 321 | 329 |
| lunr | 2,443 | 11,527 | 51,476 | 103,386 |

**Setup Complexity:** LOW  
**Index Size:** Configurable (memory vs speed tradeoff)  
**Query Speed:** Extremely fast  
**Incremental Updates:** YES  

**Usage:**
```javascript
import FlexSearch from 'flexsearch';

const index = new FlexSearch.Document({
  document: {
    id: 'id',
    index: ['title', 'content', 'tags']
  },
  tokenize: 'forward',
  resolution: 10,
  minlength: 2,
  boost: {
    title: 2,
    tags: 1.5
  }
});

// Add documents
index.add({
  id: 1,
  title: 'Agent Configuration',
  content: 'OpenCode agents use YAML frontmatter...',
  tags: ['agent', 'yaml', 'config']
});

// Search
const results = index.search('agent yaml', {
  limit: 10,
  enrich: true,
  suggest: true
});
```

**Limitations:**
- **No fuzzy search** (despite common misconception)
- No typo tolerance
- Exact match and prefix only
- **Verdict:** Excellent for fast exact/prefix search, needs pairing with Fuse.js for fuzzy matching

**Sources:**
- [GitHub: nextapps-de/flexsearch](https://github.com/nextapps-de/flexsearch) - HIGH confidence
- [InfoQ Article](https://www.infoq.com/news/2019/03/flexsearch-fast-full-text-search/) - MEDIUM confidence

---

### 2.2 MiniSearch

**Overview:**  
Tiny and powerful JavaScript full-text search engine for browser and Node.js. Designed for small-to-medium datasets with excellent typo tolerance.

**Key Capabilities:**
- Full-text search with BM25 scoring
- Fuzzy matching (configurable edit distance)
- Prefix search
- Auto-suggest
- Field boosting
- Filters
- Only ~6KB gzipped

**Setup Complexity:** LOW  
**Index Size:** ~100KB-1MB per 1000 documents  
**Query Speed:** Fast (sub-millisecond)  
**Incremental Updates:** YES  

**Usage:**
```javascript
import MiniSearch from 'minisearch';

const miniSearch = new MiniSearch({
  fields: ['title', 'content', 'tags'],
  storeFields: ['title', 'path'],
  searchOptions: {
    boost: { title: 2, tags: 1.5 },
    fuzzy: 0.2,  // 20% edit distance
    prefix: true,
    combineWith: 'AND'
  }
});

// Index documents
miniSearch.addAll(documents);

// Search with fuzzy matching
const results = miniSearch.search('agent confguration', {
  fuzzy: 0.2  // Handles typos
});

// Auto-suggest
const suggestions = miniSearch.autoSuggest('agent conf', {
  fuzzy: 0.2
});
// => [{ suggestion: 'agent configuration', terms: ['agent', 'configuration'], score: 1.733 }]
```

**Verdict:** Perfect balance of features and size. Recommended for iDumb's text search layer.

**Sources:**
- [GitHub: lucaong/minisearch](https://github.com/lucaong/minisearch) - HIGH confidence
- [Documentation](https://lucaong.github.io/minisearch/) - HIGH confidence

---

### 2.3 Fuse.js

**Overview:**  
Powerful, lightweight, zero-dependency fuzzy-search library for client-side fuzzy searching.

**Key Capabilities:**
- Fuzzy matching with configurable threshold
- Weighted keys
- Multiple match algorithms (exact, prefix, fuzzy)
- Only ~10KB gzipped

**Usage:**
```javascript
import Fuse from 'fuse.js';

const fuse = new Fuse(documents, {
  keys: ['title', 'content'],
  threshold: 0.4,  // 0 = exact, 1 = match anything
  includeScore: true,
  includeMatches: true
});

// Fuzzy search handles typos
const results = fuse.search('agent confguration');
// Finds "agent configuration" despite typo
```

**Verdict:** Best-in-class fuzzy search. Pair with MiniSearch for hybrid approach.

**Sources:**
- Context7: `/websites/fusejs_io` - HIGH confidence

---

### 2.4 Lunr.js

**Overview:**  
Solr-like full-text search with no dependencies. Good for smaller datasets.

**Key Capabilities:**
- Tokenization, stemming, stop word filtering
- Boolean queries
- Field boosts
- ~8KB gzipped

**Limitations:**
- Slower than FlexSearch/MiniSearch
- No built-in fuzzy matching
- No incremental updates (rebuild index)

**Verdict:** Legacy choice; prefer MiniSearch for new projects.

---

## 3. Graph Traversal for Code

### 3.1 ts-morph

**Overview:**  
TypeScript Compiler API wrapper that makes setup, navigation, and manipulation of the TypeScript AST simple. Essential for TypeScript-specific hop-reading.

**Key Capabilities:**
- Navigate TypeScript AST with simple API
- Find references to symbols across files
- Get type information
- Rename refactorings
- Code transformations
- Works with projects (tsconfig.json)

**Setup Complexity:** LOW  
**Index Size:** In-memory AST  
**Query Speed:** Fast (leverages TypeScript compiler)  
**Incremental Updates:** Partial (file-based)

**Navigation API:**
```typescript
import { Project, ts } from 'ts-morph';

const project = new Project({
  tsConfigFilePath: './tsconfig.json'
});

// Get source file
const sourceFile = project.getSourceFile('src/agent.ts');

// Find all classes
const classes = sourceFile.getClasses();

// Find specific function
const func = sourceFile.getFunction('initializeAgent');

// Find all references to a symbol
const symbol = func.getSymbol();
const references = symbol.findReferences();

for (const ref of references) {
  console.log(`Referenced in: ${ref.getSourceFile().getFilePath()}`);
  for (const entry of ref.getReferences()) {
    console.log(`  Line ${entry.getRange().getStartLineNumber()}`);
  }
}

// Navigate imports
const imports = sourceFile.getImportDeclarations();
for (const imp of imports) {
  const moduleSpecifier = imp.getModuleSpecifierValue();
  const namedImports = imp.getNamedImports();
}

// Get exported declarations
const exports = sourceFile.getExportedDeclarations();
```

**Multi-Hop Traversal:**
```typescript
// Hop 1: Find function definition
const func = sourceFile.getFunction('executeTool');

// Hop 2: Find all calls to this function
const calls = func.findReferencesAsNodes();

// Hop 3: For each call, find its containing function
for (const call of calls) {
  const containingFunc = call.getFirstAncestorByKind(
    ts.SyntaxKind.FunctionDeclaration
  );
  
  // Hop 4: Find what that function calls
  const innerCalls = containingFunc.getDescendantsOfKind(
    ts.SyntaxKind.CallExpression
  );
}
```

**Verdict:** Essential for TypeScript hop-reading. Provides symbol resolution that Tree-sitter alone cannot.

**Sources:**
- [ts-morph.com](https://ts-morph.com/) - HIGH confidence
- Exa code context - HIGH confidence

---

### 3.2 dependency-cruiser

**Overview:**  
Validate and visualize dependencies. Generates dependency graphs and detects circular dependencies.

**Key Capabilities:**
- Generate dependency graphs (DOT, SVG, HTML)
- Detect circular dependencies
- Validate against architectural rules
- Supports JS, TS, JSX, TSX, Vue, CoffeeScript
- CI/CD integration

**Usage:**
```bash
# Generate dependency graph
npx depcruise --output-type dot src | dot -T svg > deps.svg

# Check for circular dependencies
npx depcruise --circular src

# Validate architecture
npx depcruise --validate .dependency-cruiser.js src
```

**API Usage:**
```javascript
import { cruise } from 'dependency-cruiser';

const cruiseResult = await cruise(['src/']);

// Get dependency graph
const dependencies = cruiseResult.output;

// Check for circular dependencies
const circular = cruiseResult.output.modules
  .filter(m => m.circular);
```

**Verdict:** Excellent for module-level dependency analysis. Less useful for symbol-level hop-reading.

**Sources:**
- [GitHub: sverweij/dependency-cruiser](https://github.com/sverweij/dependency-cruiser) - HIGH confidence

---

### 3.3 Madge

**Overview:**  
Create graphs from CommonJS, AMD, or ES6 module dependencies. Detects circular dependencies.

**Key Capabilities:**
- Generate dependency trees
- Detect circular dependencies
- Output as JSON, DOT, or images
- Faster than dependency-cruiser for simple use cases

**Usage:**
```bash
# List dependencies
npx madge src/index.ts

# Detect circular dependencies
npx madge --circular src/

# Generate image
npx madge --image deps.svg src/
```

**Verdict:** Simple and fast. Good for basic dependency analysis.

**Sources:**
- [GitHub: pahen/madge](https://github.com/pahen/madge) - HIGH confidence

---

## 4. Semantic/Vector Search

### 4.1 FastEmbed

**Overview:**  
Lightweight, fast Python library for embedding generation. Maintained by Qdrant. Now available for JavaScript/TypeScript.

**Key Capabilities:**
- Quantized model weights (ONNX Runtime)
- No PyTorch dependency
- CPU-first design (GPU optional)
- Data-parallelism for large datasets
- Runs in AWS Lambda (small footprint)

**Available Models:**
| Model | Dimensions | Best For |
|-------|------------|----------|
| BAAI/bge-small-en-v1.5 | 384 | General purpose (default) |
| sentence-transformers/all-MiniLM-L6-v2 | 384 | Fast, good quality |
| BAAI/bge-base-en-v1.5 | 768 | Higher quality |
| sentence-transformers/all-mpnet-base-v2 | 768 | Best quality |
| nomic-ai/nomic-embed-text-v1.5 | 768 | Long context |

**JavaScript Usage (via ONNX Runtime):**
```typescript
import { pipeline } from '@xenova/transformers';

// Load embedding model
const embedder = await pipeline(
  'feature-extraction',
  'Xenova/all-MiniLM-L6-v2'
);

// Generate embeddings
const output = await embedder('OpenCode agent configuration', {
  pooling: 'mean',
  normalize: true
});

const embedding = Array.from(output.data);
```

**Setup Complexity:** LOW  
**Index Size:** ~50MB per model (one-time download)  
**Query Speed:** Fast on CPU (~10-50ms per embedding)  
**Incremental Updates:** N/A (compute on demand)

**Performance Comparison:**
- OpenAI API Embedding: ~300ms (network roundtrip)
- Local MiniLM (FastEmbed): ~12ms (compute only)

**Verdict:** Best for local semantic search without API dependencies. Use for concept-based code discovery.

**Sources:**
- [GitHub: qdrant/fastembed](https://github.com/qdrant/fastembed) - HIGH confidence
- [Qdrant Blog](https://qdrant.tech/articles/fastembed/) - HIGH confidence

---

### 4.2 Transformers.js

**Overview:**  
State-of-the-art Machine Learning for the web. Run Hugging Face Transformers directly in browser or Node.js, no server needed.

**Key Capabilities:**
- 100+ pre-trained models
- Embeddings, classification, summarization, QA
- ONNX Runtime backend
- WebGL/WebGPU acceleration

**Usage:**
```typescript
import { pipeline } from '@xenova/transformers';

// Sentence embeddings
const embedder = await pipeline(
  'feature-extraction',
  'Xenova/all-MiniLM-L6-v2'
);

// Code-specific embeddings
const codeEmbedder = await pipeline(
  'feature-extraction',
  'Xenova/codebert-base'
);

const embedding = await codeEmbedder(
  'function hopRead(symbol) { return findReferences(symbol); }',
  { pooling: 'mean', normalize: true }
);
```

**Verdict:** More flexible than FastEmbed (more models). Slightly larger bundle size.

**Sources:**
- Context7: `/huggingface/transformers.js` - HIGH confidence

---

### 4.3 txtai

**Overview:**  
All-in-one AI framework for semantic search, LLM orchestration, and language model workflows. Embeddings database combining vector indexes, graph networks, and relational databases.

**Key Capabilities:**
- Semantic search with SQL interface
- Hybrid search (dense + sparse vectors)
- Graph vector search
- Embeddings for text, documents, audio, images, video
- Workflow builder for pipelines
- Agent framework
- OpenAI-compatible API

**Usage:**
```python
from txtai import Embeddings

# Create embeddings instance
embeddings = Embeddings({
    "path": "sentence-transformers/nli-mpnet-base-v2",
    "content": True,
    "hybrid": True  # Enable hybrid search
})

# Index documents
embeddings.index([
    {"id": "agent.md", "text": "OpenCode agents use YAML frontmatter..."},
    {"id": "tools.md", "text": "Tools provide capabilities to agents..."}
])

# Semantic search
results = embeddings.search("how to configure an agent", 5)

# SQL-like search
results = embeddings.search(
    "select id, text, score from txtai where similar('agent config')",
    5
)
```

**Setup Complexity:** LOW  
**Index Size:** Depends on model (~100MB-1GB)  
**Query Speed:** Fast (ANN index)  
**Incremental Updates:** YES  

**Verdict:** Feature-rich but Python-only. Good for backend indexing service.

**Sources:**
- [GitHub: neuml/txtai](https://github.com/neuml/txtai) - HIGH confidence
- [Hugging Face Blog](https://huggingface.co/blog/NeuML/txtai) - HIGH confidence

---

### 4.4 sentence-transformers

**Overview:**  
Python framework for computing embeddings for sentences, paragraphs, and images.

**Key Capabilities:**
- Pre-trained models for semantic similarity
- Fine-tuning support
- Cross-encoders for reranking
- Multi-task learning

**Verdict:** Gold standard for Python-based embeddings. Use via FastEmbed for Node.js compatibility.

**Sources:**
- Context7: `/huggingface/sentence-transformers` - HIGH confidence

---

## 5. Hybrid Approaches for Hop-Reading

### Recommended Architecture for iDumb Brain

Based on research, the optimal architecture combines multiple technologies:

```
┌─────────────────────────────────────────────────────────────────┐
│                      iDUMB BRAIN ARCHITECTURE                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐    ┌─────────────────┐    ┌──────────────┐ │
│  │  INGESTION      │    │  INDEX LAYERS   │    │   QUERY      │ │
│  │                 │    │                 │    │   ENGINE     │ │
│  │  File Watcher   │───▶│  ┌───────────┐  │    │              │ │
│  │  Tree-sitter    │    │  │ Structure │  │◀───│  Query Parser│ │
│  │  ts-morph       │    │  │  Index    │  │    │              │ │
│  └─────────────────┘    │  └───────────┘  │    └──────────────┘ │
│                         │  ┌───────────┐  │           │         │
│                         │  │  Text     │  │           ▼         │
│                         │  │  Index    │  │    ┌──────────────┐ │
│                         │  │(MiniSearch│  │◀───│  Multi-Hop   │ │
│                         │  │ + Fuse)   │  │    │  Navigator   │ │
│                         │  └───────────┘  │    └──────────────┘ │
│                         │  ┌───────────┐  │           │         │
│                         │  │ Semantic  │  │           ▼         │
│                         │  │  Index    │  │    ┌──────────────┐ │
│                         │  │(FastEmbed)│  │◀───│  Results     │ │
│                         │  └───────────┘  │    │  Aggregator  │ │
│                         └─────────────────┘    └──────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Layer 1: Structural Index (Tree-sitter + ts-morph)

**Purpose:** Parse code structure and enable AST-based navigation

```typescript
interface StructuralIndex {
  // Parse file and extract symbols
  parse(filePath: string): AST;
  
  // Query with tree-sitter patterns
  query(pattern: string): Node[];
  
  // For TypeScript: resolve symbols
  getSymbolDefinition(symbol: string): Location;
  findReferences(symbol: string): Location[];
  getTypeInformation(node: Node): Type;
}
```

**Implementation:**
- Use Tree-sitter for fast incremental parsing
- Use ts-morph for TypeScript symbol resolution
- Store AST nodes with metadata (type, scope, relationships)

---

### Layer 2: Text Index (MiniSearch + Fuse.js)

**Purpose:** Fast fuzzy text search across file names, symbol names, comments

```typescript
interface TextIndex {
  // Index document
  add(doc: { id: string, path: string, content: string, symbols: string[] });
  
  // Fuzzy search
  search(query: string, options: { fuzzy: boolean }): Result[];
  
  // Auto-suggest
  suggest(prefix: string): string[];
}
```

**Implementation:**
- MiniSearch for full-text with field boosting
- Fuse.js for fuzzy matching when MiniSearch returns no results

---

### Layer 3: Semantic Index (FastEmbed/Transformers.js)

**Purpose:** Find conceptually related code

```typescript
interface SemanticIndex {
  // Generate embeddings for code chunks
  embed(code: string): Vector;
  
  // Find semantically similar code
  findSimilar(embedding: Vector, topK: number): Result[];
  
  // Hybrid: text + semantic
  search(query: string): Result[];
}
```

**Implementation:**
- Use Transformers.js with code-specific models (CodeBERT)
- Store vectors in vector DB or in-memory index (hnswlib, faiss-js)

---

### Layer 4: Relationship Graph

**Purpose:** Enable multi-hop traversal

```typescript
interface RelationshipGraph {
  // Add relationship
  addEdge(from: Symbol, to: Symbol, type: RelationType);
  
  // Multi-hop traversal
  traverse(start: Symbol, hops: number): Path[];
  
  // Find import chains
  findImportChain(from: File, to: File): File[];
  
  // Find all implementations
  findImplementations(interface: Symbol): Symbol[];
}

type RelationType = 
  | 'imports'
  | 'exports'
  | 'calls'
  | 'extends'
  | 'implements'
  | 'references'
  | 'contains';
```

**Implementation:**
- In-memory graph (graphlib) or lightweight DB (SQLite + json1)
- Updated incrementally via file watcher

---

### Layer 5: Query Engine

**Purpose:** Orchestrate multi-hop queries

```typescript
interface HopQuery {
  // Start from a symbol
  start: Symbol | string;
  
  // Define hops
  hops: Array<{
    type: RelationType | 'search',
    filter?: (node: Node) => boolean,
    limit?: number
  }>;
}

// Example: Find all functions that call functions using "executeTool"
const query: HopQuery = {
  start: 'executeTool',
  hops: [
    { type: 'references', filter: n => n.kind === 'function' },
    { type: 'contains', filter: n => n.kind === 'call' }
  ]
};

// Execute hop query
const results = await hopEngine.execute(query);
```

---

## 6. Comparison Matrix

| Technology | Setup | Speed | Incremental | Best For | Integration |
|------------|-------|-------|-------------|----------|-------------|
| **ripgrep/rga** | Easy | Very Fast | N/A | Quick text search | Shell/Spawn |
| **SCIP** | Medium | Fast | Partial | Precise cross-repo nav | Load index |
| **Tree-sitter** | Easy | Very Fast | Yes | Structural parsing | Native API |
| **Universal Ctags** | Easy | Fast | Manual | Symbol indexing | File-based |
| **FlexSearch** | Easy | Extremely Fast | Yes | Exact/prefix search | JS API |
| **MiniSearch** | Easy | Fast | Yes | Fuzzy text search | JS API |
| **Fuse.js** | Easy | Medium | Yes | Typo tolerance | JS API |
| **ts-morph** | Easy | Fast | Partial | TypeScript nav | JS API |
| **dependency-cruiser** | Easy | Fast | No | Module deps | CLI/API |
| **Madge** | Easy | Fast | No | Circular deps | CLI/API |
| **FastEmbed** | Easy | Fast | N/A | Local embeddings | JS/Python |
| **Transformers.js** | Easy | Medium | N/A | General ML | JS API |
| **txtai** | Easy | Fast | Yes | Semantic workflows | Python |

---

## 7. Recommended Stack for iDumb

### Core Stack (Minimum Viable)

```yaml
# For fast text search
minisearch: ^6.3.0

# For fuzzy fallback
fuse.js: ^7.0.0

# For structural parsing
tree-sitter: ^0.21.0
tree-sitter-typescript: ^0.21.0

# For TypeScript navigation
ts-morph: ^24.0.0

# For semantic search
@xenova/transformers: ^2.17.0
```

### Extended Stack (Full Hop-Reading)

```yaml
# Core + Graph
graphlib: ^2.1.8
sqlite3: ^5.1.0

# Incremental file watching
chokidar: ^3.6.0

# SCIP for cross-repo (optional)
@sourcegraph/scip: ^0.3.0
```

### Implementation Priority

1. **Phase 1:** MiniSearch + Fuse.js for text search
2. **Phase 2:** Tree-sitter for structural queries
3. **Phase 3:** ts-morph for TypeScript navigation
4. **Phase 4:** Relationship graph for hop traversal
5. **Phase 5:** Semantic search with Transformers.js
6. **Phase 6:** SCIP integration for cross-repo

---

## 8. Pitfalls and Anti-Patterns

### Pitfall 1: Rebuilding Index on Every Change

**Problem:** Naive implementations rebuild the entire index when any file changes.

**Solution:** Use incremental updates
- Tree-sitter supports incremental parsing
- MiniSearch supports add/remove documents
- Only re-parse changed files

### Pitfall 2: Ignoring TypeScript Module Resolution

**Problem:** Tree-sitter alone cannot resolve imports like `import { x } from '@opencode'` to actual file paths.

**Solution:** Use ts-morph or implement custom resolver
```typescript
// Custom resolver needed
resolveImportPath(importPath: string, fromFile: string): string {
  // Handle relative imports
  if (importPath.startsWith('.')) {
    return path.resolve(path.dirname(fromFile), importPath);
  }
  // Handle alias imports (requires tsconfig.json)
  const tsConfig = loadTsConfig();
  return resolveAlias(importPath, tsConfig.paths);
}
```

### Pitfall 3: Storing Full AST in Memory

**Problem:** Large codebases (100K+ files) will exhaust memory.

**Solution:** Lazy loading with cache
```typescript
class LazyASTStore {
  private cache = new LRUCache<string, AST>({ max: 1000 });
  
  get(filePath: string): AST {
    if (!this.cache.has(filePath)) {
      const ast = this.parseFile(filePath);
      this.cache.set(filePath, ast);
    }
    return this.cache.get(filePath);
  }
}
```

### Pitfall 4: Synchronous Parsing

**Problem:** Parsing many files blocks the event loop.

**Solution:** Use worker threads
```typescript
import { Worker } from 'worker_threads';

const parseWorker = new Worker('./parse-worker.js');

// Offload parsing
const ast = await new Promise((resolve) => {
  parseWorker.postMessage({ filePath, content });
  parseWorker.once('message', resolve);
});
```

### Pitfall 5: Ignoring Context Size Limits

**Problem:** Embedding models have token limits (512-8192 tokens).

**Solution:** Chunk code intelligently
```typescript
function chunkCode(code: string, maxTokens: number = 512): string[] {
  // Split by function/class boundaries
  const chunks = [];
  const ast = parser.parse(code);
  
  for (const node of ast.rootNode.children) {
    if (node.type === 'function_declaration' || 
        node.type === 'class_declaration') {
      const chunk = node.text;
      if (estimateTokens(chunk) > maxTokens) {
        chunks.push(...splitFunction(chunk));
      } else {
        chunks.push(chunk);
      }
    }
  }
  
  return chunks;
}
```

---

## 9. Quick Start Implementation

### Basic Hop-Reading Implementation

```typescript
import { Project } from 'ts-morph';
import MiniSearch from 'minisearch';
import Parser from 'tree-sitter';
import TypeScript from 'tree-sitter-typescript';

class iDumbBrain {
  private project: Project;
  private textIndex: MiniSearch;
  private treeSitter: Parser;
  private relationshipGraph: Map<string, Set<string>>;

  constructor(tsConfigPath: string) {
    // Initialize TypeScript project
    this.project = new Project({
      tsConfigFilePath: tsConfigPath
    });

    // Initialize text search
    this.textIndex = new MiniSearch({
      fields: ['name', 'type', 'content'],
      storeFields: ['path', 'line', 'kind'],
      searchOptions: {
        fuzzy: 0.2,
        prefix: true
      }
    });

    // Initialize Tree-sitter
    this.treeSitter = new Parser();
    this.treeSitter.setLanguage(TypeScript);

    // Initialize relationship graph
    this.relationshipGraph = new Map();
  }

  async indexFile(filePath: string) {
    const sourceFile = this.project.getSourceFile(filePath);
    if (!sourceFile) return;

    // Index all symbols
    const symbols = sourceFile.getDescendants();
    for (const symbol of symbols) {
      this.textIndex.add({
        id: `${filePath}:${symbol.getStartLineNumber()}`,
        name: symbol.getText(),
        type: symbol.getKindName(),
        path: filePath,
        line: symbol.getStartLineNumber(),
        kind: symbol.getKindName()
      });
    }

    // Build relationships
    this.buildRelationships(sourceFile);
  }

  private buildRelationships(sourceFile: any) {
    // Find imports
    const imports = sourceFile.getImportDeclarations();
    for (const imp of imports) {
      const source = imp.getModuleSpecifierValue();
      const target = sourceFile.getFilePath();
      
      if (!this.relationshipGraph.has(target)) {
        this.relationshipGraph.set(target, new Set());
      }
      this.relationshipGraph.get(target).add(source);
    }
  }

  // Multi-hop: Find definition → references → related symbols
  async hopRead(symbolName: string, hops: number = 2): Promise<any[]> {
    const results = [];
    const visited = new Set<string>();
    
    // Hop 0: Find initial symbol
    const definitions = this.findDefinitions(symbolName);
    
    let currentLevel = definitions;
    for (let i = 0; i < hops; i++) {
      const nextLevel = [];
      
      for (const symbol of currentLevel) {
        const key = `${symbol.path}:${symbol.line}`;
        if (visited.has(key)) continue;
        visited.add(key);
        
        results.push({
          hop: i,
          ...symbol
        });
        
        // Find references (next hop)
        const refs = this.findReferences(symbol);
        nextLevel.push(...refs);
      }
      
      currentLevel = nextLevel;
    }
    
    return results;
  }

  private findDefinitions(symbolName: string): any[] {
    // Use ts-morph to find precise definitions
    const results = [];
    for (const file of this.project.getSourceFiles()) {
      const symbol = file.getSymbol();
      if (symbol?.getName() === symbolName) {
        results.push({
          name: symbolName,
          path: file.getFilePath(),
          line: symbol.getDeclarations()[0]?.getStartLineNumber() || 0
        });
      }
    }
    return results;
  }

  private findReferences(symbol: any): any[] {
    // Use text search as fallback
    return this.textIndex.search(symbol.name)
      .filter(r => r.path !== symbol.path);
  }
}
```

---

## 10. Sources and References

### Official Documentation
1. [Tree-sitter Documentation](https://tree-sitter.github.io/tree-sitter/) - HIGH confidence
2. [ts-morph Documentation](https://ts-morph.com/) - HIGH confidence
3. [Sourcegraph SCIP](https://github.com/sourcegraph/scip) - HIGH confidence
4. [MiniSearch Documentation](https://lucaong.github.io/minisearch/) - HIGH confidence
5. [FlexSearch GitHub](https://github.com/nextapps-de/flexsearch) - HIGH confidence
6. [FastEmbed GitHub](https://github.com/qdrant/fastembed) - HIGH confidence
7. [txtai GitHub](https://github.com/neuml/txtai) - HIGH confidence

### Research Papers and Articles
8. "Implementation Practices in Language Server Protocols" (MODELS '22) - MEDIUM confidence
9. Sourcegraph SCIP Announcement Blog - MEDIUM confidence
10. InfoQ FlexSearch Article - MEDIUM confidence

### Context7 Library References
11. `/tree-sitter/tree-sitter` - HIGH confidence
12. `/microsoft/typescript` - HIGH confidence
13. `/huggingface/transformers.js` - HIGH confidence
14. `/huggingface/sentence-transformers` - HIGH confidence
15. `/websites/fusejs_io` - HIGH confidence

---

## 11. Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack Recommendations | HIGH | Verified with Context7, official docs |
| Performance Benchmarks | MEDIUM | Based on published benchmarks |
| API Examples | HIGH | From official documentation |
| Integration Patterns | MEDIUM | Inferred from architecture patterns |
| Pitfalls | HIGH | Community best practices |

---

## 12. Open Questions for Phase-Specific Research

1. **Scale Testing:** How does the stack perform with 10K+ files? Need phase-specific benchmarks.

2. **TypeScript Resolution:** Complex monorepo setups with path mapping require custom resolution logic.

3. **Memory Management:** LRU cache sizing for different codebase sizes needs tuning.

4. **Cross-Language:** SCIP can index multiple languages, but the query interface needs abstraction.

5. **Real-time Updates:** WebSocket-based incremental updates for collaborative environments.

6. **Vector Storage:** For large codebases, need to evaluate vector DB options (Pinecone, Weaviate, Milvus).

---

**End of Research Document**

*This research provides a foundation for implementing hop-reading capabilities in iDumb's brain. The recommended hybrid architecture balances performance, accuracy, and implementation complexity.*
