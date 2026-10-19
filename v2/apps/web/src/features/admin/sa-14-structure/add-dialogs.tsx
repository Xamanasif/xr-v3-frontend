'use client';

import type { ServiceError } from '@xr/contracts/draft';
import type { AreaId } from '@xr/domain';
import { ConfirmDialog, Field, Notice, Select, Textarea, TextInput } from '@xr/ui/v3';
import { type ReactNode, useState } from 'react';

import { stateWords } from '@/copy/state-copy';
import { ADD_AREA_DIALOG, ADD_COURSE_DIALOG, addedWords, STRUCTURE_SHARED } from '@/copy/structure';
import {
  checkAddArea,
  checkAddCourse,
  fieldErrorsOf,
  type StructureFieldErrors,
} from '@/queries/structure-forms';
import { useCommand } from '@/queries/use-command';

import type { FlashWords, StructureFocus } from './structure-parts';

/** An open Add dialog: what has been typed and chosen so far (`''`: no area chosen yet). */
type AddDialog =
  | { readonly kind: 'area'; readonly name: string; readonly description: string }
  | {
      readonly kind: 'course';
      readonly name: string;
      readonly areaId: string;
      readonly description: string;
    };

/** An area the new course can go in, in the structure’s order. */
export interface AreaOption {
  readonly id: string;
  readonly name: string;
}

export interface StructureAdds {
  readonly openArea: () => void;
  /** Add course, with an area chosen already (an area record’s Add course) or none. */
  readonly openCourse: (areaId?: string) => void;
  /** The two dialogs, rendered where the page places them. */
  readonly dialogs: ReactNode;
}

const AREA_NAME = 'structure-area-name';
const COURSE_NAME = 'structure-course-name';
const COURSE_AREA = 'structure-course-area';

/**
 * Add area and Add course (the export’s `SA.DLG.area` add, `SA.DLG.course` add; B7-07 f7,
 * `doAddArea`, `doAddCourse`) through `AcademicStructureService.addArea` and `addCourse`. A blank
 * name or no area chosen is caught before anything is sent with the contract’s own words — both
 * of Add course’s errors at once, focus on the first; a taken name is the service’s answer, under
 * the field. Added, the dialog closes and the page’s flash names what was added. A failure for now
 * keeps the dialog and what was typed (state-copy `SA-14.unavailable`). No artwork upload, no
 * platform code (the Content Manager adds it in Course codes).
 */
