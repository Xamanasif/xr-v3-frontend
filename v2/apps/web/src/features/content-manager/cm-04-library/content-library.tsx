'use client';

import type { libraryOutput, Out } from '@xr/contracts/draft';
import { Icon, Link, ListToolbar, PageContent, PageHeader, StatusTabs } from '@xr/ui';
import { useId, useState } from 'react';

import {
  approvedWhere,
  CONTENT_LIBRARY,
  libraryCountWords,
  newSubmissionWhere,
  openDecisionLabel,
  openLabel,
  openUpdateTag,
  overrideWhere,
  publishedWhere,
  recheckWhere,
  returnedByReviewerWhere,
  revisionWhere,
  sentBackWhere,
} from '@/copy/cm-lists';
import { stateWords } from '@/copy/state-copy';
import {
  CONTENT_LIBRARY_TITLE,
  contentLibraryPlacement,
  LIBRARY_TABS,
  libraryAddress,
  type LibraryTab,
  libraryTabOf,
  publicationDecisionAddress,
  publishedExperimentAddress,
} from '@/nav/content-manager';
import { useAppNavigation } from '@/nav/navigation';
import { useContentLibrary, useReadyToPublish } from '@/queries/production';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { openChecks } from '../cm-02-ready/ready-to-publish';
import { FormatChips, LoadFailed, LoadingRows, useRetryFocus } from '../cm-02-ready/list-parts';

type Library = Out<typeof libraryOutput>;
type LibraryRow = Library['rows'][number];
type SubmissionRow = Extract<LibraryRow, { kind: 'submission' }>;

/** “Where it is” for a submission row (state-copy `CM-04.where-it-is`). */
export function submissionWhere(row: SubmissionRow, blockers: number): string {
  const { status, revision } = row.submission;
  switch (status.state) {
    case 'with-content-manager':
      return approvedWhere(row.approvedAt ?? status.since, blockers);
    case 'with-academic-reviewer':
      if (status.reason === 'recheck') return recheckWhere(status.since);
      if (status.reason === 'resubmission') return revisionWhere(revision);
      return newSubmissionWhere(status.since);
    case 'resubmitted':
      return revisionWhere(revision);
    case 'returned':
      if (status.by === 'content-manager') return sentBackWhere(status.since);
      if (status.by === 'super-admin-override') return overrideWhere(status.since);
      return returnedByReviewerWhere(status.since);
    case 'draft':
    case 'published':
      // Not listed by the service (drafts are the Vendor’s; published rows are experiments).
      return '';
  }
}

/**
 * CM-04 Content library — board B6-06 f1, f4, at `/content-manager/library` (`?tab=in-review |
 * with-vendor | published`; Ready has none): “Every experiment you look after”.
 *
 * - **Read**: `ProductionService.getLibrary` — facts (PC-65): the four tabs’ counts and the chosen
 *   tab’s rows, a submission with its record (Ready: approved; In review: with the Academic
 *   Reviewer, a re-check included; With vendor: returned) or a published experiment with its live
 *   version and its open correction’s state. Drafts stay with the Vendor and are not listed. The
 *   service searches (name, ID or course code); the rows on show stay while a new tab or search
 *   loads. The Ready tab’s publication check comes from `listReadyToPublish` (“· 1 to resolve”).
 * - **As B6-06 draws it**: status tabs Ready · In review · With vendor · Published with their
 *   counts (`role="tablist"`, ← → between them; they scroll sideways with a fade at 375, f4), the
 *   search “Name, ID or course”, the count “Ready · 3 of 3” (announced) with “Clear search” while a
 *   search is applied, and the table Experiment (name, id · course) · Formats · Where it is
 *   (state-copy `CM-04.where-it-is`) · “Open decision” (Ready, to CM-03) or “Open” (In review and
 *   With vendor to CM-03 read-only; Published to CM-05). Below 760 px of content the rows become
 *   labelled blocks (f4). A tab or search with no rows: “Nothing here”.
 * - The tab lives here while the page is on show; the address mirrors it (replaced, no history
 *   entry); an address from outside (Back) is read again (state-copy `CM-04.address`).
 * - Undrawn: loading and failed + Try again (state-copy `CM-04.loading`, `CM-04.failed`).
 *   Nothing here changes a record.
 */
