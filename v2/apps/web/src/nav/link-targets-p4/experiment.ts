import type { LedgerEntry } from '../link-targets';
import { pageRows } from '../link-targets-p3/rows';

/**
 * Phase 4A link targets: FA-05 Experiment, the teaching view (B4-03). One primary per drawn state —
 * f0 / f4 "Open assessment" (Ready), f1 / f3 "Create assessment" (none yet; the experiment rides
 * along to FA-07), f2 "Continue setting up" (draft). Since Phase 4B "Mark 1 written answer" opens
 * FA-18 for the assessment while answers wait, and "See students on this experiment" opens FA-20.
 */
export const P4_FACULTY_EXPERIMENT_LINK_TARGETS: readonly LedgerEntry[] = pageRows(
  'FA-05',
  '/faculty/experiments/{experimentId}',
  [
    [
      'Back link',
      'My courses',
      'secondary',
      '/faculty/courses',
      'built',
      'B4-03 f0 … f4 `a.xr-back`',
    ],
    [
      'Assessment · Ready (f0, f4)',
      'Open assessment',
      'primary',
      '/faculty/assessments/{assessmentId}',
      'built',
      'B4-03 f0, f4 `a.xr-btn.xr-btn--primary.xr-btn--sm`',
      'FA-08 Summary (Phase 4A).',
    ],
    [
      'Assessment · Ready (f0, f4)',
      'Mark 1 written answer',
      'secondary',
      '/faculty/marking?assessmentId={assessmentId}',
      'built',
      'B4-03 f0, f4 `a.xr-btn.xr-btn--secondary.xr-btn--sm`',
      'FA-18 for this assessment, while answers wait (Phase 4B).',
    ],
    [
      'Assessment · none yet (f1, f3)',
      'Create assessment',
      'primary',
      '/faculty/assessments/new?experimentId={experimentId}',
      'built',
      'B4-03 f1, f3 `div.xr-empty a.xr-btn.xr-btn--primary`',
      'FA-07 with the experiment chosen (register: optional `?experimentId=` from FA-05).',
    ],
    [
      'Assessment · draft (f2)',
      'Continue setting up',
      'primary',
      '/faculty/assessments/{assessmentId}',
      'built',
      'B4-03 f2 `a.xr-btn.xr-btn--primary.xr-btn--sm`',
      'FA-08 Summary, where the draft’s checklist says what is missing (Phase 4A).',
    ],
    [
      'Student activity (f0, f4)',
      'See students on this experiment',
      'secondary',
      '/faculty/students?experimentId={experimentId}',
      'built',
      'B4-03 f0, f1, f2, f4 `a` under the per-format rows (f3 draws none)',
      'FA-20 for this experiment (Phase 4B).',
    ],
    [
      'Failed state',
      'Try again',
      'secondary',
      null,
      'in-page',
      'state-copy `FA-05.failed`, `FA-05.assessment-states`',
    ],
  ],
);
