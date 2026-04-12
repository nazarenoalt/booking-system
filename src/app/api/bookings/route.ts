import type { NextRequest } from "next/server";
import { bookingService } from "@/core/services/BookingService";
import type { Duration } from "@/core/models/booking.types";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  if (!date) {
    return Response.json(
      { error: "Missing query parameter: date" },
      { status: 400 },
    );
  }

  try {
    const bookings = await bookingService.getBookingsForDate(date);
    return Response.json(bookings);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return Response.json({ error: message }, { status: 422 });
  }
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return Response.json(
      { error: "Request body must be a JSON object" },
      { status: 400 },
    );
  }

  const { name, reason, date, startTime, duration } = body as Record<
    string,
    unknown
  >;

  try {
    const booking = await bookingService.createBooking({
      id: "", // service compute this
      name: name as string,
      reason: reason as string,
      date: date as string,
      startTime: startTime as string,
      endTime: "", // service compute this
      duration: duration as Duration,
    });

    return Response.json(booking, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return Response.json({ error: message }, { status: 422 });
  }
}
