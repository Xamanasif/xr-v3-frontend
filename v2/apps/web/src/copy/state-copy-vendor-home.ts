import type { StateCopyEntry } from './state-copy';

/**
 * The state-copy entries of Phase 5’s VE-01 Overview and VE-02 My experiments (B5-01, B5-02) — part of the one register (`state-copy.ts`, VD-12):
 * every state string or rule these screens show that their board does not draw word for word,
 * with its basis and the decisions it waits on. Decision ids never appear in visible copy.
 */
export const STATE_COPY_VENDOR_HOME = {
  // ---- VE-01 Overview ----
  'VE-01.loading': {
    screen: 'VE-01',
    state: 'The overview loading (screen readers; skeleton rows below the header)',
    words: 'Loading your overview',
    rule: 'The header keeps its overline, “Overview” and “Create experiment”; the status line and the attention section wait for the read.',
    basis:
      'Board 04 “State grammar” Loading formula; B6-02 “Loading the review queue” (the Phase-5 boards’ loading); FA-01 / IA-01 “Loading your overview”. B5-01 draws no loading frame',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'VE-01.failed': {
    screen: 'VE-01',
    state: 'The overview failed to load (service unavailable; a test fault plan only)',
    words: 'We couldn’t load your overview',
    rule: 'B6-02’s failed formula: the empty pattern with the failed icon in the error tint, this title, “Nothing has changed. Try again.” and a primary “Try again” that reads again. Focus moves to the main region once the overview is back. “See all your experiments” stays.',
    basis:
      'B6-02 “We couldn’t load the review queue” (the Phase-5 boards’ failed formula); FA-01 / IA-01 “We couldn’t load your overview”. B5-01 draws no failed frame',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'VE-01.status-line': {
    screen: 'VE-01',
    state: 'What the status line counts',
    words: null,
    rule: 'The service’s four counts, in B5-01’s order and words: Draft (a read-only draft included), With Academic Reviewer, With Content Manager, Published. Returned experiments are not counted there: “Needs your action” carries them. The line is drawn once the Vendor has an experiment (f2 draws none). A resubmission the Vendor reads as “Submitted” is in none of the four counts, as B5-01’s script leaves it out: counting it would name the next gate.',
    basis:
      'B5-01 script `o.statusLine` (draft + read-only, with_rv + recheck, with_cm, published); contract `vendorOverviewOutput.statusCounts` (PC-62)',
    status: 'provisional',
    decisions: ['VD-12', 'OD-B5-05'],
  },
  'VE-01.attention': {
    screen: 'VE-01',
    state: 'Which rows “Needs your action” lists, in what order, and which action is primary',
    words: null,
    rule: 'The service’s facts in its order: each returned experiment (oldest decision first, “Returned: <name>” · “<Academic Reviewer | Content Manager> · <date> · “<reason>”” · “Revise “<name>””), then each draft (oldest save first, “Draft to finish: <name>” · “Last saved <date> · only you can see it” · “Finish draft”). The first row’s action is the primary, the others secondary. A draft whose course is no longer one of the Vendor’s is not listed: it opens read-only, there is nothing to finish. No notification tells the Vendor of a change: this list and the record carry it.',
    basis:
      'B5-01 script `att` (`a.primary = i === 0`) and f0, f3; B5-08 f1; contract `vendorAttention` (PC-62); OD-B5-01, OD-B5-12',
    status: 'provisional',
    decisions: ['VD-12', 'OD-B5-01', 'OD-B5-12'],
  },
  'VE-01.finish-draft': {
    screen: 'VE-01',
    state: 'Where “Finish draft” opens the editor',
    words: null,
    rule: 'At the step the draft last reached (VE-09; the address’s `?step=`), as VE-02’s “Edit draft” does; read from the Vendor’s list of experiments, and the first step while that read has not answered.',
    basis: 'B5-01 script (`href: D.links.rev`, no step drawn); B5-02 “Edit draft”',
    status: 'provisional',
    decisions: ['VD-12'],
  },

  // ---- VE-02 My experiments ----
  'VE-02.loading': {
    screen: 'VE-02',
    state: 'The list loading (screen readers; skeleton rows in the section)',
    words: 'Loading your experiments',
    rule: 'The header keeps its overline, “My experiments”, its line and “Create experiment”; the section “All your experiments” shows skeleton rows in the table’s shape until the list (and the course codes) answer. A new search or filter keeps the rows on show until its answer arrives; the count keeps its last settled words.',
    basis:
      'B6-02 “Loading the review queue” (the Phase-5 boards’ loading); B4-02 f4 “Loading your experiments”. B5-02 draws no loading frame',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'VE-02.failed': {
    screen: 'VE-02',
    state: 'The list failed to load (service unavailable; a test fault plan only)',
    words: 'We couldn’t load your experiments',
    rule: 'In the section body, B6-02’s failed formula: the failed icon in the error tint, this title, “Nothing has changed. Try again.” and a primary “Try again” that reads again; focus moves to the main region once the list is back.',
    basis:
      'B6-02 “We couldn’t load the review queue”; B4-02 f5 “We couldn’t load your experiments”. B5-02 draws no failed frame',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'VE-02.changed-recently': {
    screen: 'VE-02',
    state: 'What “Changed in the last 7 days” keeps',
    words: null,
    rule: 'Sample rule: a row is kept when its last change — the record’s `updatedAt`, the date under its status — is no more than 7 × 24 hours before the sample clock’s “now”. The screens have no clock of their own: “now” is the session’s sign-in instant on the sample clock (a change after it counts). It narrows the service’s answer for the search and the Status filter on the page; the count says how many of all the Vendor’s experiments are shown. Not in the address.',
    basis:
      'B5-02 caption “tick “Changed in the last 7 days””, script `recentIds` (SUB-0077, SUB-0081, SUB-0079 against “now” 27 Aug 2026); doc “the merged history filter, VE-13”; OD-B5-13 “Window and what counts as a change are sample choices”',
    status: 'provisional',
    decisions: ['VD-12', 'OD-B5-13'],
  },
  'VE-02.status-filter': {
    screen: 'VE-02',
    state: 'The Status filter, the search and the address',
    words: null,
    rule: 'The service filters and searches: Draft takes a read-only draft too; With Academic Reviewer takes a re-check; Returned takes a Content Manager’s return; Submitted is a resubmission until it moves on. The search matches the name, the SUB id and the course (code or name). The address mirrors the Status filter (`?status=draft | submitted | with-academic-reviewer | returned | with-content-manager | published`) without a history entry, and an address from outside (Back, B5-02 f1) is read again; the search and the checkbox live on the page. “Clear filters” (shown while any is applied) empties the search, sets “All statuses” and unticks the checkbox; focus then moves to the search box if it was lost.',
    basis:
      'B5-02 script (`s.fst`, `recheck`, `returned_cm`, `readonly`; `o.hasFilter`, `o.clear`); `nav/vendor.ts` `myExperimentsAddress`; contract `listMyExperimentsInput`',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'VE-02.row-action': {
    screen: 'VE-02',
    state: 'Where a row’s name and its action go',
    words: null,
    rule: 'The name opens the record (VE-07) for every row. The action: “Revise” (the row’s primary) for a returned experiment (VE-08); “Edit draft” for a draft, at the step it last reached (VE-09); “Open” (the record) for everything else — a read-only draft (its course is no longer the Vendor’s) and a returned experiment whose course is no longer the Vendor’s included, which open read-only. Each action is named with the experiment (“Revise Forced Convection”).',
    basis:
      'B5-02 script `r.act`, `r.aria`, `r.href` (records → B5-06, returned and draft → the editor), caption “Returned and draft rows open the editor; the rest open the record”; OD-B5-01',
    status: 'provisional',
    decisions: ['VD-12', 'OD-B5-01'],
  },
  'VE-02.course-code': {
    screen: 'VE-02',
    state: 'The course code beside the SUB id',
    words: null,
    rule: 'The course’s platform code as the public catalogue’s course card names it (“SUB-0081 · ME ZG523”); a course with no code there is shown by its id alone (the SUB id, then nothing). The list’s rows carry the course id only.',
    basis:
      'B5-02 f0 “SUB-0077 · ME ZG523”; contracts `listMyExperimentsOutput`, `courseCard.platformCode`',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'VE-02.override-return': {
    screen: 'VE-02',
    state: 'A record the Super Admin returned to the Vendor (status override)',
    words: null,
    rule: 'Its status chip reads “Returned” (B5-02’s word for the returned state, in the error tone) and its action “Revise”; no Vendor-side words for the override are drawn, and the overview lists no attention row for it (the service has no return decision to word).',
    basis: 'B7-06 (the override, Vendor-side words not drawn); B5-02 `stw.returned`',
    status: 'provisional',
    decisions: ['VD-12', 'OD-B7-09'],
  },
} as const satisfies Readonly<Record<string, StateCopyEntry>>;
