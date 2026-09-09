import { z } from 'zod';

export const BookingDatesSchema = z.object({
  checkin: z.string(),
  checkout: z.string(),
});
export type BookingDates = z.infer<typeof BookingDatesSchema>;

export const BookingSchema = z.object({
  firstname: z.string(),
  lastname: z.string(),
  totalprice: z.number(),
  depositpaid: z.boolean(),
  bookingdates: BookingDatesSchema,
  additionalneeds: z.string().optional(),
});
export type Booking = z.infer<typeof BookingSchema>;

export const BookingIdSchema = z.object({
  bookingid: z.number(),
});
export type BookingId = z.infer<typeof BookingIdSchema>;

export const CreateBookingResponseSchema = z.object({
  bookingid: z.number(),
  booking: BookingSchema,
});
export type CreateBookingResponse = z.infer<typeof CreateBookingResponseSchema>;

export const AuthResponseSchema = z.object({
  token: z.string(),
});
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
