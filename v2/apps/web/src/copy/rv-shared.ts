/**
 * The words more than one Academic Reviewer screen group draws (V3 Refined B; the owner-approved
 * export design/v3-refined-b/roles/RV-v1, live root `project/RV.dc.html`: the script's `kindOf`,
 * `standing`, `ageOf`, `itemVals` and the item view's template): the review type tag, the status
 * and "where it is now" of a record, the waiting age, the identity card's shared facts and the
 * decision panel's shared words. Every phrase is the export's own, found verbatim in its markup or
 * script (`rv-shared.test.ts`); the composed lines take the script's forms with the records' values
 * (names, versions and dates are never copied from the export's sample world). No line names a
 * record by its internal reference (HANDOFF "Internal technical identifiers"). What a screen group
 * alone draws is in `reviewer-lists.ts`, `reviewer-review.ts` and `review-update.ts`.
 */

// ---- Review type tag (the script's `kindOf`) ---------------------------------------------------

/** The four kinds of review work, as the tag names them (`span.rv-kind-t`). */
export const RV_KIND_WORDS = {
  new: 'New submission',
  resub: 'Resubmitted',
  recheck: 'Re-check',
  update: 'Update',
} as const;

/** Beside a resubmission (`span.rv-kind-d`): "revision 2". */
export function revisionDetail(revision: number): string {
  return `revision ${revision}`;
}

/** Beside an update (`span.rv-kind-d`): "1.2 → 1.3". */
export function versionChangeDetail(live: string, proposed: string): string {
  return `${live} → ${proposed}`;
}

/** Beside an update whose live version is not known (`span.rv-kind-d`): "to version 2.1". */
export function toVersionDetail(proposed: string): string {
  return `to version ${proposed}`;
}

// ---- Status and where it is now (the script's `standing`) --------------------------------------

/** A record's status as the reviewer reads it (the pill: `standing().label`). */
export const RV_STATUS = {
  waiting: 'Waiting for your decision',
  withContentManager: 'Approved — with the Content Manager',
  published: 'Approved — published',
  returnedToVendor: 'Returned to vendor',
  returnedToContentManager: 'Returned to the Content Manager',
  withSuperAdmin: 'Approved — with the Super Admin',
  released: 'Approved — released',
  withdrawn: 'Withdrawn by the Content Manager',
} as const;

/** Where a record is now (RV-05's column, RV-01's Recently decided: `standing().now`). */
export const RV_NOW = {
  inYourQueue: 'In your queue',
  recheck: 'Back in your queue for a re-check',
  withContentManagerNotPublished: 'With the Content Manager · not published',
  withVendor: 'With the vendor to revise',
  withContentManager: 'With the Content Manager',
  withSuperAdmin: 'With the Super Admin for a release decision',
  withdrawn: 'Withdrawn by the Content Manager',
  /**
   * A released update whose release date and version the read does not hold (RV-05's list read
   * carries the state only): the export's history words for the release.
   */
  releasedBySuperAdmin: 'Released by the Super Admin',
} as const;

/** "Revision 2 is in your queue": a resubmission waiting again, its revision known. */
export function revisionInQueue(revision: number): string {
  return `Revision ${revision} is in your queue`;
}

/** "Published on 30 Jul 2026". */
export function publishedOn(date: string): string {
  return `Published on ${date}`;
}

/** "Released on 5 Aug 2026 · version 1.1 is live". */
export function releasedOn(date: string, version: string): string {
  return `Released on ${date} · version ${version} is live`;
}

// ---- Waiting age (the script's `ageOf`, `short`) -----------------------------------------------

/** The wait in words: "Today", "1 day", "13 days". */
export function ageWords(days: number): string {
  if (days <= 0) return 'Today';
  return days === 1 ? '1 day' : `${days} days`;
}

/** Under the age (`p.rv-age span`): "since 24 Aug". */
export function sinceWords(day: string): string {
  return `since ${day}`;
}

