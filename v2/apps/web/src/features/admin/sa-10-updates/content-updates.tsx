'use client';

import {
  EmptyState,
  FailedState,
  Link,
  PageContent,
  PageHeader,
  SectionBody,
  SectionTabs,
  Skeleton,
  StatusPill,
  StatusTabs,
} from '@xr/ui';
import { useEffect, useId, useState } from 'react';

import { rowActionLabel, type ReleaseShowKey, UPDATES_PAGE } from '@/copy/release';
import { stateWords } from '@/copy/state-copy';
import {
  CONTENT_TABS,
  CONTENT_UPDATES_ADDRESS,
  contentUpdatesAddress,
  contentUpdatesPlacement,
  UPDATE_SHOWS,
  type UpdateShow,
  updateDecisionAddress,
  updateShowOf,
} from '@/nav/admin-content';
import { useAppNavigation } from '@/nav/navigation';
import type { ReleaseRow } from '@/queries/correction-view';
import { useUpdatesForRelease } from '@/queries/corrections';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { RELEASE_TAB, type ReleaseRowFacts, releaseRowFacts } from './updates-view';

/**
 * SA-10 Content › Updates — boards B7-05 f0 (Waiting for you), f2 (On hold), f3 (Released), f4
 * (nothing waiting) and B7-11 f0, at `/admin/content/updates` (`/admin/content` redirects here).
 *
 * - **Reads**: `CorrectionService.listUpdatesForRelease({ tab })` once per tab — each tab's figure
 *   is its own read's length, the rows on show the selected tab's — in the service's order. The
 *   Super Admin sees a correction only once the Academic Reviewer has approved it (UPD-18): the
 *   service decides which updates each tab holds.
 * - **As B7-05 draws it**: “Content” with its one line, the sub-navigation “Updates · All content”
 *   (SA-12, another group's page), the section “Corrections to published content · Approved by the
 *   Academic Reviewer”, the status tabs “Waiting for you · On hold · Released” (`role="tablist"`,
 *   ← → between them) and the table Update (“Distillation Column · 1.2 → 1.3”, “UPD-0005 · CHE
 *   ZG513”) · Status (the chip and its day) · Review / Open, which opens the decision (SA-11).
 *   Below 760 px of content each row is a labelled block (the v46 sheet; f2, f3).
 * - **Address**: the tab is mirrored in `?show=` (state-copy `SA-10.show-address`); an unknown
 *   value is replaced by the list's own address.
 * - **States**: loading (skeleton rows, announced), failed with “Try again”, and each tab's calm
 *   empty state (f4: “Nothing is waiting for a release decision”). Nothing on this page changes a
 *   record: there is no “Publish” anywhere on this path.
 */
