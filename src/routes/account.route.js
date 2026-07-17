const express=require("express")
const authMiddleware=require('../middlewares/auth.middleware')
const accountController=require('../controllers/account.controller')
const router=express.Router()
router.post('/',authMiddleware.authMiddleware,accountController.userAccountController);
/**
 * - GET /api/accounts/
 * - Get all accounts of the logged-in user
 * - Protected Route
 */
router.get("/", authMiddleware.authMiddleware, accountController.getUserAccountsController)


/**
 * - GET /api/accounts/balance/:accountId
 */
router.get("/balance/:accountId", authMiddleware.authMiddleware, accountController.getAccountBalanceController)

module.exports=router