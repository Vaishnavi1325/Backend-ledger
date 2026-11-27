"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loginSchema } from "@/lib/validators/auth.schema";
import { loginUser, sendOtp, verifyOtpLogin } from "@/lib/api/auth";
import { useAuth } from "@/hooks/useAuth";
import { ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ForgotPasswordModal } from "./ForgotPasswordModal";
import {
  Mail,
  Lock,
  KeyRound,
  ArrowRight,
  Loader2,
  RefreshCw,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

export function LoginForm() {
  const [authMode, setAuthMode] = useState("password"); // "password" or "otp"
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [serverError, setServerError] = useState("");
  const [serverSuccess, setServerSuccess] = useState("");

  // OTP Login state
  const [otpEmail, setOtpEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpStep, setOtpStep] = useState(1); // 1 = Enter Email, 2 = Enter OTP
  const [isOtpLoading, setIsOtpLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const router = useRouter();
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const enteredEmail = watch("email") || otpEmail;

  // Resend cooldown timer
  useState(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  });

  // Standard Password Sign In
  async function onSubmitPassword(data) {
    setServerError("");
    setServerSuccess("");
    try {
      const result = await loginUser(data.email, data.password);
      login(result.user, result.token);
      router.push("/dashboard");
    } catch (error) {
      if (error instanceof ApiError) {
        setServerError(error.message);
      } else {
        setServerError("Something went wrong. Please try again.");
      }
    }
  }

  // OTP Step 1: Send Login OTP to Gmail
  async function handleSendLoginOtp(e) {
    e.preventDefault();
    setServerError("");
    setServerSuccess("");

    const trimmed = otpEmail.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setServerError("Please enter a valid email address.");
      return;
    }

    setIsOtpLoading(true);
    try {
      const res = await sendOtp(trimmed, "LOGIN");
      setIsOtpLoading(false);
      setOtpStep(2);
      setCooldown(60);
      setServerSuccess(`Verification code dispatched to ${trimmed}! Please check your email inbox.`);
    } catch (err) {
      setIsOtpLoading(false);
      setServerError(err.message || "Failed to send verification code.");
    }
  }

  // OTP Step 2: Verify OTP and Sign In
  async function handleVerifyOtpLogin(e) {
    e.preventDefault();
    setServerError("");
    setServerSuccess("");

    if (!otpCode || otpCode.length !== 6) {
      setServerError("Please enter the 6-digit numeric verification code.");
      return;
    }

    setIsOtpLoading(true);
    try {
      const result = await verifyOtpLogin(otpEmail.trim().toLowerCase(), otpCode.trim());
      login(result.user, result.token);
      router.push("/dashboard");
    } catch (err) {
      setIsOtpLoading(false);
      setServerError(err.message || "Verification code is invalid or expired.");
    }
  }

  return (
    <Card className="w-full max-w-md shadow-md border-border/60">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">Welcome Back</CardTitle>
        <CardDescription className="text-xs">
          Sign in to your LedgerBank double-entry core banking account
        </CardDescription>

        {/* Auth Method Switcher Tabs */}
        <div className="mt-4 grid grid-cols-2 p-1 bg-muted rounded-lg text-xs font-medium">
          <button
            type="button"
            onClick={() => {
              setAuthMode("password");
              setServerError("");
              setServerSuccess("");
            }}
            className={`py-1.5 rounded-md transition-all ${
              authMode === "password"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Password Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode("otp");
              setServerError("");
              setServerSuccess("");
            }}
            className={`py-1.5 rounded-md transition-all flex items-center justify-center gap-1.5 ${
              authMode === "otp"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sparkles className="h-3 w-3 text-amber-500" />
            <span>Gmail OTP</span>
          </button>
        </div>
      </CardHeader>

      {authMode === "password" ? (
        /* MODE A: Standard Password Login */
        <form onSubmit={handleSubmit(onSubmitPassword)}>
          <CardContent className="space-y-4">
            {serverError && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive">
                {serverError}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="pl-9 text-sm"
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="text-[11px] text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-medium">
                  Password
                </Label>
                <button
                  type="button"
                  onClick={() => setForgotModalOpen(true)}
                  className="text-[11px] text-primary hover:underline font-medium cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-9 text-sm"
                  {...register("password")}
                />
              </div>
              {errors.password && (
                <p className="text-[11px] text-destructive">{errors.password.message}</p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 pt-2">
            <Button type="submit" className="w-full text-xs" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>

            <div className="flex items-center justify-between w-full text-xs text-muted-foreground pt-1">
              <span>Don&apos;t have an account?</span>
              <Link href="/register" className="text-primary hover:underline font-medium">
                Create Account
              </Link>
            </div>
          </CardFooter>
        </form>
      ) : (
        /* MODE B: Passwordless Gmail OTP Login */
        <div className="space-y-4">
          <CardContent className="space-y-4">
            {serverError && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive">
                {serverError}
              </div>
            )}

            {serverSuccess && (
              <div className="rounded-md bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-700 dark:text-emerald-300">
                {serverSuccess}
              </div>
            )}

            {otpStep === 1 ? (
              <form onSubmit={handleSendLoginOtp} className="space-y-3.5">
                <div className="space-y-1.5">
                  <Label htmlFor="otpLoginEmail" className="text-xs font-medium">
                    Registered Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="otpLoginEmail"
                      type="email"
                      placeholder="you@example.com"
                      className="pl-9 text-sm"
                      value={otpEmail}
                      onChange={(e) => setOtpEmail(e.target.value)}
                      disabled={isOtpLoading}
                      required
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    We will send a 6-digit one-time sign-in code to your Gmail/email inbox.
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full text-xs gap-1.5"
                  disabled={isOtpLoading || !otpEmail.trim()}
                >
                  {isOtpLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <>
                      <span>Send Sign-In Code</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtpLogin} className="space-y-3.5">
                <div className="rounded-md bg-muted/60 p-2.5 text-xs flex items-center justify-between border">
                  <span className="truncate mr-2 font-mono">{otpEmail}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpStep(1);
                      setServerError("");
                    }}
                    className="text-[11px] text-primary hover:underline shrink-0"
                  >
                    Change
                  </button>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="loginOtpCode" className="text-xs font-medium">
                      Enter 6-Digit Code
                    </Label>
                    <button
                      type="button"
                      onClick={handleSendLoginOtp}
                      disabled={cooldown > 0 || isOtpLoading}
                      className="text-[11px] text-primary hover:underline disabled:opacity-50"
                    >
                      {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend Code"}
                    </button>
                  </div>
                  <Input
                    id="loginOtpCode"
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    className="font-mono text-center tracking-widest text-lg font-bold h-11"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    disabled={isOtpLoading}
                    required
                    autoFocus
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full text-xs"
                  disabled={isOtpLoading || otpCode.length !== 6}
                >
                  {isOtpLoading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                      Verifying...
                    </>
                  ) : (
                    "Verify & Sign In"
                  )}
                </Button>
              </form>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-2 pt-0">
            <div className="flex items-center justify-between w-full text-xs text-muted-foreground pt-1">
              <span>Don&apos;t have an account?</span>
              <Link href="/register" className="text-primary hover:underline font-medium">
                Create Account
              </Link>
            </div>
          </CardFooter>
        </div>
      )}

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        open={forgotModalOpen}
        onOpenChange={setForgotModalOpen}
        defaultEmail={enteredEmail}
      />
    </Card>
  );
}
