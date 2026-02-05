# API / Microservices Workflow

Sector-specific workflow for REST, GraphQL, gRPC, and microservices architectures.

## Sector Profile

```yaml
sector_id: api
sector_name: "API / Microservices"
types:
  - rest: ["OpenAPI 3.x", "JSON:API", "HAL"]
  - graphql: ["Apollo Server", "GraphQL Yoga", "Pothos"]
  - grpc: ["Protocol Buffers", "Connect"]
  - trpc: ["tRPC v10+"]
  - event_driven: ["Kafka", "RabbitMQ", "EventBridge"]

common_patterns:
  - API versioning
  - Schema design (request/response contracts)
  - Authentication (OAuth2, API keys, JWT)
  - Rate limiting and throttling
  - Pagination strategies
  - Error handling standards
  - Caching (HTTP, CDN, application)
  - Documentation (OpenAPI, GraphQL introspection)
  - Observability (logging, tracing, metrics)

typical_complexity:
  simple: "Single endpoint, CRUD operations"
  moderate: "Multi-endpoint, business logic, external calls"
  complex: "Multi-service, saga patterns, event-driven"
  enterprise: "API gateway, federation, multi-region"
```

## Detection Rules

```yaml
detection:
  primary_indicators:
    - file: "openapi.yaml"
      exists: true
      
    - file: "openapi.json"
      exists: true
      
    - file: "schema.graphql"
      exists: true
      
    - file_pattern: "*.proto"
      exists: true
      
    - file: "package.json"
      contains_any:
        - "@apollo/server"
        - "graphql-yoga"
        - "@trpc/server"
        - "grpc"
        - "@connectrpc"
        
  secondary_indicators:
    - directories: ["src/resolvers", "src/handlers", "src/protos"]
    - files: ["swagger.yaml", "graphql.config.ts", "buf.yaml"]
    - patterns: ["@Query", "@Mutation", "@Resolver", "z.object"]
    
  confidence_scoring:
    primary_match: 60
    secondary_match: 25
    pattern_match: 15
    threshold: 60
```

## Stage Customizations

### Stage 1: Ideation (API)

```yaml
stage_1_customizations:
  1.3_constraints:
    api_specific:
      - "API style (REST/GraphQL/gRPC/tRPC)"
      - "Versioning strategy (path/header/none)"
      - "Authentication requirements"
      - "Rate limiting requirements"
      - "Backward compatibility requirements"
      - "SLA requirements (latency, uptime)"
      - "Contract-first vs code-first"
      
  1.4_scope:
    typical_in_scope:
      - "API schema/contract definition"
      - "Resolver/handler implementation"
      - "Input validation"
      - "Error handling"
      - "Authorization logic"
      - "API documentation"
      
    typical_out_scope:
      - "Client SDK generation"
      - "API gateway configuration"
      - "Infrastructure (unless serverless)"
      - "Database schema (often)"
      
  1.5_assumptions:
    common_assumptions:
      - "API framework is configured"
      - "Authentication service exists"
      - "Database access is set up"
      - "API documentation tooling exists"
```

### Stage 2: Research (API)

```yaml
stage_2_customizations:
  2.2_codebase_analysis:
    patterns_to_detect:
      - "API style and conventions"
      - "Schema definition approach"
      - "Error handling patterns"
      - "Pagination patterns"
      - "Authentication patterns"
      - "Versioning approach"
      - "Testing patterns"
      
    files_to_analyze:
      - "openapi.yaml"
      - "schema.graphql"
      - "*.proto"
      - "src/resolvers/**/*"
      - "src/handlers/**/*"
      - "src/routes/**/*"
      - "src/types/**/*"
      
  2.3_tech_stack:
    required_research:
      - "API framework docs"
      - "Schema definition docs"
      - "Validation library docs"
      - "Authentication library docs"
      - "Testing framework docs"
      
  2.4_external_research:
    context7_queries:
      - library: "/graphql/graphql-js"
        query: "{feature} resolver patterns"
      - library: "/apollographql/apollo-server"
        query: "{feature} plugins"
      - library: "/trpc/trpc"
        query: "{feature} procedures"
      - library: "/OAI/OpenAPI-Specification"
        query: "{feature} schema design"
        
    research_topics:
      - "API design patterns for {use_case}"
      - "Pagination strategies for {data_type}"
      - "Error handling standards for {api_style}"
      - "Caching strategies for {read_pattern}"
      - "Rate limiting approaches for {api_type}"
```

### Stage 3: Specification (API)

