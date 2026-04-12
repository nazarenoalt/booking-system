import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/core/utils/time', () => ({
  getBookableDates: vi.fn(),
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

import NewBookingPage from './page'
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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('NewBookingPage', () => {
  beforeEach(() => {
    vi.mocked(getBookableDates).mockReturnValue(BOOKABLE_DATES)
  })

  it('renders BookingForm with the bookable dates returned by getBookableDates', async () => {
    const tree = await NewBookingPage()

    const el = findElement(tree, BookingForm)
    expect(el).toBeDefined()
    expect((el!.props as { bookableDates: string[] }).bookableDates).toEqual(BOOKABLE_DATES)
  })

  it('passes an empty array to BookingForm when getBookableDates returns no dates', async () => {
    vi.mocked(getBookableDates).mockReturnValue([])

    const tree = await NewBookingPage()

    const el = findElement(tree, BookingForm)
    expect(el).toBeDefined()
    expect((el!.props as { bookableDates: string[] }).bookableDates).toEqual([])
  })
})
