/**
 * GET requests to the platform API for the HTTP adapter (ADR-0014). Each answer is one of the
 * outcomes a port can give, never an exception for an ordinary failure:
 *
 * - 200 → the body, validated against the port's own output schema. A body that does not match
 *   is contract drift between the API and the web — a programming error, so it throws
 *   (`ContractDriftError`) instead of being shown as a soft failure;
 * - 404 → `not-found`; 400 → `invalid-request` (the port decides what that means);
 * - no answer, a 5xx or any other status → `unavailable` (the drawn "failed, try again" state).
 */
import type { z } from 'zod';

import { withDefaultHeaders } from '@/lib/api-client';

export type FetchLike = (input: URL, init: RequestInit) => Promise<Response>;

export type HttpOutcome<T> =
  | { readonly kind: 'ok'; readonly value: T }
  | { readonly kind: 'not-found' }
  | { readonly kind: 'invalid-request' }
  | { readonly kind: 'unavailable' };

export class ContractDriftError extends Error {
  override readonly name = 'ContractDriftError';
  constructor(
    readonly path: string,
    readonly issues: string,
  ) {
    super(`The API answered ${path} outside its published contract: ${issues}`);
  }
}

export interface HttpClient {
  get<S extends z.ZodType>(
    path: string,
    schema: S,
    query?: Readonly<Record<string, string>>,
  ): Promise<HttpOutcome<z.output<S>>>;
}

export function createHttpClient(options: {
  readonly baseUrl: string;
  readonly fetch: FetchLike;
}): HttpClient {
  return {
    async get(path, schema, query = {}) {
      const url = new URL(path, options.baseUrl);
      for (const [name, value] of Object.entries(query)) url.searchParams.set(name, value);
      let response: Response;
      try {
        response = await options.fetch(url, {
          method: 'GET',
          headers: withDefaultHeaders(undefined, { accept: 'application/json' }),
        });
      } catch {
        return { kind: 'unavailable' };
      }
      if (response.status === 404) return { kind: 'not-found' };
      if (response.status === 400) return { kind: 'invalid-request' };
      if (response.status !== 200) return { kind: 'unavailable' };
      let body: unknown;
      try {
        body = await response.json();
      } catch {
        return { kind: 'unavailable' };
      }
      const parsed = schema.safeParse(body);
      if (!parsed.success) throw new ContractDriftError(path, parsed.error.message);
      return { kind: 'ok', value: parsed.data };
    },
  };
}
