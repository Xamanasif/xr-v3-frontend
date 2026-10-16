'use client';

import { FORMAT_META, type FormatDelivery, inDisplayOrder, type Technology } from '@xr/domain';
import {
  BackLink,
  FormatBadge,
  Icon,
  Notice,
  PageContent,
  PageHeader,
  Section,
  SectionBody,
  StatusPill,
  Timeline,
  type TimelineEvent,
} from '@xr/ui';

import {
  firstPublishedWhat,
  liveSinceLine,
  PUBLISHED_PAGE,
  publishedOverline,
  updateInProgressLine,
  updateInProgressTitle,
  updateStartedNote,
  updateStartedWhat,
  versionReleasedNote,
  versionReleasedWhat,
} from '@/copy/cm-decision';
import { dayMonthYear } from '@/copy/dates';
import { experimentStatusWords, updateWords, wordsOf } from '@/copy/flow-state-words';
import { stateWords } from '@/copy/state-copy';
import {
  CONTENT_LIBRARY_ADDRESS,
  CONTENT_LIBRARY_TITLE,
  publishedExperimentPlacement,
} from '@/nav/content-manager';
import { usePlatformCourseCodes, usePublishedExperiment } from '@/queries/production';
import type { PublishedExperimentView } from '@/queries/production-cm-decision';

import { RecordGuard } from '../../shared/record-guard/record-guard';
import { useShellPage } from '../../shared/workspace-frame/shell-page';

/** The open update states CM-05 names (B6-08 script `open`: draft, returned, review, awaiting, hold). */
const OPEN_STATES = [
  'draft',
  'returned',
  'in-academic-review',
  'awaiting-release-decision',
  'on-hold',
] as const;
type OpenState = (typeof OPEN_STATES)[number];

function isOpenState(state: string): state is OpenState {
  return (OPEN_STATES as readonly string[]).includes(state);
}

/**
 * CM-05 Published experiment — board B6-08 f0 … f2, f4 and B6-11 f9, at
 * `/content-manager/published/[experimentId]`.
 *
 * - **Read**: `CorrectionService.getPublishedExperiment` — the live experiment (its live version,
 *   versions, outcomes), its one open correction if any; the course’s code and name from the
 *   platform course codes (`PlatformCourseCodeService.list`, CM-09’s read).
 * - **As B6-08 draws it** (`xr-wrap--read`): the back link “Content library”, “<code> ·
 *   Published · version <live>”, the name, “Published” and “Live since … · <organisation>”; the
 *   live catalogue details, the learning outcomes (the Academic Reviewer’s, read-only), the live
 *   delivery per format and the versions-and-updates history, newest first. Everything is
 *   read-only.
 * - **An update in progress** (f1, f2; B6-11 f9): the warn notice names it and its state, with
 *   the board’s line for that state; the history leads with it.
 * - **Phase 6, not built** (P0-35 / DEV-21; state-copy `CM-05.correction-entry`): the correction
 *   entry “Start a correction”, “Edit catalogue details”, “Edit delivery link” (CM-06, CM-07) and
 *   “Open update” (CM-08) are not rendered; nor is f3’s “Back from the correction” notice.
 */
export function PublishedExperiment({ experimentId }: { readonly experimentId: string }) {
  const read = usePublishedExperiment(experimentId);
  const codes = usePlatformCourseCodes();
  const view = read.data?.ok ? read.data.value : null;
  // The top bar names the destination below 1024 px (f1 … f4); the crumbs name the experiment.
  useShellPage({
    ...publishedExperimentPlacement(view ? view.experiment.live.catalogue.name : null),
    title: CONTENT_LIBRARY_TITLE,
  });
  const courses = codes.data?.ok ? codes.data.value : null;
  return (
    <PageContent wrap="read">
      <RecordGuard
        read={{
          data: codes.isPending ? undefined : read.data,
          isPending: read.isPending || codes.isPending,
          isError: read.isError || codes.isError,
          refetch: () => {
            void read.refetch();
            void codes.refetch();
          },
        }}
        loadingLabel={stateWords('CM-05.loading')}
        failed={{ title: stateWords('CM-05.failed'), line: stateWords('CM-05.failed.line') }}
      >
        {(page) => {
          const course = courses?.find((row) => row.course.id === page.experiment.courseId);
          return (
            <Published
              view={page}
              courseCode={course?.course.platformCode ?? null}
              courseName={course?.course.name ?? ''}
            />
          );
        }}
      </RecordGuard>
    </PageContent>
  );
}

