import type { SwaggerDocumentOptions } from '@nestjs/swagger';
import { toOpenApiSchema } from '@xr/contracts';
import type { z } from 'zod';

/**
 * The ONE conversion path from a Standard Schema declared on a route (parameter
 * `schema`, `ApiResponse({ standardSchema })`) to the OpenAPI document. It delegates
 * to `@xr/contracts` `toOpenApiSchema`, which asserts representability first and
 * throws otherwise — so a refinement, transform or other unrepresentable construct on
 * a published schema stops the application at boot instead of weakening the document.
 */
export const wireSchemaConverter: NonNullable<SwaggerDocumentOptions['standardSchemaConverter']> = (
  schema,
  { schemaType },
) => {
  if (!isZodSchema(schema)) {
    throw new Error(
      'OpenAPI publication refused: only Zod wire schemas are supported; other Standard Schema libraries cannot be checked for representability here.',
    );
  }
  return { schema: toOpenApiSchema(schema, { io: schemaType }) };
};

function isZodSchema(schema: unknown): schema is z.ZodType {
  return typeof schema === 'object' && schema !== null && '_zod' in schema;
}
