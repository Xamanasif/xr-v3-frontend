import type { LedgerEntry } from '../link-targets';
import { pageRows } from '../link-targets-p3/rows';

/**
 * Phase 4A link targets: FA-05 Experiment, the teaching view (B4-03). One primary per drawn state —
 * f0 / f4 "Open assessment" (Ready), f1 / f3 "Create assessment" (none yet; the experiment rides
 * along to FA-07), f2 "Continue setting up" (draft). "Mark 1 written answer" (FA-18) and "See
 * students on this experiment" (FA-20) are Phase 4B and not rendered until then (DEV-21).
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
      '/faculty/marking',
      'not-rendered',
      'B4-03 f0, f4 `a.xr-btn.xr-btn--secondary.xr-btn--sm`',
      'FA-18 Marking is not built (Phase 4B): the action appears with it (DEV-21).',
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
      'not-rendered',
      'B4-03 f0, f4 `a` under the per-format rows',
      'FA-20 Students is not built (Phase 4B): the link appears with it (DEV-21).',
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
