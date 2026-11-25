"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils/format";
import { Wallet, ArrowDownLeft, ArrowUpRight, Landmark } from "lucide-react";
export function SummaryCards({ summary, isLoading }) {
    if (isLoading) {
        return (<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (<Card key={i} className="shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <Skeleton className="h-4 w-28"/>
              <Skeleton className="h-5 w-5 rounded-full"/>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-36 mb-1"/>
              <Skeleton className="h-3 w-24"/>
            </CardContent>
          </Card>))}
      </div>);
    }
    const totalBalance = summary?.totalBalance ?? 0;
    const totalDebits = summary?.totalDebits ?? 0;
    const totalCredits = summary?.totalCredits ?? 0;
    const activeAccounts = summary?.activeAccounts ?? 0;
    const totalAccounts = summary?.accountCount ?? 0;
    return (<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Balance */}
      <Card className="shadow-xs border-primary/20 bg-gradient-to-br from-card to-primary/5">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Net Balance
          </CardTitle>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Wallet className="h-5 w-5"/>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tracking-tight text-foreground">
            {formatCurrency(totalBalance)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Across {activeAccounts} active {activeAccounts === 1 ? "account" : "accounts"}
          </p>
        </CardContent>
      </Card>

      {/* Total Inflow / Credits */}
      <Card className="shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Inflow (Received)
          </CardTitle>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <ArrowDownLeft className="h-5 w-5"/>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
            +{formatCurrency(totalCredits)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Total ledger credit entries
          </p>
        </CardContent>
      </Card>

      {/* Total Outflow / Debits */}
      <Card className="shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Outflow (Sent)
          </CardTitle>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
            <ArrowUpRight className="h-5 w-5"/>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
            -{formatCurrency(totalDebits)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Total ledger debit entries
          </p>
        </CardContent>
      </Card>

      {/* Accounts Count */}
      <Card className="shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Accounts
          </CardTitle>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Landmark className="h-5 w-5"/>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tracking-tight text-foreground">
            {activeAccounts} / {totalAccounts}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Active banking accounts
          </p>
        </CardContent>
      </Card>
    </div>);
}
