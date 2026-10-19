'use client';

import type {
  DecisionPage,
  InstitutionDetail as Detail,
  RequestRow,
  Result,
  ServiceError,
} from '@xr/contracts/draft';
import type { AccessEndingRow, AccountStatus, DeviceTransfer, Technology } from '@xr/domain';
import type { FormatCode } from '@xr/ui';
import {
  ActionGroup,
  ActionValue,
  AskList,
  AskRow,
  Banner,
  Breadcrumbs,
  Button,
  ButtonLink,
  ButtonRow,
  ConfirmDialog,
  CourseCode,
  DecisionPanel,
  DetailLayout,
  FactStrip,
  Field,
  Footnote,
  FORMAT_ORDER,
  FormatBadges,
  FormatCells,
  GoButton,
  Hint,
  InlineForm,
  InstitutionFormatActivity,
  InstitutionPeople,
  InstitutionPerson,
  InstitutionPlanExperiments,
  Notice,
  PageHead,
  PlanBand,
  PlanNote,
  Quote,
  ReadOnlyTable,
  RecordLine,
  SectionNote,
  StatusPill,
  Surface,
  SurfaceSection,
  TermTrack,
  Textarea,
  TextInput,
  TextLink,
  Timeline,
  WaitingList,
} from '@xr/ui/v3';
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';

import { calendarDay, dateTime, dayMonthYear, weekdayDate } from '@/copy/dates';
import { fieldWords } from '@/copy/field-words';
import {
  accountWords,
  approvedFormatsLabel,
  assignedTitle,
  assignTitle,
  changeStatusLabel,
  DETAIL_PAGE,
  endsOnWords,
  formatCode,
  institutionEyebrow,
  kindWords,
  overriddenTitle,
  overrideConfirm,
  overrideReasonLabel,
  pausedBannerWords,
  pausedByWords,
  pausedFlashLine,
  pauseTitle,
  peopleCountsLine,
  peopleWords,
  planEndedWords,
  planFormatsLabel,
  planKickerWords,
  planLicenceLine,
  planNameWords,
  restoreBody,
  restoredFlashLine,
  restoreTitle,
  SA_INSTITUTION,
  saInstituteAdminLine,
  startedCompletedWords,
  termDescription,
  termLabelWords,
  termLeftWords,
} from '@/copy/institutions';
import { SA_UNAVAILABLE } from '@/copy/sa-shared';
import { stateWords } from '@/copy/state-copy';
import { INSTITUTIONS_ADDRESS, INSTITUTIONS_TITLE, institutionPlacement } from '@/nav/institutions';
import { ACCESS_ENDING_ADDRESS } from '@/nav/operations';
import { requestAddress } from '@/nav/requests';
import { requestForDecision, useAllRequests } from '@/queries/access-requests';
import { usePublishedCatalogue } from '@/queries/catalogue';
import { useDeviceTransfers } from '@/queries/devices';
import { useInstitutionDetail } from '@/queries/institutions';
import { useAccessEnding } from '@/queries/operations-admin';
import { useSession } from '@/queries/session';
import { useCommand } from '@/queries/use-command';
import { useXrQuery } from '@/queries/use-xr-query';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import {
  InstitutionStatusPill,
  institutionStatusWords,
  PlanStatusPill,
} from '../shared/institution-status';
import { SaRecordGuard } from '../shared/sa-record-guard';
import {
  dayOf,
  drawnControls,
  hasRequestUnderReview,
  historyLines,
  type PlanView,
  planViews,
  waitingItems,
} from './institution-view';

/** An experiment as the published catalogue names it (name, course, published formats). */
interface ExperimentName {
  readonly name: string;
  readonly platformCode: string | null;
  readonly courseName: string | null;
  readonly published: readonly Technology[] | null;
}

/** The panel's id ("Go to actions" under 860 px) and its heading's. */
const PANEL_ID = 'in-panel';
const PANEL_HEADING_ID = 'in-panel-h';

