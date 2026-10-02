import { describe, expect, it, vi } from 'vitest';
import type { APIRequestContext } from 'playwright';
import { BookingApiClient } from '../../api/BookingApiClient';
import { Booking } from '../../types/booking';

function fakeRequestContext() {
  const fakeResponse = { json: () => Promise.resolve({}) };
  return {
    get: vi.fn().mockResolvedValue(fakeResponse),
    post: vi.fn().mockResolvedValue(fakeResponse),
    put: vi.fn().mockResolvedValue(fakeResponse),
    patch: vi.fn().mockResolvedValue(fakeResponse),
    delete: vi.fn().mockResolvedValue(fakeResponse),
  };
}

function booking(): Booking {
  return {
    firstname: 'Jim',
    lastname: 'Brown',
    totalprice: 111,
    depositpaid: true,
    bookingdates: { checkin: '2024-01-01', checkout: '2024-01-02' },
    additionalneeds: 'Breakfast',
  };
}

describe('BookingApiClient', () => {
  it('sends no params to /booking when no filter is given', async () => {
    const request = fakeRequestContext();
    const client = new BookingApiClient(request as unknown as APIRequestContext);

    await client.getBookingIds();

    expect(request.get).toHaveBeenCalledWith('/booking', { params: undefined });
  });

  it('sends only the filters that were given', async () => {
    const request = fakeRequestContext();
    const client = new BookingApiClient(request as unknown as APIRequestContext);

    await client.getBookingIds({ firstname: 'Jim', checkin: '2024-01-01' });

    expect(request.get).toHaveBeenCalledWith('/booking', { params: { firstname: 'Jim', checkin: '2024-01-01' } });
  });

  it('hits the booking-by-id endpoint', async () => {
    const request = fakeRequestContext();
    const client = new BookingApiClient(request as unknown as APIRequestContext);

    await client.getBooking(1);

    expect(request.get).toHaveBeenCalledWith('/booking/1');
  });

  it('sends the booking payload with no auth header on create', async () => {
    const request = fakeRequestContext();
    const client = new BookingApiClient(request as unknown as APIRequestContext);
    const data = booking();

    await client.createBooking(data);

    expect(request.post).toHaveBeenCalledWith('/booking', { data });
  });

  it('sends a raw payload as-is on createBookingRaw', async () => {
    const request = fakeRequestContext();
    const client = new BookingApiClient(request as unknown as APIRequestContext);
    const payload = { firstname: 'Jim', totalprice: 'nao-e-numero' };

    await client.createBookingRaw(payload);

    expect(request.post).toHaveBeenCalledWith('/booking', { data: payload });
  });

  it('sends the full payload with the auth token as a cookie on update', async () => {
    const request = fakeRequestContext();
    const client = new BookingApiClient(request as unknown as APIRequestContext);
    const data = booking();

    await client.updateBooking(1, data, 'tok123');

    expect(request.put).toHaveBeenCalledWith('/booking/1', { data, headers: { Cookie: 'token=tok123' } });
  });

  it('sends a raw payload as-is with the auth token as a cookie on updateBookingRaw', async () => {
    const request = fakeRequestContext();
    const client = new BookingApiClient(request as unknown as APIRequestContext);
    const payload = { firstname: 'Jim', totalprice: 'nao-e-numero' };

    await client.updateBookingRaw(1, payload, 'tok123');

    expect(request.put).toHaveBeenCalledWith('/booking/1', { data: payload, headers: { Cookie: 'token=tok123' } });
  });

  it('sends only the given fields on partial update', async () => {
    const request = fakeRequestContext();
    const client = new BookingApiClient(request as unknown as APIRequestContext);

    await client.partialUpdateBooking(1, { lastname: 'Jane' }, 'tok123');

    expect(request.patch).toHaveBeenCalledWith('/booking/1', {
      data: { lastname: 'Jane' },
      headers: { Cookie: 'token=tok123' },
    });
  });

  it('sends a raw payload as-is with the auth token as a cookie on partialUpdateBookingRaw', async () => {
    const request = fakeRequestContext();
    const client = new BookingApiClient(request as unknown as APIRequestContext);
    const payload = { lastname: 12345 };

    await client.partialUpdateBookingRaw(1, payload, 'tok123');

    expect(request.patch).toHaveBeenCalledWith('/booking/1', { data: payload, headers: { Cookie: 'token=tok123' } });
  });

  it('sends the auth token as a cookie on delete', async () => {
    const request = fakeRequestContext();
    const client = new BookingApiClient(request as unknown as APIRequestContext);

    await client.deleteBooking(1, 'tok123');

    expect(request.delete).toHaveBeenCalledWith('/booking/1', { headers: { Cookie: 'token=tok123' } });
  });

  it('exemploComBug just re-fetches the booking by id', async () => {
    const request = fakeRequestContext();
    const client = new BookingApiClient(request as unknown as APIRequestContext);

    await client.exemploComBug(1);

    expect(request.get).toHaveBeenCalledWith('/booking/1');
  });
});