```yaml
stage_3_customizations:
  3.1_requirements:
    api_requirement_types:
      - type: "Contract"
        examples:
          - "Endpoint {method} {path} accepts {input}"
          - "Response returns {fields} in {format}"
          - "Mutation {name} updates {entity}"
          
      - type: "Validation"
        examples:
          - "Input {field} must be {constraint}"
          - "Request rejects when {condition}"
          - "Response includes validation errors for {cases}"
          
      - type: "Authorization"
        examples:
          - "Endpoint requires {auth_type}"
          - "User can only access own {resource}"
          - "Admin-only for {operations}"
          
      - type: "Performance"
        examples:
          - "Response time < {N}ms at p99"
          - "Query depth limited to {N}"
          - "Rate limit: {N} requests per {period}"
          
  3.4_architecture:
    rest_spec_template: |
      ### Endpoint: {METHOD} {path}
      
      **Version:** v1
      **Auth:** {auth_type}
      **Rate Limit:** {requests} per {period}
      
      **OpenAPI Schema:**
      ```yaml
      paths:
        {path}:
          {method}:
            operationId: {operationId}
            summary: {summary}
            tags: [{tag}]
            parameters:
              - name: {param}
                in: path | query | header
                required: true
                schema:
                  type: {type}
            requestBody:
              required: true
              content:
                application/json:
                  schema:
                    $ref: '#/components/schemas/{Schema}'
            responses:
              '200':
                description: Success
                content:
                  application/json:
                    schema:
                      $ref: '#/components/schemas/{ResponseSchema}'
              '400':
                $ref: '#/components/responses/BadRequest'
              '401':
                $ref: '#/components/responses/Unauthorized'
              '404':
                $ref: '#/components/responses/NotFound'
      ```
      
    graphql_spec_template: |
      ### Operation: {Query|Mutation|Subscription} {name}
      
      **Auth:** {auth_type}
      **Complexity:** {cost}
      
      **Schema:**
      ```graphql
      type Query {
        {name}({args}): {ReturnType}
      }
      
      # Or mutation
      type Mutation {
        {name}(input: {InputType}!): {ResultType}
      }
      
      input {InputType} {
        {field}: {Type}!
      }
      
      type {ResultType} {
        success: Boolean!
        {field}: {Type}
        errors: [Error!]
      }
      ```
      
      **Resolver Logic:**
      1. Validate input
      2. Check authorization
      3. Execute business logic
      4. Return result
      
    grpc_spec_template: |
      ### RPC: {ServiceName}.{MethodName}
      
      **Type:** Unary | Server Stream | Client Stream | Bidirectional
      **Auth:** {auth_type}
      
      **Proto:**
      ```protobuf
      service {ServiceName} {
        rpc {MethodName}({RequestType}) returns ({ResponseType}) {}
      }
      
      message {RequestType} {
        {type} {field} = 1;
      }
      
      message {ResponseType} {
        {type} {field} = 1;
      }
      ```
      
  3.5_interfaces:
    api_interfaces:
      - "Request/response schemas"
      - "Error response schemas"
      - "Pagination schemas"
      - "Common type definitions"
      
  3.6_acceptance:
    api_criteria:
      - type: "Contract"
        example: "Response matches schema"
        verification: "Schema validation test"
        
      - type: "Error Handling"
        example: "Invalid input returns 400 with details"
        verification: "Error case tests"
        
      - type: "Auth"
        example: "Unauthenticated returns 401"
        verification: "Auth tests"
        
      - type: "Performance"
        example: "p99 < 100ms"
        verification: "Load test"
```

### Stage 4: Planning (API)

