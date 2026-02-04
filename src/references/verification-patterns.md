# Verification Patterns

How to verify different types of artifacts are real implementations, not stubs or placeholders.

<core_principle>
**Existence ≠ Implementation**

A file existing does not mean the feature works. Verification must check:
1. **Exists** - File is present at expected path
2. **Substantive** - Content is real implementation, not placeholder
3. **Wired** - Connected to the rest of the system
4. **Functional** - Actually works when invoked

Levels 1-3 can be checked programmatically by `@idumb-low-validator`.
Level 4 often requires human verification via `@idumb-verifier`.
</core_principle>

<hierarchy_integration>
## iDumb Verification Hierarchy

| Level | Agent | Method | Scope |
|-------|-------|--------|-------|
| 1 - Exists | idumb-low-validator | `glob`, `read` | File presence check |
| 2 - Substantive | idumb-low-validator | `grep`, pattern matching | Content quality check |
| 3 - Wired | idumb-integration-checker | Import/export tracing | Connection verification |
| 4 - Functional | idumb-verifier | Bash (tests), human | Runtime behavior |

**Delegation Chain:**
```
idumb-executor → idumb-verifier → idumb-low-validator
                 ↳ idumb-integration-checker (for wiring)
```
</hierarchy_integration>

<stub_detection>

## Universal Stub Patterns

These patterns indicate placeholder code regardless of file type:

**Comment-based stubs:**
```bash
# Grep patterns for stub comments
grep -E "(TODO|FIXME|XXX|HACK|PLACEHOLDER)" "$file"
grep -E "implement|add later|coming soon|will be" "$file" -i
grep -E "// \.\.\.|/\* \.\.\. \*/|# \.\.\." "$file"
```

**Placeholder text in output:**
```bash
# UI placeholder patterns
grep -E "placeholder|lorem ipsum|coming soon|under construction" "$file" -i
grep -E "sample|example|test data|dummy" "$file" -i
grep -E "\[.*\]|<.*>|\{.*\}" "$file"  # Template brackets left in
```

**Empty or trivial implementations:**
```bash
# Functions that do nothing
grep -E "return null|return undefined|return \{\}|return \[\]" "$file"
grep -E "pass$|\.\.\.|\bnothing\b" "$file"
grep -E "console\.(log|warn|error).*only" "$file"  # Log-only functions
```

**Hardcoded values where dynamic expected:**
```bash
# Hardcoded IDs, counts, or content
grep -E "id.*=.*['\"].*['\"]" "$file"  # Hardcoded string IDs
grep -E "count.*=.*\d+|length.*=.*\d+" "$file"  # Hardcoded counts
grep -E "\\$\d+\.\d{2}|\d+ items" "$file"  # Hardcoded display values
```

</stub_detection>

<react_components>

## React/Next.js Components

**Existence check:**
```bash
# File exists and exports component
[ -f "$component_path" ] && grep -E "export (default |)function|export const.*=.*\(" "$component_path"
```

**Substantive check:**
```bash
# Returns actual JSX, not placeholder
grep -E "return.*<" "$component_path" | grep -v "return.*null" | grep -v "placeholder" -i

# Has meaningful content (not just wrapper div)
grep -E "<[A-Z][a-zA-Z]+|className=|onClick=|onChange=" "$component_path"

# Uses props or state (not static)
grep -E "props\.|useState|useEffect|useContext|\{.*\}" "$component_path"
```

**Stub patterns specific to React:**
```javascript
// RED FLAGS - These are stubs:
return <div>Component</div>
return <div>Placeholder</div>
return <div>{/* TODO */}</div>
return <p>Coming soon</p>
return null
return <></>

// Also stubs - empty handlers:
onClick={() => {}}
onChange={() => console.log('clicked')}
onSubmit={(e) => e.preventDefault()}  // Only prevents default, does nothing
```

**Wiring check:**
```bash
# Component imports what it needs
grep -E "^import.*from" "$component_path"

# Props are actually used (not just received)
grep -E "\{ .* \}.*props|\bprops\.[a-zA-Z]+" "$component_path"

# API calls exist (for data-fetching components)
grep -E "fetch\(|axios\.|useSWR|useQuery|getServerSideProps|getStaticProps" "$component_path"
```

