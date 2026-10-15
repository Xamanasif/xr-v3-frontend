import type { StateCopyEntry } from './state-copy';

/**
 * The state-copy entries of IA-06 Students, IA-07 Student record, IA-08 Faculty, IA-10 Add a person (boards B2-06, B2-07) — Phase-2 Package 2A, part of the one
 * register (`state-copy.ts`, VD-12): every state string or rule these screens show that their
 * boards do not draw word for word.
 */
export const STATE_COPY_PEOPLE = {
  // ---- IA-06 People › Students / IA-08 People › Faculty (B2-06) ----
  'IA-06.paused.title': {
    screen: 'IA-06',
    state: 'People while the institution’s access is paused (IA-06, IA-07, IA-08, IA-10)',
    words: 'Read-only while your institution’s access is paused',
    basis:
      'B2-04 paused frame (`xr-notice--warn` title, verbatim); B2-01 f5 “Batch-0 banner; no actions while paused.” B2-06 and B2-07 draw no paused frame.',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-06.paused.line': {
    screen: 'IA-06',
    state: 'People while paused: what cannot be done',
    words: 'You can’t add people or change their accounts until BITS lifts the pause.',
    basis:
      'B2-04 paused line formula (“You can’t give or withdraw access until BITS lifts the pause.”); B2-01 f5 “Pages are read-only until BITS lifts the pause.”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-06.paused.actions': {
    screen: 'IA-06',
    state: 'People while paused: the actions',
    words: null,
    rule: 'The session’s `institution-paused` banner fact hides every People write (Add student, Add faculty member, Give this student access, Deactivate account…, Reactivate account) and the paused notice shows; a write refused `institution-paused` meanwhile shows the same notice. The reads stay.',
    basis:
      'B2-01 f5 “no actions while paused”; PeopleService refuses every write `institution-paused` (one rule for every IA write)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-06.count-one': {
    screen: 'IA-06',
    state: 'The count when the institution has one student (or one faculty member)',
    words: null,
    rule: '“1 student” / “1 of 1 student”, “1 faculty member”: the noun follows the total.',
    basis: 'B2-06 `count` (“12 students”, “3 faculty members”); the singular is undrawn',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-06.no-course': {
    screen: 'IA-06',
    state: 'A student filed against no course (added one at a time: B2-07 has no course field)',
    words: null,
    rule: '“Course and group” shows the group line alone; on the record the “Course” row is left out.',
    basis: 'B2-06 draws every student with “ME ZG523” (from the import’s course code)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-06.several': {
    screen: 'IA-06',
    state: 'A student given several experiments, or in several groups',
    words: null,
    rule: '“Experiments given”: one name and its formats per experiment, in the order given. Groups are joined with “, ”.',
    basis: 'B2-06 draws one experiment and one group per student',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-06.group-filter-narrow': {
    screen: 'IA-06',
    state: 'The Group filter below 600 px of content',
    words: null,
    rule: 'Hidden, as the v46 sheet hides `.xr-filter-2`; B2-06 draws no “More filters”. Search and Status stay.',
    basis:
      'B2-06 f7 “Mobile 375” (the same toolbar); xr-foundation.css `.xr-toolbar > .xr-filter-2{display:none}`',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-06.unbuilt': {
    screen: 'IA-06',
    state: 'Ways to screens Package 2A does not build',
    words: null,
    rule: '“Import students” (IA-11), the Groups (IA-13) and Faculty courses (IA-15) tabs, a faculty member’s name (IA-09), a group’s name on the record (IA-14) and “Assign a course” (IA-15) are not rendered (DEV-21). The drawn words that only mention them stay.',
    basis:
      'B2-06 f0, f8, f14; B2-07 f3; DEV-21 interim (links to unbuilt screens are not rendered)',
    status: 'provisional',
    decisions: ['DEV-21'],
  },
  'IA-06.tab-address': {
    screen: 'IA-06',
    state: 'The People address with a tab',
    words: null,
    rule: '`?tab=faculty` shows Faculty (IA-08). Any other `tab` shows Students and the address is replaced by `/institute/people`.',
    basis: 'Appendix A IA-06 / IA-08 register routes; B2-06 tab links',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-08.search': {
    screen: 'IA-08',
    state: 'Searching the faculty list',
    words: null,
    rule: 'Matches name or e-mail, ignoring case, over the rows `PeopleService.listFaculty` answers (the read takes no search).',
    basis: 'B2-06 `fcView` (the script joins the name and the e-mail address of each row)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-08.empty': {
    screen: 'IA-08',
    state: 'No faculty members yet',
    words: 'No faculty members yet',
    basis:
      'B2-06 draws no empty Faculty list; board 04 Empty formula and B2-06 f3 “No students yet”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-08.loading': {
    screen: 'IA-08',
    state: 'The faculty list loading (screen readers)',
    words: 'Loading faculty members',
    basis: 'B2-06 f4 “Loading students” (the Students tab); B2-06 draws no Faculty loading frame',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-08.failed': {
    screen: 'IA-08',
    state: 'The faculty list failed to load',
    words: 'We couldn’t load the faculty members',
    basis: 'B2-06 f5 “We couldn’t load the students” (the Students tab)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  // ---- IA-07 Student record (B2-06 f8 … f13, f17) ----
  'IA-07.loading': {
    screen: 'IA-07',
    state: 'The student record loading (screen readers)',
    words: 'Loading the student record',
    basis: 'Board 04 "State grammar" Loading formula; B2-06 draws no record loading frame',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-07.failed': {
    screen: 'IA-07',
    state: 'The student record failed to load (service unavailable)',
    words: 'The student record didn’t load. Nothing was lost.',
    basis: 'Board 04 "State grammar" Failed + retry formula; B2-06 draws no record failure',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-07.failed.line': {
    screen: 'IA-07',
    state: 'The failed state’s next step',
    words: 'Try again. If it keeps happening, report the problem.',
    basis: 'Board 03 "Notices, empty, error, loading and read-only" (the failed notice’s line)',
    status: 'drawn',
  },
  'IA-07.not-found': {
    screen: 'IA-07',
    state: 'An address naming no student of the admin’s institution',
    words: null,
    rule: 'The workspace’s in-shell not-found page (PU-15): unknown and another institution’s student alike.',
    basis: 'Board 08 not-found pattern; ADR-0005 §5 record guards',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-07.no-experiments.line': {
    screen: 'IA-07',
    state: 'No experiments given yet: the line under the heading',
    words:
      'Give this student access to choose experiments from your access plan. They’ll see the formats the plan includes.',
    basis:
      'B2-06 f8 (“… He’ll see the formats the plan includes.”) — the record holds no pronoun, so the line says “They’ll”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-07.inactive.line': {
    screen: 'IA-07',
    state: 'The inactive notice’s second sentence',
    words: null,
    rule: '“<first name> can’t open experiments until their account is reactivated.” after the “Inactive since …” line.',
    basis:
      'B2-06 f11 (“Sneha can’t open experiments until her account is reactivated.”) — the record holds no pronoun',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-07.grant-words': {
    screen: 'IA-07',
    state: 'A grant word B2-06 does not draw on the record',
    words: null,
    rule: '`withdrawn`: “Withdrawn” with “Withdrawn <date> · “<reason>”” under it; `access-ended`: “Access ended”; `paused` (not answered for this screen): “Paused”. Each in the quiet (off) pill, “Paused” in the paused one.',
    basis:
      'B2-04 `LBL` (“Withdrawn”, “Access ended”) and its withdrawn rows; B2-03 plan page “Paused”; B2-06 f17 withdrawn line',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-07.also': {
    screen: 'IA-07',
    state: 'An individual grant that an active group grant also covers',
    words: null,
    rule: 'One row: the individual grant, with “Also in <group>, which has this experiment · <SACC>” under “How given”, and “· not changed” after it once the individual grant is withdrawn. The group grant has no row of its own; no can / can’t-open statement is made (OD-B2-01).',
    basis: 'B2-06 f17 (withdrawn, “· not changed”); B2-04 `alsoText` (active, without it)',
    status: 'provisional',
    decisions: ['OD-B2-01'],
  },
  'IA-07.history': {
    screen: 'IA-07',
    state: 'History entries B2-06 does not draw',
    words: null,
    rule: 'Newest first. Every entry is dated “<day> <month> <year>, <hh:mm> · <who>”. Added one at a time: “Added to People” with no note. Reactivated: “Account reactivated”. A Super Admin status change: “Account status changed” with the reason. An individual grant withdrawn with no group grant: “Individual grant <SACC> withdrawn” with the reason. A grant the record no longer lists (a group the student has left): its ID stands in for the experiment. Group membership is not in the student’s history (no command writes it).',
    basis:
      'B2-06 f8 … f11, f17 (f10 and f11 draw some dates without the time); B2-06 script flash “Account reactivated.”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-07.details': {
    screen: 'IA-07',
    state: 'Details B2-06 does not draw',
    words: null,
    rule: 'Added one at a time: “<date> · added by <who>”. No programme: the “Programme” row is left out. No group: “No group”. Several courses: one line each.',
    basis: 'B2-06 f8 “8 Oct 2026 · imported by Meera Iyer”; B2-06 `grpText` “No group”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-07.moved-on': {
    screen: 'IA-07',
    state: 'Deactivate or reactivate refused because the record moved on',
    words: null,
    rule: 'Nothing is written: the dialog closes, the record is read again and focus goes to the page title.',
    basis: 'P1-21 interim (SA-07 refusals); B2-06 draws no refusal',
    status: 'provisional',
    decisions: ['P1-21'],
  },
  'IA-07.unavailable': {
    screen: 'IA-07',
    state: 'Deactivate or reactivate failed for now (service unavailable)',
    words: null,
    rule: 'Nothing changes: the dialog stays open with the reason as typed and can be confirmed again.',
    basis: 'Appendix F §6.6 “command unavailable → nothing changes … answers kept”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  // ---- IA-10 Add a student / Add a faculty member (B2-07 f0 … f4) ----
  'IA-10.unavailable': {
    screen: 'IA-10',
    state: 'Adding failed for now (service unavailable)',
    words: null,
    rule: 'Nothing changes: the form keeps what was typed and can be sent again; no message is shown.',
    basis:
      'Appendix F §6.6 “command unavailable → nothing changes … answers kept”; B2-07 draws no failure',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-10.check-order': {
    screen: 'IA-10',
    state: 'Errors found by the service in two passes',
    words: null,
    rule: 'The drawn formats (a full name, a full e-mail address, a student ID) are checked first; “already belongs to someone in People” / “is already used by” follow once those pass. B2-07 f1 shows a format error and a duplicate ID together.',
    basis: 'B2-07 f1; PeopleService.addStudent (schema, then the domain’s uniqueness rule)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
} as const satisfies Readonly<Record<string, StateCopyEntry>>;
