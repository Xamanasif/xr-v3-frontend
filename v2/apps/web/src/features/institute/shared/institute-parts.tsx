'use client';

import type { AccessPlanStatus, GrantDisplayStatus, InstitutionStatus } from '@xr/domain';
import { Button, Icon, StatusPill, type StatusTone } from '@xr/ui';
import type { ReactNode } from 'react';

import { grantWords, institutionWords, planWords, wordsOf } from '@/copy/flow-state-words';
import { CONTENT_ACCESS_WORDS } from '@/copy/institute-home';

/**
 * Parts the Institute Admin's home and content screens share (IA-01, IA-02, IA-03; boards
 * B2-01 … B2-03): the status chips in the boards' tones and the B2 failed-load state.
 */

/** B2-01 status line: Access active `ok`, Ending soon and Approved — payment required `wait`, Access paused `paused`, Access ended `off`. */
const INSTITUTION_TONE: Readonly<Record<InstitutionStatus, StatusTone>> = {
  'access-active': 'ok',
  'ending-soon': 'wait',
  'approved-payment-required': 'wait',
  'access-paused': 'paused',
  'access-ended': 'off',
};

/** B2-02 plan band and rows, B2-03 header: Active `ok`, Ending soon `wait`, Paused `paused`, Ended `off`. */
const PLAN_TONE: Readonly<Record<AccessPlanStatus, StatusTone>> = {
  'access-active': 'ok',
  'ending-soon': 'wait',
  paused: 'paused',
  'access-ended': 'off',
};

/** B2-03 f1 … f4 and B2-04: Active `ok`, Waiting for a licence `wait`, Paused `paused`, the rest `off`. */
const GRANT_TONE: Readonly<Record<GrantDisplayStatus, StatusTone>> = {
  active: 'ok',
  'waiting-for-a-licence': 'wait',
  paused: 'paused',
  'student-inactive': 'off',
  'access-ended': 'off',
  withdrawn: 'off',
  'individual-grant-withdrawn': 'off',
};

export function InstituteStatusPill({ status }: { readonly status: InstitutionStatus }) {
  return (
    <StatusPill tone={INSTITUTION_TONE[status]}>
      {wordsOf(institutionWords(status)) ?? status}
    </StatusPill>
  );
}

export function PlanStatusPill({ status }: { readonly status: AccessPlanStatus }) {
  return <StatusPill tone={PLAN_TONE[status]}>{wordsOf(planWords(status)) ?? status}</StatusPill>;
}

export function GrantStatusPill({ display }: { readonly display: GrantDisplayStatus }) {
  return (
    <StatusPill tone={GRANT_TONE[display]}>{wordsOf(grantWords(display)) ?? display}</StatusPill>
  );
}

/** Whether a plan's experiments can be given now: its term is live and it is not paused. */
export function isGivable(status: AccessPlanStatus): boolean {
  return status === 'access-active' || status === 'ending-soon';
}

/**
 * B2-02 f9 "Failed + retry": the empty pattern with the failed icon on its red tint, what did not
 * load, "Nothing has changed. Try again." and a primary "Try again" (with the board-02 retry glyph)
 * that reads again. IA-01 and IA-03 draw no failed frame of their own and use the same pattern
 * with their own title (state-copy `IA-01.failed`, `IA-03.failed`).
 */
export function LoadFailed({
  title,
  onRetry,
}: {
  readonly title: ReactNode;
  readonly onRetry: () => void;
}) {
  return (
    <div className="xr-section">
      <div className="xr-empty">
        <span className="xr-empty-icon bg-err-bg text-err">
          <Icon name="failed" />
        </span>
        <h2 className="xr-h3 m-0">{title}</h2>
        <p className="xr-body m-0 text-ink-2">{CONTENT_ACCESS_WORDS.failedLine}</p>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary" icon="tryAgain" onClick={onRetry}>
            {CONTENT_ACCESS_WORDS.tryAgain}
          </Button>
        </div>
      </div>
    </div>
  );
}
