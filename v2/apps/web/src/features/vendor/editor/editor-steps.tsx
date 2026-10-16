'use client';

import type { CourseCard } from '@xr/contracts/draft';
import type { LearningOutcome, Technology } from '@xr/domain';
import { FORMAT_META } from '@xr/domain';
import {
  Button,
  Checkbox,
  Field,
  FieldError,
  FormatBadge,
  Icon,
  Link,
  Select,
  Textarea,
  TextInput,
} from '@xr/ui';
import { Fragment, type ReactNode } from 'react';

import {
  CHECK_STEP,
  changeSectionLabel,
  COURSE_STEP,
  courseHint,
  courseWords,
  EDITOR,
  FORMATS_STEP,
  formatLabel,
  formatNotesLabel,
  formatPanelTitle,
  missingCountWords,
  PREVIEW_STEP,
  removeDocumentLabel,
  removePackageFileLabel,
  withdrawnCourseHint,
} from '@/copy/vendor-editor';
import { MY_EXPERIMENTS_ADDRESS } from '@/nav/vendor';

import {
  type ChecklistRow,
  EDITOR_FORMATS,
  type EditorDraft,
  type EditorField,
  fieldId,
  ID_PREFIX,
  MISSING_ID,
  type MissingItem,
  PACKAGE_FORMATS,
  type PackageDraft,
  type PackageFormat,
  SUBMIT_ID,
  type WebDraft,
} from './editor-view';

/** What every step's footer needs: the save action and its words, and Continue (steps 1–3). */
export interface StepActions {
  readonly saveLabel: string;
  readonly onSave: () => void;
  readonly saving: boolean;
  readonly onContinue: () => void;
  readonly continuing: boolean;
  /** Step 1's Cancel (to My experiments, dropping what was typed) or the other steps' Back. */
  readonly onCancel: () => void;
  readonly onBack: () => void;
}

/** A field's change: its new value; the editor clears its error and the saved line. */
export type FieldChange = (field: EditorField, change: (draft: EditorDraft) => EditorDraft) => void;

/** The step's footer (`div.xw-flow-foot`): the way back first, the step's actions last. */
function FlowFoot({
  start,
  children,
}: {
  readonly start: ReactNode;
  readonly children: ReactNode;
}) {
  return (
    <div className="xw-flow-foot">
      {start}
      <div className="xw-actions">{children}</div>
    </div>
  );
}

function SaveButton({ actions }: { readonly actions: StepActions }) {
  return (
    <Button variant="secondary" onClick={actions.onSave} busy={actions.saving}>
      {actions.saveLabel}
    </Button>
  );
}

function StepFoot({ actions, first }: { readonly actions: StepActions; readonly first: boolean }) {
  return (
    <FlowFoot
      start={
        first ? (
          <Link
            className="xr-btn xr-btn--text"
            href={MY_EXPERIMENTS_ADDRESS}
            onClick={actions.onCancel}
          >
            {EDITOR.cancel}
          </Link>
        ) : (
          <Button variant="text" onClick={actions.onBack}>
            {EDITOR.previous}
          </Button>
        )
      }
    >
      <SaveButton actions={actions} />
      <Button variant="primary" onClick={actions.onContinue} busy={actions.continuing}>
        {EDITOR.continue}
      </Button>
    </FlowFoot>
  );
}

/** `p.xl-open` (T-14, T-29): an open decision said in the product. */
function OpenNote({ children }: { readonly children: ReactNode }) {
  return (
    <p className="xl-open m-0">
      <Icon name="info" size={16} />
      <span>{children}</span>
    </p>
  );
}

// ---- Step 1 · Course and description (B5-03 f0 … f6) --------------------------------------------

export interface CourseStepProps {
  readonly draft: EditorDraft;
  readonly courses: readonly CourseCard[];
  readonly organisation: string;
  /** A chosen course that is no longer one of the Vendor's (f5): its code and name. */
  readonly withdrawn: { readonly code: string | null; readonly name: string } | null;
  readonly errorOf: (field: EditorField) => string | undefined;
  readonly onChange: FieldChange;
  readonly actions: StepActions;
}

