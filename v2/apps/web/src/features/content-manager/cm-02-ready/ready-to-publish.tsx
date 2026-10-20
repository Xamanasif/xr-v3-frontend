'use client';

import type { libraryOutput, Out, readyToPublishOutput } from '@xr/contracts/draft';
import {
  Button,
  ButtonLink,
  CmColumns,
  CmCourseName,
  type CmDecisionCard,
  CmDecisionCards,
  CmFeed,
  type CmFeedItem,
  CmLoadingCards,
  CmPageHead,
  CmQueueToolbar,
  CmSays,
  CmSide,
  CmSideCard,
  FormatBadges,
  type Figure,
  ListState,
  Surface,
  TextLink,
} from '@xr/ui/v3';
import { useRef, useState } from 'react';

import {
  cardAge,
  cardByLine,
  cardIdLine,
  cardSummary,
  daysWaiting,
  formatsLabel,
  latestWords,
  LIST_FAILED,
  longestWaitTitle,
  OPEN_DECISION,
  OPEN_LIBRARY,
  openDecisionLabel,
  READY_TO_PUBLISH,
  readyCountWords,
  readyListLabel,
  readySortWords,
  waitingDetail,
} from '@/copy/cm-lists';
import {
  publicationDecisionAddress,
  READY_TO_PUBLISH_TITLE,
  readyToPublishPlacement,
} from '@/nav/content-manager';
import { useContentLibrary, usePlatformCourseCodes, useReadyToPublish } from '@/queries/production';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { lastApproval } from '../shared/records';
import { formatCodes, libraryViewAddress, useToday } from './list-facts';

/** One approved submission, its approval and the service’s publication check. */
export type ReadyRow = Out<typeof readyToPublishOutput>[number];
type Library = Out<typeof libraryOutput>;

/** The conditions of a row’s publication check that are not met, in the service’s order. */
export function openChecks(check: ReadyRow['check']) {
  return check.filter((item) => !item.ok).map((item) => item.check);
}

const TITLE_ID = 'cm-h-ready';
const DOES_ID = 'cm-q-does';
const LATEST_ID = 'cm-q-latest';
const SAYS_ICONS = { lists: 'readyToPublish', access: 'lock', updates: 'updates' } as const;

/**
 * The three latest changes to the catalogue (the export's `readyVM` `latest`): each published
 * experiment's live version — its first publication or the correction that released it — newest
 * first, then by name.
 */
export function latestInCatalogue(library: Library | null): CmFeedItem[] {
  if (!library) return [];
  return library.rows
    .flatMap((row) => (row.kind === 'experiment' ? [row.experiment] : []))
    .map((experiment) => ({
      name: experiment.live.catalogue.name,
      at: experiment.live.liveFrom,
      item: {
        key: experiment.id,
        title: experiment.live.catalogue.name,
        detail: latestWords(
          experiment.live.label,
          experiment.live.liveFrom,
          experiment.live.source.kind,
        ),
      },
    }))
    .sort((a, b) => (a.at === b.at ? a.name.localeCompare(b.name) : a.at < b.at ? 1 : -1))
    .slice(0, 3)
    .map(({ item }) => item);
}

/**
 * CM-02 Ready to publish — the V3 Refined B design (the owner-approved export
 * design/v3-refined-b/roles/CM-v1, `Main.dc.html` CM-02 and `readyVM`), at
 * `/content-manager/ready`.
 *
 * - **Read**: `ProductionService.listReadyToPublish` — every submission the Academic Reviewer
 *   approved that is with the Content Manager, with its approval and the service’s publication
 *   check (the rail counts the same read); the platform course codes name each card's course; the
 *   library's Published view gives the latest changes to the catalogue (side card).
 * - **As the export draws it**: the head with its figures (waiting for you, the longest wait); one
 *   decision card per submission — days waiting (to today on the session clock), name, ID,
 *   vendor, course, formats, who approved it and its outcomes, the four checks and the summary,
 *   Open decision (CM-03). Oldest first, or newest first by the sort button; the longest wait is
 *   marked "Waiting longest" and has the gold button either way (state-copy `CM-02.order`). Below
 *   600 px a card keeps only the checks not met. Beside it: what publishing does, the latest in
 *   the catalogue.
 * - **States**: empty (with Open the Content library), loading (cards' skeleton; no figures, no
 *   count), couldn't load (Try again reads again and moves focus to the title).
 * - Nothing here changes a record: the decision is made on CM-03.
 */
