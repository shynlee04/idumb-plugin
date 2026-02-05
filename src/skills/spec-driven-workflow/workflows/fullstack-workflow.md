# Full-Stack Workflow

Sector-specific workflow for Next.js, Nuxt, Remix, SvelteKit, and other full-stack frameworks.

## Sector Profile

```yaml
sector_id: fullstack
sector_name: "Full-Stack"
frameworks:
  - nextjs: ["app router", "pages router", "14.x", "15.x"]
  - nuxt: ["nuxt 3", "nuxt 2 (legacy)"]
  - remix: ["remix v2", "react-router v7"]
  - sveltekit: ["sveltekit 2"]
  - astro: ["astro 4 (hybrid)"]
  - solidstart: ["solidstart"]

common_patterns:
  - Server-side rendering (SSR)
  - Static site generation (SSG)
  - Incremental static regeneration (ISR)
  - Server components / RSC
  - API routes / server functions
  - Data fetching (server/client)
  - Authentication (session-based)
  - Database integration
  - Form handling (server actions)
  - SEO optimization

typical_complexity:
  simple: "Single page with data fetching"
  moderate: "Multi-page feature, auth, form handling"
  complex: "Cross-cutting feature, real-time, multi-tenant"
  enterprise: "Internationalization, A/B testing, analytics, compliance"
```

## Detection Rules

```yaml
detection:
  primary_indicators:
    - file: "package.json"
      contains_any:
        - "next"
        - "nuxt"
        - "@remix-run"
        - "@sveltejs/kit"
        - "astro"
        - "solid-start"
        
    - file: "next.config.js"
      exists: true
      
    - file: "nuxt.config.ts"
      exists: true
      
    - file: "remix.config.js"
      exists: true
      
  secondary_indicators:
    - directories: ["app/", "pages/", "src/app", "src/routes"]
    - files: ["middleware.ts", "layout.tsx", "+page.svelte"]
    - patterns: ["use server", "getServerSideProps", "loader"]
    
  confidence_scoring:
    primary_match: 60
    secondary_match: 25
    pattern_match: 15
    threshold: 60
```

## Stage Customizations

### Stage 1: Ideation (Full-Stack)

```yaml
stage_1_customizations:
  1.3_constraints:
    fullstack_specific:
      - "Rendering strategy (SSR/SSG/ISR/CSR)"
      - "SEO requirements"
      - "Performance budget (TTFB, LCP, FID)"
      - "Data freshness requirements"
      - "Authentication/session requirements"
      - "Deployment platform constraints (Vercel, Cloudflare, etc.)"
      
  1.4_scope:
    typical_in_scope:
      - "Page/route implementation"
      - "Server components/functions"
      - "Client components"
      - "API routes (if separate)"
      - "Database queries"
      - "Form handling"
      
    typical_out_scope:
      - "External API development"
      - "Database schema design (often)"
      - "Infrastructure changes"
      - "Third-party integrations (auth providers)"
      
  1.5_assumptions:
    common_assumptions:
      - "Framework is configured and running"
      - "Database is set up with ORM"
      - "Authentication is configured"
      - "Deployment pipeline exists"
```

### Stage 2: Research (Full-Stack)

```yaml
stage_2_customizations:
  2.2_codebase_analysis:
    patterns_to_detect:
      - "Routing structure (app router vs pages)"
      - "Data fetching patterns (RSC, loader, getServerSideProps)"
      - "State management approach"
      - "Authentication pattern"
      - "Form handling approach"
      - "Styling approach"
      - "API layer pattern"
      
    files_to_analyze:
      - "app/**/*.{tsx,jsx}"
      - "pages/**/*.{tsx,jsx}"
      - "src/routes/**/*.{svelte,tsx}"
      - "lib/**/*"
      - "utils/**/*"
      - "middleware.{ts,js}"
      - "*.config.{js,ts,mjs}"
      
  2.3_tech_stack:
    required_research:
      - "Framework version and features"
      - "Rendering strategy docs"
      - "Data fetching patterns"
      - "Server actions / mutations"
      - "Caching strategies"
      
  2.4_external_research:
    context7_queries:
      - library: "/vercel/next.js"
        query: "{feature} app router patterns"
      - library: "/vercel/next.js"
        query: "server actions {use_case}"
      - library: "/nuxt/nuxt"
        query: "{feature} composables"
      - library: "/remix-run/remix"
        query: "{feature} loader action patterns"
        
    research_topics:
      - "Data fetching strategy for {data_freshness}"
      - "Caching patterns for {cache_requirements}"
      - "SEO optimization for {page_type}"
      - "Performance patterns for {interaction_type}"
```

