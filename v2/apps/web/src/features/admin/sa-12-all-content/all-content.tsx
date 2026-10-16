'use client';

import type { allContentOutput, Out } from '@xr/contracts/draft';
import { FORMAT_META, inDisplayOrder, type Technology } from '@xr/domain';
import {
  FailedState,
  FormatBadge,
  Icon,
  Link,
  ListToolbar,
  NoMatch,
  Notice,
  PageContent,
  PageHeader,
  SectionBody,
  SectionTabs,
  Skeleton,
  StatusPill,
  StatusTabs,
} from '@xr/ui';
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';

import {
  ALL_CONTENT,
  type AllContentShow,
  CONTENT_PAGE,
  openRecordLabel,
  recordCountWords,
  stuckBody,
  stuckTitle,
  updatesWaitingTitle,
  updateTag,
  updateWaitingLine,
} from '@/copy/content-oversight';
import { stateWords } from '@/copy/state-copy';
import {
  allContentPlacement,
  CONTENT_TABS,
  CONTENT_UPDATES_ADDRESS,
  contentRecordAddress,
} from '@/nav/admin-content';
import { useAppNavigation } from '@/nav/navigation';
import { useAllContent } from '@/queries/admin-content';
import { useUpdatesForRelease } from '@/queries/corrections';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import {
  ALL_CONTENT_SHOWS,
  allContentAddress,
  inShow,
  searchOf,
  showOf,
  workflowWords,
} from './content-view';

type ContentRow = Out<typeof allContentOutput>[number];

/** The query part of an address (`''` or `?…`), as `AppNavigation.search` gives it. */
function queryOf(address: string): string {
  const at = address.indexOf('?');
  return at < 0 ? '' : address.slice(at);
}

/** The id prefix of the status tabs (`all-content-tab-<view>`; "Show stuck records" focuses one). */
const TABS_ID = 'all-content';

/**
 * SA-12 Content › All content — board B7-06 f0 (1440, interactive) and f7 (no match), at
 * `/admin/content/all` (`?show=stuck | workflow | published`, `?q=`).
 *
 * - **Reads**: `ProductionService.listAllContent` — every experiment and submission she may read,
 *   each with its status, whether the service finds it stuck, who can act (its words), its live
 *   version and the state of its open correction where she may see it (PC-71). Read once
 *   unsearched for the four tabs' figures, the total and the stuck notice; a search goes to the
 *   service (name, reference or course code) and the tab groups its answer (state-copy
 *   `SA-12.views`). The corrections waiting for her release decision come from
 *   `CorrectionService.listUpdatesForRelease` (SA-10's read): the notice shows only when one waits.
 * - **As B7-06 draws it**: "Content" and the sub-navigation "Updates · All content"; the stuck
 *   notice ("1 record stuck — nobody can act … Show stuck records", which selects the Stuck tab);
 *   "A correction is waiting for your release decision … Open Updates"; the section "Every
 *   experiment and submission · Read-only · open a record for its history" with the status tabs
 *   All · Stuck · In the workflow · Published and their figures (`role="tablist"`, ← → between
 *   them), the search, "N of M records" (announced) with "Clear filters" while filtered, and the
 *   table Content · Workflow status · Who can act · (Open → SA-13). Below 760 px of content the
 *   rows become labelled blocks. No match (f7): "No content matches" with "Clear filters".
 * - The Super Admin sees a correction only once the Academic Reviewer has approved it (UPD-18):
 *   B7-06 tags Induction Motor Loading "Update UPD-0006 · returned to the Content Manager"; the
 *   service names no such update to her, so no tag shows (state-copy `SA-12.update-tag`).
 * - Undrawn: loading and failed + "Try again" (state-copy `SA-12.loading`, `SA-12.failed`).
 *   Nothing on this page changes a record.
 */
