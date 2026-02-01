# Research Summary: iDumb Meta-Framework Plugin

**Domain:** OpenCode Plugin / Framework Wrapper
**Researched:** 2026-02-02
**Overall confidence:** HIGH (Official documentation verified)

---

## Executive Summary

iDumb is envisioned as a meta-framework plugin for OpenCode that wraps existing spec-driven development frameworks (GSD, BMAD, Speckit) while adding hierarchical governance, advanced context management, and expert-skeptic enforcement. This research establishes the technical foundation for proper implementation.

**Key discovery:** OpenCode provides comprehensive extensibility through plugins, agents, commands, tools, and skills. The GSD framework offers a proven workflow pattern. The combination enables iDumb to add governance layers without breaking existing functionality.

**Critical lesson from previous failure:** The prototype failed due to TUI background text exposure and prototype-first development. This research-first approach addresses both issues by establishing verified technical facts before any implementation.

---

## Key Findings

### OpenCode Platform

| Concept | Purpose | iDumb Usage |
|---------|---------|-------------|
| **Plugins** | Event hooks, tool registration | Entry point, state management |
| **Agents** | Specialized AI assistants with modes | Governance hierarchy |
| **Commands** | User-facing `/command` invocations | iDumb workflows |
| **Tools** | Agent-facing capabilities | Validation, state access |
| **Skills** | On-demand instructions | Expert-skeptic prompts |

**Key integration points:**
- `session.created` / `session.idle` - Initialize/persist state
- `experimental.session.compacting` - Preserve context through compaction
- `tool.execute.before/after` - Inject governance, track changes
- Agent `mode: primary | subagent` with `hidden: true` for internal agents

### GSD Framework

| Component | What It Does | iDumb Wrapper Strategy |
|-----------|--------------|------------------------|
| **Milestone → Phase → Plan → Task** | Hierarchy | Preserve, add governance overlay |
| **STATE.md** | Session memory | Augment with .idumb/brain/ |
| **Multi-agent orchestration** | Parallel execution | Add validation tiers |
| **Atomic commits** | Clean git history | Leverage, don't modify |

**What GSD lacks (iDumb adds):**
- Hierarchical agent governance
- Cross-phase validation
- Expert-skeptic enforcement
- Stale context detection

### Plugin Distribution

**Recommended pattern:** Hybrid approach
1. `npx @idumb/create` - Interactive installer, copies all files
2. `plugin: ["@idumb/opencode-plugin"]` - Runtime hooks via npm

---

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Foundation (MVP v0.1.0)

**Goal:** Installable plugin that doesn't break anything

**Deliverables:**
- npm package with npx installer
- Basic plugin hooks (no-op, just logging)
- `/idumb:init`, `/idumb:status`, `/idumb:help` commands
- Single agent: `idumb-coordinator`

**Why this order:**
- Must prove TUI compatibility FIRST (previous failure point)
- Incremental: each piece tested before next
- User validation checkpoint before adding complexity

**Estimated complexity:** LOW-MEDIUM

---

### Phase 2: GSD Integration (v0.2.0)

**Goal:** Wrap GSD without breaking it

**Deliverables:**
- Command wrappers for key GSD commands
- State persistence in `.idumb/brain/`
- Context anchoring via compaction hook
- Expert-skeptic skill

**Why this order:**
- Foundation must be solid first
- GSD integration is core value proposition
- Testing against real GSD workflows

**Estimated complexity:** MEDIUM

---

### Phase 3: Governance Hierarchy (v0.3.0)

**Goal:** Multi-level agent validation

**Deliverables:**
- 3-tier agent hierarchy (coordinator → governors → validators)
- Governance health score
- Cross-phase validation
- Configurable governance levels

**Why this order:**
- Requires stable foundation and GSD integration
- Complex agent interactions need solid base
- User may want to skip to simpler features

**Estimated complexity:** HIGH

---

### Phase 4: Advanced Context (v0.4.0+)

**Goal:** .idumb-brain with full capabilities

**Deliverables:**
- Context classification (codebase, governance, sessions)
- Stale context detection and purging
- Session forensics ("what went wrong when")
- Long-term memory across sessions

**Why this order:**
- Most complex features last
- Requires all previous phases stable
- May need multiple iterations