export function ContentLibrary() {
  useShellPage(contentLibraryPlacement());
  const headingId = useId();
  const navigation = useAppNavigation();
  const addressed = libraryTabOf(navigation.search);
  const [tab, setTab] = useState<LibraryTab>(addressed);
  const [seenSearch, setSeenSearch] = useState(navigation.search);
  if (navigation.search !== seenSearch) {
    setSeenSearch(navigation.search);
    setTab(addressed);
  }
  const [search, setSearch] = useState('');

  const read = useContentLibrary({ tab, search });
  const ready = useReadyToPublish(tab === 'ready');
  const library = read.data?.ok ? read.data.value : null;
  const failed = read.isError || (read.data !== undefined && !read.data.ok);
  const retried = useRetryFocus(library !== null);
  const filtered = search.trim() !== '';

  // The count is announced (`role="status"`): while the next tab’s or search’s rows load, the
  // rows on show are the previous answer’s, so the count keeps its last settled words.
  const settled =
    library === null || read.isPlaceholderData
      ? null
      : libraryCountWords(CONTENT_LIBRARY.tabs[tab], library.rows.length, library.counts[tab]);
  const [countWords, setCountWords] = useState('');
  if (settled !== null && settled !== countWords) setCountWords(settled);
  // The tab the rows on show belong to (the previous tab’s while the next one loads).
  const [rowsTab, setRowsTab] = useState<LibraryTab>(tab);
  if (library !== null && !read.isPlaceholderData && rowsTab !== tab) setRowsTab(tab);

  const blockersOf = (submissionId: string): number => {
    const row = ready.data?.ok
      ? ready.data.value.find((entry) => entry.submission.id === submissionId)
      : undefined;
    return row ? openChecks(row.check).length : 0;
  };

  const choose = (next: LibraryTab) => {
    setTab(next);
    navigation.replace(libraryAddress(next));
  };

  const retry = () => {
    retried();
    void read.refetch();
  };

  return (
    <PageContent wrap="wide">
      <PageHeader
        className="mb-6"
        title={CONTENT_LIBRARY_TITLE}
        meta={<span className="xl-meta">{CONTENT_LIBRARY.meta}</span>}
      />
      <section
        className="xr-section"
        aria-labelledby={headingId}
        aria-busy={library === null && !failed ? true : undefined}
      >
        <div className="xr-section-head">
          <h2 id={headingId} className="xr-h2">
            {CONTENT_LIBRARY.sectionTitle}
          </h2>
          <span className="xr-meta">{CONTENT_LIBRARY.sectionMeta}</span>
        </div>
        <StatusTabs
          label={CONTENT_LIBRARY.tabsLabel}
          idPrefix="library"
          className="px-4"
          panelClassName="[&>.xr-toolbar]:px-6 [&>.xr-toolbar]:py-4 [&>.xr-toolbar-status]:px-6 [&>.xr-toolbar-status]:pb-3"
          tabs={LIBRARY_TABS.map((id) => ({
            id,
            label: CONTENT_LIBRARY.tabs[id],
            ...(library ? { count: library.counts[id] } : {}),
          }))}
          selected={tab}
          onSelect={(id) => choose(id as LibraryTab)}
        >
          <ListToolbar
            search={{
              id: 'library-search',
              label: CONTENT_LIBRARY.searchLabel,
              placeholder: CONTENT_LIBRARY.searchPlaceholder,
              value: search,
              onChange: setSearch,
            }}
            status={countWords}
            clearLabel={CONTENT_LIBRARY.clearSearch}
            onClearFilters={filtered ? () => setSearch('') : undefined}
          />
          {failed ? (
            <LoadFailed title={stateWords('CM-04.failed')} onRetry={retry} />
          ) : library === null ? (
            <LoadingRows
              label={stateWords('CM-04.loading')}
              grid="grid-cols-[1.6fr_.9fr_1.2fr_140px]"
              cells={4}
            />
          ) : library.rows.length === 0 ? (
            <Nothing />
          ) : (
            <LibraryTable rows={library.rows} tab={rowsTab} blockersOf={blockersOf} />
          )}
        </StatusTabs>
      </section>
    </PageContent>
  );
}

