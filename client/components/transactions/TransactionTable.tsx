"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getTransactions } from "@/lib/api/transaction";
import { Account, Transaction, TransactionFilterParams } from "@/types/models";
import { useToast } from "@/context/ToastContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  History,
  Download,
  Receipt,
  Copy,
  Check,
  Printer,
  ShieldCheck,
  Eye,
} from "lucide-react";

interface TransactionTableProps {
  userAccounts: Account[];
}

export function TransactionTable({ userAccounts }: TransactionTableProps) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [status, setStatus] = useState<TransactionFilterParams["status"] | "">("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sortBy, setSortBy] = useState<"createdAt" | "amount">("createdAt");
  const [order, setOrder] = useState<"desc" | "asc">("desc");

  // Receipt Modal State
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const toast = useToast();

  // Set of user's account IDs for determining debit vs credit perspective
  const userAccountIds = new Set(userAccounts.map((a) => a._id));

  const filterParams: TransactionFilterParams = {
    page,
    limit,
    status: status ? (status as any) : undefined,
    minAmount: minAmount ? parseFloat(minAmount) : undefined,
    maxAmount: maxAmount ? parseFloat(maxAmount) : undefined,
    fromDate: fromDate ? new Date(fromDate).toISOString() : undefined,
    toDate: toDate ? new Date(toDate + "T23:59:59.999Z").toISOString() : undefined,
    sortBy,
    order,
  };

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["transactions", filterParams],
    queryFn: () => getTransactions(filterParams),
  });

  const transactions = data?.transactions ?? [];
  const pagination = data?.pagination;

  function resetFilters() {
    setStatus("");
    setMinAmount("");
    setMaxAmount("");
    setFromDate("");
    setToDate("");
    setSortBy("createdAt");
    setOrder("desc");
    setPage(1);
  }

  function getAccountId(acc: string | { _id: string }): string {
    return typeof acc === "string" ? acc : acc._id;
  }

  function handleCopy(text: string, label: string) {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    toast.info(`${label} copied to clipboard!`, "Copied");
    setTimeout(() => setCopiedKey(null), 2000);
  }

  function handleExportCSV() {
    if (transactions.length === 0) {
      toast.warning("No transactions available to export.", "Empty Export");
      return;
    }

    const headers = [
      "Transaction ID",
      "Timestamp",
      "Direction",
      "Amount",
      "Currency",
      "From Account ID",
      "To Account ID",
      "Status",
      "Idempotency Key",
    ];

    const rows = transactions.map((tx) => {
      const fromId = getAccountId(tx.fromAccount);
      const toId = getAccountId(tx.toAccount);
      const isDebit = userAccountIds.has(fromId);
      const isCredit = userAccountIds.has(toId);
      const direction =
        isDebit && !isCredit ? "DEBIT" : isCredit && !isDebit ? "CREDIT" : "INTERNAL";

      return [
        `"${tx._id}"`,
        `"${new Date(tx.createdAt).toISOString()}"`,
        `"${direction}"`,
        tx.amount,
        `"INR"`,
        `"${fromId}"`,
        `"${toId}"`,
        `"${tx.status}"`,
        `"${tx.idempotencyKey}"`,
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `bank_statement_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Transaction statement exported as CSV.", "Export Completed");
  }

  return (
    <Card className="shadow-xs">
      <CardHeader className="border-b pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <History className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">
                Transaction History
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Audit trail of double-entry ledger transfers (click any row for full receipt)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={transactions.length === 0}
              className="text-xs gap-1.5"
              title="Download statement in CSV format"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="text-xs gap-1"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset</span>
            </Button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-3">
          {/* Status */}
          <div>
            <label className="text-[11px] font-medium text-muted-foreground">Status</label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as any);
                setPage(1);
              }}
              className="mt-1 w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">All Statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
              <option value="REVERSED">Reversed</option>
            </select>
          </div>

          {/* Min Amount */}
          <div>
            <label className="text-[11px] font-medium text-muted-foreground">Min Amount</label>
            <Input
              type="number"
              placeholder="Min ₹"
              value={minAmount}
              onChange={(e) => {
                setMinAmount(e.target.value);
                setPage(1);
              }}
              className="mt-1 h-8 text-xs"
            />
          </div>

          {/* Max Amount */}
          <div>
            <label className="text-[11px] font-medium text-muted-foreground">Max Amount</label>
            <Input
              type="number"
              placeholder="Max ₹"
              value={maxAmount}
              onChange={(e) => {
                setMaxAmount(e.target.value);
                setPage(1);
              }}
              className="mt-1 h-8 text-xs"
            />
          </div>

          {/* From Date */}
          <div>
            <label className="text-[11px] font-medium text-muted-foreground">From Date</label>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPage(1);
              }}
              className="mt-1 h-8 text-xs"
            />
          </div>

          {/* To Date */}
          <div>
            <label className="text-[11px] font-medium text-muted-foreground">To Date</label>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPage(1);
              }}
              className="mt-1 h-8 text-xs"
            />
          </div>

          {/* Sort By */}
          <div>
            <label className="text-[11px] font-medium text-muted-foreground">Sort</label>
            <select
              value={`${sortBy}-${order}`}
              onChange={(e) => {
                const [sort, ord] = e.target.value.split("-") as [
                  "createdAt" | "amount",
                  "desc" | "asc"
                ];
                setSortBy(sort);
                setOrder(ord);
              }}
              className="mt-1 w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="createdAt-desc">Date (Newest)</option>
              <option value="createdAt-asc">Date (Oldest)</option>
              <option value="amount-desc">Amount (High to Low)</option>
              <option value="amount-asc">Amount (Low to High)</option>
            </select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : isError ? (
          <div className="p-8 text-center text-sm text-destructive">
            Failed to load transactions. Please try again.
            <div className="mt-2">
              <Button size="sm" variant="outline" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            No transactions found matching your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">Date</TableHead>
                  <TableHead className="w-[120px]">Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>From Account</TableHead>
                  <TableHead>To Account</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                  <TableHead className="w-[60px] text-center">Receipt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => {
                  const fromId = getAccountId(tx.fromAccount);
                  const toId = getAccountId(tx.toAccount);
                  const isDebit = userAccountIds.has(fromId);
                  const isCredit = userAccountIds.has(toId);

                  return (
                    <TableRow
                      key={tx._id}
                      onClick={() => setSelectedTx(tx)}
                      className="text-xs cursor-pointer hover:bg-muted/60 transition-colors group"
                      title="Click to view detailed ledger receipt"
                    >
                      <TableCell className="font-medium whitespace-nowrap text-muted-foreground">
                        {formatDate(tx.createdAt)}
                      </TableCell>

                      <TableCell>
                        {isDebit && !isCredit && (
                          <span className="inline-flex items-center gap-1 text-rose-600 font-medium">
                            <ArrowUpRight className="h-3.5 w-3.5" />
                            Debit (Sent)
                          </span>
                        )}
                        {isCredit && !isDebit && (
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                            <ArrowDownLeft className="h-3.5 w-3.5" />
                            Credit (Rcvd)
                          </span>
                        )}
                        {isDebit && isCredit && (
                          <span className="inline-flex items-center gap-1 text-blue-600 font-medium">
                            Internal Transfer
                          </span>
                        )}
                        {!isDebit && !isCredit && (
                          <span className="text-muted-foreground">Transfer</span>
                        )}
                      </TableCell>

                      <TableCell className="font-bold text-sm">
                        <span
                          className={
                            isDebit && !isCredit
                              ? "text-rose-600 dark:text-rose-400"
                              : "text-emerald-600 dark:text-emerald-400"
                          }
                        >
                          {isDebit && !isCredit ? "-" : "+"}
                          {formatCurrency(tx.amount)}
                        </span>
                      </TableCell>

                      <TableCell className="font-mono text-[11px] text-muted-foreground">
                        ...{fromId.slice(-8)}
                      </TableCell>

                      <TableCell className="font-mono text-[11px] text-muted-foreground">
                        ...{toId.slice(-8)}
                      </TableCell>

                      <TableCell className="text-right">
                        {tx.status === "COMPLETED" && (
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                            Completed
                          </Badge>
                        )}
                        {tx.status === "PENDING" && (
                          <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                            Pending
                          </Badge>
                        )}
                        {tx.status === "FAILED" && (
                          <Badge variant="destructive">Failed</Badge>
                        )}
                        {tx.status === "REVERSED" && (
                          <Badge variant="outline" className="text-purple-600 border-purple-300">
                            Reversed
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 opacity-60 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTx(tx);
                          }}
                          title="View Receipt"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination Bar */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3 text-xs text-muted-foreground">
            <div>
              Showing page{" "}
              <span className="font-medium text-foreground">{pagination.page}</span>{" "}
              of{" "}
              <span className="font-medium text-foreground">
                {pagination.totalPages}
              </span>{" "}
              ({pagination.totalRecords} total records)
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPage((p) => Math.min(pagination.totalPages, p + 1))
                }
                disabled={page >= pagination.totalPages}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      {/* Transaction Receipt Details Modal */}
      {selectedTx && (
        <Dialog open={!!selectedTx} onOpenChange={(open) => !open && setSelectedTx(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Receipt className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-base font-semibold">
                    Transaction Receipt &amp; Audit Log
                  </DialogTitle>
                  <DialogDescription className="text-xs">
                    Double-entry core banking cryptographic ledger proof
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="my-2 space-y-4">
              {/* Highlight Amount Banner */}
              <div className="rounded-xl border bg-muted/40 p-4 text-center space-y-1">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  Transfer Amount
                </p>
                <div className="text-2xl font-bold tracking-tight text-foreground">
                  {formatCurrency(selectedTx.amount)}
                </div>
                <div className="flex items-center justify-center gap-2 pt-1">
                  <Badge
                    className={
                      selectedTx.status === "COMPLETED"
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        : selectedTx.status === "PENDING"
                        ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                        : "bg-destructive/10 text-destructive border-destructive/20"
                    }
                  >
                    {selectedTx.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(selectedTx.createdAt)}
                  </span>
                </div>
              </div>

              {/* Ledger Attributes List */}
              <div className="space-y-2.5 text-xs">
                {/* Transaction ID */}
                <div className="flex items-center justify-between p-2.5 rounded-lg border bg-background">
                  <div className="space-y-0.5">
                    <span className="text-muted-foreground font-medium">Transaction ID</span>
                    <p className="font-mono text-[11px] text-foreground">{selectedTx._id}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => handleCopy(selectedTx._id, "Transaction ID")}
                  >
                    {copiedKey === "Transaction ID" ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </Button>
                </div>

                {/* From Account */}
                <div className="flex items-center justify-between p-2.5 rounded-lg border bg-background">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground font-medium">From Account</span>
                      {userAccountIds.has(getAccountId(selectedTx.fromAccount)) && (
                        <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.2 rounded font-medium">
                          Your Account
                        </span>
                      )}
                    </div>
                    <p className="font-mono text-[11px] text-foreground">
                      {getAccountId(selectedTx.fromAccount)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() =>
                      handleCopy(getAccountId(selectedTx.fromAccount), "Sender Account ID")
                    }
                  >
                    {copiedKey === "Sender Account ID" ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </Button>
                </div>

                {/* To Account */}
                <div className="flex items-center justify-between p-2.5 rounded-lg border bg-background">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground font-medium">To Account (Recipient)</span>
                      {userAccountIds.has(getAccountId(selectedTx.toAccount)) && (
                        <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.2 rounded font-medium">
                          Your Account
                        </span>
                      )}
                    </div>
                    <p className="font-mono text-[11px] text-foreground">
                      {getAccountId(selectedTx.toAccount)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() =>
                      handleCopy(getAccountId(selectedTx.toAccount), "Recipient Account ID")
                    }
                  >
                    {copiedKey === "Recipient Account ID" ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </Button>
                </div>

                {/* Idempotency Key */}
                <div className="flex items-center justify-between p-2.5 rounded-lg border bg-background">
                  <div className="space-y-0.5">
                    <span className="text-muted-foreground font-medium">Idempotency Key</span>
                    <p className="font-mono text-[11px] text-foreground truncate max-w-[280px]">
                      {selectedTx.idempotencyKey}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => handleCopy(selectedTx.idempotencyKey, "Idempotency Key")}
                  >
                    {copiedKey === "Idempotency Key" ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Ledger Double-Entry Guarantee Box */}
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-2.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-medium text-foreground">Double-Entry Ledger Verified</p>
                  <p className="text-[11px] opacity-85 leading-relaxed">
                    This transaction represents an immutable atomic balance shift. Total debits equal total credits, written with append-only ledger security.
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => window.print()}
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print Receipt</span>
              </Button>
              <Button
                type="button"
                size="sm"
                className="text-xs"
                onClick={() => setSelectedTx(null)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}
