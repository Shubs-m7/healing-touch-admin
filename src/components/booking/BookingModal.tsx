"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, CheckCircle2, User, MapPin, Activity, Minus, X, Maximize2, Layers, Info } from "lucide-react";
// import { format } from "date-fns";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
// import { PolicyModal } from "@/components/modals/PolicyModal";

import StepIndicator from "@/components/booking/StepIndicator";
import AppointmentScheduler from "@/components/booking/AppointmentScheduler";
import { createBooking } from "@/services/bookingService";
import { Loader2 } from "lucide-react";
import BodyMap from "@/components/booking/BodyMap";
import BodyPartSelector from "@/components/booking/BodyPartSelector";
import { BodyMapModal } from "@/components/booking/BodyMapModal";
import BodyMapPip from "@/components/booking/BodyMapPip";
import { painCategories, BodyPartId } from "@/data/painCategories";

const steps = [
    { id: 1, title: "Personal", description: "Contact info" },
    { id: 2, title: "Pain Details", description: "Describe condition" },
    { id: 3, title: "More Info", description: "Final details" },
    { id: 4, title: "Confirm", description: "Review & submit" },
];

interface PersonalDetails {
    firstName: string;
    lastName: string;
    age: string;
    gender: string;
    phone: string;
    email: string;
    address: string;
}

interface PainDetails {
    description: string;
    duration: string;
    previousTreatment: string;
    additionalNotes: string;
}

interface BodyPartPainLevel {
    selected: boolean;
    painLevel: number;
    side?: "left" | "right" | "both";
}

interface BookingModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function BookingModal({ isOpen, onClose }: BookingModalProps) {
    const [currentStep, setCurrentStep] = useState(1);
    const [bodyView, setBodyView] = useState<"front" | "back">("front");
    const [isLoading, setIsLoading] = useState(false);
    const [isBodyMapModalOpen, setIsBodyMapModalOpen] = useState(false);
    const [mobileStep2View, setMobileStep2View] = useState<"map" | "menu">("map");

    // Form state
    const [personalDetails, setPersonalDetails] = useState<PersonalDetails>({
        firstName: "",
        lastName: "",
        age: "",
        gender: "",
        phone: "",
        email: "",
        address: "",
    });

    const [selectedDate, setSelectedDate] = useState<Date | undefined>();
    const [selectedTime, setSelectedTime] = useState<string | undefined>();

