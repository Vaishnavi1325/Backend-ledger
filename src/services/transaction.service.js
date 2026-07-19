const accountModel = require('../models/account.model')
const transactionModel = require('../models/transaction.model')
const AppError = require('../utils/AppError')
const { buildPaginationMeta } = require('../utils/pagination')

/**
 * Transaction service -> transfer rules that must hold no matter
 * who calls them (customer routes, admin tools, future features).
 */

// Block transfers for frozen or closed accounts.
// This lives in the service layer so no route or controller can skip it.
function assertAccountCanTransact(account, label) {
    if (account.status !== "ACTIVE") {
        throw new AppError(`${label} is ${account.status}. Transactions are only allowed for ACTIVE accounts`, 400)
    }
}

// Get every transaction where the user is the sender or the receiver.
// Used by support/admin to investigate a customer's activity.
async function getTransactionsForUser(userId) {
    const userAccounts = await accountModel.find({ user: userId })

    const accountIds = userAccounts.map(function (account) {
        return account._id
    })

    const transactions = await transactionModel.find({
        $or: [
            { fromAccount: { $in: accountIds } },
            { toAccount: { $in: accountIds } }
        ]
    }).sort({ createdAt: -1 })

    return transactions
}

// Fetch transactions with filtering, sorting, and pagination.
// The filter object is pre-built by the controller based on user role.
async function getTransactions(filter, sortBy, order, page, limit) {
    const totalRecords = await transactionModel.countDocuments(filter)

    const pagination = buildPaginationMeta(page, limit, totalRecords)

    const sortOrder = order === "asc" ? 1 : -1
    const sortOption = { [sortBy]: sortOrder }

    const transactions = await transactionModel
        .find(filter)
        .sort(sortOption)
        .skip(pagination.skip)
        .limit(pagination.limit)

    return {
        transactions,
        pagination: {
            page: pagination.page,
            limit: pagination.limit,
            totalRecords: pagination.totalRecords,
            totalPages: pagination.totalPages
        }
    }
}

module.exports = {
    assertAccountCanTransact,
    getTransactionsForUser,
    getTransactions
}

