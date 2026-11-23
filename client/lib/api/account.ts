import { apiRequest } from "./client";
import { Account, AccountSummary, RecipientLookup } from "@/types/models";

interface GetAccountsResponse {
  accounts: Account[];
}

interface CreateAccountResponse {
  account: Account;
}

interface GetBalanceResponse {
  accountId: string;
  balance: number;
}

interface GetSummaryResponse {
  summary: AccountSummary;
}

interface CloseAccountResponse {
  message: string;
  account: Account;
}

interface DepositResponse {
  message: string;
  transaction: any;
  newBalance: number;
}

interface LookupRecipientResponse {
  recipient: RecipientLookup;
}

export async function getUserAccounts(): Promise<Account[]> {
  const data = await apiRequest<GetAccountsResponse>("/account");
  return data.accounts;
}

export async function lookupRecipientAccount(accountId: string): Promise<RecipientLookup> {
  const data = await apiRequest<LookupRecipientResponse>(`/account/lookup/${accountId}`);
  return data.recipient;
}

export async function getAccountSummary(): Promise<AccountSummary> {
  const data = await apiRequest<GetSummaryResponse>("/account/summary");
  return data.summary;
}

export async function getAccountBalance(accountId: string): Promise<number> {
  const data = await apiRequest<GetBalanceResponse>(`/account/balance/${accountId}`);
  return data.balance;
}

export async function createAccount(currency: string = "INR"): Promise<Account> {
  const data = await apiRequest<CreateAccountResponse>("/account", {
    method: "POST",
    body: JSON.stringify({ currency }),
  });
  return data.account;
}

export async function closeAccount(accountId: string): Promise<Account> {
  const data = await apiRequest<CloseAccountResponse>(`/account/${accountId}/close`, {
    method: "PATCH",
  });
  return data.account;
}

export async function depositFunds(
  accountId: string,
  amount: number,
  idempotencyKey: string
): Promise<DepositResponse> {
  const data = await apiRequest<DepositResponse>("/account/deposit", {
    method: "POST",
    body: JSON.stringify({ accountId, amount, idempotencyKey }),
  });
  return data;
}
