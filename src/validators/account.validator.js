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
    accountIdParamsSchema,
    idParamsSchema
}
