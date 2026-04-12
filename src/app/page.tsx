import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BookingList } from "@/components/BookingList";
import { DateSelector } from "@/components/DateSelector";
import { bookingService } from "@/core/services/BookingService";
import { today, getBookableDates } from "@/core/utils/time";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const bookableDates = getBookableDates();
  const { date: rawDate } = await searchParams;
  const date =
    rawDate && bookableDates.includes(rawDate) ? rawDate : today();

  const bookings = await bookingService.getBookingsForDate(date);

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Appointments</h1>
        <Button asChild>
          <Link href="/bookings/new">Book Appointment</Link>
        </Button>
      </div>

      <DateSelector selectedDate={date} bookableDates={bookableDates} />

      <BookingList key={date} initialBookings={bookings} />
    </main>
  );
}
