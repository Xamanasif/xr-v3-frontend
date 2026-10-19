import type { AccessPlanStatus, InstitutionStatus } from '@xr/domain';
import { StatusPill, type StatusTone } from '@xr/ui/v3';

import { institutionWords, planWords, wordsOf } from '@/copy/flow-state-words';

/**
 * An institution's status as the Super Admin reads it (SA-06 "Status" column, SA-07 head, facts
 * and plan bands): the role-relative words and the V3 Refined B tone the Super Admin export draws
 * (`SA.INST_KIND`): Access active `ok`, Ending soon and Approved — payment required `warn`,
 * Access paused `paused`, Access ended `ended`.
 */
const TONE: Readonly<Record<InstitutionStatus, StatusTone>> = {
  'access-active': 'ok',
  'ending-soon': 'warn',
  'approved-payment-required': 'warn',
  'access-paused': 'paused',
  'access-ended': 'ended',
};

/** A plan's own status in its band (the export's `plst`): Active, Ending soon, Paused, Ended. */
const PLAN_TONE: Readonly<Record<AccessPlanStatus, StatusTone>> = {
  'access-active': 'ok',
  'ending-soon': 'warn',
  paused: 'paused',
  'access-ended': 'ended',
};

export function institutionStatusWords(status: InstitutionStatus): string {
  return wordsOf(institutionWords(status)) ?? status;
}

export function InstitutionStatusPill({
  status,
  large = false,
}: {
  readonly status: InstitutionStatus;
  /** The record head's larger pill (`rk-st-lg`). */
  readonly large?: boolean;
}) {
  return (
    <StatusPill tone={TONE[status]} {...(large ? { size: 'lg' as const } : {})}>
      {institutionStatusWords(status)}
    </StatusPill>
  );
}

export function PlanStatusPill({ status }: { readonly status: AccessPlanStatus }) {
  return <StatusPill tone={PLAN_TONE[status]}>{wordsOf(planWords(status)) ?? status}</StatusPill>;
}
