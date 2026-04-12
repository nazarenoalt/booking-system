import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BookingForm } from './BookingForm'
import type { Booking } from '@/core/models/booking.types'

// ---------------------------------------------------------------------------
// Mock next/navigation
// ---------------------------------------------------------------------------

const mockPush = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

// ---------------------------------------------------------------------------
// Mock Radix-based Select with a plain <select> element.
// The real Radix Select relies on pointer events and portals that do not work
// reliably in jsdom. This mock preserves the exact prop contract
// (value / onValueChange / disabled / children) so the component under test
// behaves identically — only the DOM representation changes.
// ---------------------------------------------------------------------------

// The BookingForm passes `id` to SelectTrigger, not to Select. We use a
// context to propagate that id from SelectTrigger up to the wrapping Select
// so the rendered <select> element receives the correct `id` and can be
// found via its associated <label for="..."> in tests.
vi.mock('@/components/ui/select', async () => {
  const { createContext, useContext, useState } = await import('react')

  const IdContext = createContext<(id: string) => void>(() => {})

  const Select = ({
    value,
    onValueChange,
    disabled,
    children,
  }: {
    value?: string
    onValueChange?: (v: string) => void
    disabled?: boolean
    children?: React.ReactNode
  }) => {
    const [triggerId, setTriggerId] = useState<string | undefined>(undefined)
    return (
      <IdContext.Provider value={setTriggerId}>
        <select
          id={triggerId}
          value={value}
          onChange={(e) => onValueChange?.(e.target.value)}
          disabled={disabled}
        >
          {children}
        </select>
      </IdContext.Provider>
    )
  }

  const SelectTrigger = ({ children, id }: { children?: React.ReactNode; id?: string }) => {
    const register = useContext(IdContext)
    if (id) register(id)
    return null
  }

  const SelectValue = () => null

  const SelectContent = ({ children }: { children?: React.ReactNode }) => (
    <>{children}</>
  )

  const SelectItem = ({
    value,
    children,
  }: {
    value: string
    children?: React.ReactNode
  }) => <option value={value}>{children}</option>

  return { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }
})

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const BOOKABLE_DATES = ['2026-04-14', '2026-04-15', '2026-04-16']