export function AllContent() {
  useShellPage(allContentPlacement());
  const headingId = useId();
  const navigation = useAppNavigation();

  // The view and the search live here while the page is on show; the address mirrors them
  // (replaced, no history entry; state-copy `SA-12.address`). An address that arrives from
  // elsewhere (a link, Back) is read again; one the page wrote itself is not.
  const [show, setShow] = useState<AllContentShow>(() => showOf(navigation.search));
  const [search, setSearch] = useState(() => searchOf(navigation.search));
  const written = useRef(new Set<string>());
  const mirror = (nextShow: AllContentShow, nextSearch: string) => {
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
    // An unknown or default `?show=` is replaced by the address that names the view on show.
    const canonical = allContentAddress(addressed.show, addressed.search);
    if (queryOf(canonical) !== navigation.search) {
      written.current.add(queryOf(canonical));
      navigation.replace(canonical);
    }
    // Only an address change is read again (the navigation object itself is not a change).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation.search]);
  const choose = (next: AllContentShow) => {
    setShow(next);
    mirror(next, search);
  };
  const type = (value: string) => {
    setSearch(value);
    mirror(show, value);
  };

  const all = useAllContent({ status: null, search: '' });
  const searched = useAllContent({ status: null, search });
  const waiting = useUpdatesForRelease('waiting-for-you');
  const reads = [all, searched, waiting];
  const failed = reads.some((read) => read.isError || (read.data !== undefined && !read.data.ok));
  const loading = !failed && reads.some((read) => read.data === undefined);

  const records: readonly ContentRow[] = all.data?.ok ? all.data.value : [];
  const found: readonly ContentRow[] = searched.data?.ok ? searched.data.value : [];
  const shown = found.filter((row) => inShow(row, show));
  const stuck = records.filter((row) => row.stuck);
  const updates = waiting.data?.ok ? waiting.data.value : [];
  const filtered = search.trim() !== '' || show !== 'all';

  // The count is announced (`role="status"`): while a new search's rows load, the rows on show
  // are the previous answer's, so the count keeps its last settled words.
  const settled =
    loading || failed || searched.isPlaceholderData
      ? null
      : recordCountWords(shown.length, records.length);
  const [countWords, setCountWords] = useState('');
  if (settled !== null && settled !== countWords) setCountWords(settled);

  const clearFilters = () => {
    setSearch('');
    setShow('all');
    mirror('all', '');
  };

  // "Show stuck records" selects the Stuck tab and puts focus on it (B7-06 `showStuck`).
  const [focusStuck, setFocusStuck] = useState(0);
  useEffect(() => {
    if (focusStuck > 0) document.getElementById(`${TABS_ID}-tab-stuck`)?.focus();
  }, [focusStuck]);

  // "Clear filters" in the no-match state goes with that state: if it had focus, focus moves to
  // the first row's "Open" once it has gone (SA-06's rule), only if focus was lost with it.
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
    for (const read of reads) {
      if (read.isError || (read.data !== undefined && !read.data.ok)) void read.refetch();
    }
  };

  return (
    <PageContent wrap="wide">
      <PageHeader
        className="mb-4"
        title={CONTENT_PAGE.title}
        meta={<span className="xl-meta">{CONTENT_PAGE.meta}</span>}
      />
      <SectionTabs
        className="mb-5"
        label={CONTENT_PAGE.tabsLabel}
        surface="white"
        tabs={CONTENT_TABS.map((tab) => ({
          href: tab.href,
          label: tab.label,
          current: tab.key === 'all',
        }))}
      />
      {stuck.length > 0 ? (
        <div className="mb-4">
          <Notice
            tone="err"
            role="status"
            title={stuckTitle(stuck.length)}
            actions={
              <button
                type="button"
                className="xr-btn xr-btn--secondary xr-btn--sm"
                onClick={() => {
                  choose('stuck');
                  setFocusStuck((n) => n + 1);
                }}
              >
                {ALL_CONTENT.showStuck}
              </button>
            }
          >
            {stuckBody(
              stuck.map((row) => ({
                reference: row.ref.id,
                name: row.name,
                course: row.courseCode,
              })),
            )}
          </Notice>
        </div>
      ) : null}
      {updates.length > 0 ? (
        <div className="mb-4">
          <Notice
            tone="info"
            role="status"
            title={updatesWaitingTitle(updates.length)}
            actions={
              <Link className="xr-btn xr-btn--secondary xr-btn--sm" href={CONTENT_UPDATES_ADDRESS}>
                {ALL_CONTENT.openUpdates}
              </Link>
            }
          >
            {updates
              .map(({ update, experimentName }) =>
                updateWaitingLine(
                  update.id,
                  experimentName,
                  update.baseVersionLabel,
                  update.versionLabel,
                ),
              )
              .join(' ')}
          </Notice>
        </div>
      ) : null}
      <section
        ref={sectionRef}
        className="xr-section"
        aria-labelledby={headingId}
        aria-busy={loading ? true : undefined}
      >
        <div className="xr-section-head">
          <h2 id={headingId} className="xr-h2">
            {ALL_CONTENT.sectionTitle}
          </h2>
          {loading ? (
            <span className="xr-meta" role="status">
              {stateWords('SA-12.loading')}
            </span>
          ) : (
            <span className="xr-meta">{ALL_CONTENT.sectionMeta}</span>
          )}
        </div>
        {failed ? (
          <SectionBody>
            <FailedState title={stateWords('SA-12.failed')} onRetry={retry}>
              {stateWords('SA-12.failed.line')}
            </FailedState>
          </SectionBody>
        ) : loading ? (
          <SkeletonRows />
        ) : (
          <StatusTabs
            label={ALL_CONTENT.tabsLabel}
            idPrefix={TABS_ID}
            className="px-4"
            panelClassName="[&>.xr-toolbar]:px-6 [&>.xr-toolbar]:py-4 [&>.xr-toolbar-status]:px-6 [&>.xr-toolbar-status]:pb-3"
            tabs={ALL_CONTENT_SHOWS.map((id) => ({
              id,
              label: ALL_CONTENT.tabs[id],
              count: records.filter((row) => inShow(row, id)).length,
            }))}
            selected={show}
            onSelect={(id) => choose(id as AllContentShow)}
          >
            <ListToolbar
              search={{
                id: 'all-content-search',
                label: ALL_CONTENT.searchLabel,
                placeholder: ALL_CONTENT.searchPlaceholder,
                value: search,
                onChange: type,
              }}
              status={countWords}
              chips={[]}
              clearLabel={ALL_CONTENT.clearFilters}
              onClearFilters={filtered ? clearFilters : undefined}
            />
            {shown.length > 0 ? (
              <ContentTable rows={shown} />
            ) : (
              <SectionBody>
                <NoMatch
                  title={ALL_CONTENT.noMatchTitle}
                  headingLevel={3}
                  onClearFilters={clearFromNoMatch}
                >
                  {ALL_CONTENT.noMatchLine}
                </NoMatch>
              </SectionBody>
            )}
          </StatusTabs>
        )}
      </section>
    </PageContent>
  );
}

