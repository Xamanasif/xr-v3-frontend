import type { StateCopyEntry } from './state-copy';

/**
 * The state-copy entries of Phase 5’s CM-01 Overview, CM-02 Ready to publish, CM-04 Content library and CM-09 Course codes (B6-05, B6-06, B6-10) — part of the one register (`state-copy.ts`, VD-12):
 * every state string or rule these screens show that their board does not draw word for word,
 * with its basis and the decisions it waits on. Decision ids never appear in visible copy.
 */
export const STATE_COPY_CM_LISTS = {
  // ---- shared by the four pages ----
  'CM-lists.failed.line': {
    screen: 'CM-01',
    state: 'The failed state’s next step on CM-01, CM-02, CM-04 and CM-09',
    words: 'Nothing has changed. Try again.',
    basis:
      'Board 04 “State grammar” Failed + retry formula (what happened + reassurance + what to do); the Faculty pages’ failed line (B4-02 f5). B6-05, B6-06 and B6-10 draw no failed frame',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'CM-lists.no-course-code': {
    screen: 'CM-02',
    state: 'A row whose course has no platform code yet (CM-01, CM-02, CM-04)',
    words: null,
    rule: 'The code is left out of the row’s line (“SUB-0074 · Northline Simulation Studio”), as the public catalogue shows the course name only for such a course; nothing stands in for it.',
    basis:
      'B6-10 f0 “No code yet — the catalogue shows the course name only.”; B6-05 / B6-06 draw every row with a code',
    status: 'provisional',
    decisions: ['VD-12', 'OD-B6-13'],
  },

  // ---- CM-01 Overview ----
  'CM-01.loading': {
    screen: 'CM-01',
    state: 'The overview loading (screen readers; skeleton rows in the section)',
    words: 'Loading what needs your decision',
    rule: 'The header keeps “Overview” and “Content library”; the status line waits for the read.',
    basis: 'Board 04 “State grammar” Loading formula. B6-05 draws no loading frame',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'CM-01.failed': {
    screen: 'CM-01',
    state: 'The overview failed to load (service unavailable; a test fault plan only)',
    words: 'We couldn’t load your overview',
    basis: 'Board 04 “State grammar” Failed + retry formula. B6-05 draws no failed frame',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'CM-01.reason-excerpt': {
    screen: 'CM-01',
    state: 'A returned update’s reason quoted on its “Needs your decision” row',
    words: null,
    rule: 'The reason’s first sentence without its full stop, then “…” when more follows, in curly quotes (“The proposed description says slip falls as the load rises…”). A one-sentence reason is quoted whole.',
    basis:
      'B6-05 f0 “UPD-0006 · returned by the Academic Reviewer on 26 Aug 2026 · “The proposed description says slip falls as the load rises…””',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'CM-01.awaiting-release.title': {
    screen: 'CM-01',
    state:
      'A correction the Academic Reviewer approved that waits for the Super Admin’s release decision (“With others”)',
    words: '{update} — awaiting release decision',
    rule: '“{update}” is the experiment’s name with the update’s version label (“Distillation Column 1.3”).',
    basis:
      'B6-05 f0 “With others” row formula (“Distillation Column 1.3 — in academic review”); B6-09 f5 “Awaiting release decision”; PC-64 (`update-awaiting-release`)',
    status: 'provisional',
    decisions: ['VD-12', 'OD-B6-14'],
  },
  'CM-01.awaiting-release.sub': {
    screen: 'CM-01',
    state: 'The awaiting-release row’s line',
    words: '{id} · the Academic Reviewer approved it on {date}',
    basis:
      'B6-05 f0 “UPD-0005 · sent on 25 Aug 2026”; B6-11 f10 “Approved by the Academic Reviewer; live v1.2 unchanged until the Super Admin releases it”',
    status: 'provisional',
    decisions: ['VD-12', 'OD-B6-14'],
  },
  'CM-01.row-actions': {
    screen: 'CM-01',
    state: 'Which drawn row actions the overview renders in Phase 5',
    words: null,
    rule: 'Ready items: “Open the next ready item” (the oldest approval, the one primary) and “Open decision” open the publication decision (CM-03). A re-check row’s “Open” opens the same decision page, read-only while the Academic Reviewer has it (B6-07 f3). Correction rows — “Update returned” (“Open update”) and every “With others” update row (“Open”) — are shown with their words and no action: Updates and its steps (CM-08, CM-06, CM-07) are not built yet (built-screen-only navigation).',
    basis:
      'B6-05 f0 rows and links (`D.links.cdec`, `D.links.cupd`); P0-35 / DEV-21 built-screen-only navigation; nav/content-manager.ts (Updates is Phase 6)',
    status: 'provisional',
    decisions: ['VD-12', 'P0-35'],
  },
  'CM-01.calm': {
    screen: 'CM-01',
    state: 'Which sections show',
    words: null,
    rule: 'As B6-05’s script decides: “Needs your decision” while anything is ready to publish or a correction is returned to her; otherwise f1’s “Nothing is waiting for your publication decision” with “Open the Content library”. “With others” shows whenever it has rows, below either. The status line always counts all three.',
    basis: 'B6-05 script (`cmSome`, `cmNothing`, `hasOthers`, `cmLine`); f1 “Nothing waiting”',
    status: 'provisional',
    decisions: ['VD-12'],
  },

  // ---- CM-02 Ready to publish ----
  'CM-02.loading': {
    screen: 'CM-02',
    state: 'The list loading (screen readers; skeleton rows in the section)',
    words: 'Loading the approved experiments',
    basis: 'Board 04 “State grammar” Loading formula. B6-06 draws no loading frame',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'CM-02.failed': {
    screen: 'CM-02',
    state: 'The list failed to load (service unavailable; a test fault plan only)',
    words: 'We couldn’t load the approved experiments',
    basis: 'Board 04 “State grammar” Failed + retry formula. B6-06 draws no failed frame',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'CM-02.blockers': {
    screen: 'CM-02',
    state: 'A row whose publication check is not met (state sample)',
    words: null,
    rule: 'The service’s publication check decides (approval, learning outcomes, catalogue details, delivery details for each format). One condition not met: “1 to resolve: <condition>” (“1 to resolve: learning outcomes”); several: “<n> things to resolve”. “Open decision” stays: the decision page lists them and offers Send back only. The library’s Ready tab adds “ · <n> to resolve” to “Approved …”.',
    basis:
      'B6-06 f2 “1 to resolve: learning outcomes”; B6-06 script `blockWords` (“plural(n, ’thing’) + ’ to resolve’”) and the library’s “ · 1 to resolve”; B6-07 check names',
    status: 'provisional',
    decisions: ['VD-12', 'OD-B6-03'],
  },

  // ---- CM-04 Content library ----
  'CM-04.loading': {
    screen: 'CM-04',
    state: 'The library loading (screen readers; skeleton rows under the tabs)',
    words: 'Loading the library',
    basis: 'Board 04 “State grammar” Loading formula. B6-06 draws no loading frame',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'CM-04.failed': {
    screen: 'CM-04',
    state: 'The library failed to load (service unavailable; a test fault plan only)',
    words: 'We couldn’t load the library',
    basis: 'Board 04 “State grammar” Failed + retry formula. B6-06 draws no failed frame',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'CM-04.where-it-is': {
    screen: 'CM-04',
    state: 'The “Where it is” words of each tab’s rows',
    words: null,
    rule: 'Ready: “Approved <date>” (and “ · <n> to resolve”). In review: a first review “New submission · since <date>”, the re-check she asked for “Re-check you asked for · since <date>”, a resubmission “Revision <n> · with the Academic Reviewer”. With vendor: “Returned by the Academic Reviewer · <date>”, or her own send-back (`CM-04.sent-back`). Published: “Version <label> · live since <date>”, then the open correction’s state (“Update returned to you”, “Update in academic review”, “Update on hold”; undrawn: `CM-04.update-draft`, `CM-04.update-awaiting`). Ready rows open the decision (“Open decision”); In review and With vendor rows open it read-only (“Open”, B6-07 f3); Published rows open the published experiment (CM-05).',
    basis:
      'B6-06 f1, f4 and its script (`libSets`, `D.libReview`, `D.libVendor`, `D.libPub`, `D.links.cdec`, `D.links.cpub`); PC-65',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'CM-04.sent-back': {
    screen: 'CM-04',
    state: 'With vendor: a submission she sent back to the Vendor herself',
    words: 'You sent it back · {date}',
    basis:
      'B6-06 script (the live row’s “You sent it back”) with the dated form of its “Returned by the Academic Reviewer · 24 Aug 2026”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'CM-04.override': {
    screen: 'CM-04',
    state: 'With vendor: a stuck submission the Super Admin returned to the Vendor (SA-13)',
    words: 'Returned to the vendor by the Super Admin · {date}',
    basis:
      'B6-06 “Returned by the Academic Reviewer · 24 Aug 2026” formula; B7-06 status override (“Returned to vendor”)',
    status: 'provisional',
    decisions: ['VD-12', 'OD-B7-09'],
  },
  'CM-04.update-draft': {
    screen: 'CM-04',
    state: 'Published: the experiment’s open correction is still her draft',
    words: 'Update in progress',
    basis:
      'B6-11 f9 “An update is in progress → Open update”; B6-06 f4 tag formula (“Update in academic review”)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'CM-04.update-awaiting': {
    screen: 'CM-04',
    state: 'Published: the open correction waits for the Super Admin’s release decision',
    words: 'Update awaiting release decision',
    basis: 'B6-09 f5 “Awaiting release decision”; B6-06 f4 tag formula',
    status: 'provisional',
    decisions: ['VD-12', 'OD-B6-14'],
  },
  'CM-04.address': {
    screen: 'CM-04',
    state: 'The tab, the search and the order of the rows',
    words: null,
    rule: 'The tab is in the address (`?tab=in-review | with-vendor | published`; Ready has none), replaced without a history entry; an address from outside (Back) is read again. The search stays across tabs (as B6-06’s script keeps it) and is not in the address; the service searches name, ID and course code. Rows come in the service’s order: submissions oldest first, published experiments by their first publication.',
    basis:
      'B6-06 script (`ltab`, `lq`, `lShown`); nav/content-manager.ts `libraryAddress`, `libraryTabOf`',
    status: 'provisional',
    decisions: ['VD-12'],
  },

  // ---- CM-09 Course codes ----
  'CM-09.loading': {
    screen: 'CM-09',
    state: 'The courses loading (screen readers; skeleton rows in the section)',
    words: 'Loading the course codes',
    basis: 'Board 04 “State grammar” Loading formula. B6-10 draws no loading frame',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'CM-09.failed': {
    screen: 'CM-09',
    state: 'The courses failed to load (service unavailable; a test fault plan only)',
    words: 'We couldn’t load the course codes',
    basis: 'Board 04 “State grammar” Failed + retry formula. B6-10 draws no failed frame',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'CM-09.kept': {
    screen: 'CM-09',
    state: 'Codes typed and not saved yet',
    words: null,
    rule: 'Kept in memory for the signed-in session while she moves around the workspace (never in browser storage), and marked “Changed — not saved yet” on each row; a code typed back to its saved value is no longer a change. Save codes sends only the changed rows; nothing changed sends nothing and moves focus to “No unsaved changes”. A save, Undo changes, another session or a reload drops them.',
    basis:
      'B6-10 script (`kcView`: `changed`, `nChanged`, `undo`, `save`); Appendix F §6.6 answers kept',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'CM-09.stale.title': {
    screen: 'CM-09',
    state: 'Save refused because a course changed elsewhere since the page read it',
    words: 'These codes were changed elsewhere',
    rule: 'The courses are read again; every typed code stays; the next save uses the current revisions.',
    basis:
      'Appendix G P1-21 interim (“Refetch and render the current drawn state”); B6-10 draws no conflict',
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
  'CM-09.unavailable.title': {
    screen: 'CM-09',
    state: 'Saving failed for now (service unavailable) or was refused for another reason',
    words: 'Your codes didn’t save',
    basis:
      'Board 04 “State grammar” Failed formula; Appendix F §6.6 “command unavailable → nothing changes … answers kept”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'CM-09.unavailable.line': {
    screen: 'CM-09',
    state: 'The failed save’s next step',
    words: 'Nothing was saved and your codes are still here. Try again.',
    basis: 'Board 04 “State grammar” (what happened + reassurance + what to do)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
} as const satisfies Readonly<Record<string, StateCopyEntry>>;
