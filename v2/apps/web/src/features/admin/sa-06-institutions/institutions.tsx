'use client';

import type { InstitutionRow } from '@xr/contracts/draft';
import {
  Button,
  CellLines,
  FilterToolbar,
  InstitutionInlineLabel,
  ListFoot,
  ListState,
  ListSurface,
  LoadingRows,
  MissingTag,
  PageHead,
  QuietLine,
  RecordTable,
  type RecordTableRow,
  type ToolbarChip,
} from '@xr/ui/v3';
import { useRef, useState } from 'react';

import { calendarDay, weekdayDate } from '@/copy/dates';
import {
  endedOnWords,
  filterOptionWords,
  institutionRowLabel,
  type InstitutionTabId,
  kindWords,
  SA_INSTITUTION_FILTERS,
  SA_INSTITUTIONS,
  saInstitutionCountWords,
  saPlanSummaryWords,
  searchChipWords,
  statusChipWords,
} from '@/copy/institutions';
import { SA_FAILED } from '@/copy/sa-shared';
import { stateWords } from '@/copy/state-copy';
import { institutionAddress, institutionsPlacement } from '@/nav/institutions';
import { useInstitutionRows, useInstitutionTab } from '@/queries/institutions';
import { useSession } from '@/queries/session';

import { InstitutionStatusPill, institutionStatusWords } from '../shared/institution-status';
import { useShellPage } from '../../shared/workspace-frame/shell-page';

const FILTER_LABEL: Readonly<Record<InstitutionTabId, string>> = Object.fromEntries(
  SA_INSTITUTION_FILTERS,
) as Record<InstitutionTabId, string>;

/**
 * SA-06 Institutions — the owner-approved V3 Refined B design (SA-v1 `V.institutions`), at
 * `/admin/institutions`.
 *
 * - **The list is the port's answer.** The status filter and the search go to
 *   `InstitutionService.listInstitutions`; the service decides which institutions are in a status
 *   ("Access active" holds those ending soon too), which match the search and which need an
 *   Institute Admin ("Needs one"). Each option's figure is the service's answer for that status
 *   without the search. The rows on show stay while a new status's or search's rows load.
 * - **As SA-v1 draws it**: the page head, then one surface — the filter toolbar (Search, Status
 *   with its figures; the count, a chip per applied filter and Clear filters), the institutions
 *   by name in the shared record table (its three width layouts; the whole row opens SA-07), and
 *   the foot line. Loading, failed with Try again, no institutions yet and no match are the kit's
 *   list states.
 * - No "Create institution" (institutions come only from approved requests) and no plan
 *   amendment: nothing on this page changes a record.
 */
