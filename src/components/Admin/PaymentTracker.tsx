"use client";

import React, { useEffect, useState } from "react";
import { getPatients, PatientRecord } from "@/services/bookingService";
import { useToast } from "@/hooks/use-toast";
import { 
  IndianRupee, 
  Search, 
  RefreshCw, 
  CreditCard, 
  Banknote, 
  Receipt, 
  CheckCircle2, 
  Clock, 
  TrendingUp,
  Package,
  Printer,
  FileCheck,
  ShieldCheck,
  ArrowDownRight,
  Filter,
  Eye,
  Calendar,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ArrowUpDown,
  Users,
  FileText,
  Stethoscope,
  Sparkles,
  Phone,
  Mail,
  AlertCircle
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

export interface LedgerItem {
  receiptId: string;
  patientName: string;
  email: string;
  phone: string;
  type: 'Initial Home Visit Assessment' | 'Therapy Package' | 'Per Session Visit';
  planTitle: string;
  amount: number;
  paymentOption: string;
  status: 'paid' | 'pending' | 'partial';
  method: string;
  transactionId?: string;
  date: string;
  subSessions?: LedgerItem[];
}

export interface ClientFinancialRecord {
  patientId: string;
  patient: PatientRecord;
  patientName: string;
  phone: string;
  email: string;
  date: string;
  totalBilled: number;
  totalPaid: number;
  totalDue: number;
  paymentStatus: 'paid' | 'partial' | 'pending';
  activePackageTitle?: string;
  activePackageTotal: number;
  activePackagePaid: number;
  activePackageDue: number;
  activePackageOption: string;
  activePackageStatus: 'paid' | 'partial' | 'pending';
  initialAssessment?: LedgerItem;
  packageItem?: LedgerItem;
  sessionPayments: LedgerItem[];
  allTransactions: LedgerItem[];
}

type SortOption = 
  | "date-desc" 
  | "date-asc" 
  | "amount-desc" 
  | "amount-asc" 
  | "name-asc" 
  | "name-desc" 
  | "status-paid" 
  | "status-pending";

type ViewMode = "client" | "transactions";

export default function PaymentTracker() {
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("client");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "pending" | "package" | "session" | "consultation">("all");
  
  // Selection states
  const [selectedReceipt, setSelectedReceipt] = useState<LedgerItem | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [selectedClientForStatement, setSelectedClientForStatement] = useState<ClientFinancialRecord | null>(null);
  const [isStatementOpen, setIsStatementOpen] = useState(false);
  
  const [sortBy, setSortBy] = useState<SortOption>("date-desc");
  const [expandedPackageIds, setExpandedPackageIds] = useState<Record<string, boolean>>({});
  const [expandedClientIds, setExpandedClientIds] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const togglePackageExpand = (receiptId: string) => {
    setExpandedPackageIds((prev) => ({
      ...prev,
      [receiptId]: prev[receiptId] === false ? true : false,
    }));
  };

  const toggleClientExpand = (patientId: string) => {
    setExpandedClientIds((prev) => ({
      ...prev,
      [patientId]: !prev[patientId],
    }));
  };

  const fetchPaymentData = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await getPatients();
      setPatients(data);
    } catch (error: any) {
      console.error("Error fetching payment logs:", error);
      toast({
        title: "Error fetching payment logs",
        description: error.message || "Failed to load payment records.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPaymentData();
  }, []);

  // 1. Build Client Financial Records & Raw Ledger
  const paymentLedger: LedgerItem[] = [];
  let totalCollected = 0;
  let totalPending = 0;
  let packageCollections = 0;
  let consultationCollections = 0;

  const clientRecords: ClientFinancialRecord[] = patients.map((p) => {
    // 1. Initial Consultation
    const initAmt = p.initialConsultation?.paymentAmount || 750;
    const initStatus = (p.initialConsultation?.paymentStatus || 'paid') as 'paid' | 'pending';
    const initMethod = p.initialConsultation?.paymentMethod || 'UPI';
    const initDate = p.convertedAt 
      ? new Date(p.convertedAt).toISOString().split("T")[0] 
      : (p.createdAt ? new Date(p.createdAt).toISOString().split("T")[0] : "Recorded");

    const initialItem: LedgerItem = {
      receiptId: `REC-INV-${p._id.slice(-4).toUpperCase()}-01`,
      patientName: `${p.firstName} ${p.lastName}`,
      email: p.email || "",
      phone: p.phone,
      type: 'Initial Home Visit Assessment',
      planTitle: 'Clinical Assessment & Evaluation',
      amount: initAmt,
      paymentOption: 'Assessment Fee (₹750)',
      status: initStatus,
      method: initMethod,
      date: initDate,
    };

    // Add to flat ledger
    paymentLedger.push(initialItem);

    if (initStatus === 'paid') {
      totalCollected += initAmt;
      consultationCollections += initAmt;
    } else {
      totalPending += initAmt;
    }

    // 2. Individual Therapy Sessions
    const isPayPerSession = p.activePackage?.paymentOption === 'pay_per_session' || !p.activePackage;
    const sessionItems: LedgerItem[] = [];

    if (p.sessions && p.sessions.length > 0) {
      p.sessions.forEach((s) => {
        if (s.status === 'completed' || s.paymentStatus === 'paid' || isPayPerSession) {
          const sessionAmt = s.amount || p.activePackage?.pricePerSession || 700;
          const sStatus = (s.paymentStatus === 'paid' ? 'paid' : (s.status === 'completed' ? 'paid' : 'pending')) as 'paid' | 'pending';
          const sDate = s.date || initDate;

          const methodDisplay = s.paymentMethod
            ? (s.paymentMethod === 'upi' ? 'UPI' : s.paymentMethod === 'cash' ? 'Cash' : s.paymentMethod === 'card' ? 'Card/POS' : s.paymentMethod === 'bank_transfer' ? 'Bank Transfer' : s.paymentMethod.toUpperCase())
            : (s.sessionType === 'online' ? 'Online / UPI' : s.sessionType === 'home_visit' ? 'Home Visit (Cash/UPI)' : 'Cash / Clinic UPI');

          const sessionItem: LedgerItem = {
            receiptId: `REC-SES-${p._id.slice(-4).toUpperCase()}-${String(s.sessionNumber).padStart(2, '0')}`,
            patientName: `${p.firstName} ${p.lastName}`,
            email: p.email || "",
            phone: p.phone,
            type: 'Per Session Visit',
            planTitle: `Therapy Session #${s.sessionNumber} (${s.sessionType === 'online' ? 'Online Video' : s.sessionType === 'home_visit' ? 'Home Visit' : 'In-Clinic'})`,
            amount: sessionAmt,
            paymentOption: isPayPerSession ? 'Pay Per Session' : 'Covered in Package',
            status: sStatus,
            method: methodDisplay,
            transactionId: s.transactionId,
            date: sDate,
          };

          sessionItems.push(sessionItem);

          if (isPayPerSession) {
            if (sStatus === 'paid') {
              totalCollected += sessionAmt;
              consultationCollections += sessionAmt;
            } else {
              totalPending += sessionAmt;
            }
          }
        }
      });
    }

    // 3. Care Packages
    let pkgItem: LedgerItem | undefined;
    let pkgBilled = 0;
    let pkgPaid = 0;
    let pkgStatus: 'paid' | 'partial' | 'pending' = 'pending';

    if (p.activePackage) {
      pkgBilled = p.activePackage.totalAmount;
      const pkgDate = p.activePackage.purchasedAt 
        ? new Date(p.activePackage.purchasedAt).toISOString().split("T")[0] 
        : initDate;

      if (p.activePackage.paymentOption === 'pay_per_package') {
        pkgStatus = (p.activePackage.paymentStatus || 'pending') as 'paid' | 'partial' | 'pending';
        pkgPaid = pkgStatus === 'paid' ? pkgBilled : (p.activePackage.amountPaid || 0);

        pkgItem = {
          receiptId: `REC-PKG-${p._id.slice(-4).toUpperCase()}-02`,
          patientName: `${p.firstName} ${p.lastName}`,
          email: p.email || "",
          phone: p.phone,
          type: 'Therapy Package',
          planTitle: `${p.activePackage.title} (${p.activePackage.totalSessions} Sessions)`,
          amount: pkgBilled,
          paymentOption: 'Online / Advance (Prepaid)',
          status: pkgStatus,
          method: 'Online / Advance',
          date: pkgDate,
          subSessions: sessionItems,
        };

        paymentLedger.push(pkgItem);

        if (pkgStatus === 'paid') {
          totalCollected += pkgPaid;
          packageCollections += pkgPaid;
        } else {
          totalPending += (pkgBilled - pkgPaid);
        }
      } else {
        const paidSessionsTotal = sessionItems
          .filter(s => s.status === 'paid')
          .reduce((sum, s) => sum + s.amount, 0);
        const paidSessionsCount = sessionItems.filter(s => s.status === 'paid').length;
        const remainingPlanDue = Math.max(0, pkgBilled - paidSessionsTotal);

        pkgPaid = paidSessionsTotal;
        pkgStatus = paidSessionsTotal >= pkgBilled ? 'paid' : (paidSessionsTotal > 0 ? 'partial' : 'pending');

        pkgItem = {
          receiptId: `REC-PKG-${p._id.slice(-4).toUpperCase()}-02`,
          patientName: `${p.firstName} ${p.lastName}`,
          email: p.email || "",
          phone: p.phone,
          type: 'Therapy Package',
          planTitle: `${p.activePackage.title} (${paidSessionsCount}/${p.activePackage.totalSessions} Sessions Paid)`,
          amount: pkgBilled,
          paymentOption: 'Pay Per Session',
          status: pkgStatus,
          method: 'Per-Session',
          date: pkgDate,
          subSessions: sessionItems,
        };

        paymentLedger.push(pkgItem);

        if (remainingPlanDue > 0) {
          totalPending += remainingPlanDue;
        }
      }
    } else if (sessionItems.length > 0) {
      sessionItems.forEach(item => paymentLedger.push(item));
      pkgBilled = sessionItems.reduce((acc, s) => acc + s.amount, 0);
      pkgPaid = sessionItems.filter(s => s.status === 'paid').reduce((acc, s) => acc + s.amount, 0);
      pkgStatus = pkgPaid >= pkgBilled ? 'paid' : (pkgPaid > 0 ? 'partial' : 'pending');
    }

    const initPaid = initStatus === 'paid' ? initAmt : 0;
    const totalBilled = initAmt + pkgBilled;
    const totalPaid = initPaid + pkgPaid;
    const totalDue = Math.max(0, totalBilled - totalPaid);

    const overallStatus: 'paid' | 'partial' | 'pending' =
      totalDue === 0 ? 'paid' : (totalPaid > 0 ? 'partial' : 'pending');

    const allTx: LedgerItem[] = [initialItem];
    if (pkgItem) allTx.push(pkgItem);
    sessionItems.forEach(s => allTx.push(s));

    return {
      patientId: p._id,
      patient: p,
      patientName: `${p.firstName} ${p.lastName}`,
      phone: p.phone,
      email: p.email || "",
      date: initDate,
      totalBilled,
      totalPaid,
      totalDue,
      paymentStatus: overallStatus,
      activePackageTitle: p.activePackage?.title,
      activePackageTotal: pkgBilled,
      activePackagePaid: pkgPaid,
      activePackageDue: Math.max(0, pkgBilled - pkgPaid),
      activePackageOption: p.activePackage?.paymentOption === 'pay_per_package' 
        ? 'Advance Prepaid Package' 
        : (p.activePackage ? 'Pay Per Session' : 'Standard Visits'),
      activePackageStatus: pkgStatus,
      initialAssessment: initialItem,
      packageItem: pkgItem,
      sessionPayments: sessionItems,
      allTransactions: allTx,
    };
  });

  // 2. Filter Client Records
  const filteredClientRecords = clientRecords.filter((record) => {
    const query = searchQuery.toLowerCase();
    const matchesQuery = (
      record.patientName.toLowerCase().includes(query) ||
      record.email.toLowerCase().includes(query) ||
      record.phone.includes(query) ||
      (record.activePackageTitle && record.activePackageTitle.toLowerCase().includes(query)) ||
      record.allTransactions.some(t => t.receiptId.toLowerCase().includes(query))
    );

    if (!matchesQuery) return false;

    if (statusFilter === "paid") return record.paymentStatus === "paid";
    if (statusFilter === "pending") return record.paymentStatus === "pending" || record.paymentStatus === "partial";
    if (statusFilter === "package") return Boolean(record.activePackageTitle);
    if (statusFilter === "session") return record.sessionPayments.length > 0;
    if (statusFilter === "consultation") return record.initialAssessment !== undefined;

    return true;
  });

  // Sort Client Records
  const sortedClientRecords = [...filteredClientRecords].sort((a, b) => {
    if (sortBy === "date-desc") return new Date(b.date).getTime() - new Date(a.date).getTime();
    if (sortBy === "date-asc") return new Date(a.date).getTime() - new Date(b.date).getTime();
    if (sortBy === "amount-desc") return b.totalBilled - a.totalBilled;
    if (sortBy === "amount-asc") return a.totalBilled - b.totalBilled;
    if (sortBy === "name-asc") return a.patientName.localeCompare(b.patientName);
    if (sortBy === "name-desc") return b.patientName.localeCompare(a.patientName);
    if (sortBy === "status-paid") {
      const order: Record<string, number> = { paid: 1, partial: 2, pending: 3 };
      return (order[a.paymentStatus] || 9) - (order[b.paymentStatus] || 9);
    }
    if (sortBy === "status-pending") {
      const order: Record<string, number> = { pending: 1, partial: 2, paid: 3 };
      return (order[a.paymentStatus] || 9) - (order[b.paymentStatus] || 9);
    }
    return 0;
  });

  // 3. Filter All Invoices Stream
  const filteredLedger = paymentLedger.filter((item) => {
    const query = searchQuery.toLowerCase();
    const matchesQuery = (
      item.patientName.toLowerCase().includes(query) ||
      item.email.toLowerCase().includes(query) ||
      item.phone.includes(query) ||
      item.planTitle.toLowerCase().includes(query) ||
      item.receiptId.toLowerCase().includes(query) ||
      (item.subSessions && item.subSessions.some(s => s.receiptId.toLowerCase().includes(query) || s.planTitle.toLowerCase().includes(query)))
    );

    if (!matchesQuery) return false;

    if (statusFilter === "paid") {
      return item.status === "paid" || (item.subSessions && item.subSessions.some(s => s.status === "paid"));
    }
    if (statusFilter === "pending") {
      return item.status === "pending" || item.status === "partial" || (item.subSessions && item.subSessions.some(s => s.status === "pending"));
    }
    if (statusFilter === "package") return item.type === "Therapy Package";
    if (statusFilter === "session") return item.type === "Per Session Visit" || (item.subSessions && item.subSessions.length > 0);
    if (statusFilter === "consultation") return item.type === "Initial Home Visit Assessment";

    return true;
  });

  const sortedLedger = [...filteredLedger].sort((a, b) => {
    if (sortBy === "date-desc") return new Date(b.date).getTime() - new Date(a.date).getTime();
    if (sortBy === "date-asc") return new Date(a.date).getTime() - new Date(b.date).getTime();
    if (sortBy === "amount-desc") return b.amount - a.amount;
    if (sortBy === "amount-asc") return a.amount - b.amount;
    if (sortBy === "name-asc") return a.patientName.localeCompare(b.patientName);
    if (sortBy === "name-desc") return b.patientName.localeCompare(a.patientName);
    if (sortBy === "status-paid") {
      const order: Record<string, number> = { paid: 1, partial: 2, pending: 3 };
      return (order[a.status] || 9) - (order[b.status] || 9);
    }
    if (sortBy === "status-pending") {
      const order: Record<string, number> = { pending: 1, partial: 2, paid: 3 };
      return (order[a.status] || 9) - (order[b.status] || 9);
    }
    return 0;
  });

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground flex items-center gap-2.5">
            <IndianRupee className="h-7 w-7 text-teal-600" />
            Financial Ledger & Revenue Tracker
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1">
            Real-time accounts of clinic consultation fees, rehabilitation packages, and patient statements.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchPaymentData(true)}
            disabled={loading || refreshing}
            className="gap-2 h-9 text-xs font-semibold"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh Ledger
          </Button>
        </div>
      </div>

      {/* 4 FINANCIAL KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-card rounded-2xl p-4 sm:p-5 border border-border/80 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
            <span>Total Collections</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-foreground mt-2">
            ₹{totalCollected.toLocaleString()}
          </div>
          <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold mt-1 inline-block">
            Verified Received
          </span>
        </div>

        <div className="bg-card rounded-2xl p-4 sm:p-5 border border-border/80 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
            <span>Pending Receivables</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-700 dark:text-amber-400 mt-2">
            ₹{totalPending.toLocaleString()}
          </div>
          <span className="text-[11px] text-muted-foreground font-medium mt-1 inline-block">
            Due on completion
          </span>
        </div>

        <div className="bg-card rounded-2xl p-4 sm:p-5 border border-border/80 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
            <span>Package Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-700 flex items-center justify-center">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-teal-800 dark:text-teal-300 mt-2">
            ₹{packageCollections.toLocaleString()}
          </div>
          <span className="text-[11px] text-muted-foreground font-medium mt-1 inline-block">
            Therapy packages
          </span>
        </div>

        <div className="bg-card rounded-2xl p-4 sm:p-5 border border-border/80 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
            <span>Consultation Fees</span>
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-700 flex items-center justify-center">
              <Receipt className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-foreground mt-2">
            ₹{consultationCollections.toLocaleString()}
          </div>
          <span className="text-[11px] text-muted-foreground font-medium mt-1 inline-block">
            {clientRecords.length} Client Accounts
          </span>
        </div>
      </div>

      {/* VIEW TOGGLE, FILTER TABS, SORT & SEARCH */}
      <div className="space-y-3">
        {/* TOP CONTROLS BAR: Primary View Switcher + Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-card p-3 rounded-2xl border border-border/80 shadow-xs">
          {/* VIEW MODE TOGGLE */}
          <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border/60 self-start md:self-auto">
            <button
              onClick={() => setViewMode("client")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === "client"
                  ? "bg-card text-teal-700 dark:text-teal-300 shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>By Client Accounts ({clientRecords.length})</span>
            </button>
            <button
              onClick={() => setViewMode("transactions")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === "transactions"
                  ? "bg-card text-teal-700 dark:text-teal-300 shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>All Invoices Stream ({paymentLedger.length})</span>
            </button>
          </div>

          {/* Search Bar & Sort Dropdown */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 bg-background px-2.5 py-0.5 rounded-xl border border-input text-xs shadow-2xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground shrink-0">Sort:</span>
              <Select
                value={sortBy}
                onValueChange={(val) => setSortBy(val as SortOption)}
              >
                <SelectTrigger className="h-8 border-0 shadow-none px-1 text-xs font-bold text-foreground focus:ring-0 gap-1 bg-transparent">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-50 bg-card border border-border shadow-xl rounded-xl">
                  <SelectItem value="date-desc">Date (Newest First)</SelectItem>
                  <SelectItem value="date-asc">Date (Oldest First)</SelectItem>
                  <SelectItem value="amount-desc">Amount (Highest First)</SelectItem>
                  <SelectItem value="amount-asc">Amount (Lowest First)</SelectItem>
                  <SelectItem value="name-asc">Patient Name (A-Z)</SelectItem>
                  <SelectItem value="name-desc">Patient Name (Z-A)</SelectItem>
                  <SelectItem value="status-paid">Status (Paid First)</SelectItem>
                  <SelectItem value="status-pending">Status (Pending First)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={viewMode === "client" ? "Search client name, phone..." : "Search invoice, receipt #..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>
          </div>
        </div>

        {/* STATUS FILTER PILLS */}
        <div className="flex flex-wrap items-center gap-1.5 px-1">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mr-1">Filter:</span>
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
              statusFilter === "all"
                ? "bg-teal-700 text-white shadow-xs font-bold"
                : "bg-muted/50 text-muted-foreground hover:bg-muted/80"
            }`}
          >
            All ({viewMode === "client" ? clientRecords.length : paymentLedger.length})
          </button>
          <button
            onClick={() => setStatusFilter("paid")}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
              statusFilter === "paid"
                ? "bg-emerald-700 text-white shadow-xs font-bold"
                : "bg-muted/50 text-muted-foreground hover:bg-muted/80"
            }`}
          >
            Settled / Paid
          </button>
          <button
            onClick={() => setStatusFilter("pending")}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
              statusFilter === "pending"
                ? "bg-amber-600 text-white shadow-xs font-bold"
                : "bg-muted/50 text-muted-foreground hover:bg-muted/80"
            }`}
          >
            Pending Receivables
          </button>
          <button
            onClick={() => setStatusFilter("package")}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
              statusFilter === "package"
                ? "bg-teal-700 text-white shadow-xs font-bold"
                : "bg-muted/50 text-muted-foreground hover:bg-muted/80"
            }`}
          >
            With Care Package
          </button>
          <button
            onClick={() => setStatusFilter("session")}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
              statusFilter === "session"
                ? "bg-teal-700 text-white shadow-xs font-bold"
                : "bg-muted/50 text-muted-foreground hover:bg-muted/80"
            }`}
          >
            With Sessions
          </button>
          <button
            onClick={() => setStatusFilter("consultation")}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
              statusFilter === "consultation"
                ? "bg-teal-700 text-white shadow-xs font-bold"
                : "bg-muted/50 text-muted-foreground hover:bg-muted/80"
            }`}
          >
            Assessments
          </button>
        </div>
      </div>

      {/* CONTENT AREA: CLIENT DOSSIERS VS ALL TRANSACTIONS */}
      {loading ? (
        <div className="bg-card rounded-2xl border border-border/80 shadow-xs p-16 text-center flex flex-col items-center justify-center gap-3">
          <RefreshCw className="h-8 w-8 text-teal-600 animate-spin" />
          <p className="text-sm font-medium text-muted-foreground">Loading financial ledger...</p>
        </div>
      ) : viewMode === "client" ? (
        /* ========================================================================= */
        /* 1. BY CLIENT ACCOUNT VIEW (ONE MASTER ACCORDION CARD PER CLIENT)          */
        /* ========================================================================= */
        sortedClientRecords.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border/80 shadow-xs p-16 text-center max-w-md mx-auto flex flex-col items-center justify-center">
            <Users className="h-12 w-12 text-muted-foreground mb-3" />
            <h3 className="font-bold text-base text-foreground">No client records found</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {searchQuery ? "No clients match your search filter." : "Complete an appointment or add patient records to populate client accounts."}
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {sortedClientRecords.map((client) => {
              const isExpanded = expandedClientIds[client.patientId] !== false; // default open
              const isSettled = client.totalDue === 0;
              const hasPackage = Boolean(client.activePackageTitle);
              const initials = client.patient.firstName?.[0] && client.patient.lastName?.[0]
                ? `${client.patient.firstName[0]}${client.patient.lastName[0]}`
                : client.patientName.slice(0, 2).toUpperCase();

              return (
                <div
                  key={client.patientId}
                  className="bg-card rounded-2xl border border-border/80 shadow-xs overflow-hidden transition-all hover:border-teal-500/30"
                >
                  {/* MASTER CLIENT CARD HEADER */}
                  <div
                    onClick={() => toggleClientExpand(client.patientId)}
                    className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 cursor-pointer hover:bg-muted/20 transition-colors select-none"
                  >
                    {/* Left: Avatar & Demographics */}
                    <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-700 dark:text-teal-300 font-black text-sm flex items-center justify-center shrink-0 border border-teal-500/20">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-base text-foreground truncate">
                            {client.patientName}
                          </h3>
                          <span className="font-mono text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                            #PAT-{client.patientId.slice(-4).toUpperCase()}
                          </span>
                          {hasPackage ? (
                            <Badge variant="outline" className="text-xs px-2 py-0 border-teal-500/30 text-teal-700 dark:text-teal-300 font-semibold">
                              {client.activePackageTitle}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs px-2 py-0 text-muted-foreground font-semibold">
                              Single Visits
                            </Badge>
                          )}
                          <Badge className={`text-[10px] font-bold uppercase ${
                            isSettled
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                              : client.totalPaid > 0
                              ? "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30"
                              : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30"
                          }`}>
                            {isSettled ? "Settled" : client.totalPaid > 0 ? "Partial" : "Pending"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3 text-teal-600" /> {client.phone}</span>
                          <span>•</span>
                          <span className="truncate max-w-[200px] inline-flex items-center gap-1"><Mail className="h-3 w-3 text-teal-600" /> {client.email || "No email"}</span>
                          <span>•</span>
                          <span>Enrolled: {client.date}</span>
                        </p>
                      </div>
                    </div>

                    {/* Right: Financial KPI Summary & Actions */}
                    <div className="flex items-center justify-between lg:justify-end gap-4 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-border/50">
                      {/* Financial Badges */}
                      <div className="flex items-center gap-3 text-right">
                        <div className="hidden sm:block">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground block">Total Invoiced</span>
                          <span className="text-sm font-bold text-foreground">
                            ₹{client.totalBilled.toLocaleString()}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 block">Total Paid</span>
                          <span className="text-sm sm:text-base font-black text-emerald-700 dark:text-emerald-400">
                            ₹{client.totalPaid.toLocaleString()}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                            {client.totalDue > 0 ? "Balance Due" : "Balance"}
                          </span>
                          <span className={`text-sm sm:text-base font-black ${
                            client.totalDue > 0 ? "text-amber-700 dark:text-amber-400" : "text-emerald-600"
                          }`}>
                            {client.totalDue > 0 ? `₹${client.totalDue.toLocaleString()}` : "₹0 (Cleared)"}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedClientForStatement(client);
                            setIsStatementOpen(true);
                          }}
                          className="h-8 px-2.5 text-xs font-bold text-teal-700 dark:text-teal-300 border-teal-500/30 hover:bg-teal-50 dark:hover:bg-teal-950/40 gap-1.5 shrink-0"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Statement</span>
                        </Button>

                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* EXPANDED CLIENT FINANCIAL RECORD */}
                  {isExpanded && (
                    <div className="border-t bg-muted/10 p-4 sm:p-5 space-y-4 animate-in fade-in duration-200">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* 1. INITIAL ASSESSMENT INVOICE */}
                        {client.initialAssessment && (
                          <div className="bg-card p-4 rounded-xl border border-border/70 space-y-2.5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Stethoscope className="w-4 h-4 text-teal-600" />
                                <span className="font-bold text-xs text-foreground">
                                  Initial Clinical Assessment & Consultation
                                </span>
                              </div>
                              <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20 text-[10px] font-bold">
                                {client.initialAssessment.status.toUpperCase()}
                              </Badge>
                            </div>

                            <div className="flex items-center justify-between text-xs pt-1 border-t border-border/50">
                              <div>
                                <span className="font-mono text-[11px] text-muted-foreground block">
                                  {client.initialAssessment.receiptId} • {client.initialAssessment.date}
                                </span>
                                <span className="text-[11px] text-muted-foreground">
                                  Paid via {client.initialAssessment.method}
                                </span>
                              </div>
                              <div className="flex items-center gap-2.5">
                                <span className="text-sm font-black text-foreground">
                                  ₹{client.initialAssessment.amount.toLocaleString()}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedReceipt(client.initialAssessment!);
                                    setIsReceiptOpen(true);
                                  }}
                                  className="h-7 px-2 text-xs font-bold text-teal-700 hover:bg-teal-50"
                                >
                                  <Receipt className="w-3.5 h-3.5 mr-1" />
                                  Receipt
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 2. CARE PACKAGE OVERVIEW */}
                        {client.packageItem && (
                          <div className="bg-card p-4 rounded-xl border border-border/70 space-y-2.5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Package className="w-4 h-4 text-teal-600" />
                                <span className="font-bold text-xs text-foreground truncate">
                                  {client.activePackageTitle}
                                </span>
                              </div>
                              <Badge className={`text-[10px] font-bold uppercase ${
                                client.activePackageStatus === 'paid'
                                  ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20'
                                  : 'bg-amber-500/10 text-amber-700 border-amber-500/20'
                              }`}>
                                {client.activePackageStatus}
                              </Badge>
                            </div>

                            <div className="flex items-center justify-between text-xs pt-1 border-t border-border/50">
                              <div>
                                <span className="font-mono text-[11px] text-muted-foreground block">
                                  {client.packageItem.receiptId} • {client.activePackageOption}
                                </span>
                                <span className="text-[11px] text-muted-foreground">
                                  Paid: ₹{client.activePackagePaid.toLocaleString()} of ₹{client.activePackageTotal.toLocaleString()}
                                </span>
                              </div>
                              <div className="flex items-center gap-2.5">
                                <span className="text-sm font-black text-foreground">
                                  ₹{client.activePackageTotal.toLocaleString()}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedReceipt(client.packageItem!);
                                    setIsReceiptOpen(true);
                                  }}
                                  className="h-7 px-2 text-xs font-bold text-teal-700 hover:bg-teal-50"
                                >
                                  <Receipt className="w-3.5 h-3.5 mr-1" />
                                  Invoice
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 3. ITEMISED THERAPY SESSIONS RECORD */}
                      <div className="bg-card p-4 rounded-xl border border-border/70 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Receipt className="w-4 h-4 text-teal-600" />
                            <span className="font-bold text-xs text-foreground">
                              Delivered Therapy Sessions Log ({client.sessionPayments.length})
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground font-semibold">
                            Total Session Receipts: ₹{client.sessionPayments.filter(s => s.status === 'paid').reduce((a, b) => a + b.amount, 0).toLocaleString()}
                          </span>
                        </div>

                        {client.sessionPayments.length > 0 ? (
                          <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                            {client.sessionPayments.map((session, sIdx) => (
                              <div
                                key={sIdx}
                                className="p-2.5 rounded-lg bg-muted/40 border border-border/60 flex items-center justify-between text-xs"
                              >
                                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                  <span className="font-mono text-[10px] font-bold text-teal-800 dark:text-teal-300 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20 shrink-0">
                                    {session.receiptId}
                                  </span>
                                  <div className="min-w-0">
                                    <span className="font-bold text-foreground block truncate">
                                      {session.planTitle}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground">
                                      {session.date} • Mode: {session.method}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3 shrink-0">
                                  <span className="font-black text-xs text-foreground">
                                    ₹{session.amount.toLocaleString()}
                                  </span>
                                  <Badge className={`uppercase text-[9px] font-bold ${
                                    session.status === 'paid'
                                      ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30'
                                      : 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30'
                                  }`}>
                                    {session.status}
                                  </Badge>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedReceipt(session);
                                      setIsReceiptOpen(true);
                                    }}
                                    className="h-6 px-2 text-[10px] font-bold text-teal-700 border-teal-500/30 hover:bg-teal-50"
                                  >
                                    Receipt
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-3 bg-muted/20 rounded-lg text-center text-xs text-muted-foreground">
                            Routine sessions are tracked in the Sessions tab. Once check-in is logged, individual session payment receipts appear here.
                          </div>
                        )}
                      </div>

                      {/* 4. CONSOLIDATED FOOTER FOR THIS CLIENT */}
                      <div className="p-3 bg-teal-500/5 border border-teal-500/20 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                          <span className="text-muted-foreground">
                            Account Ledger Summary for <strong className="text-foreground">{client.patientName}</strong>:{" "}
                            <span className="text-emerald-700 font-bold">₹{client.totalPaid.toLocaleString()} Received</span>,{" "}
                            <span className={client.totalDue > 0 ? "text-amber-700 font-bold" : "text-emerald-700 font-bold"}>
                              ₹{client.totalDue.toLocaleString()} Outstanding
                            </span>
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedClientForStatement(client);
                            setIsStatementOpen(true);
                          }}
                          className="h-7 text-xs font-bold text-teal-800 dark:text-teal-200 border-teal-500/40 hover:bg-teal-500/10 gap-1.5 self-end sm:self-auto"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Print Full Statement</span>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* ========================================================================= */
        /* 2. ALL TRANSACTIONS STREAM (ORIGINAL AUDIT LOG STREAM)                   */
        /* ========================================================================= */
        filteredLedger.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border/80 shadow-xs p-16 text-center max-w-md mx-auto flex flex-col items-center justify-center">
            <Receipt className="h-12 w-12 text-muted-foreground mb-3" />
            <h3 className="font-bold text-base text-foreground">No financial records found</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {searchQuery ? "No entries match your search filter." : "Complete an appointment or record a therapy package to populate the ledger."}
            </p>
          </div>
        ) : (
          <>
            {/* MOBILE VIEW */}
            <div className="block md:hidden space-y-3.5">
              {sortedLedger.map((item, idx) => {
                const isPaid = item.status === "paid";
                const isPartial = item.status === "partial";
                const hasSubSessions = item.subSessions && item.subSessions.length > 0;

                return (
                  <div
                    key={`${item.receiptId}-${idx}`}
                    className={`bg-card rounded-2xl border border-border/80 shadow-xs p-4 space-y-3 hover:border-teal-500/40 transition-all ${
                      isPaid
                        ? "border-l-4 border-l-emerald-500"
                        : isPartial
                        ? "border-l-4 border-l-sky-500"
                        : "border-l-4 border-l-amber-500"
                    }`}
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-border/50 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[10px] text-teal-800 dark:text-teal-300 bg-teal-500/10 px-2 py-0.5 rounded-md border border-teal-500/20">
                          {item.receiptId}
                        </span>
                        <Badge variant="outline" className="capitalize text-[10px] font-bold text-muted-foreground inline-flex items-center gap-1">
                          <CreditCard className="w-3 h-3" /> {item.method.toUpperCase()}
                        </Badge>
                      </div>
                      <Badge className={`uppercase text-[10px] font-bold ${
                        isPaid
                          ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30"
                          : isPartial
                          ? "bg-sky-500/15 text-sky-800 dark:text-sky-300 border-sky-500/30"
                          : "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30"
                      }`}>
                        {item.status}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-2xl bg-teal-500/15 text-teal-800 dark:text-teal-300 font-black text-xs flex items-center justify-center shrink-0 border border-teal-500/20">
                          {item.patientName[0]}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm text-foreground truncate">
                            {item.patientName}
                          </h4>
                          <span className="text-[11px] text-muted-foreground block truncate inline-flex items-center gap-1">
                            <Phone className="w-3 h-3 text-muted-foreground" /> {item.phone}
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-base font-black text-foreground block leading-tight">
                          ₹{item.amount.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {isPaid ? "Settled" : isPartial ? "Partially Paid" : "Pending"}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-muted/30 border border-border/60 flex items-center justify-between text-xs">
                      <div className="flex flex-col min-w-0 pr-2">
                        <span className="font-bold text-foreground truncate">{item.type}</span>
                        <span className="text-[11px] text-muted-foreground truncate">{item.planTitle}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground whitespace-nowrap shrink-0 flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground/75" />
                        <span>{item.date}</span>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedReceipt(item);
                        setIsReceiptOpen(true);
                      }}
                      className="w-full h-9 text-xs font-bold text-teal-900 dark:text-teal-200 hover:text-white bg-teal-500/10 hover:bg-teal-700 border-teal-500/30 gap-1.5 rounded-xl transition-all shadow-2xs mt-1"
                    >
                      <Receipt className="h-3.5 w-3.5 text-teal-700 dark:text-teal-300" />
                      <span>View & Print Official Receipt</span>
                    </Button>
                  </div>
                );
              })}
            </div>

            {/* DESKTOP TABLE VIEW */}
            <div className="hidden md:block bg-card rounded-2xl border border-border/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-muted/40 border-b border-border/70 text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
                      <th className="px-4 py-3">Invoice / Receipt</th>
                      <th className="px-4 py-3">Patient Profile</th>
                      <th className="px-4 py-3">Service & Program</th>
                      <th className="px-4 py-3">Billing Mode</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3 text-right sticky right-0 z-20 bg-muted/95 backdrop-blur-xs shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.06)]">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {sortedLedger.map((item, idx) => {
                      const hasSubSessions = item.subSessions && item.subSessions.length > 0;
                      const isExpanded = expandedPackageIds[item.receiptId] !== false;

                      return (
                        <React.Fragment key={`main-${item.receiptId}-${idx}`}>
                          <tr className="group hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="font-mono font-bold text-[11px] text-teal-800 dark:text-teal-300 bg-teal-500/10 px-2.5 py-1 rounded-md border border-teal-500/20">
                                {item.receiptId}
                              </span>
                            </td>

                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-teal-500/15 text-teal-800 dark:text-teal-300 font-bold text-xs flex items-center justify-center shrink-0">
                                  {item.patientName[0]}
                                </div>
                                <div className="min-w-0">
                                  <span className="font-bold text-foreground text-sm block truncate max-w-[150px]">
                                    {item.patientName}
                                  </span>
                                  <span className="text-[11px] text-muted-foreground block truncate">
                                    {item.phone}
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td className="px-4 py-3">
                              <div className="flex flex-col min-w-0 max-w-[220px]">
                                <span className="font-bold text-foreground truncate">{item.type}</span>
                                <span className="text-[11px] text-muted-foreground truncate">{item.planTitle}</span>
                                {hasSubSessions && (
                                  <button
                                    onClick={() => togglePackageExpand(item.receiptId)}
                                    className="text-[10px] text-teal-700 dark:text-teal-300 font-bold flex items-center gap-1 mt-1 hover:underline w-fit bg-teal-500/10 px-2 py-0.5 rounded-full border border-teal-500/20"
                                  >
                                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                    <span>{isExpanded ? "Hide" : "Show"} {item.subSessions!.length} Session Payments</span>
                                  </button>
                                )}
                              </div>
                            </td>

                            <td className="px-4 py-3 whitespace-nowrap">
                              <Badge variant="outline" className="capitalize text-[10px] font-semibold text-muted-foreground">
                                {item.method}
                              </Badge>
                            </td>

                            <td className="px-4 py-3 font-black text-foreground text-xs whitespace-nowrap">
                              ₹{item.amount.toLocaleString()}
                            </td>

                            <td className="px-4 py-3 whitespace-nowrap">
                              <Badge className={`uppercase text-[10px] font-bold ${
                                item.status === 'paid'
                                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                                  : item.status === 'partial'
                                  ? 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30'
                                  : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30'
                              }`}>
                                {item.status}
                              </Badge>
                            </td>

                            <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                              {item.date}
                            </td>

                            <td className="px-4 py-3 text-right whitespace-nowrap sticky right-0 z-10 bg-card group-hover:bg-muted/30 backdrop-blur-xs shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.06)]">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedReceipt(item);
                                  setIsReceiptOpen(true);
                                }}
                                className="h-8 px-2.5 text-xs font-bold text-teal-700 dark:text-teal-300 border-teal-500/30 hover:bg-teal-50/70 dark:hover:bg-teal-950/40 gap-1"
                              >
                                <Receipt className="w-3.5 h-3.5" />
                                <span>View</span>
                              </Button>
                            </td>
                          </tr>

                          {/* NESTED SESSIONS */}
                          {hasSubSessions && isExpanded && item.subSessions!.map((sub, sIdx) => (
                            <tr
                              key={`sub-${sub.receiptId}-${sIdx}`}
                              className="bg-teal-500/[0.04] dark:bg-teal-950/20 border-b border-border/40 hover:bg-teal-500/[0.07] transition-colors"
                            >
                              <td className="px-4 py-2.5 pl-7 whitespace-nowrap">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-muted-foreground/60 text-xs select-none">↳</span>
                                  <span className="font-mono font-bold text-[10px] text-teal-800 dark:text-teal-300 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
                                    {sub.receiptId}
                                  </span>
                                </div>
                              </td>

                              <td className="px-4 py-2.5">
                                <span className="text-[11px] text-muted-foreground italic">
                                  ↳ {item.patientName} (Session)
                                </span>
                              </td>

                              <td className="px-4 py-2.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-semibold text-foreground text-xs">{sub.planTitle}</span>
                                  <span className="text-[9px] font-bold text-emerald-700 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                    Delivered
                                  </span>
                                </div>
                              </td>

                              <td className="px-4 py-2.5">
                                <Badge variant="outline" className="capitalize text-[9px] font-medium text-muted-foreground">
                                  {sub.method}
                                </Badge>
                              </td>

                              <td className="px-4 py-2.5 font-bold text-foreground text-xs whitespace-nowrap">
                                ₹{sub.amount.toLocaleString()}
                              </td>

                              <td className="px-4 py-2.5 whitespace-nowrap">
                                <Badge className={`uppercase text-[9px] font-bold ${
                                  sub.status === 'paid'
                                    ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30'
                                    : 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30'
                                }`}>
                                  {sub.status}
                                </Badge>
                              </td>

                              <td className="px-4 py-2.5 text-muted-foreground text-[11px] whitespace-nowrap">
                                {sub.date}
                              </td>

                              <td className="px-4 py-2.5 text-right whitespace-nowrap">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedReceipt(sub);
                                    setIsReceiptOpen(true);
                                  }}
                                  className="h-7 px-2 text-xs text-teal-700 hover:text-teal-900 hover:bg-teal-50 gap-1 font-semibold"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>Receipt</span>
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )
      )}

      {/* ========================================================================= */}
      {/* 3. CONSOLIDATED PATIENT STATEMENT OF ACCOUNT DIALOG (FULLY RESPONSIVE)     */}
      {/* ========================================================================= */}
      {selectedClientForStatement && (
        <Dialog open={isStatementOpen} onOpenChange={setIsStatementOpen}>
          <DialogContent className="max-w-2xl w-[calc(100vw-1rem)] sm:w-full bg-card border-border/80 shadow-2xl rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-3.5rem)] overflow-y-auto custom-slim-scrollbar print:max-w-none print:w-full print:p-0 print:border-none print:shadow-none print:overflow-visible print:max-h-none print:bg-white">
            {/* MODAL HEADER */}
            <DialogHeader className="border-b pb-3 sm:pb-4 pr-9 sm:pr-12 text-left print:pr-0 print:border-slate-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <DialogTitle className="text-base sm:text-xl font-black text-foreground flex items-center gap-2">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600 shrink-0" />
                    <span>Patient Statement of Account</span>
                  </DialogTitle>
                  <DialogDescription className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                    Account: <span className="font-mono font-bold text-foreground">#PAT-{selectedClientForStatement.patientId.slice(-6).toUpperCase()}</span> • Generated {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </DialogDescription>
                </div>
                <Badge className={`text-[10px] sm:text-xs font-bold uppercase self-start sm:self-auto shrink-0 px-2.5 py-0.5 sm:py-1 print:border-slate-400 ${
                  selectedClientForStatement.totalDue === 0
                    ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30"
                    : "bg-amber-500/10 text-amber-700 border-amber-500/30"
                }`}>
                  {selectedClientForStatement.totalDue === 0 ? "Account Settled" : "Balance Outstanding"}
                </Badge>
              </div>
            </DialogHeader>

            <div className="space-y-3.5 sm:space-y-4 py-2 sm:py-3 text-xs">
              {/* CLINIC & CLIENT HEADER INFO */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 p-3 sm:p-4 rounded-xl bg-muted/30 border border-border/60 print:grid-cols-2 print:border-slate-300 print:bg-slate-50 print:p-4">
                <div className="space-y-0.5">
                  <span className="text-[9px] sm:text-[10px] uppercase font-bold text-muted-foreground print:text-slate-500 block tracking-wider">Clinic Details</span>
                  <span className="font-bold text-foreground print:text-slate-900 text-xs sm:text-sm block">Adaptus Physiotherapy Clinic</span>
                  <span className="text-[10px] sm:text-[11px] text-muted-foreground print:text-slate-600 block">Clinical Rehabilitation & Physical Wellness</span>
                  <span className="text-[10px] sm:text-[11px] text-muted-foreground print:text-slate-600 block">Phone: +91 98200 00000 • clinic@adaptus.in</span>
                </div>
                <div className="pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50 sm:text-right print:text-right print:border-none space-y-0.5">
                  <span className="text-[9px] sm:text-[10px] uppercase font-bold text-muted-foreground print:text-slate-500 block tracking-wider">Billed Patient</span>
                  <span className="font-bold text-foreground print:text-slate-900 text-xs sm:text-sm block">{selectedClientForStatement.patientName}</span>
                  <span className="text-[10px] sm:text-[11px] text-muted-foreground print:text-slate-600 block">Phone: {selectedClientForStatement.phone}</span>
                  <span className="text-[10px] sm:text-[11px] text-muted-foreground print:text-slate-600 block">Email: {selectedClientForStatement.email || "N/A"}</span>
                  <span className="text-[10px] sm:text-[11px] text-teal-700 dark:text-teal-400 font-semibold block mt-0.5">
                    Plan: {selectedClientForStatement.activePackageTitle || "General Physiotherapy Care"}
                  </span>
                </div>
              </div>

              {/* FINANCIAL HIGHLIGHT TILES */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5 print:grid-cols-3">
                <div className="p-2.5 sm:p-3 rounded-xl bg-card border border-border/80 flex sm:flex-col items-center sm:items-center justify-between sm:justify-center text-left sm:text-center shadow-2xs print:border-slate-300 print:bg-slate-50">
                  <span className="text-[10px] sm:text-[11px] uppercase font-bold text-muted-foreground print:text-slate-500 block">Total Invoiced</span>
                  <span className="text-sm sm:text-base font-black text-foreground print:text-slate-900 sm:mt-0.5 block">
                    ₹{selectedClientForStatement.totalBilled.toLocaleString()}
                  </span>
                </div>
                <div className="p-2.5 sm:p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex sm:flex-col items-center sm:items-center justify-between sm:justify-center text-left sm:text-center shadow-2xs print:border-emerald-300 print:bg-emerald-50/50">
                  <span className="text-[10px] sm:text-[11px] uppercase font-bold text-emerald-800 dark:text-emerald-300 block">Total Received</span>
                  <span className="text-sm sm:text-base font-black text-emerald-800 dark:text-emerald-300 sm:mt-0.5 block">
                    ₹{selectedClientForStatement.totalPaid.toLocaleString()}
                  </span>
                </div>
                <div className={`p-2.5 sm:p-3 rounded-xl border flex sm:flex-col items-center sm:items-center justify-between sm:justify-center text-left sm:text-center shadow-2xs print:border-slate-300 print:bg-slate-50 ${
                  selectedClientForStatement.totalDue > 0
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300"
                    : "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
                }`}>
                  <span className="text-[10px] sm:text-[11px] uppercase font-bold block">Net Balance Due</span>
                  <span className="text-sm sm:text-base font-black sm:mt-0.5 block">
                    ₹{selectedClientForStatement.totalDue.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* MOBILE TRANSACTIONS LIST (block sm:hidden) */}
              <div className="block sm:hidden print:hidden space-y-2">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block px-0.5">
                  Itemized Statement Entries ({
                    (selectedClientForStatement.initialAssessment ? 1 : 0) +
                    (selectedClientForStatement.packageItem ? 1 : 0) +
                    selectedClientForStatement.sessionPayments.length
                  })
                </span>

                {/* Initial Assessment Card */}
                {selectedClientForStatement.initialAssessment && (
                  <div className="p-3 rounded-xl bg-card border border-border/80 space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-[10px] font-bold text-teal-800 dark:text-teal-300 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
                        {selectedClientForStatement.initialAssessment.receiptId}
                      </span>
                      <Badge className="bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 text-[9px] uppercase font-bold px-1.5 py-0 border-emerald-500/30">
                        {selectedClientForStatement.initialAssessment.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="font-bold text-xs text-foreground block truncate">
                          {selectedClientForStatement.initialAssessment.planTitle}
                        </span>
                        <span className="text-[10px] text-muted-foreground block">
                          {selectedClientForStatement.initialAssessment.date} • via {selectedClientForStatement.initialAssessment.method}
                        </span>
                      </div>
                      <span className="text-sm font-black text-foreground shrink-0">
                        ₹{selectedClientForStatement.initialAssessment.amount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}

                {/* Package Record Card */}
                {selectedClientForStatement.packageItem && (
                  <div className="p-3 rounded-xl bg-muted/30 border border-border/80 space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-[10px] font-bold text-teal-800 dark:text-teal-300 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
                        {selectedClientForStatement.packageItem.receiptId}
                      </span>
                      <Badge className={`text-[9px] uppercase font-bold px-1.5 py-0 ${
                        selectedClientForStatement.packageItem.status === 'paid'
                          ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30'
                      }`}>
                        {selectedClientForStatement.packageItem.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="font-bold text-xs text-foreground block truncate">
                          {selectedClientForStatement.packageItem.planTitle}
                        </span>
                        <span className="text-[10px] text-muted-foreground block">
                          {selectedClientForStatement.packageItem.date} • {selectedClientForStatement.packageItem.method}
                        </span>
                      </div>
                      <span className="text-sm font-black text-foreground shrink-0">
                        ₹{selectedClientForStatement.packageItem.amount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}

                {/* Individual Sessions Cards */}
                {selectedClientForStatement.sessionPayments.map((sess, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-card border border-border/70 space-y-1 shadow-2xs">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-[10px] text-muted-foreground font-semibold">
                        ↳ {sess.receiptId}
                      </span>
                      <Badge className="bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 text-[9px] uppercase font-bold px-1.5 py-0 border-emerald-500/30">
                        {sess.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="font-semibold text-xs text-foreground block truncate">
                          {sess.planTitle}
                        </span>
                        <span className="text-[10px] text-muted-foreground block">
                          {sess.date} • Mode: {sess.method}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-foreground shrink-0">
                        ₹{sess.amount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* DESKTOP TABLE VIEW (hidden sm:block, print:block) */}
              <div className="hidden sm:block print:block border rounded-xl overflow-hidden print:border-slate-300 print:overflow-visible">
                <div className="overflow-x-auto custom-slim-scrollbar print:overflow-visible">
                  <table className="w-full text-left text-xs border-collapse min-w-[550px] print:min-w-0">
                    <thead>
                      <tr className="bg-muted/40 border-b text-[10px] uppercase font-bold text-muted-foreground whitespace-nowrap print:bg-slate-100 print:text-slate-700 print:border-slate-300">
                        <th className="p-2.5">Date</th>
                        <th className="p-2.5">Invoice #</th>
                        <th className="p-2.5">Description</th>
                        <th className="p-2.5">Method</th>
                        <th className="p-2.5 text-right">Invoiced</th>
                        <th className="p-2.5 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60 print:divide-slate-200">
                      {/* Initial Consultation */}
                      {selectedClientForStatement.initialAssessment && (
                        <tr>
                          <td className="p-2.5 text-muted-foreground whitespace-nowrap">{selectedClientForStatement.initialAssessment.date}</td>
                          <td className="p-2.5 font-mono font-bold text-teal-800 dark:text-teal-300 whitespace-nowrap">{selectedClientForStatement.initialAssessment.receiptId}</td>
                          <td className="p-2.5 font-medium">{selectedClientForStatement.initialAssessment.planTitle}</td>
                          <td className="p-2.5 capitalize whitespace-nowrap">{selectedClientForStatement.initialAssessment.method}</td>
                          <td className="p-2.5 text-right font-bold whitespace-nowrap">₹{selectedClientForStatement.initialAssessment.amount.toLocaleString()}</td>
                          <td className="p-2.5 text-right whitespace-nowrap">
                            <Badge className="bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 text-[9px] uppercase font-bold border-emerald-500/30">
                              {selectedClientForStatement.initialAssessment.status}
                            </Badge>
                          </td>
                        </tr>
                      )}

                      {/* Package Record */}
                      {selectedClientForStatement.packageItem && (
                        <tr className="bg-muted/15">
                          <td className="p-2.5 text-muted-foreground whitespace-nowrap">{selectedClientForStatement.packageItem.date}</td>
                          <td className="p-2.5 font-mono font-bold text-teal-800 dark:text-teal-300 whitespace-nowrap">{selectedClientForStatement.packageItem.receiptId}</td>
                          <td className="p-2.5 font-bold">{selectedClientForStatement.packageItem.planTitle}</td>
                          <td className="p-2.5 capitalize whitespace-nowrap">{selectedClientForStatement.packageItem.method}</td>
                          <td className="p-2.5 text-right font-black whitespace-nowrap">₹{selectedClientForStatement.packageItem.amount.toLocaleString()}</td>
                          <td className="p-2.5 text-right whitespace-nowrap">
                            <Badge className={`text-[9px] uppercase font-bold ${
                              selectedClientForStatement.packageItem.status === 'paid'
                                ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30'
                                : 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30'
                            }`}>
                              {selectedClientForStatement.packageItem.status}
                            </Badge>
                          </td>
                        </tr>
                      )}

                      {/* Individual Sessions */}
                      {selectedClientForStatement.sessionPayments.map((sess, idx) => (
                        <tr key={idx} className="hover:bg-muted/20">
                          <td className="p-2.5 text-muted-foreground pl-5 whitespace-nowrap">↳ {sess.date}</td>
                          <td className="p-2.5 font-mono text-muted-foreground whitespace-nowrap">{sess.receiptId}</td>
                          <td className="p-2.5 text-foreground">{sess.planTitle}</td>
                          <td className="p-2.5 capitalize whitespace-nowrap">{sess.method}</td>
                          <td className="p-2.5 text-right font-semibold whitespace-nowrap">₹{sess.amount.toLocaleString()}</td>
                          <td className="p-2.5 text-right whitespace-nowrap">
                            <Badge className="bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 text-[9px] uppercase font-bold border-emerald-500/30">
                              {sess.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-2.5 sm:p-3 bg-muted/20 rounded-xl text-center text-muted-foreground text-[10px] sm:text-[11px] print:hidden">
                This is an official computer-generated medical statement issued by Adaptus Physiotherapy Center.
              </div>

              {/* PRINT-ONLY OFFICIAL CLINIC STAMP & SIGNATURE BLOCK */}
              <div className="hidden print:grid grid-cols-2 gap-8 pt-6 mt-6 border-t border-slate-300 text-xs text-slate-700">
                <div className="space-y-1">
                  <span className="font-bold text-slate-900 block">Statement Verification</span>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    This is an official cumulative statement of accounts for outpatient physical therapy, home visits, and rehabilitation care delivered by Adaptus Clinic. All recorded payments are verified against clinical registers.
                  </p>
                </div>
                <div className="text-right flex flex-col justify-end items-end">
                  <div className="w-44 border-b border-slate-400 mb-1"></div>
                  <span className="font-bold text-slate-900 text-xs">Authorized Accounts Signatory</span>
                  <span className="text-[10px] text-slate-500">Adaptus Physical Therapy Center</span>
                </div>
              </div>
            </div>

            <DialogFooter className="border-t pt-3 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="gap-1.5 text-xs font-semibold w-full sm:w-auto h-9"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Statement PDF</span>
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => setIsStatementOpen(false)}
                className="text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white w-full sm:w-auto h-9"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ========================================================================= */}
      {/* 4. OFFICIAL SINGLE RECEIPT MODAL (PRESERVED)                              */}
      {/* ========================================================================= */}
      {selectedReceipt && (
        <Dialog open={isReceiptOpen} onOpenChange={setIsReceiptOpen}>
          <DialogContent className="max-w-lg w-full bg-card border-border/80 shadow-2xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 print:max-w-none print:w-full print:p-0 print:border-none print:shadow-none print:overflow-visible print:max-h-none print:bg-white">
            <DialogHeader className="border-b pb-3 pr-10 sm:pr-14 print:pr-0 print:border-slate-300">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-lg font-black text-foreground flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-teal-600" />
                    <span>Adaptus Medical Receipt</span>
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground font-mono mt-0.5">
                    Invoice Reference: {selectedReceipt.receiptId}
                  </DialogDescription>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20 font-bold uppercase text-xs mr-2 sm:mr-4 shrink-0 print:mr-0 print:border-emerald-600 print:text-emerald-800">
                  {selectedReceipt.status}
                </Badge>
              </div>
            </DialogHeader>

            <div className="space-y-4 py-3 text-xs">
              {/* CLINIC & PATIENT INFO */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 p-3.5 rounded-xl bg-muted/40 border border-border/60 print:grid-cols-2 print:border-slate-300 print:bg-slate-50 print:p-4">
                <div>
                  <span className="text-muted-foreground print:text-slate-500 block text-[10px] uppercase font-bold">Issued By</span>
                  <span className="font-bold text-foreground print:text-slate-900 block text-sm">Adaptus Clinic</span>
                  <span className="text-muted-foreground print:text-slate-600 text-[11px] block">Physiotherapy & Rehabilitation Center</span>
                </div>
                <div className="sm:text-right print:text-right">
                  <span className="text-muted-foreground print:text-slate-500 block text-[10px] uppercase font-bold">Billed To</span>
                  <span className="font-bold text-foreground print:text-slate-900 block text-sm">{selectedReceipt.patientName}</span>
                  <span className="text-muted-foreground print:text-slate-600 text-[11px] block">{selectedReceipt.phone}</span>
                </div>
              </div>

              {/* SERVICE BREAKDOWN TABLE */}
              <div className="border rounded-xl overflow-x-auto print:border-slate-300 print:overflow-visible">
                <div className="min-w-[340px] print:min-w-0">
                  <div className="bg-muted/40 p-2.5 font-bold uppercase text-[10px] text-muted-foreground grid grid-cols-4 print:bg-slate-100 print:text-slate-700 print:border-b print:border-slate-300">
                    <span className="col-span-2">Description</span>
                    <span className="text-center">Mode</span>
                    <span className="text-right">Amount</span>
                  </div>
                  <div className="p-3 grid grid-cols-4 items-center border-t print:border-slate-200">
                    <div className="col-span-2">
                      <span className="font-bold text-foreground print:text-slate-900 block">{selectedReceipt.type}</span>
                      <span className="text-muted-foreground print:text-slate-600 text-[11px] block">{selectedReceipt.planTitle}</span>
                    </div>
                    <div className="text-center">
                      <span className="capitalize font-medium text-slate-800 block">{selectedReceipt.method}</span>
                      {selectedReceipt.transactionId && (
                        <span className="text-[10px] text-teal-700 font-mono font-semibold block">
                          Ref: {selectedReceipt.transactionId}
                        </span>
                      )}
                    </div>
                    <span className="text-right font-black text-sm text-slate-900">₹{selectedReceipt.amount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* TOTAL ROW */}
              <div className="p-3.5 rounded-xl bg-teal-500/5 border border-teal-500/20 flex items-center justify-between print:border-slate-300 print:bg-slate-50">
                <div>
                  <span className="font-bold text-foreground print:text-slate-900 block">Total Amount Received</span>
                  <span className="text-[10px] text-muted-foreground print:text-slate-500">Recorded on: {selectedReceipt.date}</span>
                </div>
                <span className="text-xl font-black text-teal-800 dark:text-teal-300 print:text-teal-800">
                  ₹{selectedReceipt.amount.toLocaleString()}
                </span>
              </div>

              {/* PRINT-ONLY OFFICIAL CLINIC STAMP & SIGNATURE BLOCK */}
              <div className="hidden print:grid grid-cols-2 gap-8 pt-6 mt-6 border-t border-slate-300 text-xs text-slate-700">
                <div className="space-y-1">
                  <span className="font-bold text-slate-900 block">Terms & Information</span>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    This receipt certifies payment received for professional physical therapy and rehabilitation services. Retain this official document for insurance claims or medical reimbursement.
                  </p>
                </div>
                <div className="text-right flex flex-col justify-end items-end">
                  <div className="w-44 border-b border-slate-400 mb-1"></div>
                  <span className="font-bold text-slate-900 text-xs">Authorized Signatory</span>
                  <span className="text-[10px] text-slate-500">Adaptus Physical Therapy Center</span>
                </div>
              </div>
            </div>

            <DialogFooter className="border-t pt-3 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="gap-1.5 text-xs font-semibold w-full sm:w-auto"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Receipt</span>
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => setIsReceiptOpen(false)}
                className="text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white w-full sm:w-auto"
              >
                Done
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}