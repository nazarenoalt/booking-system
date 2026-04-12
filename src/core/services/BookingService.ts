import { v4 as uuidv4 } from "uuid";
import type {
  Booking,
  CreateBookingDto,
  Duration,
  UpdateBookingDto,
} from "@/core/models/booking.types";
import type { IBookingRepository } from "@/core/repositories/IBookingRepository";
import { bookingRepository } from "@/core/repositories/InMemoryBookingRepository";
import {
  addMinutes,
  checkOverlap,
  getStartSlots,
  getValidDurations,
} from "@/core/utils/time";

const VALID_DURATIONS: Duration[] = [30, 45, 60];

function isDuration(value: unknown): value is Duration {
  return VALID_DURATIONS.includes(value as Duration);
}

class BookingService {
  constructor(private readonly repo: IBookingRepository) {}

  private validateAndComputeEndTime(
    name: string | undefined,
    reason: string | undefined,
    date: string | undefined,
    startTime: string | undefined,
    duration: Duration | undefined,
  ): { endTime: string } {
    if (!name || name.trim() === "") {
      throw new Error("Name is required");
    }
    if (!reason || reason.trim() === "") {
      throw new Error("Reason is required");
    }
    if (!date || date.trim() === "") {
      throw new Error("Date is required");
    }
    if (!startTime || startTime.trim() === "") {
      throw new Error("Start time is required");
    }
    if (!isDuration(duration)) {
      throw new Error(
        `Duration must be one of: ${VALID_DURATIONS.join(", ")} minutes`,
      );
    }

    const validSlots = getStartSlots(duration);
    if (!validSlots.includes(startTime)) {
      throw new Error(
        `Time slot ${startTime} is not available for a ${duration}-minute booking`,
      );
    }

    const validDurations = getValidDurations(startTime);
    if (!validDurations.includes(duration)) {
      throw new Error(
        `Duration ${duration} minutes is not valid for start time ${startTime}`,
      );
    }

    return { endTime: addMinutes(startTime, duration) };
  }

  async createBooking(dto: CreateBookingDto): Promise<Booking> {
    const { endTime } = this.validateAndComputeEndTime(
      dto.name,
      dto.reason,
      dto.date,
      dto.startTime,
      dto.duration,
    );

    const existingOnDate = await this.repo.findByDate(dto.date);
    for (const booking of existingOnDate) {
      if (
        checkOverlap(dto.startTime, endTime, booking.startTime, booking.endTime)
      ) {
        throw new Error(
          `This time slot overlaps with an existing booking (${booking.startTime}–${booking.endTime})`,
        );
      }
    }

    const id = uuidv4();
    return this.repo.create({ ...dto, id, endTime });
  }

  async updateBooking(id: string, dto: UpdateBookingDto): Promise<Booking> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new Error(`Booking with id "${id}" not found`);
    }

    const merged = {
      name: dto.name ?? existing.name,
      reason: dto.reason ?? existing.reason,
      date: dto.date ?? existing.date,
      startTime: dto.startTime ?? existing.startTime,
      duration: dto.duration ?? existing.duration,
    };

    const { endTime } = this.validateAndComputeEndTime(
      merged.name,
      merged.reason,
      merged.date,
      merged.startTime,
      merged.duration,
    );

    const existingOnDate = await this.repo.findByDate(merged.date);
    for (const booking of existingOnDate) {
      if (booking.id === id) continue;
      if (
        checkOverlap(
          merged.startTime,
          endTime,
          booking.startTime,
          booking.endTime,
        )
      ) {
        throw new Error(
          `This time slot overlaps with an existing booking (${booking.startTime}–${booking.endTime})`,
        );
      }
    }

    return this.repo.update(id, { ...merged, endTime });
  }

  async deleteBooking(id: string): Promise<void> {
    return this.repo.delete(id);
  }

  async getBookingsForDate(date: string): Promise<Booking[]> {
    const bookings = await this.repo.findByDate(date);
    return bookings.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  async getBookingById(id: string): Promise<Booking | null> {
    return this.repo.findById(id);
  }
}

export const bookingService = new BookingService(bookingRepository);
