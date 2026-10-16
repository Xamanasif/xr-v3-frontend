/**
 * The words of Phase 5’s experiment editor — VE-03 Course and description, VE-04 Formats and
 * delivery, VE-05 Preview and documents, VE-06 Check and submit (boards B5-03, B5-04, B5-05), VE-09
 * Edit draft and VE-08 Revise and resubmit (B5-07) — and of the returned-record notice the editor and
 * the record share (B5-06, B5-07 `section.xv-reason`). Every phrase is the frozen boards’ own, found
 * verbatim in their markup or script (`vendor-editor.test.ts`); the composed lines take the boards’
 * forms (the script’s `vxView`) with the records’ values — names, ids, codes and dates are never
 * copied from the boards. What the boards do not word is a provisional entry of the state-copy
 * register (`state-copy-vendor-editor.ts`, VD-12). The field errors are the contract’s catalogue
 * (`VE-03.*`, `VE-04.*`, `VE-05.*`), worded by the service and by `queries/production-editor.ts`.
 */
import type { ReturnReference, Technology } from '@xr/domain';
import { FORMAT_META } from '@xr/domain';

import { stateWords } from './state-copy';

export type EditorMode = 'create' | 'edit' | 'revise';
export type EditorStepKey = 'course' | 'formats' | 'preview' | 'submit';

// ---- the frame: header, stepper, footer (B5-03 … B5-05, B5-07) ----------------------------------

export const EDITOR = {
  /** `a.xr-back` above the header. */
  back: 'My experiments',
  /** `ol.xr-steps[aria-label]` and its four labels. */
  stepsLabel: 'Steps',
  steps: ['Course', 'Formats', 'Preview', 'Check'],
  /** The H1 of each step (`titles` in the script). */
  stepTitles: {
    course: 'Course and description',
    formats: 'Formats and delivery',
    preview: 'Preview and documents',
    submit: 'Check and submit',
  } satisfies Record<EditorStepKey, string>,
  /** The overline’s first words, by mode. */
  modeWords: {
    create: 'Create experiment',
    edit: 'Edit draft',
    revise: 'Revise and resubmit',
  } satisfies Record<EditorMode, string>,
  /** The meta line before the first save (OD-B5-07: the id is given on first save). */
  notSaved: 'Not saved yet',
  /** `div.xw-errsum > strong` on every step. */
  summaryTitle: 'Check this step',
  /** `div.xw-flow-foot`: the way out first, then the step’s actions. */
  cancel: 'Cancel',
  previous: 'Back',
  saveDraft: 'Save draft',
  saveChanges: 'Save changes',
  continue: 'Continue',
} as const;

/** “Create experiment · Step 1 of 4” (`o.over`; the overline is upper-cased by the sheet). */
export function overlineWords(mode: EditorMode, step: number): string {
  return `${EDITOR.modeWords[mode]} · Step ${step} of 4`;
}

/** “Not saved yet”, “SUB-0077 · draft”, “SUB-0077 · revision 1 was returned” (`o.idLine`). */
export function idLineWords(id: string | null, mode: EditorMode, revision: number): string {
  if (id === null) return EDITOR.notSaved;
  if (mode === 'revise') return `${id} · revision ${revision} was returned`;
  return `${id} · draft`;
}

/** `p.xa-save.is-ok` after Save draft: “Draft saved · 11 Aug 2026, 17:40” (B5-03 f6). */
export function draftSavedWords(at: string): string {
  return `Draft saved · ${at}`;
}

/** The same after Save changes in revise mode: “Changes saved · <at> · not resubmitted yet”. */
export function changesSavedWords(at: string): string {
  return `Changes saved · ${at} · not resubmitted yet`;
}

// ---- Step 1 · Course and description (B5-03 f0 … f6) --------------------------------------------

export const COURSE_STEP = {
  courseLabel: 'Course',
  chooseCourse: 'Choose a course',
  nameLabel: 'Experiment name',
  nameHint: 'Must be different from every other experiment’s name.',
  summaryLabel: 'Summary',
  summaryHint: 'One sentence. It is the first thing people read in the catalogue.',
  descriptionLabel: 'Description',
  descriptionHint: 'What learners do and what they find out.',
  versionLabel: 'Version',
  versionHint: 'For example 1.0',
  /** `p.xl-open` before the footer (T-29). */
  note: 'Prototype field set — the catalogue fields, and who maps an experiment to a course, are still open (T-29). Learning outcomes are added by the Academic Reviewer.',
} as const;

