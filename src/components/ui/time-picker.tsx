"use client";

import React, { useState, useEffect } from "react";
import { Clock, Check, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface TimePickerProps {
  value: string;
  onChange: (time: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  onBlur?: () => void;
  error?: boolean;
}

const COMMON_SLOTS = [
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM",
  "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM",
  "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM",
  "06:00 PM", "06:30 PM", "07:00 PM", "07:30 PM"
];

const HOURS = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
const MINUTES = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];

function getCurrentTime12(): string {
  const now = new Date();
  let hours = now.getHours();
  const minutes = now.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  const strHours = hours < 10 ? `0${hours}` : `${hours}`;
  const strMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
  return `${strHours}:${strMinutes} ${ampm}`;
}

export function TimePicker({
  value,
  onChange,
  placeholder = "Select time",
  className,
  disabled = false,
  onBlur,
  error = false,
}: TimePickerProps) {
  const [open, setOpen] = useState(false);

  // Parse current value or fallback
  const parseTime = (timeStr: string) => {
    const match = timeStr?.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (match) {
      const h = match[1].padStart(2, "0");
      const m = match[2];
      const p = match[3].toUpperCase();
      return { hour: h, minute: m, period: p };
    }
    return { hour: "10", minute: "00", period: "AM" };
  };

  const [selectedHour, setSelectedHour] = useState("10");
  const [selectedMinute, setSelectedMinute] = useState("00");
  const [selectedPeriod, setSelectedPeriod] = useState("AM");

  useEffect(() => {
    if (value) {
      const parsed = parseTime(value);
      setSelectedHour(parsed.hour);
      setSelectedMinute(parsed.minute);
      setSelectedPeriod(parsed.period);
    }
  }, [value]);

  const handleApply = (h: string, m: string, p: string) => {
    const formatted = `${h}:${m} ${p}`;
    onChange(formatted);
    setOpen(false);
  };

  const handleSlotClick = (slot: string) => {
    onChange(slot);
    setOpen(false);
  };

  const handleNowClick = () => {
    const now = getCurrentTime12();
    onChange(now);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={(val) => {
      setOpen(val);
      if (!val && onBlur) onBlur();
    }}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "w-full h-9 px-3 rounded-xl border bg-background text-xs font-semibold flex items-center justify-between text-left transition-all",
            "hover:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500",
            error ? "border-rose-500 focus:ring-rose-500/20" : "border-input",
            !value && "text-muted-foreground",
            value && "text-foreground font-bold",
            disabled && "opacity-50 cursor-not-allowed",
            className
          )}
        >
          <div className="flex items-center gap-2 truncate">
            <Clock className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <span className="truncate">{value || placeholder}</span>
          </div>
          {value ? (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              className="p-0.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground shrink-0"
              title="Clear time"
            >
              <X className="w-3 h-3" />
            </span>
          ) : (
            <Clock className="w-3 h-3 text-muted-foreground/60 shrink-0" />
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        className="w-80 p-0 z-[9999] bg-card border border-border shadow-2xl rounded-2xl overflow-hidden"
        align="start"
      >
        {/* Header */}
        <div className="p-3 bg-muted/30 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-teal-600" />
            <span className="text-xs font-bold text-foreground">Select Time</span>
          </div>
          <button
            type="button"
            onClick={handleNowClick}
            className="text-[11px] font-semibold text-teal-600 hover:text-teal-700 hover:underline flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3" />
            Set to Now
          </button>
        </div>

        {/* Custom Hour / Minute / AM-PM Selectors */}
        <div className="p-3 border-b border-border space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Custom Time
          </div>
          <div className="flex items-center justify-center gap-2">
            {/* Hour Selector */}
            <div className="flex flex-col items-center">
              <span className="text-[9px] text-muted-foreground mb-1 font-medium">Hour</span>
              <Select
                value={selectedHour}
                onValueChange={(val) => {
                  setSelectedHour(val);
                  handleApply(val, selectedMinute, selectedPeriod);
                }}
              >
                <SelectTrigger className="h-8 w-16 px-2 text-xs font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[10000] max-h-48 bg-card border border-border shadow-xl rounded-xl">
                  {HOURS.map((h) => (
                    <SelectItem key={h} value={h}>{h}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <span className="font-bold text-foreground text-sm mt-3">:</span>

            {/* Minute Selector */}
            <div className="flex flex-col items-center">
              <span className="text-[9px] text-muted-foreground mb-1 font-medium">Minute</span>
              <Select
                value={selectedMinute}
                onValueChange={(val) => {
                  setSelectedMinute(val);
                  handleApply(selectedHour, val, selectedPeriod);
                }}
              >
                <SelectTrigger className="h-8 w-16 px-2 text-xs font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[10000] max-h-48 bg-card border border-border shadow-xl rounded-xl">
                  {MINUTES.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Period Selector (AM / PM) */}
            <div className="flex flex-col items-center ml-1">
              <span className="text-[9px] text-muted-foreground mb-1 font-medium">Period</span>
              <div className="flex rounded-lg border border-input bg-background p-0.5 h-8">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPeriod("AM");
                    handleApply(selectedHour, selectedMinute, "AM");
                  }}
                  className={cn(
                    "px-2 rounded-md text-[11px] font-bold transition-all",
                    selectedPeriod === "AM"
                      ? "bg-teal-600 text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  AM
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPeriod("PM");
                    handleApply(selectedHour, selectedMinute, "PM");
                  }}
                  className={cn(
                    "px-2 rounded-md text-[11px] font-bold transition-all",
                    selectedPeriod === "PM"
                      ? "bg-teal-600 text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  PM
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Clinic Slots */}
        <div className="p-3 space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Quick Clinic Slots
          </div>
          <div className="grid grid-cols-4 gap-1.5 max-h-36 overflow-y-auto pr-1">
            {COMMON_SLOTS.map((slot) => {
              const isSelected = value?.toUpperCase() === slot.toUpperCase();
              return (
                <button
                  key={slot}
                  type="button"
                  onClick={() => handleSlotClick(slot)}
                  className={cn(
                    "h-7 px-1 rounded-lg text-[10px] font-semibold transition-all border text-center truncate",
                    isSelected
                      ? "bg-teal-600 text-white border-teal-600 shadow-xs font-bold"
                      : "bg-background text-foreground border-input hover:border-teal-500 hover:bg-teal-500/10 hover:text-teal-600"
                  )}
                >
                  {slot}
                </button>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
