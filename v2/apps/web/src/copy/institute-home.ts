/**
 * The words of the Institute Admin's plan screens — IA-01 Overview, IA-02 Content access ›
 * Experiments and IA-03 Access plan — in the owner-approved V3 design (design/v3-refined-b/roles/
 * IA-v1, `project/Main.dc.html`: its template and its script's `attention`, `vm01core`, `vm02core`,
 * `vm03`, `termVM` and `fmBadges`), written from the canonical facts the ports answer
 * (`@xr/contracts/draft` `myOverview`, `contentAccessRow`, `accessPlanView`; the request's history
 * from `requesterRequestView`): read models carry no words. `institute-home.test.ts` finds every
 * drawn phrase in the export and each composed line in its script's form; what the export does not
 * word is a provisional entry of the state-copy register (`state-copy-institute-home.ts`, VD-12).
 * Status words come from the role-relative table (`flow-state-words.ts`).
 *
 * No internal reference (ACC-, REQ-, SACC-) is ever written (owner's identifier rule, 21 Oct 2026;
 * state-copy `IA-plan.no-reference`): the plan is "your access plan", the request "your request to
 * BITS", a grant who and how it was given; the references stay in the addresses and keys.
 *
 * Licence figures are shown as provided — "120", "as approved by BITS" — never counted or derived
 * (T-06 / D7). "7 students" is a count of people given access, never licences.
 */
import type { AccessPlanTerm, Technology } from '@xr/domain';

import { calendarDay } from './dates';
import { formatName } from './flow-state-words';
import { iaListText, iaPlural } from './ia-shared';
import { planTermWords } from './institutions';

const LONG_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

function calendarParts(date: string): { day: number; month: number; year: number } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) throw new Error(`"${date}" is not a calendar date.`);
  return { day: Number(match[3]), month: Number(match[2]), year: Number(match[1]) };
}

/** A calendar date in full, "7 October 2027" — the export's `fFull`. */
export function longDay(date: string): string {
  const { day, month, year } = calendarParts(date);
  return `${day} ${LONG_MONTHS[month - 1]} ${year}`;
}

/**
 * Day and month in full, with the year only when it is not this year — the export's `fDM`: "7
 * October" (today in 2027), "8 October 2026" (today in 2027, the date in 2026).
 */
export function dayMonthWords(date: string, today: string | null): string {
  const { day, month, year } = calendarParts(date);
  const thisYear = today === null ? null : calendarParts(today).year;
  return `${day} ${LONG_MONTHS[month - 1]}${thisYear === year ? '' : ` ${year}`}`;
}

// ---- shared ----

/** The head actions (IA-01, IA-02, IA-03). */
export const INSTITUTE_ACTIONS = {
  addStudents: 'Add students',
  giveStudentsAccess: 'Give students access',
} as const;

/** What a plan, its licences and its term are called on the plan screens. */
export const PLAN_WORDS = {
  accessPlan: 'Access plan',
  licences: 'Licences',
  term: 'Term',
  asApproved: 'as approved by BITS',
  yourCourseCode: 'Your course code',
  codeNotAdded: 'Your course code: not added',
  addCode: 'Add code',
  formatsKey: 'Formats',
  formatKeyLabel: 'Format key',
  inYourPlan: 'In your plan',
  publishedNotInPlan: 'Published, not in your plan',
  notPublished: 'Not published',
} as const;

/** "Yearly term" (the term bar's label); a plan to a fixed date: "Term" (state-copy `IA-plan.term-label`). */
export function termLabel(term: AccessPlanTerm): string {
  return term === 'until-date' ? PLAN_WORDS.term : `${planTermWords(term)} term`;
}

/** "350 days left", "1 day left" (the term bar while the term is live). */
export function daysLeftWords(days: number): string {
  return `${iaPlural(days, 'day')} left`;
}

/** "Paused by BITS on 2 Mar 2027" (the term bar while paused). */
export function pausedOnWords(on: string | null): string {
  return on === null ? 'Paused by BITS' : `Paused by BITS on ${on}`;
}

/** "Ended on 7 Oct 2027" (the term bar once ended). */
export function endedOnWords(endsOn: string): string {
  return `Ended on ${calendarDay(endsOn)}`;
}

