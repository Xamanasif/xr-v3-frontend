/**
 * The public catalogue over HTTP (D1, backend B1; ADR-0013) — `GET /api/v1/catalogue/…`.
 *
 * The response schemas ARE the `CatalogueService` port's output schemas (Appendix C §3.2), so the
 * API answers exactly what the typed mock answers and the web reads it behind the same port. They
 * are defined once, in the root entry of `@xr/contracts` (`catalogue.ts`; promoted by ADR-0014 §8)
 * and listed in `WIRE_CONTRACTS`; this module only names them for the routes.
 *
 * The one HTTP-only shape is the search query: a querystring carries text only, and coercion is
 * refused on the wire (B7), so `featured` travels as `'true' | 'false'` and `catalogueSearchOf`
 * maps it to the port's query.
 */
import {
  areaCard,
  catalogueAreaParam,
  catalogueCourseParam,
  catalogueExperimentParam,
  catalogueSearchQuery,
  type CatalogueSearchQuery,
  getAreaOutput,
  getCourseOutput,
  listAreasOutput,
  publicExperimentPage,
  searchCatalogueOutput,
} from '@xr/contracts';
import type { CatalogueQuery, Out } from '@xr/contracts/draft';

export type { CatalogueSearchQuery };

/** Path parameters: lenient bounded ids; existence is the answer (`404`), never the shape. */
export const catalogueAreaParamSchema = catalogueAreaParam;
export const catalogueCourseParamSchema = catalogueCourseParam;
export const catalogueExperimentParamSchema = catalogueExperimentParam;

export const catalogueSearchQuerySchema = catalogueSearchQuery;

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

export const catalogueAreaListSchema = listAreasOutput;
/** One element of the list: Nest's serializer validates an array response element by element. */
export const catalogueAreaCardSchema = areaCard;
export const catalogueAreaPageSchema = getAreaOutput;
export const catalogueCoursePageSchema = getCourseOutput;
export const catalogueSearchResultSchema = searchCatalogueOutput;
export const publicExperimentPageSchema = publicExperimentPage;

/** The port's own (deep-readonly) output types, so the API and the port cannot disagree. */
export type CatalogueAreaPage = Out<typeof catalogueAreaPageSchema>;
export type CatalogueCoursePage = Out<typeof catalogueCoursePageSchema>;
export type CatalogueSearchResult = Out<typeof catalogueSearchResultSchema>;
