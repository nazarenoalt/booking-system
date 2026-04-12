'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import type { Booking, Duration } from '@/core/models/booking.types'
import { getStartSlots, getValidDurations } from '@/core/utils/time'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ErrorMessage } from '@/components/ui/ErrorMessage'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BookingFormProps {
  bookableDates: string[] // from getBookableDates(), passed by the page
  booking?: Booking // undefined = create mode, defined = edit mode
}

interface FieldErrors {
  name?: string
  reason?: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DURATIONS: Duration[] = [30, 45, 60]

function getInitialDuration(booking?: Booking): Duration {
  return booking?.duration ?? 30
}

function getInitialStartTime(booking?: Booking, duration?: Duration): string {
  if (booking) return booking.startTime
  const slots = getStartSlots(duration ?? 30)
  return slots[0] ?? '09:00'
}

function getInitialDate(booking?: Booking, bookableDates?: string[]): string {
  if (booking) return booking.date
  return bookableDates?.[0] ?? ''
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BookingForm({ bookableDates, booking }: BookingFormProps) {
  const isEditMode = booking !== undefined
  const router = useRouter()

  // --- Form state ---
  const [name, setName] = useState(booking?.name ?? '')
  const [reason, setReason] = useState(booking?.reason ?? '')
  const [date, setDate] = useState(() => getInitialDate(booking, bookableDates))
  const [duration, setDuration] = useState<Duration>(() =>
    getInitialDuration(booking),
  )
  const [startTime, setStartTime] = useState(() =>
    getInitialStartTime(booking, getInitialDuration(booking)),
  )

  // --- UI state ---
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // --- Derived slot/duration lists (re-computed on every render from current state) ---
  const availableSlots = getStartSlots(duration)
  const validDurations = getValidDurations(startTime)

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  function handleDurationChange(value: string) {
    const newDuration = Number(value) as Duration
    setDuration(newDuration)

    // If the current startTime is no longer valid for the new duration, reset
    // to the first valid slot.
    const newSlots = getStartSlots(newDuration)
    if (!newSlots.includes(startTime)) {
      setStartTime(newSlots[0] ?? '09:00')
    }
  }

  function handleStartTimeChange(value: string) {
    setStartTime(value)

    // If the current duration is no longer valid for the new startTime, reset
    // to the first valid duration.
    const newValidDurations = getValidDurations(value)
    if (!newValidDurations.includes(duration)) {
      setDuration(newValidDurations[0] ?? 30)
    }
  }

  function validate(): boolean {
    const errors: FieldErrors = {}
    if (!name.trim()) errors.name = 'Name is required.'
    if (!reason.trim()) errors.reason = 'Reason is required.'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setApiError(null)

    if (!validate()) return

    setIsSubmitting(true)

    try {
      let response: Response

      if (isEditMode) {
        response = await fetch(`/api/bookings/${booking.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, reason, duration }),
        })
      } else {
        response = await fetch('/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, reason, date, startTime, duration }),
        })
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setApiError(data.error ?? 'Something went wrong. Please try again.')
        return
      }

      router.push('/')
    } catch {
      setApiError('Network error. Please check your connection and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">

      {/* Name */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            if (fieldErrors.name) setFieldErrors((p) => ({ ...p, name: undefined }))
          }}
          placeholder="Your full name"
          aria-invalid={!!fieldErrors.name}
          disabled={isSubmitting}
        />
        <ErrorMessage message={fieldErrors.name} />
      </div>

      {/* Reason */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="reason">Reason</Label>
        <Input
          id="reason"
          value={reason}
          onChange={(e) => {
            setReason(e.target.value)
            if (fieldErrors.reason) setFieldErrors((p) => ({ ...p, reason: undefined }))
          }}
          placeholder="Reason for your visit"
          aria-invalid={!!fieldErrors.reason}
          disabled={isSubmitting}
        />
        <ErrorMessage message={fieldErrors.reason} />
      </div>

      {isEditMode ? (
        /* Edit mode: date and start time are read-only */
        <>
          <div className="flex flex-col gap-1.5">
            <Label>Date</Label>
            <p className="text-sm text-muted-foreground">{booking.date}</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Start Time</Label>
            <p className="text-sm text-muted-foreground">{booking.startTime}</p>
          </div>
        </>
      ) : (
        /* Create mode: date and start time are interactive */
        <>
          {/* Date */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="date">Date</Label>
            <Select value={date} onValueChange={setDate} disabled={isSubmitting}>
              <SelectTrigger id="date" className="w-full">
                <SelectValue placeholder="Select a date" />
              </SelectTrigger>
              <SelectContent>
                {bookableDates.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Start Time */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="startTime">Start Time</Label>
            <Select
              value={startTime}
              onValueChange={handleStartTimeChange}
              disabled={isSubmitting}
            >
              <SelectTrigger id="startTime" className="w-full">
                <SelectValue placeholder="Select a start time" />
              </SelectTrigger>
              <SelectContent>
                {availableSlots.map((slot) => (
                  <SelectItem key={slot} value={slot}>
                    {slot}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {/* Duration */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="duration">Duration</Label>
        <Select
          value={String(duration)}
          onValueChange={handleDurationChange}
          disabled={isSubmitting}
        >
          <SelectTrigger id="duration" className="w-full">
            <SelectValue placeholder="Select duration" />
          </SelectTrigger>
          <SelectContent>
            {(isEditMode ? DURATIONS : validDurations).map((d) => (
              <SelectItem key={d} value={String(d)}>
                {d} min
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* API error */}
      <ErrorMessage message={apiError} />

      {/* Submit */}
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Saving…' : isEditMode ? 'Save Changes' : 'Book Appointment'}
      </Button>
    </form>
  )
}
