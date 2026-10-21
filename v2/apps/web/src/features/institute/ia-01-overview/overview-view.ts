/**
 * IA-01's pure view rules in the V3 design (IA-v1 `Main.dc.html` IA-01, its script's `attention`
 * and `vm01core`): each "Needs your attention" fact the service derives becomes the lead band (the
 * pause, a plan ending soon, a plan that has ended) or a counted item (the count, the words, the
 * line and one quiet action), the device requests waiting on the Institute Admin join the items,
 * and the head's actions follow the status. Nothing here changes a record: every action opens the
 * page where it is handled.
 */
import type { ContentAccessRow, InstituteAttention } from '@xr/contracts/draft';
import type { InstitutionStatus } from '@xr/domain';

import { REQUEST_ACTIONS } from '@/copy/institute-requests';
import {
  addedOnLine,
  deviceLine,
  deviceTitle,
  endedLine,
  noCodeLine,
  noCodeTitle,
  notGivenTitle,
  OVERVIEW_WORDS,
  renewalLine,
  waitingTitle,
  withoutAccessTitle,
} from '@/copy/institute-home';
import {
  COURSE_CODES_ADDRESS,
  giveAccessAddress,
  INSTITUTE_HELP_ADDRESS,
  PEOPLE_ADDRESS,
  STUDENT_ACCESS_ADDRESS,
} from '@/nav/institute';
import { DEVICE_REQUESTS_ADDRESS, INSTITUTE_REQUESTS_ADDRESS } from '@/nav/institute-requests';

import { calendarDateOf } from '../ia-02-content-access/plan-facts';

/** One action of the attention list: its words and its page. */
export interface AttentionAction {
  readonly href: string;
  readonly label: string;
}

/** The lead band (`div.rb-lead`): the pause, a plan ending soon, a plan that has ended. */
export interface AttentionLeadView {
  readonly key: string;
  readonly tone: 'due' | 'paused' | 'off';
  readonly title: string;
  readonly line: string;
  readonly action: AttentionAction;
}

/** One counted item (`li.ia-att-item`). */
export interface AttentionItemView {
  readonly key: string;
  readonly count: number;
  readonly title: string;
  readonly line: string;
  readonly action: AttentionAction;
}

export interface AttentionView {
  readonly leads: readonly AttentionLeadView[];
  readonly items: readonly AttentionItemView[];
  /** The lead bands and the items together ("3 items"); nothing: the calm state. */
  readonly count: number;
}

/** The device requests waiting on the Institute Admin, as IA-01's item needs them. */
export interface WaitingDeviceRequests {
  readonly count: number;
  /** The newest request's student and when it was made. */
  readonly newest: { readonly student: string; readonly requestedAt: string };
}

/** The kinds the device item goes before (it follows the licence waits, as before). */
const AFTER_DEVICE_ROW: ReadonlySet<InstituteAttention['kind']> = new Set([
  'experiment-not-given',
  'students-without-access',
  'course-without-code',
]);

/** At most six rows, the lead bands included (BR-138). */
const MAX_ROWS = 6;

type Row =
  | { readonly kind: 'lead'; readonly lead: AttentionLeadView }
  | { readonly kind: 'item'; readonly item: AttentionItemView };

/** The course's name, from Content access (the service names the course by its code only). */
function courseNameOf(content: readonly ContentAccessRow[], courseId: string): string | null {
  return content.find((row) => row.course.id === courseId)?.course.name ?? null;
}

/**
 * The attention list: one row per fact in the service's order (at most six, BR-138), the pause
 * and the plan's term as lead bands, and the device requests' item before the students without
 * access — none while the pause or an ended plan stands alone.
 */
