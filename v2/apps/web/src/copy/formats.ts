/**
 * The words of the Student's format pages — ST-08 WEB simulation (B3-03) and ST-09 AR / VR / MR
 * format (B3-04; B3-12 f1, f3; B3-13 f4 … f11) — Phase 3. Every string here is a board's own
 * (`formats.test.ts` finds each on its board); the headings and actions shared with the other
 * Phase-3 screens come from `flow-state-words.ts` (`FORMAT_WORDS`, `formatProgressWords`). What no
 * board words is a provisional entry of the state-copy register (`state-copy-formats.ts`, VD-12)
 * and is read from there. Names, codes, dates and devices are the sample world's, never typed here.
 */
import type { Technology } from '@xr/domain';

import { formatCode, formatList } from './student';
import { stDateTime, stDay } from './st-shared';

/** The 24-hour time alone, in Indian time as every board date ("15:30", B3-03 f3). */
const IST_TIME = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Kolkata',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

export function timeOf(instant: string): string {
  return IST_TIME.format(new Date(instant));
}

// ---- shared by ST-08 and ST-09 --------------------------------------------------------------

export const FORMAT_PAGE = {
  /** The back link and the crumb before the format (B3-03 f0, B3-04 f0). */
  simulation: 'Simulation',
  reportProblem: 'Report a problem',
  backToSimulation: 'Back to Simulation',
  /** A supplied licence wait (B3-03 f6, Arun Kumar, later sample; T-06 / D7: never counted). */
  waitingForLicence: 'Waiting for a licence',
  notAvailableYet: 'Not available to you yet',
} as const;

/** "Simulation · WEB" (B3-03 f0), "Simulation · VR" (B3-04 f0): the panel's overline. */
export function simulationOverline(format: Technology): string {
  return `Simulation · ${formatCode(format)}`;
}

/** "Feedback sent 14 Oct 2026, 15:42" (B3-03 f4). */
export function feedbackSentWords(sentAt: string): string {
  return `Feedback sent ${stDateTime(sentAt)}`;
}

/** "Thank you — your feedback on WEB is recorded." (B3-03 f4). */
export function feedbackRecordedWords(format: Technology): string {
  return `Thank you — your feedback on ${formatCode(format)} is recorded.`;
}

// ---- ST-08 WEB simulation (B3-03) -----------------------------------------------------------

export const WEB_PAGE = {
  /** The top-bar title and the panel's `aria-label` (B3-03 f0 … f7). */
  title: 'WEB simulation',
  notStartedTitle: 'Start the WEB simulation',
  inProgressTitle: 'Continue where you left off',
  needs: 'Needs a laptop or desktop with a current web browser',
  opened: 'The simulation opened in a new tab. Come back here any time to continue.',
  failedTitle: 'The simulation didn’t open',
  failedLine: 'Nothing was lost. Try again, or report a problem if it keeps happening.',
  tryAgain: 'Try again',
  opening: 'Opening the simulation…',
  opensInNewTab: 'Opens in a new tab',
  completedText: 'Tell us how this format worked for you. It takes about two minutes.',
  pausedText:
    'Your institution’s access is paused. Your progress is kept, and you can continue when it’s lifted.',
  about: 'About WEB',
  experiment: 'Experiment',
  howItWorks: 'How it works',
  howItWorksLine: 'Runs in your browser in a new tab. This page keeps your place.',
  completedMeans: 'Completed means',
  completedMeansLine: 'The simulation reports that you finished. You can’t mark it yourself.',
} as const;

/** "Last saved 12 Oct 2026, 11:20" (B3-03 f0, f2, f7). */
export function lastSavedWords(savedAt: string): string {
  return `Last saved ${stDateTime(savedAt)}`;
}

/** "First opened 12 Oct 2026, 10:05" (B3-05 f0): WEB in progress before a save is reported. */
export function firstOpenedWords(openedAt: string): string {
  return `First opened ${stDateTime(openedAt)}`;
}

/** "Shell-and-Tube Heat Exchanger · ME ZG523" (B3-03 "About WEB": Experiment). */
export function experimentLine(name: string, code: string | null): string {
  return code ? `${name} · ${code}` : name;
}

// ---- ST-09 AR / VR / MR format (B3-04) ------------------------------------------------------

/** "VR format" (B3-04 f0 top bar, panel `aria-label`), "AR format" (f3), "MR format" (f4). */
export function formatTitle(format: Technology): string {
  return `${formatCode(format)} format`;
}

export const FORMAT_PANEL = {
  inProgressTitle: 'Continue on your headset',
  inProgressText:
    'Pick up where you left off on the headset. This page updates when a session is reported.',
  completedText: 'Tell us how this format worked for you.',
  pausedText: 'Your institution’s access is paused. Your progress is kept.',
  device: 'Your authorised device',
  myDevice: 'My device',
  viewSetupSteps: 'View setup steps',
  /** f6: the steps' section, open on the page (no "View setup steps"). */
  setupSteps: 'Setup steps',
} as const;

/** "Set up VR" (B3-04 f1, f7), "Set up AR" (f6). */
export function setUpTitle(format: Technology): string {
  return `Set up ${formatCode(format)}`;
}

