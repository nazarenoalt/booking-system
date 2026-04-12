import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import type { Booking } from '@/core/models/booking.types'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/core/services/BookingService', () => ({
  bookingService: {
    getBookingsForDate: vi.fn(),
  },
}))

vi.mock('@/core/utils/time', () => ({
  today: vi.fn(),
  getBookableDates: vi.fn(() => ['2026-04-12']),
}))

vi.mock('@/components/DateSelector', () => ({
  DateSelector: () => null,
}))

vi.mock('@/components/BookingList', () => ({
  BookingList: (props: unknown) => null,
}))

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}))

vi.mock('@/components/ui/button', () => ({
  Button: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
}))

// ---------------------------------------------------------------------------
// Imports after mocks
// ---------------------------------------------------------------------------

import HomePage from './page'
import { bookingService } from '@/core/services/BookingService'
import { today } from '@/core/utils/time'
import { BookingList } from '@/components/BookingList'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Walks a React element tree depth-first and returns the first element whose
 * `type` matches the given component reference.
 */
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

const FIXED_DATE = '2026-04-12'

const BOOKINGS: Booking[] = [
  {
    id: 'b1',
    name: 'Alice Smith',
    reason: 'Back pain',
    date: FIXED_DATE,
    startTime: '09:00',
    endTime: '09:30',
    duration: 30,
  },
  {
    id: 'b2',
    name: 'Bob Jones',
    reason: 'Knee injury',
    date: FIXED_DATE,
    startTime: '10:00',
    endTime: '10:45',
    duration: 45,
  },
]

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('HomePage', () => {
  beforeEach(() => {
    vi.mocked(today).mockReturnValue(FIXED_DATE)
    vi.mocked(bookingService.getBookingsForDate).mockResolvedValue(BOOKINGS)
  })

  const defaultProps = { searchParams: Promise.resolve({}) }

  it("calls getBookingsForDate with today's date", async () => {
    await HomePage(defaultProps)

    expect(bookingService.getBookingsForDate).toHaveBeenCalledOnce()
    expect(bookingService.getBookingsForDate).toHaveBeenCalledWith(FIXED_DATE)
  })

  it('renders BookingList with the bookings returned by the service', async () => {
    const tree = await HomePage(defaultProps)

    const el = findElement(tree, BookingList)
    expect(el).toBeDefined()
    expect((el!.props as { initialBookings: Booking[] }).initialBookings).toEqual(BOOKINGS)
  })

  it('passes an empty array to BookingList when the service returns no bookings', async () => {
    vi.mocked(bookingService.getBookingsForDate).mockResolvedValue([])

    const tree = await HomePage(defaultProps)

    const el = findElement(tree, BookingList)
    expect(el).toBeDefined()
    expect((el!.props as { initialBookings: Booking[] }).initialBookings).toEqual([])
  })
})
