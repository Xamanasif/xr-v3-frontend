/**
 * The words of Phase 6’s CM-08 Updates list (board B6-09 f0; B6-13 f2; B7-11 f2) and RV-04 Review
 * an update (B6-04 f0 … f4; B6-13 f4; B7-11 f6). Every phrase is the frozen boards’ own, found
 * verbatim in their markup or script (`review-update.test.ts`); the composed lines take the
 * boards’ forms (B6-09 / B6-04 script `uRows`, `rvOver`, `rvMeta`, `raTitle`, `raBody`,
 * `rDecTitle`, `rDecMeta`, `rDecNext`, the update history’s `uh` entries) with the records’ values
 * — names, ids, codes, versions and dates are never copied from the boards. Status words come from
 * the role-relative table (`flow-state-words.ts` `updateWords`); the comparison’s words are the
 * shared ones (`corrections.ts`). What the boards do not word is a provisional entry of the
 * state-copy register (`state-copy-review-update.ts`, VD-12).
 *
 * P1-14 / VD-10: B6-04 writes a decision id into its open note (“… are still open (T-28).”). The
 * product shows the sentence without it (`STRIPPED_UPDATE`, state-copy `RV-04.decision-ids`); the
 * frozen wording is kept beside it, so the copy stays traceable. A correction is never called
 * “Publish”: it is approved, then released or held by the Super Admin.
 */
import type { UpdateState } from '@xr/domain';

