/**
 * The words of the Institute Admin's People screens — IA-06 People › Students, IA-08 People ›
 * Faculty, IA-07 Student record (B2-06) and IA-10 Add a student / Add a faculty member (B2-07) —
 * written from the canonical facts the ports answer (`studentDirectoryRow`, `getStudentOutput`,
 * `listFacultyOutput`): read models carry no words. Every phrase here is the frozen boards' own,
 * found verbatim in their markup or script (`institute-people.test.ts`); what no board words is a
 * provisional entry of the state-copy register (`state-copy-people.ts`, VD-12), never an invented
 * rule. The boards' sample people and dates are never copied: names, IDs and dates come from the
 * records.
 */
import type { StudentDirectoryStatus, Technology } from '@xr/domain';
import { inDisplayOrder } from '@xr/domain';

import { formatName } from './flow-state-words';

/** "Rahul" from "Rahul Verma" — B2-06 / B2-07 scripts use the first word (`n.split(' ')[0]`). */
export function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}

// ---- IA-06 People › Students and IA-08 People › Faculty (B2-06 f0 … f7, f14) ----

export const PEOPLE_PAGE = {
  meta: 'Students and faculty at your institution',
  tabsLabel: 'People',
  tabs: { students: 'Students', faculty: 'Faculty' },
  addStudent: 'Add student',
  addFaculty: 'Add faculty member',
  searchLabel: 'Search',
  clearFilters: 'Clear filters',
} as const;

export const STUDENTS_TAB = {
  searchPlaceholder: 'Name, student ID or e-mail',
  statusLabel: 'Status',
  allStatuses: 'All statuses',
  groupLabel: 'Group',
  allGroups: 'All groups',
  notInGroup: 'Not in a group',
  caption: 'Students',
  columns: {
    student: 'Student',
    courseAndGroup: 'Course and group',
    experimentsGiven: 'Experiments given',
    status: 'Status',
  },
  noGroup: 'No group',
  noneYet: 'None yet',
  noMatchTitle: 'No students match these filters',
  noMatchLine: 'Check the spelling, or search by student ID.',
  emptyTitle: 'No students yet',
  emptyLine:
    'Add students one at a time or import a CSV file. Adding a student doesn’t give them any experiments yet.',
  loading: 'Loading students',
  failedTitle: 'We couldn’t load the students',
  failedLine: 'Nothing has changed. Try again.',
  tryAgain: 'Try again',
} as const;

/** B2-06 `LBL`: the directory status in words (and the Status filter's options). */
export const DIRECTORY_STATUS_WORDS: Readonly<Record<StudentDirectoryStatus, string>> = {
  'access-active': 'Access active',
  'no-access-yet': 'No access yet',
  inactive: 'Inactive',
};

/** The Status filter, in board order (`option value="access" | "none" | "inactive"`). */
export const DIRECTORY_STATUS_ORDER: readonly StudentDirectoryStatus[] = [
  'access-active',
  'no-access-yet',
  'inactive',
];

/** B2-06 `count`: "12 students" — "3 of 12 students" while a filter is applied. */
export function studentCountWords(shown: number, total: number, filtered: boolean): string {
  const noun = total === 1 ? 'student' : 'students';
  return filtered ? `${shown} of ${total} ${noun}` : `${total} ${noun}`;
}

/** B2-06 `chips`: "Search: “Meenakshi”". */
export function searchChip(search: string): string {
  return `Search: “${search.trim()}”`;
}

/** B2-06 `chips`: "Status: Inactive". */
export function statusChip(status: StudentDirectoryStatus): string {
  return `Status: ${DIRECTORY_STATUS_WORDS[status]}`;
}

/** B2-06 `chips`: "Group: ME ZG523 — Sem II"; "Not in a group" stands alone. */
export function groupChip(groupName: string): string {
  return `Group: ${groupName}`;
}

/** B2-06 row link name (`r.aria`): "Open student record: Rahul Verma". */
export function openStudentLabel(fullName: string): string {
  return `Open student record: ${fullName}`;
}

export const FACULTY_TAB = {
  searchPlaceholder: 'Name or e-mail',
  caption: 'Faculty',
  columns: { member: 'Faculty member', coursesTaught: 'Courses taught', status: 'Status' },
  noCourses: 'No courses yet',
  active: 'Active',
  inactive: 'Inactive',
  noMatchTitle: 'No faculty members match',
  clearSearch: 'Clear search',
} as const;

/** B2-06 `fcView` count: "3 faculty members" — "1 of 3 faculty members" while searching. */
export function facultyCountWords(shown: number, total: number, searching: boolean): string {
  const noun = total === 1 ? 'faculty member' : 'faculty members';
  return searching ? `${shown} of ${total} ${noun}` : `${total} ${noun}`;
}

// ---- IA-07 Student record (B2-06 f8 … f13, f17) ----

