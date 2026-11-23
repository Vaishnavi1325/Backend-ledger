"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTransfer } from "@/lib/api/transaction";
import { lookupRecipientAccount } from "@/lib/api/account";
import { Account, RecipientLookup } from "@/types/models";
import { useToast } from "@/context/ToastContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils/format";
import { Send, CheckCircle2, AlertCircle, Loader2, UserCheck } from "lucide-react";

interface TransferModalProps {
  accounts: Account[];
  selectedFromId?: string;
  onClose?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function TransferModal({
  accounts,
  selectedFromId,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: TransferModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? setControlledOpen! : setInternalOpen;

  const [fromAccount, setFromAccount] = useState("");
  const [toAccount, setToAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [idempotencyKey, setIdempotencyKey] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Live Recipient Verification State
  const [recipientData, setRecipientData] = useState<RecipientLookup | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const toast = useToast();

  const activeAccounts = accounts.filter((a) => a.status === "ACTIVE");

  // Generate a fresh UUID idempotency key every time the modal opens
  useEffect(() => {
    if (open) {
      setIdempotencyKey(crypto.randomUUID());
      setErrorMsg("");
      setSuccessMsg("");
      setAmount("");
      setToAccount("");
      setRecipientData(null);
      setLookupError(null);
      if (selectedFromId) {
        setFromAccount(selectedFromId);
      } else if (activeAccounts.length > 0 && !fromAccount) {
        setFromAccount(activeAccounts[0]._id);
      }
    }
  }, [open, selectedFromId]);

  // Live recipient lookup when toAccount is a valid 24-character hexadecimal ID
  useEffect(() => {
    const trimmed = toAccount.trim();

    if (!trimmed) {
      setRecipientData(null);
      setLookupError(null);
      setIsLookingUp(false);
      return;
    }

    if (trimmed.length < 24) {
      setRecipientData(null);
      setLookupError(null);
      setIsLookingUp(false);
      return;
    }

    const isValidHex = /^[0-9a-fA-F]{24}$/.test(trimmed);
    if (!isValidHex) {
      setRecipientData(null);
      setLookupError("Invalid Account ID format (must be 24 hex characters).");
      setIsLookingUp(false);
      return;
    }

    let isSubscribed = true;
    setIsLookingUp(true);
    setLookupError(null);

    const debounceTimer = setTimeout(() => {
      lookupRecipientAccount(trimmed)
        .then((data) => {
          if (isSubscribed) {
            setRecipientData(data);
            setLookupError(null);
          }
        })
        .catch((err) => {
          if (isSubscribed) {
            setRecipientData(null);
            setLookupError(err.message || "Recipient account not found.");
          }
        })
        .finally(() => {
          if (isSubscribed) {
            setIsLookingUp(false);
          }
        });
    }, 350);

    return () => {
      isSubscribed = false;
      clearTimeout(debounceTimer);
    };
  }, [toAccount]);

  const selectedAccount = activeAccounts.find((a) => a._id === fromAccount);
  const currentBalance = selectedAccount?.balance ?? 0;

  const mutation = useMutation({
    mutationFn: createTransfer,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["account-summary"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      const recipientName = recipientData?.holderName || "recipient";
      const transferredStr = formatCurrency(data.transaction.amount);
      setSuccessMsg(
        `Transferred ${transferredStr} successfully to ${recipientName}!`
      );
      toast.success(`Transferred ${transferredStr} to ${recipientName}.`, "Transfer Completed");
      setErrorMsg("");
      // Generate a new idempotency key so a second transfer doesn't conflict
      setIdempotencyKey(crypto.randomUUID());
    },
    onError: (err: any) => {
      const msg = err.message || "Transfer failed. Please try again.";
      setErrorMsg(msg);
      toast.error(msg, "Transfer Failed");
    },
  });

  function handleTransfer(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg("Please enter a valid positive transfer amount.");
      return;
    }

    if (parsedAmount > currentBalance) {
      setErrorMsg(
        `Insufficient funds. Available balance is ${formatCurrency(currentBalance)}.`
      );
      return;
    }

    if (!fromAccount) {
      setErrorMsg("Please select an active source account.");
      return;
    }

    const trimmedTo = toAccount.trim();
    if (!trimmedTo) {
      setErrorMsg("Please provide a destination account ID.");
      return;
    }

    if (fromAccount === trimmedTo) {
      setErrorMsg("Source and destination accounts cannot be identical.");
      return;
    }

    if (recipientData && !recipientData.canReceiveTransfers) {
      setErrorMsg(`Recipient account is ${recipientData.status} and cannot receive funds.`);
      return;
    }

    if (lookupError) {
      setErrorMsg("Please resolve recipient verification errors before proceeding.");
      return;
    }

    mutation.mutate({
      fromAccount,
      toAccount: trimmedTo,
      amount: parsedAmount,
      idempotencyKey,
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger
          render={
            <Button className="gap-2">
              <Send className="h-4 w-4" />
              <span>Transfer Money</span>
            </Button>
          }
        />
      )}

      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleTransfer}>
          <DialogHeader>
            <DialogTitle>Transfer Funds</DialogTitle>
            <DialogDescription>
              Execute a double-entry ledger transfer with real-time recipient verification.
            </DialogDescription>
          </DialogHeader>

          {successMsg && (
            <div className="mt-4 rounded-md bg-emerald-500/10 p-3 text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="my-4 space-y-4">
            {/* From Account */}
            <div className="space-y-1.5">
              <Label htmlFor="fromAccount">From Account (Source)</Label>
              <select
                id="fromAccount"
                value={fromAccount}
                onChange={(e) => setFromAccount(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                disabled={mutation.isPending}
              >
                {activeAccounts.map((acc) => (
                  <option key={acc._id} value={acc._id}>
                    {acc.currency} — ID: ...{acc._id.slice(-6)} (Balance:{" "}
                    {formatCurrency(acc.balance)})
                  </option>
                ))}
              </select>
              {selectedAccount && (
                <p className="text-xs text-muted-foreground">
                  Available:{" "}
                  <span className="font-semibold text-foreground">
                    {formatCurrency(selectedAccount.balance)}
                  </span>
                </p>
              )}
            </div>

            {/* To Account with Live Verification */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="toAccount">To Account ID (Destination)</Label>
                {isLookingUp && (
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground animate-pulse">
                    <Loader2 className="h-3 w-3 animate-spin text-primary" />
                    Verifying...
                  </span>
                )}
              </div>
              <Input
                id="toAccount"
                placeholder="e.g. 6b03cb14800d96690de2b054"
                value={toAccount}
                onChange={(e) => setToAccount(e.target.value)}
                disabled={mutation.isPending}
                required
              />

              {/* Lookup Feedback UI */}
              {recipientData && (
                <div
                  className={`p-3 rounded-lg border text-xs space-y-1 mt-1.5 transition-all ${
                    recipientData.canReceiveTransfers
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-100"
                      : "bg-destructive/10 border-destructive/30 text-destructive"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-medium">
                      <UserCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>
                        Verified Name: <strong>{recipientData.holderName}</strong>
                      </span>
                    </div>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        recipientData.status === "ACTIVE"
                          ? "bg-emerald-200/60 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200"
                          : "bg-destructive/20 text-destructive"
                      }`}
                    >
                      {recipientData.status}
                    </span>
                  </div>
                  <div className="text-[11px] opacity-80 flex items-center justify-between">
                    <span>Account Currency: {recipientData.currency}</span>
                    {recipientData.isOwnAccount && (
                      <span className="font-semibold text-primary">Self Transfer</span>
                    )}
                  </div>
                  {!recipientData.canReceiveTransfers && (
                    <p className="text-[11px] text-destructive font-medium pt-1">
                      ⚠️ Account is {recipientData.status} and cannot accept incoming transfers.
                    </p>
                  )}
                </div>
              )}

              {lookupError && (
                <div className="mt-1.5 rounded-md bg-destructive/10 p-2 text-xs text-destructive flex items-center gap-2">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{lookupError}</span>
                </div>
              )}

              {!recipientData && !lookupError && (
                <p className="text-[11px] text-muted-foreground">
                  Paste the 24-character ID. The recipient's verified name will be shown automatically.
                </p>
              )}
            </div>

            {/* Amount */}
            <div className="space-y-1.5">
              <Label htmlFor="amount">Transfer Amount ({selectedAccount?.currency || "INR"})</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={mutation.isPending}
                required
              />
            </div>

            {/* Idempotency Key Info */}
            <div className="rounded-md bg-muted/60 p-2.5 text-[11px] text-muted-foreground font-mono flex items-center justify-between">
              <span className="truncate">Key: {idempotencyKey.slice(0, 18)}...</span>
              <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                Protected against duplicate debits
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={mutation.isPending}
            >
              Close
            </Button>
            <Button
              type="submit"
              disabled={
                mutation.isPending ||
                isLookingUp ||
                activeAccounts.length === 0 ||
                (recipientData !== null && !recipientData.canReceiveTransfers) ||
                lookupError !== null
              }
              className="gap-2"
            >
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {mutation.isPending ? "Processing..." : "Transfer Now"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
