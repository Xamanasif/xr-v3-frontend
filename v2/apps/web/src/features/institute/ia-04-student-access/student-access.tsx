'use client';

import type { ServiceError } from '@xr/contracts/draft';
import {
  Button,
  ButtonLink,
  ConfirmDialog,
  Field,
  IaGrantHow,
  IaGroupedTable,
  IaLiveLine,
  IaManageFilters,
  IaManageFoot,
  IaManageSearch,
  IaManageSelect,
  IaManageStatus,
  IaManageSurface,
  IaManageTools,
  IaSegments,
  IaStatusNotes,
  ListState,
  LoadingRows,
  Notice,
  PageHead,
  StatusPill,
  Textarea,
} from '@xr/ui/v3';
import { type RefObject, useEffect, useMemo, useRef, useState } from 'react';

import { dayMonthYear } from '@/copy/dates';
import {
  alsoInGroupWords,
  IA04,
  IA04_NONE,
  IA04_VIA,
  type Ia04Via,
  noLicenceNote,
  rowsShownWords,
  WITHDRAW,
  withdrawAlsoBody,
  withdrawAlsoNote,
  withdrawAlsoTitle,
  withdrawAria,
  withdrawnAlsoFlash,
  withdrawnNote,
  withdrawnOnlyFlash,
  withdrawOnlyBody,
} from '@/copy/ia-access';
import {
  formatsFromAccessPlanLabel,
  IA_PAUSED_READ_ONLY,
  removeFilterLabel,
  searchChipLabel,
  showingLabel,
  studentCountLabel,
  viaGroupLabel,
} from '@/copy/ia-shared';
import { stateWords } from '@/copy/state-copy';
import {
  CONTENT_ACCESS_ADDRESS,
  destinationPlacement,
  giveAccessAddress,
  groupAddress,
  STUDENT_ACCESS_TITLE,
  studentRecordAddress,
} from '@/nav/institute';
import { INSTITUTE_REQUESTS_ADDRESS } from '@/nav/institute-requests';
import {
  useInstituteGroups,
  useInstituteStanding,
  useStudentAccessRows,
} from '@/queries/student-access';
import { useCommand } from '@/queries/use-command';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { formatCodes } from '../shared/format-codes';
import { grantStatusView } from '../shared/status-model';
import { useInstituteTodayLine } from '../shared/use-today-line';
import {
  type AccessRowView,
  accessRows,
  byExperiment,
  filterRows,
  type Segment,
  segmentsOf,
} from './student-access-view';

const TITLE_ID = 'ia-h1';
const LIST_HEADING_ID = 'sa-list-h';
const SEARCH_ID = 'sa-q';
const VIA_ID = 'sa-via';
const FLASH_ID = 'ia-flash';
const REASON_ID = 'ia-dlg-f';

/**
 * IA-04 Student access — the owner-approved V3 design (design/v3-refined-b/roles/IA-v1,
 * `Main.dc.html` `R.rIA04`, `vm04`), at `/institute/student-access`.
 *
 * - **Read**: `StudentAccessService.listGrants` — one row per student × experiment, individual and
 *   group grants, withdrawn ones included (the Withdrawn segment is a view filter) — with the groups
 *   named from `GroupService.listGroups` and the institution's standing from `getMyOverview` (paused,
 *   ended, no plan yet). Grouped by experiment (its course code and its formats from the plan, once
 *   in the group's head); the status switch counts the rows on show; search (student, ID,
 *   experiment — and a grant's ID, which is never shown) and How given filter them, with a chip each
 *   and Clear filters.
 * - **Act**: "Withdraw…" on an individual grant opens DL-2 with a required reason and sends
 *   `withdrawGrant` with the grant's revision as listed. The dialog names the grant by who and when;
 *   beside a group grant it says the group grant is not changed, and the outcome says the same —
 *   never whether the student can still open the experiment (OD-B2-01). The reason's error is the
 *   service's; a refusal closes the dialog and the page reads again; a failure keeps the dialog and
 *   the reason. The result is said in the flash, which takes focus.
 * - **Read-only while paused** (no Give students access, no Withdraw…); **ended**: the notice with
 *   Request renewal; **no plan yet**: the state that points to Content access.
 */
