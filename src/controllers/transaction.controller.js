const transactionModel = require("../models/transaction.model")
const ledgerModel = require("../models/ledger.model")
const accountModel = require("../models/account.model")
const emailService = require("../services/email.service")
const transactionService = require("../services/transaction.service")
const AppError = require("../utils/AppError")
const mongoose = require("mongoose")

/**
 * - Create a new transaction
 * THE 10-STEP TRANSFER FLOW:
     * 1. Validate request
     * 2. Validate idempotency key
     * 3. Check account status
     * 4. Derive sender balance from ledger
     * 5. Create transaction (PENDING)
     * 6. Create DEBIT ledger entry
     * 7. Create CREDIT ledger entry
     * 8. Mark transaction COMPLETED
     * 9. Commit MongoDB session
     * 10. Send email notification
 */

async function createTransaction(req, res) {

    /**
     * 1. Validate request
     * (types, ObjectIds and amount format were already checked by the Zod schema)
     */
    const { fromAccount, toAccount, amount, idempotencyKey } = req.body

    const fromUserAccount = await accountModel.findOne({
        _id: fromAccount,
    })

    const toUserAccount = await accountModel.findOne({
        _id: toAccount,
    })

    if (!fromUserAccount || !toUserAccount) {
        throw new AppError("Invalid fromAccount or toAccount", 400)
    }

    // Prevent IDOR: customers can only send money from their own accounts.
    // Admins bypass this so they can act on any account when needed.
    if (req.user.role !== "admin") {
        const isSenderAccountOwner = fromUserAccount.user.toString() === req.user._id.toString()

        if (!isSenderAccountOwner) {
            throw new AppError("Forbidden: you can only transfer money from your own accounts", 403)
        }
    }

    /**
     * 2. Validate idempotency key
     * If the same key was already processed, return the previous result
     * instead of moving the money twice.
     */

    const existingTransaction = await transactionModel.findOne({
        idempotencyKey: idempotencyKey
    })

    if (existingTransaction) {
        if (existingTransaction.status === "COMPLETED") {
            return res.status(200).json({
                success: true,
                data: {
                    message: "Transaction already processed",
                    transaction: existingTransaction
                },
                error: null
            })
        }

        if (existingTransaction.status === "PENDING") {
            return res.status(200).json({
                success: true,
                data: {
                    message: "Transaction is still processing"
                },
                error: null
            })
        }

        // FAILED or REVERSED: the money never moved, the client should retry
        throw new AppError("Transaction was not successful, please retry with a new idempotency key", 409)
    }

    /**
     * 3. Check account status
     * Frozen/closed accounts are blocked inside the service layer,
     * so this rule holds for every caller, not just this controller.
     */

    transactionService.assertAccountCanTransact(fromUserAccount, "fromAccount")
    transactionService.assertAccountCanTransact(toUserAccount, "toAccount")

    /**
     * 4. Derive sender balance from ledger
     */
    const balance = await fromUserAccount.getBalance()

    if (balance < amount) {
        throw new AppError(`Insufficient balance. Current balance is ${balance}. Requested amount is ${amount}`, 400)
    }

    /**
     * 5-9. Move the money atomically:
     * transaction record + DEBIT entry + CREDIT entry either all succeed
     * or all roll back together.
     */
    const session = await mongoose.startSession()

    let transaction;
    try {
        session.startTransaction()

        transaction = (await transactionModel.create([ {
            fromAccount,
            toAccount,
            amount,
            idempotencyKey,
            status: "PENDING"
        } ], { session }))[ 0 ]

        await ledgerModel.create([ {
            account: fromAccount,
            amount: amount,
            transaction: transaction._id,
            type: "DEBIT"
        } ], { session })

        await ledgerModel.create([ {
            account: toAccount,
            amount: amount,
            transaction: transaction._id,
            type: "CREDIT"
        } ], { session })

        await transactionModel.findOneAndUpdate(
            { _id: transaction._id },
            { status: "COMPLETED" },
            { session }
        )

        await session.commitTransaction()
    } catch (error) {
        // Roll back everything so no half-finished transfer is ever saved
        await session.abortTransaction()
        throw new AppError("Transaction could not be completed, please retry after some time", 500)
    } finally {
        session.endSession()
    }

    res.status(201).json({
        success: true,
        data: {
            message: "Transaction completed successfully",
            transaction: transaction
        },
        error: null
    })

    /**
     * 10. Send email notification
     * Sent after the response, so a slow email server never delays the API
     */
    await emailService.sendTransactionEmail(req.user.email, req.user.name, amount, toAccount)

}

