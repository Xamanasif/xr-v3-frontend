/**
 * The words of the Institute Admin's access screens in the owner-approved V3 Refined B design
 * (design/v3-refined-b/roles/IA-v1, live root `project/Main.dc.html`): IA-04 Student access, IA-05
 * Give students access, IA-07 Student record and IA-14 Group — the template's words and the
 * script's forms (`vm04`, `saRow`, `vm05`, `vm07`, `stuHistory`, `vm14`, `memberStatus`,
 * `dlgContent`, `dlgConfirm`), with the records' values (names, dates and counts are never copied
 * from the export's sample world). `ia-access.test.ts` finds each phrase in the export.
 *
 * No line names a record by its internal reference (owner's identifier rule for every role, IA
 * lead decision 2): where the export still writes an access plan, request, grant or group id
 * (`ACC-…`, `REQ-…`, `SACC-…`, `GRP-…`), the line names the record by its content instead — "your
 * access plan", the student, the group, the date it was given (state-copy `IA-04.no-reference`).
 *
 * The v46 words of these screens stay in `student-access.ts`, `groups.ts` and `institute-people.ts`
 * (the Faculty pages read `firstName` there); nothing here changes them.
 */
import { iaListText, iaPlural } from './ia-shared';

// ---- shared forms -------------------------------------------------------------------------------
// The forms more than one screen group writes are `ia-shared.ts`'s (`iaPlural`, `iaListText`, the
// paused title, the badges' names, the toolbar's line and chips, "Group: …", the group's count);
// a grant's status words are the shared status model's (`features/institute/shared/status-model`).

/** The script's `first`: "Rahul" from "Rahul Verma", "Ranganathan" never — the title goes first. */
export function firstOf(name: string): string {
  return name.replace(/^(Dr|Prof\.)\s+/, '').split(' ')[0] ?? name;
}

/** The script's `fmtsText`: the format codes joined by "and" — "WEB and VR". */
export function formatsText(codes: readonly string[]): string {
  return codes.join(' and ');
}

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

/** The script's `fFull` of a calendar date ("2027-10-07"): "7 October 2027". */
export function longCalendarDay(date: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) throw new Error(`"${date}" is not a calendar date.`);
  return `${Number(match[3])} ${LONG_MONTHS[Number(match[2]) - 1]!} ${match[1]}`;
}

/** "Withdrawn 12 Oct 2026 · “Given by mistake.”" (`r.wdText` · `r.reason`). */
export function withdrawnNote(date: string, reason: string): string {
  return `Withdrawn ${date} · “${reason}”`;
}

/**
 * The note under "Waiting for a licence" (`r.waitText`): "No licence is available for Arun on your
 * access plan right now." — the export names the plan by its id there (identifier rule).
 */
export function noLicenceNote(name: string): string {
  return `No licence is available for ${firstOf(name)} on your access plan right now.`;
}

/**
 * The group grant beside an individual grant (`r.alsoText`): "Also in ME ZG523 — Sem II, which has
 * this experiment", and " · not changed" once the individual grant is withdrawn.
 */
export function alsoInGroupWords(groupName: string, notChanged: boolean): string {
  return `Also in ${groupName}, which has this experiment${notChanged ? ' · not changed' : ''}`;
}

// ---- IA-04 Student access (`R.rIA04`, `vm04`) -----------------------------------------------------

