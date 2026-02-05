---
type: idea-brief
id: "{IDEA_ID}"
status: draft | validated | approved
created: "{ISO_TIMESTAMP}"
sector: "{DETECTED_SECTOR}"
complexity: "{DETECTED_COMPLEXITY}"
clarity_score: 0
validation_flags: []
---

# Idea Brief: {IDEA_TITLE}

## 1. Raw Idea

> {USER_ORIGINAL_INPUT}

**Captured from:** {manual | agent_trigger | workflow_continuation}
**Trigger context:** {TRIGGER_DETAILS}

---

## 2. Intent Statement

### 2.1 Problem Statement
**What problem does this solve?**
{PROBLEM_DESCRIPTION}

**Who experiences this problem?**
- {STAKEHOLDER_1}
- {STAKEHOLDER_2}

**Current workaround (if any):**
{CURRENT_WORKAROUND}

### 2.2 Success Scenario
**When this is complete, users will be able to:**
{SUCCESS_DESCRIPTION}

**Measurable outcome:**
{MEASURABLE_OUTCOME}

### 2.3 Intent Clarity Check
| Criterion | Status | Notes |
|-----------|--------|-------|
| Problem clearly stated | ☐ | |
| Stakeholders identified | ☐ | |
| Success is measurable | ☐ | |
| No vague language | ☐ | |

---

## 3. Constraints

### 3.1 Technical Constraints
| Constraint | Type | Source | Impact |
|------------|------|--------|--------|
| {CONSTRAINT_1} | language/framework/dependency | {SOURCE} | {IMPACT} |
| {CONSTRAINT_2} | performance/scalability | {SOURCE} | {IMPACT} |
| {CONSTRAINT_3} | compatibility | {SOURCE} | {IMPACT} |

### 3.2 Business Constraints
| Constraint | Type | Source | Impact |
|------------|------|--------|--------|
| {CONSTRAINT_1} | timeline | {SOURCE} | {IMPACT} |
| {CONSTRAINT_2} | budget/resources | {SOURCE} | {IMPACT} |
| {CONSTRAINT_3} | compliance | {SOURCE} | {IMPACT} |

### 3.3 Integration Constraints
| Constraint | Type | Source | Impact |
|------------|------|--------|--------|
| {CONSTRAINT_1} | existing_api | {SOURCE} | {IMPACT} |
| {CONSTRAINT_2} | external_service | {SOURCE} | {IMPACT} |
| {CONSTRAINT_3} | data_format | {SOURCE} | {IMPACT} |

**Constraint validation:**
- [ ] At least 1 constraint identified (or explicit "none known")
- [ ] Each constraint has clear impact assessment

---

## 4. Scope Definition

### 4.1 IN Scope (Will Be Delivered)
| Item | Priority | Rationale |
|------|----------|-----------|
| {SCOPE_ITEM_1} | must-have | {RATIONALE} |
| {SCOPE_ITEM_2} | must-have | {RATIONALE} |
| {SCOPE_ITEM_3} | should-have | {RATIONALE} |
| {SCOPE_ITEM_4} | nice-to-have | {RATIONALE} |

### 4.2 OUT of Scope (Explicitly Excluded)
| Item | Reason for Exclusion | Future Phase? |
|------|---------------------|---------------|
| {EXCLUDED_1} | {REASON} | {YES/NO} |
| {EXCLUDED_2} | {REASON} | {YES/NO} |
| {EXCLUDED_3} | {REASON} | {YES/NO} |

### 4.3 MVP vs Full Vision
**MVP (Minimum Viable):**
{MVP_DESCRIPTION}

**Full Vision (Later Phases):**
{FULL_VISION_DESCRIPTION}

**Scope validation:**
- [ ] IN scope list is explicit
- [ ] OUT scope list is explicit
- [ ] MVP clearly defined
- [ ] No scope item is ambiguous

---

## 5. Assumptions

### 5.1 Technical Assumptions
| Assumption | Confidence | Validation Method |
|------------|------------|-------------------|
| {ASSUMPTION_1} | high/medium/low | {HOW_TO_VALIDATE} |
| {ASSUMPTION_2} | high/medium/low | {HOW_TO_VALIDATE} |
| {ASSUMPTION_3} | high/medium/low | {HOW_TO_VALIDATE} |

