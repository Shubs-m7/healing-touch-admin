"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminLogin from "@/components/Admin/AdminLogin";
import { Loader2 } from "lucide-react";
import { getAuthMe } from "@/services/authSessionService";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("expired")) {
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_email");
        localStorage.removeItem("admin_role");
        localStorage.removeItem("admin_name");
        setLoading(false);
        return;
      }
    }

    // Check active HttpOnly cookie session
    let active = true;
    getAuthMe().then((user) => {
      if (!active) return;
      if (user && (user.role === "admin" || user.role === "receptionist")) {
        if (user.role === "receptionist") {
          router.push("/admin/appointments");
        } else {
          router.push("/admin/dashboard");
        }
      } else {
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[hsl(var(--background))] gap-3">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground font-medium">Redirecting to clinic portal...</p>
      </div>
    );
  }

  return (
    <AdminLogin 
      onLoginSuccess={() => {
        const role = localStorage.getItem("admin_role");
        if (role === "receptionist") {
          router.push("/admin/appointments");
        } else {
          router.push("/admin/dashboard");
        }
      }} 
    />
  );
}
