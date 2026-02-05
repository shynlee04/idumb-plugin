---
name: brainstorm
id: wf-brainstorm
parent: workflows
description: "Systematic ideation workflow for capturing ideas, clarifying intent, and scoping projects before research"
type: workflow
version: 1.0.0
gsd_version: "1.0.0"
last_updated: 2026-02-05
---

<purpose>
Transform vague ideas into clear, scoped project definitions through structured ideation. Captures raw ideas, clarifies user intent, identifies constraints, surfaces assumptions, and produces IDEA-BRIEF documents that feed into research workflows.
</purpose>

<philosophy>
Core principles guiding brainstorming:

1. **Capture Before Critique**: Get the raw idea out first. Refinement comes later.
2. **Clarify Intent, Not Solution**: Understand the problem before proposing solutions.
3. **Surface Assumptions Early**: Hidden assumptions kill projects. Make them explicit.
4. **Scope Ruthlessly**: What's OUT is as important as what's IN.
5. **Sector-Aware Ideation**: Load domain expertise to guide brainstorming.
6. **Quality Gates Prevent Waste**: Don't proceed with unclear ideas.
</philosophy>

<entry_check>
```bash
# === ENTRY VALIDATION ===

# Check 1: Idea provided
test -n "${BRAINSTORM_IDEA}" || {
  echo "ERROR: Brainstorm idea required"
  echo "USAGE: /idumb:brainstorm 'your idea here'"
  exit 1
}

# Check 2: iDumb initialized (optional but recommended)
test -f ".idumb/brain/state.json" && {
  echo "✓ iDumb initialized"
} || {
  echo "WARNING: iDumb not initialized (proceeding standalone)"
}

# Check 3: Create output directories
mkdir -p ".idumb/project-output/brainstorm"
mkdir -p ".planning/brainstorm"

# Check 4: Generate session ID
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
DATE_STAMP=$(date +"%Y-%m-%d")
SESSION_ID="brainstorm-$(date +%Y%m%d-%H%M%S)"
TOPIC_SLUG=$(echo "${BRAINSTORM_IDEA}" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | tr -cd '[:alnum:]-' | cut -c1-50)

echo "✓ Brainstorm workflow ready"
echo "Session: ${SESSION_ID}"
echo "Topic: ${BRAINSTORM_IDEA}"
```
</entry_check>

<execution_flow>

## Step 1: Idea Capture

**Goal:** Capture raw idea exactly as expressed, no filtering

**Agent:** @idumb-project-researcher

**Actions:**
1. Record verbatim user input (preserve exact wording)
2. Timestamp the capture
3. Create session tracking file

**Capture Template:**
```yaml
idea_capture:
  raw_input: |
    {user's exact words, multiline supported}
  timestamp: "${TIMESTAMP}"
  session_id: "${SESSION_ID}"
  source: "user-input"
```

**Output File:** `.idumb/project-output/brainstorm/${SESSION_ID}-capture.json`

---

## Step 2: Sector Detection

**Goal:** Determine what domain this idea belongs to for skill loading

**Agent:** @idumb-project-researcher

**Detection Sources (priority order):**
1. Explicit `--sector` flag (if provided)
2. Codebase analysis (package.json, directory structure)
3. Keyword analysis of idea text
4. User config default sector

**Sector Detection Matrix:**

| Sector | Keywords | Files/Dirs | Frameworks |
|--------|----------|------------|------------|
| `web-fe` | component, UI, button, form, dashboard, styling | src/components, vite.config, tailwind.config | React, Vue, Svelte, Angular |
| `web-be` | API, endpoint, database, auth, server, route | routes/, controllers/, prisma/, src/api | Express, Fastify, Hono, NestJS |
| `fullstack` | full stack, SSR, hydration, server components | app/, pages/, api/ | Next.js, Nuxt, SvelteKit, Remix |
| `api` | REST, GraphQL, schema, versioning, contract | openapi.yaml, schema.graphql | OpenAPI, tRPC, GraphQL |
| `cli` | command, terminal, args, flags, output | bin/, cli.js | Commander, Yargs, Clap |
| `mobile` | app, native, device, screen, gesture | ios/, android/, App.tsx | React Native, Flutter, Expo |
| `aiml` | AI, ML, agent, LLM, prompt, chain, model | agents/, prompts/, chains/ | LangChain, Anthropic, OpenAI |
| `data` | ETL, pipeline, transform, schema, warehouse | pipelines/, transforms/ | dbt, Airflow, Pandas |
| `devops` | deploy, CI/CD, infrastructure, container | .github/, terraform/, k8s/ | Docker, Terraform, GitHub Actions |

