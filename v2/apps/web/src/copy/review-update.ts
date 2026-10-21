/**
 * The words of Phase 6’s CM-08 Updates list (board B6-09 f0; B6-13 f2; B7-11 f2) and RV-04 Review
 * an update (V3: the owner-approved Academic Reviewer export RV-v1; was B6-04 f0 … f4; B6-13 f4;
 * B7-11 f6). Every phrase is its source's own, found verbatim in its markup or script
 * (`review-update.test.ts`); the composed lines take the source's forms with the records’ values
 * — names, ids, codes, versions and dates are never copied from a board or the export. What the
 * sources do not word is a provisional entry of the state-copy register
 * (`state-copy-review-update.ts`, VD-12). A correction is never called “Publish”: it is approved,
 * then released or held by the Super Admin.
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

// ---- RV-04 Review an update (V3: RV-v1 `RV.dc.html` item view for an update) -------------------
//
// The owner-approved Academic Reviewer export (design/v3-refined-b/roles/RV-v1, `RV.dc.html`
// template lines ~398–664 and the Approve dialog ~778, script `itemVals`): every phrase is the
// export's own (`review-update.test.ts` pins each against `rvExport('RV.dc.html')`); the composed
// lines take the script's forms with the records' values. No reference (UPD-…) is ever part of
// these words (the owner's identifier rule): the page, its crumb and its dialog are named by the
// experiment. A correction is never called “Publish”: it is approved, then released or held by the
// Super Admin.

//
// What a submission and an update both draw (the sender, the shared facts, the panel's frame, the
// status words, the refusal titles) is in `rv-shared.ts`; this module holds the update's own.

/** The identity card's update facts (`facts` for an update) and the page map (`anchors`). */
export const UPDATE_CARD = {
  liveVersion: 'Live version',
  proposedVersion: 'Proposed version',
  anchors: {
    why: 'Why this correction',
    changes: 'What changes',
    live: 'Live experiment',
    history: 'Update history',
  },
} as const;

/** “1.2 · since 3 Jul” (`R.liveVer + ' · since ' + short(R.liveSince)`). */
export function liveSinceFact(label: string, since: string): string {
  return `${label} · since ${since}`;
}

/** “Why this correction” (`#rv-s-why`): the Content Manager's reason, quoted. */
export const WHY_BLOCK = {
  title: 'Why this correction',
  note: 'From the Content Manager',
} as const;

/** Under the reason (`whyBy`): “Kavya Nair, Content Manager · sent 25 Aug 2026, 16:00”. */
export function whyByWords(name: string, sent: string | null): string {
  return sent ? `${name}, Content Manager · sent ${sent}` : `${name}, Content Manager`;
}

/** “What changes” (`#rv-s-cmp`): live now beside proposed, the changed fields only. */
export const CHANGES_BLOCK = {
  title: 'What changes',
  tableLabel: 'What changes, live now against proposed',
  field: 'Field',
  footnote: 'Removed text is struck through; added text is highlighted.',
} as const;

/** The block's note (`cmpNote`): “3 changed fields · everything else stays as in 1.2”. */
export function changesNoteWords(count: number, liveLabel: string): string {
  return `${plural(count, 'changed field')} · everything else stays as in ${liveLabel}`;
}

/** A column (`Live now · {{ I.liveVer }}`, `Proposed · {{ I.newVer }}`): “Live now · 1.2”. */
export function columnWords(column: string, label: string | null): string {
  return label ? `${column} · ${label}` : column;
}

/** The columns while the update is not released (the export's own). */
export const CHANGES_COLUMNS = { before: 'Live now', after: 'Proposed' } as const;

/**
 * A released update's columns (B7-05 f6 `cmpWas`, the table SA-11 draws once released): the
 * version its release replaced, then what was released. The export draws no released update page
 * (state-copy `RV-04.released`).
 */
export const RELEASED_COLUMNS = { before: 'Live before', after: 'Released' } as const;

/** “The live experiment” (`#rv-s-live`): the live version's outcomes, read-only (OD-B6-09). */
export const LIVE_BLOCK = {
  kicker: 'Read-only context',
  title: 'The live experiment',
  footnote: 'Learning outcomes are not part of this correction.',
} as const;

/** The block's note (`liveNote`): “Version 1.2 · live since 3 Jul 2026”. */
export function liveNoteWords(label: string, since: string): string {
  return `Version ${label} · live since ${since}`;
}

/** “Learning outcomes in version 1.2” (`h3.rv-mini-h`). */
export function liveOutcomesTitle(label: string): string {
  return `Learning outcomes in version ${label}`;
}

