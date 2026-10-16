/**
 * The words of Phase 6’s Academic structure: SA-14 Academic structure (board B7-07 f0, f7; B7-12
 * f12 … f15) and SA-15 Area / course record (B7-07 f1 … f6, f8; B7-10 f9). Every phrase is the
 * frozen boards’ own, found verbatim in B7-07’s markup or script (`structure.test.ts`); the composed
 * lines take the board script’s forms with the records’ values (names, codes, counts and dates
 * come from the service, never from the board). What B7-07 does not word is a provisional entry of
 * the state-copy register (`state-copy-structure.ts`, VD-12) and is read from there.
 *
 * P1-14 / VD-10: B7-07 writes the decision id “(D3)” into two sentences — the structure’s foot note
 * and the area record’s note. The product shows both without it (`STRIPPED_STRUCTURE`, state-copy
 * `SA-14.decision-ids`); the frozen wording is kept beside it, so the copy stays traceable.
 */
import type { StructureEvent } from '@xr/domain';

import { stateWords } from './state-copy';

function plural(count: number, word: string): string {
  return count === 1 ? `1 ${word}` : `${count} ${word}s`;
}

/**
 * The two B7-07 sentences that carry a decision id (P1-14 / VD-10: “Strip the suffix through a
 * copy table and keep the sentence”): `words` is shown, `drawn` is the frozen board’s wording.
 */
export const STRIPPED_STRUCTURE = {
  footNote: {
    words:
      'Platform course codes are maintained by the Content Manager and shown read-only here. Retiring an area or course is not available.',
    drawn:
      'Platform course codes are maintained by the Content Manager and shown read-only here. Retiring an area or course is not available (D3).',
    ids: ['D3'],
  },
  areaNote: {
    words: 'Areas have no artwork set here, and can’t be retired.',
    drawn: 'Areas have no artwork set here, and can’t be retired (D3).',
    ids: ['D3'],
  },
} as const;

// ---- SA-14 Academic structure (B7-07 f0, f7; B7-12 f12 … f15) -----------------------------------

export const STRUCTURE_PAGE = {
  /** `h1.xr-h1`. */
  title: 'Academic structure',
  /** `div.xr-phead-actions`: Add area (secondary), Add course (the one primary). */
  addArea: 'Add area',
  addCourse: 'Add course',
  /** Each area’s head: “Open area” (`xr-btn--text xr-btn--sm`). */
  openArea: 'Open area',
  /** Each course row’s “Open” (`xr-btn--secondary xr-btn--sm`). */
  open: 'Open',
  /** A course without a platform code, in its row (f0 “Fluid Mechanics”). */
  noCode: 'No platform code yet',
  /** An area with no courses (`div.xr-section-body > p.xr-body`). */
  noCourses: 'No courses yet. Add one to start using this area.',
  /** An area or course without a description (`a.desc || …`). */
  noDescription: 'No description yet.',
} as const;

/** The header line: “3 engineering areas · 6 courses · feeds the public explorer, …”. */
export function structureSummary(areas: number, courses: number): string {
  return `${plural(areas, 'engineering area')} · ${plural(courses, 'course')} · feeds the public explorer, the catalogue, Vendor course lists and student-import matching`;
}

/** An area head’s count: “3 courses”, “1 course”. */
export function courseCountWords(count: number): string {
  return plural(count, 'course');
}

/** A course row’s experiments: “4 published experiments”, “1 published experiment”, or none yet. */
export function publishedWords(count: number): string {
  return count > 0 ? plural(count, 'published experiment') : 'no published experiments yet';
}

/** “Open area Chemical & Process” (`aria-label`). */
export function openAreaLabel(name: string): string {
  return `Open area ${name}`;
}

/** “Open Fluid Mechanics” (`aria-label`). */
export function openCourseLabel(name: string): string {
  return `Open ${name}`;
}

/** The Add area dialog (B7-07 script `doAddArea`; `Sl-aat`). */
export const ADD_AREA_DIALOG = {
  title: 'Add an engineering area',
  name: 'Area name',
  description: 'Description',
  optional: '(optional)',
  note: 'No artwork is added here — who supplies area artwork is still open.',
  confirm: 'Add area',
  busy: 'Adding…',
  added: 'Area added. Add a course to start using it.',
} as const;

