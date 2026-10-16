/**
 * The experiment editor as data (boards B5-03 … B5-05, B5-07; the script's `vxView`): the typed
 * draft and the contract content it becomes, the board's field ids (`Ve-course` … `Ve-plink`),
 * which step a field belongs to, the drawn field errors from a `validation-failed` answer (the
 * client's own check and the service's alike), what "Check and submit" lists as missing and how
 * its checklist and summary read, and where a returned record's "What it refers to" points. Nothing
 * is decided here: the service answers again when the experiment is saved or sent.
 */
import type { ValidationFailed } from '@xr/contracts/draft';
import type { ReturnReference, Submission, SubmissionContent, Technology } from '@xr/domain';
import { FORMAT_META, inDisplayOrder } from '@xr/domain';

import {
  CHECK_STEP,
  EDITOR,
  goToStepWords,
  joinedWords,
  previewWords,
  sectionStateWords,
} from '@/copy/vendor-editor';
import { EDITOR_STEPS, type EditorStepSlug } from '@/nav/vendor';
import { type FormFieldError, formFieldErrors } from '@/queries/faculty-forms';
import type { EditorContentInput } from '@/queries/production-editor';

export type PackageFormat = 'ar' | 'vr' | 'mr';
export const PACKAGE_FORMATS: readonly PackageFormat[] = ['ar', 'vr', 'mr'];
/** The four checkboxes in the board's order (WEB · AR · VR · MR, `FORMAT_DISPLAY_ORDER`). */
export const EDITOR_FORMATS: readonly Technology[] = inDisplayOrder(['web', 'ar', 'vr', 'mr']);

export interface WebDraft {
  readonly webLink: string;
  readonly browserAndComputer: string;
  readonly notes: string;
}

export interface PackageDraft {
  readonly packageLabel: string;
  readonly packageReference: string;
  /** A sample file name only — nothing is uploaded (OD-B5-11). */
  readonly packageFileName: string | null;
  readonly deviceNeeded: string;
  readonly installNotes: string;
  readonly notes: string;
}

/**
 * What the four steps hold, as typed. A format's panel keeps its values while the format is
 * unticked (the board's state does); only the ticked formats' delivery is sent.
 */
export interface EditorDraft {
  readonly courseId: string | null;
  readonly name: string;
  readonly summary: string;
  readonly description: string;
  readonly version: string;
  readonly formats: readonly Technology[];
  readonly web: WebDraft;
  readonly packages: Readonly<Record<PackageFormat, PackageDraft>>;
  readonly previewLabel: string;
  readonly previewLink: string;
  readonly documents: readonly string[];
}

const EMPTY_WEB: WebDraft = Object.freeze({ webLink: '', browserAndComputer: '', notes: '' });
const EMPTY_PACKAGE: PackageDraft = Object.freeze({
  packageLabel: '',
  packageReference: '',
  packageFileName: null,
  deviceNeeded: '',
  installNotes: '',
  notes: '',
});

export const EMPTY_EDITOR_DRAFT: EditorDraft = Object.freeze({
  courseId: null,
  name: '',
  summary: '',
  description: '',
  version: '',
  formats: Object.freeze([]) as readonly Technology[],
  web: EMPTY_WEB,
  packages: Object.freeze({ ar: EMPTY_PACKAGE, vr: EMPTY_PACKAGE, mr: EMPTY_PACKAGE }),
  previewLabel: '',
  previewLink: '',
  documents: Object.freeze([]) as readonly string[],
});

/** A saved record's content as the editor shows it (nothing is `null` in a field). */
export function draftOf(content: SubmissionContent): EditorDraft {
  const web = content.delivery.web;
  const packageOf = (format: PackageFormat): PackageDraft => {
    const entry = content.delivery[format];
    if (!entry || entry.format === 'web') return EMPTY_PACKAGE;
    return {
      packageLabel: entry.packageLabel ?? '',
      packageReference: entry.packageReference ?? '',
      packageFileName: entry.packageFileName,
      deviceNeeded: entry.deviceNeeded ?? '',
      installNotes: entry.installNotes ?? '',
      notes: entry.notes ?? '',
    };
  };
  return {
    courseId: content.courseId,
    name: content.name,
    summary: content.summary ?? '',
    description: content.description ?? '',
    version: content.version ?? '',
    formats: inDisplayOrder(content.formats),
    web:
      web && web.format === 'web'
        ? {
            webLink: web.webLink ?? '',
            browserAndComputer: web.browserAndComputer ?? '',
            notes: web.notes ?? '',
          }
        : EMPTY_WEB,
    packages: { ar: packageOf('ar'), vr: packageOf('vr'), mr: packageOf('mr') },
    previewLabel: content.preview.label ?? '',
    previewLink: content.preview.link ?? '',
    documents: content.documents.map((document) => document.fileName),
  };
}

