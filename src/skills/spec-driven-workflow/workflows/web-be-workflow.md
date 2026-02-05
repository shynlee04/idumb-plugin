# Web Backend Workflow

Sector-specific workflow for Node.js, Python, Go, and other backend frameworks.

## Sector Profile

```yaml
sector_id: web-be
sector_name: "Web Backend"
frameworks:
  - node: ["express", "fastify", "hono", "koa", "nestjs"]
  - python: ["fastapi", "django", "flask", "litestar"]
  - go: ["gin", "echo", "fiber", "chi"]
  - rust: ["axum", "actix-web", "rocket"]
  - java: ["spring-boot", "quarkus", "micronaut"]

common_patterns:
  - RESTful API design
  - Database integration (SQL/NoSQL)
  - Authentication & authorization
  - Input validation
  - Error handling
  - Logging & observability
  - Caching strategies
  - Rate limiting
  - Testing (unit, integration, e2e)

typical_complexity:
  simple: "Single endpoint, basic CRUD"
  moderate: "Multi-endpoint feature, business logic, DB transactions"
  complex: "Cross-service, auth, caching, messaging"
  enterprise: "Compliance, audit logging, multi-tenant, scale"
```

## Detection Rules

```yaml
detection:
  primary_indicators:
    - file: "package.json"
      contains_any:
        - "express"
        - "fastify"
        - "hono"
        - "koa"
        - "@nestjs/core"
        
    - file: "requirements.txt"
      contains_any:
        - "fastapi"
        - "django"
        - "flask"
        - "litestar"
        
    - file: "go.mod"
      contains_any:
        - "gin-gonic/gin"
        - "labstack/echo"
        - "gofiber/fiber"
        
  secondary_indicators:
    - directories: ["src/routes", "src/controllers", "src/handlers", "src/api"]
    - files: ["server.js", "app.py", "main.go", "docker-compose.yml"]
    - extensions: [".sql", ".prisma", ".graphql"]
    
  confidence_scoring:
    primary_match: 50
    secondary_match: 30
    extension_match: 20
    threshold: 60
```

## Stage Customizations

### Stage 1: Ideation (Web Backend)

```yaml
stage_1_customizations:
  1.3_constraints:
    backend_specific:
      - "Latency requirements (p99 < X ms)"
      - "Throughput requirements (RPS)"
      - "Database compatibility"
      - "Authentication method constraints"
      - "Rate limiting requirements"
      - "Backward compatibility requirements"
      
  1.4_scope:
    typical_in_scope:
      - "API endpoint implementation"
      - "Database schema changes"
      - "Business logic"
      - "Input validation"
      - "Unit and integration tests"
      
    typical_out_scope:
      - "Frontend changes"
      - "Infrastructure provisioning"
      - "Third-party service contracts"
      - "Database migrations (production)"
      
  1.5_assumptions:
    common_assumptions:
      - "Database schema is defined"
      - "Authentication service is available"
      - "API contracts are agreed upon"
      - "Development environment is set up"
```

### Stage 2: Research (Web Backend)

```yaml
stage_2_customizations:
  2.2_codebase_analysis:
    patterns_to_detect:
      - "API routing patterns"
      - "Controller/handler structure"
      - "Middleware chain"
      - "Database access patterns (ORM/raw)"
      - "Error handling patterns"
      - "Logging conventions"
      - "Test patterns"
      
    files_to_analyze:
      - "src/routes/**/*"
      - "src/controllers/**/*"
      - "src/handlers/**/*"
      - "src/middleware/**/*"
      - "src/models/**/*"
      - "src/services/**/*"
      - "*.config.{js,ts,py,yaml}"
      
  2.3_tech_stack:
    required_research:
      - "Framework version and features"
      - "ORM/database driver docs"
      - "Authentication library docs"
      - "Validation library docs"
      - "Testing framework docs"
      
  2.4_external_research:
    context7_queries:
      - library: "/expressjs/express"
        query: "{feature} middleware patterns"
      - library: "/fastify/fastify"
        query: "{feature} plugin patterns"
      - library: "/tiangolo/fastapi"
        query: "{feature} dependency injection"
      - library: "/prisma/prisma"
        query: "{model} relations and queries"
        
    research_topics:
      - "API design patterns for {feature}"
      - "Database transaction patterns for {use_case}"
      - "Authentication patterns for {auth_type}"
      - "Error handling best practices for {framework}"
      - "Performance optimization for {operation_type}"
```

### Stage 3: Specification (Web Backend)

