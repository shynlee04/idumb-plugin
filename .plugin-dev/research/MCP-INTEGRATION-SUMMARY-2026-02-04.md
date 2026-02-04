# MCP Server Integration - Quick Reference Summary

**Date:** 2026-02-04
**Purpose:** Quick reference for implementing MCP servers in iDumb init overhaul

---

## TL;DR - What You Need to Know

1. **OpenCode supports two MCP server types:**
   - **Local**: Run commands (`npx`, `node`, `python`) with env vars
   - **Remote**: Connect via HTTP/SSE URLs with auth headers

2. **Three servers provide complementary research:**
   - **Context7**: Up-to-date library docs & examples (fast-moving frameworks)
   - **Tavily**: Real-time web search, extract, crawl, map (current info)
   - **DeepWiki**: GitHub repo documentation & Q&A (codebase understanding)

3. **Configuration pattern:**
   - Global: `~/.config/opencode/opencode.json`
   - Project: `.opencode/opencode.json`
   - API keys in `~/.secrets/` with `{file:~/.secrets/key}` pattern

4. **Usage pattern:**
   - Context7: `resolve-library-id` → `query-docs`
   - Tavily: Select tool (search/extract/crawl/map/research)
   - DeepWiki: `read_wiki_structure` → `read_wiki_contents` or `ask_question`

---

## Quick Configuration

### Copy-Paste Configuration

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

### Secret Files Setup

```bash
# Create secrets directory
mkdir -p ~/.secrets
chmod 700 ~/.secrets

# Save API keys
echo "your-context7-key" > ~/.secrets/context7-key
echo "your-tavily-key" > ~/.secrets/tavily-key
chmod 600 ~/.secrets/context7-key
chmod 600 ~/.secrets/tavily-key
```

---

## Tool Selection Cheat Sheet

### Context7 (Library Documentation)

| Tool | When to Use | Example |
|------|-------------|---------|
| `resolve-library-id` | Before `query-docs`, need library ID | `resolveLibraryId("Supabase auth", "supabase")` |
| `query-docs` | Need API docs, examples, best practices | `queryDocs("/supabase/supabase", "JWT setup")` |

**Best For:**
- Fast-moving libraries (React, Next.js, Express, MongoDB)
- API-specific questions
- Implementation patterns
- Code examples

**Query Tips:**
- Be specific: "JWT auth in Express.js with refresh tokens"
- Include version: "Next.js 14 App Router middleware"
- Focus on tasks: "Form validation with Zod in React Hook Form"

### Tavily (Web Research)

| Tool | When to Use | Key Params |
|------|-------------|-------------|
| `search` | Find facts, get overview | `maxResults=10`, `searchDepth="advanced"` |
| `extract` | Read specific URLs | `urls=[...]`, `extractDepth="advanced"` |
| `map` | Explore site structure | `url="domain.com"`, `select_paths=["/docs/.*"]` |
| `crawl` | Harvest entire site | `url="domain.com"`, `instructions="Find X"` |
| `research` | Deep multi-source research | `input="compare X and Y"`, `model="pro"` |

**Best For:**
- Current events/news
- Finding sources
- Extracting content from URLs
- Mapping website structure
- Comprehensive research

**Search Depth:**
- `basic`: Quick facts, definitions
- `advanced`: Technical docs, implementation guides
- `fast`: Real-time queries, interactive workflows

### DeepWiki (GitHub Repos)

| Tool | When to Use | Example |
|------|-------------|---------|
| `read_wiki_structure` | Explore repo docs first | `readWikiStructure({url: "github.com/user/repo"})` |
| `read_wiki_contents` | Read detailed documentation | `readWikiContents({url, topic: "Architecture"})` |
| `ask_question` | Specific implementation questions | `askQuestion({url, question: "How does auth work?"})` |

**Best For:**
- Understanding unfamiliar codebases
- "How does X work?" questions
- Finding code references (file:line)
- Architecture exploration
- Real-world implementation examples

