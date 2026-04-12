import type {
  Booking,
  CreateBookingDto,
  UpdateBookingDto,
} from "@/core/models/booking.types";
import type { IBookingRepository } from "@/core/repositories/IBookingRepository";

// Anchor the store to `global` so it survives hot-module reloads in Next.js
// dev mode. Without this, each module re-evaluation creates a fresh Map and
// all in-memory data is lost between requests.
const g = global as typeof global & { bookingStore?: Map<string, Booking> };
const store = g.bookingStore ?? (g.bookingStore = new Map<string, Booking>());

export class InMemoryBookingRepository implements IBookingRepository {
  clear(): void {
    store.clear();
  }

  async findAll(): Promise<Booking[]> {
    return Array.from(store.values());
  }

  async findById(id: string): Promise<Booking | null> {
    return store.get(id) ?? null;
  }

  async findByDate(date: string): Promise<Booking[]> {
    console.log("STORE", store);

    return Array.from(store.values()).filter((b) => b.date === date);
  }

  async create(dto: CreateBookingDto): Promise<Booking> {
    store.set(dto.id, dto);
    return dto;
  }

  async update(
    id: string,
    dto: UpdateBookingDto & { endTime: string },
  ): Promise<Booking> {
    const existing = store.get(id);
    if (!existing) {
      throw new Error(`Booking with id "${id}" not found`);
    }
    const updated: Booking = { ...existing, ...dto };
    store.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    const existing = store.get(id);
    if (!existing) {
      throw new Error(`Booking with id "${id}" not found`);
    }
    store.delete(id);
  }
}

export const bookingRepository = new InMemoryBookingRepository();