export function CourseStep({
  draft,
  courses,
  organisation,
  withdrawn,
  errorOf,
  onChange,
  actions,
}: CourseStepProps) {
  const courseId = fieldId('courseId');
  const courseError = errorOf('courseId');
  const chosen = courses.some((course) => course.id === draft.courseId) ? draft.courseId : '';
  const text = (field: 'name' | 'summary' | 'description' | 'version', value: string) =>
    onChange(field, (current) => ({ ...current, [field]: value }));
  return (
    <div className="xr-section xv-step">
      <div className="xr-field">
        <label className="xr-label" htmlFor={courseId}>
          {COURSE_STEP.courseLabel}
        </label>
        <span className="xr-hint" id={`${courseId}-h`}>
          {courseHint(organisation)}
        </span>
        {withdrawn && !chosen ? (
          <span className="xr-hint text-warn">
            {withdrawnCourseHint(withdrawn.code, withdrawn.name)}
          </span>
        ) : null}
        <div className="max-w-[520px]">
          <Select
            id={courseId}
            value={chosen ?? ''}
            invalid={Boolean(courseError)}
            aria-describedby={courseError ? `${courseId}-h ${courseId}-e` : `${courseId}-h`}
            onChange={(event) => {
              const value = event.target.value;
              onChange('courseId', (current) => ({ ...current, courseId: value || null }));
            }}
            options={[
              { label: COURSE_STEP.chooseCourse, value: '' },
              ...courses.map((course) => ({
                label: courseWords(course.platformCode, course.name),
                value: course.id,
              })),
            ]}
          />
        </div>
        {courseError ? <FieldError id={`${courseId}-e`}>{courseError}</FieldError> : null}
      </div>
      <Field
        id={fieldId('name')}
        label={COURSE_STEP.nameLabel}
        hint={COURSE_STEP.nameHint}
        error={errorOf('name')}
      >
        <TextInput
          className="max-w-[640px]"
          value={draft.name}
          onChange={(event) => text('name', event.target.value)}
        />
      </Field>
      <Field
        id={fieldId('summary')}
        label={COURSE_STEP.summaryLabel}
        hint={COURSE_STEP.summaryHint}
        error={errorOf('summary')}
      >
        <Textarea
          className="min-h-[80px]"
          value={draft.summary}
          onChange={(event) => text('summary', event.target.value)}
        />
      </Field>
      <Field
        id={fieldId('description')}
        label={COURSE_STEP.descriptionLabel}
        hint={COURSE_STEP.descriptionHint}
        error={errorOf('description')}
      >
        <Textarea
          className="min-h-[140px]"
          value={draft.description}
          onChange={(event) => text('description', event.target.value)}
        />
      </Field>
      <Field
        id={fieldId('version')}
        label={COURSE_STEP.versionLabel}
        hint={COURSE_STEP.versionHint}
        error={errorOf('version')}
      >
        <TextInput
          className="max-w-[160px]"
          value={draft.version}
          onChange={(event) => text('version', event.target.value)}
        />
      </Field>
      <OpenNote>{COURSE_STEP.note}</OpenNote>
      <StepFoot actions={actions} first />
    </div>
  );
}

// ---- Step 2 · Formats and delivery (B5-04 f0 … f6) ----------------------------------------------

