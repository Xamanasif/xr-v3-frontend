/**
 * The public catalogue over HTTP (D1, backend B1; ADR-0013) — `GET /api/v1/catalogue/…`.
 *
 * The response schemas ARE the draft `CatalogueService` port's output schemas (Appendix C §3.2),
 * so the API answers exactly what the typed mock answers and the web can be re-pointed behind the
 * same port (TE-2). ADR-0008's removal trigger ("apps/api begins serving ports") has fired for
 * this one port: each schema is asserted here as a wire schema and published with its route. It
 * stays defined in `@xr/contracts/draft` until the catalogue DTOs are promoted to the root entry
 * (ADR-0013 follow-up), so `WIRE_CONTRACTS` and the root export are unchanged.
 *
 * The one HTTP-only shape is the search query: a querystring carries text only, and coercion is
 * refused on the wire (B7), so `featured` travels as `'true' | 'false'` and `catalogueSearchOf`
 * maps it to the port's query.
 */
import { wireSchema } from '@xr/contracts';
import {
  areaCard,
  type CatalogueQuery,
  getAreaOutput,
  getCourseOutput,
  ids,
  listAreasOutput,
  type Out,
  publicExperimentPage,
  searchCatalogueOutput,
} from '@xr/contracts/draft';
import { TECHNOLOGIES } from '@xr/domain';
import { z } from 'zod';

/** Path parameters: lenient bounded ids; existence is the answer (`404`), never the shape. */
export const catalogueAreaParamSchema = wireSchema(ids.in.area, 'input');
export const catalogueCourseParamSchema = wireSchema(ids.in.course, 'input');
export const catalogueExperimentParamSchema = wireSchema(ids.in.experiment, 'input');

export const catalogueSearchQuerySchema = wireSchema(
  z
    .object({
      text: z.string().max(200).optional().describe('Matches name, summary, course and code.'),
      areaId: ids.in.area.optional().describe('Only this engineering area.'),
      format: z.enum(TECHNOLOGIES).optional().describe('Only experiments published in it.'),
      featured: z
        .enum(['true', 'false'])
        .optional()
        .describe('`true`: only the landing’s featured experiments (B1-01).'),
      sort: z
        .enum(['default', 'title-a-z', 'course-code'])
        .describe('No default order is assumed: the caller names one (B1-04).'),
    })
    .strict(),
  'input',
);
export type CatalogueSearchQuery = z.output<typeof catalogueSearchQuerySchema>;

/** The HTTP query as the port's `CatalogueQuery`. */
export function catalogueSearchOf(query: CatalogueSearchQuery): CatalogueQuery {
  return {
    ...(query.text === undefined ? {} : { text: query.text }),
    ...(query.areaId === undefined ? {} : { areaId: query.areaId }),
    ...(query.format === undefined ? {} : { format: query.format }),
    ...(query.featured === undefined ? {} : { featured: query.featured === 'true' }),
    sort: query.sort,
  };
}

export const catalogueAreaListSchema = wireSchema(listAreasOutput, 'output');
/** One element of the list: Nest's serializer validates an array response element by element. */
export const catalogueAreaCardSchema = wireSchema(areaCard, 'output');
export const catalogueAreaPageSchema = wireSchema(getAreaOutput, 'output');
export const catalogueCoursePageSchema = wireSchema(getCourseOutput, 'output');
export const catalogueSearchResultSchema = wireSchema(searchCatalogueOutput, 'output');
export const publicExperimentPageSchema = wireSchema(publicExperimentPage, 'output');

/** The port's own (deep-readonly) output types, so the API and the port cannot disagree. */
export type CatalogueAreaPage = Out<typeof catalogueAreaPageSchema>;
export type CatalogueCoursePage = Out<typeof catalogueCoursePageSchema>;
export type CatalogueSearchResult = Out<typeof catalogueSearchResultSchema>;