/** B7-06 f0 table: "Content · Workflow status · Who can act · (Action)". */
function ContentTable({ rows }: { readonly rows: readonly ContentRow[] }) {
  const { columns } = ALL_CONTENT;
  return (
    <div className="xr-table-wrap rounded-none border-x-0 border-b-0">
      <table className="xr-table">
        <thead>
          <tr>
            <th scope="col">{columns.content}</th>
            <th scope="col">{columns.status}</th>
            <th scope="col">{columns.who}</th>
            <th scope="col">
              <span className="xr-sr">{columns.action}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <ContentLine key={`${row.ref.kind}:${row.ref.id}`} row={row} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ContentLine({ row }: { readonly row: ContentRow }) {
  const status = workflowWords(row.status, row.stuck, row.live, null);
  const reference = row.ref.kind === 'SUB' ? row.ref.id : ALL_CONTENT.publishedExperiment;
  return (
    <tr>
      <td className="is-primary">
        <strong>{row.name}</strong>
        <span className="xr-meta block">
          <span className="xr-id">{reference}</span>
          {row.courseCode ? ` · ${row.courseCode}` : null}
        </span>
        <span className="mt-[6px] block">
          <FormatChips formats={row.formats} />
        </span>
      </td>
      <td data-label={ALL_CONTENT.cellLabels.status}>
        <StatusPill tone={status.tone}>{status.words}</StatusPill>
        <span className="xr-meta mt-1 block">{status.where}</span>
        {row.openUpdate && row.openUpdateState ? (
          <span className="xw-tag mt-[6px]">
            <Icon name="updates" />
            {updateTag(row.openUpdate, row.openUpdateState)}
          </span>
        ) : null}
      </td>
      <td data-label={ALL_CONTENT.cellLabels.who}>{row.whoCanAct ?? ALL_CONTENT.nobody}</td>
      <td>
        <Link
          className="xr-btn xr-btn--secondary xr-btn--sm"
          href={contentRecordAddress(row.ref.id)}
          aria-label={openRecordLabel(row.name)}
        >
          {ALL_CONTENT.open}
        </Link>
      </td>
    </tr>
  );
}

/** A row's formats (`span.xv-chips` of compact chips), WEB · AR · VR · MR. */
export function FormatChips({ formats }: { readonly formats: readonly Technology[] }) {
  return (
    <span className="xv-chips">
      {inDisplayOrder(formats).map((format) => (
        <FormatBadge key={format} format={FORMAT_META[format].code} compact />
      ))}
    </span>
  );
}

/** Undrawn: loading — skeleton rows in the table's shape (hidden from screen readers). */
function SkeletonRows() {
  return (
    <div aria-hidden="true">
      {[0, 1, 2, 3, 4].map((row) => (
        <div
          key={row}
          className="grid grid-cols-[1.4fr_1.4fr_1fr_100px] gap-5 px-4 py-[18px] [border-block-start:1px_solid_var(--xr-line)]"
        >
          {[0, 1, 2, 3].map((cell) => (
            <Skeleton key={cell} />
          ))}
        </div>
      ))}
    </div>
  );
}