/** “Only the courses assigned to Northline Simulation Studio are listed.” */
export function courseHint(organisation: string): string {
  return `Only the courses assigned to ${organisation} are listed.`;
}

/** A course option and every “Course” value: “ME ZG523 · Thermodynamics & Heat Transfer”. */
export function courseWords(code: string | null, name: string): string {
  return code ? `${code} · ${name}` : name;
}

/** f5’s warning hint for a chosen course that was withdrawn while editing (`o.courseHint`). */
export function withdrawnCourseHint(code: string | null, name: string): string {
  return `You chose ${courseWords(code, name)}, which was withdrawn from your courses while you were editing.`;
}

// ---- Step 2 · Formats and delivery (B5-04 f0 … f6) ----------------------------------------------

export const FORMATS_STEP = {
  legend: 'Formats it supports',
  hint: 'Choose every format you are delivering. Each one appears in the catalogue only after it passes review and publication.',
  optional: '(optional)',
  webLink: 'Web link',
  webLinkHint: 'Starts with https://',
  browser: 'Browser and computer needed',
  browserHint: 'For example: a current browser on a laptop or desktop, with a keyboard and mouse.',
  /** `p.xl-open` in each package panel (T-14). */
  packageNote:
    'Package fields are provisional — how app packages are delivered is still open (T-14).',
  packageLabel: 'Package label',
  packageLabelHint: 'The name people will see for this build.',
  packageReference: 'Package reference',
  packageReferenceHint: 'Your build or store reference.',
  packageFile: 'Package file',
  packageFileHint: 'Instead of, or as well as, a reference. No source code.',
  chooseFile: 'Choose file',
  remove: 'Remove',
  device: 'Device needed',
  deviceHint: 'Which devices it runs on, and anything else it needs.',
  install: 'Install notes',
  installHint: 'What an institution’s lab team needs to install and start it.',
} as const;

/** The format’s checkbox words and its panel’s first words: “Browser (WEB)”. */
export function formatLabel(format: Technology): string {
  return FORMAT_META[format].vendorLabel;
}

/** A panel’s title: “Browser (WEB) · Web link”, “Virtual reality (VR) · App package”. */
export function formatPanelTitle(format: Technology): string {
  return format === 'web'
    ? `${formatLabel(format)} · Web link`
    : `${formatLabel(format)} · App package`;
}

/** “Notes for WEB”, “Notes for VR” (the “(optional)” marker follows). */
export function formatNotesLabel(format: Technology): string {
  return `Notes for ${FORMAT_META[format].code}`;
}

/** The package file’s Remove: “Remove the VR package file” (`rmAria`). */
export function removePackageFileLabel(format: Technology): string {
  return `Remove the ${FORMAT_META[format].code} package file`;
}

// ---- Step 3 · Preview and documents (B5-05 f3, f4) ----------------------------------------------

export const PREVIEW_STEP = {
  intro:
    'Everything here is optional. A preview reaches the public only if the experiment is published.',
  legend: 'Preview',
  label: 'Preview label',
  labelHint: 'For example: Two-minute walkthrough',
  link: 'Preview link',
  linkHint: 'Starts with https://',
  documents: 'Documents',
  documentsHint: 'Handouts or notes for the Academic Reviewer and the catalogue.',
  noDocuments: 'No documents added.',
  addDocument: 'Add document',
  /**
   * The documents “Add document” offers, in order (`D.docPool`): file names only, nothing is
   * uploaded (OD-B5-11; state-copy `VE-05.sample-documents`).
   */
  documentPool: [
    'Lab handout — Composite Wall.pdf',
    'Thermocouple positions.pdf',
    'Safety notes.pdf',
  ],
} as const;

/** A document’s Remove: “Remove Thermocouple positions.pdf” (`d.aria`). */
export function removeDocumentLabel(fileName: string): string {
  return `Remove ${fileName}`;
}

// ---- Step 4 · Check and submit (B5-05 f0, f2, f5, f6; B5-07 f3) ---------------------------------