export function ReadyToPublish() {
  useShellPage(readyToPublishPlacement());
  const today = useToday();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const read = useReadyToPublish();
  const courses = usePlatformCourseCodes();
  const library = useContentLibrary({ tab: 'published', search: '' });
  const [newest, setNewest] = useState(false);
  const rows = read.data?.ok ? read.data.value : null;
  const failed = read.isError || (read.data !== undefined && !read.data.ok);

  const courseOf = (courseId: string | null) =>
    (courses.data?.ok
      ? courses.data.value.find((row) => row.course.id === courseId)?.course
      : undefined) ?? null;

  const retry = () => {
    void read.refetch();
    titleRef.current?.focus();
  };

  // The service answers oldest approval first; the longest wait is its first row.
  const oldest = rows?.[0] ?? null;
  const shown = rows ? (newest ? [...rows].reverse() : rows) : [];
  const days = (row: ReadyRow) => (today.instant ? daysWaiting(row.approvedAt, today.instant) : 0);
  const blocked = rows ? rows.filter((row) => openChecks(row.check).length > 0).length : 0;
  const longest = oldest ? days(oldest) : 0;
  const figures: Figure[] =
    rows && rows.length > 0 && oldest
      ? [
          {
            title: READY_TO_PUBLISH.waiting,
            value: rows.length,
            details: [waitingDetail(blocked)],
          },
          {
            title: longestWaitTitle(longest),
            value: longest,
            details: [oldest.submission.content.name],
          },
        ]
      : [];

  const cards: CmDecisionCard[] = shown.map((row) => {
    const { submission } = row;
    const name = submission.content.name;
    const first = row === oldest;
    const course = courseOf(submission.content.courseId);
    const codes = formatCodes(submission.content.formats);
    const open = openChecks(row.check).length;
    return {
      key: submission.id,
      first,
      firstLabel: READY_TO_PUBLISH.firstLabel,
      age: cardAge(days(row), row.approvedAt),
      name,
      idLine: cardIdLine(submission.id, submission.vendorOrganisation, submission.revision),
      meta: (
        <>
          {course ? <CmCourseName code={course.platformCode} name={course.name} /> : null}
          <FormatBadges formats={codes} label={formatsLabel(codes)} />
        </>
      ),
      byLine: cardByLine(
        row.approvedBy || (lastApproval(submission)?.by ?? ''),
        submission.learningOutcomes.length,
      ),
      checks: row.check.map((check) => ({
        key: check.check,
        label: READY_TO_PUBLISH.checks[check.check],
        met: check.ok,
        stateWords: check.ok ? READY_TO_PUBLISH.met : READY_TO_PUBLISH.notMet,
      })),
      summary: { text: cardSummary(open, row.check.length), met: open === 0 },
      action: {
        href: publicationDecisionAddress(submission.id),
        label: OPEN_DECISION,
        accessibleName: openDecisionLabel(name),
        primary: first,
      },
    };
  });
  const sort = readySortWords(newest);
  const latest = latestInCatalogue(library.data?.ok ? library.data.value : null);

  return (
    <>
      <CmPageHead
        title={READY_TO_PUBLISH_TITLE}
        titleId={TITLE_ID}
        titleRef={titleRef}
        date={today.line}
        lead={READY_TO_PUBLISH.lead}
        figures={figures}
        figuresLabel={READY_TO_PUBLISH.figuresLabel}
      />
      <CmColumns>
        <Surface label={READY_TO_PUBLISH.surfaceLabel}>
          {failed ? (
            <ListState
              kind="failed"
              roomy
              titleAs="h2"
              title={READY_TO_PUBLISH.failed}
              action={<Button onClick={retry}>{LIST_FAILED.retry}</Button>}
            >
              {LIST_FAILED.line}
            </ListState>
          ) : rows === null ? (
            <CmLoadingCards message={READY_TO_PUBLISH.loading} />
          ) : rows.length === 0 ? (
            <ListState
              kind="empty"
              roomy
              icon="readyToPublish"
              titleAs="h2"
              title={READY_TO_PUBLISH.emptyTitle}
              action={<ButtonLink href={libraryViewAddress('ready')}>{OPEN_LIBRARY}</ButtonLink>}
            >
              {READY_TO_PUBLISH.emptyLine}
            </ListState>
          ) : (
            <>
              <CmQueueToolbar
                count={readyCountWords(rows.length)}
                sort={{
                  long: sort.long,
                  short: sort.short,
                  direction: newest ? 'desc' : 'asc',
                  onToggle: () => setNewest((current) => !current),
                }}
              />
              <CmDecisionCards
                label={readyListLabel(newest)}
                checksLabel={READY_TO_PUBLISH.checksLabel}
                cards={cards}
              />
            </>
          )}
        </Surface>
        <CmSide label={READY_TO_PUBLISH.side.label}>
          <CmSideCard ivory titleId={DOES_ID} title={READY_TO_PUBLISH.side.does}>
            <CmSays
              items={READY_TO_PUBLISH.side.says.map((point) => ({
                key: point.key,
                icon: SAYS_ICONS[point.key],
                title: point.title,
                children: point.line,
              }))}
            />
          </CmSideCard>
          <CmSideCard
            titleId={LATEST_ID}
            title={READY_TO_PUBLISH.side.latest}
            foot={<TextLink href={libraryViewAddress('published')}>{OPEN_LIBRARY}</TextLink>}
          >
            <CmFeed
              items={latest}
              empty={library.data?.ok ? READY_TO_PUBLISH.side.nothing : undefined}
            />
          </CmSideCard>
        </CmSide>
      </CmColumns>
    </>
  );
}
