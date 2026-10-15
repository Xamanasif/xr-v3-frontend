/**
 * The words of the Institute Admin's Student access workflow (Phase-2 Package 2A): IA-04 Student
 * access (B2-04) and IA-05 Give students access (B2-05), written from the canonical facts the
 * ports answer (`@xr/contracts/draft` `grantRow`, `giveAccessOptions`, `plannedGrant`,
 * `grantResult`): read models carry no words. Every string here is drawn on its board — the
 * markup or the board script's own formula (`saView`, `gvView`) — and `student-access.test.ts`
 * finds it there. What no board words is a provisional entry of the state-copy register
 * (`state-copy-student-access.ts`, VD-12), read through `stateWords`.
 *
 * Licences are never counted (T-06, D7): "Waiting for a licence" appears only where the service
 * supplies a wait, and the licence figure is the plan's as provided. Formats are the plan's (LD-1):
 * shown, never chosen. Nothing here says whether a student can still open an experiment after one
 * of two overlapping grants is withdrawn (OD-B2-01; B2-04 f4, B2-13 f8).
 */
import { inDisplayOrder, type Technology } from '@xr/domain';

import { calendarDay } from './dates';
import { formatName } from './flow-state-words';

/** "Rahul" from "Rahul Verma" (B2-04 `n.split(' ')[0]`, B2-05 `x.n.split(' ')[0]`). */
export function firstName(name: string): string {
  return name.split(' ')[0] ?? name;
}