export function Institutions() {
  useShellPage(institutionsPlacement());
  const session = useSession();
  // Today on the sample clock: the session's sign-in instant (state-copy `SA-01.today`).
  const today = session.status === 'signed-in' ? session.signedInAt : null;
  const [tab, setTab] = useState<InstitutionTabId>('all');
  const [search, setSearch] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  const tabs = {
    all: useInstitutionTab('all'),
    'access-active': useInstitutionTab('access-active'),
    'ending-soon': useInstitutionTab('ending-soon'),
    'access-paused': useInstitutionTab('access-paused'),
    'approved-payment-required': useInstitutionTab('approved-payment-required'),
    'access-ended': useInstitutionTab('access-ended'),
    'no-institute-admin': useInstitutionTab('no-institute-admin'),
  } satisfies Readonly<Record<InstitutionTabId, ReturnType<typeof useInstitutionTab>>>;
  const rows = useInstitutionRows(tab, search);

  const reads = [...Object.values(tabs), rows];
  const failed = reads.some((read) => read.isError);
  const loading = !failed && reads.some((read) => read.isPending && !read.data);
  const countOf = (id: InstitutionTabId): number | null => {
    const answer = tabs[id].data;
    return answer?.ok ? answer.value.length : null;
  };
  const listed: readonly InstitutionRow[] = rows.data?.ok ? rows.data.value : [];
  const total = countOf('all') ?? 0;
  const searching = search.trim() !== '';
  const filtered = searching || tab !== 'all';
  const empty = !loading && !failed && total === 0;

  // The count is announced (`role="status"`): while the next status's or search's rows load, the
  // rows on show are the previous answer's, so the count keeps its last settled words.
  const settled =
    loading || failed || rows.isPlaceholderData
      ? null
      : saInstitutionCountWords(listed.length, total, filtered);
  const [countWords, setCountWords] = useState('');
  if (settled !== null && settled !== countWords) setCountWords(settled);

  const clearFilters = () => {
    setSearch('');
    setTab('all');
  };
  // "Clear filters" in the no-match state, as the toolbar's: back to every institution, focus in
  // Search (the export's `inClear`).
  const clearFromNoMatch = () => {
    clearFilters();
    searchRef.current?.focus();
  };
  const retry = () => {
    for (const read of reads) if (read.isError) void read.refetch();
  };

  const chips: ToolbarChip[] = [
    ...(searching
      ? [{ key: 'q', label: searchChipWords(search.trim()), onRemove: () => setSearch('') }]
      : []),
    ...(tab !== 'all'
      ? [{ key: 'f', label: statusChipWords(FILTER_LABEL[tab]), onRemove: () => setTab('all') }]
      : []),
  ];
  // The institutions by name (the export's table caption "Institutions, by name").
  const byName = [...listed].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <>
      <PageHead
        title={SA_INSTITUTIONS.title}
        titleFocusTarget
        date={today ? weekdayDate(today) : undefined}
        lead={SA_INSTITUTIONS.lead}
      />
      <ListSurface label={SA_INSTITUTIONS.surface} busy={loading}>
        {empty ? null : (
          <FilterToolbar
            label={SA_INSTITUTIONS.toolbar}
            searchRef={searchRef}
            search={{
              id: 'in-q',
              label: SA_INSTITUTIONS.searchLabel,
              placeholder: SA_INSTITUTIONS.searchPlaceholder,
              value: search,
              onChange: setSearch,
            }}
            filters={[
              {
                id: 'in-st',
                label: SA_INSTITUTIONS.statusLabel,
                size: 'status',
                value: tab,
                options: SA_INSTITUTION_FILTERS.map(([id, label]) => ({
                  value: id,
                  label: filterOptionWords(label, countOf(id)),
                })),
                onChange: (value) => setTab(value as InstitutionTabId),
              },
            ]}
            {...(!loading && !failed && countWords ? { count: countWords } : {})}
            chips={chips}
            onClearFilters={clearFilters}
          />
        )}
        {failed ? (
          <ListState
            kind="failed"
            title={stateWords('SA-06.failed')}
            action={<Button onClick={retry}>{SA_FAILED.retry}</Button>}
          >
            {SA_FAILED.line}
          </ListState>
        ) : loading ? (
          <LoadingRows message={stateWords('SA-06.loading')} />
        ) : empty ? (
          <ListState kind="empty" title={stateWords('SA-06.none')}>
            {SA_INSTITUTIONS.emptyLine}
          </ListState>
        ) : byName.length > 0 ? (
          <RecordTable
            caption={SA_INSTITUTIONS.caption}
            headers={{
              who: SA_INSTITUTIONS.columns.institution,
              what: SA_INSTITUTIONS.columns.plan,
              kind: SA_INSTITUTIONS.columns.instituteAdmin,
              when: SA_INSTITUTIONS.columns.accessEnds,
              status: SA_INSTITUTIONS.columns.status,
            }}
            rows={byName.map(tableRow)}
          />
        ) : (
          <ListState
            kind="nomatch"
            title={SA_INSTITUTIONS.noMatchTitle}
            action={<Button onClick={clearFromNoMatch}>{SA_INSTITUTIONS.clearFilters}</Button>}
          >
            {SA_INSTITUTIONS.noMatchLine}
          </ListState>
        )}
        <ListFoot>{SA_INSTITUTIONS.foot}</ListFoot>
      </ListSurface>
    </>
  );
}

/** One institution as the export's row draws it. */
function tableRow(row: InstitutionRow): RecordTableRow {
  const ended = row.status === 'access-ended';
  return {
    key: row.id,
    href: institutionAddress(row.id),
    title: row.name,
    titleDetail: kindWords(row.kind),
    linkLabel: institutionRowLabel(
      row.name,
      institutionStatusWords(row.status),
      row.needsInstituteAdmin,
    ),
    what: <CellLines strong={saPlanSummaryWords(row.plans, row.requestedExperimentCount)} />,
    kind: row.instituteAdminName ? (
      <CellLines strong={row.instituteAdminName} />
    ) : row.needsInstituteAdmin ? (
      <MissingTag icon="userMinus">{SA_INSTITUTIONS.needsOne}</MissingTag>
    ) : (
      <QuietLine>
        {row.status === 'approved-payment-required'
          ? SA_INSTITUTIONS.adminLater
          : SA_INSTITUTIONS.notAssigned}
      </QuietLine>
    ),
    when:
      row.accessEndsOn === null ? (
        <InstitutionInlineLabel label={SA_INSTITUTIONS.notSetLabel}>
          {SA_INSTITUTIONS.notSetYet}
        </InstitutionInlineLabel>
      ) : ended ? (
        endedOnWords(row.accessEndsOn)
      ) : (
        <InstitutionInlineLabel label={SA_INSTITUTIONS.endsLabel}>
          {calendarDay(row.accessEndsOn)}
        </InstitutionInlineLabel>
      ),
    status: <InstitutionStatusPill status={row.status} />,
  };
}
