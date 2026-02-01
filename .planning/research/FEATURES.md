# Feature Landscape: Meta-Framework Wrapper Plugin

**Domain:** iDumb - OpenCode Plugin for Framework Wrapping (GSD/BMAD/Speckit)
**Researched:** 2026-02-01
**Overall Confidence:** MEDIUM

---

## Executive Summary

iDumb is a meta-framework wrapper plugin for OpenCode that translates spec-driven development frameworks (GSD, BMAD, Speckit) into OpenCode-native constructs. Based on research into OpenCode's plugin architecture, specification-driven development patterns, and existing framework implementations, this document categorizes features into table stakes (essential), differentiators (competitive advantage), and anti-features (to deliberately avoid).

The research draws from OpenCode's official plugin documentation, GitHub Spec-Kit patterns, ThoughtWorks' SDD analysis, and community plugins like Superpowers and opencode-agent-skills.

---

## Table Stakes

Features users expect from a framework wrapper plugin. Missing = plugin feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Framework Concept Mapping** | Core value proposition - without translation layer, framework is unusable in OpenCode | High | Map GSD's PROJECT.md/ROADMAP.md, BMAD's PRD/Architecture, Speckit's spec templates to OpenCode agents/skills/commands |
| **Agent Hierarchy Management** | OpenCode supports primary/subagents; frameworks define hierarchies | Medium | Supreme coordinator, high-level governance, low-level validators, builders - must map to @agent mentions |
| **Context Injection Tools** | OpenCode plugins can register custom tools; frameworks need context passing | Medium | `idumb_init` and `idumb_complete` tools for agent handoff governance |
| **Skill Discovery & Loading** | Native OpenCode skill system; frameworks define reusable behaviors | Low | Place skills in `.opencode/skills/` with SKILL.md frontmatter per OpenCode spec |
| **Configuration Schema** | OpenCode uses opencode.json; frameworks have their own configs | Medium | Translate framework configs (`.gsd/`, `.bmad/`, `.speckit/`) to OpenCode-native settings |
| **CLI Command Registration** | OpenCode supports custom commands via plugins | Medium | `idumb-init`, `idumb-configure`, `idumb-status` commands |
| **Hooks Integration** | OpenCode plugin API provides lifecycle hooks | Medium | Bootstrap on session start, compaction handling, tool execution interception |
| **Documentation Standards** | Frameworks require structured documentation | Low | Auto-generate AGENTS.md, PROJECT.md, SKILL.md from framework templates |

---

## Differentiators

Features that set iDumb apart. Not expected, but highly valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Multi-Framework Orchestration** | Most plugins wrap one framework; iDumb unifies GSD+BMAD+Speckit | High | Requires concept normalization layer to translate between framework terminologies |
| **Context-Aware Brain (.idumb-brain)** | Persistent project intelligence beyond OpenCode's session memory | High | Classification, hierarchy, metadata tracking, stale context purging |
| **Auto-Hook Governance** | Automatic enforcement of framework rules without manual setup | Medium | Inject validation, self-remediation, approval gates via `tool.execute.before` hooks |
| **Cross-Framework Agent Routing** | Intelligent delegation across framework boundaries | High | Route tasks to GSD planner → BMAD architect → Speckit validator seamlessly |
| **Framework Migration Tools** | Convert projects between frameworks (GSD ↔ BMAD ↔ Speckit) | High | Spec translation, agent remapping, context preservation |
| **Validation Pipeline** | Multi-layer validation: spec → architecture → stories → code | Medium | Integrate with OpenCode's permissions system for approval gates |
| **Session Persistence Beyond Compaction** | Preserve framework state across OpenCode's context compaction | Medium | Use compaction hooks to save/restore framework-specific context |
| **Visual Framework Dashboard** | TUI/web view of project state across all frameworks | Medium | OpenCode has TUI SDK; extend with framework-specific visualizations |

---

## Anti-Features

Features to explicitly NOT build. Common mistakes in meta-framework plugins.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Reimplement OpenCode's Agent System** | OpenCode already has robust agents/subagents with @mentions | Use OpenCode's native agent system; add framework-specific agents as subagents |
| **Custom Tool Framework** | OpenCode has comprehensive tool API with execute hooks | Register framework tools via OpenCode's `custom-tools` API; don't build parallel system |
| **Replace SKILL.md Standard** | OpenCode natively supports Anthropic-compatible SKILL.md | Extend SKILL.md with framework metadata; don't create alternative skill format |
| **Bypass OpenCode Permissions** | OpenCode has granular permission system (allow/deny/ask) | Integrate with `permission` config; add framework-level permission overrides |
| **Monolithic Framework Enforcement** | Forcing one framework per project limits flexibility | Support framework composition - GSD for roadmap + BMAD for architecture + Speckit for specs |
| **Synchronous Framework Lock** | Blocking OpenCode until framework completes breaks flow | Use async patterns, background tasks, and non-blocking validations |
| **Hidden Context Manipulation** | Secretly modifying context without user awareness | Explicit context injection via tools; visible in OpenCode's context window |
| **Vendor-Locked Export Format** | Proprietary formats prevent framework interoperability | Export to standard formats (Markdown, JSON) compatible with upstream frameworks |

