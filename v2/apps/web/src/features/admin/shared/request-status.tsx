import type { RequestStatus } from '@xr/domain';
import { StatusPill, type StatusTone } from '@xr/ui';

import { requestWords, wordsOf } from '@/copy/flow-state-words';

/**
 * A request's status as the Super Admin reads it (B1-10 "Status" column, B1-11 page header and
 * decided panel): the role-relative words and the tone each board draws — Under review `info`,
 * Information requested `err`, Approved — payment required and Payment not confirmed `wait`,
 * Access active `ok` (B1-10 `isInfo`/`isErr`/`isWait`/`isOk`; B1-11 `statusFor`). "Payment
 * failed" is not drawn for this reader: the failed tone of B1-08 f7, PROVISIONAL.
 */
const TONE: Readonly<Record<RequestStatus, StatusTone>> = {
  'under-review': 'info',
  'information-requested': 'err',
  'approved-payment-required': 'wait',
  'payment-not-confirmed': 'wait',
  'payment-failed': 'err',
  'access-active': 'ok',
};

export function requestStatusWords(status: RequestStatus): string {
  // The Super Admin's words never depend on the review-start fact (B1-10, B1-11).
  return wordsOf(requestWords({ status, reviewStarted: true }, 'super_admin')) ?? status;
}

export function RequestStatusPill({ status }: { readonly status: RequestStatus }) {
  return <StatusPill tone={TONE[status]}>{requestStatusWords(status)}</StatusPill>;
}