**Functional verification (human required):**
- Does the component render visible content?
- Do interactive elements respond to clicks?
- Does data load and display?
- Do error states show appropriately?

</react_components>

<api_routes>

## API Routes (Next.js App Router / Express / etc.)

**Existence check:**
```bash
# Route file exists
[ -f "$route_path" ]

# Exports HTTP method handlers (Next.js App Router)
grep -E "export (async )?(function|const) (GET|POST|PUT|PATCH|DELETE)" "$route_path"

# Or Express-style handlers
grep -E "\.(get|post|put|patch|delete)\(" "$route_path"
```

**Substantive check:**
```bash
# Has actual logic, not just return statement
wc -l "$route_path"  # More than 10-15 lines suggests real implementation

# Interacts with data source
grep -E "prisma\.|db\.|mongoose\.|sql|query|find|create|update|delete" "$route_path" -i

# Has error handling
grep -E "try|catch|throw|error|Error" "$route_path"

# Returns meaningful response
grep -E "Response\.json|res\.json|res\.send|return.*\{" "$route_path" | grep -v "message.*not implemented" -i
```

**Stub patterns specific to API routes:**
```typescript
// RED FLAGS - These are stubs:
export async function POST() {
  return Response.json({ message: "Not implemented" })
}

export async function GET() {
  return Response.json([])  // Empty array with no DB query
}

export async function PUT() {
  return new Response()  // Empty response
}

// Console log only:
export async function POST(req) {
  console.log(await req.json())
  return Response.json({ ok: true })
}
```

**Wiring check:**
```bash
# Imports database/service clients
grep -E "^import.*prisma|^import.*db|^import.*client" "$route_path"

# Actually uses request body (for POST/PUT)
grep -E "req\.json\(\)|req\.body|request\.json\(\)" "$route_path"

# Validates input (not just trusting request)
grep -E "schema\.parse|validate|zod|yup|joi" "$route_path"
```

</api_routes>

<database_schema>

## Database Schema (Prisma / Drizzle / SQL)

**Existence check:**
```bash
# Schema file exists
[ -f "prisma/schema.prisma" ] || [ -f "drizzle/schema.ts" ] || [ -f "src/db/schema.sql" ]

# Model/table is defined
grep -E "^model $model_name|CREATE TABLE $table_name|export const $table_name" "$schema_path"
```

**Substantive check:**
```bash
# Has expected fields (not just id)
grep -A 20 "model $model_name" "$schema_path" | grep -E "^\s+\w+\s+\w+"

# Has relationships if expected
grep -E "@relation|REFERENCES|FOREIGN KEY" "$schema_path"

# Has appropriate field types (not all String)
grep -A 20 "model $model_name" "$schema_path" | grep -E "Int|DateTime|Boolean|Float|Decimal|Json"
```

**Stub patterns specific to schemas:**
```prisma
// RED FLAGS - These are stubs:
model User {
  id String @id
  // TODO: add fields
}

model Message {
  id        String @id
  content   String  // Only one real field
}

// Missing critical fields:
model Order {
  id     String @id
  // No: userId, items, total, status, createdAt
}
```

**Wiring check:**
```bash
# Migrations exist and are applied
ls prisma/migrations/ 2>/dev/null | wc -l  # Should be > 0
npx prisma migrate status 2>/dev/null | grep -v "pending"

# Client is generated
[ -d "node_modules/.prisma/client" ]
```

</database_schema>

<typescript_tools>

## TypeScript Tools (iDumb-specific)

**Existence check:**
```bash
# Tool file exists
[ -f "$tool_path" ]

# Exports tool wrapper
grep -E "export.*=.*tool\(|tool\(['\"]" "$tool_path"
```

**Substantive check:**
```bash
# Has parameter schema
grep -E "z\.|zod\.|parameters:" "$tool_path"

# Has actual implementation (not just logging)
grep -E "return.*{|return new" "$tool_path" | grep -v "console.log"

# More than 30 lines
[ $(wc -l < "$tool_path") -gt 30 ]
```

**Wiring check:**
```bash
# Exported from tools/index.ts
grep -E "export.*from.*$tool_name" "src/tools/index.ts"

# Used by at least one agent
grep -rE "tools:.*$tool_name|idumb-$tool_name" "src/agents/"
```

</typescript_tools>

<agent_profiles>

## Agent Profiles (iDumb-specific)