**Limitations:**
- One repo at a time
- Public repos only (free version)
- No live code (indexed documentation)

---

## Usage Patterns

### Pattern 1: Learning a New Library

```
1. Context7: Get official docs
   resolve-library-id("Library") → query-docs("How to use feature")

2. Tavily: Find community content
   search("Library best practices 2026") → extract(top results)

3. DeepWiki: If repo exists, explore structure
   read_wiki_structure() → ask_question("Implementation pattern")
```

### Pattern 2: Quick Fact Finding

```
1. Tavily: Fast search
   search("current price of X", maxResults=5, searchDepth="fast")
```

### Pattern 3: Understanding a Codebase

```
1. DeepWiki: Structure first
   read_wiki_structure(url)

2. DeepWiki: Read key docs
   read_wiki_contents(url, topic="Architecture")

3. DeepWiki: Ask specific questions
   ask_question(url, "How does authentication work?")
```

### Pattern 4: Debugging

```
1. Tavily: Find similar issues
   search("error message + solution", includeDomains=["stackoverflow.com"])

2. Tavily: Extract solutions
   extract(top StackOverflow results)

3. Context7: Check if known issue
   query-docs("/framework/docs", "known issues")
```

---

## Error Handling Pattern

```typescript
async function researchWithFallbacks(query: string) {
  try {
    // Try Context7 first
    return await useContext7(query);
  } catch (context7Error) {
    console.warn('Context7 failed, trying Tavily...');

    try {
      // Fallback to Tavily
      return await useTavily(query);
    } catch (tavilyError) {
      console.warn('Tavily failed, no fallbacks');

      // Final: Built-in tools only
      return await useBuiltInTools(query);
    }
  }
}
```

---

## Tool Decision Tree

```
Is query about a specific library?
├─ YES → Context7 (resolve → query-docs)
└─ NO → Continue

Is query about current events/news?
├─ YES → Tavily search (topic="news", time_range="week")
└─ NO → Continue

Is query about a GitHub repo?
├─ YES → DeepWiki (structure → contents/ask)
└─ NO → Continue

Do you have specific URLs?
├─ YES → Tavily extract
└─ NO → Tavily search (depth="advanced")
```

---

## Common Issues

| Issue | Solution |
|-------|----------|
| "Server not found" | Check `opencode.json` configuration |
| "Authentication failed" | Verify API keys in `~/.secrets/` |
| "Rate limit exceeded" | Implement exponential backoff |
| "Timeout" | Increase `timeout` in config or retry |
| "Tool not available" | Restart OpenCode to load MCP servers |

---

## iDumb Integration Tips

1. **Interactive Setup:**
   - Guide users through `/idumb:init` with API key collection
   - Generate `opencode.json` automatically
   - Verify configuration with test calls

2. **Agent Guidelines:**
   - Research agent: Use Context7 for libraries, Tavily for web, DeepWiki for repos
   - Planner agent: Use Context7 for framework best practices
   - Verifier agent: Use Context7 to validate API usage

3. **Fallback Strategy:**
   - Always have built-in tool fallback
   - Graceful degradation when MCP unavailable
   - Inform user of research limitations

4. **Performance:**
   - Parallel independent tool calls
   - Cache results when possible
   - Budget tokens per server

---

## Next Steps

1. **Implement `/idumb:init` MCP setup:**
   - Interactive API key collection
   - Configuration generation
   - Verification and testing

2. **Update iDumb agents:**
   - Research agent: Add tool selection logic
   - Planner agent: Integrate Context7 for best practices
   - Verifier agent: Use Context7 for API validation

3. **Add error handling:**
   - Retry with backoff
   - Graceful degradation
   - User-friendly error messages

4. **Test and document:**
   - Unit tests for MCP tool calls
   - Integration tests for combined workflows
   - User documentation

---

**Full Research:** See `.planning/research/MCP-SERVER-INTEGRATION-RESEARCH-2026-02-04.md`