/**
 * - Create initial funds transaction from system user
 * - POST /api/transactions/system/initial-funds
 */
async function createInitialFundsTransaction(req, res) {
    const { toAccount, amount, idempotencyKey } = req.body

    const toUserAccount = await accountModel.findOne({
        _id: toAccount,
    })

    if (!toUserAccount) {
        throw new AppError("Invalid toAccount", 400)
    }

    const fromUserAccount = await accountModel.findOne({
        user: req.user._id
    })

    if (!fromUserAccount) {
        throw new AppError("System user account not found", 404)
    }

    // Frozen/closed accounts cannot receive initial funds either
    transactionService.assertAccountCanTransact(toUserAccount, "toAccount")

    const session = await mongoose.startSession()

    const transaction = new transactionModel({
        fromAccount: fromUserAccount._id,
        toAccount,
        amount,
        idempotencyKey,
        status: "PENDING"
    })

    try {
        session.startTransaction()

        await ledgerModel.create([ {
            account: fromUserAccount._id,
            amount: amount,
            transaction: transaction._id,
            type: "DEBIT"
        } ], { session })

        await ledgerModel.create([ {
            account: toAccount,
            amount: amount,
            transaction: transaction._id,
            type: "CREDIT"
        } ], { session })

        transaction.status = "COMPLETED"
        await transaction.save({ session })

        await session.commitTransaction()
    } catch (error) {
        // Roll back everything so no half-finished transfer is ever saved
        await session.abortTransaction()
        throw new AppError("Transaction could not be completed, please retry after some time", 500)
    } finally {
        session.endSession()
    }

    return res.status(201).json({
        success: true,
        data: {
            message: "Initial funds transaction completed successfully",
 
 
            transaction: transaction
        },
        error: null
    })
}

// Build the MongoDB filter object from validated query params.
// Keeps the controller clean by isolating this logic.
function buildTransactionFilter(query) {
    const filter = {}

    if (query.status) {
        filter.status = query.status
    }

    if (query.minAmount || query.maxAmount) {
        filter.amount = {}
        if (query.minAmount) {
            filter.amount.$gte = query.minAmount
        }
        if (query.maxAmount) {
            filter.amount.$lte = query.maxAmount
        }
    }

    if (query.fromDate || query.toDate) {
        filter.createdAt = {}
        if (query.fromDate) {
            filter.createdAt.$gte = new Date(query.fromDate)
        }
        if (query.toDate) {
            filter.createdAt.$lte = new Date(query.toDate)
        }
    }

    return filter
}

/**
 * GET /api/transactions/
 * List transactions with pagination, filtering, and sorting.
 * Customers see only their own transactions. Admins see all.
 */
async function getTransactions(req, res) {
    const { page, limit, sortBy, order, ...filterParams } = req.query

    const filter = buildTransactionFilter(filterParams)

    // Customers can only see transactions involving their own accounts
    if (req.user.role !== "admin") {
        const userAccounts = await accountModel.find({ user: req.user._id })

        const accountIds = userAccounts.map(function (account) {
            return account._id
        })

        filter.$or = [
            { fromAccount: { $in: accountIds } },
            { toAccount: { $in: accountIds } }
        ]
    }

    const result = await transactionService.getTransactions(filter, sortBy, order, page, limit)

    res.status(200).json({
        success: true,
        data: {
            transactions: result.transactions,
            pagination: result.pagination
        },
        error: null
    })
}

/**
 * GET /api/transactions/account/:accountId
 * List transactions for a specific account with pagination, filtering, and sorting.
 * checkOwnership middleware already verified the user owns this account.
 */
async function getAccountTransactions(req, res) {
    const { page, limit, sortBy, order, ...filterParams } = req.query

    const filter = buildTransactionFilter(filterParams)

    // Show transactions where this account is sender or receiver
    const accountId = req.params.accountId
    filter.$or = [
        { fromAccount: accountId },
        { toAccount: accountId }
    ]

    const result = await transactionService.getTransactions(filter, sortBy, order, page, limit)

    res.status(200).json({
        success: true,
        data: {
            transactions: result.transactions,
            pagination: result.pagination
        },
        error: null
    })
}

module.exports = {
    createTransaction,
    createInitialFundsTransaction,
    getTransactions,
    getAccountTransactions
}
