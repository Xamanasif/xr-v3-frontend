/**
 * The words of the Institute Admin's home and content screens — IA-01 Overview (B2-01), IA-02
 * Content access (B2-02) and IA-03 Access plan (B2-03, frames 0–5) — written from the canonical
 * facts the ports answer (`@xr/contracts/draft` `myOverview`, `contentAccessRow`, `accessPlanView`;
 * the request's history from `requesterRequestView`): read models carry no words. Each entry names
 * the board that draws it (`institute-home.test.ts` finds every drawn phrase on its board); what no
 * board words is a provisional entry of the state-copy register (`state-copy-institute-home.ts`,
 * VD-12). Status words come from the role-relative table (`flow-state-words.ts`).
 *
 * Licence figures are shown as provided — "120 licences", "120 — as approved by BITS" — never
 * counted or derived (T-06 / D7). "1 student" is a count of people given access, never licences.
 */
import type { AccessPlanTerm, Technology } from '@xr/domain';

import { calendarDay } from './dates';
import { formatName } from './flow-state-words';
import { planTermWords } from './institutions';

/** "3 items", "1 item" (B2-01 f0, f3). */
function plural(count: number, one: string, many = `${one}s`): string {
  return `${count} ${count === 1 ? one : many}`;
}

/** "AR", "AR and MR" — formats as the boards write them, joined in words. */
function formatsInWords(formats: readonly Technology[]): string {
  const names = formats.map(formatName);
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} and ${names.at(-1)!}`;
}

/** "Shell-and-Tube Heat Exchanger", "A and B", "A, B and C". */
export function namesInWords(names: readonly string[]): string {
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} and ${names.at(-1)!}`;
}

// ---- shared ----

/** The header actions of B2-01 f0 and B2-02 f0 / B2-03 f0. */
export const INSTITUTE_ACTIONS = {
  addStudents: 'Add students',
  giveStudentsAccess: 'Give students access',
} as const;

/** B2-02 f3 / f4 / f5, B2-03 f3 / f4: the notices of a plan that is ending, has ended, is paused. */
export const PLAN_NOTICES = {
  pausedTitle: 'Read-only while your institution’s access is paused',
  pausedLine: 'You can’t give or withdraw access until BITS lifts the pause.',
  endingSoonLine: 'Renewal reminder due. Ask BITS for a renewal from Requests.',
  contentEndedTitle: 'This plan has ended',
  contentEndedLine: 'Students can’t open its experiments now. You can still see who had access.',
  planEndedLine: 'Students can’t open its experiments now. Your records stay here.',
} as const;

/** B2-02 f3: "Ends on 7 Oct 2027". */
export function endsOnTitle(endsOn: string): string {
  return `Ends on ${calendarDay(endsOn)}`;
}

/** B2-03 f3: "This plan ended on 7 Oct 2027". */
export function planEndedTitle(endsOn: string): string {
  return `This plan ended on ${calendarDay(endsOn)}`;
}

/** "15 days left" (B2-02 f3, B2-03 f2); one day: state-copy `IA-01.one-day`. */
export function daysLeftWords(days: number): string {
  return `${plural(days, 'day')} left`;
}

/** "AR is published but not in your plan" (B2-02 f0); several formats: state-copy `IA-02.not-in-plan`. */
export function notInPlanWords(formats: readonly Technology[]): string {
  return `${formatsInWords(formats)} ${formats.length === 1 ? 'is' : 'are'} published but not in your plan`;
}

// ---- IA-01 Overview (B2-01) ----

export const OVERVIEW_WORDS = {
  attention: 'Needs your attention',
  calmTitle: 'Nothing needs your attention right now.',
  calmLine: 'New items appear here as they come in.',
  noContent: 'No content yet',
  approvedLine:
    'Experiments appear here when your institution’s access is active — after the payment is confirmed.',
  giveAccess: 'Give access',
  reviewStudents: 'Review students',
  // Package 2B: B2-01 f0 "Add course code" (opens IA-16 Course codes).
  addCourseCode: 'Add course code',
  viewStudents: 'View students',
  help: 'Help',
  pausedTitle: 'BITS has paused your institution’s access',
  pausedLine: 'Students can’t open experiments. Pages are read-only until BITS lifts the pause.',
  courseCodesPlace: 'Content access · Course codes',
} as const;

/** "3 items", "1 item" (B2-01 section meta). */
export function itemsWords(count: number): string {
  return plural(count, 'item');
}

