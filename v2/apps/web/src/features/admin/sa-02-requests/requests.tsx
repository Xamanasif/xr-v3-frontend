'use client';

import type { RequestRow } from '@xr/contracts/draft';
import type { InstitutionKind, RequestStatus, RequestType } from '@xr/domain';
import {
  DataTable,
  type DataTableSortableColumn,
  DataTableSortBar,
  type DataTableSortDirection,
  type DataTableSorting,
  Field,
  type FilterChip,
  ListToolbar,
  PageContent,
  PageHeader,
  Select,
} from '@xr/ui';
import { type FocusEvent, useMemo, useState } from 'react';

import { dayMonthYear } from '@/copy/dates';
import {
  experimentsCell,
  openRequestLabel,
  REQUEST_TYPE_WORDS,
  requestCountWords,
  REQUESTS_PAGE,
  routeWords,
} from '@/copy/requests';
import { requestAddress, requestsPlacement } from '@/nav/requests';
import { type RequestFilter, useAllRequests, useRequestRows } from '@/queries/access-requests';
import { usePublishedCatalogue } from '@/queries/catalogue';

import { RequestStatusPill, requestStatusWords } from '../shared/request-status';
import { useShellPage } from '../../shared/workspace-frame/shell-page';

/** B1-10's Status filter, in board order (no Declined, T-02). */
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

/** A row as SA-02 draws it: the port's row with its experiments named from the catalogue. */
interface ListedRequest {
  readonly row: RequestRow;
  readonly experiments: { readonly line: string; readonly sub: string | null };
}

const RECEIVED: DataTableSortableColumn<ListedRequest> = {
  key: 'received',
  header: REQUESTS_PAGE.receivedHeader,
  sortWords: REQUESTS_PAGE.sortWords,
  className: 'xr-num',
  cell: (listed) => dayMonthYear(listed.row.receivedAt),
};

const COLUMNS = [
  {
    key: 'institution',
    header: 'Institution and contact person',
    cell: (listed: ListedRequest) => (
      <>
        {listed.row.institutionName}
        <span className="xr-sub">{listed.row.contactPerson}</span>
      </>
    ),
  },
  {
    key: 'experiments',
    header: 'Experiments',
    cell: (listed: ListedRequest) => (
      <>
        {listed.experiments.line}
        {listed.experiments.sub ? <span className="xr-sub">{listed.experiments.sub}</span> : null}
      </>
    ),
  },
  {
    key: 'type',
    header: 'Type',
    cell: (listed: ListedRequest) => (
      <>
        {REQUEST_TYPE_WORDS[listed.row.type]}
        <span className="xr-sub">{routeWords(listed.row.route)}</span>
      </>
    ),
  },
  RECEIVED,
  {
    key: 'status',
    header: 'Status',
    cell: (listed: ListedRequest) => <RequestStatusPill status={listed.row.status} />,
  },
];

/**
 * SA-02 Requests — board B1-10 ("Which requests need a decision?"), at `/admin/requests`.
 *
 * - **The list is the port's answer.** Search, Status, Type and "Internal or external" go to
 *   `AccessRequestService.listRequests` as filters, and Received's order as `sort`; the service
 *   decides which requests the Super Admin sees and which match. The rows already on show are
 *   reordered in the same render when the order changes (DataTable "sort in place"), and they stay
 *   on show while a new filter's answer loads.
 * - **Toolbar as B1-10 draws it**: Search · Status · Type · More filters (Internal or external);
 *   Type moves into More filters below 600 px of content; every filter is a removable chip; the
 *   count reads "7 requests", or "2 of 7 requests" while something is applied; "More filters (1)"
 *   counts the route filter it holds.
 * - **B1-10 accessibility defect fixed** (START-HERE Known exception 1): below 760 px of content
 *   the header's sort button is hidden and the visible `DataTableSortBar` takes its place
 *   (WP-0.7, PF-01; VD-04 placement provisional).
 * - Each row's reference opens its decision (SA-03); the row is tinted while its link holds focus
 *   (B1-10 f2). Statuses are words with their drawn tone; there is no Declined status or filter.
 */
