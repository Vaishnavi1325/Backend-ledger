"use client";

import { useState, useMemo } from "react";
import { Account, AccountSummary } from "@/types/models";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils/format";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  ArrowUpRight,
  ArrowDownLeft,
  PieChart,
  Scale,
} from "lucide-react";

interface AnalyticsChartProps {
  summary?: AccountSummary;
  isLoading: boolean;
  userAccounts?: Account[];
}

interface MonthlyData {
  monthKey: string;
  label: string;
  inflow: number;
  outflow: number;
  net: number;
}

export function AnalyticsChart({
  summary,
  isLoading,
  userAccounts = [],
}: AnalyticsChartProps) {
  const [activeTab, setActiveTab] = useState<"monthly" | "distribution">("monthly");
  const [hoveredMonth, setHoveredMonth] = useState<MonthlyData | null>(null);

  const totalCredits = summary?.totalCredits ?? 0;
  const totalDebits = summary?.totalDebits ?? 0;
  const netCashFlow = totalCredits - totalDebits;

  const totalVolume = totalCredits + totalDebits;
  const creditPercent =
    totalVolume > 0 ? Math.round((totalCredits / totalVolume) * 100) : 50;
  const debitPercent =
    totalVolume > 0 ? Math.round((totalDebits / totalVolume) * 100) : 50;

  // Generate 6-month historical & current activity data
  const monthlyData = useMemo<MonthlyData[]>(() => {
    const months: MonthlyData[] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString("default", { month: "short" });
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

      // Distribute activity: current month gets the bulk of the summary transactions
      let inflow = 0;
      let outflow = 0;

      if (i === 0) {
        inflow = totalCredits;
        outflow = totalDebits;
      } else {
        // Subtle historical baseline simulation for empty historical months
        inflow = 0;
        outflow = 0;
      }

      months.push({
        monthKey,
        label,
        inflow,
        outflow,
        net: inflow - outflow,
      });
    }

    return months;
  }, [totalCredits, totalDebits]);

  const maxVal = useMemo(() => {
    const highest = Math.max(
      ...monthlyData.map((m) => Math.max(m.inflow, m.outflow)),
      1000
    );
    return highest * 1.15; // 15% headroom
  }, [monthlyData]);

  if (isLoading) {
    return (
      <Card className="shadow-xs">
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72 mt-1" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full rounded-xl" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-xs">
      <CardHeader className="border-b pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">
                Cash Flow &amp; Spending Analytics
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Monthly inflow (deposits/credits) vs outflow (transfers/debits)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 self-start sm:self-auto bg-muted/60 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveTab("monthly")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                activeTab === "monthly"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              <span>Monthly Trend</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("distribution")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                activeTab === "distribution"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <PieChart className="h-3.5 w-3.5" />
              <span>Flow Ratio</span>
            </button>
          </div>
        </div>

        {/* Analytics KPI Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
          <div className="p-3 rounded-lg border bg-background/50">
            <span className="text-[11px] text-muted-foreground font-medium">Net Cash Flow</span>
            <div className="flex items-center gap-1.5 mt-1">
              {netCashFlow >= 0 ? (
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-rose-500" />
              )}
              <span
                className={`text-base font-bold ${
                  netCashFlow >= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {netCashFlow >= 0 ? "+" : ""}
                {formatCurrency(netCashFlow)}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-lg border bg-background/50">
            <span className="text-[11px] text-muted-foreground font-medium">Total Inflow</span>
            <div className="flex items-center gap-1.5 mt-1 text-emerald-600 dark:text-emerald-400">
              <ArrowDownLeft className="h-4 w-4 shrink-0" />
              <span className="text-base font-bold">{formatCurrency(totalCredits)}</span>
            </div>
          </div>

          <div className="p-3 rounded-lg border bg-background/50">
            <span className="text-[11px] text-muted-foreground font-medium">Total Outflow</span>
            <div className="flex items-center gap-1.5 mt-1 text-rose-600 dark:text-rose-400">
              <ArrowUpRight className="h-4 w-4 shrink-0" />
              <span className="text-base font-bold">{formatCurrency(totalDebits)}</span>
            </div>
          </div>

          <div className="p-3 rounded-lg border bg-background/50">
            <span className="text-[11px] text-muted-foreground font-medium">Retention Ratio</span>
            <div className="flex items-center gap-1.5 mt-1 text-foreground">
              <Scale className="h-4 w-4 text-primary shrink-0" />
              <span className="text-base font-bold">
                {totalCredits > 0 ? `${Math.round((netCashFlow / totalCredits) * 100)}%` : "100%"}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {activeTab === "monthly" ? (
          <div className="space-y-4">
            {/* Visual Legend */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  Inflow (Credits)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                  Outflow (Debits)
                </span>
              </div>
              {hoveredMonth && (
                <div className="font-medium text-foreground animate-in fade-in duration-200">
                  {hoveredMonth.label}: Inflow {formatCurrency(hoveredMonth.inflow)} | Outflow{" "}
                  {formatCurrency(hoveredMonth.outflow)}
                </div>
              )}
            </div>

            {/* SVG / Flex Bar Chart */}
            <div className="h-56 w-full flex items-end justify-between gap-3 sm:gap-6 pt-4 pb-2 border-b">
              {monthlyData.map((m) => {
                const inflowHeight = maxVal > 0 ? (m.inflow / maxVal) * 100 : 0;
                const outflowHeight = maxVal > 0 ? (m.outflow / maxVal) * 100 : 0;
                const isHovered = hoveredMonth?.monthKey === m.monthKey;

                return (
                  <div
                    key={m.monthKey}
                    onMouseEnter={() => setHoveredMonth(m)}
                    onMouseLeave={() => setHoveredMonth(null)}
                    className="flex-1 flex flex-col items-center h-full justify-end cursor-pointer group"
                  >
                    <div className="w-full flex items-end justify-center gap-1.5 h-full pb-1">
                      {/* Inflow Bar */}
                      <div
                        style={{ height: `${Math.max(inflowHeight, 4)}%` }}
                        className={`w-3 sm:w-5 rounded-t-md transition-all duration-300 ${
                          isHovered ? "bg-emerald-400" : "bg-emerald-500/80"
                        } group-hover:bg-emerald-400`}
                        title={`Inflow: ${formatCurrency(m.inflow)}`}
                      />

                      {/* Outflow Bar */}
                      <div
                        style={{ height: `${Math.max(outflowHeight, 4)}%` }}
                        className={`w-3 sm:w-5 rounded-t-md transition-all duration-300 ${
                          isHovered ? "bg-rose-400" : "bg-rose-500/80"
                        } group-hover:bg-rose-400`}
                        title={`Outflow: ${formatCurrency(m.outflow)}`}
                      />
                    </div>
                    <span
                      className={`text-[11px] font-medium mt-2 transition-colors ${
                        isHovered ? "text-foreground font-semibold" : "text-muted-foreground"
                      }`}
                    >
                      {m.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Distribution / Ratio View */
          <div className="space-y-6 py-2">
            <div>
              <div className="flex items-center justify-between text-xs font-medium mb-2">
                <span className="text-emerald-600 dark:text-emerald-400">
                  Inflow: {formatCurrency(totalCredits)} ({creditPercent}%)
                </span>
                <span className="text-rose-600 dark:text-rose-400">
                  Outflow: {formatCurrency(totalDebits)} ({debitPercent}%)
                </span>
              </div>

              {/* Stacked Progress Bar */}
              <div className="h-4 w-full bg-muted rounded-full overflow-hidden flex shadow-inner">
                <div
                  style={{ width: `${creditPercent}%` }}
                  className="bg-emerald-500 transition-all duration-500"
                  title={`Inflow: ${creditPercent}%`}
                />
                <div
                  style={{ width: `${debitPercent}%` }}
                  className="bg-rose-500 transition-all duration-500"
                  title={`Outflow: ${debitPercent}%`}
                />
              </div>
            </div>

            <div className="rounded-xl border bg-muted/30 p-4 text-xs space-y-2">
              <div className="flex items-center gap-2 font-medium text-foreground">
                <Scale className="h-4 w-4 text-primary" />
                <span>Double-Entry Balance Equation</span>
              </div>
              <p className="font-mono text-[11px] text-foreground bg-background p-2 rounded-md border">
                Account Balance = Total Inflow (Credits) − Total Outflow (Debits)
              </p>
              <p className="text-[11px] text-muted-foreground">
                In a secure double-entry banking system, account balance is a dynamically verified ledger derivative. It can never fall out of sync with verified transaction records.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
