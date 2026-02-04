---
name: research
id: wf-research
parent: workflows
description: "Systematic research workflow for gathering domain knowledge, validating approaches, and documenting findings"
type: workflow
version: 1.0.0
gsd_version: "1.0.0"
last_updated: 2026-02-04
---

<purpose>
Execute systematic research process to gather domain knowledge, best practices, and implementation approaches before planning. Transforms uncertainty into documented, actionable intelligence through multi-source investigation and synthesis.
</purpose>

<philosophy>
Core principles guiding research:

1. **Research Before Implementation**: Unknown unknowns kill projects. Research exposes them early.
2. **Multiple Sources, Single Truth**: Cross-reference findings. One source is an opinion; three sources are data.
3. **Skeptical Verification**: Documentation lies. Validate claims against actual code, tests, and behavior.
4. **Time-Boxed Discovery**: Research expands to fill available time. Set hard boundaries, iterate if needed.
5. **Actionable Output**: Research that doesn't inform decisions is wasted effort. Every finding must have a "so what."
6. **Fresh Over Stale**: Prefer recent documentation and Context7/web sources over training data assumptions.
</philosophy>

<entry_check>
```bash
# === ENTRY VALIDATION ===
# At least one of these must be true

# Check 1: iDumb initialized
test -f ".idumb/idumb-brain/state.json" || {
  echo "WARNING: iDumb not initialized"
  echo "Research can proceed standalone"
}

# Check 2: Research topic provided
test -n "${RESEARCH_TOPIC}" || {
  echo "ERROR: Research topic required"
  echo "USAGE: /idumb:research 'topic or question'"
  exit 1
}

# Check 3: Validate MCP tools available
# Check for web search capability
command -v curl >/dev/null 2>&1 || {
  echo "WARNING: No curl available for web research"
}

# Check for project context (optional)
test -f ".planning/PROJECT.md" && echo "✓ PROJECT.md available for context"
test -f ".planning/ROADMAP.md" && echo "✓ ROADMAP.md available for scope"

# Create research output directory
mkdir -p ".planning/research"
mkdir -p ".idumb/idumb-project-output/research"

echo "✓ Research workflow ready"
echo "Topic: ${RESEARCH_TOPIC}"
```
</entry_check>

<execution_flow>
## Step 1: Define Research Scope

**Goal:** Transform vague question into structured research plan with clear boundaries

**Commands:**
```bash
# Generate research identifiers
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
DATE_STAMP=$(date +"%Y-%m-%d")
RESEARCH_ID="research-$(date +%Y%m%d-%H%M%S)"
TOPIC_SLUG=$(echo "${RESEARCH_TOPIC}" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | tr -cd '[:alnum:]-' | cut -c1-50)

# Create research tracking file
RESEARCH_DIR=".planning/research/${TOPIC_SLUG}"
mkdir -p "${RESEARCH_DIR}"

# Initialize research plan
cat > "${RESEARCH_DIR}/RESEARCH-PLAN.md" << EOF
---
id: ${RESEARCH_ID}
topic: "${RESEARCH_TOPIC}"
status: in-progress
created: ${TIMESTAMP}
time_budget: 30m
---

# Research Plan: ${RESEARCH_TOPIC}

## Primary Questions
1. [To be defined by researcher]
2. [To be defined by researcher]
3. [To be defined by researcher]

## Scope
- **In Scope:** [Define boundaries]
- **Out of Scope:** [What to ignore]
- **Depth:** [Surface/Medium/Deep]

## Success Criteria
- [ ] Primary questions answered
- [ ] At least 3 sources consulted
- [ ] Implementation approach validated
- [ ] Risks identified
- [ ] RESEARCH.md complete

## Time Box
- Budget: 30 minutes
- Start: ${TIMESTAMP}
- Checkpoint: [15m mark]
EOF

echo "✓ Research plan created: ${RESEARCH_DIR}/RESEARCH-PLAN.md"
```

**Validation:** Research plan file exists with defined questions
**On failure:** Continue with implicit scope from topic

---

## Step 2: Gather Information - Codebase Analysis

**Goal:** Search existing codebase for relevant patterns, prior art, and context