**Output:**
```yaml
sector_detection:
  detected_sector: "{sector-id}"
  confidence: "{high|medium|low}"
  detection_method: "{flag|codebase|keywords|default}"
  indicators:
    - "{indicator 1}"
    - "{indicator 2}"
  skill_to_load: "{skill-name or 'find-skills'}"
```

---

## Step 3: Load Domain Skill

**Goal:** Inject domain expertise to guide brainstorming

**Agent:** @idumb-supreme-coordinator

**Skill Loading Logic:**

```yaml
skill_mapping:
  web-fe: "frontend-design"
  web-be: "api-design"
  fullstack: ["frontend-design", "api-design"]
  api: "api-design"
  cli: "cli-patterns"
  mobile: "mobile-design"
  aiml: "mcp-builder"  # or agent-design
  data: "data-pipelines"
  devops: "infrastructure"
  unknown: "find-skills"
```

**Skill Discovery (if not found locally):**

```markdown
If skill not found in .claude/skills/:
1. Check if find-skills skill is available
2. Use find-skills to search: `npx skills add https://github.com/anthropics/skills --skill {skill-name}`
3. If still not found, proceed with general brainstorming (no domain skill)
4. Note in output that domain expertise was not available
```

**Output:**
```yaml
skill_loaded:
  skill_name: "{skill-name}"
  source: "{local|discovered|none}"
  skill_path: "{path if local}"
  domain_guidance_available: "{yes|no}"
```

---

## Step 4: Intent Clarification

**Goal:** Transform raw idea into structured problem statement

**Agent:** @idumb-project-researcher (with skill context)

**Clarification Framework:**

| Question | Purpose | Required |
|----------|---------|----------|
| What problem does this solve? | Core value proposition | Yes |
| Who experiences this problem? | Target users | Yes |
| What does success look like? | Measurable outcomes | Yes |
| What's the smallest viable version? | MVP definition | Yes |
| Why now? | Urgency/priority | No |

**Elicitation Approach:**
- If user provided detailed idea → extract answers
- If user provided vague idea → ask clarifying questions
- Use A/P/C pattern for complex ideas:
  - [A] Ask more questions
  - [P] Propose interpretation
  - [C] Continue with current understanding

**Output:**
```yaml
intent:
  problem_statement: |
    {clear problem description}
  target_users:
    - "{user type 1}"
    - "{user type 2}"
  success_criteria:
    - "{measurable outcome 1}"
    - "{measurable outcome 2}"
  mvp_definition: |
    {smallest viable version}
  urgency: "{high|medium|low|undefined}"
```

---

## Step 5: Constraint Identification

**Goal:** Surface all constraints before over-committing

**Agent:** @idumb-skeptic-validator

**Constraint Categories:**

```yaml
constraints:
  technical:
    description: "Technology limitations and requirements"
    examples:
      - "Must use existing React codebase"
      - "API must be backwards compatible"
      - "Must work offline"
    
  timeline:
    description: "Time-related constraints"
    examples:
      - "Launch by Q2"
      - "Demo needed in 2 weeks"
      - "Flexible timeline"
    
  dependencies:
    description: "What must exist or happen first"
    examples:
      - "Needs auth system from Phase 1"
      - "Waiting on API from backend team"
      - "Requires design approval"
    
  resources:
    description: "Available and needed resources"
    examples:
      - "Solo developer"
      - "Need design support"
      - "Budget for third-party APIs"
    
  compatibility:
    description: "What this must work with"
    examples:
      - "Must support IE11"
      - "Must integrate with Salesforce"
      - "Mobile-first required"
```

**Probing Questions:**
1. What tech stack is required or preferred?
2. When does this need to be done?
3. What must exist before this can work?
4. Who/what resources are available?
5. What existing systems must this integrate with?

---

## Step 6: Scope Bounding

**Goal:** Draw explicit lines around what's in and out

**Agent:** @idumb-project-researcher

**Scope Definition Template:**

```yaml
scope:
  in_scope:
    - description: "{feature/capability}"
      priority: "{must-have|should-have|nice-to-have}"
    
  out_of_scope:
    - description: "{feature/capability}"
      reason: "{why excluded}"
    
  future_considerations:
    - description: "{feature/capability}"
      when: "{potential future phase}"
  
  boundaries:
    start: "{where this begins}"
    end: "{where this ends}"
    interfaces: ["{what this connects to}"]
