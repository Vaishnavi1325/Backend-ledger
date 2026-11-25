import { apiRequest } from "./client";
function buildQueryString(params) {
    if (!params)
        return "";
    const query = new URLSearchParams();
    if (params.page !== undefined)
        query.set("page", String(params.page));
    if (params.limit !== undefined)
        query.set("limit", String(params.limit));
    if (params.status)
        query.set("status", params.status);
    if (params.minAmount !== undefined && params.minAmount > 0)
        query.set("minAmount", String(params.minAmount));
    if (params.maxAmount !== undefined && params.maxAmount > 0)
        query.set("maxAmount", String(params.maxAmount));
    if (params.fromDate)
        query.set("fromDate", params.fromDate);
    if (params.toDate)
        query.set("toDate", params.toDate);
    if (params.sortBy)
        query.set("sortBy", params.sortBy);
    if (params.order)
        query.set("order", params.order);
    const qs = query.toString();
    return qs ? `?${qs}` : "";
}
export async function createTransfer(payload) {
    return apiRequest("/transactions", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}
export async function getTransactions(params) {
    const qs = buildQueryString(params);
    return apiRequest(`/transactions${qs}`);
}
export async function getAccountTransactions(accountId, params) {
    const qs = buildQueryString(params);
    return apiRequest(`/transactions/account/${accountId}${qs}`);
}
export async function reverseTransaction(transactionId) {
    return apiRequest(`/transactions/${transactionId}/reverse`, {
        method: "POST",
    });
}
