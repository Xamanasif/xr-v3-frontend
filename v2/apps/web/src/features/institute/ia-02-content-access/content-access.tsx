'use client';

import type { ContentAccessRow } from '@xr/contracts/draft';
import { inDisplayOrder, type Technology } from '@xr/domain';
import {
  Button,
  type FilterChip,
  FormatSet,
  type FormatCode,
  Icon,
  Link,
  ListToolbar,
  Notice,
  PageContent,
  PageHeader,
  SectionTabs,
  Skeleton,
} from '@xr/ui';
import { Fragment, useLayoutEffect, useRef, useState } from 'react';

import {
  ACCESS_PLAN_LABEL,
  accessPlanName,
  CONTENT_ACCESS_WORDS,
  CONTENT_STATUS_FILTERS,
  contentCountWords,
  type ContentStatusFilter,
  endsOnTitle,
  experimentsHeldCaption,
  giveAccessLabel,
  INSTITUTE_ACTIONS,
  noContentLine,
  notInPlanWords,
  PLAN_NOTICES,
  planBandLine,
  searchChip,
  statusChip,
  studentsGivenWords,
  viewPlanLabel,
} from '@/copy/institute-home';
import {
  accessPlanAddress,
  CONTENT_ACCESS_ADDRESS,
  destinationPlacement,
  giveAccessAddress,
  STUDENT_ACCESS_ADDRESS,
} from '@/nav/institute';
import { useContentAccess, useInstituteOverview } from '@/queries/institute-home';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import {
  type ContentRowView,
  type CourseGroupView,
  contentAccessView,
  type PlanSectionView,
} from './content-access-view';
import { LoadFailed, PlanStatusPill } from './institute-parts';

const code = (format: Technology) => format.toUpperCase() as FormatCode;

const SEARCH_ID = 'content-access-search';

/**
 * IA-02 Content access — board B2-02 ("What has BITS given my institution to use?"), at
 * `/institute/content-access`.
 *
 * - **Read**: `InstitutionService.listContentAccess` — per course, the plans that hold its
 *   experiments (status and days left on the sample clock) and one row per plan item: the formats
 *   in the plan, the published formats it leaves out ("AR is published but not in your plan",
 *   ACC-10) and how many students an active grant of that plan gives it to now — people, never
 *   licences (T-06). Licence figures are shown as approved; there is no amend control (T-08).
 * - **As B2-02 draws it**: the header, the section tabs (only "Experiments": the Course codes tab
 *   opens IA-16, not built in Package 2A), the Search and Status filters with the count, chips
 *   and "Clear filters" (state-copy `IA-02.filters`), then one section per plan — its band with
 *   "View plan" (IA-03), its notice (ending soon f3, ended f4, paused f5), each course group with
 *   its code line and the experiments table. Rows open the plan (IA-03), the count opens Student
 *   access (IA-04), "Give access" opens IA-05 with the course and experiment chosen; none while
 *   the plan has ended or is paused, nor the header's "Give students access".
 * - **States**: loading (f8), failed with "Try again" (f9), no match with "Clear filters" (f7),
 *   and "No content yet" before any plan (f6; not reachable in the sample world, INST-04).
 */
export function ContentAccess() {
  useShellPage(destinationPlacement('IA-02'));
  const read = useContentAccess();
  const rows = read.data?.ok ? read.data.value : null;
  const failed = read.isError || (read.data !== undefined && !read.data.ok);
  const loading = !failed && rows === null;

  return (
    <PageContent wrap="wide">
      {failed ? (
        <>
          <Header showGive={false} />
          <LoadFailed
            title={CONTENT_ACCESS_WORDS.failedTitle}
            onRetry={() => {
              void read.refetch();
            }}
          />
        </>
      ) : loading || rows === null ? (
        <>
          <Header showGive={false} />
          <LoadingRows />
        </>
      ) : rows.length === 0 ? (
        <>
          <Header showGive={false} />
          <NoContentYet />
        </>
      ) : (
        <ContentList rows={rows} />
      )}
    </PageContent>
  );
}

/** B2-02 header and section tabs ("Experiments" is the only built tab in Package 2A). */
function Header({ showGive }: { readonly showGive: boolean }) {
  return (
    <>
      <PageHeader
        className="mb-4"
        title={CONTENT_ACCESS_WORDS.title}
        meta={CONTENT_ACCESS_WORDS.meta}
        actions={
          showGive ? (
            <Link className="xr-btn xr-btn--primary" href={giveAccessAddress()}>
              {INSTITUTE_ACTIONS.giveStudentsAccess}
            </Link>
          ) : null
        }
      />
      <SectionTabs
        label={CONTENT_ACCESS_WORDS.tabsLabel}
        tabs={[
          {
            href: CONTENT_ACCESS_ADDRESS,
            label: CONTENT_ACCESS_WORDS.experimentsTab,
            current: true,
          },
        ]}
      />
      <div className="h-5" />
    </>
  );
}