```yaml
stage_3_customizations:
  3.1_requirements:
    backend_requirement_types:
      - type: "Functional"
        examples:
          - "Endpoint accepts {method} requests at {path}"
          - "Response includes {fields} in {format}"
          - "Request validates {constraints}"
          
      - type: "Performance"
        examples:
          - "Response time < {N}ms at p99"
          - "Supports {N} concurrent requests"
          - "Database query < {N}ms"
          
      - type: "Security"
        examples:
          - "Requires {auth_type} authentication"
          - "Validates input against {schema}"
          - "Rate limits to {N} requests per {period}"
          
      - type: "Data"
        examples:
          - "Persists data to {table/collection}"
          - "Transaction ensures {consistency}"
          - "Cascade deletes {related_entities}"
          
  3.4_architecture:
    endpoint_spec_template: |
      ### Endpoint: {METHOD} {path}
      
      **Purpose:** {description}
      
      **Authentication:** {auth_type | none}
      
      **Request:**
      ```typescript
      // Path parameters
      interface PathParams {
        {param}: {type};
      }
      
      // Query parameters
      interface QueryParams {
        {param}?: {type};
      }
      
      // Request body
      interface RequestBody {
        {field}: {type};
      }
      ```
      
      **Response:**
      ```typescript
      // Success response
      interface SuccessResponse {
        status: 200 | 201;
        data: {ResponseType};
      }
      
      // Error responses
      interface ErrorResponse {
        status: 400 | 401 | 403 | 404 | 500;
        error: {
          code: string;
          message: string;
          details?: unknown;
        };
      }
      ```
      
      **Database Operations:**
      - Read: {tables/collections queried}
      - Write: {tables/collections modified}
      - Transaction: {yes/no}
      
      **Middleware:**
      - {middleware_1}
      - {middleware_2}
      
  3.5_interfaces:
    backend_interfaces:
      - "API request/response schemas"
      - "Database model interfaces"
      - "Service layer interfaces"
      - "Event/message schemas"
      
  3.6_acceptance:
    backend_criteria:
      - type: "API Contract"
        example: "Endpoint returns 200 with expected schema"
        verification: "API test with schema validation"
        
      - type: "Database"
        example: "Data persisted correctly"
        verification: "Integration test with DB assertion"
        
      - type: "Security"
        example: "Unauthorized request returns 401"
        verification: "Security test"
        
      - type: "Performance"
        example: "Response under 100ms"
        verification: "Load test"
```

### Stage 4: Planning (Web Backend)

```yaml
stage_4_customizations:
  4.1_task_patterns:
    typical_task_sequence:
      - id: "T{N}-01"
        title: "Define request/response types"
        description: "Create TypeScript/Pydantic interfaces"
        estimate: "0.5h"
        
      - id: "T{N}-02"
        title: "Create database model/migration"
        description: "Add/modify DB schema"
        estimate: "0.5-1h"
        depends_on: ["T{N}-01"]
        
      - id: "T{N}-03"
        title: "Implement service layer"
        description: "Business logic, DB operations"
        estimate: "1-2h"
        depends_on: ["T{N}-02"]
        
      - id: "T{N}-04"
        title: "Implement controller/handler"
        description: "Request handling, validation, response"
        estimate: "1h"
        depends_on: ["T{N}-03"]
        
      - id: "T{N}-05"
        title: "Add middleware (if needed)"
        description: "Auth, validation, rate limiting"
        estimate: "0.5-1h"
        depends_on: ["T{N}-04"]
        parallelizable_with: ["T{N}-04"]
        
      - id: "T{N}-06"
        title: "Write tests"
        description: "Unit + integration tests"
        estimate: "1-2h"
        depends_on: ["T{N}-03", "T{N}-04"]
        
      - id: "T{N}-07"
        title: "API documentation"
        description: "OpenAPI/Swagger docs"
        estimate: "0.5h"
        depends_on: ["T{N}-04"]
        
  4.6_checkpoints:
    backend_checkpoints:
      - after: "Database model"
        checks:
          - "Migration runs successfully"
          - "Model relationships correct"
          
      - after: "Service layer"
        checks:
          - "Business logic works"
          - "DB operations correct"
          
      - after: "Controller"
        checks:
          - "API responds correctly"
          - "Validation works"
          - "Error handling works"
```

### Stage 5: Execution (Web Backend)

```yaml
stage_5_customizations:
  5.4_task_execution:
    backend_patterns:
      endpoint_creation:
        steps:
          - "Create file: src/routes/{resource}.ts"
          - "Create file: src/controllers/{resource}.controller.ts"
          - "Create file: src/services/{resource}.service.ts"
          - "Create file: src/models/{Resource}.ts"
          - "Create file: src/validators/{resource}.validator.ts"
          - "Add route to main router"
          
      database_change:
        steps:
          - "Create migration file"
          - "Update model definition"
          - "Run migration locally"
          - "Update seed data (if needed)"
          
      test_creation:
        steps:
          - "Create unit tests for service"
          - "Create integration tests for endpoint"
          - "Create fixtures/factories"
          
  5.5_task_validation:
    backend_checks:
      - "npm run typecheck / mypy / go vet passes"
      - "npm run lint / ruff / golangci-lint passes"
      - "npm run test -- --grep '{feature}' passes"
      - "API endpoint returns expected response"
      - "Database operations work correctly"
      - "No console errors or warnings"
```

### Stage 6: Verification (Web Backend)

