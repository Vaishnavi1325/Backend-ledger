const { Router } = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorize');
const transactionController = require("../controllers/transaction.controller")
const validate = require('../middlewares/validate')
const catchAsync = require('../utils/catchAsync')
const transactionValidator = require('../validators/transaction.validator')
const accountValidator = require('../validators/account.validator')
const checkOwnership = require('../middlewares/checkOwnership')
const { transactionLimiter } = require('../middlewares/rateLimiter')

const transactionRoutes = Router();

/**
 * - POST /api/transactions/
 * - Create a new transaction
 * - Protected by transactionLimiter, authMiddleware, and schema validation
 */
transactionRoutes.post("/", authMiddleware.authMiddleware, transactionLimiter, validate(transactionValidator.createTransactionSchema), catchAsync(transactionController.createTransaction))


/**
 * - POST /api/transactions/system/initial-funds
 * - Create initial funds transaction from system user
 */
transactionRoutes.post("/system/initial-funds", authMiddleware.authSystemUserMiddleware, validate(transactionValidator.initialFundsSchema), catchAsync(transactionController.createInitialFundsTransaction))

/**
 * - POST /api/transactions/:id/reverse
 * - Double-entry transaction reversal (Admin and Support staff only)
 */
transactionRoutes.post("/:id/reverse", authMiddleware.authMiddleware, authorize("admin", "support"), validate(accountValidator.idParamsSchema, "params"), catchAsync(transactionController.reverseTransaction))

/**
 * - GET /api/transactions/
 * - List transactions with pagination, filtering, and sorting
 * - Customers see only their own transactions, admins see all
 */
transactionRoutes.get("/", authMiddleware.authMiddleware, validate(transactionValidator.transactionQuerySchema, "query"), catchAsync(transactionController.getTransactions))

/**
 * - GET /api/transactions/account/:accountId
 * - List transactions for a specific account
 * - Ownership check ensures customers can only access their own accounts
 */
transactionRoutes.get("/account/:accountId", authMiddleware.authMiddleware, validate(transactionValidator.accountTransactionParamsSchema, "params"), validate(transactionValidator.transactionQuerySchema, "query"), checkOwnership("accountId"), catchAsync(transactionController.getAccountTransactions))

module.exports = transactionRoutes;