/**
 * SA-07 Institution detail — the owner-approved V3 Refined B design (SA-v1 `V.institution`, its
 * dialogs `assignIA`, `pause`, `restore`), at `/admin/institutions/[institutionId]`.
 *
 * - **Read**: `InstitutionService.getInstitution` — the institution, its status, plans, people
 *   (each student with its record's revision) and the per-format report — with the experiments
 *   named from the published catalogue, the requests its record names (`listRequests`), its
 *   device transfers forwarded to BITS (`listDeviceTransfers`), its plans ending or ended
 *   (`listAccessEnding`) and, awaiting payment, the approved request (`getRequestForDecision`).
 *   An address that names no institution shows the GL-04 "This page isn’t available".
 * - **As SA-v1 draws it**: breadcrumbs and the record head (status, Institute Admin, "Go to
 *   actions" under 860 px); the flash, the paused banner and the "No Institute Admin" notice; the
 *   facts (and why access is paused, or the plan awaiting payment); one plan band per plan with
 *   its term track and format cells; activity by format, people with the status override inline,
 *   history; and the "What you can do" panel — Institute Admin, Access, Also waiting.
 * - **Act**: Assign Institute Admin (name + work e-mail; nothing is sent), Pause access and
 *   Restore access (a reason, kept in the history), and a student's status override inline (a
 *   reason) — each the port's command with the revision the page showed when its dialog or form
 *   opened (`expectedRev`; a student's is the `rev` listed with it, and the change the form names
 *   is fixed when it opens). The service decides each command again. Field errors show on the
 *   fields (both of Assign's at once; the identity safeguard on Work e-mail); a command refused
 *   because the record moved on writes nothing, closes the dialog or form, reads the page again
 *   (P1-21 interim, state-copy SA-07.moved-on) and puts focus on the page title (a status change:
 *   on its student's "Change status"). Each result is said in the flash, which takes focus.
 * - No plan amendment, licence arithmetic, payment activation or invitation: the plans are
 *   read-only and licences are shown as approved. No internal reference is shown.
 */
export function InstitutionDetail({ institutionId }: { readonly institutionId: string }) {
  const read = useInstitutionDetail(institutionId);
  const catalogue = usePublishedCatalogue();
  const requests = useAllRequests();
  const transfers = useDeviceTransfers('forwarded');
  const ending = useAccessEnding();
  const session = useSession();
  // Today on the sample clock: the session's sign-in instant (state-copy SA-07.term-clock).
  const today = session.status === 'signed-in' ? session.signedInAt : null;
  const detail = read.data?.ok ? read.data.value : null;
  // Awaiting payment there is no plan yet: the approved request names what was approved.
  const awaitingPayment = detail !== null && detail.plans.length === 0;
  const origin = useXrQuery(requestForDecision, detail?.institution.createdFromRequestId ?? '', {
    enabled: awaitingPayment,
  });
  useShellPage(
    read.data && !read.data.ok
      ? { screen: 'SA-07', title: SA_UNAVAILABLE.documentTitle, trail: [] }
      : institutionPlacement(detail?.institution.name ?? null),
  );

  const names = useMemo(() => {
    const map = new Map<string, ExperimentName>();
    if (catalogue.data?.ok) {
      for (const entry of catalogue.data.value.entries) {
        map.set(entry.experimentId, {
          name: entry.name,
          platformCode: entry.platformCode,
          courseName: entry.courseName,
          published: entry.availableIn,
        });
      }
    }
    return map;
  }, [catalogue.data]);
  const nameOf = (experimentId: string): ExperimentName =>
    names.get(experimentId) ?? {
      name: experimentId,
      platformCode: null,
      courseName: null,
      published: null,
    };
  const waiting =
    catalogue.isPending ||
    requests.isPending ||
    transfers.isPending ||
    ending.isPending ||
    today === null ||
    (awaitingPayment && origin.isPending);

  return (
    <SaRecordGuard
      read={{
        data: waiting ? undefined : read.data,
        isPending: read.isPending || waiting,
        isError:
          read.isError ||
          catalogue.isError ||
          requests.isError ||
          transfers.isError ||
          ending.isError ||
          (awaitingPayment && origin.isError),
        refetch: () => {
          void read.refetch();
          void catalogue.refetch();
          void requests.refetch();
          void transfers.refetch();
          void ending.refetch();
          if (awaitingPayment) void origin.refetch();
        },
      }}
      loadingLabel={stateWords('SA-07.loading')}
      failedTitle={stateWords('SA-07.failed')}
    >
      {(record) => (
        <DetailContent
          detail={record}
          requests={requests.data?.ok ? requests.data.value : []}
          transfers={transfers.data?.ok ? transfers.data.value : []}
          ending={ending.data?.ok ? ending.data.value.map((view) => view.row) : []}
          origin={awaitingPayment && origin.data?.ok ? origin.data.value : null}
          today={today ?? ''}
          nameOf={nameOf}
          refetch={() => {
            void read.refetch();
            void requests.refetch();
          }}
        />
      )}
    </SaRecordGuard>
  );
}

/** An open dialog, with the institution's revision as the page showed it when it opened. */
type Dialog =
  | {
      readonly kind: 'assign';
      readonly name: string;
      readonly workEmail: string;
      readonly expectedRev: number;
    }
  | { readonly kind: 'pause' | 'restore'; readonly reason: string; readonly expectedRev: number };

