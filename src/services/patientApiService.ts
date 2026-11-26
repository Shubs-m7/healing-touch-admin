let rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
if (rawApiUrl.endsWith("/")) {
    rawApiUrl = rawApiUrl.slice(0, -1);
}
if (!rawApiUrl.endsWith("/api")) {
    rawApiUrl = `${rawApiUrl}/api`;
}
const API_URL = rawApiUrl;

export interface SessionReport {
    treatmentAdministered: string;
    painLevelBefore?: number;
    painLevelAfter?: number;
    progressNotes: string;
    homeExercisesRecommended?: string;
    therapistName?: string;
    completedAt?: string;
}

export interface PatientSession {
    sessionNumber: number;
    date: string;
    time: string;
    sessionType: 'home_visit' | 'in_clinic' | 'online';
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
    checkInTime?: string;
    leaveTime?: string;
    report?: SessionReport;
    clinicalNotes?: string;
    paymentStatus: 'paid' | 'pending';
    amount: number;
    paymentMethod?: string;
    transactionId?: string;
    paidAmount?: number;
    paymentDate?: string;
    paymentNotes?: string;
}

export interface PatientPackage {
    packageName: 'per_session' | '6_sessions' | '10_sessions' | '15_sessions' | string;
    title: string;
    totalSessions: number;
    pricePerSession: number;
    totalAmount: number;
    paymentOption: 'pay_per_session' | 'pay_per_package';
    paymentStatus: 'paid' | 'partial' | 'pending';
    amountPaid: number;
    sessionType: 'home_visit' | 'in_clinic' | 'online';
    purchasedAt: string;
}

export interface PatientProfile {
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
    activePackage?: PatientPackage;
    sessions?: PatientSession[];
    convertedAt: string;
    createdAt: string;
}

export interface PatientAppointment {
    _id: string;
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
        side?: 'left' | 'right' | 'both';
        selected: boolean;
    }>;
    selectedConditions?: Record<string, string[]>;
    painDetails: {
        description: string;
        duration: string;
        previousTreatment?: string;
        additionalNotes?: string;
    };
    status: string;
    scheduledDate?: string;
    scheduledTime?: string;
    suggestedTimes?: string[];
    completionReport?: {
        assessmentSummary: string;
        treatmentAdministered: string;
        recommendations: string;
        therapistNotes?: string;
        completedAt?: string;
    };
    paymentDetails?: {
        amount: number;
        status: 'paid' | 'pending' | 'waived';
        method: 'cash' | 'upi' | 'card' | 'online' | 'pending';
        transactionRef?: string;
        paidAt?: string;
    };
    createdAt: string;
}

export interface PatientDashboardData {
    success: boolean;
    patient: PatientProfile;
    appointments: PatientAppointment[];
}

const getAuthHeaders = (token?: string) => {
    const activeToken = token && token !== "cookie" ? token : null;
    return {
        "Content-Type": "application/json",
        ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
    };
};

/**
 * Request OTP for patient email.
 * Only succeeds if email has been converted to patient by clinic admin.
 */
export const requestPatientOtp = async (email: string) => {
    const response = await fetch(`${API_URL}/patients/auth/request-otp`, {
        credentials: "include",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || "Failed to send verification code");
    }
    return data;
};

/**
 * Verify 6-digit OTP and obtain session JWT token.
 */
export const verifyPatientOtp = async (email: string, otp: string) => {
    const response = await fetch(`${API_URL}/patients/auth/verify-otp`, {
        credentials: "include",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || "Invalid or expired verification code");
    }
    return data;
};

/**
 * Fetch patient profile, medical diagnosis, and full appointment history.
 */
export const getPatientMe = async (token?: string): Promise<PatientDashboardData> => {
    const response = await fetch(`${API_URL}/patients/me`, {
        credentials: "include",
        method: "GET",
        headers: getAuthHeaders(token),
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || "Failed to fetch patient records");
    }
    return data;
};

/**
 * Update patient contact profile.
 */
