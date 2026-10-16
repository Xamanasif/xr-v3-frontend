/**
 * The words of Phase 5’s RV-03 Review a submission and RV-06 its decided read-only state (board
 * B6-03 f0 … f5; B6-11 f0 … f3; B6-12 f1). Every phrase is the frozen boards’ own, found verbatim in
 * their markup or script (`reviewer-review.test.ts`); the composed lines take the boards’ forms
 * with the records’ values (names, dates, counts are never copied from the boards). What B6-03
 * does not word is a provisional entry of the state-copy register
 * (`state-copy-reviewer-review.ts`, VD-12).
 *
 * P1-14 / VD-10: B6-03 writes two decision ids into its copy — “App package (provisional — T-14)”
 * and “… is still open (T-30).” The product shows both without the id (`STRIPPED_REVIEW`, state-copy
 * `RV-03.decision-ids`); the frozen wording is kept beside it, so the copy stays traceable.
 */
import type { Technology } from '@xr/domain';

import { stateWords } from './state-copy';

// ---- the page (B6-03 f0 … f5) ------------------------------------------------------------------

export const REVIEW_PAGE = {
  /** `span.xr-overline` after the id (B6-03 script `rvOver`). */
  overlineNew: 'New submission',
  overlineRecheck: 'Re-check',
  /** f3 `section.xv-reason` (the re-check’s reason, first on the page). */
  recheckTitle: 'Sent back by the Content Manager for a re-check',
  recheckLine: 'Check it again and approve, or return it to the vendor.',
  /** f0 `section.xg-changed`. */
  changedMeta: 'Only what the vendor changed',
  was: 'Was',
  now: 'Now',
  /** “Learning outcomes” (`section`, editable while it is with the reviewer). */
  outcomesTitle: 'Learning outcomes',
  outcomesMeta: 'One set for the Experiment · every format',
  outcomesLead:
    'You set these. The vendor and the Content Manager see the set you approve or return.',
  noOutcomesTitle: 'No learning outcomes yet',
  noOutcomesLine:
    'Add at least one before you approve. One set for the Experiment, whichever format a learner uses.',
  edit: 'Edit',
  delete: 'Delete',
  saveOutcome: 'Save outcome',
  cancel: 'Cancel',
  undo: 'Undo',
  addLabel: 'Add a learning outcome',
  addHint: 'What a learner can do after the experiment. Start with a verb.',
  add: 'Add outcome',
  /** Decided, with no outcomes (B6-03 script `noRoLo`). */
  noneReadOnly: 'None.',
  /** “Submission details” (`dl.xl-kv.xv-kv`). */
  detailsTitle: 'Submission details',
  detailsMeta: 'From the vendor',
  course: 'Course',
  summary: 'Summary',
  description: 'Description',
  version: 'Version',
  formats: 'Formats',
  preview: 'Preview',
  documents: 'Documents',
  none: 'None',
  /** “Formats and delivery” (`div.xv-deliv` per format; T-30: no device testing here). */
  deliveryTitle: 'Formats and delivery',
  deliveryMeta: 'Read-only',
  webTitle: 'Web link',
  webLink: 'Web link',
  browser: 'Browser and computer',
  openWebLink: 'Open web link',
  newTab: ' (opens in a new tab)',
  package: 'Package',
  deviceNeeded: 'Device needed',
  changed: 'Changed',
  viewPackage: 'View package details',
  hidePackage: 'Hide package details',
  packageReference: 'Package reference',
  installNotes: 'Install notes',
  /** A package given as a file name only (B6-03 script `d.ref`: “… (file)”, else “—”). */
  fileSuffix: ' (file)',
  noValue: '—',
  /** “Review history” (`ol.xr-timeline`, newest first). */
  historyTitle: 'Review history',
  historyMeta: 'Newest first',
} as const;

/**
 * The two B6-03 sentences that carry decision ids (P1-14 / VD-10: “Strip the suffix through a
 * copy table and keep the sentence”): `words` is shown, `drawn` is the frozen board’s wording.
 */
export const STRIPPED_REVIEW = {
  packageTitle: {
    words: 'App package (provisional)',
    drawn: 'App package (provisional — T-14)',
    ids: ['T-14'],
  },
  deliveryOnly: {
    words: 'You see delivery details and web links only. Who tests on a real device is still open.',
    drawn:
      'You see delivery details and web links only. Who tests on a real device is still open (T-30).',
    ids: ['T-30'],
  },
} as const;

/** The overline, upper-cased by CSS: “SUB-0077 · New submission”, “SUB-0071 · Re-check”. */
export function overlineWords(id: string, recheck: boolean): string {
  return `${id} · ${recheck ? REVIEW_PAGE.overlineRecheck : REVIEW_PAGE.overlineNew}`;
}

