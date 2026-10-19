import type { StateCopyEntry } from './state-copy';

/**
 * The state-copy entries of Phase 6’s SA-20 Support, SA-21 Support report and SA-22 Access ending
 * — part of the one register (`state-copy.ts`, VD-12) — in the owner-approved V3 Refined B design
 * (the Super Admin export, design/v3-refined-b/roles/SA-v1, `project/sa-views-d.js` `V.support`,
 * `V.report`, `V.accessEnding`), with SA-07’s access-ending row of “Needs attention” (B7-03 `att`,
 * konark).
 *
 * The export draws the three lists with their loading, failed and empty states, the report in its
 * three states, the Reopen confirmation and a refusal. Its words are in `copy/operations-6.ts`;
 * the state words a screen reads and the rules the screens apply where the export differs from the
 * product or stays silent are here. Refusals keep the repo’s conflict wording (SA-v1 HANDOFF “Use
 * the existing conflict wording”). Internal references and decision ids never appear in visible
 * copy.
 */
export const STATE_COPY_OPERATIONS_6 = {
  // ---- SA-20 Operations › Support (SA-v1 `V.support`) ----
  'SA-20.page-meta': {
    screen: 'SA-20',
    state: 'The line under “Operations” on the three lists',
    words: null,
    rule: 'One line on all three lists, as the export’s `opsHead` draws it: “Device transfers, support reports and access that is ending.” (`@/copy/operations` OPERATIONS_PAGE.lead).',
    basis: 'SA-v1 sa-views-d.js `opsHead` (`p.rk-sub`)',
    status: 'owner-approved',
    decisions: ['SA-v1'],
  },
  'SA-20.show-address': {
    screen: 'SA-20',
    state: 'The Open · Resolved · All view in the address',
    words: null,
    rule: 'The views are the export’s segmented switch (`sa-seg` around `rb-switch`: buttons with `aria-pressed`, each with its count). Open is the list’s own address; Resolved and All add `?show=resolved` / `?show=all`. Choosing one replaces the address (no history entry), and an address from outside (Back) is read again. An address whose `show` names no view is replaced by the list’s own address. Open lists open and reopened reports.',
    basis:
      'SA-v1 sa-views-d.js `V.support` (`SA.seg`, `inTab`); Appendix A register routes (query filters)',
    status: 'owner-approved',
    decisions: ['SA-v1'],
  },
  'SA-20.order': {
    screen: 'SA-20',
    state: 'The order of the reports',
    words: null,
    rule: 'Oldest first, as the line beside the switch says and the service answers (`listSupportReports`, by when each was sent) — in every view. The export orders its sample by the last activity; the service’s order is kept.',
    basis:
      'SA-v1 sa-views-d.js `V.support` (“oldest first”); SA-01 support group (oldest first, PC-67); OperationsService.listSupportReports',
    status: 'provisional',
    decisions: ['VD-12', 'PC-67'],
  },
  'SA-20.report-title': {
    screen: 'SA-20',
    state: 'A report’s title (the list’s Report column and the report’s heading)',
    words: null,
    rule: 'The display-only excerpt of “What happened” the reporter’s own Help shows (XS-07 `reportTitle`): there is no saved title. The export’s sample titles (“VR simulation stopped loading at step 2”) are not copied. The title names the report everywhere the SUP reference used to (the row link, the crumbs, the browser tab).',
    basis:
      'Owner decision P0-31 (12 Oct 2026); SA-v1 sa-views-d.js `V.support`, `V.report` (`s.title`); state-copy `XS-07.report-title`',
    status: 'provisional',
    decisions: ['P0-31'],
  },
  'SA-20.from': {
    screen: 'SA-20',
    state: 'The “From” words (the list and the report)',
    words: null,
    rule: 'The list: the reporter’s name over “<role> · <institution>” (the institution named from the institutions list; none for a reporter without one). The report: “<name> · <role> · <institution>” under What they reported, and “<name>, <role>” in its head.',
    basis: 'SA-v1 sa-views-d.js `V.support` (`s.who`, `s.role`, `s.instName`), `V.report`',
    status: 'owner-approved',
    decisions: ['SA-v1'],
  },
  'SA-20.last-activity': {
    screen: 'SA-20',
    state: 'The “Last activity” column',
    words: null,
    rule: 'The report’s newest history entry and its day: “Sent 30 Sep”, “Resolved 3 Oct”, “Reopened 6 Oct”.',
    basis: 'SA-v1 sa-views-d.js `V.support` (`s.actLabel`)',
    status: 'owner-approved',
    decisions: ['SA-v1'],
  },
  'SA-20.status-tones': {
    screen: 'SA-20',
    state: 'The status pills on the Super Admin’s side',
    words: null,
    rule: 'Open `info` (ring), Resolved `ok` (tick), Reopened `warn` (half disc), as the export draws them (`SUP`). The words are the reporter’s own (Open · Resolved · Reopened — the same on both sides).',
    basis:
      'SA-v1 sa-views-d.js `SUP`; SA-v1 HANDOFF SA-20/21 (“same status words as the reporter side”)',
    status: 'owner-approved',
    decisions: ['SA-v1'],
  },
  'SA-20.loading': {
    screen: 'SA-20',
    state: 'The support reports loading (over skeleton rows)',
    words: 'Loading support reports…',
    basis: 'SA-v1 sa-views-d.js `V.support` (`SA.listState` loading)',
    status: 'owner-approved',
    decisions: ['SA-v1'],
  },
  'SA-20.failed': {
    screen: 'SA-20',
    state: 'The support reports failed to load (service unavailable; a test fault plan only)',
    words: 'We couldn’t load the support reports',
    rule: 'With the shared line “Nothing has changed. Try again.” and “Try again” (`@/copy/sa-shared` SA_FAILED).',
    basis: 'SA-v1 sa-views-d.js `V.support` (`SA.listState` failed)',
    status: 'owner-approved',
    decisions: ['SA-v1'],
  },
  // ---- SA-21 Support report (SA-v1 `V.report`, `SA.DLG.reopen`) ----
  'SA-21.decision-ids': {
    screen: 'SA-21',
    state: 'The panel’s line about response times',
    words: null,
    rule: '“No response-time target is set.” as the export draws it, without a decision id. No response time, target or reminder is shown anywhere.',
    basis:
      'SA-v1 sa-views-d.js `V.report`; SA-v1 HANDOFF SA-20/21 (“Must not exist: response-time targets”)',
    status: 'owner-approved',
    decisions: ['SA-v1'],
  },
  'SA-21.layout': {
    screen: 'SA-21',
    state: 'The report and its panel',
    words: null,
    rule: 'The kit’s detail layout: the report’s sheet and the panel (“Resolve”; “Resolved” once resolved) beside it, sticky from 860 px of page width; below, the panel follows the sheet and “Go to decision” leads to it. The crumbs read Operations › Support › <the report’s title>.',
    basis: 'SA-v1 sa-views-d.js `V.report`; COMPONENT-EXTENSIONS (DetailLayout, DecisionPanel)',
    status: 'owner-approved',
    decisions: ['SA-v1'],
  },
  'SA-21.where': {
    screen: 'SA-21',
    state: 'A report sent with “Where” cleared',
    words: null,
    rule: 'The “Where” row is left out, as the reporter’s own detail does (XS-07), and the list’s “Where” cell is empty; a missing screenshot reads “No screenshot added”. A screenshot is its file name only — nothing is uploaded or shown.',
    basis:
      'SA-v1 sa-views-d.js `V.report` (every sample names a place); `copy/help.ts` reportedFacts',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-21.institution-link': {
    screen: 'SA-21',
    state: '“Open <institution>” under the facts',
    words: null,
    rule: 'Kept from the product (the export draws none): for a reporter who belongs to an institution, a text link under What they reported opens its SA-07 Institution detail; a reporter without one (Content Manager, Academic Reviewer, Vendor, Super Admin) has no link.',
    basis:
      'B7-09 `hasInst` / `instHref` (→ B7-03); the builder brief rule 1 (a product action the export does not draw is kept)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-21.history': {
    screen: 'SA-21',
    state: 'The History lines',
    words: null,
    rule: 'Newest first, each with its day (“3 Oct 2026”): Sent; Resolved with its note in quotation marks; Reopened with “By the reporter.” or “By <name>.”. The newest entry is marked as the latest (the kit’s timeline).',
    basis: 'SA-v1 sa-views-d.js `V.report` (`SA.timeline`), `spResolve`, `SA.DLG.reopen`',
    status: 'owner-approved',
    decisions: ['SA-v1'],
  },
  'SA-21.reopened-by': {
    screen: 'SA-21',
    state: 'The notice on a reopened report, when the Super Admin reopened it',
    words: null,
    rule: 'In the panel, above the note: “Reopened by the reporter” as drawn when the reporter reopened it; “Reopened by <name>” when someone else did (the Super Admin; the reporter has no Reopen control while SUP-04 is open), with “Your earlier note: “…”” — the last resolution’s note — in both. The export draws only the reporter’s case.',
    basis:
      "SA-v1 sa-views-d.js `V.report` (`s.st === 'reopened' && s.note`); board 07 “Rules” (no reporter Reopen, SUP-04)",
    status: 'provisional',
    decisions: ['VD-12', 'SUP-04'],
  },
  'SA-21.flash': {
    screen: 'SA-21',
    state: 'After Resolve or Reopen',
    words: null,
    rule: 'The export’s flash (“Report resolved.” — “<reporter> sees your note on their report.”; “Report reopened.” — “It is back with the open reports.”), an ok notice after the head, shown once the report reads resolved (or open again) and focused. The panel then shows the record’s current state. Cancel on the confirmation returns focus to Reopen.',
    basis:
      "SA-v1 sa-views-d.js `spResolve`, `SA.DLG.reopen` (`SA.setFlash`, `SA.focus('sa-flash')`)",
    status: 'owner-approved',
    decisions: ['SA-v1'],
  },
  'SA-21.loading': {
    screen: 'SA-21',
    state: 'The support report loading (over skeleton rows)',
    words: 'Loading the support report…',
    basis:
      'Board 04 “State grammar” Loading formula, in the kit’s loading rows (`SaRecordGuard`); the export draws no loading record',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-21.failed': {
    screen: 'SA-21',
    state: 'The support report failed to load (service unavailable; a test fault plan only)',
    words: 'We couldn’t load the support report',
    rule: 'With the shared line “Nothing has changed. Try again.” and “Try again” (`SaRecordGuard`).',
    basis:
      'SA-v1 `SA.listState` failed formula (as `SA-20.failed`); the export draws no failed record',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-21.unknown': {
    screen: 'SA-21',
    state: 'A reference the service does not answer (`not-found`, `not-permitted`, `policy-open`)',
    words: null,
    rule: 'The GL-04 message “This page isn’t available” in place (`SaRecordGuard`, `@/copy/sa-shared`), its place named “Not available” — never the address’s reference.',
    basis: 'SA-v1 sa-core.js `SA.resolve` (`nf`); OperationsService.getMyReport',
    status: 'owner-approved',
    decisions: ['SA-v1'],
  },
  'SA-21.stale.title': {
    screen: 'SA-21',
    state: 'Resolve or Reopen refused because the report changed since it was opened',
    words: 'This report changed since you opened it',
    rule: 'Nothing is written; the report is read again, the panel shows its current state under this notice (“Check it again” closes it and moves focus to the page’s heading) and focus moves to the panel’s heading. A typed note stays; the next Resolve sends the revision now shown.',
    basis:
      'Board 08 “conflict” formula; CM-03 `CM-03.stale.title`. The export’s proposal (“This record changed after you opened it”) is not used — SA-v1 HANDOFF open decision 8',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-21.stale.line': {
    screen: 'SA-21',
    state: 'The stale notice’s line',
    words: 'It has been read again. Check it, then decide again.',
    basis: 'Board 08 “conflict” formula (as CM-03.stale.line); SA-v1 HANDOFF open decision 8',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-21.moved-on': {
    screen: 'SA-21',
    state: 'Resolve or Reopen refused because the report moved on (resolved or reopened elsewhere)',
    words: 'This report has moved on. Its current state is shown.',
    rule: 'The confirmation closes, the report is read again and the panel shows what it is now under this notice; focus moves to the panel’s heading.',
    basis:
      'Board 08 “conflict” formula; CM-03 `CM-03.moved-on`. The export draws only the stale refusal',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-21.own-report.title': {
    screen: 'SA-21',
    state: 'Resolve refused: the Super Admin sent this report (nobody resolves their own report)',
    words: 'You sent this report',
    rule: 'The service refuses (`not-permitted`); nothing is written, the note stays, focus moves to the panel’s heading. The screen does not decide it beforehand: Resolve is offered as drawn and the service’s answer is shown, calmly (info).',
    basis:
      'Matrix SUP-03 [P] “nobody resolves their own report”; OperationsService.resolveReport. The export draws none',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-21.own-report.line': {
    screen: 'SA-21',
    state: 'The own-report notice’s line',
    words: 'Nobody resolves a report they sent themselves. Nothing has changed.',
    basis: 'Matrix SUP-03. The export draws none',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-21.reopen-own': {
    screen: 'SA-21',
    state: 'Reopen refused because who may reopen their own report is not decided',
    words: 'Reopening a report you sent isn’t decided yet. Nothing has changed.',
    rule: 'The service answers `policy-open` (SUP-04); the confirmation closes, the report stays resolved, focus moves to the panel’s heading. Nothing is invented for the open question.',
    basis:
      'OperationsService.reopenReport (policy-open SUP-04); board 07 “Rules”. The export draws none',
    status: 'provisional',
    decisions: ['VD-12', 'SUP-04'],
  },
  'SA-21.unavailable.resolve': {
    screen: 'SA-21',
    state: 'Resolve failed for now (service unavailable)',
    words: 'It wasn’t resolved. Nothing was lost — try again.',
    rule: 'Shown in the panel; the typed note stays.',
    basis:
      'Board 08 “failed, try again · Nothing was lost” (as CM-03.unavailable.publish). The export draws none',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-21.unavailable.reopen': {
    screen: 'SA-21',
    state: 'Reopen failed for now (service unavailable)',
    words: 'It wasn’t reopened. Nothing was lost — try again.',
    rule: 'Nothing changes: the confirmation stays open and can be confirmed again; this line shows in its body as a warn notice (an alert), as the export draws a dialog’s notices (`SA.DLG` body), and goes when the confirmation is confirmed again or opened anew.',
    basis:
      'Board 08 “failed, try again · Nothing was lost” (the v46 line); Appendix F §6.6 “command unavailable → nothing changes”; the export draws no failure for its command, its dialogs carry their notices in `rk-dlg-body` (`sa-core.js` `dialogHtml`)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  // ---- SA-22 Operations › Access ending (SA-v1 `V.accessEnding`) ----
  'SA-22.decision-ids': {
    screen: 'SA-22',
    state: 'The note under the list',
    words: null,
    rule: '““Reminder due” is a status only. Nothing is sent from here, and no reminder channel is set. Renewals come in as requests.” as the export draws it, without a decision id.',
    basis:
      'SA-v1 sa-views-d.js `V.accessEnding` (`p.rk-ca-foot`); SA-v1 HANDOFF SA-22 (“Must not exist: sending reminders”)',
    status: 'owner-approved',
    decisions: ['SA-v1'],
  },
  'SA-22.as-of': {
    screen: 'SA-22',
    state: 'The “As of <day>” date of the list',
    words: null,
    rule: 'Read back from the service’s answer: a plan ending in N days was read on its end date less N days, an ended one on its end date plus the days since (calendar days, as the service counts them). With nothing listed the answer carries no date, so the head shows no “As of” line: `listAccessEnding` has no “as of” of its own (reported as a contract gap).',
    basis:
      'SA-v1 sa-views-d.js `V.accessEnding` (“As of … · soonest first”); OperationsService.listAccessEnding (`daysLeft`, `endedDaysAgo`)',
    status: 'provisional',
    decisions: ['VD-12', 'PC-68'],
  },
  'SA-22.days': {
    screen: 'SA-22',
    state: 'The line under the end date for one day',
    words: null,
    rule: '“1 day left” and “Ended 1 day ago”; on the end date itself “0 days left” (the export’s `SA.plural`).',
    basis: "SA-v1 sa-views-d.js `V.accessEnding` (`SA.plural(n, 'day')`); as IA-01.one-day",
    status: 'owner-approved',
    decisions: ['SA-v1'],
  },
  'SA-22.renewal-line': {
    screen: 'SA-22',
    state: 'The line under “Renewal in progress”',
    words: null,
    rule: '“Request” and the renewal request’s status in the Super Admin’s words, in lower case (“Request under review”, “Request information requested”); no line while its status cannot be read. No request reference is shown. The export also draws “Renewal approved — The current term isn’t changed here”; the service’s standing has no such state (an approved renewal awaiting payment stays “Renewal in progress”), so it is not drawn (reported). “Open request” opens it (SA-03); nothing here approves a renewal or recalculates a licence.',
    basis:
      'SA-v1 sa-views-d.js `V.accessEnding` (“Request under review”); B1-10 status words; SA-v1 HANDOFF open decision 2',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'SA-22.read-only': {
    screen: 'SA-22',
    state: 'What a row offers',
    words: null,
    rule: 'The institution’s name opens it; Open request (a renewal in progress only; named “Open the renewal request from <institution>”) and Open institution (“Open <institution>”) — no status action on any row. “Reminder due” is a status: nothing is sent, no reminder channel exists (T-31); ended access comes back only through a renewal request. Ended plans stay listed after the ending ones, the most recently ended first (the service’s order; the export orders its sample by end date). A read-only table: rows are not clickable.',
    basis:
      'SA-v1 sa-views-d.js `V.accessEnding`, LINK-MAP SA-22; SA-v1 HANDOFF SA-22; OperationsService.listAccessEnding (PC-68)',
    status: 'provisional',
    decisions: ['T-31', 'PC-68'],
  },
  'SA-22.loading': {
    screen: 'SA-22',
    state: 'The list loading (over skeleton rows)',
    words: 'Loading access ending…',
    basis: 'SA-v1 sa-views-d.js `V.accessEnding` (`SA.listState` loading)',
    status: 'owner-approved',
    decisions: ['SA-v1'],
  },
  'SA-22.failed': {
    screen: 'SA-22',
    state: 'The list failed to load (service unavailable; a test fault plan only)',
    words: 'We couldn’t load access ending',
    rule: 'With the shared line “Nothing has changed. Try again.” and “Try again” (`@/copy/sa-shared` SA_FAILED).',
    basis: 'SA-v1 sa-views-d.js `V.accessEnding` (`SA.listState` failed)',
    status: 'owner-approved',
    decisions: ['SA-v1'],
  },
  // ---- SA-07 “Needs attention” — access ending (B7-03 `att`, konark) ----
  'SA-07.attention-access-ending': {
    screen: 'SA-07',
    state: 'Access ending with a reminder due, on its plan band',
    words: null,
    rule: 'A plan that ends within 15 days with no renewal requested (“Reminder due” on SA-22) has the band’s note “Ends on <day>” · “Reminder due. Nothing is sent from here.” with “View access ending” → Operations › Access ending (SA-22). A renewal in progress is the note “Its renewal request is under review.” with “Open renewal request” (state-copy SA-07.plan-status); ended access is the ended note. Nothing is sent.',
    basis:
      'SA-v1 `sa-views-b.js` `planBand` (the `ending` notes); OperationsService.listAccessEnding',
    status: 'provisional',
    decisions: ['T-31', 'PC-68'],
  },
} as const satisfies Readonly<Record<string, StateCopyEntry>>;
