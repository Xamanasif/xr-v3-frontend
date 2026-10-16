/**
 * The words of Phase 6's correction entry on CM-05 Published experiment (board B6-08 f0 … f4;
 * B6-11 f9) and the CM-08 update page the entries open — the correction draft of CM-06 / CM-07 and
 * every later state (B6-09 f1 … f8; B6-11 f10, f11; B6-13 f0; B7-11 f3, f4). Every phrase is the
 * frozen boards' own, found verbatim in their markup or script (`cm-correction.test.ts`); the
 * composed lines take the boards' forms (B6-09 `uOver`, `uTitle`, `reviewText`, `awaitText`,
 * `wdText`, `sendBody`, the update history's `uh` entries; B7-11 `histAdd`) with the records'
 * values — names, versions and dates are never copied from the boards. What the boards do not word
 * is a provisional entry of the state-copy register (`state-copy-cm-correction.ts`, VD-12). A
 * correction is never "published": it is sent for academic review, then released or held (BC8).
 */
import type { CorrectionEntry } from '@xr/domain';

import { COMPARISON } from './corrections';
import { CORRECTION_ACTIONS } from './flow-state-words';

// ---- CM-05 Published experiment: the correction entry (B6-08) ----------------------------------

/** The three entries and "Open update" (B6-08 `startCorr`, `editCat`, `editDel`, `openUpd`). */
export const CORRECTION_ENTRY = {
  start: 'Start a correction',
  editCatalogue: 'Edit catalogue details',
  editDelivery: 'Edit delivery link',
  openUpdate: CORRECTION_ACTIONS.openUpdate,
} as const;

/** B6-08 f3 `showBack`: the notice after leaving the draft. */
export const BACK_FROM_CORRECTION = {
  title: 'Back from the correction',
  line: 'The live version is unchanged until the Super Admin releases the update.',
} as const;

/** An entry's label by the service's entry name. */
export function entryLabel(entry: CorrectionEntry): string {
  switch (entry) {
    case 'start-a-correction':
      return CORRECTION_ENTRY.start;
    case 'edit-catalogue-details':
      return CORRECTION_ENTRY.editCatalogue;
    case 'edit-delivery-link':
      return CORRECTION_ENTRY.editDelivery;
  }
}

// ---- CM-08 the update (B6-09) ------------------------------------------------------------------

export const UPDATE_PAGE = {
  /** `button.xr-back` (`backPub`). */
  backToPublished: 'Back to the published experiment',
  whyTitle: 'What changes and why',
  whyLabel: 'What changes and why',
  whyHint:
    'The Academic Reviewer reads this first. The Super Admin sees it when deciding on the release.',
  catalogueTitle: 'Catalogue details',
  catalogueLine: 'Pre-filled with the live version. Change only what needs correcting.',
  name: 'Name',
  summary: 'Summary',
  summaryHint: 'One sentence. The first thing people read in the catalogue.',
  description: 'Description',
  deliveryTitle: 'Delivery',
  webLink: 'WEB · web link',
  webHint: 'Starts with https://',
  /** B6-09 “App package fields are provisional (T-14).” without its decision id (P1-14 / VD-10). */
  packageHint: 'App package fields are provisional.',
  versionLabel: 'Version label',
  comparisonTitle: COMPARISON.label,
  nothingChanged: COMPARISON.nothingChanged,
  historyTitle: 'Update history',
  historyMeta: 'Newest first',
  /** `div.xw-flow-foot`: the text button first, then Save draft and the primary. */
  withdraw: 'Withdraw update',
  saveDraft: 'Save draft',
  send: 'Send for academic review',
  /** `div.xw-errsum strong` (also the catalogue's `SUMMARY_TITLES['CM-08']`). */
  checkTitle: 'Check the update',
} as const;

