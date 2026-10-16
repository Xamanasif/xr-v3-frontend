'use client';

import type { ServiceError } from '@xr/contracts/draft';
import type { AreaId, CourseId } from '@xr/domain';
import {
  BackLink,
  Button,
  EditDialog,
  Field,
  Icon,
  Notice,
  PageHeader,
  Section,
  SectionBody,
  Textarea,
  TextInput,
  Timeline,
} from '@xr/ui';
import { type ReactNode, type RefObject, useEffect, useRef, useState } from 'react';

import { stateWords } from '@/copy/state-copy';
import {
  DESCRIPTION_DIALOG,
  descriptionTitle,
  RECORD_PAGE,
  RENAME_DIALOG,
  renameLabel,
  renameTitle,
  renameWarning,
} from '@/copy/structure';
import { STRUCTURE_ADDRESS } from '@/nav/structure';
import { checkRename, fieldErrorsOf, type StructureFieldErrors } from '@/queries/structure-forms';
import { useCommand } from '@/queries/use-command';

import type { HistoryLine } from './structure-view';

/** The page title, the flash and any element by id: where focus goes after an action. */
export interface RecordFocus {
  readonly titleRef: RefObject<HTMLHeadingElement | null>;
  readonly flashRef: RefObject<HTMLParagraphElement | null>;
  /** Moves focus after the commit that shows its target: `title`, `flash` or an element id. */
  readonly focus: (target: string) => void;
}

/**
 * Focus moves after the commit that shows its target (B7-07 `focus(id)`): the flash after a
 * result, a field after an error, the trigger after Cancel, the page title after a rename. A
 * dialog gives focus back to its trigger in the same commit (a child’s effect runs first), so
 * this request wins.
 */
export function useRecordFocus(): RecordFocus {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const flashRef = useRef<HTMLParagraphElement>(null);
  const [request, setRequest] = useState<{ readonly target: string; readonly n: number }>({
    target: '',
    n: 0,
  });
  useEffect(() => {
    if (request.n === 0) return;
    const element =
      request.target === 'flash'
        ? flashRef.current
        : request.target === 'title'
          ? titleRef.current
          : (document.getElementById(request.target) ?? titleRef.current);
    element?.focus();
  }, [request]);
  return {
    titleRef,
    flashRef,
    focus: (target) => setRequest((current) => ({ target, n: current.n + 1 })),
  };
}

/** The record’s header: back link, overline, the name (a focus target) and the actions. */
export function RecordHeader({
  overline,
  name,
  titleRef,
  children,
}: {
  readonly overline: string;
  readonly name: string;
  readonly titleRef: RefObject<HTMLHeadingElement | null>;
  readonly children: ReactNode;
}) {
  return (
    <>
      <PageHeader
        className="mt-2 mb-3"
        back={<BackLink href={STRUCTURE_ADDRESS}>{RECORD_PAGE.back}</BackLink>}
        overline={overline}
        title={name}
        titleFocusTarget
        titleRef={titleRef}
      />
      <div className="xw-actions mb-4">{children}</div>
    </>
  );
}

/** `p.xa-save.is-ok[role=status]`: what the last action did; a focus target. */
export function Flash({
  words,
  flashRef,
}: {
  readonly words: string | null;
  readonly flashRef: RefObject<HTMLParagraphElement | null>;
}) {
  return (
    <p ref={flashRef} className="xa-save is-ok mb-3" role="status" tabIndex={-1}>
      {words ? (
        <>
          <Icon name="done" />
          <span>{words}</span>
        </>
      ) : null}
    </p>
  );
}

