import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import type { Booking } from '@/core/models/booking.types'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/core/services/BookingService', () => ({
  bookingService: {
    getBookingById: vi.fn(),
  },
}))

vi.mock('@/core/utils/time', () => ({
  getBookableDates: vi.fn(),
}))

const mockNotFound = vi.hoisted(() => vi.fn(() => { throw new Error('NEXT_NOT_FOUND') }))

vi.mock('next/navigation', () => ({
  notFound: mockNotFound,
}))

vi.mock('@/components/BookingForm', () => ({
  BookingForm: (props: unknown) => null,
}))

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}))

// ---------------------------------------------------------------------------
// Imports after mocks
// ---------------------------------------------------------------------------

import EditBookingPage from './page'
import { bookingService } from '@/core/services/BookingService'
import { getBookableDates } from '@/core/utils/time'
import { BookingForm } from '@/components/BookingForm'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function findElement(
  node: React.ReactNode,
  type: React.ElementType,
): React.ReactElement | undefined {
  if (!React.isValidElement(node)) return undefined
  if (node.type === type) return node
  const children = (node.props as { children?: React.ReactNode }).children
  if (!children) return undefined
  const kids = Array.isArray(children) ? children : [children]
  for (const child of kids) {
    const found = findElement(child, type)
    if (found) return found
  }
  return undefined
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const BOOKABLE_DATES = ['2026-04-12', '2026-04-13', '2026-04-14']

const BOOKING: Booking = {
  id: 'booking-42',
  name: 'Alice Smith',
  reason: 'Back pain',
  date: '2026-04-12',
  startTime: '09:00',
  endTime: '09:30',
  duration: 30,
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('EditBookingPage', () => {
  beforeEach(() => {
    vi.mocked(getBookableDates).mockReturnValue(BOOKABLE_DATES)
    mockNotFound.mockReset()
  })

  describe('when the booking exists', () => {
    beforeEach(() => {
      vi.mocked(bookingService.getBookingById).mockResolvedValue(BOOKING)
    })

    it('calls getBookingById with the id from params', async () => {
      await EditBookingPage({ params: Promise.resolve({ id: 'booking-42' }) })

      expect(bookingService.getBookingById).toHaveBeenCalledOnce()
      expect(bookingService.getBookingById).toHaveBeenCalledWith('booking-42')
    })

    it('renders BookingForm with the booking and bookable dates', async () => {
      const tree = await EditBookingPage({ params: Promise.resolve({ id: 'booking-42' }) })

      const el = findElement(tree, BookingForm)
      expect(el).toBeDefined()

      const props = el!.props as { booking: Booking; bookableDates: string[] }
      expect(props.booking).toEqual(BOOKING)
      expect(props.bookableDates).toEqual(BOOKABLE_DATES)
    })

    it('does not call notFound', async () => {
      await EditBookingPage({ params: Promise.resolve({ id: 'booking-42' }) })

      expect(mockNotFound).not.toHaveBeenCalled()
    })
  })

  describe('when the booking does not exist', () => {
    beforeEach(() => {
      vi.mocked(bookingService.getBookingById).mockResolvedValue(null)
    })

    it('calls notFound()', async () => {
      await expect(
        EditBookingPage({ params: Promise.resolve({ id: 'nonexistent' }) })
      ).rejects.toThrow('NEXT_NOT_FOUND')

      expect(mockNotFound).toHaveBeenCalledOnce()
    })

    it('does not render BookingForm', async () => {
      await expect(
        EditBookingPage({ params: Promise.resolve({ id: 'nonexistent' }) })
      ).rejects.toThrow('NEXT_NOT_FOUND')
    })
  })
})
