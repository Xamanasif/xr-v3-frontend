import type { StateCopyEntry } from './state-copy';

/**
 * The state-copy entries of SA-10 Content updates and SA-11 Release or hold an update: every state
 * string or rule these screens show that their design does not draw word for word, with its basis
 * and the decisions it waits on. The screens follow the owner-approved Super Admin export (V3
 * Refined B, design/v3-refined-b/roles/SA-v1 `sa-views-c.js` `V.updates`, `V.update`); a state the
 * export draws takes its words (cited “SA-v1 …”, read from `copy/sa-content.ts`), one it does not
 * draw keeps the Phase 6 words (B7-05, B7-10, B7-11). Decision ids and internal references never
 * appear in visible copy.
 */
export const STATE_COPY_RELEASE = {
  // ---- SA-10 Content › Updates ----
  'SA-10.loading': {
    screen: 'SA-10',
    state: 'The corrections loading (screen readers; the skeleton rows in the surface)',
    words: 'Loading corrections…',
    rule: 'The head, the page tabs and the foot line stay; the segments and the rows wait for the three reads.',
    basis: 'SA-v1 `sa-views-c.js` `V.updates` list state “loading” (`SA.listState`)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-10.failed': {
    screen: 'SA-10',
    state: 'The corrections failed to load (service unavailable; a test fault plan only)',
    words: 'We couldn’t load the corrections',
    basis: 'SA-v1 `sa-views-c.js` `V.updates` list state “failed” (`SA.listState`, Try again)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-10.failed.line': {
    screen: 'SA-10',
    state: 'The failed state’s reassurance',
    words: 'Nothing has changed. Try again.',
    basis:
      'SA-v1 `sa-core.js` `SA.listState` “failed” (every Super Admin list; `copy/sa-shared.ts`)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-10.show-address': {
    screen: 'SA-10',
    state: 'The segment on show, in the address',
    words: null,
    rule: 'Waiting for your decision is the list’s own address; On hold and Released add `?show=on-hold` / `?show=released` (a segment replaces the address, no new history entry). An address whose `show` names no segment is replaced by the list’s address, as SA-18 does.',
    basis:
      'SA-v1 `sa-views-c.js` `V.updates` `seg` (`updTab`); Appendix A register route SA-10 `?show=`; SA-18 `SA-18.show-address`',
    status: 'provisional',
    decisions: ['VD-12', 'VD-14'],
  },
  'SA-10.rows': {
    screen: 'SA-10',
    state: 'What each row reads, and their order',
    words: null,
    rule: 'Each segment lists the service’s answer for it in the service’s order (waiting: oldest approval first; on hold: newest hold first; released: newest release first). A row: the experiment (the link, the whole row opening the decision) with its platform course code under it; “Version <from> → <to>” with “Version <from> stays live until released” (released: “Released <day>”); “Academic Reviewer” with the reviewer whose approval sent it; the day of that approval; the status. No reference is shown: the link is named “<experiment> correction, version <from> to <to>, <status>. Open”. Each segment’s figure is the length of its own read.',
    basis:
      'SA-v1 `sa-views-c.js` `V.updates` (rows, `rk-rowlink` aria-label); HANDOFF “Internal references”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  // ---- SA-11 Release or hold an update ----
  'SA-11.loading': {
    screen: 'SA-11',
    state: 'The correction loading (screen readers; the skeleton rows in its place)',
    words: 'Loading the update',
    rule: 'The page waits for the correction, the institutions and the experiment’s course; the shell’s placement reads “Content / Updates” until the correction is read.',
    basis:
      'The Super Admin record guard’s loading line over the kit’s skeleton rows (`SaRecordGuard`); the export draws no record loading state',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-11.failed': {
    screen: 'SA-11',
    state: 'The correction failed to load (service unavailable; a test fault plan only)',
    words: 'We couldn’t load this update',
    basis:
      'The Super Admin record guard’s failed state (`SaRecordGuard`, `SA.listState` “failed” formula); the export draws none for a record',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-11.failed.line': {
    screen: 'SA-11',
    state: 'The failed state’s reassurance',
    words: 'Nothing has changed. Try again.',
    basis:
      'SA-v1 `sa-core.js` `SA.listState` “failed” (`copy/sa-shared.ts`, shown by `SaRecordGuard`)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-11.not-yet': {
    screen: 'SA-11',
    state: 'A correction the Super Admin may not see yet (the service answers `invalid-state`)',
    words: null,
    rule: 'The calm “Nothing to decide” message the export draws (the GL-04 template: “This correction hasn’t been approved by the Academic Reviewer yet. It reaches you when it is. The live version is unchanged.”, Back to Updates), never “This page isn’t available”: the correction exists and reaches the Super Admin only once approved (UPD-18). The service gives the same answer for a draft, one in academic review, a returned one and a withdrawn one; the page does not tell them apart. The crumbs read Content › Updates › Nothing to decide (the service names no experiment). An address the service does not know (`not-found`) or may not open (`not-permitted`) is the GL-04 “This page isn’t available”.',
    basis:
      'SA-v1 `sa-views-c.js` `V.update` (`notForSA`, `V.message`); `getUpdateDecision` answers',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-11.title': {
    screen: 'SA-11',
    state: 'The page title and the versions it names',
    words: null,
    rule: 'The H1 is the experiment’s live name (the comparison’s “Live now” name when the correction changes it). The head’s meta names the versions, “Version <live> → <proposed>” while waiting or held and, once released, “Version <the version it replaced> → <the released version>”, then “Approved by <reviewer> on <day>”. The browser tab and Help’s “Where did it happen?” name it “<experiment> correction”, never by its reference.',
    basis:
      'SA-v1 `sa-views-c.js` `V.update` head (`rk-title`, `rk-meta`); `SA.resolve` title; HANDOFF “Internal references”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-11.raised': {
    screen: 'SA-11',
    state: 'Who raised the correction',
    words: null,
    rule: 'The Content Manager’s “what changes and why” is quoted with its author, “<who started it>, <their role>”; the section is left out when there is none. When it was started and sent for academic review are in the history.',
    basis:
      'SA-v1 `sa-views-c.js` `V.update` “Why, from the Content Manager” (`rk-quote`, `rk-quote-by`)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-11.students': {
    screen: 'SA-11',
    state: 'Students with access to the experiment, per institution',
    words: null,
    rule: 'Not shown: the export’s “Institutions using it” has Institution · Access · Status only. The service’s count stays in its answer (never licences, T-06).',
    basis: 'SA-v1 `sa-views-c.js` `V.update` “Institutions using it” (`sa-table--rows`)',
    status: 'provisional',
    decisions: ['VD-12', 'T-06'],
  },
  'SA-11.institution-note': {
    screen: 'SA-11',
    state: 'What each institution row says',
    words: null,
    rule: 'Institution (its name, from the institutions read) · Access (“In its access plan · <formats>”; the plan is never named by its reference) · Status (the institution’s status in the Super Admin’s words, “Ending soon”). Requests not yet paid for are not rows (the service lists access plans only). The Phase 6 Note column (“Access ends … · renewal <REQ> under review”) is not drawn.',
    basis: 'SA-v1 `sa-views-c.js` `V.update` (`using`); HANDOFF “Internal references”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-11.no-institutions': {
    screen: 'SA-11',
    state: 'No institution’s current access plan includes the experiment',
    words: 'No institution has it in an access plan.',
    rule: 'Said in place of the table; the sentence under it (“Nothing here changes any institution’s access.”) stays.',
    basis: 'SA-v1 `sa-views-c.js` `V.update` (`rk-next` when `using` is empty)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-11.sample-meta': {
    screen: 'SA-11',
    state: 'The institutions section’s note',
    words: null,
    rule: 'Not shown: the export notes its illustrative table “From the access plans in this sample”; the product’s rows are read from the service.',
    basis: 'SA-v1 `sa-views-c.js` `V.update` “Institutions using it” `p.rk-note`',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-11.released.no-comparison': {
    screen: 'SA-11',
    state: 'A released update whose comparison the service gives empty',
    words: 'Version {version} was live until this release. The history below keeps every decision.',
    rule: 'Once released, the service compares the update with the version its release replaced and the page draws B7-05 f6’s “Live before · Released” table; this line stands only where that comparison has no changed field.',
    basis: 'B7-05 f6 (`cmpWas`, “Live before”); `getUpdateDecision` after `releaseUpdate`',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-11.history.sent-to': {
    screen: 'SA-11',
    state: '“Sent for academic review” before any reviewer has decided',
    words: 'the Academic Reviewer',
    rule: '“To <reviewer>. …” names the reviewer whose decision followed the send; before one, the role.',
    basis: 'B7-05 `uh` “To Prof. A. Menon. The live version 1.2 is unchanged.”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-11.history.returned': {
    screen: 'SA-11',
    state: 'A return to the Content Manager in the history (an update returned, then sent again)',
    words: 'Returned to the Content Manager by {name}',
    rule: 'The reason is not shown: the record keeps it for the Content Manager and the Academic Reviewer.',
    basis: 'B6-04 “Return to the Content Manager”. B7-05 draws no returned entry',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-11.history.withdrawn': {
    screen: 'SA-11',
    state: 'A withdrawal in the history',
    words: 'Withdrawn by {name}',
    basis: 'B6-09 “Withdraw update”. B7-05 draws no withdrawn entry',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-11.lifted-notice': {
    screen: 'SA-11',
    state: 'The “Hold lifted” notice',
    words: null,
    rule: 'Right after Lift hold, the flash says “Hold lifted.” (the export’s). Read later, while the correction waits for a decision after a hold was lifted, the notice “Hold lifted · The hold was lifted on <day>. It is waiting for your decision again.” stays under the head.',
    basis: 'SA-v1 `sa-views-c.js` `SA.DLG.liftUpd` flash; B7-05 f7 (`wasLifted`, `liftedLine`)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-11.hold-open': {
    screen: 'SA-11',
    state: 'The held panel’s open question',
    words: null,
    rule: 'The drawn sentence without a decision id, under Lift hold: “What else a hold affects, and whether it blocks later corrections, is still open.”',
    basis:
      'SA-v1 `sa-views-c.js` `V.update` held panel `p.rk-hint`; HANDOFF open decision 3 (T-28); P1-14 / VD-10',
    status: 'provisional',
    decisions: ['VD-10', 'T-28'],
  },
  'SA-11.release-while-held': {
    screen: 'SA-11',
    state: 'Release while the correction is on hold',
    words: null,
    rule: 'No Release control while held: the panel says “Release isn’t available while the update is on hold — Lift the hold first …” and Lift hold is its one action. A Release sent from a page read before the hold (another tab) is refused by the service (`hold-must-be-lifted`): the page reads the correction again and says it moved on.',
    basis:
      'SA-v1 `sa-views-c.js` `V.update` held panel (`rk-notice--paused`); HANDOFF SA-10/11 “Release while held” must not exist; refusal `hold-must-be-lifted`',
    status: 'provisional',
    decisions: ['VD-12', 'OD-B7-03'],
  },
  'SA-11.decision-rev': {
    screen: 'SA-11',
    state: 'Which revision a decision is sent with',
    words: null,
    rule: 'Release, Hold and Lift hold send the update’s revision from when their confirmation opened, never a newer read’s; the service refuses a stale one.',
    basis: 'Appendix D §1.5 optimistic concurrency; CM-03 `CM-03.decision-rev`',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-11.stale.title': {
    screen: 'SA-11',
    state: 'A decision refused because the update changed since the page read it',
    words: 'This update changed since you opened it',
    basis: 'Board 08 “conflict” formula; CM-03 `CM-03.stale.title`. B7-05 draws none',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-11.stale.line': {
    screen: 'SA-11',
    state: 'The stale notice’s line',
    words: 'It has been read again. Check it, then decide again.',
    rule: 'The confirmation closes and the notice heads the decision panel (an alert, which takes focus) with “Check it again”, which puts focus on the title. A typed hold reason stays in the panel, and the next confirmation sends the newest revision known. The export proposes “This record changed after you opened it — Nothing was saved”; the repo’s words stand (HANDOFF open decision 8).',
    basis:
      'Board 08 “conflict” formula; CM-03 `CM-03.stale.line`; SA-v1 `SA.refusalHtml` (placement, “Check it again”)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-11.moved-on': {
    screen: 'SA-11',
    state: 'A decision refused because the update moved on (decided elsewhere, held meanwhile)',
    words: 'This update has moved on. Its current state is shown.',
    basis: 'Board 08 “conflict” formula; CM-03 `CM-03.moved-on`. B7-05 draws none',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-11.unavailable.release': {
    screen: 'SA-11',
    state: 'Release failed for now (service unavailable)',
    words: 'It wasn’t released. Nothing was lost — try again.',
    rule: 'Shown in the confirmation, which stays open; nothing was written.',
    basis: 'Board 08 “failed, try again · Nothing was lost”. B7-05 draws none',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-11.unavailable.hold': {
    screen: 'SA-11',
    state: 'Hold failed for now (service unavailable)',
    words: 'It wasn’t put on hold. Nothing was lost — try again.',
    rule: 'Shown in the confirmation, which stays open; nothing was written.',
    basis: 'Board 08 “failed, try again · Nothing was lost”. B7-05 draws none',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-11.unavailable.lift': {
    screen: 'SA-11',
    state: 'Lift hold failed for now (service unavailable)',
    words: 'The hold wasn’t lifted. Nothing was lost — try again.',
    rule: 'Shown in the confirmation, which stays open; nothing was written.',
    basis: 'Board 08 “failed, try again · Nothing was lost”. B7-05 draws none',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-11.focus': {
    screen: 'SA-11',
    state: 'Where focus goes after a decision',
    words: null,
    rule: 'Released, held or hold lifted: the flash under the head that says what happened (“Version 1.3 is live.”, “The correction is on hold.”, “Hold lifted.”). Refused: the refusal at the head of the panel; its “Check it again”: the page title. Cancel returns focus to the button that opened the confirmation.',
    basis:
      "SA-v1 `sa-views-c.js` `SA.DLG.releaseUpd`, `holdUpd`, `liftUpd` (`SA.focus('sa-flash')`); `sa-core.js` `staleGuard`, `clearRefusal`",
    status: 'provisional',
    decisions: ['VD-12'],
  },
} as const satisfies Readonly<Record<string, StateCopyEntry>>;
