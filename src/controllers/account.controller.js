const accountModel=require('../models/account.model')

/**
 * - Create Account Controller
 * - POST /api/account/
 */
async function userAccountController(req,res) {
    const user=req.user;

    const account=await accountModel.create({
        user:user._id
    })

    res.status(201).json({
        success:true,
        data:{
            account
        },
        error:null
    })
}

/**
 * - Get User Accounts Controller
 * - GET /api/account/
 */
async function getUserAccountsController(req, res) {

    const accounts = await accountModel.find({ user: req.user._id });

    res.status(200).json({
        success: true,
        data: {
            accounts
        },
        error: null
    })
}

/**
 * - Get Account Balance Controller
 * - GET /api/account/balance/:accountId
 */
async function getAccountBalanceController(req, res) {
    // checkOwnership middleware already loaded and verified this account
    const account = req.account;

    const balance = await account.getBalance();

    res.status(200).json({
        success: true,
        data: {
            accountId: account._id,
            balance: balance
        },
        error: null
    })
}

module.exports={userAccountController,getUserAccountsController,getAccountBalanceController}