/**
 * The term bar's accessible name — the export's `termVM` `aria`: "Access term from 8 October 2026
 * to 7 October 2027. 14 of 364 days have passed; 350 days are left." Paused: "… Paused by BITS on 2
 * March 2027."; ended: "… The term ended on 7 October 2027."
 */
export function termDescription(
  plan: { readonly startsOn: string; readonly endsOn: string },
  standing:
    | {
        readonly kind: 'live';
        readonly passed: number;
        readonly total: number;
        readonly left: number;
      }
    | { readonly kind: 'paused'; readonly on: string | null }
    | { readonly kind: 'ended' },
): string {
  const span = `Access term from ${longDay(plan.startsOn)} to ${longDay(plan.endsOn)}. `;
  if (standing.kind === 'paused') {
    return `${span}${standing.on === null ? 'Paused by BITS.' : `Paused by BITS on ${standing.on}.`}`;
  }
  if (standing.kind === 'ended') return `${span}The term ended on ${longDay(plan.endsOn)}.`;
  const left = iaPlural(standing.left, 'day');
  return standing.passed === 0
    ? `${span}The term starts today; ${left} ${standing.left === 1 ? 'is' : 'are'} left.`
    : `${span}${standing.passed} of ${standing.total} days have passed; ${left} ${standing.left === 1 ? 'is' : 'are'} left.`;
}

/** A format's name in full (the export's `FN`): the badges' words and the usage rows. */
export const FORMAT_FULL_NAME: Readonly<Record<Technology, string>> = {
  web: 'Browser',
  ar: 'Augmented reality',
  vr: 'Virtual reality',
  mr: 'Mixed reality',
};

/** A format badge's state in words (the export's `fmCells` labels). */
export type BadgeState = 'on' | 'pub' | 'none';

const BADGE_STATE_WORDS: Readonly<Record<BadgeState, string>> = {
  on: PLAN_WORDS.inYourPlan,
  pub: PLAN_WORDS.publishedNotInPlan,
  none: PLAN_WORDS.notPublished,
};

/** A badge's full meaning, its accessible name and hover title: "WEB, Browser: In your plan". */
export function badgeWords(format: Technology, state: BadgeState): string {
  return `${formatName(format)}, ${FORMAT_FULL_NAME[format]}: ${BADGE_STATE_WORDS[state]}`;
}

/** The badges' list name: "Formats of Shell-and-Tube Heat Exchanger". */
export function formatsOfLabel(experiment: string): string {
  return `Formats of ${experiment}`;
}

/**
 * The badges in words under the plan card's badges (the export's `fmBadges` `key`): "WEB and VR in
 * your plan · AR published, not in your plan · MR not published".
 */
export function formatKeyLine(
  on: readonly Technology[],
  pub: readonly Technology[],
  none: readonly Technology[],
): string {
  const parts: string[] = [];
  if (on.length > 0) parts.push(`${iaListText(on.map(formatName))} in your plan`);
  if (pub.length > 0) {
    parts.push(`${iaListText(pub.map(formatName))} published, not in your plan`);
  }
  if (none.length > 0) parts.push(`${iaListText(none.map(formatName))} not published`);
  return parts.join(' · ');
}

/** "ME ZG523 · Thermodynamics & Heat Transfer"; a course BITS gave no code: its name. */
export function courseWords(platformCode: string | null, name: string): string {
  return platformCode ? `${platformCode} · ${name}` : name;
}

/** "Add your course code for ME ZG523 Thermodynamics & Heat Transfer" (the Add code link's name). */
export function addCodeLabel(platformCode: string | null, name: string): string {
  return `Add your course code for ${platformCode ? `${platformCode} ${name}` : name}`;
}

/** The plan notices' words (ending soon, ended, paused) in the strips of IA-02 and IA-03. */
export const PLAN_NOTICES = {
  endingSoonLine: 'Renewal reminder due. Ask BITS for a renewal from Requests.',
  contentEndedTitle: 'This plan has ended.',
  contentEndedLine: 'Students can’t open its experiments now. You can still see who had access.',
  planEndedLine: 'Students can’t open its experiments now. Your records stay here.',
  pausedTitle: 'Read-only while your institution’s access is paused.',
  contentPausedLine: 'You can’t give or withdraw access until BITS lifts the pause.',
  planPausedLine:
    'You can’t give or withdraw access, or ask BITS for more, until BITS lifts the pause.',
} as const;

