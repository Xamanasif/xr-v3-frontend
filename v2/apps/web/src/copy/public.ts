/**
 * The words of the public surface — PU-01 Landing with PU-14 "How institutional access works"
 * (B1-01, B1-02), PU-02 / PU-03 / PU-05 (B1-03), PU-04 Catalogue (B1-04) and PU-06 Experiment
 * (B1-05) — written from the canonical facts `CatalogueService` answers (Phase-1 Package 1B).
 * Every string is a board's own; what no board words is a provisional entry of the state-copy
 * register (`state-copy.ts`, VD-12) and is read from there. Counts are the sample world's, never
 * typed here (B1-01 "Every number on the page is derived").
 */
import { messageFor } from '@xr/contracts/draft';
import { FORMAT_META, type Technology } from '@xr/domain';

import { PRODUCT_NAME } from './product';
import { stateWords } from './state-copy';

// ---- counts (B1-01, B1-02, B1-03, B1-04) ----

/** "5 experiments", "1 experiment" (B1-04 group heading `rows.length === 1 ? '1 experiment'`). */
export function experimentsWords(count: number): string {
  return count === 1 ? '1 experiment' : `${count} experiments`;
}

/** "2 courses", "1 course" (B1-01 plain list "3 experiments · 1 course"). */
export function coursesWords(count: number): string {
  return count === 1 ? '1 course' : `${count} courses`;
}

// ---- the public shell (B1-01 header, menu sheet, footer) ----

export const PUBLIC_SHELL = {
  brandName: PRODUCT_NAME,
  /** `a.xp-brand aria-label`. */
  home: 'XR Learning Platform — home',
  mainNav: 'Main',
  footerNav: 'Footer',
  signIn: 'Sign in',
  menu: 'Menu',
  close: 'Close',
} as const;

// ---- PU-01 Landing (B1-01) and the explorer (B1-02) ----

export const LANDING = {
  hero: {
    eyebrow: 'BITS Pilani · Work Integrated Learning Programmes',
    lines: ['Set the conditions.', 'See what follows.'],
    emphasis: 'Understand why.',
    lead: 'Simulations of the lab experiments in engineering courses — in the browser, and in AR, VR and MR where an experiment offers them.',
    browse: 'Browse experiments',
    studentsWho: 'Students and faculty',
    studentsLink: 'Already have access? Sign in',
    illustration: 'Illustration · concept artwork, not a simulation capture',
  },
  explorer: {
    eyebrow: 'Explore by area',
    title: 'Every experiment, by engineering area.',
    lead: 'Pick an area to see its courses, then browse its experiments.',
    region: 'Engineering areas',
    carousel: 'carousel',
    slide: 'slide',
    viewArea: 'View area',
    previous: 'Previous area',
    next: 'Next area',
    swipe: 'Swipe for more areas',
    viewAll: 'View all areas',
  },
  featured: {
    eyebrow: 'Featured experiments',
    title: 'Start with these experiments.',
    lead: 'A selection across the engineering areas, including one experiment available in all four formats.',
    cta: 'View experiment',
  },
  formats: {
    eyebrow: 'Formats',
    title: 'One experiment. Four ways to run it.',
    lead: 'WEB, AR, VR and MR are equal options. Each experiment shows the formats it is available in.',
  },
  institutions: {
    eyebrow: 'For institutions',
    title: 'Anyone can browse. Institutions request access.',
    lead: 'Running an experiment needs access arranged through your institution.',
  },
  band: {
    label: 'Browse experiments',
    title: 'Find the experiments for your course.',
    action: 'Browse experiments',
  },
} as const;

/** "2 of 3" (B1-02 `pos`). */
export function positionWords(index: number, count: number): string {
  return `${index + 1} of ${count}`;
}

/** The slide's name, "2 of 9: Area name" (B1-02 "each card is a group named …"). */
export function slideLabel(index: number, count: number, name: string): string {
  return `${positionWords(index, count)}: ${name}`;
}

