'use client';

import {
  type CorrectionEntry,
  FORMAT_META,
  type FormatDelivery,
  inDisplayOrder,
  type Technology,
} from '@xr/domain';
import {
  BackLink,
  Button,
  FormatBadge,
  Icon,
  Link,
  Notice,
  PageContent,
  PageHeader,
  Section,
  SectionBody,
  StatusPill,
  Timeline,
  type TimelineEvent,
} from '@xr/ui';
import { useEffect, useState } from 'react';

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
import { BACK_FROM_CORRECTION, CORRECTION_ENTRY } from '@/copy/cm-correction';
import { dayMonthYear } from '@/copy/dates';
import { experimentStatusWords, updateWords, wordsOf } from '@/copy/flow-state-words';
import { stateWords } from '@/copy/state-copy';
import {
  CONTENT_LIBRARY_ADDRESS,
  CONTENT_LIBRARY_TITLE,
  type CorrectionFocus,
  correctionAddress,
  publishedExperimentPlacement,
} from '@/nav/content-manager';
import { useAppNavigation } from '@/nav/navigation';
import { usePlatformCourseCodes, usePublishedExperiment } from '@/queries/production';
import type { PublishedExperimentView } from '@/queries/production-cm-decision';
import { useCommand } from '@/queries/use-command';

import { RecordGuard } from '../../shared/record-guard/record-guard';
import { noteRouteFocus } from '../../shared/workspace-frame/route-focus';
import { useShellPage } from '../../shared/workspace-frame/shell-page';
import {
  backFromCorrectionFor,
  forgetBackFromCorrection,
  useCorrectionSessionKey,
} from '../cm-08-updates/correction-draft';
import { correctionFocusTarget } from '../cm-08-updates/correction-view';

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
 * CM-05 Published experiment — board B6-08 f0 … f4, B6-11 f9, B6-13 f1 and B7-11 f4, at
 * `/content-manager/published/[experimentId]`.
 *
 * - **Read**: `CorrectionService.getPublishedExperiment` — the live experiment (its live version,
 *   versions, outcomes), its one open correction if any; the course’s code and name from the
 *   platform course codes (`PlatformCourseCodeService.list`, CM-09’s read).
 * - **As B6-08 draws it** (`xr-wrap--read`): the back link “Content library”, “<code> ·
 *   Published · version <live>”, the name, “Published” and “Live since … · <organisation>”; the
 *   live catalogue details, the learning outcomes (the Academic Reviewer’s, read-only), the live
 *   delivery per format and the versions-and-updates history, newest first. Everything is
 *   read-only: “Every change opens a correction draft.”
 * - **The correction entry** (f0, f4; B6-13 f1): “Start a correction” (the primary), “Edit
 *   catalogue details” (CM-06) and “Edit delivery link” (CM-07) each ask the service to open the
 *   one correction draft — or to join it — and open the update’s page with the field they name
 *   focused (state-copy `CM-05.entry-opens`). Never a second update: the service decides.
 * - **An update in progress** (f1, f2; B6-11 f9; B7-11 f4): the warn notice names it and its
 *   state; while it is a draft or returned the entries join it — “Open update” and the two edit
 *   entries (f2) — and while it is with the Academic Reviewer or the Super Admin only “Open update”
 *   is offered, in the notice (f1). The history leads with it.
 * - **Back from the correction** (f3): the info notice once, after “Back to the published
 *   experiment” on an open update (state-copy `CM-05.back-from-correction`; memory only).
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
              key={page.experiment.id}
              view={page}
              courseCode={course?.course.platformCode ?? null}
              courseName={course?.course.name ?? ''}
              onReread={() => void read.refetch()}
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

/** A refused or failed entry, as the page says it (state-copy `CM-05.entry-*`). */
type EntryNotice = 'refused' | 'unavailable';

