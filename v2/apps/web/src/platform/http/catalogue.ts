/**
 * `CatalogueService` over HTTP: `GET /api/v1/catalogue/…` (ADR-0013 routes; ADR-0014). Every
 * answer is validated against the port's own output schema, so the screens get exactly what the
 * typed mock gives them. Unknown or hidden → `not-found`; the API not answering → `unavailable`.
 *
 * It also notes the published formats of every experiment an answer names (`PublishedFormats`):
 * the browser-held selection checks a chosen format against them, as the mock checks its world.
 */
import {
  type CatalogueService,
  failure,
  getAreaOutput,
  getCourseOutput,
  listAreasOutput,
  publicExperimentPage,
  searchCatalogueOutput,
  success,
} from '@xr/contracts/draft';
import type { ExperimentId, Technology } from '@xr/domain';

import type { HttpClient, HttpOutcome } from './request';

const BASE = '/api/v1/catalogue';

/** The published formats of the experiments this tab's catalogue answers have named. */
export class PublishedFormats {
  readonly #formats = new Map<string, readonly Technology[]>();

  note(experimentId: string, formats: readonly Technology[]): void {
    this.#formats.set(experimentId, [...formats]);
  }

  /** `undefined` when no answer in this tab has named the experiment as published. */
  of(experimentId: ExperimentId | string): readonly Technology[] | undefined {
    return this.#formats.get(experimentId);
  }
}

function segment(id: string): string {
  return encodeURIComponent(id);
}

/** A record read: `400` is a malformed id, which can name no published record (lenient ids). */
function asRecord<T>(outcome: HttpOutcome<T>) {
  if (outcome.kind === 'ok') return success(outcome.value);
  if (outcome.kind === 'unavailable') return failure({ kind: 'unavailable' as const });
  return failure({ kind: 'not-found' as const });
}

export function httpCataloguePort(client: HttpClient, formats: PublishedFormats): CatalogueService {
  const noteEntries = (
    entries: readonly { experimentId: string; availableIn: readonly Technology[] }[],
  ) => {
    for (const entry of entries) formats.note(entry.experimentId, entry.availableIn);
  };

  return {
    async listAreas() {
      const outcome = await client.get(`${BASE}/areas`, listAreasOutput);
      if (outcome.kind === 'ok') return success(outcome.value);
      if (outcome.kind === 'unavailable') return failure({ kind: 'unavailable' });
      throw new Error(
        `GET ${BASE}/areas answered ${outcome.kind}, which the port does not declare.`,
      );
    },

    async getArea(areaId) {
      return asRecord(await client.get(`${BASE}/areas/${segment(areaId)}`, getAreaOutput));
    },

    async getCourse(courseId) {
      const outcome = await client.get(`${BASE}/courses/${segment(courseId)}`, getCourseOutput);
      if (outcome.kind === 'ok') noteEntries(outcome.value.experiments);
      return asRecord(outcome);
    },

    async searchCatalogue(query) {
      const params: Record<string, string> = { sort: query.sort };
      if (query.text !== undefined) params['text'] = query.text;
      if (query.areaId !== undefined) params['areaId'] = query.areaId;
      if (query.format !== undefined) params['format'] = query.format;
      if (query.featured !== undefined) params['featured'] = query.featured ? 'true' : 'false';
      const outcome = await client.get(`${BASE}/experiments`, searchCatalogueOutput, params);
      if (outcome.kind === 'ok') {
        noteEntries(outcome.value.entries);
        return success(outcome.value);
      }
      if (outcome.kind === 'unavailable') return failure({ kind: 'unavailable' });
      // The port declares `unavailable` only: a refused query is a caller bug, as in the mock.
      throw new Error(
        `GET ${BASE}/experiments answered ${outcome.kind} for ${JSON.stringify(query)}.`,
      );
    },

    async getExperiment(experimentId) {
      const outcome = await client.get(
        `${BASE}/experiments/${segment(experimentId)}`,
        publicExperimentPage,
      );
      if (outcome.kind === 'ok') {
        formats.note(
          outcome.value.experimentId,
          outcome.value.formats.map((entry) => entry.format),
        );
      }
      return asRecord(outcome);
    },
  };
}