**Commands:**
```bash
# Search for related code in project
echo "=== Codebase Search ==="

# Find files related to topic
RELATED_FILES=$(grep -rl "${RESEARCH_TOPIC}" src/ lib/ 2>/dev/null | head -20)
echo "Related files: ${RELATED_FILES:-none found}"

# Check for existing implementations
PATTERNS=$(grep -rh "function\|class\|interface" ${RELATED_FILES} 2>/dev/null | head -30)

# Check package.json for related dependencies
if [ -f "package.json" ]; then
  DEPS=$(cat package.json | grep -i "${RESEARCH_TOPIC}" 2>/dev/null)
  echo "Related dependencies: ${DEPS:-none}"
fi

# Check for existing tests
TEST_FILES=$(find . -name "*.test.*" -o -name "*.spec.*" 2>/dev/null | xargs grep -l "${RESEARCH_TOPIC}" 2>/dev/null | head -10)
echo "Related tests: ${TEST_FILES:-none found}"

# Check existing documentation
DOC_REFS=$(grep -rl "${RESEARCH_TOPIC}" docs/ .planning/ README.md 2>/dev/null | head -10)
echo "Documentation refs: ${DOC_REFS:-none}"

# Save to research notes
cat >> "${RESEARCH_DIR}/codebase-analysis.md" << EOF
# Codebase Analysis: ${RESEARCH_TOPIC}
Generated: ${TIMESTAMP}

## Related Files
${RELATED_FILES:-No related files found}

## Existing Patterns
\`\`\`
${PATTERNS:-No patterns found}
\`\`\`

## Dependencies
${DEPS:-No related dependencies}

## Test Coverage
${TEST_FILES:-No related tests}

## Documentation References
${DOC_REFS:-No documentation found}
EOF

echo "✓ Codebase analysis complete"
```

**Validation:** Analysis file created
**On failure:** Continue to external research

---

## Step 3: Gather Information - External Sources

**Goal:** Query external documentation, best practices, and current standards

**Commands:**
```bash
# === EXTERNAL RESEARCH PROTOCOL ===

echo "=== External Research ==="

# Create notes file
EXTERNAL_NOTES="${RESEARCH_DIR}/external-sources.md"
cat > "${EXTERNAL_NOTES}" << EOF
# External Research: ${RESEARCH_TOPIC}
Generated: ${TIMESTAMP}

## Sources Consulted

### Source 1: Official Documentation
- URL: [To be added by researcher]
- Key Findings: [To be added]
- Reliability: High/Medium/Low

### Source 2: Best Practices / Articles
- URL: [To be added by researcher]
- Key Findings: [To be added]
- Reliability: High/Medium/Low

### Source 3: Implementation Examples
- URL: [To be added by researcher]
- Key Findings: [To be added]
- Reliability: High/Medium/Low

## Conflicting Information
- [Document any conflicts between sources]

## Validation Notes
- [How findings were verified]
EOF
```

**Agent Research Protocol:**

The researcher agent MUST use MCP tools in this order:

1. **Context7 (Preferred for Code)**
   ```
   Use context7_resolve-library-id then context7_query-docs
   For: Library APIs, SDK usage, framework patterns
   ```

2. **Web Search (For Current Info)**
   ```
   Use exa_web_search_exa or brave-search_brave_web_search
   For: Recent releases, security advisories, best practices
   Query: "${RESEARCH_TOPIC} best practices 2026"
   ```

3. **Direct Documentation**
   ```
   Use webfetch or tavily_tavily_extract
   For: Official docs, GitHub READMEs, API references
   ```

4. **Code Examples**
   ```
   Use exa_get_code_context_exa
   For: Implementation patterns, usage examples
   ```

**Validation:** At least 3 sources documented
**On failure:** Document single-source limitation, mark as "needs verification"

---

## Step 4: Synthesize Findings

**Goal:** Consolidate multiple sources into coherent, actionable recommendations

