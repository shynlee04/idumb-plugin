---
description: "Map codebase structure and generate analysis documents"
agent: "idumb-supreme-coordinator"
triggers: ["/idumb:map-codebase", "/map-codebase"]
---

# /idumb:map-codebase

## Purpose
Map the codebase structure and generate comprehensive analysis documents.

## Usage
```
/idumb:map-codebase [focus-area]
```

## Parameters
- `focus-area` (optional): Specific focus - tech, arch, quality, concerns

## Workflow
1. Spawns 4 parallel scanner agents
2. Each agent analyzes a different aspect
3. Results combined into codebase-map.json
4. Generates markdown documents from templates

## Output
- `.idumb/codebase-map.json` - Structured data
- `.idumb/codebase/*.md` - Generated documents

## Example
```
/idumb:map-codebase tech
```

## Implementation

### Step 1: Validate Prerequisites
- Check `.idumb/` directory exists
- Verify templates directory exists

### Step 2: Spawn Parallel Scanners
```yaml
parallel_scanners:
  - agent: idumb-codebase-mapper
    focus: tech
    output: tech-stack.json
  - agent: idumb-codebase-mapper
    focus: arch
    output: architecture.json
  - agent: idumb-codebase-mapper
    focus: quality
    output: quality.json
  - agent: idumb-codebase-mapper
    focus: concerns
    output: concerns.json
```

### Step 3: Synthesize Results
- Merge all scanner outputs
- Create unified codebase-map.json
- Generate summary statistics

### Step 4: Generate Documents
- Process templates with mapped data
- Write to `.idumb/codebase/` directory

$ARGUMENTS
