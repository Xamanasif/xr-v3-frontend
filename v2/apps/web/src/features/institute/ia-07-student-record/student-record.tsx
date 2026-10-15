'use client';

import type { ServiceError, StudentRecordView } from '@xr/contracts/draft';
import {
  BackLink,
  Button,
  ConfirmDialog,
  EmptyState,
  Field,
  FormatSet,
  Icon,
  Link,
  Notice,
  PageContent,
  PageHeader,
  ReasonDialog,
  Section,
  SectionBody,
  StatusPill,
  Textarea,
  Timeline,
} from '@xr/ui';
import { type ReactNode, useEffect, useRef, useState } from 'react';

import { dayMonthYear } from '@/copy/dates';
import {
  ALSO_NOT_CHANGED,
  alsoInWords,
  courseLine,
  deactivateBody,
  deactivateTitle,
  fromPlanWords,
  givenIndividuallyWords,
  givenThroughGroupWords,
  inactiveSinceWords,
  inactiveUntilLine,
  noExperimentsTitle,
  PEOPLE_PAGE,
  reactivateBody,
  reactivateTitle,
  RECORD_OVERLINE,
  RECORD_PAGE,
  STUDENTS_TAB,
} from '@/copy/institute-people';
import { stateWords } from '@/copy/state-copy';
import {
  giveAccessAddress,
  INSTITUTE_HELP_ADDRESS,
  PEOPLE_ADDRESS,
  STUDENT_ACCESS_ADDRESS,
  underPlacement,
} from '@/nav/institute';
import { useStudentRecord } from '@/queries/people';
import { useCommand } from '@/queries/use-command';

import { RecordGuard } from '../../shared/record-guard/record-guard';
import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { PausedNotice, useInstitutionPaused } from '../ia-06-people/paused';
import { formatCodes } from '../ia-06-people/students';
import { actorName, addedWords, type GrantLine, grantLines, historyLines } from './record-view';

const REASON_ID = 'student-reason';
const DEACTIVATE_ID = 'student-deactivate';
const REACTIVATE_ID = 'student-reactivate';

/**
 * IA-07 Student record — board B2-06 f8 … f13 and f17 ("Who is this student, and what can they
 * open?"), at `/institute/people/students/[studentId]`.
 *
 * - **Read**: `PeopleService.getStudent` — the student, their groups, the courses they are filed
 *   against and each grant that reaches them as IA-04 reads it. An address naming no student of the
 *   admin's institution — unknown or another institution's — shows the in-shell not-found page.
 * - **Sections as drawn**: Experiments given (Experiment and course code · Formats "From access plan
 *   ACC-0107" · How given · Status with its reason in words; "Open Student access"), Courses and
 *   groups (group names are not links: IA-14 is not built), Details, History, Account. Each grant
 *   keeps its own word; the record makes no can / can't-open statement (OD-B2-01). Licences are
 *   never counted: "Waiting for a licence" is a supplied wait (D7).
 * - **Act**: "Give this student access" opens IA-05 with the student chosen. "Deactivate account…"
 *   (DL-2, a required reason shown to the institution's administrators) and "Reactivate account"
 *   (DL-1) are `deactivateStudent` / `reactivateStudent`, sent with the revision the page showed
 *   when the dialog opened. The reason's error is the service's drawn words; a refusal because the
 *   record moved on writes nothing, closes the dialog, reads the record again and puts focus on the
 *   title; a failure for now keeps the dialog and its reason. After deactivating, focus goes to
 *   "Reactivate account" (and back), as B2-06's script does.
 * - **Paused institution**: read-only — no write is offered and the paused notice shows.
 */