/** "Ends on 7 Oct 2027." (the ending-soon note). */
export function endsOnTitle(endsOn: string): string {
  return `Ends on ${calendarDay(endsOn)}.`;
}

/** "This plan ended on 7 Oct 2027." (IA-03's ended note). */
export function planEndedTitle(endsOn: string): string {
  return `This plan ended on ${calendarDay(endsOn)}.`;
}

/** "Your request to BITS is approved — payment required." (before access is active). */
export const REQUEST_APPROVED = 'Your request to BITS is approved — payment required.';

// ---- IA-01 Overview ----

export const OVERVIEW_WORDS = {
  /** Read before the institution's name in the H1 by screen readers only ("Overview, …"). */
  titlePrefix: 'Overview,',
  attention: 'Needs your attention',
  calmTitle: 'Nothing needs your attention right now.',
  calmLine: 'New items appear here as they come in.',
  noContent: 'No content yet',
  approvedLine: `${REQUEST_APPROVED} Experiments appear here when your institution’s access is active, after the payment is confirmed.`,
  approvedStatusLine: 'Access starts when the payment is confirmed.',
  pausedTitle: 'BITS has paused your institution’s access',
  pausedLine:
    'Students can’t open experiments. Pages are read-only until BITS lifts the pause. Your work is kept.',
  help: 'Help',
  renewalTitle: 'Request a renewal',
  endedTitle: 'Your access plan has ended',
  viewStudents: 'View students',
  reviewStudents: 'Review students',
  giveAccess: 'Give access',
  // Package 2B: "Add course code" (opens IA-16 Course codes).
  addCourseCode: 'Add course code',
  planNote:
    'Students open only the experiments you give them on Student access, in the formats your plan includes.',
  viewPlan: 'View plan',
  openContentAccess: 'Open Content access',
} as const;

/** "3 items", "1 item" (beside "Needs your attention"). */
export function itemsWords(count: number): string {
  return iaPlural(count, 'item');
}

/** The status line, access live: "Your access plan ends on 7 October 2027." */
export function endsStatusLine(endsOn: string): string {
  return `Your access plan ends on ${longDay(endsOn)}.`;
}

/** The status line, ended: "Your access plan ended on 7 October 2027." */
export function endedStatusLine(endsOn: string): string {
  return `Your access plan ended on ${longDay(endsOn)}.`;
}

/** The status line, paused: "Your access plan was paused by BITS on 2 Mar 2027." */
export function pausedStatusLine(pausedOn: string | null): string {
  return pausedOn === null
    ? 'Your access plan was paused by BITS.'
    : `Your access plan was paused by BITS on ${pausedOn}.`;
}

/** The lead band, ending soon: "Your plan ends on 7 October. The reminder is due; …". */
export function renewalLine(endsOn: string, today: string | null): string {
  return `Your plan ends on ${dayMonthWords(endsOn, today)}. The reminder is due; nothing is sent automatically.`;
}

/** The lead band, ended: "Ended 7 Oct 2027 · students can’t open its experiments now." */
export function endedLine(endedOn: string): string {
  return `Ended ${calendarDay(endedOn)} · students can’t open its experiments now.`;
}

/** "student is waiting for a licence" after the count — supplied waits, never counted (T-06 / D7). */
export function waitingTitle(students: number): string {
  return students === 1 ? 'student is waiting for a licence' : 'students are waiting for a licence';
}

/** "device request to forward to BITS" after the count. */
export function deviceTitle(requests: number): string {
  return requests === 1
    ? 'device request to forward to BITS'
    : 'device requests to forward to BITS';
}

/** "From Rahul Verma on 22 October. BITS decides after you forward it." (several: "… and 1 other …"). */
export function deviceLine(
  student: string,
  others: number,
  on: string,
  today: string | null,
): string {
  const who = others > 0 ? `${student} and ${iaPlural(others, 'other')}` : student;
  return `From ${who} on ${dayMonthWords(on, today)}. BITS decides after you forward it.`;
}

/** "students have no access yet" after the count. */
export function withoutAccessTitle(students: number): string {
  return students === 1 ? 'student has no access yet' : 'students have no access yet';
}

/** "Added on 8 October" (the newest student added, by form or import). */
export function addedOnLine(on: string, today: string | null): string {
  return `Added on ${dayMonthWords(on, today)}`;
}