function Published({
  view,
  courseCode,
  courseName,
  onReread,
}: {
  readonly view: PublishedExperimentView;
  readonly courseCode: string | null;
  readonly courseName: string;
  readonly onReread: () => void;
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
  // B6-08 `canJoin`: a draft or returned update is joined by the edit entries; any other open
  // update offers only “Open update” (`lockProg`).
  const joinable = open !== null && (open.state === 'draft' || open.state === 'returned');

  const navigation = useAppNavigation();
  const sessionKey = useCorrectionSessionKey();
  // f3: once, after “Back to the published experiment” (read while the page first renders).
  const [back] = useState(() => backFromCorrectionFor(sessionKey, experiment.id));
  useEffect(() => forgetBackFromCorrection(sessionKey, experiment.id), [sessionKey, experiment.id]);

  const openCmd = useCommand((ports) => ports.corrections.openCorrection);
  const [pending, setPending] = useState<CorrectionEntry | null>(null);
  const [entryNotice, setEntryNotice] = useState<EntryNotice | null>(null);

  /** Opens or joins the one draft, then its page — the named field focused (CM-06, CM-07). */
  const enter = (entry: CorrectionEntry, focus: CorrectionFocus | null) => {
    if (openCmd.busy) return;
    setEntryNotice(null);
    setPending(entry);
    openCmd.run({ experimentId: experiment.id, entry }).then(
      (answer) => {
        setPending(null);
        if (!answer.ok) {
          // The page is read again and shows what the experiment is now; a refused entry (an
          // update already open and no longer joinable) also says so (`CM-05.entry-refused`).
          if (answer.error.kind === 'refused') setEntryNotice('refused');
          onReread();
          return;
        }
        const id = answer.value.update.id;
        const target = correctionFocusTarget(focus, experiment);
        if (target) noteRouteFocus(correctionAddress(id), target);
        navigation.navigate(correctionAddress(id, focus));
      },
      () => {
        setPending(null);
        setEntryNotice('unavailable');
      },
    );
  };

  const entryButton = (
    entry: CorrectionEntry,
    focus: CorrectionFocus | null,
    variant: 'primary' | 'secondary',
    label: string,
  ) => (
    <Button
      variant={variant}
      busy={pending === entry}
      busyLabel={stateWords('CM-05.entry-busy')}
      onClick={() => enter(entry, focus)}
    >
      {label}
    </Button>
  );
  const editEntries = (
    <>
      {entryButton(
        'edit-catalogue-details',
        'summary',
        'secondary',
        CORRECTION_ENTRY.editCatalogue,
      )}
      {entryButton('edit-delivery-link', 'web-link', 'secondary', CORRECTION_ENTRY.editDelivery)}
    </>
  );

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
        {back ? (
          <Notice tone="info" role="status" title={BACK_FROM_CORRECTION.title}>
            {BACK_FROM_CORRECTION.line}
          </Notice>
        ) : null}
        {open && openWords ? (
          <Notice
            tone="warn"
            role="status"
            title={updateInProgressTitle(open.id, openWords)}
            actions={
              joinable ? undefined : (
                <Link
                  className="xr-btn xr-btn--primary xr-btn--sm"
                  href={correctionAddress(open.id)}
                >
                  {CORRECTION_ENTRY.openUpdate}
                </Link>
              )
            }
          >
            {updateInProgressLine(open.state, live.label)}
          </Notice>
        ) : null}
        {entryNotice ? (
          <Notice tone={entryNotice === 'refused' ? 'warn' : 'err'} role="alert">
            {stateWords(
              entryNotice === 'refused' ? 'CM-05.entry-refused' : 'CM-05.entry-unavailable',
            )}
          </Notice>
        ) : null}
        {open === null ? (
          <div className="xw-actions">
            {entryButton('start-a-correction', null, 'primary', CORRECTION_ENTRY.start)}
            {editEntries}
          </div>
        ) : joinable ? (
          <div className="xw-actions">
            <Link className="xr-btn xr-btn--primary" href={correctionAddress(open.id)}>
              {CORRECTION_ENTRY.openUpdate}
            </Link>
            {editEntries}
          </div>
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
