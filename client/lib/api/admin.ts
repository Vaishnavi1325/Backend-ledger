import { apiRequest } from "./client";
import { User, Account, Transaction } from "@/types/models";

interface GetUsersResponse {
  users: User[];
}

interface FreezeAccountResponse {
  account: Account;
}

interface GetUserTransactionsResponse {
  transactions: Transaction[];
}

export async function getAllUsers(): Promise<User[]> {
  const data = await apiRequest<GetUsersResponse>("/admin/users");
  return data.users;
}

export async function freezeAccount(accountId: string): Promise<Account> {
  const data = await apiRequest<FreezeAccountResponse>(
    `/admin/accounts/${accountId}/freeze`,
    {
      method: "PATCH",
    }
  );
  return data.account;
}

export async function unfreezeAccount(accountId: string): Promise<Account> {
  const data = await apiRequest<FreezeAccountResponse>(
    `/admin/accounts/${accountId}/unfreeze`,
    {
      method: "PATCH",
    }
  );
  return data.account;
}

export async function getUserTransactions(
  userId: string
): Promise<Transaction[]> {
  const data = await apiRequest<GetUserTransactionsResponse>(
    `/admin/users/${userId}/transactions`
  );
  return data.transactions;
}