export const updatePatientProfile = async (updateData: Partial<PatientProfile>, token?: string) => {
    const response = await fetch(`${API_URL}/patients/me`, {
        credentials: "include",
        method: "PUT",
        headers: getAuthHeaders(token),
        body: JSON.stringify(updateData),
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || "Failed to update profile");
    }
    return data;
};

/**
 * Choose or buy a therapy package for patient.
 */
export const choosePatientPackage = async (
    patientId: string, 
    packagePayload: {
        packageName: 'per_session' | '6_sessions' | '10_sessions' | '15_sessions' | string;
        sessionType: 'home_visit' | 'in_clinic' | 'online';
        paymentOption: 'pay_per_session' | 'pay_per_package';
        paymentStatus?: 'paid' | 'pending';
        amountPaid?: number;
    },
    token?: string
) => {
    const response = await fetch(`${API_URL}/patients/${patientId}/package`, {
        credentials: "include",
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify(packagePayload),
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || "Failed to choose package");
    }
    return data;
};

/**
 * Book a therapy session under patient's active package.
 */
export const bookPatientSession = async (
    patientId: string,
    sessionPayload: {
        date: string;
        time: string;
        sessionType?: 'home_visit' | 'in_clinic' | 'online';
        clinicalNotes?: string;
        checkInTime?: string;
        leaveTime?: string;
        status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
    },
    token?: string
) => {
    const response = await fetch(`${API_URL}/patients/${patientId}/sessions`, {
        credentials: "include",
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify(sessionPayload),
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || "Failed to schedule session");
    }
    return data;
};

/**
 * Update a patient's session status, check-in / leave times, payment or clinical report.
 * Accepts numeric sessionIndex or direct session ObjectId string.
 */
export const updatePatientSession = async (
    patientId: string,
    sessionIndex: number | string,
    updatePayload: {
        status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
        clinicalNotes?: string;
        paymentStatus?: 'paid' | 'pending';
        checkInTime?: string;
        leaveTime?: string;
        report?: SessionReport;
        paymentMethod?: string;
        transactionId?: string;
        paidAmount?: number;
        paymentDate?: string | Date;
        paymentNotes?: string;
    },
    token?: string
) => {
    const response = await fetch(`${API_URL}/patients/${patientId}/sessions/${sessionIndex}`, {
        credentials: "include",
        method: "PATCH",
        headers: getAuthHeaders(token),
        body: JSON.stringify(updatePayload),
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || "Failed to update session");
    }
    return data;
};

/**
 * Fetch all sessions from dedicated session collection, with optional filters
 */
export const fetchSessions = async (
    filters?: {
        patientId?: string;
        date?: string;
        status?: string;
        paymentStatus?: string;
    },
    token?: string
) => {
    const params = new URLSearchParams();
    if (filters?.patientId) params.append("patientId", filters.patientId);
    if (filters?.date) params.append("date", filters.date);
    if (filters?.status) params.append("status", filters.status);
    if (filters?.paymentStatus) params.append("paymentStatus", filters.paymentStatus);

    const qs = params.toString() ? `?${params.toString()}` : "";
    const response = await fetch(`${API_URL}/sessions${qs}`, {
        credentials: "include",
        method: "GET",
        headers: getAuthHeaders(token),
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || "Failed to fetch sessions");
    }
    return data;
};

/**
 * Update session directly by its unique Session ObjectId
 */
export const updateSessionById = async (
    sessionId: string,
    updatePayload: any,
    token?: string
) => {
    const response = await fetch(`${API_URL}/sessions/${sessionId}`, {
        credentials: "include",
        method: "PATCH",
        headers: getAuthHeaders(token),
        body: JSON.stringify(updatePayload),
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || "Failed to update session");
    }
    return data;
};

/**
 * Delete session by its unique Session ObjectId
 */
export const deleteSessionById = async (sessionId: string, token?: string) => {
    const response = await fetch(`${API_URL}/sessions/${sessionId}`, {
        credentials: "include",
        method: "DELETE",
        headers: getAuthHeaders(token),
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || "Failed to delete session");
    }
    return data;
};