const EXISTING_BOOKING: Booking = {
  id: 'abc-123',
  name: 'Jane Doe',
  reason: 'Back pain',
  date: '2026-04-14',
  startTime: '10:00',
  endTime: '10:30',
  duration: 30,
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
// Helpers
// ---------------------------------------------------------------------------

function renderCreateForm() {
  return render(<BookingForm bookableDates={BOOKABLE_DATES} />)
}

function renderEditForm(booking = EXISTING_BOOKING) {
  return render(<BookingForm bookableDates={BOOKABLE_DATES} booking={booking} />)
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('BookingForm', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    global.fetch = vi.fn()
  })

  // -------------------------------------------------------------------------
  // Create mode
  // -------------------------------------------------------------------------

  describe('create mode (no booking prop)', () => {
    describe('rendering', () => {
      it('renders name field', () => {
        renderCreateForm()
        expect(screen.getByLabelText('Name')).toBeInTheDocument()
      })

      it('renders reason field', () => {
        renderCreateForm()
        expect(screen.getByLabelText('Reason')).toBeInTheDocument()
      })

      it('renders date select', () => {
        renderCreateForm()
        expect(screen.getByLabelText('Date')).toBeInTheDocument()
      })

      it('renders start time select', () => {
        renderCreateForm()
        expect(screen.getByLabelText('Start Time')).toBeInTheDocument()
      })

      it('renders duration select', () => {
        renderCreateForm()
        expect(screen.getByLabelText('Duration')).toBeInTheDocument()
      })

      it('renders Book Appointment submit button', () => {
        renderCreateForm()
        expect(screen.getByRole('button', { name: 'Book Appointment' })).toBeInTheDocument()
      })
    })

    describe('validation', () => {
      it('shows name field error when name is empty on submit', async () => {
        renderCreateForm()
        await userEvent.type(screen.getByLabelText('Reason'), 'Some reason')
        await userEvent.click(screen.getByRole('button', { name: 'Book Appointment' }))
        expect(screen.getByRole('alert')).toHaveTextContent('Name is required.')
      })

      it('shows reason field error when reason is empty on submit', async () => {
        renderCreateForm()
        await userEvent.type(screen.getByLabelText('Name'), 'John Smith')
        await userEvent.click(screen.getByRole('button', { name: 'Book Appointment' }))
        expect(screen.getByRole('alert')).toHaveTextContent('Reason is required.')
      })

      it('does not call fetch when validation fails', async () => {
        renderCreateForm()
        await userEvent.click(screen.getByRole('button', { name: 'Book Appointment' }))
        expect(fetch).not.toHaveBeenCalled()
      })
    })

    describe('successful submission', () => {
      it('calls POST /api/bookings with correct payload', async () => {
        vi.mocked(fetch).mockResolvedValueOnce(makeOkResponse(201))
        renderCreateForm()

        await userEvent.type(screen.getByLabelText('Name'), 'John Smith')
        await userEvent.type(screen.getByLabelText('Reason'), 'Knee pain')
        await userEvent.click(screen.getByRole('button', { name: 'Book Appointment' }))

        expect(fetch).toHaveBeenCalledOnce()
        const [url, options] = vi.mocked(fetch).mock.calls[0]
        expect(url).toBe('/api/bookings')
        expect(options?.method).toBe('POST')
        const body = JSON.parse(options?.body as string)
        expect(body).toMatchObject({
          name: 'John Smith',
          reason: 'Knee pain',
          date: BOOKABLE_DATES[0],
          duration: 30,
        })
        expect(typeof body.startTime).toBe('string')
        expect(body.startTime).toMatch(/^\d{2}:\d{2}$/)
      })

      it('navigates to / on 201 response', async () => {
        vi.mocked(fetch).mockResolvedValueOnce(makeOkResponse(201))
        renderCreateForm()

        await userEvent.type(screen.getByLabelText('Name'), 'John Smith')
        await userEvent.type(screen.getByLabelText('Reason'), 'Knee pain')
        await userEvent.click(screen.getByRole('button', { name: 'Book Appointment' }))

        expect(mockPush).toHaveBeenCalledWith('/')
      })
    })

    describe('error handling', () => {
      it('displays API error message on 422 response', async () => {
        vi.mocked(fetch).mockResolvedValueOnce(
          makeErrorResponse(422, 'Time slot is already booked.'),
        )
        renderCreateForm()

        await userEvent.type(screen.getByLabelText('Name'), 'John Smith')
        await userEvent.type(screen.getByLabelText('Reason'), 'Knee pain')
        await userEvent.click(screen.getByRole('button', { name: 'Book Appointment' }))

        expect(screen.getByRole('alert')).toHaveTextContent('Time slot is already booked.')
      })

      it('does not navigate on 422 response', async () => {
        vi.mocked(fetch).mockResolvedValueOnce(
          makeErrorResponse(422, 'Time slot is already booked.'),
        )
        renderCreateForm()

        await userEvent.type(screen.getByLabelText('Name'), 'John Smith')
        await userEvent.type(screen.getByLabelText('Reason'), 'Knee pain')
        await userEvent.click(screen.getByRole('button', { name: 'Book Appointment' }))

        expect(mockPush).not.toHaveBeenCalled()
      })

      it('displays generic error message on non-ok response without error field', async () => {
        vi.mocked(fetch).mockResolvedValueOnce(
          new Response('{}', { status: 500, headers: { 'Content-Type': 'application/json' } }),
        )
        renderCreateForm()

        await userEvent.type(screen.getByLabelText('Name'), 'John Smith')
        await userEvent.type(screen.getByLabelText('Reason'), 'Knee pain')
        await userEvent.click(screen.getByRole('button', { name: 'Book Appointment' }))

        expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong. Please try again.')
      })

      it('displays network error message when fetch rejects', async () => {
        vi.mocked(fetch).mockRejectedValueOnce(new Error('Network failure'))
        renderCreateForm()

        await userEvent.type(screen.getByLabelText('Name'), 'John Smith')
        await userEvent.type(screen.getByLabelText('Reason'), 'Knee pain')
        await userEvent.click(screen.getByRole('button', { name: 'Book Appointment' }))

        expect(screen.getByRole('alert')).toHaveTextContent(
          'Network error. Please check your connection and try again.',
        )
      })
    })
  })

  // -------------------------------------------------------------------------
  // Edit mode
  // -------------------------------------------------------------------------

  describe('edit mode (booking prop provided)', () => {
    describe('rendering', () => {
      it('renders name field', () => {
        renderEditForm()
        expect(screen.getByLabelText('Name')).toBeInTheDocument()
      })

      it('renders reason field', () => {
        renderEditForm()
        expect(screen.getByLabelText('Reason')).toBeInTheDocument()
      })

      it('renders duration select', () => {
        renderEditForm()
        expect(screen.getByLabelText('Duration')).toBeInTheDocument()
      })

      it('does not render date select — shows read-only date text instead', () => {
        renderEditForm()
        // In edit mode the date select is replaced by a plain <p> element.
        // The label has no htmlFor so we query by text content.
        expect(screen.getByText(EXISTING_BOOKING.date)).toBeInTheDocument()
        // No <select> with id="date" should exist.
        expect(document.getElementById('date')).toBeNull()
      })

      it('does not render start time select — shows read-only start time text instead', () => {
        renderEditForm()
        expect(screen.getByText(EXISTING_BOOKING.startTime)).toBeInTheDocument()
        expect(document.getElementById('startTime')).toBeNull()
      })

      it('pre-populates name field with booking name', () => {
        renderEditForm()
        expect(screen.getByLabelText('Name')).toHaveValue(EXISTING_BOOKING.name)
      })

      it('pre-populates reason field with booking reason', () => {
        renderEditForm()
        expect(screen.getByLabelText('Reason')).toHaveValue(EXISTING_BOOKING.reason)
      })

      it('renders Save Changes submit button', () => {
        renderEditForm()
        expect(screen.getByRole('button', { name: 'Save Changes' })).toBeInTheDocument()
      })
    })

    describe('successful submission', () => {
      it('calls PUT /api/bookings/:id with name, reason, duration only', async () => {
        vi.mocked(fetch).mockResolvedValueOnce(makeOkResponse(200))
        renderEditForm()

        const nameInput = screen.getByLabelText('Name')
        await userEvent.clear(nameInput)
        await userEvent.type(nameInput, 'Updated Name')

        const reasonInput = screen.getByLabelText('Reason')
        await userEvent.clear(reasonInput)
        await userEvent.type(reasonInput, 'Updated reason')

        await userEvent.click(screen.getByRole('button', { name: 'Save Changes' }))

        expect(fetch).toHaveBeenCalledOnce()
        const [url, options] = vi.mocked(fetch).mock.calls[0]
        expect(url).toBe(`/api/bookings/${EXISTING_BOOKING.id}`)
        expect(options?.method).toBe('PUT')
        const body = JSON.parse(options?.body as string)
        expect(body).toEqual({ name: 'Updated Name', reason: 'Updated reason', duration: 30 })
        // date and startTime must NOT be in the PUT payload
        expect(body).not.toHaveProperty('date')
        expect(body).not.toHaveProperty('startTime')
      })

      it('navigates to / on successful PUT', async () => {
        vi.mocked(fetch).mockResolvedValueOnce(makeOkResponse(200))
        renderEditForm()

        await userEvent.click(screen.getByRole('button', { name: 'Save Changes' }))

        expect(mockPush).toHaveBeenCalledWith('/')
      })
    })

    describe('validation in edit mode', () => {
      it('shows name error when name is cleared before submit', async () => {
        renderEditForm()
        const nameInput = screen.getByLabelText('Name')
        await userEvent.clear(nameInput)
        await userEvent.click(screen.getByRole('button', { name: 'Save Changes' }))
        expect(screen.getByRole('alert')).toHaveTextContent('Name is required.')
      })

      it('shows reason error when reason is cleared before submit', async () => {
        renderEditForm()
        const reasonInput = screen.getByLabelText('Reason')
        await userEvent.clear(reasonInput)
        await userEvent.click(screen.getByRole('button', { name: 'Save Changes' }))
        expect(screen.getByRole('alert')).toHaveTextContent('Reason is required.')
      })
    })
  })
})
