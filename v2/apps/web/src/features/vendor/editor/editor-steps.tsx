'use client';

import type { AreaRef, EditorCourse } from '@xr/contracts/draft';
import type { LearningOutcome, Technology } from '@xr/domain';
import { FORMAT_META, inDisplayOrder } from '@xr/domain';
import {
  Button,
  DefinitionList,
  Notice,
  VendorDeliveryList,
  VendorDeliveryView,
  VendorEditorCheckLead,
  VendorEditorDeliveryBlock,
  VendorEditorEmpty,
  VendorEditorField,
  VendorEditorFile,
  VendorEditorFiles,
  VendorEditorFormats,
  VendorEditorGrid,
  VendorEditorInput,
  VendorEditorLinkButton,
  VendorEditorMissing,
  VendorEditorPackageGuide,
  VendorEditorReview,
  VendorEditorSelect,
  type VendorEditorStatus,
  VendorEditorSubmitNote,
  VendorEditorTextarea,
  VendorLearningOutcomes,
  VendorSection,
} from '@xr/ui/v3';
import { type ReactNode, useState } from 'react';

import { stateWords } from '@/copy/state-copy';
import {
  attachFileLabel,
  changeSectionLabel,
  CHECK_STEP,
  COURSE_STEP,
  courseWords,
  EDITOR,
  formatKind,
  formatName,
  formatNotesLabel,
  formatsCompleteWords,
  FORMATS_STEP,
  joinedWords,
  missingCountWords,
  PREVIEW_STEP,
  previewWords,
  removeDocumentLabel,
  removePackageFileLabel,
  withdrawnCourseHint,
} from '@/copy/vendor-editor';

import {
  type ChecklistRow,
  deliveryRows,
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
  type WebDraft,
} from './editor-view';

/** A field's change: its new value; the editor clears its error and the saved line. */
export type FieldChange = (field: EditorField, change: (draft: EditorDraft) => EditorDraft) => void;

/** What every editing step reads: the draft, a field's error on show and the return's references. */
interface StepFields {
  readonly draft: EditorDraft;
  readonly errorOf: (field: EditorField) => string | undefined;
  readonly onChange: FieldChange;
  /** The fields the return refers to (revise mode), each tagged. */
  readonly referred: ReadonlySet<EditorField>;
}

/** Step 1's Engineering area select (not a content field: the record keeps the course). */
export const AREA_ID = `${ID_PREFIX}-area`;

/** The ids of the sections and blocks the outline moves focus to. */
export const SECTION_IDS = {
  courseAndName: `${ID_PREFIX}-s1-a-h`,
  catalogue: `${ID_PREFIX}-s1-b-h`,
  delivery: `${ID_PREFIX}-s2-dlv-h`,
  preview: `${ID_PREFIX}-s3-a-h`,
  documents: `${ID_PREFIX}-s3-b-h`,
} as const;

/** A delivery block's heading id (`Ve-WEB-t`, `Ve-VR-t`). */
export function blockTitleId(format: Technology): string {
  return `${ID_PREFIX}-${FORMAT_META[format].code}-t`;
}

function tagFor(referred: ReadonlySet<EditorField>, field: EditorField): ReactNode {
  return referred.has(field) ? EDITOR.referred : undefined;
}

// ---- Step 1 · Course and description (VE-03) ----------------------------------------------------

export interface CourseStepProps extends StepFields {
  /** The courses the Vendor may choose, each with its Engineering area (PC-76). */
  readonly courses: readonly EditorCourse[];
  /** The areas holding one of them, in the academic structure's order. */
  readonly areas: readonly AreaRef[];
  /** Any course (PC-77): every existing course is on offer; else the courses assigned to them. */
  readonly anyCourse: boolean;
  /** A chosen course that is no longer one of the Vendor's: its code and name. */
  readonly withdrawn: { readonly code: string | null; readonly name: string } | null;
}

/**
 * Two sections on the field grid: Course and name (Engineering area, course, name, version);
 * Catalogue text. The area is chosen first (owner decision PD-5; state-copy `VE-03.area`): it is
 * the area of the chosen course when there is one, else the Vendor's choice, else the only area on
 * offer — never saved, the record keeps the course.
 */
