/**
 * The Institute Admin's statuses in the V3 grammar (`span.xr-st`; the export's `instSt`, `planSt`,
 * `RST` and `PST`): each status the existing reads answer, with the tone the export gives it and
 * the role's own words for it (`flow-state-words.ts`, `institute-people.ts` — the same words the
 * export writes). Shared by the plan (IA-01, IA-02, IA-03), access (IA-04, IA-07, IA-14) and people
 * (IA-06) screens. Statuses no read holds (the export's "Removed from the group", "Joined a group
 * after its grant") are not modelled.
 */
import type {
  AccessPlanStatus,
  GrantDisplayStatus,
  InstitutionStatus,
  StudentDirectoryStatus,
} from '@xr/domain';
import type { StatusTone } from '@xr/ui/v3';

import { grantWords, institutionWords, planWords, wordsOf } from '@/copy/flow-state-words';
import { DIRECTORY_STATUS_WORDS } from '@/copy/institute-people';

/** A status as a pill draws it: the tone and the words. */
export interface IaStatusView {
  readonly tone: StatusTone;
  readonly words: string;
}

/** The institution (`instSt`): active ok, ending and awaiting payment warn, paused, ended. */
export const INSTITUTION_TONE: Readonly<Record<InstitutionStatus, StatusTone>> = {
  'access-active': 'ok',
  'ending-soon': 'warn',
  'approved-payment-required': 'warn',
  'access-paused': 'paused',
  'access-ended': 'ended',
};

/** An access plan (`planSt`): Active ok, Ending soon warn, Paused, Ended. */
export const PLAN_TONE: Readonly<Record<AccessPlanStatus, StatusTone>> = {
  'access-active': 'ok',
  'ending-soon': 'warn',
  paused: 'paused',
  'access-ended': 'ended',
};

/**
 * A grant (`RST`): Active ok, Waiting for a licence warn, Paused, Student inactive / Withdrawn /
 * Access ended ended, and the individual withdrawal plain (its group grant may still give it).
 */
export const GRANT_TONE: Readonly<Record<GrantDisplayStatus, StatusTone>> = {
  active: 'ok',
  'waiting-for-a-licence': 'warn',
  paused: 'paused',
  'student-inactive': 'ended',
  'access-ended': 'ended',
  withdrawn: 'ended',
  'individual-grant-withdrawn': 'neutral',
};

/** A student in People (`PST`): Access active ok, No access yet plain, Inactive ended. */
export const DIRECTORY_TONE: Readonly<Record<StudentDirectoryStatus, StatusTone>> = {
  'access-active': 'ok',
  'no-access-yet': 'neutral',
  inactive: 'ended',
};

export function institutionStatusView(status: InstitutionStatus): IaStatusView {
  return { tone: INSTITUTION_TONE[status], words: wordsOf(institutionWords(status)) ?? status };
}

export function planStatusView(status: AccessPlanStatus): IaStatusView {
  return { tone: PLAN_TONE[status], words: wordsOf(planWords(status)) ?? status };
}

export function grantStatusView(display: GrantDisplayStatus): IaStatusView {
  return { tone: GRANT_TONE[display], words: wordsOf(grantWords(display)) ?? display };
}

export function directoryStatusView(status: StudentDirectoryStatus): IaStatusView {
  return { tone: DIRECTORY_TONE[status], words: DIRECTORY_STATUS_WORDS[status] };
}
