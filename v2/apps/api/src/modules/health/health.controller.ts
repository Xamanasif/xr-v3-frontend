import { Controller, Get, Query, SerializeOptions } from '@nestjs/common';
import { ApiBadRequestResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  type HealthQuery,
  type HealthResponse,
  healthQuerySchema,
  healthResponseSchema,
} from '@xr/contracts';

import { problemResponse } from '../../common/openapi/problem-response.js';
import { HealthService } from './health.service.js';

/**
 * The health route is also the Phase 0 proof of the contract mechanism: the SAME Zod
 * schemas validate the request (`@Query({ schema })` + `StandardSchemaValidationPipe`),
 * validate the response (`@SerializeOptions({ schema })` + `StandardSchemaSerializerInterceptor`)
 * and are published in the OpenAPI document (`ApiOkResponse({ standardSchema })`).
 */
@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get()
  @ApiOperation({
    summary: 'Service health',
    description:
      'Liveness and dependency summary. The database check is "skipped" when no DATABASE_URL is configured or when `database=skip` is requested.',
  })
  @ApiOkResponse({ description: 'Health summary', standardSchema: healthResponseSchema })
  @ApiBadRequestResponse(problemResponse(400, 'The query did not satisfy the contract'))
  @SerializeOptions({ schema: healthResponseSchema })
  getHealth(@Query({ schema: healthQuerySchema }) query: HealthQuery): Promise<HealthResponse> {
    return this.health.check(query);
  }
}
