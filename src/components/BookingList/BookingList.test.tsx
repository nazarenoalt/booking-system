import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BookingList } from './BookingList'
import type { Booking } from '@/core/models/booking.types'

// ---------------------------------------------------------------------------
// Mock next/navigation
// ---------------------------------------------------------------------------

const mockPush = vi.fn()
const mockRefresh = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}))

// ---------------------------------------------------------------------------
// Mock next/link with a plain <a> element
// ---------------------------------------------------------------------------

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}))

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const BOOKING_A: Booking = {
  id: 'booking-1',
  name: 'Alice Smith',
  reason: 'Back pain',
  date: '2026-04-14',
  startTime: '09:00',
  endTime: '09:30',
  duration: 30,
}

const BOOKING_B: Booking = {
  id: 'booking-2',
  name: 'Bob Jones',
  reason: 'Knee injury',
  date: '2026-04-14',
  startTime: '10:00',
  endTime: '10:45',
  duration: 45,
}

function makeOkResponse(status = 200) {
  return new Response(JSON.stringify({}), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function makeErrorResponse(status: number, errorMessage: string) {
  return new Response(JSON.stringify({ error: errorMessage }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('BookingList', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    global.fetch = vi.fn()
  })

  // -------------------------------------------------------------------------
  // Rendering
  // -------------------------------------------------------------------------

  describe('rendering', () => {
    it('renders a card for each booking with name, reason, time range, and date', () => {
      render(<BookingList initialBookings={[BOOKING_A, BOOKING_B]} />)

      expect(screen.getByText('Alice Smith')).toBeInTheDocument()
      expect(screen.getByText('Back pain')).toBeInTheDocument()
      expect(screen.getByText('09:00–09:30 · 2026-04-14')).toBeInTheDocument()

      expect(screen.getByText('Bob Jones')).toBeInTheDocument()
      expect(screen.getByText('Knee injury')).toBeInTheDocument()
      expect(screen.getByText('10:00–10:45 · 2026-04-14')).toBeInTheDocument()
    })

    it('renders an Edit link pointing to /bookings/:id/edit for each booking', () => {
      render(<BookingList initialBookings={[BOOKING_A, BOOKING_B]} />)

      const editLinks = screen.getAllByRole('link', { name: 'Edit' })
      expect(editLinks).toHaveLength(2)
      expect(editLinks[0]).toHaveAttribute('href', `/bookings/${BOOKING_A.id}/edit`)
      expect(editLinks[1]).toHaveAttribute('href', `/bookings/${BOOKING_B.id}/edit`)
    })

    it('renders a Cancel button for each booking', () => {
      render(<BookingList initialBookings={[BOOKING_A, BOOKING_B]} />)

      const cancelButtons = screen.getAllByRole('button', { name: 'Cancel' })
      expect(cancelButtons).toHaveLength(2)
    })

    it('shows empty state message when initialBookings is empty', () => {
      render(<BookingList initialBookings={[]} />)

      expect(screen.getByText('No bookings for this day.')).toBeInTheDocument()
    })
  })

  // -------------------------------------------------------------------------
  // Cancel flow
  // -------------------------------------------------------------------------

  describe('cancel flow', () => {
    it('clicking Cancel opens the confirmation dialog with the correct booking name', async () => {
      render(<BookingList initialBookings={[BOOKING_A, BOOKING_B]} />)

      const cancelButtons = screen.getAllByRole('button', { name: 'Cancel' })
      await userEvent.click(cancelButtons[0])

      expect(
        screen.getByText(`Cancel booking for ${BOOKING_A.name}?`),
      ).toBeInTheDocument()
    })

    it('confirming calls DELETE /api/bookings/:id', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(makeOkResponse())
      render(<BookingList initialBookings={[BOOKING_A]} />)

      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
      await userEvent.click(screen.getByRole('button', { name: /confirm/i }))

      expect(fetch).toHaveBeenCalledOnce()
      expect(fetch).toHaveBeenCalledWith(`/api/bookings/${BOOKING_A.id}`, {
        method: 'DELETE',
      })
    })

    it('after successful delete, removes the booking from the list', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(makeOkResponse())
      render(<BookingList initialBookings={[BOOKING_A, BOOKING_B]} />)

      await userEvent.click(screen.getAllByRole('button', { name: 'Cancel' })[0])
      await userEvent.click(screen.getByRole('button', { name: /confirm/i }))

      await waitFor(() => {
        expect(screen.queryByText('Alice Smith')).not.toBeInTheDocument()
      })
      expect(screen.getByText('Bob Jones')).toBeInTheDocument()
    })

    it('after successful delete, calls router.refresh()', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(makeOkResponse())
      render(<BookingList initialBookings={[BOOKING_A]} />)

      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
      await userEvent.click(screen.getByRole('button', { name: /confirm/i }))

      await waitFor(() => {
        expect(mockRefresh).toHaveBeenCalledOnce()
      })
    })

    it('canceling the dialog does not call fetch', async () => {
      render(<BookingList initialBookings={[BOOKING_A]} />)

      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))

      // There are now two Cancel buttons: the booking card one and the dialog one.
      // Click the dialog Cancel button (the one inside the dialog).
      const dialogCancelButton = screen.getAllByRole('button', { name: /cancel/i }).find(
        (btn) => btn.closest('[role="dialog"]'),
      )
      await userEvent.click(dialogCancelButton!)

      expect(fetch).not.toHaveBeenCalled()
    })

    it('on DELETE error (non-ok response), shows error message', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        makeErrorResponse(500, 'Something went wrong on the server.'),
      )
      render(<BookingList initialBookings={[BOOKING_A]} />)

      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
      await userEvent.click(screen.getByRole('button', { name: /confirm/i }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(
          'Something went wrong on the server.',
        )
      })
    })

    it('on DELETE non-ok response without error field, shows default error message', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        new Response('{}', { status: 500, headers: { 'Content-Type': 'application/json' } }),
      )
      render(<BookingList initialBookings={[BOOKING_A]} />)

      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
      await userEvent.click(screen.getByRole('button', { name: /confirm/i }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Failed to cancel booking.')
      })
    })

    it('on network error, shows error message', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network failure'))
      render(<BookingList initialBookings={[BOOKING_A]} />)

      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
      await userEvent.click(screen.getByRole('button', { name: /confirm/i }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(
          'An unexpected error occurred. Please try again.',
        )
      })
    })
  })
})
