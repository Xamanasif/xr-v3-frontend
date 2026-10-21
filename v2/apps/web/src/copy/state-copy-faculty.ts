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
    rule: 'The current mappings only (not removed), in the order the record answers them; a removed mapping stays on the record but is not listed. Each row (V3): the code chip and the course name (the name alone for a course without a code), “Your course code <code>” where the institution has one (`InstitutionCourseCodeService.list`, read once for the page), and “<date> · <who assigned it>” — never the mapping’s reference (the identifier rule). “Open Faculty courses” and the foot line show in every state.',
    basis:
      'IA-v1 Main.dc.html IA-09 (`vm09`: `when`, `own`) and HANDOFF §9 (no FMAP id); B2-06 f15, f16; `getFacultyOutput.mappings` holds removed mappings too',
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
    rule: '“Assign a course” (header, and in the empty state) opens IA-15 with this person chosen in “Assign a course” (`?tab=faculty-courses&faculty=<id>`); “Remove…” (the quiet row action) opens the same address, where the removal is confirmed (DL-1) — the record removes nothing itself (the V3 export opens DL-1 on the record; the product keeps its one confirmation on IA-15); “Open Faculty courses” opens IA-15. An inactive faculty member is offered no “Assign a course”: the record shows “This faculty account is inactive — Inactive faculty members can’t be assigned courses.” and the empty state says the same; “Remove…” stays. No deactivation or edit of the person is offered (PER-07, PER-08).',
    basis:
      'B2-06 f15, f16 (every action links to B2-09); IA-v1 Main.dc.html IA-09 (`inactive` notice, `noCoursesD`); B2-09 `canPick`',
    status: 'provisional',
    decisions: ['VD-12', 'PER-07', 'PER-08'],
  },
  'IA-09.paused': {
    screen: 'IA-09',
    state: 'The faculty record while the institution’s access is paused',
    words: null,
    rule: 'Read-only: no “Assign a course” and no “Remove…” (the action column stays, empty); the paused notice shows “Read-only while your institution’s access is paused” (`IA-06.paused.title`) with the V3 export’s “You can change the courses they teach again when BITS lifts the pause.” The reads stay.',
    basis:
      'B2-01 f5 “no actions while paused”; `IA-06.paused.actions`; FacultyCourseService refuses every write `institution-paused`',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-09.details': {
    screen: 'IA-09',
    state: 'Who added or assigned, when it was not a person',
    words: null,
    rule: '“Added” (in the head: “Added 8 Oct 2026 · Meera Iyer”) and “Assigned” name the person who did it (`ActorRef.displayName`); with no person on the record the date stands alone. The V3 export folds the Details panel into the head; the e-mail shows once.',
    basis:
      'IA-v1 Main.dc.html IA-09 head (`added`) and CHECKS “IA-09 … Details panel moves into the head”; B2-06 f15',
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
    rule: 'The V3 export’s empty state in the list (“No faculty members yet — Add faculty members in People first, then assign the courses they teach here.” with “Add faculty member”, not while paused); the panel says “Add a faculty member in People first.”',
    basis: 'IA-v1 Main.dc.html IA-15 `V.empty`, `cantText`; B2-09 draws three faculty members',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-15.reads': {
    screen: 'IA-15',
    state: 'Where the table and the panel come from',
    words: null,
    rule: 'Rows: `PeopleService.listFaculty` (name, e-mail, status, the courses the current mappings name, in that order); each course’s “Remove…” removes its current mapping from `FacultyCourseService.list`. Faculty member options: the active rows, in list order. Course options: the courses in the institution’s content access as `InstitutionCourseCodeService.list` answers them, “<code> — <name>” (the name alone for a course without a code). With no course in content access the panel says “Courses appear here when BITS activates your institution’s access.” instead of its fields, and no row offers “Assign a course”.',
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
    rule: 'On “Cancel”, as board 10 draws every destructive DL-1 and the V3 export does (`ia-dlg-cancel`; an `alertdialog` with the red confirm); Cancel gives focus back to the “Remove…” that opened it.',
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
    rule: 'Read-only: the panel says “Assigning is unavailable while your institution’s access is paused.” instead of its fields; no row “Assign a course”, no “Remove…”; the paused notice (“You can assign or remove courses again when BITS lifts the pause.”) shows. A write refused `institution-paused` meanwhile shows the same, focus on the notice, and closes the confirmation.',
    basis:
      'IA-v1 Main.dc.html IA-15 (`cantText`), `peopleHead.pausedD`; B2-01 f5 “no actions while paused”',
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