/** “Northline Simulation Studio · ME ZG523 · Thermodynamics & Heat Transfer” (`rvMeta`). */
export function headerMetaWords(organisation: string, course: string | null): string {
  return course ? `${organisation} · ${course}` : organisation;
}

/** “ME ZG523 · Thermodynamics & Heat Transfer” (the course row; `m.course · m.cname`). */
export function courseWords(code: string | null, name: string): string {
  return code ? `${code} · ${name}` : name;
}

/** The re-check’s meta line: “25 Aug 2026, 10:42 · Kavya Nair” (`rcWhen`). */
export function recheckWhenWords(when: string, who: string): string {
  return `${when} · ${who}`;
}

/** “What changed in revision 2” (`chgTitle`). */
export function changedTitle(revision: number): string {
  return `What changed in revision ${revision}`;
}

/**
 * “You returned revision 1 on 19 Aug: “Please clarify the VR device requirements.”” (`prevRet`).
 * Returned by another reviewer (undrawn): state-copy `RV-03.previous-return-other`.
 */
export function previousReturnWords(
  revision: number,
  day: string,
  reason: string,
  by: string | null,
): string {
  if (by === null) return `You returned revision ${revision} on ${day}: “${reason}”`;
  return stateWords('RV-03.previous-return-other')
    .replace('{name}', by)
    .replace('{revision}', String(revision))
    .replace('{day}', day)
    .replace('{reason}', reason);
}

/** A board-style plural: “1 outcome”, “3 learning outcomes” (B6-03 script `plural`). */
export function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? '' : 's'}`;
}

/** “What changed” rows: the editor’s step and field (`chg.f`, “Formats & delivery · VR · Device need”). */
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
 * A “What changed” row’s field: “Formats & delivery · VR · Device need” (f0; the return
 * references’ own form). Fields B6-03 draws no change for take the editor’s labels (state-copy
 * `RV-03.what-changed-fields`).
 */
export function changedFieldWords(key: string): string {
  const { step, format, field } = changedParts(key);
  if (!step) return field;
  return format ? `${step} · ${format} · ${field}` : `${step} · ${field}`;
}

/** A blank value in “Was” / “Now”: “None”, as B6-03 writes an empty preview or document list. */
export function changedValueWords(value: string): string {
  return value.trim() === '' ? REVIEW_PAGE.none : value;
}

/** “VR device need”, “summary”: a changed field in the history’s resubmission line. */
function changedNoun(key: string): string {
  const { format, field } = changedParts(key);
  return format ? `${format} ${field.toLowerCase()}` : field.toLowerCase();
}

function listWords(items: readonly string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`;
}

// ---- the learning outcomes editor (B6-03 script, LD-3) -------------------------------------------

export const OUTCOME_WORDS = {
  listLabel: 'Learning outcomes',
  label: (n: number) => `Outcome ${n}`,
  upLabel: (n: number) => `Move outcome ${n} up`,
  downLabel: (n: number) => `Move outcome ${n} down`,
  editLabel: (n: number) => `Edit outcome ${n}`,
  deleteLabel: (n: number) => `Delete outcome ${n}`,
  moved: (from: number, up: boolean, to: number) =>
    `Outcome ${from} moved ${up ? 'up' : 'down'} — it is now outcome ${to}.`,
  deleted: (n: number) => `Outcome ${n} deleted.`,
  saved: (n: number) => `Outcome ${n} saved.`,
  added: (count: number) => `Outcome added — ${plural(count, 'outcome')} in the list.`,
  restored: (n: number) => `Outcome ${n} restored.`,
} as const;

// ---- the decision panel and its dialogs (B6-03 f0 … f5; B6-11 f0 … f3) -----------------------------

export const DECISION_WORDS = {
  panelTitle: 'Your decision',
  legend: 'Decision',
  approve: {
    title: 'Approve',
    sub: 'Sends it to the Content Manager. Approving does not publish.',
  },
  return: { title: 'Return to vendor', sub: 'You’ll add a reason the vendor will see.' },
  wholeExperiment: 'You decide for the whole Experiment — every format together.',
  /** The panel’s error while an outcome is being edited (`g_aErr`). */
  editingFirst: 'Save or cancel the outcome you are editing first',
  cancel: 'Cancel',
  approving: 'Approving…',
  returning: 'Returning…',
  /** DL-2 (B6-11 f1). */
  returnTitle: 'Return to vendor?',
  returnEffect: 'The vendor sees your reason and can revise and resubmit.',
  reasonLabel: 'Reason the vendor will see',
  refsLegend: 'What it refers to',
  optional: '(optional)',
  refsHint: 'The vendor sees these as links to the fields, above their editor.',
  /** RV-06 (f4). */
  backToQueue: 'Back to the review queue',
} as const;