/** f1, f4: the table; stacked labelled blocks below 760 px of content. */
function LibraryTable({
  rows,
  tab,
  blockersOf,
}: {
  readonly rows: readonly LibraryRow[];
  readonly tab: LibraryTab;
  readonly blockersOf: (submissionId: string) => number;
}) {
  const { columns } = CONTENT_LIBRARY;
  return (
    <div className="xr-table-wrap rounded-none border-x-0 border-b-0">
      <table className="xr-table">
        <thead>
          <tr>
            <th scope="col">{columns.experiment}</th>
            <th scope="col">{columns.formats}</th>
            <th scope="col">{columns.whereItIs}</th>
            <th scope="col">
              <span className="xr-sr">{columns.action}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) =>
            row.kind === 'submission' ? (
              <SubmissionLine
                key={row.submission.id}
                row={row}
                ready={tab === 'ready'}
                blockers={blockersOf(row.submission.id)}
              />
            ) : (
              <tr key={row.experiment.id}>
                <td className="is-primary">
                  <strong>{row.experiment.live.catalogue.name}</strong>
                  {row.courseCode ? (
                    <span className="xr-meta block">
                      <span className="xw-nowrap">{row.courseCode}</span>
                    </span>
                  ) : null}
                </td>
                <td data-label={columns.formats}>
                  <FormatChips formats={row.experiment.live.formats.map((entry) => entry.format)} />
                </td>
                <td data-label={columns.whereItIs}>
                  {publishedWhere(
                    row.experiment.live.label,
                    row.experiment.live.liveFrom,
                    row.openUpdate ? openUpdateTag(row.openUpdate.state) : null,
                  )}
                </td>
                <td>
                  <Link
                    className="xr-btn xr-btn--secondary xr-btn--sm"
                    href={publishedExperimentAddress(row.experiment.id)}
                    aria-label={openLabel(row.experiment.live.catalogue.name)}
                  >
                    {CONTENT_LIBRARY.open}
                  </Link>
                </td>
              </tr>
            ),
          )}
        </tbody>
      </table>
    </div>
  );
}

function SubmissionLine({
  row,
  ready,
  blockers,
}: {
  readonly row: SubmissionRow;
  readonly ready: boolean;
  readonly blockers: number;
}) {
  const { columns } = CONTENT_LIBRARY;
  const { submission } = row;
  const name = submission.content.name;
  return (
    <tr>
      <td className="is-primary">
        <strong>{name}</strong>
        <span className="xr-meta block">
          <span className="xr-id">{submission.id}</span>
          {row.courseCode ? (
            <>
              {' · '}
              <span className="xw-nowrap">{row.courseCode}</span>
            </>
          ) : null}
        </span>
      </td>
      <td data-label={columns.formats}>
        <FormatChips formats={submission.content.formats} />
      </td>
      <td data-label={columns.whereItIs}>{submissionWhere(row, blockers)}</td>
      <td>
        <Link
          className="xr-btn xr-btn--secondary xr-btn--sm"
          href={publicationDecisionAddress(submission.id)}
          aria-label={ready ? openDecisionLabel(name) : openLabel(name)}
        >
          {ready ? CONTENT_LIBRARY.openDecision : CONTENT_LIBRARY.open}
        </Link>
      </td>
    </tr>
  );
}

/** B6-06 `lNone`: “Nothing here · Try another tab or clear the search.” */
function Nothing() {
  return (
    <div className="xr-section-body">
      <div className="xr-empty">
        <span className="xr-empty-icon">
          <Icon name="search" />
        </span>
        <h3 className="xr-h3 m-0">{CONTENT_LIBRARY.nothingTitle}</h3>
        <p className="xr-body m-0 text-ink-2">{CONTENT_LIBRARY.nothingLine}</p>
      </div>
    </div>
  );
}
