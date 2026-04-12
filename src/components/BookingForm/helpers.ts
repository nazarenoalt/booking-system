import type { Booking, Duration } from '@/core/models/booking.types'
import { getStartSlots } from '@/core/utils/time'

export const DURATIONS: Duration[] = [30, 45, 60]

export function getInitialDuration(booking?: Booking): Duration {
  return booking?.duration ?? 30
}

export function getInitialStartTime(booking?: Booking, duration?: Duration): string {
  if (booking) return booking.startTime
  const slots = getStartSlots(duration ?? 30)
  return slots[0] ?? '09:00'
}

export function getInitialDate(booking?: Booking, bookableDates?: string[]): string {
  if (booking) return booking.date
  return bookableDates?.[0] ?? ''
}