/** A submission's Waiting fact: "2 days · since 24 Aug". */
export function waitingFact(age: string, day: string): string {
  return `${age} · since ${day}`;
}

/** An update's Waiting fact: "2 days · sent 25 Aug". */
export function waitingSentFact(age: string, day: string): string {
  return `${age} · sent ${day}`;
}

// ---- The item page (RV-03, RV-04, RV-06) -------------------------------------------------------

/** The identity card's facts that a submission and an update share (`dl.rv-id-facts dt`). */
export const RV_FACT_TERMS = {
  waiting: 'Waiting',
  decided: 'Decided',
  withdrawn: 'Withdrawn',
  formats: 'Formats',
} as const;

/** The Formats fact: "WEB · VR". */
export function formatsFact(formats: readonly string[]): string {
  return formats.join(' · ');
}

/** The identity card's sender (`span.rv-meta-who`): a submission "From Meridian Virtual Labs". */
export function fromSender(who: string): string {
  return `From ${who}`;
}

/** An update's sender: "From Kavya Nair, Content Manager". */
export function fromContentManager(name: string): string {
  return `From ${name}, Content Manager`;
}

/** The item page's words both the submission and the update draw. */
export const RV_ITEM = {
  /** The page map's name and visible key (`nav.rv-onpage`). */
  onThisPage: 'On this page',
  /** `a.rb-btn.rk-goto`. */
  goToDecision: 'Go to decision',
  /** The decision panel's heading. */
  yourDecision: 'Your decision',
  /** `p.rv-ready-h`. */
  beforeYouDecide: 'Before you decide',
  /** `p.rv-path-h`. */
  whatHappensNext: 'What happens next',
  /** The first step of the path (`span.rv-path-t`). */
  youAcademicDecision: 'You · academic decision',
  /** The choices' legend. */
  decision: 'Decision',
  /** The error summary's title (`p.rk-errsum-t`). */
  checkYourDecision: 'Check your decision',
  /** A block's note (`p.rb-note`). */
  readOnly: 'Read-only',
  newestFirst: 'Newest first',
  /** The history's title and its page-map link. */
  reviewHistory: 'Review history',
  updateHistory: 'Update history',
  /** The decided outcome's quoted reason (`div.rv-done-q b`). */
  yourReason: 'Your reason',
} as const;

/** The decided outcome's meta (`p.rk-done-meta`): "Decided by you on 27 Aug 2026, 15:20". */
export function decidedByYouOn(when: string): string {
  return `Decided by you on ${when}`;
}

/** The same, decided in another tab or window: "Decided by you on …, in another window". */
export function decidedElsewhereOn(when: string): string {
  return `${decidedByYouOn(when)}, in another window`;
}

/** A correction withdrawn under the page: "Withdrawn on 27 Aug 2026". */
export function withdrawnOn(when: string): string {
  return `Withdrawn on ${when}`;
}

/** Where the record stands, the terms both kinds draw (`dl.rk-stand`). */
export const RV_STAND = {
  academicReview: 'Academic review',
  approvedByYou: 'Approved by you',
  access: 'Access',
} as const;

/** A refused decision (`div.rv-refusal p.rk-notice-t`). */
export const RV_REFUSAL = {
  /** Stale: withdrawn after the page was opened. */
  stale: 'Nothing was recorded',
  /** Already decided in another window. */
  elsewhere: 'Nothing new was recorded',
} as const;

/** The approval dialog's words both kinds draw (`rk-dialog`). */
export const RV_APPROVE_DIALOG = {
  description: 'Check what approving does now, and what happens only after later decisions.',
  now: 'What happens now',
  later: 'Only after later decisions',
  leavesQueue: 'It leaves your review queue and is listed in Reviewed by me.',
} as const;

/** The way back from the decided outcome, by the breadcrumb's parent (`backLabel`). */
export const RV_BACK = {
  queue: 'Back to the review queue',
  reviewed: 'Back to Reviewed by me',
} as const;
