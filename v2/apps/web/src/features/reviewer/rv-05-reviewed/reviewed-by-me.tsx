'use client';

import {
  Button,
  ButtonLink,
  ListState,
  ListSurface,
  PageHead,
  type RvDecisionRow,
  RvDecisionsTable,
  RvKindTag,
  RvListPanel,
  RvListTabs,
  rvListTabId,
  RvListToolbar,
  RvLoadingRows,
} from '@xr/ui/v3';
import { type ReactNode, useRef, useState } from 'react';

import { dayMonthYear } from '@/copy/dates';
import {
  CLEAR_FILTERS,
  decisionRowLabel,
  decisionsCountWords,
  decisionWords,
  LIST_FAILED,
  REVIEWED_BY_ME,
  type ReviewedTab,
  searchChip,
} from '@/copy/reviewer-lists';
import { REVIEW_QUEUE_ADDRESS, REVIEWED_BY_ME_TITLE, reviewedByMePlacement } from '@/nav/reviewer';
import { useReviewedByMe } from '@/queries/production';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import {
  approvedOf,
  decidedAddressOf,
  decidedAt,
  decidedKind,
  type DecidedRow,
} from '../rv-02-queue/list-facts';
import { type CourseNameOf, useRvCourseNames } from '../shared/course-names';
import { reviewedRowStanding } from '../shared/standing';
import { useRvTodayLine } from '../shared/waiting';

export type { DecidedRow } from '../rv-02-queue/list-facts';

/** The Show tabs (`reviewedVals` `TABS`): an update, else a submission (a re-check included). */
export function showsRow(filter: ReviewedTab, row: DecidedRow): boolean {
  if (filter === 'update') return row.type === 'update';
  if (filter === 'new') return row.type !== 'update';
  return true;
}

/** The search (`reviewedVals`): the name, the internal reference (not shown) or the course code. */
export function matchesSearch(row: DecidedRow, search: string): boolean {
  const text = search.trim().toLocaleLowerCase('en');
  return (
    text === '' ||
    [row.name, row.recordRef.id, row.courseCode ?? '']
      .join(' ')
      .toLocaleLowerCase('en')
      .includes(text)
  );
}

/** The decision's words and tone (`decLabel`, `stCls`): approved ok, returned err. */
export function decisionView(row: DecidedRow): { readonly words: string; readonly ok: boolean } {
  const ok = approvedOf(row);
  return { words: decisionWords(ok, row.type === 'update'), ok };
}

const TITLE_ID = 'rv-h1-rb';
const TABS_ID = 'rv-rt';
const PANEL_ID = 'rv-r-panel';
const TABS: readonly ReviewedTab[] = ['all', 'new', 'update'];

/**
 * RV-05 Reviewed by me — the V3 Refined B design (the owner-approved export
 * design/v3-refined-b/roles/RV-v1, `RV.dc.html` `isReviewed` and `reviewedVals`), at
 * `/reviewer/reviewed`.
 *
 * - **Read**: `ProductionService.listReviewedByMe` — each record the reviewer decided, with the
 *   last decision on it, newest first, and where the record is now; the course names come from the
 *   role's one catalogue lookup.
 * - **As the export draws it**: the head (date on phones, “Reviewed by me”, its line); the surface
 *   with the Show tabs (All, New submissions, Updates, each with its count), the search, the count,
 *   the search's chip and “Clear filters”; the table Experiment (name, course) · Type (as decided)
 *   · Your decision (approved or returned, and when) · Where it is now, each row one link to the
 *   decided item, read-only (RV-06; an update RV-04 decided). No record is named by its reference.
 * - **States**: no match (Clear filters), nothing decided (Open the review queue; no tools), loading
 *   (the four-column skeleton; no counts) and couldn't load (Try again reads again and moves focus
 *   to the title).
 */
