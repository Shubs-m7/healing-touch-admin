"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { PatientProfile, getPatientMe, verifyPatientOtp } from "@/services/patientApiService";
import { logoutSession, refreshAuthSession } from "@/services/authSessionService";

interface PatientAuthContextType {
    patientUser: PatientProfile | null;
    patientToken: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    loginWithOtp: (email: string, otp: string) => Promise<any>;
    logout: () => void;
    refreshProfile: () => Promise<void>;
}

const PatientAuthContext = createContext<PatientAuthContextType | undefined>(undefined);

const USER_KEY = "patient_user";

export const PatientAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [patientUser, setPatientUser] = useState<PatientProfile | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    // Initial session restore via HttpOnly cookie
    useEffect(() => {
        const initAuth = async () => {
            try {
                const storedUser = localStorage.getItem(USER_KEY);
                if (storedUser) {
                    setPatientUser(JSON.parse(storedUser));
                }

                try {
                    const data = await getPatientMe();
                    if (data.patient) {
                        setPatientUser(data.patient);
                        localStorage.setItem(USER_KEY, JSON.stringify(data.patient));
                    }
                } catch {
                    const refreshed = await refreshAuthSession();
                    if (refreshed) {
                        const data = await getPatientMe();
                        if (data.patient) {
                            setPatientUser(data.patient);
                            localStorage.setItem(USER_KEY, JSON.stringify(data.patient));
                            return;
                        }
                    }
                    localStorage.removeItem(USER_KEY);
                    setPatientUser(null);
                }
            } catch (error) {
                console.error("[PatientAuth] Failed restoring patient session:", error);
            } finally {
                setIsLoading(false);
            }
        };

        initAuth();
    }, []);

    const loginWithOtp = async (email: string, otp: string) => {
        setIsLoading(true);
        try {
            const res = await verifyPatientOtp(email, otp);
            if (res.success && res.patient) {
                setPatientUser(res.patient);
                localStorage.setItem(USER_KEY, JSON.stringify(res.patient));
                return res;
            } else {
                throw new Error(res.message || "Failed to authenticate OTP");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const logout = useCallback(() => {
        logoutSession();
        localStorage.removeItem(USER_KEY);
        setPatientUser(null);
    }, []);

    const refreshProfile = async () => {
        if (!patientUser) return;
        try {
            const data = await getPatientMe();
            if (data.patient) {
                setPatientUser(data.patient);
                localStorage.setItem(USER_KEY, JSON.stringify(data.patient));
            }
        } catch (error) {
            console.error("[PatientAuth] Error refreshing profile:", error);
        }
    };

    return (
        <PatientAuthContext.Provider
            value={{
                patientUser,
                patientToken: patientUser ? "cookie" : null,
                isAuthenticated: !!patientUser,
                isLoading,
                loginWithOtp,
                logout,
                refreshProfile,
            }}
        >
            {children}
        </PatientAuthContext.Provider>
    );
};

export const usePatientAuth = () => {
    const context = useContext(PatientAuthContext);
    if (!context) {
        throw new Error("usePatientAuth must be used within a PatientAuthProvider");
    }
    return context;
};
