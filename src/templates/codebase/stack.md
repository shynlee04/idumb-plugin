---
id: "template-codebase-stack"
version: "0.1.0"
created: "2026-02-03"
purpose: "Document project technology stack - languages, frameworks, runtime, dependencies"
consumed_by: ["idumb-codebase-mapper", "idumb-planner", "idumb-project-researcher"]
produces: ".idumb/codebase/STACK.md"
validation:
  required_fields: ["languages", "frameworks", "runtime", "package_manager"]
  schema: "codebase-stack-schema-v1"
---

# Codebase Stack Template

## Purpose

Documents the complete technology stack of a codebase including programming languages, frameworks, runtime environment, package managers, and key dependencies. This is the foundational document that informs all downstream planning and implementation decisions.

## When to Use

- During `/idumb:map-codebase` workflow (first step of codebase analysis)
- When scanning a new or existing project for the first time
- Before planning any implementation work that requires stack knowledge
- When onboarding to an unfamiliar codebase
- After major dependency upgrades to update documentation

## Structure

```markdown
# Technology Stack

> Generated: {iso_timestamp}
> Detected by: idumb-codebase-mapper
> Confidence: {high|medium|low}

## Languages

| Language | Version | Primary Use | File Extensions |
|----------|---------|-------------|-----------------|
| {lang} | {ver} | {use} | {.ext1, .ext2} |

### Language Notes
- {Any special configuration or compiler flags}
- {Transpilation targets}

## Runtime

- **Platform:** {Node.js/Python/Go/Java/Rust/etc.}
- **Version:** {version with specificity}
- **Version Manager:** {nvm/pyenv/rustup/etc. or "none"}
- **Package Manager:** {npm/pnpm/yarn/pip/cargo/etc.}
- **Lock File:** {package-lock.json/yarn.lock/etc.}

### Runtime Configuration
- **Entry Point:** {main file or script}
- **Build Output:** {dist/build/target/etc.}
- **Environment:** {environment variable patterns}

## Frameworks

| Framework | Version | Purpose | Documentation |
|-----------|---------|---------|---------------|
| {name} | {ver} | {purpose} | {doc_url} |

### Framework Configuration
- **Config File:** {path to main config}
- **Conventions:** {key conventions to follow}

## Key Dependencies

| Package | Version | Category | Purpose |
|---------|---------|----------|---------|
| {name} | {ver} | {category} | {purpose} |

### Dependency Categories
- **Core:** Essential to application function
- **Dev:** Development/build tools only
- **Test:** Testing frameworks and utilities
- **Optional:** Feature-specific dependencies

## Build Tools

| Tool | Purpose | Config File |
|------|---------|-------------|
| {tool} | {purpose} | {config_path} |

### Build Commands
```bash
# Install dependencies
{install_command}

# Development build
{dev_command}

# Production build
{build_command}

# Run tests
{test_command}
```

## Detection Evidence

```bash
# Commands executed to detect stack
{actual commands with output}
```

### Detection Files Analyzed
- `{file1}` - {what was extracted}
- `{file2}` - {what was extracted}
```

## Fields

| Field | Required | Description | Detection Method |
|-------|----------|-------------|------------------|
| languages | Yes | Programming languages used | File extensions, package.json, configs |
| language_versions | Yes | Specific versions | package.json engines, tool configs |
| runtime | Yes | Platform (Node/Python/etc.) | package.json, requirements.txt, go.mod |
| runtime_version | Yes | Specific runtime version | .nvmrc, .python-version, go.mod |
| package_manager | Yes | Dependency manager | Lock file presence, config |
| frameworks | No | Application frameworks | Dependencies, imports, configs |
| dependencies | Yes | Key packages (min 5) | Package manifest |
| build_tools | No | Build/bundler tools | Config files, scripts |
| detection_evidence | Yes | How stack was determined | Command outputs |

## Example

```markdown
# Technology Stack

> Generated: 2026-02-03T10:30:00.000Z
> Detected by: idumb-codebase-mapper
> Confidence: high

## Languages

| Language | Version | Primary Use | File Extensions |
|----------|---------|-------------|-----------------|
| TypeScript | 5.3.3 | Application code | .ts, .tsx |
| JavaScript | ES2022 | Config files | .js, .mjs |
| JSON | - | Configuration | .json |

## Runtime

- **Platform:** Node.js
- **Version:** 20.11.0
- **Version Manager:** nvm (.nvmrc present)
- **Package Manager:** pnpm 8.14.0
- **Lock File:** pnpm-lock.yaml

## Frameworks

| Framework | Version | Purpose |
|-----------|---------|---------|
| React | 18.2.0 | UI library |
| Vite | 5.0.12 | Build tool |
| Vitest | 1.2.0 | Testing |

## Key Dependencies

| Package | Version | Category | Purpose |
|---------|---------|----------|---------|
| react | 18.2.0 | Core | UI framework |
| react-dom | 18.2.0 | Core | DOM rendering |
| typescript | 5.3.3 | Dev | Type checking |
| vite | 5.0.12 | Dev | Build/dev server |
| vitest | 1.2.0 | Test | Unit testing |

## Build Commands

```bash
pnpm install
pnpm dev
pnpm build
pnpm test
```

## Detection Evidence

```bash
$ cat package.json | jq '.engines'
{ "node": ">=20.0.0" }

$ ls -la | grep lock
pnpm-lock.yaml
```
```

## Validation Checklist

- [ ] At least one language documented with version
- [ ] Runtime platform specified (Node/Python/Go/etc.)
- [ ] Runtime version specified with precision
- [ ] Package manager identified with version
- [ ] At least 5 key dependencies listed
- [ ] Detection evidence provided with actual commands
- [ ] File extensions mapped to languages
- [ ] Build commands documented

## Related Templates

- [architecture.md](./architecture.md) - Uses stack info for architecture decisions
- [integrations.md](./integrations.md) - External service dependencies
- [testing.md](./testing.md) - Test framework from dependencies
- [conventions.md](./conventions.md) - Language/framework conventions
- [structure.md](./structure.md) - Project structure patterns

---
*Template: codebase-stack v0.1.0*
