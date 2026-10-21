/**
 * The words more than one Student screen group draws in the V3 design — the owner-approved Student
 * export (design/v3-refined-b/roles/ST-v1, `project/StudentFinal.dc.html`): the format chip's
 * access words (`avail`), the "Not available to you" reasons (`offFormats`), the per-format
 * progress table (`progExp`: ST-10 and ST-15), the holds said once (`holdReason`, the licence
 * wait), the format actions, the state words (failed, retry, clear, Help) and the small labels.
 * Every string is the export's own (`st-shared.test.ts` finds each in it). Owned by the Student
 * shared-pieces agent: groups read these keys and never change their words; a new shared word is a
 * new key here. No word names a record by its internal reference (lead decision 3): the licence
 * wait names no plan, the access no grant.
 */
import type { FormatCode } from '@xr/domain';

import { dateTime, dayMonthYear } from './dates';

/**
 * A date and its time kept on one line when a sentence wraps — the export's `nbd` (every space a
 * no-break space; display only). Every Student sentence that names a date uses it.
 */
export function keepTogether(words: string): string {
  return words.replace(/ /g, '\u00a0');
}

/** "2 Oct 2026, 10:14" on one line (`nbd` of a date and time). */
export function stDateTime(instant: string): string {
  return keepTogether(dateTime(instant));
}

/** "8 Oct 2026" on one line (`nbd(dOnly(…))`). */
export function stDay(instant: string): string {
  return keepTogether(dayMonthYear(instant));
}

/** The formats' names beside their chips (`Component.FN`). */
export const ST_FORMAT_NAMES: Readonly<Record<FormatCode, string>> = {
  WEB: 'Browser',
  AR: 'Augmented reality',
  VR: 'Virtual reality',
  MR: 'Mixed reality',
};

/** A format's access in words beside its chip (`avail`). */
export const ST_ACCESS_WORDS = {
  available: 'Available to you',
  notIncluded: 'Not included for your institution',
  notForExperiment: 'Not available for this experiment',
  paused: 'Paused',
  waiting: 'Waiting for a licence',
  notRightNow: 'Not available right now',
  ended: 'Access ended',
  noLonger: 'No longer given to you',
} as const;

/** "Not available to you" and each format's reason (`offFormats`). */
export const ST_OFF_WORDS = {
  title: 'Not available to you',
  notIncluded: 'Published for this experiment, not included in your institution’s access',
  notPublished: 'Not published for this experiment',
} as const;

/** The licence wait, without the plan (B3-02's sentence, lead decision 3; `holdReason`). */
export const NO_LICENCE_FOR_YOU = 'No licence is available for you right now.';

/** The licence wait with its way on (`holdReason`, ST-08 / ST-09, the hub's head). */
export const NO_LICENCE_TELL_MORE =
  'No licence is available for you right now. Your institution can tell you more.';

/** A hold said once, above the formats or in a format's details (`holdReason`). */
export const ST_HOLD_WORDS = {
  paused: 'Your institution’s access is paused. Your progress is kept.',
  waiting: NO_LICENCE_TELL_MORE,
} as const;

/**
 * A given format that can't be used now (`holdReason`: "VR can’t be used at the moment. WEB still
 * opens."); `opens` is another format the Student can open now, when there is one.
 */
export function notRightNowWords(code: FormatCode, opens: FormatCode | null): string {
  return `${code} can’t be used at the moment.${opens ? ` ${opens} still opens.` : ''}`;
}

/** The per-format table's column heads (`progExp`; "Action" is read by screen readers only). */
export const ST_PROGRESS_COLUMNS = {
  format: 'Your format',
  progress: 'Progress',
  details: 'Details',
  action: 'Action',
} as const;

/** The table's caption: "Your formats for <experiment>: progress and actions". */
export function progressCaption(experimentName: string): string {
  return `Your formats for ${experimentName}: progress and actions`;
}

/** A format's own progress in its pill (`runWord`): Not started · In progress · Completed <day>. */
export const ST_PROGRESS_WORDS = {
  notStarted: 'Not started',
  inProgress: 'In progress',
  completed: (completedAt: string) => `Completed ${stDay(completedAt)}`,
} as const;

/** The time of an instant on the session clock ("15:30"). */
function timeOf(instant: string): string {
  return dateTime(instant).split(', ')[1] ?? '';
}

/**
 * A format's dated facts (`progExp`): only what the runtime reported and the system recorded — never
 * a stage (lead decision 1).
 */
export const ST_FACT_WORDS = {
  webNotOpened: 'Not opened yet',
  firstOpened: (at: string) => `First opened ${stDateTime(at)}`,
  lastSaved: (at: string) => `Last saved ${stDateTime(at)}`,
  reportedBySimulation: (at: string) => `Reported by the simulation at ${timeOf(at)}`,
  noSession: 'No headset session reported yet',
  firstSession: (at: string) => `First session reported ${stDateTime(at)}`,
  lastSession: (at: string) => `Last session reported ${stDateTime(at)}`,
  reportedFromHeadset: (at: string) => `Reported from the headset at ${timeOf(at)}`,
  feedbackSent: (at: string) => `Feedback sent ${stDay(at)}`,
} as const;

/** A format's one action (`progExp`, the hub's rule) and its fuller name ("Continue WEB, <experiment>"). */
export const ST_ACTION_WORDS = {
  continue: (code: FormatCode) => `Continue ${code}`,
  open: (code: FormatCode) => `Open ${code}`,
  feedback: (code: FormatCode) => `Give feedback on ${code}`,
  named: (label: string, experimentName: string) => `${label}, ${experimentName}`,
} as const;

/** "Open experiment" and its fuller name ("Open experiment Shell-and-Tube Heat Exchanger"). */
export const ST_OPEN_EXPERIMENT = 'Open experiment';

export function openExperimentName(experimentName: string): string {
  return `${ST_OPEN_EXPERIMENT} ${experimentName}`;
}

/** The words every Student state shares: a failure, its retry, a filter reset and Help. */
export const ST_STATE_WORDS = {
  failedLine: 'Nothing has changed. Try again.',
  tryAgain: 'Try again',
  clearFilters: 'Clear filters',
  help: 'Help & support',
} as const;

/** Small labels: the progress block's assessment line, the hub's "Next step" tag. */
export const ST_LABELS = {
  assessment: 'Assessment',
  nextStep: 'Next step',
} as const;
