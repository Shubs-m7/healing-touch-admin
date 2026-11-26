"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "@/components/Admin/Sidebar";
import AdminTopBar from "@/components/Admin/AdminTopBar";
import { Loader2 } from "lucide-react";
import { getAuthMe, logoutSession } from "@/services/authSessionService";

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) {
      return;
    }

    let active = true;
    setIsAuthenticated(null);
    const verifySession = async () => {
      const user = await getAuthMe();
      if (!active) return;
      if (!user || (user.role !== "admin" && user.role !== "doctor" && user.role !== "receptionist")) {
        router.push("/admin/login");
        return;
      }
      localStorage.setItem("admin_role", user.role);
      if (user.name) localStorage.setItem("admin_name", user.name);
      if (user.email) localStorage.setItem("admin_email", user.email);
      if (user.role === "receptionist" && pathname !== "/admin/appointments" && pathname !== "/admin/sessions") {
        router.replace("/admin/appointments");
        return;
      }
      setIsAuthenticated(true);
    };
    verifySession();
    return () => { active = false; };
  }, [router, pathname, isLoginPage]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    await logoutSession();
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_email");
    localStorage.removeItem("admin_role");
    localStorage.removeItem("admin_name");
    setIsAuthenticated(false);
    router.push("/admin/login");
  };

  if (isAuthenticated !== true) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[hsl(var(--background))] gap-3">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground font-medium">
          {isAuthenticated === null ? "Verifying admin session..." : "Redirecting to login..."}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        onLogout={handleLogout}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminTopBar onLogout={handleLogout} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 transition-all duration-300 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
