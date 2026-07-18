const { z } = require('zod')
const { objectIdSchema } = require('./account.validator')

/**
 * Validation schemas for transaction routes.
 */

// Amount rules: must be a positive number with at most 2 decimal places
// (money like 100, 99.5 or 99.99 — but not 99.999 or -50).
const amountSchema = z
    .number("Amount must be a number")
    .positive("Amount must be greater than 0")
    .refine(function (value) {
        // Multiply by 100: if the result is a whole number,
        // the amount has at most 2 decimal places
        return Number.isInteger(value * 100)
    }, "Amount can have a maximum of 2 decimal places")

// POST /api/transactions/
const createTransactionSchema = z.object({
    fromAccount: objectIdSchema,
    toAccount: objectIdSchema,
    amount: amountSchema,
    idempotencyKey: z
        .string("Idempotency key is required")
        .trim()
        .min(1, "Idempotency key cannot be empty")
}).strict()

// POST /api/transactions/system/initial-funds
const initialFundsSchema = z.object({
    toAccount: objectIdSchema,
    amount: amountSchema,
    idempotencyKey: z
        .string("Idempotency key is required")
        .trim()
        .min(1, "Idempotency key cannot be empty")
}).strict()

module.exports = {
    createTransactionSchema,
    initialFundsSchema
}