export function StudentAccess() {
  useShellPage(destinationPlacement('IA-04'));
  const date = useInstituteTodayLine();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const grants = useStudentAccessRows();
  const groups = useInstituteGroups();
  const standing = useInstituteStanding();

  const reads = [grants, groups, standing];
  const failed =
    reads.some((read) => read.isError) || (grants.data !== undefined && !grants.data.ok);
  const loading = !failed && reads.some((read) => read.isPending && !read.data);
  const overview = standing.data?.ok ? standing.data.value : null;
  const paused = overview ? overview.institution.pause !== null : false;
  const ended = overview?.status === 'access-ended';
  const noPlan = overview !== null && overview.plan === null;
  const settled = !loading && !failed && overview !== null;
  const canGive = settled && !paused && !ended && !noPlan;
  const retry = () => {
    for (const read of reads) if (read.isError || (read.data && !read.data.ok)) void read.refetch();
    titleRef.current?.focus();
  };

  const groupNames = useMemo(() => {
    const names = new Map<string, string>();
    if (groups.data?.ok)
      for (const entry of groups.data.value) names.set(entry.group.id, entry.group.name);
    return names;
  }, [groups.data]);
  const rows = useMemo(
    () => (grants.data?.ok ? accessRows(grants.data.value, groupNames, paused) : []),
    [grants.data, groupNames, paused],
  );

  return (
    <>
      <PageHead
        title={STUDENT_ACCESS_TITLE}
        titleId={TITLE_ID}
        titleRef={titleRef}
        titleFocusTarget
        date={date}
        lead={IA04.lead}
        actions={
          canGive ? (
            <ButtonLink variant="primary" size="lg" href={giveAccessAddress()}>
              {IA04.give}
            </ButtonLink>
          ) : null
        }
      />
      {settled && paused ? (
        <Notice tone="paused" icon="lock" title={IA_PAUSED_READ_ONLY} role="status">
          {IA04.pausedLine}
        </Notice>
      ) : null}
      {settled && ended ? (
        <Notice
          tone="off"
          title={IA04.endedTitle}
          role="status"
          actions={
            <ButtonLink variant="navy" href={INSTITUTE_REQUESTS_ADDRESS}>
              {IA04.requestRenewal}
            </ButtonLink>
          }
        >
          {IA04.endedLine}
        </Notice>
      ) : null}
      <AccessList
        rows={rows}
        state={failed ? 'failed' : loading ? 'loading' : noPlan ? 'no-plan' : 'ready'}
        canGive={canGive}
        onRetry={retry}
        reread={() => {
          // A refusal wrote nothing: read the rows and the institution's standing again so the
          // page shows where the records stand now (a stale revision, a pause elsewhere).
          for (const read of reads) void read.refetch();
        }}
      />
    </>
  );
}

/** The flash after a result: the drawn "Done" notice, or a refusal in words. */
interface Flash {
  readonly tone: 'ok' | 'info' | 'warn';
  readonly words: string;
}

/** The open DL-2: the row it names (and its grant's revision as listed), the reason typed. */
interface WithdrawDialog {
  readonly view: AccessRowView;
  readonly reason: string;
  readonly error: string | null;
  readonly unavailable: boolean;
}

function segmentLabel(segment: Segment): string {
  if (segment === 'current') return IA04.current;
  return grantStatusView(segment).words;
}

