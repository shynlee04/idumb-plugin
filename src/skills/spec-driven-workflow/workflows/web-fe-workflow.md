# Web Frontend Workflow

Sector-specific workflow for React, Vue, Svelte, Angular and other frontend frameworks.

## Sector Profile

```yaml
sector_id: web-fe
sector_name: "Web Frontend"
frameworks:
  - react: ["next.js (pages)", "vite", "create-react-app"]
  - vue: ["nuxt (pages)", "vite", "vue-cli"]
  - svelte: ["sveltekit (pages)", "vite"]
  - angular: ["angular-cli"]
  - solid: ["solid-start", "vite"]

common_patterns:
  - Component-based architecture
  - State management (global/local)
  - Routing (client-side)
  - Styling (CSS-in-JS, Tailwind, CSS Modules)
  - API consumption
  - Form handling
  - Testing (unit, integration, e2e)

typical_complexity:
  simple: "Single component, no state management"
  moderate: "Multi-component feature, local state"
  complex: "Cross-cutting feature, global state, API integration"
  enterprise: "Design system, accessibility, i18n, performance"
```

## Detection Rules

```yaml
detection:
  primary_indicators:
    - file: "package.json"
      contains_any:
        - "react"
        - "vue"
        - "svelte"
        - "@angular/core"
        - "solid-js"
        
  secondary_indicators:
    - directories: ["src/components", "src/pages", "src/views"]
    - files: ["vite.config", "next.config", "nuxt.config", "angular.json"]
    - extensions: [".jsx", ".tsx", ".vue", ".svelte"]
    
  confidence_scoring:
    primary_match: 50
    secondary_match: 30
    extension_match: 20
    threshold: 60
```

## Stage Customizations

### Stage 1: Ideation (Web Frontend)

```yaml
stage_1_customizations:
  1.3_constraints:
    frontend_specific:
      - "Browser compatibility requirements"
      - "Responsive design requirements"
      - "Accessibility requirements (WCAG level)"
      - "Performance budget (LCP, FID, CLS)"
      - "Bundle size constraints"
      
  1.4_scope:
    typical_in_scope:
      - "Component implementation"
      - "Styling and responsive behavior"
      - "State management"
      - "API integration"
      - "Basic unit tests"
      
    typical_out_scope:
      - "Backend API changes"
      - "Database modifications"
      - "DevOps/deployment changes"
      
  1.5_assumptions:
    common_assumptions:
      - "Design mockups are finalized"
      - "API contracts are defined"
      - "Component library/design system exists"
      - "Build tooling is configured"
```

### Stage 2: Research (Web Frontend)

```yaml
stage_2_customizations:
  2.2_codebase_analysis:
    patterns_to_detect:
      - "Component patterns (functional, class, hooks)"
      - "State management solution"
      - "Styling approach"
      - "Testing patterns"
      - "Folder structure conventions"
      
    files_to_analyze:
      - "src/components/**/*.{tsx,jsx,vue,svelte}"
      - "src/hooks/**/*"
      - "src/store/**/*"
      - "src/styles/**/*"
      - "*.config.{js,ts}"
      
  2.3_tech_stack:
    required_research:
      - "Framework version and features"
      - "State management library docs"
      - "Styling library docs"
      - "Testing framework docs"
      
  2.4_external_research:
    context7_queries:
      - library: "/vercel/next.js"
        query: "{feature} implementation patterns"
      - library: "/facebook/react"
        query: "{feature} best practices hooks"
      - library: "/vuejs/vue"
        query: "{feature} composition API"
        
    research_topics:
      - "Component design patterns for {feature}"
      - "State management patterns for {use_case}"
      - "Performance optimization for {component_type}"
      - "Accessibility implementation for {component_type}"
```

### Stage 3: Specification (Web Frontend)

