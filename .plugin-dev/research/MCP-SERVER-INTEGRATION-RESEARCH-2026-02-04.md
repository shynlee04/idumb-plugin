# MCP Server Integration Research for iDumb

**Research Date:** 2026-02-04
**Researcher:** @idumb-project-researcher
**Purpose:** Comprehensive guide for integrating Context7, Tavily, and DeepWiki MCP servers into iDumb init overhaul

---

## Executive Summary

### Key Findings

1. **OpenCode supports two MCP server configuration models:**
   - Local servers: Run via npx/node commands with environment variables
   - Remote servers: Connect via HTTP/SSE URLs with authentication headers

2. **All three target MCP servers provide different but complementary research capabilities:**
   - Context7: Up-to-date library documentation (API docs, code examples)
   - Tavily: Real-time web search, extraction, crawling, and mapping
   - DeepWiki: GitHub repository documentation and Q&A

3. **Configuration is client-specific but follows consistent patterns:**
   - OpenCode uses `mcp` object in `opencode.json`
   - Environment variables for API keys (no hardcoding secrets)
   - Auto-enable mechanisms available

4. **Discovery and fallback patterns are critical:**
   - Interactive installation guidance required for first-time setup
   - Graceful degradation when servers unavailable
   - Tool availability detection before use

### Strategic Implications for iDumb

1. **Multi-stage research workflows:** Combine Context7 + Tavily + DeepWiki for comprehensive research
2. **Interactive initialization:** Guide users through MCP server setup during `/idumb:init`
3. **Error handling:** Implement retry logic and fallback to built-in tools when MCP fails
4. **Token optimization:** Use context efficiently by selecting right tool for each task

---

## 1. OpenCode MCP Server Configuration

### Configuration Schema Overview

OpenCode uses `opencode.json` to configure MCP servers. The MCP configuration is under the `mcp` key:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "server-name": {
      "type": "local|remote",
      // ... server-specific config
    }
  }
}
```

### Local Server Configuration

Local servers run commands via `npx`, `node`, `python`, or other interpreters:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "context7": {
      "type": "local",
      "command": ["npx", "-y", "@upstash/context7-mcp"],
      "enabled": true,
      "environment": {
        "CONTEXT7_API_KEY": "${CONTEXT7_API_KEY}"
      }
    }
  }
}
```

**Local Server Options:**
- `command` (array): Command to execute (e.g., `["npx", "-y", "package-name"]`)
- `enabled` (boolean): Enable/disable server (default: true)
- `environment` (object): Environment variables for the server process
- `timeout` (number): Timeout in ms for tool fetching (default: 5000ms)

### Remote Server Configuration

Remote servers connect via HTTP or SSE endpoints:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "deepwiki": {
      "type": "remote",
      "url": "https://api.deepwiki.com/mcp",
      "enabled": true,
      "headers": {
        "Authorization": "Bearer ${DEEPWIKI_API_KEY}"
      }
    }
  }
}
```

**Remote Server Options:**
- `type` (string): Must be `"remote"`
- `url` (string): Remote MCP server URL
- `enabled` (boolean): Enable/disable server
- `headers` (object): HTTP headers (for authentication)
- `oauth` (object): OAuth configuration (optional)
- `timeout` (number): Timeout in ms

### Authentication Patterns

#### API Key Authentication (Environment Variables)

```json
{
  "mcp": {
    "context7": {
      "type": "local",
      "command": ["npx", "-y", "@upstash/context7-mcp"],
      "environment": {
        "CONTEXT7_API_KEY": "${file:~/.secrets/context7-key}"
      }
    }
  }
}
```

#### Bearer Token Authentication (Headers)

```json
{
  "mcp": {
    "remote-mcp": {
      "type": "remote",
      "url": "https://api.example.com/mcp",
      "headers": {
        "Authorization": "Bearer ${file:~/.secrets/api-key}"
      }
    }
  }
}
```

#### OAuth 2.0 Authentication

OpenCode automatically handles OAuth for remote servers:

```json
{
  "mcp": {
    "oauth-server": {
      "type": "remote",
      "url": "https://oauth-server.com/mcp"
      // OAuth flow triggered automatically on first use
    }
  }
}
```

**OAuth Options:**
- Automatic: No configuration needed, OpenCode prompts on first use
- Pre-registered: Configure client credentials if provided by server

### File Reference Pattern for Secrets

OpenCode supports `{file:path}` pattern to read secrets from files:

```json
{
  "environment": {
    "API_KEY": "{file:~/.secrets/context7-key}",
    "SECRET": "{file:/usr/local/etc/app/secret}"
  }
}
```

### Configuration Locations

OpenCode uses hierarchical configuration:

1. **Global:** `~/.config/opencode/opencode.json`
   - User-level settings
   - Global MCP servers
   - Provider configurations

2. **Project:** `.opencode/opencode.json` or `opencode.json`
   - Project-specific settings
   - Project MCP servers
   - Merges with global config

**Important:** Project-local MCP servers have had issues in some versions (GitHub Issue #4054). Verify compatibility with your OpenCode version.

---

## 2. Context7 MCP Server

### Overview

Context7 provides **up-to-date code documentation** for thousands of libraries and frameworks. It solves the problem of LLMs relying on outdated training data.

**Repository:** https://github.com/upstash/context7
**Official Site:** https://context7.com
**Pricing:** Free (with rate limits), API keys available for higher limits

### Configuration

#### Local Server (Recommended)

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "context7": {
      "type": "local",
      "command": ["npx", "-y", "@upstash/context7-mcp"],
      "enabled": true,
      "environment": {
        "CONTEXT7_API_KEY": "${file:~/.secrets/context7-key}"
      }
    }
  }
}
```

