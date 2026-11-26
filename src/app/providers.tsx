"use client";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, ReactNode } from "react";
import { ThemeMasterProvider } from "@/context/ThemeMasterContext";
import { BookingProvider } from "@/context/BookingContext";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeMasterProvider>
        <TooltipProvider>
          <BookingProvider>
            {children}
            <Toaster />
            <Sonner />
          </BookingProvider>
        </TooltipProvider>
      </ThemeMasterProvider>
    </QueryClientProvider>
  );
}