/** The polite announcement of the newly selected area (B1-02 `live`). */
export function areaAnnouncement(index: number, count: number, name: string): string {
  return `${name}, area ${index + 1} of ${count}`;
}

/** "5 experiments · 2 courses" (B1-02 `meta`). */
export function areaCountsWords(experiments: number, courses: number): string {
  return `${experimentsWords(experiments)} · ${coursesWords(courses)}`;
}

/** "Browse 5 experiments" (B1-02 `browse`; B1-03 PU-03 button). */
export function browseCountWords(experiments: number): string {
  return experiments === 1 ? 'Browse 1 experiment' : `Browse ${experiments} experiments`;
}

/** "Show Mechanical & Manufacturing" (B1-02 `pickLabel`). */
export function pickAreaLabel(name: string): string {
  return `Show ${name}`;
}

/** "Browse all 12 experiments" (B1-01 featured head). */
export function browseAllWords(total: number): string {
  return `Browse all ${experimentsWords(total)}`;
}

/** "ME ZG523 · Thermodynamics & Heat Transfer", or the name alone without a code (T-17). */
export function courseLine(platformCode: string | null, courseName: string): string {
  return platformCode ? `${platformCode} · ${courseName}` : courseName;
}

/** The B1-01 format cards: code, name, "How it runs" as B1-01 words it. */
export const FORMAT_CARDS: readonly {
  readonly format: Technology;
  readonly name: string;
  readonly text: string;
}[] = [
  {
    format: 'web',
    name: 'Browser',
    text: 'The experiment in a web browser, on a laptop or desktop.',
  },
  {
    format: 'ar',
    name: 'Augmented reality',
    text: 'The experiment overlaid on your surroundings, on a supported phone or tablet.',
  },
  {
    format: 'vr',
    name: 'Virtual reality',
    text: 'The experiment in a virtual lab, on a supported headset.',
  },
  {
    format: 'mr',
    name: 'Mixed reality',
    text: 'The experiment combined with your real surroundings, on a supported device.',
  },
];

/** "Available in 5 of 12 experiments" (B1-01 `xp-fcard-n`). */
export function availableInWords(count: number, total: number): string {
  return `Available in ${count} of ${experimentsWords(total)}`;
}

/** "Browse VR experiments" (B1-01 `xp-fcard-link`). */
export function browseFormatWords(format: Technology): string {
  return `Browse ${FORMAT_META[format].code} experiments`;
}

/** PU-14 "How institutional access works" — the four steps (B1-01 landing; B1-05 mini version). */
export const ACCESS_STEPS: readonly { readonly title: string; readonly detail: string }[] = [
  {
    title: 'Browse and select',
    detail: 'Choose the experiments your courses need, and the formats for each.',
  },
  {
    title: 'Request institutional access',
    detail:
      'Send one request with your institution’s details, the licences you need and for how long.',
  },
  {
    title: 'BITS reviews — payment may be required',
    detail: 'BITS reviews the request. Some institutions complete a payment before access starts.',
  },
  {
    title: 'Your administrator gives students access',
    detail:
      'Once access is active, your institution administrator gives students the experiments they need.',
  },
];

/** "Step 1" (B1-01 `xp-step4-n`). */
export function stepWords(index: number): string {
  return `Step ${index + 1}`;
}

/** The link to PU-14 from the area, course and experiment pages (B1-03; B1-05 "More about access"). */
export const HOW_ACCESS_WORKS = 'How institutional access works';

// ---- PU-02 / PU-03 / PU-05 (B1-03) ----

export const AREAS = {
  crumbHome: 'Home',
  crumbAreas: 'Areas',
  eyebrow: 'Engineering areas',
  title: 'Engineering areas',
  lead: 'Each area groups the courses that have published experiments.',
  factAreas: 'Areas',
  factCourses: 'Courses',
  factExperiments: 'Experiments',
  loading: 'Loading engineering areas',
  failedTitle: 'We couldn’t load the engineering areas',
  failedLine: 'Check your connection and try again. You can still browse every experiment.',
  retry: 'Try again',
  browse: 'Browse experiments',
} as const;