/** The update history as the reviewer reads it (B6-04 script `uh`; B7-11 `histAdd`). */
export const UPDATE_HISTORY = {
  /** “Correction started from the published experiment” · “Pre-filled with the live version 1.2.” */
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

/** A reason as the export quotes it: “…”. */
export function quotedWords(text: string): string {
  return `“${text}”`;
}

// ---- RV-04 decision panel (`#rv-panel`) ---------------------------------------------------------

/** The panel's words for an update (`itemVals` `ready`, `choices`, `reasonLabel`, `path`). */
export const UPDATE_DECISION = {
  /** “Before you decide”: the whole update. */
  wholeTitle: 'Whole update.',
  wholeLine: 'You decide on every changed field together.',
  seeChanges: 'See what changes',
  /** The error when the button is pressed without a choice (`validate`: `e.choice`). */
  chooseDecision: 'Choose a decision',
  approve: {
    title: 'Approve update',
    sub: 'Sends it to the Super Admin, who decides when to release it. The live version doesn’t change until then.',
  },
  return: {
    title: 'Return to the Content Manager',
    sub: 'You’ll add a reason the Content Manager will see.',
  },
  /** The reason, inline in the panel (no references on update returns, T-28). */
  reasonLabel: 'Reason the Content Manager will see (required)',
  reasonHint: 'Shown first on the correction when it is editable again.',
  /** The pending line before the button while the reason is empty (`pending.reason`). */
  pendingReason: 'Add the reason before you return it.',
  /** While a command runs (product: repeat-press protection; the export draws no busy label). */
  approving: 'Approving…',
  returning: 'Returning…',
  /** “What happens next” for an update (`path`). */
  path: {
    youLine: 'Approve the update, or return it to the Content Manager.',
    superAdmin: { title: 'Super Admin · release or hold', line: 'Approving does not release it.' },
    liveTitle: 'Live version',
  },
} as const;

/** “Version 1.2 stays live” · “until the Super Admin releases 1.3.” (`ready`, `#rvi-live`). */
export function staysLiveTitle(liveLabel: string): string {
  return `Version ${liveLabel} stays live`;
}
export function staysLiveLine(newLabel: string): string {
  return `until the Super Admin releases ${newLabel}.`;
}

/** “3 changed fields.” (`ready`, `#rvi-update`). */
export function changedFieldsTitle(count: number): string {
  return `${plural(count, 'changed field')}.`;
}

/** The path's last step (`path[2].d`): “Version 1.2 stays live until a release. …”. */
export function livePathLine(liveLabel: string): string {
  return `Version ${liveLabel} stays live until a release. Releasing changes no one’s access.`;
}

/** The Approve dialog (`rk-dialog`, `dlgTitle` for an update, `nowList`, `laterList`). */
export const APPROVE_DIALOG = {
  /** The update's first “What happens now” line (the second is `RV_APPROVE_DIALOG.leavesQueue`). */
  toSuperAdmin: 'It goes to the Super Admin for a release decision.',
  noAccessChange: 'Releasing changes no one’s access.',
  confirm: 'Approve update',
  cancel: 'Cancel',
} as const;

/** The dialog's title, named by the experiment (`dlgTitle`): “Approve the update to <name>?”. */
export function approveUpdateTitle(name: string): string {
  return `Approve the update to ${name}?`;
}

/** “Version 1.3 goes live only if the Super Admin releases it. Version 1.2 stays live until then.” */
export function goesLiveLater(newLabel: string, liveLabel: string): string {
  return `Version ${newLabel} goes live only if the Super Admin releases it. Version ${liveLabel} stays live until then.`;
}

/** The refusal notice's line when withdrawn under the page (`refusalD`; titles in `RV_REFUSAL`). */
export const UPDATE_REFUSAL = {
  withdrawnLine:
    'The Content Manager withdrew this update after you opened it. The page now shows where it stands.',
} as const;

// ---- RV-04 / RV-06 the outcome block (`rk-done`) ------------------------------------------------

/** The outcome block for an update (`doneBlock` for `upd`). */
export const UPDATE_OUTCOME = {
  stand: {
    returned: 'Returned to the Content Manager',
    release: 'Release',
    releaseDecision: 'Release decision',
    withTheSuperAdmin: 'With the Super Admin',
    liveVersion: 'Live version',
    unchanged: 'Unchanged',
    update: 'Update',
    withdrawn: 'Withdrawn by the Content Manager',
  },
  returnedNext: 'The Content Manager can change it and send it again.',
  withdrawnNext: 'There is nothing to decide.',
} as const;

/**
 * Another reviewer's decision (a shared course scope; the export draws only the reader's own):
 * “Decided by Prof. R. Iyer on 27 Aug 2026, 11:20” (state-copy `RV-04.decided-by`).
 */
export function decidedByOn(name: string, when: string): string {
  return `Decided by ${name} on ${when}`;
}

/** Another reviewer's approval in the stand list (state-copy `RV-04.decided-by`). */
export function approvedBy(name: string): string {
  return `Approved by ${name}`;
}

/** “Released on 5 Aug 2026” (`'Released on ' + R.relWhen`). */
export function releasedOnWords(day: string): string {
  return `Released on ${day}`;
}

/** “1.2, unchanged” (`R.liveVer + ', unchanged'`). */
export function unchangedLive(label: string): string {
  return `${label}, unchanged`;
}

/** Released (`next`): “Version 1.1 is live. Releasing changed no one’s access.”. */
export function releasedNextWords(label: string): string {
  return `Version ${label} is live. Releasing changed no one’s access.`;
}

/** Awaiting the release decision (`next`): nothing is released by an approval. */
export function awaitingNextWords(liveLabel: string): string {
  return `Version ${liveLabel} stays live. Release or hold is the Super Admin’s decision.`;
}

// ---- RV-04 not sent yet (product words, kept: lead decision 3, state-copy `RV-04.not-sent`) ------

/**
 * An update the service keeps from the reviewer (a draft, UPD-16): the product's existing words
 * (B6-04 `rvNone`, B6-13 f4), drawn as the delivered XS message page; nothing about the draft.
 */
export const NOT_SENT = {
  /** Before the update is read, and the tab's title while nothing is shown. */
  heading: 'Review an update',
  title: 'No update is waiting for your decision',
  line: 'Corrections from the Content Manager appear in your review queue once they are sent.',
  openQueue: 'Open the review queue',
} as const;