```yaml
stage_4_customizations:
  4.1_task_patterns:
    rest_task_sequence:
      - id: "T{N}-01"
        title: "Update OpenAPI schema"
        description: "Add endpoint to spec"
        estimate: "0.5h"
        
      - id: "T{N}-02"
        title: "Generate types from schema"
        description: "Run codegen for types"
        estimate: "0.25h"
        depends_on: ["T{N}-01"]
        
      - id: "T{N}-03"
        title: "Implement handler"
        description: "Route handler with validation"
        estimate: "1-2h"
        depends_on: ["T{N}-02"]
        
      - id: "T{N}-04"
        title: "Add authorization"
        description: "Auth middleware/guards"
        estimate: "0.5h"
        depends_on: ["T{N}-03"]
        
      - id: "T{N}-05"
        title: "Write tests"
        description: "Unit + integration tests"
        estimate: "1h"
        depends_on: ["T{N}-03", "T{N}-04"]
        
    graphql_task_sequence:
      - id: "T{N}-01"
        title: "Update GraphQL schema"
        description: "Add types, queries, mutations"
        estimate: "0.5h"
        
      - id: "T{N}-02"
        title: "Generate types"
        description: "Run GraphQL codegen"
        estimate: "0.25h"
        depends_on: ["T{N}-01"]
        
      - id: "T{N}-03"
        title: "Implement resolver"
        description: "Query/mutation resolver"
        estimate: "1-2h"
        depends_on: ["T{N}-02"]
        
      - id: "T{N}-04"
        title: "Add field-level auth"
        description: "Auth directives/plugins"
        estimate: "0.5h"
        depends_on: ["T{N}-03"]
        
      - id: "T{N}-05"
        title: "Write tests"
        description: "Resolver tests"
        estimate: "1h"
        depends_on: ["T{N}-03", "T{N}-04"]
        
  4.6_checkpoints:
    api_checkpoints:
      - after: "Schema update"
        checks:
          - "Schema is valid"
          - "Types generate correctly"
          
      - after: "Handler/resolver"
        checks:
          - "Endpoint responds"
          - "Happy path works"
          
      - after: "Full feature"
        checks:
          - "All tests pass"
          - "Auth enforced"
          - "Error cases handled"
```

### Stage 5: Execution (API)

```yaml
stage_5_customizations:
  5.4_task_execution:
    api_patterns:
      rest_endpoint:
        steps:
          - "Update openapi.yaml with new endpoint"
          - "Run: npm run generate:types"
          - "Create: src/handlers/{resource}.handler.ts"
          - "Create: src/validators/{resource}.validator.ts"
          - "Add route to router"
          - "Create: src/handlers/{resource}.test.ts"
          
      graphql_operation:
        steps:
          - "Update schema.graphql"
          - "Run: npm run generate:types"
          - "Create: src/resolvers/{operation}.resolver.ts"
          - "Register resolver in server"
          - "Create: src/resolvers/{operation}.test.ts"
          
      grpc_rpc:
        steps:
          - "Update .proto file"
          - "Run: buf generate"
          - "Create: src/services/{service}.service.ts"
          - "Register in server"
          - "Create tests"
          
  5.5_task_validation:
    api_checks:
      - "Schema is valid (lint/validate)"
      - "Types generate without errors"
      - "Endpoint/resolver responds correctly"
      - "Validation rejects invalid input"
      - "Auth is enforced"
      - "Tests pass"
```

### Stage 6: Verification (API)

```yaml
stage_6_customizations:
  6.3_acceptance_testing:
    api_tests:
      contract_tests:
        patterns:
          - "Request validates against schema"
          - "Response matches schema"
          - "Error responses are standard"
          
      integration_tests:
        patterns:
          - "Full request/response cycle"
          - "Database operations correct"
          - "External service calls (mocked)"
          
      auth_tests:
        patterns:
          - "Unauthenticated rejected"
          - "Unauthorized rejected"
          - "Authorized succeeds"
          
      load_tests:
        patterns:
          - "Latency under threshold"
          - "Throughput meets requirements"
          - "No errors under load"
          
  6.4_regression:
    api_regression:
      - "Full test suite passes"
      - "No breaking schema changes"
      - "Backward compatibility verified"
      - "Performance benchmarks pass"
      
  6.5_integration:
    api_integration:
      - "Clients can call new endpoint"
      - "API gateway routes correctly"
      - "Rate limiting works"
      - "Logging and tracing correct"
```

## API Style-Specific Guidance

### REST

```yaml
rest_specifics:
  patterns:
    preferred:
      - "OpenAPI 3.x specification"
      - "Resource-oriented URLs"
      - "Standard HTTP methods (GET, POST, PUT, PATCH, DELETE)"
      - "Standard status codes"
      - "JSON request/response bodies"
      - "Consistent error format"
      
    avoid:
      - "Verbs in URLs (use nouns)"
      - "Nested resources > 2 levels"
      - "Inconsistent naming (camelCase vs snake_case)"
      - "200 OK for errors"
      
  research_queries:
    context7:
      - library: "/OAI/OpenAPI-Specification"
        topics:
          - "schema patterns"
          - "pagination"
          - "error responses"
          
  error_format: |
    {
      "error": {
        "code": "VALIDATION_ERROR",
        "message": "Human-readable message",
        "details": [
          {
            "field": "email",
            "message": "Invalid email format"
          }
        ]
      }
    }
```

