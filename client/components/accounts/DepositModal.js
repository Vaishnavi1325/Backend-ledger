"use client";
import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { depositFunds } from "@/lib/api/account";
import { useToast } from "@/context/ToastContext";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils/format";
import { Plus, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
export function DepositModal({ accounts, selectedAccountId, open: controlledOpen, onOpenChange: setControlledOpen, }) {
    const [internalOpen, setInternalOpen] = useState(false);
    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;
    const setOpen = isControlled ? setControlledOpen : setInternalOpen;
    const [accountId, setAccountId] = useState("");
    const [amount, setAmount] = useState("");
    const [idempotencyKey, setIdempotencyKey] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const queryClient = useQueryClient();
    const toast = useToast();
    const activeAccounts = accounts.filter((a) => a.status === "ACTIVE");
    useEffect(() => {
        if (open) {
            setIdempotencyKey(crypto.randomUUID());
            setErrorMsg("");
            setSuccessMsg("");
            setAmount("");
            if (selectedAccountId) {
                setAccountId(selectedAccountId);
            }
            else if (activeAccounts.length > 0 && !accountId) {
                setAccountId(activeAccounts[0]._id);
            }
        }
    }, [open, selectedAccountId]);
    const targetAccount = activeAccounts.find((a) => a._id === accountId);
    const mutation = useMutation({
        mutationFn: () => depositFunds(accountId, parseFloat(amount), idempotencyKey),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["accounts"] });
            queryClient.invalidateQueries({ queryKey: ["account-summary"] });
            queryClient.invalidateQueries({ queryKey: ["transactions"] });
            const depositedStr = formatCurrency(parseFloat(amount));
            setSuccessMsg(`Deposited ${depositedStr} successfully! New balance: ${formatCurrency(data.newBalance)}`);
            toast.success(`Successfully deposited ${depositedStr} into your account.`, "Deposit Confirmed");
            setErrorMsg("");
            setIdempotencyKey(crypto.randomUUID());
        },
        onError: (err) => {
            const msg = err.message || "Deposit failed. Please try again.";
            setErrorMsg(msg);
            toast.error(msg, "Deposit Failed");
        },
    });
    function handleDeposit(e) {
        e.preventDefault();
        setErrorMsg("");
        setSuccessMsg("");
        const parsed = parseFloat(amount);
        if (isNaN(parsed) || parsed <= 0) {
            setErrorMsg("Please enter a valid positive deposit amount.");
            return;
        }
        if (!accountId) {
            setErrorMsg("Please select an active target account.");
            return;
        }
        mutation.mutate();
    }
    const quickPills = [500, 1000, 5000, 10000];
    return (<Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (<DialogTrigger render={<Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <Plus className="h-3.5 w-3.5"/>
              <span>Deposit Funds</span>
            </Button>}/>)}

      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleDeposit}>
          <DialogHeader>
            <DialogTitle>Deposit / Add Funds</DialogTitle>
            <DialogDescription>
              Deposit money into your bank account via double-entry bank reserve credit.
            </DialogDescription>
          </DialogHeader>

          {successMsg && (<div className="mt-4 rounded-md bg-emerald-500/10 p-3 text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0"/>
              <span>{successMsg}</span>
            </div>)}

          {errorMsg && (<div className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0"/>
              <span>{errorMsg}</span>
            </div>)}

          <div className="my-4 space-y-4">
            {/* Target Account */}
            <div className="space-y-1.5">
              <Label htmlFor="depAccount">Target Account</Label>
              <select id="depAccount" value={accountId} onChange={(e) => setAccountId(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring" disabled={mutation.isPending}>
                {activeAccounts.map((acc) => (<option key={acc._id} value={acc._id}>
                    {acc.currency} — ID: ...{acc._id.slice(-6)} (Balance:{" "}
                    {formatCurrency(acc.balance)})
                  </option>))}
              </select>
            </div>

            {/* Quick Amount Buttons */}
            <div className="space-y-1.5">
              <Label>Quick Amounts</Label>
              <div className="grid grid-cols-4 gap-2">
                {quickPills.map((val) => (<Button key={val} type="button" variant="outline" size="sm" className="text-xs" onClick={() => setAmount(String(val))} disabled={mutation.isPending}>
                    +₹{val.toLocaleString()}
                  </Button>))}
              </div>
            </div>

            {/* Custom Amount */}
            <div className="space-y-1.5">
              <Label htmlFor="depAmount">Deposit Amount ({targetAccount?.currency || "INR"})</Label>
              <Input id="depAmount" type="number" step="0.01" min="1" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} disabled={mutation.isPending} required/>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={mutation.isPending}>
              Close
            </Button>
            <Button type="submit" disabled={mutation.isPending || activeAccounts.length === 0} className="gap-2">
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin"/>}
              {mutation.isPending ? "Processing..." : "Deposit Now"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>);
}