    // Body part states with individual pain levels
    const [bodyPartStates, setBodyPartStates] = useState<Record<BodyPartId, BodyPartPainLevel>>({
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
    const [selectedConditions, setSelectedConditions] = useState<Record<string, string[]>>({});

    const [painDetails, setPainDetails] = useState<PainDetails>({
        description: "",
        duration: "",
        previousTreatment: "",
        additionalNotes: "",
    });

    const [isSubmitted, setIsSubmitted] = useState(false);

    // Get selected body parts as array
    const selectedBodyParts = Object.entries(bodyPartStates)
        .filter(([_, state]) => state?.selected)
        .map(([partId]) => partId as BodyPartId);

    const handleTogglePart = (partId: BodyPartId, side?: "left" | "right") => {
        // Auto-switch view: if a back/posterior part is selected, show back view; if a front part is selected, show front view
        const posteriorParts: string[] = [
            "back",
            "mid_back",
            "spine",
            "waist",
            "glute",
            "calf",
            "head-back",
            "nape",
            "back-left",
            "back-right",
            "upperback-left",
            "upperback-right",
            "shoulder-back-left",
            "shoulder-back-right",
            "clavicule-left",
            "clavicule-right",
            "midback-left",
            "midback-right",
            "glutes",
            "glute-left",
            "glute-right",
            "hamstrings",
            "hamstring-left",
            "hamstring-right",
            "lower-back",
            "lumbar-spine",
            "thoracic-spine",
            "rhomboids",
            "lats",
            "lat-left",
            "lat-right",
        ];

        const anteriorParts: string[] = [
            "chest",
            "abdomen",
            "biceps",
            "forearm",
            "knee",
            "shin",
            "thigh",
            "foot",
            "hand",
            "wrist",
            "elbow",
            "shoulder",
            "pec-left",
            "pec-right",
            "abs",
            "abs-core",
            "quadriceps",
            "knees",
        ];

        if (posteriorParts.includes(partId)) {
            setBodyView("back");
        } else if (anteriorParts.includes(partId)) {
            setBodyView("front");
        }

        setBodyPartStates((prev) => {
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

            return {
                ...prev,
                [partId]: {
                    ...current,
                    selected: !current.selected,
                },
            };
        });
    };

    const handlePainLevelChange = (partId: BodyPartId, level: number) => {
        setBodyPartStates((prev) => {
            const current = prev[partId] || { selected: false, painLevel: 1 };
            return {
                ...prev,
                [partId]: {
                    ...current,
                    painLevel: level,
                },
            };
        });
    };

    const handleSideChange = (partId: BodyPartId, side: "left" | "right" | "both") => {
        setBodyPartStates((prev) => {
            const current = prev[partId] || { selected: false, painLevel: 1 };
            return {
                ...prev,
                [partId]: {
                    ...current,
                    side: side,
                },
            };
        });
    };

    const handleConditionToggle = (partId: string, condition: string) => {
        setSelectedConditions((prev) => {
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
                ? current.filter((c) => c !== condition)
                : [...current, condition];
            return { ...prev, [partId]: updated };
        });
    };

    const handleConditionCustomChange = (partId: string, customText: string) => {
        setSelectedConditions((prev) => {
            const current = prev[partId] || [];
            const withoutOther = current.filter((c) => c !== "Other" && !c.startsWith("Other:"));
            const newCondition = customText.trim() ? `Other: ${customText.trim()}` : "Other";
            return { ...prev, [partId]: [...withoutOther, newCondition] };
        });
    };

    const termsContent = (
        <div className="space-y-4 text-sm text-foreground">
            <h3 className="font-bold text-lg">1. Introduction</h3>
            <p>Welcome to Adaptus. By booking an appointment, you agree to these Terms and Conditions.</p>

            <h3 className="font-bold text-lg">2. Booking & Cancellation</h3>
            <p>Appointments must be booked in advance. Cancellations made less than 24 hours before the scheduled time may incur a fee.</p>

            <h3 className="font-bold text-lg">3. Medical Disclaimer</h3>
            <p>Our physiotherapy services are intended to support your health. However, outcomes vary. Please consult with your physician for serious conditions.</p>

            <h3 className="font-bold text-lg">4. Payment</h3>
            <p>Payment is due at the time of service unless otherwise arranged. We accept major credit cards and insurance plans as listed.</p>
        </div>
    );

    const privacyContent = (
        <div className="space-y-4 text-sm text-foreground">
            <h3 className="font-bold text-lg">1. Data Collection</h3>
            <p>We collect personal and medical information necessary to provide you with safe and effective treatment.</p>

            <h3 className="font-bold text-lg">2. Data Usage</h3>
            <p>Your data is used solely for your treatment, appointment management, and communication with you. We do not sell your data.</p>

            <h3 className="font-bold text-lg">3. Security</h3>
            <p>We employ industry-standard security measures to protect your personal health information.</p>

            <h3 className="font-bold text-lg">4. Your Rights</h3>
            <p>You have the right to access, correct, or request deletion of your personal data, subject to legal retention requirements.</p>
        </div>
    );

    const validateStep = (step: number): boolean => {
        switch (step) {
            case 1:
                // Basic validation
                if (!personalDetails.firstName || !personalDetails.lastName || !personalDetails.email || !personalDetails.phone || !personalDetails.age || !personalDetails.gender || !personalDetails.address) {
                    toast({
                        title: "Required Fields",
                        description: "Please fill in all required fields marked with *.",
                        variant: "destructive",
                    });
                    return false;
                }

                // Email validation
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(personalDetails.email)) {
                    toast({
                        title: "Invalid Email",
                        description: "Please enter a valid email address.",
                        variant: "destructive",
                    });
                    return false;
                }

                // Phone validation (10 digits starting with 6-9)
                const phoneRegex = /^[6-9]\d{9}$/;
                if (!phoneRegex.test(personalDetails.phone)) {
                    toast({
                        title: "Invalid Phone Number",
                        description: "Please enter a valid 10-digit mobile number starting with 6-9.",
                        variant: "destructive",
                    });
                    return false;
                }

                // Age validation (1-120)
                const ageNum = parseInt(personalDetails.age);
                if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
                    toast({
                        title: "Invalid Age",
                        description: "Please enter an age between 1 and 120.",
                        variant: "destructive",
                    });
                    return false;
                }

                return true;

            case 2:
                if (selectedBodyParts.length === 0) {
                    toast({
                        title: "Pain Location Required",
                        description: "Please select at least one area where you're experiencing pain.",
                        variant: "destructive",
                    });
                    return false;
                }
                return true;

            case 3:
                if (!painDetails.description || !painDetails.duration) {
                    toast({
                        title: "Pain Details Required",
                        description: "Please describe your pain and its duration.",
                        variant: "destructive",
                    });
                    return false;
                }
                return true;

            case 4:
                return true;
            default:
                return true;
        }
    };

