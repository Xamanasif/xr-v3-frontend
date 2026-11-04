import { Controller, Get, Param, Query, SerializeOptions } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { AreaCard, PublicExperimentPage } from '@xr/contracts/draft';
import { type AreaId, type CourseId, type ExperimentId, unsafeBrand } from '@xr/domain';

import { problemResponse } from '../../common/openapi/problem-response.js';
import {
  type CatalogueAreaPage,
  type CatalogueCoursePage,
  type CatalogueSearchQuery,
  type CatalogueSearchResult,
  catalogueAreaCardSchema,
  catalogueAreaListSchema,
  catalogueAreaPageSchema,
  catalogueAreaParamSchema,
  catalogueCoursePageSchema,
  catalogueCourseParamSchema,
  catalogueExperimentParamSchema,
  catalogueSearchOf,
  catalogueSearchQuerySchema,
  catalogueSearchResultSchema,
  publicExperimentPageSchema,
} from './catalogue.contract.js';
import { CatalogueReader } from './catalogue.service.js';

const UNAVAILABLE = problemResponse(503, 'The catalogue store could not be read');
const INVALID = problemResponse(400, 'The request did not satisfy the contract');

/**
 * The public catalogue (PU-01 … PU-06, PU-15): no sign-in, publication only (BC9). Each route
 * validates its input and its response with the same schemas it publishes (the health pattern).
 */
@ApiTags('catalogue')
@Controller('catalogue')
export class CatalogueController {
  constructor(private readonly catalogue: CatalogueReader) {}

  @Get('areas')
  @ApiOperation({
    summary: 'Engineering areas (PU-02)',
    description: 'The areas with a published experiment, in the catalogue order.',
  })
  @ApiOkResponse({ description: 'Area cards', standardSchema: catalogueAreaListSchema })
  @ApiServiceUnavailableResponse(UNAVAILABLE)
  // Nest's serializer validates an array response element by element, so it is given the card
  // schema; the document publishes the list schema. Every card is still validated.
  @SerializeOptions({ schema: catalogueAreaCardSchema })
  listAreas(): Promise<readonly AreaCard[]> {
    return this.catalogue.listAreas();
  }

  @Get('areas/:areaId')
  @ApiOperation({
    summary: 'One engineering area and its courses (PU-03)',
    description: 'Hidden (404) while the area holds no published experiment.',
  })
  @ApiOkResponse({ description: 'The area page', standardSchema: catalogueAreaPageSchema })
  @ApiBadRequestResponse(INVALID)
  @ApiNotFoundResponse(problemResponse(404, 'The area is not in the public catalogue'))
  @ApiServiceUnavailableResponse(UNAVAILABLE)
  @SerializeOptions({ schema: catalogueAreaPageSchema })
  getArea(
    @Param('areaId', { schema: catalogueAreaParamSchema }) areaId: string,
  ): Promise<CatalogueAreaPage> {
    return this.catalogue.getArea(unsafeBrand<AreaId>(areaId));
  }

  @Get('courses/:courseId')
  @ApiOperation({
    summary: 'One course, its area and its published experiments (PU-05)',
    description: 'Not found when its area is hidden.',
  })
  @ApiOkResponse({ description: 'The course page', standardSchema: catalogueCoursePageSchema })
  @ApiBadRequestResponse(INVALID)
  @ApiNotFoundResponse(problemResponse(404, 'The course is not in the public catalogue'))
  @ApiServiceUnavailableResponse(UNAVAILABLE)
  @SerializeOptions({ schema: catalogueCoursePageSchema })
  getCourse(
    @Param('courseId', { schema: catalogueCourseParamSchema }) courseId: string,
  ): Promise<CatalogueCoursePage> {
    return this.catalogue.getCourse(unsafeBrand<CourseId>(courseId));
  }

  @Get('experiments')
  @ApiOperation({
    summary: 'Search the published catalogue (PU-01 featured, PU-04)',
    description:
      'Filters by text, area, format and featured; `sort` is required (no default order is assumed).',
  })
  @ApiOkResponse({ description: 'Matching entries', standardSchema: catalogueSearchResultSchema })
  @ApiBadRequestResponse(INVALID)
  @ApiServiceUnavailableResponse(UNAVAILABLE)
  @SerializeOptions({ schema: catalogueSearchResultSchema })
  searchCatalogue(
    @Query({ schema: catalogueSearchQuerySchema }) query: CatalogueSearchQuery,
  ): Promise<CatalogueSearchResult> {
    return this.catalogue.searchCatalogue(catalogueSearchOf(query));
  }

  @Get('experiments/:experimentId')
  @ApiOperation({
    summary: 'One published experiment (PU-06)',
    description: 'The live version only; unknown or unpublished → 404 (PU-15).',
  })
  @ApiOkResponse({ description: 'The experiment page', standardSchema: publicExperimentPageSchema })
  @ApiBadRequestResponse(INVALID)
  @ApiNotFoundResponse(problemResponse(404, 'The experiment is not in the public catalogue'))
  @ApiServiceUnavailableResponse(UNAVAILABLE)
  @SerializeOptions({ schema: publicExperimentPageSchema })
  getExperiment(
    @Param('experimentId', { schema: catalogueExperimentParamSchema }) experimentId: string,
  ): Promise<PublicExperimentPage> {
    return this.catalogue.getExperiment(unsafeBrand<ExperimentId>(experimentId));
  }
}
