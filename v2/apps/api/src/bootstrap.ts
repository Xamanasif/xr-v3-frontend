import 'reflect-metadata';

import {
  StandardSchemaSerializerInterceptor,
  StandardSchemaValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiEnvSchema, parseEnv } from '@xr/config/env';
import { API_PREFIX, API_VERSION, WIRE_CONTRACTS, toOpenApiSchema } from '@xr/contracts';

import { AppModule, type AppModuleOptions } from './app.module.js';
import { ProblemDetailsFilter } from './common/filters/problem-details.filter.js';
import { problemResponse } from './common/openapi/problem-response.js';
import { wireSchemaConverter } from './common/openapi/wire-schema-converter.js';
import { validationExceptionFactory } from './common/validation/validation-problem.exception.js';
import { ApiConfigService } from './config/config.service.js';
import { readPackageVersion } from './version.js';

export const OPENAPI_UI_PATH = 'api/docs';
export const OPENAPI_JSON_PATH = 'api/docs-json';

export interface CreateAppOptions extends AppModuleOptions {
  /** Fastify request logging (pino). Off in tests. */
  requestLogging?: boolean;
}

/** Build the application exactly as `main.ts` runs it; integration tests reuse this. */
export async function createApp(options: CreateAppOptions = {}): Promise<NestFastifyApplication> {
  const env = parseEnv(apiEnvSchema, options.env ?? process.env);
  const adapter = new FastifyAdapter({
    logger: options.requestLogging ? { level: env.LOG_LEVEL } : false,
  });

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule.register({ env: options.env, additionalModules: options.additionalModules }),
    adapter,
  );

  app.setGlobalPrefix(API_PREFIX);
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: API_VERSION });

  // Validation boundary: Standard Schema (Zod) declared on route parameters; failures
  // become structured RFC 9457 problems through the exception factory.
  app.useGlobalPipes(
    new StandardSchemaValidationPipe({
      transform: true,
      exceptionFactory: validationExceptionFactory,
    }),
  );
  // Serialization boundary: responses are validated against the schema a handler declares.
  app.useGlobalInterceptors(new StandardSchemaSerializerInterceptor(app.get(Reflector)));
  // Error boundary: one sanitised envelope for every error.
  app.useGlobalFilters(new ProblemDetailsFilter());

  const config = app.get(ApiConfigService);
  app.enableCors({ origin: [...config.corsAllowedOrigins] });

  // OpenAPI: every schema declared on a route is converted through `wireSchemaConverter`,
  // which asserts representability and throws — boot fails rather than publishing a
  // weakened contract. Every registered wire contract is also published as a named
  // component, drafts marked as such, so native clients can code against contracts
  // that no operation serves yet.
  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('XR Simulation Learning Platform API')
      .setDescription(
        'Language-neutral contract of the platform API. Every client — web, AR, VR, MR — codes against this document.',
      )
      .setVersion(readPackageVersion())
      .addGlobalResponse(
        problemResponse(500, 'Unexpected server error (sanitised; see request id)'),
      )
      .build(),
    { standardSchemaConverter: wireSchemaConverter },
  );
  const components = (document.components ??= {});
  const schemas: Record<string, unknown> = { ...components.schemas };
  for (const contract of WIRE_CONTRACTS) {
    schemas[contract.name] = {
      ...toOpenApiSchema(contract.schema, { io: contract.io }),
      description:
        contract.status === 'draft'
          ? `DRAFT — no operation serves this yet. ${contract.description}`
          : contract.description,
      'x-status': contract.status,
    };
  }
  components.schemas = schemas as typeof components.schemas;

  SwaggerModule.setup(OPENAPI_UI_PATH, app, document, {
    jsonDocumentUrl: OPENAPI_JSON_PATH,
    yamlDocumentUrl: 'api/docs-yaml',
  });

  return app;
}