/**
 * An open status change: the change it names and the student's revision as listed when it opened
 * (PC-37) — a record changed meanwhile is refused as stale, never changed the other way.
 */
interface Override {
  readonly studentId: string;
  readonly to: AccountStatus;
  readonly expectedRev: number;
  readonly reason: string;
  readonly error: string | null;
}

/** The flash after a result (the export's `setFlash`): its title and line. */
interface Flash {
  readonly title: string;
  readonly line: string;
}

/** The field errors without one field's (editing a field clears its error). */
function without(
  errors: Readonly<Record<string, string>>,
  field: string,
): Readonly<Record<string, string>> {
  return Object.fromEntries(Object.entries(errors).filter(([key]) => key !== field));
}

/**
 * The words of a refusal's field errors, by field (`name`, `workEmail`, `reason`); Package 2B's
 * identity safeguard (PC-49) shows the register's provisional words (`SA-07.identity-taken`).
 */
function fieldMessages(error: ServiceError): Readonly<Record<string, string>> | null {
  if (error.kind !== 'validation-failed') return null;
  const messages: Record<string, string> = {};
  for (const item of error.fieldErrors) {
    const field = item.field.split('.')[0]!;
    const words = fieldWords(item);
    if (words && !messages[field]) messages[field] = words;
  }
  return messages;
}

/** Formats as drawn ("WEB"), in WEB/AR/VR/MR order. */
function codesOf(formats: readonly Technology[]): FormatCode[] {
  const codes = formats.map((format) => formatCode(format) as FormatCode);
  return FORMAT_ORDER.filter((code) => codes.includes(code));
}

function personName(actor: { readonly kind: string; readonly displayName?: string }): string {
  return actor.kind === 'person' ? (actor.displayName ?? '') : '';
}

