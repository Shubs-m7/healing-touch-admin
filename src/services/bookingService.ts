let rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
if (rawApiUrl.endsWith("/")) {
    rawApiUrl = rawApiUrl.slice(0, -1);
}
if (!rawApiUrl.endsWith("/api")) {
    rawApiUrl = `${rawApiUrl}/api`;
}
const API_URL = rawApiUrl;

export interface BookingData {
    personalDetails: {
        firstName: string;
        lastName: string;
        age: string;
        gender: string;
        phone: string;
        email: string;
        address: string;
    };
    bodyParts: Array<{
        partId: string;
        painLevel: number;
        side?: "left" | "right" | "both";
        selected: boolean;
    }>;
    selectedConditions: Record<string, string[]>;
    painDetails: {
        description: string;
        duration: string;
        previousTreatment: string;
        additionalNotes: string;
    };
    bookingSource?: BookingSource;
}

export type BookingStatus = 
    | 'pending'
    | 'link_sent'
    | 'scheduling'
    | 'scheduled'
    | 'confirmed'
    | 'completed'
    | 'converted_to_patient'
    | 'cancelled';

export type BookingSource = 'online' | 'manual_walkin';

export interface CompletionReport {
    assessmentSummary: string;
    treatmentAdministered: string;
    recommendations: string;
    therapistNotes?: string;
    completedAt?: string;
}

export interface VisitPaymentDetails {
    amount: number;
    status: 'paid' | 'pending' | 'waived';
    method: 'cash' | 'upi' | 'card' | 'online' | 'pending';
    transactionRef?: string;
    paidAt?: string;
}

export interface BookingResponse extends BookingData {
    _id: string;
    status: BookingStatus;
    bookingSource?: BookingSource;
    scheduledDate?: string;
    scheduledTime?: string;
    suggestedTimes?: string[];
    completionReport?: CompletionReport;
    paymentDetails?: VisitPaymentDetails;
    createdAt: string;
}

export interface PatientRecord {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    age: string;
    gender: string;
    address: string;
    conditions: string[];
    diagnosis: string;
    program: string;
    totalSessionsCompleted: number;
    status: 'active' | 'completed' | 'inactive';
    bookingId?: string;
    initialConsultation?: {
        assessmentSummary?: string;
        treatmentAdministered?: string;
        recommendations?: string;
        paymentAmount?: number;
        paymentStatus?: string;
        paymentMethod?: string;
        date?: string;
    };
    activePackage?: {
        packageName: 'per_session' | '6_sessions' | '10_sessions' | '15_sessions';
        title: string;
        totalSessions: number;
        pricePerSession: number;
        totalAmount: number;
        paymentOption: 'pay_per_session' | 'pay_per_package';
        paymentStatus: 'paid' | 'partial' | 'pending';
        amountPaid: number;
        sessionType: 'home_visit' | 'in_clinic' | 'online';
        purchasedAt: string;
    };
    sessions?: Array<{
        sessionNumber: number;
        date: string;
        time: string;
        sessionType: 'home_visit' | 'in_clinic' | 'online';
        status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
        checkInTime?: string;
        leaveTime?: string;
        report?: {
            treatmentAdministered: string;
            painLevelBefore?: number;
            painLevelAfter?: number;
            progressNotes: string;
            homeExercisesRecommended?: string;
            therapistName?: string;
            completedAt?: string;
        };
        clinicalNotes?: string;
        paymentStatus: 'paid' | 'pending';
        amount: number;
        paymentMethod?: string;
        transactionId?: string;
        paidAmount?: number;
        paymentDate?: string;
        paymentNotes?: string;
    }>;
    convertedAt: string;
    createdAt: string;
}

export const createBooking = async (bookingData: BookingData) => {
    try {
        const response = await fetch(`${API_URL}/bookings`, {
        credentials: "include",
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(bookingData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to create booking");
        }

        return await response.json();
    } catch (error) {
        throw error;
    }
};

const getAuthHeaders = () => {
    return {
        "Content-Type": "application/json",
    };
};

const handleResponse = async (response: Response, defaultErrorMessage: string) => {
    if (response.status === 401 || response.status === 403) {
        if (typeof window !== 'undefined') {
            localStorage.removeItem("admin_token");
            localStorage.removeItem("admin_email");
            localStorage.removeItem("admin_role");
            localStorage.removeItem("admin_name");
            if (window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login') {
                window.location.href = "/admin/login?expired=true";
            }
        }
        throw new Error("Session expired or unauthorized. Please log in again.");
    }
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || defaultErrorMessage);
    }
    return await response.json();
};

export const getBookings = async (): Promise<BookingResponse[]> => {
    try {
        const response = await fetch(`${API_URL}/bookings`, {
        credentials: "include",
            headers: getAuthHeaders()
        });
        return await handleResponse(response, "Failed to fetch bookings");
    } catch (error) {
        throw error;
    }
};