```yaml
stage_3_customizations:
  3.1_requirements:
    frontend_requirement_types:
      - type: "UI/UX"
        examples:
          - "Component renders design mockup accurately"
          - "Component is responsive across breakpoints"
          - "Component meets accessibility requirements"
          
      - type: "Interaction"
        examples:
          - "User can perform {action}"
          - "Component responds to {event}"
          - "State updates on {trigger}"
          
      - type: "Performance"
        examples:
          - "Initial render < {N}ms"
          - "Bundle size increase < {N}KB"
          - "No layout shift (CLS < 0.1)"
          
  3.4_architecture:
    component_spec_template: |
      ### Component: {ComponentName}
      
      **Type:** Presentational | Container | Higher-Order | Hook
      
      **Props:**
      ```typescript
      interface {ComponentName}Props {
        // Required props
        {prop}: {type};
        
        // Optional props
        {prop}?: {type};
        
        // Event handlers
        on{Event}?: ({params}) => void;
      }
      ```
      
      **State:**
      ```typescript
      interface {ComponentName}State {
        {stateKey}: {type};
      }
      ```
      
      **Renders:**
      - {child_element_1}
      - {child_element_2}
      
      **Styling:**
      - Approach: {CSS Modules | Tailwind | styled-components}
      - Responsive: {breakpoints}
      
  3.5_interfaces:
    frontend_interfaces:
      - "Component Props interfaces"
      - "State shape interfaces"
      - "API response types"
      - "Event handler signatures"
      
  3.6_acceptance:
    frontend_criteria:
      - type: "Visual"
        example: "Component matches Figma design within {N}px tolerance"
        verification: "Visual regression test"
        
      - type: "Functional"
        example: "Click handler fires on button click"
        verification: "Unit test with user-event"
        
      - type: "Accessibility"
        example: "Component is keyboard navigable"
        verification: "axe-core audit + manual test"
        
      - type: "Responsive"
        example: "Layout adapts at 768px breakpoint"
        verification: "Viewport-specific tests"
```

### Stage 4: Planning (Web Frontend)

```yaml
stage_4_customizations:
  4.1_task_patterns:
    typical_task_sequence:
      - id: "T{N}-01"
        title: "Create component skeleton"
        description: "Set up component file, props interface, basic structure"
        estimate: "0.5h"
        
      - id: "T{N}-02"
        title: "Implement component logic"
        description: "Add state, event handlers, hooks"
        estimate: "1-2h"
        depends_on: ["T{N}-01"]
        
      - id: "T{N}-03"
        title: "Add styling"
        description: "Implement responsive styles, variants"
        estimate: "1h"
        depends_on: ["T{N}-01"]
        parallelizable_with: ["T{N}-02"]
        
      - id: "T{N}-04"
        title: "Connect to state/API"
        description: "Integrate with store, fetch data"
        estimate: "1h"
        depends_on: ["T{N}-02"]
        
      - id: "T{N}-05"
        title: "Add tests"
        description: "Unit tests, accessibility tests"
        estimate: "1h"
        depends_on: ["T{N}-02", "T{N}-03"]
        
      - id: "T{N}-06"
        title: "Integration and review"
        description: "Integrate into page, self-review"
        estimate: "0.5h"
        depends_on: ["T{N}-04", "T{N}-05"]
        
  4.6_checkpoints:
    frontend_checkpoints:
      - after: "Component skeleton"
        checks:
          - "Component renders without errors"
          - "TypeScript compiles"
          
      - after: "Logic + Styling"
        checks:
          - "Component matches design"
          - "Interactions work"
          - "No console errors"
          
      - after: "Tests"
        checks:
          - "All tests pass"
          - "Coverage meets threshold"
```

### Stage 5: Execution (Web Frontend)

```yaml
stage_5_customizations:
  5.4_task_execution:
    frontend_patterns:
      component_creation:
        steps:
          - "Create file: src/components/{ComponentName}/{ComponentName}.tsx"
          - "Create file: src/components/{ComponentName}/{ComponentName}.test.tsx"
          - "Create file: src/components/{ComponentName}/{ComponentName}.module.css"
          - "Export from src/components/{ComponentName}/index.ts"
          - "Add to barrel export if exists"
          
      state_integration:
        steps:
          - "Import store/context hooks"
          - "Define selectors if needed"
          - "Add actions/mutations"
          - "Connect component"
          
  5.5_task_validation:
    frontend_checks:
      - "npm run typecheck passes"
      - "npm run lint passes"
      - "npm run test -- --grep '{ComponentName}' passes"
      - "No console errors in browser"
      - "Component renders at all breakpoints"
```

### Stage 6: Verification (Web Frontend)

