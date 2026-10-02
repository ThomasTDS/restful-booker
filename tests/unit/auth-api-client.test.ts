import { describe, expect, it, vi } from 'vitest';
import type { APIRequestContext } from 'playwright';
import { AuthApiClient } from '../../api/AuthApiClient';

function fakeRequestContext(token: string) {
  const post = vi.fn().mockResolvedValue({ json: () => Promise.resolve({ token }) });
  return { post: post as unknown as APIRequestContext['post'] };
}

describe('AuthApiClient', () => {
  it('posts the given credentials to /auth', async () => {
    const { post } = fakeRequestContext('tok-123');
    const client = new AuthApiClient({ post } as unknown as APIRequestContext);

    await client.createToken('admin', 'password123');

    expect(post).toHaveBeenCalledWith('/auth', { data: { username: 'admin', password: 'password123' } });
  });

  it('returns the token from the response body', async () => {
    const { post } = fakeRequestContext('tok-123');
    const client = new AuthApiClient({ post } as unknown as APIRequestContext);

    const token = await client.getValidToken();

    expect(token).toBe('tok-123');
  });

  it('always authenticates as admin, regardless of who calls it', async () => {
    const { post } = fakeRequestContext('tok-123');
    const client = new AuthApiClient({ post } as unknown as APIRequestContext);

    await client.getValidToken();

    expect(post).toHaveBeenCalledWith('/auth', { data: { username: 'admin', password: 'password123' } });
  });
});