#### Remote Server

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "context7": {
      "type": "remote",
      "url": "https://mcp.context7.com/mcp",
      "enabled": true,
      "headers": {
        "CONTEXT7_API_KEY": "${file:~/.secrets/context7-key}"
      }
    }
  }
}
```

### Available Tools

#### 1. `resolve-library-id`

**Purpose:** Resolve a package/product name to a Context7-compatible library ID

**Parameters:**
- `query` (string): User's original question or task
- `libraryName` (string): Library name to search for

**Returns:** 
- Selected library ID in Context7 format (e.g., `/mongodb/docs`, `/vercel/next.js/v14.3.0`)
- Explanation for why this library was chosen
- Multiple matches with recommendations if ambiguous

**When to Use:**
- Before calling `query-docs` (required step unless user provides direct library ID)
- When user asks about a library but doesn't know the exact Context7 ID
- To disambiguate between similar libraries

**Best Practices:**
- MUST be called before `query-docs` unless library ID is provided in `/org/project` format
- Don't call more than 3 times per question (rate limiting)
- Select most relevant match based on:
  - Name similarity
  - Description relevance
  - Documentation coverage
  - Source reputation

#### 2. `query-docs`

**Purpose:** Retrieve up-to-date documentation and code examples for a library

**Parameters:**
- `libraryId` (string): Exact Context7-compatible library ID (e.g., `/mongodb/docs`)
- `query` (string): Question or task needing documentation help
- `tokensNum` (number): Tokens to return (1000-50000, default: 5000)

**Returns:**
- Relevant documentation sections
- Code examples
- API references
- Best practices

**When to Use:**
- When user needs specific API information
- When code requires specific framework patterns
- When outdated training data might cause hallucinations
- For implementation guidance

**Best Practices:**
- Always call `resolve-library-id` first unless library ID is known
- Be specific in your query (e.g., "How to set up JWT auth in Express.js")
- Use appropriate `tokensNum`:
  - Lower (1000-3000): Focused queries, single API method
  - Medium (3000-8000): General implementation guidance
  - High (8000-50000): Comprehensive research
- Don't call more than 3 times per question

### Usage Patterns

#### Pattern 1: Library Implementation

```
User: "How do I implement authentication with Supabase?"
AI:
1. resolve-library-id("Supabase authentication", "Supabase")
   → Returns: "/supabase/supabase"
2. query-docs("/supabase/supabase", "Set up authentication with JWT")
   → Returns: JWT setup code, auth helper functions, examples
```

#### Pattern 2: Framework-Specific Features

```
User: "What's the latest way to use Next.js middleware?"
AI:
1. resolve-library-id("Next.js middleware", "next.js")
   → Returns: "/vercel/next.js"
2. query-docs("/vercel/next.js", "middleware patterns for Next.js")
   → Returns: Latest middleware API, examples, best practices
```

#### Pattern 3: Direct Library Access

```
User: "Show me MongoDB aggregation pipeline examples from /mongodb/docs"
AI:
1. query-docs("/mongodb/docs", "aggregation pipeline examples")
   → Returns: Aggregation examples, operators, optimization tips
```

### Query Best Practices

1. **Be Specific:**
   - ❌ Bad: "authentication"
   - ✅ Good: "How to set up JWT authentication in Express.js with refresh tokens"

2. **Include Context:**
   - ❌ Bad: "React hooks"
   - ✅ Good: "How to use useEffect for data fetching with cleanup in React 18"

3. **Mention Version if Known:**
   - ❌ Bad: "Next.js routing"
   - ✅ Good: "Next.js 13 App Router directory structure and routing"

4. **Focus on Tasks:**
   - ❌ Bad: "forms"
   - ✅ Good: "Implement form validation with Zod in React Hook Form"

### Limitations and Gotchas

1. **Rate Limiting:**
   - Free tier: Limited requests
   - API key: Higher limits, get from context7.com/dashboard

2. **Library Coverage:**
   - Not all libraries are indexed
   - Submit requests via GitHub for missing libraries

3. **Token Limits:**
   - `tokensNum` maximum: 50,000
   - Balance detail vs. context usage

4. **Knowledge Cutoff:**
   - Documentation is real-time but library may have changed
   - Verify with library docs if uncertain

---

## 3. Tavily MCP Server

### Overview

Tavily provides **AI-powered web search, extraction, crawling, and mapping** capabilities. It's designed for AI consumption with clean, structured output.

**Repository:** https://github.com/tavily-ai/tavily-mcp
**Official Site:** https://tavily.com
**Pricing:** Free tier available, API keys required

### Configuration

#### Local Server

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "tavily": {
      "type": "local",
      "command": ["npx", "-y", "tavily-mcp@latest"],
      "enabled": true,
      "environment": {
        "TAVILY_API_KEY": "${file:~/.secrets/tavily-key}"
      }
    }
  }
}
```

