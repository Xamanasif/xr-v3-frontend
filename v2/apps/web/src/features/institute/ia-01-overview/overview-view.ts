/**
 * IA-01's pure view rules (B2-01): each "Needs your attention" fact as the row the board draws —
 * icon, tone, title, line and its one action, or no action where the page it opens is not built
 * in Package 2A (state-copy `IA-01.not-rendered`) — and the header's actions for a status.
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
import {
  giveAccessAddress,
  INSTITUTE_HELP_ADDRESS,
  PEOPLE_ADDRESS,
  STUDENT_ACCESS_ADDRESS,
} from '@/nav/institute';

export interface AttentionRowView {
  readonly key: string;
  readonly icon: IconName;
  readonly tone?: RowTone;
  readonly title: string;
  readonly sub: string;
  /** The row's one action; `null` where it opens a screen not built in Package 2A. */
  readonly action: { readonly href: string; readonly label: string } | null;
}

/** One B2-01 row per attention fact, in the service's order (at most six, BR-138). */
export function attentionRows(items: readonly InstituteAttention[]): AttentionRowView[] {
  return items.map((item, index): AttentionRowView => {
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
        // f3: "Request renewal" opens Requests (IA-17 / IA-18), not built in 2A.
        return {
          key,
          icon: 'clock',
          tone: 'wait',
          title: endingSoonTitle(item.planId, item.daysLeft),
          sub: endingSoonLine(item.endsOn),
          action: null,
        };
      case 'plan-ended':
        // f4: "Request renewal" (IA-17 / IA-18) is not built in 2A.
        return {
          key,
          icon: 'notAvailable',
          title: planEndedItemTitle(item.planId),
          sub: planEndedItemLine(item.endedOn),
          action: null,
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
        // f0: "Add course code" opens Course codes (IA-16), not built in 2A.
        return {
          key,
          icon: 'courseCodes',
          title: noCodeTitle(item.courseCode),
          sub: OVERVIEW_WORDS.courseCodesPlace,
          action: null,
        };
    }
  });
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