/** B2-01 f0 status line: "Access plan ACC-0107 · 120 licences · Yearly, ends 7 Oct 2027". */
export function activeStatusLine(plan: {
  readonly id: string;
  readonly licences: number;
  readonly term: AccessPlanTerm;
  readonly endsOn: string;
}): string {
  return `Access plan ${plan.id} · ${plan.licences} licences · ${planTermWords(plan.term)}, ends ${calendarDay(plan.endsOn)}`;
}

/** B2-01 f3: "Access plan ACC-0107 · 120 licences · ends 7 Oct 2027 — 15 days left". */
export function endingStatusLine(
  plan: { readonly id: string; readonly licences: number; readonly endsOn: string },
  daysLeft: number,
): string {
  return `Access plan ${plan.id} · ${plan.licences} licences · ends ${calendarDay(plan.endsOn)} — ${daysLeftWords(daysLeft)}`;
}

/** B2-01 f4: "Access plan ACC-0107 ended on 7 Oct 2027". */
export function endedStatusLine(plan: { readonly id: string; readonly endsOn: string }): string {
  return `Access plan ${plan.id} ended on ${calendarDay(plan.endsOn)}`;
}

/** B2-01 f5: "Access plan ACC-0107 · paused by BITS on 2 Mar 2027". */
export function pausedStatusLine(planId: string, pausedOn: string): string {
  return `Access plan ${planId} · paused by BITS on ${pausedOn}`;
}

/** B2-01 f1: "Request REQ-0042 · access starts when the payment is confirmed". */
export function approvedStatusLine(reference: string): string {
  return `Request ${reference} · access starts when the payment is confirmed`;
}

/** B2-01 f1: "Request REQ-0042 is approved". */
export function approvedTitle(reference: string): string {
  return `Request ${reference} is approved`;
}

/** B2-01 f0: "Shell-and-Tube Heat Exchanger hasn’t been given to any student". */
export function notGivenTitle(experiment: string): string {
  return `${experiment} hasn’t been given to any student`;
}

/** B2-01 f0: "ME ZG523 · access plan ACC-0107" (no course code: state-copy `IA-01.no-platform-code`). */
export function notGivenLine(courseCode: string | null, planId: string): string {
  return courseCode ? `${courseCode} · access plan ${planId}` : `access plan ${planId}`;
}

/** B2-01 f0 / f7: "12 students have no access yet" (one: state-copy `IA-01.one-student`). */
export function withoutAccessTitle(students: number): string {
  return students === 1 ? '1 student has no access yet' : `${students} students have no access yet`;
}

/** B2-01 f0 "Imported on 8 Oct 2026" / f7 "Added on 15 Sep 2027". */
export function withoutAccessLine(how: 'form' | 'import', on: string): string {
  return `${how === 'import' ? 'Imported' : 'Added'} on ${calendarDay(on)}`;
}

/** B2-01 f0: "ME ZG523 has no course code from your institution". */
export function noCodeTitle(courseCode: string | null): string {
  return courseCode
    ? `${courseCode} has no course code from your institution`
    : 'A course has no course code from your institution';
}

/** B2-01 f3: "Access plan ACC-0107 ends in 15 days" (one day / today: state-copy `IA-01.one-day`). */
export function endingSoonTitle(planId: string, days: number): string {
  return `Access plan ${planId} ends in ${plural(days, 'day')}`;
}

/** B2-01 f3: "Ends 7 Oct 2027 · renewal reminder due" — a state; nothing is sent (T-31). */
export function endingSoonLine(endsOn: string): string {
  return `Ends ${calendarDay(endsOn)} · renewal reminder due`;
}

/** B2-01 f4: "Access plan ACC-0107 has ended". */
export function planEndedItemTitle(planId: string): string {
  return `Access plan ${planId} has ended`;
}

/** B2-01 f4: "Ended 7 Oct 2027 · students can’t open its experiments now". */
export function planEndedItemLine(endedOn: string): string {
  return `Ended ${calendarDay(endedOn)} · students can’t open its experiments now`;
}

/** B2-01 f7: "2 students are waiting for a licence" — supplied waits, never counted (T-06 / D7). */
export function waitingTitle(students: number): string {
  return students === 1
    ? '1 student is waiting for a licence'
    : `${students} students are waiting for a licence`;
}

// ---- IA-02 Content access (B2-02) ----