/** "WEB and VR" (B2-05 `D.fmts`): the plan's formats in display order, the last joined by "and". */
export function formatsInWords(formats: readonly Technology[]): string {
  const names = inDisplayOrder(formats).map(formatName);
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} and ${names.at(-1)!}`;
}

// ---- IA-04 Student access (B2-04) ----

/** B2-04 status filter (`Sa-st`), in board order. */
export const STATUS_FILTER = [
  ['all', 'All statuses'],
  ['active', 'Active'],
  ['waiting', 'Waiting for a licence'],
  ['inactive', 'Student inactive'],
] as const;
export type StatusFilter = (typeof STATUS_FILTER)[number][0];

/** B2-04 "How given" filter (`Sa-via`), in board order. */
export const VIA_FILTER = [
  ['all', 'Individually or by group'],
  ['ind', 'Individually'],
  ['grp', 'Through a group'],
] as const;
export type ViaFilter = (typeof VIA_FILTER)[number][0];

export const STUDENT_ACCESS_PAGE = {
  meta: 'Who can open which experiments',
  give: 'Give students access',
  pausedTitle: 'Read-only while your institution’s access is paused',
  pausedLine: 'You can’t give or withdraw access until BITS lifts the pause.',
  searchLabel: 'Search',
  searchPlaceholder: 'Student, ID or experiment',
  statusLabel: 'Status',
  viaLabel: 'How given',
  clearFilters: 'Clear filters',
  caption: 'Student access — one row per student and experiment',
  columns: {
    student: 'Student',
    experiment: 'Experiment',
    formats: 'Formats',
    formatsMarker: '(from your plan)',
    formatsLabel: 'Formats (from your plan)',
    howGiven: 'How given',
    status: 'Status',
    action: 'Action',
  },
  individually: 'Individually',
  withdraw: 'Withdraw…',
  noMatchTitle: 'No rows match these filters',
  emptyTitle: 'No student has access yet',
  emptyLine:
    'Give students the experiments your institution holds. They see the formats in your access plan.',
  loading: 'Loading student access',
  failedTitle: 'We couldn’t load student access',
  failedLine: 'Nothing has changed. Try again.',
  tryAgain: 'Try again',
} as const;

/** B2-04 `viaText` for a group grant: "Group: ME ZG523 — Sem II". */
export function viaGroupWords(groupName: string): string {
  return `Group: ${groupName}`;
}

/** B2-04 `count`: "8 rows · one per student × experiment", "1 of 8 rows · …", "1 student × experiment". */
export function rowCountWords(listed: number, shown: number, filtered: boolean): string {
  return `${filtered ? `${listed} of ${shown}` : shown}${
    shown === 1 ? ' student × experiment' : ' rows · one per student × experiment'
  }`;
}

/** B2-04 chips: "Search: “Rahul”", "Status: Waiting for a licence", "Given through a group". */
export function searchChip(search: string): string {
  return `Search: “${search}”`;
}
export function statusChip(label: string): string {
  return `Status: ${label}`;
}
export function viaChip(via: Exclude<ViaFilter, 'all'>): string {
  return via === 'ind' ? 'Given individually' : 'Given through a group';
}
/** B2-04 `c.aria`: "Remove Search: “Rahul”". */
export function removeChipLabel(label: string): string {
  return `Remove ${label}`;
}

/** B2-04 `wdLabel`: "Show withdrawn (1)". */
export function showWithdrawnLabel(count: number): string {
  return `Show withdrawn (${count})`;
}

/** B2-04 `alsoText`: "Also in ME ZG523 — Sem II, which has this experiment". */
export function alsoInGroupWords(groupName: string): string {
  return `Also in ${groupName}, which has this experiment`;
}

/** B2-04 `wdText`: "Withdrawn 12 Oct 2026". */
export function withdrawnOnWords(date: string): string {
  return `Withdrawn ${date}`;
}

/** B2-04 `wdAria`: the row's Withdraw… named by its student and experiment. */
export function withdrawLabel(name: string, experiment: string, alsoInGroup: boolean): string {
  return alsoInGroup
    ? `Withdraw ${name}’s individual grant for ${experiment}`
    : `Withdraw ${name}’s access to ${experiment}`;
}

/** B2-04 DL-2 "Withdraw…" (`dTitle`, `dBtn`, the reason field, its required-error). */
export const WITHDRAW_DIALOG = {
  titleOnly: 'Withdraw access?',
  confirmOnly: 'Withdraw access',
  confirmAlso: 'Withdraw individual grant',
  busy: 'Withdrawing…',
  cancel: 'Cancel',
  reasonLabel: 'Reason',
  reasonMarker: '(required)',
  reasonHint: 'Kept in the access history, which your institution’s administrators can see.',
  reasonRequired: 'Enter the reason for withdrawing access',
  /** `dOnly`: "<SACC> is <name>’s only grant for <experiment>, so <first> will no longer …". */
  only: {
    is: ' is ',
    onlyGrantFor: '’s only grant for ',
    so: (first: string) =>
      `, so ${first} will no longer be able to open it. Their work is kept, and the grant stays in the access history.`,
  },
  /** `dAlso`: "This withdraws <SACC>, the grant given to <name> individually. …". */
  also: {
    withdraws: 'This withdraws ',
    givenTo: ', the grant given to ',
    individually: ' individually. Their work is kept, and the grant stays in the access history.',
  },
} as const;

/** B2-04 `dTitle` beside a group grant: "Withdraw Rahul Verma’s individual grant?". */
export function withdrawAlsoTitle(name: string): string {
  return `Withdraw ${name}’s individual grant?`;
}

/**
 * B2-04 `dAlso` notice: the group grant that is not changed — the words before the group grant's
 * ID (drawn as `span.xr-id`) and after it.
 */
export function alsoInGroupNotice(
  first: string,
  groupName: string,
  experiment: string,
): { readonly before: string; readonly after: string } {
  return {
    before: `${first} is also in ${groupName}, which has ${experiment} through its own grant, `,
    after: '. Withdrawing this individual grant doesn’t change the group grant.',
  };
}

/** B2-04 `confirm` flash when the grant was the student’s only one for the experiment. */
export function withdrawnOnlyFlash(grantId: string, name: string, experiment: string): string {
  return `Access withdrawn. ${grantId} was ${name}’s only grant for ${experiment}, so ${firstName(name)} can no longer open it. Their work is kept.`;
}

/**
 * B2-04 f4 flash beside a group grant: the group grant is not changed. Nothing says whether the
 * student can still open the experiment (OD-B2-01; B2-13 f8).
 */
export function withdrawnAlsoFlash(
  grantId: string,
  name: string,
  groupName: string,
  groupGrantId: string,
): string {
  return `Individual grant ${grantId} withdrawn. ${firstName(name)} is still in ${groupName}, and the group grant ${groupGrantId} is not changed.`;
}

// ---- IA-05 Give students access (B2-05) ----

export type GiveStep = 'experiments' | 'students' | 'review';

export const GIVE_ACCESS = {
  /** The flow's name: the stepper's label, the top bar, the overline once access is given. */
  title: 'Give students access',
  back: 'Student access',
  steps: ['Experiments', 'Students', 'Review and give access'],
  stepTitles: {
    experiments: 'Choose experiments',
    students: 'Choose students',
    review: 'Review and give access',
  },
  doneTitle: 'Access given',
  doneLine: 'The students below can open the experiment with the formats in your plan.',
  errorTitle: 'Check this step',
  prefillStudent: { before: 'Giving access to ', after: ' — chosen from their student record.' },
  prefillGroup: { before: 'Giving access to the group ', after: '.' },
  // step 1
  planLabel: 'Access plan',
  courseLabel: 'Course',
  experimentsLegend: 'Experiments in your access plan',
  formatsNote:
    'Students get the formats your plan includes for each experiment. You don’t choose formats here.',
  inherit: 'Available to your institution:',
  notInPlanTag: 'Not in your access plan',
  cancel: 'Cancel',
  continue: 'Continue',
  backStep: 'Back',
  // step 2
  giveTo: 'Give access to',
  students: 'Students',
  aGroup: 'A group',
  searchStudents: 'Search students',
  searchStudentsPlaceholder: 'Name or student ID',
  studentsList: 'Students',
  inactive: 'Inactive — can’t be given access',
  noStudentMatch: 'No student matches that search.',
  noStudentsTitle: 'No students yet',
  noStudentsLine: 'Add students to People first. Adding them doesn’t give them any experiments.',
  addStudent: 'Add student',
  groups: 'Groups',
  noMembers: 'No members yet',
  groupEmpty: 'Add members before giving access',
  groupNote:
    'Giving access to a group gives it to the group’s current members. Each member’s status is shown before you confirm.',
  // step 3
  summaryKeys: {
    course: 'Course',
    experiments: 'Experiments',
    formats: 'Formats',
    students: 'Students',
    group: 'Group',
  },
  whatWillBeCreated: 'What will be created',
  licences: 'Licences',
  give: 'Give access',
  giving: 'Giving access…',
  giveFailed: 'Access wasn’t given. Nothing was changed. Try again.',
  // result
  resultList: 'Access given',
  groupResultNote:
    'Recorded for the group’s current members. Each member’s status is on the group page.',
  viewStudentAccess: 'View Student access',
  giveMore: 'Give more access',
  loading: 'Loading your access plan',
  // the selection summary (`xw-sum`, `xw-sumbar`)
  selection: 'Your selection',
  notChosen: 'Not chosen yet',
  noFormats: '—',
  // the message pages (f15, f16, f17)
  paused: {
    title: 'You can’t give access while your institution’s access is paused',
    line: 'Students keep their work. You can give access again when BITS lifts the pause.',
    back: 'Back to Student access',
    help: 'Help',
  },
  nothingHeld: {
    title: 'Your institution doesn’t hold any experiments yet',
    line: 'Experiments appear in Content access when BITS activates your access.',
  },
  contentAccess: 'Content access',
} as const;

/** B2-05 step 1 `xr-ro`: " · Active · 120 licences · ends 7 Oct 2027" (after the plan's id). */
export function planStandingWords(status: string, licences: number, endsOn: string): string {
  return ` · ${status} · ${licences} licences · ends ${calendarDay(endsOn)}`;
}

/** B2-05 step 1 course option: "ME ZG523 — Thermodynamics & Heat Transfer". */
export function courseOptionWords(code: string | null, name: string): string {
  return code ? `${code} — ${name}` : name;
}

/** B2-05 step 3 "Course": "ME ZG523 · Thermodynamics & Heat Transfer". */
export function courseSummaryWords(code: string | null, name: string): string {
  return code ? `${code} · ${name}` : name;
}

/** B2-05 step 1: "Also published in ME ZG523 — not in your access plan". */
export function notInPlanHeading(courseCode: string): string {
  return `Also published in ${courseCode} — not in your access plan`;
}

/** B2-05 `stus` state: "Already has Shell-and-Tube Heat Exchanger". */
export function alreadyHasWords(experiments: readonly string[]): string {
  return `Already has ${experiments.join(', ')}`;
}

/** B2-05 `selCount`: "1 student selected", "3 students selected". */
export function selectedCountWords(count: number): string {
  return count === 1 ? '1 student selected' : `${count} students selected`;
}

/** B2-05 group row `sub`: "7 members" or "No members yet". */
export function memberCountWords(count: number): string {
  return count ? `${count} members` : GIVE_ACCESS.noMembers;
}

/** B2-05 `sumWho` for students: three names, then "and 2 more". */
export function studentsChosenWords(names: readonly string[]): string {
  if (names.length === 0) return GIVE_ACCESS.notChosen;
  const shown = names.slice(0, 3).join(', ');
  return names.length > 3 ? `${shown} and ${names.length - 3} more` : shown;
}

/** B2-05 `sumWho` for a group: "ME ZG523 — Sem II (7 members)". */
export function groupChosenWords(name: string, members: number): string {
  return `${name} (${members} members)`;
}

/** B2-05 `sumFmts`: "WEB and VR — from your access plan". */
export function summaryFormatsWords(formats: readonly Technology[]): string {
  return formats.length
    ? `${formatsInWords(formats)} — from your access plan`
    : GIVE_ACCESS.noFormats;
}

/** B2-05 step 3 Formats: "Inherited from ACC-0107 — not chosen here". */
export function inheritedFromWords(planId: string): string {
  return `Inherited from ${planId} — not chosen here`;
}

/** B2-05 step 3 "Licences": "Access plan ACC-0107 · 120 licences · Yearly, ends 7 Oct 2027". */
export function licencesLineWords(
  planId: string,
  licences: number,
  term: string,
  endsOn: string,
): string {
  return `Access plan ${planId} · ${licences} licences · ${term}, ends ${calendarDay(endsOn)}`;
}

/** B2-05 group review: "Group ME ZG523 — Sem II" (also the group's result line). */
export function groupWho(name: string): string {
  return `Group ${name}`;
}

/** B2-05 `gsum`: the group's members, stated — never computed against licences (T-06, D7). */
export function membersCanOpenWords(count: number): string {
  return `${count} members can open it straight away`;
}
export function memberWaitingWords(name: string): string {
  return `${name} is waiting for a licence`;
}
export function memberHasItWords(name: string, grantId: string): string {
  return `${name} already has it individually (${grantId}). That grant isn’t changed.`;
}
export function memberInactiveWords(name: string): string {
  return `${name} is inactive and can’t open experiments while inactive`;
}

/** B2-05 result note: "Rahul sees it in My courses with WEB and VR." */
export function seesItWords(name: string, formats: readonly Technology[]): string {
  return `${firstName(name)} sees it in My courses with ${formatsInWords(formats)}.`;
}

/** B2-05 result note for a supplied wait: "No licence is available for Fatima on ACC-0107 right now." */
export function noLicenceWords(name: string, planId: string): string {
  return `No licence is available for ${firstName(name)} on ${planId} right now.`;
}

/** B2-05 f16: "Access plan ACC-0107 has ended". */
export function planEndedTitle(planId: string): string {
  return `Access plan ${planId} has ended`;
}

/** B2-05 f16: "It ended on 7 Oct 2027, so its experiments can’t be given to students. …". */
export function planEndedLine(endsOn: string): string {
  return `It ended on ${calendarDay(endsOn)}, so its experiments can’t be given to students. Ask BITS for a renewal.`;
}

/** B2-05 f17: "Request REQ-0042 is approved — payment required." */
export function requestAwaitingPaymentWords(requestId: string): string {
  return `Request ${requestId} is approved — payment required.`;
}
