---
description: "Execute brainstorming phase to explore ideas, clarify intent, and scope projects"
id: cmd-brainstorm
parent: commands-idumb
agent: idumb-supreme-coordinator
---

# /idumb:brainstorm

Execute brainstorming phase to explore ideas, clarify intent, and scope projects before research.

<objective>
Facilitate structured ideation to transform vague ideas into clear, scoped project definitions. Capture raw ideas, clarify user intent, identify constraints, surface assumptions, and produce an IDEA-BRIEF that feeds into the research phase.
</objective>

<execution_context>

## Reference Files (Read Before Execution)
- `.idumb/brain/state.json` - Current governance state
- `.idumb/brain/config.json` - User settings and preferences
- `.planning/PROJECT.md` - Existing project definition (if exists)
- `.idumb/project-output/research/*.md` - Previous research (if exists)

## Agents Involved
| Agent | Role | Mode |
|-------|------|------|
| @idumb-supreme-coordinator | Command entry, routing | primary |
| @idumb-project-researcher | Sector detection, context gathering | delegated |
| @idumb-skeptic-validator | Challenge assumptions, probe constraints | delegated |
| @idumb-low-validator | Clarity scoring, quality gates | hidden |

</execution_context>

<skills>

## Auto-Activated Skills

When this command is executed, skills are loaded **based on sector detection**:

| Detected Sector | Skill Loaded | Purpose |
|-----------------|--------------|---------|
| `web-fe` | `frontend-design` | UI/UX patterns, component thinking |
| `web-be` | `api-design` | API patterns, architecture |
| `fullstack` | `frontend-design` + `api-design` | Full stack patterns |
| `aiml` | `mcp-builder` or domain skill | AI/ML patterns |
| `cli` | CLI patterns skill | CLI UX patterns |
| `unknown` | `find-skills` | Discover appropriate skill |

## Skill Discovery Flow

```
1. User runs /idumb:brainstorm "build a dashboard"
2. Workflow detects sector: web-fe (React mentioned in context)
3. Workflow loads skill: frontend-design
4. Skill provides domain expertise for brainstorming
```

</skills>

<context>

## Usage

```bash
/idumb:brainstorm [idea] [flags]
```

## Flags

| Flag | Description | Values | Default |
|------|-------------|--------|---------|
| `--sector` | Force sector detection | `web-fe`, `web-be`, `fullstack`, `api`, `cli`, `aiml`, `mobile` | auto-detect |
| `--depth` | Brainstorming depth | `quick`, `standard`, `deep` | `standard` |
| `--skip-research` | Stop after IDEA-BRIEF | Boolean | `false` |
| `--output` | Output format | `markdown`, `json` | `markdown` |

## Examples

```bash
# Quick brainstorm for a feature
/idumb:brainstorm "add dark mode toggle" --depth=quick

# Deep brainstorm for new project
/idumb:brainstorm "SaaS analytics dashboard" --depth=deep

# Force sector for ambiguous idea
/idumb:brainstorm "user authentication" --sector=web-be

# Brainstorm only (no research follow-up)
/idumb:brainstorm "notification system" --skip-research
```

</context>

<process>

## Step 1: Idea Capture

**Goal:** Capture the raw idea exactly as user expressed it

**Agent:** @idumb-supreme-coordinator

**Actions:**
1. Record verbatim user input
2. Timestamp the idea capture
3. Create brainstorm session ID

**Output:**
```yaml
idea_capture:
  raw_input: "{user's exact words}"
  timestamp: "{ISO-8601}"
  session_id: "brainstorm-{YYYYMMDD-HHMMSS}"
```

---

## Step 2: Sector Detection

**Goal:** Determine what domain this idea belongs to

**Agent:** @idumb-project-researcher

**Actions:**
1. Analyze codebase (if exists) for sector indicators
2. Parse user's idea for sector keywords
3. Check config for user's typical sector
4. Determine sector with confidence score