/** The Add course dialog (B7-07 f7; script `doAddCourse`; `Sl-act`). */
export const ADD_COURSE_DIALOG = {
  title: 'Add a course',
  name: 'Course name',
  area: 'Engineering area',
  description: 'Description',
  optional: '(optional)',
  note: 'The platform course code is added by the Content Manager in Course codes.',
  confirm: 'Add course',
  busy: 'Adding…',
} as const;

/** “Course added to Chemical & Process. It has no platform code yet — …” (`doAddCourse`). */
export function courseAddedWords(areaName: string): string {
  return `Course added to ${areaName}. It has no platform code yet — the Content Manager adds it in Course codes.`;
}

// ---- SA-15 Area / course record (B7-07 f1 … f6, f8; B7-10 f9) -----------------------------------

export const RECORD_PAGE = {
  /** `a.xr-back`. */
  back: 'Academic structure',
  /** The area record’s overline (`dOver`). */
  areaOverline: 'Engineering area',
  /** `div.xw-actions` (Move only on a course). */
  rename: 'Rename',
  editDescription: 'Edit description',
  move: 'Move to another area',
  /** The course section and its `dl.xl-kv.xv-kv`. */
  courseSection: 'Course',
  areaKey: 'Engineering area',
  descriptionKey: 'Description',
  codeKey: 'Platform course code',
  /** Under the code (with the read-only icon). */
  codeReadOnly: 'Read-only · maintained by the Content Manager',
  /** “What uses this course”. */
  usesSection: 'What uses this course',
  usesKeys: {
    experiments: 'Published experiments',
    institutions: 'Institutions with access',
    vendors: 'Vendors with this course in scope',
    faculty: 'Faculty mapped to it',
    students: 'Students filed against it',
  },
  none: 'None',
  cantMove: 'Because people are filed against it, this course can’t be moved.',
  /** The area section (f5). */
  areaSection: 'Engineering area',
  coursesKey: 'Courses',
  noCourses: 'No courses yet',
  /** “History · Newest first”. */
  history: 'History',
  historyMeta: 'Newest first',
} as const;

/** The course record’s overline: “Course · Chemical & Process” (upper-cased by CSS). */
export function courseOverline(areaName: string): string {
  return `Course · ${areaName}`;
}

/** An area record’s course line: “Process Instrumentation & Control · CHE ZG513”. */
export function areaCourseLine(name: string, platformCode: string | null): string {
  return platformCode ? `${name} · ${platformCode}` : `${name} · no platform code yet`;
}

/** The rename dialog (B7-07 f6; script `renTitle`, `renLabel`, `renWarn`, `doRename`). */
export const RENAME_DIALOG = {
  confirm: 'Save name',
  busy: 'Saving…',
  renamed: 'Renamed. The explorer, catalogue and Vendor course lists show the new name.',
} as const;

export function renameTitle(kind: 'area' | 'course'): string {
  return kind === 'course' ? 'Rename course' : 'Rename area';
}

export function renameLabel(kind: 'area' | 'course'): string {
  return kind === 'course' ? 'Course name' : 'Area name';
}

/** Where the name shows, and what stays as it is (`renWarn`). */
export function renameWarning(
  record:
    { readonly kind: 'course'; readonly platformCode: string | null } | { readonly kind: 'area' },
): string {
  const where =
    'The new name shows in the public explorer, the catalogue, Vendor course lists and student-import matching. ';
  if (record.kind === 'area') return `${where}Its courses stay in it.`;
  const code = record.platformCode
    ? `The platform code ${record.platformCode}`
    : 'The platform code';
  return `${where}${code} and every institution’s own course code stay as they are.`;
}

/** The description dialog (`dscTitle`, `doDesc`). */
export const DESCRIPTION_DIALOG = {
  label: 'Description',
  confirm: 'Save description',
  busy: 'Saving…',
  saved: 'Description saved.',
} as const;

export function descriptionTitle(name: string): string {
  return `Edit the description of ${name}`;
}