```

**Scope Validation:**
- IN + OUT should be mutually exclusive
- Every suggested feature should be categorized
- Ambiguous items → ask for clarification

---

## Step 7: Assumption Surfacing

**Goal:** Make hidden assumptions explicit and flagged

**Agent:** @idumb-skeptic-validator

**Assumption Categories:**

| Type | Description | Validation Need |
|------|-------------|-----------------|
| Technical | "The API supports WebSockets" | Often needs verification |
| User | "Users prefer dark mode" | Needs research |
| Business | "This will reduce support tickets" | Needs metrics |
| Timeline | "We can learn Vue in a week" | Usually optimistic |
| Resource | "The backend team will help" | Confirm availability |

**Confidence Levels:**

```yaml
confidence_levels:
  high:
    description: "Verified or self-evident"
    action: "Document and proceed"
    example: "React supports hooks (verified in docs)"
    
  medium:
    description: "Likely true but unverified"
    action: "Flag for validation during research"
    example: "Stripe webhooks are reliable"
    
  low:
    description: "Uncertain or speculative"
    action: "Generate research question"
    example: "Users will pay for premium features"
```

**Output:**
```yaml
assumptions:
  - id: "A1"
    assumption: "{what we're assuming}"
    category: "{technical|user|business|timeline|resource}"
    confidence: "{high|medium|low}"
    validation_needed: true
    research_question: "Does {assumption} hold true?"
```

---

## Step 8: Clarity Scoring

**Goal:** Quality gate - determine if idea is clear enough to proceed

**Agent:** @idumb-low-validator

**Scoring Rubric:**

| Criterion | Weight | Check | Pass Condition |
|-----------|--------|-------|----------------|
| No blockers | 30 | Scan for TBD, TODO, ???, FIXME | None found |
| All sections complete | 25 | Check each required section | All present |
| No vague language | 15 | Scan for maybe, might, possibly | None found |
| Constraints documented | 15 | At least 1 constraint per category | Covered |
| Assumptions explicit | 15 | At least 3 assumptions surfaced | Present |

**Score Calculation:**
```
clarity_score = Σ(criterion_weight × pass_status)
```

**Thresholds:**

| Score | Status | Action |
|-------|--------|--------|
| ≥ 70 | PASS | Proceed to IDEA-BRIEF generation |
| 50-69 | WARN | Proceed with warnings, flag gaps |
| < 50 | BLOCK | Return for more clarification |

**Blocking Patterns:**
```regex
blockers:
  - "TBD|TODO|FIXME|XXX|\\?\\?\\?"
  - "\\?$"  # Lines ending with ?
  
warnings:
  - "maybe|might|possibly|could be"
  - "should work|probably|assume|guess"
  - "not sure|unclear|TBC"
```

---

## Step 9: IDEA-BRIEF Generation

**Goal:** Produce structured document capturing all brainstorm outputs

**Agent:** @idumb-supreme-coordinator

**Output Paths:**
- Primary: `.idumb/project-output/brainstorm/IDEA-BRIEF-${DATE_STAMP}-${TOPIC_SLUG}.md`
- Planning sync: `.planning/brainstorm/IDEA-BRIEF-${TOPIC_SLUG}.md`

**Template:**

```markdown
---
id: ${SESSION_ID}
topic: "${BRAINSTORM_IDEA}"
sector: "${DETECTED_SECTOR}"
skill_used: "${LOADED_SKILL}"
clarity_score: ${CLARITY_SCORE}
created: ${TIMESTAMP}
status: ready-for-research
---

# IDEA-BRIEF: ${Topic}

## Raw Idea
> ${verbatim user input, preserved exactly}

## Sector
- **Detected:** ${sector}
- **Confidence:** ${confidence}
- **Skill Used:** ${skill_name}

## Intent

### Problem Statement
${problem description}

### Target Users
${user list}

### Success Criteria
${measurable outcomes}

### MVP Definition
${smallest viable version}

## Scope

### In Scope
${in_scope items with priorities}

### Out of Scope
${out_of_scope items with reasons}

### Future Considerations
${future items}

## Constraints

### Technical
${technical constraints}

### Timeline
${timeline constraints}

