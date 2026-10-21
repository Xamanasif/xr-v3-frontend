'use client';

import type { ServiceError, StudentRecordView } from '@xr/contracts/draft';
import {
  Breadcrumbs,
  Button,
  ButtonLink,
  ConfirmDialog,
  CourseCode,
  Field,
  IaBlock,
  IaFormatBadges,
  IaGrantHow,
  IaListTable,
  IaRecordGrid,
  IaSectionBody,
  IaSectionFoot,
  IaSectionHead,
  IaStatusNotes,
  IaSummary,
  IaWrapLink,
  IaCellLine,
  IaCellText,
  ListState,
  Notice,
  PageHead,
  RecordLine,
  StatusPill,
  Surface,
  Textarea,
  TextLink,
  Timeline,
  V46Island,
} from '@xr/ui/v3';
import { type ReactNode, useEffect, useRef, useState } from 'react';

import { dayMonthYear } from '@/copy/dates';
import {
  aboutLabel,
  alsoInGroupWords,
  deactivateBody,
  deactivateTitle,
  experimentsCaption,
  IA07,
  inactiveSinceLine,
  inactiveUntilLine,
  noExperimentsTitle,
  reactivateAccountLine,
  reactivateBody,
  reactivateTitle,
  studentEyebrow,
} from '@/copy/ia-access';
import { formatsFromPlanLabel, IA_PAUSED_READ_ONLY, viaGroupLabel } from '@/copy/ia-shared';
import { courseLine, PEOPLE_PAGE } from '@/copy/institute-people';
import { stateWords } from '@/copy/state-copy';
import {
  giveAccessAddress,
  groupAddress,
  INSTITUTE_HELP_ADDRESS,
  PEOPLE_ADDRESS,
  STUDENT_ACCESS_ADDRESS,
  underPlacement,
} from '@/nav/institute';
import { useStudentRecord } from '@/queries/people';
import { useInstituteStanding } from '@/queries/student-access';
import { useCommand } from '@/queries/use-command';

import { RecordGuard } from '../../shared/record-guard/record-guard';
import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { formatCodes } from '../shared/format-codes';
import { useInstitutionPaused } from '../shared/paused';
import { actorName, addedLine, type GrantLine, grantLines, historyLines } from './record-view';

const TITLE_ID = 'ia-h1';
const REASON_ID = 'ia-dlg-f';
const DEACTIVATE_ID = 'sr-deact';
const REACTIVATE_ID = 'sr-react';
const FLASH_ID = 'ia-flash';

/**
 * IA-07 Student record — the owner-approved V3 design (design/v3-refined-b/roles/IA-v1,
 * `Main.dc.html` `R.rIA07`, `vm07`), at `/institute/people/students/[studentId]`.
 *
 * - **Read**: `PeopleService.getStudent` — the student, their groups, the courses they are filed
 *   against and each grant that reaches them as IA-04 reads it — with the institution's standing
 *   (`getMyOverview`: the plan's end and the pause, which a grant's note names, and whether access
 *   can be given). An address naming no student of the admin's institution — unknown or another
 *   institution's — shows the in-shell not-found page.
 * - **Layout**: the head (student ID, name, status and e-mail once; Give this student access or
 *   Reactivate account), "Experiments given" (experiment with course code and formats · how given ·
 *   status with its reason), the About and Account summary beside it, History below. Each grant
 *   keeps its own word; the record makes no can / can't-open statement (OD-B2-01). No grant is named
 *   by its id.
 * - **Act**: "Deactivate account…" (DL-2, a required reason) and "Reactivate account" (DL-1) are
 *   `deactivateStudent` / `reactivateStudent`, sent with the revision the page showed when the
 *   dialog opened. The reason's error is the service's words; a refusal because the record moved on
 *   writes nothing, closes the dialog, reads the record again and puts focus on the title; a
 *   failure for now keeps the dialog and its reason. After deactivating, focus goes to "Reactivate
 *   account" (and back).
 * - **Paused institution**: read-only — no write is offered and the read-only notice shows.
 */
export function StudentRecord({ studentId }: { readonly studentId: string }) {
  const read = useStudentRecord(studentId);
  useShellPage(
    underPlacement('IA-07', read.data?.ok ? read.data.value.student.fullName : null, [
      { label: PEOPLE_PAGE.tabs.students, href: PEOPLE_ADDRESS },
    ]),
  );
  const guard = (
    <RecordGuard
      read={read}
      loadingLabel={stateWords('IA-07.loading')}
      failed={{
        title: stateWords('IA-07.failed'),
        line: stateWords('IA-07.failed.line'),
        reportHref: `${INSTITUTE_HELP_ADDRESS}/report`,
      }}
    >
      {(record) => <RecordContent record={record} refetch={() => void read.refetch()} />}
    </RecordGuard>
  );
  // The application's existing loading and failed states keep their look (IA-v1 draws none for
  // the record page).
  return read.data?.ok ? guard : <V46Island>{guard}</V46Island>;
}