export const IA04 = {
  lead: 'Who can open which experiments',
  give: 'Give students access',
  pausedLine: 'You can’t give or withdraw access until BITS lifts the pause.',
  endedTitle: 'Your access plan has ended',
  endedLine:
    'Students can’t open its experiments now. The list stays as a record of who had access.',
  requestRenewal: 'Request renewal',
  flashTitle: 'Done',
  listHeading: 'Student access — one row per student and experiment',
  filterLabel: 'Filter student access',
  searchLabel: 'Search student access',
  searchPlaceholder: 'Search student, ID or experiment',
  viaLabel: 'How given',
  segmentsLabel: 'Show grants by status',
  current: 'Current',
  clearFilters: 'Clear filters',
  caption: 'Student access, grouped by experiment: one row per student',
  columns: { student: 'Student', howGiven: 'How given', status: 'Status', action: 'Action' },
  individually: 'Individually',
  withdraw: 'Withdraw…',
  foot: 'Group grants are changed on the group’s page. Formats come from your access plan; they are never chosen per student.',
  showAllCurrent: 'Show all current grants',
  emptyTitle: 'No student has access yet',
  emptyLine:
    'Use Give students access above to give students the experiments your institution holds. They see the formats in your access plan.',
  emptyNoGive:
    'Giving access isn’t available right now. Students you give access later see the formats in your access plan.',
  noPlanTitle: 'Your institution doesn’t hold any experiments yet',
  noPlanLine: 'Experiments appear in Content access when BITS activates your access.',
  contentAccess: 'Content access',
  loading: 'Loading student access…',
  failedTitle: 'We couldn’t load student access',
  failedLine: 'Nothing has changed. Try again.',
  tryAgain: 'Try again',
} as const;

/** The "How given" select (`#sa-via`), in the export's order. */
export const IA04_VIA = [
  ['all', 'Given any way'],
  ['ind', 'Given individually'],
  ['grp', 'Given through a group'],
] as const;
export type Ia04Via = (typeof IA04_VIA)[number][0];

/** The no-match state (`V.noneT`, `V.noneD`): with filters, on Current, on another status. */
export const IA04_NONE = {
  filtered: {
    title: 'No grants match these filters',
    line: 'Try fewer filters or search by student ID.',
  },
  current: {
    title: 'No current grants',
    line: 'Only withdrawn grants are left. They are listed under Withdrawn.',
  },
  status: { title: 'No grants with this status', line: 'Choose another status above.' },
} as const;

/** The polite announcement (`V.liveText`): "7 rows shown", "1 row shown · Waiting for a licence". */
export function rowsShownWords(count: number, status: string | null): string {
  return `${iaPlural(count, 'row')} shown${status ? ` · ${status}` : ''}`;
}

/** A row's Withdraw… (`r.wdAria`), named by its student and experiment. */
export function withdrawAria(name: string, experiment: string, alsoInGroup: boolean): string {
  return alsoInGroup
    ? `Withdraw ${name}’s individual grant for ${experiment}`
    : `Withdraw ${name}’s access to ${experiment}`;
}

/** DL-2 Withdraw (`dlgContent` `withdraw`). */
export const WITHDRAW = {
  titleOnly: 'Withdraw access?',
  noteTitle: 'The group grant is not changed',
  reasonLabel: 'Reason (required)',
  reasonHint: 'Kept in the access history, which your institution’s administrators can see.',
  reasonRequired: 'Enter the reason for withdrawing access',
  confirmOnly: 'Withdraw access',
  confirmAlso: 'Withdraw individual grant',
  busy: 'Withdrawing…',
  cancel: 'Cancel',
} as const;

/** The title beside a group grant: "Withdraw Rahul Verma’s individual grant?". */
export function withdrawAlsoTitle(name: string): string {
  return `Withdraw ${name}’s individual grant?`;
}

/** The body beside a group grant: the grant named by who and when (identifier rule). */
export function withdrawAlsoBody(name: string, date: string): string {
  return `This withdraws the access you gave ${name} individually on ${date}. Their work is kept, and the grant stays in the access history.`;
}

/** The body of a student's only grant for the experiment. */
export function withdrawOnlyBody(name: string, experiment: string): string {
  return `This is ${name}’s only grant for ${experiment}, so ${firstOf(name)} will no longer be able to open it. Their work is kept, and the grant stays in the access history.`;
}

/** The note beside a group grant: the group grant is not changed (no can / can't, OD-B2-01). */
export function withdrawAlsoNote(name: string, groupName: string, experiment: string): string {
  return `${firstOf(name)} is also in ${groupName}, which has ${experiment} through its own group grant. Withdrawing this individual grant doesn’t change the group grant.`;
}

