/**
 * The words of RV-03 Review a submission and RV-06 its decided read-only state — the owner-approved
 * Academic Reviewer export (V3 Refined B, design/v3-refined-b/roles/RV-v1, `project/RV.dc.html`
 * item view, template and `itemVals`). Every phrase is the export's own, found verbatim in its
 * template or script (`reviewer-review.test.ts`); the composed lines take the export's forms with
 * the record's values (names, dates, counts are never copied from the sample world). What the
 * export does not word is an entry of the state-copy register (`state-copy-reviewer-review.ts`,
 * VD-12). No internal reference (SUB-, UPD-, …) is ever part of these words (owner, 21 Oct 2026).
 */
import type { Technology } from '@xr/domain';

import { stateWords } from './state-copy';

/** A plural as the export writes it: “1 outcome”, “3 learning outcomes” (`plural`). */
export function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? '' : 's'}`;
}

/** “WEB and VR”, “summary, description and VR device need” (`andList`). */
export function andList(items: readonly string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`;
}

/** A reason as the export quotes it: “Please clarify the VR device requirements.” */
export function quoted(reason: string): string {
  return `“${reason}”`;
}

// ---- the identity card (what the submission alone draws; the shared words are `rv-shared.ts`) ---

export const IDENTITY_WORDS = {
  revision: 'Revision',
  version: 'Version',
} as const;

/** The revision fact: “2 · resubmitted 26 Aug”, or “1”. */
export function revisionFact(revision: number, resubmitted: string | null): string {
  return revision > 1 && resubmitted
    ? `${revision} · resubmitted ${resubmitted}`
    : String(revision);
}

/** The page map's entries (`anchors`). */
export const PAGE_MAP = {
  recheck: 'Re-check request',
  changed: 'What changed',
  outcomes: 'Learning outcomes',
  details: 'Description and documents',
  delivery: 'Formats and delivery',
} as const;

// ---- why it is here: the re-check and what changed -----------------------------------------------

export const REVIEW_PAGE = {
  recheckTitle: 'Sent back for a re-check',
  recheckLine: 'Check it again and approve, or return it to the vendor.',
  changedNote: 'Only what the vendor changed',
  field: 'Field',
  was: 'Was',
  now: 'Now',
  /** A blank value in “Was” / “Now”. */
  none: 'None',
  detailsTitle: 'Description and documents',
  description: 'Description',
  previewAndDocuments: 'Preview and documents',
  previewNote: 'Preview link · opens in a new tab',
  noPreview: 'No preview link',
  noDocuments: 'No documents',
  noAttachments: 'No preview link or documents',
  deliveryTitle: 'Formats and delivery',
  inThisSubmission: 'In this submission',
  webKind: 'Web link',
  packageKind: 'App package',
  webLink: 'Web link',
  browser: 'Browser and computer',
  openWebLink: 'Open web link',
  newTab: ' (opens in a new tab)',
  package: 'Package',
  deviceNeeded: 'Device needed',
  viewPackage: 'View package details',
  hidePackage: 'Hide package details',
  packageReference: 'Package reference',
  installNotes: 'Install notes',
  deliveryOnly:
    'You see delivery details and web links only. Opening a link is not a test on a real device.',
  /** A value the vendor left empty, or a package given as a file name only (“… (file)”). */
  noValue: '—',
  fileSuffix: ' (file)',
} as const;

/** The formats' names on their delivery cards (`FN`). */
export const FORMAT_TITLES = {
  web: 'Browser',
  ar: 'Augmented reality',
  vr: 'Virtual reality',
  mr: 'Mixed reality',
} as const satisfies Readonly<Record<Technology, string>>;

/** The re-check's quote-by line: “Kavya Nair, Content Manager” (`R.recheck.by`). */
export function recheckByWords(name: string): string {
  return `${name}, Content Manager`;
}

/** “What changed in revision 2” (`chgTitle`). */
export function changedTitle(revision: number): string {
  return `What changed in revision ${revision}`;
}

