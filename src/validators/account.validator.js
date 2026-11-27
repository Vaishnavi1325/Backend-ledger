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

// A flexible rule accepting either a 24-character hexadecimal ObjectId or a 10-digit Account Number.
const accountIdentifierSchema = z
    .string("Account identifier must be a string")
    .trim()
    .refine(function (value) {
        const isObjectId = mongoose.Types.ObjectId.isValid(value) && value.length === 24;
        const isAccNum = /^\d{10}$/.test(value);
        return isObjectId || isAccNum;
    }, "Invalid account format (must be 24-character ID or 10-digit Account Number)")

// POST /api/account/ (optional request body for currency selection)
const createAccountSchema = z.object({
    currency: z.enum(["INR", "USD", "EUR", "GBP"]).default("INR").optional()
}).strict()

// POST /api/account/deposit (self-service or simulated deposit into own account)
const depositSchema = z.object({
    accountId: accountIdentifierSchema,
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
    accountId: accountIdentifierSchema
}).strict()

// Admin routes like /api/admin/accounts/:id (validates req.params)
const idParamsSchema = z.object({
    id: accountIdentifierSchema
}).strict()

module.exports = {
    objectIdSchema,
    accountIdentifierSchema,
    createAccountSchema,
    depositSchema,
    accountIdParamsSchema,
    idParamsSchema
}