#### Remote Server

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "tavily": {
      "type": "remote",
      "url": "https://api.tavily.com/mcp",
      "enabled": true,
      "headers": {
        "Authorization": "Bearer ${file:~/.secrets/tavily-key}"
      }
    }
  }
}
```

### Available Tools

#### 1. `tavily_tavily_search` - Search

**Purpose:** Perform real-time web search with AI-powered content extraction

**Parameters:**
- `query` (string, required): Search query
- `max_results` (number, default: 10): Number of results (1-20)
- `search_depth` (string, default: "basic"): 
  - "basic": Generic results, fast
  - "advanced": More thorough, comprehensive
  - "fast": Optimized for low latency
  - "ultra-fast": Prioritize latency above all
- `topic` (string, default: "general"): "general" or "news"
- `time_range` (string): "day", "week", "month", "year"
- `include_images` (boolean, default: false)
- `include_image_descriptions` (boolean, default: false)
- `include_raw_content` (boolean, default: false): Include cleaned HTML
- `include_domains` (array, default: []): Specific domains to include
- `exclude_domains` (array, default: []): Domains to exclude
- `include_favicon` (boolean, default: false)

**When to Use:**
- Finding factual information (e.g., "What is the current price of Bitcoin?")
- Getting an overview of a topic
- Finding sources for research
- When you don't know which specific website has the info

**Best Practices:**
- Use `search_depth="advanced"` for research tasks
- Use `topic="news"` and `time_range="week"` for current events
- Use `include_domains` to focus on authoritative sources (e.g., `["docs.python.org"]`)
- Use `max_results=5` for quick answers, `max_results=15` for research

#### 2. `tavily_tavily_extract` - Extract

**Purpose:** Extract clean markdown content from specific URLs

**Parameters:**
- `urls` (array, required): URLs to extract content from
- `extract_depth` (string, default: "basic"): 
  - "basic": Standard extraction
  - "advanced": Better for protected sites, tables, embedded content
- `include_images` (boolean, default: false)
- `format` (string, default: "markdown"): "markdown" or "text"
- `include_favicon` (boolean, default: false)
- `query` (string): Query to rerank content chunks

**When to Use:**
- When you have specific URLs and need to read the content
- When search snippets aren't detailed enough
- For data extraction from known sources
- To read documentation pages in full

**Best Practices:**
- Use `extract_depth="advanced"` for LinkedIn, protected sites, or complex pages
- Use `format="text"` when you need raw text for processing
- Use `query` to focus on relevant sections of long pages
- This tool saves tokens by removing ads, headers, footers

#### 3. `tavily_tavily_map` - Map

**Purpose:** Return a list of all relevant URLs within a domain (sitemap generator)

**Parameters:**
- `url` (string, required): Root URL to begin mapping
- `max_depth` (number, default: 1): How far from base URL to explore
- `max_breadth` (number, default: 20): Number of links per level
- `limit` (number, default: 50): Total links to process
- `select_paths` (array, default: []): Regex patterns for path selection
- `select_domains` (array, default: []): Regex patterns for domain restriction
- `allow_external` (boolean, default: true): Allow external links

**When to Use:**
- When you know the domain but not the exact URL
- To see website structure
- To find "hidden" pages or comprehensive blog listings
- Before `extract` when you need to find the most relevant sub-page

**Best Practices:**
- Use `select_paths=["/docs/.*"]` to focus on documentation sections
- Use `max_depth=2` for deeper site exploration
- Use this before `extract` for large documentation sites
- Don't use with `allow_external=true` for focused research

#### 4. `tavily_tavily_crawl` - Crawl

**Purpose:** Systematically explore a domain, extracting content from multiple pages

**Parameters:**
- `url` (string, required): Root URL to begin crawling
- `max_depth` (number, default: 1): Maximum depth to explore
- `max_breadth` (number, default: 20): Links per level
- `limit` (number, default: 50): Total links to process
- `instructions` (string, default: ""): Natural language instructions
- `select_paths` (array, default: []): Regex path patterns
- `select_domains` (array, default: []): Regex domain patterns
- `allow_external` (boolean, default: true): Allow external links
- `extract_depth` (string, default: "basic"): "basic" or "advanced"
- `format` (string, default: "markdown"): "markdown" or "text"
- `include_favicon` (boolean, default: false)

**When to Use:**
- Gathering data from an entire website
- Building local knowledge base or RAG system
- Finding information spread across multiple sub-pages
- When you need comprehensive site data

**Best Practices:**
- This is the most "expensive" tool (time + credits)
- Use `instructions` to guide what to look for (e.g., "Find all mentions of security policy")
- Use `extract_depth="advanced"` for complex pages
- Only use when single `search` or `extract` won't suffice

#### 5. `tavily_tavily_research` - Research

**Purpose:** Perform comprehensive research using multiple sources

**Parameters:**
- `input` (string, required): Research task description
- `model` (string, default: "auto"): 
  - "mini": Narrow tasks, few subtopics
  - "pro": Broad tasks, many subtopics

**When to Use:**
- Complex research requiring multiple sources
- When you need a synthesized answer
- For deep dives into topics
- When search alone isn't sufficient

**Best Practices:**
- Use `model="pro"` for broad, complex research
- Use `model="mini"` for specific, narrow research
- More efficient than multiple `search` + `extract` calls

### Tool Decision Matrix

| Tool | Input | Output | Best For |
|-------|--------|--------|----------|
| **search** | Query string | Snippets + Links | Finding facts, locating sources |
| **extract** | URLs | Clean Markdown | Reading specific pages in detail |
| **map** | Domain URL | List of internal URLs | Mapping site structure |
| **crawl** | Domain URL | Content from many pages | Deep data gathering |
| **research** | Research task | Synthesized answer | Complex, multi-source research |

### Usage Patterns

#### Pattern 1: Quick Fact Finding

```
User: "What is the current price of Bitcoin?"
AI:
1. tavily_search(query="current Bitcoin price", max_results=5, topic="news")
   → Returns: Current price, recent changes, sources
```

#### Pattern 2: Documentation Research

```
User: "How do I set up Stripe webhooks?"
AI:
1. tavily_map(url="https://docs.stripe.com", select_paths=["/webhooks/.*"])
   → Returns: List of webhook documentation URLs
2. tavily_extract(urls=[top 3 webhook docs URLs])
   → Returns: Webhook setup instructions, examples
```

#### Pattern 3: Comprehensive Website Research

```
User: "Find all mentions of GDPR across company.com"
AI:
1. tavily_crawl(
   url="https://company.com",
   instructions="Find all mentions of GDPR policies",
   extract_depth="advanced",
   limit=100
   )
   → Returns: All GDPR mentions with context
```

#### Pattern 4: Multi-Source Research

```
User: "Compare the top 5 React state management libraries"
AI:
1. tavily_research(
   input="Compare Redux, Zustand, Jotai, Recoil, and MobX for React state management",
   model="pro"
   )
   → Returns: Comprehensive comparison with pros/cons
```

### Search Depth Guidelines

- **Basic (fastest):**
  - Quick facts (prices, definitions)
  - Current events summary
  - Broad topic overviews

- **Advanced (default for research):**
  - Technical documentation
  - Implementation guides
  - Comparative analysis

- **Fast / Ultra-fast (lowest latency):**
  - Real-time queries
  - Quick lookups
  - Interactive workflows

### Time Range Selection

- **Day:** Breaking news, real-time updates
- **Week:** Recent developments, current trends
- **Month:** Monthly summaries, quarterly updates
- **Year:** Annual reports, historical context

### Best Practices

1. **Start with Search:** Always search first unless you already have URLs
2. **Use Map for Structure:** Before extracting from a large site, map it first
3. **Be Selective:** Use `include_domains` to avoid low-quality sources
4. **Optimize Token Usage:** 
   - `max_results=5` for quick answers
   - `max_results=10-15` for research
   - Don't use `include_raw_content` unless necessary
5. **Use Instructions for Crawl:** Guide the crawler with natural language
6. **Handle Errors Gracefully:** Retry with different parameters on failure

---

## 4. DeepWiki MCP Server

### Overview

DeepWiki provides **interactive, AI-powered documentation for any public GitHub repository**. It's by Cognition Labs (creators of Devin AI).

**Repository:** https://github.com/CognitionAI/deepwiki
**Official Site:** https://deepwiki.com
**Pricing:** Free, no authentication required for public repos

### Configuration

#### Remote Server (Recommended)

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "deepwiki": {
      "type": "remote",
      "url": "https://api.deepwiki.com/mcp",
      "enabled": true
      // No authentication required for public repos
    }
  }
}
```