function ContentList({ rows }: { readonly rows: readonly ContentAccessRow[] }) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ContentStatusFilter>('all');
  const view = contentAccessView(rows, { search, status });

  const chips: FilterChip[] = [];
  if (search.trim() !== '') {
    chips.push({ key: 'search', label: searchChip(search), onRemove: () => setSearch('') });
  }
  if (status !== 'all') {
    chips.push({ key: 'status', label: statusChip(status), onRemove: () => setStatus('all') });
  }
  const clearFilters = () => {
    setSearch('');
    setStatus('all');
  };

  // "Clear filters" in the no-match state goes with that state: if it had focus, focus moves to
  // the search box once the button has gone (as SA-06 moves it on), and only if focus was lost.
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
    document.getElementById(SEARCH_ID)?.focus();
  });

  return (
    <>
      <Header showGive={view.anyGivable} />
      <ListToolbar
        search={{
          id: SEARCH_ID,
          label: CONTENT_ACCESS_WORDS.searchLabel,
          placeholder: CONTENT_ACCESS_WORDS.searchPlaceholder,
          value: search,
          onChange: setSearch,
        }}
        filters={[
          {
            id: 'content-access-status',
            label: CONTENT_ACCESS_WORDS.statusLabel,
            options: CONTENT_STATUS_FILTERS.map((value) => ({
              value,
              label: CONTENT_ACCESS_WORDS.statusOptions[value],
            })),
            value: status,
            onChange: (value) => setStatus(value as ContentStatusFilter),
          },
        ]}
        status={contentCountWords(view.shown, view.total, view.courses, chips.length > 0)}
        chips={chips}
        clearLabel={CONTENT_ACCESS_WORDS.clearFilters}
        onClearFilters={chips.length > 0 ? clearFilters : undefined}
      />
      {view.sections.length > 0 ? (
        <div className="flex flex-col gap-6">
          {view.sections.map((section) => (
            <PlanSection key={section.standing.plan.id} section={section} />
          ))}
        </div>
      ) : (
        <div className="xr-section">
          <div className="xr-empty">
            <span className="xr-empty-icon">
              <Icon name="search" />
            </span>
            <h2 className="xr-h3 m-0">{CONTENT_ACCESS_WORDS.noMatch}</h2>
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" onClick={clearFromNoMatch}>
                {CONTENT_ACCESS_WORDS.clearFilters}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/** One plan: its band, then each course group (B2-02 `section[aria-label="Access plan …"]`). */
function PlanSection({ section }: { readonly section: PlanSectionView }) {
  const { plan, status, daysLeft } = section.standing;
  return (
    <section className="xr-section" aria-label={accessPlanName(plan.id)}>
      <div className="xw-plan">
        <div className="xw-plan-main">
          <strong>
            {ACCESS_PLAN_LABEL} <span className="xr-id text-ink">{plan.id}</span>
          </strong>
          <PlanStatusPill status={status} />
          <span className="xr-num">
            {planBandLine(plan, status === 'ending-soon' ? daysLeft : null)}
          </span>
        </div>
        <Link
          className="xr-btn xr-btn--secondary xr-btn--sm"
          href={accessPlanAddress(plan.id)}
          aria-label={viewPlanLabel(plan.id)}
        >
          {CONTENT_ACCESS_WORDS.viewPlan}
        </Link>
      </div>
      {section.courses.map((group, index) => (
        <Fragment key={group.course.id}>
          <CourseHead group={group} />
          {index === 0 ? <PlanNotice section={section} /> : null}
          <ExperimentsTable group={group} />
        </Fragment>
      ))}
    </section>
  );
}

/** B2-02 course group head: the course, its platform code and the institution's own code. */
function CourseHead({ group }: { readonly group: CourseGroupView }) {
  return (
    <div className="xw-cgroup-head">
      <h3 className="xr-h2 m-0">{group.course.name}</h3>
      <div className="xw-cgroup-code">
        {group.course.platformCode ? (
          <>
            <span className="xr-id">{group.course.platformCode}</span>
            <span aria-hidden="true">·</span>
          </>
        ) : null}
        {group.institutionCode ? (
          <span>
            {CONTENT_ACCESS_WORDS.yourCode}{' '}
            <strong className="text-ink">{group.institutionCode.code}</strong>
          </span>
        ) : (
          // "Add code" opens Course codes (IA-16), not built in Package 2A (IA-02.not-rendered).
          <span className="xw-tag xw-tag--warn">
            <Icon name="warning" />
            {CONTENT_ACCESS_WORDS.codeNotAdded}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * The plan's notice (B2-02 f3 ending soon, f4 ended, f5 paused), under its first course group's
 * head. "Request renewal" (IA-17 / IA-18) is not built in Package 2A.
 */
function PlanNotice({ section }: { readonly section: PlanSectionView }) {
  const { plan, status } = section.standing;
  const notice =
    status === 'ending-soon' ? (
      <Notice tone="warn" icon="clock" title={endsOnTitle(plan.endsOn)}>
        {PLAN_NOTICES.endingSoonLine}
      </Notice>
    ) : status === 'access-ended' ? (
      <Notice tone="quiet" title={PLAN_NOTICES.contentEndedTitle}>
        {PLAN_NOTICES.contentEndedLine}
      </Notice>
    ) : status === 'paused' ? (
      <Notice tone="warn" icon="readOnly" title={PLAN_NOTICES.pausedTitle}>
        {PLAN_NOTICES.pausedLine}
      </Notice>
    ) : null;
  return notice ? <div className="px-6 pb-5">{notice}</div> : null;
}

/** B2-02 table: "Experiment · Formats in your plan · Status · Students given access · (Action)". */
function ExperimentsTable({ group }: { readonly group: CourseGroupView }) {
  const { columns } = CONTENT_ACCESS_WORDS;
  return (
    <div className="xr-table-wrap xw-table-flush">
      <table className="xr-table">
        <caption className="xr-sr">
          {experimentsHeldCaption(group.course.platformCode ?? group.course.name)}
        </caption>
        <thead>
          <tr>
            <th scope="col">{columns.experiment}</th>
            <th scope="col">{columns.formats}</th>
            <th scope="col">{columns.status}</th>
            <th scope="col">{columns.studentsGiven}</th>
            <th scope="col">
              <span className="xr-sr">{columns.action}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {group.rows.map((row) => (
            <ExperimentRow
              key={`${row.planId}:${row.experimentId}`}
              row={row}
              courseId={group.course.id}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ExperimentRow({
  row,
  courseId,
}: {
  readonly row: ContentRowView;
  readonly courseId: string;
}) {
  const { columns } = CONTENT_ACCESS_WORDS;
  const notInPlan = inDisplayOrder(row.publishedNotInPlan);
  return (
    <tr>
      <td className="is-primary">
        <Link href={accessPlanAddress(row.planId)} className="font-[700]">
          {row.name}
        </Link>
      </td>
      <td data-label={columns.formats}>
        <FormatSet
          compact
          formats={[
            ...inDisplayOrder(row.formats).map((format) => ({ format: code(format) })),
            ...notInPlan.map((format) => ({ format: code(format), variant: 'off' as const })),
          ]}
        />
        {notInPlan.length > 0 ? (
          <span className="xw-sub mt-[6px]">{notInPlanWords(notInPlan)}</span>
        ) : null}
      </td>
      <td data-label={columns.status}>
        <PlanStatusPill status={row.status} />
      </td>
      <td data-label={columns.studentsGiven}>
        {row.studentsGiven > 0 ? (
          <Link href={STUDENT_ACCESS_ADDRESS}>{studentsGivenWords(row.studentsGiven)}</Link>
        ) : (
          studentsGivenWords(0)
        )}
      </td>
      <td>
        {row.givable ? (
          <Link
            className="xr-btn xr-btn--secondary xr-btn--sm"
            href={giveAccessAddress({ course: courseId, experiment: row.experimentId })}
            aria-label={giveAccessLabel(row.name)}
          >
            {CONTENT_ACCESS_WORDS.giveAccess}
          </Link>
        ) : null}
      </td>
    </tr>
  );
}

/**
 * B2-02 f6 "No access plan yet": nothing to show before access is active. The request it names is
 * the one the institution was created from (`getMyOverview`); "View request status" (PU-10 from the
 * workspace) is not built in Package 2A.
 */
function NoContentYet() {
  const overview = useInstituteOverview();
  const reference = overview.data?.ok ? overview.data.value.institution.createdFromRequestId : null;
  return (
    <div className="xr-section">
      <div className="xr-empty">
        <span className="xr-empty-icon">
          <Icon name="contentAccess" />
        </span>
        <h2 className="xr-h3 m-0">{CONTENT_ACCESS_WORDS.noContent}</h2>
        {reference ? <p className="xr-body m-0 text-ink-2">{noContentLine(reference)}</p> : null}
      </div>
    </div>
  );
}

/** B2-02 f8 "Loading": four skeleton rows, announced to screen readers. */
function LoadingRows() {
  return (
    <div className="xr-table-wrap" aria-busy="true">
      <span className="xr-sr" role="status">
        {CONTENT_ACCESS_WORDS.loading}
      </span>
      {[0, 1, 2, 3].map((line) => (
        <div
          key={line}
          className="grid grid-cols-[1.4fr_1fr_1fr_140px] gap-5 px-4 py-[18px] [border-block-start:1px_solid_var(--xr-line)]"
        >
          <Skeleton />
          <Skeleton />
          <Skeleton />
          <Skeleton />
        </div>
      ))}
    </div>
  );
}