**Commands:**
```bash
# Create synthesis document
SYNTHESIS="${RESEARCH_DIR}/synthesis.md"

cat > "${SYNTHESIS}" << EOF
# Research Synthesis: ${RESEARCH_TOPIC}
Generated: ${TIMESTAMP}
Researcher: @idumb-research-synthesizer

## Executive Summary
[One paragraph summary of key findings]

## Key Findings

### Finding 1: [Title]
- **Source(s):** [Which sources support this]
- **Confidence:** High/Medium/Low
- **Implication:** [What this means for our project]

### Finding 2: [Title]
- **Source(s):** [Which sources support this]
- **Confidence:** High/Medium/Low
- **Implication:** [What this means for our project]

### Finding 3: [Title]
- **Source(s):** [Which sources support this]
- **Confidence:** High/Medium/Low
- **Implication:** [What this means for our project]

## Conflicting Information
| Topic | Source A Says | Source B Says | Resolution |
|-------|---------------|---------------|------------|
| [Topic] | [Claim] | [Claim] | [How resolved] |

## Implementation Options

### Option 1: [Name]
- **Pros:** [List advantages]
- **Cons:** [List disadvantages]
- **Effort:** Low/Medium/High
- **Risk:** Low/Medium/High

### Option 2: [Name]
- **Pros:** [List advantages]
- **Cons:** [List disadvantages]
- **Effort:** Low/Medium/High
- **Risk:** Low/Medium/High

## Recommendation
[Clear recommendation with justification]

## Remaining Unknowns
- [ ] [Thing we still don't know]
- [ ] [Thing that needs validation]
EOF

echo "✓ Synthesis complete"
```

**Spawn Synthesizer if Multiple Conflicting Sources:**
```yaml
agent: idumb-research-synthesizer
condition: conflicting_sources > 0
task: "Resolve conflicts in research findings for ${RESEARCH_TOPIC}"
input: "${RESEARCH_DIR}/"
output: "${SYNTHESIS}"
```

**Validation:** Synthesis contains recommendation with justification
**On failure:** Flag as "inconclusive research"

---

## Step 5: Risk Assessment

**Goal:** Identify and document risks from research findings

**Commands:**
```bash
# Create risk assessment
RISKS="${RESEARCH_DIR}/risks.md"

cat > "${RISKS}" << EOF
# Risk Assessment: ${RESEARCH_TOPIC}
Generated: ${TIMESTAMP}

## Identified Risks

### Risk 1: [Name]
- **Category:** Technical/Schedule/Resource/External
- **Probability:** Low/Medium/High
- **Impact:** Low/Medium/High
- **Mitigation:** [How to reduce risk]
- **Contingency:** [Plan B if risk occurs]

### Risk 2: [Name]
- **Category:** Technical/Schedule/Resource/External
- **Probability:** Low/Medium/High
- **Impact:** Low/Medium/High
- **Mitigation:** [How to reduce risk]
- **Contingency:** [Plan B if risk occurs]

## Risk Matrix
| Risk | Probability | Impact | Priority |
|------|-------------|--------|----------|
| [R1] | [P] | [I] | P×I |
| [R2] | [P] | [I] | P×I |

## Unknown Risks (Blind Spots)
- [Areas we haven't researched]
- [Dependencies on external factors]
EOF

echo "✓ Risk assessment complete"
```

**Validation:** At least one risk documented
**On failure:** Add "no risks identified" with caveat

---

## Step 6: Document Final Research Output

**Goal:** Create comprehensive RESEARCH.md artifact

**Commands:**
```bash
# Create final research document
OUTPUT_PATH=".planning/research/${TOPIC_SLUG}-RESEARCH.md"

cat > "${OUTPUT_PATH}" << EOF
---
type: research
topic: "${RESEARCH_TOPIC}"
status: complete
created: ${TIMESTAMP}
researcher: workflow/research
sources_count: 3
confidence: medium
version: 1.0.0
---

# Research: ${RESEARCH_TOPIC}

## Executive Summary
[One paragraph: What we learned, what we recommend, key risks]

## Research Questions & Answers

### Q1: [Primary question]
**Answer:** [Concise answer]
**Confidence:** High/Medium/Low
**Sources:** [Which sources informed this]

### Q2: [Secondary question]
**Answer:** [Concise answer]
**Confidence:** High/Medium/Low
**Sources:** [Which sources informed this]

### Q3: [Tertiary question]
**Answer:** [Concise answer]
**Confidence:** High/Medium/Low
**Sources:** [Which sources informed this]

## Key Findings

1. **[Finding 1]** - [Brief explanation]
2. **[Finding 2]** - [Brief explanation]
3. **[Finding 3]** - [Brief explanation]

## Implementation Recommendation

### Recommended Approach
[Clear recommendation]

### Justification
[Why this approach over alternatives]

### Implementation Notes
- [Note 1]
- [Note 2]
- [Note 3]

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| [Risk 1] | [P] | [I] | [Mitigation] |
| [Risk 2] | [P] | [I] | [Mitigation] |

## Sources

1. [Source 1 with URL if applicable]
2. [Source 2 with URL if applicable]
3. [Source 3 with URL if applicable]

## Open Questions
- [ ] [Unresolved question 1]
- [ ] [Unresolved question 2]

## Next Steps
1. [Recommended next action]
2. [Follow-up research if needed]
3. [Integration with planning]

---
*Research completed: ${DATE_STAMP}*
*Workflow: research v1.0.0 GSD*
EOF

echo "✓ Research document created: ${OUTPUT_PATH}"

# Also copy to brain output
cp "${OUTPUT_PATH}" ".idumb/idumb-project-output/research/${TOPIC_SLUG}-RESEARCH.md"
```

