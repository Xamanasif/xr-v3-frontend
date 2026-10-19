/**
 * The experiment editor as data (the V3 Vendor export's `edView`; first drawn on B5-03 … B5-05,
 * B5-07): the typed draft and the contract content it becomes, the field ids (`Ve-course` …
 * `Ve-plink`), which step a field belongs to, the drawn field errors from a `validation-failed`
 * answer (the client's own check and the service's alike), the steps' and the blocks' live status,
 * what "Check and submit" lists as missing and how its review sections read, the delivery as
 * entered, where a returned record's "What it refers to" points, and which refusal a stale address
 * shows. Nothing is decided here: the service answers again when the experiment is saved or sent.
 */
import type { ValidationFailed } from '@xr/contracts/draft';
import type { ReturnReference, Submission, SubmissionContent, Technology } from '@xr/domain';
import { FORMAT_META, inDisplayOrder } from '@xr/domain';

import type { VendorEditorStatus } from '@xr/ui/v3';

import {
  CHECK_STEP,
  EDITOR,
  goToStepWords,
  READ_ONLY,
  type RefusalKind,
  sectionStateWords,
  stillNeededWords,
  toFixWords,
} from '@/copy/vendor-editor';
import { EDITOR_STEPS, type EditorStepSlug, reviseAddress } from '@/nav/vendor';
import { type FormFieldError, formFieldErrors } from '@/queries/faculty-forms';
import {
  checkEditorStep,
  type EditorContentInput,
  checkWholeExperiment,
} from '@/queries/production-editor';

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

/** One review section's state (the script's `sec` and the preview row). */
export interface ChecklistRow {
  readonly step: Exclude<EditorStepSlug, 'submit'>;
  readonly status: VendorEditorStatus;
}

/** The three review sections' states: “Provided”, “2 missing”, “Preview link missing”, “None — optional”. */
export function checklistRows(missing: readonly MissingItem[], draft: EditorDraft): ChecklistRow[] {
  const count = (step: ChecklistRow['step']) => missing.filter((item) => item.step === step).length;
  const section = (step: 'course' | 'formats'): ChecklistRow => ({
    step,
    status: { tone: count(step) > 0 ? 'warn' : 'ok', words: sectionStateWords(count(step)) },
  });
  const previewBad = count('preview') > 0;
  return [
    section('course'),
    section('formats'),
    {
      step: 'preview',
      status: previewBad
        ? { tone: 'warn', words: CHECK_STEP.previewMissing }
        : hasPreviewOrDocuments(draft)
          ? { tone: 'ok', words: CHECK_STEP.provided }
          : { tone: 'neutral', words: CHECK_STEP.previewNone },
    },
  ];
}

/** Anything on step 3: a label, a link or a document (the script's `any3`). */
function hasPreviewOrDocuments(draft: EditorDraft): boolean {
  return Boolean(draft.previewLabel.trim() || draft.previewLink.trim() || draft.documents.length);
}

// ---- live status: the steps, step 1's parts and the delivery blocks -----------------------------

/** The fields each step-1 part and each delivery block counts (the script's `secSt` keys). */
export const COURSE_PARTS = {
  courseAndName: ['courseId', 'name', 'version'],
  catalogue: ['summary', 'description'],
} as const satisfies Record<string, readonly EditorField[]>;

export function deliveryFields(format: Technology): readonly EditorField[] {
  return format === 'web'
    ? ['web.webLink', 'web.browserAndComputer']
    : [
        `${format as PackageFormat}.packageLabel`,
        `${format as PackageFormat}.packageReference`,
        `${format as PackageFormat}.deviceNeeded`,
        `${format as PackageFormat}.installNotes`,
      ];
}

/** The fields a step's own check finds missing or wrong now (nothing is shown for it). */
export function liveErrorFields(
  step: Exclude<EditorStepSlug, 'submit'>,
  content: EditorContentInput,
): ReadonlySet<EditorField> {
  const failed = checkEditorStep(step, content);
  return new Set(failed ? editorErrors(failed).map((item) => item.field) : []);
}

/**
 * A part's or a block's live status (`secSt`): “N to fix” while the step shows errors for it,
 * else “N still needed” for what its check still misses, else “Complete”.
 */
export function partStatus(
  fields: readonly EditorField[],
  shown: ReadonlySet<EditorField>,
  live: ReadonlySet<EditorField>,
): VendorEditorStatus {
  const toFix = fields.filter((field) => shown.has(field)).length;
  if (toFix > 0) return { tone: 'err', words: toFixWords(toFix) };
  const needed = fields.filter((field) => live.has(field)).length;
  if (needed > 0) return { tone: 'neutral', words: stillNeededWords(needed) };
  return { tone: 'ok', words: EDITOR.stepStates.complete };
}

/** One step's live state in the stepper and the outline (`stateOf`, `doneOf`). */
export interface StepState {
  readonly words: string;
  /** Complete (a tick once it is not the step on show). */
  readonly complete: boolean;
}

