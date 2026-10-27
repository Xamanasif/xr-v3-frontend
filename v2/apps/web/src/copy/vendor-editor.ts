/**
 * The words of the experiment editor — VE-03 Course and description, VE-04 Formats and delivery,
 * VE-05 Preview and documents, VE-06 Check and submit, VE-09 Edit draft and VE-08 Revise and
 * resubmit — in the owner-approved V3 Vendor design (design/v3-refined-b/roles/VE-v1,
 * `project/Main.dc.html`: the editor's template and its script's `edView`, `dlgView`), and of the
 * returned-record notice the editor and the record share. Every drawn phrase is the export's own,
 * found verbatim in its markup or script (`vendor-editor.test.ts`); the composed lines take the
 * script's forms with the records' values — names, codes and dates are never copied from the
 * sample, and no line or name carries the submission's reference: where the script's form writes
 * one, it is left out (owner's identifier rule, 22 Oct 2026; state-copy `VE-02.no-reference`).
 * What the export does not draw is a provisional entry of the state-copy register
 * (`state-copy-vendor-editor.ts`, VD-12). The field errors are the contract's catalogue (`VE-03.*`,
 * `VE-04.*`, `VE-05.*`: v46's exact messages), worded by the service and by
 * `queries/production-editor.ts`.
 */
import type { ReturnReference, Technology } from '@xr/domain';
import { FORMAT_META } from '@xr/domain';

import { stateWords } from './state-copy';

export type EditorMode = 'create' | 'edit' | 'revise';
export type EditorStepKey = 'course' | 'formats' | 'preview' | 'submit';
type FieldStep = Exclude<EditorStepKey, 'submit'>;

// ---- the frame: head, stepper and outline, actions ----------------------------------------------

export const EDITOR = {
  /** Both step lists' name (`nav.ve-steps`, the aside's `nav`). */
  stepsLabel: 'Steps',
  /** The top stepper's words (`SHORT`). */
  steps: {
    course: 'Course',
    formats: 'Formats',
    preview: 'Preview',
    submit: 'Check',
  } satisfies Record<EditorStepKey, string>,
  /** The H1 of each step and the outline's titles (`TITLES`). */
  stepTitles: {
    course: 'Course and description',
    formats: 'Formats and delivery',
    preview: 'Preview and documents',
    submit: 'Check and submit',
  } satisfies Record<EditorStepKey, string>,
  /** The eyebrow's first words and the breadcrumb's last, by mode (`flowWord`). */
  modeWords: {
    create: 'Create experiment',
    edit: 'Edit draft',
    revise: 'Revise and resubmit',
  } satisfies Record<EditorMode, string>,
  /** Each step's live state in the outline (`stateOf`). */
  stepStates: {
    complete: 'Complete',
    inProgress: 'In progress',
    notStarted: 'Not started',
    checkPreview: 'Check the preview link',
    optional: 'Optional',
    ready: 'Ready to submit',
    notReady: 'Not ready yet',
  },
  /** The meta line and the outline's saved line before the first save (OD-B5-07). */
  notSaved: 'Not saved yet',
  /** The outline before a name is typed (`progName`). */
  untitled: 'Untitled experiment',
  /** The outline's kicker and visibility line for a new experiment (`progK`, `progVis`). */
  newKicker: 'New experiment · not saved yet',
  newVisibility: 'Save a draft to keep your work. Only you can see a draft.',
  draftVisibility: 'Only you can see a draft.',
  /** Revise mode's outline before any change is saved privately (`o.progSaved`). */
  noChangesSaved: 'No changes saved yet',
  /** `div.rk-errsum > p.rk-errsum-t` on every step. */
  summaryTitle: 'Check this step',
  /** A field the return refers to (`span.rk-tag-warn.ve-reftag`). */
  referred: 'Referred to in the return',
  /** `span.ve-opt` after an optional field or section. */
  optional: '(optional)',
  /** `div.vr-actions`: the way out first, then the step's actions. */
  cancel: 'Cancel',
  previous: 'Back',
  saveDraft: 'Save draft',
  saveChanges: 'Save changes',
  continue: 'Continue',
  /** The failed read's retry. */
  tryAgain: 'Try again',
} as const;

