"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Activity,
  CreditCard,
  BarChart3,
  Calendar,
  LogOut,
  Stethoscope,
  ChevronRight,
  ChevronLeft,
  Globe,
  Tags,
  Palette,
  Grid2X2,
  X,
  Layers
} from "lucide-react";

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  onLogout?: () => void;
}

// 9-dot Waffle / App Launcher Menu Icon
function WaffleIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="5" cy="5" r="2.2" />
      <circle cx="12" cy="5" r="2.2" />
      <circle cx="19" cy="5" r="2.2" />
      <circle cx="5" cy="12" r="2.2" />
      <circle cx="12" cy="12" r="2.2" />
      <circle cx="19" cy="12" r="2.2" />
      <circle cx="5" cy="19" r="2.2" />
      <circle cx="12" cy="19" r="2.2" />
      <circle cx="19" cy="19" r="2.2" />
    </svg>
  );
}

export default function Sidebar({
  collapsed,
  setCollapsed,
  onLogout,
}: SidebarProps) {
  const pathname = usePathname();
  const [role, setRole] = useState<string>("admin");
  const [staffName, setStaffName] = useState<string>("");
  const [isWaffleOpen, setIsWaffleOpen] = useState(false);

  const isItemActive = (href: string) => {
    if (href === "/admin/dashboard") {
      return pathname === "/admin" || pathname === "/admin/dashboard";
    }
    return pathname.startsWith(href);
  };

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
  }, []);

  const isReceptionist = role === "receptionist";

  useEffect(() => {
    setIsWaffleOpen(false);
  }, [pathname]);

  const primaryMobileItems = isReceptionist
    ? [
        { href: "/admin/appointments", label: "Appointments", shortLabel: "Bookings", icon: Calendar },
        { href: "/admin/sessions", label: "Sessions", shortLabel: "Sessions", icon: Activity },
      ]
    : [
        { href: "/admin/dashboard", label: "Dashboard", shortLabel: "Home", icon: LayoutDashboard },
        { href: "/admin/appointments", label: "Appointments", shortLabel: "Bookings", icon: Calendar },
        { href: "/admin/patients", label: "Patients", shortLabel: "Patients", icon: Users },
        { href: "/admin/sessions", label: "Sessions", shortLabel: "Sessions", icon: Activity },
      ];

  // 9 Apps forming the 3x3 Waffle Grid (Clean, unified green icons with zero filled color backgrounds)
  const waffleApps = isReceptionist
    ? [
        { href: "/admin/appointments", label: "Bookings", shortLabel: "Bookings", icon: Calendar, category: "Desk" },
        { href: "/admin/sessions", label: "Sessions", shortLabel: "Sessions", icon: Activity, category: "Queue" },
      ]
    : [
        { href: "/admin/dashboard", label: "Dashboard", shortLabel: "Home", icon: LayoutDashboard, category: "Care" },
        { href: "/admin/appointments", label: "Bookings", shortLabel: "Bookings", icon: Calendar, category: "Desk" },
        { href: "/admin/patients", label: "Patients", shortLabel: "Patients", icon: Users, category: "Care" },
        { href: "/admin/sessions", label: "Sessions", shortLabel: "Sessions", icon: Activity, category: "Ops" },
        { href: "/admin/payments", label: "Payments", shortLabel: "Payments", icon: CreditCard, category: "Finance" },
        { href: "/admin/analytics", label: "Analytics", shortLabel: "Analytics", icon: BarChart3, category: "Insights" },
        { href: "/admin/content-master", label: "Website", shortLabel: "Content", icon: Globe, category: "Master" },
        { href: "/admin/pricing-master", label: "Pricing", shortLabel: "Pricing", icon: Tags, category: "Master" },
        { href: "/admin/theme-master", label: "Branding", shortLabel: "Theme", icon: Palette, category: "Master" },
      ];

  const isWaffleModuleActive = !isReceptionist && waffleApps.slice(4).some(app => isItemActive(app.href));

  const navSections = isReceptionist
    ? [
        {
          title: "DESK & QUEUE",
          items: [
            { href: "/admin/appointments", label: "Appointments", shortLabel: "Bookings", icon: Calendar },
            { href: "/admin/sessions", label: "Sessions", shortLabel: "Sessions", icon: Activity },
            { href: "/admin/profile", label: "My Profile", shortLabel: "Profile", icon: Users },
          ]
        }
      ]
    : [
        {
          title: "CLINICAL CARE",
          items: [
            { href: "/admin/dashboard", label: "Dashboard", shortLabel: "Home", icon: LayoutDashboard },
            { href: "/admin/appointments", label: "Appointments", shortLabel: "Bookings", icon: Calendar },
            { href: "/admin/patients", label: "Patients", shortLabel: "Patients", icon: Users },
          ]
        },
        {
          title: "OPERATIONS",
          items: [
            { href: "/admin/sessions", label: "Sessions", shortLabel: "Sessions", icon: Activity },
            { href: "/admin/payments", label: "Payments", shortLabel: "Payments", icon: CreditCard },
          ]
        },
        {
          title: "INSIGHTS",
          items: [
            { href: "/admin/analytics", label: "Analytics", shortLabel: "Analytics", icon: BarChart3 },
          ]
        },
        {
          title: "MASTER CONTROLS",
          items: [
            { href: "/admin/content-master", label: "Website Content", shortLabel: "Content", icon: Globe },
            { href: "/admin/pricing-master", label: "Pricing & Packages", shortLabel: "Pricing", icon: Tags },
            { href: "/admin/theme-master", label: "Theme & Branding", shortLabel: "Theme", icon: Palette },
            { href: "/admin/profile", label: "My Profile", shortLabel: "Profile", icon: Users },
          ]
        }
      ];

  const homeHref = isReceptionist ? "/admin/appointments" : "/admin/dashboard";

  return (
    <>
      {/* MOBILE TOP BRAND HEADER */}
      <header className="md:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-card/95 backdrop-blur-md border-b border-border/80 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center shadow-xs">
            <Stethoscope className="w-4 h-4" />
          </div>
          <div>
            <Link href={homeHref} className="text-base font-extrabold text-foreground tracking-tight block leading-none">
              Adaptus
            </Link>
            <span className="text-[10px] text-muted-foreground font-medium">Clinic Portal</span>
          </div>
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ml-1 ${
            isReceptionist 
              ? "bg-amber-500/10 text-amber-700 border border-amber-500/20" 
              : "bg-primary/10 text-primary border border-primary/20"
          }`}>
            {isReceptionist ? "Reception" : "Admin"}
          </span>
        </div>

        {onLogout && (
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors border border-rose-200/50"
          >
            <LogOut size={13} />
            <span>Logout</span>
          </button>
        )}
      </header>

      {/* DESKTOP SIDEBAR */}
      <aside
        className={`hidden md:flex transition-all duration-300 flex-col justify-between ${
          collapsed ? "w-16 p-2 items-center" : "w-48 p-2.5"
        } border-r border-border/70 bg-card/90 backdrop-blur-md min-h-screen shrink-0 sticky top-0 h-screen overflow-y-auto`}
      >
        <div className="w-full">
          {/* BRAND HEADER */}
          <div className="mb-4 pb-3 border-b border-border/60 w-full pt-1 flex items-center justify-between">
            {!collapsed ? (
              <>
                <div className="flex items-center gap-2 truncate">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-secondary text-white flex items-center justify-center shadow-xs shrink-0">
                    <Stethoscope className="w-4 h-4" />
                  </div>
                  <div className="leading-tight truncate">
                    <Link href={homeHref} className="text-sm font-black text-foreground tracking-tight hover:text-primary transition-colors">
                      Adaptus
                    </Link>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                        {isReceptionist ? "Reception" : "Clinic Desk"}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setCollapsed(true)}
                  className="p-1 rounded-lg hover:bg-muted/70 text-muted-foreground hover:text-foreground transition-colors shrink-0 ml-auto"
                  title="Collapse Sidebar"
                >
                  <ChevronLeft size={16} />
                </button>
              </>
            ) : (
              /* COLLAPSED STATE: Clean centered toggle button */
              <button
                onClick={() => setCollapsed(false)}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-600 to-emerald-700 text-white flex items-center justify-center shadow-xs mx-auto hover:opacity-90 transition-all group"
                title="Expand Sidebar"
              >
                <Stethoscope className="w-5 h-5 group-hover:hidden transition-all" />
                <ChevronRight className="w-5 h-5 hidden group-hover:block transition-all" />
              </button>
            )}
          </div>

          {/* GROUPED NAVIGATION */}
          <nav className="space-y-3 w-full">
            {navSections.map((section, sIdx) => (
              <div key={sIdx} className="w-full space-y-1">
                {!collapsed && (
                  <div className="px-2 pb-0.5 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground/70">
                    {section.title}
                  </div>
                )}
                <div className={`w-full ${collapsed ? "space-y-2 flex flex-col items-center" : "space-y-0.5"}`}>
                  {section.items.map(({ href, label, icon: Icon }) => {
                    const active = isItemActive(href);
                    return (
                      <Link
                        key={href}
                        href={href}
                        title={label}
                        className={`transition-all duration-200 ${
                          collapsed
                            ? `w-10 h-10 rounded-xl flex items-center justify-center ${
                                active
                                  ? "bg-primary text-white shadow-xs"
                                  : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
                              }`
                            : `flex items-center gap-2.5 w-full px-2.5 py-2 rounded-xl text-xs font-semibold ${
                                active
                                  ? "bg-primary text-white shadow-xs font-bold"
                                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                              }`
                        }`}
                      >
                        <Icon size={collapsed ? 18 : 16} className={`shrink-0 ${active ? "text-white" : "text-slate-500"}`} />
                        {!collapsed && <span className="truncate">{label}</span>}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* BOTTOM STAFF CARD & LOGOUT */}
        <div className="pt-3 border-t border-border/70 mt-auto w-full">
          {!collapsed ? (
            <div className="p-2 rounded-xl bg-muted/40 border border-border/50 flex items-center justify-between w-full">
              <div className="flex items-center gap-2 truncate">
                <div className="w-7 h-7 rounded-full bg-primary/20 text-primary dark:text-teal-300 font-bold text-xs flex items-center justify-center shrink-0">
                  {isReceptionist ? "R" : "Dr"}
                </div>
                <div className="truncate text-left leading-tight">
                  <span className="text-xs font-bold text-foreground block truncate">
                    {(staffName && staffName !== "Clinic Staff") ? staffName : (isReceptionist ? "Front Desk" : "Doctor")}
                  </span>
                  <span className="text-[10px] text-muted-foreground capitalize">
                    {isReceptionist ? "Receptionist" : "Doctor"}
                  </span>
                </div>
              </div>
              {onLogout && (
                <button
                  onClick={onLogout}
                  title="Logout"
                  className="p-1 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
                >
                  <LogOut size={14} />
                </button>
              )}
            </div>
          ) : (
            onLogout && (
              <button
                onClick={onLogout}
                title="Sign out"
                className="w-10 h-10 mx-auto rounded-xl flex items-center justify-center text-muted-foreground hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200/50 transition-all"
              >
                <LogOut size={16} />
              </button>
            )
          )}
        </div>
      </aside>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 dark:bg-slate-900/95 backdrop-blur-2xl border-t border-border/80 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] select-none">
        <div className={`grid ${isReceptionist ? "grid-cols-2 max-w-xs" : "grid-cols-5 max-w-md"} gap-1 px-2 pt-1.5 pb-[max(0.6rem,env(safe-area-inset-bottom))] mx-auto items-center`}>
          {primaryMobileItems.map(({ href, shortLabel, icon: Icon }) => {
            const active = isItemActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center justify-center py-1 px-0.5 rounded-2xl transition-all duration-200 min-h-[48px] active:scale-95 ${
                  active
                    ? "text-primary dark:text-teal-300 font-extrabold"
                    : "text-slate-500 dark:text-slate-400 hover:text-foreground font-medium"
                }`}
              >
                <div
                  className={`p-1.5 rounded-xl transition-all duration-200 relative ${
                    active
                      ? "bg-primary/15 text-primary dark:text-teal-300 scale-105 shadow-2xs"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  <Icon size={19} className="shrink-0" />
                </div>
                <span className="text-[10px] mt-0.5 tracking-tight font-semibold truncate max-w-full text-center leading-tight">
                  {shortLabel}
                </span>
                {active && (
                  <span className="w-1.5 h-1.5 rounded-full bg-primary dark:bg-teal-400 mt-0.5 shadow-xs" />
                )}
              </Link>
            );
          })}

          {!isReceptionist && (
            <button
              type="button"
              onClick={() => setIsWaffleOpen(!isWaffleOpen)}
              className={`flex flex-col items-center justify-center py-1 px-0.5 rounded-2xl transition-all duration-200 min-h-[48px] active:scale-95 ${
                isWaffleOpen || isWaffleModuleActive
                  ? "text-primary dark:text-teal-300 font-extrabold"
                  : "text-slate-500 dark:text-slate-400 hover:text-foreground font-medium"
              }`}
              title="Waffle Menu (All Apps)"
            >
              <div
                className={`p-1.5 rounded-xl transition-all duration-200 relative ${
                  isWaffleOpen || isWaffleModuleActive
                    ? "bg-primary/15 text-primary dark:text-teal-300 scale-105 shadow-2xs"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                <WaffleIcon className="w-[18px] h-[18px] shrink-0" />
                {isWaffleModuleActive && !isWaffleOpen && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary dark:bg-teal-400 ring-2 ring-card" />
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight font-semibold truncate max-w-full text-center leading-tight">
                Apps
              </span>
              {(isWaffleOpen || isWaffleModuleActive) && (
                <span className="w-1.5 h-1.5 rounded-full bg-primary dark:bg-teal-400 mt-0.5 shadow-xs" />
              )}
            </button>
          )}
        </div>
      </nav>

      {/* WAFFLE APP LAUNCHER MODAL */}
      {isWaffleOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            onClick={() => setIsWaffleOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
          />

          {/* Waffle Launcher Panel */}
          <div className="relative z-10 bg-card dark:bg-slate-900 border-t border-border/80 rounded-t-3xl shadow-2xl p-4 sm:p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] max-h-[88vh] overflow-y-auto animate-in slide-in-from-bottom duration-250">
            {/* Grab Handle */}
            <div className="w-12 h-1.5 rounded-full bg-muted-foreground/30 mx-auto mb-3" />

            {/* Waffle Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border/60 mb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl border border-primary/30 text-primary dark:text-teal-400 flex items-center justify-center">
                  <WaffleIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-foreground tracking-tight flex items-center gap-1.5">
                    Adaptus Apps
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full border border-primary/30 text-primary dark:text-teal-300">
                      Waffle
                    </span>
                  </h3>
                  <p className="text-[11px] text-muted-foreground font-medium">Quick switch to any clinical or administrative module</p>
                </div>
              </div>
              <button
                onClick={() => setIsWaffleOpen(false)}
                className="w-8 h-8 rounded-full bg-muted/60 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                title="Close Waffle Menu"
              >
                <X size={16} />
              </button>
            </div>

            {/* 3x3 WAFFLE APP GRID */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3 my-2">
              {waffleApps.map((app) => {
                const active = isItemActive(app.href);
                const Icon = app.icon;
                return (
                  <Link
                    key={app.href}
                    href={app.href}
                    onClick={() => setIsWaffleOpen(false)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border transition-all text-center relative group active:scale-95 min-h-[96px] ${
                      active
                        ? "bg-primary/10 border-primary/40 shadow-xs ring-2 ring-primary/20"
                        : "bg-muted/30 hover:bg-muted/60 border-border/60 hover:border-border"
                    }`}
                  >
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-1.5 transition-all duration-200 group-hover:scale-110 shrink-0 border ${
                        active
                          ? "border-primary/60 text-primary dark:text-teal-400 shadow-2xs"
                          : "border-primary/25 dark:border-primary/35 text-primary dark:text-teal-400 group-hover:border-primary/60"
                      }`}
                    >
                      <Icon className="w-5 h-5 stroke-[2]" />
                    </div>
                    <span className="text-xs font-bold text-foreground leading-tight truncate w-full px-1">
                      {app.label}
                    </span>
                    <span className="text-[9px] text-muted-foreground uppercase font-semibold mt-0.5 tracking-wider truncate w-full">
                      {app.category}
                    </span>
                    {active && (
                      <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary dark:bg-teal-400 ring-2 ring-card" />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Staff Card & Quick Logout */}
            <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between bg-muted/20 p-3 rounded-2xl border border-border/40">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-primary/20 text-primary dark:text-teal-300 font-bold text-xs flex items-center justify-center shrink-0">
                  {isReceptionist ? "R" : "Dr"}
                </div>
                <div className="min-w-0 leading-tight">
                  <span className="text-xs font-bold text-foreground block truncate">
                    {(staffName && staffName !== "Clinic Staff") ? staffName : (isReceptionist ? "Front Desk" : "Doctor")}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {isReceptionist ? "Receptionist" : "Administrator"}
                  </span>
                </div>
              </div>

              {onLogout && (
                <button
                  onClick={() => {
                    setIsWaffleOpen(false);
                    onLogout();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/40 transition-colors"
                >
                  <LogOut size={13} />
                  <span>Sign Out</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}