/**
 * The words of the local prototype build's two support pages (owner authorisation of Phase 7,
 * 17 Oct 2026). Neither is a designed v46 screen; both use the v46 visual system as it is.
 *
 * - TE-6 — `/prototype/reset`: the owner's "Reset demo data" action. The owner named it in those
 *   words, so the phrase appears once, here (`RESET_ACTION`), under a recorded exception to the
 *   `demo-wording` scan; every other line avoids it.
 * - TE-3 / T-12 — `/prototype/web-activity`: the sample WEB activity, labelled as simulated. It
 *   never claims that a real simulation or XR runtime exists.
 */

/** The owner's name for the TE-6 action (Phase-7 authorisation, 17 Oct 2026). */
export const RESET_ACTION = 'Reset demo data';

export const PROTOTYPE_FRAME = {
  product: 'XR Learning Platform',
  backToExperiments: 'Back to experiments',
} as const;

export const RESET_PAGE = {
  title: RESET_ACTION,
  intro:
    'This local prototype keeps its sample records in this browser, so a refresh or another tab carries on where you left off.',
  whatHappens:
    'Resetting returns every record to its starting state. Requests, institutions, people, access, progress, assessments, submissions and updates made since then are removed, and everyone is signed out in every tab of this browser.',
  onlyHere: 'Only this browser is affected. Nothing is sent anywhere.',
  action: RESET_ACTION,
  dialogTitle: `${RESET_ACTION}?`,
  dialogLine: 'Everything done in this prototype since the start is removed. This can’t be undone.',
  dialogEffects: [
    'Every record returns to its starting state',
    'Everyone is signed out, in every tab of this browser',
    'Your selection of experiments is emptied',
  ],
  cancel: 'Cancel',
  busy: 'Resetting…',
  doneTitle: 'Back to the starting state',
  doneLine: 'Every record is as it was at the start, and nobody is signed in.',
  home: 'Go to the home page',
  signIn: 'Sign in',
  notKeptTitle: 'Nothing is kept in this browser',
  notKeptLine:
    'This browser doesn’t let the prototype keep its records, so every page load already starts from the beginning.',
  failedTitle: 'The records couldn’t be reset',
  failedLine: 'Nothing was changed. Try again.',
  loading: 'Loading…',
} as const;

export const WEB_ACTIVITY = {
  title: 'Sample WEB activity',
  simulated: 'Simulated for this prototype',
  standsIn:
    'This page stands in for the experiment’s WEB simulation, which isn’t part of this prototype. No real simulation or XR runtime runs here.',
  howTitle: 'What to do',
  how: 'Run the rig at three different levels and note each measured value, then answer the check question and finish. Your experiment page shows WEB as completed only after you finish.',
  connecting: 'Connecting to your experiment page…',
  notConnectedTitle: 'This activity isn’t connected to your experiment page',
  notConnectedLine:
    'Open it with “Launch WEB” on the experiment’s WEB simulation page, and keep that page open while you work.',
  tryAgain: 'Try again',
  refusedTitle: 'This activity can’t be used right now',
  refusedLine: 'The experiment isn’t open to you at the moment. Go back to your experiment page.',
  step1: 'Step 1 · Run three trials',
  levelLabel: 'Rig level',
  levelHint: 'Choose a level from 1 to 5, then run the trial.',
  levelOption: (level: number) => `Level ${level}`,
  run: 'Run trial',
  trialsCaption: 'Your trials',
  trialColumn: 'Trial',
  levelColumn: 'Level',
  valueColumn: 'Measured value',
  noTrials: 'No trials yet.',
  sameLevel: 'You already ran this level. Choose a different one.',
  trialsDone: 'Three trials done.',
  saved: 'Progress saved to your experiment page.',
  step2: 'Step 2 · Check your result',
  question: 'Which level gave the highest measured value?',
  check: 'Check answer',
  wrong: 'Not quite. Compare the measured values in your trials and try again.',
  right: 'Correct — the highest level gave the highest value.',
  answerRequired: 'Choose a level.',
  step3: 'Step 3 · Finish',
  finishLine: 'Finishing reports this activity as completed to your experiment page.',
  finish: 'Finish activity',
  finishing: 'Reporting…',
  lockedLine: 'Finish the steps above first.',
  doneTitle: 'Activity completed',
  doneLine:
    'Your experiment page now shows WEB as completed, and you can give feedback on WEB there. You can close this tab.',
  close: 'Close this tab',
  reportFailedTitle: 'Your experiment page didn’t confirm the result',
  reportFailedLine: 'Keep the experiment page open in another tab, then try again.',
  reportRefusedTitle: 'The result wasn’t recorded',
  reportRefusedLine: 'The experiment isn’t open to you right now. Go back to your experiment page.',
} as const;