### Stage 3: Specification (Full-Stack)

```yaml
stage_3_customizations:
  3.1_requirements:
    fullstack_requirement_types:
      - type: "Page/Route"
        examples:
          - "Route {path} renders {content}"
          - "Page supports {rendering_strategy}"
          - "SEO meta tags present for {page_type}"
          
      - type: "Data"
        examples:
          - "Page fetches {data} from {source}"
          - "Data revalidates every {interval}"
          - "Stale-while-revalidate for {cache_type}"
          
      - type: "Interaction"
        examples:
          - "Form submits to server action"
          - "Optimistic update on {action}"
          - "Loading state during {operation}"
          
      - type: "Performance"
        examples:
          - "TTFB < {N}ms"
          - "LCP < {N}ms"
          - "No CLS during hydration"
          
  3.4_architecture:
    route_spec_template: |
      ### Route: {path}
      
      **Rendering:** SSR | SSG | ISR | CSR
      **Revalidation:** {interval | on-demand | none}
      
      **File Structure:**
      ```
      app/{path}/
      ├── page.tsx          # Main page component
      ├── layout.tsx        # Layout (if needed)
      ├── loading.tsx       # Loading UI
      ├── error.tsx         # Error boundary
      └── {component}.tsx   # Local components
      ```
      
      **Server Data:**
      ```typescript
      // Data fetched on server
      interface ServerData {
        {field}: {type};
      }
      
      async function getData(): Promise<ServerData> {
        // Fetch from {source}
      }
      ```
      
      **Client State:**
      ```typescript
      // Client-side state
      interface ClientState {
        {field}: {type};
      }
      ```
      
      **Server Actions:**
      ```typescript
      // Form/mutation actions
      async function {actionName}(formData: FormData) {
        "use server";
        // {action_description}
      }
      ```
      
      **SEO:**
      ```typescript
      export const metadata: Metadata = {
        title: "{title}",
        description: "{description}",
        openGraph: { ... },
      };
      ```
      
  3.5_interfaces:
    fullstack_interfaces:
      - "Page props interfaces"
      - "Server data interfaces"
      - "Form data interfaces"
      - "Server action return types"
      
  3.6_acceptance:
    fullstack_criteria:
      - type: "Rendering"
        example: "Page renders correct content on server"
        verification: "SSR test / view source"
        
      - type: "Data"
        example: "Fresh data on revalidation"
        verification: "Cache test"
        
      - type: "SEO"
        example: "Meta tags present in HTML"
        verification: "View source / SEO audit"
        
      - type: "Performance"
        example: "LCP < 2.5s"
        verification: "Lighthouse / Web Vitals"
```

### Stage 4: Planning (Full-Stack)

```yaml
stage_4_customizations:
  4.1_task_patterns:
    typical_task_sequence:
      - id: "T{N}-01"
        title: "Create route structure"
        description: "Set up page, layout, loading, error files"
        estimate: "0.5h"
        
      - id: "T{N}-02"
        title: "Implement data fetching"
        description: "Server component data, caching config"
        estimate: "1h"
        depends_on: ["T{N}-01"]
        
      - id: "T{N}-03"
        title: "Build server components"
        description: "Main content, async components"
        estimate: "1-2h"
        depends_on: ["T{N}-02"]
        
      - id: "T{N}-04"
        title: "Build client components"
        description: "Interactive elements, forms"
        estimate: "1-2h"
        depends_on: ["T{N}-01"]
        parallelizable_with: ["T{N}-03"]
        
      - id: "T{N}-05"
        title: "Implement server actions"
        description: "Form handling, mutations"
        estimate: "1h"
        depends_on: ["T{N}-03", "T{N}-04"]
        
      - id: "T{N}-06"
        title: "Add SEO metadata"
        description: "Title, description, OG tags"
        estimate: "0.5h"
        depends_on: ["T{N}-01"]
        
      - id: "T{N}-07"
        title: "Add loading and error states"
        description: "Suspense boundaries, error handling"
        estimate: "0.5h"
        depends_on: ["T{N}-03", "T{N}-04"]
        
      - id: "T{N}-08"
        title: "Write tests"
        description: "Component + integration tests"
        estimate: "1h"
        depends_on: ["T{N}-05"]
        
  4.6_checkpoints:
    fullstack_checkpoints:
      - after: "Route structure + data fetching"
        checks:
          - "Page renders without errors"
          - "Data fetches correctly"
          
      - after: "Components complete"
        checks:
          - "Interactive elements work"
          - "Forms submit correctly"
          - "No hydration mismatches"
          
      - after: "Full feature"
        checks:
          - "SEO meta present"
          - "Performance acceptable"
          - "All tests pass"
```