function DetailContent({
  detail,
  requests,
  transfers,
  ending,
  origin,
  today,
  nameOf,
  refetch,
}: {
  readonly detail: Detail;
  readonly requests: readonly RequestRow[];
  readonly transfers: readonly DeviceTransfer[];
  readonly ending: readonly AccessEndingRow[];
  readonly origin: DecisionPage | null;
  readonly today: string;
  readonly nameOf: (experimentId: string) => ExperimentName;
  readonly refetch: () => void;
}) {
  const { institution, status } = detail;
  const controls = drawnControls(detail);
  const admin = institution.instituteAdmin;
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [errors, setErrors] = useState<Readonly<Record<string, string>>>({});
  const [override, setOverride] = useState<Override | null>(null);
  const [flash, setFlash] = useState<Flash | null>(null);
  const [focusRequest, setFocusRequest] = useState<{ readonly id: string; readonly n: number }>({
    id: '',
    n: 0,
  });
  const flashRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const panelRef = useRef<HTMLHeadingElement>(null);
  const assign = useCommand((ports) => ports.institutions.assignInstituteAdmin);
  const pause = useCommand((ports) => ports.institutions.pauseInstitution);
  const restore = useCommand((ports) => ports.institutions.restoreInstitution);
  const change = useCommand((ports) => ports.institutions.overrideStudentStatus);

  // Focus moves after the commit that shows its target (the export's `SA.focus(id)`): the flash
  // after a result, a field after an error, "Change status" after Cancel, the page title after a
  // refusal that re-reads the page (and wherever a target is gone). The dialog has given focus
  // back to its trigger in the same commit (a child's effect runs first), so this request wins.
  useEffect(() => {
    if (focusRequest.n === 0) return;
    const target =
      focusRequest.id === 'flash'
        ? flashRef.current
        : focusRequest.id === 'title'
          ? titleRef.current
          : (document.getElementById(focusRequest.id) ?? titleRef.current);
    target?.focus();
  }, [focusRequest]);
  const focus = (id: string) => setFocusRequest((current) => ({ id, n: current.n + 1 }));

  const done = (words: Flash) => {
    setDialog(null);
    setErrors({});
    setOverride(null);
    setFlash(words);
    focus('flash');
  };

  /**
   * A refusal: field errors stay on the fields; anything else (the record moved on, or no longer
   * allows it) closes the dialog or form, re-reads the page (P1-21) and moves focus to `then`.
   */
  const refused = (
    answer: Result<unknown, ServiceError>,
    onFields: (fields: Readonly<Record<string, string>>) => void,
    then: string,
  ) => {
    if (answer.ok) return;
    const fields = fieldMessages(answer.error);
    if (fields) {
      onFields(fields);
      return;
    }
    setDialog(null);
    setErrors({});
    setOverride(null);
    refetch();
    focus(then);
  };

  const open = (next: Dialog) => {
    setDialog(next);
    setErrors({});
    setFlash(null);
  };

  const confirm = () => {
    if (!dialog) return;
    if (dialog.kind === 'assign') {
      assign
        .run({
          institutionId: institution.id,
          name: dialog.name,
          workEmail: dialog.workEmail,
          expectedRev: dialog.expectedRev,
        })
        .then(
          (answer) => {
            if (answer.ok)
              done({
                title: assignedTitle(
                  answer.value.instituteAdmin?.name ?? dialog.name.trim(),
                  institution.name,
                ),
                line: SA_INSTITUTION.assignedLine,
              });
            else
              refused(
                answer,
                (fields) => {
                  // The service's checks: both errors at once, focus on the first invalid field.
                  setErrors(fields);
                  focus(fields['name'] ? 'institution-admin-name' : 'institution-admin-email');
                },
                'title',
              );
          },
          () => undefined,
        );
      return;
    }
    const command = dialog.kind === 'pause' ? pause : restore;
    command
      .run({
        institutionId: institution.id,
        reason: dialog.reason,
        expectedRev: dialog.expectedRev,
      })
      .then(
        (answer) => {
          if (answer.ok) {
            done(
              dialog.kind === 'pause'
                ? { title: SA_INSTITUTION.pausedTitle, line: pausedFlashLine(institution.name) }
                : {
                    title: SA_INSTITUTION.restoredTitle,
                    line: restoredFlashLine(institution.name),
                  },
            );
          } else
            refused(
              answer,
              (fields) => {
                setErrors(fields);
                focus('institution-reason');
              },
              'title',
            );
        },
        () => undefined,
      );
  };

  const startOverride = (student: Detail['people']['studentList'][number]) => {
    setOverride({
      studentId: student.id,
      to: student.status === 'active' ? 'inactive' : 'active',
      expectedRev: student.rev,
      reason: '',
      error: null,
    });
    setFlash(null);
    focus(`override-reason-${student.id}`);
  };
  const cancelOverride = (studentId: string) => {
    setOverride(null);
    focus(`override-${studentId}`);
  };
  const saveOverride = (student: Detail['people']['studentList'][number]) => {
    if (!override || override.studentId !== student.id) return;
    const { to, expectedRev } = override;
    change.run({ studentId: student.id, to, reason: override.reason, expectedRev }).then(
      (answer) => {
        if (answer.ok)
          done({ title: overriddenTitle(student.name, to), line: SA_INSTITUTION.overriddenLine });
        else
          refused(
            answer,
            (fields) => {
              setOverride((current) =>
                current ? { ...current, error: fields['reason'] ?? null } : current,
              );
              focus(`override-reason-${student.id}`);
            },
            `override-${student.id}`,
          );
      },
      () => undefined,
    );
  };

  const busy = assign.busy || pause.busy || restore.busy;
  const plans = planViews(detail, ending, requests, dayOf(today));
  const history = historyLines(detail);
  const waiting = waitingItems(detail, requests, transfers);
  const pausedNow = controls.restore ? institution.pause : null;

  const openAssign = () =>
    open({ kind: 'assign', name: '', workEmail: '', expectedRev: institution.rev });
  const openPause = () => open({ kind: 'pause', reason: '', expectedRev: institution.rev });
  const openRestore = () => open({ kind: 'restore', reason: '', expectedRev: institution.rev });

  return (
    <>
      <PageHead
        breadcrumbs={
          <Breadcrumbs
            levels={[{ label: INSTITUTIONS_TITLE, href: INSTITUTIONS_ADDRESS }]}
            current={institution.name}
          />
        }
        variant="record"
        title={institution.name}
        titleFocusTarget
        titleRef={titleRef}
        date={weekdayDate(today)}
        eyebrow={institutionEyebrow(institution.kind)}
        meta={
          <>
            <InstitutionStatusPill status={status} large />
            <span>{saInstituteAdminLine(admin?.name ?? null, controls.adminLater)}</span>
          </>
        }
        goTo={{ label: SA_INSTITUTION.goTo, targetId: PANEL_ID, focusId: PANEL_HEADING_ID }}
      />
      {flash ? (
        <Notice ref={flashRef} tone="ok" icon="okDisc" role="status" title={flash.title}>
          {flash.line}
        </Notice>
      ) : null}
      {pausedNow ? <Banner>{pausedBannerWords(dayMonthYear(pausedNow.since))}</Banner> : null}
      {controls.assign ? (
        <Notice tone="warn" icon="userMinus" role="status" title={SA_INSTITUTION.noAdminTitle}>
          {SA_INSTITUTION.noAdminLine}
        </Notice>
      ) : null}
      <DetailLayout
        stacked
        asideId={PANEL_ID}
        asideLabelledBy={PANEL_HEADING_ID}
        main={
          <>
            <Surface className="rk-mainsheet">
              <FactStrip
                facts={[
                  { term: SA_INSTITUTION.facts.status, value: institutionStatusWords(status) },
                  { term: SA_INSTITUTION.facts.kind, value: kindWords(institution.kind) },
                  {
                    term: SA_INSTITUTION.facts.instituteAdmin,
                    value: admin?.name ?? SA_INSTITUTION.notAssigned,
                    quiet: admin === null,
                  },
                  {
                    term: SA_INSTITUTION.facts.people,
                    value: peopleWords(detail.people.students, detail.people.faculty),
                  },
                ]}
              />
              {pausedNow ? (
                <SurfaceSection title={SA_INSTITUTION.whyPaused} titleId="in-pr">
                  <Quote by={pausedByWords(personName(pausedNow.by), dateTime(pausedNow.since))}>
                    {pausedNow.reason}
                  </Quote>
                  <RecordLine space="above">{SA_INSTITUTION.pausedSeen}</RecordLine>
                </SurfaceSection>
              ) : null}
              {detail.plans.length === 0 ? (
                <AwaitingPlan detail={detail} origin={origin} nameOf={nameOf} />
              ) : null}
            </Surface>
            {plans.map((view, index) => (
              <PlanBandView
                key={view.plan.id}
                view={view}
                index={index}
                count={plans.length}
                nameOf={nameOf}
              />
            ))}
            {plans.length > 0 ? <Footnote>{SA_INSTITUTION.planFootnote}</Footnote> : null}
            <Surface>
              {detail.report.length > 0 ? <Activity detail={detail} nameOf={nameOf} /> : null}
              <People
                detail={detail}
                override={override}
                busy={change.busy}
                onStart={startOverride}
                onCancel={cancelOverride}
                onReason={(reason) =>
                  setOverride((current) =>
                    current ? { ...current, reason, error: null } : current,
                  )
                }
                onSave={saveOverride}
              />
              <SurfaceSection
                title={SA_INSTITUTION.history}
                titleId="in-hist"
                aside={<SectionNote>{SA_INSTITUTION.newestFirst}</SectionNote>}
              >
                <Timeline
                  events={history.map((line) => ({
                    what: line.what,
                    when: line.when,
                    ...(line.note ? { note: line.note } : {}),
                  }))}
                />
              </SurfaceSection>
            </Surface>
          </>
        }
        aside={
          <DecisionPanel
            title={SA_INSTITUTION.panel}
            titleId={PANEL_HEADING_ID}
            titleRef={panelRef}
          >
            <ActionGroup label={SA_INSTITUTION.groupAdmin}>
              {admin ? (
                <ActionValue detail={admin.workEmail}>{admin.name}</ActionValue>
              ) : controls.adminLater ? (
                <Hint>{SA_INSTITUTION.adminLater}</Hint>
              ) : (
                <>
                  <Hint>{SA_INSTITUTION.adminNone}</Hint>
                  {controls.assign ? (
                    <GoButton id="in-assign" onClick={openAssign}>
                      {SA_INSTITUTION.assign}
                    </GoButton>
                  ) : null}
                </>
              )}
            </ActionGroup>
            <ActionGroup label={SA_INSTITUTION.groupAccess}>
              {controls.pause ? (
                <>
                  <Hint>{SA_INSTITUTION.pauseHint}</Hint>
                  <Button id="in-pause" onClick={openPause}>
                    {SA_INSTITUTION.pause}
                  </Button>
                </>
              ) : controls.restore ? (
                <>
                  <Hint>{SA_INSTITUTION.restoreHint}</Hint>
                  <Button
                    variant={admin ? 'primary' : 'default'}
                    id="in-restore"
                    onClick={openRestore}
                  >
                    {SA_INSTITUTION.restore}
                  </Button>
                </>
              ) : status === 'approved-payment-required' ? (
                <>
                  <Hint>{SA_INSTITUTION.paymentHint}</Hint>
                  <ButtonLink href={requestAddress(institution.createdFromRequestId)}>
                    {SA_INSTITUTION.openRequest}
                  </ButtonLink>
                </>
              ) : (
                <Hint>{SA_INSTITUTION.endedHint}</Hint>
              )}
            </ActionGroup>
            <ActionGroup label={SA_INSTITUTION.groupWaiting}>
              {waiting.length > 0 ? (
                <WaitingList items={waiting} />
              ) : (
                <Hint>{SA_INSTITUTION.nothingWaiting}</Hint>
              )}
            </ActionGroup>
          </DecisionPanel>
        }
      />
      <ConfirmDialog
        open={dialog?.kind === 'assign'}
        idPrefix="institution-assign"
        returnFocusFallback={titleRef}
        title={assignTitle(institution.name)}
        description={SA_INSTITUTION.assignDescription}
        confirmLabel={SA_INSTITUTION.assignConfirm}
        busy={busy}
        busyLabel={SA_INSTITUTION.assignBusy}
        initialFocus="field"
        submitOnEnter
        onConfirm={confirm}
        onCancel={() => {
          setDialog(null);
          setErrors({});
        }}
      >
        <Field
          id="institution-admin-name"
          label={SA_INSTITUTION.assignFields.name}
          error={errors['name']}
        >
          <TextInput
            autoComplete="off"
            value={dialog?.kind === 'assign' ? dialog.name : ''}
            onChange={(event) => {
              const name = event.target.value;
              setDialog((current) => (current?.kind === 'assign' ? { ...current, name } : current));
              setErrors((current) => without(current, 'name'));
            }}
          />
        </Field>
        <Field
          id="institution-admin-email"
          label={SA_INSTITUTION.assignFields.workEmail}
          error={errors['workEmail']}
        >
          <TextInput
            type="email"
            autoComplete="off"
            value={dialog?.kind === 'assign' ? dialog.workEmail : ''}
            onChange={(event) => {
              const workEmail = event.target.value;
              setDialog((current) =>
                current?.kind === 'assign' ? { ...current, workEmail } : current,
              );
              setErrors((current) => without(current, 'workEmail'));
            }}
          />
        </Field>
      </ConfirmDialog>
      <ConfirmDialog
        open={dialog?.kind === 'pause' || dialog?.kind === 'restore'}
        idPrefix="institution-status"
        returnFocusFallback={titleRef}
        title={
          dialog?.kind === 'restore' ? restoreTitle(institution.name) : pauseTitle(institution.name)
        }
        description={
          dialog?.kind === 'restore' ? restoreBody(institution.name) : DETAIL_PAGE.pauseBody
        }
        confirmLabel={dialog?.kind === 'restore' ? SA_INSTITUTION.restore : SA_INSTITUTION.pause}
        busy={busy}
        busyLabel={
          dialog?.kind === 'restore' ? SA_INSTITUTION.restoreBusy : SA_INSTITUTION.pauseBusy
        }
        initialFocus="field"
        onConfirm={confirm}
        onCancel={() => {
          setDialog(null);
          setErrors({});
        }}
      >
        <Field id="institution-reason" label={SA_INSTITUTION.reasonLabel} error={errors['reason']}>
          <Textarea
            value={dialog?.kind === 'pause' || dialog?.kind === 'restore' ? dialog.reason : ''}
            onChange={(event) => {
              const reason = event.target.value;
              setDialog((current) =>
                current && current.kind !== 'assign' ? { ...current, reason } : current,
              );
              setErrors({});
            }}
          />
        </Field>
        {dialog?.kind === 'pause' && hasRequestUnderReview(detail, requests) ? (
          <Hint>{SA_INSTITUTION.pauseBlocksRequest}</Hint>
        ) : null}
      </ConfirmDialog>
    </>
  );
}