function AccessList({
  rows,
  state,
  canGive,
  onRetry,
  reread,
}: {
  readonly rows: readonly AccessRowView[];
  readonly state: 'ready' | 'loading' | 'failed' | 'no-plan';
  readonly canGive: boolean;
  readonly onRetry: () => void;
  readonly reread: () => void;
}) {
  const [search, setSearch] = useState('');
  const [via, setVia] = useState<Ia04Via>('all');
  const [segment, setSegment] = useState<Segment>('current');
  const [dialog, setDialog] = useState<WithdrawDialog | null>(null);
  const [flash, setFlash] = useState<Flash | null>(null);
  const [focusFlash, setFocusFlash] = useState(0);
  const flashRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const withdraw = useCommand((ports) => ports.studentAccess.withdrawGrant);

  // The flash takes focus once it is on show (the export's `focusLater('ia-flash')`): after the
  // dialog has given focus back to its trigger in the same commit, so this request wins.
  useEffect(() => {
    if (focusFlash > 0) flashRef.current?.focus();
  }, [focusFlash]);

  const segments = segmentsOf(rows, segment);
  const listed = filterRows(rows, { search, via, segment });
  const ofSegment = segments.find((entry) => entry.segment === segment)?.count ?? 0;
  const chips = [
    ...(search.trim()
      ? [
          {
            key: 'search',
            label: searchChipLabel(search.trim()),
            removeLabel: removeFilterLabel(searchChipLabel(search.trim())),
            onRemove: () => setSearch(''),
            focusId: SEARCH_ID,
          },
        ]
      : []),
    ...(via !== 'all'
      ? [
          {
            key: 'via',
            label: IA04_VIA.find(([value]) => value === via)![1],
            removeLabel: removeFilterLabel(IA04_VIA.find(([value]) => value === via)![1]),
            onRemove: () => setVia('all'),
            focusId: VIA_ID,
          },
        ]
      : []),
  ];
  const clearFilters = () => {
    setSearch('');
    setVia('all');
    setSegment('current');
  };

  const report = (next: Flash) => {
    setDialog(null);
    setFlash(next);
    setFocusFlash((count) => count + 1);
  };

  const open = (view: AccessRowView) => {
    setFlash(null);
    setDialog({ view, reason: '', error: null, unavailable: false });
  };

  const confirm = () => {
    if (!dialog) return;
    const { view, reason } = dialog;
    const { row } = view;
    withdraw.run({ grantId: row.grant.id, reason, expectedRev: row.grant.rev }).then(
      (answer) => {
        if (answer.ok) {
          report({
            tone: 'ok',
            words: view.also
              ? withdrawnAlsoFlash(row.student.fullName, view.also.groupName)
              : withdrawnOnlyFlash(row.student.fullName, row.experimentName),
          });
          return;
        }
        const reasonError = reasonMessage(answer.error);
        if (reasonError !== null) {
          setDialog((current) => (current ? { ...current, error: reasonError } : current));
          return;
        }
        report(
          answer.error.kind === 'policy-open'
            ? { tone: 'info', words: stateWords('IA-04.withdraw.policy-open') }
            : { tone: 'warn', words: stateWords('IA-04.withdraw.refused') },
        );
        reread();
      },
      () => {
        // Unavailable: nothing was withdrawn; the dialog keeps the reason (state-copy).
        setDialog((current) => (current ? { ...current, unavailable: true } : current));
      },
    );
  };

  const ready = state === 'ready';
  const tools = ready && rows.length > 0;
  const dialogView = dialog?.view ?? null;
  const dialogRow = dialogView?.row ?? null;

  return (
    <>
      <FlashArea flash={flash} flashRef={flashRef} />
      <IaManageSurface labelledBy={LIST_HEADING_ID} hiddenTitle={IA04.listHeading}>
        {tools ? (
          <IaManageTools>
            <IaManageFilters label={IA04.filterLabel}>
              <IaManageSearch
                id={SEARCH_ID}
                label={IA04.searchLabel}
                placeholder={IA04.searchPlaceholder}
                value={search}
                onChange={setSearch}
                inputRef={searchRef}
              />
              <IaManageSelect
                id={VIA_ID}
                label={IA04.viaLabel}
                value={via}
                options={IA04_VIA.map(([value, label]) => ({ value, label }))}
                onChange={(value) => setVia(value as Ia04Via)}
              />
            </IaManageFilters>
            <IaSegments
              label={IA04.segmentsLabel}
              segments={segments.map((entry) => ({
                key: entry.segment,
                label: segmentLabel(entry.segment),
                count: entry.count,
              }))}
              value={segment}
              onChange={setSegment}
            />
            {chips.length > 0 ? (
              <IaManageStatus
                shown={showingLabel(listed.length, ofSegment)}
                chips={chips}
                clearLabel={IA04.clearFilters}
                onClear={clearFilters}
                clearFocusId={SEARCH_ID}
              />
            ) : null}
          </IaManageTools>
        ) : null}
        {tools ? (
          <IaLiveLine>
            {rowsShownWords(listed.length, segment === 'current' ? null : segmentLabel(segment))}
          </IaLiveLine>
        ) : null}
        {state === 'failed' ? (
          <ListState
            kind="failed"
            title={IA04.failedTitle}
            action={<Button onClick={onRetry}>{IA04.tryAgain}</Button>}
          >
            {IA04.failedLine}
          </ListState>
        ) : state === 'loading' ? (
          <LoadingRows message={IA04.loading} rows={1} cells={[2, 1, 1, 1, 1]} />
        ) : state === 'no-plan' ? (
          <ListState
            kind="none"
            roomy
            titleAs="h2"
            title={IA04.noPlanTitle}
            action={<ButtonLink href={CONTENT_ACCESS_ADDRESS}>{IA04.contentAccess}</ButtonLink>}
          >
            {IA04.noPlanLine}
          </ListState>
        ) : rows.length === 0 ? (
          <ListState kind="empty" roomy titleAs="h2" icon="user" title={IA04.emptyTitle}>
            {canGive ? IA04.emptyLine : IA04.emptyNoGive}
          </ListState>
        ) : listed.length === 0 ? (
          <NoneState
            filtered={chips.length > 0}
            segment={segment}
            onShowAll={() => {
              clearFilters();
              searchRef.current?.focus();
            }}
          />
        ) : (
          <>
            <AccessTable rows={listed} onWithdraw={open} />
            <IaManageFoot>{IA04.foot}</IaManageFoot>
          </>
        )}
      </IaManageSurface>
      <ConfirmDialog
        open={dialog !== null}
        destructive
        initialFocus="field"
        returnFocusFallback={flashRef}
        idPrefix="ia-dlg"
        title={
          dialogRow === null
            ? ''
            : dialogView?.also
              ? withdrawAlsoTitle(dialogRow.student.fullName)
              : WITHDRAW.titleOnly
        }
        description={
          dialogRow === null
            ? undefined
            : dialogView?.also
              ? withdrawAlsoBody(dialogRow.student.fullName, dayMonthYear(dialogRow.grant.givenAt))
              : withdrawOnlyBody(dialogRow.student.fullName, dialogRow.experimentName)
        }
        confirmLabel={dialogView?.also ? WITHDRAW.confirmAlso : WITHDRAW.confirmOnly}
        cancelLabel={WITHDRAW.cancel}
        busyLook
        busy={withdraw.busy}
        busyLabel={WITHDRAW.busy}
        onConfirm={confirm}
        onCancel={() => setDialog(null)}
      >
        {dialogRow !== null && dialogView?.also ? (
          <Notice tone="info" icon="infoNote" title={WITHDRAW.noteTitle}>
            {withdrawAlsoNote(
              dialogRow.student.fullName,
              dialogView.also.groupName,
              dialogRow.experimentName,
            )}
          </Notice>
        ) : null}
        {dialog?.unavailable ? (
          <Notice
            tone="warn"
            icon="alertCircle"
            role="alert"
            title={stateWords('IA-04.withdraw.unavailable')}
          />
        ) : null}
        <Field
          id={REASON_ID}
          label={WITHDRAW.reasonLabel}
          hint={WITHDRAW.reasonHint}
          error={dialog?.error ?? undefined}
        >
          <Textarea
            value={dialog?.reason ?? ''}
            onChange={(event) => {
              const reason = event.target.value;
              setDialog((current) =>
                current ? { ...current, reason, error: null, unavailable: false } : current,
              );
            }}
          />
        </Field>
      </ConfirmDialog>
    </>
  );
}