export function CourseStep({
  draft,
  courses,
  areas,
  anyCourse,
  withdrawn,
  errorOf,
  onChange,
  referred,
}: CourseStepProps) {
  const course = courses.find((candidate) => candidate.id === draft.courseId) ?? null;
  const chosen = course?.id ?? '';
  const [picked, setPicked] = useState<string | null>(null);
  const area =
    course?.areaId ??
    (picked !== null && areas.some((candidate) => candidate.id === picked) ? picked : null) ??
    (areas.length === 1 ? areas[0]!.id : null);
  const inArea = courses.filter((candidate) => candidate.areaId === area);
  const chooseArea = (value: string) => {
    setPicked(value || null);
    // A course of another area is cleared: the course must belong to the area on show.
    if (course && course.areaId !== value) {
      onChange('courseId', (current) => ({ ...current, courseId: null }));
    }
  };
  const text = (field: 'name' | 'summary' | 'description' | 'version', value: string) =>
    onChange(field, (current) => ({ ...current, [field]: value }));
  return (
    <>
      <VendorSection
        titleId={SECTION_IDS.courseAndName}
        title={COURSE_STEP.sections.courseAndName}
        titleFocusTarget
      >
        <VendorEditorGrid>
          <VendorEditorField id={AREA_ID} label={stateWords('VE-03.area')} width={3}>
            <VendorEditorSelect
              value={area ?? ''}
              onChange={(event) => chooseArea(event.target.value)}
              options={[
                ...(areas.length === 1
                  ? []
                  : [{ label: stateWords('VE-03.area.choose'), value: '' }]),
                ...areas.map((candidate) => ({ label: candidate.name, value: candidate.id })),
              ]}
            />
          </VendorEditorField>
          <VendorEditorField
            id={fieldId('courseId')}
            label={COURSE_STEP.courseLabel}
            width={3}
            hint={stateWords(
              anyCourse ? 'VE-03.course-hint.any-course' : 'VE-03.course-hint.assigned',
            )}
            staleHint={
              withdrawn && !chosen ? withdrawnCourseHint(withdrawn.code, withdrawn.name) : undefined
            }
            referred={tagFor(referred, 'courseId')}
            error={errorOf('courseId')}
          >
            <VendorEditorSelect
              value={chosen ?? ''}
              onChange={(event) => {
                const value = event.target.value;
                onChange('courseId', (current) => ({ ...current, courseId: value || null }));
              }}
              options={
                area === null
                  ? [{ label: stateWords('VE-03.area.first'), value: '' }]
                  : [
                      { label: COURSE_STEP.chooseCourse, value: '' },
                      ...inArea.map((candidate) => ({
                        label: courseWords(candidate.platformCode, candidate.name),
                        value: candidate.id,
                      })),
                    ]
              }
            />
          </VendorEditorField>
          <VendorEditorField
            id={fieldId('name')}
            label={COURSE_STEP.nameLabel}
            width={4}
            hint={COURSE_STEP.nameHint}
            referred={tagFor(referred, 'name')}
            error={errorOf('name')}
          >
            <VendorEditorInput
              value={draft.name}
              onChange={(event) => text('name', event.target.value)}
            />
          </VendorEditorField>
          <VendorEditorField
            id={fieldId('version')}
            label={COURSE_STEP.versionLabel}
            width={2}
            hint={COURSE_STEP.versionHint}
            referred={tagFor(referred, 'version')}
            error={errorOf('version')}
          >
            <VendorEditorInput
              value={draft.version}
              onChange={(event) => text('version', event.target.value)}
            />
          </VendorEditorField>
        </VendorEditorGrid>
      </VendorSection>
      <VendorSection
        titleId={SECTION_IDS.catalogue}
        title={COURSE_STEP.sections.catalogue}
        titleFocusTarget
        note={COURSE_STEP.note}
      >
        <VendorEditorGrid>
          <VendorEditorField
            id={fieldId('summary')}
            label={COURSE_STEP.summaryLabel}
            hint={COURSE_STEP.summaryHint}
            referred={tagFor(referred, 'summary')}
            error={errorOf('summary')}
          >
            <VendorEditorTextarea
              rows={2}
              value={draft.summary}
              onChange={(event) => text('summary', event.target.value)}
            />
          </VendorEditorField>
          <VendorEditorField
            id={fieldId('description')}
            label={COURSE_STEP.descriptionLabel}
            hint={COURSE_STEP.descriptionHint}
            referred={tagFor(referred, 'description')}
            error={errorOf('description')}
          >
            <VendorEditorTextarea
              rows={4}
              value={draft.description}
              onChange={(event) => text('description', event.target.value)}
            />
          </VendorEditorField>
        </VendorEditorGrid>
      </VendorSection>
    </>
  );
}