/** "You can’t use VR right now" (B3-04 f5). */
export function cantUseTitle(format: Technology): string {
  return `You can’t use ${formatCode(format)} right now`;
}

/** "Last session reported 16 Oct 2026, 14:10" (B3-04 f0). */
export function lastSessionWords(reportedAt: string): string {
  return `Last session reported ${stDateTime(reportedAt)}`;
}

/** "First session reported 16 Oct 2026, 14:10" (B3-05 f0): a session before any is reported. */
export function firstSessionWords(reportedAt: string): string {
  return `First session reported ${stDateTime(reportedAt)}`;
}

/** "Reported by the simulation at 15:30" (B3-03 f3), "Reported from the headset at 11:15" (B3-04 f2). */
export function reportedWords(from: 'simulation' | 'headset', completedAt: string): string {
  return from === 'simulation'
    ? `Reported by the simulation at ${timeOf(completedAt)}`
    : `Reported from the headset at ${timeOf(completedAt)}`;
}

/** "AR isn’t included for your institution" (B3-04 f3). */
export function notIncludedTitle(format: Technology): string {
  return `${formatCode(format)} isn’t included for your institution`;
}

/** "AR is published for this experiment, but your institution’s access includes WEB and VR only." (B3-04 f3). */
export function notIncludedLine(format: Technology, included: readonly Technology[]): string {
  return `${formatCode(format)} is published for this experiment, but your institution’s access includes ${formatList(included)} only.`;
}

/** "This experiment isn’t available in MR" (B3-04 f4). */
export function notPublishedTitle(format: Technology): string {
  return `This experiment isn’t available in ${formatCode(format)}`;
}

/** "Shell-and-Tube Heat Exchanger is made for WEB, AR and VR." (B3-04 f4). */
export function madeForLine(name: string, published: readonly Technology[]): string {
  return `${name} is made for ${formatList(published)}.`;
}

/** One numbered setup step: its line and, where the board draws one, the line under it. */
export interface SetupStep {
  readonly text: string;
  readonly sub: string | null;
}

/** What a package format's setup reads (B3-04): the device it runs on and the steps around the published ones. */
export interface SetupWords {
  /** The status line before anything is reported: "Needs a VR headset" (f1), "Needs the phone app" (f6). */
  readonly needs: string;
  /** The panel's line before anything is reported (f1, f6). */
  readonly runs: string;
  readonly use: SetupStep;
  /** Under the first published step (f0, f1). */
  readonly published: string;
  /** Where nothing is published: f6's own step 2; `null` leaves the step out. */
  readonly fallback: string | null;
  readonly work: SetupStep | null;
  readonly done: SetupStep;
}

/**
 * The words around the published setup steps, per device: a headset (B3-04 f0, f1, f7, drawn for
 * VR; MR takes the same form, state-copy `ST-09.mr-words`) or the phone app (f6, AR). The published
 * steps (`delivery.setupSteps`, the Vendor's install notes) go between "Use …" and "Work through …",
 * the first with `published` under it (state-copy `ST-09.setup-steps`).
 */
export function setupWords(format: 'ar' | 'vr' | 'mr'): SetupWords {
  const code = formatCode(format);
  if (format === 'ar') {
    return {
      needs: 'Needs the phone app',
      runs: `${code} runs in the phone app, not in this browser. Follow the setup steps below.`,
      use: { text: 'Use your authorised phone.', sub: 'It is shown under My device.' },
      published: 'If you can’t find it, contact your institution administrator.',
      fallback: 'Open the experiment in the phone app.',
      work: null,
      done: {
        text: 'When the app reports that you’ve finished, this page shows “Completed”.',
        sub: null,
      },
    };
  }
  // "a VR headset" (f1); "an MR headset" (state-copy `ST-09.mr-words`).
  const article = format === 'mr' ? 'an' : 'a';
  return {
    needs: `Needs ${article} ${code} headset`,
    runs: `${code} runs on a headset, not in this browser. Follow the setup steps below.`,
    use: {
      text: `Use your authorised ${code} headset.`,
      sub: 'It is shown under My device, in your account menu.',
    },
    published: 'If you can’t find it, contact your institution administrator.',
    fallback: null,
    work: {
      text: 'Work through the experiment on the headset.',
      sub: 'Your sessions are reported here, so this page shows where you are.',
    },
    done: {
      text: 'When the headset reports that you’ve finished, this page shows “Completed”.',
      sub: `You can then give feedback on ${code}.`,
    },
  };
}

/**
 * The numbered steps (state-copy `ST-09.setup-steps`): "Use …", each published step (blank ones
 * left out; the first with the "can’t find it" line), else the fallback, then "Work through …" and
 * "When … reports that you’ve finished". Information only (T-14): no store, download or MDM route.
 */
export function setupSteps(words: SetupWords, published: readonly string[]): SetupStep[] {
  const given = published.map((step) => step.trim()).filter((step) => step.length > 0);
  const middle: SetupStep[] =
    given.length > 0
      ? given.map((text, index) => ({ text, sub: index === 0 ? words.published : null }))
      : words.fallback
        ? [{ text: words.fallback, sub: words.published }]
        : [];
  return [words.use, ...middle, ...(words.work ? [words.work] : []), words.done];
}

