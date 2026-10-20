'use client';

import type {
  contentManagerOverviewOutput,
  libraryOutput,
  listUpdatesOutput,
  Out,
  platformCodesOutput,
  readyToPublishOutput,
} from '@xr/contracts/draft';
import {
  Button,
  CmCalmDesk,
  CmCatalogueList,
  CmCatalogueTotal,
  CmCheckChip,
  CmColumns,
  CmDecisionDesk,
  type CmDeskRow,
  CmGroupHead,
  CmHoldList,
  type CmHoldRow,
  CmPageHead,
  CmPipeline,
  type CmPipelineTile,
  CmQuote,
  CmSide,
  CmSideCard,
  CmSideText,
  CmStack,
  CmVersionChange,
  FormatBadges,
  ListState,
  LoadingRows,
  StatusPill,
  TextLink,
} from '@xr/ui/v3';
import { useRef } from 'react';

import {
  catalogueCourseLabel,
  catalogueLine,
  CM_OVERVIEW,
  continueLabel,
  daysWaiting,
  deskCheckWords,
  deskReadyLine,
  deskWhen,
  formatsLabel,
  LIST_FAILED,
  OPEN_DECISION,
  OPEN_LIBRARY,
  oldestApproved,
  openDecisionLabel,
  openSubmissionLabel,
  openUpdateLabel,
  PIPELINE_DESTINATIONS,
  PIPELINE_STAGES,
  pipelineTileLabel,
  quotedReason,
  recheckDetail,
  releaseDetail,
  reviewerOn,
  sentBackDetail,
  updateAwaitingDetail,
  updateInReviewDetail,
  updateOnHoldDetail,
  updateTitle,
  waitWords,
} from '@/copy/cm-lists';
import { CM_SUBMISSION_STATUS } from '@/copy/cm-shared';
import { stateWords } from '@/copy/state-copy';
import {
  CM_OVERVIEW_TITLE,
  cmOverviewPlacement,
  correctionAddress,
  publicationDecisionAddress,
  READY_TO_PUBLISH_ADDRESS,
  UPDATES_ADDRESS,
} from '@/nav/content-manager';
import { useMyUpdates } from '@/queries/corrections';
import {
  useContentLibrary,
  useContentManagerOverview,
  usePlatformCourseCodes,
  useReadyToPublish,
} from '@/queries/production';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { formatCodes, libraryViewAddress, useToday } from '../cm-02-ready/list-facts';
import { cmActorName, lastUpdateDecision } from '../shared/records';
import { cmUpdatePill } from '../shared/status';
import { correctionVersionChange } from '../shared/version-change';

type Overview = Out<typeof contentManagerOverviewOutput>;
type ReadyRow = Out<typeof readyToPublishOutput>[number];
type Library = Out<typeof libraryOutput>;
type UpdateRow = Out<typeof listUpdatesOutput>[number];
type CourseRow = Out<typeof platformCodesOutput>[number];

const TITLE_ID = 'cm-h-overview';
const PIPE_ID = 'cm-pipe-h';
const NEED_ID = 'cm-need-h';
const CALM_ID = 'cm-calm-t';
const OTHERS_ID = 'cm-others-h';
const CATALOGUE_ID = 'cm-cat-h';

/** Everything the overview is read from (state-copy `CM-01.counts`). */
interface OverviewFacts {
  readonly overview: Overview;
  readonly ready: readonly ReadyRow[];
  readonly library: Library;
  readonly updates: readonly UpdateRow[];
  readonly courses: readonly CourseRow[];
}