**Existence check:**
```bash
# Agent file exists
[ -f "$agent_path" ]

# Has YAML frontmatter
head -1 "$agent_path" | grep -q "^---"
```

**Substantive check (4-Field Persona):**
```bash
# Has Role section
grep -E "^## (Role|Purpose)" "$agent_path"

# Has Identity section
grep -E "^## Identity" "$agent_path"

# Has Communication Style section
grep -E "^## (Communication Style|Style)" "$agent_path"

# Has Principles section
grep -E "^## (Principles|ABSOLUTE RULES)" "$agent_path"
```

**Stub patterns specific to agents:**
```markdown
## RED FLAGS - These are stubs:

## Role
TODO: Define role

## Identity
I am an agent.

## Communication Style
Normal.

## Principles
- Be good
```

**Wiring check:**
```bash
# Agent referenced in commands
grep -rE "agent:.*$agent_name|@$agent_name" "src/commands/"

# Agent in config
grep -E "$agent_name" ".idumb/idumb-brain/config.json"
```

</agent_profiles>

<wiring_verification>

## Wiring Verification Patterns

Wiring verification checks that components actually communicate. This is where most stubs hide.

### Pattern: Component → API

**Check:** Does the component actually call the API?

```bash
# Find the fetch/axios call
grep -E "fetch\(['\"].*$api_path|axios\.(get|post).*$api_path" "$component_path"

# Verify it's not commented out
grep -E "fetch\(|axios\." "$component_path" | grep -v "^.*//.*fetch"

# Check the response is used
grep -E "await.*fetch|\.then\(|setData|setState" "$component_path"
```

### Pattern: API → Database

**Check:** Does the API route actually query the database?

```bash
# Find the database call
grep -E "prisma\.$model|db\.query|Model\.find" "$route_path"

# Verify it's awaited
grep -E "await.*prisma|await.*db\." "$route_path"

# Check result is returned
grep -E "return.*json.*data|res\.json.*result" "$route_path"
```

### Pattern: Agent → Tool

**Check:** Does the agent actually use the tool?

```bash
# Tool listed in agent frontmatter
grep -E "tools:.*$tool_name" "$agent_path"

# Tool described in workflow
grep -E "using.*$tool_name|call.*$tool_name|idumb-$tool_name" "$agent_path"
```

### Pattern: Command → Agent

**Check:** Does the command route to the correct agent?

```bash
# Agent specified in command
grep -E "^agent:|agent:.*$agent_name" "$command_path"

# Workflow triggers agent
grep -E "@$agent_name|spawn.*$agent_name" "$command_path"
```

</wiring_verification>

<verification_checklist>

## Quick Verification Checklist

For each artifact type, run through this checklist:

### Component Checklist
- [ ] File exists at expected path
- [ ] Exports a function/const component
- [ ] Returns JSX (not null/empty)
- [ ] No placeholder text in render
- [ ] Uses props or state (not static)
- [ ] Event handlers have real implementations
- [ ] Imports resolve correctly
- [ ] Used somewhere in the app

### API Route Checklist
- [ ] File exists at expected path
- [ ] Exports HTTP method handlers
- [ ] Handlers have more than 5 lines
- [ ] Queries database or service
- [ ] Returns meaningful response (not empty/placeholder)
- [ ] Has error handling
- [ ] Validates input
- [ ] Called from frontend

### Agent Checklist (iDumb-specific)
- [ ] File exists at `src/agents/idumb-{name}.md`
- [ ] Has valid YAML frontmatter
- [ ] Has all 4 persona fields (Role, Identity, Style, Principles)
- [ ] Role uses first-person voice
- [ ] Principles array has 3-8 bullets
- [ ] Listed in config.json
- [ ] Referenced by at least one command

### Tool Checklist (iDumb-specific)
- [ ] File exists at `src/tools/idumb-{name}.ts`
- [ ] Exports `tool()` wrapper
- [ ] Has parameter schema (zod)
- [ ] Implementation > 30 lines
- [ ] Exported from tools/index.ts
- [ ] Used by at least one agent

### Wiring Checklist
- [ ] Component → API: fetch/axios call exists and uses response
- [ ] API → Database: query exists and result returned
- [ ] Agent → Tool: tool listed in frontmatter and used in workflow
- [ ] Command → Agent: agent specified and workflow triggers it
- [ ] Form → Handler: onSubmit calls API/mutation
- [ ] State → Render: state variables appear in JSX/output

