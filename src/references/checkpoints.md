# Checkpoints

Plans execute autonomously. Checkpoints formalize the interaction points where human verification or decisions are needed.

<overview>
**Core principle:** Claude automates everything with CLI/API. Checkpoints are for verification and decisions, not manual work.

**Golden rules:**
1. **If Claude can run it, Claude runs it** - Never ask user to execute CLI commands, start servers, or run builds
2. **Claude sets up the verification environment** - Start dev servers, seed databases, configure env vars
3. **User only does what requires human judgment** - Visual checks, UX evaluation, "does this feel right?"
4. **Secrets come from user, automation comes from Claude** - Ask for API keys, then Claude uses them via CLI

**iDumb Integration:**
- `@idumb-executor` manages checkpoints during phase execution
- `@idumb-verifier` triggers human verification checkpoints
- Checkpoint state persisted in `.idumb/brain/state.json` anchors
</overview>

<checkpoint_types>

<type name="human-verify">
## checkpoint:human-verify (Most Common - 90%)

**When:** Claude completed automated work, human confirms it works correctly.

**Use for:**
- Visual UI checks (layout, styling, responsiveness)
- Interactive flows (click through wizard, test user flows)
- Functional verification (feature works as expected)
- Audio/video playback quality
- Animation smoothness
- Accessibility testing

**Structure:**
```xml
<task type="checkpoint:human-verify" gate="blocking">
  <what-built>[What Claude automated and deployed/built]</what-built>
  <how-to-verify>
    [Exact steps to test - URLs, commands, expected behavior]
  </how-to-verify>
  <resume-signal>[How to continue - "approved", "yes", or describe issues]</resume-signal>
</task>
```

**iDumb agents involved:**
- `@idumb-executor` pauses and displays checkpoint
- `@idumb-verifier` may spawn before checkpoint to pre-validate
- Anchor created: `type: checkpoint, priority: critical`

**Example: UI Component**
```xml
<task type="auto">
  <name>Build responsive dashboard layout</name>
  <files>src/components/Dashboard.tsx, src/app/dashboard/page.tsx</files>
  <action>Create dashboard with sidebar, header, and content area. Use Tailwind responsive classes for mobile.</action>
  <verify>npm run build succeeds, no TypeScript errors</verify>
  <done>Dashboard component builds without errors</done>
</task>

<task type="auto">
  <name>Start dev server for verification</name>
  <action>Run `npm run dev` in background, wait for "ready" message, capture port</action>
  <verify>curl http://localhost:3000 returns 200</verify>
  <done>Dev server running at http://localhost:3000</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>Responsive dashboard layout - dev server running at http://localhost:3000</what-built>
  <how-to-verify>
    Visit http://localhost:3000/dashboard and verify:
    1. Desktop (>1024px): Sidebar left, content right, header top
    2. Tablet (768px): Sidebar collapses to hamburger menu
    3. Mobile (375px): Single column layout, bottom nav appears
    4. No layout shift or horizontal scroll at any size
  </how-to-verify>
  <resume-signal>Type "approved" or describe layout issues</resume-signal>
</task>
```

**Key pattern:** Claude starts the dev server BEFORE the checkpoint. User only needs to visit the URL.
</type>

<type name="decision">
## checkpoint:decision (9%)

**When:** Human must make choice that affects implementation direction.

**Use for:**
- Technology selection (which auth provider, which database)
- Architecture decisions (monorepo vs separate repos)
- Design choices (color scheme, layout approach)
- Feature prioritization (which variant to build)
- Data model decisions (schema structure)

**Structure:**
```xml
<task type="checkpoint:decision" gate="blocking">
  <decision>[What's being decided]</decision>
  <context>[Why this decision matters]</context>
  <options>
    <option id="option-a">
      <name>[Option name]</name>
      <pros>[Benefits]</pros>
      <cons>[Tradeoffs]</cons>
    </option>
    <option id="option-b">
      <name>[Option name]</name>
      <pros>[Benefits]</pros>
      <cons>[Tradeoffs]</cons>
    </option>
  </options>
  <resume-signal>[How to indicate choice]</resume-signal>
</task>
```

