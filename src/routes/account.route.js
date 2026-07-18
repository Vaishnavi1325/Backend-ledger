const express=require("express")
const authMiddleware=require('../middlewares/auth.middleware')
const accountController=require('../controllers/account.controller')
const validate=require('../middlewares/validate')
const catchAsync=require('../utils/catchAsync')
const checkOwnership=require('../middlewares/checkOwnership')
const accountValidator=require('../validators/account.validator')
const router=express.Router()
router.post('/',authMiddleware.authMiddleware,catchAsync(accountController.userAccountController));
/**
 * - GET /api/accounts/
 * - Get all accounts of the logged-in user
 * - Protected Route
 */
router.get("/", authMiddleware.authMiddleware, catchAsync(accountController.getUserAccountsController))


/**
 * - GET /api/accounts/balance/:accountId
 * - Validate accountId, then ensure the user owns this account (admins bypass)
 */
router.get("/balance/:accountId", authMiddleware.authMiddleware, validate(accountValidator.accountIdParamsSchema, "params"), checkOwnership("accountId"), catchAsync(accountController.getAccountBalanceController))

module.exports=router