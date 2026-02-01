# Project Research Summary

**Project:** iDumb Meta-Framework Plugin for OpenCode  
**Domain:** OpenCode Plugin Development / Agent Orchestration Systems  
**Researched:** 2026-02-01  
**Confidence:** MEDIUM-HIGH

---

## Executive Summary

iDumb is a client-side OpenCode plugin that wraps spec-driven development frameworks (GSD, BMAD, Speckit) into OpenCode-native constructs. Based on analysis of the official `@opencode-ai/plugin` SDK (v1.1.40), existing prototype implementations, and GitHub-verified issues, the recommended approach is a **hub-and-spoke architecture** using Bun runtime, TypeScript, and the OpenCode Plugin SDK. The plugin acts as a central coordination layer between OpenCode's core systems and specialized agents.

The core value proposition is **multi-framework orchestration** — unifying GSD's project planning, BMAD's architecture enforcement, and Speckit's specification patterns under a single meta-framework. This differentiates iDumb from single-framework plugins. However, research reveals critical constraints: plugin hooks don't intercept subagent tool calls (GitHub #5894), compaction causes context loss (GitHub #3099), and the Plugin API has significant limitations (GitHub #10868). The architecture must be designed within these constraints.

**Key risks:** Security policies implemented via hooks can be bypassed through subagent delegation, context drifts after compaction, and attempting unsupported API features leads to fragile workarounds. **Mitigation:** Design defense-in-depth security (not relying solely on hooks), implement `experimental.session.compacting` hooks for SACRED anchor preservation, and rigorously validate features against documented API capabilities before implementation.

---

## Key Findings

### Recommended Stack

iDumb requires a dual-package structure: an OpenCode plugin (runs client-side in Bun) and CLI tooling (standalone terminal utilities). The stack prioritizes **Bun runtime for speed and consistency** with OpenCode's internal runtime, **TypeScript for type safety**, and leverages official OpenCode SDKs.

**Core technologies:**
- **@opencode-ai/plugin** (^1.1.40): Official SDK providing `Plugin` type, tool helpers, and event hooks — **required** for all OpenCode plugins
- **@opencode-ai/sdk** (^1.x): Server API client for session manipulation and TUI control via `ctx.client`
- **Bun** (^1.2.x): Runtime, package manager, test runner — faster than Node.js, built-in TypeScript support, consistent with OpenCode's runtime
- **TypeScript** (^5.5+): Type safety for hooks, custom tools, and state management
- **Zod** (^3.x): Schema validation for tool args and persisted state (OpenCode uses Zod schemas natively)
- **YAML** (via `yaml` package): Human-readable state/config files with better git diffs than JSON
- **Commander.js** (^12.x): CLI framework — lighter than oclif, excellent TypeScript support, perfect for 5-8 commands
- **@inquirer/prompts** (^7.x): Interactive prompts — modern replacement for inquirer with better TypeScript
- **bun:test**: Built-in test runner — Jest-compatible, no extra dependencies, much faster

**Package structure:** Monorepo with `packages/idumb-plugin/` (OpenCode plugin) and `packages/idumb-cli/` (CLI tooling) for clear separation of concerns and independent versioning.

### Expected Features

Based on OpenCode plugin architecture and framework wrapper patterns, features divide into essential capabilities and competitive differentiators.

**Must have (table stakes):**
- **Framework Concept Mapping** — Map GSD's PROJECT.md/ROADMAP.md, BMAD's PRD/Architecture, Speckit's spec templates to OpenCode agents/skills/commands (core value proposition)
- **Agent Hierarchy Management** — Map supreme coordinator, governance agents, validators, builders to OpenCode's @agent mention system
- **Context Injection Tools** — `idumb_init`, `idumb_complete`, `idumb_anchor` for agent handoff governance and context preservation
- **Skill Discovery & Loading** — Auto-discover skills in `.opencode/skills/` with SKILL.md frontmatter per OpenCode spec
- **Configuration Schema** — Translate framework configs (`.gsd/`, `.bmad/`, `.speckit/`) to OpenCode-native settings
- **CLI Command Registration** — `idumb-init`, `idumb-configure`, `idumb-status` commands via Commander.js
- **Hooks Integration** — Bootstrap on session start, compaction handling, tool execution interception
- **Documentation Standards** — Auto-generate AGENTS.md, PROJECT.md, SKILL.md from framework templates

**Should have (competitive):**
- **Multi-Framework Orchestration** — Unify GSD+BMAD+Speckit with concept normalization layer (key differentiator)
- **Context-Aware Brain (.idumb-brain)** — Persistent project intelligence: classification, hierarchy, metadata tracking, stale context purging
- **Auto-Hook Governance** — Automatic enforcement of framework rules via `tool.execute.before` hooks
- **Cross-Framework Agent Routing** — Route tasks seamlessly across framework boundaries
- **Validation Pipeline** — Multi-layer validation: spec → architecture → stories → code with approval gates
- **Session Persistence Beyond Compaction** — Preserve framework state across OpenCode's context compaction

**Defer (v2+):**
- **Framework Migration Tools** — Convert projects between frameworks (high complexity, requires mature single-framework support)
- **Visual Framework Dashboard** — TUI/web view of project state (nice-to-have, not blocking)
- **Advanced Multi-Framework Features** — Cross-framework routing and orchestration (requires single-framework stability first)

**Anti-features to avoid:** Reimplementing OpenCode's agent system, building custom tool frameworks, replacing SKILL.md standard, bypassing OpenCode permissions, forcing monolithic framework enforcement, synchronous framework locks, hidden context manipulation, vendor-locked export formats.

### Architecture Approach

The architecture follows a **hub-and-spoke pattern** with iDumb Plugin as the central coordination layer. The plugin receives lifecycle events from OpenCode Core, manages state persistence in `.idumb-brain/`, and provides custom tools for agent governance.

**Major components:**

1. **Plugin Entry Point** — Exports plugin function conforming to OpenCode's `Plugin` type, receives `PluginInput` (client, project, directory, worktree), returns `Hooks` object with lifecycle subscribers

2. **Event Subscribers (Lifecycle Hooks)** — Intercept OpenCode events:
   - `session.created` — Zero-turn agent priming with governance context
   - `session.updated` — Turn-1 intent capture
   - `tool.execute.before/after` — Pre/post execution validation and delegation context
   - `experimental.session.compacting` — SACRED anchor preservation (critical for context survival)
   - `permission.ask` — Auto-approval rules and audit logging

3. **Custom Tools** — Provide agents with framework-aware capabilities:
   - `idumb_init` — Retrieve governance context (MANDATORY first action)
   - `idumb_complete` — Record task completion with verification
   - `idumb_anchor` — Save critical context for compaction survival

4. **State Management System** — File-based persistence in `.idumb-brain/`:
   - `state.json` — Session registry, anchors, metadata
   - `agents/{name}.md` — Agent-specific context files
   - `contexts/{agent}.md` — Governance rules per agent type

5. **Context Injection System** — Prepend governance context via `client.session.prompt({ noReply: true, system: ... })` at session start, during delegation, and before compaction

6. **Framework Wrapper Layer** — Map GSD/BMAD concepts to OpenCode constructs (Phase → Agent, Tool → Custom Tool, State → Session context + file state)

**Key patterns:** Zero-turn priming (inject governance before first action), SACRED anchors (preserve critical context through compaction), Delegation context injection (pass parent context to subagents), Completion validation (enforce verification before claiming done), Hierarchical state tracking (parent-child session relationships).

### Critical Pitfalls

Research identified five critical pitfalls verified through GitHub issues and official documentation:

1. **Subagent Hook Bypass (Security Critical)** — Plugin hooks using `tool.execute.before` block primary agent tool calls but **do not intercept subagent tool calls** spawned via `task` tool (GitHub #5894). **Prevention:** Never rely solely on plugin hooks for security; implement defense in depth with agent-level tool restrictions in `opencode.json`. Address in Phase 1.

2. **Compaction Context Loss (Drift)** — After session compaction, agents lose critical context including user-defined rules and original intent (GitHub #3099). **Prevention:** Implement `experimental.session.compacting` hook to inject rules into compaction prompt; use SACRED anchors for critical context preservation. Address in Phase 2.

3. **Plugin API Over-Engineering** — The plugin API supports only ~25-30% of potential features; capabilities like storage API, schema extensions, TUI integration, and command registration are NOT available (GitHub #10868). **Prevention:** Validate feasibility against documented API before implementation; design within constraints. Address in Phase 1.

4. **Delegation Chain Context Breakdown** — When agents delegate to subagents, critical context is lost or transformed incorrectly, causing subagents to work with incomplete information. **Prevention:** Explicit context passing in task descriptions; minimize delegation depth (1-2 levels); implement context validation. Address in Phase 2.

5. **Framework Concept Misalignment** — When wrapping external frameworks, incorrect hierarchy mapping or violating framework constraints breaks core concepts. **Prevention:** Deep framework understanding before wrapping; validate constraint enforcement (e.g., research agents CANNOT modify files); document differences. Address in Phase 1.

---

## Implications for Roadmap

Based on combined research, the implementation requires **5 phases** with careful attention to architectural dependencies and pitfall avoidance.

### Phase 1: Foundation
**Rationale:** Must establish plugin core, state persistence, and security model before any framework integration. Critical pitfalls (hook bypass, API over-engineering, framework misalignment) must be addressed at this stage.

**Delivers:** Working plugin structure with no-op hooks, file-based state persistence, basic `idumb_init` tool, CLI skeleton with Commander.js

**Addresses (from FEATURES.md):**
- Framework Concept Mapping (GSD only, basic)
- Configuration Schema (basic `idumb.json`)
- Skill Discovery & Loading (scaffold)

**Implements (from ARCHITECTURE.md):**
- Plugin Entry Point
- State Management System
- Custom Tools (idumb_init basic)

**Avoids (from PITFALLS.md):**
- Subagent Hook Bypass: Design security model assuming hooks can be bypassed
- Plugin API Over-Engineering: Rigorously validate all features against SDK capabilities
- Framework Concept Misalignment: Deep GSD framework study before any mapping

**Research flag:** ⚠️ **NEEDS RESEARCH** — GSD framework details have no authoritative external source; relying on project context. Validate concept mapping during this phase.

### Phase 2: Lifecycle & Context Management
**Rationale:** Hooks and context injection depend on Phase 1 state management. This phase implements the core governance infrastructure that makes iDumb valuable.

**Delivers:** Zero-turn priming via `session.created`, Turn-1 intent capture via `session.updated`, SACRED anchor tool, compaction survival via `experimental.session.compacting`

**Addresses (from FEATURES.md):**
- Agent Hierarchy Management (basic mapping)
- Context Injection Tools (full implementation)
- Session Persistence Beyond Compaction

**Implements (from ARCHITECTURE.md):**
- Event Subscribers (session.created, session.updated, session.compacting)
- Context Injection System
- Custom Tools (idumb_anchor, idumb_complete basic)

**Avoids (from PITFALLS.md):**
- Compaction Context Loss: Implement compaction hooks with SACRED anchor injection
- Delegation Chain Breakdown: Design explicit context passing patterns
- State Desynchronization: File watcher integration
- Context Window Mismanagement: Efficient context handling patterns

**Research flag:** ⚠️ **NEEDS RESEARCH** — `experimental.session.compacting` hook behavior may change; test thoroughly with OpenCode updates.

### Phase 3: Tool Integration & Governance
**Rationale:** Tool execution hooks depend on Phase 2 context injection infrastructure. This phase implements enforcement mechanisms.

**Delivers:** Pre/post tool execution hooks, delegation context injection, completion validation, auto-hook governance for framework rules

**Addresses (from FEATURES.md):**
- Hooks Integration (full)
- Auto-Hook Governance (differentiator)
- Validation Pipeline (basic)

**Implements (from ARCHITECTURE.md):**
- Event Subscribers (tool.execute.before, tool.execute.after)
- Custom Tools (idumb_complete full)
- Hierarchical State Tracking

**Avoids (from PITFALLS.md):**
- Plugin Hook Conflicts: Design composable hooks that add to arrays rather than replace
- Blocking Tool Execution: Log warnings instead of throwing errors

**Research flag:** ✅ **STANDARD PATTERNS** — Tool execution hooks are well-documented in SDK; follow established patterns.

### Phase 4: Multi-Framework Support
**Rationale:** Single-framework stability (GSD) must be proven before adding BMAD and Speckit complexity.

**Delivers:** BMAD framework wrapper, Speckit framework wrapper, concept normalization layer, cross-framework agent routing

**Addresses (from FEATURES.md):**
- Multi-Framework Orchestration (differentiator)
- Cross-Framework Agent Routing
- Framework Concept Mapping (full)

**Implements (from ARCHITECTURE.md):**
- Framework Wrapper Layer (full)
- Agent Definitions (specialized personas)

**Research flag:** ⚠️ **NEEDS RESEARCH** — BMAD framework details have limited external documentation; Speckit implementation details sparse. May need direct framework author consultation.

### Phase 5: Polish & Distribution
**Rationale:** Final packaging, documentation, and distribution after core functionality is stable.

**Delivers:** Full CLI commands, comprehensive documentation, npm publishing, error handling and validation

**Addresses (from FEATURES.md):**
- CLI Command Registration (full)
- Documentation Standards (auto-generation)
- Visual Framework Dashboard (if scope allows)

**Avoids (from PITFALLS.md):**
- Poor Plugin Load Order Dependencies: Make plugins self-contained
- Console.log Instead of Structured Logging: Use `client.app.log()`

**Research flag:** ⚠️ **NEEDS RESEARCH** — Plugin distribution mechanism unclear; research `opencode-` npm prefix pattern before implementation.

### Phase Ordering Rationale

**Dependency chain:** State Management → Context Injection → Tool Hooks → Multi-Framework → Distribution

**Why this grouping:**
- Phase 1 establishes the foundation that everything else depends on; security model must be designed here
- Phase 2 implements the "secret sauce" (context preservation) that differentiates iDumb
- Phase 3 adds enforcement on top of context infrastructure
- Phase 4 scales to multiple frameworks only after single-framework stability
- Phase 5 packages for distribution after functionality is proven

**How this avoids pitfalls:**
- Phase 1 addresses 3 of 5 critical pitfalls through design decisions
- Phase 2 directly implements the compaction survival mechanism
- Phase 3 uses composable hook patterns to avoid conflicts
- Phases are bounded by API limitations discovered in research

### Research Flags Summary

**Phases likely needing deeper research during planning:**
- **Phase 1 (Foundation):** GSD framework concept mapping — no authoritative external source
- **Phase 2 (Context Management):** `experimental.session.compacting` hook — may change
- **Phase 4 (Multi-Framework):** BMAD and Speckit details — limited documentation
- **Phase 5 (Distribution):** Plugin distribution mechanism — unclear npm prefix pattern

**Phases with standard patterns (skip research-phase):**
- **Phase 3 (Tool Integration):** Tool execution hooks are well-documented in SDK

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Official OpenCode docs (@opencode-ai/plugin, @opencode-ai/sdk) + working prototype verified |
| Features | MEDIUM | OpenCode plugin/agent/skill APIs verified via official docs; framework details (GSD/BMAD/Speckit) rely on project context |
| Architecture | HIGH | Based on actual SDK TypeScript definitions and working prototype implementation |
| Pitfalls | HIGH | Verified GitHub issues (#5894, #3099, #10868) and official documentation |

**Overall confidence:** MEDIUM-HIGH

Strong confidence in OpenCode plugin architecture, SDK capabilities, and verified pitfalls. Moderate confidence in framework-specific feature mapping due to limited external documentation for GSD, BMAD, and Speckit.

### Gaps to Address

| Gap | Impact | How to Handle |
|-----|--------|---------------|
| **GSD Framework Details** | HIGH | No authoritative external source found. Must validate concept mapping during Phase 1 implementation. Review existing GSD documentation in project context. |
| **BMAD Framework Details** | HIGH | Limited external documentation. May need direct consultation with framework authors during Phase 4 planning. |
| **Speckit Implementation** | MEDIUM | GitHub announced but sparse implementation details. Monitor GitHub Spec-Kit repository for updates. |
| **Plugin Distribution** | MEDIUM | Unclear how users install plugins globally. Research `opencode-` npm prefix pattern during Phase 5. |
| **Real-World Performance** | LOW | Unknown how plugins perform with complex hook chains at scale. Monitor and benchmark during implementation. |
| **Bun Workspace Monorepo** | LOW | Limited documentation on complex workspaces. Start simple; add Turborepo only if needed. |

---

## Sources

### Primary (HIGH confidence)
- **@opencode-ai/plugin** SDK v1.1.40 — Official plugin SDK with TypeScript definitions for hooks, tools, and plugin structure
- **@opencode-ai/sdk** — Server API client for session management and TUI control
- **OpenCode Plugin Documentation** (https://opencode.ai/docs/plugins/) — Verified plugin structure, hooks, custom tools
- **OpenCode Agents Documentation** (https://opencode.ai/docs/agents/) — Verified agent hierarchy and @mentions system
- **OpenCode Skills Documentation** (https://opencode.ai/docs/skills/) — Verified SKILL.md frontmatter specification
- **GitHub Issue #5894** — Verified: Plugin hooks don't intercept subagent tool calls
- **GitHub Issue #3099** — Verified: Agent loses rules after session compaction
- **GitHub Issue #10868** — Verified: Plugin API limitations (storage, schema, TUI, commands)
- **Existing iDumb Prototype** (`.opencode/plugins/idumb-plugin.ts`) — Working implementation of plugin patterns

### Secondary (MEDIUM confidence)
- **Commander.js Documentation** (Context7) — CLI framework patterns and async action support
- **GitHub Spec-Kit Blog** (github.blog) — Speckit announcement and high-level concepts
- **ThoughtWorks Spec-Driven Development Analysis** — Framework patterns and SDD practices
- **Multi-Agent System Reliability Research** (getmaxim.ai) — Delegation failure patterns
- **Why Multi-Agent LLM Systems Fail** (augmentcode.com) — Context breakdown in agent hierarchies
- **Context Engineering** (inkeep.com) — Context window management patterns

### Tertiary (LOW confidence)
- **Community Plugin Examples** (Superpowers, opencode-agent-skills) — Implementation patterns, not official
- **OpenCode Agent Development Guide** (Gist by rstacruz) — Community-sourced but based on source analysis
- **Framework Abstraction Articles** — General patterns, needs validation for specific frameworks

---

*Research completed: 2026-02-01*  
*Ready for roadmap: yes*