/** "experiment hasn’t been given to any student" after the count. */
export function notGivenTitle(experiments: number): string {
  return experiments === 1
    ? 'experiment hasn’t been given to any student'
    : 'experiments haven’t been given to any student';
}

/** "course has no course code from your institution" after the count. */
export function noCodeTitle(courses: number): string {
  return courses === 1
    ? 'course has no course code from your institution'
    : 'courses have no course code from your institution';
}

/** "ME ZG523 Thermodynamics & Heat Transfer" (the course without a code). */
export function noCodeLine(platformCode: string | null, name: string | null): string {
  return [platformCode, name].filter((part) => part !== null && part !== '').join(' ');
}

// ---- IA-02 Content access ----

export const CONTENT_ACCESS_WORDS = {
  title: 'Content access',
  meta: 'What BITS has given your institution to use',
  tabsLabel: 'Content access',
  experimentsTab: 'Experiments',
  listHeading: 'Experiments in your access plan',
  toolsLabel: 'Filter experiments',
  searchLabel: 'Search experiments',
  searchPlaceholder: 'Search experiment or course',
  statusLabel: 'Status',
  statusOptions: {
    all: 'All statuses',
    active: 'Active',
    ending: 'Ending soon',
    ended: 'Ended',
  },
  clearFilters: 'Clear filters',
  caption: 'Experiments in your access plan, grouped by course',
  columns: {
    experiment: 'Experiment',
    formats: 'Formats',
    studentsGiven: 'Students given access',
    action: 'Action',
  },
  noneYet: 'None yet',
  giveAccess: 'Give access',
  // Package 2B: "Add code" (opens IA-16 Course codes).
  addCode: 'Add code',
  foot: 'Only experiments in your access plan are listed here.',
  noMatch: 'No experiments match these filters',
  noMatchLine: 'Try fewer filters or a different spelling of the experiment or course.',
  showAll: 'Show all experiments',
  noContent: 'No content yet',
  noContentLine: `Experiments appear here when BITS activates your institution’s access. ${REQUEST_APPROVED}`,
  loading: 'Loading content access…',
  failedTitle: 'We couldn’t load content access',
  failedLine: 'Nothing has changed. Try again.',
  tryAgain: 'Try again',
  viewPlan: 'View plan',
} as const;

/** The Status filter, in the export's order (`select#ca-st`). */
export const CONTENT_STATUS_FILTERS = ['all', 'active', 'ending', 'ended'] as const;
export type ContentStatusFilter = (typeof CONTENT_STATUS_FILTERS)[number];

/**
 * "View plan"'s name, by the plan's term instead of its reference: "View access plan, 8 Oct 2026 –
 * 7 Oct 2027" (state-copy `IA-plan.no-reference`).
 */
export function viewPlanLabel(plan: {
  readonly startsOn: string;
  readonly endsOn: string;
}): string {
  return `View access plan, ${calendarDay(plan.startsOn)} – ${calendarDay(plan.endsOn)}`;
}

/** "7 students", "1 student" (students given access — people, never licences). */
export function studentsWords(students: number): string {
  return iaPlural(students, 'student');
}

/** The count link's name: "7 students given access to … . Open Student access". */
export function studentsGivenLabel(students: number, experiment: string): string {
  return `${studentsWords(students)} given access to ${experiment}. Open Student access`;
}

/** The row action's name: "Give students access to Shell-and-Tube Heat Exchanger". */
export function giveAccessLabel(experiment: string): string {
  return `Give students access to ${experiment}`;
}

/** The chips (the export's `vm02core`): "Search: “Distillation”", "Status: Ending soon". */
export function searchChip(search: string): string {
  return `Search: “${search.trim()}”`;
}
export function statusChip(filter: Exclude<ContentStatusFilter, 'all'>): string {
  return `Status: ${CONTENT_ACCESS_WORDS.statusOptions[filter]}`;
}

/** A chip's remove button: "Remove filter Search: “Distillation”". */
export function removeFilterLabel(chip: string): string {
  return `Remove filter ${chip}`;
}

/** The count: "1 experiment in 1 course" with no filter, "0 of 1 experiment" with one. */
export function contentCountWords(
  shown: number,
  total: number,
  courses: number,
  filtered: boolean,
): string {
  const experiments = iaPlural(total, 'experiment');
  return filtered
    ? `${shown} of ${experiments}`
    : `${experiments} in ${iaPlural(courses, 'course')}`;
}

