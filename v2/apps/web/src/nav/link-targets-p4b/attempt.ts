import type { LedgerEntry } from '../link-targets';
import { pageRows } from '../link-targets-p3/rows';

const INTRO = '/student/assessments/{assessmentId}';
const ATTEMPT = `${INTRO}/attempt`;
const RESULT = `${INTRO}/result`;
const TAB = '/student/experiments/{experimentId}/assessment';

/** Phase 4B link targets, V3 (ST-v1): ST-12 Before you start and ST-13 the attempt. */
export const P4B_ATTEMPT_LINK_TARGETS: readonly LedgerEntry[] = [
  // ST-12 Before you start (V3: ST-v1 `is.aintro`, LINK-MAP 12-*): each state's actions in the card;
  // a gold primary only where the export draws one. Start assessment and Try again send
  // `startAttempt`, then open the attempt; whether a start is allowed is the service's.
  ...pageRows('ST-12', INTRO, [
    [
      'Breadcrumb',
      'Assessments',
      'secondary',
      '/student/assessments',
      'built',
      'ST-v1 LINK-MAP 12-assess `nav.rk-crumbs`',
    ],
    [
      'Head eyebrow',
      '<experiment name>',
      'secondary',
      TAB,
      'built',
      'ST-v1 LINK-MAP 12-assess `p.rk-eyebrow a.st-eyelink` (the hub’s Assessment tab)',
    ],
    [
      'Actions · to do',
      'Start assessment',
      'primary',
      ATTEMPT,
      'built',
      'ST-v1 LINK-MAP 12-assess (`AssessmentService.startAttempt`, then ST-13)',
    ],
    [
      'Actions · to do',
      'Back to experiment',
      'secondary',
      TAB,
      'built',
      'ST-v1 LINK-MAP 12-assess',
    ],
    [
      'Actions · attempt in progress',
      'Continue attempt',
      'primary',
      ATTEMPT,
      'built',
      'ST-v1 LINK-MAP 12-inprog',
    ],
    [
      'Actions · attempt in progress',
      'Back to experiment',
      'secondary',
      TAB,
      'built',
      'ST-v1 LINK-MAP 12-inprog',
    ],
    [
      'Actions · waiting for marking / not released yet',
      'See result page',
      'secondary',
      RESULT,
      'built',
      'ST-v1 LINK-MAP 12-waitmark, 12-notrel (`introVM`: no primary)',
    ],
    [
      'Actions · waiting for marking / not released yet',
      'Back to experiment',
      'secondary',
      TAB,
      'built',
      'ST-v1 LINK-MAP 12-waitmark, 12-notrel',
    ],
    [
      'Actions · not passed, an attempt left',
      'Try again',
      'primary',
      ATTEMPT,
      'built',
      'ST-v1 LINK-MAP 12-notpassed (`AssessmentService.startAttempt`, then ST-13)',
    ],
    [
      'Actions · not passed, an attempt left',
      'See result',
      'secondary',
      RESULT,
      'built',
      'ST-v1 LINK-MAP 12-notpassed',
    ],
    [
      'Actions · passed / no attempt left',
      'See result',
      'primary',
      RESULT,
      'built',
      'ST-v1 LINK-MAP 12-released (`introVM` “Result released”)',
    ],
    [
      'Actions · passed / no attempt left',
      'Back to experiment',
      'secondary',
      TAB,
      'built',
      'ST-v1 LINK-MAP 12-released',
    ],
    [
      'Actions · can’t be started',
      'Back to experiment',
      'primary',
      TAB,
      'built',
      'ST-v1 `introVM` `noq` (state-copy `ST-12.states`)',
    ],
    [
      'Actions · can’t be started',
      'See result',
      'secondary',
      RESULT,
      'built',
      'State-copy `ST-12.states` (only when an attempt was submitted)',
    ],
  ]),
  // ST-13 the attempt (V3: ST-v1 `is.att`, LINK-MAP 13-*): a focused page with its own bar, no rail.
  // The one primary is Submit (DL-1); "Submit answers" confirms it. Nothing submits on its own.
  ...pageRows('ST-13', ATTEMPT, [
    [
      'Bar (way out)',
      '<assessment name>',
      'secondary',
      INTRO,
      'built',
      'ST-v1 LINK-MAP 13-assess `header.st-focusbar a.st-exit` (Before you start; saved answers are kept)',
    ],
    [
      'Bar · save failed',
      'Try again',
      'secondary',
      null,
      'in-page',
      'ST-v1 13-inprog-att-savefail `p.st-save--err button` (`saveAnswer` again)',
    ],
    [
      'Your answers',
      '(each question number)',
      'secondary',
      '#Ta-q1',
      'in-page',
      'ST-v1 LINK-MAP 13-assess `ol.st-strip a` (focus moves to the question)',
    ],
    [
      'Your answers',
      'Next unanswered',
      'secondary',
      null,
      'in-page',
      'ST-v1 `button.rb-btn.sv-attnext`',
    ],
    [
      'Submit panel',
      'Submit',
      'primary',
      null,
      'in-page',
      'ST-v1 `button.rb-btn.rb-btn--primary.rb-btn--lg` (opens DL-1)',
    ],
    [
      'DL-1 “Submit your answers?”',
      'Keep answering',
      'secondary',
      null,
      'in-page',
      'ST-v1 13-inprog-att-dialog',
    ],
    [
      'DL-1 “Submit your answers?”',
      'Submit answers',
      'primary',
      null,
      'in-page',
      'ST-v1 13-inprog-att-dialog (`AssessmentService.submitAttempt`)',
    ],
    [
      'Answers submitted',
      'See your result page',
      'primary',
      RESULT,
      'built',
      'ST-v1 LINK-MAP 13-waitmark `div.sv-act-go a.rb-btn--primary`',
    ],
    [
      'Answers submitted',
      'Back to experiment',
      'secondary',
      TAB,
      'built',
      'ST-v1 LINK-MAP 13-waitmark (the hub’s Assessment tab)',
    ],
  ]),
];
