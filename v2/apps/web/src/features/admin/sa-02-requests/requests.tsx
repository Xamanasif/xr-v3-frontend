'use client';

import type { RequestRow } from '@xr/contracts/draft';
import {
  FORMAT_META,
  type InstitutionKind,
  type RequestStatus,
  type RequestType,
} from '@xr/domain';
import type { FormatCode } from '@xr/ui';
import {
  Button,
  CellLines,
  FilterToolbar,
  FormatBadges,
  ListState,
  ListSurface,
  LoadingRows,
  PageHead,
  RecordTable,
  type RecordTableRow,
  type RecordTableSort,
  SortBar,
  type SortDirection,
  type ToolbarChip,
} from '@xr/ui/v3';
import { useMemo, useRef, useState } from 'react';

import { dayMonthYear, weekdayDate } from '@/copy/dates';
import {
  experimentsCell,
  filterChipWords,
  formatsRequestedLabel,
  REQUEST_TYPE_WORDS,
  requestCountWords,
  requestRowLinkLabel,
  REQUESTS_PAGE,
  routeWords,
  searchChipWords,
} from '@/copy/requests';
import { requestAddress, requestsPlacement } from '@/nav/requests';
import { type RequestFilter, useAllRequests, useRequestRows } from '@/queries/access-requests';
import { usePublishedCatalogue } from '@/queries/catalogue';
import { useSession } from '@/queries/session';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { RequestStatusPill, requestStatusWords } from '../shared/request-status';

/** The Status filter, in order (no Declined, T-02). */
const STATUS_OPTIONS: readonly RequestStatus[] = [
  'under-review',
  'information-requested',
  'approved-payment-required',
  'payment-not-confirmed',
  'access-active',
];
const TYPE_OPTIONS: readonly RequestType[] = ['new-access', 'additional-licences', 'renewal'];
const ROUTE_OPTIONS: readonly (InstitutionKind | 'not-set')[] = ['internal', 'external', 'not-set'];

const ALL = 'all';

/** The list's id prefix: the search field and the More filters panel (the export's `rq-*`). */
const SEARCH_ID = 'rq-q';
const MORE_ID = 'rq-more';

/** A row as SA-02 draws it: the port's row with its first experiment named from the catalogue. */
interface ListedRequest {
  readonly row: RequestRow;
  readonly experiments: ReturnType<typeof experimentsCell>;
}

function tableRow({ row, experiments }: ListedRequest): RecordTableRow {
  const status = requestStatusWords(row.status);
  return {
    key: row.id,
    href: requestAddress(row.id),
    title: row.institutionName,
    titleDetail: row.contactPerson,
    linkLabel: requestRowLinkLabel(row.institutionName, row.type, row.receivedAt, status),
    what: (
      <>
        <CellLines strong={experiments.line} />
        {experiments.formats.length > 0 ? (
          <FormatBadges
            formats={experiments.formats.map((format) => FORMAT_META[format].code as FormatCode)}
            label={formatsRequestedLabel(experiments.formats)}
          />
        ) : null}
      </>
    ),
    kind: <CellLines strong={REQUEST_TYPE_WORDS[row.type]} small={routeWords(row.route)} />,
    when: dayMonthYear(row.receivedAt),
    status: <RequestStatusPill status={row.status} />,
  };
}

/**
 * SA-02 Requests — the V3 Refined B design (the owner-approved Super Admin export,
 * `sa-views-a.js` `V.requests`), at `/admin/requests`.
 *
 * - **The list is the port's answer.** Search, Status, Type and "Internal or external" go to
 *   `AccessRequestService.listRequests` as filters, and Received's order as `sort`; the service
 *   decides which requests the Super Admin sees and which match. The rows already on show are
 *   reordered in the same render when the order changes, and they stay on show while a new
 *   filter's answer loads.
 * - **As the export draws it**: the page head; one list surface with the filter toolbar (Search ·
 *   Status · Type · More filters with "Internal or external"; Type moves into More filters on a
 *   narrow toolbar), the count ("8 requests", "2 of 8 requests" while something is applied), one
 *   removable chip per applied filter and Clear filters; the record table in its three width
 *   layouts, its Received head the sort (the sort bar in the status line where the head is
 *   hidden). Each row opens its decision (SA-03), named by its institution, never by its
 *   reference. States: loading, failed with Try again, no requests yet, no match.
 * - Statuses are words with their tone; there is no Declined status, filter or action.
 */
