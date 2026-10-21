import type { StateCopyEntry } from './state-copy';

/**
 * The state-copy entries of the Academic Reviewer's lists — RV-01 Overview, RV-02 Review queue and
 * RV-05 Reviewed by me — in the V3 Refined B design (the owner-approved export
 * design/v3-refined-b/roles/RV-v1, `project/RV.dc.html`), part of the one register (`state-copy.ts`,
 * VD-12): every state string or rule these screens show that the export does not draw word for
 * word, with its basis and the decisions it waits on. What the export draws is in
 * `reviewer-lists.ts`. Decision ids never appear in visible copy.
 */
export const STATE_COPY_REVIEWER_LISTS = {
  // ---- shared by the three lists ----
  'RV-lists.no-reference': {
    screen: 'RV-02',
    state: 'Where the earlier lists printed a submission’s or a correction’s reference',
    words: null,
    rule: 'No internal reference (REQ-, ACC-, UPD-, DTR-, SUP-, SUB-) in the lists’ words, accessible names or the tab’s title; each record is named by its experiment, its course and its type (“Flash Distillation, new submission, waiting since 24 Aug 2026. Review it”). The references stay in the addresses, the keys and the service calls; the searches still match them.',
    basis:
      'The owner’s identifier rule (every role); RV-v1 HANDOFF “Internal technical identifiers” and LINK-MAP “The search still matches a record ID, which is no longer displayed”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'RV-lists.course-name': {
    screen: 'RV-02',
    state: 'A course whose name the catalogue does not hold, or a course without a platform code',
    words: null,
    rule: 'The course name comes from the role’s one catalogue lookup (a course with nothing published is not in it): without a name the code chip stands alone; without a code the name (or nothing) stands alone. Such an item is listed under All courses only.',
    basis: 'RV-v1 RV.dc.html `courseName(code)` (every list row and scope row names its course)',
    status: 'provisional',
    decisions: ['VD-12', 'OD-B6-01'],
  },

  // ---- RV-01 Overview ----
  'RV-01.loading': {
    screen: 'RV-01',
    state: 'The overview loading (the kit’s loading line over skeleton rows, under the page head)',
    words: 'Loading your overview',
    rule: 'The head keeps “Overview” and “Open the review queue”; its line, the desk and the side cards wait for the reads (the overview and Reviewed by me).',
    basis:
      'FA-01 and IA-01 “Loading your overview”; RV-v1 draws no Overview loading (HANDOFF: the item and overview pages keep the application’s page loading)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'RV-01.failed': {
    screen: 'RV-01',
    state: 'The overview failed to load (service unavailable; a test fault plan only)',
    words: 'We couldn’t load your overview',
    rule: 'The kit’s failed state under the head: the cloud in the error tint, this title, “Nothing has changed. Try again.” and “Try again”, which reads again what failed and moves focus to the title.',
    basis: 'RV-v1 RV.dc.html “We couldn’t load the review queue” (the lists’ failed state); FA-01',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'RV-01.oldest': {
    screen: 'RV-01',
    state: 'Which item “Next in line · waiting longest” and its “Start review” open',
    words: null,
    rule: 'The queue’s first item — the queue is oldest first — whatever its kind: a new submission, a resubmission or a re-check opens its review (RV-03), an update opens Review an update (RV-04). It is named “Start review: <experiment>”; the rest are “Review <experiment>” and an update’s “Review the update to <experiment>”.',
    basis: 'RV-v1 RV.dc.html `overviewVals` (`rows[0]`, `act`, `aria`)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'RV-01.scope-all': {
    screen: 'RV-01',
    state: 'A reviewer whose scope is every course (not drawn for a reviewer)',
    words: null,
    rule: '“Your review scope” lists the scope’s courses in the service’s order, each opening the queue on its course (`?course=`); a scope over everything names no course, so the card is left out.',
    basis:
      'RV-v1 RV.dc.html “Your review scope” (`OV.courses`); contract `reviewerOverviewOutput.scopeAll`',
    status: 'provisional',
    decisions: ['OD-B6-01'],
  },
  'RV-01.recheck-from': {
    screen: 'RV-01',
    state: 'Who sent a re-check back (the desk row and the queue row)',
    words: 'Sent back by the Content Manager',
    rule: 'The export writes “Revision 1 · sent back by Kavya Nair, Content Manager”; the list reads hold neither the revision nor who sent it back, so the line is the role, in the words of “In your queue” (no per-row read).',
    basis:
      'RV-v1 RV.dc.html `fromOf` (re-check) and `overviewVals` types “Sent back by the Content Manager”',
    status: 'provisional',
    decisions: ['VD-12'],
  },

  // ---- RV-02 Review queue ----
  'RV-02.filters': {
    screen: 'RV-02',
    state: 'The type tabs, the search, Course, the chips and the address',
    words: null,
    rule: 'As the export’s `queueVals`: the search matches the name, the internal reference (not shown), the course code or the sender, ignoring case; the tabs are All · New submissions (resubmissions included) · Re-checks · Updates, each counting what the search and Course leave; Course is All courses, then the scope courses by code (the overview read), then any other code a queued item carries. The count is “<n> items · oldest first”, or “<shown> of <n> items · oldest first” while a filter (a tab included) applies; a chip per search and course; “Clear filters” clears all and returns focus to the search. Type and Course are mirrored in the address (`?type=`, `?course=<code>`, no history entry) and read again from it — the Overview’s type and scope rows open the queue that way.',
    basis:
      'RV-v1 RV.dc.html `queueVals` (`TABS`, `chips`, `count`, `clear`); LINK-MAP “In your queue”, “Your review scope”; `nav/reviewer.ts` `reviewQueueAddress`',
    status: 'provisional',
    decisions: ['VD-12', 'OD-B6-01'],
  },
  'RV-02.focus': {
    screen: 'RV-02',
    state: '“What to look at” (RV-02) and the desk’s line under an item (RV-01)',
    words: null,
    rule: 'Drawn where the list reads hold it: a re-check quotes the Content Manager’s reason, cut at a word near 74 characters (the overview read); a first review without outcomes is flagged “No learning outcomes yet”. The export’s “<n> learning outcomes set by you”, “Changed since your return: …” and “Changes the … · version …” need a detail read per row, so nothing is said for those items (no per-row read).',
    basis: 'RV-v1 RV.dc.html `focusOf`, `excerpt`; lead decision 1 (no per-row detail reads)',
    status: 'provisional',
    decisions: ['VD-12'],
  },

  // ---- RV-05 Reviewed by me ----
  'RV-05.type': {
    screen: 'RV-05',
    state: 'The type of a decided item, and the Show tabs',
    words: null,
    rule: 'The type as decided: an update “Update” (the row holds no versions, so none is named), a later revision “Resubmitted · revision <n>”, else “New submission”; a return the vendor has since answered names the revision returned (“New submission · revision 1”). New submissions lists everything that is not an update (a re-check decision included). Each record is listed once, with the reviewer’s last decision on it.',
    basis:
      'RV-v1 RV.dc.html `reviewedVals` (`k`, `TABS`); contract `reviewedByMeOutput` (no versions)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'RV-05.now': {
    screen: 'RV-05',
    state: '“Where it is now” beyond what the row holds (RV-05, RV-01 Recently decided)',
    words: null,
    rule: 'The role’s shared standing words from the row’s state alone: a resubmission waiting again reads “In your queue” (the row holds no current revision), a released update “Released by the Super Admin” (no date or version in the row); a hold reads as with the Super Admin and no reason is named.',
    basis: 'RV-v1 RV.dc.html `standing` (`now`); contract `reviewedByMeOutput.nowState`',
    status: 'provisional',
    decisions: ['VD-12', 'OD-B6-06'],
  },
} as const satisfies Readonly<Record<string, StateCopyEntry>>;
