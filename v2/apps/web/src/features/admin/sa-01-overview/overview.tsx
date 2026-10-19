'use client';

import {
  Button,
  CategorySwitch,
  HiddenHeading,
  ListState,
  OverviewHead,
  PriorityBand,
  QueueCalm,
  QueueFrame,
  QueueGroups,
  QueueLoading,
  SectionHead,
} from '@xr/ui/v3';
import { useMemo, useRef, useState } from 'react';

import { weekdayDate } from '@/copy/dates';
import {
  activeInstitutionsExtra,
  OVERVIEW_CATEGORIES,
  OVERVIEW_PAGE,
  type OverviewCategoryKey,
} from '@/copy/overview';
import { SA_FAILED } from '@/copy/sa-shared';
import { stateWords } from '@/copy/state-copy';
import { overviewPlacement } from '@/nav/institutions';
import { usePublishedCatalogue } from '@/queries/catalogue';
import { useSuperAdminOverview } from '@/queries/operations-admin';
import { useSession } from '@/queries/session';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import {
  categoryCounts,
  categoryWords,
  type OverviewGroupView,
  overviewGroups,
  overviewLayout,
  type SuperAdminOverview,
} from './overview-view';

const CALM_ID = 'ov-calm-t';
const PRIORITY_ID = 'rb-prio-h';

/**
 * SA-01 Overview — the V3 Refined B design (the owner-approved Super Admin export, `sa-views-a.js`
 * `V.overview`), at `/admin`.
 *
 * - **One read**: `OperationsService.getSuperAdminOverview` (PC-67) — the two figures and the
 *   eight groups, each its count and first four rows, read from the same records and rules as the
 *   list it opens; the requests' experiments are named from the published catalogue. Counts and
 *   row order are the service's; the page only words them (`overview-view`).
 * - **As the export draws it**: the head with the two figures; the category switch (All ·
 *   Requests · Corrections · Device transfers · Support · Access ending · Set-up gaps, each with
 *   the number of items it holds, every item counted once); under All, the priority band (access
 *   ending, then corrections — at most three, each leaving its group below) and the rest of the
 *   queue, groups with nothing left out; under a category, its groups, a group with nothing in it
 *   saying so in its quiet line. Every row opens the page where the item is handled.
 * - **States**: loading (the head and the queue's loading line over skeleton rows), failed with
 *   Try again, nothing waiting at all (the calm block under the switch).
 * - Nothing here changes a record, and nothing is sent ("Reminder due" is a status).
 */
export function Overview() {
  useShellPage(overviewPlacement());
  const read = useSuperAdminOverview();
  const catalogue = usePublishedCatalogue();
  const session = useSession();
  // Today on the sample clock: the session's sign-in instant (state-copy `SA-01.today`).
  const today = session.status === 'signed-in' ? session.signedInAt : null;
  const failed = read.isError || (read.data !== undefined && !read.data.ok);
  const overview = read.data?.ok ? read.data.value : null;
  // The requests' experiments are named once the catalogue has answered; without it a request
  // row counts its experiments instead of naming them.
  const loading = !failed && (overview === null || catalogue.isPending);
  const date = today ? weekdayDate(today) : undefined;
  // The H1 takes focus with the route (`tabIndex={-1}`, the export's `#page-h1`).
  const titleRef = useRef<HTMLHeadingElement>(null);

  return (
    <>
      <OverviewHead
        title={OVERVIEW_PAGE.title}
        titleRef={titleRef}
        date={date}
        figuresLabel={OVERVIEW_PAGE.figuresLabel}
        figures={overview ? figuresOf(overview) : []}
      />
      {failed ? (
        <QueueFrame>
          <ListState
            kind="failed"
            title={stateWords('SA-01.failed')}
            action={
              <Button
                onClick={() => {
                  void read.refetch();
                  if (catalogue.isError) void catalogue.refetch();
                }}
              >
                {SA_FAILED.retry}
              </Button>
            }
          >
            {stateWords('SA-01.failed.line')}
          </ListState>
        </QueueFrame>
      ) : loading || overview === null ? (
        <QueueLoading message={stateWords('SA-01.loading')} />
      ) : (
        <Queue overview={overview} today={today} catalogue={catalogue.data} />
      )}
    </>
  );
}

/** The export's two figures: active institutions (with paused and awaiting payment) and published. */
function figuresOf(overview: SuperAdminOverview) {
  const { figures } = overview;
  const extra = activeInstitutionsExtra(figures.paused, figures.awaitingPayment);
  return [
    {
      value: figures.activeInstitutions,
      title: OVERVIEW_PAGE.activeInstitutions,
      details: extra ? [OVERVIEW_PAGE.activeLine, extra] : [OVERVIEW_PAGE.activeLine],
    },
    {
      value: figures.publishedExperiments,
      title: OVERVIEW_PAGE.publishedExperiments,
      details: [OVERVIEW_PAGE.publishedLine],
    },
  ];
}

function Queue({
  overview,
  today,
  catalogue,
}: {
  readonly overview: SuperAdminOverview;
  readonly today: string | null;
  readonly catalogue: ReturnType<typeof usePublishedCatalogue>['data'];
}) {
  const [category, setCategory] = useState<OverviewCategoryKey>('all');
  const groups = useMemo(() => {
    const names = new Map<string, string>();
    if (catalogue?.ok) {
      for (const entry of catalogue.value.entries) names.set(entry.experimentId, entry.name);
    }
    return overviewGroups(overview, today, (experimentId) => names.get(experimentId) ?? null);
  }, [overview, today, catalogue]);
  const counts = categoryCounts(groups);
  const announcement = categoryWords(category, counts);
  const chosen = OVERVIEW_CATEGORIES.find((option) => option.key === category)!;

  return (
    <>
      <CategorySwitch
        label={OVERVIEW_PAGE.switchLabel}
        value={category}
        onChange={setCategory}
        announcement={announcement}
        options={OVERVIEW_CATEGORIES.map((option) => ({
          key: option.key,
          label: option.label,
          count: counts[option.key],
        }))}
      />
      {category === 'all' ? (
        <AllWaiting overview={overview} groups={groups} total={counts.all} />
      ) : (
        <>
          <HiddenHeading>{announcement}</HiddenHeading>
          <QueueGroups
            idPrefix="ov-g"
            groups={groups.filter((group) =>
              (chosen.groups as readonly string[]).includes(group.key),
            )}
          />
        </>
      )}
    </>
  );
}

/** "All": the calm block, or the priority band and the rest of the queue. */
function AllWaiting({
  overview,
  groups,
  total,
}: {
  readonly overview: SuperAdminOverview;
  readonly groups: readonly OverviewGroupView[];
  readonly total: number;
}) {
  if (total === 0) {
    return (
      <QueueCalm title={OVERVIEW_PAGE.calmTitle} titleId={CALM_ID}>
        {OVERVIEW_PAGE.calmLine}
      </QueueCalm>
    );
  }
  const { priority, rest } = overviewLayout(overview, groups);
  return (
    <>
      {priority.length > 0 ? (
        <>
          <PriorityBand
            title={OVERVIEW_PAGE.priorityTitle}
            titleId={PRIORITY_ID}
            note={OVERVIEW_PAGE.priorityNote}
            items={priority}
          />
          {rest.length > 0 ? <SectionHead title={OVERVIEW_PAGE.alsoWaiting} tight /> : null}
        </>
      ) : null}
      {rest.length > 0 ? <QueueGroups idPrefix="ov-g" groups={rest} /> : null}
    </>
  );
}
