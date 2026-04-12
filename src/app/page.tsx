import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BookingList } from "@/components/BookingList";
import { bookingService } from "@/core/services/BookingService";
import { today } from "@/core/utils/time";

function formatHeadingDate(dateString: string): string {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function HomePage() {
  const date = today();
  const bookings = await bookingService.getBookingsForDate(date);

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">
          Appointments &mdash; {formatHeadingDate(date)}
        </h1>
        <Button asChild>
          <Link href="/bookings/new">Book Appointment</Link>
        </Button>
      </div>

      <BookingList initialBookings={bookings} />
    </main>
  );
}