/**
 * CM-01 Overview, the Content Manager's home — the V3 Refined B design (the owner-approved export
 * design/v3-refined-b/roles/CM-v1, `Main.dc.html` CM-01 and `ovVM`), at `/content-manager`.
 *
 * - **Reads** (state-copy `CM-01.counts`): `ProductionService.getContentManagerOverview` (the ready
 *   items, oldest approval first, the returned corrections and what sits with others); Ready to
 *   publish (each ready item's publication check, formats and vendor); the library's counts and
 *   its With vendor rows (the submissions she sent back); her updates (the corrections' stages,
 *   drafts, live versions and the reviewer's name); the platform course codes (the catalogue by
 *   course). Nothing is invented: every count is the records'.
 * - **As the export draws it**: the page head; the publishing pipeline — first publication (with
 *   the vendor · in academic review · ready to publish · in the catalogue) and corrections (draft
 *   or returned · in academic review · release decision · released), each tile a link to the list
 *   that holds its items, her stages gold; the decision desk "Needs your decision" (Ready to
 *   publish with "Publish next" on the oldest, each row's checks and formats; Corrections that
 *   need you with the reviewer's words), or the calm state; beside it "With others" and "In the
 *   catalogue" by course.
 * - **Loading and failed**: the application's page loading under the head (HANDOFF §4; state-copy
 *   `CM-01.loading`, `CM-01.failed`); Try again reads again and moves focus to the title.
 * - Nothing here changes a record: every action opens the page where the work is done.
 */
export function CmOverview() {
  useShellPage(cmOverviewPlacement());
  const today = useToday();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const overview = useContentManagerOverview();
  const ready = useReadyToPublish();
  const library = useContentLibrary({ tab: 'with-vendor', search: '' });
  const updates = useMyUpdates();
  const courses = usePlatformCourseCodes();
  const reads = [overview, ready, library, updates, courses] as const;

  const failed = reads.some((read) => read.isError || (read.data !== undefined && !read.data.ok));
  const facts: OverviewFacts | null =
    overview.data?.ok && ready.data?.ok && library.data?.ok && updates.data?.ok && courses.data?.ok
      ? {
          overview: overview.data.value,
          ready: ready.data.value,
          library: library.data.value,
          updates: updates.data.value,
          courses: courses.data.value,
        }
      : null;

  const retry = () => {
    for (const read of reads) {
      if (read.isError || (read.data !== undefined && !read.data.ok)) void read.refetch();
    }
    titleRef.current?.focus();
  };

  return (
    <>
      <CmPageHead
        as="header"
        title={CM_OVERVIEW_TITLE}
        titleId={TITLE_ID}
        titleRef={titleRef}
        date={today.line}
        lead={CM_OVERVIEW.lead}
      />
      {failed ? (
        <ListState
          kind="failed"
          titleAs="h2"
          title={stateWords('CM-01.failed')}
          action={<Button onClick={retry}>{LIST_FAILED.retry}</Button>}
        >
          {LIST_FAILED.line}
        </ListState>
      ) : facts === null ? (
        <LoadingRows message={stateWords('CM-01.loading')} />
      ) : (
        <OverviewBody facts={facts} today={today.instant} />
      )}
    </>
  );
}

