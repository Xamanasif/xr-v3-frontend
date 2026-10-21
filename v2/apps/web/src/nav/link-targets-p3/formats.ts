import type { LedgerEntry } from '../link-targets';
import { pageRows } from './rows';

const WEB = '/student/experiments/{experimentId}/simulation/web';
const FORMAT = '/student/experiments/{experimentId}/simulation/{format}';
const SIMULATION = '/student/experiments/{experimentId}/simulation';

const HUB = '/student/experiments/{experimentId}';

/** ST-08 WEB simulation and ST-09 AR / VR / MR (V3, ST-v1 StudentFinal `is.fpage`, `fpageVM`; `msg('ar' | 'mr')`). */
export const P3_FORMATS_LINK_TARGETS: readonly LedgerEntry[] = [
  ...pageRows('ST-08', WEB, [
    [
      'Breadcrumbs',
      '<experiment> · Simulation',
      'secondary',
      HUB,
      'built',
      'ST-v1 `fpageVM`',
      'The experiment opens ST-05, Simulation ST-07. "Back to Simulation" left the card (HANDOFF decision 4).',
    ],
    [
      'Launch surface (not started · in progress · didn’t open)',
      'Launch WEB · Continue WEB · Try again',
      'primary',
      null,
      'in-page',
      'ST-v1 `fpageVM`',
      'LearningService.launchWebFormat, then the returned WEB link opens in a new tab (the Phase-7 sample activity in the product build); it stores nothing (AD-16). The export’s in-tab ST-08a stage page is not built (lead decision 1).',
    ],
    [
      'Launch surface (completed, feedback offered)',
      'Give feedback on WEB',
      'primary',
      `${HUB}/feedback/web`,
      'built',
      'ST-v1 `fpageVM`',
      'ST-16; offered only when FeedbackService answers eligible for WEB (BC5).',
    ],
    [
      'Launch surface (completed, feedback sent)',
      'See your feedback',
      'secondary',
      `${HUB}/feedback/web`,
      'built',
      'ST-v1 `fpageVM`',
      'ST-17 (the read-only state of the feedback page).',
    ],
    [
      'Help row',
      'Report a problem',
      'secondary',
      '/student/help/report',
      'built',
      'ST-v1 `fpageVM`',
    ],
    [
      'Refusal (WEB not included · not published)',
      'Back to Simulation',
      'secondary',
      SIMULATION,
      'built',
      'ST-v1 `msg`',
    ],
  ]),
  ...pageRows('ST-09', FORMAT, [
    [
      'Breadcrumbs',
      '<experiment> · Simulation',
      'secondary',
      HUB,
      'built',
      'ST-v1 `fpageVM`',
      'The experiment opens ST-05, Simulation ST-07.',
    ],
    [
      'Launch surface (completed, feedback offered)',
      'Give feedback on VR',
      'primary',
      `${HUB}/feedback/{format}`,
      'built',
      'ST-v1 `fpageVM`',
      'ST-16; offered only when FeedbackService answers eligible for the format (BC5). There is no launch button for AR, VR or MR.',
    ],
    [
      'Launch surface (completed, feedback sent)',
      'See your feedback',
      'secondary',
      `${HUB}/feedback/{format}`,
      'built',
      'ST-v1 `fpageVM`',
      'ST-17; state-copy ST-09.feedback-sent.',
    ],
    [
      'Authorised headset',
      'My device',
      'secondary',
      '/student/device',
      'built',
      'ST-v1 `fpageVM`',
      'ST-18; shown only with an authorised device for the format, not while paused or waiting.',
    ],
    [
      'Setup steps',
      'View setup steps · Hide setup steps',
      'secondary',
      null,
      'in-page',
      'ST-v1 `fpageVM`',
      'A disclosure (`button.st-disclose`, `aria-expanded`): open the first time, while Not started.',
    ],
    [
      'Help row',
      'Report a problem',
      'secondary',
      '/student/help/report',
      'built',
      'ST-v1 `fpageVM`',
    ],
    [
      'Refusal (not included · not available)',
      'Back to Simulation',
      'primary',
      SIMULATION,
      'built',
      "ST-v1 `msg('ar' | 'mr')`",
      'The refusal card’s one way back (`rb-btn--lg`).',
    ],
    [
      'Refusal — Formats you can use',
      'Continue <format> · Open <format>',
      'secondary',
      `${HUB}/simulation/{format}`,
      'built',
      'ST-v1 `msg` (`fmtAlt`)',
    ],
  ]),
];
