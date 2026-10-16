'use client';

import type { Out, reviewQueueItem } from '@xr/contracts/draft';
import type { Technology } from '@xr/domain';
import {
  Field,
  FormatBadge,
  type FormatCode,
  Icon,
  type IconName,
  Link,
  PageContent,
  PageHeader,
  Section,
  Select,
  type SelectOption,
  TextInput,
} from '@xr/ui';
import { type ReactNode, useRef, useState } from 'react';

import { dayMonthYear } from '@/copy/dates';
import {
  ITEM_TYPE_WORDS,
  queueCountWords,
  REVIEW_QUEUE,
  type ReviewItemType,
  reviewLabel,
} from '@/copy/reviewer-lists';
import { useAppNavigation } from '@/nav/navigation';
import {
  REVIEW_QUEUE_TITLE,
  REVIEWED_BY_ME_ADDRESS,
  reviewQueueAddress,
  reviewQueuePlacement,
  reviewSubmissionAddress,
  reviewUpdateAddress,
} from '@/nav/reviewer';
import { useReviewerOverview, useReviewQueue } from '@/queries/production';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { ReviewerFailed, ReviewerLoading, useRetryFocus } from './list-states';

export type QueueItem = Out<typeof reviewQueueItem>;

export interface QueueFilters {
  readonly type: ReviewItemType | null;
  /** A course code (“CHE ZG513”): the queue’s items name their course by code only. */
  readonly course: string | null;
  readonly search: string;
}

const NO_FILTERS: QueueFilters = { type: null, course: null, search: '' };

/** The address’s Type (`?type=new | update | recheck`); anything else is All types. */
export function typeOf(search: string): ReviewItemType | null {
  const type = new URLSearchParams(search).get('type');
  return type === 'new' || type === 'update' || type === 'recheck' ? type : null;
}

/**
 * The items the filters leave, as B6-02’s script filters (`qShown`, state-copy `RV-02.filters`):
 * the search in the name, the ID, the course code or the vendor (“who”), ignoring case; the type;
 * the course by its code. The queue’s own order (oldest first) is kept.
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
 * The Course filter’s options (state-copy `RV-02.filters`): “All courses”, the reviewer’s scope
 * courses by code (OD-B6-01 sample scope, from the overview read), then any other course code a
 * queued item carries; an addressed code that is in neither is kept.
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

const TYPE_OPTIONS: SelectOption[] = [
  { value: 'all', label: REVIEW_QUEUE.allTypes },
  { value: 'new', label: ITEM_TYPE_WORDS.new },
  { value: 'update', label: ITEM_TYPE_WORDS.update },
  { value: 'recheck', label: ITEM_TYPE_WORDS.recheck },
];

/** The Type tag’s icon (B6-02 f0 `span.xw-tag`): a document, the refresh arrows, the list. */
const TYPE_ICON: Readonly<Record<ReviewItemType, IconName>> = {
  new: 'fileText',
  update: 'updates',
  recheck: 'reviewQueue',
};

const formatCode = (format: Technology) => format.toUpperCase() as FormatCode;

/**
 * RV-02 Review queue — board B6-02 f0, f2 … f5 (B6-11 f13, f14; B6-12 f0), at `/reviewer/queue`
 * (`?type=`).
 *
 * - **Reads**: `ProductionService.getReviewQueue` unfiltered — the submissions and updates with
 *   the reviewer, oldest first (the sidebar counts the same read) — and `getReviewerOverview` for
 *   the reviewer’s scope courses (the Course filter’s options, OD-B6-01).
 * - **As B6-02 draws it**: “Review queue” with its one-line purpose; “Waiting for your decision” ·
 *   “Drafts are never listed”; the toolbar (Search the queue · Type · Course), the polite count
 *   “<n> of <n> items · oldest first” and “Clear filters” while one is applied; the table Item
 *   (name, “ID · code · who”, the sub-line) · Type (New submission / Update / Re-check tag) ·
 *   Formats · Waiting since · Review — labelled blocks below 760 px of content (f5). The filters
 *   are applied here, as the board’s script applies them (state-copy `RV-02.filters`); Type is
 *   mirrored in the address.
 * - **States**: f2 loading (skeleton rows, announced), f3 failed with “Try again” (focus returns to
 *   the section heading, B6-02 `qRetry`), f4 nothing waiting with “Open Reviewed by me”, and the
 *   board’s “Nothing in the queue matches” with “Clear filters”.
 * - **Review**: a submission or re-check opens RV-03; an update opens RV-04 (Phase 6; state-copy
 *   `RV-02.update-row`).
 */
