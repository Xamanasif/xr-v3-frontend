import type { TeachingExperiment } from '@xr/contracts/draft';
import type { Technology } from '@xr/domain';
import type { FaProgressRow, FaUnitState } from '@xr/ui/v3';

import { formatCode } from '@/copy/student';

/** The formats in the export's order (WEB · AR · VR · MR). */
const DISPLAY_ORDER: readonly Technology[] = ['web', 'ar', 'vr', 'mr'];

/** A format's counts, as `TeachingService.getTeachingExperiment` answers them (`perFormatCounts`). */
export interface FormatCounts {
  readonly completed: number;
  readonly inProgress: number;
  readonly notStarted: number;
}

/**
 * One unit per student (the export's `fmProg`: completed first, then in progress, then not
 * started), drawn by `FaUnits` / `FaProgress`.
 */
export function progressUnits(counts: FormatCounts): FaUnitState[] {
  return [
    ...Array.from({ length: counts.completed }, () => 'done' as const),
    ...Array.from({ length: counts.inProgress }, () => 'progress' as const),
    ...Array.from({ length: counts.notStarted }, () => 'none' as const),
  ];
}

/**
 * The per-format rows of `FaProgress` from the teaching read's `perFormatCounts` (FA-01 "Your
 * teaching", FA-03, FA-04, FA-05; FA-20's summary from the same counts): each format the
 * institution has, in the export's order, with its counts and units. Nothing is computed beyond
 * what the read counts.
 */
export function formatProgressRows(
  perFormatCounts: TeachingExperiment['perFormatCounts'],
): FaProgressRow[] {
  return [...perFormatCounts]
    .sort((left, right) => DISPLAY_ORDER.indexOf(left.format) - DISPLAY_ORDER.indexOf(right.format))
    .map((row) => ({
      format: formatCode(row.format),
      completed: row.completed,
      inProgress: row.inProgress,
      notStarted: row.notStarted,
      units: progressUnits(row),
    }));
}

/**
 * The submissions meter (the export's `su`: one unit per student with access, those who submitted
 * first): "2 of 5 students submitted" beside it (FA-01 Coming up, FA-03, FA-05, FA-06, the record
 * band). A count above the reach is drawn as the reach.
 */
export function submittedUnits(submitted: number, reach: number): FaUnitState[] {
  const shown = Math.min(Math.max(submitted, 0), Math.max(reach, 0));
  return [
    ...Array.from({ length: shown }, () => 'submitted' as const),
    ...Array.from({ length: Math.max(reach, 0) - shown }, () => 'none' as const),
  ];
}
