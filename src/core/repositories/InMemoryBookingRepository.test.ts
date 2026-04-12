import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryBookingRepository } from "@/core/repositories/InMemoryBookingRepository";
import type { Booking } from "@/core/models/booking.types";

const BASE: Booking = {
  id: "1",
  name: "Alice",
  reason: "Back pain",
  date: "2026-05-01",
  startTime: "09:00",
  endTime: "09:30",
  duration: 30,
};

describe("InMemoryBookingRepository", () => {
  let repo: InMemoryBookingRepository;

  beforeEach(() => {
    repo = new InMemoryBookingRepository();
    repo.clear();
  });

  describe("findAll", () => {
    it("returns empty array when store is empty", async () => {
      expect(await repo.findAll()).toEqual([]);
    });

    it("returns all stored bookings", async () => {
      await repo.create(BASE);
      await repo.create({ ...BASE, id: "2" });
      const all = await repo.findAll();
      expect(all).toHaveLength(2);
    });
  });

  describe("findById", () => {
    it("returns null for unknown id", async () => {
      expect(await repo.findById("nope")).toBeNull();
    });

    it("returns the booking for a known id", async () => {
      await repo.create(BASE);
      expect(await repo.findById("1")).toEqual(BASE);
    });
  });

  describe("findByDate", () => {
    it("returns empty array when no bookings match the date", async () => {
      await repo.create(BASE);
      expect(await repo.findByDate("2099-01-01")).toEqual([]);
    });

    it("returns only bookings matching the requested date", async () => {
      await repo.create(BASE);
      await repo.create({ ...BASE, id: "2", date: "2026-06-01" });
      const results = await repo.findByDate("2026-05-01");
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe("1");
    });
  });

  describe("create", () => {
    it("persists a booking and returns it", async () => {
      const created = await repo.create(BASE);
      expect(created).toEqual(BASE);
      expect(await repo.findById("1")).toEqual(BASE);
    });
  });

  describe("update", () => {
    it("merges provided fields and returns the updated booking", async () => {
      await repo.create(BASE);
      const updated = await repo.update("1", {
        name: "Bob",
        endTime: "09:45",
      });
      expect(updated.name).toBe("Bob");
      expect(updated.endTime).toBe("09:45");
      expect(updated.reason).toBe(BASE.reason);
    });

    it("throws when id is not found", async () => {
      await expect(
        repo.update("ghost", { name: "X", endTime: "10:00" }),
      ).rejects.toThrow('Booking with id "ghost" not found');
    });
  });

  describe("delete", () => {
    it("removes the booking so it can no longer be found", async () => {
      await repo.create(BASE);
      await repo.delete("1");
      expect(await repo.findById("1")).toBeNull();
    });

    it("throws when id is not found", async () => {
      await expect(repo.delete("ghost")).rejects.toThrow(
        'Booking with id "ghost" not found',
      );
    });
  });
});