### 5.2 Environment Assumptions
| Assumption | Confidence | Validation Method |
|------------|------------|-------------------|
| {ASSUMPTION_1} | high/medium/low | {HOW_TO_VALIDATE} |
| {ASSUMPTION_2} | high/medium/low | {HOW_TO_VALIDATE} |

### 5.3 User Assumptions
| Assumption | Confidence | Validation Method |
|------------|------------|-------------------|
| {ASSUMPTION_1} | high/medium/low | {HOW_TO_VALIDATE} |
| {ASSUMPTION_2} | high/medium/low | {HOW_TO_VALIDATE} |

**Assumption validation:**
- [ ] All assumptions explicitly stated
- [ ] Each has confidence level
- [ ] Each has validation method
- [ ] Low confidence items flagged for research

---

## 6. Clarity Assessment

### 6.1 Automated Checks
```yaml
clarity_scan:
  blocker_patterns_found: []
  vague_language_found: []
  missing_sections: []
  unresolved_questions: []
```

### 6.2 Clarity Score Breakdown
| Factor | Weight | Score | Weighted |
|--------|--------|-------|----------|
| No blocker patterns | 30% | {0-100} | {CALCULATED} |
| All sections present | 25% | {0-100} | {CALCULATED} |
| No vague language | 15% | {0-100} | {CALCULATED} |
| Constraints documented | 15% | {0-100} | {CALCULATED} |
| Assumptions explicit | 15% | {0-100} | {CALCULATED} |
| **TOTAL** | 100% | | **{TOTAL_SCORE}** |

### 6.3 Clarity Gate Decision
```yaml
score: {TOTAL_SCORE}
threshold: 70
decision: proceed | warn | block
flags:
  - "{FLAG_1}"
  - "{FLAG_2}"
next_action: "{NEXT_ACTION}"
```

---

## 7. Research Triggers

### 7.1 Automatic Research Triggers
| Trigger | Detected | Action |
|---------|----------|--------|
| Clarity score < 70 | {YES/NO} | Force research stage |
| Low confidence assumptions | {YES/NO} | Research to validate |
| Unknown tech in constraints | {YES/NO} | Tech stack research |
| Cross-dependencies detected | {YES/NO} | Dependency research |
| Brainstorm skipped | {YES/NO} | Full research required |

### 7.2 Research Scope Recommendation
```yaml
research_scope:
  depth: light | standard | deep
  focus_areas:
    - "{AREA_1}"
    - "{AREA_2}"
  min_sources: {N}
  time_budget: "{DURATION}"
```

---

## 8. Synthesis

### 8.1 Idea Summary
**One-line summary:**
{ONE_LINE_SUMMARY}

**Elevator pitch (30 seconds):**
{ELEVATOR_PITCH}

### 8.2 Key Decisions Captured
| Decision | Rationale | Reversible? |
|----------|-----------|-------------|
| {DECISION_1} | {RATIONALE} | {YES/NO} |
| {DECISION_2} | {RATIONALE} | {YES/NO} |

### 8.3 Next Stage Routing
```yaml
routing:
  detected_sector: "{SECTOR}"
  detected_complexity: "{COMPLEXITY}"
  research_required: {true/false}
  research_depth: "{DEPTH}"
  skip_allowed: {true/false}
  next_stage: "2.1" | "3.1"  # Research or Spec
```

---

## Validation Checklist

### Stage 1 Exit Criteria
- [ ] Intent statement clear and measurable
- [ ] At least 1 constraint identified (or explicit none)
- [ ] IN scope and OUT scope both defined
- [ ] All assumptions listed with confidence
- [ ] Clarity score calculated
- [ ] Research triggers evaluated
- [ ] Routing decision made

### Quality Flags
- [ ] No TBD/TODO markers remain
- [ ] No lines ending with "?"
- [ ] No vague words (maybe, might, possibly)
- [ ] All sections have content

---

*Template: IDEA-BRIEF v1.0.0*
*Stage: 1 - Ideation*
*Output of: 1.7 Brainstorm Synthesis*
