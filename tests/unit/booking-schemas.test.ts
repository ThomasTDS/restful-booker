import { describe, expect, it } from 'vitest';
import { AuthResponseSchema, BookingIdSchema, BookingSchema, CreateBookingResponseSchema } from '../../types/booking';

describe('BookingSchema', () => {
  it('accepts a full valid payload', () => {
    const booking = {
      firstname: 'Jim',
      lastname: 'Brown',
      totalprice: 111,
      depositpaid: true,
      bookingdates: { checkin: '2024-01-01', checkout: '2024-01-02' },
      additionalneeds: 'Breakfast',
    };

    expect(BookingSchema.parse(booking)).toEqual(booking);
  });

  it('leaves additionalneeds undefined when omitted', () => {
    const booking = {
      firstname: 'Jim',
      lastname: 'Brown',
      totalprice: 111,
      depositpaid: true,
      bookingdates: { checkin: '2024-01-01', checkout: '2024-01-02' },
    };

    expect(BookingSchema.parse(booking).additionalneeds).toBeUndefined();
  });

  it('rejects a payload missing a required field', () => {
    const withoutFirstname = {
      lastname: 'Brown',
      totalprice: 111,
      depositpaid: true,
      bookingdates: { checkin: '2024-01-01', checkout: '2024-01-02' },
    };

    expect(() => BookingSchema.parse(withoutFirstname)).toThrow();
  });

  it('rejects incomplete bookingdates', () => {
    const booking = {
      firstname: 'Jim',
      lastname: 'Brown',
      totalprice: 111,
      depositpaid: true,
      bookingdates: { checkin: '2024-01-01' },
    };

    expect(() => BookingSchema.parse(booking)).toThrow();
  });
});

describe('BookingIdSchema', () => {
  it('rejects a non-numeric bookingid', () => {
    expect(() => BookingIdSchema.parse({ bookingid: 'abc' })).toThrow();
  });
});

describe('CreateBookingResponseSchema', () => {
  it('nests the booking model under booking', () => {
    const payload = {
      bookingid: 1,
      booking: {
        firstname: 'Jim',
        lastname: 'Brown',
        totalprice: 111,
        depositpaid: true,
        bookingdates: { checkin: '2024-01-01', checkout: '2024-01-02' },
      },
    };

    expect(CreateBookingResponseSchema.parse(payload)).toEqual(payload);
  });
});

describe('AuthResponseSchema', () => {
  it('requires a token', () => {
    expect(() => AuthResponseSchema.parse({})).toThrow();
  });
});