/** "VR · package reference" (B6-09 `FIELDS`; AR and MR follow the VR formula, not drawn). */
export function packageReferenceLabel(format: 'ar' | 'vr' | 'mr'): string {
  return `${format.toUpperCase()} · package reference`;
}

/**
 * The next minor version after the live one, the version label hint's example: 1.2 → 1.3 (B6-09),
 * 2.0 → 2.1; a label that is not "<major>.<minor>" keeps the board's example (state-copy
 * `CM-08.version-example`).
 */
export function exampleVersionAfter(live: string): string {
  const match = /^(\d+)\.(\d+)$/.exec(live.trim());
  return match ? `${match[1]}.${Number(match[2]) + 1}` : '1.3';
}

/** “For example 1.3. The live version is 1.2.” */
export function versionHint(live: string): string {
  return `For example ${exampleVersionAfter(live)}. The live version is ${live}.`;
}

/** `uOver`: “UPD-0005 · correction to Distillation Column (live version 1.2)”. */
export function updateOverline(id: string, name: string, liveVersion: string): string {
  return `${id} · correction to ${name} (live version ${liveVersion})`;
}

/** `uTitle`: “Update to version 1.3”, “Update to version …” before a label. */
export function updateTitle(versionLabel: string | null): string {
  const label = versionLabel?.trim() ?? '';
  return `Update to version ${label === '' ? '…' : label}`;
}

/**
 * `span.xg-live`: “Live version 1.2 unchanged”. The board's template draws the version as its own
 * node, so the inline-flex gap sets it apart; the page renders the pieces the same way.
 */
export const LIVE_UNCHANGED = { before: 'Live version', after: 'unchanged' } as const;

export function liveUnchanged(liveVersion: string): string {
  return `${LIVE_UNCHANGED.before} ${liveVersion} ${LIVE_UNCHANGED.after}`;
}

/** `saveDraft`: “Draft saved · 25 Aug 2026, 15:40 · the live version is unchanged”. */
export function draftSavedLine(at: string): string {
  return `Draft saved · ${at} · the live version is unchanged`;
}

/** The returned reason's meta (`uRetWhen`): “27 Aug 2026, 11:20 · Prof. A. Menon”. */
export function returnedMeta(at: string, by: string): string {
  return `${at} · ${by}`;
}

/** The state notices of B6-09 f3, f5 … f8 (titles drawn; lines composed below). */
export const UPDATE_NOTICES = {
  reviewTitle: 'In academic review',
  awaitingTitle: 'Awaiting release decision',
  holdTitle: 'On hold',
  holdLine: 'The Super Admin put this update on hold. The live version stays as it is.',
  releasedTitle: 'Released',
  releasedLine: 'This version is live for everyone.',
  withdrawnTitle: 'Withdrawn',
} as const;

/**
 * `reviewText`: “With the Academic Reviewer since 25 Aug 2026. Read-only while it is reviewed. The
 * live version 1.2 is unchanged.” The board names the reviewer; the record does not name who it
 * went to (state-copy `CM-08.reviewer-unnamed`).
 */
export function inReviewLine(since: string, liveVersion: string): string {
  return `With the Academic Reviewer since ${since}. Read-only while it is reviewed. The live version ${liveVersion} is unchanged.`;
}

/** `awaitText`: “Approved by Prof. A. Menon on 27 Aug 2026. The Super Admin decides … ”. */
export function awaitingLine(by: string, on: string, liveVersion: string): string {
  return `Approved by ${by} on ${on}. The Super Admin decides whether to release it or put it on hold. Version ${liveVersion} stays live until it is released.`;
}

/** `wdText`: “Withdrawn on 26 Aug 2026: “<reason>” The live version is unchanged. …”. */
export function withdrawnLine(on: string, reason: string): string {
  return `Withdrawn on ${on}: “${reason}” The live version is unchanged. You can start a new correction from the published experiment.`;
}

/** “Version 1.3” in the read-only section head (`span.xr-meta`). */
export function versionMeta(label: string): string {
  return `Version ${label}`;
}