export const CHECK_STEP = {
  readyTitle: 'Everything required is provided',
  readyLine: 'You can submit it for academic review now.',
  /** The quiet notice before Submit is pressed (`quietMissing`). */
  quietLine: 'Finish them, or save a draft and come back.',
  checklistLabel: 'What you have provided',
  sections: {
    course: 'Course and description',
    formats: 'Formats and delivery',
    preview: 'Preview and documents (optional)',
  },
  provided: 'Provided',
  previewMissing: 'Preview link missing',
  previewNone: 'None — optional',
  change: 'Change',
  /** The third row’s name (`aria`): “Change preview and documents”. */
  changePreview: 'Change preview and documents',
  rows: {
    experiment: 'Experiment',
    course: 'Course',
    version: 'Version',
    formats: 'Formats',
    preview: 'Preview',
    documents: 'Documents',
  },
  notNamed: 'Not named yet',
  notChosen: 'Not chosen yet',
  noVersion: '—',
  noFormats: 'None chosen yet',
  none: 'None',
  outcomesTitle: 'Learning outcomes',
  outcomesBy: 'Added by the Academic Reviewer · read-only',
  outcomesLine: 'One set for every format.',
  noOutcomes: 'None yet. The Academic Reviewer adds them during review — one set for every format.',
  /** `p.xw-note` before the footer. */
  note: 'Submitting sends it to the Academic Reviewer. It does not publish anything.',
  submit: 'Submit for academic review',
  resubmit: 'Resubmit',
} as const;

/** “3 things to finish before you can submit” (`o.missText`). */
export function missingCountWords(count: number): string {
  return `${count} thing${count === 1 ? '' : 's'} to finish before you can submit`;
}

/** A missing item’s way back: “Go to formats and delivery” (`'Go to ' + titles[…].toLowerCase()`). */
export function goToStepWords(step: Exclude<EditorStepKey, 'submit'>): string {
  return `Go to ${EDITOR.stepTitles[step].toLowerCase()}`;
}

/** A checklist row’s state: “Provided”, “2 missing” (`sec`). */
export function sectionStateWords(missing: number): string {
  return missing > 0 ? `${missing} missing` : CHECK_STEP.provided;
}

/** A checklist row’s Change: “Change course and description” (`'Change ' + label.toLowerCase()`). */
export function changeSectionLabel(section: 'course' | 'formats'): string {
  return `Change ${CHECK_STEP.sections[section].toLowerCase()}`;
}

/** “Two-minute walkthrough — https://…”, or the label alone (`o.cPreview`). */
export function previewWords(label: string | null, link: string | null): string {
  if (!label) return CHECK_STEP.none;
  return link ? `${label} — ${link}` : label;
}

/** The chosen formats and the documents, each joined with “ · ” (`o.cFmts`, `o.cDocs`). */
export function joinedWords(values: readonly string[], none: string): string {
  return values.length > 0 ? values.join(' · ') : none;
}

// ---- DL-1 Submit / Resubmit (B5-05 f6; B5-07) --------------------------------------------------

export const SUBMIT_DIALOG = {
  submitTitle: 'Submit for academic review?',
  resubmitTitle: 'Resubmit your changes?',
  resubmitEffect: 'Your changes are submitted for review. This does not publish anything.',
  whileReviewed:
    'You can’t edit it while it is being reviewed. If it comes back to you, you can revise it.',
  cancel: 'Cancel',
  keepEditing: 'Keep editing',
  submitting: 'Submitting…',
  /** An unnamed experiment in the effect (`T(s.name) || 'this experiment'`). */
  thisExperiment: 'this experiment',
} as const;

/** “This sends “Conduction Through a Composite Wall” to the Academic Reviewer. It does not publish anything.” */
export function submitEffect(name: string): string {
  return `This sends “${name || SUBMIT_DIALOG.thisExperiment}” to the Academic Reviewer. It does not publish anything.`;
}

// ---- after Submit / Resubmit (B5-05 f1; B5-07 f4) -----------------------------------------------

export const DONE = {
  submittedTitle: 'Submitted for academic review',
  resubmittedTitle: 'Submitted',
  resubmittedLead: 'Your changes have been submitted for review.',
  openRecord: 'Open the experiment record',
  backToList: 'Back to My experiments',
} as const;

/** “SUB-0077 · Conduction Through a Composite Wall” (`o.subLine`). */
export function subLineWords(id: string, name: string): string {
  return `${id} · ${name}`;
}

/** f1’s lead: “<sub line> is with the Academic Reviewer. Nothing is published. …”. */
export function submittedLead(id: string, name: string): string {
  return `${subLineWords(id, name)} is with the Academic Reviewer. Nothing is published. You can’t edit it while it is being reviewed.`;
}