/** “Create experiment · Step 1 of 4” (`o.over`). */
export function overlineWords(mode: EditorMode, step: number): string {
  return `${EDITOR.modeWords[mode]} · Step ${step} of 4`;
}

/**
 * The head's meta line (`o.idLine` without the submission's reference, state-copy
 * `VE-02.no-reference`): “Not saved yet”, “Only you can see a draft”, “Revision 1 was returned”.
 */
export function idLineWords(saved: boolean, mode: EditorMode, revision: number): string {
  if (!saved) return EDITOR.notSaved;
  if (mode === 'revise') return `Revision ${revision} was returned`;
  return 'Only you can see a draft';
}

/** The top stepper's button name: “Step 2 of 4, Formats and delivery, in progress” (`x.aria`). */
export function stepButtonLabel(step: number, title: string, state: string): string {
  return `Step ${step} of 4, ${title}, ${state.toLowerCase()}`;
}

/** The outline's list of a step's parts: “Parts of Course and description” (`x.subAria`). */
export function partsLabel(title: string): string {
  return `Parts of ${title}`;
}

/**
 * The outline's kicker (`o.progK` without the submission's reference, state-copy
 * `VE-02.no-reference`): “Draft”, “Revision 1 returned”.
 */
export function outlineKicker(mode: EditorMode, revision: number): string {
  return mode === 'revise' ? `Revision ${revision} returned` : 'Draft';
}

/** “Last saved 27 Aug 2026, 10:40” (the outline and the read-only draft's meta line). */
export function lastSavedWords(at: string): string {
  return `Last saved ${at}`;
}

/**
 * Revise mode's outline once changes are saved privately: “Changes saved · 10:40 today · not
 * resubmitted” (`o.progSaved`), or with the day when they were saved before today.
 */
export function outlineChangesSaved(when: string): string {
  return `Changes saved · ${when} · not resubmitted`;
}

/** “10:40 today”. */
export function todayAt(time: string): string {
  return `${time} today`;
}

/** Revise mode's visibility line: “Others see revision 1 as submitted until you resubmit.” */
export function reviseVisibility(revision: number): string {
  return `Others see revision ${revision} as submitted until you resubmit.`;
}

/** A part's or a block's live status (`secSt`): “Complete”, “2 still needed”, “1 to fix”. */
export function stillNeededWords(count: number): string {
  return `${count} still needed`;
}

export function toFixWords(count: number): string {
  return `${count} to fix`;
}

/** The save line next to Cancel or Back: “Draft saved · 27 Aug 2026, 10:40”. */
export function draftSavedWords(at: string): string {
  return `Draft saved · ${at}`;
}

/** The same after Save changes in revise mode: “Changes saved · <at> · not resubmitted yet”. */
export function changesSavedWords(at: string): string {
  return `Changes saved · ${at} · not resubmitted yet`;
}

// ---- Step 1 · Course and description (VE-03) ----------------------------------------------------

export const COURSE_STEP = {
  /** The step's two sections (and the outline's parts of step 1). */
  sections: { courseAndName: 'Course and name', catalogue: 'Catalogue text' },
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
  /** `p.vr-foot` closing Catalogue text. */
  note: 'Prototype field set — the catalogue fields, and who maps an experiment to a course, are still open. Learning outcomes are added by the Academic Reviewer.',
} as const;

/** A course option and every “Course” value: “ME ZG523 · Thermodynamics & Heat Transfer”. */
export function courseWords(code: string | null, name: string): string {
  return code ? `${code} · ${name}` : name;
}

/** The stale-course line inside the course hint (`o.staleHint`). */
export function withdrawnCourseHint(code: string | null, name: string): string {
  return `You chose ${courseWords(code, name)}, which was withdrawn from your courses while you were editing.`;
}

// ---- Step 2 · Formats and delivery (VE-04) ------------------------------------------------------

