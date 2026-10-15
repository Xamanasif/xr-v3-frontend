/**
 * Pure view helpers of the Student's access screens (ST-01 … ST-05, ST-19): which state a page is
 * in and which facts it names, from the service's answers and the session's banner facts. They
 * decide no access: entitlement, the institution's access, runtime activity and completion stay
 * the service's separate answers (BC3); nothing here turns one into another.
 */
import type { MyCourseRow, MyExperimentRow, ServiceError, StudentHome } from '@xr/contracts/draft';
import { FORMAT_DISPLAY_ORDER, type ShellBanner, type Technology } from '@xr/domain';

import type { HomeRead } from '@/queries/student';

type FormatRow = MyExperimentRow['formats'][number];
type Availability = FormatRow['availability'];

/**
 * The closure the session's banner facts carry for a Student (XS-08): an inactive account first,
 * then the institution's pause — as the shell's banner chooses (`bannerKindOf`). The Student's
 * rows have no word for either (sample adapter README), so the pages read them from here.
 */
export type Closure = 'inactive' | 'paused' | null;

export function closureOf(banners: readonly ShellBanner[]): Closure {
  if (banners.includes('account-inactive')) return 'inactive';
  if (banners.includes('institution-paused')) return 'paused';
  return null;
}

/** "Rahul" from "Rahul Verma" (state-copy `ST-01.greeting`). */
export function firstName(displayName: string): string {
  return displayName.trim().split(/\s+/)[0] ?? displayName;
}

/** A format of the plan, published for the experiment: given to the Student (now or not right now). */
export function isGiven(availability: Availability): boolean {
  return availability === 'available-to-you' || availability === 'not-available-right-now';
}

export function policyOpenOf(availability: Availability): string | null {
  return typeof availability === 'object' ? availability.policyOpen : null;
}

/** The formats the Student can open now, in display order (B2-10 "Available to you: WEB VR"). */
export function availableFormats(row: MyExperimentRow): Technology[] {
  return inDisplayOrder(
    row.formats.filter((entry) => entry.availability === 'available-to-you'),
  ).map((entry) => entry.format);
}

/** The formats given to the Student, with their progress (B2-10 f4, B2-11 f1, B2-12 f0). */
export function givenFormats(row: MyExperimentRow): FormatRow[] {
  return inDisplayOrder(row.formats.filter((entry) => isGiven(entry.availability)));
}

/** An experiment whose gate reached an undecided rule carries it on every format (PC-26). */
export function undecidedOf(row: MyExperimentRow): string | null {
  const decisions = row.formats.map((entry) => policyOpenOf(entry.availability));
  return decisions.length > 0 && decisions.every((decision) => decision !== null)
    ? decisions[0]!
    : null;
}

function inDisplayOrder<T extends { readonly format: Technology }>(rows: readonly T[]): T[] {
  return [...rows].sort(
    (a, b) => FORMAT_DISPLAY_ORDER.indexOf(a.format) - FORMAT_DISPLAY_ORDER.indexOf(b.format),
  );
}

/**
 * The hub header's order (state-copy `ST-05.format-order`): the given formats, then those not
 * included for the institution, then those not available for the experiment, then any other —
 * each group in display order (B2-12 f0: WEB, VR, AR, MR).
 */
export function hubFormatOrder(row: MyExperimentRow): FormatRow[] {
  const rank = (availability: Availability) => {
    if (isGiven(availability)) return 0;
    if (availability === 'not-included-for-your-institution') return 1;
    if (availability === 'not-available-for-this-experiment') return 2;
    return 3;
  };
  return inDisplayOrder(row.formats).sort((a, b) => rank(a.availability) - rank(b.availability));
}

// ---- course rows (ST-01, ST-02) ----

/**
 * How a course row reads: `given` (experiments the Student can open now), `earlier` (no
 * experiment given now, earlier work kept — SACC-14), or `listed` (listed, none open now: paused,
 * inactive, a licence wait or an undecided rule).
 */
export type CourseRowKind = 'given' | 'earlier' | 'listed';

export function courseRowKind(course: MyCourseRow): CourseRowKind {
  if (course.experimentsGiven > 0) return 'given';
  return course.earlierWork ? 'earlier' : 'listed';
}