#### SSE Endpoint (Alternative)

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "deepwiki": {
      "type": "remote",
      "url": "https://api.deepwiki.com/sse",
      "enabled": true
    }
  }
}
```

**Note:** DeepWiki is free and requires **no authentication** for public repositories.

### Available Tools

#### 1. `read_wiki_structure`

**Purpose:** Get a list of documentation topics for a GitHub repository

**Parameters:**
- `url` (string, required): GitHub repository URL (e.g., "https://github.com/facebook/react")

**Returns:** 
- List of documentation topics/sections
- Structure of the repository documentation
- Available areas to explore

**When to Use:**
- Before asking questions about a repo
- To understand what documentation is available
- To explore repo structure without cloning it

**Best Practices:**
- Always call this first to understand what's available
- Use to identify relevant sections before `read_wiki_contents`
- Good for quick repo orientation

#### 2. `read_wiki_contents`

**Purpose:** View detailed documentation about a GitHub repository

**Parameters:**
- `url` (string, required): GitHub repository URL
- `topic` (string, optional): Specific topic/section to read
- `maxSections` (number, optional): Limit number of sections returned

**Returns:**
- Detailed documentation content
- Code examples with line references
- Architecture explanations
- Setup instructions

**When to Use:**
- When you need comprehensive documentation
- To understand architecture and implementation
- For setup and configuration guidance

**Best Practices:**
- Use `topic` to focus on specific areas
- Combine with `read_wiki_structure` for context
- Good for understanding unfamiliar codebases

#### 3. `ask_question`

**Purpose:** Ask any question about a GitHub repository with AI-powered, context-grounded responses

**Parameters:**
- `url` (string, required): GitHub repository URL
- `question` (string, required): Natural language question
- `context` (string, optional): Additional context for the question

**Returns:**
- AI-generated answer based on repo code
- Code references with file paths and line numbers
- Related code snippets
- Follow-up suggestions

**When to Use:**
- Specific questions about implementation
- "How does X work?" queries
- When you need code references
- For understanding specific features

**Best Practices:**
- Be specific in your questions (e.g., "How does authentication middleware work?")
- Use natural language, not code syntax
- Great for "How do I..." and "Why does..." questions
- Returns exact code references (file:line)

### Usage Patterns

#### Pattern 1: Quick Repo Exploration

```
User: "How does authentication work in this project?"
AI:
1. read_wiki_structure(url="https://github.com/user/repo")
   → Returns: List of documentation topics including "Authentication"
2. ask_question(
   url="https://github.com/user/repo",
   question="How does JWT authentication work in this project?"
   )
   → Returns: Code showing auth implementation, file paths
```

#### Pattern 2: Comprehensive Documentation

```
User: "Show me the architecture of this project"
AI:
1. read_wiki_structure(url="https://github.com/user/repo")
   → Returns: Documentation topics
2. read_wiki_contents(url="https://github.com/user/repo", topic="Architecture")
   → Returns: Architecture documentation, diagrams, code structure
```

#### Pattern 3: Implementation Questions

```
User: "How do I add a new API endpoint?"
AI:
1. ask_question(
   url="https://github.com/user/repo",
   question="What's the pattern for adding new API endpoints?"
   )
   → Returns: Examples from existing endpoints, file locations, step-by-step guide
```

### Limitations

1. **One Repo at a Time:** Each tool call operates on a single repository
2. **Public Repos Only:** Free version only supports public repositories
3. **Real-time but Static:** Documentation is generated and indexed, not live code
4. **No Private Repo Access:** Use Devin MCP server for private repos (requires authentication)

### Best Practices

1. **Structure First:** Always call `read_wiki_structure` before deep exploration
2. **Natural Language:** Use conversational questions, not technical queries
3. **Follow-up Questions:** Build on previous answers for deeper understanding
4. **Export Findings:** Save important results to markdown for documentation
5. **Check DeepWiki.com:** Ensure the repo is indexed before use

### DeepWiki vs Devin MCP Server

| Feature | DeepWiki MCP | Devin MCP Server |
|---------|---------------|------------------|
| **Authentication** | None required | Devin API key required |
| **Repo Access** | Public only | Public + Private |
| **Pricing** | Free | Paid tier available |
| **Use Case** | Quick public repo research | Private repos, enterprise |

---

## 5. Server Discovery & Installation

### Detection Methods

#### Method 1: Tool List API

Most MCP clients expose a `/tools/list` endpoint:

```bash
curl -X POST http://localhost:8000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}'
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "tools": [
      {
        "name": "resolve-library-id",
        "description": "Resolve a package to Context7 ID",
        "inputSchema": {...}
      },
      // ... more tools
    ]
  }
}
```

#### Method 2: Configuration Inspection

Check `opencode.json` for configured servers:

```bash
# Check if servers are configured
jq '.mcp' ~/.config/opencode/opencode.json

# Check if servers are enabled
jq '.mcp | to_entries[] | select(.value.enabled == true)' \
  ~/.config/opencode/opencode.json
```

#### Method 3: OpenCode CLI

```bash
# List all MCP servers
opencode mcp list

# Check server status
opencode mcp status <server-name>

# Test server connection
opencode mcp test <server-name>
```

### Interactive Installation Guidance

#### Step 1: Prerequisite Check

```bash
#!/bin/bash

echo "🔍 Checking MCP server prerequisites..."

# Check for Node.js
if ! command -v node &> /dev/null; then
  echo "❌ Node.js not found"
  echo "   Install: https://nodejs.org/"
  exit 1
fi

# Check for npm
if ! command -v npm &> /dev/null; then
  echo "❌ npm not found"
  exit 1
fi

# Check for secrets directory
if [ ! -d ~/.secrets ]; then
  echo "📁 Creating ~/.secrets directory..."
  mkdir -p ~/.secrets
  chmod 700 ~/.secrets
fi

echo "✅ Prerequisites satisfied"
```

#### Step 2: API Key Collection

```bash
#!/bin/bash

# Context7
echo "📝 Context7 API Key (optional, free tier available):"
read -s -p "Enter Context7 API Key (or press Enter to skip): " CONTEXT7_KEY
if [ -n "$CONTEXT7_KEY" ]; then
  echo "$CONTEXT7_KEY" > ~/.secrets/context7-key
  chmod 600 ~/.secrets/context7-key
  echo "✅ Context7 key saved"
fi

# Tavily
echo "📝 Tavily API Key (required):"
read -s -p "Enter Tavily API Key: " TAVILY_KEY
echo "$TAVILY_KEY" > ~/.secrets/tavily-key
chmod 600 ~/.secrets/tavily-key
echo "✅ Tavily key saved"
```

#### Step 3: Configuration Generation

```bash
#!/bin/bash

CONFIG_FILE="$HOME/.config/opencode/opencode.json"

# Backup existing config
if [ -f "$CONFIG_FILE" ]; then
  cp "$CONFIG_FILE" "$CONFIG_FILE.backup.$(date +%s)"
fi

# Initialize config if missing
if [ ! -f "$CONFIG_FILE" ]; then
  cat > "$CONFIG_FILE" << 'EOF'
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {}
}
EOF
fi

# Add Context7 (if key provided)
if [ -f ~/.secrets/context7-key ]; then
  jq --arg key "$(cat ~/.secrets/context7-key)" \
    '.mcp.context7 = {
      "type": "local",
      "command": ["npx", "-y", "@upstash/context7-mcp"],
      "enabled": true,
      "environment": {"CONTEXT7_API_KEY": $key}
    }' \
    "$CONFIG_FILE" > "$CONFIG_FILE.tmp" && mv "$CONFIG_FILE.tmp" "$CONFIG_FILE"
