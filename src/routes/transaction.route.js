const { Router } = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const transactionController = require("../controllers/transaction.controller")
const validate = require('../middlewares/validate')
const catchAsync = require('../utils/catchAsync')
const transactionValidator = require('../validators/transaction.validator')

const transactionRoutes = Router();

/**
 * - POST /api/transactions/
 * - Create a new transaction
 * - Validate request body before reaching the controller
 */

transactionRoutes.post("/", authMiddleware.authMiddleware, validate(transactionValidator.createTransactionSchema), catchAsync(transactionController.createTransaction))


/**
 * - POST /api/transactions/system/initial-funds
 * - Create initial funds transaction from system user
 */
transactionRoutes.post("/system/initial-funds", authMiddleware.authSystemUserMiddleware, validate(transactionValidator.initialFundsSchema), catchAsync(transactionController.createInitialFundsTransaction))

module.exports = transactionRoutes;