// ---- the update history (B6-09 `uh`; B7-11 `histAdd`) -----------------------------------------

/**
 * “Correction started from Edit catalogue details” (B6-09 f1 `start`), “… from Edit delivery
 * link”; a started correction is “… from the published experiment” (B6-09 f2 … f8, B6-11 f10,
 * f11; state-copy `CM-08.started-from`).
 */
export function startedWhat(entry: CorrectionEntry | null): string {
  if (entry === 'edit-catalogue-details' || entry === 'edit-delivery-link') {
    return `Correction started from ${entryLabel(entry)}`;
  }
  return 'Correction started from the published experiment';
}

/** “Pre-filled with the live version 1.2.” */
export function startedNote(liveVersion: string): string {
  return `Pre-filled with the live version ${liveVersion}.`;
}

export const SENT_WHAT = 'Sent for academic review';

/** “To the Academic Reviewer. The live version 1.2 is unchanged.” (state-copy `CM-08.reviewer-unnamed`). */
export function sentNote(liveVersion: string): string {
  return `To the Academic Reviewer. The live version ${liveVersion} is unchanged.`;
}

export function returnedWhat(by: string): string {
  return `Returned by ${by}`;
}

/** A reason as the history quotes it: “…” in typographic quotes. */
export function quotedReason(reason: string): string {
  return `“${reason}”`;
}

export function approvedWhat(by: string): string {
  return `Approved by ${by}`;
}

/** “With the Super Admin for a release decision. The live version stays 1.2 until then.” */
export function approvedNote(liveVersion: string): string {
  return `With the Super Admin for a release decision. The live version stays ${liveVersion} until then.`;
}

/** B7-11 `histAdd`: “Put on hold by Arjun Mehta”. */
export function heldWhat(by: string): string {
  return `Put on hold by ${by}`;
}

/** “"<reason>" Version 1.2 stays live.” */
export function heldNote(reason: string, liveVersion: string): string {
  return `“${reason}” Version ${liveVersion} stays live.`;
}

export function liftedWhat(by: string): string {
  return `Hold lifted by ${by}`;
}

export const LIFTED_NOTE = 'Waiting for a decision again. Nothing went live.';

export function releasedWhat(by: string): string {
  return `Released by ${by}`;
}

/** “Version 1.3 is live for everyone.” */
export function releasedNote(versionLabel: string): string {
  return `Version ${versionLabel} is live for everyone.`;
}

export const WITHDRAWN_WHAT = 'Withdrawn';

/** “"<reason>" Nothing changed in the live version.” */
export function withdrawnNote(reason: string): string {
  return `“${reason}” Nothing changed in the live version.`;
}

// ---- the dialogs (B6-09 `dlgSend` DL-1, `dlgW` DL-2) -------------------------------------------

export const SEND_DIALOG = {
  title: 'Send for academic review?',
  confirm: 'Send for academic review',
  busy: 'Sending…',
} as const;

/** `sendBody`: “It goes to the Academic Reviewer, then to the Super Admin, … until it is released.” */
export function sendEffect(liveVersion: string): string {
  return `It goes to the Academic Reviewer, then to the Super Admin, who decides when to release it. The live version ${liveVersion} doesn’t change until it is released.`;
}

export const WITHDRAW_DIALOG = {
  title: 'Withdraw this update?',
  /**
   * The drawn effect's first sentence; its second (“The Academic Reviewer sees your reason if it
   * was with them.”) is not said (state-copy `CM-08.withdraw-effect`).
   */
  effect: 'Nothing changes in the live version.',
  reason: 'Reason',
  confirm: 'Withdraw update',
  busy: 'Withdrawing…',
} as const;

// ---- no update (B6-13 f0) ----------------------------------------------------------------------

export const NO_UPDATE = {
  title: 'No update open',
  line: 'Start a correction from a published experiment.',
  action: 'Open the Content library',
} as const;