export const RECORD_PAGE = {
  back: 'Students',
  accountActive: 'Account active',
  inactive: 'Inactive',
  giveAccess: 'Give this student access',
  reactivate: 'Reactivate account',
  reactivateBusy: 'Reactivating…',
  sections: {
    experiments: 'Experiments given',
    coursesAndGroups: 'Courses and groups',
    details: 'Details',
    history: 'History',
    account: 'Account',
  },
  openStudentAccess: 'Open Student access',
  experimentsCaption: 'Experiments given',
  columns: {
    experiment: 'Experiment',
    formats: 'Formats',
    howGiven: 'How given',
    status: 'Status',
  },
  keys: {
    course: 'Course',
    group: 'Group',
    studentId: 'Student ID',
    email: 'Institution e-mail',
    programme: 'Programme',
    added: 'Added',
  },
  accountLine:
    'Deactivating stops this student from opening experiments until you reactivate the account. Their work and access history are kept.',
  deactivate: 'Deactivate account…',
  deactivateConfirm: 'Deactivate account',
  deactivateBusy: 'Deactivating…',
  reasonLabel: 'Reason',
  reasonMarker: '(required)',
  reasonHint: 'Shown on the student record to your institution’s administrators.',
  inactiveTitle: 'This account is inactive',
  deactivatedFlash: 'Account deactivated. Their work and access history are kept.',
  reactivatedFlash: 'Account reactivated.',
  historyAdded: 'Added to People',
  historyDeactivated: 'Account deactivated',
} as const;

/** B2-06 overline: "Student · GIT-2026-0418" (the ID in `span.xr-id`, composed by the screen). */
export const RECORD_OVERLINE = 'Student';

/** B2-06 f8: "Rahul hasn’t been given any experiments yet". */
export function noExperimentsTitle(fullName: string): string {
  return `${firstName(fullName)} hasn’t been given any experiments yet`;
}

/** B2-06 f9: "From access plan ACC-0107". */
export function fromPlanWords(planId: string): string {
  return `From access plan ${planId}`;
}

/** B2-06 f9 "How given": "Individually · 9 Oct 2026 · " — then the grant's ID. */
export function givenIndividuallyWords(date: string): string {
  return `Individually · ${date} · `;
}

/** B2-06 f10 "How given": "Group ME ZG523 — Sem II · 12 Oct 2026 · " — then the grant's ID. */
export function givenThroughGroupWords(groupName: string, date: string): string {
  return `Group ${groupName} · ${date} · `;
}

/** B2-06 f17 / B2-04 `alsoText`: "Also in ME ZG523 — Sem II, which has this experiment". */
export function alsoInWords(groupName: string): string {
  return `Also in ${groupName}, which has this experiment`;
}

/** B2-06 f17: the group grant "· not changed" once the individual grant is withdrawn. */
export const ALSO_NOT_CHANGED = ' · not changed';

/** B2-06 grant words on the record (f9 "Active", f10, f11, f17). */
export const RECORD_GRANT_WORDS = {
  active: 'Active',
  'waiting-for-a-licence': 'Waiting for a licence',
  'student-inactive': 'Can’t open — inactive',
  'individual-grant-withdrawn': 'Individual grant withdrawn',
} as const;

/** B2-06 f10: "No licence is available for Arun on ACC-0107 right now." */
export function waitingLine(fullName: string, planId: string): string {
  return `No licence is available for ${firstName(fullName)} on ${planId} right now.`;
}

/** B2-06 f11: "Sneha’s account is inactive." */
export function inactiveGrantLine(fullName: string): string {
  return `${firstName(fullName)}’s account is inactive.`;
}

/** B2-06 f17: "Withdrawn 12 Oct 2026 · “Given individually by mistake.”" */
export function withdrawnLine(date: string, reason: string): string {
  return `Withdrawn ${date} · “${reason}”`;
}

/** B2-06 f8 "Courses and groups": "ME ZG523 · Thermodynamics & Heat Transfer". */
export function courseLine(platformCode: string | null, name: string): string {
  return platformCode ? `${platformCode} · ${name}` : name;
}

/** B2-06 f8 "Added": "8 Oct 2026 · imported by Meera Iyer". */
export function importedByWords(date: string, who: string): string {
  return `${date} · imported by ${who}`;
}

/** B2-06 history "when": "8 Oct 2026, 16:10 · Meera Iyer". */
export function historyWhen(dateTime: string, who: string): string {
  return `${dateTime} · ${who}`;
}

/** B2-06 history note: "Imported from godavari-me-zg523.csv". */
export function importedFromWords(fileName: string): string {
  return `Imported from ${fileName}`;
}

/** B2-06 f9 history: "Given Shell-and-Tube Heat Exchanger". */
export function givenWords(experimentName: string): string {
  return `Given ${experimentName}`;
}

/** B2-06 f10 history: "Given Shell-and-Tube Heat Exchanger through the group ME ZG523 — Sem II". */
export function givenThroughGroupHistory(experimentName: string, groupName: string): string {
  return `Given ${experimentName} through the group ${groupName}`;
}

