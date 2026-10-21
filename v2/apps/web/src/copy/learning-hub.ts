/**
 * The words of the experiment hub's Phase-3 parts — ST-05's tab strip, header "Next step" and card
 * actions (B2-12), ST-06 Resources and ST-10 Progress for this experiment (B3-01), ST-07
 * Simulation — choose a format (B3-02; B3-12 f0, f2). Every string here is a board's own
 * (`learning-hub.test.ts` finds each on its board); what no board words is a provisional entry of
 * the state-copy register (`state-copy-learning-hub.ts`, VD-12) and is read from there. Names,
 * titles, dates and plan ids are the sample world's, never typed here.
 */
import type { Technology } from '@xr/domain';

import { formatCode } from './student';
import { stDateTime, stDay } from './st-shared';

function plural(count: number, word: string): string {
  return count === 1 ? `1 ${word}` : `${count} ${word}s`;
}

// ---- the hub's tab strip (B2-12 f0; B3-01 f0, f8; B3-02 f0) -------------------------------

/** `nav.xw-hubtabs` link words (B2-12 f0; Phase 4B adds "Assessment", B4-11 f7). */
export const HUB_TABS = {
  overview: 'Overview',
  resources: 'Resources',
  simulation: 'Simulation',
  assessment: 'Assessment',
  progress: 'Progress',
} as const;

// ---- ST-05: the header's Next step and the cards' actions (B2-12 f0, f1, f2, f5) ----------

export const HUB_NEXT_STEP = {
  /** B2-12 f0, f2, f5: nothing opened, nothing started. */
  openResourcesLine: 'Next step: open the resources',
  /** B2-12 f1: WEB in progress. */
  continueWebLine: 'Next step: continue in your browser',
  /** B2-12 f0 (header and the Resources card). */
  openResources: 'Open resources',
  /** B2-12 f0 (the Simulation card). */
  chooseFormat: 'Choose a format',
} as const;

/** "Continue WEB" (B2-12 f1 header and Simulation card; B3-02 f0; B3-01 f9). */
export function continueFormatWords(format: Technology): string {
  return `Continue ${formatCode(format)}`;
}

/** "Open WEB", "Open VR" (B3-02 f1 … f3, f7; B3-01 f8, f9). */
export function openFormatWords(format: Technology): string {
  return `Open ${formatCode(format)}`;
}

/** "Give feedback on WEB" (B3-02 f2, f7; B3-01 f8, f12). */
export function giveFeedbackOnWords(format: Technology): string {
  return `Give feedback on ${formatCode(format)}`;
}

/** "Feedback sent 14 Oct 2026" (B3-02 f3; B3-01 f10, f12; B3-12 f2). */
export function feedbackSentWords(sentAt: string): string {
  return `Feedback sent ${stDay(sentAt)}`;
}

// ---- ST-06 Resources (B3-01 f0 … f7) -------------------------------------------------------

export const RESOURCES_PAGE = {
  heading: 'Resources',
  open: 'Open',
  notOpened: 'Not opened yet',
  opening: 'Opening…',
  justOpened: 'Opened in a new tab just now',
  openFailed: 'It didn’t open. Nothing was lost — try again.',
  tryAgain: 'Try again',
  paused: 'Paused',
  noneTitle: 'No resources are attached to this experiment yet',
  noneLine:
    'When resources are added, they appear here. The simulation and its other tabs don’t depend on them.',
  loading: 'Loading resources',
  failedTitle: 'We couldn’t load the resources',
} as const;

/** "3 resources" (B3-01 `count`; one resource reads "1 resource", state-copy `ST-06.count`). */
export function resourceCountWords(count: number): string {
  return plural(count, 'resource');
}

/** "Opened 12 Oct 2026, 09:40" (B3-01 f0 `openedText`). */
export function openedWords(openedAt: string): string {
  return `Opened ${stDateTime(openedAt)}`;
}

/** "Open Lab brief — Shell-and-Tube Heat Exchanger in a new tab" (B3-01 `aria`). */
export function openResourceLabel(title: string): string {
  return `Open ${title} in a new tab`;
}

/** "Try opening Lab brief — … again" (B3-01 `retryAria`). */
export function retryResourceLabel(title: string): string {
  return `Try opening ${title} again`;
}

// ---- ST-07 Simulation — choose a format (B3-02 f0 … f7) ------------------------------------

export const SIMULATION_PAGE = {
  intro: 'Formats come from your institution’s access. Each one has its own progress.',
  heading: 'Choose a format',
  /** B3-02 f1: WEB not started. */
  webNotStarted: 'Opens in your browser',
  /** B3-02 f0, f1, f2: VR not started. */
  vrNotStarted: 'Needs a VR headset',
  notIncluded: 'Published for this experiment; your institution’s access doesn’t include it.',
  waiting: 'Waiting for a licence',
  paused: 'Paused',
  pausedMeta: 'Not available while your institution’s access is paused. Your progress is kept.',
} as const;

/** "This experiment isn’t made for MR." (B3-02 f0 … f7). */
export function notMadeForWords(format: Technology): string {
  return `This experiment isn’t made for ${formatCode(format)}.`;
}

/** "Last saved 12 Oct 2026, 11:20" (B3-02 f0; B3-01 f9). */
export function lastSavedWords(savedAt: string): string {
  return `Last saved ${stDateTime(savedAt)}`;
}

