import type { LedgerEntry } from '../link-targets';
import { pageRows } from '../link-targets-p3/rows';

const INTRO = '/student/assessments/{assessmentId}';
const ATTEMPT = `${INTRO}/attempt`;
const RESULT = `${INTRO}/result`;
const HUB = '/student/experiments/{experimentId}';

/** Phase 4B link targets: ST-12 Before you start and ST-13 the attempt (B4-11 f11 … f16, B4-12). */
export const P4B_ATTEMPT_LINK_TARGETS: readonly LedgerEntry[] = [
  // ST-12 Before you start (B4-11 f11 … f16): each state has one primary. Start assessment and Try
  // again send `startAttempt`, then open the attempt; whether a start is allowed is the service's.
  ...pageRows('ST-12', INTRO, [
    ['Top bar crumbs', 'Assessments', 'secondary', '/student/assessments', 'built', 'B4-11 f11'],
    [
      'Back link',
      '<experiment name>',
      'secondary',
      HUB,
      'built',
      'B4-11 f11 … f16 `a.xr-back` (the experiment hub)',
    ],
    [
      'Actions · to do',
      'Start assessment',
      'primary',
      ATTEMPT,
      'built',
      'B4-11 f11, f16 (`AssessmentService.startAttempt`, then ST-13)',
    ],
    ['Actions · to do', 'Back to experiment', 'secondary', HUB, 'built', 'B4-11 f11, f16'],
    ['Actions · attempt in progress', 'Continue attempt', 'primary', ATTEMPT, 'built', 'B4-11 f12'],
    ['Actions · attempt in progress', 'Back to experiment', 'secondary', HUB, 'built', 'B4-11 f12'],
    [
      'Actions · waiting for marking / not released yet',
      'See result page',
      'primary',
      RESULT,
      'built',
      'B4-11 f13 (and `ST-12.not-released`)',
    ],
    [
      'Actions · waiting for marking / not released yet',
      'Back to experiment',
      'secondary',
      HUB,
      'built',
      'B4-11 f13',
    ],
    [
      'Actions · not passed, an attempt left',
      'Try again',
      'primary',
      ATTEMPT,
      'built',
      'B4-11 f14 (`AssessmentService.startAttempt`, then ST-13)',
    ],
    [
      'Actions · not passed, an attempt left',
      'See result',
      'secondary',
      RESULT,
      'built',
      'B4-11 f14',
    ],
    [
      'Actions · passed / no attempt left',
      'See result',
      'primary',
      RESULT,
      'built',
      'State-copy `ST-12.passed-title`, `ST-12.no-attempts-left` (B4-11 f14 “See result”)',
    ],
    [
      'Actions · passed / no attempt left',
      'Back to experiment',
      'secondary',
      HUB,
      'built',
      'B4-11 f11 “Back to experiment”',
    ],
    ['Actions · can’t be started', 'Back to experiment', 'primary', HUB, 'built', 'B4-11 f15'],
    [
      'Actions · can’t be started',
      'See result',
      'secondary',
      RESULT,
      'built',
      'State-copy `ST-12.states` (only when an attempt was submitted)',
    ],
  ]),
  // ST-13 the attempt (B4-12 f0 … f6): a focused page with its own bar, no shell. The one primary
  // is Submit (DL-1); "Submit answers" confirms it. Nothing submits on its own.
  ...pageRows('ST-13', ATTEMPT, [
    [
      'Bar (way out)',
      '<experiment name>',
      'secondary',
      HUB,
      'built',
      'B4-12 f0 … f6 `header.xa-bar > a.xr-back` (saved answers are kept)',
    ],
    [
      'Bar · save failed',
      'Try again',
      'secondary',
      null,
      'in-page',
      'B4-12 f2 `span.xa-save.is-err > button.xr-btn--text` (`saveAnswer` again)',
    ],
    [
      'Answer strip',
      '(each question number)',
      'secondary',
      '#Ta-q1',
      'in-page',
      'B4-12 f0 `nav.xa-strip` (focus moves to the question)',
    ],
    ['Answer strip', 'Next unanswered', 'secondary', null, 'in-page', 'B4-12 f0, f1, f2, f5, f6'],
    [
      'Page foot',
      'Submit',
      'primary',
      null,
      'in-page',
      'B4-12 f0 `button.xr-btn--primary` (opens DL-1)',
    ],
    ['DL-1 “Submit your answers?”', 'Close', 'secondary', null, 'in-page', 'B4-12 f1'],
    ['DL-1 “Submit your answers?”', 'Keep answering', 'secondary', null, 'in-page', 'B4-12 f1'],
    [
      'DL-1 “Submit your answers?”',
      'Submit answers',
      'primary',
      null,
      'in-page',
      'B4-12 f1 (`AssessmentService.submitAttempt`)',
    ],
    ['Answers submitted', 'Back to experiment', 'primary', HUB, 'built', 'B4-12 f4'],
    ['Answers submitted', 'See your result page', 'secondary', RESULT, 'built', 'B4-12 f4'],
  ]),
];