/**
 * The previous return's quote-by line: “Your reason when you returned revision 1 · 19 Aug 2026”
 * (`prevBy`). Returned by another reviewer (undrawn): state-copy `RV-03.previous-return-other`.
 */
export function previousReturnBy(revision: number, day: string, by: string | null): string {
  if (by === null) return `Your reason when you returned revision ${revision} · ${day}`;
  return stateWords('RV-03.previous-return-other')
    .replace('{name}', by)
    .replace('{revision}', String(revision))
    .replace('{day}', day);
}

/** “Not included: AR, MR” (`'Not included: ' + fmtOut`). */
export function notIncludedWords(codes: readonly string[]): string {
  return `Not included: ${codes.join(', ')}`;
}

/** The formats line's badges, read: “In this submission: WEB and VR” (`fmtInAria`). */
export function inThisSubmissionWords(codes: readonly string[]): string {
  return `In this submission: ${andList(codes)}`;
}

/** “Changed in revision 2” beside a delivery value. */
export function changedInRevision(revision: number): string {
  return `Changed in revision ${revision}`;
}

/** “What changed” rows: the editor's step and field (“Formats & delivery · VR · Device need”). */
const STEP_WORDS = {
  course: 'Course & description',
  formats: 'Formats & delivery',
  preview: 'Preview & documents',
} as const;

/** Each field the service reports a change for (its own keys), as the editor labels it. */
const CHANGED_FIELDS: Readonly<
  Record<string, { readonly step: keyof typeof STEP_WORDS; readonly field: string }>
> = {
  course: { step: 'course', field: 'Course' },
  name: { step: 'course', field: 'Experiment name' },
  summary: { step: 'course', field: 'Summary' },
  description: { step: 'course', field: 'Description' },
  version: { step: 'course', field: 'Version' },
  formats: { step: 'formats', field: 'Formats' },
  'web-link': { step: 'formats', field: 'Web link' },
  'browser-and-computer': { step: 'formats', field: 'Browser and computer' },
  notes: { step: 'formats', field: 'Notes' },
  'package-label': { step: 'formats', field: 'Package' },
  package: { step: 'formats', field: 'Package reference' },
  'device-need': { step: 'formats', field: 'Device need' },
  'install-notes': { step: 'formats', field: 'Install notes' },
  'preview-label': { step: 'preview', field: 'Preview label' },
  'preview-link': { step: 'preview', field: 'Preview link' },
  documents: { step: 'preview', field: 'Documents' },
};

/** A changed field key (`'description'`, `'vr:device-need'`) as its format and field. */
function changedParts(key: string): {
  readonly step: string;
  readonly format: string | null;
  readonly field: string;
} {
  const [first, second] = key.split(':');
  const format = second === undefined ? null : (first ?? '').toUpperCase();
  const known = CHANGED_FIELDS[second ?? first ?? ''];
  if (!known) return { step: '', format, field: key };
  return { step: STEP_WORDS[known.step], format, field: known.field };
}

/**
 * A “What changed” row's field: “Formats & delivery · VR · Device need” (the return references'
 * own form). Fields the export draws no change for take the editor's labels (state-copy
 * `RV-03.what-changed-fields`).
 */
export function changedFieldWords(key: string): string {
  const { step, format, field } = changedParts(key);
  if (!step) return field;
  return format ? `${step} · ${format} · ${field}` : `${step} · ${field}`;
}

/** A blank value in “Was” / “Now”: “None”. */
export function changedValueWords(value: string): string {
  return value.trim() === '' ? REVIEW_PAGE.none : value;
}

/** “VR device need”, “summary”: a changed field in short (`fieldShort`). */
function changedNoun(key: string): string {
  const { format, field } = changedParts(key);
  return format ? `${format} ${field.toLowerCase()}` : field.toLowerCase();
}

// ---- the learning outcomes (LD-3) -----------------------------------------------------------------

