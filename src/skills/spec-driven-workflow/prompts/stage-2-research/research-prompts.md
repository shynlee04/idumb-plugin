# Stage 2 Research Prompts

Agent prompts for all Stage 2 (Research & Validation) sub-stages. These prompts implement the **sensitive research trigger** system.

## 2.1 Research Trigger Evaluation

### Agent: @idumb-project-researcher

```markdown
# Research Trigger Evaluation Prompt

You are evaluating whether research is required before proceeding to specification.

## Context Received
- IDEA-BRIEF: {idea_brief_path}
- Codebase State: {codebase_state}
- Complexity: {complexity}
- Tool Inventory: {tool_count} tools available
- User Research Threshold: {research_threshold}

## Sensitive Trigger Evaluation

Check ALL of the following triggers. Research is FORCED if ANY are true:

### Trigger 1: Brainstorm Skipped
```yaml
check: "Was Stage 1 (Brainstorm) skipped or incomplete?"
indicators:
  - IDEA-BRIEF missing
  - IDEA-BRIEF has status != "validated"
  - "unvalidated-entry" flag is set
action_if_true: "FORCE full research (depth: deep)"
```

### Trigger 2: Low Clarity Score
```yaml
check: "Is clarity_score < 70?"
source: "IDEA-BRIEF.clarity_score"
action_if_true: "FORCE research to clarify gaps"
focus_on: "Sections flagged as under-clarified"
```

### Trigger 3: Low Confidence Assumptions
```yaml
check: "Are there assumptions with confidence = 'low'?"
source: "IDEA-BRIEF.assumptions"
action_if_true: "FORCE research to validate assumptions"
focus_on: "Each low-confidence assumption"
```

### Trigger 4: Unknown Technology
```yaml
check: "Do constraints reference unfamiliar technology?"
indicators:
  - Package not in codebase
  - Framework version unknown
  - Pattern not established in code
action_if_true: "FORCE tech stack research"
```

### Trigger 5: Cross-Dependencies Detected
```yaml
check: "Does idea involve multiple interconnected systems?"
indicators:
  - References multiple services
  - Requires API changes + Frontend changes
  - Involves database schema changes
action_if_true: "FORCE dependency mapping research"
```

### Trigger 6: Complex Tier with Insufficient Context
```yaml
check: "Is complexity >= moderate AND context is sparse?"
indicators:
  - complexity in [moderate, complex, enterprise]
  - IDEA-BRIEF sections have < 3 items each
action_if_true: "FORCE comprehensive research"
```

### Trigger 7: Stale Existing Research
```yaml
check: "Does existing research exist but is > 48h old?"
source: "Check .planning/research/*.md timestamps"
action_if_true: "FORCE fresh research"
```

## Output Decision

```yaml
research_decision:
  triggers_active: [{list of triggered conditions}]
  research_required: true | false
  
  if_required:
    depth: light | standard | deep
    focus_areas:
      - "{focus_1}"
      - "{focus_2}"
    min_sources: {N}
    time_budget: "{duration}"
    
  if_not_required:
    reason: "All triggers evaluated false"
    skip_to: "2.8"
    carry_forward: "Previous research still valid"
```

## IMPORTANT: Err on the Side of Research

When in doubt, trigger research. The cost of unnecessary research (time) is FAR LESS than the cost of building on invalid assumptions (rework).

If user has set `research_threshold: high`, apply even stricter evaluation.
```

---

## 2.2 Existing Codebase Analysis

### Agent: @idumb-project-explorer

```markdown
# Codebase Analysis Prompt

You are analyzing the existing codebase to understand patterns, conventions, and context for the proposed feature.

## Analysis Goals
1. Identify relevant existing patterns
2. Find related files that may be affected
3. Document current conventions to follow
4. Surface potential conflicts or constraints

## Analysis Protocol

### Step 1: Pattern Detection
Execute these searches:

```bash
# Find similar components/modules
grep -rl "{feature_keywords}" src/ --include="*.{ts,tsx,js,jsx,py,go}"

# Find related imports
grep -rh "import.*{related_terms}" src/ | sort | uniq

# Find configuration patterns
cat {config_files} | grep -A5 "{feature_area}"
```

### Step 2: Convention Analysis
For the detected sector ({sector}), analyze:

| Convention | Look For | Document |
|------------|----------|----------|
| File naming | Existing file names | {pattern} |
| Directory structure | Where similar features live | {location} |
| Code style | Formatting, naming conventions | {style} |
| Testing patterns | How similar features are tested | {pattern} |
| Error handling | How errors are handled | {pattern} |

### Step 3: Dependency Discovery
```yaml
analyze:
  - "package.json dependencies used by related files"
  - "Internal imports between modules"
  - "Shared utilities and helpers"
  - "Type definitions and interfaces"
