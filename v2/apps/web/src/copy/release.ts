/**
 * The words of the Super Admin's release decision (Phase 6; boards B7-05, B7-10 f0 … f4, B7-11,
 * B7-12): SA-10 Content › Updates and SA-11 Release or hold an update — the last step of the only
 * route for changing published content (Content Manager → Academic Reviewer → Super Admin). Each
 * entry names the place on B7-05 that draws it (its markup, or its script `u7View`); what no
 * board words is a provisional entry of the state-copy register (`state-copy-release.ts`).
 *
 * - **Never “Publish”** (B7-05 notes “Never”; B7-10 “Release vs Publish”): a correction is
 *   released, held, or its hold is lifted. `release.test.ts` keeps the word out of every string.
 * - **Nothing changes any institution’s access** (BC9): the institutions table says so in the
 *   board's own sentence.
 * - B7-05 writes one internal decision id into a visible sentence, “… is still open (T-28).”; the
 *   product shows it without the id (P1-14 / VD-10, as `institutions.ts` `STRIPPED`), keeping the
 *   frozen wording beside it so the copy stays traceable.
 */
import type { UpdateState } from '@xr/domain';
import type { StatusTone } from '@xr/ui';

import type { StrippedSentence } from './institutions';

// ---- SA-10 Content › Updates (B7-05 f0, f2, f3, f4; B7-11 f0) ----

export type ReleaseShowKey = 'waiting' | 'on-hold' | 'released';

export const UPDATES_PAGE = {
  /** `h1.xr-h1`. */
  title: 'Content',
  /** `div.xr-phead-meta > span.xl-meta`. */
  meta: 'Corrections raised by the Content Manager and approved by the Academic Reviewer wait here for release',
  /** `nav.xr-tabs[aria-label]` — the sub-navigation “Updates · All content”. */
  tabsLabel: 'Content',
  /** `section > div.xr-section-head > h2.xr-h2` and its `span.xr-meta`. */
  sectionTitle: 'Corrections to published content',
  sectionMeta: 'Approved by the Academic Reviewer',
  /** `div.xr-tabs[role="tablist"][aria-label]`. */
  showLabel: 'Show',
  /** U7 `FT`: the three tabs, in board order. */
  shows: {
    waiting: 'Waiting for you',
    'on-hold': 'On hold',
    released: 'Released',
  } satisfies Readonly<Record<ReleaseShowKey, string>>,
  /** `table.xr-table > thead` — the action column is named for screen readers only. */
  columns: { update: 'Update', status: 'Status', action: 'Action' },
  /** U7 `act`: “Review” on a waiting row, “Open” on every other. */
  review: 'Review',
  open: 'Open',
  /** U7 `sNoneText` (f4 draws the first). */
  empty: {
    waiting: 'Nothing is waiting for a release decision',
    'on-hold': 'No update is on hold',
    released: 'No update has been released yet',
  } satisfies Readonly<Record<ReleaseShowKey, string>>,
  /** f4 `div.xr-empty > p.xr-body`. */
  emptyLine: 'Corrections reach you after the Academic Reviewer approves them.',
} as const;

/** The status chip of an update the Super Admin may see (U7 `stw`; B7-05 f0, f2, f3). */
export const UPDATE_STATUS = {
  'awaiting-release-decision': { words: 'Waiting for your decision', tone: 'wait' },
  'on-hold': { words: 'On hold', tone: 'paused' },
  released: { words: 'Released', tone: 'ok' },
} as const satisfies Readonly<
  Partial<Record<UpdateState, { readonly words: string; readonly tone: StatusTone }>>
>;

/** “Distillation Column · 1.2 → 1.3” (U7 `name`, `saTitle`): the experiment and its versions. */
export function updateName(experiment: string, from: string, to: string): string {
  return `${experiment} · ${from} → ${to}`;
}

/** “Review UPD-0005 Distillation Column · 1.2 → 1.3” (U7 `aria`). */
export function rowActionLabel(action: string, id: string, name: string): string {
  return `${action} ${id} ${name}`;
}

/** “Approved by the Academic Reviewer on 27 Aug 2026” (U7 `when`, waiting). */
export function approvedOnLine(day: string): string {
  return `Approved by the Academic Reviewer on ${day}`;
}

/** “On hold since 23 Oct 2026” (U7 `when`, on hold). */
export function onHoldSinceLine(day: string): string {
  return `On hold since ${day}`;
}

/** “Released on 23 Oct 2026” (U7 `when`, released). */
export function releasedOnLine(day: string): string {
  return `Released on ${day}`;
}

