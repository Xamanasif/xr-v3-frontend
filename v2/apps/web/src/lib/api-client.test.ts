import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { ApiError, fetchApi, withDefaultHeaders } from './api-client';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('withDefaultHeaders', () => {
  it('applies defaults when no headers are given', () => {
    expect(withDefaultHeaders(undefined, { accept: 'application/json' }).get('accept')).toBe(
      'application/json',
    );
  });

  it('accepts a Headers instance and keeps the caller value', () => {
    const headers = withDefaultHeaders(new Headers({ Accept: 'text/plain', 'x-a': '1' }), {
      accept: 'application/json',
    });
    expect(headers.get('accept')).toBe('text/plain');
    expect(headers.get('x-a')).toBe('1');
  });

  it('accepts a tuple array', () => {
    const headers = withDefaultHeaders(
      [
        ['X-Request-Id', 'r1'],
        ['ACCEPT', 'application/problem+json'],
      ],
      { accept: 'application/json' },
    );
    expect(headers.get('x-request-id')).toBe('r1');
    expect(headers.get('accept')).toBe('application/problem+json');
  });

  it('accepts a plain object and adds the default', () => {
    const headers = withDefaultHeaders({ 'content-type': 'application/json' }, { accept: 'a/b' });
    expect(headers.get('content-type')).toBe('application/json');
    expect(headers.get('accept')).toBe('a/b');
  });
});

describe('fetchApi', () => {
  const schema = z.object({ ok: z.boolean() });

  it('sends a Headers object carrying the default accept header', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ ok: true }));
    await fetchApi('/api/v1/health', schema, { headers: [['x-trace', 't1']] });
    const init = spy.mock.calls[0]?.[1];
    expect(init?.headers).toBeInstanceOf(Headers);
    const headers = init?.headers as Headers;
    expect(headers.get('accept')).toBe('application/json');
    expect(headers.get('x-trace')).toBe('t1');
  });

  it('validates the body against the contract', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ ok: 'yes' }));
    await expect(fetchApi('/api/v1/health', schema)).rejects.toThrow();
  });

  it('surfaces non-2xx responses as ApiError', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('nope', { status: 503 }));
    await expect(fetchApi('/api/v1/health', schema)).rejects.toBeInstanceOf(ApiError);
  });
});
