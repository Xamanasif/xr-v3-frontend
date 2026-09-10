import type { z } from 'zod';

import { publicEnv } from './env';

export class ApiError extends Error {
  override readonly name = 'ApiError';
  constructor(
    readonly status: number,
    readonly body: string,
  ) {
    super(`API responded ${status}`);
  }
}

/**
 * Merge default headers into any valid `HeadersInit` — a `Headers` instance, a
 * tuple array or a plain object — through the Headers API, so header names compare
 * case-insensitively and caller-supplied values always win.
 */
export function withDefaultHeaders(
  init: HeadersInit | undefined,
  defaults: Readonly<Record<string, string>>,
): Headers {
  const headers = new Headers(init);
  for (const [name, value] of Object.entries(defaults)) {
    if (!headers.has(name)) {
      headers.set(name, value);
    }
  }
  return headers;
}

/**
 * Fetch a JSON resource from the platform API and validate it against its contract.
 * The API is the authority; the web application never re-implements its rules.
 */
export async function fetchApi<TSchema extends z.ZodType>(
  path: string,
  schema: TSchema,
  init: RequestInit = {},
): Promise<z.output<TSchema>> {
  const url = new URL(path, publicEnv.NEXT_PUBLIC_API_BASE_URL);
  const response = await fetch(url, {
    ...init,
    headers: withDefaultHeaders(init.headers, { accept: 'application/json' }),
  });
  if (!response.ok) {
    throw new ApiError(response.status, await response.text());
  }
  return schema.parse(await response.json()) as z.output<TSchema>;
}