</verification_checklist>

<automated_verification_script>

## Automated Verification Script

For `@idumb-low-validator` to use:

```bash
# 1. Check existence
check_exists() {
  [ -f "$1" ] && echo "EXISTS: $1" || echo "MISSING: $1"
}

# 2. Check for stub patterns
check_stubs() {
  local file="$1"
  local stubs=$(grep -c -E "TODO|FIXME|placeholder|not implemented" "$file" 2>/dev/null || echo 0)
  [ "$stubs" -gt 0 ] && echo "STUB_PATTERNS: $stubs in $file"
}

# 3. Check wiring (component calls API)
check_wiring() {
  local component="$1"
  local api_path="$2"
  grep -q "$api_path" "$component" && echo "WIRED: $component → $api_path" || echo "NOT_WIRED: $component → $api_path"
}

# 4. Check substantive (more than N lines, has expected patterns)
check_substantive() {
  local file="$1"
  local min_lines="$2"
  local pattern="$3"
  local lines=$(wc -l < "$file" 2>/dev/null || echo 0)
  local has_pattern=$(grep -c -E "$pattern" "$file" 2>/dev/null || echo 0)
  [ "$lines" -ge "$min_lines" ] && [ "$has_pattern" -gt 0 ] && echo "SUBSTANTIVE: $file" || echo "THIN: $file ($lines lines, $has_pattern matches)"
}

# 5. Verify 4-field persona (agents only)
check_agent_persona() {
  local agent="$1"
  local role=$(grep -c "^## Role\|^## Purpose" "$agent")
  local identity=$(grep -c "^## Identity" "$agent")
  local style=$(grep -c "^## Communication Style\|^## Style" "$agent")
  local principles=$(grep -c "^## Principles\|^## ABSOLUTE RULES" "$agent")
  [ "$role" -gt 0 ] && [ "$identity" -gt 0 ] && [ "$style" -gt 0 ] && [ "$principles" -gt 0 ] && echo "PERSONA: Complete" || echo "PERSONA: Incomplete (R:$role I:$identity S:$style P:$principles)"
}
```

</automated_verification_script>

<human_verification_triggers>

## When to Require Human Verification

Some things can't be verified programmatically. Flag these for human testing:

**Always human:**
- Visual appearance (does it look right?)
- User flow completion (can you actually do the thing?)
- Real-time behavior (WebSocket, SSE)
- External service integration (Stripe, email sending)
- Error message clarity (is the message helpful?)
- Performance feel (does it feel fast?)

**Human if uncertain:**
- Complex wiring that grep can't trace
- Dynamic behavior depending on state
- Edge cases and error states
- Mobile responsiveness
- Accessibility

**Format for human verification request:**
```markdown
## Human Verification Required

### 1. Chat message sending
**Test:** Type a message and click Send
**Expected:** Message appears in list, input clears
**Check:** Does message persist after refresh?

### 2. Error handling
**Test:** Disconnect network, try to send
**Expected:** Error message appears, message not lost
**Check:** Can retry after reconnect?
```

</human_verification_triggers>

<idumb_verification_report>

## Verification Report Format

Generated by `@idumb-verifier`:

```yaml
verification_report:
  phase: "{phase-name}"
  timestamp: "{ISO-8601}"
  verified_by: "idumb-verifier"
  
  summary:
    total_artifacts: 12
    passed: 10
    failed: 1
    needs_human: 1
    
  level_breakdown:
    exists:
      passed: 12
      failed: 0
    substantive:
      passed: 11
      failed: 1
      failures:
        - path: "src/components/Chat.tsx"
          issue: "Placeholder text found"
    wired:
      passed: 10
      failed: 2
      failures:
        - path: "src/api/messages/route.ts"
          issue: "Not called by any component"
    functional:
      passed: 8
      needs_human: 2
      human_tests:
        - description: "Chat message sending"
          steps: ["Type message", "Click send", "Verify appears"]
          
  blocking_issues:
    - path: "src/components/Chat.tsx"
      level: "substantive"
      issue: "Contains placeholder text"
      
  recommendation: "Fix 1 substantive issue before phase completion"
```

</idumb_verification_report>
