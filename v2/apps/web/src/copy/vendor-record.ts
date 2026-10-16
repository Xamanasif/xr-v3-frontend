/**
 * The words of Phase 5’s VE-07 Experiment record and VE-13 History (board B5-06 f0 … f10; the same
 * record on B5-08 f2 and B6-12 f4). Every phrase is the frozen board’s own, found verbatim in its
 * markup or script (`vendor-record.test.ts`); the composed lines take the board’s forms (its script
 * `vxView`: `recMeta`, `cCourse`, `cPreview`, `cDocs`, `delivery`, `hist`) with the record’s
 * values — names, ids and dates are never copied from the board. What B5-06 does not word is a
 * provisional entry of the state-copy register (`state-copy-vendor-record.ts`, VD-12). The status
 * chip’s words are the shared role-relative table’s (`flow-state-words.ts`); the returned block is
 * the editor’s `ReturnedNotice` with its words (`vendor-editor.ts`, B5-06 f3 / B5-07 f0 alike).
 */
import type { Technology } from '@xr/domain';

import { formatName } from './flow-state-words';
import { stateWords } from './state-copy';

export const RECORD = {
  /** `div.xr-section-head > h2` of the three sections (f0). */
  details: 'Details',
  outcomes: 'Learning outcomes',
  history: 'Submission and version history',
  /** `span.xr-meta` beside the history heading. */
  historyMeta: 'Newest first · not an audit log',
  /** `span.xr-meta` beside the outcomes heading, after the lock. */
  outcomesMeta: 'Added by the Academic Reviewer · read-only',
  outcomesLead: 'One set for every format.',
  outcomesNone:
    'None yet. The Academic Reviewer adds them during review — one set for every format.',
  /** `dl.xl-kv.xv-kv` keys of Details (f0). */
  keys: {
    course: 'Course',
    summary: 'Summary',
    description: 'Description',
    version: 'Version',
    formats: 'Formats',
    preview: 'Preview',
    documents: 'Documents',
  },
  /** `h3.xr-h3` above the per-format boxes. */
  delivery: 'Delivery',
  /** `div.xv-deliv-head` titles (script `d.title`). */
  webLinkTitle: 'Web link',
  appPackageTitle: 'App package',
  /** `div.xv-deliv` rows (script `d.rows`). */
  rows: {
    webLink: 'Web link',
    browserAndComputer: 'Browser and computer',
    notes: 'Notes',
    packageLabel: 'Package label',
    packageReference: 'Package reference',
    packageFile: 'Package file',
    deviceNeeded: 'Device needed',
    installNotes: 'Install notes',
  },
  /** An empty value (script `cPreview` / `cDocs` “None”, delivery rows “—”). */
  none: 'None',
  dash: '—',
  /** Script `cCourse` with no course chosen. */
  notChosen: 'Not chosen yet',
  /** f9 `span.xr-status--paused`. */
  draftReadOnly: 'Draft · read-only',
  /** f3 / f6 `span.xr-status--err`; also after an override (state-copy `VE-07.returned-by-override`). */
  returnedChip: 'Returned',
  /** The returned block’s action (f3, f6) — the block itself is the editor’s `ReturnedNotice`. */
  revise: 'Revise & resubmit',
  /** The banner by state (doc “Banner by state”; f0 … f9). */
  banner: {
    draftTitle: 'Draft — only you can see it',
    draftLine: 'Finish it and submit it for academic review.',
    editDraft: 'Edit draft',
    withReviewerTitle: 'With the Academic Reviewer',
    withReviewerLine:
      'Nothing is needed from you now. You can edit it again only if it is returned to you.',
    submittedTitle: 'Submitted',
    submittedLine: 'Your changes have been submitted for review. Nothing is needed from you now.',
    recheckTitle: 'Back with the Academic Reviewer for a re-check',
    recheckLine:
      'The Content Manager asked the Academic Reviewer to look at it again. Nothing is needed from you.',
    withContentManagerTitle: 'With the Content Manager',
    publishedLine: 'It is live in the catalogue with the formats below. It is read-only here.',
  },
} as const;

/** The history entries’ words (script `hist`, f0 … f9; the editor’s `saveDraft` / `doSubmit`). */
export const HISTORY = {
  draftSaved: 'Draft saved',
  draftSavedNote: 'Only you can see a draft.',
  submitted: 'Submitted for academic review',
  submittedNote: 'With the Academic Reviewer. Nothing is published.',
  returned: 'Returned with a reason',
  approved: 'Approved by the Academic Reviewer',
  approvedNote: 'With the Content Manager.',
  resubmittedNote: 'Your changes have been submitted for review.',
  routedNote: 'Routed by the approved workflow rule.',
  recheck: 'Back with the Academic Reviewer for a re-check',
  recheckNote: 'Sent back by the Content Manager. Nothing is needed from you.',
  published: 'Published by the Content Manager',
} as const;

