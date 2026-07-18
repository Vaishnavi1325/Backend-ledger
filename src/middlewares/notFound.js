const AppError = require('../utils/AppError')

/**
 * 404 middleware -> runs when no route matched the request.
 *
 * This must be registered AFTER all routes in app.js.
 * It forwards a 404 error to the global error handler,
 * so unknown URLs get the same response format as every other error.
 */
function notFound(req, res, next) {
    next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404))
}

module.exports = notFound
