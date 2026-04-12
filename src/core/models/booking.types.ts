export type Duration = 30 | 45 | 60;

export type Booking = {
  id: string;
  name: string;
  reason: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm  (inferred)
  duration: Duration;
};

/*
 * These DTOs are auxiliar. When adding a database they should be replaced.
 */
export type CreateBookingDto = Booking;

export type UpdateBookingDto = Partial<
  Omit<CreateBookingDto, "id" | "endTime">
>;
