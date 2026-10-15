'use client';

import type { GrantRow, ServiceError } from '@xr/contracts/draft';
import { FORMAT_META, inDisplayOrder } from '@xr/domain';
import {
  Button,
  EmptyState,
  Field,
  FormatSet,
  Icon,
  Link,
  LoadingState,
  NoMatch,
  Notice,
  PageContent,
  PageHeader,
  ReasonDialog,
  Select,
  Skeleton,
  StatusPill,
  type StatusTone,
  Textarea,
  TextInput,
} from '@xr/ui';
import { type RefObject, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { dayMonthYear } from '@/copy/dates';
import { grantWords, wordsOf } from '@/copy/flow-state-words';
import { stateWords } from '@/copy/state-copy';
import {
  alsoInGroupNotice,
  alsoInGroupWords,
  firstName,
  removeChipLabel,
  rowCountWords,
  searchChip,
  showWithdrawnLabel,
  STATUS_FILTER,
  type StatusFilter,
  statusChip,
  STUDENT_ACCESS_PAGE,
  VIA_FILTER,
  type ViaFilter,
  viaChip,
  viaGroupWords,
  WITHDRAW_DIALOG,
  withdrawAlsoTitle,
  withdrawLabel,
  withdrawnAlsoFlash,
  withdrawnOnlyFlash,
  withdrawnOnWords,
} from '@/copy/student-access';
import {
  destinationPlacement,
  giveAccessAddress,
  STUDENT_ACCESS_TITLE,
  studentRecordAddress,
} from '@/nav/institute';
import {
  useInstituteGroups,
  useInstituteStanding,
  useStudentAccessRows,
} from '@/queries/student-access';
import { useCommand } from '@/queries/use-command';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { type AccessRowView, accessRows, filterRows } from './student-access-view';

/**
 * IA-04 Student access — board B2-04 ("Who can open which experiments"), at
 * `/institute/student-access`.
 *
 * - **Read**: `StudentAccessService.listGrants` — one row per student × experiment, individual and
 *   group grants, withdrawn ones included (the toggle is a view filter) — with the groups named
 *   from `GroupService.listGroups` and the institution's pause from `getMyOverview`. Search
 *   (student, ID, experiment or grant ID), Status, How given and "Show withdrawn (n)" filter the
 *   rows on show, as B2-04's script does; the count, the chips and "Clear filters" follow it.
 * - **Act**: "Withdraw…" on an individual grant opens DL-2 with a required reason and sends
 *   `withdrawGrant` with the grant's revision as listed. The dialog names only that grant; beside
 *   a group grant it says the group grant is not changed (f2) and the outcome says the same (f4) —
 *   never whether the student can still open the experiment (OD-B2-01, B2-13 f8). The reason
 *   error is the service's; a refusal closes the dialog and the page reads again; a failure keeps
 *   the dialog and the reason. The result is said in the flash, which takes focus.
 * - **Read-only while paused** (f12): no Give students access, no Withdraw…; rows stay readable.
 * - Not rendered (DEV-21): "Change on the group" (IA-14 is not built).
 */
export function StudentAccess() {
  useShellPage(destinationPlacement('IA-04'));
  const grants = useStudentAccessRows();
  const groups = useInstituteGroups();
  const standing = useInstituteStanding();

  const reads = [grants, groups, standing];
  const failed = reads.some((read) => read.isError);
  const loading = !failed && reads.some((read) => read.isPending && !read.data);
  const paused = standing.data?.ok ? standing.data.value.institution.pause !== null : false;
  const retry = () => {
    for (const read of reads) if (read.isError) void read.refetch();
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
  const settled = !loading && !failed && standing.data !== undefined;

  return (
    <PageContent wrap="wide">
      <PageHeader
        className="mb-6"
        title={STUDENT_ACCESS_TITLE}
        meta={STUDENT_ACCESS_PAGE.meta}
        actions={
          settled && !paused ? (
            <Link className="xr-btn xr-btn--primary" href={giveAccessAddress()}>
              {STUDENT_ACCESS_PAGE.give}
            </Link>
          ) : null
        }
      />
      {settled && paused ? (
        <div className="mb-4">
          <Notice tone="warn" icon="readOnly" title={STUDENT_ACCESS_PAGE.pausedTitle}>
            {STUDENT_ACCESS_PAGE.pausedLine}
          </Notice>
        </div>
      ) : null}
      {failed ? (
        <FailedSection onRetry={retry} />
      ) : loading ? (
        <LoadingState label={STUDENT_ACCESS_PAGE.loading} skeleton={<SkeletonRows />} />
      ) : (
        <AccessList
          rows={rows}
          paused={paused}
          reread={() => {
            // A refusal wrote nothing: read the rows and the institution's standing again so the
            // page shows where the records stand now (a stale revision, a pause elsewhere).
            for (const read of reads) void read.refetch();
          }}
        />
      )}
    </PageContent>
  );
}

/** The flash after a result (B2-04 `Sa-flash`): the drawn ok notice, or a provisional refusal. */
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

function AccessList({
  rows,
  paused,
  reread,
}: {
  readonly rows: readonly AccessRowView[];
  readonly paused: boolean;
  readonly reread: () => void;
}) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [via, setVia] = useState<ViaFilter>('all');
  const [showWithdrawn, setShowWithdrawn] = useState(false);
  const [dialog, setDialog] = useState<WithdrawDialog | null>(null);
  const [flash, setFlash] = useState<Flash | null>(null);
  const [focusFlash, setFocusFlash] = useState(0);
  const flashRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const withdraw = useCommand((ports) => ports.studentAccess.withdrawGrant);

  // The flash takes focus once it is on show (B2-04 `focus(pid + '-flash')`): after the dialog
  // has given focus back to its trigger in the same commit, so this request wins.
  useEffect(() => {
    if (focusFlash > 0) flashRef.current?.focus();
  }, [focusFlash]);

  const { listed, shown, withdrawn } = filterRows(rows, { search, status, via, showWithdrawn });
  const chips = [
    ...(search.trim()
      ? [{ key: 'search', label: searchChip(search.trim()), remove: () => setSearch('') }]
      : []),
    ...(status !== 'all'
      ? [
          {
            key: 'status',
            label: statusChip(STATUS_FILTER.find(([value]) => value === status)![1]),
            remove: () => setStatus('all'),
          },
        ]
      : []),
    ...(via !== 'all' ? [{ key: 'via', label: viaChip(via), remove: () => setVia('all') }] : []),
  ];
  const clearFilters = () => {
    setSearch('');
    setStatus('all');
    setVia('all');
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
            words:
              row.alsoInGroupGrant !== null
                ? withdrawnAlsoFlash(
                    row.grant.id,
                    row.student.fullName,
                    view.alsoGroupName ?? row.alsoInGroupGrant,
                    row.alsoInGroupGrant,
                  )
                : withdrawnOnlyFlash(row.grant.id, row.student.fullName, row.experimentName),
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

  if (rows.length === 0) {
    return (
      <>
        <FlashArea flash={flash} flashRef={flashRef} />
        <div className="xr-section">
          <EmptyState
            icon="studentAccess"
            title={STUDENT_ACCESS_PAGE.emptyTitle}
            actions={
              paused ? null : (
                <div className="flex flex-wrap gap-3">
                  <Link className="xr-btn xr-btn--secondary" href={giveAccessAddress()}>
                    {STUDENT_ACCESS_PAGE.give}
                  </Link>
                </div>
              )
            }
          >
            {STUDENT_ACCESS_PAGE.emptyLine}
          </EmptyState>
        </div>
      </>
    );
  }

  const dialogRow = dialog?.view.row ?? null;
  const also = dialogRow !== null && dialogRow.alsoInGroupGrant !== null;

  return (
    <>
      <FlashArea flash={flash} flashRef={flashRef} />
      <Toolbar
        search={search}
        onSearch={setSearch}
        searchRef={searchRef}
        status={status}
        onStatus={setStatus}
        via={via}
        onVia={setVia}
        count={rowCountWords(listed.length, shown, chips.length > 0)}
        chips={chips}
        onClear={chips.length > 0 ? clearFilters : undefined}
      />
      {withdrawn > 0 ? (
        <label className="xr-check min-h-8 px-0 pt-0 pb-3 text-[15px]">
          <input
            type="checkbox"
            checked={showWithdrawn}
            onChange={() => setShowWithdrawn((current) => !current)}
          />
          {showWithdrawnLabel(withdrawn)}
        </label>
      ) : null}
      {listed.length > 0 ? (
        <AccessTable rows={listed} onWithdraw={open} />
      ) : (
        <div className="xr-section">
          <NoMatch
            title={STUDENT_ACCESS_PAGE.noMatchTitle}
            onClearFilters={() => {
              clearFilters();
              searchRef.current?.focus();
            }}
          />
        </div>
      )}
      <ReasonDialog
        open={dialog !== null}
        align="start"
        returnFocusFallback={flashRef}
        idPrefix="student-access-withdraw"
        destructive
        title={
          dialogRow === null
            ? ''
            : also
              ? withdrawAlsoTitle(dialogRow.student.fullName)
              : WITHDRAW_DIALOG.titleOnly
        }
        effect={dialog === null ? null : <WithdrawEffect view={dialog.view} />}
        confirmLabel={also ? WITHDRAW_DIALOG.confirmAlso : WITHDRAW_DIALOG.confirmOnly}
        busy={withdraw.busy}
        busyLabel={WITHDRAW_DIALOG.busy}
        cancelLabel={WITHDRAW_DIALOG.cancel}
        onConfirm={confirm}
        onCancel={() => setDialog(null)}
      >
        {dialog !== null && dialog.view.row.alsoInGroupGrant !== null ? (
          <Notice>
            <AlsoInGroupNotice view={dialog.view} />
          </Notice>
        ) : null}
        {dialog?.unavailable ? (
          <Notice tone="err">{stateWords('IA-04.withdraw.unavailable')}</Notice>
        ) : null}
        <Field
          id="student-access-reason"
          label={WITHDRAW_DIALOG.reasonLabel}
          marker={WITHDRAW_DIALOG.reasonMarker}
          hint={WITHDRAW_DIALOG.reasonHint}
          error={dialog?.error ?? undefined}
        >
          <Textarea
            className="min-h-[96px]"
            value={dialog?.reason ?? ''}
            onChange={(event) => {
              const reason = event.target.value;
              setDialog((current) =>
                current ? { ...current, reason, error: null, unavailable: false } : current,
              );
            }}
          />
        </Field>
      </ReasonDialog>
    </>
  );
}

/** The reason's error from a validation refusal (the service's drawn words), else `null`. */
function reasonMessage(error: ServiceError): string | null {
  if (error.kind !== 'validation-failed') return null;
  const item = error.fieldErrors.find((entry) => entry.field.split('.')[0] === 'reason');
  return item?.message ?? WITHDRAW_DIALOG.reasonRequired;
}

/** B2-04 `dAlso` notice: the group grant, by its ID, is not changed. */
function AlsoInGroupNotice({ view }: { readonly view: AccessRowView }) {
  const { row } = view;
  if (row.alsoInGroupGrant === null) return null;
  const words = alsoInGroupNotice(
    firstName(row.student.fullName),
    view.alsoGroupName ?? row.alsoInGroupGrant,
    row.experimentName,
  );
  return (
    <>
      {words.before}
      <span className="xr-id">{row.alsoInGroupGrant}</span>
      {words.after}
    </>
  );
}

/** B2-04 DL-2 body (`dOnly` / `dAlso`): names only the grant being withdrawn. */
function WithdrawEffect({ view }: { readonly view: AccessRowView }) {
  const { row } = view;
  if (row.alsoInGroupGrant !== null) {
    return (
      <>
        {WITHDRAW_DIALOG.also.withdraws}
        <span className="xr-id">{row.grant.id}</span>
        {WITHDRAW_DIALOG.also.givenTo}
        <strong className="text-ink">{row.student.fullName}</strong>
        {WITHDRAW_DIALOG.also.individually}
      </>
    );
  }
  return (
    <>
      <span className="xr-id">{row.grant.id}</span>
      {WITHDRAW_DIALOG.only.is}
      <strong className="text-ink">{row.student.fullName}</strong>
      {WITHDRAW_DIALOG.only.onlyGrantFor}
      <strong className="text-ink">{row.experimentName}</strong>
      {WITHDRAW_DIALOG.only.so(firstName(row.student.fullName))}
    </>
  );
}

function FlashArea({
  flash,
  flashRef,
}: {
  readonly flash: Flash | null;
  readonly flashRef: RefObject<HTMLDivElement | null>;
}) {
  return (
    <div ref={flashRef} tabIndex={-1} className={flash ? 'mb-4' : undefined}>
      {flash ? <Notice tone={flash.tone}>{flash.words}</Notice> : null}
    </div>
  );
}

interface Chip {
  readonly key: string;
  readonly label: string;
  readonly remove: () => void;
}

/**
 * B2-04 toolbar: search, Status and How given (`xr-filter-2`, which leaves the bar below 600 px
 * of content, f6), then the count (`role="status"`), the chips and "Clear filters". When a chip's
 * remove button or "Clear filters" goes with the focus on it, focus moves to the next chip, else
 * the previous one, else the search (as the shared list toolbar does).
 */
function Toolbar({
  search,
  onSearch,
  searchRef,
  status,
  onStatus,
  via,
  onVia,
  count,
  chips,
  onClear,
}: {
  readonly search: string;
  readonly onSearch: (value: string) => void;
  readonly searchRef: RefObject<HTMLInputElement | null>;
  readonly status: StatusFilter;
  readonly onStatus: (value: StatusFilter) => void;
  readonly via: ViaFilter;
  readonly onVia: (value: ViaFilter) => void;
  readonly count: string;
  readonly chips: readonly Chip[];
  readonly onClear: (() => void) | undefined;
}) {
  const chipButtons = useRef(new Map<string, HTMLButtonElement>());
  const pending = useRef<{ readonly control: HTMLElement; readonly index: number } | null>(null);
  useLayoutEffect(() => {
    const pressed = pending.current;
    if (pressed === null || pressed.control.isConnected) return;
    pending.current = null;
    const active = document.activeElement;
    if (active && active !== document.body && active.isConnected) return;
    const remaining = chips
      .map((chip) => chipButtons.current.get(chip.key))
      .filter((button): button is HTMLButtonElement => Boolean(button));
    (remaining[pressed.index] ?? remaining[pressed.index - 1] ?? searchRef.current)?.focus();
  });

  return (
    <>
      <div className="xr-toolbar">
        <Field
          id="student-access-search"
          label={STUDENT_ACCESS_PAGE.searchLabel}
          className="xr-toolbar-search"
        >
          <TextInput
            ref={searchRef}
            type="search"
            placeholder={STUDENT_ACCESS_PAGE.searchPlaceholder}
            value={search}
            onChange={(event) => onSearch(event.target.value)}
          />
        </Field>
        <Field id="student-access-status" label={STUDENT_ACCESS_PAGE.statusLabel}>
          <Select
            options={STATUS_FILTER.map(([value, label]) => ({ value, label }))}
            value={status}
            onChange={(event) => onStatus(event.target.value as StatusFilter)}
          />
        </Field>
        <Field id="student-access-via" label={STUDENT_ACCESS_PAGE.viaLabel} className="xr-filter-2">
          <Select
            options={VIA_FILTER.map(([value, label]) => ({ value, label }))}
            value={via}
            onChange={(event) => onVia(event.target.value as ViaFilter)}
          />
        </Field>
      </div>
      <div className="xr-toolbar-status">
        <span className="xr-meta" role="status">
          {count}
        </span>
        {chips.map((chip, index) => (
          <span key={chip.key} className="xr-fchip">
            {chip.label}
            <button
              ref={(element) => {
                if (element) chipButtons.current.set(chip.key, element);
                else chipButtons.current.delete(chip.key);
              }}
              type="button"
              aria-label={removeChipLabel(chip.label)}
              onClick={(event) => {
                pending.current = { control: event.currentTarget, index };
                chip.remove();
              }}
            >
              <Icon name="close" size={16} />
            </button>
          </span>
        ))}
        {onClear ? (
          <Button
            variant="text"
            onClick={(event) => {
              pending.current = { control: event.currentTarget, index: 0 };
              onClear();
            }}
          >
            {STUDENT_ACCESS_PAGE.clearFilters}
          </Button>
        ) : null}
      </div>
    </>
  );
}

const STATUS_TONE: Readonly<Record<GrantRow['display'], StatusTone>> = {
  active: 'ok',
  'waiting-for-a-licence': 'wait',
  'student-inactive': 'off',
  withdrawn: 'off',
  'individual-grant-withdrawn': 'off',
  'access-ended': 'off',
  paused: 'paused',
};

/** B2-04 table: Student · Experiment · Formats (from your plan) · How given · Status · (Action). */
function AccessTable({
  rows,
  onWithdraw,
}: {
  readonly rows: readonly AccessRowView[];
  readonly onWithdraw: (view: AccessRowView) => void;
}) {
  const { columns } = STUDENT_ACCESS_PAGE;
  return (
    <div className="xr-table-wrap">
      <table className="xr-table">
        <caption className="xr-sr">{STUDENT_ACCESS_PAGE.caption}</caption>
        <thead>
          <tr>
            <th scope="col">{columns.student}</th>
            <th scope="col">{columns.experiment}</th>
            <th scope="col">
              {columns.formats} <span className="xr-opt">{columns.formatsMarker}</span>
            </th>
            <th scope="col">{columns.howGiven}</th>
            <th scope="col">{columns.status}</th>
            <th scope="col">
              <span className="xr-sr">{columns.action}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((view) => (
            <AccessTableRow key={view.key} view={view} onWithdraw={onWithdraw} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AccessTableRow({
  view,
  onWithdraw,
}: {
  readonly view: AccessRowView;
  readonly onWithdraw: (view: AccessRowView) => void;
}) {
  const { row } = view;
  const { columns } = STUDENT_ACCESS_PAGE;
  const words = wordsOf(grantWords(row.display));
  const withdrawal = row.grant.withdrawal;
  return (
    <tr>
      <td className="is-primary">
        <Link href={studentRecordAddress(row.student.id)} className="font-[700]">
          {row.student.fullName}
        </Link>
        <span className="xr-sub xr-id">{row.student.institutionStudentId}</span>
      </td>
      <td data-label={columns.experiment}>
        {row.experimentName}
        {row.courseCode ? <span className="xr-sub">{row.courseCode}</span> : null}
      </td>
      <td data-label={columns.formatsLabel}>
        <FormatSet
          compact
          formats={inDisplayOrder(row.formats).map((format) => FORMAT_META[format].code)}
        />
      </td>
      <td data-label={columns.howGiven}>
        {view.via === 'grp' && view.groupName !== null
          ? viaGroupWords(view.groupName)
          : STUDENT_ACCESS_PAGE.individually}
        <span className="xr-sub">
          {dayMonthYear(row.grant.givenAt)} · <span className="xr-id">{row.grant.id}</span>
        </span>
        {row.alsoInGroupGrant !== null ? (
          <span className="xw-also">
            <Icon name="studentsPeople" size={16} />
            <span>
              {alsoInGroupWords(view.alsoGroupName ?? row.alsoInGroupGrant)} ·{' '}
              <span className="xr-id">{row.alsoInGroupGrant}</span>
            </span>
          </span>
        ) : null}
      </td>
      <td data-label={columns.status}>
        {words !== null ? <StatusPill tone={STATUS_TONE[row.display]}>{words}</StatusPill> : null}
        {withdrawal ? (
          <span className="xr-sub">{withdrawnOnWords(dayMonthYear(withdrawal.at))}</span>
        ) : null}
      </td>
      <td>
        {view.canWithdraw ? (
          <Button
            id={`student-access-withdraw-${row.grant.id}`}
            variant="danger-quiet"
            size="sm"
            aria-label={withdrawLabel(
              row.student.fullName,
              row.experimentName,
              row.alsoInGroupGrant !== null,
            )}
            onClick={() => onWithdraw(view)}
          >
            {STUDENT_ACCESS_PAGE.withdraw}
          </Button>
        ) : null}
        {withdrawal ? <span className="xr-small text-ink-3">{withdrawal.reason}</span> : null}
      </td>
    </tr>
  );
}

/** B2-04 f11 "Failed + retry": the failed empty state, "Nothing has changed. Try again." */
function FailedSection({ onRetry }: { readonly onRetry: () => void }) {
  return (
    <div className="xr-section">
      <div className="xr-empty">
        <span className="xr-empty-icon bg-err-bg text-err">
          <Icon name="failed" />
        </span>
        <h2 className="xr-h3">{STUDENT_ACCESS_PAGE.failedTitle}</h2>
        <p className="xr-body">{STUDENT_ACCESS_PAGE.failedLine}</p>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary" icon="tryAgain" onClick={onRetry}>
            {STUDENT_ACCESS_PAGE.tryAgain}
          </Button>
        </div>
      </div>
    </div>
  );
}

/** B2-04 f10 "Loading": four skeleton rows in the table's shape (hidden from screen readers). */
function SkeletonRows() {
  return (
    <div aria-hidden="true">
      {[0, 1, 2, 3].map((row) => (
        <div
          key={row}
          className="grid grid-cols-[1.2fr_1.2fr_120px_1fr_120px_100px] gap-5 px-4 py-[18px] [border-block-start:1px_solid_var(--xr-line)]"
        >
          {[0, 1, 2, 3, 4, 5].map((cell) => (
            <Skeleton key={cell} />
          ))}
        </div>
      ))}
    </div>
  );
}
