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

// GET /api/transactions/ and GET /api/transactions/account/:accountId
// Validates query string parameters for pagination, filtering, and sorting
const transactionQuerySchema = z.object({
    page: z.coerce
        .number()
        .int("Page must be a whole number")
        .min(1, "Page must be at least 1")
        .default(1),

    limit: z.coerce
        .number()
        .int("Limit must be a whole number")
        .min(1, "Limit must be at least 1")
        .max(100, "Limit cannot exceed 100")
        .default(20),

    fromDate: z
        .string()
        .datetime({ message: "fromDate must be a valid ISO date (e.g. 2024-01-15T00:00:00.000Z)" })
        .optional(),

    toDate: z
        .string()
        .datetime({ message: "toDate must be a valid ISO date (e.g. 2024-12-31T23:59:59.999Z)" })
        .optional(),

    minAmount: z.coerce
        .number()
        .positive("minAmount must be greater than 0")
        .optional(),

    maxAmount: z.coerce
        .number()
        .positive("maxAmount must be greater than 0")
        .optional(),

    status: z
        .enum(["PENDING", "COMPLETED", "FAILED", "REVERSED"], {
            message: "status must be one of: PENDING, COMPLETED, FAILED, REVERSED"
        })
        .optional(),

    sortBy: z
        .enum(["createdAt", "amount"], {
            message: "sortBy must be one of: createdAt, amount"
        })
        .default("createdAt"),

    order: z
        .enum(["asc", "desc"], {
            message: "order must be either asc or desc"
        })
        .default("desc")
}).strict().refine(function (data) {
    if (data.fromDate && data.toDate) {
        return new Date(data.fromDate) <= new Date(data.toDate)
    }
    return true
}, { message: "fromDate must be before or equal to toDate", path: ["fromDate"] })
.refine(function (data) {
    if (data.minAmount && data.maxAmount) {
        return data.minAmount <= data.maxAmount
    }
    return true
}, { message: "minAmount must be less than or equal to maxAmount", path: ["minAmount"] })

// GET /api/transactions/account/:accountId (validates req.params)
const accountTransactionParamsSchema = z.object({
    accountId: objectIdSchema
}).strict()

module.exports = {
    createTransactionSchema,
    initialFundsSchema,
    transactionQuerySchema,
    accountTransactionParamsSchema
}