/** Who returned it, as the board names the role (`retBy` “Returned by the …”, `hist` “…: “…””). */
export const RETURNING_ROLE = {
  'academic-reviewer': 'Academic Reviewer',
  'content-manager': 'Content Manager',
} as const;

/**
 * The overline (`span.xr-overline`, script `recMeta`): “SUB-0077 · ME ZG523 · revision 2” — the
 * revision only after a resubmit (f0, f4). A course without a platform code is named; no course
 * reads “—” (state-copy `VE-07.course-words`).
 */
export function recordOverline(id: string, course: string | null, revision: number): string {
  return `${id} · ${course ?? RECORD.dash}${revision > 1 ? ` · revision ${revision}` : ''}`;
}

/** Details › Course (script `cCourse`): “ME ZG523 · Thermodynamics & Heat Transfer”. */
export function courseWords(
  course: { readonly code: string | null; readonly name: string } | null,
) {
  if (!course) return RECORD.notChosen;
  return course.code ? `${course.code} · ${course.name}` : course.name;
}

/**
 * Details › Preview (script `cPreview`): “Two-minute walkthrough — https://…”; “None” without
 * one. A link without a label shows the link (OD-B5-08; state-copy `VE-07.preview-link-only`).
 */
export function previewWords(preview: {
  readonly label: string | null;
  readonly link: string | null;
}): string {
  const label = preview.label?.trim() ?? '';
  const link = preview.link?.trim() ?? '';
  if (label) return link ? `${label} — ${link}` : label;
  return link || RECORD.none;
}

/** Details › Documents (script `cDocs`): the file names, “ · ” between; “None” without one. */
export function documentsWords(documents: readonly { readonly fileName: string }[]): string {
  return documents.length > 0
    ? documents.map((document) => document.fileName).join(' · ')
    : RECORD.none;
}

/** An empty field reads “—” (script `delivery` rows). */
export function valueOrDash(value: string | null | undefined): string {
  const trimmed = value?.trim() ?? '';
  return trimmed === '' ? RECORD.dash : trimmed;
}

/** The With Content Manager banner’s line (f5), with the approval day. */
export function withContentManagerLine(approvedOn: string): string {
  return `Approved by the Academic Reviewer on ${approvedOn}. The Content Manager decides whether to publish it. Nothing is needed from you now.`;
}

/** The published banner’s title (f8): “Published · 30 Jul 2026”. */
export function publishedTitle(on: string): string {
  return `Published · ${on}`;
}

/** f8 Details lead: “Formats published: WEB · VR. Changes to … are not made from the Vendor workspace.” */
export function formatsPublishedLine(formats: readonly Technology[]): string {
  return `Formats published: ${formats.map(formatName).join(' · ')}. Changes to a published experiment are not made from the Vendor workspace.`;
}

/** f9 banner title: “MEL ZG512 is no longer assigned to you”. */
export function courseWithdrawnTitle(course: string): string {
  return `${course} is no longer assigned to you`;
}

/**
 * f9 banner line without the withdrawal day, which the record’s read does not carry
 * (state-copy `VE-07.course-withdrawn.line` / `.returned`).
 */
export function courseWithdrawnLine(organisation: string, state: 'draft' | 'returned'): string {
  const words = stateWords(
    state === 'draft' ? 'VE-07.course-withdrawn.line' : 'VE-07.course-withdrawn.returned',
  );
  return words.replace('{organisation}', organisation);
}

/** History: “Submitted · revision 2” (f0, f4). */
export function resubmittedWhat(revision: string): string {
  return `Submitted · revision ${revision}`;
}

/** History: “With Academic Reviewer · revision 2” (f0; shown once the record moves on, VE-13.routed). */
export function routedWhat(revision: string): string {
  return `With Academic Reviewer · revision ${revision}`;
}

/**
 * History: the return’s note — the role and the reason’s first sentence, “…” where more follows
 * (f3 “Academic Reviewer: “Please clarify the VR device requirements.””; f6 “Content Manager: “The
 * summary runs to three sentences…””; state-copy `VE-13.reason-note`).
 */
export function returnedNote(by: keyof typeof RETURNING_ROLE, reason: string): string {
  const text = reason.trim();
  const first = /^(.+?[.!?])\s+\S/.exec(text);
  const shown = first ? `${first[1]!.replace(/[.!?]$/, '')}…` : text;
  return `${RETURNING_ROLE[by]}: “${shown}”`;
}

/**
 * History: the publication’s note, f8 “WEB and VR are live in the catalogue.” — one format and
 * three or more are the state-copy register’s (`VE-13.published-note`).
 */
export function publishedNote(formats: readonly Technology[]): string {
  const names = formats.map(formatName);
  if (names.length === 1) return stateWords('VE-13.published-one').replace('{format}', names[0]!);
  const list =
    names.length > 2
      ? `${names.slice(0, -1).join(', ')} and ${names.at(-1)!}`
      : names.join(' and ');
  return `${list} are live in the catalogue.`;
}