export function stepStates(draft: EditorDraft): Readonly<Record<EditorStepSlug, StepState>> {
  const content = contentOf(draft);
  const course = checkEditorStep('course', content) === null;
  const formats = checkEditorStep('formats', content) === null;
  const preview = checkEditorStep('preview', content) === null;
  const anyCourse = [
    draft.courseId ?? '',
    draft.name,
    draft.summary,
    draft.description,
    draft.version,
  ].some((value) => value.trim() !== '');
  const anyPreview = hasPreviewOrDocuments(draft);
  const words = EDITOR.stepStates;
  return {
    course: {
      words: course ? words.complete : anyCourse ? words.inProgress : words.notStarted,
      complete: course,
    },
    formats: {
      words: formats
        ? words.complete
        : draft.formats.length > 0
          ? words.inProgress
          : words.notStarted,
      complete: formats,
    },
    preview: {
      words: !preview ? words.checkPreview : anyPreview ? words.complete : words.optional,
      complete: preview && anyPreview,
    },
    submit: {
      words: checkWholeExperiment(content) === null ? words.ready : words.notReady,
      complete: false,
    },
  };
}

// ---- the delivery as entered (read-only blocks) --------------------------------------------------

/** One chosen format's delivery as entered (`deliv`): its rows, empty values as “—”. */
export function deliveryRows(
  draft: EditorDraft,
  format: Technology,
): readonly { readonly term: string; readonly value: string }[] {
  const value = (text: string) => text.trim() || READ_ONLY.empty;
  if (format === 'web') {
    const web = draft.web;
    return [
      { term: READ_ONLY.webLink, value: value(web.webLink) },
      { term: READ_ONLY.browser, value: value(web.browserAndComputer) },
      ...(web.notes.trim() ? [{ term: READ_ONLY.notes, value: web.notes.trim() }] : []),
    ];
  }
  const pkg = draft.packages[format as PackageFormat];
  return [
    { term: READ_ONLY.packageLabel, value: value(pkg.packageLabel) },
    { term: READ_ONLY.packageReference, value: value(pkg.packageReference) },
    ...(pkg.packageFileName ? [{ term: READ_ONLY.packageFile, value: pkg.packageFileName }] : []),
    { term: READ_ONLY.device, value: value(pkg.deviceNeeded) },
    { term: READ_ONLY.install, value: value(pkg.installNotes) },
    ...(pkg.notes.trim() ? [{ term: READ_ONLY.notes, value: pkg.notes.trim() }] : []),
  ];
}

/** Whether two drafts hold the same values (the formats in any order): nothing unsaved. */
export function sameDraft(left: EditorDraft, right: EditorDraft): boolean {
  const canonical = (draft: EditorDraft) =>
    JSON.stringify({ ...draft, formats: inDisplayOrder(draft.formats) });
  return canonical(left) === canonical(right);
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

/** The revise address's parameter that names a reference to open: `?step=formats&field=ar.device-need`. */
export const REFERENCE_FIELD_PARAM = 'field';

/**
 * A return reference as the revise address's `field=` value — the keys the return's structured
 * references carry (`ReturnReference`): `<format>.<field>` for a format's field (`ar.device-need`,
 * `web.web-link`), else the field alone (`summary`, `description`, `preview-link`).
 */
export function referenceFieldKey(reference: ReturnReference): string {
  return reference.format ? `${reference.format}.${reference.field}` : reference.field;
}

/** The step a return's reference names (the address's `?step=`, whatever the draft holds now). */
const REFERENCE_STEP: Readonly<Record<ReturnReference['step'], Exclude<EditorStepSlug, 'submit'>>> =
  {
    'course-and-description': 'course',
    'formats-and-delivery': 'formats',
    'preview-and-documents': 'preview',
  };

/**
 * The revise address that opens a reference's field (the record's "What it refers to" chips,
 * LINK-MAP L53: "VE-08 at that field, focused"): `/vendor/experiments/<id>/revise?step=<step>&
 * field=<key>` — a reference to Course and description has no `step` (the editor's first step is
 * the address's default). The editor focuses that field once the returned reason shows.
 */
export function reviseReferenceAddress(submissionId: string, reference: ReturnReference): string {
  const address = reviseAddress(submissionId, REFERENCE_STEP[reference.step]);
  const field = `${REFERENCE_FIELD_PARAM}=${encodeURIComponent(referenceFieldKey(reference))}`;
  return `${address}${address.includes('?') ? '&' : '?'}${field}`;
}

/** The fields the return's references point at (each tagged “Referred to in the return”). */
export function referencedFields(
  references: readonly ReturnReference[],
  draft: EditorDraft,
): ReadonlySet<EditorField> {
  return new Set(references.map((reference) => referenceTarget(reference, draft).field));
}

// ---- refusals: a stale editor address ------------------------------------------------------------

/** Which refusal a record that is not a draft or returned shows, as the Vendor reads it. */
export function refusalKind(submission: Submission): RefusalKind {
  const status = submission.status;
  switch (status.state) {
    case 'resubmitted':
      return 'already-submitted';
    case 'with-academic-reviewer':
      if (status.reason === 'recheck') return 'recheck';
      return status.reason === 'resubmission' && submission.revision > 1
        ? 'already-submitted'
        : 'being-reviewed';
    case 'with-content-manager':
      return 'approved';
    case 'published':
      return 'published';
    default:
      return 'other';
  }
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