function WebPanel({
  web,
  errorOf,
  onChange,
}: {
  readonly web: WebDraft;
  readonly errorOf: (field: EditorField) => string | undefined;
  readonly onChange: FieldChange;
}) {
  const titleId = `${ID_PREFIX}-WEB-t`;
  const set = (key: keyof WebDraft, value: string) =>
    onChange(`web.${key}`, (current) => ({ ...current, web: { ...current.web, [key]: value } }));
  return (
    <section className="xv-fpanel" aria-labelledby={titleId}>
      <div className="xv-fpanel-head">
        <FormatBadge format="WEB" compact />
        <h3 className="xr-h3 m-0" id={titleId}>
          {formatPanelTitle('web')}
        </h3>
      </div>
      <Field
        id={fieldId('web.webLink')}
        label={FORMATS_STEP.webLink}
        hint={FORMATS_STEP.webLinkHint}
        error={errorOf('web.webLink')}
      >
        <TextInput
          className="max-w-[640px]"
          value={web.webLink}
          onChange={(event) => set('webLink', event.target.value)}
        />
      </Field>
      <Field
        id={fieldId('web.browserAndComputer')}
        label={FORMATS_STEP.browser}
        hint={FORMATS_STEP.browserHint}
        error={errorOf('web.browserAndComputer')}
      >
        <Textarea
          className="min-h-[112px]"
          value={web.browserAndComputer}
          onChange={(event) => set('browserAndComputer', event.target.value)}
        />
      </Field>
      <Field
        id={fieldId('web.notes')}
        label={formatNotesLabel('web')}
        marker={FORMATS_STEP.optional}
        error={errorOf('web.notes')}
      >
        <Textarea
          className="min-h-[112px]"
          value={web.notes}
          onChange={(event) => set('notes', event.target.value)}
        />
      </Field>
    </section>
  );
}

function PackagePanel({
  format,
  value,
  errorOf,
  onChange,
  onAttach,
}: {
  readonly format: PackageFormat;
  readonly value: PackageDraft;
  readonly errorOf: (field: EditorField) => string | undefined;
  readonly onChange: FieldChange;
  readonly onAttach: (format: PackageFormat, attach: boolean) => void;
}) {
  const code = FORMAT_META[format].code;
  const titleId = `${ID_PREFIX}-${code}-t`;
  const fileLabelId = `${ID_PREFIX}-${code}-fl`;
  const set = (key: Exclude<keyof PackageDraft, 'packageFileName'>, typed: string) =>
    onChange(`${format}.${key}`, (current) => ({
      ...current,
      packages: { ...current.packages, [format]: { ...current.packages[format], [key]: typed } },
    }));
  return (
    <section className="xv-fpanel" aria-labelledby={titleId}>
      <div className="xv-fpanel-head">
        <FormatBadge format={code} compact />
        <h3 className="xr-h3 m-0" id={titleId}>
          {formatPanelTitle(format)}
        </h3>
      </div>
      <OpenNote>{FORMATS_STEP.packageNote}</OpenNote>
      <Field
        id={fieldId(`${format}.packageLabel`)}
        label={FORMATS_STEP.packageLabel}
        hint={FORMATS_STEP.packageLabelHint}
        error={errorOf(`${format}.packageLabel`)}
      >
        <TextInput
          className="max-w-[520px]"
          value={value.packageLabel}
          onChange={(event) => set('packageLabel', event.target.value)}
        />
      </Field>
      <Field
        id={fieldId(`${format}.packageReference`)}
        label={FORMATS_STEP.packageReference}
        hint={FORMATS_STEP.packageReferenceHint}
        error={errorOf(`${format}.packageReference`)}
      >
        <TextInput
          className="max-w-[520px]"
          value={value.packageReference}
          onChange={(event) => set('packageReference', event.target.value)}
        />
      </Field>
      <div className="xr-field">
        <span className="xr-label" id={fileLabelId}>
          {FORMATS_STEP.packageFile} <span className="xr-opt">{FORMATS_STEP.optional}</span>
        </span>
        <span className="xr-hint">{FORMATS_STEP.packageFileHint}</span>
        {value.packageFileName === null ? (
          <div>
            <Button
              variant="secondary"
              size="sm"
              icon="readyToPublish"
              id={fieldId(`${format}.packageFileName`)}
              aria-describedby={fileLabelId}
              onClick={() => onAttach(format, true)}
            >
              {FORMATS_STEP.chooseFile}
            </Button>
          </div>
        ) : (
          <div className="xv-file">
            <Icon name="fileText" />
            <span>{value.packageFileName}</span>
            <Button
              variant="text"
              className="min-h-9"
              aria-label={removePackageFileLabel(format)}
              onClick={() => onAttach(format, false)}
            >
              {FORMATS_STEP.remove}
            </Button>
          </div>
        )}
      </div>
      <Field
        id={fieldId(`${format}.deviceNeeded`)}
        label={FORMATS_STEP.device}
        hint={FORMATS_STEP.deviceHint}
        error={errorOf(`${format}.deviceNeeded`)}
      >
        <Textarea
          className="min-h-[112px]"
          value={value.deviceNeeded}
          onChange={(event) => set('deviceNeeded', event.target.value)}
        />
      </Field>
      <Field
        id={fieldId(`${format}.installNotes`)}
        label={FORMATS_STEP.install}
        hint={FORMATS_STEP.installHint}
        error={errorOf(`${format}.installNotes`)}
      >
        <Textarea
          className="min-h-[112px]"
          value={value.installNotes}
          onChange={(event) => set('installNotes', event.target.value)}
        />
      </Field>
      <Field
        id={fieldId(`${format}.notes`)}
        label={formatNotesLabel(format)}
        marker={FORMATS_STEP.optional}
        error={errorOf(`${format}.notes`)}
      >
        <Textarea
          className="min-h-[112px]"
          value={value.notes}
          onChange={(event) => set('notes', event.target.value)}
        />
      </Field>
    </section>
  );
}

