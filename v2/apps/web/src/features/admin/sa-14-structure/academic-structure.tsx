'use client';

import type { Out, ServiceError, structureOutput } from '@xr/contracts/draft';
import type { AreaId } from '@xr/domain';
import {
  Button,
  ChoiceCard,
  ChoiceList,
  EditDialog,
  FailedState,
  Field,
  Icon,
  Link,
  LoadingState,
  Notice,
  PageContent,
  PageHeader,
  RadioGroup,
  Row,
  Rows,
  Textarea,
  TextInput,
} from '@xr/ui';
import { useEffect, useRef, useState } from 'react';

import { stateWords } from '@/copy/state-copy';
import {
  ADD_AREA_DIALOG,
  ADD_COURSE_DIALOG,
  courseAddedWords,
  courseCountWords,
  openAreaLabel,
  openCourseLabel,
  publishedWords,
  STRIPPED_STRUCTURE,
  STRUCTURE_PAGE,
  structureSummary,
} from '@/copy/structure';
import { structureAreaAddress, structureCourseAddress, structurePlacement } from '@/nav/structure';
import { useAcademicStructure } from '@/queries/structure';
import {
  checkAddArea,
  checkAddCourse,
  fieldErrorsOf,
  type StructureFieldErrors,
} from '@/queries/structure-forms';
import { useCommand } from '@/queries/use-command';

import { useShellPage } from '../../shared/workspace-frame/shell-page';

/** `AcademicStructureService.getStructure`: the areas in order, each with its courses. */
type Structure = Out<typeof structureOutput>;

/** An open Add dialog: what has been typed and chosen so far. */
type AddDialog =
  | { readonly kind: 'area'; readonly name: string; readonly description: string }
  | {
      readonly kind: 'course';
      readonly name: string;
      readonly areaId: AreaId | null;
      readonly description: string;
    };

const AREA_NAME = 'structure-area-name';
const COURSE_NAME = 'structure-course-name';

/**
 * SA-14 Academic structure — boards B7-07 f0 (1440) and f7 (Add course · validation), B7-12 f12 …
 * f15 (1440 / 1024 / 768 / 375), at `/admin/structure`: “Which engineering areas and courses
 * exist?”
 *
 * - **Read**: `AcademicStructureService.getStructure` — the areas in the structure’s order, each
 *   with its courses and their published experiments. Engineering area groups courses; there is
 *   no Programme or Module level (BC2).
 * - **As B7-07 draws it**: the header line (“3 engineering areas · 6 courses · feeds …”), Add area
 *   (secondary) and Add course (the one primary); one section per area — its name, description,
 *   “N courses” and “Open area” (SA-15) — with a row per course: its platform code (read-only,
 *   the Content Manager’s, M-2) or “No platform code yet”, its published experiments and “Open”
 *   (SA-15); an area with no courses says so; the foot note on codes and retiring (without the
 *   decision id, P1-14). Below 600 px of app width the header actions wrap below the title and
 *   each row keeps its Open (B7-12 f15).
 * - **Add area / Add course**: DL-3 dialogs. A blank name or no area chosen is caught before
 *   anything is sent with the contract’s own words — both of Add course’s errors at once (f7);
 *   a taken name is the service’s answer. Added, the dialog closes and the flash says what
 *   happened and takes focus; a new course has no platform code (the Content Manager adds it in
 *   Course codes). No Retire and no artwork upload (D3).
 */
