"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllUsers, freezeAccount, unfreezeAccount } from "@/lib/api/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils/format";
import { useToast } from "@/context/ToastContext";
import { ShieldAlert, Lock, Unlock, Loader2, Users } from "lucide-react";

export function AdminPanel() {
  const [targetAccountId, setTargetAccountId] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [actionError, setActionError] = useState("");
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: getAllUsers,
  });

  const freezeMutation = useMutation({
    mutationFn: (id: string) => freezeAccount(id),
    onSuccess: (data) => {
      setActionSuccess(`Account ${data._id} is now FROZEN.`);
      setActionError("");
      setTargetAccountId("");
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      toast.warning(`Account ${data._id} has been FROZEN.`, "Security Freeze");
    },
    onError: (err: any) => {
      const msg = err.message || "Failed to freeze account";
      setActionError(msg);
      setActionSuccess("");
      toast.error(msg, "Freeze Failed");
    },
  });

  const unfreezeMutation = useMutation({
    mutationFn: (id: string) => unfreezeAccount(id),
    onSuccess: (data) => {
      setActionSuccess(`Account ${data._id} is now ACTIVE (Unfrozen).`);
      setActionError("");
      setTargetAccountId("");
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      toast.success(`Account ${data._id} has been UNFROZEN and is now ACTIVE.`, "Account Unfrozen");
    },
    onError: (err: any) => {
      const msg = err.message || "Failed to unfreeze account";
      setActionError(msg);
      setActionSuccess("");
      toast.error(msg, "Unfreeze Failed");
    },
  });

  return (
    <Card className="border-amber-500/30 bg-amber-500/5 shadow-xs">
      <CardHeader className="border-b pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold">
              Bank Staff &amp; Administrator Controls
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Role-based management: Inspect users, enforce security freezes, and unfreeze accounts.
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Account Freeze / Unfreeze Tool */}
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <span>Account Security Action</span>
          </h3>

          {actionSuccess && (
            <div className="rounded-md bg-emerald-500/10 p-2.5 text-xs text-emerald-600 dark:text-emerald-400">
              {actionSuccess}
            </div>
          )}

          {actionError && (
            <div className="rounded-md bg-destructive/10 p-2.5 text-xs text-destructive">
              {actionError}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2.5">
            <Input
              placeholder="Enter Account ID (24-hex characters)"
              value={targetAccountId}
              onChange={(e) => setTargetAccountId(e.target.value.trim())}
              className="text-xs font-mono"
            />
            <Button
              variant="destructive"
              size="sm"
              className="gap-1.5 text-xs whitespace-nowrap"
              disabled={!targetAccountId || freezeMutation.isPending}
              onClick={() => freezeMutation.mutate(targetAccountId)}
            >
              {freezeMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Lock className="h-3.5 w-3.5" />
              )}
              <span>Freeze Account</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs whitespace-nowrap text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
              disabled={!targetAccountId || unfreezeMutation.isPending}
              onClick={() => unfreezeMutation.mutate(targetAccountId)}
            >
              {unfreezeMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Unlock className="h-3.5 w-3.5" />
              )}
              <span>Unfreeze Account</span>
            </Button>
          </div>
        </div>

        {/* Users Table */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>Registered Users Directory ({users?.length || 0})</span>
          </div>

          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Name</TableHead>
                  <TableHead className="text-xs">Email</TableHead>
                  <TableHead className="text-xs">Role</TableHead>
                  <TableHead className="text-xs">User ID</TableHead>
                  <TableHead className="text-xs text-right">Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-xs text-muted-foreground">
                      Loading users directory...
                    </TableCell>
                  </TableRow>
                ) : !users || users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-xs text-muted-foreground">
                      No registered users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((u) => (
                    <TableRow key={u._id} className="text-xs">
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell className="text-muted-foreground">{u.email}</TableCell>
                      <TableCell>
                        <Badge
                          variant={u.role === "admin" ? "default" : u.role === "support" ? "secondary" : "outline"}
                          className="capitalize text-[10px]"
                        >
                          {u.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-[11px] text-muted-foreground">
                        {u._id}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatDate(u.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
