const userModel = require('../models/user.model')
const accountService = require('../services/account.service')
const transactionService = require('../services/transaction.service')

/**
 * Admin controllers -> actions available only to bank staff.
 * Role checks happen in the route (authorize middleware),
 * business rules happen in the services.
 */

// PATCH /api/admin/accounts/:id/freeze
async function freezeAccountController(req, res) {
    const account = await accountService.freezeAccount(req.params.id)

    res.status(200).json({
        success: true,
        data: { account },
        error: null
    })
}

// PATCH /api/admin/accounts/:id/unfreeze
async function unfreezeAccountController(req, res) {
    const account = await accountService.unfreezeAccount(req.params.id)

    res.status(200).json({
        success: true,
        data: { account },
        error: null
    })
}

// GET /api/admin/users
async function getAllUsersController(req, res) {
    const users = await userModel.find()

    res.status(200).json({
        success: true,
        data: { users },
        error: null
    })
}

// GET /api/admin/users/:id/transactions
async function getUserTransactionsController(req, res) {
    const transactions = await transactionService.getTransactionsForUser(req.params.id)

    res.status(200).json({
        success: true,
        data: { transactions },
        error: null
    })
}

module.exports = {
    freezeAccountController,
    unfreezeAccountController,
    getAllUsersController,
    getUserTransactionsController
}
