'use client';

import type {
  InstitutionDetail as Detail,
  RequestRow,
  Result,
  ServiceError,
} from '@xr/contracts/draft';
import type { AccountStatus, Technology } from '@xr/domain';
import {
  BackLink,
  Button,
  EditDialog,
  Field,
  FormatBadge,
  type FormatCode,
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
  TextInput,
  Timeline,
} from '@xr/ui';
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';

import { dayMonthYear } from '@/copy/dates';
import {
  accountWords,
  assignedFlash,
  assignTitle,
  changeStatusLabel,
  detailOverline,
  DETAIL_PAGE,
  formatCode,
  instituteAdminLine,
  INSTITUTIONS_PAGE,
  kindWords,
  noPlanLine,
  openRequestWords,
  overriddenFlash,
  overrideConfirm,
  overrideReasonLabel,
  pausedFlash,
  pausedLine,
  pauseTitle,
  peopleWords,
  planDates,
  planExperimentWords,
  planLine,
  planTermWords,
  restoreBody,
  restoredFlash,
  restoreTitle,
  startedCompletedWords,
} from '@/copy/institutions';
import { stateWords } from '@/copy/state-copy';
import { INSTITUTIONS_ADDRESS, institutionPlacement } from '@/nav/institutions';
import { requestAddress } from '@/nav/requests';
import { useAllRequests } from '@/queries/access-requests';
import { usePublishedCatalogue } from '@/queries/catalogue';
import { useInstitutionDetail } from '@/queries/institutions';
import { useCommand } from '@/queries/use-command';

import { RecordGuard } from '../../shared/record-guard/record-guard';
import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { InstitutionStatusPill, institutionStatusWords } from '../shared/institution-status';
import {
  type AttentionView,
  attentionRows,
  drawnControls,
  historyLines,
  newestPlan,
} from './institution-view';

/** An experiment as the published catalogue names it ("Shell-and-Tube Heat Exchanger", "ME ZG523"). */
interface ExperimentName {
  readonly name: string;
  readonly platformCode: string | null;
}

/**
 * SA-07 Institution detail — boards B7-03 (states, validation, 375) and B7-04 (the Super Admin's
 * pause), at `/admin/institutions/[institutionId]`.
 *
 * - **Read**: `InstitutionService.getInstitution` — the institution, its status, plans, people
 *   (each student with its record's revision) and the per-format report — with the experiments
 *   named from the published catalogue and the requests its record names read through
 *   `AccessRequestService.listRequests`. An address that names no institution shows the in-shell
 *   not-found page.
 * - **Act**: Assign Institute Admin (name + work e-mail; nothing is sent), Pause access and
 *   Restore access (a reason, kept in the history), and a student's status override inline (a
 *   reason) — each the port's command with the revision the page showed when its dialog or panel
 *   opened (`expectedRev`; a student's is the `rev` listed with it, and the change the panel names
 *   is fixed when it opens). The controls are B7-03's per state (`drawnControls`); the service
 *   decides each command again. Field errors show on the fields (both of Assign's at once); a
 *   command refused because the record moved on writes nothing, closes the dialog or panel, reads
 *   the page again (P1-21 interim) and puts focus on the page title (a status change: on its
 *   student's "Change status"). Each result is said in the flash, which takes focus.
 * - **Sections** as drawn: summary, access plans (read-only; licences as provided), needs
 *   attention, institution report (per format, never added up), people, history. The decision ids
 *   B7-03 writes into its copy are not shown (P1-14); its sample labels do not ship.
 */