export const updateBookingStatus = async (
    id: string, 
    status: BookingStatus, 
    extraPayload?: { 
        completionReport?: CompletionReport; 
        paymentDetails?: VisitPaymentDetails;
        bodyParts?: BookingData['bodyParts'];
        selectedConditions?: Record<string, string[]>;
        painDetails?: BookingData['painDetails'];
    }
): Promise<BookingResponse> => {
    try {
        const response = await fetch(`${API_URL}/bookings/${id}/status`, {
        credentials: "include",
            method: "PATCH",
            headers: getAuthHeaders(),
            body: JSON.stringify({ 
                status,
                ...(extraPayload?.completionReport ? { completionReport: extraPayload.completionReport } : {}),
                ...(extraPayload?.paymentDetails ? { paymentDetails: extraPayload.paymentDetails } : {}) ,
                ...(extraPayload?.bodyParts ? { bodyParts: extraPayload.bodyParts } : {}),
                ...(extraPayload?.selectedConditions ? { selectedConditions: extraPayload.selectedConditions } : {}),
                ...(extraPayload?.painDetails ? { painDetails: extraPayload.painDetails } : {})
            }),
        });
        return await handleResponse(response, "Failed to update booking status");
    } catch (error) {
        throw error;
    }
};

export const updateBookingDetails = async (
    id: string,
    payload: {
        personalDetails?: Partial<BookingData['personalDetails']>;
        scheduledDate?: string;
        scheduledTime?: string;
        painDetails?: Partial<BookingData['painDetails']>;
        status?: BookingStatus;
        bookingSource?: BookingSource;
    }
): Promise<BookingResponse> => {
    try {
        const response = await fetch(`${API_URL}/bookings/${id}`, {
        credentials: "include",
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify(payload),
        });
        return await handleResponse(response, "Failed to update appointment details");
    } catch (error) {
        throw error;
    }
};

export const loginAdmin = async (email: string, password: string): Promise<{ message: string; email: string; otp?: string }> => {
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
        credentials: "include",
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Invalid credentials");
        }
        return await response.json();
    } catch (error) {
        throw error;
    }
};

export const verifyOtp = async (email: string, otp: string): Promise<{ success: boolean; token: string; email: string; role: 'admin' | 'receptionist'; name?: string; message: string }> => {
    try {
        const response = await fetch(`${API_URL}/auth/verify-otp`, {
        credentials: "include",
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, otp }),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to verify OTP");
        }
        return await response.json();
    } catch (error) {
        throw error;
    }
};

export const getBookingById = async (id: string, token?: string | null): Promise<BookingResponse> => {
    try {
        const qs = token ? `?token=${encodeURIComponent(token)}` : "";
        const response = await fetch(`${API_URL}/bookings/${id}${qs}`, {
            credentials: "include",
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to fetch booking details");
        }
        return await response.json();
    } catch (error) {
        throw error;
    }
};

export const scheduleBookingSlot = async (id: string, scheduledDate: string, scheduledTime: string, token?: string | null): Promise<BookingResponse> => {
    try {
        const qs = token ? `?token=${encodeURIComponent(token)}` : "";
        const response = await fetch(`${API_URL}/bookings/${id}/schedule${qs}`, {
            method: "PATCH",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ scheduledDate, scheduledTime, ...(token ? { token } : {}) })
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to schedule booking slot");
        }
        return await response.json();
    } catch (error) {
        throw error;
    }
};

export const sendSchedulingLink = async (id: string): Promise<BookingResponse> => {
    try {
        const response = await fetch(`${API_URL}/bookings/${id}/send-link`, {
        credentials: "include",
            method: "POST",
            headers: getAuthHeaders(),
        });
        return await handleResponse(response, "Failed to send scheduling link");
    } catch (error) {
        throw error;
    }
};

export const suggestAlternativeTime = async (id: string, suggestedTimes: string[], suggestedDate?: string): Promise<BookingResponse> => {
    try {
        const response = await fetch(`${API_URL}/bookings/${id}/suggest-time`, {
        credentials: "include",
            method: "PATCH",
            headers: getAuthHeaders(),
            body: JSON.stringify({ suggestedTimes, suggestedDate }),
        });
        return await handleResponse(response, "Failed to suggest alternative time slot");
    } catch (error) {
        throw error;
    }
};

export const convertToPatient = async (bookingId: string): Promise<{ message: string; patient: PatientRecord; booking: BookingResponse }> => {
    try {
        const response = await fetch(`${API_URL}/bookings/${bookingId}/convert-to-patient`, {
        credentials: "include",
            method: "POST",
            headers: getAuthHeaders(),
        });
        return await handleResponse(response, "Failed to convert booking to patient");
    } catch (error) {
        throw error;
    }
};

export const getPatients = async (): Promise<PatientRecord[]> => {
    try {
        const response = await fetch(`${API_URL}/patients`, {
        credentials: "include",
            headers: getAuthHeaders()
        });
        return await handleResponse(response, "Failed to fetch patients list");
    } catch (error) {
        throw error;
    }
};

/**
 * Fetch list of booked time slots for a given date from active database bookings.
 */
export const getBookedSlotsByDate = async (dateStr: string): Promise<string[]> => {
    try {
        const response = await fetch(`${API_URL}/bookings/booked-slots?date=${encodeURIComponent(dateStr)}`);
        if (!response.ok) return [];
        const data = await response.json();
        return Array.isArray(data.bookedSlots) ? data.bookedSlots : [];
    } catch (error) {
        console.error('Failed to fetch booked slots by date:', error);
        return [];
    }
};