### GraphQL

```yaml
graphql_specifics:
  patterns:
    preferred:
      - "SDL-first or code-first (consistent)"
      - "Relay-style pagination"
      - "Input types for mutations"
      - "Union types for errors"
      - "Dataloader for N+1"
      
    avoid:
      - "Deeply nested queries without limits"
      - "Mutations returning void"
      - "Generic error strings"
      
  research_queries:
    context7:
      - library: "/graphql/graphql-js"
        topics:
          - "resolver patterns"
          - "error handling"
          - "subscriptions"
      - library: "/apollographql/apollo-server"
        topics:
          - "plugins"
          - "caching"
          - "federation"
          
  pagination: |
    type Query {
      users(first: Int, after: String): UserConnection!
    }
    
    type UserConnection {
      edges: [UserEdge!]!
      pageInfo: PageInfo!
      totalCount: Int!
    }
    
    type UserEdge {
      node: User!
      cursor: String!
    }
    
  error_handling: |
    type CreateUserResult {
      user: User
      errors: [CreateUserError!]!
    }
    
    union CreateUserError = 
      | EmailTakenError 
      | ValidationError
```

### gRPC

```yaml
grpc_specifics:
  patterns:
    preferred:
      - "Proto3 syntax"
      - "Buf for linting/breaking change detection"
      - "Well-defined error codes"
      - "Streaming for large data"
      
    avoid:
      - "Proto2 (unless legacy)"
      - "Giant messages"
      - "Breaking field changes"
      
  research_queries:
    context7:
      - library: "/grpc/grpc"
        topics:
          - "error handling"
          - "streaming"
          - "interceptors"
          
  error_handling: |
    import "google/rpc/status.proto";
    import "google/rpc/error_details.proto";
    
    // Use standard gRPC status codes
    // Add details via google.rpc.ErrorInfo
```

### tRPC

```yaml
trpc_specifics:
  patterns:
    preferred:
      - "Zod for input validation"
      - "Procedure chaining"
      - "Context for auth"
      - "Output validation"
      
    avoid:
      - "Skipping input validation"
      - "Untyped context"
      
  research_queries:
    context7:
      - library: "/trpc/trpc"
        topics:
          - "procedure patterns"
          - "middleware"
          - "context"
          - "error handling"
          
  procedure_example: |
    export const userRouter = router({
      create: protectedProcedure
        .input(z.object({
          email: z.string().email(),
          name: z.string().min(2),
        }))
        .mutation(async ({ input, ctx }) => {
          return ctx.db.user.create({ data: input });
        }),
    });
```

## Template Variations

### REST Endpoint Spec

```markdown
### Endpoint: POST /api/v1/organizations/{orgId}/members

**Auth:** Bearer JWT (organization admin)
**Rate Limit:** 100/minute

**OpenAPI:**
\`\`\`yaml
paths:
  /api/v1/organizations/{orgId}/members:
    post:
      operationId: addOrganizationMember
      tags: [Organizations]
      security:
        - bearerAuth: []
      parameters:
        - name: orgId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/AddMemberRequest'
      responses:
        '201':
          description: Member added
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Member'
        '400':
          $ref: '#/components/responses/ValidationError'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '403':
          $ref: '#/components/responses/Forbidden'
        '404':
          $ref: '#/components/responses/NotFound'
        '409':
          description: Member already exists
\`\`\`

**Business Logic:**
1. Validate user has admin role in organization
2. Check member doesn't already exist
3. Create member record
4. Send invitation email (async)
5. Return member with pending status
```

## Validation Rules (API)

```yaml
api_validation:
  schema_validation:
    rules:
      - name: "schema_valid"
        check: "OpenAPI/GraphQL/Proto schema is valid"
        severity: block
        
      - name: "breaking_changes"
        check: "No breaking changes without version bump"
        severity: block
        
      - name: "documented"
        check: "All endpoints/operations have descriptions"
        severity: warn
        
  security_validation:
    rules:
      - name: "auth_defined"
        check: "Authentication specified for each endpoint"
        severity: block
        
      - name: "rate_limiting"
        check: "Rate limits defined"
        severity: warn
        
  code_quality:
    rules:
      - name: "input_validated"
        check: "All inputs validated against schema"
        severity: block
        
      - name: "errors_standardized"
        check: "Error responses follow standard format"
        severity: warn
        
      - name: "has_tests"
        check: "Contract/integration tests exist"
        severity: warn
```

---

*Workflow: api v1.0.0*
