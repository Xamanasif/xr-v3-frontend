import type { StateCopyEntry } from './state-copy';

/**
 * The state-copy entries of Phase 6’s CM-08 Updates, RV-04 Review an update and the update rows of RV-01, RV-02, RV-05, CM-01 and CM-04 (B6-04, B6-09 f0, B6-13, B7-11) — part of the one register (`state-copy.ts`, VD-12):
 * every state string or rule these screens show that their board does not draw word for word, with
 * its basis and the decisions it waits on. Decision ids never appear in visible copy.
 */
export const STATE_COPY_REVIEW_UPDATE = {
  // ---- CM-08 Updates (the list) ----
  'CM-08.list.loading': {
    screen: 'CM-08',
    state: 'The Updates list loading (V3: the export’s list loading)',
    words: 'Loading your corrections…',
    rule: 'The head shows without its figures; the count and the cards give way to the announced line over a skeleton band and two cards. Every read the cards need (the corrections, the published experiments, the course codes) is waited for.',
    basis:
      'CM-v1 `Main.dc.html` CM-08 Updates list `U.lsLoading`; COMPONENT-EXTENSIONS list states; board L13',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'CM-08.list.failed': {
    screen: 'CM-08',
    state: 'The Updates list failed to load (service unavailable; a test fault plan only)',
    words: 'We couldn’t load your corrections',
    rule: 'The export’s couldn’t-load state (an alert): “Nothing has changed. Try again.” and “Try again”, which reads the list again and moves focus to the page title; no count and no figures.',
    basis: 'CM-v1 `Main.dc.html` CM-08 Updates list `U.lsFailed`, `lsRetry`; board L14',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'CM-08.list.rows': {
    screen: 'CM-08',
    state: 'Which corrections the list shows, how they are grouped, and each card’s facts',
    words: null,
    rule: 'Every correction the service lets the Content Manager see (her scope), grouped by who must act — Need you (draft, returned), With others (in academic review, awaiting the release decision, on hold), Closed (released, withdrawn); a group with none is not shown — the most recent change first within each, as `listUpdates` answers. A card: the experiment’s live name; “<UPD id> · <course> · last change <day month>” (the latest step in its history, or a later save); the version change; the status (`cmUpdatePill`); the mini four-stage track while open, or the outcome line once closed; the return, hold or withdrawal reason quoted. The figures count Need you and With others.',
    basis:
      'CM-v1 `updListVM` (`sections`, `meta`, `ver`, `note`, `res`, `nYou`, `nOn`); contract `listUpdatesOutput`; state-copy `CM-08.course`',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'CM-08.list.actions': {
    screen: 'CM-08',
    state: 'A card’s action',
    words: null,
    rule: '“Continue” (gold, the card ivory) while the correction is hers — a draft or returned — otherwise “Open”; both open the correction page (`/content-manager/updates/<UPD id>`), named “<Continue|Open> <UPD id>, <experiment>, <status>”.',
    basis: 'CM-v1 `updListVM` (`act`, `btnCls`, `aria`); LINK-MAP “CM-08 Updates list”',
    status: 'provisional',
    decisions: ['VD-12'],
  },

  // ---- RV-04 Review an update ----
  'RV-04.loading': {
    screen: 'RV-04',
    state: 'The update loading (screen readers; a skeleton section)',
    words: 'Loading the update',
    rule: 'The back link “Review queue” and the H1 “Review an update” (the board’s own heading for the page) show while it loads; the top bar reads “Review queue”.',
    basis:
      'Board 04 “State grammar” Loading formula; B6-04 `rvNone` heading “Review an update”. B6-04 draws no loading frame',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'RV-04.failed': {
    screen: 'RV-04',
    state: 'The update failed to load (service unavailable; a test fault plan only)',
    words: 'We couldn’t load this update',
    rule: 'The failed notice with “Try again”, which reads again.',
    basis:
      'B6-02 f3 “We couldn’t load the review queue” · “Nothing has changed. Try again.”; as RV-03. B6-04 draws no failed frame',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'RV-04.failed.line': {
    screen: 'RV-04',
    state: 'The failed notice’s line',
    words: 'Nothing has changed. Try again.',
    basis:
      'B6-02 f3 (the review queue’s failed state draws these words); B6-04 draws no failed state',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'RV-04.not-sent': {
    screen: 'RV-04',
    state:
      'An update that is not sent for review yet (a draft): the service does not show it to the reviewer',
    words: null,
    rule: 'The service answers that the update is not visible in its state (a draft is the Content Manager’s only): the page shows the drawn “Review an update” · “No update is waiting for your decision” with “Open the review queue” — nothing about the draft. An unknown update or one outside the reviewer’s scope is the in-shell not-found page.',
    basis:
      'B6-04 `rvNone` (`!u || ust === "draft"`); B6-13 f4 “Nothing to decide until it is sent”; policy UPD-16',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'RV-04.chip': {
    screen: 'RV-04',
    state: 'The header chip in each state',
    words: null,
    rule: 'The reviewer’s words from the shared table (`updateWords`): “Waiting for your decision” (wait), “Returned to the Content Manager” (err), “Approved — with the Super Admin” while awaiting release or on hold (ok), “Update approved — released” (ok); a withdrawn update reads the board script’s “Withdrawn” (off).',
    basis:
      'B6-04 f0, f3, f4 and script `rvChipWords`, `rvChip_*`, `stw`; B7-11 f6; B6-02 f1 “Update approved — released”',
    status: 'provisional',
    decisions: ['VD-12', 'OD-B6-06'],
  },
  'RV-04.decided': {
    screen: 'RV-04',
    state: 'The decision panel once the update is not waiting for the reviewer',
    words: null,
    rule: 'As B6-04’s script words it (`rDecTitle`, `rDecMeta`, `rDecNext`): awaiting release — “Approved — awaiting the Super Admin’s release decision”, “<day> · <who approved>”, “Version <live> stays live. Release or hold is the Super Admin’s decision.”; returned — “Returned to the Content Manager”, “<day> · “<reason>””, “The Content Manager can change it and send it again.”; withdrawn — “Withdrawn by the Content Manager” (its reason stays with the Content Manager); on hold or released — “Nothing to decide”. Each ends with “Back to the review queue”. Focus moves to the panel’s result after a decision made here.',
    basis:
      'B6-04 f3, f4 and script `rDecTitle`, `rDecMeta`, `rDecNext`, `rDecOk/Err/Off`; B7-11 f6',
    status: 'provisional',
    decisions: ['VD-12', 'OD-B6-06', 'UPD-17'],
  },
  'RV-04.history': {
    screen: 'RV-04',
    state: 'Which steps the update history lists, and their words',
    words: null,
    rule: 'Newest first, the steps the record shows to the Academic Reviewer: “Sent for academic review” (“To <the reader>. The live version <the version it corrects> is unchanged.” — the record names no recipient: it reached every reviewer whose scope covers the course, the reader among them), “Approved by <who>” (“With the Super Admin for a release decision. The live version stays <v> until then.”), “Returned by <who>” (the reason, quoted) and “Released by <who>” (“Version <v> is live for everyone.”). The draft’s start, a hold and a withdrawal are the Content Manager’s (and the Super Admin’s) steps and are not listed here.',
    basis:
      'B6-04 f0, f3, f4 history and script `doSend`, `doRA`, `doRR`; B7-11 `histAdd` (“Released by …”); the record’s history audiences (domain correction.ts)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'RV-04.released': {
    screen: 'RV-04',
    state: 'A released update (read-only for the reviewer; B6-04 draws no released state)',
    words: null,
    rule: 'The service compares a released update with the version its release replaced, so “What changes” keeps what it changed, under B7-05 f6’s columns “Live before · Released” (the table SA-11 draws once released). The H1 names the version it corrected and its own (“<from> → <to>”); the header line and “About this experiment” name the version live now. The panel reads “Nothing to decide”.',
    basis:
      'B7-05 f6 (`cmpWas`, “Live before”, “Released”); B6-04 script `rDecTitle` (“Nothing to decide”); `getUpdateForReview` after `releaseUpdate`',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'RV-04.no-course-code': {
    screen: 'RV-04',
    state: 'The experiment’s course has no platform code',
    words: null,
    rule: 'The header line names the course by its name (“From <who> · <course name> · live version <v>”); “About this experiment” reads the name alone.',
    basis: 'B6-04 f0 “From Kavya Nair · CHE ZG513 · live version 1.2” (always with a code); T-17',
    status: 'provisional',
    decisions: ['VD-12', 'T-17'],
  },
  'RV-04.decision-ids': {
    screen: 'RV-04',
    state: 'The B6-04 sentence that carries a decision id',
    words: null,
    rule: 'Shown without the id: “Whether a correction may change formats, and references on update returns, are still open.”; `copy/review-update.ts` `STRIPPED_UPDATE` keeps the frozen wording and the id (T-28).',
    basis:
      'B6-04 f0 … f4 “… are still open (T-28).”; the owner’s P1-14 / VD-10 treatment (strip the suffix, keep the sentence)',
    status: 'provisional',
    decisions: ['P1-14', 'VD-10', 'T-28'],
  },
  'RV-04.return-reason': {
    screen: 'RV-04',
    state: 'Return to the Content Manager: the reason only',
    words: null,
    rule: 'DL-2 asks for the reason alone (required, checked when “Return to the Content Manager” is pressed: “Add a reason so the Content Manager knows what to change”); references on update returns are open, so none are offered.',
    basis:
      'B6-04 “Return to the Content Manager (DL-2) — Reason required. References on update returns are still open (T-28)”; contract `returnUpdateInput`',
    status: 'provisional',
    decisions: ['T-28'],
  },
  'RV-04.stale.title': {
    screen: 'RV-04',
    state: 'Approve or Return refused: the update changed since it was read (stale revision)',
    words: 'This update changed since you opened it',
    rule: 'Nothing is written. The dialog closes, the update is read again and this warning shows in the panel; the choice stays, and the next attempt is sent on the update as now shown.',
    basis: 'Board 08 “conflict” formula; as RV-03 `RV-03.stale.*`. B6-04 draws none',
    status: 'provisional',
    decisions: ['VD-12', 'P1-21'],
  },
  'RV-04.stale.line': {
    screen: 'RV-04',
    state: 'The stale notice’s line',
    words: 'It has been read again. Check what changes and decide again.',
    basis: 'Board 08 “conflict” formula. B6-04 draws none',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'RV-04.moved-on': {
    screen: 'RV-04',
    state:
      'Approve or Return refused because the update is no longer waiting for the reviewer (withdrawn or decided elsewhere)',
    words: 'It is no longer waiting for your decision — nothing you entered was sent.',
    rule: 'Nothing is written: the dialog closes, the update is read again and the page shows its current state with this notice first in the panel.',
    basis:
      'Appendix G P1-21 interim (“Refetch and render the current drawn state”); as RV-03.moved-on. B6-04 draws none',
    status: 'provisional',
    decisions: ['P1-21'],
  },
  'RV-04.unavailable': {
    screen: 'RV-04',
    state: 'Approve or Return failed for now (service unavailable)',
    words: 'Your decision wasn’t sent. Nothing was lost — try again.',
    rule: 'The dialog stays open with this error notice; its button can be pressed again.',
    basis:
      'Board 08 “failed, try again · Nothing was lost”; as RV-03 `RV-03.unavailable`. B6-04 draws none',
    status: 'provisional',
    decisions: ['VD-12'],
  },
} as const satisfies Readonly<Record<string, StateCopyEntry>>;