**Validation:**
```bash
test -f "${OUTPUT_PATH}" && \
  grep -q "## Executive Summary" "${OUTPUT_PATH}" && \
  grep -q "## Key Findings" "${OUTPUT_PATH}" && \
  echo "✓ Research document valid"
```
**On failure:** Report what sections are missing

---

## Step 7: Update State

**Goal:** Record research completion in governance state

**Commands:**
```bash
# Update state
STATE_FILE=".idumb/idumb-brain/state.json"

if [ -f "${STATE_FILE}" ]; then
  # Add history entry via jq or idumb-state tool
  CURRENT=$(cat "${STATE_FILE}")
  echo "${CURRENT}" | jq '
    .history += [{
      "timestamp": "'${TIMESTAMP}'",
      "action": "research",
      "agent": "workflow/research",
      "result": "pass",
      "details": "Research complete: '${RESEARCH_TOPIC}'"
    }]
  ' > "${STATE_FILE}.tmp" && mv "${STATE_FILE}.tmp" "${STATE_FILE}"
  
  echo "✓ State updated"
fi

# Clean up intermediate files
echo "Research artifacts in: ${RESEARCH_DIR}/"
ls -la "${RESEARCH_DIR}/"
```

**Validation:** State file updated, output path confirmed
**On failure:** Log warning, continue

</execution_flow>

<agent_spawning>
| Agent | Condition | Task | Timeout | Output |
|-------|-----------|------|---------|--------|
| idumb-project-researcher | Scope is project-wide | Research project-level topic | 300s | research-notes.md |
| idumb-phase-researcher | Scope is phase-specific | Research phase-specific topic | 180s | phase-research.md |
| idumb-research-synthesizer | Multiple conflicting sources | Resolve conflicts and synthesize | 120s | synthesis.md |
| idumb-skeptic-validator | Before final output | Challenge research assumptions | 60s | validation-report.md |
</agent_spawning>

<research_methodology>
## Source Hierarchy

**Tier 1: Most Reliable**
- Official documentation (library docs, API specs)
- Source code (actual implementation)
- Official examples and tutorials

**Tier 2: Highly Reliable**
- Context7 indexed documentation
- Recent StackOverflow answers with high votes
- GitHub issues/discussions from maintainers

**Tier 3: Cross-Reference Required**
- Blog posts (check date, author credibility)
- Tutorial sites (may be outdated)
- AI training data (verify against Tier 1-2)

**Tier 4: Skeptical Verification**
- Forum posts
- Social media
- Unofficial documentation

## Freshness Requirements

| Source Type | Maximum Age | Action if Stale |
|-------------|-------------|-----------------|
| Security advisories | 24 hours | Mandatory web search |
| Package versions | 7 days | Check npm/pypi directly |
| Best practices | 6 months | Verify still current |
| Architecture patterns | 12 months | Check for newer patterns |
| Core language features | 24 months | Usually stable |

## Verification Protocol

1. **Claim → Source:** Every claim must cite its source
2. **Multi-Source:** Critical decisions need 2+ sources agreeing
3. **Test Claims:** If claimable in code, write test to verify
4. **Date Check:** Always note when source was last updated
5. **Authority Check:** Who wrote this? Are they credible?
</research_methodology>

<output_artifact>
## Artifact: {topic}-RESEARCH.md

**Path:** `.planning/research/{topic-slug}-RESEARCH.md`
**Backup:** `.idumb/idumb-project-output/research/{topic-slug}-RESEARCH.md`