export const AREA = {
  eyebrow: 'Engineering area',
  factAvailableIn: 'Available in',
  coursesTitle: 'Courses in this area',
  notFoundTitle: 'We can’t find that area',
  notFoundLine: 'The link may be out of date. Every published experiment is in the catalogue.',
  notFoundBrowse: 'Browse experiments',
  notFoundAllAreas: 'All areas',
} as const;

export const COURSE = {
  factFormats: 'Formats in this course',
  experimentsTitle: 'Experiments in this course',
  emptyTitle: 'No experiments are published for this course yet',
  emptyLine: 'Experiments appear here once they are published.',
  emptyBrowse: 'Browse all experiments',
} as const;

/** "Course · Mechanical & Manufacturing" (B1-03 PU-05 eyebrow). */
export function courseEyebrow(areaName: string): string {
  return `Course · ${areaName}`;
}

/** "Back to Mechanical & Manufacturing" (B1-03 PU-05). */
export function backToWords(name: string): string {
  return `Back to ${name}`;
}

// ---- PU-04 Catalogue (B1-04) ----

export const CATALOGUE = {
  crumb: 'Experiments',
  eyebrow: 'Browse experiments',
  title: 'Experiments',
  lead: 'Every published experiment, with the formats it is available in.',
  adjustedTitle: 'We adjusted this link',
  adjustedLine:
    'One of its filters is no longer available, so it was removed. The other filters still apply.',
  dismiss: 'Dismiss',
  view: 'View',
  viewAll: 'All experiments',
  viewByArea: 'By area',
  hideFilters: 'Hide filters',
  showFilters: 'Show filters',
  filters: 'Filters',
  clearAll: 'Clear all',
  facetArea: 'Engineering area',
  facetCourse: 'Course',
  facetFormat: 'Format',
  applyNote: 'Filters apply as you choose them.',
  searchLabel: 'Search experiments',
  searchPlaceholder: 'Experiment, course or code',
  sortLabel: 'Sort by',
  sortDefault: 'Default order',
  sortTitle: 'Title A–Z',
  sortCode: 'Course code',
  clearAllFilters: 'Clear all filters',
  availableIn: 'Available in',
  emptyTitle: 'No experiments match these filters',
  emptyLine:
    'Remove a filter or try a shorter search. Every published experiment is listed when no filters are set.',
  loading: 'Loading experiments',
  failedTitle: 'We couldn’t load the experiments',
  failedLine: 'Check your connection and try again.',
  retry: 'Try again',
  closeFilters: 'Close filters',
} as const;

/** "Filters" / "Filters (2)" (B1-04 `sheetBtn`). */
export function filtersButtonWords(chosen: number): string {
  return chosen > 0 ? `Filters (${chosen})` : 'Filters';
}

/** "Show 5 experiments" (B1-04 `showN`). */
export function showCountWords(count: number): string {
  return `Show ${experimentsWords(count)}`;
}

/** "12 experiments" / "5 of 12 experiments" (B1-04 `count`). */
export function resultCountWords(shown: number, total: number, filtered: boolean): string {
  return filtered ? `${shown} of ${experimentsWords(total)}` : experimentsWords(total);
}

/** The removable chips (B1-04 `chips`): "Area: …", "Course: ME ZG523", "Format: VR", "Search: “…”". */
export function areaChip(name: string): string {
  return `Area: ${name}`;
}
export function courseChip(platformCode: string | null, name: string): string {
  return platformCode
    ? `Course: ${platformCode}`
    : stateWords('PU-04.course-chip-without-code').replace('{name}', name);
}
export function formatChip(format: Technology): string {
  return `Format: ${FORMAT_META[format].code}`;
}
export function searchChip(text: string): string {
  return `Search: “${text.trim()}”`;
}
export function removeChipLabel(chip: string): string {
  return `Remove ${chip}`;
}

