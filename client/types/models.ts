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
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  _id: string;
  fromAccount: string;
  toAccount: string;
  amount: number;
  status: "PENDING" | "COMPLETED" | "FAILED" | "REVERSED";
  idempotencyKey: string;
  createdAt: string;
  updatedAt: string;
}
