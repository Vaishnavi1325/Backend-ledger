const { z } = require('zod')

/**
 * Validation schemas for authentication routes.
 * .strict() rejects any unknown fields in the request body.
 */

// POST /api/auth/register
const registerSchema = z.object({
    name: z
        .string("Name is required")
        .trim()
        .min(1, "Name cannot be empty"),
    email: z
        .email("A valid email is required")
        .trim()
        .toLowerCase(),
    password: z
        .string("Password is required")
        .min(6, "Password must be at least 6 characters")
}).strict()

// POST /api/auth/login
const loginSchema = z.object({
    email: z
        .email("A valid email is required")
        .trim()
        .toLowerCase(),
    password: z
        .string("Password is required")
        .min(1, "Password cannot be empty")
}).strict()

module.exports = {
    registerSchema,
    loginSchema
}
