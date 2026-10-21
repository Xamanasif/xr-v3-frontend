import type { LedgerEntry } from '../link-targets';
import { pageRows } from '../link-targets-p3/rows';

const RESULT = '/student/assessments/{assessmentId}/result';
const TAB = '/student/experiments/{experimentId}/assessment';

/**
 * Phase 4B link targets, V3 (ST-v1 `is.ares`, LINK-MAP 14-*): ST-14 Result. The released result's
 * one primary is "Try again" when it is offered (a command, `startAttempt`, then ST-13); "Back to
 * experiment" (the hub's Assessment tab) is a plain button on every state; "Back to the assessment"
 * (ST-12) on "Not submitted yet". The marks by question jump to each answer.
 */
export const P4B_RESULT_LINK_TARGETS: readonly LedgerEntry[] = pageRows('ST-14', RESULT, [
  [
    'Breadcrumb',
    'Assessments',
    'secondary',
    '/student/assessments',
    'built',
    'ST-v1 LINK-MAP 14-released `nav.rk-crumbs` (→ ST-11)',
  ],
  [
    'Breadcrumb',
    '<assessment name>',
    'secondary',
    '/student/assessments/{assessmentId}',
    'built',
    'ST-v1 LINK-MAP 14-released `nav.rk-crumbs` (→ ST-12)',
  ],
  [
    'Marks by question',
    '(each question’s mark)',
    'secondary',
    '#Rs-ans-1',
    'in-page',
    'ST-v1 LINK-MAP 14-released `ol.sv-byq a.sv-byq-i` (focus moves to the answer)',
  ],
  [
    'Released result, not passed with an attempt left',
    'Try again',
    'primary',
    null,
    'in-page',
    'ST-v1 LINK-MAP 14-notpassed `div.sv-score-retry a.rb-btn--primary` (`AssessmentService.startAttempt`, then ST-13; state-copy `ST-14.try-again`)',
  ],
  [
    'Released result',
    'Back to experiment',
    'secondary',
    TAB,
    'built',
    'ST-v1 LINK-MAP 14-released `div.sv-review-foot a.rb-btn` (→ the hub’s Assessment tab)',
  ],
  [
    'Released result',
    'See your progress',
    'secondary',
    '/student/progress',
    'built',
    'ST-v1 LINK-MAP 14-released `a.sv-link` (→ ST-15)',
  ],
  [
    'Submitted — waiting for marking',
    'Back to experiment',
    'secondary',
    TAB,
    'built',
    'ST-v1 LINK-MAP 14-waitmark `div.sv-refuse-act a.rb-btn` (→ the hub’s Assessment tab)',
  ],
  [
    'Result not released yet',
    'Back to experiment',
    'secondary',
    TAB,
    'built',
    'ST-v1 LINK-MAP 14-notrel `div.sv-refuse-act a.rb-btn`',
  ],
  [
    'Not submitted yet',
    'Back to the assessment',
    'secondary',
    '/student/assessments/{assessmentId}',
    'built',
    'ST-v1 LINK-MAP 14-assess `div.sv-refuse-act a.rb-btn` (→ ST-12; state-copy `ST-14.attempt-shown`)',
  ],
  [
    'Failed state',
    'Try again',
    'secondary',
    null,
    'in-page',
    'state-copy `ST-14.failed` (`section.sv-msg button.rb-btn.sv-msg-btn`)',
  ],
]);