export function StudentRecord({ studentId }: { readonly studentId: string }) {
  const read = useStudentRecord(studentId);
  useShellPage(
    underPlacement('IA-07', read.data?.ok ? read.data.value.student.fullName : null, [
      { label: PEOPLE_PAGE.tabs.students, href: PEOPLE_ADDRESS },
    ]),
  );
  return (
    <PageContent wrap="read">
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
    </PageContent>
  );
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
  const sessionPaused = useInstitutionPaused();
  const [refusedPaused, setRefusedPaused] = useState(false);
  const paused = sessionPaused || refusedPaused;
  const inactive = student.accountStatus === 'inactive';
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

  // Focus moves after the commit that shows its target (B2-06 `focus(id)`): the reason after its
  // error, "Reactivate account" after deactivating and "Deactivate account…" after reactivating —
  // once the record read again shows them — the title after a refusal that re-reads the record
  // (and wherever a target is gone). The dialog has given focus back to its trigger in the same
  // commit, so this request wins.
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
              setFlash(RECORD_PAGE.deactivatedFlash);
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
          setFlash(RECORD_PAGE.reactivatedFlash);
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

  const lines = grantLines(record);
  const history = historyLines(record);
  const deactivation = student.deactivation;

  const action = paused ? null : inactive ? (
    <Button
      variant="primary"
      id={REACTIVATE_ID}
      onClick={() => open({ kind: 'reactivate', expectedRev: student.rev })}
    >
      {RECORD_PAGE.reactivate}
    </Button>
  ) : (
    <Link className="xr-btn xr-btn--primary" href={giveAccessAddress({ student: student.id })}>
      {RECORD_PAGE.giveAccess}
    </Link>
  );

  return (
    <>
      <PageHeader
        className="mt-2 mb-6"
        back={<BackLink href={PEOPLE_ADDRESS}>{RECORD_PAGE.back}</BackLink>}
        overline={
          <>
            {RECORD_OVERLINE} · <span className="xr-id">{student.institutionStudentId}</span>
          </>
        }
        title={student.fullName}
        titleFocusTarget
        titleRef={titleRef}
        meta={
          <>
            {inactive ? (
              <StatusPill tone="off">{RECORD_PAGE.inactive}</StatusPill>
            ) : (
              <StatusPill tone="ok">{RECORD_PAGE.accountActive}</StatusPill>
            )}
            <span>{student.institutionEmail}</span>
          </>
        }
        actions={action}
      />
      <div className="xw-stack">
        {flash ? <Notice tone="ok">{flash}</Notice> : null}
        {paused ? <PausedNotice /> : null}
        {inactive && deactivation ? (
          <Notice tone="quiet" icon="notAvailable" title={RECORD_PAGE.inactiveTitle}>
            {`${inactiveSinceWords(
              dayMonthYear(deactivation.at),
              actorName(deactivation.by) ?? '',
              deactivation.reason,
            )} ${inactiveUntilLine(student.fullName)}`}
          </Notice>
        ) : null}
        <Section
          title={RECORD_PAGE.sections.experiments}
          headingId="student-experiments"
          headEnd={
            lines.length > 0 ? (
              <Link href={STUDENT_ACCESS_ADDRESS}>{RECORD_PAGE.openStudentAccess}</Link>
            ) : null
          }
        >
          {lines.length > 0 ? (
            <GrantTable lines={lines} />
          ) : (
            <EmptyState
              icon="graduation"
              headingLevel={3}
              title={noExperimentsTitle(student.fullName)}
            >
              {stateWords('IA-07.no-experiments.line')}
            </EmptyState>
          )}
        </Section>
        <Section title={RECORD_PAGE.sections.coursesAndGroups} headingId="student-courses">
          <SectionBody>
            <KeyValues
              keyWidth="140px"
              rows={[
                ...(record.courses.length > 0
                  ? [
                      [
                        RECORD_PAGE.keys.course,
                        record.courses.map((course) => (
                          <span key={course.id} className="block">
                            {courseLine(course.platformCode, course.name)}
                          </span>
                        )),
                      ] as const,
                    ]
                  : []),
                [
                  RECORD_PAGE.keys.group,
                  // Group names are not links: IA-14 is not built (DEV-21).
                  record.groups.length > 0
                    ? record.groups.map((group) => group.name).join(', ')
                    : STUDENTS_TAB.noGroup,
                ] as const,
              ]}
            />
          </SectionBody>
        </Section>
        <Section title={RECORD_PAGE.sections.details} headingId="student-details">
          <SectionBody>
            <KeyValues
              keyWidth="160px"
              rows={[
                [
                  RECORD_PAGE.keys.studentId,
                  <span key="id" className="xr-id text-ink">
                    {student.institutionStudentId}
                  </span>,
                ],
                [RECORD_PAGE.keys.email, student.institutionEmail],
                ...(student.programme
                  ? [[RECORD_PAGE.keys.programme, student.programme] as const]
                  : []),
                [RECORD_PAGE.keys.added, addedWords(record)],
              ]}
            />
          </SectionBody>
        </Section>
        <Section title={RECORD_PAGE.sections.history} headingId="student-history">
          <SectionBody>
            <Timeline
              events={history.map((line) => ({
                id: line.id,
                what: line.what,
                when: line.when,
                ...(line.note ? { note: line.note } : {}),
              }))}
            />
          </SectionBody>
        </Section>
        {!inactive && !paused ? (
          <Section title={RECORD_PAGE.sections.account} headingId="student-account">
            <SectionBody>
              <p className="xr-body mt-0 mb-[14px] text-ink-2">{RECORD_PAGE.accountLine}</p>
              <Button
                variant="danger-quiet"
                id={DEACTIVATE_ID}
                onClick={() => open({ kind: 'deactivate', reason: '', expectedRev: student.rev })}
              >
                {RECORD_PAGE.deactivate}
              </Button>
            </SectionBody>
          </Section>
        ) : null}
      </div>
      <ReasonDialog
        open={dialog?.kind === 'deactivate'}
        align="start"
        returnFocusFallback={titleRef}
        idPrefix="student-deactivate-dialog"
        destructive
        title={deactivateTitle(student.fullName)}
        effect={deactivateBody(student.fullName)}
        confirmLabel={RECORD_PAGE.deactivateConfirm}
        busy={deactivate.busy}
        busyLabel={RECORD_PAGE.deactivateBusy}
        onConfirm={confirm}
        onCancel={close}
      >
        <Field
          id={REASON_ID}
          label={RECORD_PAGE.reasonLabel}
          marker={RECORD_PAGE.reasonMarker}
          hint={RECORD_PAGE.reasonHint}
          errorClass="xw-ferr"
          error={reasonError ?? undefined}
        >
          <Textarea
            className="min-h-[96px]"
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
      </ReasonDialog>
      <ConfirmDialog
        open={dialog?.kind === 'reactivate'}
        align="start"
        returnFocusFallback={titleRef}
        idPrefix="student-reactivate-dialog"
        title={reactivateTitle(student.fullName)}
        effect={reactivateBody(student.fullName)}
        confirmLabel={RECORD_PAGE.reactivate}
        busy={reactivate.busy}
        busyLabel={RECORD_PAGE.reactivateBusy}
        onConfirm={confirm}
        onCancel={close}
      />
    </>
  );
}

