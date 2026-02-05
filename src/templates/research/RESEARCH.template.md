---
type: research
id: "{RESEARCH_ID}"
topic: "{RESEARCH_TOPIC}"
status: in-progress | complete | inconclusive
created: "{ISO_TIMESTAMP}"
researcher: "{AGENT_ID}"
sector: "{SECTOR}"
complexity: "{COMPLEXITY}"
sources_count: 0
confidence: 0
tools_used: []
time_spent: "0m"
---

# Research: {RESEARCH_TOPIC}

## 0. Research Pre-Flight

### 0.1 Tool Inventory
```yaml
available_tools:
  context7: {available: true/false, status: "connected/missing"}
  deepwiki: {available: true/false, status: "connected/missing"}
  tavily: {available: true/false, status: "connected/missing"}
  exa: {available: true/false, status: "connected/missing"}
  brave_search: {available: true/false, status: "connected/missing"}

tool_count: {N}
minimum_required: {N}  # Based on complexity
gate_status: pass | fail
```

### 0.2 Research Trigger
| Trigger Type | Active | Source |
|--------------|--------|--------|
| Brainstorm skipped | ☐ | Stage 1 flag |
| Low clarity score | ☐ | IDEA-BRIEF.clarity_score < 70 |
| Low confidence assumptions | ☐ | IDEA-BRIEF.assumptions |
| Unknown tech detected | ☐ | Constraint analysis |
| Cross-dependencies | ☐ | Complexity assessment |
| User requested | ☐ | Manual trigger |
| Stale existing research | ☐ | Age > 48h |

### 0.3 Research Scope
```yaml
scope:
  depth: light | standard | deep
  time_budget: "{DURATION}"
  source_minimum: {N}
  
focus_areas:
  - area: "{AREA_1}"
    priority: high
    reason: "{REASON}"
  - area: "{AREA_2}"
    priority: medium
    reason: "{REASON}"

out_of_scope:
  - "{EXCLUDED_1}"
  - "{EXCLUDED_2}"
```

---

## 1. Primary Research Questions

### Q1: {PRIMARY_QUESTION_1}
**Context:** {WHY_THIS_MATTERS}
**Success:** {WHAT_GOOD_ANSWER_LOOKS_LIKE}
**Status:** unanswered | partial | answered

### Q2: {PRIMARY_QUESTION_2}
**Context:** {WHY_THIS_MATTERS}
**Success:** {WHAT_GOOD_ANSWER_LOOKS_LIKE}
**Status:** unanswered | partial | answered

### Q3: {PRIMARY_QUESTION_3}
**Context:** {WHY_THIS_MATTERS}
**Success:** {WHAT_GOOD_ANSWER_LOOKS_LIKE}
**Status:** unanswered | partial | answered

---

## 2. Codebase Analysis

### 2.1 Existing Patterns Detected
```yaml
patterns_found:
  architecture:
    - pattern: "{PATTERN_NAME}"
      location: "{FILE_PATH}"
      relevance: high | medium | low
      
  conventions:
    - convention: "{CONVENTION_NAME}"
      examples: ["{FILE_1}", "{FILE_2}"]
      
  anti_patterns:
    - pattern: "{ANTI_PATTERN}"
      location: "{FILE_PATH}"
      recommendation: "{FIX}"
```

### 2.2 Related Files
| File | Relevance | Relationship |
|------|-----------|--------------|
| {FILE_PATH_1} | high | {RELATIONSHIP} |
| {FILE_PATH_2} | medium | {RELATIONSHIP} |
| {FILE_PATH_3} | low | {RELATIONSHIP} |

### 2.3 Existing Dependencies
```yaml
relevant_dependencies:
  - name: "{PACKAGE_NAME}"
    version: "{VERSION}"
    purpose: "{PURPOSE}"
    docs: "{DOCS_URL}"
    
  - name: "{PACKAGE_NAME}"
    version: "{VERSION}"
    purpose: "{PURPOSE}"
    docs: "{DOCS_URL}"
```

### 2.4 Codebase Analysis Summary
**Key findings:**
1. {FINDING_1}
2. {FINDING_2}
3. {FINDING_3}

