"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getBookings, getPatients, BookingResponse, PatientRecord } from "@/services/bookingService";
import { 
  Users, 
  CalendarCheck2, 
  IndianRupee, 
  TrendingUp, 
  Calendar, 
  Activity, 
  CheckCircle2, 
  Clock, 
  RefreshCw,
  Plus,
  ArrowUpRight,
  ShieldCheck,
  Stethoscope,
  ChevronRight,
  Home,
  Video,
  AlertCircle,
  Package,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [staffRole, setStaffRole] = useState("admin");
  const [staffName, setStaffName] = useState("");

  const loadDashboardData = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [bookingsData, patientsData] = await Promise.all([
        getBookings().catch(() => []),
        getPatients().catch(() => [])
      ]);
      setBookings(bookingsData);
      setPatients(patientsData);
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    if (typeof window !== "undefined") {
      const storedRole = localStorage.getItem("admin_role") || "admin";
      const storedName = localStorage.getItem("admin_name");
      const normalizedName = (storedName && storedName !== "Clinic Staff")
        ? storedName
        : (storedRole === "receptionist" ? "Front Desk" : "Doctor");
      setStaffRole(storedRole);
      setStaffName(normalizedName);
      if (!storedName || storedName === "Clinic Staff") {
        localStorage.setItem("admin_name", normalizedName);
      }
    }
  }, []);

  // Compute live metrics
  const totalPatients = patients.length;
  let totalSessionsLogged = 0;
  let completedSessions = 0;
  let homeVisitsCount = 0;
  let onlineSessionsCount = 0;
  let totalRevenue = 0;
  let packageRevenue = 0;
  let consultationRevenue = 0;
  let sessionRevenue = 0;

  patients.forEach((p) => {
    const initAmt = p.initialConsultation?.paymentAmount || 750;
    if (p.initialConsultation?.paymentStatus === 'paid') {
      totalRevenue += initAmt;
      consultationRevenue += initAmt;
    }

    const isPayPerSession = p.activePackage?.paymentOption === 'pay_per_session' || !p.activePackage;

    if (p.sessions && p.sessions.length > 0) {
      totalSessionsLogged += p.sessions.length;
      completedSessions += p.sessions.filter(s => s.status === 'completed').length;
      p.sessions.forEach((s) => {
        if (s.sessionType === 'online') onlineSessionsCount++;
        else homeVisitsCount++;

        if (s.paymentStatus === 'paid' && isPayPerSession) {
          const sAmt = s.paidAmount !== undefined ? s.paidAmount : (s.amount || 700);
          totalRevenue += sAmt;
          sessionRevenue += sAmt;
        }
      });
    } else {
      totalSessionsLogged += 1;
      completedSessions += 1;
      homeVisitsCount += 1;
    }

    if (p.activePackage && p.activePackage.paymentOption === 'pay_per_package' && p.activePackage.paymentStatus === 'paid') {
      const pkgAmt = p.activePackage.amountPaid || p.activePackage.totalAmount || 0;
      totalRevenue += pkgAmt;
      packageRevenue += pkgAmt;
    }
  });

  const pendingAppointments = bookings.filter(b => b.status === 'pending' || b.status === 'link_sent' || b.status === 'scheduling').length;
  const confirmedAppointments = bookings.filter(b => b.status === 'scheduled' || b.status === 'confirmed').length;

  const todayIso = new Date().toISOString().split("T")[0];
  const upcomingQueue = bookings
    .filter(b => b.status === "scheduled" || b.status === "confirmed")
    .slice(0, 5);

  const recentPatients = [...patients]
    .sort((a, b) => new Date(b.convertedAt || b.createdAt).getTime() - new Date(a.convertedAt || a.createdAt).getTime())
    .slice(0, 5);

  const activeCarePlansCount = patients.filter(p => p.activePackage?.packageName).length;
  const completionRate = totalSessionsLogged > 0 ? Math.round((completedSessions / totalSessionsLogged) * 100) : 100;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* EXECUTIVE TOP BANNER */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-900 via-emerald-800 to-teal-900 text-white p-6 sm:p-7 shadow-lg">
        {/* Soft background glow decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-500/20 text-emerald-200 border-emerald-400/30 text-xs font-bold uppercase tracking-wider">
                Executive Command Center
              </Badge>
              <span className="text-xs text-teal-200 font-medium">
                Adaptus Clinic Care
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Welcome back, {(staffName && staffName !== "Clinic Staff") ? staffName : (staffRole === "receptionist" ? "Front Desk" : "Doctor")}
            </h1>
            <p className="text-teal-100/80 text-xs sm:text-sm leading-relaxed">
              Here is your clinic overview for today. You have <strong className="text-white font-bold">{confirmedAppointments} confirmed sessions</strong> on record and <strong className="text-amber-300 font-bold">{pendingAppointments} pending appointments</strong> requiring coordination.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadDashboardData(true)}
              disabled={loading || refreshing}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 h-9 gap-2 text-xs font-semibold backdrop-blur-sm"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
              Refresh Feed
            </Button>
            <Link href="/admin/appointments">
              <Button
                variant="default"
                size="sm"
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold h-9 gap-1.5 text-xs shadow-md"
              >
                <span>Appointments Desk</span>
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* METRICS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Metric 1: Patients */}
        <div className="p-5 bg-card border border-border/80 rounded-2xl shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-bold uppercase tracking-wider">
            <span>Registered Patients</span>
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-700 dark:text-teal-300 flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-3xl font-black text-foreground">
              {loading ? "..." : totalPatients}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                <TrendingUp className="w-3 h-3" /> Active
              </span>
              <span className="text-[11px] text-muted-foreground">
                {activeCarePlansCount} on package plans
              </span>
            </div>
          </div>
          <Link 
            href="/admin/patients" 
            className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1 pt-2 border-t border-border/60"
          >
            <span>View directory</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Metric 2: Completed Sessions */}
        <div className="p-5 bg-card border border-border/80 rounded-2xl shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-bold uppercase tracking-wider">
            <span>Completed Sessions</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-3xl font-black text-foreground">
              {loading ? "..." : completedSessions}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
                {completionRate}% success rate
              </span>
              <span className="text-[11px] text-muted-foreground">
                • {totalSessionsLogged} logged
              </span>
            </div>
          </div>
          <Link 
            href="/admin/sessions" 
            className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1 pt-2 border-t border-border/60"
          >
            <span>Track sessions</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Metric 3: Upcoming Schedule */}
        <div className="p-5 bg-card border border-border/80 rounded-2xl shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-bold uppercase tracking-wider">
            <span>Confirmed Sessions</span>
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-3xl font-black text-foreground">
              {loading ? "..." : confirmedAppointments}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                {pendingAppointments} pending link
              </span>
            </div>
          </div>
          <Link 
            href="/admin/appointments" 
            className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1 pt-2 border-t border-border/60"
          >
            <span>Manage bookings</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Metric 4: Revenue */}
        <div className="p-5 bg-card border border-border/80 rounded-2xl shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-bold uppercase tracking-wider">
            <span>Total Collections</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <IndianRupee className="h-4 w-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-3xl font-black text-foreground">
              {loading ? "..." : `₹${totalRevenue.toLocaleString()}`}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-muted-foreground flex-wrap">
              <span>₹{consultationRevenue.toLocaleString()} consults</span>
              <span>•</span>
              <span>₹{packageRevenue.toLocaleString()} pkgs</span>
              <span>•</span>
              <span>₹{sessionRevenue.toLocaleString()} sessions</span>
            </div>
          </div>
          <Link 
            href="/admin/payments" 
            className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1 pt-2 border-t border-border/60"
          >
            <span>View ledger</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* QUICK CLINICAL ACTIONS BAR */}
      <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Quick Actions:
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/admin/appointments">
            <Button variant="outline" size="sm" className="h-8 text-xs font-semibold gap-1.5 border-teal-600/30 text-teal-800 dark:text-teal-300 hover:bg-teal-50">
              <Plus className="w-3.5 h-3.5 text-teal-600" />
              <span>Register Clinic Walk-in</span>
            </Button>
          </Link>
          <Link href="/admin/sessions">
            <Button variant="outline" size="sm" className="h-8 text-xs font-medium gap-1.5 border-border hover:bg-muted/60">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Session Check-in</span>
            </Button>
          </Link>
          <Link href="/admin/patients">
            <Button variant="outline" size="sm" className="h-8 text-xs font-medium gap-1.5 border-border hover:bg-muted/60">
              <Users className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Patients Directory</span>
            </Button>
          </Link>
          <Link href="/admin/analytics">
            <Button variant="outline" size="sm" className="h-8 text-xs font-medium gap-1.5 border-border hover:bg-muted/60">
              <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Performance Analytics</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* TWO COLUMN CONTENT: TODAY'S APPOINTMENTS QUEUE & RECENT CONVERSIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Confirmed Appointments Queue */}
        <div className="lg:col-span-2 bg-card border border-border/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border/70 mb-4">
              <div>
                <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-teal-600" />
                  Upcoming Therapy Sessions & Appointments
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Patients scheduled for clinical examination and home therapy sessions.
                </p>
              </div>
              <Link 
                href="/admin/appointments" 
                className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1"
              >
                <span>View All ({bookings.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-teal-600" />
                Loading appointment queue...
              </div>
            ) : upcomingQueue.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground max-w-sm mx-auto">
                <Calendar className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
                <p className="font-semibold text-foreground">No upcoming appointments</p>
                <p className="mt-1">All current appointments have either been completed or are pending slot selection.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {upcomingQueue.map((b) => (
                  <div 
                    key={b._id}
                    className="p-3.5 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {b.personalDetails.firstName?.[0] || "P"}{b.personalDetails.lastName?.[0] || ""}
                      </div>
                      <div className="leading-tight">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs sm:text-sm text-foreground">
                            {b.personalDetails.firstName} {b.personalDetails.lastName}
                          </span>
                          <Badge className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 border-emerald-500/20 py-0">
                            Confirmed
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-teal-600" />
                            {b.scheduledDate || "Today"} @ {b.scheduledTime || "Slot"}
                          </span>
                          <span>•</span>
                          <span>{b.personalDetails.phone}</span>
                        </div>
                      </div>
                    </div>

                    <Link href="/admin/appointments">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs font-semibold gap-1.5 border-border hover:bg-muted"
                      >
                        <span>View Desk</span>
                        <ChevronRight className="w-3 h-3 text-muted-foreground" />
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
            <span>Showing top {upcomingQueue.length} upcoming sessions</span>
            <Link href="/admin/appointments" className="font-semibold text-teal-700 hover:underline">
              Open Full Calendar Desk →
            </Link>
          </div>
        </div>

        {/* Right 1 Col: Recent Converted Patients Feed */}
        <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border/70 mb-4">
              <div>
                <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Recent Patients
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Converted permanent care plans.
                </p>
              </div>
              <Link 
                href="/admin/patients" 
                className="text-xs font-bold text-teal-700 hover:text-teal-800"
              >
                Directory
              </Link>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-teal-600" />
                Loading...
              </div>
            ) : recentPatients.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No patients converted yet.
              </div>
            ) : (
              <div className="space-y-3">
                {recentPatients.map((p) => (
                  <div key={p._id} className="flex items-center justify-between gap-2 p-2 rounded-xl hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-2.5 truncate">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center justify-center shrink-0">
                        {p.firstName?.[0]}{p.lastName?.[0]}
                      </div>
                      <div className="truncate leading-tight">
                        <span className="font-bold text-xs text-foreground block truncate">
                          {p.firstName} {p.lastName}
                        </span>
                        <span className="text-[10px] text-muted-foreground block truncate">
                          {p.activePackage?.title || p.diagnosis || "Active Care Plan"}
                        </span>
                      </div>
                    </div>
                    <Link href="/admin/patients">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-border/60">
            <Link 
              href="/admin/sessions" 
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 font-bold text-xs hover:bg-teal-100/70 transition-colors"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Go to Session Progress Log</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}