### Dependencies
${dependency constraints}

### Resources
${resource constraints}

## Assumptions

| ID | Assumption | Confidence | Needs Validation |
|----|------------|------------|------------------|
${assumption rows}

## Research Questions

Generated from low-confidence assumptions:

1. ${research question 1}
2. ${research question 2}
3. ${research question 3}

## Clarity Assessment

**Score:** ${clarity_score}/100

| Criterion | Status | Notes |
|-----------|--------|-------|
${scoring breakdown}

## Next Steps

| Priority | Action | Command |
|----------|--------|---------|
| 1 | Validate assumptions | `/idumb:research "${topic}"` |
| 2 | Create roadmap | `/idumb:roadmap` |
| 3 | Refine scope | `/idumb:brainstorm "${refined}"` |

---
*Generated by iDumb Brainstorm Workflow v1.0.0*
*Session: ${SESSION_ID}*
```

</execution_flow>

<chain_rules>

## Workflow Dependencies

```yaml
prerequisites:
  required: []  # brainstorm can start from zero
  recommended:
    - "/idumb:init"  # sets up directories and config
    
successors:
  natural_next:
    - workflow: "research"
      command: "/idumb:research"
      condition: "clarity_score >= 50"
      
  alternative:
    - workflow: "roadmap"
      command: "/idumb:roadmap"
      condition: "--skip-research flag"
      
  iterate:
    - workflow: "brainstorm"
      command: "/idumb:brainstorm"
      condition: "clarity_score < 50"
```

## State Transitions

```yaml
on_start:
  state.phase: "brainstorming"
  state.session: "${SESSION_ID}"

on_complete:
  state.phase: "brainstorm-complete"
  state.ready_for: "research"
  state.last_brainstorm: "${SESSION_ID}"

on_fail:
  state.phase: "brainstorm-incomplete"
  state.blocked_reason: "${failure_reason}"
```

</chain_rules>

<structured_returns>

## Success Return

```markdown
## BRAINSTORM COMPLETE

**Session:** ${SESSION_ID}
**Topic:** ${idea_topic}
**Sector:** ${detected_sector} (${confidence})
**Skill Used:** ${skill_name}

### Clarity Score: ${score}/100 ${status_emoji}

| Criterion | Weight | Status |
|-----------|--------|--------|
| No blockers | 30 | ${pass/fail} |
| Sections complete | 25 | ${pass/fail} |
| No vague language | 15 | ${pass/fail} |
| Constraints documented | 15 | ${pass/fail} |
| Assumptions explicit | 15 | ${pass/fail} |

### Outputs Generated

| Artifact | Path |
|----------|------|
| IDEA-BRIEF | `.idumb/project-output/brainstorm/IDEA-BRIEF-${date}-${topic}.md` |

### Research Questions (${count})

${numbered list of research questions from low-confidence assumptions}

### Recommended Next Steps

| Priority | Action | Command |
|----------|--------|---------|
| 1 | Research assumptions | `/idumb:research "${topic}"` |
| 2 | Create roadmap | `/idumb:roadmap --from-brainstorm` |
```

## Incomplete Return

```markdown
## BRAINSTORM INCOMPLETE

**Session:** ${SESSION_ID}
**Clarity Score:** ${score}/100 (below threshold)
**Status:** Needs clarification

### Missing Information

${list of gaps identified}

### Blocking Issues

${blockers found}

### To Continue

1. ${specific clarification needed}
2. Run: `/idumb:brainstorm "${refined idea}"`
```

</structured_returns>

<execution_metadata>
```yaml
workflow_id: wf-brainstorm
category: ideation
chain_position: first
typical_duration: 5-15 minutes
complexity: low-medium

input_artifacts:
  - user idea (required)
  - .idumb/brain/config.json (optional)
  - existing codebase (optional, for sector detection)

output_artifacts:
  - .idumb/project-output/brainstorm/IDEA-BRIEF-*.md
  - .planning/brainstorm/IDEA-BRIEF-*.md (sync)

state_updates:
  phase: "brainstorm-complete"
  ready_for: "research"
  last_brainstorm: "${SESSION_ID}"

agents_used:
  - idumb-supreme-coordinator
  - idumb-project-researcher
  - idumb-skeptic-validator
  - idumb-low-validator

skills_loaded:
  - dynamic based on sector detection
  - find-skills as fallback
```
</execution_metadata>