export function ReviewQueue() {
  useShellPage(reviewQueuePlacement());
  const navigation = useAppNavigation();
  const [filters, setFilters] = useState<QueueFilters>(() => ({
    ...NO_FILTERS,
    type: typeOf(navigation.search),
  }));
  const [seenSearch, setSeenSearch] = useState(navigation.search);
  if (navigation.search !== seenSearch) {
    setSeenSearch(navigation.search);
    setFilters((current) => ({ ...current, type: typeOf(navigation.search) }));
  }

  const queue = useReviewQueue();
  const overview = useReviewerOverview();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const items = queue.data?.ok ? queue.data.value : null;
  const failed = queue.isError || (queue.data !== undefined && !queue.data.ok);
  const retried = useRetryFocus(items !== null, headingRef);
  const scope = overview.data?.ok ? overview.data.value.scopeLine : [];

  const change = (next: QueueFilters) => {
    setFilters(next);
    if (next.type !== filters.type) {
      navigation.replace(reviewQueueAddress(next.type ? { type: next.type } : {}));
    }
  };

  const retry = () => {
    retried();
    void queue.refetch();
  };

  let body: ReactNode;
  if (failed) {
    body = (
      <div className="xr-section-body">
        <ReviewerFailed title={REVIEW_QUEUE.failedTitle} onRetry={retry} />
      </div>
    );
  } else if (items === null) {
    body = <ReviewerLoading label={REVIEW_QUEUE.loading} />;
  } else if (items.length === 0) {
    body = <NothingWaiting />;
  } else {
    const shown = filterQueue(items, filters);
    const filtered =
      filters.search.trim() !== '' || filters.type !== null || filters.course !== null;
    body = (
      <>
        <div className="xr-toolbar [padding:0_24px_16px]">
          <Field id="rq-q" label={REVIEW_QUEUE.search} className="xr-toolbar-search">
            <TextInput
              type="search"
              placeholder={REVIEW_QUEUE.searchPlaceholder}
              value={filters.search}
              onChange={(event) => change({ ...filters, search: event.target.value })}
            />
          </Field>
          <Field id="rq-t" label={REVIEW_QUEUE.type}>
            <Select
              value={filters.type ?? 'all'}
              onChange={(event) =>
                change({
                  ...filters,
                  type:
                    event.target.value === 'all' ? null : (event.target.value as ReviewItemType),
                })
              }
              options={TYPE_OPTIONS}
            />
          </Field>
          <Field id="rq-c" label={REVIEW_QUEUE.course}>
            <Select
              value={filters.course ?? 'all'}
              onChange={(event) =>
                change({
                  ...filters,
                  course: event.target.value === 'all' ? null : event.target.value,
                })
              }
              options={courseOptions(scope, items, filters.course)}
            />
          </Field>
        </div>
        <div className="xr-toolbar-status [padding:0_24px_12px]">
          <span className="xr-meta" role="status">
            {queueCountWords(shown.length, items.length)}
          </span>
          {filtered ? (
            <button
              type="button"
              className="xr-btn xr-btn--text min-h-8"
              onClick={() => change(NO_FILTERS)}
            >
              {REVIEW_QUEUE.clearFilters}
            </button>
          ) : null}
        </div>
        {shown.length > 0 ? (
          <QueueTable items={shown} />
        ) : (
          <NoMatch onClear={() => change(NO_FILTERS)} />
        )}
      </>
    );
  }

  return (
    <PageContent wrap="wide">
      <PageHeader
        className="mb-6"
        title={REVIEW_QUEUE_TITLE}
        meta={<span className="xl-meta">{REVIEW_QUEUE.lead}</span>}
      />
      <Section
        title={REVIEW_QUEUE.sectionTitle}
        headingId="rq-qh"
        headingFocusTarget
        headingRef={headingRef}
        meta={REVIEW_QUEUE.draftsNever}
      >
        {body}
      </Section>
    </PageContent>
  );
}