/** An open dialog, with the record's revision as the page showed it when it opened. */
type Dialog =
  | { readonly kind: 'deactivate'; readonly reason: string; readonly expectedRev: number }
  | { readonly kind: 'reactivate'; readonly expectedRev: number };

function RecordContent({
  record,
  refetch,
}: {
  readonly record: StudentRecordView;
  readonly refetch: () => void;
}) {
  const { student } = record;
  const standing = useInstituteStanding();
  const overview = standing.data?.ok ? standing.data.value : null;
  const sessionPaused = useInstitutionPaused();
  const [refusedPaused, setRefusedPaused] = useState(false);
  const paused = sessionPaused || refusedPaused;
  const inactive = student.accountStatus === 'inactive';
  const noPlan = overview !== null && overview.plan === null;
  const ended = overview?.status === 'access-ended';
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [focusRequest, setFocusRequest] = useState<{
    readonly id: string;
    readonly n: number;
    /** The record's revision when asked: a target that waits for the next revision (after a command). */
    readonly rev: number;
    readonly afterChange: boolean;
  }>({ id: '', n: 0, rev: student.rev, afterChange: false });
  const handled = useRef(0);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const deactivate = useCommand((ports) => ports.people.deactivateStudent);
  const reactivate = useCommand((ports) => ports.people.reactivateStudent);

  // Focus moves after the commit that shows its target: the reason after its error, "Reactivate
  // account" after deactivating and "Deactivate account…" after reactivating — once the record read
  // again shows them — the title after a refusal that re-reads the record (and wherever a target is
  // gone). The dialog has given focus back to its trigger in the same commit, so this request wins.
  useEffect(() => {
    if (focusRequest.n === handled.current) return;
    const element = focusRequest.id === 'title' ? null : document.getElementById(focusRequest.id);
    const waiting = focusRequest.afterChange && student.rev === focusRequest.rev;
    if (!element && waiting) return;
    handled.current = focusRequest.n;
    (element ?? titleRef.current)?.focus();
  }, [focusRequest, student.rev]);
  const focus = (id: string, afterChange = false) =>
    setFocusRequest((current) => ({ id, n: current.n + 1, rev: student.rev, afterChange }));

  const close = () => {
    setDialog(null);
    setReasonError(null);
  };

  /** A refusal other than the reason's: nothing was written; read again (state-copy `IA-07.moved-on`). */
  const refused = (error: ServiceError) => {
    close();
    if (error.kind === 'refused' && error.code === 'institution-paused') setRefusedPaused(true);
    refetch();
    focus('title');
  };

  const confirm = () => {
    if (!dialog) return;
    if (dialog.kind === 'deactivate') {
      deactivate
        .run({ id: student.id, reason: dialog.reason, expectedRev: dialog.expectedRev })
        .then(
          (answer) => {
            if (answer.ok) {
              close();
              setFlash(IA07.deactivatedFlash);
              focus(REACTIVATE_ID, true);
            } else if (answer.error.kind === 'validation-failed') {
              const reason = answer.error.fieldErrors.find((error) => error.field === 'reason');
              setReasonError(reason?.message ?? null);
              focus(REASON_ID);
            } else refused(answer.error);
          },
          // Failed for now: the dialog and the reason stay (state-copy `IA-07.unavailable`).
          () => undefined,
        );
      return;
    }
    reactivate.run({ id: student.id, expectedRev: dialog.expectedRev }).then(
      (answer) => {
        if (answer.ok) {
          close();
          setFlash(IA07.reactivatedFlash);
          focus(DEACTIVATE_ID, true);
        } else refused(answer.error);
      },
      () => undefined,
    );
  };

  const open = (next: Dialog) => {
    setDialog(next);
    setReasonError(null);
    setFlash(null);
  };

  const lines = grantLines(record, {
    endsOn: overview?.plan?.endsOn ?? null,
    pausedSince: overview?.institution.pause?.since ?? null,
  });
  const history = historyLines(record);
  const deactivation = student.deactivation;
  const canGive = !paused && !inactive && !noPlan && !ended;
  const giveHref = giveAccessAddress({ student: student.id });
  const noRowsLine = canGive
    ? IA07.noExperimentsCanGive
    : noPlan
      ? IA07.noExperimentsNoPlan
      : inactive
        ? IA07.noExperimentsInactive
        : paused
          ? IA07.noExperimentsPaused
          : IA07.noExperimentsEnded;

  const actions = paused ? null : inactive ? (
    <Button
      variant="primary"
      size="lg"
      id={REACTIVATE_ID}
      onClick={() => open({ kind: 'reactivate', expectedRev: student.rev })}
    >
      {IA07.reactivate}
    </Button>
  ) : canGive ? (
    <ButtonLink variant="primary" size="lg" href={giveHref}>
      {IA07.give}
    </ButtonLink>
  ) : null;

  return (
    <>
      <PageHead
        breadcrumbs={
          <Breadcrumbs
            levels={[{ label: IA07.crumb, href: PEOPLE_ADDRESS }]}
            current={student.fullName}
          />
        }
        variant="record"
        eyebrow={studentEyebrow(student.institutionStudentId)}
        title={student.fullName}
        titleId={TITLE_ID}
        titleRef={titleRef}
        titleFocusTarget
        meta={
          <>
            {inactive ? (
              <StatusPill tone="ended">{IA07.inactive}</StatusPill>
            ) : (
              <StatusPill tone="ok">{IA07.accountActive}</StatusPill>
            )}
            <span>{student.institutionEmail}</span>
          </>
        }
        actions={actions}
      />
      {paused ? (
        <Notice tone="paused" icon="lock" role="status" title={IA_PAUSED_READ_ONLY}>
          {IA07.pausedLine}
        </Notice>
      ) : null}
      {flash ? (
        <Notice tone="ok" id={FLASH_ID} role="status" title={IA07.flashTitle}>
          {flash}
        </Notice>
      ) : null}
      {inactive ? (
        <Notice tone="off" role="status" title={IA07.inactiveTitle}>
          {deactivation
            ? inactiveSinceLine(
                dayMonthYear(deactivation.at),
                actorName(deactivation.by) ?? '',
                deactivation.reason,
                student.fullName,
              )
            : inactiveUntilLine(student.fullName)}
        </Notice>
      ) : null}
      <IaRecordGrid
        main={
          <Surface labelledBy="sr-exp-h">
            <IaSectionHead
              title={IA07.experiments}
              titleId="sr-exp-h"
              aside={
                lines.length > 0 ? (
                  <TextLink href={STUDENT_ACCESS_ADDRESS}>{IA07.openStudentAccess}</TextLink>
                ) : null
              }
            />
            {lines.length > 0 ? (
              <>
                <GrantTable name={student.fullName} lines={lines} />
                <IaSectionFoot>{IA07.foot}</IaSectionFoot>
              </>
            ) : (
              <ListState
                kind="none"
                titleAs="h3"
                title={noExperimentsTitle(student.fullName)}
                action={canGive ? <ButtonLink href={giveHref}>{IA07.give}</ButtonLink> : null}
              >
                {noRowsLine}
              </ListState>
            )}
          </Surface>
        }
        side={
          <Surface label={aboutLabel(student.fullName)}>
            <IaSectionBody title={IA07.about}>
              <IaSummary
                items={[
                  { key: 'course', term: IA07.keys.course, children: courseValue(record) },
                  {
                    key: 'group',
                    term: record.groups.length > 1 ? IA07.keys.groups : IA07.keys.group,
                    children:
                      record.groups.length > 0
                        ? record.groups.map((group) => (
                            <IaBlock key={group.id}>
                              <IaWrapLink href={groupAddress(group.id)}>{group.name}</IaWrapLink>
                            </IaBlock>
                          ))
                        : IA07.notInGroup,
                  },
                  {
                    key: 'programme',
                    term: IA07.keys.programme,
                    children: student.programme || IA07.notRecorded,
                  },
                  { key: 'added', term: IA07.keys.added, children: addedLine(record) },
                ]}
              />
            </IaSectionBody>
            <IaSectionBody title={IA07.account}>
              <RecordLine>
                {inactive ? reactivateAccountLine(student.fullName) : IA07.accountLine}
              </RecordLine>
              {!inactive && !paused ? (
                <p>
                  <Button
                    id={DEACTIVATE_ID}
                    onClick={() =>
                      open({ kind: 'deactivate', reason: '', expectedRev: student.rev })
                    }
                  >
                    {IA07.deactivate}
                  </Button>
                </p>
              ) : null}
            </IaSectionBody>
          </Surface>
        }
        more={
          <Surface labelledBy="sr-hist-h">
            <IaSectionBody title={IA07.history} titleId="sr-hist-h" size="section">
              <Timeline
                events={history.map((line) => ({
                  what: line.what,
                  when: line.when,
                  ...(line.note ? { note: line.note } : {}),
                }))}
              />
            </IaSectionBody>
          </Surface>
        }
      />
      <ConfirmDialog
        open={dialog?.kind === 'deactivate'}
        destructive
        initialFocus="field"
        returnFocusFallback={titleRef}
        idPrefix="student-deactivate-dialog"
        title={deactivateTitle(student.fullName)}
        description={deactivateBody(student.fullName)}
        confirmLabel={IA07.deactivateConfirm}
        cancelLabel={IA07.cancel}
        busyLook
        busy={deactivate.busy}
        busyLabel={IA07.deactivateBusy}
        onConfirm={confirm}
        onCancel={close}
      >
        <Field
          id={REASON_ID}
          label={IA07.reasonLabel}
          hint={IA07.deactivateHint}
          error={reasonError ?? undefined}
        >
          <Textarea
            value={dialog?.kind === 'deactivate' ? dialog.reason : ''}
            onChange={(event) => {
              const reason = event.target.value;
              setDialog((current) =>
                current?.kind === 'deactivate' ? { ...current, reason } : current,
              );
              setReasonError(null);
            }}
          />
        </Field>
      </ConfirmDialog>
      <ConfirmDialog
        open={dialog?.kind === 'reactivate'}
        initialFocus="confirm"
        returnFocusFallback={titleRef}
        idPrefix="student-reactivate-dialog"
        title={reactivateTitle(student.fullName)}
        description={reactivateBody(student.fullName, ended)}
        confirmLabel={IA07.reactivate}
        cancelLabel={IA07.cancel}
        busyLook
        busy={reactivate.busy}
        busyLabel={IA07.reactivateBusy}
        onConfirm={confirm}
        onCancel={close}
      />
    </>
  );
}