/** "Last session reported 16 Oct 2026, 14:10" (B3-04 f0, the headset's activity). */
export function lastSessionWords(reportedAt: string): string {
  return `Last session reported ${stDateTime(reportedAt)}`;
}

// ---- ST-10 Progress for this experiment (B3-01 f8 … f12) -----------------------------------

export const EXPERIMENT_PROGRESS_PAGE = {
  heading: 'Your progress, format by format',
  listLabel: 'Progress by format',
  assessment: 'Assessment',
  notStartedBeforePause: 'Not started before the pause',
} as const;

/** "Completed 14 Oct 2026 before the pause" (B3-01 f11). */
export function completedBeforePauseWords(completedAt: string): string {
  return `Completed ${stDay(completedAt)} before the pause`;
}

// ---- V3: the owner-approved Student export (ST-v1 `StudentFinal.dc.html`) ----------------------
// The hub's head, the Overview, ST-06 Resources, ST-07 Simulation and ST-10 Progress as the V3
// design words them (`hubVM`, `overviewVM`, `resVM`, `simVM`, `progTabVM`); `learning-hub.test.ts`
// finds each in the export. The words other Student groups share are `st-shared.ts`. No stage is
// worded (lead decision 1) and no record reference (lead decision 3).

/** The hub's head and tabs (`hubVM`). */
export const HUB_HEAD = {
  /** Beside the licence wait's pill under the title. */
  tellMore: 'Your institution can tell you more.',
} as const;

/** The hub's section tabs' name: "Shell-and-Tube Heat Exchanger sections" (`tabsAria`). */
export function hubTabsLabel(experimentName: string): string {
  return `${experimentName} sections`;
}

/** ST-05 Overview (`overviewVM`, the template's `HB.isOverview` region). */
export const HUB_OVERVIEW = {
  about: 'About this experiment',
  bitsCode: 'BITS course code',
  outcomes: 'What you’ll learn',
  sameInEveryFormat: 'The same in every format',
  formats: 'Formats and your progress',
  eachOwnProgress: 'Each format has its own progress',
  yourFormats: 'Your formats',
  feedbackNotGiven: 'Feedback not given yet',
  progressKept: 'Your progress is kept',
  webRuns: 'Runs in your browser on a laptop or desktop',
  vrNeeds: 'Needs a supported VR headset',
  resources: 'Learning resources',
  noneOpened: 'None opened yet.',
  resourcesPaused: 'They open again when the pause is lifted.',
  resourcesWaiting: 'They open when you have a licence.',
  assessment: 'Assessment',
} as const;

/** "1 of 3 opened." (`overviewVM` `res.d`). */
export function resourcesOpenedLine(opened: number, total: number): string {
  return `${opened} of ${total} opened.`;
}

/** The assessment's one action (`asmtRow`, the Overview's `asLabel`, `progExp`'s link). */
export const HUB_ASSESSMENT_ACTIONS = {
  open: 'Open assessment',
  continue: 'Continue attempt',
  view: 'View',
  result: 'See result',
} as const;

/** ST-06 Resources (`resVM`, the template's `HB.isResources` region). */
export const RESOURCES_V3 = {
  title: 'Resources',
  eachNewTab: 'Each resource opens in a new tab',
  heldPaused: 'They can’t be opened while your institution’s access is paused.',
  heldWaiting: 'They open when you have a licence.',
  noneLine:
    'When resources are added, they appear here. The simulation and the other tabs don’t depend on them.',
  loading: 'Loading resources…',
  asideLabel: 'How resources fit in',
  beforeTitle: 'Before you run a simulation',
  beforeLine:
    'Read these first if you can. Nothing is locked: every format you have opens at any time.',
  openedTitle: 'Opened isn’t progress',
  openedLine:
    'Opening a resource is recorded with the time. Your progress is counted per format, in the Progress tab.',
  noneOpened: 'None opened yet',
} as const;

/** "3 resources · each opens in a new tab" (`resVM` `note`). */
export function resourcesNoteWords(count: number): string {
  return `${resourceCountWords(count)} · each opens in a new tab`;
}

/** The aside's count (`resVM` `openedText`): "None opened yet", "1 of 3 opened", "All 3 opened". */
export function resourcesOpenedCount(opened: number, total: number): string {
  if (opened === 0) return RESOURCES_V3.noneOpened;
  return opened >= total ? `All ${total} opened` : `${opened} of ${total} opened`;
}

/** "Try opening Readings sheet in a new tab" (`resVM` `aria`, after a failed opening). */
export function retryOpenResourceLabel(title: string): string {
  return `Try opening ${title} in a new tab`;
}

/** ST-07 Simulation — choose a format (`simVM`, the template's `HB.isSim` region). */
export const CHOOSER_V3 = {
  cardsLabel: 'Your formats',
  webNeed:
    'Runs in your browser on a laptop or desktop. This page keeps your place between visits.',
  vrNeed: 'Runs on your authorised VR headset, not in this browser. Sessions are reported here.',
} as const;

/** "Your headset: ME lab VR headset, asset tag GIT-VR-03" (`simVM` `device`). */
export function yourHeadsetWords(device: string): string {
  return `Your headset: ${device}`;
}

/** ST-10 Progress for this experiment (`progTabVM`, the template's `HB.isPT` region). */
export const PROGRESS_TAB_V3 = {
  intro:
    'Each format has its own progress, with no overall percentage. Opening resources isn’t counted here.',
  given: 'Given by your institution',
  noAssessment: 'Not set by your faculty yet',
} as const;
