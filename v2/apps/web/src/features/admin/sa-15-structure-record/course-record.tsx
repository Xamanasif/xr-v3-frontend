'use client';

import type { AreaId, CourseId } from '@xr/domain';
import {
  ActionGroup,
  Breadcrumbs,
  Button,
  ConfirmDialog,
  CourseCode,
  DecisionPanel,
  DefinitionList,
  DetailLayout,
  Field,
  Hint,
  MissingTag,
  Notice,
  PageHead,
  Select,
  StructureLinks,
  StructureReadOnlyCode,
  SurfaceSection,
} from '@xr/ui/v3';
import { useRef, useState } from 'react';

import { SA_UNAVAILABLE } from '@/copy/sa-shared';
import { stateWords } from '@/copy/state-copy';
import {
  blockedWords,
  COURSE_PAGE,
  courseEyebrow,
  MOVE_DIALOG,
  movedWords,
  moveTitle,
  STRUCTURE_SHARED,
} from '@/copy/structure';
import {
  STRUCTURE_ADDRESS,
  STRUCTURE_TITLE,
  structureAreaAddress,
  structureRecordPlacement,
} from '@/nav/structure';
import { useAcademicStructure, useStructureCourse } from '@/queries/structure';
import {
  checkMove,
  fieldErrorsOf,
  type MoveCheck,
  type StructureFieldErrors,
  useCourseMoveCheck,
} from '@/queries/structure-forms';
import { useCommand } from '@/queries/use-command';

import { SaRecordGuard } from '../shared/sa-record-guard';
import { useShellPage } from '../../shared/workspace-frame/shell-page';
import {
  type FlashWords,
  StructureFlash,
  type StructureFocus,
  useStructureFocus,
  useTodayWords,
} from '../sa-14-structure/structure-parts';
import { EditButtons, RecordHistory, useRecordEdits } from './record-parts';
import {
  blockedWho,
  type CourseView,
  historyLines,
  institutionLinks,
  peopleWords,
  vendorLinks,
} from './structure-view';

/** An area a course can move to (every area but its own, in the structure’s order). */
interface AreaChoice {
  readonly id: AreaId;
  readonly name: string;
}

/**
 * SA-15 Course record, at `/admin/structure/courses/[courseId]` — the owner-approved Super Admin
 * export (V3 Refined B, SA-v1 `sa-views-c.js` `V.course`, `SA.DLG.course`).
 *
 * - **Read**: `AcademicStructureService.getCourse` — the course, its area’s name and what uses it
 *   (counts and named facts, PC-69) — with the structure’s areas (the move’s choices) and the
 *   service’s move check (`previewMoveCourse`, which writes nothing): whether people are filed
 *   against the course. An address that names no course shows the GL-04 “This page isn’t
 *   available” in place (`SaRecordGuard`).
 * - **As the export draws it**: crumbs (Academic structure › the area › the course), the head
 *   (date on phones, “Course · <area>”, the name, the platform code read-only — or “No platform
 *   code yet” — and “Go to changes” under 860 px); the record (Course, What uses this course,
 *   History) beside the panel “Change this course” (`DecisionPanel` with `ActionGroup`s).
 * - **Act**: Rename and Edit description (`record-parts.tsx`) and Move to another area — the move
 *   dialog lists every other area and `moveCourse` moves it with the revision the page showed
 *   when the dialog opened. Blocked while people are filed against it: the panel says so and
 *   offers no move. The rule is the service’s (OD-B7-12): the screen shows its answer.
 * - **Read-only**: the platform course code, the Content Manager’s (M-2). No Module level, no
 *   Retire, no artwork (D3).
 */
