import type { StateCopyEntry } from './state-copy';

/**
 * The state-copy entries of the Content Manager's lists — CM-01 Overview, CM-02 Ready to publish,
 * CM-04 Content library and CM-09 Platform course codes — in the V3 Refined B design (the
 * owner-approved export design/v3-refined-b/roles/CM-v1), part of the one register (`state-copy.ts`,
 * VD-12): every state string or rule these screens show that the export does not draw word for
 * word, with its basis and the decisions it waits on. What the export draws is in `cm-lists.ts`.
 * Decision ids never appear in visible copy.
 */
export const STATE_COPY_CM_LISTS = {
  // ---- shared by the four pages ----
  'CM-lists.no-course-code': {
    screen: 'CM-02',
    state: 'A row or band whose course has no platform code yet (CM-01, CM-02, CM-04)',
    words: null,
    rule: 'The code chip is left out and the course name stands alone (“SUB-0074 · Northline Simulation Studio”, a course band with its name only), as the public catalogue shows the course name only for such a course; nothing stands in for it.',
    basis:
      'CM-v1 Main.dc.html `hasCode` on every code chip; CM-09 “No code yet — the catalogue shows the course name only.”',
    status: 'provisional',
    decisions: ['VD-12', 'OD-B6-13'],
  },

  // ---- CM-01 Overview ----
  'CM-01.loading': {
    screen: 'CM-01',
    state: 'The overview loading (the kit’s loading line over skeleton rows, under the page head)',
    words: 'Loading what needs your decision',
    rule: 'The head keeps “Overview” and its line; the pipeline, the desk and the side cards wait for the reads.',
    basis:
      'CM-v1 HANDOFF §4 (“CM-01 … integrate them with the application’s existing page loading and keep the shell in place”); the export draws no loading state for CM-01',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'CM-01.failed': {
    screen: 'CM-01',
    state: 'The overview failed to load (service unavailable; a test fault plan only)',
    words: 'We couldn’t load your overview',
    rule: 'The kit’s failed state with “Nothing has changed. Try again.” and Try again, which reads again and moves focus to the page title.',
    basis: 'CM-v1 HANDOFF §4; the export draws no failed state for CM-01',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'CM-01.counts': {
    screen: 'CM-01',
    state: 'What the pipeline, the desk, “With others” and “In the catalogue” are read from',
    words: null,
    rule: 'Only from existing reads: the first-publication stages from the library’s counts (with the vendor, in review, ready, published) and the oldest approval; the correction stages from her updates (draft or returned; in academic review; awaiting release or on hold, with the holds named; released). The desk lists the overview’s ready items (each with its publication check and formats from Ready to publish) and the corrections with her — returned ones with the Academic Reviewer’s words, and her unsent drafts — oldest first. “With others” lists the re-checks, the corrections in academic review, awaiting release or on hold, and the submissions she sent back to their vendor, oldest first. “In the catalogue” counts each course’s published experiments.',
    basis: 'CM-v1 Main.dc.html `ovVM`; HANDOFF §5 (“eight counts, each computed from the records”)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'CM-01.row-actions': {
    screen: 'CM-01',
    state: 'Where the overview’s actions go',
    words: null,
    rule: 'A pipeline stage opens the list that holds its items (the library on its view, Ready to publish, Updates). A ready item’s “Open decision” opens its publication decision (CM-03); a correction’s “Continue” and every “With others” correction’s “Open” open that correction’s page (CM-08); a re-check’s or a sent-back submission’s “Open” opens its decision page, read-only. A course in the catalogue opens the library’s Published view filtered to that course.',
    basis: 'CM-v1 LINK-MAP (CM-01 Overview); Main.dc.html `ovVM`',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'CM-01.calm': {
    screen: 'CM-01',
    state: 'Which sections show',
    words: null,
    rule: 'The pipeline always. “Needs your decision” while anything is ready to publish or a correction is with her (returned or an unsent draft); otherwise the calm “Nothing is waiting for your decision” with “Open the Content library”. A group of the desk with no rows is left out. “With others” and “In the catalogue” always, each saying when it has nothing.',
    basis:
      'CM-v1 Main.dc.html `ovVM` (`some`, `calm`, `hasReady`, `hasCorr`, `noOthers`, `hasCat`)',
    status: 'provisional',
    decisions: ['VD-12'],
  },

  // ---- CM-02 Ready to publish ----
  'CM-02.order': {
    screen: 'CM-02',
    state: 'The order of the decision cards',
    words: null,
    rule: 'Oldest approval first; the sort button turns it to newest first and back (in the page, not in the address). The longest wait stays marked “Waiting longest” and keeps the gold Open decision either way.',
    basis: 'CM-v1 Main.dc.html `readyVM` (`readyNewest`, `first`)',
    status: 'provisional',
    decisions: ['VD-12'],
  },

  // ---- CM-04 Content library ----
  'CM-04.address': {
    screen: 'CM-04',
    state: 'The view, the course filter, the search and the order of the rows',
    words: null,
    rule: 'The view and the course filter are in the address (`?tab=in-review | with-vendor | published`, Ready has none; `&course=<id>`), replaced without a history entry; an address from outside (Back, a course in the Overview’s catalogue) is read again. The course filter narrows the rows on the page. The search stays across views and is not in the address; it is the service’s (the library read with the typed words), which matches the experiment’s name, its ID and its course’s platform code — not the vendor or the course’s name (see `CM-04.search.placeholder`). Rows are grouped by course in the catalogue’s order of courses, each course keeping the service’s order.',
    basis:
      'CM-v1 Main.dc.html `libVM` (`ui.lib.tab`, `ui.lib.q`, `ui.lib.course`, `groups`); the search: ProductionService.getLibrary `search` (name, ID or course code), as before the V3 migration (lead decision)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'CM-04.search.placeholder': {
    screen: 'CM-04',
    state: 'The search field’s placeholder',
    words: 'Experiment, ID or course',
    basis:
      'Deviation from CM-v1 Main.dc.html (“Experiment, ID, course or vendor”): the export’s words without “vendor”, because the search is the service’s (ProductionService.getLibrary: name, ID or course code), which does not match vendors (lead decision)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'CM-04.search.no-match': {
    screen: 'CM-04',
    state:
      'No row matches the search or the course filter: the line under “Nothing in <view> matches”',
    words:
      'Try fewer filters, another view or a different spelling of the experiment, ID or course.',
    basis:
      'Deviation from CM-v1 Main.dc.html (“… a different spelling of the experiment, ID, course or vendor.”): the export’s words without “vendor”, as the placeholder (`CM-04.search.placeholder`)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'CM-04.override': {
    screen: 'CM-04',
    state: 'With vendor: a stuck submission the Super Admin returned to the Vendor (SA-13)',
    words: 'Returned to the vendor by the Super Admin',
    basis:
      'CM-v1 Main.dc.html library row tags (“Returned by the Academic Reviewer”, “You sent it back”); B7-06 status override (“Returned to vendor”)',
    status: 'provisional',
    decisions: ['VD-12', 'OD-B7-09'],
  },
  'CM-04.resubmitted': {
    screen: 'CM-04',
    state: 'In review: a revision the vendor resubmitted',
    words: null,
    rule: 'No line under its status: “Revision <n>” under the vendor already says it.',
    basis:
      'CM-v1 Main.dc.html `libVM` (`c3s: ’Revision ’ + x.rev`; the sample world has no resubmission in review)',
    status: 'provisional',
    decisions: ['VD-12'],
  },

  // ---- CM-09 Course codes ----
  'CM-09.kept': {
    screen: 'CM-09',
    state: 'Codes typed and not saved yet',
    words: null,
    rule: 'Kept in memory for the signed-in session while she moves around the workspace (never in browser storage), and marked “Changed — not saved yet” on each row; a code typed back to its saved value is no longer a change. Save codes sends only the changed rows; nothing changed sends nothing. A save, Undo changes, another session or a reload drops them.',
    basis:
      'CM-v1 Main.dc.html `codesVM` (`changed`, `nCh`, `undo`, `save`); Appendix F §6.6 answers kept',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'CM-09.stale.title': {
    screen: 'CM-09',
    state: 'Save refused because a course changed elsewhere since the page read it',
    words: 'These codes were changed elsewhere',
    rule: 'Drawn as the export’s save failure; the courses are read again; every typed code stays; the next save uses the current revisions.',
    basis:
      'Appendix G P1-21 interim (“Refetch and render the current drawn state”); CM-v1 draws no conflict on CM-09',
    status: 'provisional',
    decisions: ['VD-12', 'P1-21'],
  },
  'CM-09.stale.line': {
    screen: 'CM-09',
    state: 'The stale save’s next step',
    words: 'Nothing was saved and your codes are still here. Check them and save again.',
    basis: 'Board 04 “State grammar” (what happened + reassurance + what to do)',
    status: 'provisional',
    decisions: ['VD-12', 'P1-21'],
  },
  'CM-09.policy-open.title': {
    screen: 'CM-09',
    state:
      'Save refused because what a Content Manager with a limited scope may change is undecided',
    words: 'These codes can’t be saved yet',
    rule: 'Drawn as the export’s save failure, without Try again.',
    basis: 'The service answers the open decision (CC-06); board 04 “State grammar”',
    status: 'provisional',
    decisions: ['VD-12', 'CC-06'],
  },
  'CM-09.policy-open.line': {
    screen: 'CM-09',
    state: 'The policy-open refusal’s line',
    words:
      'Whether you can change platform codes for these courses hasn’t been decided yet. Nothing was saved.',
    basis: 'Board 04 “State grammar”; every code typed stays',
    status: 'provisional',
    decisions: ['VD-12', 'CC-06'],
  },
} as const satisfies Readonly<Record<string, StateCopyEntry>>;
