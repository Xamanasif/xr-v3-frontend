import type { StateCopyEntry } from './state-copy';

/**
 * The state-copy entries of IA-09 Faculty record (B2-06 f15, f16) and IA-15 Faculty courses (B2-09)
 * — Phase-2 Package 2B, part of the one register (`state-copy.ts`, VD-12): every state string or
 * rule these screens show that their boards do not draw word for word.
 */
export const STATE_COPY_FACULTY = {
  // ---- IA-09 Faculty record (B2-06 f15, f16) ----
  'IA-09.loading': {
    screen: 'IA-09',
    state: 'The faculty record loading (screen readers)',
    words: 'Loading the faculty record',
    basis:
      'Board 04 "State grammar" Loading formula; IA-07 “Loading the student record”. B2-06 draws no faculty record loading frame',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-09.failed': {
    screen: 'IA-09',
    state: 'The faculty record failed to load (service unavailable)',
    words: 'The faculty record didn’t load. Nothing was lost.',
    basis:
      'Board 04 "State grammar" Failed + retry formula; IA-07 “The student record didn’t load. Nothing was lost.” B2-06 draws no record failure',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-09.failed.line': {
    screen: 'IA-09',
    state: 'The failed state’s next step',
    words: 'Try again. If it keeps happening, report the problem.',
    basis: 'Board 03 "Notices, empty, error, loading and read-only" (the failed notice’s line)',
    status: 'drawn',
  },
  'IA-09.not-found': {
    screen: 'IA-09',
    state: 'An address naming no faculty member of the admin’s institution',
    words: null,
    rule: 'The workspace’s in-shell not-found page (PU-15): an unknown ID, a student’s ID and another institution’s faculty member alike (`getFaculty` answers `not-found`).',
    basis: 'Board 08 not-found pattern; ADR-0005 §5 record guards; as IA-07',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-09.courses': {
    screen: 'IA-09',
    state: 'Which courses “Courses taught” lists',
    words: null,
    rule: 'The current mappings only (not removed), in the order the record answers them; a removed mapping stays on the record but is not listed. Each row: “<code> · <course name>” (the name alone for a course without a code), “<date> · <who assigned it> · <FMAP>”. The line under the table and “Open Faculty courses” show only with a course listed (B2-06 f16 draws neither).',
    basis:
      'B2-06 f15 (one current mapping), f16 (none); `getFacultyOutput.mappings` holds removed mappings too',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-09.no-courses.name': {
    screen: 'IA-09',
    state: 'No courses yet: whom the line names',
    words: null,
    rule: '“Assign a course so it appears in <last word of the full name>’s Faculty workspace.” — the record holds no surname, so the last word stands for it (“Dr Anita Desai” → “Desai’s”).',
    basis: 'B2-06 f16 “Assign a course so it appears in Desai’s Faculty workspace.”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-09.actions': {
    screen: 'IA-09',
    state: 'Where the record’s actions go, and when they are offered',
    words: null,
    rule: '“Assign a course” (header, and in the empty state) opens IA-15 with this person chosen in “Assign a course” (`?tab=faculty-courses&faculty=<id>`); “Remove…” opens the same address, where the removal is confirmed (DL-1) — the record removes nothing itself; “Open Faculty courses” opens IA-15. An inactive faculty member is offered no “Assign a course” (the service refuses an inactive one, B2-09 offers active members only) and the empty state shows its title alone; “Remove…” stays, as B2-09 offers it on every row. No deactivation or edit of the person is offered (PER-07, PER-08).',
    basis:
      'B2-06 f15, f16 (every action links to B2-09); B2-09 `canPick`, “Inactive faculty can’t be chosen”',
    status: 'provisional',
    decisions: ['VD-12', 'PER-07', 'PER-08'],
  },
  'IA-09.paused': {
    screen: 'IA-09',
    state: 'The faculty record while the institution’s access is paused',
    words: null,
    rule: 'Read-only: no “Assign a course” and no “Remove…” (the table has no action column); the empty state shows its title alone; the People paused notice (`IA-06.paused.title`, `IA-06.paused.line`) shows. The reads stay.',
    basis:
      'B2-01 f5 “no actions while paused”; `IA-06.paused.actions`; FacultyCourseService refuses every write `institution-paused`',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-09.details': {
    screen: 'IA-09',
    state: 'Details: who added or assigned, when it was not a person',
    words: null,
    rule: '“Added” and “Assigned” name the person who did it (`ActorRef.displayName`); with no person on the record the date stands alone.',
    basis: 'B2-06 f15 “8 Oct 2026 · Meera Iyer”, “9 Oct 2026 · Meera Iyer · FMAP-0021”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  // ---- IA-15 People › Faculty courses (B2-09) ----
  'IA-15.loading': {
    screen: 'IA-15',
    state: 'Faculty courses loading (screen readers)',
    words: 'Loading faculty courses',
    basis:
      'B2-06 f4 “Loading students” (the People list’s loading frame); B2-09 draws no loading frame',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-15.failed': {
    screen: 'IA-15',
    state: 'Faculty courses failed to load (any of its three reads)',
    words: 'We couldn’t load the faculty courses',
    basis:
      'B2-06 f5 “We couldn’t load the students”, with its line “Nothing has changed. Try again.” and “Try again”; B2-09 draws no failure',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-15.empty': {
    screen: 'IA-15',
    state: 'No faculty members yet',
    words: null,
    rule: 'The IA-08 empty state (“No faculty members yet”, `IA-08.empty`) in place of the list and the “Assign a course” panel: there is no one to assign a course to.',
    basis: 'B2-09 draws three faculty members; `IA-08.empty`',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-15.reads': {
    screen: 'IA-15',
    state: 'Where the table and the panel come from',
    words: null,
    rule: 'Rows: `PeopleService.listFaculty` (name, e-mail, status, the courses the current mappings name, in that order); each course’s “Remove…” removes its current mapping from `FacultyCourseService.list`. Faculty member options: the active rows, in list order. Course options: the courses in the institution’s content access as `InstitutionCourseCodeService.list` answers them, “<code> — <name>” (the name alone for a course without a code). With no course in content access the Course select offers “Choose a course” alone.',
    basis:
      'B2-09 f0 (“Courses in your content access”, “Active faculty members only”); note “Courses offered”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-15.search': {
    screen: 'IA-15',
    state: 'Searching the faculty list',
    words: null,
    rule: 'Matches name or e-mail, ignoring case, over the rows `PeopleService.listFaculty` answers; the count is “<n> of <total> faculty members” while searching. The panel is not narrowed.',
    basis: 'B2-09 `faView` (the script joins the name and the e-mail address of each row)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-15.preselect': {
    screen: 'IA-15',
    state: 'Arriving with `&faculty=<id>` (from IA-09)',
    words: null,
    rule: 'An active faculty member of the list is chosen in “Assign a course” once the list has loaded; an unknown or inactive ID chooses no one. The address is not rewritten; nothing else changes.',
    basis:
      'Appendix A IA-09 “?faculty= pre-select” (PROPOSED); B2-06 f15 “Assign a course” → B2-09',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-15.field-error': {
    screen: 'IA-15',
    state: 'Assigning refused for a reason B2-09 draws no words for',
    words: null,
    rule: 'An inactive faculty member (`IA-15.facultyId.active-only`) or a course no longer in content access (`IA-15.courseId.in-content-access`), a person or course gone (`not-found`): nothing is written, no message is shown, the lists are read again, that choice is cleared and focus goes to its field.',
    basis: 'B2-09 offers neither choice; the message keys are undrawn (`message: null`)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-15.assign.busy': {
    screen: 'IA-15',
    state: '“Assign course” while it is being sent',
    words: 'Assigning…',
    basis:
      'Board 10 "States · focus, validation, busy" (“the label says what is happening”: “Saving…”); B2-09 draws no busy state',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-15.remove.busy': {
    screen: 'IA-15',
    state: '“Remove course” while it is being sent',
    words: 'Removing…',
    basis: 'Board 10 "States · focus, validation, busy"; B2-09 draws no busy state',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-15.remove.check': {
    screen: 'IA-15',
    state: '“Remove…” before the confirmation opens',
    words: null,
    rule: '`FacultyCourseService.previewRemoval` is asked first (it writes nothing): the confirmation opens with the drawn warning when it answers one, without it otherwise. A refusal is handled as removing would be (`IA-15.moved-on`, paused); failed for now, nothing opens and nothing changes.',
    basis: 'B2-09 f2 (warning), f3 (no warning); note “Warning … warns before confirming (IA-F6)”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-15.no-marker.plural': {
    screen: 'IA-15',
    state: 'The removal warning with several written answers waiting',
    words: null,
    rule: '“<n> written answers in <code> are waiting for marking, and no other faculty member teaches the course. They will wait without a marker until you assign one.”',
    basis:
      'B2-09 f2 “1 written answer in ME ZG523 is waiting for marking, … It will wait without a marker until you assign one.”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-15.dialog-focus': {
    screen: 'IA-15',
    state: 'Where focus starts in the removal confirmation',
    words: null,
    rule: 'On “Cancel”, as board 10 draws every destructive DL-1 (B2-09’s script focuses “Remove course”); Cancel gives focus back to the “Remove…” that opened it.',
    basis: 'Board 10 "DL-1 · Confirm · destructive · focus on Cancel"; VD-07',
    status: 'provisional',
    decisions: ['VD-07'],
  },
  'IA-15.moved-on': {
    screen: 'IA-15',
    state: 'Removing refused because the mapping moved on (stale, already removed, gone)',
    words: null,
    rule: 'Nothing is written: the confirmation closes, the lists are read again and show the current state, and focus goes to the faculty member’s name in that row.',
    basis: 'P1-21 interim (SA-07 refusals), as `IA-07.moved-on`; B2-09 draws no refusal',
    status: 'provisional',
    decisions: ['P1-21'],
  },
  'IA-15.paused': {
    screen: 'IA-15',
    state: 'Faculty courses while the institution’s access is paused',
    words: null,
    rule: 'Read-only: no “Assign a course” panel, no row “Assign a course”, no “Remove…” (the table has no action column; it takes the full width); the People paused notice shows. A write refused `institution-paused` meanwhile shows the same notice and closes the confirmation.',
    basis: 'B2-01 f5 “no actions while paused”; `IA-06.paused.actions`',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-15.unavailable': {
    screen: 'IA-15',
    state: 'Assigning or removing failed for now (service unavailable)',
    words: null,
    rule: 'Nothing changes: the choices stay in the panel, or the confirmation stays open, and can be sent again; no message is shown.',
    basis:
      'Appendix F §6.6 “command unavailable → nothing changes … answers kept”; B2-09 draws no failure',
    status: 'provisional',
    decisions: ['VD-12'],
  },
} as const satisfies Readonly<Record<string, StateCopyEntry>>;
