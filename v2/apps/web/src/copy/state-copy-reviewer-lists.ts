import type { StateCopyEntry } from './state-copy';

/**
 * The state-copy entries of Phase 5’s RV-01 Overview, RV-02 Review queue and RV-05 Reviewed by me (B6-01, B6-02) — part of the one register (`state-copy.ts`, VD-12):
 * every state string or rule these screens show that their board does not draw word for word,
 * with its basis and the decisions it waits on. Decision ids never appear in visible copy.
 */
export const STATE_COPY_REVIEWER_LISTS = {
  // ---- RV-01 Overview ----
  'RV-01.loading': {
    screen: 'RV-01',
    state: 'The overview loading (screen readers; skeleton rows below the header)',
    words: 'Loading your overview',
    rule: 'The header keeps the reviewer’s name and “Overview”; the counts, the scope line, the actions and the section wait for the read.',
    basis:
      'Board 04 “State grammar” Loading formula; FA-01 and IA-01 “Loading your overview”; B6-02 f2 (the queue’s skeleton rows). B6-01 draws no loading frame',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'RV-01.failed': {
    screen: 'RV-01',
    state: 'The overview failed to load (service unavailable; a test fault plan only)',
    words: 'We couldn’t load your overview',
    rule: 'B6-02 f3’s failed formula in a section: the failed icon in the error tint, this title, “Nothing has changed. Try again.” and a primary “Try again” that reads again; focus moves to the main region once the overview is back.',
    basis:
      'B6-02 f3 “We couldn’t load the review queue”; FA-01 “We couldn’t load your overview”. B6-01 draws no failed frame',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'RV-01.oldest': {
    screen: 'RV-01',
    state: 'Which item “Review the oldest — <name>” opens',
    words: null,
    rule: 'The queue’s first item — the queue is oldest first — whatever its kind: a new submission or a re-check opens its review (RV-03), an update opens Review an update (RV-04, Phase 6).',
    basis:
      'B6-01 f0 script `oldest` (“Review the oldest — ” + `qAll[0].name`, `oldHref = att[0].href`: `rrev` or `rupd`)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'RV-01.update-row': {
    screen: 'RV-01',
    state: 'An update (a Content Manager correction) waiting for the reviewer',
    words: null,
    rule: 'Drawn as B6-01 f0 draws it — the refresh icon in the wait tint, “Update: <experiment>” and “Correction to the live version <v> → <v> · from <who> · <date>” — with its “Review update” (named “Review update <experiment>”), which opens Review an update (RV-04, Phase 6). It counts in “<n> update(s)” and in the section’s count.',
    basis: 'B6-01 f0 row “Update: Distillation Column” · “Review update” (`D.links.rupd`)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'RV-01.scope-all': {
    screen: 'RV-01',
    state: 'A reviewer whose scope is every course (not drawn for a reviewer)',
    words: null,
    rule: 'The scope line names the scope’s courses in the service’s order; a scope over everything names no course, so the line is left out.',
    basis:
      'B6-01 f0 “You review: ME ZG523 · MEL ZG512 · CHE ZG513” (the OD-B6-01 sample scope); contract `reviewerOverviewOutput.scopeAll`',
    status: 'provisional',
    decisions: ['OD-B6-01'],
  },
  'RV-01.recheck-reason': {
    screen: 'RV-01',
    state: 'A re-check row whose send-back carries no reason',
    words: null,
    rule: '“Content Manager · <date>”: the quoted reason and its separator are left out (a send-back to the reviewer always has a reason in the service).',
    basis:
      'B6-01 f0 “Content Manager · 25 Aug 2026 · “The second learning outcome mentions a Pitot tube …””',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  // ---- RV-02 Review queue ----
  'RV-02.filters': {
    screen: 'RV-02',
    state: 'The toolbar’s search, Type and Course, and the address',
    words: null,
    rule: 'As B6-02’s script filters (`qFields`): the search matches the name, the ID, the course code or the vendor (the “who” line), ignoring case; Type is All types · New submission · Update · Re-check; Course is All courses, then the reviewer’s scope courses by code (the overview read’s scope line), then any other course code a queued item carries. The count is “<shown> of <all> items · oldest first” and “Clear filters” shows while one is applied. Type is mirrored in the address (`?type=`, no history entry) and read again from it; the course and the search stay on the page: the queue’s items name their course by code only, so `?courseId=` is not used.',
    basis:
      'B6-02 f0 toolbar and script `qFields` (`qq`, `qt`, `qc`, `qCount`, `qFiltered`); OD-B6-01 sample scope; `nav/reviewer.ts` `reviewQueueAddress`',
    status: 'provisional',
    decisions: ['VD-12', 'OD-B6-01'],
  },
  'RV-02.update-row': {
    screen: 'RV-02',
    state: 'An update (a Content Manager correction) in the queue',
    words: null,
    rule: 'Drawn as B6-02 f0 draws it — “Update” tag, “UPD-0005 · <code> · <who>” and “Correction to the live version <v> → <v>” — with its primary “Review” (named “Review <experiment>”), which opens Review an update (RV-04, Phase 6).',
    basis: 'B6-02 f0 row “Distillation Column” (UPD-0005) · “Review” (`D.links.rupd`)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'RV-02.no-course-code': {
    screen: 'RV-02',
    state: 'A queued item (or a decided one, RV-05) whose course has no platform code',
    words: null,
    rule: 'The line names the ID and the vendor only (the code and its separator are left out); such an item is listed under All courses only.',
    basis: 'B6-02 f0, f1 “SUB-0086 · CHE ZG513 · Meridian Virtual Labs” (always with a code)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  // ---- RV-05 Reviewed by me ----
  'RV-05.loading': {
    screen: 'RV-05',
    state: 'Reviewed by me loading (screen readers; skeleton rows in the section)',
    words: 'Loading your decisions',
    rule: 'The header and “Your decisions” stay; the toolbar waits for the read.',
    basis:
      'B6-02 f2 “Loading the review queue” (the same section’s loading); board 04 “State grammar”. B6-02 draws no RV-05 loading',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'RV-05.failed': {
    screen: 'RV-05',
    state: 'Reviewed by me failed to load (service unavailable; a test fault plan only)',
    words: 'We couldn’t load your decisions',
    rule: 'B6-02 f3’s failed formula in the section body: the failed icon in the error tint, this title, “Nothing has changed. Try again.” and a primary “Try again” that reads again; focus moves to “Your decisions” once the list is back.',
    basis: 'B6-02 f3 “We couldn’t load the review queue”. B6-02 draws no RV-05 failure',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'RV-05.approved': {
    screen: 'RV-05',
    state:
      'An approval whose record is now somewhere B6-02 f1 draws no line for (e.g. the Content Manager sent it back to the vendor)',
    words: 'Approved',
    rule: 'The decision alone, in the ok tone with the done icon; nothing is said about where it is now.',
    basis:
      'B6-02 f1 “Approved — with the Content Manager”, “Approved — published”, “Approved — later sent back for a re-check”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'RV-05.update-approved': {
    screen: 'RV-05',
    state: 'An approved update in a state B6-02 f1 draws no line for (e.g. withdrawn)',
    words: 'Update approved',
    rule: 'The decision alone, in the ok tone with the done icon.',
    basis: 'B6-02 f1 “Update approved — with the Super Admin”, “Update approved — released”',
    status: 'provisional',
    decisions: ['VD-12', 'OD-B6-06'],
  },
  'RV-05.update-row': {
    screen: 'RV-05',
    state: 'A decided update (a correction the reviewer approved or returned)',
    words: null,
    rule: 'Drawn as B6-02 f1 draws it — “Update”, the decision and its date — with its “Open” (named “Open <experiment>”), which opens Review an update (RV-04) in its decided, read-only state (Phase 6).',
    basis: 'B6-02 f1 rows UPD-0006, UPD-0004, UPD-0003 · “Open” (`D.links.rupd`)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'RV-05.type': {
    screen: 'RV-05',
    state: 'A decision made on a re-check (the service’s type `recheck`)',
    words: null,
    rule: 'As B6-02’s script words it (`typeWord`, `rbf`): anything that is not an update reads “New submission” and is listed under New submissions. Each record is listed once, with the reviewer’s last decision on it.',
    basis: 'B6-02 f1 script `rbRows` (`typeWord`), `rbShown`; contract `reviewedByMeOutput`',
    status: 'provisional',
    decisions: ['VD-12'],
  },
} as const satisfies Readonly<Record<string, StateCopyEntry>>;
