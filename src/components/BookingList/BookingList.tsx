'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Booking } from '@/core/models/booking.types'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ErrorMessage } from '@/components/ui/ErrorMessage'

interface BookingListProps {
  initialBookings: Booking[]
}

export function BookingList({ initialBookings }: BookingListProps) {
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>(initialBookings)
  const [pendingCancelId, setPendingCancelId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const bookingPendingCancel = bookings.find((b) => b.id === pendingCancelId) ?? null

  async function handleConfirmCancel() {
    if (!pendingCancelId) return

    setError(null)

    try {
      const res = await fetch(`/api/bookings/${pendingCancelId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        let message = 'Failed to cancel booking.'
        try {
          const body = await res.json()
          if (typeof body?.error === 'string') message = body.error
        } catch {
          // ignore parse failure, keep default message
        }
        setError(message)
        setPendingCancelId(null)
        return
      }

      setBookings((prev) => prev.filter((b) => b.id !== pendingCancelId))
      setPendingCancelId(null)
      router.refresh()
    } catch {
      setError('An unexpected error occurred. Please try again.')
      setPendingCancelId(null)
    }
  }

  function handleCancelDialog() {
    setPendingCancelId(null)
  }

  if (bookings.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No bookings for this day.</p>
    )
  }

  return (
    <>
      <ErrorMessage message={error} />

      <ul className="flex flex-col gap-3">
        {bookings.map((booking) => (
          <li key={booking.id}>
            <Card>
              <CardHeader>
                <CardTitle>{booking.name}</CardTitle>
                <CardDescription>{booking.reason}</CardDescription>
                <CardAction>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" asChild size="sm">
                      <Link href={`/bookings/${booking.id}/edit`}>Edit</Link>
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setError(null)
                        setPendingCancelId(booking.id)
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardAction>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {booking.startTime}–{booking.endTime} &middot; {booking.date}
                </p>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={pendingCancelId !== null}
        message={
          bookingPendingCancel
            ? `Cancel booking for ${bookingPendingCancel.name}?`
            : ''
        }
        onConfirm={handleConfirmCancel}
        onCancel={handleCancelDialog}
      />
    </>
  )
}