export const OUTCOME_WORDS = {
  title: 'Learning outcomes',
  subEditable:
    'You set one list for the Experiment, used in every format. The vendor and the Content Manager see it with your decision.',
  subReadOnly: 'One list for the Experiment, used in every format.',
  requirementMet: 'Requirement met',
  requirementNeeded: 'At least one needed to approve',
  requirementReadOnly: 'Set by you · read-only',
  listLabel: 'Learning outcomes',
  outcome: (n: number) => `Outcome ${n}`,
  up: (n: number) => `Move outcome ${n} up`,
  down: (n: number) => `Move outcome ${n} down`,
  editLabel: (n: number) => `Edit outcome ${n}`,
  deleteLabel: (n: number) => `Delete outcome ${n}`,
  edit: 'Edit',
  delete: 'Delete',
  save: 'Save outcome',
  cancel: 'Cancel',
  undo: 'Undo',
  noneTitle: 'No learning outcomes yet',
  noneLine:
    'Approve needs at least one. Add what a learner can do after this experiment; the same list applies to every format.',
  addLabel: 'Add a learning outcome',
  addHint: 'What a learner can do after the experiment. Start with a verb.',
  add: 'Add outcome',
  moved: (from: number, up: boolean, to: number) =>
    `Outcome ${from} moved ${up ? 'up' : 'down'} — it is now outcome ${to}.`,
  deleted: (n: number) => `Outcome ${n} deleted.`,
  saved: (n: number) => `Outcome ${n} saved.`,
  added: (count: number) => `Outcome added — ${plural(count, 'outcome')} in the list.`,
  restored: (n: number) => `Outcome ${n} restored.`,
} as const;

// ---- the decision panel ----------------------------------------------------------------------------

export const DECISION_WORDS = {
  approve: 'Approve',
  approveSub:
    'Sends it to the Content Manager with its learning outcomes. Approving does not publish.',
  approveSubRecheck:
    'Sends it back to the Content Manager with its learning outcomes. Approving does not publish.',
  returnToVendor: 'Return to vendor',
  returnSub: 'You’ll add a reason the vendor will see. They can revise and resubmit.',
  chooseDecision: 'Choose a decision',
  /** While an outcome is being edited (`e.editing`). */
  editingFirst: 'Save or cancel the outcome you are editing first',
  reasonLabel: 'Reason the vendor will see (required)',
  reasonHint: 'The vendor sees this above their editor.',
  refsLegend: 'What it refers to (optional)',
  refsHint: 'The vendor sees these as links to the fields, above their editor.',
  pendingEditing: 'Save or cancel the outcome you are editing first.',
  pendingOutcomes: 'Add at least one learning outcome before you approve.',
  pendingReason: 'Add the reason before you return it.',
  cancel: 'Cancel',
} as const;

/**
 * While a decision runs, its button says so (the export draws no busy look; the product's words
 * from B6-03's script, as CM-v1's “Publishing…”).
 */
export const BUSY_WORDS = {
  approving: 'Approving…',
  returning: 'Returning…',
} as const;

/** “Before you decide” (`ready`, submission). */
export const READY_WORDS = {
  outcomesRule: 'Approve needs at least one.',
  noOutcomes: 'No learning outcomes yet.',
  addOutcome: 'Add an outcome',
  whole: 'Whole Experiment.',
  recheck: 'Re-check.',
  recheckLine: 'The Content Manager sent it back to you.',
  readWhy: 'Read why',
  seeChanged: 'See what changed',
} as const;

/** “3 learning outcomes.” */
export function readyOutcomes(count: number): string {
  return `${plural(count, 'learning outcome')}.`;
}

/** “You decide for every format together: WEB and VR.” */
export function readyWhole(codes: readonly string[]): string {
  return `You decide for every format together: ${andList(codes)}.`;
}

/** “1 change since you returned it.” */
export function readyChanges(count: number): string {
  return `${plural(count, 'change')} since you returned it.`;
}

