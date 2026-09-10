import type { ApiResponseOptions } from '@nestjs/swagger';
import { PROBLEM_JSON } from '@xr/contracts';

/** Component name under which the RFC 9457 schema is published once per document. */
export const PROBLEM_DETAILS_SCHEMA_NAME = 'ProblemDetails';

/** OpenAPI response for an error status: `application/problem+json`, referencing the shared schema. */
export function problemResponse(status: number, description: string): ApiResponseOptions {
  return {
    status,
    description,
    content: {
      [PROBLEM_JSON]: {
        schema: { $ref: `#/components/schemas/${PROBLEM_DETAILS_SCHEMA_NAME}` },
      },
    },
  };
}