// ---- SA-11 Release or hold an update (B7-05 f1, f5 … f11; B7-10 f0 … f4) ----

export const DECISION_PAGE = {
  /** `a.xr-back`. */
  back: 'Updates',
  /** `div.xr-section-head` of the comparison once released (U7 `cmpWas`). */
  liveBefore: 'Live before',
  released: 'Released',
  /** f6 `p.xl-meta` under the comparison. */
  liveBeforeNote: '“Live before” is the version that was live until the release.',
  whyTitle: 'Why — from the Content Manager',
  reviewTitle: 'Academic review',
  /** The review section's `span.xr-status--ok`. */
  approved: 'Approved',
  reviewHistoryBelow: 'The full review history is below.',
  institutionsTitle: 'Institutions using it',
  columns: { institution: 'Institution', access: 'Access', students: 'Students', note: 'Note' },
  /** `p.xl-meta` under the institutions table (BC9). */
  institutionsNote:
    'Release changes the experiment for everyone at once. Nothing here changes any institution’s access.',
  historyTitle: 'History',
  historyMeta: 'Newest first · kept after every decision',
  /** `aside.xr-dpanel > h2.xr-dpanel-title`. */
  panelTitle: 'Your decision',
  /** `fieldset > legend.xr-sr`. */
  legend: 'Decision',
  release: 'Release update',
  releaseSub: 'The proposed version goes live for everyone.',
  hold: 'Hold',
  holdSub: 'The live version stays. You can lift the hold later.',
  /** f5: the held panel. */
  onHold: 'On hold',
  liveStays: 'The live version stays as it is.',
  liftHold: 'Lift hold',
  /** f7 `div.xr-notice > span.xr-notice-title`. */
  liftedTitle: 'Hold lifted',
  /** f10 (B7-10 f4): not approved yet — nothing to decide. */
  nothingTitle: 'Release or hold an update',
  nothingHeading: 'Nothing to decide',
  nothingLine:
    'This update hasn’t been approved by the Academic Reviewer yet. It reaches you when it is.',
  backToUpdates: 'Back to Updates',
} as const;

function stripped(drawn: string, board: string): StrippedSentence {
  const ids = [...drawn.matchAll(/ \((T-\d{2})\)/g)].map((match) => match[1]!);
  return { words: drawn.replace(/ \(T-\d{2}\)/g, ''), drawn, ids, board };
}

/** f5 / B7-10 f2 `p.xl-open` in the held panel: open (T-28), said without the id (P1-14). */
export const HOLD_OPEN = stripped(
  'What else a hold affects, and whether it blocks later corrections, is still open (T-28).',
  'B7-05 f5, B7-10 f2 decision panel `p.xl-open`',
);

/** “UPD-0005 · Correction to published content” (U7 `saOver`; `.xr-overline` sets the case). */
export function decisionOverline(id: string): string {
  return `${id} · Correction to published content`;
}

/**
 * “Live now: version 1.2 · since 3 Jul 2026”; once released, “Live now: version 1.3 · released
 * 23 Oct 2026” (U7 `liveLine`).
 */
export function liveLine(version: string, day: string, released: boolean): string {
  return `Live now: version ${version} · ${released ? 'released' : 'since'} ${day}`;
}

/** “The hold was lifted on 24 Oct 2026. It is waiting for your decision again.” (U7 `liftedLine`). */
export function liftedLine(day: string): string {
  return `The hold was lifted on ${day}. It is waiting for your decision again.`;
}

/**
 * “Raised by Kavya Nair, Content Manager · started 25 Aug 2026 · sent for academic review 25 Aug
 * 2026” (U7 `raised`); without the last part while it was never sent (state-copy
 * `SA-11.raised`).
 */
export function raisedLine(
  name: string,
  role: string,
  startedDay: string,
  sentDay: string | null,
): string {
  const raised = `Raised by ${name}, ${role} · started ${startedDay}`;
  return sentDay ? `${raised} · sent for academic review ${sentDay}` : raised;
}

/** “Approved by Prof. A. Menon on 27 Aug 2026” (U7 `reviewLine`). */
export function approvedByLine(name: string, day: string): string {
  return `Approved by ${name} on ${day}`;
}

/** “ACC-0098 · WEB + VR” (U7 `insts[].plan`). */
export function accessCell(planId: string, formats: readonly string[]): string {
  return formats.length > 0 ? `${planId} · ${formats.join(' + ')}` : planId;
}

/**
 * “46 students with access” (U7 `insts[].students`); one Student and none take the forms of the
 * state-copy register (`SA-11.students`).
 */