export function AcademicStructure() {
  useShellPage(structurePlacement());
  const read = useAcademicStructure();
  const structure = read.data?.ok ? read.data.value : null;
  const failed = read.isError || (read.data !== undefined && !read.data.ok);

  const addArea = useCommand((ports) => ports.academicStructure.addArea);
  const addCourse = useCommand((ports) => ports.academicStructure.addCourse);
  const [dialog, setDialog] = useState<AddDialog | null>(null);
  const [errors, setErrors] = useState<StructureFieldErrors>({});
  const [unavailable, setUnavailable] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const flashRef = useRef<HTMLParagraphElement>(null);
  const firstArea = useRef<HTMLInputElement>(null);
  const [focusRequest, setFocusRequest] = useState({ target: '', n: 0 });

  // Focus moves after the commit that shows its target (B7-07 `focus(id)`): the flash after a
  // result, the name field or the first area after an error. The dialog has given focus back to
  // its trigger in the same commit (a child’s effect runs first), so this request wins.
  useEffect(() => {
    if (focusRequest.n === 0) return;
    const target =
      focusRequest.target === 'flash'
        ? flashRef.current
        : focusRequest.target === 'first-area'
          ? firstArea.current
          : document.getElementById(focusRequest.target);
    target?.focus();
  }, [focusRequest]);
  const focus = (target: string) => setFocusRequest((current) => ({ target, n: current.n + 1 }));

  const open = (next: AddDialog) => {
    setDialog(next);
    setErrors({});
    setUnavailable(false);
    setFlash(null);
  };
  const close = () => {
    setDialog(null);
    setErrors({});
    setUnavailable(false);
  };

  /** Field errors on the fields (the name first, else the first area); anything else re-reads. */
  const showErrors = (fields: StructureFieldErrors) => {
    setErrors(fields);
    if (fields['name']) focus(dialog?.kind === 'course' ? COURSE_NAME : AREA_NAME);
    else if (fields['areaId']) focus('first-area');
  };
  const refused = (error: ServiceError) => {
    if (error.kind === 'validation-failed') {
      showErrors(fieldErrorsOf(error));
      return;
    }
    close();
    void read.refetch();
  };
  const added = (words: string) => {
    close();
    setFlash(words);
    focus('flash');
  };

  const confirm = () => {
    if (!dialog) return;
    setUnavailable(false);
    if (dialog.kind === 'area') {
      const input = { name: dialog.name, description: dialog.description };
      const checked = checkAddArea(input);
      if (checked) return showErrors(checked);
      addArea.run(input).then(
        (answer) => (answer.ok ? added(ADD_AREA_DIALOG.added) : refused(answer.error)),
        () => setUnavailable(true),
      );
      return;
    }
    const input = { name: dialog.name, areaId: dialog.areaId, description: dialog.description };
    const checked = checkAddCourse(input);
    if (checked) return showErrors(checked);
    const areaId = dialog.areaId!;
    const areaName = structure?.find((group) => group.area.id === areaId)?.area.name ?? '';
    addCourse.run({ ...input, areaId }).then(
      (answer) => (answer.ok ? added(courseAddedWords(areaName)) : refused(answer.error)),
      () => setUnavailable(true),
    );
  };

  const courses = structure?.reduce((sum, group) => sum + group.courses.length, 0) ?? 0;
  const failedNotice = unavailable ? (
    <Notice tone="err" role="alert" className="mb-[14px]">
      {stateWords('SA-14.unavailable')}
    </Notice>
  ) : null;

  return (
    <PageContent wrap="wide">
      <PageHeader
        className="mb-4"
        title={STRUCTURE_PAGE.title}
        meta={
          structure ? (
            <span className="xl-meta">{structureSummary(structure.length, courses)}</span>
          ) : null
        }
        actions={
          <>
            <Button
              variant="secondary"
              icon="add"
              id="structure-add-area"
              onClick={() => open({ kind: 'area', name: '', description: '' })}
            >
              {STRUCTURE_PAGE.addArea}
            </Button>
            <Button
              variant="primary"
              icon="add"
              id="structure-add-course"
              onClick={() => open({ kind: 'course', name: '', areaId: null, description: '' })}
            >
              {STRUCTURE_PAGE.addCourse}
            </Button>
          </>
        }
      />
      <p ref={flashRef} className="xa-save is-ok mb-3" role="status" tabIndex={-1}>
        {flash ? (
          <>
            <Icon name="done" />
            <span>{flash}</span>
          </>
        ) : null}
      </p>
      {failed ? (
        <FailedState
          title={stateWords('SA-14.failed')}
          onRetry={() => {
            void read.refetch();
          }}
        >
          {stateWords('SA-14.failed.line')}
        </FailedState>
      ) : structure ? (
        <>
          <div className="flex flex-col gap-5">
            {structure.map((group) => (
              <AreaGroup key={group.area.id} group={group} />
            ))}
          </div>
          <p className="xl-open mt-4 mb-0">
            <Icon name="info" size={16} />
            <span>{STRIPPED_STRUCTURE.footNote.words}</span>
          </p>
        </>
      ) : (
        <LoadingState label={stateWords('SA-14.loading')} surface="section" />
      )}
      <EditDialog
        open={dialog?.kind === 'area'}
        align="start"
        idPrefix="structure-add-area"
        title={ADD_AREA_DIALOG.title}
        confirmLabel={ADD_AREA_DIALOG.confirm}
        busy={addArea.busy}
        busyLabel={ADD_AREA_DIALOG.busy}
        returnFocusFallback={flashRef}
        onConfirm={confirm}
        onCancel={close}
      >
        {failedNotice}
        <Field id={AREA_NAME} label={ADD_AREA_DIALOG.name} error={errors['name']}>
          <TextInput
            value={dialog?.kind === 'area' ? dialog.name : ''}
            onChange={(event) => {
              const name = event.target.value;
              setDialog((current) => (current?.kind === 'area' ? { ...current, name } : current));
              setErrors((current) => without(current, 'name'));
            }}
          />
        </Field>
        <div className="h-3" />
        <Field
          id="structure-area-description"
          label={ADD_AREA_DIALOG.description}
          marker={ADD_AREA_DIALOG.optional}
        >
          <Textarea
            className="min-h-[80px]"
            value={dialog?.kind === 'area' ? dialog.description : ''}
            onChange={(event) => {
              const description = event.target.value;
              setDialog((current) =>
                current?.kind === 'area' ? { ...current, description } : current,
              );
            }}
          />
        </Field>
        <p className="xl-meta mt-3 mb-0">{ADD_AREA_DIALOG.note}</p>
      </EditDialog>
      <EditDialog
        open={dialog?.kind === 'course'}
        align="start"
        idPrefix="structure-add-course"
        title={ADD_COURSE_DIALOG.title}
        confirmLabel={ADD_COURSE_DIALOG.confirm}
        busy={addCourse.busy}
        busyLabel={ADD_COURSE_DIALOG.busy}
        returnFocusFallback={flashRef}
        onConfirm={confirm}
        onCancel={close}
      >
        {failedNotice}
        <Field id={COURSE_NAME} label={ADD_COURSE_DIALOG.name} error={errors['name']}>
          <TextInput
            value={dialog?.kind === 'course' ? dialog.name : ''}
            onChange={(event) => {
              const name = event.target.value;
              setDialog((current) => (current?.kind === 'course' ? { ...current, name } : current));
              setErrors((current) => without(current, 'name'));
            }}
          />
        </Field>
        <div className="h-3" />
        <RadioGroup
          id="structure-course-area"
          legend={ADD_COURSE_DIALOG.area}
          legendClass="xr-label"
          value={dialog?.kind === 'course' ? dialog.areaId : null}
          onValueChange={(value) => {
            setDialog((current) =>
              current?.kind === 'course' ? { ...current, areaId: value as AreaId } : current,
            );
            setErrors((current) => without(current, 'areaId'));
          }}
          error={errors['areaId']}
        >
          <ChoiceList>
            {(structure ?? []).map((group, index) => (
              <ChoiceCard
                key={group.area.id}
                ref={index === 0 ? firstArea : undefined}
                id={`structure-course-area-${group.area.id}`}
                value={group.area.id}
                title={group.area.name}
              />
            ))}
          </ChoiceList>
        </RadioGroup>
        <div className="h-3" />
        <Field
          id="structure-course-description"
          label={ADD_COURSE_DIALOG.description}
          marker={ADD_COURSE_DIALOG.optional}
        >
          <Textarea
            className="min-h-[80px]"
            value={dialog?.kind === 'course' ? dialog.description : ''}
            onChange={(event) => {
              const description = event.target.value;
              setDialog((current) =>
                current?.kind === 'course' ? { ...current, description } : current,
              );
            }}
          />
        </Field>
        <p className="xl-meta mt-3 mb-0">{ADD_COURSE_DIALOG.note}</p>
      </EditDialog>
    </PageContent>
  );
}

