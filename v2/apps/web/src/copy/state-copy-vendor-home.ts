import type { StateCopyEntry } from './state-copy';

/**
 * The state-copy entries of VE-01 Overview and VE-02 My experiments — part of the one register
 * (`state-copy.ts`, VD-12): every state string or rule these screens show that the owner-approved
 * Vendor export (V3 Refined B, design/v3-refined-b/roles/VE-v1 `project/Main.dc.html`) does not
 * draw word for word, or that binds its drawing to the services' facts, with its basis and the
 * decisions it waits on. Decision ids never appear in visible copy.
 */
export const STATE_COPY_VENDOR_HOME = {
  // ---- VE-01 Overview ----
  'VE-01.loading': {
    screen: 'VE-01',
    state:
      'The overview loading (screen readers; skeleton rows in a surface under the studio band)',
    words: 'Loading your overview…',
    rule: 'The studio band keeps the studio’s name (the H1) and today; the counts, “Needs your action” and Recent activity wait for the reads (the overview, the Vendor’s experiments and the assigned courses).',
    basis:
      'VE-v1 `Main.dc.html` list state “loading” (`p.rk-loading-msg` over `div.rk-skel-row`), the formula of VE-02; the export draws no overview loading',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'VE-01.failed': {
    screen: 'VE-01',
    state: 'The overview failed to load (service unavailable; a test fault plan only)',
    words: 'We couldn’t load your overview',
    rule: 'Under the studio band, in a surface: the failed state of VE-02 (the cloud glyph in the error tint, this title, “Nothing has changed. Try again.” and “Try again”, which reads every failed read again). Focus moves to the H1 once the overview is back.',
    basis:
      'VE-v1 `Main.dc.html` VE-02 “could not load” (`div.rk-state[role=alert]`, `L.retry` → `ve-h1`); the export draws no overview failure',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'VE-01.counts': {
    screen: 'VE-01',
    state: 'What the studio band’s four counts count',
    words: null,
    rule: 'Read from the Vendor’s experiments (`listMyExperiments`), classified as VE-02’s tabs classify them: With you = returned (a Content Manager’s return and a Super Admin override included) + drafts the Vendor can still edit; In review = Submitted (a resubmitted revision) + With Academic Reviewer (a re-check included) + With Content Manager; Published; Read-only = drafts whose course is no longer the Vendor’s, shown only when there is one. Drawn once the Vendor has an experiment.',
    basis:
      'VE-v1 `Main.dc.html` `overView` (`figs`: nRet + nDr, nRev, nPub, nRo); HANDOFF §1 VE-01 “four real counts”; contract `listMyExperimentsOutput`',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'VE-01.course-line': {
    screen: 'VE-01',
    state: 'The course line under the studio’s name',
    words: null,
    rule: '“Your course: <code> · <name>” (“Your courses: …, …” for several), from the courses assigned to the Vendor now (the editor’s read, `getEditor` for a new experiment); a withdrawn course is not named. Left out while that read has no answer.',
    basis: 'VE-v1 `Main.dc.html` `overView.courseLine`; contract `editorOutput.assignedCourses`',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'VE-01.attention': {
    screen: 'VE-01',
    state: 'What “Needs your action” lists, in what order, and which item leads',
    words: null,
    rule: 'The service’s facts (`getVendorOverview.attention`): the returned experiment changed last leads, in ivory, with its kind, name, “<role> · <who returned it> · <date>”, the reason in full, what it refers to and the gold “Revise “<name>””; further returned items, then drafts, each changed last first, follow with their action (“Revise “<name>””, “Finish draft”). With nothing returned the first draft’s action is the gold one. A draft whose course is no longer the Vendor’s is not listed (it opens read-only), nor is a Super Admin override (the service has no decision to word). No notification tells the Vendor of a change: this panel, the counts, Recent activity and the record carry it.',
    basis:
      'VE-v1 `Main.dc.html` `overView` (`lead`, `rows`, `btnCls`); contract `vendorAttention` (PC-62); OD-B5-01, OD-B5-12',
    status: 'provisional',
    decisions: ['VD-12', 'OD-B5-01', 'OD-B5-12'],
  },
  'VE-01.finish-draft': {
    screen: 'VE-01',
    state: 'Where “Finish draft” opens the editor, and its step',
    words: null,
    rule: 'At the step the draft last reached (VE-09; the address’s `?step=`), as VE-02’s “Edit draft” does, read from the Vendor’s experiments; “Saved at step <n> of 4” counts that step (Course 1, Formats 2, Preview 3, Check 4).',
    basis:
      'VE-v1 `Main.dc.html` `overView.drItem` (`r.step`), LINK-MAP L12 “VE-09 at the saved step”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'VE-01.saved-not-resubmitted': {
    screen: 'VE-01',
    state:
      'When the lead (and a further returned item) says the changes are saved, not resubmitted',
    words: null,
    rule: 'Only while the experiment is returned and the record was written after its return (its last change is later than the return: only Save changes writes a returned record). The read model cannot say which fields changed, so no list of them is drawn; a Save changes with nothing changed counts too.',
    basis:
      'VE-v1 `Main.dc.html` `overView.retItem` (`pending`), HANDOFF §3; contract `submission.status.since`, `updatedAt`',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'VE-01.recent-activity': {
    screen: 'VE-01',
    state: 'Which entries Recent activity lists',
    words: null,
    rule: 'The five newest history entries the Vendor may see across the Vendor’s experiments (`visibleTo` the Vendor), newest first, in the record’s history words; no new events. The routing entry after a resubmit is left out (the Vendor is never told the next stage), as is the Super Admin’s override entry. Each row opens its record (VE-07); “Today” for the sample clock’s day.',
    basis:
      'VE-v1 `Main.dc.html` `activity(s, 5)`; HANDOFF §4 “recent activity”, §2 “Accepted local route, neutral wording”',
    status: 'provisional',
    decisions: ['VD-12', 'OD-B5-05'],
  },

  // ---- VE-02 My experiments ----
  'VE-02.loading': {
    screen: 'VE-02',
    state: 'The list loading (screen readers; skeleton rows under the tool row)',
    words: 'Loading your experiments…',
    rule: 'The head and the tool row stay (no count, no tabs); a new search or tab keeps the rows on show until its answer arrives, and the count keeps its last settled words.',
    basis: 'VE-v1 `Main.dc.html` VE-02 loading (`div[aria-busy=true] > p.rk-loading-msg`)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'VE-02.failed': {
    screen: 'VE-02',
    state: 'The list failed to load (service unavailable; a test fault plan only)',
    words: 'We couldn’t load your experiments',
    rule: 'Under the tool row: the cloud glyph in the error tint, this title, “Nothing has changed. Try again.” and “Try again”, which reads every failed read again; focus moves to the H1.',
    basis: 'VE-v1 `Main.dc.html` VE-02 could not load (`div.rk-state[role=alert]`, `L.retry`)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'VE-02.status-tabs': {
    screen: 'VE-02',
    state: 'The status tabs, the search and the address',
    words: null,
    rule: 'All, then each status one of the Vendor’s experiments has (and the one chosen), in the export’s order, each with how many experiments it holds under the search and the 7-day filter. The service filters (`listMyExperiments` `status`): Draft takes a read-only draft too, With Academic Reviewer a re-check, Returned a Content Manager’s return, Submitted a resubmission until it moves on. The search (the service’s) matches the name, the SUB id and the course (code or name). The address mirrors the tab (`?status=draft | submitted | with-academic-reviewer | returned | with-content-manager | published`) and the 7-day filter (`?changed=last-7-days`) without a history entry; an address from outside (Back, Overview) is read again; the search stays on the page. “Clear filters” (shown while any is applied) empties the search, chooses All and unticks the filter; focus then moves to the search box.',
    basis:
      'VE-v1 `Main.dc.html` `listView` (`inSt`, `tabs`, `clear` → `ve-q`); R1 choice 3 “Status tabs replace the status dropdown … with the same filter values”; contract `listMyExperimentsInput`',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'VE-02.changed-recently': {
    screen: 'VE-02',
    state: 'What “Changed in the last 7 days” keeps',
    words: null,
    rule: 'Sample rule: a row is kept when its last change — the record’s `updatedAt`, the “Last change” column — is no more than 7 × 24 hours before the sample clock’s “now”. The screens have no clock of their own: “now” is the session’s sign-in instant on the sample clock (a change after it counts). It narrows the service’s answer on the page; the count says how many of all the Vendor’s experiments are shown. The Overview’s “Changed in the last 7 days” opens the list with it ticked.',
    basis:
      'VE-v1 `Main.dc.html` `listView.pre` (`RECENT_FROM`), LINK-MAP L17; OD-B5-13 “Window and what counts as a change are sample choices”',
    status: 'provisional',
    decisions: ['VD-12', 'OD-B5-13'],
  },
  'VE-02.sort': {
    screen: 'VE-02',
    state: 'The visible sort by last change',
    words: null,
    rule: 'Newest change first, as the service answers; the head’s “Last change” (and “Sort: …” below 760 px) turns it to oldest first and back, on the page only.',
    basis: 'VE-v1 `Main.dc.html` `listView` (`desc`, `toggleSort`, `aria-sort`)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'VE-02.status-line': {
    screen: 'VE-02',
    state: 'The dates of the plain line under each status pill',
    words: null,
    rule: 'Submitted on: the submission’s instant (`status.since`); Revision n · submitted on: the last resubmission; By the <role> on: the return; Approved on: the last approval; Live in the catalogue since: the publication; “today” on the sample clock’s day. A Super Admin override shows the pill “Returned” with no line (its Vendor words are not drawn).',
    basis: 'VE-v1 `Main.dc.html` `stSub`; HANDOFF §2 status wording',
    status: 'provisional',
    decisions: ['VD-12', 'OD-B7-09'],
  },
  'VE-02.read-only-line': {
    screen: 'VE-02',
    state: 'The plain line of a draft whose course is no longer the Vendor’s',
    words: 'Course withdrawn · read-only',
    rule: 'The export’s “Course withdrawn on <date> · read-only” without the day: the Vendor’s read does not carry the day the course was withdrawn.',
    basis:
      'VE-v1 `Main.dc.html` `stSub` (`readonly`); HANDOFF §2 “Course withdrawn on <date> · read-only”',
    status: 'provisional',
    decisions: ['VD-12', 'OD-B5-01'],
  },
  'VE-02.row-action': {
    screen: 'VE-02',
    state: 'Where a row’s name and its action go',
    words: null,
    rule: 'The name (and a press anywhere on the row) opens the record (VE-07). The one action: “Revise” (VE-08) for a returned experiment, “Edit draft” (VE-09, at the step it last reached) for a draft; every other row — a read-only draft and a returned experiment whose course is no longer the Vendor’s included — shows the chevron only. Each action is named with the experiment (“Revise Forced Convection”, “Edit the draft of Pin Fin Efficiency”).',
    basis:
      'VE-v1 `Main.dc.html` `listView.rows` (`hasAct`, `actAria`, `vr-chev`); LINK-MAP L22 … L24; OD-B5-01',
    status: 'provisional',
    decisions: ['VD-12', 'OD-B5-01'],
  },
  'VE-02.saved-not-resubmitted': {
    screen: 'VE-02',
    state: 'When a row carries the tag “Changes saved, not resubmitted”',
    words: null,
    rule: 'As the Overview’s lead (`VE-01.saved-not-resubmitted`): a returned experiment written after its return.',
    basis: 'VE-v1 `Main.dc.html` `listView.rows` (`pending`), HANDOFF §3',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'VE-02.course-code': {
    screen: 'VE-02',
    state: 'The course code beside the SUB id',
    words: null,
    rule: 'The course’s platform code as the public catalogue’s course card names it (“SUB-0081 · ME ZG523”); a course with no code there is shown by the SUB id alone. The list’s rows carry the course id only.',
    basis:
      'VE-v1 `Main.dc.html` `span.vr-meta` (“id · course”); contracts `listMyExperimentsOutput`, `courseCard.platformCode`',
    status: 'provisional',
    decisions: ['VD-12'],
  },
} as const satisfies Readonly<Record<string, StateCopyEntry>>;