/** The table (f0) — labelled blocks below 760 px of content (f5). */
function QueueTable({ items }: { readonly items: readonly QueueItem[] }) {
  const { columns } = REVIEW_QUEUE;
  return (
    <div className="xr-table-wrap rounded-none border-x-0 border-b-0">
      <table className="xr-table">
        <thead>
          <tr>
            <th scope="col">{columns.item}</th>
            <th scope="col">{columns.type}</th>
            <th scope="col">{columns.formats}</th>
            <th scope="col">{columns.waitingSince}</th>
            <th scope="col">
              <span className="xr-sr">{columns.action}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={`${item.ref.kind}:${item.ref.id}`}>
              <td className="is-primary">
                <strong>{item.name}</strong>
                <span className="xr-meta block">
                  <span className="xr-id">{item.ref.id}</span>
                  {item.courseCode ? (
                    <>
                      {' · '}
                      <span className="xw-nowrap">{item.courseCode}</span>
                    </>
                  ) : null}
                  {` · ${item.who}`}
                </span>
                <span className="xr-meta block">{item.subLine}</span>
              </td>
              <td data-label={columns.type}>
                <span className={item.type === 'recheck' ? 'xw-tag xw-tag--warn' : 'xw-tag'}>
                  <Icon name={TYPE_ICON[item.type]} />
                  {ITEM_TYPE_WORDS[item.type]}
                </span>
              </td>
              <td data-label={columns.formats}>
                <span className="xv-chips">
                  {item.formats.map((format) => (
                    <FormatBadge key={format} format={formatCode(format)} compact />
                  ))}
                </span>
              </td>
              <td data-label={columns.waitingSince}>
                <span className="xw-nowrap">{dayMonthYear(item.waitingSince)}</span>
              </td>
              <td>
                <Link
                  className="xr-btn xr-btn--primary xr-btn--sm"
                  href={
                    item.ref.kind === 'UPD'
                      ? reviewUpdateAddress(item.ref.id)
                      : reviewSubmissionAddress(item.ref.id)
                  }
                  aria-label={reviewLabel(item.name)}
                >
                  {REVIEW_QUEUE.review}
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** B6-02 `qNoMatch`: the empty pattern with the search icon and “Clear filters”. */
function NoMatch({ onClear }: { readonly onClear: () => void }) {
  return (
    <div className="xr-section-body">
      <div className="xr-empty">
        <span className="xr-empty-icon">
          <Icon name="search" />
        </span>
        <h3 className="xr-h3 m-0">{REVIEW_QUEUE.noMatchTitle}</h3>
        <p className="xr-body m-0 text-ink-2">{REVIEW_QUEUE.noMatchLine}</p>
        <div className="flex flex-wrap gap-3">
          <button type="button" className="xr-btn xr-btn--secondary" onClick={onClear}>
            {REVIEW_QUEUE.clearFilters}
          </button>
        </div>
      </div>
    </div>
  );
}

/** f4 “Nothing waiting” (B6-11 f14): the done icon in the ok tint and “Open Reviewed by me”. */
function NothingWaiting() {
  return (
    <div className="xr-section-body">
      <div className="xr-empty">
        <span className="xr-empty-icon xr-x-empty-icon--ok">
          <Icon name="done" />
        </span>
        <h3 className="xr-h3 m-0">{REVIEW_QUEUE.emptyTitle}</h3>
        <p className="xr-body m-0 text-ink-2">{REVIEW_QUEUE.emptyLine}</p>
        <div className="flex flex-wrap gap-3">
          <Link className="xr-btn xr-btn--secondary" href={REVIEWED_BY_ME_ADDRESS}>
            {REVIEW_QUEUE.openReviewed}
          </Link>
        </div>
      </div>
    </div>
  );
}
