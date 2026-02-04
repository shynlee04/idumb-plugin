/**
 * iDumb Schema Validator
 * 
 * Runtime JSON Schema validation for state and checkpoint objects.
 * Uses Ajv for fast JSON Schema validation (draft-07 compatible).
 * 
 * IMPORTANT: No console.log - would pollute TUI
 */

import { existsSync, readFileSync } from "fs"
import { join } from "path"

// Simplified schema validation without external dependencies
// Uses JSON Schema draft-07 compatible validation

interface ValidationResult {
    valid: boolean
    errors: ValidationError[]
    warnings: string[]
}

interface ValidationError {
    path: string
    message: string
    schemaPath: string
}

// Load schema from file
function loadSchema(schemaPath: string): Record<string, any> | null {
    try {
        if (!existsSync(schemaPath)) {
            return null
        }
        const content = readFileSync(schemaPath, "utf8")
        return JSON.parse(content)
    } catch {
        return null
    }
}

// Validate a value against a JSON Schema property definition
function validateProperty(
    value: any,
    propDef: any,
    path: string,
    errors: ValidationError[]
): void {
    // Handle type validation
    if (propDef.type) {
        const types = Array.isArray(propDef.type) ? propDef.type : [propDef.type]
        let typeValid = false

        for (const type of types) {
            if (type === "string" && typeof value === "string") typeValid = true
            else if (type === "number" && typeof value === "number") typeValid = true
            else if (type === "integer" && Number.isInteger(value)) typeValid = true
            else if (type === "boolean" && typeof value === "boolean") typeValid = true
            else if (type === "array" && Array.isArray(value)) typeValid = true
            else if (type === "object" && typeof value === "object" && value !== null && !Array.isArray(value)) typeValid = true
            else if (type === "null" && value === null) typeValid = true
        }

        if (!typeValid && value !== undefined) {
            errors.push({
                path,
                message: `Expected type ${types.join(" | ")}, got ${typeof value}`,
                schemaPath: `${path}/type`
            })
        }
    }

    // Handle enum validation
    if (propDef.enum && value !== undefined) {
        if (!propDef.enum.includes(value)) {
            errors.push({
                path,
                message: `Value must be one of: ${propDef.enum.join(", ")}`,
                schemaPath: `${path}/enum`
            })
        }
    }

    // Handle pattern validation for strings
    if (propDef.pattern && typeof value === "string") {
        const regex = new RegExp(propDef.pattern)
        if (!regex.test(value)) {
            errors.push({
                path,
                message: `String does not match pattern: ${propDef.pattern}`,
                schemaPath: `${path}/pattern`
            })
        }
    }

    // Handle minimum for numbers
    if (propDef.minimum !== undefined && typeof value === "number") {
        if (value < propDef.minimum) {
            errors.push({
                path,
                message: `Value ${value} is less than minimum ${propDef.minimum}`,
                schemaPath: `${path}/minimum`
            })
        }
    }

    // Handle maxLength for strings
    if (propDef.maxLength !== undefined && typeof value === "string") {
        if (value.length > propDef.maxLength) {
            errors.push({
                path,
                message: `String length ${value.length} exceeds maximum ${propDef.maxLength}`,
                schemaPath: `${path}/maxLength`
            })
        }
    }

    // Handle maxItems for arrays
    if (propDef.maxItems !== undefined && Array.isArray(value)) {
        if (value.length > propDef.maxItems) {
            errors.push({
                path,
                message: `Array length ${value.length} exceeds maximum ${propDef.maxItems}`,
                schemaPath: `${path}/maxItems`
            })
        }
    }

    // Handle nested object properties
    if (propDef.properties && typeof value === "object" && value !== null) {
        const requiredProps = propDef.required || []

        // Check required properties
        for (const req of requiredProps) {
            if (value[req] === undefined) {
                errors.push({
                    path: `${path}/${req}`,
                    message: `Required property '${req}' is missing`,
                    schemaPath: `${path}/required`
                })
            }
        }

        // Validate each property
        for (const [propName, propValue] of Object.entries(value)) {
            if (propDef.properties[propName]) {
                validateProperty(propValue, propDef.properties[propName], `${path}/${propName}`, errors)
            }
        }
    }

    // Handle array items
    if (propDef.items && Array.isArray(value)) {
        for (let i = 0; i < value.length; i++) {
            validateProperty(value[i], propDef.items, `${path}[${i}]`, errors)
        }
    }
}

/**
 * Validate an object against a JSON Schema
 */
export function validateAgainstSchema(
    data: any,
    schema: Record<string, any>
): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: string[] = []

    if (!schema || typeof schema !== "object") {
        return {
            valid: false,
            errors: [{ path: "/", message: "Invalid schema", schemaPath: "/" }],
            warnings: []
        }
    }

    // Check required top-level properties
    if (schema.required && Array.isArray(schema.required)) {
        for (const req of schema.required) {
            if (data[req] === undefined) {
                errors.push({
                    path: `/${req}`,
                    message: `Required property '${req}' is missing`,
                    schemaPath: "/required"
                })
            }
        }
    }

    // Validate each property
    if (schema.properties) {
        for (const [propName, propValue] of Object.entries(data || {})) {
            if (schema.properties[propName]) {
                validateProperty(propValue, schema.properties[propName], `/${propName}`, errors)
            } else if (schema.additionalProperties === false) {
                warnings.push(`Unexpected property '${propName}' found`)
            }
        }
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings
    }
}

/**
 * Validate state against brain-state-schema.json
 */
export function validateState(
    data: any,
    schemasDir: string
): ValidationResult {
    const schemaPath = join(schemasDir, "brain-state-schema.json")
    const schema = loadSchema(schemaPath)

    if (!schema) {
        return {
            valid: false,
            errors: [{ path: "/", message: `Schema not found: ${schemaPath}`, schemaPath: "/" }],
            warnings: []
        }
    }

    return validateAgainstSchema(data, schema)
}

/**
 * Validate checkpoint against checkpoint-schema.json
 */
export function validateCheckpoint(
    data: any,
    schemasDir: string
): ValidationResult {
    const schemaPath = join(schemasDir, "checkpoint-schema.json")
    const schema = loadSchema(schemaPath)

    if (!schema) {
        return {
            valid: false,
            errors: [{ path: "/", message: `Schema not found: ${schemaPath}`, schemaPath: "/" }],
            warnings: []
        }
    }

    return validateAgainstSchema(data, schema)
}

/**
 * Quick validation check - returns true if valid
 */
export function isValidState(data: any, schemasDir: string): boolean {
    return validateState(data, schemasDir).valid
}

/**
 * Quick validation check - returns true if valid
 */
export function isValidCheckpoint(data: any, schemasDir: string): boolean {
    return validateCheckpoint(data, schemasDir).valid
}

/**
 * Get formatted validation error summary
 */
export function formatValidationErrors(result: ValidationResult): string {
    if (result.valid) {
        return "✅ Validation passed"
    }

    const lines = ["❌ Validation failed:"]
    for (const error of result.errors) {
        lines.push(`  - ${error.path}: ${error.message}`)
    }
    if (result.warnings.length > 0) {
        lines.push("\n⚠️ Warnings:")
        for (const warning of result.warnings) {
            lines.push(`  - ${warning}`)
        }
    }

    return lines.join("\n")
}