/** “What happens next” (`path`, submission). */
export const PATH_WORDS = {
  youLine: 'Approve it, or return it to the vendor.',
  youLineRecheck: 'Approve it again, or return it to the vendor.',
  contentManager: 'Content Manager · publication',
  contentManagerLine: 'Approving does not publish.',
  institutions: 'Institutions · student access',
  institutionsLine: 'Publishing gives no one access.',
} as const;

// ---- the Approve confirmation ----------------------------------------------------------------------

export const APPROVE_DIALOG = {
  contentManagerDecides:
    'The Content Manager decides whether to publish it. Approving does not publish.',
  noAccess: 'Publishing gives no one access. Institutions give their students access separately.',
} as const;

/** The confirmation's title: “Approve “Conduction Through a Composite Wall”?” (`dlgTitle`). */
export function approveTitle(name: string): string {
  return `Approve “${name}”?`;
}

/** “It goes to the Content Manager with its 3 learning outcomes.” (`nowList`). */
export function approveGoes(outcomes: number, recheck: boolean): string {
  return `${recheck ? 'It goes back to the Content Manager with its ' : 'It goes to the Content Manager with its '}${plural(outcomes, 'learning outcome')}.`;
}

// ---- return references (OD-B5-10) ------------------------------------------------------------------

/** One “What it refers to” option: the editor's step · format · field. */
export interface ReferenceOption {
  readonly key: string;
  /** The stored label, “Formats & delivery · VR · Device need” (the decided panel lists it). */
  readonly words: string;
  /** The editor section the option is grouped under: “Formats & delivery · VR”. */
  readonly group: string;
  /** The field: “Device need”. */
  readonly field: string;
  readonly reference: {
    readonly step: 'course-and-description' | 'formats-and-delivery' | 'preview-and-documents';
    readonly format: Technology | null;
    readonly field:
      | 'summary'
      | 'description'
      | 'web-link'
      | 'browser-and-computer'
      | 'package'
      | 'device-need'
      | 'install-notes'
      | 'preview-link';
  };
}

const PACKAGE_FIELDS = [
  ['package', 'Package'],
  ['device-need', 'Device need'],
  ['install-notes', 'Install notes'],
] as const;

function option(
  key: string,
  group: string,
  field: string,
  reference: ReferenceOption['reference'],
): ReferenceOption {
  return { key, words: `${group} · ${field}`, group, field, reference };
}

/**
 * The references offered for the formats the submission has, in the export's order (`REFS`):
 * Course & description, WEB, then each package format, then Preview & documents — the preview
 * link only when the submission has one.
 */
export function referenceOptions(
  formats: readonly Technology[],
  hasPreview: boolean,
): ReferenceOption[] {
  const course = 'Course & description';
  const options: ReferenceOption[] = [
    option('summary', course, 'Summary', {
      step: 'course-and-description',
      format: null,
      field: 'summary',
    }),
    option('description', course, 'Description', {
      step: 'course-and-description',
      format: null,
      field: 'description',
    }),
  ];
  if (formats.includes('web')) {
    const web = 'Formats & delivery · WEB';
    options.push(
      option('web:web-link', web, 'Web link', {
        step: 'formats-and-delivery',
        format: 'web',
        field: 'web-link',
      }),
      option('web:browser-and-computer', web, 'Browser and computer', {
        step: 'formats-and-delivery',
        format: 'web',
        field: 'browser-and-computer',
      }),
    );
  }
  for (const format of ['ar', 'vr', 'mr'] as const) {
    if (!formats.includes(format)) continue;
    const group = `Formats & delivery · ${format.toUpperCase()}`;
    for (const [field, words] of PACKAGE_FIELDS) {
      options.push(
        option(`${format}:${field}`, group, words, {
          step: 'formats-and-delivery',
          format,
          field,
        }),
      );
    }
  }
  if (hasPreview) {
    options.push(
      option('preview-link', 'Preview & documents', 'Preview link', {
        step: 'preview-and-documents',
        format: null,
        field: 'preview-link',
      }),
    );
  }
  return options;
}

