import type { InstitutionStatus } from '@xr/domain';
import { StatusPill, type StatusTone } from '@xr/ui';

import { institutionWords, wordsOf } from '@/copy/flow-state-words';

/**
 * An institution's status as the Super Admin reads it (B7-02 "Status" column, B7-03 page header,
 * summary and plan rows): the words and the tone the boards draw — Access active `ok`, Ending soon
 * and Approved — payment required `wait`, Access paused `paused`, Access ended `off` (B7-02 / B7-03
 * script `stk`).
 */
const TONE: Readonly<Record<InstitutionStatus, StatusTone>> = {
  'access-active': 'ok',
  'ending-soon': 'wait',
  'approved-payment-required': 'wait',
  'access-paused': 'paused',
  'access-ended': 'off',
};

export function institutionStatusWords(status: InstitutionStatus): string {
  return wordsOf(institutionWords(status)) ?? status;
}

export function InstitutionStatusPill({ status }: { readonly status: InstitutionStatus }) {
  return <StatusPill tone={TONE[status]}>{institutionStatusWords(status)}</StatusPill>;
}
