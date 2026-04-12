import type { Booking, Duration } from '@/core/models/booking.types'

export interface BookingFormProps {
  bookableDates: string[] // from getBookableDates(), passed by the page
  booking?: Booking // undefined = create mode, defined = edit mode
}

export interface FormData {
  name: string
  reason: string
  date: string
  startTime: string
  duration: Duration
}

export interface FieldErrors {
  name?: string
  reason?: string
}
