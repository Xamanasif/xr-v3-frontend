'use client';

import {
  Button,
  ButtonLink,
  ListState,
  ListSurface,
  PageHead,
  RvFormatBadges,
  RvKindTag,
  RvListPanel,
  RvListTabs,
  rvListTabId,
  RvListToolbar,
  RvLoadingRows,
  type RvQueueRow,
  RvQueueTable,
  type RvToolbarChip,
  type SelectOption,
} from '@xr/ui/v3';
import { type ReactNode, useRef, useState } from 'react';

import { dayMonthYear } from '@/copy/dates';
import {
  CLEAR_FILTERS,
  courseChip,
  formatsLabel,
  LIST_FAILED,
  type QueueTab,
  queueCountWords,
  queueRowLabel,
  REVIEW_QUEUE,
  type ReviewItemType,
  searchChip,
} from '@/copy/reviewer-lists';
import { useAppNavigation } from '@/nav/navigation';
import { REVIEW_QUEUE_TITLE, REVIEWED_BY_ME_ADDRESS, reviewQueuePlacement } from '@/nav/reviewer';
import { useReviewerOverview, useReviewQueue } from '@/queries/production';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { type CourseNameOf, useRvCourseNames } from '../shared/course-names';
import { queueItemKind } from '../shared/kind';
import { useRvToday, useRvTodayLine, waitingAge } from '../shared/waiting';
import {
  courseOf,
  focusOf,
  formatCodes,
  fromOf,
  queueAddress,
  type QueueItem,
  reviewAddressOf,
  typeOf,
} from './list-facts';

export { typeOf } from './list-facts';
export type { QueueItem } from './list-facts';

export interface QueueFilters {
  readonly type: ReviewItemType | null;
  /** A course code (“CHE ZG513”): the queue's items name their course by code only. */
  readonly course: string | null;
  readonly search: string;
}

const NO_FILTERS: QueueFilters = { type: null, course: null, search: '' };

/**
 * The items the filters leave (the export's `queueVals`; state-copy `RV-02.filters`): the search
 * in the name, the internal reference (no longer shown, still matched), the course code or the
 * sender (“who”), ignoring case; the type; the course by its code. The queue's own order (oldest
 * first) is kept.
 */
export function filterQueue(
  items: readonly QueueItem[],
  filters: QueueFilters,
): readonly QueueItem[] {
  const text = filters.search.trim().toLocaleLowerCase('en');
  return items.filter(
    (item) =>
      (text === '' ||
        [item.name, item.ref.id, item.courseCode ?? '', item.who]
          .join(' ')
          .toLocaleLowerCase('en')
          .includes(text)) &&
      (filters.type === null || item.type === filters.type) &&
      (filters.course === null || item.courseCode === filters.course),
  );
}

/**
 * The Course filter's options (state-copy `RV-02.filters`): “All courses”, the reviewer's scope
 * courses by code (the overview read), then any other course code a queued item carries; an
 * addressed code that is in neither is kept.
 */
export function courseOptions(
  scope: readonly string[],
  items: readonly QueueItem[],
  chosen: string | null,
): SelectOption[] {
  const codes: string[] = [];
  for (const code of [
    ...scope,
    ...items.map((item) => item.courseCode),
    ...(chosen ? [chosen] : []),
  ]) {
    if (code && !codes.includes(code)) codes.push(code);
  }
  return [
    { value: 'all', label: REVIEW_QUEUE.allCourses },
    ...codes.map((code) => ({ value: code, label: code })),
  ];
}

const TITLE_ID = 'rv-h1-q';
const TABS_ID = 'rv-qt';
const PANEL_ID = 'rv-q-panel';
const TABS: readonly QueueTab[] = ['all', 'new', 'recheck', 'update'];

