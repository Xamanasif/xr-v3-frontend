/**
 * The words of SA-14 Academic structure and SA-15 Area / course record as the owner-approved Super
 * Admin export draws them (V3 Refined B; design/v3-refined-b/roles/SA-v1, `project/sa-views-c.js`
 * `V.structure`, `V.area`, `V.course`, `SA.DLG.area`, `SA.DLG.course`). Every phrase is found
 * verbatim in the export's views (`structure.test.ts`); the composed lines take the export's forms
 * with the records' values (names, codes, counts and dates come from the service, never from the
 * export's sample data). What the export does not word — the history's events, the refusals, the
 * product's own facts beside the export's — keeps the frozen B7-07 wording or is an entry of the
 * state-copy register (`state-copy-structure.ts`, VD-12).
 */
import type { StructureEvent } from '@xr/domain';

import { stateWords } from './state-copy';

/** The export's `SA.plural`: “1 course”, “0 published experiments”. */
function plural(count: number, word: string): string {
  return `${count} ${count === 1 ? word : `${word}s`}`;
}

// ---- Shared by the three pages and their dialogs --------------------------------------------------

export const STRUCTURE_SHARED = {
  /** A course without a platform code (`span.rk-tag-warn`). */
  noCode: 'No platform code yet',
  /** An area or course without a description (`a.desc || …`). */
  noDescription: 'No description yet.',
  /** An area with no courses (`p.rk-next`). */
  noCourses: 'No courses yet. Add one to start using this area.',
  /** Every dialog's first button. */
  cancel: 'Cancel',
  /** “History · Newest first” (`section.rk-sec`). */
  history: 'History',
  historyNote: 'Newest first',
  /** Between two records named in one value (the export's `join(', ')`). */
  separator: ', ',
} as const;

// ---- SA-14 Academic structure (`V.structure`) ----------------------------------------------------

export const STRUCTURE_PAGE = {
  /** `h1.rb-h1`. */
  title: 'Academic structure',
  /** `p.rk-sub`. */
  lead: 'Engineering areas and the courses in them. Platform course codes are maintained by the Content Manager and shown read-only here.',
  /** `div.rk-head-act`: Add area (default), Add course (navy). */
  addArea: 'Add area',
  addCourse: 'Add course',
  /** The surface's name (`section.rk-surface[aria-label]`). */
  surfaceLabel: 'Engineering areas and courses',
  /** Each area's head: “Open area” (`a.rb-link`). */
  openArea: 'Open area',
  /** The surface's foot (`p.rk-ca-foot`). */
  foot: 'Areas group courses; there is no module layer. Retiring an area or course is not available.',
} as const;

/**
 * “Open area”'s accessible name: “Open area Chemical & Process”. The export names it “Open the
 * area …”; the product keeps the visible words at its start (WCAG 2.5.3 Label in Name; state-copy
 * `SA-14.open-area-name`).
 */
export function openAreaLabel(name: string): string {
  return `Open area ${name}`;
}

/** A course row's experiments: “4 published experiments”, “1 published experiment”. */
export function publishedWords(count: number): string {
  return plural(count, 'published experiment');
}

/** The flash after Add area or Add course (`SA.setFlash`): “Civil & Structural was added.”. */
export function addedWords(name: string): string {
  return `${name} was added.`;
}

export const ADD_AREA_DIALOG = {
  title: 'Add an engineering area',
  description:
    'It appears in the public area explorer and the catalogue once it has courses. No artwork is added here.',
  name: 'Area name',
  descriptionLabel: 'Description (optional)',
  confirm: 'Add area',
  busy: 'Adding…',
  /** The flash's second line. */
  added: 'Add courses to it to start using it.',
} as const;

export const ADD_COURSE_DIALOG = {
  title: 'Add a course',
  description: 'The platform course code is added by the Content Manager in Course codes.',
  name: 'Course name',
  area: 'Engineering area',
  chooseArea: 'Choose an area',
  descriptionLabel: 'Description (optional)',
  confirm: 'Add course',
  busy: 'Adding…',
  /** The flash's second line. */
  added: 'The Content Manager adds its platform course code.',
} as const;

// ---- SA-15 Area record (`V.area`) ----------------------------------------------------------------

export const AREA_PAGE = {
  /** `p.rk-eyebrow`. */
  eyebrow: 'Engineering area',
  rename: 'Rename',
  editDescription: 'Edit description',
  /** The courses section and its Add course (`rb-btn--ghost`). */
  courses: 'Courses',
  addCourse: 'Add course',
  /** `p.sa-footnote`. */
  footnote: 'Areas have no artwork set here, and can’t be retired.',
} as const;

// ---- SA-15 Course record (`V.course`) ------------------------------------------------------------

export const COURSE_PAGE = {
  /** `div.rk-meta` beside the code chip, or beside the missing-code tag. */
  codeMeta: 'Platform course code, maintained by the Content Manager',
  noCodeMeta: 'The Content Manager adds it in Course codes',
  /** `a.rk-goto` under 860 px. */
  goTo: 'Go to changes',
  /** The course section. */
  courseSection: 'Course',
  courseKey: 'Course',
  areaKey: 'Engineering area',
  descriptionKey: 'Description',
  codeKey: 'Platform course code',
  readOnly: 'Read-only here',
  /** “What uses this course”. */
  usesSection: 'What uses this course',
  experimentsKey: 'Published experiments',
  institutionsKey: 'Institutions',
  vendorsKey: 'Vendors in scope',
  peopleKey: 'People filed against it',
  noExperiments: 'None yet',
  none: 'None',
  nobody: 'Nobody',
  /** The panel (`aside.rk-aside` > `div.rk-panel`). */
  panel: 'Change this course',
  rename: 'Rename',
  editDescription: 'Edit description',
  moveGroup: 'Move to another area',
  move: 'Move to another area',
  movable:
    'Nobody is filed against it. Its experiments and the access plans that use it move with it.',
  blockedTitle: 'This course can’t be moved',
  panelFoot:
    'The platform course code is maintained by the Content Manager. Retiring a course is not available.',
} as const;

