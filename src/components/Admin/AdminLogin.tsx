"use client";

import { useState, useEffect } from "react";
import { loginAdmin, verifyOtp } from "@/services/bookingService";
import { useToast } from "@/hooks/use-toast";
import { 
  Mail, 
  Lock, 
  ArrowRight, 
  ArrowLeft,
  Loader2, 
  CheckCircle2, 
  ShieldCheck, 
  Timer, 
  RefreshCw,
  KeyRound,
  Eye,
  EyeOff,
  LockKeyhole,
  UserCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import Aurora from "@/components/ui/Aurora";

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
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Live WebGL Aurora + Clinical Grid Backdrop */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(13,148,136,0.28),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_rgba(16,185,129,0.22),_transparent_55%)]" />
        <Aurora
          colorStops={["#0d9488", "#10b981", "#0f766e", "#0284c7"]}
          amplitude={1.1}
          blend={0.65}
          speed={0.55}
          opacity={0.75}
          layers={2}
          className="w-full h-full"
        />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255, 255, 255, 0.18) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="absolute -top-40 -right-32 w-[28rem] h-[28rem] rounded-full bg-teal-400/15 blur-3xl" />
        <div className="absolute -bottom-40 -left-32 w-[28rem] h-[28rem] rounded-full bg-emerald-400/15 blur-3xl" />
      </div>

      <div className="w-full max-w-4xl bg-white/95 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl shadow-black/40 overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative z-10">
        {/* Left Brand & Security Panel */}
        <div className="lg:col-span-5 bg-gradient-to-br from-teal-950 via-teal-900 to-emerald-950 text-white p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-emerald-400/15 blur-2xl" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-teal-300/10 blur-2xl" />
          </div>

          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md flex items-center justify-center p-2 shadow-inner">
                <img
                  src="/adaptus.png"
                  alt="Adaptus Clinic"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-white leading-none">
                  Adaptus Clinic
                </h1>
                <span className="text-[11px] font-medium text-teal-200/80 tracking-wide uppercase">
                  Admin Portal
                </span>
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight">
                Clinical Operations &amp; Care Management
              </h2>
              <p className="text-xs sm:text-sm text-teal-100/80 leading-relaxed">
                Authorized access for doctors, physiotherapists, and front-desk coordinators.
              </p>
            </div>
          </div>

          <div className="relative z-10 space-y-3.5 pt-8 mt-8 border-t border-white/10">
            <div className="flex items-center gap-3 text-xs text-teal-50/90">
              <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
              </div>
              <span>Two-factor email verification required</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-teal-50/90">
              <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                <LockKeyhole className="w-3.5 h-3.5 text-emerald-300" />
              </div>
              <span>Encrypted HttpOnly session cookies</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-teal-50/90">
              <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                <UserCheck className="w-3.5 h-3.5 text-emerald-300" />
              </div>
              <span>Role-scoped access for clinic staff</span>
            </div>
          </div>
        </div>

        {/* Right Authentication Form Panel */}
        <div className="lg:col-span-7 p-7 sm:p-10 flex flex-col justify-center bg-white">
          <div className="max-w-sm w-full mx-auto space-y-6">
            {/* Step Indicator */}
            <div className="flex items-center gap-2 text-[11px] font-semibold">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-colors ${
                  step === "credentials"
                    ? "bg-teal-50 border-teal-200 text-teal-800"
                    : "bg-emerald-50 border-emerald-200 text-emerald-700"
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px]">
                  {step === "otp" ? "✓" : "1"}
                </span>
                Credentials
              </span>
              <div className="h-px flex-1 bg-slate-200" />
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-colors ${
                  step === "otp"
                    ? "bg-teal-50 border-teal-200 text-teal-800"
                    : "bg-slate-50 border-slate-200 text-slate-400"
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                    step === "otp"
                      ? "bg-teal-600 text-white"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  2
                </span>
                2FA Code
              </span>
            </div>

            {step === "credentials" ? (
              /* STEP 1: CREDENTIALS */
              <div className="space-y-5">
                <div className="space-y-1">
                  <h3 className="text-xl font-bold tracking-tight text-slate-900">
                    Sign in to your account
                  </h3>
                  <p className="text-xs text-slate-500">
                    Enter your staff email and password to receive a one-time code.
                  </p>
                </div>

                <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="email"
                      className="text-xs font-semibold text-slate-700 block"
                    >
                      Staff Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="doctor@adaptus.in"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 h-11 text-sm bg-slate-50/70 border-slate-200 focus-visible:bg-white focus-visible:ring-teal-600 rounded-xl"
                        disabled={loading}
                        autoComplete="email"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="password"
                      className="text-xs font-semibold text-slate-700 block"
                    >
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10 h-11 text-sm bg-slate-50/70 border-slate-200 focus-visible:bg-white focus-visible:ring-teal-600 rounded-xl"
                        disabled={loading}
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading || !email || !password}
                    className="w-full h-11 gap-2 text-sm font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-xl transition shadow-sm shadow-teal-600/15 mt-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Verifying Credentials...
                      </>
                    ) : (
                      <>
                        Continue to Verification
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              </div>
            ) : (
              /* STEP 2: 2FA OTP VERIFICATION */
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 text-teal-700 flex items-center justify-center mb-2">
                    <KeyRound className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-bold tracking-tight text-slate-900">
                    Enter verification code
                  </h3>
                  <p className="text-xs text-slate-500">
                    We sent a 6-digit security code to{" "}
                    <span className="font-semibold text-slate-800">{email}</span>.
                  </p>
                </div>

                <form onSubmit={handleVerifyOtp} className="space-y-5">
                  <div className="flex justify-center py-1">
                    <InputOTP
                      maxLength={6}
                      value={otp}
                      onChange={setOtp}
                      disabled={loading}
                      onComplete={() => handleVerifyOtp()}
                    >
                      <InputOTPGroup className="gap-2">
                        <InputOTPSlot index={0} className="w-11 h-12 text-lg font-bold border-slate-200 rounded-xl bg-slate-50/70" />
                        <InputOTPSlot index={1} className="w-11 h-12 text-lg font-bold border-slate-200 rounded-xl bg-slate-50/70" />
                        <InputOTPSlot index={2} className="w-11 h-12 text-lg font-bold border-slate-200 rounded-xl bg-slate-50/70" />
                        <InputOTPSlot index={3} className="w-11 h-12 text-lg font-bold border-slate-200 rounded-xl bg-slate-50/70" />
                        <InputOTPSlot index={4} className="w-11 h-12 text-lg font-bold border-slate-200 rounded-xl bg-slate-50/70" />
                        <InputOTPSlot index={5} className="w-11 h-12 text-lg font-bold border-slate-200 rounded-xl bg-slate-50/70" />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading || otp.length !== 6}
                    className="w-full h-11 gap-2 text-sm font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-xl transition shadow-sm shadow-teal-600/15"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Authorizing Session...
                      </>
                    ) : (
                      <>
                        Access Admin Portal
                        <CheckCircle2 className="h-4 w-4" />
                      </>
                    )}
                  </Button>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setStep("credentials");
                        setOtp("");
                      }}
                      className="text-slate-500 hover:text-slate-800 font-medium inline-flex items-center gap-1"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      Change email
                    </button>

                    <div className="flex items-center gap-2">
                      {countdown > 0 ? (
                        <span className="text-slate-400 inline-flex items-center gap-1">
                          <Timer className="h-3.5 w-3.5" />
                          {countdown}s
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={loading}
                          onClick={handleCredentialsSubmit}
                          className="text-teal-700 hover:text-teal-800 hover:underline font-semibold inline-flex items-center gap-1 disabled:opacity-50"
                        >
                          <RefreshCw className="h-3 w-3" />
                          Resend code
                        </button>
                      )}
                    </div>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