/** The inline move panel (B7-07 f3, f4; B7-10 f9; script `openMove`, `doMove`). */
export const MOVE_PANEL = {
  blockedTitle: 'Can’t move this course',
  close: 'Close',
  legend: 'Move to',
  cancel: 'Cancel',
  confirm: 'Move course',
  busy: 'Moving…',
} as const;

export function moveTitle(name: string): string {
  return `Move ${name} to another area`;
}

/**
 * Who is filed against the course (`blockText`): “People are filed against this course — 12
 * students · Dr S. Ranganathan — Godavari. It stays in Mechanical & Manufacturing.” The Faculty
 * part is the record’s own “Faculty mapped to it” words.
 */
export function blockedWords(students: number, facultyWords: string, areaName: string): string {
  const who = [students > 0 ? plural(students, 'student') : '', facultyWords]
    .filter(Boolean)
    .join(' · ');
  return `People are filed against this course — ${who}. It stays in ${areaName}.`;
}

/**
 * What moves with the course (`depWarn`): “Its 2 published experiments, 1 institution’s access
 * move with it. …”, or “Nothing else uses it yet. …”. More than one institution or Vendor takes
 * the plural possessive (state-copy `SA-15.moves-with-it`).
 */
export function movesWithItWords(
  experiments: number,
  institutions: number,
  vendors: number,
): string {
  const tail = 'The explorer and catalogue show it under the new area.';
  if (experiments === 0 && institutions === 0 && vendors === 0) {
    return `Nothing else uses it yet. ${tail}`;
  }
  const access =
    institutions === 0
      ? ''
      : institutions === 1
        ? ', 1 institution’s access'
        : `, ${institutions} institutions’ access`;
  const lists =
    vendors === 0
      ? ''
      : vendors === 1
        ? ' and 1 Vendor’s course list'
        : ` and ${vendors} Vendors’ course lists`;
  return `Its ${plural(experiments, 'published experiment')}${access}${lists} move with it. ${tail}`;
}

/** “Manufacturing Processes is now in Electrical & Electronics.” (`doMove`). */
export function movedWords(courseName: string, areaName: string): string {
  return `${courseName} is now in ${areaName}.`;
}

// ---- “What uses this course” values (B7-07 f1 … f4, f8) ----------------------------------------

/**
 * One institution with access: “Godavari Institute of Technology (MEC-523)”, “Malnad College of
 * Engineering (ended)”; both facts as state-copy `SA-15.uses.institutions` words them.
 */
export function institutionUseWords(
  name: string,
  institutionCode: string | null,
  ended: boolean,
): string {
  if (institutionCode && ended) return `${name} (${institutionCode}, ended)`;
  if (institutionCode) return `${name} (${institutionCode})`;
  if (ended) return `${name} (ended)`;
  return name;
}

/**
 * The Faculty mapped to the course at one institution: one person by name (“Dr S. Ranganathan —
 * Godavari”), more by number (“4 Faculty members — BITS Pilani — Hyderabad Campus”), state-copy
 * `SA-15.uses.faculty`.
 */
export function facultyUseWords(institutionName: string, names: readonly string[]): string {
  return names.length === 1
    ? `${names[0]} — ${institutionName}`
    : `${plural(names.length, 'Faculty member')} — ${institutionName}`;
}

/** A list of uses joined as the board joins them (`join(' · ')`), or “None”. */
export function usesList(items: readonly string[]): string {
  return items.length > 0 ? items.join(' · ') : RECORD_PAGE.none;
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

/** A move’s note (B7-07 `doMove`): “From Mechanical & Manufacturing to Electrical & Electronics.” */
export function movedNote(from: string, to: string): string {
  return `From ${from} to ${to}.`;
}

/** A rename’s note: “Was “Thermodynamics & Heat Transfer”.” */
export function renamedNote(previousName: string): string {
  return `Was “${previousName}”.`;
}

/**
 * An added course’s note: “Mechanical & Manufacturing · no platform code yet.”; without the area
 * once the course has moved since (state-copy `SA-15.history`).
 */
export function courseAddedNote(areaName: string | null): string {
  return areaName ? `${areaName} · no platform code yet.` : 'No platform code yet.';
}
