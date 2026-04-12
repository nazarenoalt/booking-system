import { describe, it, expect, beforeEach } from "vitest";
import { bookingRepository } from "@/core/repositories/InMemoryBookingRepository";
import { bookingService } from "@/core/services/BookingService";
import { GET, PUT, DELETE } from "@/app/api/bookings/[id]/route";
import type { Booking } from "@/core/models/booking.types";

const BASE_URL = "http://localhost/api/bookings";

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

async function seedBooking(overrides: Partial<Omit<Booking, "id" | "endTime">> = {}): Promise<Booking> {
  return bookingService.createBooking({
    id: "",
    name: "Alice",
    reason: "Back pain",
    date: "2026-05-01",
    startTime: "09:00",
    endTime: "",
    duration: 30,
    ...overrides,
  });
}

describe("GET /api/bookings/[id]", () => {
  beforeEach(() => {
    bookingRepository.clear();
  });

  it("returns 404 for an unknown id", async () => {
    const req = new Request(`${BASE_URL}/ghost`);
    const res = await GET(req as never, makeParams("ghost"));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toMatch(/not found/i);
  });

  it("returns 200 with the booking for a known id", async () => {
    const created = await seedBooking();
    const req = new Request(`${BASE_URL}/${created.id}`);
    const res = await GET(req as never, makeParams(created.id));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe(created.id);
    expect(body.name).toBe("Alice");
  });
});

describe("PUT /api/bookings/[id]", () => {
  beforeEach(() => {
    bookingRepository.clear();
  });

  it("returns 422 for an unknown id", async () => {
    const req = new Request(`${BASE_URL}/ghost`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Bob" }),
    });
    const res = await PUT(req as never, makeParams("ghost"));
    expect(res.status).toBe(422);
  });

  it("updates the booking and returns the updated resource", async () => {
    const created = await seedBooking();
    const req = new Request(`${BASE_URL}/${created.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Bob" }),
    });
    const res = await PUT(req as never, makeParams(created.id));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.name).toBe("Bob");
    expect(body.reason).toBe("Back pain");
  });

  it("returns 400 when body is invalid JSON", async () => {
    const created = await seedBooking();
    const req = new Request(`${BASE_URL}/${created.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: "not-json",
    });
    const res = await PUT(req as never, makeParams(created.id));
    expect(res.status).toBe(400);
  });

  it("returns 422 when the update would create an overlap", async () => {
    await seedBooking({ startTime: "09:00", duration: 30 });
    const second = await seedBooking({ startTime: "10:00", duration: 30 });
    const req = new Request(`${BASE_URL}/${second.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startTime: "09:00" }),
    });
    const res = await PUT(req as never, makeParams(second.id));
    expect(res.status).toBe(422);
  });
});

describe("DELETE /api/bookings/[id]", () => {
  beforeEach(() => {
    bookingRepository.clear();
  });

  it("returns 204 after successfully deleting a booking", async () => {
    const created = await seedBooking();
    const req = new Request(`${BASE_URL}/${created.id}`, { method: "DELETE" });
    const res = await DELETE(req as never, makeParams(created.id));
    expect(res.status).toBe(204);
  });

  it("returns 422 for an unknown id", async () => {
    const req = new Request(`${BASE_URL}/ghost`, { method: "DELETE" });
    const res = await DELETE(req as never, makeParams("ghost"));
    expect(res.status).toBe(422);
  });

  it("booking is no longer retrievable after deletion", async () => {
    const created = await seedBooking();
    await DELETE(
      new Request(`${BASE_URL}/${created.id}`, { method: "DELETE" }) as never,
      makeParams(created.id),
    );
    expect(await bookingService.getBookingById(created.id)).toBeNull();
  });
});
