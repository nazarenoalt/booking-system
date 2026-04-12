import type {
  Booking,
  CreateBookingDto,
  UpdateBookingDto,
} from "@/core/models/booking.types";

export interface IBookingRepository {
  findAll(): Promise<Booking[]>;
  findById(id: string): Promise<Booking | null>;
  findByDate(date: string): Promise<Booking[]>;
  create(dto: CreateBookingDto): Promise<Booking>;
  update(
    id: string,
    dto: UpdateBookingDto & { endTime: string },
  ): Promise<Booking>;
  delete(id: string): Promise<void>;
}
