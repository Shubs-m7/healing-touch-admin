"use client";

import { useState, useEffect } from "react";
import { loginAdmin, verifyOtp } from "@/services/bookingService";
import { useToast } from "@/hooks/use-toast";
import { 
  Mail, 
  Lock, 
  ArrowRight, 
  Loader2, 
  CheckCircle2, 
  ShieldAlert, 
  Timer, 
  RefreshCw,
  Stethoscope,
  KeyRound
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

interface AdminLoginProps {
  onLoginSuccess: (token: string) => void;
}

export default function AdminLogin({ onLoginSuccess }: AdminLoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const { toast } = useToast();

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("expired")) {
        toast({
          title: "Session Expired",
          description: "Your session has expired. Please sign in again to continue.",
          variant: "destructive",
        });
      }
    }
  }, []);

  const handleCredentialsSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Missing fields",
        description: "Please fill in both email and password.",
        variant: "destructive",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await loginAdmin(email, password);
      setStep("otp");
      setCountdown(60);
      
      toast({
        title: "Credentials Verified",
        description: "A verification code has been sent to your registered email address.",
      });
    } catch (error: any) {
      toast({
        title: "Authentication Failed",
        description: error.message || "Invalid email or password.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (otp.length !== 6) {
      toast({
        title: "Incomplete Code",
        description: "Please enter the full 6-digit OTP code.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await verifyOtp(email, otp);
      if (res.success) {
        const roleTitle = res.role === "receptionist" ? "Receptionist" : "Administrator";
        toast({
          title: "Login Successful",
          description: `Welcome back, ${res.name || roleTitle}!`,
        });
        
        // Save non-sensitive UI display metadata only (JWT is stored in HttpOnly cookie)
        localStorage.setItem("admin_email", email);
        localStorage.setItem("admin_role", res.role || "admin");
        const finalName = (res.name && res.name !== "Clinic Staff") ? res.name : (res.role === "receptionist" ? "Front Desk" : "Doctor");
        localStorage.setItem("admin_name", finalName);
        
        onLoginSuccess("cookie");
      }
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid OTP code entered. Please try again.",
        variant: "destructive",
      });
      setOtp("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background Soft Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-teal-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      <div className="w-full max-w-md bg-card/95 backdrop-blur-xl border border-border/80 rounded-2xl shadow-xl p-8 relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-700 mx-auto flex items-center justify-center shadow-md text-white">
            <Stethoscope className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-foreground">Adaptus</h2>
          <p className="text-xs text-muted-foreground font-medium">Doctor & Staff Secure Administration Portal</p>
        </div>

        {step === "credentials" ? (
          /* STEP 1: CREDENTIALS (EMAIL / PASSWORD) */
          <form onSubmit={handleCredentialsSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Staff Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@clinic.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-10 text-xs"
                  disabled={loading}
                  autoComplete="email"
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter staff password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-10 text-xs"
                  disabled={loading}
                  autoComplete="current-password"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full h-10 gap-2 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white transition mt-2 shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  Verify Credentials
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        ) : (
          /* STEP 2: 2FA OTP VERIFICATION */
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div className="space-y-3 text-center">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-700 flex items-center justify-center mx-auto mb-2">
                <KeyRound className="h-6 w-6" />
              </div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                Two-Factor Verification Code
              </label>
              
              <div className="flex justify-center py-2">
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={setOtp}
                  disabled={loading}
                  onComplete={() => handleVerifyOtp()}
                >
                  <InputOTPGroup className="gap-1.5">
                    <InputOTPSlot index={0} className="w-10 h-11 text-base font-bold border rounded-lg bg-background" />
                    <InputOTPSlot index={1} className="w-10 h-11 text-base font-bold border rounded-lg bg-background" />
                    <InputOTPSlot index={2} className="w-10 h-11 text-base font-bold border rounded-lg bg-background" />
                    <InputOTPSlot index={3} className="w-10 h-11 text-base font-bold border rounded-lg bg-background" />
                    <InputOTPSlot index={4} className="w-10 h-11 text-base font-bold border rounded-lg bg-background" />
                    <InputOTPSlot index={5} className="w-10 h-11 text-base font-bold border rounded-lg bg-background" />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <div className="text-xs text-muted-foreground flex flex-col items-center gap-1">
                <span>Code sent to: <strong className="text-foreground">{email}</strong></span>
                <button
                  type="button"
                  onClick={() => {
                    setStep("credentials");
                    setOtp("");
                  }}
                  className="text-teal-700 hover:underline font-semibold mt-1 text-[11px]"
                >
                  Go Back & Change Email
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full h-10 gap-2 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white transition shadow-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verifying OTP...
                  </>
                ) : (
                  <>
                    Access Admin Portal
                    <CheckCircle2 className="h-4 w-4" />
                  </>
                )}
              </Button>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
                  <Timer className="h-3.5 w-3.5" />
                  {countdown > 0 ? `Resend in ${countdown}s` : "Ready to resend"}
                </span>

                <button
                  type="button"
                  disabled={countdown > 0 || loading}
                  onClick={handleCredentialsSubmit}
                  className="text-teal-700 hover:underline font-semibold flex items-center gap-1 disabled:opacity-50 disabled:no-underline text-[11px]"
                >
                  <RefreshCw className="h-3 w-3" />
                  Resend Code
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