/** DL-1 (B6-11 f0): “Approve “Conduction Through a Composite Wall”?” (`aTitle`). */
export function approveTitle(name: string): string {
  return `Approve “${name}”?`;
}

/** DL-1’s one sentence (`aBody`): “Approving does not publish it.” */
export function approveEffect(outcomes: number): string {
  return `It goes to the Content Manager with its ${plural(outcomes, 'learning outcome')}. Approving does not publish it.`;
}

/** One “What it refers to” option (`refOpts`): the editor’s step · format · field (OD-B5-10). */
export interface ReferenceOption {
  readonly key: string;
  readonly words: string;
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
}

const PACKAGE_FIELDS = [
  ['package', 'Package'],
  ['device-need', 'Device need'],
  ['install-notes', 'Install notes'],
] as const;

/**
 * The references offered for the formats the submission has, in B6-03’s order: Course &
 * description, WEB, then each package format, then Preview & documents (`refOpts` filtered by the
 * chosen formats).
 */
export function referenceOptions(formats: readonly Technology[]): ReferenceOption[] {
  const options: ReferenceOption[] = [
    {
      key: 'summary',
      words: 'Course & description · Summary',
      step: 'course-and-description',
      format: null,
      field: 'summary',
    },
    {
      key: 'description',
      words: 'Course & description · Description',
      step: 'course-and-description',
      format: null,
      field: 'description',
    },
  ];
  if (formats.includes('web')) {
    options.push(
      {
        key: 'web:web-link',
        words: 'Formats & delivery · WEB · Web link',
        step: 'formats-and-delivery',
        format: 'web',
        field: 'web-link',
      },
      {
        key: 'web:browser-and-computer',
        words: 'Formats & delivery · WEB · Browser and computer',
        step: 'formats-and-delivery',
        format: 'web',
        field: 'browser-and-computer',
      },
    );
  }
  for (const format of ['ar', 'vr', 'mr'] as const) {
    if (!formats.includes(format)) continue;
    for (const [field, words] of PACKAGE_FIELDS) {
      options.push({
        key: `${format}:${field}`,
        words: `Formats & delivery · ${format.toUpperCase()} · ${words}`,
        step: 'formats-and-delivery',
        format,
        field,
      });
    }
  }
  options.push({
    key: 'preview-link',
    words: 'Preview & documents · Preview link',
    step: 'preview-and-documents',
    format: null,
    field: 'preview-link',
  });
  return options;
}

// ---- the record as the reviewer sees it (B6-03 script `rvChipWords`, `decTitle`, `decNext`) ----------

/**
 * The decided panel’s status and the header chip once decided (RV-06, f4): approved and with the
 * Content Manager, published, returned by the reviewer, sent back to the vendor by the Content
 * Manager. Undrawn states take the register’s words (state-copy `RV-06.other`).
 */
export const DECIDED_WORDS = {
  withContentManager: 'Approved — with the Content Manager',
  published: 'Approved — now published',
  publishedChip: 'Approved — published',
  returned: 'Returned to vendor',
  returnedByContentManager: 'With the vendor',
  nextWithContentManager:
    'The Content Manager decides whether to publish it. Nothing is published yet.',
  nextReturned: 'The vendor sees your reason and can revise and resubmit.',
  nextReturnedByContentManager: 'The Content Manager sent it back to the vendor.',
} as const;

/** “The Content Manager published it on 29 Aug 2026.” (`decNext`, published). */
export function publishedNextWords(day: string): string {
  return `The Content Manager published it on ${day}.`;
}

/** The decided panel’s meta: “14 Aug 2026, 15:10 · Prof. A. Menon” (`decWhen`). */
export function decidedWhenWords(when: string, who: string): string {
  return `${when} · ${who}`;
}

/** A reason as B6-03 quotes it: “Please clarify the VR device requirements.” */
export function quoted(reason: string): string {
  return `“${reason}”`;
}

// ---- review history (B6-03 `sh`, newest first) ------------------------------------------------------

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
  publishedNote: (course: string, formats: readonly string[]) =>
    `In the public catalogue under ${course} with ${formats.join(' and ')}. No one was given access.`,
} as const;

/**
 * The resubmission’s note: what the vendor changed, from “What changed” — “Northline Simulation
 * Studio changed the VR device need.” (f0); an earlier revision, or nothing reported, reads as
 * the first submission does (state-copy `RV-03.history-resubmitted`).
 */
export function resubmittedNoteWords(
  organisation: string,
  revision: number,
  changed: readonly string[] | null,
): string {
  if (changed && changed.length > 0) {
    return stateWords('RV-03.history-resubmitted.changed')
      .replace('{organisation}', organisation)
      .replace('{fields}', listWords([...new Set(changed.map(changedNoun))]));
  }
  return stateWords('RV-03.history-resubmitted.revision')
    .replace('{revision}', String(revision))
    .replace('{organisation}', organisation);
}
