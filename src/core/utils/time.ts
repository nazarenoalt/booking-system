import type { Duration } from "@/core/models/booking.types";

export const CLINIC_START = "09:00";
export const CLINIC_END = "18:00";
export const SLOT_INTERVAL_MINUTES = 30;
export const DURATIONS: Duration[] = [30, 45, 60];

/** Converts "HH:mm" to total minutes since midnight. */
export function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/** Converts total minutes since midnight to "HH:mm". */
export function toTimeString(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Returns a new "HH:mm" string with `minutes` added. */
export function addMinutes(time: string, minutes: number): string {
  return toTimeString(toMinutes(time) + minutes);
}

/**
 * Returns all valid start-time slots (every SLOT_INTERVAL_MINUTES),
 * filtered so that start + duration fits within clinic hours.
 * When no duration is given, returns every slot that fits at least a 30-min booking.
 */
export function getStartSlots(duration?: Duration): string[] {
  const clinicStartMin = toMinutes(CLINIC_START);
  const clinicEndMin = toMinutes(CLINIC_END);
  const minDuration = duration ?? SLOT_INTERVAL_MINUTES;
  const slots: string[] = [];

  for (
    let min = clinicStartMin;
    min + minDuration <= clinicEndMin;
    min += SLOT_INTERVAL_MINUTES
  ) {
    slots.push(toTimeString(min));
  }

  return slots;
}

/**
 * Returns the durations that remain valid for the given start time
 * (i.e. startTime + duration ≤ CLINIC_END).
 */
export function getValidDurations(startTime: string): Duration[] {
  const startMin = toMinutes(startTime);
  const endMin = toMinutes(CLINIC_END);
  return DURATIONS.filter((d) => startMin + d <= endMin);
}

/**
 * Returns true if [aStart, aEnd) and [bStart, bEnd) overlap.
 * Half-open intervals: back-to-back bookings (aEnd === bStart) do NOT overlap.
 */
export function checkOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
): boolean {
  return (
    toMinutes(aStart) < toMinutes(bEnd) && toMinutes(aEnd) > toMinutes(bStart)
  );
}

/** Formats a Date to "YYYY-MM-DD" using local time. */
export function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Returns today's date as "YYYY-MM-DD" in local time. */
export function today(): string {
  return toDateString(new Date());
}

/**
 * Returns the next 30 calendar days starting from today as "YYYY-MM-DD" strings.
 */
export function getBookableDates(): string[] {
  const base = new Date();
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    return toDateString(d);
  });
}
