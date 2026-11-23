const { z } = require('zod')
const mongoose = require('mongoose')

/**
 * Validation schemas for account routes.
 */

// A reusable rule for MongoDB ObjectIds.
// Prevents invalid ids (like "123") from ever reaching the database.
const objectIdSchema = z
    .string("Id must be a string")
    .refine(function (value) {
        return mongoose.Types.ObjectId.isValid(value)
    }, "Invalid id format")

// POST /api/account/ (optional request body for currency selection)
const createAccountSchema = z.object({
    currency: z.enum(["INR", "USD", "EUR", "GBP"]).default("INR").optional()
}).strict()

// POST /api/account/deposit (self-service or simulated deposit into own account)
const depositSchema = z.object({
    accountId: objectIdSchema,
    amount: z
        .number("Amount must be a number")
        .positive("Amount must be greater than 0")
        .refine(function (value) {
            return Number.isInteger(value * 100)
        }, "Amount can have a maximum of 2 decimal places"),
    idempotencyKey: z
        .string("Idempotency key is required")
        .trim()
        .min(1, "Idempotency key cannot be empty")
}).strict()

// GET /api/account/balance/:accountId (validates req.params)
const accountIdParamsSchema = z.object({
    accountId: objectIdSchema
}).strict()

// Admin routes like /api/admin/accounts/:id (validates req.params)
const idParamsSchema = z.object({
    id: objectIdSchema
}).strict()

module.exports = {
    objectIdSchema,
    createAccountSchema,
    depositSchema,
    accountIdParamsSchema,
    idParamsSchema
}