**iDumb agents involved:**
- `@idumb-executor` displays options, waits for response
- Decision recorded in `.idumb/brain/state.json` history
- Anchor created: `type: decision, priority: critical`

**Example: Auth Provider Selection**
```xml
<task type="checkpoint:decision" gate="blocking">
  <decision>Select authentication provider</decision>
  <context>
    Need user authentication for the app. Three solid options with different tradeoffs.
  </context>
  <options>
    <option id="supabase">
      <name>Supabase Auth</name>
      <pros>Built-in with Supabase DB we're using, generous free tier, row-level security integration</pros>
      <cons>Less customizable UI, tied to Supabase ecosystem</cons>
    </option>
    <option id="clerk">
      <name>Clerk</name>
      <pros>Beautiful pre-built UI, best developer experience, excellent docs</pros>
      <cons>Paid after 10k MAU, vendor lock-in</cons>
    </option>
    <option id="nextauth">
      <name>NextAuth.js</name>
      <pros>Free, self-hosted, maximum control, widely adopted</pros>
      <cons>More setup work, you manage security updates, UI is DIY</cons>
    </option>
  </options>
  <resume-signal>Select: supabase, clerk, or nextauth</resume-signal>
</task>
```
</type>

<type name="human-action">
## checkpoint:human-action (1% - Rare)

**When:** Action has NO CLI/API and requires human-only interaction, OR Claude hit an authentication gate during automation.

**Use ONLY for:**
- **Authentication gates** - Claude tried to use CLI/API but needs credentials to continue
- Email verification links (account creation requires clicking email)
- SMS 2FA codes (phone verification)
- Manual account approvals (platform requires human review)
- Credit card 3D Secure flows (web-based payment authorization)
- OAuth app approvals (some platforms require web-based approval)

**Do NOT use for pre-planned manual work:**
- Manually deploying to Vercel (use `vercel` CLI)
- Manually creating Stripe webhooks (use Stripe API)
- Running builds/tests manually (use Bash tool)
- Creating files manually (use Write tool)

**Structure:**
```xml
<task type="checkpoint:human-action" gate="blocking">
  <action>[What human must do - Claude already did everything automatable]</action>
  <instructions>
    [What Claude already automated]
    [The ONE thing requiring human action]
  </instructions>
  <verification>[What Claude can check afterward]</verification>
  <resume-signal>[How to continue]</resume-signal>
</task>
```

**Key principle:** Claude automates EVERYTHING possible first, only asks human for the truly unavoidable manual step.

**Example: Authentication Gate (Dynamic Checkpoint)**
```xml
<task type="auto">
  <name>Deploy to Vercel</name>
  <files>.vercel/, vercel.json</files>
  <action>Run `vercel --yes` to deploy</action>
  <verify>vercel ls shows deployment, curl returns 200</verify>
</task>

<!-- If vercel returns "Error: Not authenticated", Claude creates checkpoint on the fly -->

<task type="checkpoint:human-action" gate="blocking">
  <action>Authenticate Vercel CLI so I can continue deployment</action>
  <instructions>
    I tried to deploy but got authentication error.
    Run: vercel login
    This will open your browser - complete the authentication flow.
  </instructions>
  <verification>vercel whoami returns your account email</verification>
  <resume-signal>Type "done" when authenticated</resume-signal>
</task>

<!-- After authentication, Claude retries the deployment -->
```
</type>
</checkpoint_types>

<execution_protocol>

## Execution Protocol

When `@idumb-executor` encounters `type="checkpoint:*"`:

