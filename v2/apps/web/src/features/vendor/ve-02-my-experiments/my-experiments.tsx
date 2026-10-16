'use client';

import { FORMAT_META, inDisplayOrder } from '@xr/domain';
import {
  Button,
  Checkbox,
  EmptyState,
  Field,
  FormatBadge,
  Icon,
  Link,
  LoadingState,
  NoMatch,
  PageContent,
  PageHeader,
  SectionBody,
  Select,
  Skeleton,
  StatusPill,
  TextInput,
} from '@xr/ui';
import { type ReactNode, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { dayMonthYear } from '@/copy/dates';
import { stateWords } from '@/copy/state-copy';
import {
  CREATE_EXPERIMENT,
  experimentCountWords,
  MY_EXPERIMENTS_WORDS,
  STATUS_FILTER_OPTIONS,
  VENDOR_FAILED_WORDS,
} from '@/copy/vendor-home';
import { useAppNavigation } from '@/nav/navigation';
import {
  experimentRecordAddress,
  MY_EXPERIMENTS_TITLE,
  myExperimentsAddress,
  myExperimentsPlacement,
  newExperimentAddress,
} from '@/nav/vendor';
import { usePublicStructure } from '@/queries/catalogue';
import { type MyExperimentsStatus, useMyExperiments } from '@/queries/production';
import { useCurrentSession, useSession } from '@/queries/session';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { useRetryFocus } from '../ve-01-overview/retry-focus';
import {
  changedRecently,
  type MyExperimentRow,
  rowAction,
  rowStatus,
  statusFilterOf,
  withWho,
} from './experiment-rows';

const SECTION_HEADING = 'my-experiments-heading';
const SEARCH_ID = 'my-experiments-search';
const STATUS_ID = 'my-experiments-status';
const RECENT_ID = 'my-experiments-recent';

/**
 * VE-02 My experiments — board B5-02 (“Where is each of my experiments?”) f0 … f5, at
 * `/vendor/experiments` (`?status=`).
 *
 * - **Reads**: `ProductionService.listMyExperiments` twice — every experiment the Vendor created
 *   (the count's whole and the empty state) and the list for the search and Status filter on show
 *   (the service filters and searches, newest change first) — and the public catalogue's course
 *   cards for each course's platform code (state-copy `VE-02.course-code`). Every role's command in
 *   the tab refreshes the list (B5-08 f3: “Status and “With” follow the same record”).
 * - **As B5-02 draws it**: the overline, “My experiments”, its line and the one primary “Create
 *   experiment”; “All your experiments” with the toolbar — the search (“Name, ID or course”), the
 *   Status filter (All statuses · Draft · Submitted · With Academic Reviewer · Returned · With
 *   Content Manager · Published) and “Changed in the last 7 days” — the count “6 of 6
 *   experiments” (announced) with “Clear filters” while a filter is applied (f1), and the table
 *   Experiment (the name opens the record; the SUB id · course code) · Formats · Status · last
 *   change · With · one action (Revise / Edit draft / Open). Below 760 px of content the rows stack
 *   as labelled blocks (f4, f5). f2: “No experiments match” with “Clear filters”; f3: “You haven’t
 *   created an experiment yet” with “Create experiment”.
 * - The Status filter lives here while the page is on show and the address mirrors it (replaced,
 *   no history entry); an address from outside (Back) is read again. The search and the checkbox
 *   stay on the page (state-copy `VE-02.status-filter`). “Changed in the last 7 days” narrows the
 *   rows against the sample clock (state-copy `VE-02.changed-recently`).
 * - Undrawn: loading and failed with “Try again” (state-copy `VE-02.loading`, `VE-02.failed`).
 *   Nothing here changes a record: every action opens the page where the work is done.
 */
export function MyExperiments() {
  useShellPage(myExperimentsPlacement());
  const navigation = useAppNavigation();
  const session = useSession();
  const now = session.status === 'signed-in' ? session.signedInAt : null;
  const current = useCurrentSession();
  const organisation = current.data?.ok ? (current.data.value?.session.organisation ?? null) : null;

  const addressed = statusFilterOf(navigation.search);
  const [status, setStatus] = useState<MyExperimentsStatus | null>(addressed);
  const [seenSearch, setSeenSearch] = useState(navigation.search);
  if (navigation.search !== seenSearch) {
    setSeenSearch(navigation.search);
    setStatus(addressed);
  }
  const [search, setSearch] = useState('');
  const [recent, setRecent] = useState(false);

  const everything = useMyExperiments();
  const list = useMyExperiments({ status, search });
  const structure = usePublicStructure();

  const failedRead = (read: typeof list) =>
    read.isError || (read.data !== undefined && !read.data.ok);
  const failed = failedRead(everything) || failedRead(list);
  const all = everything.data?.ok ? everything.data.value : null;
  const rows = list.data?.ok ? list.data.value : null;
  const codesSettled = structure.data !== undefined || structure.isError;
  const loading = !failed && (all === null || rows === null || !codesSettled);
  const retried = useRetryFocus(!loading && !failed);

  const codes = useMemo(
    () =>
      new Map<string, string | null>(
        structure.data?.ok
          ? structure.data.value.flatMap((entry) =>
              entry.courses.map((course) => [course.id, course.platformCode] as const),
            )
          : [],
      ),
    [structure.data],
  );

  const shown = (rows ?? []).filter(
    (row) => !recent || now === null || changedRecently(row.submission.updatedAt, now),
  );
  const total = all?.length ?? 0;
  const filtered = search.trim() !== '' || status !== null || recent;

  // The count is announced (`role="status"`): while a new search's or filter's rows load, the rows
  // on show are the previous answer's, so the count keeps its last settled words.
  const settled =
    loading || failed || list.isPlaceholderData ? null : experimentCountWords(shown.length, total);
  const [countWords, setCountWords] = useState('');
  if (settled !== null && settled !== countWords) setCountWords(settled);

  const changeStatus = (next: MyExperimentsStatus | null) => {
    setStatus(next);
    navigation.replace(myExperimentsAddress(next ?? undefined));
  };

  // “Clear filters” goes with the filters (the status row's) or with the no-match state: focus
  // moves to the search box once it has gone, only if it had focus and nothing else took it.
  const searchRef = useRef<HTMLInputElement>(null);
  const pressed = useRef<HTMLElement | null>(null);
  useLayoutEffect(() => {
    const control = pressed.current;
    if (control === null || control.isConnected) return;
    pressed.current = null;
    const active = document.activeElement;
    if (active && active !== document.body && active.isConnected) return;
    searchRef.current?.focus();
  });
  const clear = () => {
    const active = document.activeElement;
    pressed.current = active instanceof HTMLElement ? active : null;
    setSearch('');
    setRecent(false);
    if (status !== null) changeStatus(null);
  };

  const retry = () => {
    retried();
    if (failedRead(everything)) void everything.refetch();
    if (failedRead(list)) void list.refetch();
  };

  let body: ReactNode;
  if (failed) {
    body = (
      <ListSection>
        <Failed onRetry={retry} />
      </ListSection>
    );
  } else if (loading) {
    body = (
      <ListSection>
        <LoadingRows />
      </ListSection>
    );
  } else if (total === 0) {
    body = (
      <div className="xr-section">
        <EmptyState
          icon="myExperiments"
          title={MY_EXPERIMENTS_WORDS.emptyTitle}
          actions={
            <div className="flex flex-wrap gap-3">
              <Link className="xr-btn xr-btn--primary" href={newExperimentAddress()}>
                <Icon name="add" />
                {CREATE_EXPERIMENT}
              </Link>
            </div>
          }
        >
          {MY_EXPERIMENTS_WORDS.emptyLine}
        </EmptyState>
      </div>
    );
  } else {
    body = (
      <ListSection>
        <div className="xr-toolbar [padding:0_24px_16px]">
          <Field
            id={SEARCH_ID}
            label={MY_EXPERIMENTS_WORDS.searchLabel}
            className="xr-toolbar-search"
          >
            <TextInput
              ref={searchRef}
              type="search"
              placeholder={MY_EXPERIMENTS_WORDS.searchPlaceholder}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </Field>
          <Field id={STATUS_ID} label={MY_EXPERIMENTS_WORDS.statusLabel}>
            <Select
              value={status ?? 'all'}
              onChange={(event) =>
                changeStatus(
                  event.target.value === 'all' ? null : (event.target.value as MyExperimentsStatus),
                )
              }
              options={[
                { value: 'all', label: MY_EXPERIMENTS_WORDS.allStatuses },
                ...STATUS_FILTER_OPTIONS.map(([value, label]) => ({ value, label })),
              ]}
            />
          </Field>
          <Checkbox
            id={RECENT_ID}
            className="self-end"
            checked={recent}
            onChange={(event) => setRecent(event.target.checked)}
          >
            {MY_EXPERIMENTS_WORDS.recent}
          </Checkbox>
        </div>
        <div className="xr-toolbar-status [padding:0_24px_12px]">
          <span className="xr-meta" role="status">
            {countWords}
          </span>
          {filtered ? (
            <Button variant="text" onClick={clear}>
              {MY_EXPERIMENTS_WORDS.clearFilters}
            </Button>
          ) : null}
        </div>
        {shown.length > 0 ? (
          <ExperimentTable rows={shown} codes={codes} />
        ) : (
          <SectionBody>
            <NoMatch
              title={MY_EXPERIMENTS_WORDS.noMatchTitle}
              headingLevel={3}
              onClearFilters={clear}
            >
              {MY_EXPERIMENTS_WORDS.noMatchLine}
            </NoMatch>
          </SectionBody>
        )}
      </ListSection>
    );
  }

  return (
    <PageContent wrap="wide">
      <PageHeader
        className="mb-6"
        overline={organisation}
        title={MY_EXPERIMENTS_TITLE}
        meta={<span className="xl-meta">{MY_EXPERIMENTS_WORDS.meta}</span>}
        actions={
          <Link className="xr-btn xr-btn--primary" href={newExperimentAddress()}>
            <Icon name="add" />
            {CREATE_EXPERIMENT}
          </Link>
        }
      />
      {body}
    </PageContent>
  );
}

/** `section.xr-section` “All your experiments” (f0 … f2, f4, f5). */
function ListSection({ children }: { readonly children: ReactNode }) {
  return (
    <section className="xr-section" aria-labelledby={SECTION_HEADING}>
      <div className="xr-section-head">
        <h2 id={SECTION_HEADING} className="xr-h2">
          {MY_EXPERIMENTS_WORDS.section}
        </h2>
      </div>
      {children}
    </section>
  );
}

/**
 * The table (f0, f1): Experiment · Formats · Status · last change · With · (Action), flush with the
 * section (`div.xr-table-wrap` without its own border and radius, as B5-02 draws it); labelled
 * rows below 760 px of content (f4, f5).
 */
function ExperimentTable({
  rows,
  codes,
}: {
  readonly rows: readonly MyExperimentRow[];
  readonly codes: ReadonlyMap<string, string | null>;
}) {
  const { columns, labels } = MY_EXPERIMENTS_WORDS;
  return (
    <div className="xr-table-wrap rounded-none border-x-0 border-b-0">
      <table className="xr-table">
        <thead>
          <tr>
            <th scope="col">{columns.experiment}</th>
            <th scope="col">{columns.formats}</th>
            <th scope="col">{columns.status}</th>
            <th scope="col">{columns.with}</th>
            <th scope="col">
              <span className="xr-sr">{columns.action}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const { submission } = row;
            const code = submission.content.courseId
              ? (codes.get(submission.content.courseId) ?? null)
              : null;
            const chip = rowStatus(row);
            const action = rowAction(row);
            return (
              <tr key={submission.id}>
                <td className="is-primary">
                  <Link href={experimentRecordAddress(submission.id)}>
                    <strong>{submission.content.name}</strong>
                  </Link>
                  <span className="xr-meta block">
                    <span className="xr-id">{submission.id}</span>
                    {code ? (
                      <>
                        {' · '}
                        <span className="xw-nowrap">{code}</span>
                      </>
                    ) : null}
                  </span>
                </td>
                <td data-label={labels.formats}>
                  <span className="xv-chips">
                    {inDisplayOrder(submission.content.formats).map((format) => (
                      <FormatBadge key={format} format={FORMAT_META[format].code} compact />
                    ))}
                  </span>
                </td>
                <td data-label={labels.status}>
                  <StatusPill tone={chip.tone}>{chip.label}</StatusPill>
                  <span className="xr-meta xw-nowrap block [margin-top:2px]">
                    {dayMonthYear(submission.updatedAt)}
                  </span>
                </td>
                <td data-label={labels.with}>{withWho(row)}</td>
                <td>
                  <Link
                    className={`xr-btn ${action.primary ? 'xr-btn--primary' : 'xr-btn--secondary'} xr-btn--sm`}
                    href={action.href}
                    aria-label={action.name}
                  >
                    {action.label}
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Undrawn: loading (`VE-02.loading`), B6-02's skeleton rows in the table's shape. */
function LoadingRows() {
  return (
    <SectionBody>
      <LoadingState
        label={stateWords('VE-02.loading')}
        skeleton={[0, 1, 2].map((row) => (
          <div
            key={row}
            aria-hidden="true"
            className="grid grid-cols-[1.6fr_.8fr_1fr_.8fr_120px] gap-5 px-4 py-[18px] [border-block-start:1px_solid_var(--xr-line)]"
          >
            {[0, 1, 2, 3, 4].map((cell) => (
              <Skeleton key={cell} />
            ))}
          </div>
        ))}
      />
    </SectionBody>
  );
}

/** Undrawn: failed + Try again (`VE-02.failed`), B6-02's formula in the section body. */
function Failed({ onRetry }: { readonly onRetry: () => void }) {
  return (
    <SectionBody>
      <div className="xr-empty">
        <span className="xr-empty-icon bg-err-bg text-err">
          <Icon name="failed" />
        </span>
        <h3 className="xr-h3 m-0">{stateWords('VE-02.failed')}</h3>
        <p className="xr-body m-0">{VENDOR_FAILED_WORDS.line}</p>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary" icon="tryAgain" onClick={onRetry}>
            {VENDOR_FAILED_WORDS.tryAgain}
          </Button>
        </div>
      </div>
    </SectionBody>
  );
}