/** The student's course(s): "ME ZG523 · Thermodynamics & Heat Transfer", one per line. */
function courseValue(record: StudentRecordView): ReactNode {
  if (record.courses.length === 0) return IA07.notRecorded;
  if (record.courses.length === 1) {
    const [course] = record.courses;
    return courseLine(course!.platformCode, course!.name);
  }
  return record.courses.map((course) => (
    <IaBlock key={course.id}>{courseLine(course.platformCode, course.name)}</IaBlock>
  ));
}

/** "Experiments given" (`table.ia-lt.ia-lt--sr`): Experiment · How given · Status. */
function GrantTable({
  name,
  lines,
}: {
  readonly name: string;
  readonly lines: readonly GrantLine[];
}) {
  return (
    <IaListTable
      variant="sr"
      caption={experimentsCaption(name)}
      columns={[
        { key: 'experiment', header: IA07.columns.experiment },
        { key: 'how', header: IA07.columns.howGiven },
        { key: 'status', header: IA07.columns.status },
      ]}
      rows={lines.map((line) => {
        const codes = formatCodes(line.formats);
        return {
          key: line.key,
          muted: line.muted,
          cells: [
            {
              key: 'experiment',
              role: 'main',
              className: 'ia-sr-exp',
              children: (
                <>
                  <IaCellText kind="title">{line.experimentName}</IaCellText>
                  <IaCellLine gap>
                    {line.courseCode ? <CourseCode code={line.courseCode} /> : null}
                    <IaFormatBadges formats={codes} label={formatsFromPlanLabel(codes)} />
                  </IaCellLine>
                </>
              ),
            },
            {
              key: 'how',
              className: 'ia-sr-how',
              children: (
                <IaGrantHow
                  how={
                    line.group
                      ? {
                          kind: 'group',
                          words: viaGroupLabel(line.group.name),
                          href: groupAddress(line.group.id),
                        }
                      : { kind: 'individual', words: IA07.individually }
                  }
                  date={line.date}
                  also={
                    line.also
                      ? alsoInGroupWords(line.also.groupName, line.also.notChanged)
                      : undefined
                  }
                />
              ),
            },
            {
              key: 'status',
              role: 'pri',
              className: 'ia-sr-st',
              children: (
                <IaStatusNotes
                  status={<StatusPill tone={line.status.tone}>{line.status.words}</StatusPill>}
                  notes={line.status.notes}
                />
              ),
            },
          ],
        };
      })}
    />
  );
}