export const FORMATS_STEP = {
  legend: 'Formats it supports',
  hint: 'Choose every format you are delivering. Each one appears in the catalogue only after it passes review and publication.',
  /** How each format is delivered (`kindShort`, the blocks' kind). */
  kinds: { web: 'Web link', package: 'App package' },
  deliveryTitle: 'Delivery details',
  deliveryLine: 'One panel for each format you chose.',
  /** The guidance written once above the blocks (`div.vr-guide`). */
  guideTitle: 'What each app package needs',
  guide: {
    label: 'The name people will see for this build.',
    reference:
      'Your build or store reference. You can attach the package file instead of, or as well as, a reference. No source code.',
    device: 'Which devices it runs on, and anything else it needs.',
    install: 'What an institution’s lab team needs to install and start it.',
  },
  packageNote: 'Package fields are provisional — how app packages are delivered is still open.',
  webLink: 'Web link',
  webLinkHint: 'Starts with https://',
  browser: 'Browser and computer needed',
  browserHint: 'For example: a current browser on a laptop or desktop, with a keyboard and mouse.',
  packageLabel: 'Package label',
  packageReference: 'Package reference',
  device: 'Device needed',
  install: 'Install notes',
  attachFile: 'Attach file',
  remove: 'Remove',
} as const;

/** A format's name in the selector, the blocks and the outline: “Browser”, “Virtual reality”. */
export function formatName(format: Technology): string {
  return FORMAT_META[format].name;
}

/** How a format is delivered: “Web link” or “App package”. */
export function formatKind(format: Technology): string {
  return format === 'web' ? FORMATS_STEP.kinds.web : FORMATS_STEP.kinds.package;
}

/** A chosen format in the outline: “WEB · Browser”. */
export function formatPartLabel(format: Technology): string {
  return `${FORMAT_META[format].code} · ${formatName(format)}`;
}

/** “1 of 2 formats complete” over the blocks (`o.dlvSummary`). */
export function formatsCompleteWords(done: number, chosen: number): string {
  return `${done} of ${chosen} ${chosen === 1 ? 'format' : 'formats'} complete`;
}

/** “Notes for WEB”, “Notes for VR” (the “(optional)” marker follows). */
export function formatNotesLabel(format: Technology): string {
  return `Notes for ${FORMAT_META[format].code}`;
}

/** Attach file's name: “Attach the AR package file” (`p.attachAria`). */
export function attachFileLabel(format: Technology): string {
  return `Attach the ${FORMAT_META[format].code} package file`;
}

/** The package file's Remove: “Remove the VR package file” (`rmAria`). */
export function removePackageFileLabel(format: Technology): string {
  return `Remove the ${FORMAT_META[format].code} package file`;
}

// ---- Step 3 · Preview and documents (VE-05) -----------------------------------------------------

export const PREVIEW_STEP = {
  title: 'Preview',
  intro:
    'Everything here is optional. A preview reaches the public only if the experiment is published.',
  label: 'Preview label',
  labelHint: 'For example: Two-minute walkthrough',
  link: 'Preview link',
  linkHint: 'Starts with https://',
  documents: 'Documents',
  documentsHint: 'Handouts or notes for the Academic Reviewer and the catalogue.',
  noDocuments: 'No documents added.',
  addDocument: 'Add document',
  /**
   * The documents “Add document” offers, in order: file names only, nothing is uploaded
   * (OD-B5-11; state-copy `VE-05.sample-documents`).
   */
  documentPool: [
    'Lab handout — Composite Wall.pdf',
    'Thermocouple positions.pdf',
    'Safety notes.pdf',
  ],
} as const;

/** A document's Remove: “Remove Thermocouple positions.pdf” (`d.aria`). */
export function removeDocumentLabel(fileName: string): string {
  return `Remove ${fileName}`;
}

// ---- Step 4 · Check and submit (VE-06; VE-08's step 4) ------------------------------------------