1. **Stop immediately** - do not proceed to next task
2. **Create anchor** - persist checkpoint in state.json
3. **Display checkpoint** - use UI brand formatting
4. **Wait for user response** - do not hallucinate completion
5. **Verify if possible** - check files, run tests
6. **Clear anchor** - mark checkpoint resolved
7. **Resume execution** - continue to next task

**Display format:** (see ui-brand.md for full templates)

```
╔═══════════════════════════════════════════════════════╗
║  CHECKPOINT: Verification Required                    ║
╚═══════════════════════════════════════════════════════╝

Progress: 5/8 tasks complete
Task: Responsive dashboard layout

Built: Responsive dashboard at /dashboard

How to verify:
  1. Visit: http://localhost:3000/dashboard
  2. Desktop (>1024px): Sidebar visible
  3. Tablet (768px): Sidebar collapses
  4. Mobile (375px): Single column

────────────────────────────────────────────────────────
→ YOUR ACTION: Type "approved" or describe issues
────────────────────────────────────────────────────────
```

</execution_protocol>

<authentication_gates>

## Authentication Gates

**Critical:** When Claude tries CLI/API and gets auth error, this is NOT a failure - it's a gate requiring human input to unblock automation.

**Pattern:** Claude tries automation → auth error → creates checkpoint → you authenticate → Claude retries → continues

**Gate protocol:**
1. Recognize it's not a failure - missing auth is expected
2. Stop current task - don't retry repeatedly
3. Create checkpoint:human-action dynamically
4. Provide exact authentication steps
5. Verify authentication works
6. Retry the original task
7. Continue normally

**iDumb handling:**
- `@idumb-executor` catches auth errors
- Creates dynamic checkpoint anchor
- After user action, retries failed task
- Resumes normal flow

</authentication_gates>

<automation_reference>

## Service CLI Reference

| Service | CLI | Key Commands | Auth Gate |
|---------|-----|--------------|-----------|
| Vercel | `vercel` | `--yes`, `env add`, `--prod` | `vercel login` |
| Railway | `railway` | `init`, `up`, `variables set` | `railway login` |
| Fly | `fly` | `launch`, `deploy`, `secrets set` | `fly auth login` |
| Stripe | `stripe` + API | `listen`, `trigger` | API key in .env |
| Supabase | `supabase` | `init`, `link`, `db push` | `supabase login` |
| GitHub | `gh` | `repo create`, `pr create` | `gh auth login` |
| Node | `npm`/`pnpm` | `install`, `run`, `test` | N/A |
| Convex | `npx convex` | `dev`, `deploy`, `env set` | `npx convex login` |

## Environment Variable Automation

**Env files:** Use Write/Edit tools. Never ask human to create .env manually.

**Dashboard env vars via CLI:**

| Platform | CLI Command |
|----------|-------------|
| Convex | `npx convex env set KEY=value` |
| Vercel | `vercel env add KEY production` |
| Railway | `railway variables set KEY=value` |
| Fly | `fly secrets set KEY=value` |

**Pattern for secret collection:**
```xml
<!-- RIGHT: Claude asks for value, then adds via CLI -->
<task type="checkpoint:human-action">
  <action>Provide your OpenAI API key</action>
  <instructions>
    I need your OpenAI API key to configure the backend.
    Get it from: https://platform.openai.com/api-keys
    Paste the key (starts with sk-)
  </instructions>
  <verification>I'll add it via CLI and verify</verification>
  <resume-signal>Paste your API key</resume-signal>
</task>

<task type="auto">
  <name>Configure OpenAI key</name>
  <action>Run `npx convex env set OPENAI_API_KEY {user-provided-key}`</action>
  <verify>`npx convex env get OPENAI_API_KEY` returns masked key</verify>
</task>
```

## Dev Server Automation

**Claude starts servers, user visits URLs:**

| Framework | Start Command | Ready Signal | Default URL |
|-----------|---------------|--------------|-------------|
| Next.js | `npm run dev` | "Ready in" | http://localhost:3000 |
| Vite | `npm run dev` | "ready in" | http://localhost:5173 |
| Express | `npm start` | "listening on" | http://localhost:3000 |

