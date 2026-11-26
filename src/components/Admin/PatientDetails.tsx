"use client";

import { useEffect, useState } from "react";
import { getPatients, PatientRecord } from "@/services/bookingService";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  Search, 
  RefreshCw, 
  UserCheck, 
  Phone, 
  Mail, 
  MapPin, 
  Activity, 
  Calendar,
  AlertCircle,
  CheckCircle2,
  FileText,
  Copy,
  ChevronRight,
  Package,
  Clock,
  ShieldCheck,
  Stethoscope,
  TrendingDown,
  Eye,
  IndianRupee,
  Video,
  Home
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export default function PatientDetails() {
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatientForChart, setSelectedPatientForChart] = useState<PatientRecord | null>(null);
  const [isChartModalOpen, setIsChartModalOpen] = useState(false);
  const { toast } = useToast();

  const fetchPatients = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await getPatients();
      setPatients(data);
    } catch (error: any) {
      console.error("Error fetching patients:", error);
      toast({
        title: "Error fetching patients",
        description: error.message || "Failed to load patient records from database.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const filteredPatients = patients.filter((p) => {
    const name = `${p.firstName} ${p.lastName}`.toLowerCase();
    const email = (p.email || "").toLowerCase();
    const phone = p.phone || "";
    const condition = (p.conditions || []).join(" ").toLowerCase();
    const diagnosis = (p.diagnosis || "").toLowerCase();
    const query = searchQuery.toLowerCase();
    return name.includes(query) || email.includes(query) || phone.includes(query) || condition.includes(query) || diagnosis.includes(query);
  });

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
      });
    } catch {
      return dateStr;
    }
  };

  // Metrics
  const totalPatients = patients.length;
  const activePackagesCount = patients.filter(p => p.activePackage?.packageName).length;
  const homeVisitsTotal = patients.filter(p => p.activePackage?.sessionType !== "online").length;
  const onlinePatientsTotal = patients.filter(p => p.activePackage?.sessionType === "online").length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground flex items-center gap-2.5">
            <Users className="h-7 w-7 text-teal-600" />
            Registered Patients Directory
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1">
            Clinical case records, rehabilitation diagnoses, and ongoing therapy programs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchPatients(true)}
            disabled={loading || refreshing}
            className="gap-2 h-9 text-xs font-semibold"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh Directory
          </Button>
        </div>
      </div>

      {/* METRIC PILL CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 bg-card border border-border/80 rounded-2xl shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
            Total Patients
          </span>
          <span className="text-2xl sm:text-3xl font-black text-foreground mt-1 block">
            {loading ? "..." : totalPatients}
          </span>
          <span className="text-[11px] text-muted-foreground mt-0.5 block">Permanent profiles</span>
        </div>

        <div className="p-4 bg-card border border-border/80 rounded-2xl shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
            Active Packages
          </span>
          <span className="text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-400 mt-1 block">
            {loading ? "..." : activePackagesCount}
          </span>
          <span className="text-[11px] text-emerald-600/80 mt-0.5 block">Rehab plans in progress</span>
        </div>

        <div className="p-4 bg-card border border-border/80 rounded-2xl shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
            Home Visit Care
          </span>
          <span className="text-2xl sm:text-3xl font-black text-teal-700 dark:text-teal-400 mt-1 block">
            {loading ? "..." : homeVisitsTotal}
          </span>
          <span className="text-[11px] text-muted-foreground mt-0.5 block">In-person therapist visits</span>
        </div>

        <div className="p-4 bg-card border border-border/80 rounded-2xl shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
            Online Tele-Rehab
          </span>
          <span className="text-2xl sm:text-3xl font-black text-sky-700 dark:text-sky-400 mt-1 block">
            {loading ? "..." : onlinePatientsTotal}
          </span>
          <span className="text-[11px] text-muted-foreground mt-0.5 block">Remote video consultations</span>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-card p-3.5 rounded-2xl border border-border/80 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground px-1">
          <span>Showing <strong className="text-foreground">{filteredPatients.length}</strong> patient records</span>
        </div>

        <div className="relative sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search patient, diagnosis, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>
      </div>

      {/* PATIENTS TABLE OR CARDS */}
      {loading ? (
        <div className="bg-card rounded-2xl border border-border/80 shadow-xs p-16 text-center flex flex-col items-center justify-center gap-3">
          <RefreshCw className="h-8 w-8 text-teal-600 animate-spin" />
          <p className="text-sm font-medium text-muted-foreground">Loading patient clinical records...</p>
        </div>
      ) : filteredPatients.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border/80 shadow-xs p-16 text-center max-w-md mx-auto flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-3">
            <UserCheck className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="font-bold text-base text-foreground">No patient records found</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {searchQuery
              ? "No patients match your search criteria."
              : "No bookings have been converted to permanent profiles yet. Open Appointments and click 'Convert to Patient'."}
          </p>
        </div>
      ) : (
        <>
          {/* MOBILE VIEW: INDEPENDENT PATIENT CARDS (block md:hidden) */}
          <div className="block md:hidden space-y-3.5">
            {filteredPatients.map((p, idx) => {
              const completedCount = p.sessions
                ? p.sessions.filter(s => s.status === 'completed').length
                : (p.totalSessionsCompleted ?? 0);
              const totalCount = p.activePackage?.totalSessions || (p.sessions?.length ? p.sessions.length : 1);
              const remainingCount = Math.max(0, totalCount - completedCount);
              const isPlanDone = totalCount > 0 && remainingCount === 0 && completedCount > 0;
              const token = p._id ? `#PAT-${p._id.slice(-4).toUpperCase()}` : `#${idx + 1}`;
              const isOnline = p.activePackage?.sessionType === 'online';

              return (
                <div
                  key={p._id}
                  className={`bg-card rounded-2xl border border-border/80 shadow-xs p-4 space-y-3 hover:border-teal-500/40 transition-all ${
                    isPlanDone ? "border-l-4 border-l-emerald-500" : "border-l-4 border-l-teal-600"
                  }`}
                >
                  {/* Card Top: Token & Modality & Progress */}
                  <div className="flex items-center justify-between pb-2 border-b border-border/50 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                        {token}
                      </span>
                      {isOnline ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-800 dark:text-sky-300 border border-sky-500/30">
                          <Video className="w-3 h-3 text-sky-600" /> Online Tele-Rehab
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/15 text-teal-800 dark:text-teal-300 border border-teal-500/30">
                          <Home className="w-3 h-3 text-teal-600" /> Home Visit Care
                        </span>
                      )}
                    </div>
                    <Badge className={`text-[10px] font-bold px-2 py-0.5 ${
                      isPlanDone
                        ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30"
                        : "bg-teal-500/15 text-teal-800 dark:text-teal-300 border-teal-500/30"
                    }`}>
                      {completedCount} / {totalCount} Done
                    </Badge>
                  </div>

                  {/* Patient Profile */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-teal-500/15 text-teal-800 dark:text-teal-300 font-black text-xs flex items-center justify-center shrink-0 border border-teal-500/20">
                      {p.firstName?.[0] || "P"}{p.lastName?.[0] || ""}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-sm text-foreground truncate">
                        {p.firstName} {p.lastName}
                      </h4>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                        <span>{p.age ? `${p.age} yrs` : "Adult"}</span>
                        {p.gender && <span>• {p.gender}</span>}
                        <span>• Enrolled {formatDate(p.convertedAt || p.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Program & Clinical Diagnosis */}
                  <div className="p-3 rounded-xl bg-muted/30 border border-border/60 flex flex-col gap-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground">
                        {p.activePackage ? p.activePackage.title : p.program || "Physiotherapy Program"}
                      </span>
                      <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
                        {remainingCount > 0 ? `${remainingCount} sessions left` : "Discharged"}
                      </span>
                    </div>

                    {(p.conditions && p.conditions.length > 0) && (
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {p.conditions.slice(0, 3).map((c) => (
                          <Badge key={c} variant="secondary" className="text-[9px] px-1.5 py-0 bg-teal-500/10 text-teal-800 dark:text-teal-300 border-teal-500/20">
                            {c}
                          </Badge>
                        ))}
                        {p.conditions.length > 3 && (
                          <span className="text-[9px] text-muted-foreground font-semibold">
                            +{p.conditions.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    {p.diagnosis && (
                      <p className="text-[11px] text-muted-foreground italic line-clamp-1 mt-0.5">
                        "{p.diagnosis}"
                      </p>
                    )}
                  </div>

                  {/* Contact Row */}
                  <div className="flex items-center justify-between gap-3 text-[11px] text-muted-foreground pt-0.5">
                    <a href={`tel:${p.phone}`} className="hover:text-teal-700 font-medium flex items-center gap-1">
                      <Phone className="h-3 w-3 text-teal-600" />
                      <span>{p.phone}</span>
                    </a>
                    <span className="truncate max-w-[150px] flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      <span>{p.email}</span>
                    </span>
                  </div>

                  {/* Full-width View Chart Action */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedPatientForChart(p);
                      setIsChartModalOpen(true);
                    }}
                    className="w-full h-9 text-xs font-bold text-teal-900 dark:text-teal-200 hover:text-white bg-teal-500/10 hover:bg-teal-700 border-teal-500/30 gap-1.5 rounded-xl transition-all shadow-2xs mt-1"
                  >
                    <Eye className="h-3.5 w-3.5 text-teal-700 dark:text-teal-300" />
                    <span>View Patient Chart & History</span>
                  </Button>
                </div>
              );
            })}
          </div>

          {/* DESKTOP TABLE VIEW (hidden md:block) */}
          {/* DESKTOP TABLE VIEW (hidden md:block) - Zero Side Scroll */}
          <div className="hidden md:block bg-card rounded-2xl border border-border/80 shadow-xs overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-muted/40 border-b border-border/70 text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
                  <th className="px-4 py-3 w-[27%]">Patient & Contact</th>
                  <th className="px-4 py-3 w-[23%]">Clinical Diagnosis</th>
                  <th className="px-4 py-3 w-[20%]">Treatment Program</th>
                  <th className="px-4 py-3 w-[15%]">Sessions Progress</th>
                  <th className="px-4 py-3 w-[8%]">Registered</th>
                  <th className="px-4 py-3 text-right w-[7%] sticky right-0 z-20 bg-muted/95 backdrop-blur-xs shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.06)]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredPatients.map((p) => {
                  const completedCount = p.sessions
                    ? p.sessions.filter(s => s.status === 'completed').length
                    : (p.totalSessionsCompleted ?? 0);
                  const totalCount = p.activePackage?.totalSessions || (p.sessions?.length ? p.sessions.length : 1);
                  const remainingCount = Math.max(0, totalCount - completedCount);

                  return (
                    <tr key={p._id} className="group hover:bg-muted/30 transition-colors">
                      {/* Patient Profile & Contact */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-teal-500/15 text-teal-800 dark:text-teal-300 font-bold text-xs flex items-center justify-center shrink-0">
                            {p.firstName?.[0] || "P"}{p.lastName?.[0] || ""}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-sm text-foreground truncate">
                                {p.firstName} {p.lastName}
                              </span>
                              <span className="text-[10px] text-muted-foreground shrink-0">
                                ({p.age ? `${p.age}y` : "Adult"}{p.gender ? ` • ${p.gender}` : ""})
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5 truncate">
                              <span className="shrink-0">{p.phone}</span>
                              <span className="opacity-40">•</span>
                              <span className="truncate max-w-[130px]">{p.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Clinical Diagnosis */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1 max-w-[190px]">
                          <div className="flex flex-wrap gap-1">
                            {(p.conditions || []).slice(0, 2).map((c) => (
                              <Badge key={c} variant="secondary" className="text-[9px] px-1.5 py-0 bg-teal-500/10 text-teal-800 dark:text-teal-300 border-teal-500/20 font-semibold">
                                {c}
                              </Badge>
                            ))}
                            {(p.conditions || []).length > 2 && (
                              <Badge variant="secondary" className="text-[9px] px-1 py-0 bg-muted text-muted-foreground">
                                +{(p.conditions || []).length - 2}
                              </Badge>
                            )}
                          </div>
                          <span className="text-[11px] text-muted-foreground line-clamp-1 italic">
                            "{p.diagnosis || "Under Physiotherapy Care"}"
                          </span>
                        </div>
                      </td>

                      {/* Treatment Program */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-foreground truncate max-w-[160px]">
                            {p.activePackage ? p.activePackage.title : p.program || "Standard Care"}
                          </span>
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 capitalize border-teal-500/30 text-teal-800 dark:text-teal-300 w-fit">
                            {p.activePackage?.sessionType === 'online' ? 'Online' : p.activePackage?.sessionType === 'home_visit' ? 'Home Visit' : 'In-Clinic'}
                          </Badge>
                        </div>
                      </td>

                      {/* Sessions Progress */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                          <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 font-bold px-2 py-0.5 w-fit text-[10px]">
                            {completedCount} / {totalCount} Done
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {remainingCount > 0 ? `${remainingCount} left` : "Completed"}
                          </span>
                        </div>
                      </td>

                      {/* Converted Date */}
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground text-[11px]">
                        {formatDate(p.convertedAt || p.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right whitespace-nowrap sticky right-0 z-10 bg-card group-hover:bg-muted/30 backdrop-blur-xs shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.06)]">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedPatientForChart(p);
                            setIsChartModalOpen(true);
                          }}
                          className="h-7 px-2.5 text-xs font-semibold gap-1 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          <span>Chart</span>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* PATIENT CLINICAL CHART DIALOG */}
      {selectedPatientForChart && (
        <Dialog open={isChartModalOpen} onOpenChange={setIsChartModalOpen}>
          <DialogContent className="max-w-2xl w-full bg-card border-border/80 shadow-2xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3.5rem)] overflow-y-auto custom-slim-scrollbar">
            <DialogHeader className="pr-10 sm:pr-14">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-700 text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0">
                    {selectedPatientForChart.firstName?.[0]}{selectedPatientForChart.lastName?.[0]}
                  </div>
                  <div>
                    <DialogTitle className="text-lg font-bold text-foreground">
                      {selectedPatientForChart.firstName} {selectedPatientForChart.lastName}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                      Registered Patient ID: #{selectedPatientForChart._id.slice(-6).toUpperCase()} • Converted on {formatDate(selectedPatientForChart.convertedAt || selectedPatientForChart.createdAt)}
                    </DialogDescription>
                  </div>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20 font-bold text-xs py-1 mr-2 sm:mr-4 shrink-0">
                  Active Care Plan
                </Badge>
              </div>
            </DialogHeader>

            <div className="space-y-5 py-3 text-xs">
              {/* CONTACT & DEMOGRAPHICS */}
              <div className="bg-muted/30 p-3.5 sm:p-4 rounded-xl border border-border/60 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">Phone Number</span>
                  <span className="font-semibold text-foreground text-sm flex items-center gap-1.5 mt-0.5">
                    <Phone className="w-3.5 h-3.5 text-teal-600" />
                    {selectedPatientForChart.phone}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">Email Address</span>
                  <span className="font-semibold text-foreground text-sm truncate block mt-0.5">
                    {selectedPatientForChart.email || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">Age & Gender</span>
                  <span className="font-semibold text-foreground text-sm capitalize block mt-0.5">
                    {selectedPatientForChart.age ? `${selectedPatientForChart.age} yrs` : "Adult"} • {selectedPatientForChart.gender || "Not specified"}
                  </span>
                </div>
                {selectedPatientForChart.address && (
                  <div className="col-span-2 sm:col-span-3 pt-2 border-t border-border/50">
                    <span className="text-muted-foreground block text-[10px] uppercase font-bold">Residential Address</span>
                    <span className="font-medium text-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      {selectedPatientForChart.address}
                    </span>
                  </div>
                )}
              </div>

              {/* MEDICAL DIAGNOSIS & REHAB PROGRAM */}
              <div className="space-y-2">
                <h4 className="font-bold text-foreground text-xs uppercase tracking-wider flex items-center gap-1.5 text-teal-700">
                  <Stethoscope className="w-3.5 h-3.5" />
                  Clinical Diagnosis & Rehabilitation Goal
                </h4>
                <div className="bg-teal-500/5 p-3.5 rounded-xl border border-teal-500/20 space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {(selectedPatientForChart.conditions || []).map((c) => (
                      <Badge key={c} className="bg-teal-500/15 text-teal-800 border-teal-500/30 text-xs font-bold">
                        {c}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-foreground leading-relaxed text-xs">
                    {selectedPatientForChart.diagnosis || "Patient undergoing clinical assessment and targeted physical therapy exercises."}
                  </p>
                </div>
              </div>

              {/* PACKAGE & SESSIONS PROGRESS */}
              <div className="space-y-2">
                <h4 className="font-bold text-foreground text-xs uppercase tracking-wider flex items-center gap-1.5 text-emerald-700">
                  <Package className="w-3.5 h-3.5" />
                  Therapy Package & Session Log
                </h4>
                <div className="bg-card p-3.5 rounded-xl border border-border/70 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-foreground text-sm block">
                        {selectedPatientForChart.activePackage?.title || selectedPatientForChart.program || "Standard Consultation"}
                      </span>
                      <span className="text-muted-foreground text-[11px]">
                        Session Format: {
                          selectedPatientForChart.activePackage?.sessionType === 'online'
                            ? 'Online Tele-Consultation'
                            : selectedPatientForChart.activePackage?.sessionType === 'home_visit'
                            ? 'In-Person Home Visit'
                            : 'In-Person Clinic Visit'
                        }
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-foreground text-sm block">
                        ₹{selectedPatientForChart.activePackage?.totalAmount || selectedPatientForChart.initialConsultation?.paymentAmount || 750}
                      </span>
                      <Badge variant="outline" className="text-[10px] text-emerald-700 border-emerald-500/30 bg-emerald-500/10 font-bold">
                        {selectedPatientForChart.activePackage?.paymentStatus?.toUpperCase() || "PAID"}
                      </Badge>
                    </div>
                  </div>

                  {/* SESSIONS BREAKDOWN */}
                  {selectedPatientForChart.sessions && selectedPatientForChart.sessions.length > 0 ? (
                    <div className="space-y-2 pt-2 border-t border-border/50">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                        Logged Sessions ({selectedPatientForChart.sessions.length})
                      </span>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto">
                        {selectedPatientForChart.sessions.map((s, idx) => (
                          <div key={idx} className="p-2.5 rounded-lg bg-muted/40 border border-border/50 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-teal-500/10 text-teal-800 font-bold text-[11px] flex items-center justify-center">
                                #{s.sessionNumber || idx + 1}
                              </span>
                              <div>
                                <span className="font-bold text-foreground block">
                                  {s.date || "Scheduled Date"} {s.time ? `@ ${s.time}` : ""}
                                </span>
                                <span className="text-[10px] text-muted-foreground block">
                                  {s.report?.treatmentAdministered || s.clinicalNotes || "Session Recorded"}
                                </span>
                              </div>
                            </div>
                            <Badge className={`text-[10px] font-bold ${
                              s.status === 'completed' 
                                ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20' 
                                : 'bg-sky-500/10 text-sky-700 border-sky-500/20'
                            }`}>
                              {s.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-muted/30 rounded-lg text-center text-muted-foreground text-xs">
                      Initial consultation completed. Routine sessions are tracked in the Sessions tab.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter className="border-t pt-3 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2">
              <span className="text-xs text-muted-foreground">
                All patient medical notes are confidential.
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsChartModalOpen(false)}
                className="text-xs font-semibold w-full sm:w-auto"
              >
                Close Chart
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}