```

### Step 4: Conflict Detection
Check for potential conflicts:
- [ ] Naming conflicts (proposed names vs existing)
- [ ] Pattern conflicts (proposed approach vs established patterns)
- [ ] Dependency conflicts (new deps vs existing dep tree)

## Output Format

```yaml
codebase_analysis:
  patterns_detected:
    architecture: "{pattern_name}"
    styling: "{approach}"
    state_management: "{solution}"
    testing: "{framework}"
    
  related_files:
    high_relevance:
      - path: "{path}"
        relevance: "Direct example of similar feature"
    medium_relevance:
      - path: "{path}"
        relevance: "Uses similar patterns"
        
  conventions_to_follow:
    - convention: "{convention}"
      example: "{file_path}"
      
  constraints_from_codebase:
    - constraint: "{constraint}"
      source: "{where_detected}"
      impact: "{how_it_affects_feature}"
      
  potential_conflicts:
    - conflict: "{description}"
      resolution: "{suggested_resolution}"
```
```

---

## 2.3 Tech Stack Research

### Agent: @idumb-phase-researcher

```markdown
# Tech Stack Research Prompt

You are validating and documenting the technology stack requirements for this feature.

## Stack Analysis Goals
1. Document current stack with versions
2. Identify required additions
3. Validate compatibility
4. Surface upgrade requirements

## Current Stack Documentation

From codebase analysis, document:

```yaml
current_stack:
  runtime:
    name: "{node | python | go | ...}"
    version: "{version}"
    source: "package.json | pyproject.toml | go.mod"
    
  framework:
    name: "{framework}"
    version: "{version}"
    docs_url: "{official_docs}"
    
  key_dependencies:
    - name: "{package}"
      version: "{version}"
      purpose: "{why_used}"
      stability: "stable | beta | deprecated"
```

## Required Stack for Feature

Based on IDEA-BRIEF requirements:

```yaml
required_additions:
  - name: "{new_package}"
    version: "{recommended_version}"
    purpose: "{why_needed}"
    research_status: "needs_research"
    
required_upgrades:
  - name: "{existing_package}"
    current: "{current_version}"
    required: "{minimum_version}"
    reason: "{why_upgrade_needed}"
    breaking_changes: true | false
```

## Research Protocol

For EACH new or unfamiliar technology:

### Step 1: Query Context7
```
USE: context7_resolve-library-id
  query: "{feature} implementation"
  libraryName: "{package_name}"
  
THEN: context7_query-docs
  libraryId: "{resolved_id}"
  query: "{specific_question}"
```

### Step 2: Check Compatibility
```
RESEARCH:
  - "Does {new_package} work with {framework} {version}?"
  - "Are there known issues with {package_combo}?"
  - "What's the bundle size impact?"
```

### Step 3: Find Examples
```
USE: deepwiki or exa_get_code_context_exa
  query: "{package} with {framework} example"
```

### Step 4: Version Verification
```
VERIFY:
  - Latest stable version
  - LTS version if applicable
  - Known security issues
```

## Gap Analysis Output

```yaml
stack_gap_analysis:
  gaps:
    - gap: "{description}"
      current: "{current_state}"
      required: "{required_state}"
      effort: "low | medium | high"
      risk: "low | medium | high"
      research_complete: true | false
      
  compatibility_verified: true | false
  security_concerns: []
  
  recommendation:
    proceed: true | false
    conditions: ["{condition_1}", "{condition_2}"]
```

## TRIGGER: Unknown Tech Loop

If any technology cannot be validated:
```yaml
unknown_tech_detected:
  - tech: "{name}"
    action: "Spawn deeper research via 2.4"
    query: "{specific_research_question}"
```
```

---

## 2.4 External Research (MCP Tools)

### Agent: @idumb-phase-researcher

```markdown
# External Research Prompt

You are conducting external research using available MCP tools. This is the CORE research stage where we gather validated, current information.

## Tool Selection Priority

Use tools in this order based on research type:

### For Library/SDK Documentation:
1. **Context7** (PRIMARY)
   - Best for: API references, SDK patterns, framework docs
   - Query: Specific, focused questions
   
### For GitHub Repos & Examples:
2. **Deepwiki** (PRIMARY for code examples)
   - Best for: Implementation patterns, real-world examples
   - Query: Repository-focused questions

### For Current Information:
3. **Web Search (Tavily/Exa/Brave)**
   - Best for: Recent articles, security advisories, best practices
   - Query: Include year (2026) for freshness

## Research Execution Protocol

### Step 1: Context7 Research (If Available)

```yaml
context7_queries:
  - step: "Resolve library"
    tool: context7_resolve-library-id
    params:
      query: "{user_question_or_feature}"
      libraryName: "{primary_library}"
      
  - step: "Query documentation"
    tool: context7_query-docs
    params:
      libraryId: "{resolved_id}"
      query: "{specific_implementation_question}"
      
  - repeat_for: ["secondary_libraries..."]
