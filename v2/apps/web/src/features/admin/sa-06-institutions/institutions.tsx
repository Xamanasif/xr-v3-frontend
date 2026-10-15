'use client';

import type { InstitutionRow } from '@xr/contracts/draft';
import {
  FailedState,
  Link,
  ListToolbar,
  NoMatch,
  PageContent,
  PageHeader,
  SectionBody,
  Skeleton,
  StatusTabs,
} from '@xr/ui';
import { useId, useLayoutEffect, useRef, useState } from 'react';

import {
  accessEndsWords,
  INSTITUTION_TAB_WORDS,
  institutionCountWords,
  INSTITUTIONS_PAGE,
  type InstitutionTabId,
  kindWords,
  openInstitutionLabel,
  planSummaryWords,
} from '@/copy/institutions';
import { stateWords } from '@/copy/state-copy';
import { institutionAddress, institutionsPlacement } from '@/nav/institutions';
import { useInstitutionRows, useInstitutionTab } from '@/queries/institutions';

import { InstitutionStatusPill } from '../shared/institution-status';
import { useShellPage } from '../../shared/workspace-frame/shell-page';

/**
 * SA-06 Institutions — board B7-02 ("Which institutions exist, are any at risk, and what is the
 * full picture for one?"), at `/admin/institutions`.
 *
 * - **The list is the port's answer.** The status tab and the search go to
 *   `InstitutionService.listInstitutions`; the service decides which institutions are in a tab
 *   ("Access active" holds those ending soon too), which match the search ("Institution, access
 *   plan or Institute Admin") and which need an Institute Admin ("Needs one"). Each tab's figure
 *   is the service's answer for that tab without the search, as B7-02 counts them. The rows on
 *   show stay while a new tab's or search's rows load.
 * - **As B7-02 draws it**: status tabs (`role="tablist"`, ← → between them), the search, the
 *   count "7 of 7 institutions" (announced) with "Clear filters" while a tab or search is applied,
 *   and the table — institution with its route and access plan, status in words, Institute Admin
 *   or "Not assigned" flagged "Needs one", access end — with one "Open" per row (SA-07). Below
 *   760 px of content the rows become labelled blocks and the tabs scroll sideways (B7-02 f6).
 * - No "Create institution" (institutions come only from approved requests, T-09) and no plan
 *   amendment (T-08): nothing on this page changes a record.
 */
export function Institutions() {
  useShellPage(institutionsPlacement());
  const headingId = useId();
  const [tab, setTab] = useState<InstitutionTabId>('all');
  const [search, setSearch] = useState('');

  const tabs = {
    all: useInstitutionTab('all'),
    'access-active': useInstitutionTab('access-active'),
    'ending-soon': useInstitutionTab('ending-soon'),
    'access-paused': useInstitutionTab('access-paused'),
    'approved-payment-required': useInstitutionTab('approved-payment-required'),
    'no-institute-admin': useInstitutionTab('no-institute-admin'),
  } satisfies Readonly<Record<InstitutionTabId, ReturnType<typeof useInstitutionTab>>>;
  const rows = useInstitutionRows(tab, search);

  const reads = [...Object.values(tabs), rows];
  const failed = reads.some((read) => read.isError);
  const loading = !failed && reads.some((read) => read.isPending && !read.data);
  const countOf = (id: InstitutionTabId) => {
    const answer = tabs[id].data;
    return answer?.ok ? answer.value.length : 0;
  };
  const listed: readonly InstitutionRow[] = rows.data?.ok ? rows.data.value : [];
  const total = countOf('all');
  const filtered = search.trim() !== '' || tab !== 'all';

  // The count is announced (`role="status"`): while the next tab's or search's rows load, the rows
  // on show are the previous answer's, so the count keeps its last settled words.
  const settled =
    loading || failed || rows.isPlaceholderData
      ? null
      : institutionCountWords(listed.length, total);
  const [countWords, setCountWords] = useState('');
  if (settled !== null && settled !== countWords) setCountWords(settled);

  const clearFilters = () => {
    setSearch('');
    setTab('all');
  };

  // "Clear filters" in the no-match state goes with that state. If it had focus, focus moves to
  // the first row's "Open" once the button has gone — the rule DataTable applies on SA-02 (its
  // first row's link) — and only if focus was lost with it. Before paint, after every commit: the
  // rows may arrive in a later commit than the press.
  const sectionRef = useRef<HTMLElement>(null);
  const pressed = useRef<HTMLElement | null>(null);
  const clearFromNoMatch = () => {
    const active = document.activeElement;
    pressed.current =
      active instanceof HTMLElement && active.closest('.xr-empty') !== null ? active : null;
    clearFilters();
  };
  useLayoutEffect(() => {
    const control = pressed.current;
    if (control === null || control.isConnected) return;
    pressed.current = null;
    const active = document.activeElement;
    if (active && active !== document.body && active.isConnected) return;
    sectionRef.current?.querySelector<HTMLElement>('tbody a')?.focus();
  });
  const retry = () => {
    for (const read of reads) if (read.isError) void read.refetch();
  };

  return (
    <PageContent wrap="wide">
      <PageHeader
        className="mb-6"
        title={INSTITUTIONS_PAGE.title}
        meta={<span className="xl-meta">{INSTITUTIONS_PAGE.meta}</span>}
      />
      <section
        ref={sectionRef}
        className="xr-section"
        aria-labelledby={headingId}
        aria-busy={loading ? true : undefined}
      >
        <div className="xr-section-head">
          <h2 id={headingId} className="xr-h2">
            {INSTITUTIONS_PAGE.sectionTitle}
          </h2>
          {loading ? (
            <span className="xr-meta" role="status">
              {INSTITUTIONS_PAGE.loading}
            </span>
          ) : (
            <span className="xr-meta">{INSTITUTIONS_PAGE.sectionMeta}</span>
          )}
        </div>
        {failed ? (
          <SectionBody>
            <FailedState title={stateWords('SA-06.failed')} onRetry={retry}>
              {stateWords('SA-06.failed.line')}
            </FailedState>
          </SectionBody>
        ) : loading ? (
          <SkeletonRows />
        ) : (
          <StatusTabs
            label={INSTITUTIONS_PAGE.tabsLabel}
            idPrefix="institutions"
            className="px-4"
            panelClassName="[&>.xr-toolbar]:px-6 [&>.xr-toolbar]:py-4 [&>.xr-toolbar-status]:px-6 [&>.xr-toolbar-status]:pb-3"
            tabs={INSTITUTION_TAB_WORDS.map(([id, label]) => ({ id, label, count: countOf(id) }))}
            selected={tab}
            onSelect={(id) => setTab(id as InstitutionTabId)}
          >
            <ListToolbar
              search={{
                id: 'institutions-search',
                label: INSTITUTIONS_PAGE.searchLabel,
                placeholder: INSTITUTIONS_PAGE.searchPlaceholder,
                value: search,
                onChange: setSearch,
              }}
              status={countWords}
              chips={[]}
              clearLabel={INSTITUTIONS_PAGE.clearFilters}
              onClearFilters={filtered ? clearFilters : undefined}
            />
            {listed.length > 0 ? (
              <InstitutionTable rows={listed} />
            ) : total > 0 ? (
              <SectionBody>
                <NoMatch
                  title={INSTITUTIONS_PAGE.noMatchTitle}
                  headingLevel={3}
                  onClearFilters={clearFromNoMatch}
                >
                  {INSTITUTIONS_PAGE.noMatchLine}
                </NoMatch>
              </SectionBody>
            ) : null}
          </StatusTabs>
        )}
      </section>
    </PageContent>
  );
}