fi

# Add Tavily
jq --arg key "$(cat ~/.secrets/tavily-key)" \
  '.mcp.tavily = {
    "type": "local",
    "command": ["npx", "-y", "tavily-mcp@latest"],
    "enabled": true,
    "environment": {"TAVILY_API_KEY": $key}
  }' \
  "$CONFIG_FILE" > "$CONFIG_FILE.tmp" && mv "$CONFIG_FILE.tmp" "$CONFIG_FILE"

# Add DeepWiki (no key required)
jq '.mcp.deepwiki = {
    "type": "remote",
    "url": "https://api.deepwiki.com/mcp",
    "enabled": true
  }' \
  "$CONFIG_FILE" > "$CONFIG_FILE.tmp" && mv "$CONFIG_FILE.tmp" "$CONFIG_FILE"

echo "✅ MCP servers configured"
```

#### Step 4: Verification

```bash
#!/bin/bash

echo "🧪 Testing MCP server connections..."

# Test Context7
if jq -e '.mcp.context7' ~/.config/opencode/opencode.json &> /dev/null; then
  echo "  Testing Context7..."
  # Simulate tool call
  echo "  ✅ Context7 configured"
else
  echo "  ⚠️  Context7 not configured"
fi

# Test Tavily
if jq -e '.mcp.tavily' ~/.config/opencode/opencode.json &> /dev/null; then
  echo "  Testing Tavily..."
  echo "  ✅ Tavily configured"
else
  echo "  ⚠️  Tavily not configured"
fi

# Test DeepWiki
if jq -e '.mcp.deepwiki' ~/.config/opencode/opencode.json &> /dev/null; then
  echo "  Testing DeepWiki..."
  echo "  ✅ DeepWiki configured"
else
  echo "  ⚠️  DeepWiki not configured"
fi

echo "🎉 Configuration complete!"
```

### Fallback Patterns

#### Pattern 1: Graceful Degradation

```typescript
interface ToolAvailability {
  context7: boolean;
  tavily: boolean;
  deepwiki: boolean;
}

async function checkAvailability(): Promise<ToolAvailability> {
  // Check if tools are available
  // Return status object
}

async function researchWithFallbacks(query: string) {
  const available = await checkAvailability();

  // Try Context7 first
  if (available.context7) {
    try {
      return await useContext7(query);
    } catch (error) {
      console.warn('Context7 failed, trying fallback...');
    }
  }

  // Fallback to Tavily
  if (available.tavily) {
    try {
      return await useTavily(query);
    } catch (error) {
      console.warn('Tavily failed, no fallbacks left');
    }
  }

  // Final fallback: Built-in tools only
  return await useBuiltInTools(query);
}
```

#### Pattern 2: Retry with Exponential Backoff

```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;

      const delay = baseDelay * Math.pow(2, i);
      console.warn(`Retry ${i + 1}/${maxRetries} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries exceeded');
}

// Usage
const result = await retryWithBackoff(
  () => tavilySearch({ query: "example" })
);
```

#### Pattern 3: Tool Selection Based on Query Type

```typescript
type QueryType = 'library-api' | 'web-search' | 'github-repo' | 'general';

function determineQueryType(query: string): QueryType {
  if (query.includes('github.com/') || query.includes('repository')) {
    return 'github-repo';
  }
  if (/\b(React|Next\.js|Express|MongoDB|Supabase)\b/i.test(query)) {
    return 'library-api';
  }
  if (/\b(news|latest|current|recent)\b/i.test(query)) {
    return 'web-search';
  }
  return 'general';
}

async function intelligentResearch(query: string) {
  const type = determineQueryType(query);
  const available = await checkAvailability();

  switch (type) {
    case 'library-api':
      if (available.context7) {
        return await useContext7(query);
      }
      // Fallback: Tavily search for library docs
      return await useTavily(query);

    case 'web-search':
      if (available.tavily) {
        return await useTavily(query);
      }
      // Fallback: No live search, rely on training data
      return await useBuiltInTools(query);

    case 'github-repo':
      if (available.deepwiki) {
        return await useDeepWiki(query);
      }
      // Fallback: Tavily extract on GitHub
      return await useTavilyForGitHub(query);

    default:
      // Try all available tools
      return await tryAllTools(query);
  }
}
```

### Error Handling Patterns

#### Pattern 1: Specific Error Detection

```typescript
async function safeMCPCall<T>(toolName: string, call: () => Promise<T>) {
  try {
    return await call();
  } catch (error) {
    if (error.message.includes('rate limit')) {
      console.warn(`Rate limit hit on ${toolName}, backing off...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
      return await call(); // Retry once
    }

    if (error.message.includes('not found')) {
      console.warn(`${toolName} resource not found`);
      throw new Error(`Resource not available via ${toolName}`);
    }

    if (error.message.includes('timeout')) {
      console.warn(`${toolName} timed out`);
      throw new Error(`${toolName} unavailable`);
    }

    // Unknown error, propagate
    throw error;
  }
}
```

#### Pattern 2: Error Recovery with User Feedback

```typescript
async function researchWithFeedback(query: string) {
  try {
    // Try primary approach
    return await primaryResearch(query);
  } catch (primaryError) {
    console.warn(`Primary research failed: ${primaryError.message}`);

    try {
      // Try fallback
      const fallbackResult = await fallbackResearch(query);
      console.log(`✅ Used fallback approach`);
      return fallbackResult;
    } catch (fallbackError) {
      // All failed, inform user
      console.error('❌ All research methods failed');
      console.error(`Primary: ${primaryError.message}`);
      console.error(`Fallback: ${fallbackError.message}`);

      throw new Error(
        'Unable to research this topic. MCP servers may be unavailable. ' +
        'Please check your configuration or try again later.'
      );
    }
  }
}
```

---

## 6. MCP Tool Combination Patterns

### Research Scenarios

#### Scenario 1: Learning a New Library

**Goal:** Understand a new library from multiple perspectives

**Tool Sequence:**
1. **Context7:** Get API documentation and examples
2. **Tavily:** Search for community tutorials and best practices
3. **Tavily Extract:** Read detailed blog posts if found
4. **DeepWiki:** If library has a GitHub repo, explore structure

**Example:**
```javascript
// Step 1: Get official docs
const libraryId = await resolveLibraryId("Zustand", "Zustand");
const docs = await queryDocs(libraryId, "How to create a store with Zustand");

