import type { StateCopyEntry } from './state-copy';

/**
 * The state-copy entries of RV-03 Review a submission and RV-06 its decided state — part of the one
 * register (`state-copy.ts`, VD-12): every state string or rule these screens show that the
 * owner-approved Academic Reviewer export (V3, design/v3-refined-b/roles/RV-v1 `RV.dc.html`) does
 * not draw word for word, with its basis and the decisions it waits on. Decision ids never appear
 * in visible copy, and no internal reference (SUB-, UPD-, …) appears in any words (owner, 21 Oct
 * 2026).
 */
export const STATE_COPY_REVIEWER_REVIEW = {
  // ---- RV-03 Review a submission: reading the record ----
  'RV-03.heading': {
    screen: 'RV-03',
    state: 'The page heading before the submission is read (loading, failed)',
    words: 'Review a submission',
    rule: 'The application’s existing page loading and failed states inside the V3 shell, under this H1. Once read, the H1 is the experiment’s name and the breadcrumb names the experiment (RV-v1 HANDOFF RV-06).',
    basis:
      'RV-v1 ROLE-STATUS screen title “Review a submission” (RV-03); the export draws no loading frame for the item page',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'RV-03.loading': {
    screen: 'RV-03',
    state: 'The submission loading (screen readers; a skeleton section)',
    words: 'Loading the submission',
    basis:
      'Board 04 “State grammar” Loading formula; RV-v1 draws loading for the two lists only (RV02-loading, RV05-loading)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'RV-03.failed': {
    screen: 'RV-03',
    state: 'The submission failed to load (service unavailable; a test fault plan only)',
    words: 'We couldn’t load this submission',
    rule: 'The failed notice with “Try again”, which reads again. Nothing is lost: the outcomes being set stay in this tab.',
    basis:
      'B6-02 f3 “We couldn’t load the review queue” · “Nothing has changed. Try again.”. RV-v1 draws no failed frame for the item page',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'RV-03.failed.line': {
    screen: 'RV-03',
    state: 'The failed notice’s line',
    words: 'Nothing has changed. Try again.',
    basis:
      'B6-02 f3 (the review queue’s failed state draws these words); RV-v1 draws no failed state for the item page',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'RV-03.not-yours': {
    screen: 'RV-03',
    state: 'A submission the reviewer may not see: outside their scope, a draft, or no such record',
    words: null,
    rule: 'The in-shell not-found page (PU-15, the delivered XS message page in the V3 shell): existence is not revealed. The service decides (`not-found`, `not-permitted`). RV-v1 draws an “isn’t in your review scope” card (RV-scope) and an “isn’t available” card (RV-unavailable); the product keeps not found (lead decision, 21 Oct 2026).',
    basis:
      'Appendix F §5.2 record guards; SUB-16 (only the Vendor sees a draft); OD-B6-01 sample scope; RV-v1 HANDOFF “Refusals and boundaries”',
    status: 'provisional',
    decisions: ['VD-12', 'OD-B6-01'],
  },
  'RV-03.course-unlisted': {
    screen: 'RV-03',
    state:
      'The submission’s course is not in the public catalogue (its area shows nothing published)',
    words: null,
    rule: 'The course is named as the catalogue lists it (the code chip and the name). When the catalogue does not list it, the identity card leaves the course out and the sender line stays.',
    basis: 'RV-v1 `rv-meta-course` (code + name); the review read carries the course id only',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  // ---- What changed, delivery and the history ----
  'RV-03.what-changed-fields': {
    screen: 'RV-03',
    state: 'A “What changed” row for a field the export draws no change for',
    words: null,
    rule: 'Each changed field is named “<step> · <format> · <field>” as the return references are (“Formats & delivery · VR · Device need”), with the editor’s own labels for the fields no reference names: Course, Experiment name, Version, Formats, Notes, Package (the label), Package reference, Preview label, Documents. A blank value reads “None”. Only the service’s own list is shown, in its order; on the delivery cards every value the list names carries “Changed in revision <n>”.',
    basis:
      'RV-v1 `changes` (“Formats & delivery · VR · Device need”, Was / Now), `REFS`, `d.changed`; B5-03 … B5-05 field labels',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'RV-03.previous-return-other': {
    screen: 'RV-03',
    state: 'The previous revision was returned by another Academic Reviewer',
    words: 'The reason {name} gave when returning revision {revision} · {day}',
    basis:
      'RV-v1 `prevBy` “Your reason when you returned revision 1 · 19 Aug 2026” (the reviewer’s own return only)',
    status: 'provisional',
    decisions: ['VD-12', 'OD-B6-01'],
  },
  'RV-03.history-resubmitted.changed': {
    screen: 'RV-03',
    state: 'The history line of the resubmission now under review',
    words: '{organisation} changed the {fields}.',
    rule: 'The fields are “What changed” in short (“VR device need”, “summary”), joined with “and”.',
    basis:
      'RV-v1 `hist` “Northline Simulation Studio changed the VR device need.” (sample data, no script formula)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'RV-03.history-resubmitted.revision': {
    screen: 'RV-03',
    state: 'The history line of an earlier resubmission (what it changed is not reported any more)',
    words: 'Revision {revision} · from {organisation}',
    basis:
      'RV-v1 `hist` “Revision 1 · from Northline Simulation Studio” (the first submission’s line)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'RV-03.history-published': {
    screen: 'RV-03',
    state: 'The history line of the publication (the export leaves its note empty)',
    words: 'In the public catalogue under {course} with {formats}. No one was given access.',
    basis:
      'B6-03 script `sh` (published); RV-v1 `hist` “Published by the Content Manager”, no note',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'RV-03.history-events': {
    screen: 'RV-03',
    state: 'Which history entries “Review history” lists',
    words: null,
    rule: 'Newest first, the entries the reviewer may read: submitted, returned to the vendor, approved (with the outcomes it carried), resubmitted, sent back for a re-check, sent back to the vendor and published, each with who and when. The Vendor’s own drafts, the routing stand-in’s system entry (M-3: it is not a person’s step) and a Super Admin override (its reason is the Super Admin’s) are not listed.',
    basis: 'RV-v1 `hist` entries; history `visibleTo`; M-3 / PC-66 (routing by the drawn default)',
    status: 'provisional',
    decisions: ['VD-12', 'M-3'],
  },
  // ---- the outcomes and the decision ----
  'RV-03.kept': {
    screen: 'RV-03',
    state:
      'The outcomes being set, the decision chosen and a reason typed, kept while the reviewer moves around the app',
    words: null,
    rule: 'In memory only — never in the browser’s storage — per signed-in session and submission, for the life of the tab: leaving the page and coming back shows the set as it was left. A decision sent (approved or returned) drops it; so does the record being decided elsewhere. A reload starts again from the record’s own outcomes, with no decision chosen.',
    basis:
      'OD-B6-04 (the set travels with the decision); P1-20 interim (drafts are kept per tab); as FA-07 `FA-07.kept`',
    status: 'provisional',
    decisions: ['OD-B6-04', 'P1-20'],
  },
  'RV-03.stale.line': {
    screen: 'RV-03',
    state: 'Approve or Return refused: the submission changed since it was read (stale revision)',
    words:
      'This submission changed since you opened it. It has been read again — your outcomes are kept; check them and decide again.',
    rule: 'Nothing is written. The submission is read again and the panel opens with the export’s refusal notice (“Nothing was recorded”, `rv-refusal`, focused) and this line; the outcomes, the choice and the reason stay as they were, and the next attempt is sent on the record as now shown.',
    basis:
      'RV-v1 `refusalT` “Nothing was recorded” (drawn for a withdrawn update, RV04-stale); Board 08 “conflict” formula',
    status: 'provisional',
    decisions: ['VD-12', 'P1-21'],
  },
  'RV-03.moved-on.line': {
    screen: 'RV-03',
    state:
      'Approve or Return refused because the submission is no longer with the reviewer (decided elsewhere)',
    words: 'It was decided elsewhere. The page now shows that decision.',
    rule: 'Nothing is written: the submission is read again and the page shows its decided state (RV-06) with the export’s refusal notice “Nothing new was recorded” (focused) and this line first in the panel. When the decision is the reader’s own, the outcome’s line says “…, in another window”.',
    basis:
      'RV-v1 RV06-elsewhere (“Nothing new was recorded” · “You had already approved this in another window.” — the product cannot tell which decision or window); Appendix G P1-21 interim',
    status: 'provisional',
    decisions: ['P1-21'],
  },
  'RV-03.unavailable': {
    screen: 'RV-03',
    state: 'Approve or Return failed for now (service unavailable)',
    words: 'Your decision wasn’t sent. Nothing was lost — try again.',
    rule: 'Approve: the confirmation stays open with this notice; its button can be pressed again. Return (completed in the panel): this notice in the panel above the decision; the reason and references stay.',
    basis:
      'Board 08 “failed, try again · Nothing was lost”; as FA-19 `FA-19.unavailable.confirm`. RV-v1 draws none',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  // ---- RV-06 decided ----
  'RV-06.decided-by-other': {
    screen: 'RV-06',
    state: 'The decision was taken by another Academic Reviewer',
    words: 'Decided by {name} on {when}',
    basis: 'RV-v1 `meta` “Decided by you on …” (the reader’s own decision only)',
    status: 'provisional',
    decisions: ['VD-12', 'OD-B6-01'],
  },
  'RV-06.approved-by-other': {
    screen: 'RV-06',
    state: '“Academic review” in the outcome when another Academic Reviewer approved it',
    words: 'Approved by {name}',
    basis: 'RV-v1 `stand` “Approved by you”',
    status: 'provisional',
    decisions: ['VD-12', 'OD-B6-01'],
  },
  'RV-06.with-vendor.next': {
    screen: 'RV-06',
    state:
      'The line under the outcome when the reviewer approved it and the Content Manager then sent it back to the vendor (the status reads “Returned to vendor”, as RV-05 lists it)',
    words: 'The Content Manager sent it back to the vendor.',
    basis: 'B6-03 script `decNext`; RV-v1 draws none',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'RV-06.resubmitted': {
    screen: 'RV-06',
    state:
      'Returned by the reviewer, then resubmitted, and not yet routed back (a build without the routing stand-in)',
    words: 'Resubmitted by the vendor',
    rule: 'The status pill and the outcome’s status (info tone), the reviewer’s own return under it with its reason, and the line “The vendor resubmitted it on <day>.” Where it goes next is not stated (M-3).',
    basis: 'RV-v1 `standing` (no resubmitted state); M-3 / PC-66',
    status: 'provisional',
    decisions: ['VD-12', 'M-3'],
  },
  'RV-06.resubmitted.next': {
    screen: 'RV-06',
    state: 'The resubmitted outcome’s line',
    words: 'The vendor resubmitted it on {day}.',
    basis: 'RV-v1 `next` formula (“The Content Manager published it …”)',
    status: 'provisional',
    decisions: ['VD-12', 'M-3'],
  },
  'RV-06.override': {
    screen: 'RV-06',
    state: 'Returned to the vendor by a Super Admin override (a stuck record)',
    words: null,
    rule: 'The status reads “Returned to vendor” (error tone), as RV-05 lists it, with no reason (the override’s reason is the Super Admin’s) and no next line.',
    basis: 'RV-v1 `standing` (“Returned to vendor”); B7-06 override (SUB-33, OD-B7-09)',
    status: 'provisional',
    decisions: ['VD-12', 'OD-B7-09'],
  },
} as const satisfies Readonly<Record<string, StateCopyEntry>>;