/** "Access plan" while the approved request waits for its payment: what was approved. */
function AwaitingPlan({
  detail,
  origin,
  nameOf,
}: {
  readonly detail: Detail;
  readonly origin: DecisionPage | null;
  readonly nameOf: (experimentId: string) => ExperimentName;
}) {
  const decision = origin?.request.decision ?? null;
  const items = origin
    ? decision?.kind === 'approved-smaller-scope'
      ? decision.approvedItems
      : origin.request.items
    : [];
  return (
    <SurfaceSection title={SA_INSTITUTION.noPlanTitle} titleId="in-np">
      <RecordLine>{SA_INSTITUTION.noPlanLine}</RecordLine>
      {items.length > 0 ? (
        <AskList space="above">
          {items.map((item) => {
            const experiment = nameOf(item.experimentId);
            const codes = codesOf(item.formats);
            return (
              <AskRow
                key={item.experimentId}
                title={experiment.name}
                course={<CourseLine experiment={experiment} />}
                formats={<FormatBadges formats={codes} label={approvedFormatsLabel(codes)} />}
              />
            );
          })}
        </AskList>
      ) : null}
      <RecordLine space="above">
        <TextLink href={requestAddress(detail.institution.createdFromRequestId)}>
          {SA_INSTITUTION.openApproved}
        </TextLink>
      </RecordLine>
    </SurfaceSection>
  );
}