/** The flash after withdrawing beside a group grant (`dlgConfirm` `withdraw`). */
export function withdrawnAlsoFlash(name: string, groupName: string): string {
  return `The individual grant for ${name} was withdrawn. ${firstOf(name)} is still in ${groupName}, and its group grant is not changed.`;
}

/** The flash after withdrawing a student's only grant for the experiment. */
export function withdrawnOnlyFlash(name: string, experiment: string): string {
  return `Access withdrawn. That was ${name}’s only grant for ${experiment}, so ${firstOf(name)} can no longer open it. Their work is kept.`;
}

// ---- IA-05 Give students access (`R.rIA05`, `vm05`) ----------------------------------------------

export const IA05 = {
  title: 'Give students access',
  crumb: 'Student access',
  stepsLabel: 'Steps',
  steps: ['Experiments', 'Students', 'Review and give access'],
  stepTitles: {
    experiments: 'Choose experiments',
    students: 'Choose students',
    review: 'Review and give access',
  },
  doneTitle: 'Access given',
  stepDone: ', done',
  stepCurrent: ', current step',
  selection: 'Your selection',
  nothingChosen: 'Nothing chosen yet',
  notChosen: 'Not chosen yet',
  noFormats: '—',
  keys: {
    plan: 'Access plan',
    course: 'Course',
    experiments: 'Experiments',
    formats: 'Formats',
    students: 'Students',
    group: 'Group',
  },
  errorTitle: 'Check this step',
  prefillStudentLine: 'Chosen from their student record. You can change who in step 2.',
  prefillGroupLine: 'Chosen from the group page. You can change who in step 2.',
  // step 1
  courseLabel: 'Course',
  experimentsLegend: 'Experiments in your access plan',
  formatsNote:
    'Students get the formats your plan includes for each experiment. You don’t choose formats here.',
  available: 'Available to your institution:',
  notInPlan: 'Not in your access plan · published as',
  cancel: 'Cancel',
  continue: 'Continue',
  back: 'Back',
  // step 2
  giveTo: 'Give access to',
  students: 'Students',
  aGroup: 'A group',
  searchStudents: 'Search students',
  searchPlaceholder: 'Name or student ID',
  studentsList: 'Students',
  inactive: 'Inactive — can’t be given access',
  noStudentMatch: 'No student matches that search.',
  noStudentsTitle: 'No students yet',
  noStudentsLine: 'Add students to People first. Adding them doesn’t give them any experiments.',
  addStudent: 'Add student',
  importStudents: 'Import students',
  groupNote:
    'Giving access to a group gives it to the group’s current members. Each member’s status is shown before you confirm.',
  groupsList: 'Groups',
  noMembers: 'No members yet',
  groupEmpty: 'Add members before giving access',
  noGroupsTitle: 'No groups yet',
  noGroupsLine: 'Create a group in People › Groups and add students to it.',
  openGroups: 'Open Groups',
  // step 3
  inherited: 'Inherited from the access plan — not chosen here',
  whatWillBeCreated: 'What will be created',
  give: 'Give access',
  giving: 'Giving access…',
  giveFailed: 'Access wasn’t given. Nothing was changed. Try again.',
  // result
  resultAllOk: 'They can open the experiment with the formats in your plan.',
  resultEach: 'Each grant and its status are listed below.',
  groupResultNote:
    'Recorded for the group’s current members. Each member’s status is on the group page.',
  openTheGroup: 'Open the group',
  viewStudentAccess: 'View Student access',
  giveMore: 'Give more access',
  // refusals
  paused: {
    title: 'You can’t give access while your institution’s access is paused',
    line: 'Students keep their work. You can give access again when BITS lifts the pause.',
    back: 'Back to Student access',
    help: 'Help',
  },
  ended: { title: 'Your access plan has ended', renewal: 'Request renewal' },
  nothingHeld: {
    title: 'Your institution doesn’t hold any experiments yet',
    line: 'Experiments appear in Content access when BITS activates your access.',
    /** The export's "Request REQ-0042 is approved — payment required.", named by content. */
    approved: 'Your request is approved — payment required.',
  },
  contentAccess: 'Content access',
  tryAgain: 'Try again',
} as const;

