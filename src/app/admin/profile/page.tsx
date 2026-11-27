"use client";

import React, { useEffect, useState } from "react";
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Stethoscope,
  ShieldCheck,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  Save,
  Loader2,
  CheckCircle2,
  Timer,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { toast } from "sonner";
import {
  AdminProfile,
  confirmPasswordChange,
  getAdminProfile,
  requestPasswordChangeOtp,
  updateAdminProfile,
} from "@/services/authSessionService";

export default function AdminProfilePage() {
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);

  const [profile, setProfile] = useState<AdminProfile>({
    email: "",
    name: "",
    phone: "",
    title: "",
    specialization: "",
    role: "admin",
  });

  // 2FA Password Change state
  const [pwdStep, setPwdStep] = useState<"current" | "otp">("current");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    getAdminProfile()
      .then((data) => {
        setProfile(data);
        if (data.name) {
          localStorage.setItem("admin_name", data.name);
        }
      })
      .catch((err) => {
        toast.error(err.message || "Could not load profile");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile.name.trim() || profile.name.trim().length < 2) {
      toast.error("Please enter a valid name (at least 2 characters).");
      return;
    }

    setSavingProfile(true);
    try {
      const updated = await updateAdminProfile({
        name: profile.name,
        phone: profile.phone,
        title: profile.title,
        specialization: profile.specialization,
      });
      setProfile(updated);
      localStorage.setItem("admin_name", updated.name);
      window.dispatchEvent(new Event("admin-profile-updated"));
      toast.success("Profile updated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentPassword) {
      toast.error("Please enter your current password.");
      return;
    }

    setPwdLoading(true);
    try {
      const msg = await requestPasswordChangeOtp(currentPassword);
      setPwdStep("otp");
      setCountdown(60);
      toast.success(msg || "2FA verification code sent to your email.");
    } catch (err: any) {
      toast.error(err.message || "Failed to send 2FA code");
    } finally {
      setPwdLoading(false);
    }
  };

  const handleConfirmPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error("Please enter the 6-digit 2FA verification code.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New password and confirmation do not match.");
      return;
    }

    setPwdLoading(true);
    try {
      const msg = await confirmPasswordChange(otp, newPassword);
      toast.success(msg || "Password changed successfully!");
      setPwdStep("current");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setOtp("");
      setCountdown(0);
    } catch (err: any) {
      toast.error(err.message || "Failed to update password");
    } finally {
      setPwdLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p className="text-xs text-muted-foreground font-semibold">Loading staff profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-primary/10 via-secondary/5 to-transparent border border-border rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center text-xl font-black shadow-sm shrink-0">
            {(profile.name || "Dr").slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/15 text-primary text-[11px] font-bold uppercase tracking-wider mb-1">
              <ShieldCheck className="h-3 w-3" />
              {profile.role}
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
              {profile.name || "Staff Profile"}
            </h1>
            <p className="text-xs text-muted-foreground">{profile.email}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Profile Details (7 cols) */}
        <form
          onSubmit={handleSaveProfile}
          className="lg:col-span-7 bg-card border border-border rounded-2xl p-6 shadow-xs space-y-5"
        >
          <div className="border-b border-border/60 pb-3">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Profile Information
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Update your display name, clinical title, phone, and specialization.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-bold text-foreground">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  placeholder="e.g. Dr. Shubham Sharma"
                  className="pl-9 h-10 text-xs font-semibold"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={profile.email}
                  disabled
                  className="pl-9 h-10 text-xs bg-muted/50 text-muted-foreground"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="pl-9 h-10 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Professional Title</Label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={profile.title}
                  onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                  placeholder="e.g. Lead Physiotherapist"
                  className="pl-9 h-10 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Specialization</Label>
              <div className="relative">
                <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={profile.specialization}
                  onChange={(e) => setProfile({ ...profile, specialization: e.target.value })}
                  placeholder="e.g. Spine & Sports Rehab"
                  className="pl-9 h-10 text-xs"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              type="submit"
              disabled={savingProfile}
              className="gap-2 bg-primary hover:bg-primary/90 text-white rounded-xl h-10 px-5 text-xs font-bold shadow-xs"
            >
              {savingProfile ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Profile
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Right: 2FA-Protected Password Change (5 cols) */}
        <div className="lg:col-span-5 bg-card border border-border rounded-2xl p-6 shadow-xs space-y-5">
          <div className="border-b border-border/60 pb-3">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Lock className="h-4 w-4 text-primary" />
              Change Password (2FA)
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Email two-factor verification is required before updating your password.
            </p>
          </div>

          {pwdStep === "current" ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Current Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type={showCurrentPwd ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter your current password"
                    className="pl-9 pr-9 h-10 text-xs"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPwd((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showCurrentPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={pwdLoading || !currentPassword}
                className="w-full gap-2 bg-primary hover:bg-primary/90 text-white rounded-xl h-10 text-xs font-bold shadow-xs"
              >
                {pwdLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending 2FA Code...
                  </>
                ) : (
                  <>
                    <KeyRound className="h-4 w-4" />
                    Send 2FA Verification Code
                  </>
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleConfirmPasswordChange} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-foreground block">
                  6-Digit Email 2FA Code
                </Label>
                <div className="flex justify-center py-1">
                  <InputOTP maxLength={6} value={otp} onChange={setOtp} disabled={pwdLoading}>
                    <InputOTPGroup className="gap-1.5">
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <InputOTPSlot
                          key={i}
                          index={i}
                          className="w-10 h-11 text-base font-bold border rounded-lg bg-background"
                        />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type={showNewPwd ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="pl-9 pr-9 h-10 text-xs"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPwd((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showNewPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Confirm New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type={showNewPwd ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="pl-9 h-10 text-xs"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={pwdLoading || otp.length !== 6 || newPassword.length < 8}
                className="w-full gap-2 bg-primary hover:bg-primary/90 text-white rounded-xl h-10 text-xs font-bold shadow-xs"
              >
                {pwdLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Updating Password...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Verify 2FA &amp; Update Password
                  </>
                )}
              </Button>

              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-border/50">
                <button
                  type="button"
                  onClick={() => {
                    setPwdStep("current");
                    setOtp("");
                  }}
                  className="text-muted-foreground hover:text-foreground font-semibold"
                >
                  Cancel
                </button>
                {countdown > 0 ? (
                  <span className="text-muted-foreground inline-flex items-center gap-1">
                    <Timer className="h-3 w-3" /> Resend in {countdown}s
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleRequestOtp()}
                    disabled={pwdLoading}
                    className="text-primary hover:underline font-semibold inline-flex items-center gap-1"
                  >
                    <RefreshCw className="h-3 w-3" /> Resend Code
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