/** B7-02 table: "Institution · Status · Institute Admin · Access ends · (Action)". */
function InstitutionTable({ rows }: { readonly rows: readonly InstitutionRow[] }) {
  const { columns } = INSTITUTIONS_PAGE;
  return (
    <div className="xr-table-wrap rounded-none border-x-0 border-b-0">
      <table className="xr-table">
        <thead>
          <tr>
            <th scope="col">{columns.institution}</th>
            <th scope="col">{columns.status}</th>
            <th scope="col">{columns.instituteAdmin}</th>
            <th scope="col">{columns.accessEnds}</th>
            <th scope="col">
              <span className="xr-sr">{columns.action}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="is-primary">
                <strong>{row.name}</strong>
                <span className="xr-meta block">
                  {kindWords(row.kind)} ·{' '}
                  {planSummaryWords(row.plans, row.requestedExperimentCount)}
                </span>
              </td>
              <td data-label={columns.status}>
                <InstitutionStatusPill status={row.status} />
              </td>
              <td data-label={columns.instituteAdmin}>
                {row.instituteAdminName ?? INSTITUTIONS_PAGE.notAssigned}
                {row.needsInstituteAdmin ? (
                  <>
                    {' '}
                    <span className="xw-tag xw-tag--warn">{INSTITUTIONS_PAGE.needsOne}</span>
                  </>
                ) : null}
              </td>
              <td data-label={columns.accessEnds}>
                <span className="xw-nowrap">
                  {accessEndsWords(row.accessEndsOn, row.status === 'access-ended')}
                </span>
              </td>
              <td>
                <Link
                  className="xr-btn xr-btn--secondary xr-btn--sm"
                  href={institutionAddress(row.id)}
                  aria-label={openInstitutionLabel(row.name)}
                >
                  {INSTITUTIONS_PAGE.open}
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** B7-02 f5 "Loading": skeleton rows in the table's shape (hidden from screen readers). */
function SkeletonRows() {
  return (
    <div aria-hidden="true">
      {[0, 1, 2, 3, 4].map((row) => (
        <div
          key={row}
          className="grid grid-cols-[1.6fr_1fr_1fr_.8fr_100px] gap-5 px-4 py-[18px] [border-block-start:1px_solid_var(--xr-line)]"
        >
          {[0, 1, 2, 3, 4].map((cell) => (
            <Skeleton key={cell} />
          ))}
        </div>
      ))}
    </div>
  );
}
