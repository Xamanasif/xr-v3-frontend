/**
 * Every schema the API publishes on the wire, with the direction it is published in.
 * Each is a `wireSchema` (representability asserted at definition); the API publishes
 * all of them as OpenAPI components, drafts marked as such, and the contracts test
 * converts each one strictly.
 */
import type { z } from 'zod';

import {
  catalogueSearchQuery,
  getAreaOutput,
  getCourseOutput,
  listAreasOutput,
  publicExperimentPage,
  searchCatalogueOutput,
} from './catalogue.js';
import { healthQuerySchema, healthResponseSchema } from './health.js';
import { problemDetailsSchema } from './problem.js';
import { runtimeEventBatchSchema, runtimeEventInputSchema } from './runtime-events.js';

export interface WireContract {
  readonly name: string;
  readonly io: 'input' | 'output';
  readonly schema: z.ZodType;
  /** `draft` contracts are versioned with the code and published as components, but no operation serves them yet. */
  readonly status: 'published' | 'draft';
  readonly description: string;
}

export const WIRE_CONTRACTS: readonly WireContract[] = [
  {
    name: 'HealthQuery',
    io: 'input',
    schema: healthQuerySchema,
    status: 'published',
    description: 'Query of GET /api/v1/health.',
  },
  {
    name: 'HealthResponse',
    io: 'output',
    schema: healthResponseSchema,
    status: 'published',
    description: 'Response of GET /api/v1/health.',
  },
  {
    name: 'ProblemDetails',
    io: 'output',
    schema: problemDetailsSchema,
    status: 'published',
    description: 'RFC 9457 problem details; the envelope of every error response.',
  },
  {
    name: 'RuntimeEventInput',
    io: 'input',
    schema: runtimeEventInputSchema,
    status: 'draft',
    description:
      'One runtime utilisation event reported by a Web, AR, VR or MR runtime (RUNTIME_INTEGRATION_CONTRACT.md §3–§5).',
  },
  {
    name: 'RuntimeEventBatch',
    io: 'input',
    schema: runtimeEventBatchSchema,
    status: 'draft',
    description: 'A batch of runtime utilisation events for a future ingestion endpoint.',
  },
  // The public catalogue (D1, ADR-0013; promoted by ADR-0014 §8): the CatalogueService port's own
  // output schemas, served by GET /api/v1/catalogue/….
  {
    name: 'CatalogueAreaList',
    io: 'output',
    schema: listAreasOutput,
    status: 'published',
    description: 'Response of GET /api/v1/catalogue/areas: the areas with published experiments.',
  },
  {
    name: 'CatalogueAreaPage',
    io: 'output',
    schema: getAreaOutput,
    status: 'published',
    description: 'Response of GET /api/v1/catalogue/areas/{areaId}.',
  },
  {
    name: 'CatalogueCoursePage',
    io: 'output',
    schema: getCourseOutput,
    status: 'published',
    description: 'Response of GET /api/v1/catalogue/courses/{courseId}.',
  },
  {
    name: 'CatalogueSearchQuery',
    io: 'input',
    schema: catalogueSearchQuery,
    status: 'published',
    description: 'Query of GET /api/v1/catalogue/experiments.',
  },
  {
    name: 'CatalogueSearchResult',
    io: 'output',
    schema: searchCatalogueOutput,
    status: 'published',
    description: 'Response of GET /api/v1/catalogue/experiments.',
  },
  {
    name: 'PublicExperimentPage',
    io: 'output',
    schema: publicExperimentPage,
    status: 'published',
    description: 'Response of GET /api/v1/catalogue/experiments/{experimentId}.',
  },
];