export function studentsCell(count: number): string {
  if (count === 0) return 'No students with access yet';
  return count === 1 ? '1 student with access' : `${count} students with access`;
}

/** “Access ends 31 Oct 2026 · renewal REQ-0038 under review” (U7 `insts[].note`). */
export function accessEndsNote(day: string, renewal: string | null): string {
  return renewal ? `Access ends ${day} · renewal ${renewal} under review` : `Access ends ${day}`;
}

/** The held panel: “On hold since 23 Oct 2026 · Arjun Mehta” (U7 `holdLine`). */
export function holdLine(day: string, by: string): string {
  return `On hold since ${day} · ${by}`;
}

/** The decided panel: “Released on 23 Oct 2026 · Arjun Mehta” (U7 `relLine`). */
export function releasedLine(day: string, by: string): string {
  return `Released on ${day} · ${by}`;
}

/** “Version 1.3 is live for everyone. The history below keeps …” (U7 `relNext`). */
export function releasedNext(version: string): string {
  return `Version ${version} is live for everyone. The history below keeps the earlier version and every decision.`;
}

/** A reason as the boards quote it: “Hold until …” (U7 `holdReason`). */
export function quoted(text: string): string {
  return `“${text}”`;
}

// ---- The three confirmations (f8 Release · DL-1; f9 Hold · DL-2; Lift hold · DL-1) ----

export const RELEASE_DIALOG = {
  confirm: 'Release update',
  busy: 'Releasing…',
  cancel: 'Cancel',
} as const;

/** “Release UPD-0005?” (U7 `relTitle`). */
export function releaseTitle(id: string): string {
  return `Release ${id}?`;
}

/**
 * “Version 1.3 of Distillation Column goes live for everyone — the public catalogue and every
 * institution that uses it. Version 1.2 is no longer shown.” (U7 `relBody`).
 */
export function releaseEffect(version: string, experiment: string, live: string): string {
  return `Version ${version} of ${experiment} goes live for everyone — the public catalogue and every institution that uses it. Version ${live} is no longer shown.`;
}

export const HOLD_DIALOG = {
  confirm: 'Hold',
  busy: 'Holding…',
  cancel: 'Cancel',
  /** f9 `label.xr-label`. */
  reasonLabel: 'Reason the Content Manager will see',
} as const;

/** “Hold UPD-0005?” (U7 `holdTitle`). */
export function holdTitle(id: string): string {
  return `Hold ${id}?`;
}

/** “Version 1.2 stays live. The update waits until you lift the hold. …” (U7 `holdBody`). */
export function holdEffect(live: string): string {
  return `Version ${live} stays live. The update waits until you lift the hold. The Content Manager sees your reason.`;
}

export const LIFT_DIALOG = {
  confirm: 'Lift hold',
  busy: 'Lifting…',
  cancel: 'Cancel',
  /** U7 `liftBody`. */
  effect: 'It goes back to waiting for your decision. Nothing goes live until you release it.',
} as const;

/** “Lift the hold on UPD-0005?” (U7 `liftTitle`). */
export function liftTitle(id: string): string {
  return `Lift the hold on ${id}?`;
}

// ---- History (B7-05 `uh`, newest first) ----

export const HISTORY = {
  /** “Correction started from the published experiment” · “Pre-filled with the live version 1.2.” */
  started: 'Correction started from the published experiment',
  startedNote: (live: string) => `Pre-filled with the live version ${live}.`,
  /** “Sent for academic review” · “To Prof. A. Menon. The live version 1.2 is unchanged.” */
  sent: 'Sent for academic review',
  sentNote: (reviewer: string, live: string) =>
    `To ${reviewer}. The live version ${live} is unchanged.`,
  /** “Approved by Prof. A. Menon” · “With the Super Admin for a release decision. …” */
  approved: (reviewer: string) => `Approved by ${reviewer}`,
  approvedNote: (live: string) =>
    `With the Super Admin for a release decision. The live version stays ${live} until then.`,
  /** “Put on hold by Arjun Mehta” · ““<reason>” Version 1.2 stays live.” */
  held: (by: string) => `Put on hold by ${by}`,
  heldNote: (reason: string, live: string) => `“${reason}” Version ${live} stays live.`,
  /** “Hold lifted by Arjun Mehta” · “Waiting for a decision again. Nothing went live.” */
  lifted: (by: string) => `Hold lifted by ${by}`,
  liftedNote: 'Waiting for a decision again. Nothing went live.',
  /** “Released by Arjun Mehta” · “Version 1.3 is live for everyone.” */
  released: (by: string) => `Released by ${by}`,
  releasedNote: (version: string) => `Version ${version} is live for everyone.`,
} as const;