/** The eyebrow over the title (`V.over`): "Step 2 of 3". */
export function stepOfWords(step: number): string {
  return `Step ${step} of 3`;
}

/** The pre-fill notice (`V.preName`): "Giving access to Rahul Verma". */
export function prefillStudentTitle(name: string): string {
  return `Giving access to ${name}`;
}

/** The pre-fill notice from a group: "Giving access to the group ME ZG523 — Sem II". */
export function prefillGroupTitle(name: string): string {
  return `Giving access to the group ${name}`;
}

/** The folded summary's line (`V.selLine`): "1 experiment · 2 students", or the group's name. */
export function selectionLine(experiments: number, who: string | null): string {
  const parts = [
    ...(experiments ? [iaPlural(experiments, 'experiment')] : []),
    ...(who ? [who] : []),
  ];
  return parts.length ? parts.join(' · ') : IA05.nothingChosen;
}

/** The selection's plan (`V.sumPlan`): "Your access plan · ME ZG523" (identifier rule). */
export function selectionPlanWords(courseCode: string | null): string {
  return courseCode ? `Your access plan · ${courseCode}` : 'Your access plan';
}

/** Step 1's plan line (`V.planLine`), without the plan's id: "Active · 120 licences · ends 7 Oct 2027". */
export function planLineWords(status: string, licences: number, endsOn: string): string {
  return `${status} · ${licences} licences · ends ${endsOn}`;
}

/** The course option and step 3's course (`V.course`): "ME ZG523 — Thermodynamics & Heat Transfer". */
export function courseWords(code: string | null, name: string): string {
  return code ? `${code} — ${name}` : name;
}

/** Step 1's heading of experiments not held: "Also published in ME ZG523 — not in your access plan". */
export function notInPlanHeading(course: string): string {
  return `Also published in ${course} — not in your access plan`;
}

/** Step 2's count (`V.selCount`): "1 student selected". */
export function selectedWords(count: number): string {
  return count === 1 ? '1 student selected' : `${count} students selected`;
}

/** A student who already has a chosen experiment: "Already has Shell-and-Tube Heat Exchanger". */
export function alreadyHasWords(experiments: readonly string[]): string {
  return `Already has ${iaListText(experiments)}`;
}

/** A group's line in the pick list: "7 members", or "No members yet". */
export function membersWords(count: number): string {
  return count ? iaPlural(count, 'member') : IA05.noMembers;
}

/** Who, in the summary and the review: three names, then "and 2 more". */
export function studentsChosenWords(names: readonly string[]): string {
  if (names.length === 0) return IA05.notChosen;
  const shown = names.slice(0, 3).join(', ');
  return names.length > 3 ? `${shown} and ${names.length - 3} more` : shown;
}

/** A chosen group: "ME ZG523 — Sem II (7 members)". */
export function groupChosenWords(name: string, members: number): string {
  return `${name} (${iaPlural(members, 'member')})`;
}

/** The summary's formats (`V.sumFmts`): "WEB and VR — from your access plan". */
export function summaryFormatsWords(codes: readonly string[]): string {
  return codes.length ? `${formatsText(codes)} — from your access plan` : IA05.noFormats;
}

/** One line of what will be created: "Rahul Verma → Shell-and-Tube Heat Exchanger → Active". */
export function createdLine(who: string, experiments: readonly string[], status: string): string {
  return `${who} → ${experiments.join(', ')} → ${status}`;
}

/** A group grant's line (`<b>Group …</b>`): "Group ME ZG523 — Sem II". */
export function groupWho(name: string): string {
  return `Group ${name}`;
}

/** The group review's lines (`gsum`): stated, never computed against licences (D7). */
export function membersCanOpenWords(count: number): string {
  return `${iaPlural(count, 'member')} can open it straight away`;
}
export function memberWaitingWords(name: string): string {
  return `${name} is waiting for a licence`;
}
export function memberHasItWords(name: string): string {
  return `${name} already has it individually. That grant isn’t changed.`;
}
export function memberInactiveWords(name: string): string {
  return `${name} is inactive and can’t open experiments while inactive`;
}

