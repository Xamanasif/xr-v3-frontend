/**
 * The drawn refusal codes (`Refused<C>`), one entry per `@xr/domain` `RefusalCode`, with where each
 * code comes from and the words the boards draw for it (Appendix C §3.0 table, re-read against the
 * frozen boards; `refusals.test.ts` checks every quoted line verbatim).
 *
 * - `source: 'appendix-c'` — listed in Appendix C §3.0 (incl. the M15 open-gate refusals).
 * - `source: 'wp-0.9'` — added by WP-0.9 for a refusal the boards draw that Appendix C does not
 *   name. These are PROVISIONAL WP-0.9 readings, not owner-approved (provisional register PC-01);
 *   removing one is a breaking change to the union once an API publishes it.
 *
 * `lines` are the drawn words a screen may show, by where they are drawn. A code with no lines is
 * drawn as an absence (the control is not offered) or as a structured state — never as invented
 * words. Appendix C's `overlap-policy-open` is not a code: WP-0.9 answers that case `policy-open`
 * with decision OD-B2-01 (DV-1).
 */
import type { RefusalCode } from '@xr/domain';

import { vocabulary } from '../kernel/typed.js';

export interface RefusalLine {
  /** The screen (and audience) that draws the words. */
  readonly where: string;
  readonly board: string;
  /** Drawn heading or single line. `{name}` marks a value from the record. */
  readonly text: string;
  /** Drawn supporting line, if any. */
  readonly detail?: string;
}

export interface RefusalEntry {
  readonly source: 'appendix-c' | 'wp-0.9';
  /** How the boards present it when it has no words of its own. */
  readonly presentation: 'message' | 'absent-control' | 'structured';
  readonly evidence: string;
  readonly lines: readonly RefusalLine[];
}

export const REFUSAL_CODES = vocabulary<RefusalCode>()([
  'not-given',
  'no-longer-given',
  'institution-paused',
  'access-ended',
  'student-inactive',
  'waiting-for-a-licence',
  'format-not-in-plan',
  'format-not-published',
  'plan-ended',
  'nothing-held',
  'access-not-active',
  'renewal-scope-not-adjustable',
  'selection-empty',
  'assessment-exists',
  'course-not-assigned',
  'course-has-people-filed',
  'publication-blocked',
  'update-already-open',
  'not-yet-forwarded',
  'transfer-already-open',
  'format-not-completed',
  'hold-must-be-lifted',
  'marks-confirmed',
  'no-attempts-left',
  'previous-not-released',
  'submit-checklist-incomplete',
  'override-not-stuck',
  'wrong-details',
  'last-format-locked',
  'experiment-not-in-plan',
  'already-given',
  'group-empty',
  'route-locked',
  'already-passed',
  'no-authorised-device',
]);