/** The course line of an experiment: its course code chip and the course's name. */
function CourseLine({ experiment }: { readonly experiment: ExperimentName }) {
  return (
    <>
      {experiment.platformCode ? <CourseCode code={experiment.platformCode} /> : null}
      {experiment.courseName ? <span>{experiment.courseName}</span> : null}
    </>
  );
}

/** One plan as its band draws it: identity, term track, experiments, its note. */
function PlanBandView({
  view,
  index,
  count,
  nameOf,
}: {
  readonly view: PlanView;
  readonly index: number;
  readonly count: number;
  readonly nameOf: (experimentId: string) => ExperimentName;
}) {
  const { plan } = view;
  const label = termLabelWords(plan.term);
  const start = calendarDay(plan.startsOn);
  const end = calendarDay(plan.endsOn);
  const left = termLeftWords(view.state, view.days);
  return (
    <PlanBand
      kicker={planKickerWords(index, count)}
      name={planNameWords(plan.items.length, plan.licences)}
      nameId={`pl-${index}`}
      status={<PlanStatusPill status={view.status} />}
      line={planLicenceLine(plan.licences)}
      term={
        <TermTrack
          inPlanBand
          label={label}
          remaining={left}
          remainingTone={
            view.state === 'paused' ? 'paused' : view.status === 'ending-soon' ? 'due' : 'calm'
          }
          start={start}
          end={end}
          elapsed={view.elapsed}
          showRest={view.status === 'ending-soon'}
          showToday={view.state !== 'ended'}
          paused={view.state === 'paused'}
          full={view.state === 'ended'}
          description={termDescription(label, start, end, left)}
        />
      }
      note={
        <>
          <InstitutionPlanExperiments
            experiments={plan.items.map((item) => {
              const experiment = nameOf(item.experimentId);
              const inPlan = codesOf(item.formats);
              const published = experiment.published ? codesOf(experiment.published) : inPlan;
              return {
                key: item.experimentId,
                title: experiment.name,
                course: <CourseLine experiment={experiment} />,
                formats: (
                  <FormatCells
                    variant="strip"
                    label={planFormatsLabel(inPlan, published)}
                    cells={FORMAT_ORDER.map((code) => {
                      const state = inPlan.includes(code)
                        ? 'on'
                        : published.includes(code)
                          ? 'pub'
                          : 'none';
                      return {
                        format: code,
                        state,
                        words:
                          state === 'on'
                            ? SA_INSTITUTION.inPlan
                            : state === 'pub'
                              ? SA_INSTITUTION.notInPlan
                              : SA_INSTITUTION.notPublished,
                      };
                    })}
                  />
                ),
              };
            })}
          />
          <PlanNoteView view={view} />
        </>
      }
    />
  );
}

