import { apiRequest } from "./client";
import {
  Transaction,
  TransferRequest,
  TransactionFilterParams,
  PaginationMeta,
} from "@/types/models";

interface TransactionsResponse {
  transactions: Transaction[];
  pagination: PaginationMeta;
}

interface CreateTransactionResponse {
  message: string;
  transaction: Transaction;
}

function buildQueryString(params?: TransactionFilterParams): string {
  if (!params) return "";
  const query = new URLSearchParams();

  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.limit !== undefined) query.set("limit", String(params.limit));
  if (params.status) query.set("status", params.status);
  if (params.minAmount !== undefined && params.minAmount > 0)
    query.set("minAmount", String(params.minAmount));
  if (params.maxAmount !== undefined && params.maxAmount > 0)
    query.set("maxAmount", String(params.maxAmount));
  if (params.fromDate) query.set("fromDate", params.fromDate);
  if (params.toDate) query.set("toDate", params.toDate);
  if (params.sortBy) query.set("sortBy", params.sortBy);
  if (params.order) query.set("order", params.order);

  const qs = query.toString();
  return qs ? `?${qs}` : "";
}

export async function createTransfer(
  payload: TransferRequest
): Promise<CreateTransactionResponse> {
  return apiRequest<CreateTransactionResponse>("/transactions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getTransactions(
  params?: TransactionFilterParams
): Promise<TransactionsResponse> {
  const qs = buildQueryString(params);
  return apiRequest<TransactionsResponse>(`/transactions${qs}`);
}

export async function getAccountTransactions(
  accountId: string,
  params?: TransactionFilterParams
): Promise<TransactionsResponse> {
  const qs = buildQueryString(params);
  return apiRequest<TransactionsResponse>(`/transactions/account/${accountId}${qs}`);
}