export const REFUSALS = {
  'not-given': {
    source: 'appendix-c',
    presentation: 'message',
    evidence: 'M15 open gate; ST-19',
    lines: [
      {
        where: 'ST-19 (Student)',
        board: '08',
        text: 'This experiment isn’t available to you',
        detail:
          'Your institution hasn’t given you access to it. Experiments you can open are in My courses.',
      },
    ],
  },
  'no-longer-given': {
    source: 'appendix-c',
    presentation: 'message',
    evidence: 'M15 open gate; ST-19',
    lines: [
      {
        where: 'ST-19 (Student)',
        board: '08',
        text: 'You no longer have access to this experiment',
      },
    ],
  },
  'institution-paused': {
    source: 'appendix-c',
    presentation: 'message',
    evidence: 'Appendix C §3.0; B7-04 pause effects; one rule for every IA write (§3.6)',
    lines: [
      {
        where: 'IA-02 / IA-03 / IA-04 (Institute Admin)',
        board: 'B2-04',
        text: 'You can’t give or withdraw access until BITS lifts the pause.',
      },
      {
        where: 'IA-05 (Institute Admin)',
        board: 'B2-05',
        text: 'You can’t give access while your institution’s access is paused',
        detail: 'Students keep their work. You can give access again when BITS lifts the pause.',
      },
      {
        where: 'IA-01 and other IA pages (Institute Admin)',
        board: 'B2-01',
        text: 'Pages are read-only until BITS lifts the pause.',
      },
      {
        where: 'SA-03 (Super Admin)',
        board: 'B1-11',
        text: 'Requests from a paused institution can’t be decided. You can decide this one once the pause ends.',
      },
      {
        where: 'ST-18 (Student)',
        board: 'B3-07',
        text: 'You can’t request a transfer while your institution’s access is paused.',
      },
      {
        where: 'IA-19 (Institute Admin)',
        board: 'B3-09',
        text: 'You can’t forward requests right now',
      },
      {
        where: 'ST-01 / ST-02 (Student)',
        board: 'B7-04',
        text: 'You can’t open experiments right now',
      },
      {
        where: 'ST-19 (Student)',
        board: '08',
        text: 'Your institution’s access is paused',
        detail: 'Your work is kept.',
      },
    ],
  },
  'access-ended': {
    source: 'appendix-c',
    presentation: 'message',
    evidence: 'M15 open gate; ST-19',
    lines: [
      {
        where: 'ST-19 (Student)',
        board: '08',
        text: 'Your institution’s access to this experiment has ended',
      },
    ],
  },
  'student-inactive': {
    source: 'appendix-c',
    presentation: 'message',
    evidence: 'M15 open gate; XS-08',
    lines: [
      {
        where: 'ST-01 (Student)',
        board: 'B2-10',
        text: 'Your account is inactive',
        detail: 'You can’t open experiments until your institution reactivates your account.',
      },
    ],
  },
  'waiting-for-a-licence': {
    source: 'appendix-c',
    presentation: 'message',
    evidence: 'M15; a supplied fact only, never computed (T-06, D7)',
    lines: [
      {
        where: 'ST-07 / ST-08 (Student)',
        board: 'B3-02',
        text: 'No licence is available for you on {plan} right now.',
      },
    ],
  },
  'format-not-in-plan': {
    source: 'appendix-c',
    presentation: 'message',
    evidence: 'M15 per-format words (B2-12)',
    lines: [
      {
        where: 'ST-05 / ST-07 (Student)',
        board: 'B2-12',
        text: 'Not included for your institution',
      },
    ],
  },
  'format-not-published': {
    source: 'appendix-c',
    presentation: 'message',
    evidence: 'M15 per-format words (B2-12, B3-02)',
    lines: [
      {
        where: 'ST-05 / ST-07 (Student)',
        board: 'B2-12',
        text: 'Not available for this experiment',
      },
    ],
  },
  'plan-ended': {
    source: 'appendix-c',
    presentation: 'message',
    evidence: 'B2-05 frame "Access plan ended" (refusal page)',
    lines: [
      {
        where: 'IA-05 (Institute Admin)',
        board: 'B2-05',
        text: 'Access plan {plan} has ended',
        detail:
          'It ended on {date}, so its experiments can’t be given to students. Ask BITS for a renewal.',
      },
    ],
  },
  'nothing-held': {
    source: 'appendix-c',
    presentation: 'message',
    evidence: 'B2-05 frame "No experiments held yet" (refusal page)',
    lines: [
      {
        where: 'IA-05 (Institute Admin)',
        board: 'B2-05',
        text: 'Your institution doesn’t hold any experiments yet',
        detail: 'Experiments appear in Content access when BITS activates your access.',
      },
    ],
  },
  'access-not-active': {
    source: 'appendix-c',
    presentation: 'message',
    evidence: 'B7-03 f3',
    lines: [
      {
        where: 'SA-07 (Super Admin)',
        board: 'B7-03',
        text: 'The Institute Admin is assigned once access is active.',
      },
    ],
  },
  'renewal-scope-not-adjustable': {
    source: 'appendix-c',
    presentation: 'message',
    evidence: 'B1-11 f13',
    lines: [
      {
        where: 'SA-03 (Super Admin)',
        board: 'B1-11',
        text: 'Not available for a renewal — the term continues the current plan.',
      },
    ],
  },
  'selection-empty': {
    source: 'appendix-c',
    presentation: 'absent-control',
    evidence:
      'Appendix C §3.0: the request flow starts at the Selection (B1-06); no words drawn for an empty submit (PROPOSED guard)',
    lines: [],
  },
  'assessment-exists': {
    source: 'appendix-c',
    presentation: 'message',
    evidence: 'B4-04 (with a link to the existing assessment)',
    lines: [
      {
        where: 'FA-07 (Faculty)',
        board: 'B4-04',
        text: 'This experiment already has an assessment',
      },
    ],
  },
  'course-not-assigned': {
    source: 'appendix-c',
    presentation: 'message',
    evidence: 'B5-03 `e1`',
    lines: [
      {
        where: 'VE-03 (Vendor)',
        board: 'B5-03',
        text: '{code} is no longer one of your assigned courses. Choose one of your courses.',
      },
    ],
  },
  'course-has-people-filed': {
    source: 'appendix-c',
    presentation: 'structured',
    evidence:
      'B7-07 f3–f4: the move is blocked while students or Faculty are filed against the course',
    lines: [],
  },
  'publication-blocked': {
    source: 'appendix-c',
    presentation: 'message',
    evidence: 'B6-07',
    lines: [
      {
        where: 'CM-03 (Content Manager)',
        board: 'B6-07',
        text: 'Possible once nothing is missing.',
      },
    ],
  },
  'update-already-open': {
    source: 'appendix-c',
    presentation: 'absent-control',
    evidence: 'B6-08: only "Open update" is offered — never a second, conflicting update',
    lines: [],
  },
  'not-yet-forwarded': {
    source: 'appendix-c',
    presentation: 'message',
    evidence: 'B3-11 f2; B7-10 f14',
    lines: [
      {
        where: 'SA-19 (Super Admin)',
        board: 'B3-11',
        text: 'Not BITS’s to decide yet — shown read-only.',
      },
      {
        where: 'SA-19 (Super Admin)',
        board: 'B7-10',
        text: 'Approve appears only once it is forwarded.',
      },
    ],
  },
  'transfer-already-open': {
    source: 'appendix-c',
    presentation: 'absent-control',
    evidence:
      'B3-07: "Request a device transfer" is hidden while a request is open (OD-B3-03 assumption)',
    lines: [],
  },
  'format-not-completed': {
    source: 'appendix-c',
    presentation: 'absent-control',
    evidence: 'B3-06: no feedback entry until the format is Completed — "No disabled button"',
    lines: [],
  },
  'hold-must-be-lifted': {
    source: 'appendix-c',
    presentation: 'absent-control',
    evidence: 'B7-10 f2: no Release button while held',
    lines: [],
  },
  'marks-confirmed': {
    source: 'appendix-c',
    presentation: 'message',
    evidence: 'B4-09',
    lines: [
      { where: 'FA-19 (Faculty)', board: 'B4-09', text: 'Confirmed marks can’t be changed.' },
    ],
  },
  'no-attempts-left': {
    source: 'appendix-c',
    presentation: 'absent-control',
    evidence: 'B4-13: "Try again" only when not passed and an attempt is left',
    lines: [],
  },
  'previous-not-released': {
    source: 'appendix-c',
    presentation: 'absent-control',
    evidence: 'B4-13 [U]: a second attempt only after a released "Not passed"',
    lines: [],
  },
  'submit-checklist-incomplete': {
    source: 'appendix-c',
    presentation: 'structured',
    evidence: 'B5-05: missing items listed with links; nothing is sent',
    lines: [],
  },
  'override-not-stuck': {
    source: 'appendix-c',
    presentation: 'absent-control',
    evidence:
      'B7-06 f4: no override control for a record someone can act on. The words Appendix C quotes are the frame caption, which is not product copy',
    lines: [],
  },
  'wrong-details': {
    source: 'appendix-c',
    presentation: 'message',
    evidence: 'B1-09 f3 "Wrong details"',
    lines: [
      {
        where: 'XS-01 (sign-in)',
        board: 'B1-09',
        text: 'The e-mail or password isn’t right',
        detail: 'Check both and try again.',
      },
    ],
  },
  'last-format-locked': {
    source: 'appendix-c',
    presentation: 'message',
    evidence: 'B1-06',
    lines: [
      {
        where: 'PU-07 (public)',
        board: 'B1-06',
        text: 'At least one format stays chosen. To take this experiment out, use Remove.',
      },
    ],
  },
  'experiment-not-in-plan': {
    source: 'wp-0.9',
    presentation: 'message',
    evidence: 'B2-05 step 1: published experiments outside the plan can’t be ticked (SACC-04)',
    lines: [{ where: 'IA-05 (Institute Admin)', board: 'B2-05', text: 'Not in your access plan' }],
  },
  'already-given': {
    source: 'wp-0.9',
    presentation: 'message',
    evidence: 'B2-05 picker: "Rahul can’t be ticked again" (SACC-06)',
    lines: [{ where: 'IA-05 (Institute Admin)', board: 'B2-05', text: 'Already has {experiment}' }],
  },
  'group-empty': {
    source: 'wp-0.9',
    presentation: 'message',
    evidence: 'B2-05: an empty group can’t be chosen',
    lines: [
      {
        where: 'IA-05 (Institute Admin)',
        board: 'B2-05',
        text: 'Add members before giving access',
      },
    ],
  },
  'route-locked': {
    source: 'wp-0.9',
    presentation: 'absent-control',
    evidence:
      'B1-10 / B1-11: a classified institution’s route is shown read-only on later requests (REQ-24)',
    lines: [],
  },
  'already-passed': {
    source: 'wp-0.9',
    presentation: 'absent-control',
    evidence: 'B4-13: "Try again" only when not passed (ATT-06; OD-B4-05)',
    lines: [],
  },
  'no-authorised-device': {
    source: 'wp-0.9',
    presentation: 'absent-control',
    evidence: 'Board 06 / B3-07: "My device" only for a Student holding AR, VR or MR (DTR-05)',
    lines: [],
  },
} as const satisfies Readonly<Record<RefusalCode, RefusalEntry>>;

/** The WP-0.9 additions to the Appendix C refusal list (provisional register). */
export const PROVISIONAL_REFUSAL_CODES = REFUSAL_CODES.filter(
  (code) => REFUSALS[code].source === 'wp-0.9',
);