### Frontmatter
```yaml
type: research
topic: "{research topic}"
status: complete | in-progress | inconclusive
created: "{ISO-8601 timestamp}"
researcher: workflow/research
sources_count: {number}
confidence: high | medium | low
version: 1.0.0
```

### Required Sections
1. **Executive Summary** - One paragraph overview
2. **Research Questions & Answers** - Q&A format with confidence
3. **Key Findings** - Numbered list
4. **Implementation Recommendation** - Clear recommendation
5. **Risk Assessment** - Table format
6. **Sources** - Numbered list with URLs
7. **Open Questions** - Checkbox format
8. **Next Steps** - What to do with findings

### Quality Criteria
- At least 3 sources consulted
- Confidence level assigned to each finding
- Conflicts explicitly documented and resolved
- Recommendation is actionable
- Risks have mitigations
</output_artifact>

<chain_rules>
## On Success (Research Complete)
**Chain to:** Context-dependent
- If for roadmap: `/idumb:roadmap`
- If for phase: `/idumb:plan-phase {N}`
- If standalone: Return to user

**Auto:** false

**Prompt:**
```markdown
Research complete: ${RESEARCH_TOPIC}
📄 Output: ${OUTPUT_PATH}

Key finding: [summary]
Recommendation: [summary]

How would you like to use this research?
→ [Plan] Create roadmap/phase plan based on findings
→ [Discuss] Review findings together
→ [Save] Keep for reference
```

---

## On Partial (Time Box Exceeded)
**Action:** Save current findings, mark as incomplete

```bash
sed -i 's/status: complete/status: in-progress/' "${OUTPUT_PATH}"
echo "## Time Box Status" >> "${OUTPUT_PATH}"
echo "Research paused at ${TIMESTAMP}" >> "${OUTPUT_PATH}"
echo "Remaining questions: [list]" >> "${OUTPUT_PATH}"
```

**Prompt:**
```markdown
Time box reached. Research saved with current findings.
Resume: /idumb:research --continue "${TOPIC_SLUG}"
```

---

## On Inconclusive (No Clear Answer)
**Action:** Document uncertainty explicitly

```bash
cat >> "${OUTPUT_PATH}" << EOF

## Inconclusive Finding
This research did not produce a clear recommendation.

**Reason:** [Why inconclusive]
**Options:** [What we could try next]
**Recommendation:** [Proceed with caution / More research / Prototype]
EOF
```

---

## On Failure (Research Error)
**Action:** Log error, save partial work
```bash
echo "[${TIMESTAMP}] research:${RESEARCH_TOPIC}:failed" >> .idumb/idumb-brain/history/errors.log
```
</chain_rules>

<success_criteria>
## Verification Checkboxes

### Entry Validation
- [ ] Research topic is clear and specific
- [ ] Output directory created
- [ ] MCP tools available for external research

### Research Scope
- [ ] Primary research questions defined
- [ ] Scope boundaries set (in/out)
- [ ] Time budget established
- [ ] Success criteria defined

### Information Gathering
- [ ] Codebase searched for existing patterns
- [ ] At least 3 external sources consulted
- [ ] Sources documented with URLs/references
- [ ] Freshness of sources verified

### Synthesis
- [ ] Key findings extracted and numbered
- [ ] Conflicting information resolved
- [ ] Implementation options compared
- [ ] Clear recommendation provided

### Risk Assessment
- [ ] Risks identified and documented
- [ ] Probability and impact assessed
- [ ] Mitigations proposed
- [ ] Unknown risks acknowledged

### Output Quality
- [ ] RESEARCH.md created at correct path
- [ ] All required sections present
- [ ] Confidence levels assigned
- [ ] Open questions documented
- [ ] Next steps defined
</success_criteria>

<integration_points>
## File Dependencies

### Reads From
- Project codebase (src/, lib/, etc.)
- `.planning/PROJECT.md` - Project context
- `.planning/ROADMAP.md` - Scope context
- `.idumb/idumb-brain/state.json` - Current state
- External sources via MCP tools

### Writes To
- `.planning/research/{topic}-RESEARCH.md` - Main output
- `.planning/research/{topic}/` - Working directory
- `.idumb/idumb-project-output/research/` - Backup
- `.idumb/idumb-brain/state.json` - History entry

### Never Modifies
- Source code files
- Existing planning documents
- Configuration files
</integration_points>

---
*Workflow: research v1.0.0 GSD*
*Transform Date: 2026-02-04*