/** B5-07 f4’s meta line: “<sub line> · nothing is needed from you now.” (M-3: no gate named). */
export function resubmittedLine(id: string, name: string): string {
  return `${subLineWords(id, name)} · nothing is needed from you now.`;
}

// ---- read-only and not editable here (B5-07 f6; the board’s idle notices) ----------------------

export const READ_ONLY = {
  entered: 'What you entered',
  rows: {
    course: 'Course',
    summary: 'Summary',
    version: 'Version',
    formats: 'Formats',
  },
  /** A delivery box’s title (`d.title`) and rows (`d.rows`). */
  webTitle: 'Web link',
  packageTitle: 'App package',
  webLink: 'Web link',
  browser: 'Browser and computer',
  notes: 'Notes',
  packageLabel: 'Package label',
  packageReference: 'Package reference',
  packageFile: 'Package file',
  device: 'Device needed',
  install: 'Install notes',
  empty: '—',
  backToList: 'Back to My experiments',
  help: 'Ask for help',
  /** The board’s notices for a record opened while it is with others (`st_with_rv`, `st_submitted`). */
  withReviewerTitle: 'With the Academic Reviewer',
  withReviewerLine:
    'You can’t edit it while it is being reviewed. If it is returned to you, you can revise it here.',
  submittedTitle: 'Submitted',
  submittedLine: 'Your changes have been submitted for review. Nothing is needed from you now.',
  openRecord: 'Open the experiment record',
} as const;

/** The record line above the name: “SUB-0083 · MEL ZG512”, “· revision 2” after a resubmit (`o.recMeta`). */
export function recordMetaWords(id: string, code: string | null, revision: number): string {
  return `${id} · ${code ?? READ_ONLY.empty}${revision > 1 ? ` · revision ${revision}` : ''}`;
}

/** f6’s notice title: “MEL ZG512 is no longer assigned to you”. */
export function noLongerAssignedTitle(code: string): string {
  return `${code} is no longer assigned to you`;
}

/**
 * f6’s notice line. The board names the day the course was withdrawn (“… on 15 Aug 2026.”); the
 * editor’s read carries no withdrawal date, so the line leaves the day out (state-copy
 * `VE-09.withdrawn-line`) unless one is given.
 */
export function noLongerAssignedLine(
  course: string,
  organisation: string,
  withdrawnOn: string | null,
): string {
  return withdrawnOn
    ? `${course} was withdrawn from ${organisation} on ${withdrawnOn}. This draft is kept, read-only. BITS / WILP decides which courses are yours.`
    : stateWords('VE-09.withdrawn-line')
        .replace('{course}', course)
        .replace('{organisation}', organisation);
}

// ---- the returned notice (B5-06 f3, f6; B5-07 f0 … f3, f7, f8) ----------------------------------

export const RETURNED = {
  refersTo: 'What it refers to',
} as const;

/** “19 Aug 2026, 16:05 · Prof. A. Menon” (`o.retWhen`). */
export function returnedWhenWords(at: string, who: string): string {
  return `${at} · ${who}`;
}

const REFERENCE_STEP: Readonly<Record<ReturnReference['step'], string>> = {
  'course-and-description': 'Course & description',
  'formats-and-delivery': 'Formats & delivery',
  'preview-and-documents': 'Preview & documents',
};

const REFERENCE_FIELD: Readonly<Record<ReturnReference['field'], string>> = {
  summary: 'Summary',
  description: 'Description',
  'web-link': 'Web link',
  'browser-and-computer': 'Browser and computer',
  package: 'Package',
  'device-need': 'Device need',
  'install-notes': 'Install notes',
  'preview-link': 'Preview link',
};

/** “Formats & delivery · VR · Device need”, “Course & description · Summary” (B6-03 references). */
export function referenceWords(reference: ReturnReference): string {
  return [
    REFERENCE_STEP[reference.step],
    ...(reference.format ? [FORMAT_META[reference.format].code] : []),
    REFERENCE_FIELD[reference.field],
  ].join(' · ');
}

/** A live reference’s name: “Go to Formats & delivery · VR · Device need” (`r.aria`). */
export function goToReferenceLabel(reference: ReturnReference): string {
  return `Go to ${referenceWords(reference)}`;
}
