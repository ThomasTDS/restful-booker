import { APIRequestContext } from 'playwright';
import { Booking } from '../types/booking';

export class BookingApiClient {
  readonly request: APIRequestContext;

  constructor(request: APIRequestContext) {
    this.request = request;
  }

  async getBookingIds(filters?: Partial<{ firstname: string; lastname: string; checkin: string; checkout: string }>) {
    return this.request.get('/booking', { params: filters });
  }

  async getBooking(id: number) {
    return this.request.get(`/booking/${id}`);
  }

  async createBooking(booking: Booking) {
    return this.request.post('/booking', { data: booking });
  }

  // Aceita um payload solto (sem checar contra o tipo Booking) para os testes de payload
  // inválido, que precisam enviar campos ausentes ou com tipo errado de propósito.
  async createBookingRaw(payload: Record<string, unknown>) {
    return this.request.post('/booking', { data: payload });
  }

  async updateBooking(id: number, booking: Booking, token: string) {
    return this.request.put(`/booking/${id}`, {
      data: booking,
      headers: { Cookie: `token=${token}` },
    });
  }

  async partialUpdateBooking(id: number, partialBooking: Partial<Booking>, token: string) {
    return this.request.patch(`/booking/${id}`, {
      data: partialBooking,
      headers: { Cookie: `token=${token}` },
    });
  }

  async deleteBooking(id: number, token: string) {
    return this.request.delete(`/booking/${id}`, {
      headers: { Cookie: `token=${token}` },
    });
  }

  async exemploComBug(id: number) {
    await this.getBooking(id);
  }
}