function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? '' : 's'}`;
}

// ---- CM-08 Updates (B6-09 f0) -----------------------------------------------------------------

export const UPDATES_LIST = {
  /** `div.xr-phead-meta > span.xl-meta`. */
  lead: 'The only way to change published content: you → Academic Reviewer → Super Admin release',
  /** `section.xr-section` “Corrections you raised” (its meta is the count). */
  sectionTitle: 'Corrections you raised',
  /** The table’s header row; the last column is visually hidden. */
  columns: {
    update: 'Update',
    status: 'Status · last change',
    with: 'With',
    action: 'Action',
  },
  /** The stacked rows’ labels (`td[data-label]`) below 760 px of content. */
  labels: { status: 'Status', with: 'With' },
  /** The row’s `a.xr-btn--secondary.xr-btn--sm`: hers to continue (draft, returned), else Open. */
  continue: 'Continue',
  open: 'Open',
  /** `uNoRows`: the empty pattern with the Updates icon. */
  emptyTitle: 'You haven’t raised any corrections',
  emptyLine: 'Start one from a published experiment in the Content library.',
  openLibrary: 'Open the Content library',
} as const;

/** Who has the update now (B6-09 script `withw`): hers, the chain’s, or nobody’s (“—”). */
export const WITH_WORDS = {
  you: 'You',
  'academic-reviewer': 'Academic Reviewer',
  'super-admin': 'Super Admin',
  none: '—',
} as const;

/** The section meta (`uCount`): “4 updates”. */
export function updatesCountWords(count: number): string {
  return plural(count, 'update');
}

/** The row’s title (`r.name · r.ver`): “Distillation Column · 1.3”; no label yet: “· —”. */
export function updateLineWords(name: string, versionLabel: string | null): string {
  const label = versionLabel?.trim() ?? '';
  return `${name} · ${label === '' ? WITH_WORDS.none : label}`;
}

/** Hers to continue while a draft or returned (B6-09 script `act`). */
export function continuesUpdate(state: UpdateState): boolean {
  return state === 'draft' || state === 'returned';
}

/** The row action’s name (`aria`): “Continue UPD-0006 Induction Motor Loading”. */
export function updateActionLabel(state: UpdateState, id: string, name: string): string {
  return `${continuesUpdate(state) ? UPDATES_LIST.continue : UPDATES_LIST.open} ${id} ${name}`;
}

// ---- RV-04 Review an update (B6-04 f0 … f4) ---------------------------------------------------

export const REVIEW_UPDATE = {
  /** `rvNone` (B6-13 f4): the H1 when no update waits here, and before one is read. */
  heading: 'Review an update',
  noneTitle: 'No update is waiting for your decision',
  noneLine: 'Corrections from the Content Manager appear in your review queue once they are sent.',
  openQueue: 'Open the review queue',
  /** `section` “Why — from the Content Manager” (`blockquote.xv-quote`). */
  whyTitle: 'Why — from the Content Manager',
  /** `section` “About this experiment · Live · read-only” (`dl.xl-kv.xv-kv`). */
  aboutTitle: 'About this experiment',
  aboutMeta: 'Live · read-only',
  course: 'Course',
  formats: 'Formats',
  liveVersion: 'Live version',
  outcomes: 'Learning outcomes',
  /** `section` “Update history · Newest first” (`ol.xr-timeline`). */
  historyTitle: 'Update history',
  historyMeta: 'Newest first',
} as const;

/**
 * A released update’s comparison columns (B7-05 f6 `cmpWas`, the table SA-11 draws once released):
 * the version its release replaced, then what was released. B6-04 draws no released state
 * (state-copy `RV-04.released`).
 */
export const RELEASED_COLUMNS = { before: 'Live before', after: 'Released' } as const;

/** The overline, upper-cased by CSS (`rvOver`): “UPD-0005 · Update (Content Manager correction)”. */
export function reviewUpdateOverline(id: string): string {
  return `${id} · Update (Content Manager correction)`;
}

/** The H1 (`lName · lVer → uVer`): “Distillation Column · 1.2 → 1.3”. */
export function reviewUpdateTitle(name: string, from: string, to: string | null): string {
  return `${name} · ${from} → ${to ?? ''}`.trimEnd();
}

/**
 * The header’s line (`rvMeta`): “From Kavya Nair · CHE ZG513 · live version 1.2”. A course with no
 * platform code is named by its name; an unknown course is left out (state-copy
 * `RV-04.no-course-code`).
 */
export function reviewUpdateMeta(from: string, course: string | null, liveLabel: string): string {
  return [`From ${from}`, ...(course ? [course] : []), `live version ${liveLabel}`].join(' · ');
}

/** “CHE ZG513 · Process Instrumentation & Control” (`course · cname`); no code: the name. */
export function courseLineWords(code: string | null, name: string): string {
  return code ? `${code} · ${name}` : name;
}

/** “1.2 · since 3 Jul 2026” (`lVer · since lSince`). */
export function liveSinceWords(label: string, since: string): string {
  return `${label} · since ${since}`;
}

/**
 * The B6-04 sentence that carries a decision id (P1-14 / VD-10: “Strip the suffix through a copy
 * table and keep the sentence”): `words` is shown, `drawn` is the frozen board’s wording.
 */
export const STRIPPED_UPDATE = {
  openNote: {
    words:
      'Whether a correction may change formats, and references on update returns, are still open.',
    drawn:
      'Whether a correction may change formats, and references on update returns, are still open (T-28).',
    ids: ['T-28'],
  },
} as const;

/** The update history as the reviewer reads it (B6-04 script `uh`; B7-11 `histAdd`). */
export const UPDATE_HISTORY = {
  /** B6-04 f0: “Correction started from the published experiment” · “Pre-filled with the live version 1.2.” */
  started: 'Correction started from the published experiment',
  startedNote: (liveLabel: string) => `Pre-filled with the live version ${liveLabel}.`,
  sent: 'Sent for academic review',
  /** “To Prof. A. Menon. The live version 1.2 is unchanged.” */
  sentNote: (to: string, liveLabel: string) =>
    `To ${to}. The live version ${liveLabel} is unchanged.`,
  approved: (by: string) => `Approved by ${by}`,
  approvedNote: (liveLabel: string) =>
    `With the Super Admin for a release decision. The live version stays ${liveLabel} until then.`,
  returned: (by: string) => `Returned by ${by}`,
  /** B7-11 `doRelease`: “Released by Arjun Mehta” · “Version 1.3 is live for everyone.” */
  released: (by: string) => `Released by ${by}`,
  releasedNote: (versionLabel: string) => `Version ${versionLabel} is live for everyone.`,
} as const;

/** A reason as the boards quote it: “…”. */
export function quotedWords(text: string): string {
  return `“${text}”`;
}

// ---- RV-04 decision panel (B6-04 f0, f3, f4; DL-1, DL-2) ----------------------------------------

export const UPDATE_DECISION = {
  panelTitle: 'Your decision',
  /** `fieldset.xr-fieldset > legend.xr-sr`. */
  legend: 'Decision',
  approve: {
    title: 'Approve update',
    sub: 'Sends it to the Super Admin, who decides when to release it. The live version doesn’t change until then.',
  },
  return: {
    title: 'Return to the Content Manager',
    sub: 'You’ll add a reason the Content Manager will see.',
  },
  /** DL-1 (`dlgRA`). */
  cancel: 'Cancel',
  approving: 'Approving…',
  /** DL-2 (`dlgRR`). */
  returnTitle: 'Return to the Content Manager?',
  returnEffect: 'The Content Manager sees your reason and can change the update and send it again.',
  reasonLabel: 'Reason the Content Manager will see',
  returning: 'Returning…',
  /** The decided panel (`rDecTitle`, `rDecNext`) and its way back. */
  awaitingTitle: 'Approved — awaiting the Super Admin’s release decision',
  returnedTitle: 'Returned to the Content Manager',
  returnedNext: 'The Content Manager can change it and send it again.',
  withdrawnTitle: 'Withdrawn by the Content Manager',
  nothingTitle: 'Nothing to decide',
  backToQueue: 'Back to the review queue',
  /** The header chip for a withdrawn update (B6-04 script `stw.withdrawn`; `updateWords` leaves it). */
  withdrawnChip: 'Withdrawn',
} as const;

/** DL-1’s title (`raTitle`): “Approve UPD-0005?”. */
export function approveUpdateTitle(id: string): string {
  return `Approve ${id}?`;
}

/**
 * DL-1’s effect (`raBody`): approval sends it on and releases nothing — “It goes to the Super
 * Admin, who decides when to release it. Version 1.2 stays live until then.”
 */
export function approveUpdateEffect(liveLabel: string): string {
  return `It goes to the Super Admin, who decides when to release it. Version ${liveLabel} stays live until then.`;
}

/** The approved panel’s line (`rDecMeta`): “27 Aug 2026 · Prof. A. Menon”. */
export function approvedMetaWords(day: string, by: string): string {
  return `${day} · ${by}`;
}

/** The returned panel’s line (`rDecMeta`): “27 Aug 2026 · “The corrected sentence is right. …”” */
export function returnedMetaWords(day: string, reason: string): string {
  return `${day} · ${quotedWords(reason)}`;
}

/** The approved panel’s next step (`rDecNext`): nothing is released by an approval. */
export function awaitingNextWords(liveLabel: string): string {
  return `Version ${liveLabel} stays live. Release or hold is the Super Admin’s decision.`;
}
