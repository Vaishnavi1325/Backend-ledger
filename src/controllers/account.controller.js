const accountModel = require('../models/account.model')
const ledgerModel = require('../models/ledger.model')
const transactionModel = require('../models/transaction.model')
const accountService = require('../services/account.service')

/**
 * - Create Account Controller
 * - POST /api/account/
 */
async function userAccountController(req, res) {
    const user = req.user;
    const currency = req.body?.currency || "INR";

    const account = await accountModel.create({
        user: user._id,
        currency
    });

    res.status(201).json({
        success: true,
        data: {
            account: {
                _id: account._id,
                user: account.user,
                status: account.status,
                currency: account.currency,
                balance: 0,
                createdAt: account.createdAt,
                updatedAt: account.updatedAt
            }
        },
        error: null
    });
}

/**
 * - Get User Accounts Controller
 * - GET /api/account/
 * Returns all user accounts with their real-time derived balances
 */
async function getUserAccountsController(req, res) {
    const accounts = await accountModel.find({ user: req.user._id }).sort({ createdAt: -1 });

    const accountsWithBalance = await Promise.all(
        accounts.map(async (account) => {
            const balance = await account.getBalance();
            return {
                _id: account._id,
                user: account.user,
                status: account.status,
                currency: account.currency,
                balance,
                createdAt: account.createdAt,
                updatedAt: account.updatedAt
            };
        })
    );

    res.status(200).json({
        success: true,
        data: {
            accounts: accountsWithBalance
        },
        error: null
    });
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
    });
}

/**
 * - Get Account Summary & Analytics Dashboard Controller
 * - GET /api/account/summary
 * Provides total portfolio balance, account count, total debits/credits,
 * accounts breakdown with balances, and recent transactions.
 */
async function getAccountSummaryController(req, res) {
    const accounts = await accountModel.find({ user: req.user._id }).sort({ createdAt: -1 });
    const accountIds = accounts.map((acc) => acc._id);

    // Compute balance for each account in parallel
    const accountsWithBalance = await Promise.all(
        accounts.map(async (account) => {
            const balance = await account.getBalance();
            return {
                _id: account._id,
                status: account.status,
                currency: account.currency,
                balance,
                createdAt: account.createdAt
            };
        })
    );

    // Total net balance across all active accounts
    const totalBalance = accountsWithBalance.reduce((sum, acc) => {
        return acc.status === "ACTIVE" ? sum + acc.balance : sum;
    }, 0);

    // Aggregate total debits and credits across user's accounts
    let totalDebits = 0;
    let totalCredits = 0;

    if (accountIds.length > 0) {
        const ledgerAgg = await ledgerModel.aggregate([
            { $match: { account: { $in: accountIds } } },
            {
                $group: {
                    _id: "$type",
                    totalAmount: { $sum: "$amount" },
                    count: { $sum: 1 }
                }
            }
        ]);

        for (const item of ledgerAgg) {
            if (item._id === "DEBIT") totalDebits = item.totalAmount;
            if (item._id === "CREDIT") totalCredits = item.totalAmount;
        }
    }

    // Get 5 most recent transactions involving user accounts
    let recentTransactions = [];
    if (accountIds.length > 0) {
        recentTransactions = await transactionModel
            .find({
                $or: [
                    { fromAccount: { $in: accountIds } },
                    { toAccount: { $in: accountIds } }
                ]
            })
            .sort({ createdAt: -1 })
            .limit(5);
    }

    res.status(200).json({
        success: true,
        data: {
            summary: {
                totalBalance,
                accountCount: accounts.length,
                activeAccounts: accounts.filter((a) => a.status === "ACTIVE").length,
                totalDebits,
                totalCredits,
                accounts: accountsWithBalance,
                recentTransactions
            }
        },
        error: null
    });
}

/**
 * - Close Account Controller
 * - PATCH /api/account/:accountId/close
 */
async function closeAccountController(req, res) {
    const account = await accountService.closeAccount(req.params.accountId, req.user._id);

    res.status(200).json({
        success: true,
        data: {
            message: "Account closed successfully",
            account
        },
        error: null
    });
}

module.exports = {
    userAccountController,
    getUserAccountsController,
    getAccountBalanceController,
    getAccountSummaryController,
    closeAccountController
}