export function CourseRecord({ courseId }: { readonly courseId: string }) {
  const read = useStructureCourse(courseId);
  const structure = useAcademicStructure();
  const view = read.data?.ok ? read.data.value : null;
  const refused = read.data !== undefined && !read.data.ok;
  useShellPage(
    refused
      ? { ...structureRecordPlacement(null), title: SA_UNAVAILABLE.documentTitle }
      : structureRecordPlacement(view ? view.course.name : null),
  );

  // The move’s choices: every area but the course’s own, in the structure’s order.
  const others: readonly AreaChoice[] =
    view && structure.data?.ok
      ? structure.data.value
          .filter((group) => group.area.id !== view.course.areaId)
          .map((group) => ({ id: group.area.id, name: group.area.name }))
      : [];
  // The area chosen in the move dialog (kept here so the check follows it).
  const [chosen, setChosen] = useState<AreaId | null>(null);
  const toward = chosen && others.some((area) => area.id === chosen) ? chosen : others[0]?.id;
  const check = useCourseMoveCheck(courseId, view ? (toward ?? null) : null);
  const waiting =
    structure.isPending || (view !== null && toward !== undefined && check.data === undefined);

  return (
    <SaRecordGuard
      read={{
        data: waiting ? undefined : read.data,
        isPending: read.isPending || waiting,
        isError: read.isError || structure.isError || check.isError,
        refetch: () => {
          void read.refetch();
          void structure.refetch();
          void check.refetch();
        },
      }}
      loadingLabel={stateWords('SA-15.loading')}
      failedTitle={stateWords('SA-15.failed')}
    >
      {(course) => (
        <CourseContent
          view={course}
          others={others}
          chosen={chosen}
          onChoose={setChosen}
          check={check.data?.ok ? check.data.value : null}
          refetch={() => {
            void read.refetch();
            void check.refetch();
          }}
        />
      )}
    </SaRecordGuard>
  );
}

/** The open move dialog: the course’s revision when it opened, and its error and notice. */
interface MoveState {
  readonly expectedRev: number;
  readonly error: string | null;
  readonly notice: 'stale' | 'unavailable' | null;
}

const PANEL = 'structure-course-panel';
const PANEL_TITLE = 'structure-course-panel-h';
const MOVE_FIELD = 'structure-move-to';