/**
 * B2B milestone I3 (owner decisions DP-05, DP-06, DP-08, 5 Nov 2026) — `/prototype/payment`: the
 * simulated payment provider's page. It stands in for a provider's page: no amount, no payment
 * details and no provider exist, and nothing is collected. Provisional words (the design canvas's
 * simulated payment board, awaiting the owner's sign-off, DP-19); never a real payment's words.
 */
export const SIMULATED_PAYMENT = {
  title: 'Simulated payment',
  noticeTitle: 'No money moves and no payment details are asked for.',
  noticeLine: 'This page stands in for a payment provider. Choose what happens to this payment.',
  payingFor: 'Paying for',
  request: 'Request',
  started: 'Started',
  complete: 'Complete the payment',
  fail: 'Make the payment fail',
  leave: 'Leave it unconfirmed',
  outcomesLabel: 'What each choice does',
  outcomes: [
    {
      tag: 'Complete',
      line: 'The provider confirms the payment. Access follows the request’s approval.',
    },
    {
      tag: 'Fail',
      line: 'The provider reports that the payment didn’t go through. Nothing is activated, and the payment can be tried again.',
    },
    {
      tag: 'Unconfirmed',
      line: 'No answer yet. The payment waits, and its outcome can be chosen here later.',
    },
  ],
  storedLine: 'Nothing here is collected or stored except the outcome you choose.',
  busy: 'Recording the outcome…',
  loading: 'Loading the payment…',
  notWaitingTitle: 'No payment is waiting here',
  notWaitingLine:
    'There is no payment waiting for an outcome at this address in this browser. A payment starts from its request status page.',
  pausedTitle: 'This payment can’t be completed now',
  pausedLine:
    'The institution’s access is paused, so the payment stays unconfirmed until access is restored. Its outcome can be chosen here again then.',
  failedTitle: 'The outcome couldn’t be recorded',
  failedLine: 'Nothing has changed. Try again.',
  backToStatus: 'Back to request status',
  tools: 'Prototype tools',
} as const;

/**
 * B2B milestone I2 / I3 (DP-06, DP-18) — `/prototype`: the prototype tools for testers. The
 * payments waiting for an outcome (the recovery path of a payment left unconfirmed), what this
 * browser keeps, and the reset. Not part of the platform; reached by its address only.
 */
export const PROTOTYPE_TOOLS = {
  title: 'Prototype tools',
  intro: 'Tools for trying out this prototype in this browser. They aren’t part of the platform.',
  waitingTitle: 'Payments waiting for an outcome',
  waitingNone: 'No payment is waiting for an outcome in this browser.',
  waitingNote:
    'Only payments you can open here are listed: requests sent from this browser, or your institution’s when you are signed in as its Institute Admin.',
  choose: 'Choose the outcome',
  startedAt: 'started',
  keptTitle: 'Records in this browser',
  keptRestored:
    'Records are kept in this browser, so a refresh or another tab carries on where you left off.',
  keptFresh: 'Records are kept in this browser. This visit started from the beginning.',
  keptReplaced:
    'The records saved in this browser came from another version of the prototype, so they were replaced with a fresh start.',
  keptNone: 'This browser doesn’t keep the records, so every page load starts from the beginning.',
  resetLink: RESET_ACTION,
  loading: 'Loading…',
  failedTitle: 'The waiting payments couldn’t be listed',
  failedLine: 'Nothing has changed. Try again.',
  tryAgain: 'Try again',
  home: 'Go to the home page',
} as const;
