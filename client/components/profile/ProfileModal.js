"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { changePassword } from "@/lib/api/auth";
import { useToast } from "@/context/ToastContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Shield,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
} from "lucide-react";

export function ProfileModal({ open, onOpenChange }) {
  const { user } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState("profile"); // "profile" | "password"
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  if (!user) return null;

  async function handlePasswordChange(e) {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (newPassword.length < 6) {
      setErrorMsg("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg("New passwords do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      setErrorMsg("New password must be different from current password.");
      return;
    }

    setIsLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      setSuccessMsg("Your password has been changed successfully.");
      toast.success("Password updated successfully!", "Security");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      const msg = err.message || "Failed to update password.";
      setErrorMsg(msg);
      toast.error(msg, "Password Error");
    } finally {
      setIsLoading(false);
    }
  }

  function handleClose() {
    setErrorMsg("");
    setSuccessMsg("");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <User className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">
                User Profile &amp; Security
              </DialogTitle>
              <DialogDescription className="text-xs">
                Manage your personal information and credentials
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-b pb-2 pt-1">
          <Button
            type="button"
            variant={activeTab === "profile" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("profile")}
            className="text-xs gap-1.5 h-8"
          >
            <User className="h-3.5 w-3.5" />
            <span>Profile Details</span>
          </Button>

          <Button
            type="button"
            variant={activeTab === "password" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("password")}
            className="text-xs gap-1.5 h-8"
          >
            <KeyRound className="h-3.5 w-3.5" />
            <span>Change Password</span>
          </Button>
        </div>

        {activeTab === "profile" ? (
          <div className="my-2 space-y-3.5 text-xs">
            <div className="rounded-xl border bg-muted/30 p-3.5 space-y-3">
              <div>
                <span className="text-muted-foreground font-medium">Full Name</span>
                <p className="text-sm font-semibold text-foreground mt-0.5">{user.name}</p>
              </div>

              <div>
                <span className="text-muted-foreground font-medium">Email Address</span>
                <p className="text-sm font-semibold text-foreground mt-0.5">{user.email}</p>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-muted-foreground font-medium">Assigned System Role</span>
                <Badge
                  className={
                    user.role === "admin"
                      ? "bg-amber-500/10 text-amber-600 border-amber-500/20 uppercase"
                      : user.role === "support"
                      ? "bg-blue-500/10 text-blue-600 border-blue-500/20 uppercase"
                      : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 uppercase"
                  }
                >
                  <Shield className="h-3 w-3 mr-1 inline" />
                  {user.role || "customer"}
                </Badge>
              </div>
            </div>

            <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-[11px] text-muted-foreground leading-relaxed">
              🔒 Authenticated with JWT session security. Your account permissions and double-entry limits are bound to your verified user profile.
            </div>
          </div>
        ) : (
          /* Change Password Form */
          <form onSubmit={handlePasswordChange} className="my-2 space-y-3">
            {successMsg && (
              <div className="rounded-md bg-emerald-500/10 p-2.5 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="rounded-md bg-destructive/10 p-2.5 text-xs text-destructive flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="newPassword">New Password (min 6 characters)</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={isLoading || !currentPassword || !newPassword}
                className="w-full gap-2 text-xs"
              >
                {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <Lock className="h-3.5 w-3.5" />
                <span>{isLoading ? "Updating Password..." : "Update Password"}</span>
              </Button>
            </div>
          </form>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" size="sm" onClick={handleClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