/** The reason's error from a validation refusal (the service's drawn words), else `null`. */
function reasonMessage(error: ServiceError): string | null {
  if (error.kind !== 'validation-failed') return null;
  const item = error.fieldErrors.find((entry) => entry.field.split('.')[0] === 'reason');
  return item?.message ?? WITHDRAW.reasonRequired;
}

function FlashArea({
  flash,
  flashRef,
}: {
  readonly flash: Flash | null;
  readonly flashRef: RefObject<HTMLDivElement | null>;
}) {
  if (!flash) return null;
  return flash.tone === 'ok' ? (
    <Notice tone="ok" id={FLASH_ID} ref={flashRef} role="status" title={IA04.flashTitle}>
      {flash.words}
    </Notice>
  ) : (
    <Notice
      tone={flash.tone}
      icon={flash.tone === 'info' ? 'infoNote' : 'alertCircle'}
      id={FLASH_ID}
      ref={flashRef}
      role="status"
      title={flash.words}
    />
  );
}

/** The no-match state (`V.noneR`): its words by why nothing shows, and "Show all current grants". */
function NoneState({
  filtered,
  segment,
  onShowAll,
}: {
  readonly filtered: boolean;
  readonly segment: Segment;
  readonly onShowAll: () => void;
}) {
  const words = filtered
    ? IA04_NONE.filtered
    : segment === 'current'
      ? IA04_NONE.current
      : IA04_NONE.status;
  return (
    <ListState
      kind="nomatch"
      title={words.title}
      action={<Button onClick={onShowAll}>{IA04.showAllCurrent}</Button>}
    >
      {words.line}
    </ListState>
  );
}