export function attentionView(
  facts: readonly InstituteAttention[],
  devices: WaitingDeviceRequests | null,
  content: readonly ContentAccessRow[],
  today: string | null,
): AttentionView {
  const rows = facts.map((fact, index): Row => {
    const key = `${fact.kind}-${index}`;
    switch (fact.kind) {
      case 'institution-paused':
        return {
          kind: 'lead',
          lead: {
            key,
            tone: 'paused',
            title: OVERVIEW_WORDS.pausedTitle,
            line: OVERVIEW_WORDS.pausedLine,
            action: { href: INSTITUTE_HELP_ADDRESS, label: OVERVIEW_WORDS.help },
          },
        };
      case 'plan-ending-soon':
        return {
          kind: 'lead',
          lead: {
            key,
            tone: 'due',
            title: OVERVIEW_WORDS.renewalTitle,
            line: renewalLine(fact.endsOn, today),
            action: { href: INSTITUTE_REQUESTS_ADDRESS, label: REQUEST_ACTIONS.requestRenewal },
          },
        };
      case 'plan-ended':
        return {
          kind: 'lead',
          lead: {
            key,
            tone: 'off',
            title: OVERVIEW_WORDS.endedTitle,
            line: endedLine(fact.endedOn),
            action: { href: INSTITUTE_REQUESTS_ADDRESS, label: REQUEST_ACTIONS.requestRenewal },
          },
        };
      case 'students-waiting-for-a-licence':
        return {
          kind: 'item',
          item: {
            key,
            count: fact.students,
            title: waitingTitle(fact.students),
            line: fact.experimentName,
            action: { href: STUDENT_ACCESS_ADDRESS, label: OVERVIEW_WORDS.viewStudents },
          },
        };
      case 'experiment-not-given':
        return {
          kind: 'item',
          item: {
            key,
            count: 1,
            title: notGivenTitle(1),
            line: fact.experimentName,
            action: {
              href: giveAccessAddress({ course: fact.courseId, experiment: fact.experimentId }),
              label: OVERVIEW_WORDS.giveAccess,
            },
          },
        };
      case 'students-without-access':
        return {
          kind: 'item',
          item: {
            key,
            count: fact.students,
            title: withoutAccessTitle(fact.students),
            line: addedOnLine(fact.lastAddedOn, today),
            action: { href: PEOPLE_ADDRESS, label: OVERVIEW_WORDS.reviewStudents },
          },
        };
      case 'course-without-code':
        return {
          kind: 'item',
          item: {
            key,
            count: 1,
            title: noCodeTitle(1),
            line: noCodeLine(fact.courseCode, courseNameOf(content, fact.courseId)),
            action: { href: COURSE_CODES_ADDRESS, label: OVERVIEW_WORDS.addCourseCode },
          },
        };
    }
  });
  const alone = facts.some(
    (fact) => fact.kind === 'institution-paused' || fact.kind === 'plan-ended',
  );
  let placed = rows;
  if (devices !== null && devices.count > 0 && !alone) {
    const deviceRow: Row = {
      kind: 'item',
      item: {
        key: 'device-requests',
        count: devices.count,
        title: deviceTitle(devices.count),
        line: deviceLine(
          devices.newest.student,
          devices.count - 1,
          calendarDateOf(devices.newest.requestedAt),
          today,
        ),
        action: { href: DEVICE_REQUESTS_ADDRESS, label: REQUEST_ACTIONS.openRequests },
      },
    };
    const at = facts.findIndex((fact) => AFTER_DEVICE_ROW.has(fact.kind));
    placed = at < 0 ? [...rows, deviceRow] : [...rows.slice(0, at), deviceRow, ...rows.slice(at)];
    // The service gives at most six; the added row keeps the list at six (the last one gives way).
    placed = placed.slice(0, Math.max(MAX_ROWS, rows.length));
  }
  const leads = placed.flatMap((row) => (row.kind === 'lead' ? [row.lead] : []));
  const items = placed.flatMap((row) => (row.kind === 'item' ? [row.item] : []));
  return { leads, items, count: placed.length };
}

/**
 * The head's actions: "Add students" and "Give students access" while access is active or ending
 * soon; "Add students" alone once it has ended; none while paused or before access is active.
 */
export function headerActions(status: InstitutionStatus): {
  readonly addStudents: boolean;
  readonly giveAccess: boolean;
} {
  switch (status) {
    case 'access-active':
    case 'ending-soon':
      return { addStudents: true, giveAccess: true };
    case 'access-ended':
      return { addStudents: true, giveAccess: false };
    case 'access-paused':
    case 'approved-payment-required':
      return { addStudents: false, giveAccess: false };
  }
}