### Stage 5: Execution (Full-Stack)

```yaml
stage_5_customizations:
  5.4_task_execution:
    fullstack_patterns:
      route_creation:
        nextjs_app:
          - "Create app/{route}/page.tsx"
          - "Create app/{route}/layout.tsx (if needed)"
          - "Create app/{route}/loading.tsx"
          - "Create app/{route}/error.tsx"
          - "Create app/{route}/_components/ (local components)"
          
        nuxt:
          - "Create pages/{route}.vue"
          - "Create composables/use{Feature}.ts"
          - "Create components/{Feature}/*.vue"
          
        sveltekit:
          - "Create src/routes/{route}/+page.svelte"
          - "Create src/routes/{route}/+page.server.ts"
          - "Create src/routes/{route}/+layout.svelte (if needed)"
          
      data_fetching:
        nextjs:
          - "Use async server component"
          - "Configure caching (fetch options / unstable_cache)"
          - "Add revalidation config"
          
        remix:
          - "Export loader function"
          - "Use useLoaderData hook"
          - "Configure cache headers"
          
  5.5_task_validation:
    fullstack_checks:
      - "npm run dev works without errors"
      - "Page renders (both server and client)"
      - "No hydration mismatch warnings"
      - "View source shows SSR content"
      - "Interactive elements work"
      - "Forms submit successfully"
      - "TypeScript compiles"
```

### Stage 6: Verification (Full-Stack)

```yaml
stage_6_customizations:
  6.3_acceptance_testing:
    fullstack_tests:
      unit_tests:
        framework: "vitest | jest"
        coverage_target: "70%"
        patterns:
          - "Server component renders data"
          - "Client component handles interaction"
          - "Server action mutates correctly"
          
      integration_tests:
        framework: "testing-library"
        patterns:
          - "Full page renders"
          - "User flow completes"
          - "Error states display correctly"
          
      e2e_tests:
        framework: "playwright | cypress"
        patterns:
          - "Page loads with correct content"
          - "Form submission works end-to-end"
          - "Navigation works"
          
  6.4_regression:
    fullstack_regression:
      - "Run full test suite"
      - "Check bundle size"
      - "Run Lighthouse audit"
      - "Verify SEO (meta tags, structured data)"
      - "Check Core Web Vitals"
      
  6.5_integration:
    fullstack_integration:
      - "Navigation between routes works"
      - "Layout inheritance correct"
      - "Authentication flows work"
      - "API routes respond correctly"
      - "Database operations work"
```

## Framework-Specific Guidance

### Next.js (App Router)

```yaml
nextjs_specifics:
  patterns:
    preferred:
      - "Server Components by default"
      - "Client Components only for interactivity"
      - "Server Actions for mutations"
      - "Suspense for loading states"
      - "Error boundaries for error handling"
      
    avoid:
      - "getServerSideProps in App Router"
      - "Client-side data fetching when SSR possible"
      - "useEffect for data fetching"
      - "Large 'use client' boundaries"
      
  research_queries:
    context7:
      - library: "/vercel/next.js"
        topics:
          - "server components patterns"
          - "server actions"
          - "caching strategies"
          - "parallel routes"
          - "intercepting routes"
          
  data_fetching:
    server_components: |
      // Async Server Component
      async function Page() {
        const data = await fetch('...', {
          next: { revalidate: 3600 }
        });
        return <Component data={data} />;
      }
      
    server_actions: |
      // Server Action
      async function submitForm(formData: FormData) {
        'use server';
        // mutate data
        revalidatePath('/path');
      }
      
  testing:
    tools: ["vitest", "@testing-library/react", "playwright"]
```

### Nuxt 3

```yaml
nuxt_specifics:
  patterns:
    preferred:
      - "Composables for reusable logic"
      - "useFetch/useAsyncData for data fetching"
      - "Auto-imports"
      - "definePageMeta for route config"
      
    avoid:
      - "Options API (prefer Composition API)"
      - "Client-side only data fetching"
      
  research_queries:
    context7:
      - library: "/nuxt/nuxt"
        topics:
          - "composables patterns"
          - "useFetch vs useAsyncData"
          - "middleware"
          - "server routes"
          
  data_fetching:
    composable: |
      // In page or component
      const { data, pending, error } = await useFetch('/api/data', {
        key: 'unique-key',
        server: true,
        lazy: false
      });
      
  testing:
    tools: ["vitest", "@vue/test-utils", "playwright"]
```