/** “History · Newest first” (`ol.xr-timeline`, no latest marker, as B7-07 draws it). */
export function RecordHistory({ lines }: { readonly lines: readonly HistoryLine[] }) {
  return (
    <Section title={RECORD_PAGE.history} meta={RECORD_PAGE.historyMeta}>
      <SectionBody>
        <Timeline
          markLatest={false}
          events={lines.map((line) => ({
            id: line.id,
            what: line.what,
            when: line.when,
            ...(line.note ? { note: line.note } : {}),
          }))}
        />
      </SectionBody>
    </Section>
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
      readonly platformCode: string | null;
    }
  | {
      readonly kind: 'area';
      readonly id: AreaId;
      readonly name: string;
      readonly description: string | null;
      readonly rev: number;
    };

/** An open DL-3 small edit, with the record’s revision when it opened. */
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
const RENAME_WARNING = 'structure-rename-warning';
const DESCRIPTION_FIELD = 'structure-description';

/**
 * Rename and Edit description (B7-07 f6; script `openRename`, `openDesc`, `doRename`, `doDesc`):
 * DL-3 small edits through `AcademicStructureService.rename` and `editDescription`, each with the
 * revision the page showed when it opened. A blank name is caught first with the contract’s words;
 * an unchanged or taken name is the service’s answer, under the field, which takes focus. A
 * record changed meanwhile keeps the dialog open with what was typed, says so and reads the record
 * again (state-copy `SA-15.stale.*`); a failure for now says nothing was lost.
 */
export function useRecordEdits({
  target,
  focus,
  refetch,
  onOpen,
  onDone,
}: {
  readonly target: EditTarget;
  readonly focus: RecordFocus;
  readonly refetch: () => void;
  /** Another panel closes when a dialog opens (B7-07 `open`: `mv: false`). */
  readonly onOpen: () => void;
  readonly onDone: (words: string, then: 'title' | 'flash') => void;
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
          onDone(RENAME_DIALOG.renamed, 'title');
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
        onDone(DESCRIPTION_DIALOG.saved, 'flash');
      },
      () => setNotice('unavailable'),
    );
  };

  const noticeBlock =
    notice === 'stale' ? (
      <Notice
        tone="warn"
        role="alert"
        title={stateWords(target.kind === 'course' ? 'SA-15.stale.course' : 'SA-15.stale.area')}
        className="mb-[14px]"
      >
        {stateWords('SA-15.stale.line')}
      </Notice>
    ) : notice === 'unavailable' ? (
      <Notice tone="err" role="alert" className="mb-[14px]">
        {stateWords('SA-15.unavailable')}
      </Notice>
    ) : null;

  const warning = renameWarning(
    target.kind === 'course'
      ? { kind: 'course', platformCode: target.platformCode }
      : { kind: 'area' },
  );

  const dialogs = (
    <>
      <EditDialog
        open={edit?.kind === 'rename'}
        align="start"
        idPrefix="structure-rename"
        returnFocusFallback={focus.titleRef}
        title={renameTitle(target.kind)}
        confirmLabel={RENAME_DIALOG.confirm}
        busy={rename.busy}
        busyLabel={RENAME_DIALOG.busy}
        onConfirm={confirm}
        onCancel={close}
      >
        {noticeBlock}
        <Field id={RENAME_FIELD} label={renameLabel(target.kind)} error={errors['name']}>
          {(control) => (
            <TextInput
              value={edit?.kind === 'rename' ? edit.name : ''}
              aria-describedby={[control['aria-describedby'], RENAME_WARNING]
                .filter(Boolean)
                .join(' ')}
              onChange={(event) => {
                const name = event.target.value;
                setEdit((current) => (current?.kind === 'rename' ? { ...current, name } : current));
                setErrors({});
              }}
            />
          )}
        </Field>
        <p className="xl-meta mt-3 mb-0" id={RENAME_WARNING}>
          {warning}
        </p>
      </EditDialog>
      <EditDialog
        open={edit?.kind === 'description'}
        align="start"
        idPrefix="structure-description"
        returnFocusFallback={focus.titleRef}
        title={descriptionTitle(target.name)}
        confirmLabel={DESCRIPTION_DIALOG.confirm}
        busy={describe.busy}
        busyLabel={DESCRIPTION_DIALOG.busy}
        onConfirm={confirm}
        onCancel={close}
      >
        {noticeBlock}
        <Field id={DESCRIPTION_FIELD} label={DESCRIPTION_DIALOG.label}>
          <Textarea
            className="min-h-[104px]"
            value={edit?.kind === 'description' ? edit.description : ''}
            onChange={(event) => {
              const description = event.target.value;
              setEdit((current) =>
                current?.kind === 'description' ? { ...current, description } : current,
              );
            }}
          />
        </Field>
      </EditDialog>
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

/** The Rename and Edit description buttons (`div.xw-actions`), each a dialog’s trigger. */
export function EditButtons({ edits }: { readonly edits: RecordEdits }) {
  return (
    <>
      <Button variant="secondary" id="structure-rename" onClick={edits.openRename}>
        {RECORD_PAGE.rename}
      </Button>
      <Button variant="secondary" id="structure-edit-description" onClick={edits.openDescription}>
        {RECORD_PAGE.editDescription}
      </Button>
    </>
  );
}