function CourseContent({
  view,
  others,
  chosen,
  onChoose,
  check,
  refetch,
}: {
  readonly view: CourseView;
  readonly others: readonly AreaChoice[];
  readonly chosen: AreaId | null;
  readonly onChoose: (areaId: AreaId | null) => void;
  readonly check: MoveCheck | null;
  readonly refetch: () => void;
}) {
  const { course, areaName } = view;
  const today = useTodayWords();
  const focus = useStructureFocus();
  const [flash, setFlash] = useState<FlashWords | null>(null);
  const [move, setMove] = useState<MoveState | null>(null);
  // The panel's heading takes focus after a refused move (`tabIndex={-1}`, the export's `co-panel-h`).
  const panelTitleRef = useRef<HTMLHeadingElement>(null);
  const done = (words: FlashWords) => {
    setFlash(words);
    focus.focus('flash');
  };
  const edits = useRecordEdits({
    target: {
      kind: 'course',
      id: course.id,
      name: course.name,
      description: course.description,
      rev: course.rev,
    },
    focus,
    refetch,
    onOpen: () => {
      setMove(null);
      setFlash(null);
    },
    onDone: done,
  });
  const blocked = check?.blocked === true;
  const institutions = institutionLinks(view);
  const vendors = vendorLinks(view);
  const people = peopleWords(view);

  return (
    <>
      <PageHead
        breadcrumbs={
          <Breadcrumbs
            levels={[
              { label: STRUCTURE_TITLE, href: STRUCTURE_ADDRESS },
              { label: areaName, href: structureAreaAddress(course.areaId) },
            ]}
            current={course.name}
          />
        }
        variant="record"
        title={course.name}
        titleId="page-h1"
        titleFocusTarget
        titleRef={focus.titleRef}
        date={today}
        eyebrow={courseEyebrow(areaName)}
        meta={
          course.platformCode ? (
            <>
              <CourseCode code={course.platformCode} />
              <span>{COURSE_PAGE.codeMeta}</span>
            </>
          ) : (
            <>
              <MissingTag icon={null}>{STRUCTURE_SHARED.noCode}</MissingTag>
              <span>{COURSE_PAGE.noCodeMeta}</span>
            </>
          )
        }
        goTo={{ label: COURSE_PAGE.goTo, targetId: PANEL, focusId: PANEL_TITLE }}
      />
      <StructureFlash words={flash} flashRef={focus.flashRef} />
      <DetailLayout
        asideId={PANEL}
        asideLabelledBy={PANEL_TITLE}
        main={
          <>
            <SurfaceSection title={COURSE_PAGE.courseSection} titleId="structure-course-facts">
              <DefinitionList
                items={[
                  { term: COURSE_PAGE.courseKey, value: course.name },
                  {
                    term: COURSE_PAGE.areaKey,
                    value: (
                      <StructureLinks
                        separator={STRUCTURE_SHARED.separator}
                        links={[
                          {
                            key: course.areaId,
                            href: structureAreaAddress(course.areaId),
                            label: areaName,
                          },
                        ]}
                      />
                    ),
                  },
                  {
                    term: COURSE_PAGE.descriptionKey,
                    value: course.description ?? STRUCTURE_SHARED.noDescription,
                  },
                  {
                    term: COURSE_PAGE.codeKey,
                    value: course.platformCode ? (
                      <StructureReadOnlyCode
                        code={course.platformCode}
                        note={COURSE_PAGE.readOnly}
                      />
                    ) : (
                      STRUCTURE_SHARED.noCode
                    ),
                  },
                ]}
              />
            </SurfaceSection>
            <SurfaceSection title={COURSE_PAGE.usesSection} titleId="structure-course-uses">
              <DefinitionList
                items={[
                  {
                    term: COURSE_PAGE.experimentsKey,
                    value:
                      view.usage.publishedExperiments > 0
                        ? String(view.usage.publishedExperiments)
                        : COURSE_PAGE.noExperiments,
                  },
                  {
                    term: COURSE_PAGE.institutionsKey,
                    value:
                      institutions.length > 0 ? (
                        <StructureLinks
                          links={institutions}
                          separator={STRUCTURE_SHARED.separator}
                        />
                      ) : (
                        COURSE_PAGE.none
                      ),
                  },
                  {
                    term: COURSE_PAGE.vendorsKey,
                    value:
                      vendors.length > 0 ? (
                        <StructureLinks links={vendors} separator={STRUCTURE_SHARED.separator} />
                      ) : (
                        COURSE_PAGE.none
                      ),
                  },
                  { term: COURSE_PAGE.peopleKey, value: people || COURSE_PAGE.nobody },
                ]}
              />
            </SurfaceSection>
            <RecordHistory
              titleId="structure-course-history"
              lines={historyLines(
                course.history,
                areaName,
                new Map([
                  ...others.map((area) => [area.id as string, area.name] as const),
                  [course.areaId as string, areaName] as const,
                ]),
              )}
            />
          </>
        }
        aside={
          <DecisionPanel title={COURSE_PAGE.panel} titleId={PANEL_TITLE} titleRef={panelTitleRef}>
            <ActionGroup>
              <EditButtons
                edits={edits}
                rename={COURSE_PAGE.rename}
                editDescription={COURSE_PAGE.editDescription}
              />
            </ActionGroup>
            <ActionGroup label={COURSE_PAGE.moveGroup}>
              {blocked && check ? (
                <Notice tone="off" icon="lock" role="status" title={COURSE_PAGE.blockedTitle}>
                  {blockedWords(blockedWho(view, check))}
                </Notice>
              ) : others.length === 0 ? (
                <Hint>{stateWords('SA-15.no-other-area')}</Hint>
              ) : (
                <>
                  <Hint>{COURSE_PAGE.movable}</Hint>
                  <Button
                    id="structure-move"
                    onClick={() => {
                      setFlash(null);
                      onChoose(null);
                      setMove({ expectedRev: course.rev, error: null, notice: null });
                    }}
                  >
                    {COURSE_PAGE.move}
                  </Button>
                </>
              )}
            </ActionGroup>
            <Hint>{COURSE_PAGE.panelFoot}</Hint>
          </DecisionPanel>
        }
      />
      {edits.dialogs}
      <MoveDialog
        view={view}
        others={others}
        chosen={chosen}
        onChoose={onChoose}
        state={move}
        setState={setMove}
        focus={focus}
        refetch={refetch}
        onMoved={(areaName) => {
          setMove(null);
          onChoose(null);
          done({ title: movedWords(areaName) });
        }}
        onClose={() => {
          setMove(null);
          onChoose(null);
        }}
      />
    </>
  );
}

