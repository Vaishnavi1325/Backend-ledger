"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { getUserAccounts, getAccountSummary } from "@/lib/api/account";
import { Navbar } from "@/components/layout/Navbar";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { AnalyticsChart } from "@/components/dashboard/AnalyticsChart";
import { AccountList } from "@/components/accounts/AccountList";
import { TransferModal } from "@/components/transactions/TransferModal";
import { DepositModal } from "@/components/accounts/DepositModal";
import { TransactionTable } from "@/components/transactions/TransactionTable";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { Button } from "@/components/ui/button";
import { Send, Plus, RefreshCw } from "lucide-react";

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [selectedFromAccountId, setSelectedFromAccountId] = useState<string | undefined>();

  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [selectedDepositAccountId, setSelectedDepositAccountId] = useState<string | undefined>();

  // Redirect unauthenticated visitors to login
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  // Fetch Accounts with live ledger balances
  const {
    data: accounts,
    isLoading: isLoadingAccounts,
    refetch: refetchAccounts,
  } = useQuery({
    queryKey: ["accounts"],
    queryFn: getUserAccounts,
    enabled: isAuthenticated,
  });

  // Fetch Account Summary and Analytics
  const {
    data: summary,
    isLoading: isLoadingSummary,
    refetch: refetchSummary,
    isRefetching,
  } = useQuery({
    queryKey: ["account-summary"],
    queryFn: getAccountSummary,
    enabled: isAuthenticated,
  });

  function handleOpenTransfer(fromAccountId?: string) {
    setSelectedFromAccountId(fromAccountId);
    setTransferModalOpen(true);
  }

  function handleOpenDeposit(targetAccountId?: string) {
    setSelectedDepositAccountId(targetAccountId);
    setDepositModalOpen(true);
  }

  function handleRefreshAll() {
    refetchAccounts();
    refetchSummary();
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const isAdminOrStaff = user.role === "admin" || user.role === "support";

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col">
      <Navbar onOpenTransfer={() => handleOpenTransfer()} />

      <main className="container mx-auto flex-1 px-4 sm:px-6 py-6 space-y-8 max-w-7xl">
        {/* Welcome & Action Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Welcome back, {user.name}!
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Double-entry core banking ledger overview and real-time operations.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshAll}
              disabled={isRefetching}
              className="gap-1.5 text-xs"
              title="Refresh ledger balances"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isRefetching ? "animate-spin" : ""}`}
              />
              <span>Refresh</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => handleOpenDeposit()}
              className="gap-1.5"
              disabled={!accounts || accounts.length === 0}
            >
              <Plus className="h-4 w-4" />
              <span>Deposit Funds</span>
            </Button>

            <Button
              onClick={() => handleOpenTransfer()}
              className="gap-2"
              disabled={!accounts || accounts.length === 0}
            >
              <Send className="h-4 w-4" />
              <span>Transfer Funds</span>
            </Button>
          </div>
        </div>

        {/* 1. Account Summaries & Analytics KPI Cards */}
        <section aria-labelledby="summary-heading">
          <SummaryCards summary={summary} isLoading={isLoadingSummary} />
        </section>

        {/* 1b. Cash Flow & Spending Analytics Chart */}
        <section aria-labelledby="analytics-chart-heading">
          <AnalyticsChart
            summary={summary}
            isLoading={isLoadingSummary}
            userAccounts={accounts || []}
          />
        </section>

        {/* Admin Controls Panel (Visible to Admins and Support staff) */}
        {isAdminOrStaff && (
          <section aria-labelledby="admin-heading">
            <AdminPanel />
          </section>
        )}

        {/* 2. Bank Accounts Grid */}
        <section aria-labelledby="accounts-heading">
          <AccountList
            accounts={accounts}
            isLoading={isLoadingAccounts}
            onSelectTransferFrom={(id) => handleOpenTransfer(id)}
            onSelectDeposit={(id) => handleOpenDeposit(id)}
          />
        </section>

        {/* 3. Transaction History & Filtering Table */}
        <section aria-labelledby="transactions-heading">
          <TransactionTable userAccounts={accounts || []} />
        </section>

        {/* Transfer Modal */}
        <TransferModal
          accounts={accounts || []}
          selectedFromId={selectedFromAccountId}
          open={transferModalOpen}
          onOpenChange={setTransferModalOpen}
        />

        {/* Deposit Modal */}
        <DepositModal
          accounts={accounts || []}
          selectedAccountId={selectedDepositAccountId}
          open={depositModalOpen}
          onOpenChange={setDepositModalOpen}
        />
      </main>

      <footer className="border-t py-4 text-center text-xs text-muted-foreground bg-background">
        <div className="container mx-auto px-4">
          Ledger Bank Transaction System — Built with Next.js, React Query &amp; Mongoose Double-Entry Accounting
        </div>
      </footer>
    </div>
  );
}
