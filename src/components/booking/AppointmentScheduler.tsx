"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { getBookedSlotsByDate } from "@/services/bookingService";
import { Loader2 } from "lucide-react";

interface AppointmentSchedulerProps {
  selectedDate: Date | undefined;
  onDateSelect: (date: Date | undefined) => void;
  selectedTime: string | undefined;
  onTimeSelect: (time: string) => void;
  bookedSlotsOverride?: string[];
}

const allBaseTimeSlots: string[] = [
  "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM",
  "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM",
  "4:00 PM", "4:30 PM", "5:00 PM", "5:30 PM",
  "6:00 PM", "6:30 PM", "7:00 PM", "7:30 PM",
];

const AppointmentScheduler = ({
  selectedDate,
  onDateSelect,
  selectedTime,
  onTimeSelect,
  bookedSlotsOverride,
}: AppointmentSchedulerProps) => {
  const [fetchedBookedSlots, setFetchedBookedSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    if (!selectedDate) {
      setFetchedBookedSlots([]);
      return;
    }

    // If parent passed explicit override, use it directly
    if (bookedSlotsOverride !== undefined) {
      return;
    }

    const dateStr = format(selectedDate, "yyyy-MM-dd");
    let isMounted = true;
    setLoadingSlots(true);

    getBookedSlotsByDate(dateStr)
      .then((slots) => {
        if (isMounted) {
          setFetchedBookedSlots(slots);
        }
      })
      .catch((err) => {
        console.error("Failed to load real booked slots:", err);
        if (isMounted) setFetchedBookedSlots([]);
      })
      .finally(() => {
        if (isMounted) setLoadingSlots(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedDate, bookedSlotsOverride]);

  const effectiveBookedSlots = bookedSlotsOverride !== undefined ? bookedSlotsOverride : fetchedBookedSlots;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
      {/* Date Picker */}
      <div>
        <h3 className="font-display font-semibold text-base sm:text-lg mb-3 sm:mb-4">Select Date</h3>
        <div className="bg-card rounded-2xl border shadow-card p-3 sm:p-4 flex justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={onDateSelect}
            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0)) || date.getDay() === 0}
            className="pointer-events-auto"
          />
        </div>
      </div>

      {/* Time Slots */}
      <div>
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h3 className="font-display font-semibold text-base sm:text-lg">
            {selectedDate
              ? `Available Times for ${format(selectedDate, "MMM d, yyyy")}`
              : "Select a date first"}
          </h3>
          {loadingSlots && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              <span>Checking slots...</span>
            </div>
          )}
        </div>

        {selectedDate ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            {allBaseTimeSlots.map((slotTime) => {
              const normalizeTime = (t: string) => t.replace(/^0/, "").trim().toUpperCase();
              const isBooked = effectiveBookedSlots.some((s) => normalizeTime(s) === normalizeTime(slotTime));
              const isSelected = selectedTime === slotTime;

              return (
                <button
                  key={slotTime}
                  type="button"
                  disabled={isBooked}
                  onClick={() => !isBooked && onTimeSelect(slotTime)}
                  title={isBooked ? `Time slot ${slotTime} is already booked` : `Select ${slotTime}`}
                  className={cn(
                    "p-2.5 sm:p-3 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 text-center",
                    isBooked && "opacity-40 cursor-not-allowed bg-muted text-muted-foreground line-through pointer-events-none",
                    !isBooked && !isSelected && "bg-muted hover:bg-primary/10 hover:text-primary cursor-pointer",
                    isSelected && "bg-primary text-primary-foreground shadow-glow font-bold"
                  )}
                >
                  {slotTime}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center h-48 bg-muted/50 rounded-2xl p-4 text-center">
            <p className="text-xs sm:text-sm text-muted-foreground">Please select a date to view available times</p>
          </div>
        )}

        {/* Legend */}
        <div className="mt-4 flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-muted" />
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-muted opacity-40 line-through" />
            <span>Booked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-primary" />
            <span>Selected</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentScheduler;