/** The course head's eyebrow: “Course · Mechanical & Manufacturing”. */
export function courseEyebrow(areaName: string): string {
  return `Course · ${areaName}`;
}

/** The blocked notice's line: “People are filed against it: 12 students · …. Nothing moves.”. */
export function blockedWords(who: string): string {
  return `People are filed against it: ${who}. Nothing moves.`;
}

/**
 * Who is filed against the course, in the product's facts (state-copy `SA-15.uses.people`): the
 * students by number, then the Faculty mapped to it by institution — “12 students · Dr S.
 * Ranganathan — Godavari Institute of Technology” — or nothing.
 */
export function peopleFiledWords(students: number, faculty: readonly string[]): string {
  return [students > 0 ? plural(students, 'student') : '', ...faculty].filter(Boolean).join(' · ');
}

/**
 * The Faculty mapped to the course at one institution: one person by name (“Dr S. Ranganathan —
 * Godavari Institute of Technology”), more by number (“4 Faculty members — BITS Pilani —
 * Hyderabad Campus”), state-copy `SA-15.uses.people`.
 */
export function facultyUseWords(institutionName: string, names: readonly string[]): string {
  return names.length === 1
    ? `${names[0]} — ${institutionName}`
    : `${plural(names.length, 'Faculty member')} — ${institutionName}`;
}

/** Faculty filed against the course when the record names none: “2 Faculty members”. */
export function facultyCountWords(count: number): string {
  return plural(count, 'Faculty member');
}

/**
 * What follows an institution's link: its own code for the course and whether its access has
 * ended — “ (MEC-523)”, “ (ended)”, “ (MEC-523, ended)” — state-copy `SA-15.uses.institutions`.
 */
export function institutionAfterWords(institutionCode: string | null, ended: boolean): string {
  const facts = [institutionCode ?? '', ended ? 'ended' : ''].filter(Boolean);
  return facts.length > 0 ? ` (${facts.join(', ')})` : '';
}

// ---- The dialogs of SA-15 (`SA.DLG.area`, `SA.DLG.course`) ---------------------------------------

/** “Rename Chemical & Process”. */
export function renameTitle(name: string): string {
  return `Rename ${name}`;
}

/** “Edit the description of Chemical & Process”. */
export function descriptionTitle(name: string): string {
  return `Edit the description of ${name}`;
}

export const RENAME_DIALOG = {
  areaDescription:
    'The new name shows in the public explorer and catalogue, vendor course lists and student-import matching.',
  courseDescription:
    'The new name shows in the public catalogue, vendor course lists and student-import matching. The platform course code doesn’t change.',
  areaName: 'Area name',
  courseName: 'Course name',
  confirm: 'Save name',
  busy: 'Saving…',
} as const;

export const DESCRIPTION_DIALOG = {
  areaDescription: 'The description shows in the public area explorer.',
  courseDescription: 'The description shows in the public catalogue.',
  label: 'Description',
  confirm: 'Save description',
  busy: 'Saving…',
  saved: 'Description saved.',
} as const;

/** The flash after a rename: “The area is now called …” / “The course is now called …”. */
export function renamedWords(kind: 'area' | 'course', name: string): string {
  return `The ${kind} is now called ${name}.`;
}

export const MOVE_DIALOG = {
  description:
    'Its published experiments and any access plans that use it move with it. Nobody is filed against it.',
  label: 'Move to',
  chooseArea: 'Choose an area',
  confirm: 'Move course',
  busy: 'Moving…',
} as const;

/** “Move Manufacturing Processes to another area?”. */
export function moveTitle(name: string): string {
  return `Move ${name} to another area?`;
}

/** The flash after a move: “The course moved to Electrical & Electronics.”. */
export function movedWords(areaName: string): string {
  return `The course moved to ${areaName}.`;
}

// ---- History (B7-07 `hist`, `doAddArea`, `doAddCourse`, `doRename`, `doDesc`, `doMove`) ----------

/** What a history entry says: the event and who did it, as B7-07 words each event. */
export function historyWhat(
  event: StructureEvent,
  actorName: string | null,
  note: string | null,
): string {
  const by = actorName ? ` by ${actorName}` : '';
  switch (event) {
    case 'area-added':
      return `Area added${by}`;
    case 'course-added':
      return `Course added${by}`;
    case 'renamed':
      return `Renamed${by}`;
    case 'description-changed':
      return `Description changed${by}`;
    case 'course-moved':
      return `Moved${by}`;
    case 'platform-code-set':
      return note
        ? `Platform code ${note} set by the Content Manager`
        : stateWords('SA-15.history.code-cleared');
  }
}

/** A move's note (B7-07 `doMove`): “From Mechanical & Manufacturing to Electrical & Electronics.” */
export function movedNote(from: string, to: string): string {
  return `From ${from} to ${to}.`;
}

/** A rename's note: “Was “Thermodynamics & Heat Transfer”.” */
export function renamedNote(previousName: string): string {
  return `Was “${previousName}”.`;
}

/**
 * An added course's note: “Mechanical & Manufacturing · no platform code yet.”; without the area
 * once the course has moved since (state-copy `SA-15.history`).
 */
export function courseAddedNote(areaName: string | null): string {
  return areaName ? `${areaName} · no platform code yet.` : 'No platform code yet.';
}