export const CHECK_STEP = {
  readyTitle: 'Everything required is provided',
  readyLine: 'You can submit it for academic review now.',
  readyLineRevise: 'You can resubmit it now.',
  /** The quiet notice before Submit is pressed (`quietMissing`). */
  quietLine: 'Finish them, or save a draft and come back.',
  /** One review section per step (the third is marked optional). */
  sections: {
    course: 'Course and description',
    formats: 'Formats and delivery',
    preview: 'Preview and documents',
  } satisfies Record<FieldStep, string>,
  provided: 'Provided',
  previewMissing: 'Preview link missing',
  previewNone: 'None — optional',
  change: 'Change',
  rows: {
    experiment: 'Experiment',
    course: 'Course',
    version: 'Version',
    summary: 'Summary',
    description: 'Description',
    preview: 'Preview',
    documents: 'Documents',
  },
  notNamed: 'Not named yet',
  notChosen: 'Not chosen yet',
  /** An empty value. */
  empty: '—',
  /** No format chosen (`p.vr-empty`). */
  noFormats: 'None chosen yet',
  none: 'None',
  outcomesTitle: 'Learning outcomes',
  outcomesBy: 'Added by the Academic Reviewer · read-only',
  outcomesLine: 'One set for every format.',
  noOutcomes: 'None yet. The Academic Reviewer adds them during review — one set for every format.',
  /** `p.ve-submitnote` just above the actions (`o.submitNote`). */
  note: 'Submitting sends it to the Academic Reviewer. It does not publish anything.',
  noteRevise: 'Resubmitting sends your changes for review. It does not publish anything.',
  submit: 'Submit for academic review',
  resubmit: 'Resubmit',
} as const;

/** “3 things to finish before you can submit” (`o.missText`). */
export function missingCountWords(count: number): string {
  return `${count} thing${count === 1 ? '' : 's'} to finish before you can submit`;
}

/** A missing item's way back: “Go to formats and delivery” (`'Go to ' + TITLES[…].toLowerCase()`). */
export function goToStepWords(step: FieldStep): string {
  return `Go to ${EDITOR.stepTitles[step].toLowerCase()}`;
}

/** A review section's state: “Provided”, “2 missing” (`sec`). */
export function sectionStateWords(missing: number): string {
  return missing > 0 ? `${missing} missing` : CHECK_STEP.provided;
}

/** A review section's Change: “Change formats and delivery” (`'Change ' + label.toLowerCase()`). */
export function changeSectionLabel(section: FieldStep): string {
  return `Change ${CHECK_STEP.sections[section].toLowerCase()}`;
}

/** “Two-minute walkthrough — https://…”, or the label alone (`o.cPreview`). */
export function previewWords(label: string | null, link: string | null): string {
  if (!label) return CHECK_STEP.none;
  return link ? `${label} — ${link}` : label;
}

/** The documents, joined with “ · ” (`o.cDocs`). */
export function joinedWords(values: readonly string[], none: string): string {
  return values.length > 0 ? values.join(' · ') : none;
}

// ---- the confirmation dialogs: Submit / Resubmit, Leave without saving? --------------------------

export const SUBMIT_DIALOG = {
  submitTitle: 'Submit for academic review?',
  resubmitTitle: 'Resubmit your changes?',
  resubmitEffect: 'Your changes are submitted for review. This does not publish anything.',
  nowTitle: 'What happens now',
  laterTitle: 'Only after later events',
  submitNow: ['It is with the Academic Reviewer.', 'You can’t edit it while it is being reviewed.'],
  whileReviewed: 'You can’t edit it while it is being reviewed.',
  later: 'If it comes back to you, you can revise it.',
  cancel: 'Cancel',
  keepEditing: 'Keep editing',
  submitting: 'Submitting…',
  /** An unnamed experiment in the effect (`T(ed.data.name) || 'this experiment'`). */
  thisExperiment: 'this experiment',
} as const;

/** “This sends “Conduction Through a Composite Wall” to the Academic Reviewer. It does not publish anything.” */
export function submitEffect(name: string): string {
  return `This sends “${name || SUBMIT_DIALOG.thisExperiment}” to the Academic Reviewer. It does not publish anything.`;
}

/** “Your changes are sent as revision 2.” (the record's revision and one). */
export function revisionSentWords(revision: number): string {
  return `Your changes are sent as revision ${revision}.`;
}

/** The leave guard (a safeguard new in V3; state-copy `VE-04.leave-guard`). */
export const LEAVE_DIALOG = {
  title: 'Leave without saving?',
  draftLine: 'Your changes since you last saved will be lost. Save a draft first to keep them.',
  reviseLine:
    'Your changes since you last saved will be lost. Save your changes first to keep them.',
  keepEditing: 'Keep editing',
  leave: 'Leave without saving',
} as const;

// ---- after Submit / Resubmit: the outcome card (VE-06, VE-08) ------------------------------------