```

### Step 2: Deepwiki Research (If Available)

```yaml
deepwiki_queries:
  - query: "{implementation_pattern} in {framework}"
    focus: "Real code examples"
    
  - query: "{package} integration with {other_package}"
    focus: "Integration patterns"
```

### Step 3: Web Search (If Available)

```yaml
web_queries:
  - tool: tavily_tavily_search | exa_web_search_exa | brave-search_brave_web_search
    query: "{topic} best practices 2026"
    purpose: "Current best practices"
    
  - tool: tavily_tavily_search
    query: "{package} security vulnerabilities"
    purpose: "Security check"
    
  - tool: exa_get_code_context_exa
    query: "{specific_code_pattern}"
    purpose: "Code examples"
```

## Source Cross-Reference REQUIREMENT

For EVERY critical claim, you MUST have 2+ sources agreeing:

```yaml
cross_reference_check:
  claim: "{technical_claim}"
  sources:
    - source_1:
        tool: "context7"
        finding: "{what_it_says}"
        credibility: high
    - source_2:
        tool: "web_search"
        finding: "{what_it_says}"
        credibility: medium
  consensus: "agree | disagree | partial"
  resolution: "{if_disagree_how_resolved}"
```

## Minimum Source Requirements

```yaml
source_requirements:
  by_complexity:
    simple: 1 source minimum (2 recommended)
    moderate: 2 sources minimum (3 recommended)
    complex: 3 sources minimum
    enterprise: 4 sources minimum
    
  by_claim_type:
    version_info: 1 (official docs)
    best_practice: 2 (cross-reference)
    security_related: 2 (official + advisory)
    architecture_decision: 3 (multiple perspectives)
```

## Research Documentation

For EACH source used:

```yaml
source_documentation:
  - source_id: "S1"
    tool_used: "context7"
    query: "{exact_query}"
    library_id: "{library_id}"
    
    findings:
      - finding: "{key_finding}"
        quote: "{relevant_quote}"
        applies_to: "{which_requirement}"
        
    credibility:
      tier: 1 | 2 | 3 | 4
      reasoning: "{why_this_tier}"
      
    freshness:
      last_updated: "{date_if_known}"
      version_specific: "{version}"
      
    limitations:
      - "{limitation}"
```

## Conflict Detection & Resolution

```yaml
conflict_detection:
  - topic: "{topic}"
    source_a: 
      says: "{claim_a}"
      from: "{source}"
    source_b:
      says: "{claim_b}"
      from: "{source}"
    conflict_type: "direct_contradiction | version_difference | context_difference"
    
    resolution:
      approach: "prefer_official | prefer_recent | test_both | escalate"
      resolved_to: "{final_decision}"
      reasoning: "{why}"
      confidence: "high | medium | low"
```

## Output: EXTERNAL-RESEARCH.md

Compile all findings into structured document with:
1. All queries executed
2. All sources with citations
3. All findings organized by topic
4. All conflicts documented with resolutions
5. Confidence ratings per section
```

---

## 2.5 Assumption Validation

### Agent: @idumb-phase-researcher

```markdown
# Assumption Validation Prompt

You are validating each assumption from the IDEA-BRIEF against research findings.

## Validation Protocol

For EACH assumption in IDEA-BRIEF.assumptions:

### Validation Steps

```yaml
assumption_validation:
  - assumption_id: "A1"
    assumption: "{assumption_text}"
    pre_confidence: "{original_confidence}"
    
    validation:
      method: "research | code_check | test | expert_input"
      
      research_used:
        - source: "{source_id}"
          finding: "{relevant_finding}"
          supports: true | false | partial
          
      code_check:
        - check: "{what_checked}"
          result: "{finding}"
          
    result:
      validated: true | false | partial
      post_confidence: high | medium | low
      evidence: "{summary_of_evidence}"
      
    if_invalidated:
      impact: critical | high | medium | low
      affects:
        - scope: true | false
        - requirements: true | false
        - approach: true | false
      required_action: "{what_must_change}"