**Constraints from codebase:**
- {CONSTRAINT_1}
- {CONSTRAINT_2}

---

## 3. Tech Stack Research

### 3.1 Current Stack Documentation
```yaml
current_stack:
  language: "{LANGUAGE}"
  version: "{VERSION}"
  
  framework:
    name: "{FRAMEWORK}"
    version: "{VERSION}"
    docs: "{DOCS_URL}"
    
  key_dependencies:
    - name: "{DEP_1}"
      version: "{VERSION}"
      purpose: "{PURPOSE}"
      
  build_tools:
    - name: "{TOOL}"
      config: "{CONFIG_FILE}"
```

### 3.2 Required Stack for Idea
```yaml
required_stack:
  additions:
    - name: "{NEW_DEP}"
      version: "{VERSION}"
      purpose: "{PURPOSE}"
      research_status: researched | needed
      
  upgrades:
    - name: "{EXISTING_DEP}"
      from: "{OLD_VERSION}"
      to: "{NEW_VERSION}"
      reason: "{REASON}"
      breaking_changes: true | false
      
  removals:
    - name: "{DEP_TO_REMOVE}"
      reason: "{REASON}"
      migration_needed: true | false
```

### 3.3 Stack Gap Analysis
| Gap | Current | Required | Effort | Risk |
|-----|---------|----------|--------|------|
| {GAP_1} | {CURRENT} | {REQUIRED} | low/med/high | low/med/high |
| {GAP_2} | {CURRENT} | {REQUIRED} | low/med/high | low/med/high |

---

## 4. External Research

### 4.1 Context7 Findings (Library Docs)
```yaml
context7_queries:
  - query: "{QUERY_1}"
    library: "{LIBRARY_ID}"
    key_findings:
      - "{FINDING_1}"
      - "{FINDING_2}"
    code_examples:
      - description: "{EXAMPLE_DESC}"
        snippet: |
          {CODE_SNIPPET}
    confidence: high | medium | low
    
  - query: "{QUERY_2}"
    library: "{LIBRARY_ID}"
    key_findings:
      - "{FINDING_1}"
    confidence: high | medium | low
```

### 4.2 Deepwiki Findings (GitHub Analysis)
```yaml
deepwiki_queries:
  - repo: "{REPO_URL}"
    query: "{QUERY}"
    key_findings:
      - "{FINDING_1}"
      - "{FINDING_2}"
    patterns_found:
      - "{PATTERN_1}"
    confidence: high | medium | low
```

### 4.3 Web Search Findings (Tavily/Exa/Brave)
```yaml
web_search_queries:
  - query: "{QUERY}"
    tool: tavily | exa | brave
    results:
      - title: "{RESULT_TITLE}"
        url: "{URL}"
        key_points:
          - "{POINT_1}"
          - "{POINT_2}"
        date: "{PUBLISH_DATE}"
        credibility: high | medium | low
        
  - query: "{QUERY_2}"
    tool: tavily | exa | brave
    results:
      - title: "{RESULT_TITLE}"
        url: "{URL}"
        key_points:
          - "{POINT_1}"
        credibility: high | medium | low
```

### 4.4 Source Cross-Reference Matrix
| Claim | Source 1 | Source 2 | Source 3 | Consensus |
|-------|----------|----------|----------|-----------|
| {CLAIM_1} | ✓ Context7 | ✓ Deepwiki | - | Strong |
| {CLAIM_2} | ✓ Context7 | ✗ Web | - | Conflicting |
| {CLAIM_3} | ✓ Web | ✓ Web | ✓ Web | Strong |

---

## 5. Assumption Validation

### 5.1 Assumptions from IDEA-BRIEF
| ID | Assumption | Pre-Confidence | Validated | Post-Confidence | Evidence |
|----|------------|----------------|-----------|-----------------|----------|
| A1 | {ASSUMPTION_1} | low | ✓/✗/partial | high/med/low | {SOURCE} |
| A2 | {ASSUMPTION_2} | medium | ✓/✗/partial | high/med/low | {SOURCE} |
| A3 | {ASSUMPTION_3} | low | ✓/✗/partial | high/med/low | {SOURCE} |