// ---- Step 2 · Formats and delivery (VE-04) ------------------------------------------------------

/** The package guidance's description ids: each package field is described by its own. */
const GUIDE_IDS = {
  label: `${ID_PREFIX}-pk-g-label`,
  reference: `${ID_PREFIX}-pk-g-ref`,
  device: `${ID_PREFIX}-pk-g-device`,
  install: `${ID_PREFIX}-pk-g-install`,
} as const;

function WebBlock({
  web,
  status,
  errorOf,
  onChange,
  referred,
}: Omit<StepFields, 'draft'> & { readonly web: WebDraft; readonly status: VendorEditorStatus }) {
  const set = (key: keyof WebDraft, value: string) =>
    onChange(`web.${key}`, (current) => ({ ...current, web: { ...current.web, [key]: value } }));
  return (
    <VendorEditorDeliveryBlock
      code="WEB"
      name={formatName('web')}
      kind={formatKind('web')}
      titleId={blockTitleId('web')}
      status={status}
    >
      <VendorEditorField
        id={fieldId('web.webLink')}
        label={FORMATS_STEP.webLink}
        hint={FORMATS_STEP.webLinkHint}
        referred={tagFor(referred, 'web.webLink')}
        error={errorOf('web.webLink')}
      >
        <VendorEditorInput
          type="url"
          value={web.webLink}
          onChange={(event) => set('webLink', event.target.value)}
        />
      </VendorEditorField>
      <VendorEditorField
        id={fieldId('web.browserAndComputer')}
        label={FORMATS_STEP.browser}
        hint={FORMATS_STEP.browserHint}
        referred={tagFor(referred, 'web.browserAndComputer')}
        error={errorOf('web.browserAndComputer')}
      >
        <VendorEditorTextarea
          rows={2}
          value={web.browserAndComputer}
          onChange={(event) => set('browserAndComputer', event.target.value)}
        />
      </VendorEditorField>
      <VendorEditorField
        id={fieldId('web.notes')}
        label={formatNotesLabel('web')}
        optional={EDITOR.optional}
        error={errorOf('web.notes')}
      >
        <VendorEditorTextarea
          rows={1}
          value={web.notes}
          onChange={(event) => set('notes', event.target.value)}
        />
      </VendorEditorField>
    </VendorEditorDeliveryBlock>
  );
}

