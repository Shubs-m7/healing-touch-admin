"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarWidget } from "@/components/ui/calendar";
import { 
  getBookings, 
  createBooking,
  updateBookingStatus, 
  updateBookingDetails,
  BookingResponse, 
  sendSchedulingLink, 
  suggestAlternativeTime,
  convertToPatient,
  BookingStatus
} from "@/services/bookingService";
import { painCategories, BodyPartId } from "@/data/painCategories";
import BodyMap from "@/components/booking/BodyMap";
import BodyPartSelector from "@/components/booking/BodyPartSelector";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  User,
  Mail,
  Phone,
  MapPin,
  Clock,
  Check,
  X,
  RefreshCw,
  Calendar,
  Filter,
  AlertCircle,
  Eye,
  CheckCircle2,
  XCircle,
  Activity,
  Heart,
  FileText,
  CalendarCheck2,
  Copy,
  UserCheck,
  UserPlus,
  Send,
  ChevronDown,
  IndianRupee,
  ShieldAlert,
  Stethoscope,
  Banknote,
  CreditCard,
  Receipt,
  QrCode,
  Sparkles,
  Pencil,
  Shield,
  Globe,
  Building2,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const WhatsAppIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg
    className={className}
    fill="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984 0 1.758.459 3.474 1.33 4.982l-1.413 5.163 5.286-1.385c1.455.794 3.1 1.213 4.782 1.214h.004c5.505 0 9.988-4.478 9.989-9.985 0-2.668-1.037-5.176-2.922-7.062a9.923 9.923 0 0 0-7.056-2.921zM17.48 14.854c-.234.656-1.353 1.29-1.859 1.344-.482.052-1.096.082-3.156-.763-2.637-1.082-4.331-3.766-4.462-3.94-.132-.175-1.066-1.421-1.066-2.71 0-1.288.672-1.921.912-2.182.24-.261.527-.327.702-.327.176 0 .351.002.504.01.164.007.385-.062.602.46.234.568.799 1.954.869 2.096.07.142.117.307.023.493-.093.186-.14.302-.276.463-.136.161-.286.36-.408.483-.136.137-.278.287-.12.558.158.27.703 1.16 1.512 1.88 1.04.926 1.917 1.212 2.188 1.348.27.136.43.113.59-.07.161-.183.69-.803.874-1.077.184-.274.368-.228.614-.136.246.092 1.558.734 1.827.869.27.135.45.202.515.312.065.11.065.637-.169 1.293z" />
  </svg>
);

const handleWhatsAppShare = (
  phone: string | undefined,
  bookingId: string,
  firstName: string,
  lastName: string,
  rescheduleInfo?: { date?: string; times?: string[] }
) => {
  const link = `${(process.env.NEXT_PUBLIC_PUBLIC_SITE_URL || 'http://localhost:3000')}/schedule/${bookingId}`;
  const patientName = `${firstName} ${lastName}`.trim();
  
  let message: string;
  if (rescheduleInfo && rescheduleInfo.times && rescheduleInfo.times.length > 0) {
    const timesStr = rescheduleInfo.times.join(", ");
    const dateStr = rescheduleInfo.date ? ` on ${rescheduleInfo.date}` : "";
    message = `Hello ${patientName},\n\nRegarding your appointment with Adaptus: We have recommended alternative available time slots for your session${dateStr}:\n\nRecommended Slots:\n${timesStr}\n\nPlease click the link below to select your preferred slot and confirm your session:\n${link}\n\nThank you!`;
  } else {
    message = `Hello ${patientName},\n\nHere is your appointment scheduling link from Adaptus:\n${link}\n\nPlease click the link to choose your preferred appointment time slot.\n\nThank you!`;
  }

  let cleanPhone = phone ? phone.replace(/[^0-9]/g, '') : '';
  if (cleanPhone.length === 10) cleanPhone = '91' + cleanPhone;
  
  const whatsappUrl = cleanPhone 
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
    : `https://wa.me/?text=${encodeURIComponent(message)}`;
    
  window.open(whatsappUrl, '_blank');
};
// Helper to distinguish clinic walk-in manual bookings vs online patient bookings
const isManualBooking = (b: BookingResponse) => {
  return (
    b.bookingSource === "manual_walkin" ||
    b.painDetails?.additionalNotes?.includes("Clinic Reception") ||
    b.painDetails?.description?.includes("Physical clinic walk-in") ||
    b.personalDetails?.address?.includes("Physical Clinic Patient")
  );
};

const parseToISODate = (dateStr?: string) => {
  if (!dateStr) return new Date().toISOString().split("T")[0];
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
  } catch {}
  return new Date().toISOString().split("T")[0];
};

const formatISODateToDisplay = (isoStr: string) => {
  if (!isoStr) return "";
  try {
    const d = new Date(isoStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric"
      });
    }
  } catch {}
  return isoStr;
};

const standardTimeSlots = [
  "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM",
  "06:00 PM", "07:00 PM", "08:00 PM"
];