export function InstitutionDetail({ institutionId }: { readonly institutionId: string }) {
  const read = useInstitutionDetail(institutionId);
  const catalogue = usePublishedCatalogue();
  const requests = useAllRequests();
  useShellPage(institutionPlacement(read.data?.ok ? read.data.value.institution.name : null));

  const names = useMemo(() => {
    const map = new Map<string, ExperimentName>();
    if (catalogue.data?.ok) {
      for (const entry of catalogue.data.value.entries) {
        map.set(entry.experimentId, { name: entry.name, platformCode: entry.platformCode });
      }
    }
    return map;
  }, [catalogue.data]);
  const nameOf = (experimentId: string): ExperimentName =>
    names.get(experimentId) ?? { name: experimentId, platformCode: null };
  const waiting = catalogue.isPending || requests.isPending;

  return (
    <PageContent wrap="read">
      <RecordGuard
        read={{
          data: waiting ? undefined : read.data,
          isPending: read.isPending || waiting,
          isError: read.isError || catalogue.isError || requests.isError,
          refetch: () => {
            void read.refetch();
            void catalogue.refetch();
            void requests.refetch();
          },
        }}
        loadingLabel={stateWords('SA-07.loading')}
        failed={{ title: stateWords('SA-07.failed'), line: stateWords('SA-07.failed.line') }}
      >
        {(detail) => (
          <DetailContent
            detail={detail}
            requests={requests.data?.ok ? requests.data.value : []}
            nameOf={nameOf}
            refetch={() => {
              void read.refetch();
              void requests.refetch();
            }}
          />
        )}
      </RecordGuard>
    </PageContent>
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
 * (B7-03 f8; PC-37) — a record changed meanwhile is refused as stale, never changed the other way.
 */
interface Override {
  readonly studentId: string;
  readonly to: AccountStatus;
  readonly expectedRev: number;
  readonly reason: string;
  readonly error: string | null;
}

/** The field errors without one field's (editing a field clears its error, B7-03 `onIaN`). */
function without(
  errors: Readonly<Record<string, string>>,
  field: string,
): Readonly<Record<string, string>> {
  return Object.fromEntries(Object.entries(errors).filter(([key]) => key !== field));
}

/** The drawn words of a refusal's field errors, by field (`name`, `workEmail`, `reason`). */
function fieldMessages(error: ServiceError): Readonly<Record<string, string>> | null {
  if (error.kind !== 'validation-failed') return null;
  const messages: Record<string, string> = {};
  for (const item of error.fieldErrors) {
    const field = item.field.split('.')[0]!;
    if (item.message && !messages[field]) messages[field] = item.message;
  }
  return messages;
}

function DetailContent({
  detail,
  requests,
  nameOf,
  refetch,
}: {
  readonly detail: Detail;
  readonly requests: readonly RequestRow[];
  readonly nameOf: (experimentId: string) => ExperimentName;
  readonly refetch: () => void;
}) {
  const { institution, status } = detail;
  const controls = drawnControls(detail);
  const plan = newestPlan(detail);
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [errors, setErrors] = useState<Readonly<Record<string, string>>>({});
  const [override, setOverride] = useState<Override | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [focusRequest, setFocusRequest] = useState<{ readonly id: string; readonly n: number }>({
    id: '',
    n: 0,
  });
  const flashRef = useRef<HTMLParagraphElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const assign = useCommand((ports) => ports.institutions.assignInstituteAdmin);
  const pause = useCommand((ports) => ports.institutions.pauseInstitution);
  const restore = useCommand((ports) => ports.institutions.restoreInstitution);
  const change = useCommand((ports) => ports.institutions.overrideStudentStatus);

  // Focus moves after the commit that shows its target (B7-03 `focus(id)`): the flash after a
  // result, a field after an error, "Change status" after Cancel, the page title after a refusal
  // that re-reads the page (and wherever a target is gone). The dialog has given focus back to its
  // trigger in the same commit (a child's effect runs first), so this request wins.
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

  const done = (words: string) => {
    setDialog(null);
    setErrors({});
    setOverride(null);
    setFlash(words);
    focus('flash');
  };

  /**
   * A refusal: field errors stay on the fields; anything else (the record moved on, or no longer
   * allows it) closes the dialog or panel, re-reads the page (P1-21) and moves focus to `then`.
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
              done(
                assignedFlash(
                  answer.value.instituteAdmin?.name ?? dialog.name.trim(),
                  institution.name,
                ),
              );
            else
              refused(
                answer,
                (fields) => {
                  // The service's drawn checks (B7-03 `doAssign`): both errors at once, and focus
                  // on the first invalid field (board 10).
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
                ? pausedFlash(institution.name)
                : restoredFlash(institution.name),
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
        if (answer.ok) done(overriddenFlash(student.name, to));
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

  const attention = attentionRows(detail, requests);
  const history = historyLines(detail);
  const busy = assign.busy || pause.busy || restore.busy;

  return (
    <>
      <PageHeader
        className="mt-2 mb-3"
        back={<BackLink href={INSTITUTIONS_ADDRESS}>{DETAIL_PAGE.back}</BackLink>}
        overline={detailOverline(institution.kind, plan?.id ?? null)}
        title={institution.name}
        titleFocusTarget
        titleRef={titleRef}
        meta={
          <>
            <InstitutionStatusPill status={status} />
            <span>{instituteAdminLine(institution.instituteAdmin?.name ?? null)}</span>
          </>
        }
      />
      <div className="xw-actions mb-4">
        {controls.assign ? (
          <Button
            variant="primary"
            onClick={() =>
              open({ kind: 'assign', name: '', workEmail: '', expectedRev: institution.rev })
            }
          >
            {DETAIL_PAGE.assign}
          </Button>
        ) : null}
        {controls.pause ? (
          <Button
            variant="secondary"
            icon="paused"
            onClick={() => open({ kind: 'pause', reason: '', expectedRev: institution.rev })}
          >
            {DETAIL_PAGE.pause}
          </Button>
        ) : null}
        {controls.restore ? (
          <Button
            variant="primary"
            onClick={() => open({ kind: 'restore', reason: '', expectedRev: institution.rev })}
          >
            {DETAIL_PAGE.restore}
          </Button>
        ) : null}
        <Link
          className="xr-btn xr-btn--text"
          href={requestAddress(institution.createdFromRequestId)}
        >
          {openRequestWords(institution.createdFromRequestId)}
        </Link>
      </div>
      <p ref={flashRef} className="xa-save is-ok mb-3" role="status" tabIndex={-1}>
        {flash ? (
          <>
            <Icon name="done" />
            <span>{flash}</span>
          </>
        ) : null}
      </p>
      {controls.restore && institution.pause ? (
        <div className="mb-4">
          <Notice tone="warn" icon="paused" title={DETAIL_PAGE.pausedTitle}>
            {pausedLine(dayMonthYear(institution.pause.since), institution.pause.reason)}
          </Notice>
        </div>
      ) : null}
      {controls.assign ? (
        <div className="mb-4">
          <Notice tone="warn" icon="warning" title={DETAIL_PAGE.noAdminTitle}>
            {DETAIL_PAGE.noAdminLine}
          </Notice>
        </div>
      ) : null}
      <div className="flex flex-col gap-5">
        <Summary detail={detail} adminLater={controls.adminLater} />
        <Plans detail={detail} nameOf={nameOf} />
        <Attention
          rows={attention}
          onAssign={() =>
            open({ kind: 'assign', name: '', workEmail: '', expectedRev: institution.rev })
          }
          onRestore={() => open({ kind: 'restore', reason: '', expectedRev: institution.rev })}
        />
        <Report detail={detail} nameOf={nameOf} />
        <People
          detail={detail}
          override={override}
          busy={change.busy}
          onStart={startOverride}
          onCancel={cancelOverride}
          onReason={(reason) =>
            setOverride((current) => (current ? { ...current, reason, error: null } : current))
          }
          onSave={saveOverride}
        />
        <Section title={DETAIL_PAGE.history} meta={DETAIL_PAGE.historyMeta}>
          <SectionBody>
            <Timeline
              markLatest={false}
              events={history.map((line) => ({
                id: line.id,
                what: line.what,
                when: line.when,
                ...(line.note ? { note: line.note } : {}),
              }))}
            />
          </SectionBody>
        </Section>
      </div>
      <EditDialog
        open={dialog?.kind === 'assign'}
        align="start"
        returnFocusFallback={titleRef}
        idPrefix="institution-assign"
        title={assignTitle(institution.name)}
        effect={DETAIL_PAGE.assignBody}
        confirmLabel={DETAIL_PAGE.assignConfirm}
        busy={busy}
        busyLabel={DETAIL_PAGE.assignBusy}
        onConfirm={confirm}
        onCancel={() => {
          setDialog(null);
          setErrors({});
        }}
      >
        {/* B7-03 draws the sentence above as `p style="margin:0 0 14px"`: the same 14 px here. */}
        <Field
          id="institution-admin-name"
          className="mt-[14px]"
          label={DETAIL_PAGE.assignFields.name}
          error={errors['name']}
        >
          <TextInput
            value={dialog?.kind === 'assign' ? dialog.name : ''}
            onChange={(event) => {
              const name = event.target.value;
              setDialog((current) => (current?.kind === 'assign' ? { ...current, name } : current));
              setErrors((current) => without(current, 'name'));
            }}
          />
        </Field>
        <div className="h-3" />
        <Field
          id="institution-admin-email"
          label={DETAIL_PAGE.assignFields.workEmail}
          error={errors['workEmail']}
        >
          <TextInput
            type="email"
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
      </EditDialog>
      <ReasonDialog
        open={dialog?.kind === 'pause' || dialog?.kind === 'restore'}
        align="start"
        returnFocusFallback={titleRef}
        idPrefix="institution-status"
        destructive={dialog?.kind === 'pause'}
        title={
          dialog?.kind === 'restore' ? restoreTitle(institution.name) : pauseTitle(institution.name)
        }
        effect={
          dialog?.kind === 'restore' ? (
            restoreBody(institution.name)
          ) : (
            <strong>{DETAIL_PAGE.pauseBody}</strong>
          )
        }
        confirmLabel={dialog?.kind === 'restore' ? DETAIL_PAGE.restore : DETAIL_PAGE.pause}
        busy={busy}
        busyLabel={dialog?.kind === 'restore' ? DETAIL_PAGE.restoreBusy : DETAIL_PAGE.pauseBusy}
        onConfirm={confirm}
        onCancel={() => {
          setDialog(null);
          setErrors({});
        }}
      >
        {/* B7-03 draws the sentence above as `p style="margin:0 0 14px"`: the same 14 px here. */}
        <Field
          id="institution-reason"
          className="mt-[14px]"
          label={DETAIL_PAGE.reasonLabel}
          error={errors['reason']}
        >
          <Textarea
            className="min-h-[96px]"
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
      </ReasonDialog>
    </>
  );
}

