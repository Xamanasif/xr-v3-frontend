'use client';

import type { allContentOutput, Out } from '@xr/contracts/draft';
import { FORMAT_META, inDisplayOrder } from '@xr/domain';
import {
  Button,
  ButtonLink,
  CellLines,
  CourseCode,
  FilterToolbar,
  FormatBadges,
  ListFoot,
  ListState,
  ListSurface,
  LoadingRows,
  Notice,
  QuietLine,
  RecordTable,
  StatusPill,
  type ToolbarChip,
} from '@xr/ui/v3';
import { useEffect, useRef, useState } from 'react';

import {
  ALL_CONTENT_LIST,
  CONTENT_HEAD,
  contentCount,
  contentRowLabel,
  correctionsWaitingLine,
  correctionsWaitingTitle,
  correctionTag,
  formatsLabel,
  searchChip,
  statusChip,
  statusOption,
  stuckRecordsLine,
  stuckRecordsTitle,
  WORKFLOW_STATUS,
} from '@/copy/sa-content';
import { SA_FAILED } from '@/copy/sa-shared';
import { stateWords } from '@/copy/state-copy';
import {
  allContentPlacement,
  CONTENT_UPDATES_ADDRESS,
  contentRecordAddress,
} from '@/nav/admin-content';
import { useAppNavigation } from '@/nav/navigation';
import { useAllContent } from '@/queries/admin-content';
import { useUpdatesForRelease } from '@/queries/corrections';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { ContentHead } from '../sa-10-updates/content-head';
import {
  allContentAddress,
  hasStatus,
  searchOf,
  showOf,
  STATUS_FILTERS,
  type StatusFilter,
  workflowWords,
} from './content-view';

type ContentRow = Out<typeof allContentOutput>[number];

/** The query part of an address (`''` or `?…`), as `AppNavigation.search` gives it. */
function queryOf(address: string): string {
  const at = address.indexOf('?');
  return at < 0 ? '' : address.slice(at);
}

/** The "Workflow status" select's id: "Show stuck records" moves focus to it. */
const STATUS_ID = 'all-content-status';

/**
 * SA-12 All content — the owner-approved Super Admin export's `V.allContent`
 * (design/v3-refined-b/roles/SA-v1, renders `<width>_content_all.png`), at `/admin/content/all`
 * (`?show=<status>`, `?q=`).
 *
 * - **Reads**: `ProductionService.listAllContent` — every experiment and submission she may read,
 *   each with its status, whether the service finds it stuck ("stuck" derives from the reviewers'
 *   scopes, as the product already does), who can act (its words), its live version and the state
 *   of its open correction where she may see it (PC-71). Read once unsearched for the filter's
 *   figures, the total and the stuck notice; a search goes to the service (name, reference or
 *   course code) and the filter groups its answer (state-copy `SA-12.views`). The corrections
 *   waiting for her release decision come from `CorrectionService.listUpdatesForRelease` (SA-10's
 *   read): the notice shows only when one waits.
 * - **As the export draws it**: "Content" with its line and the page tabs "Updates · All
 *   content"; "A correction is waiting for your release decision … Open Updates"; one surface with
 *   the search and the "Workflow status" filter (each status with its figure), the count line
 *   ("19 records · read-only"), the filter chips and "Clear filters", and the table Experiment ·
 *   Where it is · Who can act · Formats · Status, each row opening the record (SA-13); the foot
 *   line. Read-only: nothing on this page changes a record.
 * - **Kept from the product** (the export does not draw it): the stuck notice with "Show stuck
 *   records", which sets the filter to the stuck status and moves focus to it.
 * - **States**: loading, failed + "Try again", no content at all, and no match + "Clear filters".
 */