export const DONE = {
  submittedTitle: 'Submitted for academic review',
  resubmittedTitle: 'Submitted',
  submittedText:
    'It is with the Academic Reviewer. Nothing is published. You can’t edit it while it is being reviewed.',
  resubmittedText: 'Your changes have been submitted for review.',
  submittedNext: 'Nothing is published. If it comes back to you, you can revise it here.',
  resubmittedNext:
    'Nothing is needed from you now. If it comes back to you, you can revise it again.',
  facts: {
    status: 'Status',
    revision: 'Revision',
    submitted: 'Submitted',
    formats: 'Formats',
  },
  openRecord: 'Open the experiment record',
  backToList: 'Back to My experiments',
} as const;

/**
 * The outcome's and the refusal's eyebrow: the experiment's name, “Natural Convection from a
 * Vertical Plate” (`o.doneEyebrow`, `o.refEyebrow` without the submission's reference, state-copy
 * `VE-02.no-reference`); “Untitled experiment” for a record without one.
 */
export function subLineWords(name: string): string {
  return name.trim() || EDITOR.untitled;
}

/** The outcome's formats in words: “Formats: WEB, VR” (`o.doneFmtAria`). */
export function formatsNameWords(codes: readonly string[]): string {
  return `Formats: ${codes.join(', ')}`;
}

// ---- refusals: a stale editor address (VE-08, VE-09) --------------------------------------------

export type RefusalKind =
  'already-submitted' | 'being-reviewed' | 'recheck' | 'approved' | 'published' | 'other';

export const REFUSAL = {
  titles: {
    'already-submitted': 'This experiment was already submitted',
    'being-reviewed': 'This experiment is being reviewed',
    recheck: 'This experiment is being reviewed',
    approved: 'This experiment was approved by the Academic Reviewer',
    published: 'This experiment is published',
    other: 'This experiment can’t be edited now',
  } satisfies Record<RefusalKind, string>,
  lines: {
    'being-reviewed':
      'You can’t edit it while it is being reviewed. If it is returned to you, you can revise it here.',
    recheck: 'You can’t edit it while it is being reviewed. Nothing is needed from you.',
    approved: 'It is with the Content Manager. Nothing is needed from you now.',
    published: 'Changes to a published experiment are not made from the Vendor workspace.',
    other: 'Open its record to see where it stands.',
  } satisfies Record<Exclude<RefusalKind, 'already-submitted'>, string>,
} as const;

/** “It was submitted on 26 Aug 2026. You can’t edit it after it is submitted. …” */
export function alreadySubmittedLine(on: string): string {
  return `It was submitted on ${on}. You can’t edit it after it is submitted. If it is returned to you, you can revise it here.`;
}

// ---- read-only: a draft whose course is no longer assigned (VE-09) ------------------------------

export const READ_ONLY = {
  /** The crumb (`crumbHere`) and the head's chip. */
  crumb: 'Read-only',
  status: 'Draft · read-only',
  entered: 'What you entered',
  rows: {
    course: 'Course',
    summary: 'Summary',
    version: 'Version',
    formats: 'Formats',
  },
  /** A delivery block's rows (`deliv`). */
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
} as const;

/**
 * “Experiment” (`o.roEyebrow`, “Experiment · ” and the submission's reference, without the
 * reference: state-copy `VE-02.no-reference`).
 */
export const READ_ONLY_EYEBROW = 'Experiment';

/** The notice's title: “MEL ZG512 is no longer assigned to you”. */
export function noLongerAssignedTitle(code: string): string {
  return `${code} is no longer assigned to you`;
}

/**
 * The notice's line. The export names the day the course was withdrawn (“… on 15 Aug 2026.”); the
 * editor's read carries no withdrawal date, so the line leaves the day out (state-copy
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

// ---- the returned notice (VE-07, VE-08) ---------------------------------------------------------

export const RETURNED = {
  refersTo: 'What it refers to',
} as const;

/** “24 Aug 2026, 09:30 · Prof. A. Menon” (`o.retM`). */
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

/** A live reference's name: “Go to Formats & delivery · VR · Device need” (`x.aria`). */
export function goToReferenceLabel(reference: ReturnReference): string {
  return `Go to ${referenceWords(reference)}`;
}
