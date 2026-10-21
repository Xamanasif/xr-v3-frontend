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
    rule: 'Every correction the service lets the Content Manager see (her scope), grouped by who must act — Need you (draft, returned), With others (in academic review, awaiting the release decision, on hold), Closed (released, withdrawn); a group with none is not shown — the most recent change first within each, as `listUpdates` answers. A card: the experiment’s live name; “<course> · last change <day month>” (the latest step in its history, or a later save; no reference — state-copy `CM-08.no-reference`); the version change; the status (`cmUpdatePill`); the mini four-stage track while open, or the outcome line once closed; the return, hold or withdrawal reason quoted. The figures count Need you and With others.',
    basis:
      'CM-v1 `updListVM` (`sections`, `meta`, `ver`, `note`, `res`, `nYou`, `nOn`); contract `listUpdatesOutput`; state-copy `CM-08.course`; Owner visual-review correction, 20 Oct 2026: no internal reference (SA-v1 rule)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'CM-08.list.actions': {
    screen: 'CM-08',
    state: 'A card’s action',
    words: null,
    rule: '“Continue” (gold, the card ivory) while the correction is hers — a draft or returned — otherwise “Open”; both open the correction page (`/content-manager/updates/<UPD id>`: the reference stays in the address only), named “<Continue|Open> the update to <experiment>, version <label>, <status>” — “, version <label>” whenever the update has a proposed or released label, so two updates to one experiment never share a name (state-copy `CM-08.no-reference`).',
    basis:
      'CM-v1 `updListVM` (`act`, `btnCls`, `aria`); LINK-MAP “CM-08 Updates list”; Owner visual-review correction, 20 Oct 2026: no internal reference (SA-v1 rule)',
    status: 'provisional',
    decisions: ['VD-12'],
  },

  // ---- RV-04 Review an update (V3: RV-v1) ----
  'RV-04.loading': {
    screen: 'RV-04',
    state: 'The update loading (screen readers; a skeleton section)',
    words: 'Loading the update',
    rule: 'The application’s existing page loading inside the V3 shell (as CM-v1 HANDOFF §4 keeps it for record pages): the H1 “Review an update” and the announced line. The crumb and the tab read “Review queue” until the experiment is known.',
    basis:
      'Board 04 “State grammar” Loading formula; B6-04 `rvNone` heading “Review an update”. The RV-v1 export draws no loading state for the item page',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'RV-04.failed': {
    screen: 'RV-04',
    state: 'The update failed to load (service unavailable; a test fault plan only)',
    words: 'We couldn’t load this update',
    rule: 'The failed notice with “Try again”, which reads again.',
    basis:
      'B6-02 f3 “We couldn’t load the review queue” · “Nothing has changed. Try again.”; as RV-03. The RV-v1 export draws no failed state for the item page',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'RV-04.failed.line': {
    screen: 'RV-04',
    state: 'The failed notice’s line',
    words: 'Nothing has changed. Try again.',
    basis:
      'B6-02 f3 (the review queue’s failed state draws these words); the RV-v1 export draws no failed state for the item page',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'RV-04.not-sent': {
    screen: 'RV-04',
    state:
      'An update that is not sent for review yet (a draft): the service does not show it to the reviewer',
    words: null,
    rule: 'The service answers that the update is not visible in its state (a draft is the Content Manager’s only): the delivered XS message page in the V3 shell — H1 “No update is waiting for your decision”, “Corrections from the Content Manager appear in your review queue once they are sent.”, “Open the review queue” and Help — nothing about the draft. An unknown update or one outside the reviewer’s scope (UPD-0006 after the EEE ZC341 scope was withdrawn: the service’s `scopeCovers`) is the in-shell not-found page: its existence is not revealed. The export’s “isn’t in your review scope” / “isn’t available” cards are not adopted (lead decision; existing rule kept).',
    basis:
      'B6-04 `rvNone` (`!u || ust === "draft"`); B6-13 f4; policy UPD-16; RV-v1 HANDOFF “Refusals and boundaries” (not adopted); XS-v6 `XsMessage`',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'RV-04.chip': {
    screen: 'RV-04',
    state: 'The status in the identity card and in the outcome block, in each state',
    words: null,
    rule: 'The export’s words (`standing` for an update): “Waiting for your decision” (info) while in academic review; “Approved — with the Super Admin” (ok) while awaiting the release decision or on hold — a hold is never shown to the reviewer; “Approved — released” (ok); “Returned to the Content Manager” (err); “Withdrawn by the Content Manager” (ended).',
    basis:
      'RV-v1 `RV.dc.html` script `standing`; boards RV04, RV04-returned, RV04-stale, RV06-update',
    status: 'provisional',
    decisions: ['VD-12', 'OD-B6-06'],
  },
  'RV-04.decided': {
    screen: 'RV-04',
    state:
      'The decision panel once the update is not waiting for the reviewer (RV-06 for an update)',
    words: null,
    rule: 'The export’s outcome block (`doneBlock` for an update): the status; “Decided by you on <date, time>” (the reviewer’s own last decision; another reviewer’s decision reads “Decided by <name> on …”, state-copy `RV-04.decided-by`); returned: “Your reason” and the reason quoted; where it stands — approved and waiting or on hold: Academic review · Approved by you, Release decision · With the Super Admin, Live version · <v>, unchanged, Access · Unchanged, then “Version <v> stays live. Release or hold is the Super Admin’s decision.”; released: Academic review · Approved by you, Release · Released on <day>, Live version · <released>, then “Version <released> is live. Releasing changed no one’s access.”; returned: Academic review · Returned to the Content Manager, Live version · <v>, unchanged, then “The Content Manager can change it and send it again.”; withdrawn: Update · Withdrawn by the Content Manager, Live version · <v>, unchanged, then “There is nothing to decide.” (no date: the withdrawal is the Content Manager’s step, `RV-04.withdrawn-date`). Ends with “Back to the review queue” (opened while waiting) or “Back to Reviewed by me”. Focus moves to the block after a decision made here.',
    basis:
      'RV-v1 `RV.dc.html` `doneBlock`, `backLabel`; boards RV04-approved, RV04-returned, RV04-stale, RV06-update',
    status: 'provisional',
    decisions: ['VD-12', 'OD-B6-06', 'UPD-17'],
  },
  'RV-04.decided-by': {
    screen: 'RV-04',
    state: 'A decided update whose decision another reviewer made (a shared course scope)',
    words: null,
    rule: '“Decided by <name> on <date, time>” and “Approved by <name>” in place of “… you”; the export draws only the reader’s own decisions.',
    basis: 'RV-v1 `RV.dc.html` `meta` (“Decided by you on …”); the record’s `reviewDecisions[].by`',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'RV-04.history': {
    screen: 'RV-04',
    state: 'Which steps the update history lists, and their words',
    words: null,
    rule: 'Newest first, the steps the record shows to the Academic Reviewer: “Sent for academic review” (“To <the reader>. The live version <the version it corrects> is unchanged.” — the record names no recipient: it reached every reviewer whose scope covers the course, the reader among them), “Approved by <who>” (“With the Super Admin for a release decision. The live version stays <v> until then.”), “Returned by <who>” (the reason, quoted) and “Released by <who>” (“Version <v> is live for everyone.”). The draft’s start is listed (“Correction started from the published experiment”); a hold and a withdrawal are the Content Manager’s (and the Super Admin’s) steps and are not listed — the export’s “Withdrawn by the Content Manager” history row is left out because the record does not show that step to the reviewer.',
    basis:
      'RV-v1 `RV.dc.html` UPD-0005 `hist`, `itemVals` history; B6-04 script `doSend`, `doRA`, `doRR`; B7-11 `histAdd`; the record’s history audiences (domain correction.ts)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'RV-04.released': {
    screen: 'RV-04',
    state:
      'A released update (read-only for the reviewer; the export draws no released update page)',
    words: null,
    rule: 'The service compares a released update with the version its release replaced, so “What changes” keeps what it changed, under B7-05 f6’s columns “Live before · <v>” and “Released · <v>”. The kind tag reads “<from> → <to>”; the live version fact and “The live experiment” name the version live now.',
    basis:
      'B7-05 f6 (`cmpWas`, “Live before”, “Released”); RV-v1 `standing` “Approved — released”; `getUpdateForReview` after `releaseUpdate`',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'RV-04.no-course-code': {
    screen: 'RV-04',
    state: 'The experiment’s course has no platform code',
    words: null,
    rule: 'The identity card names the course by its name alone (no code chip).',
    basis: 'RV-v1 `rv-meta-course` (code chip + name); T-17',
    status: 'provisional',
    decisions: ['VD-12', 'T-17'],
  },
  'RV-04.not-held': {
    screen: 'RV-04',
    state: 'What the export draws that the reads do not hold',
    words: null,
    rule: 'Left out, never invented: the identity card’s “Vendor” fact (neither the review read nor the public catalogue names the vendor); the “Withdrawn <date>” fact and the withdrawn block’s date (the withdrawal is not shown to the reviewer, `updateForAudience`).',
    basis:
      'RV-v1 `RV.dc.html` `facts` (`Vendor`, `Withdrawn`), `meta` (“Withdrawn on …”); contract `updateForReviewOutput`',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'RV-04.identifiers': {
    screen: 'RV-04',
    state: 'Internal references on the page',
    words: null,
    rule: 'No UPD- (or any other internal) reference in the page’s words, names, crumb, tab title or dialog: the page is named by the experiment (“Approve the update to <name>?”). The reference stays in the address. Named exception: the Content Manager’s own reason is quoted as written — the seeded corrections read “Correction UPD-000n.”.',
    basis:
      'Owner identifier rule (RV-v1 HANDOFF “Internal technical identifiers”, 21 Oct 2026); CM precedent for quoted seeded text',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'RV-04.choice': {
    screen: 'RV-04',
    state: 'The decision before a choice is made',
    words: null,
    rule: 'No choice is made when the panel opens; the gold button reads “Approve update” and, pressed without a choice, shows “Choose a decision” in the error summary (“Check your decision”), which takes focus.',
    basis: 'RV-v1 `RV.dc.html` `decOf` (`choice: null`), `validate`, `goLabel`; board RV04',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'RV-04.return-reason': {
    screen: 'RV-04',
    state: 'Return to the Content Manager: the reason only, in the panel',
    words: null,
    rule: 'The reason is asked for in the panel under the choice (“Reason the Content Manager will see (required)”, “Shown first on the correction when it is editable again.”), checked when “Return to the Content Manager” is pressed: “Add a reason so the Content Manager knows what to change” in the error summary and under the field; the return is sent at once — no dialog. References on update returns are open (T-28), so none are offered.',
    basis:
      'RV-v1 `RV.dc.html` `isReturn` field, `validate`, `go` (`record` without a confirmation); board RV04-return-errors; contract `returnUpdateInput`',
    status: 'provisional',
    decisions: ['T-28'],
  },
  'RV-04.stale.title': {
    screen: 'RV-04',
    state:
      'Approve or Return refused: the update changed since it was read (stale revision) and still waits for the reviewer',
    words: 'This update changed since you opened it',
    rule: 'Nothing is written. The dialog closes, the update is read again and this warning shows first in the panel (focused); the choice stays, and the next attempt is sent on the update as now shown. (Withdrawn meanwhile: `RV-04.moved-on`.)',
    basis: 'Board 08 “conflict” formula; as RV-03 `RV-03.stale.*`. The export draws none',
    status: 'provisional',
    decisions: ['VD-12', 'P1-21'],
  },
  'RV-04.stale.line': {
    screen: 'RV-04',
    state: 'The stale notice’s line',
    words: 'It has been read again. Check what changes and decide again.',
    basis: 'Board 08 “conflict” formula. The export draws none',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'RV-04.moved-on': {
    screen: 'RV-04',
    state:
      'Approve or Return refused because the update is no longer waiting for the reviewer (decided elsewhere)',
    words: 'It is no longer waiting for your decision — nothing you entered was sent.',
    rule: 'Nothing is written: the update is read again and the page shows its current state with the export’s refusal notice first in the panel (focused). Withdrawn meanwhile: “Nothing was recorded” · “The Content Manager withdrew this update after you opened it. The page now shows where it stands.” (the export’s words); decided elsewhere: “Nothing new was recorded” with this line (the export words that case for a submission only, “You had already approved this in another window”, which an update returned elsewhere or decided by another reviewer would misstate).',
    basis:
      'RV-v1 `RV.dc.html` `refusalT`, `refusalD`; boards RV04-stale-armed, RV04-stale; Appendix G P1-21 interim',
    status: 'provisional',
    decisions: ['P1-21'],
  },
  'RV-04.unavailable': {
    screen: 'RV-04',
    state: 'Approve or Return failed for now (service unavailable)',
    words: 'Your decision wasn’t sent. Nothing was lost — try again.',
    rule: 'Approve: the dialog stays open with this error notice; its button can be pressed again. Return: the notice shows in the panel above the button, the reason kept.',
    basis:
      'Board 08 “failed, try again · Nothing was lost”; as RV-03 `RV-03.unavailable`. The export draws none',
    status: 'provisional',
    decisions: ['VD-12'],
  },
} as const satisfies Readonly<Record<string, StateCopyEntry>>;