### Remix

```yaml
remix_specifics:
  patterns:
    preferred:
      - "Loaders for data fetching"
      - "Actions for mutations"
      - "useLoaderData, useActionData"
      - "Optimistic UI with useFetcher"
      - "Progressive enhancement"
      
    avoid:
      - "useEffect for data fetching"
      - "Client-only state for server data"
      
  research_queries:
    context7:
      - library: "/remix-run/remix"
        topics:
          - "loader patterns"
          - "action patterns"
          - "error handling"
          - "optimistic UI"
          
  data_fetching:
    loader: |
      export async function loader({ params }: LoaderFunctionArgs) {
        const data = await db.query(...);
        return json({ data });
      }
      
      export default function Route() {
        const { data } = useLoaderData<typeof loader>();
        return <Component data={data} />;
      }
      
  testing:
    tools: ["vitest", "@testing-library/react", "playwright"]
```

### SvelteKit

```yaml
sveltekit_specifics:
  patterns:
    preferred:
      - "+page.server.ts for server data"
      - "+page.ts for universal data"
      - "Form actions for mutations"
      - "Stores for client state"
      
    avoid:
      - "onMount for data fetching"
      - "Client-only data when SSR possible"
      
  research_queries:
    context7:
      - library: "/sveltejs/kit"
        topics:
          - "load functions"
          - "form actions"
          - "hooks"
          - "streaming"
          
  data_fetching:
    load_function: |
      // +page.server.ts
      export async function load({ params }) {
        const data = await db.query(...);
        return { data };
      }
      
  testing:
    tools: ["vitest", "@testing-library/svelte", "playwright"]
```

## Template Variations

### Page Spec (Next.js App Router)

```markdown
### Route: /dashboard/[teamId]

**Rendering:** SSR (dynamic route)
**Authentication:** Required (middleware)

**File Structure:**
\`\`\`
app/dashboard/[teamId]/
├── page.tsx           # Main dashboard page
├── layout.tsx         # Dashboard layout with nav
├── loading.tsx        # Skeleton loader
├── error.tsx          # Error boundary
└── _components/
    ├── TeamStats.tsx  # Server component
    └── ActivityFeed.tsx # Client component
\`\`\`

**Params:**
\`\`\`typescript
interface Params {
  teamId: string;
}
\`\`\`

**Server Data:**
\`\`\`typescript
interface DashboardData {
  team: Team;
  stats: TeamStats;
  recentActivity: Activity[];
}

async function getData(teamId: string): Promise<DashboardData> {
  const [team, stats, activity] = await Promise.all([
    getTeam(teamId),
    getTeamStats(teamId),
    getRecentActivity(teamId, { limit: 10 })
  ]);
  return { team, stats, recentActivity: activity };
}
\`\`\`

**Metadata:**
\`\`\`typescript
export async function generateMetadata({ params }): Promise<Metadata> {
  const team = await getTeam(params.teamId);
  return {
    title: \`\${team.name} Dashboard\`,
    description: \`View stats and activity for \${team.name}\`,
  };
}
\`\`\`

**Caching:**
- Team data: revalidate every 60s
- Stats: revalidate every 5m
- Activity: no cache (real-time)
```

## Validation Rules (Full-Stack)

```yaml
fullstack_validation:
  route_validation:
    rules:
      - name: "has_loading_state"
        check: "loading.tsx exists OR Suspense boundary"
        severity: warn
        
      - name: "has_error_handling"
        check: "error.tsx exists OR try-catch"
        severity: warn
        
      - name: "has_seo_metadata"
        check: "Metadata export or head tags"
        severity: warn
        for: "public pages only"
        
  rendering_validation:
    rules:
      - name: "correct_boundary"
        check: "'use client' only where needed"
        severity: warn
        
      - name: "no_hydration_mismatch"
        check: "No client-only logic in shared components"
        severity: block
        
  performance_validation:
    rules:
      - name: "appropriate_caching"
        check: "Caching strategy defined"
        severity: warn
        
      - name: "bundle_size"
        check: "Client bundle < threshold"
        severity: warn
```

---

*Workflow: fullstack v1.0.0*
