---
name: idumb-workflow
description: Guides the implementation of the iDumb plugin reboot following the 8-phase pivotal trial methodology. Use when building TypeScript engines, tools, and hooks for intelligent AI governance.
---

# iDumb Plugin Reboot Workflow

## Core Philosophy

Build the iDumb plugin as a clean, minimal TypeScript system that enhances OpenCode's innate agents through tools and hooks, never replacing them. Follow the 8 pivotal trials with strict validation.

## Implementation Workflow

### Phase 1: Foundation (Pivotal Trial 1)
**Goal**: Basic state persistence through 5 compactions

1. Create clean worktree structure
2. Implement Zod schemas for state/config
3. Build disk persistence layer
4. Create minimal plugin shell
5. **Validation**: State survives 5 compaction cycles

### Phase 2: Core Tools (Pivotal Trial 2)
**Goal**: Tool compatibility with innate agents

1. Implement `idumb_state_read/write` tools
2. Implement `idumb_anchor_add/list` tools
3. Implement `idumb_validate_run` tool
4. **Validation**: Tools work with default OpenCode agents

### Phase 3: Decision Engine (Pivotal Trial 3)
**Goal**: Decision scoring performance < 100ms

1. Implement `decision-scorer.ts` engine
2. Create `idumb_score_context` tool
3. Define signal detection patterns
4. **Validation**: Scoring detects contradictions in < 100ms

### Phase 4: Attention System (Pivotal Trial 4)
**Goal**: Attention directives survive 10 compactions

1. Implement `attention-anchor.ts` engine
2. Implement `prompt-transformer.ts` pipeline
3. Hook into message transformation
4. **Validation**: Focus directives survive 10 compactions

### Phase 5: Background Collectors (Pivotal Trial 5)
**Goal**: Collector results merge into main session

1. Implement `context-collector.ts` sub-agent system
2. Create `idumb_collect_spawn` tool
3. Define collector task schemas
4. **Validation**: Collector results successfully merge

### Phase 6: Delegation Intelligence (Pivotal Trial 6)
**Goal**: Parallel delegation improves decision quality

1. Implement `delegation-router.ts` engine
2. Build sequential/parallel strategies
3. Create hybrid delegation patterns
4. **Validation**: Parallel delegation shows measurable quality improvement

### Phase 7: TUI Integration (Pivotal Trial 7)
**Goal**: TUI feedback without blocking main loop

1. Implement TUI hooks (`tui.toast.show`, `tui.prompt.append`)
2. Create status display injection
3. Build intervention notifications
4. **Validation**: TUI feedback improves user awareness without blocking

### Phase 8: Stress Testing (Pivotal Trial 8)
**Goal**: Pass all 5 stress test scenarios

1. Execute STRESS-001 through STRESS-005
2. Document all failures and fixes
3. Performance benchmarking
4. **Validation**: All stress tests pass with evidence

## Daily Workflow Pattern

```
Morning:
1. Review yesterday's trial results
2. Identify today's pivotal trial
3. Plan implementation approach

Implementation:
1. Use idumb-architect to design the component
2. Use idumb-implementer to write the code
3. Use idumb-tester to validate the trial

Evening:
1. Document trial results
2. Update principles registry
3. Plan next day's trial
```

## Success Criteria Checklist

Before considering any phase complete:

- [ ] All stated success criteria met with specific evidence
- [ ] Performance requirements verified (< 100ms for scoring)
- [ ] No regressions in previously validated functionality
- [ ] Works with default OpenCode agents (no custom configurations)
- [ ] Zero console.log pollution (structured logging only)
- [ ] 100% TypeScript strict mode compliance
- [ ] Zero lint errors

## Key Constraints

**MUST DO:**
- Follow exact file structure from the plan
- Use Zod schemas for all validation
- Expose functionality through custom tools only
- Integrate via OpenCode plugin hooks only
- Maintain compatibility with innate agents

**MUST NOT DO:**
- Create markdown agents or commands
- Override OpenCode's innate agent behavior
- Use console.log for output
- Skip pivotal trial validation
- Proceed with failing trials

## When to Use Supporting Agents

- **idumb-architect**: When designing new components or interfaces
- **idumb-implementer**: When writing TypeScript code for engines/tools
- **idumb-tester**: When validating functionality or designing tests

Always validate each pivotal trial before moving to the next phase.