/** B7-03 "Institution summary" (`dl.xl-kv.xv-kv`). */
function Summary({
  detail,
  adminLater,
}: {
  readonly detail: Detail;
  readonly adminLater: boolean;
}) {
  const { institution } = detail;
  const plan = newestPlan(detail);
  const keys = DETAIL_PAGE.summaryKeys;
  const rows: readonly (readonly [string, ReactNode])[] = [
    [keys.status, institutionStatusWords(detail.status)],
    [keys.kind, kindWords(institution.kind)],
    [keys.instituteAdmin, institution.instituteAdmin?.name ?? INSTITUTIONS_PAGE.notAssigned],
    [keys.plan, plan ? planLine(plan) : noPlanLine(institution.createdFromRequestId)],
    [keys.people, peopleWords(detail.people.students, detail.people.faculty)],
  ];
  return (
    <Section title={DETAIL_PAGE.summary}>
      <SectionBody>
        <dl className="xl-kv xv-kv">
          {rows.map(([key, value]) => (
            <KeyValue key={key} name={key}>
              {value}
            </KeyValue>
          ))}
        </dl>
        {adminLater ? <p className="xl-meta mt-3 mb-0">{DETAIL_PAGE.adminLater}</p> : null}
      </SectionBody>
    </Section>
  );
}