// ---- IA-03 Access plan ----

export const ACCESS_PLAN_WORDS = {
  /** The breadcrumb's current level and the tab title. */
  crumb: 'Access plan',
  title: 'Your access plan',
  noPlanTitle: 'No access plan yet',
  noPlanLine: `${REQUEST_APPROVED} The plan appears here when the payment is confirmed.`,
  from: 'From',
  fromRequest: 'your request to BITS',
  stripHeading: 'Licences and term',
  foot: 'Licences and term are as BITS approved them. Giving or withdrawing access doesn’t change what is shown here.',
  gave: 'What BITS gave your institution',
  gaveCaption: 'Experiments in your access plan, grouped by course, with the formats in your plan',
  given: 'Students you’ve given access',
  givenCaption:
    'Students given access under your access plan, grouped by experiment: one row per student',
  openStudentAccess: 'Open Student access',
  nobodyTitle: 'You haven’t given anyone access yet',
  nobodyLine:
    'Choose students and give them experiments from this plan. They see the formats in this plan.',
  columns: { student: 'Student', how: 'How given', status: 'Status' },
  individually: 'Individually',
  history: 'History',
  requestSubmitted: 'Request submitted',
  requestApprovedNote: 'Approved — payment required.',
  activated: 'Access activated',
  activatedNote: 'Payment confirmed. Your access plan was created.',
  createdNote: 'Your access plan was created.',
  groupGrant: 'Group grant',
  withdrawn: 'Individual grant withdrawn',
  paused: 'Access paused by BITS',
  planEnded: 'Plan ended',
} as const;

/** "Active since 8 Oct 2026, 15:05". */
export function activeSinceWords(activatedAt: string): string {
  return `Active since ${activatedAt}`;
}

/** "Group: ME ZG523 — Sem II" (how a student was given it through a group). */
export function viaGroupWords(group: string): string {
  return `Group: ${group}`;
}

/** "Also in ME ZG523 — Sem II, which has this experiment" (another grant reaches the student too). */
export function alsoInWords(groups: readonly string[]): string {
  return `Also in ${iaListText(groups)}, which has this experiment`;
}

/** "No licence is available for Arun on this plan right now." (only on a waiting row). */
export function waitingNote(firstName: string): string {
  return `No licence is available for ${firstName} on this plan right now.`;
}

/** The first name the export's `first` reads ("Dr", "Prof." dropped): "Arun". */
export function firstNameOf(fullName: string): string {
  return fullName.replace(/^(Dr|Prof\.)\s+/, '').split(' ')[0] ?? fullName;
}

/** "Formats from your access plan: WEB, VR" (a group heading's formats, read as one image). */
export function planFormatsLabel(formats: readonly Technology[]): string {
  return `Formats from your access plan: ${formats.map(formatName).join(', ') || 'none'}`;
}

/** "Request approved · External" (history). */
export function requestApprovedWhat(route: string): string {
  return `Request approved · ${route}`;
}

/** "Request approved with changes · External" (history; provisional, `IA-03.history`). */
export function approvedWithChangesWhat(route: string): string {
  return `Request approved with changes · ${route}`;
}

/** History: "Rahul Verma given Shell-and-Tube Heat Exchanger", "Group ME ZG523 — Sem II given …". */
export function givenWhat(who: string, experiment: string, toGroup: boolean): string {
  return `${toGroup ? `Group ${who}` : who} given ${experiment}`;
}

/** History: "Nikhil Bose · Shell-and-Tube Heat Exchanger" (an individual grant withdrawn). */
export function withdrawnNote(who: string, experiment: string): string {
  return `${who} · ${experiment}`;
}

/** History: "9 Oct 2026, 10:20 · Meera Iyer". */
export function whenBy(when: string, who: string | null): string {
  return who ? `${when} · ${who}` : when;
}

/** History: "End of the yearly term." */
export function endOfTermNote(term: AccessPlanTerm): string {
  return term === 'until-date' ? 'End of the term.' : `End of the ${term} term.`;
}

/** "Access restored by BITS" (after "Access paused by BITS"; provisional, `IA-03.history`). */
export const RESTORED_WHAT = 'Access restored by BITS';
