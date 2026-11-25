import { apiRequest } from "./client";
export async function getUserAccounts() {
    const data = await apiRequest("/account");
    return data.accounts;
}
export async function lookupRecipientAccount(accountId) {
    const data = await apiRequest(`/account/lookup/${accountId}`);
    return data.recipient;
}
export async function getAccountSummary() {
    const data = await apiRequest("/account/summary");
    return data.summary;
}
export async function getAccountBalance(accountId) {
    const data = await apiRequest(`/account/balance/${accountId}`);
    return data.balance;
}
export async function createAccount(currency = "INR") {
    const data = await apiRequest("/account", {
        method: "POST",
        body: JSON.stringify({ currency }),
    });
    return data.account;
}
export async function closeAccount(accountId) {
    const data = await apiRequest(`/account/${accountId}/close`, {
        method: "PATCH",
    });
    return data.account;
}
export async function depositFunds(accountId, amount, idempotencyKey) {
    const data = await apiRequest("/account/deposit", {
        method: "POST",
        body: JSON.stringify({ accountId, amount, idempotencyKey }),
    });
    return data;
}