/** Step 3's licences line, without the plan's id: "Licences: Your access plan · 120 licences · …". */
export function licencesLineWords(licences: number, term: string, endsOn: string): string {
  return `Licences: Your access plan · ${licences} licences · ${term}, ends ${endsOn}`;
}

/** The result's note: "Rahul sees it in My courses with WEB and VR." */
export function seesItWords(name: string, codes: readonly string[]): string {
  return `${firstOf(name)} sees it in My courses with ${formatsText(codes)}.`;
}

/** The result's link to the student: "Open Rahul Verma". */
export function openStudentWords(name: string): string {
  return `Open ${name}`;
}

/** The ended refusal's line (`V.endText`): "It ended on 7 October 2027, so …". */
export function planEndedLine(endsOn: string): string {
  return `It ended on ${longCalendarDay(endsOn)}, so its experiments can’t be given to students. Ask BITS for a renewal.`;
}

// ---- IA-07 Student record (`R.rIA07`, `vm07`, `stuHistory`) -------------------------------------

export const IA07 = {
  crumb: 'Students',
  accountActive: 'Account active',
  inactive: 'Inactive',
  give: 'Give this student access',
  reactivate: 'Reactivate account',
  pausedLine: 'You can give access or change this account again when BITS lifts the pause.',
  flashTitle: 'Saved',
  inactiveTitle: 'This account is inactive',
  experiments: 'Experiments given',
  openStudentAccess: 'Open Student access',
  columns: { experiment: 'Experiment', howGiven: 'How given', status: 'Status' },
  individually: 'Individually',
  foot: 'Formats come from your access plan; they are never chosen per student.',
  about: 'About',
  keys: {
    course: 'Course',
    group: 'Group',
    groups: 'Groups',
    programme: 'Programme',
    added: 'Added',
  },
  notInGroup: 'Not in a group',
  notRecorded: 'Not recorded',
  account: 'Account',
  accountLine:
    'Deactivating stops this student from opening experiments until you reactivate the account. Their work and access history are kept.',
  deactivate: 'Deactivate account…',
  history: 'History',
  noExperimentsCanGive:
    'Give this student access to choose experiments from your access plan. They’ll see the formats the plan includes.',
  noExperimentsNoPlan: 'Experiments can be given once BITS activates your institution’s access.',
  noExperimentsInactive: 'Reactivate the account before giving access.',
  noExperimentsPaused: 'Experiments can’t be given while your access plan is paused.',
  noExperimentsEnded: 'Experiments can’t be given while your access plan is ended.',
  deactivatedFlash: 'Account deactivated. Their work and access history are kept.',
  reactivatedFlash: 'Account reactivated.',
  // dialogs
  reasonLabel: 'Reason (required)',
  deactivateHint: 'Shown on the student record to your institution’s administrators.',
  deactivateConfirm: 'Deactivate account',
  deactivateBusy: 'Deactivating…',
  reactivateBusy: 'Reactivating…',
  cancel: 'Cancel',
  // history
  historyAdded: 'Added to People',
  historyAddedForm: 'Added with the Add student form',
  historyWithdrawn: 'Individual grant withdrawn',
  historyGroupNotChanged: ' · the group’s grant is not changed',
  historyGroupGrant: 'Group grant',
  historyGroupGrantWaiting: 'Group grant · waiting for a licence',
  historyDeactivated: 'Account deactivated',
  historyReactivated: 'Account reactivated',
} as const;

/** The eyebrow: "Student · GIT-2026-0418" (the institution's own student ID, which is shown). */
export function studentEyebrow(institutionStudentId: string): string {
  return `Student · ${institutionStudentId}`;
}

/** The empty experiments state: "Rahul hasn’t been given any experiments yet". */
export function noExperimentsTitle(name: string): string {
  return `${firstOf(name)} hasn’t been given any experiments yet`;
}

