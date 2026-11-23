const accountModel = require('../models/account.model')
const AppError = require('../utils/AppError')
const catchAsync = require('../utils/catchAsync')

/**
 * checkOwnership -> ownership verification middleware for account resources.
 *
 * Prevents IDOR: a customer guessing another customer's accountId
 * must NOT be able to read or use that account.
 *
 * Rules:
 * - Admins bypass ownership checks
 * - Everyone else must own the account they are trying to access
 *
 * "paramName" tells the middleware which URL param holds the account id.
 * Must run AFTER authMiddleware, because it reads req.user.
 *
 * Usage: checkOwnership("accountId")
 */
function checkOwnership(paramName = "accountId") {
    return catchAsync(async function (req, res, next) {
        if (!req.user) {
            return next(new AppError("Unauthorized access: User is not logged in.", 401))
        }

        const accountId = req.params[paramName]

        const account = await accountModel.findById(accountId)

        if (!account) {
            return next(new AppError("Account not found", 404))
        }

        // Admins can access every resource
        if (req.user.role === "admin") {
            req.account = account
            return next()
        }

        // Customers can only access their own accounts
        const isOwner = account.user.toString() === req.user._id.toString()

        if (!isOwner) {
            return next(new AppError("Forbidden: you can only access your own accounts", 403))
        }

        // Pass the loaded account forward so controllers do not query it again
        req.account = account
        return next()
    })
}

module.exports = checkOwnership
