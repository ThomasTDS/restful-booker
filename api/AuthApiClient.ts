import { APIRequestContext } from 'playwright';
import { AuthResponse, AuthResponseSchema } from '../types/booking';

export class AuthApiClient {
  readonly request: APIRequestContext;

  constructor(request: APIRequestContext) {
    this.request = request;
  }

  async createToken(username: string, password: string) {
    const response = await this.request.post('/auth', {
      data: { username, password },
    });
    return response;
  }

  async getValidToken(): Promise<string> {
    const response = await this.createToken('admin', 'password123');
    const body: AuthResponse = AuthResponseSchema.parse(await response.json());
    return body.token;
  }
}