function KeyValue({ name, children }: { readonly name: string; readonly children: ReactNode }) {
  return (
    <>
      <dt>{name}</dt>
      <dd>{children}</dd>
    </>
  );
}

/** Format chips as B7-03 draws them inside a row (`span.xr-fmt.xr-fmt--compact`). */
function Chips({ formats }: { readonly formats: readonly Technology[] }) {
  return (
    <>
      {formats.map((format) => (
        <FormatBadge key={format} format={formatCode(format) as FormatCode} compact />
      ))}
    </>
  );
}

/** B7-03 "Access plans · Read-only": no amend control (T-08); licences as provided (T-06). */
function Plans({
  detail,
  nameOf,
}: {
  readonly detail: Detail;
  readonly nameOf: (experimentId: string) => ExperimentName;
}) {
  const columns = DETAIL_PAGE.planColumns;
  return (
    <Section title={DETAIL_PAGE.plans} meta={DETAIL_PAGE.plansMeta}>
      <SectionBody>
        {detail.plans.length > 0 ? (
          <>
            <div className="xr-table-wrap">
              <table className="xr-table">
                <thead>
                  <tr>
                    <th scope="col">{columns.plan}</th>
                    <th scope="col">{columns.experiments}</th>
                    <th scope="col">{columns.licences}</th>
                    <th scope="col">{columns.term}</th>
                    <th scope="col">{columns.status}</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.plans.map((plan) => (
                    <tr key={plan.id}>
                      <td className="is-primary">
                        <strong>{plan.id}</strong>
                      </td>
                      <td data-label={columns.experimentsLabel}>
                        {plan.items.map((item) => {
                          const experiment = nameOf(item.experimentId);
                          return (
                            <span
                              key={item.experimentId}
                              className="my-[2px] flex flex-wrap items-center gap-[6px]"
                            >
                              {planExperimentWords(experiment.name, experiment.platformCode)}
                              <span className="xv-chips">
                                <Chips formats={item.formats} />
                              </span>
                            </span>
                          );
                        })}
                      </td>
                      <td data-label={columns.licences}>{plan.licences}</td>
                      <td data-label={columns.term}>
                        {planTermWords(plan.term)}
                        <span className="xr-meta block">
                          {planDates(plan.startsOn, plan.endsOn)}
                        </span>
                      </td>
                      <td data-label={columns.status}>
                        <InstitutionStatusPill status={detail.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="xl-meta mt-3 mb-0">{DETAIL_PAGE.licenceNote}</p>
          </>
        ) : (
          <p className="xr-body m-0 text-ink-2">
            {noPlanLine(detail.institution.createdFromRequestId)}.
          </p>
        )}
      </SectionBody>
    </Section>
  );
}

/** B7-03 "Needs attention": one action per row. */
function Attention({
  rows,
  onAssign,
  onRestore,
}: {
  readonly rows: readonly AttentionView[];
  readonly onAssign: () => void;
  readonly onRestore: () => void;
}) {
  return (
    <Section title={DETAIL_PAGE.attention}>
      {rows.length > 0 ? (
        <ul className="xr-rows">
          {rows.map((row) => (
            <li key={row.key} className="xr-row">
              <div className="xr-row-main">
                <span className="xr-row-icon xr-row-icon--wait">
                  <Icon name="clock" />
                </span>
                <div className="xr-row-text">
                  <span className="xr-row-title">{row.text}</span>
                </div>
              </div>
              {row.action.kind === 'link' ? (
                <Link className="xr-btn xr-btn--secondary xr-btn--sm" href={row.action.href}>
                  {row.action.label}
                </Link>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={row.action.kind === 'assign' ? onAssign : onRestore}
                >
                  {row.action.kind === 'assign' ? DETAIL_PAGE.assign : DETAIL_PAGE.restore}
                </Button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <SectionBody>
          <p className="xr-body m-0 text-ink-2">{DETAIL_PAGE.nothingNeedsAttention}</p>
        </SectionBody>
      )}
    </Section>
  );
}

/** B7-03 "Institution report": per experiment, students with access, per format — never added up. */
function Report({
  detail,
  nameOf,
}: {
  readonly detail: Detail;
  readonly nameOf: (experimentId: string) => ExperimentName;
}) {
  const columns = DETAIL_PAGE.reportColumns;
  return (
    <Section title={DETAIL_PAGE.report}>
      <SectionBody>
        {detail.report.length > 0 ? (
          <>
            <div className="xr-table-wrap">
              <table className="xr-table">
                <thead>
                  <tr>
                    <th scope="col">{columns.experiment}</th>
                    <th scope="col">{columns.studentsWithAccess}</th>
                    <th scope="col">{columns.byFormat}</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.report.map((row) => (
                    <tr key={row.experimentId}>
                      <td className="is-primary">
                        <strong>{nameOf(row.experimentId).name}</strong>
                      </td>
                      <td data-label={columns.studentsWithAccess}>{row.studentsWithAccess}</td>
                      <td data-label={columns.byFormat}>
                        {row.perFormat.map((format) => (
                          <span
                            key={format.format}
                            className="my-[2px] flex flex-wrap items-center gap-2"
                          >
                            <FormatBadge format={formatCode(format.format) as FormatCode} compact />
                            <span>{startedCompletedWords(format.started, format.completed)}</span>
                          </span>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="xl-meta mt-3 mb-0">{DETAIL_PAGE.reportNote}</p>
          </>
        ) : (
          <p className="xr-body m-0 text-ink-2">{DETAIL_PAGE.noActivity}</p>
        )}
      </SectionBody>
    </Section>
  );
}

/** B7-03 "People": the counts, and each student with "Change status" — an override, inline. */
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
  return (
    <Section title={DETAIL_PAGE.people}>
      <SectionBody>
        <p className={`xr-body text-ink-2 ${students.length > 0 ? 'mt-0 mb-3' : 'm-0'}`}>
          {peopleWords(detail.people.students, detail.people.faculty)}. {DETAIL_PAGE.peopleTail}
        </p>
        {students.length > 0 ? (
          <ul className="xg-los" aria-label={DETAIL_PAGE.studentsLabel}>
            {students.map((student) => {
              // The change the panel names was fixed when it opened (`Override.to`).
              const open = override?.studentId === student.id;
              return (
                <li key={student.id} className="xg-lo items-start">
                  <div className="xg-lo-main flex-col gap-[2px]">
                    <span className="font-[700] text-ink">{student.name}</span>
                    <span className="xr-meta">
                      <span className="xr-id">{student.institutionStudentId}</span>
                    </span>
                  </div>
                  <div className="xg-lo-acts gap-3">
                    <StatusPill tone={student.status === 'active' ? 'ok' : 'off'}>
                      {accountWords(student.status)}
                    </StatusPill>
                    {open ? null : (
                      <Button
                        variant="text"
                        id={`override-${student.id}`}
                        aria-label={changeStatusLabel(student.name)}
                        onClick={() => onStart(student)}
                      >
                        {DETAIL_PAGE.changeStatus}
                      </Button>
                    )}
                  </div>
                  {open ? (
                    <div className="xw-inline-panel flex-[1_1_100%]">
                      <Field
                        id={`override-reason-${student.id}`}
                        label={overrideReasonLabel(override.to)}
                        hint={DETAIL_PAGE.overrideHint}
                        error={override.error ?? undefined}
                      >
                        <Textarea
                          className="min-h-[80px]"
                          value={override.reason}
                          onChange={(event) => onReason(event.target.value)}
                        />
                      </Field>
                      <div className="xw-actions mt-3">
                        <Button
                          variant="primary"
                          size="sm"
                          busy={busy}
                          busyLabel={overrideConfirm(override.to)}
                          onClick={() => onSave(student)}
                        >
                          {overrideConfirm(override.to)}
                        </Button>
                        <Button variant="text" onClick={() => onCancel(student.id)}>
                          {DETAIL_PAGE.cancel}
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : null}
      </SectionBody>
    </Section>
  );
}
