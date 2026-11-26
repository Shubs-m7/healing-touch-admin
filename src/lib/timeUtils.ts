/**
 * Time utility functions for formatting, validating, and normalizing time inputs.
 * Ensures that only valid time representations (e.g. "10:30 AM", "1:54 PM") are accepted and stored.
 */

export interface TimeParseResult {
  isValid: boolean;
  formatted: string;
}

/**
 * Parses and formats a raw time string into standardized 12-hour AM/PM format (e.g. "1:54 AM", "10:30 PM").
 * Supports:
 * - 12-hour format: "1:54 AM", "01:54 am", "10:30 PM"
 * - 24-hour / HTML5 format: "13:54", "01:54", "00:30"
 */
export function parseAndFormatTime(raw: string | undefined | null): TimeParseResult {
  if (!raw || typeof raw !== "string") {
    return { isValid: false, formatted: "" };
  }

  const str = raw.trim();
  if (!str) {
    return { isValid: false, formatted: "" };
  }

  // 1. 12-hour format with AM/PM (e.g. "1:54 AM", "10:30 PM", "01:20:00 am")
  const match12 = str.match(/^(0?[1-9]|1[0-2]):([0-5][0-9])(?::[0-5][0-9])?\s*(am|pm)$/i);
  if (match12) {
    const hours = parseInt(match12[1], 10);
    const minutes = match12[2];
    const modifier = match12[3].toUpperCase();
    return {
      isValid: true,
      formatted: `${hours}:${minutes} ${modifier}`,
    };
  }

  // 2. 24-hour military / HTML5 time format (e.g. "13:45", "09:30", "01:54:00", "0:00")
  const match24 = str.match(/^([01]?[0-9]|2[0-3]):([0-5][0-9])(?::[0-5][0-9])?$/);
  if (match24) {
    let hours = parseInt(match24[1], 10);
    const minutes = match24[2];
    const modifier = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return {
      isValid: true,
      formatted: `${hours}:${minutes} ${modifier}`,
    };
  }

  return { isValid: false, formatted: "" };
}

/**
 * Returns true if the string is a valid time format.
 */
export function isValidTimeString(val: string | undefined | null): boolean {
  return parseAndFormatTime(val).isValid;
}

/**
 * Returns current local time in standard 12-hour AM/PM format (e.g., "1:54 AM").
 */
export function getCurrentTimeString(): string {
  return new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}
