import { describe, it, expect, beforeEach } from "vitest";
import { bookingRepository } from "@/core/repositories/InMemoryBookingRepository";
import { GET, POST } from "@/app/api/bookings/route";

const BASE_URL = "http://localhost/api/bookings";

// bookingService singleton shares the same module-level store as bookingRepository,
// so clearing bookingRepository resets the state for every test.

describe("GET /api/bookings", () => {
  beforeEach(() => {
    bookingRepository.clear();
  });

  it("returns 400 when the date query param is missing", async () => {
    const req = new Request(BASE_URL);
    const res = await GET(req as never);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/date/i);
  });

  it("returns 200 with an empty array when no bookings exist for the date", async () => {
    const req = new Request(`${BASE_URL}?date=2026-05-01`);
    const res = await GET(req as never);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  it("returns bookings for the requested date", async () => {
    // Seed a booking via POST so the data flows through the real service
    await POST(
      new Request(BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Alice",
          reason: "Back pain",
          date: "2026-05-01",
          startTime: "09:00",
          duration: 30,
        }),
      }) as never,
    );

    const req = new Request(`${BASE_URL}?date=2026-05-01`);
    const res = await GET(req as never);
    expect(res.status).toBe(200);
    const bookings = await res.json();
    expect(bookings).toHaveLength(1);
    expect(bookings[0].startTime).toBe("09:00");
  });
});

describe("POST /api/bookings", () => {
  beforeEach(() => {
    bookingRepository.clear();
  });

  it("returns 201 with the created booking on a valid request", async () => {
    const req = new Request(BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Alice",
        reason: "Back pain",
        date: "2026-05-01",
        startTime: "09:00",
        duration: 30,
      }),
    });
    const res = await POST(req as never);
    expect(res.status).toBe(201);
    const booking = await res.json();
    expect(booking.id).toBeTruthy();
    expect(booking.endTime).toBe("09:30");
    expect(booking.name).toBe("Alice");
  });

  it("returns 400 when the body is not valid JSON", async () => {
    const req = new Request(BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-json",
    });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/invalid json/i);
  });

  it("returns 400 when the body is a JSON array instead of an object", async () => {
    const req = new Request(BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([]),
    });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
  });

  it("returns 422 when required fields are missing", async () => {
    const req = new Request(BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "", reason: "", date: "2026-05-01", startTime: "09:00", duration: 30 }),
    });
    const res = await POST(req as never);
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });

  it("returns 422 when duration is invalid", async () => {
    const req = new Request(BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Alice",
        reason: "Back pain",
        date: "2026-05-01",
        startTime: "09:00",
        duration: 99,
      }),
    });
    const res = await POST(req as never);
    expect(res.status).toBe(422);
  });
});
