const AppError = require('../utils/AppError')

/**
 * validate -> a generic validation middleware.
 *
 * Validate request data before it reaches the controller.
 * If the data is invalid, the request is rejected with a 400 error
 * and the controller never runs.
 *
 * "source" decides which part of the request to validate:
 * - "body"   -> req.body   (default)
 * - "params" -> req.params (example: accountId in the URL)
 *
 * Usage: router.post("/", validate(registerSchema), controller)
 *        router.get("/:accountId", validate(accountIdSchema, "params"), controller)
 */
function validate(schema, source = "body") {
    return function (req, res, next) {
        const result = schema.safeParse(req[source])

        if (!result.success) {
            // Take the first validation issue and show a clear message
            // like: "email: Invalid email address"
            const firstIssue = result.error.issues[0]
            const fieldName = firstIssue.path.join(".")

            let message = firstIssue.message
            if (fieldName) {
                message = `${fieldName}: ${firstIssue.message}`
            }

            return next(new AppError(message, 400))
        }

        // Replace the request data with the validated data.
        // This removes unknown fields and keeps only what the schema allows.
        req[source] = result.data

        return next()
    }
}

module.exports = validate