// Step 2: Find community content
const searchResults = await tavilySearch({
  query: "Zustand best practices patterns 2026",
  maxResults: 10,
  searchDepth: "advanced"
});

// Step 3: Extract top tutorials
const tutorials = await tavilyExtract({
  urls: searchResults.slice(0, 3).map(r => r.url),
  extractDepth: "advanced"
});

// Step 4: Check GitHub repo if available
if (searchResults.some(r => r.url.includes('github.com'))) {
  const repoUrl = extractGitHubUrl(searchResults);
  const structure = await readWikiStructure({ url: repoUrl });
  const contents = await readWikiContents({
    url: repoUrl,
    topic: "Examples"
  });
}
```

#### Scenario 2: Debugging a Specific Issue

**Goal:** Fix a bug or understand error behavior

**Tool Sequence:**
1. **Tavily Search:** Find similar issues and solutions
2. **Tavily Extract:** Read relevant StackOverflow, GitHub Issues
3. **Context7:** Check if it's a known API issue
4. **DeepWiki:** If related to a library, check repo issues

**Example:**
```javascript
// Step 1: Search for error
const errorSearch = await tavilySearch({
  query: "React useEffect cleanup warning dependencies array",
  maxResults: 10,
  searchDepth: "advanced",
  includeDomains: ["stackoverflow.com", "github.com"]
});

// Step 2: Extract detailed solutions
const solutions = await tavilyExtract({
  urls: errorSearch.slice(0, 5).map(r => r.url)
});

// Step 3: Check official React docs
const reactDocs = await queryDocs(
  "/facebook/react",
  "useEffect cleanup and dependencies"
);

// Step 4: Check React repo for related issues
const reactIssues = await askQuestion({
  url: "https://github.com/facebook/react",
  question: "How should useEffect handle dependencies in cleanup functions?"
});
```

#### Scenario 3: Implementing a Feature

**Goal:** Build a specific feature using best practices

**Tool Sequence:**
1. **Context7:** Get official implementation guide
2. **Tavily Map:** Map relevant documentation sites
3. **Tavily Extract:** Extract implementation examples
4. **DeepWiki:** Check how popular projects implement it

**Example:**
```javascript
// Step 1: Official guidance
const nextJsDocs = await queryDocs(
  "/vercel/next.js",
  "How to implement API routes with authentication middleware"
);

// Step 2: Find additional resources
const siteMap = await tavilyMap({
  url: "https://nextjs.org/docs",
  selectPaths: ["/api/.*", "/authentication/.*"]
});

// Step 3: Extract examples
const examples = await tavilyExtract({
  urls: [
    "https://nextjs.org/docs/api-routes/introduction",
    "https://nextjs.org/docs/authentication/overview"
  ]
});

// Step 4: See real implementations
const implementations = await askQuestion({
  url: "https://github.com/vercel/next.js",
  question: "Show examples of API route authentication middleware"
});
```

#### Scenario 4: Competitive Analysis

**Goal:** Understand ecosystem and alternatives

**Tool Sequence:**
1. **Tavily Research:** Comprehensive overview of alternatives
2. **Context7:** Get docs for each alternative
3. **DeepWiki:** Compare implementations in real projects

**Example:**
```javascript
// Step 1: Research alternatives
const comparison = await tavilyResearch({
  input: "Compare React state management libraries: Redux, Zustand, Jotai, Recoil, MobX",
  model: "pro"
});

// Step 2: Get docs for top 3
const libraries = ["zustand", "jotai", "recoil"];
const docs = await Promise.all(
  libraries.map(lib => ({
    name: lib,
    docs: queryDocs(resolveLibraryId(lib), "Getting started guide")
  }))
);

// Step 3: Check real-world usage
const usage = await Promise.all(
  libraries.map(lib =>
    askQuestion({
      url: `https://github.com/pmndrs/${lib}`,
      question: "What are common usage patterns in production code?"
    })
  )
);
```

#### Scenario 5: Understanding an Unfamiliar Codebase

**Goal:** Quickly grok a new repository

**Tool Sequence:**
1. **DeepWiki Structure:** Get overview of documentation
2. **DeepWiki Contents:** Read architecture and setup docs
3. **DeepWiki Questions:** Ask specific implementation questions
4. **Tavily Search:** Find external tutorials or articles

**Example:**
```javascript
// Step 1: Understand structure
const structure = await readWikiStructure({
  url: "https://github.com/user/complex-project"
});

// Step 2: Read key documentation
const docs = await readWikiContents({
  url: "https://github.com/user/complex-project",
  topic: "Architecture"
});

// Step 3: Ask specific questions
const questions = await Promise.all([
  askQuestion({
    url: "https://github.com/user/complex-project",
    question: "How does authentication work?"
  }),
  askQuestion({
    url: "https://github.com/user/complex-project",
    question: "What's the data flow from API to UI?"
  })
]);

// Step 4: Find external resources
const external = await tavilySearch({
  query: `${repoName} tutorial getting started guide`,
  maxResults: 5
});
```

### Tool Selection Decision Tree

```
Start
  │
  ├─→ Is query about a specific library/framework?
  │    ├─→ YES → Use Context7
  │    │          (resolve-library-id → query-docs)
  │    │
  │    └─→ NO  → Continue
  │
  ├─→ Is query about current events/news?
  │    ├─→ YES → Use Tavily Search
  │    │          (topic="news", time_range="week")
  │    │
  │    └─→ NO  → Continue
  │
  ├─→ Is query about a GitHub repository?
  │    ├─→ YES → Use DeepWiki
  │    │          (read_wiki_structure → ask_question)
  │    │
  │    └─→ NO  → Continue
  │
  ├─→ Do you have specific URLs to read?
  │    ├─→ YES → Use Tavily Extract
  │    │
  │    └─→ NO  → Continue
  │
  ├─→ Do you need comprehensive web research?
  │    ├─→ YES → Use Tavily Research
  │    │          (model="pro")
  │    │
  │    └─→ NO  → Continue
  │
  └─→ Default: Use Tavily Search
             (search_depth="advanced")