export const CONTENT_ACCESS_WORDS = {
  title: 'Content access',
  meta: 'What BITS has given your institution to use',
  tabsLabel: 'Content access',
  experimentsTab: 'Experiments',
  searchLabel: 'Search',
  searchPlaceholder: 'Experiment or course',
  statusLabel: 'Status',
  statusOptions: {
    all: 'All statuses',
    active: 'Active',
    ending: 'Ending soon',
    ended: 'Ended',
  },
  clearFilters: 'Clear filters',
  noMatch: 'No experiments match these filters',
  loading: 'Loading content access',
  failedTitle: 'We couldn’t load content access',
  failedLine: 'Nothing has changed. Try again.',
  tryAgain: 'Try again',
  viewPlan: 'View plan',
  codeNotAdded: 'Your institution’s code: not added',
  // Package 2B: B2-02 course head "Add code" (opens IA-16 Course codes).
  addCode: 'Add code',
  yourCode: 'Your code:',
  columns: {
    experiment: 'Experiment',
    formats: 'Formats in your plan',
    status: 'Status',
    studentsGiven: 'Students given access',
    action: 'Action',
  },
  noneYet: 'None yet',
  giveAccess: 'Give access',
  noContent: 'No content yet',
} as const;

/** The B2-02 Status filter, in board order (its `select#Cc-st`). */
export const CONTENT_STATUS_FILTERS = ['all', 'active', 'ending', 'ended'] as const;
export type ContentStatusFilter = (typeof CONTENT_STATUS_FILTERS)[number];

/** B2-02 plan band: "Access plan" + "ACC-0107". */
export const ACCESS_PLAN_LABEL = 'Access plan';

/** B2-02 plan band: "120 licences · Yearly · 8 Oct 2026 – 7 Oct 2027" (+ " · 15 days left"). */
export function planBandLine(
  plan: {
    readonly licences: number;
    readonly term: AccessPlanTerm;
    readonly startsOn: string;
    readonly endsOn: string;
  },
  daysLeft: number | null,
): string {
  const line = `${plan.licences} licences · ${planTermWords(plan.term)} · ${calendarDay(plan.startsOn)} – ${calendarDay(plan.endsOn)}`;
  return daysLeft === null ? line : `${line} · ${daysLeftWords(daysLeft)}`;
}

/** B2-02 "View plan" button name: "View access plan ACC-0107". */
export function viewPlanLabel(planId: string): string {
  return `View access plan ${planId}`;
}

/** B2-02 section name: "Access plan ACC-0107". */
export function accessPlanName(planId: string): string {
  return `Access plan ${planId}`;
}

/** B2-02 table caption: "Experiments held in ME ZG523". */
export function experimentsHeldCaption(courseCode: string): string {
  return `Experiments held in ${courseCode}`;
}

/** B2-02 "Students given access": "1 student", "2 students", "None yet" (its script `studentsText`). */
export function studentsGivenWords(students: number): string {
  return students === 0 ? CONTENT_ACCESS_WORDS.noneYet : plural(students, 'student');
}

/** B2-02 row action name: "Give students access to Shell-and-Tube Heat Exchanger". */
export function giveAccessLabel(experiment: string): string {
  return `Give students access to ${experiment}`;
}

/** B2-02 chips (its script `chips`): "Search: “Distillation”", "Status: Ending soon". */
export function searchChip(search: string): string {
  return `Search: “${search.trim()}”`;
}
export function statusChip(filter: Exclude<ContentStatusFilter, 'all'>): string {
  return `Status: ${CONTENT_ACCESS_WORDS.statusOptions[filter]}`;
}

/**
 * B2-02 count (its script `count`): "1 experiment in 1 course" with no filter applied, "0 of 1
 * experiment" with one (several courses: state-copy `IA-02.count-courses`).
 */
export function contentCountWords(
  shown: number,
  total: number,
  courses: number,
  filtered: boolean,
): string {
  const experiments = plural(total, 'experiment');
  return filtered ? `${shown} of ${experiments}` : `${experiments} in ${plural(courses, 'course')}`;
}

/** B2-02 f6: "Experiments appear here when BITS activates … Request REQ-0042 is approved — payment required." */
export function noContentLine(reference: string): string {
  return `Experiments appear here when BITS activates your institution’s access. Request ${reference} is approved — payment required.`;
}

// ---- IA-03 Access plan (B2-03 f0 … f5) ----