/** The note strip at the foot of a plan band, when the plan needs attention. */
function PlanNoteView({ view }: { readonly view: PlanView }) {
  const { note, plan } = view;
  if (!note) return null;
  const end = calendarDay(plan.endsOn);
  switch (note.kind) {
    case 'renewal':
      return (
        <PlanNote
          tone="warn"
          icon="calendarPlain"
          title={endsOnWords(end)}
          action={
            <ButtonLink variant="navy" href={requestAddress(note.requestId)}>
              {note.underReview ? SA_INSTITUTION.openRenewal : SA_INSTITUTION.viewRenewal}
            </ButtonLink>
          }
        >
          {note.underReview ? SA_INSTITUTION.renewalUnderReview : SA_INSTITUTION.renewalApproved}
        </PlanNote>
      );
    case 'reminder':
      return (
        <PlanNote
          tone="warn"
          icon="calendarPlain"
          title={endsOnWords(end)}
          action={
            <ButtonLink href={ACCESS_ENDING_ADDRESS}>{SA_INSTITUTION.viewAccessEnding}</ButtonLink>
          }
        >
          {note.notCovered
            ? `${SA_INSTITUTION.notCovered} ${SA_INSTITUTION.reminderDue}`
            : SA_INSTITUTION.reminderDue}
        </PlanNote>
      );
    case 'paused':
      return (
        <PlanNote tone="paused" title={SA_INSTITUTION.pausedNoteTitle}>
          {SA_INSTITUTION.pausedNoteLine}
        </PlanNote>
      );
    case 'ended':
      return (
        <PlanNote tone="off" title={planEndedWords(end)}>
          {SA_INSTITUTION.endedNoteLine}
        </PlanNote>
      );
  }
}

