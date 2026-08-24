import { ApiError, api } from './client';

const mockFetch = jest.fn();
globalThis.fetch = mockFetch as unknown as typeof fetch;

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response;
}

describe('api client', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('sends credentials so the auth cookie travels with every request', async () => {
    mockFetch.mockResolvedValue(jsonResponse(200, { ok: true }));

    await api.get('/api/thing');

    expect(mockFetch.mock.calls[0][1]).toMatchObject({ credentials: 'include' });
  });

  it('sets a JSON content type only when there is a body', async () => {
    mockFetch.mockResolvedValue(jsonResponse(200, {}));

    await api.get('/api/thing');
    expect(mockFetch.mock.calls[0][1].headers).toBeUndefined();

    await api.post('/api/thing', { a: 1 });
    expect(mockFetch.mock.calls[1][1].headers).toEqual({ 'Content-Type': 'application/json' });
  });

  it('returns the parsed body on success', async () => {
    mockFetch.mockResolvedValue(jsonResponse(200, { user: { name: 'Alice' } }));

    await expect(api.get('/api/auth/me')).resolves.toEqual({ user: { name: 'Alice' } });
  });

  it('resolves undefined for 204 without parsing a body', async () => {
    const json = jest.fn();
    mockFetch.mockResolvedValue({ ok: true, status: 204, json } as unknown as Response);

    await expect(api.delete('/api/notes/1')).resolves.toBeUndefined();
    expect(json).not.toHaveBeenCalled();
  });

  it('throws ApiError carrying the server message and status', async () => {
    mockFetch.mockResolvedValue(jsonResponse(404, { error: { message: 'Note not found' } }));

    await expect(api.get('/api/notes/1')).rejects.toMatchObject({
      name: 'ApiError',
      status: 404,
      message: 'Note not found',
    });
  });

  it('falls back to a generic message when the error body has no message', async () => {
    mockFetch.mockResolvedValue(jsonResponse(500, {}));

    await expect(api.get('/api/thing')).rejects.toThrow(/something went wrong/i);
  });

  it('reports a network failure as status 0 rather than crashing', async () => {
    mockFetch.mockRejectedValue(new TypeError('Failed to fetch'));

    const error = await api.get('/api/thing').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(0);
  });
});
