'use client';

import type { AreaId, CourseId } from '@xr/domain';
import {
  Button,
  ChoiceCard,
  ChoiceList,
  Icon,
  Notice,
  PageContent,
  RadioGroup,
  Section,
  SectionBody,
} from '@xr/ui';
import { useRef, useState } from 'react';

import { stateWords } from '@/copy/state-copy';
import {
  blockedWords,
  courseOverline,
  MOVE_PANEL,
  movedWords,
  moveTitle,
  movesWithItWords,
  RECORD_PAGE,
  STRUCTURE_PAGE,
} from '@/copy/structure';
import { structureRecordPlacement } from '@/nav/structure';
import { useAcademicStructure, useStructureCourse } from '@/queries/structure';
import {
  checkMove,
  fieldErrorsOf,
  type MoveCheck,
  type StructureFieldErrors,
  useCourseMoveCheck,
} from '@/queries/structure-forms';
import { useCommand } from '@/queries/use-command';

import { RecordGuard } from '../../shared/record-guard/record-guard';
import { useShellPage } from '../../shared/workspace-frame/shell-page';
import {
  EditButtons,
  Flash,
  RecordHeader,
  RecordHistory,
  type RecordFocus,
  useRecordEdits,
  useRecordFocus,
} from './record-parts';
import { type CourseView, facultyWords, historyLines, usesRows } from './structure-view';

/** An area a course can move to (every area but its own, in the structure’s order). */
interface AreaChoice {
  readonly id: AreaId;
  readonly name: string;
}

/**
 * SA-15 Course record — boards B7-07 f1 (1440), f2 (375), f3 (move blocked), f4 (move allowed),
 * f6 (rename validation), f8 (no platform code) and B7-10 f9, at
 * `/admin/structure/courses/[courseId]`.
 *
 * - **Read**: `AcademicStructureService.getCourse` — the course, its area’s name and what uses it
 *   (counts and named facts, PC-69) — with the structure’s areas (the move’s choices) and the
 *   service’s move check (`previewMoveCourse`, which writes nothing): whether people are filed
 *   against the course and what moves with it. An address that names no course shows the in-shell
 *   not-found page.
 * - **Act**: Rename and Edit description (DL-3 small edits, `record-parts.tsx`) and Move to
 *   another area — the inline panel: blocked, it says who is filed and offers Close only;
 *   otherwise it lists every other area and what moves with it, and `moveCourse` moves it with the
 *   revision the page showed when the panel opened. The rule is the service’s (OD-B7-12): the
 *   screen shows its answer and never decides it.
 * - **Read-only**: the platform course code, “maintained by the Content Manager” (M-2). No Module
 *   level, no Retire, no artwork (D3). The canvas “Sample” label is not shown (T-36).
 */
export function CourseRecord({ courseId }: { readonly courseId: string }) {
  const read = useStructureCourse(courseId);
  const structure = useAcademicStructure();
  const view = read.data?.ok ? read.data.value : null;
  useShellPage(structureRecordPlacement(view ? view.course.name : null));

  // The move’s choices: every area but the course’s own, in the structure’s order.
  const others: readonly AreaChoice[] =
    view && structure.data?.ok
      ? structure.data.value
          .filter((group) => group.area.id !== view.course.areaId)
          .map((group) => ({ id: group.area.id, name: group.area.name }))
      : [];
  // The area the Super Admin chose in the move panel (kept here so the check follows it).
  const [chosen, setChosen] = useState<AreaId | null>(null);
  const toward = chosen && others.some((area) => area.id === chosen) ? chosen : others[0]?.id;
  const check = useCourseMoveCheck(courseId, view ? (toward ?? null) : null);
  const waiting =
    structure.isPending || (view !== null && toward !== undefined && check.data === undefined);

  return (
    <PageContent wrap="read">
      <RecordGuard
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
        failed={{ title: stateWords('SA-15.failed'), line: stateWords('SA-15.failed.line') }}
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
      </RecordGuard>
    </PageContent>
  );
}