export function ContentUpdates() {
  useShellPage(contentUpdatesPlacement());
  const headingId = useId();
  const navigation = useAppNavigation();
  const asked = updateShowOf(navigation.search);
  useEffect(() => {
    if (asked === null) navigation.replace(CONTENT_UPDATES_ADDRESS);
  }, [asked, navigation]);

  const [show, setShow] = useState<UpdateShow>(asked ?? 'waiting');
  const [seenSearch, setSeenSearch] = useState(navigation.search);
  if (navigation.search !== seenSearch) {
    setSeenSearch(navigation.search);
    setShow(updateShowOf(navigation.search) ?? 'waiting');
  }

  const reads = {
    waiting: useUpdatesForRelease(RELEASE_TAB.waiting),
    'on-hold': useUpdatesForRelease(RELEASE_TAB['on-hold']),
    released: useUpdatesForRelease(RELEASE_TAB.released),
  } satisfies Readonly<Record<ReleaseShowKey, ReturnType<typeof useUpdatesForRelease>>>;
  const all = Object.values(reads);
  const failed = all.some((read) => read.isError || (read.data !== undefined && !read.data.ok));
  const loading = !failed && all.some((read) => read.data === undefined);
  const rowsOf = (key: ReleaseShowKey): readonly ReleaseRow[] => {
    const answer = reads[key].data;
    return answer?.ok ? answer.value : [];
  };

  const select = (next: UpdateShow) => {
    setShow(next);
    if (next !== show) navigation.replace(contentUpdatesAddress(next));
  };

  const retry = () => {
    for (const read of all) {
      if (read.isError || (read.data !== undefined && !read.data.ok)) void read.refetch();
    }
  };

  const rows = rowsOf(show).map((row) => releaseRowFacts(row, show));

  return (
    <PageContent wrap="wide">
      <PageHeader
        className="mb-4"
        title={UPDATES_PAGE.title}
        meta={<span className="xl-meta">{UPDATES_PAGE.meta}</span>}
      />
      <SectionTabs
        className="mb-5"
        label={UPDATES_PAGE.tabsLabel}
        surface="white"
        tabs={CONTENT_TABS.map((tab) => ({
          href: tab.href,
          label: tab.label,
          current: tab.key === 'updates',
        }))}
      />
      <section
        className="xr-section"
        aria-labelledby={headingId}
        aria-busy={loading ? true : undefined}
      >
        <div className="xr-section-head">
          <h2 id={headingId} className="xr-h2">
            {UPDATES_PAGE.sectionTitle}
          </h2>
          {loading ? (
            <span className="xr-meta" role="status">
              {stateWords('SA-10.loading')}
            </span>
          ) : (
            <span className="xr-meta">{UPDATES_PAGE.sectionMeta}</span>
          )}
        </div>
        {failed ? (
          <SectionBody>
            <FailedState title={stateWords('SA-10.failed')} onRetry={retry}>
              {stateWords('SA-10.failed.line')}
            </FailedState>
          </SectionBody>
        ) : loading ? (
          <SkeletonRows />
        ) : (
          <StatusTabs
            label={UPDATES_PAGE.showLabel}
            idPrefix="updates"
            className="px-4"
            tabs={UPDATE_SHOWS.map((key) => ({
              id: key,
              label: UPDATES_PAGE.shows[key],
              count: rowsOf(key).length,
            }))}
            selected={show}
            onSelect={(id) => select(id as UpdateShow)}
          >
            {rows.length > 0 ? (
              <UpdatesTable rows={rows} />
            ) : (
              <SectionBody>
                <EmptyState
                  icon="done"
                  headingLevel={3}
                  title={UPDATES_PAGE.empty[show]}
                  className="[&_.xr-empty-icon]:bg-ok-bg [&_.xr-empty-icon]:text-ok [&_p]:text-ink-2"
                >
                  {UPDATES_PAGE.emptyLine}
                </EmptyState>
              </SectionBody>
            )}
          </StatusTabs>
        )}
      </section>
    </PageContent>
  );
}

/** B7-05 f0, f2, f3: “Update · Status · (Action)”; labelled blocks below 760 px of content. */
function UpdatesTable({ rows }: { readonly rows: readonly ReleaseRowFacts[] }) {
  const { columns } = UPDATES_PAGE;
  return (
    <div className="xr-table-wrap rounded-none border-x-0 border-b-0">
      <table className="xr-table">
        <thead>
          <tr>
            <th scope="col">{columns.update}</th>
            <th scope="col">{columns.status}</th>
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
                  <span className="xr-id">{row.id}</span>
                  {row.courseCode ? ` · ${row.courseCode}` : null}
                </span>
              </td>
              <td data-label={columns.status}>
                <StatusPill tone={row.status.tone}>{row.status.words}</StatusPill>
                <span className="xr-meta mt-[2px] block">{row.when}</span>
              </td>
              <td>
                <Link
                  className="xr-btn xr-btn--secondary xr-btn--sm"
                  href={updateDecisionAddress(row.id)}
                  aria-label={rowActionLabel(row.action, row.id, row.name)}
                >
                  {row.action}
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Skeleton rows in the table's shape (board 04 “Skeleton in the shape of the content”). */
function SkeletonRows() {
  return (
    <div aria-hidden="true">
      {[0, 1, 2].map((row) => (
        <div
          key={row}
          className="grid grid-cols-[1.4fr_1fr_100px] gap-5 px-4 py-[18px] [border-block-start:1px_solid_var(--xr-line)]"
        >
          {[0, 1, 2].map((cell) => (
            <Skeleton key={cell} />
          ))}
        </div>
      ))}
    </div>
  );
}
