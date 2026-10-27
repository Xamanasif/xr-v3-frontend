import type { StateCopyEntry } from './state-copy';

/**
 * The state-copy entries of VE-07 Experiment record and VE-13 Submission and version history —
 * part of the one register (`state-copy.ts`, VD-12): every state string or rule these screens show
 * that the owner-approved Vendor export (design/v3-refined-b/roles/VE-v1, `Main.dc.html` record
 * view) does not draw word for word, with its basis and the decisions it waits on. Decision ids
 * never appear in visible copy.
 */
export const STATE_COPY_VENDOR_RECORD = {
  // ---- VE-07 Experiment record ----
  'VE-07.loading': {
    screen: 'VE-07',
    state: 'The record loading (screen readers; skeleton rows in the sheet)',
    words: 'Loading the experiment record',
    rule: 'The breadcrumb “My experiments › Experiment record” and the heading “Experiment record” stay; the kit’s loading line over skeleton rows in a sheet waits for the read.',
    basis:
      'Board 04 “State grammar” Loading formula; the kit’s LoadingRows. The VE-v1 export draws no loading record',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'VE-07.failed': {
    screen: 'VE-07',
    state: 'The record failed to load (service unavailable; a test fault plan only)',
    words: 'We couldn’t load the experiment record',
    rule: 'The kit’s failed state in a sheet under the heading: this title, then the export’s failed-state line “Nothing has changed. Try again.” and “Try again”, which reads again.',
    basis:
      'VE-v1 VE-02 failed state (“We couldn’t load your experiments” · “Nothing has changed. Try again.” · “Try again”); B2-11 f10 / B4-02 f5 failed pattern. The export draws no failed record',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'VE-07.not-found.title': {
    screen: 'VE-07',
    state:
      'An address naming no experiment the Vendor may open (unknown id, or another vendor’s record — a colleague of the same studio included, owner decision PD-1: not found / not permitted)',
    words: 'We can’t find that experiment',
    rule: 'A calm state in a sheet under the breadcrumb and the heading “Experiment record”: the information mark, this title and `VE-07.not-found.line`. Whether the record exists is not said.',
    basis:
      'B6-12 f6 “We can’t find that experiment” (the public page before publication); board 04 Not-found formula. The VE-v1 export draws no such state',
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
  'VE-07.course-words': {
    screen: 'VE-07',
    state:
      'The head’s course and Details › Course when the course has no platform code, or none is chosen',
    words: null,
    rule: 'The head’s meta line names the course by its platform code; a course without one by its name; none chosen “—”. Details › Course reads “<code> · <name>”, the name alone without a code, “Not chosen yet” without a course. The names are the catalogue’s, else the Vendor’s assigned courses’.',
    basis:
      'VE-v1 `recView` `meta` (the course code) and `courseLong`; the editor review’s `cCourse` “Not chosen yet”; T-17 (a blank platform code drops the chip)',
    status: 'provisional',
    decisions: ['VD-12', 'T-17'],
  },
  'VE-07.preview-link-only': {
    screen: 'VE-07',
    state: 'Details › Preview with a link and no label',
    words: null,
    rule: 'The link alone (the export’s script shows “None” without a label, but a link without a label is allowed); a label without a link shows the label.',
    basis: 'OD-B5-08 “a link without a label is allowed” (VE-v1 HANDOFF §5); `recView` `preview`',
    status: 'provisional',
    decisions: ['VD-12', 'OD-B5-08'],
  },
  'VE-07.course-withdrawn.line': {
    screen: 'VE-07',
    state: 'A draft whose course is no longer assigned to the Vendor (read-only)',
    words:
      'Withdrawn from {organisation}. This draft is kept, read-only. BITS / WILP decides which courses are yours.',
    rule: 'The warn notice with the lock, titled “<code> is no longer assigned to you”, with “Ask for help” (the Report a problem form, its “Where” filled from this page), and the pill “Draft · read-only”, as the export draws them — without “on <day>”: the record’s read does not carry the day the course was withdrawn. No “Edit draft”. Nor does “Where it stands” show “Course withdrawn”, or the history a “Course withdrawn …” entry, for the same reason.',
    basis:
      'VE-v1 HANDOFF §2 “<course> is no longer assigned to you · Withdrawn from <studio> on <date>. This draft is kept, read-only. BITS / WILP decides which courses are yours.”; LINK-MAP L54 “Ask for help” → XS-07 report form',
    status: 'provisional',
    decisions: ['VD-12', 'OD-B5-01'],
  },
  'VE-07.course-withdrawn.returned': {
    screen: 'VE-07',
    state: 'A returned record whose course is no longer assigned to the Vendor',
    words:
      'Withdrawn from {organisation}. It is kept, read-only. BITS / WILP decides which courses are yours.',
    rule: 'The pill “Returned” and the returned-reason panel without its reference chips (they open the editor), then the warn notice “<code> is no longer assigned to you” with this line and “Ask for help”; no “Revise and resubmit” (a saved experiment in a withdrawn course opens read-only).',
    basis:
      'VE-v1 HANDOFF §2 (drawn for a draft only); OD-B5-01 “a saved one opens read-only” (HANDOFF §5)',
    status: 'provisional',
    decisions: ['VD-12', 'OD-B5-01'],
  },
  'VE-07.returned-by-override': {
    screen: 'VE-07',
    state: 'A record the Super Admin moved back to the Vendor (status override of a stuck record)',
    words: null,
    rule: 'The pill “Returned” and “Revise and resubmit”, with no returned-reason panel: what the Vendor reads after an override is not drawn, and the override’s reason is the Super Admin’s only. The history shows nothing of it.',
    basis:
      'B7-06 (the Vendor-side view of an override is not drawn; Appendix D §4.6 “Vendor wording UNRESOLVED”); SUB-38',
    status: 'provisional',
    decisions: ['VD-12', 'OD-B7-09'],
  },
  'VE-07.saved-changes': {
    screen: 'VE-07',
    state: 'A returned record with changes saved and not resubmitted (Save changes in the editor)',
    words: null,
    rule: 'Shown when the record is returned and was changed after the return (its last change is later than the return): “Your changes are saved but not resubmitted” with “Saved <when>. Only you can see them. Everyone else still sees revision <n> as it was submitted.” inside the returned-reason panel, the head’s action “Continue revising”, and the history’s private-changes note. The export’s “Changed since revision <n>” list of fields is not drawn: the Vendor’s read does not say which fields changed.',
    basis:
      'VE-v1 HANDOFF §3 “Privacy of a saved revision”; `recView` `hasPending`, `pendingText`, `histPendingNote`, `actLabel`',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'VE-07.intro.saved-changes': {
    screen: 'VE-07',
    state: 'Which version Details shows while changes are saved and not resubmitted',
    words: 'Your changes as last saved on {at}. They are not resubmitted yet.',
    rule: 'The Vendor’s read holds the saved changes, so Details shows them and says so — in place of the export’s “Revision <n> as it was submitted on <date>. Your saved changes are not shown here until you resubmit.”, which this read cannot honour.',
    basis:
      'VE-v1 `recView` `intro` (the draft’s “Your draft as last saved on <when>.” form); HANDOFF §3',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'VE-07.no-other-actions': {
    screen: 'VE-07',
    state: 'Every state but Draft and Returned',
    words: null,
    rule: 'No action but the breadcrumb and the tabs (and “Ask for help” while the course is no longer assigned): nothing is the Vendor’s to do while it is with the Academic Reviewer or the Content Manager, after a resubmit, or once published (no withdraw, no publish, no “Propose an update”, no “Add a format”; changes to a published experiment are not made from the Vendor workspace). The catalogue page is not linked.',
    basis:
      'VE-v1 HANDOFF §1 VE-07 “The Vendor cannot: publish; propose an update; add formats to published material; change a published experiment” (LD-4 · VE-10…12 excluded); SUB-06 (no withdraw or recall)',
    status: 'provisional',
    decisions: ['VD-12', 'LD-4'],
  },

  // ---- VE-13 History ----
  'VE-13.address': {
    screen: 'VE-13',
    state: 'The record’s `?tab=history` address',
    words: null,
    rule: 'The record’s second tab: the head, the status notice and “Where it stands” stay; the history sheet replaces Details and its heading takes focus (Details gives focus back to the page heading). The tabs are links, each keeping its address. Any other `tab` value shows the record at its bare address (replaced, no history entry).',
    basis:
      'VE-v1 LINK-MAP L55 “Tabs · Details · Submission and version history … focus moves to the tab’s heading”; ROLE-STATUS VE-13 route `?tab=history`',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'VE-13.visible-entries': {
    screen: 'VE-13',
    state: 'Which history entries the Vendor reads',
    words: null,
    rule: 'The record’s own history entries visible to the Vendor (`visibleTo`), newest first, in the export’s words per event. No “Created” row: the first save creates the record and writes “Draft saved” at the same moment (OD-B5-07); an override (Super Admin only) is never shown. A Content Manager’s re-check reason is not shown.',
    basis:
      'VE-v1 `hist` entries and ROLE-STATUS VE-13 entries; OD-B5-07 (the id is given on the first save)',
    status: 'provisional',
    decisions: ['VD-12', 'OD-B5-07'],
  },
  'VE-13.routed': {
    screen: 'VE-13',
    state: 'The routing entry after a resubmit',
    words: null,
    rule: 'Never shown to the Vendor: a resubmitted revision reads “Submitted · revision <n>” until a reviewer decides, and no copy names the next gate — v46’s Vendor-facing “With Academic Reviewer · revision <n>” entry is retired.',
    basis:
      'VE-v1 HANDOFF §2 “Accepted local route, neutral wording” and §7 “Removed”; M-3 / OD-B5-05 (owner answer PC-66)',
    status: 'provisional',
    decisions: ['VD-12', 'M-3', 'OD-B5-05'],
  },
  'VE-13.reason-note': {
    screen: 'VE-13',
    state: 'A return’s note in the history',
    words: null,
    rule: '“<role>: “<reason>”” with the reason’s first sentence; where more follows, its full stop becomes “…” (“Content Manager: “The summary runs to three sentences…””). The whole reason is in the returned-reason panel.',
    basis: 'VE-v1 `hist` notes (SUB-0077, the Content Manager return)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'VE-13.published-one': {
    screen: 'VE-13',
    state: 'The publication’s note for one format',
    words: '{format} is live in the catalogue.',
    rule: 'Two formats read “WEB and VR are live in the catalogue.”; three or more “WEB, AR and VR are live in the catalogue.”',
    basis: 'VE-v1 `hist` “WEB and VR are live in the catalogue.”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
} as const satisfies Readonly<Record<string, StateCopyEntry>>;