export function Requests() {
  useShellPage(requestsPlacement());
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<RequestStatus | typeof ALL>(ALL);
  const [type, setType] = useState<RequestType | typeof ALL>(ALL);
  const [route, setRoute] = useState<InstitutionKind | 'not-set' | typeof ALL>(ALL);
  const [moreOpen, setMoreOpen] = useState(false);
  const [direction, setDirection] = useState<DataTableSortDirection>('descending');
  const [focusedRow, setFocusedRow] = useState<string | null>(null);

  const filter: RequestFilter = {
    status: status === ALL ? null : status,
    type: type === ALL ? null : type,
    route: route === ALL ? null : route,
    search,
    order: direction === 'descending' ? 'received-newest' : 'received-oldest',
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
    // The rows on show follow the order asked for in the same render (B1-10 sorts in place);
    // the service's own order is kept among requests received at the same moment.
    const sign = direction === 'descending' ? -1 : 1;
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
  const noRequestsAtAll = total === 0 && !failed;

  // The count is announced (ListToolbar's `role="status"`): while a new filter's answer loads, the
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

  const clearFilters = () => {
    setSearch('');
    setStatus(ALL);
    setType(ALL);
    setRoute(ALL);
  };

  const chips: FilterChip[] = [];
  if (search.trim() !== '') {
    chips.push({
      key: 'search',
      label: `Search: “${search.trim()}”`,
      onRemove: () => setSearch(''),
    });
  }
  if (status !== ALL) {
    chips.push({
      key: 'status',
      label: `Status: ${requestStatusWords(status)}`,
      onRemove: () => setStatus(ALL),
    });
  }
  if (type !== ALL) {
    chips.push({
      key: 'type',
      label: `Type: ${REQUEST_TYPE_WORDS[type]}`,
      onRemove: () => setType(ALL),
    });
  }
  if (route !== ALL) {
    chips.push({
      key: 'route',
      label: `${REQUESTS_PAGE.routeLabel}: ${routeWords(route === 'not-set' ? null : route)}`,
      onRemove: () => setRoute(ALL),
    });
  }

  const sorting: DataTableSorting = {
    column: RECEIVED.key,
    direction,
    onSortChange: (next) => setDirection(next.direction),
  };
  const listing = !loading && !failed && listed.length > 0;

  const retry = () => {
    if (rows.isError) void rows.refetch();
    if (catalogue.isError) void catalogue.refetch();
    if (all.isError) void all.refetch();
  };

  // B1-10 f2: the row is tinted while its reference link holds focus.
  const trackFocus = (event: FocusEvent<HTMLDivElement>) => {
    const link =
      event.target instanceof HTMLElement ? event.target.closest('td.is-primary a') : null;
    setFocusedRow(link?.textContent ?? null);
  };

  return (
    <PageContent wrap="wide">
      <PageHeader
        className="mb-5"
        overline={REQUESTS_PAGE.overline}
        title={REQUESTS_PAGE.title}
        summary={REQUESTS_PAGE.summary}
      />
      {noRequestsAtAll ? null : (
        <ListToolbar
          search={{
            label: REQUESTS_PAGE.searchLabel,
            placeholder: REQUESTS_PAGE.searchPlaceholder,
            value: search,
            onChange: setSearch,
          }}
          filters={[
            {
              label: REQUESTS_PAGE.statusLabel,
              value: status,
              onChange: (value) => setStatus(value as RequestStatus | typeof ALL),
              options: [
                { value: ALL, label: 'All statuses' },
                ...STATUS_OPTIONS.map((value) => ({ value, label: requestStatusWords(value) })),
              ],
            },
            {
              label: REQUESTS_PAGE.typeLabel,
              value: type,
              onChange: (value) => setType(value as RequestType | typeof ALL),
              options: [
                { value: ALL, label: 'All types' },
                ...TYPE_OPTIONS.map((value) => ({ value, label: REQUEST_TYPE_WORDS[value] })),
              ],
            },
          ]}
          moreFilters={{
            open: moreOpen,
            onOpenChange: setMoreOpen,
            activeCount: route === ALL ? 0 : 1,
            children: (
              <RouteFilter
                value={route}
                onChange={(value) => setRoute(value as InstitutionKind | 'not-set' | typeof ALL)}
              />
            ),
          }}
          status={settledCount ?? countWords}
          chips={chips}
          onClearFilters={chips.length > 0 ? clearFilters : undefined}
          sortBar={listing ? <DataTableSortBar column={RECEIVED} sort={sorting} /> : undefined}
        />
      )}
      <div onFocus={trackFocus} onBlur={() => setFocusedRow(null)}>
        <DataTable
          caption={REQUESTS_PAGE.caption}
          primary={{
            key: 'reference',
            header: 'Reference',
            href: (listedRequest) => requestAddress(listedRequest.row.id),
            title: (listedRequest) => listedRequest.row.id,
            linkLabel: (listedRequest) =>
              openRequestLabel(listedRequest.row.id, listedRequest.row.institutionName),
            // B1-10: `a.xr-id style="font-weight:700;color:#1F4FD8"` — the link blue, bold.
            linkClassName: 'xr-id font-[700] text-link',
          }}
          columns={COLUMNS}
          rows={listed}
          rowKey={(listedRequest) => listedRequest.row.id}
          rowState={(listedRequest) =>
            listedRequest.row.id === focusedRow ? 'changed' : undefined
          }
          sort={sorting}
          loading={loading}
          loadingLabel={REQUESTS_PAGE.loading}
          failed={
            failed
              ? {
                  title: REQUESTS_PAGE.failedTitle,
                  children: REQUESTS_PAGE.failedLine,
                  onRetry: retry,
                }
              : null
          }
          filtered={filtered}
          empty={{
            icon: 'requests',
            title: REQUESTS_PAGE.emptyTitle,
            children: REQUESTS_PAGE.emptyLine,
          }}
          noMatch={{ title: REQUESTS_PAGE.noMatchTitle, onClearFilters: clearFilters }}
        />
      </div>
    </PageContent>
  );
}

/** "Internal or external" inside More filters (B1-10 f1). */
function RouteFilter({
  value,
  onChange,
}: {
  readonly value: string;
  readonly onChange: (value: string) => void;
}) {
  return (
    <Field label={REQUESTS_PAGE.routeLabel}>
      <Select
        options={[
          { value: ALL, label: 'All' },
          ...ROUTE_OPTIONS.map((option) => ({
            value: option,
            label: routeWords(option === 'not-set' ? null : option),
          })),
        ]}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  );
}