/** The draft as the contract's content input (the ticked formats' delivery only; values as typed). */
export function contentOf(draft: EditorDraft): EditorContentInput {
  const formats = inDisplayOrder(draft.formats);
  const delivery: Record<string, unknown> = {};
  for (const format of formats) {
    delivery[format] =
      format === 'web'
        ? { format: 'web', ...draft.web }
        : { format, ...draft.packages[format as PackageFormat] };
  }
  return {
    courseId: draft.courseId as EditorContentInput['courseId'],
    name: draft.name,
    summary: draft.summary,
    description: draft.description,
    version: draft.version,
    formats,
    delivery: delivery as EditorContentInput['delivery'],
    preview: { label: draft.previewLabel, link: draft.previewLink },
    documents: draft.documents.map((fileName) => ({ fileName })),
  };
}

// ---- fields, their ids and their steps ----------------------------------------------------------

type DeliveryKey = keyof Omit<PackageDraft, 'packageFileName'> | 'packageFileName';
export type EditorField =
  | 'courseId'
  | 'name'
  | 'summary'
  | 'description'
  | 'version'
  | 'formats'
  | `web.${keyof WebDraft}`
  | `${PackageFormat}.${DeliveryKey}`
  | 'preview.label'
  | 'preview.link';

export type EditorError = FormFieldError<EditorField>;

/** The board's id prefix for the editor (`Vm-h`, `Vm-err` … on B5-07; `Ve-` here). */
export const ID_PREFIX = 'Ve';
export const TITLE_ID = `${ID_PREFIX}-h`;
export const ERRORS_ID = `${ID_PREFIX}-err`;
export const SAVED_ID = `${ID_PREFIX}-saved`;
export const MISSING_ID = `${ID_PREFIX}-miss`;
export const DONE_ID = `${ID_PREFIX}-done`;
export const REASON_ID = `${ID_PREFIX}-reason`;
export const SUBMIT_ID = `${ID_PREFIX}-sbtn`;

const PACKAGE_SUFFIX: Readonly<Record<DeliveryKey, string>> = {
  packageLabel: 'label',
  packageReference: 'ref',
  packageFileName: 'file',
  deviceNeeded: 'device',
  installNotes: 'install',
  notes: 'notes',
};

const WEB_SUFFIX: Readonly<Record<keyof WebDraft, string>> = {
  webLink: 'link',
  browserAndComputer: 'browser',
  notes: 'notes',
};

/** The control an error-summary link or a reference focuses (B5-03 … B5-07 ids). */
export function fieldId(field: EditorField): string {
  const fixed: Partial<Record<EditorField, string>> = {
    courseId: 'course',
    name: 'name',
    summary: 'summary',
    description: 'desc',
    version: 'version',
    formats: 'fmts',
    'preview.label': 'plabel',
    'preview.link': 'plink',
  };
  const own = fixed[field];
  if (own) return `${ID_PREFIX}-${own}`;
  const [format, key] = field.split('.') as [Technology, string];
  const code = FORMAT_META[format].code;
  const suffix =
    format === 'web' ? WEB_SUFFIX[key as keyof WebDraft] : PACKAGE_SUFFIX[key as DeliveryKey];
  return `${ID_PREFIX}-${code}_${suffix}`;
}

/** The step a field is on (the board's `stepOf`). */
export function stepOfField(field: EditorField): Exclude<EditorStepSlug, 'submit'> {
  if (['courseId', 'name', 'summary', 'description', 'version'].includes(field)) return 'course';
  return field.startsWith('preview.') ? 'preview' : 'formats';
}

/** A contract path (`content.delivery.vr.deviceNeeded`) as the editor's field, or `null`. */
export function fieldOfPath(path: string): EditorField | null {
  const bare = path.startsWith('content.') ? path.slice('content.'.length) : path;
  if (['courseId', 'name', 'summary', 'description', 'version', 'formats'].includes(bare))
    return bare as EditorField;
  if (bare === 'preview.label' || bare === 'preview.link') return bare;
  const delivery = /^delivery\.(web|ar|vr|mr)\.(\w+)$/.exec(bare);
  if (!delivery) return null;
  const [, format, key] = delivery as unknown as [string, Technology, string];
  if (format === 'web') return key in WEB_SUFFIX ? (`web.${key}` as EditorField) : null;
  return key in PACKAGE_SUFFIX ? (`${format}.${key}` as EditorField) : null;
}

/** A `validation-failed` answer (the client's check or the service's) as the editor's field errors. */
export function editorErrors(error: ValidationFailed): EditorError[] {
  return formFieldErrors<EditorField>(error, fieldOfPath);
}

// ---- steps ---------------------------------------------------------------------------------------

export function stepNumber(step: EditorStepSlug): number {
  return EDITOR_STEPS.indexOf(step) + 1;
}

export function previousStep(step: EditorStepSlug): EditorStepSlug {
  return EDITOR_STEPS[Math.max(stepNumber(step) - 2, 0)]!;
}

