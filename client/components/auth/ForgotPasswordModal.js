"use client";

import { useState } from "react";
import { forgotPassword, resetPassword } from "@/lib/api/auth";
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
import { Mail, KeyRound, Lock, ArrowRight, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export function ForgotPasswordModal({ open, onOpenChange, initialEmail = "" }) {
  const [step, setStep] = useState(1); // 1 = Enter Email, 2 = Enter OTP + New Password
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [devOtpPreview, setDevOtpPreview] = useState("");

  const toast = useToast();

  function handleOpenChange(val) {
    if (!val) {
      // Reset state on close
      setStep(1);
      setErrorMsg("");
      setSuccessMsg("");
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
      setDevOtpPreview("");
    }
    onOpenChange(val);
  }

  // Step 1: Send OTP to Email
  async function handleSendOtp(e) {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMsg("Please enter your registered email address.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await forgotPassword(trimmedEmail);
      setIsLoading(false);
      setSuccessMsg(res.message || `A 6-digit verification code was sent to ${trimmedEmail}`);
      if (res.devOtp) {
        setDevOtpPreview(res.devOtp);
      }
      toast.success("Verification code sent to your email.", "Email Sent");
      setStep(2);
    } catch (err) {
      setIsLoading(false);
      const msg = err.message || "Failed to send verification code. Please check your email.";
      setErrorMsg(msg);
      toast.error(msg, "Error");
    }
  }

  // Step 2: Confirm OTP & Set New Password
  async function handleResetPassword(e) {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const trimmedOtp = otp.trim();
    if (!trimmedOtp || trimmedOtp.length !== 6) {
      setErrorMsg("Please enter a valid 6-digit verification code.");
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setErrorMsg("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg("Passwords do not match. Please re-type your new password.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await resetPassword(email.trim(), trimmedOtp, newPassword);
      setIsLoading(false);
      toast.success(res.message || "Password reset successfully! You can now sign in.", "Password Updated");
      setSuccessMsg("Your password has been changed successfully. You can now close this dialog and sign in.");
      setTimeout(() => {
        handleOpenChange(false);
      }, 2000);
    } catch (err) {
      setIsLoading(false);
      const msg = err.message || "Failed to reset password. Please verify the code and try again.";
      setErrorMsg(msg);
      toast.error(msg, "Reset Failed");
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg">Reset Password</DialogTitle>
              <DialogDescription className="text-xs">
                {step === 1
                  ? "Enter your email to receive a 6-digit Gmail verification code."
                  : "Enter the code sent to your email and choose a new password."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 py-1 text-xs font-medium text-muted-foreground border-y my-2">
          <span
            className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
              step === 1 ? "bg-primary text-primary-foreground font-bold" : "bg-muted text-foreground"
            }`}
          >
            1
          </span>
          <span className={step === 1 ? "text-foreground font-semibold" : ""}>Verify Email</span>
          <span className="opacity-40">→</span>
          <span
            className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
              step === 2 ? "bg-primary text-primary-foreground font-bold" : "bg-muted text-foreground"
            }`}
          >
            2
          </span>
          <span className={step === 2 ? "text-foreground font-semibold" : ""}>New Password</span>
        </div>

        {successMsg && (
          <div className="rounded-md bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400 flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="rounded-md bg-destructive/10 p-3 text-xs text-destructive flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {devOtpPreview && (
          <div className="rounded-md bg-blue-500/10 border border-blue-500/30 p-2.5 text-xs text-blue-900 dark:text-blue-200">
            <span className="font-semibold">Dev/Console OTP Preview:</span>{" "}
            <code className="bg-background px-1.5 py-0.5 rounded font-mono font-bold text-sm tracking-widest text-primary">
              {devOtpPreview}
            </code>
          </div>
        )}

        {step === 1 ? (
          /* STEP 1: Enter Email */
          <form onSubmit={handleSendOtp} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label htmlFor="resetEmail">Registered Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="resetEmail"
                  type="email"
                  placeholder="you@gmail.com"
                  className="pl-9"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                We will send a 6-digit one-time passcode (OTP) to this address.
              </p>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isLoading || !email.trim()} className="gap-1.5">
                {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>{isLoading ? "Sending Code..." : "Send Verification Code"}</span>
                {!isLoading && <ArrowRight className="h-3.5 w-3.5" />}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          /* STEP 2: Enter OTP + New Password */
          <form onSubmit={handleResetPassword} className="space-y-3.5 pt-1">
            <div className="rounded-md bg-muted/60 p-2.5 text-xs flex items-center justify-between">
              <span className="text-muted-foreground truncate">Code sent to: <strong>{email}</strong></span>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-primary hover:underline text-[11px] font-medium shrink-0 ml-2"
              >
                Change
              </button>
            </div>

            {/* 6-Digit OTP */}
            <div className="space-y-1.5">
              <Label htmlFor="resetOtp">6-Digit Verification Code</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="resetOtp"
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  className="pl-9 font-mono tracking-widest text-center text-base font-bold"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  disabled={isLoading}
                  required
                />
              </div>
              <p className="text-[11px] text-muted-foreground">Check your inbox or spam folder for the code.</p>
            </div>

            {/* New Password */}
            <div className="space-y-1.5">
              <Label htmlFor="resetNewPassword">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="resetNewPassword"
                  type="password"
                  placeholder="••••••••"
                  className="pl-9"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            {/* Confirm New Password */}
            <div className="space-y-1.5">
              <Label htmlFor="resetConfirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="resetConfirmPassword"
                  type="password"
                  placeholder="••••••••"
                  className="pl-9"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <DialogFooter className="pt-2 flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setStep(1)}
                disabled={isLoading}
                className="gap-1 text-xs"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back</span>
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isLoading || otp.length !== 6 || !newPassword || !confirmPassword}
                className="gap-1.5 text-xs"
              >
                {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>{isLoading ? "Updating..." : "Reset Password"}</span>
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