**Sector Detection Rules:**
```yaml
web-fe:
  keywords: ["component", "UI", "button", "form", "dashboard", "React", "Vue"]
  files: ["vite.config", "tailwind.config", "src/components"]
  
web-be:
  keywords: ["API", "endpoint", "database", "auth", "server"]
  files: ["routes/", "controllers/", "prisma/", "drizzle/"]
  
fullstack:
  keywords: ["Next.js", "Nuxt", "SvelteKit", "full stack"]
  files: ["app/", "pages/", "api/"]
  
aiml:
  keywords: ["AI", "ML", "agent", "LLM", "prompt", "chain"]
  files: ["agents/", "prompts/", "langchain"]
```

**Output:**
```yaml
sector_detection:
  detected: "{sector}"
  confidence: "{high|medium|low}"
  indicators: ["{what triggered detection}"]
  skill_to_load: "{skill-name}"
```

---

## Step 3: Load Domain Skill

**Goal:** Load sector-specific expertise for brainstorming

**Agent:** @idumb-supreme-coordinator

**Actions:**
1. Based on sector, identify skill to load
2. If skill exists locally → load it
3. If skill not found → use `find-skills` to discover
4. Inject skill context for ideation

**Skill Loading:**
```bash
# Check local skills
ls .claude/skills/ | grep "{sector}"

# Or discover via find-skills pattern
# npx skills add https://github.com/anthropics/skills --skill {skill-name}
```

---

## Step 4: Intent Clarification

**Goal:** Transform raw idea into clear problem statement

**Agent:** @idumb-project-researcher (with loaded skill context)

**Clarification Questions:**
1. What problem does this solve?
2. Who is the user/audience?
3. What does success look like?
4. What's the minimum viable version?

**Output:**
```yaml
intent:
  problem: "{what problem this solves}"
  users: ["{who will use this}"]
  success_criteria: ["{measurable outcomes}"]
  mvp_definition: "{smallest viable version}"
```

---

## Step 5: Constraint Identification

**Goal:** Surface all constraints before over-promising

**Agent:** @idumb-skeptic-validator

**Constraint Categories:**
1. **Technical:** What tech stack? What limitations?
2. **Timeline:** When is this needed?
3. **Dependencies:** What must exist first?
4. **Resources:** What's available?

**Output:**
```yaml
constraints:
  technical:
    - "{constraint 1}"
  timeline:
    deadline: "{date or 'flexible'}"
    priority: "{high|medium|low}"
  dependencies:
    - "{what must exist}"
  resources:
    available: ["{what we have}"]
    needed: ["{what we need}"]
```

---

## Step 6: Scope Bounding

**Goal:** Draw clear lines around what's in and out

**Agent:** @idumb-project-researcher

**Output:**
```yaml
scope:
  in_scope:
    - "{explicitly included}"
  out_of_scope:
    - "{explicitly excluded}"
  future_considerations:
    - "{maybe later}"
```

---

## Step 7: Assumption Surfacing

**Goal:** Make hidden assumptions explicit

**Agent:** @idumb-skeptic-validator

**Validation Rules:**
- Each assumption needs confidence level
- Low confidence → requires research validation
- Assumptions become research questions

**Output:**
```yaml
assumptions:
  - assumption: "{what we're assuming}"
    confidence: "{high|medium|low}"
    validation_needed: "{yes|no}"
    research_question: "{if validation needed}"
```

---

## Step 8: Clarity Scoring

**Goal:** Quality gate - is this clear enough to proceed?

**Agent:** @idumb-low-validator

**Scoring Criteria:**
| Criterion | Weight | Check |
|-----------|--------|-------|
| No blockers (TBD, TODO, ???) | 30 | Pattern match |
| All sections complete | 25 | Section check |
| No vague language | 15 | Pattern match |
| Constraints documented | 15 | Section check |
| Assumptions explicit | 15 | Count check |

