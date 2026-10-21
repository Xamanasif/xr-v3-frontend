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
    state:
      'People while paused: what cannot be done (IA-06 … IA-11, IA-13 … IA-15 since Package 2B)',
    words:
      'You can’t add people or change their accounts, groups or courses until BITS lifts the pause.',
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
    rule: 'The roster’s course line under the group reads “No course recorded” (IA-v1); on the record the “Course” row is left out.',
    basis:
      'IA-v1 Main.dc.html IA-06 `course`; B2-06 draws every student with “ME ZG523” (from the import’s course code)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-06.several': {
    screen: 'IA-06',
    state: 'A student given several experiments, or in several groups',
    words: null,
    rule: 'The roster’s Access cell lists the experiments given now by name under the status, joined with “, ” (read as “Experiments given: …”); a status other than “No access yet” without one says “No current experiments”. Groups are joined with “, ” (“Groups: ” before them on phones).',
    basis:
      'IA-v1 Main.dc.html IA-06 `rowsR` (`expText`, `grpLab`); B2-06 draws one experiment and one group per student',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-06.group-filter-narrow': {
    screen: 'IA-06',
    state: 'The Group select below 640 px of the list',
    words: null,
    rule: 'V3: it stays, under the search, full width (`ia-gm-row` stacks); the status switch scrolls sideways with the pressed status in view.',
    basis:
      'IA-v1 ia-role.css (`.ia-gm-search,.ia-gm-sel{flex:1 1 100%}` below 640 px), rsp-ia06-375',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-06.unbuilt': {
    screen: 'IA-06',
    state: 'Ways to screens Package 2A did not build',
    words: null,
    rule: 'Package 2A did not render “Import students” (IA-11), the Groups (IA-13) and Faculty courses (IA-15) tabs, a faculty member’s name (IA-09), a group’s name on the record (IA-14) or “Assign a course” (IA-15) (DEV-21). Since Package 2B every one of them renders and opens its screen; nothing on People waits for a later phase.',
    basis:
      'B2-06 f0, f8, f14; B2-07 f3; DEV-21 interim (links to unbuilt screens are not rendered), closed for People by Package 2B',
    status: 'provisional',
    decisions: ['DEV-21'],
  },
  'IA-06.statuses': {
    screen: 'IA-06',
    state: 'The status switch and the status words',
    words: null,
    rule: 'All, then the directory’s own statuses that occur (or the one chosen), each with its count from the unfiltered list: Access active · No access yet · Inactive (`studentDirectoryStatus`). The choice goes to `listStudents` as before. The V3 export’s other words (Waiting for a licence, Paused, Access ended, Individual grant withdrawn, Joined a group after its grant, Removed from a group) are not held by the directory read and are not drawn. A status is the switch’s, not a chip; “Showing x of y” counts the chosen status.',
    basis:
      'IA-v1 Main.dc.html IA-06 (`segs`, `PST`) and HANDOFF §3; IA-ANALYSIS §3 (statuses not held)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-06.give-access': {
    screen: 'IA-06',
    state: 'The row’s “Give access” shortcut',
    words: null,
    rule: 'On a “No access yet” row of an active student while the institution can give access (`getMyOverview` status active or ending soon, not paused); it opens Give students access with the student chosen (`?student=`). Nothing is given from People.',
    basis: 'IA-v1 Main.dc.html IA-06 `canGive` and LINK-MAP “Give … access”',
    status: 'provisional',
    decisions: ['VD-12'],
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
      'Board 04 Empty formula and B2-06 f3 “No students yet”; the V3 export draws the same words (IA-v1 IA-08 `V.empty`, with “Add the people who teach your courses. …” and “Add faculty member”)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-08.loading': {
    screen: 'IA-08',
    state: 'The faculty list loading (screen readers)',
    words: 'Loading faculty members',
    basis:
      'B2-06 f4 “Loading students” (the Students tab); neither B2-06 nor the V3 export draws a Faculty loading frame (the kit’s skeleton row carries these words)',
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
    rule: 'One row: the individual grant, with “Also in <group>, which has this experiment” under “How given”, and “ · not changed” after it once the individual grant is withdrawn. The group grant has no row of its own; no grant is named by its id; no can / can’t-open statement is made (OD-B2-01).',
    basis:
      'IA-v1 Main.dc.html `saRow` `alsoText` (“· not changed” once the individual grant is withdrawn)',
    status: 'provisional',
    decisions: ['OD-B2-01'],
  },
  'IA-07.history': {
    screen: 'IA-07',
    state: 'History entries the V3 design does not draw',
    words: null,
    rule: 'Newest first. Every entry is dated “<day> <month> <year>, <hh:mm> · <who>”. Added one at a time: “Added to People” with “Added with the Add student form”. Reactivated: “Account reactivated”. A Super Admin status change: “Account status changed” with the reason. Withdrawn: “Individual grant withdrawn” with the reason. No entry names a grant by its id (identifier rule). Group membership is not in the student’s history (no command writes it).',
    basis:
      'IA-v1 Main.dc.html `stuHistory` (the V3 history words); owner identifier rule (IA lead decision 2); B2-06 script flash “Account reactivated.”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-07.history.unlisted': {
    screen: 'IA-07',
    state:
      'A grant in the student’s history that the record no longer lists (a group the student has left)',
    words: 'Access given',
    rule: 'Shown as the entry’s title in place of the experiment, which the record no longer names; the grant’s id is never shown (identifier rule).',
    basis:
      'IA-v1 Main.dc.html `stuHistory` (“Given <experiment>”) without the experiment; the v46 rule showed the grant’s id there',
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
  'IA-10.paused': {
    screen: 'IA-10',
    state: 'Add student / Add faculty member while the institution’s access is paused',
    words: null,
    rule: 'The V3 refusal replaces the page: “You can’t add people while your institution’s access is paused”, “People and their work are kept. You can add people again when BITS lifts the pause.”, “Back to Students” (or “Back to Faculty”) and Help. An add refused `institution-paused` meanwhile shows the same, its heading focused; nothing is written.',
    basis: 'IA-v1 Main.dc.html IA-10 `V.refuse`; B2-01 f5 “no actions while paused”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-10.examples': {
    screen: 'IA-10',
    state: 'The form’s examples',
    words: null,
    rule: 'Student ID: “Your institution’s ID, for example <the first student’s ID>.” from `listStudents` (“Your institution’s ID for this student.” with no student yet). The e-mail placeholder stays the product’s “name@godavari.edu.in”: no read holds the institution’s e-mail domain the V3 export builds it from (`name@{institution domain}`).',
    basis: 'IA-v1 Main.dc.html `vm10` (`sidHint`, `emailPh`) and HANDOFF §3 IA-10',
    status: 'provisional',
    decisions: ['VD-12'],
  },
} as const satisfies Readonly<Record<string, StateCopyEntry>>;
