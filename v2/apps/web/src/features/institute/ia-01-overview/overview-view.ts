/**
 * IA-01's pure view rules (B2-01): each "Needs your attention" fact as the row the board draws —
 * icon, tone, title, line and its one action, or no action where the page it opens is not built
 * yet (state-copy `IA-01.not-rendered`) — and the header's actions for a status. Since Phase 3
 * "Request renewal" opens Requests (IA-17) and the device-request row (computed from IA-18's
 * read; state-copy `IA-01.device-row`, P3-07) opens Device requests.
 */
import type { InstituteAttention } from '@xr/contracts/draft';
import type { InstitutionStatus } from '@xr/domain';
import type { IconName, RowTone } from '@xr/ui';

import {
  endingSoonLine,
  endingSoonTitle,
  notGivenLine,
  notGivenTitle,
  noCodeTitle,
  OVERVIEW_WORDS,
  planEndedItemLine,
  planEndedItemTitle,
  waitingTitle,
  withoutAccessLine,
  withoutAccessTitle,
} from '@/copy/institute-home';
import { deviceRowLine, deviceRowTitle, REQUEST_ACTIONS } from '@/copy/institute-requests';
import {
  COURSE_CODES_ADDRESS,
  giveAccessAddress,
  INSTITUTE_HELP_ADDRESS,
  PEOPLE_ADDRESS,
  STUDENT_ACCESS_ADDRESS,
} from '@/nav/institute';
import { DEVICE_REQUESTS_ADDRESS, INSTITUTE_REQUESTS_ADDRESS } from '@/nav/institute-requests';

export interface AttentionRowView {
  readonly key: string;
  readonly icon: IconName;
  readonly tone?: RowTone;
  readonly title: string;
  readonly sub: string;
  /** The row's one action; `null` where it opens a screen not built yet. */
  readonly action: { readonly href: string; readonly label: string } | null;
}

/** The device requests waiting on the Institute Admin, as IA-01's row needs them (B2-01 f7). */
export interface WaitingDeviceRequests {
  readonly count: number;
  /** The newest request's student and when it was made. */
  readonly newest: { readonly student: string; readonly requestedAt: string };
}

/** The kinds B2-01 f7 draws below the device-request row ("Students have no access yet" …). */
const AFTER_DEVICE_ROW: ReadonlySet<InstituteAttention['kind']> = new Set([
  'experiment-not-given',
  'students-without-access',
  'course-without-code',
]);

/** At most six rows (B2-01 f7 "at most six rows"; BR-138). */
const MAX_ROWS = 6;

/**
 * One B2-01 row per attention fact, in the service's order (at most six, BR-138), with the
 * device-request row where B2-01 f7 places it — after the licence waits, before the students
 * without access — while the paused or ended item does not stand alone (state-copy
 * `IA-01.device-row`).
 */
export function attentionRows(
  items: readonly InstituteAttention[],
  devices: WaitingDeviceRequests | null = null,
): AttentionRowView[] {
  const rows = items.map((item, index): AttentionRowView => {
    const key = `${item.kind}-${index}`;
    switch (item.kind) {
      case 'institution-paused':
        // f5: the only item while paused; "Help" opens the workspace's Help & support.
        return {
          key,
          icon: 'paused',
          tone: 'wait',
          title: OVERVIEW_WORDS.pausedTitle,
          sub: OVERVIEW_WORDS.pausedLine,
          action: { href: INSTITUTE_HELP_ADDRESS, label: OVERVIEW_WORDS.help },
        };
      case 'plan-ending-soon':
        // f3, f7: "Request renewal" opens Requests (IA-17, Phase 3).
        return {
          key,
          icon: 'clock',
          tone: 'wait',
          title: endingSoonTitle(item.planId, item.daysLeft),
          sub: endingSoonLine(item.endsOn),
          action: { href: INSTITUTE_REQUESTS_ADDRESS, label: REQUEST_ACTIONS.requestRenewal },
        };
      case 'plan-ended':
        // f4: "Request renewal" opens Requests (IA-17, Phase 3).
        return {
          key,
          icon: 'notAvailable',
          title: planEndedItemTitle(item.planId),
          sub: planEndedItemLine(item.endedOn),
          action: { href: INSTITUTE_REQUESTS_ADDRESS, label: REQUEST_ACTIONS.requestRenewal },
        };
      case 'students-waiting-for-a-licence':
        return {
          key,
          icon: 'clock',
          tone: 'wait',
          title: waitingTitle(item.students),
          sub: item.experimentName,
          action: { href: STUDENT_ACCESS_ADDRESS, label: OVERVIEW_WORDS.viewStudents },
        };
      case 'experiment-not-given':
        return {
          key,
          icon: 'warning',
          tone: 'wait',
          title: notGivenTitle(item.experimentName),
          sub: notGivenLine(item.courseCode, item.planId),
          action: {
            href: giveAccessAddress({ course: item.courseId, experiment: item.experimentId }),
            label: OVERVIEW_WORDS.giveAccess,
          },
        };
      case 'students-without-access':
        return {
          key,
          icon: 'studentAccess',
          title: withoutAccessTitle(item.students),
          sub: withoutAccessLine(item.lastAddedHow, item.lastAddedOn),
          action: { href: PEOPLE_ADDRESS, label: OVERVIEW_WORDS.reviewStudents },
        };
      case 'course-without-code':
        // f0: "Add course code" opens Course codes (IA-16, Package 2B).
        return {
          key,
          icon: 'courseCodes',
          title: noCodeTitle(item.courseCode),
          sub: OVERVIEW_WORDS.courseCodesPlace,
          action: { href: COURSE_CODES_ADDRESS, label: OVERVIEW_WORDS.addCourseCode },
        };
    }
  });
  const alone = items.some(
    (item) => item.kind === 'institution-paused' || item.kind === 'plan-ended',
  );
  if (devices === null || devices.count === 0 || alone) return rows;
  // f7: "1 device request to forward to BITS" · "From Imran Shaikh · 18 Sep 2027" · "Open requests",
  // which opens Device requests (IA-18; P3-07: the annotation's target over the canvas href).
  const deviceRow: AttentionRowView = {
    key: 'device-requests',
    icon: 'myDevice',
    tone: 'info',
    title: deviceRowTitle(devices.count),
    sub: deviceRowLine(devices.newest.student, devices.newest.requestedAt),
    action: { href: DEVICE_REQUESTS_ADDRESS, label: REQUEST_ACTIONS.openRequests },
  };
  const at = items.findIndex((item) => AFTER_DEVICE_ROW.has(item.kind));
  const placed =
    at < 0 ? [...rows, deviceRow] : [...rows.slice(0, at), deviceRow, ...rows.slice(at)];
  // The service gives at most six; the added row keeps the list at six (the last one gives way).
  return placed.slice(0, Math.max(MAX_ROWS, rows.length));
}

/**
 * B2-01's header actions: "Add students" and "Give students access" while access is active or
 * ending soon (f0, f3); "Add students" alone once it has ended (f4: "Give students access is
 * withdrawn from the header"); none while paused (f5) or before access is active (f1).
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
