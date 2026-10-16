import type { StateCopyEntry } from './state-copy';

/**
 * The state-copy entries of Phase 6’s SA-20 Support, SA-21 Support report and SA-22 Access ending (B7-09, B7-10) — part of the one register (`state-copy.ts`, VD-12):
 * every state string or rule these screens show that their board does not draw word for word, with
 * its basis and the decisions it waits on. Decision ids never appear in visible copy.
 *
 * B7-09 draws the three lists (f4 … f7, f13), the report in its three states (f8 … f12, f14) and
 * the Reopen confirmation; B7-10 f12, f13 and B7-12 f28 … f31 repeat them. It draws no loading or
 * failed page, no refusal of Resolve or Reopen and no “as of” date read from a service. Those, and
 * the rules the screens apply where the boards differ or stay silent, are here — with SA-07’s
 * access-ending row of “Needs attention” (B7-03 `att`, konark), which Phase 6 renders.
 */
export const STATE_COPY_OPERATIONS_6 = {
  // ---- SA-20 Operations › Support (B7-09 f7, f13) ----
  'SA-20.page-meta': {
    screen: 'SA-20',
    state: 'The line under “Operations” on the three lists',
    words: null,
    rule: 'Support and Access ending show “Device transfers, support reports and access that is ending” in `span.xl-meta`, as B7-09 f4, f5, f6, f7 and f13 draw it; Device transfers keeps “Device transfers, support reports and access ending”, as its own frame draws it (B3-11 f0, re-used unchanged as B7-09 f0). Board versus board: each list keeps its frame’s words.',
    basis: 'B7-09 f0 (`div.xr-phead-meta` text) against f4 … f7, f13 (`span.xl-meta`)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-20.show-address': {
    screen: 'SA-20',
    state: 'The Open · Resolved · All view in the address',
    words: null,
    rule: 'Open is the list’s own address; Resolved and All add `?show=resolved` / `?show=all`. The view tabs are B7-09’s status tabs (`role="tablist"`, ← → between them, each with its count); choosing one replaces the address (no history entry), and an address from outside (Back) is read again. An address whose `show` names no view is replaced by the list’s own address. Open lists open and reopened reports (B7-09 `match`).',
    basis:
      'B7-09 f7, f13 (`div.xr-tabs[role=tablist]`, `S.fTabs`); Appendix A register routes (query filters); as CM-04’s `?tab=`',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-20.order': {
    screen: 'SA-20',
    state: 'The order of the reports',
    words: null,
    rule: 'Oldest first, as the section’s meta says (“oldest open first”) and the service answers (`listSupportReports`, by when each was sent) — in every view. B7-09 f7’s fixed rows run newest first (SUP-0213 3 Oct above SUP-0207 28 Sep): board versus its own words; the words are followed.',
    basis:
      'B7-09 f7 section meta; SA-01 support group (oldest first, PC-67); OperationsService.listSupportReports',
    status: 'provisional',
    decisions: ['VD-12', 'PC-67'],
  },
  'SA-20.report-title': {
    screen: 'SA-20',
    state: 'A report’s title (the list’s Report column and the report’s heading)',
    words: null,
    rule: 'The display-only excerpt of “What happened” the reporter’s own Help shows (XS-07 `reportTitle`): there is no saved title. B7-09’s sample titles (“VR simulation stopped loading at step 2”) are not copied; SUP-0213’s reads “The VR simulation stopped loading at the second step”.',
    basis:
      'Owner decision P0-31 (12 Oct 2026); B7-09 f7, f8 `title`; state-copy `XS-07.report-title`',
    status: 'provisional',
    decisions: ['P0-31'],
  },
  'SA-20.from': {
    screen: 'SA-20',
    state: 'The “From” words (the list and the report)',
    words: null,
    rule: '“<name> · <role> · <institution>” for a reporter who belongs to an institution (named from the institutions list), “<name> · <role>” for everyone else — B7-09 draws “Kavya Nair · Content Manager” without her organisation, so no organisation is added. Role words are the board role names.',
    basis:
      'B7-09 `who` (Rahul Verma · Student · Godavari Institute of Technology; Kavya Nair · Content Manager)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-20.status-tones': {
    screen: 'SA-20',
    state: 'The status chips on the Super Admin’s side',
    words: null,
    rule: 'Open `xr-status--info` (arrows), Resolved `xr-status--ok` (tick), Reopened `xr-status--wait` (clock), as B7-09 draws them (`stk`). The reporter’s Help keeps board 07’s Reopened chip (info, Retry): the words are the same on both sides, each board’s chip is kept.',
    basis:
      'B7-09 `stk`, f7, f10; board 07 “Rules” (“Open · Resolved · Reopened — identical to the Super Admin side”)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-20.loading': {
    screen: 'SA-20',
    state: 'The support reports loading (screen readers; skeleton rows in the table’s shape)',
    words: 'Loading support reports',
    basis:
      'Board 04 “State grammar” Loading formula (as SA-18 “Loading device transfers”); B7-09 draws no loading frame',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-20.failed': {
    screen: 'SA-20',
    state: 'The support reports failed to load (service unavailable; a test fault plan only)',
    words: 'The support reports didn’t load. Nothing was lost.',
    basis: 'Board 04 “State grammar” Failed + retry formula (as SA-18.failed)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-20.failed.line': {
    screen: 'SA-20',
    state: 'The failed state’s next step',
    words: 'Try again. If it keeps happening, report the problem.',
    basis: 'Board 03 “Notices, empty, error, loading and read-only” (the failed notice’s line)',
    status: 'drawn',
  },
  // ---- SA-21 Support report (B7-09 f8 … f12, f14; B7-10 f12; B7-12 f28 … f31) ----
  'SA-21.decision-ids': {
    screen: 'SA-21',
    state: 'The panel’s foot, which B7-09 writes with a decision id',
    words: null,
    rule: 'Shown without the id: “No response-time target is set.”; `copy/operations-6.ts` `STRIPPED_OPERATIONS` keeps the frozen wording and the id (ND-14). No response time, target or reminder is shown anywhere.',
    basis:
      'B7-09 f8 … f14 “No response-time target is set (ND-14).”; the owner’s P1-14 / VD-10 treatment (strip the suffix, keep the sentence)',
    status: 'provisional',
    decisions: ['P1-14', 'VD-10', 'ND-14'],
  },
  'SA-21.layout': {
    screen: 'SA-21',
    state: 'The report and its one panel',
    words: null,
    rule: 'Details ~72 % and the static panel “Resolve” ~28 % from 860 px of content (`div.xr-decide`, `aside.xr-dpanel.xg-static`; the stack 20 px apart); below, the panel follows the details and no “Go to decision” is drawn (B7-09 f14; B7-12 “The Resolve panel follows the report below 908 px of app width”). The top bar reads “Operations”; from 1024 px the crumbs read “Operations / Support / SUP-0213”.',
    basis: 'B7-09 f8, f14; B7-12 f28 … f31',
    status: 'provisional',
    decisions: ['VD-05', 'VD-12'],
  },
  'SA-21.where': {
    screen: 'SA-21',
    state: 'A report sent with “Where” cleared',
    words: null,
    rule: 'The “Where” row is left out, as the reporter’s own detail does (XS-07); a missing screenshot reads “No screenshot added” (drawn). A screenshot is its file name only — nothing is uploaded or shown.',
    basis:
      'B7-09 f8 (every sample names a place); board 07 “Rules” (where is pre-filled and editable); `copy/help.ts` reportedFacts',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-21.institution-link': {
    screen: 'SA-21',
    state: '“Open <institution>” under the facts',
    words: null,
    rule: 'Shown for a reporter who belongs to an institution (B7-09 `hasInst`), opening its SA-07 Institution detail; a reporter without one (Content Manager, Academic Reviewer, Vendor, Super Admin) has no link.',
    basis: 'B7-09 `hasInst` / `instHref` (→ B7-03); f8 … f12',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-21.history': {
    screen: 'SA-21',
    state: 'The History lines',
    words: null,
    rule: 'Newest first, each with its day (“3 Oct 2026”) as the fixed rows draw it: Sent; Resolved with its note in quotation marks; Reopened with “By the reporter.” or “By <name>.” (B7-09 `doReopen`). The board’s live script adds the time and “ · Arjun Mehta” after a new resolution — board versus board; the drawn frames are followed (who resolved is in the panel: “Resolved on … by …”).',
    basis: 'B7-09 f9, f10, f12 `hist` (fixed rows); script `resolve`, `doReopen`',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-21.reopened-by': {
    screen: 'SA-21',
    state: 'The notice on a reopened report, when the Super Admin reopened it',
    words: null,
    rule: '“Reopened by the reporter” as drawn when the reporter reopened it; “Reopened by <name>” when someone else did (the Super Admin; the reporter has no Reopen control while SUP-04 is open), with “Earlier note: “…”” — the last resolution’s note — in both. B7-09 draws only the reporter’s case.',
    basis:
      'B7-09 f10 `hasPrev` notice; `doReopen` (“By Arjun Mehta.”); board 07 “Rules” (no reporter Reopen, SUP-04)',
    status: 'provisional',
    decisions: ['VD-12', 'SUP-04'],
  },
  'SA-21.flash': {
    screen: 'SA-21',
    state: 'After Resolve or Reopen',
    words: null,
    rule: 'B7-09’s flash (“SUP-0213 resolved. The reporter sees your note.” / “SUP-0213 is open again. The reporter sees it is reopened.”) in `p.xa-save.is-ok[role=status]`, kept mounted, shown once the report reads resolved (or open again) and focused (`focus(pid + "-flash")`). The panel then shows the record’s current state. Cancel on the confirmation returns focus to Reopen.',
    basis: 'B7-09 script `resolve`, `doReopen`, `cancel`; f12 caption',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-21.loading': {
    screen: 'SA-21',
    state: 'The support report loading (screen readers; the skeleton in a section)',
    words: 'Loading the support report',
    basis:
      'Board 04 “State grammar” Loading formula (as SA-19 “Loading the device transfer”); B7-09 draws no loading frame',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-21.failed': {
    screen: 'SA-21',
    state: 'The support report failed to load (service unavailable; a test fault plan only)',
    words: 'The support report didn’t load. Nothing was lost.',
    basis: 'Board 04 “State grammar” Failed + retry formula (as SA-19.failed)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-21.failed.line': {
    screen: 'SA-21',
    state: 'The failed state’s next step',
    words: 'Try again. If it keeps happening, report the problem.',
    basis: 'Board 03 “Notices, empty, error, loading and read-only” (the failed notice’s line)',
    status: 'drawn',
  },
  'SA-21.stale.title': {
    screen: 'SA-21',
    state: 'Resolve or Reopen refused because the report changed since it was opened',
    words: 'This report changed since you opened it',
    rule: 'Nothing is written; the report is read again, the panel shows its current state with this notice and focus moves to the panel’s heading. A typed note stays; the next Resolve sends the revision now shown.',
    basis: 'Board 08 “conflict” formula; CM-03 `CM-03.stale.title`. B7-09 draws none',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-21.stale.line': {
    screen: 'SA-21',
    state: 'The stale notice’s line',
    words: 'It has been read again. Check it, then decide again.',
    basis: 'Board 08 “conflict” formula (as CM-03.stale.line). B7-09 draws none',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-21.moved-on': {
    screen: 'SA-21',
    state: 'Resolve or Reopen refused because the report moved on (resolved or reopened elsewhere)',
    words: 'This report has moved on. Its current state is shown.',
    rule: 'The confirmation closes, the report is read again and the panel shows what it is now; focus moves to the panel’s heading.',
    basis: 'Board 08 “conflict” formula; CM-03 `CM-03.moved-on`. B7-09 draws none',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-21.own-report.title': {
    screen: 'SA-21',
    state: 'Resolve refused: the Super Admin sent this report (nobody resolves their own report)',
    words: 'You sent this report',
    rule: 'The service refuses (`not-permitted`); nothing is written, the note stays, focus moves to the panel’s heading. The screen does not decide it beforehand: Resolve is offered as drawn and the service’s answer is shown, calmly (info).',
    basis:
      'Matrix SUP-03 [P] “nobody resolves their own report”; OperationsService.resolveReport. No board draws it',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-21.own-report.line': {
    screen: 'SA-21',
    state: 'The own-report notice’s line',
    words: 'Nobody resolves a report they sent themselves. Nothing has changed.',
    basis: 'Matrix SUP-03. No board draws it',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-21.reopen-own': {
    screen: 'SA-21',
    state: 'Reopen refused because who may reopen their own report is not decided',
    words: 'Reopening a report you sent isn’t decided yet. Nothing has changed.',
    rule: 'The service answers `policy-open` (SUP-04); the confirmation closes, the report stays resolved, focus moves to the panel’s heading. Nothing is invented for the open question.',
    basis:
      'OperationsService.reopenReport (policy-open SUP-04); board 07 “Rules”. No board draws it',
    status: 'provisional',
    decisions: ['VD-12', 'SUP-04'],
  },
  'SA-21.unavailable.resolve': {
    screen: 'SA-21',
    state: 'Resolve failed for now (service unavailable)',
    words: 'It wasn’t resolved. Nothing was lost — try again.',
    rule: 'Shown in the panel; the typed note stays.',
    basis:
      'Board 08 “failed, try again · Nothing was lost” (as CM-03.unavailable.publish). B7-09 draws none',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-21.unavailable.reopen': {
    screen: 'SA-21',
    state: 'Reopen failed for now (service unavailable)',
    words: 'It wasn’t reopened. Nothing was lost — try again.',
    rule: 'Shown in the confirmation, which stays open.',
    basis: 'Board 08 “failed, try again · Nothing was lost”. B7-09 draws none',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  // ---- SA-22 Operations › Access ending (B7-09 f4, f5, f6; B7-10 f8, f13) ----
  'SA-22.decision-ids': {
    screen: 'SA-22',
    state: 'The note under the list, which B7-09 writes with a decision id',
    words: null,
    rule: 'Shown without the id: ““Reminder due” is a status only — nothing is sent from here, and no reminder channel is set. Renewals come in as requests.”; `copy/operations-6.ts` `STRIPPED_OPERATIONS` keeps the frozen wording and the id (T-31).',
    basis:
      'B7-09 f4, f5, f6; B7-10 f13 (“… no reminder channel is set (T-31). …”); the owner’s P1-14 / VD-10 treatment',
    status: 'provisional',
    decisions: ['P1-14', 'VD-10', 'T-31'],
  },
  'SA-22.as-of': {
    screen: 'SA-22',
    state: 'The “As of <day>” date of the list',
    words: null,
    rule: 'Read back from the service’s answer: a plan ending in N days was read on its end date less N days, an ended one on its end date plus the days since (calendar days, as the service counts them). With nothing listed the answer carries no date, so the section head shows no meta (B7-09 f5 draws “As of 23 Oct 2026 · soonest first” there): `listAccessEnding` has no “as of” of its own (reported as a contract gap).',
    basis:
      'B7-09 f4, f5 section meta; OperationsService.listAccessEnding (`daysLeft`, `endedDaysAgo`)',
    status: 'provisional',
    decisions: ['VD-12', 'PC-68'],
  },
  'SA-22.days': {
    screen: 'SA-22',
    state: 'The line under the end date for one day',
    words: null,
    rule: '“1 day left” and “Ended 1 day ago”; on the end date itself “0 days left”. The boards draw only plurals (“8 days left”, “10 days left”, “Ended 8 days ago”).',
    basis: 'B7-09 f4 (plural forms only); as IA-01.one-day',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-22.renewal-line': {
    screen: 'SA-22',
    state: 'The line under “Renewal in progress”',
    words: null,
    rule: 'The renewal request’s reference and its status in the Super Admin’s words, in lower case (“REQ-0038 under review”, “… information requested”); the reference alone while its status cannot be read. “Open request” opens it (SA-03); nothing here approves a renewal or recalculates a licence.',
    basis: 'B7-09 f4 (“REQ-0038 under review”); B1-10 status words',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-22.read-only': {
    screen: 'SA-22',
    state: 'What a row offers',
    words: null,
    rule: 'Open request (a renewal in progress only) and Open institution — no status action on any row. “Reminder due” is a status: nothing is sent, no reminder channel exists (T-31); ended access comes back only through a renewal request (B7-10 f8). Ended plans stay listed after the ending ones, the most recently ended first (the service’s order).',
    basis: 'B7-09 f4, f6; B7-10 f8, f13; OperationsService.listAccessEnding (PC-68)',
    status: 'provisional',
    decisions: ['T-31', 'PC-68'],
  },
  'SA-22.loading': {
    screen: 'SA-22',
    state: 'The list loading (screen readers; skeleton rows in the table’s shape)',
    words: 'Loading access that is ending',
    basis: 'Board 04 “State grammar” Loading formula; B7-09 draws no loading frame',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-22.failed': {
    screen: 'SA-22',
    state: 'The list failed to load (service unavailable; a test fault plan only)',
    words: 'Access that is ending didn’t load. Nothing was lost.',
    basis: 'Board 04 “State grammar” Failed + retry formula (as SA-18.failed)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-22.failed.line': {
    screen: 'SA-22',
    state: 'The failed state’s next step',
    words: 'Try again. If it keeps happening, report the problem.',
    basis: 'Board 03 “Notices, empty, error, loading and read-only” (the failed notice’s line)',
    status: 'drawn',
  },
  // ---- SA-07 “Needs attention” — access ending (B7-03 `att`, konark) ----
  'SA-07.attention-access-ending': {
    screen: 'SA-07',
    state: '“Needs attention”: access ending with a reminder due',
    words: null,
    rule: 'Phase 6: an institution whose plan ends within 15 days with no renewal requested (“Reminder due” on SA-22) has the row “Access ends <day> — reminder due (nothing is sent from here)” (B7-03 konark), right after a missing Institute Admin and before its requests, opening Operations › Access ending (SA-22) under the drawn “Operations › Access ending”. A renewal in progress is its request’s row; ended access needs nothing here (B7-10 f8 “Nothing needs attention.”). Nothing is sent.',
    basis:
      'B7-03 `att` (konark: the access-ending row first, then REQ-0040); B7-10 f8; OperationsService.listAccessEnding',
    status: 'provisional',
    decisions: ['T-31', 'PC-68'],
  },
} as const satisfies Readonly<Record<string, StateCopyEntry>>;