export interface FormatsStepProps {
  readonly draft: EditorDraft;
  readonly errorOf: (field: EditorField) => string | undefined;
  readonly onChange: FieldChange;
  readonly onToggle: (format: Technology) => void;
  readonly onAttach: (format: PackageFormat, attach: boolean) => void;
  readonly actions: StepActions;
}

export function FormatsStep({
  draft,
  errorOf,
  onChange,
  onToggle,
  onAttach,
  actions,
}: FormatsStepProps) {
  const groupId = fieldId('formats');
  const formatsError = errorOf('formats');
  return (
    <div className="xr-section xv-step">
      <fieldset
        className="xr-fieldset m-0 min-w-0 border-0 p-0"
        id={groupId}
        tabIndex={-1}
        aria-describedby={formatsError ? `${groupId}-e` : undefined}
      >
        <legend className="xr-label mb-1">{FORMATS_STEP.legend}</legend>
        <span className="xr-hint mb-1.5 block">{FORMATS_STEP.hint}</span>
        {formatsError ? <FieldError id={`${groupId}-e`}>{formatsError}</FieldError> : null}
        <div className="xv-fmtchecks">
          {EDITOR_FORMATS.map((format) => {
            const code = FORMAT_META[format].code;
            return (
              <Checkbox
                key={format}
                id={`${ID_PREFIX}-f${code}`}
                checked={draft.formats.includes(format)}
                onChange={() => onToggle(format)}
              >
                <span>
                  <FormatBadge format={code} compact /> <span>{formatLabel(format)}</span>
                </span>
              </Checkbox>
            );
          })}
        </div>
      </fieldset>
      {draft.formats.includes('web') ? (
        <WebPanel web={draft.web} errorOf={errorOf} onChange={onChange} />
      ) : null}
      {PACKAGE_FORMATS.filter((format) => draft.formats.includes(format)).map((format) => (
        <PackagePanel
          key={format}
          format={format}
          value={draft.packages[format]}
          errorOf={errorOf}
          onChange={onChange}
          onAttach={onAttach}
        />
      ))}
      <StepFoot actions={actions} first={false} />
    </div>
  );
}

// ---- Step 3 · Preview and documents (B5-05 f3, f4) ----------------------------------------------