/** "Activity by format": per experiment, students with access, per format — never added up. */
function Activity({
  detail,
  nameOf,
}: {
  readonly detail: Detail;
  readonly nameOf: (experimentId: string) => ExperimentName;
}) {
  const columns = SA_INSTITUTION.activityColumns;
  return (
    <SurfaceSection title={SA_INSTITUTION.activity} titleId="in-rep">
      <ReadOnlyTable
        caption={SA_INSTITUTION.activityCaption}
        columns={[columns.experiment, columns.studentsWithAccess, columns.byFormat]}
        rows={detail.report.map((row) => ({
          key: row.experimentId,
          head: nameOf(row.experimentId).name,
          cells: [
            {
              label: columns.studentsWithAccess,
              content: row.studentsWithAccess,
              numeric: true,
            },
            {
              label: columns.byFormat,
              content: (
                <InstitutionFormatActivity
                  items={[...row.perFormat]
                    .sort(
                      (a, b) =>
                        FORMAT_ORDER.indexOf(formatCode(a.format) as FormatCode) -
                        FORMAT_ORDER.indexOf(formatCode(b.format) as FormatCode),
                    )
                    .map((format) => ({
                      format: formatCode(format.format),
                      words: startedCompletedWords(format.started, format.completed),
                    }))}
                />
              ),
            },
          ],
        }))}
      />
      <Hint under="table">{SA_INSTITUTION.activityNote}</Hint>
    </SurfaceSection>
  );
}

/** "People": the counts, and each student with "Change status" — an override, inline. */
function People({
  detail,
  override,
  busy,
  onStart,
  onCancel,
  onReason,
  onSave,
}: {
  readonly detail: Detail;
  readonly override: Override | null;
  readonly busy: boolean;
  readonly onStart: (student: Detail['people']['studentList'][number]) => void;
  readonly onCancel: (studentId: string) => void;
  readonly onReason: (reason: string) => void;
  readonly onSave: (student: Detail['people']['studentList'][number]) => void;
}) {
  const students = detail.people.studentList;
  const counts = peopleWords(detail.people.students, detail.people.faculty);
  let body: ReactNode;
  if (students.length > 0) {
    body = (
      <>
        <RecordLine space="below">{SA_INSTITUTION.peopleLine}</RecordLine>
        <InstitutionPeople>
          {students.map((student) => {
            // The change the form names was fixed when it opened (`Override.to`).
            const open = override?.studentId === student.id ? override : null;
            return (
              <InstitutionPerson
                key={student.id}
                name={student.name}
                detail={student.institutionStudentId}
                status={
                  <StatusPill tone={student.status === 'active' ? 'ok' : 'ended'}>
                    {accountWords(student.status)}
                  </StatusPill>
                }
                action={
                  open ? undefined : (
                    <Button
                      variant="ghost"
                      id={`override-${student.id}`}
                      aria-label={changeStatusLabel(student.name)}
                      onClick={() => onStart(student)}
                    >
                      {SA_INSTITUTION.changeStatus}
                    </Button>
                  )
                }
              >
                {open ? (
                  <InlineForm>
                    <Field
                      id={`override-reason-${student.id}`}
                      label={overrideReasonLabel(open.to)}
                      hint={SA_INSTITUTION.overrideHint}
                      error={open.error ?? undefined}
                    >
                      <Textarea
                        value={open.reason}
                        onChange={(event) => onReason(event.target.value)}
                      />
                    </Field>
                    <ButtonRow>
                      <Button
                        variant="navy"
                        busy={busy}
                        busyLabel={overrideConfirm(open.to)}
                        onClick={() => onSave(student)}
                      >
                        {overrideConfirm(open.to)}
                      </Button>
                      <Button onClick={() => onCancel(student.id)}>{SA_INSTITUTION.cancel}</Button>
                    </ButtonRow>
                  </InlineForm>
                ) : null}
              </InstitutionPerson>
            );
          })}
        </InstitutionPeople>
      </>
    );
  } else {
    body = (
      <RecordLine>
        {detail.people.students > 0 || detail.people.faculty > 0
          ? peopleCountsLine(detail.people.students, detail.people.faculty)
          : SA_INSTITUTION.nobody}
      </RecordLine>
    );
  }
  return (
    <SurfaceSection
      title={SA_INSTITUTION.people}
      titleId="in-ppl"
      aside={students.length > 0 ? <SectionNote>{counts}</SectionNote> : undefined}
    >
      {body}
    </SurfaceSection>
  );
}