/**
 * RV-02 Review queue — the V3 Refined B design (the owner-approved export
 * design/v3-refined-b/roles/RV-v1, `RV.dc.html` `isQueue` and `queueVals`), at `/reviewer/queue`
 * (`?type=`, `?course=`).
 *
 * - **Reads**: `ProductionService.getReviewQueue` unfiltered — the submissions and updates with the
 *   reviewer, oldest first (the rail counts the same read) — and `getReviewerOverview` for the
 *   scope courses (the Course filter) and each re-check's reason; the course names come from the
 *   role's one catalogue lookup.
 * - **As the export draws it**: the head (date on phones, “Review queue”, its line); the surface
 *   with the type tabs (All, New submissions, Re-checks, Updates, each with its count; the arrow
 *   keys, Home and End), the search and Course, the count, a chip per filter and “Clear filters”;
 *   the table Experiment (name, course, formats) · Review type (the tag, who sent it) · What to
 *   look at · Waiting (days, since), each row one link to its review (RV-03; an update RV-04). No
 *   record is named by its reference. Type and Course are mirrored in the address.
 * - **States**: no match (Clear filters), nothing waiting (Open Reviewed by me; no tools), loading
 *   (the four-column skeleton; no counts) and couldn't load (Try again reads again and moves focus
 *   to the title).
 */
