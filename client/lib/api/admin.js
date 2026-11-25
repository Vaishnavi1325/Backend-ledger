import { apiRequest } from "./client";
export async function getAllUsers() {
    const data = await apiRequest("/admin/users");
    return data.users;
}
export async function freezeAccount(accountId) {
    const data = await apiRequest(`/admin/accounts/${accountId}/freeze`, {
        method: "PATCH",
    });
    return data.account;
}
export async function unfreezeAccount(accountId) {
    const data = await apiRequest(`/admin/accounts/${accountId}/unfreeze`, {
        method: "PATCH",
    });
    return data.account;
}
export async function getUserTransactions(userId) {
    const data = await apiRequest(`/admin/users/${userId}/transactions`);
    return data.transactions;
}
