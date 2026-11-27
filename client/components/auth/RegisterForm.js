"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registerSchema } from "@/lib/validators/auth.schema";
import { registerUser, registerWithOtp, sendOtp } from "@/lib/api/auth";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/context/ToastContext";
import { ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mail, Lock, KeyRound, Loader2, ShieldCheck, CheckCircle2, AlertCircle, ArrowLeft, ArrowRight } from "lucide-react";

export function RegisterForm() {
  const [step, setStep] = useState(1); // 1 = Details, 2 = Verify Email OTP
  const [serverError, setServerError] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const router = useRouter();
  const { login } = useAuth();
  const toast = useToast();

  const {
    register: registerField,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
  });

  // Step 1: Send OTP to verify email before creating account
  async function handleSendVerificationOtp() {
    setServerError("");
    const { name, email, password } = getValues();

    if (!name || name.trim().length < 1) {
      setServerError("Please enter your full name.");
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setServerError("Please enter a valid email address.");
      return;
    }
    if (!password || password.length < 6) {
      setServerError("Password must be at least 6 characters long.");
      return;
    }

    setIsSendingOtp(true);
    try {
      await sendOtp(email.trim().toLowerCase(), "REGISTRATION");
      setIsSendingOtp(false);
      setStep(2);
      toast.info(`Verification code sent to ${email}. Please check your inbox.`, "Check Your Inbox");
    } catch (err) {
      setIsSendingOtp(false);
      setServerError(err.message || "Could not send verification code.");
      toast.error(err.message || "Failed to send code", "Error");
    }
  }

  // Step 2: Confirm OTP & create account
  async function handleCompleteRegistrationWithOtp(e) {
    e.preventDefault();
    setServerError("");

    const trimmedOtp = otpCode.trim();
    if (trimmedOtp.length !== 6 || !/^\d{6}$/.test(trimmedOtp)) {
      setServerError("Please enter the 6-digit numeric verification code.");
      return;
    }

    const { name, email, password } = getValues();
    setIsVerifying(true);
    try {
      const result = await registerWithOtp(name.trim(), email.trim().toLowerCase(), password, trimmedOtp);
      setIsVerifying(false);
      login(result.user, result.token);
      toast.success("Account created and email verified successfully!", "Welcome!");
      router.push("/dashboard");
    } catch (err) {
      setIsVerifying(false);
      setServerError(err.message || "Verification failed. Please check the code.");
      toast.error(err.message || "Registration failed", "Verification Error");
    }
  }

  // Direct registration bypass (fallback if user chooses instant signup)
  async function onDirectSubmit(data) {
    setServerError("");
    try {
      const result = await registerUser(data.name, data.email, data.password);
      login(result.user, result.token);
      toast.success("Account registered successfully!", "Welcome!");
      router.push("/dashboard");
    } catch (error) {
      if (error instanceof ApiError) {
        setServerError(error.message);
      } else {
        setServerError("Something went wrong. Please try again.");
      }
    }
  }

  return (
    <Card className="w-full max-w-md shadow-lg border-primary/20">
      <CardHeader className="text-center pb-4">
        <div className="flex justify-center mb-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
            <ShieldCheck className="h-6 w-6" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
          Create Bank Account
        </CardTitle>
        <CardDescription className="text-xs">
          {step === 1
            ? "Open your double-entry ledger account with verified Gmail credentials."
            : "Enter the 6-digit verification code sent to your email."}
        </CardDescription>
      </CardHeader>

      {serverError && (
        <div className="mx-6 mb-2 rounded-md bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive flex items-start gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{serverError}</span>
        </div>
      )}


      {step === 1 ? (
        /* STEP 1: Registration Form Details */
        <form onSubmit={handleSubmit(onDirectSubmit)}>
          <CardContent className="space-y-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="e.g. John Doe"
                  className="pl-9"
                  {...registerField("name")}
                />
              </div>
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Gmail / Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@gmail.com"
                  className="pl-9"
                  {...registerField("email")}
                />
              </div>
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimum 6 characters"
                  className="pl-9"
                  {...registerField("password")}
                />
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-2.5 pt-2">
            {/* Primary Action: Verify with Gmail OTP */}
            <Button
              type="button"
              onClick={handleSendVerificationOtp}
              disabled={isSendingOtp}
              className="w-full gap-2 font-semibold"
            >
              {isSendingOtp && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{isSendingOtp ? "Sending Code..." : "Verify with Gmail & Register"}</span>
              {!isSendingOtp && <ArrowRight className="h-4 w-4" />}
            </Button>

            {/* Direct Register Option */}
            <Button
              type="submit"
              variant="outline"
              size="sm"
              disabled={isSubmitting}
              className="w-full text-xs text-muted-foreground"
            >
              {isSubmitting ? "Registering..." : "Direct Register (Skip OTP)"}
            </Button>

            <div className="flex items-center justify-between w-full text-xs text-muted-foreground pt-3 border-t">
              <span>Already have an account?</span>
              <Link href="/login" className="text-primary hover:underline font-semibold">
                Sign In →
              </Link>
            </div>
          </CardFooter>
        </form>
      ) : (
        /* STEP 2: Email OTP Verification Step */
        <form onSubmit={handleCompleteRegistrationWithOtp}>
          <CardContent className="space-y-4">
            <div className="rounded-md bg-muted/60 p-2.5 text-xs flex items-center justify-between">
              <span className="text-muted-foreground truncate">
                Code sent to: <strong>{getValues("email")}</strong>
              </span>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-primary hover:underline text-[11px] font-medium shrink-0 ml-2"
              >
                Change
              </button>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="otpCode">6-Digit Verification Code</Label>
                <button
                  type="button"
                  onClick={handleSendVerificationOtp}
                  disabled={isSendingOtp}
                  className="text-[11px] text-primary hover:underline"
                >
                  Resend Code
                </button>
              </div>
              <div className="relative">
                <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="otpCode"
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  className="pl-9 font-mono tracking-widest text-center text-lg font-bold"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  disabled={isVerifying}
                  required
                  autoFocus
                />
              </div>
              <p className="text-[11px] text-muted-foreground text-center">
                Enter the one-time code sent to your email to verify ownership.
              </p>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-2.5 pt-2">
            <Button
              type="submit"
              disabled={isVerifying || otpCode.trim().length !== 6}
              className="w-full gap-2"
            >
              {isVerifying && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{isVerifying ? "Verifying..." : "Confirm & Create Account"}</span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setStep(1)}
              disabled={isVerifying}
              className="w-full text-xs gap-1 text-muted-foreground"
            >
              <ArrowLeft className="h-3 w-3" />
              <span>Back to details</span>
            </Button>
          </CardFooter>
        </form>
      )}
    </Card>
  );
}
