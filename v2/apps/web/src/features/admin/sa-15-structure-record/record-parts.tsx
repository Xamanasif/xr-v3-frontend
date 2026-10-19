'use client';

import type { ServiceError } from '@xr/contracts/draft';
import type { AreaId, CourseId } from '@xr/domain';
import {
  Button,
  ConfirmDialog,
  Field,
  Notice,
  SectionNote,
  SurfaceSection,
  Textarea,
  TextInput,
  Timeline,
} from '@xr/ui/v3';
import { type ReactNode, useState } from 'react';

import { stateWords } from '@/copy/state-copy';
import {
  DESCRIPTION_DIALOG,
  descriptionTitle,
  RENAME_DIALOG,
  renamedWords,
  renameTitle,
  STRUCTURE_SHARED,
} from '@/copy/structure';
import { checkRename, fieldErrorsOf, type StructureFieldErrors } from '@/queries/structure-forms';
import { useCommand } from '@/queries/use-command';

import type { FlashWords, StructureFocus } from '../sa-14-structure/structure-parts';
import type { HistoryLine } from './structure-view';

/** “History · Newest first” (`section.rk-sec` > `ol.rk-tl`, the newest marked as the latest). */
export function RecordHistory({
  titleId,
  lines,
}: {
  readonly titleId: string;
  readonly lines: readonly HistoryLine[];
}) {
  return (
    <SurfaceSection
      title={STRUCTURE_SHARED.history}
      titleId={titleId}
      aside={<SectionNote>{STRUCTURE_SHARED.historyNote}</SectionNote>}
    >
      <Timeline
        events={lines.map((line) => ({
          what: line.what,
          when: line.when,
          ...(line.note ? { note: line.note } : {}),
        }))}
      />
    </SurfaceSection>
  );
}

/** The record Rename and Edit description change (the revision as the page showed it). */
export type EditTarget =
  | {
      readonly kind: 'course';
      readonly id: CourseId;
      readonly name: string;
      readonly description: string | null;
      readonly rev: number;
    }
  | {
      readonly kind: 'area';
      readonly id: AreaId;
      readonly name: string;
      readonly description: string | null;
      readonly rev: number;
    };

/** An open small edit, with the record’s revision when it opened. */
type EditState =
  | { readonly kind: 'rename'; readonly name: string; readonly expectedRev: number }
  | { readonly kind: 'description'; readonly description: string; readonly expectedRev: number };

type DialogNotice = 'stale' | 'unavailable' | null;

export interface RecordEdits {
  readonly openRename: () => void;
  readonly openDescription: () => void;
  /** The two dialogs, rendered where the page places them. */
  readonly dialogs: ReactNode;
}

const RENAME_FIELD = 'structure-rename-name';
const DESCRIPTION_FIELD = 'structure-description';

/**
 * Rename and Edit description (the export’s `SA.DLG.area` / `SA.DLG.course` rename and desc;
 * B7-07 f6) through `AcademicStructureService.rename` and `editDescription`, each with the
 * revision the page showed when its dialog opened. A blank name is caught first with the
 * contract’s words; an unchanged or taken name is the service’s answer, under the field, which
 * takes focus. A record changed meanwhile keeps the dialog open with what was typed, says so and
 * reads the record again (state-copy `SA-15.stale.*`); a failure for now says nothing was lost.
 * Saved, the dialog closes and the page’s flash says what changed (`SA-15.after`).
 */