export function nextStep(step: EditorStepSlug): EditorStepSlug {
  return EDITOR_STEPS[Math.min(stepNumber(step), EDITOR_STEPS.length - 1)]!;
}

// ---- Check and submit (B5-05 f0, f5; B5-07 f3) ---------------------------------------------------

/** One missing item: its words, its step's "Go to …" and the field it opens. */
export interface MissingItem {
  readonly field: EditorField;
  readonly text: string;
  readonly step: Exclude<EditorStepSlug, 'submit'>;
  readonly where: string;
}

export function missingItems(errors: readonly EditorError[]): MissingItem[] {
  return errors.map((error) => {
    const step = stepOfField(error.field);
    return { field: error.field, text: error.message, step, where: goToStepWords(step) };
  });
}

/** One checklist row (`li.xv-check-row`). */
export interface ChecklistRow {
  readonly step: Exclude<EditorStepSlug, 'submit'>;
  readonly label: string;
  readonly ok: boolean;
  readonly state: string;
}

/** The three rows (the script's `sec` and the preview row). */
export function checklistRows(missing: readonly MissingItem[], draft: EditorDraft): ChecklistRow[] {
  const count = (step: ChecklistRow['step']) => missing.filter((item) => item.step === step).length;
  const previewBad = count('preview') > 0;
  return [
    {
      step: 'course',
      label: CHECK_STEP.sections.course,
      ok: count('course') === 0,
      state: sectionStateWords(count('course')),
    },
    {
      step: 'formats',
      label: CHECK_STEP.sections.formats,
      ok: count('formats') === 0,
      state: sectionStateWords(count('formats')),
    },
    {
      step: 'preview',
      label: CHECK_STEP.sections.preview,
      ok: !previewBad,
      state: previewBad
        ? CHECK_STEP.previewMissing
        : draft.previewLabel.trim() || draft.documents.length > 0
          ? CHECK_STEP.provided
          : CHECK_STEP.previewNone,
    },
  ];
}

/** The summary under the checklist (`dl.xl-kv.xv-kv`): the board's six rows. */
export function summaryRows(
  draft: EditorDraft,
  courseLine: string | null,
): readonly (readonly [string, string])[] {
  const label = draft.previewLabel.trim();
  const link = draft.previewLink.trim();
  return [
    [CHECK_STEP.rows.experiment, draft.name.trim() || CHECK_STEP.notNamed],
    [CHECK_STEP.rows.course, courseLine ?? CHECK_STEP.notChosen],
    [CHECK_STEP.rows.version, draft.version.trim() || CHECK_STEP.noVersion],
    [
      CHECK_STEP.rows.formats,
      joinedWords(
        inDisplayOrder(draft.formats).map((format) => FORMAT_META[format].code),
        CHECK_STEP.noFormats,
      ),
    ],
    [CHECK_STEP.rows.preview, previewWords(label || null, link || null)],
    [CHECK_STEP.rows.documents, joinedWords(draft.documents, CHECK_STEP.none)],
  ];
}

// ---- the returned record's references (B5-07 f0 … f2) -------------------------------------------

/** Where a "What it refers to" link goes: the step and the field (a format no longer ticked: the formats). */
export function referenceTarget(
  reference: ReturnReference,
  draft: EditorDraft,
): { readonly step: Exclude<EditorStepSlug, 'submit'>; readonly field: EditorField } {
  if (reference.step === 'course-and-description')
    return { step: 'course', field: reference.field === 'description' ? 'description' : 'summary' };
  if (reference.step === 'preview-and-documents') return { step: 'preview', field: 'preview.link' };
  const format = reference.format;
  if (format === null || !draft.formats.includes(format))
    return { step: 'formats', field: 'formats' };
  if (format === 'web')
    return {
      step: 'formats',
      field: reference.field === 'browser-and-computer' ? 'web.browserAndComputer' : 'web.webLink',
    };
  const key: DeliveryKey =
    reference.field === 'device-need'
      ? 'deviceNeeded'
      : reference.field === 'install-notes'
        ? 'installNotes'
        : 'packageReference';
  return { step: 'formats', field: `${format}.${key}` };
}

// ---- sample file names (OD-B5-11: nothing is uploaded) ------------------------------------------

/** "conduction-through-a-composite-wall-vr-1.0.zip" (state-copy `VE-04.sample-file`). */
export function samplePackageFileName(draft: EditorDraft, format: PackageFormat): string {
  const slug = draft.name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const version = draft.version.trim() || '1.0';
  return `${slug || 'experiment'}-${format}-${version}.zip`;
}

/** The submission's revision and whether it is a draft or returned (the editor's own modes). */
export function editableMode(submission: Submission): 'edit' | 'revise' | null {
  if (submission.status.state === 'draft') return 'edit';
  if (submission.status.state === 'returned') return 'revise';
  return null;
}

/** "Step 1 of 4" words for the page header (the stepper's own steps). */
export const STEP_LABELS = EDITOR.steps;
