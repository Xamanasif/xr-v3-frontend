/**
 * M15 Student access grant (SACC), the supplied licence wait and the open gate (Appendix C §2).
 * Entitlement is written only by the Institute Admin; formats are inherited from the plan item,
 * never stored on a grant (LD-1). "Waiting for a licence" is a supplied fact, never computed
 * (T-06, D7). An undecided gate case is `policy-open` with its decision id — no can / can't
 * statement (OD-B2-01 interim DV-1; WP-0.9).
 */
import {
  GRANT_DISPLAY_STATUSES,
  GRANT_STATES,
  type GrantTarget,
  type OpenGate,
  type OpenRefusal,
  type ProvidedLicenceWait,
  type StudentAccessGrant,
} from '@xr/domain';
import { z } from 'zod';

import {
  accessPlanId,
  actorRef,
  experimentId,
  groupId,
  historyOf,
  institutionId,
  isoInstant,
  personId,
  recordMeta,
  studentAccessGrantId,
} from '../kernel/primitives.js';
import { typedAs, vocabulary } from '../kernel/typed.js';

/**
 * The Student open gate's refusals (Appendix C M15). Appendix C also lists `overlap-policy-open`;
 * WP-0.9 answers that case `policy-open` with decision OD-B2-01 instead (DV-1), so it is not a
 * refusal code here (provisional register).
 */
export const OPEN_REFUSALS = vocabulary<OpenRefusal>()([
  'not-given',
  'no-longer-given',
  'institution-paused',
  'access-ended',
  'student-inactive',
  'waiting-for-a-licence',
  'format-not-in-plan',
  'format-not-published',
]);

export const openRefusal = z.enum(OPEN_REFUSALS);
export const grantState = z.enum(GRANT_STATES);
export const grantDisplayStatus = z.enum(GRANT_DISPLAY_STATUSES);

export const grantTarget = typedAs<GrantTarget>()(
  z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('student'), studentId: personId }),
    z.object({ kind: z.literal('group'), groupId }),
  ]),
);

export const studentAccessGrant = typedAs<StudentAccessGrant>()(
  z.object({
    ...recordMeta,
    id: studentAccessGrantId,
    institutionId,
    accessPlanId,
    experimentId,
    target: grantTarget,
    givenAt: isoInstant,
    givenBy: actorRef,
    state: grantState,
    withdrawal: z.object({ at: isoInstant, by: actorRef, reason: z.string().min(1) }).nullable(),
    history: historyOf(['given', 'withdrawn']),
  }),
);

/**
 * A supplied wait for one Student under one grant. WP-0.9 keeps facts only; the reader-specific
 * words live in copy (Appendix C stores one `message` [PROPOSED]; provisional register).
 */
export const providedLicenceWait = typedAs<ProvidedLicenceWait>()(
  z.object({ grantId: studentAccessGrantId, studentId: personId, since: isoInstant }),
);

export const openGate = typedAs<OpenGate>()(
  z.union([
    z.object({ canOpen: z.literal(true), viaGrantIds: z.array(studentAccessGrantId).min(1) }),
    z.object({ canOpen: z.literal(false), reason: openRefusal }),
    z.object({
      canOpen: z.literal(false),
      reason: z.literal('policy-open'),
      decision: z.string().min(1),
    }),
  ]),
);