---

## Feature Dependencies

```
Framework Concept Mapping
    ↓
Agent Hierarchy Management ←→ Context Injection Tools
    ↓                           ↓
Skill Discovery & Loading ←→ Configuration Schema
    ↓                           ↓
CLI Command Registration ←→ Hooks Integration
    ↓
Auto-Hook Governance (Differentiator)
    ↓
Context-Aware Brain (.idumb-brain)
    ↓
Cross-Framework Agent Routing (Differentiator)
    ↓
Multi-Framework Orchestration (Differentiator)
```

**Critical Path:** Framework Concept Mapping → Agent Hierarchy → Context Tools → Skills/Config → Commands/Hooks

**Differentiator Dependencies:** Auto-Hook requires Hooks+Config; Brain requires Context+Skills; Routing requires Brain+Agents; Multi-Framework requires all above.

---

## MVP Recommendation

For MVP, prioritize table stakes to establish foundation:

1. **Framework Concept Mapping** - GSD only (PROJECT.md, ROADMAP.md, phases)
2. **Agent Hierarchy** - Map GSD orchestrator/agent/worker to OpenCode agents
3. **Context Injection Tools** - `idumb_init` and `idumb_complete` with governance
4. **Skill Loading** - Auto-discover `.idumb/skills/` and `.opencode/skills/`
5. **Configuration** - Basic `idumb.json` → OpenCode config translation

**One Differentiator for MVP:**
- **Auto-Hook Governance** - Minimal validation hooks on tool execution

**Defer to Post-MVP:**
- Multi-Framework Orchestration: High complexity, requires single-framework stability first
- Framework Migration: Needs mature concept mapping for all frameworks
- Visual Dashboard: Nice-to-have, not blocking for core functionality
- Cross-Framework Routing: Requires multiple framework implementations

---

## Complexity Assessment

| Feature Category | Low Complexity | Medium Complexity | High Complexity |
|------------------|----------------|-------------------|-----------------|
| **Table Stakes** | Skill Loading, Documentation | Agent Hierarchy, Context Tools, Config, Hooks | Framework Concept Mapping |
| **Differentiators** | - | Auto-Hook Governance, Validation Pipeline | Multi-Framework, Brain, Routing, Migration |
| **Overall** | 3 features | 7 features | 5 features |

---

## Sources

### Official Documentation
- OpenCode Plugins: https://opencode.ai/docs/plugins/ (MCP verified - HIGH confidence)
- OpenCode Agents: https://opencode.ai/docs/agents/ (MCP verified - HIGH confidence)
- OpenCode Skills: https://opencode.ai/docs/skills/ (MCP verified - HIGH confidence)

### Framework References
- GitHub Spec-Kit (Speckit): https://github.blog/ai-and-ml/generative-ai/spec-driven-development-with-ai-get-started-with-a-new-open-source-toolkit/ (WebFetch - MEDIUM confidence)
- Spec-Driven Development Analysis: https://www.thoughtworks.com/en-us/insights/blog/agile-engineering-practices/spec-driven-development-unpacking-2025-new-engineering-practices (WebFetch - MEDIUM confidence)
- OpenCode Superpowers Plugin: https://blog.fsck.com/2025/11/24/Superpowers-for-OpenCode/ (WebFetch - MEDIUM confidence)

### Community Patterns
- opencode-agent-skills: https://github.com/joshuadavidthomas/opencode-agent-skills (WebSearch - LOW confidence)
- OpenAgentsControl: https://github.com/darrenhinde/OpenAgentsControl (WebSearch - LOW confidence)

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| OpenCode Plugin API | HIGH | Official documentation verified via WebFetch |
| OpenCode Agents/Skills | HIGH | Official documentation verified |
| GSD Framework | MEDIUM | Based on project context; no external verification |
| BMAD Framework | MEDIUM | Based on project context; no external verification |
| Speckit Framework | MEDIUM | GitHub blog + community references |
| Feature Dependencies | MEDIUM | Logical deduction from architecture research |
| Anti-Features | MEDIUM | Inferred from common plugin anti-patterns |

---

## Research Gaps

1. **GSD Framework Details**: No authoritative external source found; relying on project context
2. **BMAD Framework Details**: Limited external documentation; may need direct framework author consultation
3. **Speckit Implementation**: GitHub announced but implementation details sparse
4. **Real-World Usage Patterns**: No case studies of meta-framework plugins in production
5. **Performance at Scale**: Unknown how OpenCode plugins perform with complex hook chains

---

*Research completed: 2026-02-01*
*Next review: When GSD/BMAD/Speckit documentation is updated or OpenCode plugin API changes*