function PackageBlock({
  format,
  value,
  status,
  errorOf,
  onChange,
  onAttach,
  referred,
}: Omit<StepFields, 'draft'> & {
  readonly format: PackageFormat;
  readonly value: PackageDraft;
  readonly status: VendorEditorStatus;
  readonly onAttach: (format: PackageFormat, attach: boolean) => void;
}) {
  const set = (key: Exclude<keyof PackageDraft, 'packageFileName'>, typed: string) =>
    onChange(`${format}.${key}`, (current) => ({
      ...current,
      packages: { ...current.packages, [format]: { ...current.packages[format], [key]: typed } },
    }));
  const field = (key: Exclude<keyof PackageDraft, 'packageFileName'>): EditorField =>
    `${format}.${key}`;
  return (
    <VendorEditorDeliveryBlock
      code={FORMAT_META[format].code}
      name={formatName(format)}
      kind={formatKind(format)}
      titleId={blockTitleId(format)}
      status={status}
    >
      <VendorEditorField
        id={fieldId(field('packageLabel'))}
        label={FORMATS_STEP.packageLabel}
        width={3}
        describedBy={GUIDE_IDS.label}
        referred={tagFor(referred, field('packageLabel'))}
        error={errorOf(field('packageLabel'))}
      >
        <VendorEditorInput
          value={value.packageLabel}
          onChange={(event) => set('packageLabel', event.target.value)}
        />
      </VendorEditorField>
      <VendorEditorField
        id={fieldId(field('packageReference'))}
        label={FORMATS_STEP.packageReference}
        width={3}
        describedBy={GUIDE_IDS.reference}
        labelAction={
          value.packageFileName === null ? (
            <VendorEditorLinkButton
              label={attachFileLabel(format)}
              onClick={() => onAttach(format, true)}
            >
              {FORMATS_STEP.attachFile}
            </VendorEditorLinkButton>
          ) : undefined
        }
        referred={tagFor(referred, field('packageReference'))}
        error={errorOf(field('packageReference'))}
        after={
          value.packageFileName !== null ? (
            <VendorEditorFile
              as="div"
              name={value.packageFileName}
              removeLabel={FORMATS_STEP.remove}
              removeName={removePackageFileLabel(format)}
              onRemove={() => onAttach(format, false)}
            />
          ) : undefined
        }
      >
        <VendorEditorInput
          value={value.packageReference}
          onChange={(event) => set('packageReference', event.target.value)}
        />
      </VendorEditorField>
      <VendorEditorField
        id={fieldId(field('deviceNeeded'))}
        label={FORMATS_STEP.device}
        width={3}
        describedBy={GUIDE_IDS.device}
        referred={tagFor(referred, field('deviceNeeded'))}
        error={errorOf(field('deviceNeeded'))}
      >
        <VendorEditorTextarea
          rows={2}
          value={value.deviceNeeded}
          onChange={(event) => set('deviceNeeded', event.target.value)}
        />
      </VendorEditorField>
      <VendorEditorField
        id={fieldId(field('installNotes'))}
        label={FORMATS_STEP.install}
        width={3}
        describedBy={GUIDE_IDS.install}
        referred={tagFor(referred, field('installNotes'))}
        error={errorOf(field('installNotes'))}
      >
        <VendorEditorTextarea
          rows={2}
          value={value.installNotes}
          onChange={(event) => set('installNotes', event.target.value)}
        />
      </VendorEditorField>
      <VendorEditorField
        id={fieldId(field('notes'))}
        label={formatNotesLabel(format)}
        optional={EDITOR.optional}
        error={errorOf(field('notes'))}
      >
        <VendorEditorTextarea
          rows={1}
          value={value.notes}
          onChange={(event) => set('notes', event.target.value)}
        />
      </VendorEditorField>
    </VendorEditorDeliveryBlock>
  );
}

export interface FormatsStepProps extends StepFields {
  readonly onToggle: (format: Technology) => void;
  readonly onAttach: (format: PackageFormat, attach: boolean) => void;
  /** Each chosen format's live status (Complete / N still needed / N to fix). */
  readonly blockStatus: (format: Technology) => VendorEditorStatus;
}

/**
 * The format selector, then — once a format is chosen — Delivery details: how many formats are
 * complete, the app-package guidance written once, and one block per chosen format.
 */
export function FormatsStep({
  draft,
  errorOf,
  onChange,
  onToggle,
  onAttach,
  referred,
  blockStatus,
}: FormatsStepProps) {
  const chosen = inDisplayOrder(draft.formats);
  const packages = PACKAGE_FORMATS.filter((format) => draft.formats.includes(format));
  const complete = chosen.filter((format) => blockStatus(format).tone === 'ok').length;
  return (
    <>
      <VendorEditorFormats
        id={fieldId('formats')}
        legend={FORMATS_STEP.legend}
        description={FORMATS_STEP.hint}
        error={errorOf('formats')}
        options={EDITOR_FORMATS.map((format) => ({
          id: `${ID_PREFIX}-f${FORMAT_META[format].code}`,
          code: FORMAT_META[format].code,
          name: formatName(format),
          kind: formatKind(format),
          checked: draft.formats.includes(format),
          onToggle: () => onToggle(format),
        }))}
      />
      {chosen.length > 0 ? (
        <VendorSection
          titleId={SECTION_IDS.delivery}
          title={FORMATS_STEP.deliveryTitle}
          description={FORMATS_STEP.deliveryLine}
          status={formatsCompleteWords(complete, chosen.length)}
          statusLive
        >
          {packages.length > 0 ? (
            <VendorEditorPackageGuide
              title={FORMATS_STEP.guideTitle}
              note={FORMATS_STEP.packageNote}
              items={[
                {
                  id: GUIDE_IDS.label,
                  term: FORMATS_STEP.packageLabel,
                  description: FORMATS_STEP.guide.label,
                },
                {
                  id: GUIDE_IDS.reference,
                  term: FORMATS_STEP.packageReference,
                  description: FORMATS_STEP.guide.reference,
                },
                {
                  id: GUIDE_IDS.device,
                  term: FORMATS_STEP.device,
                  description: FORMATS_STEP.guide.device,
                },
                {
                  id: GUIDE_IDS.install,
                  term: FORMATS_STEP.install,
                  description: FORMATS_STEP.guide.install,
                },
              ]}
            />
          ) : null}
          <VendorDeliveryList>
            {draft.formats.includes('web') ? (
              <WebBlock
                web={draft.web}
                status={blockStatus('web')}
                errorOf={errorOf}
                onChange={onChange}
                referred={referred}
              />
            ) : null}
            {packages.map((format) => (
              <PackageBlock
                key={format}
                format={format}
                value={draft.packages[format]}
                status={blockStatus(format)}
                errorOf={errorOf}
                onChange={onChange}
                onAttach={onAttach}
                referred={referred}
              />
            ))}
          </VendorDeliveryList>
        </VendorSection>
      ) : null}
    </>
  );
}

