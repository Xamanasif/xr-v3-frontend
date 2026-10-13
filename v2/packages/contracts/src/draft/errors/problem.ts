/**
 * The future HTTP mapping of `ServiceError` onto RFC 9457 problem details (ADR-0008 decision 3;
 * the committed `problemDetailsSchema`). A CONTRACT DEFINITION ONLY: no HTTP adapter, route or
 * server exists, and nothing here is published as OpenAPI (WP-0.10 authorisation).
 *
 * | kind                                                                  | status |
 * | --------------------------------------------------------------------- | ------ |
 * | not-signed-in                                                         | 401    |
 * | not-permitted                                                         | 403    |
 * | not-found                                                             | 404    |
 * | invalid-state, refused, conflict, stale-version, policy-open          | 409    |
 * | validation-failed (`errors[{path, message}]`)                         | 422    |
 * | unavailable                                                           | 503    |
 *
 * Each kind has its own `type`, a URI reference under the API base path (`/api/v1/problems/<kind>`)
 * — PROVISIONAL: the absolute base is chosen when an API serves the ports. The kind's facts travel
 * as extension members (`why`, `current`, `code`, `currentRev`, `decision`, `summaryTitle`), so the
 * mapping is lossless: `fromProblemDetails(toProblemDetails(e))` equals `e`.
 */
import { API_BASE_PATH } from '../../api.js';
import type { ProblemDetails } from '../../problem.js';
import type { MessageKey } from './messages.js';
import {
  type FieldError,
  type ServiceError,
  type ServiceErrorKind,
  SERVICE_ERROR_KINDS,
} from './service-error.js';

export const PROBLEM_TYPE_BASE = `${API_BASE_PATH}/problems`;

export interface ProblemMapping {
  readonly status: 401 | 403 | 404 | 409 | 422 | 503;
  readonly type: string;
  /** For API readers only; screens never show it (they render the drawn state of the kind). */
  readonly title: string;
}

export const PROBLEM_MAPPING = {
  'not-signed-in': {
    status: 401,
    type: `${PROBLEM_TYPE_BASE}/not-signed-in`,
    title: 'Not signed in',
  },
  'not-permitted': {
    status: 403,
    type: `${PROBLEM_TYPE_BASE}/not-permitted`,
    title: 'Not permitted',
  },
  'not-found': { status: 404, type: `${PROBLEM_TYPE_BASE}/not-found`, title: 'Not found' },
  'invalid-state': {
    status: 409,
    type: `${PROBLEM_TYPE_BASE}/invalid-state`,
    title: 'The record has moved on',
  },
  refused: { status: 409, type: `${PROBLEM_TYPE_BASE}/refused`, title: 'Refused' },
  'validation-failed': {
    status: 422,
    type: `${PROBLEM_TYPE_BASE}/validation-failed`,
    title: 'Validation failed',
  },
  'stale-version': {
    status: 409,
    type: `${PROBLEM_TYPE_BASE}/stale-version`,
    title: 'A newer version exists',
  },
  conflict: { status: 409, type: `${PROBLEM_TYPE_BASE}/conflict`, title: 'Conflict' },
  'policy-open': {
    status: 409,
    type: `${PROBLEM_TYPE_BASE}/policy-open`,
    title: 'An undecided rule was reached',
  },
  unavailable: { status: 503, type: `${PROBLEM_TYPE_BASE}/unavailable`, title: 'Unavailable' },
} as const satisfies Readonly<Record<ServiceErrorKind, ProblemMapping>>;

/** One `errors[]` item: the committed `{path, message}` plus the rule key and its values. */
export interface ProblemFieldError {
  readonly path: string;
  /** The drawn words; where no words are drawn, the rule key (the `key` member is authoritative). */
  readonly message: string;
  readonly key: MessageKey;
  readonly params: Readonly<Record<string, string>>;
}

/** The committed problem document, its `errors[]` items carrying the rule key as well. */
export type ServiceProblem = Omit<ProblemDetails, 'errors'> & {
  readonly errors?: readonly ProblemFieldError[];
  readonly why?: string;
  readonly current?: string;
  readonly code?: string;
  readonly currentRev?: number;
  readonly decision?: string;
  readonly summaryTitle?: string | null;
};

function fieldProblem(error: FieldError): ProblemFieldError {
  return {
    path: error.field,
    message: error.message ?? error.key,
    key: error.key,
    params: error.params,
  };
}

/** The problem document a future API answers for this error. */
export function toProblemDetails(error: ServiceError): ServiceProblem {
  const { status, type, title } = PROBLEM_MAPPING[error.kind];
  const base = { type, title, status };
  switch (error.kind) {
    case 'not-permitted':
      return { ...base, why: error.why };
    case 'invalid-state':
      return { ...base, current: error.current };
    case 'refused':
      return { ...base, code: error.code };
    case 'validation-failed':
      return {
        ...base,
        errors: error.fieldErrors.map(fieldProblem),
        summaryTitle: error.summaryTitle,
      };
    case 'stale-version':
      return { ...base, currentRev: error.currentRev };
    case 'conflict':
      return { ...base, code: error.code };
    case 'policy-open':
      return { ...base, decision: error.decision };
    case 'not-signed-in':
    case 'not-found':
    case 'unavailable':
      return base;
  }
}

function kindOf(problem: ServiceProblem): ServiceErrorKind {
  const kind = SERVICE_ERROR_KINDS.find(
    (candidate) =>
      PROBLEM_MAPPING[candidate].type === problem.type &&
      PROBLEM_MAPPING[candidate].status === problem.status,
  );
  if (!kind) throw new Error(`Not a mapped problem: ${problem.status} ${problem.type}`);
  return kind;
}

function required<T>(value: T | undefined, member: string): T {
  if (value === undefined) throw new Error(`The problem document lacks "${member}".`);
  return value;
}

/** The inverse mapping, so the definition is proven lossless (no adapter uses it yet). */
export function fromProblemDetails(problem: ServiceProblem): ServiceError {
  const kind = kindOf(problem);
  switch (kind) {
    case 'not-permitted':
      return {
        kind,
        why: required(problem.why, 'why') as 'wrong-workspace' | 'out-of-scope' | 'not-own-record',
      };
    case 'invalid-state':
      return { kind, current: required(problem.current, 'current') };
    case 'refused':
      return {
        kind,
        code: required(problem.code, 'code') as Extract<ServiceError, { kind: 'refused' }>['code'],
      };
    case 'validation-failed':
      return {
        kind,
        fieldErrors: required(problem.errors, 'errors').map((item) => ({
          field: item.path,
          key: item.key,
          message: item.message === item.key ? null : item.message,
          params: item.params,
        })),
        summaryTitle: problem.summaryTitle ?? null,
      };
    case 'stale-version':
      return { kind, currentRev: required(problem.currentRev, 'currentRev') };
    case 'conflict':
      return {
        kind,
        code: required(problem.code, 'code') as 'duplicate' | 'already-sent' | 'already-exists',
      };
    case 'policy-open':
      return { kind, decision: required(problem.decision, 'decision') };
    case 'not-signed-in':
    case 'not-found':
    case 'unavailable':
      return { kind };
  }
}