// ---- ST-01 Home ----

export type HomeState = 'inactive' | 'paused' | 'none' | 'earlier-only' | 'given';

/** B2-10's states: inactive (f7), paused (f6), before access (f0), earlier work only (f8), given (f1). */
export function homeState(home: StudentHome, closure: Closure): HomeState {
  if (closure === 'inactive') return 'inactive';
  if (closure === 'paused') return 'paused';
  if (home.noAccessYet || home.myCourses.length === 0) return 'none';
  if (home.myCourses.every((course) => courseRowKind(course) === 'earlier')) return 'earlier-only';
  return 'given';
}

export interface HomeCard {
  readonly kind: 'start' | 'continue';
  readonly experiment: MyExperimentRow;
  readonly course: MyCourseRow | null;
}

function placeOf(read: HomeRead, experimentId: string) {
  for (const entry of read.courses) {
    const experiment = entry.experiments.find((row) => row.experimentId === experimentId);
    if (experiment) return { experiment, course: entry.course };
  }
  return null;
}

/** The Home's first card (state-copy `ST-01.card`): the service's `continue`, else "Start here". */
export function homeCard(read: HomeRead): HomeCard | null {
  const resume = read.home.continue;
  if (resume) {
    return {
      kind: 'continue',
      experiment: resume,
      course: placeOf(read, resume.experimentId)?.course ?? null,
    };
  }
  const first = read.home.upNext.find((item) => item.kind === 'format');
  if (!first || first.kind !== 'format') return null;
  const place = placeOf(read, first.experimentId);
  return place ? { kind: 'start', ...place } : null;
}

export type UpNextView =
  | {
      readonly kind: 'format';
      readonly experimentId: string;
      readonly experimentName: string;
      readonly format: Technology;
      readonly progress: FormatRow['progress'];
    }
  | { readonly kind: 'assessment'; readonly experimentName: string }
  | {
      readonly kind: 'feedback';
      readonly experimentId: string;
      readonly experimentName: string;
      readonly format: Technology;
    };

/** At most three Up next items, in the service's order (state-copy `ST-01.up-next`). */
export const UP_NEXT_MOST = 3;

/** Up next without the card's own experiment's formats, each named (state-copy `ST-01.up-next`). */
export function upNextItems(read: HomeRead, card: HomeCard | null): UpNextView[] {
  const views: UpNextView[] = [];
  for (const item of read.home.upNext) {
    if (item.kind === 'assessment') {
      const experimentName = read.assessmentExperiments[item.assessmentId];
      if (experimentName) views.push({ kind: 'assessment', experimentName });
      continue;
    }
    const place = placeOf(read, item.experimentId);
    if (!place) continue;
    if (item.kind === 'feedback') {
      views.push({
        kind: 'feedback',
        experimentId: item.experimentId,
        experimentName: place.experiment.name,
        format: item.format,
      });
      continue;
    }
    if (card && card.experiment.experimentId === item.experimentId) continue;
    const progress =
      place.experiment.formats.find((entry) => entry.format === item.format)?.progress ??
      'not-started';
    views.push({
      kind: 'format',
      experimentId: item.experimentId,
      experimentName: place.experiment.name,
      format: item.format,
      progress,
    });
  }
  return views.slice(0, UP_NEXT_MOST);
}

// ---- ST-19 ----

/** Which ST-19 message a hub refusal reads as (state-copy `ST-19.*`). */
export type NotAvailableKind =
  'not-given' | 'no-longer-given' | 'access-ended' | 'paused' | 'inactive' | 'undecided';

export function notAvailableKind(error: ServiceError): NotAvailableKind | null {
  if (error.kind === 'policy-open') {
    // SACC-14: the only grant withdrawn or the access ended — the drawn "no longer given".
    return error.decision === 'SACC-14' ? 'no-longer-given' : 'undecided';
  }
  if (error.kind !== 'refused') return null;
  switch (error.code) {
    case 'no-longer-given':
      return 'no-longer-given';
    case 'access-ended':
      return 'access-ended';
    case 'institution-paused':
      return 'paused';
    case 'student-inactive':
      return 'inactive';
    default:
      return 'not-given';
  }
}
