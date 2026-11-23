const express = require("express")
const authMiddleware = require('../middlewares/auth.middleware')
const accountController = require('../controllers/account.controller')
const validate = require('../middlewares/validate')
const catchAsync = require('../utils/catchAsync')
const checkOwnership = require('../middlewares/checkOwnership')
const accountValidator = require('../validators/account.validator')
const router = express.Router()

/**
 * - POST /api/account/
 * - Create a new account for the logged-in user
 */
router.post('/', authMiddleware.authMiddleware, validate(accountValidator.createAccountSchema), catchAsync(accountController.userAccountController));

/**
 * - POST /api/account/deposit
 * - Deposit funds into an active account (double-entry credit from reserve)
 */
router.post('/deposit', authMiddleware.authMiddleware, validate(accountValidator.depositSchema), catchAsync(accountController.depositFundsController));

/**
 * - GET /api/account/
 * - Get all accounts of the logged-in user with real-time balances
 */
router.get("/", authMiddleware.authMiddleware, catchAsync(accountController.getUserAccountsController))

/**
 * - GET /api/account/summary
 * - Dashboard analytics: portfolio balance, inflow/outflow, recent transactions
 */
router.get("/summary", authMiddleware.authMiddleware, catchAsync(accountController.getAccountSummaryController))

/**
 * - GET /api/account/lookup/:accountId
 * - Verify recipient account existence and account holder name before transfers
 */
router.get("/lookup/:accountId", authMiddleware.authMiddleware, validate(accountValidator.accountIdParamsSchema, "params"), catchAsync(accountController.lookupAccountController))

/**
 * - GET /api/account/balance/:accountId
 * - Validate accountId, then ensure the user owns this account (admins bypass)
 */
router.get("/balance/:accountId", authMiddleware.authMiddleware, validate(accountValidator.accountIdParamsSchema, "params"), checkOwnership("accountId"), catchAsync(accountController.getAccountBalanceController))

/**
 * - PATCH /api/account/:accountId/close
 * - Close an active account with zero balance
 */
router.patch("/:accountId/close", authMiddleware.authMiddleware, validate(accountValidator.accountIdParamsSchema, "params"), checkOwnership("accountId"), catchAsync(accountController.closeAccountController))

module.exports = router