/** The table's caption: "Experiments given to Rahul Verma, one row per experiment". */
export function experimentsCaption(name: string): string {
  return `Experiments given to ${name}, one row per experiment`;
}

/** The About panel's name: "About Rahul Verma". */
export function aboutLabel(name: string): string {
  return `About ${name}`;
}

/** "Added": "8 Oct 2026 · imported by Meera Iyer" / "· added by …". */
export function addedWords(date: string, how: 'import' | 'form', by: string): string {
  return `${date} · ${how === 'import' ? 'imported by ' : 'added by '}${by}`;
}

/** The inactive notice's line: "Inactive since 8 Oct 2026 · Meera Iyer: “…” Sneha can’t open …". */
export function inactiveSinceLine(date: string, by: string, reason: string, name: string): string {
  return `Inactive since ${date} · ${by}: “${reason}” ${inactiveUntilLine(name)}`;
}

/** The inactive notice's line when no deactivation is recorded. */
export function inactiveUntilLine(name: string): string {
  return `${firstOf(name)} can’t open experiments until the account is reactivated.`;
}

/** The Account panel while inactive (`V.acctText`). */
export function reactivateAccountLine(name: string): string {
  return `Reactivating lets ${firstOf(name)} open the experiments they’ve been given again, while your access plan allows it.`;
}

/** The note under an inactive student's grant: "Sneha’s account is inactive." */
export function accountInactiveNote(name: string): string {
  return `${firstOf(name)}’s account is inactive.`;
}

/** The note under an ended grant: "Your access plan ended on 7 Oct 2027." (identifier rule). */
export function planEndedNote(date: string): string {
  return `Your access plan ended on ${date}.`;
}

/** The note under a paused grant: "Paused by BITS on 12 Oct 2026." */
export function pausedByNote(date: string): string {
  return `Paused by BITS on ${date}.`;
}

/** DL-2 Deactivate: "Deactivate Priya Natarajan’s account?". */
export function deactivateTitle(name: string): string {
  return `Deactivate ${name}’s account?`;
}
export function deactivateBody(name: string): string {
  return `${firstOf(name)} will see that the account is inactive and won’t be able to open any experiments until you reactivate it. Work and access history are kept.`;
}

/** DL-1 Reactivate: "Reactivate Priya Natarajan’s account?". */
export function reactivateTitle(name: string): string {
  return `Reactivate ${name}’s account?`;
}
export function reactivateBody(name: string, planEnded: boolean): string {
  return planEnded
    ? 'The account becomes active again. Experiments from your access plan stay closed because the plan has ended.'
    : `The account becomes active again, and the experiments ${firstOf(name)} has been given open again.`;
}

/** History: "Given Shell-and-Tube Heat Exchanger". */
export function givenWords(experiment: string): string {
  return `Given ${experiment}`;
}

/** History: "Given Shell-and-Tube Heat Exchanger through the group ME ZG523 — Sem II". */
export function givenThroughGroupWords(experiment: string, groupName: string): string {
  return `Given ${experiment} through the group ${groupName}`;
}

/** History note of an individual grant: "Individually · WEB and VR from your access plan". */
export function givenIndividuallyNote(codes: readonly string[], waiting: boolean): string {
  return `Individually · ${formatsText(codes)} from your access plan${waiting ? ' · waiting for a licence' : ''}`;
}

/** History note of an import: "Imported from godavari-me-zg523.csv". */
export function importedFromWords(file: string): string {
  return `Imported from ${file}`;
}

/** A quoted reason: "“Left the programme.”". */
export function quoted(reason: string): string {
  return `“${reason}”`;
}

/** The time and actor of a history entry (`h.t`): "12 Oct 2026, 11:05 · Meera Iyer". */
export function historyWhen(when: string, by: string | null): string {
  return by ? `${when} · ${by}` : when;
}

// ---- IA-14 Group (`R.rIA14`, `vm14`, `memberStatus`) ---------------------------------------------