### Server Lifecycle Protocol

```bash
# Run in background, capture PID
npm run dev &
DEV_SERVER_PID=$!

# Wait for ready signal (max 30s)
timeout 30 bash -c 'until curl -s localhost:3000 > /dev/null 2>&1; do sleep 1; done'
```

**Port conflicts:**
1. Kill stale process: `lsof -ti:3000 | xargs kill`
2. Use alternate port: `npm run dev -- --port 3001`

**Server stays running** for checkpoint duration. Only kill when:
- Plan is complete
- Switching to production deployment
- Port needed for different service

</automation_reference>

<checkpoint_placement>

## Checkpoint Placement Guidelines

**DO place checkpoints:**
- **After automation completes** - not before Claude does the work
- **After UI buildout** - before declaring phase complete
- **Before dependent work** - decisions before implementation
- **At integration points** - after configuring external services

**DON'T place checkpoints:**
- Before Claude automates (asking human to do automatable work)
- Too frequent (every other task is a checkpoint)
- Too late (checkpoint is last task, but earlier tasks needed its result)

**Checkpoint density:**
- Simple phase (5 tasks): 0-1 checkpoints
- Medium phase (10 tasks): 1-2 checkpoints
- Complex phase (20+ tasks): 2-4 checkpoints

</checkpoint_placement>

<idumb_anchor_format>

## iDumb Anchor Format

Checkpoints are persisted as anchors in `.idumb/brain/state.json`:

```json
{
  "anchors": [
    {
      "id": "cp-20260204-001",
      "type": "checkpoint",
      "priority": "critical",
      "content": "checkpoint:human-verify - Dashboard layout at localhost:3000",
      "created": "2026-02-04T12:00:00Z",
      "phase": "phase-1",
      "task": "3.2",
      "status": "pending"
    }
  ]
}
```

**Anchor lifecycle:**
1. Created when checkpoint reached
2. Status updated when user responds
3. Cleared (or kept as history) after resolution

</idumb_anchor_format>

<writing_guidelines>

## Writing Guidelines

**DO:**
- Automate everything with CLI/API before checkpoint
- Be specific: "Visit https://myapp.vercel.app" not "check deployment"
- Number verification steps
- State expected outcomes
- Provide context

**DON'T:**
- Ask human to do work Claude can automate
- Assume knowledge
- Skip steps
- Mix multiple verifications in one checkpoint
- Make verification impossible without user confirmation

</writing_guidelines>

<anti_patterns>

## Anti-Patterns

### ❌ BAD: Asking user to start dev server
```xml
<task type="checkpoint:human-verify">
  <how-to-verify>
    1. Run: npm run dev
    2. Visit: http://localhost:3000
  </how-to-verify>
</task>
```

### ✅ GOOD: Claude starts server, user visits
```xml
<task type="auto">
  <name>Start dev server</name>
  <action>Run `npm run dev` in background</action>
  <verify>curl localhost:3000 returns 200</verify>
</task>

<task type="checkpoint:human-verify">
  <what-built>Feature at http://localhost:3000 (server running)</what-built>
  <how-to-verify>
    Visit http://localhost:3000 and verify layout
  </how-to-verify>
</task>
```

### ❌ BAD: Asking user to add env vars in dashboard
```xml
<task type="checkpoint:human-action">
  <instructions>Go to dashboard.convex.dev → Settings → Add env var</instructions>
</task>
```

### ✅ GOOD: Claude collects secret, adds via CLI
```xml
<task type="checkpoint:human-action">
  <action>Provide your API key</action>
  <resume-signal>Paste your key</resume-signal>
</task>

<task type="auto">
  <action>Run `npx convex env set KEY={user-key}`</action>
</task>
```

</anti_patterns>
