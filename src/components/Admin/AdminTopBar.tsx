"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Clock, 
  Shield, 
  User, 
  Calendar, 
  Plus, 
  LogOut,
  ChevronRight,
  Activity,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminTopBarProps {
  onLogout?: () => void;
}

export default function AdminTopBar({ onLogout }: AdminTopBarProps) {
  const pathname = usePathname();
  const [role, setRole] = useState<string>("admin");
  const [staffName, setStaffName] = useState<string>("");
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedRole = localStorage.getItem("admin_role") || "admin";
      const storedName = localStorage.getItem("admin_name");
      const normalizedName = (storedName && storedName !== "Clinic Staff")
        ? storedName
        : (storedRole === "receptionist" ? "Front Desk" : "Doctor");
      setRole(storedRole);
      setStaffName(normalizedName);
      if (!storedName || storedName === "Clinic Staff") {
        localStorage.setItem("admin_name", normalizedName);
      }
    }

    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString("en-IN", {
          weekday: "short",
          day: "numeric",
          month: "short",
          year: "numeric",
        }) + " • " + now.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit"
        })
      );
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const getPageTitle = () => {
    if (pathname.includes("/admin/appointments")) return "Appointments & Patient Queue";
    if (pathname.includes("/admin/patients")) return "Registered Patients Directory";
    if (pathname.includes("/admin/sessions")) return "Session Check-in & Therapy Log";
    if (pathname.includes("/admin/payments")) return "Financial Ledger & Collections";
    if (pathname.includes("/admin/analytics")) return "Clinic Performance Analytics";
    return "Executive Clinic Dashboard";
  };

  const isReceptionist = role === "receptionist";

  return (
    <header className="hidden md:flex items-center justify-between px-6 py-3.5 bg-card/80 backdrop-blur-md border-b border-border/70 sticky top-0 z-30 shadow-2xs">
      {/* Left: Breadcrumbs & Page Context */}
      <div className="flex items-center gap-2 text-xs">
        <span className="font-semibold text-muted-foreground hover:text-foreground transition-colors">
          Adaptus
        </span>
        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60" />
        <span className="font-medium text-muted-foreground">Admin Portal</span>
        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60" />
        <span className="font-bold text-foreground text-sm flex items-center gap-1.5">
          {getPageTitle()}
        </span>
      </div>

      {/* Right: Clock, Live Status, Staff Badge & Actions */}
      <div className="flex items-center gap-3">
        {/* Live Clinic Clock */}
        <div className="hidden lg:flex items-center gap-1.5 text-muted-foreground text-xs font-medium">
          <Clock className="w-3.5 h-3.5 text-teal-600" />
          <span className="tabular-nums">{currentTime || "Live Clinic Time"}</span>
        </div>

        {/* Live Status Pill */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 text-xs font-semibold border border-emerald-500/20">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Live Desk Active</span>
        </div>

        {/* Staff Role Badge */}
        <div className="flex items-center gap-2 pl-2 border-l border-border/70">
          <div className="w-7 h-7 rounded-full bg-teal-500/15 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold text-xs">
            {isReceptionist ? "R" : "Dr"}
          </div>
          <div className="text-left leading-tight hidden sm:block">
            <span className="text-xs font-bold text-foreground block truncate max-w-[120px]">
              {(staffName && staffName !== "Clinic Staff") ? staffName : (isReceptionist ? "Front Desk" : "Doctor")}
            </span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
              {isReceptionist ? "Receptionist" : "Doctor"}
            </span>
          </div>
        </div>

        {/* Logout */}
        {onLogout && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onLogout}
            className="h-8 px-2.5 text-xs text-muted-foreground hover:text-rose-600 hover:bg-rose-50/50 gap-1.5"
            title="Sign out of Admin Session"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Logout</span>
          </Button>
        )}
      </div>
    </header>
  );
}
