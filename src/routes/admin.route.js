const { Router } = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate')
const catchAsync = require('../utils/catchAsync')
const accountValidator = require('../validators/account.validator')
const adminController = require('../controllers/admin.controller')

const adminRoutes = Router();

// Every admin route: login check first, then role check, then params validation
/**
 * - PATCH /api/admin/accounts/:id/freeze
 * - Freeze an account (admin only)
 */
adminRoutes.patch("/accounts/:id/freeze", authMiddleware.authMiddleware, authorize("admin"), validate(accountValidator.idParamsSchema, "params"), catchAsync(adminController.freezeAccountController))

/**
 * - PATCH /api/admin/accounts/:id/unfreeze
 * - Unfreeze an account (admin only)
 */
adminRoutes.patch("/accounts/:id/unfreeze", authMiddleware.authMiddleware, authorize("admin"), validate(accountValidator.idParamsSchema, "params"), catchAsync(adminController.unfreezeAccountController))

/**
 * - GET /api/admin/users
 * - List all users (admin and support can view users)
 */
adminRoutes.get("/users", authMiddleware.authMiddleware, authorize("admin", "support"), catchAsync(adminController.getAllUsersController))

/**
 * - GET /api/admin/users/:id/transactions
 * - View a user's transactions (admin and support, for investigating issues)
 */
adminRoutes.get("/users/:id/transactions", authMiddleware.authMiddleware, authorize("admin", "support"), validate(accountValidator.idParamsSchema, "params"), catchAsync(adminController.getUserTransactionsController))

module.exports = adminRoutes;
