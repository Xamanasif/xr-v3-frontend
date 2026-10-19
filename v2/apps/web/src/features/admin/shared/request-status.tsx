import type { RequestStatus } from '@xr/domain';
import { StatusPill, type StatusTone } from '@xr/ui/v3';

import { requestWords, wordsOf } from '@/copy/flow-state-words';

/**
 * A request's status as the Super Admin reads it (SA-02 "Status" column, SA-03 page head and
 * decided panel), in the V3 status grammar of the Super Admin export (`SA.REQ_KIND`): Under review
 * `info`, Information requested `err`, Approved — payment required and Payment not confirmed
 * `warn`, Access active `ok`. "Payment failed" is not drawn for this reader: the failed tone of
 * B1-08 f7, PROVISIONAL.
 */
const TONE: Readonly<Record<RequestStatus, StatusTone>> = {
  'under-review': 'info',
  'information-requested': 'err',
  'approved-payment-required': 'warn',
  'payment-not-confirmed': 'warn',
  'payment-failed': 'err',
  'access-active': 'ok',
};

export function requestStatusWords(status: RequestStatus): string {
  // The Super Admin's words never depend on the review-start fact (B1-10, B1-11).
  return wordsOf(requestWords({ status, reviewStarted: true }, 'super_admin')) ?? status;
}

/** The status pill (`span.xr-st`); `lg` on a record head and a decided panel (`rk-st-lg`). */
export function RequestStatusPill({
  status,
  size,
}: {
  readonly status: RequestStatus;
  readonly size?: 'lg';
}) {
  return (
    <StatusPill tone={TONE[status]} size={size}>
      {requestStatusWords(status)}
    </StatusPill>
  );
}