/** A stored reference (step · format · field) as the decided panel lists it. */
export function referenceWords(reference: {
  readonly step: string;
  readonly format: Technology | null;
  readonly field: string;
}): string {
  const found = referenceOptions(['web', 'ar', 'vr', 'mr'], true).find(
    (entry) =>
      entry.reference.step === reference.step &&
      entry.reference.format === reference.format &&
      entry.reference.field === reference.field,
  );
  return found?.words ?? reference.field;
}

// ---- after deciding, and decided (RV-06) -----------------------------------------------------------

export const DONE_WORDS = {
  learningOutcomes: 'Learning outcomes',
  publication: 'Publication',
  references: 'References',
  returnedToVendor: 'Returned to the vendor',
  notPublishedDecides: 'Not published — the Content Manager decides',
  notPublished: 'Not published',
  noAccess: 'None — publishing gives no one access',
  noReferences: 'None',
  nextWithContentManager:
    'The Content Manager decides whether to publish it. Nothing is published yet.',
  nextPublished: 'The Content Manager published it. Publishing gave no one access.',
  nextReturnedHere:
    'The vendor sees your reason above their editor and can revise and resubmit. A resubmission comes back to your queue as a new revision.',
  nextReturned:
    'The vendor can revise it and resubmit. A resubmission comes back to your queue as a new revision.',
} as const;

/** Another reviewer's decision (undrawn): “Decided by Prof. R. Iyer on 14 Aug 2026, 15:10”. */
export function decidedByOther(when: string, by: string): string {
  return stateWords('RV-06.decided-by-other').replace('{name}', by).replace('{when}', when);
}

/** “3 outcomes”, “3 outcomes, sent with your decision”. */
export function outcomesStand(count: number, here: boolean): string {
  return `${plural(count, 'outcome')}${here ? ', sent with your decision' : ''}`;
}

/** “2 fields”, or “None”. */
export function referencesStand(count: number): string {
  return count > 0 ? plural(count, 'field') : DONE_WORDS.noReferences;
}

// ---- review history (newest first) -----------------------------------------------------------------

export const HISTORY_WORDS = {
  submitted: 'Submitted for academic review',
  submittedNote: (organisation: string) => `Revision 1 · from ${organisation}`,
  resubmitted: (revision: number) => `Resubmitted · revision ${revision}`,
  returned: (who: string) => `Returned to vendor by ${who}`,
  approved: (who: string) => `Approved by ${who}`,
  approvedNote: (outcomes: number) =>
    `Sent to the Content Manager with ${plural(outcomes, 'learning outcome')}. Nothing is published.`,
  recheck: (who: string) => `Sent back to the Academic Reviewer by ${who}`,
  sentBackToVendor: (who: string) => `Sent back to the vendor by ${who}`,
  published: (who: string) => `Published by ${who}`,
} as const;

/**
 * The resubmission's note: what the vendor changed — “Northline Simulation Studio changed the VR
 * device need.”; an earlier revision, or nothing reported, reads as the first submission does
 * (state-copy `RV-03.history-resubmitted`).
 */
export function resubmittedNoteWords(
  organisation: string,
  revision: number,
  changed: readonly string[] | null,
): string {
  if (changed && changed.length > 0) {
    return stateWords('RV-03.history-resubmitted.changed')
      .replace('{organisation}', organisation)
      .replace('{fields}', andList([...new Set(changed.map(changedNoun))]));
  }
  return stateWords('RV-03.history-resubmitted.revision')
    .replace('{revision}', String(revision))
    .replace('{organisation}', organisation);
}

/** The published entry's note (undrawn on the item view): state-copy `RV-03.history-published`. */
export function publishedNoteWords(course: string, formats: readonly string[]): string {
  return stateWords('RV-03.history-published')
    .replace('{course}', course)
    .replace('{formats}', andList(formats));
}