export function useRecordEdits({
  target,
  focus,
  refetch,
  onOpen,
  onDone,
}: {
  readonly target: EditTarget;
  readonly focus: StructureFocus;
  readonly refetch: () => void;
  /** The flash closes when a dialog opens. */
  readonly onOpen: () => void;
  readonly onDone: (words: FlashWords) => void;
}): RecordEdits {
  const rename = useCommand((ports) => ports.academicStructure.rename);
  const describe = useCommand((ports) => ports.academicStructure.editDescription);
  const [edit, setEdit] = useState<EditState | null>(null);
  const [errors, setErrors] = useState<StructureFieldErrors>({});
  const [notice, setNotice] = useState<DialogNotice>(null);

  const open = (next: EditState) => {
    onOpen();
    setErrors({});
    setNotice(null);
    setEdit(next);
  };
  const close = () => {
    setEdit(null);
    setErrors({});
    setNotice(null);
  };

  /** A refusal: field errors stay on the field; a stale record keeps the dialog; else it closes. */
  const refused = (error: ServiceError) => {
    if (error.kind === 'validation-failed') {
      const fields = fieldErrorsOf(error);
      if (fields['name']) {
        setErrors(fields);
        focus.focus(RENAME_FIELD);
        return;
      }
    }
    if (error.kind === 'stale-version') {
      setEdit((current) => (current ? { ...current, expectedRev: error.currentRev } : current));
      setNotice('stale');
      refetch();
      return;
    }
    close();
    refetch();
    focus.focus('title');
  };

  const confirm = () => {
    if (!edit) return;
    setNotice(null);
    if (edit.kind === 'rename') {
      const input = {
        kind: target.kind,
        id: target.id,
        name: edit.name,
        expectedRev: edit.expectedRev,
      } as Parameters<typeof rename.run>[0];
      const checked = checkRename({ ...input, id: target.id });
      if (checked) {
        setErrors(checked);
        focus.focus(RENAME_FIELD);
        return;
      }
      rename.run(input).then(
        (answer) => {
          if (!answer.ok) return refused(answer.error);
          close();
          onDone({ title: renamedWords(target.kind, answer.value.name) });
        },
        () => setNotice('unavailable'),
      );
      return;
    }
    const input = {
      kind: target.kind,
      id: target.id,
      description: edit.description,
      expectedRev: edit.expectedRev,
    } as Parameters<typeof describe.run>[0];
    describe.run(input).then(
      (answer) => {
        if (!answer.ok) return refused(answer.error);
        close();
        onDone({ title: DESCRIPTION_DIALOG.saved });
      },
      () => setNotice('unavailable'),
    );
  };

  const noticeBlock =
    notice === 'stale' ? (
      <Notice
        tone="warn"
        icon="alertCircle"
        role="alert"
        title={stateWords(target.kind === 'course' ? 'SA-15.stale.course' : 'SA-15.stale.area')}
      >
        {stateWords('SA-15.stale.line')}
      </Notice>
    ) : notice === 'unavailable' ? (
      <Notice tone="warn" icon="alertCircle" role="alert" title={stateWords('SA-15.unavailable')} />
    ) : null;

  const course = target.kind === 'course';
  const dialogs = (
    <>
      <ConfirmDialog
        initialFocus="field"
        submitOnEnter
        open={edit?.kind === 'rename'}
        idPrefix="structure-rename"
        title={renameTitle(target.name)}
        description={course ? RENAME_DIALOG.courseDescription : RENAME_DIALOG.areaDescription}
        confirmLabel={RENAME_DIALOG.confirm}
        cancelLabel={STRUCTURE_SHARED.cancel}
        busy={rename.busy}
        busyLabel={RENAME_DIALOG.busy}
        returnFocusFallback={focus.titleRef}
        onConfirm={confirm}
        onCancel={close}
      >
        {edit?.kind === 'rename' ? (
          <>
            {noticeBlock}
            <Field
              id={RENAME_FIELD}
              label={course ? RENAME_DIALOG.courseName : RENAME_DIALOG.areaName}
              error={errors['name']}
            >
              <TextInput
                autoComplete="off"
                value={edit?.kind === 'rename' ? edit.name : ''}
                onChange={(event) => {
                  const name = event.target.value;
                  setEdit((current) =>
                    current?.kind === 'rename' ? { ...current, name } : current,
                  );
                  setErrors({});
                }}
              />
            </Field>
          </>
        ) : null}
      </ConfirmDialog>
      <ConfirmDialog
        initialFocus="field"
        submitOnEnter
        open={edit?.kind === 'description'}
        idPrefix="structure-description"
        title={descriptionTitle(target.name)}
        description={
          course ? DESCRIPTION_DIALOG.courseDescription : DESCRIPTION_DIALOG.areaDescription
        }
        confirmLabel={DESCRIPTION_DIALOG.confirm}
        cancelLabel={STRUCTURE_SHARED.cancel}
        busy={describe.busy}
        busyLabel={DESCRIPTION_DIALOG.busy}
        returnFocusFallback={focus.titleRef}
        onConfirm={confirm}
        onCancel={close}
      >
        {edit?.kind === 'description' ? (
          <>
            {noticeBlock}
            <Field id={DESCRIPTION_FIELD} label={DESCRIPTION_DIALOG.label}>
              <Textarea
                value={edit?.kind === 'description' ? edit.description : ''}
                onChange={(event) => {
                  const description = event.target.value;
                  setEdit((current) =>
                    current?.kind === 'description' ? { ...current, description } : current,
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
    openRename: () => open({ kind: 'rename', name: target.name, expectedRev: target.rev }),
    openDescription: () =>
      open({
        kind: 'description',
        description: target.description ?? '',
        expectedRev: target.rev,
      }),
    dialogs,
  };
}

/** Rename and Edit description, each its dialog’s trigger. */
export function EditButtons({
  edits,
  rename,
  editDescription,
}: {
  readonly edits: RecordEdits;
  readonly rename: string;
  readonly editDescription: string;
}) {
  return (
    <>
      <Button id="structure-rename" onClick={edits.openRename}>
        {rename}
      </Button>
      <Button id="structure-edit-description" onClick={edits.openDescription}>
        {editDescription}
      </Button>
    </>
  );
}
