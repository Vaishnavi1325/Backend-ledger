const AppError = require('../utils/AppError')

/**
 * Global error handler -> convert unexpected errors into a consistent API response.
 *
 * Every error in the app ends up here (via next(error) or catchAsync).
 * Responsibility:
 * - Known errors (AppError)      -> send their message and status code
 * - Mongoose / MongoDB errors    -> convert into safe, user-friendly messages
 * - Unknown errors               -> hide details, send a generic 500 message
 *
 * We never send stack traces or database internals to the client.
 */

// Duplicate key error (example: registering with an email that already exists)
function handleDuplicateKeyError(error) {
    const fieldName = Object.keys(error.keyValue || {})[0] || "field"
    return new AppError(`This ${fieldName} is already in use`, 409)
}

// Mongoose validation error (example: a required field missing at the DB level)
function handleMongooseValidationError(error) {
    const firstError = Object.values(error.errors)[0]
    return new AppError(firstError.message, 400)
}

// Invalid MongoDB ObjectId (example: /balance/123 instead of a real id)
function handleCastError(error) {
    return new AppError(`Invalid value for ${error.path}`, 400)
}

function errorHandler(error, req, res, next) {
    let knownError = null

    if (error instanceof AppError) {
        knownError = error
    } else if (error.code === 11000) {
        knownError = handleDuplicateKeyError(error)
    } else if (error.name === "ValidationError") {
        knownError = handleMongooseValidationError(error)
    } else if (error.name === "CastError") {
        knownError = handleCastError(error)
    } else if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
        knownError = new AppError("Unauthorized access: token is invalid", 401)
    } else if (error.type === "entity.parse.failed") {
        // Malformed JSON in the request body
        knownError = new AppError("Invalid JSON in request body", 400)
    }

    if (knownError) {
        return res.status(knownError.statusCode).json({
            success: false,
            data: null,
            error: knownError.message
        })
    }

    // Unknown / unexpected error:
    // log the full details for developers, but hide them from the client
    console.error("UNEXPECTED ERROR:", error)

    return res.status(500).json({
        success: false,
        data: null,
        error: "Something went wrong, please try again later"
    })
}

module.exports = errorHandler
