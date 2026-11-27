const accountModel = require('../models/account.model')
const ledgerModel = require('../models/ledger.model')
const transactionModel = require('../models/transaction.model')
const userModel = require('../models/user.model')
const accountService = require('../services/account.service')
const AppError = require('../utils/AppError')
const mongoose = require('mongoose')

/**
 * - Create Account Controller
 * - POST /api/account/
 */
async function userAccountController(req, res) {
    const user = req.user;
    const currency = req.body?.currency || "INR";
    const accountNumber = await accountModel.generateUniqueAccountNumber();

    const account = await accountModel.create({
        user: user._id,
        accountNumber,
        currency
    });

    res.status(201).json({
        success: true,
        data: {
            account: {
                _id: account._id,
                accountNumber: account.accountNumber,
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
                accountNumber: account.accountNumber,
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
                accountNumber: account.accountNumber,
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

/**
 * - Deposit Funds Controller
 * - POST /api/account/deposit
 * Deposits funds into an active account using double-entry accounting (from Bank Reserve account).
 */
async function depositFundsController(req, res) {
    const { accountId, amount, idempotencyKey } = req.body;

    if (!accountId || typeof accountId !== "string" || !accountId.trim()) {
        throw new AppError("A valid target accountId or accountNumber is required", 400);
    }
    const sanitizedId = accountId.trim();

    let targetAccount;
    if (mongoose.Types.ObjectId.isValid(sanitizedId) && sanitizedId.length === 24) {
        targetAccount = await accountModel.findById(sanitizedId);
    } else {
        targetAccount = await accountModel.findOne({ accountNumber: sanitizedId });
    }

    if (!targetAccount) {
        throw new AppError("Target account not found", 404);
    }

    if (req.user.role !== "admin" && targetAccount.user.toString() !== req.user._id.toString()) {
        throw new AppError("Forbidden: you can only deposit funds into your own accounts", 403);
    }

    if (targetAccount.status !== "ACTIVE") {
        throw new AppError(`Account is ${targetAccount.status}. Deposits only allowed for ACTIVE accounts`, 400);
    }

    // Check idempotency
    const existingTx = await transactionModel.findOne({ idempotencyKey });
    if (existingTx) {
        return res.status(200).json({
            success: true,
            data: {
                message: "Deposit transaction already processed",
                transaction: existingTx
            },
            error: null
        });
    }

    // Find or create central reserve system user and account
    let systemUser = await userModel.findOne({ systemUser: true });
    if (!systemUser) {
        systemUser = await userModel.create({
            name: "Central Bank Reserve",
            email: "reserve@bank.internal",
            password: "systemreservepass123",
            role: "admin",
            systemUser: true
        });
    }

    let reserveAccount = await accountModel.findOne({ user: systemUser._id });
    if (!reserveAccount) {
        reserveAccount = await accountModel.create({
            user: systemUser._id,
            currency: targetAccount.currency || "INR"
        });
    }

    const isReplicaSet = Boolean(
        mongoose.connection.client?.topology?.description?.type === "ReplicaSetWithPrimary" ||
        mongoose.connection.client?.topology?.description?.type === "Sharded"
    );

    let transaction;
    if (isReplicaSet) {
        const session = await mongoose.startSession();
        try {
            session.startTransaction();

            transaction = (await transactionModel.create([ {
                fromAccount: reserveAccount._id,
                toAccount: targetAccount._id,
                amount,
                idempotencyKey,
                status: "PENDING"
            } ], { session }))[ 0 ];

            await ledgerModel.create([ {
                account: reserveAccount._id,
                amount,
                transaction: transaction._id,
                type: "DEBIT"
            } ], { session });

            await ledgerModel.create([ {
                account: targetAccount._id,
                amount,
                transaction: transaction._id,
                type: "CREDIT"
            } ], { session });

            await transactionModel.findOneAndUpdate(
                { _id: transaction._id },
                { status: "COMPLETED" },
                { session }
            );

            await session.commitTransaction();
        } catch (error) {
            await session.abortTransaction();
            throw new AppError("Deposit could not be completed, please retry", 500);
        } finally {
            session.endSession();
        }
    } else {
        try {
            transaction = await transactionModel.create({
                fromAccount: reserveAccount._id,
                toAccount: targetAccount._id,
                amount,
                idempotencyKey,
                status: "PENDING"
            });

            await ledgerModel.create({
                account: reserveAccount._id,
                amount,
                transaction: transaction._id,
                type: "DEBIT"
            });

            await ledgerModel.create({
                account: targetAccount._id,
                amount,
                transaction: transaction._id,
                type: "CREDIT"
            });

            transaction.status = "COMPLETED";
            await transaction.save();
        } catch (error) {
            if (transaction?._id) {
                await transactionModel.findByIdAndUpdate(transaction._id, { status: "FAILED" });
            }
            throw new AppError("Deposit could not be completed, please retry", 500);
        }
    }

    const newBalance = await targetAccount.getBalance();

    res.status(201).json({
        success: true,
        data: {
            message: `Successfully deposited ${amount} into account`,
            transaction,
            newBalance
        },
        error: null
    });
}

/**
 * - Lookup Account Controller
 * - GET /api/account/lookup/:accountId
 * Validates and retrieves the verified account holder details for fund transfers
 */
async function lookupAccountController(req, res) {
    const { accountId } = req.params;

    let account;
    if (mongoose.Types.ObjectId.isValid(accountId) && accountId.length === 24) {
        account = await accountModel.findById(accountId).populate('user', 'name email');
    } else {
        account = await accountModel.findOne({ accountNumber: accountId }).populate('user', 'name email');
    }

    if (!account) {
        throw new AppError("Recipient account not found. Please check the Account Number or ID.", 404);
    }

    const isOwnAccount = account.user ? account.user._id.toString() === req.user._id.toString() : false;

    res.status(200).json({
        success: true,
        data: {
            recipient: {
                accountId: account._id,
                accountNumber: account.accountNumber,
                holderName: account.user ? account.user.name : "System Reserve",
                currency: account.currency,
                status: account.status,
                isOwnAccount,
                canReceiveTransfers: account.status === "ACTIVE"
            }
        },
        error: null
    });
}

module.exports = {
    userAccountController,
    getUserAccountsController,
    getAccountBalanceController,
    getAccountSummaryController,
    closeAccountController,
    depositFundsController,
    lookupAccountController
}