/** B2-06 f9 "Experiments given" (`xr-table-wrap.xw-table-flush`): one row per grant line. */
function GrantTable({ lines }: { readonly lines: readonly GrantLine[] }) {
  const { columns } = RECORD_PAGE;
  return (
    <div className="xr-table-wrap xw-table-flush">
      <table className="xr-table">
        <caption className="xr-sr">{RECORD_PAGE.experimentsCaption}</caption>
        <thead>
          <tr>
            <th scope="col">{columns.experiment}</th>
            <th scope="col">{columns.formats}</th>
            <th scope="col">{columns.howGiven}</th>
            <th scope="col">{columns.status}</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => (
            <tr key={line.grantId}>
              <td className="is-primary">
                <strong>{line.experimentName}</strong>
                {line.courseCode ? <span className="xr-sub">{line.courseCode}</span> : null}
              </td>
              <td data-label={columns.formats}>
                <FormatSet compact formats={formatCodes(line.formats)} />
                <span className="xr-sub">{fromPlanWords(line.planId)}</span>
              </td>
              <td data-label={columns.howGiven}>
                {line.how.kind === 'group'
                  ? givenThroughGroupWords(line.how.groupName, line.how.date)
                  : givenIndividuallyWords(line.how.date)}
                <span className="xr-id">{line.grantId}</span>
                {line.also ? (
                  <span className="xw-also">
                    <Icon name="studentsPeople" size={16} />
                    <span>
                      {alsoInWords(line.also.groupName)} ·{' '}
                      <span className="xr-id">{line.also.grantId}</span>
                      {line.also.notChanged ? ALSO_NOT_CHANGED : null}
                    </span>
                  </span>
                ) : null}
              </td>
              <td data-label={columns.status}>
                <StatusPill tone={line.status.tone}>{line.status.words}</StatusPill>
                {line.status.line ? <span className="xr-sub mt-1">{line.status.line}</span> : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** A key–value list as B2-06 draws it (`dl.doc-kv.xp-kv`; `doc-` is canvas-only). */
function KeyValues({
  rows,
  keyWidth,
}: {
  readonly rows: readonly (readonly [string, ReactNode])[];
  readonly keyWidth: '140px' | '160px';
}) {
  return (
    <dl
      className={`xp-kv m-0 grid ${keyWidth === '140px' ? 'grid-cols-[140px_minmax(0,1fr)]' : 'grid-cols-[160px_minmax(0,1fr)]'} gap-x-5 gap-y-[10px] text-[15px] leading-[22px]`}
    >
      {rows.map(([name, value]) => (
        <KeyValue key={name} name={name}>
          {value}
        </KeyValue>
      ))}
    </dl>
  );
}

function KeyValue({ name, children }: { readonly name: string; readonly children: ReactNode }) {
  return (
    <>
      <dt className="font-[700] text-ink">{name}</dt>
      <dd className="m-0 text-ink-2">{children}</dd>
    </>
  );
}