/**
 * The move dialog (the export’s `SA.DLG.course` move; B7-07 `doMove`): every other area to choose
 * from; “Choose the area to move it to” before anything is sent; a record changed meanwhile keeps
 * the dialog and the choice (state-copy `SA-15.stale.*`); a move refused because someone was filed
 * meanwhile closes it, reads the record again and the panel shows the blocked notice.
 */
function MoveDialog({
  view,
  others,
  chosen,
  onChoose,
  state,
  setState,
  focus,
  refetch,
  onMoved,
  onClose,
}: {
  readonly view: CourseView;
  readonly others: readonly AreaChoice[];
  readonly chosen: AreaId | null;
  readonly onChoose: (areaId: AreaId | null) => void;
  readonly state: MoveState | null;
  readonly setState: (update: (current: MoveState | null) => MoveState | null) => void;
  readonly focus: StructureFocus;
  readonly refetch: () => void;
  readonly onMoved: (areaName: string) => void;
  readonly onClose: () => void;
}) {
  const { course } = view;
  const moveCmd = useCommand((ports) => ports.academicStructure.moveCourse);

  const failed = (fields: StructureFieldErrors) => {
    setState((current) => (current ? { ...current, error: fields['toAreaId'] ?? null } : current));
    focus.focus(MOVE_FIELD);
  };

  const doMove = () => {
    if (!state || moveCmd.busy) return;
    const input = {
      courseId: course.id as CourseId,
      toAreaId: chosen,
      expectedRev: state.expectedRev,
    };
    const checked = checkMove(input);
    if (checked) {
      failed(checked);
      return;
    }
    setState((current) => (current ? { ...current, error: null, notice: null } : current));
    const toAreaId = chosen!;
    moveCmd.run({ ...input, toAreaId }).then(
      (answer) => {
        if (answer.ok) {
          onMoved(others.find((area) => area.id === toAreaId)?.name ?? '');
          return;
        }
        const error = answer.error;
        if (error.kind === 'validation-failed') {
          failed(fieldErrorsOf(error));
          return;
        }
        if (error.kind === 'stale-version') {
          // The choice stays; the record is read again and the next press sends with its
          // current revision (state-copy `SA-15.stale.*`).
          setState((current) =>
            current ? { ...current, expectedRev: error.currentRev, notice: 'stale' } : current,
          );
          refetch();
          return;
        }
        // Someone was filed meanwhile (or the record moved on): read again; the panel says why.
        onClose();
        refetch();
        focus.focus(PANEL_TITLE);
      },
      () => setState((current) => (current ? { ...current, notice: 'unavailable' } : current)),
    );
  };

  return (
    <ConfirmDialog
      initialFocus="field"
      submitOnEnter
      open={state !== null}
      idPrefix="structure-move"
      title={moveTitle(course.name)}
      description={MOVE_DIALOG.description}
      confirmLabel={MOVE_DIALOG.confirm}
      cancelLabel={STRUCTURE_SHARED.cancel}
      busy={moveCmd.busy}
      busyLabel={MOVE_DIALOG.busy}
      returnFocusFallback={focus.titleRef}
      onConfirm={doMove}
      onCancel={onClose}
    >
      {state !== null ? (
        <>
          {state?.notice === 'stale' ? (
            <Notice
              tone="warn"
              icon="alertCircle"
              role="alert"
              title={stateWords('SA-15.stale.course')}
            >
              {stateWords('SA-15.stale.line')}
            </Notice>
          ) : state?.notice === 'unavailable' ? (
            <Notice
              tone="warn"
              icon="alertCircle"
              role="alert"
              title={stateWords('SA-15.move-unavailable')}
            />
          ) : null}
          <Field id={MOVE_FIELD} label={MOVE_DIALOG.label} error={state?.error ?? undefined}>
            <Select
              value={chosen ?? ''}
              options={[
                { value: '', label: MOVE_DIALOG.chooseArea },
                ...others.map((area) => ({ value: area.id, label: area.name })),
              ]}
              onChange={(event) => {
                const value = event.target.value;
                onChoose(value === '' ? null : (value as AreaId));
                setState((current) => (current ? { ...current, error: null } : current));
              }}
            />
          </Field>
        </>
      ) : null}
    </ConfirmDialog>
  );
}
