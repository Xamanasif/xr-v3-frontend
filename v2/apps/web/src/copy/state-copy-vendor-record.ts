import type { StateCopyEntry } from './state-copy';

/**
 * The state-copy entries of Phase 5’s VE-07 Experiment record and VE-13 History (B5-06) — part of the one register (`state-copy.ts`, VD-12):
 * every state string or rule these screens show that their board does not draw word for word,
 * with its basis and the decisions it waits on. Decision ids never appear in visible copy.
 */
export const STATE_COPY_VENDOR_RECORD = {
  // ---- VE-07 Experiment record ----
  'VE-07.loading': {
    screen: 'VE-07',
    state: 'The record loading (screen readers; a skeleton in the section)',
    words: 'Loading the experiment record',
    rule: 'The back link “My experiments” and the top bar stay; the header, banner and sections wait for the read.',
    basis:
      'Board 04 “State grammar” Loading formula; B5-02 / B4-02 f4 “Loading your experiments”. B5-06 draws no loading frame',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'VE-07.failed': {
    screen: 'VE-07',
    state: 'The record failed to load (service unavailable; a test fault plan only)',
    words: 'We couldn’t load the experiment record',
    rule: 'The failed formula in a section under the back link: the failed icon in the error tint, this title, the line `VE-07.failed.line` and a primary “Try again” (`VE-07.try-again`) that reads again.',
    basis:
      'B2-11 f10 / B4-02 f5 failed pattern (“We couldn’t load …” / “Nothing has changed. Try again.”). B5-06 draws no failed frame',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'VE-07.failed.line': {
    screen: 'VE-07',
    state: 'The failed state’s line',
    words: 'Nothing has changed. Try again.',
    basis: 'B2-11 f10 failed pattern (the Faculty and Institute Admin screens’ line)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'VE-07.try-again': {
    screen: 'VE-07',
    state: 'The failed state’s action',
    words: 'Try again',
    basis: 'Board 04 “State grammar” Failed + retry; B2-11 f10 “Try again”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'VE-07.not-found.title': {
    screen: 'VE-07',
    state:
      'An address naming no experiment the Vendor may open (unknown id, or another vendor’s record: not found / not permitted)',
    words: 'We can’t find that experiment',
    rule: 'A calm state under the back link “My experiments” and the heading “Experiment record”: the info icon, this title and `VE-07.not-found.line`. Whether the record exists is not said.',
    basis:
      'B6-12 f6 “We can’t find that experiment” (the public page before publication); board 04 Not-found formula. B5-06 draws no such frame',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'VE-07.not-found.line': {
    screen: 'VE-07',
    state: 'The not-found state’s line',
    words:
      'It isn’t one of your experiments, or the address is wrong. Your experiments are in My experiments.',
    basis:
      'Board 04 Not-found formula (what happened · what you can do); B5-02 “Every experiment you created”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'VE-07.policy-open.title': {
    screen: 'VE-07',
    state: 'A colleague’s record of the same organisation (the service answers policy-open SUB-15)',
    words: 'This experiment was created by a colleague',
    rule: 'The calm state of `VE-07.not-found.title` with this title and `VE-07.policy-open.line`; nothing of the record is shown.',
    basis:
      'Matrix SUB-15 UNRESOLVED (may a Vendor read a colleague’s submission?); board 04 calm-state formula. No board draws it',
    status: 'provisional',
    decisions: ['VD-12', 'SUB-15'],
  },
  'VE-07.policy-open.line': {
    screen: 'VE-07',
    state: 'The colleague state’s line',
    words:
      'Opening a colleague’s experiment isn’t settled yet. Your own experiments are in My experiments.',
    basis: 'Matrix SUB-15 UNRESOLVED; board 04 calm-state formula',
    status: 'provisional',
    decisions: ['VD-12', 'SUB-15'],
  },
  'VE-07.course-words': {
    screen: 'VE-07',
    state:
      'The overline and Details › Course when the course has no platform code, or none is chosen',
    words: null,
    rule: 'The overline names the course by its platform code; a course without one by its name; none chosen “—” (script `recMeta`). Details › Course reads “<code> · <name>”, the name alone without a code, “Not chosen yet” without a course (script `cCourse`). The names are the catalogue’s, else the Vendor’s assigned courses’.',
    basis: 'B5-06 script `recMeta`, `cCourse`; T-17 (a blank platform code drops the chip)',
    status: 'provisional',
    decisions: ['VD-12', 'T-17'],
  },
  'VE-07.preview-link-only': {
    screen: 'VE-07',
    state: 'Details › Preview with a link and no label',
    words: null,
    rule: 'The link alone (the board’s script shows “None” without a label, but a link without a label is allowed); a label without a link shows the label.',
    basis: 'OD-B5-08 “A link without a label is allowed in the prototype”; B5-06 script `cPreview`',
    status: 'provisional',
    decisions: ['VD-12', 'OD-B5-08'],
  },
  'VE-07.course-withdrawn.line': {
    screen: 'VE-07',
    state: 'A draft whose course is no longer assigned to the Vendor (read-only, f9)',
    words:
      'Withdrawn from {organisation}. This draft is kept, read-only. BITS / WILP decides which courses are yours.',
    rule: 'The warn banner titled “<code> is no longer assigned to you” and the chip “Draft · read-only”, as f9 draws them, without “on <day>”: the record’s read does not carry the day the course was withdrawn. No “Edit draft”. The history has no “Course withdrawn …” entry for the same reason.',
    basis:
      'B5-06 f9 “Withdrawn from Northline Simulation Studio on 15 Aug 2026. This draft is kept, read-only. BITS / WILP decides which courses are yours.”',
    status: 'provisional',
    decisions: ['VD-12', 'OD-B5-01'],
  },
  'VE-07.course-withdrawn.returned': {
    screen: 'VE-07',
    state: 'A returned record whose course is no longer assigned to the Vendor',
    words:
      'Withdrawn from {organisation}. It is kept, read-only. BITS / WILP decides which courses are yours.',
    rule: 'The chip “Returned”, the returned reason and what it refers to, then the warn banner “<code> is no longer assigned to you” with this line in place of “Revise & resubmit” (a saved experiment in a withdrawn course opens read-only).',
    basis:
      'B5-06 f9 (drawn for a draft only); OD-B5-01 “a saved experiment in that course opens read-only”',
    status: 'provisional',
    decisions: ['VD-12', 'OD-B5-01'],
  },
  'VE-07.returned-by-override': {
    screen: 'VE-07',
    state: 'A record the Super Admin moved back to the Vendor (status override of a stuck record)',
    words: null,
    rule: 'The chip “Returned” and “Revise & resubmit”, with no reason block: what the Vendor reads after an override is not drawn, and the override’s reason is the Super Admin’s only. The history shows nothing of it.',
    basis:
      'B7-06 (the Vendor-side view of an override is not drawn; Appendix D §4.6 “Vendor wording UNRESOLVED”); SUB-38',
    status: 'provisional',
    decisions: ['VD-12', 'OD-B7-09'],
  },
  'VE-07.no-other-actions': {
    screen: 'VE-07',
    state: 'Every state but Draft and Returned',
    words: null,
    rule: 'No action but the back link: nothing is the Vendor’s to do while it is with the Academic Reviewer or the Content Manager, after a resubmit, or once published (no withdraw, no publish, no “Propose an update”, no “Add a format”; corrections to a published experiment start with the Content Manager). The catalogue page is not linked (f8 draws no link).',
    basis:
      'B5-06 doc “Banner by state” and “Published” (LD-4 · VE-10…14 not designed); SUB-06 (no withdraw or recall)',
    status: 'provisional',
    decisions: ['VD-12', 'LD-4'],
  },

  // ---- VE-13 History ----
  'VE-13.address': {
    screen: 'VE-13',
    state: 'The record’s `?tab=history` address',
    words: null,
    rule: 'The same record page — B5-06 draws no tabs: VE-13 is merged into the record’s timeline — with focus on the history section’s heading, scrolled into view. The shell places it as VE-13 (My experiments current; “My experiments / Experiment record”). Any other `tab` value shows the record at its bare address (replaced, no history entry).',
    basis:
      'B5-00 index “VE-13 … Merged into the record timeline (not an audit log)”; screens.json VE-13 “MERGE → VE-07 timeline”; Appendix A rule T2 (`?tab=history`)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'VE-13.visible-entries': {
    screen: 'VE-13',
    state: 'Which history entries the Vendor reads',
    words: null,
    rule: 'The record’s own history entries visible to the Vendor (`visibleTo`), newest first, in the board’s words per event. No “Created” row: the first save creates the record and writes “Draft saved” at the same moment (OD-B5-07); an override (Super Admin only) is never shown. A Content Manager’s re-check reason is not shown (f7).',
    basis: 'B5-06 script `hist`, f0 … f9; OD-B5-07 (the id is given on the first save)',
    status: 'provisional',
    decisions: ['VD-12', 'OD-B5-07'],
  },
  'VE-13.routed': {
    screen: 'VE-13',
    state: 'The routing entry after a resubmit',
    words: null,
    rule: 'While the Vendor reads “Submitted” for a revision (routed back to the Academic Reviewer by the approved workflow rule right after the resubmit), that revision’s routing entry is not shown — no copy names the next gate. Once the record moves on it reads “With Academic Reviewer · revision <n>” · “Routed by the approved workflow rule.” as f0 draws it.',
    basis: 'B5-06 f0, f4; M-3 / OD-B5-05 (owner answer PC-66: the Vendor still reads “Submitted”)',
    status: 'provisional',
    decisions: ['VD-12', 'M-3', 'OD-B5-05'],
  },
  'VE-13.reason-note': {
    screen: 'VE-13',
    state: 'A return’s note in the history',
    words: null,
    rule: '“<role>: “<reason>”” with the reason’s first sentence; where more follows, its full stop becomes “…” (f6 “Content Manager: “The summary runs to three sentences…””). The whole reason is in the returned block above.',
    basis: 'B5-06 f3, f6 history notes',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'VE-13.published-one': {
    screen: 'VE-13',
    state: 'The publication’s note for one format',
    words: '{format} is live in the catalogue.',
    rule: 'Two formats read “WEB and VR are live in the catalogue.” (f8); three or more “WEB, AR and VR are live in the catalogue.”',
    basis: 'B5-06 f8 “WEB and VR are live in the catalogue.”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
} as const satisfies Readonly<Record<string, StateCopyEntry>>;
