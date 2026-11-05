/**
 * The HTTP adapter (Appendix F §3.2 `platform/http/`; ADR-0014): the ports of the `api` data
 * source. One source per build — nothing here reaches the sample world.
 *
 * | Port              | Answers from                                                    |
 * | ----------------- | --------------------------------------------------------------- |
 * | catalogue         | the API, `GET /api/v1/catalogue/…` (ADR-0013)                   |
 * | selection         | this tab (the visitor's browser session, B1-06)                 |
 * | session           | nobody signed in; sign-in unavailable (no identity yet, B3)     |
 * | the other 19      | `unavailable` until their backend phase (docs/BACKEND_PLAN.md)  |
 */
import type { ProductPorts } from '@xr/contracts/draft';
import { type IsoInstant, unsafeBrand } from '@xr/domain';

import type { PlatformAdapter } from '../composition';
import { httpCataloguePort, PublishedFormats } from './catalogue';
import { createHttpClient, type FetchLike } from './request';
import { browserSelectionPort, type SelectionStorage } from './selection';
import { visitorSessionPort } from './session';
import { unavailablePort } from './unavailable';

export { ContractDriftError, type FetchLike } from './request';

export interface HttpPlatformOptions {
  /** The API origin (`NEXT_PUBLIC_API_BASE_URL`). */
  readonly baseUrl: string;
  /** `fetch`; injected by tests. */
  readonly fetch?: FetchLike;
  /** `sessionStorage` for the selection; memory if omitted or unusable. */
  readonly browserStorage?: SelectionStorage | null;
  /** The real clock, for the instant an item joins the selection. */
  readonly now?: () => number;
}

export function createHttpPlatform(options: HttpPlatformOptions): PlatformAdapter {
  const fetchImpl: FetchLike = options.fetch ?? ((input, init) => fetch(input, init));
  const client = createHttpClient({ baseUrl: options.baseUrl, fetch: fetchImpl });
  const published = new PublishedFormats();
  const clock = options.now ?? (() => Date.now());
  const ports: ProductPorts = {
    session: visitorSessionPort(),
    catalogue: httpCataloguePort(client, published),
    selection: browserSelectionPort({
      storage: options.browserStorage ?? null,
      published,
      now: () => unsafeBrand<IsoInstant>(new Date(clock()).toISOString()),
    }),
    accessRequests: unavailablePort('accessRequests'),
    institutions: unavailablePort('institutions'),
    people: unavailablePort('people'),
    groups: unavailablePort('groups'),
    facultyCourses: unavailablePort('facultyCourses'),
    institutionCourseCodes: unavailablePort('institutionCourseCodes'),
    studentAccess: unavailablePort('studentAccess'),
    learning: unavailablePort('learning'),
    feedback: unavailablePort('feedback'),
    assessments: unavailablePort('assessments'),
    questionBank: unavailablePort('questionBank'),
    marking: unavailablePort('marking'),
    teaching: unavailablePort('teaching'),
    production: unavailablePort('production'),
    corrections: unavailablePort('corrections'),
    academicStructure: unavailablePort('academicStructure'),
    platformCourseCodes: unavailablePort('platformCourseCodes'),
    platformRoles: unavailablePort('platformRoles'),
    operations: unavailablePort('operations'),
  };
  return {
    ports,
    // The API serves reads only so far, and the selection's commands run in this tab, where
    // `useCommand` sends each command once: no receipt is replayed for a repeated command id.
    // Command ids reach the API with its first command-carrying phase (B4).
    withCommandId: () => ports,
    newCommandId: () => crypto.randomUUID(),
  };
}
