/**
 * The words of Phase 5’s CM-03 Publication decision (board B6-07 f0 … f5; B6-11 f4 … f8; B6-12
 * f3) and CM-05 Published experiment (board B6-08 f0 … f2, f4; B6-11 f9). Every phrase is the
 * frozen boards’ own, found verbatim in their markup or script (`cm-decision.test.ts`); the
 * composed lines take the boards’ forms (B6-07 `cmMeta`, `revLine`, `reviewLine`, `checks`,
 * `blockText`, `pBody`, `pubWhen`, `pubLine`, `cmSentMeta`, the history’s `sh` entries; B6-08
 * `pubOver`, `progTitle`, `progBody`, `dhist`) with the records’ values — names, codes, dates and
 * counts are never copied from the boards. What the boards do not word is a provisional entry of
 * the state-copy register (`state-copy-cm-decision.ts`, VD-12).
 */
import type { ReturnReference } from '@xr/domain';

import { stateWords } from './state-copy';

/** “1 outcome”, “3 outcomes” (the boards’ `plural`). */
function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? '' : 's'}`;
}

/**
 * Formats as B6-07 joins them in a sentence (`chosen.join(' and ')`): “WEB”, “WEB and VR”. Three or
 * more read “WEB, AR and VR” (state-copy `CM-03.format-sentence`).
 */
export function formatsSentence(codes: readonly string[]): string {
  if (codes.length <= 2) return codes.join(' and ');
  return `${codes.slice(0, -1).join(', ')} and ${codes.at(-1)}`;
}

// ---- CM-03 Publication decision (B6-07) --------------------------------------------------------

export const DECISION_PAGE = {
  /** The page’s sections, in the board’s order (AR-4 main column). */
  previewTitle: 'Catalogue preview',
  previewMeta: 'As the public will see it · only formats that passed review',
  /** `span.xg-preview-tag`. */
  previewTag: 'Preview — not public yet',
  availableIn: 'Available in',
  /** `h4.xg-preview-h`. */
  previewOutcomes: 'Learning outcomes',
  noOutcomes: 'None yet.',
  previewFormats: 'Formats and device needs',
  columnFormat: 'Format',
  columnHow: 'How it runs',
  columnDevice: 'Device needs',
  checkTitle: 'Publication check',
  checkMeta: 'Read from the record',
  summaryTitle: 'Submission and review summary',
  fromVendor: 'From the vendor',
  submissions: 'Submissions',
  academicReview: 'Academic review',
  version: 'Version',
  description: 'Description',
  columnDelivery: 'Delivery',
  columnStatus: 'Status',
  /** `fmtRows.how`. */
  webLink: 'Web link',
  appPackage: 'App package (provisional — T-14)',
  /** `fmtRows.state`. */
  formatPublished: 'Published',
  formatPassed: 'Passed review',
  formatInReview: 'In review',
  /** `p.xl-open` under the format table. */
  allFormats:
    'The Experiment is published with all of its formats. Holding one format back is not possible yet (open, T-26).',
  historyTitle: 'History',
  historyMeta: 'Newest first',
  /** `reviewLine` before an approval. */
  notDecided: 'Not decided yet',
} as const;

/** `span.xr-overline` “SUB-0077 · First publication” (`cmOver`). */
export function decisionOverline(id: string): string {
  return `${id} · First publication`;
}

/**
 * `cmMeta`: “Northline Simulation Studio · ME ZG523 · approved by Prof. A. Menon on 27 Aug 2026”;
 * without an approval, the organisation and the course only (f3).
 */
export function decisionMetaLine(
  organisation: string,
  course: string,
  approval: { readonly by: string; readonly on: string } | null,
): string {
  const base = `${organisation} · ${course}`;
  return approval ? `${base} · approved by ${approval.by} on ${approval.on}` : base;
}

/** `cmChipWords` while something is missing: “Ready to publish · 1 to resolve” (f2). */
export function toResolveChip(ready: string, missing: number): string {
  return `${ready} · ${missing} to resolve`;
}

/**
 * `revLine`: “Submitted 12 Aug 2026 · resubmitted 26 Aug 2026 (revision 2)”, or “Submitted 12 Aug
 * 2026” for a first revision.
 */
export function submissionsLine(
  submitted: string,
  resubmitted: string | null,
  revision: number,
): string {
  return revision > 1 && resubmitted
    ? `Submitted ${submitted} · resubmitted ${resubmitted} (revision ${revision})`
    : `Submitted ${submitted}`;
}

/**
 * `reviewLine`: “Approved by Prof. A. Menon on 27 Aug 2026 — after 1 return with a reason”. More
 * than one return is undrawn (state-copy `CM-03.returns`).
 */
export function reviewLine(by: string, on: string, returns: number): string {
  const approved = `Approved by ${by} on ${on}`;
  if (returns === 0) return approved;
  if (returns === 1) return `${approved} — after 1 return with a reason`;
  return `${approved}${stateWords('CM-03.returns').replace('{n}', String(returns))}`;
}

export type PublicationCheckKind =
  'approved-by-reviewer' | 'learning-outcomes' | 'catalogue-details' | 'delivery-per-format';

/** The publication check’s rows (`checks[].t`). */
export const CHECK_TITLES: Readonly<Record<PublicationCheckKind, string>> = {
  'approved-by-reviewer': 'Approved by the Academic Reviewer',
  'learning-outcomes': 'Learning outcomes',
  'catalogue-details': 'Catalogue details',
  'delivery-per-format': 'Delivery details for each format',
};

/** The rows’ second lines (`checks[].d`) where they are fixed words. */
export const CHECK_LINES = {
  notApproved: 'Not approved yet',
  noOutcomes: 'None',
  catalogueComplete: 'Name, course, summary, description, version',
  catalogueIncomplete: 'Incomplete',
  noFormats: 'No formats',
} as const;

/** What to do about a failing row (`checks[].fix`); approval has none. */
export const CHECK_FIXES: Readonly<Record<PublicationCheckKind, string | null>> = {
  'approved-by-reviewer': null,
  'learning-outcomes': 'Send it back to the Academic Reviewer to add them.',
  'catalogue-details': 'Send it back to the vendor.',
  'delivery-per-format': 'Send it back to the vendor.',
};

/** “Prof. A. Menon · 27 Aug 2026” (the approval row). */
export function approvedCheckLine(by: string, on: string): string {
  return `${by} · ${on}`;
}

/** “3 outcomes · one set for every format”. */
export function outcomesCheckLine(count: number): string {
  return `${plural(count, 'outcome')} · one set for every format`;
}

/** “WEB · VR — complete” / “WEB · AR — incomplete”. */
export function deliveryCheckLine(codes: readonly string[], complete: boolean): string {
  if (codes.length === 0) return CHECK_LINES.noFormats;
  return `${codes.join(' · ')}${complete ? ' — complete' : ' — incomplete'}`;
}

/** `blockText`: “1 thing to resolve before it can be published”. */
export function blockersTitle(count: number): string {
  return `${plural(count, 'thing')} to resolve before it can be published`;
}

/** `blockList[].t`: “Learning outcomes: none. Send it back to the Academic Reviewer to add them.” */
export function blockerLine(title: string, line: string, fix: string | null): string {
  return `${title}: ${line.toLowerCase()}.${fix ? ` ${fix}` : ''}`;
}

export const DECISION_PANEL = {
  title: 'Your decision',
  /** `legend.xr-sr`. */
  legend: 'Decision',
  publish: 'Publish',
  publishSub: 'It appears in the public catalogue. It gives no one access.',
  /** The unavailable card (`label.xr-choice.is-off`, f2). */
  publishOff: 'Possible once nothing is missing.',
  sendBack: 'Send back',
  sendBackSub: 'To the Academic Reviewer or the vendor, with a reason.',
  /** Read-only (f3). */
  nothingYet: 'Nothing to decide yet.',
  /** The result (f4). */
  published: 'Published',
  openLibrary: 'Open the Content library',
  /** After a send back (`cmSent`). */
  sentToReviewer: 'Sent back to the Academic Reviewer',
  sentToVendor: 'Sent back to the vendor',
  sentLine:
    'Nothing is published. It comes back to Ready to publish only after it is approved again.',
  backToReady: 'Back to Ready to publish',
} as const;

/** `pubWhen`: “28 Aug 2026 · 10:05 · Kavya Nair”. */
export function publishedWhen(day: string, time: string, by: string): string {
  return `${day} · ${time} · ${by}`;
}

/** `pubLine`: “In the public catalogue under ME ZG523 with WEB and VR. Publishing gave no one access.” */
export function publishedLine(course: string, codes: readonly string[]): string {
  return `In the public catalogue under ${course} with ${formatsSentence(codes)}. Publishing gave no one access.`;
}

/** `cmSentMeta`: “28 Aug 2026, 10:05 · Kavya Nair · “reason””. */
export function sentBackMeta(when: string, by: string, reason: string): string {
  return `${when} · ${by} · “${reason}”`;
}

/** The read-only notice (`roTitle` / `roBody`, f3; B6-11 f5). */
export const READ_ONLY = {
  inReviewTitle: 'Still in academic review',
  inReviewLine:
    'The Academic Reviewer hasn’t decided yet. It appears in Ready to publish once it is approved — read-only until then.',
  recheckTitle: 'Back with the Academic Reviewer for a re-check',
  recheckLine:
    'You sent it back with a reason. It comes back here if the Academic Reviewer approves it again.',
  vendorTitle: 'With the vendor',
  vendorLine:
    'It was returned with a reason. It comes back to the Academic Reviewer when the vendor resubmits.',
} as const;

/** `cmChipWords` for a record with the vendor (`returned`, `returned_cm`). */
export const WITH_THE_VENDOR = 'With the vendor';

/** DL-1 Publish (B6-11 f6). */
export const PUBLISH_DIALOG = {
  confirm: 'Publish',
  busy: 'Publishing…',
} as const;

/** `pTitle`: “Publish “Conduction Through a Composite Wall”?”. */
export function publishTitle(name: string): string {
  return `Publish “${name}”?`;
}

/** `pBody`: what publishing does — and does not do. */
export function publishEffect(course: string, codes: readonly string[]): string {
  return `It will appear in the public catalogue under ${course} with ${formatsSentence(codes)}. Publishing gives no one access — institutions still need access before their students can open it.`;
}

/** DL-2 Send back (B6-11 f7; OD-B6-05 references toward the vendor only). */
export const SEND_BACK_DIALOG = {
  title: 'Send it back?',
  effect: 'Nothing is published. The person you choose sees your reason.',
  to: 'Send it to',
  reviewer: 'Academic Reviewer',
  reviewerSub: 'For a re-check of the academic content',
  vendor: 'Vendor',
  reasonForVendor: 'Reason the vendor will see',
  reasonForReviewer: 'Reason the Academic Reviewer will see',
  reasonForEither: 'Reason they will see',
  references: 'What it refers to',
  optional: '(optional)',
  referencesHint: 'The vendor sees these as links to the fields, above their editor.',
  confirm: 'Send back',
  busy: 'Sending…',
} as const;

/** `toVenSub`: “Northline Simulation Studio — to revise and resubmit”. */
export function vendorChoiceSub(organisation: string): string {
  return `${organisation} — to revise and resubmit`;
}

const REFERENCE_STEPS: Readonly<Record<ReturnReference['step'], string>> = {
  'course-and-description': 'Course & description',
  'formats-and-delivery': 'Formats & delivery',
  'preview-and-documents': 'Preview & documents',
};

const REFERENCE_FIELDS: Readonly<Record<ReturnReference['field'], string>> = {
  summary: 'Summary',
  description: 'Description',
  'web-link': 'Web link',
  'browser-and-computer': 'Browser and computer',
  package: 'Package',
  'device-need': 'Device need',
  'install-notes': 'Install notes',
  'preview-link': 'Preview link',
};

/** A reference option (`refOpts[].t`): “Formats & delivery · VR · Device need”. */
export function referenceWords(reference: ReturnReference, formatCode: string | null): string {
  const step = REFERENCE_STEPS[reference.step];
  const field = REFERENCE_FIELDS[reference.field];
  return formatCode ? `${step} · ${formatCode} · ${field}` : `${step} · ${field}`;
}

/** The history’s lines (`sh`: what · when · note), newest first. */
export const HISTORY = {
  submitted: 'Submitted for academic review',
} as const;

export function submittedNote(revision: number, organisation: string): string {
  return `Revision ${revision} · from ${organisation}`;
}

export function returnedByReviewerWhat(by: string): string {
  return `Returned to vendor by ${by}`;
}

export function approvedWhat(by: string): string {
  return `Approved by ${by}`;
}

/** “Sent to the Content Manager with 3 learning outcomes. Nothing is published.” */
export function approvedNote(outcomes: number): string {
  return `Sent to the Content Manager with ${plural(outcomes, 'learning outcome')}. Nothing is published.`;
}

export function resubmittedWhat(revision: number): string {
  return `Resubmitted · revision ${revision}`;
}

export function publishedWhat(by: string): string {
  return `Published by ${by}`;
}

/** “In the public catalogue under ME ZG523 with WEB and VR. No one was given access.” */
export function publishedNote(course: string, codes: readonly string[]): string {
  return `In the public catalogue under ${course} with ${formatsSentence(codes)}. No one was given access.`;
}

export function sentBackToReviewerWhat(by: string): string {
  return `Sent back to the Academic Reviewer by ${by}`;
}

export function sentBackToVendorWhat(by: string): string {
  return `Sent back to the vendor by ${by}`;
}

/** A reason as the history quotes it: “Please clarify the VR device requirements.” in quotes. */
export function quoted(reason: string): string {
  return `“${reason}”`;
}

// ---- CM-05 Published experiment (B6-08) --------------------------------------------------------

export const PUBLISHED_PAGE = {
  /** `p.xl-meta` under the header. */
  changeLine:
    'Every change opens a correction draft. The live experiment changes only when the Super Admin releases it.',
  catalogueTitle: 'Catalogue details',
  liveReadOnly: 'Live · read-only',
  name: 'Name',
  course: 'Course',
  summary: 'Summary',
  description: 'Description',
  version: 'Version',
  formats: 'Formats',
  outcomesTitle: 'Learning outcomes',
  outcomesMeta: 'Set by the Academic Reviewer · read-only',
  deliveryTitle: 'Delivery',
  /** `div.xv-deliv-head` titles. */
  webTitle: 'Web link',
  packageTitle: 'App package (provisional — T-14)',
  webLink: 'Web link',
  browser: 'Browser and computer',
  package: 'Package',
  packageReference: 'Package reference',
  deviceNeeded: 'Device needed',
  installNotes: 'Install notes',
  historyTitle: 'History',
  historyMeta: 'Versions and updates · newest first',
  firstPublicationNote: 'First publication by the Content Manager.',
} as const;

/** `pubOver`: “CHE ZG513 · Published · version 1.2”. */
export function publishedOverline(course: string, version: string): string {
  return `${course} · Published · version ${version}`;
}

/** “Live since 3 Jul 2026 · Meridian Virtual Labs” (no organisation recorded: the date only). */
export function liveSinceLine(day: string, organisation: string): string {
  return organisation ? `Live since ${day} · ${organisation}` : `Live since ${day}`;
}

/** `progTitle`: “An update is in progress — UPD-0005 · In academic review”. */
export function updateInProgressTitle(id: string, state: string): string {
  return `An update is in progress — ${id} · ${state}`;
}

/** `progBody` by the open update’s state (B6-08 f1, f2; script for awaiting and hold). */
export function updateInProgressLine(
  state: 'draft' | 'returned' | 'in-academic-review' | 'awaiting-release-decision' | 'on-hold',
  liveVersion: string,
): string {
  switch (state) {
    case 'draft':
    case 'returned':
      return 'Edits to this experiment join that update. Open it to continue.';
    case 'in-academic-review':
      return 'It is with the Academic Reviewer. You can’t start another update until it is decided.';
    case 'awaiting-release-decision':
      return 'The Academic Reviewer approved it. The Super Admin decides when to release it.';
    case 'on-hold':
      return `The Super Admin put it on hold. Version ${liveVersion} stays live.`;
  }
}

/** `dhist` for the open update: “UPD-0005 started — in academic review”. */
export function updateStartedWhat(id: string, state: string): string {
  return `${id} started — ${state.toLowerCase()}`;
}

/** “Version 1.3. The live version below is unchanged.” (`Version not set` before a label.) */
export function updateStartedNote(version: string | null): string {
  return `Version ${version ?? 'not set'}. The live version below is unchanged.`;
}

/** “Version 1.2 released”. */
export function versionReleasedWhat(version: string): string {
  return `Version ${version} released`;
}

/**
 * “Correction UPD-0002 — released by the Super Admin.” for the live version, “Correction
 * UPD-0001.” for an earlier one (B6-08 f0; state-copy `CM-05.history`).
 */
export function versionReleasedNote(updateId: string, live: boolean): string {
  return live ? `Correction ${updateId} — released by the Super Admin.` : `Correction ${updateId}.`;
}

/** “Published · version 1.0”. */
export function firstPublishedWhat(version: string): string {
  return `Published · version ${version}`;
}