export function ReviewQueue() {
  useShellPage(reviewQueuePlacement());
  const navigation = useAppNavigation();
  const fromAddress = (search: string): QueueFilters => ({
    ...NO_FILTERS,
    type: typeOf(search),
    course: courseOf(search),
  });
  const [filters, setFilters] = useState<QueueFilters>(() => fromAddress(navigation.search));
  const [seenSearch, setSeenSearch] = useState(navigation.search);
  if (navigation.search !== seenSearch) {
    setSeenSearch(navigation.search);
    setFilters((current) => ({
      ...current,
      type: typeOf(navigation.search),
      course: courseOf(navigation.search),
    }));
  }

  const titleRef = useRef<HTMLHeadingElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const date = useRvTodayLine();
  const today = useRvToday();
  const courseName = useRvCourseNames();
  const queue = useReviewQueue();
  const overview = useReviewerOverview();
  const items = queue.data?.ok ? queue.data.value : null;
  const failed = queue.isError || (queue.data !== undefined && !queue.data.ok);
  const overviewAnswer = overview.data?.ok ? overview.data.value : null;
  const scope = overviewAnswer?.scopeLine ?? [];
  const reasonOf = (item: QueueItem) =>
    overviewAnswer?.waiting.find(
      (waiting) => waiting.ref.kind === item.ref.kind && waiting.ref.id === item.ref.id,
    )?.reason ?? null;

  const change = (next: QueueFilters) => {
    setFilters(next);
    if (next.type !== filters.type || next.course !== filters.course) {
      navigation.replace(queueAddress({ type: next.type, course: next.course }));
    }
  };
  const clear = () => change(NO_FILTERS);

  const retry = () => {
    void queue.refetch();
    titleRef.current?.focus();
  };

  const loaded = items !== null && !failed;
  const empty = loaded && items.length === 0;
  const base = items ? filterQueue(items, { ...filters, type: null }) : [];
  const shown = base.filter((item) => filters.type === null || item.type === filters.type);
  const filtered = filters.search.trim() !== '' || filters.type !== null || filters.course !== null;
  const tab: QueueTab = filters.type ?? 'all';

  const chips: RvToolbarChip[] = [
    ...(filters.search.trim()
      ? [
          {
            key: 'search',
            label: searchChip(filters.search),
            onRemove: () => change({ ...filters, search: '' }),
          },
        ]
      : []),
    ...(filters.course
      ? [
          {
            key: 'course',
            label: courseChip(filters.course),
            onRemove: () => change({ ...filters, course: null }),
          },
        ]
      : []),
  ];

  let body: ReactNode;
  if (failed) {
    body = (
      <ListState
        kind="failed"
        title={REVIEW_QUEUE.failedTitle}
        action={<Button onClick={retry}>{LIST_FAILED.retry}</Button>}
      >
        {LIST_FAILED.line}
      </ListState>
    );
  } else if (items === null) {
    body = <RvLoadingRows message={REVIEW_QUEUE.loading} />;
  } else if (empty) {
    body = (
      <ListState
        kind="empty"
        title={REVIEW_QUEUE.emptyTitle}
        action={<ButtonLink href={REVIEWED_BY_ME_ADDRESS}>{REVIEW_QUEUE.openReviewed}</ButtonLink>}
      >
        {REVIEW_QUEUE.emptyLine}
      </ListState>
    );
  } else if (shown.length === 0) {
    body = (
      <ListState
        kind="nomatch"
        title={REVIEW_QUEUE.noMatchTitle}
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
        {REVIEW_QUEUE.noMatchLine}
      </ListState>
    );
  } else {
    body = (
      <RvQueueTable
        caption={REVIEW_QUEUE.caption}
        headers={REVIEW_QUEUE.columns}
        whenLabel={REVIEW_QUEUE.waitingLabel}
        rows={shown.map((item) => queueRow(item, reasonOf(item), today, courseName))}
      />
    );
  }

  return (
    <>
      <PageHead
        title={REVIEW_QUEUE_TITLE}
        titleId={TITLE_ID}
        titleRef={titleRef}
        titleFocusTarget
        date={date}
        lead={REVIEW_QUEUE.lead}
      />
      <ListSurface label={REVIEW_QUEUE.surfaceLabel}>
        {empty ? null : (
          <>
            <RvListTabs
              label={REVIEW_QUEUE.tabsLabel}
              idPrefix={TABS_ID}
              panelId={PANEL_ID}
              value={tab}
              onChange={(value) => change({ ...filters, type: value === 'all' ? null : value })}
              tabs={TABS.map((value) => ({
                value,
                label: REVIEW_QUEUE.tabs[value],
                count: loaded
                  ? value === 'all'
                    ? base.length
                    : base.filter((item) => item.type === value).length
                  : undefined,
              }))}
            />
            <RvListToolbar
              label={REVIEW_QUEUE.toolsLabel}
              searchRef={searchRef}
              search={{
                id: 'rv-q-search',
                label: REVIEW_QUEUE.search,
                placeholder: REVIEW_QUEUE.searchPlaceholder,
                value: filters.search,
                onChange: (search) => change({ ...filters, search }),
              }}
              course={{
                id: 'rv-q-course',
                label: REVIEW_QUEUE.course,
                value: filters.course ?? 'all',
                options: courseOptions(scope, items ?? [], filters.course),
                onChange: (value) => change({ ...filters, course: value === 'all' ? null : value }),
              }}
              count={loaded ? queueCountWords(shown.length, items.length, filtered) : undefined}
              chips={loaded ? chips : []}
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

/** One queue row (the export's `queueVals` `rows`). */
function queueRow(
  item: QueueItem,
  reason: string | null,
  today: string | null,
  courseName: CourseNameOf,
): RvQueueRow {
  const kind = queueItemKind(item);
  const age = today ? waitingAge(item.waitingSince, today) : null;
  const look = focusOf(item, reason);
  const codes = formatCodes(item.formats);
  return {
    key: `${item.ref.kind}:${item.ref.id}`,
    href: reviewAddressOf(item),
    name: item.name,
    accessibleName: queueRowLabel(
      item.name,
      kind.label,
      kind.detail,
      dayMonthYear(item.waitingSince),
    ),
    courseCode: item.courseCode,
    courseName: courseName(item.courseCode),
    formats: <RvFormatBadges formats={codes} label={formatsLabel(codes)} />,
    kind: <RvKindTag kind={kind.kind} label={kind.label} detail={kind.detail} />,
    from: fromOf(item, kind),
    flag: look.flag ?? undefined,
    focus: look.focus ?? undefined,
    age: age?.age ?? '',
    since: age?.since ?? '',
  };
}