```yaml
stage_6_customizations:
  6.3_acceptance_testing:
    frontend_tests:
      unit_tests:
        framework: "vitest | jest"
        coverage_target: "80%"
        patterns:
          - "Renders without crashing"
          - "Renders correct content"
          - "Handles events correctly"
          - "Updates state correctly"
          
      integration_tests:
        framework: "testing-library"
        patterns:
          - "Component works with context"
          - "Component works with router"
          - "Component fetches and displays data"
          
      e2e_tests:
        framework: "playwright | cypress"
        patterns:
          - "User flow completes successfully"
          - "Responsive behavior works"
          - "No accessibility violations"
          
  6.4_regression:
    frontend_regression:
      - "Run full test suite"
      - "Run visual regression (if configured)"
      - "Check bundle size delta"
      - "Run lighthouse audit"
      
  6.5_integration:
    frontend_integration:
      - "Component works in target page"
      - "State updates propagate correctly"
      - "Routing works with component"
      - "No style conflicts"
```

## Framework-Specific Guidance

### React

```yaml
react_specifics:
  patterns:
    preferred:
      - "Functional components with hooks"
      - "Custom hooks for reusable logic"
      - "Context for shared state"
      - "React Query/SWR for server state"
      
    avoid:
      - "Class components (unless required)"
      - "Direct DOM manipulation"
      - "Prop drilling beyond 2 levels"
      
  research_queries:
    context7:
      - library: "/facebook/react"
        topics:
          - "useState patterns"
          - "useEffect cleanup"
          - "useCallback optimization"
          - "custom hooks patterns"
          
  testing:
    tools: ["vitest", "@testing-library/react", "msw"]
    patterns:
      - "render + screen queries"
      - "userEvent for interactions"
      - "msw for API mocking"
```

### Vue

```yaml
vue_specifics:
  patterns:
    preferred:
      - "Composition API (Vue 3)"
      - "Composables for reusable logic"
      - "Pinia for state management"
      - "Script setup syntax"
      
    avoid:
      - "Options API (unless legacy)"
      - "Vuex (prefer Pinia)"
      - "Mixins"
      
  research_queries:
    context7:
      - library: "/vuejs/vue"
        topics:
          - "composition API patterns"
          - "composables best practices"
          - "reactive refs vs reactive objects"
          
  testing:
    tools: ["vitest", "@vue/test-utils", "msw"]
```

### Svelte

```yaml
svelte_specifics:
  patterns:
    preferred:
      - "Reactive statements ($:)"
      - "Stores for shared state"
      - "Actions for reusable behavior"
      - "Slots for composition"
      
  research_queries:
    context7:
      - library: "/sveltejs/svelte"
        topics:
          - "reactive patterns"
          - "stores patterns"
          - "transitions and animations"
          
  testing:
    tools: ["vitest", "@testing-library/svelte"]
```

## Template Variations

### Component Spec (React)

```markdown
### Component: {ComponentName}

**File:** `src/components/{ComponentName}/{ComponentName}.tsx`

**Type:** Functional Component

**Props Interface:**
\`\`\`typescript
interface {ComponentName}Props {
  // Data props
  data: DataType;
  
  // Behavior props
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  
  // Event props
  onClick?: (event: React.MouseEvent) => void;
  onChange?: (value: string) => void;
  
  // Render props (if applicable)
  renderItem?: (item: Item) => React.ReactNode;
}
\`\`\`

**Internal State:**
\`\`\`typescript
const [isOpen, setIsOpen] = useState(false);
const [inputValue, setInputValue] = useState('');
\`\`\`

**Hooks Used:**
- `useState` - Local UI state
- `useEffect` - Side effects (API calls, subscriptions)
- `useMemo` - Computed values
- `useCallback` - Memoized callbacks

**Styling:**
- Approach: Tailwind CSS / CSS Modules
- Responsive breakpoints: sm, md, lg
- Dark mode: Yes / No

**Accessibility:**
- ARIA role: {role}
- Keyboard navigation: Tab, Enter, Escape
- Screen reader: Announces {what}
```

## Validation Rules (Web Frontend)

```yaml
frontend_validation:
  component_validation:
    rules:
      - name: "has_types"
        check: "Props interface defined"
        severity: block
        
      - name: "has_tests"
        check: "Test file exists"
        severity: warn
        
      - name: "exports_clean"
        check: "Exported from index file"
        severity: warn
        
  code_quality:
    rules:
      - name: "no_any"
        check: "No 'any' type usage"
        severity: warn
        
      - name: "hooks_rules"
        check: "Follows rules of hooks"
        severity: block
        
      - name: "accessibility"
        check: "No axe violations"
        severity: warn
```

---

*Workflow: web-fe v1.0.0*