/** B2-06 f9 history note: "SACC-0310 · individually · WEB and VR from ACC-0107". */
export function givenIndividuallyNote(
  grantId: string,
  formats: readonly Technology[],
  planId: string,
): string {
  return `${grantId} · individually · ${formatsAnd(formats)} from ${planId}`;
}

/** "WEB and VR" (B2-06 f9), in the display order WEB · AR · VR · MR. */
export function formatsAnd(formats: readonly Technology[]): string {
  const names = inDisplayOrder(formats).map(formatName);
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} and ${names.at(-1)!}`;
}

/** B2-06 f17 history: "Individual grant SACC-0310 withdrawn". */
export function individualWithdrawnWords(grantId: string): string {
  return `Individual grant ${grantId} withdrawn`;
}

/** B2-06 f11 / f17 history notes: the reason in quotation marks, “On leave this semester.”. */
export function quotedReason(reason: string): string {
  return `“${reason}”`;
}

/** B2-06 f17 history note: "· group grant SACC-0311 not changed" after the quoted reason. */
export function groupGrantNotChanged(grantId: string): string {
  return ` · group grant ${grantId} not changed`;
}

/** B2-06 f9 `since` / f11: "Inactive since 9 Oct 2026 · Meera Iyer: “On leave this semester.”". */
export function inactiveSinceWords(date: string, who: string, reason: string): string {
  return `Inactive since ${date} · ${who}: “${reason}”`;
}

/** B2-06 DL-2 title: "Deactivate Rahul Verma’s account?". */
export function deactivateTitle(fullName: string): string {
  return `Deactivate ${fullName}’s account?`;
}

/** B2-06 DL-2 body: who sees the inactive account, and what is kept. */
export function deactivateBody(fullName: string): string {
  return `${firstName(fullName)} will see that the account is inactive and won’t be able to open any experiments until you reactivate it. Work and access history are kept.`;
}

/** B2-06 reactivate dialog title: "Reactivate Rahul Verma’s account?". */
export function reactivateTitle(fullName: string): string {
  return `Reactivate ${fullName}’s account?`;
}

/** B2-06 reactivate dialog body. */
export function reactivateBody(fullName: string): string {
  return `The account becomes active again, and the experiments ${firstName(fullName)} has been given open again.`;
}

/**
 * Grant words B2-06 does not draw on the record, as the sibling boards word them: "Withdrawn" and
 * "Access ended" (B2-04 `LBL`), "Paused" (B2-03 plan page). State-copy `IA-07.grant-words`.
 */
export const OTHER_GRANT_WORDS = {
  withdrawn: 'Withdrawn',
  'access-ended': 'Access ended',
  paused: 'Paused',
} as const;

// ---- IA-07 words no board draws: PROVISIONAL (state-copy register, VD-12) ----

/** PROVISIONAL (`IA-07.details`): "8 Oct 2026 · added by Meera Iyer" for a student added one at a time. */
export function addedByWords(date: string, who: string): string {
  return `${date} · added by ${who}`;
}

/**
 * PROVISIONAL (`IA-07.inactive.line`): B2-06 f11 "Sneha can’t open experiments until her account
 * is reactivated." — the record holds no pronoun.
 */
export function inactiveUntilLine(fullName: string): string {
  return `${firstName(fullName)} can’t open experiments until their account is reactivated.`;
}

/** PROVISIONAL (`IA-07.history`): the history entries B2-06 does not draw. */
export const HISTORY_UNDRAWN = {
  reactivated: 'Account reactivated',
  statusChanged: 'Account status changed',
} as const;

// ---- IA-10 Add a student / Add a faculty member (B2-07 f0 … f4) ----

export const ADD_PERSON = {
  overline: 'People',
  student: {
    back: 'Students',
    title: 'Add student',
    notice: 'Adding a student doesn’t give them any experiments yet. You give access separately.',
    submit: 'Add student',
    again: 'Add another student',
  },
  faculty: {
    back: 'Faculty',
    title: 'Add faculty member',
    notice: 'Assign the courses they teach after adding them, in Faculty courses.',
    submit: 'Add faculty member',
    again: 'Add another faculty member',
  },
  whoTheyAre: 'Who they are',
  studentDetails: 'Student details',
  fullName: 'Full name',
  email: 'Institution e-mail',
  emailPlaceholder: 'name@godavari.edu.in',
  studentId: 'Student ID',
  studentIdHint: 'Your institution’s ID for this student, for example GIT-2026-0418.',
  programme: 'Programme',
  group: 'Group',
  optional: '(optional)',
  noGroup: 'No group',
  cancel: 'Cancel',
  busy: 'Adding…',
  added: 'Added',
  giveAccess: 'Give this student access',
  backToPeople: 'Back to People',
} as const;

/** B2-07 result: "<strong>Meenakshi Pillai</strong> is in People now, with no experiments yet. …". */
export const ADDED_STUDENT_LINE =
  ' is in People now, with no experiments yet. No invitation or e-mail is sent.';
export const ADDED_FACULTY_LINE =
  ' is in People now, with no courses yet. No invitation or e-mail is sent.';