export const ACCESS_PLAN_WORDS = {
  back: 'Content access',
  fromRequest: 'From request',
  gave: 'What BITS gave your institution',
  keys: { licences: 'Licences', term: 'Term', course: 'Course' },
  experimentsCaption: 'Experiments in this plan',
  columns: {
    experiment: 'Experiment',
    formats: 'Formats in your plan',
    notInPlan: 'Published, not in your plan',
    student: 'Student',
    given: 'Given',
    status: 'Status',
  },
  given: 'Students you’ve given access',
  openStudentAccess: 'Open Student access',
  nobodyTitle: 'You haven’t given anyone access yet',
  history: 'History',
  individually: 'individually',
  activated: 'Access activated',
  requestSubmitted: 'Request submitted',
  requestApprovedNote: 'Approved — payment required.',
  paused: 'Access paused by BITS',
  planEnded: 'Plan ended',
} as const;

/** B2-03 title: "Access plan ACC-0107". */
export const planTitle = accessPlanName;

/** B2-03 meta: "Active since 8 Oct 2026, 15:05". */
export function activeSinceWords(activatedAt: string): string {
  return `Active since ${activatedAt}`;
}

/** B2-03 "Licences": "120 — as approved by BITS" (shown as provided, T-06). */
export function licencesWords(licences: number): string {
  return `${licences} — as approved by BITS`;
}

/** B2-03 "Term": "Yearly · 8 Oct 2026 to 7 Oct 2027" (f2: "… · 15 days left"). */
export function termWords(
  plan: { readonly term: AccessPlanTerm; readonly startsOn: string; readonly endsOn: string },
  daysLeft: number | null,
): string {
  const line = `${planTermWords(plan.term)} · ${calendarDay(plan.startsOn)} to ${calendarDay(plan.endsOn)}`;
  return daysLeft === null ? line : `${line} · ${daysLeftWords(daysLeft)}`;
}

/** B2-03 "Course": "ME ZG523 · Thermodynamics & Heat Transfer". */
export function courseWords(platformCode: string | null, name: string): string {
  return platformCode ? `${platformCode} · ${name}` : name;
}

/** B2-03 f0: "Choose students and give them Shell-and-Tube Heat Exchanger. They see the formats in this plan." */
export function nobodyLine(experiments: readonly string[]): string {
  return `Choose students and give them ${namesInWords(experiments)}. They see the formats in this plan.`;
}

/** B2-03 f1 caption: "Students given access under ACC-0107". */
export function givenCaption(planId: string): string {
  return `Students given access under ${planId}`;
}

/** B2-03 f1 "Given": "9 Oct 2026 · individually" (a group: state-copy `IA-03.given-group`). */
export function givenWords(on: string, via: { readonly groupName: string } | null): string {
  return via
    ? `${on} · through the group ${via.groupName}`
    : `${on} · ${ACCESS_PLAN_WORDS.individually}`;
}

/** B2-03 history: "Payment confirmed for REQ-0042. Plan ACC-0107 created." */
export function activatedNote(reference: string, planId: string): string {
  return `Payment confirmed for ${reference}. Plan ${planId} created.`;
}

/** B2-03 history: "Request approved · External". */
export function requestApprovedWhat(route: string): string {
  return `Request approved · ${route}`;
}

/** B2-03 history: "Rahul Verma given Shell-and-Tube Heat Exchanger". */
export function givenWhat(who: string, experiment: string): string {
  return `${who} given ${experiment}`;
}

/** B2-03 history: "SACC-0310 · individually" (a group grant: state-copy `IA-03.history-group`). */
export function givenNote(grantId: string, toGroup: boolean): string {
  return `${grantId} · ${toGroup ? 'group grant' : ACCESS_PLAN_WORDS.individually}`;
}

/** B2-03 history: "9 Oct 2026, 10:20 · Meera Iyer". */
export function whenBy(when: string, who: string | null): string {
  return who ? `${when} · ${who}` : when;
}

/** B2-03 f3 history note: "End of the yearly term." (other terms: state-copy `IA-03.history-ended`). */
export function endOfTermNote(term: AccessPlanTerm): string {
  return term === 'until-date' ? 'End of the term.' : `End of the ${term} term.`;
}

// History lines B2-03 does not draw (state-copy `IA-03.history`, provisional).

/** "Nikhil Bose’s access to Shell-and-Tube Heat Exchanger withdrawn". */
export function withdrawnWhat(who: string, experiment: string): string {
  return `${who}’s access to ${experiment} withdrawn`;
}

/** "Access restored by BITS" (after "Access paused by BITS"). */
export const RESTORED_WHAT = 'Access restored by BITS';

/** "Request approved with changes · External". */
export function approvedWithChangesWhat(route: string): string {
  return `Request approved with changes · ${route}`;
}

/** An activation without a payment (an internal institution): "Plan ACC-0098 created." */
export function createdNote(planId: string): string {
  return `Plan ${planId} created.`;
}