function OverviewBody({
  facts,
  today,
}: {
  readonly facts: OverviewFacts;
  readonly today: string | null;
}) {
  const { overview, library, updates, courses } = facts;
  const readyItems = overview.attention.filter((row) => row.kind === 'ready-to-publish');
  const updateOf = (id: string) => updates.find((row) => row.update.id === id) ?? null;
  const count = (states: readonly string[]) =>
    updates.filter((row) => states.includes(row.update.state)).length;

  // ---- the pipeline: both lifecycles, counted from the records ----
  const onHold = count(['on-hold']);
  const mine = count(['draft', 'returned']);
  const tile = (
    key: string,
    stage: { readonly title: string },
    howMany: number,
    detail: string,
    you: boolean,
    href: string,
    destination: string,
  ): CmPipelineTile => ({
    key,
    count: howMany,
    title: stage.title,
    detail,
    you,
    href,
    accessibleName: pipelineTileLabel({
      count: howMany,
      title: stage.title,
      detail,
      you,
      destination,
    }),
  });
  const oldest = readyItems[0];
  const lanes = [
    {
      key: 'first',
      title: CM_OVERVIEW.pipeline.firstLane,
      icon: 'readyToPublish' as const,
      tiles: [
        tile(
          'vendor',
          PIPELINE_STAGES.vendor,
          library.counts['with-vendor'],
          PIPELINE_STAGES.vendor.detail,
          false,
          libraryViewAddress('with-vendor'),
          PIPELINE_DESTINATIONS.vendor,
        ),
        tile(
          'review',
          PIPELINE_STAGES.review,
          library.counts['in-review'],
          PIPELINE_STAGES.review.detail,
          false,
          libraryViewAddress('in-review'),
          PIPELINE_DESTINATIONS.review,
        ),
        tile(
          'ready',
          PIPELINE_STAGES.ready,
          library.counts.ready,
          oldest ? oldestApproved(oldest.approvedAt) : PIPELINE_STAGES.ready.detail,
          true,
          READY_TO_PUBLISH_ADDRESS,
          PIPELINE_DESTINATIONS.ready,
        ),
        tile(
          'catalogue',
          PIPELINE_STAGES.catalogue,
          library.counts.published,
          PIPELINE_STAGES.catalogue.detail,
          false,
          libraryViewAddress('published'),
          PIPELINE_DESTINATIONS.catalogue,
        ),
      ],
    },
    {
      key: 'corrections',
      title: CM_OVERVIEW.pipeline.correctionsLane,
      icon: 'updates' as const,
      tiles: [
        tile(
          'mine',
          PIPELINE_STAGES.mine,
          mine,
          mine > 0 ? PIPELINE_STAGES.mine.detail : PIPELINE_STAGES.mine.none,
          true,
          UPDATES_ADDRESS,
          PIPELINE_DESTINATIONS.updates,
        ),
        tile(
          'update-review',
          PIPELINE_STAGES.updateReview,
          count(['in-academic-review']),
          PIPELINE_STAGES.updateReview.detail,
          false,
          UPDATES_ADDRESS,
          PIPELINE_DESTINATIONS.updates,
        ),
        tile(
          'release',
          PIPELINE_STAGES.release,
          count(['awaiting-release-decision', 'on-hold']),
          releaseDetail(onHold),
          false,
          UPDATES_ADDRESS,
          PIPELINE_DESTINATIONS.updates,
        ),
        tile(
          'released',
          PIPELINE_STAGES.released,
          count(['released']),
          PIPELINE_STAGES.released.detail,
          false,
          UPDATES_ADDRESS,
          PIPELINE_DESTINATIONS.updates,
        ),
      ],
    },
  ];

  // ---- the decision desk: the first row of the desk takes the one gold action ----
  const readyRows: CmDeskRow[] = readyItems.map((item, index) => {
    const row = facts.ready.find((entry) => entry.submission.id === item.submissionId);
    const codes = row ? formatCodes(row.submission.content.formats) : [];
    const met = row ? row.check.filter((check) => check.ok).length : 0;
    const days = today ? daysWaiting(item.approvedAt, today) : 0;
    return {
      key: item.submissionId,
      first: index === 0,
      next: index === 0 ? CM_OVERVIEW.needs.next : undefined,
      when: { big: waitWords(days), small: deskWhen('approved', item.approvedAt) },
      title: item.name,
      description: deskReadyLine(
        item.submissionId,
        item.courseCode,
        row?.submission.vendorOrganisation ?? '',
      ),
      facts: row ? (
        <>
          <CmCheckChip met={met === row.check.length}>
            {deskCheckWords(met, row.check.length)}
          </CmCheckChip>
          <FormatBadges formats={codes} label={formatsLabel(codes)} />
        </>
      ) : undefined,
      action: {
        href: publicationDecisionAddress(item.submissionId),
        label: OPEN_DECISION,
        accessibleName: openDecisionLabel(item.name),
        primary: index === 0,
      },
    };
  });

  // Corrections with her: the returned ones (the overview's) and her unsent drafts, oldest first.
  const withHer = [
    ...overview.attention.flatMap((item) =>
      item.kind === 'update-returned'
        ? [{ id: item.updateId, name: item.name, at: item.returnedAt, returned: item }]
        : [],
    ),
    ...updates
      .filter((row) => row.update.state === 'draft')
      .map((row) => ({
        id: row.update.id,
        name: row.experimentName,
        at: row.update.updatedAt,
        returned: null,
      })),
  ].sort((a, b) => (a.at === b.at ? 0 : a.at < b.at ? -1 : 1));
  const correctionRows: CmDeskRow[] = withHer.map((item, index) => {
    const row = updateOf(item.id);
    const days = today ? daysWaiting(item.at, today) : 0;
    const decision = row ? lastUpdateDecision(row.update, 'return-to-content-manager') : null;
    return {
      key: item.id,
      when: {
        big: waitWords(days),
        small: deskWhen(item.returned ? 'returned' : 'saved', item.at),
      },
      title: item.name,
      facts: (
        <>
          {item.returned ? (
            <StatusPill tone="err">{CM_OVERVIEW.needs.returned}</StatusPill>
          ) : (
            <StatusPill tone="neutral">{CM_OVERVIEW.needs.draft}</StatusPill>
          )}
          {row ? <CmVersionChange {...correctionVersionChange(row.update)} /> : null}
        </>
      ),
      quote:
        item.returned && item.returned.reason.trim() ? (
          <CmQuote
            quote={quotedReason(item.returned.reason)}
            by={reviewerOn(decision ? cmActorName(decision.by) : '', item.returned.returnedAt)}
          />
        ) : undefined,
      action: {
        href: correctionAddress(item.id),
        label: CM_OVERVIEW.needs.continue,
        accessibleName: continueLabel(item.id, item.name),
        primary: readyRows.length === 0 && index === 0,
      },
    };
  });

  const groups = [
    ...(readyRows.length > 0
      ? [
          {
            key: 'ready',
            name: CM_OVERVIEW.needs.ready,
            icon: 'readyToPublish' as const,
            link: { href: READY_TO_PUBLISH_ADDRESS, label: CM_OVERVIEW.needs.openReady },
            rows: readyRows,
          },
        ]
      : []),
    ...(correctionRows.length > 0
      ? [
          {
            key: 'corr',
            name: CM_OVERVIEW.needs.corrections,
            icon: 'updates' as const,
            link: { href: UPDATES_ADDRESS, label: CM_OVERVIEW.needs.openUpdates },
            rows: correctionRows,
          },
        ]
      : []),
  ];

  // ---- with others: what she sent on, oldest first ----
  const live = (id: string) => updateOf(id)?.update.baseVersionLabel ?? null;
  const others: (CmHoldRow & { readonly at: string })[] = [
    ...overview.withOthers.map((row): CmHoldRow & { readonly at: string } => {
      switch (row.kind) {
        case 'recheck':
          return {
            key: row.submissionId,
            at: row.sentAt,
            title: row.name,
            detail: recheckDetail(row.sentAt),
            status: <StatusPill tone="info">{CM_SUBMISSION_STATUS.recheck}</StatusPill>,
            link: {
              href: publicationDecisionAddress(row.submissionId),
              label: CM_OVERVIEW.others.open,
              accessibleName: openSubmissionLabel(row.name),
            },
          };
        case 'update-in-review':
        case 'update-awaiting-release':
        case 'update-on-hold': {
          const state =
            row.kind === 'update-in-review'
              ? 'in-academic-review'
              : row.kind === 'update-awaiting-release'
                ? 'awaiting-release-decision'
                : 'on-hold';
          const pill = cmUpdatePill(state);
          const at =
            row.kind === 'update-in-review'
              ? row.sentAt
              : row.kind === 'update-awaiting-release'
                ? row.approvedAt
                : row.heldAt;
          const detail =
            row.kind === 'update-in-review'
              ? updateInReviewDetail(row.sentAt, live(row.updateId))
              : row.kind === 'update-awaiting-release'
                ? updateAwaitingDetail(row.approvedAt, live(row.updateId))
                : updateOnHoldDetail(row.heldAt, row.liveLabel);
          return {
            key: row.updateId,
            at,
            title: updateTitle(row.name, row.versionLabel),
            detail,
            status: <StatusPill tone={pill.tone}>{pill.words}</StatusPill>,
            link: {
              href: correctionAddress(row.updateId),
              label: CM_OVERVIEW.others.open,
              accessibleName: openUpdateLabel(row.updateId, row.name),
            },
          };
        }
      }
    }),
    ...library.rows.flatMap((row) =>
      row.kind === 'submission' &&
      row.submission.status.state === 'returned' &&
      row.submission.status.by === 'content-manager'
        ? [
            {
              key: row.submission.id,
              at: row.submission.status.since,
              title: row.submission.content.name,
              detail: sentBackDetail(
                row.submission.vendorOrganisation,
                row.submission.status.since,
              ),
              status: <StatusPill tone="neutral">{CM_SUBMISSION_STATUS.withVendor}</StatusPill>,
              link: {
                href: publicationDecisionAddress(row.submission.id),
                label: CM_OVERVIEW.others.open,
                accessibleName: openSubmissionLabel(row.submission.content.name),
              },
            },
          ]
        : [],
    ),
  ].sort((a, b) => (a.at === b.at ? 0 : a.at < b.at ? -1 : 1));

  // ---- in the catalogue, by course ----
  const published = library.counts.published;
  const liveCourses = courses.filter((row) => row.publishedExperiments > 0);

  return (
    <>
      <CmPipeline
        title={CM_OVERVIEW.pipeline.title}
        titleId={PIPE_ID}
        note={CM_OVERVIEW.pipeline.note}
        youLabel={CM_OVERVIEW.pipeline.youLabel}
        lanes={lanes}
      />
      <CmColumns>
        <CmStack large>
          {groups.length > 0 ? (
            <CmDecisionDesk
              title={CM_OVERVIEW.needs.title}
              titleId={NEED_ID}
              note={CM_OVERVIEW.needs.note}
              idPrefix="cm-need"
              groups={groups}
            />
          ) : (
            <CmCalmDesk
              title={CM_OVERVIEW.needs.title}
              calmTitle={CM_OVERVIEW.calm.title}
              calmTitleId={CALM_ID}
              link={<TextLink href={libraryViewAddress('ready')}>{OPEN_LIBRARY}</TextLink>}
            >
              {CM_OVERVIEW.calm.line}
            </CmCalmDesk>
          )}
        </CmStack>
        <CmSide>
          <CmSideCard
            titleId={OTHERS_ID}
            head={
              <CmGroupHead
                variant="side"
                title={CM_OVERVIEW.others.title}
                titleId={OTHERS_ID}
                note={CM_OVERVIEW.others.note}
              />
            }
          >
            {others.length > 0 ? (
              <CmHoldList rows={others} />
            ) : (
              <CmSideText>{CM_OVERVIEW.others.none}</CmSideText>
            )}
          </CmSideCard>
          <CmSideCard
            titleId={CATALOGUE_ID}
            title={CM_OVERVIEW.catalogue.title}
            foot={<TextLink href={libraryViewAddress('published')}>{OPEN_LIBRARY}</TextLink>}
          >
            <CmCatalogueTotal count={published}>
              {catalogueLine(published, liveCourses.length)}
            </CmCatalogueTotal>
            {published > 0 ? (
              <CmCatalogueList
                label={CM_OVERVIEW.catalogue.listLabel}
                courses={liveCourses.map((row) => ({
                  key: row.course.id,
                  code: row.course.platformCode,
                  name: row.course.name,
                  count: row.publishedExperiments,
                  href: libraryViewAddress('published', row.course.id),
                  accessibleName: catalogueCourseLabel(row.course.name, row.publishedExperiments),
                }))}
              />
            ) : null}
          </CmSideCard>
        </CmSide>
      </CmColumns>
    </>
  );
}