export function AllContent() {
  useShellPage(allContentPlacement());
  const navigation = useAppNavigation();

  // The status and the search live here while the page is on show; the address mirrors them
  // (replaced, no history entry; state-copy `SA-12.address`). An address that arrives from
  // elsewhere (a link, Back) is read again; one the page wrote itself is not.
  const [show, setShow] = useState<StatusFilter>(() => showOf(navigation.search));
  const [search, setSearch] = useState(() => searchOf(navigation.search));
  const written = useRef(new Set<string>());
  const mirror = (nextShow: StatusFilter, nextSearch: string) => {
    const address = allContentAddress(nextShow, nextSearch);
    const query = queryOf(address);
    if (query === navigation.search && written.current.size === 0) return;
    written.current.add(query);
    navigation.replace(address);
  };
  useEffect(() => {
    if (written.current.delete(navigation.search)) return;
    const addressed = { show: showOf(navigation.search), search: searchOf(navigation.search) };
    setShow(addressed.show);
    setSearch(addressed.search);
    // An unknown or default `?show=` is replaced by the address that names the filter on show.
    const canonical = allContentAddress(addressed.show, addressed.search);
    if (queryOf(canonical) !== navigation.search) {
      written.current.add(queryOf(canonical));
      navigation.replace(canonical);
    }
    // Only an address change is read again (the navigation object itself is not a change).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation.search]);
  const choose = (next: StatusFilter) => {
    setShow(next);
    mirror(next, search);
  };
  const type = (value: string) => {
    setSearch(value);
    mirror(show, value);
  };
  const clearFilters = () => {
    setSearch('');
    setShow('all');
    mirror('all', '');
  };

  const all = useAllContent({ status: null, search: '' });
  const searched = useAllContent({ status: null, search });
  const waiting = useUpdatesForRelease('waiting-for-you');
  const reads = [all, searched, waiting];
  const failed = reads.some((read) => read.isError || (read.data !== undefined && !read.data.ok));
  const loading = !failed && reads.some((read) => read.data === undefined);

  const records: readonly ContentRow[] = all.data?.ok ? all.data.value : [];
  const found: readonly ContentRow[] = searched.data?.ok ? searched.data.value : [];
  const shown = found.filter((row) => hasStatus(row, show));
  const stuck = records.filter((row) => row.stuck);
  const updates = waiting.data?.ok ? waiting.data.value : [];
  const filtered = search.trim() !== '' || show !== 'all';

  // The count is announced (`role="status"`): while a new search's rows load, the rows on show
  // are the previous answer's, so the count keeps its last settled words.
  const settled =
    loading || failed || searched.isPlaceholderData
      ? null
      : contentCount(shown.length, records.length, filtered);
  const [countWords, setCountWords] = useState('');
  if (settled !== null && settled !== countWords) setCountWords(settled);

  // "Show stuck records" sets the filter to the stuck status and puts focus on it.
  const [focusStatus, setFocusStatus] = useState(0);
  useEffect(() => {
    if (focusStatus > 0) document.getElementById(STATUS_ID)?.focus();
  }, [focusStatus]);

  // "Clear filters" in the no-match state goes with that state: focus moves to the search field.
  const searchRef = useRef<HTMLInputElement>(null);
  const clearFromNoMatch = () => {
    clearFilters();
    searchRef.current?.focus();
  };

  const retry = () => {
    for (const read of reads) {
      if (read.isError || (read.data !== undefined && !read.data.ok)) void read.refetch();
    }
  };

  const statusLabel = (filter: StatusFilter) =>
    filter === 'all' ? ALL_CONTENT_LIST.allStatuses : WORKFLOW_STATUS[filter].words;
  const options = STATUS_FILTERS.filter(
    (filter) => filter !== 'resubmitted' || records.some((row) => hasStatus(row, filter)),
  ).map((filter) => ({
    value: filter,
    label: statusOption(
      statusLabel(filter),
      records.filter((row) => hasStatus(row, filter)).length,
    ),
  }));
  const chips: ToolbarChip[] = [
    ...(search.trim() !== ''
      ? [{ key: 'q', label: searchChip(search.trim()), onRemove: () => type('') }]
      : []),
    ...(show !== 'all'
      ? [{ key: 'show', label: statusChip(statusLabel(show)), onRemove: () => choose('all') }]
      : []),
  ];

  let body;
  if (failed) {
    body = (
      <ListState
        kind="failed"
        title={stateWords('SA-12.failed')}
        action={<Button onClick={retry}>{SA_FAILED.retry}</Button>}
      >
        {SA_FAILED.line}
      </ListState>
    );
  } else if (loading) {
    body = <LoadingRows message={stateWords('SA-12.loading')} />;
  } else if (records.length === 0) {
    body = (
      <ListState kind="empty" icon="layers" title={ALL_CONTENT_LIST.emptyTitle}>
        {ALL_CONTENT_LIST.emptyLine}
      </ListState>
    );
  } else {
    body = (
      <>
        <FilterToolbar
          label={ALL_CONTENT_LIST.filterLabel}
          searchRef={searchRef}
          search={{
            id: 'all-content-search',
            label: ALL_CONTENT_LIST.searchLabel,
            placeholder: ALL_CONTENT_LIST.searchPlaceholder,
            value: search,
            onChange: type,
          }}
          filters={[
            {
              id: STATUS_ID,
              label: ALL_CONTENT_LIST.statusLabel,
              size: 'status',
              value: show,
              onChange: (value) => choose(value as StatusFilter),
              options,
            },
          ]}
          count={countWords}
          chips={chips}
          onClearFilters={clearFilters}
        />
        {shown.length > 0 ? (
          <ContentTable rows={shown} />
        ) : (
          <ListState
            kind="nomatch"
            title={ALL_CONTENT_LIST.noMatchTitle}
            action={<Button onClick={clearFromNoMatch}>{ALL_CONTENT_LIST.clearFilters}</Button>}
          >
            {ALL_CONTENT_LIST.noMatchLine}
          </ListState>
        )}
      </>
    );
  }

  return (
    <>
      <ContentHead current="all" lead={CONTENT_HEAD.allLead} />
      {stuck.length > 0 ? (
        <Notice
          tone="warn"
          icon="hourglass"
          role="status"
          title={stuckRecordsTitle(stuck.length)}
          actions={
            <Button
              onClick={() => {
                choose('stuck');
                setFocusStatus((n) => n + 1);
              }}
            >
              {ALL_CONTENT_LIST.showStuck}
            </Button>
          }
        >
          {stuckRecordsLine(stuck.map((row) => ({ name: row.name, course: row.courseCode })))}
        </Notice>
      ) : null}
      {updates.length > 0 ? (
        <Notice
          tone="info"
          icon="edit"
          role="status"
          title={correctionsWaitingTitle(updates.length)}
          actions={
            <ButtonLink href={CONTENT_UPDATES_ADDRESS}>{ALL_CONTENT_LIST.openUpdates}</ButtonLink>
          }
        >
          {correctionsWaitingLine(
            updates.map(({ update, experimentName }) => ({
              name: experimentName,
              from: update.baseVersionLabel,
              to: update.versionLabel ?? update.baseVersionLabel,
            })),
          )}
        </Notice>
      ) : null}
      <ListSurface label={ALL_CONTENT_LIST.surfaceLabel} busy={loading}>
        {body}
        <ListFoot>{ALL_CONTENT_LIST.foot}</ListFoot>
      </ListSurface>
    </>
  );
}

/** The records: the record table, each row opening its record (SA-13). */
function ContentTable({ rows }: { readonly rows: readonly ContentRow[] }) {
  return (
    <RecordTable
      caption={ALL_CONTENT_LIST.caption}
      headers={ALL_CONTENT_LIST.headers}
      rows={rows.map((row) => {
        const status = workflowWords(row.status, row.stuck, row.live, null);
        const tag =
          row.openUpdate && row.openUpdateState ? correctionTag(row.openUpdateState) : null;
        const formats = inDisplayOrder(row.formats).map((format) => FORMAT_META[format].code);
        return {
          key: `${row.ref.kind}:${row.ref.id}`,
          href: contentRecordAddress(row.ref.id),
          title: row.name,
          titleDetail: row.courseCode ? <CourseCode code={row.courseCode} /> : undefined,
          linkLabel: contentRowLabel(row.name, status.words),
          what: <CellLines strong={status.where} small={tag ?? undefined} />,
          kind: <QuietLine flush>{row.whoCanAct ?? ALL_CONTENT_LIST.nobodyNeedsToAct}</QuietLine>,
          when: <FormatBadges formats={formats} label={formatsLabel(formats)} />,
          status: <StatusPill tone={status.tone}>{status.words}</StatusPill>,
        };
      })}
    />
  );
}
