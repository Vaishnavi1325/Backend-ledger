"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createAccount } from "@/lib/api/account";
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
import { Label } from "@/components/ui/label";
import { PlusCircle, Loader2 } from "lucide-react";

export function CreateAccountDialog() {
  const [open, setOpen] = useState(false);
  const [currency, setCurrency] = useState("INR");
  const [errorMsg, setErrorMsg] = useState("");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (curr: string) => createAccount(curr),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["account-summary"] });
      setOpen(false);
      setErrorMsg("");
    },
    onError: (err: any) => {
      setErrorMsg(err.message || "Failed to create account");
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    mutation.mutate(currency);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="gap-2">
            <PlusCircle className="h-4 w-4" />
            <span>New Account</span>
          </Button>
        }
      />
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Open New Bank Account</DialogTitle>
            <DialogDescription>
              Create a new ledger-backed banking account to store and transfer funds.
            </DialogDescription>
          </DialogHeader>

          {errorMsg && (
            <div className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {errorMsg}
            </div>
          )}

          <div className="my-4 space-y-3">
            <Label htmlFor="currency">Account Currency</Label>
            <select
              id="currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="INR">INR — Indian Rupee (₹)</option>
              <option value="USD">USD — US Dollar ($)</option>
              <option value="EUR">EUR — Euro (€)</option>
              <option value="GBP">GBP — British Pound (£)</option>
            </select>
            <p className="text-xs text-muted-foreground">
              Initial ledger balance will be set to 0.00.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending} className="gap-2">
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {mutation.isPending ? "Creating..." : "Confirm & Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