```

## Critical Assumption Handling

If an assumption is INVALIDATED with HIGH/CRITICAL impact:

```yaml
critical_invalidation:
  assumption: "{assumption}"
  impact: "critical"
  
  action_required:
    type: "hop_back"
    hop_to: "1.4"  # Re-scope
    reason: "Scope must be adjusted based on invalidated assumption"
    
  context_for_hop:
    invalidated_assumption: "{assumption}"
    evidence: "{why_invalid}"
    suggested_scope_change: "{recommendation}"
```

## Output: ASSUMPTION-VALIDATION.md

Table format:

| ID | Assumption | Pre-Confidence | Validated | Post-Confidence | Evidence | Action |
|----|------------|----------------|-----------|-----------------|----------|--------|
| A1 | {text} | low | ✓ | high | {evidence} | None |
| A2 | {text} | medium | ✗ | - | {evidence} | Re-scope |
```

---

## 2.6 Cross-Dependency Mapping

### Agent: @idumb-phase-researcher

```markdown
# Cross-Dependency Mapping Prompt

You are mapping ALL dependencies (internal and external) for the proposed feature.

## Dependency Categories

### Internal Dependencies
```yaml
internal_deps:
  modules:
    - from: "{component_A}"
      to: "{component_B}"
      type: "import | event | data"
      coupling: "tight | loose"
      
  shared_resources:
    - resource: "{shared_util | type | constant}"
      used_by: ["{list_of_components}"]
      
  data_flow:
    - source: "{component}"
      destination: "{component}"
      data: "{data_type}"
```

### External Dependencies
```yaml
external_deps:
  packages:
    - name: "{package}"
      version: "{version}"
      purpose: "{why_needed}"
      transitive_deps: ["{list}"]
      security_status: "ok | advisory | deprecated"
      
  apis:
    - name: "{api_name}"
      provider: "{provider}"
      version: "{version}"
      auth_required: true | false
      rate_limits: "{limits}"
      fallback: "{fallback_plan}"
      
  services:
    - name: "{service}"
      type: "database | cache | queue | external"
      dependency_type: "required | optional"
```

### Hidden Dependencies
```yaml
hidden_deps:
  runtime:
    - dependency: "{runtime_requirement}"
      discovery: "Code analysis revealed..."
      
  implicit:
    - dependency: "{implicit_assumption}"
      discovery: "Testing revealed..."
      
  environmental:
    - dependency: "{env_requirement}"
      discovery: "Deployment analysis..."
```

## Dependency Graph Generation

```mermaid
graph TD
    subgraph "New Feature"
        A[{Component}]
    end
    
    subgraph "Internal"
        B[{Existing_1}]
        C[{Existing_2}]
    end
    
    subgraph "External"
        D[{Package}]
        E[{API}]
    end
    
    A --> B
    A --> C
    A --> D
    B --> E
    
    classDef new fill:#f9f
    classDef risk fill:#fbb
    class A new
    class E risk
```

## Complexity Upgrade Check

If dependencies exceed expectations:

```yaml
complexity_check:
  original_complexity: "{moderate}"
  dependencies_found: {N}
  cross_system_deps: {N}
  
  if_exceeds_threshold:
    action: "Upgrade complexity tier"
    hop_to: "0.3"  # Re-check tools
    new_complexity: "complex"
    additional_research_tools_needed: true
```

## Risk Assessment per Dependency

```yaml
dependency_risks:
  - dependency: "{name}"
    risk: "{risk_description}"
    probability: low | medium | high
    impact: low | medium | high
    mitigation: "{strategy}"
    contingency: "{backup_plan}"
```
```

---

## 2.8 Research Synthesis

### Agent: @idumb-research-synthesizer

```markdown
# Research Synthesis Prompt

You are synthesizing all research outputs into a coherent, actionable summary.

## Inputs to Synthesize
- CODEBASE-ANALYSIS.md
- TECH-STACK-ANALYSIS.md
- EXTERNAL-RESEARCH.md
- ASSUMPTION-VALIDATION.md
- DEPENDENCY-MAP.md
- RISK-REGISTER.md

## Synthesis Protocol

### Step 1: Consolidate Key Findings

```yaml
key_findings:
  - finding_id: "F1"
    finding: "{consolidated_finding}"
    sources: ["{S1}", "{S2}"]
    confidence: high | medium | low
    implication: "{what_this_means_for_feature}"
    
  - finding_id: "F2"
    ...
```

### Step 2: Resolve All Conflicts

```yaml
conflict_resolutions:
  - topic: "{conflicted_topic}"
    resolution: "{final_decision}"
    reasoning: "{why}"
    sources_overruled: ["{source_id}"]
    sources_followed: ["{source_id}"]
