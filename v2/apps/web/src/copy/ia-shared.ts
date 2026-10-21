/**
 * The words more than one Institute Admin screen group draws (V3 Refined B; the owner-approved
 * export design/v3-refined-b/roles/IA-v1 `project/Main.dc.html`: the script's `RST`, `PST`,
 * `planSt`, `instSt`, `FN`, `fmCells` / `fmBadges`, `saRow`, `expBadges`, the step indicators of
 * `vm05` / `vm11`, the management toolbars of `vm04` / `vm06` / `vm08` / `vm15`, and the shared
 * failed and paused states). Every phrase is the export's own, found verbatim in its markup or
 * script (`ia-shared.test.ts`); the composed lines take the script's forms with the records'
 * values (names, counts and dates are never copied from the export's sample world).
 *
 * No line names a record by its internal reference (owner's identifier rule, IA lead decision 2):
 * where the export writes an access plan's id, the line names "your access plan" instead.
 *
 * What one screen group alone draws is in its own module (`ia-access.ts`, `ia-people.ts`, …). The
 * v46 words the Faculty pages also read (`student-access.ts`, `institute-people.ts`) are unchanged.
 */
import type { FormatCode } from '@xr/ui';

// ---- forms --------------------------------------------------------------------------------------

/** The script's `plural`: "1 student", "7 students", "2 rows". */
export function iaPlural(count: number, one: string, many = `${one}s`): string {
  return `${count} ${count === 1 ? one : many}`;
}

/** The script's `listText`: "WEB", "WEB and VR", "WEB, AR and VR". */
export function iaListText(items: readonly string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

// ---- formats ------------------------------------------------------------------------------------

/** Each format's name (the script's `FN`). */
export const IA_FORMAT_NAMES: Readonly<Record<FormatCode, string>> = {
  WEB: 'Browser',
  AR: 'Augmented reality',
  VR: 'Virtual reality',
  MR: 'Mixed reality',
};

/** A format cell's state in words (`fmCells`): in the plan, or given with a student's grant. */
export const IA_FORMAT_STATE_WORDS = {
  on: 'In your plan',
  given: 'Given with this grant',
  pub: 'Published, not in your plan',
  none: 'Not published',
} as const;

/** The key line under the plan card (`fmBadges` `key`): "WEB and VR in your plan · …". */
export const IA_FORMAT_KEY_WORDS = {
  on: 'in your plan',
  pub: 'published, not in your plan',
  none: 'not published',
} as const;

/** One format cell for screen readers (`fmBadges` `sr`): "WEB, Browser: In your plan". */
export function formatCellWords(format: FormatCode, state: string): string {
  return `${format}, ${IA_FORMAT_NAMES[format]}: ${state}`;
}

/** A format list's name (`fmAria`): "Formats of Shell-and-Tube Heat Exchanger". */
export function formatsOfLabel(experiment: string): string {
  return `Formats of ${experiment}`;
}

/** A row's badges (`saRow`, `expBadges`, `vm14`): "Formats from your plan: WEB, VR". */
export function formatsFromPlanLabel(codes: readonly string[]): string {
  return `Formats from your plan: ${codes.join(', ')}`;
}

/** A grouped table's head (`vm04`, `vm03`): "Formats from your access plan: WEB, VR" ("none"). */
export function formatsFromAccessPlanLabel(codes: readonly string[]): string {
  return `Formats from your access plan: ${codes.length > 0 ? codes.join(', ') : 'none'}`;
}

// ---- grants -------------------------------------------------------------------------------------

/** How a grant reached the student (`saRow` `viaText`). */
export const IA_HOW_GIVEN = {
  individually: 'Individually',
} as const;

/** Through a group (`saRow` `viaText`): "Group: ME ZG523 — Sem II". */
export function viaGroupLabel(groupName: string): string {
  return `Group: ${groupName}`;
}

/** The columns of a grants table (IA-03, IA-04 `ia-gt`; IA-07 `ia-lt--sr`). */
export const IA_GRANT_COLUMNS = {
  student: 'Student',
  experiment: 'Experiment',
  how: 'How given',
  status: 'Status',
  /** The action column's head, read only. */
  action: 'Action',
} as const;

/** The count of a grouped table's group (`vm04`, `vm03`): "1 student", "6 students". */
export function studentCountLabel(count: number): string {
  return iaPlural(count, 'student');
}

// ---- management toolbar -------------------------------------------------------------------------

/** The toolbar's fixed words (`vm04`, `vm06`, `vm08`, `vm15`). */
export const IA_TOOLBAR = {
  clearFilters: 'Clear filters',
} as const;

/** How many rows the filters leave (`shownText`): "Showing 3 of 12". */
export function showingLabel(shown: number, of: number): string {
  return `Showing ${shown} of ${of}`;
}

/** The search's chip (`chips`): "Search: “rahul”". */
export function searchChipLabel(search: string): string {
  return `Search: “${search.trim()}”`;
}

/** A chip's remove button (`chips` `aria`): "Remove filter Search: “rahul”". */
export function removeFilterLabel(chip: string): string {
  return `Remove filter ${chip}`;
}

// ---- step indicator -----------------------------------------------------------------------------

/** The step indicator's name and the words after a done and the current step (`vm05`, `vm11`). */
export const IA_STEPS = {
  label: 'Steps',
  done: ', done',
  current: ', current step',
} as const;

// ---- shared states ------------------------------------------------------------------------------

/** The read-only notice while BITS has paused the institution (IA-03, IA-04, IA-06, IA-07, …). */
export const IA_PAUSED_READ_ONLY = 'Read-only while your institution’s access is paused';

/** A failed read's line and retry (IA-02, IA-04, IA-06, …). */
export const IA_FAILED = {
  line: 'Nothing has changed. Try again.',
  tryAgain: 'Try again',
} as const;