// ---- Step 3 · Preview and documents (VE-05) -----------------------------------------------------

export interface PreviewStepProps extends StepFields {
  readonly onAddDocument: (() => void) | null;
  readonly onRemoveDocument: (fileName: string) => void;
}

/** Preview (label and link side by side) and Documents (Add document; a dashed line when none). */
export function PreviewStep({
  draft,
  errorOf,
  onChange,
  referred,
  onAddDocument,
  onRemoveDocument,
}: PreviewStepProps) {
  return (
    <>
      <VendorSection
        titleId={SECTION_IDS.preview}
        title={PREVIEW_STEP.title}
        description={PREVIEW_STEP.intro}
        titleFocusTarget
      >
        <VendorEditorGrid>
          <VendorEditorField
            id={fieldId('preview.label')}
            label={PREVIEW_STEP.label}
            optional={EDITOR.optional}
            width={3}
            hint={PREVIEW_STEP.labelHint}
            referred={tagFor(referred, 'preview.label')}
            error={errorOf('preview.label')}
          >
            <VendorEditorInput
              value={draft.previewLabel}
              onChange={(event) => {
                const value = event.target.value;
                onChange('preview.label', (current) => ({ ...current, previewLabel: value }));
              }}
            />
          </VendorEditorField>
          <VendorEditorField
            id={fieldId('preview.link')}
            label={PREVIEW_STEP.link}
            optional={EDITOR.optional}
            width={3}
            hint={PREVIEW_STEP.linkHint}
            referred={tagFor(referred, 'preview.link')}
            error={errorOf('preview.link')}
          >
            <VendorEditorInput
              type="url"
              value={draft.previewLink}
              onChange={(event) => {
                const value = event.target.value;
                onChange('preview.link', (current) => ({ ...current, previewLink: value }));
              }}
            />
          </VendorEditorField>
        </VendorEditorGrid>
      </VendorSection>
      <VendorSection
        titleId={SECTION_IDS.documents}
        title={PREVIEW_STEP.documents}
        optional={EDITOR.optional}
        description={PREVIEW_STEP.documentsHint}
        titleFocusTarget
        action={
          onAddDocument ? (
            <Button icon="add" iconSize={18} onClick={onAddDocument}>
              {PREVIEW_STEP.addDocument}
            </Button>
          ) : null
        }
      >
        {draft.documents.length > 0 ? (
          <VendorEditorFiles>
            {draft.documents.map((fileName) => (
              <VendorEditorFile
                key={fileName}
                name={fileName}
                removeLabel={FORMATS_STEP.remove}
                removeName={removeDocumentLabel(fileName)}
                onRemove={() => onRemoveDocument(fileName)}
              />
            ))}
          </VendorEditorFiles>
        ) : (
          <VendorEditorEmpty>{PREVIEW_STEP.noDocuments}</VendorEditorEmpty>
        )}
      </VendorSection>
    </>
  );
}

// ---- Step 4 · Check and submit (VE-06; VE-08's step 4) ------------------------------------------

export interface CheckStepProps {
  readonly draft: EditorDraft;
  /** The chosen course in words, or `null` when none is chosen. */
  readonly courseLine: string | null;
  readonly missing: readonly MissingItem[];
  /** Submit was pressed with something missing (the list with its links, `showMissing`). */
  readonly tried: boolean;
  readonly checklist: readonly ChecklistRow[];
  readonly outcomes: readonly LearningOutcome[];
  readonly revising: boolean;
  readonly onGoTo: (item: MissingItem) => void;
  readonly onChangeStep: (step: ChecklistRow['step']) => void;
}