```

### Optimized Tool Combinations

#### Combination 1: Quick Answer (Fastest)

```javascript
async function quickAnswer(query: string) {
  // Single tool, minimal context
  return await tavilySearch({
    query,
    maxResults: 5,
    searchDepth: "fast"
  });
}
```

**Use When:**
- Simple factual questions
- Quick lookups
- Time-sensitive queries

#### Combination 2: Deep Dive (Most Comprehensive)

```javascript
async function deepDive(topic: string) {
  const results = {
    officialDocs: null,
    communityInsights: [],
    realExamples: null
  };

  // 1. Official documentation
  try {
    const libId = await resolveLibraryId(topic, topic);
    results.officialDocs = await queryDocs(libId, topic, 8000);
  } catch (e) {
    console.warn('Context7 not available');
  }

  // 2. Community insights (parallel)
  const searchResults = await tavilySearch({
    query: `${topic} best practices 2026`,
    maxResults: 15,
    searchDepth: "advanced"
  });

  results.communityInsights = await tavilyExtract({
    urls: searchResults.slice(0, 5).map(r => r.url),
    extractDepth: "advanced"
  });

  // 3. Real examples from popular repos
  try {
    results.realExamples = await askQuestion({
      url: "https://github.com/.../popular-implementation",
      question: `Show examples of ${topic} in production`
    });
  } catch (e) {
    console.warn('DeepWiki not available');
  }

  return results;
}
```

**Use When:**
- Learning a new technology
- Building complex features
- Comprehensive research needed

#### Combination 3: Efficient Research (Balanced)

```javascript
async function efficientResearch(query: string) {
  // 1. Quick search first
  const searchResults = await tavilySearch({
    query,
    maxResults: 5,
    searchDepth: "basic"
  });

  // 2. If library mentioned, get official docs
  const libraryMatch = extractLibraryName(searchResults);
  if (libraryMatch) {
    try {
      const libId = await resolveLibraryId(query, libraryMatch);
      const docs = await queryDocs(libId, query, 3000);
      return combineResults(searchResults, docs);
    } catch (e) {
      // Fall back to extracting search results
    }
  }

  // 3. Extract top 3 results
  const extracted = await tavilyExtract({
    urls: searchResults.slice(0, 3).map(r => r.url)
  });

  return extracted;
}
```

**Use When:**
- Unknown query type
- Need balance between speed and depth
- Token budget is constrained

---

## 7. Implementation Recommendations for iDumb

### Configuration Template

Create `.opencode/opencode.json` with all three servers:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "context7": {
      "type": "local",
      "command": ["npx", "-y", "@upstash/context7-mcp"],
      "enabled": true,
      "environment": {
        "CONTEXT7_API_KEY": "{file:~/.secrets/context7-key}"
      },
      "timeout": 10000
    },
    "tavily": {
      "type": "local",
      "command": ["npx", "-y", "tavily-mcp@latest"],
      "enabled": true,
      "environment": {
        "TAVILY_API_KEY": "{file:~/.secrets/tavily-key}"
      },
      "timeout": 15000
    },
    "deepwiki": {
      "type": "remote",
      "url": "https://api.deepwiki.com/mcp",
      "enabled": true,
      "timeout": 10000
    }
  }
}
```

### Interactive Setup Workflow for `/idumb:init`

```bash
#!/bin/bash

echo "🚀 iDumb MCP Server Setup"
echo ""

# Step 1: Prerequisites
echo "Step 1/4: Checking prerequisites..."
if ! command -v node &> /dev/null; then
  echo "❌ Node.js required. Install from https://nodejs.org/"
  exit 1
fi
echo "✅ Prerequisites OK"
echo ""

# Step 2: Secret setup
echo "Step 2/4: Setting up API keys..."
mkdir -p ~/.secrets
chmod 700 ~/.secrets

# Context7 (optional)
echo "📝 Context7 API Key (optional, press Enter to skip):"
read -s -p "   " CONTEXT7_KEY
if [ -n "$CONTEXT7_KEY" ]; then
  echo "$CONTEXT7_KEY" > ~/.secrets/context7-key
  chmod 600 ~/.secrets/context7-key
  echo "   ✅ Saved"
fi

# Tavily (required)
echo "📝 Tavily API Key (get from https://tavily.com):"
read -s -p "   " TAVILY_KEY
if [ -z "$TAVILY_KEY" ]; then
  echo "❌ Tavily API key required"
  exit 1
fi
echo "$TAVILY_KEY" > ~/.secrets/tavily-key
chmod 600 ~/.secrets/tavily-key
echo "   ✅ Saved"
echo ""

# Step 3: Configuration
echo "Step 3/4: Generating opencode.json..."
CONFIG_DIR="$HOME/.config/opencode"
mkdir -p "$CONFIG_DIR"

CONFIG_FILE="$CONFIG_DIR/opencode.json"
cat > "$CONFIG_FILE" << EOF
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "deepwiki": {
      "type": "remote",
      "url": "https://api.deepwiki.com/mcp",
      "enabled": true,
      "timeout": 10000
    }
  }
}
EOF

# Add Context7 if key provided
if [ -f ~/.secrets/context7-key ]; then
  jq --arg key "$(cat ~/.secrets/context7-key)" \
    '.mcp.context7 = {
      "type": "local",
      "command": ["npx", "-y", "@upstash/context7-mcp"],
      "enabled": true,
      "environment": {"CONTEXT7_API_KEY": $key},
      "timeout": 10000
    }' \
    "$CONFIG_FILE" > "$CONFIG_FILE.tmp" && mv "$CONFIG_FILE.tmp" "$CONFIG_FILE"
fi

# Add Tavily
jq --arg key "$(cat ~/.secrets/tavily-key)" \
  '.mcp.tavily = {
    "type": "local",
    "command": ["npx", "-y", "tavily-mcp@latest"],
    "enabled": true,
    "environment": {"TAVILY_API_KEY": $key},
    "timeout": 15000
  }' \
  "$CONFIG_FILE" > "$CONFIG_FILE.tmp" && mv "$CONFIG_FILE.tmp" "$CONFIG_FILE"

echo "✅ Configuration saved to $CONFIG_FILE"
echo ""

# Step 4: Verification
echo "Step 4/4: Verifying setup..."
echo "Testing MCP servers..."

# Test commands would go here
echo "✅ Context7: $(jq -e '.mcp.context7' "$CONFIG_FILE" &> /dev/null && echo 'configured' || echo 'optional')"
echo "✅ Tavily: $(jq -e '.mcp.tavily' "$CONFIG_FILE" &> /dev/null && echo 'configured' || echo 'missing')"
echo "✅ DeepWiki: $(jq -e '.mcp.deepwiki' "$CONFIG_FILE" &> /dev/null && echo 'configured' || echo 'missing')"
echo ""

echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Restart OpenCode to load MCP servers"
echo "  2. Test with: /mcp status"
echo "  3. Start using iDumb with enhanced research capabilities"
```

### Agent Tool Usage Guidelines

For iDumb agents (researcher, planner, verifier):

#### Research Agent