### 5.2 Invalidated Assumptions
```yaml
invalidated:
  - assumption: "{ASSUMPTION}"
    reason: "{WHY_INVALID}"
    impact: critical | high | medium | low
    required_action: "{ACTION}"
    affects_scope: true | false
```

### 5.3 New Assumptions Discovered
| Assumption | Confidence | Needs Validation |
|------------|------------|------------------|
| {NEW_ASSUMPTION_1} | medium | yes |
| {NEW_ASSUMPTION_2} | high | no |

---

## 6. Cross-Dependency Mapping

### 6.1 Internal Dependencies
```mermaid
graph TD
    A[{COMPONENT_A}] --> B[{COMPONENT_B}]
    A --> C[{COMPONENT_C}]
    B --> D[{COMPONENT_D}]
    C --> D
    
    style A fill:#f9f,stroke:#333
    style D fill:#bbf,stroke:#333
```

### 6.2 External Dependencies
```yaml
external_dependencies:
  apis:
    - name: "{API_NAME}"
      version: "{VERSION}"
      auth: "{AUTH_METHOD}"
      rate_limits: "{LIMITS}"
      docs: "{DOCS_URL}"
      health_check: "{ENDPOINT}"
      
  services:
    - name: "{SERVICE_NAME}"
      provider: "{PROVIDER}"
      integration: "{METHOD}"
      fallback: "{FALLBACK_PLAN}"
      
  packages:
    - name: "{PACKAGE}"
      version_constraint: "{CONSTRAINT}"
      security_status: "{STATUS}"
      last_updated: "{DATE}"
```

### 6.3 Hidden Dependencies
| Hidden Dep | Type | Discovery Method | Impact |
|------------|------|------------------|--------|
| {HIDDEN_1} | runtime | Code analysis | {IMPACT} |
| {HIDDEN_2} | implicit | Testing | {IMPACT} |

### 6.4 Dependency Risk Assessment
```yaml
dependency_risks:
  - dependency: "{DEP_NAME}"
    risk: "{RISK_DESCRIPTION}"
    probability: low | medium | high
    impact: low | medium | high
    mitigation: "{MITIGATION}"
```

---

## 7. Risk Identification

### 7.1 Technical Risks
| ID | Risk | Probability | Impact | Mitigation | Contingency |
|----|------|-------------|--------|------------|-------------|
| TR1 | {RISK_1} | low/med/high | low/med/high | {MITIGATION} | {PLAN_B} |
| TR2 | {RISK_2} | low/med/high | low/med/high | {MITIGATION} | {PLAN_B} |

### 7.2 Dependency Risks
| ID | Risk | Probability | Impact | Mitigation | Contingency |
|----|------|-------------|--------|------------|-------------|
| DR1 | {RISK_1} | low/med/high | low/med/high | {MITIGATION} | {PLAN_B} |
| DR2 | {RISK_2} | low/med/high | low/med/high | {MITIGATION} | {PLAN_B} |

### 7.3 Knowledge Risks
| ID | Risk | Probability | Impact | Mitigation | Contingency |
|----|------|-------------|--------|------------|-------------|
| KR1 | {RISK_1} | low/med/high | low/med/high | {MITIGATION} | {PLAN_B} |

### 7.4 Risk Matrix
```
           │ Low Impact │ Med Impact │ High Impact │
───────────┼────────────┼────────────┼─────────────┤
High Prob  │            │            │    TR1      │
Med Prob   │            │    DR1     │             │
Low Prob   │    KR1     │            │             │
```

---

## 8. Research Synthesis

### 8.1 Key Findings Summary
| # | Finding | Confidence | Sources | Implication |
|---|---------|------------|---------|-------------|
| 1 | {FINDING_1} | high | Context7, Web | {IMPLICATION} |
| 2 | {FINDING_2} | medium | Deepwiki | {IMPLICATION} |
| 3 | {FINDING_3} | high | Web x3 | {IMPLICATION} |

### 8.2 Conflicting Information Resolution
| Topic | Source A | Source B | Resolution | Reasoning |
|-------|----------|----------|------------|-----------|
| {TOPIC_1} | {CLAIM_A} | {CLAIM_B} | {RESOLVED} | {REASONING} |

