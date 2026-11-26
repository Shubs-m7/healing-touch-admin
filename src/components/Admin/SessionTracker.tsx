"use client";

import { useEffect, useState } from "react";
import { getPatients, PatientRecord } from "@/services/bookingService";
import { updatePatientSession, bookPatientSession } from "@/services/patientApiService";
import { isValidTimeString, parseAndFormatTime } from "@/lib/timeUtils";
import { useToast } from "@/hooks/use-toast";
import { 
  CalendarCheck2, 
  Search, 
  RefreshCw, 
  Home, 
  Building2,
  Video, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  AlertCircle,
  Package,
  User,
  ChevronDown,
  ChevronUp,
  FileText,
  Stethoscope,
  Activity,
  PlusCircle,
  TrendingDown,
  Award,
  Check,
  LogIn,
  DoorOpen,
  Timer,
  UserPlus,
  ShieldAlert,
  IndianRupee,
  CreditCard,
  ArrowRight,
  ArrowLeft,
  Banknote,
  QrCode,
  ShieldCheck,
  Phone,
  Mail,
  Info,
  Shield
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarWidget } from "@/components/ui/calendar";
import { TimePicker } from "@/components/ui/time-picker";
import { format } from "date-fns";

export default function SessionTracker() {
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedPatientId, setExpandedPatientId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<"admin" | "receptionist">("admin");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Doctor Session Report Modal State (2-Step Flow: Step 1 Clinical Notes -> Step 2 Payment)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportStep, setReportStep] = useState<1 | 2>(1);
  const [selectedPatientForReport, setSelectedPatientForReport] = useState<PatientRecord | null>(null);
  const [selectedSessionIndex, setSelectedSessionIndex] = useState<number>(0);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  const [reportForm, setReportForm] = useState({
    treatmentAdministered: "",
    painLevelBefore: 7,
    painLevelAfter: 3,
    progressNotes: "",
    homeExercisesRecommended: "",
    therapistName: "Dr. Attending Physiotherapist",
    paymentStatus: "paid" as "paid" | "pending",
    paymentMethod: "upi" as "upi" | "cash" | "card" | "bank_transfer" | "package_covered",
    transactionId: "",
    paidAmount: 700,
    paymentDate: new Date().toISOString().split("T")[0],
    paymentNotes: ""
  });

  // Standalone Quick Payment Modal State (for Receptionist & Quick Entry)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPatientForPayment, setSelectedPatientForPayment] = useState<PatientRecord | null>(null);
  const [selectedPaymentSessionIndex, setSelectedPaymentSessionIndex] = useState<number>(0);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [standalonePaymentForm, setStandalonePaymentForm] = useState({
    paymentStatus: "paid" as "paid" | "pending",
    paymentMethod: "upi" as "upi" | "cash" | "card" | "bank_transfer" | "package_covered",
    transactionId: "",
    paidAmount: 700,
    paymentDate: new Date().toISOString().split("T")[0],
    paymentNotes: ""
  });

  // View Report Modal State
  const [isViewReportOpen, setIsViewReportOpen] = useState(false);
  const [viewingSession, setViewingSession] = useState<{
    patient: PatientRecord;
    sessionIndex: number;
    patientName: string;
    sessionNumber: number;
    date: string;
    sessionType: string;
    checkInTime?: string;
    leaveTime?: string;
    report?: any;
    paymentStatus?: string;
    paymentMethod?: string;
    transactionId?: string;
    amount?: number;
    paidAmount?: number;
    paymentDate?: string;
    paymentNotes?: string;
  } | null>(null);

  // Time Adjustment Modal State (Check-in / Leave times)
  const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);
  const [selectedPatientForTime, setSelectedPatientForTime] = useState<PatientRecord | null>(null);
  const [selectedTimeSessionIndex, setSelectedTimeSessionIndex] = useState<number>(0);
  const [timeForm, setTimeForm] = useState({
    checkInTime: "",
    leaveTime: "",
    status: "in_progress" as "scheduled" | "in_progress" | "completed" | "cancelled"
  });

  // Walk-In Session Creation Modal State
  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false);
  const [selectedPatientForWalkIn, setSelectedPatientForWalkIn] = useState<PatientRecord | null>(null);
  const [walkInForm, setWalkInForm] = useState({
    date: new Date().toISOString().split("T")[0],
    time: "10:00 AM",
    checkInTime: "",
    sessionType: "in_clinic" as "home_visit" | "in_clinic" | "online",
    clinicalNotes: "Walk-in patient check-in at clinic front desk"
  });

  const { toast } = useToast();

  const getCurrentTimeString = () => {
    return new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  };

  const getCurrentDateString = () => {
    return new Date().toISOString().split("T")[0];
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedRole = localStorage.getItem("admin_role");
      if (storedRole === "receptionist" || storedRole === "admin") {
        setUserRole(storedRole);
      }
    }
    fetchSessionData();
  }, []);

  const fetchSessionData = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await getPatients();
      setPatients(data);
      if (data.length > 0 && !expandedPatientId) {
        setExpandedPatientId(data[0]._id);
      }
    } catch (error: any) {
      console.error("Error fetching sessions:", error);
      toast({
        title: "Error fetching sessions",
        description: error.message || "Failed to load session logs.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 1-Click Quick Check-In (Arrival)
  const handleQuickCheckIn = async (patient: PatientRecord, sessionIndex: number) => {
    const actionKey = `${patient._id}-${sessionIndex}-checkin`;
    setActionLoading(actionKey);
    const nowTime = getCurrentTimeString();

    try {
      await updatePatientSession(patient._id, sessionIndex, {
        checkInTime: nowTime,
        status: "in_progress",
      });

      toast({
        title: "Patient Checked In!",
        description: `${patient.firstName} ${patient.lastName} checked in at ${nowTime}. Status updated to In Progress.`,
      });

      await fetchSessionData(true);
    } catch (err: any) {
      console.error("Error recording check-in:", err);
      toast({
        title: "Check-in Failed",
        description: err.message || "Could not record check-in time.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  // 1-Click Quick Leave (Departure)
  const handleQuickLeave = async (patient: PatientRecord, sessionIndex: number) => {
    const actionKey = `${patient._id}-${sessionIndex}-leave`;
    setActionLoading(actionKey);
    const nowTime = getCurrentTimeString();

    try {
      await updatePatientSession(patient._id, sessionIndex, {
        leaveTime: nowTime,
      });

      toast({
        title: "Patient Leave Recorded!",
        description: `${patient.firstName} ${patient.lastName} left at ${nowTime}.`,
      });

      await fetchSessionData(true);
    } catch (err: any) {
      console.error("Error recording departure:", err);
      toast({
        title: "Departure Logging Failed",
        description: err.message || "Could not record leave time.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Open Detailed Time Adjustment Modal
  const handleOpenTimeModal = (patient: PatientRecord, sessionIndex: number) => {
    const session = patient.sessions?.[sessionIndex];
    setSelectedPatientForTime(patient);
    setSelectedTimeSessionIndex(sessionIndex);

    setTimeForm({
      checkInTime: session?.checkInTime || getCurrentTimeString(),
      leaveTime: session?.leaveTime || "",
      status: (session?.status || "in_progress") as any,
    });

    setIsTimeModalOpen(true);
  };

  const handleSaveTimeModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientForTime) return;

    const trimmedCheckIn = timeForm.checkInTime.trim();
    const trimmedLeave = timeForm.leaveTime.trim();

    let formattedCheckIn: string | undefined = undefined;
    if (trimmedCheckIn) {
      const parsed = parseAndFormatTime(trimmedCheckIn);
      if (!parsed.isValid) {
        toast({
          title: "Invalid Check-In Time",
          description: "Arrival Check-In Time must be a valid time format only (e.g., '10:30 AM' or '1:54 PM'). Arbitrary text or characters are not allowed.",
          variant: "destructive",
        });
        return;
      }
      formattedCheckIn = parsed.formatted;
    }

    let formattedLeave: string | undefined = undefined;
    if (trimmedLeave) {
      const parsed = parseAndFormatTime(trimmedLeave);
      if (!parsed.isValid) {
        toast({
          title: "Invalid Departure Time",
          description: "Departure Leave Time must be a valid time format only (e.g., '11:15 AM' or '2:30 PM'). Arbitrary text or characters are not allowed.",
          variant: "destructive",
        });
        return;
      }
      formattedLeave = parsed.formatted;
    }

    setActionLoading("saving-time");
    try {
      await updatePatientSession(selectedPatientForTime._id, selectedTimeSessionIndex, {
        checkInTime: formattedCheckIn,
        leaveTime: formattedLeave,
        status: timeForm.status,
      });

      toast({
        title: "Session Timing Updated!",
        description: `Check-in and departure times updated for Session #${selectedTimeSessionIndex + 1}.`,
      });

      setIsTimeModalOpen(false);
      await fetchSessionData(true);
    } catch (err: any) {
      console.error("Error updating timing:", err);
      toast({
        title: "Update Failed",
        description: err.message || "Could not update session timing.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Open Walk-In Session Creation Modal
  const handleOpenWalkInModal = (patient: PatientRecord) => {
    setSelectedPatientForWalkIn(patient);
    const nowTime = getCurrentTimeString();
    setWalkInForm({
      date: getCurrentDateString(),
      time: nowTime,
      checkInTime: nowTime,
      sessionType: "in_clinic",
      clinicalNotes: "Walk-in patient check-in at clinic reception"
    });
    setIsWalkInModalOpen(true);
  };

  const handleSaveWalkInSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientForWalkIn) return;

    const trimmedArrival = walkInForm.checkInTime.trim();
    const parsedArrival = parseAndFormatTime(trimmedArrival);
    if (!parsedArrival.isValid) {
      toast({
        title: "Invalid Arrival Time",
        description: "Arrival Time must be a valid time format only (e.g., '10:30 AM' or '1:54 PM'). Arbitrary text or characters cannot be stored.",
        variant: "destructive",
      });
      return;
    }

    setActionLoading("creating-walkin");
    try {
      await bookPatientSession(selectedPatientForWalkIn._id, {
        date: walkInForm.date,
        time: parsedArrival.formatted,
        sessionType: walkInForm.sessionType,
        checkInTime: parsedArrival.formatted,
        status: "in_progress",
        clinicalNotes: walkInForm.clinicalNotes.trim()
      });

      toast({
        title: "Walk-In Session Registered!",
        description: `Walk-in session logged for ${selectedPatientForWalkIn.firstName} ${selectedPatientForWalkIn.lastName} with arrival check-in at ${parsedArrival.formatted}.`,
      });

      setIsWalkInModalOpen(false);
      await fetchSessionData(true);
    } catch (err: any) {
      console.error("Error creating walk-in session:", err);
      toast({
        title: "Walk-in Registration Failed",
        description: err.message || "Could not register walk-in session.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenReportModal = (patient: PatientRecord, sessionIndex: number) => {
    const session = patient.sessions?.[sessionIndex];
    setSelectedPatientForReport(patient);
    setSelectedSessionIndex(sessionIndex);
    setReportStep(1);

    const isPrepaid = patient.activePackage?.paymentOption === "pay_per_package";
    const sessionFee = session?.amount || patient.activePackage?.pricePerSession || 700;

    setReportForm({
      treatmentAdministered: session?.report?.treatmentAdministered || session?.clinicalNotes || "",
      painLevelBefore: session?.report?.painLevelBefore ?? 7,
      painLevelAfter: session?.report?.painLevelAfter ?? 3,
      progressNotes: session?.report?.progressNotes || "",
      homeExercisesRecommended: session?.report?.homeExercisesRecommended || "",
      therapistName: session?.report?.therapistName || "Dr. Attending Physiotherapist",
      paymentStatus: (session?.paymentStatus || (isPrepaid ? "paid" : "paid")) as any,
      paymentMethod: (session?.paymentMethod || (isPrepaid ? "package_covered" : "upi")) as any,
      transactionId: session?.transactionId || "",
      paidAmount: session?.paidAmount !== undefined ? session.paidAmount : sessionFee,
      paymentDate: session?.paymentDate ? new Date(session.paymentDate).toISOString().split("T")[0] : getCurrentDateString(),
      paymentNotes: session?.paymentNotes || ""
    });

    setIsReportModalOpen(true);
  };

  const handleNextToPaymentStep = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!reportForm.treatmentAdministered.trim()) {
      toast({
        title: "Required Field Missing",
        description: "Please specify the treatment administered during this therapy session.",
        variant: "destructive",
      });
      return;
    }

    if (!reportForm.progressNotes.trim()) {
      toast({
        title: "Required Field Missing",
        description: "Please provide clinical progress notes for the patient's record.",
        variant: "destructive",
      });
      return;
    }

    setReportStep(2);
  };

  const handleSaveSessionReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientForReport) return;

    if (!reportForm.treatmentAdministered.trim()) {
      setReportStep(1);
      toast({
        title: "Required Field Missing",
        description: "Please specify the treatment administered during this therapy session.",
        variant: "destructive",
      });
      return;
    }

    if (!reportForm.progressNotes.trim()) {
      setReportStep(1);
      toast({
        title: "Required Field Missing",
        description: "Please provide clinical progress notes for the patient's record.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingReport(true);
    try {
      const isPrepaid = selectedPatientForReport.activePackage?.paymentOption === "pay_per_package";
      const payload = {
        status: "completed" as const,
        paymentStatus: reportForm.paymentStatus,
        paymentMethod: isPrepaid ? "package_covered" : reportForm.paymentMethod,
        transactionId: (reportForm.paymentStatus === 'paid' && reportForm.paymentMethod !== 'cash' && !isPrepaid) 
          ? (reportForm.transactionId.trim() || undefined) 
          : undefined,
        paidAmount: reportForm.paymentStatus === 'paid' ? Number(reportForm.paidAmount) : 0,
        paymentDate: reportForm.paymentStatus === 'paid' ? reportForm.paymentDate : undefined,
        paymentNotes: reportForm.paymentNotes.trim() || undefined,
        report: {
          treatmentAdministered: reportForm.treatmentAdministered.trim(),
          painLevelBefore: Math.max(1, Math.min(10, Number(reportForm.painLevelBefore) || 7)),
          painLevelAfter: Math.max(1, Math.min(10, Number(reportForm.painLevelAfter) || 3)),
          progressNotes: reportForm.progressNotes.trim(),
          homeExercisesRecommended: reportForm.homeExercisesRecommended.trim(),
          therapistName: reportForm.therapistName.trim() || "Attending Physiotherapist",
          completedAt: new Date().toISOString()
        }
      };

      await updatePatientSession(selectedPatientForReport._id, selectedSessionIndex, payload as any);

      toast({
        title: "Session Completed & Saved!",
        description: `Clinical report and payment records for Session #${selectedSessionIndex + 1} saved successfully.`,
      });

      setIsReportModalOpen(false);
      fetchSessionData(true);
    } catch (err: any) {
      console.error("Error saving session report:", err);
      toast({
        title: "Error saving report",
        description: err.message || "Failed to save session report.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // Standalone Quick Payment Modal Handlers
  const handleOpenPaymentModal = (patient: PatientRecord, sessionIndex: number) => {
    const session = patient.sessions?.[sessionIndex];
    setSelectedPatientForPayment(patient);
    setSelectedPaymentSessionIndex(sessionIndex);

    const isPrepaid = patient.activePackage?.paymentOption === "pay_per_package";
    const defaultAmount = session?.amount || patient.activePackage?.pricePerSession || 700;

    setStandalonePaymentForm({
      paymentStatus: (session?.paymentStatus || (isPrepaid ? "paid" : "paid")) as any,
      paymentMethod: (session?.paymentMethod || (isPrepaid ? "package_covered" : "upi")) as any,
      transactionId: session?.transactionId || "",
      paidAmount: session?.paidAmount !== undefined ? session.paidAmount : defaultAmount,
      paymentDate: session?.paymentDate ? new Date(session.paymentDate).toISOString().split("T")[0] : getCurrentDateString(),
      paymentNotes: session?.paymentNotes || ""
    });

    setIsPaymentModalOpen(true);
  };

  const handleSaveStandalonePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientForPayment) return;

    setIsSubmittingPayment(true);
    try {
      const isPrepaid = selectedPatientForPayment.activePackage?.paymentOption === "pay_per_package";
      const payload = {
        paymentStatus: standalonePaymentForm.paymentStatus,
        paymentMethod: isPrepaid ? "package_covered" : standalonePaymentForm.paymentMethod,
        transactionId: (standalonePaymentForm.paymentStatus === 'paid' && standalonePaymentForm.paymentMethod !== 'cash' && !isPrepaid) 
          ? (standalonePaymentForm.transactionId.trim() || undefined) 
          : undefined,
        paidAmount: standalonePaymentForm.paymentStatus === 'paid' ? Number(standalonePaymentForm.paidAmount) : 0,
        paymentDate: standalonePaymentForm.paymentStatus === 'paid' ? standalonePaymentForm.paymentDate : undefined,
        paymentNotes: standalonePaymentForm.paymentNotes.trim() || undefined,
      };

      await updatePatientSession(selectedPatientForPayment._id, selectedPaymentSessionIndex, payload as any);

      toast({
        title: "Payment Details Saved!",
        description: `Payment records updated for Session #${selectedPaymentSessionIndex + 1}.`,
      });

      setIsPaymentModalOpen(false);
      fetchSessionData(true);
    } catch (err: any) {
      console.error("Error updating payment:", err);
      toast({
        title: "Payment Update Failed",
        description: err.message || "Failed to update session payment.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const filteredPatients = patients.filter((p) => {
    const query = searchQuery.toLowerCase();
    const name = `${p.firstName} ${p.lastName}`.toLowerCase();
    const phone = p.phone || "";
    const email = p.email?.toLowerCase() || "";
    return name.includes(query) || phone.includes(query) || email.includes(query);
  });

  const selectedPatientPkg = selectedPatientForReport?.activePackage;
  const isSelectedPatientPrepaid = selectedPatientPkg?.paymentOption === "pay_per_package";
  const sessionFeeAmount =
    selectedPatientForReport?.sessions?.[selectedSessionIndex]?.amount ||
    selectedPatientPkg?.pricePerSession ||
    700;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <CalendarCheck2 className="h-8 w-8 text-teal-600" />
              Patient Session Management & Check-In Desk
            </h1>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
              userRole === "receptionist"
                ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                : "bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30"
            }`}>
              {userRole === "receptionist" ? (
                <span className="inline-flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> Receptionist Desk</span>
              ) : (
                <span className="inline-flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" /> Doctor & Admin</span>
              )}
            </span>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            {userRole === "receptionist"
              ? "Record arrival check-in time and leave time for converted walk-in patients. Clinical session reports and treatment notes are handled by the doctor."
              : "Track therapy sessions, log arrival/departure timings, and generate doctor clinical progress reports for completed patient visits."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchSessionData(true)}
            disabled={loading || refreshing}
            className="gap-2 h-9"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* 4 SUMMARY SESSION KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 bg-card border border-border/80 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
            <span>Patients on Plans</span>
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-700 flex items-center justify-center">
              <User className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-foreground mt-2">
            {loading ? "..." : patients.length}
          </div>
          <span className="text-[11px] text-muted-foreground mt-0.5 block">Care package holders</span>
        </div>

        <div className="p-4 bg-card border border-border/80 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
            <span>Completed Visits</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-400 mt-2">
            {loading ? "..." : patients.reduce((acc, p) => acc + (p.sessions?.filter(s => s.status === 'completed').length || 0), 0)}
          </div>
          <span className="text-[11px] text-emerald-600/80 mt-0.5 block">Delivered therapy visits</span>
        </div>

        <div className="p-4 bg-card border border-border/80 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
            <span>Active Check-Ins</span>
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-700 flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-sky-700 dark:text-sky-400 mt-2">
            {loading ? "..." : patients.reduce((acc, p) => acc + (p.sessions?.filter(s => s.status === 'in_progress').length || 0), 0)}
          </div>
          <span className="text-[11px] text-muted-foreground mt-0.5 block">Currently in session</span>
        </div>

        <div className="p-4 bg-card border border-border/80 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
            <span>Remaining Visits</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center">
              <CalendarCheck2 className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-foreground mt-2">
            {loading ? "..." : patients.reduce((acc, p) => {
              const total = p.activePackage?.totalSessions || 1;
              const comp = p.sessions?.filter(s => s.status === 'completed').length || 0;
              return acc + Math.max(0, total - comp);
            }, 0)}
          </div>
          <span className="text-[11px] text-muted-foreground mt-0.5 block">Scheduled & upcoming</span>
        </div>
      </div>

      {/* SEARCH BAR & STATS */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-card p-4 rounded-xl border">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground text-lg">{patients.length}</span> Converted Patients with Active Care Packages
        </div>

        <div className="relative md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search patient by name, phone, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

      {/* PATIENTS AND SESSIONS LIST */}
      {loading ? (
        <div className="p-12 text-center flex flex-col items-center justify-center gap-3 bg-card rounded-2xl border">
          <RefreshCw className="h-8 w-8 text-teal-600 animate-spin" />
          <p className="text-sm text-muted-foreground">Loading patient session records...</p>
        </div>
      ) : filteredPatients.length === 0 ? (
        <div className="p-16 text-center max-w-md mx-auto flex flex-col items-center justify-center bg-card rounded-2xl border">
          <CalendarCheck2 className="h-10 w-10 text-muted-foreground mb-3" />
          <h3 className="font-semibold text-lg">No patient records found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {searchQuery ? "No patients match your search query." : "Convert completed bookings to patient profiles in Appointments to track sessions."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPatients.map((patient) => {
            const isExpanded = expandedPatientId === patient._id;
            const sessionsList = patient.sessions || [];
            const completedCount = sessionsList.filter(s => s.status === 'completed').length;
            const totalPkgSessions = patient.activePackage?.totalSessions || (sessionsList.length > 0 ? sessionsList.length : 1);

            return (
              <div key={patient._id} className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden transition-all">
                {/* PATIENT SUMMARY CARD HEADER */}
                <div
                  onClick={() => setExpandedPatientId(isExpanded ? null : patient._id)}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-teal-500/10 text-teal-600 flex items-center justify-center font-bold text-base shrink-0 border border-teal-500/20">
                      {patient.firstName[0]}{patient.lastName[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-base text-foreground">
                          {patient.firstName} {patient.lastName}
                        </h3>
                        <Badge variant="outline" className="text-xs px-2 py-0 border-teal-500/30 text-teal-700 dark:text-teal-300 font-semibold">
                          {patient.activePackage ? patient.activePackage.title : "Package Active"}
                        </Badge>
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] font-bold">
                          Initial Assessment Done (₹750)
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                        <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3 text-teal-600" /> {patient.phone}</span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3 text-teal-600" /> {patient.email}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-center">
                    <div className="text-right">
                      <div className="flex items-center gap-1.5 justify-end">
                        <Badge className="bg-teal-500/10 text-teal-700 border-teal-500/20 font-bold px-2.5 py-0.5">
                          {completedCount} / {totalPkgSessions} Package Sessions
                        </Badge>
                      </div>
                      <span className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1 justify-end">
                        <span>Modality:</span>
                        {patient.activePackage?.sessionType === 'online' ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-foreground"><Video className="h-3 w-3 text-teal-600" /> Online Video</span>
                        ) : patient.activePackage?.sessionType === 'home_visit' ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-foreground"><Home className="h-3 w-3 text-teal-600" /> Home Visit</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-semibold text-foreground"><Building2 className="h-3 w-3 text-teal-600" /> In-Clinic</span>
                        )}
                      </span>
                    </div>

                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>
                </div>

                {/* EXPANDABLE SESSIONS LIST UNDER THIS PATIENT */}
                {isExpanded && (
                  <div className="border-t bg-muted/10 p-5 space-y-4 animate-in fade-in duration-200">
                    {/* Initial Appointment Summary */}
                    {patient.initialConsultation && (
                      <div className="bg-teal-500/5 p-4 rounded-xl border border-teal-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 font-bold text-teal-900 dark:text-teal-200">
                            <Stethoscope className="h-4 w-4 text-teal-600" />
                            <span>Initial Consultation & Clinical Assessment</span>
                            <Badge className="bg-emerald-500/20 text-emerald-600 text-[10px]">COMPLETED</Badge>
                          </div>
                          <p className="text-muted-foreground italic">
                            Findings: {patient.initialConsultation.assessmentSummary || "Clinical physical examination and evaluation completed."}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-extrabold text-foreground text-sm">₹{patient.initialConsultation.paymentAmount || 750}</span>
                          <span className="text-[11px] text-muted-foreground block uppercase font-semibold">
                            {patient.initialConsultation.paymentMethod || 'UPI'} • {patient.initialConsultation.paymentStatus || 'PAID'}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                          <Activity className="h-4 w-4 text-teal-600" />
                          Therapy Package Sessions ({sessionsList.length})
                        </h4>
                        <span className="text-[11px] text-muted-foreground">
                          Record patient arrival check-in and leave times for walk-in visits
                        </span>
                      </div>

                      <Button
                        size="sm"
                        onClick={() => handleOpenWalkInModal(patient)}
                        className="bg-teal-600 hover:bg-teal-700 text-white text-xs h-8 gap-1.5 font-bold shadow-sm"
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        + Clinic Session Check-In
                      </Button>
                    </div>

                    {sessionsList.length === 0 ? (
                      <div className="p-8 text-center bg-card rounded-xl border border-dashed text-xs text-muted-foreground space-y-2">
                        <CalendarCheck2 className="h-8 w-8 mx-auto text-teal-600/60 mb-2" />
                        <p className="font-semibold text-foreground text-sm">No therapy sessions scheduled yet</p>
                        <p>When the patient walks in for therapy, click <strong>"+ Clinic Session Check-In"</strong> to log their arrival.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                      {sessionsList.map((session, sIdx) => {
                        const isCompleted = session.status === 'completed';
                        const isInProgress = session.status === 'in_progress';
                        const hasReport = Boolean(session.report && session.report.treatmentAdministered);
                        const isActionActive = actionLoading?.startsWith(`${patient._id}-${sIdx}`);

                        return (
                          <div
                            key={sIdx}
                            className={`p-4 rounded-xl border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                              isInProgress 
                                ? "bg-amber-500/5 border-amber-500/30" 
                                : isCompleted 
                                ? "bg-card border-border" 
                                : "bg-card border-border"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                                isCompleted 
                                  ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" 
                                  : isInProgress
                                  ? "bg-amber-500/15 text-amber-700 border border-amber-500/30 animate-pulse"
                                  : "bg-teal-500/10 text-teal-700 border border-teal-500/20"
                              }`}>
                                #{session.sessionNumber}
                              </div>

                              <div className="space-y-1.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-sm text-foreground">
                                    Session #{session.sessionNumber}
                                  </span>

                                  {session.sessionType === 'online' ? (
                                    <Badge className="bg-sky-500/10 text-sky-600 border-sky-500/20 gap-1 text-[10px]">
                                      <Video className="h-3 w-3" /> Online
                                    </Badge>
                                  ) : session.sessionType === 'home_visit' ? (
                                    <Badge className="bg-amber-500/10 text-amber-700 border-amber-500/20 gap-1 text-[10px]">
                                      <Home className="h-3 w-3" /> Home Visit
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-teal-500/10 text-teal-700 border-teal-500/20 gap-1 text-[10px]">
                                      <Building2 className="h-3 w-3" /> In-Clinic
                                    </Badge>
                                  )}

                                  <Badge className={`uppercase text-[10px] font-bold ${
                                    isCompleted 
                                      ? "bg-emerald-500/15 text-emerald-600 border border-emerald-500/30" 
                                      : isInProgress
                                      ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40"
                                      : "bg-teal-500/15 text-teal-700 border border-teal-500/30"
                                  }`}>
                                    {session.status === 'in_progress' ? (
                                      <span className="inline-flex items-center gap-1">
                                        <Clock className="h-3 w-3" /> In Progress
                                      </span>
                                    ) : session.status}
                                  </Badge>

                                  <button
                                    type="button"
                                    onClick={() => handleOpenPaymentModal(patient, sIdx)}
                                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border transition-all flex items-center gap-1 cursor-pointer hover:opacity-90 ${
                                      session.paymentStatus === 'paid'
                                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                                        : "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40"
                                    }`}
                                    title="Click to view or record payment details"
                                  >
                                    <IndianRupee className="h-2.5 w-2.5" />
                                    <span>{session.paidAmount !== undefined ? session.paidAmount : session.amount}</span>
                                    <span>•</span>
                                    <span className="uppercase">{session.paymentStatus || 'pending'}</span>
                                    {session.paymentStatus === 'paid' && session.paymentMethod && (
                                      <span className="text-[9px] opacity-80 uppercase font-medium">
                                        ({session.paymentMethod === 'upi' ? 'UPI' : session.paymentMethod === 'cash' ? 'Cash' : session.paymentMethod === 'card' ? 'Card' : session.paymentMethod === 'package_covered' ? 'Package' : session.paymentMethod}{session.transactionId ? ` #${session.transactionId.slice(-4)}` : ''})
                                      </span>
                                    )}
                                  </button>
                                </div>

                                <div className="text-xs text-muted-foreground flex items-center gap-3 flex-wrap">
                                  <span className="inline-flex items-center gap-1 font-medium">
                                    <Calendar className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                                    {session.date}
                                  </span>
                                  <span className="inline-flex items-center gap-1 font-medium">
                                    <Clock className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                                    Slot: {session.time}
                                  </span>
                                </div>

                                {/* TIMINGS BADGES: CHECK-IN & LEAVE TIME */}
                                <div className="flex items-center gap-2 flex-wrap pt-1">
                                  {session.checkInTime ? (
                                    <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[11px] font-bold gap-1">
                                      <LogIn className="h-3 w-3 text-emerald-600" />
                                      Check-In: {session.checkInTime}
                                    </Badge>
                                  ) : (
                                    <span className="text-[11px] text-muted-foreground italic inline-flex items-center gap-1">
                                      <Clock className="h-3 w-3 text-muted-foreground" />
                                      Awaiting Check-In
                                    </span>
                                  )}

                                  {session.leaveTime ? (
                                    <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 text-[11px] font-bold gap-1">
                                      <DoorOpen className="h-3 w-3 text-rose-600" />
                                      Left: {session.leaveTime}
                                    </Badge>
                                  ) : session.checkInTime ? (
                                    <Badge variant="outline" className="text-[11px] border-amber-500/30 text-amber-600 gap-1">
                                      <Clock className="h-3 w-3" /> In Clinic
                                    </Badge>
                                  ) : null}
                                </div>

                                {/* Quick Preview of Clinical Notes / Report */}
                                {hasReport ? (
                                  <div className="text-xs text-foreground bg-muted/40 p-2.5 rounded-lg border border-border/60 mt-1 max-w-xl">
                                    <div className="font-semibold text-teal-700 dark:text-teal-300 flex items-center gap-1.5 mb-0.5">
                                      <Stethoscope className="h-3.5 w-3.5" />
                                      Doctor Report: {session.report?.treatmentAdministered}
                                    </div>
                                    <p className="text-muted-foreground line-clamp-1 italic">
                                      Progress: {session.report?.progressNotes}
                                    </p>
                                  </div>
                                ) : session.clinicalNotes ? (
                                  <p className="text-xs text-muted-foreground italic mt-1">
                                    Notes: {session.clinicalNotes}
                                  </p>
                                ) : null}
                              </div>
                            </div>

                            {/* ACTION BUTTONS */}
                            <div className="flex flex-wrap items-center gap-2 self-end md:self-center shrink-0">
                              {/* 1. CHECK IN BUTTON (Available before report exists) */}
                              {!hasReport && !session.checkInTime && (
                                <Button
                                  size="sm"
                                  disabled={isActionActive}
                                  onClick={() => handleQuickCheckIn(patient, sIdx)}
                                  className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm"
                                  title="Record arrival check-in time right now"
                                >
                                  <LogIn className="h-3.5 w-3.5" />
                                  Check In
                                </Button>
                              )}

                              {/* 2. RECORD LEAVE TIME BUTTON (Available before report exists) */}
                              {!hasReport && session.checkInTime && !session.leaveTime && (
                                <Button
                                  size="sm"
                                  disabled={isActionActive}
                                  onClick={() => handleQuickLeave(patient, sIdx)}
                                  className="h-8 text-xs gap-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-sm"
                                  title="Record patient departure leave time"
                                >
                                  <DoorOpen className="h-3.5 w-3.5" />
                                  Record Leave
                                </Button>
                              )}

                              {/* 3. TIME ADJUSTMENT BUTTON - Only if no clinical report written yet */}
                              {!hasReport && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenTimeModal(patient, sIdx)}
                                  className="h-8 text-xs gap-1 border-muted-foreground/20 hover:bg-muted text-muted-foreground"
                                  title="Adjust Check-in and Leave times"
                                >
                                  <Clock className="h-3.5 w-3.5" />
                                  Times
                                </Button>
                              )}

                              {/* 4. VIEW DOCTOR REPORT (When report exists - only action shown here) */}
                              {hasReport && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setViewingSession({
                                      patient,
                                      sessionIndex: sIdx,
                                      patientName: `${patient.firstName} ${patient.lastName}`,
                                      sessionNumber: session.sessionNumber,
                                      date: session.date,
                                      sessionType: session.sessionType,
                                      checkInTime: session.checkInTime,
                                      leaveTime: session.leaveTime,
                                      report: session.report,
                                      paymentStatus: session.paymentStatus,
                                      paymentMethod: session.paymentMethod,
                                      transactionId: session.transactionId,
                                      amount: session.amount,
                                      paidAmount: session.paidAmount,
                                      paymentDate: session.paymentDate,
                                      paymentNotes: session.paymentNotes,
                                    });
                                    setIsViewReportOpen(true);
                                  }}
                                  className="gap-1.5 text-xs h-8 border-teal-500/30 text-teal-700 dark:text-teal-300 hover:bg-teal-500/10 font-bold shadow-xs"
                                >
                                  <FileText className="h-3.5 w-3.5" />
                                  View Doctor Rx
                                </Button>
                              )}

                              {/* 5. INITIAL CLINICAL REPORT (Shown only when report does not exist yet) */}
                              {!hasReport && userRole === "admin" && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleOpenReportModal(patient, sIdx)}
                                  className="gap-1.5 text-xs h-8 bg-teal-600 hover:bg-teal-700 text-white shadow-sm font-bold"
                                >
                                  <Stethoscope className="h-3.5 w-3.5" />
                                  Clinical Report
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* CHECK-IN & LEAVE TIME ADJUSTMENT DIALOG */}
      <Dialog open={isTimeModalOpen} onOpenChange={setIsTimeModalOpen}>
        <DialogContent className="max-w-md w-full bg-card border-teal-500/30 shadow-2xl rounded-2xl sm:rounded-3xl p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
              <Clock className="h-5 w-5 text-teal-600" />
              Adjust Patient Check-In & Leave Time
            </DialogTitle>
            <DialogDescription>
              Patient: <strong>{selectedPatientForTime?.firstName} {selectedPatientForTime?.lastName}</strong> (Session #{selectedTimeSessionIndex + 1})
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveTimeModal} className="space-y-4 py-2 text-xs">
            <div className="space-y-1.5">
              <label className="font-bold text-foreground flex items-center justify-between">
                <span>Arrival Check-In Time</span>
                <button
                  type="button"
                  onClick={() => setTimeForm({ ...timeForm, checkInTime: getCurrentTimeString() })}
                  className="text-primary hover:underline text-[11px] font-normal"
                >
                  Set to Now ({getCurrentTimeString()})
                </button>
              </label>
              <TimePicker
                value={timeForm.checkInTime}
                onChange={(val) => setTimeForm({ ...timeForm, checkInTime: val })}
                placeholder="Select arrival check-in time"
                error={Boolean(timeForm.checkInTime.trim() && !isValidTimeString(timeForm.checkInTime))}
              />
              {timeForm.checkInTime.trim() && !isValidTimeString(timeForm.checkInTime) && (
                <p className="text-[11px] text-red-500 font-medium">
                  Please enter a valid time only (e.g., 10:30 AM or 1:54 PM).
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-foreground flex items-center justify-between">
                <span>Departure Leave Time</span>
                <button
                  type="button"
                  onClick={() => setTimeForm({ ...timeForm, leaveTime: getCurrentTimeString() })}
                  className="text-primary hover:underline text-[11px] font-normal"
                >
                  Set to Now ({getCurrentTimeString()})
                </button>
              </label>
              <TimePicker
                value={timeForm.leaveTime}
                onChange={(val) => setTimeForm({ ...timeForm, leaveTime: val })}
                placeholder="Select departure leave time"
                error={Boolean(timeForm.leaveTime.trim() && !isValidTimeString(timeForm.leaveTime))}
              />
              {timeForm.leaveTime.trim() && !isValidTimeString(timeForm.leaveTime) && (
                <p className="text-[11px] text-red-500 font-medium">
                  Please enter a valid time only (e.g., 11:15 AM or 2:30 PM).
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-foreground block">Session Status</label>
              <Select
                value={timeForm.status}
                onValueChange={(val: any) => setTimeForm({ ...timeForm, status: val })}
              >
                <SelectTrigger className="w-full h-9 rounded-xl border border-input bg-background text-xs font-semibold">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent className="z-[9999] bg-card border border-border shadow-xl rounded-xl">
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="in_progress">In Progress (Patient in Clinic)</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="border-t pt-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsTimeModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={actionLoading === "saving-time"}
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold"
              >
                Save Timings
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* WALK-IN SESSION CREATION DIALOG */}
      <Dialog open={isWalkInModalOpen} onOpenChange={setIsWalkInModalOpen}>
        <DialogContent className="max-w-md w-full bg-card border-amber-500/30 shadow-2xl rounded-2xl sm:rounded-3xl p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Clock className="h-4 w-4 text-teal-600" />
              Register Clinic Patient Session Check-In
            </DialogTitle>
            <DialogDescription>
              Register an immediate walk-in therapy session for{" "}
              <strong>{selectedPatientForWalkIn?.firstName} {selectedPatientForWalkIn?.lastName}</strong>.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveWalkInSession} className="space-y-4 py-2 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-bold text-foreground block">
                  Session Date <span className="text-red-500 font-bold ml-0.5">*</span>
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={`w-full h-9 justify-start text-left text-xs font-semibold bg-background border ${
                        !walkInForm.date ? "text-muted-foreground" : "text-foreground"
                      } focus:ring-2 focus:ring-amber-500`}
                    >
                      <Calendar className="mr-2 h-3.5 w-3.5 text-amber-600 shrink-0" />
                      {walkInForm.date ? (
                        format(new Date(walkInForm.date + "T00:00:00"), "EEE, MMM d, yyyy")
                      ) : (
                        <span>Select session date...</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-[9999] bg-card border border-border shadow-2xl rounded-2xl" align="start">
                    <CalendarWidget
                      mode="single"
                      selected={walkInForm.date ? new Date(walkInForm.date + "T00:00:00") : undefined}
                      onSelect={(date) => {
                        if (date) {
                          setWalkInForm(prev => ({ ...prev, date: format(date, "yyyy-MM-dd") }));
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-foreground block">
                    Arrival Time <span className="text-red-500 font-bold ml-0.5">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const now = getCurrentTimeString();
                      setWalkInForm({ ...walkInForm, checkInTime: now, time: now });
                    }}
                    className="text-primary hover:underline text-[11px] font-normal"
                  >
                    Set to Now ({getCurrentTimeString()})
                  </button>
                </div>
                <TimePicker
                  value={walkInForm.checkInTime}
                  onChange={(val) => setWalkInForm({ ...walkInForm, checkInTime: val, time: val })}
                  placeholder="Select arrival time"
                  error={Boolean(walkInForm.checkInTime.trim() && !isValidTimeString(walkInForm.checkInTime))}
                />
                {walkInForm.checkInTime.trim() && !isValidTimeString(walkInForm.checkInTime) && (
                  <p className="text-[11px] text-red-500 font-medium">
                    Please enter a valid time only (e.g., 10:30 AM or 1:54 PM).
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-foreground block">Session Type</label>
              <Select
                value={walkInForm.sessionType}
                onValueChange={(val: any) => setWalkInForm({ ...walkInForm, sessionType: val })}
              >
                <SelectTrigger className="w-full h-9 rounded-xl border border-input bg-background text-xs font-semibold focus:ring-2 focus:ring-amber-500">
                  <SelectValue placeholder="Select Session Type" />
                </SelectTrigger>
                <SelectContent className="z-[9999] bg-card border border-border shadow-xl rounded-xl">
                  <SelectItem value="in_clinic">In-Clinic Visit</SelectItem>
                  <SelectItem value="home_visit">In-Person Home Visit</SelectItem>
                  <SelectItem value="online">Online Video Session</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-foreground block">Front Desk / Intake Notes</label>
              <Input
                value={walkInForm.clinicalNotes}
                onChange={(e) => setWalkInForm({ ...walkInForm, clinicalNotes: e.target.value })}
                placeholder="Notes for attending doctor"
                className="h-9"
              />
            </div>

            <DialogFooter className="border-t pt-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsWalkInModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={actionLoading === "creating-walkin"}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold gap-1.5"
              >
                <LogIn className="h-4 w-4" />
                Check In Patient Now
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DOCTOR SESSION PROGRESS REPORT & PAYMENT DIALOG (2-Step Flow) */}
      <Dialog open={isReportModalOpen} onOpenChange={setIsReportModalOpen}>
        <DialogContent className="max-w-2xl w-full bg-card border-teal-500/30 shadow-2xl rounded-2xl sm:rounded-3xl p-4 sm:p-6">
          <DialogHeader className="pr-10 sm:pr-14">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2 text-xl font-bold text-teal-700 dark:text-teal-300">
                <Stethoscope className="h-6 w-6 text-teal-600" />
                Clinical Session Report & Completion
              </DialogTitle>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20 mr-2 sm:mr-4 shrink-0">
                Session #{selectedSessionIndex + 1}
              </span>
            </div>
            <DialogDescription>
              Patient: <strong>{selectedPatientForReport?.firstName} {selectedPatientForReport?.lastName}</strong> • Date: {selectedPatientForReport?.sessions?.[selectedSessionIndex]?.date || getCurrentDateString()}
            </DialogDescription>
          </DialogHeader>

          {/* STEPPER TABS */}
          <div className="flex flex-wrap items-center gap-2 border-b pb-3 pt-1">
            <button
              type="button"
              onClick={() => setReportStep(1)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                reportStep === 1
                  ? "bg-teal-600 text-white shadow-xs"
                  : "bg-muted/70 text-muted-foreground hover:bg-muted"
              }`}
            >
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                reportStep === 1 ? "bg-white text-teal-700 font-black" : "bg-muted-foreground/20 text-foreground"
              }`}>1</span>
              <span>Clinical Notes & Treatment</span>
            </button>

            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />

            <button
              type="button"
              onClick={() => handleNextToPaymentStep()}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                reportStep === 2
                  ? "bg-teal-600 text-white shadow-xs"
                  : "bg-muted/70 text-muted-foreground hover:bg-muted"
              }`}
            >
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                reportStep === 2 ? "bg-white text-teal-700 font-black" : "bg-muted-foreground/20 text-foreground"
              }`}>2</span>
              <span>Billing & Payment Collection</span>
            </button>
          </div>

          <form onSubmit={handleSaveSessionReport} className="space-y-4 py-1 text-xs">
            {reportStep === 1 ? (
              /* STEP 1: CLINICAL EVALUATION */
              <div className="space-y-4 animate-in fade-in-50 duration-200">
                {/* Treatment Administered */}
                <div className="space-y-1.5">
                  <label className="font-bold text-foreground uppercase tracking-wider block">
                    1. Treatment & Exercises Administered Today <span className="text-red-500 font-bold ml-0.5">*</span>
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={reportForm.treatmentAdministered}
                    onChange={(e) => setReportForm({ ...reportForm, treatmentAdministered: e.target.value })}
                    placeholder="e.g., Cervical traction, thoracic spine mobilization, postural scapular retraction drills..."
                    className="w-full p-3 rounded-xl border border-input bg-background text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                {/* Pain Score Before & After */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 bg-muted/40 p-3 sm:p-3.5 rounded-2xl border">
                  <div>
                    <label className="font-bold text-foreground block mb-1">
                      Pain Score Before Session (1-10)
                    </label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={0}
                        max={10}
                        value={reportForm.painLevelBefore}
                        onChange={(e) => setReportForm({ ...reportForm, painLevelBefore: Number(e.target.value) })}
                        className="h-9 font-bold text-amber-600"
                      />
                      <span className="text-muted-foreground font-semibold">/ 10</span>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-foreground block mb-1">
                      Pain Score After Session (1-10)
                    </label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={0}
                        max={10}
                        value={reportForm.painLevelAfter}
                        onChange={(e) => setReportForm({ ...reportForm, painLevelAfter: Number(e.target.value) })}
                        className="h-9 font-bold text-emerald-600"
                      />
                      <span className="text-muted-foreground font-semibold">/ 10</span>
                    </div>
                  </div>
                </div>

                {/* Clinical Observations & Progress Notes */}
                <div className="space-y-1.5">
                  <label className="font-bold text-foreground uppercase tracking-wider block">
                    2. Clinical Observations & Progress Notes <span className="text-red-500 font-bold ml-0.5">*</span>
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={reportForm.progressNotes}
                    onChange={(e) => setReportForm({ ...reportForm, progressNotes: e.target.value })}
                    placeholder="e.g., Patient responded well to lumbar traction. Flexion range improved by 20 degrees without spasm..."
                    className="w-full p-3 rounded-xl border border-input bg-background text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                {/* Prescribed Home Exercises */}
                <div className="space-y-1.5">
                  <label className="font-bold text-foreground uppercase tracking-wider block">
                    3. Home Exercises & Advice Prescribed for Patient
                  </label>
                  <textarea
                    rows={2}
                    value={reportForm.homeExercisesRecommended}
                    onChange={(e) => setReportForm({ ...reportForm, homeExercisesRecommended: e.target.value })}
                    placeholder="e.g., Cat-camel mobility stretches twice daily; avoid prolonged forward neck bending..."
                    className="w-full p-3 rounded-xl border border-input bg-background text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                {/* Attending Doctor */}
                <div>
                  <label className="font-bold text-foreground block mb-1">
                    Attending Doctor / Physiotherapist
                  </label>
                  <Input
                    value={reportForm.therapistName}
                    onChange={(e) => setReportForm({ ...reportForm, therapistName: e.target.value })}
                    placeholder="Doctor Name"
                    className="h-9"
                  />
                </div>

                <DialogFooter className="border-t pt-4 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between w-full gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setIsReportModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleNextToPaymentStep}
                    className="bg-teal-600 hover:bg-teal-700 text-white gap-2 font-bold shadow-sm"
                  >
                    <span>Next: Payment & Billing</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </DialogFooter>
              </div>
            ) : (
              /* STEP 2: PAYMENT & BILLING COLLECTION */
              <div className="space-y-4 animate-in fade-in-50 duration-200">
                {/* Plan Summary Banner */}
                <div className="p-3.5 bg-muted/40 rounded-2xl border flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Session Billing Plan</span>
                    <span className="font-bold text-foreground text-sm flex items-center gap-1.5">
                      <Package className="h-4 w-4 text-teal-600" />
                      {isSelectedPatientPrepaid 
                        ? (selectedPatientPkg?.title || "Prepaid Package") 
                        : "Pay Per Session Care Plan"}
                    </span>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                    isSelectedPatientPrepaid
                      ? "bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30"
                      : "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                  }`}>
                    {isSelectedPatientPrepaid ? "Covered in Prepaid Package" : `Fee: ₹${sessionFeeAmount}`}
                  </span>
                </div>

                {isSelectedPatientPrepaid ? (
                  /* PREPAID PACKAGE PATIENT */
                  <div className="p-4 bg-teal-500/10 border border-teal-500/20 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2 text-teal-800 dark:text-teal-200 font-bold text-sm">
                      <CheckCircle2 className="h-5 w-5 text-teal-600" />
                      Prepaid Package Active — ₹0 Due Today
                    </div>
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      This session is fully covered under the patient's prepaid package <strong>{selectedPatientPkg?.title}</strong>. No individual per-session fee collection is required at reception.
                    </p>
                    <div className="pt-2 border-t border-teal-500/20 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>Total Sessions in Plan: <strong>{selectedPatientPkg?.totalSessions}</strong></span>
                      <span>Total Package Value: <strong>₹{selectedPatientPkg?.totalAmount}</strong></span>
                    </div>
                  </div>
                ) : (
                  /* PAY PER SESSION COLLECTION */
                  <div className="space-y-4">
                    {/* Payment Status Selection */}
                    <div className="space-y-1.5">
                      <label className="font-bold text-foreground uppercase tracking-wider block">
                        Payment Status
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setReportForm({ ...reportForm, paymentStatus: "paid" })}
                          className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                            reportForm.paymentStatus === "paid"
                              ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-900 dark:text-emerald-200 shadow-xs ring-2 ring-emerald-500/30"
                              : "bg-card border-border hover:bg-muted/60 text-muted-foreground"
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                            reportForm.paymentStatus === "paid"
                              ? "bg-emerald-600 text-white"
                              : "bg-muted text-muted-foreground"
                          }`}>
                            <CheckCircle2 className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-bold text-xs text-foreground">Paid Now</div>
                            <div className="text-[10px] text-muted-foreground">Payment collected today</div>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setReportForm({ ...reportForm, paymentStatus: "pending" })}
                          className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                            reportForm.paymentStatus === "pending"
                              ? "bg-amber-500/10 border-amber-500/40 text-amber-900 dark:text-amber-200 shadow-xs ring-2 ring-amber-500/30"
                              : "bg-card border-border hover:bg-muted/60 text-muted-foreground"
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                            reportForm.paymentStatus === "pending"
                              ? "bg-amber-600 text-white"
                              : "bg-muted text-muted-foreground"
                          }`}>
                            <Clock className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-bold text-xs text-foreground">Pending Collection</div>
                            <div className="text-[10px] text-muted-foreground">Settle upon next visit</div>
                          </div>
                        </button>
                      </div>
                    </div>

                    {reportForm.paymentStatus === "paid" ? (
                      <div className="p-4 bg-muted/30 rounded-2xl border space-y-4 animate-in fade-in-50 duration-200">
                        {/* Payment Mode Selector */}
                        <div className="space-y-1.5">
                          <label className="font-bold text-foreground block">
                            Payment Mode / Method <span className="text-red-500 font-bold ml-0.5">*</span>
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { id: "upi", label: "UPI / QR", icon: QrCode },
                              { id: "cash", label: "Cash", icon: Banknote },
                            ].map((mode) => {
                              const IconComponent = mode.icon;
                              const isSelected = reportForm.paymentMethod === mode.id;
                              return (
                                <button
                                  key={mode.id}
                                  type="button"
                                  onClick={() => setReportForm({ ...reportForm, paymentMethod: mode.id as any })}
                                  className={`p-2.5 rounded-xl border text-center flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                                    isSelected
                                      ? "bg-teal-600 text-white border-teal-600 shadow-xs font-bold"
                                      : "bg-card border-input hover:bg-muted text-foreground font-medium"
                                  }`}
                                >
                                  <IconComponent className="h-4 w-4" />
                                  <span className="text-[11px]">{mode.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* UPI Transaction ID input */}
                        {reportForm.paymentMethod === "upi" && (
                          <div className="space-y-1.5 animate-in fade-in-50 duration-200">
                            <div className="flex items-center justify-between">
                              <label className="font-bold text-foreground block">
                                UPI Transaction ID / 12-Digit UTR Number
                              </label>
                              <span className="text-[10px] text-muted-foreground">Optional for reconciliation</span>
                            </div>
                            <Input
                              value={reportForm.transactionId}
                              onChange={(e) => setReportForm({ ...reportForm, transactionId: e.target.value })}
                              placeholder="e.g. 423981048291 (from GPay / PhonePe / Paytm)"
                              className="h-9 font-mono text-xs"
                            />
                            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Info className="h-3 w-3 text-teal-600 shrink-0" />
                              <span>Copy the 12-digit UPI UTR from the patient's payment app screen.</span>
                            </p>
                          </div>
                        )}

                        {/* Amount Collected & Payment Date */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="font-bold text-foreground block">
                              Amount Collected (₹)
                            </label>
                            <div className="relative">
                              <span className="absolute left-3 top-2 text-xs font-bold text-muted-foreground">₹</span>
                              <Input
                                type="number"
                                min={0}
                                value={reportForm.paidAmount}
                                onChange={(e) => setReportForm({ ...reportForm, paidAmount: Number(e.target.value) })}
                                className="pl-7 h-9 font-bold text-sm"
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="font-bold text-foreground block">
                              Payment Date
                            </label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="w-full h-9 justify-start text-left text-xs font-semibold bg-background border border-input focus:ring-2 focus:ring-teal-500"
                                >
                                  <Calendar className="mr-2 h-3.5 w-3.5 text-teal-600 shrink-0" />
                                  {reportForm.paymentDate ? (
                                    format(new Date(reportForm.paymentDate + "T00:00:00"), "EEE, MMM d, yyyy")
                                  ) : (
                                    <span className="text-muted-foreground">Select payment date...</span>
                                  )}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0 z-[9999] bg-card border border-border shadow-2xl rounded-2xl" align="start">
                                <CalendarWidget
                                  mode="single"
                                  selected={reportForm.paymentDate ? new Date(reportForm.paymentDate + "T00:00:00") : undefined}
                                  onSelect={(date) => {
                                    if (date) {
                                      setReportForm(prev => ({ ...prev, paymentDate: format(date, "yyyy-MM-dd") }));
                                    }
                                  }}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>

                        {/* Optional Payment Note */}
                        <div className="space-y-1">
                          <label className="font-bold text-foreground block">
                            Billing Remarks / Counter Note (Optional)
                          </label>
                          <Input
                            value={reportForm.paymentNotes}
                            onChange={(e) => setReportForm({ ...reportForm, paymentNotes: e.target.value })}
                            placeholder="e.g. Received at reception desk via clinic QR stand"
                            className="h-9 text-xs"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-2 animate-in fade-in-50 duration-200">
                        <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200 font-bold text-xs">
                          <AlertCircle className="h-4 w-4 text-amber-600" />
                          ₹{sessionFeeAmount} marked as Pending Receivable
                        </div>
                        <p className="text-muted-foreground text-xs">
                          The clinical session report will be saved and session marked completed. Front desk staff can record payment anytime via the <strong>Collect Fee</strong> button on the session card.
                        </p>
                        <Input
                          value={reportForm.paymentNotes}
                          onChange={(e) => setReportForm({ ...reportForm, paymentNotes: e.target.value })}
                          placeholder="Reason for pending payment (e.g. Forgot phone, will pay next session)"
                          className="h-9 text-xs mt-2"
                        />
                      </div>
                    )}
                  </div>
                )}

                <DialogFooter className="border-t pt-4 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between w-full gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setReportStep(1)}
                    className="gap-1.5"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Clinical Notes
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isSubmittingReport}
                    className="bg-teal-600 hover:bg-teal-700 text-white gap-2 font-bold shadow-sm"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {isSubmittingReport ? "Saving Session & Payment..." : "Complete Session & Save Payment"}
                  </Button>
                </DialogFooter>
              </div>
            )}
          </form>
        </DialogContent>
      </Dialog>

      {/* QUICK PAYMENT RECORDING MODAL (Standalone for Front-Desk & Doctors) */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="max-w-md w-full bg-card border-teal-500/30 shadow-2xl rounded-2xl sm:rounded-3xl p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
              <CreditCard className="h-5 w-5 text-teal-600" />
              Session Payment & Billing
            </DialogTitle>
            <DialogDescription>
              Patient: <strong>{selectedPatientForPayment?.firstName} {selectedPatientForPayment?.lastName}</strong> (Session #{selectedPaymentSessionIndex + 1})
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveStandalonePayment} className="space-y-4 py-2 text-xs">
            {/* Status Toggle */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setStandalonePaymentForm({ ...standalonePaymentForm, paymentStatus: "paid" })}
                className={`p-2.5 rounded-xl border text-center flex items-center justify-center gap-2 font-bold transition-all cursor-pointer ${
                  standalonePaymentForm.paymentStatus === "paid"
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Mark as Paid</span>
              </button>

              <button
                type="button"
                onClick={() => setStandalonePaymentForm({ ...standalonePaymentForm, paymentStatus: "pending" })}
                className={`p-2.5 rounded-xl border text-center flex items-center justify-center gap-2 font-bold transition-all cursor-pointer ${
                  standalonePaymentForm.paymentStatus === "pending"
                    ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                <Clock className="h-4 w-4" />
                <span>Mark as Pending</span>
              </button>
            </div>

            {standalonePaymentForm.paymentStatus === "paid" && (
              <div className="space-y-3.5 pt-1">
                {/* Mode Selector */}
                <div className="space-y-1.5">
                  <label className="font-bold text-foreground block">Payment Method</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "upi", label: "UPI", icon: QrCode },
                      { id: "cash", label: "Cash", icon: Banknote },
                    ].map((mode) => {
                      const IconComp = mode.icon;
                      const isSel = standalonePaymentForm.paymentMethod === mode.id;
                      return (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={() => setStandalonePaymentForm({ ...standalonePaymentForm, paymentMethod: mode.id as any })}
                          className={`p-2.5 rounded-xl border text-center flex flex-col items-center gap-1 transition-all cursor-pointer ${
                            isSel
                              ? "bg-teal-600 text-white border-teal-600 font-bold shadow-xs"
                              : "bg-card border-input text-foreground font-medium hover:bg-muted"
                          }`}
                        >
                          <IconComp className="h-4 w-4" />
                          <span className="text-[11px]">{mode.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Transaction ID */}
                {standalonePaymentForm.paymentMethod === "upi" && (
                  <div className="space-y-1.5">
                    <label className="font-bold text-foreground block">
                      UPI Reference / 12-digit UTR Number
                    </label>
                    <Input
                      value={standalonePaymentForm.transactionId}
                      onChange={(e) => setStandalonePaymentForm({ ...standalonePaymentForm, transactionId: e.target.value })}
                      placeholder="e.g. 423981048291"
                      className="h-9 font-mono text-xs"
                    />
                  </div>
                )}

                {/* Amount and Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-foreground block">Amount (₹)</label>
                    <Input
                      type="number"
                      min={0}
                      value={standalonePaymentForm.paidAmount}
                      onChange={(e) => setStandalonePaymentForm({ ...standalonePaymentForm, paidAmount: Number(e.target.value) })}
                      className="h-9 font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-foreground block">Payment Date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full h-9 justify-start text-left text-xs font-semibold bg-background border border-input focus:ring-2 focus:ring-teal-500"
                        >
                          <Calendar className="mr-2 h-3.5 w-3.5 text-teal-600 shrink-0" />
                          {standalonePaymentForm.paymentDate ? (
                            format(new Date(standalonePaymentForm.paymentDate + "T00:00:00"), "EEE, MMM d, yyyy")
                          ) : (
                            <span className="text-muted-foreground">Select payment date...</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 z-[9999] bg-card border border-border shadow-2xl rounded-2xl" align="start">
                        <CalendarWidget
                          mode="single"
                          selected={standalonePaymentForm.paymentDate ? new Date(standalonePaymentForm.paymentDate + "T00:00:00") : undefined}
                          onSelect={(date) => {
                            if (date) {
                              setStandalonePaymentForm(prev => ({ ...prev, paymentDate: format(date, "yyyy-MM-dd") }));
                            }
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-1">
                  <label className="font-bold text-foreground block">Remarks (Optional)</label>
                  <Input
                    value={standalonePaymentForm.paymentNotes}
                    onChange={(e) => setStandalonePaymentForm({ ...standalonePaymentForm, paymentNotes: e.target.value })}
                    placeholder="e.g. Paid at reception desk"
                    className="h-9 text-xs"
                  />
                </div>
              </div>
            )}

            <DialogFooter className="border-t pt-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsPaymentModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmittingPayment}
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold gap-1.5"
              >
                <CheckCircle2 className="h-4 w-4" />
                {isSubmittingPayment ? "Saving..." : "Save Payment Details"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* VIEW DOCTOR REPORT DIALOG */}
      {viewingSession && (() => {
        const painBefore = viewingSession.report?.painLevelBefore ?? 7;
        const painAfter = viewingSession.report?.painLevelAfter ?? 3;
        const painRelief = painBefore - painAfter;
        const hasPain = viewingSession.report?.painLevelBefore !== undefined || viewingSession.report?.painLevelAfter !== undefined;
        const patientInitials = viewingSession.patientName
          ? viewingSession.patientName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
          : "PT";

        return (
          <Dialog open={isViewReportOpen} onOpenChange={setIsViewReportOpen}>
            <DialogContent className="max-w-2xl w-full bg-card border-teal-500/25 shadow-2xl rounded-2xl sm:rounded-3xl p-0 overflow-hidden flex flex-col max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3.5rem)]">
              {/* MODAL HEADER */}
              <div className="p-4 sm:p-5 border-b border-border/80 bg-gradient-to-r from-teal-500/[0.07] via-emerald-500/[0.04] to-transparent shrink-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pr-8 sm:pr-10">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-600 text-white flex items-center justify-center shadow-md shadow-teal-500/20 shrink-0">
                      <Stethoscope className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <DialogTitle className="text-lg sm:text-xl font-black text-foreground tracking-tight">
                          Clinical Session Report
                        </DialogTitle>
                        <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30">
                          Session #{viewingSession.sessionNumber}
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted border text-muted-foreground inline-flex items-center gap-1">
                          {viewingSession.sessionType === "home_visit" ? (
                            <><Home className="h-3 w-3 text-teal-600" /> Home Visit</>
                          ) : viewingSession.sessionType === "online" ? (
                            <><Video className="h-3 w-3 text-teal-600" /> Online</>
                          ) : (
                            <><Building2 className="h-3 w-3 text-teal-600" /> In-Clinic</>
                          )}
                        </span>
                      </div>
                      <DialogDescription className="text-xs text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
                          <span className="w-5 h-5 rounded-full bg-teal-500/10 text-teal-700 dark:text-teal-300 text-[10px] font-bold flex items-center justify-center">
                            {patientInitials}
                          </span>
                          {viewingSession.patientName}
                        </span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {viewingSession.date}
                        </span>
                      </DialogDescription>
                    </div>
                  </div>

                  {/* TOP ACTION: EDIT DOCTOR RX */}
                  {viewingSession.patient && viewingSession.sessionIndex !== undefined && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const p = viewingSession.patient;
                        const idx = viewingSession.sessionIndex;
                        setIsViewReportOpen(false);
                        handleOpenReportModal(p, idx);
                      }}
                      className="self-start sm:self-auto gap-1.5 h-8 px-3 text-xs border-teal-500/40 text-teal-700 dark:text-teal-300 hover:bg-teal-500/10 hover:border-teal-500/60 font-bold shrink-0 shadow-2xs rounded-xl transition-all"
                    >
                      <Stethoscope className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                      <span>Edit Doctor Rx</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* MODAL BODY (SCROLLABLE) */}
              <div className="p-4 sm:p-5 overflow-y-auto custom-slim-scrollbar space-y-4 flex-1 text-xs">
                {/* 3-PILLAR CLINICAL VITALS RIBBON */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Pillar 1: Timings */}
                  <div className="p-3 rounded-2xl bg-muted/35 border border-border/80 flex flex-col justify-between space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3 text-teal-600" />
                        Timings
                      </span>
                      {viewingSession.patient && viewingSession.sessionIndex !== undefined && (
                        <button
                          type="button"
                          onClick={() => {
                            const p = viewingSession.patient;
                            const idx = viewingSession.sessionIndex;
                            setIsViewReportOpen(false);
                            handleOpenTimeModal(p, idx);
                          }}
                          className="text-[10px] font-semibold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
                        >
                          Adjust
                        </button>
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <span>{viewingSession.checkInTime || "N/A"}</span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <span>{viewingSession.leaveTime || "N/A"}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        In-Clinic Attendance
                      </div>
                    </div>
                  </div>

                  {/* Pillar 2: Pain Trajectory */}
                  <div className="p-3 rounded-2xl bg-teal-500/[0.06] border border-teal-500/20 flex flex-col justify-between space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-800 dark:text-teal-300 flex items-center gap-1">
                        <Activity className="h-3 w-3 text-teal-600" />
                        Pain Score
                      </span>
                      {hasPain && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                          painRelief > 0 
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" 
                            : painRelief < 0
                            ? "bg-rose-500/15 text-rose-700"
                            : "bg-muted text-muted-foreground"
                        }`}>
                          {painRelief > 0 ? `↓ ${painRelief} pts relief` : painRelief < 0 ? `↑ ${Math.abs(painRelief)} pts` : "Stable"}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-base font-black text-amber-600">{painBefore}</span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground self-center" />
                        <span className="text-base font-black text-emerald-600">{painAfter}</span>
                        <span className="text-[10px] text-muted-foreground font-semibold">/ 10</span>
                      </div>
                      <div className="w-full bg-muted/80 h-1.5 rounded-full mt-1.5 overflow-hidden flex">
                        <div style={{ width: `${Math.min(100, (painAfter / 10) * 100)}%` }} className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full h-full" />
                      </div>
                    </div>
                  </div>

                  {/* Pillar 3: Settlement */}
                  <div className="p-3 rounded-2xl bg-muted/35 border border-border/80 flex flex-col justify-between space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <CreditCard className="h-3 w-3 text-teal-600" />
                        Settlement
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        viewingSession.paymentStatus === 'paid'
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                          : "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                      }`}>
                        {viewingSession.paymentStatus || 'pending'}
                      </span>
                    </div>
                    <div>
                      <div className="text-base font-black text-foreground">
                        ₹{viewingSession.paidAmount !== undefined ? viewingSession.paidAmount : (viewingSession.amount || 700)}
                      </div>
                      <div className="text-[10px] text-muted-foreground flex items-center justify-between mt-0.5">
                        <span className="font-semibold uppercase">{viewingSession.paymentMethod ? (viewingSession.paymentMethod === 'upi' ? 'UPI' : viewingSession.paymentMethod === 'cash' ? 'Cash' : viewingSession.paymentMethod === 'card' ? 'Card' : viewingSession.paymentMethod === 'package_covered' ? 'Package Plan' : viewingSession.paymentMethod) : 'UPI'}</span>
                        {viewingSession.transactionId && <span className="font-mono truncate max-w-[80px]">Ref: {viewingSession.transactionId}</span>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* CLINICAL PROTOCOL & TREATMENT ADMINISTERED */}
                <div className="rounded-2xl border border-border/80 bg-background p-3.5 sm:p-4 space-y-1.5 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-teal-500" />
                    <span className="font-extrabold text-[11px] uppercase tracking-wider text-muted-foreground">
                      Treatment & Therapy Administered
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-foreground leading-relaxed pl-4">
                    {viewingSession.report?.treatmentAdministered || "Manual therapy and targeted rehabilitation exercises."}
                  </p>
                </div>

                {/* DOCTOR CLINICAL OBSERVATIONS */}
                <div className="rounded-2xl border border-teal-500/25 bg-teal-500/[0.02] p-3.5 sm:p-4 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-teal-600" />
                    <span className="font-extrabold text-[11px] uppercase tracking-wider text-teal-800 dark:text-teal-300">
                      Doctor Clinical Observations & Progress Notes
                    </span>
                  </div>
                  <div className="border-l-2 border-teal-500/40 pl-3 ml-1 py-0.5">
                    <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed italic">
                      "{viewingSession.report?.progressNotes || "Patient tolerated session well with positive recovery markers."}"
                    </p>
                  </div>
                </div>

                {/* PRESCRIBED HOME EXERCISES (HEP) */}
                {viewingSession.report?.homeExercisesRecommended && (
                  <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.05] p-3.5 sm:p-4 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="font-extrabold text-[11px] uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                        Prescribed Home Exercises & Patient Advice
                      </span>
                    </div>
                    <div className="border-l-2 border-emerald-500/40 pl-3 ml-1 py-0.5">
                      <p className="text-xs sm:text-sm font-medium text-emerald-950 dark:text-emerald-100 leading-relaxed">
                        {viewingSession.report.homeExercisesRecommended}
                      </p>
                    </div>
                  </div>
                )}

                {/* DOCTOR ATTESTATION BADGE */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-muted/25 border border-border/60 text-muted-foreground text-[11px]">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-teal-600" />
                    <span>Attending: <strong className="text-foreground">{viewingSession.report?.therapistName || "Dr. Attending Physiotherapist"}</strong></span>
                  </div>
                  <div>
                    <span>Verified: {viewingSession.report?.completedAt ? new Date(viewingSession.report.completedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) : viewingSession.date}</span>
                  </div>
                </div>
              </div>

              {/* MODAL FOOTER ACTIONS */}
              <div className="p-3.5 sm:p-4 border-t border-border/80 bg-muted/20 shrink-0 flex items-center justify-between gap-2">
                <div>
                  {/* TIMES BUTTON */}
                  {viewingSession.patient && viewingSession.sessionIndex !== undefined && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const p = viewingSession.patient;
                        const idx = viewingSession.sessionIndex;
                        setIsViewReportOpen(false);
                        handleOpenTimeModal(p, idx);
                      }}
                      className="gap-1.5 h-8 text-xs border-muted-foreground/25 text-muted-foreground hover:text-foreground font-semibold"
                    >
                      <Clock className="h-3.5 w-3.5" />
                      Adjust Times
                    </Button>
                  )}
                </div>

                <Button
                  size="sm"
                  onClick={() => setIsViewReportOpen(false)}
                  className="h-8 text-xs bg-teal-600 hover:bg-teal-700 text-white font-bold px-6 shadow-xs"
                >
                  Done
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        );
      })()}
    </div>
  );
}