export function useStructureAdds({
  areas,
  focus,
  onOpen,
  onAdded,
  refetch,
}: {
  readonly areas: readonly AreaOption[];
  readonly focus: StructureFocus;
  /** The flash closes when a dialog opens. */
  readonly onOpen: () => void;
  readonly onAdded: (words: FlashWords) => void;
  readonly refetch: () => void;
}): StructureAdds {
  const addArea = useCommand((ports) => ports.academicStructure.addArea);
  const addCourse = useCommand((ports) => ports.academicStructure.addCourse);
  const [dialog, setDialog] = useState<AddDialog | null>(null);
  const [errors, setErrors] = useState<StructureFieldErrors>({});
  const [unavailable, setUnavailable] = useState(false);

  const open = (next: AddDialog) => {
    onOpen();
    setDialog(next);
    setErrors({});
    setUnavailable(false);
  };
  const close = () => {
    setDialog(null);
    setErrors({});
    setUnavailable(false);
  };

  /** Field errors on the fields, focus on the first: the name, else the area. */
  const showErrors = (fields: StructureFieldErrors) => {
    setErrors(fields);
    if (fields['name']) focus.focus(dialog?.kind === 'course' ? COURSE_NAME : AREA_NAME);
    else if (fields['areaId']) focus.focus(COURSE_AREA);
  };
  const refused = (error: ServiceError) => {
    if (error.kind === 'validation-failed') {
      showErrors(fieldErrorsOf(error));
      return;
    }
    close();
    refetch();
  };
  const added = (words: FlashWords) => {
    close();
    onAdded(words);
  };

  const confirm = () => {
    if (!dialog) return;
    setUnavailable(false);
    if (dialog.kind === 'area') {
      const input = { name: dialog.name, description: dialog.description };
      const checked = checkAddArea(input);
      if (checked) return showErrors(checked);
      addArea.run(input).then(
        (answer) =>
          answer.ok
            ? added({ title: addedWords(answer.value.name), detail: ADD_AREA_DIALOG.added })
            : refused(answer.error),
        () => setUnavailable(true),
      );
      return;
    }
    const input = {
      name: dialog.name,
      areaId: dialog.areaId === '' ? null : dialog.areaId,
      description: dialog.description,
    };
    const checked = checkAddCourse(input);
    if (checked) return showErrors(checked);
    addCourse.run({ ...input, areaId: dialog.areaId as AreaId }).then(
      (answer) =>
        answer.ok
          ? added({ title: addedWords(answer.value.name), detail: ADD_COURSE_DIALOG.added })
          : refused(answer.error),
      () => setUnavailable(true),
    );
  };

  const failedNotice = unavailable ? (
    <Notice tone="warn" icon="alertCircle" role="alert" title={stateWords('SA-14.unavailable')} />
  ) : null;

  const dialogs = (
    <>
      <ConfirmDialog
        initialFocus="field"
        submitOnEnter
        open={dialog?.kind === 'area'}
        idPrefix="structure-add-area"
        title={ADD_AREA_DIALOG.title}
        description={ADD_AREA_DIALOG.description}
        confirmLabel={ADD_AREA_DIALOG.confirm}
        cancelLabel={STRUCTURE_SHARED.cancel}
        busy={addArea.busy}
        busyLabel={ADD_AREA_DIALOG.busy}
        returnFocusFallback={focus.titleRef}
        onConfirm={confirm}
        onCancel={close}
      >
        {dialog?.kind === 'area' ? (
          <>
            {failedNotice}
            <Field id={AREA_NAME} label={ADD_AREA_DIALOG.name} error={errors['name']}>
              <TextInput
                autoComplete="off"
                value={dialog?.kind === 'area' ? dialog.name : ''}
                onChange={(event) => {
                  const name = event.target.value;
                  setDialog((current) =>
                    current?.kind === 'area' ? { ...current, name } : current,
                  );
                  setErrors((current) => without(current, 'name'));
                }}
              />
            </Field>
            <Field id="structure-area-description" label={ADD_AREA_DIALOG.descriptionLabel}>
              <Textarea
                value={dialog?.kind === 'area' ? dialog.description : ''}
                onChange={(event) => {
                  const description = event.target.value;
                  setDialog((current) =>
                    current?.kind === 'area' ? { ...current, description } : current,
                  );
                }}
              />
            </Field>
          </>
        ) : null}
      </ConfirmDialog>
      <ConfirmDialog
        initialFocus="field"
        submitOnEnter
        open={dialog?.kind === 'course'}
        idPrefix="structure-add-course"
        title={ADD_COURSE_DIALOG.title}
        description={ADD_COURSE_DIALOG.description}
        confirmLabel={ADD_COURSE_DIALOG.confirm}
        cancelLabel={STRUCTURE_SHARED.cancel}
        busy={addCourse.busy}
        busyLabel={ADD_COURSE_DIALOG.busy}
        returnFocusFallback={focus.titleRef}
        onConfirm={confirm}
        onCancel={close}
      >
        {dialog?.kind === 'course' ? (
          <>
            {failedNotice}
            <Field id={COURSE_NAME} label={ADD_COURSE_DIALOG.name} error={errors['name']}>
              <TextInput
                autoComplete="off"
                value={dialog?.kind === 'course' ? dialog.name : ''}
                onChange={(event) => {
                  const name = event.target.value;
                  setDialog((current) =>
                    current?.kind === 'course' ? { ...current, name } : current,
                  );
                  setErrors((current) => without(current, 'name'));
                }}
              />
            </Field>
            <Field id={COURSE_AREA} label={ADD_COURSE_DIALOG.area} error={errors['areaId']}>
              <Select
                value={dialog?.kind === 'course' ? dialog.areaId : ''}
                options={[
                  { value: '', label: ADD_COURSE_DIALOG.chooseArea },
                  ...areas.map((area) => ({ value: area.id, label: area.name })),
                ]}
                onChange={(event) => {
                  const areaId = event.target.value;
                  setDialog((current) =>
                    current?.kind === 'course' ? { ...current, areaId } : current,
                  );
                  setErrors((current) => without(current, 'areaId'));
                }}
              />
            </Field>
            <Field id="structure-course-description" label={ADD_COURSE_DIALOG.descriptionLabel}>
              <Textarea
                value={dialog?.kind === 'course' ? dialog.description : ''}
                onChange={(event) => {
                  const description = event.target.value;
                  setDialog((current) =>
                    current?.kind === 'course' ? { ...current, description } : current,
                  );
                }}
              />
            </Field>
          </>
        ) : null}
      </ConfirmDialog>
    </>
  );

  return {
    openArea: () => open({ kind: 'area', name: '', description: '' }),
    openCourse: (areaId = '') => open({ kind: 'course', name: '', areaId, description: '' }),
    dialogs,
  };
}

/** The field errors without one field’s (editing a field clears its error, B7-07 `onName`). */
function without(errors: StructureFieldErrors, field: string): StructureFieldErrors {
  return Object.fromEntries(Object.entries(errors).filter(([key]) => key !== field));
}