/**
 * The lead (missing items, the quiet notice or "Everything required is provided"), one review
 * section per step with its status and Change, the learning outcomes and the "does not publish"
 * note. The actions follow in the editor's actions row.
 */
export function CheckStep({
  draft,
  courseLine,
  missing,
  tried,
  checklist,
  outcomes,
  revising,
  onGoTo,
  onChangeStep,
}: CheckStepProps) {
  const statusOf = (step: ChecklistRow['step']) =>
    checklist.find((row) => row.step === step)!.status;
  const review = (step: ChecklistRow['step']) => ({
    titleId: `${ID_PREFIX}-s4-${step}-h`,
    title: CHECK_STEP.sections[step],
    status: statusOf(step),
    changeLabel: CHECK_STEP.change,
    changeName: changeSectionLabel(step),
    onChange: () => onChangeStep(step),
  });
  const chosen = inDisplayOrder(draft.formats);
  const value = (text: string) => text.trim() || CHECK_STEP.empty;
  return (
    <>
      <VendorEditorCheckLead id={MISSING_ID}>
        {missing.length > 0 && tried ? (
          <VendorEditorMissing
            title={missingCountWords(missing.length)}
            items={missing.map((item) => ({
              key: item.field,
              text: item.text,
              linkLabel: item.where,
              href: `#${fieldId(item.field)}`,
              onSelect: () => onGoTo(item),
            }))}
          />
        ) : missing.length > 0 ? (
          <Notice tone="warn" icon="clock" role="status" title={missingCountWords(missing.length)}>
            {CHECK_STEP.quietLine}
          </Notice>
        ) : (
          <Notice tone="ok" icon="check" role="status" title={CHECK_STEP.readyTitle}>
            {revising ? CHECK_STEP.readyLineRevise : CHECK_STEP.readyLine}
          </Notice>
        )}
      </VendorEditorCheckLead>
      <VendorEditorReview {...review('course')}>
        <DefinitionList
          items={[
            { term: CHECK_STEP.rows.experiment, value: draft.name.trim() || CHECK_STEP.notNamed },
            { term: CHECK_STEP.rows.course, value: courseLine ?? CHECK_STEP.notChosen },
            { term: CHECK_STEP.rows.version, value: value(draft.version) },
            { term: CHECK_STEP.rows.summary, value: value(draft.summary) },
            { term: CHECK_STEP.rows.description, value: value(draft.description) },
          ]}
        />
      </VendorEditorReview>
      <VendorEditorReview {...review('formats')}>
        {chosen.length > 0 ? (
          <VendorDeliveryList>
            {chosen.map((format) => (
              <VendorDeliveryView
                key={format}
                code={FORMAT_META[format].code}
                name={formatName(format)}
                kind={formatKind(format)}
                rows={deliveryRows(draft, format)}
              />
            ))}
          </VendorDeliveryList>
        ) : (
          <VendorEditorEmpty icon="contentAccess">{CHECK_STEP.noFormats}</VendorEditorEmpty>
        )}
      </VendorEditorReview>
      <VendorEditorReview {...review('preview')} optional={EDITOR.optional}>
        <DefinitionList
          items={[
            {
              term: CHECK_STEP.rows.preview,
              value: previewWords(
                draft.previewLabel.trim() || null,
                draft.previewLink.trim() || null,
              ),
            },
            {
              term: CHECK_STEP.rows.documents,
              value: joinedWords(draft.documents, CHECK_STEP.none),
            },
          ]}
        />
      </VendorEditorReview>
      <VendorLearningOutcomes
        titleId={`${ID_PREFIX}-s4-lo-h`}
        title={CHECK_STEP.outcomesTitle}
        by={CHECK_STEP.outcomesBy}
        line={CHECK_STEP.outcomesLine}
        empty={CHECK_STEP.noOutcomes}
        outcomes={outcomes.map((outcome) => ({ key: outcome.id, text: outcome.text }))}
      />
      <VendorEditorSubmitNote>
        {revising ? CHECK_STEP.noteRevise : CHECK_STEP.note}
      </VendorEditorSubmitNote>
    </>
  );
}