/** "WEB · Browser" (B1-04 format facet `fmts[].name`). */
export function formatFacetWords(format: Technology): string {
  return `${FORMAT_META[format].code} · ${FORMAT_META[format].name}`;
}

/** "5 experiments · View area" heading meta (B1-04 By area view; the link is separate). */
export const VIEW_AREA = 'View area';

// ---- PU-06 Experiment (B1-05) ----

export const EXPERIMENT = {
  crumb: 'Experiments',
  availableIn: 'Available in',
  illustration: 'Illustration · concept artwork, not a simulation capture',
  panelTitle: 'Get this for your institution',
  pickText: 'Choose the formats your institution needs, then add the experiment to your selection.',
  editText: 'Change the formats your institution needs for this experiment.',
  legend: 'Formats your institution needs',
  add: 'Add to selection',
  update: 'Update selection',
  cancel: 'Cancel',
  inSelection: 'In your selection',
  change: 'Change formats',
  remove: 'Remove from selection',
  panelNote:
    'Your institution sends one request for everything it selects. Students get experiments from their institution once its access is active.',
  signInBefore: 'Already have access? ',
  signIn: 'Sign in',
  outcomesTitle: 'Learning outcomes',
  outcomesLine:
    'What learners can do after this experiment. One set for the experiment, whichever format they use.',
  formatsTitle: 'Formats and device needs',
  columnFormat: 'Format',
  columnHow: 'How it runs',
  columnDevice: 'Device needs',
  matchesFilter: 'Matches your filter',
  previewTitle: 'Preview',
  previewLabel: 'Preview · Browser format',
  previewOpen: 'Open preview',
  previewNewTab: ' (opens in a new tab)',
  previewAlt:
    'Illustration of the browser format: an experiment workspace with controls, an apparatus view and a plot.',
  noPreview: 'Illustration · no preview for this experiment yet',
  aside: 'About this experiment',
  partOfCourse: 'Part of the course',
  viewCourse: 'View the course',
  moreAboutAccess: 'More about access',
  notFoundTitle: 'We can’t find that experiment',
  notFoundLine:
    'It may have been renamed or is no longer published. Every published experiment is in the catalogue.',
  notFoundBrowse: 'Browse experiments',
  notFoundHome: 'Home',
} as const;

/** "Back to VR experiments" (B1-05 `filterBack`). */
export function backToFormatWords(format: Technology): string {
  return `Back to ${FORMAT_META[format].code} experiments`;
}

/** "Formats: WEB · VR" (B1-05 `inFmts`). */
export function inSelectionFormats(formats: readonly Technology[]): string {
  return `Formats: ${formats.map((format) => FORMAT_META[format].code).join(' · ')}`;
}

/** "Mechanical & Manufacturing · 3 experiments" (B1-05 "Part of the course"). */
export function courseMetaWords(areaName: string, experiments: number): string {
  return `${areaName} · ${experimentsWords(experiments)}`;
}

/**
 * "Not available in MR." (B1-05 "stated once, plainly"); more than one missing format follows the
 * same sentence (state-copy `PU-06.not-available`).
 */
export function notAvailableWords(missing: readonly Technology[]): string | null {
  if (missing.length === 0) return null;
  const codes = missing.map((format) => FORMAT_META[format].code);
  const list =
    codes.length === 1 ? codes[0]! : `${codes.slice(0, -1).join(', ')} or ${codes.at(-1)!}`;
  return `Not available in ${list}.`;
}

/** B1-05: the panel's validation words, from the drawn copy catalogue (`PU-06.formats.choose-one`). */
export function chooseOneFormatWords(): string {
  return messageFor('PU-06.formats.choose-one')!;
}