export function Requests() {
  useShellPage(requestsPlacement());
  const session = useSession();
  const date = session.status === 'signed-in' ? weekdayDate(session.signedInAt) : undefined;
  const titleRef = useRef<HTMLHeadingElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<RequestStatus | typeof ALL>(ALL);
  const [type, setType] = useState<RequestType | typeof ALL>(ALL);
  const [route, setRoute] = useState<InstitutionKind | 'not-set' | typeof ALL>(ALL);
  const [moreOpen, setMoreOpen] = useState(false);
  const [direction, setDirection] = useState<SortDirection>('desc');

  const filter: RequestFilter = {
    status: status === ALL ? null : status,
    type: type === ALL ? null : type,
    route: route === ALL ? null : route,
    search,
    order: direction === 'desc' ? 'received-newest' : 'received-oldest',
  };
  const rows = useRequestRows(filter);
  const all = useAllRequests();
  const catalogue = usePublishedCatalogue();

  const names = useMemo(() => {
    const map = new Map<string, string>();
    if (catalogue.data?.ok) {
      for (const entry of catalogue.data.value.entries) map.set(entry.experimentId, entry.name);
    }
    return map;
  }, [catalogue.data]);

  const listed = useMemo<readonly ListedRequest[]>(() => {
    if (!rows.data?.ok) return [];
    const answer = rows.data.value.map((row) => ({
      row,
      experiments: experimentsCell(
        row.firstItem
          ? {
              name: names.get(row.firstItem.experimentId) ?? row.firstItem.experimentId,
              formats: row.firstItem.formats,
            }
          : null,
        row.itemCount,
      ),
    }));
    // The rows on show follow the order asked for in the same render (sorted in place); the
    // service's own order is kept among requests received at the same moment.
    const sign = direction === 'desc' ? -1 : 1;
    return [...answer].sort((a, b) =>
      a.row.receivedAt === b.row.receivedAt
        ? 0
        : a.row.receivedAt < b.row.receivedAt
          ? -sign
          : sign,
    );
  }, [rows.data, names, direction]);

  const total = all.data?.ok ? all.data.value.length : null;
  const filtered = search.trim() !== '' || status !== ALL || type !== ALL || route !== ALL;
  const loading =
    (rows.isPending && !rows.data) || catalogue.isPending || (all.isPending && !all.data);
  const failed = rows.isError || catalogue.isError || all.isError;
  const noRequestsAtAll = total === 0 && !failed && !loading;

  // The count is announced (the toolbar's `role="status"`): while a new filter's answer loads, the
  // rows on show are the previous answer's (`keepPrevious`), so the count keeps its last settled
  // words rather than announcing a figure for the wrong filter.
  const settledCount =
    total === null || loading || failed
      ? ''
      : rows.isPlaceholderData
        ? null
        : requestCountWords(listed.length, total, filtered);
  const [countWords, setCountWords] = useState('');
  if (settledCount !== null && settledCount !== countWords) setCountWords(settledCount);
  const count = loading || failed ? undefined : (settledCount ?? countWords);

  const clearFilters = () => {
    setSearch('');
    setStatus(ALL);
    setType(ALL);
    setRoute(ALL);
  };

  const chips: ToolbarChip[] = [];
  if (search.trim() !== '') {
    chips.push({ key: 'q', label: searchChipWords(search.trim()), onRemove: () => setSearch('') });
  }
  if (status !== ALL) {
    chips.push({
      key: 'st',
      label: filterChipWords(REQUESTS_PAGE.statusLabel, requestStatusWords(status)),
      onRemove: () => setStatus(ALL),
    });
  }
  if (type !== ALL) {
    chips.push({
      key: 'type',
      label: filterChipWords(REQUESTS_PAGE.typeLabel, REQUEST_TYPE_WORDS[type]),
      onRemove: () => setType(ALL),
    });
  }
  if (route !== ALL) {
    chips.push({
      key: 'route',
      label: filterChipWords(
        REQUESTS_PAGE.routeLabel,
        routeWords(route === 'not-set' ? null : route),
      ),
      onRemove: () => setRoute(ALL),
    });
  }

  const sort: RecordTableSort = {
    header: REQUESTS_PAGE.receivedHeader,
    direction,
    words: REQUESTS_PAGE.sortWords,
    onToggle: () => setDirection((current) => (current === 'desc' ? 'asc' : 'desc')),
  };
  const listing = !loading && !failed && listed.length > 0;

  const retry = () => {
    if (rows.isError) void rows.refetch();
    if (catalogue.isError) void catalogue.refetch();
    if (all.isError) void all.refetch();
    titleRef.current?.focus();
  };

  return (
    <>
      <PageHead
        title={REQUESTS_PAGE.title}
        titleRef={titleRef}
        titleFocusTarget
        date={date}
        lead={REQUESTS_PAGE.summary}
      />
      <ListSurface label={REQUESTS_PAGE.caption} busy={loading}>
        {noRequestsAtAll ? null : (
          <FilterToolbar
            label={REQUESTS_PAGE.filterLabel}
            search={{
              id: SEARCH_ID,
              label: REQUESTS_PAGE.searchLabel,
              placeholder: REQUESTS_PAGE.searchPlaceholder,
              value: search,
              onChange: setSearch,
            }}
            filters={[
              {
                id: 'rq-st',
                label: REQUESTS_PAGE.statusLabel,
                size: 'status',
                value: status,
                onChange: (value) => setStatus(value as RequestStatus | typeof ALL),
                options: [
                  { value: ALL, label: REQUESTS_PAGE.allStatuses },
                  ...STATUS_OPTIONS.map((value) => ({ value, label: requestStatusWords(value) })),
                ],
              },
              {
                id: 'rq-type',
                label: REQUESTS_PAGE.typeLabel,
                size: 'type',
                value: type,
                onChange: (value) => setType(value as RequestType | typeof ALL),
                options: [
                  { value: ALL, label: REQUESTS_PAGE.allTypes },
                  ...TYPE_OPTIONS.map((value) => ({ value, label: REQUEST_TYPE_WORDS[value] })),
                ],
              },
            ]}
            more={{
              id: MORE_ID,
              label: REQUESTS_PAGE.moreFilters,
              open: moreOpen,
              onToggle: () => setMoreOpen((open) => !open),
              filters: [
                {
                  id: 'rq-route',
                  label: REQUESTS_PAGE.routeLabel,
                  value: route,
                  onChange: (value) => setRoute(value as InstitutionKind | 'not-set' | typeof ALL),
                  options: [
                    { value: ALL, label: REQUESTS_PAGE.allRoutes },
                    ...ROUTE_OPTIONS.map((option) => ({
                      value: option,
                      label: routeWords(option === 'not-set' ? null : option),
                    })),
                  ],
                },
              ],
            }}
            count={count}
            sortBar={listing ? <SortBar sort={sort} /> : undefined}
            chips={chips}
            onClearFilters={clearFilters}
            searchRef={searchRef}
          />
        )}
        {failed ? (
          <ListState
            kind="failed"
            title={REQUESTS_PAGE.failedTitle}
            action={<Button onClick={retry}>{REQUESTS_PAGE.retry}</Button>}
          >
            {REQUESTS_PAGE.failedLine}
          </ListState>
        ) : loading ? (
          <LoadingRows message={REQUESTS_PAGE.loading} />
        ) : noRequestsAtAll ? (
          <ListState kind="empty" title={REQUESTS_PAGE.emptyTitle}>
            {REQUESTS_PAGE.emptyLine}
          </ListState>
        ) : listed.length === 0 ? (
          <ListState
            kind="nomatch"
            title={REQUESTS_PAGE.noMatchTitle}
            action={
              <Button
                onClick={() => {
                  clearFilters();
                  searchRef.current?.focus();
                }}
              >
                {REQUESTS_PAGE.clearFilters}
              </Button>
            }
          >
            {REQUESTS_PAGE.noMatchLine}
          </ListState>
        ) : (
          <RecordTable
            caption={REQUESTS_PAGE.caption}
            headers={REQUESTS_PAGE.headers}
            rows={listed.map(tableRow)}
            sort={sort}
            whenLabel={REQUESTS_PAGE.receivedHeader}
          />
        )}
      </ListSurface>
    </>
  );
}