**Estimated complexity:** HIGH

---

### Future: Multi-Framework (v1.0.0+)

**Goal:** Wrap BMAD, Speckit, others

**Deliverables:**
- BMAD wrapper
- Speckit wrapper
- Framework auto-detection
- Migration tools

**Why this order:**
- GSD must be proven first
- Each framework is significant effort
- User demand will guide priority

---

## Phase Ordering Rationale

1. **Foundation first** - Prove we can install without breaking OpenCode
2. **GSD integration second** - Prove we can wrap without breaking GSD
3. **Governance third** - Add core differentiators once base is stable
4. **Advanced features fourth** - Build on proven foundation
5. **Multi-framework last** - Expand only after GSD wrapper is excellent

**Key principle:** Each phase must be tested and validated before proceeding. This directly addresses the "incremental approach" and "one-at-a-time" requirements from user feedback.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| OpenCode Internals | HIGH | Official docs verified, Jan 31 2026 |
| GSD Framework | HIGH | Official README, npm registry |
| Plugin Distribution | HIGH | Standard npm patterns + GSD example |
| Architecture | MEDIUM | Synthesized from patterns, needs validation |
| Feature Priorities | MEDIUM | Based on user feedback, needs confirmation |
| Pitfalls | HIGH | Directly from user's explicit warnings |

---

## Gaps to Address

### Needs Phase-Specific Research

1. **Compaction hook behavior** - Experimental feature, may have undocumented limits
2. **Agent delegation limits** - How deep can subagent chains go before degradation?
3. **npm auto-install timing** - When exactly does Bun install happen?
4. **State persistence reliability** - What happens during crashes?

### Needs User Validation

1. **Governance levels** - How strict should defaults be?
2. **Feature priorities** - What's most valuable to users?
3. **Multi-framework order** - BMAD or Speckit next after GSD?

### Open Questions

1. Can we manipulate agent prompts at runtime beyond config files?
2. What's the maximum size of compaction context injection?
3. How do we handle multi-user scenarios?

---

## Critical Success Factors

From user's "Absolute Resolutions":

| Factor | How We Address It |
|--------|-------------------|
| **Priority and Orders** | Phase hierarchy with explicit dependencies |
| **Hierarchical governance** | 3-tier agent model |
| **Incremental approach** | One phase, one feature at a time |
| **Context-first** | STATE.md + .idumb-brain |
| **Expert-skeptic mode** | Enforced via skills and prompts |
| **Prevention of drift** | Stale context detection, validation gates |
| **Acknowledge limits** | Honest confidence levels, gaps documented |

---

## Next Steps

1. **User validates this research** - Confirm direction before implementation
2. **Create Phase 1 roadmap** - Detailed tasks for Foundation
3. **Implement Foundation MVP** - npx installer, basic plugin, 3 commands
4. **Test in OpenCode** - Verify TUI compatibility
5. **Iterate** - Fix issues, expand to Phase 2

---

## Research Files Created

| File | Purpose |
|------|---------|
| `OPENCODE-INTERNALS-2026-02-02.md` | OpenCode platform deep dive |
| `GSD-FRAMEWORK-2026-02-02.md` | GSD structure and integration points |
| `PLUGIN-DISTRIBUTION-2026-02-02.md` | npm/npx distribution patterns |
| `FEATURES-2026-02-02.md` | Feature landscape (table stakes, differentiators) |
| `ARCHITECTURE-2026-02-02.md` | Plugin architecture patterns |
| `PITFALLS-2026-02-02.md` | Domain-specific pitfalls and prevention |
| `SUMMARY.md` | This synthesis document |

---

## Ready for User Validation

Research complete. Before proceeding to Phase 1 implementation:

**Please validate:**
1. ✅ Research direction aligns with your vision
2. ✅ Phase order makes sense (Foundation → GSD → Governance → Advanced)
3. ✅ MVP scope is appropriate (install + 3 commands + basic plugin)
4. ✅ Pitfalls captured match your experience
5. ✅ Any missing requirements or concerns

**After validation, we proceed to:**
- Create detailed Phase 1 roadmap
- Set up npm package structure
- Implement minimal plugin
- Test in OpenCode TUI
