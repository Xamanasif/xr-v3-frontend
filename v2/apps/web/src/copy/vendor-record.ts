/**
 * The words of VE-07 Experiment record and VE-13 Submission and version history, as the
 * owner-approved Vendor export draws them (design/v3-refined-b/roles/VE-v1, `project/Main.dc.html`
 * record view `V.record`, its script `recView` and HANDOFF §2–§3). Every phrase is the export's
 * own, found verbatim in its markup or script (`vendor-record.test.ts`); the composed lines take
 * the script's forms (`recView`: `eyebrow`, `meta`, `intro`, `pendingText`, `histPendingNote`,
 * `stand`, `deliv`) with the record's values — names and dates are never copied from the export,
 * and no line carries the submission's reference (owner's identifier rule, 22 Oct 2026; state-copy
 * `VE-02.no-reference`). What the export does not word is a provisional entry of the state-copy
 * register (`state-copy-vendor-record.ts`, VD-12). The status pill's words are the shared
 * role-relative table's (`flow-state-words.ts`); the reference chips name a field as the editor
 * does (`vendor-editor.ts` `referenceWords`).
 */
import type { Technology } from '@xr/domain';

import { formatName } from './flow-state-words';
import { stateWords } from './state-copy';

export const RECORD = {
  /** The tabs (`nav.rk-tabs[aria-label]`, `a.rk-tab`). */
  tabsLabel: 'Experiment record',
  tabs: {
    details: 'Details',
    history: 'Submission and version history',
  },
  /** The head's one action (`div.rk-head-act`; `actLabel`). */
  editDraft: 'Edit draft',
  revise: 'Revise and resubmit',
  continueRevising: 'Continue revising',
  /** The read-only notice's action (`div.rk-notice-act`). */
  askForHelp: 'Ask for help',
  /** The failed read's line and action — the export's failed state (VE-02 `rk-state`). */
  failedLine: 'Nothing has changed. Try again.',
  tryAgain: 'Try again',
  /** The returned-reason panel (`div.vr-ret-refs`, `div.vr-ret-pend`). */
  refersTo: 'What it refers to',
  savedTitle: 'Your changes are saved but not resubmitted',
  /** The Details sheet's sections (`h2.vr-sec-t`). */
  sections: {
    course: 'Course and description',
    delivery: 'Formats and delivery',
    preview: 'Preview and documents',
    outcomes: 'Learning outcomes',
  },
  /** `dl.rk-dl` keys of the sections. */
  keys: {
    course: 'Course',
    summary: 'Summary',
    description: 'Description',
    version: 'Version',
    preview: 'Preview',
    documents: 'Documents',
  },
  /** The published delivery's foot (`p.vr-foot`). */
  publishedFoot: 'Changes to a published experiment are not made from the Vendor workspace.',
  /** `p.vr-sec-st` beside the outcomes heading. */
  outcomesMeta: 'Added by the Academic Reviewer · read-only',
  outcomesLead: 'One set for every format.',
  outcomesNone:
    'None yet. The Academic Reviewer adds them during review — one set for every format.',
  /** The read-only delivery blocks (script `deliv`): the format's name and kind. */
  formatNames: {
    web: 'Browser',
    ar: 'Augmented reality',
    vr: 'Virtual reality',
    mr: 'Mixed reality',
  },
  webLinkKind: 'Web link',
  appPackageKind: 'App package',
  /** The blocks' rows (script `deliv` `rows`). */
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
  /** An empty value (script `preview` / `docs` “None”, rows and fields “—”). */
  none: 'None',
  dash: '—',
  /** Details › Course with no course chosen (the editor review's `cCourse`). */
  notChosen: 'Not chosen yet',
  /** “Where it stands” (`h2.vr-ws-t`) and its terms (script `stand`). */
  stand: {
    title: 'Where it stands',
    formats: 'Formats',
    revision: 'Revision',
    lastSubmitted: 'Last submitted',
    returned: 'Returned',
    approved: 'Approved by the Academic Reviewer',
    published: 'Published',
    lastChange: 'Last change',
  },
  /** The history tab (`section.vr-hist`): its heading and note. */
  history: 'Submission and version history',
  historyMeta: 'Newest first · not an audit log',
  /** The status pill of a draft in a withdrawn course (`STL.readonly`). */
  draftReadOnly: 'Draft · read-only',
  /** The pill after a Super Admin override (state-copy `VE-07.returned-by-override`). */
  returnedPill: 'Returned',
  /** The notice by state (`N`; HANDOFF §2 “Record notice”). */
  notice: {
    draftTitle: 'Draft — only you can see it',
    draftLine: 'Finish it and submit it for academic review.',
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

/** The history entries’ words (the export's `hist` entries; HANDOFF §2). */
export const HISTORY = {
  draftSaved: 'Draft saved',
  draftSavedNote: 'Only you can see a draft.',
  submitted: 'Submitted for academic review',
  submittedNote: 'With the Academic Reviewer. Nothing is published.',
  returned: 'Returned with a reason',
  approved: 'Approved by the Academic Reviewer',
  approvedNote: 'With the Content Manager.',
  resubmittedNote: 'Your changes have been submitted for review.',
  recheck: 'Back with the Academic Reviewer for a re-check',
  recheckNote: 'Sent back by the Content Manager. Nothing is needed from you.',
  published: 'Published by the Content Manager',
} as const;

/** Who returned it, as the export names the role (`ret.by`, the history notes). */
export const RETURNING_ROLE = {
  'academic-reviewer': 'Academic Reviewer',
  'content-manager': 'Content Manager',
} as const;

/**
 * The head's eyebrow (`p.rk-eyebrow`): “Experiment” — the script's `eyebrow` (“Experiment · ” and
 * the submission's reference) without the reference (state-copy `VE-02.no-reference`).
 */
export const RECORD_EYEBROW = 'Experiment';

/** The head's “Revision 2” (script `meta`; not for a draft). */
export function revisionMeta(revision: number): string {
  return `Revision ${revision}`;
}

/** The head's “Last change 24 Aug 2026” (script `meta`). */
export function lastChangeMeta(on: string): string {
  return `Last change ${on}`;
}

/** Details › Course (`courseLong`): “ME ZG523 · Thermodynamics & Heat Transfer”. */
export function courseWords(
  course: { readonly code: string | null; readonly name: string } | null,
): string {
  if (!course) return RECORD.notChosen;
  return course.code ? `${course.code} · ${course.name}` : course.name;
}

/**
 * Details › Preview (script `preview`): “Two-minute walkthrough — https://…”; “None” without
 * one. A link without a label is allowed and shows (OD-B5-08; state-copy
 * `VE-07.preview-link-only`).
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

/** Details › Documents (script `docs`): the file names, “ · ” between; “None” without one. */
export function documentsWords(documents: readonly { readonly fileName: string }[]): string {
  return documents.length > 0
    ? documents.map((document) => document.fileName).join(' · ')
    : RECORD.none;
}

/** An empty value reads “—” (script `T(x) || '—'`). */
export function valueOrDash(value: string | null | undefined): string {
  const trimmed = value?.trim() ?? '';
  return trimmed === '' ? RECORD.dash : trimmed;
}

/** The format chips' name (`fmtAria`): “Formats: WEB, AR”, or “Formats: none chosen”. */
export function formatsLabel(formats: readonly Technology[]): string {
  return `Formats: ${formats.map(formatName).join(', ') || 'none chosen'}`;
}

/** Details › Formats and delivery, published (`p.vr-sec-st`): “Formats published: WEB · VR”. */
export function formatsPublishedLine(formats: readonly Technology[]): string {
  return `Formats published: ${formats.map(formatName).join(' · ')}`;
}

/** “Revise: go to Formats & delivery · AR · Device need” (a reference chip's name, `x.aria`). */
export function reviseGoToLabel(reference: string): string {
  return `Revise: go to ${reference}`;
}

/**
 * The saved, not resubmitted changes (`pendingText`): “Saved 27 Aug 2026, 10:40. Only you can see
 * them. Everyone else still sees revision 1 as it was submitted.”
 */
export function savedChangesLine(at: string, revision: number): string {
  return `Saved ${at}. Only you can see them. Everyone else still sees revision ${revision} as it was submitted.`;
}

/** The history's private-changes note (`histPendingNote`). */
export function historyPrivateNote(at: string): string {
  return `Your changes saved on ${at} are not part of this history until you resubmit.`;
}

/** Which version Details shows (`p.vr-intro`, script `intro`). */
export const INTRO = {
  /** “Your draft as last saved on 25 Aug 2026, 17:20. Nothing here has been submitted.” */
  draft: (at: string) => `Your draft as last saved on ${at}. Nothing here has been submitted.`,
  /** “Your draft as last saved on 12 Aug 2026, 14:00. It can’t be changed or submitted.” */
  readOnly: (at: string) => `Your draft as last saved on ${at}. It can’t be changed or submitted.`,
  /** “The published version, live in the catalogue since 30 Jul 2026.” */
  published: (on: string) => `The published version, live in the catalogue since ${on}.`,
  /** “Revision 1 as it was submitted on 18 Aug 2026.” */
  submitted: (revision: number, on: string | null) =>
    `Revision ${revision} as it was submitted${on ? ` on ${on}` : ''}.`,
  /**
   * Changes saved and not resubmitted: the Vendor's read holds the saved changes, so Details shows
   * them (state-copy `VE-07.intro.saved-changes`).
   */
  savedChanges: (at: string) => stateWords('VE-07.intro.saved-changes').replace('{at}', at),
} as const;

/** “Where it stands” › Returned (script `stand`): “24 Aug 2026 · Academic Reviewer”. */
export function returnedStandWords(on: string, by: keyof typeof RETURNING_ROLE): string {
  return `${on} · ${RETURNING_ROLE[by]}`;
}

/** The With Content Manager notice's line, with the approval day. */
export function withContentManagerLine(approvedOn: string): string {
  return `Approved by the Academic Reviewer on ${approvedOn}. The Content Manager decides whether to publish it. Nothing is needed from you now.`;
}

/** The published notice's title: “Published · 30 Jul 2026”. */
export function publishedTitle(on: string): string {
  return `Published · ${on}`;
}

/** The read-only notice's title: “MEL ZG512 is no longer assigned to you”. */
export function courseWithdrawnTitle(course: string): string {
  return `${course} is no longer assigned to you`;
}

/**
 * The read-only notice's line without the withdrawal day, which the record’s read does not carry
 * (state-copy `VE-07.course-withdrawn.line` / `.returned`).
 */
export function courseWithdrawnLine(organisation: string, state: 'draft' | 'returned'): string {
  const words = stateWords(
    state === 'draft' ? 'VE-07.course-withdrawn.line' : 'VE-07.course-withdrawn.returned',
  );
  return words.replace('{organisation}', organisation);
}

/** History: “Submitted · revision 2” (HANDOFF §2: the neutral words after a resubmit). */
export function resubmittedWhat(revision: string): string {
  return `Submitted · revision ${revision}`;
}

/**
 * History: the return’s note — the role and the reason’s first sentence, “…” where more follows
 * (“Academic Reviewer: “Please clarify the VR device requirements.””; “Content Manager: “The
 * summary runs to three sentences…””; state-copy `VE-13.reason-note`).
 */
export function returnedNote(by: keyof typeof RETURNING_ROLE, reason: string): string {
  const text = reason.trim();
  const first = /^(.+?[.!?])\s+\S/.exec(text);
  const shown = first ? `${first[1]!.replace(/[.!?]$/, '')}…` : text;
  return `${RETURNING_ROLE[by]}: “${shown}”`;
}

/**
 * History: the publication’s note, “WEB and VR are live in the catalogue.” — one format and three
 * or more are the state-copy register’s (`VE-13.published-one`).
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