/** The field errors without one field’s (editing a field clears its error, B7-07 `onName`). */
function without(errors: StructureFieldErrors, field: string): StructureFieldErrors {
  return Object.fromEntries(Object.entries(errors).filter(([key]) => key !== field));
}

/**
 * One engineering area (`section.xr-section`): its head — name, description, “N courses”, “Open
 * area” — and a row per course, or “No courses yet” (B7-07 f0 markup).
 */
function AreaGroup({ group }: { readonly group: Structure[number] }) {
  const { area, courses } = group;
  const headingId = `structure-area-${area.id}`;
  return (
    <section className="xr-section" aria-labelledby={headingId}>
      <div className="xr-section-head">
        <div>
          <h2 id={headingId} className="xr-h2">
            {area.name}
          </h2>
          <p className="xr-meta mt-[2px] mb-0">
            {area.description ?? STRUCTURE_PAGE.noDescription}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="xr-meta">{courseCountWords(courses.length)}</span>
          <Link
            className="xr-btn xr-btn--text xr-btn--sm"
            href={structureAreaAddress(area.id)}
            aria-label={openAreaLabel(area.name)}
          >
            {STRUCTURE_PAGE.openArea}
          </Link>
        </div>
      </div>
      {courses.length > 0 ? (
        <Rows>
          {courses.map(({ course, publishedExperiments }) => (
            <Row
              key={course.id}
              title={course.name}
              sub={
                <>
                  {course.platformCode ? (
                    <span className="xr-id">{course.platformCode}</span>
                  ) : (
                    <span>{STRUCTURE_PAGE.noCode}</span>
                  )}{' '}
                  · {publishedWords(publishedExperiments)}
                </>
              }
            >
              <Link
                className="xr-btn xr-btn--secondary xr-btn--sm"
                href={structureCourseAddress(course.id)}
                aria-label={openCourseLabel(course.name)}
              >
                {STRUCTURE_PAGE.open}
              </Link>
            </Row>
          ))}
        </Rows>
      ) : (
        <div className="xr-section-body">
          <p className="xr-body m-0 text-ink-2">{STRUCTURE_PAGE.noCourses}</p>
        </div>
      )}
    </section>
  );
}
