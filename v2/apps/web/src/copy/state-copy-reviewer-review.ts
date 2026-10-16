import type { StateCopyEntry } from './state-copy';

/**
 * The state-copy entries of Phase 5’s RV-03 Review a submission and RV-06 its decided state (B6-03, B6-11) — part of the one register (`state-copy.ts`, VD-12):
 * every state string or rule these screens show that their board does not draw word for word,
 * with its basis and the decisions it waits on. Decision ids never appear in visible copy.
 */
export const STATE_COPY_REVIEWER_REVIEW = {
  // ---- RV-03 Review a submission: reading the record ----
  'RV-03.heading': {
    screen: 'RV-03',
    state: 'The page heading before the submission is read (loading, failed)',
    words: 'Review a submission',
    rule: 'The back link “Review queue” and this H1; the top bar reads “Review queue”. Once read, the H1 is the experiment’s name (B6-03 f0).',
    basis:
      'B6-03 board title “Review a submission” (RV-03); screens.json RV-03. B6-03 draws no loading frame',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'RV-03.loading': {
    screen: 'RV-03',
    state: 'The submission loading (screen readers; a skeleton section)',
    words: 'Loading the submission',
    basis:
      'Board 04 “State grammar” Loading formula; B6-02 f2 (the queue’s skeleton rows). B6-03 draws no loading frame',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'RV-03.failed': {
    screen: 'RV-03',
    state: 'The submission failed to load (service unavailable; a test fault plan only)',
    words: 'We couldn’t load this submission',
    rule: 'The failed notice with “Try again”, which reads again. Nothing is lost: the outcomes being set stay in this tab.',
    basis:
      'B6-02 f3 “We couldn’t load the review queue” · “Nothing has changed. Try again.”. B6-03 draws no failed frame',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'RV-03.failed.line': {
    screen: 'RV-03',
    state: 'The failed notice’s line',
    words: 'Nothing has changed. Try again.',
    basis:
      'B6-02 f3 (the review queue’s failed state draws these words); B6-03 draws no failed state',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'RV-03.not-yours': {
    screen: 'RV-03',
    state: 'A submission the reviewer may not see: outside their scope, a draft, or no such record',
    words: null,
    rule: 'The in-shell not-found page (PU-15): existence is not revealed. The service decides (`not-found`, `not-permitted`).',
    basis:
      'Appendix F §5.2 record guards; SUB-16 (only the Vendor sees a draft); OD-B6-01 sample scope',
    status: 'provisional',
    decisions: ['VD-12', 'OD-B6-01'],
  },
  'RV-03.course-unlisted': {
    screen: 'RV-03',
    state:
      'The submission’s course is not in the public catalogue (its area shows nothing published)',
    words: null,
    rule: 'The course is named as the catalogue lists it (“ME ZG523 · Thermodynamics & Heat Transfer”). When the catalogue does not list it, the header line shows the vendor only and the Course row reads “—”.',
    basis: 'B6-03 f0 `rvMeta`, `m.course · m.cname`; the review read carries the course id only',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'RV-03.decision-ids': {
    screen: 'RV-03',
    state: 'The two B6-03 sentences that carry decision ids',
    words: null,
    rule: 'Shown without the ids: “App package (provisional)” and “You see delivery details and web links only. Who tests on a real device is still open.”; `copy/reviewer-review.ts` `STRIPPED_REVIEW` keeps the frozen wording and the ids (T-14, T-30).',
    basis:
      'B6-03 f0 … f5 “App package (provisional — T-14)”, “… still open (T-30).”; the owner’s P1-14 / VD-10 treatment (strip the suffix, keep the sentence)',
    status: 'provisional',
    decisions: ['P1-14', 'VD-10', 'T-14', 'T-30'],
  },
  // ---- What changed and the history ----
  'RV-03.what-changed-fields': {
    screen: 'RV-03',
    state: 'A “What changed” row for a field B6-03 draws no change for',
    words: null,
    rule: 'Each changed field is named “<step> · <format> · <field>” as the return references are (“Formats & delivery · VR · Device need”), with the editor’s own labels for the fields no reference names: Course, Experiment name, Version, Formats, Notes, Package (the label), Package reference, Preview label, Documents. A blank value reads “None”. Only the service’s own list is shown, in its order; the delivery card marks “Changed” beside Device needed only, as B6-03 does.',
    basis:
      'B6-03 f0 `chg` (“Formats & delivery · VR · Device need”, Was / Now) and `refOpts`; B5-03 … B5-05 field labels',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'RV-03.previous-return-other': {
    screen: 'RV-03',
    state: 'The previous revision was returned by another Academic Reviewer',
    words: '{name} returned revision {revision} on {day}: “{reason}”',
    basis:
      'B6-03 f0 `prevRet` “You returned revision 1 on 19 Aug: “…”” (the reviewer’s own return only)',
    status: 'provisional',
    decisions: ['VD-12', 'OD-B6-01'],
  },
  'RV-03.history-resubmitted.changed': {
    screen: 'RV-03',
    state: 'The history line of the resubmission now under review',
    words: '{organisation} changed the {fields}.',
    rule: 'The fields are “What changed” in short (“VR device need”, “summary”), joined with “and”.',
    basis:
      'B6-03 f0 `sh` “Northline Simulation Studio changed the VR device need.” (sample data, no script formula)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'RV-03.history-resubmitted.revision': {
    screen: 'RV-03',
    state: 'The history line of an earlier resubmission (what it changed is not reported any more)',
    words: 'Revision {revision} · from {organisation}',
    basis:
      'B6-03 f0 `sh` “Revision 1 · from Northline Simulation Studio” (the first submission’s line)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'RV-03.history-events': {
    screen: 'RV-03',
    state: 'Which history entries “Review history” lists',
    words: null,
    rule: 'Newest first, the entries the reviewer may read: submitted, returned to the vendor, approved (with the outcomes it carried), resubmitted, sent back for a re-check, sent back to the vendor and published, each in B6-03’s words with who and when. The Vendor’s own drafts, the routing stand-in’s system entry (M-3: it is not a person’s step) and a Super Admin override (its reason is the Super Admin’s) are not listed.',
    basis:
      'B6-03 script `sh` entries; history `visibleTo`; M-3 / PC-66 (routing by the drawn default)',
    status: 'provisional',
    decisions: ['VD-12', 'M-3'],
  },
  // ---- the outcomes and the decision ----
  'RV-03.kept': {
    screen: 'RV-03',
    state:
      'The outcomes being set, the decision chosen and a reason typed, kept while the reviewer moves around the app',
    words: null,
    rule: 'In memory only — never in the browser’s storage — per signed-in session and submission, for the life of the tab: leaving the page and coming back shows the set as it was left. A decision sent (approved or returned) drops it; so does the record being decided elsewhere. A reload starts again from the record’s own outcomes.',
    basis:
      'OD-B6-04 (the set travels with the decision); P1-20 interim (drafts are kept per tab); as FA-07 `FA-07.kept`',
    status: 'provisional',
    decisions: ['OD-B6-04', 'P1-20'],
  },
  'RV-03.stale.title': {
    screen: 'RV-03',
    state: 'Approve or Return refused: the submission changed since it was read (stale revision)',
    words: 'This submission changed since you opened it',
    rule: 'Nothing is written. The dialog closes, the submission is read again and this warning shows in the panel; the outcomes, the choice and the reason stay as they were, and the next attempt is sent on the record as now shown.',
    basis: 'Board 08 “conflict” formula; as FA-19 `FA-19.stale.*`. B6-03 draws none',
    status: 'provisional',
    decisions: ['VD-12', 'P1-21'],
  },
  'RV-03.stale.line': {
    screen: 'RV-03',
    state: 'The stale notice’s line',
    words: 'It has been read again. Your outcomes are kept — check them and decide again.',
    basis: 'Board 08 “conflict” formula. B6-03 draws none',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'RV-03.moved-on': {
    screen: 'RV-03',
    state:
      'Approve or Return refused because the submission is no longer with the reviewer (decided elsewhere)',
    words: 'It was decided elsewhere — nothing you entered was sent.',
    rule: 'Nothing is written: the dialog closes, the submission is read again and the page shows its decided state (RV-06) with this notice first in the panel.',
    basis:
      'Appendix G P1-21 interim (“Refetch and render the current drawn state”); as SA-03.moved-on. B6-03 draws none',
    status: 'provisional',
    decisions: ['P1-21'],
  },
  'RV-03.unavailable': {
    screen: 'RV-03',
    state: 'Approve or Return failed for now (service unavailable)',
    words: 'Your decision wasn’t sent. Nothing was lost — try again.',
    rule: 'The dialog stays open with this error notice; its button can be pressed again.',
    basis:
      'Board 08 “failed, try again · Nothing was lost”; as FA-19 `FA-19.unavailable.confirm`. B6-03 draws none',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  // ---- RV-06 decided ----
  'RV-06.resubmitted': {
    screen: 'RV-06',
    state:
      'Returned by the reviewer, then resubmitted, and not yet routed back (a build without the routing stand-in)',
    words: 'Resubmitted by the vendor',
    rule: 'The chip and the decided panel’s status (info tone), the reviewer’s own return under it with its reason, and the line “The vendor resubmitted it on <day>.” Where it goes next is not stated (M-3).',
    basis: 'B6-03 script `decTitle` (no resubmitted state); M-3 / PC-66',
    status: 'provisional',
    decisions: ['VD-12', 'M-3'],
  },
  'RV-06.resubmitted.next': {
    screen: 'RV-06',
    state: 'The resubmitted panel’s line',
    words: 'The vendor resubmitted it on {day}.',
    basis: 'B6-03 script `decNext` formula (“The Content Manager published it on …”)',
    status: 'provisional',
    decisions: ['VD-12', 'M-3'],
  },
  'RV-06.override': {
    screen: 'RV-06',
    state: 'Returned to the vendor by a Super Admin override (a stuck record)',
    words: 'Returned to vendor by a Super Admin',
    rule: 'The chip and the decided panel’s status (error tone) with no reason (the override’s reason is the Super Admin’s) and no next line.',
    basis: 'B6-03 script `decTitle` (“Returned to vendor”); B7-06 override (SUB-33, OD-B7-09)',
    status: 'provisional',
    decisions: ['VD-12', 'OD-B7-09'],
  },
} as const satisfies Readonly<Record<string, StateCopyEntry>>;
