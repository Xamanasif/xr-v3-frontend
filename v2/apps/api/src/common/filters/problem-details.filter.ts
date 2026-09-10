import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { PROBLEM_JSON, type ProblemDetails } from '@xr/contracts';
import type { FastifyReply, FastifyRequest } from 'fastify';

import { ValidationProblemException } from '../validation/validation-problem.exception.js';

export interface RequestIdentity {
  readonly id?: string | number;
  readonly method?: string;
  /** The raw request URL, possibly carrying a query string. */
  readonly url?: string;
}

/** The request path only — never the query string, which may carry tokens or filters. */
export function safeInstance(url: string | undefined): string | undefined {
  if (!url) return undefined;
  const end = url.search(/[?#]/);
  return end === -1 ? url : url.slice(0, end);
}

/** Remove any `?query` that a framework message may have copied from the request URL. */
export function stripQueryStrings(text: string): string {
  return text.replace(/\?[^\s"']*/g, '');
}

/** Human-readable RFC 9457 title for a status code, e.g. 404 → "Not Found". */
export function titleFor(status: number): string {
  const name = HttpStatus[status];
  if (typeof name !== 'string') return 'Error';
  return name
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

const GENERIC_SERVER_DETAIL =
  'An unexpected error occurred. The request id identifies it in the server logs.';

/**
 * Translate any thrown value into an RFC 9457 problem body. Pure; unit-tested.
 *
 * Security boundary: a 5xx response never carries the exception's own message —
 * internal hosts, ports, credentials, query strings or stack text stay in the
 * server log, correlated by request id. 4xx messages are meant for clients and
 * are kept, minus any query string.
 */
export function toProblem(exception: unknown, request: RequestIdentity = {}): ProblemDetails {
  const instance = safeInstance(request.url);
  const requestId = request.id === undefined ? undefined : String(request.id);
  const identity = {
    ...(instance !== undefined ? { instance } : {}),
    ...(requestId !== undefined ? { requestId } : {}),
  };

  if (exception instanceof ValidationProblemException) {
    return {
      type: 'about:blank',
      title: 'Validation failed',
      status: HttpStatus.BAD_REQUEST,
      detail: 'The request did not satisfy the contract.',
      ...identity,
      errors: exception.issues.map((issue) => ({ path: issue.path, message: issue.message })),
    };
  }

  if (exception instanceof HttpException) {
    const status = exception.getStatus();
    if (status >= 500) {
      return {
        type: 'about:blank',
        title: titleFor(status),
        status,
        detail: GENERIC_SERVER_DETAIL,
        ...identity,
      };
    }
    const detail =
      status === HttpStatus.NOT_FOUND && request.method !== undefined && instance !== undefined
        ? `No route for ${request.method} ${instance}`
        : clientDetail(exception.getResponse());
    return {
      type: 'about:blank',
      title: titleFor(status),
      status,
      ...(detail !== undefined ? { detail } : {}),
      ...identity,
    };
  }

  return {
    type: 'about:blank',
    title: titleFor(HttpStatus.INTERNAL_SERVER_ERROR),
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    detail: GENERIC_SERVER_DETAIL,
    ...identity,
  };
}

function clientDetail(response: string | object): string | undefined {
  const message =
    typeof response === 'string' ? response : (response as { message?: string | string[] }).message;
  if (message === undefined) return undefined;
  return stripQueryStrings(Array.isArray(message) ? message.join('; ') : message);
}

/** Error boundary: one envelope (`application/problem+json`) for every error the API returns. */
@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemDetailsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const reply = http.getResponse<FastifyReply>();
    const request = http.getRequest<FastifyRequest>();
    const problem = toProblem(exception, {
      id: request.id,
      method: request.method,
      url: request.url,
    });

    if (problem.status >= 500) {
      // Diagnostics stay server-side: the message may name hosts, ports or credentials.
      this.logger.error(
        `Unhandled error on ${request.method} ${safeInstance(request.url) ?? '?'} (request ${String(request.id)})`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    void reply.status(problem.status).header('content-type', PROBLEM_JSON).send(problem);
  }
}