    const nextStep = () => {
        if (validateStep(currentStep)) {
            if (currentStep < 4) {
                setCurrentStep(currentStep + 1);
            } else {
                handleSubmit();
            }
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSubmit = async () => {

        setIsLoading(true);
        try {
            // Prepare data for API
            const bookingData = {
                personalDetails,
                bodyParts: Object.entries(bodyPartStates)
                    .filter(([_, state]) => state.selected)
                    .map(([partId, state]) => ({
                        partId,
                        painLevel: state.painLevel,
                        side: state.side,
                        selected: state.selected
                    })),
                selectedConditions,
                painDetails,
                bookingSource: "online" as const
            };

            await createBooking(bookingData);

            setIsSubmitted(true);
            toast({
                title: "Appointment Booked!",
                description: "We've received your appointment request. You'll receive a confirmation shortly.",
            });
        } catch (error) {
            console.error("Booking error:", error);
            toast({
                title: "Booking Failed",
                description: "There was an error submitting your booking. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="w-[98vw] max-w-7xl h-[94vh] sm:h-[95vh] flex flex-col gap-0 p-0 overflow-hidden bg-card border border-teal-500/30 shadow-2xl rounded-2xl sm:rounded-3xl">
                <DialogTitle className="sr-only">Booking Dialog</DialogTitle>
                <DialogDescription className="sr-only">
                    Please fill out the form to book your physiotherapy session.
                </DialogDescription>

                {isSubmitted ? (
                    <div className="flex-1 min-h-0 overflow-y-auto custom-slim-scrollbar p-6 flex flex-col justify-center items-center">
                        <div className="text-center animate-scale-in py-6 max-w-lg w-full">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-secondary to-accent mx-auto mb-4 flex items-center justify-center">
                                <CheckCircle2 className="w-8 h-8 text-secondary-foreground" />
                            </div>

                            <h1 className="font-display text-2xl sm:text-3xl font-bold mb-2">Appointment Confirmed!</h1>
                            <p className="text-sm text-muted-foreground mb-6">
                                Thank you for booking with Adaptus. We've sent a confirmation to your email.
                            </p>

                            <div className="bg-muted/50 rounded-2xl p-5 text-left space-y-3 mb-6 border border-border/60">
                                <div className="grid gap-2.5 text-sm">
                                    <div className="flex items-center gap-3">
                                        <User className="w-4 h-4 text-primary" />
                                        <span className="font-medium">{personalDetails.firstName} {personalDetails.lastName}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <MapPin className="w-4 h-4 text-primary" />
                                        <span>Adaptus Clinic, 123 Wellness Street</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 justify-center">
                                <Button variant="glass" onClick={onClose}>
                                    Return Home
                                </Button>
                                <Button variant="hero" onClick={() => {
                                    setIsSubmitted(false);
                                    setCurrentStep(1);
                                    setPersonalDetails({ firstName: "", lastName: "", age: "", gender: "", phone: "", email: "", address: "" });
                                    setSelectedDate(undefined);
                                    setSelectedTime(undefined);
                                    setBodyPartStates({
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
                                        thigh: { selected: false, painLevel: 1, side: "right" },
                                        knee: { selected: false, painLevel: 1, side: "right" },
                                        shin: { selected: false, painLevel: 1, side: "right" },
                                        ankle: { selected: false, painLevel: 1, side: "right" },
                                        foot: { selected: false, painLevel: 1, side: "right" },
                                    });
                                    setSelectedConditions({});
                                    setPainDetails({ description: "", duration: "", previousTreatment: "", additionalNotes: "" });
                                }}>
                                    Book Another
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* 1. PINNED TOP HEADER */}
                        <div className="shrink-0 px-4 sm:px-7 py-2 sm:py-2.5 border-b border-border/60 bg-card/95 backdrop-blur-sm pr-12">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 max-w-7xl mx-auto">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold shrink-0">
                                        <Activity className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h1 className="font-display text-base sm:text-lg font-bold tracking-tight leading-tight">
                                            Book Your <span className="gradient-text">Session</span>
                                        </h1>
                                        <p className="text-[11px] text-muted-foreground hidden sm:block">
                                            Complete the form below to schedule your physiotherapy session
                                        </p>
                                    </div>
                                </div>

                                <div className="w-full md:w-auto md:min-w-[360px] max-w-lg">
                                    <StepIndicator steps={steps} currentStep={currentStep} />
                                </div>
                            </div>
                        </div>

                        {/* 2. MIDDLE STEP CONTAINER (Zero scroll on Step 2; only selection menu scrolls) */}
                        <div className={cn(
                            "flex-1 min-h-0 px-4 sm:px-6 pt-1 sm:pt-1.5 pb-2 sm:pb-3 flex flex-col",
                            currentStep === 2 ? "overflow-hidden" : "overflow-y-auto custom-slim-scrollbar"
                        )}>


                                {currentStep === 1 && (
                                    <div className="animate-fade-in-up">
                                        <h2 className="font-display text-xl font-semibold mb-6">Personal Information</h2>
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label htmlFor="firstName">First Name <span className="text-red-500 font-bold ml-0.5">*</span></Label>
                                                <Input
                                                    id="firstName"
                                                    placeholder="Enter First Name"
                                                    value={personalDetails.firstName}
                                                    onChange={(e) => setPersonalDetails({ ...personalDetails, firstName: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="lastName">Last Name <span className="text-red-500 font-bold ml-0.5">*</span></Label>
                                                <Input
                                                    id="lastName"
                                                    placeholder="Enter Last Name"
                                                    value={personalDetails.lastName}
                                                    onChange={(e) => setPersonalDetails({ ...personalDetails, lastName: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="age">Age <span className="text-red-500 font-bold ml-0.5">*</span></Label>
                                                <Input
                                                    id="age"
                                                    type="text"
                                                    inputMode="numeric"
                                                    maxLength={3}
                                                    placeholder="Enter age"
                                                    value={personalDetails.age}
                                                    onChange={(e) => setPersonalDetails({ ...personalDetails, age: e.target.value.replace(/\D/g, "").slice(0, 3) })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="gender">Gender <span className="text-red-500 font-bold ml-0.5">*</span></Label>
                                                <Select
                                                    value={personalDetails.gender}
                                                    onValueChange={(value) => setPersonalDetails({ ...personalDetails, gender: value })}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select gender" />
                                                    </SelectTrigger>
                                                    <SelectContent className="z-[9999] bg-card border border-border shadow-xl rounded-xl">
                                                        <SelectItem value="male">Male</SelectItem>
                                                        <SelectItem value="female">Female</SelectItem>
                                                        <SelectItem value="other">Other</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="phone">Phone Number <span className="text-red-500 font-bold ml-0.5">*</span></Label>
                                                <Input
                                                    id="phone"
                                                    type="tel"
                                                    placeholder="Enter 10-digit phone number"
                                                    maxLength={10}
                                                    value={personalDetails.phone}
                                                    onChange={(e) => {
                                                        const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                                                        setPersonalDetails({ ...personalDetails, phone: value });
                                                    }}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="email">Email <span className="text-red-500 font-bold ml-0.5">*</span></Label>
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    placeholder="Enter Email"
                                                    value={personalDetails.email}
                                                    onChange={(e) => setPersonalDetails({ ...personalDetails, email: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2 md:col-span-2">
                                                <Label htmlFor="address">Address <span className="text-red-500 font-bold ml-0.5">*</span></Label>
                                                <Input
                                                    id="address"
                                                    placeholder="Enter Address"
                                                    value={personalDetails.address}
                                                    onChange={(e) => setPersonalDetails({ ...personalDetails, address: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {currentStep === 2 && (
                                    <div className="h-full flex flex-col overflow-hidden flex-1 min-h-0">
                                        {/* Mobile View Switcher (Only on mobile screens < lg) */}
                                        <div className="flex lg:hidden rounded-xl bg-muted p-1 border border-border/60 self-start w-full sm:w-auto shrink-0 mb-2">
                                            <button
                                                type="button"
                                                onClick={() => setMobileStep2View("map")}
                                                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                                    mobileStep2View === "map"
                                                        ? "bg-teal-600 text-white shadow-xs"
                                                        : "text-muted-foreground hover:text-foreground"
                                                }`}
                                            >
                                                <User className="w-3.5 h-3.5" />
                                                <span>Body Diagram</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setMobileStep2View("menu")}
                                                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                                    mobileStep2View === "menu"
                                                        ? "bg-teal-600 text-white shadow-xs"
                                                        : "text-muted-foreground hover:text-foreground"
                                                }`}
                                            >
                                                <Layers className="w-3.5 h-3.5" />
                                                <span>Region Menu</span>
                                                {selectedBodyParts.length > 0 && (
                                                    <span className="ml-1 px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">
                                                        {selectedBodyParts.length}
                                                    </span>
                                                )}
                                            </button>
                                        </div>

                                        <div className="grid lg:grid-cols-12 gap-3 sm:gap-4 items-stretch flex-1 min-h-0 overflow-hidden">
                                            {/* Body Map (5 columns on desktop; on mobile, shown only when mobileStep2View === 'map') */}
                                            <div className={cn(
                                                "lg:col-span-5 bg-muted/20 rounded-2xl p-2 sm:p-2.5 border border-border/60 flex flex-col items-center justify-between h-full overflow-hidden",
                                                mobileStep2View === "menu" ? "hidden lg:flex" : "flex"
                                            )}>
                                                <div className="flex items-center justify-center gap-2 mb-1.5 w-full shrink-0">
                                                    <button
                                                        type="button"
                                                        onClick={() => setBodyView("front")}
                                                        className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${bodyView === "front"
                                                            ? "bg-teal-600 text-white shadow-sm"
                                                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                                                            }`}
                                                    >
                                                        Anterior (Front View)
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setBodyView("back")}
                                                        className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${bodyView === "back"
                                                            ? "bg-teal-600 text-white shadow-sm"
                                                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                                                            }`}
                                                    >
                                                        Posterior (Back View)
                                                    </button>
                                                </div>

                                                {/* Full-view dynamic SVG BodyMap without clipping */}
                                                <div className="w-full flex-1 min-h-0 flex items-center justify-center overflow-hidden py-0.5">
                                                    <BodyMap
                                                        bodyPartStates={bodyPartStates}
                                                        onPartClick={handleTogglePart}
                                                        view={bodyView}
                                                    />
                                                </div>

                                                <p className="text-center text-[11px] text-muted-foreground font-medium shrink-0 pt-1 flex items-center justify-center gap-1.5">
                                                    <Info className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                                                    <span>Tap any muscle or joint to highlight and configure pain details</span>
                                                </p>

                                                {/* Mobile Quick Action to Open Region Menu */}
                                                <button
                                                    type="button"
                                                    onClick={() => setMobileStep2View("menu")}
                                                    className="mt-2 lg:hidden w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 text-xs font-bold hover:bg-teal-100 transition-all shrink-0"
                                                >
                                                    <Layers className="w-4 h-4" />
                                                    <span>Open Categories Menu ({selectedBodyParts.length} selected) →</span>
                                                </button>
                                            </div>

                                            {/* Categorized Body Part Selector (7 columns on desktop; on mobile, shown only when mobileStep2View === 'menu') */}
                                            <div className={cn(
                                                "lg:col-span-7 bg-muted/20 rounded-2xl border border-border/60 overflow-hidden flex flex-col h-full min-h-0",
                                                mobileStep2View === "map" ? "hidden lg:flex" : "flex"
                                            )}>
                                                <BodyPartSelector
                                                    bodyPartStates={bodyPartStates}
                                                    onTogglePart={handleTogglePart}
                                                    onPainLevelChange={handlePainLevelChange}
                                                    onSideChange={handleSideChange}
                                                    selectedConditions={selectedConditions}
                                                    onConditionToggle={handleConditionToggle}
                                                    onConditionCustomChange={handleConditionCustomChange}
                                                    onViewChange={setBodyView}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {currentStep === 3 && (
                                    <div className="animate-fade-in-up space-y-6">
                                        <h2 className="font-display text-xl font-semibold mb-6">Describe Your Pain</h2>

                                        <div className="space-y-2">
                                            <Label htmlFor="description">Pain Description <span className="text-red-500 font-bold ml-0.5">*</span></Label>
                                            <Textarea
                                                id="description"
                                                placeholder="Describe your pain in detail..."
                                                rows={4}
                                                value={painDetails.description}
                                                onChange={(e) => setPainDetails({ ...painDetails, description: e.target.value })}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="duration">Duration of Pain <span className="text-red-500 font-bold ml-0.5">*</span></Label>
                                            <Select
                                                value={painDetails.duration}
                                                onValueChange={(value) => setPainDetails({ ...painDetails, duration: value })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="How long...?" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="days">A few days</SelectItem>
                                                    <SelectItem value="weeks">1-4 weeks</SelectItem>
                                                    <SelectItem value="months">1-6 months</SelectItem>
                                                    <SelectItem value="6months+">More than 6 months</SelectItem>
                                                    <SelectItem value="years">Over a year</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="previousTreatment">Previous Treatment (Optional)</Label>
                                            <Textarea
                                                id="previousTreatment"
                                                placeholder="Any treatment...?"
                                                rows={3}
                                                value={painDetails.previousTreatment}
                                                onChange={(e) => setPainDetails({ ...painDetails, previousTreatment: e.target.value })}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="additionalNotes">Additional Notes (Optional)</Label>
                                            <Textarea
                                                id="additionalNotes"
                                                placeholder="Any other info..."
                                                rows={3}
                                                value={painDetails.additionalNotes}
                                                onChange={(e) => setPainDetails({ ...painDetails, additionalNotes: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                )}

                                {currentStep === 4 && (
                                    <div className="animate-fade-in-up">
                                        <h2 className="font-display text-xl font-semibold mb-6">Review & Confirm</h2>

                                        <div className="space-y-6">
                                            {/* Summary */}
                                            <div className="bg-muted/50 rounded-2xl p-6 space-y-4">
                                                <div className="grid md:grid-cols-2 gap-6">
                                                    <div>
                                                        <h4 className="font-medium text-sm text-muted-foreground mb-2">Personal Details</h4>
                                                        <p className="font-medium">{personalDetails.firstName} {personalDetails.lastName}</p>
                                                        <p className="text-sm text-muted-foreground">{personalDetails.email}</p>
                                                        <p className="text-sm text-muted-foreground">{personalDetails.phone}</p>
                                                    </div>
                                                </div>

                                                <div className="pt-4 border-t">
                                                    <h4 className="font-medium text-sm text-muted-foreground mb-2">Pain Areas</h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        {selectedBodyParts.map((part) => (
                                                            <span key={part} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">
                                                                {painCategories[part]?.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Note: Terms Accepted in Step 1 */}
                                            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                                <CheckCircle2 className="w-4 h-4 text-primary" />
                                                <span>Terms & Conditions accepted</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                        </div>

                        {/* 3. PINNED BOTTOM FOOTER */}
                        <div className="shrink-0 px-4 sm:px-6 py-3 border-t border-border/60 bg-card/95 backdrop-blur-sm flex justify-between items-center z-10 shadow-xs">
                            <Button
                                variant="ghost"
                                onClick={prevStep}
                                disabled={currentStep === 1}
                                className="gap-2 text-sm font-semibold"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Previous
                            </Button>

                            <div className="flex items-center gap-3">
                                {currentStep === 2 && selectedBodyParts.length > 0 && (
                                    <span className="text-xs text-muted-foreground hidden sm:inline-block">
                                        <span className="font-bold text-teal-600 dark:text-teal-400">{selectedBodyParts.length}</span> {selectedBodyParts.length === 1 ? "area" : "areas"} selected
                                    </span>
                                )}
                                <Button
                                    variant="hero"
                                    onClick={nextStep}
                                    className="gap-2 text-sm font-semibold px-6 shadow-md hover:shadow-lg transition-all"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            {currentStep === 4 ? "Confirm Booking" : "Continue"}
                                            {currentStep !== 4 && <ArrowRight className="w-4 h-4" />}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </>
                )}

                {/* Dedicated Separate Components for Mobile Body Map PiP & Full Modal */}
                {currentStep === 2 && (
                    <div className="lg:hidden">
                        {/* Separate BodyMapPip Floating Component */}
                        {mobileStep2View === "menu" && (
                            <BodyMapPip
                                bodyPartStates={bodyPartStates}
                                onPartClick={handleTogglePart}
                                bodyView={bodyView}
                                onViewChange={setBodyView}
                                selectedCount={selectedBodyParts.length}
                                onExpandFull={() => setIsBodyMapModalOpen(true)}
                                defaultMinimized={false}
                                size="xl"
                            />
                        )}

                        {/* Separate Body Map Modal Component */}
                        <BodyMapModal
                            isOpen={isBodyMapModalOpen}
                            onClose={() => setIsBodyMapModalOpen(false)}
                            bodyPartStates={bodyPartStates}
                            onPartClick={handleTogglePart}
                            bodyView={bodyView}
                            onViewChange={setBodyView}
                            selectedCount={selectedBodyParts.length}
                        />
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