// ---- V3: the owner-approved Student export (ST-v1 `StudentFinal.dc.html`, `fpageVM`, `msg`) -----
// ST-08 / ST-09 as the V3 design words them; `formats.test.ts` finds each in the export. No stage
// is worded (lead decision 1: the sample activity's stages are illustrative), no plan is named
// (lead decision 3; the licence wait is `st-shared.ts` `NO_LICENCE_TELL_MORE`).

/** "WEB simulation" (`fpageVM` title), "VR on your headset"; another package format: "AR format". */
export function formatPageTitle(format: Technology): string {
  if (format === 'web') return WEB_PAGE.title;
  if (format === 'vr') return 'VR on your headset';
  return formatTitle(format);
}

/** "About WEB" / "About VR" (the aside's title). */
export function aboutFormatTitle(format: Technology): string {
  return `About ${formatCode(format)}`;
}

/** The aside's facts (`fpageVM` `about`): WEB, then a headset format. */
export const ABOUT_WEB = {
  needs: 'Needs',
  needsLine: 'A laptop or desktop with a current web browser',
  prototype: 'In this prototype',
  prototypeLine: 'A simulated sample activity stands in for the real simulation.',
  completedMeans: 'Completed means',
  completedMeansLine:
    'The simulation reports that you finished and the platform records it. You can’t mark it yourself.',
} as const;

export const ABOUT_HEADSET = {
  runsOn: 'Runs on',
  runsOnLine: (format: Technology) =>
    `Your authorised ${formatCode(format)} headset, not in this browser`,
  pageShows: 'This page shows',
  pageShowsLine: 'Only what the headset reports',
  completedMeans: 'Completed means',
  completedMeansLine: 'The headset reports that you finished. You can’t mark it yourself.',
} as const;

/** The launch surface's words (`fpageVM`) the Phase-3 words don't already hold. */
export const LAUNCH_V3 = {
  vrNotStarted: 'Nothing has been reported from a headset yet. Follow the setup steps to start.',
  vrInProgress:
    'Pick up where you left off on the headset. This page updates when the headset reports a session.',
  hideSetupSteps: 'Hide setup steps',
  device: 'Your authorised headset',
  helpLead: 'Something not working?',
  helpLine: 'Reporting it doesn’t affect your progress.',
} as const;

/**
 * While the institution's access is paused (`fpageVM`): WEB "You can start WEB when access
 * resumes."; a headset format the same with "use".
 */
export function pausedLaunchWords(
  format: Technology,
  status: 'not-started' | 'in-progress' | 'completed',
): string {
  const code = formatCode(format);
  const verb = format === 'web' ? 'open' : 'use';
  switch (status) {
    case 'completed':
      return `${code} stays completed. You can ${verb} it again when access resumes.`;
    case 'in-progress':
      return format === 'web'
        ? 'Your place is kept. You can continue when access resumes.'
        : 'Your progress is kept. You can continue when access resumes.';
    case 'not-started':
      return `You can start ${code} when access resumes.`;
  }
}

/** The head's line beside a held format's pill (`fpageVM` `meta`): "In progress · last saved …". */
export function heldProgressWords(format: Technology, at: string): string {
  return format === 'web'
    ? `In progress · last saved ${stDateTime(at)}`
    : `In progress · last session reported ${stDateTime(at)}`;
}

/** The AR / MR refusals' "what you can still do" (`msg('ar' | 'mr')` `fmtAlt`, `fmtStatus`). */
export const FORMAT_REFUSAL = {
  formatsYouCanUse: 'Formats you can use',
} as const;

/** The refusal's kicker: "Shell-and-Tube Heat Exchanger · Simulation". */
export function refusalKicker(experimentName: string): string {
  return `${experimentName} · ${FORMAT_PAGE.simulation}`;
}

/**
 * A format's run in a refusal's list (`fmtStatus`): "Not started", "In progress · saved 12 Oct
 * 2026" (WEB) / "In progress · last session 16 Oct 2026" (a headset), "Completed 14 Oct 2026"; a
 * held format leads with its access ("Paused · in progress · saved 12 Oct 2026").
 */
export function formatRunWords(
  format: Technology,
  run:
    | { readonly status: 'not-started' }
    | { readonly status: 'in-progress'; readonly at: string | null }
    | { readonly status: 'completed'; readonly at: string },
  heldAccess: string | null,
): string {
  const words =
    run.status === 'completed'
      ? `completed ${stDay(run.at)}`
      : run.status === 'in-progress'
        ? `in progress${run.at ? ` · ${format === 'web' ? 'saved' : 'last session'} ${stDay(run.at)}` : ''}`
        : 'not started';
  if (heldAccess !== null)
    return run.status === 'not-started' ? heldAccess : `${heldAccess} · ${words}`;
  return `${words.charAt(0).toUpperCase()}${words.slice(1)}`;
}
