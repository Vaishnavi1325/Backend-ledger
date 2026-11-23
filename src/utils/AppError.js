/**
 * AppError -> a custom error class for errors we expect and handle on purpose
 * (example: "Account not found", "Insufficient balance").
 *
 * Why we need it:
 * - A normal Error has no HTTP status code.
 * - The global error handler checks "isOperational" to decide if the
 *   error message is safe to show to the user or not.
 *
 * Usage: throw new AppError("Account not found", 404)
 */
class AppError extends Error {
    constructor(message, statusCode) {
        super(message)

        this.statusCode = statusCode

        // Marks this error as "expected", so the error handler
        // knows it is safe to send this message to the client
        this.isOperational = true

        // Removes this constructor call from the stack trace (cleaner logs)
        Error.captureStackTrace(this, this.constructor)
    }
}

module.exports = AppError