```yaml
stage_6_customizations:
  6.3_acceptance_testing:
    backend_tests:
      unit_tests:
        coverage_target: "80%"
        patterns:
          - "Service methods return expected results"
          - "Validation rejects invalid input"
          - "Error cases handled correctly"
          
      integration_tests:
        patterns:
          - "Endpoint returns correct status codes"
          - "Response matches schema"
          - "Database state changes correctly"
          - "Auth requirements enforced"
          
      e2e_tests:
        patterns:
          - "Full request flow works"
          - "External services mocked correctly"
          - "Error scenarios handled"
          
  6.4_regression:
    backend_regression:
      - "Run full test suite"
      - "Check API contract compatibility"
      - "Verify no breaking changes"
      - "Check performance metrics"
      
  6.5_integration:
    backend_integration:
      - "API works with frontend (if applicable)"
      - "Database migrations work in sequence"
      - "External service calls work"
      - "Message queue integration works (if applicable)"
```

## Framework-Specific Guidance

### Node.js (Express/Fastify)

```yaml
nodejs_specifics:
  patterns:
    preferred:
      - "Async/await for all async operations"
      - "Zod/Joi for validation"
      - "Structured error classes"
      - "Dependency injection (optional)"
      
    avoid:
      - "Callback hell"
      - "Untyped request handlers"
      - "Synchronous file operations"
      - "Console.log for logging (use pino/winston)"
      
  research_queries:
    context7:
      - library: "/expressjs/express"
        topics:
          - "middleware patterns"
          - "error handling"
          - "router organization"
      - library: "/fastify/fastify"
        topics:
          - "plugin patterns"
          - "schema validation"
          - "hooks lifecycle"
          
  testing:
    tools: ["vitest", "supertest", "msw"]
    patterns:
      - "supertest for HTTP testing"
      - "Mock database with test containers"
      - "MSW for external API mocking"
```

### Python (FastAPI/Django)

```yaml
python_specifics:
  patterns:
    preferred:
      - "Pydantic models for validation"
      - "Dependency injection"
      - "Async for I/O operations (FastAPI)"
      - "Type hints everywhere"
      
    avoid:
      - "Raw SQL without parameterization"
      - "Untyped function signatures"
      - "Synchronous in async context"
      
  research_queries:
    context7:
      - library: "/tiangolo/fastapi"
        topics:
          - "dependency injection patterns"
          - "background tasks"
          - "middleware"
      - library: "/sqlalchemy/sqlalchemy"
        topics:
          - "async sessions"
          - "relationship patterns"
          
  testing:
    tools: ["pytest", "pytest-asyncio", "httpx", "factory_boy"]
```

### Go (Gin/Echo)

```yaml
go_specifics:
  patterns:
    preferred:
      - "Standard library patterns"
      - "Interface-based dependencies"
      - "Context for cancellation"
      - "Structured logging (slog)"
      
    avoid:
      - "Global state"
      - "Ignoring errors"
      - "Unstructured logging"
      
  research_queries:
    context7:
      - library: "/gin-gonic/gin"
        topics:
          - "middleware patterns"
          - "validation"
          - "error handling"
          
  testing:
    tools: ["testing", "testify", "httptest"]
```

## Template Variations

### Endpoint Spec (Express/TypeScript)

```markdown
### Endpoint: POST /api/v1/users

**File:** `src/routes/users.ts`

**Controller:** `src/controllers/users.controller.ts`

**Service:** `src/services/users.service.ts`

**Request Schema:**
\`\`\`typescript
const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
  role: z.enum(['user', 'admin']).default('user'),
});

type CreateUserRequest = z.infer<typeof CreateUserSchema>;
\`\`\`

**Response Schema:**
\`\`\`typescript
interface CreateUserResponse {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}
\`\`\`

**Error Responses:**
- `400 Bad Request` - Validation failed
- `409 Conflict` - Email already exists
- `500 Internal Server Error` - Database error

**Middleware:**
- `authenticate` - Verify JWT token
- `authorize('admin')` - Require admin role
- `validate(CreateUserSchema)` - Validate request body

**Database Operations:**
- Check: `SELECT * FROM users WHERE email = ?`
- Insert: `INSERT INTO users (...) VALUES (...)`
- Transaction: No
```

## Validation Rules (Web Backend)

```yaml
backend_validation:
  endpoint_validation:
    rules:
      - name: "has_request_schema"
        check: "Request schema defined (Zod/Pydantic/struct)"
        severity: block
        
      - name: "has_response_schema"
        check: "Response schema defined"
        severity: block
        
      - name: "has_error_responses"
        check: "Error responses documented"
        severity: warn
        
      - name: "has_auth_specified"
        check: "Authentication requirement documented"
        severity: warn
        
  code_quality:
    rules:
      - name: "no_sql_injection"
        check: "Parameterized queries or ORM"
        severity: block
        
      - name: "input_validated"
        check: "All inputs validated"
        severity: block
        
      - name: "errors_handled"
        check: "Errors caught and handled"
        severity: block
        
      - name: "has_tests"
        check: "Test file exists"
        severity: warn
```

---

*Workflow: web-be v1.0.0*
