import { describe, it, expect, beforeEach } from "vitest";
import { bookingRepository } from "@/core/repositories/InMemoryBookingRepository";
import { bookingService } from "@/core/services/BookingService";
import type { Booking } from "@/core/models/booking.types";

// The module-level store is shared, so clearing bookingRepository resets
// the same Map that bookingService operates against.

describe("BookingService", () => {
  beforeEach(() => {
    bookingRepository.clear();
  });

  // ── helpers ──────────────────────────────────────────────────────────────

  async function makeBooking(
    overrides: Partial<Omit<Booking, "id" | "endTime">> = {},
  ): Promise<Booking> {
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

  // ── createBooking ─────────────────────────────────────────────────────────

  describe("createBooking", () => {
    it("accepts a valid booking and returns it with a generated id and endTime", async () => {
      const booking = await makeBooking();
      expect(booking.id).toBeTruthy();
      expect(booking.endTime).toBe("09:30");
    });

    it("rejects a missing name", async () => {
      await expect(makeBooking({ name: "" })).rejects.toThrow("Name is required");
    });

    it("rejects a whitespace-only name", async () => {
      await expect(makeBooking({ name: "   " })).rejects.toThrow("Name is required");
    });

    it("rejects a missing reason", async () => {
      await expect(makeBooking({ reason: "" })).rejects.toThrow("Reason is required");
    });

    it("rejects an invalid duration", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await expect(makeBooking({ duration: 20 as any })).rejects.toThrow(
        "Duration must be one of these values: 30, 45, 60 minutes",
      );
    });

    it("rejects a start time not on the 30-min grid", async () => {
      await expect(
        makeBooking({ startTime: "09:15", duration: 30 }),
      ).rejects.toThrow(
        "Time slot 09:15 is not available for a 30-minute booking",
      );
    });

    it("rejects a start time where start + duration exceeds clinic closing time", async () => {
      // 17:30 + 60 min = 18:30 > CLINIC_END (18:00); 17:30 is not in valid slots for 60
      await expect(
        makeBooking({ startTime: "17:30", duration: 60 }),
      ).rejects.toThrow();
    });

    it("rejects a booking that overlaps an existing one", async () => {
      await makeBooking({ startTime: "09:00", duration: 30 });
      await expect(
        makeBooking({ startTime: "09:00", duration: 30 }),
      ).rejects.toThrow("This time slot is already reserved");
    });

    it("computes endTime correctly for duration 45", async () => {
      const booking = await makeBooking({ startTime: "09:00", duration: 45 });
      expect(booking.endTime).toBe("09:45");
    });

    it("computes endTime correctly for duration 60", async () => {
      const booking = await makeBooking({ startTime: "09:00", duration: 60 });
      expect(booking.endTime).toBe("10:00");
    });

    it("allows back-to-back bookings on the same date", async () => {
      await makeBooking({ startTime: "09:00", duration: 30 });
      const second = await makeBooking({ startTime: "09:30", duration: 30 });
      expect(second.startTime).toBe("09:30");
    });
  });

  // ── updateBooking ─────────────────────────────────────────────────────────

  describe("updateBooking", () => {
    it("throws for an unknown id", async () => {
      await expect(
        bookingService.updateBooking("ghost", { name: "Bob" }),
      ).rejects.toThrow('Booking with id "ghost" not found');
    });

    it("updates name without changing other fields", async () => {
      const created = await makeBooking();
      const updated = await bookingService.updateBooking(created.id, { name: "Bob" });
      expect(updated.name).toBe("Bob");
      expect(updated.reason).toBe("Back pain");
    });

    it("updates reason without changing other fields", async () => {
      const created = await makeBooking();
      const updated = await bookingService.updateBooking(created.id, { reason: "Neck pain" });
      expect(updated.reason).toBe("Neck pain");
    });

    it("recomputes endTime when duration changes", async () => {
      const created = await makeBooking({ startTime: "09:00", duration: 30 });
      const updated = await bookingService.updateBooking(created.id, { duration: 60 });
      expect(updated.endTime).toBe("10:00");
      expect(updated.duration).toBe(60);
    });

    it("does not treat the booking as overlapping itself", async () => {
      const created = await makeBooking({ startTime: "09:00", duration: 30 });
      const updated = await bookingService.updateBooking(created.id, { name: "Updated" });
      expect(updated.name).toBe("Updated");
    });

    it("rejects an update that would overlap another booking on the same date", async () => {
      await makeBooking({ startTime: "09:00", duration: 30 });
      const second = await makeBooking({ startTime: "10:00", duration: 30 });
      await expect(
        bookingService.updateBooking(second.id, { startTime: "09:00" }),
      ).rejects.toThrow("This time slot is already reserved");
    });
  });

  // ── deleteBooking ─────────────────────────────────────────────────────────

  describe("deleteBooking", () => {
    it("removes the booking", async () => {
      const created = await makeBooking();
      await bookingService.deleteBooking(created.id);
      expect(await bookingService.getBookingById(created.id)).toBeNull();
    });

    it("propagates not-found error from the repository", async () => {
      await expect(bookingService.deleteBooking("ghost")).rejects.toThrow(
        'Booking with id "ghost" not found',
      );
    });
  });

  // ── getBookingsForDate ────────────────────────────────────────────────────

  describe("getBookingsForDate", () => {
    it("returns an empty array when no bookings exist for the date", async () => {
      expect(await bookingService.getBookingsForDate("2099-01-01")).toEqual([]);
    });

    it("returns bookings sorted by startTime ascending", async () => {
      await makeBooking({ startTime: "11:00", duration: 30 });
      await makeBooking({ startTime: "09:00", duration: 30 });
      await makeBooking({ startTime: "10:00", duration: 30 });
      const results = await bookingService.getBookingsForDate("2026-05-01");
      expect(results.map((b) => b.startTime)).toEqual(["09:00", "10:00", "11:00"]);
    });

    it("does not include bookings from other dates", async () => {
      await makeBooking({ date: "2026-05-01" });
      await makeBooking({ date: "2026-05-02" });
      const results = await bookingService.getBookingsForDate("2026-05-01");
      expect(results).toHaveLength(1);
    });
  });

  // ── getBookingById ────────────────────────────────────────────────────────

  describe("getBookingById", () => {
    it("returns null for an unknown id", async () => {
      expect(await bookingService.getBookingById("nope")).toBeNull();
    });

    it("returns the booking for a known id", async () => {
      const created = await makeBooking();
      const found = await bookingService.getBookingById(created.id);
      expect(found).toEqual(created);
    });
  });
});