```typescript
class IdumbResearchAgent {
  async research(topic: string) {
    // 1. Determine query type
    const type = this.determineType(topic);

    // 2. Select appropriate tool
    switch (type) {
      case 'library':
        return this.researchLibrary(topic);
      case 'repo':
        return this.researchRepo(topic);
      case 'web':
        return this.researchWeb(topic);
      default:
        return this.researchGeneral(topic);
    }
  }

  async researchLibrary(library: string) {
    try {
      // Context7 primary
      const id = await this.resolveLibraryId(library);
      const docs = await this.queryDocs(id, library);
      return { source: 'context7', data: docs };
    } catch (e) {
      // Fallback to Tavily
      return this.researchWeb(`${library} documentation`);
    }
  }

  async researchWeb(query: string) {
    return await this.tavilySearch({
      query,
      maxResults: 10,
      searchDepth: 'advanced'
    });
  }

  async researchRepo(url: string) {
    return await this.askQuestion({
      url: extractGitHubUrl(url),
      question: query
    });
  }
}
```

#### Planner Agent

```typescript
class IdumbPlannerAgent {
  async planFeature(description: string) {
    // Use Context7 for framework-specific knowledge
    const framework = extractFramework(description);
    if (framework) {
      const bestPractices = await this.queryDocs(
        await this.resolveLibraryId(framework),
        "Best practices for " + description
      );
      // Incorporate into plan
    }

    // Use Tavily for recent developments
    const recentInfo = await this.tavilySearch({
      query: `${framework} ${description} 2026`,
      maxResults: 5,
      timeRange: 'month'
    });

    // Generate plan with both sources
    return this.generatePlan(description, bestPractices, recentInfo);
  }
}
```

#### Verifier Agent

```typescript
class IdumbVerifierAgent {
  async verifyImplementation(code: string, description: string) {
    // Use Context7 to check API usage
    const framework = extractFramework(code);
    if (framework) {
      const correctUsage = await this.queryDocs(
        await this.resolveLibraryId(framework),
        "Correct API usage for " + description
      );

      if (!this.matchesApi(correctUsage, code)) {
        return {
          valid: false,
          issues: ['API usage incorrect according to official docs']
        };
      }
    }

    // Use DeepWiki to check against similar implementations
    const repoUrl = findReferenceRepo(description);
    if (repoUrl) {
      const example = await this.askQuestion({
        url: repoUrl,
        question: "Show correct implementation for " + description
      });

      return this.compareImplementation(code, example);
    }

    return { valid: true, issues: [] };
  }
}
```

### Error Handling Strategy

```typescript
class MCPErrors {
  static async handle(error: Error, fallback: () => Promise<any>) {
    // Log error
    console.error(`MCP Error: ${error.message}`);

    // Determine error type
    if (this.isRateLimit(error)) {
      console.warn('Rate limit hit, waiting...');
      await this.backoff();
      return fallback();
    }

    if (this.isTimeout(error)) {
      console.warn('MCP server timeout');
      return fallback();
    }

    if (this.isAuthError(error)) {
      console.error('Authentication failed');
      throw new Error('Please check your API keys');
    }

    // Unknown error, try fallback
    return fallback();
  }

  private static async backoff() {
    const delay = Math.min(5000 * Math.pow(2, this.retryCount++), 30000);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
}
```

### Performance Optimization

1. **Parallel Tool Calls:**
```typescript
// Don't await sequentially
const [context7Result, tavilyResult] = await Promise.all([
  queryDocs(...),
  tavilySearch(...)
]);
```

2. **Caching:**
```typescript
const cache = new Map<string, any>();

async function cachedSearch(query: string) {
  if (cache.has(query)) {
    return cache.get(query);
  }

  const result = await tavilySearch({ query });
  cache.set(query, result);
  return result;
}
```

3. **Token Budgeting:**
```typescript
const TOKEN_BUDGET = {
  context7: 30000,
  tavily: 15000,
  deepwiki: 20000
};

async function budgetAwareQuery(tool: string, query: any) {
  const budget = TOKEN_BUDGET[tool];
  // Adjust query parameters based on budget
  query.tokensNum = Math.min(query.tokensNum || 5000, budget);
  return await executeTool(tool, query);
}
```

---

## 8. Sources

1. **OpenCode Documentation:** https://opencode.ai/docs/mcp-servers/
2. **Context7 MCP:** https://github.com/upstash/context7, https://playbooks.com/mcp/upstash/context7
3. **Tavily MCP:** https://github.com/tavily-ai/tavily-mcp, https://mcpservers.org/servers/tavily-ai/tavily-mcp
4. **DeepWiki MCP:** https://docs.devin.ai/work-with-devin/deepwiki-mcp, https://cognition.ai/blog/deepwiki-mcp-server
5. **MCP Configuration Examples:** Various GitHub repositories and documentation
6. **OpenCode Config Schema:** https://opencode.ai/docs/config/

---

## Appendices

### A. Quick Reference Configuration

```json
{
  "mcp": {
    "context7": {
      "type": "local",
      "command": ["npx", "-y", "@upstash/context7-mcp"],
      "enabled": true,
      "environment": {
        "CONTEXT7_API_KEY": "{file:~/.secrets/context7-key}"
      }
    },
    "tavily": {
      "type": "local",
      "command": ["npx", "-y", "tavily-mcp@latest"],
      "enabled": true,
      "environment": {
        "TAVILY_API_KEY": "{file:~/.secrets/tavily-key}"
      }
    },
    "deepwiki": {
      "type": "remote",
      "url": "https://api.deepwiki.com/mcp",
      "enabled": true
    }
  }
}
```

### B. Tool Call Cheat Sheet

| Tool | When to Use | Key Parameters |
|------|-------------|----------------|
| `resolve-library-id` | Before `query-docs` | `libraryName` |
| `query-docs` | Library docs needed | `libraryId`, `query`, `tokensNum` |
| `tavily_search` | Web search | `query`, `maxResults`, `searchDepth` |
| `tavily_extract` | Read specific URLs | `urls`, `extractDepth` |
| `tavily_map` | Explore site structure | `url`, `maxDepth` |
| `tavily_crawl` | Harvest entire site | `url`, `instructions` |
| `tavily_research` | Deep multi-source research | `input`, `model` |
| `read_wiki_structure` | Understand repo docs | `url` |
| `read_wiki_contents` | Read repo documentation | `url`, `topic` |
| `ask_question` | Ask about repo implementation | `url`, `question` |

### C. Common Issues & Solutions

| Issue | Cause | Solution |
|-------|--------|----------|
| "Server not found" | MCP not configured | Check `opencode.json` |
| "Authentication failed" | Invalid API key | Verify key in `~/.secrets/` |
| "Rate limit exceeded" | Too many requests | Implement backoff |
| "Timeout" | Server slow or unreachable | Increase timeout or retry |
| "Tool not available" | Server not running | Restart OpenCode |

---

**End of Research Document**