/** The open move panel: the course’s revision when it opened, and its errors and notice. */
interface MoveState {
  readonly expectedRev: number;
  readonly error: string | null;
  readonly notice: 'stale' | 'unavailable' | null;
}

const MOVE_BUTTON = 'structure-move';

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
  const focus = useRecordFocus();
  const [flash, setFlash] = useState<string | null>(null);
  const [move, setMove] = useState<MoveState | null>(null);
  const done = (words: string, then: 'title' | 'flash') => {
    setFlash(words);
    focus.focus(then);
  };
  const edits = useRecordEdits({
    target: {
      kind: 'course',
      id: course.id,
      name: course.name,
      description: course.description,
      rev: course.rev,
      platformCode: course.platformCode,
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

  return (
    <>
      <RecordHeader
        overline={courseOverline(areaName)}
        name={course.name}
        titleRef={focus.titleRef}
      >
        <EditButtons edits={edits} />
        <Button
          variant="secondary"
          id={MOVE_BUTTON}
          onClick={() => {
            setFlash(null);
            onChoose(null);
            setMove({ expectedRev: course.rev, error: null, notice: null });
            focus.focus('structure-move-title');
          }}
        >
          {RECORD_PAGE.move}
        </Button>
      </RecordHeader>
      <Flash words={flash} flashRef={focus.flashRef} />
      {move ? (
        <MovePanel
          view={view}
          others={others}
          chosen={chosen}
          onChoose={onChoose}
          check={check}
          state={move}
          setState={setMove}
          focus={focus}
          refetch={refetch}
          onMoved={(words) => {
            setMove(null);
            onChoose(null);
            done(words, 'flash');
          }}
          onClose={() => {
            setMove(null);
            onChoose(null);
            focus.focus(MOVE_BUTTON);
          }}
        />
      ) : null}
      <div className="flex flex-col gap-5">
        <Section title={RECORD_PAGE.courseSection}>
          <SectionBody>
            <dl className="xl-kv xv-kv">
              <dt>{RECORD_PAGE.areaKey}</dt>
              <dd>{areaName}</dd>
              <dt>{RECORD_PAGE.descriptionKey}</dt>
              <dd>{course.description ?? STRUCTURE_PAGE.noDescription}</dd>
              <dt>{RECORD_PAGE.codeKey}</dt>
              <dd>
                {course.platformCode ? (
                  <span className="xr-id">{course.platformCode}</span>
                ) : (
                  STRUCTURE_PAGE.noCode
                )}{' '}
                <span className="xr-meta block">
                  <Icon name="readOnly" size={16} /> {RECORD_PAGE.codeReadOnly}
                </span>
              </dd>
            </dl>
          </SectionBody>
        </Section>
        <Section title={RECORD_PAGE.usesSection}>
          <SectionBody>
            <dl className="xl-kv xv-kv">
              {usesRows(view).map((row) => (
                <UseRow key={row.key} name={row.key} value={row.value} />
              ))}
            </dl>
            {blocked ? <p className="xl-meta mt-3 mb-0">{RECORD_PAGE.cantMove}</p> : null}
          </SectionBody>
        </Section>
        <RecordHistory
          lines={historyLines(
            course.history,
            areaName,
            new Map([
              ...others.map((area) => [area.id as string, area.name] as const),
              [course.areaId as string, areaName] as const,
            ]),
          )}
        />
      </div>
      {edits.dialogs}
    </>
  );
}

function UseRow({ name, value }: { readonly name: string; readonly value: string }) {
  return (
    <>
      <dt>{name}</dt>
      <dd>{value}</dd>
    </>
  );
}

/**
 * The inline move panel (B7-07 f3, f4; B7-10 f9; script `openMove`, `doMove`): the service’s move
 * check decides what it shows. Focus goes to its title when it opens and back to “Move to another
 * area” on Close or Cancel.
 */
function MovePanel({
  view,
  others,
  chosen,
  onChoose,
  check,
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
  readonly check: MoveCheck | null;
  readonly state: MoveState;
  readonly setState: (update: (current: MoveState | null) => MoveState | null) => void;
  readonly focus: RecordFocus;
  readonly refetch: () => void;
  readonly onMoved: (words: string) => void;
  readonly onClose: () => void;
}) {
  const { course, areaName } = view;
  const moveCmd = useCommand((ports) => ports.academicStructure.moveCourse);
  const firstChoice = useRef<HTMLInputElement>(null);
  const blocked = check?.blocked === true;

  const failed = (fields: StructureFieldErrors) => {
    setState((current) => (current ? { ...current, error: fields['toAreaId'] ?? null } : current));
    firstChoice.current?.focus();
  };

  const doMove = () => {
    if (moveCmd.busy) return;
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
          onMoved(movedWords(course.name, others.find((area) => area.id === toAreaId)?.name ?? ''));
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
        // Someone was filed meanwhile (or the record moved on): read again; the check says why.
        refetch();
        focus.focus('structure-move-title');
      },
      () => setState((current) => (current ? { ...current, notice: 'unavailable' } : current)),
    );
  };

  return (
    <div className="xw-inline-panel mb-4">
      <h2 className="xr-h3 [margin:0_0_12px]" id="structure-move-title" tabIndex={-1}>
        {moveTitle(course.name)}
      </h2>
      {state.notice === 'stale' ? (
        <Notice tone="warn" role="alert" title={stateWords('SA-15.stale.course')}>
          {stateWords('SA-15.stale.line')}
        </Notice>
      ) : state.notice === 'unavailable' ? (
        <Notice tone="err" role="alert">
          {stateWords('SA-15.move-unavailable')}
        </Notice>
      ) : null}
      {blocked && check ? (
        <>
          <Notice tone="err" role="status" title={MOVE_PANEL.blockedTitle}>
            {blockedWords(
              check.blockers.students,
              facultyWords(view, check.blockers.faculty),
              areaName,
            )}
          </Notice>
          <div className="xw-actions mt-3">
            <Button variant="secondary" onClick={onClose}>
              {MOVE_PANEL.close}
            </Button>
          </div>
        </>
      ) : others.length === 0 ? (
        <>
          <p className="xr-body m-0">{stateWords('SA-15.no-other-area')}</p>
          <div className="xw-actions mt-3">
            <Button variant="secondary" onClick={onClose}>
              {MOVE_PANEL.cancel}
            </Button>
          </div>
        </>
      ) : (
        <>
          <RadioGroup
            id="structure-move-to"
            legend={MOVE_PANEL.legend}
            legendClass="xr-label"
            value={chosen}
            onValueChange={(value) => {
              onChoose(value as AreaId);
              setState((current) => (current ? { ...current, error: null } : current));
            }}
            error={state.error ?? undefined}
          >
            <ChoiceList>
              {others.map((area, index) => (
                <ChoiceCard
                  key={area.id}
                  ref={index === 0 ? firstChoice : undefined}
                  id={`structure-move-${area.id}`}
                  value={area.id}
                  title={area.name}
                />
              ))}
            </ChoiceList>
          </RadioGroup>
          {check ? (
            <p className="xl-meta [margin:12px_0_0]">
              {movesWithItWords(
                check.movesWithIt.publishedExperiments,
                check.movesWithIt.institutionsWithAccess.length,
                check.movesWithIt.vendorsInScope,
              )}
            </p>
          ) : null}
          <div className="xw-actions mt-3">
            <Button variant="secondary" onClick={onClose}>
              {MOVE_PANEL.cancel}
            </Button>
            <Button
              variant="primary"
              busy={moveCmd.busy}
              busyLabel={MOVE_PANEL.busy}
              onClick={doMove}
            >
              {MOVE_PANEL.confirm}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
