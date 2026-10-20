/**
 * The words more than one Content Manager screen group draws (V3 Refined B; the owner-approved
 * export design/v3-refined-b/roles/CM-v1 `project/Main.dc.html`: the script's `UST`, `subSt`,
 * `flowSteps`, `updFlow`, the decision view's flow, and the version change of `updListVM` / `updVM`
 * / `pubVM` / `ovVM`): the status words of a submission and of a correction, the stage track's
 * words — who, what, when and the state before each stage for screen readers — and the version
 * change. Every phrase is the export's own, found verbatim in its markup or script
 * (`cm-shared.test.ts`); the composed lines take the script's forms with the records' values
 * (names, versions and dates are never copied from the export's sample world). What a screen group
 * alone draws is in `cm-lists.ts`, `cm-decision.ts` and `cm-correction.ts`.
 */
import type { UpdateState } from '@xr/domain';

// ---- Status words ------------------------------------------------------------------------------

/** A submission's status, as the Content Manager reads it (the script's `subSt`). */
export const CM_SUBMISSION_STATUS = {
  ready: 'Ready to publish',
  inReview: 'In academic review',
  /** A re-check she asked for. */
  recheck: 'Back with the Academic Reviewer',
  withVendor: 'With the vendor',
  published: 'Published',
} as const;

/** "Ready to publish · 2 to resolve": approved, with publication checks not met (`subSt`). */
export function readyToResolve(blockers: number): string {
  return `${CM_SUBMISSION_STATUS.ready} · ${blockers} to resolve`;
}

/** A correction's status (the script's `UST` labels). */
export const CM_UPDATE_STATUS: Readonly<Record<UpdateState, string>> = {
  draft: 'Draft',
  returned: 'Returned',
  'in-academic-review': 'In academic review',
  'awaiting-release-decision': 'Awaiting release decision',
  'on-hold': 'On hold',
  released: 'Released',
  withdrawn: 'Withdrawn',
};

// ---- Stage track -------------------------------------------------------------------------------

/** The list's name (`ol.cm-flow[aria-label]`). */
export const STAGE_TRACK_LABEL = {
  /** CM-03's band. */
  submission: 'Where this submission is',
  /** CM-05's band, the open correction's mini track. */
  openCorrection: 'Where the open correction is',
  /** CM-08 list cards and the CM-08 detail band. */
  correction: 'Where this correction is',
} as const;

/** The state in words before each stage, for screen readers (the script's `SR`). */
export const STAGE_STATE_WORDS = {
  done: 'Done: ',
  you: 'Your step, now: ',
  now: 'Now: ',
  back: 'Returned: ',
  held: 'On hold: ',
  off: 'Closed: ',
  next: 'Next: ',
} as const;

/** `span.cm-you` under the Content Manager's own stage (full tracks only). */
export const YOUR_STEP = 'Your step';

/** Who holds each stage (`p.cm-step-k`). */
export const STAGE_WHO = {
  vendor: 'Vendor',
  reviewer: 'Academic Reviewer',
  you: 'You',
  catalogue: 'Public catalogue',
  superAdmin: 'Super Admin',
  everyone: 'Everyone',
} as const;

/** What each stage is (`p.cm-step-t`). */
export const STAGE_WHAT = {
  submitted: 'Submitted',
  approved: 'Approved',
  published: 'Published',
  listed: 'Listed',
  decision: 'Publication decision',
  recheck: 'Re-check you asked for',
  inReview: 'In academic review',
  revising: 'Revising',
  review: 'Academic review',
  draft: 'Draft',
  returnedToYou: 'Returned to you',
  sent: 'Sent',
  releaseDecision: 'Release decision',
  live: 'Live',
  onHold: 'On hold',
  released: 'Released',
  withdrawn: 'Withdrawn',
} as const;

/** When a stage happens, or what it waits for (`p.cm-step-d`), where it carries no date. */
export const STAGE_WHEN = {
  liveNow: 'Live now',
  afterYouPublish: 'After you publish',
  backOnceApproved: 'Back here once approved again',
  afterApproval: 'After approval',
  whenResubmitted: 'When it is resubmitted',
  afterYouSend: 'After you send it',
  whenReleased: 'When released',
  changeAndSend: 'Change it and send it again',
  closedUndecided: 'Closed without a decision',
} as const;

/** "Revision 2 · 26 Aug" — a resubmission (the decision view's `subm`); its date when held. */
export function revisionOn(revision: number, day: string | null): string {
  return day ? `Revision ${revision} · ${day}` : `Revision ${revision}`;
}

/** "Prof. A. Menon · 27 Aug" — who approved it and when. */
export function approvedByOn(by: string, day: string): string {
  return by ? `${by} · ${day}` : day;
}

/** "Waiting since 27 Aug". */
export function waitingSince(day: string): string {
  return `Waiting since ${day}`;
}

/** "1 thing to resolve first", "2 things to resolve first". */
export function toResolveFirst(blockers: number): string {
  return `${blockers} ${blockers === 1 ? 'thing' : 'things'} to resolve first`;
}

/** "Since 25 Aug". */
export function sinceDay(day: string): string {
  return `Since ${day}`;
}

/**
 * "Returned 24 Aug by the Academic Reviewer" / "… by you" — who returned a submission to its
 * vendor; a Super Admin's override is not worded by the export ("Returned 24 Aug").
 */
export function returnedOn(
  day: string,
  by: 'academic-reviewer' | 'content-manager' | null,
): string {
  if (by === 'content-manager') return `Returned ${day} by you`;
  if (by === 'academic-reviewer') return `Returned ${day} by the Academic Reviewer`;
  return `Returned ${day}`;
}

/** "Saved 25 Aug" — a draft correction's last save. */
export function savedOn(day: string): string {
  return `Saved ${day}`;
}

/** "When released · 1.2 live now" — awaiting the release decision. */
export function whenReleasedLiveNow(liveLabel: string): string {
  return `${STAGE_WHEN.whenReleased} · ${liveLabel} live now`;
}

/** "2.0 stays live" — on hold. */
export function staysLive(liveLabel: string): string {
  return `${liveLabel} stays live`;
}

/** "Version 1.1 since 5 Aug" — released. */
export function versionSince(label: string, day: string): string {
  return `Version ${label} since ${day}`;
}

/** "Version 1.0 unchanged" — withdrawn. */
export function versionUnchanged(liveLabel: string): string {
  return `Version ${liveLabel} unchanged`;
}

// ---- Version change ----------------------------------------------------------------------------

/** "1.2 live". */
export function liveVersion(label: string): string {
  return `${label} live`;
}

/** "1.3 proposed". */
export function proposedVersion(label: string): string {
  return `${label} proposed`;
}

/** A correction without its version label yet. */
export const NO_VERSION_LABEL = 'No version label yet';

/** "1.1 withdrawn", or "Update withdrawn" when it had no label. */
export function withdrawnVersion(label: string | null): string {
  return `${label || 'Update'} withdrawn`;
}