/** A live value, or the register’s “—” where the record leaves it blank (`CM-05.empty-value`). */
function valueOf(text: string | null | undefined): string {
  return text && text.trim() !== '' ? text : stateWords('CM-05.empty-value');
}

/** The versions-and-updates history, newest first (state-copy `CM-05.history`). */
function historyOf(view: PublishedExperimentView, openWords: string | null): TimelineEvent[] {
  const { experiment, openUpdate } = view;
  const events: TimelineEvent[] = [];
  if (openUpdate && openWords) {
    events.push({
      id: openUpdate.id,
      what: updateStartedWhat(openUpdate.id, openWords),
      when: dayMonthYear(openUpdate.startedAt),
      note: updateStartedNote(openUpdate.versionLabel),
    });
  }
  const versions = [...experiment.versions].reverse();
  for (const version of versions) {
    const isLive = version.label === experiment.live.label;
    if (version.source.kind === 'correction-release') {
      events.push({
        id: `v-${version.label}`,
        what: versionReleasedWhat(version.label),
        when: dayMonthYear(version.liveFrom),
        note: versionReleasedNote(version.source.updateId, isLive),
      });
    } else {
      events.push({
        id: `v-${version.label}`,
        what: firstPublishedWhat(version.label),
        when: dayMonthYear(version.liveFrom),
        note: PUBLISHED_PAGE.firstPublicationNote,
      });
    }
  }
  return events;
}

