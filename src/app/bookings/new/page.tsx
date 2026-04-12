import Link from 'next/link'
import { BookingForm } from '@/components/BookingForm'
import { getBookableDates } from '@/core/utils/time'

export default async function NewBookingPage() {
  const bookableDates = getBookableDates()

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10 flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
        >
          &larr; Back
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">New Appointment</h1>
      </div>

      <BookingForm bookableDates={bookableDates} />
    </main>
  )
}