export interface PreviewStepProps {
  readonly draft: EditorDraft;
  readonly errorOf: (field: EditorField) => string | undefined;
  readonly onChange: FieldChange;
  readonly onAddDocument: (() => void) | null;
  readonly onRemoveDocument: (fileName: string) => void;
  readonly actions: StepActions;
}

export function PreviewStep({
  draft,
  errorOf,
  onChange,
  onAddDocument,
  onRemoveDocument,
  actions,
}: PreviewStepProps) {
  return (
    <div className="xr-section xv-step">
      <p className="xr-body m-0 text-ink-2">{PREVIEW_STEP.intro}</p>
      <fieldset className="xr-fieldset m-0 flex min-w-0 flex-col gap-4 border-0 p-0">
        <legend className="xr-h3 [margin:0_0_4px]">{PREVIEW_STEP.legend}</legend>
        <Field
          id={fieldId('preview.label')}
          label={PREVIEW_STEP.label}
          marker={FORMATS_STEP.optional}
          hint={PREVIEW_STEP.labelHint}
          error={errorOf('preview.label')}
        >
          <TextInput
            className="max-w-[520px]"
            value={draft.previewLabel}
            onChange={(event) => {
              const value = event.target.value;
              onChange('preview.label', (current) => ({ ...current, previewLabel: value }));
            }}
          />
        </Field>
        <Field
          id={fieldId('preview.link')}
          label={PREVIEW_STEP.link}
          marker={FORMATS_STEP.optional}
          hint={PREVIEW_STEP.linkHint}
          error={errorOf('preview.link')}
        >
          <TextInput
            className="max-w-[640px]"
            value={draft.previewLink}
            onChange={(event) => {
              const value = event.target.value;
              onChange('preview.link', (current) => ({ ...current, previewLink: value }));
            }}
          />
        </Field>
      </fieldset>
      <div className="flex flex-col gap-2.5">
        <h3 className="xr-h3 m-0">
          {PREVIEW_STEP.documents} <span className="xr-opt">{FORMATS_STEP.optional}</span>
        </h3>
        <span className="xr-hint">{PREVIEW_STEP.documentsHint}</span>
        {draft.documents.length > 0 ? (
          <ul className="xv-files">
            {draft.documents.map((fileName) => (
              <li key={fileName} className="xv-file">
                <Icon name="fileText" />
                <span>{fileName}</span>
                <Button
                  variant="text"
                  className="min-h-9"
                  aria-label={removeDocumentLabel(fileName)}
                  onClick={() => onRemoveDocument(fileName)}
                >
                  {FORMATS_STEP.remove}
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="xl-meta m-0">{PREVIEW_STEP.noDocuments}</p>
        )}
        {onAddDocument ? (
          <div>
            <Button variant="secondary" size="sm" icon="readyToPublish" onClick={onAddDocument}>
              {PREVIEW_STEP.addDocument}
            </Button>
          </div>
        ) : null}
      </div>
      <StepFoot actions={actions} first={false} />
    </div>
  );
}

// ---- Step 4 · Check and submit (B5-05 f0, f2, f5, f6; B5-07 f3) ---------------------------------

/** "Learning outcomes · Added by the Academic Reviewer · read-only" (LD-3: the reviewer's). */
export function OutcomesSection({ outcomes }: { readonly outcomes: readonly LearningOutcome[] }) {
  const titleId = `${ID_PREFIX}-c-lo`;
  return (
    <section className="xr-section" aria-labelledby={titleId}>
      <div className="xr-section-head">
        <h2 id={titleId} className="xr-h2">
          {CHECK_STEP.outcomesTitle}
        </h2>
        <span className="xr-meta">
          <Icon name="readOnly" size={16} /> {CHECK_STEP.outcomesBy}
        </span>
      </div>
      <div className="xr-section-body">
        {outcomes.length > 0 ? (
          <>
            <p className="xl-meta [margin:0_0_10px]">{CHECK_STEP.outcomesLine}</p>
            <ul className="xv-los">
              {outcomes.map((outcome) => (
                <li key={outcome.id}>{outcome.text}</li>
              ))}
            </ul>
          </>
        ) : (
          <p className="xl-meta m-0">{CHECK_STEP.noOutcomes}</p>
        )}
      </div>
    </section>
  );
}

export interface CheckStepProps {
  readonly missing: readonly MissingItem[];
  /** Submit was pressed with something missing (the list with its links, `showMissing`). */
  readonly tried: boolean;
  readonly checklist: readonly ChecklistRow[];
  readonly summary: readonly (readonly [string, string])[];
  readonly outcomes: readonly LearningOutcome[];
  readonly submitLabel: string;
  readonly onGoTo: (item: MissingItem) => void;
  readonly onChangeStep: (step: ChecklistRow['step']) => void;
  readonly onSubmit: () => void;
  readonly actions: Pick<StepActions, 'saveLabel' | 'onSave' | 'saving' | 'onBack'>;
}

export function CheckStep({
  missing,
  tried,
  checklist,
  summary,
  outcomes,
  submitLabel,
  onGoTo,
  onChangeStep,
  onSubmit,
  actions,
}: CheckStepProps) {
  return (
    <div className="xr-section xv-step">
      <div id={MISSING_ID} tabIndex={-1}>
        {missing.length > 0 && tried ? (
          <div className="xw-errsum" role="alert">
            <Icon name="failed" />
            <div>
              <strong>{missingCountWords(missing.length)}</strong>
              <ul className="xv-miss">
                {missing.map((item) => (
                  <li key={item.field}>
                    <span>{item.text}</span>
                    <Button variant="text" className="min-h-9" onClick={() => onGoTo(item)}>
                      {item.where}
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : missing.length > 0 ? (
          <div className="xr-notice xr-notice--warn" role="status">
            <Icon name="warning" />
            <div className="xr-notice-body">
              <span className="xr-notice-title">{missingCountWords(missing.length)}</span>
              <span>{CHECK_STEP.quietLine}</span>
            </div>
          </div>
        ) : (
          <div className="xr-notice xr-notice--ok" role="status">
            <Icon name="done" />
            <div className="xr-notice-body">
              <span className="xr-notice-title">{CHECK_STEP.readyTitle}</span>
              <span>{CHECK_STEP.readyLine}</span>
            </div>
          </div>
        )}
      </div>
      <ul className="xa-check xv-checklist" aria-label={CHECK_STEP.checklistLabel}>
        {checklist.map((row) => (
          <li key={row.step} className="xv-check-row">
            {row.ok ? (
              <span className="is-ok">
                <Icon name="done" />
              </span>
            ) : (
              <span className="is-no">
                <Icon name="clock" />
              </span>
            )}
            <span className="xv-check-t">
              {row.label}
              <span className="xr-meta block">{row.state}</span>
            </span>
            <Button
              variant="text"
              className="min-h-9"
              aria-label={
                row.step === 'preview' ? CHECK_STEP.changePreview : changeSectionLabel(row.step)
              }
              onClick={() => onChangeStep(row.step)}
            >
              {CHECK_STEP.change}
            </Button>
          </li>
        ))}
      </ul>
      <dl className="xl-kv xv-kv">
        {summary.map(([term, value]) => (
          <Fragment key={term}>
            <dt>{term}</dt>
            <dd>{value}</dd>
          </Fragment>
        ))}
      </dl>
      <OutcomesSection outcomes={outcomes} />
      <p className="xw-note m-0">
        <Icon name="info" />
        <span>{CHECK_STEP.note}</span>
      </p>
      <FlowFoot
        start={
          <Button variant="text" onClick={actions.onBack}>
            {EDITOR.previous}
          </Button>
        }
      >
        <Button variant="secondary" onClick={actions.onSave} busy={actions.saving}>
          {actions.saveLabel}
        </Button>
        <Button variant="primary" id={SUBMIT_ID} onClick={onSubmit}>
          {submitLabel}
        </Button>
      </FlowFoot>
    </div>
  );
}
