'use client';

/**
 * The public request (Phase-1 Package 1C; B1-07 PU-08 / PU-09, B1-08 PU-10 / PU-12 / PU-13; owner
 * decisions DV-5 / O-05 and TE-4, 14 Oct 2026), through `AccessRequestService`:
 *
 * - `checkPublicRequest` — B1-07 "Review request" checks the form against the request's own rules:
 *   the contract's `publicRequestInput`, the very schema the adapter applies again on Submit. Its
 *   words and summary title come from the drawn catalogue (`PU-08.*`, "There are N problems with
 *   this request"); none is typed here and no rule is repeated.
 * - `requestStatus` — PU-10 / PU-13 / PU-12 at the request's opaque address. The adapter answers
 *   only the browser session holding the request's ticket (for the user session that sent it), or
 *   the signed-in Institute Admin of the requesting institution; anyone else is answered exactly as
 *   an address that names no request, `not-found`, which the pages show as the public not-found
 *   page without reading any detail. The ticket is never an input: the session holds it (ADR-0009).
 * - Sending and paying are commands: `useCommand(ports => ports.accessRequests.submitPublicRequest)`
 *   and `useCommand(ports => ports.accessRequests.startPayment)`; their receipts refresh these
 *   reads (and, after a TE-4 payment, every read of the institution and its plan).
 */
import {
  type FieldError,
  type ProductPorts,
  type PublicRequestInput,
  parseInput,
  publicRequestInput,
  summaryTitleFor,
  toErrorSummary,
  type ValidationFailed,
} from '@xr/contracts/draft';
import type { RequestRouteId } from '@xr/domain';

import { defineQuery, useXrQuery } from './use-xr-query';

/** PU-10 / PU-12: the request at its address, for whoever this tab's session may show it to. */
export const requestStatus = defineQuery({
  family: 'REQ',
  view: 'requester-status',
  deps: ['REQ'],
  // The address is untrusted text: what it names, and who may see it, is the adapter's answer.
  read: (ports: ProductPorts, routeId: string) =>
    ports.accessRequests.getRequestStatus(routeId as RequestRouteId),
});

export function useRequestStatus(routeId: string) {
  return useXrQuery(requestStatus, routeId);
}

/**
 * Whether an answer means "show the public not-found page" (O-05: unknown and not-yours alike,
 * both `not-found`). A `policy-open` answer would be shown the same way: no refusal ever reveals
 * a request.
 */
export function isHidden(error: { readonly kind: string }): boolean {
  return error.kind === 'not-found' || error.kind === 'policy-open';
}

/** The fields of the PU-08 form, by the contract's field names (`publicRequestInput`). */
export type RequestField =
  'institutionName' | 'contactPerson' | 'email' | 'licencesRequested' | 'term' | 'term.endsOn';

/** One field's drawn error, with the words its summary link uses. */
export interface RequestFieldError {
  readonly field: RequestField;
  readonly message: string;
  readonly summaryText: string;
}

export interface RequestCheck {
  readonly title: string;
  readonly errors: readonly RequestFieldError[];
}

const FIELDS: ReadonlySet<string> = new Set([
  'institutionName',
  'contactPerson',
  'email',
  'licencesRequested',
  'term',
  'term.endsOn',
]);

/** The drawn words of a validation failure, in the form's order (B1-07 `reqValidate`). */
export function requestErrors(error: ValidationFailed): RequestCheck {
  const summary = toErrorSummary(error);
  const errors: RequestFieldError[] = [];
  summary.items.forEach((item, index) => {
    const fieldError: FieldError | undefined = error.fieldErrors[index];
    if (!FIELDS.has(item.field) || !item.message || !fieldError) return;
    errors.push({
      field: item.field as RequestField,
      message: item.message,
      summaryText: item.summaryText ?? item.message,
    });
  });
  return { title: summary.title ?? '', errors };
}

/**
 * B1-07: typing in a field, or choosing a term, clears that field's error and its summary line
 * (`delete ne[name]`); the summary's title counts what is left ("There are 4 problems with this
 * request", the catalogue's own title for the form). Nothing else is checked until the next
 * "Review request".
 */
export function withoutField(check: RequestCheck, field: RequestField): RequestCheck {
  const errors = check.errors.filter((error) => error.field !== field);
  if (errors.length === check.errors.length) return check;
  return { title: summaryTitleFor('PU-08', errors.length) ?? '', errors };
}

/**
 * B1-07 "Review request": the form checked by the request's own schema, or `null` when it would
 * be accepted. The adapter checks it again on Submit, with the same words.
 */
export function checkPublicRequest(input: PublicRequestInput): RequestCheck | null {
  const parsed = parseInput(publicRequestInput, input, 'PU-08');
  return parsed.ok ? null : requestErrors(parsed.error);
}
