/**
 * The words of the experiment hub's Phase-3 parts — ST-05's tab strip, header "Next step" and card
 * actions (B2-12), ST-06 Resources and ST-10 Progress for this experiment (B3-01), ST-07
 * Simulation — choose a format (B3-02; B3-12 f0, f2). Every string here is a board's own
 * (`learning-hub.test.ts` finds each on its board); what no board words is a provisional entry of
 * the state-copy register (`state-copy-learning-hub.ts`, VD-12) and is read from there. Names,
 * titles, dates and plan ids are the sample world's, never typed here.
 */
import type { Technology } from '@xr/domain';

import { dateTime, dayMonthYear } from './dates';
import { formatCode } from './student';

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
  return `Feedback sent ${dayMonthYear(sentAt)}`;
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
  return `Opened ${dateTime(openedAt)}`;
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
  return `Last saved ${dateTime(savedAt)}`;
}

/** "Last session reported 16 Oct 2026, 14:10" (B3-04 f0, the headset's activity). */
export function lastSessionWords(reportedAt: string): string {
  return `Last session reported ${dateTime(reportedAt)}`;
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
  return `Completed ${dayMonthYear(completedAt)} before the pause`;
}
