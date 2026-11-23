const AppError = require('../utils/AppError')

/**
 * authorize -> role-based route protection middleware.
 *
 * Allow only users with required roles to access this route.
 * Must run AFTER authMiddleware, because it reads req.user.
 *
 * Usage: authorize("admin")
 *        authorize("admin", "support")
 */
function authorize(...allowedRoles) {
    return function (req, res, next) {
        // Safety check: authMiddleware must have run before this
        if (!req.user) {
            return next(new AppError("Unauthorized access: User is not logged in.", 401))
        }

        if (!allowedRoles.includes(req.user.role)) {
            return next(new AppError("Forbidden: you do not have permission to perform this action", 403))
        }

        return next()
    }
}

module.exports = authorize