export const IA14 = {
  crumb: 'Groups',
  eyebrow: 'Group',
  rename: 'Rename',
  addStudents: 'Add students',
  give: 'Give this group access',
  pausedLine: 'You can change this group again when BITS lifts the pause.',
  flashTitle: 'Saved',
  addPanelTitle: 'Add students to this group',
  addNoteNone:
    'Choose the students to add. Being in a group doesn’t give anyone experiments by itself.',
  searchStudents: 'Search students',
  searchPlaceholder: 'Name or student ID',
  candidatesList: 'Students who aren’t in this group',
  inactive: 'Inactive',
  noCandidateMatch: 'No student matches that search.',
  noCandidates: 'Everyone in People is already in this group.',
  cancel: 'Cancel',
  members: 'Members',
  noMembersTitle: 'No members yet',
  noMembersLine:
    'Add students to this group. Nothing is given to them until the group has experiments.',
  columns: { student: 'Student', status: 'Status', action: 'Action' },
  remove: 'Remove…',
  given: 'Experiments given to this group',
  nothingGivenTitle: 'Nothing given to this group yet',
  nothingGivenLine: 'Give this group an experiment, and its current members get it.',
  grantNote:
    'A group grant is recorded for the members the group has when access is given. Each member’s status is shown in Members, in words.',
  renamedFlash: 'Group renamed.',
  // member status words
  canOpen: 'Can open it',
  hasItIndividually: 'Has it individually',
  waiting: 'Waiting for a licence',
  addedAfter: 'Added after the group grant',
  individualWithdrawn: 'Individual grant withdrawn',
  active: 'Active',
  paused: 'Paused',
  accessEnded: 'Access ended',
  withdrawn: 'Withdrawn',
  inactiveNote: 'Can’t open experiments while inactive',
  // dialogs
  renameTitle: 'Rename group',
  nameLabel: 'Group name',
  saveName: 'Save name',
  removeConfirm: 'Remove from group',
} as const;

/** The member count once (`V.count`): "7 members", or "No members yet". */
export function memberCountWords(count: number): string {
  return count ? iaPlural(count, 'member') : IA14.noMembersTitle;
}

/** The add panel's note while the group has grants (`V.addNote`). */
export function addNoteWithGrants(experiments: readonly string[]): string {
  return `This group already has ${iaListText(experiments)}. Students you add now are shown as “Added after the group grant”; whether that grant reaches them isn’t decided yet.`;
}

/** The panel's button (`V.addLabel`): "Add students", "Add 1 student", "Add 2 students". */
export function addLabel(picked: number): string {
  return picked ? `Add ${iaPlural(picked, 'student')}` : IA14.addStudents;
}

/** The flash after adding (`doAdd`): "Vikram Joshi was added to the group." / "2 students were …". */
export function addedFlash(names: readonly string[]): string {
  return names.length === 1
    ? `${names[0]!} was added to the group.`
    : `${names.length} students were added to the group.`;
}

/** The members table's caption: "Members of ME ZG523 — Sem II". */
export function membersCaption(groupName: string): string {
  return `Members of ${groupName}`;
}

/** "Remove…" (`m.rmAria`): "Remove Priya Natarajan from this group". */
export function removeAria(name: string): string {
  return `Remove ${name} from this group`;
}

/** DL-1 Remove: "Remove Priya Natarajan from this group?". */
export function removeTitle(name: string): string {
  return `Remove ${name} from this group?`;
}
export function removeBody(name: string, groupName: string): string {
  return `${firstOf(name)} will no longer be a member of ${groupName}. Their student record stays in People.`;
}

/** The flash after removing (`dlgConfirm` `rmMember`). */
export function removedFlash(name: string): string {
  return `${name} was removed from the group. Their student record stays in People.`;
}

/** A grant item's date (`Given {{ g.date }}`) and a member's note: "Given 12 Oct 2026". */
export function givenOnWords(date: string): string {
  return `Given ${date}`;
}

/** The grants list's name: "Experiments given to ME ZG523 — Sem II". */
export function grantsListLabel(groupName: string): string {
  return `Experiments given to ${groupName}`;
}
