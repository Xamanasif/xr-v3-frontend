import type { StateCopyEntry } from './state-copy';

/**
 * The state-copy entries of Phase 5’s the experiment editor — VE-03 … VE-06, VE-08, VE-09 (B5-03 … B5-05, B5-07) — part of the one register (`state-copy.ts`, VD-12):
 * every state string or rule these screens show that their board does not draw word for word,
 * with its basis and the decisions it waits on. Decision ids never appear in visible copy.
 */
export const STATE_COPY_VENDOR_EDITOR = {
  'VE-03.loading': {
    screen: 'VE-03',
    state: 'The editor loading (the record, the assigned courses; screen readers, skeleton lines)',
    words: 'Loading the experiment',
    rule: 'The back link stays; the header, the stepper and the step wait for the read.',
    basis:
      'Board 04 “State grammar” Loading formula; B4-02 f4 “Loading your experiments”. B5-03 … B5-07 draw no loading frame',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'VE-03.policy-open': {
    screen: 'VE-03',
    state:
      'An editor read the service answers policy-open: the Vendor’s scope is not a course list (ROLE-11) or the record is a colleague’s (SUB-15)',
    words: 'This experiment isn’t available to you yet',
    rule: 'A calm notice under the back link, nothing of the record and no form: the rule is not settled. My experiments stays one click away.',
    basis:
      'Matrix ROLE-11 and SUB-15 UNRESOLVED; board 04 calm-state formula. B5-03 … B5-07 draw no such state (independent review, Phase 5)',
    status: 'provisional',
    decisions: ['VD-12', 'ROLE-11', 'SUB-15'],
  },
  'VE-03.failed': {
    screen: 'VE-03',
    state: 'The editor failed to load (service unavailable; a test fault plan only)',
    words: 'We couldn’t load this experiment',
    rule: 'The failed formula in a section: this title, “Nothing has changed. Try again.” and “Try again”, which reads again. What was typed in this tab is kept.',
    basis: 'B4-02 f5 “We couldn’t load your experiments”. B5-03 … B5-07 draw no failed frame',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'VE-03.failed-line': {
    screen: 'VE-03',
    state: 'The failed state’s line',
    words: 'Nothing has changed. Try again.',
    basis: 'B4-02 f5 (the Faculty boards’ failed line)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'VE-03.kept': {
    screen: 'VE-03',
    state: 'What was typed and not yet saved, across in-app navigation',
    words: null,
    rule: 'Kept in memory for the tab’s life — never in browser storage — for the signed-in person and the record it was typed for (a new experiment, or the saved id). It survives the steps’ address changes and leaving the editor (My experiments, the record, Help) and coming back; it is dropped by Save draft or Save changes (the saved record is then shown), by Submit or Resubmit, and by Cancel. Another session never reads it; a reload starts again from the saved record.',
    basis:
      'B5-03 … B5-07 script (one state per editor, kept while the steps change); `fa-07-create-assessment/create-draft.ts` (the same rule for FA-07)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'VE-03.first-save': {
    screen: 'VE-03',
    state: 'The first Save draft of a new experiment',
    words: null,
    rule: 'The receipt gives the id (“SUB-0077”); the address becomes the draft’s own (`/vendor/experiments/SUB-0077/edit`, the step kept) without a history entry, and the editor reads as B5-03 f6: “Edit draft · Step n of 4”, “SUB-0077 · draft”, “Draft saved · <date, time>”.',
    basis: 'B5-03 f6 caption “The ID is given on first save”; OD-B5-07',
    status: 'provisional',
    decisions: ['VD-12', 'OD-B5-07'],
  },
  'VE-03.save-unavailable': {
    screen: 'VE-03',
    state: 'Save draft failed for now (service unavailable)',
    words: 'We couldn’t save your draft. Nothing was lost — try again.',
    basis: 'Board 04 “State grammar” Failed formula (“Nothing was lost”). No board draws it here',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'VE-03.continue-unavailable': {
    screen: 'VE-03',
    state: 'Continue could not be checked for now (service unavailable)',
    words: 'We couldn’t check this step. Nothing was lost — try again.',
    basis: 'Board 04 “State grammar” Failed formula. No board draws it here',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'VE-03.stale': {
    screen: 'VE-03',
    state: 'A save or submit refused because the record changed since it was read (stale version)',
    words:
      'This experiment changed since you opened it. Nothing was saved — check what you entered and try again.',
    rule: 'The record is read again; what was typed stays on the page.',
    basis:
      'Appendix F §4.6 stale-version (“refetch and render its current drawn state”). No board draws it',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'VE-03.moved-on': {
    screen: 'VE-03',
    state: 'A save or submit refused because the record moved on (invalid state)',
    words: 'This experiment has moved on since you opened it. Nothing was saved.',
    rule: 'The record is read again and the editor shows what it can now (read-only when it is no longer a draft or returned).',
    basis: 'Appendix F §4.6 invalid-state. No board draws it',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'VE-03.mode-address': {
    screen: 'VE-03',
    state: 'An editor address for the other mode (a returned record at /edit, a draft at /revise)',
    words: null,
    rule: 'The address is replaced by the record’s own mode (VE-08 for a returned record, VE-09 for a draft), the step kept, without a history entry.',
    basis:
      '`nav/vendor.ts` (VE-09 a saved draft, VE-08 a returned one); B5-02 actions “Edit draft” · “Revise”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'VE-09.opens-at': {
    screen: 'VE-09',
    state: 'A saved draft opened at its address without a step',
    words: null,
    rule: 'It opens at the step where the Vendor last saved (`lastStepReached`): the address gains that step without a history entry. Revise mode always opens at step 1, under the reason.',
    basis: 'B5-07 f5 caption “opens at step 2, where Anil stopped”; B5-07 `startRevise` (step 1)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'VE-09.withdrawn-line': {
    screen: 'VE-09',
    state:
      'The read-only notice of a draft whose course is no longer assigned (no withdrawal date in the read)',
    words:
      '{course} was withdrawn from {organisation}. This draft is kept, read-only. BITS / WILP decides which courses are yours.',
    rule: 'B5-07 f6’s line without “on <date>”: the editor’s read gives no withdrawal date. With one, the drawn line is used as it is.',
    basis:
      'B5-07 f6 “MEL ZG512 · Manufacturing Processes was withdrawn from Northline Simulation Studio on 15 Aug 2026. …”',
    status: 'provisional',
    decisions: ['VD-12', 'OD-B5-01'],
  },
  'VE-09.not-editable-title': {
    screen: 'VE-09',
    state: 'An editor address for a record that is with the Content Manager or published',
    words: 'You can’t change this experiment here',
    rule: 'The record’s name and line, this notice with “Open the experiment record”, then “What you entered”. With the Academic Reviewer and Submitted use the board’s own notices.',
    basis:
      'B5-07 script `idle` notices (`st_with_rv`, `st_submitted`); no notice is drawn for the other states',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'VE-09.not-editable-line': {
    screen: 'VE-09',
    state: 'The same notice’s line',
    words: 'Only a draft, or an experiment returned to you, can be changed.',
    basis:
      'B5-02 actions (“Edit draft” for a draft, “Revise” for a returned one, “Open” otherwise)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'VE-04.sample-file': {
    screen: 'VE-04',
    state: 'Choose file on a package panel',
    words: null,
    rule: 'Adds a sample file name — the experiment’s name in lower case with hyphens, the format and the version, e.g. “conduction-through-a-composite-wall-vr-1.0.zip”. The board’s “sample file” marker is a canvas label and is not shown (sample labels stay on the canvas). Nothing is uploaded; Remove takes it away.',
    basis:
      'B5-04 f1 caption “A sample file name only — nothing is uploaded in this prototype”; OD-B5-11; the seed’s package names',
    status: 'provisional',
    decisions: ['VD-12', 'OD-B5-11', 'T-14', 'T-36'],
  },
  'VE-05.sample-documents': {
    screen: 'VE-05',
    state: 'Add document',
    words: null,
    rule: 'Adds the next of the board’s three sample document names (“Lab handout — Composite Wall.pdf”, “Thermocouple positions.pdf”, “Safety notes.pdf”) not already listed; the button goes once all three are listed. File names only — nothing is uploaded; the board’s “sample file” marker is not shown (sample labels stay on the canvas).',
    basis: 'B5-05 script `D.docPool`, `addDoc`, `canAddDoc`; OD-B5-11',
    status: 'provisional',
    decisions: ['VD-12', 'OD-B5-11', 'T-36'],
  },
  'VE-06.submit-unavailable': {
    screen: 'VE-06',
    state: 'Submit for academic review failed for now (service unavailable)',
    words: 'We couldn’t submit it. Nothing was sent — try again.',
    basis: 'Board 04 “State grammar” Failed formula. No board draws it here',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'VE-08.save-unavailable': {
    screen: 'VE-08',
    state: 'Save changes failed for now (service unavailable)',
    words: 'We couldn’t save your changes. Nothing was lost — try again.',
    basis: 'Board 04 “State grammar” Failed formula. No board draws it here',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'VE-08.resubmit-unavailable': {
    screen: 'VE-08',
    state: 'Resubmit failed for now (service unavailable)',
    words: 'We couldn’t resubmit it. Nothing was sent — try again.',
    basis: 'Board 04 “State grammar” Failed formula. No board draws it here',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'VE-08.returned-by-override': {
    screen: 'VE-08',
    state:
      'The returned notice of a record the Super Admin moved back to the Vendor (stuck record override)',
    words: 'Returned to you',
    rule: 'The reason, the time and the Super Admin’s name follow as for any return; no references.',
    basis:
      'B7-06 (the Super Admin’s override; the Vendor-side words are not drawn); B5-07 f0 reason box',
    status: 'provisional',
    decisions: ['VD-12', 'OD-B7-09'],
  },
  'VE-08.reference-jump': {
    screen: 'VE-08',
    state: 'A “What it refers to” link',
    words: null,
    rule: 'Opens the step it names (the address gains its `?step=`) and moves focus to the field; a format that is no longer chosen focuses “Formats it supports”.',
    basis: 'B5-07 f0 caption ““What it refers to” jumps to Formats and delivery”; script `r.go`',
    status: 'provisional',
    decisions: ['VD-12', 'OD-B5-10'],
  },
} as const satisfies Readonly<Record<string, StateCopyEntry>>;