export default function Appointments() {
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<"all" | "manual_walkin" | "online">("all");
  const [selectedBooking, setSelectedBooking] = useState<BookingResponse | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null); // holds bookingId being updated
  const [isLinkShowOpen, setIsLinkShowOpen] = useState(false);
  const [showLinkBooking, setShowLinkBooking] = useState<BookingResponse | null>(null);
  const [isSuggestOpen, setIsSuggestOpen] = useState(false);
  const [suggestBooking, setSuggestBooking] = useState<BookingResponse | null>(null);
  const [chosenAlternativeTimes, setChosenAlternativeTimes] = useState<string[]>([]);
  const [selectedSuggestDate, setSelectedSuggestDate] = useState<Date | undefined>(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [scheduleModalMode, setScheduleModalMode] = useState<"schedule" | "reschedule">("reschedule");
  const [scheduleActionType, setScheduleActionType] = useState<"direct" | "suggest">("direct");
  const [directSelectedSlot, setDirectSelectedSlot] = useState<string>("");
  const [rescheduleSuccessData, setRescheduleSuccessData] = useState<{ booking: BookingResponse; date: string; times: string[] } | null>(null);
  const [userRole, setUserRole] = useState<"admin" | "receptionist">("admin");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedRole = localStorage.getItem("admin_role");
      if (storedRole === "receptionist" || storedRole === "admin") {
        setUserRole(storedRole);
      }
    }
  }, []);

  // Interface for body part pain examination
  interface BodyPartPainLevel {
    selected: boolean;
    painLevel: number;
    side?: "left" | "right" | "both";
  }

  // Doctor Clinical Examination & Report Modal State
  const [isDoctorConsultModalOpen, setIsDoctorConsultModalOpen] = useState(false);
  const [examiningBooking, setExaminingBooking] = useState<BookingResponse | null>(null);
  const [doctorActiveTab, setDoctorActiveTab] = useState<"pain_map" | "clinical_report" | "payment">("pain_map");
  const [examBodyView, setExamBodyView] = useState<"front" | "back">("front");
  const [examBodyPartStates, setExamBodyPartStates] = useState<Record<BodyPartId, BodyPartPainLevel>>({
    neck: { selected: false, painLevel: 1 },
    shoulder: { selected: false, painLevel: 1, side: "right" },
    biceps: { selected: false, painLevel: 1, side: "right" },
    elbow: { selected: false, painLevel: 1, side: "right" },
    forearm: { selected: false, painLevel: 1, side: "right" },
    wrist: { selected: false, painLevel: 1, side: "right" },
    hand: { selected: false, painLevel: 1, side: "right" },
    chest: { selected: false, painLevel: 1 },
    back: { selected: false, painLevel: 1 },
    mid_back: { selected: false, painLevel: 1 },
    spine: { selected: false, painLevel: 1 },
    waist: { selected: false, painLevel: 1 },
    abdomen: { selected: false, painLevel: 1 },
    hip: { selected: false, painLevel: 1, side: "right" },
    glute: { selected: false, painLevel: 1, side: "right" },
    thigh: { selected: false, painLevel: 1, side: "right" },
    knee: { selected: false, painLevel: 1, side: "right" },
    shin: { selected: false, painLevel: 1, side: "right" },
    calf: { selected: false, painLevel: 1, side: "right" },
    ankle: { selected: false, painLevel: 1, side: "right" },
    foot: { selected: false, painLevel: 1, side: "right" },
  });
  const [examSelectedConditions, setExamSelectedConditions] = useState<Record<string, string[]>>({});

  const [completionForm, setCompletionForm] = useState({
    painDescription: "",
    painDuration: "weeks",
    previousTreatment: "",
    assessmentSummary: "",
    treatmentAdministered: "",
    recommendations: "",
    therapistNotes: "",
    amount: 750,
    paymentStatus: "paid" as "paid" | "pending" | "waived",
    paymentMethod: "upi" as "cash" | "upi" | "card" | "online" | "pending",
    transactionRef: ""
  });
  const [isPainProfileOpen, setIsPainProfileOpen] = useState(true);
  const [isDiagnosisOpen, setIsDiagnosisOpen] = useState(true);
  const [submittingCompletion, setSubmittingCompletion] = useState(false);

  // Strict Input Filters & Validation Rules for Patient Demographics
  const sanitizeNameInput = (val: string) => {
    // Allows only letters, spaces, hyphens, and apostrophes (max 50 chars)
    return val.replace(/[^a-zA-Z\s'-]/g, "").slice(0, 50);
  };

  const sanitizePhoneInput = (val: string) => {
    // Strictly only digits (0-9), strictly max 10 digits
    return val.replace(/\D/g, "").slice(0, 10);
  };

  const sanitizeEmailInput = (val: string) => {
    // No spaces allowed, automatically lowercase (max 80 chars)
    return val.replace(/\s/g, "").toLowerCase().slice(0, 80);
  };

  const sanitizeAgeInput = (val: string) => {
    // Only numbers allowed, max 3 digits
    return val.replace(/\D/g, "").slice(0, 3);
  };

  const validatePatientDemographics = (data: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    age: string;
    gender: string;
  }) => {
    const errors: Record<string, string> = {};

    const cleanFirst = data.firstName.trim();
    if (!cleanFirst) {
      errors.firstName = "First name is required";
    } else if (cleanFirst.length < 2) {
      errors.firstName = "Must be at least 2 characters";
    } else if (!/^[a-zA-Z][a-zA-Z\s'-]*$/.test(cleanFirst)) {
      errors.firstName = "Only letters, spaces, hyphens allowed";
    }

    const cleanLast = data.lastName.trim();
    if (!cleanLast) {
      errors.lastName = "Last name is required";
    } else if (cleanLast.length < 1) {
      errors.lastName = "Last name is required";
    } else if (!/^[a-zA-Z][a-zA-Z\s'-]*$/.test(cleanLast)) {
      errors.lastName = "Only letters, spaces, hyphens allowed";
    }

    const cleanPhone = data.phone.trim();
    if (!cleanPhone) {
      errors.phone = "Phone number is required";
    } else if (cleanPhone.length !== 10) {
      errors.phone = "Phone number must be exactly 10 digits";
    } else if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      errors.phone = "10-digit mobile must start with 6, 7, 8, or 9";
    }

    const cleanEmail = data.email.trim().toLowerCase();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!cleanEmail) {
      errors.email = "Email address is required";
    } else if (!emailRegex.test(cleanEmail)) {
      errors.email = "Enter a valid email address";
    }

    const cleanAge = data.age.trim();
    if (!cleanAge) {
      errors.age = "Age is required";
    } else {
      const ageNum = parseInt(cleanAge, 10);
      if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
        errors.age = "Age must be between 1 and 120";
      }
    }

    if (!data.gender) {
      errors.gender = "Please select a gender";
    }

    return errors;
  };

  // Manual Appointment Creation Modal State (Front-desk reception)
  const [isManualCreateOpen, setIsManualCreateOpen] = useState(false);
  const [submittingManual, setSubmittingManual] = useState(false);
  const [manualForm, setManualForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    age: "",
    gender: "" as "male" | "female" | "other" | "",
    address: "",
    scheduledDate: "",
    scheduledTime: "",
    status: "pending" as BookingStatus,
    additionalNotes: ""
  });
  const [manualTouched, setManualTouched] = useState<Record<string, boolean>>({});
  const [manualErrors, setManualErrors] = useState<Record<string, string>>({});
  const [isManualDateOpen, setIsManualDateOpen] = useState(false);
  const [isEditDateOpen, setIsEditDateOpen] = useState(false);

  const handleOpenManualCreate = () => {
    setManualForm({
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      age: "",
      gender: "",
      address: "",
      scheduledDate: "",
      scheduledTime: "",
      status: "pending",
      additionalNotes: ""
    });
    setManualTouched({});
    setManualErrors({});
    setIsManualDateOpen(false);
    setIsManualCreateOpen(true);
  };

  const parseCalendarDate = (dStr: string | Date | undefined | null) => {
    if (!dStr) return null;
    if (dStr instanceof Date) {
      if (isNaN(dStr.getTime())) return null;
      return { year: dStr.getFullYear(), month: dStr.getMonth(), day: dStr.getDate() };
    }
    const isoMatch = dStr.trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (isoMatch) {
      return {
        year: parseInt(isoMatch[1], 10),
        month: parseInt(isoMatch[2], 10) - 1,
        day: parseInt(isoMatch[3], 10)
      };
    }
    const d = new Date(dStr);
    if (isNaN(d.getTime())) return null;
    return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
  };

  const areSameCalendarDay = (d1: string | Date | undefined | null, d2: string | Date | undefined | null) => {
    const p1 = parseCalendarDate(d1);
    const p2 = parseCalendarDate(d2);
    if (!p1 || !p2) return false;
    return p1.year === p2.year && p1.month === p2.month && p1.day === p2.day;
  };

  const formatSlotDate = (dateStr?: string) => {
    if (!dateStr) return "";
    const parsed = parseCalendarDate(dateStr);
    if (!parsed) return dateStr;
    const dateObj = new Date(parsed.year, parsed.month, parsed.day);
    return dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const formatDuration = (dur?: string) => {
    if (!dur) return "—";
    switch (dur) {
      case "days": return "A few days";
      case "weeks": return "1-4 weeks";
      case "months": return "1-6 months";
      case "6months+": return "More than 6 months";
      case "years": return "Over a year";
      default: return dur.replace("months+", " months or more");
    }
  };

  const getStatusBorderColor = (status: BookingStatus) => {
    switch (status) {
      case "scheduled":
        return "border-l-4 border-l-emerald-500";
      case "scheduling":
        return "border-l-4 border-l-sky-500";
      case "link_sent":
        return "border-l-4 border-l-teal-500";
      case "converted_to_patient":
        return "border-l-4 border-l-teal-700";
      case "pending":
        return "border-l-4 border-l-amber-500";
      case "completed":
        return "border-l-4 border-l-indigo-500";
      case "cancelled":
        return "border-l-4 border-l-rose-400";
      default:
        return "border-l-4 border-l-slate-300";
    }
  };

  // Helper to retrieve booked time slots for a specific date
  const getBookedSlotsForDate = (dateStr: string, excludeBookingId?: string) => {
    if (!dateStr) return new Map<string, string>();
    const map = new Map<string, string>();
    bookings.forEach((a) => {
      if (!a.scheduledDate || !a.scheduledTime || a.status === "cancelled" || a._id === excludeBookingId) return;
      if (areSameCalendarDay(a.scheduledDate, dateStr)) {
        const patientName = `${a.personalDetails.firstName || ''} ${a.personalDetails.lastName || ''}`.trim() || "Patient";
        map.set(a.scheduledTime, patientName);
      }
    });
    return map;
  };

  const handleManualCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validatePatientDemographics(manualForm);
    setManualErrors(validationErrors);
    setManualTouched({
      firstName: true,
      lastName: true,
      phone: true,
      email: true,
      age: true,
      gender: true,
    });

    if (Object.keys(validationErrors).length > 0) {
      const firstError = Object.values(validationErrors)[0];
      toast({
        title: "Validation Error",
        description: firstError || "Please check all required patient fields.",
        variant: "destructive",
      });
      return;
    }

    const cleanFirstName = manualForm.firstName.trim();
    const cleanLastName = manualForm.lastName.trim();
    const cleanPhone = manualForm.phone.trim();
    const cleanEmail = manualForm.email.trim().toLowerCase();
    const ageVal = parseInt(manualForm.age, 10);

    // Double-booking slot conflict check (if date and slot are provided)
    if (manualForm.scheduledDate && manualForm.scheduledTime) {
      const bookedMap = getBookedSlotsForDate(manualForm.scheduledDate);
      const conflictingPatient = bookedMap.get(manualForm.scheduledTime);
      if (conflictingPatient && manualForm.status !== "cancelled") {
        toast({
          title: "Time Slot Conflict",
          description: `Time slot ${manualForm.scheduledTime} on ${manualForm.scheduledDate} is already booked for ${conflictingPatient}. Please select an open slot.`,
          variant: "destructive",
        });
        return;
      }
    }

    setSubmittingManual(true);
    try {
      const payload = {
        personalDetails: {
          firstName: cleanFirstName,
          lastName: cleanLastName,
          phone: cleanPhone,
          email: cleanEmail,
          age: String(ageVal),
          gender: manualForm.gender || "male",
          address: manualForm.address.trim() || "Physical Clinic Patient",
        },
        bodyParts: [],
        selectedConditions: {},
        painDetails: {
          description: "Physical clinic walk-in / appointment scheduled (Pending Doctor Clinical Assessment)",
          duration: "Pending Assessment",
          previousTreatment: "None",
          additionalNotes: manualForm.additionalNotes.trim() || "Registered via Clinic Reception",
        },
        scheduledDate: manualForm.scheduledDate || "",
        scheduledTime: manualForm.scheduledDate ? manualForm.scheduledTime : "",
        status: (manualForm.scheduledDate && manualForm.scheduledTime) ? manualForm.status : "pending",
        bookingSource: "manual_walkin" as const,
      };

      const res = await createBooking(payload as any);

      toast({
        title: "Appointment Registered Successfully!",
        description: manualForm.scheduledDate 
          ? `Registered visit for ${manualForm.firstName} ${manualForm.lastName} on ${manualForm.scheduledDate}${manualForm.scheduledTime ? ` at ${manualForm.scheduledTime}` : ""}. Ready for Doctor Check-in.`
          : `Registered patient ${manualForm.firstName} ${manualForm.lastName}. Scheduling portal link is ready.`,
      });

      setIsManualCreateOpen(false);
      setManualForm({
        firstName: "",
        lastName: "",
        phone: "",
        email: "",
        age: "",
        gender: "",
        address: "",
        scheduledDate: "",
        scheduledTime: "",
        status: "pending",
        additionalNotes: ""
      });
      setManualTouched({});
      setManualErrors({});

      fetchAppointments(true);
    } catch (err: any) {
      console.error("Error creating appointment manually:", err);
      toast({
        title: "Failed to create appointment",
        description: err.message || "Could not save appointment to database.",
        variant: "destructive",
      });
    } finally {
      setSubmittingManual(false);
    }
  };

  // Edit Walk-In / Appointment Details State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedBookingForEdit, setSelectedBookingForEdit] = useState<BookingResponse | null>(null);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    age: "",
    gender: "" as "male" | "female" | "other" | "",
    address: "",
    scheduledDate: "",
    scheduledTime: "10:00 AM",
    status: "scheduled" as BookingStatus,
    additionalNotes: ""
  });
  const [editTouched, setEditTouched] = useState<Record<string, boolean>>({});
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  const handleOpenEditModal = (booking: BookingResponse) => {
    if (!isManualBooking(booking)) {
      toast({
        title: "Online Booking Cannot Be Edited",
        description: "Patient website self-bookings cannot be edited.",
        variant: "destructive",
      });
      return;
    }
    setSelectedBookingForEdit(booking);
    setEditForm({
      firstName: booking.personalDetails.firstName || "",
      lastName: booking.personalDetails.lastName || "",
      phone: booking.personalDetails.phone || "",
      email: booking.personalDetails.email || "",
      age: booking.personalDetails.age || "",
      gender: (booking.personalDetails.gender as any) || "",
      address: booking.personalDetails.address || "",
      scheduledDate: booking.scheduledDate || "",
      scheduledTime: booking.scheduledTime || "",
      status: booking.status,
      additionalNotes: booking.painDetails?.additionalNotes || ""
    });
    setEditTouched({});
    setEditErrors({});
    setIsEditModalOpen(true);
  };

  const handleSaveEditAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingForEdit) return;

    const validationErrors = validatePatientDemographics(editForm);
    setEditErrors(validationErrors);
    setEditTouched({
      firstName: true,
      lastName: true,
      phone: true,
      email: true,
      age: true,
      gender: true,
    });

    if (Object.keys(validationErrors).length > 0) {
      const firstError = Object.values(validationErrors)[0];
      toast({
        title: "Validation Error",
        description: firstError || "Please check all required patient fields.",
        variant: "destructive",
      });
      return;
    }

    const cleanFirstName = editForm.firstName.trim();
    const cleanLastName = editForm.lastName.trim();
    const cleanPhone = editForm.phone.trim();
    const cleanEmail = editForm.email.trim().toLowerCase();
    const ageVal = parseInt(editForm.age, 10);

    // Double-booking slot conflict check (if date and slot are provided)
    if (editForm.scheduledDate && editForm.scheduledTime && editForm.status !== "cancelled") {
      const bookedMap = getBookedSlotsForDate(editForm.scheduledDate, selectedBookingForEdit._id);
      const conflictingPatient = bookedMap.get(editForm.scheduledTime);
      if (conflictingPatient) {
        toast({
          title: "Time Slot Conflict",
          description: `Time slot ${editForm.scheduledTime} on ${editForm.scheduledDate} is already reserved for ${conflictingPatient}. Please choose an alternate slot.`,
          variant: "destructive",
        });
        return;
      }
    }

    setIsSubmittingEdit(true);
    try {
      const payload = {
        personalDetails: {
          firstName: cleanFirstName,
          lastName: cleanLastName,
          phone: cleanPhone,
          email: cleanEmail,
          age: String(ageVal),
          gender: editForm.gender,
          address: editForm.address.trim() || "Physical Clinic Patient",
        },
        painDetails: {
          ...(selectedBookingForEdit.painDetails || {}),
          description: selectedBookingForEdit.painDetails?.description || "Physical clinic walk-in / appointment",
          duration: selectedBookingForEdit.painDetails?.duration || "Standard",
          additionalNotes: editForm.additionalNotes.trim() || selectedBookingForEdit.painDetails?.additionalNotes || "Updated via Reception",
        },
        scheduledDate: editForm.scheduledDate || "",
        scheduledTime: editForm.scheduledDate ? editForm.scheduledTime : "",
        status: editForm.status,
      };

      await updateBookingDetails(selectedBookingForEdit._id, payload as any);

      toast({
        title: "Appointment Updated Successfully!",
        description: editForm.scheduledDate 
          ? `Updated details for ${cleanFirstName} ${cleanLastName} (${editForm.scheduledDate}${editForm.scheduledTime ? ` at ${editForm.scheduledTime}` : ""}).`
          : `Updated details for ${cleanFirstName} ${cleanLastName}.`,
      });

      setIsEditModalOpen(false);
      fetchAppointments(true);
    } catch (err: any) {
      console.error("Error updating appointment:", err);
      toast({
        title: "Update Failed",
        description: err.message || "Failed to update appointment details.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleOpenDoctorConsultModal = (booking: BookingResponse) => {
    setExaminingBooking(booking);
    setDoctorActiveTab("pain_map");
    setExamBodyView("front");

    const defaultStates: Record<BodyPartId, BodyPartPainLevel> = {
      neck: { selected: false, painLevel: 1 },
      shoulder: { selected: false, painLevel: 1, side: "right" },
      biceps: { selected: false, painLevel: 1, side: "right" },
      elbow: { selected: false, painLevel: 1, side: "right" },
      forearm: { selected: false, painLevel: 1, side: "right" },
      wrist: { selected: false, painLevel: 1, side: "right" },
      hand: { selected: false, painLevel: 1, side: "right" },
      chest: { selected: false, painLevel: 1 },
      back: { selected: false, painLevel: 1 },
      mid_back: { selected: false, painLevel: 1 },
      spine: { selected: false, painLevel: 1 },
      waist: { selected: false, painLevel: 1 },
      abdomen: { selected: false, painLevel: 1 },
      hip: { selected: false, painLevel: 1, side: "right" },
      glute: { selected: false, painLevel: 1, side: "right" },
      thigh: { selected: false, painLevel: 1, side: "right" },
      knee: { selected: false, painLevel: 1, side: "right" },
      shin: { selected: false, painLevel: 1, side: "right" },
      calf: { selected: false, painLevel: 1, side: "right" },
      ankle: { selected: false, painLevel: 1, side: "right" },
      foot: { selected: false, painLevel: 1, side: "right" },
    };

    if (booking.bodyParts && booking.bodyParts.length > 0) {
      booking.bodyParts.forEach((bp) => {
        if (defaultStates[bp.partId as BodyPartId]) {
          defaultStates[bp.partId as BodyPartId] = {
            selected: bp.selected,
            painLevel: bp.painLevel || 1,
            side: bp.side || "right"
          };
        }
      });
    }
    setExamBodyPartStates(defaultStates);
    setExamSelectedConditions(booking.selectedConditions || {});

    const rawDesc = booking.painDetails?.description || "";
    const isPlaceholderDesc = rawDesc.includes("Pending Doctor Clinical Assessment") || rawDesc.includes("Physical clinic walk-in");
    const cleanDesc = isPlaceholderDesc ? "" : rawDesc;

    const rawDur = booking.painDetails?.duration || "";
    const isPlaceholderDur = rawDur === "Pending Assessment" || rawDur === "Standard";
    const cleanDur = isPlaceholderDur ? "weeks" : rawDur;

    const rawPrev = booking.painDetails?.previousTreatment || "";
    const cleanPrev = rawPrev === "None" ? "" : rawPrev;

    setCompletionForm({
      painDescription: cleanDesc,
      painDuration: cleanDur || "weeks",
      previousTreatment: cleanPrev,
      assessmentSummary: booking.completionReport?.assessmentSummary || "",
      treatmentAdministered: booking.completionReport?.treatmentAdministered || "",
      recommendations: booking.completionReport?.recommendations || "",
      therapistNotes: booking.completionReport?.therapistNotes || "",
      amount: booking.paymentDetails?.amount || 750,
      paymentStatus: booking.paymentDetails?.status || "paid",
      paymentMethod: booking.paymentDetails?.method || "upi",
      transactionRef: booking.paymentDetails?.transactionRef || ""
    });

    setIsPainProfileOpen(true);
    setIsDiagnosisOpen(true);
    setIsDoctorConsultModalOpen(true);
  };

  const handleExamTogglePart = (partId: BodyPartId, side?: "left" | "right") => {
    setExamBodyPartStates(prev => {
      const current = prev[partId] || { selected: false, painLevel: 1 };
      
      if (side) {
        if (!current.selected) {
          return {
            ...prev,
            [partId]: {
              ...current,
              selected: true,
              painLevel: current.painLevel || 5,
              side,
            },
          };
        } else if (current.side === side) {
          return {
            ...prev,
            [partId]: {
              ...current,
              selected: false,
            },
          };
        } else if (current.side && current.side !== side && current.side !== "both") {
          return {
            ...prev,
            [partId]: {
              ...current,
              selected: true,
              side: "both",
            },
          };
        } else if (current.side === "both") {
          return {
            ...prev,
            [partId]: {
              ...current,
              selected: true,
              side: side === "left" ? "right" : "left",
            },
          };
        }
      }

      const nextSelected = !current.selected;
      return {
        ...prev,
        [partId]: {
          ...current,
          selected: nextSelected,
          painLevel: nextSelected ? (current.painLevel || 5) : current.painLevel,
        },
      };
    });
  };

  const handleExamPainLevelChange = (partId: BodyPartId, level: number) => {
    setExamBodyPartStates(prev => ({
      ...prev,
      [partId]: {
        ...prev[partId],
        painLevel: level,
      },
    }));
  };

  const handleExamSideChange = (partId: BodyPartId, side: "left" | "right" | "both") => {
    setExamBodyPartStates(prev => ({
      ...prev,
      [partId]: {
        ...prev[partId],
        side,
      },
    }));
  };

  const handleExamConditionToggle = (partId: string, condition: string) => {
    setExamSelectedConditions(prev => {
      const current = prev[partId] || [];
      if (condition === "Other") {
        const hasOther = current.some((c) => c === "Other" || c.startsWith("Other:"));
        if (hasOther) {
          return { ...prev, [partId]: current.filter((c) => c !== "Other" && !c.startsWith("Other:")) };
        } else {
          return { ...prev, [partId]: [...current, "Other"] };
        }
      }
      const updated = current.includes(condition)
        ? current.filter(c => c !== condition)
        : [...current, condition];
      return { ...prev, [partId]: updated };
    });
  };

  const handleExamConditionCustomChange = (partId: string, customText: string) => {
    setExamSelectedConditions((prev) => {
      const current = prev[partId] || [];
      const withoutOther = current.filter((c) => c !== "Other" && !c.startsWith("Other:"));
      const newCondition = customText.trim() ? `Other: ${customText.trim()}` : "Other";
      return { ...prev, [partId]: [...withoutOther, newCondition] };
    });
  };

  const handleDoctorConsultSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examiningBooking) return;

    if (!completionForm.assessmentSummary.trim()) {
      setDoctorActiveTab("clinical_report");
      setIsDiagnosisOpen(true);
      toast({
        title: "Clinical Assessment Required",
        description: "Please enter the doctor's clinical assessment summary and diagnosis.",
        variant: "destructive",
      });
      return;
    }

    if (!completionForm.treatmentAdministered.trim()) {
      setDoctorActiveTab("clinical_report");
      setIsDiagnosisOpen(true);
      toast({
        title: "Treatment Administered Required",
        description: "Please specify the treatment administered during this clinical consultation.",
        variant: "destructive",
      });
      return;
    }

    const cleanAmount = Number(completionForm.amount);
    if (isNaN(cleanAmount) || cleanAmount < 0) {
      setDoctorActiveTab("payment");
      toast({
        title: "Invalid Consultation Amount",
        description: "Please enter a valid non-negative consultation fee amount.",
        variant: "destructive",
      });
      return;
    }

    setSubmittingCompletion(true);
    try {
      const formattedBodyParts = Object.entries(examBodyPartStates)
        .filter(([_, state]) => state.selected)
        .map(([partId, state]) => ({
          partId,
          painLevel: state.painLevel,
          side: state.side,
          selected: true
        }));

      const updated = await updateBookingStatus(examiningBooking._id, "completed", {
        bodyParts: formattedBodyParts,
        selectedConditions: examSelectedConditions,
        painDetails: {
          description: completionForm.painDescription.trim() || completionForm.assessmentSummary || "Doctor clinical assessment completed.",
          duration: completionForm.painDuration || "weeks",
          previousTreatment: completionForm.previousTreatment.trim() || "None",
          additionalNotes: completionForm.therapistNotes || examiningBooking.painDetails?.additionalNotes || ""
        },
        completionReport: {
          assessmentSummary: completionForm.assessmentSummary,
          treatmentAdministered: completionForm.treatmentAdministered,
          recommendations: completionForm.recommendations,
          therapistNotes: completionForm.therapistNotes
        },
        paymentDetails: {
          amount: Number(completionForm.amount) || 750,
          status: completionForm.paymentStatus,
          method: completionForm.paymentMethod,
          transactionRef: completionForm.transactionRef
        }
      });

      // Update local state
      setBookings((prev) => prev.map((b) => (b._id === examiningBooking._id ? updated : b)));
      if (selectedBooking && selectedBooking._id === examiningBooking._id) {
        setSelectedBooking(updated);
      }

      setIsDoctorConsultModalOpen(false);
      toast({
        title: "Doctor Clinical Report Saved & Consultation Completed",
        description: `Consultation completed for ${examiningBooking.personalDetails.firstName} ${examiningBooking.personalDetails.lastName}. Home visit / assessment fee ₹${completionForm.amount} recorded. Ready for care package conversion.`,
      });
    } catch (error: any) {
      console.error("Error submitting clinical report:", error);
      toast({
        title: "Failed to complete clinical consultation",
        description: error.message || "Could not save clinical report.",
        variant: "destructive",
      });
    } finally {
      setSubmittingCompletion(false);
    }
  };

  const { toast } = useToast();

  const fetchAppointments = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await getBookings();
      setBookings(data);
    } catch (error: any) {
      console.error("Error fetching bookings:", error);
      toast({
        title: "Error fetching bookings",
        description: error.message || "Failed to load bookings from the database.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleStatusUpdate = async (id: string, newStatus: BookingStatus) => {
    setActionLoading(id);
    try {
      const updated = await updateBookingStatus(id, newStatus);
      
      // Update local state
      setBookings((prev) => prev.map((b) => (b._id === id ? updated : b)));
      
      // Update currently viewed details if open
      if (selectedBooking && selectedBooking._id === id) {
        setSelectedBooking(updated);
      }

      if ((newStatus === "scheduled" || newStatus === "confirmed") && !updated.scheduledDate) {
        setShowLinkBooking(updated);
        setIsLinkShowOpen(true);
      }

      toast({
        title: `Status Updated`,
        description: `Successfully marked booking as ${newStatus.replace('_', ' ')}.`,
      });
    } catch (error: any) {
      console.error(`Error updating booking to ${newStatus}:`, error);
      toast({
        title: "Status update failed",
        description: error.message || "Failed to update booking status.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendLink = async (id: string) => {
    setActionLoading(id);
    try {
      const updated = await sendSchedulingLink(id);
      
      // Update local state
      setBookings((prev) => prev.map((b) => (b._id === id ? updated : b)));
      
      // Update currently viewed details if open
      if (selectedBooking && selectedBooking._id === id) {
        setSelectedBooking(updated);
      }

      setShowLinkBooking(updated);
      setIsLinkShowOpen(true);

      toast({
        title: "Link Sent & Status Updated",
        description: "Successfully updated status to Link Sent and emailed scheduling link to patient.",
      });
    } catch (error: any) {
      console.error("Error sending scheduling link:", error);
      if (error.message?.includes("Booking not found")) {
        fetchAppointments(true);
      }
      toast({
        title: "Failed to send link",
        description: error.message?.includes("Booking not found") 
          ? "This booking ID no longer exists. List has been refreshed." 
          : (error.message || "Failed to send scheduling link."),
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleConvertToPatient = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await convertToPatient(id);
      
      // Update list state
      setBookings((prev) => prev.map((b) => (b._id === id ? res.booking : b)));
      
      // Update details view if open
      if (selectedBooking && selectedBooking._id === id) {
        setSelectedBooking(res.booking);
      }

      toast({
        title: "Converted to Patient Profile",
        description: `Successfully created permanent patient record for ${res.patient.firstName} ${res.patient.lastName}.`,
      });
    } catch (error: any) {
      console.error("Error converting booking to patient:", error);
      toast({
        title: "Conversion Failed",
        description: error.message || "Could not convert booking to patient profile.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenSchedule = (booking: BookingResponse) => {
    setSuggestBooking(booking);
    setScheduleModalMode("schedule");
    setScheduleActionType("direct");
    setDirectSelectedSlot(booking.scheduledTime || "");
    setChosenAlternativeTimes(booking.suggestedTimes || []);
    setSelectedSuggestDate(booking.scheduledDate ? new Date(booking.scheduledDate) : new Date());
    setIsSuggestOpen(true);
  };

  const handleOpenReschedule = (booking: BookingResponse) => {
    setSuggestBooking(booking);
    setScheduleModalMode("reschedule");
    setScheduleActionType("direct");
    setDirectSelectedSlot(booking.scheduledTime || "");
    setChosenAlternativeTimes(booking.suggestedTimes || []);
    setSelectedSuggestDate(booking.scheduledDate ? new Date(booking.scheduledDate) : new Date());
    setIsSuggestOpen(true);
  };

  const handleDirectScheduleSubmit = async () => {
    if (!suggestBooking || !selectedSuggestDate || !directSelectedSlot) return;
    setActionLoading(suggestBooking._id);
    try {
      const formattedDisplayDate = format(selectedSuggestDate, "MMMM d, yyyy");
      
      // Collision check
      const bookedMap = getBookedSlotsForDate(formattedDisplayDate, suggestBooking._id);
      const conflictingPatient = bookedMap.get(directSelectedSlot);
      if (conflictingPatient) {
        toast({
          title: "Time Slot Conflict",
          description: `Time slot ${directSelectedSlot} on ${formattedDisplayDate} is already reserved for ${conflictingPatient}. Please choose an alternate slot.`,
          variant: "destructive",
        });
        setActionLoading(null);
        return;
      }

      const payload = {
        scheduledDate: formattedDisplayDate,
        scheduledTime: directSelectedSlot,
        status: "scheduled" as BookingStatus,
      };

      const updated = await updateBookingDetails(suggestBooking._id, payload as any);

      // Update list state
      setBookings((prev) => prev.map((b) => (b._id === suggestBooking._id ? updated : b)));
      
      // Update details view if open
      if (selectedBooking && selectedBooking._id === suggestBooking._id) {
        setSelectedBooking(updated);
      }

      setIsSuggestOpen(false);
      toast({
        title: scheduleModalMode === "reschedule" ? "Appointment Rescheduled!" : "Appointment Scheduled!",
        description: `Confirmed for ${updated.personalDetails.firstName} ${updated.personalDetails.lastName} on ${formattedDisplayDate} at ${directSelectedSlot}.`,
      });
    } catch (error: any) {
      console.error("Error scheduling appointment slot:", error);
      toast({
        title: "Failed to schedule slot",
        description: error.message || "Could not update appointment schedule.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuggestTimeSubmit = async () => {
    if (!suggestBooking || chosenAlternativeTimes.length === 0) return;
    setActionLoading(suggestBooking._id);
    try {
      const formattedDisplayDate = selectedSuggestDate ? format(selectedSuggestDate, "MMMM d, yyyy") : (suggestBooking.scheduledDate || "");
      const updated = await suggestAlternativeTime(suggestBooking._id, chosenAlternativeTimes, formattedDisplayDate);
      
      // Update list state
      setBookings((prev) => prev.map((b) => (b._id === suggestBooking._id ? updated : b)));
      
      // Update details view if open
      if (selectedBooking && selectedBooking._id === suggestBooking._id) {
        setSelectedBooking(updated);
      }

      setIsSuggestOpen(false);
      setRescheduleSuccessData({
        booking: updated,
        date: formattedDisplayDate,
        times: [...chosenAlternativeTimes],
      });
      toast({
        title: "Reschedule & Date Suggested",
        description: `Recommendation saved for ${formattedDisplayDate} at ${chosenAlternativeTimes.join(', ')}.`,
      });
    } catch (error: any) {
      console.error("Error suggesting alternative time:", error);
      toast({
        title: "Failed to suggest time",
        description: error.message || "Could not send reschedule suggestion email.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Stats calculation
  const totalCount = bookings.length;
  const manualCount = bookings.filter(isManualBooking).length;
  const onlineCount = bookings.filter((b) => !isManualBooking(b)).length;
  const pendingCount = bookings.filter((b) => b.status === "pending").length;
  const linkSentCount = bookings.filter((b) => b.status === "link_sent").length;
  const scheduledCount = bookings.filter((b) => b.status === "scheduled" || b.status === "confirmed").length;
  const completedCount = bookings.filter((b) => b.status === "completed").length;
  const convertedCount = bookings.filter((b) => b.status === "converted_to_patient").length;

  // Filter bookings by Status, Source Origin (Manual vs Online), and Search
  const filteredBookings = bookings.filter((b) => {
    if (activeFilter !== "all" && b.status !== activeFilter) {
      return false;
    }
    if (sourceFilter === "manual_walkin" && !isManualBooking(b)) {
      return false;
    }
    if (sourceFilter === "online" && isManualBooking(b)) {
      return false;
    }

    const name = `${b.personalDetails.firstName} ${b.personalDetails.lastName}`.toLowerCase();
    const email = b.personalDetails.email.toLowerCase();
    const phone = b.personalDetails.phone;
    const query = searchQuery.toLowerCase();
    
    return name.includes(query) || email.includes(query) || phone.includes(query);
  });

  const getStatusBadge = (status: BookingResponse["status"]) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/15 border-amber-500/25 capitalize font-bold text-[11px] px-2.5 py-0.5 rounded-full shadow-2xs">
            Pending Review
          </Badge>
        );
      case "link_sent":
        return (
          <Badge className="bg-teal-500/10 text-teal-700 dark:text-teal-300 hover:bg-teal-500/15 border-teal-500/25 capitalize font-bold text-[11px] px-2.5 py-0.5 rounded-full shadow-2xs">
            Link Sent
          </Badge>
        );
      case "scheduling":
        return (
          <Badge className="bg-sky-500/10 text-sky-700 dark:text-sky-300 hover:bg-sky-500/15 border-sky-500/25 capitalize font-bold text-[11px] px-2.5 py-0.5 rounded-full shadow-2xs">
            Scheduling Slot
          </Badge>
        );
      case "scheduled":
      case "confirmed":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/15 border-emerald-500/25 capitalize font-bold text-[11px] px-2.5 py-0.5 rounded-full shadow-2xs">
            Appt Scheduled
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-teal-500/10 text-teal-700 dark:text-teal-300 hover:bg-teal-500/15 border-teal-500/25 capitalize font-bold text-[11px] px-2.5 py-0.5 rounded-full shadow-2xs">
            Appt Completed
          </Badge>
        );
      case "converted_to_patient":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/15 border-emerald-500/25 capitalize font-bold text-[11px] px-2.5 py-0.5 rounded-full shadow-2xs inline-flex items-center gap-1">
            <UserCheck className="h-3 w-3" />
            Converted Patient
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-rose-500/10 text-rose-700 dark:text-rose-400 hover:bg-rose-500/15 border-rose-500/25 capitalize font-bold text-[11px] px-2.5 py-0.5 rounded-full shadow-2xs">
            Cancelled
          </Badge>
        );
      default:
        return (
          <Badge className="bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-500/15 border-zinc-500/25 capitalize font-bold text-[11px] px-2.5 py-0.5 rounded-full shadow-2xs">
            {status}
          </Badge>
        );
    }
  };

  const getPainLevelColor = (level: number) => {
    if (level <= 3) return "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/25";
    if (level <= 7) return "bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/25";
    return "bg-rose-500/10 text-rose-800 dark:text-rose-300 border-rose-500/25";
  };

  const formatBookingDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Appointments Lifecycle</h1>
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
              ? "Register clinic booking patient personal details and schedule appointment slots. Clinical examination and reporting are handled by the doctor."
              : "Manage patient booking requests, conduct doctor examinations, generate clinical reports, and convert to permanent care packages."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleOpenManualCreate}
            className="gap-2 h-9 bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-sm"
          >
            <UserPlus className="h-4 w-4" />
            {userRole === "receptionist" ? "Register Clinic Booking" : "Add Clinic Booking"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchAppointments(true)}
            disabled={loading || refreshing}
            className="gap-2 h-9"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* STATS OVERVIEW */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        <div className="p-3 bg-card border rounded-xl shadow-sm flex flex-col justify-between">
          <span className="text-xs font-medium text-muted-foreground">Total Bookings</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold">{totalCount}</span>
            <div className="p-1 rounded-full bg-primary/10 text-primary">
              <Calendar className="h-3.5 w-3.5" />
            </div>
          </div>
        </div>

        <div className="p-3 bg-card border rounded-xl shadow-sm flex flex-col justify-between border-amber-500/20 bg-amber-500/5">
          <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5" /> Clinic Bookings
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold text-amber-600">{manualCount}</span>
            <div className="p-1 rounded-full bg-amber-500/10 text-amber-600">
              <UserPlus className="h-3.5 w-3.5" />
            </div>
          </div>
        </div>

        <div className="p-3 bg-card border rounded-xl shadow-sm flex flex-col justify-between border-teal-500/20 bg-teal-500/5">
          <span className="text-xs font-semibold text-teal-800 dark:text-teal-300 flex items-center gap-1.5">
            <Globe className="h-3.5 w-3.5" /> Online Bookings
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold text-teal-700 dark:text-teal-300">{onlineCount}</span>
            <div className="p-1 rounded-full bg-teal-500/10 text-teal-700">
              <Send className="h-3.5 w-3.5" />
            </div>
          </div>
        </div>

        <div className="p-3 bg-card border rounded-xl shadow-sm flex flex-col justify-between">
          <span className="text-xs font-medium text-muted-foreground">Scheduled</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold text-emerald-500">{scheduledCount}</span>
            <div className="p-1 rounded-full bg-emerald-500/10 text-emerald-500">
              <Check className="h-3.5 w-3.5" />
            </div>
          </div>
        </div>

        <div className="p-3 bg-card border rounded-xl shadow-sm flex flex-col justify-between">
          <span className="text-xs font-medium text-muted-foreground">Completed</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold text-teal-600">{completedCount}</span>
            <div className="p-1 rounded-full bg-teal-500/10 text-teal-600">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
          </div>
        </div>

        <div className="p-3 bg-card border rounded-xl shadow-sm flex flex-col justify-between">
          <span className="text-xs font-medium text-muted-foreground">Converted</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{convertedCount}</span>
            <div className="p-1 rounded-full bg-emerald-500/10 text-emerald-700">
              <UserCheck className="h-3.5 w-3.5" />
            </div>
          </div>
        </div>
      </div>

      {/* DEDICATED CHANNEL ORIGIN & STATUS FILTER CONTROLS */}
      <div className="space-y-3 bg-card p-4 rounded-xl border">
        {/* TOP ROW: BOOKING SOURCE CHANNEL SELECTOR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Booking Origin:</span>
            <div className="flex items-center gap-1.5 bg-muted p-1 rounded-lg">
              <button
                onClick={() => setSourceFilter("all")}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition flex items-center gap-1.5 ${
                  sourceFilter === "all"
                    ? "bg-background text-foreground shadow-sm font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>All Sources</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-muted-foreground/20 font-bold">
                  {totalCount}
                </span>
              </button>

              <button
                onClick={() => setSourceFilter("manual_walkin")}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition flex items-center gap-1.5 ${
                  sourceFilter === "manual_walkin"
                    ? "bg-amber-500 text-white shadow-sm font-bold"
                    : "text-muted-foreground hover:text-amber-600"
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Clinic Bookings</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  sourceFilter === "manual_walkin" ? "bg-white/25 text-white" : "bg-amber-500/15 text-amber-600"
                }`}>
                  {manualCount}
                </span>
              </button>

              <button
                onClick={() => setSourceFilter("online")}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition flex items-center gap-1.5 ${
                  sourceFilter === "online"
                    ? "bg-teal-700 text-white shadow-sm font-bold"
                    : "text-muted-foreground hover:text-teal-700"
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Online Website Bookings</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  sourceFilter === "online" ? "bg-white/25 text-white" : "bg-teal-500/15 text-teal-800"
                }`}>
                  {onlineCount}
                </span>
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search patient, email, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>
        </div>

        {/* BOTTOM ROW: STATUS FILTERS */}
        <div className="flex flex-wrap items-center gap-1">
          <span className="text-xs font-semibold text-muted-foreground mr-1.5 hidden sm:inline">Status:</span>
          {[
            { key: "all", label: "All Statuses" },
            { key: "pending", label: "Pending" },
            { key: "link_sent", label: "Link Sent" },
            { key: "scheduling", label: "Scheduling" },
            { key: "scheduled", label: "Scheduled" },
            { key: "completed", label: "Completed" },
            { key: "converted_to_patient", label: "Converted" },
            { key: "cancelled", label: "Cancelled" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveFilter(key)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                activeFilter === key
                  ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                  : "bg-muted/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* LIST TABLE OR CARDS */}
      {loading ? (
        <div className="bg-card rounded-xl border shadow-sm p-12 text-center flex flex-col items-center justify-center gap-3">
          <RefreshCw className="h-8 w-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Loading appointments list...</p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="bg-card rounded-xl border shadow-sm p-16 text-center max-w-md mx-auto flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <AlertCircle className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg">No appointments found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {searchQuery
              ? "No patients match your search query."
              : `There are currently no appointments in the ${activeFilter} state.`}
          </p>
        </div>
      ) : (
        <>
          {/* MOBILE VIEW: INDEPENDENT TOUCH CARDS (block md:hidden) */}
          <div className="block md:hidden space-y-3.5">
            {filteredBookings.map((b, idx) => {
              const isClinic = isManualBooking(b);
              const token = b._id ? `#APT-${b._id.slice(-4).toUpperCase()}` : `#${idx + 1}`;
              const borderAccent = getStatusBorderColor(b.status);

              return (
                <div
                  key={b._id}
                  className={`bg-card rounded-2xl border border-border/80 shadow-xs p-4 space-y-3 hover:border-teal-500/40 transition-all ${borderAccent}`}
                >
                  {/* Card Top: Token ID & Channel & Status Badge */}
                  <div className="flex items-center justify-between pb-2 border-b border-border/50 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                        {token}
                      </span>
                      {isClinic ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                          <Building2 className="w-3 h-3" /> Clinic Visit
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/15 text-teal-800 dark:text-teal-300 border border-teal-500/30">
                          <Globe className="w-3 h-3" /> Online Booking
                        </span>
                      )}
                    </div>
                    <div className="shrink-0 scale-90 origin-right">
                      {getStatusBadge(b.status)}
                    </div>
                  </div>

                  {/* Patient Profile & Avatar */}
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full font-black text-xs flex items-center justify-center shrink-0 border shadow-2xs ${
                        isClinic
                          ? "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30"
                          : "bg-teal-500/15 text-teal-800 dark:text-teal-300 border-teal-500/30"
                      }`}
                    >
                      {b.personalDetails.firstName?.[0] || "P"}{b.personalDetails.lastName?.[0] || ""}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-sm text-foreground truncate">
                        {b.personalDetails.firstName} {b.personalDetails.lastName}
                      </h4>
                      <span className="text-[11px] text-muted-foreground block truncate">
                        Booked: {formatBookingDate(b.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Scheduled Slot Highlight Box */}
                  <div className="p-3 rounded-xl bg-muted/30 border border-border/60 flex flex-col gap-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                        Slot:
                      </span>
                      {b.scheduledDate && b.scheduledTime ? (
                        <span className="font-extrabold text-foreground flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                          {formatSlotDate(b.scheduledDate)} at {b.scheduledTime}
                        </span>
                      ) : b.status === "link_sent" ? (
                        <span className="text-teal-700 dark:text-teal-300 font-semibold text-[11px]">
                          Awaiting Slot Selection
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-[11px]">Not Scheduled Yet</span>
                      )}
                    </div>
                    {b.suggestedTimes && b.suggestedTimes.length > 0 && (
                      <div className="text-[10px] text-amber-800 dark:text-amber-300 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20 mt-1">
                        <span>Alternate Slots: {b.suggestedTimes.slice(0, 3).join(', ')}{b.suggestedTimes.length > 3 ? ` +${b.suggestedTimes.length - 3} more` : ''}</span>
                      </div>
                    )}
                  </div>

                  {/* Contact Info & Pain Areas */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                    <div className="flex items-center gap-3 text-muted-foreground text-[11px]">
                      <a href={`tel:${b.personalDetails.phone}`} className="hover:text-teal-700 font-medium inline-flex items-center gap-1">
                        <Phone className="w-3 h-3 text-teal-600" /> {b.personalDetails.phone}
                      </a>
                      <span className="truncate max-w-[130px] inline-flex items-center gap-1">
                        <Mail className="w-3 h-3 text-teal-600" /> {b.personalDetails.email}
                      </span>
                    </div>

                    {b.bodyParts && b.bodyParts.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap">
                        {b.bodyParts.slice(0, 2).map((bp) => (
                          <Badge
                            key={bp.partId}
                            variant="outline"
                            className={`text-[9px] px-1.5 py-0 ${getPainLevelColor(bp.painLevel)}`}
                          >
                            {painCategories[bp.partId]?.name || bp.partId}
                          </Badge>
                        ))}
                        {b.bodyParts.length > 2 && (
                          <span className="text-[9px] text-muted-foreground font-semibold">
                            +{b.bodyParts.length - 2} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* View Details Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedBooking(b);
                      setIsDetailsOpen(true);
                    }}
                    className="w-full h-9 text-xs font-bold text-teal-900 dark:text-teal-200 hover:text-white bg-teal-500/10 hover:bg-teal-700 border-teal-500/30 gap-1.5 rounded-xl transition-all shadow-2xs mt-1"
                  >
                    <Eye className="h-3.5 w-3.5 text-teal-700 dark:text-teal-300" />
                    <span>View Details & Actions</span>
                  </Button>
                </div>
              );
            })}
          </div>

          {/* DESKTOP TABLE VIEW (hidden md:block) */}
          {/* DESKTOP TABLE VIEW (hidden md:block) - Zero Side Scroll */}
          <div className="hidden md:block bg-card rounded-xl border shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/40 border-b border-border/80">
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground w-[30%]">Patient</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground w-[27%]">Schedule & Booking</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground w-[21%]">Pain Areas</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground w-[13%]">Status</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right w-[9%] sticky right-0 z-20 bg-muted/95 backdrop-blur-xs shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.06)]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-xs">
                {filteredBookings.map((b, idx) => {
                  const isClinic = isManualBooking(b);
                  const token = b._id ? `#APT-${b._id.slice(-4).toUpperCase()}` : `#${idx + 1}`;

                  return (
                    <tr key={b._id} className="group hover:bg-muted/20 transition-colors">
                      {/* Patient */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center shrink-0 border ${
                              isClinic
                                ? "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30"
                                : "bg-teal-500/15 text-teal-800 dark:text-teal-300 border-teal-500/30"
                            }`}
                          >
                            {b.personalDetails.firstName?.[0] || "P"}{b.personalDetails.lastName?.[0] || ""}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-sm text-foreground truncate">
                                {b.personalDetails.firstName} {b.personalDetails.lastName}
                              </span>
                              {isClinic ? (
                                <span className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                                  <Building2 className="w-2.5 h-2.5" /> Clinic
                                </span>
                              ) : (
                                <span className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-teal-500/15 text-teal-800 dark:text-teal-300 border border-teal-500/30">
                                  <Globe className="w-2.5 h-2.5" /> Online
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5 truncate">
                              <span className="font-mono text-[9px] font-semibold text-slate-600 dark:text-slate-300 bg-muted/80 px-1.5 py-0.2 rounded border border-border/60 shrink-0">
                                {token}
                              </span>
                              <span className="shrink-0">{b.personalDetails.phone}</span>
                              <span className="shrink-0 opacity-40">•</span>
                              <span className="truncate max-w-[140px]" title={b.personalDetails.email}>{b.personalDetails.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Schedule & Booking */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {b.scheduledDate && b.scheduledTime ? (
                          <div className="flex flex-col">
                            <span className="font-bold text-foreground flex items-center gap-1.5 text-xs">
                              <Calendar className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                              {formatSlotDate(b.scheduledDate)} at {b.scheduledTime}
                            </span>
                            <span className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Clock className="h-3 w-3 shrink-0 opacity-70" />
                              Booked: {formatBookingDate(b.createdAt)}
                              {b.suggestedTimes && b.suggestedTimes.length > 0 && (
                                <span className="text-[9px] text-amber-700 dark:text-amber-300 font-semibold bg-amber-500/10 px-1 py-0.2 rounded border border-amber-500/20 ml-1">
                                  +{b.suggestedTimes.length} alt
                                </span>
                              )}
                            </span>
                          </div>
                        ) : b.status === "link_sent" ? (
                          <div className="flex flex-col">
                            <span className="text-[10px] text-teal-700 dark:text-teal-300 font-semibold bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20 w-fit">
                              Awaiting Slot Selection
                            </span>
                            <span className="text-[11px] text-muted-foreground mt-0.5">
                              Booked: {formatBookingDate(b.createdAt)}
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col">
                            <span className="text-muted-foreground text-xs">— Not Scheduled —</span>
                            <span className="text-[11px] text-muted-foreground mt-0.5">
                              Booked: {formatBookingDate(b.createdAt)}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Pain Areas */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {b.bodyParts && b.bodyParts.length > 0 ? (
                          <div 
                            className="flex flex-col gap-1 max-w-[170px]"
                            title={b.bodyParts.map(bp => `${painCategories[bp.partId]?.name || bp.partId} (${bp.painLevel}/10)`).join(', ')}
                          >
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold whitespace-nowrap border shadow-2xs w-fit ${getPainLevelColor(b.bodyParts[0].painLevel)}`}>
                              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
                              <span>{painCategories[b.bodyParts[0].partId]?.name || b.bodyParts[0].partId}</span>
                              <span className="text-[10px] font-normal opacity-75">({b.bodyParts[0].painLevel}/10)</span>
                            </span>

                            {b.bodyParts.length > 1 && (
                              <div className="flex items-center gap-1">
                                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold whitespace-nowrap border shadow-2xs w-fit ${getPainLevelColor(b.bodyParts[1].painLevel)}`}>
                                  <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
                                  <span>{painCategories[b.bodyParts[1].partId]?.name || b.bodyParts[1].partId}</span>
                                  <span className="text-[10px] font-normal opacity-75">({b.bodyParts[1].painLevel}/10)</span>
                                </span>
                                {b.bodyParts.length > 2 && (
                                  <span className="text-[10px] text-muted-foreground font-bold px-1.5 py-0.5 bg-muted/80 border border-border/60 rounded-md shrink-0">
                                    +{b.bodyParts.length - 2}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-muted-foreground/80 font-medium bg-muted/50 px-2 py-0.5 rounded-md border border-border/50 inline-flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            General Assessment
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 whitespace-nowrap">{getStatusBadge(b.status)}</td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right whitespace-nowrap sticky right-0 z-10 bg-card group-hover:bg-muted/30 backdrop-blur-xs shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.06)]">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedBooking(b);
                            setIsDetailsOpen(true);
                          }}
                          className="h-7 px-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-white hover:bg-teal-700 hover:border-teal-700 border-slate-200 dark:border-slate-700 gap-1 rounded-lg transition-all shadow-2xs"
                          title="View Details & Actions"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>View</span>
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

      {/* DETAIL DIALOG */}
      {selectedBooking && (
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border/80 shadow-2xl rounded-3xl p-5 sm:p-6">
            <DialogHeader className="border-b border-border/70 pb-4 pr-8 sm:pr-10">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0 border border-teal-500/20 shadow-2xs">
                  <CalendarCheck2 className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <DialogTitle className="text-lg sm:text-xl font-black text-foreground tracking-tight">
                      Appointment Details
                    </DialogTitle>
                    {getStatusBadge(selectedBooking.status)}
                  </div>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5 flex-wrap">
                    <span>Booked on {formatBookingDate(selectedBooking.createdAt)}</span>
                    <span className="text-muted-foreground/40 font-bold">•</span>
                    <span className="font-mono text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md border border-border/60">
                      #{selectedBooking._id.slice(-6).toUpperCase()}
                    </span>
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* SECTION 1: PERSONAL INFORMATION */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold flex items-center gap-2 text-primary">
                    <User className="h-4 w-4" /> Personal Information
                  </h4>
                  <div className="flex items-center gap-2 flex-wrap">
                    {isManualBooking(selectedBooking) ? (
                      <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 text-xs font-bold w-fit inline-flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5" /> Clinic Booking Registration
                      </Badge>
                    ) : (
                      <Badge className="bg-teal-500/15 text-teal-800 dark:text-teal-300 border-teal-500/30 text-xs font-bold w-fit inline-flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5" /> Online Patient Self-Booking
                      </Badge>
                    )}
                    {isManualBooking(selectedBooking) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsDetailsOpen(false);
                          handleOpenEditModal(selectedBooking);
                        }}
                        className="h-7 px-2.5 text-xs font-semibold border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-teal-800 hover:bg-teal-50 dark:hover:bg-teal-950/50 hover:border-teal-400 gap-1.5 shadow-2xs transition-all"
                      >
                        <Pencil className="h-3 w-3 text-slate-500" />
                        Edit Details
                      </Button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-muted/30 p-4 rounded-xl border">
                  <div>
                    <span className="text-xs text-muted-foreground block">Full Name</span>
                    <span className="text-sm font-medium">
                      {selectedBooking.personalDetails.firstName} {selectedBooking.personalDetails.lastName}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Age</span>
                    <span className="text-sm font-medium">{selectedBooking.personalDetails.age} years</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Gender</span>
                    <span className="text-sm font-medium capitalize">{selectedBooking.personalDetails.gender}</span>
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <span className="text-xs text-muted-foreground block">Phone</span>
                    <span className="text-sm font-medium flex items-center gap-1">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      {selectedBooking.personalDetails.phone}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-xs text-muted-foreground block">Email</span>
                    <span className="text-sm font-medium flex items-center gap-1 break-all">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      {selectedBooking.personalDetails.email}
                    </span>
                  </div>
                  <div className="col-span-2 md:col-span-3 border-t pt-2 mt-2">
                    <span className="text-xs text-muted-foreground block">Address</span>
                    <span className="text-sm font-medium flex items-start gap-1">
                      <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      {selectedBooking.personalDetails.address}
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 2: PAIN LOCATIONS & LEVELS */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold flex items-center gap-2 text-primary">
                    <Activity className="h-4 w-4" /> Pain Locations & Diagnosis
                  </h4>
                  {selectedBooking.status !== "cancelled" && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={actionLoading === selectedBooking._id}
                      onClick={() => {
                        setIsDetailsOpen(false);
                        handleOpenDoctorConsultModal(selectedBooking);
                      }}
                      className="h-7 px-2.5 text-xs font-semibold border-teal-600/40 text-teal-800 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/50 hover:border-teal-600 gap-1.5 shadow-2xs transition-all"
                    >
                      <Stethoscope className="h-3.5 w-3.5 text-teal-600" />
                      Doctor Examination
                    </Button>
                  )}
                </div>
                {selectedBooking.bodyParts.length > 0 ? (
                  <div className="grid sm:grid-cols-2 gap-3">
                    {selectedBooking.bodyParts.map((bp) => {
                      const conditions = selectedBooking.selectedConditions[bp.partId] || [];
                      return (
                        <div key={bp.partId} className="border p-3 rounded-xl flex flex-col justify-between bg-card">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-sm">
                              {painCategories[bp.partId]?.name || bp.partId}
                              {bp.side && <span className="text-xs text-muted-foreground capitalize"> ({bp.side})</span>}
                            </span>
                            <Badge className={`text-xs font-semibold ${getPainLevelColor(bp.painLevel)}`}>
                              Pain: {bp.painLevel}/10
                            </Badge>
                          </div>
                          {conditions.length > 0 ? (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {conditions.map((cond) => (
                                <Badge key={cond} variant="secondary" className="text-[10px] px-1.5 py-0">
                                  {cond}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground mt-2 italic">No conditions selected</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl border border-dashed border-teal-600/20 bg-teal-50/20 dark:bg-teal-950/10 text-xs text-muted-foreground flex items-center justify-between">
                    <span>Clinical examination pending. Click &ldquo;Doctor Examination&rdquo; to conduct physical assessment &amp; pain mapping.</span>
                  </div>
                )}
              </div>

              {/* SECTION 3: PAIN DETAILS & DESCRIPTIONS (Only shown when filled with real clinical/patient data) */}
              {selectedBooking.painDetails &&
                selectedBooking.painDetails.description &&
                !selectedBooking.painDetails.description.includes("Pending Doctor Clinical Assessment") &&
                !selectedBooking.painDetails.description.includes("Physical clinic walk-in") &&
                selectedBooking.painDetails.duration !== "Pending Assessment" &&
                selectedBooking.painDetails.duration !== "Standard" && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold flex items-center gap-2 text-primary">
                    <FileText className="h-4 w-4" /> Clinical Pain Profile
                  </h4>
                  <div className="bg-muted/30 p-4 rounded-xl border space-y-4">
                    <div>
                      <span className="text-xs text-muted-foreground block uppercase font-mono tracking-wider font-semibold">
                        Pain Description
                      </span>
                      <p className="text-sm text-foreground mt-1 whitespace-pre-line leading-relaxed">
                        {selectedBooking.painDetails.description}
                      </p>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4 border-t pt-3">
                      <div>
                        <span className="text-xs text-muted-foreground block uppercase font-mono tracking-wider font-semibold">
                          Duration of Symptoms
                        </span>
                        <span className="text-sm font-medium mt-1 inline-block capitalize">
                          {formatDuration(selectedBooking.painDetails.duration)}
                        </span>
                      </div>
                      {selectedBooking.painDetails.previousTreatment && selectedBooking.painDetails.previousTreatment !== "None" && (
                        <div>
                          <span className="text-xs text-muted-foreground block uppercase font-mono tracking-wider font-semibold">
                            Previous Treatments
                          </span>
                          <p className="text-sm mt-1 whitespace-pre-line">
                            {selectedBooking.painDetails.previousTreatment}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 4: SCHEDULER LINK */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold flex items-center gap-2 text-sky-500">
                    <CalendarCheck2 className="h-4 w-4" /> Scheduling Portal Link
                  </h4>
                  {selectedBooking.status !== "completed" && selectedBooking.status !== "cancelled" && selectedBooking.status !== "converted_to_patient" && (
                    selectedBooking.status === "pending" ? (
                      <Button 
                        variant="outline"
                        size="sm"
                        disabled={actionLoading === selectedBooking._id}
                        onClick={() => handleSendLink(selectedBooking._id)}
                        className="h-7 px-2.5 text-xs font-semibold border-sky-500/30 text-sky-700 dark:text-sky-300 hover:bg-sky-500/10 hover:border-sky-500/50 gap-1.5 shadow-2xs transition-all"
                      >
                        <Mail className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                        {actionLoading === selectedBooking._id ? "Sending..." : "Send Link"}
                      </Button>
                    ) : (
                      <Button 
                        variant="outline"
                        size="sm"
                        disabled={actionLoading === selectedBooking._id}
                        onClick={() => handleOpenReschedule(selectedBooking)}
                        className="h-7 px-2.5 text-xs font-semibold border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10 hover:border-amber-500/50 gap-1.5 shadow-2xs transition-all"
                      >
                        <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                        Reschedule
                      </Button>
                    )
                  )}
                </div>
                <div className="bg-sky-500/5 p-4 rounded-xl border border-sky-500/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Patient Scheduling Link:</span>
                    {selectedBooking.scheduledDate && selectedBooking.scheduledTime ? (
                      <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                        Scheduled: {selectedBooking.scheduledDate} @ {selectedBooking.scheduledTime}
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">
                        Awaiting Patient Slot Selection
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Input 
                      readOnly 
                      value={`${(process.env.NEXT_PUBLIC_PUBLIC_SITE_URL || 'http://localhost:3000')}/schedule/${selectedBooking._id}`}
                      className="bg-background text-xs font-mono h-10 w-full px-3 text-foreground border-sky-500/30 select-all"
                    />

                    {/* COPY LINK & WHATSAPP BUTTONS */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const link = `${(process.env.NEXT_PUBLIC_PUBLIC_SITE_URL || 'http://localhost:3000')}/schedule/${selectedBooking._id}`;
                          navigator.clipboard.writeText(link);
                          toast({
                            title: "Link Copied",
                            description: "Scheduling link copied to clipboard.",
                          });
                        }}
                        className="h-9 border-sky-500/30 text-sky-600 dark:text-sky-400 hover:bg-sky-500/10 gap-2 font-medium w-full"
                      >
                        <Copy className="h-4 w-4" />
                        Copy Link
                      </Button>
                      <Button 
                        variant="default"
                        size="sm"
                        onClick={() => handleWhatsAppShare(
                          selectedBooking.personalDetails.phone,
                          selectedBooking._id,
                          selectedBooking.personalDetails.firstName,
                          selectedBooking.personalDetails.lastName,
                          selectedBooking.suggestedTimes && selectedBooking.suggestedTimes.length > 0 ? {
                            date: selectedBooking.scheduledDate,
                            times: selectedBooking.suggestedTimes
                          } : undefined
                        )}
                        className="bg-[#25D366] hover:bg-[#20ba5a] text-white h-9 gap-2 font-medium w-full shadow-sm"
                      >
                        <WhatsAppIcon className="h-4 w-4 fill-current" />
                        Send via WhatsApp
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 5: CLINICAL COMPLETION REPORT & PAYMENT RECEIPT (If Completed / Converted) */}
              {(selectedBooking.status === "completed" || selectedBooking.status === "converted_to_patient" || selectedBooking.completionReport) && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold flex items-center gap-2 text-teal-600 dark:text-teal-400">
                    <Stethoscope className="h-4 w-4" /> Consultation Report & Payment Receipt
                  </h4>
                  <div className="bg-teal-500/5 p-4 rounded-xl border border-teal-500/20 space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs text-muted-foreground block uppercase font-mono tracking-wider font-semibold">
                          Assessment Summary
                        </span>
                        <p className="text-sm font-medium mt-1 text-foreground">
                          {selectedBooking.completionReport?.assessmentSummary || "Initial evaluation and physical assessment conducted."}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block uppercase font-mono tracking-wider font-semibold">
                          Treatment Administered
                        </span>
                        <p className="text-sm font-medium mt-1 text-foreground">
                          {selectedBooking.completionReport?.treatmentAdministered || "Manual therapy & targeted rehabilitation exercises."}
                        </p>
                      </div>
                    </div>

                    {selectedBooking.completionReport?.recommendations && (
                      <div className="border-t border-teal-500/10 pt-3">
                        <span className="text-xs text-muted-foreground block uppercase font-mono tracking-wider font-semibold">
                          Recommendations / Care Plan
                        </span>
                        <p className="text-sm mt-1 text-foreground">
                          {selectedBooking.completionReport.recommendations}
                        </p>
                      </div>
                    )}

                    <div className="border-t border-teal-500/15 pt-3 flex flex-wrap items-center justify-between gap-3 bg-teal-500/10 p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Receipt className="h-4 w-4 text-teal-600" />
                        <div>
                          <span className="text-xs text-muted-foreground block">Initial Home Visit Fee</span>
                          <span className="text-base font-bold text-teal-700 dark:text-teal-300">
                            ₹{selectedBooking.paymentDetails?.amount || 750}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge className={`capitalize font-semibold text-xs ${
                          (selectedBooking.paymentDetails?.status || 'paid') === 'paid'
                            ? 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-600 border-amber-500/30'
                        }`}>
                          {(selectedBooking.paymentDetails?.status || 'paid').toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="text-xs uppercase border-teal-500/30 text-teal-700 dark:text-teal-300">
                          {selectedBooking.paymentDetails?.method || 'UPI'}
                        </Badge>
                        {selectedBooking.paymentDetails?.transactionRef && (
                          <span className="text-xs font-mono text-muted-foreground">
                            Ref: {selectedBooking.paymentDetails.transactionRef}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="border-t pt-4 flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
              <div className="flex-1 flex flex-wrap gap-2 items-center">
                {userRole === "admin" ? (
                  <>






                    {/* CONFIRM SLOT (if patient chose a slot) */}
                    {(selectedBooking.status === "pending" || selectedBooking.status === "link_sent" || selectedBooking.status === "scheduling") &&
                      selectedBooking.scheduledDate && selectedBooking.scheduledTime && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={actionLoading === selectedBooking._id}
                          onClick={() => handleStatusUpdate(selectedBooking._id, "scheduled")}
                          className="h-8 text-xs font-semibold border-teal-600/40 text-teal-800 dark:text-teal-300 hover:text-teal-950 hover:bg-teal-100/80 dark:hover:bg-teal-950/50 gap-1.5"
                        >
                          <Check className="h-3.5 w-3.5 text-teal-600" />
                          Confirm Slot
                        </Button>
                      )}

                    {/* EDIT APPOINTMENT DETAILS (Only for manual clinic bookings) */}
                    {isManualBooking(selectedBooking) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsDetailsOpen(false);
                          handleOpenEditModal(selectedBooking);
                        }}
                        className="h-8 text-xs font-semibold border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:text-teal-800 hover:bg-teal-50 dark:hover:bg-teal-950/50 gap-1.5"
                      >
                        <Pencil className="h-3.5 w-3.5 text-slate-500" />
                        Edit Details
                      </Button>
                    )}
                    {selectedBooking.status !== "completed" && selectedBooking.status !== "cancelled" && selectedBooking.status !== "converted_to_patient" && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={actionLoading === selectedBooking._id}
                        onClick={() => handleStatusUpdate(selectedBooking._id, "cancelled")}
                        className="h-8 text-xs font-medium border-slate-200 dark:border-slate-800 text-slate-600 hover:text-rose-700 hover:bg-rose-50 hover:border-rose-300 gap-1.5 transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                        Cancel
                      </Button>
                    )}

                    {/* CONVERT TO PATIENT (for completed) */}
                    {selectedBooking.status === "completed" && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={actionLoading === selectedBooking._id}
                        onClick={() => handleConvertToPatient(selectedBooking._id)}
                        className="h-8 text-xs font-semibold border-teal-600/40 text-teal-800 dark:text-teal-300 hover:text-teal-950 hover:bg-teal-100/80 dark:hover:bg-teal-950/50 gap-1.5"
                      >
                        <UserCheck className="h-3.5 w-3.5 text-teal-600" />
                        Convert to Patient
                      </Button>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 px-3 py-1.5 rounded-lg border border-border/50">
                    <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0" />
                    <span>Receptionist View: Personal details only. Clinical examination & reporting steps are handled by the Doctor.</span>
                  </div>
                )}
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsDetailsOpen(false)}
                className="h-8 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 dark:border-slate-700"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* SHARE / COPY SCHEDULING LINK DIALOG */}
      {showLinkBooking && (
        <Dialog open={isLinkShowOpen} onOpenChange={setIsLinkShowOpen}>
          <DialogContent className="max-w-md w-full bg-card border-teal-500/20 shadow-2xl rounded-2xl sm:rounded-3xl p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-teal-700 dark:text-teal-300">
                <Send className="h-5 w-5" /> Patient Scheduling Portal
              </DialogTitle>
              <DialogDescription>
                Share this personalized link with <strong>{showLinkBooking.personalDetails.firstName} {showLinkBooking.personalDetails.lastName}</strong> so they can select their preferred date & time slot.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="bg-muted/40 p-3 rounded-xl border space-y-2">
                <span className="text-xs text-muted-foreground font-semibold">Direct Scheduling URL:</span>
                <Input
                  readOnly
                  value={`${(process.env.NEXT_PUBLIC_PUBLIC_SITE_URL || 'http://localhost:3000')}/schedule/${showLinkBooking._id}`}
                  className="font-mono text-xs select-all bg-background border-teal-500/30"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const link = `${(process.env.NEXT_PUBLIC_PUBLIC_SITE_URL || 'http://localhost:3000')}/schedule/${showLinkBooking._id}`;
                    navigator.clipboard.writeText(link);
                    toast({
                      title: "Link Copied",
                      description: "Scheduling link copied to clipboard.",
                    });
                  }}
                  className="gap-2 border-teal-500/30 text-teal-800 dark:text-teal-300 hover:text-teal-950 hover:bg-teal-50 font-medium"
                >
                  <Copy className="h-4 w-4" /> Copy Link
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleWhatsAppShare(
                    showLinkBooking.personalDetails.phone,
                    showLinkBooking._id,
                    showLinkBooking.personalDetails.firstName,
                    showLinkBooking.personalDetails.lastName,
                    showLinkBooking.suggestedTimes && showLinkBooking.suggestedTimes.length > 0 ? {
                      date: showLinkBooking.scheduledDate,
                      times: showLinkBooking.suggestedTimes
                    } : undefined
                  )}
                  className="bg-[#25D366] hover:bg-[#20ba5a] text-white gap-2 font-medium shadow-sm"
                >
                  <WhatsAppIcon className="h-4 w-4 fill-current" /> Send WhatsApp
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button size="sm" onClick={() => setIsLinkShowOpen(false)}>
                Done
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* SCHEDULE / SUGGEST / RESCHEDULE DIALOG */}
      {suggestBooking && (
        <Dialog open={isSuggestOpen} onOpenChange={setIsSuggestOpen}>
          <DialogContent className={`max-w-lg w-full bg-card shadow-2xl rounded-2xl sm:rounded-3xl border p-4 sm:p-6 ${
            scheduleModalMode === "schedule" ? "border-sky-500/20" : "border-amber-500/20"
          }`}>
            <DialogHeader>
              <DialogTitle className={`flex items-center gap-2 ${
                scheduleModalMode === "schedule" ? "text-sky-600 dark:text-sky-400" : "text-amber-600 dark:text-amber-400"
              }`}>
                {scheduleModalMode === "schedule" ? (
                  <>
                    <CalendarCheck2 className="h-5 w-5" /> Schedule Appointment Slot
                  </>
                ) : (
                  <>
                    <Clock className="h-5 w-5" /> Reschedule Appointment
                  </>
                )}
              </DialogTitle>
              <DialogDescription>
                {scheduleModalMode === "schedule" ? (
                  <>
                    Select an appointment date and slot for <strong>{suggestBooking.personalDetails.firstName} {suggestBooking.personalDetails.lastName}</strong>.
                  </>
                ) : (
                  <>
                    Reschedule or recommend alternate slots for <strong>{suggestBooking.personalDetails.firstName} {suggestBooking.personalDetails.lastName}</strong>.
                  </>
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* CURRENT STATUS BANNER */}
              <div className={`p-3 rounded-xl border text-xs ${
                suggestBooking.scheduledDate && suggestBooking.scheduledTime
                  ? "bg-amber-500/10 border-amber-500/20 text-amber-900 dark:text-amber-200"
                  : "bg-sky-500/10 border-sky-500/20 text-sky-900 dark:text-sky-200"
              }`}>
                {suggestBooking.scheduledDate && suggestBooking.scheduledTime ? (
                  <span>Current schedule: <strong>{suggestBooking.scheduledDate}</strong> at <strong>{suggestBooking.scheduledTime}</strong>.</span>
                ) : (
                  <span>Status: <strong>Awaiting slot confirmation</strong>. Pick a date & slot below.</span>
                )}
              </div>

              {/* ACTION TYPE TABS */}
              <div className="grid grid-cols-2 p-1 bg-muted/60 rounded-xl gap-1 border">
                <button
                  type="button"
                  onClick={() => setScheduleActionType("direct")}
                  className={`py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    scheduleActionType === "direct"
                      ? (scheduleModalMode === "schedule" ? "bg-sky-600 text-white shadow-xs" : "bg-amber-500 text-white shadow-xs")
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <CalendarCheck2 className="h-3.5 w-3.5" />
                  Direct Confirm
                </button>
                <button
                  type="button"
                  onClick={() => setScheduleActionType("suggest")}
                  className={`py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    scheduleActionType === "suggest"
                      ? (scheduleModalMode === "schedule" ? "bg-sky-600 text-white shadow-xs" : "bg-amber-500 text-white shadow-xs")
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Clock className="h-3.5 w-3.5" />
                  Suggest to Patient
                </button>
              </div>

              <div className="space-y-3">
                {/* DATE SELECTOR */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                    {scheduleActionType === "direct" ? "Select Appointment Date" : "Select Recommended Date"}
                  </label>
                  <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={`w-full justify-between h-12 px-4 font-semibold rounded-2xl text-sm shadow-sm transition-all ${
                          scheduleModalMode === "schedule"
                            ? "bg-sky-500/10 hover:bg-sky-500/20 border-sky-500/30 hover:border-sky-500/50 text-sky-950 dark:text-sky-100"
                            : "bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 hover:border-amber-500/50 text-amber-950 dark:text-amber-100"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-1.5 rounded-xl text-white shadow-sm ${
                            scheduleModalMode === "schedule" ? "bg-sky-600" : "bg-amber-500"
                          }`}>
                            <Calendar className="h-4 w-4" />
                          </div>
                          <span className="font-semibold text-sm">
                            {selectedSuggestDate
                              ? format(selectedSuggestDate, "eeee, MMMM d, yyyy")
                              : "Choose Date"}
                          </span>
                        </div>
                        <ChevronDown className={`h-4 w-4 shrink-0 ${
                          scheduleModalMode === "schedule" ? "text-sky-600" : "text-amber-600"
                        }`} />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-3 bg-card border border-border rounded-2xl shadow-xl z-[90]" align="start">
                      <CalendarWidget
                        mode="single"
                        selected={selectedSuggestDate}
                        onSelect={(date) => {
                          setSelectedSuggestDate(date);
                          setIsCalendarOpen(false);
                        }}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* TIME SLOTS SELECTOR */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                      {scheduleActionType === "direct" ? "Select Time Slot" : "Select Alternative Time Slots"}
                    </label>
                    <span className={`text-[11px] font-medium ${
                      scheduleModalMode === "schedule" ? "text-sky-600 dark:text-sky-400" : "text-amber-600 dark:text-amber-400"
                    }`}>
                      {scheduleActionType === "direct"
                        ? (directSelectedSlot ? `Slot: ${directSelectedSlot}` : "Choose 1 slot")
                        : `${chosenAlternativeTimes.length} selected`}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 max-h-[190px] overflow-y-auto p-1.5 border rounded-lg bg-background">
                    {(() => {
                      const normalizeTime = (t: string | undefined | null) =>
                        t ? t.replace(/^0/, "").trim().toUpperCase() : "";

                      const isSameDateAsRequested = areSameCalendarDay(suggestBooking.scheduledDate, selectedSuggestDate);

                      // Map of booked slots on selectedSuggestDate (normalized time -> patient name)
                      const bookedMap = new Map<string, string>();
                      if (selectedSuggestDate) {
                        bookings.forEach((b) => {
                          if (b._id === suggestBooking._id) return;
                          if (b.status === "cancelled") return;
                          if (!b.scheduledDate || !b.scheduledTime) return;
                          if (areSameCalendarDay(b.scheduledDate, selectedSuggestDate)) {
                            const pName = `${b.personalDetails.firstName || ""} ${b.personalDetails.lastName || ""}`.trim() || "Patient";
                            bookedMap.set(normalizeTime(b.scheduledTime), pName);
                          }
                        });
                      }

                      const allSlots = [
                        "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
                        "12:00 PM", "12:30 PM", "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM",
                        "4:00 PM", "4:30 PM", "5:00 PM", "5:30 PM", "6:00 PM", "6:30 PM",
                        "7:00 PM", "7:30 PM"
                      ];

                      return allSlots.map((slot) => {
                        const normSlot = normalizeTime(slot);
                        const isRequestedSlot = isSameDateAsRequested && normSlot === normalizeTime(suggestBooking.scheduledTime);
                        const bookedBy = bookedMap.get(normSlot);

                        if (bookedBy) {
                          return (
                            <button
                              key={slot}
                              type="button"
                              disabled
                              title={`Already booked by ${bookedBy}`}
                              className="p-1.5 rounded-lg text-xs font-medium border bg-muted/60 text-muted-foreground/60 border-border opacity-50 cursor-not-allowed flex flex-col items-center justify-center transition-all"
                            >
                              <span className="line-through">{slot}</span>
                              <span className="text-[9px] font-semibold text-rose-500 truncate max-w-full">
                                Booked
                              </span>
                            </button>
                          );
                        }

                        if (scheduleActionType === "direct") {
                          const isSelected = directSelectedSlot === slot;
                          return (
                            <button
                              key={slot}
                              type="button"
                              onClick={() => setDirectSelectedSlot(slot)}
                              className={`p-2 rounded-lg text-xs font-medium border transition-all flex flex-col items-center justify-center ${
                                isSelected
                                  ? (scheduleModalMode === "schedule"
                                      ? "bg-sky-600 border-sky-600 text-white shadow-sm font-bold"
                                      : "bg-amber-500 border-amber-500 text-white shadow-sm font-bold")
                                  : "bg-muted/40 border-border hover:bg-sky-500/10 hover:text-sky-600 dark:hover:text-sky-400"
                              }`}
                            >
                              <span>{slot}</span>
                              {isRequestedSlot && (
                                <span className={`text-[9px] font-bold ${isSelected ? "text-white/90" : "text-amber-600 dark:text-amber-400"}`}>
                                  Current
                                </span>
                              )}
                            </button>
                          );
                        }

                        // Suggest mode (multi-select)
                        if (isRequestedSlot) {
                          return (
                            <button
                              key={slot}
                              type="button"
                              disabled
                              title="Patient's currently requested slot — cannot recommend the same slot as an alternate"
                              className="p-1.5 rounded-lg text-xs font-medium border bg-amber-500/10 text-amber-800 dark:text-amber-200 border-dashed border-amber-500/40 opacity-70 cursor-not-allowed flex flex-col items-center justify-center transition-all"
                            >
                              <span className="font-semibold">{slot}</span>
                              <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400">
                                Current
                              </span>
                            </button>
                          );
                        }

                        const isSelected = chosenAlternativeTimes.includes(slot);
                        return (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => {
                              setChosenAlternativeTimes((prev) => 
                                prev.includes(slot) 
                                  ? prev.filter((t) => t !== slot) 
                                  : [...prev, slot]
                              );
                            }}
                            className={`p-2 rounded-lg text-xs font-medium border transition-all ${
                              isSelected
                                ? (scheduleModalMode === "schedule"
                                    ? "bg-sky-600 border-sky-600 text-white shadow-sm font-bold"
                                    : "bg-amber-500 border-amber-500 text-white shadow-sm font-bold")
                                : "bg-muted/40 border-border hover:bg-amber-500/10 hover:text-amber-600"
                            }`}
                          >
                            {slot}
                          </button>
                        );
                      });
                    })()}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {scheduleActionType === "direct"
                      ? "Select one time slot to immediately confirm the appointment for the patient."
                      : "Pick alternate available slots to offer. Conflicting bookings are blocked."}
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter className="border-t pt-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsSuggestOpen(false)}>
                Cancel
              </Button>
              {scheduleActionType === "direct" ? (
                <Button
                  onClick={handleDirectScheduleSubmit}
                  disabled={(actionLoading === suggestBooking._id) || !directSelectedSlot}
                  className={`text-white font-medium size-sm gap-2 ${
                    scheduleModalMode === "schedule"
                      ? "bg-sky-600 hover:bg-sky-700"
                      : "bg-amber-500 hover:bg-amber-600"
                  }`}
                >
                  {actionLoading === suggestBooking._id ? (
                    "Saving..."
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      {scheduleModalMode === "reschedule" ? "Confirm Rescheduled Slot" : "Confirm & Schedule Slot"}
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleSuggestTimeSubmit}
                  disabled={(actionLoading === suggestBooking._id) || chosenAlternativeTimes.length === 0}
                  className={`text-white font-medium size-sm gap-2 ${
                    scheduleModalMode === "schedule"
                      ? "bg-sky-600 hover:bg-sky-700"
                      : "bg-amber-500 hover:bg-amber-600"
                  }`}
                >
                  {actionLoading === suggestBooking._id ? (
                    "Sending..."
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Recommend Slots ({chosenAlternativeTimes.length})
                    </>
                  )}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* POST-RESCHEDULE SHARE MODAL (MANUAL COPY & WHATSAPP) */}
      {rescheduleSuccessData && (
        <Dialog open={Boolean(rescheduleSuccessData)} onOpenChange={(open) => !open && setRescheduleSuccessData(null)}>
          <DialogContent className="max-w-md w-full bg-card border-amber-500/30 shadow-2xl rounded-2xl sm:rounded-3xl p-4 sm:p-6">
            <DialogHeader>
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-600">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold text-foreground">
                    Send Rescheduling Link
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                    Recommended slots saved for <strong>{rescheduleSuccessData.booking.personalDetails.firstName} {rescheduleSuccessData.booking.personalDetails.lastName}</strong>.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Summary pill card */}
              <div className="p-3.5 bg-amber-500/10 rounded-xl border border-amber-500/20 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-amber-900 dark:text-amber-200">Recommended Date:</span>
                  <span className="font-bold text-amber-950 dark:text-amber-100">{rescheduleSuccessData.date}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-amber-900 dark:text-amber-200">Offered Slots:</span>
                  <span className="font-bold text-amber-950 dark:text-amber-100">{rescheduleSuccessData.times.join(", ")}</span>
                </div>
              </div>

              {/* Direct Link Section */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  Rescheduling Link (Manual Copy)
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={`${(process.env.NEXT_PUBLIC_PUBLIC_SITE_URL || 'http://localhost:3000')}/schedule/${rescheduleSuccessData.booking._id}`}
                    className="font-mono text-xs select-all bg-background border-amber-500/30 h-10"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const link = `${(process.env.NEXT_PUBLIC_PUBLIC_SITE_URL || 'http://localhost:3000')}/schedule/${rescheduleSuccessData.booking._id}`;
                      navigator.clipboard.writeText(link);
                      toast({
                        title: "Link Copied!",
                        description: "Rescheduling link copied to clipboard.",
                      });
                    }}
                    className="h-10 px-3 border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10 shrink-0 font-semibold gap-1.5"
                    title="Copy Rescheduling Link"
                  >
                    <Copy className="h-4 w-4" /> Copy
                  </Button>
                </div>
              </div>

              {/* WhatsApp Action Button */}
              <div className="pt-1">
                <Button
                  type="button"
                  onClick={() => handleWhatsAppShare(
                    rescheduleSuccessData.booking.personalDetails.phone,
                    rescheduleSuccessData.booking._id,
                    rescheduleSuccessData.booking.personalDetails.firstName,
                    rescheduleSuccessData.booking.personalDetails.lastName,
                    {
                      date: rescheduleSuccessData.date,
                      times: rescheduleSuccessData.times,
                    }
                  )}
                  className="w-full h-11 bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold gap-2 text-sm shadow-md transition-all"
                >
                  <WhatsAppIcon className="h-4 w-4 fill-current" />
                  Send via WhatsApp
                </Button>
                <p className="text-[11px] text-center text-muted-foreground mt-1.5">
                  Direct message with the rescheduling link and recommended times sent to {rescheduleSuccessData.booking.personalDetails.phone || "patient"}.
                </p>
              </div>
            </div>

            <DialogFooter className="border-t pt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRescheduleSuccessData(null)}
                className="w-full sm:w-auto"
              >
                Done
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ========================================================
          DOCTOR CLINICAL EXAMINATION & CONSULTATION REPORT WORKSPACE
          ======================================================== */}
      {examiningBooking && (
        <Dialog open={isDoctorConsultModalOpen} onOpenChange={setIsDoctorConsultModalOpen}>
          <DialogContent className="max-w-6xl w-[96vw] max-h-[92vh] h-[92vh] flex flex-col p-4 sm:p-6 overflow-hidden border-teal-500/30 shadow-2xl rounded-3xl bg-card">
            <DialogHeader className="border-b pb-3 shrink-0 pr-10 sm:pr-14">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
                    <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600">
                      <Stethoscope className="h-5 w-5" />
                    </div>
                    Doctor Clinical Examination & Consultation Report
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                    Examine patient anatomical pain points, record clinical findings, prescribe care plan, and log the initial assessment visit fee.
                  </DialogDescription>
                </div>

                {/* Patient Header Badges */}
                <div className="flex flex-wrap items-center gap-2 text-xs mr-2 sm:mr-4 shrink-0">
                  <span className="px-2.5 py-1 rounded-lg bg-muted border font-semibold text-foreground inline-flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                    {examiningBooking.personalDetails.firstName} {examiningBooking.personalDetails.lastName} ({examiningBooking.personalDetails.age}y, {examiningBooking.personalDetails.gender})
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-teal-500/10 text-teal-700 dark:text-teal-300 font-bold border border-teal-500/20 inline-flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-teal-600" />
                    {examiningBooking.scheduledDate || 'Today'} @ {examiningBooking.scheduledTime || 'Session'}
                  </span>
                </div>
              </div>

              {/* Consultation Workspace Navigation Tabs */}
              <div className="flex items-center gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setDoctorActiveTab("pain_map")}
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    doctorActiveTab === "pain_map"
                      ? "bg-teal-600 text-white shadow-sm"
                      : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Activity className="h-3.5 w-3.5" />
                  1. Pain Mapping & Examination
                </button>
                <button
                  type="button"
                  onClick={() => setDoctorActiveTab("clinical_report")}
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    doctorActiveTab === "clinical_report"
                      ? "bg-teal-600 text-white shadow-sm"
                      : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <FileText className="h-3.5 w-3.5" />
                  2. Clinical Report & Prescription
                </button>
                <button
                  type="button"
                  onClick={() => setDoctorActiveTab("payment")}
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    doctorActiveTab === "payment"
                      ? "bg-teal-600 text-white shadow-sm"
                      : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Banknote className="h-3.5 w-3.5" />
                  3. Fee & Payment Portal ({completionForm.paymentStatus === "paid" ? `₹${completionForm.amount}` : "Pending"})
                </button>
              </div>
            </DialogHeader>

            <form onSubmit={handleDoctorConsultSubmit} className="flex-1 min-h-0 flex flex-col justify-between overflow-hidden">
              <div className="flex-1 min-h-0 overflow-y-auto custom-slim-scrollbar py-2 pr-1 space-y-4">
                {/* TAB 1: PAIN MAPPING & ANATOMICAL EXAMINATION */}
                {doctorActiveTab === "pain_map" && (
                  <div className="space-y-4 animate-fade-in-up">
                    <div className="grid lg:grid-cols-12 gap-5 items-start">
                      {/* Left: Interactive 3D/SVG Body Map */}
                      <div className="lg:col-span-5 bg-muted/20 rounded-3xl p-4 sm:p-5 border border-border/60 flex flex-col items-center">
                        <div className="flex items-center justify-center gap-3 mb-3 w-full">
                          <button
                            type="button"
                            onClick={() => setExamBodyView("front")}
                            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                              examBodyView === "front"
                                ? "bg-teal-600 text-white shadow-sm"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                            }`}
                          >
                            Anterior (Front View)
                          </button>
                          <button
                            type="button"
                            onClick={() => setExamBodyView("back")}
                            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                              examBodyView === "back"
                                ? "bg-teal-600 text-white shadow-sm"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                            }`}
                          >
                            Posterior (Back View)
                          </button>
                        </div>

                        <div className="w-full flex justify-center py-1 h-[380px] sm:h-[400px] max-h-[420px] overflow-hidden">
                          <BodyMap
                            bodyPartStates={examBodyPartStates}
                            onPartClick={handleExamTogglePart}
                            view={examBodyView}
                            height={390}
                          />
                        </div>
                        <p className="text-center text-xs text-muted-foreground mt-2 font-medium flex items-center justify-center gap-1.5">
                          <Info className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                          <span>Click anatomical regions to highlight and adjust severity for the clinical record</span>
                        </p>
                      </div>

                      {/* Right: Collapsible Categorized Region Selector */}
                      <div className="lg:col-span-7 bg-muted/30 rounded-3xl border border-border/60 overflow-hidden flex flex-col h-[520px]">
                        <BodyPartSelector
                          bodyPartStates={examBodyPartStates}
                          onTogglePart={handleExamTogglePart}
                          onPainLevelChange={handleExamPainLevelChange}
                          onSideChange={handleExamSideChange}
                          selectedConditions={examSelectedConditions}
                          onConditionToggle={handleExamConditionToggle}
                          onConditionCustomChange={handleExamConditionCustomChange}
                          onViewChange={(v) => setExamBodyView(v)}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: CLINICAL CONSULTATION REPORT & PAYMENT */}
                {doctorActiveTab === "clinical_report" && (
                  <div className="space-y-4 animate-fade-in-up py-1">
                    {/* Clinical Pain Profile & Symptom History (Collapsible) */}
                    <div className="bg-muted/40 rounded-2xl border border-border/70 overflow-hidden transition-all shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setIsPainProfileOpen(!isPainProfileOpen)}
                        className="w-full p-3.5 sm:p-4 flex items-center justify-between text-left hover:bg-muted/60 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300 flex items-center gap-1.5 shrink-0">
                            <Activity className="h-4 w-4" /> Patient Clinical Pain Profile & Chief Complaint
                          </h4>
                          {!isPainProfileOpen && completionForm.painDescription && (
                            <span className="hidden sm:inline text-[11px] text-muted-foreground font-normal truncate max-w-[240px]">
                              — {completionForm.painDescription}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground shrink-0">
                          <span className="text-[10px] uppercase font-semibold tracking-wider">
                            {isPainProfileOpen ? "Collapse" : "Expand"}
                          </span>
                          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isPainProfileOpen ? "rotate-180" : ""}`} />
                        </div>
                      </button>

                      {isPainProfileOpen && (
                        <div className="p-4 pt-0 space-y-3 border-t border-border/40">
                          <div className="space-y-1.5 pt-3">
                            <Label className="text-xs font-semibold">Pain Description / Chief Complaint</Label>
                            <Textarea
                              rows={2}
                              value={completionForm.painDescription}
                              onChange={(e) => setCompletionForm(prev => ({ ...prev, painDescription: e.target.value }))}
                              placeholder="e.g. Sharp pain in lower lumbar region radiating down right leg, aggravated by prolonged sitting..."
                              className="text-xs bg-background"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <Label className="text-xs font-semibold">Duration of Symptoms</Label>
                              <Select
                                value={completionForm.painDuration}
                                onValueChange={(val) => setCompletionForm(prev => ({ ...prev, painDuration: val }))}
                              >
                                <SelectTrigger className="h-9 text-xs bg-background focus:ring-teal-500 font-medium">
                                  <SelectValue placeholder="Select duration" />
                                </SelectTrigger>
                                <SelectContent className="z-[9999] bg-card border border-border shadow-xl rounded-xl">
                                  <SelectItem value="days">A few days</SelectItem>
                                  <SelectItem value="weeks">1-4 weeks</SelectItem>
                                  <SelectItem value="months">1-6 months</SelectItem>
                                  <SelectItem value="6months+">More than 6 months</SelectItem>
                                  <SelectItem value="years">Over a year</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-1.5">
                              <Label className="text-xs font-semibold">Previous Treatments (Optional)</Label>
                              <Input
                                value={completionForm.previousTreatment}
                                onChange={(e) => setCompletionForm(prev => ({ ...prev, previousTreatment: e.target.value }))}
                                placeholder="e.g. None, Physiotherapy, Medications, Surgery"
                                className="h-9 text-xs bg-background"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Clinical Assessment Details (Collapsible) */}
                    <div className="bg-muted/40 rounded-2xl border border-border/70 overflow-hidden transition-all shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setIsDiagnosisOpen(!isDiagnosisOpen)}
                        className="w-full p-3.5 sm:p-4 flex items-center justify-between text-left hover:bg-muted/60 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300 flex items-center gap-1.5 shrink-0">
                            <FileText className="h-4 w-4" /> Doctor Clinical Diagnosis & Treatment Summary
                          </h4>
                          {!isDiagnosisOpen && completionForm.assessmentSummary && (
                            <span className="hidden sm:inline text-[11px] text-muted-foreground font-normal truncate max-w-[240px]">
                              — {completionForm.assessmentSummary}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground shrink-0">
                          <span className="text-[10px] uppercase font-semibold tracking-wider">
                            {isDiagnosisOpen ? "Collapse" : "Expand"}
                          </span>
                          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isDiagnosisOpen ? "rotate-180" : ""}`} />
                        </div>
                      </button>

                      {isDiagnosisOpen && (
                        <div className="p-4 pt-0 space-y-3 border-t border-border/40">
                          <div className="space-y-1.5 pt-3">
                            <Label className="text-xs font-semibold">Clinical Assessment & Diagnosis Summary <span className="text-red-500 font-bold ml-0.5">*</span></Label>
                            <Textarea
                              required
                              rows={3}
                              value={completionForm.assessmentSummary}
                              onChange={(e) => setCompletionForm(prev => ({ ...prev, assessmentSummary: e.target.value }))}
                              placeholder="e.g. Evaluated cervical spine with active ROM restriction; hypertonicity in upper trapezius and levator scapulae..."
                              className="text-xs bg-background"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">Treatment Administered During Visit <span className="text-red-500 font-bold ml-0.5">*</span></Label>
                            <Textarea
                              required
                              rows={2}
                              value={completionForm.treatmentAdministered}
                              onChange={(e) => setCompletionForm(prev => ({ ...prev, treatmentAdministered: e.target.value }))}
                              placeholder="e.g. Grade II joint mobilization, dry needling on trigger points, cryotherapy & scapular stabilization drills."
                              className="text-xs bg-background"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">Prescribed Care Plan & Home Exercises</Label>
                            <Textarea
                              rows={2}
                              value={completionForm.recommendations}
                              onChange={(e) => setCompletionForm(prev => ({ ...prev, recommendations: e.target.value }))}
                              placeholder="e.g. Prescribed chin tucks (3x10 reps) and isometric neck holds. Recommend 6-10 session rehabilitation package."
                              className="text-xs bg-background"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 3: CONSULTATION FEE & PAYMENT PORTAL */}
                {doctorActiveTab === "payment" && (
                  <div className="space-y-4 animate-fade-in-up py-1">
                    {/* Consultation Fee Collection & Payment Portal */}
                    <div className="bg-card rounded-2xl border border-border/80 p-4 space-y-4 shadow-2xs">
                      <div className="flex items-center justify-between border-b pb-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300 flex items-center gap-1.5">
                          <Banknote className="h-4 w-4" /> Consultation Fee Collection & Payment Portal
                        </h4>
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                          completionForm.paymentStatus === "paid"
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                            : "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"
                        }`}>
                          {completionForm.paymentStatus === "paid" ? `Fee: ₹${completionForm.amount}` : "Pending Receivable"}
                        </span>
                      </div>

                      {/* Payment Status Selection Cards */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-foreground uppercase tracking-wider block">
                          Payment Status
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setCompletionForm(prev => ({ ...prev, paymentStatus: "paid" }))}
                            className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                              completionForm.paymentStatus === "paid"
                                ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-900 dark:text-emerald-200 shadow-xs ring-2 ring-emerald-500/30"
                                : "bg-card border-border hover:bg-muted/60 text-muted-foreground"
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0 ${
                              completionForm.paymentStatus === "paid"
                                ? "bg-emerald-600 text-white"
                                : "bg-muted text-muted-foreground"
                            }`}>
                              <CheckCircle2 className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="font-bold text-xs text-foreground">Paid Now</div>
                              <div className="text-[10px] text-muted-foreground">Fee collected today</div>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => setCompletionForm(prev => ({ ...prev, paymentStatus: "pending" }))}
                            className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                              completionForm.paymentStatus === "pending"
                                ? "bg-amber-500/10 border-amber-500/40 text-amber-900 dark:text-amber-200 shadow-xs ring-2 ring-amber-500/30"
                                : "bg-card border-border hover:bg-muted/60 text-muted-foreground"
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0 ${
                              completionForm.paymentStatus === "pending"
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

                      {completionForm.paymentStatus === "paid" ? (
                        <div className="p-4 bg-muted/30 rounded-2xl border space-y-4 animate-in fade-in-50 duration-200">
                          {/* Payment Mode Selector Grid */}
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-foreground block">
                              Payment Mode / Method <span className="text-red-500 font-bold ml-0.5">*</span>
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                              {[
                                { id: "upi", label: "UPI / QR", icon: QrCode },
                                { id: "cash", label: "Cash", icon: Banknote },
                              ].map((mode) => {
                                const IconComponent = mode.icon;
                                const isSelected = completionForm.paymentMethod === mode.id;
                                return (
                                  <button
                                    key={mode.id}
                                    type="button"
                                    onClick={() => setCompletionForm(prev => ({ ...prev, paymentMethod: mode.id as any }))}
                                    className={`p-3 rounded-xl border text-center flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                                      isSelected
                                        ? "bg-teal-600 text-white border-teal-600 shadow-xs font-bold"
                                        : "bg-card border-input hover:bg-muted text-foreground font-medium"
                                    }`}
                                  >
                                    <IconComponent className="h-5 w-5" />
                                    <span className="text-xs font-semibold">{mode.label}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* UPI Transaction Reference Input */}
                          {completionForm.paymentMethod === "upi" && (
                            <div className="space-y-1.5 animate-in fade-in-50 duration-200">
                              <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-foreground block">
                                  UPI Transaction ID / 12-Digit UTR Number
                                </label>
                                <span className="text-[10px] text-muted-foreground">Optional for reconciliation</span>
                              </div>
                              <Input
                                value={completionForm.transactionRef}
                                onChange={(e) => setCompletionForm(prev => ({ ...prev, transactionRef: e.target.value }))}
                                placeholder="e.g. 423981048291 (from GPay / PhonePe / Paytm)"
                                className="h-9 font-mono text-xs bg-background"
                              />
                              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <Info className="w-3 h-3 text-teal-600 shrink-0" />
                                <span>Copy the 12-digit UPI UTR from the patient's payment app screen.</span>
                              </p>
                            </div>
                          )}

                          {/* Amount Collected & Optional Counter Note */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-xs font-bold text-foreground block">
                                Amount Collected (₹)
                              </label>
                              <div className="relative">
                                <span className="absolute left-3 top-2.5 text-xs font-bold text-muted-foreground">₹</span>
                                <Input
                                  type="number"
                                  min={0}
                                  value={completionForm.amount}
                                  onChange={(e) => setCompletionForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
                                  className="pl-7 h-9 font-bold text-xs bg-background"
                                />
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label className="text-xs font-bold text-foreground block">
                                Billing Remarks / Counter Note (Optional)
                              </label>
                              <Input
                                value={completionForm.therapistNotes}
                                onChange={(e) => setCompletionForm(prev => ({ ...prev, therapistNotes: e.target.value }))}
                                placeholder="e.g. Received at reception desk via clinic QR stand"
                                className="h-9 text-xs bg-background"
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-2 animate-in fade-in-50 duration-200">
                          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200 font-bold text-xs">
                            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                            <span>₹{completionForm.amount} marked as Pending Receivable</span>
                          </div>
                          <p className="text-muted-foreground text-xs leading-relaxed">
                            The clinical consultation report will be saved and visit marked completed. Front desk staff can record payment anytime via the appointment details or billing desk.
                          </p>
                          <div className="space-y-1 pt-1">
                            <Label className="text-xs font-semibold text-amber-900 dark:text-amber-200">Pending Reason / Counter Note (Optional)</Label>
                            <Input
                              value={completionForm.transactionRef}
                              onChange={(e) => setCompletionForm(prev => ({ ...prev, transactionRef: e.target.value }))}
                              placeholder="e.g. Forgot phone, will settle next visit or via UPI link"
                              className="h-9 text-xs bg-background"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Consultation Footer - Pinned at bottom */}
              <DialogFooter className="shrink-0 gap-2 sm:gap-0 pt-3 border-t mt-2 bg-card">
                <div className="flex items-center gap-2 mr-auto">
                  {doctorActiveTab === "pain_map" ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setDoctorActiveTab("clinical_report")}
                      className="gap-1.5 text-xs font-bold text-teal-600 border-teal-500/30 hover:bg-teal-500/10"
                    >
                      <span>Proceed to Clinical Report</span>
                      <span>→</span>
                    </Button>
                  ) : doctorActiveTab === "clinical_report" ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setDoctorActiveTab("pain_map")}
                      className="gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground"
                    >
                      <span>←</span>
                      <span>Back to Pain Map</span>
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setDoctorActiveTab("clinical_report")}
                      className="gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground"
                    >
                      <span>←</span>
                      <span>Back to Clinical Report</span>
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setIsDoctorConsultModalOpen(false)}>
                    Cancel
                  </Button>

                  {doctorActiveTab === "pain_map" && (
                    <Button
                      type="button"
                      onClick={() => setDoctorActiveTab("clinical_report")}
                      className="bg-teal-600 hover:bg-teal-700 text-white font-bold size-sm gap-1.5 shadow-sm"
                    >
                      <span>Next: Clinical Report</span>
                      <span>→</span>
                    </Button>
                  )}

                  {doctorActiveTab === "clinical_report" && (
                    <Button
                      type="button"
                      onClick={() => {
                        if (!completionForm.assessmentSummary.trim()) {
                          setIsDiagnosisOpen(true);
                          toast({
                            title: "Clinical Assessment Required",
                            description: "Please enter the doctor's clinical assessment summary and diagnosis before proceeding to payment.",
                            variant: "destructive",
                          });
                          return;
                        }
                        if (!completionForm.treatmentAdministered.trim()) {
                          setIsDiagnosisOpen(true);
                          toast({
                            title: "Treatment Administered Required",
                            description: "Please specify the treatment administered during this clinical consultation.",
                            variant: "destructive",
                          });
                          return;
                        }
                        setDoctorActiveTab("payment");
                      }}
                      className="bg-teal-600 hover:bg-teal-700 text-white font-bold size-sm gap-1.5 shadow-sm"
                    >
                      <span>Next: Payment Portal</span>
                      <span>→</span>
                    </Button>
                  )}

                  {doctorActiveTab === "payment" && (
                    <Button
                      type="submit"
                      disabled={submittingCompletion}
                      className="bg-teal-600 hover:bg-teal-700 text-white font-bold size-sm gap-2 shadow-sm"
                    >
                      {submittingCompletion ? (
                        "Saving Clinical Report..."
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          Complete Consultation & Save Clinical Report ({completionForm.paymentStatus === "paid" ? `₹${completionForm.amount}` : "Fee Pending"})
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* ========================================================
          FRONT-DESK MANUAL APPOINTMENT BOOKING MODAL (RECEPTION)
          ======================================================== */}
      {isManualCreateOpen && (
        <Dialog 
          open={isManualCreateOpen} 
          onOpenChange={(open) => {
            setIsManualCreateOpen(open);
            if (!open) {
              setManualTouched({});
              setManualErrors({});
            }
          }}
        >
          <DialogContent className="max-w-xl w-full max-h-[92vh] flex flex-col p-4 sm:p-6 overflow-hidden custom-slim-scrollbar border-teal-500/30 rounded-2xl sm:rounded-3xl bg-card">
            <DialogHeader className="border-b pb-3">
              <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
                <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600">
                  <UserPlus className="h-5 w-5" />
                </div>
                Register Clinic Booking (Reception)
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Register a patient clinic booking for in-person consultation. Pain mapping and clinical examination will be conducted when the patient checks in with the doctor.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleManualCreateSubmit} className="flex-1 overflow-y-auto custom-slim-scrollbar space-y-4 py-2 pr-1">
              {/* Patient Basic Information */}
              <div className="bg-muted/40 rounded-2xl p-4 border space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-teal-600" />
                  Patient Demographics
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">
                      First Name <span className="text-red-500 font-bold ml-0.5">*</span>
                    </Label>
                    <Input
                      required
                      placeholder="Enter first name"
                      value={manualForm.firstName}
                      onChange={(e) => {
                        const sanitized = sanitizeNameInput(e.target.value);
                        setManualForm(prev => ({ ...prev, firstName: sanitized }));
                        if (manualTouched.firstName) {
                          const errs = validatePatientDemographics({ ...manualForm, firstName: sanitized });
                          setManualErrors(prev => ({ ...prev, firstName: errs.firstName || "" }));
                        }
                      }}
                      onBlur={() => {
                        setManualTouched(prev => ({ ...prev, firstName: true }));
                        const errs = validatePatientDemographics(manualForm);
                        setManualErrors(prev => ({ ...prev, firstName: errs.firstName || "" }));
                      }}
                      className={`h-9 text-xs bg-background transition-colors ${
                        manualErrors.firstName && manualTouched.firstName
                          ? "border-rose-500 focus-visible:ring-rose-500"
                          : ""
                      }`}
                    />
                    {manualErrors.firstName && manualTouched.firstName && (
                      <p className="text-[11px] text-rose-500 font-medium flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        {manualErrors.firstName}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">
                      Last Name <span className="text-red-500 font-bold ml-0.5">*</span>
                    </Label>
                    <Input
                      required
                      placeholder="Enter last name"
                      value={manualForm.lastName}
                      onChange={(e) => {
                        const sanitized = sanitizeNameInput(e.target.value);
                        setManualForm(prev => ({ ...prev, lastName: sanitized }));
                        if (manualTouched.lastName) {
                          const errs = validatePatientDemographics({ ...manualForm, lastName: sanitized });
                          setManualErrors(prev => ({ ...prev, lastName: errs.lastName || "" }));
                        }
                      }}
                      onBlur={() => {
                        setManualTouched(prev => ({ ...prev, lastName: true }));
                        const errs = validatePatientDemographics(manualForm);
                        setManualErrors(prev => ({ ...prev, lastName: errs.lastName || "" }));
                      }}
                      className={`h-9 text-xs bg-background transition-colors ${
                        manualErrors.lastName && manualTouched.lastName
                          ? "border-rose-500 focus-visible:ring-rose-500"
                          : ""
                      }`}
                    />
                    {manualErrors.lastName && manualTouched.lastName && (
                      <p className="text-[11px] text-rose-500 font-medium flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        {manualErrors.lastName}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">
                      Phone Number <span className="text-red-500 font-bold ml-0.5">*</span>
                    </Label>
                    <Input
                      required
                      type="tel"
                      maxLength={10}
                      placeholder="Enter 10-digit phone number"
                      value={manualForm.phone}
                      onChange={(e) => {
                        const sanitized = sanitizePhoneInput(e.target.value);
                        setManualForm(prev => ({ ...prev, phone: sanitized }));
                        if (manualTouched.phone) {
                          const errs = validatePatientDemographics({ ...manualForm, phone: sanitized });
                          setManualErrors(prev => ({ ...prev, phone: errs.phone || "" }));
                        }
                      }}
                      onBlur={() => {
                        setManualTouched(prev => ({ ...prev, phone: true }));
                        const errs = validatePatientDemographics(manualForm);
                        setManualErrors(prev => ({ ...prev, phone: errs.phone || "" }));
                      }}
                      className={`h-9 text-xs bg-background transition-colors ${
                        manualErrors.phone && manualTouched.phone
                          ? "border-rose-500 focus-visible:ring-rose-500"
                          : ""
                      }`}
                    />
                    {manualErrors.phone && manualTouched.phone && (
                      <p className="text-[11px] text-rose-500 font-medium flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        {manualErrors.phone}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">
                      Email Address <span className="text-red-500 font-bold ml-0.5">*</span>
                    </Label>
                    <Input
                      required
                      type="email"
                      placeholder="Enter email address"
                      value={manualForm.email}
                      onChange={(e) => {
                        const sanitized = sanitizeEmailInput(e.target.value);
                        setManualForm(prev => ({ ...prev, email: sanitized }));
                        if (manualTouched.email) {
                          const errs = validatePatientDemographics({ ...manualForm, email: sanitized });
                          setManualErrors(prev => ({ ...prev, email: errs.email || "" }));
                        }
                      }}
                      onBlur={() => {
                        setManualTouched(prev => ({ ...prev, email: true }));
                        const errs = validatePatientDemographics(manualForm);
                        setManualErrors(prev => ({ ...prev, email: errs.email || "" }));
                      }}
                      className={`h-9 text-xs bg-background transition-colors ${
                        manualErrors.email && manualTouched.email
                          ? "border-rose-500 focus-visible:ring-rose-500"
                          : ""
                      }`}
                    />
                    {manualErrors.email && manualTouched.email && (
                      <p className="text-[11px] text-rose-500 font-medium flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        {manualErrors.email}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">
                      Age <span className="text-red-500 font-bold ml-0.5">*</span>
                    </Label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      maxLength={3}
                      placeholder="Enter age"
                      value={manualForm.age}
                      onChange={(e) => {
                        const sanitized = sanitizeAgeInput(e.target.value);
                        setManualForm(prev => ({ ...prev, age: sanitized }));
                        if (manualTouched.age) {
                          const errs = validatePatientDemographics({ ...manualForm, age: sanitized });
                          setManualErrors(prev => ({ ...prev, age: errs.age || "" }));
                        }
                      }}
                      onBlur={() => {
                        setManualTouched(prev => ({ ...prev, age: true }));
                        const errs = validatePatientDemographics(manualForm);
                        setManualErrors(prev => ({ ...prev, age: errs.age || "" }));
                      }}
                      className={`h-9 text-xs bg-background transition-colors ${
                        manualErrors.age && manualTouched.age
                          ? "border-rose-500 focus-visible:ring-rose-500"
                          : ""
                      }`}
                    />
                    {manualErrors.age && manualTouched.age && (
                      <p className="text-[11px] text-rose-500 font-medium flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        {manualErrors.age}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">
                      Gender <span className="text-red-500 font-bold ml-0.5">*</span>
                    </Label>
                    <Select
                      value={manualForm.gender}
                      onValueChange={(val: any) => {
                        setManualForm(prev => ({ ...prev, gender: val }));
                        if (manualTouched.gender) {
                          const errs = validatePatientDemographics({ ...manualForm, gender: val });
                          setManualErrors(prev => ({ ...prev, gender: errs.gender || "" }));
                        }
                      }}
                    >
                      <SelectTrigger
                        onBlur={() => {
                          setManualTouched(prev => ({ ...prev, gender: true }));
                          const errs = validatePatientDemographics(manualForm);
                          setManualErrors(prev => ({ ...prev, gender: errs.gender || "" }));
                        }}
                        className={`h-9 text-xs bg-background transition-colors ${
                          manualErrors.gender && manualTouched.gender 
                            ? "border-rose-500 focus:ring-rose-500" 
                            : "border-input focus:ring-teal-500"
                        }`}
                      >
                        <SelectValue placeholder="Select Gender" />
                      </SelectTrigger>
                      <SelectContent className="z-[9999] bg-card border border-border shadow-xl rounded-xl">
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {manualErrors.gender && manualTouched.gender && (
                      <p className="text-[11px] text-rose-500 font-medium flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        {manualErrors.gender}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Initial Status</Label>
                    <Select
                      value={manualForm.status}
                      onValueChange={(val: BookingStatus) => setManualForm(prev => ({ ...prev, status: val }))}
                    >
                      <SelectTrigger className="h-9 text-xs bg-background border-input focus:ring-teal-500 font-bold">
                        <SelectValue placeholder="Select Status" />
                      </SelectTrigger>
                      <SelectContent className="z-[9999] bg-card border border-border shadow-xl rounded-xl">
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Patient Address (Optional)</Label>
                  <Input
                    placeholder="Enter address (optional)"
                    value={manualForm.address}
                    onChange={(e) => setManualForm(prev => ({ ...prev, address: e.target.value.slice(0, 150) }))}
                    className="h-9 text-xs bg-background"
                  />
                </div>
              </div>

              {/* Schedule & Slot Details */}
              <div className="bg-muted/40 rounded-2xl p-4 border space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-teal-600" />
                  Appointment Date & Time Slot
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold">
                        Appointment Date <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
                      </Label>
                      {manualForm.scheduledDate && (
                        <button
                          type="button"
                          onClick={() => setManualForm(prev => ({ ...prev, scheduledDate: "", scheduledTime: "" }))}
                          className="text-[10px] text-muted-foreground hover:text-rose-500 font-medium transition-colors"
                        >
                          Clear Date
                        </button>
                      )}
                    </div>
                    <Popover open={isManualDateOpen} onOpenChange={setIsManualDateOpen} modal={true}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className={`w-full h-9 justify-start text-left text-xs font-medium bg-background border ${
                            !manualForm.scheduledDate ? "text-muted-foreground" : "text-foreground"
                          } focus:ring-1 focus:ring-teal-500`}
                        >
                          <Calendar className="mr-2 h-3.5 w-3.5 text-teal-600 shrink-0" />
                          {manualForm.scheduledDate ? (
                            format(new Date(manualForm.scheduledDate + "T00:00:00"), "EEE, MMM d, yyyy")
                          ) : (
                            <span>Select appointment date...</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 z-[9999] bg-card border border-border shadow-2xl rounded-2xl pointer-events-auto" align="start">
                        <CalendarWidget
                          mode="single"
                          selected={manualForm.scheduledDate ? new Date(manualForm.scheduledDate + "T00:00:00") : undefined}
                          onSelect={(date) => {
                            if (date) {
                              setManualForm(prev => ({ ...prev, scheduledDate: format(date, "yyyy-MM-dd") }));
                              setIsManualDateOpen(false);
                            }
                          }}
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                          className="pointer-events-auto"
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold">
                        Time Slot <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
                      </Label>
                      {manualForm.scheduledTime && (
                        <button
                          type="button"
                          onClick={() => setManualForm(prev => ({ ...prev, scheduledTime: "" }))}
                          className="text-[10px] text-muted-foreground hover:text-rose-500 font-medium transition-colors"
                        >
                          Clear Slot
                        </button>
                      )}
                    </div>

                    {(() => {
                      const bookedMap = getBookedSlotsForDate(manualForm.scheduledDate);
                      const isSelectedSlotBooked = Boolean(bookedMap.get(manualForm.scheduledTime));

                      return (
                        <div className="space-y-2">
                          <Select
                            value={manualForm.scheduledTime}
                            onValueChange={(val) => setManualForm(prev => ({ ...prev, scheduledTime: val }))}
                          >
                            <SelectTrigger
                              className={`h-9 text-xs bg-background ${
                                isSelectedSlotBooked 
                                  ? "border-rose-500 text-rose-600 focus:ring-rose-500 font-bold" 
                                  : "border-input focus:ring-teal-500 font-medium"
                              }`}
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                <Clock className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                                <SelectValue placeholder="Select Time Slot (Optional)" />
                              </div>
                            </SelectTrigger>
                            <SelectContent className="z-[9999] bg-card border border-border shadow-2xl rounded-xl max-h-56">
                              {standardTimeSlots.map((slot) => {
                                const bookedBy = bookedMap.get(slot);
                                return (
                                  <SelectItem 
                                    key={slot} 
                                    value={slot} 
                                    disabled={Boolean(bookedBy)} 
                                    className={bookedBy ? "text-muted-foreground bg-muted/30 line-through opacity-50" : "font-medium"}
                                  >
                                    <div className="flex items-center justify-between w-full gap-2">
                                      <span>{slot}</span>
                                      {bookedBy && (
                                        <span className="text-[10px] text-rose-500 font-bold no-underline inline-flex items-center gap-1">
                                          <XCircle className="w-3 h-3 text-rose-500" /> Booked ({bookedBy})
                                        </span>
                                      )}
                                    </div>
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>

                          {isSelectedSlotBooked && (
                            <p className="text-[11px] text-rose-600 font-bold flex items-center gap-1 mt-1">
                              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                              Already booked for {bookedMap.get(manualForm.scheduledTime)}
                            </p>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Quick Select Slot Chips */}
                {(() => {
                  const bookedMap = getBookedSlotsForDate(manualForm.scheduledDate);
                  return (
                    <div className="rounded-xl border bg-background/50 p-2.5 space-y-1.5 mt-1">
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground font-semibold px-0.5">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-teal-600" />
                          Quick Select Time Slot:
                        </span>
                        <div className="flex items-center gap-2 text-[9px]">
                          <span className="flex items-center gap-1 text-emerald-600 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Available
                          </span>
                          <span className="flex items-center gap-1 text-rose-500 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span> Booked
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-1 max-h-28 overflow-y-auto custom-slim-scrollbar pr-0.5">
                        {standardTimeSlots.map((slot) => {
                          const bookedBy = bookedMap.get(slot);
                          const isSelected = manualForm.scheduledTime === slot;
                          return (
                            <button
                              key={slot}
                              type="button"
                              disabled={Boolean(bookedBy)}
                              onClick={() => setManualForm(prev => ({ ...prev, scheduledTime: isSelected ? "" : slot }))}
                              title={bookedBy ? `Booked for ${bookedBy}` : `Select ${slot}`}
                              className={`h-7 px-1 rounded-lg text-[10px] font-semibold transition-all border text-center truncate ${
                                isSelected
                                  ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                                  : bookedBy
                                  ? "bg-muted/40 text-muted-foreground/50 border-transparent line-through cursor-not-allowed"
                                  : "bg-background text-foreground border-input hover:border-teal-400 hover:bg-teal-50/50 hover:text-teal-700"
                              }`}
                            >
                              {slot}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Remarks / Front-Desk Notes */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Reception Notes / Remarks (Optional)</Label>
                <Textarea
                  rows={2}
                  placeholder="Enter front-desk notes or remarks (optional)"
                  value={manualForm.additionalNotes}
                  onChange={(e) => setManualForm(prev => ({ ...prev, additionalNotes: e.target.value }))}
                  className="text-xs bg-background resize-none"
                />
              </div>

              <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsManualCreateOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submittingManual}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-bold size-sm gap-2 shadow-sm"
                >
                  {submittingManual ? (
                    "Booking Appointment..."
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Book & Register Appointment
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* EDIT WALK-IN / APPOINTMENT DIALOG */}
      {selectedBookingForEdit && (
        <Dialog 
          open={isEditModalOpen} 
          onOpenChange={(open) => {
            setIsEditModalOpen(open);
            if (!open) {
              setEditTouched({});
              setEditErrors({});
            }
          }}
        >
          <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-slim-scrollbar bg-card border-blue-500/30 shadow-2xl rounded-2xl sm:rounded-3xl p-4 sm:p-6">
            <DialogHeader className="border-b pb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
                  <Pencil className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-foreground">
                    Edit Clinic Booking Details
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Update personal demographics, scheduled time slot, and front-desk clinic notes.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <form onSubmit={handleSaveEditAppointment} className="space-y-4 py-2">
              {/* Personal Information */}
              <div className="bg-muted/40 rounded-2xl p-4 border space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-blue-600" />
                  Patient Demographics
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">
                      First Name <span className="text-red-500 font-bold ml-0.5">*</span>
                    </Label>
                    <Input
                      required
                      placeholder="Enter first name"
                      value={editForm.firstName}
                      onChange={(e) => {
                        const sanitized = sanitizeNameInput(e.target.value);
                        setEditForm(prev => ({ ...prev, firstName: sanitized }));
                        if (editTouched.firstName) {
                          const errs = validatePatientDemographics({ ...editForm, firstName: sanitized });
                          setEditErrors(prev => ({ ...prev, firstName: errs.firstName || "" }));
                        }
                      }}
                      onBlur={() => {
                        setEditTouched(prev => ({ ...prev, firstName: true }));
                        const errs = validatePatientDemographics(editForm);
                        setEditErrors(prev => ({ ...prev, firstName: errs.firstName || "" }));
                      }}
                      className={`h-9 text-xs bg-background transition-colors ${
                        editErrors.firstName && editTouched.firstName
                          ? "border-rose-500 focus-visible:ring-rose-500"
                          : ""
                      }`}
                    />
                    {editErrors.firstName && editTouched.firstName && (
                      <p className="text-[11px] text-rose-500 font-medium flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        {editErrors.firstName}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">
                      Last Name <span className="text-red-500 font-bold ml-0.5">*</span>
                    </Label>
                    <Input
                      required
                      placeholder="Enter last name"
                      value={editForm.lastName}
                      onChange={(e) => {
                        const sanitized = sanitizeNameInput(e.target.value);
                        setEditForm(prev => ({ ...prev, lastName: sanitized }));
                        if (editTouched.lastName) {
                          const errs = validatePatientDemographics({ ...editForm, lastName: sanitized });
                          setEditErrors(prev => ({ ...prev, lastName: errs.lastName || "" }));
                        }
                      }}
                      onBlur={() => {
                        setEditTouched(prev => ({ ...prev, lastName: true }));
                        const errs = validatePatientDemographics(editForm);
                        setEditErrors(prev => ({ ...prev, lastName: errs.lastName || "" }));
                      }}
                      className={`h-9 text-xs bg-background transition-colors ${
                        editErrors.lastName && editTouched.lastName
                          ? "border-rose-500 focus-visible:ring-rose-500"
                          : ""
                      }`}
                    />
                    {editErrors.lastName && editTouched.lastName && (
                      <p className="text-[11px] text-rose-500 font-medium flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        {editErrors.lastName}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">
                      Phone Number <span className="text-red-500 font-bold ml-0.5">*</span>
                    </Label>
                    <Input
                      required
                      type="tel"
                      maxLength={10}
                      placeholder="Enter 10-digit phone number"
                      value={editForm.phone}
                      onChange={(e) => {
                        const sanitized = sanitizePhoneInput(e.target.value);
                        setEditForm(prev => ({ ...prev, phone: sanitized }));
                        if (editTouched.phone) {
                          const errs = validatePatientDemographics({ ...editForm, phone: sanitized });
                          setEditErrors(prev => ({ ...prev, phone: errs.phone || "" }));
                        }
                      }}
                      onBlur={() => {
                        setEditTouched(prev => ({ ...prev, phone: true }));
                        const errs = validatePatientDemographics(editForm);
                        setEditErrors(prev => ({ ...prev, phone: errs.phone || "" }));
                      }}
                      className={`h-9 text-xs bg-background transition-colors ${
                        editErrors.phone && editTouched.phone
                          ? "border-rose-500 focus-visible:ring-rose-500"
                          : ""
                      }`}
                    />
                    {editErrors.phone && editTouched.phone && (
                      <p className="text-[11px] text-rose-500 font-medium flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        {editErrors.phone}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">
                      Email Address <span className="text-red-500 font-bold ml-0.5">*</span>
                    </Label>
                    <Input
                      required
                      type="email"
                      placeholder="Enter email address"
                      value={editForm.email}
                      onChange={(e) => {
                        const sanitized = sanitizeEmailInput(e.target.value);
                        setEditForm(prev => ({ ...prev, email: sanitized }));
                        if (editTouched.email) {
                          const errs = validatePatientDemographics({ ...editForm, email: sanitized });
                          setEditErrors(prev => ({ ...prev, email: errs.email || "" }));
                        }
                      }}
                      onBlur={() => {
                        setEditTouched(prev => ({ ...prev, email: true }));
                        const errs = validatePatientDemographics(editForm);
                        setEditErrors(prev => ({ ...prev, email: errs.email || "" }));
                      }}
                      className={`h-9 text-xs bg-background transition-colors ${
                        editErrors.email && editTouched.email
                          ? "border-rose-500 focus-visible:ring-rose-500"
                          : ""
                      }`}
                    />
                    {editErrors.email && editTouched.email && (
                      <p className="text-[11px] text-rose-500 font-medium flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        {editErrors.email}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">
                      Age <span className="text-red-500 font-bold ml-0.5">*</span>
                    </Label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      maxLength={3}
                      placeholder="Enter age"
                      value={editForm.age}
                      onChange={(e) => {
                        const sanitized = sanitizeAgeInput(e.target.value);
                        setEditForm(prev => ({ ...prev, age: sanitized }));
                        if (editTouched.age) {
                          const errs = validatePatientDemographics({ ...editForm, age: sanitized });
                          setEditErrors(prev => ({ ...prev, age: errs.age || "" }));
                        }
                      }}
                      onBlur={() => {
                        setEditTouched(prev => ({ ...prev, age: true }));
                        const errs = validatePatientDemographics(editForm);
                        setEditErrors(prev => ({ ...prev, age: errs.age || "" }));
                      }}
                      className={`h-9 text-xs bg-background transition-colors ${
                        editErrors.age && editTouched.age
                          ? "border-rose-500 focus-visible:ring-rose-500"
                          : ""
                      }`}
                    />
                    {editErrors.age && editTouched.age && (
                      <p className="text-[11px] text-rose-500 font-medium flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        {editErrors.age}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">
                      Gender <span className="text-red-500 font-bold ml-0.5">*</span>
                    </Label>
                    <Select
                      value={editForm.gender}
                      onValueChange={(val: any) => {
                        setEditForm(prev => ({ ...prev, gender: val }));
                        if (editTouched.gender) {
                          const errs = validatePatientDemographics({ ...editForm, gender: val });
                          setEditErrors(prev => ({ ...prev, gender: errs.gender || "" }));
                        }
                      }}
                    >
                      <SelectTrigger
                        onBlur={() => {
                          setEditTouched(prev => ({ ...prev, gender: true }));
                          const errs = validatePatientDemographics(editForm);
                          setEditErrors(prev => ({ ...prev, gender: errs.gender || "" }));
                        }}
                        className={`h-9 text-xs bg-background transition-colors ${
                          editErrors.gender && editTouched.gender 
                            ? "border-rose-500 focus:ring-rose-500" 
                            : "border-input focus:ring-blue-500"
                        }`}
                      >
                        <SelectValue placeholder="Select Gender" />
                      </SelectTrigger>
                      <SelectContent className="z-[9999] bg-card border border-border shadow-xl rounded-xl">
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {editErrors.gender && editTouched.gender && (
                      <p className="text-[11px] text-rose-500 font-medium flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        {editErrors.gender}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Appointment Status</Label>
                    <Select
                      value={editForm.status}
                      onValueChange={(val: BookingStatus) => setEditForm(prev => ({ ...prev, status: val }))}
                    >
                      <SelectTrigger className="h-9 text-xs bg-background border-input focus:ring-blue-500 font-bold">
                        <SelectValue placeholder="Select Status" />
                      </SelectTrigger>
                      <SelectContent className="z-[9999] bg-card border border-border shadow-xl rounded-xl">
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Patient Address</Label>
                  <Input
                    placeholder="Enter patient address (optional)"
                    value={editForm.address}
                    onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value.slice(0, 150) }))}
                    className="h-9 text-xs bg-background"
                  />
                </div>
              </div>

              {/* Schedule & Slot Details */}
              <div className="bg-muted/40 rounded-2xl p-4 border space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-blue-600" />
                  Appointment Date & Time Slot
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold">
                        Appointment Date <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
                      </Label>
                      {editForm.scheduledDate && (
                        <button
                          type="button"
                          onClick={() => setEditForm(prev => ({ ...prev, scheduledDate: "", scheduledTime: "" }))}
                          className="text-[10px] text-muted-foreground hover:text-rose-500 font-medium transition-colors"
                        >
                          Clear Date
                        </button>
                      )}
                    </div>
                    <Popover open={isEditDateOpen} onOpenChange={setIsEditDateOpen} modal={true}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className={`w-full h-9 justify-start text-left text-xs font-medium bg-background border ${
                            !editForm.scheduledDate ? "text-muted-foreground" : "text-foreground"
                          } focus:ring-1 focus:ring-blue-500`}
                        >
                          <Calendar className="mr-2 h-3.5 w-3.5 text-blue-600 shrink-0" />
                          {editForm.scheduledDate ? (
                            format(new Date(editForm.scheduledDate + "T00:00:00"), "EEE, MMM d, yyyy")
                          ) : (
                            <span>Select appointment date...</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 z-[9999] bg-card border border-border shadow-2xl rounded-2xl pointer-events-auto" align="start">
                        <CalendarWidget
                          mode="single"
                          selected={editForm.scheduledDate ? new Date(editForm.scheduledDate + "T00:00:00") : undefined}
                          onSelect={(date) => {
                            if (date) {
                              setEditForm(prev => ({ ...prev, scheduledDate: format(date, "yyyy-MM-dd") }));
                              setIsEditDateOpen(false);
                            }
                          }}
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                          className="pointer-events-auto"
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold">
                        Time Slot <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
                      </Label>
                      {editForm.scheduledTime && (
                        <button
                          type="button"
                          onClick={() => setEditForm(prev => ({ ...prev, scheduledTime: "" }))}
                          className="text-[10px] text-muted-foreground hover:text-rose-500 font-medium transition-colors"
                        >
                          Clear Slot
                        </button>
                      )}
                    </div>

                    {(() => {
                      const bookedMap = getBookedSlotsForDate(editForm.scheduledDate, selectedBookingForEdit?._id);
                      const isSelectedSlotBooked = Boolean(bookedMap.get(editForm.scheduledTime));

                      return (
                        <div className="space-y-2">
                          <Select
                            value={editForm.scheduledTime}
                            onValueChange={(val) => setEditForm(prev => ({ ...prev, scheduledTime: val }))}
                          >
                            <SelectTrigger
                              className={`h-9 text-xs bg-background ${
                                isSelectedSlotBooked 
                                  ? "border-rose-500 text-rose-600 focus:ring-rose-500 font-bold" 
                                  : "border-input focus:ring-blue-500 font-medium"
                              }`}
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                <Clock className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                                <SelectValue placeholder="Select Time Slot (Optional)" />
                              </div>
                            </SelectTrigger>
                            <SelectContent className="z-[9999] bg-card border border-border shadow-2xl rounded-xl max-h-56">
                              {standardTimeSlots.map((slot) => {
                                const bookedBy = bookedMap.get(slot);
                                return (
                                  <SelectItem 
                                    key={slot} 
                                    value={slot} 
                                    disabled={Boolean(bookedBy)} 
                                    className={bookedBy ? "text-muted-foreground bg-muted/30 line-through opacity-50" : "font-medium"}
                                  >
                                    <div className="flex items-center justify-between w-full gap-2">
                                      <span>{slot}</span>
                                      {bookedBy && (
                                        <span className="text-[10px] text-rose-500 font-bold no-underline inline-flex items-center gap-1">
                                          <XCircle className="w-3 h-3 text-rose-500" /> Booked ({bookedBy})
                                        </span>
                                      )}
                                    </div>
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>

                          {isSelectedSlotBooked && (
                            <p className="text-[11px] text-rose-600 font-bold flex items-center gap-1 mt-1">
                              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                              Already booked for {bookedMap.get(editForm.scheduledTime)}
                            </p>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Quick Select Slot Chips */}
                {(() => {
                  const bookedMap = getBookedSlotsForDate(editForm.scheduledDate, selectedBookingForEdit?._id);
                  return (
                    <div className="rounded-xl border bg-background/50 p-2.5 space-y-1.5 mt-1">
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground font-semibold px-0.5">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-blue-600" />
                          Quick Select Time Slot:
                        </span>
                        <div className="flex items-center gap-2 text-[9px]">
                          <span className="flex items-center gap-1 text-emerald-600 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Available
                          </span>
                          <span className="flex items-center gap-1 text-rose-500 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span> Booked
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-1 max-h-28 overflow-y-auto custom-slim-scrollbar pr-0.5">
                        {standardTimeSlots.map((slot) => {
                          const bookedBy = bookedMap.get(slot);
                          const isSelected = editForm.scheduledTime === slot;
                          return (
                            <button
                              key={slot}
                              type="button"
                              disabled={Boolean(bookedBy)}
                              onClick={() => setEditForm(prev => ({ ...prev, scheduledTime: isSelected ? "" : slot }))}
                              title={bookedBy ? `Booked for ${bookedBy}` : `Select ${slot}`}
                              className={`h-7 px-1 rounded-lg text-[10px] font-semibold transition-all border text-center truncate ${
                                isSelected
                                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                                  : bookedBy
                                  ? "bg-muted/40 text-muted-foreground/50 border-transparent line-through cursor-not-allowed"
                                  : "bg-background text-foreground border-input hover:border-blue-400 hover:bg-blue-50/50 hover:text-blue-700"
                              }`}
                            >
                              {slot}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Reception Notes */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Reception Notes / Remarks</Label>
                <Textarea
                  rows={2}
                  placeholder="Enter front-desk notes or remarks (optional)"
                  value={editForm.additionalNotes}
                  onChange={(e) => setEditForm(prev => ({ ...prev, additionalNotes: e.target.value }))}
                  className="text-xs bg-background resize-none"
                />
              </div>

              <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold size-sm gap-2 shadow-sm"
                >
                  {isSubmittingEdit ? (
                    "Saving Changes..."
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