**Thresholds:**
- `≥ 70`: Proceed to IDEA-BRIEF generation
- `50-69`: Warning - consider more clarification
- `< 50`: Block - insufficient clarity

---

## Step 9: IDEA-BRIEF Generation

**Goal:** Produce structured output document

**Agent:** @idumb-supreme-coordinator

**Output Path:** `.idumb/project-output/brainstorm/IDEA-BRIEF-{date}-{topic}.md`

**Template:**
```markdown
---
id: {session_id}
topic: "{idea topic}"
sector: "{detected sector}"
skill_used: "{loaded skill}"
clarity_score: {score}
created: {timestamp}
status: ready-for-research
---

# IDEA-BRIEF: {Topic}

## Raw Idea
{verbatim user input}

## Intent
**Problem:** {what this solves}
**Users:** {who will use this}
**Success:** {what success looks like}

## Scope
**In:** {what's included}
**Out:** {what's excluded}

## Constraints
{constraints summary}

## Assumptions
{assumptions with confidence levels}

## Research Questions
{low-confidence assumptions as questions}

## Next Steps
→ `/idumb:research "{topic}"` to validate assumptions
```

</process>

<chain_rules>

## Command Dependencies

```yaml
must_before: []  # brainstorm can start fresh

should_before:
  - "/idumb:init"  # recommended but not required

leads_to:
  - "/idumb:research"  # natural next step
  - "/idumb:roadmap"   # if skipping detailed research

blocks_if:
  - idea is empty or null
  - clarity_score < 50 and --force not provided
```

## Transition Rules

| From | To | Condition |
|------|-----|-----------|
| `/idumb:brainstorm` | `/idumb:research` | `clarity_score >= 50` |
| `/idumb:brainstorm` | `/idumb:roadmap` | `--skip-research` flag |
| `/idumb:brainstorm` | `/idumb:brainstorm` | `clarity_score < 50` (iterate) |

</chain_rules>

<completion_format>

## Success Output

```markdown
## BRAINSTORM COMPLETE

**Session:** {session_id}
**Topic:** {idea topic}
**Sector:** {detected sector}
**Skill Used:** {loaded skill name}

### Clarity Score: {score}/100

| Criterion | Status |
|-----------|--------|
| No blockers | {pass/fail} |
| Sections complete | {pass/fail} |
| No vague language | {pass/fail} |
| Constraints documented | {pass/fail} |
| Assumptions explicit | {pass/fail} |

### Output
- IDEA-BRIEF: `.idumb/project-output/brainstorm/IDEA-BRIEF-{date}-{topic}.md`

### Research Questions Generated
1. {question from low-confidence assumption}
2. {question from low-confidence assumption}

### Next Steps
| Action | Command |
|--------|---------|
| Research assumptions | `/idumb:research "{topic}"` |
| Create roadmap | `/idumb:roadmap` |
| Iterate on idea | `/idumb:brainstorm "{refined idea}"` |
```

## Failure Output

```markdown
## BRAINSTORM INCOMPLETE

**Session:** {session_id}
**Issue:** {what went wrong}

### Missing Information
- {what needs clarification}

### Suggestions
1. {how to fix}
2. {alternative approach}
```

</completion_format>

<error_handling>

| Code | Condition | Resolution |
|------|-----------|------------|
| `B001` | No idea provided | Prompt user for idea |
| `B002` | Sector detection failed | Ask user to specify --sector |
| `B003` | Skill not found for sector | Use find-skills to discover |
| `B004` | Clarity score too low | Show missing areas, iterate |
| `B005` | Session state corrupted | Reset session, start fresh |

</error_handling>

<execution_metadata>
```yaml
category: ideation
chain_position: first
typical_duration: 5-15 minutes
artifact_outputs:
  - .idumb/project-output/brainstorm/IDEA-BRIEF-*.md
state_changes:
  phase: "brainstorm-complete"
  ready_for: "research"
```
</execution_metadata>
