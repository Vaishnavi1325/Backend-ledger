export interface User {
  _id: string;
  name: string;
  email: string;
  role: "customer" | "admin" | "support";
  createdAt: string;
  updatedAt: string;
}

export interface Account {
  _id: string;
  user: string;
  status: "ACTIVE" | "FROZEN" | "CLOSED";
  currency: string;
  balance: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Transaction {
  _id: string;
  fromAccount: string | { _id: string; user?: string };
  toAccount: string | { _id: string; user?: string };
  amount: number;
  status: "PENDING" | "COMPLETED" | "FAILED" | "REVERSED";
  idempotencyKey: string;
  createdAt: string;
  updatedAt: string;
}

export interface AccountSummary {
  totalBalance: number;
  accountCount: number;
  activeAccounts: number;
  totalDebits: number;
  totalCredits: number;
  accounts: Account[];
  recentTransactions: Transaction[];
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
}

export interface TransactionFilterParams {
  page?: number;
  limit?: number;
  status?: "PENDING" | "COMPLETED" | "FAILED" | "REVERSED";
  minAmount?: number;
  maxAmount?: number;
  fromDate?: string;
  toDate?: string;
  sortBy?: "createdAt" | "amount";
  order?: "asc" | "desc";
}

export interface TransferRequest {
  fromAccount: string;
  toAccount: string;
  amount: number;
  idempotencyKey: string;
}

export interface RecipientLookup {
  accountId: string;
  holderName: string;
  currency: string;
  status: "ACTIVE" | "FROZEN" | "CLOSED";
  isOwnAccount: boolean;
  canReceiveTransfers: boolean;
}