### 8.3 Implementation Options
```yaml
options:
  - name: "Option 1: {NAME}"
    description: "{DESCRIPTION}"
    pros:
      - "{PRO_1}"
      - "{PRO_2}"
    cons:
      - "{CON_1}"
    effort: low | medium | high
    risk: low | medium | high
    recommended: true | false
    
  - name: "Option 2: {NAME}"
    description: "{DESCRIPTION}"
    pros:
      - "{PRO_1}"
    cons:
      - "{CON_1}"
      - "{CON_2}"
    effort: low | medium | high
    risk: low | medium | high
    recommended: false
```

### 8.4 Recommendation
**Recommended approach:** {OPTION_NAME}

**Justification:**
{DETAILED_JUSTIFICATION}

**Trade-offs accepted:**
- {TRADEOFF_1}
- {TRADEOFF_2}

---

## 9. Research Questions Answered

### Q1: {PRIMARY_QUESTION_1}
**Answer:** {ANSWER}
**Confidence:** high | medium | low
**Sources:** {SOURCES}

### Q2: {PRIMARY_QUESTION_2}
**Answer:** {ANSWER}
**Confidence:** high | medium | low
**Sources:** {SOURCES}

### Q3: {PRIMARY_QUESTION_3}
**Answer:** {ANSWER}
**Confidence:** high | medium | low
**Sources:** {SOURCES}

---

## 10. Open Questions & Remaining Unknowns

### 10.1 Unresolved Questions
- [ ] {QUESTION_1} - Blocked by: {BLOCKER}
- [ ] {QUESTION_2} - Requires: {REQUIREMENT}

### 10.2 Known Unknowns
| Unknown | Impact if Wrong | Mitigation Strategy |
|---------|-----------------|---------------------|
| {UNKNOWN_1} | {IMPACT} | {STRATEGY} |
| {UNKNOWN_2} | {IMPACT} | {STRATEGY} |

### 10.3 Blind Spots
- {AREA_NOT_RESEARCHED_1}
- {AREA_NOT_RESEARCHED_2}

---

## 11. Research-to-Spec Readiness

### 11.1 Readiness Checklist
- [ ] All primary questions answered (or documented as unknown)
- [ ] Assumptions validated (or invalidated with action plan)
- [ ] Tech stack validated and gaps documented
- [ ] Dependencies mapped with risks assessed
- [ ] At least {N} sources consulted (per complexity tier)
- [ ] Conflicts between sources resolved
- [ ] Recommendation provided with justification

### 11.2 Confidence Assessment
```yaml
overall_confidence:
  score: {0-100}
  threshold: {70 for moderate, 80 for complex}
  gate_status: pass | warn | fail

section_confidence:
  tech_stack: {0-100}
  dependencies: {0-100}
  assumptions: {0-100}
  risks: {0-100}
```

### 11.3 Routing Decision
```yaml
routing:
  proceed_to_spec: true | false
  
  if_false:
    reason: "{REASON}"
    required_action: "{ACTION}"
    route_to_stage: "2.x"
    
  if_true:
    carry_forward:
      - "RESEARCH-SYNTHESIS.md"
      - "RISK-REGISTER.md"
      - "TECH-STACK-ANALYSIS.md"
    flags_for_spec:
      - "{FLAG_1}"
      - "{FLAG_2}"
```

---

## Sources Bibliography

### Primary Sources
1. **{SOURCE_TITLE}** - {URL}
   - Type: Official docs | GitHub | Article | Forum
   - Date: {DATE}
   - Credibility: high | medium | low

2. **{SOURCE_TITLE}** - {URL}
   - Type: Official docs | GitHub | Article | Forum
   - Date: {DATE}
   - Credibility: high | medium | low

### Secondary Sources
3. **{SOURCE_TITLE}** - {URL}
   - Type: {TYPE}
   - Date: {DATE}
   - Credibility: {LEVEL}

---

*Template: RESEARCH v1.0.0*
*Stage: 2 - Research*
*Output of: 2.8 Research Synthesis*
