# Meta-Builder Skill Index

Complete index of all components in the idumb-meta-builder skill system.

## Quick Start

```bash
# To ingest a new framework
node scripts/ingest-framework.js full <path-to-framework>

# To transform a specific agent
node scripts/transform-agent.js <agent-file> <hierarchy-level>

# To validate a transformation
node scripts/validate-transformation.js <output-path>
```

## File Structure

```
idumb-meta-builder/
├── SKILL.md                          # Main skill entry point (14.2K words)
├── references/                       # Detailed documentation (loaded on-demand)
│   ├── framework-patterns.md         # BMAD/GSD pattern inventory
│   ├── transformation-rules.md       # Complete mapping tables
│   ├── classification-tree.md        # Hierarchical pattern organization
│   ├── self-upgrade-protocol.md      # Learning and evolution rules
│   ├── module-schema.md              # iDumb module schema definition
│   ├── validation-patterns.md        # Validation layer specifications
│   ├── integration-checklist.md      # Agent/tool/command binding rules
│   └── drift-detection.md            # Drift detection methods
├── examples/                         # Working demonstrations
│   ├── bmad-to-idumb.md              # Complete BMAD transformation
│   ├── pattern-extraction.md         # How to extract patterns
│   └── spec-to-module.md             # Original spec transformation example
├── scripts/                          # Automation utilities
│   ├── ingest-framework.js           # Full ingestion pipeline
│   ├── transform-agent.js            # Agent transformation
│   ├── transform-workflow.js         # Workflow transformation (TODO)
│   ├── validate-transformation.js    # Validation runner (TODO)
│   ├── evolve-rules.js               # Self-upgrade learner (TODO)
│   └── validate-module.js            # Module validation
└── templates/                        # Output templates
    ├── agent-template.md             # iDumb agent structure
    ├── workflow-template.md          # iDumb workflow structure
    └── MODULE_INDEX.md               # Module index template
```

## Component Summary

| File | Words | Purpose |
|------|-------|---------|
| SKILL.md | 14,241 | Main skill with core protocols and quick reference |
| framework-patterns.md | 3,891 | Pattern inventory from BMAD/GSD frameworks |
| transformation-rules.md | 3,522 | Complete mapping tables for transformations |
| classification-tree.md | 3,115 | Hierarchical pattern organization |
| self-upgrade-protocol.md | 2,876 | Learning and evolution rules |
| bmad-to-idumb.md | 2,654 | Complete BMAD transformation example |
| pattern-extraction.md | 1,987 | Pattern extraction workflow |

**Total Documentation:** ~32K words across progressive disclosure structure

## Usage by Agent Type

### For idumb-builder

When the idumb-builder agent needs to ingest a framework:

1. **Load SKILL.md** - Get overview and workflow
2. **Load references/framework-patterns.md** - Understand source patterns
3. **Load references/transformation-rules.md** - Get mapping rules
4. **Run scripts/ingest-framework.js** - Execute transformation
5. **Load examples/bmad-to-idumb.md** - Reference complete example

### For idumb-high-governance

When coordinating multi-component ingestion:

1. **Load SKILL.md** - Understand delegation patterns
2. **Load references/classification-tree.md** - Get pattern hierarchy
3. **Delegate to sub-agents**:
   - idumb-project-researcher: Analyze framework structure
   - idumb-phase-researcher: Extract patterns
   - idumb-planner: Create transformation plan
   - idumb-builder: Generate components

### For idumb-skeptic-validator

When validating transformations:

1. **Load references/validation-patterns.md** - Get validation criteria
2. **Load scripts/validate-module.js** - Run validation suite
3. **Check against transformation rules** - Verify mapping correctness

## Progressive Disclosure Strategy

### Always Loaded (Metadata)
- Skill name and description
- Trigger phrases for usage

### On Skill Trigger (SKILL.md)
- Core protocols (ingestion, classification, transformation)
- Quick reference tables
- Delegation patterns
- Links to detailed references

### On-Demand Loading (references/)
- framework-patterns.md: When analyzing source framework
- transformation-rules.md: When planning transformation
- classification-tree.md: When organizing patterns
- self-upgrade-protocol.md: When learning from feedback

### Just-in-Time Loading (examples/)
- bmad-to-idumb.md: When transforming BMAD-like frameworks
- pattern-extraction.md: When extracting new patterns

### Execution Only (scripts/)
- ingest-framework.js: Run as external process
- transform-agent.js: Run as external process
- validate-module.js: Run as external process

## Framework Support Matrix

| Framework | Agents | Workflows | Tools | Modules | Status |
|-----------|--------|-----------|-------|---------|--------|
| BMAD | ✓ | ✓ | ✓ | ✓ | Complete |
| GSD | Partial | ✓ | ✗ | ✓ | Partial |
| Custom | ? | ? | ? | ? | Use ingestion pipeline |

## Self-Upgrade Status

| Component | Version | Confidence | Last Updated |
|-----------|---------|------------|--------------|
| Agent transformation | 2.0.0 | 0.9 | 2026-02-04 |
| Workflow transformation | 2.0.0 | 0.8 | 2026-02-04 |
| Tool transformation | 2.0.0 | 0.7 | 2026-02-04 |
| Module transformation | 1.0.0 | 0.9 | 2026-02-04 |
| Validation rules | 2.0.0 | 0.85 | 2026-02-04 |

## Development Roadmap

### Completed (v2.0.0)
- [x] Comprehensive SKILL.md with all protocols
- [x] Framework patterns reference (BMAD, GSD)
- [x] Transformation rules reference
- [x] Classification tree reference
- [x] Self-upgrade protocol reference
- [x] Ingest framework automation script
- [x] Transform agent automation script
- [x] Complete BMAD transformation example
- [x] Pattern extraction example
- [x] Agent and workflow templates

### In Progress (v2.1.0)
- [ ] Transform workflow script
- [ ] Validate transformation script
- [ ] Evolve rules script
- [ ] Additional framework examples (GSD complete)

### Planned (v3.0.0)
- [ ] Automated pattern learning from feedback
- [ ] Multi-framework composition
- [ ] Transformation diff/rollback
- [ ] Pattern similarity detection
- [ ] Interactive transformation dashboard
