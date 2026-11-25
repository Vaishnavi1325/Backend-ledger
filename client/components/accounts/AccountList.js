"use client";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { closeAccount } from "@/lib/api/account";
import { useToast } from "@/context/ToastContext";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { CreateAccountDialog } from "./CreateAccountDialog";
import { CreditCard, Copy, Check, Send, Plus, Lock, ArchiveX, Loader2, } from "lucide-react";
export function AccountList({ accounts, isLoading, onSelectTransferFrom, onSelectDeposit, }) {
    const [copiedId, setCopiedId] = useState(null);
    const [closingId, setClosingId] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);
    const queryClient = useQueryClient();
    const toast = useToast();
    const closeMutation = useMutation({
        mutationFn: (accountId) => closeAccount(accountId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["accounts"] });
            queryClient.invalidateQueries({ queryKey: ["account-summary"] });
            setClosingId(null);
            setErrorMsg(null);
            toast.success("Bank account has been closed successfully.", "Account Closed");
        },
        onError: (err) => {
            const msg = err.message || "Failed to close account";
            setErrorMsg(msg);
            setClosingId(null);
            toast.error(msg, "Closure Blocked");
        },
    });
    function handleCopy(id) {
        navigator.clipboard.writeText(id);
        setCopiedId(id);
        toast.info(`Account ID ...${id.slice(-6)} copied to clipboard.`, "Copied");
        setTimeout(() => setCopiedId(null), 2000);
    }
    function handleClose(id) {
        if (confirm("Are you sure you want to close this account? This action is permanent.")) {
            setClosingId(id);
            setErrorMsg(null);
            closeMutation.mutate(id);
        }
    }
    if (isLoading) {
        return (<div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32"/>
          <Skeleton className="h-9 w-28"/>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (<Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24"/>
                <Skeleton className="h-6 w-36"/>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-28 mb-2"/>
                <Skeleton className="h-4 w-full"/>
              </CardContent>
            </Card>))}
        </div>
      </div>);
    }
    const accountList = accounts || [];
    return (<div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            My Bank Accounts
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage your accounts and view real-time ledger-computed balances.
          </p>
        </div>
        <CreateAccountDialog />
      </div>

      {errorMsg && (<div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {errorMsg}
        </div>)}

      {accountList.length === 0 ? (<Card className="flex flex-col items-center justify-center p-8 text-center border-dashed">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-3">
            <CreditCard className="h-6 w-6"/>
          </div>
          <CardTitle className="text-base font-medium">No accounts found</CardTitle>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mb-4">
            You don&apos;t have any bank accounts opened yet. Create your first account to start transferring and receiving funds.
          </p>
          <CreateAccountDialog />
        </Card>) : (<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {accountList.map((account) => {
                const isClosing = closingId === account._id && closeMutation.isPending;
                const isZeroBalance = (account.balance ?? 0) === 0;
                return (<Card key={account._id} className="flex flex-col justify-between shadow-xs hover:border-primary/40 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <CreditCard className="h-4 w-4"/>
                      </div>
                      <span className="font-semibold text-sm">
                        {account.currency} Account
                      </span>
                    </div>

                    {account.status === "ACTIVE" && (<Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                        Active
                      </Badge>)}
                    {account.status === "FROZEN" && (<Badge variant="destructive" className="gap-1">
                        <Lock className="h-3 w-3"/>
                        Frozen
                      </Badge>)}
                    {account.status === "CLOSED" && (<Badge variant="outline" className="text-muted-foreground">
                        Closed
                      </Badge>)}
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                    <span className="font-mono text-[11px] truncate max-w-[170px]" title={account._id}>
                      ID: {account._id}
                    </span>
                    <button onClick={() => handleCopy(account._id)} className="inline-flex items-center gap-1 hover:text-foreground transition-colors p-1 rounded-sm" title="Copy Account ID">
                      {copiedId === account._id ? (<>
                          <Check className="h-3 w-3 text-emerald-600"/>
                          <span className="text-[10px] text-emerald-600 font-medium">Copied</span>
                        </>) : (<>
                          <Copy className="h-3 w-3"/>
                          <span className="text-[10px]">Copy</span>
                        </>)}
                    </button>
                  </div>
                </CardHeader>

                <CardContent className="pb-3">
                  <div className="text-xs text-muted-foreground mb-1">
                    Available Balance
                  </div>
                  <div className="text-2xl font-bold tracking-tight text-foreground">
                    {formatCurrency(account.balance ?? 0)}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-2">
                    Created on {formatDate(account.createdAt)}
                  </p>
                </CardContent>

                <CardFooter className="pt-2 border-t flex items-center justify-between gap-2">
                  {account.status === "ACTIVE" ? (<>
                      <Button size="sm" variant="secondary" className="text-xs gap-1 px-2.5" onClick={() => onSelectDeposit?.(account._id)}>
                        <Plus className="h-3.5 w-3.5"/>
                        Deposit
                      </Button>

                      <Button size="sm" variant="outline" className="w-full text-xs gap-1.5" onClick={() => onSelectTransferFrom?.(account._id)}>
                        <Send className="h-3.5 w-3.5"/>
                        Transfer
                      </Button>

                      {isZeroBalance && (<Button size="sm" variant="ghost" className="text-xs text-muted-foreground hover:text-destructive" onClick={() => handleClose(account._id)} disabled={isClosing} title="Close empty account">
                          {isClosing ? (<Loader2 className="h-3.5 w-3.5 animate-spin"/>) : (<ArchiveX className="h-3.5 w-3.5"/>)}
                        </Button>)}
                    </>) : (<span className="text-xs text-muted-foreground italic py-1">
                      {account.status === "FROZEN"
                            ? "Account suspended by staff"
                            : "Account permanently closed"}
                    </span>)}
                </CardFooter>
              </Card>);
            })}
        </div>)}
    </div>);
}