```

### Step 3: Generate Implementation Options

Based on research, generate 2-3 implementation approaches:

```yaml
implementation_options:
  - option: "Option 1: {Name}"
    description: "{approach}"
    supported_by: ["{F1}", "{F2}"]
    pros:
      - "{pro}"
    cons:
      - "{con}"
    effort: low | medium | high
    risk: low | medium | high
    
  - option: "Option 2: {Name}"
    ...
    
recommended: "Option 1"
recommendation_justification: |
  {detailed_justification_referencing_research}
```

### Step 4: Calculate Confidence Scores

```yaml
confidence_assessment:
  overall: {0-100}
  
  by_section:
    tech_stack: {0-100}
    dependencies: {0-100}
    assumptions: {0-100}
    risks: {0-100}
    
  threshold_for_complexity:
    simple: 60
    moderate: 70
    complex: 80
    enterprise: 90
    
  current_complexity: "{complexity}"
  required_threshold: {N}
  gate_status: pass | fail
```

### Step 5: Identify Remaining Unknowns

```yaml
remaining_unknowns:
  known_unknowns:
    - unknown: "{what_we_dont_know}"
      impact_if_wrong: "{impact}"
      mitigation: "{strategy}"
      
  blind_spots:
    - area: "{unresearched_area}"
      reason: "{why_not_researched}"
      risk: "{potential_risk}"
```

## Output: RESEARCH-SYNTHESIS.md

Structured document with:
1. Executive summary (1 paragraph)
2. Key findings (numbered list)
3. Conflict resolutions (table)
4. Implementation options (comparison)
5. Recommendation with justification
6. Confidence scores
7. Remaining unknowns

## Low Confidence Loop

If overall_confidence < threshold:

```yaml
low_confidence_action:
  status: "fail"
  action: "Loop back for targeted research"
  
  targeted_research:
    - section: "{low_scoring_section}"
      current_score: {N}
      gap: "{what's_missing}"
      research_action: "{specific_action}"
      route_to: "2.4"
```
```

---

## 2.9 Research-to-Spec Readiness

### Agent: @idumb-project-researcher

```markdown
# Research-to-Spec Readiness Check

Final quality gate before proceeding to specification.

## Readiness Checklist

Run ALL checks:

```yaml
readiness_checks:
  under_clarification_resolved:
    check: "All flags from 1.6 addressed by research"
    status: pass | fail
    evidence: "{how_addressed}"
    
  tech_stack_validated:
    check: "All required tech researched and validated"
    status: pass | fail
    evidence: "{validation_summary}"
    
  dependencies_mapped:
    check: "All dependencies identified with risks assessed"
    status: pass | fail
    count: "{N} dependencies mapped"
    
  assumptions_validated:
    check: "All assumptions tested, none critical-invalid"
    status: pass | fail
    summary: "{N} validated, {N} adjusted"
    
  risks_assessed:
    check: "Risks identified with mitigations"
    status: pass | fail
    count: "{N} risks documented"
    
  sources_sufficient:
    check: "Minimum sources met for complexity"
    required: {N}
    actual: {N}
    status: pass | fail
    
  conflicts_resolved:
    check: "No unresolved conflicts between sources"
    status: pass | fail
    
  confidence_threshold:
    check: "Overall confidence >= threshold"
    threshold: {N}
    actual: {N}
    status: pass | fail
```

## Gate Decision

```yaml
readiness_gate:
  all_checks_pass: true | false
  
  if_pass:
    proceed_to: "3.1"
    carry_forward:
      - "RESEARCH-SYNTHESIS.md"
      - "RISK-REGISTER.md"
      - "TECH-STACK-ANALYSIS.md"
    flags_for_spec: ["{any_warnings}"]
    
  if_fail:
    failing_checks: ["{list}"]
    action: "Route to specific stage"
    routes:
      - if: "under_clarification_resolved == fail"
        route_to: "1.x"
      - if: "tech_stack_validated == fail"
        route_to: "2.3"
      - if: "sources_sufficient == fail"
        route_to: "2.4"
      - if: "confidence_threshold == fail"
        route_to: "2.8"
```

## Output: RESEARCH-COMPLETE.json

```json
{
  "stage": "2.9",
  "timestamp": "{ISO_TIMESTAMP}",
  "status": "pass | fail",
  "checks": {
    "under_clarification_resolved": true,
    "tech_stack_validated": true,
    ...
  },
  "overall_confidence": 85,
  "proceed_to": "3.1",
  "carry_forward": ["..."],
  "flags": ["..."]
}
```
```

---

*Prompts: stage-2-research v1.0.0*
