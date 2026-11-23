const accountModel = require('../models/account.model')
const AppError = require('../utils/AppError')

/**
 * Account service -> business logic for account administration.
 * Keeping status changes here means every caller (admin routes today,
 * anything else tomorrow) goes through the same rules.
 */

// Freeze an account so it can no longer send or receive money
async function freezeAccount(accountId) {
    const account = await accountModel.findById(accountId)

    if (!account) {
        throw new AppError("Account not found", 404)
    }

    // A closed account is permanently shut, freezing it makes no sense
    if (account.status === "CLOSED") {
        throw new AppError("A closed account cannot be frozen", 400)
    }

    account.status = "FROZEN"
    await account.save()

    return account
}

// Unfreeze a frozen account and make it usable again
async function unfreezeAccount(accountId) {
    const account = await accountModel.findById(accountId)

    if (!account) {
        throw new AppError("Account not found", 404)
    }

    if (account.status !== "FROZEN") {
        throw new AppError("Only a frozen account can be unfrozen", 400)
    }

    account.status = "ACTIVE"
    await account.save()

    return account
}

// Close an account (permanently shuts it, requires zero balance)
async function closeAccount(accountId, userId) {
    const account = await accountModel.findById(accountId)

    if (!account) {
        throw new AppError("Account not found", 404)
    }

    if (account.status === "CLOSED") {
        throw new AppError("Account is already closed", 400)
    }

    const balance = await account.getBalance()
    if (balance > 0) {
        throw new AppError(`Cannot close account with positive balance (${balance}). Please transfer remaining funds before closing.`, 400)
    }

    account.status = "CLOSED"
    await account.save()

    return account
}

module.exports = {
    freezeAccount,
    unfreezeAccount,
    closeAccount
}