function Published({
  view,
  courseCode,
  courseName,
}: {
  readonly view: PublishedExperimentView;
  readonly courseCode: string | null;
  readonly courseName: string;
}) {
  const { experiment, openUpdate } = view;
  const live = experiment.live;
  const course = courseCode ?? courseName;
  const openState: OpenState | null =
    openUpdate && isOpenState(openUpdate.state) ? openUpdate.state : null;
  const open = openUpdate && openState ? { id: openUpdate.id, state: openState } : null;
  const openWords = open ? wordsOf(updateWords(open.state, 'content_manager')) : null;
  const status = wordsOf(experimentStatusWords(experiment)) ?? '';
  const formats = inDisplayOrder(live.formats.map((entry) => entry.format));
  return (
    <>
      <PageHeader
        className="[margin:8px_0_16px]"
        back={<BackLink href={CONTENT_LIBRARY_ADDRESS}>{CONTENT_LIBRARY_TITLE}</BackLink>}
        overline={publishedOverline(course, live.label)}
        title={live.catalogue.name}
        meta={
          <>
            <StatusPill tone="ok">{status}</StatusPill>
            <span>{liveSinceLine(dayMonthYear(live.liveFrom), experiment.vendorOrganisation)}</span>
          </>
        }
      />
      <div className="flex flex-col gap-5">
        {open && openWords ? (
          <Notice tone="warn" role="status" title={updateInProgressTitle(open.id, openWords)}>
            {updateInProgressLine(open.state, live.label)}
          </Notice>
        ) : null}
        <p className="xl-meta m-0">{PUBLISHED_PAGE.changeLine}</p>
        <Section
          title={PUBLISHED_PAGE.catalogueTitle}
          meta={
            <>
              <Icon name="readOnly" size={16} />
              {PUBLISHED_PAGE.liveReadOnly}
            </>
          }
        >
          <SectionBody>
            <dl className="xl-kv xv-kv">
              <dt>{PUBLISHED_PAGE.name}</dt>
              <dd>{live.catalogue.name}</dd>
              <dt>{PUBLISHED_PAGE.course}</dt>
              <dd>{courseCode ? `${courseCode} · ${courseName}` : courseName}</dd>
              <dt>{PUBLISHED_PAGE.summary}</dt>
              <dd>{live.catalogue.summary}</dd>
              <dt>{PUBLISHED_PAGE.description}</dt>
              <dd>{live.catalogue.description}</dd>
              <dt>{PUBLISHED_PAGE.version}</dt>
              <dd>{live.label}</dd>
              <dt>{PUBLISHED_PAGE.formats}</dt>
              <dd>
                <span className="xv-chips">
                  {formats.map((format) => (
                    <FormatBadge key={format} format={FORMAT_META[format].code} compact />
                  ))}
                </span>
              </dd>
            </dl>
          </SectionBody>
        </Section>
        <Section title={PUBLISHED_PAGE.outcomesTitle} meta={PUBLISHED_PAGE.outcomesMeta}>
          <SectionBody>
            <ul className="xv-los">
              {experiment.learningOutcomes.map((outcome) => (
                <li key={outcome.id}>{outcome.text}</li>
              ))}
            </ul>
          </SectionBody>
        </Section>
        <Section
          title={PUBLISHED_PAGE.deliveryTitle}
          meta={
            <>
              <Icon name="readOnly" size={16} />
              {PUBLISHED_PAGE.liveReadOnly}
            </>
          }
        >
          <SectionBody className="flex flex-col gap-3">
            {formats.map((format) => {
              const delivery = live.formats.find((entry) => entry.format === format)?.delivery;
              return delivery ? (
                <Delivery key={format} format={format} delivery={delivery} />
              ) : null;
            })}
          </SectionBody>
        </Section>
        <Section title={PUBLISHED_PAGE.historyTitle} meta={PUBLISHED_PAGE.historyMeta}>
          <SectionBody>
            <Timeline events={historyOf(view, openWords)} markLatest={false} />
          </SectionBody>
        </Section>
      </div>
    </>
  );
}

/** One live format’s delivery (`div.xv-deliv`, B6-08 f0). */
function Delivery({
  format,
  delivery,
}: {
  readonly format: Technology;
  readonly delivery: FormatDelivery;
}) {
  return (
    <div className="xv-deliv">
      <div className="xv-deliv-head">
        <FormatBadge format={FORMAT_META[format].code} compact />
        <span className="font-[700]">
          {delivery.format === 'web' ? PUBLISHED_PAGE.webTitle : PUBLISHED_PAGE.packageTitle}
        </span>
      </div>
      <dl className="xl-kv xv-kv">
        {delivery.format === 'web' ? (
          <>
            <dt>{PUBLISHED_PAGE.webLink}</dt>
            <dd className="[overflow-wrap:anywhere]">{valueOf(delivery.webLink)}</dd>
            <dt>{PUBLISHED_PAGE.browser}</dt>
            <dd>{valueOf(delivery.browserAndComputer)}</dd>
          </>
        ) : (
          <>
            <dt>{PUBLISHED_PAGE.package}</dt>
            <dd>{valueOf(delivery.packageLabel)}</dd>
            <dt>{PUBLISHED_PAGE.packageReference}</dt>
            <dd>{valueOf(delivery.packageReference ?? delivery.packageFileName)}</dd>
            <dt>{PUBLISHED_PAGE.deviceNeeded}</dt>
            <dd>{valueOf(delivery.deviceNeeded)}</dd>
            <dt>{PUBLISHED_PAGE.installNotes}</dt>
            <dd>{valueOf(delivery.installNotes)}</dd>
          </>
        )}
      </dl>
    </div>
  );
}
