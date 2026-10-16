import type { LedgerEntry } from '../link-targets';
import { pageRows } from '../link-targets-p3/rows';

const RESULT = '/student/assessments/{assessmentId}/result';
const HUB = '/student/experiments/{experimentId}';

/**
 * Phase 4B link targets: ST-14 Result (B4-13). One primary per drawn state: "Back to experiment"
 * (the hub, B2-12) on the released result and on the waiting and not-released messages; "Back to
 * the assessment" (ST-12) on the "Not submitted yet" message. "Try again" is a command
 * (`startAttempt`), then the new attempt (ST-13).
 */
export const P4B_RESULT_LINK_TARGETS: readonly LedgerEntry[] = pageRows('ST-14', RESULT, [
  [
    'Top bar crumbs',
    'Assessments',
    'secondary',
    '/student/assessments',
    'built',
    'B4-13 f0 `ol.xr-crumbs` (→ B4-11 ST-11)',
  ],
  [
    'Top bar crumbs',
    '<assessment name>',
    'secondary',
    '/student/assessments/{assessmentId}',
    'built',
    'B4-13 f0 `ol.xr-crumbs` (→ B4-11 f11 ST-12)',
  ],
  [
    'Released result',
    'Back to experiment',
    'primary',
    HUB,
    'built',
    'B4-13 f0, f3, f5 `a.xr-btn--primary` (→ B2-12 ST-05)',
  ],
  [
    'Released result, not passed with an attempt left',
    'Try again',
    'secondary',
    null,
    'in-page',
    'B4-13 f3 `a.xr-btn--secondary` (`AssessmentService.startAttempt`, then ST-13 B4-12; state-copy `ST-14.try-again`)',
  ],
  [
    'Released result',
    'See your progress',
    'secondary',
    '/student/progress',
    'built',
    'B4-13 f0, f3, f5 `a.xr-btn--text` (→ B3-05 ST-15)',
  ],
  [
    'Submitted — waiting for marking',
    'Back to experiment',
    'primary',
    HUB,
    'built',
    'B4-13 f1, f4 `a.xr-btn--primary` (→ B2-12 ST-05)',
  ],
  [
    'Result not released yet',
    'Back to experiment',
    'primary',
    HUB,
    'built',
    'B4-13 f2 `a.xr-btn--primary` (→ B2-12 ST-05)',
  ],
  [
    'Not submitted yet',
    'Back to the assessment',
    'primary',
    '/student/assessments/{assessmentId}',
    'built',
    'B4-13 `r.notSub` `a.xr-btn--primary` (→ B4-11 f11 ST-12; state-copy `ST-14.attempt-shown`)',
  ],
  [
    'Failed state',
    'Try again',
    'primary',
    null,
    'in-page',
    'state-copy `ST-14.failed` (the Student failed pattern, B2-11 f10 `button.xr-btn--primary`)',
  ],
]);