/** The table grouped by experiment (`table.ia-gt`): Student · How given · Status · (Action). */
function AccessTable({
  rows,
  onWithdraw,
}: {
  readonly rows: readonly AccessRowView[];
  readonly onWithdraw: (view: AccessRowView) => void;
}) {
  return (
    <IaGroupedTable
      caption={IA04.caption}
      headers={{
        who: IA04.columns.student,
        how: IA04.columns.howGiven,
        status: IA04.columns.status,
        action: IA04.columns.action,
      }}
      groups={byExperiment(rows).map((group) => {
        const codes = formatCodes(group.formats);
        return {
          key: group.experimentId,
          title: group.name,
          code: group.courseCode ?? '',
          formats: codes,
          formatsLabel: formatsFromAccessPlanLabel(codes),
          count: studentCountLabel(group.rows.length),
          rows: group.rows.map((view) => {
            const { row } = view;
            const withdrawal = row.grant.withdrawal;
            const notes = [
              ...(withdrawal &&
              (row.display === 'withdrawn' || row.display === 'individual-grant-withdrawn')
                ? [withdrawnNote(dayMonthYear(withdrawal.at), withdrawal.reason)]
                : []),
              ...(row.display === 'waiting-for-a-licence'
                ? [noLicenceNote(row.student.fullName)]
                : []),
            ];
            return {
              key: view.key,
              name: row.student.fullName,
              href: studentRecordAddress(row.student.id),
              sub: row.student.institutionStudentId,
              how: (
                <IaGrantHow
                  how={
                    view.group
                      ? {
                          kind: 'group',
                          words: viaGroupLabel(view.group.name),
                          href: groupAddress(view.group.id),
                        }
                      : { kind: 'individual', words: IA04.individually }
                  }
                  date={dayMonthYear(row.grant.givenAt)}
                  also={
                    view.also
                      ? alsoInGroupWords(view.also.groupName, row.grant.state === 'withdrawn')
                      : undefined
                  }
                />
              ),
              status: (
                <IaStatusNotes
                  status={
                    <StatusPill tone={grantStatusView(row.display).tone}>
                      {grantStatusView(row.display).words}
                    </StatusPill>
                  }
                  notes={notes}
                />
              ),
              action: view.canWithdraw ? (
                <Button
                  id={`sa-wd-${row.grant.id}`}
                  aria-label={withdrawAria(
                    row.student.fullName,
                    row.experimentName,
                    view.also !== null,
                  )}
                  onClick={() => onWithdraw(view)}
                >
                  {IA04.withdraw}
                </Button>
              ) : null,
              muted: row.display === 'withdrawn',
            };
          }),
        };
      })}
    />
  );
}