export function ReviewedByMe() {
  useShellPage(reviewedByMePlacement());
  const titleRef = useRef<HTMLHeadingElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const date = useRvTodayLine();
  const courseName = useRvCourseNames();
  const read = useReviewedByMe();
  const [tab, setTab] = useState<ReviewedTab>('all');
  const [search, setSearch] = useState('');
  const rows = read.data?.ok ? read.data.value : null;
  const failed = read.isError || (read.data !== undefined && !read.data.ok);

  const retry = () => {
    void read.refetch();
    titleRef.current?.focus();
  };
  const clear = () => {
    setTab('all');
    setSearch('');
  };

  const loaded = rows !== null && !failed;
  const empty = loaded && rows.length === 0;
  const base = rows ? rows.filter((row) => matchesSearch(row, search)) : [];
  const shown = base.filter((row) => showsRow(tab, row));
  const filtered = search.trim() !== '' || tab !== 'all';

  let body: ReactNode;
  if (failed) {
    body = (
      <ListState
        kind="failed"
        title={REVIEWED_BY_ME.failedTitle}
        action={<Button onClick={retry}>{LIST_FAILED.retry}</Button>}
      >
        {LIST_FAILED.line}
      </ListState>
    );
  } else if (rows === null) {
    body = <RvLoadingRows message={REVIEWED_BY_ME.loading} cells={[2, 1, 2, 1]} />;
  } else if (empty) {
    body = (
      <ListState
        kind="empty"
        icon="check"
        title={REVIEWED_BY_ME.emptyTitle}
        action={<ButtonLink href={REVIEW_QUEUE_ADDRESS}>{REVIEWED_BY_ME.openQueue}</ButtonLink>}
      >
        {REVIEWED_BY_ME.emptyLine}
      </ListState>
    );
  } else if (shown.length === 0) {
    body = (
      <ListState
        kind="nomatch"
        title={REVIEWED_BY_ME.noMatchTitle}
        action={
          <Button
            onClick={() => {
              clear();
              searchRef.current?.focus();
            }}
          >
            {CLEAR_FILTERS}
          </Button>
        }
      >
        {REVIEWED_BY_ME.noMatchLine}
      </ListState>
    );
  } else {
    body = (
      <RvDecisionsTable
        caption={REVIEWED_BY_ME.caption}
        headers={REVIEWED_BY_ME.columns}
        decidedLabel={REVIEWED_BY_ME.decidedLabel}
        nowLabel={REVIEWED_BY_ME.nowLabel}
        rows={shown.map((row) => decisionRow(row, courseName))}
      />
    );
  }

  return (
    <>
      <PageHead
        title={REVIEWED_BY_ME_TITLE}
        titleId={TITLE_ID}
        titleRef={titleRef}
        titleFocusTarget
        date={date}
        lead={REVIEWED_BY_ME.lead}
      />
      <ListSurface label={REVIEWED_BY_ME.surfaceLabel}>
        {empty ? null : (
          <>
            <RvListTabs
              label={REVIEWED_BY_ME.tabsLabel}
              idPrefix={TABS_ID}
              panelId={PANEL_ID}
              three
              value={tab}
              onChange={setTab}
              tabs={TABS.map((value) => ({
                value,
                label: REVIEWED_BY_ME.tabs[value],
                count: loaded ? base.filter((row) => showsRow(value, row)).length : undefined,
              }))}
            />
            <RvListToolbar
              label={REVIEWED_BY_ME.toolsLabel}
              searchRef={searchRef}
              search={{
                id: 'rv-r-search',
                label: REVIEWED_BY_ME.search,
                placeholder: REVIEWED_BY_ME.searchPlaceholder,
                value: search,
                onChange: setSearch,
              }}
              count={loaded ? decisionsCountWords(shown.length, rows.length, filtered) : undefined}
              chips={
                loaded && search.trim()
                  ? [{ key: 'search', label: searchChip(search), onRemove: () => setSearch('') }]
                  : []
              }
              clear={loaded && filtered ? { label: CLEAR_FILTERS, onClear: clear } : undefined}
            />
          </>
        )}
        <RvListPanel id={PANEL_ID} labelledBy={empty ? null : rvListTabId(TABS_ID, tab)}>
          {body}
        </RvListPanel>
      </ListSurface>
    </>
  );
}

/** One decision (the export's `reviewedVals` `rows`). */
function decisionRow(row: DecidedRow, courseName: CourseNameOf): RvDecisionRow {
  const kind = decidedKind(row);
  const { words, ok } = decisionView(row);
  const at = decidedAt(row);
  const when = at ? dayMonthYear(at) : '';
  return {
    key: `${row.recordRef.kind}:${row.recordRef.id}`,
    href: decidedAddressOf(row),
    name: row.name,
    accessibleName: decisionRowLabel(row.name, words, when),
    courseCode: row.courseCode,
    courseName: courseName(row.courseCode),
    kind: <RvKindTag kind={kind.kind} label={kind.label} detail={kind.detail} />,
    decision: words,
    approved: ok,
    when,
    now: reviewedRowStanding(row)?.now ?? '',
  };
}
